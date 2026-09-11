-- Atomic daily quota reservation for Gemini / AI parse attempts.
-- This keeps the quota check and increment in one database transaction so concurrent
-- requests cannot both reserve the last remaining slot.

CREATE OR REPLACE FUNCTION public.reserve_api_usage(
  p_user_id UUID,
  p_endpoint TEXT,
  p_date DATE,
  p_limit INTEGER
)
RETURNS TABLE (
  usage_count INTEGER,
  limit_value INTEGER
) AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'Invalid limit';
  END IF;

  RETURN QUERY
  WITH reserved AS (
    INSERT INTO public.api_usage (user_id, endpoint, date, usage_count)
    VALUES (p_user_id, p_endpoint, p_date, 1)
    ON CONFLICT (user_id, endpoint, date)
    DO UPDATE
      SET usage_count = public.api_usage.usage_count + 1
    WHERE public.api_usage.usage_count < p_limit
    RETURNING usage_count
  )
  SELECT reserved.usage_count, p_limit
  FROM reserved;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.reserve_api_usage(UUID, TEXT, DATE, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_api_usage(UUID, TEXT, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_api_usage(UUID, TEXT, DATE, INTEGER) TO service_role;
