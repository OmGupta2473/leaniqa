-- Onboarding v2: dietary preference + goal type.
-- Additive columns; existing rows default to NULL for diet and 'cut' for goal
-- (best guess from legacy data). No backfill required.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dietary_preference TEXT;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_dietary_preference_check
  CHECK (dietary_preference IS NULL OR dietary_preference IN ('veg', 'egg', 'nonveg'));

ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS goal_type TEXT;

ALTER TABLE public.goals
  ADD CONSTRAINT goals_goal_type_check
  CHECK (goal_type IS NULL OR goal_type IN ('cut', 'recomp', 'bulk'));

-- Default legacy goals to 'cut' so downstream reads don't need to null-check.
UPDATE public.goals SET goal_type = 'cut' WHERE goal_type IS NULL;

-- New rows must always specify goal_type.
ALTER TABLE public.goals
  ALTER COLUMN goal_type SET NOT NULL;
