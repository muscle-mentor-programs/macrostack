-- Remove inherited default privileges; existing records and RLS stay unchanged.
begin;
revoke all privileges on table public.coach_workspace_entries
  from public, anon, authenticated;
grant select, insert on table public.coach_workspace_entries to authenticated;
commit;
