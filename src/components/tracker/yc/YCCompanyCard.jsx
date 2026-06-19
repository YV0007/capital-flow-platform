// Single company card in the landing grid.
import React, { useState } from 'react';

export default function YCCompanyCard({ company, onClick }) {
  const [hover, setHover] = useState(false);
  const visibleSectors = (company.sectors || []).slice(0, 2);
  const extraCount = (company.sectors?.length || 0) - visibleSectors.length;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#18181b',
        border: `1px solid ${hover ? '#3f3f46' : '#27272a'}`,
        borderRadius: 10,
        padding: '18px 18px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        color: 'inherit', font: 'inherit',
        display: 'flex', flexDirection: 'column', gap: 12,
        minHeight: 168,
        transition: 'border-color 160ms, box-shadow 160ms, transform 160ms',
        boxShadow: hover
          ? '0 8px 24px rgba(0,0,0,0.45)'
          : '0 2px 8px rgba(0,0,0,0.25)',
        transform: hover ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <Logo name={company.name} url={company.logo} size={60} />
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <div style={{
            fontSize: 17, fontWeight: 700, color: '#fafafa',
            letterSpacing: '-0.01em', lineHeight: 1.2,
            marginBottom: 6,
          }}>
            {company.name}
          </div>
          <div style={{
            fontSize: 12.5, color: '#a1a1aa', lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {company.tagline}
          </div>
        </div>
      </div>

      {visibleSectors.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
          {visibleSectors.map(s => (
            <span key={s} style={{
              fontSize: 10.5, color: '#d4d4d8',
              padding: '3px 8px', borderRadius: 4,
              background: '#27272a', border: '1px solid #3f3f46',
              fontFamily: 'ui-monospace,monospace',
            }}>
              {s}
            </span>
          ))}
          {extraCount > 0 && (
            <span style={{
              fontSize: 10.5, color: '#71717a',
              padding: '3px 8px', borderRadius: 4,
              background: 'transparent', border: '1px solid #27272a',
              fontFamily: 'ui-monospace,monospace',
            }}>
              +{extraCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

export function Logo({ name, url, size = 60, square = true }) {
  const [failed, setFailed] = useState(false);
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setFailed(true)}
        style={{
          width: size, height: size,
          borderRadius: square ? 10 : '50%',
          objectFit: 'cover',
          background: '#27272a',
          flexShrink: 0,
        }}
      />
    );
  }
  const letter = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size,
      borderRadius: square ? 10 : '50%',
      background: '#27272a', border: '1px solid #3f3f46',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      color: '#d4d4d8', fontWeight: 700,
      fontSize: Math.round(size * 0.4),
      fontFamily: 'ui-monospace,monospace',
    }}>
      {letter}
    </div>
  );
}
