// Temporary stub. Replaced in Stage 3 of the migration with the real
// VC tracker (summary, signals, scoring, position, log, syndicate, settings).

import { Target } from 'lucide-react';
import trackerCompanies from '../../data/tracker-companies.json';

export default function TrackerPlaceholder() {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        padding: '64px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        background: '#09090b',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background:
            'linear-gradient(135deg, rgba(34,211,238,0.2) 0%, rgba(34,211,238,0.05) 100%)',
          border: '1px solid rgba(34,211,238,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
          marginTop: 64,
        }}
      >
        <Target size={24} style={{ color: '#22D3EE' }} strokeWidth={2} />
      </div>
      <div
        style={{
          fontSize: 11,
          color: '#22D3EE',
          fontFamily: 'ui-monospace, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          fontWeight: 700,
          marginBottom: 16,
        }}
      >
        Single-position monitor
      </div>
      <h1
        style={{
          fontSize: 42,
          fontWeight: 700,
          color: '#fafafa',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          margin: 0,
          marginBottom: 16,
        }}
      >
        Tracker
      </h1>
      <p
        style={{
          fontSize: 15,
          color: '#a1a1aa',
          lineHeight: 1.6,
          maxWidth: 480,
          margin: 0,
          marginBottom: 32,
        }}
      >
        The full position monitor will land here in Stage 3 of the migration.
        Until then, the data layer is already in place.
      </p>

      <div
        style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: 12,
          padding: '20px 24px',
          maxWidth: 480,
          textAlign: 'left',
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: '#71717a',
            fontFamily: 'ui-monospace, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            marginBottom: 12,
          }}
        >
          Tracked positions
        </div>
        {trackerCompanies.companies.map((c) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              padding: '8px 0',
              borderTop: '1px solid #27272a',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fafafa' }}>
              {c.name}
            </span>
            <span
              style={{
                fontSize: 11,
                color: '#71717a',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {c.legalName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
