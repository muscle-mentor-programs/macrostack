begin;
create table public.retail_worker_health (
 id boolean primary key default true check(id), last_started_at timestamptz, last_finished_at timestamptz,
 status text not null check(status in ('running','ok','failed')), processed integer not null default 0
);
alter table public.retail_worker_health enable row level security;
revoke all on public.retail_worker_health from public,anon,authenticated;
grant all on public.retail_worker_health to service_role;
alter table public.retail_deliveries add column manual_retries integer not null default 0;
create index retail_relationships_location_page on public.retail_relationships(location_id,created_at desc,id);
create index retail_tasks_open_page on public.retail_tasks(due_at,id) where status='open';
create index retail_delivery_attention on public.retail_deliveries(relationship_id,updated_at desc) where status in ('failed','unknown','queued');

create function private.retail_operations(lid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare counts jsonb;items jsonb;worker jsonb;configured boolean:=false;begin
 if auth.uid() is null or not private.retail_location_access(lid,true) or exists(select 1 from public.profiles where id=auth.uid() and admin_override='locked') then raise exception 'Store manager required';end if;
 select jsonb_build_object('queued',count(*) filter(where d.status='queued'),'failed',count(*) filter(where d.status='failed'),'unknown',count(*) filter(where d.status='unknown'),'delivered',count(*) filter(where d.status='delivered'),'accepted',count(*) filter(where d.status='accepted'),'stalled',count(*) filter(where d.status='queued' and d.available_at<now()-interval '30 minutes')) into counts
 from public.retail_deliveries d join public.retail_relationships r on r.id=d.relationship_id where r.location_id=lid and d.created_at>=now()-interval '30 days';
 select coalesce(jsonb_agg(x),'[]') into items from (select d.id,d.channel,d.status,d.error_code,d.created_at,d.updated_at,d.manual_retries,r.name,
 (d.channel='email' and d.status='failed' and d.manual_retries<3 and d.created_at>now()-interval '23 hours' and d.error_code in ('retries_exhausted','provider_429','provider_500','provider_502','provider_503','provider_504') and r.service_reminders and private.retail_active(r.id) and exists(select 1 from public.retail_contact_preferences p where p.relationship_id=r.id and p.email_enabled)) retryable
 from public.retail_deliveries d join public.retail_relationships r on r.id=d.relationship_id where r.location_id=lid and private.retail_customer_access(r.id,true) and d.status in ('failed','unknown','queued') order by d.updated_at desc,d.id limit 50)x;
 select to_jsonb(h) - 'id' into worker from public.retail_worker_health h where id;
 if to_regclass('vault.secrets') is not null then execute 'select exists(select 1 from vault.secrets where name=''retail_delivery_worker_key'')' into configured;end if;
 return jsonb_build_object('counts',counts,'items',items,'worker',worker,'scheduler_credential',configured,
 'setup',jsonb_build_object('staff',(select count(*) from public.retail_staff where location_id=lid and active),'resources',(select count(*) from public.retail_templates t join public.retail_locations l on l.id=lid where t.organization_id=l.organization_id and (t.location_id=lid or t.location_id is null) and t.published),'customers',(select count(*) from public.retail_relationships where location_id=lid),'billing',(select status from public.retail_contracts where location_id=lid)));
end$$;
create function public.retail_operations(lid uuid) returns jsonb language sql security invoker set search_path='' as $$select private.retail_operations(lid);$$;

create function private.retail_retry_delivery(did uuid) returns void language plpgsql security definer set search_path='' as $$
declare d public.retail_deliveries;r public.retail_relationships;oid uuid;begin
 select * into d from public.retail_deliveries where id=did for update;
 select * into r from public.retail_relationships where id=d.relationship_id;
 if auth.uid() is null or not private.retail_location_access(r.location_id,true) or not private.retail_customer_access(r.id,true) or exists(select 1 from public.profiles where id=auth.uid() and admin_override='locked') then raise exception 'Store manager required';end if;
 if d.channel<>'email' or d.status<>'failed' or d.manual_retries>=3 or d.created_at<=now()-interval '23 hours' or coalesce(d.error_code,'') not in ('retries_exhausted','provider_429','provider_500','provider_502','provider_503','provider_504') then raise exception 'This delivery cannot be safely retried. Review provider status first';end if;
 if not private.retail_active(r.id) or not r.service_reminders or not exists(select 1 from public.retail_contact_preferences where relationship_id=r.id and email_enabled) then raise exception 'Current reminder consent required';end if;
 update public.retail_deliveries set status='queued',attempts=0,manual_retries=manual_retries+1,error_code=null,available_at=now(),updated_at=now() where id=did;
 select organization_id into oid from public.retail_locations where id=r.location_id;
 insert into public.retail_audit(organization_id,location_id,actor_id,action,subject_id) values(oid,r.location_id,auth.uid(),'retry_delivery',did);
end$$;
create function public.retail_retry_delivery(did uuid) returns void language sql security invoker set search_path='' as $$select private.retail_retry_delivery(did);$$;

create function private.retail_inbox_page(lid uuid,page_offset integer default 0,thread_state text default 'all') returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if auth.uid() is null or not private.retail_location_access(lid) then raise exception 'Store access required';end if;
 return coalesce((select jsonb_agg(x) from(select t.*,r.name,
 (select count(*) from public.retail_messages m where m.relationship_id=r.id and m.author_id<>auth.uid() and m.created_at>coalesce((select read_at from public.retail_read_receipts where relationship_id=r.id and user_id=auth.uid()),'-infinity'::timestamptz)) unread,
 (select max(created_at) from public.retail_messages where relationship_id=r.id) last_message_at
 from public.retail_threads t join public.retail_relationships r on r.id=t.relationship_id where r.location_id=lid and private.retail_customer_access(r.id,true) and (thread_state='all' or t.status=thread_state)
 order by (select max(created_at) from public.retail_messages where relationship_id=r.id) desc nulls last,t.relationship_id limit 51 offset greatest(0,page_offset))x),'[]');end$$;
create function public.retail_inbox_page(lid uuid,page_offset integer default 0,thread_state text default 'all') returns jsonb language sql security invoker set search_path='' as $$select private.retail_inbox_page(lid,page_offset,thread_state);$$;
revoke all on function private.retail_operations(uuid),private.retail_retry_delivery(uuid),private.retail_inbox_page(uuid,integer,text),public.retail_operations(uuid),public.retail_retry_delivery(uuid),public.retail_inbox_page(uuid,integer,text) from public,anon;
grant execute on function private.retail_operations(uuid),private.retail_retry_delivery(uuid),private.retail_inbox_page(uuid,integer,text),public.retail_operations(uuid),public.retail_retry_delivery(uuid),public.retail_inbox_page(uuid,integer,text) to authenticated;
commit;
