-- Accepting a connection request never linked the client: the coach's UPDATE
-- on clients matched zero rows under RLS (clients_update requires being the
-- coach already) and zero-row updates aren't errors. Do the accept atomically
-- with definer rights, validating the caller owns the request.
CREATE OR REPLACE FUNCTION public.accept_coach_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  req record;
BEGIN
  SELECT * INTO req FROM public.coach_requests
   WHERE id = p_request_id AND coach_id = auth.uid() AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already handled';
  END IF;

  -- Tier-cap trigger on clients still fires and can raise — that error
  -- propagates to the caller as intended.
  UPDATE public.clients SET coach_id = req.coach_id
   WHERE profile_id = req.client_profile_id;

  UPDATE public.coach_requests SET status = 'accepted' WHERE id = p_request_id;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_coach_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_coach_request(uuid) TO authenticated;
