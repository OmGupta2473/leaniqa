-- Sprint 2: Decimal macro support
-- Change meal_logs nutrition columns from INTEGER to NUMERIC(10,2)
-- Preserve existing integer data by casting

-- calories: INTEGER -> NUMERIC(10,2)
ALTER TABLE public.meal_logs
ALTER COLUMN calories TYPE NUMERIC(10,2) USING calories::NUMERIC(10,2);

-- protein: INTEGER -> NUMERIC(10,2)
ALTER TABLE public.meal_logs
ALTER COLUMN protein TYPE NUMERIC(10,2) USING protein::NUMERIC(10,2);

-- fat: INTEGER -> NUMERIC(10,2)
ALTER TABLE public.meal_logs
ALTER COLUMN fat TYPE NUMERIC(10,2) USING fat::NUMERIC(10,2);

-- carbs: INTEGER -> NUMERIC(10,2)
ALTER TABLE public.meal_logs
ALTER COLUMN carbs TYPE NUMERIC(10,2) USING carbs::NUMERIC(10,2);

-- fiber: INTEGER -> NUMERIC(10,2) (added in 20260804000000_add_fiber_to_meal_logs.sql)
ALTER TABLE public.meal_logs
ALTER COLUMN fiber TYPE NUMERIC(10,2) USING fiber::NUMERIC(10,2);

-- Update CHECK constraints to allow decimals (they already allow >= 0)
-- The existing constraints (meal_logs_calories_check, etc.) still work with NUMERIC

-- Add comment for documentation
COMMENT ON COLUMN public.meal_logs.calories IS 'Total calories (supports decimal precision)';
COMMENT ON COLUMN public.meal_logs.protein IS 'Total protein in grams (supports decimal precision)';
COMMENT ON COLUMN public.meal_logs.fat IS 'Total fat in grams (supports decimal precision)';
COMMENT ON COLUMN public.meal_logs.carbs IS 'Total carbohydrates in grams (supports decimal precision)';
COMMENT ON COLUMN public.meal_logs.fiber IS 'Total fiber in grams (supports decimal precision)';