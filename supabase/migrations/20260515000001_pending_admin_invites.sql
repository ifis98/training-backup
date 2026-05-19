-- Stores pending ByteSense admin invitations.
-- When an existing admin sends an invite, this table records the email + intended role.
-- On the new admin's first login, the claim-admin-invite edge function reads this,
-- inserts the user_roles row, and deletes the pending entry.

CREATE TABLE IF NOT EXISTS public.pending_admin_invites (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL,
  role       text        NOT NULL DEFAULT 'bytesense_admin',
  invited_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pending_admin_invites_email_unique UNIQUE (email)
);

-- RLS: reads are open to anon (the client-side claim check needs to read by email).
-- Writes (INSERT / DELETE) are only done via service-role edge functions.
ALTER TABLE public.pending_admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read pending invites"
  ON public.pending_admin_invites
  FOR SELECT
  TO anon
  USING (true);
