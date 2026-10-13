-- Extend weekly_reports for the new Sunday-first IST Weekly Report feature.
--
-- Preconditions (verified 2026-10-12):
--   * public.weekly_reports exists (created by 20260624000000_rls_policies.sql)
--   * It has columns: id, user_id, week_start, report
--   * It is EMPTY (0 rows), so NOT NULL columns are safe to add
--   * Its only index is the primary key on id
--   * RLS is enabled with a per-user policy
--
-- The legacy `report TEXT` column is left in place and is no longer written.
-- It will be dropped in a later migration once we are certain nothing reads it.
--
-- This migration is NOT idempotent by design. ADD CONSTRAINT will fail
-- loudly on a second apply, which is the correct behavior — silent success
-- on a duplicate apply is worse than a visible failure.

ALTER TABLE public.weekly_reports
  ADD COLUMN week_end DATE NOT NULL,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'live',
  ADD COLUMN days_with_meals INT NOT NULL DEFAULT 0,
  ADD COLUMN days_with_weight INT NOT NULL DEFAULT 0,
  ADD COLUMN total_calories NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN avg_calories NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN target_calories NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN total_protein_g NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN avg_protein_g NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN target_protein_g NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN total_carbs_g NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN avg_carbs_g NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN target_carbs_g NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN total_fat_g NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN avg_fat_g NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN target_fat_g NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN weekly_score INT NOT NULL DEFAULT 0,
  ADD COLUMN confidence TEXT NOT NULL DEFAULT 'empty',
  ADD COLUMN day_summaries JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN finalized_at TIMESTAMPTZ,
  ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.weekly_reports
  ADD CONSTRAINT weekly_reports_status_check
  CHECK (status IN ('live', 'final'));

ALTER TABLE public.weekly_reports
  ADD CONSTRAINT weekly_reports_confidence_check
  CHECK (confidence IN ('empty', 'insufficient', 'low', 'medium', 'high'));

ALTER TABLE public.weekly_reports
  ADD CONSTRAINT weekly_reports_user_id_week_start_key
  UNIQUE (user_id, week_start);

CREATE INDEX weekly_reports_user_week_idx
  ON public.weekly_reports (user_id, week_start DESC);