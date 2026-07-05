# RLS Security Audit Report

## 1. Schema Overview

The database contains the following tables:
- `profiles`
- `goals`
- `meal_logs`
- `weight_logs`
- `daily_metrics`
- `weekly_reports`
- `water_logs`
- `api_usage`
- `subscriptions`

All tables currently have RLS enabled. Most tables use a broad `FOR ALL` policy granting the owner (`user_id`, or `id` for `profiles`) full access.

## 2. Table-by-Table Analysis

### `profiles`
- **Ownership Column:** `id`
- **RLS Status:** Enabled
- **Current Policy:** `"Users can manage their own profile"` (`FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`)
- **Operations Protected:** SELECT, INSERT, UPDATE, DELETE
- **Assessment:** ✅ **Secure.** Users should be able to fully manage their own profiles.

### `goals`
- **Ownership Column:** `user_id`
- **RLS Status:** Enabled
- **Current Policy:** `"Users can manage their own goals"` (`FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`)
- **Assessment:** ✅ **Secure.** Users can manage their own goals.

### `meal_logs`
- **Ownership Column:** `user_id`
- **RLS Status:** Enabled
- **Current Policy:** `"Users can manage their own meal_logs"`
- **Assessment:** ✅ **Secure.** Users can manage their own meal logs.

### `weight_logs`
- **Ownership Column:** `user_id`
- **RLS Status:** Enabled
- **Current Policy:** `"Users can manage their own weight_logs"`
- **Assessment:** ✅ **Secure.** Users can manage their own weight logs.

### `daily_metrics`
- **Ownership Column:** `user_id`
- **RLS Status:** Enabled
- **Current Policy:** `"Users can manage their own daily_metrics"`
- **Assessment:** ✅ **Secure.** Users can manage their own daily metrics.

### `weekly_reports`
- **Ownership Column:** `user_id`
- **RLS Status:** Enabled
- **Current Policy:** `"Users can manage their own weekly_reports"`
- **Assessment:** ✅ **Secure.** Users can manage their own weekly reports.

### `water_logs`
- **Ownership Column:** `user_id`
- **RLS Status:** Enabled
- **Current Policy:** `"Users can manage their own water_logs"` AND `"user_own_water"`
- **Assessment:** ⚠ **Needs modification.** Duplicate policies exist. They should be deduplicated to avoid confusion and minor performance overhead. The permissions themselves are secure.

### `api_usage`
- **Ownership Column:** `user_id`
- **RLS Status:** Enabled
- **Current Policy:** `"Users can manage their own api_usage"` (`FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`)
- **Assessment:** ❌ **Critical vulnerability.** Users can DELETE or UPDATE their own API usage logs. If this table is used to enforce API rate limits (e.g., daily AI limits), users can simply delete their logs to bypass the limit.
- **Recommendation:** Change to `SELECT` and `INSERT` only, or restrict entirely if only managed by Edge Functions.

### `subscriptions`
- **Ownership Column:** `user_id`
- **RLS Status:** Enabled
- **Current Policy:** `"Users can manage their own subscriptions"` (`FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`)
- **Assessment:** ❌ **Critical vulnerability.** Users have `UPDATE` privileges on their own subscriptions. This allows any user to execute `UPDATE subscriptions SET plan = 'pro', status = 'active'` and grant themselves premium access for free.
- **Recommendation:** Restrict to `SELECT` only for authenticated users. Insertions and updates should be handled exclusively by trusted server environments (e.g., Edge Functions via Stripe webhooks using Service Role keys, or the `get_or_create_subscription` RPC which operates as `SECURITY DEFINER`).

## 3. Summary of Findings

- **Secure Tables:** 6 (`profiles`, `goals`, `meal_logs`, `weight_logs`, `daily_metrics`, `weekly_reports`)
- **Tables Needing Modification:** 1 (`water_logs` has duplicate policies)
- **Critically Vulnerable Tables:** 2 (`subscriptions`, `api_usage` grant excessive write permissions allowing privilege escalation and rate limit bypassing).

## 4. Remediation Plan
Generate a single migration that:
1. Drops the overly permissive `FOR ALL` policies on `subscriptions` and `api_usage`.
2. Recreates them with secure permissions (e.g., `SELECT` only for subscriptions, `SELECT` + `INSERT` for api_usage).
3. Deduplicates the `water_logs` policy.

## 5. Security Summary & Remaining Risks

### Security Summary
The newly generated migration (`20260705000000_secure_rls.sql`) resolves the critical vulnerabilities in `subscriptions` and `api_usage`.
- Users can no longer arbitrarily upgrade themselves to "pro".
- Users can no longer delete their `api_usage` logs to bypass daily AI limits.
- Duplicate policies on `water_logs` have been deduplicated.

### Remaining Risks
- **Edge Function Security:** Edge functions must correctly validate user input and not trust client-provided payloads blindly.
- **Service Role Key:** Any scripts or webhooks that need to update `subscriptions` (e.g. Stripe webhooks) must use the `service_role` key to bypass RLS, as the authenticated user is no longer allowed to `UPDATE` the table.

## 6. Test Plan

1. **Verify Subscription Protection:**
   - Attempt to execute: `await supabase.from('subscriptions').update({ plan: 'pro' }).eq('user_id', user.id)`
   - Expected Result: Request should fail or silently return 0 rows updated (depending on Supabase SDK version, usually silent failure for RLS denials unless returning is used).
   - Attempt to execute: `await supabase.from('subscriptions').select('*')`
   - Expected Result: Should successfully return the user's subscription row.

2. **Verify API Usage Protection:**
   - Attempt to execute: `await supabase.from('api_usage').delete().eq('user_id', user.id)`
   - Expected Result: Should fail or silently return 0 rows deleted.
   - Attempt to insert: `await supabase.from('api_usage').insert({ endpoint: 'parse-meal' })`
   - Expected Result: Should succeed.

3. **Verify Water Logs Deduplication:**
   - Add a water log via the application UI.
   - Expected Result: Should succeed without any duplicate policy warnings in the Postgres logs.

## 7. SQL Verification Queries

Run these queries in the Supabase SQL Editor as a superuser to verify the applied policies:

```sql
-- Check subscriptions policies
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'subscriptions';

-- Check api_usage policies
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'api_usage';

-- Check water_logs policies
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'water_logs';
```

## 8. Rollback Strategy

If this migration causes unexpected application behavior (e.g., if the application was incorrectly relying on client-side updates to `subscriptions` rather than edge functions/RPCs), run the following SQL to revert:

```sql
-- Revert subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can manage their own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Revert api_usage
DROP POLICY IF EXISTS "Users can view their own api_usage" ON public.api_usage;
DROP POLICY IF EXISTS "Users can insert their own api_usage" ON public.api_usage;
CREATE POLICY "Users can manage their own api_usage" ON public.api_usage FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```
