-- Gym promo codes — Session 1c: extend resolve_user_access to consult
-- promo_redemptions when the subscription path returns no access.
--
-- Precedence (Option A — subscription wins outright when it grants access):
--   1. Real subscription grants access → return sub tier, sub reason.
--      Cancelled-but-in-period and one-time-unexpired both count as
--      "sub grants access" here.
--   2. No sub access, promo_redemptions.premium_until > now() → tier
--      'premium', reason 'promo_active'.
--   3. No active promo. If promo_redemptions row exists but is expired AND
--      there is no subscriptions row at all → 'promo_expired' so the client
--      can render a "gym access ended" card. In every other no-access case,
--      return the subscription's original free reason unchanged.
--
-- The existing function body is preserved byte-for-byte in spirit — the only
-- structural change is that the early RETURN QUERY SELECT false lines become
-- assignments into v_sub_* so control can fall through to the promo check.
-- Behaviour on every existing branch is identical; the RETURN QUERY at the
-- end of the function returns exactly what the original returned when no
-- promo is active.
--
-- Rollback: re-run the pre-1c CREATE OR REPLACE from migration
-- 20261016140000_resolve_user_access.sql. The function is STABLE and has no
-- side effects, so a rollback is safe at any time.

CREATE OR REPLACE FUNCTION public.resolve_user_access(p_user_id uuid)
 RETURNS TABLE(has_access boolean, tier text, reason text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plan           TEXT;
  v_status         TEXT;
  v_access_type    TEXT;
  v_beta_expires   TIMESTAMPTZ;
  v_period_end     TIMESTAMPTZ;
  v_sub_has_access BOOLEAN := false;
  v_sub_tier       TEXT := 'free';
  v_sub_reason     TEXT := 'no_record';
  v_promo_until    TIMESTAMPTZ;
BEGIN
  SELECT plan, status, access_type, beta_expires_at, current_period_end
    INTO v_plan, v_status, v_access_type, v_beta_expires, v_period_end
    FROM public.subscriptions
    WHERE user_id = p_user_id
    LIMIT 1;

  -- ------------------------------------------------------------------
  -- Compute subscription verdict (no RETURN; promo check falls through).
  -- Each branch below matches the pre-1c function exactly.
  -- ------------------------------------------------------------------
  IF v_plan IS NULL THEN
    v_sub_reason := 'no_record';
  ELSIF v_plan = 'free'
        AND v_beta_expires IS NOT NULL
        AND v_beta_expires > now() THEN
    v_sub_has_access := true;
    v_sub_tier := 'discipline';
    v_sub_reason := 'beta_active';
  ELSIF v_status IN ('expired', 'halted') THEN
    v_sub_reason := 'status_' || v_status;
  ELSIF v_status = 'pending' THEN
    v_sub_reason := 'pending_activation';
  ELSIF v_access_type = 'one_time' THEN
    IF v_period_end IS NOT NULL AND v_period_end > now() THEN
      v_sub_has_access := true;
      v_sub_tier := v_plan;
      v_sub_reason := 'one_time_active';
    ELSE
      v_sub_reason := 'one_time_expired';
    END IF;
  ELSIF v_status = 'cancelled' THEN
    IF v_period_end IS NOT NULL AND v_period_end > now() THEN
      v_sub_has_access := true;
      v_sub_tier := v_plan;
      v_sub_reason := 'cancelled_but_active';
    ELSE
      v_sub_reason := 'cancelled_and_ended';
    END IF;
  ELSIF v_status = 'active' THEN
    IF v_period_end IS NULL OR v_period_end > now() THEN
      v_sub_has_access := true;
      v_sub_tier := v_plan;
      v_sub_reason := 'sub_active';
    ELSE
      v_sub_reason := 'sub_period_ended';
    END IF;
  ELSE
    v_sub_reason := 'unhandled';
  END IF;

  -- ------------------------------------------------------------------
  -- 1. Subscription grants access → return sub verdict unchanged.
  -- ------------------------------------------------------------------
  IF v_sub_has_access THEN
    RETURN QUERY SELECT v_sub_has_access, v_sub_tier, v_sub_reason;
    RETURN;
  END IF;

  -- ------------------------------------------------------------------
  -- 2. No sub access. Check the gym promo row.
  -- ------------------------------------------------------------------
  SELECT premium_until INTO v_promo_until
    FROM public.promo_redemptions
    WHERE user_id = p_user_id
    LIMIT 1;

  IF v_promo_until IS NOT NULL AND v_promo_until > now() THEN
    RETURN QUERY SELECT true, 'premium'::TEXT, 'promo_active'::TEXT;
    RETURN;
  END IF;

  -- ------------------------------------------------------------------
  -- 3. No active promo. If a redemption row exists but is expired AND
  -- there is no subscriptions row at all, surface 'promo_expired' so the
  -- Profile UI can say "your gym access ended". In every other no-access
  -- case (cancelled_and_ended, one_time_expired, status_expired, ...),
  -- the subscription reason is more specific and wins.
  -- ------------------------------------------------------------------
  IF v_promo_until IS NOT NULL AND v_plan IS NULL THEN
    RETURN QUERY SELECT false, 'free'::TEXT, 'promo_expired'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_sub_has_access, v_sub_tier, v_sub_reason;
END;
$function$;