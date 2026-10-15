-- Phase 4C: auto-downgrade expired one-time subscriptions.
--
-- A one_time row whose current_period_end has passed is stale. Client
-- and edge functions already treat it as free via the access_type check,
-- but the DB row should also be flipped so no stale state lingers.
--
-- Runs daily at 02:00 IST (20:30 UTC previous day).

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
      current_period_end = NULL,
      billing_cycle = NULL
  WHERE access_type = 'one_time'
    AND current_period_end IS NOT NULL
    AND current_period_end < now()
    AND plan != 'free';
END;
$$;

DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF NOT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-one-time-subs'
    ) THEN
      PERFORM cron.schedule(
        'cleanup-expired-one-time-subs',
        '30 20 * * *',
        $inner$select public.cleanup_expired_one_time_subs();$inner$
      );
    END IF;
  END IF;
END;
$outer$;