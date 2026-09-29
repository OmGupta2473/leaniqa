-- Remove the water tracking feature.
-- DESTRUCTIVE: drops daily_metrics.water, profiles.water_target, and the water_logs table.
-- Take a pg_dump of the affected tables before applying anywhere with real user data.
ALTER TABLE public.daily_metrics DROP COLUMN IF EXISTS water;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS water_target;
DROP TABLE IF EXISTS public.water_logs CASCADE;