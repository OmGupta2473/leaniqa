-- Adds share_name to redeem_promo_code's RETURNS TABLE so the edge function
-- can echo a row-derived value rather than the client-parsed input.
--
-- Approach: pg_get_functiondef captures the CURRENT body (which already writes
-- share_name to promo_redemptions — verified in Query 2), then two exact-string
-- replacements inject the new column into the return type and the RETURN QUERY.
-- Anything unexpected raises and rolls back.

do $migration$
declare
  v_body text;
  v_prev text;
  v_hits int;
begin
  select pg_get_functiondef(p.oid)
  into v_body
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'redeem_promo_code'
  limit 1;

  if v_body is null then
    raise exception 'preflight: public.redeem_promo_code not found';
  end if;

  if v_body like '%share_name boolean%' then
    raise notice 'redeem_promo_code already returns share_name; no-op';
    return;
  end if;

  -- Edit 1: RETURNS TABLE adds share_name boolean
  v_prev := v_body;
  v_body := replace(
    v_body,
    'share_meal_data boolean)',
    'share_meal_data boolean, share_name boolean)'
  );
  if v_body = v_prev then
    raise exception
      'edit 1 failed: RETURNS TABLE pattern did not match. Capture body with: select pg_get_functiondef(''public.redeem_promo_code''::regproc);';
  end if;

  -- Edit 2: RETURN QUERY appends pr.share_name next to pr.share_meal_data.
  -- Requires exactly one occurrence to be safe (would otherwise duplicate
  -- share_name into a WHERE clause or a CTE).
  v_hits := (length(v_body) - length(replace(v_body, 'pr.share_meal_data', '')))
            / length('pr.share_meal_data');
  if v_hits <> 1 then
    raise exception
      'edit 2 failed: expected exactly one `pr.share_meal_data` in body, found %. Capture body via pg_get_functiondef and adjust the replace target.', v_hits;
  end if;

  v_body := replace(
    v_body,
    'pr.share_meal_data',
    'pr.share_meal_data, pr.share_name'
  );

  -- Atomic swap. Inside a Supabase migration transaction, concurrent callers
  -- see either the old or the new function, never neither.
  execute 'drop function public.redeem_promo_code(text, boolean, boolean)';
  execute v_body;

  -- DROP removes grants; restore them. redeem-promo is invoked with the
  -- user's JWT (auth.uid() context), so `authenticated` is required;
  -- service_role is kept for admin/debug.
  execute 'grant execute on function public.redeem_promo_code(text, boolean, boolean) to authenticated, service_role';
end;
$migration$;