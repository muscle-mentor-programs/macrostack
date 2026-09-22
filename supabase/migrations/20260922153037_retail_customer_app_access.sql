begin;
alter table public.retail_relationships add column share_app_records boolean not null default false;
create function private.retail_share_app_records(rid uuid, enabled boolean) returns void language plpgsql security definer set search_path='' as $$begin
 update public.retail_relationships set share_app_records=enabled,revision=revision+1 where id=rid and profile_id=auth.uid() and status='active';
 if not found then raise exception 'Only the linked customer can change sharing';end if;
end$$;
revoke all on function private.retail_share_app_records(uuid,boolean) from public,anon;
grant execute on function private.retail_share_app_records(uuid,boolean) to authenticated;
create function public.retail_share_app_records(rid uuid, enabled boolean) returns void language sql security invoker set search_path='' as $$select private.retail_share_app_records(rid,enabled);$$;
revoke all on function public.retail_share_app_records(uuid,boolean) from public,anon;
grant execute on function public.retail_share_app_records(uuid,boolean) to authenticated;
create function private.retail_app_records(rid uuid,kind text,page_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
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
 select coalesce(jsonb_agg(x),'[]') into rows from (select p.id,p.plan_name,p.days,p.created_at,(p.id=c.active_meal_plan_id) active from public.meal_plans p join public.clients c on c.id=p.client_id where c.profile_id=pid order by p.created_at desc,p.id limit 50 offset page_offset)x;
 elsif kind='checkins' then
 select coalesce(jsonb_agg(x),'[]') into rows from (select p.id,p.weight,p.weight_unit,p.adherence,p.hunger,p.energy,p.notes,p.answers,p.created_at from public.checkins p join public.clients c on c.id=p.client_id where c.profile_id=pid order by p.created_at desc,p.id limit 50 offset page_offset)x;
 elsif kind='forms' then
 select coalesce(jsonb_agg(x),'[]') into rows from (select p.id,p.form_title,p.form_kind,p.answers,p.created_at from public.form_submissions p join public.clients c on c.id=p.client_id where c.profile_id=pid order by p.created_at desc,p.id limit 50 offset page_offset)x;
 elsif kind='schedules' then
 select coalesce(jsonb_agg(x),'[]') into rows from (select p.id,p.apply_on,p.calories,p.protein,p.carbs,p.fat,p.applied from public.target_schedules p join public.clients c on c.id=p.client_id where c.profile_id=pid order by p.apply_on desc,p.id limit 50 offset page_offset)x;
 else raise exception 'Unknown record type';end if;
 return jsonb_build_object('shared',true,'rows',rows,'has_more',jsonb_array_length(rows)=50);
end$$;
revoke all on function private.retail_app_records(uuid,text,integer) from public,anon;
grant execute on function private.retail_app_records(uuid,text,integer) to authenticated;
create function public.retail_app_records(rid uuid,kind text,page_offset integer default 0) returns jsonb language sql security invoker set search_path='' as $$select private.retail_app_records(rid,kind,page_offset);$$;
revoke all on function public.retail_app_records(uuid,text,integer) from public,anon;
grant execute on function public.retail_app_records(uuid,text,integer) to authenticated;
create function private.retail_photo_read(object_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.progress_photos p join public.clients c on c.id=p.client_id join public.retail_relationships r on r.profile_id=c.profile_id where p.path=object_name and r.status='active' and r.share_app_records and private.retail_active(r.id) and private.retail_customer_access(r.id,true));
$$;
revoke all on function private.retail_photo_read(text) from public,anon;
grant execute on function private.retail_photo_read(text) to authenticated;
create policy retail_shared_app_photos on storage.objects for select to authenticated using(bucket_id='progress-photos' and private.retail_photo_read(name));
commit;
