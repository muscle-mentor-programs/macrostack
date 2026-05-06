-- ─────────────────────────────────────────────────────────────────────────────
-- MacroStack initial schema
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles (one row per auth user) ─────────────────────────────────────────
create table if not exists profiles (
  id      uuid references auth.users on delete cascade primary key,
  name    text not null default '',
  role    text not null default 'client' check (role in ('superadmin', 'coach', 'client')),
  theme   text not null default 'dark',
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Superadmin views all profiles"
  on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'superadmin'));

-- Auto-create profile row when an auth user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Clients ───────────────────────────────────────────────────────────────────
create table if not exists clients (
  id                 uuid default gen_random_uuid() primary key,
  profile_id         uuid references profiles(id) on delete set null,
  name               text not null default 'New Client',
  email              text default '',
  height             text default '',
  dob                text default '',
  phone              text default '',
  bio                text default '',
  goal_calories      int  default 2000,
  goal_protein       int  default 150,
  goal_carbs         int  default 200,
  goal_fat           int  default 65,
  active_meal_plan_id uuid,              -- soft ref to meal_plans.id (no FK to avoid circular dep)
  created_at         timestamptz default now()
);

alter table clients enable row level security;

create policy "Superadmin full access to clients"
  on clients for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin'));

create policy "Clients view own record"
  on clients for select using (profile_id = auth.uid());

create policy "Clients update own profile"
  on clients for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ── Food log ──────────────────────────────────────────────────────────────────
create table if not exists food_log (
  id           uuid primary key,          -- client-generated UUID for optimistic updates
  client_id    uuid references clients(id) on delete cascade not null,
  date         date not null,
  name         text not null default '',
  brand        text default '',
  food_id      text,
  quantity     numeric default 1,
  serving_size numeric,
  serving_unit text,
  meal         text default 'Other',
  calories     numeric not null default 0,
  protein      numeric not null default 0,
  carbs        numeric not null default 0,
  fat          numeric not null default 0,
  created_at   timestamptz default now()
);

alter table food_log enable row level security;

create policy "Superadmin full access to food_log"
  on food_log for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin'));

create policy "Clients manage own food log"
  on food_log for all
  using (exists (select 1 from clients where clients.id = food_log.client_id and clients.profile_id = auth.uid()))
  with check (exists (select 1 from clients where clients.id = food_log.client_id and clients.profile_id = auth.uid()));

-- ── Weight log ────────────────────────────────────────────────────────────────
create table if not exists weight_log (
  id         uuid primary key,
  client_id  uuid references clients(id) on delete cascade not null,
  value      numeric not null,
  unit       text default 'lbs',
  date       date not null,
  created_at timestamptz default now()
);

alter table weight_log enable row level security;

create policy "Superadmin full access to weight_log"
  on weight_log for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin'));

create policy "Clients manage own weight log"
  on weight_log for all
  using (exists (select 1 from clients where clients.id = weight_log.client_id and clients.profile_id = auth.uid()))
  with check (exists (select 1 from clients where clients.id = weight_log.client_id and clients.profile_id = auth.uid()));

-- ── Meal plans ────────────────────────────────────────────────────────────────
create table if not exists meal_plans (
  id         uuid default gen_random_uuid() primary key,
  client_id  uuid references clients(id) on delete cascade not null,
  plan_name  text not null default 'New Plan',
  days       jsonb not null default '[]',
  created_at timestamptz default now()
);

alter table meal_plans enable row level security;

create policy "Superadmin full access to meal_plans"
  on meal_plans for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin'));

create policy "Clients view own meal plans"
  on meal_plans for select
  using (exists (select 1 from clients where clients.id = meal_plans.client_id and clients.profile_id = auth.uid()));

-- ── Messages ──────────────────────────────────────────────────────────────────
create table if not exists messages (
  id              uuid primary key,
  client_id       uuid references clients(id) on delete cascade not null,
  from_role       text not null check (from_role in ('coach', 'client')),
  text            text not null,
  read_by_client  boolean default false,
  read_by_coach   boolean default false,
  created_at      timestamptz default now()
);

alter table messages enable row level security;

create policy "Superadmin full access to messages"
  on messages for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin'));

create policy "Clients manage own messages"
  on messages for all
  using (exists (select 1 from clients where clients.id = messages.client_id and clients.profile_id = auth.uid()))
  with check (exists (select 1 from clients where clients.id = messages.client_id and clients.profile_id = auth.uid()));

-- ── Custom / scanned foods (shared pool) ──────────────────────────────────────
create table if not exists custom_foods (
  id           uuid primary key,
  name         text not null,
  brand        text default '',
  serving_size numeric,
  serving_unit text,
  calories     numeric not null default 0,
  protein      numeric not null default 0,
  carbs        numeric not null default 0,
  fat          numeric not null default 0,
  upc          text,
  source       text default 'custom',   -- 'custom' | 'scanned'
  created_at   timestamptz default now()
);

alter table custom_foods enable row level security;

create policy "All authenticated users view custom foods"
  on custom_foods for select using (auth.uid() is not null);

create policy "Superadmin manages custom foods"
  on custom_foods for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'superadmin'));

-- Allow clients to insert scanned foods
create policy "Clients insert scanned foods"
  on custom_foods for insert
  with check (auth.uid() is not null);
