ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS fiber INTEGER DEFAULT 0;
ALTER TABLE public.meal_logs ADD CONSTRAINT meal_logs_fiber_check CHECK (fiber >= 0);
