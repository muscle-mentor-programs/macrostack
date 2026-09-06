-- Additive coach-only workspace. Existing tables and records are not rewritten.
begin;
create table public.coach_workspace_entries (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null,
  client_id uuid not null references public.clients(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id),
  kind text not null check (kind in ('note','brief','task','review','comment','day_review','plan')),
  title text not null check (length(title) between 1 and 200),
  body text not null default '' check (length(body) <= 30000),
  details jsonb not null default '{}' check (jsonb_typeof(details) = 'object' and octet_length(details::text) <= 30000),
  created_at timestamptz not null default now()
);
create index coach_workspace_client_time on public.coach_workspace_entries(client_id, created_at desc);
create index coach_workspace_record on public.coach_workspace_entries(record_id, created_at desc);
alter table public.coach_workspace_entries enable row level security;
grant select, insert on public.coach_workspace_entries to authenticated;
revoke all on public.coach_workspace_entries from anon;
create policy "Coach reads own workspace records" on public.coach_workspace_entries
for select to authenticated using (
  author_id = (select auth.uid()) and exists (
    select 1 from public.clients c where c.id = coach_workspace_entries.client_id
      and (c.coach_id = (select auth.uid()) or exists (
        select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'
      ))
  )
);
create policy "Coach appends own workspace records" on public.coach_workspace_entries
for insert to authenticated with check (
  author_id = (select auth.uid()) and exists (
    select 1 from public.clients c where c.id = coach_workspace_entries.client_id
      and (c.coach_id = (select auth.uid()) or exists (
        select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'superadmin'
      ))
  )
);
-- No UPDATE or DELETE grant/policy: note and task revisions preserve prior entries.
commit;
