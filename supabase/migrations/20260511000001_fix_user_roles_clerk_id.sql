-- Fix user_roles table: add clerk_user_id column (text) for Clerk auth
-- The original table was created with user_id UUID NOT NULL (Supabase auth), not Clerk IDs.
-- This migration adds clerk_user_id and makes user_id nullable so we can insert Clerk-only rows.

-- Add clerk_user_id column if not already added
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Make old user_id column nullable (Clerk auth doesn't use Supabase UUIDs)
ALTER TABLE user_roles
  ALTER COLUMN user_id DROP NOT NULL;

-- Add unique constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_clerk_user_id_unique'
  ) THEN
    ALTER TABLE user_roles ADD CONSTRAINT user_roles_clerk_user_id_unique UNIQUE (clerk_user_id);
  END IF;
END $$;

-- Insert ByteSense admin role for john@bytesense.ai (Clerk user ID: user_3DGKZAJy2NkildFTcTm9nssAiPQ)
INSERT INTO user_roles (clerk_user_id, role)
VALUES ('user_3DGKZAJy2NkildFTcTm9nssAiPQ', 'bytesense_admin')
ON CONFLICT (clerk_user_id) DO NOTHING;
