-- ── 1. Add status to clients ─────────────────────────────────────────────────
-- 'pending'  = coach created the row + sent invite, client hasn't signed up yet
-- 'active'   = client has accepted the invite and has a linked auth account
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('pending', 'active'));

-- ── 2. Fix handle_new_client_profile to link invited rows ─────────────────────
-- When an invited client signs up, Supabase creates their auth user →
-- handle_new_user inserts a profiles row → handle_new_client_profile fires.
-- Before this fix the trigger would create a SECOND clients row.
-- Now it checks for a pending row matching the email and links it instead.
CREATE OR REPLACE FUNCTION public.handle_new_client_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email      text;
  v_pending_id uuid;
BEGIN
  IF NEW.role = 'client' THEN
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;

    -- Look for a coach-created pending row with this email
    SELECT id INTO v_pending_id
    FROM public.clients
    WHERE email = v_email
      AND profile_id IS NULL
      AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_pending_id IS NOT NULL THEN
      -- Link the existing row to this new profile
      UPDATE public.clients
      SET profile_id = NEW.id,
          status     = 'active'
      WHERE id = v_pending_id;
    ELSE
      -- Normal (non-invited) signup: create a fresh client row
      INSERT INTO public.clients
        (profile_id, name, email, goal_calories, goal_protein, goal_carbs, goal_fat)
      VALUES
        (NEW.id, NEW.name, v_email, 2000, 150, 200, 65)
      ON CONFLICT (profile_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
