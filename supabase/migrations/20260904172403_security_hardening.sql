-- Security hardening: roles, self-service signup, and private client media.

-- Roles are authorization data. Users can edit their profile, but never their
-- role or billing fields. Service-role edge functions continue to bypass RLS.
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile fields"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke update on table public.profiles from authenticated;
grant update (name, theme, bio, specialties, credentials, website)
  on table public.profiles to authenticated;

-- Only a server-side Admin API call can set app_metadata. Never trust
-- raw_user_meta_data for authorization because a user can change it.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_name text;
  v_role text;
  v_code text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  v_role := case when new.raw_app_meta_data->>'role' = 'coach' then 'coach' else 'client' end;

  if v_role = 'coach' then
    v_code := upper(left(regexp_replace(v_name, '[^a-zA-Z]', '', 'g'), 4))
           || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
    while exists (select 1 from public.profiles where coach_code = v_code) loop
      v_code := upper(left(regexp_replace(v_name, '[^a-zA-Z]', '', 'g'), 4))
             || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
    end loop;
  end if;

  insert into public.profiles (id, name, role, coach_code)
  values (new.id, v_name, v_role, v_code)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Preserve object paths separately from legacy public URLs while clients
-- transition to signed URLs.
alter table public.clients add column if not exists avatar_path text;
update public.clients
set avatar_path = regexp_replace(split_part(avatar_url, '?', 1), '^.*/avatars/', '')
where avatar_url is not null
  and avatar_url like '%/avatars/%'
  and avatar_path is null;

alter table public.messages add column if not exists attachment_path text;
update public.messages
set attachment_path = regexp_replace(split_part(attachment_url, '?', 1), '^.*/chat-attachments/', '')
where attachment_url is not null
  and attachment_url like '%/chat-attachments/%'
  and attachment_path is null;

-- Media contains sensitive health and personal information. Keep buckets
-- private and scope all object access to the client, their coach, or a
-- superadmin. Object names are validated against the client id in each path.
update storage.buckets
set public = false
where id in ('avatars', 'progress-photos', 'chat-attachments');

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Authenticated users can update avatars" on storage.objects;
drop policy if exists "Avatars are publicly accessible" on storage.objects;
drop policy if exists "Progress photos upload" on storage.objects;
drop policy if exists "Progress photos delete" on storage.objects;
drop policy if exists "Progress photos public read" on storage.objects;
drop policy if exists "Chat attachments upload" on storage.objects;
drop policy if exists "Chat attachments public read" on storage.objects;

create policy "avatars scoped access" on storage.objects for all to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = 'clients'
  and exists (
    select 1 from public.clients c
    where split_part(split_part(name, '/', 2), '.', 1) = c.id::text
      and (c.profile_id = (select auth.uid()) or c.coach_id = (select auth.uid())
           or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'))
  )
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = 'clients'
  and exists (
    select 1 from public.clients c
    where split_part(split_part(name, '/', 2), '.', 1) = c.id::text
      and (c.profile_id = (select auth.uid()) or c.coach_id = (select auth.uid())
           or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'))
  )
);

create policy "progress photos scoped access" on storage.objects for all to authenticated
using (
  bucket_id = 'progress-photos'
  and split_part(name, '/', 1) = 'clients'
  and exists (
    select 1 from public.clients c
    where split_part(name, '/', 2) = c.id::text
      and (c.profile_id = (select auth.uid()) or c.coach_id = (select auth.uid())
           or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'))
  )
)
with check (
  bucket_id = 'progress-photos'
  and split_part(name, '/', 1) = 'clients'
  and exists (
    select 1 from public.clients c
    where split_part(name, '/', 2) = c.id::text
      and (c.profile_id = (select auth.uid()) or c.coach_id = (select auth.uid())
           or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'))
  )
);

create policy "chat attachments scoped access" on storage.objects for all to authenticated
using (
  bucket_id = 'chat-attachments'
  and exists (
    select 1 from public.clients c
    where split_part(name, '/', 1) = c.id::text
      and (c.profile_id = (select auth.uid()) or c.coach_id = (select auth.uid())
           or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'))
  )
)
with check (
  bucket_id = 'chat-attachments'
  and exists (
    select 1 from public.clients c
    where split_part(name, '/', 1) = c.id::text
      and (c.profile_id = (select auth.uid()) or c.coach_id = (select auth.uid())
           or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'))
  )
);
