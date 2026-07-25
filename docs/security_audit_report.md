# Security Audit Report

## 1. Security Checks Performed
- **Secrets Management**: Verified environment variables (`.env`, `.env.example`), `import.meta.env` usage in React code, and Deno environment variables in Edge Functions.
- **Backend Authorization**: Audited Express backend (`server.ts`) and Supabase Edge Functions (`parse-meal`, `generate-weekly-report`).
- **Rate Limiting**: Audited the API usage limits enforcement via `api_usage` table and `increment_api_usage` RPC.
- **Row Level Security (RLS)**: Audited all table policies (`profiles`, `goals`, `meal_logs`, `weight_logs`, `api_usage`, `subscriptions`, `user_awards`, etc.) for bypassing, IDOR, or privilege escalation.
- **SQL / RPC Vulnerabilities**: Scanned for all `SECURITY DEFINER` functions that execute with elevated privileges.
- **Code Vulnerabilities**: Searched for hardcoded credentials, XSS (`dangerouslySetInnerHTML`), CSRF exposures, and TODO/FIXME markers indicating unresolved security debt.

## 2. Vulnerabilities Found
1. **Critical Privilege Escalation in `increment_api_usage` (RPC)**:
   - The RPC function was marked `SECURITY DEFINER` but failed to validate that the provided `p_user_id` argument matched `auth.uid()`. An authenticated attacker could pass another user's UUID and increment their usage count, effectively launching a denial-of-service (DoS) attack on their AI limits.
2. **Critical Privilege Escalation in `get_or_create_subscription` (RPC)**:
   - The RPC function was marked `SECURITY DEFINER` and did not validate `auth.uid() = p_user_id`. An attacker could create or retrieve subscription records for arbitrary users.
3. **Data Integrity Flaw in `api_usage` Table**:
   - The `api_usage` table had a policy allowing users to `INSERT` records. An attacker could theoretically insert a record for tomorrow with a negative usage count (e.g., `-1000`) before the Edge Function logged genuine usage. Due to the `ON CONFLICT DO UPDATE` clause in the RPC, this negative value would be incremented, permanently bypassing the rate limit.

## 3. Fixes Applied
- **RPC Hardening (`increment_api_usage`)**: Created a new SQL migration (`20260725000000_secure_rpc.sql`) that injects `IF auth.uid() != p_user_id THEN RAISE EXCEPTION 'Unauthorized'; END IF;` to enforce authorization context before executing the elevated increment.
- **RPC Hardening (`get_or_create_subscription`)**: Applied the same `auth.uid()` verification check inside the subscription creation logic.
- **RLS Lockdown (`api_usage`)**: Dropped the overly permissive `INSERT` policy from the `api_usage` table. Since `increment_api_usage` runs as `SECURITY DEFINER`, the client does not need direct `INSERT` permissions to track API usage. Also added a `CHECK (usage_count >= 0)` constraint to guarantee positive metrics.
- **IDOR Protection Verification**: Confirmed that all client-side data service operations (e.g., `mealService`, `weightService`) strictly override the `user_id` field using `authService.getUserId()`, which correctly derives the identity from the secure `supabase.auth.getSession()` context.

## 4. Remaining Risks or Recommendations
- **Client-Side Gamification**: The `user_awards` and `user_streaks` tables utilize an `auth.uid() = user_id` policy that allows users to manage their own awards. Because award unlocking logic runs in the client browser (`awardService.ts`), a sophisticated user could manually `INSERT` rows to unlock awards they have not earned. 
  - *Recommendation*: If gamification integrity becomes a business requirement, move award computation to a protected Supabase Edge Function and restrict table mutations to `service_role` only.

## 5. Evidence for Key Findings
- *Secrets*: No `VITE_GEMINI_API_KEY` or `VITE_SUPABASE_SERVICE_ROLE_KEY` found in the bundle.
- *Edge Functions*: `generate-weekly-report` securely extracts the user identity using `supabase.auth.getUser(token)` rather than relying on insecure client payloads.
- *XSS/Hardcoded Tokens*: Zero instances of `dangerouslySetInnerHTML` and zero leaked bearer tokens in the repository.

## 6. Overall Verdict
**PASS**. The application is production-ready. All critical vulnerabilities regarding API limits, subscription bypassing, and IDOR have been resolved. The remaining risks are low-impact (gamification cheating) and acceptable for this stage of production.
