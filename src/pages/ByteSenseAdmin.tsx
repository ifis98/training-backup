import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { C } from '@/data/constants';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import {
  LayoutDashboard, KeyRound, Building2, Inbox, Settings, LogOut,
  Search, Copy, Download, ChevronRight, Activity, Trophy, Mail, Shield, X,
  AlertTriangle, LifeBuoy, RefreshCw, Users,
} from 'lucide-react';

interface RegCode {
  id: string; code: string; practice_name: string; rep_name: string;
  status: string; expires_at: string; used_by: string | null; used_at: string | null; created_at: string;
}
interface DemoReq {
  id: string; name: string; email: string; practice_name: string; phone: string;
  message: string; status: string; created_at: string; admin_notes?: string;
  operatories?: number; monthly_patients?: number; guards_per_month?: number;
  guard_price?: number; has_scanner?: boolean; scanner_type?: string; goals?: string[]; practice_size?: string;
}

const glass: React.CSSProperties = {
  background: 'var(--bs-glass)', backdropFilter: C.blur, WebkitBackdropFilter: C.blur,
  border: `1px solid ${'var(--bs-border)'}`, borderRadius: C.radius,
};
const tooltipStyle = { background: 'var(--bs-glass)', border: `1px solid ${'var(--bs-border)'}`, borderRadius: C.radiusSm, fontSize: 12 };

