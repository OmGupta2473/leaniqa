-- Create meal_slot column in meal_logs table
ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS meal_slot TEXT;
