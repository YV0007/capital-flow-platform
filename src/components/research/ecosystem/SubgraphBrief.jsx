// ══════════════════════════════════════════════════════════════════════════
// SubgraphBrief — what this sub-ecosystem IS, opened with the subgraph lens.
//
// The problem it solves: lighting 22 nodes tells you WHICH companies are in the
// GPU stack but not how it works, and the only way to find out was to click
// every tile in turn. This panel answers "how does this stack work, and who
// actually matters in it" before any clicking.
//
// Two halves, and the split is deliberate:
//
//   1. THE NARRATIVE (`subgraph.brief`) — engine prose. Who makes the thing,
//      what they need to make it, who buys it, what it is used for. Written
//      once by the engine because it needs research; the dashboard never
//      invents it. Runs through Glossed, so every company named in the prose
//      is a link straight into its node on the map.
//
//   2. THE CHAIN — derived here, from engine numbers only. Key players are
//      ranked by the engine's own `criticality`, cut to the top handful, then
//      grouped by layer and ordered by the layer's own `order` — which is the
//      value chain, because that is exactly what the orbit walk encodes. So
//      the panel reads raw materials → fabs → chips → software → buyers
//      without the dashboard deciding anything about importance.
//
// KEY PLAYERS ONLY. A sub-ecosystem summary that lists all 22 members is the
// same wall of names the map already shows. The cut is by criticality, and it
// is deliberately harsh — this is the overview, and the detail is one click
// away in the entity panel.
// ══════════════════════════════════════════════════════════════════════════

import { X, Network, ChevronRight, Info } from 'lucide-react';
import { useT } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';
export const SUBGRAPH_BRIEF_W = 430;

// How many entities can be "key" in one sub-ecosystem. Eight is about the
// number a reader holds at once; past that the overview becomes the map again.
const KEY_MAX = 8;
// A floor as well as a cap: in a subgraph of near-equals, the 8th is still a
// real player, but in a lopsided one nobody wants the tail. Whichever bites
// first wins.
const KEY_MIN_CRIT = 45;

