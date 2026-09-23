begin;

-- Staff and linked customers may see the shared company identity while a
-- location is still being set up; activation only gates operational features.
create or replace function private.retail_branding(lid uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if auth.uid() is null or not (
   private.retail_location_access(lid) or exists(
     select 1 from public.retail_relationships
     where location_id=lid and profile_id=auth.uid() and status='active'
   )
 ) then raise exception 'Store unavailable';end if;
 return (
   select jsonb_build_object(
     'name',coalesce(o.brand_name,o.name),
     'logo_path',o.logo_path,
     'brand_colors',o.brand_colors
   )
   from public.retail_locations l
   join public.retail_organizations o on o.id=l.organization_id
   where l.id=lid and o.enabled
 );
end$$;

commit;
