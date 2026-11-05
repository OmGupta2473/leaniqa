-- Session 2 follow-ups:
--   FIX 2 — tighten generate_promo_code to v1 policy
--           (30-day, 5-redemption, auto-generated only)
--   FIX 3 — add list_gym_members(p_gym_id) so the owner dashboard can
--           render member names without opening a profiles SELECT policy.
--
-- Rollback (non-destructive — no data changes):
--   drop function if exists public.list_gym_members(uuid);
--   re-run generate_promo_code from 20261106000000_gym_owner_dashboard.sql

-- ===========================================================================
-- FIX 2 — generate_promo_code: v1 policy lock
-- ===========================================================================
-- Signature retained (4 args) so the client deploy has no down-window. Nulls
-- coalesce to v1 policy values (pre-fix client passed null for max_redemptions
-- and custom_code); any explicit off-policy value is rejected. Tightening is
-- defence-in-depth against direct RPC callers (see 5.1.14 — the RPC is granted
-- to `authenticated`, so this is the actual policy boundary).

create or replace function public.generate_promo_code(
  p_gym_id          uuid,
  p_duration_days   int default 30,
  p_max_redemptions int default 5,
  p_custom_code     text default null
)
returns table (promo_code_id uuid, code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id       uuid := auth.uid();
  v_code           text;
  v_attempt        int := 0;
  v_max_attempts   int := 10;
  v_id             uuid;
begin
  if v_owner_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Coalesce nulls to v1 policy values. Backward-compat with the pre-fix
  -- client during the deploy window; the explicit-value checks below still
  -- fire for direct callers passing wrong values.
  p_duration_days   := coalesce(p_duration_days, 30);
  p_max_redemptions := coalesce(p_max_redemptions, 5);

  if p_duration_days != 30 then
    raise exception 'invalid_duration_v1';
  end if;
  if p_max_redemptions != 5 then
    raise exception 'invalid_max_redemptions_v1';
  end if;
  if p_custom_code is not null then
    raise exception 'custom_code_not_allowed_v1';
  end if;

  if not exists (
    select 1 from public.gyms where id = p_gym_id and owner_id = v_owner_id
  ) then
    raise exception 'not_gym_owner';
  end if;

  loop
    v_attempt := v_attempt + 1;
    v_code := 'G-' || upper(substr(
      md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text),
      1, 8
    ));
    exit when not exists (select 1 from public.promo_codes where upper(code) = v_code);
    if v_attempt >= v_max_attempts then
      raise exception 'code_generation_failed';
    end if;
  end loop;

  insert into public.promo_codes (gym_id, code, duration_days, max_redemptions)
    values (p_gym_id, v_code, p_duration_days, p_max_redemptions)
    returning id into v_id;

  return query select v_id, v_code;
end;
$$;

revoke all on function public.generate_promo_code(uuid, int, int, text) from public;
grant execute on function public.generate_promo_code(uuid, int, int, text) to authenticated;

-- ===========================================================================
-- FIX 3 — list_gym_members: owner-gated member list with display names
-- ===========================================================================
-- Names are basic owner-member relationship info (you must know who redeemed
-- your code). This does NOT open a profiles SELECT policy to gym owners:
-- SECURITY DEFINER with the owner check inline means the profiles join only
-- happens for the authenticated gym owner, and only for members of that gym.
-- Meal data gating (R1) is unchanged — separate RPCs on meal_logs and
-- weekly_reports gate on share_meal_data = true AND premium_until > now().
--
-- Returns NULL name for members whose profile row is missing or whose name is
-- not set — the client falls back to a UUID prefix in that case.

create or replace function public.list_gym_members(p_gym_id uuid)
returns table (
  user_id            uuid,
  name               text,
  redeemed_at        timestamptz,
  premium_until      timestamptz,
  share_meal_data    boolean,
  consent_granted_at timestamptz,
  consent_revoked_at timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_owner_id uuid := auth.uid();
begin
  if v_owner_id is null then
    raise exception 'not_authenticated';
  end if;
  if not exists (
    select 1 from public.gyms where id = p_gym_id and owner_id = v_owner_id
  ) then
    raise exception 'not_gym_owner';
  end if;

  return query
    select
      pr.user_id,
      p.name,
      pr.redeemed_at,
      pr.premium_until,
      pr.share_meal_data,
      pr.consent_granted_at,
      pr.consent_revoked_at
    from public.promo_redemptions pr
    left join public.profiles p on p.id = pr.user_id
    where pr.gym_id = p_gym_id
    order by pr.redeemed_at desc;
end;
$$;

revoke all on function public.list_gym_members(uuid) from public;
grant execute on function public.list_gym_members(uuid) to authenticated;