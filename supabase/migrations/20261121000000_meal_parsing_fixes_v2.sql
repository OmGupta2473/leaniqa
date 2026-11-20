-- =============================================================================
-- 20261121000000_meal_parsing_fixes_v2.sql  (REVISED — schema-safe)
--
-- Rewrites the failed first attempt. The prior version used
-- provenance='USDA FDC 011332', violating foods_provenance_check which
-- allows only {lab_measured, recipe_calculated, published_reference,
-- undocumented}. This version uses published_reference (matches every
-- prod curated food: egg 83, potato 341, oil 93, roti 1, rice 14).
--
-- Also corrects a misdiagnosis in the previous round: oil.tbsp is ALREADY
-- 14.00g in prod. The 289.5/28g on "Potato strips cooked 50g + 1 tbsp oil"
-- was a fried-potato fuzzy-match (165 kcal / 14g fat / 50g) + one correct
-- 14g oil line (124 kcal / 14g fat). The real fix is a 'potato strips'
-- alias to the existing 'potato' (341). Oil is left untouched.
--
-- Verified prod state (2026-11-20):
--   foods canonical names:
--     'egg' (83), 'egg curry' (84), 'egg bhurji' (85)   — NO egg white
--     'soya chunks curry' (45)                          — NO dry/raw soya
--     'potato' (341, 87/1.9/0.1/20.1)                   — USDA boiled potato
--     'oil' (93), 'spray oil' (522)
--   food_portions: oil.tbsp = 14.00 (already correct)
--   food_aliases: 'boiled potato'/'cooked potato'/'potatoes' → potato (341)
--                 soya * → soya chunks curry (45)
--
-- Schema constraints respected (from information_schema / pg_constraint):
--   foods_provenance_check: {lab_measured, recipe_calculated,
--                            published_reference, undocumented}
--   foods_review_status_check: {verified, provisional, rejected}
--   foods_preparation_state_check: {raw, cooked, boiled, steamed, fried,
--                                   roasted, unknown}
--   foods_default_portion_label_normalized: label must NOT contain
--     bowls|katoris|katori|glasses|cups|pieces|slices|scoops|grams|gms
--   food_aliases_alias_normalized: alias must NOT contain same list
--   food_aliases_alias_food_id_key UNIQUE (alias, food_id)
--   food_portions_food_id_unit_key UNIQUE (food_id, unit)
--   foods_source_source_id_key UNIQUE (source, source_id)
--
-- Idempotent: safe to re-run. Rollback at bottom.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. CREATE 'egg white boiled'
--    Values match USDA FDC 011332 (Egg, white, raw, fresh): 52 kcal,
--    10.9p, 0.2f, 0.7c, 0 fiber. One large white ≈ 33 g.
--    portion label 'large white' — avoids the CHECK's forbidden unit words.
-- -----------------------------------------------------------------------------
INSERT INTO foods (
  source, source_id, source_rank, canonical_name, display_name, search_name,
  category, kcal_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g,
  default_portion_grams, default_portion_label,
  is_ambiguous, oil_included, preparation_state, provenance, review_status
)
SELECT
  'curated', 'curated:egg-white-boiled', 0,
  'egg white boiled', 'Egg white, boiled', 'egg white boiled',
  'egg', 52, 10.9, 0.2, 0.7, 0,
  33, 'large white',
  false, false, 'boiled', 'published_reference', 'provisional'
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE canonical_name = 'egg white boiled')
ON CONFLICT (source, source_id) DO NOTHING;

-- A2. Egg-white aliases. Each word-form (singular/plural, prep word before
--     or after the noun) → egg white boiled. Bare 'egg'/'eggs' are
--     intentionally NOT aliased — those must keep resolving to whole egg.
INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT v.alias, f.id, NULL, NULL, 0.95, 'meal_parsing_fix_20261121'
FROM (VALUES
  ('egg white'), ('egg whites'),
  ('white egg'), ('white eggs'),
  ('boiled egg white'), ('boiled egg whites'), ('boiled white eggs'),
  ('egg white boiled'), ('egg whites boiled'),
  ('cooked egg white'), ('egg white cooked')
) AS v(alias)
CROSS JOIN foods f
WHERE f.canonical_name = 'egg white boiled'
ON CONFLICT (alias, food_id) DO NOTHING;

-- A3. Piece portion (1 large white = 33 g).
INSERT INTO food_portions (food_id, unit, grams, is_default, source, confidence)
SELECT f.id, 'piece', 33, true, 'meal_parsing_fix_20261121', 1.0
FROM foods f
WHERE f.canonical_name = 'egg white boiled'
ON CONFLICT (food_id, unit) DO NOTHING;

