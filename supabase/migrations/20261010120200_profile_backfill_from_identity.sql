-- When a guest (anonymous user) links their first real identity (Google,
-- email, etc.), Supabase flips auth.users.is_anonymous from true to false
-- AND updates the user_metadata — but on OAuth linking the metadata is
-- historically incomplete (missing email/name/avatar_url). Backfill the
-- public.profiles row from auth.identities instead, which always has the
-- full identity_data.
--
-- Runs on every UPDATE to auth.users where the is_anonymous flag transitions.
-- Idempotent: uses coalesce() so existing profile values are preserved.
--
-- Schema note (2026-10-10): public.profiles has columns (id, email, name,
-- age, gender, height, weight, ...) and NO avatar_url column, so this
-- backfill updates email + name only.

create or replace function public.backfill_profile_from_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_name text;
begin
  if coalesce(OLD.is_anonymous, false) = true
     and coalesce(NEW.is_anonymous, false) = false
  then
    select
      identity_data ->> 'email',
      coalesce(
        identity_data ->> 'full_name',
        identity_data ->> 'name'
      )
    into v_email, v_name
    from auth.identities
    where user_id = NEW.id
    order by created_at asc
    limit 1;

    update public.profiles
    set
      email = coalesce(email, v_email),
      name  = coalesce(name,  v_name)
    where id = NEW.id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_identity_linked on auth.users;

create trigger on_identity_linked
after update of is_anonymous on auth.users
for each row
when (old.is_anonymous = true and new.is_anonymous = false)
execute function public.backfill_profile_from_identity();
