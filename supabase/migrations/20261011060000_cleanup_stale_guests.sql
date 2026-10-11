-- Delete anonymous users who have not been active in 30 days.
-- "Active" = has a meal in public.meals in the last 30 days.
-- Requires pg_cron (enabled by default on Supabase).
-- Runs daily at 03:00 IST (21:30 UTC).
-- Cascades to public.profiles / public.meals via ON DELETE CASCADE FKs.

create or replace function public.cleanup_stale_guests()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users u
  where u.is_anonymous = true
    and u.created_at < now() - interval '30 days'
    and not exists (
      select 1
      from public.meals m
      where m.user_id = u.id
        and m.meal_time > now() - interval '30 days'
    );
end;
$$;

do $outer$
begin
  if not exists (
    select 1 from cron.job where jobname = 'cleanup-stale-guests'
  ) then
    perform cron.schedule(
      'cleanup-stale-guests',
      '30 21 * * *',
      $inner$select public.cleanup_stale_guests();$inner$
    );
  end if;
end;
$outer$;