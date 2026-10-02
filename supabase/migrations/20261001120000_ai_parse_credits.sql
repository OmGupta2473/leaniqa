-- Read-only fetch of the current day's API usage count for a user.
CREATE OR REPLACE FUNCTION public.get_api_usage(
  p_user_id UUID,
  p_endpoint TEXT,
  p_date DATE
)
RETURNS TABLE (usage_count INTEGER) AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
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

REVOKE EXECUTE ON FUNCTION public.get_api_usage(UUID, TEXT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_api_usage(UUID, TEXT, DATE) TO authenticated, service_role;

-- Idempotent refund table: one row per refunded request_id.
CREATE TABLE IF NOT EXISTS public.api_usage_refunds (
  request_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  date DATE NOT NULL,
  refunded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_usage_refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own refunds" ON public.api_usage_refunds;
CREATE POLICY "Users can read own refunds"
  ON public.api_usage_refunds FOR SELECT
  USING (auth.uid() = user_id);

-- Refund one credit for a specific parse request_id. Idempotent: repeated
-- calls for the same request_id are no-ops.
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
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
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
