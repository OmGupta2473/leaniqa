# Production Verification Checklist: RLS Security Update

This checklist must be completed before, during, and after applying the RLS remediation migration (`20260705000000_secure_rls.sql`) to the production database.

## 1. Backup Strategy
Before applying any migration to production, ensure you have a fresh backup:
- **Action:** Trigger a manual backup via the Supabase Dashboard.
  - Navigate to: **Database -> Backups**
  - Click **Backup now** (if using Point-in-Time Recovery or Pro plan).
- **Fallback:** If manual backups are unavailable, export the schema and data using the Supabase CLI:
  `supabase db dump -f supabase/backups/prod_backup_pre_rls.sql --data-only`

## 2. Migration Execution
Run the migration securely against the production database:
- **Command:** 
  `supabase db push` 
  *(Ensure your Supabase CLI is linked to the production project, or run `supabase db push --linked`)*
- **Alternative (Dashboard):** Copy the contents of `20260705000000_secure_rls.sql` and run it directly in the Supabase SQL Editor.

## 3. Verify RLS is Enabled
Run this SQL query as a superuser to confirm RLS is active on all public tables:
```sql
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relnamespace = 'public'::regnamespace AND relkind = 'r';
```
**Expected Result:** `relrowsecurity` must be `true` for all tables (`subscriptions`, `api_usage`, `water_logs`, `profiles`, `goals`, `meal_logs`, etc.).

## 4. Verify Policies Exist
Run this SQL query to verify the new policies were applied correctly:
```sql
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('subscriptions', 'api_usage', 'water_logs');
```
**Expected Results:**
- `subscriptions`: Should have exactly ONE policy `Users can view their own subscriptions` for `SELECT`.
- `api_usage`: Should have TWO policies: `Users can view their own api_usage` (`SELECT`) and `Users can insert their own api_usage` (`INSERT`).
- `water_logs`: Should have ONE policy: `Users can manage their own water_logs` (`ALL`).

## 5. Positive Tests (Allowed Operations)
Using a test user account in the production or staging environment:
- [ ] `SELECT` from `subscriptions`: Ensure `await supabase.from('subscriptions').select('*')` returns the user's subscription.
- [ ] `SELECT` from `api_usage`: Ensure user can read their usage.
- [ ] `INSERT` into `api_usage`: Ensure user can insert a record (via Edge Functions).
- [ ] `ALL` on `water_logs`: Ensure user can insert, read, update, and delete their own water logs.

## 6. Negative Tests (Forbidden Operations)
Using the same test user account, ensure these operations **fail** (or return 0 rows):
- [ ] `UPDATE subscriptions`: `await supabase.from('subscriptions').update({ plan: 'pro' }).eq('user_id', user.id)` must fail.
- [ ] `DELETE api_usage`: `await supabase.from('api_usage').delete().eq('user_id', user.id)` must fail.
- [ ] `UPDATE api_usage`: `await supabase.from('api_usage').update({ endpoint: 'other' }).eq('user_id', user.id)` must fail.

## 7. Cross-User Access Tests
Create two test accounts (User A and User B):
- [ ] Authenticate as User A and attempt to `SELECT` User B's `subscriptions`. Must return 0 rows.
- [ ] Authenticate as User A and attempt to `SELECT` User B's `api_usage`. Must return 0 rows.
- [ ] Authenticate as User A and attempt to `UPDATE` User B's `water_logs`. Must return 0 rows.

## 8. Edge Function Verification
- [ ] **Meal Parsing:** Log a meal using the AI. Check the Supabase Edge Function logs (`parse-meal`) to confirm it successfully inserted into `api_usage` without permissions errors.
- [ ] **Weekly Report:** Generate a weekly report. Check the `generate-weekly-report` Edge Function logs to ensure it successfully selected from `subscriptions` and inserted into `api_usage`.

## 9. RPC Verification
- [ ] **Subscription Creation:** Trigger the `get_or_create_subscription` RPC (e.g., by logging in as a new user or viewing the subscription page). Ensure the RPC successfully creates/returns the subscription row bypassing the new `SELECT`-only RLS.

## 10. Rollback Steps
If critical production flows break, immediately execute this SQL in the Supabase Dashboard SQL Editor to restore the previous permissive state:
```sql
-- Revert subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can manage their own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Revert api_usage
DROP POLICY IF EXISTS "Users can view their own api_usage" ON public.api_usage;
DROP POLICY IF EXISTS "Users can insert their own api_usage" ON public.api_usage;
CREATE POLICY "Users can manage their own api_usage" ON public.api_usage FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

## 11. Post-Deployment Smoke Test
Perform a manual walkthrough of the core application loop:
- [ ] **Login:** Successfully authenticate.
- [ ] **Onboarding/Goal Creation:** Update profile and create a goal.
- [ ] **Meal Logging:** Log a meal via AI. Ensure it works and the fallback does not trigger unnecessarily.
- [ ] **Water Logging:** Add a water log, edit it, and delete it.
- [ ] **Weekly Report:** Trigger or view a weekly report.
- [ ] **Subscription Status:** Open the pricing/subscription page and verify the current plan displays correctly.

## 12. Monitoring (First 24 Hours)
Monitor the following metrics in Sentry and PostHog closely for 24 hours post-deployment:
- **Sentry Error Rates:** Watch for any `403 Forbidden`, `PGRST116`, or `new row violates row-level security policy` errors.
- **AI Success Rate:** Ensure the `ai_request_failed` event does not spike due to `api_usage` insertion failures.
- **Meal Logging Failure Rate:** Ensure `meal_log_failed` remains below the 5% threshold.
- **Edge Function Logs:** Periodically check the Supabase Dashboard Edge Function logs for uncaught exceptions.

## 13. Deployment Decision Matrix

### ✅ Safe to Continue

Continue deployment only if ALL are true:
- Database backup completed
- Migration applied successfully
- No SQL errors
- All RLS verification queries pass
- Smoke tests pass
- Meal logging works
- Weekly report works
- Water logging works
- Subscription status loads correctly
- No unexpected Sentry errors
- No spike in 403 / RLS denied responses

### ❌ Roll Back Immediately If

Rollback immediately if ANY of these occur:
- Users cannot log meals
- Weekly reports fail
- Login fails
- Goal creation fails
- Water logging fails
- Subscription status fails to load
- Unexpected increase in 403 errors
- Edge Functions fail due to RLS
- Error rate increases significantly after deployment
