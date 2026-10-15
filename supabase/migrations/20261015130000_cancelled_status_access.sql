-- Fix get_user_history_days: a subscription with status='cancelled' but a
-- future current_period_end still grants full history access until the
-- period ends. Previously any non-'active' status returned free-tier limits.
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
  v_period_end TIMESTAMPTZ;
BEGIN
  SELECT plan, status, beta_expires_at, current_period_end
    INTO v_plan, v_status, v_beta_expires, v_period_end
    FROM public.subscriptions
    WHERE user_id = p_user_id
    LIMIT 1;

  IF v_plan IS NULL THEN
    RETURN 14;
  END IF;

  IF v_status = 'active' THEN
    NULL;
  ELSIF v_status = 'cancelled' AND v_period_end IS NOT NULL AND v_period_end > now() THEN
    NULL;
  ELSE
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