begin;
alter table public.retail_locations add column billing_required boolean not null default false;
create table public.retail_self_service_accounts (
 user_id uuid primary key references public.profiles,
 organization_id uuid not null unique references public.retail_organizations,
 location_id uuid not null references public.retail_locations,
 created_at timestamptz not null default now()
);
alter table public.retail_self_service_accounts enable row level security;
revoke all on public.retail_self_service_accounts from public,anon,authenticated;
grant select on public.retail_self_service_accounts to authenticated;
grant all on public.retail_self_service_accounts to service_role;
create policy retail_owner_read on public.retail_self_service_accounts for select to authenticated using(user_id=(select auth.uid()));

alter function private.retail_command(text,jsonb) rename to retail_command_before_signup;
revoke all on function private.retail_command_before_signup(text,jsonb) from public,anon,authenticated;
create function private.retail_command(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); oid uuid; lid uuid:=(payload->>'location_id')::uuid; op uuid; result jsonb; existing public.retail_self_service_accounts; c public.retail_contracts; mail text; rid uuid:=(payload->>'relationship_id')::uuid;
begin
 if uid is null then raise exception 'Sign in required';end if;
 if not exists(select 1 from public.profiles where id=uid and admin_override is distinct from 'locked') then raise exception 'Account unavailable';end if;
 if octet_length(payload::text)>150000 then raise exception 'Request too large';end if;
 if action='start_workspace' then
  perform 1 from public.profiles where id=uid for update;
  select * into existing from public.retail_self_service_accounts where user_id=uid;
  if existing.user_id is not null then
   if not private.retail_org_access(existing.organization_id,true) then raise exception 'Workspace access was removed. Contact your administrator';end if;
   return jsonb_build_object('organization_id',existing.organization_id,'location_id',existing.location_id);
  end if;
  if coalesce(length(trim(payload->>'name')),0) not between 1 and 120 or coalesce(length(trim(payload->>'location_name')),0) not between 1 and 120 then raise exception 'Business and store names are required (120 characters maximum)';end if;
  if not exists(select 1 from pg_timezone_names where name=payload->>'timezone') then raise exception 'Choose a valid timezone';end if;
  select email into mail from auth.users where id=uid;
  if coalesce(payload->>'billing_email',mail,'')!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or coalesce(length(trim(payload->>'billing_name')),0) not between 1 and 150 then raise exception 'Billing contact name and email required';end if;
  insert into public.retail_organizations(name,enabled) values(trim(payload->>'name'),true) returning id into oid;
  insert into public.retail_operators(organization_id,name,kind) values(oid,trim(payload->>'name'),'corporate') returning id into op;
  insert into public.retail_locations(organization_id,operator_id,name,timezone,enabled,billing_required) values(oid,op,trim(payload->>'location_name'),payload->>'timezone',false,true) returning id into lid;
  insert into public.retail_staff(organization_id,user_id,role) values(oid,uid,'organization_admin');
  insert into public.retail_staff(organization_id,location_id,user_id,role) values(oid,lid,uid,'manager');
  insert into public.retail_contracts(location_id,billing_name,billing_email) values(lid,trim(payload->>'billing_name'),lower(trim(coalesce(payload->>'billing_email',mail))));
  insert into public.retail_self_service_accounts(user_id,organization_id,location_id) values(uid,oid,lid);
  insert into public.retail_audit(organization_id,location_id,actor_id,action,subject_id) values(oid,lid,uid,'start_workspace',oid);
  return jsonb_build_object('organization_id',oid,'location_id',lid);
 elsif action='contract' and not private.retail_admin() and exists(select 1 from public.retail_locations where id=lid and billing_required) then
  select organization_id into oid from public.retail_locations where id=lid and billing_required;
  if oid is null or not private.retail_org_access(oid,true) then raise exception 'Business administrator required';end if;
  select * into c from public.retail_contracts where location_id=lid for update;
  if c.id is null or c.revision is distinct from (payload->>'revision')::integer then raise exception 'Refresh billing before saving';end if;
  if c.stripe_subscription_id is not null or c.checkout_id is not null then raise exception 'Billing already started. Manage the existing subscription';end if;
  if coalesce(payload->>'billing_email','')!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or coalesce(length(trim(payload->>'billing_name')),0) not between 1 and 150 then raise exception 'Billing contact name and email required';end if;
  update public.retail_contracts set billing_name=trim(payload->>'billing_name'),billing_email=lower(trim(payload->>'billing_email')),revision=revision+1,updated_at=now() where id=c.id returning to_jsonb(retail_contracts.*) into result;
  insert into public.retail_audit(organization_id,location_id,actor_id,action,subject_id) values(oid,lid,uid,'contract',c.id);
  return result;
 end if;
 if action='location' and lid is not null and coalesce((payload->>'enabled')::boolean,false) and exists(select 1 from public.retail_locations where id=lid and billing_required and (sponsorship_ends_at is null or sponsorship_ends_at<=now())) then raise exception 'Activate this store subscription before enabling customer access';end if;
 if rid is not null and action not in ('contact_preferences','relationship') and exists(select 1 from public.retail_relationships r join public.retail_locations l on l.id=r.location_id where r.id=rid and l.billing_required and (not l.enabled or l.sponsorship_ends_at is null or l.sponsorship_ends_at<=now())) then raise exception 'The store subscription needs attention';end if;
 if action in ('join','accept_invite') then
  if action='join' then select id into lid from public.retail_locations where join_code=(payload->>'code')::uuid;
  else select location_id into lid from public.retail_invitations where token=(payload->>'token')::uuid and role='customer';end if;
  if exists(select 1 from public.retail_locations where id=lid and billing_required and (sponsorship_ends_at is null or sponsorship_ends_at<=now())) then raise exception 'The store subscription needs attention';end if;
 end if;
 if action='prospect' and exists(select 1 from public.retail_locations where id=lid and billing_required and (sponsorship_ends_at is null or sponsorship_ends_at<=now())) then raise exception 'Activate this store subscription before adding customers';end if;
 result:=private.retail_command_before_signup(action,payload);
 if action='location' and lid is null and exists(select 1 from public.retail_self_service_accounts where organization_id=(payload->>'organization_id')::uuid) then
  lid:=(result->>'location_id')::uuid;
  update public.retail_locations set billing_required=true,enabled=false where id=lid;
  insert into public.retail_contracts(location_id,billing_name,billing_email) select lid,bill.billing_name,bill.billing_email from public.retail_self_service_accounts s join public.retail_contracts bill on bill.location_id=s.location_id where s.organization_id=(payload->>'organization_id')::uuid;
  insert into public.retail_staff(organization_id,location_id,user_id,role) values((payload->>'organization_id')::uuid,lid,uid,'manager') on conflict do nothing;
 end if;
 return result;
