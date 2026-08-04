-- Truncate existing api_usage data as it is pre-launch and we do not need to aggregate duplicates
TRUNCATE TABLE public.api_usage;

-- Add date and usage_count to api_usage
ALTER TABLE public.api_usage 
  ADD COLUMN IF NOT EXISTS date DATE,
  ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 1;

-- Make date NOT NULL
ALTER TABLE public.api_usage ALTER COLUMN date SET DEFAULT CURRENT_DATE;
ALTER TABLE public.api_usage ALTER COLUMN date SET NOT NULL;

-- Now add the unique constraint
ALTER TABLE public.api_usage DROP CONSTRAINT IF EXISTS api_usage_user_id_endpoint_date_key;
ALTER TABLE public.api_usage ADD CONSTRAINT api_usage_user_id_endpoint_date_key UNIQUE (user_id, endpoint, date);

-- Drop the old function if it exists with the old signature
DROP FUNCTION IF EXISTS public.increment_api_usage(UUID, TEXT);

-- Create RPC for atomic increment
CREATE OR REPLACE FUNCTION public.increment_api_usage(p_user_id UUID, p_endpoint TEXT, p_date DATE)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.api_usage (user_id, endpoint, date, usage_count)
  VALUES (p_user_id, p_endpoint, p_date, 1)
  ON CONFLICT (user_id, endpoint, date)
  DO UPDATE SET usage_count = public.api_usage.usage_count + 1
  RETURNING usage_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Set up proper permissions
REVOKE EXECUTE ON FUNCTION public.increment_api_usage(UUID, TEXT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_api_usage(UUID, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_api_usage(UUID, TEXT, DATE) TO service_role;
