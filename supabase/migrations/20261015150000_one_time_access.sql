-- Phase 4: one-time month access alongside autopay subscriptions.
--
-- access_type: 'subscription' (default) or 'one_time'.
-- A one_time row still uses current_period_end, but is not backed by a
-- Razorpay subscription. On expiry it reverts to free.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'subscription';

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_access_type_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_access_type_check
  CHECK (access_type IS NULL OR access_type IN ('subscription', 'one_time'));

-- Update get_user_history_days so a one_time row past its period_end
-- resolves to free-tier limits even before the cron job downgrades it.
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
  v_access_type TEXT;
BEGIN
  SELECT plan, status, beta_expires_at, current_period_end, access_type
    INTO v_plan, v_status, v_beta_expires, v_period_end, v_access_type
    FROM public.subscriptions
    WHERE user_id = p_user_id
    LIMIT 1;

  IF v_plan IS NULL THEN
    RETURN 14;
  END IF;

  IF v_status = 'active' THEN
    -- For one-time access, a past period_end means the paid window is over.
    IF v_access_type = 'one_time'
       AND (v_period_end IS NULL OR v_period_end <= now()) THEN
      RETURN 14;
    END IF;
  ELSIF v_status = 'cancelled'
        AND v_period_end IS NOT NULL
        AND v_period_end > now() THEN
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