-- -----------------------------------------------------------------------------
-- B. CREATE 'soya chunks dry' (raw / uncooked TVP)
--    Defatted soy-protein chunks as sold dry. Approximate to USDA 16114
--    (Soy flour, defatted): 336/52/0.5/33/13. Carries no oil/gravy.
--    presentation_state='raw' so state/entity-mismatch detector correctly
--    does NOT fire on "raw soya chunks" / "dry soya chunks".
-- -----------------------------------------------------------------------------
INSERT INTO foods (
  source, source_id, source_rank, canonical_name, display_name, search_name,
  category, kcal_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g,
  default_portion_grams, default_portion_label,
  is_ambiguous, oil_included, preparation_state, provenance, review_status
)
SELECT
  'curated', 'curated:soya-chunks-dry', 0,
  'soya chunks dry', 'Soya chunks, dry (raw)', 'soya chunks dry',
  'legume', 336, 52, 0.5, 33, 13,
  50, 'dry',
  false, false, 'raw', 'published_reference', 'provisional'
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE canonical_name = 'soya chunks dry')
ON CONFLICT (source, source_id) DO NOTHING;

-- B2. Dry-soya aliases → soya chunks dry.
--     Bare 'soya chunks' is INTENTIONALLY NOT aliased: without a state word
--     the user may mean either the dry ingredient or the cooked curry.
--     Leaving it un-aliased keeps the existing fuzzy fallback to curry,
--     which is the more likely user intent ("soya chunks" typed while
--     eating the dish).
INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT v.alias, f.id, NULL, NULL, 0.95, 'meal_parsing_fix_20261121'
FROM (VALUES
  ('dry soya chunks'), ('dry soya chunk'),
  ('soya chunks dry'), ('soya chunk dry'),
  ('raw soya chunks'), ('raw soya chunk'),
  ('soya chunks raw'), ('soya chunk raw'),
  ('soya chunks uncooked'), ('uncooked soya chunks')
) AS v(alias)
CROSS JOIN foods f
WHERE f.canonical_name = 'soya chunks dry'
ON CONFLICT (alias, food_id) DO NOTHING;

-- B3. Portions: g passthrough (1 g = 1 g) + 'piece' = 50 g (one dry serving).
INSERT INTO food_portions (food_id, unit, grams, is_default, source, confidence)
SELECT f.id, v.unit, v.grams, v.is_default, 'meal_parsing_fix_20261121', 1.0
FROM foods f
JOIN (VALUES
  ('g'::text,     1::numeric, false),
  ('piece'::text, 50::numeric, true)
) AS v(unit, grams, is_default) ON f.canonical_name = 'soya chunks dry'
ON CONFLICT (food_id, unit) DO NOTHING;

