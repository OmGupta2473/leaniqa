-- ============================================================================
-- Phase 6.2 — Local food matching foundation
-- ============================================================================
-- Five core tables + two ambiguity tables for the hybrid resolver. All
-- additive. No existing table is altered. The pg_trgm extension is enabled
-- for fuzzy search over food names and aliases.
--
-- Backlog items from the Phase 6.0 report:
--   1. Post-normalization alias keys: CHECK on food_aliases.alias
--   2. Normalized portion labels:    CHECK on foods.default_portion_label
--   3. Compound dish phrases:        foods.compound_of BIGINT[] (unused in 6.2)
--   4. Compound quantity modifiers:  Phase 6.4 AI concern
--   5. Longest-first unit regex:     TS resolver concern (Phase 6.4)
--   6. Ambiguity overlay:            food_ambiguous_terms + candidates
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------------------
-- 1. foods — master catalog
-- ----------------------------------------------------------------------------
CREATE TABLE public.foods (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source TEXT NOT NULL,
    -- 'curated' | 'usda_foundation' | 'usda_sr_legacy' | 'usda_fndds' | 'ifct'
  source_id TEXT NOT NULL,
    -- USDA fdc_id (text) | IFCT code | curated:<slug>
  source_rank INTEGER NOT NULL,
    -- 0 = curated (highest) | 1 = ifct | 2 = usda_foundation
    -- | 3 = usda_sr_legacy | 4 = usda_fndds. Lower is preferred.
  canonical_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  search_name TEXT NOT NULL,
  category TEXT,
  kcal_per_100g NUMERIC(8,2) NOT NULL,
  protein_per_100g NUMERIC(6,2) NOT NULL,
  fat_per_100g NUMERIC(6,2) NOT NULL,
  carbs_per_100g NUMERIC(6,2) NOT NULL,
  fiber_per_100g NUMERIC(6,2) NOT NULL DEFAULT 0,
  default_portion_grams NUMERIC(7,2),
  default_portion_label TEXT,
  is_ambiguous BOOLEAN NOT NULL DEFAULT FALSE,
  compound_of BIGINT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);

COMMENT ON TABLE public.foods IS
  'Master food catalog. Curated Indian dishes (source_rank 0) and IFCT
   (source_rank 1) are preferred over USDA. Never user-writable.';

CREATE INDEX foods_canonical_name_idx ON public.foods (canonical_name);
CREATE INDEX foods_search_name_trgm_idx ON public.foods USING gin (search_name gin_trgm_ops);
CREATE INDEX foods_source_rank_idx ON public.foods (source_rank);
CREATE INDEX foods_category_idx ON public.foods (category);

ALTER TABLE public.foods
  ADD CONSTRAINT foods_default_portion_label_normalized
  CHECK (
    default_portion_label IS NULL
    OR default_portion_label !~ '\m(bowls|katoris|katori|glasses|cups|pieces|slices|scoops|grams|gms)\M'
  );

-- ----------------------------------------------------------------------------
-- 2. food_aliases
-- ----------------------------------------------------------------------------
CREATE TABLE public.food_aliases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  alias TEXT NOT NULL,
  food_id BIGINT NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  portion_grams NUMERIC(7,2),
  portion_unit TEXT,
  source TEXT NOT NULL DEFAULT 'seed',
    -- 'seed' | 'user' | 'promoted'
  confidence NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (alias, food_id)
);

CREATE INDEX food_aliases_trgm_idx ON public.food_aliases USING gin (alias gin_trgm_ops);
CREATE INDEX food_aliases_alias_idx ON public.food_aliases (alias);
CREATE INDEX food_aliases_food_id_idx ON public.food_aliases (food_id);

ALTER TABLE public.food_aliases
  ADD CONSTRAINT food_aliases_alias_normalized
  CHECK (alias !~ '\m(bowls|katoris|katori|glasses|cups|pieces|slices|scoops|grams|gms)\M');

-- ----------------------------------------------------------------------------
-- 3. Ambiguity tables
-- ----------------------------------------------------------------------------
CREATE TABLE public.food_ambiguous_terms (
  term TEXT PRIMARY KEY,
  notes TEXT
);

CREATE TABLE public.food_ambiguous_candidates (
  term TEXT NOT NULL REFERENCES public.food_ambiguous_terms(term) ON DELETE CASCADE,
  food_id BIGINT NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (term, food_id)
);

CREATE INDEX food_ambiguous_candidates_term_idx
  ON public.food_ambiguous_candidates (term, rank);

