import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { AppState } from '@/hooks/useAppState';

// Props are optional — component works both as a standalone route (/sales-training)
// and embedded inside Index when u() is passed (phase-based fallback)
interface SalesTrainingViewProps {
  u?: (d: Partial<AppState>) => void;
}

export default function SalesTrainingView({ u }: SalesTrainingViewProps = {}) {
  const navigate = useNavigate();

  const goBack = () => {
    if (u) {
      u({ phase: 'dashboard' });
    } else {
      navigate('/app');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bs-bg)' }}>
      {/* Back bar */}
      <div style={{
        background: 'var(--bs-bg2)',
        borderBottom: '1px solid var(--bs-border)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <button
          onClick={goBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--bs-ash)',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: "'Outfit', 'Inter', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: 0,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--bs-text)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--bs-ash)'; }}
        >
          <ChevronLeft size={15} strokeWidth={2} />
          Back to Dashboard
        </button>
      </div>

      {/* Full-height iframe */}
      <iframe
        src="/sales-training.html"
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
          display: 'block',
          minHeight: 0,
        }}
        title="Sales Training — byteSense Partner Guide"
      />
    </div>
  );
}
