-- Cut pace: the user's chosen deficit rate for a cut goal.
-- 16/18/20/22 are the only valid paces. NULL for recomp/bulk/explorer.
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS cut_pace INTEGER;

-- Drop and re-add the constraint so the migration is idempotent on rerun.
ALTER TABLE public.goals
  DROP CONSTRAINT IF EXISTS goals_cut_pace_check;
ALTER TABLE public.goals
  ADD CONSTRAINT goals_cut_pace_check
  CHECK (cut_pace IS NULL OR cut_pace IN (16, 18, 20, 22));

-- Backfill: any cut goal that was created before this column existed gets
-- the previous default of 22.
UPDATE public.goals
SET cut_pace = 22
WHERE goal_type = 'cut' AND cut_pace IS NULL;