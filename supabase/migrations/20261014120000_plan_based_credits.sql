-- Phase 1: plan-based AI credits.
-- New users default to 'free' instead of 'beta_pro'.
-- Existing beta_pro rows are left untouched; the app and edge function
-- map beta_pro to Discipline (they keep 25/day).

CREATE OR REPLACE FUNCTION public.get_or_create_subscription(p_user_id UUID)
RETURNS public.subscriptions AS $$
DECLARE
  sub public.subscriptions;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO sub FROM public.subscriptions WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.subscriptions (user_id, plan, status, beta_expires_at)
    VALUES (p_user_id, 'free', 'active', NULL)
    RETURNING * INTO sub;
  END IF;

  RETURN sub;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;