// ══════════════════════════════════════════════════════════════════════════
// EcoEntityPanel — the breakdown for ONE company on the ecosystem map.
//
// Sibling of capitalflow/EntityPanel, but it answers different questions and
// in this order, then stops:
//
//   1. What is it, in one line, and in which layers does it sit
//   2. How critical — WITH the four rubric inputs, not just the score. A "98"
//      with no visible reason is a number to distrust.
//   3. How much gravity — and why that deliberately differs from criticality
//   4. Up the stack: what it depends on          (top 5, then the rest)
//   5. Down the stack: what depends on it        (top 5, then the rest)
//   6. Its layer's concentration, and its share of it
//   7. Public/private, ticker, geography, what breaks the position
//   8. Every edge carries its SOURCE: tier, date, link, quote
//   9. A jump into the matching DC-AI block
//
// The relation lists here are ALWAYS complete — the strength threshold is a
// canvas control, never a data control. A dependency you cannot see because a
// slider is at 20 is a dependency you will forget exists.
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import {
  X, ArrowDownLeft, ArrowUpRight, ExternalLink, Search, ChevronDown, ChevronRight,
  Layers, Quote, CircleDot, Zap, AlertTriangle,
} from 'lucide-react';
import {
  CRITICALITY_FACTORS, CONCENTRATION_META, criticalityBand, critIn,
} from '../../../data/ecosystemMap.js';

const MONO = 'ui-monospace, monospace';
export const ECO_PANEL_W = 400;

