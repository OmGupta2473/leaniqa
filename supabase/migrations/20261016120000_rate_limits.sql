-- Rate limit table. Service-role only — client never reads or writes.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', now()),
  UNIQUE (identifier, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON public.rate_limits (identifier, endpoint, window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role can access.

-- Atomic check-and-increment.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE (allowed BOOLEAN, current_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  -- Truncate now() to the window boundary.
  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limits (identifier, endpoint, request_count, window_start)
  VALUES (p_identifier, p_endpoint, 1, v_window_start)
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET request_count = public.rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN QUERY SELECT (v_count <= p_max_requests), v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO service_role;

-- Cleanup old windows. Runs daily via cron (already installed from Phase 4C).
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-rate-limits') THEN
      PERFORM cron.schedule(
        'cleanup-rate-limits',
        '15 * * * *',  -- hourly at :15
        $cron$select public.cleanup_rate_limits();$cron$
      );
    END IF;
  END IF;
END $$;