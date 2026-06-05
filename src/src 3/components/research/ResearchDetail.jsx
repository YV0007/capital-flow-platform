// Research report detail page. Shows the report header (cover art + title +
// subtitle + stats), then routes to the report-specific body component.
// In Sub-stage 2a, only Holdings is fully wired. Data Centers AI is a stub
// that gets replaced in Sub-stage 2b.

import ResearchCover from './ResearchCovers.jsx';
import HoldingsTab from './HoldingsTab.jsx';
import RESEARCH_LIBRARY from '../../data/research-library.json';

export default function ResearchDetail({ researchId, onBack }) {
  const r = RESEARCH_LIBRARY.find((x) => x.id === researchId);
  if (!r) {
    return (
      <div style={{ padding: 64, textAlign: 'center', color: '#a1a1aa' }}>
        Research not found.
        <button
          onClick={onBack}
          style={{
            display: 'block',
            margin: '20px auto',
            padding: '8px 16px',
            background: '#22D3EE',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          ← Back to library
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        padding: '32px 32px 96px 32px',
        background: '#09090b',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Back link */}
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#71717a',
            fontSize: 12,
            fontFamily: 'ui-monospace, monospace',
            padding: '6px 0',
            marginBottom: 32,
            transition: 'color 120ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = r.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
        >
          ← Back to research library
        </button>

        {/* Header — cover icon is clickable, returns to library */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 28,
            marginBottom: 48,
            paddingBottom: 32,
            borderBottom: '1px solid #27272a',
          }}
        >
          <button
            onClick={onBack}
            title="Back to research library"
            aria-label="Back to research library"
            style={{
              width: 96,
              height: 96,
              borderRadius: 14,
              overflow: 'hidden',
              position: 'relative',
              background: '#0a0a0a',
              flexShrink: 0,
              border: `1px solid ${r.accent}30`,
              padding: 0,
              cursor: 'pointer',
              transition:
                'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 200ms, box-shadow 200ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.borderColor = r.accent + '80';
              e.currentTarget.style.boxShadow = `0 8px 24px -8px ${r.accent}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = r.accent + '30';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <ResearchCover id={r.id} color={r.accent} />
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                color: r.accent,
                fontFamily: 'ui-monospace, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                marginBottom: 8,
                fontWeight: 700,
              }}
            >
              {r.sector} · {r.dateCompleted}
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: '#fafafa',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                marginBottom: 12,
              }}
            >
              {r.title}
            </div>
            <div
              style={{
                fontSize: 15,
                color: '#a1a1aa',
                lineHeight: 1.55,
                maxWidth: 760,
              }}
            >
              {r.subtitle}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 18,
                marginTop: 18,
                fontSize: 11,
                fontFamily: 'ui-monospace, monospace',
                color: '#71717a',
              }}
            >
              <span>
                <span style={{ color: '#fafafa', fontWeight: 600 }}>
                  {r.companyCount}
                </span>{' '}
                companies covered
              </span>
              <span style={{ color: '#3f3f46' }}>·</span>
              <span>
                <span style={{ color: '#fafafa', fontWeight: 600 }}>
                  {r.sectionCount}
                </span>{' '}
                sections
              </span>
            </div>
          </div>
        </div>

        {/* Report body */}
        {researchId === 'holdings' ? (
          <HoldingsTab />
        ) : researchId === 'data-centers-ai' ? (
          <ReportComingSoon accent={r.accent} title="Data Centers for AI" />
        ) : (
          <ReportComingSoon accent={r.accent} title={r.title} />
        )}
      </div>
    </div>
  );
}

function ReportComingSoon({ accent, title }) {
  return (
    <div
      style={{
        padding: '80px 32px',
        textAlign: 'center',
        background: '#0a0a0a',
        border: '1px dashed #27272a',
        borderRadius: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: accent,
          fontFamily: 'ui-monospace, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          fontWeight: 700,
          marginBottom: 16,
        }}
      >
        Migration in progress
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#fafafa',
          letterSpacing: '-0.01em',
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
        The full report renders in Sub-stage 2b. The Holdings dashboard is already wired up — try it.
      </div>
    </div>
  );
}
