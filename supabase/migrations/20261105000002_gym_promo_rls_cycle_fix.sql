-- Gym promo codes — RLS cycle fix (5.1.16).
--
-- The 1a migration defined a cyclic RLS graph:
--   gyms_member_select         → promo_redemptions
--   promo_redemptions_owner_select → gyms
--   promo_codes_owner_select   → gyms
-- Querying any of gyms / promo_codes / promo_redemptions with the cyclic
-- policy present raises 42P17 (infinite recursion in policy).
--
-- This migration replaces gyms_member_select with a leaf policy that
-- returns true for all authenticated users. Gym rows are directory-style
-- metadata (id, name, owner_email, created_at) and the member read of a
-- gym's name is not a secret — the code they redeem is what's private.
--
-- Long-term note: owner_email is PII and is now visible to all authenticated
-- users via this policy. Post-pilot cleanup (filed as 5.1.18): drop the
-- owner_email column from gyms (owner_id will be authoritative after
-- migration 20261106000000). Do NOT tighten this policy back to a subquery
-- on promo_redemptions — that reintroduces the cycle.

drop policy if exists gyms_member_select      on public.gyms;
drop policy if exists gyms_authenticated_select on public.gyms;

create policy gyms_authenticated_select on public.gyms
  for select to authenticated
  using (true);

-- gyms_owner_select is redundant under using(true); drop it to keep the
-- policy list short. The 20261106000000 migration re-adds an owner_id-based
-- policy that supersedes the email match.
drop policy if exists gyms_owner_select on public.gyms;