ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fiber_target int;
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS fiber numeric DEFAULT 0;
ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS target_fiber int DEFAULT 0;
ALTER TABLE daily_metrics ADD COLUMN IF NOT EXISTS actual_fiber numeric DEFAULT 0;
