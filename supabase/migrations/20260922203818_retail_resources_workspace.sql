-- Reusable material is distinct from immutable customer assignments.
create table public.retail_resources (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.retail_organizations,
 location_id uuid, title text not null check(length(trim(title)) between 1 and 160), description text not null default '' check(length(description)<=500),
 kind text not null check(kind in ('meal_plan','form','guide')), audience text not null default 'customer' check(audience in ('customer','staff')),
 status text not null default 'draft' check(status in ('draft','published','archived')), content jsonb not null default '{}',
 allow_copy boolean not null default true, version integer not null default 1, author_id uuid not null references public.profiles,
 updated_at timestamptz not null default now(), foreign key(location_id,organization_id) references public.retail_locations(id,organization_id)
);
create table public.retail_resource_assignments (
 id uuid primary key, resource_id uuid not null references public.retail_resources, relationship_id uuid not null references public.retail_relationships,
 resource_version integer not null, title text not null, kind text not null, content jsonb not null, message text not null default '', due_date date,
 assigned_by uuid not null references public.profiles, assigned_at timestamptz not null default now(),
 completed_at timestamptz, answers jsonb, meal_plan_id uuid references public.meal_plans on delete set null
);
create index retail_resources_scope on public.retail_resources(organization_id,location_id,status);
create index retail_resource_assignments_customer on public.retail_resource_assignments(relationship_id,assigned_at desc);
create index retail_resource_assignments_resource on public.retail_resource_assignments(resource_id,assigned_at desc);
alter table public.retail_resources enable row level security;
alter table public.retail_resource_assignments enable row level security;
revoke all on public.retail_resources, public.retail_resource_assignments from anon,authenticated;
grant select on public.retail_resources,public.retail_resource_assignments to authenticated;
create policy retail_resources_read on public.retail_resources for select to authenticated using (
 ((location_id is null and private.retail_org_access(organization_id)) or private.retail_location_access(location_id))
 and (status='published' or (location_id is null and private.retail_org_access(organization_id,true)) or private.retail_location_access(location_id,true))
);
create policy retail_resource_assignments_read on public.retail_resource_assignments for select to authenticated using(private.retail_customer_access(relationship_id));
-- Preserve existing guides/outlines; do not change the legacy intake system.
insert into public.retail_resources(id,organization_id,location_id,title,kind,audience,status,content,version,author_id,updated_at)
 select id,organization_id,location_id,title,case when category='consultation' and jsonb_array_length(coalesce(content->'questions','[]'))>0 then 'form' else 'guide' end,
 'staff',case when published then 'published' else 'draft' end,content,version,author_id,updated_at from public.retail_templates;

create function private.retail_resource_command(action text,payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); lid uuid; oid uuid; rid uuid; target uuid; source public.retail_resources%rowtype; item public.retail_resources%rowtype;
 a public.retail_resource_assignments%rowtype; c jsonb; q jsonb; answer jsonb; d jsonb; foods jsonb; food jsonb; k text; mp uuid;
