-- Per-user serving-size preference for the food selector:
--   'default' — foods open at 1 serving / label serving size (current behavior)
--   'last'    — foods open at whatever amount that food was last logged at
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS serving_pref text NOT NULL DEFAULT 'default';
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_serving_pref_check;
ALTER TABLE public.clients ADD CONSTRAINT clients_serving_pref_check
  CHECK (serving_pref IN ('default', 'last'));
