-- ─────────────────────────────────────────────────────────────────────────────
-- Coach profile fields + Grayson client linkage
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add coach-editable profile fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio         text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS specialties text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS credentials text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS website     text    DEFAULT '';

-- 2. Update get_my_profile RPC to include the new fields
DROP FUNCTION IF EXISTS get_my_profile();
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS TABLE (id uuid, name text, role text, coach_code text, bio text, specialties text, credentials text, website text)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name, p.role, p.coach_code, p.bio, p.specialties, p.credentials, p.website
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

-- 3. RPC: get a coach's public profile (callable by any authenticated user —
--    security definer bypasses the "users view own profile only" RLS so clients
--    can see their coach's info without needing direct table access)
CREATE OR REPLACE FUNCTION get_coach_profile(p_coach_id uuid)
RETURNS TABLE (id uuid, name text, bio text, specialties text, credentials text, website text)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name, p.bio, p.specialties, p.credentials, p.website
  FROM public.profiles p
  WHERE p.id = p_coach_id
    AND p.role IN ('coach', 'superadmin');
$$;

-- 4. Link Grayson Hales to coach Branden Hales
--    (Safe to run multiple times — ON CONFLICT is idempotent)
--    Grayson profile_id:  a61aab1c-d467-4047-a989-aecdd96a61c3
--    Branden profile_id:  56c639d0-e97e-4826-86dd-0889b8d3b675
UPDATE public.clients
SET    coach_id = '56c639d0-e97e-4826-86dd-0889b8d3b675',
       status   = 'active'
WHERE  profile_id = 'a61aab1c-d467-4047-a989-aecdd96a61c3';

-- If Grayson's clients row doesn't exist yet, create it
INSERT INTO public.clients (profile_id, name, email, goal_calories, goal_protein, goal_carbs, goal_fat, coach_id, status)
VALUES (
  'a61aab1c-d467-4047-a989-aecdd96a61c3',
  'Grayson Hales',
  'graysonhales0@gmail.com',
  2000, 150, 200, 65,
  '56c639d0-e97e-4826-86dd-0889b8d3b675',
  'active'
)
ON CONFLICT (profile_id) DO UPDATE
  SET coach_id = EXCLUDED.coach_id,
      status   = EXCLUDED.status,
      name     = EXCLUDED.name,
      email    = EXCLUDED.email;
