# 1. Endpoints that exist
ls supabase/functions/

# 2. Does the v2 fast path exist?
ls supabase/functions/resolve-meal-v2/ 2>/dev/null && echo "v2 EXISTS" || echo "v2 ABSENT"
ls supabase/functions/_shared/foodResolverV2.ts 2>/dev/null && echo "resolverV2 EXISTS" || echo "resolverV2 ABSENT"
ls supabase/functions/_shared/prepStrip.ts 2>/dev/null && echo "prepStrip EXISTS" || echo "prepStrip ABSENT"

# 3. Does the compile-time flag exist in the frontend?
grep -rn "VITE_RESOLVE_V2_ENABLED" src/ 2>/dev/null || echo "FLAG ABSENT"

# 4. Does the KB have "raw chicken breast"?
grep -n "raw chicken breast" supabase/functions/parse-meal/index.ts || echo "KB MISSING"

# 5. Does meal_logs use INTEGER or NUMERIC?
grep -rn "calories INTEGER\|calories NUMERIC" supabase/migrations/ | head -5

# 6. Does mealService.addMeal round macros?
grep -n "Math.round" src/features/nutrition/services/mealService.ts

# 7. Does the eval harness exist?
ls scripts/spike/run-v1.ts scripts/spike/eval-set-v2.ts 2>/dev/null && echo "EVAL EXISTS" || echo "EVAL ABSENT"