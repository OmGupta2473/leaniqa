-- =============================================================================
-- Phase 6.7 R1 — Indian Food KB schema
-- =============================================================================
-- Adds three things:
--   1. Cooking-state metadata on foods (preparation_state, raw_cooked_pair_id)
--   2. A dedicated food_portions table (replaces portion data that currently
--      lives loosely on food_aliases)
--   3. A food_categories reference table (12 canonical Indian-food categories)
--
-- Reversible. Rollback SQL is at the bottom of this file in a comment block,
-- and in docs/PHASE_6.7_R1_ROLLBACK.md (to be added when the phase is closed).
--
-- No data loss. All new columns default to safe values. Backfill only sets
-- values that are already derivable from existing data.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. foods: preparation_state + raw_cooked_pair_id
-- -----------------------------------------------------------------------------

alter table foods
  add column if not exists preparation_state text
    check (preparation_state in (
      'raw', 'cooked', 'boiled', 'steamed', 'fried', 'roasted', 'unknown'
    ))
    default 'unknown';

alter table foods
  add column if not exists raw_cooked_pair_id integer
    references foods(id) on delete set null;

create index if not exists idx_foods_preparation_state
  on foods(preparation_state);

create index if not exists idx_foods_category
  on foods(category);

-- Backfill: the 11 core Indian-food categories are cooked by default.
-- Raw-state rows will be added in a follow-up data task where relevant
-- (e.g. "raw paneer" vs "paneer (cooked)").
update foods
  set preparation_state = 'cooked'
where category in (
  'dal', 'rice', 'roti', 'sabzi', 'curry',
  'paneer', 'chicken', 'egg', 'curd', 'milk', 'tea'
)
and preparation_state = 'unknown';

-- -----------------------------------------------------------------------------
-- 2. food_portions — per-food portion mappings
-- -----------------------------------------------------------------------------
-- grams is the weight of ONE unit (e.g. 1 bowl = 150g, 1 piece = 40g).
-- is_default marks the row that the resolver should use when the user
-- does not name a unit. Multiple rows per food are expected and correct.

create table if not exists food_portions (
  id          bigserial primary key,
  food_id     integer not null references foods(id) on delete cascade,
  unit        text    not null,
  grams       numeric(7,2) not null check (grams > 0),
  confidence  numeric(3,2) not null default 1.0
                check (confidence >= 0 and confidence <= 1),
  is_default  boolean not null default false,
  source      text,
  created_at  timestamptz not null default now(),
  unique (food_id, unit)
);

create index if not exists idx_food_portions_food_id
  on food_portions(food_id);

create index if not exists idx_food_portions_unit
  on food_portions(unit);

-- -----------------------------------------------------------------------------
-- 3. food_categories — 12 canonical Indian-food categories
-- -----------------------------------------------------------------------------

create table if not exists food_categories (
  slug         text primary key,
  display_name text not null,
  sort_order   integer not null default 100
);

insert into food_categories (slug, display_name, sort_order) values
  ('dal',     'Dal / Lentils',        10),
  ('rice',    'Rice',                 20),
  ('roti',    'Roti / Bread',         30),
  ('sabzi',   'Sabzi / Vegetable',    40),
  ('curry',   'Curry / Gravy',        50),
  ('paneer',  'Paneer',               60),
  ('chicken', 'Chicken',              70),
  ('egg',     'Egg',                  80),
  ('curd',    'Curd / Yogurt',        90),
  ('milk',    'Milk',                100),
  ('tea',     'Tea / Chai',          110),
  ('oil',     'Oil / Ghee',          200)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- 4. Backfill food_portions from existing default_portion_grams/label
-- -----------------------------------------------------------------------------
-- For each food in the 11 core categories that already has both a
-- default_portion_grams and a default_portion_label, extract the unit from
-- the label and insert a portion row. Guards against non-positive grams.
-- Scoped to the 11 core categories per R1 requirement; other categories
-- will be handled in a follow-up data task.
--
-- Label extraction: case-insensitive substring match on canonical unit names,
-- so "1 bowl", "1 Bowl", "1 katori", "2 pieces" all resolve correctly.

