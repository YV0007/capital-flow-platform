// ══════════════════════════════════════════════════════════════════════════
// NetworkSummary — the network-science read on the whole graph.
//
// A LIGHT panel, not a modal: it floats bottom-left, does not block the map,
// and closes on its own X or Esc. It exists because three of the network
// aggregates — density, average degree, clustering — do not fit on the top-bar
// stats line, and a number like "density 0.044" means nothing without one line
// saying what it is. The COUNTS (nodes, edges, pivots, subgraphs, SPOF) live
// inline on the top bar; this panel is where you come for the shape of the
// network and the list of its chokepoints.
//
// Everything here is the engine's `network` block, arranged. Nothing computed.
// ══════════════════════════════════════════════════════════════════════════

import { X, Waypoints, AlertTriangle } from 'lucide-react';
import { NETWORK_META } from '../../../data/aiEcosystemNetwork.js';
import { useT } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';

// Which aggregates to show, in order, and how to render each value.
const FIELDS = [
  { key: 'totalNodes',   fmt: (v) => v },
  { key: 'totalEdges',   fmt: (v) => v },
  { key: 'pivotalNodes', fmt: (v) => v },
  { key: 'secondaryNodes', fmt: (v) => v },
  { key: 'averageDegree', fmt: (v) => (v == null ? '—' : v) },
  { key: 'density',      fmt: (v) => (v == null ? '—' : v) },
  { key: 'clusteringCoefficient', fmt: (v) => (v == null ? '—' : v) },
];

export default function NetworkSummary({ network, version, onOpenEntity, onOpenSubgraph, onClose }) {
  const t = useT();
  if (!network) return null;
  const spof = network.spof || [];

  return (
    <aside style={{
      position: 'absolute', left: 14, bottom: 14, zIndex: 23, width: 320,
      maxHeight: 'calc(100% - 120px)', overflowY: 'auto',
      background: 'var(--cf-panel)', border: '1px solid var(--cf-border)', borderRadius: 12,
      backdropFilter: 'blur(10px)', boxShadow: '0 22px 60px -22px var(--cf-shadow)',
      animation: 'cfmDrop 180ms ease-out',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '11px 13px', borderBottom: '1px solid var(--cf-border-soft)',
      }}>
        <Waypoints size={13} color="var(--cf-text4)" />
        <span style={{
          fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>{t('Сводка сети', 'Network summary')}</span>
        {version && (
          <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--cf-text7)' }}>{version}</span>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onClose} title={t('Закрыть (Esc)', 'Close (Esc)')}
          style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 2, lineHeight: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
          <X size={14} />
        </button>
      </div>

      {/* Aggregates — each with its one-line meaning, so a bare 0.044 is never
          left unexplained. */}
      <div style={{ padding: '10px 13px 6px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {FIELDS.map(f => {
          const meta = NETWORK_META[f.key];
          if (!meta) return null;
          return (
            <div key={f.key}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--cf-text3)' }}>{meta.label}</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12.5, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text1)' }}>
                  {f.fmt(network[f.key])}
                </span>
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--cf-text6)', lineHeight: 1.45, marginTop: 2 }}>{meta.blurb}</div>
            </div>
          );
        })}
      </div>

      {/* Single points of failure — the structural chokepoints, each with the
          engine's own reason. Clicking one opens it on the map. */}
      {spof.length > 0 && (
        <div style={{ padding: '4px 13px 12px', borderTop: '1px solid var(--cf-border-hair)', marginTop: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 0 7px',
            fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            <AlertTriangle size={11} /> {t('Точки отказа', 'Points of failure')} <span style={{ color: 'var(--cf-text8)' }}>· {spof.length}</span>
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--cf-text6)', lineHeight: 1.45, marginBottom: 8 }}>
            {t('Не самые критичные, а самые «узкие»: убери — и сеть распадается на куски. Считается по посредничеству, а не по важности.', 'Not the most critical but the narrowest: remove one and the network falls apart. Measured by betweenness, not by importance.')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {spof.map(s => (
              <button key={s.id} onClick={() => onOpenEntity?.(s.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                  padding: '7px 9px', borderRadius: 7,
                  background: 'var(--cf-surface2)', border: '1px dashed var(--cf-border)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cf-text9)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border)')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cf-text1)' }}>{s.name || s.id}</span>
                  <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--cf-text7)', marginLeft: 'auto' }}>
                    {s.layerLabel || s.layer}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--cf-text5)', lineHeight: 1.45, marginTop: 3 }}>{s.reason}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subgraphs — jump straight into a lens from here. */}
      {network.subgraphs?.length > 0 && (
        <div style={{ padding: '4px 13px 13px', borderTop: '1px solid var(--cf-border-hair)' }}>
          <div style={{
            padding: '9px 0 7px', fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>{t('Подграфы', 'Subgraphs')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {network.subgraphs.map(sg => (
              <button key={sg.id} onClick={() => onOpenSubgraph?.(sg.id)}
                title={sg.description}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 9px',
                  background: 'var(--cf-surface2)', border: `1px solid ${sg.color}55`, borderRadius: 7, cursor: 'pointer',
                }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: sg.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, color: 'var(--cf-text2)', fontWeight: 600 }}>{sg.label}</span>
                <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--cf-text7)' }}>{sg.nodeCount}</span>
                {sg.degenerate && <span title={t('Вырожден', 'Degenerate')} style={{ fontSize: 8, color: 'var(--cf-warn)', fontFamily: MONO }}>!</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
