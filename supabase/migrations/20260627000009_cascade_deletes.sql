-- Drop all existing foreign key constraints that reference auth.users
-- and recreate them with ON DELETE CASCADE

-- profiles table: already references auth.users(id) as PK
-- When a Supabase auth user is deleted, the profile row must be deleted too
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- goals: cascade from auth.users via user_id
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_user_id_fkey;
ALTER TABLE public.goals
  ADD CONSTRAINT goals_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- meal_logs
ALTER TABLE public.meal_logs DROP CONSTRAINT IF EXISTS meal_logs_user_id_fkey;
ALTER TABLE public.meal_logs
  ADD CONSTRAINT meal_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- weight_logs
ALTER TABLE public.weight_logs DROP CONSTRAINT IF EXISTS weight_logs_user_id_fkey;
ALTER TABLE public.weight_logs
  ADD CONSTRAINT weight_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- daily_metrics
ALTER TABLE public.daily_metrics DROP CONSTRAINT IF EXISTS daily_metrics_user_id_fkey;
ALTER TABLE public.daily_metrics
  ADD CONSTRAINT daily_metrics_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- weekly_reports
ALTER TABLE public.weekly_reports DROP CONSTRAINT IF EXISTS weekly_reports_user_id_fkey;
ALTER TABLE public.weekly_reports
  ADD CONSTRAINT weekly_reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- api_usage
ALTER TABLE public.api_usage DROP CONSTRAINT IF EXISTS api_usage_user_id_fkey;
ALTER TABLE public.api_usage
  ADD CONSTRAINT api_usage_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- subscriptions
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also add a database-level trigger to delete the auth.users row when a profile is deleted
-- This handles the case where the app deletes profiles directly
CREATE OR REPLACE FUNCTION public.handle_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_delete();