insert into food_portions (food_id, unit, grams, is_default, source)
select
  f.id,
  case
    when f.default_portion_label ilike '%bowl%'    then 'bowl'
    when f.default_portion_label ilike '%katori%'  then 'katori'
    when f.default_portion_label ilike '%plate%'   then 'plate'
    when f.default_portion_label ilike '%piece%'   then 'piece'
    when f.default_portion_label ilike '%pcs%'     then 'piece'
    when f.default_portion_label ilike '%glass%'   then 'glass'
    when f.default_portion_label ilike '%cup%'     then 'cup'
    when f.default_portion_label ilike '%tsp%'     then 'tsp'
    when f.default_portion_label ilike '%teaspoon%' then 'tsp'
    when f.default_portion_label ilike '%tbsp%'    then 'tbsp'
    when f.default_portion_label ilike '%tablespoon%' then 'tbsp'
    when f.default_portion_label ilike '%slice%'   then 'slice'
    when f.default_portion_label ilike '%scoop%'   then 'scoop'
    else null
  end,
  f.default_portion_grams,
  true,
  'backfill_from_default'
from foods f
where f.default_portion_grams is not null
  and f.default_portion_label is not null
  and f.default_portion_grams > 0
  and f.category in (
    'dal', 'rice', 'roti', 'sabzi', 'curry',
    'paneer', 'chicken', 'egg', 'curd', 'milk', 'tea'
  )
on conflict (food_id, unit) do nothing;

-- -----------------------------------------------------------------------------
-- 5. Standard portion rows for the 11 core categories
-- -----------------------------------------------------------------------------
-- on-conflict-do-nothing means these NEVER override a value the backfill
-- (or a later manual curation) already set. They only fill gaps.
--
-- Weights chosen from common Indian household measures:
--   1 bowl    ~150g
--   1 katori  ~100g
--   1 roti    ~40g
--   1 egg     ~50g
--   1 paneer cube ~30g
--   1 glass   ~240ml
--   1 tea cup ~150ml
--   1 milk cup ~240ml
--   1 chicken piece ~100g (variable; conservative estimate)

-- Bowl (150g): dal, rice, sabzi, curry, paneer
insert into food_portions (food_id, unit, grams, is_default, source)
select f.id, 'bowl', 150, false, 'standard_backfill'
from foods f
where f.category in ('dal', 'rice', 'sabzi', 'curry', 'paneer')
on conflict (food_id, unit) do nothing;

-- Katori (100g): dal, rice, sabzi, curry, curd
insert into food_portions (food_id, unit, grams, is_default, source)
select f.id, 'katori', 100, false, 'standard_backfill'
from foods f
where f.category in ('dal', 'rice', 'sabzi', 'curry', 'curd')
on conflict (food_id, unit) do nothing;

-- Roti: piece = 40g
insert into food_portions (food_id, unit, grams, is_default, source)
select f.id, 'piece', 40, false, 'standard_backfill'
from foods f
where f.category = 'roti'
on conflict (food_id, unit) do nothing;

-- Egg: piece = 50g
insert into food_portions (food_id, unit, grams, is_default, source)
select f.id, 'piece', 50, false, 'standard_backfill'
from foods f
where f.category = 'egg'
on conflict (food_id, unit) do nothing;

-- Paneer: piece = 30g
insert into food_portions (food_id, unit, grams, is_default, source)
select f.id, 'piece', 30, false, 'standard_backfill'
from foods f
where f.category = 'paneer'
on conflict (food_id, unit) do nothing;

-- Chicken: piece = 100g
insert into food_portions (food_id, unit, grams, is_default, source)
select f.id, 'piece', 100, false, 'standard_backfill'
from foods f
where f.category = 'chicken'
on conflict (food_id, unit) do nothing;

-- Glass (240ml): milk, tea
insert into food_portions (food_id, unit, grams, is_default, source)
select f.id, 'glass', 240, false, 'standard_backfill'
from foods f
where f.category in ('milk', 'tea')
on conflict (food_id, unit) do nothing;

-- Cup (240ml): milk
insert into food_portions (food_id, unit, grams, is_default, source)
select f.id, 'cup', 240, false, 'standard_backfill'
from foods f
where f.category = 'milk'
on conflict (food_id, unit) do nothing;

-- Cup (150ml): tea
insert into food_portions (food_id, unit, grams, is_default, source)
select f.id, 'cup', 150, false, 'standard_backfill'
from foods f
where f.category = 'tea'
on conflict (food_id, unit) do nothing;

-- =============================================================================
-- ROLLBACK (do not run here; kept for reference)
-- =============================================================================
-- drop table if exists food_categories;
-- drop table if exists food_portions;
-- drop index if exists idx_foods_preparation_state;
-- drop index if exists idx_foods_category; -- only if it did not pre-exist
-- alter table foods drop column if exists raw_cooked_pair_id;
-- alter table foods drop column if exists preparation_state;
-- Note: backfill of preparation_state='cooked' is undone by the column drop.
-- =============================================================================