begin
 if uid is null then raise exception 'Sign in required';end if;
 if action='save' then
  lid:=nullif(payload->>'location_id','')::uuid;oid:=(payload->>'organization_id')::uuid;
  if not coalesce(case when lid is null then private.retail_org_access(oid,true) else private.retail_location_access(lid,true) end,false) then raise exception 'Resource manager required';end if;
  if lid is not null and not exists(select 1 from public.retail_locations where id=lid and organization_id=oid) then raise exception 'Invalid store';end if;
  target:=coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());
  select * into item from public.retail_resources where id=target for update;
  if found and (item.organization_id<>oid or item.location_id is distinct from lid or item.version is distinct from (payload->>'version')::integer) then raise exception 'Resource changed. Reload before saving';end if;
  if payload->>'copy_from' is not null then
   select * into source from public.retail_resources where id=(payload->>'copy_from')::uuid;
   if not found or not source.allow_copy or source.organization_id<>oid or (source.location_id is not null and source.location_id is distinct from lid) or source.status<>'published' then raise exception 'This resource cannot be copied';end if;
  end if;
  c:=payload->'content';
  if jsonb_typeof(c) is distinct from 'object' or pg_column_size(c)>250000 then raise exception 'Invalid resource content';end if;
  if payload->>'kind'='form' then
   if jsonb_typeof(c->'questions') is distinct from 'array' or jsonb_array_length(c->'questions') not between 1 and 20 then raise exception 'Add 1–20 questions';end if;
   for q in select value from jsonb_array_elements(c->'questions') loop
    if length(trim(coalesce(q->>'label',''))) not between 1 and 300 or coalesce(q->>'id','')='' or coalesce(q->>'type','text') not in ('text','long','number','select') then raise exception 'Invalid question';end if;
    if q->>'type'='select' and (jsonb_typeof(q->'options') is distinct from 'array' or jsonb_array_length(q->'options') not between 1 and 20) then raise exception 'Add response options';end if;
    if q->>'type'='select' and exists(select 1 from jsonb_array_elements(q->'options') o where jsonb_typeof(o)<>'string' or length(trim(o#>>'{}')) not between 1 and 200) then raise exception 'Each option needs text';end if;
   end loop;
   if (select count(distinct x->>'id') from jsonb_array_elements(c->'questions')x)<>jsonb_array_length(c->'questions') then raise exception 'Duplicate question IDs';end if;
  elsif payload->>'kind'='guide' then
   if length(trim(coalesce(c->>'body',''))) not between 1 and 20000 then raise exception 'Add guide content (up to 20,000 characters)';end if;
  elsif payload->>'kind'='meal_plan' then
   if jsonb_typeof(c->'days') is distinct from 'array' or jsonb_array_length(c->'days') not between 1 and 14 then raise exception 'Add 1–14 meal plan days';end if;
   for d in select value from jsonb_array_elements(c->'days') loop
    if jsonb_typeof(d->'meals') is distinct from 'object' then raise exception 'Invalid meals';end if;
    for k,foods in select key,value from jsonb_each(d->'meals') loop
     if k not in ('Breakfast','Lunch','Dinner','Snack') or jsonb_typeof(foods)<>'array' or jsonb_array_length(foods)>40 then raise exception 'Invalid meal';end if;
     for food in select value from jsonb_array_elements(foods) loop
      if length(trim(coalesce(food->>'name',''))) not between 1 and 200 then raise exception 'Food name required';end if;
      if exists(select 1 from unnest(array['calories','protein','carbs','fat']) n where coalesce(food->>n,'')!~'^[0-9]+(\.[0-9]+)?$') then raise exception 'Valid food nutrition required';end if;
     end loop;
    end loop;
   end loop;
  end if;
  insert into public.retail_resources(id,organization_id,location_id,title,description,kind,audience,status,content,allow_copy,author_id)
   values(target,oid,lid,trim(payload->>'title'),coalesce(payload->>'description',''),payload->>'kind',payload->>'audience',payload->>'status',c,coalesce((payload->>'allow_copy')::boolean,true),uid)
   on conflict(id) do update set title=excluded.title,description=excluded.description,kind=excluded.kind,audience=excluded.audience,status=excluded.status,content=excluded.content,allow_copy=excluded.allow_copy,version=public.retail_resources.version+1,updated_at=now();
 elsif action='archive' then
  target:=(payload->>'id')::uuid;select * into item from public.retail_resources where id=target for update;
  if not found or not coalesce(case when item.location_id is null then private.retail_org_access(item.organization_id,true) else private.retail_location_access(item.location_id,true) end,false) then raise exception 'Resource manager required';end if;
  if item.version is distinct from (payload->>'version')::integer then raise exception 'Resource changed. Reload before archiving';end if;
  update public.retail_resources set status='archived',version=version+1,updated_at=now() where id=target;
  oid:=item.organization_id;lid:=item.location_id;
 elsif action='assign' then
  rid:=(payload->>'relationship_id')::uuid;target:=(payload->>'request_id')::uuid;
  if target is null or not private.retail_customer_access(rid,true) or not private.retail_active(rid) then raise exception 'An active customer and authorized staff are required';end if;
  select location_id into lid from public.retail_relationships where id=rid;select organization_id into oid from public.retail_locations where id=lid;
  select * into item from public.retail_resources where id=(payload->>'resource_id')::uuid;
  if not found or item.organization_id<>oid or (item.location_id is not null and item.location_id<>lid) or item.status<>'published' or item.audience<>'customer' then raise exception 'Choose a published customer resource for this store';end if;
  -- Serialize retries of one assignment so no duplicate chats/plans are created.
  perform pg_advisory_xact_lock(hashtextextended(target::text,0));
  select * into a from public.retail_resource_assignments where id=target;
  if found then
   if a.relationship_id=rid and a.resource_id=item.id then return target;end if;
   raise exception 'Assignment ID unavailable';
  end if;
  if item.version is distinct from (payload->>'resource_version')::integer then raise exception 'Resource changed. Reopen it before assigning';end if;
  c:=item.content;
  if item.kind='meal_plan' then
   mp:=private.retail_publish_nutrition(rid,target,payload->>'title',payload->'days',payload->'targets');
   c:=jsonb_build_object('days',payload->'days','targets',payload->'targets');
  end if;
  if length(coalesce(payload->>'message',''))>2000 then raise exception 'Message is too long';end if;
  insert into public.retail_resource_assignments(id,resource_id,relationship_id,resource_version,title,kind,content,message,due_date,assigned_by,meal_plan_id)
   values(target,item.id,rid,item.version,case when item.kind='meal_plan' then payload->>'title' else item.title end,item.kind,c,coalesce(payload->>'message',''),nullif(payload->>'due_date','')::date,uid,mp);
  insert into public.retail_messages(id,relationship_id,body,author_id,author_name,from_customer)
   select target,rid,'Shared '||case item.kind when 'form' then 'a form' when 'meal_plan' then 'a meal plan' else 'a guide' end||': '||item.title||'. Open Resources to view it.'||case when coalesce(payload->>'message','')<>'' then E'\n'||(payload->>'message') else '' end,uid,p.name,false from public.profiles p where p.id=uid;
  insert into public.retail_threads(relationship_id) values(rid) on conflict(relationship_id) do update set status='open',revision=public.retail_threads.revision+1;
  insert into public.retail_notifications(relationship_id,body,dedupe_key) values(rid,'Your store shared '||item.title||'. Open Resources to view it.',target||':resource');
 elsif action='complete' then
  target:=(payload->>'id')::uuid;select * into a from public.retail_resource_assignments where id=target for update;
  if not found or not private.retail_is_customer(a.relationship_id) or not private.retail_customer_access(a.relationship_id) or not private.retail_active(a.relationship_id) then raise exception 'Customer access required';end if;
  if a.completed_at is not null then return target;end if;
  c:=payload->'answers';
  if a.kind='form' then
   if jsonb_typeof(c) is distinct from 'object' or pg_column_size(c)>50000 then raise exception 'Invalid answers';end if;
   for q in select value from jsonb_array_elements(a.content->'questions') loop
    answer:=c->(q->>'id');
    if coalesce((q->>'required')::boolean,false) and length(trim(coalesce(c->>(q->>'id'),'')))=0 then raise exception 'Complete all required questions';end if;
    if answer is not null and (jsonb_typeof(answer)<>'string' or length(c->>(q->>'id'))>5000) then raise exception 'Invalid answer';end if;
    if coalesce(c->>(q->>'id'),'')<>'' and q->>'type'='select' and not (q->'options' ? (c->>(q->>'id'))) then raise exception 'Choose a listed response';end if;
    if coalesce(c->>(q->>'id'),'')<>'' and q->>'type'='number' and (c->>(q->>'id'))!~'^-?[0-9]+(\.[0-9]+)?$' then raise exception 'Enter a number';end if;
   end loop;
  else c:='{}';end if;
  update public.retail_resource_assignments set completed_at=now(),answers=c where id=target;
  if a.kind='form' then
   insert into public.retail_messages(id,relationship_id,body,author_id,author_name,from_customer)
    select gen_random_uuid(),a.relationship_id,'Completed form: '||a.title||'. Responses are available in Resources.',uid,p.name,true from public.profiles p where p.id=uid;
   insert into public.retail_threads(relationship_id) values(a.relationship_id) on conflict(relationship_id) do update set status='open',revision=public.retail_threads.revision+1;
  end if;
  rid:=a.relationship_id;select location_id into lid from public.retail_relationships where id=rid;select organization_id into oid from public.retail_locations where id=lid;
 else raise exception 'Unknown resource action';end if;
 insert into public.retail_audit(organization_id,location_id,actor_id,action,subject_id) values(oid,lid,uid,'resource_'||action,target);
 return target;
end$$;
revoke all on function private.retail_resource_command(text,jsonb) from public,anon;
grant execute on function private.retail_resource_command(text,jsonb) to authenticated;
create function public.retail_resource_command(action text,payload jsonb) returns uuid language sql security invoker set search_path='' as $$select private.retail_resource_command(action,payload);$$;
revoke all on function public.retail_resource_command(text,jsonb) from public,anon;
grant execute on function public.retail_resource_command(text,jsonb) to authenticated;
-- Invoker rights apply resource and assignment RLS to catalog counts.
create function public.retail_resource_catalog(lid uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(x order by x.updated_at desc),'[]') from (
 select r.*, (select count(*) from public.retail_resource_assignments a where a.resource_id=r.id) as usage_count
 from public.retail_resources r join public.retail_locations l on l.id=lid
 where r.organization_id=l.organization_id and (r.location_id=lid or r.location_id is null)
 order by r.updated_at desc limit 1000)x;
$$;
revoke all on function public.retail_resource_catalog(uuid) from public,anon;
grant execute on function public.retail_resource_catalog(uuid) to authenticated;

-- Readiness now tracks the Resources catalog, preserving the existing health checks.
create or replace function public.retail_operations(lid uuid) returns jsonb language sql security invoker set search_path='' as $$
 select jsonb_set(private.retail_operations(lid),'{setup,resources}',to_jsonb((select count(*) from public.retail_resources r join public.retail_locations l on l.id=lid where r.organization_id=l.organization_id and (r.location_id=lid or r.location_id is null) and r.status='published')));
$$;
