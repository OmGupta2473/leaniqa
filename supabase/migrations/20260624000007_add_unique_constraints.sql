-- Add unique constraints to prevent race conditions during upsert

ALTER TABLE public.daily_metrics ADD CONSTRAINT daily_metrics_user_id_date_key UNIQUE (user_id, date);
ALTER TABLE public.goals ADD CONSTRAINT goals_user_id_key UNIQUE (user_id);