-- ----------------------------------------------------------------------------
-- 4. user_meal_memory — PERSONAL cache only
-- ----------------------------------------------------------------------------
-- CRITICAL CONTRACT:
--   This table caches a user's own resolved parses so repeat meals are fast.
--   It MUST NEVER override canonical nutrition from `foods` or verified
--   entries in `food_aliases`. The resolver checks this layer FIRST but only
--   uses the cached macros when the food_id it resolved to still matches the
--   current `foods` row for that food. If the resolver's current canonical
--   row disagrees (because the catalog was corrected), the cache entry is
--   ignored and overwritten on the next write.
--
--   This contract is enforced in code (Phase 6.4 resolver), not in SQL,
--   because "current canonical row" is a runtime property. The DB shape
--   keeps user data physically isolated from global data.
CREATE TABLE public.user_meal_memory (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  normalized_text TEXT NOT NULL,
  items JSONB NOT NULL,
    -- ResolvedItem[] mirroring the resolver output, including the food_id
    -- and the per-100g snapshot at the time of the write. The resolver
    -- compares this snapshot against the live `foods` row before trusting it.
  total_kcal NUMERIC(8,2) NOT NULL,
  total_protein NUMERIC(7,2) NOT NULL,
  total_fat NUMERIC(7,2) NOT NULL,
  total_carbs NUMERIC(7,2) NOT NULL,
  uses INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, normalized_text)
);

COMMENT ON TABLE public.user_meal_memory IS
  'Per-user personal cache of resolved parses. NEVER authoritative. The
   resolver validates the cached food_id + per-100g snapshot against the
   current `foods` row and discards the cache entry if they disagree.';

CREATE INDEX user_meal_memory_lookup_idx
  ON public.user_meal_memory (user_id, normalized_text);

-- Recency index for future cache cleanup + "recent meals" lookups.
CREATE INDEX user_meal_memory_last_used_idx
  ON public.user_meal_memory (last_used_at DESC);

-- ----------------------------------------------------------------------------
-- 5. popular_meal_cache — NO PII, aggregate only
-- ----------------------------------------------------------------------------
-- CRITICAL CONTRACT:
--   This table is PII-free by construction. There is no user_id column.
--   Entries are promoted ONLY after >= 10 distinct users have logged the
--   same normalized meal. The CHECK constraint below makes the threshold
--   enforced at the DB level, not just in the promotion job.
CREATE TABLE public.popular_meal_cache (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  normalized_text TEXT NOT NULL UNIQUE,
  items JSONB NOT NULL,
  total_kcal NUMERIC(8,2) NOT NULL,
  total_protein NUMERIC(7,2) NOT NULL,
  total_fat NUMERIC(7,2) NOT NULL,
  total_carbs NUMERIC(7,2) NOT NULL,
  distinct_users INTEGER NOT NULL,
  total_uses INTEGER NOT NULL,
  last_computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- No PII: only normalized meal text and aggregate counts.
  -- Threshold enforced at the DB level.
  CONSTRAINT popular_meal_cache_min_users CHECK (distinct_users >= 10),
  CONSTRAINT popular_meal_cache_users_le_uses CHECK (total_uses >= distinct_users)
);

COMMENT ON TABLE public.popular_meal_cache IS
  'Cross-user aggregate cache. Structurally PII-free (no user_id column).
   Entries require >= 10 distinct users; enforced by CHECK constraint.
   Written only by the service-role promotion job.';

CREATE INDEX popular_meal_cache_uses_idx
  ON public.popular_meal_cache (total_uses DESC);

-- ----------------------------------------------------------------------------
-- 6. meal_resolution_log
-- ----------------------------------------------------------------------------
CREATE TABLE public.meal_resolution_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  normalized_text TEXT NOT NULL,
  result JSONB NOT NULL,
  layers_used TEXT[] NOT NULL,
  ai_fallback BOOLEAN NOT NULL,
  overall_confidence NUMERIC(3,2),
  resolution_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX meal_resolution_log_user_created_idx
  ON public.meal_resolution_log (user_id, created_at DESC);

CREATE INDEX meal_resolution_log_created_idx
  ON public.meal_resolution_log (created_at DESC);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_ambiguous_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_ambiguous_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_meal_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popular_meal_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_resolution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read access to foods"
  ON public.foods FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to food_aliases"
  ON public.food_aliases FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to food_ambiguous_terms"
  ON public.food_ambiguous_terms FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to food_ambiguous_candidates"
  ON public.food_ambiguous_candidates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read access to popular_meal_cache"
  ON public.popular_meal_cache FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage their own meal memory"
  ON public.user_meal_memory FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert their own resolution logs"
  ON public.meal_resolution_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read their own resolution logs"
  ON public.meal_resolution_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Grants
-- ----------------------------------------------------------------------------
GRANT ALL ON public.foods TO service_role;
GRANT ALL ON public.food_aliases TO service_role;
GRANT ALL ON public.food_ambiguous_terms TO service_role;
GRANT ALL ON public.food_ambiguous_candidates TO service_role;
GRANT ALL ON public.user_meal_memory TO service_role;
GRANT ALL ON public.popular_meal_cache TO service_role;
GRANT ALL ON public.meal_resolution_log TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ----------------------------------------------------------------------------
-- updated_at trigger on foods
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_foods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_foods_updated_at ON public.foods;
CREATE TRIGGER set_foods_updated_at
  BEFORE UPDATE ON public.foods
  FOR EACH ROW
  EXECUTE FUNCTION public.set_foods_updated_at();