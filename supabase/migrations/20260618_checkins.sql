-- ════════════════════════════════════════════════════════════════════════════
-- WEEKLY CHECK-INS
-- Clients submit a short weekly check-in (weight + how the week felt + notes).
-- The coach reviews it alongside the logged data and an AI summary, then
-- decides whether to adjust targets.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.checkins (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  weight      numeric,
  weight_unit text default 'lbs',
  adherence   int,            -- 1–5: how well they stuck to the plan
  hunger      int,            -- 1–5: hunger levels through the week
  energy      int,            -- 1–5: energy / training quality
  notes       text default '',
  created_at  timestamptz default now()
);

alter table public.checkins enable row level security;

-- Accessible to the client (their own) and their coach; superadmin sees all.
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'checkins_access' and tablename = 'checkins') then
    create policy "checkins_access" on public.checkins for all
      using (
        exists (
          select 1 from public.clients c
          where c.id = checkins.client_id
            and (c.coach_id = auth.uid() or c.profile_id = auth.uid())
        )
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
      )
      with check (
        exists (
          select 1 from public.clients c
          where c.id = checkins.client_id
            and (c.coach_id = auth.uid() or c.profile_id = auth.uid())
        )
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
      );
  end if;
end $$;

create index if not exists idx_checkins_client on public.checkins(client_id, created_at desc);
