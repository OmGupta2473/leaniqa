-- ============================================================================
-- Phase 6.2 catch-up — the two constraints/indexes missing from the first
-- application of 20261017000000.
-- ============================================================================
-- The earlier migration was applied without the popular_meal_cache
-- constraints and without the user_meal_memory recency index. This migration
-- adds them idempotently.
-- ============================================================================

-- 1. popular_meal_cache: enforce the >= 10 distinct users threshold at the DB
--    level so the promotion job cannot accidentally write under-threshold rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'popular_meal_cache_min_users'
      AND conrelid = 'public.popular_meal_cache'::regclass
  ) THEN
    ALTER TABLE public.popular_meal_cache
      ADD CONSTRAINT popular_meal_cache_min_users
      CHECK (distinct_users >= 10);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'popular_meal_cache_users_le_uses'
      AND conrelid = 'public.popular_meal_cache'::regclass
  ) THEN
    ALTER TABLE public.popular_meal_cache
      ADD CONSTRAINT popular_meal_cache_users_le_uses
      CHECK (total_uses >= distinct_users);
  END IF;
END $$;

-- 2. user_meal_memory: recency index for future cleanup + recent-meal lookups.
CREATE INDEX IF NOT EXISTS user_meal_memory_last_used_idx
  ON public.user_meal_memory (last_used_at DESC);

-- 3. Refreshing comments (cosmetic, safe to re-run).
COMMENT ON TABLE public.popular_meal_cache IS
  'Cross-user aggregate cache. Structurally PII-free (no user_id column).
   Entries require >= 10 distinct users; enforced by CHECK constraint.
   Written only by the service-role promotion job.';

COMMENT ON TABLE public.user_meal_memory IS
  'Per-user personal cache of resolved parses. NEVER authoritative. The
   resolver validates the cached food_id + per-100g snapshot against the
   current `foods` row and discards the cache entry if they disagree.';