export default function EcoEntityPanel({
  node, up, down, nodeById, layerById, isFixture,
  selectedEdgeId, onSelectEdge, onOpenEntity, onOpenLayer, onOpenDcNode, onClose,
  topInset = 0,
}) {
  const [openEvidence, setOpenEvidence] = useState(null);   // edge id
  const [showAllUp, setShowAllUp] = useState(false);
  const [showAllDown, setShowAllDown] = useState(false);
  if (!node) return null;

  const cb = criticalityBand(node.criticality);
  const primaryLayer = layerById.get(node.primaryLayer);
  const conc = primaryLayer ? CONCENTRATION_META[primaryLayer.concentration?.level] : null;
  // Share of the layer's total criticality — a proxy for "how much of this
  // layer is this one company", computed from the engine's own per-layer
  // scores. Nothing is invented; it is a ratio of numbers already in the file.
  const layerShare = primaryLayer ? shareOfLayer(node, primaryLayer, nodeById) : null;

  return (
    <aside style={{
      position: 'absolute', top: topInset, right: 0, bottom: 0, width: ECO_PANEL_W, zIndex: 25,
      background: 'var(--cf-panel)',
      borderLeft: '1px solid var(--cf-border)',
      backdropFilter: 'blur(10px)',
      boxShadow: '-24px 0 60px -20px var(--cf-shadow)',
      display: 'flex', flexDirection: 'column',
      animation: 'cfmSlide 220ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '15px 16px 13px', borderBottom: '1px solid var(--cf-border-soft)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 3, background: node.color,
            marginTop: 6, flexShrink: 0, boxShadow: `0 0 12px ${node.color}80`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
              {node.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {node.roleMeta?.label} · {node.sectorLabel}
            </div>
          </div>
          <button onClick={onClose} title="Закрыть панель"
            style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 3, lineHeight: 0, flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <Chip title={node.roleMeta?.blurb}>{node.roleMeta?.short}</Chip>
          {node.tierMeta && (
            <Chip color={node.tierMeta.color} title={node.tierMeta.blurb}>{node.tierMeta.label}</Chip>
          )}
          <Chip title="Публичная или частная компания">{node.publicPrivate === 'Pub' ? 'ПУБЛИЧНАЯ' : 'ЧАСТНАЯ'}</Chip>
          {node.ticker && <Chip title="Биржевой тикер">{node.ticker}</Chip>}
          {node.geo && <Chip title="Юрисдикция">{node.geo}</Chip>}
          {node.onCycle && <Chip color="#E5484D" title="Компания стоит на замкнутом контуре — см. линзу «Круги»">В КРУГЕ</Chip>}
          {node.faded && (
            <Chip dashed title={`Не подтверждалось с ${node.lastConfirmed || '—'}`}>
              Не подтв. с {node.lastConfirmed || '—'}
            </Chip>
          )}
        </div>

        {node.oneLiner && (
          <div style={{ marginTop: 11, fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.5 }}>
            {node.oneLiner}
          </div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 40px' }}>

        {/* 1. Layers this company occupies */}
        <Section title="Где стоит в стеке" icon={<Layers size={11} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {node.segments.map(s => {
              const l = layerById.get(s.layer);
              return (
                <button key={s.layer} onClick={() => onOpenLayer?.(s.layer)}
                  style={rowBtn}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{
                    width: 34, fontSize: 9.5, fontFamily: MONO, fontWeight: 700,
                    color: s.primary ? 'var(--cf-accent)' : 'var(--cf-text6)', textAlign: 'left',
                  }}>{s.layer}</span>
                  <span style={{ flex: 1, fontSize: 11.5, color: 'var(--cf-text2)', textAlign: 'left' }}>
                    {l?.label || s.layer}
                    {s.primary && <span style={{ color: 'var(--cf-text7)', fontSize: 9, fontFamily: MONO }}> · основной</span>}
                  </span>
                  <Meter value={s.criticality} color={node.color} />
                  <span style={{ width: 26, fontSize: 10.5, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text3)', textAlign: 'right' }}>
                    {s.criticality}
                  </span>
                </button>
              );
            })}
          </div>
          {node.multiLayer && (
            <Note>Компания живёт в {node.segments.length} слоях — на карте это один узел-капсула, а не несколько кружков. Цепочка входит и выходит в нужном слое.</Note>
          )}
        </Section>

        {/* 2. Criticality, with the rubric opened up */}
        <Section title="Критичность" icon={<CircleDot size={11} />}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 10 }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: cb.color, lineHeight: 1, fontFamily: MONO }}>
              {node.criticality}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--cf-text3)', fontWeight: 600 }}>{cb.label}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CRITICALITY_FACTORS.map(f => {
              const v = node.criticalityFactors?.[f.key];
              return (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 132, fontSize: 10.5, color: 'var(--cf-text4)' }}>{f.label}</span>
                  <span style={{ width: 26, fontSize: 9, fontFamily: MONO, color: 'var(--cf-text7)' }}>×{f.weight}</span>
                  <Meter value={(v ?? 0) * 20} color={cb.color} width={54} />
                  <span style={{ flex: 1, fontSize: 10.5, color: 'var(--cf-text3)', textAlign: 'right' }}>
                    {v == null ? '—' : (f.scale[v] || v)}
                  </span>
                </div>
              );
            })}
          </div>
          <Note>
            Четыре входа по фиксированной рубрике, веса 0.30 · 0.30 · 0.25 · 0.15. Считает движок, дашборд только показывает.
          </Note>
        </Section>

        {/* 3. Gravity */}
        {node.gravity && (
          <Section title="Гравитация" icon={<Zap size={11} />}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--cf-text1)', lineHeight: 1, fontFamily: MONO }}>
                {node.gravity.score}
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--cf-text5)', fontFamily: MONO }}>
                {node.gravity.nodes} компаний · {node.gravity.layers} слоёв · {node.gravity.edgeTypes} типов связи
              </span>
            </div>
            <Note>
              {gravityRead(node)}
            </Note>
          </Section>
        )}

        {/* 4 + 5. Up and down the stack */}
        <RelationList
          title="Вверх по стеку — от кого зависит"
          icon={<ArrowDownLeft size={11} />}
          empty="Ни одной входящей зависимости в карте."
          edges={up} node={node} nodeById={nodeById} side="source"
          showAll={showAllUp} onShowAll={() => setShowAllUp(true)}
          selectedEdgeId={selectedEdgeId} onSelectEdge={onSelectEdge}
          openEvidence={openEvidence} onToggleEvidence={(id) => setOpenEvidence(p => (p === id ? null : id))}
          onOpenEntity={onOpenEntity} isFixture={isFixture}
        />
        <RelationList
          title="Вниз по стеку — кто зависит"
          icon={<ArrowUpRight size={11} />}
          empty="Никто в карте не зависит от этой компании напрямую."
          edges={down} node={node} nodeById={nodeById} side="target"
          showAll={showAllDown} onShowAll={() => setShowAllDown(true)}
          selectedEdgeId={selectedEdgeId} onSelectEdge={onSelectEdge}
          openEvidence={openEvidence} onToggleEvidence={(id) => setOpenEvidence(p => (p === id ? null : id))}
          onOpenEntity={onOpenEntity} isFixture={isFixture}
        />

        {/* 6. Layer concentration */}
        {primaryLayer && conc && (
          <Section title="Концентрация слоя" icon={<Layers size={11} />}>
            <button onClick={() => onOpenLayer?.(primaryLayer.id)} style={{ ...rowBtn, padding: '8px 16px' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <span style={{
                padding: '2px 7px', borderRadius: 4, background: conc.color + '1a',
                border: `1px solid ${conc.color}44`, color: conc.color,
                fontSize: 9, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.06em',
              }}>{conc.label}</span>
              <span style={{ flex: 1, fontSize: 11, color: 'var(--cf-text4)', textAlign: 'left' }}>
                {primaryLayer.label} · HHI {primaryLayer.concentration?.hhi ?? '—'}
              </span>
              <ChevronRight size={12} color="var(--cf-text7)" />
            </button>
            {layerShare != null && (
              <Note>
                На эту компанию приходится {Math.round(layerShare * 100)}% суммарной критичности слоя {primaryLayer.id}.
                {' '}{conc.blurb}
              </Note>
            )}
          </Section>
        )}

        {/* 7. What breaks it */}
        {node.whatBreaksIt && (
          <Section title="Что сломает позицию" icon={<AlertTriangle size={11} />}>
            <div style={{ padding: '0 16px', fontSize: 12, color: 'var(--cf-text2)', lineHeight: 1.55 }}>
              {node.whatBreaksIt}
            </div>
          </Section>
        )}

        {/* Tech nodes owned */}
        {node.tech?.length > 0 && (
          <Section title="Тех-узлы во владении">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 16px' }}>
              {node.tech.map(t => (
                <span key={t.id} title={t.note} style={{
                  padding: '3px 8px', borderRadius: 5,
                  background: 'var(--cf-surface2)', border: '1px solid var(--cf-border)',
                  fontSize: 10, color: 'var(--cf-text2)', fontFamily: MONO, fontWeight: 700, cursor: 'help',
                }}>{t.label}</span>
              ))}
            </div>
          </Section>
        )}

        {/* 9. Links out */}
        <Section title="Дальше">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
            {node.dcNode && onOpenDcNode && (
              <LinkRow onClick={() => onOpenDcNode(node.dcNode)} icon={<Layers size={12} />}>
                Технический разбор блока в DC-AI
              </LinkRow>
            )}
            <LinkRow href={node.searchUrl} icon={<Search size={12} />}>Найти в поиске</LinkRow>
          </div>
          <div style={{ padding: '10px 16px 0', fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO, lineHeight: 1.5 }}>
            Впервые в карте: {node.firstSeen || '—'} · подтверждено: {node.lastConfirmed || '—'}
          </div>
        </Section>
      </div>
    </aside>
  );
}

