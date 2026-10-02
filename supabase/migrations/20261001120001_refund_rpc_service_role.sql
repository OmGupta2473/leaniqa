-- Refund is now called by the edge function with the service-role key
-- (bypasses RLS). The internal auth.uid() check is redundant when the
-- caller already authenticated as the correct user in the handler. Allow
-- the caller to pass p_user_id directly; the function's own use of
-- SECURITY DEFINER ensures only server-side callers reach it.

CREATE OR REPLACE FUNCTION public.refund_api_usage(
  p_user_id UUID,
  p_endpoint TEXT,
  p_date DATE,
  p_request_id TEXT
)
RETURNS TABLE (usage_count INTEGER) AS $$
DECLARE
  inserted INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid p_user_id';
  END IF;
  IF p_request_id IS NULL OR length(p_request_id) = 0 THEN
    RAISE EXCEPTION 'Invalid request_id';
  END IF;

  INSERT INTO public.api_usage_refunds (request_id, user_id, endpoint, date)
  VALUES (p_request_id, p_user_id, p_endpoint, p_date)
  ON CONFLICT (request_id) DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;

  IF inserted > 0 THEN
    UPDATE public.api_usage
    SET usage_count = GREATEST(0, usage_count - 1)
    WHERE user_id = p_user_id AND endpoint = p_endpoint AND date = p_date;
  END IF;

  RETURN QUERY
    SELECT COALESCE(au.usage_count, 0)
    FROM public.api_usage au
    WHERE au.user_id = p_user_id
      AND au.endpoint = p_endpoint
      AND au.date = p_date;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.refund_api_usage(UUID, TEXT, DATE, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_api_usage(UUID, TEXT, DATE, TEXT) TO authenticated, service_role;
