-- Lock down pending_admin_invites: only the service-role edge functions
-- (claim-admin-invite, cancel-admin-invite list/cancel ops, invite-admin)
-- should read this table. The anon publishable key (shipped to every
-- browser) should NOT be able to enumerate pending admin emails.
--
-- Pre-requisite: deployed frontend no longer SELECTs this table directly
-- (Phase D edits to useAuth.ts and ByteSenseAdmin.tsx).

DROP POLICY IF EXISTS "anon can read pending invites" ON public.pending_admin_invites;
