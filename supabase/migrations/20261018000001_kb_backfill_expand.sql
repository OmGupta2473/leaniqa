-- =============================================================================
-- Phase 6.7 R1.1 — Broaden KB backfill to all categorized foods
-- =============================================================================
-- R1's backfill filtered on the 11 canonical category slugs. Staging stores
-- Indian foods under alternate slugs (bread, vegetable, nonveg, dairy,
-- beverage), so 7 of 11 categories received zero portion rows.
--
-- Every categorized food in staging already has default_portion_grams set,
-- so the fix is to broaden the WHERE clause to "any non-null category".
-- Null-category foods (7928 American imports) stay excluded — "has a
-- category" is the KB membership boundary.
--
-- Per product decision: this migration also populates portions for
-- fruit, nuts, sweet, snack, and legume categories. They are useful for
-- future KB expansion and require no additional code to support.
--
-- Non-destructive. Additive. Reversible. Portion rows use
-- conflict-do-nothing so existing R1 rows are never overwritten.
-- Rollback SQL is at the bottom of this file.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Broaden preparation_state backfill
-- -----------------------------------------------------------------------------
-- Applies only to rows that R1 did not already mark. The 40 rows R1 set
-- to 'cooked' (dal, rice, paneer, egg) are untouched by the
-- preparation_state = 'unknown' guard.

update foods
  set preparation_state = 'cooked'
where category is not null
  and preparation_state = 'unknown';

-- -----------------------------------------------------------------------------
-- 2. Broaden portion backfill from existing default_portion_grams
-- -----------------------------------------------------------------------------
-- Unit extraction is identical to R1's backfill: case-insensitive match
-- on canonical unit names in default_portion_label. Unrecognized labels
-- produce NULL unit and are filtered out by the surrounding on-conflict,
-- so no malformed rows are inserted.
--
-- source = 'backfill_expand_v2' identifies rows added by this migration,
-- so rollback can target them without touching R1's rows
-- (source = 'backfill_from_default') or R1's standard backfill
-- (source = 'standard_backfill').

insert into food_portions (food_id, unit, grams, is_default, source)
select
  f.id,
  case
    when f.default_portion_label ilike '%bowl%'      then 'bowl'
    when f.default_portion_label ilike '%katori%'    then 'katori'
    when f.default_portion_label ilike '%plate%'     then 'plate'
    when f.default_portion_label ilike '%piece%'     then 'piece'
    when f.default_portion_label ilike '%pcs%'       then 'piece'
    when f.default_portion_label ilike '%glass%'     then 'glass'
    when f.default_portion_label ilike '%cup%'       then 'cup'
    when f.default_portion_label ilike '%tsp%'       then 'tsp'
    when f.default_portion_label ilike '%teaspoon%'  then 'tsp'
    when f.default_portion_label ilike '%tbsp%'      then 'tbsp'
    when f.default_portion_label ilike '%slice%'     then 'slice'
    when f.default_portion_label ilike '%scoop%'     then 'scoop'
    else null
  end,
  f.default_portion_grams,
  true,
  'backfill_expand_v2'
from foods f
where f.default_portion_grams is not null
  and f.default_portion_label is not null
  and f.default_portion_grams > 0
  and f.category is not null
  and case
        when f.default_portion_label ilike '%bowl%'      then 'bowl'
        when f.default_portion_label ilike '%katori%'    then 'katori'
        when f.default_portion_label ilike '%plate%'     then 'plate'
        when f.default_portion_label ilike '%piece%'     then 'piece'
        when f.default_portion_label ilike '%pcs%'       then 'piece'
        when f.default_portion_label ilike '%glass%'     then 'glass'
        when f.default_portion_label ilike '%cup%'       then 'cup'
        when f.default_portion_label ilike '%tsp%'       then 'tsp'
        when f.default_portion_label ilike '%teaspoon%'  then 'tsp'
        when f.default_portion_label ilike '%tbsp%'      then 'tbsp'
        when f.default_portion_label ilike '%slice%'     then 'slice'
        when f.default_portion_label ilike '%scoop%'     then 'scoop'
        else null
      end is not null
on conflict (food_id, unit) do nothing;

-- =============================================================================
-- ROLLBACK (do not run here; kept for reference)
-- =============================================================================
-- Safe because source='backfill_expand_v2' uniquely identifies rows added
-- by this migration. R1's rows (source='backfill_from_default' and
-- 'standard_backfill') are untouched.
--
-- delete from food_portions where source = 'backfill_expand_v2';
-- update foods set preparation_state = 'unknown'
--   where category not in ('dal','rice','paneer','egg','oil');
-- =============================================================================