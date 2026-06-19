// Single company card in the landing grid.
import React, { useMemo, useState } from 'react';
import { iconForSector, CARD_TEXTURE, CARD_RIM_SHADOW, CARD_RIM_SHADOW_HOVER } from './yc-sector-colors.js';

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
        position: 'relative',
        ...CARD_TEXTURE,
        border: `1px solid ${hover ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 14,
        padding: '18px 18px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        color: 'inherit', font: 'inherit',
        display: 'flex', flexDirection: 'column', gap: 12,
        minHeight: 168,
        transition: 'border-color 160ms, box-shadow 160ms, transform 160ms',
        boxShadow: hover ? CARD_RIM_SHADOW_HOVER : CARD_RIM_SHADOW,
        transform: hover ? 'translateY(-1px)' : 'translateY(0)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <Logo name={company.name} url={company.logo} domain={domainFromUrl(company.website)} size={60} />
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
          {visibleSectors.map(s => {
            const Icon = iconForSector(s);
            return (
              <span key={s} style={{
                fontSize: 10.5, color: '#d4d4d8',
                padding: '4px 9px 4px 7px', borderRadius: 4,
                background: '#27272a', border: '1px solid #3f3f46',
                fontFamily: 'ui-monospace,monospace',
                fontWeight: 500,
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>
                {Icon && <Icon size={11} style={{ flexShrink: 0, color: '#a1a1aa' }} />}
                {s}
              </span>
            );
          })}
          {extraCount > 0 && (
            <span style={{
              fontSize: 10.5, color: '#71717a',
              padding: '4px 8px', borderRadius: 4,
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

// Strip protocol and "www." from a URL → bare domain. Returns null on failure.
export function domainFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

// Logo component with multi-source fallback chain:
// 1. explicit `url` (if provided)
// 2. Clearbit logo for `domain`
// 3. letter-circle fallback (always works)
export function Logo({ name, url, domain, size = 60, square = true }) {
  const [idx, setIdx] = useState(0);

  // Clearbit's free Logo API is dead (returns nothing as of 2024+).
  // Google s2 favicons works for any live domain and serves up to 256px
  // when the site provides one — good enough scaled to 60–92px.
  const sources = useMemo(() => {
    const arr = [];
    if (url) arr.push(url);
    if (domain) arr.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    return arr;
  }, [url, domain]);

  if (idx < sources.length) {
    return (
      <img
        src={sources[idx]}
        alt={name}
        onError={() => setIdx(idx + 1)}
        style={{
          width: size, height: size,
          borderRadius: square ? 10 : '50%',
          objectFit: 'contain',
          background: '#fafafa',
          flexShrink: 0,
          padding: 4,
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
