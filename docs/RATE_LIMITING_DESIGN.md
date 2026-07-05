# Rate Limiting Design & Architecture Summary

## 1. Architecture Summary
The newly implemented rate limiting mechanism safely tracks per-user daily AI requests while ensuring extreme resiliency:
- **Atomic Operations**: By introducing an `increment_api_usage` Postgres RPC function and utilizing a unique compound constraint (`user_id`, `endpoint`, `date`), we guarantee race-condition-free atomic increments using `ON CONFLICT DO UPDATE`.
- **Pre-flight Checks**: Before dispatching expensive AI requests, the function first queries the current usage. If the configured `DAILY_AI_LIMIT` (default 50) is reached, it preemptively rejects with an HTTP 429 response avoiding unnecessary AI invocations.
- **Fail-Safe Observability**: A decoupled try/catch error pattern separates database errors from business logic. A failure to read quota simply logs a warning and allows the request through. A failure to write/increment quota logs an error but returns the successful AI response to the user.
- **Quota Protection**: Quota is only decremented/incremented when the Gemini call is fully successful. Retries, timeouts, or JSON parsing errors bypass the increment RPC, preventing users from paying for our unhandled failures.

## 2. Files Modified
- `supabase/functions/parse-meal/index.ts`: Injected `limit` threshold logic, atomic `rpc("increment_api_usage")` call after AI success, and rich JSON observability logs (AI Request Started, Succeeded, Failed, etc.).
- `supabase/functions/generate-weekly-report/index.ts`: Updated legacy `api_usage` tracking logic to match the new schema structure.
- `supabase/migrations/20260705000001_api_usage_tracking.sql` (NEW): Migrated the `api_usage` table to use a `date` column and `usage_count`. Added unique constraints for atomic locking, and created the `increment_api_usage` stored procedure.

## 3. Database Migration
A new migration (`20260705000001_api_usage_tracking.sql`) was created. It gracefully handles duplicates in the legacy tracking, adds the strict `UNIQUE (user_id, endpoint, date)` constraint to prevent race conditions, and adds the `increment_api_usage` RPC.

## 4. Why Race Conditions Are Avoided
In the previous model (or typical naive implementation), concurrent requests could query the current count, see it as 49, and both dispatch AI requests and insert rows simultaneously resulting in 51 usages being recorded. 
Using `INSERT ... ON CONFLICT (...) DO UPDATE SET usage_count = usage_count + 1`, the Postgres engine applies a row-level lock and atomically increments the integer. 

## 5. Why Users Are Never Charged Quota for Failed AI Requests
The call to `supabase.rpc("increment_api_usage")` is placed **after** `MealSchema.parse(parsed)` correctly passes validation. If Gemini times out, hallucinates bad JSON, or the network fails, the `try/catch` block catches the error and breaks out, entirely skipping the DB increment. 

## 6. Test Plan
- **49th Request**: Should succeed and increment usage_count to 49.
- **50th Request**: Should succeed and increment usage_count to 50.
- **51st Request**: Should fail immediately with HTTP 429 before invoking AI. The UI will catch it and either show a Pro upgrade banner or fall back to DB estimates (depending on client logic).
- **Gemini Timeout**: Hardcode the timeout to 1ms to trigger `AbortError`. The function should catch it, retry, fail, log "AI Request Failed", and return a 200 with deterministic DB fallback data. `usage_count` should NOT increase.
- **Malformed JSON**: Mock Gemini response with invalid JSON string. `JSON.parse` will throw, function will retry, and `usage_count` should NOT increase.
- **Database Offline**: If Supabase DB reads fail, `usageError` is caught, a warning is logged, and the function proceeds, allowing the user to get their meal parsed. If DB writes fail, an error is logged, but the function still returns the AI-parsed data.
- **Concurrent Requests**: Firing 10 simultaneous requests from Postman at `usage_count=45` will result in exactly 5 fulfilling the AI request (reaching 50), and 5 hitting the 429 barrier.
