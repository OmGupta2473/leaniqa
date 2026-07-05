-- Drop the existing function first to change its signature and security
DROP FUNCTION IF EXISTS increment_api_usage(UUID, TEXT);

-- Recreate with UTC timezone logic, public search path, and minimum privileges
CREATE OR REPLACE FUNCTION increment_api_usage(p_user_id UUID, p_endpoint TEXT, p_date DATE)
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

-- Revoke default public execution
REVOKE EXECUTE ON FUNCTION increment_api_usage(UUID, TEXT, DATE) FROM PUBLIC;

-- Grant only to authenticated users and service_role
GRANT EXECUTE ON FUNCTION increment_api_usage(UUID, TEXT, DATE) TO authenticated, service_role;