const copyToClipboard = (text: string, label = 'Copied') => {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label}: ${text}`)).catch(() => toast.error('Copy failed'));
};

type TabId = 'overview' | 'codes' | 'practices' | 'users' | 'demos' | 'settings';

interface ClerkUserRow {
  clerk_user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  created_at: string | null;
  last_active_at: string | null;
  roles: string[];
  full_name: string | null;
  practice_id: string | null;
  practice_name: string | null;
  intake_done: boolean;
  done_modules: string[];
  module_count: number;
  xp: number;
  training_updated_at: string | null;
  training_completed_at: string | null;
}
type ExtendedTab = TabId | 'alerts' | 'support';

interface AdminAlert {
  id: string; type: string; severity: string; title: string; body: string;
  status: string; practice_id: string | null; target_user_id: string | null;
  assigned_to: string | null; admin_notes: string; next_step: string;
  follow_up_at: string | null; created_at: string; resolved_at: string | null;
}
interface SupportBooking {
  id: string; user_id: string; name: string; email: string;
  booking_date: string; booking_time: string; notes: string;
  status: string; triage_status: string; assigned_to: string | null;
  admin_notes: string; follow_up_at: string | null; created_at: string;
}

export default function ByteSenseAdmin() {
  const { user, loading: authLoading, signOut, isByteSenseAdmin } = useAuth();
  const navigate = useNavigate();
  // All bytesense_admin users are internal staff — always route to /owner dashboard
  const appDashboardPath = '/owner';
  const [isBSAdmin, setIsBSAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<ExtendedTab>('overview');
  const [globalSearch, setGlobalSearch] = useState('');

  const [codes, setCodes] = useState<RegCode[]>([]);
  const [practices, setPractices] = useState<any[]>([]);
  const [demos, setDemos] = useState<DemoReq[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [bookings, setBookings] = useState<SupportBooking[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AdminAlert | null>(null);
  const [alertFilter, setAlertFilter] = useState<'all' | 'open' | 'snoozed' | 'resolved'>('open');
  const [runningMonitor, setRunningMonitor] = useState(false);

  // Codes form
  const [newPracticeName, setNewPracticeName] = useState('');
  const [newRepName, setNewRepName] = useState('');
  const [batchCount, setBatchCount] = useState(1);
  const [codeFilter, setCodeFilter] = useState<'all' | 'active' | 'used' | 'expired' | 'revoked'>('all');
  const [codePage, setCodePage] = useState(0);

  // Practices
  const [practiceSearch, setPracticeSearch] = useState('');
  const [expandedPractice, setExpandedPractice] = useState<string | null>(null);

  // Demos
  const [demoFilter, setDemoFilter] = useState<'all' | 'new' | 'contacted' | 'converted' | 'rejected'>('all');
  const [expandedDemo, setExpandedDemo] = useState<string | null>(null);
  const [demoNotes, setDemoNotes] = useState<Record<string, string>>({});

  // Settings
  const [inviteEmail, setInviteEmail] = useState('');
  const [removingAdminId, setRemovingAdminId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Array<{ id: string; email: string; role: string; invited_at: string }>>([]);
  const [cancelingInviteEmail, setCancelingInviteEmail] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [promotingClerkId, setPromotingClerkId] = useState<string | null>(null);

  // Users tab — paginated, searchable list of all Clerk users
  const [clerkUsers, setClerkUsers] = useState<ClerkUserRow[]>([]);
  const [clerkUsersTotal, setClerkUsersTotal] = useState(0);
  const [clerkUsersLoading, setClerkUsersLoading] = useState(false);
  const [clerkUsersError, setClerkUsersError] = useState<string | null>(null);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersDebouncedSearch, setUsersDebouncedSearch] = useState('');
  const [usersPage, setUsersPage] = useState(0);
  const USERS_PAGE_SIZE = 50;

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }
    // Role is now determined from Clerk publicMetadata via useAuth
    const allowed = isByteSenseAdmin;
    setIsBSAdmin(allowed);
    setChecking(false);
    if (!allowed) { toast.error('Access denied'); navigate('/app'); }
  }, [user, authLoading, isByteSenseAdmin, navigate]);

  const loadData = useCallback(async () => {
    // registration_codes RLS is locked to service-role only, so we read it
    // through the admin-gated edge function instead of a direct query
    // (the direct query silently returns [] under the anon key).
    // Tables with broken-since-Clerk RLS are read through admin-gated edge functions
    // (direct anon queries silently return [] because the old policies key off auth.uid()).
    const codesPromise = user?.id
      ? supabase.functions.invoke('manage-registration-codes', { body: { op: 'list', requesterClerkId: user.id } })
      : Promise.resolve({ data: null, error: null } as { data: { success: boolean; codes?: RegCode[]; error?: string } | null; error: { message: string } | null });
    const demosPromise = user?.id
      ? supabase.functions.invoke('manage-demo-requests', { body: { op: 'list', requesterClerkId: user.id } })
      : Promise.resolve({ data: null, error: null } as { data: { success: boolean; demos?: DemoReq[]; error?: string } | null; error: { message: string } | null });
    const practicesPromise = user?.id
      ? supabase.functions.invoke('manage-practices', { body: { op: 'list', requesterClerkId: user.id } })
      : Promise.resolve({ data: null, error: null } as { data: any; error: any });
    const alertsPromise = user?.id
      ? supabase.functions.invoke('manage-admin-alerts', { body: { op: 'list', requesterClerkId: user.id } })
      : Promise.resolve({ data: null, error: null } as { data: any; error: any });
    const bookingsPromise = user?.id
      ? supabase.functions.invoke('manage-support-bookings', { body: { op: 'list', requesterClerkId: user.id } })
      : Promise.resolve({ data: null, error: null } as { data: any; error: any });
    const pendingInvitesPromise = user?.id
      ? supabase.functions.invoke('cancel-admin-invite', { body: { op: 'list', requesterClerkId: user.id } })
      : Promise.resolve({ data: null, error: null } as { data: any; error: any });

    const [codesRes, practicesRes, demosRes, adminRolesRes, alertsRes, bookingsRes, pendingRes] = await Promise.all([
      codesPromise,
      practicesPromise,
      demosPromise,
      supabase.from('user_roles').select('clerk_user_id').eq('role', 'bytesense_admin'),
      alertsPromise,
      bookingsPromise,
      pendingInvitesPromise,
    ]);
    if (pendingRes?.data?.success && Array.isArray(pendingRes.data.invites)) {
      setPendingInvites(pendingRes.data.invites as any);
    } else if (pendingRes?.data?.error) {
      console.warn('pending invites list error:', pendingRes.data.error);
    }
    if (codesRes?.data?.success && Array.isArray(codesRes.data.codes)) {
      setCodes(codesRes.data.codes as RegCode[]);
    } else if (codesRes?.data?.error) {
      console.warn('manage-registration-codes list error:', codesRes.data.error);
    } else if (codesRes?.error) {
      console.warn('manage-registration-codes invoke error:', codesRes.error.message);
    }
    if (practicesRes?.data?.success && Array.isArray(practicesRes.data.practices)) {
      setPractices(practicesRes.data.practices);
    } else if (practicesRes?.data?.error) {
      console.warn('manage-practices list error:', practicesRes.data.error);
    }
    if (alertsRes?.data?.success && Array.isArray(alertsRes.data.alerts)) {
      setAlerts(alertsRes.data.alerts as AdminAlert[]);
    } else if (alertsRes?.data?.error) {
      console.warn('manage-admin-alerts list error:', alertsRes.data.error);
    }
    if (bookingsRes?.data?.success && Array.isArray(bookingsRes.data.bookings)) {
      setBookings(bookingsRes.data.bookings as SupportBooking[]);
    } else if (bookingsRes?.data?.error) {
      console.warn('manage-support-bookings list error:', bookingsRes.data.error);
    }
    if (demosRes?.data?.success && Array.isArray(demosRes.data.demos)) {
      const demosArr = demosRes.data.demos as DemoReq[];
      setDemos(demosArr);
      const notes: Record<string, string> = {};
      demosArr.forEach(d => { notes[d.id] = d.admin_notes || ''; });
      setDemoNotes(notes);
    }
    if (adminRolesRes.data) {
      const clerkIds = adminRolesRes.data.map(r => r.clerk_user_id).filter(Boolean);
      if (clerkIds.length) {
        const { data: profs } = await supabase.from('profiles').select('clerk_user_id, full_name, created_at').in('clerk_user_id', clerkIds);
        const profileMap = Object.fromEntries((profs || []).map(p => [p.clerk_user_id, p]));

        // Enrich with Clerk names/emails — Clerk is the source of truth for identity
        try {
          const { data: clerkData } = await supabase.functions.invoke('get-admin-users', {
            body: { clerkIds },
          });
          if (clerkData?.success && Array.isArray(clerkData.users)) {
            const clerkMap = Object.fromEntries(clerkData.users.map((u: any) => [u.clerk_user_id, u]));
            setAdmins(clerkIds.map(id => ({
              clerk_user_id: id,
              full_name: clerkMap[id]?.firstName
                ? `${clerkMap[id].firstName} ${clerkMap[id].lastName || ''}`.trim()
                : (profileMap[id]?.full_name ?? null),
              email: clerkMap[id]?.email ?? null,
              created_at: profileMap[id]?.created_at ?? null,
            })));
            return;
          }
        } catch { /* fall through to profiles-only data */ }

        // Fallback: profiles only (no Clerk data available)
        setAdmins(clerkIds.map(id => profileMap[id] || { clerk_user_id: id, full_name: null, email: null, created_at: null }));
      } else {
        setAdmins([]);
      }
    }
  }, [user?.id]);

  useEffect(() => { if (isBSAdmin) loadData(); }, [isBSAdmin, loadData]);

  // Debounce the search input for the Users tab so we don't hit Clerk on every keystroke
  useEffect(() => {
    const t = setTimeout(() => { setUsersDebouncedSearch(usersSearch); setUsersPage(0); }, 350);
    return () => clearTimeout(t);
  }, [usersSearch]);

  // Load Clerk users when the Users tab is active, paging or search changes
  useEffect(() => {
    if (!isBSAdmin || tab !== 'users' || !user?.id) return;
    let cancelled = false;
    setClerkUsersLoading(true);
    setClerkUsersError(null);
    supabase.functions.invoke('list-clerk-users', {
      body: {
        requesterClerkId: user.id,
        query: usersDebouncedSearch || undefined,
        limit: USERS_PAGE_SIZE,
        offset: usersPage * USERS_PAGE_SIZE,
      },
    }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setClerkUsersError(error.message || 'Failed to load users'); return; }
      if (!data?.success) { setClerkUsersError(data?.error || 'Failed to load users'); return; }
      setClerkUsers(data.users || []);
      setClerkUsersTotal(Number(data.totalCount || 0));
    }).catch(err => { if (!cancelled) setClerkUsersError(String(err)); })
      .finally(() => { if (!cancelled) setClerkUsersLoading(false); });
    return () => { cancelled = true; };
  }, [isBSAdmin, tab, user?.id, usersDebouncedSearch, usersPage]);

  // Realtime subscription on admin_alerts. The postgres_changes event still
  // fires regardless of RLS; we use it as a "something changed" signal and
  // refresh the list via the admin-gated function (since direct SELECT
  // returns [] under the broken-since-Clerk auth.uid() RLS).
  useEffect(() => {
    if (!isBSAdmin || !user?.id) return;
    const refresh = () => {
      supabase.functions.invoke('manage-admin-alerts', { body: { op: 'list', requesterClerkId: user.id } })
        .then(({ data }) => {
          if (data?.success && Array.isArray(data.alerts)) setAlerts(data.alerts as AdminAlert[]);
        });
    };
    const channel = supabase.channel('admin_alerts_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_alerts' }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isBSAdmin, user?.id]);

  const runHealthMonitor = async () => {
    setRunningMonitor(true);
    try {
      const { error } = await supabase.functions.invoke('health-monitor');
      if (error) throw error;
      toast.success('Health scan complete');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Scan failed');
    } finally {
      setRunningMonitor(false);
    }
  };

  const updateAlert = async (id: string, patch: Partial<AdminAlert>) => {
    if (!user?.id) { toast.error('Not authenticated'); return; }
    const { error, data } = await supabase.functions.invoke('manage-admin-alerts', {
      body: { op: 'update', id, patch, requesterClerkId: user.id },
    });
    if (error) { toast.error(error.message || 'Failed to reach alerts function'); return; }
    if (!data?.success) { toast.error(data?.error || 'Update failed'); return; }
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
    if (selectedAlert?.id === id) setSelectedAlert(prev => prev ? { ...prev, ...patch } as AdminAlert : prev);
  };

  const resolveAlert = (id: string) => updateAlert(id, { status: 'resolved', resolved_at: new Date().toISOString() } as any);
  const snoozeAlert = (id: string) => updateAlert(id, { status: 'snoozed' });
  const reopenAlert = (id: string) => updateAlert(id, { status: 'open', resolved_at: null } as any);

  const updateBooking = async (id: string, patch: Partial<SupportBooking>) => {
    if (!user?.id) { toast.error('Not authenticated'); return; }
    const { error, data } = await supabase.functions.invoke('manage-support-bookings', {
      body: { op: 'update', id, patch, requesterClerkId: user.id },
    });
    if (error) { toast.error(error.message || 'Failed to reach bookings function'); return; }
    if (!data?.success) { toast.error(data?.error || 'Update failed'); return; }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  };

  const generateCodes = async () => {
    if (!newPracticeName.trim()) { toast.error('Practice name required'); return; }
    if (!user?.id) { toast.error('Not authenticated'); return; }
    try {
      const { error, data } = await supabase.functions.invoke('manage-registration-codes', {
        body: {
          op: 'generate',
          practiceName: newPracticeName.trim(),
          repName: newRepName.trim(),
          count: batchCount,
          requesterClerkId: user.id,
        },
      });
      if (error) throw new Error(error.message || 'Failed to reach code function');
      if (!data?.success) throw new Error(data?.error || 'Failed to generate codes');
      toast.success(`${data.count} code(s) generated!`);
      setNewPracticeName(''); setNewRepName(''); setBatchCount(1); loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const revokeCode = async (id: string) => {
    if (!user?.id) { toast.error('Not authenticated'); return; }
    try {
      const { error, data } = await supabase.functions.invoke('manage-registration-codes', {
        body: { op: 'revoke', id, requesterClerkId: user.id },
      });
      if (error) throw new Error(error.message || 'Failed to reach code function');
      if (!data?.success) throw new Error(data?.error || 'Failed to revoke code');
      toast.success('Code revoked');
      loadData();
    } catch (err: any) { toast.error(err.message || 'Failed to revoke code'); }
  };

  const updateDemoStatus = async (id: string, status: string) => {
    if (!user?.id) { toast.error('Not authenticated'); return; }
    const { error, data } = await supabase.functions.invoke('manage-demo-requests', {
      body: { op: 'update', id, patch: { status }, requesterClerkId: user.id },
    });
    if (error) { toast.error(error.message || 'Failed to reach demo function'); return; }
    if (!data?.success) { toast.error(data?.error || 'Update failed'); return; }
    setDemos(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    toast.success(`Status → ${status}`);
  };

  const saveDemoNotes = async (id: string) => {
    if (!user?.id) { toast.error('Not authenticated'); return; }
    const { error, data } = await supabase.functions.invoke('manage-demo-requests', {
      body: { op: 'update', id, patch: { admin_notes: demoNotes[id] || '' }, requesterClerkId: user.id },
    });
    if (error) { toast.error(error.message || 'Failed to reach demo function'); return; }
    if (!data?.success) { toast.error(data?.error || 'Save failed'); return; }
    toast.success('Notes saved');
  };

  const convertDemo = async (d: DemoReq) => {
    if (!user?.id) { toast.error('Not authenticated'); return; }
    try {
      const { error: codeErr, data: codeData } = await supabase.functions.invoke('manage-registration-codes', {
        body: {
          op: 'generate',
          // If d.practice_name is empty, use d.name as the practice (and leave rep blank).
          // Otherwise: practice_name = practice, rep_name = the demo requester's name
          // so the code row shows "<Practice> · <Requester>".
          practiceName: d.practice_name || d.name,
          repName: d.practice_name ? d.name : '',
          count: 1,
          requesterClerkId: user.id,
        },
      });
      if (codeErr) throw new Error(codeErr.message || 'Failed to reach code function');
      if (!codeData?.success) throw new Error(codeData?.error || 'Failed to generate code');

      const { error: updErr, data: updData } = await supabase.functions.invoke('manage-demo-requests', {
        body: { op: 'update', id: d.id, patch: { status: 'converted' }, requesterClerkId: user.id },
      });
      if (updErr) throw new Error(updErr.message || 'Failed to reach demo function');
      if (!updData?.success) throw new Error(updData?.error || 'Failed to mark converted');

      toast.success('Code generated + demo marked converted');
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const exportCodesCSV = () => {
    const rows = filteredCodes;
    const csv = [
      ['Code', 'Practice', 'Rep', 'Status', 'Created', 'Expires', 'Used At'].join(','),
      ...rows.map(c => [c.code, `"${c.practice_name}"`, `"${c.rep_name || ''}"`, c.status, c.created_at, c.expires_at, c.used_at || ''].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bytesense-codes-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} codes`);
  };

  const inviteAdmin = async () => {
    if (!inviteEmail.trim()) { toast.error('Enter an email'); return; }
    if (!user?.id) { toast.error('Not authenticated'); return; }
    const targetEmail = inviteEmail.trim().toLowerCase();
    try {
      const { error, data } = await supabase.functions.invoke('invite-admin', {
        body: { email: targetEmail, inviterClerkId: user.id },
      });
      if (error) throw new Error(error.message || 'Failed to reach invite function');
      if (!data?.success) throw new Error(data?.error || 'Invite failed');

      if (data.mode === 'direct_grant') {
        toast.success(`${targetEmail} already has an account — admin role granted directly. They'll see it on next sign-in or page refresh.`);
      } else if (data.clerkEmailSent) {
        toast.success(`Invite email sent to ${targetEmail}. They'll receive a sign-up link and get admin access automatically on first login.`);
      } else if (data.clerkAlreadyInvited) {
        toast.success(`${targetEmail} already has a pending Clerk invitation — no new email sent. Pending invite recorded; resend from Clerk dashboard or share ${window.location.origin}/register manually.`);
      } else {
        const detail = data.clerkErrorDetail ? String(data.clerkErrorDetail).slice(0, 300) : 'no detail returned';
        toast.error(`Pending invite recorded for ${targetEmail}, BUT Clerk did NOT send the email.\n\nClerk said: ${detail}\n\nShare ${window.location.origin}/register manually for now.`, { duration: 20000 });
        console.warn('invite-admin clerk error:', data);
      }
      setInviteEmail('');
      loadData();
    } catch (err: any) { toast.error(err.message || 'Failed to send invite'); }
  };

  const cancelPendingInvite = async (email: string) => {
    if (!user?.id) { toast.error('Not authenticated'); return; }
    setCancelingInviteEmail(email);
    try {
      const { error, data } = await supabase.functions.invoke('cancel-admin-invite', {
        body: { email, requesterClerkId: user.id },
      });
      if (error) throw new Error(error.message || 'Failed to reach cancel function');
      if (!data?.success) throw new Error(data?.error || 'Cancel failed');
      if (data.clerkRevoked) {
        toast.success(`Cancelled invite for ${email} — Clerk email link is now revoked.`);
      } else if (data.clerkRevokeError) {
        toast.success(`Cancelled invite for ${email} in our database. Note: Clerk side could not be revoked — ${String(data.clerkRevokeError).slice(0, 160)}`, { duration: 12000 });
      } else {
        toast.success(`Pending invite for ${email} cancelled`);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel invite');
    } finally {
      setCancelingInviteEmail(null);
    }
  };

  const makeAdmin = async (targetClerkId: string, email: string | null) => {
    if (!user?.id) { toast.error('Not authenticated'); return; }
    if (!email) { toast.error('User has no email on file'); return; }
    setPromotingClerkId(targetClerkId);
    try {
      const { data, error } = await supabase.functions.invoke('invite-admin', {
        body: { email, inviterClerkId: user.id },
      });
      if (error) throw new Error(error.message || 'Failed to reach invite function');
      if (!data?.success) throw new Error(data?.error || 'Promote failed');
      // Only celebrate when the function actually granted the role. If it
      // fell through to the pending-invite path (e.g. Clerk lookup didn't
      // find the user), the role was NOT granted — surface that honestly.
      if (data.mode !== 'direct_grant') {
        toast.error(`Could not promote ${email}: ${data.lookupErrorDetail || data.clerkErrorDetail || 'Clerk user not found'}. They need to sign in at least once first.`, { duration: 12000 });
        return;
      }
      toast.success(`${email} is now a bytesense_admin`);
      // Refresh both the Users tab list and the Current Admins list
      const { data: refreshData } = await supabase.functions.invoke('list-clerk-users', {
        body: { requesterClerkId: user.id, query: usersDebouncedSearch || undefined, limit: USERS_PAGE_SIZE, offset: usersPage * USERS_PAGE_SIZE },
      });
      if (refreshData?.success) {
        setClerkUsers(refreshData.users || []);
        setClerkUsersTotal(Number(refreshData.totalCount || 0));
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to promote');
    } finally {
      setPromotingClerkId(null);
    }
  };

  const removeClerkUser = async (targetClerkId: string) => {
    if (!user?.id) { toast.error('Not authenticated'); return; }
    setDeletingUserId(targetClerkId);
    try {
      const { error, data } = await supabase.functions.invoke('delete-clerk-user', {
        body: { targetClerkId, requesterClerkId: user.id },
      });
      if (error) throw new Error(error.message || 'Failed to reach delete function');
      if (!data?.success) throw new Error(data?.error || 'Delete failed');
      if (data.clerkDeleted) {
        toast.success('User deleted from Clerk + all associated data removed');
      } else {
        toast.success(`Supabase rows cleaned, but Clerk deletion failed — ${String(data.clerkErrorDetail || 'unknown').slice(0, 160)}`, { duration: 12000 });
      }
      setConfirmDeleteUserId(null);
      // Refresh the users list
      const { data: refreshData } = await supabase.functions.invoke('list-clerk-users', {
        body: { requesterClerkId: user.id, query: usersDebouncedSearch || undefined, limit: USERS_PAGE_SIZE, offset: usersPage * USERS_PAGE_SIZE },
      });
      if (refreshData?.success) {
        setClerkUsers(refreshData.users || []);
        setClerkUsersTotal(Number(refreshData.totalCount || 0));
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const removeAdmin = async (targetClerkId: string) => {
    if (!user?.id) { toast.error('Not authenticated'); return; }
    setRemovingAdminId(targetClerkId);
    try {
      const { error, data } = await supabase.functions.invoke('remove-admin', {
        body: { targetClerkId, requesterClerkId: user.id },
      });
      if (error) throw new Error(error.message || 'Failed to reach remove function');
      if (!data?.success) throw new Error(data?.error || 'Remove failed');
      toast.success('Admin access removed');
      setConfirmRemoveId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove admin');
    } finally {
      setRemovingAdminId(null);
    }
  };

  const sendChangePassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message); else toast.success('Reset link sent to your email');
  };

  // ----- Derived data -----
  const activeCodes = codes.filter(c => c.status === 'active').length;
  const pendingDemos = demos.filter(d => d.status === 'new').length;
  const totalStaff = practices.reduce((a: number, p: any) => a + (p.profiles?.length || 0), 0);
  const codesUsed30d = codes.filter(c => c.status === 'used' && c.used_at && (Date.now() - new Date(c.used_at).getTime()) < 30 * 86400000).length;
  const conversionRate = demos.length ? Math.round((demos.filter(d => d.status === 'converted').length / demos.length) * 100) : 0;

  const filteredCodes = useMemo(() => {
    const q = globalSearch.toLowerCase();
    return codes
      .filter(c => codeFilter === 'all' || c.status === codeFilter)
      .filter(c => !q || c.code.toLowerCase().includes(q) || c.practice_name.toLowerCase().includes(q) || (c.rep_name || '').toLowerCase().includes(q));
  }, [codes, codeFilter, globalSearch]);

  const pagedCodes = filteredCodes.slice(codePage * 50, codePage * 50 + 50);
  const totalCodePages = Math.ceil(filteredCodes.length / 50);

  const filteredPractices = useMemo(() => {
    const q = (practiceSearch || globalSearch).toLowerCase();
    if (!q) return practices;
    return practices.filter((p: any) => (p.name || '').toLowerCase().includes(q) || (p.practice_code || '').toLowerCase().includes(q));
  }, [practices, practiceSearch, globalSearch]);

  const filteredDemos = useMemo(() => {
    const q = globalSearch.toLowerCase();
    return demos
      .filter(d => demoFilter === 'all' || d.status === demoFilter)
      .filter(d => !q || d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q) || (d.practice_name || '').toLowerCase().includes(q));
  }, [demos, demoFilter, globalSearch]);

  const recentActivity = useMemo(() => {
    const events: Array<{ ts: string; type: string; label: string; color: string }> = [];
    codes.slice(0, 10).forEach(c => events.push({ ts: c.created_at, type: 'code', label: `Code ${c.code} generated for ${c.practice_name}`, color: C.gold }));
    codes.filter(c => c.used_at).slice(0, 10).forEach(c => events.push({ ts: c.used_at!, type: 'used', label: `Code ${c.code} used`, color: C.teal }));
    demos.slice(0, 10).forEach(d => events.push({ ts: d.created_at, type: 'demo', label: `Demo request from ${d.name}${d.practice_name ? ' (' + d.practice_name + ')' : ''}`, color: C.amber }));
    practices.slice(0, 10).forEach((p: any) => events.push({ ts: p.created_at, type: 'practice', label: `Practice "${p.name}" registered`, color: C.green }));
    admins.slice(0, 10).forEach((a: any) => { if (a.created_at) events.push({ ts: a.created_at, type: 'staff', label: `ByteSense staff joined: ${a.full_name || a.email || 'Admin'}`, color: C.red }); });
    return events.sort((a, b) => +new Date(b.ts) - +new Date(a.ts)).slice(0, 10);
  }, [codes, demos, practices, admins]);

  const topPractices = useMemo(() => {
    return practices
      .map((p: any) => ({
        name: p.name,
        modules: p.training_progress?.reduce((s: number, tp: any) => s + (tp.done_modules?.length || 0), 0) || 0,
        staff: p.profiles?.length || 0,
      }))
      .sort((a, b) => b.modules - a.modules)
      .slice(0, 5);
  }, [practices]);

  const practiceChartData = practices.slice(0, 8).map((p: any) => ({
    name: (p.name || '').substring(0, 10),
    staff: p.profiles?.length || 0,
  }));

  const demoStatusData = [
    { name: 'New', value: demos.filter(d => d.status === 'new').length, color: C.amber },
    { name: 'Contacted', value: demos.filter(d => d.status === 'contacted').length, color: C.teal },
    { name: 'Converted', value: demos.filter(d => d.status === 'converted').length, color: C.green },
    { name: 'Rejected', value: demos.filter(d => d.status === 'rejected').length, color: C.slate },
  ].filter(d => d.value > 0);

  const codeStatusData = [
    { name: 'Active', value: codes.filter(c => c.status === 'active').length, color: C.green },
    { name: 'Used', value: codes.filter(c => c.status === 'used').length, color: C.teal },
    { name: 'Expired', value: codes.filter(c => c.status === 'expired').length, color: C.amber },
    { name: 'Revoked', value: codes.filter(c => c.status === 'revoked').length, color: C.red },
  ].filter(d => d.value > 0);

  if (authLoading || checking) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bs-bg)', color: 'var(--bs-ash)', fontFamily: C.fn }}>Loading…</div>;
  }

  const inputStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: 14, fontFamily: C.fn,
    border: `1px solid ${'var(--bs-border)'}`, background: 'var(--bs-card)', color: 'var(--bs-text)',
    outline: 'none', boxSizing: 'border-box', width: '100%', borderRadius: C.radiusSm,
  };

  const statusColor = (s: string) => s === 'active' ? C.green : s === 'used' ? C.teal : s === 'expired' ? C.amber : s === 'revoked' ? C.red : s === 'new' ? C.amber : s === 'contacted' ? C.teal : s === 'converted' ? C.green : s === 'rejected' ? C.slate : C.ash;

  const openAlertCount = alerts.filter(a => a.status === 'open').length;
  const unassignedBookings = bookings.filter(b => !b.assigned_to && b.triage_status !== 'resolved').length;
  const navItems: Array<{ id: ExtendedTab; label: string; icon: any; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: openAlertCount },
    { id: 'support', label: 'Support Inbox', icon: LifeBuoy, badge: unassignedBookings },
    { id: 'codes', label: 'Codes', icon: KeyRound },
    { id: 'practices', label: 'Practices', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'demos', label: 'Demos', icon: Inbox },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const kpiCard = (label: string, value: string | number, color: string, gradient: string) => (
    <div style={{ ...glass, padding: '20px 18px', position: 'relative', overflow: 'hidden', boxShadow: "none"}}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: gradient }} />
      <div style={{ fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  );

  const pill = (active: boolean, color: string, label: string, count: number, onClick: () => void) => (
    <button onClick={onClick} style={{
      padding: '6px 14px', fontSize: 11, fontWeight: 700, fontFamily: C.fn,
      background: active ? `${color}25` : 'transparent', color: active ? color : C.ash,
      border: `1px solid ${active ? color : 'var(--bs-border)'}`, borderRadius: 999, cursor: 'pointer',
    }}>{label} <span style={{ opacity: 0.7 }}>{count}</span></button>
  );

  return (
    <div style={{ fontFamily: C.fn, background: 'var(--bs-bg)', minHeight: '100vh', color: 'var(--bs-text)', display: 'flex' }}>
      {/* SIDEBAR */}
      <aside style={{ width: 240, borderRight: `1px solid ${'var(--bs-border)'}`, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--bs-bg2)', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 24px', borderBottom: `1px solid ${'var(--bs-border)'}`, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: C.radiusSm, background: C.gradRed, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: "none"}}>◆</div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: C.red, textTransform: 'uppercase', fontWeight: 700 }}>ByteSense</div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>HQ Admin</div>
          </div>
        </div>
        {navItems.map(n => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: C.radiusSm,
              background: active ? `${C.red}20` : 'transparent', border: 'none',
              color: active ? 'var(--bs-text)' : C.ash, fontSize: 13, fontWeight: active ? 700 : 500, fontFamily: C.fn,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              borderLeft: active ? `2px solid ${C.red}` : '2px solid transparent',
            }}>
              <Icon size={16} />
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge && n.badge > 0 ? (
                <span style={{ background: C.red, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 999, minWidth: 18, textAlign: 'center' }}>{n.badge}</span>
              ) : null}
            </button>
          );
        })}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${'var(--bs-border)'}` }}>
          <div style={{ fontSize: 10, color: C.slate, padding: '0 8px 8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          <button type="button" onClick={() => navigate(appDashboardPath)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'transparent', border: 'none', color: C.ash, fontSize: 12, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm }}>
            ← App dashboard
          </button>
          <button onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'transparent', border: 'none', color: C.ash, fontSize: 12, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm }}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ padding: '14px 28px', borderBottom: `1px solid ${'var(--bs-border)'}`, display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bs-glass)', backdropFilter: C.blur, position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ flex: 1, position: 'relative', maxWidth: 480 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.slate }} />
            <input
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Search codes, practices, demos…"
              style={{ ...inputStyle, padding: '10px 12px 10px 36px', fontSize: 13 }}
            />
            {globalSearch && (
              <button onClick={() => setGlobalSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.slate, cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>
            {tab}
          </div>
        </div>

        <div style={{ padding: 28, maxWidth: 1200, margin: '0 auto' }}>
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
                {kpiCard('Practices', practices.length, C.teal, C.gradTeal)}
                {kpiCard('Active Codes', activeCodes, C.gold, C.gradGold)}
                {kpiCard('Pending Demos', pendingDemos, C.amber, `linear-gradient(135deg, ${C.amber}, ${C.gold})`)}
                {kpiCard('Total Staff', totalStaff, C.blue, C.gradBlue)}
                {kpiCard('Practice Codes Used (30d)', codesUsed30d, C.teal, C.gradTeal)}
                {kpiCard('ByteSense Staff', admins.length, C.red, C.gradRed)}
                {kpiCard('Conversion Rate', `${conversionRate}%`, C.green, `linear-gradient(135deg, ${C.green}, ${C.teal})`)}
                {kpiCard('Open Alerts', openAlertCount, C.red, C.gradRed)}
                {kpiCard('Unassigned Support', unassignedBookings, C.amber, `linear-gradient(135deg, ${C.amber}, ${C.gold})`)}
              </div>
              <div style={{ fontSize: 10, color: C.slate, marginTop: -16, marginBottom: 24, fontStyle: 'italic' }}>
                Note: ByteSense staff (@bytesense.ai) bypass code redemption — they're auto-assigned admin roles.
              </div>

              {openAlertCount > 0 && (
                <div style={{ ...glass, padding: 22, marginBottom: 16, borderLeft: `3px solid ${C.red}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={14} style={{ color: C.red }} /> Needs Attention
                    <button onClick={() => setTab('alerts')} style={{ marginLeft: 'auto', fontSize: 11, color: C.teal, background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.fn }}>View all →</button>
                  </div>
                  {alerts.filter(a => a.status === 'open').slice(0, 5).map(a => {
                    const sevColor = a.severity === 'high' ? C.red : a.severity === 'medium' ? C.amber : C.teal;
                    return (
                      <div key={a.id} onClick={() => { setTab('alerts'); setSelectedAlert(a); }} style={{ padding: '8px 0', borderBottom: `1px solid ${'var(--bs-border)'}`, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: sevColor }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: 'var(--bs-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                          <div style={{ fontSize: 10, color: C.slate }}>{a.type.replace(/_/g, ' ')} · {new Date(a.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 16 }}>
                {/* Recent activity */}
                <div style={{ ...glass, padding: 22 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={14} style={{ color: C.teal }} /> Recent Activity
                  </div>
                  {recentActivity.length === 0 && <div style={{ fontSize: 12, color: C.slate }}>No activity yet</div>}
                  {recentActivity.map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < recentActivity.length - 1 ? `1px solid ${'var(--bs-border)'}` : 'none' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.color, marginTop: 6, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--bs-text)', lineHeight: 1.4 }}>{e.label}</div>
                        <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>{new Date(e.ts).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top practices */}
                <div style={{ ...glass, padding: 22 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Trophy size={14} style={{ color: C.gold }} /> Top Practices by Training
                  </div>
                  {topPractices.length === 0 && <div style={{ fontSize: 12, color: C.slate }}>No data yet</div>}
                  {topPractices.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < topPractices.length - 1 ? `1px solid ${'var(--bs-border)'}` : 'none' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? C.gold : 'var(--bs-border)', color: i === 0 ? '#000' : C.ash, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bs-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: C.slate }}>{p.staff} staff</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>{p.modules}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {practiceChartData.length > 0 && (
                  <div style={{ ...glass, padding: 22 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Staff by Practice</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={practiceChartData} barSize={14}>
                        <XAxis dataKey="name" tick={{ fill: C.ash, fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: C.ash, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="staff" fill={C.teal} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {[{ data: codeStatusData, title: 'Codes Status' }, { data: demoStatusData, title: 'Demo Status' }].map(({ data, title }) => data.length > 0 && (
                  <div key={title} style={{ ...glass, padding: 22 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" strokeWidth={0}>
                            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ flex: 1 }}>
                        {data.map(d => (
                          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                            <span style={{ fontSize: 11, color: C.ash }}>{d.name}: <strong style={{ color: 'var(--bs-text)' }}>{d.value}</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CODES */}
          {tab === 'codes' && (
            <>
              <div style={{ ...glass, padding: 22, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Generate Registration Codes</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', marginBottom: 6, fontWeight: 600 }}>Practice Name *</label>
                    <input value={newPracticeName} onChange={e => setNewPracticeName(e.target.value)} style={inputStyle} placeholder="Acme Dental" />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', marginBottom: 6, fontWeight: 600 }}>Rep Name</label>
                    <input value={newRepName} onChange={e => setNewRepName(e.target.value)} style={inputStyle} placeholder="John Smith" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', marginBottom: 6, fontWeight: 600 }}>Count</label>
                    <input type="number" min={1} max={20} value={batchCount} onChange={e => setBatchCount(Number(e.target.value))} style={{ ...inputStyle, width: 90 }} />
                  </div>
                  <button onClick={generateCodes} style={{ background: C.gradRed, color: '#fff', border: 'none', padding: '12px 24px', fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm, boxShadow: "none"}}>
                    Generate
                  </button>
                  <button onClick={exportCodesCSV} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', color: C.teal, border: `1px solid ${C.teal}40`, padding: '10px 16px', fontSize: 12, fontWeight: 600, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm }}>
                    <Download size={13} /> Export CSV
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {pill(codeFilter === 'all', C.ash, 'All', codes.length, () => { setCodeFilter('all'); setCodePage(0); })}
                {pill(codeFilter === 'active', C.green, 'Active', codes.filter(c => c.status === 'active').length, () => { setCodeFilter('active'); setCodePage(0); })}
                {pill(codeFilter === 'used', C.teal, 'Used', codes.filter(c => c.status === 'used').length, () => { setCodeFilter('used'); setCodePage(0); })}
                {pill(codeFilter === 'expired', C.amber, 'Expired', codes.filter(c => c.status === 'expired').length, () => { setCodeFilter('expired'); setCodePage(0); })}
                {pill(codeFilter === 'revoked', C.red, 'Revoked', codes.filter(c => c.status === 'revoked').length, () => { setCodeFilter('revoked'); setCodePage(0); })}
              </div>

              <div style={{ fontSize: 11, color: C.slate, marginBottom: 10 }}>{filteredCodes.length} of {codes.length} codes</div>
              {pagedCodes.map(c => (
                <div key={c.id} style={{ ...glass, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <span style={{ fontWeight: 800, letterSpacing: 3, fontSize: 15, color: 'var(--bs-text)', fontFamily: 'monospace' }}>{c.code}</span>
                    <button onClick={() => copyToClipboard(c.code, 'Code')} style={{ background: 'none', border: 'none', color: C.slate, cursor: 'pointer', display: 'flex' }}>
                      <Copy size={13} />
                    </button>
                    <span style={{ fontSize: 12, color: C.ash, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.practice_name}</span>
                    {c.rep_name && <span style={{ fontSize: 11, color: C.slate }}>· {c.rep_name}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: statusColor(c.status), textTransform: 'uppercase', background: `${statusColor(c.status)}15`, padding: '3px 10px', borderRadius: 999 }}>{c.status}</span>
                    <span style={{ fontSize: 10, color: C.slate }}>exp {new Date(c.expires_at).toLocaleDateString()}</span>
                    {c.status === 'active' && (
                      <button onClick={() => revokeCode(c.id)} style={{ background: 'none', border: `1px solid ${'var(--bs-border)'}`, color: C.ash, padding: '5px 12px', fontSize: 11, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusXs }}>
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {totalCodePages > 1 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                  <button disabled={codePage === 0} onClick={() => setCodePage(p => p - 1)} style={{ background: 'transparent', border: `1px solid ${'var(--bs-border)'}`, color: C.ash, padding: '6px 14px', borderRadius: C.radiusSm, cursor: codePage === 0 ? 'not-allowed' : 'pointer', fontFamily: C.fn, fontSize: 12, opacity: codePage === 0 ? 0.4 : 1 }}>← Prev</button>
                  <span style={{ fontSize: 12, color: C.ash, alignSelf: 'center' }}>Page {codePage + 1} of {totalCodePages}</span>
                  <button disabled={codePage >= totalCodePages - 1} onClick={() => setCodePage(p => p + 1)} style={{ background: 'transparent', border: `1px solid ${'var(--bs-border)'}`, color: C.ash, padding: '6px 14px', borderRadius: C.radiusSm, cursor: codePage >= totalCodePages - 1 ? 'not-allowed' : 'pointer', fontFamily: C.fn, fontSize: 12, opacity: codePage >= totalCodePages - 1 ? 0.4 : 1 }}>Next →</button>
                </div>
              )}
            </>
          )}

          {/* PRACTICES */}
          {tab === 'practices' && (
            <>
              <div style={{ position: 'relative', marginBottom: 14, maxWidth: 360 }}>
                <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.slate }} />
                <input value={practiceSearch} onChange={e => setPracticeSearch(e.target.value)} placeholder="Search practices…" style={{ ...inputStyle, padding: '10px 12px 10px 34px', fontSize: 13 }} />
              </div>
              <div style={{ fontSize: 11, color: C.slate, marginBottom: 10 }}>{filteredPractices.length} of {practices.length} practices</div>
              {filteredPractices.map((p: any) => {
                const isOpen = expandedPractice === p.id;
                const staffCount = p.profiles?.length || 0;
                const totalMods = p.training_progress?.reduce((s: number, tp: any) => s + (tp.done_modules?.length || 0), 0) || 0;
                return (
                  <div key={p.id} style={{ ...glass, marginBottom: 10, overflow: 'hidden' }}>
                    <div onClick={() => setExpandedPractice(isOpen ? null : p.id)} style={{ padding: 18, display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                          {!p.is_active && <span style={{ fontSize: 9, color: C.amber, background: `${C.amber}15`, padding: '2px 8px', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase' }}>Inactive</span>}
                        </div>
                        <div style={{ fontSize: 11, color: C.ash, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          Code: <span style={{ fontFamily: 'monospace', color: C.gold }}>{p.practice_code || 'N/A'}</span>
                          {p.practice_code && (
                            <button onClick={(e) => { e.stopPropagation(); copyToClipboard(p.practice_code, 'Practice code'); }} style={{ background: 'none', border: 'none', color: C.slate, cursor: 'pointer', display: 'flex' }}>
                              <Copy size={11} />
                            </button>
                          )}
                          <span style={{ color: C.slate }}>· {new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: C.teal }}>{staffCount}</div>
                          <div style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase' }}>staff</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: C.gold }}>{totalMods}</div>
                          <div style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase' }}>modules</div>
                        </div>
                        <ChevronRight size={16} style={{ color: C.slate, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${'var(--bs-border)'}` }}>
                        <div style={{ fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 10, fontWeight: 600 }}>Staff Members</div>
                        {(!p.profiles || p.profiles.length === 0) && <div style={{ fontSize: 12, color: C.slate }}>No staff yet</div>}
                        {p.profiles?.map((prof: any) => {
                          const tp = p.training_progress?.find((t: any) => t.user_id === prof.user_id);
                          return (
                            <div key={prof.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${'var(--bs-border)'}` }}>
                              <div>
                                <div style={{ fontSize: 13, color: 'var(--bs-text)', fontWeight: 600 }}>{prof.full_name || '(no name)'}</div>
                                <div style={{ fontSize: 10, color: C.slate }}>Joined {new Date(prof.created_at).toLocaleDateString()}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.ash }}>
                                <span>{tp?.done_modules?.length || 0} modules</span>
                                <span style={{ color: C.gold }}>{tp?.xp || 0} XP</span>
                                {tp?.completed_at && <span style={{ color: C.green }}>✓ Done</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* USERS — every Clerk user, joined with Supabase profile/role/training data */}
          {tab === 'users' && (() => {
            const totalPages = Math.max(1, Math.ceil(clerkUsersTotal / USERS_PAGE_SIZE));
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.slate }} />
                    <input
                      value={usersSearch}
                      onChange={e => setUsersSearch(e.target.value)}
                      placeholder="Search by name, email, or Clerk user ID…"
                      style={{ ...inputStyle, padding: '10px 12px 10px 36px', fontSize: 13, width: '100%' }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: C.ash }}>
                    {clerkUsersLoading ? 'Loading…' : `${clerkUsersTotal.toLocaleString()} total`}
                  </div>
                </div>

                {clerkUsersError && (
                  <div style={{ padding: 14, background: `${C.red}15`, color: C.red, fontSize: 12, borderRadius: C.radiusSm, marginBottom: 14 }}>
                    {clerkUsersError}
                  </div>
                )}

                <div style={{ ...glass, padding: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.1fr 0.8fr 0.6fr 0.6fr 0.8fr 1.3fr', gap: 0, padding: '12px 16px', fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, borderBottom: `1px solid ${'var(--bs-border)'}` }}>
                    <div>User</div>
                    <div>Practice</div>
                    <div>Roles</div>
                    <div>Intake</div>
                    <div>Training</div>
                    <div style={{ textAlign: 'right' }}>Joined / Last seen</div>
                    <div style={{ textAlign: 'right' }}>Actions</div>
                  </div>
                  {clerkUsers.length === 0 && !clerkUsersLoading && (
                    <div style={{ padding: 24, fontSize: 12, color: C.slate, textAlign: 'center' }}>
                      No users found{usersDebouncedSearch ? ` for "${usersDebouncedSearch}"` : ''}.
                    </div>
                  )}
                  {clerkUsers.map(u => {
                    const display = u.firstName || u.lastName
                      ? `${u.firstName} ${u.lastName}`.trim()
                      : (u.full_name || u.email || u.clerk_user_id.slice(0, 12));
                    return (
                      <div key={u.clerk_user_id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.1fr 0.8fr 0.6fr 0.6fr 0.8fr 1.3fr', gap: 0, padding: '12px 16px', fontSize: 12, color: 'var(--bs-text)', borderBottom: `1px solid ${'var(--bs-border)'}`, alignItems: 'center' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display}</div>
                          <div style={{ fontSize: 10, color: C.ash, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email || '(no email)'}</div>
                          <div style={{ fontSize: 9, color: C.slate, fontFamily: 'monospace', marginTop: 2 }}>{u.clerk_user_id.slice(0, 18)}…</div>
                        </div>
                        <div style={{ fontSize: 12, color: u.practice_name ? 'var(--bs-text)' : C.slate }}>
                          {u.practice_name || '—'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {u.roles.length === 0 && <span style={{ fontSize: 10, color: C.slate }}>—</span>}
                          {u.roles.map(r => (
                            <span key={r} style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                              background: r === 'bytesense_admin' ? `${C.red}25` : r === 'admin' ? `${C.gold}25` : r === 'staff' ? `${C.teal}25` : `${C.slate}25`,
                              color: r === 'bytesense_admin' ? C.red : r === 'admin' ? C.gold : r === 'staff' ? C.teal : C.slate,
                              textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>{r === 'bytesense_admin' ? 'BS Admin' : r}</span>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: u.intake_done ? C.green : C.slate }}>
                          {u.intake_done ? '✓ Done' : '—'}
                        </div>
                        <div style={{ fontSize: 11 }}>
                          <div>{u.module_count} mod{u.module_count === 1 ? '' : 's'}</div>
                          <div style={{ fontSize: 10, color: C.gold }}>{u.xp} XP</div>
                        </div>
                        <div style={{ fontSize: 10, color: C.ash, textAlign: 'right' }}>
                          <div>Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</div>
                          <div style={{ color: C.slate }}>
                            Active {u.last_active_at ? new Date(u.last_active_at).toLocaleDateString() : 'never'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {(() => {
                            const isSelf = u.clerk_user_id === user?.id;
                            const isConfirming = confirmDeleteUserId === u.clerk_user_id;
                            const isDeleting = deletingUserId === u.clerk_user_id;
                            const isAdmin = u.roles.includes('bytesense_admin');
                            const isPromoting = promotingClerkId === u.clerk_user_id;
                            if (isSelf) return <span style={{ fontSize: 10, color: C.slate }}>You</span>;
                            if (isConfirming) {
                              return (
                                <div style={{ display: 'inline-flex', gap: 4 }}>
                                  <button onClick={() => removeClerkUser(u.clerk_user_id)} disabled={isDeleting}
                                    style={{ fontSize: 10, fontWeight: 700, fontFamily: C.fn, padding: '4px 8px', background: C.red, color: '#fff', border: 'none', borderRadius: C.radiusSm, cursor: isDeleting ? 'default' : 'pointer', opacity: isDeleting ? 0.6 : 1 }}>
                                    {isDeleting ? '···' : 'Confirm'}
                                  </button>
                                  <button onClick={() => setConfirmDeleteUserId(null)} disabled={isDeleting}
                                    style={{ fontSize: 10, fontWeight: 600, fontFamily: C.fn, padding: '4px 8px', background: 'transparent', color: C.ash, border: `1px solid ${'var(--bs-border)'}`, borderRadius: C.radiusSm, cursor: 'pointer' }}>
                                    Cancel
                                  </button>
                                </div>
                              );
                            }
                            return (
                              <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                                {isAdmin ? (
                                  <span title="Already a bytesense_admin"
                                    style={{ fontSize: 9, color: C.red, fontWeight: 700, padding: '3px 7px', background: `${C.red}15`, borderRadius: C.radiusSm, letterSpacing: 0.5 }}>
                                    BS ADMIN
                                  </span>
                                ) : (
                                  <button onClick={() => makeAdmin(u.clerk_user_id, u.email)} disabled={isPromoting || !u.email}
                                    title={u.email ? 'Grant bytesense_admin role to this user' : 'User has no email on file'}
                                    style={{ fontSize: 10, fontWeight: 700, fontFamily: C.fn, padding: '4px 10px', background: 'transparent', color: C.teal, border: `1px solid ${C.teal}40`, borderRadius: C.radiusSm, cursor: isPromoting ? 'default' : 'pointer', opacity: isPromoting || !u.email ? 0.5 : 1 }}>
                                    {isPromoting ? '···' : 'Make Admin'}
                                  </button>
                                )}
                                <button onClick={() => setConfirmDeleteUserId(u.clerk_user_id)}
                                  title="Delete user from Clerk + remove all data"
                                  style={{ fontSize: 10, fontWeight: 600, fontFamily: C.fn, padding: '4px 10px', background: 'transparent', color: C.red, border: `1px solid ${C.red}40`, borderRadius: C.radiusSm, cursor: 'pointer' }}>
                                  Remove
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, fontSize: 12, color: C.ash }}>
                  <div>
                    Page {usersPage + 1} of {totalPages} · showing {clerkUsers.length} of {clerkUsersTotal.toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setUsersPage(p => Math.max(0, p - 1))}
                      disabled={usersPage === 0 || clerkUsersLoading}
                      style={{ fontSize: 11, fontFamily: C.fn, padding: '6px 12px', background: 'transparent', color: usersPage === 0 ? C.slate : 'var(--bs-text)', border: `1px solid ${'var(--bs-border)'}`, borderRadius: C.radiusSm, cursor: usersPage === 0 ? 'default' : 'pointer' }}>
                      ← Prev
                    </button>
                    <button
                      onClick={() => setUsersPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={usersPage >= totalPages - 1 || clerkUsersLoading}
                      style={{ fontSize: 11, fontFamily: C.fn, padding: '6px 12px', background: 'transparent', color: usersPage >= totalPages - 1 ? C.slate : 'var(--bs-text)', border: `1px solid ${'var(--bs-border)'}`, borderRadius: C.radiusSm, cursor: usersPage >= totalPages - 1 ? 'default' : 'pointer' }}>
                      Next →
                    </button>
                  </div>
                </div>
              </>
            );
          })()}

          {/* DEMOS */}
          {tab === 'demos' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {pill(demoFilter === 'all', C.ash, 'All', demos.length, () => setDemoFilter('all'))}
                {pill(demoFilter === 'new', C.amber, 'New', demos.filter(d => d.status === 'new').length, () => setDemoFilter('new'))}
                {pill(demoFilter === 'contacted', C.teal, 'Contacted', demos.filter(d => d.status === 'contacted').length, () => setDemoFilter('contacted'))}
                {pill(demoFilter === 'converted', C.green, 'Converted', demos.filter(d => d.status === 'converted').length, () => setDemoFilter('converted'))}
                {pill(demoFilter === 'rejected', C.slate, 'Rejected', demos.filter(d => d.status === 'rejected').length, () => setDemoFilter('rejected'))}
              </div>
              <div style={{ fontSize: 11, color: C.slate, marginBottom: 10 }}>{filteredDemos.length} of {demos.length} requests</div>
              {filteredDemos.map(d => {
                const isOpen = expandedDemo === d.id;
                return (
                  <div key={d.id} style={{ ...glass, marginBottom: 10, overflow: 'hidden' }}>
                    <div onClick={() => setExpandedDemo(isOpen ? null : d.id)} style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: C.ash, marginTop: 2 }}>{d.email} · {d.phone || '—'}</div>
                        {d.practice_name && <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>{d.practice_name}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <select
                          value={d.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateDemoStatus(d.id, e.target.value)}
                          style={{
                            background: `${statusColor(d.status)}15`, color: statusColor(d.status),
                            border: `1px solid ${statusColor(d.status)}40`, fontSize: 10, fontWeight: 700,
                            textTransform: 'uppercase', padding: '4px 8px', borderRadius: 999, cursor: 'pointer',
                            fontFamily: C.fn, outline: 'none',
                          }}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <span style={{ fontSize: 10, color: C.slate }}>{new Date(d.created_at).toLocaleDateString()}</span>
                        <ChevronRight size={14} style={{ color: C.slate, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${'var(--bs-border)'}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingTop: 14 }}>
                          {[
                            { label: 'Operatories', value: d.operatories || '—' },
                            { label: 'Patients/Mo', value: d.monthly_patients || '—' },
                            { label: 'Guards/Mo', value: d.guards_per_month || '—' },
                            { label: 'Guard Price', value: d.guard_price ? `$${d.guard_price}` : '—' },
                            { label: 'Scanner', value: d.has_scanner ? (d.scanner_type || 'Yes') : 'No' },
                            { label: 'Practice Size', value: d.practice_size || '—' },
                          ].map((it, i) => (
                            <div key={i}>
                              <div style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4, fontWeight: 600 }}>{it.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bs-text)' }}>{it.value}</div>
                            </div>
                          ))}
                        </div>
                        {d.goals && d.goals.length > 0 && (
                          <div style={{ marginTop: 14 }}>
                            <div style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>Goals</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {d.goals.map((g, i) => (
                                <span key={i} style={{ background: `${C.teal}15`, color: C.teal, padding: '4px 12px', fontSize: 11, borderRadius: 999, fontWeight: 600 }}>{g}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {d.message && (
                          <div style={{ marginTop: 14 }}>
                            <div style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4, fontWeight: 600 }}>Message</div>
                            <div style={{ fontSize: 12, color: C.ash, lineHeight: 1.7 }}>{d.message}</div>
                          </div>
                        )}
                        <div style={{ marginTop: 14 }}>
                          <div style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>Admin Notes</div>
                          <textarea
                            value={demoNotes[d.id] ?? ''}
                            onChange={e => setDemoNotes(prev => ({ ...prev, [d.id]: e.target.value }))}
                            rows={3}
                            style={{ ...inputStyle, fontSize: 12, resize: 'vertical', fontFamily: C.fn }}
                            placeholder="Internal notes about this lead…"
                          />
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button onClick={() => saveDemoNotes(d.id)} style={{ background: 'transparent', border: `1px solid ${C.teal}40`, color: C.teal, padding: '6px 14px', fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm }}>
                              Save notes
                            </button>
                            {d.status !== 'converted' && (
                              <button onClick={() => convertDemo(d)} style={{ background: C.gradTeal, border: 'none', color: '#fff', padding: '6px 14px', fontSize: 11, fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm, boxShadow: "none"}}>
                                Convert + Generate Code
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* ALERTS */}
          {tab === 'alerts' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--bs-text)' }}>Health Alerts</div>
                <span style={{ fontSize: 11, color: C.slate }}>{alerts.filter(a => a.status === 'open').length} open</span>
                <button onClick={runHealthMonitor} disabled={runningMonitor} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${C.teal}40`, color: C.teal, padding: '8px 14px', fontSize: 12, fontWeight: 600, fontFamily: C.fn, cursor: runningMonitor ? 'wait' : 'pointer', borderRadius: C.radiusSm, opacity: runningMonitor ? 0.6 : 1 }}>
                  <RefreshCw size={13} style={{ animation: runningMonitor ? 'spin 1s linear infinite' : 'none' }} /> Run scan now
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {pill(alertFilter === 'open', C.red, 'Open', alerts.filter(a => a.status === 'open').length, () => setAlertFilter('open'))}
                {pill(alertFilter === 'snoozed', C.amber, 'Snoozed', alerts.filter(a => a.status === 'snoozed').length, () => setAlertFilter('snoozed'))}
                {pill(alertFilter === 'resolved', C.green, 'Resolved', alerts.filter(a => a.status === 'resolved').length, () => setAlertFilter('resolved'))}
                {pill(alertFilter === 'all', C.ash, 'All', alerts.length, () => setAlertFilter('all'))}
              </div>
              {alerts.filter(a => alertFilter === 'all' || a.status === alertFilter).length === 0 && (
                <div style={{ ...glass, padding: 40, textAlign: 'center', color: C.slate, fontSize: 13 }}>
                  No alerts. Click "Run scan now" to check health across all practices.
                </div>
              )}
              {alerts.filter(a => alertFilter === 'all' || a.status === alertFilter).map(a => {
                const sevColor = a.severity === 'high' ? C.red : a.severity === 'medium' ? C.amber : C.teal;
                const practice = practices.find((p: any) => p.id === a.practice_id);
                return (
                  <div key={a.id} onClick={() => setSelectedAlert(a)} style={{ ...glass, padding: 14, marginBottom: 8, cursor: 'pointer', borderLeft: `3px solid ${sevColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: sevColor, textTransform: 'uppercase', letterSpacing: 1.5, background: `${sevColor}15`, padding: '2px 8px', borderRadius: 999 }}>{a.type.replace(/_/g, ' ')}</span>
                          <span style={{ fontSize: 9, color: C.slate, textTransform: 'uppercase', letterSpacing: 1 }}>{a.status}</span>
                          {practice && <span style={{ fontSize: 11, color: C.ash }}>· {practice.name}</span>}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bs-text)' }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: C.ash, marginTop: 4 }}>{a.body}</div>
                      </div>
                      <div style={{ fontSize: 10, color: C.slate, whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* SUPPORT INBOX */}
          {tab === 'support' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Support Inbox</div>
                <span style={{ fontSize: 11, color: C.slate }}>{bookings.length} bookings · {unassignedBookings} unassigned</span>
              </div>
              {bookings.length === 0 && (
                <div style={{ ...glass, padding: 40, textAlign: 'center', color: C.slate, fontSize: 13 }}>No support bookings yet.</div>
              )}
              {bookings.map(b => {
                const ageHours = (Date.now() - new Date(b.created_at).getTime()) / 3_600_000;
                const slaColor = ageHours > 48 ? C.red : ageHours > 24 ? C.amber : C.teal;
                const slaLabel = ageHours > 48 ? 'SLA missed' : ageHours > 24 ? `${Math.round(48 - ageHours)}h left` : `${Math.round(48 - ageHours)}h SLA`;
                return (
                  <div key={b.id} style={{ ...glass, padding: 16, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--bs-text)' }}>{b.name || '(no name)'} <span style={{ color: C.slate, fontWeight: 400 }}>· {b.email}</span></div>
                        <div style={{ fontSize: 11, color: C.ash, marginTop: 4 }}>Booked: {b.booking_date} at {b.booking_time}</div>
                        <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>Created {new Date(b.created_at).toLocaleString()}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: slaColor, background: `${slaColor}15`, padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 1 }}>{slaLabel}</span>
                        <span style={{ fontSize: 10, color: C.slate, textTransform: 'uppercase', letterSpacing: 1 }}>{b.triage_status}</span>
                      </div>
                    </div>
                    {b.notes && <div style={{ fontSize: 12, color: C.ash, marginBottom: 10, padding: 10, background: 'var(--bs-card)', borderRadius: C.radiusSm }}>{b.notes}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>Assign to</label>
                        <select value={b.assigned_to ?? ''} onChange={e => updateBooking(b.id, { assigned_to: e.target.value || null, triage_status: e.target.value ? 'in_progress' : b.triage_status })} style={{ ...inputStyle, marginTop: 4 }}>
                          <option value="">Unassigned</option>
                          {admins.map((a: any) => <option key={a.clerk_user_id} value={a.clerk_user_id}>{a.full_name || a.email || a.clerk_user_id.slice(0, 12)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>Status</label>
                        <select value={b.triage_status} onChange={e => updateBooking(b.id, { triage_status: e.target.value })} style={{ ...inputStyle, marginTop: 4 }}>
                          <option value="new">New</option>
                          <option value="in_progress">In progress</option>
                          <option value="waiting">Waiting on practice</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                    <textarea
                      defaultValue={b.admin_notes}
                      onBlur={e => e.target.value !== b.admin_notes && updateBooking(b.id, { admin_notes: e.target.value })}
                      placeholder="Internal notes…"
                      rows={2}
                      style={{ ...inputStyle, fontSize: 12, fontFamily: C.fn, resize: 'vertical' }}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
              <div style={{ ...glass, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={14} style={{ color: C.teal }} /> Your Account
                </div>
                <div style={{ fontSize: 11, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4, fontWeight: 600 }}>Email</div>
                <div style={{ fontSize: 14, color: 'var(--bs-text)', marginBottom: 16, wordBreak: 'break-all' }}>{user?.email}</div>
                <div style={{ fontSize: 11, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4, fontWeight: 600 }}>Role</div>
                <div style={{ fontSize: 13, color: C.red, fontWeight: 700, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 }}>ByteSense Admin</div>
                <button onClick={sendChangePassword} style={{ background: 'transparent', border: `1px solid ${'var(--bs-border)'}`, color: 'var(--bs-text)', padding: '10px 18px', fontSize: 12, fontWeight: 600, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm, width: '100%' }}>
                  Send password reset email
                </button>
              </div>

              <div style={{ ...glass, padding: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} style={{ color: C.gold }} /> Invite Admin
                </div>
                <input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="admin@bytesense.ai"
                  style={{ ...inputStyle, marginBottom: 10 }}
                />
                <button onClick={inviteAdmin} style={{ background: C.gradGold, border: 'none', color: '#000', padding: '10px 18px', fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm, width: '100%' }}>
                  Send setup link
                </button>
              </div>

              <div style={{ ...glass, padding: 24, gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Pending Invitations ({pendingInvites.length})
                </div>
                <div style={{ fontSize: 11, color: C.ash, marginBottom: 14, lineHeight: 1.5 }}>
                  These users were invited but haven't signed in yet. The bytesense_admin role is granted automatically on their first login. Cancel to prevent auto-grant.
                </div>
                {pendingInvites.length === 0 && <div style={{ fontSize: 12, color: C.slate }}>No pending invitations</div>}
                {pendingInvites.map((p) => {
                  const isCanceling = cancelingInviteEmail === p.email;
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${'var(--bs-border)'}`, gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--bs-text)', fontWeight: 600, wordBreak: 'break-all' }}>{p.email}</div>
                        <div style={{ fontSize: 11, color: C.ash, marginTop: 2 }}>
                          Invited {new Date(p.invited_at).toLocaleString()} · role: {p.role}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => { setInviteEmail(p.email); }}
                          title="Re-send (existing pending row will be upserted)"
                          style={{ fontSize: 11, fontWeight: 600, fontFamily: C.fn, padding: '4px 10px', background: 'transparent', color: C.ash, border: `1px solid ${'var(--bs-border)'}`, borderRadius: C.radiusSm, cursor: 'pointer' }}>
                          Re-send
                        </button>
                        <button
                          onClick={() => cancelPendingInvite(p.email)}
                          disabled={isCanceling}
                          style={{ fontSize: 11, fontWeight: 700, fontFamily: C.fn, padding: '4px 10px', background: C.red, color: '#fff', border: 'none', borderRadius: C.radiusSm, cursor: isCanceling ? 'default' : 'pointer', opacity: isCanceling ? 0.6 : 1 }}>
                          {isCanceling ? '···' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ ...glass, padding: 24, gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Current Admins ({admins.length})</div>
                {admins.length === 0 && <div style={{ fontSize: 12, color: C.slate }}>No admins found</div>}
                {admins.map((a: any) => {
                  const isSelf = a.clerk_user_id === user?.id;
                  const isConfirming = confirmRemoveId === a.clerk_user_id;
                  const isRemoving = removingAdminId === a.clerk_user_id;
                  return (
                    <div key={a.clerk_user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${'var(--bs-border)'}`, gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--bs-text)', fontWeight: 600 }}>
                          {a.full_name || a.email || '(no name)'}
                          {isSelf && <span style={{ fontSize: 10, color: C.teal, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginLeft: 8 }}>You</span>}
                        </div>
                        {a.email && a.full_name && (
                          <div style={{ fontSize: 11, color: C.ash, marginTop: 2 }}>{a.email}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: C.slate, fontFamily: 'monospace' }}>{a.clerk_user_id.slice(0, 12)}…</div>
                        {!isSelf && (
                          isConfirming ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => removeAdmin(a.clerk_user_id)}
                                disabled={isRemoving}
                                style={{ fontSize: 11, fontWeight: 700, fontFamily: C.fn, padding: '4px 10px', background: C.red, color: '#fff', border: 'none', borderRadius: C.radiusSm, cursor: isRemoving ? 'default' : 'pointer', opacity: isRemoving ? 0.6 : 1 }}>
                                {isRemoving ? '···' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirmRemoveId(null)}
                                disabled={isRemoving}
                                style={{ fontSize: 11, fontWeight: 600, fontFamily: C.fn, padding: '4px 10px', background: 'transparent', color: C.ash, border: `1px solid ${'var(--bs-border)'}`, borderRadius: C.radiusSm, cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRemoveId(a.clerk_user_id)}
                              title="Remove admin access"
                              style={{ fontSize: 11, fontWeight: 600, fontFamily: C.fn, padding: '4px 10px', background: 'transparent', color: C.ash, border: `1px solid ${'var(--bs-border)'}`, borderRadius: C.radiusSm, cursor: 'pointer' }}>
                              Revoke
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* ALERT DETAIL DRAWER */}
      {selectedAlert && (
        <div onClick={() => setSelectedAlert(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: '100%', height: '100vh', background: 'var(--bs-bg2)', borderLeft: `1px solid ${'var(--bs-border)'}`, padding: 28, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, color: selectedAlert.severity === 'high' ? C.red : C.amber, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>{selectedAlert.type.replace(/_/g, ' ')} · {selectedAlert.severity}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--bs-text)' }}>{selectedAlert.title}</div>
              </div>
              <button onClick={() => setSelectedAlert(null)} style={{ background: 'none', border: 'none', color: C.slate, cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: C.ash, lineHeight: 1.6, marginBottom: 20 }}>{selectedAlert.body}</div>
            {(() => {
              const practice = practices.find((p: any) => p.id === selectedAlert.practice_id);
              return practice ? (
                <div style={{ ...glass, padding: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4, fontWeight: 600 }}>Practice</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{practice.name}</div>
                  <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>Code {practice.practice_code} · {practice.profiles?.length || 0} staff</div>
                </div>
              ) : null;
            })()}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Assigned to</label>
              <select value={selectedAlert.assigned_to ?? ''} onChange={e => updateAlert(selectedAlert.id, { assigned_to: e.target.value || null })} style={inputStyle}>
                <option value="">Unassigned</option>
                {admins.map((a: any) => <option key={a.clerk_user_id} value={a.clerk_user_id}>{a.full_name || a.email || a.clerk_user_id.slice(0, 12)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Next step</label>
              <input defaultValue={selectedAlert.next_step} onBlur={e => e.target.value !== selectedAlert.next_step && updateAlert(selectedAlert.id, { next_step: e.target.value })} placeholder="e.g. Call practice owner Monday" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Follow-up date</label>
              <input type="datetime-local" defaultValue={selectedAlert.follow_up_at ? selectedAlert.follow_up_at.slice(0, 16) : ''} onBlur={e => updateAlert(selectedAlert.id, { follow_up_at: e.target.value ? new Date(e.target.value).toISOString() : null } as any)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 9, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, display: 'block', marginBottom: 6 }}>Notes</label>
              <textarea defaultValue={selectedAlert.admin_notes} onBlur={e => e.target.value !== selectedAlert.admin_notes && updateAlert(selectedAlert.id, { admin_notes: e.target.value })} rows={5} placeholder="What did you do? Plans, observations…" style={{ ...inputStyle, fontSize: 12, fontFamily: C.fn, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedAlert.status !== 'resolved' && (
                <button onClick={() => { resolveAlert(selectedAlert.id); setSelectedAlert(null); }} style={{ background: C.gradTeal, border: 'none', color: '#fff', padding: '10px 18px', fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm, flex: 1 }}>Resolve</button>
              )}
              {selectedAlert.status === 'open' && (
                <button onClick={() => { snoozeAlert(selectedAlert.id); setSelectedAlert(null); }} style={{ background: 'transparent', border: `1px solid ${C.amber}40`, color: C.amber, padding: '10px 18px', fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm }}>Snooze</button>
              )}
              {selectedAlert.status !== 'open' && (
                <button onClick={() => { reopenAlert(selectedAlert.id); }} style={{ background: 'transparent', border: `1px solid ${C.red}40`, color: C.red, padding: '10px 18px', fontSize: 12, fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm }}>Re-open</button>
              )}
            </div>
            <div style={{ fontSize: 10, color: C.slate, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${'var(--bs-border)'}` }}>
              Created {new Date(selectedAlert.created_at).toLocaleString()}
              {selectedAlert.resolved_at && <> · Resolved {new Date(selectedAlert.resolved_at).toLocaleString()}</>}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}