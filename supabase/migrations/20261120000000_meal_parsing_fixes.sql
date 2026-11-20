-- =============================================================================
-- 20261120000000_meal_parsing_fixes.sql
--
-- Fixes for meal-parsing accuracy bugs flagged 2026-11-20:
--   1. Egg-white aliases (egg white / white egg / boiled egg white …)
--   2. Soya dry-vs-curry aliases (dry/raw soya chunks → dry; soya curry → curry)
--   3. Potato cooked aliases (cooked potato strips → boiled potato)
--   4. Indian staples (chapati/phulka → roti; chawal → rice)
--   5. Oil tbsp portion correction (tbsp=28 → tbsp=14; 1 tbsp oil = 14g)
--
-- PRE-CHECK (run manually BEFORE applying this migration):
--
--   SELECT a.alias, a.food_id, f.canonical_name
--   FROM food_aliases a JOIN foods f ON f.id = a.food_id
--   WHERE a.alias IN (
--     'egg white','egg whites','white egg','white eggs','boiled egg white',
--     'raw soya chunks','dry soya chunks','soya chunks raw','soya chunks dry',
--     'cooked potato','boiled potato','potato strips','chapati','phulka','roti'
--   );
--
--   SELECT id, canonical_name FROM foods
--   WHERE canonical_name ILIKE '%egg%white%'
--      OR canonical_name ILIKE '%soya%'
--      OR canonical_name ILIKE '%potato%';
--
-- If any row shows a WRONG canonical (e.g. 'egg white' → 'rice'), delete it
-- BEFORE running this migration:
--
--   DELETE FROM food_aliases WHERE alias = 'egg white' AND food_id = <wrong_id>;
--
-- If canonical names differ from the IN (...) lists below, adjust them.
-- Any list that matches no food row is a silent no-op (safe).
--
-- Deploy order: this migration → deploy resolve-meal-v2 → smoke test.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Egg-white aliases → egg white boiled
-- ---------------------------------------------------------------------------
INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT v.alias, f.id, NULL, NULL, 0.95, 'meal_parsing_fix_20261120'
FROM (VALUES
  ('egg white'), ('egg whites'),
  ('white egg'), ('white eggs'),
  ('boiled egg white'), ('boiled egg whites'), ('boiled white eggs'),
  ('egg white boiled'), ('egg whites boiled'),
  ('cooked egg white'), ('egg white cooked')
) AS v(alias)
CROSS JOIN foods f
WHERE f.canonical_name IN ('egg white boiled', 'boiled egg white', 'egg white cooked', 'egg white')
ON CONFLICT (alias, food_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Soya dry-vs-curry aliases
-- ---------------------------------------------------------------------------
INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT v.alias, f.id, NULL, NULL, 0.95, 'meal_parsing_fix_20261120'
FROM (VALUES
  ('dry soya chunks'), ('dry soya chunk'),
  ('soya chunks dry'), ('soya chunk dry'),
  ('raw soya chunks'), ('raw soya chunk'),
  ('soya chunks raw'), ('soya chunk raw'),
  ('soya chunks uncooked'), ('uncooked soya chunks')
) AS v(alias)
CROSS JOIN foods f
WHERE f.canonical_name IN ('soya chunks dry', 'dry soya chunks', 'raw soya chunks', 'soya chunks raw')
ON CONFLICT (alias, food_id) DO NOTHING;

INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT v.alias, f.id, NULL, NULL, 0.95, 'meal_parsing_fix_20261120'
FROM (VALUES
  ('soya curry'), ('soya chunk curry'), ('soya bean curry'),
  ('soya chunks masala'), ('soya masala')
) AS v(alias)
CROSS JOIN foods f
WHERE f.canonical_name IN ('soya chunks curry', 'soya curry', 'soya chunk curry')
ON CONFLICT (alias, food_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Potato cooked aliases → potato boiled (or equivalent)
-- ---------------------------------------------------------------------------
INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT v.alias, f.id, NULL, NULL, 0.9, 'meal_parsing_fix_20261120'
FROM (VALUES
  ('potato strips'), ('potato strips cooked'), ('cooked potato strips'),
  ('boiled potato strips'), ('potato boiled'), ('boiled potato'), ('cooked potato')
) AS v(alias)
CROSS JOIN foods f
WHERE f.canonical_name IN ('potato boiled', 'boiled potato', 'potato cooked', 'cooked potato')
ON CONFLICT (alias, food_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Indian staples
-- ---------------------------------------------------------------------------
-- Canonical in existing KB is 'roti' (see foodResolverV2.test.ts, food_id=5).
INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT v.alias, f.id, NULL, NULL, 0.95, 'meal_parsing_fix_20261120'
FROM (VALUES ('chapati'), ('chapatti'), ('chapathi'), ('phulka'), ('rotis'))
AS v(alias)
CROSS JOIN foods f
WHERE f.canonical_name = 'roti'
ON CONFLICT (alias, food_id) DO NOTHING;

INSERT INTO food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
SELECT v.alias, f.id, NULL, NULL, 0.95, 'meal_parsing_fix_20261120'
FROM (VALUES
  ('chawal'), ('cooked rice'), ('boiled rice'), ('steamed rice'), ('plain rice')
) AS v(alias)
CROSS JOIN foods f
WHERE f.canonical_name = 'rice'
ON CONFLICT (alias, food_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Oil tbsp portion correction
--    Bugs caused by a food_portions row for oil seeded at 28g/tbsp, making
--    "1 tbsp oil" land at ~248 kcal instead of ~124 kcal. R2.7 migration
--    only ADDED tsp=5 for oil and PRESERVED existing tbsp=28 via
--    ON CONFLICT DO NOTHING. This corrects it.
-- ---------------------------------------------------------------------------
INSERT INTO food_portions (food_id, unit, grams, is_default, source)
SELECT f.id, v.unit, v.grams, false, 'meal_parsing_fix_20261120'
FROM foods f
JOIN (VALUES
  ('oil'::text,    'tbsp'::text, 14::numeric),
  ('ghee'::text,   'tbsp'::text, 14::numeric),
  ('butter'::text, 'tbsp'::text, 14::numeric),
  ('oil'::text,    'tsp'::text,   5::numeric)
) AS v(canonical_name, unit, grams) ON f.canonical_name = v.canonical_name
ON CONFLICT (food_id, unit) DO UPDATE
  SET grams = EXCLUDED.grams, source = EXCLUDED.source
  WHERE food_portions.grams != EXCLUDED.grams;

-- ---------------------------------------------------------------------------
-- 6. Sanity check (run after deploy):
--
--   SELECT f.canonical_name, p.unit, p.grams
--   FROM food_portions p JOIN foods f ON f.id = p.food_id
--   WHERE p.unit = 'tbsp' AND LOWER(COALESCE(f.category, '')) = 'oil';
--   -- Expected: grams = 14 for every row.
-- ---------------------------------------------------------------------------

-- =============================================================================
-- ROLLBACK (do not run here)
-- =============================================================================
-- delete from food_aliases  where source = 'meal_parsing_fix_20261120';
-- delete from food_portions where source = 'meal_parsing_fix_20261120';
-- (Then re-seed oil.tbsp at its previous value if the previous value was
--  actually correct — but 28g is never correct for 1 tbsp of oil.)
-- =============================================================================