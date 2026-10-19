-- Production-safe R2.7: name-based instead of hardcoded IDs
-- (production food IDs differ from staging)

insert into food_portions (food_id, unit, grams, is_default, source)
select f.id, 'katori', 100, false, 'r2_7_katori'
from foods f
where f.category in ('egg', 'vegetable', 'dairy', 'legume', 'paneer', 'nonveg')
on conflict (food_id, unit) do nothing;

insert into food_portions (food_id, unit, grams, is_default, source)
select (select id from foods where source_id = 'curated:ghee'), 'tbsp', 14, false, 'r2_7_oil_units'
where exists (select 1 from foods where source_id = 'curated:ghee')
union all
select (select id from foods where source_id = 'curated:butter'), 'tbsp', 14, false, 'r2_7_oil_units'
where exists (select 1 from foods where source_id = 'curated:butter')
union all
select (select id from foods where source_id = 'curated:oil'), 'tsp', 5, false, 'r2_7_oil_units'
where exists (select 1 from foods where source_id = 'curated:oil')
on conflict (food_id, unit) do nothing;