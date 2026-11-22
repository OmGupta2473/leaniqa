-- =============================================================================
-- 20261122000000_raw_cooked_fixes.sql
--
-- Fixes metadata bugs + creates the missing raw-rice entity, based entirely
-- on verified prod data (Query A + Query D, run 2026-11-22).
--
-- Verified prod state:
--   foods.preparation_state CHECK enum: {raw, cooked, boiled, steamed,
--                                         fried, roasted, unknown}
--   foods.review_status CHECK enum: {verified, provisional, rejected}
--   foods.provenance CHECK enum: {lab_measured, recipe_calculated,
--                                  published_reference, undocumented}
--   Missing entities: no 'raw rice'
--   Mislabeled entities:
--     77  raw chicken breast   prepState='cooked'   → should be 'raw'
--     79  raw mutton           prepState='cooked'   → should be 'raw'
--     364 raw rohu fish        prepState='unknown'  → should be 'raw'
--     341 potato               prepState='unknown'  → should be 'boiled'
--                                (macros 87/1.9/0.1/20.1 = USDA boiled potato)
--
-- Idempotent. Safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Fix preparation_state on mislabeled raw entities.
-- -----------------------------------------------------------------------------
UPDATE foods SET preparation_state = 'raw'
WHERE canonical_name IN ('raw chicken breast', 'raw mutton', 'raw rohu fish')
  AND (preparation_state IS NULL
       OR preparation_state <> 'raw');

-- 2. Fix potato: 341 has boiled-potato macros (87 kcal USDA boiled).
--    Marking 'boiled' ensures 100g raw potato correctly fires a state/entity
--    conflict rather than silently returning boiled macros labelled raw.
UPDATE foods SET preparation_state = 'boiled'
WHERE canonical_name = 'potato' AND preparation_state IS NULL;

-- -----------------------------------------------------------------------------
-- 3. CREATE 'raw rice' (USDA FDC 20045: white long-grain, unenriched, raw).
--    365 kcal, 7p, 0.7f, 80c, 1.3fib. Material difference from cooked rice
--    (14: 130 kcal) — 2.8× difference, requires separate entity.
-- -----------------------------------------------------------------------------
INSERT INTO foods (
  source, source_id, source_rank, canonical_name, display_name, search_name,
  category, kcal_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g,
  default_portion_grams, default_portion_label,
  is_ambiguous, oil_included, preparation_state, provenance, review_status
)
SELECT
  'curated', 'curated:raw-rice', 0,
  'raw rice', 'Rice, raw (uncooked)', 'raw rice',
  'rice', 365, 7, 0.7, 80, 1.3,
  100, '100g',
  false, false, 'raw', 'published_reference', 'provisional'
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE canonical_name = 'raw rice')
ON CONFLICT (source, source_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Aliases → 'raw rice' (canonical-match still wins, aliases for reversed
--    word order and 'uncooked' phrasing).
-- -----------------------------------------------------------------------------
INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT v.alias, f.id, NULL, NULL, 0.95, 'raw_cooked_fix_20261122'
FROM (VALUES ('rice raw'), ('uncooked rice')) AS v(alias)
CROSS JOIN foods f
WHERE f.canonical_name = 'raw rice'
ON CONFLICT (alias, food_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. Aliases → 'raw chicken breast' (canonical-match wins for 'raw chicken
--    breast'; the reversed/bare forms need explicit aliases).
-- -----------------------------------------------------------------------------
INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT v.alias, f.id, NULL, NULL, 0.95, 'raw_cooked_fix_20261122'
FROM (VALUES ('chicken breast raw'), ('uncooked chicken breast'))
AS v(alias)
CROSS JOIN foods f
WHERE f.canonical_name = 'raw chicken breast'
ON CONFLICT (alias, food_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. Aliases → 'raw mutton' (reversed + uncooked).
-- -----------------------------------------------------------------------------
INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT v.alias, f.id, NULL, NULL, 0.95, 'raw_cooked_fix_20261122'
FROM (VALUES ('mutton raw'), ('uncooked mutton')) AS v(alias)
CROSS JOIN foods f
WHERE f.canonical_name = 'raw mutton'
ON CONFLICT (alias, food_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. Bare 'soya chunks' alias → 'soya chunks dry' (717, raw, 336/52/0.5/33/13).
--
--    Per task spec: "50g soya chunks" (grams, no dish context) → dry/raw
--    soya. With this alias, "50g soya chunks" resolves to 717 via alias,
--    prepState='raw' → resolver returns "Dry/raw soya weight used. For
--    cooked soya curry, log '1 bowl soya chunks curry'."
--
--    "1 bowl soya chunks curry" is unaffected — 'soya chunks curry' (45)
--    is a distinct canonical name and tryExactAny hits it before alias.
-- -----------------------------------------------------------------------------
INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT 'soya chunks', f.id, NULL, NULL, 0.9, 'raw_cooked_fix_20261122'
FROM foods f
WHERE f.canonical_name = 'soya chunks dry'
ON CONFLICT (alias, food_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 8. 'raw dal' aliases → 'dal' (30, cooked).
--
--    Per task spec correction #5: no verified raw dal entity exists — we must
--    NOT silently use cooked macros. These aliases route "100g raw dal" to
--    the cooked dal entity so the resolver fires the CONFLICT path
--    ("You said 'raw' but Dal is a cooked dish. ... requires_confirmation")
--    rather than silently returning cooked macros or hard-failing to
--    unresolved. This is the "require confirmation" option from the spec.
-- -----------------------------------------------------------------------------
INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT v.alias, f.id, NULL, NULL, 0.85, 'raw_cooked_fix_20261122'
FROM (VALUES ('raw dal'), ('uncooked dal'), ('dal raw')) AS v(alias)
CROSS JOIN foods f
WHERE f.canonical_name = 'dal'
ON CONFLICT (alias, food_id) DO NOTHING;

-- =============================================================================
-- POST-DEPLOY VERIFICATION
-- =============================================================================
-- SELECT canonical_name, preparation_state FROM foods
-- WHERE canonical_name IN ('raw chicken breast','raw mutton','raw rohu fish',
--                          'potato','raw rice');
-- -- Expected: raw, raw, raw, boiled, raw
--
-- SELECT a.alias, f.canonical_name, f.preparation_state
-- FROM food_aliases a JOIN foods f ON f.id = a.food_id
-- WHERE a.source = 'raw_cooked_fix_20261122'
-- ORDER BY a.alias;
-- -- Expected: 11 rows (2 raw-rice + 2 raw-chicken + 2 raw-mutton +
-- --          1 bare-soya + 3 raw-dal + ... = 10, verify)

-- =============================================================================
-- ROLLBACK (do not run here)
-- =============================================================================
-- delete from food_aliases where source = 'raw_cooked_fix_20261122';
-- delete from foods where canonical_name = 'raw rice' and source = 'curated';
-- update foods set preparation_state = 'cooked' where canonical_name in ('raw chicken breast','raw mutton');
-- update foods set preparation_state = 'unknown' where canonical_name in ('raw rohu fish','potato');