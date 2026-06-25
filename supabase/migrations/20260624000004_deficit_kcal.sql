-- Add deficit_kcal to goals
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS deficit_kcal INTEGER NOT NULL DEFAULT 400;
