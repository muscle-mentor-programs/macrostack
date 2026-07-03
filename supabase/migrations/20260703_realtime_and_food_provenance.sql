-- Realtime chat + live shared food catalog + food provenance
-- 1) Stream messages table changes (instant chat delivery + live "Seen" receipts)
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

-- 2) Stream community food inserts/deletes (scans appear for everyone instantly)
do $$ begin
  alter publication supabase_realtime add table public.custom_foods;
exception when duplicate_object then null; end $$;

-- 3) Provenance: track who contributed each community food (user vs coach)
alter table public.custom_foods
  add column if not exists added_by uuid,
  add column if not exists added_by_role text
    check (added_by_role in ('user', 'coach'));
