-- Security-definer helper so login can fetch the caller's profile
-- without relying on RLS (which can block if email unconfirmed, etc.)
create or replace function get_my_profile()
returns table (id uuid, name text, role text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.name, p.role
  from public.profiles p
  where p.id = auth.uid();
$$;
