-- 1. Add coach_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_code text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_coach_code
  ON public.profiles(coach_code) WHERE coach_code IS NOT NULL;

-- 2. Add coach_id to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Unique constraint on profile_id in clients (NULLs are allowed as duplicates in postgres)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clients_profile_id_key' AND table_name = 'clients' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

-- 4. Update get_my_profile to include coach_code
DROP FUNCTION IF EXISTS get_my_profile();
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS TABLE (id uuid, name text, role text, coach_code text)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name, p.role, p.coach_code
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

-- 5. RPC: look up a coach by code (used client-side to submit coach code)
CREATE OR REPLACE FUNCTION get_coach_by_code(p_code text)
RETURNS TABLE (id uuid, name text)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.name
  FROM public.profiles p
  WHERE UPPER(p.coach_code) = UPPER(p_code)
    AND p.role = 'coach'
  LIMIT 1;
$$;

-- 6. Trigger: auto-create profile row when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_name text;
  v_role text;
  v_code text;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  IF v_role = 'coach' THEN
    v_code := UPPER(LEFT(REGEXP_REPLACE(v_name, '[^a-zA-Z]', '', 'g'), 4))
           || UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4));
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE coach_code = v_code) LOOP
      v_code := UPPER(LEFT(REGEXP_REPLACE(v_name, '[^a-zA-Z]', '', 'g'), 4))
             || UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4));
    END LOOP;
  END IF;
  INSERT INTO public.profiles (id, name, role, coach_code)
  VALUES (NEW.id, v_name, v_role, v_code)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Trigger: auto-create clients row when a client profile is created
CREATE OR REPLACE FUNCTION public.handle_new_client_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF NEW.role = 'client' THEN
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;
    INSERT INTO public.clients (profile_id, name, email, goal_calories, goal_protein, goal_carbs, goal_fat)
    VALUES (NEW.id, NEW.name, v_email, 2000, 150, 200, 65)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_client_profile();

-- 8. coach_requests table
CREATE TABLE IF NOT EXISTS public.coach_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_email text NOT NULL,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_profile_id, coach_id)
);

ALTER TABLE public.coach_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'coaches_see_requests' AND tablename = 'coach_requests') THEN
    CREATE POLICY "coaches_see_requests" ON public.coach_requests FOR SELECT USING (coach_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'clients_see_own_requests' AND tablename = 'coach_requests') THEN
    CREATE POLICY "clients_see_own_requests" ON public.coach_requests FOR SELECT USING (client_profile_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'clients_insert_requests' AND tablename = 'coach_requests') THEN
    CREATE POLICY "clients_insert_requests" ON public.coach_requests FOR INSERT WITH CHECK (client_profile_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'coaches_update_requests' AND tablename = 'coach_requests') THEN
    CREATE POLICY "coaches_update_requests" ON public.coach_requests FOR UPDATE USING (coach_id = auth.uid());
  END IF;
END $$;

-- 9. RLS on clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'clients_select' AND tablename = 'clients') THEN
    CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (coach_id = auth.uid() OR profile_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'clients_insert' AND tablename = 'clients') THEN
    CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (coach_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'clients_update' AND tablename = 'clients') THEN
    CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (coach_id = auth.uid() OR profile_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'clients_delete' AND tablename = 'clients') THEN
    CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (coach_id = auth.uid());
  END IF;
END $$;

-- 10. RLS on food_log
ALTER TABLE public.food_log ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'food_log_access' AND tablename = 'food_log') THEN
    CREATE POLICY "food_log_access" ON public.food_log FOR ALL USING (
      EXISTS (SELECT 1 FROM public.clients c WHERE c.id = food_log.client_id AND (c.coach_id = auth.uid() OR c.profile_id = auth.uid()))
    );
  END IF;
END $$;

-- 11. RLS on weight_log
ALTER TABLE public.weight_log ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'weight_log_access' AND tablename = 'weight_log') THEN
    CREATE POLICY "weight_log_access" ON public.weight_log FOR ALL USING (
      EXISTS (SELECT 1 FROM public.clients c WHERE c.id = weight_log.client_id AND (c.coach_id = auth.uid() OR c.profile_id = auth.uid()))
    );
  END IF;
END $$;

-- 12. RLS on meal_plans
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'meal_plans_access' AND tablename = 'meal_plans') THEN
    CREATE POLICY "meal_plans_access" ON public.meal_plans FOR ALL USING (
      EXISTS (SELECT 1 FROM public.clients c WHERE c.id = meal_plans.client_id AND (c.coach_id = auth.uid() OR c.profile_id = auth.uid()))
    );
  END IF;
END $$;

-- 13. RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'messages_access' AND tablename = 'messages') THEN
    CREATE POLICY "messages_access" ON public.messages FOR ALL USING (
      EXISTS (SELECT 1 FROM public.clients c WHERE c.id = messages.client_id AND (c.coach_id = auth.uid() OR c.profile_id = auth.uid()))
    );
  END IF;
END $$;

-- 14. Generate codes for existing coaches without one
UPDATE public.profiles
SET coach_code = UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 4))
              || UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 4))
WHERE role = 'coach' AND coach_code IS NULL;

-- 15. Link existing unlinked clients to the first/only coach
DO $$
DECLARE v_coach_id uuid;
BEGIN
  SELECT id INTO v_coach_id FROM public.profiles WHERE role = 'coach' ORDER BY created_at LIMIT 1;
  IF FOUND THEN
    UPDATE public.clients SET coach_id = v_coach_id WHERE coach_id IS NULL;
  END IF;
END $$;
