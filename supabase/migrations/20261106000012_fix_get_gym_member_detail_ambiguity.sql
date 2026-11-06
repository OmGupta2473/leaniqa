-- 5.2.6b: fix 'column reference "user_id" is ambiguous' (SQLSTATE 42702)
-- in get_gym_member_detail.
--
-- Root cause: RETURNS TABLE(user_id uuid, ...) declares `user_id` and
-- `redeemed_at` as OUT parameters (PL/pgSQL function variables). The
-- internal SELECT * INTO v_row ... WHERE user_id = ... references
-- `user_id` unqualified, so PL/pgSQL sees both the OUT parameter and the
-- promo_redemptions.user_id column. Default
-- `plpgsql.variable_conflict = error` (PG 9+) raises 42702.
--
-- Fix: qualify column references in the SELECT INTO with a table alias.
-- No change to: function signature, OUT parameter names, ownership check,
-- `member_not_found` raise, audit INSERT, RETURN QUERY, or grants.
--
-- Root cause is NOT owner mismatch, NOT missing migration, NOT error
-- message casing. The Network tab response is authoritative: 42702.

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

  -- All column references are qualified with `pr.` to avoid 42702:
  -- `user_id` and `redeemed_at` are also OUT parameter names of this
  -- function (RETURNS TABLE), so bare references are ambiguous.
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

grant execute on function public.get_gym_member_detail(uuid, uuid) to authenticated;