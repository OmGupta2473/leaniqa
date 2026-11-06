-- Multi-owner gym model — switch every owner check to gym_owners.
--
-- Corrected from the rolled-back 20261107000001 attempt:
--   * redeem_promo_code: current RETURNS TABLE has 4 columns (no share_name).
--     CREATE OR REPLACE would raise 42P13. Corrected to DROP FUNCTION
--     IF EXISTS public.redeem_promo_code(text, boolean, boolean) then
--     CREATE FUNCTION with the new 5-column RETURNS TABLE.
--   * redeem_promo_code: adds `set search_path = public` (SECURITY DEFINER
--     hardening) and inserts promo_code_id explicitly (column is NOT NULL;
--     the 000007 body omitted it and would 23502 on first call).
--   * redeem_promo_code: case-insensitive code match
--     (upper(pc.code) = upper(trim(p_code))) to match the unique index
--     on upper(code).
--
-- All RLS policy rewrites and all other RPC rewrites are included because
-- the previous attempt rolled back atomically — none of them landed in Remote.
--
-- Rollback: re-apply the RLS + RPC definitions from
--   20261106000000_gym_owner_dashboard.sql,
--   20261106000001_gym_owner_session2_followups.sql,
--   20261106000002_gym_owner_audit_scope.sql,
--   20261106000003_gym_owner_null_targets_fix.sql,
--   20261106000005_fix_audit_row_count.sql,
--   20261106000006_fix_resource_kind_check.sql,
--   20261106000007_opt_in_name.sql,
--   20261106000008_redeem_promo_code_return_share_name.sql,
--   20261106000010_list_gym_members_distinct_on.sql,
--   20261106000011_member_viewed_audit.sql,
--   20261106000012_fix_get_gym_member_detail_ambiguity.sql.

-- ===========================================================================
-- A. RLS policy rewrites
-- ===========================================================================

