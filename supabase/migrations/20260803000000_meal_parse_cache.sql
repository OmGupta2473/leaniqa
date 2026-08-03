CREATE TABLE IF NOT EXISTS public.meal_parse_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    normalized_text TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_parse_cache_lookup ON public.meal_parse_cache(normalized_text, meal_type);

ALTER TABLE public.meal_parse_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for meal cache" ON public.meal_parse_cache FOR SELECT USING (true);
CREATE POLICY "Service role full access for meal cache" ON public.meal_parse_cache USING (true) WITH CHECK (true);
