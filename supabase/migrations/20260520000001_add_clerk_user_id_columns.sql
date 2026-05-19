-- Schema-completeness fix for the Clerk migration.
--
-- The 20260503000001_clerk_schema.sql migration used `CREATE TABLE IF NOT
-- EXISTS` for tables that already existed (created in April migrations), so
-- the new clerk_user_id columns were never added to those existing tables.
-- The app code writes/reads `clerk_user_id` on these tables — which silently
-- fails or returns empty. Reality check: as of this migration, all of these
-- tables contain 0 rows in production.
--
-- Fix: additively add `clerk_user_id text` and drop the old NOT NULL on
-- `user_id` (since current code does not populate it). Backfill is a no-op
-- (no rows exist). This is fully reversible — no data is destroyed.

-- profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clerk_user_id text;
ALTER TABLE public.profiles
  ALTER COLUMN user_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_clerk_user_id_idx ON public.profiles (clerk_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_clerk_user_id_unique
  ON public.profiles (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

-- training_progress
ALTER TABLE public.training_progress
  ADD COLUMN IF NOT EXISTS clerk_user_id text;
ALTER TABLE public.training_progress
  ALTER COLUMN user_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS training_progress_clerk_user_id_unique
  ON public.training_progress (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

-- simulation_reviews
ALTER TABLE public.simulation_reviews
  ADD COLUMN IF NOT EXISTS clerk_user_id text;
ALTER TABLE public.simulation_reviews
  ALTER COLUMN user_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS simulation_reviews_clerk_user_id_idx ON public.simulation_reviews (clerk_user_id);

-- cases
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS clerk_user_id text;
ALTER TABLE public.cases
  ALTER COLUMN user_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS cases_clerk_user_id_idx ON public.cases (clerk_user_id);

-- support_bookings
ALTER TABLE public.support_bookings
  ADD COLUMN IF NOT EXISTS clerk_user_id text;
ALTER TABLE public.support_bookings
  ALTER COLUMN user_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS support_bookings_clerk_user_id_idx ON public.support_bookings (clerk_user_id);

-- staff_invitations: `invited_by` is the inviter's user id (uuid). Add a
-- clerk-typed counterpart so admin invite flows can populate from Clerk.
ALTER TABLE public.staff_invitations
  ADD COLUMN IF NOT EXISTS invited_by_clerk_user_id text;
ALTER TABLE public.staff_invitations
  ALTER COLUMN invited_by DROP NOT NULL;

-- practices: owner_id is uuid. Add a clerk counterpart so owner creation
-- from a Clerk session can record the owner.
ALTER TABLE public.practices
  ADD COLUMN IF NOT EXISTS owner_clerk_user_id text;
ALTER TABLE public.practices
  ALTER COLUMN owner_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS practices_owner_clerk_user_id_idx ON public.practices (owner_clerk_user_id);
