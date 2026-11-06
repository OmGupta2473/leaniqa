CREATE OR REPLACE FUNCTION public.set_promo_consent(p_share boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.promo_redemptions
  SET
    share_meal_data = p_share,
    consent_granted_at = CASE WHEN p_share = true THEN now() ELSE NULL END,
    consent_revoked_at = CASE WHEN p_share = false THEN now() ELSE NULL END
  WHERE user_id = auth.uid();
END;
$$;