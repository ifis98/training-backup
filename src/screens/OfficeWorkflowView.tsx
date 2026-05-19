import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function OfficeWorkflowView() {
  const navigate = useNavigate();

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
          onClick={() => navigate('/app')}
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
        src="/office-workflow.html"
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
          display: 'block',
          minHeight: 0,
        }}
        title="Office Workflow — byteSense Clinical Guide"
      />
    </div>
  );
}
