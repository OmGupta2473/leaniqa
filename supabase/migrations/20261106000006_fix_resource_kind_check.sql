-- Fix for 23514 check constraint violation on gym_member_access_log.
-- The constraint `gym_member_access_log_resource_kind_check` 
-- expects 'meal_logs' and 'weekly_reports' (matching table names), 
-- but the previous migration inserted 'meals'.

-- 1. Fix get_gym_member_activity
CREATE OR REPLACE FUNCTION public.get_gym_member_activity(
  p_gym_id uuid,
  p_member_user_id uuid,
  p_since timestamptz,
  p_until timestamptz
)
RETURNS TABLE (
  member_user_id uuid,
  meal_id uuid,
  meal_time timestamptz,
  meal_text text,
  calories numeric,
  protein numeric,
  fat numeric,
  carbs numeric,
  fiber numeric,
  meal_slot text,
  target_kcal numeric,
  protein_target numeric,
  carbs_target numeric,
  fat_target numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row_count int;
BEGIN
  -- R1 Gate: Ensure caller owns the gym
  IF NOT EXISTS (
    SELECT 1 FROM gyms WHERE id = p_gym_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_gym_owner';
  END IF;

  -- R1 Gate: Ensure member is an active sharer
  IF NOT EXISTS (
    SELECT 1 FROM promo_redemptions
    WHERE gym_id = p_gym_id
      AND user_id = p_member_user_id
      AND share_meal_data = true
      AND premium_until > now()
  ) THEN
    RAISE EXCEPTION 'member_not_shareable';
  END IF;

  -- Compute exact row count for the audit log BEFORE returning the data
  SELECT count(*) INTO v_row_count
  FROM meal_logs ml
  WHERE ml.user_id = p_member_user_id
    AND ml.meal_time >= p_since
    AND ml.meal_time < p_until;

  -- Audit log (changed 'meals' to 'meal_logs' to satisfy the check constraint)
  INSERT INTO gym_member_access_log (gym_id, member_user_id, owner_id, resource_kind, row_count)
  VALUES (p_gym_id, p_member_user_id, auth.uid(), 'meal_logs', v_row_count);

  RETURN QUERY
  SELECT
    ml.user_id AS member_user_id,
    ml.id AS meal_id,
    ml.meal_time,
    ml.meal_text,
    ml.calories,
    ml.protein,
    ml.fat,
    ml.carbs,
    COALESCE(ml.fiber, 0)::numeric AS fiber,
    ml.meal_slot,
    -- Target fallback logic remains untouched
    COALESCE(
      p.target_kcal,
      ROUND((p.maintenance_kcal - COALESCE(g.deficit_kcal, 0)) / 10.0) * 10
    )::numeric AS target_kcal,
    p.protein_target::numeric,
    p.carbs_target::numeric,
    p.fat_target::numeric
  FROM meal_logs ml
  JOIN profiles p ON p.id = ml.user_id
  LEFT JOIN goals g ON g.user_id = ml.user_id
  WHERE ml.user_id = p_member_user_id
    AND ml.meal_time >= p_since
    AND ml.meal_time < p_until
  ORDER BY ml.meal_time ASC;
END;
$$;

-- 2. Fix get_gym_member_weekly_reports (ensuring consistency)
CREATE OR REPLACE FUNCTION public.get_gym_member_weekly_reports(
  p_gym_id uuid,
  p_member_user_id uuid,
  p_since_date date,
  p_until_date date
)
RETURNS TABLE (
  member_user_id uuid,
  week_start date,
  week_end date,
  days_with_meals int,
  total_calories numeric,
  avg_calories numeric,
  total_protein_g numeric,
  avg_protein_g numeric,
  weekly_score int,
  confidence text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row_count int;
BEGIN
  -- R1 Gate: Ensure caller owns the gym
  IF NOT EXISTS (
    SELECT 1 FROM gyms WHERE id = p_gym_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_gym_owner';
  END IF;

  -- R1 Gate: Ensure member is an active sharer
  IF NOT EXISTS (
    SELECT 1 FROM promo_redemptions
    WHERE gym_id = p_gym_id
      AND user_id = p_member_user_id
      AND share_meal_data = true
      AND premium_until > now()
  ) THEN
    RAISE EXCEPTION 'member_not_shareable';
  END IF;

  -- Compute exact row count for the audit log BEFORE returning the data
  SELECT count(*) INTO v_row_count
  FROM weekly_reports wr
  WHERE wr.user_id = p_member_user_id
    AND wr.week_start >= p_since_date
    AND wr.week_start <= p_until_date;

  -- Audit log
  INSERT INTO gym_member_access_log (gym_id, member_user_id, owner_id, resource_kind, row_count)
  VALUES (p_gym_id, p_member_user_id, auth.uid(), 'weekly_reports', v_row_count);

  RETURN QUERY
  SELECT
    wr.user_id AS member_user_id,
    wr.week_start,
    wr.week_end,
    wr.days_with_meals,
    wr.total_calories::numeric,
    wr.avg_calories::numeric,
    wr.total_protein_g::numeric,
    wr.avg_protein_g::numeric,
    wr.weekly_score,
    wr.confidence
  FROM weekly_reports wr
  WHERE wr.user_id = p_member_user_id
    AND wr.week_start >= p_since_date
    AND wr.week_start <= p_until_date
  ORDER BY wr.week_start DESC;
END;
$$;