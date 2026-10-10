-- Guest mode: block anonymous users from using the AI parse-meal endpoint.
--
-- Anonymous users assume the `authenticated` Postgres role, so we cannot
-- simply `TO anon`. Instead we check the is_anonymous claim in the JWT and
-- use RESTRICTIVE policies so the check AND-combines with any existing
-- permissive policies on api_usage.
--
-- Restrictive policies must be combined with at least one permissive policy
-- on the same table for that operation to succeed — which is already true
-- on api_usage (existing policies allow authenticated users to insert/update
-- their own rows).
--
-- Reference: https://supabase.com/docs/guides/auth/auth-anonymous#access-control

-- Prevent anonymous users from creating usage rows via the RPC.
create policy "api_usage_insert_permanent_users_only"
on public.api_usage
as restrictive
for insert
to authenticated
with check (
  coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false
);

-- Prevent anonymous users from incrementing usage rows.
create policy "api_usage_update_permanent_users_only"
on public.api_usage
as restrictive
for update
to authenticated
using (
  coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false
);

-- Prevent anonymous users from deleting usage rows (nothing should delete
-- these, but the guard is cheap and consistent with the two above).
create policy "api_usage_delete_permanent_users_only"
on public.api_usage
as restrictive
for delete
to authenticated
using (
  coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false
);
