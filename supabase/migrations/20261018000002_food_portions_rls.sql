-- =============================================================================
-- Phase 6.7 R2.4.1 — food_portions access policy
-- =============================================================================
-- The food_portions table was created in R1's migration without an explicit
-- RLS policy. Supabase projects created after late 2023 enable RLS by default
-- on new tables, so food_portions had RLS on with zero policies — anon and
-- authenticated reads returned [] (not an error), silently breaking
-- resolve-meal-v2's portion lookups.
--
-- This migration:
--   1. Enables RLS explicitly (no-op if already on)
--   2. Adds a permissive SELECT policy for authenticated and anon roles,
--      matching the pattern used by foods and food_aliases
--   3. Ensures grants are in place
--
-- Reversible: drop policy + grant revoke if needed.
-- =============================================================================

alter table food_portions enable row level security;

drop policy if exists "food_portions readable by authenticated" on food_portions;
create policy "food_portions readable by authenticated"
  on food_portions
  for select
  to authenticated
  using (true);

drop policy if exists "food_portions readable by anon" on food_portions;
create policy "food_portions readable by anon"
  on food_portions
  for select
  to anon
  using (true);

grant select on food_portions to authenticated;
grant select on food_portions to anon;
grant select on food_portions to service_role;