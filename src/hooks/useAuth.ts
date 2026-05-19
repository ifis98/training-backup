import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Role-based access via Supabase `user_roles` table.
 *
 * To grant a role, insert a row in the Supabase Table Editor (or via the admin UI):
 *   user_roles: { clerk_user_id: '<clerk_user_id>', role: '...' }
 *
 *   'admin'          → Practice owner. Owner dashboard.
 *   'staff'          → Practice staff. Staff dashboard only.
 *   'bytesense_admin'→ Internal admin panel (/bytesense-admin).
 *   (no row)         → Owner dashboard by default (same as admin).
 *
 * The `clerk_user_id` column stores the Clerk user ID (e.g. "user_2abc123...").
 *
 * Invite flow: when an admin sends an invite via /bytesense-admin, the
 * `invite-admin` edge function stores a row in `pending_admin_invites`. On the
 * invitee's first login this hook detects the pending invite and calls
 * `claim-admin-invite` to assign the bytesense_admin role automatically.
 */
export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const { getToken } = useClerkAuth();

  const [roles, setRoles]       = useState<string[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const clerkUserId = user?.id ?? null;
  const email = (user?.primaryEmailAddress?.emailAddress ?? '').toLowerCase();

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUserId || !email) { setRoles([]); setRolesLoaded(true); return; }

    supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', clerkUserId)
      .then(async ({ data }) => {
        const existingRoles = data?.map(r => r.role) ?? [];

        // If already a bytesense_admin, no need to check pending invites.
        if (existingRoles.includes('bytesense_admin')) {
          setRoles(existingRoles);
          setRolesLoaded(true);
          return;
        }

        // Call claim-admin-invite unconditionally. The function looks up the
        // pending invite server-side (with service role, bypassing the
        // soon-to-be-locked-down RLS) and returns { success: false } when no
        // pending invite exists. No need for a direct SELECT here.
        try {
          const clerkToken = await getToken().catch(() => null);
          const { data: claimResult } = await supabase.functions.invoke('claim-admin-invite', {
            body: { email, clerkUserId },
            headers: clerkToken ? { 'X-Clerk-Token': clerkToken } : undefined,
          });
          if (claimResult?.success && claimResult?.role) {
            setRoles([...existingRoles, claimResult.role]);
            setRolesLoaded(true);
            return;
          }
        } catch {
          // Non-fatal — fall through and set whatever roles we have.
        }

        setRoles(existingRoles);
        setRolesLoaded(true);
      })
      .catch(() => setRolesLoaded(true));
  }, [clerkUserId, email, isLoaded]);

  const isAdmin          = roles.includes('admin');
  const isStaff          = roles.includes('staff');
  const isByteSenseAdmin = roles.includes('bytesense_admin');

  const signOut = useCallback(async () => {
    await clerkSignOut();
  }, [clerkSignOut]);

  return {
    user: user ? { id: clerkUserId!, email } : null,
    loading: !isLoaded || !rolesLoaded,
    isAdmin,
    isByteSenseAdmin,
    isStaff,
    signOut,
  };
}
