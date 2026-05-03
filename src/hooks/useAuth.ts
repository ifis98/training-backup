import { useUser, useClerk } from '@clerk/clerk-react';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SUPER_USERS = ['nbc1079@gmail.com', 'natasha@bytesense.ai', 'majid@bytesense.ai', 'john@bytesense.ai'];

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isByteSenseAdmin, setIsByteSenseAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const clerkUserId = user?.id ?? null;
  const email = (user?.primaryEmailAddress?.emailAddress ?? '').toLowerCase();

  useEffect(() => {
    if (!clerkUserId) {
      setIsAdmin(false);
      setIsByteSenseAdmin(false);
      setIsStaff(false);
      setProfile(null);
      setRolesLoaded(true);
      return;
    }

    (async () => {
      try {
        const [{ data: roleData }, { data: profileData }] = await Promise.all([
          supabase.from('user_roles').select('role').eq('clerk_user_id', clerkUserId),
          supabase.from('profiles').select('*').eq('clerk_user_id', clerkUserId).maybeSingle(),
        ]);

        setIsAdmin(roleData?.some(r => r.role === 'admin') ?? false);
        setIsByteSenseAdmin(roleData?.some(r => r.role === 'bytesense_admin') ?? false);
        setIsStaff(roleData?.some(r => r.role === 'staff') ?? false);
        setProfile(profileData ?? null);

        // Update last_seen_at (fire & forget)
        supabase.from('profiles')
          .upsert({ clerk_user_id: clerkUserId, last_seen_at: new Date().toISOString() }, { onConflict: 'clerk_user_id' })
          .then(() => {});
      } catch {
        // non-fatal
      } finally {
        setRolesLoaded(true);
      }
    })();
  }, [clerkUserId]);

  const signOut = useCallback(async () => {
    await clerkSignOut();
    setIsAdmin(false);
    setIsByteSenseAdmin(false);
    setIsStaff(false);
    setProfile(null);
  }, [clerkSignOut]);

  return {
    /** Clerk user mapped to the shape the rest of the app expects */
    user: user ? { id: clerkUserId!, email } : null,
    loading: !isLoaded || !rolesLoaded,
    isAdmin,
    isByteSenseAdmin,
    isStaff,
    profile,
    signOut,
    isSuperUser: SUPER_USERS.includes(email),
  };
}
