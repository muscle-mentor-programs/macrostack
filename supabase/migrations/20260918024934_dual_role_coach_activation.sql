-- Preserve the original member entitlement when a member adds a coach workspace.
alter table public.profiles add column if not exists dual_role boolean not null default false;
alter table public.profiles add column if not exists member_subscription jsonb not null default '{}'::jsonb;
-- Existing column-scoped UPDATE grants deliberately do not include these fields.
revoke update (dual_role, member_subscription) on public.profiles from anon, authenticated;

create or replace function public.get_my_account()
returns setof public.profiles language sql stable security invoker set search_path = '' as $$
  select * from public.profiles where id = (select auth.uid());
$$;
revoke all on function public.get_my_account() from public, anon;
grant execute on function public.get_my_account() to authenticated;

create schema if not exists private;
create or replace function private.activate_coach_workspace()
returns void language plpgsql security definer set search_path = '' as $$
declare p public.profiles; code text; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select * into p from public.profiles where id = uid for update;
  if not found then raise exception 'Account not found'; end if;
  if p.role in ('coach','superadmin') then return; end if;
  if p.role <> 'client' then raise exception 'Account cannot activate coaching'; end if;
  if p.admin_override = 'locked' then raise exception 'This account is locked. Contact support.'; end if;
  -- Existing member record and all its foreign keys remain untouched.
  if not exists(select 1 from public.clients where profile_id=uid) then
    raise exception 'Member profile not found. Contact support.';
  end if;
  loop
    code := upper(left(regexp_replace(p.name, '[^a-zA-Z]', '', 'g'),4)) || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
    exit when not exists(select 1 from public.profiles where coach_code=code);
  end loop;
  update public.profiles set
    member_subscription = jsonb_build_object('stripe_subscription_id',p.stripe_subscription_id,'subscription_status',p.subscription_status,'subscription_plan',p.subscription_plan,'current_period_end',p.current_period_end,'admin_override',p.admin_override),
    dual_role=true, role='coach', coach_code=code,
    stripe_subscription_id=null, subscription_status='inactive', subscription_plan=null,
    current_period_end=null, admin_override=null
  where id=uid;
end;
$$;
revoke all on function private.activate_coach_workspace() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.activate_coach_workspace() to authenticated;
create or replace function public.activate_coach_workspace()
returns void language sql security invoker set search_path = '' as $$ select private.activate_coach_workspace(); $$;
revoke all on function public.activate_coach_workspace() from public, anon;
grant execute on function public.activate_coach_workspace() to authenticated;

-- Serialize Stripe updates with activation so member events can never unlock coach tiers.
create or replace function public.sync_account_subscription(p_user uuid,p_subscription text,p_customer text,p_status text,p_plan text,p_period_end timestamptz,p_audience text default null)
returns void language plpgsql security invoker set search_path = '' as $$
declare p public.profiles; member_event boolean;
begin
 select * into p from public.profiles where id=p_user for update;
 if not found then raise exception 'Account not found'; end if;
 member_event := p.dual_role and (p_audience='user' or p.member_subscription->>'stripe_subscription_id'=p_subscription or (p_audience is null and p_plan in ('weekly','monthly','annual')));
 if member_event then
   update public.profiles set stripe_customer_id=p_customer,
     member_subscription=member_subscription || jsonb_build_object('stripe_subscription_id',p_subscription,'subscription_status',p_status,'subscription_plan',p_plan,'current_period_end',p_period_end)
   where id=p_user;
 else
   update public.profiles set stripe_customer_id=p_customer,stripe_subscription_id=p_subscription,subscription_status=p_status,subscription_plan=p_plan,current_period_end=p_period_end where id=p_user;
 end if;
end;
$$;
revoke all on function public.sync_account_subscription(uuid,text,text,text,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.sync_account_subscription(uuid,text,text,text,text,timestamptz,text) to service_role;

create or replace function public.member_weight_access()
returns boolean language sql stable set search_path = '' as $$
 select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and (
   p.role='superadmin' or
   (p.dual_role and p.admin_override is distinct from 'locked' and (
     p.member_subscription->>'admin_override'='unlocked' or
     (p.member_subscription->>'admin_override' is distinct from 'locked' and p.member_subscription->>'subscription_status' in ('active','trialing'))
   )) or
   (not p.dual_role and (p.role='coach' or p.admin_override='unlocked' or (p.admin_override is distinct from 'locked' and p.subscription_status in ('active','trialing'))))
 ));
$$;
-- Dual-role coaches can still review their clients' weights, but not bypass their own Pro gate.
alter policy member_weight_requires_pro on public.weight_log using (
 (select public.member_weight_access()) or exists(select 1 from public.clients c where c.id=weight_log.client_id and c.coach_id=(select auth.uid()) and c.profile_id is distinct from (select auth.uid()))
) with check (
 (select public.member_weight_access()) or exists(select 1 from public.clients c where c.id=weight_log.client_id and c.coach_id=(select auth.uid()) and c.profile_id is distinct from (select auth.uid()))
);
