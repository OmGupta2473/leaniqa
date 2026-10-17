-- Fix cleanup_stale_guests: it referenced public.meals, which does not
-- exist. The correct table is public.meal_logs. The function was created
-- without error because PL/pgSQL does not resolve table references at
-- CREATE FUNCTION time, but every nightly run since has failed with 42P01.
--
-- Pure function-body replacement. Cron schedule and function signature
-- are unchanged.

CREATE OR REPLACE FUNCTION public.cleanup_stale_guests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM auth.users u
  WHERE u.is_anonymous = true
    AND u.created_at < now() - interval '30 days'
    AND NOT EXISTS (
      SELECT 1
      FROM public.meal_logs m
      WHERE m.user_id = u.id
        AND m.meal_time > now() - interval '30 days'
    );
END;
$$;