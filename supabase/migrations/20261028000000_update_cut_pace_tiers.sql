-- 1. Drop the old constraint FIRST.
-- Postgres validates a CHECK at end of each statement, so the remapping
-- UPDATEs below would be rejected against the old set (26, 22, 18, 14)
-- as soon as they write a new value (16, 10). The constraint must be
-- lifted before any UPDATE writes a value outside the old set.
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_cut_pace_check;

-- 2. Update existing rows to map old paces to the new tiers
-- 26% -> 22%, 18% -> 16%, 14% -> 10% (22% stays 22%; 6% is reserved for new users)
UPDATE public.goals SET cut_pace = 22 WHERE cut_pace = 26;
UPDATE public.goals SET cut_pace = 16 WHERE cut_pace = 18;
UPDATE public.goals SET cut_pace = 10 WHERE cut_pace = 14;

-- 3. Re-apply the check with the new allowed set
ALTER TABLE public.goals ADD CONSTRAINT goals_cut_pace_check
  CHECK (cut_pace IN (22, 16, 10, 6) OR cut_pace IS NULL);

-- 4. Update the default column value
ALTER TABLE public.goals ALTER COLUMN cut_pace SET DEFAULT 22;