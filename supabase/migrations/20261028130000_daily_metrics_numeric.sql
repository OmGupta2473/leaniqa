-- Widen daily_metrics numeric columns from INTEGER to NUMERIC so that
-- decimal values from meal sums don't fail with
--   "invalid input syntax for type integer: \"977.5\""
--
-- Why NUMERIC (not service-layer rounding):
--   * actual_calories / actual_protein are sums of user meal_logs. mealService
--     already rounds every meal to 1 decimal place, so these ARE decimals.
--     Rounding again in complianceService would lose precision and could
--     shift a day across the ±10% "on target" window.
--   * target_calories / target_protein are sourced from profiles.target_kcal /
--     profiles.protein_target. They're integer today, but widening here
--     future-proofs the upsert if the profile schema ever changes.
--
-- score is left as INTEGER: calculateDailyScore() ends with Math.round(...).
--
-- Verified safe: no code that reads these columns assumes an integer.
--   streaks.ts, dayStatus.ts, awardsEngine.ts, complianceService.getScores(),
--   LogCalendar, AwardsPage, WeeklyReportPage all do floating-point math.

ALTER TABLE public.daily_metrics
  ALTER COLUMN actual_calories TYPE NUMERIC(10,2) USING actual_calories::NUMERIC,
  ALTER COLUMN actual_protein  TYPE NUMERIC(10,2) USING actual_protein::NUMERIC,
  ALTER COLUMN target_calories TYPE NUMERIC(10,2) USING target_calories::NUMERIC,
  ALTER COLUMN target_protein  TYPE NUMERIC(10,2) USING target_protein::NUMERIC;