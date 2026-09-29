-- Scope the meal_parse_cache write policy to service_role.
-- The previous policy omitted a TO clause, so it applied to PUBLIC and allowed any
-- authenticated user to write cache entries that other users would later read.
-- service_role bypasses RLS by design, but the explicit policy keeps the intent clear
-- and blocks non-service-role writers.

DROP POLICY IF EXISTS "Service role full access for meal cache" ON public.meal_parse_cache;

CREATE POLICY "Service role full access for meal cache"
ON public.meal_parse_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Tighten the read policy from PUBLIC to authenticated. Cache rows contain food
-- names and macros, not user data, so authenticated-only is appropriate.
DROP POLICY IF EXISTS "Public read access for meal cache" ON public.meal_parse_cache;

CREATE POLICY "Authenticated read access for meal cache"
ON public.meal_parse_cache
FOR SELECT
TO authenticated
USING (true);