export default function SubgraphBrief({
  subgraph, entityById, layerById, onOpenEntity, onClose, topInset = 0,
}) {
  const t = useT();
  if (!subgraph) return null;

  const members = [...(subgraph.nodeSet || [])]
    .map(id => entityById.get(id))
    .filter(Boolean);

  // The engine's own list wins when it ships one; otherwise rank by the
  // engine's criticality. Either way the dashboard is sorting, never scoring.
  const engineKeys = Array.isArray(subgraph.keyPlayers) ? subgraph.keyPlayers : null;
  const key = engineKeys
    ? engineKeys.map(k => ({ ...entityById.get(k.id || k), why: k.why })).filter(e => e && e.id)
    : members
      .slice()
      .sort((a, b) => (b.criticality || 0) - (a.criticality || 0))
      .filter((e, i) => i < KEY_MAX && (e.criticality || 0) >= KEY_MIN_CRIT);

  // Group the key players by layer and walk the layers in their own order —
  // that ordering IS the value chain, so the groups read as chain steps.
  const steps = [];
  key.forEach(e => {
    const lid = e.primaryLayer;
    let s = steps.find(x => x.layer === lid);
    if (!s) {
      const meta = layerById?.get(lid);
      s = { layer: lid, order: meta?.order ?? 99, label: meta?.label || lid,
            caption: meta?.caption || '', members: [] };
      steps.push(s);
    }
    s.members.push(e);
  });
  steps.sort((a, b) => a.order - b.order);

  return (
    <aside style={{
      position: 'absolute', top: topInset, right: 0, bottom: 0,
      width: SUBGRAPH_BRIEF_W, zIndex: 26,
      background: 'var(--cf-panel)', borderLeft: '1px solid var(--cf-border)',
      backdropFilter: 'blur(10px)', overflowY: 'auto',
      animation: 'cfmSlide 200ms ease-out',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 9,
        padding: '13px 15px 11px', borderBottom: '1px solid var(--cf-border-soft)',
        position: 'sticky', top: 0, background: 'var(--cf-panel)', zIndex: 2,
      }}>
        <span style={{
          width: 9, height: 9, borderRadius: 2, background: subgraph.color,
          flexShrink: 0, marginTop: 5,
        }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em' }}>
            {subgraph.label}
          </div>
          <div style={{ fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, marginTop: 3 }}>
            {subgraph.nodeCount} {t('узл.', 'nodes')} · {subgraph.edgeCount} {t('св.', 'edges')}
            {subgraph.degenerate && (
              <span style={{ color: 'var(--cf-warn)', fontWeight: 700 }}> · {t('вырожден', 'degenerate')}</span>
            )}
          </div>
        </div>
        <button onClick={onClose} title={t('Закрыть (Esc)', 'Close (Esc)')}
          style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 2, lineHeight: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
          <X size={15} />
        </button>
      </div>

      {/* The lede — the engine's one-liner, always present */}
      {subgraph.description && (
        <div style={{ padding: '13px 15px 0' }}>
          <div style={{
            padding: '11px 12px', background: 'var(--cf-surface1)',
            border: '1px solid var(--cf-border-soft)', borderRadius: 10,
            fontSize: 12.5, lineHeight: 1.55, fontWeight: 600, color: 'var(--cf-text1)',
          }}>
            {subgraph.description}
          </div>
        </div>
      )}

      {/* The narrative — engine prose, when it arrives. Explicitly marked as
          missing rather than silently absent, because its absence is the whole
          difference between an overview and a list of names. */}
      <Section icon={<Network size={12} />} title={t('Как работает этот стек', 'How this stack works')}>
        {subgraph.brief ? (
          <div style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--cf-text2)' }}>
            {subgraph.brief}
          </div>
        ) : (
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            fontSize: 11.5, lineHeight: 1.55, color: 'var(--cf-text6)', fontStyle: 'italic',
          }}>
            <Info size={12} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              {t('Разбор цепочки движок пока не прислал. Ниже — ключевые игроки по порядку слоёв: это и есть цепочка, только без слов.',
                 'The engine has not sent the chain write-up yet. Below are the key players in layer order — that is the chain, just without the words.')}
            </span>
          </div>
        )}
      </Section>

      {/* The chain — key players, grouped by layer, layers in chain order */}
      <Section icon={<ChevronRight size={12} />}
        title={`${t('Ключевые игроки', 'Key players')} · ${key.length} ${t('из', 'of')} ${members.length}`}>
        <div style={{ fontSize: 10, color: 'var(--cf-text6)', lineHeight: 1.45, marginBottom: 10 }}>
          {t('Отобраны по критичности — той же, что задаёт размер плитки на карте. Слои идут в порядке цепочки: сырьё и станки сверху, потребители снизу.',
             'Picked by criticality — the same number that sizes the tile on the map. Layers run in chain order: raw materials and tools at the top, buyers at the bottom.')}
        </div>
        {steps.map((s, i) => (
          <div key={s.layer} style={{ marginBottom: 11 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6,
            }}>
              <span style={{
                fontSize: 8.5, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text7)',
                letterSpacing: '0.08em',
              }}>{s.layer}</span>
              <span style={{
                fontSize: 9, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text4)',
                textTransform: 'uppercase', letterSpacing: '0.09em',
              }}>{s.label}</span>
              <span style={{ flex: 1, height: 1, background: 'var(--cf-border-hair)' }} />
              {i < steps.length - 1 && (
                <span style={{ fontSize: 10, color: 'var(--cf-text8)' }}>↓</span>
              )}
            </div>
            {s.members.map(e => (
              <button key={e.id} onClick={() => onOpenEntity?.(e.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                  padding: '7px 9px', marginBottom: 4, borderRadius: 8,
                  background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-hair)',
                }}
                onMouseEnter={(ev) => (ev.currentTarget.style.borderColor = 'var(--cf-border)')}
                onMouseLeave={(ev) => (ev.currentTarget.style.borderColor = 'var(--cf-border-hair)')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cf-text1)' }}>{e.name}</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 9, fontFamily: MONO, color: 'var(--cf-text7)',
                  }}>{e.criticality}</span>
                </div>
                {(e.why || e.oneLiner) && (
                  <div style={{ fontSize: 10.5, color: 'var(--cf-text5)', lineHeight: 1.45, marginTop: 4 }}>
                    {e.why || e.oneLiner}
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}
      </Section>

      <div style={{ height: 18 }} />
    </aside>
  );
}

function Section({ icon, title, children }) {
  return (
    <div style={{ padding: '14px 15px 0' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
        fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {icon} {title}
      </div>
      {children}
    </div>
  );
}
