begin;
create table public.retail_contracts(
 id uuid primary key default gen_random_uuid(),location_id uuid not null unique references public.retail_locations,
 seller text not null default 'MacroStack, LLC',monthly_cents integer not null default 59900 check(monthly_cents>0),currency text not null default 'usd' check(currency='usd'),
 billing_name text not null,billing_email text not null,status text not null default 'draft',
 stripe_customer_id text,stripe_subscription_id text unique,checkout_id text,checkout_url text,checkout_expires_at timestamptz,
 checkout_lock_until timestamptz,period_end timestamptz,revision integer not null default 1,updated_at timestamptz not null default now()
);
create table public.retail_contact_preferences(
 relationship_id uuid primary key references public.retail_relationships,email_enabled boolean not null default false,sms_enabled boolean not null default false,
 verified_phone text,consent_version text not null default 'retail-service-v1',consent_at timestamptz not null default now(),unsubscribe_token uuid not null default gen_random_uuid() unique
);
create table public.retail_deliveries(
 id uuid primary key default gen_random_uuid(),notification_id uuid not null references public.retail_notifications,relationship_id uuid not null references public.retail_relationships,
 channel text not null check(channel in ('email','sms')),status text not null default 'queued' check(status in ('queued','sending','accepted','delivered','failed','suppressed','unknown')),
 attempts integer not null default 0,provider_id text,error_code text,available_at timestamptz not null default now(),claimed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(notification_id,channel)
);
create index retail_delivery_queue on public.retail_deliveries(available_at) where status='queued';
create index retail_delivery_customer on public.retail_deliveries(relationship_id,created_at desc);
create index retail_delivery_provider on public.retail_deliveries(provider_id) where provider_id is not null;
create table public.retail_pilot_settings(
 organization_id uuid primary key references public.retail_organizations,public_name text not null,contact_email text not null default '',onboarding_notes text not null default '',
 forms_approved boolean not null default false,brand_approved boolean not null default false,staff_trained boolean not null default false,revision integer not null default 1,updated_at timestamptz not null default now()
);
do $$declare t text;begin foreach t in array array['contracts','contact_preferences','deliveries','pilot_settings'] loop
 execute format('alter table public.retail_%I enable row level security',t);
 execute format('revoke all on public.retail_%I from anon,authenticated',t);
 execute format('grant select on public.retail_%I to authenticated',t);
 execute format('grant all on public.retail_%I to service_role',t);
end loop;end$$;
create policy retail_contract_read on public.retail_contracts for select to authenticated using(private.retail_location_access(location_id,true));
create policy retail_contact_read on public.retail_contact_preferences for select to authenticated using(private.retail_is_customer(relationship_id));
create policy retail_delivery_read on public.retail_deliveries for select to authenticated using(private.retail_customer_access(relationship_id,true));
create policy retail_pilot_read on public.retail_pilot_settings for select to authenticated using(private.retail_org_access(organization_id));