// ── Relation list — the full set, with sources per edge ──────────────────
function RelationList({
  title, icon, empty, edges, node, nodeById, side, showAll, onShowAll,
  selectedEdgeId, onSelectEdge, openEvidence, onToggleEvidence, onOpenEntity, isFixture,
}) {
  const TOP = 5;
  const list = showAll ? edges : edges.slice(0, TOP);
  const hidden = edges.length - list.length;

  return (
    <Section title={title} icon={icon} count={edges.length}>
      {!edges.length && <Note>{empty}</Note>}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {list.map(e => {
          const otherId = side === 'source' ? e.sourceId : e.targetId;
          const other = nodeById.get(otherId);
          if (!other) return null;
          const open = openEvidence === e.id;
          return (
            <div key={e.id} style={{
              borderTop: '1px solid var(--cf-border-hair)',
              background: e.id === selectedEdgeId ? 'var(--cf-hover)' : 'transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px' }}>
                <button onClick={() => onOpenEntity(other.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0,
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                  }}>
                  <span style={{ width: 6, height: 6, borderRadius: 2, background: other.color, flexShrink: 0 }} />
                  <span style={{
                    fontSize: 11.5, color: 'var(--cf-text1)', fontWeight: 600,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{other.name}</span>
                  <span style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, flexShrink: 0 }}>
                    {other.primaryLayer}
                  </span>
                </button>
                <span title={e.typeMeta?.blurb} style={{
                  fontSize: 8.5, fontFamily: MONO, fontWeight: 700, color: e.color,
                  textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'help', flexShrink: 0,
                }}>{e.typeLabel}</span>
                <span title="Существенность связи ДЛЯ ПОЛУЧАТЕЛЯ, 0–100" style={{
                  width: 24, fontSize: 10, fontFamily: MONO, fontWeight: 700,
                  color: 'var(--cf-text4)', textAlign: 'right', cursor: 'help', flexShrink: 0,
                }}>{e.strength}</span>
                <button
                  onClick={() => { onSelectEdge?.(e.id); onToggleEvidence(e.id); }}
                  title="Источник и цитата"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 0,
                    color: open ? 'var(--cf-accent)' : 'var(--cf-text7)', flexShrink: 0,
                  }}>
                  {open ? <ChevronDown size={12} /> : <Quote size={11} />}
                </button>
              </div>

              {open && (
                <div style={{ padding: '2px 16px 11px' }}>
                  {e.note && (
                    <div style={{ fontSize: 11, color: 'var(--cf-text3)', lineHeight: 1.5, marginBottom: 7 }}>{e.note}</div>
                  )}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                    <Chip color={e.tierMeta?.color} title={e.tierMeta?.label}>{e.tierMeta?.short}</Chip>
                    <Chip title="Правило двух источников: сплошная линия на карте только при двух и более независимых подтверждениях">
                      {e.confirmedSources >= 2 ? '2+ ИСТОЧНИКА' : '1 ИСТОЧНИК'}
                    </Chip>
                    {e.engineConfirmed && <Chip color="#34D399" title="Та же связь доказана недельным конвейером карты потоков">ПОДТВ. ДВИЖКОМ</Chip>}
                    {e.spine === 'capital' && <Chip color="#E0A340" title="Связь на хребте капитала — владение и деньги, а не физическая поставка">ХРЕБЕТ КАПИТАЛА</Chip>}
                    {e.started && <Chip title="Год начала отношений">с {e.started}</Chip>}
                    {e.status !== 'active' && <Chip dashed>{e.statusMeta?.label}</Chip>}
                  </div>
                  {(e.evidence || []).map((ev, i) => (
                    <div key={i} style={{
                      borderLeft: `2px solid ${e.color}66`, paddingLeft: 9, marginBottom: 8,
                    }}>
                      <div style={{ fontSize: 11, color: 'var(--cf-text2)', lineHeight: 1.5, fontStyle: 'italic' }}>
                        «{ev.quote}»
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO }}>
                          {ev.published || '—'}
                        </span>
                        {ev.url && (
                          <a href={ev.url} target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                              fontSize: 9.5, color: 'var(--cf-accent)', fontFamily: MONO, textDecoration: 'none',
                            }}>
                            источник <ExternalLink size={9} />
                          </a>
                        )}
                        {ev.alive === false && (
                          <span style={{ fontSize: 9, color: 'var(--cf-muted)', fontFamily: MONO }}>ссылка мертва</span>
                        )}
                        {isFixture && (
                          <span title="Данные пока черновые — цитаты придут с первым прогоном движка" style={{
                            fontSize: 8.5, color: 'var(--cf-warn)', fontFamily: MONO, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
                          }}>черновик</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {hidden > 0 && (
        <button onClick={onShowAll} style={{
          display: 'block', width: 'calc(100% - 24px)', margin: '7px 12px 0',
          padding: '6px 0', background: 'var(--cf-surface2)',
          border: '1px solid var(--cf-border)', borderRadius: 6, cursor: 'pointer',
          color: 'var(--cf-text4)', fontSize: 10, fontFamily: MONO, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>
          Ещё {hidden}
        </button>
      )}
    </Section>
  );
}

// ── Small pieces ─────────────────────────────────────────────────────────
const rowBtn = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
  padding: '5px 16px', background: 'transparent', border: 'none',
  cursor: 'pointer', transition: 'background 120ms',
};

function Section({ title, icon, count, children }) {
  return (
    <div style={{ padding: '13px 0 3px', borderBottom: '1px solid var(--cf-border-hair)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px 9px',
        fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {icon}
        {title}
        {count != null && <span style={{ color: 'var(--cf-text8)' }}>· {count}</span>}
      </div>
      {children}
    </div>
  );
}

function Note({ children }) {
  return (
    <div style={{ padding: '9px 16px 3px', fontSize: 10.5, color: 'var(--cf-text6)', lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

function Chip({ children, color, title, dashed }) {
  return (
    <span title={title} style={{
      display: 'inline-block', padding: '3px 7px',
      background: color ? color + '14' : 'var(--cf-surface2)',
      border: `1px ${dashed ? 'dashed' : 'solid'} ${color ? color + '44' : 'var(--cf-border)'}`,
      borderRadius: 5,
      fontSize: 8.5, color: color || 'var(--cf-text3)', fontFamily: MONO, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      cursor: title ? 'help' : 'default', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function Meter({ value, color, width = 44 }) {
  return (
    <span style={{ width, height: 4, borderRadius: 2, background: 'var(--cf-surface2)', flexShrink: 0, overflow: 'hidden', display: 'inline-block' }}>
      <span style={{ display: 'block', height: '100%', width: `${Math.max(0, Math.min(100, value))}%`, background: color, borderRadius: 2 }} />
    </span>
  );
}

function LinkRow({ children, href, onClick, icon }) {
  const style = {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    padding: '7px 10px', background: 'var(--cf-surface2)',
    border: '1px solid var(--cf-border)', borderRadius: 7,
    color: 'var(--cf-text2)', fontSize: 11, cursor: 'pointer',
    textDecoration: 'none', textAlign: 'left', transition: 'all 120ms',
  };
  const inner = <>{icon}{children}<span style={{ flex: 1 }} /><ChevronRight size={12} color="var(--cf-text7)" /></>;
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={style}>{inner}</a>
    : <button onClick={onClick} style={style}>{inner}</button>;
}

/** This company's slice of its layer's total criticality. */
function shareOfLayer(node, layer, nodeById) {
  const total = (layer.members || []).reduce((s, id) => {
    const n = nodeById.get(id);
    return s + (n ? critIn(n, layer.id) : 0);
  }, 0);
  return total ? critIn(node, layer.id) / total : null;
}

/**
 * Why gravity and criticality disagree — the one thing that makes two scores
 * worth showing side by side instead of averaging them into one.
 */
function gravityRead(node) {
  const g = node.gravity?.score ?? 0;
  const c = node.criticality ?? 0;
  if (g - c >= 18) {
    return 'Гравитация выше критичности: компания задевает многое, но заменима. Её уход перекроил бы карту, а не остановил её.';
  }
  if (c - g >= 18) {
    return 'Критичность выше гравитации: узел узкий, но незаменимый. Связей мало — зато без них не работает всё, что выше.';
  }
  return 'Гравитация и критичность сошлись: сколько компания задевает, столько и держит.';
}
