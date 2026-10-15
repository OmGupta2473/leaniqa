-- Phase 3.1: RevenueCat subscription tracking.
--
-- Adds the columns needed to activate a plan from a RevenueCat webhook and
-- to revert it to free when the paid period ends.
--
-- All columns are nullable so existing rows are unaffected. beta_pro rows
-- keep working via beta_expires_at; only rows with revenuecat_subscription_id
-- set are governed by current_period_end.
--
-- Rollback: ALTER TABLE public.subscriptions
--   DROP COLUMN revenuecat_customer_id,
--   DROP COLUMN revenuecat_subscription_id,
--   DROP COLUMN current_period_end,
--   DROP COLUMN billing_cycle;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS revenuecat_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS revenuecat_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT;

-- Billing cycle is monthly, annual, or NULL for free/beta rows.
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_billing_cycle_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_billing_cycle_check
  CHECK (billing_cycle IS NULL OR billing_cycle IN ('monthly', 'annual'));

-- One RevenueCat customer per user. Enforced only when set, so legacy rows
-- with NULL pass freely.
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_revenuecat_customer_id_key
  ON public.subscriptions (revenuecat_customer_id)
  WHERE revenuecat_customer_id IS NOT NULL;

-- ---------------------------------------------------------------
-- Idempotency table for RevenueCat webhook events.
-- RevenueCat retries failed webhooks; the event_id primary key guarantees
-- we process each event exactly once.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.revenuecat_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.revenuecat_webhook_events ENABLE ROW LEVEL SECURITY;

-- No user-facing policies. Only the service_role (used by the webhook edge
-- function) may read or write this table; service_role bypasses RLS by
-- default. Denying everything else is the correct behavior.