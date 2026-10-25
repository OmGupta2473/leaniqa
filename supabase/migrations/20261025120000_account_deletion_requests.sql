create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now(),
  cancelled_at timestamptz,
  executed_at timestamptz,
  unique (user_id)
);

alter table public.deletion_requests enable row level security;

-- Users can read and insert their own row, but only for themselves.
create policy "Users can read own deletion request"
  on public.deletion_requests for select
  using (auth.uid() = user_id);

create policy "Users can insert own deletion request"
  on public.deletion_requests for insert
  with check (auth.uid() = user_id);

-- Cancel is an UPDATE that sets cancelled_at. Only the owner can do it.
create policy "Users can update own deletion request"
  on public.deletion_requests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role (cron in 1.5B) bypasses RLS automatically.

-- Index for the cron
create index if not exists deletion_requests_due_idx
  on public.deletion_requests (requested_at)
  where cancelled_at is null and executed_at is null;