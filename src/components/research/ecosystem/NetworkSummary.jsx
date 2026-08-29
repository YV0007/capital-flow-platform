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
// CONTRACT /4 ADDED THE TOP OF THIS PANEL. Where the map used to be defined by
// its anchor — «всё, что в двух шагах от NVIDIA» — it is now defined by its
// SUBJECT (`meta.scope`) and its BORDER (`meta.membership`). Both are stated
// here, because a reader who does not know what the map is a map OF cannot
// judge anything below. The membership numbers are not decoration either: 34
// of the 108 nodes fail a check and are held on the map by somebody else's
// confirmed dossier, and 31 have not been researched at all. That is the state
// of the map, and it belongs where the map describes itself.
//
// Everything here is the engine's `network` and `meta` blocks, arranged.
// Nothing computed.
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { X, Waypoints, AlertTriangle, Compass, ChevronDown, ChevronRight } from 'lucide-react';
import {
  NETWORK_META, META, MEMBERSHIP_META, MEMBERSHIP_CHECK_META,
} from '../../../data/aiEcosystemNetwork.js';
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

export default function NetworkSummary({ network, entityById, version, onOpenEntity, onOpenSubgraph, onClose }) {
  const t = useT();
  const [heldOpen, setHeldOpen] = useState(false);
  if (!network) return null;
  const spof = network.spof || [];
  const mb = META.membership || null;
  const heldNodes = mb?.heldNodes || [];

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

      {/* ── ЧТО ЭТО ЗА КАРТА ────────────────────────────────────────────
             Здесь до контракта /4 стоял якорь: карта определялась компанией в
             центре. Теперь она определяется предметом, и предмет — это цитата
             из `meta.scope`, а не наша формулировка. ─────────────────────── */}
      {META.scope && (
        <div style={{ padding: '11px 13px 9px', borderBottom: '1px solid var(--cf-border-hair)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5,
            fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.11em',
          }}>
            <Compass size={10} /> {t('Предмет карты', "The map's subject")}
          </div>
          <div style={{ fontSize: 11, color: 'var(--cf-text2)', lineHeight: 1.55 }}>{META.scope}</div>
          {META.coreRule && (
            <div style={{ fontSize: 9.5, color: 'var(--cf-text6)', lineHeight: 1.5, marginTop: 6 }}>
              {t(`Ядро — правило «${META.coreRule}»: состав вычисляется по интеграции каждый прогон, списка руками нет.`,
                 `The core is the rule “${META.coreRule}”: the set is computed from integration on every run, and there is no hand-kept list.`)}
            </div>
          )}
        </div>
      )}

      {/* ── ГРАНИЦА КАРТЫ ───────────────────────────────────────────────
             Три проверки членства, и сколько узлов каждую из них не проходит.
             Удержанный узел — не ошибка и не мусор: его назвало чужое
             подтверждённое досье, поэтому он остаётся на карте помеченным.
             Показывать сеть, не показывая, из чего состоит её край, значит
             выдавать 108 узлов за 108 одинаково обоснованных. ───────────── */}
      {mb && (
        <div style={{ padding: '10px 13px 11px', borderBottom: '1px solid var(--cf-border-hair)' }}>
          <div style={{
            fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.11em', marginBottom: 7,
          }}>{t('Членство', 'Membership')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <MemberRow label={MEMBERSHIP_META.admittedLabel} blurb={MEMBERSHIP_META.admittedBlurb} value={mb.admitted} />
            <MemberRow label={MEMBERSHIP_META.heldLabel} blurb={MEMBERSHIP_META.heldBlurb} value={mb.held} warn={!!mb.held} />
            <MemberRow label={MEMBERSHIP_META.pendingLabel} blurb={MEMBERSHIP_META.pendingBlurb} value={mb.pendingDossier} warn={!!mb.pendingDossier} />
            {mb.retired != null && (
              <MemberRow label={MEMBERSHIP_META.retiredLabel} blurb={MEMBERSHIP_META.retiredBlurb} value={mb.retired} />
            )}
            {mb.queued != null && (
              <MemberRow label={MEMBERSHIP_META.queuedLabel} blurb={MEMBERSHIP_META.queuedBlurb} value={mb.queued} />
            )}
          </div>

          {heldNodes.length > 0 && (
            <>
              <button onClick={() => setHeldOpen(o => !o)} style={{
                marginTop: 8, display: 'flex', alignItems: 'center', gap: 4,
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.09em',
              }}>
                {heldOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                {t('кто удержан и почему', 'who is held, and why')}
                <span style={{ color: 'var(--cf-text8)' }}>· {heldNodes.length}</span>
              </button>
              {heldOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 7 }}>
                  {heldNodes.map(h => (
                    <button key={h.id} onClick={() => onOpenEntity?.(h.id)}
                      title={MEMBERSHIP_CHECK_META[h.failed]?.blurb}
                      style={{
                        display: 'flex', alignItems: 'baseline', gap: 7, width: '100%',
                        padding: '4px 7px', borderRadius: 6, textAlign: 'left',
                        background: 'var(--cf-surface2)', border: '1px dashed var(--cf-border)', cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cf-text9)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border)')}>
                      <span style={{ fontSize: 10.5, color: 'var(--cf-text2)', fontWeight: 600 }}>
                        {entityById?.get(h.id)?.name || h.id}
                      </span>
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cf-text6)' }}>
                        {MEMBERSHIP_CHECK_META[h.failed]?.label || h.failed}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

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

/** One membership count with the sentence that says what it means. */
function MemberRow({ label, blurb, value, warn }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--cf-text3)' }}>{label}</span>
        <span style={{ flex: 1 }} />
        <span style={{
          fontSize: 12.5, fontFamily: MONO, fontWeight: 700,
          color: warn ? 'var(--cf-warn)' : 'var(--cf-text1)',
        }}>{value ?? '—'}</span>
      </div>
      <div style={{ fontSize: 9.5, color: 'var(--cf-text6)', lineHeight: 1.45, marginTop: 2 }}>{blurb}</div>
    </div>
  );
}
