-- Qualify storage.objects.name inside correlated subqueries. Bare name binds
-- to clients.name, rejecting valid uploads and signed reads. Preserve scope.
begin;
drop policy if exists "progress photos scoped access" on storage.objects;
create policy "progress photos scoped access" on storage.objects for all to authenticated
using (
  bucket_id = 'progress-photos'
  and split_part(objects.name, '/', 1) = 'clients'
  and exists (
    select 1 from public.clients c
    where split_part(objects.name, '/', 2) = c.id::text
      and (c.profile_id = (select auth.uid()) or c.coach_id = (select auth.uid())
           or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'))
  )
)
with check (
  bucket_id = 'progress-photos'
  and split_part(objects.name, '/', 1) = 'clients'
  and exists (
    select 1 from public.clients c
    where split_part(objects.name, '/', 2) = c.id::text
      and (c.profile_id = (select auth.uid()) or c.coach_id = (select auth.uid())
           or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'))
  )
);

drop policy if exists "chat attachments scoped access" on storage.objects;
create policy "chat attachments scoped access" on storage.objects for all to authenticated
using (
  bucket_id = 'chat-attachments'
  and exists (
    select 1 from public.clients c
    where split_part(objects.name, '/', 1) = c.id::text
      and (c.profile_id = (select auth.uid()) or c.coach_id = (select auth.uid())
           or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'))
  )
)
with check (
  bucket_id = 'chat-attachments'
  and exists (
    select 1 from public.clients c
    where split_part(objects.name, '/', 1) = c.id::text
      and (c.profile_id = (select auth.uid()) or c.coach_id = (select auth.uid())
           or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'))
  )
);

commit;
