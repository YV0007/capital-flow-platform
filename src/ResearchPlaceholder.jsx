// Temporary stub. Replaced in Stage 2 of the migration with the real
// Research Library (clickable cards, report detail pages, holdings dashboard,
// data-centers-for-AI deep dive, etc.).
//
// For now: renders the report metadata from research-library.json so you can
// confirm end-to-end that the data layer extraction worked.

import { BookOpen } from 'lucide-react';
import researchLibrary from '../../data/research-library.json';

export default function ResearchPlaceholder() {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        padding: '64px 32px',
        background: '#09090b',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto 48px', paddingLeft: 8 }}>
        <div
          style={{
            fontSize: 11,
            color: '#71717a',
            fontFamily: 'ui-monospace, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            marginBottom: 12,
          }}
        >
          Research Library
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#fafafa',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Sector reports
        </div>
        <div
          style={{
            fontSize: 14,
            color: '#a1a1aa',
            marginTop: 10,
            maxWidth: 640,
            lineHeight: 1.55,
          }}
        >
          Click-through to individual reports comes in Stage 2 of the migration.
          For now, this list confirms the data layer is wired up correctly.
        </div>
      </div>

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 24,
        }}
      >
        {researchLibrary.map((r) => (
          <article
            key={r.id}
            style={{
              background:
                'linear-gradient(135deg, rgba(24,24,27,0.95) 0%, rgba(9,9,11,0.95) 100%)',
              border: '1px solid #27272a',
              borderRadius: 14,
              padding: '24px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: r.accent + '20',
                  border: `1px solid ${r.accent}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={14} style={{ color: r.accent }} strokeWidth={2.5} />
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: r.accent,
                  fontFamily: 'ui-monospace, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  fontWeight: 700,
                }}
              >
                {r.sector}
              </span>
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#fafafa',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              {r.title}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: '#a1a1aa',
                lineHeight: 1.55,
              }}
            >
              {r.subtitle}
            </div>
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 14,
                borderTop: '1px solid #27272a',
                display: 'flex',
                gap: 16,
                fontSize: 10,
                fontFamily: 'ui-monospace, monospace',
                color: '#71717a',
              }}
            >
              <span>
                <span style={{ color: '#fafafa', fontWeight: 600 }}>
                  {r.companyCount}
                </span>{' '}
                companies
              </span>
              <span style={{ color: '#3f3f46' }}>·</span>
              <span>
                <span style={{ color: '#fafafa', fontWeight: 600 }}>
                  {r.sectionCount}
                </span>{' '}
                sections
              </span>
              <span style={{ marginLeft: 'auto' }}>{r.dateCompleted}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
