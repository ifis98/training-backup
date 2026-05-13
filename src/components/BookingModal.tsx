import { useState, useEffect, useMemo } from 'react';
import { C } from '@/data/constants';
import { supabase } from '@/integrations/supabase/client';
import { t, Lang } from '@/data/translations';
import { X, Calendar, Clock, CheckCircle2 } from 'lucide-react';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  userName?: string;
  userEmail?: string;
}

const glass = {
  background: C.glass,
  backdropFilter: C.blur,
  WebkitBackdropFilter: C.blur,
  border: `1px solid ${C.glassBorder}`,
  borderRadius: C.radius,
} as React.CSSProperties;

// Generate 30-min slots from 10am-4pm PST (last slot at 3:30pm)
const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const hour = 10 + Math.floor(i / 2);
  const min = i % 2 === 0 ? '00' : '30';
  const label = `${hour > 12 ? hour - 12 : hour}:${min} ${hour >= 12 ? 'PM' : 'AM'}`;
  return { value: `${String(hour).padStart(2, '0')}:${min}`, label };
});

function getNext30Days(): Date[] {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 1; i <= 60 && days.length < 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dow = d.getDay();
    // M=1, W=3, F=5
    if (dow === 1 || dow === 3 || dow === 5) days.push(d);
  }
  return days;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function BookingModal({ open, onClose, lang, userName = '', userEmail = '' }: BookingModalProps) {
  const T = (key: string) => t(lang, key);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [notes, setNotes] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const availableDays = useMemo(() => getNext30Days(), []);

  // Load existing bookings for selected date
  useEffect(() => {
    if (!selectedDate) return;
    const loadBookings = async () => {
      const { data } = await supabase
        .from('support_bookings')
        .select('booking_time')
        .eq('booking_date', formatDate(selectedDate))
        .eq('status', 'confirmed');
      setBookedSlots((data || []).map((b: any) => b.booking_time));
    };
    loadBookings();
  }, [selectedDate]);

  // Pre-fill user info from props when modal opens
  useEffect(() => {
    if (!open) return;
    if (userName) setName(userName);
    if (userEmail) setEmail(userEmail);
  }, [open, userName, userEmail]);

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !name || !email) return;
    setLoading(true);
    try {
      const clerkUserId = (window as any).__clerkUserId as string | undefined;
      const { error } = await supabase.from('support_bookings').insert({
        clerk_user_id: clerkUserId || null,
        name,
        email,
        booking_date: formatDate(selectedDate),
        booking_time: selectedTime,
        notes,
      } as any);
      if (!error) setSuccess(true);
    } catch {}
    setLoading(false);
  };

  const handleClose = () => {
    setSuccess(false);
    setSelectedDate(null);
    setSelectedTime(null);
    setNotes('');
    onClose();
  };

  if (!open) return null;

  const availableSlots = TIME_SLOTS.filter(s => !bookedSlots.includes(s.value));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}>
      <div style={{ ...glass, maxWidth: 520, width: '90%', maxHeight: '85vh', overflow: 'auto', padding: 0, background: "var(--bs-bg2)", border: `1px solid ${C.glassBorder}` }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${C.glassBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={18} strokeWidth={1.5} color={C.teal} />
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: C.fn }}>{T("book_support_call")}</span>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: C.ash, cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <CheckCircle2 size={48} strokeWidth={1.5} color={C.green} style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: C.white, fontFamily: C.fn }}>{T("booking_confirmed")}</div>
            <div style={{ fontSize: 13, color: C.ash, marginBottom: 4, fontFamily: C.fn }}>
              {selectedDate && formatDateDisplay(selectedDate)} · {TIME_SLOTS.find(s => s.value === selectedTime)?.label} PST
            </div>
            <div style={{ fontSize: 12, color: C.ash, fontFamily: C.fn }}>{T("booking_confirmation_sent")}</div>
            <button onClick={handleClose}
              style={{ marginTop: 24, background: C.gradTeal, color: C.white, border: 'none', padding: '10px 24px', fontSize: 13, fontWeight: 700, fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusSm }}>
              {T("close")}
            </button>
          </div>
        ) : (
          <div style={{ padding: 24 }}>
            {/* Subtitle */}
            <div style={{ fontSize: 12, color: C.ash, marginBottom: 20, fontFamily: C.fn }}>{T("booking_subtitle")}</div>

            {/* Date Selection */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 10, fontFamily: C.fn }}>
                {T("select_date")}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {availableDays.slice(0, 12).map(d => {
                  const isSelected = selectedDate && formatDate(d) === formatDate(selectedDate);
                  return (
                    <button key={formatDate(d)} onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                      style={{
                        background: isSelected ? C.gradTeal : 'rgba(255,255,255,0.04)',
                        color: isSelected ? C.white : C.ash,
                        border: `1px solid ${isSelected ? C.teal : C.glassBorder}`,
                        padding: '8px 14px', fontSize: 11, fontWeight: isSelected ? 700 : 400,
                        fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusXs,
                        transition: 'all 0.2s',
                      }}>
                      {formatDateDisplay(d)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 10, fontFamily: C.fn, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={12} strokeWidth={1.5} /> {T("select_time")} (PST)
                </div>
                {availableSlots.length === 0 ? (
                  <div style={{ fontSize: 12, color: C.ash, padding: 16, textAlign: 'center', fontFamily: C.fn }}>{T("no_slots_available")}</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {availableSlots.map(slot => {
                      const isSelected = selectedTime === slot.value;
                      return (
                        <button key={slot.value} onClick={() => setSelectedTime(slot.value)}
                          style={{
                            background: isSelected ? C.gradTeal : 'rgba(255,255,255,0.04)',
                            color: isSelected ? C.white : C.ash,
                            border: `1px solid ${isSelected ? C.teal : C.glassBorder}`,
                            padding: '10px 8px', fontSize: 12, fontWeight: isSelected ? 700 : 400,
                            fontFamily: C.fn, cursor: 'pointer', borderRadius: C.radiusXs,
                            transition: 'all 0.2s',
                          }}>
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Contact Info */}
            {selectedTime && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 4, display: 'block', fontFamily: C.fn }}>{T("your_name")}</label>
                    <input value={name} onChange={e => setName(e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.glassBorder}`, color: C.white, padding: '10px 12px', fontSize: 12, fontFamily: C.fn, outline: 'none', borderRadius: C.radiusXs }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 4, display: 'block', fontFamily: C.fn }}>{T("your_email")}</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.glassBorder}`, color: C.white, padding: '10px 12px', fontSize: 12, fontFamily: C.fn, outline: 'none', borderRadius: C.radiusXs }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: C.ash, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 4, display: 'block', fontFamily: C.fn }}>{T("booking_notes")}</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={T("booking_notes_placeholder")}
                    style={{ width: '100%', minHeight: 60, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.glassBorder}`, color: C.white, padding: '10px 12px', fontSize: 12, fontFamily: C.fn, outline: 'none', resize: 'vertical', borderRadius: C.radiusXs }} />
                </div>
              </div>
            )}

            {/* Book Button */}
            {selectedTime && (
              <button onClick={handleBook} disabled={loading || !name || !email}
                style={{
                  width: '100%', background: (name && email) ? C.gradTeal : 'rgba(255,255,255,0.05)',
                  color: C.white, border: 'none', padding: '14px', fontSize: 14, fontWeight: 700,
                  fontFamily: C.fn, cursor: (name && email) ? 'pointer' : 'not-allowed',
                  borderRadius: C.radiusSm, boxShadow: (name && email) ? C.glow(C.teal, 0.2) : 'none',
                  transition: 'all 0.3s',
                }}>
                {loading ? T("booking_loading") : T("confirm_booking")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
