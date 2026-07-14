-- Coach marketplace: users browse registered coaches and request a connection.
-- Coaches approve directly (existing flow) or send their coach code back.

-- 1. coach_requests: allow the 'code_sent' state and store the code the coach sent
ALTER TABLE public.coach_requests DROP CONSTRAINT IF EXISTS coach_requests_status_check;
ALTER TABLE public.coach_requests ADD CONSTRAINT coach_requests_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'code_sent'));
ALTER TABLE public.coach_requests ADD COLUMN IF NOT EXISTS coach_code text;

-- 2. Directory of registered coaches — safe, public-profile fields only.
--    SECURITY DEFINER so any signed-in user can browse without opening
--    broad SELECT access on the profiles table.
CREATE OR REPLACE FUNCTION public.get_coach_directory()
RETURNS TABLE (
  id uuid, name text, bio text, specialties text,
  credentials text, website text, client_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name, p.bio, p.specialties, p.credentials, p.website,
         (SELECT count(*) FROM public.clients c
            WHERE c.coach_id = p.id AND coalesce(c.status, 'active') <> 'archived')
  FROM public.profiles p
  WHERE p.role IN ('coach', 'superadmin')  -- superadmin coaches too (founder account)
  ORDER BY p.name;
$$;
REVOKE ALL ON FUNCTION public.get_coach_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_coach_directory() TO authenticated;
