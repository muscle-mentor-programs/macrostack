begin;
alter table public.retail_organizations add column brand_name text check (length(brand_name) between 1 and 80), add column logo_path text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('retail-branding','retail-branding',true,2097152,array['image/png','image/webp']);
create function private.retail_brand_upload(object_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.retail_organizations o where o.id::text=split_part(object_name,'/',1) and private.retail_org_access(o.id,true));
$$;
revoke all on function private.retail_brand_upload(text) from public,anon;
grant execute on function private.retail_brand_upload(text) to authenticated;
create policy retail_brand_insert on storage.objects for insert to authenticated with check(bucket_id='retail-branding' and private.retail_brand_upload(name));
create policy retail_brand_delete on storage.objects for delete to authenticated using(bucket_id='retail-branding' and private.retail_brand_upload(name));
create policy retail_brand_select on storage.objects for select to authenticated using(bucket_id='retail-branding' and private.retail_brand_upload(name));
create function private.retail_save_branding(oid uuid,display_name text,object_path text) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or not private.retail_org_access(oid,true) then raise exception 'Organization administrator required';end if;
 if length(trim(display_name)) not between 1 and 80 or display_name is null then raise exception 'Enter a display name between 1 and 80 characters';end if;
 if object_path is not null and (split_part(object_path,'/',1)<>oid::text or not exists(select 1 from storage.objects where bucket_id='retail-branding' and name=object_path)) then raise exception 'Upload a logo for this organization';end if;
 update public.retail_organizations set brand_name=trim(display_name),logo_path=object_path where id=oid;
 insert into public.retail_audit(organization_id,actor_id,action,subject_id) values(oid,auth.uid(),'update_branding',oid);
end$$;
create function public.retail_save_branding(oid uuid,display_name text,object_path text) returns void language sql security invoker set search_path='' as $$select private.retail_save_branding(oid,display_name,object_path);$$;
revoke all on function private.retail_save_branding(uuid,text,text),public.retail_save_branding(uuid,text,text) from public,anon;
grant execute on function private.retail_save_branding(uuid,text,text),public.retail_save_branding(uuid,text,text) to authenticated;
create function private.retail_branding(lid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if auth.uid() is null or not (private.retail_location_access(lid) or exists(select 1 from public.retail_relationships where location_id=lid and profile_id=auth.uid() and status='active')) then raise exception 'Store unavailable';end if;
 return (select jsonb_build_object('name',coalesce(o.brand_name,o.name),'logo_path',o.logo_path) from public.retail_locations l join public.retail_organizations o on o.id=l.organization_id where l.id=lid and l.enabled and o.enabled);
end$$;
create function public.retail_branding(lid uuid) returns jsonb language sql stable security invoker set search_path='' as $$select private.retail_branding(lid);$$;
revoke all on function private.retail_branding(uuid),public.retail_branding(uuid) from public,anon;
grant execute on function private.retail_branding(uuid),public.retail_branding(uuid) to authenticated;
commit;
