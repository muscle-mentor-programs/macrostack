begin;
-- The account realm is issued by the registration server, never user_metadata.
create function private.retail_account(uid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=uid and raw_app_meta_data->>'account_type'='retailer');
$$;
revoke all on function private.retail_account(uuid) from public,anon,authenticated;

create function private.retail_staff_account_guard() returns trigger language plpgsql security definer set search_path='' as $$begin
 if not private.retail_account(new.user_id) then raise exception 'A separate retailer account with a different work email is required';end if;
 return new;
end$$;
revoke all on function private.retail_staff_account_guard() from public,anon,authenticated;
create trigger retail_staff_account_guard before insert or update of user_id,active on public.retail_staff for each row execute function private.retail_staff_account_guard();

alter function private.retail_command(text,jsonb) rename to retail_command_before_account_separation;
revoke all on function private.retail_command_before_account_separation(text,jsonb) from public,anon,authenticated;
create function private.retail_command(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare retailer boolean:=private.retail_account(auth.uid()); invite_role text;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 if action='start_workspace' and not retailer then raise exception 'Create a separate retailer account with a different work email';end if;
 if action='accept_invite' then
  select role into invite_role from public.retail_invitations where token=(payload->>'token')::uuid;
  if invite_role is not null and invite_role<>'customer' and not retailer then raise exception 'Sign in with a separate retailer account to accept this staff invitation';end if;
  if invite_role='customer' and retailer then raise exception 'Use your personal MacroStack account for a customer connection';end if;
 end if;
 if action='join' and retailer then raise exception 'Use your personal MacroStack account for a customer connection';end if;
 return private.retail_command_before_account_separation(action,payload);
end$$;
revoke all on function private.retail_command(text,jsonb) from public,anon;
grant execute on function private.retail_command(text,jsonb) to authenticated;
create or replace function public.retail_command(action text,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.retail_command(action,payload);$$;
commit;
