-- Migration for CHECK constraints and updated_at triggers

-- 1. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Add updated_at to tables (if not exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.weight_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.daily_metrics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Apply triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at') THEN
        CREATE TRIGGER set_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_goals_updated_at') THEN
        CREATE TRIGGER set_goals_updated_at
        BEFORE UPDATE ON public.goals
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_meal_logs_updated_at') THEN
        CREATE TRIGGER set_meal_logs_updated_at
        BEFORE UPDATE ON public.meal_logs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_weight_logs_updated_at') THEN
        CREATE TRIGGER set_weight_logs_updated_at
        BEFORE UPDATE ON public.weight_logs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_daily_metrics_updated_at') THEN
        CREATE TRIGGER set_daily_metrics_updated_at
        BEFORE UPDATE ON public.daily_metrics
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 4. Add CHECK constraints
ALTER TABLE public.profiles ADD CONSTRAINT profiles_age_check CHECK (age > 0);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_height_check CHECK (height > 0);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_weight_check CHECK (weight > 0);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_maintenance_kcal_check CHECK (maintenance_kcal > 0);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_protein_target_check CHECK (protein_target > 0);

ALTER TABLE public.goals ADD CONSTRAINT goals_current_bf_check CHECK (current_bf > 0);
ALTER TABLE public.goals ADD CONSTRAINT goals_target_bf_check CHECK (target_bf > 0);

ALTER TABLE public.meal_logs ADD CONSTRAINT meal_logs_calories_check CHECK (calories >= 0);
ALTER TABLE public.meal_logs ADD CONSTRAINT meal_logs_protein_check CHECK (protein >= 0);
ALTER TABLE public.meal_logs ADD CONSTRAINT meal_logs_fat_check CHECK (fat >= 0);
ALTER TABLE public.meal_logs ADD CONSTRAINT meal_logs_carbs_check CHECK (carbs >= 0);

ALTER TABLE public.weight_logs ADD CONSTRAINT weight_logs_weight_check CHECK (weight > 0);

ALTER TABLE public.daily_metrics ADD CONSTRAINT daily_metrics_target_calories_check CHECK (target_calories > 0);
ALTER TABLE public.daily_metrics ADD CONSTRAINT daily_metrics_actual_calories_check CHECK (actual_calories >= 0);
ALTER TABLE public.daily_metrics ADD CONSTRAINT daily_metrics_target_protein_check CHECK (target_protein > 0);
ALTER TABLE public.daily_metrics ADD CONSTRAINT daily_metrics_actual_protein_check CHECK (actual_protein >= 0);

ALTER TABLE public.water_logs ADD CONSTRAINT water_logs_amount_ml_check CHECK (amount_ml > 0);
