-- Gym promo codes — Session 1a: schema + RLS + redemption RPCs.
--
-- Design refs:
--   * One redemption per user  → UNIQUE (user_id) on promo_redemptions.
--   * No cron / no background job → expiry is a date comparison at read time
--     in resolve_user_access (Session 1c) and in the owner RLS on meal_logs
--     (Session 2). premium_until is the single source of truth.
--   * Real subscription takes precedence → the Session 1c change to
--     resolve_user_access checks subscriptions FIRST and only falls through
--     to promo_redemptions when the subscription path returns free.
--   * Consent is enforced at the DB level (Session 2 adds the RLS on
--     meal_logs/weekly_reports keyed off share_meal_data); Session 1 only
--     stores the flag and the grant/revoke timestamps.
--   * Founder creates gyms + codes via the Supabase Table Editor as
--     service_role. No INSERT/UPDATE/DELETE policies are provided for
--     anon/auth on gyms or promo_codes.
--
-- Rollback (manual, run top-down in the SQL editor if this ever needs
-- to be reverted before Session 2 ships):
--   drop function if exists public.set_promo_consent(boolean);
--   drop function if exists public.redeem_promo_code(text, boolean);
--   drop table if exists public.promo_redemptions;
--   drop table if exists public.promo_codes;
--   drop table if exists public.gyms;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.gyms (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(trim(name)) between 1 and 120),
  owner_email  text not null check (position('@' in owner_email) > 1),
  created_at   timestamptz not null default now()
);

-- An owner_email may own multiple gyms (one per physical location).
create index if not exists gyms_owner_email_idx on public.gyms (lower(owner_email));

create table if not exists public.promo_codes (
  id                  uuid primary key default gen_random_uuid(),
  gym_id              uuid not null references public.gyms(id) on delete cascade,
  code                text not null check (length(trim(code)) between 4 and 40),
  duration_days       int  not null default 30 check (duration_days between 1 and 365),
  max_redemptions     int  check (max_redemptions is null or max_redemptions > 0),
  current_redemptions int  not null default 0 check (current_redemptions >= 0),
  active              boolean not null default true,
  created_at          timestamptz not null default now()
);

-- Codes are entered case-insensitively (upper() in the RPC), so uniqueness
-- must be case-insensitive too. Otherwise "ABC123" and "abc123" could both
-- exist and resolve ambiguously.
create unique index if not exists promo_codes_code_ci_key
  on public.promo_codes (upper(code));

create index if not exists promo_codes_gym_id_idx
  on public.promo_codes (gym_id);

create table if not exists public.promo_redemptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  promo_code_id       uuid not null references public.promo_codes(id) on delete restrict,
  gym_id              uuid not null references public.gyms(id) on delete restrict,
  redeemed_at         timestamptz not null default now(),
  premium_until       timestamptz not null,
  share_meal_data     boolean not null default false,
  consent_granted_at  timestamptz,
  consent_revoked_at  timestamptz,
  constraint promo_redemptions_premium_after_redeem
    check (premium_until > redeemed_at),
  constraint promo_redemptions_one_per_user
    unique (user_id)
);

create index if not exists promo_redemptions_gym_id_idx
  on public.promo_redemptions (gym_id);

create index if not exists promo_redemptions_premium_until_idx
  on public.promo_redemptions (premium_until);

-- ---------------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------------
-- All three tables are INSERT/UPDATE/DELETE-free for anon and authenticated
-- roles. Founder uses the Table Editor (service_role), which bypasses RLS.
-- All member-facing mutations go through the two SECURITY DEFINER RPCs below.

alter table public.gyms              enable row level security;
alter table public.promo_codes       enable row level security;
alter table public.promo_redemptions enable row level security;

-- gyms: owner sees own gym; member sees the gym they redeemed with.
drop policy if exists gyms_owner_select   on public.gyms;
drop policy if exists gyms_member_select  on public.gyms;

