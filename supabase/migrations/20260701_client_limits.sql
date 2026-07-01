-- ════════════════════════════════════════════════════════════════════════════
-- TIER-BASED CLIENT LIMITS (server-side enforcement)
-- A coach's plan caps how many clients can be attached to them. This trigger
-- fires whenever a client row is inserted with a coach or linked to a new
-- coach (UI add, invite, coach-code linking, request acceptance — every path).
-- Limits mirror src/lib/coachTiers.js and the change-subscription function:
--   free = 1 · t_2_10 = 10 · t_11_30 = 30 · t_31_60 = 60 · t_61_120 = 120
--   t_121_plus / legacy paid / admin-unlocked = unlimited
-- ════════════════════════════════════════════════════════════════════════════

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
  -- Only when a client is being attached to a coach (not on unlink/other edits)
  if new.coach_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.coach_id is not distinct from old.coach_id then
    return new;
  end if;

  select subscription_plan, subscription_status, admin_override
    into v_plan, v_status, v_override
    from public.profiles
   where id = new.coach_id;

  -- Superadmin-unlocked coaches have no cap
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
      else null   -- active sub on a legacy (pre-tier) plan → unlimited, as sold
    end;
  else
    v_limit := 1; -- free tier
  end if;

  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count
    from public.clients
   where coach_id = new.coach_id
     and id <> new.id;

  if v_count >= v_limit then
    raise exception 'CLIENT_LIMIT_REACHED: this coach''s plan allows up to % clients — upgrade the tier to add more.', v_limit;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_coach_client_limit on public.clients;
create trigger trg_enforce_coach_client_limit
  before insert or update of coach_id on public.clients
  for each row
  execute function public.enforce_coach_client_limit();
