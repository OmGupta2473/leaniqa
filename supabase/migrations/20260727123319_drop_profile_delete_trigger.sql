-- Drop the trigger and function that deletes the auth.users row when a profiles row is deleted.
-- This was causing the "Reset Profile" feature to wipe the entire account (including all logs)
-- instead of just the profile data.

DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_profile_delete();
