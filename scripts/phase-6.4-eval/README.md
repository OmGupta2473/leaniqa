# Phase 6.4 Eval Harness

Runs the 34-meal Phase 6.0 eval set through the Phase 6.4 `resolve()` function
against the staging database. No AI, no edge functions, no credits.

## What it tests

- The resolver's exact, alias, ambiguity, and oil overlays against the real
  staging `foods`, `food_aliases`, `food_ambiguous_terms`, and
  `food_ambiguous_candidates` tables.
- Whether each definite meal resolves to the right canonical food.
- Whether each ambiguous meal is correctly flagged for confirmation.

## What it does NOT test

- The AI fallback path (`USE_HYBRID_RESOLVER` stays off).
- `user_meal_memory` reads or writes (both disabled in the harness config).
- `popular_meal_cache` (only read; eval user is throwaway so it won't hit).

## One-time setup

1. Create a throwaway user in staging:
   - Dashboard → Authentication → Users → Add user
   - Email: anything (e.g. `eval@leaniqa.local`)
   - Password: anything (never used; the harness never signs in)
   - Enable "Auto Confirm User"

2. Copy the user's UUID from the Users list.

3. Add to `.env.local`: