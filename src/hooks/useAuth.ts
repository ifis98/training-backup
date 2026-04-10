import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

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
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch profile and role
          setTimeout(async () => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            setProfile(profileData);

            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id);
            setIsAdmin(roleData?.some(r => r.role === 'admin') ?? false);
            setIsByteSenseAdmin(roleData?.some(r => r.role === 'bytesense_admin') ?? false);
            setIsStaff(roleData?.some(r => r.role === 'staff') ?? false);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsByteSenseAdmin(false);
          setIsStaff(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) setLoading(false);
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
