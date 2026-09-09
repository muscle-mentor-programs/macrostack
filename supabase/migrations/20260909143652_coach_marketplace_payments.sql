begin;

create table public.marketplace_profiles (
  coach_id uuid primary key references public.profiles(id),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  headline text not null check (char_length(btrim(headline)) between 5 and 160),
  bio text not null check (char_length(btrim(bio)) between 20 and 5000),
  specialties text not null default '',
  credentials text not null default '',
  photo_url text not null default '',
  price_cents integer not null check (price_cents between 100 and 1000000),
  billing_mode text not null check (billing_mode in ('monthly','one_time')),
  duration_days integer check (duration_days between 1 and 730),
  published boolean not null default false,
  stripe_ready boolean not null default false,
  updated_at timestamptz not null default now(),
  check (billing_mode <> 'one_time' or duration_days is not null)
);
create table public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  buyer_id uuid not null references public.profiles(id),
  coach_id uuid not null references public.profiles(id),
  price_cents integer not null,
  billing_mode text not null check (billing_mode in ('monthly','one_time')),
  duration_days integer,
  destination text not null,
  state text not null default 'pending' check (state in ('pending','paid','expired','review','refunded')),
  session_id text unique,
  subscription_id text unique,
  customer_id text,
  payment_intent_id text,
  expires_at timestamptz not null default now() + interval '31 minutes',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create unique index marketplace_one_pending_order on public.marketplace_orders(buyer_id) where state='pending';
create index marketplace_orders_coach on public.marketplace_orders(coach_id);
create index marketplace_orders_client on public.marketplace_orders(client_id);
create table public.marketplace_access (
  client_id uuid primary key references public.clients(id),
  buyer_id uuid not null references public.profiles(id),
  coach_id uuid not null references public.profiles(id),
  order_id uuid not null references public.marketplace_orders(id),
  paid_until timestamptz not null,
  disabled boolean not null default false,
  updated_at timestamptz not null default now()
);
create index marketplace_access_buyer on public.marketplace_access(buyer_id);
create index marketplace_access_coach on public.marketplace_access(coach_id);

alter table public.marketplace_profiles enable row level security;
alter table public.marketplace_orders enable row level security;
alter table public.marketplace_access enable row level security;
revoke all on public.marketplace_profiles,public.marketplace_orders,public.marketplace_access from public,anon,authenticated;
grant all on public.marketplace_profiles,public.marketplace_orders,public.marketplace_access to service_role;
grant select on public.marketplace_profiles,public.marketplace_orders,public.marketplace_access to authenticated;
create policy marketplace_profile_owner on public.marketplace_profiles for select to authenticated using (coach_id=(select auth.uid()));
create policy marketplace_order_parties on public.marketplace_orders for select to authenticated using (buyer_id=(select auth.uid()) or coach_id=(select auth.uid()) or public.is_superadmin());
create policy marketplace_access_parties on public.marketplace_access for select to authenticated using (buyer_id=(select auth.uid()) or coach_id=(select auth.uid()) or public.is_superadmin());

-- Signed-in legacy directory must not expose coaches who have not opted in.
create or replace function public.get_coach_directory()
returns table(id uuid,name text,bio text,specialties text,credentials text,website text,client_count bigint)
language sql stable security definer set search_path = '' as $$
  select m.coach_id,m.name,m.bio,m.specialties,m.credentials,''::text,0::bigint
  from public.marketplace_profiles m
  where m.published and m.stripe_ready order by m.name;
$$;
revoke all on function public.get_coach_directory() from public,anon;
grant execute on function public.get_coach_directory() to authenticated;

-- Only the trusted payment service can execute this atomic fulfillment.
create function public.fulfill_marketplace_order(p_order uuid,p_until timestamptz)
returns void language plpgsql security invoker set search_path = '' as $$
declare o public.marketplace_orders; c public.clients;
begin
  select * into strict o from public.marketplace_orders where id=p_order for update;
  select * into strict c from public.clients where id=o.client_id for update;
  if o.state='paid' then return; end if;
  if o.state not in ('pending','expired') or p_until <= now() then raise exception 'Invalid fulfillment'; end if;
  if exists(select 1 from public.marketplace_access a join public.marketplace_orders newer on newer.id=a.order_id
    where a.client_id=o.client_id and newer.created_at>o.created_at) then
    raise exception 'A newer coaching purchase exists';
  end if;
  if c.profile_id <> o.buyer_id or (c.coach_id is not null and c.coach_id <> o.coach_id) then
    raise exception 'Coach connection changed; payment requires review';
  end if;
  update public.clients set coach_id=o.coach_id where id=o.client_id;
  insert into public.marketplace_access(client_id,buyer_id,coach_id,order_id,paid_until)
  values(o.client_id,o.buyer_id,o.coach_id,o.id,p_until)
  on conflict(client_id) do update set coach_id=excluded.coach_id,order_id=excluded.order_id,
    paid_until=excluded.paid_until,disabled=false,updated_at=now();
  update public.marketplace_orders set state='paid',paid_at=now() where id=o.id;
end;
$$;
revoke all on function public.fulfill_marketplace_order(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.fulfill_marketplace_order(uuid,timestamptz) to service_role;

-- Inactive marketplace clients keep history but cannot send new coaching messages/check-ins.
create function public.marketplace_can_participate(p_client uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select not exists(select 1 from public.marketplace_access a where a.client_id=p_client
    and (a.disabled or a.paid_until<=now()));
$$;
revoke all on function public.marketplace_can_participate(uuid) from public,anon;
grant execute on function public.marketplace_can_participate(uuid) to authenticated;
create policy marketplace_messages_active on public.messages as restrictive for insert to authenticated
with check(public.marketplace_can_participate(client_id));
create policy marketplace_checkins_active on public.checkins as restrictive for insert to authenticated
with check(public.marketplace_can_participate(client_id));

commit;
