-- Idempotent meal logging: a caller-supplied client_token plus a unique index
-- so retries, offline replays, and double-taps resolve to one row.
-- Postgres treats NULL as distinct in unique indexes, so legacy rows (NULL token)
-- do not collide with each other or with new rows.
ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS client_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS meal_logs_user_client_token_key
  ON public.meal_logs (user_id, client_token);
