-- Add gain_pace to goals, mirroring cut_pace. Values: 8, 10, 12 (% surplus).
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS gain_pace INTEGER DEFAULT 8;

ALTER TABLE goals
  DROP CONSTRAINT IF EXISTS goals_gain_pace_check;

ALTER TABLE goals
  ADD CONSTRAINT goals_gain_pace_check
  CHECK (gain_pace IS NULL OR gain_pace IN (8, 10, 12));

-- Backfill existing bulk users to the current default (8%).
UPDATE goals
SET gain_pace = 8
WHERE gain_pace IS NULL;
