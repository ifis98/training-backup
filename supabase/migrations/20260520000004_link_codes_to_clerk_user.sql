-- Track which Clerk user redeemed each registration code.
--
-- The legacy `used_by` column is uuid, which expected Supabase Auth's auth.uid().
-- Under Clerk auth that column is never populated. We add text-typed
-- companions so the post-signup intake flow can link the code to the
-- newly-created Clerk user + their primary email.
--
-- This is additive — no data is lost. Backfill is impossible (we never
-- recorded who redeemed historical codes).

ALTER TABLE public.registration_codes
  ADD COLUMN IF NOT EXISTS used_by_clerk_user_id text,
  ADD COLUMN IF NOT EXISTS used_by_email text;

CREATE INDEX IF NOT EXISTS registration_codes_used_by_clerk_user_id_idx
  ON public.registration_codes (used_by_clerk_user_id)
  WHERE used_by_clerk_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS registration_codes_used_by_email_idx
  ON public.registration_codes (used_by_email)
  WHERE used_by_email IS NOT NULL;
