begin;
alter table public.marketplace_profiles add column cover_url text not null default '';
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('marketplace-images','marketplace-images',true,3145728,array['image/jpeg']);
create policy marketplace_images_upload on storage.objects
for insert to authenticated with check (
  bucket_id='marketplace-images'
  and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('coach','superadmin'))
);
commit;
