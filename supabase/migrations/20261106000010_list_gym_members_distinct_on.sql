-- 5.2.5b: list_gym_members must return ONE row per member, not one per
-- redemption. A member can legitimately have multiple redemption rows at
-- the same gym (re-up after expiry, second code). The current RPC returns
-- one row per redemption, duplicating members in the owner dashboard.
--
-- DISTINCT ON (pr.user_id) picks the most-recent redemption per member;
-- the outer ORDER BY redeemed_at DESC preserves the UI's recent-first order.
-- Bundled hardening: `set search_path = public` on a SECURITY DEFINER
-- function whose body joins unqualified table names.
--
-- RETURN TABLE shape unchanged → CREATE OR REPLACE is safe.

create or replace function public.list_gym_members(p_gym_id uuid)
returns table (
  user_id uuid,
  name text,
  redeemed_at timestamptz,
  premium_until timestamptz,
  share_meal_data boolean,
  consent_granted_at timestamptz,
  consent_revoked_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not exists (
    select 1 from public.gyms
    where id = p_gym_id and owner_id = auth.uid()
  ) then
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

grant execute on function public.list_gym_members(uuid) to authenticated;