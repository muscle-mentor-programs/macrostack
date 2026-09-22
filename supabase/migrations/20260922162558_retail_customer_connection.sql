begin;
-- A valid random invitation token is required; no email-based account lookup.
create function private.retail_customer_invitation(invite_token uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('email',i.email,'has_account',exists(select 1 from auth.users u where lower(u.email)=lower(i.email)), 'store',l.name,'brand',coalesce(o.brand_name,o.name),'logo_path',o.logo_path,'accepted',i.accepted_at is not null)
 from public.retail_invitations i join public.retail_locations l on l.id=i.location_id join public.retail_organizations o on o.id=i.organization_id
 where i.token=invite_token and i.role='customer' and i.expires_at>now() and l.enabled and o.enabled;
$$;
create function public.retail_customer_invitation(invite_token uuid) returns jsonb language sql stable security invoker set search_path='' as $$select private.retail_customer_invitation(invite_token);$$;
revoke all on function private.retail_customer_invitation(uuid),public.retail_customer_invitation(uuid) from public;
grant execute on function private.retail_customer_invitation(uuid),public.retail_customer_invitation(uuid) to anon,authenticated;
alter table public.meal_plans add column retail_relationship_id uuid references public.retail_relationships(id), add column retail_targets jsonb;
create policy retail_authored_plans_read on public.meal_plans for select to authenticated using(retail_relationship_id is not null and private.retail_customer_access(retail_relationship_id,true) and private.retail_active(retail_relationship_id));
create function private.retail_publish_nutrition(rid uuid,request_id uuid,plan_name text,days jsonb,targets jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare cid uuid; pid uuid; d jsonb; foods jsonb; f jsonb; k text; v numeric; existing public.meal_plans%rowtype;
begin
 if auth.uid() is null or not private.retail_customer_access(rid,true) or not private.retail_active(rid) then raise exception 'Active customer and authorized store staff required';end if;
 select profile_id into pid from public.retail_relationships where id=rid;
 select id into cid from public.clients where profile_id=pid order by created_at,id limit 1 for update;
 if cid is null then raise exception 'Customer must finish setting up their user profile';end if;
 if request_id is null then raise exception 'Request ID required';end if;
 select * into existing from public.meal_plans where id=request_id;
 if found then
  if existing.retail_relationship_id=rid then return request_id;end if;
  raise exception 'Plan ID unavailable';
 end if;
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
 insert into public.meal_plans(id,client_id,plan_name,days,created_at,retail_relationship_id,retail_targets) values(request_id,cid,trim(plan_name),days,now(),rid,targets);
 update public.clients set active_meal_plan_id=request_id,goal_calories=(targets->>'calories')::numeric,goal_protein=(targets->>'protein')::numeric,goal_carbs=(targets->>'carbs')::numeric,goal_fat=(targets->>'fat')::numeric where id=cid;
 insert into public.retail_notifications(relationship_id,body,dedupe_key) values(rid,'Your store updated your meal plan and daily nutrition targets.',request_id||':nutrition');
 insert into public.retail_audit(location_id,actor_id,action,subject_id) select location_id,auth.uid(),'publish_nutrition',request_id from public.retail_relationships where id=rid;
 return request_id;
end$$;
create function public.retail_publish_nutrition(rid uuid,request_id uuid,plan_name text,days jsonb,targets jsonb) returns uuid language sql security invoker set search_path='' as $$select private.retail_publish_nutrition(rid,request_id,plan_name,days,targets);$$;
revoke all on function private.retail_publish_nutrition(uuid,uuid,text,jsonb,jsonb),public.retail_publish_nutrition(uuid,uuid,text,jsonb,jsonb) from public,anon;
grant execute on function private.retail_publish_nutrition(uuid,uuid,text,jsonb,jsonb),public.retail_publish_nutrition(uuid,uuid,text,jsonb,jsonb) to authenticated;

create function private.retail_set_targets(rid uuid,targets jsonb) returns void language plpgsql security definer set search_path='' as $$
declare k text; v numeric; cid uuid;
begin
 if auth.uid() is null or not private.retail_customer_access(rid,true) or not private.retail_active(rid) then raise exception 'Active customer and authorized store staff required';end if;
 foreach k in array array['calories','protein','carbs','fat'] loop
  if coalesce(targets->>k,'')!~'^[0-9]+(\.[0-9]+)?$' then raise exception 'All daily targets are required';end if;
  v:=(targets->>k)::numeric;
  if v<0 or v>(case when k='calories' then 20000 else 2000 end) or (k='calories' and v=0) then raise exception 'Target out of range';end if;
 end loop;
 select c.id into cid from public.clients c join public.retail_relationships r on r.profile_id=c.profile_id where r.id=rid order by c.created_at,c.id limit 1 for update of c;
 if cid is null then raise exception 'Customer must finish setting up their user profile';end if;
 update public.clients set goal_calories=(targets->>'calories')::numeric,goal_protein=(targets->>'protein')::numeric,goal_carbs=(targets->>'carbs')::numeric,goal_fat=(targets->>'fat')::numeric where id=cid;
 insert into public.retail_audit(location_id,actor_id,action,subject_id) select location_id,auth.uid(),'update_nutrition_targets',cid from public.retail_relationships where id=rid;
end$$;
create function public.retail_set_targets(rid uuid,targets jsonb) returns void language sql security invoker set search_path='' as $$select private.retail_set_targets(rid,targets);$$;
revoke all on function private.retail_set_targets(uuid,jsonb),public.retail_set_targets(uuid,jsonb) from public,anon;
grant execute on function private.retail_set_targets(uuid,jsonb),public.retail_set_targets(uuid,jsonb) to authenticated;
-- Publishing the existing consultation plan also carries its supplied targets into the user app.
create function private.retail_sync_published_targets() returns trigger language plpgsql security definer set search_path='' as $$
declare cid uuid;
begin
 select c.id into cid from public.clients c join public.retail_relationships r on r.profile_id=c.profile_id where r.id=new.relationship_id order by c.created_at,c.id limit 1;
 if cid is not null then
 update public.clients set
 goal_calories=coalesce(nullif(new.content->>'calories','')::numeric,goal_calories),
 goal_protein=coalesce(nullif(new.content->>'protein','')::numeric,goal_protein),
 goal_carbs=coalesce(nullif(new.content->>'carbs','')::numeric,goal_carbs),
 goal_fat=coalesce(nullif(new.content->>'fat','')::numeric,goal_fat) where id=cid;
 end if;
 return new;
end$$;
revoke all on function private.retail_sync_published_targets() from public,anon,authenticated;
create trigger retail_plan_targets after insert on public.retail_plans for each row execute function private.retail_sync_published_targets();

create function private.retail_customer_unread() returns bigint language sql stable security definer set search_path='' as $$
 select count(*) from public.retail_messages m join public.retail_relationships r on r.id=m.relationship_id where r.profile_id=auth.uid() and r.status='active' and private.retail_active(r.id) and m.author_id<>auth.uid() and m.created_at>coalesce((select read_at from public.retail_read_receipts where relationship_id=r.id and user_id=auth.uid()),'-infinity'::timestamptz);
$$;
create function public.retail_customer_unread() returns bigint language sql stable security invoker set search_path='' as $$select private.retail_customer_unread();$$;
revoke all on function private.retail_customer_unread(),public.retail_customer_unread() from public,anon;
grant execute on function private.retail_customer_unread(),public.retail_customer_unread() to authenticated;
commit;
