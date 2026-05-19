import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SlidingPanelProps {
  src: string | null;   // null = closed
  title: string;
  onClose: () => void;
}

export default function SlidingPanel({ src, title, onClose }: SlidingPanelProps) {
  const isMobile = useIsMobile();
  const isOpen = src !== null;

  // Keep the last src so iframe doesn't blank out during the close animation
  const lastSrcRef = useRef<string | null>(null);
  if (src) lastSrcRef.current = src;

  // Lock body scroll whenever panel is open (prevents sidebar from scrolling on desktop)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        // Desktop: start right of the ByteSense sidebar (CSS var set by DashboardSidebar)
        // Mobile: full screen
        left: isMobile ? 0 : 'var(--bs-sidebar-w, 220px)',
        right: 0,
        bottom: 0,
        // Above bottom nav (z:100) and sidebar (z:40), but sidebar doesn't overlap since left > 0
        zIndex: isMobile ? 300 : 200,
        transform: isOpen ? 'translateX(0)' : 'translateX(105%)',
        transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bs-bg)',
        willChange: 'transform',
        boxShadow: "none",
      }}
      aria-hidden={!isOpen}
    >
      {/* Top bar */}
      <div style={{
        background: 'var(--bs-bg2)',
        borderBottom: '1px solid var(--bs-border)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexShrink: 0,
        minHeight: 44,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.color = '#F4F4F4';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = '#888';
          }}
          title="Close (Esc)"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* iframe — always mounted once src is first set, so no reload on reopen */}
      {lastSrcRef.current && (
        <iframe
          src={lastSrcRef.current}
          style={{
            flex: 1,
            border: 'none',
            width: '100%',
            display: 'block',
            minHeight: 0,
          }}
          title={title}
        />
      )}
    </div>
  );
}
