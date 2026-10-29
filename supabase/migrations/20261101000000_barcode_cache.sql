-- ============================================================
-- barcode_cache
-- ============================================================
-- Persists nutrition data returned by the lookup-barcode edge
-- function (currently Open Food Facts). Keyed by barcode so a
-- second scan of the same product never hits the external API.
--
-- Rows are written ONLY by the edge function (service_role).
-- Authenticated users can READ every row because a barcode's
-- nutrition data is public product metadata, not user PII.

CREATE TABLE IF NOT EXISTS public.barcode_cache (
  barcode                TEXT PRIMARY KEY,
  product_name           TEXT,
  brand                  TEXT,
  image_url              TEXT,
  nutrition_per_100g     JSONB NOT NULL,
  serving_size           NUMERIC,
  serving_size_unit      TEXT,
  detected_default_unit  TEXT,
  unit_weights           JSONB,
  source                 TEXT NOT NULL CHECK (source IN ('openfoodfacts', 'fatsecret', 'nutritionix', 'manual')),
  fetched_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.barcode_cache ENABLE ROW LEVEL SECURITY;

-- Read-only for authenticated users. No write policy for
-- authenticated — only service_role bypasses RLS.
DROP POLICY IF EXISTS "Anyone authenticated can read barcode cache" ON public.barcode_cache;
CREATE POLICY "Anyone authenticated can read barcode cache"
  ON public.barcode_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Optional: index on fetched_at for a future TTL cleanup job.
CREATE INDEX IF NOT EXISTS idx_barcode_cache_fetched_at
  ON public.barcode_cache (fetched_at);


-- ============================================================
-- Extend meal_source to include 'barcode'
-- ============================================================
-- The original column was created by
-- supabase/migrations/20261028120000_meal_source.sql. That
-- migration used one of two shapes:
--   (a) TEXT with a CHECK constraint, OR
--   (b) a Postgres ENUM type.
--
-- The DO block below handles both. It is safe to re-run.

DO $$
DECLARE
  check_con TEXT;
  is_enum   BOOLEAN := false;
BEGIN
  -- Case A: ENUM named 'meal_source' (or 'meal_source_enum').
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_source') THEN
    is_enum := true;
    ALTER TYPE meal_source ADD VALUE IF NOT EXISTS 'barcode';
  ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_source_enum') THEN
    is_enum := true;
    ALTER TYPE meal_source_enum ADD VALUE IF NOT EXISTS 'barcode';
  END IF;

  -- Case B: TEXT with a CHECK constraint. Drop every matching
  -- CHECK on meal_logs that references meal_source, then
  -- recreate one with the full list including 'barcode'.
  IF NOT is_enum THEN
    FOR check_con IN
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = rel.relnamespace
      WHERE ns.nspname = 'public'
        AND rel.relname = 'meal_logs'
        AND con.contype = 'c'
        AND pg_get_constraintdef(con.oid) LIKE '%meal_source%'
    LOOP
      EXECUTE format('ALTER TABLE public.meal_logs DROP CONSTRAINT %I', check_con);
    END LOOP;

    ALTER TABLE public.meal_logs
      ADD CONSTRAINT meal_logs_meal_source_check
      CHECK (
        meal_source IS NULL
        OR meal_source IN (
          'legacy', 'manual', 'kb', 'memory_cache', 'db_cache', 'ai', 'barcode'
        )
      );
  END IF;
END $$;