-- User-set daily calorie target. NULL means "use the calculated
-- target from body stats and goal deficit". This replaces the old
-- (broken) behavior of overwriting maintenance_kcal from the edit
-- nutrition modal.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_kcal INTEGER;

-- Sanity bounds. No clinical floor is enforced by design; this only
-- blocks obviously wrong writes.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_target_kcal_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_target_kcal_check
  CHECK (target_kcal IS NULL OR (target_kcal BETWEEN 500 AND 10000));