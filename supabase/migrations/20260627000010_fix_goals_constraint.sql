-- Ensure the unique constraint on goals.user_id exists
-- Drop any partial or conflicting constraint first
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_user_id_key;

-- Re-add cleanly
ALTER TABLE public.goals
  ADD CONSTRAINT goals_user_id_key UNIQUE (user_id);

-- Also ensure updated_at column exists (needed for upsert conflict resolution)
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update the upsert to also update updated_at on conflict
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS goals_updated_at_trigger ON public.goals;
CREATE TRIGGER goals_updated_at_trigger
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_updated_at();
