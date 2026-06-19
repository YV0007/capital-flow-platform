// Big logo + name + tagline + pill row (batch, status, location, sectors).
// YC orange (#FF6600) is used here for the batch badge — and ONLY here.
import React from 'react';
import { Logo } from './YCCompanyCard.jsx';

const STATUS_LABELS = {
  Active:   'Активна',
  Inactive: 'Неактивна',
  Acquired: 'Куплена',
};

const STATUS_STYLES = {
  Active:   { color: '#10b981', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.30)' },
  Inactive: { color: '#a1a1aa', bg: 'rgba(161,161,170,0.10)', border: 'rgba(161,161,170,0.30)' },
  Acquired: { color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.30)' },
};

export default function YCDetailHero({ company }) {
  const ss = STATUS_STYLES[company.status] || STATUS_STYLES.Active;
  const statusLabel = STATUS_LABELS[company.status] || company.status;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22 }}>
      <Logo name={company.name} url={company.logo} size={92} />

      <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
        <h1 style={{
          fontSize: 32, fontWeight: 800, color: '#fafafa',
          letterSpacing: '-0.02em', lineHeight: 1.1,
          margin: '0 0 8px 0',
        }}>
          {company.name}
        </h1>
        <div style={{
          fontSize: 15, color: '#a1a1aa', lineHeight: 1.5,
          marginBottom: 18, maxWidth: 640,
        }}>
          {company.tagline}
        </div>

        {/* Pill row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {/* Batch — the one and only YC orange */}
          {company.batch && (
            <Pill
              color="#FF6600"
              bg="rgba(255,102,0,0.12)"
              border="rgba(255,102,0,0.45)"
              text={company.batch}
              mono
            />
          )}
          {company.status && (
            <Pill
              color={ss.color}
              bg={ss.bg}
              border={ss.border}
              text={statusLabel}
            />
          )}
          {company.location && (
            <Pill
              color="#d4d4d8"
              bg="#27272a"
              border="#3f3f46"
              text={company.location}
            />
          )}
          {(company.sectors || []).map(s => (
            <Pill
              key={s}
              color="#d4d4d8"
              bg="transparent"
              border="#3f3f46"
              text={s}
              mono
              tiny
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Pill({ color, bg, border, text, mono, tiny }) {
  return (
    <span style={{
      fontSize: tiny ? 10.5 : 11.5,
      color, background: bg,
      border: `1px solid ${border}`,
      borderRadius: 4,
      padding: tiny ? '3px 8px' : '4px 10px',
      fontWeight: 600,
      fontFamily: mono ? 'ui-monospace,monospace' : 'inherit',
      letterSpacing: mono ? '0.04em' : '0',
      whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );
}
