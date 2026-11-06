-- 5.2.5 + 5.2.6: single-member fetch RPC + member-facing access log.
--
-- Target audit table: public.gym_member_access_log
--   id bigint, gym_id uuid, owner_id uuid, member_user_id uuid,
--   resource_kind text, row_count int, accessed_at timestamptz default now()
-- Ownership column on gyms is `owner_id`.
-- Existing RLS policies (gym_member_access_log_member_select,
-- gym_member_access_log_owner_select) are left untouched.

-- ---------------------------------------------------------------------------
-- 1. resource_kind: allow 'member_viewed'
-- ---------------------------------------------------------------------------
alter table public.gym_member_access_log
  drop constraint if exists gym_member_access_log_resource_kind_check;
alter table public.gym_member_access_log
  add constraint gym_member_access_log_resource_kind_check
  check (resource_kind in ('meal_logs', 'weekly_reports', 'member_viewed'));

-- ---------------------------------------------------------------------------
-- 2. get_gym_member_detail
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

  if not exists (
    select 1 from public.gyms g
    where g.id = p_gym_id and g.owner_id = v_caller
  ) then
    raise exception 'not_gym_owner';
  end if;

  select * into v_row
  from public.promo_redemptions
  where gym_id = p_gym_id and user_id = p_member_user_id
  order by redeemed_at desc
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

grant execute on function public.get_gym_member_detail(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. get_my_gym_access_log
-- ---------------------------------------------------------------------------
create or replace function public.get_my_gym_access_log(p_limit int default 20)
returns table (
  viewed_at timestamptz,
  gym_id uuid,
  gym_name text,
  resource_kind text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_lim int := greatest(1, least(coalesce(p_limit, 20), 100));
begin
  if v_caller is null then
    raise exception 'not_authenticated';
  end if;

  return query
  select
    a.accessed_at,
    a.gym_id,
    coalesce(g.name, 'Your gym'),
    a.resource_kind
  from public.gym_member_access_log a
  left join public.gyms g on g.id = a.gym_id
  where a.member_user_id = v_caller
  order by a.accessed_at desc
  limit v_lim;
end;
$$;

grant execute on function public.get_my_gym_access_log(int) to authenticated;