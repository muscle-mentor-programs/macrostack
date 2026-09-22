begin;
alter table public.retail_relationships add column avatar_path text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('retail-avatars','retail-avatars',false,2097152,array['image/png','image/jpeg','image/webp']);
create function private.retail_avatar_access(object_name text,write_access boolean default false) returns boolean language plpgsql stable security definer set search_path='' as $$declare rid uuid;begin
 if auth.uid() is null then return false;end if;
 begin rid:=split_part(object_name,'/',1)::uuid;exception when invalid_text_representation then return false;end;
 return private.retail_customer_access(rid,write_access);
end$$;
revoke all on function private.retail_avatar_access(text,boolean) from public,anon;
grant execute on function private.retail_avatar_access(text,boolean) to authenticated;
create policy retail_avatar_insert on storage.objects for insert to authenticated with check(bucket_id='retail-avatars' and private.retail_avatar_access(name,true));
create policy retail_avatar_read on storage.objects for select to authenticated using(bucket_id='retail-avatars' and private.retail_avatar_access(name));
create policy retail_avatar_delete on storage.objects for delete to authenticated using(bucket_id='retail-avatars' and private.retail_avatar_access(name,true));
create function private.retail_set_avatar(rid uuid,object_path text) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or not private.retail_customer_access(rid,true) then raise exception 'Authorized store staff required';end if;
 if object_path is not null and (split_part(object_path,'/',1)<>rid::text or not exists(select 1 from storage.objects where bucket_id='retail-avatars' and name=object_path)) then raise exception 'Upload a photo for this customer';end if;
 update public.retail_relationships set avatar_path=object_path where id=rid;
 insert into public.retail_audit(location_id,actor_id,action,subject_id) select location_id,auth.uid(),'update_customer_photo',rid from public.retail_relationships where id=rid;
end$$;
create function public.retail_set_avatar(rid uuid,object_path text) returns void language sql security invoker set search_path='' as $$select private.retail_set_avatar(rid,object_path);$$;
revoke all on function private.retail_set_avatar(uuid,text),public.retail_set_avatar(uuid,text) from public,anon;
grant execute on function private.retail_set_avatar(uuid,text),public.retail_set_avatar(uuid,text) to authenticated;
commit;
