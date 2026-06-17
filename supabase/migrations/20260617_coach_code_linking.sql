-- ════════════════════════════════════════════════════════════════════════════
-- COACH-CODE LINKING (replaces auto-link)
-- The platform is solo by default. A user becomes coached only by entering a
-- coach code the coach hands out — which links them directly (no accept step).
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Undo the subscription auto-link: restore the override RPC to the plain
--    lock/unlock with no coach linking.
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
END;
$$;

DROP FUNCTION IF EXISTS link_subscriber_to_coach(uuid);

-- 2. Coach-code lookup must find superadmin-run coach accounts too.
CREATE OR REPLACE FUNCTION get_coach_by_code(p_code text)
RETURNS TABLE (id uuid, name text)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name
  FROM public.profiles p
  WHERE UPPER(p.coach_code) = UPPER(p_code)
    AND p.role IN ('coach', 'superadmin')
  LIMIT 1;
$$;

-- 3. Direct link: entering a valid code links the caller's client record to
--    that coach immediately (no pending request / accept step).
CREATE OR REPLACE FUNCTION link_client_by_coach_code(p_code text)
RETURNS TABLE (coach_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_coach_id   uuid;
  v_coach_name text;
BEGIN
  SELECT id, name INTO v_coach_id, v_coach_name
  FROM public.profiles
  WHERE UPPER(coach_code) = UPPER(p_code)
    AND role IN ('coach', 'superadmin')
  LIMIT 1;

  IF v_coach_id IS NULL THEN
    RAISE EXCEPTION 'Invalid coach code';
  END IF;

  UPDATE public.clients
  SET coach_id = v_coach_id
  WHERE profile_id = auth.uid();

  RETURN QUERY SELECT v_coach_name;
END;
$$;

-- 4. Make sure superadmin-run coach accounts have a shareable code.
UPDATE public.profiles
SET coach_code = UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 4))
              || UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4))
WHERE role IN ('coach', 'superadmin') AND coach_code IS NULL;
