import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function OfficeWorkflowView() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0A0A0A' }}>
      {/* Back bar */}
      <div style={{
        background: '#111111',
        borderBottom: '1px solid #252525',
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
            color: '#A0A0A0',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: "'Outfit', 'Inter', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: 0,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F4F4F4'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#A0A0A0'; }}
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
