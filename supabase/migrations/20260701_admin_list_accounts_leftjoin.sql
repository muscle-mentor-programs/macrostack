-- ════════════════════════════════════════════════════════════════════════════
-- Harden admin_list_accounts so the superadmin billing panel never silently
-- drops accounts.
--
-- The original used an INNER JOIN to auth.users, which removed any profile
-- whose auth.users row wasn't visible/matched. Switch to LEFT JOIN so every
-- profile (coach, superadmin, client/user) is returned; email falls back to
-- '—' when the auth row can't be read.
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION admin_list_accounts()
RETURNS TABLE (
  id uuid, name text, email text, role text,
  subscription_status text, subscription_plan text,
  current_period_end timestamptz, admin_override text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Only superadmins can list accounts';
  END IF;

  RETURN QUERY
    SELECT p.id, p.name, COALESCE(u.email, '—') AS email, p.role,
           p.subscription_status, p.subscription_plan,
           p.current_period_end, p.admin_override
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    ORDER BY p.role, p.name;
END;
$$;
