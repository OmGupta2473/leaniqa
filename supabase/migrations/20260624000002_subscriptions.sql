-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'beta_pro' | 'pro'
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'canceled' | 'expired'
  beta_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own subscriptions
CREATE POLICY "Users can manage their own subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 2. Create get_or_create_subscription RPC
CREATE OR REPLACE FUNCTION get_or_create_subscription(p_user_id UUID)
RETURNS public.subscriptions AS $$
DECLARE
  sub public.subscriptions;
BEGIN
  SELECT * INTO sub FROM public.subscriptions WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO public.subscriptions (user_id, plan, status, beta_expires_at)
    VALUES (p_user_id, 'beta_pro', 'active', now() + interval '90 days')
    RETURNING * INTO sub;
  END IF;
  RETURN sub;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
