begin;
grant usage on schema private to service_role;
-- Only the confirmation endpoint can set this server-owned proof of email ownership.
create or replace function private.retail_account(uid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=uid and email_confirmed_at is not null and raw_app_meta_data->>'account_type'='retailer' and raw_app_meta_data->>'retail_verified_email'=email);
$$;
create table private.retail_email_limits (bucket text primary key, started_at timestamptz not null, attempts integer not null);
alter table private.retail_email_limits enable row level security;
revoke all on private.retail_email_limits from public,anon,authenticated;
create function private.retail_email_limit(bucket_key text,max_attempts integer,window_seconds integer) returns boolean language plpgsql security definer set search_path='' as $$declare n integer;begin
 if length(bucket_key)>150 or max_attempts not between 1 and 1000 or window_seconds not between 30 and 86400 then raise exception 'Invalid limit';end if;
 insert into private.retail_email_limits as limits values(bucket_key,now(),1) on conflict(bucket) do update set attempts=case when limits.started_at<now()-make_interval(secs=>window_seconds) then 1 else limits.attempts+1 end,started_at=case when limits.started_at<now()-make_interval(secs=>window_seconds) then now() else limits.started_at end returning attempts into n;
 delete from private.retail_email_limits where started_at<now()-interval '2 days';
 return n<=max_attempts;
end$$;
revoke all on function private.retail_email_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function private.retail_email_limit(text,integer,integer) to service_role;
create function public.retail_email_limit(bucket_key text,max_attempts integer,window_seconds integer) returns boolean language sql security invoker set search_path='' as $$select private.retail_email_limit(bucket_key,max_attempts,window_seconds);$$;
revoke all on function public.retail_email_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.retail_email_limit(text,integer,integer) to service_role;
create function private.retail_email_identity(address text) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('id',id,'email',email,'confirmed',email_confirmed_at is not null,'account_type',raw_app_meta_data->>'account_type','verified_email',raw_app_meta_data->>'retail_verified_email') from auth.users where lower(email)=lower(trim(address));$$;
revoke all on function private.retail_email_identity(text) from public,anon,authenticated;
grant execute on function private.retail_email_identity(text) to service_role;
create function public.retail_email_identity(address text) returns jsonb language sql security invoker set search_path='' as $$select private.retail_email_identity(address);$$;
revoke all on function public.retail_email_identity(text) from public,anon,authenticated;
grant execute on function public.retail_email_identity(text) to service_role;
-- Service-only functions above are intentionally not available to browser roles.
create function private.retail_invitation_email(iid uuid) returns jsonb language plpgsql security definer set search_path='' as $$declare i public.retail_invitations;begin
 select * into i from public.retail_invitations where id=iid;
 if i.id is null or i.accepted_at is not null or i.expires_at<=now() then raise exception 'Invitation unavailable';end if;
 if not private.retail_admin() and (not private.retail_account(auth.uid()) or i.created_by<>auth.uid() or not (private.retail_org_access(i.organization_id,true) or private.retail_location_access(i.location_id,i.role<>'customer'))) then raise exception 'Active store staff required';end if;
 return to_jsonb(i)||jsonb_build_object('store_name',(select name from public.retail_organizations where id=i.organization_id));
end$$;
revoke all on function private.retail_invitation_email(uuid) from public,anon;
grant execute on function private.retail_invitation_email(uuid) to authenticated;
create function public.retail_invitation_email(iid uuid) returns jsonb language sql security invoker set search_path='' as $$select private.retail_invitation_email(iid);$$;
revoke all on function public.retail_invitation_email(uuid) from public,anon;
grant execute on function public.retail_invitation_email(uuid) to authenticated;
-- Gate every retailer mutation, including staff invitation acceptance.
alter function private.retail_command(text,jsonb) rename to retail_command_before_email_confirmation;
revoke all on function private.retail_command_before_email_confirmation(text,jsonb) from public,anon,authenticated;
create function private.retail_command(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$begin
 if exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'account_type'='retailer') and not private.retail_account(auth.uid()) then raise exception 'Confirm your retailer email before accessing your account';end if;
 return private.retail_command_before_email_confirmation(action,payload);
end$$;
revoke all on function private.retail_command(text,jsonb) from public,anon;
grant execute on function private.retail_command(text,jsonb) to authenticated;
create or replace function public.retail_command(action text,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.retail_command(action,payload);$$;

create or replace function private.retail_location_access(lid uuid, management boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select private.retail_admin() or (private.retail_account(auth.uid()) and exists(select 1 from public.retail_staff s join public.retail_locations l on l.id=lid join public.retail_organizations o on o.id=l.organization_id
 where s.user_id=auth.uid() and s.active and o.enabled and s.organization_id=l.organization_id and
 ((s.location_id=l.id and (not management or s.role='manager')) or s.role='organization_admin' or (s.role='operator' and s.operator_id=l.operator_id)))); $$;

create or replace function private.retail_org_access(oid uuid, management boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select private.retail_admin() or (private.retail_account(auth.uid()) and exists(select 1 from public.retail_staff s join public.retail_organizations o on o.id=s.organization_id where s.user_id=auth.uid() and s.active and s.organization_id=oid and o.enabled and (not management or s.role='organization_admin'))); $$;

create or replace function private.retail_customer_access(rid uuid, staff_only boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.retail_relationships r join public.retail_locations l on l.id=r.location_id join public.retail_organizations o on o.id=l.organization_id where r.id=rid and (
 (not staff_only and r.profile_id=auth.uid()) or private.retail_admin() or
 (private.retail_account(auth.uid()) and o.enabled and l.enabled and r.status<>'ended' and exists(select 1 from public.retail_staff s where s.active and s.user_id=auth.uid() and s.location_id=l.id and (s.role='manager' or (s.role='specialist' and (r.assigned_to=auth.uid() or r.assigned_to is null))))))); $$;

commit;
