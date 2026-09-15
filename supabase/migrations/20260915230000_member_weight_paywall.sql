-- Additional restrictions; existing ownership/coach policies still apply.
-- No historical entries are removed. Service-role maintenance is unaffected.
create or replace function public.member_weight_access()
returns boolean language sql stable security invoker set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and (
      p.role in ('coach', 'superadmin') or
      p.admin_override = 'unlocked' or
      (p.admin_override is distinct from 'locked' and p.subscription_status in ('active', 'trialing'))
    )
  );
$$;
revoke all on function public.member_weight_access() from public, anon;
grant execute on function public.member_weight_access() to authenticated;

create policy member_weight_requires_pro on public.weight_log
as restrictive for all to authenticated
using ((select public.member_weight_access()))
with check ((select public.member_weight_access()));

-- Free members can still send a check-in without a weight measurement.
create policy checkin_weight_insert_requires_pro on public.checkins
as restrictive for insert to authenticated
with check (weight is null or (select public.member_weight_access()));

create policy checkin_weight_update_requires_pro on public.checkins
as restrictive for update to authenticated
using (true)
with check (weight is null or (select public.member_weight_access()));
