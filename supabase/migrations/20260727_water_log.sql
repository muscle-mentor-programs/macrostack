-- ════════════════════════════════════════════════════════════════════════════
-- WATER LOG
-- Daily hydration tracking. One row per client per day holding the running
-- total in millilitres; the client taps to add/remove and we upsert on
-- (client_id, date). Client and their coach can read/write; superadmin sees all.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.water_log (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  date       date not null default current_date,
  ml         integer not null default 0,
  created_at timestamptz default now(),
  unique (client_id, date)
);

alter table public.water_log enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'water_log_access' and tablename = 'water_log') then
    create policy "water_log_access" on public.water_log for all
      using (
        exists (
          select 1 from public.clients c
          where c.id = water_log.client_id
            and (c.coach_id = auth.uid() or c.profile_id = auth.uid())
        )
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
      )
      with check (
        exists (
          select 1 from public.clients c
          where c.id = water_log.client_id
            and (c.coach_id = auth.uid() or c.profile_id = auth.uid())
        )
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
      );
  end if;
end $$;

create index if not exists idx_water_log_client
  on public.water_log(client_id, date desc);
