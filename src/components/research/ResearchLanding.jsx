// Research library landing page — grid of report cards.
// Reads report metadata from research-library.json (committed JSON).
// Clicking a card calls onOpen(id), routed by App → ResearchDetail.

import ResearchCover from './ResearchCovers.jsx';
import RESEARCH_LIBRARY from '../../data/research-library.json';

export default function ResearchLanding({ onOpen }) {
  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      padding: '64px 32px',
      background: 'radial-gradient(ellipse at top, rgba(34,211,238,0.04) 0%, transparent 60%), var(--hm-bg)',
    }}>
      {/* Title block */}
      <div style={{ maxWidth: 1200, margin: '0 auto 56px auto', paddingLeft: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 12 }}>
          Research Library
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--hm-text)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Sector reports
        </div>
        <div style={{ fontSize: 14, color: 'var(--hm-text3)', marginTop: 10, maxWidth: 640, lineHeight: 1.55 }}>
          Deep-dive research on specific sectors, technologies, and theses. Each report covers the dominant players, structural dynamics, and the open questions that determine who wins.
        </div>
      </div>

      {/* Floating cards canvas */}
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 28,
        alignItems: 'stretch',
      }}>
        {RESEARCH_LIBRARY.map((r, i) => (
          <button key={r.id}
            onClick={() => onOpen(r.id)}
            className="research-card"
            style={{
              position: 'relative',
              display: 'flex', flexDirection: 'column',
              background: 'linear-gradient(135deg, var(--hm-card-strong) 0%, var(--hm-surface) 100%)',
              border: '1px solid var(--hm-border4)',
              borderRadius: 16,
              padding: 0,
              overflow: 'hidden',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 220ms, box-shadow 280ms',
              transform: 'translateY(0)',
              animation: `floatIn 700ms cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 100}ms backwards`,
              willChange: 'transform',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
              e.currentTarget.style.borderColor = `color-mix(in srgb, ${r.accent} 38%, transparent)`;
              e.currentTarget.style.boxShadow = `0 20px 40px -12px color-mix(in srgb, ${r.accent} 20%, transparent), 0 0 0 1px color-mix(in srgb, ${r.accent} 13%, transparent)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.borderColor = 'var(--hm-border4)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
            {/* Cover */}
            <div style={{ position: 'relative', height: 180, flexShrink: 0, overflow: 'hidden', background: '#0a0a0a' }}>
              <ResearchCover id={r.id} color={r.accent} />
              {/* Sector tag overlaid on cover */}
              <span style={{
                position: 'absolute', top: 14, left: 14, zIndex: 2,
                padding: '4px 10px',
                fontSize: 9, fontFamily: 'ui-monospace,monospace', fontWeight: 700,
                color: r.accent, background: 'rgba(0,0,0,0.5)',
                border: `1px solid color-mix(in srgb, ${r.accent} 25%, transparent)`, borderRadius: 4,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                backdropFilter: 'blur(4px)',
              }}>
                {r.sector}
              </span>
            </div>

            {/* Card body */}
            <div style={{ padding: '20px 22px 22px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--hm-text)', letterSpacing: '-0.01em', lineHeight: 1.25, marginBottom: 10 }}>
                {r.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--hm-text3)', lineHeight: 1.5, marginBottom: 16, minHeight: 54 }}>
                {r.subtitle}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 10, fontFamily: 'ui-monospace,monospace', color: 'var(--hm-text5)', marginTop: 'auto' }}>
                <span>{r.companyCount} companies</span>
                <span style={{ color: 'var(--hm-rank)' }}>·</span>
                <span>{r.sectionCount} sections</span>
                <span style={{ flex: 1 }}></span>
                <span>{r.dateCompleted}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes floatIn {
          0%   { opacity: 0; transform: translateY(20px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
