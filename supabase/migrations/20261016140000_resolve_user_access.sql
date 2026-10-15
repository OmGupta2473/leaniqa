-- A4: Single source of truth for "does this user have paid access?"
--
-- resolve_user_access(user_id) returns (has_access, tier, reason).
-- Every consumer — client, edge functions, RLS — must agree with this.
-- Changed logic happens HERE, once.

CREATE OR REPLACE FUNCTION public.resolve_user_access(p_user_id UUID)
RETURNS TABLE (has_access BOOLEAN, tier TEXT, reason TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT;
  v_status TEXT;
  v_access_type TEXT;
  v_beta_expires TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  SELECT plan, status, access_type, beta_expires_at, current_period_end
    INTO v_plan, v_status, v_access_type, v_beta_expires, v_period_end
    FROM public.subscriptions
    WHERE user_id = p_user_id
    LIMIT 1;

  -- No row: not signed up for anything.
  IF v_plan IS NULL THEN
    RETURN QUERY SELECT false, 'free'::TEXT, 'no_record'::TEXT;
    RETURN;
  END IF;

  -- Legacy beta window: still active even if plan column says free.
  IF v_plan = 'free'
     AND v_beta_expires IS NOT NULL
     AND v_beta_expires > now() THEN
    RETURN QUERY SELECT true, 'discipline'::TEXT, 'beta_active'::TEXT;
    RETURN;
  END IF;

  -- Terminal states.
  IF v_status IN ('expired', 'halted') THEN
    RETURN QUERY SELECT false, 'free'::TEXT,
      ('status_' || v_status)::TEXT;
    RETURN;
  END IF;

  -- Pending: waiting for webhook confirmation.
  IF v_status = 'pending' THEN
    RETURN QUERY SELECT false, 'free'::TEXT, 'pending_activation'::TEXT;
    RETURN;
  END IF;

  -- One-time access: strictly bounded by period_end, no auto-renew.
  -- Checked before 'active' so an expired one-time row falls to free
  -- even if the cron hasn't flipped the status yet.
  IF v_access_type = 'one_time' THEN
    IF v_period_end IS NOT NULL AND v_period_end > now() THEN
      RETURN QUERY SELECT true, v_plan, 'one_time_active'::TEXT;
    ELSE
      RETURN QUERY SELECT false, 'free'::TEXT, 'one_time_expired'::TEXT;
    END IF;
    RETURN;
  END IF;

  -- Cancelled subscription: access continues until period_end.
  IF v_status = 'cancelled' THEN
    IF v_period_end IS NOT NULL AND v_period_end > now() THEN
      RETURN QUERY SELECT true, v_plan, 'cancelled_but_active'::TEXT;
    ELSE
      RETURN QUERY SELECT false, 'free'::TEXT, 'cancelled_and_ended'::TEXT;
    END IF;
    RETURN;
  END IF;

  -- Active subscription: period_end is a safety net against stale webhook
  -- state. If it's set and past, treat as free even if status hasn't caught up.
  IF v_status = 'active' THEN
    IF v_period_end IS NULL OR v_period_end > now() THEN
      RETURN QUERY SELECT true, v_plan, 'sub_active'::TEXT;
    ELSE
      RETURN QUERY SELECT false, 'free'::TEXT, 'sub_period_ended'::TEXT;
    END IF;
    RETURN;
  END IF;

  -- Unknown combination. Log and treat as free.
  RETURN QUERY SELECT false, 'free'::TEXT, 'unhandled'::TEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_user_access FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_user_access
  TO authenticated, service_role;

-- Rewrite get_user_history_days as a thin wrapper. All the branching is
-- now in one place.
CREATE OR REPLACE FUNCTION public.get_user_history_days(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access BOOLEAN;
  v_tier TEXT;
BEGIN
  SELECT has_access, tier INTO v_has_access, v_tier
    FROM public.resolve_user_access(p_user_id);

  IF NOT v_has_access THEN
    RETURN 14;
  END IF;

  IF v_tier = 'premium' THEN
    RETURN NULL;
  END IF;

  IF v_tier = 'discipline' THEN
    RETURN 180;
  END IF;

  RETURN 14;
END;
$$;