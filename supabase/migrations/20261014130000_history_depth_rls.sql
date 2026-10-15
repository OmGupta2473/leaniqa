-- Phase 2C: server-side enforcement of history depth per plan.
--
-- The client already gates navigation (Phase 2A/2B). This migration makes it
-- impossible to bypass by querying Supabase directly.
--
-- Rollback: DROP POLICY the four meal_logs_* and weekly_reports_* policies
-- below, then recreate the single old policy:
--   CREATE POLICY "Users can manage their own meal_logs"
--     ON public.meal_logs FOR ALL
--     USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- 1. get_user_history_days: returns the plan's full-detail history
--    window in days. NULL means unlimited (premium).
--    Reads from subscriptions; falls back to 14 for missing rows.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_history_days(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_status TEXT;
  v_beta_expires TIMESTAMPTZ;
BEGIN
  SELECT plan, status, beta_expires_at
    INTO v_plan, v_status, v_beta_expires
    FROM public.subscriptions
    WHERE user_id = p_user_id
    LIMIT 1;

  IF v_plan IS NULL OR v_status != 'active' THEN
    RETURN 14;
  END IF;

  IF v_plan = 'premium' THEN
    RETURN NULL;
  END IF;

  IF v_plan IN ('discipline', 'beta_pro') THEN
    IF v_beta_expires IS NULL OR v_beta_expires > now() THEN
      RETURN 180;
    END IF;
  END IF;

  RETURN 14;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_history_days(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_history_days(UUID)
  TO authenticated, service_role;

-- ---------------------------------------------------------------
-- 2. count_user_meals: total meal count for the user, bypassing
--    RLS. Used by the awards engine so free users don't lose their
--    meal-count awards (log_first / log_25 / log_100) after RLS.
--    Auth check prevents enumeration.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.count_user_meals(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  SELECT COUNT(*)::INTEGER INTO v_count
    FROM public.meal_logs WHERE user_id = p_user_id;
  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.count_user_meals(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_user_meals(UUID)
  TO authenticated, service_role;

-- ---------------------------------------------------------------
-- 3. Replace the all-in-one meal_logs policy with four separate
--    policies. INSERT is unrestricted (offline queue replay must
--    work even for meals queued long ago); SELECT/UPDATE/DELETE
--    enforce the history window with a +1 day slack to absorb
--    timezone and clock drift. The client's calendar-day gate is
--    the precise boundary; this is the outer safety net.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own meal_logs" ON public.meal_logs;

CREATE POLICY "meal_logs_select" ON public.meal_logs
FOR SELECT USING (
  auth.uid() = user_id
  AND (
    public.get_user_history_days(user_id) IS NULL
    OR meal_time >= now() - ((public.get_user_history_days(user_id) + 1) * interval '1 day')
  )
);

CREATE POLICY "meal_logs_insert" ON public.meal_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_logs_update" ON public.meal_logs
FOR UPDATE
USING (
  auth.uid() = user_id
  AND (
    public.get_user_history_days(user_id) IS NULL
    OR meal_time >= now() - ((public.get_user_history_days(user_id) + 1) * interval '1 day')
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.get_user_history_days(user_id) IS NULL
    OR meal_time >= now() - ((public.get_user_history_days(user_id) + 1) * interval '1 day')
  )
);

CREATE POLICY "meal_logs_delete" ON public.meal_logs
FOR DELETE USING (
  auth.uid() = user_id
  AND (
    public.get_user_history_days(user_id) IS NULL
    OR meal_time >= now() - ((public.get_user_history_days(user_id) + 1) * interval '1 day')
  )
);

-- ---------------------------------------------------------------
-- 4. Same treatment for weekly_reports. The +7 day slack gives one
--    week of buffer to match the client's "one locked week preview"
--    in Phase 2B.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own weekly_reports" ON public.weekly_reports;

CREATE POLICY "weekly_reports_select" ON public.weekly_reports
FOR SELECT USING (
  auth.uid() = user_id
  AND (
    public.get_user_history_days(user_id) IS NULL
    OR week_start >= (now()::date - (public.get_user_history_days(user_id) + 7))
  )
);

CREATE POLICY "weekly_reports_insert" ON public.weekly_reports
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "weekly_reports_update" ON public.weekly_reports
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "weekly_reports_delete" ON public.weekly_reports
FOR DELETE USING (auth.uid() = user_id);