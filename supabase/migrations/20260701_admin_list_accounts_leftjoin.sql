-- ════════════════════════════════════════════════════════════════════════════
-- Fix + harden admin_list_accounts (superadmin billing panel).
--
-- Bug: the function RETURNS TABLE(... id uuid, ... role text ...). Those OUT
-- params are in scope in the body, so the unqualified `id`/`role` in the
-- superadmin guard were ambiguous → "column reference \"id\" is ambiguous",
-- which made every call fail and the panel show no accounts.
--
-- Fixes: alias the guard's table so its columns are unambiguous, and LEFT JOIN
-- auth.users so no profile is silently dropped when its auth row isn't matched.
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
    SELECT 1 FROM public.profiles AS me
    WHERE me.id = auth.uid() AND me.role = 'superadmin'
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
