import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

async function loadUserAccess(userId: string) {
  const [{ data: profileData }, { data: roleData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId),
  ]);

  return {
    profile: profileData,
    isAdmin: roleData?.some(r => r.role === 'admin') ?? false,
    isByteSenseAdmin: roleData?.some(r => r.role === 'bytesense_admin') ?? false,
    isStaff: roleData?.some(r => r.role === 'staff') ?? false,
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isByteSenseAdmin, setIsByteSenseAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer Supabase calls to avoid deadlocking the auth callback
          setTimeout(() => {
            loadUserAccess(session.user.id).then(access => {
              setProfile(access.profile);
              setIsAdmin(access.isAdmin);
              setIsByteSenseAdmin(access.isByteSenseAdmin);
              setIsStaff(access.isStaff);
              setLoading(false);
            }).catch(() => setLoading(false));
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsByteSenseAdmin(false);
          setIsStaff(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
        return;
      }

      loadUserAccess(session.user.id).then(access => {
        setProfile(access.profile);
        setIsAdmin(access.isAdmin);
        setIsByteSenseAdmin(access.isByteSenseAdmin);
        setIsStaff(access.isStaff);
        setLoading(false);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setIsByteSenseAdmin(false);
    setIsStaff(false);
  };

  return { user, session, loading, isAdmin, isByteSenseAdmin, isStaff, profile, signOut };
}
