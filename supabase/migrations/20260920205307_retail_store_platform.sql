begin;
create schema if not exists private;
create table public.retail_organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 120),
 enabled boolean not null default false, created_at timestamptz not null default now()
);
create table public.retail_operators (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.retail_organizations,
 name text not null, kind text not null check(kind in ('corporate','franchise')), unique(id,organization_id)
);
create table public.retail_locations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.retail_organizations,
 operator_id uuid not null, name text not null, timezone text not null default 'America/Chicago',
 join_code uuid not null default gen_random_uuid() unique, enabled boolean not null default false,
 sponsorship_ends_at timestamptz, response_expectation text not null default 'Our team replies during store hours.',
 created_at timestamptz not null default now(), unique(id,organization_id),
 foreign key(operator_id,organization_id) references public.retail_operators(id,organization_id)
);
create table public.retail_staff (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.retail_organizations,
 location_id uuid, operator_id uuid, user_id uuid not null references public.profiles,
 role text not null check(role in ('organization_admin','operator','manager','specialist')),
 active boolean not null default true, created_at timestamptz not null default now(),
 foreign key(location_id,organization_id) references public.retail_locations(id,organization_id),
 foreign key(operator_id,organization_id) references public.retail_operators(id,organization_id),
 check((role='organization_admin' and location_id is null and operator_id is null) or (role='operator' and operator_id is not null and location_id is null) or (role in ('manager','specialist') and location_id is not null and operator_id is null))
);
create unique index retail_staff_scope_unique on public.retail_staff(user_id,organization_id,coalesce(location_id,'00000000-0000-0000-0000-000000000000'::uuid),coalesce(operator_id,'00000000-0000-0000-0000-000000000000'::uuid));
create table public.retail_relationships (
 id uuid primary key default gen_random_uuid(), location_id uuid not null references public.retail_locations,
 profile_id uuid references public.profiles, name text not null, email text not null default '', phone text not null default '',
 assigned_to uuid references public.profiles, status text not null default 'invited' check(status in ('invited','active','paused','ended')),
 goal text not null default '', share_activity boolean not null default false,
 service_reminders boolean not null default true, marketing_consent boolean not null default false,
 consent_version text, consent_at timestamptz, activated_at timestamptz, created_at timestamptz not null default now(), revision integer not null default 1
);
create unique index retail_active_relationship on public.retail_relationships(location_id,profile_id) where profile_id is not null and status<>'ended';
create unique index retail_pending_email on public.retail_relationships(location_id,lower(email)) where status='invited' and email<>'';
create table public.retail_invitations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.retail_organizations,
 location_id uuid references public.retail_locations, operator_id uuid references public.retail_operators,
 email text not null, role text not null check(role in ('customer','organization_admin','operator','manager','specialist')),
 relationship_id uuid references public.retail_relationships, token uuid not null default gen_random_uuid() unique,
 expires_at timestamptz not null default now()+interval '7 days', accepted_at timestamptz,
 created_by uuid not null references public.profiles, created_at timestamptz not null default now()
);
create table public.retail_consultations (
 id uuid primary key default gen_random_uuid(), relationship_id uuid not null references public.retail_relationships,
 draft jsonb not null default '{}'::jsonb, step integer not null default 0 check(step between 0 and 5),
 status text not null default 'draft' check(status in ('draft','published')),
 revision integer not null default 1, created_by uuid not null references public.profiles,
 updated_at timestamptz not null default now(), published_at timestamptz
);
create table public.retail_plans (
 id uuid primary key default gen_random_uuid(), relationship_id uuid not null references public.retail_relationships,
 consultation_id uuid not null references public.retail_consultations unique,
 content jsonb not null, published_by uuid not null references public.profiles, published_at timestamptz not null default now()
);
create table public.retail_assessments (
 id uuid primary key default gen_random_uuid(), relationship_id uuid not null references public.retail_relationships,
 measured_on date not null, weight numeric check(weight>0 and weight<1500), unit text not null check(unit in ('kg','lbs')),
 body_fat numeric check(body_fat>=0 and body_fat<=100), muscle_mass numeric check(muscle_mass>=0 and muscle_mass<1500),
 source text not null check(source in ('manual','csv')), source_key text,
 note text not null default '', created_by uuid not null references public.profiles, created_at timestamptz not null default now(),
 unique(relationship_id,source_key)
);
create table public.retail_tasks (
 id uuid primary key default gen_random_uuid(), relationship_id uuid not null references public.retail_relationships,
 title text not null, kind text not null check(kind in ('activation','checkin','scan','product','followup')),
 due_at timestamptz not null, assigned_to uuid references public.profiles,
 status text not null default 'open' check(status in ('open','done','canceled')),
 note text not null default '', completed_at timestamptz, sequence_key text,
 revision integer not null default 1, created_at timestamptz not null default now(), unique(relationship_id,sequence_key)
);
create table public.retail_notes (
 id uuid primary key default gen_random_uuid(), relationship_id uuid not null references public.retail_relationships,
 body text not null check(length(body) between 1 and 10000), author_id uuid not null references public.profiles, created_at timestamptz not null default now()
);
create table public.retail_messages (
 id uuid primary key, relationship_id uuid not null references public.retail_relationships,
 body text not null check(length(body) between 1 and 10000), author_id uuid not null references public.profiles,
 author_name text not null, from_customer boolean not null, created_at timestamptz not null default now()
);
create table public.retail_threads (
 relationship_id uuid primary key references public.retail_relationships,
 assigned_to uuid references public.profiles, status text not null default 'open' check(status in ('open','resolved')),
 revision integer not null default 1, composing_by uuid references public.profiles, composing_until timestamptz
);
create table public.retail_read_receipts (
 relationship_id uuid not null references public.retail_relationships, user_id uuid not null references public.profiles,
 read_at timestamptz not null default now(), primary key(relationship_id,user_id)
);
create table public.retail_checkins (
 id uuid primary key, relationship_id uuid not null references public.retail_relationships,
 answers jsonb not null, created_at timestamptz not null default now(), reviewed_at timestamptz
);
create table public.retail_templates (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.retail_organizations,
 location_id uuid, category text not null check(category in ('consultation','nutrition','product','followup')),
 title text not null, content jsonb not null, version integer not null default 1,
 published boolean not null default false, author_id uuid not null references public.profiles, updated_at timestamptz not null default now(),
 foreign key(location_id,organization_id) references public.retail_locations(id,organization_id)
);
create table public.retail_notifications (
 id uuid primary key default gen_random_uuid(), relationship_id uuid not null references public.retail_relationships,
 task_id uuid references public.retail_tasks, body text not null, created_at timestamptz not null default now(),
 read_at timestamptz, dedupe_key text not null unique
);
create table public.retail_audit (
 id bigint generated always as identity primary key, organization_id uuid references public.retail_organizations,
 location_id uuid references public.retail_locations, actor_id uuid references public.profiles,
 action text not null, subject_id uuid, detail jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index retail_relationship_location on public.retail_relationships(location_id,status,created_at desc);
create index retail_staff_user on public.retail_staff(user_id) where active;
create index retail_tasks_due on public.retail_tasks(due_at) where status='open';
create index retail_messages_thread on public.retail_messages(relationship_id,created_at desc);
create index retail_consultations_customer on public.retail_consultations(relationship_id,updated_at desc);
create index retail_relationship_profile on public.retail_relationships(profile_id) where profile_id is not null;
create index retail_plans_customer on public.retail_plans(relationship_id,published_at desc);
create index retail_checkins_customer on public.retail_checkins(relationship_id,created_at desc);
create index retail_notes_customer on public.retail_notes(relationship_id,created_at desc);
create index retail_notifications_customer on public.retail_notifications(relationship_id,created_at desc);
create index retail_invitation_relationship on public.retail_invitations(relationship_id);
create index retail_audit_location on public.retail_audit(location_id,created_at desc);

-- Keep authorization helpers out of the public API and fully qualify names.
create function private.retail_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='superadmin'); $$;
create function private.retail_location_access(lid uuid, management boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select private.retail_admin() or exists(select 1 from public.retail_staff s join public.retail_locations l on l.id=lid join public.retail_organizations o on o.id=l.organization_id
 where s.user_id=auth.uid() and s.active and o.enabled and s.organization_id=l.organization_id and
 ((s.location_id=l.id and (not management or s.role='manager')) or s.role='organization_admin' or (s.role='operator' and s.operator_id=l.operator_id))); $$;
create function private.retail_org_access(oid uuid, management boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select private.retail_admin() or exists(select 1 from public.retail_staff s join public.retail_organizations o on o.id=s.organization_id where s.user_id=auth.uid() and s.active and s.organization_id=oid and o.enabled and (not management or s.role='organization_admin')); $$;
create function private.retail_customer_access(rid uuid, staff_only boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.retail_relationships r join public.retail_locations l on l.id=r.location_id join public.retail_organizations o on o.id=l.organization_id where r.id=rid and (
 (not staff_only and r.profile_id=auth.uid()) or private.retail_admin() or
 (o.enabled and l.enabled and r.status<>'ended' and exists(select 1 from public.retail_staff s where s.active and s.user_id=auth.uid() and s.location_id=l.id and (s.role='manager' or (s.role='specialist' and (r.assigned_to=auth.uid() or r.assigned_to is null))))))); $$;
create function private.retail_is_customer(rid uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.retail_relationships where id=rid and profile_id=auth.uid()); $$;
create function private.retail_active(rid uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.retail_relationships r join public.retail_locations l on l.id=r.location_id join public.retail_organizations o on o.id=l.organization_id where r.id=rid and r.status='active' and l.enabled and o.enabled); $$;

create table public.retail_intakes(relationship_id uuid primary key references public.retail_relationships,answers jsonb not null,form_snapshot jsonb not null default '[]',updated_at timestamptz not null default now());
-- No browser role gets direct writes. Commands enforce field ownership, revision checks and audit records.
do $$ declare t text; begin
 foreach t in array array['organizations','operators','locations','staff','relationships','invitations','consultations','plans','assessments','tasks','notes','messages','threads','read_receipts','checkins','templates','notifications','audit','intakes'] loop
 execute format('alter table public.retail_%I enable row level security',t);
 execute format('revoke all on public.retail_%I from anon, authenticated',t);
 execute format('grant select on public.retail_%I to authenticated',t);
 end loop;end $$;
create policy retail_organizations_read on public.retail_organizations for select to authenticated using(private.retail_org_access(id));
create policy retail_operators_read on public.retail_operators for select to authenticated using(private.retail_org_access(organization_id));
create policy retail_locations_read on public.retail_locations for select to authenticated using(private.retail_location_access(id) or exists(select 1 from public.retail_relationships r where r.location_id=retail_locations.id and r.profile_id=auth.uid()));
create policy retail_staff_read on public.retail_staff for select to authenticated using(user_id=auth.uid() or (location_id is not null and private.retail_location_access(location_id,true)) or private.retail_org_access(organization_id,true));
create policy retail_relationships_read on public.retail_relationships for select to authenticated using(private.retail_customer_access(id));
create policy retail_invitations_read on public.retail_invitations for select to authenticated using(created_by=auth.uid() or private.retail_admin());
create policy retail_consultations_read on public.retail_consultations for select to authenticated using(private.retail_customer_access(relationship_id,true));
create policy retail_plans_read on public.retail_plans for select to authenticated using(private.retail_customer_access(relationship_id));
create policy retail_assessments_read on public.retail_assessments for select to authenticated using(private.retail_customer_access(relationship_id));
create policy retail_tasks_read on public.retail_tasks for select to authenticated using(private.retail_customer_access(relationship_id,true));
create policy retail_notes_read on public.retail_notes for select to authenticated using(private.retail_customer_access(relationship_id,true));
create policy retail_messages_read on public.retail_messages for select to authenticated using(private.retail_customer_access(relationship_id));
create policy retail_threads_read on public.retail_threads for select to authenticated using(private.retail_customer_access(relationship_id,true));
create policy retail_receipts_read on public.retail_read_receipts for select to authenticated using(user_id=auth.uid());
create policy retail_checkins_read on public.retail_checkins for select to authenticated using(private.retail_customer_access(relationship_id));
create policy retail_templates_read on public.retail_templates for select to authenticated using((location_id is null and private.retail_org_access(organization_id) and (published or author_id=auth.uid() or private.retail_org_access(organization_id,true))) or (location_id is not null and private.retail_location_access(location_id) and (published or private.retail_location_access(location_id,true) or author_id=auth.uid())));
create policy retail_notifications_read on public.retail_notifications for select to authenticated using(private.retail_is_customer(relationship_id));
create policy retail_intakes_read on public.retail_intakes for select to authenticated using(private.retail_customer_access(relationship_id));
create policy retail_audit_read on public.retail_audit for select to authenticated using(private.retail_org_access(organization_id,true) or private.retail_location_access(location_id,true));

-- Files are isolated from personal PWA photos and explicitly shared to this store.
create table public.retail_files(id uuid primary key,relationship_id uuid not null references public.retail_relationships,object_path text unique not null,label text not null,kind text not null check(kind in ('photo','assessment','document')),created_by uuid not null references public.profiles,created_at timestamptz not null default now());
create index retail_files_customer on public.retail_files(relationship_id,created_at desc);
alter table public.retail_files enable row level security;
revoke all on public.retail_files from anon,authenticated;
grant select on public.retail_files to authenticated;
create policy retail_files_read on public.retail_files for select to authenticated using(private.retail_customer_access(relationship_id));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('retail-files','retail-files',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']);
create function private.retail_upload_path(path text) returns boolean language plpgsql stable security definer set search_path='' as $$declare rid uuid;begin
 if split_part(path,'/',2)<>auth.uid()::text or array_length(string_to_array(path,'/'),1)<>3 then return false;end if;
 begin rid:=split_part(path,'/',1)::uuid;exception when invalid_text_representation then return false;end;
 return private.retail_customer_access(rid) and private.retail_active(rid);
end$$;
create policy retail_file_upload on storage.objects for insert to authenticated with check(bucket_id='retail-files' and private.retail_upload_path(name));
create policy retail_file_download on storage.objects for select to authenticated using(bucket_id='retail-files' and (private.retail_upload_path(name) or exists(select 1 from public.retail_files f where f.object_path=objects.name and private.retail_customer_access(f.relationship_id))));
create policy retail_file_delete on storage.objects for delete to authenticated using(bucket_id='retail-files' and private.retail_upload_path(name));

-- Private command implementation exposed only through an invoker wrapper.
create function private.retail_command(action text, payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); lid uuid; oid uuid; rid uuid; result jsonb:='{}'; r public.retail_relationships; c public.retail_consultations; inv public.retail_invitations; loc public.retail_locations; target uuid; draft jsonb; staff boolean; affected integer; vrole text; mail text;
begin
 if uid is null then raise exception 'Sign in required';end if;
 if octet_length(payload::text)>150000 then raise exception 'Request too large';end if;
 if exists(select 1 from public.profiles where id=uid and admin_override='locked') then raise exception 'Account access is locked';end if;
 lid:=nullif(payload->>'location_id','')::uuid;rid:=nullif(payload->>'relationship_id','')::uuid;
 if lid is not null then select organization_id into oid from public.retail_locations where id=lid;end if;
 if rid is not null then
  select * into r from public.retail_relationships where id=rid for update;
  if not found or not private.retail_customer_access(rid) then raise exception 'Customer unavailable';end if;
  lid:=r.location_id;select organization_id into oid from public.retail_locations where id=lid;
  staff:=private.retail_customer_access(rid,true);
 end if;
 if action in ('prospect','invite_staff') and payload->>'request_id' is not null then
  select to_jsonb(i.*) into result from public.retail_invitations i where i.id=(payload->>'request_id')::uuid and i.created_by=uid and i.location_id is not distinct from lid;
  if result is not null then return result;end if;
 end if;
 if action='provision' then
  if not private.retail_admin() then raise exception 'Superadmin required';end if;
  insert into public.retail_organizations(name,enabled) values(trim(payload->>'name'),true) returning id into oid;
  insert into public.retail_operators(organization_id,name,kind) values(oid,trim(payload->>'operator_name'),coalesce(payload->>'kind','corporate')) returning id into target;
  insert into public.retail_locations(organization_id,operator_id,name,timezone,enabled,sponsorship_ends_at) values(oid,target,trim(payload->>'location_name'),coalesce(payload->>'timezone','America/Chicago'),true,now()+interval '90 days') returning id into lid;
  result:=jsonb_build_object('location_id',lid,'organization_id',oid);
 elsif action='location' then
  oid:=(payload->>'organization_id')::uuid;
  if not private.retail_org_access(oid,true) then raise exception 'Organization administrator required';end if;
  if not exists(select 1 from pg_timezone_names where name=payload->>'timezone') then raise exception 'Choose a valid timezone';end if;
  if lid is null then
   insert into public.retail_locations(organization_id,operator_id,name,timezone) values(oid,(payload->>'operator_id')::uuid,trim(payload->>'name'),payload->>'timezone') returning id into lid;
  else update public.retail_locations set name=trim(payload->>'name'),timezone=payload->>'timezone',enabled=(payload->>'enabled')::boolean,response_expectation=left(payload->>'response_expectation',250) where id=lid and organization_id=oid;end if;
  result:=jsonb_build_object('location_id',lid);
 elsif action='sponsorship' then
  if not private.retail_admin() then raise exception 'Superadmin required';end if;
  update public.retail_locations set sponsorship_ends_at=nullif(payload->>'ends_at','')::timestamptz where id=lid;
 elsif action='operator' then
  oid:=(payload->>'organization_id')::uuid;
  if not private.retail_org_access(oid,true) then raise exception 'Organization administrator required';end if;
  insert into public.retail_operators(organization_id,name,kind) values(oid,trim(payload->>'name'),payload->>'kind') returning id into target;
  result:=jsonb_build_object('id',target);
 elsif action='invite_staff' then
  oid:=(payload->>'organization_id')::uuid;vrole:=payload->>'role';
  if not (private.retail_org_access(oid,true) or (vrole='specialist' and private.retail_location_access(lid,true))) then raise exception 'Manager required';end if;
  if lid is not null and not exists(select 1 from public.retail_locations where id=lid and organization_id=oid) then raise exception 'Wrong location';end if;
  if vrole not in ('organization_admin','operator','manager','specialist') then raise exception 'Invalid role';end if;
  if vrole in ('manager','specialist') and lid is null then raise exception 'Location required';end if;
  if vrole='operator' and not exists(select 1 from public.retail_operators where id=(payload->>'operator_id')::uuid and organization_id=oid) then raise exception 'Operator required';end if;
  insert into public.retail_invitations(id,organization_id,location_id,operator_id,email,role,created_by) values(coalesce((payload->>'request_id')::uuid,gen_random_uuid()),oid,case when vrole in ('manager','specialist') then lid end,case when vrole='operator' then (payload->>'operator_id')::uuid end,lower(trim(payload->>'email')),vrole,uid) returning to_jsonb(retail_invitations.*) into result;
 elsif action='revoke_staff' then
  target:=(payload->>'staff_id')::uuid;
  select organization_id,location_id,role,user_id into oid,lid,vrole,target from public.retail_staff where id=target;
  if not (private.retail_org_access(oid,true) or (vrole='specialist' and private.retail_location_access(lid,true))) then raise exception 'Manager required';end if;
  update public.retail_staff set active=false where id=(payload->>'staff_id')::uuid;
  update public.retail_invitations set expires_at=now() where created_by=target and organization_id=oid and accepted_at is null;
  update public.retail_relationships set assigned_to=null,revision=revision+1 where location_id=lid and assigned_to=target;
  update public.retail_tasks set assigned_to=null,revision=revision+1 where assigned_to=target and relationship_id in(select id from public.retail_relationships where location_id=lid);
  update public.retail_threads set assigned_to=null,revision=revision+1 where assigned_to=target and relationship_id in(select id from public.retail_relationships where location_id=lid);
 elsif action='prospect' then
  if not private.retail_location_access(lid) or not exists(select 1 from public.retail_staff where user_id=uid and location_id=lid and active) and not private.retail_admin() then raise exception 'Store staff required';end if;
  if not exists(select 1 from public.retail_locations where id=lid and enabled) then raise exception 'Store unavailable';end if;
  if coalesce(length(trim(payload->>'name')),0)<1 then raise exception 'Name required';end if;
  if coalesce(payload->>'email','')!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Valid email required';end if;
  if exists(select 1 from public.retail_relationships where location_id=lid and lower(email)=lower(trim(payload->>'email')) and status<>'ended') then raise exception 'This customer already has a store relationship. Find their existing record or ask a manager';end if;
  insert into public.retail_relationships(location_id,name,email,phone,goal,assigned_to) values(lid,left(trim(payload->>'name'),120),lower(trim(payload->>'email')),left(coalesce(payload->>'phone',''),40),left(coalesce(payload->>'goal',''),500),uid) returning id into rid;
  insert into public.retail_invitations(id,organization_id,location_id,email,role,relationship_id,created_by) values(coalesce((payload->>'request_id')::uuid,gen_random_uuid()),oid,lid,lower(trim(payload->>'email')),'customer',rid,uid) returning to_jsonb(retail_invitations.*) into result;
  insert into public.retail_tasks(relationship_id,title,kind,due_at,assigned_to,sequence_key) values(rid,'Complete account activation','activation',now()+interval '2 days',uid,'activation');
 elsif action in ('accept_invite','join') then
  if coalesce((payload->>'consent')::boolean,false) is not true then raise exception 'Confirm the connection and sharing notice';end if;
  if action='accept_invite' then
   select * into inv from public.retail_invitations where token=(payload->>'token')::uuid for update;
   select lower(email) into mail from auth.users where id=uid and email_confirmed_at is not null;
   if inv.id is null or inv.expires_at<now() or mail is null or lower(inv.email)<>mail then raise exception 'Invitation unavailable or sign in with the invited email';end if;
   if inv.accepted_at is not null then return jsonb_build_object('already_accepted',true);end if;
   lid:=inv.location_id;oid:=inv.organization_id;
   if inv.role<>'customer' then
    insert into public.retail_staff(organization_id,location_id,operator_id,user_id,role) values(oid,inv.location_id,inv.operator_id,uid,inv.role) on conflict do nothing;
    update public.retail_staff set active=true,role=inv.role where organization_id=oid and location_id is not distinct from inv.location_id and operator_id is not distinct from inv.operator_id and user_id=uid;
    update public.retail_invitations set accepted_at=now() where id=inv.id;
    insert into public.retail_audit(organization_id,location_id,actor_id,action,subject_id) values(oid,lid,uid,'accept_staff_invite',inv.id);
    return jsonb_build_object('staff',true);
   end if;
   rid:=inv.relationship_id;
  else select id,organization_id into lid,oid from public.retail_locations where join_code=(payload->>'code')::uuid;
   select lower(email) into mail from auth.users where id=uid and email_confirmed_at is not null;
   if exists(select 1 from public.retail_relationships where location_id=lid and status='invited' and profile_id is null and lower(email)=mail) then raise exception 'Your store has prepared an invitation. Use the private invitation link to connect that record';end if;
  end if;
  if lid is null or not exists(select 1 from public.retail_locations l join public.retail_organizations o on o.id=l.organization_id where l.id=lid and l.enabled and o.enabled) then raise exception 'Store unavailable';end if;
  if exists(select 1 from public.retail_relationships where location_id=lid and profile_id=uid and status<>'ended') then raise exception 'Your account is already connected to this store';end if;
  if rid is null then
   insert into public.retail_relationships(location_id,profile_id,name,email,status,activated_at,share_activity) select lid,uid,p.name,u.email,'active',now(),coalesce((payload->>'share_activity')::boolean,false) from public.profiles p join auth.users u on u.id=p.id where p.id=uid returning id into rid;
  else update public.retail_relationships set profile_id=uid,status='active',activated_at=now(),share_activity=coalesce((payload->>'share_activity')::boolean,false),revision=revision+1 where id=rid and profile_id is null;
   if not found then raise exception 'Invitation already linked';end if;
   update public.retail_invitations set accepted_at=now() where relationship_id=rid and accepted_at is null;
  end if;
  update public.retail_relationships set consent_version='retail-v1',consent_at=now() where id=rid;
  update public.retail_tasks set status='done',completed_at=now(),revision=revision+1 where relationship_id=rid and kind='activation' and status='open';
  result:=jsonb_build_object('relationship_id',rid);
 elsif action='disconnect' then
  if not private.retail_is_customer(rid) then raise exception 'Customer required';end if;
  update public.retail_relationships set status='ended',share_activity=false,service_reminders=false,revision=revision+1 where id=rid;
  update public.retail_tasks set status='canceled',note='Customer ended store connection',revision=revision+1 where relationship_id=rid and status='open';
 elsif action='preferences' then
  if not private.retail_is_customer(rid) then raise exception 'Customer required';end if;
  update public.retail_relationships set share_activity=(payload->>'share_activity')::boolean,service_reminders=(payload->>'service_reminders')::boolean,marketing_consent=(payload->>'marketing_consent')::boolean,revision=revision+1 where id=rid;
 elsif action='relationship' then
  if not coalesce(staff,false) or not private.retail_location_access(lid,true) then raise exception 'Store manager required';end if;
  if r.revision is distinct from (payload->>'revision')::integer then raise exception 'Record changed. Refresh before saving';end if;
  target:=nullif(payload->>'assigned_to','')::uuid;
  if target is not null and not exists(select 1 from public.retail_staff where user_id=target and location_id=lid and active) then raise exception 'Choose an active store employee';end if;
  if payload->>'status'='active' and r.profile_id is null then raise exception 'Customer must accept their invitation first';end if;
  update public.retail_relationships set assigned_to=target,status=payload->>'status',revision=revision+1 where id=rid;
  if payload->>'status' in ('paused','ended') then update public.retail_tasks set status='canceled',revision=revision+1,note='Relationship paused or ended' where relationship_id=rid and status='open';end if;
 elsif action='intake' then
  if not private.retail_is_customer(rid) or not private.retail_active(rid) then raise exception 'Active customer required';end if;
  if jsonb_typeof(payload->'answers') is distinct from 'object' then raise exception 'Invalid intake answers';end if;
  if coalesce(payload->'form_snapshot','[]'::jsonb) is distinct from private.retail_intake_form(rid) then raise exception 'Intake questions changed. Reload before submitting';end if;
  insert into public.retail_intakes(relationship_id,answers,form_snapshot) values(rid,payload->'answers',private.retail_intake_form(rid)) on conflict(relationship_id) do update set answers=excluded.answers,form_snapshot=excluded.form_snapshot,updated_at=now();
 elsif action='consultation' then
  if not coalesce(staff,false) or r.status='ended' then raise exception 'Store staff required';end if;
  target:=nullif(payload->>'id','')::uuid;draft:=payload->'draft';
  if target is null or not exists(select 1 from public.retail_consultations where id=target) then
   insert into public.retail_consultations(id,relationship_id,draft,step,created_by) values(coalesce(target,gen_random_uuid()),rid,draft,(payload->>'step')::integer,uid) returning to_jsonb(retail_consultations.*) into result;
  elsif payload->>'revision' is null then
   select to_jsonb(x.*) into result from public.retail_consultations x where id=target and relationship_id=rid and x.created_by=uid and x.draft=payload->'draft';
   if result is null then raise exception 'Draft already exists. Reload it before saving';end if;
  else
   update public.retail_consultations x set draft=payload->'draft',step=(payload->>'step')::integer,revision=x.revision+1,updated_at=now() where x.id=target and x.relationship_id=rid and x.status='draft' and x.revision=(payload->>'revision')::integer returning to_jsonb(x.*) into result;
   if not found then raise exception 'Draft changed. Reload it before saving';end if;
  end if;
 elsif action='publish' then
  if not coalesce(staff,false) or r.status<>'active' then raise exception 'Connect the customer before publishing';end if;
  select * into c from public.retail_consultations where id=(payload->>'id')::uuid and relationship_id=rid for update;
  if c.id is null then raise exception 'Draft unavailable';end if;
  if r.profile_id is null then raise exception 'Customer must connect before publishing';end if;
  if c.status='published' then return jsonb_build_object('published',true);end if;
  if c.revision is distinct from (payload->>'revision')::integer then raise exception 'Draft changed. Review the latest version';end if;
  if coalesce(c.draft->>'goal','')='' or coalesce(c.draft->>'guidance','')='' then raise exception 'Goal and customer guidance are required';end if;
  if coalesce(c.draft->>'next_scan','')='' or coalesce(c.draft->>'checkin_date','')='' then raise exception 'Choose the next scan and check-in dates';end if;
  if exists(select 1 from jsonb_each_text(c.draft) e where e.key in ('calories','protein','carbs','fat') and coalesce(e.value,'')<>'' and (e.value!~'^[0-9]+(\.[0-9]+)?$' or length(e.value)>8)) then raise exception 'Invalid nutrition target';end if;
  insert into public.retail_plans(relationship_id,consultation_id,content,published_by) values(rid,c.id,jsonb_build_object('goal',c.draft->>'goal','guidance',c.draft->>'guidance','calories',c.draft->>'calories','protein',c.draft->>'protein','carbs',c.draft->>'carbs','fat',c.draft->>'fat','habits',c.draft->>'habits','products',c.draft->>'products','checkin_date',c.draft->>'checkin_date','next_scan',c.draft->>'next_scan'),uid);
  update public.retail_consultations set status='published',published_at=now(),revision=revision+1 where id=c.id;
  update public.retail_relationships set goal=left(c.draft->>'goal',500),revision=revision+1 where id=rid;
  select * into loc from public.retail_locations where id=lid;
  update public.retail_tasks set status='canceled',note='Superseded by a new published plan',revision=revision+1 where relationship_id=rid and status='open' and sequence_key is not null and kind in ('checkin','scan','product');
  insert into public.retail_tasks(relationship_id,title,kind,due_at,assigned_to,sequence_key) values
   (rid,'First-week check-in','checkin',((c.draft->>'checkin_date')::date+time '10:00') at time zone loc.timezone,r.assigned_to,c.id||':checkin'),
   (rid,'Return for your progress scan','scan',((c.draft->>'next_scan')::date+time '10:00') at time zone loc.timezone,r.assigned_to,c.id||':scan');
  if nullif(c.draft->>'product_followup','') is not null then
   insert into public.retail_tasks(relationship_id,title,kind,due_at,assigned_to,sequence_key) values(rid,'Review your product routine','product',((c.draft->>'product_followup')::date+time '10:00') at time zone loc.timezone,r.assigned_to,c.id||':product');
  end if;
  insert into public.retail_notifications(relationship_id,body,dedupe_key) values(rid,'Your store plan is ready. Open your plan to see your next steps.',c.id||':published');
  result:=jsonb_build_object('published',true);
 elsif action='file' then
  if not private.retail_active(rid) then raise exception 'Active connection required';end if;
  if not private.retail_upload_path(payload->>'object_path') or split_part(payload->>'object_path','/',1)<>rid::text then raise exception 'Invalid upload path';end if;
  if not exists(select 1 from storage.objects where bucket_id='retail-files' and name=payload->>'object_path') then raise exception 'Upload the file before saving';end if;
  insert into public.retail_files(id,relationship_id,object_path,label,kind,created_by) values((payload->>'id')::uuid,rid,payload->>'object_path',left(payload->>'label',160),payload->>'kind',uid) on conflict(id) do nothing;
 elsif action='assessment' then
  if not coalesce(staff,false) then raise exception 'Store staff required';end if;
  if (payload->>'measured_on')::date>current_date then raise exception 'Assessment date cannot be in the future';end if;
  insert into public.retail_assessments(relationship_id,measured_on,weight,unit,body_fat,muscle_mass,source,source_key,note,created_by) values(rid,(payload->>'measured_on')::date,nullif(payload->>'weight','')::numeric,payload->>'unit',nullif(payload->>'body_fat','')::numeric,nullif(payload->>'muscle_mass','')::numeric,coalesce(payload->>'source','manual'),nullif(payload->>'source_key',''),left(coalesce(payload->>'note',''),2000),uid) on conflict(relationship_id,source_key) do nothing returning to_jsonb(retail_assessments.*) into result;
 elsif action='note' then
  if not coalesce(staff,false) then raise exception 'Store staff required';end if;
  insert into public.retail_notes(relationship_id,body,author_id) values(rid,trim(payload->>'body'),uid);
 elsif action='task' then
  if not coalesce(staff,false) then raise exception 'Store staff required';end if;
  target:=nullif(payload->>'id','')::uuid;
  if target is null then
   insert into public.retail_tasks(relationship_id,title,kind,due_at,assigned_to) values(rid,left(trim(payload->>'title'),200),payload->>'kind',(payload->>'due_at')::timestamptz,r.assigned_to);
  else
   if length(trim(coalesce(payload->>'note','')))=0 then raise exception 'Add a completion or rescheduling note';end if;
   update public.retail_tasks t set status=payload->>'status',due_at=coalesce(nullif(payload->>'due_at','')::timestamptz,t.due_at),note=left(payload->>'note',2000),completed_at=case when payload->>'status'='done' then now() end,revision=t.revision+1 where t.id=target and t.relationship_id=rid and t.revision=(payload->>'revision')::integer;
   if not found then raise exception 'Task changed. Refresh before saving';end if;
  end if;
 elsif action='message' then
  if not private.retail_active(rid) then raise exception 'Store connection is not active';end if;
  insert into public.retail_messages(id,relationship_id,body,author_id,author_name,from_customer) select (payload->>'id')::uuid,rid,trim(payload->>'body'),uid,p.name,private.retail_is_customer(rid) from public.profiles p where p.id=uid on conflict(id) do nothing;
  if found then
   insert into public.retail_threads(relationship_id) values(rid) on conflict(relationship_id) do update set status='open',revision=public.retail_threads.revision+1;
  end if;
 elsif action='composing' then
  if not coalesce(staff,false) then raise exception 'Store staff required';end if;
  insert into public.retail_threads(relationship_id,composing_by,composing_until) values(rid,uid,now()+interval '45 seconds') on conflict(relationship_id) do update set composing_by=uid,composing_until=now()+interval '45 seconds' where public.retail_threads.composing_by=uid or public.retail_threads.composing_until<now() or public.retail_threads.composing_until is null;
 elsif action='thread' then
  if not coalesce(staff,false) then raise exception 'Store staff required';end if;
  if exists(select 1 from public.retail_threads where relationship_id=rid and revision is distinct from (payload->>'revision')::integer) then raise exception 'Conversation changed. Refresh before assigning or resolving';end if;
  target:=nullif(payload->>'assigned_to','')::uuid;
  if target is not null and not exists(select 1 from public.retail_staff where user_id=target and location_id=lid and active) then raise exception 'Choose active store staff';end if;
  insert into public.retail_threads(relationship_id,assigned_to,status) values(rid,target,payload->>'status') on conflict(relationship_id) do update set assigned_to=excluded.assigned_to,status=excluded.status,revision=public.retail_threads.revision+1;
 elsif action='read' then
  insert into public.retail_read_receipts(relationship_id,user_id) values(rid,uid) on conflict(relationship_id,user_id) do update set read_at=now();
  if private.retail_is_customer(rid) then update public.retail_notifications set read_at=now() where relationship_id=rid and read_at is null;end if;
 elsif action='checkin' then
  if not private.retail_is_customer(rid) or not private.retail_active(rid) then raise exception 'Active customer required';end if;
  insert into public.retail_checkins(id,relationship_id,answers) values((payload->>'id')::uuid,rid,payload->'answers') on conflict(id) do nothing;
  update public.retail_tasks set status='done',completed_at=now(),revision=revision+1 where relationship_id=rid and kind='checkin' and status='open' and due_at<now()+interval '3 days';
 elsif action='review_checkin' then
  if not coalesce(staff,false) then raise exception 'Store staff required';end if;
  update public.retail_checkins set reviewed_at=now() where id=(payload->>'id')::uuid and relationship_id=rid;
 elsif action='template' then
  oid:=(payload->>'organization_id')::uuid;
  if jsonb_typeof(payload->'content') is distinct from 'object' or length(trim(coalesce(payload->>'title','')))=0 then raise exception 'Resource title and content required';end if;
  if payload->'content' ? 'questions' then
   if jsonb_typeof(payload->'content'->'questions')<>'array' or jsonb_array_length(payload->'content'->'questions')>20 then raise exception 'Use up to 20 intake questions';end if;
   if exists(select 1 from jsonb_array_elements(payload->'content'->'questions') q where length(trim(coalesce(q->>'label','')))=0 or q->>'id' is null) then raise exception 'Each question needs a label and ID';end if;
  end if;
  if not ((lid is null and private.retail_org_access(oid,true)) or (lid is not null and private.retail_location_access(lid,true))) then raise exception 'Template manager required';end if;
  target:=nullif(payload->>'id','')::uuid;
  if target is null then insert into public.retail_templates(organization_id,location_id,category,title,content,published,author_id) values(oid,lid,payload->>'category',left(payload->>'title',160),payload->'content',(payload->>'published')::boolean,uid);
  else update public.retail_templates t set title=left(payload->>'title',160),content=payload->'content',published=(payload->>'published')::boolean,version=t.version+1,updated_at=now() where t.id=target and t.organization_id=oid and t.location_id is not distinct from lid and t.version=(payload->>'version')::integer;
   if not found then raise exception 'Template changed. Refresh before saving';end if;
  end if;
 else raise exception 'Unknown action';end if;
 insert into public.retail_audit(organization_id,location_id,actor_id,action,subject_id) values(oid,lid,uid,action,coalesce(rid,target));
 return coalesce(result,'{}'::jsonb);
end $$;
create function public.retail_command(action text,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.retail_command(action,payload); $$;

-- Public lookup reveals only the store name and response expectation, never the invite email.
create function private.retail_join_info(code uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('name',l.name,'organization',o.name,'response_expectation',l.response_expectation) from public.retail_locations l join public.retail_organizations o on o.id=l.organization_id where l.enabled and o.enabled and (l.join_code=code or exists(select 1 from public.retail_invitations i where i.token=code and i.location_id=l.id and i.expires_at>now() and i.accepted_at is null)); $$;
create function public.retail_join_info(code uuid) returns jsonb language sql security invoker set search_path='' as $$select private.retail_join_info(code);$$;
create function private.retail_reports(lid uuid, since_at timestamptz) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not private.retail_location_access(lid,true) then raise exception 'Manager required';end if;
 return jsonb_build_object('since',since_at,'customers',(select count(*) from public.retail_relationships where location_id=lid and created_at>=since_at),
 'activated',(select count(*) from public.retail_relationships where location_id=lid and activated_at>=since_at),
 'consultations',(select count(*) from public.retail_consultations c join public.retail_relationships r on r.id=c.relationship_id where r.location_id=lid and c.published_at>=since_at),
 'scans',(select count(*) from public.retail_assessments a join public.retail_relationships r on r.id=a.relationship_id where r.location_id=lid and a.created_at>=since_at),
 'repeat_scans',(select count(*) from (select a.relationship_id from public.retail_assessments a join public.retail_relationships r on r.id=a.relationship_id where r.location_id=lid group by a.relationship_id having count(*)>=2 and max(a.created_at)>=since_at) x),
 'tasks_due',(select count(*) from public.retail_tasks t join public.retail_relationships r on r.id=t.relationship_id where r.location_id=lid and t.due_at>=since_at and t.due_at<=now() and t.status<>'canceled'),
 'tasks_completed',(select count(*) from public.retail_tasks t join public.retail_relationships r on r.id=t.relationship_id where r.location_id=lid and t.due_at>=since_at and t.due_at<=now() and t.status='done'),
 'active_staff',(select count(*) from public.retail_staff where location_id=lid and active));
end $$;
create function public.retail_reports(lid uuid,since_at timestamptz) returns jsonb language sql security invoker set search_path='' as $$select private.retail_reports(lid,since_at);$$;

-- In-app reminders do not depend on an external email vendor. Service-only worker,
-- unique delivery keys and row locks make retries safe. Invoked by secured cron.
create function public.retail_process_reminders() returns integer language plpgsql security definer set search_path='' as $$
declare t record; n integer:=0;begin
 for t in select x.*,r.profile_id from public.retail_tasks x join public.retail_relationships r on r.id=x.relationship_id join public.retail_locations l on l.id=r.location_id join public.retail_organizations o on o.id=l.organization_id where x.status='open' and x.due_at<=now() and r.status='active' and r.service_reminders and l.enabled and o.enabled and not exists(select 1 from public.retail_notifications n where n.dedupe_key=x.id||':'||x.revision) order by x.due_at limit 500 for update of x skip locked loop
  insert into public.retail_notifications(relationship_id,task_id,body,dedupe_key) values(t.relationship_id,t.id,t.title,t.id||':'||t.revision) on conflict(dedupe_key) do nothing;
  if found then n:=n+1;end if;
 end loop;return n;end $$;
revoke all on function public.retail_process_reminders() from public,anon,authenticated;
grant execute on function public.retail_process_reminders() to service_role;

-- Sponsorship never changes Stripe ownership or member subscription fields.
create function private.retail_sponsored() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.retail_relationships r join public.retail_locations l on l.id=r.location_id join public.retail_organizations o on o.id=l.organization_id where r.profile_id=auth.uid() and r.status='active' and l.enabled and o.enabled and l.sponsorship_ends_at>now()); $$;
create function public.retail_sponsored() returns boolean language sql security invoker set search_path='' as $$select private.retail_sponsored();$$;
-- Keep existing paid-access logic, add sponsorship only when the account is not locked.
alter function public.member_weight_access() rename to member_weight_access_before_retail;
create function public.member_weight_access() returns boolean language sql stable security invoker set search_path='' as $$
 select public.member_weight_access_before_retail() or (private.retail_sponsored() and not exists(select 1 from public.profiles where id=auth.uid() and (admin_override='locked' or member_subscription->>'admin_override'='locked')));$$;
-- Existing policies bind by OID; update their expressions to use the replacement.
alter policy member_weight_requires_pro on public.weight_log using ((select public.member_weight_access()) or exists(select 1 from public.clients c where c.id=weight_log.client_id and c.coach_id=auth.uid() and c.profile_id is distinct from auth.uid())) with check ((select public.member_weight_access()) or exists(select 1 from public.clients c where c.id=weight_log.client_id and c.coach_id=auth.uid() and c.profile_id is distinct from auth.uid()));
alter policy checkin_weight_insert_requires_pro on public.checkins with check(weight is null or (select public.member_weight_access()));
alter policy checkin_weight_update_requires_pro on public.checkins with check(weight is null or (select public.member_weight_access()));

-- Allow staff to read only explicitly shared personal activity; no retail writes to it.
create function private.retail_shared_member(cid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.clients c join public.retail_relationships r on r.profile_id=c.profile_id where c.id=cid and r.share_activity and r.status='active' and private.retail_customer_access(r.id,true));$$;
create policy retail_shared_food on public.food_log for select to authenticated using(private.retail_shared_member(client_id));
create policy retail_shared_weight on public.weight_log for select to authenticated using(private.retail_shared_member(client_id));
alter policy member_weight_requires_pro on public.weight_log using ((select public.member_weight_access()) or private.retail_shared_member(client_id) or exists(select 1 from public.clients c where c.id=weight_log.client_id and c.coach_id=auth.uid() and c.profile_id is distinct from auth.uid()));
-- No storage access changes: personal photos remain private until a separate photo-sharing workflow.


create function private.retail_staff_directory(lid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if not private.retail_location_access(lid) then raise exception 'Store access required';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'user_id',s.user_id,'name',p.name,'role',s.role,'location_id',s.location_id,'active',s.active)) from public.retail_staff s join public.profiles p on p.id=s.user_id where s.location_id=lid and s.active),'[]');end$$;
create function public.retail_staff_directory(lid uuid) returns jsonb language sql security invoker set search_path='' as $$select private.retail_staff_directory(lid);$$;
create function private.retail_intake_form(rid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$declare lid uuid;oid uuid;begin
 if not private.retail_customer_access(rid) then raise exception 'Customer unavailable';end if;
 select r.location_id,l.organization_id into lid,oid from public.retail_relationships r join public.retail_locations l on l.id=r.location_id where r.id=rid;
 return coalesce((select t.content->'questions' from public.retail_templates t where t.organization_id=oid and (t.location_id=lid or t.location_id is null) and t.category='consultation' and t.published order by (t.location_id is not null) desc,t.updated_at desc limit 1),'[]');end$$;
create function public.retail_intake_form(rid uuid) returns jsonb language sql security invoker set search_path='' as $$select private.retail_intake_form(rid);$$;
create function private.retail_inbox(lid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if not private.retail_location_access(lid) then raise exception 'Store access required';end if;
 return coalesce((select jsonb_agg(x) from(select t.*,r.name,
 (select count(*) from public.retail_messages m where m.relationship_id=r.id and m.author_id<>auth.uid() and m.created_at>coalesce((select read_at from public.retail_read_receipts where relationship_id=r.id and user_id=auth.uid()),'-infinity'::timestamptz)) unread,
 (select max(created_at) from public.retail_messages where relationship_id=r.id) last_message_at
 from public.retail_threads t join public.retail_relationships r on r.id=t.relationship_id where r.location_id=lid and private.retail_customer_access(r.id,true)
 order by (select max(created_at) from public.retail_messages where relationship_id=r.id) desc nulls last limit 100) x),'[]');end$$;
create function public.retail_inbox(lid uuid) returns jsonb language sql security invoker set search_path='' as $$select private.retail_inbox(lid);$$;
revoke all on function public.retail_staff_directory(uuid),public.retail_intake_form(uuid),public.retail_inbox(uuid) from public,anon;
grant execute on function public.retail_staff_directory(uuid),public.retail_intake_form(uuid),public.retail_inbox(uuid) to authenticated;

create function private.retail_activity(rid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$declare pid uuid;begin
 if not private.retail_customer_access(rid) then raise exception 'Customer unavailable';end if;
 select profile_id into pid from public.retail_relationships where id=rid and status='active' and (share_activity or profile_id=auth.uid());
 if pid is null then return jsonb_build_object('shared',false);end if;
 return jsonb_build_object('shared',true,'foods',coalesce((select jsonb_agg(x) from (select f.date,f.name,f.meal,f.quantity,f.serving_unit,f.calories,f.protein,f.carbs,f.fat from public.food_log f join public.clients c on c.id=f.client_id where c.profile_id=pid and f.date>=current_date-30 order by f.date desc limit 500)x),'[]'),'weights',coalesce((select jsonb_agg(x) from(select w.date,w.value,w.unit from public.weight_log w join public.clients c on c.id=w.client_id where c.profile_id=pid and w.date>=current_date-90 order by w.date desc limit 100)x),'[]'));
end$$;
create function public.retail_activity(rid uuid) returns jsonb language sql security invoker set search_path='' as $$select private.retail_activity(rid);$$;
revoke all on function public.retail_activity(uuid) from public,anon;
grant execute on function public.retail_activity(uuid) to authenticated;

create function public.retail_queue_counts(lid uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('invited',(select count(*) from public.retail_relationships where location_id=lid and status='invited'),'due',(select count(*) from public.retail_tasks t join public.retail_relationships r on r.id=t.relationship_id where r.location_id=lid and t.status='open' and t.due_at<=now()),'open',(select count(*) from public.retail_threads t join public.retail_relationships r on r.id=t.relationship_id where r.location_id=lid and t.status='open'));$$;
revoke all on function public.retail_queue_counts(uuid) from public,anon;
grant execute on function public.retail_queue_counts(uuid) to authenticated;
-- Supabase provides pg_cron. Local SQL harnesses without the extension skip
-- scheduling; deployment verification must check the named job is active.
do $$begin
 if exists(select 1 from pg_available_extensions where name='pg_cron') then
  execute 'create extension if not exists pg_cron';
  execute $job$select cron.schedule('retail-service-reminders','*/5 * * * *','select public.retail_process_reminders()')$job$;
 end if;
end$$;

do $$ declare f record;begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname like 'retail_%' loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 execute format('grant execute on function %s to authenticated',f.signature);
 end loop;end $$;
grant usage on schema private to authenticated;
revoke all on function public.retail_command(text,jsonb),public.retail_reports(uuid,timestamptz),public.retail_sponsored(),public.member_weight_access() from public,anon;
grant execute on function public.retail_command(text,jsonb),public.retail_reports(uuid,timestamptz),public.retail_sponsored(),public.member_weight_access() to authenticated;
revoke all on function private.retail_join_info(uuid),public.retail_join_info(uuid) from public;
grant usage on schema private to anon;
grant execute on function private.retail_join_info(uuid),public.retail_join_info(uuid) to anon,authenticated;
commit;
