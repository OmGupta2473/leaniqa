-- Fix 1: reserve_api_usage returned 42702 "column reference usage_count is ambiguous"
-- because the OUT parameter name collides with the CTE's RETURNING column.
-- The fix aliases the RETURNING output so the CTE column no longer collides.

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
    RETURNING public.api_usage.usage_count AS reserved_count
  )
  SELECT reserved.reserved_count, p_limit
  FROM reserved;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.reserve_api_usage(UUID, TEXT, DATE, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_api_usage(UUID, TEXT, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_api_usage(UUID, TEXT, DATE, INTEGER) TO service_role;

-- Fix 2: meal_parse_cache had RLS policies but no table-level GRANT for service_role,
-- so every Edge Function read/write failed with 42501 "permission denied for table
-- meal_parse_cache". Postgres checks table privileges BEFORE evaluating RLS, so the
-- "Service role full access for meal cache" policy never got a chance to run.
-- The table's other grants come from this project's default privileges for schema
-- public (anon=r, authenticated=arwd), which do not include service_role; the
-- statements below make the required privileges explicit and deterministic.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_parse_cache TO service_role;
GRANT SELECT ON public.meal_parse_cache TO authenticated;

-- Do NOT grant to anon. The cache is internal; anonymous users have no use for it.
-- (anon already holds a pre-existing SELECT from the default privileges above, which
-- this migration neither extends nor removes; no RLS policy targets anon, so it can
-- read nothing.)