-- gyms_owner_select: owner_id = uid → is_gym_owner(id, uid) || email fallback
drop policy if exists gyms_owner_select on public.gyms;
create policy gyms_owner_select on public.gyms
  for select to authenticated
  using (
    public.is_gym_owner(id, auth.uid())
    or (
      owner_id is null
      and lower(owner_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
    )
  );

-- promo_codes_owner_select
drop policy if exists promo_codes_owner_select on public.promo_codes;
create policy promo_codes_owner_select on public.promo_codes
  for select to authenticated
  using (
    public.is_gym_owner(gym_id, auth.uid())
    or gym_id in (
      select g.id from public.gyms g
       where g.owner_id is null
         and lower(g.owner_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
    )
  );

-- promo_redemptions_owner_select
drop policy if exists promo_redemptions_owner_select on public.promo_redemptions;
create policy promo_redemptions_owner_select on public.promo_redemptions
  for select to authenticated
  using (
    public.is_gym_owner(gym_id, auth.uid())
    or gym_id in (
      select g.id from public.gyms g
       where g.owner_id is null
         and lower(g.owner_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
    )
  );

-- meal_logs_owner_promo_read — R1 gate, ownership via is_gym_owner()
drop policy if exists meal_logs_owner_promo_read on public.meal_logs;
create policy meal_logs_owner_promo_read on public.meal_logs
  for select to authenticated
  using (
    exists (
      select 1 from public.promo_redemptions pr
       where pr.user_id = meal_logs.user_id
         and pr.share_meal_data = true
         and pr.premium_until > now()
         and public.is_gym_owner(pr.gym_id, auth.uid())
    )
  );

-- weekly_reports_owner_promo_read — same shape
drop policy if exists weekly_reports_owner_promo_read on public.weekly_reports;
create policy weekly_reports_owner_promo_read on public.weekly_reports
  for select to authenticated
  using (
    exists (
      select 1 from public.promo_redemptions pr
       where pr.user_id = weekly_reports.user_id
         and pr.share_meal_data = true
         and pr.premium_until > now()
         and public.is_gym_owner(pr.gym_id, auth.uid())
    )
  );

-- ===========================================================================
-- B. RPC rewrites
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- B1. list_my_gyms — DROP + CREATE (adds role column → return shape changes)
-- ---------------------------------------------------------------------------

drop function if exists public.list_my_gyms();

create or replace function public.list_my_gyms()
returns table (
  id         uuid,
  name       text,
  created_at timestamptz,
  role       text
)
language sql
stable
security definer
set search_path = public
as $$
  select g.id, g.name, g.created_at, go.role
    from public.gyms g
    join public.gym_owners go on go.gym_id = g.id
   where go.user_id = auth.uid()
   order by g.created_at desc;
$$;

revoke all on function public.list_my_gyms() from public;
grant execute on function public.list_my_gyms() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- B2. generate_promo_code — same signature/returns, swap owner check
-- ---------------------------------------------------------------------------

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

  if not public.is_gym_owner(p_gym_id, v_owner_id) then
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
grant execute on function public.generate_promo_code(uuid, int, int, text)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- B3. list_gym_members — same signature/returns, swap owner check
-- ---------------------------------------------------------------------------

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
set search_path = public
as $function$
begin
  if not public.is_gym_owner(p_gym_id, auth.uid()) then
    raise exception 'not_gym_owner';
  end if;

  return query
  select
    latest.user_id,
    latest.name,
    latest.redeemed_at,
    latest.premium_until,
    latest.share_meal_data,
    latest.consent_granted_at,
    latest.consent_revoked_at
  from (
    select distinct on (pr.user_id)
      pr.user_id,
      case when pr.share_name then p.name else 'Anonymous Member' end as name,
      pr.redeemed_at,
      pr.premium_until,
      pr.share_meal_data,
      pr.consent_granted_at,
      pr.consent_revoked_at
    from public.promo_redemptions pr
    join public.profiles p on p.id = pr.user_id
    where pr.gym_id = p_gym_id
    order by pr.user_id, pr.redeemed_at desc
  ) latest
  order by latest.redeemed_at desc;
end;
$function$;

revoke all on function public.list_gym_members(uuid) from public;
grant execute on function public.list_gym_members(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- B4. get_gym_member_detail — same signature/returns, swap owner check
-- ---------------------------------------------------------------------------

create or replace function public.get_gym_member_detail(
  p_gym_id uuid,
  p_member_user_id uuid
)
returns table (
  user_id uuid,
  name text,
  redeemed_at timestamptz,
  premium_until timestamptz,
  share_meal_data boolean,
  share_name boolean,
  consent_granted_at timestamptz,
  consent_revoked_at timestamptz,
  is_active boolean,
  has_meal_access boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_row public.promo_redemptions%rowtype;
  v_name text;
begin
  if v_caller is null then
    raise exception 'not_authenticated';
  end if;

  if not public.is_gym_owner(p_gym_id, v_caller) then
    raise exception 'not_gym_owner';
  end if;

  select * into v_row
  from public.promo_redemptions pr
  where pr.gym_id = p_gym_id
    and pr.user_id = p_member_user_id
  order by pr.redeemed_at desc
  limit 1;

  if not found then
    raise exception 'member_not_found';
  end if;

  select p.name into v_name
  from public.profiles p
  where p.id = p_member_user_id;

  insert into public.gym_member_access_log (
    gym_id, owner_id, member_user_id, resource_kind, row_count
  ) values (
    p_gym_id, v_caller, p_member_user_id, 'member_viewed', 1
  );

  return query
  select
    v_row.user_id,
    (case when v_row.share_name then v_name else 'Anonymous Member' end)::text,
    v_row.redeemed_at,
    v_row.premium_until,
    v_row.share_meal_data,
    v_row.share_name,
    v_row.consent_granted_at,
    v_row.consent_revoked_at,
    (v_row.premium_until > now())::boolean,
    (v_row.share_meal_data and v_row.premium_until > now())::boolean;
end;
$$;

revoke all on function public.get_gym_member_detail(uuid, uuid) from public;
grant execute on function public.get_gym_member_detail(uuid, uuid)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- B5. get_gym_member_activity — same signature/returns, swap owner check
--     Body preserved from 20261106000006 (row_count fix + resource_kind fix +
--     target fallback from 20261106000003).
-- ---------------------------------------------------------------------------

create or replace function public.get_gym_member_activity(
  p_gym_id uuid,
  p_member_user_id uuid,
  p_since timestamptz,
  p_until timestamptz
)
returns table (
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
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row_count int;
begin
  if not public.is_gym_owner(p_gym_id, auth.uid()) then
    raise exception 'not_gym_owner';
  end if;

  if not exists (
    select 1 from public.promo_redemptions
    where gym_id = p_gym_id
      and user_id = p_member_user_id
      and share_meal_data = true
      and premium_until > now()
  ) then
    raise exception 'member_not_shareable';
  end if;

  select count(*) into v_row_count
  from public.meal_logs ml
  where ml.user_id = p_member_user_id
    and ml.meal_time >= p_since
    and ml.meal_time <  p_until;

  insert into public.gym_member_access_log
    (gym_id, owner_id, member_user_id, resource_kind, row_count)
  values (p_gym_id, auth.uid(), p_member_user_id, 'meal_logs', v_row_count);

  return query
  select
    ml.user_id,
    ml.id,
    ml.meal_time,
    ml.meal_text,
    ml.calories,
    ml.protein,
    ml.fat,
    ml.carbs,
    coalesce(ml.fiber, 0)::numeric,
    ml.meal_slot,
    coalesce(
      p.target_kcal,
      round((p.maintenance_kcal - coalesce(g.deficit_kcal, 0)) / 10.0) * 10
    )::numeric,
    p.protein_target::numeric,
    p.carbs_target::numeric,
    p.fat_target::numeric
  from public.meal_logs ml
  join public.profiles p on p.id = ml.user_id
  left join public.goals g on g.user_id = ml.user_id
  where ml.user_id = p_member_user_id
    and ml.meal_time >= p_since
    and ml.meal_time <  p_until
  order by ml.meal_time asc;
end;
$$;

revoke all on function public.get_gym_member_activity(uuid, uuid, timestamptz, timestamptz) from public;
grant execute on function public.get_gym_member_activity(uuid, uuid, timestamptz, timestamptz)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- B6. get_gym_member_weekly_reports — same signature/returns, swap owner check
--     Body preserved from 20261106000006.
-- ---------------------------------------------------------------------------

create or replace function public.get_gym_member_weekly_reports(
  p_gym_id uuid,
  p_member_user_id uuid,
  p_since_date date,
  p_until_date date
)
returns table (
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
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row_count int;
begin
  if not public.is_gym_owner(p_gym_id, auth.uid()) then
    raise exception 'not_gym_owner';
  end if;

  if not exists (
    select 1 from public.promo_redemptions
    where gym_id = p_gym_id
      and user_id = p_member_user_id
      and share_meal_data = true
      and premium_until > now()
  ) then
    raise exception 'member_not_shareable';
  end if;

  select count(*) into v_row_count
  from public.weekly_reports wr
  where wr.user_id = p_member_user_id
    and wr.week_start >= p_since_date
    and wr.week_start <= p_until_date;

  insert into public.gym_member_access_log
    (gym_id, owner_id, member_user_id, resource_kind, row_count)
  values (p_gym_id, auth.uid(), p_member_user_id, 'weekly_reports', v_row_count);

  return query
  select
    wr.user_id,
    wr.week_start,
    wr.week_end,
    wr.days_with_meals,
    wr.total_calories::numeric,
    wr.avg_calories::numeric,
    wr.total_protein_g::numeric,
    wr.avg_protein_g::numeric,
    wr.weekly_score,
    wr.confidence
  from public.weekly_reports wr
  where wr.user_id = p_member_user_id
    and wr.week_start >= p_since_date
    and wr.week_start <= p_until_date
  order by wr.week_start desc;
end;
$$;

revoke all on function public.get_gym_member_weekly_reports(uuid, uuid, date, date) from public;
grant execute on function public.get_gym_member_weekly_reports(uuid, uuid, date, date)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- B7. redeem_promo_code — DROP + CREATE (4 → 5 columns, adds share_name)
--
-- Changes vs current (20261106000007):
--   * RETURNS TABLE gains `share_name boolean` (5th column) — needs DROP
--     FUNCTION, cannot CREATE OR REPLACE (42P13).
--   * Adds `set search_path = public` (SECURITY DEFINER hardening).
--   * Fixes 000007's missing `promo_code_id` in the INSERT (column NOT NULL;
--     the current body would 23502 on first call).
--   * Case-insensitive code match `upper(pc.code) = upper(trim(p_code))`
--     matching the unique index on `upper(code)`.
--   * Preserves: not_authenticated guard, already_redeemed guard,
--     FOR UPDATE lock, code_exhausted guard, consent timestamp logic
--     (meal-data only, matching set_promo_consent), current_redemptions
--     increment.
--   * Adds anti-self-dealing: `is_gym_owner(v_gym_id, auth.uid())` raises
--     `cannot_redeem_own_gym` after code_exhausted, before INSERT. Covers
--     both creator and co-owners (is_gym_owner ignores role).
-- ---------------------------------------------------------------------------

drop function if exists public.redeem_promo_code(text, boolean, boolean);

create function public.redeem_promo_code(
  p_code text,
  p_share_meal_data boolean,
  p_share_name boolean
)
returns table (
  gym_id uuid,
  gym_name text,
  premium_until timestamptz,
  share_meal_data boolean,
  share_name boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promo_code_id       uuid;
  v_gym_id              uuid;
  v_gym_name            text;
  v_max_redemptions     int;
  v_current_redemptions int;
  v_duration_days       int;
  v_premium_until       timestamptz;
  v_now                 timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if exists (select 1 from public.promo_redemptions where user_id = auth.uid()) then
    raise exception 'already_redeemed';
  end if;

  select pc.id, pc.gym_id, g.name,
         pc.max_redemptions, pc.current_redemptions, pc.duration_days
    into v_promo_code_id, v_gym_id, v_gym_name,
         v_max_redemptions, v_current_redemptions, v_duration_days
    from public.promo_codes pc
    join public.gyms g on g.id = pc.gym_id
   where upper(pc.code) = upper(trim(p_code))
     and pc.active = true
   for update of pc;

  if not found then
    raise exception 'invalid_code';
  end if;

  if v_max_redemptions is not null
     and v_current_redemptions >= v_max_redemptions then
    raise exception 'code_exhausted';
  end if;

  -- Anti-self-dealing: creator AND co-owners of this gym may not redeem this
  -- gym's codes. Redeeming another gym's codes remains allowed.
  if public.is_gym_owner(v_gym_id, auth.uid()) then
    raise exception 'cannot_redeem_own_gym';
  end if;

  v_premium_until := v_now + (v_duration_days || ' days')::interval;

  insert into public.promo_redemptions (
    user_id, promo_code_id, gym_id, premium_until,
    share_meal_data, share_name,
    consent_granted_at, consent_revoked_at, redeemed_at
  ) values (
    auth.uid(), v_promo_code_id, v_gym_id, v_premium_until,
    p_share_meal_data, p_share_name,
    case when p_share_meal_data then v_now else null end,
    case when p_share_meal_data then null else v_now end,
    v_now
  );

  update public.promo_codes
    set current_redemptions = current_redemptions + 1
    where id = v_promo_code_id;

  return query
    select v_gym_id, v_gym_name, v_premium_until, p_share_meal_data, p_share_name;
end;
$$;

revoke all on function public.redeem_promo_code(text, boolean, boolean) from public;
grant execute on function public.redeem_promo_code(text, boolean, boolean)
  to authenticated, service_role;