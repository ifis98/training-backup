-- Fix: 20260520000001 created PARTIAL unique indexes
--   CREATE UNIQUE INDEX ... ON table (clerk_user_id) WHERE clerk_user_id IS NOT NULL
-- But PostgREST's `on_conflict=clerk_user_id` parameter requires a non-partial
-- unique constraint to satisfy ON CONFLICT (42P10 otherwise). Result: all
-- training_progress / profiles upserts from the frontend are failing.
--
-- Replace partial indexes with full unique constraints. All affected tables
-- currently have 0 rows, so there are no NULL duplicates to worry about.

-- training_progress
DROP INDEX IF EXISTS public.training_progress_clerk_user_id_unique;
ALTER TABLE public.training_progress
  ADD CONSTRAINT training_progress_clerk_user_id_key UNIQUE (clerk_user_id);

-- profiles
DROP INDEX IF EXISTS public.profiles_clerk_user_id_unique;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_clerk_user_id_key UNIQUE (clerk_user_id);
