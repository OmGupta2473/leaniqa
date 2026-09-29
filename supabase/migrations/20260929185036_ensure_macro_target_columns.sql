-- Ensure profiles.carbs_target and profiles.fat_target exist before removing the
-- client-side fallback that silently drops them. IF NOT EXISTS is a no-op if the
-- columns were already added by 20260731000000_add_macro_targets.sql.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS carbs_target NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fat_target NUMERIC;