-- Update get_gym_member_activity to replicate the exact fallback logic from
-- useCalculatedProfile.ts / calculateGoalStats() so the owner sees the same
-- target the member sees on their own /meals page.
--
-- Logic: if explicit target_kcal is null, fallback to:
-- ROUND((maintenance_kcal - deficit_kcal) / 10.0) * 10
-- If maintenance_kcal is also null, target_kcal returns null (frontend renders "No targets set").

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
BEGIN
  -- R1 Gate: Ensure caller owns the gym and member is an active sharer
  IF NOT EXISTS (
    SELECT 1 FROM gyms WHERE id = p_gym_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_gym_owner';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM promo_redemptions
    WHERE gym_id = p_gym_id
      AND user_id = p_member_user_id
      AND share_meal_data = true
      AND premium_until > now()
  ) THEN
    RAISE EXCEPTION 'member_not_shareable';
  END IF;

  -- Audit log
  INSERT INTO gym_member_access_log (gym_id, member_user_id, owner_id, resource_kind)
  VALUES (p_gym_id, p_member_user_id, auth.uid(), 'meals');

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
    
    -- Calorie Fallback: Match calculateGoalStats exactly
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