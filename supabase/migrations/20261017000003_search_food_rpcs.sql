-- ============================================================================
-- Phase 6.4 support — fuzzy search RPCs for the food resolver
-- ============================================================================
-- These functions back SupabaseResolverDb.fuzzySearchAliases() and
-- fuzzySearchFoods() in supabase/functions/_shared/foodResolver.ts.
--
-- Definitions captured from the live staging database on 2026-10-16
-- (via pg_get_functiondef). No changes to the query logic, signatures, or
-- return types. The only addition is an explicit REVOKE from PUBLIC and
-- a GRANT to authenticated + service_role, which is the correct least-
-- privilege state and is safe to apply over the existing staging grants.
--
-- Idempotent: uses CREATE OR REPLACE FUNCTION. Safe to re-apply.
--
-- Depends on:
--   - pg_trgm extension (enabled by 20261017000000_phase_6_food_matching.sql)
--     Resolved via the caller's search_path. Do NOT add SET search_path here:
--     on Supabase, pg_trgm lives in the `extensions` schema, not `public`.
--
-- The `<%` operator is pg_trgm's "similarity to any word in second argument".
-- It is what allows the GIN trgm index to be used; the numeric threshold
-- check on top of it narrows the result set.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.search_food_aliases(
  p_term text,
  p_min_sim numeric DEFAULT 0.3,
  p_limit integer DEFAULT 5
)
RETURNS TABLE(
  alias text,
  food_id bigint,
  portion_grams numeric,
  portion_unit text,
  confidence numeric,
  similarity numeric
)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    fa.alias,
    fa.food_id,
    fa.portion_grams,
    fa.portion_unit,
    fa.confidence,
    word_similarity(p_term, fa.alias)::numeric AS similarity
  FROM public.food_aliases fa
  WHERE p_term <% fa.alias
    AND word_similarity(p_term, fa.alias) >= p_min_sim
  ORDER BY similarity DESC
  LIMIT p_limit;
$function$;

CREATE OR REPLACE FUNCTION public.search_foods(
  p_term text,
  p_min_sim numeric DEFAULT 0.3,
  p_limit integer DEFAULT 5
)
RETURNS TABLE(
  food_id bigint,
  similarity numeric
)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    f.id AS food_id,
    word_similarity(p_term, f.search_name)::numeric AS similarity
  FROM public.foods f
  WHERE p_term <% f.search_name
    AND word_similarity(p_term, f.search_name) >= p_min_sim
  ORDER BY similarity DESC, f.source_rank ASC
  LIMIT p_limit;
$function$;

-- Least-privilege grants. Both functions are SECURITY INVOKER, read-only,
-- and take a user-controlled term; no anonymous execution.
REVOKE EXECUTE ON FUNCTION public.search_food_aliases(text, numeric, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_foods(text, numeric, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.search_food_aliases(text, numeric, integer)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_foods(text, numeric, integer)
  TO authenticated, service_role;