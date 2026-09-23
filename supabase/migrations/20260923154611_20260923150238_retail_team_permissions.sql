begin;
-- Keep the original scope roles for backwards compatibility. access_role specifies
-- the new capability preset; null preserves the original employee's permissions.
alter table public.retail_staff add column access_role text check(access_role in ('organization_admin','operator','regional','manager','specialist','associate','reviewer')),
 add column permissions jsonb not null default '{}', add column revision integer not null default 1;
alter table public.retail_invitations add column access_role text,
 add column permissions jsonb not null default '{}', add column canceled_at timestamptz,
 add column location_ids uuid[] not null default '{}';

create function private.retail_capability(s public.retail_staff, capability text) returns boolean language sql immutable set search_path='' as $$
 select coalesce((s.permissions->>capability)::boolean,
 case capability
 when 'customers' then coalesce(s.access_role,s.role) in ('organization_admin','operator','regional','manager','specialist','associate','reviewer')
 when 'customer_write' then coalesce(s.access_role,s.role) in ('organization_admin','operator','regional','manager','specialist','associate')
 when 'nutrition' then coalesce(s.access_role,s.role) in ('organization_admin','operator','regional','manager','specialist')
 when 'chat' then coalesce(s.access_role,s.role) in ('organization_admin','operator','regional','manager','specialist','associate')
 when 'resources' then coalesce(s.access_role,s.role) in ('organization_admin','operator','regional','manager','specialist','associate')
 when 'resource_manage' then coalesce(s.access_role,s.role) in ('organization_admin','operator','regional','manager')
 when 'team' then coalesce(s.access_role,s.role) in ('organization_admin','operator','regional','manager')
 when 'reports' then coalesce(s.access_role,s.role) in ('organization_admin','operator','regional','manager','reviewer')
 when 'exports' then coalesce(s.access_role,s.role) in ('organization_admin','operator','regional','manager','specialist')
 when 'delete_customer' then coalesce(s.access_role,s.role) in ('organization_admin','operator','regional','manager')
 when 'billing' then coalesce(s.access_role,s.role) in ('organization_admin','operator','manager')
 when 'branding' then coalesce(s.access_role,s.role)='organization_admin'
 else false end);
$$;
create function private.retail_can(lid uuid,capability text) returns boolean language sql stable security definer set search_path='' as $$
 select private.retail_admin() or (private.retail_account(auth.uid()) and exists(
 select 1 from public.retail_staff s join public.retail_locations l on l.id=lid join public.retail_organizations o on o.id=l.organization_id
 where s.user_id=auth.uid() and s.active and o.enabled and s.organization_id=l.organization_id
 and (s.location_id=l.id or s.role='organization_admin' or (s.role='operator' and s.operator_id=l.operator_id))
 and private.retail_capability(s,capability)));
$$;
create function private.retail_org_can(oid uuid, capability text) returns boolean language sql stable security definer set search_path='' as $$
 select private.retail_org_access(oid,true) and exists(
   select 1 from public.retail_locations l where l.organization_id=oid and private.retail_can(l.id,capability));
$$;
revoke all on function private.retail_org_can(uuid,text) from public,anon;
grant execute on function private.retail_org_can(uuid,text) to authenticated;
create function private.retail_customer_can(rid uuid,capability text) returns boolean language sql stable security definer set search_path='' as $$
 select private.retail_customer_access(rid,true) and private.retail_can((select location_id from public.retail_relationships where id=rid),capability);
$$;
revoke all on function private.retail_capability(public.retail_staff,text), private.retail_can(uuid,text),private.retail_customer_can(uuid,text) from public,anon;
grant execute on function private.retail_capability(public.retail_staff,text), private.retail_can(uuid,text),private.retail_customer_can(uuid,text) to authenticated;

create or replace function private.retail_customer_access(rid uuid, staff_only boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.retail_relationships r join public.retail_locations l on l.id=r.location_id join public.retail_organizations o on o.id=l.organization_id
 where r.id=rid and r.deleted_at is null and ((not staff_only and r.profile_id=auth.uid()) or private.retail_admin() or
 (private.retail_account(auth.uid()) and o.enabled and l.enabled and r.status<>'ended' and exists(
 select 1 from public.retail_staff s where s.active and s.user_id=auth.uid() and s.organization_id=l.organization_id
 and (s.location_id=l.id or s.role='organization_admin' or (s.role='operator' and s.operator_id=l.operator_id))
 and private.retail_capability(s,'customers') and (s.role<>'specialist' or coalesce(s.access_role,'specialist') in ('regional','reviewer') or r.assigned_to=auth.uid() or r.assigned_to is null)))));