end$$;
revoke all on function private.retail_command(text,jsonb) from public,anon;
grant execute on function private.retail_command(text,jsonb) to authenticated;
create or replace function public.retail_command(action text,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.retail_command(action,payload);$$;

-- Provider synchronization retains the existing customer/subscription checks.
create or replace function public.retail_sync_contract(cid uuid,subscription_id text,customer_id text,subscription_status text,paid_until timestamptz) returns void language plpgsql security definer set search_path='' as $$declare c public.retail_contracts;begin
 select * into c from public.retail_contracts where id=cid for update;
 if c.id is null or c.stripe_customer_id is distinct from customer_id then raise exception 'Contract customer mismatch';end if;
 if c.stripe_subscription_id is not null and c.stripe_subscription_id<>subscription_id then raise exception 'Different subscription already linked';end if;
 update public.retail_contracts set stripe_subscription_id=subscription_id,status=subscription_status,period_end=case when subscription_status in ('active','trialing') then paid_until else period_end end,updated_at=now() where id=cid;
 if subscription_status in ('active','trialing') and paid_until>now() then update public.retail_locations set sponsorship_ends_at=paid_until,enabled=case when billing_required then true else enabled end where id=c.location_id;
 elsif subscription_status in ('canceled','unpaid','incomplete_expired','paused') then update public.retail_locations set sponsorship_ends_at=least(sponsorship_ends_at,now()),enabled=case when billing_required then false else enabled end where id=c.location_id;
 end if;
end$$;
create or replace function private.retail_active(rid uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.retail_relationships r join public.retail_locations l on l.id=r.location_id join public.retail_organizations o on o.id=l.organization_id where r.id=rid and r.status='active' and l.enabled and o.enabled and (not l.billing_required or l.sponsorship_ends_at>now()));$$;
commit;
