// ══════════════════════════════════════════════════════════════════════════
// ChainCrumbs — the chain, as a sentence, AND the reader's way in.
//
//   ASML —поставляет→ TSMC —производит→ NVIDIA —отгружает→ Foxconn …
//
// Sits under the map, on the same strongest-path walk the canvas lit up. This
// is the part you can read out loud and repeat to someone, which is usually
// worth more than the graph it summarises. Every crumb re-roots the chain.
//
// It also does a second, quieter job: it is the FIRST thing a newcomer reads
// when they open a node, so it sets the tone for how to read the whole system
// around it. Two devices carry that, and no more — the bar must stay light:
//   · a one-line caption that says which way the chain runs (left = what it
//     depends on, right = what depends on it) and where to look;
//   · a three-tier emphasis on the crumbs themselves — the studied node is the
//     accent, the VITAL nodes (network pivots and the near-irreplaceable) glow
//     in their layer colour, and everything else recedes. So the eye lands on
//     the handful of nodes that actually frame the chain, not on every link.
// ══════════════════════════════════════════════════════════════════════════

import { X, CornerDownRight } from 'lucide-react';
import { useT } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';

// A node is VITAL — worth the reader's attention as context — when it is one of
// the network's pivots or is near-irreplaceable in its own right. Everything
// else on the path is a link, not a landmark. The threshold matches the
// criticality band's top cut («Критично», 90+ … we take 85 so a strong «Высоко»
// counts too), so what glows here is exactly what the panel calls load-bearing.
const isVital = (n) => !!(n?.isPivotal || (n?.criticality ?? 0) >= 85);

export default function ChainCrumbs({ crumbs, rootId, counts, onOpenEntity, onClear, rightInset = 0 }) {
  const t = useT();
  if (!crumbs || crumbs.length < 2) return null;

  return (
    <div style={{
      // Same shell as capitalflow/FlowDetailCard: an explicit width centred on
      // the canvas MINUS the panel, and a transition on both, so the card
      // glides across when the panel opens instead of jumping. Sizing by
      // content made the card shrink-to-fit at its max width and left the
      // wrapped second row hanging off to one side.
      position: 'absolute', left: `calc(50% - ${rightInset / 2}px)`, bottom: 16, zIndex: 22,
      transform: 'translateX(-50%)',
      width: `min(860px, calc(100% - ${rightInset + 60}px))`, minWidth: 320,
      boxSizing: 'border-box',
      background: 'var(--cf-panel)',
      border: '1px solid var(--cf-border)', borderRadius: 12,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 22px 60px -22px var(--cf-shadow)',
      animation: 'cfmRise 200ms cubic-bezier(0.2,0.8,0.2,1)',
      transition: 'left 220ms cubic-bezier(0.2,0.8,0.2,1), width 220ms cubic-bezier(0.2,0.8,0.2,1)',
      padding: '10px 14px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <CornerDownRight size={11} color="var(--cf-text7)" />
        <span style={{
          fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>
          {t('Цепочка по стеку', 'Chain through the stack')}
        </span>
        <span style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO }}>
          {counts?.up || 0} {t('вверх', 'up')} · {counts?.down || 0} {t('вниз', 'down')}
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={onClear} title={t('Снять цепочку (Esc)', 'Clear chain (Esc)')}
          style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 2, lineHeight: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
          <X size={13} />
        </button>
      </div>

      {/* The reading key — one line, so the chain is legible before it is
          studied: which way it runs, and which crumbs are the ones to weigh. */}
      <div style={{
        fontSize: 9.5, color: 'var(--cf-text6)', lineHeight: 1.45, marginBottom: 9,
      }}>
        {t(
          t('Слева — от кого зависит, справа — кто зависит от него. Ярче выделены ключевые узлы — с них и читайте.', 'Left is what it depends on, right is what depends on it. The key nodes are brighter — start there.'),
          'Left — what it depends on; right — what depends on it. The brighter tiles are the key nodes — read from those.',
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap', rowGap: 6 }}>
        {crumbs.map((c, i) => {
          const isRoot = c.node.id === rootId;
          const vital = !isRoot && isVital(c.node);
          // Three tiers of ink: root (accent), vital (glows in its own layer
          // colour), everything else (dimmed). The contrast IS the "where to
          // look" — no extra icon, no new colour.
          const bg = isRoot ? 'var(--cf-accent-bg)' : vital ? c.node.color + '14' : 'var(--cf-surface2)';
          const bd = isRoot ? 'var(--cf-accent-bd)' : vital ? c.node.color + '44' : 'var(--cf-border)';
          const fg = isRoot ? 'var(--cf-accent)' : vital ? 'var(--cf-text1)' : 'var(--cf-text4)';
          return (
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
                  {/* The VERB, not the label — a crumb is a sentence you read
                      out loud, and `verb` is the field the contract keeps for
                      exactly that. All 31 types are picked up for free. */}
                  {c.edge.verb || c.edge.typeLabel}
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
                  background: bg,
                  border: `1px solid ${bd}`,
                  borderRadius: 7, cursor: 'pointer',
                  color: fg,
                  fontSize: 11.5, fontWeight: (isRoot || vital) ? 700 : 500,
                  opacity: (isRoot || vital) ? 1 : 0.72,
                  whiteSpace: 'nowrap', transition: 'all 120ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cf-text9)'; e.currentTarget.style.opacity = 1; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = bd; e.currentTarget.style.opacity = (isRoot || vital) ? 1 : 0.72; }}>
                <span style={{ width: 6, height: 6, borderRadius: 2, background: c.node.color, flexShrink: 0 }} />
                {c.node.name}
                <span style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700 }}>
                  {c.node.primaryLayerLabel || c.node.primaryLayer}
                </span>
              </button>
            </span>
          );
        })}
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
