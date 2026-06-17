-- ════════════════════════════════════════════════════════════════════════════
-- AUTO-LINK SUBSCRIBERS TO THE DEFAULT COACH
-- "For now" there is a single coach (the superadmin). When a user gets Pro,
-- link their client record to that coach so they immediately have a coach.
--
-- Idempotent: only links when the client is currently unlinked, so it never
-- overrides a deliberate coach assignment.
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION link_subscriber_to_coach(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_coach uuid;
BEGIN
  -- Default coach = the single coach/superadmin account (oldest if several).
  -- Prefers a real 'coach' over 'superadmin' if both ever exist.
  SELECT id INTO v_coach
  FROM public.profiles
  WHERE role IN ('coach', 'superadmin')
  ORDER BY (role = 'coach') DESC, created_at ASC
  LIMIT 1;

  IF v_coach IS NULL THEN RETURN; END IF;

  UPDATE public.clients
  SET coach_id = v_coach
  WHERE profile_id = p_profile_id
    AND coach_id IS NULL;
END;
$$;

-- Re-define the override RPC so a manual "unlock" also links the user to the
-- coach (matches "getting access = access to me"). Locking/clearing leaves the
-- coach link untouched.
CREATE OR REPLACE FUNCTION set_subscription_override(target_id uuid, new_override text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Only superadmins can change subscription overrides';
  END IF;

  IF new_override IS NOT NULL AND new_override NOT IN ('locked', 'unlocked') THEN
    RAISE EXCEPTION 'Invalid override value: %', new_override;
  END IF;

  UPDATE public.profiles
  SET admin_override = new_override
  WHERE id = target_id;

  IF new_override = 'unlocked' THEN
    PERFORM link_subscriber_to_coach(target_id);
  END IF;
END;
$$;
