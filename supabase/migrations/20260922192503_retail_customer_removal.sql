begin;
alter table public.retail_relationships add column deleted_at timestamptz, add column deleted_by uuid references public.profiles(id) on delete set null;
create policy retail_removed_customers_hidden on public.retail_relationships as restrictive for select to authenticated using(deleted_at is null);
create or replace function private.retail_customer_access(rid uuid, staff_only boolean default false) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.retail_relationships r join public.retail_locations l on l.id=r.location_id join public.retail_organizations o on o.id=l.organization_id where r.id=rid and r.deleted_at is null and (
 (not staff_only and r.profile_id=auth.uid()) or private.retail_admin() or
 (private.retail_account(auth.uid()) and o.enabled and l.enabled and r.status<>'ended' and exists(select 1 from public.retail_staff s where s.active and s.user_id=auth.uid() and s.location_id=l.id and (s.role='manager' or (s.role='specialist' and (r.assigned_to=auth.uid() or r.assigned_to is null)))))));
$$;
create function private.retail_prevent_removed_reactivation() returns trigger language plpgsql set search_path='' as $$begin
 if old.deleted_at is not null and (new.deleted_at is null or new.status<>'ended') then raise exception 'Deleted customers cannot be reactivated. Create a new invitation';end if;return new;
end$$;
revoke all on function private.retail_prevent_removed_reactivation() from public,anon,authenticated;
create trigger retail_prevent_removed_reactivation before update on public.retail_relationships for each row execute function private.retail_prevent_removed_reactivation();
create function private.retail_delete_customer(rid uuid, expected_revision integer) returns void language plpgsql security definer set search_path='' as $$
declare r public.retail_relationships%rowtype;
begin
 select * into r from public.retail_relationships where id=rid for update;
 if auth.uid() is null or r.id is null or (not private.retail_admin() and not private.retail_account(auth.uid())) or not private.retail_location_access(r.location_id,true) then raise exception 'Store management permission required';end if;
 if r.deleted_at is not null then return;end if;
 if r.revision is distinct from expected_revision then raise exception 'Customer changed. Refresh before deleting';end if;
 update public.retail_relationships set status='ended',deleted_at=now(),deleted_by=auth.uid(),share_activity=false,share_app_records=false,service_reminders=false,marketing_consent=false,revision=revision+1 where id=rid;
 update public.retail_tasks set status='canceled',note='Customer removed from store',revision=revision+1 where relationship_id=rid and status='open';
 update public.retail_threads set status='resolved',revision=revision+1 where relationship_id=rid;
 update public.retail_invitations set expires_at=least(expires_at,now()) where relationship_id=rid and accepted_at is null;
 insert into public.retail_audit(location_id,actor_id,action,subject_id) values(r.location_id,auth.uid(),'delete_customer',rid);
end$$;
revoke all on function private.retail_delete_customer(uuid,integer) from public,anon;
grant execute on function private.retail_delete_customer(uuid,integer) to authenticated;
create function public.retail_delete_customer(rid uuid, expected_revision integer) returns void language sql security invoker set search_path='' as $$select private.retail_delete_customer(rid,expected_revision);$$;
revoke all on function public.retail_delete_customer(uuid,integer) from public,anon;
grant execute on function public.retail_delete_customer(uuid,integer) to authenticated;
commit;