alter function private.retail_command(text,jsonb) rename to retail_command_base;
create function private.retail_command(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();rid uuid:=(payload->>'relationship_id')::uuid;lid uuid:=(payload->>'location_id')::uuid;oid uuid;result jsonb;phone text;c public.retail_contracts;begin
 if uid is null then raise exception 'Sign in required';end if;
 if exists(select 1 from public.profiles where id=uid and admin_override='locked') then raise exception 'Account access is locked';end if;
 if octet_length(payload::text)>150000 then raise exception 'Request too large';end if;
 if action='contract' then
  if not private.retail_admin() then raise exception 'Superadmin required';end if;
  if coalesce(payload->>'billing_email','')!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or coalesce(trim(payload->>'billing_name'),'')='' then raise exception 'Billing name and email required';end if;
  select * into c from public.retail_contracts where location_id=lid for update;
  if c.stripe_subscription_id is not null or c.checkout_id is not null then raise exception 'Billing already started. Manage the existing subscription';end if;
  if c.id is not null and c.revision is distinct from (payload->>'revision')::integer then raise exception 'Contract changed. Refresh before saving';end if;
  insert into public.retail_contracts(location_id,billing_name,billing_email) values(lid,left(payload->>'billing_name',150),lower(trim(payload->>'billing_email'))) on conflict(location_id) do update set billing_name=excluded.billing_name,billing_email=excluded.billing_email,revision=public.retail_contracts.revision+1,updated_at=now() returning to_jsonb(retail_contracts.*) into result;
 elsif action='contact_preferences' then
  if not private.retail_is_customer(rid) or not private.retail_active(rid) then raise exception 'Active customer required';end if;
  select case when phone_confirmed_at is not null then '+'||ltrim(u.phone,'+') end into phone from auth.users u where id=uid;
  if coalesce((payload->>'sms_enabled')::boolean,false) and phone is null then raise exception 'Verify your phone number before enabling text reminders';end if;
  insert into public.retail_contact_preferences(relationship_id,email_enabled,sms_enabled,verified_phone) values(rid,coalesce((payload->>'email_enabled')::boolean,false),coalesce((payload->>'sms_enabled')::boolean,false),phone) on conflict(relationship_id) do update set email_enabled=excluded.email_enabled,sms_enabled=excluded.sms_enabled,verified_phone=excluded.verified_phone,consent_at=now();
  update public.retail_deliveries set status='suppressed',error_code='consent_changed',updated_at=now() where relationship_id=rid and status='queued' and ((channel='email' and not coalesce((payload->>'email_enabled')::boolean,false)) or (channel='sms' and not coalesce((payload->>'sms_enabled')::boolean,false)));
 elsif action='pilot_settings' then
  oid:=(payload->>'organization_id')::uuid;
  if not private.retail_org_access(oid,true) then raise exception 'Organization administrator required';end if;
  perform 1 from public.retail_pilot_settings where organization_id=oid for update;
  if exists(select 1 from public.retail_pilot_settings where organization_id=oid and revision is distinct from (payload->>'revision')::integer) then raise exception 'Settings changed. Refresh before saving';end if;
  insert into public.retail_pilot_settings(organization_id,public_name,contact_email,onboarding_notes,forms_approved,brand_approved,staff_trained) values(oid,left(payload->>'public_name',120),left(coalesce(payload->>'contact_email',''),200),left(coalesce(payload->>'onboarding_notes',''),5000),coalesce((payload->>'forms_approved')::boolean,false),coalesce((payload->>'brand_approved')::boolean,false),coalesce((payload->>'staff_trained')::boolean,false)) on conflict(organization_id) do update set public_name=excluded.public_name,contact_email=excluded.contact_email,onboarding_notes=excluded.onboarding_notes,forms_approved=excluded.forms_approved,brand_approved=excluded.brand_approved,staff_trained=excluded.staff_trained,revision=public.retail_pilot_settings.revision+1,updated_at=now();
 else return private.retail_command_base(action,payload);
 end if;
 if lid is not null then select organization_id into oid from public.retail_locations where id=lid;end if;
 if rid is not null then select location_id into lid from public.retail_relationships where id=rid;select organization_id into oid from public.retail_locations where id=lid;end if;
 insert into public.retail_audit(organization_id,location_id,actor_id,action,subject_id) values(oid,lid,uid,action,coalesce(rid,lid,oid));
 return coalesce(result,'{}');end$$;
create or replace function public.retail_command(action text,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.retail_command(action,payload);$$;
revoke all on function private.retail_command(text,jsonb) from public,anon;
grant execute on function private.retail_command(text,jsonb) to authenticated;

-- Provider acknowledgements never grant access from unverified browser payloads.
create function public.retail_sync_contract(cid uuid,subscription_id text,customer_id text,subscription_status text,paid_until timestamptz) returns void language plpgsql security definer set search_path='' as $$declare c public.retail_contracts;begin
 select * into c from public.retail_contracts where id=cid for update;
 if c.id is null or c.stripe_customer_id is distinct from customer_id then raise exception 'Contract customer mismatch';end if;
 if c.stripe_subscription_id is not null and c.stripe_subscription_id<>subscription_id then raise exception 'Different subscription already linked';end if;
 update public.retail_contracts set stripe_subscription_id=subscription_id,status=subscription_status,period_end=case when subscription_status in ('active','trialing') then paid_until else period_end end,updated_at=now() where id=cid;
 if subscription_status in ('active','trialing') and paid_until>now() then update public.retail_locations set sponsorship_ends_at=paid_until where id=c.location_id;
 elsif subscription_status in ('canceled','unpaid','incomplete_expired','paused') then update public.retail_locations set sponsorship_ends_at=least(sponsorship_ends_at,now()) where id=c.location_id;
 end if;
end$$;
revoke all on function public.retail_sync_contract(uuid,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.retail_sync_contract(uuid,text,text,text,timestamptz) to service_role;

-- Global unsubscribe tokens can only remove consent, never grant access.
create function public.retail_unsubscribe(token uuid) returns void language sql security definer set search_path='' as $$
 update public.retail_contact_preferences set email_enabled=false,sms_enabled=false,consent_at=now() where unsubscribe_token=token;
 update public.retail_deliveries set status='suppressed',error_code='unsubscribed',updated_at=now() where status='queued' and relationship_id in(select relationship_id from public.retail_contact_preferences where unsubscribe_token=token);
$$;
revoke all on function public.retail_unsubscribe(uuid) from public,anon,authenticated;
grant execute on function public.retail_unsubscribe(uuid) to service_role;

create function public.retail_claim_deliveries(batch_size integer default 25) returns setof public.retail_deliveries language plpgsql security definer set search_path='' as $$begin
 perform public.retail_process_reminders();
 insert into public.retail_deliveries(notification_id,relationship_id,channel)
 select n.id,n.relationship_id,ch.channel from public.retail_notifications n join public.retail_relationships r on r.id=n.relationship_id join public.retail_contact_preferences p on p.relationship_id=r.id cross join (values('email'),('sms')) ch(channel)
 where n.created_at>=now()-interval '1 day' and r.status='active' and r.service_reminders and private.retail_active(r.id) and n.created_at>=p.consent_at and ((ch.channel='email' and p.email_enabled) or (ch.channel='sms' and p.sms_enabled)) on conflict(notification_id,channel) do nothing;
 -- Ambiguous SMS sends are never automatically replayed. Email uses a provider idempotency key.
 update public.retail_deliveries set status=case when channel='email' and attempts<5 and created_at>now()-interval '23 hours' then 'queued' else 'unknown' end,available_at=now(),updated_at=now() where status='sending' and claimed_at<now()-interval '10 minutes';
 return query update public.retail_deliveries d set status='sending',claimed_at=now(),attempts=d.attempts+1,updated_at=now() where d.id in(select x.id from public.retail_deliveries x where x.status='queued' and x.available_at<=now() and x.attempts<5 order by x.created_at limit greatest(1,least(batch_size,50)) for update skip locked) returning d.*;
end$$;
create function public.retail_delivery_target(did uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare result jsonb;begin
 select jsonb_build_object('email',u.email,'phone',p.verified_phone,'unsubscribe',p.unsubscribe_token,'store',l.name,'timezone',l.timezone) into result
 from public.retail_deliveries d join public.retail_relationships r on r.id=d.relationship_id join public.retail_contact_preferences p on p.relationship_id=r.id join auth.users u on u.id=r.profile_id join public.retail_locations l on l.id=r.location_id
 where d.id=did and not exists(select 1 from public.profiles pr where pr.id=r.profile_id and pr.admin_override='locked') and d.status='sending' and r.status='active' and r.service_reminders and private.retail_active(r.id)
 and (d.channel='email' and p.email_enabled or d.channel='sms' and p.sms_enabled and u.phone_confirmed_at is not null and '+'||ltrim(u.phone,'+')=p.verified_phone);
 return result;end$$;
revoke all on function public.retail_claim_deliveries(integer),public.retail_delivery_target(uuid) from public,anon,authenticated;
grant execute on function public.retail_claim_deliveries(integer),public.retail_delivery_target(uuid) to service_role;
create function public.retail_billing_lock(cid uuid,release_lock boolean default false) returns boolean language plpgsql security definer set search_path='' as $$begin
 if release_lock then update public.retail_contracts set checkout_lock_until=null where id=cid;return true;end if;
 update public.retail_contracts set checkout_lock_until=now()+interval '2 minutes' where id=cid and (checkout_lock_until is null or checkout_lock_until<now());return found;
end$$;
revoke all on function public.retail_billing_lock(uuid,boolean) from public,anon,authenticated;
grant execute on function public.retail_billing_lock(uuid,boolean) to service_role;
-- The scheduler remains inert until a server credential is placed in Vault.
-- No provider credential or service-role key is embedded in migration history.
do $setup$begin
 if exists(select 1 from pg_extension where extname='pg_cron') and exists(select 1 from pg_extension where extname='pg_net') then
  execute $job$select cron.schedule('retail-external-reminders','*/5 * * * *',
   $command$select net.http_post(
    url:='https://ryvsbidtwhxfmashwsqt.supabase.co/functions/v1/retail-delivery',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||decrypted_secret),
    body:='{}'::jsonb,timeout_milliseconds:=10000
   ) from vault.decrypted_secrets where name='retail_delivery_worker_key'$command$)$job$;
 end if;
end$setup$;
commit;