create policy gyms_owner_select on public.gyms
  for select to authenticated
  using (lower(owner_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

create policy gyms_member_select on public.gyms
  for select to authenticated
  using (
    id in (
      select pr.gym_id from public.promo_redemptions pr
      where pr.user_id = auth.uid()
    )
  );

-- promo_codes: owner sees codes for their gyms. Members do not.
drop policy if exists promo_codes_owner_select on public.promo_codes;

create policy promo_codes_owner_select on public.promo_codes
  for select to authenticated
  using (
    gym_id in (
      select g.id from public.gyms g
      where lower(g.owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- promo_redemptions: member sees own row; owner sees all rows for their gyms
-- (Session 2 needs the consent flag + premium_until for the owner dashboard
-- member list; the meal-data gate is enforced separately on meal_logs and
-- weekly_reports in Session 2).
drop policy if exists promo_redemptions_self_select   on public.promo_redemptions;
drop policy if exists promo_redemptions_owner_select  on public.promo_redemptions;

create policy promo_redemptions_self_select on public.promo_redemptions
  for select to authenticated
  using (user_id = auth.uid());

create policy promo_redemptions_owner_select on public.promo_redemptions
  for select to authenticated
  using (
    gym_id in (
      select g.id from public.gyms g
      where lower(g.owner_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- ---------------------------------------------------------------------------
-- 3. RPCs
-- ---------------------------------------------------------------------------

-- redeem_promo_code: atomic redemption. Uses FOR UPDATE on the promo_codes
-- row so two concurrent redeems of the same code cannot both pass the
-- current_redemptions < max_redemptions check.
--
-- Errors thrown (client distinguishes by message substring, matching the
-- existing repo convention; the Session 1b edge function will translate
-- these to error_code JSON so the client has a stable contract):
--   'not_authenticated'
--   'already_redeemed'
--   'invalid_code'
--   'code_inactive'
--   'code_exhausted'
create or replace function public.redeem_promo_code(
  p_code text,
  p_share_meal_data boolean default false
)
returns table (
  gym_id        uuid,
  gym_name      text,
  premium_until timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid             uuid := auth.uid();
  v_code_row        public.promo_codes%rowtype;
  v_gym_row         public.gyms%rowtype;
  v_premium_until   timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_code is null or length(trim(p_code)) = 0 then
    raise exception 'invalid_code';
  end if;

  -- Idempotency guard before the lock to fail fast on the common case.
  if exists (select 1 from public.promo_redemptions where user_id = v_uid) then
    raise exception 'already_redeemed';
  end if;

  select * into v_code_row
  from public.promo_codes
  where upper(code) = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'invalid_code';
  end if;

  if not v_code_row.active then
    raise exception 'code_inactive';
  end if;

  if v_code_row.max_redemptions is not null
     and v_code_row.current_redemptions >= v_code_row.max_redemptions then
    raise exception 'code_exhausted';
  end if;

  select * into v_gym_row from public.gyms where id = v_code_row.gym_id;
  if not found then
    raise exception 'invalid_code';
  end if;

  v_premium_until := now() + (v_code_row.duration_days::text || ' days')::interval;

  insert into public.promo_redemptions (
    user_id, promo_code_id, gym_id, premium_until,
    share_meal_data,
    consent_granted_at, consent_revoked_at
  ) values (
    v_uid, v_code_row.id, v_code_row.gym_id, v_premium_until,
    p_share_meal_data,
    case when p_share_meal_data then now() else null end,
    case when p_share_meal_data then null else now() end
  );

  update public.promo_codes
    set current_redemptions = current_redemptions + 1
    where id = v_code_row.id;

  return query
    select v_code_row.gym_id, v_gym_row.name, v_premium_until;
end;
$$;

revoke all on function public.redeem_promo_code(text, boolean) from public;
grant execute on function public.redeem_promo_code(text, boolean) to authenticated;

-- set_promo_consent: toggles the member's share_meal_data flag. Only the
-- owner of the redemption row can call it (auth.uid() = user_id in the
-- WHERE clause). Tracks grant/revoke timestamps for auditability but
-- preserves the "one redemption per user" invariant — nothing is deleted.
create or replace function public.set_promo_consent(p_share boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.promo_redemptions
    set
      share_meal_data    = p_share,
      consent_granted_at = case
        when p_share and share_meal_data = false then now()
        else consent_granted_at
      end,
      consent_revoked_at = case
        when (not p_share) and share_meal_data = true then now()
        else consent_revoked_at
      end
    where user_id = auth.uid();
end;
$$;

revoke all on function public.set_promo_consent(boolean) from public;
grant execute on function public.set_promo_consent(boolean) to authenticated;