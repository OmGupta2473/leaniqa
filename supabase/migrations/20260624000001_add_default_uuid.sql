-- Alter existing tables to set default value for id column
ALTER TABLE public.goals ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.meal_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.weight_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.daily_metrics ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.weekly_reports ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.water_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.api_usage ALTER COLUMN id SET DEFAULT gen_random_uuid();