$$;
create function public.retail_permissions(lid uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_object_agg(c,private.retail_can(lid,c)) from unnest(array['customers','customer_write','nutrition','chat','resources','resource_manage','team','reports','exports','delete_customer','billing','branding']) c;
$$;
revoke all on function public.retail_permissions(uuid) from public,anon;
grant execute on function public.retail_permissions(uuid) to authenticated;

-- Guard all older command paths. Existing validation and revision checks remain.
alter function private.retail_command(text,jsonb) rename to retail_command_before_team;
revoke all on function private.retail_command_before_team(text,jsonb) from public,anon,authenticated;
create function private.retail_command(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare lid uuid;rid uuid;cap text;answer jsonb;i public.retail_invitations;extra_location uuid;begin
 if action in ('invite_staff','revoke_staff') then raise exception 'Use Team & permissions to manage employees';end if;
 if action='accept_invite' then
 select * into i from public.retail_invitations where token=(payload->>'token')::uuid for update;
 if i.canceled_at is not null then raise exception 'Invitation canceled';end if;
 end if;
 rid:=nullif(payload->>'relationship_id','')::uuid;lid:=nullif(payload->>'location_id','')::uuid;
 if rid is not null then select location_id into lid from public.retail_relationships where id=rid;end if;
 if action in ('location','operator','pilot_settings') and not private.retail_org_can((payload->>'organization_id')::uuid,'team') then
   raise exception 'Organization administrator required';
 end if;
 cap:=case when action in ('consultation','publish','assessment') then 'nutrition'
 when action in ('message','composing','thread') then 'chat'
 when action in ('prospect','relationship','note','task','review_checkin','file') then 'customer_write'
 when action in ('invite_staff','revoke_staff') then 'team'
 when action='template' then 'resource_manage'
 when action='contract' then 'billing' end;
 if cap is not null and not private.retail_is_customer(rid) and not private.retail_admin() then
  if lid is null and action='revoke_staff' then select location_id into lid from public.retail_staff where id=(payload->>'staff_id')::uuid;end if;
  if lid is null or not private.retail_can(lid,cap) then raise exception 'Your role does not allow this action';end if;
 end if;
 answer:=private.retail_command_before_team(action,payload);
 if action='accept_invite' and i.role<>'customer' and i.accepted_at is null then
 update public.retail_staff set access_role=i.access_role,permissions=i.permissions,revision=revision+1
 where user_id=auth.uid() and organization_id=i.organization_id and location_id is not distinct from i.location_id and operator_id is not distinct from i.operator_id;
 if i.role in ('manager','specialist') then
 foreach extra_location in array i.location_ids loop
  if extra_location<>i.location_id then
   insert into public.retail_staff(organization_id,location_id,user_id,role,access_role,permissions)
   values(i.organization_id,extra_location,auth.uid(),i.role,i.access_role,i.permissions)
   on conflict do nothing;
   update public.retail_staff set active=true,access_role=i.access_role,permissions=i.permissions,revision=revision+1
   where organization_id=i.organization_id and location_id=extra_location and user_id=auth.uid();
  end if;
 end loop;
 end if;
 end if;
 return answer;
end$$;
revoke all on function private.retail_command(text,jsonb) from public,anon;
grant execute on function private.retail_command(text,jsonb) to authenticated;
create or replace function public.retail_command(action text,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.retail_command(action,payload);$$;

alter function private.retail_publish_nutrition(uuid,uuid,text,jsonb,jsonb) rename to retail_publish_nutrition_before_team;
revoke all on function private.retail_publish_nutrition_before_team(uuid,uuid,text,jsonb,jsonb) from public,anon,authenticated;
create function private.retail_publish_nutrition(rid uuid,request_id uuid,plan_name text,days jsonb,targets jsonb) returns uuid language plpgsql security definer set search_path='' as $$begin
 if not private.retail_customer_can(rid,'nutrition') then raise exception 'Your role does not allow this action';end if;
 return private.retail_publish_nutrition_before_team(rid,request_id,plan_name,days,targets);
end$$;
revoke all on function private.retail_publish_nutrition(uuid,uuid,text,jsonb,jsonb) from public,anon;
grant execute on function private.retail_publish_nutrition(uuid,uuid,text,jsonb,jsonb) to authenticated;
create or replace function public.retail_publish_nutrition(rid uuid,request_id uuid,plan_name text,days jsonb,targets jsonb) returns uuid language sql security invoker set search_path='' as $$select private.retail_publish_nutrition(rid,request_id,plan_name,days,targets);$$;

alter function private.retail_set_targets(uuid,jsonb) rename to retail_set_targets_before_team;
revoke all on function private.retail_set_targets_before_team(uuid,jsonb) from public,anon,authenticated;
create function private.retail_set_targets(rid uuid,targets jsonb) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.retail_customer_can(rid,'nutrition') then raise exception 'Your role does not allow this action';end if;
 perform private.retail_set_targets_before_team(rid,targets);
end$$;
revoke all on function private.retail_set_targets(uuid,jsonb) from public,anon;
grant execute on function private.retail_set_targets(uuid,jsonb) to authenticated;
create or replace function public.retail_set_targets(rid uuid,targets jsonb) returns void language sql security invoker set search_path='' as $$select private.retail_set_targets(rid,targets);$$;

alter function private.retail_remove_meal_plan(uuid,uuid) rename to retail_remove_meal_plan_before_team;
revoke all on function private.retail_remove_meal_plan_before_team(uuid,uuid) from public,anon,authenticated;
create function private.retail_remove_meal_plan(rid uuid,plan_id uuid) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.retail_customer_can(rid,'nutrition') then raise exception 'Your role does not allow this action';end if;
 perform private.retail_remove_meal_plan_before_team(rid,plan_id);
end$$;
revoke all on function private.retail_remove_meal_plan(uuid,uuid) from public,anon;
grant execute on function private.retail_remove_meal_plan(uuid,uuid) to authenticated;
create or replace function public.retail_remove_meal_plan(rid uuid,plan_id uuid) returns void language sql security invoker set search_path='' as $$select private.retail_remove_meal_plan(rid,plan_id);$$;

alter function private.retail_delete_customer(uuid,integer) rename to retail_delete_customer_before_team;
revoke all on function private.retail_delete_customer_before_team(uuid,integer) from public,anon,authenticated;
create function private.retail_delete_customer(rid uuid,expected_revision integer) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.retail_customer_can(rid,'delete_customer') then raise exception 'Your role does not allow this action';end if;
 perform private.retail_delete_customer_before_team(rid,expected_revision);
end$$;
revoke all on function private.retail_delete_customer(uuid,integer) from public,anon;
grant execute on function private.retail_delete_customer(uuid,integer) to authenticated;
create or replace function public.retail_delete_customer(rid uuid,expected_revision integer) returns void language sql security invoker set search_path='' as $$select private.retail_delete_customer(rid,expected_revision);$$;

alter function private.retail_set_avatar(uuid,text) rename to retail_set_avatar_before_team;
revoke all on function private.retail_set_avatar_before_team(uuid,text) from public,anon,authenticated;
create function private.retail_set_avatar(rid uuid,object_path text) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.retail_customer_can(rid,'customer_write') then raise exception 'Your role does not allow this action';end if;
 perform private.retail_set_avatar_before_team(rid,object_path);
end$$;
revoke all on function private.retail_set_avatar(uuid,text) from public,anon;
grant execute on function private.retail_set_avatar(uuid,text) to authenticated;
create or replace function public.retail_set_avatar(rid uuid,object_path text) returns void language sql security invoker set search_path='' as $$select private.retail_set_avatar(rid,object_path);$$;

-- Read-only reviewers may download authorized files but never upload them.
alter function private.retail_upload_path(text) rename to retail_upload_path_before_team;
revoke all on function private.retail_upload_path_before_team(text) from public,anon,authenticated;
create function private.retail_upload_path(path text) returns boolean language plpgsql stable security definer set search_path='' as $$declare rid uuid;begin
 begin rid:=split_part(path,'/',1)::uuid;exception when invalid_text_representation then return false;end;
 return private.retail_upload_path_before_team(path) and (private.retail_is_customer(rid) or private.retail_customer_can(rid,'customer_write'));
end$$;
revoke all on function private.retail_upload_path(text) from public,anon;
grant execute on function private.retail_upload_path(text) to authenticated;
-- PostgreSQL policies bind function OIDs. Rebind the renamed upload helper.
alter policy retail_file_upload on storage.objects with check(bucket_id='retail-files' and private.retail_upload_path(name));
alter policy retail_file_delete on storage.objects using(bucket_id='retail-files' and private.retail_upload_path(name));
alter policy retail_file_download on storage.objects using(bucket_id='retail-files' and (private.retail_upload_path(name) or exists(select 1 from public.retail_files f where f.object_path=objects.name and private.retail_customer_access(f.relationship_id))));
create or replace function private.retail_avatar_access(object_name text,write_access boolean default false) returns boolean language plpgsql stable security definer set search_path='' as $$declare rid uuid;begin
 if auth.uid() is null then return false;end if;
 begin rid:=split_part(object_name,'/',1)::uuid;exception when invalid_text_representation then return false;end;
 return case when write_access then private.retail_customer_can(rid,'customer_write') else private.retail_customer_access(rid) end;
end$$;
alter policy retail_contract_read on public.retail_contracts using(private.retail_can(location_id,'billing'));
create function private.retail_transfer_work(s public.retail_staff,replacement uuid,confirm_unassigned boolean) returns void language plpgsql security definer set search_path='' as $$begin
 if replacement is not null and (s.location_id is null or not exists(select 1 from public.retail_staff next where next.user_id=replacement and next.active and next.location_id=s.location_id and next.user_id<>s.user_id and private.retail_capability(next,'customer_write'))) then raise exception 'Choose an active employee in this store';end if;
 if replacement is null and not coalesce(confirm_unassigned,false) and (
  exists(select 1 from public.retail_relationships r join public.retail_locations l on l.id=r.location_id where r.assigned_to=s.user_id and l.organization_id=s.organization_id and (s.role='organization_admin' or l.operator_id=s.operator_id or l.id=s.location_id))
  or exists(select 1 from public.retail_tasks t join public.retail_relationships r on r.id=t.relationship_id join public.retail_locations l on l.id=r.location_id where t.assigned_to=s.user_id and t.status='open' and l.organization_id=s.organization_id and (s.role='organization_admin' or l.operator_id=s.operator_id or l.id=s.location_id))
  or exists(select 1 from public.retail_threads t join public.retail_relationships r on r.id=t.relationship_id join public.retail_locations l on l.id=r.location_id where t.assigned_to=s.user_id and t.status='open' and l.organization_id=s.organization_id and (s.role='organization_admin' or l.operator_id=s.operator_id or l.id=s.location_id))) then raise exception 'Choose a replacement or confirm the unassigned queue';end if;
 update public.retail_relationships r set assigned_to=replacement,revision=revision+1 where r.assigned_to=s.user_id and exists(select 1 from public.retail_locations l where l.id=r.location_id and l.organization_id=s.organization_id and (s.role='organization_admin' or l.operator_id=s.operator_id or l.id=s.location_id));
 update public.retail_tasks t set assigned_to=replacement,revision=revision+1 where t.assigned_to=s.user_id and t.status='open' and exists(select 1 from public.retail_relationships r join public.retail_locations l on l.id=r.location_id where r.id=t.relationship_id and l.organization_id=s.organization_id and (s.role='organization_admin' or l.operator_id=s.operator_id or l.id=s.location_id));
 update public.retail_threads t set assigned_to=replacement,revision=revision+1 where t.assigned_to=s.user_id and t.status='open' and exists(select 1 from public.retail_relationships r join public.retail_locations l on l.id=r.location_id where r.id=t.relationship_id and l.organization_id=s.organization_id and (s.role='organization_admin' or l.operator_id=s.operator_id or l.id=s.location_id));
end$$;
revoke all on function private.retail_transfer_work(public.retail_staff,uuid,boolean) from public,anon,authenticated;
create function private.retail_team_command(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare oid uuid:=(payload->>'organization_id')::uuid;lid uuid;target public.retail_staff;inv public.retail_invitations;
 candidate public.retail_staff;preset text:=payload->>'access_role';base text;perms jsonb:=coalesce(payload->'permissions','{}');k text;v jsonb;result jsonb;target_id uuid;scope_ids uuid[];scope_id uuid;
begin
 if auth.uid() is null or not (private.retail_admin() or private.retail_account(auth.uid())) then raise exception 'Verified retailer account required';end if;
 if exists(select 1 from public.profiles where id=auth.uid() and admin_override='locked') then raise exception 'Account locked';end if;
 perform pg_advisory_xact_lock(hashtextextended(oid::text,0));
 if action in ('update','suspend','reactivate') then
 select * into target from public.retail_staff where id=(payload->>'id')::uuid for update;
 if target.id is null or target.organization_id is distinct from oid then raise exception 'Employee unavailable';end if;
 lid:=target.location_id;
 if not (private.retail_org_can(oid,'team') or (target.role='specialist' and private.retail_can(lid,'team'))) then raise exception 'Team administrator required';end if;
 if target.user_id=auth.uid() then raise exception 'Another administrator must change your access';end if;
 if target.revision is distinct from (payload->>'revision')::integer then raise exception 'Employee changed. Refresh and retry';end if;
 if target.role='organization_admin' and target.active and (action='suspend' or (action='update' and preset<>'organization_admin')) and not exists(select 1 from public.retail_staff where organization_id=oid and role='organization_admin' and active and id<>target.id) then raise exception 'Keep at least one active chain administrator';end if;
 elsif action in ('cancel','renew') then
 select * into inv from public.retail_invitations where id=(payload->>'id')::uuid for update;
 if inv.id is null or inv.organization_id is distinct from oid or inv.role='customer' or inv.accepted_at is not null then raise exception 'Invitation unavailable';end if;
 lid:=inv.location_id;
 if not (private.retail_org_can(oid,'team') or (inv.role='specialist' and private.retail_can(lid,'team'))) then raise exception 'Team administrator required';end if;
 if action='cancel' then update public.retail_invitations set canceled_at=now(),expires_at=now() where id=inv.id;
 else update public.retail_invitations set canceled_at=null,expires_at=now()+interval '7 days',created_by=auth.uid() where id=inv.id;end if;
 select to_jsonb(i) into result from public.retail_invitations i where id=inv.id;
 elsif action='invite' then
 lid:=(payload->>'location_id')::uuid;
 if not (private.retail_org_can(oid,'team') or private.retail_can(lid,'team')) then raise exception 'Team administrator required';end if;
 else raise exception 'Unknown team action';end if;
 if action in ('invite','update') then
 if preset not in ('organization_admin','operator','regional','manager','specialist','associate','reviewer') or preset is null then raise exception 'Choose a role';end if;
 if not private.retail_org_can(oid,'team') and preset not in ('specialist','associate','reviewer') then raise exception 'Only chain administrators can grant management roles';end if;
 if jsonb_typeof(perms)<>'object' then raise exception 'Invalid permissions';end if;
 for k,v in select * from jsonb_each(perms) loop
 if k not in ('customers','customer_write','nutrition','chat','resources','resource_manage','team','reports','exports','delete_customer','billing','branding') or jsonb_typeof(v)<>'boolean' then raise exception 'Invalid permission';end if;
 if v='true' and not private.retail_org_can(oid,'team') and not private.retail_can(lid,k) then raise exception 'Cannot grant access you do not have';end if;
 end loop;
 if preset='reviewer' and exists(select 1 from jsonb_each(perms) where key not in ('customers','reports','exports') and value='true') then raise exception 'Reviewers cannot receive write permissions';end if;
 base:=case when preset in ('organization_admin','operator','manager') then preset when preset='regional' then 'manager' else 'specialist' end;
 if action='invite' and base in ('manager','specialist') then
  select array_agg(distinct value::uuid) into scope_ids from jsonb_array_elements_text(coalesce(payload->'location_ids',jsonb_build_array(lid))) value;
  if cardinality(scope_ids) is null or cardinality(scope_ids) not between 1 and 50 or not lid=any(scope_ids) then raise exception 'Choose 1–50 stores including the selected store';end if;
  foreach scope_id in array scope_ids loop
   if not exists(select 1 from public.retail_locations where id=scope_id and organization_id=oid) or not (private.retail_org_can(oid,'team') or private.retail_can(scope_id,'team')) then raise exception 'Store assignment unavailable';end if;
  end loop;
 end if;
 candidate.role:=base;candidate.access_role:=preset;candidate.permissions:=perms;
 if not private.retail_org_can(oid,'team') then
 for k in select unnest(array['customers','customer_write','nutrition','chat','resources','resource_manage','team','reports','exports','delete_customer','billing','branding']) loop
 if private.retail_capability(candidate,k) and not private.retail_can(lid,k) then raise exception 'Cannot grant access you do not have';end if;
 end loop;
 end if;

 if base in ('manager','specialist') and not exists(select 1 from public.retail_locations where id=lid and organization_id=oid) then raise exception 'Choose a location in this company';end if;
 if base='operator' and not exists(select 1 from public.retail_operators where id=(payload->>'operator_id')::uuid and organization_id=oid) then raise exception 'Choose an operator in this company';end if;
 if base in ('organization_admin','operator') then lid:=null;end if;
 if action='invite' then
 if coalesce(payload->>'email','')!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Valid work email required';end if;
 if exists(select 1 from public.retail_invitations where organization_id=oid and lower(email)=lower(trim(payload->>'email')) and location_id is not distinct from lid and accepted_at is null and expires_at>now() and canceled_at is null and role<>'customer') then raise exception 'An invitation is already pending for this employee and store';end if;
 if exists(select 1 from public.retail_staff s join auth.users u on u.id=s.user_id where s.organization_id=oid and s.location_id is not distinct from lid and lower(u.email)=lower(trim(payload->>'email'))) then raise exception 'Employee already exists. Edit their access instead';end if;
 insert into public.retail_invitations(organization_id,location_id,location_ids,operator_id,email,role,access_role,permissions,created_by)
 values(oid,case when base in ('manager','specialist') then lid end,coalesce(scope_ids,'{}'),case when base='operator' then (payload->>'operator_id')::uuid end,lower(trim(payload->>'email')),base,preset,perms,auth.uid()) returning to_jsonb(retail_invitations.*) into result;
 else
 if base in ('organization_admin','operator') and target.role<>base then raise exception 'Use a separate invitation to grant chain or operator access';end if;
 if private.retail_capability(target,'customer_write') and not private.retail_capability(candidate,'customer_write') then
  perform private.retail_transfer_work(target,nullif(payload->>'reassign_to','')::uuid,(payload->>'confirm_unassigned')::boolean);
 end if;
 update public.retail_staff set role=base,access_role=preset,permissions=perms,revision=revision+1 where id=target.id returning to_jsonb(retail_staff.*) into result;
 end if;
 elsif action in ('suspend','reactivate') then
 if action='suspend' then
 target_id:=nullif(payload->>'reassign_to','')::uuid;
 perform private.retail_transfer_work(target,target_id,(payload->>'confirm_unassigned')::boolean);
 update public.retail_invitations set expires_at=now(),canceled_at=now() where created_by=target.user_id and organization_id=oid and accepted_at is null and role<>'customer';
 end if;
 update public.retail_staff set active=action='reactivate',revision=revision+1 where id=target.id returning to_jsonb(retail_staff.*) into result;
 end if;
 insert into public.retail_audit(organization_id,location_id,actor_id,action,subject_id,detail) values(oid,lid,auth.uid(),'team_'||action,coalesce(target.id,inv.id,(result->>'id')::uuid),jsonb_build_object('role',preset,'permissions',perms));
 return result;
end$$;
revoke all on function private.retail_team_command(text,jsonb) from public,anon;
grant execute on function private.retail_team_command(text,jsonb) to authenticated;
create function public.retail_team_command(action text,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select private.retail_team_command(action,payload);$$;
revoke all on function public.retail_team_command(text,jsonb) from public,anon;
grant execute on function public.retail_team_command(text,jsonb) to authenticated;
create function private.retail_team_directory(oid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if not private.retail_org_access(oid) then raise exception 'Company unavailable';end if;
 return jsonb_build_object('members',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('name',p.name,'email',u.email,'location_name',l.name)) from public.retail_staff s join public.profiles p on p.id=s.user_id join auth.users u on u.id=s.user_id left join public.retail_locations l on l.id=s.location_id where s.organization_id=oid and (private.retail_org_can(oid,'team') or private.retail_can(s.location_id,'team'))),'[]'::jsonb),
 'invitations',coalesce((select jsonb_agg(to_jsonb(i)-'token') from public.retail_invitations i where i.organization_id=oid and i.role<>'customer' and (private.retail_org_can(oid,'team') or private.retail_can(i.location_id,'team'))),'[]'::jsonb),
 'activity',coalesce((select jsonb_agg(a) from (select action,subject_id,detail,created_at from public.retail_audit where organization_id=oid and action like 'team_%' and (private.retail_org_can(oid,'team') or private.retail_can(location_id,'team')) order by created_at desc limit 100)a),'[]'::jsonb));
end$$;
revoke all on function private.retail_team_directory(uuid) from public,anon;
grant execute on function private.retail_team_directory(uuid) to authenticated;
create function public.retail_team_directory(oid uuid) returns jsonb language sql security invoker set search_path='' as $$select private.retail_team_directory(oid);$$;
revoke all on function public.retail_team_directory(uuid) from public,anon;
grant execute on function public.retail_team_directory(uuid) to authenticated;
create function public.retail_team_impact(sid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$declare s public.retail_staff;begin
 select * into s from public.retail_staff where id=sid;
 if s.id is null or not (private.retail_org_can(s.organization_id,'team') or (s.location_id is not null and private.retail_can(s.location_id,'team'))) then raise exception 'Team administrator required';end if;
 return jsonb_build_object(
 'customers',(select count(*) from public.retail_relationships r where r.assigned_to=s.user_id and r.deleted_at is null and exists(select 1 from public.retail_locations l where l.id=r.location_id and l.organization_id=s.organization_id and (s.role='organization_admin' or l.operator_id=s.operator_id or l.id=s.location_id))),
 'tasks',(select count(*) from public.retail_tasks t join public.retail_relationships r on r.id=t.relationship_id where t.assigned_to=s.user_id and t.status='open' and exists(select 1 from public.retail_locations l where l.id=r.location_id and l.organization_id=s.organization_id and (s.role='organization_admin' or l.operator_id=s.operator_id or l.id=s.location_id))),
 'conversations',(select count(*) from public.retail_threads t join public.retail_relationships r on r.id=t.relationship_id where t.assigned_to=s.user_id and t.status='open' and exists(select 1 from public.retail_locations l where l.id=r.location_id and l.organization_id=s.organization_id and (s.role='organization_admin' or l.operator_id=s.operator_id or l.id=s.location_id))));
end$$;
revoke all on function public.retail_team_impact(uuid) from public,anon;
grant execute on function public.retail_team_impact(uuid) to authenticated;
alter table public.retail_resources add column distribution uuid[] not null default '{}',
 add column usage_policy text not null default 'personalize' check(usage_policy in ('approved','personalize')),
 add column staff_required boolean not null default false,
 add column required_roles text[] not null default '{}',
 add column review_status text not null default 'none' check(review_status in ('none','submitted','changes_requested','approved')),
 add column review_note text not null default '', add column reviewed_by uuid references public.profiles,
 add column review_revision integer not null default 1,
 add column replaces_id uuid references public.retail_resources(id);
create index retail_resource_review_queue on public.retail_resources(organization_id,review_status,updated_at desc) where review_status='submitted';
create table public.retail_resource_acknowledgments(
 resource_id uuid not null references public.retail_resources,version integer not null,user_id uuid not null references public.profiles,
 acknowledged_at timestamptz not null default now(),primary key(resource_id,version,user_id));
alter table public.retail_resource_acknowledgments enable row level security;
revoke all on public.retail_resource_acknowledgments from anon,authenticated;
grant select on public.retail_resource_acknowledgments to authenticated;
create policy retail_ack_read on public.retail_resource_acknowledgments for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.retail_resources r where r.id=resource_id and (private.retail_org_access(r.organization_id,true) or private.retail_can(r.location_id,'team'))));
create policy retail_resource_distribution on public.retail_resources as restrictive for select to authenticated using(cardinality(distribution)=0 or private.retail_org_access(organization_id,true) or exists(select 1 from unnest(distribution) lid where private.retail_location_access(lid)));
create function public.retail_resource_review_queue(oid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if not private.retail_org_can(oid,'resource_manage') then raise exception 'Chain administrator required';end if;
 return coalesce((select jsonb_agg(to_jsonb(r) order by r.updated_at desc) from public.retail_resources r where r.organization_id=oid and r.review_status='submitted'),'[]'::jsonb);
end$$;
revoke all on function public.retail_resource_review_queue(uuid) from public,anon;
grant execute on function public.retail_resource_review_queue(uuid) to authenticated;

-- Resource assignments must honor role permissions, even through direct RPCs.
alter function private.retail_resource_command(text,jsonb) rename to retail_resource_command_before_team;
revoke all on function private.retail_resource_command_before_team(text,jsonb) from public,anon,authenticated;
create function private.retail_resource_command(action text,payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare lid uuid;item public.retail_resources;previous public.retail_resources;rid uuid;result uuid;dest uuid;begin
 if action in ('submit','approve','request_changes','acknowledge','governance') then
 select * into item from public.retail_resources where id=(payload->>'id')::uuid for update;
 if item.id is null then raise exception 'Resource unavailable';end if;
 if action='acknowledge' then
 if item.audience<>'staff' or item.status<>'published' or not private.retail_org_access(item.organization_id) or (item.location_id is not null and not private.retail_location_access(item.location_id)) or (cardinality(item.distribution)>0 and not exists(select 1 from unnest(item.distribution) l where private.retail_location_access(l))) then raise exception 'Staff resource unavailable';end if;
 if item.version is distinct from (payload->>'version')::integer then raise exception 'Resource changed. Read the current version';end if;
 insert into public.retail_resource_acknowledgments(resource_id,version,user_id) values(item.id,item.version,auth.uid()) on conflict do nothing;
 return item.id;
 end if;
 if item.review_revision is distinct from (payload->>'review_revision')::integer then raise exception 'Review changed. Refresh and retry';end if;
 if action in ('approve','request_changes','governance') and not private.retail_org_can(item.organization_id,'resource_manage') then raise exception 'Chain administrator required';end if;
 if action='submit' then
 if item.location_id is null or item.status<>'draft' or not private.retail_can(item.location_id,'resource_manage') then raise exception 'Create a store draft before submitting for approval';end if;
 update public.retail_resources set review_status='submitted',review_revision=review_revision+1,review_note='' where id=item.id;
 elsif action='request_changes' then
 if item.review_status<>'submitted' then raise exception 'No submitted review';end if;
 update public.retail_resources set review_status='changes_requested',review_note=left(coalesce(payload->>'note',''),2000),reviewed_by=auth.uid(),review_revision=review_revision+1 where id=item.id;
 else
 if action='approve' and (item.review_status<>'submitted' or item.status<>'draft') then raise exception 'No submitted draft';end if;
 for dest in select value::uuid from jsonb_array_elements_text(coalesce(payload->'distribution','[]')) loop
 if not exists(select 1 from public.retail_locations where id=dest and organization_id=item.organization_id) then raise exception 'Distribution must stay within this company';end if;
 end loop;
 if action='approve' and item.replaces_id is not null then
  select * into previous from public.retail_resources where id=item.replaces_id for update;
  if previous.organization_id<>item.organization_id or previous.status<>'published' then raise exception 'Published version changed. Review the replacement';end if;
 end if;
 update public.retail_resources set location_id=case when action='approve' then null else location_id end,
 distribution=array(select value::uuid from jsonb_array_elements_text(coalesce(payload->'distribution','[]'))),
 allow_copy=case when payload->>'usage_policy'='approved' then false else allow_copy end,usage_policy=coalesce(payload->>'usage_policy',usage_policy),staff_required=coalesce((payload->>'staff_required')::boolean,staff_required),
 required_roles=array(select value from jsonb_array_elements_text(coalesce(payload->'required_roles','[]'))),
 review_status=case when action='approve' then 'approved' else review_status end,
 status=case when action='approve' then 'published' else status end,reviewed_by=auth.uid(),review_revision=review_revision+1,
 version=case when action='governance' then version+1 else version end where id=item.id;
 if action='approve' and previous.id is not null then
  update public.retail_resources set status='archived',review_revision=review_revision+1,updated_at=now() where id=previous.id;
 end if;
 end if;
 insert into public.retail_audit(organization_id,location_id,actor_id,action,subject_id) values(item.organization_id,item.location_id,auth.uid(),'resource_'||action,item.id);
 return item.id;
 elsif action='assign' then
 rid:=(payload->>'relationship_id')::uuid;
 if not private.retail_customer_can(rid,'resources') then raise exception 'Your role cannot share resources';end if;
 select * into item from public.retail_resources where id=(payload->>'resource_id')::uuid;
 select location_id into lid from public.retail_relationships where id=rid;
 if cardinality(item.distribution)>0 and not lid=any(item.distribution) then raise exception 'Resource is not distributed to this store';end if;
 if item.usage_policy='approved' and item.kind='meal_plan' and payload->'days' is distinct from item.content->'days' then raise exception 'This approved meal template cannot be modified';end if;
 if item.kind='meal_plan' and not private.retail_customer_can(rid,'nutrition') then raise exception 'Nutrition permission required';end if;
 elsif action in ('save','archive') then
 lid:=nullif(payload->>'location_id','')::uuid;
 if payload->>'id' is not null then select * into item from public.retail_resources where id=(payload->>'id')::uuid;if found then lid:=item.location_id;end if;end if;
 if lid is not null and not private.retail_can(lid,'resource_manage') then raise exception 'Resource manager required';end if;
 if lid is null and not private.retail_org_can(coalesce(item.organization_id,nullif(payload->>'organization_id','')::uuid),'resource_manage') then raise exception 'Company resource manager required';end if;
 if action='save' and item.id is not null and (item.review_status='submitted' or item.review_status='approved') then raise exception 'Create a draft revision to change this resource';end if;
 if action='save' and payload->>'replaces_id' is not null then
  select * into previous from public.retail_resources where id=(payload->>'replaces_id')::uuid;
  if previous.id is null or previous.organization_id is distinct from (payload->>'organization_id')::uuid or previous.status<>'published' or not coalesce(case when previous.location_id is null then private.retail_org_can(previous.organization_id,'resource_manage') else private.retail_can(previous.location_id,'resource_manage') end,false) then raise exception 'Published resource unavailable for revision';end if;
 end if;
 end if;
 result:=private.retail_resource_command_before_team(action,payload);
 if action='save' and previous.id is not null then
  update public.retail_resources set replaces_id=previous.id where id=result and replaces_id is null;
 end if;
 return result;
end$$;
revoke all on function private.retail_resource_command(text,jsonb) from public,anon;
grant execute on function private.retail_resource_command(text,jsonb) to authenticated;
create or replace function public.retail_resource_command(action text,payload jsonb) returns uuid language sql security invoker set search_path='' as $$select private.retail_resource_command(action,payload);$$;
create or replace function private.retail_reports(lid uuid, since_at timestamptz) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.retail_can(lid,'reports') then raise exception 'Reports permission required';end if;
 return jsonb_build_object('since',since_at,'customers',(select count(*) from public.retail_relationships where location_id=lid and created_at>=since_at),
 'activated',(select count(*) from public.retail_relationships where location_id=lid and activated_at>=since_at),
 'consultations',(select count(*) from public.retail_consultations c join public.retail_relationships r on r.id=c.relationship_id where r.location_id=lid and c.published_at>=since_at),
 'scans',(select count(*) from public.retail_assessments a join public.retail_relationships r on r.id=a.relationship_id where r.location_id=lid and a.created_at>=since_at),
 'repeat_scans',(select count(*) from (select a.relationship_id from public.retail_assessments a join public.retail_relationships r on r.id=a.relationship_id where r.location_id=lid group by a.relationship_id having count(*)>=2 and max(a.created_at)>=since_at) x),
 'tasks_due',(select count(*) from public.retail_tasks t join public.retail_relationships r on r.id=t.relationship_id where r.location_id=lid and t.due_at>=since_at and t.due_at<=now() and t.status<>'canceled'),
 'tasks_completed',(select count(*) from public.retail_tasks t join public.retail_relationships r on r.id=t.relationship_id where r.location_id=lid and t.due_at>=since_at and t.due_at<=now() and t.status='done'),
 'active_staff',(select count(*) from public.retail_staff where location_id=lid and active));
end $$;

create or replace function private.retail_save_branding(oid uuid,display_name text,object_path text) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or not exists(select 1 from public.retail_locations l where l.organization_id=oid and private.retail_can(l.id,'branding')) then raise exception 'Organization administrator required';end if;
 if length(trim(display_name)) not between 1 and 80 or display_name is null then raise exception 'Enter a display name between 1 and 80 characters';end if;
 if object_path is not null and (split_part(object_path,'/',1)<>oid::text or not exists(select 1 from storage.objects where bucket_id='retail-branding' and name=object_path)) then raise exception 'Upload a logo for this organization';end if;
 update public.retail_organizations set brand_name=trim(display_name),logo_path=object_path where id=oid;
 insert into public.retail_audit(organization_id,actor_id,action,subject_id) values(oid,auth.uid(),'update_branding',oid);
end$$;

create or replace function private.retail_brand_upload(object_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.retail_locations l where l.organization_id::text=split_part(object_name,'/',1) and private.retail_can(l.id,'branding'));
$$;
revoke all on function private.retail_command_base(text,jsonb) from public,anon,authenticated;
commit;
