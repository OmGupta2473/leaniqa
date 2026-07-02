-- 0. Create tables if they do not exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    height NUMERIC NOT NULL,
    weight NUMERIC NOT NULL,
    waist NUMERIC,
    neck NUMERIC,
    hip NUMERIC,
    activity_level TEXT NOT NULL,
    maintenance_kcal INTEGER NOT NULL,
    protein_target INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    current_bf NUMERIC NOT NULL,
    target_bf NUMERIC NOT NULL,
    strategy TEXT NOT NULL,
    target_date DATE
);

CREATE TABLE IF NOT EXISTS public.meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    meal_text TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL,
    fat INTEGER NOT NULL,
    carbs INTEGER NOT NULL,
    meal_time TIMESTAMPTZ NOT NULL,
    tip TEXT
);

CREATE TABLE IF NOT EXISTS public.weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    weight NUMERIC NOT NULL,
    body_fat NUMERIC,
    date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL,
    target_calories INTEGER NOT NULL,
    actual_calories INTEGER NOT NULL,
    target_protein INTEGER NOT NULL,
    actual_protein INTEGER NOT NULL,
    water INTEGER NOT NULL,
    score INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    week_start DATE NOT NULL,
    report TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount_ml INTEGER NOT NULL,
    date DATE NOT NULL
);

-- 1. Create api_usage table
CREATE TABLE IF NOT EXISTS public.api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies using DROP and CREATE to avoid errors on re-run
-- Profiles (uses id)
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile" 
ON public.profiles 
FOR ALL 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Goals
DROP POLICY IF EXISTS "Users can manage their own goals" ON public.goals;
CREATE POLICY "Users can manage their own goals" 
ON public.goals 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Meal Logs
DROP POLICY IF EXISTS "Users can manage their own meal_logs" ON public.meal_logs;
CREATE POLICY "Users can manage their own meal_logs" 
ON public.meal_logs 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Weight Logs
DROP POLICY IF EXISTS "Users can manage their own weight_logs" ON public.weight_logs;
CREATE POLICY "Users can manage their own weight_logs" 
ON public.weight_logs 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Daily Metrics
DROP POLICY IF EXISTS "Users can manage their own daily_metrics" ON public.daily_metrics;
CREATE POLICY "Users can manage their own daily_metrics" 
ON public.daily_metrics 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Weekly Reports
DROP POLICY IF EXISTS "Users can manage their own weekly_reports" ON public.weekly_reports;
CREATE POLICY "Users can manage their own weekly_reports" 
ON public.weekly_reports 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Water Logs
DROP POLICY IF EXISTS "Users can manage their own water_logs" ON public.water_logs;
CREATE POLICY "Users can manage their own water_logs" 
ON public.water_logs 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- API Usage
DROP POLICY IF EXISTS "Users can manage their own api_usage" ON public.api_usage;
CREATE POLICY "Users can manage their own api_usage" 
ON public.api_usage 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
