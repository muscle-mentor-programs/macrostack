-- ════════════════════════════════════════════════════════════════════════════
-- COACH PREMIUM PACK — one migration for the pre-launch feature set:
--   • private client notes            • meal plan templates
--   • scheduled target changes        • message templates (broadcasts)
--   • client tags                     • archive/pause clients (cap-exempt)
--   • chat attachments                • web push subscriptions
--   • coach client-billing settings (Stripe Connect)
-- ════════════════════════════════════════════════════════════════════════════

-- ── Private client notes (coach-only; one doc per client) ────────────────────
create table if not exists public.client_notes (
  client_id  uuid primary key references public.clients(id) on delete cascade,
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  body       text not null default '',
  updated_at timestamptz default now()
);
alter table public.client_notes enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'client_notes_coach_only' and tablename = 'client_notes') then
    create policy "client_notes_coach_only" on public.client_notes for all
      using (coach_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'))
      with check (coach_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));
  end if;
end $$;

-- ── Meal plan templates ───────────────────────────────────────────────────────
create table if not exists public.meal_plan_templates (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  name       text not null default 'Template',
  days       jsonb not null default '[]',
  created_at timestamptz default now()
);
alter table public.meal_plan_templates enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'meal_plan_templates_coach' and tablename = 'meal_plan_templates') then
    create policy "meal_plan_templates_coach" on public.meal_plan_templates for all
      using (coach_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'))
      with check (coach_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));
  end if;
end $$;

-- ── Scheduled target changes (applied by the daily cron) ─────────────────────
create table if not exists public.target_schedules (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  apply_on   date not null,
  calories   int not null,
  protein    int not null,
  carbs      int not null,
  fat        int not null,
  note       text default '',
  applied    boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists idx_target_schedules_due on public.target_schedules(applied, apply_on);
alter table public.target_schedules enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'target_schedules_access' and tablename = 'target_schedules') then
    create policy "target_schedules_access" on public.target_schedules for all
      using (
        exists (select 1 from public.clients c where c.id = target_schedules.client_id
                  and (c.coach_id = auth.uid() or c.profile_id = auth.uid()))
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
      )
      with check (
        exists (select 1 from public.clients c where c.id = target_schedules.client_id
                  and c.coach_id = auth.uid())
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin')
      );
  end if;
end $$;

-- ── Message templates (for broadcasts) ────────────────────────────────────────
create table if not exists public.message_templates (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  title      text not null default '',
  body       text not null default '',
  created_at timestamptz default now()
);
alter table public.message_templates enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'message_templates_coach' and tablename = 'message_templates') then
    create policy "message_templates_coach" on public.message_templates for all
      using (coach_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'))
      with check (coach_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));
  end if;
end $$;

-- ── Client tags + archive status ──────────────────────────────────────────────
alter table public.clients
  add column if not exists tags jsonb not null default '[]';

alter table public.clients drop constraint if exists clients_status_check;
alter table public.clients
  add constraint clients_status_check check (status in ('pending', 'active', 'archived'));

-- Archived clients don't count toward the tier cap
create or replace function public.enforce_coach_client_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan     text;
  v_status   text;
  v_override text;
  v_limit    int;
  v_count    int;
begin
  if new.coach_id is null then
    return new;
  end if;
  -- fires on gaining a coach OR un-archiving
  if tg_op = 'UPDATE'
     and new.coach_id is not distinct from old.coach_id
     and not (old.status = 'archived' and new.status <> 'archived') then
    return new;
  end if;
  if new.status = 'archived' then
    return new;
  end if;

  select subscription_plan, subscription_status, admin_override
    into v_plan, v_status, v_override
    from public.profiles where id = new.coach_id;

  if v_override = 'unlocked' then
    return new;
  end if;

  if v_status in ('active', 'trialing') then
    v_limit := case v_plan
      when 't_2_10'     then 10
      when 't_11_30'    then 30
      when 't_31_60'    then 60
      when 't_61_120'   then 120
      when 't_121_plus' then null
      else null
    end;
  else
    v_limit := 1;
  end if;

  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count
    from public.clients
   where coach_id = new.coach_id
     and status <> 'archived'
     and id <> new.id;

  if v_count >= v_limit then
    raise exception 'CLIENT_LIMIT_REACHED: this coach''s plan allows up to % active clients — upgrade the tier or archive someone.', v_limit;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_coach_client_limit on public.clients;
create trigger trg_enforce_coach_client_limit
  before insert or update of coach_id, status on public.clients
  for each row
  execute function public.enforce_coach_client_limit();

-- ── Chat attachments ──────────────────────────────────────────────────────────
alter table public.messages
  add column if not exists attachment_url  text,
  add column if not exists attachment_type text;   -- 'image' | 'audio'

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-attachments', 'chat-attachments', true, 15728640,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg'])
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Chat attachments upload' and tablename = 'objects') then
    create policy "Chat attachments upload"
      on storage.objects for insert to authenticated
      with check (bucket_id = 'chat-attachments');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Chat attachments public read' and tablename = 'objects') then
    create policy "Chat attachments public read"
      on storage.objects for select to public
      using (bucket_id = 'chat-attachments');
  end if;
end $$;

-- ── Web push subscriptions ────────────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null,
  subscription jsonb not null,
  created_at timestamptz default now(),
  unique (profile_id, endpoint)
);
alter table public.push_subscriptions enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'push_subscriptions_own' and tablename = 'push_subscriptions') then
    create policy "push_subscriptions_own" on public.push_subscriptions for all
      using (profile_id = auth.uid())
      with check (profile_id = auth.uid());
  end if;
end $$;

-- ── Coach client-billing settings (Stripe Connect) ────────────────────────────
alter table public.profiles
  add column if not exists stripe_connect_id text;

create table if not exists public.coach_billing (
  coach_id      uuid primary key references public.profiles(id) on delete cascade,
  price         numeric not null default 0,   -- monthly coaching price (USD)
  connect_ready boolean not null default false,
  updated_at    timestamptz default now()
);
alter table public.coach_billing enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'coach_billing_coach' and tablename = 'coach_billing') then
    create policy "coach_billing_coach" on public.coach_billing for all
      using (coach_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'))
      with check (coach_id = auth.uid()
             or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superadmin'));
  end if;
  -- Clients can see their coach's price (to render the payment card)
  if not exists (select 1 from pg_policies where policyname = 'coach_billing_client_read' and tablename = 'coach_billing') then
    create policy "coach_billing_client_read" on public.coach_billing for select
      using (exists (
        select 1 from public.clients c
        where c.profile_id = auth.uid()
          and c.coach_id = coach_billing.coach_id
      ));
  end if;
end $$;
