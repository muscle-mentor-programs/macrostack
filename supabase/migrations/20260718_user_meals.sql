-- Saved meals: "make this a meal" snapshots a log card's exact entries into a
-- private, per-user reusable meal. Not shared — owner-only RLS on every op.
CREATE TABLE IF NOT EXISTS public.user_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]',   -- entry snapshots (name, qty, serving, macros)
  calories numeric NOT NULL DEFAULT 0, -- denormalized totals for list display
  protein  numeric NOT NULL DEFAULT 0,
  carbs    numeric NOT NULL DEFAULT 0,
  fat      numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_meals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_meals_select' AND tablename = 'user_meals') THEN
    CREATE POLICY "user_meals_select" ON public.user_meals FOR SELECT USING (owner = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_meals_insert' AND tablename = 'user_meals') THEN
    CREATE POLICY "user_meals_insert" ON public.user_meals FOR INSERT WITH CHECK (owner = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_meals_delete' AND tablename = 'user_meals') THEN
    CREATE POLICY "user_meals_delete" ON public.user_meals FOR DELETE USING (owner = auth.uid());
  END IF;
END $$;
