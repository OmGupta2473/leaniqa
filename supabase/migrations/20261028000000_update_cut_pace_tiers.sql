-- 1. Update existing rows to map old paces to the new tiers
-- 26% -> 22%, 18% -> 16%, 14% -> 10%
UPDATE public.goals SET cut_pace = 22 WHERE cut_pace = 26;
UPDATE public.goals SET cut_pace = 16 WHERE cut_pace = 18;
UPDATE public.goals SET cut_pace = 10 WHERE cut_pace = 14;

-- 2. Drop the old constraint
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_cut_pace_check;

-- 3. Add the new constraint
ALTER TABLE public.goals ADD CONSTRAINT goals_cut_pace_check
  CHECK (cut_pace IN (22, 16, 10, 6) OR cut_pace IS NULL);

-- 4. Update the default column value (just in case)
ALTER TABLE public.goals ALTER COLUMN cut_pace SET DEFAULT 22;