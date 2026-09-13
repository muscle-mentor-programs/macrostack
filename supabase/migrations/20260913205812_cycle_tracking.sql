-- Sensitive cycle data is separate from coach-visible client profiles.
create table public.cycle_tracking_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  enabled boolean not null default false
);
create table public.cycle_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.cycle_tracking_settings(user_id) on delete cascade,
  start_date date not null,
  end_date date not null,
  symptoms text[] not null default '{}',
  notes text not null default '',
  check (start_date >= date '1900-01-01' and end_date >= start_date),
  check (end_date <= current_date + 1),
  check (char_length(notes) <= 1000),
  check (symptoms <@ array['Bloating','Cramps','Appetite changes','Low energy']::text[]),
  unique (user_id, start_date)
);
alter table public.cycle_tracking_settings enable row level security;
alter table public.cycle_periods enable row level security;
revoke all on public.cycle_tracking_settings, public.cycle_periods from public, anon, authenticated;
grant select, insert, update, delete on public.cycle_tracking_settings, public.cycle_periods to authenticated;
create policy cycle_settings_owner on public.cycle_tracking_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy cycle_periods_owner on public.cycle_periods
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
