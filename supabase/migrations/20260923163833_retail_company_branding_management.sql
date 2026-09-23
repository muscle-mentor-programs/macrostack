begin;

-- A custom staff permission cannot grant chain-wide branding to a store role.
create or replace function private.retail_capability(s public.retail_staff, capability text)
returns boolean language sql immutable set search_path='' as $$
 select case when capability = 'branding' then
   s.role = 'organization_admin' and coalesce((s.permissions->>'branding')::boolean, true)
 else coalesce((s.permissions->>capability)::boolean,
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
 else false end) end;
$$;

-- The logo storage policy and save operation both require company management.
create or replace function private.retail_brand_upload(object_name text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.retail_organizations o
   where o.id::text = split_part(object_name,'/',1)
   and private.retail_org_access(o.id,true));
$$;

create or replace function private.retail_save_branding(oid uuid,display_name text,object_path text)
returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or not private.retail_org_access(oid,true) then raise exception 'Organization administrator required';end if;
 if length(trim(display_name)) not between 1 and 80 or display_name is null then raise exception 'Enter a display name between 1 and 80 characters';end if;
 if object_path is not null and (split_part(object_path,'/',1)<>oid::text or not exists(select 1 from storage.objects where bucket_id='retail-branding' and name=object_path)) then raise exception 'Upload a logo for this organization';end if;
 update public.retail_organizations set brand_name=trim(display_name),logo_path=object_path where id=oid;
 insert into public.retail_audit(organization_id,actor_id,action,subject_id) values(oid,auth.uid(),'update_branding',oid);
end$$;

commit;
