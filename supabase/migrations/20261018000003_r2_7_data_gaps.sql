-- =============================================================================
-- Phase 6.7 R2.7 — Data gap fixes identified by the v2 baseline
-- =============================================================================
-- The v2 baseline run against resolve-meal-v2 surfaced 6 failures, all
-- attributable to missing data in food_portions or food_aliases. None of
-- them are resolver bugs — v2 correctly returns unresolved rather than
-- guessing when the portion table cannot answer the query. This migration
-- fills the gaps.
--
-- All inserts are additive. Existing rows are preserved via
-- ON CONFLICT DO NOTHING — nothing is overwritten, and curated data (if
-- added later with source='curated') will not be affected by reruns.
--
-- Rollback: delete rows WHERE source IN the three r2_7_* markers below.
--
-- =============================================================================
-- 7a — katori=100 for categories that lacked a katori portion row
-- =============================================================================
-- Fixes:
--   m12  "1 katori rajma chawal"  (legume)
--   m29  "1 katori egg bhurji"    (egg)
--   s02  "2 katori mixed veg"     (vegetable)
--   cm01 "2 katori curd"          (dairy)
--
-- Also covers paneer and nonveg for consistency (same "served in katori"
-- pattern applies to curries and sides). See semantic note at bottom.
--
-- No existing katori rows in these categories, so ON CONFLICT is
-- defensive only — expected to insert for every food in these six
-- categories.

insert into food_portions (food_id, unit, grams, is_default, source)
select f.id, 'katori', 100, false, 'r2_7_katori'
from foods f
where f.category in ('egg', 'vegetable', 'dairy', 'legume', 'paneer', 'nonveg')
on conflict (food_id, unit) do nothing;

-- =============================================================================
-- 7b — Oil category unit completion
-- =============================================================================
-- Fixes:
--   n02 "1 tbsp ghee"  (ghee had tsp only)
--
-- Also defensively covers:
--   "1 tsp oil"  (oil had tbsp only)
--
-- All three oil foods get both tsp=5 and tbsp=14. Existing rows preserved.

insert into food_portions (food_id, unit, grams, is_default, source)
select f.id, v.unit, v.grams, false, 'r2_7_oil_units'
from foods f
join (values
  ('ghee'::text,   'tbsp'::text, 14::numeric),
  ('butter'::text, 'tbsp'::text, 14::numeric),
  ('oil'::text,    'tsp'::text,   5::numeric)
) as v(canonical_name, unit, grams) on f.canonical_name = v.canonical_name
on conflict (food_id, unit) do nothing;

-- =============================================================================
-- 7c — masala chai aliases to chai (132)
-- =============================================================================
-- Fixes:
--   t02 "masala chai"  (no exact/alias match — fuzzy matched masala dosa)
--
-- Three common wordings, all resolving to chai (132). Portion data mirrors
-- chai's own default_portion_* values (150g per cup) so that even if
-- food_portions lookup fails for any reason, the alias portion provides a
-- fallback.

insert into food_aliases (alias, food_id, portion_grams, portion_unit, confidence, source)
select v.alias, f.id, 150, 'cup', 1.0, 'r2_7_alias'
from foods f
cross join (values
  ('masala chai'::text),
  ('chai masala'::text),
  ('masala tea'::text)
) as v(alias)
where f.canonical_name = 'chai'
on conflict (alias, food_id) do nothing;

-- =============================================================================
-- ROLLBACK (do not run here; kept for reference)
-- =============================================================================
-- delete from food_portions where source = 'r2_7_katori';
-- delete from food_portions where source = 'r2_7_oil_units';
-- delete from food_aliases  where source = 'r2_7_alias';
--
-- Semantic note (7a): "katori" is a reasonable measure for curries, sides,
-- and legumes but not for pieces like chicken breast (100g) or eggs (50g).
-- This migration adds katori=100 uniformly to all foods in the six
-- categories, which is a deliberate simplification. The resolver only
-- uses katori when the user explicitly types it; a food that isn't
-- katori-shaped is unlikely to be typed that way. If specific foods need
-- a curated katori weight, they override with source='curated', which
-- this migration will not disturb on rerun.
-- =============================================================================