-- -----------------------------------------------------------------------------
-- C. Alias 'potato strips*' → existing 'potato' (341)
--    341 macros (87/1.9/0.1/20.1) are USDA boiled potato. This blocks the
--    fuzzy match to a fried-potato dish (~331 kcal / 28g fat per 100g) that
--    was producing 289.5 / 28g on "Potato strips cooked 50g + 1 tbsp oil".
--    All aliases clean per food_aliases_alias_normalized.
-- -----------------------------------------------------------------------------
INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT v.alias, f.id, NULL, NULL, 0.95, 'meal_parsing_fix_20261121'
FROM (VALUES
  ('potato strips'), ('potato strip'),
  ('potato strips cooked'), ('cooked potato strips'),
  ('potato strips boiled'),  ('boiled potato strips')
) AS v(alias)
CROSS JOIN foods f
WHERE f.canonical_name = 'potato'
ON CONFLICT (alias, food_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- D. Default serving portions for 'soya chunks curry' (45)
--    Today it has NO food_portions rows, so "soya chunks curry" resolves
--    with no defined serving and users see a mystery number. Add bowl
--    (default), katori, cup. Source column exists (nullable), is_default
--    is a NOT NULL boolean defaulting false.
-- -----------------------------------------------------------------------------
INSERT INTO food_portions (food_id, unit, grams, is_default, source, confidence)
SELECT f.id, v.unit, v.grams, v.is_default, 'meal_parsing_fix_20261121', 1.0
FROM foods f
JOIN (VALUES
  ('bowl'::text,   150::numeric, true),
  ('katori'::text, 100::numeric, false),
  ('cup'::text,    150::numeric, false)
) AS v(unit, grams, is_default) ON f.canonical_name = 'soya chunks curry'
ON CONFLICT (food_id, unit) DO NOTHING;

-- D2. Backfill foods.default_portion_* only if currently NULL (never
--     overwrite curated). Label 'serving' avoids CHECK-forbidden unit words.
UPDATE foods
SET default_portion_grams = COALESCE(default_portion_grams, 150),
    default_portion_label = COALESCE(default_portion_label, 'serving')
WHERE canonical_name = 'soya chunks curry'
  AND (default_portion_grams IS NULL OR default_portion_label IS NULL);

-- -----------------------------------------------------------------------------
-- E. Katori portion for dal-family foods.
--    Katori = 100 g. Covers dal variants and the common legume curries.
--    ON CONFLICT (food_id, unit) preserves any curated katori row.
-- -----------------------------------------------------------------------------
INSERT INTO food_portions (food_id, unit, grams, is_default, source, confidence)
SELECT f.id, 'katori', 100, false, 'meal_parsing_fix_20261121', 1.0
FROM foods f
WHERE LOWER(f.canonical_name) LIKE '%dal%'
   OR LOWER(f.canonical_name) LIKE '%lentil%'
   OR LOWER(f.canonical_name) LIKE '%rajma%'
   OR LOWER(f.canonical_name) LIKE '%chole%'
   OR LOWER(f.canonical_name) LIKE '%chana%'
ON CONFLICT (food_id, unit) DO NOTHING;

-- -----------------------------------------------------------------------------
-- F. Oil — NOT TOUCHED. oil.tbsp is already 14.00g (verified). The 28g fat
--    in the flagged smoke test was a fried-potato fuzzy-match, not oil.
-- -----------------------------------------------------------------------------

-- =============================================================================
-- POST-DEPLOY VERIFICATION (run manually after applying)
-- =============================================================================
-- 1. New entities exist:
-- SELECT id, canonical_name, category, kcal_per_100g, preparation_state,
--        provenance, review_status, default_portion_label
-- FROM foods WHERE canonical_name IN ('egg white boiled','soya chunks dry');
-- -- Expected: 2 rows, provenance='published_reference'.
--
-- 2. Egg-white aliases → 'egg white boiled' (NEVER 83 / rice):
-- SELECT a.alias, f.canonical_name
-- FROM food_aliases a JOIN foods f ON f.id = a.food_id
-- WHERE a.alias IN ('egg white','egg whites','white egg','white eggs',
--                   'boiled egg white','boiled white eggs','egg whites boiled')
-- ORDER BY a.alias;
-- -- Expected: every row → 'egg white boiled'.
--
-- 3. Dry-soya aliases → 'soya chunks dry' (NEVER 45 curry):
-- SELECT a.alias, f.canonical_name
-- FROM food_aliases a JOIN foods f ON f.id = a.food_id
-- WHERE a.alias IN ('raw soya chunks','dry soya chunks','soya chunks dry',
--                   'soya chunks raw','dry soya chunk')
-- ORDER BY a.alias;
-- -- Expected: every row → 'soya chunks dry'.
--
-- 4. Potato strips aliases → 'potato' (341, 87.00 kcal):
-- SELECT a.alias, f.id, f.canonical_name, f.kcal_per_100g
-- FROM food_aliases a JOIN foods f ON f.id = a.food_id
-- WHERE a.alias LIKE 'potato strip%' OR a.alias = 'cooked potato strips';
-- -- Expected: all → 341 'potato' 87.00.
--
-- 5. Soya curry default portions:
-- SELECT f.canonical_name, p.unit, p.grams, p.is_default
-- FROM food_portions p JOIN foods f ON f.id = p.food_id
-- WHERE f.canonical_name = 'soya chunks curry';
-- -- Expected: bowl=150 (default), katori=100, cup=150.
--
-- 6. Dal katori:
-- SELECT f.canonical_name, p.unit, p.grams
-- FROM food_portions p JOIN foods f ON f.id = p.food_id
-- WHERE p.unit = 'katori'
--   AND (LOWER(f.canonical_name) LIKE '%dal%'
--        OR LOWER(f.canonical_name) LIKE '%lentil%'
--        OR LOWER(f.canonical_name) LIKE '%rajma%');
-- -- Expected: ≥1 row per dal-family food in KB.
--
-- 7. Oil untouched (sanity):
-- SELECT f.canonical_name, p.unit, p.grams
-- FROM food_portions p JOIN foods f ON f.id = p.food_id
-- WHERE f.category = 'oil' AND p.unit = 'tbsp';
-- -- Expected: still 14.00 for oil/ghee/butter.

-- =============================================================================
-- ROLLBACK (do not run here — for reference)
-- =============================================================================
-- delete from food_aliases  where source = 'meal_parsing_fix_20261121';
-- delete from food_portions where source = 'meal_parsing_fix_20261121';
-- delete from foods
--   where canonical_name in ('egg white boiled','soya chunks dry')
--     and source = 'curated';
-- -- Revert foods.default_portion_* on soya chunks curry if needed:
-- -- update foods set default_portion_grams = null, default_portion_label = null
-- --   where canonical_name = 'soya chunks curry' and default_portion_label = 'serving';
-- =============================================================================