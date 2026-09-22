begin;
alter table public.retail_relationships add column nutrition_client_id uuid references public.clients(id) on delete set null;
-- Current state is read from the same app profile used by existing retail publishing.
-- The editor carries the explicit client id and snapshot back on every write.
create function private.retail_nutrition_state(rid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c public.clients%rowtype; r public.retail_relationships%rowtype; result jsonb;
begin
 select * into r from public.retail_relationships where id=rid;
 if auth.uid() is null or not private.retail_customer_access(rid) or not private.retail_active(rid) then raise exception 'Customer unavailable';end if;
 if auth.uid()<>r.profile_id and not coalesce(r.share_app_records,false) then raise exception 'Customer must enable app record sharing to view current targets';end if;
 select * into c from public.clients where profile_id=r.profile_id and (r.nutrition_client_id is null or id=r.nutrition_client_id) order by created_at,id limit 1;
 if c.id is null then raise exception 'Customer must finish setting up their user profile';end if;
 result:=jsonb_build_object('client_id',c.id,'targets',jsonb_build_object('calories',c.goal_calories,'protein',c.goal_protein,'carbs',c.goal_carbs,'fat',c.goal_fat),'active_plan_id',c.active_meal_plan_id);
 return result||jsonb_build_object('version',md5(result::text),'active_plan_name',(select plan_name from public.meal_plans where id=c.active_meal_plan_id));
end$$;
revoke all on function private.retail_nutrition_state(uuid) from public,anon;
grant execute on function private.retail_nutrition_state(uuid) to authenticated;
create function public.retail_nutrition_state(rid uuid) returns jsonb language sql security invoker set search_path='' as $$select private.retail_nutrition_state(rid);$$;
revoke all on function public.retail_nutrition_state(uuid) from public,anon;
grant execute on function public.retail_nutrition_state(uuid) to authenticated;

create function private.retail_assert_nutrition(rid uuid, targets jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare c public.clients%rowtype; state jsonb;
begin
 if auth.uid() is null or not private.retail_customer_access(rid,true) or not private.retail_active(rid) then raise exception 'Active customer and authorized staff required';end if;
 select c1.* into c from public.clients c1 join public.retail_relationships r on r.profile_id=c1.profile_id where r.id=rid and c1.id=nullif(targets->>'_client_id','')::uuid for update of c1;
 if c.id is null then raise exception 'Reload current targets before saving';end if;
 state:=private.retail_nutrition_state(rid);
 if state->>'client_id' is distinct from targets->>'_client_id' then raise exception 'Customer app profile changed. Reload before saving';end if;
 state:=jsonb_build_object('client_id',c.id,'targets',jsonb_build_object('calories',c.goal_calories,'protein',c.goal_protein,'carbs',c.goal_carbs,'fat',c.goal_fat),'active_plan_id',c.active_meal_plan_id);
 state:=state||jsonb_build_object('version',md5(state::text));
 if state->>'client_id' is distinct from targets->>'_client_id' or state->>'version' is distinct from targets->>'_version' then raise exception 'Nutrition changed since you opened this editor. Reload and review current targets before saving';end if;
 update public.retail_relationships set nutrition_client_id=c.id where id=rid and nutrition_client_id is null;
 return c.id;
end$$;
revoke all on function private.retail_assert_nutrition(uuid,jsonb) from public,anon,authenticated;
create or replace function private.retail_publish_nutrition(rid uuid,request_id uuid,plan_name text,days jsonb,targets jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare cid uuid; pid uuid; d jsonb; foods jsonb; f jsonb; k text; v numeric; existing public.meal_plans%rowtype;
begin
 if auth.uid() is null or not private.retail_customer_access(rid,true) or not private.retail_active(rid) then raise exception 'Active customer and authorized store staff required';end if;
 select profile_id into pid from public.retail_relationships where id=rid;

 if request_id is null then raise exception 'Request ID required';end if;
 select * into existing from public.meal_plans where id=request_id;
 if found then
  if existing.retail_relationship_id=rid then return request_id;end if;
  raise exception 'Plan ID unavailable';
 end if;
 cid:=private.retail_assert_nutrition(rid,targets);
 if plan_name is null or length(trim(plan_name)) not between 1 and 120 or jsonb_typeof(days) is distinct from 'array' or jsonb_array_length(days) not between 1 and 14 then raise exception 'Provide a plan name and 1–14 days';end if;
 if pg_column_size(days)>250000 then raise exception 'Plan is too large';end if;
 foreach k in array array['calories','protein','carbs','fat'] loop
  if coalesce(targets->>k,'')!~'^[0-9]+(\.[0-9]+)?$' then raise exception 'All daily targets are required';end if;
  v:=(targets->>k)::numeric;
  if v<0 or v>(case when k='calories' then 20000 else 2000 end) or (k='calories' and v=0) then raise exception 'Target out of range';end if;
 end loop;
 for d in select value from jsonb_array_elements(days) loop
  if jsonb_typeof(d->'meals') is distinct from 'object' or length(coalesce(d->>'label',''))>100 then raise exception 'Invalid day';end if;
  for k,foods in select key,value from jsonb_each(d->'meals') loop
   if k not in ('Breakfast','Lunch','Dinner','Snack') or jsonb_typeof(foods) is distinct from 'array' or jsonb_array_length(foods)>40 then raise exception 'Invalid meal';end if;
   for f in select value from jsonb_array_elements(foods) loop
    if length(trim(coalesce(f->>'name',''))) not between 1 and 200 then raise exception 'Food name required';end if;
    if length(coalesce(f->>'servingUnit',''))>40 then raise exception 'Invalid serving unit';end if;
    if f->>'servingSize' is not null then
     if (f->>'servingSize')!~'^[0-9]+(\.[0-9]+)?$' then raise exception 'Invalid serving size';end if;
     if (f->>'servingSize')::numeric<=0 or (f->>'servingSize')::numeric>100000 then raise exception 'Invalid serving size';end if;
    end if;
    foreach k in array array['calories','protein','carbs','fat','quantity'] loop
     if coalesce(f->>k,'')!~'^[0-9]+(\.[0-9]+)?$' then raise exception 'Invalid food amount';end if;
     if (f->>k)::numeric>20000 or (k='quantity' and (f->>k)::numeric<=0) then raise exception 'Food amount out of range';end if;
    end loop;
   end loop;
  end loop;
 end loop;
 insert into public.meal_plans(id,client_id,plan_name,days,created_at,retail_relationship_id,retail_targets) values(request_id,cid,trim(plan_name),days,now(),rid,targets - '_client_id' - '_version');
 update public.clients set active_meal_plan_id=request_id,goal_calories=(targets->>'calories')::numeric,goal_protein=(targets->>'protein')::numeric,goal_carbs=(targets->>'carbs')::numeric,goal_fat=(targets->>'fat')::numeric where id=cid;
 insert into public.retail_notifications(relationship_id,body,dedupe_key) values(rid,'Your store updated your meal plan and daily nutrition targets.',request_id||':nutrition');
 insert into public.retail_audit(location_id,actor_id,action,subject_id) select location_id,auth.uid(),'publish_nutrition',request_id from public.retail_relationships where id=rid;
 return request_id;
end$$;
create or replace function private.retail_set_targets(rid uuid,targets jsonb) returns void language plpgsql security definer set search_path='' as $$
declare k text; v numeric; cid uuid;
begin
 if auth.uid() is null or not private.retail_customer_access(rid,true) or not private.retail_active(rid) then raise exception 'Active customer and authorized store staff required';end if;
 foreach k in array array['calories','protein','carbs','fat'] loop
  if coalesce(targets->>k,'')!~'^[0-9]+(\.[0-9]+)?$' then raise exception 'All daily targets are required';end if;
  v:=(targets->>k)::numeric;
  if v<0 or v>(case when k='calories' then 20000 else 2000 end) or (k='calories' and v=0) then raise exception 'Target out of range';end if;
 end loop;
 cid:=private.retail_assert_nutrition(rid,targets);
 update public.clients set goal_calories=(targets->>'calories')::numeric,goal_protein=(targets->>'protein')::numeric,goal_carbs=(targets->>'carbs')::numeric,goal_fat=(targets->>'fat')::numeric where id=cid;
 insert into public.retail_audit(location_id,actor_id,action,subject_id) select location_id,auth.uid(),'update_nutrition_targets',cid from public.retail_relationships where id=rid;
end$$;

-- Guidance publications retain their historical snapshot without mutating live app targets.
drop trigger if exists retail_plan_targets on public.retail_plans;
-- New conversations inherit the relationship specialist unless explicitly assigned.
create function private.retail_default_thread_owner() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.assigned_to is null then select assigned_to into new.assigned_to from public.retail_relationships where id=new.relationship_id;end if;
 return new;
end$$;
revoke all on function private.retail_default_thread_owner() from public,anon,authenticated;
create trigger retail_default_thread_owner before insert on public.retail_threads for each row execute function private.retail_default_thread_owner();
commit;
