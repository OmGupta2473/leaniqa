-- Drop the legacy report TEXT column from weekly_reports.
--
-- Why: the pre-existing schema (20260624000000_rls_policies.sql) declared
-- `report TEXT NOT NULL` with no default. The new write path
-- (weeklyReportService.upsertWeek) does not use this column. Every insert
-- failed with Postgres error 23502 (not_null_violation) because the payload
-- had no value for it.
--
-- Safety: the table was empty (0 rows) at the time this migration was
-- written. The only code that ever referenced this column is
-- reportService.saveWeeklyReport, which has zero callers (verified in
-- Phase 0). The concept doc's "saved insights" field is now day_summaries
-- JSONB, so nothing of value is being lost.
--
-- No backfill, no NOT NULL relaxation. Clean removal.

ALTER TABLE public.weekly_reports DROP COLUMN report;