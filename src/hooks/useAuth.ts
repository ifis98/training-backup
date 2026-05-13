import { useUser, useClerk } from '@clerk/clerk-react';
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
 */
export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const [roles, setRoles]       = useState<string[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const clerkUserId = user?.id ?? null;
  const email = (user?.primaryEmailAddress?.emailAddress ?? '').toLowerCase();

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUserId) { setRoles([]); setRolesLoaded(true); return; }

    supabase
      .from('user_roles')
      .select('role')
      .eq('clerk_user_id', clerkUserId)
      .then(({ data }) => {
        setRoles(data?.map(r => r.role) ?? []);
        setRolesLoaded(true);
      })
      .catch(() => setRolesLoaded(true));
  }, [clerkUserId, isLoaded]);

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
