-- A5: keep current_period_end after expiry so the client can show
-- "Your access ended on X" for up to 30 days post-expiry.
-- Previously the cron cleared it, leaving the UI with no date to display.

CREATE OR REPLACE FUNCTION public.cleanup_expired_one_time_subs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET plan = 'free',
      status = 'expired',
      access_type = 'subscription',
      billing_cycle = NULL
      -- current_period_end intentionally retained.
  WHERE access_type = 'one_time'
    AND current_period_end IS NOT NULL
    AND current_period_end < now()
    AND plan != 'free';
END;
$$;