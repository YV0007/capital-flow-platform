// Shared chrome for the home landing sections — scroll-reveal wrapper and
// the section header (eyebrow · title · "open" affordance).

import { useEffect, useRef, useState } from 'react';

export const MONO = 'ui-monospace, monospace';
export const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

/** Fades + floats children in the first time they scroll into view. */
export function Reveal({ children, delay = 0, style }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setShown(true); obs.disconnect(); }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(26px)',
        transition: `opacity 750ms ${EASE} ${delay}ms, transform 750ms ${EASE} ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Eyebrow + title row with a right-aligned "Open →" action. */
export function SectionHeader({ eyebrow, title, sub, accent, actionLabel, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
      <div style={{ maxWidth: 640 }}>
        <div style={{
          fontSize: 10, color: accent, fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 18, height: 1, background: accent, display: 'inline-block', opacity: 0.7 }} />
          {eyebrow}
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          {title}
        </div>
        {sub && (
          <div style={{ fontSize: 13, color: '#a1a1aa', marginTop: 8, lineHeight: 1.55 }}>{sub}</div>
        )}
      </div>
      {actionLabel && (
        <button
          onClick={onAction}
          className="hm-action"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'transparent', border: `1px solid ${accent}35`,
            borderRadius: 999, padding: '8px 18px', cursor: 'pointer',
            fontSize: 11, fontFamily: MONO, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em', color: accent,
            transition: `all 200ms ${EASE}`, whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = accent + '14';
            e.currentTarget.style.borderColor = accent + '70';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = accent + '35';
          }}
        >
          {actionLabel}
          <span style={{ fontSize: 14, lineHeight: 1 }}>→</span>
        </button>
      )}
    </div>
  );
}

/** Logo tile with monogram fallback — used by flow rows and holdings. */
export function LogoTile({ src, mono, color, size = 30, radius = 8 }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <span style={{
        width: size, height: size, borderRadius: radius, flexShrink: 0,
        background: '#131316', border: '1px solid rgba(255,255,255,0.08)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          style={{ width: '72%', height: '72%', objectFit: 'contain' }}
        />
      </span>
    );
  }
  return (
    <span style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: `linear-gradient(135deg, ${color}2e 0%, ${color}10 100%)`,
      border: `1px solid ${color}40`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, color, fontFamily: MONO,
      letterSpacing: '0.02em',
    }}>
      {mono}
    </span>
  );
}
