-- Ensure meal_logs.meal_slot exists.
-- The original add_meal_slot.sql had no timestamp prefix and was skipped by the CLI.
ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS meal_slot TEXT;
