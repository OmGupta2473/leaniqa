-- Persist how each meal was logged so the client can show, per entry, whether
-- AI credits were consumed. Values:
--
--   legacy       - rows inserted before this migration (source unknown)
--   manual       - custom meal form, no AI involved
--   kb           - parse-meal source='kb' (exact KB match, no credits)
--   memory_cache - parse-meal source='memory_cache' (no credits)
--   db_cache     - parse-meal source='db_cache' (no credits)
--   ai           - parse-meal source='llm' (fresh AI parse, credits used)

ALTER TABLE public.meal_logs
  ADD COLUMN IF NOT EXISTS meal_source TEXT NOT NULL DEFAULT 'legacy';

ALTER TABLE public.meal_logs
  DROP CONSTRAINT IF EXISTS meal_logs_meal_source_check;

ALTER TABLE public.meal_logs
  ADD CONSTRAINT meal_logs_meal_source_check
  CHECK (meal_source IN ('legacy', 'manual', 'kb', 'memory_cache', 'db_cache', 'ai'));

COMMENT ON COLUMN public.meal_logs.meal_source IS
  'How the meal was logged. legacy = pre-migration; manual = form entry; kb/memory_cache/db_cache = no AI credits; ai = AI parse, credits used.';

-- Safe backfill: rows written through the custom-meal form always set this
-- exact tip string, so we can reclassify them without guessing.
UPDATE public.meal_logs
SET meal_source = 'manual'
WHERE meal_source = 'legacy'
  AND tip = 'Manually logged meal.';