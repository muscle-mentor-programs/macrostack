begin;

-- Single-use authorization attempts, bound to the authenticated coach.
-- Store a hash of the random state, never an OAuth access token or card data.
create table public.stripe_connect_oauth_states (
  state_hash text primary key check (state_hash ~ '^[a-f0-9]{64}$'),
  coach_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  consumed_at timestamptz,
  check (expires_at > created_at)
);
create index stripe_connect_oauth_states_expiry_idx
  on public.stripe_connect_oauth_states(expires_at);

-- Separate from MacroStack subscription customer/subscription identifiers.
create table public.coach_stripe_connections (
  coach_id uuid primary key references public.profiles(id),
  stripe_account_id text not null unique check (stripe_account_id ~ '^acct_[A-Za-z0-9]+$'),
  livemode boolean not null,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  disconnected_at timestamptz
);

alter table public.stripe_connect_oauth_states enable row level security;
alter table public.coach_stripe_connections enable row level security;
revoke all on public.stripe_connect_oauth_states from public, anon, authenticated;
revoke all on public.coach_stripe_connections from public, anon, authenticated;
grant select, insert, update, delete on public.stripe_connect_oauth_states to service_role;
grant select, insert, update, delete on public.coach_stripe_connections to service_role;

commit;
