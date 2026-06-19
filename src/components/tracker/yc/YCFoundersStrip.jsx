// Horizontal row of founder cards. Each card: photo (circle), name, role,
// 1-line bio. Name click → opens founder's LinkedIn or X in a new tab.
import React from 'react';
import { Logo } from './YCCompanyCard.jsx';

export default function YCFoundersStrip({ founders }) {
  if (!founders || founders.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: 14,
    }}>
      {founders.map((f, i) => {
        const profileUrl = f.linkedin || f.twitter || null;
        return (
          <div
            key={f.name || i}
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: 10,
              padding: '16px 16px 14px',
              display: 'flex', gap: 14,
              alignItems: 'flex-start',
            }}
          >
            <Logo name={f.name} url={f.photo} size={56} square={false} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {profileUrl ? (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 14, fontWeight: 700, color: '#fafafa',
                    textDecoration: 'none',
                    display: 'inline-block', marginBottom: 2,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
                  onMouseLeave={e => e.currentTarget.style.color = '#fafafa'}
                >
                  {f.name}
                </a>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fafafa', marginBottom: 2 }}>
                  {f.name}
                </div>
              )}
              {f.role && (
                <div style={{
                  fontSize: 10.5, color: '#71717a',
                  fontFamily: 'ui-monospace,monospace',
                  letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
                  marginBottom: 8,
                }}>
                  {f.role}
                </div>
              )}
              {f.bio && (
                <div style={{ fontSize: 11.5, color: '#a1a1aa', lineHeight: 1.55 }}>
                  {f.bio}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
