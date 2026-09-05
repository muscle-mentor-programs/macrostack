-- Correct the correlated object path; keep the bucket private and ownership checks intact.
begin;
alter policy "avatars scoped access" on storage.objects
using (
  bucket_id = 'avatars'
  and split_part(objects.name, '/', 1) = 'clients'
  and exists (
    select 1 from public.clients c
    where split_part(split_part(objects.name, '/', 2), '.', 1) = c.id::text
      and (c.profile_id = (select auth.uid()) or c.coach_id = (select auth.uid())
        or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'))
  )
)
with check (
  bucket_id = 'avatars'
  and split_part(objects.name, '/', 1) = 'clients'
  and exists (
    select 1 from public.clients c
    where split_part(split_part(objects.name, '/', 2), '.', 1) = c.id::text
      and (c.profile_id = (select auth.uid()) or c.coach_id = (select auth.uid())
        or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'))
  )
);
commit;
