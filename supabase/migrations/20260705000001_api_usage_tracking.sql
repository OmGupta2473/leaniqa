-- Add date and usage_count to api_usage
ALTER TABLE public.api_usage 
  ADD COLUMN IF NOT EXISTS date DATE,
  ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 1;

-- Backfill date
UPDATE public.api_usage SET date = (created_at AT TIME ZONE 'UTC')::DATE WHERE date IS NULL;

-- Make date NOT NULL
ALTER TABLE public.api_usage ALTER COLUMN date SET NOT NULL;
ALTER TABLE public.api_usage ALTER COLUMN date SET DEFAULT CURRENT_DATE;

-- Handle existing duplicates by aggregating them
WITH duplicates AS (
  SELECT user_id, endpoint, date, SUM(usage_count) as total_usage, MIN(id) as keep_id
  FROM public.api_usage
  GROUP BY user_id, endpoint, date
  HAVING COUNT(*) > 1
)
UPDATE public.api_usage a
SET usage_count = d.total_usage
FROM duplicates d
WHERE a.id = d.keep_id;

WITH duplicates AS (
  SELECT user_id, endpoint, date, MIN(id) as keep_id
  FROM public.api_usage
  GROUP BY user_id, endpoint, date
  HAVING COUNT(*) > 1
)
DELETE FROM public.api_usage a
USING duplicates d
WHERE a.user_id = d.user_id AND a.endpoint = d.endpoint AND a.date = d.date AND a.id != d.keep_id;

-- Now add the unique constraint
ALTER TABLE public.api_usage DROP CONSTRAINT IF EXISTS api_usage_user_id_endpoint_date_key;
ALTER TABLE public.api_usage ADD CONSTRAINT api_usage_user_id_endpoint_date_key UNIQUE (user_id, endpoint, date);

-- Create RPC for atomic increment
CREATE OR REPLACE FUNCTION increment_api_usage(p_user_id UUID, p_endpoint TEXT)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.api_usage (user_id, endpoint, date, usage_count)
  VALUES (p_user_id, p_endpoint, CURRENT_DATE, 1)
  ON CONFLICT (user_id, endpoint, date)
  DO UPDATE SET usage_count = public.api_usage.usage_count + 1
  RETURNING usage_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
