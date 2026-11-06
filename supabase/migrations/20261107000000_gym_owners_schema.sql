-- Multi-owner gym model — schema foundation.
--
-- Adds:
--   1. public.gym_owners junction (gym_id, user_id, role, added_at)
--   2. Backfill from public.gyms.owner_id → role 'creator'
--   3. public.is_gym_owner(gym_id, user_id) helper (SECURITY DEFINER)
--   4. Cap trigger (max 3 owners per gym)
--   5. RLS on gym_owners (self + co-owner visibility)
--   6. Unique constraint on gyms.owner_id (max 1 created gym per user)
--
-- Rollback: drop function public.enforce_gym_owners_cap();
--           drop trigger gym_owners_cap_trigger on public.gym_owners;
--           drop table public.gym_owners;
--           drop function public.is_gym_owner(uuid, uuid);
--           drop index if exists gyms_owner_id_unique;

-- ===========================================================================
-- 1. gym_owners table
-- ===========================================================================

create table if not exists public.gym_owners (
  gym_id    uuid not null references public.gyms(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'co_owner'
              check (role in ('creator', 'co_owner')),
  added_at  timestamptz not null default now(),
  primary key (gym_id, user_id)
);

create index if not exists gym_owners_user_idx
  on public.gym_owners (user_id);

-- Exactly one creator per gym. (Prevents anyone from flipping the role flag
-- on a second row and confusing the audit trail. is_gym_owner ignores role.)
create unique index if not exists gym_owners_one_creator_per_gym
  on public.gym_owners (gym_id) where role = 'creator';

-- ===========================================================================
-- 2. Backfill from gyms.owner_id
-- ===========================================================================
-- Idempotent: on conflict do nothing. Runs before the unique index on
-- gyms.owner_id so any duplicate-owning user is caught by the precheck below.

insert into public.gym_owners (gym_id, user_id, role)
select g.id, g.owner_id, 'creator'
  from public.gyms g
 where g.owner_id is not null
on conflict (gym_id, user_id) do nothing;

-- ===========================================================================
-- 3. is_gym_owner helper
-- ===========================================================================
-- SECURITY DEFINER so RLS policies can call it without recursing back into
-- gym_owners RLS. STABLE so it can be used in policy `using` clauses.

create or replace function public.is_gym_owner(
  p_gym_id  uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.gym_owners
     where gym_id = p_gym_id
       and user_id = p_user_id
  );
$$;

revoke all on function public.is_gym_owner(uuid, uuid) from public;
grant execute on function public.is_gym_owner(uuid, uuid)
  to authenticated, service_role;

-- ===========================================================================
-- 4. Cap trigger — max 3 owners per gym
-- ===========================================================================
-- Client-facing cap. To widen to 4 (creator + 3 co-owners), change `>= 3` to
-- `>= 4` in a follow-up migration.

create or replace function public.enforce_gym_owners_cap()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from public.gym_owners where gym_id = new.gym_id) >= 3 then
    raise exception 'gym_owner_cap_reached'
      using hint = 'A gym may have at most 3 owners (1 creator + 2 co-owners).';
  end if;
  return new;
end;
$$;

drop trigger if exists gym_owners_cap_trigger on public.gym_owners;
create trigger gym_owners_cap_trigger
  before insert on public.gym_owners
  for each row execute function public.enforce_gym_owners_cap();

-- ===========================================================================
-- 5. RLS on gym_owners
-- ===========================================================================
-- Writes are service_role only (Table Editor / founder-mediated co-owner
-- additions). No INSERT/UPDATE/DELETE policies. P1 follow-up: an explicit
-- invite RPC + audit trail if/when co-owner management becomes self-serve.

alter table public.gym_owners enable row level security;

drop policy if exists gym_owners_self_select on public.gym_owners;
create policy gym_owners_self_select on public.gym_owners
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists gym_owners_co_owner_select on public.gym_owners;
create policy gym_owners_co_owner_select on public.gym_owners
  for select to authenticated
  using (public.is_gym_owner(gym_id, auth.uid()));

-- ===========================================================================
-- 6. gyms.owner_id unique constraint (max 1 created gym per user)
-- ===========================================================================
-- Fail loudly if existing data violates the invariant. Founder must decide
-- which gym keeps the owner (typically the one they operate) and set
-- owner_id = NULL on the rest, or reassign. Do not silently strip.

do $$
declare
  v_dups int;
begin
  select count(*) into v_dups
    from (
      select owner_id
        from public.gyms
       where owner_id is not null
       group by owner_id
      having count(*) > 1
    ) d;

  if v_dups > 0 then
    raise exception
      'Cannot apply gyms_owner_id_unique: % user(s) currently own >1 gym. Resolve manually: select owner_id, array_agg(id) from public.gyms where owner_id is not null group by owner_id having count(*) > 1;',
      v_dups;
  end if;
end $$;

create unique index if not exists gyms_owner_id_unique
  on public.gyms (owner_id)
  where owner_id is not null;