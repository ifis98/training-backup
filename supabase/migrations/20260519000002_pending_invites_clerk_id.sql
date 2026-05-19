-- Track Clerk's invitation id alongside our pending invite row so that
-- cancel-admin-invite (and remove-admin's pending-cleanup branch) can call
-- Clerk's POST /v1/invitations/{id}/revoke and invalidate the email link
-- in addition to clearing our local row.

ALTER TABLE public.pending_admin_invites
  ADD COLUMN IF NOT EXISTS clerk_invitation_id text;

CREATE INDEX IF NOT EXISTS pending_admin_invites_clerk_invitation_id_idx
  ON public.pending_admin_invites (clerk_invitation_id)
  WHERE clerk_invitation_id IS NOT NULL;
