-- Security Audit Remediation Migration

-- 1. Fix 'subscriptions' table
-- Critical Vulnerability: Users could UPDATE their own subscriptions to 'pro'
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.subscriptions;

-- Users should only be able to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Note: INSERTs and UPDATEs are handled by the get_or_create_subscription RPC 
-- which runs as SECURITY DEFINER, or by Edge Functions using Service Role keys.


-- 2. Fix 'api_usage' table
-- Critical Vulnerability: Users could DELETE or UPDATE usage logs to bypass AI limits
DROP POLICY IF EXISTS "Users can manage their own api_usage" ON public.api_usage;

-- Users can view their own usage
CREATE POLICY "Users can view their own api_usage" 
ON public.api_usage 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users (via Edge Functions/Client) can insert new usage records, but not modify/delete them
CREATE POLICY "Users can insert their own api_usage" 
ON public.api_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- 3. Fix 'water_logs' table
-- Duplicate policies existed ("Users can manage their own water_logs" and "user_own_water")
DROP POLICY IF EXISTS "Users can manage their own water_logs" ON public.water_logs;
DROP POLICY IF EXISTS "user_own_water" ON public.water_logs;

-- Recreate a single, clean policy for full management
CREATE POLICY "Users can manage their own water_logs" 
ON public.water_logs 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
