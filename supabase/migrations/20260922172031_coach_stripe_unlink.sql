-- A pending revocation stays blocked across retries; historical account IDs are retained.
alter table public.coach_stripe_connections add column disconnect_pending boolean not null default false;

create table public.coach_stripe_operation_locks (
  coach_id uuid primary key references public.profiles(id) on delete cascade,
  token uuid not null,
  expires_at timestamptz not null
);
alter table public.coach_stripe_operation_locks enable row level security;
revoke all on public.coach_stripe_operation_locks from public, anon, authenticated;
grant all on public.coach_stripe_operation_locks to service_role;

-- Serialize OAuth changes and new checkouts across Edge Function instances.
create function public.acquire_coach_stripe_lock(p_coach uuid, p_token uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.coach_stripe_operation_locks(coach_id, token, expires_at)
  values (p_coach, p_token, now() + interval '10 minutes')
  on conflict (coach_id) do update set token = excluded.token, expires_at = excluded.expires_at
  where public.coach_stripe_operation_locks.expires_at < now();
  return found;
end;
$$;
revoke all on function public.acquire_coach_stripe_lock(uuid, uuid) from public, anon, authenticated;
grant execute on function public.acquire_coach_stripe_lock(uuid, uuid) to service_role;

-- Clear all payment eligibility atomically, including externally revoked connections.
create function public.clear_disconnected_coach_billing()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.disconnected_at is not null or new.disconnect_pending then
    new.charges_enabled := false;
    new.payouts_enabled := false;
    update public.marketplace_profiles set stripe_ready = false where coach_id = new.coach_id;
    update public.coach_billing set connect_ready = false where coach_id = new.coach_id;
    update public.stripe_connect_oauth_states set consumed_at = now()
      where coach_id = new.coach_id and consumed_at is null;
  end if;
  return new;
end;
$$;
revoke all on function public.clear_disconnected_coach_billing() from public, anon, authenticated;
create trigger clear_disconnected_coach_billing before update on public.coach_stripe_connections
for each row execute function public.clear_disconnected_coach_billing();
