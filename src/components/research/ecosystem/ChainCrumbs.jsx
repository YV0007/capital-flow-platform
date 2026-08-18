// ══════════════════════════════════════════════════════════════════════════
// ChainCrumbs — the chain, as a sentence.
//
//   ASML —поставляет→ TSMC —поставляет→ NVIDIA —строит вместе→ Foxconn …
//
// Sits under the map, on the same strongest-path walk the canvas lit up. This
// is the part you can read out loud and repeat to someone, which is usually
// worth more than the graph it summarises. Every crumb re-roots the chain.
// ══════════════════════════════════════════════════════════════════════════

import { X, CornerDownRight } from 'lucide-react';

const MONO = 'ui-monospace, monospace';

export default function ChainCrumbs({ crumbs, rootId, counts, onOpenEntity, onClear, rightInset = 0 }) {
  if (!crumbs || crumbs.length < 2) return null;

  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: 16, zIndex: 22,
      transform: `translateX(calc(-50% - ${rightInset / 2}px))`,
      maxWidth: `min(1080px, calc(100vw - ${rightInset + 60}px))`,
      background: 'var(--cf-panel)',
      border: '1px solid var(--cf-border)', borderRadius: 12,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 22px 60px -22px var(--cf-shadow)',
      animation: 'cfmRise 200ms cubic-bezier(0.2,0.8,0.2,1)',
      padding: '10px 12px 11px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <CornerDownRight size={11} color="var(--cf-text7)" />
        <span style={{
          fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>
          Цепочка по стеку
        </span>
        <span style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO }}>
          {counts?.up || 0} вверх · {counts?.down || 0} вниз
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={onClear} title="Снять цепочку (Esc)"
          style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 2, lineHeight: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
          <X size={13} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', rowGap: 6 }}>
        {crumbs.map((c, i) => (
          <span key={`${c.node.id}:${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {i > 0 && c.edge && (
              <span title={c.edge.note || ''} style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                margin: '0 1px', padding: '0 5px',
                fontSize: 8.5, fontFamily: MONO, fontWeight: 700,
                color: c.edge.color, textTransform: 'uppercase', letterSpacing: '0.05em',
                whiteSpace: 'nowrap', cursor: 'help',
              }}>
                <Arrow color={c.edge.color} />
                {c.edge.typeLabel}
                {c.edge.techMeta ? ` · ${c.edge.techMeta.label}` : ''}
                <Arrow color={c.edge.color} head />
              </span>
            )}
            <button
              onClick={() => onOpenEntity(c.node.id)}
              title={c.node.oneLiner || c.node.name}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 9px',
                background: c.node.id === rootId ? 'var(--cf-accent-bg)' : 'var(--cf-surface2)',
                border: `1px solid ${c.node.id === rootId ? 'var(--cf-accent-bd)' : 'var(--cf-border)'}`,
                borderRadius: 7, cursor: 'pointer',
                color: c.node.id === rootId ? 'var(--cf-accent)' : 'var(--cf-text1)',
                fontSize: 11.5, fontWeight: c.node.id === rootId ? 700 : 600,
                whiteSpace: 'nowrap', transition: 'all 120ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cf-text9)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = c.node.id === rootId ? 'var(--cf-accent-bd)' : 'var(--cf-border)')}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: c.node.color, flexShrink: 0 }} />
              {c.node.name}
              <span style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700 }}>
                {c.node.primaryLayer}
              </span>
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

/** The arrow shaft / head, so the relation reads as a link and not as a tag. */
function Arrow({ color, head }) {
  return (
    <span style={{
      display: 'inline-block', width: head ? 0 : 10, height: 1,
      background: head ? 'transparent' : color, opacity: 0.75,
      borderLeft: head ? `5px solid ${color}` : 'none',
      borderTop: head ? '3px solid transparent' : 'none',
      borderBottom: head ? '3px solid transparent' : 'none',
    }} />
  );
}
