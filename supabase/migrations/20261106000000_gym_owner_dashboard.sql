-- Gym owner dashboard — Session 2.
--
-- Adds:
--   1. gyms.owner_id (uuid, references auth.users) + backfill from owner_email
--   2. Owner-side RLS on gyms / promo_codes / promo_redemptions keyed off owner_id
--   3. R1 rule: owner can read a member's meal_logs and weekly_reports only
--      when share_meal_data = true AND premium_until > now() (fully revoke)
--   4. gym_member_access_log (audit trail, member- and owner-readable)
--   5. get_gym_member_activity RPC (audited)
--   6. get_gym_member_weekly_reports RPC (audited)
--   7. generate_promo_code RPC (server-side code generation, atomic)
--   8. list_my_gyms RPC (owner-side gym lookup, avoids exposing all gyms to
--      the client's SELECT — the RPC filters by owner_id server-side)
--
-- Rollback: drop the two new RPCs, drop gym_member_access_log, drop the owner
-- RLS policies on meal_logs/weekly_reports, restore email-based owner policies
-- from 20261105000000, drop gyms.owner_id. Non-trivial — test before applying.

-- ===========================================================================
-- 1. gyms.owner_id
-- ===========================================================================

alter table public.gyms
  add column if not exists owner_id uuid references auth.users(id) on delete restrict;

create index if not exists gyms_owner_id_idx on public.gyms (owner_id);

-- Backfill from owner_email → auth.users.email (case-insensitive).
update public.gyms g
  set owner_id = au.id
  from auth.users au
  where g.owner_id is null
    and lower(au.email) = lower(g.owner_email);

-- Report any gyms that failed backfill — founder must fix these manually
-- before going live (identify the auth.users row for the intended owner and
-- update gyms.owner_id directly).
do $$
declare
  v_unmatched int;
begin
  select count(*) into v_unmatched from public.gyms where owner_id is null;
  if v_unmatched > 0 then
    raise notice 'gyms backfill: % row(s) have no matching auth.users row; set owner_id manually', v_unmatched;
  end if;
end $$;

-- ===========================================================================
-- 2. Owner RLS on gyms / promo_codes / promo_redemptions
-- ===========================================================================
-- Prefer owner_id when set; keep owner_email as a transition fallback for
-- any gym that failed backfill (removed post-pilot under 5.1.18).

drop policy if exists gyms_owner_select on public.gyms;
create policy gyms_owner_select on public.gyms
  for select to authenticated
  using (
    owner_id = auth.uid()
    or (owner_id is null
        and lower(owner_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );

drop policy if exists promo_codes_owner_select on public.promo_codes;
create policy promo_codes_owner_select on public.promo_codes
  for select to authenticated
  using (
    gym_id in (
      select g.id from public.gyms g
      where g.owner_id = auth.uid()
        or (g.owner_id is null
            and lower(g.owner_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

drop policy if exists promo_redemptions_owner_select on public.promo_redemptions;
create policy promo_redemptions_owner_select on public.promo_redemptions
  for select to authenticated
  using (
    gym_id in (
      select g.id from public.gyms g
      where g.owner_id = auth.uid()
        or (g.owner_id is null
            and lower(g.owner_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
    )
  );

-- ===========================================================================
-- 3. R1 — owner can read meal_logs / weekly_reports only with consent + active
-- ===========================================================================

drop policy if exists meal_logs_owner_promo_read on public.meal_logs;
create policy meal_logs_owner_promo_read on public.meal_logs
  for select to authenticated
  using (
    exists (
      select 1 from public.promo_redemptions pr
      join public.gyms g on g.id = pr.gym_id
      where pr.user_id = meal_logs.user_id
        and g.owner_id = auth.uid()
        and pr.share_meal_data = true
        and pr.premium_until > now()
    )
  );

drop policy if exists weekly_reports_owner_promo_read on public.weekly_reports;
create policy weekly_reports_owner_promo_read on public.weekly_reports
  for select to authenticated
  using (
    exists (
      select 1 from public.promo_redemptions pr
      join public.gyms g on g.id = pr.gym_id
      where pr.user_id = weekly_reports.user_id
        and g.owner_id = auth.uid()
        and pr.share_meal_data = true
        and pr.premium_until > now()
    )
  );

-- ===========================================================================
-- 4. Audit trail
-- ===========================================================================

create table if not exists public.gym_member_access_log (
  id              bigserial primary key,
  gym_id          uuid not null references public.gyms(id) on delete restrict,
  owner_id        uuid not null references auth.users(id) on delete restrict,
  member_user_id  uuid not null references auth.users(id) on delete restrict,
  resource_kind   text not null check (resource_kind in ('meal_logs','weekly_reports')),
  row_count       int  not null check (row_count >= 0),
  accessed_at     timestamptz not null default now()
);

create index if not exists gym_member_access_log_gym_idx
  on public.gym_member_access_log (gym_id, accessed_at desc);
create index if not exists gym_member_access_log_member_idx
  on public.gym_member_access_log (member_user_id, accessed_at desc);
create index if not exists gym_member_access_log_owner_idx
  on public.gym_member_access_log (owner_id, accessed_at desc);

alter table public.gym_member_access_log enable row level security;

drop policy if exists gym_member_access_log_owner_select on public.gym_member_access_log;
create policy gym_member_access_log_owner_select on public.gym_member_access_log
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists gym_member_access_log_member_select on public.gym_member_access_log;
create policy gym_member_access_log_member_select on public.gym_member_access_log
  for select to authenticated using (member_user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policy — writes go through the RPCs below (SECURITY DEFINER).

-- ===========================================================================
-- 5. get_gym_member_activity — audited meal read for owner
-- ===========================================================================

create or replace function public.get_gym_member_activity(
  p_gym_id    uuid,
  p_since     timestamptz,
  p_until     timestamptz
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
  meal_slot      text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid := auth.uid();
begin
  if v_owner_id is null then raise exception 'not_authenticated'; end if;
  if p_since is null or p_until is null or p_since >= p_until then
    raise exception 'invalid_range';
  end if;
  if not exists (select 1 from public.gyms where id = p_gym_id and owner_id = v_owner_id) then
    raise exception 'not_gym_owner';
  end if;

  -- Audit BEFORE return — one row per (member, gym, request) with the
  -- number of that member's meals included in the response.
  insert into public.gym_member_access_log
    (gym_id, owner_id, member_user_id, resource_kind, row_count)
  select
    p_gym_id, v_owner_id, pr.user_id, 'meal_logs',
    (select count(*) from public.meal_logs ml
      where ml.user_id = pr.user_id
        and ml.meal_time >= p_since
        and ml.meal_time <  p_until)
  from public.promo_redemptions pr
  where pr.gym_id = p_gym_id
    and pr.share_meal_data = true
    and pr.premium_until > now()
    and exists (
      select 1 from public.meal_logs ml
      where ml.user_id = pr.user_id
        and ml.meal_time >= p_since
        and ml.meal_time <  p_until
    );

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
      ml.meal_slot
    from public.meal_logs ml
    join public.promo_redemptions pr on pr.user_id = ml.user_id
    where pr.gym_id = p_gym_id
      and pr.share_meal_data = true
      and pr.premium_until > now()
      and ml.meal_time >= p_since
      and ml.meal_time <  p_until
    order by ml.meal_time desc
    limit 500;
end;
$$;

revoke all on function public.get_gym_member_activity(uuid, timestamptz, timestamptz) from public;
grant execute on function public.get_gym_member_activity(uuid, timestamptz, timestamptz) to authenticated;

-- ===========================================================================
-- 6. get_gym_member_weekly_reports — audited weekly read for owner
-- ===========================================================================

create or replace function public.get_gym_member_weekly_reports(
  p_gym_id     uuid,
  p_since_date date,
  p_until_date date
)
returns table (
  member_user_id uuid,
  week_start     date,
  week_end       date,
  days_with_meals int,
  total_calories numeric,
  avg_calories   numeric,
  total_protein_g numeric,
  avg_protein_g  numeric,
  weekly_score   int,
  confidence     text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid := auth.uid();
begin
  if v_owner_id is null then raise exception 'not_authenticated'; end if;
  if p_since_date is null or p_until_date is null or p_since_date > p_until_date then
    raise exception 'invalid_range';
  end if;
  if not exists (select 1 from public.gyms where id = p_gym_id and owner_id = v_owner_id) then
    raise exception 'not_gym_owner';
  end if;

  insert into public.gym_member_access_log
    (gym_id, owner_id, member_user_id, resource_kind, row_count)
  select
    p_gym_id, v_owner_id, pr.user_id, 'weekly_reports',
    (select count(*) from public.weekly_reports wr
      where wr.user_id = pr.user_id
        and wr.week_start >= p_since_date
        and wr.week_end   <= p_until_date)
  from public.promo_redemptions pr
  where pr.gym_id = p_gym_id
    and pr.share_meal_data = true
    and pr.premium_until > now()
    and exists (
      select 1 from public.weekly_reports wr
      where wr.user_id = pr.user_id
        and wr.week_start >= p_since_date
        and wr.week_end   <= p_until_date
    );

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
    join public.promo_redemptions pr on pr.user_id = wr.user_id
    where pr.gym_id = p_gym_id
      and pr.share_meal_data = true
      and pr.premium_until > now()
      and wr.week_start >= p_since_date
      and wr.week_end   <= p_until_date
    order by wr.week_start desc
    limit 100;
end;
$$;

revoke all on function public.get_gym_member_weekly_reports(uuid, date, date) from public;
grant execute on function public.get_gym_member_weekly_reports(uuid, date, date) to authenticated;

-- ===========================================================================
-- 7. generate_promo_code — atomic server-side code generation
-- ===========================================================================

create or replace function public.generate_promo_code(
  p_gym_id         uuid,
  p_duration_days  int default 30,
  p_max_redemptions int default null,
  p_custom_code    text default null
)
returns table (
  promo_code_id uuid,
  code          text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id      uuid := auth.uid();
  v_code          text;
  v_attempt       int := 0;
  v_max_attempts  int := 10;
  v_id            uuid;
begin
  if v_owner_id is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.gyms where id = p_gym_id and owner_id = v_owner_id) then
    raise exception 'not_gym_owner';
  end if;
  if p_duration_days < 1 or p_duration_days > 365 then raise exception 'invalid_duration'; end if;
  if p_max_redemptions is not null and p_max_redemptions < 1 then
    raise exception 'invalid_max_redemptions';
  end if;

  if p_custom_code is not null then
    v_code := upper(trim(p_custom_code));
    if length(v_code) < 4 or length(v_code) > 40 then raise exception 'invalid_code_length'; end if;
    if exists (select 1 from public.promo_codes where upper(code) = v_code) then
      raise exception 'code_exists';
    end if;
  else
    loop
      v_attempt := v_attempt + 1;
      v_code := 'G-' || upper(substr(
        md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text),
        1, 8
      ));
      exit when not exists (select 1 from public.promo_codes where upper(code) = v_code);
      if v_attempt >= v_max_attempts then raise exception 'code_generation_failed'; end if;
    end loop;
  end if;

  insert into public.promo_codes (gym_id, code, duration_days, max_redemptions)
    values (p_gym_id, v_code, p_duration_days, p_max_redemptions)
    returning id into v_id;

  return query select v_id, v_code;
end;
$$;

revoke all on function public.generate_promo_code(uuid, int, int, text) from public;
grant execute on function public.generate_promo_code(uuid, int, int, text) to authenticated;

-- ===========================================================================
-- 8. list_my_gyms — owner-side gym lookup, server-enforced
-- ===========================================================================
-- Deliberately an RPC, not a plain SELECT. The client's `from('gyms')` reads
-- go through gyms_authenticated_select using(true), which returns all gyms.
-- That's fine for members looking up a gym name, but the owner dashboard
-- should not have to client-filter. This RPC filters by owner_id server-side.

create or replace function public.list_my_gyms()
returns table (
  id          uuid,
  name        text,
  created_at  timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select g.id, g.name, g.created_at
  from public.gyms g
  where g.owner_id = auth.uid()
  order by g.created_at desc;
$$;

revoke all on function public.list_my_gyms() from public;
grant execute on function public.list_my_gyms() to authenticated;