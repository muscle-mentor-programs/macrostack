-- ════════════════════════════════════════════════════════════════════════════
-- SUBSCRIPTIONS
-- Adds Stripe subscription state + a superadmin manual override to profiles.
--
-- Effective-access precedence (computed client-side and trusted server-side):
--   admin_override = 'unlocked'  -> access granted  (beats Stripe)
--   admin_override = 'locked'    -> access denied   (beats Stripe)
--   else                         -> subscription_status in ('active','trialing')
--
-- The override always wins so a Stripe webhook can never undo a manual unlock.
-- ════════════════════════════════════════════════════════════════════════════

alter table profiles
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status     text not null default 'inactive',
  add column if not exists subscription_plan        text,            -- 'monthly' | 'annual' | null
  add column if not exists current_period_end       timestamptz,
  add column if not exists admin_override            text
    check (admin_override in ('locked', 'unlocked'));

-- ── get_my_profile: include subscription fields so the client can compute access
DROP FUNCTION IF EXISTS get_my_profile();
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS TABLE (
  id uuid, name text, role text,
  coach_code text, bio text, specialties text, credentials text, website text,
  subscription_status text, subscription_plan text,
  current_period_end timestamptz, admin_override text
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name, p.role,
         p.coach_code, p.bio, p.specialties, p.credentials, p.website,
         p.subscription_status, p.subscription_plan,
         p.current_period_end, p.admin_override
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

-- ── Superadmin manual lock/unlock of any account.
--    SECURITY DEFINER + explicit role check = only superadmins can call it.
--    Pass NULL to clear the override and fall back to Stripe status.
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

-- ── Superadmin-only: list every account with its subscription state + email.
--    SECURITY DEFINER lets it join auth.users for the email; the role check
--    keeps it locked to superadmins.
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
    SELECT p.id, p.name, u.email, p.role,
           p.subscription_status, p.subscription_plan,
           p.current_period_end, p.admin_override
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    ORDER BY p.role, p.name;
END;
$$;

-- ── The webhook updates rows with the service-role key, which bypasses RLS,
--    so no extra write policy is needed for Stripe.
