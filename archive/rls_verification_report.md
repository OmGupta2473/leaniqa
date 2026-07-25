## 1. Subscriptions Table

### 1. Existing Policy Definition
```sql
-- Located in supabase/migrations/20260624000002_subscriptions.sql
CREATE POLICY "Users can manage their own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 2. Why it is insecure
The `FOR ALL` policy includes `UPDATE`. Any authenticated user can issue a standard API call from the client to modify their subscription row (e.g., `UPDATE subscriptions SET plan = 'pro', status = 'active' WHERE user_id = my_id`), granting themselves premium features without paying.

### 3. Why the new policy fixes the issue
The new policy is restricted to `FOR SELECT`.
```sql
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
```
Users can still query their own subscription status (e.g. from the frontend), but client-side inserts, updates, and deletes are outright rejected by Postgres.

### 4. Current Write Mechanisms
The only current mechanism for writing to `subscriptions` is the `get_or_create_subscription` RPC (used in `src/features/pricing/services/subscriptionService.ts`). 
This RPC was created with `SECURITY DEFINER`, meaning it runs with the privileges of the function creator (bypassing RLS). There are no Stripe webhooks or Edge Functions directly manipulating `subscriptions` via RLS.

### 5. Confirming Application Functionality
The application will not break. The frontend queries `subscriptions` via RPC `get_or_create_subscription` (which uses `SECURITY DEFINER` and bypasses RLS) and the user's frontend can still `SELECT` directly if needed.

## 2. API Usage Table

### 1. Existing Policy Definition
```sql
-- Located in supabase/migrations/20260624000000_rls_policies.sql
CREATE POLICY "Users can manage their own api_usage" ON public.api_usage FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 2. Why it is insecure
The `FOR ALL` policy includes `DELETE` and `UPDATE`. The application limits users to 10 AI requests per 24 hours by querying `api_usage`. A malicious user can simply execute a `DELETE` command via the Supabase client (`await supabase.from('api_usage').delete().eq('user_id', my_id)`) to wipe their usage history and bypass the rate limit indefinitely.

### 3. Why the new policy fixes the issue
The new policies separate `SELECT` and `INSERT` explicitly.
```sql
CREATE POLICY "Users can view their own api_usage" ON public.api_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own api_usage" ON public.api_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
```
`DELETE` and `UPDATE` operations are no longer granted, meaning usage records are immutable by the user.

### 4 & 6. Current Write Mechanisms & Requirement of Client INSERT
The `api_usage` table is written to by Edge Functions (`parse-meal` and `generate-weekly-report`).
**CRITICALLY**, these Edge Functions instantiate their Supabase client using the user's `authHeader` (`createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })`).
This means the Edge Functions execute queries *as the authenticated user*, relying on RLS. Therefore, the `INSERT` policy **IS REQUIRED** for the user role to allow the Edge Functions to function. Removing `INSERT` would break AI meal logging and weekly reports.

### 5. Confirming Application Functionality
The application will not break. Edge functions can still read (`SELECT`) and create (`INSERT`) records, and users can no longer delete them.

## 3. Water Logs Table

### 1. Existing Policy Definition
```sql
-- 20260624000000_rls_policies.sql
CREATE POLICY "Users can manage their own water_logs" ON public.water_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- 20260624000003_water_logs.sql
CREATE POLICY "user_own_water" ON public.water_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 2. Why it is a problem
Postgres evaluates policies with an `OR` condition. Having two identical policies causes unnecessary evaluation overhead and clutter. It is not an active security vulnerability, but poor hygiene.

### 3. Why the new policy fixes the issue
The migration `DROP`s both policies and creates a single canonical policy.

### 4. Current Write Mechanisms
The frontend directly inserts and reads water logs.

### 5. Confirming Application Functionality
The application will not break. The net effective permissions (`FOR ALL`) remain identical.

## 7. SQL Test Cases

```sql
-- 1. Test Subscriptions
-- ASSUMING we have authenticated as a user (auth.uid() = 'test-uid')
-- Allowed operations
SELECT * FROM public.subscriptions WHERE user_id = auth.uid(); -- Should return row(s)

-- Forbidden operations
UPDATE public.subscriptions SET plan = 'pro' WHERE user_id = auth.uid(); -- Should fail (0 rows updated)
INSERT INTO public.subscriptions (user_id, plan) VALUES (auth.uid(), 'pro'); -- Should fail

-- Cross-user access
SELECT * FROM public.subscriptions WHERE user_id = 'other-uid'; -- Should return 0 rows
UPDATE public.subscriptions SET plan = 'pro' WHERE user_id = 'other-uid'; -- Should fail


-- 2. Test API Usage
-- Allowed operations
SELECT * FROM public.api_usage WHERE user_id = auth.uid(); -- Should return row(s)
INSERT INTO public.api_usage (user_id, endpoint) VALUES (auth.uid(), 'parse-meal'); -- Should succeed

-- Forbidden operations
DELETE FROM public.api_usage WHERE user_id = auth.uid(); -- Should fail (0 rows deleted)
UPDATE public.api_usage SET endpoint = 'other' WHERE user_id = auth.uid(); -- Should fail

-- Cross-user access
SELECT * FROM public.api_usage WHERE user_id = 'other-uid'; -- Should return 0 rows
INSERT INTO public.api_usage (user_id, endpoint) VALUES ('other-uid', 'parse-meal'); -- Should fail


-- 3. Test Water Logs
-- Allowed operations
SELECT * FROM public.water_logs WHERE user_id = auth.uid(); -- Should succeed
INSERT INTO public.water_logs (user_id, amount_ml) VALUES (auth.uid(), 250); -- Should succeed
UPDATE public.water_logs SET amount_ml = 500 WHERE user_id = auth.uid(); -- Should succeed
DELETE FROM public.water_logs WHERE user_id = auth.uid(); -- Should succeed

-- Cross-user access
SELECT * FROM public.water_logs WHERE user_id = 'other-uid'; -- Should return 0 rows
INSERT INTO public.water_logs (user_id, amount_ml) VALUES ('other-uid', 250); -- Should fail
```

## 8. Idempotency & Safety
The migration script is fully idempotent. It uses `DROP POLICY IF EXISTS` before `CREATE POLICY`. It will not leave duplicate policies and can be executed multiple times safely against any environment (local, preview, production).
