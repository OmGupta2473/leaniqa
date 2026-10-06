-- Add durable acknowledgement column to user_awards.
-- New awards are inserted with acknowledged_at IS NULL. Users
-- acknowledge them once they have seen the celebration or the awards
-- grid. Historical rows are backfilled so no user receives a
-- celebration storm on the first load after this feature ships.
ALTER TABLE public.user_awards
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

-- Backfill: every historical award is treated as already acknowledged.
UPDATE public.user_awards
SET acknowledged_at = COALESCE(unlocked_at, now())
WHERE acknowledged_at IS NULL;

-- Partial index for the hot query: "how many unacknowledged awards
-- does this user have?"
CREATE INDEX IF NOT EXISTS idx_user_awards_unacknowledged
  ON public.user_awards (user_id)
  WHERE acknowledged_at IS NULL;