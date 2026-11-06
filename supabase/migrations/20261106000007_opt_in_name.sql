-- 1. Add the share_name column
ALTER TABLE public.promo_redemptions 
ADD COLUMN share_name boolean NOT NULL DEFAULT false;

-- Grandfather existing rows: default to true to avoid breaking current gyms
UPDATE public.promo_redemptions SET share_name = true;

-- 2. Update list_gym_members to mask names based on the new column
CREATE OR REPLACE FUNCTION public.list_gym_members(p_gym_id uuid)
RETURNS TABLE (
  user_id uuid,
  name text,
  redeemed_at timestamptz,
  premium_until timestamptz,
  share_meal_data boolean,
  consent_granted_at timestamptz,
  consent_revoked_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- R1 Gate: Ensure caller owns the gym
  IF NOT EXISTS (
    SELECT 1 FROM gyms WHERE id = p_gym_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_gym_owner';
  END IF;

  RETURN QUERY
  SELECT
    pr.user_id,
    CASE WHEN pr.share_name THEN p.name ELSE 'Anonymous Member' END AS name,
    pr.redeemed_at,
    pr.premium_until,
    pr.share_meal_data,
    pr.consent_granted_at,
    pr.consent_revoked_at
  FROM promo_redemptions pr
  JOIN profiles p ON p.id = pr.user_id
  WHERE pr.gym_id = p_gym_id
  ORDER BY pr.redeemed_at DESC;
END;
$$;

-- 3. Update set_promo_consent to handle both toggles
-- We keep the same signature shape but add p_share_name.
-- Note: you will need to DROP the old function if the signature changes exactly,
-- but since we are adding a parameter, Postgres handles it via CREATE OR REPLACE
-- if we drop the old one first. To be safe, we drop and recreate.
DROP FUNCTION IF EXISTS public.set_promo_consent(boolean);

CREATE OR REPLACE FUNCTION public.set_promo_consent(
  p_share_meal_data boolean,
  p_share_name boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.promo_redemptions
  SET
    share_meal_data = p_share_meal_data,
    share_name = p_share_name,
    consent_granted_at = CASE WHEN p_share_meal_data = true THEN now() ELSE NULL END,
    consent_revoked_at = CASE WHEN p_share_meal_data = false THEN now() ELSE NULL END
  WHERE user_id = auth.uid();
END;
$$;

-- 4. Update redeem_promo_code to accept and store share_name
DROP FUNCTION IF EXISTS public.redeem_promo_code(text, boolean);

CREATE OR REPLACE FUNCTION public.redeem_promo_code(
  p_code text,
  p_share_meal_data boolean,
  p_share_name boolean
)
RETURNS TABLE (
  gym_id uuid,
  gym_name text,
  premium_until timestamptz,
  share_meal_data boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gym_id uuid;
  v_gym_name text;
  v_max_redemptions int;
  v_current_redemptions int;
  v_duration_days int;
  v_premium_until timestamptz;
  v_now timestamptz := now();
BEGIN
  IF EXISTS (SELECT 1 FROM promo_redemptions WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'already_redeemed';
  END IF;

  SELECT pc.gym_id, g.name, pc.max_redemptions, pc.current_redemptions, pc.duration_days
  INTO v_gym_id, v_gym_name, v_max_redemptions, v_current_redemptions, v_duration_days
  FROM promo_codes pc
  JOIN gyms g ON g.id = pc.gym_id
  WHERE pc.code = p_code AND pc.active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_code';
  END IF;

  IF v_max_redemptions IS NOT NULL AND v_current_redemptions >= v_max_redemptions THEN
    RAISE EXCEPTION 'code_exhausted';
  END IF;

  v_premium_until := v_now + (v_duration_days || ' days')::interval;

  INSERT INTO promo_redemptions (
    user_id, gym_id, premium_until, share_meal_data, share_name,
    consent_granted_at, consent_revoked_at, redeemed_at
  ) VALUES (
    auth.uid(), v_gym_id, v_premium_until, p_share_meal_data, p_share_name,
    CASE WHEN p_share_meal_data THEN v_now ELSE NULL END,
    CASE WHEN p_share_meal_data THEN NULL ELSE v_now END,
    v_now
  );

  UPDATE promo_codes SET current_redemptions = current_redemptions + 1 WHERE code = p_code;

  RETURN QUERY SELECT v_gym_id, v_gym_name, v_premium_until, p_share_meal_data;
END;
$$;