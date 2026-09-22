begin;
alter table public.retail_organizations add column brand_colors jsonb not null default '{"primary":"#82ADE1","secondary":"#91B8AD"}'::jsonb
 check (jsonb_typeof(brand_colors)='object' and brand_colors ?& array['primary','secondary'] and brand_colors - 'primary' - 'secondary' = '{}'::jsonb and (brand_colors->>'primary') ~ '^#[0-9A-Fa-f]{6}$' and (brand_colors->>'secondary') ~ '^#[0-9A-Fa-f]{6}$' and jsonb_typeof(brand_colors->'primary')='string' and jsonb_typeof(brand_colors->'secondary')='string');
create function private.retail_save_branding(oid uuid,display_name text,object_path text,colors jsonb) returns void language plpgsql security definer set search_path='' as $$begin
 if colors is null or jsonb_typeof(colors)<>'object' or not (colors ?& array['primary','secondary']) or colors-'primary'-'secondary'<>'{}'::jsonb or coalesce(colors->>'primary','') !~ '^#[0-9A-Fa-f]{6}$' or coalesce(colors->>'secondary','') !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Enter two valid six-digit hex colors';end if;
 perform private.retail_save_branding(oid,display_name,object_path);
 update public.retail_organizations set brand_colors=jsonb_build_object('primary',upper(colors->>'primary'),'secondary',upper(colors->>'secondary')) where id=oid;
end$$;
create function public.retail_save_branding(oid uuid,display_name text,object_path text,colors jsonb) returns void language sql security invoker set search_path='' as $$select private.retail_save_branding(oid,display_name,object_path,colors);$$;
revoke all on function private.retail_save_branding(uuid,text,text,jsonb),public.retail_save_branding(uuid,text,text,jsonb) from public,anon;
grant execute on function private.retail_save_branding(uuid,text,text,jsonb),public.retail_save_branding(uuid,text,text,jsonb) to authenticated;
create or replace function private.retail_branding(lid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if auth.uid() is null or not (private.retail_location_access(lid) or exists(select 1 from public.retail_relationships where location_id=lid and profile_id=auth.uid() and status='active')) then raise exception 'Store unavailable';end if;
 return (select jsonb_build_object('name',coalesce(o.brand_name,o.name),'logo_path',o.logo_path,'brand_colors',o.brand_colors) from public.retail_locations l join public.retail_organizations o on o.id=l.organization_id where l.id=lid and l.enabled and o.enabled);
end$$;
commit;
