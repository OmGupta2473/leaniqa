-- Restore service_role table privileges across public. This project is missing
-- the grants that stock Supabase projects provision by default, confirmed by a
-- 42501 on meal_logs from a valid service_role JWT (2026-10-12).
--
-- Scope rationale:
--   * service_role is the server-only operator role. It never reaches the
--     browser, is never user-supplied, and is not shipped in any bundle.
--   * Supabase's own default is ALL on public for service_role. This migration
--     restores that, rather than inventing a narrower policy that would drift.
--   * The blast radius is "any future server task works," not "any browser
--     user gains access." Browser access is governed by anon + authenticated,
--     which are unchanged by this file.
--   * RLS still applies to anon/authenticated as before. service_role bypasses
--     RLS by design; that is the intended behavior of the role.
--
-- Grants are idempotent. ALTER DEFAULT PRIVILEGES ensures tables added by
-- future migrations also get service_role grants without a follow-up change.

-- Retroactive grants for everything currently in public.
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Forward-looking grants for future objects created by the current role.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES    TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO service_role;