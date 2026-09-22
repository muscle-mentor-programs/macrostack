begin;
create or replace function private.retail_app_records(rid uuid,kind text,page_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid uuid; shared boolean; rows jsonb;
begin
 if not private.retail_customer_access(rid) or not private.retail_active(rid) then raise exception 'Customer unavailable';end if;
 select profile_id,(profile_id=auth.uid() or case when kind in ('foods','weights') then share_activity or share_app_records else share_app_records end) into pid,shared from public.retail_relationships where id=rid and status='active';
 if pid is null or not coalesce(shared,false) then return jsonb_build_object('shared',false,'rows','[]'::jsonb);end if;
 if page_offset<0 or page_offset>1000000 then raise exception 'Invalid page';end if;
 if kind='profile' then
 select coalesce(jsonb_agg(x),'[]') into rows from (select c.id,c.name,c.height,c.dob,c.phone,c.bio,c.goal_calories,c.goal_protein,c.goal_carbs,c.goal_fat,c.active_meal_plan_id from public.clients c where c.profile_id=pid order by c.created_at,c.id limit 50 offset page_offset)x;
 elsif kind='foods' then
 select coalesce(jsonb_agg(x),'[]') into rows from (select f.id,f.date,f.name,f.meal,f.quantity,f.serving_unit,f.calories,f.protein,f.carbs,f.fat from public.food_log f join public.clients c on c.id=f.client_id where c.profile_id=pid order by f.date desc,f.id limit 50 offset page_offset)x;
 elsif kind='weights' then
 select coalesce(jsonb_agg(x),'[]') into rows from (select w.id,w.date,w.value,w.unit from public.weight_log w join public.clients c on c.id=w.client_id where c.profile_id=pid order by w.date desc,w.id limit 50 offset page_offset)x;
 elsif kind='photos' then
 select coalesce(jsonb_agg(x),'[]') into rows from (select p.id,p.path,p.note,p.taken_at from public.progress_photos p join public.clients c on c.id=p.client_id where c.profile_id=pid order by p.taken_at desc,p.id limit 50 offset page_offset)x;
 elsif kind='plans' then
 select coalesce(jsonb_agg(x),'[]') into rows from (select p.id,p.plan_name,p.days,p.created_at,(p.retail_relationship_id=rid) can_remove,(p.id=c.active_meal_plan_id) active from public.meal_plans p join public.clients c on c.id=p.client_id where c.profile_id=pid order by p.created_at desc,p.id limit 50 offset page_offset)x;
 elsif kind='checkins' then
 select coalesce(jsonb_agg(x),'[]') into rows from (select p.id,p.weight,p.weight_unit,p.adherence,p.hunger,p.energy,p.notes,p.answers,p.created_at from public.checkins p join public.clients c on c.id=p.client_id where c.profile_id=pid order by p.created_at desc,p.id limit 50 offset page_offset)x;
 elsif kind='forms' then
 select coalesce(jsonb_agg(x),'[]') into rows from (select p.id,p.form_title,p.form_kind,p.answers,p.created_at from public.form_submissions p join public.clients c on c.id=p.client_id where c.profile_id=pid order by p.created_at desc,p.id limit 50 offset page_offset)x;
 elsif kind='schedules' then
 select coalesce(jsonb_agg(x),'[]') into rows from (select p.id,p.apply_on,p.calories,p.protein,p.carbs,p.fat,p.applied from public.target_schedules p join public.clients c on c.id=p.client_id where c.profile_id=pid order by p.apply_on desc,p.id limit 50 offset page_offset)x;
 else raise exception 'Unknown record type';end if;
 return jsonb_build_object('shared',true,'rows',rows,'has_more',jsonb_array_length(rows)=50);
end$$;
create function private.retail_remove_meal_plan(rid uuid,plan_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare r public.retail_relationships%rowtype; p public.meal_plans%rowtype; cid uuid;
begin
 select * into r from public.retail_relationships where id=rid;
 if auth.uid() is null or not private.retail_customer_access(rid,true) or not private.retail_active(rid) or not coalesce(r.share_app_records,false) then raise exception 'Authorized store staff and customer sharing required';end if;
 select client_id into cid from public.meal_plans where id=plan_id and retail_relationship_id=rid;
 if cid is null then raise exception 'Only plans created by this store can be removed';end if;
 perform 1 from public.clients where id=cid and profile_id=r.profile_id for update;
 if not found then raise exception 'Customer plan unavailable';end if;
 select * into p from public.meal_plans where id=plan_id and client_id=cid and retail_relationship_id=rid for update;
 if p.id is null then return;end if;
 update public.clients set active_meal_plan_id=null where id=cid and active_meal_plan_id=plan_id;
 delete from public.meal_plans where id=plan_id and retail_relationship_id=rid;
 insert into public.retail_audit(location_id,actor_id,action,subject_id) values(r.location_id,auth.uid(),'remove_meal_plan',plan_id);
end$$;
create function public.retail_remove_meal_plan(rid uuid,plan_id uuid) returns void language sql security invoker set search_path='' as $$select private.retail_remove_meal_plan(rid,plan_id);$$;
revoke all on function private.retail_remove_meal_plan(uuid,uuid),public.retail_remove_meal_plan(uuid,uuid) from public,anon;
grant execute on function private.retail_remove_meal_plan(uuid,uuid),public.retail_remove_meal_plan(uuid,uuid) to authenticated;
commit;
