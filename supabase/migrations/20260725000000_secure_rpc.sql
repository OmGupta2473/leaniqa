CREATE OR REPLACE FUNCTION public.increment_api_usage(p_user_id UUID, p_endpoint TEXT, p_date DATE)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.api_usage (user_id, endpoint, date, usage_count)
  VALUES (p_user_id, p_endpoint, p_date, 1)
  ON CONFLICT (user_id, endpoint, date)
  DO UPDATE SET usage_count = public.api_usage.usage_count + 1
  RETURNING usage_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_or_create_subscription(p_user_id UUID)
RETURNS public.subscriptions AS $$
DECLARE
  sub public.subscriptions;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO sub FROM public.subscriptions WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.subscriptions (user_id, plan, status, beta_expires_at)
    VALUES (p_user_id, 'beta_pro', 'active', now() + interval '90 days')
    RETURNING * INTO sub;
  END IF;
  
  RETURN sub;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the INSERT policy on api_usage so users cannot pre-insert negative usage counts
DROP POLICY IF EXISTS "Users can insert their own api_usage" ON public.api_usage;
-- Users can still view their usage (useful for UI) but cannot modify it.

-- Add a CHECK constraint to ensure usage_count is always positive just in case
ALTER TABLE public.api_usage ADD CONSTRAINT check_usage_count_positive CHECK (usage_count >= 0);

