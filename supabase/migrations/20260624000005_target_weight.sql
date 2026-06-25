-- Add target_weight to goals
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS target_weight NUMERIC;
