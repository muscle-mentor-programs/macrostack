begin;

-- Keep the normal client-creation/invitation flow before removing the legacy path.
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and tgname = 'on_profile_created'
      and tgfoid = 'public.handle_new_client_profile()'::regprocedure
      and tgenabled in ('O', 'A')
  ) then
    raise exception 'Normal client signup trigger is missing or disabled; no changes applied.';
  end if;
end;
$$;

-- This legacy function hard-coded a default coach for every new client.
drop trigger if exists on_client_profile_created on public.profiles;
drop function if exists public.handle_new_client_from_profile();

-- Existing client rows and explicit coach-code/invitation connections are unchanged.
commit;
