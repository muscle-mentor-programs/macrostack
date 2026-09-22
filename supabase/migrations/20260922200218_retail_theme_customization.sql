begin;
create function private.retail_valid_theme(colors jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare k text; v jsonb;
begin
 if colors is null or jsonb_typeof(colors)<>'object' or not (colors ?& array['primary','secondary']) then return false;end if;
 for k,v in select * from jsonb_each(colors) loop
   if k=any(array['primary','secondary','buttonEnd','buttonText','background','backgroundEnd','card','cardEnd','text','muted','heading','border','input','inputText','nav','navEnd','navText','header','headerEnd','headerText']) then
     if jsonb_typeof(v)<>'string' or (colors->>k) !~ '^#[0-9a-fA-F]{6}$' then return false;end if;
   elsif k=any(array['backgroundGradient','cardGradient','navGradient','headerGradient','buttonGradient']) then
     if jsonb_typeof(v)<>'boolean' then return false;end if;
   elsif k=any(array['backgroundAngle','cardAngle','navAngle','headerAngle','buttonAngle']) then
     if jsonb_typeof(v)<>'number' then return false;end if;
     if (colors->>k)::numeric<0 or (colors->>k)::numeric>360 or mod((colors->>k)::numeric,1)<>0 then return false;end if;
   else return false;
   end if;
 end loop;
 return true;
end$$;
revoke all on function private.retail_valid_theme(jsonb) from public,anon;
grant execute on function private.retail_valid_theme(jsonb) to authenticated;
alter table public.retail_organizations drop constraint retail_organizations_brand_colors_check;
alter table public.retail_organizations add constraint retail_organizations_brand_colors_check check(private.retail_valid_theme(brand_colors));
create or replace function private.retail_save_branding(oid uuid,display_name text,object_path text,colors jsonb) returns void language plpgsql security definer set search_path='' as $$begin
 if not private.retail_valid_theme(colors) then raise exception 'Enter valid hex colors and gradient settings';end if;
 perform private.retail_save_branding(oid,display_name,object_path);
 update public.retail_organizations set brand_colors=(select jsonb_object_agg(key,case when jsonb_typeof(value)='string' then to_jsonb(upper(value#>>'{}')) else value end) from jsonb_each(colors)) where id=oid;
end$$;
commit;
