// ══════════════════════════════════════════════════════════════════════════
// BucketPie + BucketSidePanel – Section 2 of the Data Centers for AI report.
// The two are tightly coupled: hovering a slice of the pie reveals detail in
// the side panel, and hovering a row in the side panel highlights its slice.
// Lifting the shared `hovered` state into the parent DataCentersAI component
// keeps them in sync.
// ══════════════════════════════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';

// Pie chart – receives bucketStats and a hovered setter from parent.
// Slices animate in on mount, scale up on hover, and dim others.
export function BucketPie({ buckets, hovered, setHovered }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const total = buckets.reduce((s, b) => s + b.count, 0);
  const cx = 100, cy = 100, rOuter = 88, rInner = 52;
  let cum = 0;
  const arcs = buckets.map(b => {
    const start = (cum / total) * Math.PI * 2 - Math.PI / 2;
    cum += b.count;
    const end   = (cum / total) * Math.PI * 2 - Math.PI / 2;
    const large = end - start > Math.PI ? 1 : 0;
    const p = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [x1, y1] = p(start, rOuter);
    const [x2, y2] = p(end,   rOuter);
    const [x3, y3] = p(end,   rInner);
    const [x4, y4] = p(start, rInner);
    return {
      ...b,
      d: `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`,
    };
  });
  const focus = hovered != null ? arcs[hovered] : null;

  return (
    <div style={{ position: 'relative', width: 280, height: 280, justifySelf: 'center' }}>
      <svg width="280" height="280" viewBox="0 0 200 200" style={{ display: 'block', overflow: 'visible' }}>
        {arcs.map((a, i) => {
          const isHover = hovered === i;
          const isDim   = hovered != null && hovered !== i;
          return (
            <path key={a.name} d={a.d}
              fill={a.color}
              fillOpacity={isDim ? 0.22 : (isHover ? 1 : 0.85)}
              stroke="#0a0a0a" strokeWidth="1.2"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                transform: isHover ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: '100px 100px',
                transition: 'all 200ms ease-out',
                cursor: 'pointer',
                opacity: mounted ? 1 : 0,
                transitionDelay: mounted ? `${i * 40}ms` : '0ms',
              }}/>
          );
        })}
      </svg>
      {/* Center label */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
      }}>
        {focus ? (
          <>
            <div style={{ fontSize: 32, fontWeight: 700, color: focus.color, fontFamily: 'ui-monospace,monospace', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {focus.pct.toFixed(0)}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--hm-text3)', fontFamily: 'ui-monospace,monospace', marginTop: 6 }}>
              {focus.count} {focus.count === 1 ? 'company' : 'companies'}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--hm-text)', fontFamily: 'ui-monospace,monospace', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {total}
            </div>
            <div style={{ fontSize: 10, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Companies
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Right-side panel showing either bucket list (default) or detail of hovered bucket.
export function BucketSidePanel({ buckets, hovered, setHovered }) {
  const focus = hovered != null ? buckets[hovered] : null;

  return (
    <div style={{ minHeight: 280, display: 'flex', flexDirection: 'column' }}>
      {focus ? (
        <div style={{
          background: 'var(--hm-surface)',
          border: `1px solid color-mix(in srgb, ${focus.color} 20%, transparent)`,
          borderLeft: `3px solid ${focus.color}`,
          borderRadius: 8, padding: '20px 22px',
          animation: 'dcFadeIn 200ms ease-out',
        }}>
          <div style={{
            fontSize: 10, color: focus.color, fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.14em', fontWeight: 700, marginBottom: 10,
          }}>SECTOR</div>
          <div style={{ fontSize: 22, color: 'var(--hm-text)', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 18 }}>
            {focus.name}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                Share of coverage
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 26, color: focus.color, fontWeight: 700, fontFamily: 'ui-monospace,monospace', letterSpacing: '-0.02em' }}>
                  {focus.pct.toFixed(1)}%
                </span>
                <span style={{ fontSize: 11, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace' }}>
                  {focus.count} of 41
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                Top company
              </div>
              <div style={{ fontSize: 16, color: 'var(--hm-text)', fontWeight: 600 }}>
                {focus.topCompany}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace', marginTop: 2 }}>
                {focus.topTicker}
              </div>
            </div>
          </div>

          <div style={{
            fontSize: 12, color: 'var(--hm-text2)', lineHeight: 1.65,
            padding: '14px 16px', background: 'rgba(0,0,0,0.25)',
            borderRadius: 6, borderLeft: `2px solid color-mix(in srgb, ${focus.color} 33%, transparent)`,
          }}>
            {focus.why}
          </div>
        </div>
      ) : (
        <div>
          <div style={{
            fontSize: 11, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace',
            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14,
          }}>
            Hover a slice for detail · {buckets.length} buckets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {buckets.map((b, i) => (
              <div key={b.name}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'grid', gridTemplateColumns: '14px 1fr auto auto',
                  gap: 12, alignItems: 'center',
                  padding: '8px 12px', borderRadius: 5,
                  background: 'rgba(255,255,255,0.015)',
                  border: '1px solid var(--hm-border4)',
                  transition: 'all 140ms',
                  cursor: 'pointer',
                }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: b.color }}></span>
                <span style={{ fontSize: 12.5, color: 'var(--hm-text2)' }}>{b.name}</span>
                <span style={{ fontSize: 11, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace' }}>
                  {b.count}
                </span>
                <span style={{ fontSize: 11, color: 'var(--hm-text3)', fontFamily: 'ui-monospace,monospace', fontWeight: 600, minWidth: 46, textAlign: 'right' }}>
                  {b.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`
        @keyframes dcFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
