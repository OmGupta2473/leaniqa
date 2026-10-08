-- Align goals.cut_pace with the app's CUT_PACES = [26, 22, 18, 14].
-- The prior migration (20261006000000) used the wrong set {16, 18, 20, 22}.
-- 16 and 20 have no macro math in paceEngine, so legacy rows are
-- normalized to the previously-defaulted value (22).

ALTER TABLE public.goals
  DROP CONSTRAINT IF EXISTS goals_cut_pace_check;

UPDATE public.goals
SET cut_pace = 22
WHERE cut_pace IS NOT NULL AND cut_pace NOT IN (26, 22, 18, 14);

ALTER TABLE public.goals
  ADD CONSTRAINT goals_cut_pace_check
  CHECK (cut_pace IS NULL OR cut_pace IN (26, 22, 18, 14));