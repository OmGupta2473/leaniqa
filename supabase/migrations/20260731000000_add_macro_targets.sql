ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS carbs_target NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fat_target NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS water_target NUMERIC;
