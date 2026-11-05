-- Session 3 — audit scope fix + activity targets extension.
--
-- Two changes:
--
--   1. Both owner-facing data RPCs now take a required p_member_user_id uuid.
--      This fixes a privacy bug in the Session 2 versions: the audit insert
--      fired one row per member with consent in the gym, not per member being
--      viewed. From the member's transparency view (gym_member_access_log_
--      member_select), that meant "your gym owner accessed your data" appeared
--      for members the owner had not actually looked at. The new signature
--      scopes the audit insert to the member being queried.
--
--   2. get_gym_member_activity now returns the member's profile targets
--      (target_kcal, protein_target, carbs_target, fat_target) via a left
--      join on profiles. Read-only, no policy change — SECURITY DEFINER with
--      the owner check inline, same pattern as list_gym_members (Session 2
--      fixup). This lets MemberMealsView render the daily summary card.
--
-- Breaking signature change is deliberate; client is updated in the same
-- ship. DROP + CREATE (not CREATE OR REPLACE) because the parameter list
-- changes. If re-run, DROP IF EXISTS cleans up first.
--
-- Rollback: re-run the two RPCs from
-- 20261106000000_gym_owner_dashboard.sql. Non-destructive.

drop function if exists public.get_gym_member_activity(uuid, timestamptz, timestamptz);
drop function if exists public.get_gym_member_weekly_reports(uuid, date, date);

-- ===========================================================================
-- get_gym_member_activity — adds p_member_user_id + target fields
-- ===========================================================================

create or replace function public.get_gym_member_activity(
  p_gym_id          uuid,
  p_member_user_id  uuid,
  p_since           timestamptz,
  p_until           timestamptz
)
returns table (
  member_user_id uuid,
  meal_id        uuid,
  meal_time      timestamptz,
  meal_text      text,
  calories       numeric,
  protein        numeric,
  fat            numeric,
  carbs          numeric,
  fiber          numeric,
  meal_slot      text,
  target_kcal    numeric,
  protein_target numeric,
  carbs_target   numeric,
  fat_target     numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id  uuid := auth.uid();
  v_row_count int;
begin
  if v_owner_id is null then
    raise exception 'not_authenticated';
  end if;
  if p_since is null or p_until is null or p_since >= p_until then
    raise exception 'invalid_range';
  end if;
  if not exists (select 1 from public.gyms where id = p_gym_id and owner_id = v_owner_id) then
    raise exception 'not_gym_owner';
  end if;
  if not exists (
    select 1 from public.promo_redemptions pr
    where pr.gym_id = p_gym_id
      and pr.user_id = p_member_user_id
      and pr.share_meal_data = true
      and pr.premium_until > now()
  ) then
    raise exception 'member_not_shareable';
  end if;

  -- Count first so the audit row is accurate even when 0 meals are returned.
  -- Every data-view request writes exactly one audit row for exactly the
  -- member being viewed.
  select count(*) into v_row_count
  from public.meal_logs ml
  where ml.user_id = p_member_user_id
    and ml.meal_time >= p_since
    and ml.meal_time <  p_until;

  insert into public.gym_member_access_log
    (gym_id, owner_id, member_user_id, resource_kind, row_count)
  values (p_gym_id, v_owner_id, p_member_user_id, 'meal_logs', v_row_count);

  return query
    select
      ml.user_id,
      ml.id,
      ml.meal_time,
      ml.meal_text,
      ml.calories::numeric,
      ml.protein::numeric,
      ml.fat::numeric,
      ml.carbs::numeric,
      coalesce(ml.fiber, 0)::numeric,
      ml.meal_slot,
      p.target_kcal::numeric,
      p.protein_target::numeric,
      p.carbs_target::numeric,
      p.fat_target::numeric
    from public.meal_logs ml
    left join public.profiles p on p.id = p_member_user_id
    where ml.user_id = p_member_user_id
      and ml.meal_time >= p_since
      and ml.meal_time <  p_until
    order by ml.meal_time asc
    limit 200;
end;
$$;

revoke all on function public.get_gym_member_activity(uuid, uuid, timestamptz, timestamptz) from public;
grant execute on function public.get_gym_member_activity(uuid, uuid, timestamptz, timestamptz) to authenticated;

-- ===========================================================================
-- get_gym_member_weekly_reports — adds p_member_user_id
-- ===========================================================================

create or replace function public.get_gym_member_weekly_reports(
  p_gym_id          uuid,
  p_member_user_id  uuid,
  p_since_date      date,
  p_until_date      date
)
returns table (
  member_user_id  uuid,
  week_start      date,
  week_end        date,
  days_with_meals int,
  total_calories  numeric,
  avg_calories    numeric,
  total_protein_g numeric,
  avg_protein_g   numeric,
  weekly_score    int,
  confidence      text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id  uuid := auth.uid();
  v_row_count int;
begin
  if v_owner_id is null then
    raise exception 'not_authenticated';
  end if;
  if p_since_date is null or p_until_date is null or p_since_date > p_until_date then
    raise exception 'invalid_range';
  end if;
  if not exists (select 1 from public.gyms where id = p_gym_id and owner_id = v_owner_id) then
    raise exception 'not_gym_owner';
  end if;
  if not exists (
    select 1 from public.promo_redemptions pr
    where pr.gym_id = p_gym_id
      and pr.user_id = p_member_user_id
      and pr.share_meal_data = true
      and pr.premium_until > now()
  ) then
    raise exception 'member_not_shareable';
  end if;

  select count(*) into v_row_count
  from public.weekly_reports wr
  where wr.user_id = p_member_user_id
    and wr.week_start >= p_since_date
    and wr.week_end   <= p_until_date;

  insert into public.gym_member_access_log
    (gym_id, owner_id, member_user_id, resource_kind, row_count)
  values (p_gym_id, v_owner_id, p_member_user_id, 'weekly_reports', v_row_count);

  return query
    select
      wr.user_id,
      wr.week_start,
      wr.week_end,
      wr.days_with_meals,
      wr.total_calories,
      wr.avg_calories,
      wr.total_protein_g,
      wr.avg_protein_g,
      wr.weekly_score,
      wr.confidence
    from public.weekly_reports wr
    where wr.user_id = p_member_user_id
      and wr.week_start >= p_since_date
      and wr.week_end   <= p_until_date
    order by wr.week_start desc
    limit 100;
end;
$$;

revoke all on function public.get_gym_member_weekly_reports(uuid, uuid, date, date) from public;
grant execute on function public.get_gym_member_weekly_reports(uuid, uuid, date, date) to authenticated;