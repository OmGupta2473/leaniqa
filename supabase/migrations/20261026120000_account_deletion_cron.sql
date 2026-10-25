-- Extensions required by pg_cron + pg_net.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Replace any previous schedule so re-running the migration is safe.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'execute-account-deletions') then
    perform cron.unschedule('execute-account-deletions');
  end if;
end $$;

-- Hourly at :00. Calls the edge function with the cron secret from Vault.
-- The secret is NOT in this file. Create it once, manually, with:
--   select vault.create_secret('<random-32+ bytes>', 'account_deletion_cron_secret');
select cron.schedule(
  'execute-account-deletions',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://hevkurreqyubqvpykisf.supabase.co/functions/v1/execute-account-deletions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret',
        (select decrypted_secret
           from vault.decrypted_secrets
          where name = 'account_deletion_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);