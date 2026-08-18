// ══════════════════════════════════════════════════════════════════════════
// EcoEntityPanel — the breakdown for ONE company on the ecosystem map.
//
// Sibling of capitalflow/EntityPanel, but it answers different questions and
// in this order, then stops:
//
//   1. What is it, in one line, and in which layers does it sit
//   2. How critical — WITH the four rubric inputs, not just the score. A "98"
//      with no visible reason is a number to distrust.
//   3. Up the stack: what it depends on          (top 5, then the rest)
//   4. Down the stack: what depends on it        (top 5, then the rest)
//   5. Its layer's concentration, and its share of it
//   6. Public/private, ticker, geography, what breaks the position
//   7. Every edge carries its SOURCE: tier, date, link, quote
//   8. A jump into the matching DC-AI block
//
// GRAVITY is pulled from the panel for now — the engine still ships the field
// and nothing downstream changed, it is simply not shown.
//
// The relation lists here are ALWAYS complete — the strength threshold is a
// canvas control, never a data control. A dependency you cannot see because a
// slider is at 20 is a dependency you will forget exists.
// ══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  X, ArrowDownLeft, ArrowUpRight, ExternalLink, Search, Globe, ChevronDown, ChevronRight,
  Layers, Quote, CircleDot, Users, AlertTriangle,
} from 'lucide-react';
import {
  CRITICALITY_FACTORS, CONCENTRATION_META, criticalityBand, critIn,
} from '../../../data/ecosystemMap.js';
import Glossed from './Glossed.jsx';

const MONO = 'ui-monospace, monospace';
export const ECO_PANEL_W = 400;
// One horizontal gutter for the whole panel. Every row sits on it — the big
// criticality number used to skip it and read as knocked out of
// alignment against the section titles above them.
const PAD = 16;

export default function EcoEntityPanel({
  node, up, down, nodeById, layerById, isFixture, glossary,
  selectedEdgeId, onSelectEdge, onOpenEntity, onOpenLayer, onOpenDcNode, onClose,
  topInset = 0,
}) {
  // Every piece of prose in this panel runs through <Glossed>: a term the map
  // already knows becomes a link to wherever that term is answered. Without
  // it, a line like «кастомные ASIC гиперскейлеров» names the threat and then
  // abandons the reader with it.
  const gloss = (text) => (
    <Glossed text={text} glossary={glossary} selfId={node.id}
      onOpenEntity={onOpenEntity} onOpenDcNode={onOpenDcNode} />
  );
  const [openEvidence, setOpenEvidence] = useState(null);   // edge id
  const [showAllUp, setShowAllUp] = useState(false);
  const [showAllDown, setShowAllDown] = useState(false);
  if (!node) return null;

  const cb = criticalityBand(node.criticality);
  const primaryLayer = layerById.get(node.primaryLayer);
  const conc = primaryLayer ? CONCENTRATION_META[primaryLayer.concentration?.level] : null;
  // Who else does the same job. The SECTOR is the comparison set, not the
  // layer: L3 «Чипы» holds both AI silicon and custom ASIC, which are not the
  // same function, while the sector is exactly what the rubric's `share`
  // factor is measured against.
  //
  // This replaced a "16% of the layer's total criticality" line that nobody
  // could act on — a ratio of two scores is not a market share, and the bare
  // HHI beside it had no scale to read against. The question a reader actually
  // has is "who else makes this, and how far ahead is this one" — so the panel
  // answers that, by name, and leaves HHI to the layer report where there is
  // room to explain it.
  const rivals = useMemo(() => {
    if (!node.sector) return [];
    const out = [];
    nodeById.forEach(n => {
      if (n.id === node.id || n.sector !== node.sector) return;
      out.push({ n, c: critIn(n, n.primaryLayer) || n.criticality || 0 });
    });
    return out.sort((a, b) => b.c - a.c);
  }, [node, nodeById]);
  const ownScore = critIn(node, node.primaryLayer) || node.criticality || 0;
  const rank = rivals.filter(r => r.c > ownScore).length + 1;

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

      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 40px' }}>

        {/* 0. What this company actually is — the flow map's profile card,
               same shell and same links, fed by the contract's one-liner. */}
        <ProfileBlock node={node} />

        {/* 1. Layers this company occupies */}
        <Section title="Где стоит в стеке" icon={<Layers size={11} />}
          caption="Справа — критичность компании В КАЖДОМ слое по отдельности: 0 — легко обойтись, 100 — слой без неё встаёт. Клик по строке открывает разбор слоя.">
          <ColHeads left="Слой" right="Критичность в слое" />
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
                  <span title={`Критичность в слое ${s.layer}: ${s.criticality} из 100`} style={{
                    width: 26, fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
                    color: 'var(--cf-text3)', textAlign: 'right',
                  }}>
                    {s.criticality}
                  </span>
                </button>
              );
            })}
          </div>
          {node.multiLayer && (
            <Note>В {node.segments.length} слоях, но на карте это один узел — со значком из полосок, а не несколько кружков.</Note>
          )}
        </Section>

        {/* 2. Criticality, with the rubric opened up */}
        <Section title="Критичность" icon={<CircleDot size={11} />}
          caption="Насколько тяжело заменить компанию в её работе: 0 — заменяется завтра, 100 — не заменяется. Складывается из четырёх ответов ниже.">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 12, padding: `0 ${PAD}px` }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: cb.color, lineHeight: 1, fontFamily: MONO }}>
              {node.criticality}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--cf-text3)', fontWeight: 600 }}>{cb.label}</span>
            <span style={{ fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO }}>из 100</span>
          </div>
          {/* One factor per block rather than per line: the question it answers
              is the whole point, and it does not fit next to a bar. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13, padding: `0 ${PAD}px` }}>
            {CRITICALITY_FACTORS.map(f => {
              const v = node.criticalityFactors?.[f.key];
              return (
                <div key={f.key}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ flex: 1, fontSize: 11.5, fontWeight: 600, color: 'var(--cf-text2)' }}>
                      {f.label}
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: cb.color, textAlign: 'right' }}>
                      {v == null ? '—' : (f.scale[v] || v)}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--cf-text6)', lineHeight: 1.45, marginTop: 2 }}>
                    {f.question}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                    <span style={{ flex: 1, display: 'flex' }}>
                      <Meter value={(v ?? 0) * 20} color={cb.color} width="100%" />
                    </span>
                    <span title={`Вес этого ответа в итоговой оценке — ${Math.round(f.weight * 100)}%`} style={{
                      fontSize: 9, fontFamily: MONO, color: 'var(--cf-text7)', cursor: 'help', flexShrink: 0,
                    }}>вес {Math.round(f.weight * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Note>Рубрика фиксирована — считает движок, дашборд только показывает.</Note>
        </Section>

        {/* 4 + 5. Up and down the stack */}
        <RelationList
          title="Вверх по стеку — от кого зависит"
          icon={<ArrowDownLeft size={11} />}
          empty="Ни одной входящей зависимости в карте."
          edges={up} node={node} nodeById={nodeById} side="source"
          showAll={showAllUp} onShowAll={() => setShowAllUp(true)}
          selectedEdgeId={selectedEdgeId} onSelectEdge={onSelectEdge}
          openEvidence={openEvidence} onToggleEvidence={(id) => setOpenEvidence(p => (p === id ? null : id))}
          onOpenEntity={onOpenEntity} onOpenDcNode={onOpenDcNode}
          glossary={glossary} isFixture={isFixture}
        />
        <RelationList
          title="Вниз по стеку — кто зависит"
          icon={<ArrowUpRight size={11} />}
          empty="Никто в карте не зависит от этой компании напрямую."
          edges={down} node={node} nodeById={nodeById} side="target"
          showAll={showAllDown} onShowAll={() => setShowAllDown(true)}
          selectedEdgeId={selectedEdgeId} onSelectEdge={onSelectEdge}
          openEvidence={openEvidence} onToggleEvidence={(id) => setOpenEvidence(p => (p === id ? null : id))}
          onOpenEntity={onOpenEntity} onOpenDcNode={onOpenDcNode}
          glossary={glossary} isFixture={isFixture}
        />

        {/* 6. Who else does this — the rank, then the actual names */}
        <Section title="Кто ещё в этой функции" icon={<Users size={11} />} count={rivals.length || null}>
          <div style={{ padding: `0 ${PAD}px 2px`, fontSize: 12, color: 'var(--cf-text2)', lineHeight: 1.55 }}>
            {rivalRead(node, rivals, rank)}
          </div>
          {rivals.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 9 }}>
              {[...rivals, { n: node, c: critIn(node, node.primaryLayer) || node.criticality }]
                .sort((a, b) => b.c - a.c)
                .map(({ n, c }) => {
                  const self = n.id === node.id;
                  return (
                    <button key={n.id} onClick={() => !self && onOpenEntity(n.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: `5px ${PAD}px`, border: 'none', textAlign: 'left',
                        background: self ? 'var(--cf-hover)' : 'transparent',
                        cursor: self ? 'default' : 'pointer', transition: 'background 120ms',
                      }}
                      onMouseEnter={(e) => { if (!self) e.currentTarget.style.background = 'var(--cf-hover)'; }}
                      onMouseLeave={(e) => { if (!self) e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ width: 6, height: 6, borderRadius: 2, background: n.color, flexShrink: 0 }} />
                      <span style={{
                        flex: 1, minWidth: 0, fontSize: 11.5,
                        color: self ? 'var(--cf-text0)' : 'var(--cf-text2)',
                        fontWeight: self ? 700 : 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{n.name}</span>
                      <span style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, flexShrink: 0 }}>
                        {n.geo}
                      </span>
                      <Meter value={c} color={n.color} width={40} />
                      <span style={{
                        width: 22, fontSize: 10, fontFamily: MONO, fontWeight: 700,
                        color: self ? 'var(--cf-text1)' : 'var(--cf-text4)', textAlign: 'right', flexShrink: 0,
                      }}>{c}</span>
                    </button>
                  );
                })}
            </div>
          )}
          {primaryLayer && conc && (
            <button onClick={() => onOpenLayer?.(primaryLayer.id)}
              style={{ ...rowBtn, padding: `9px ${PAD}px 3px` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <span style={{
                padding: '2px 7px', borderRadius: 4, background: conc.color + '1a',
                border: `1px solid ${conc.color}44`, color: conc.color,
                fontSize: 9, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.06em', flexShrink: 0,
              }}>{conc.label}</span>
              <span style={{ flex: 1, fontSize: 11, color: 'var(--cf-text4)', textAlign: 'left' }}>
                весь слой {primaryLayer.id} · {primaryLayer.label}
              </span>
              <ChevronRight size={12} color="var(--cf-text7)" />
            </button>
          )}
        </Section>

        {/* 7. What breaks it */}
        {node.whatBreaksIt && (
          <Section title="Что сломает позицию" icon={<AlertTriangle size={11} />}>
            <div style={{ padding: `0 ${PAD}px`, fontSize: 12, color: 'var(--cf-text2)', lineHeight: 1.55 }}>
              {gloss(node.whatBreaksIt)}
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
          {node.dcNode && onOpenDcNode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: `0 ${PAD}px` }}>
              <LinkRow onClick={() => onOpenDcNode(node.dcNode)} icon={<Layers size={12} />}>
                Технический разбор блока в DC-AI
              </LinkRow>
            </div>
          )}
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
  selectedEdgeId, onSelectEdge, openEvidence, onToggleEvidence,
  onOpenEntity, onOpenDcNode, glossary, isFixture,
}) {
  const TOP = 5;
  const list = showAll ? edges : edges.slice(0, TOP);
  const hidden = edges.length - list.length;

  // Who performs the verb flips with the direction of the list, and that was
  // the whole confusion: «ПОСТАВЛЯЕТ» next to TSMC on NVIDIA's panel could be
  // read either way round. Said once, in words, per list.
  const up = side === 'source';
  const caption = up
    ? `Глагол — что делает эта компания для ${node.name}. Цифра — насколько эта связь существенна для ${node.name}, 0–100.`
    : `Глагол — что делает ${node.name} для этой компании. Цифра — насколько эта связь существенна для неё, 0–100.`;

  return (
    <Section title={title} icon={icon} count={edges.length} caption={edges.length ? caption : undefined}>
      {!edges.length && <Note>{empty}</Note>}
      {!!edges.length && <ColHeads left="Компания" right="Связь · существенность" />}
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
                <span title={sentence(e, node, other, up)} style={{
                  fontSize: 8.5, fontFamily: MONO, fontWeight: 700, color: e.color,
                  textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'help', flexShrink: 0,
                }}>{e.typeMeta?.verb || e.typeLabel}</span>
                <span title={`Существенность этой связи для получателя — ${e.strength} из 100`} style={{
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
                    <div style={{ fontSize: 11, color: 'var(--cf-text3)', lineHeight: 1.5, marginBottom: 7 }}>
                      <Glossed text={e.note} glossary={glossary} selfId={node.id}
                        onOpenEntity={onOpenEntity} onOpenDcNode={onOpenDcNode} />
                    </div>
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

// ── Profile: what this company is, plus a way out to the source ──────────
// The same card the flow map opens its entity panel with, so the two panels
// read as one product. The prose is the contract's `oneLiner` — the engine
// writes it, the dashboard never invents one. The website comes from the logo
// side-car's domain (see ecosystemMap.js) and simply does not appear when
// there is no entry; a search chip is always there as the honest fallback.
function ProfileBlock({ node }) {
  const what = node.oneLiner || null;
  return (
    <div style={{ padding: `12px ${PAD}px 4px` }}>
      <div style={{
        padding: '11px 12px',
        background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 10,
      }}>
        <div style={{
          fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7,
        }}>
          {node.role === 'capital' ? 'Кто это' : 'Чем занимается'}
        </div>

        <div style={{
          fontSize: 12.5, lineHeight: 1.6,
          color: what ? 'var(--cf-text2)' : 'var(--cf-text6)',
          fontStyle: what ? 'normal' : 'italic',
        }}>
          {what || 'Описания в данных пока нет — найдите через поиск ниже.'}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 }}>
          {node.site && <LinkChip url={node.site} icon={<Globe size={12} />} label="Сайт" external />}
          <LinkChip url={node.searchUrl} icon={<Search size={12} />} label={`Искать «${node.name}»`} />
        </div>
      </div>
    </div>
  );
}

function LinkChip({ url, icon, label, external }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={url}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', background: 'var(--cf-surface2)',
        border: '1px solid var(--cf-border)', borderRadius: 7,
        color: 'var(--cf-text2)', fontSize: 10.5, fontFamily: MONO, fontWeight: 600,
        textDecoration: 'none', cursor: 'pointer', maxWidth: '100%',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cf-link-hover)'; e.currentTarget.style.color = 'var(--cf-text1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--cf-border)'; e.currentTarget.style.color = 'var(--cf-text2)'; }}>
      <span style={{ flexShrink: 0, opacity: 0.85, lineHeight: 0 }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {external && <ExternalLink size={10} style={{ flexShrink: 0, opacity: 0.5 }} />}
    </a>
  );
}

/** The relation as a plain sentence, in the direction it actually runs. */
function sentence(e, node, other, up) {
  const v = e.typeMeta?.verb || e.typeLabel || '';
  return up
    ? `${other.name} ${v} ${node.name}${e.typeMeta?.blurb ? ` — ${e.typeMeta.blurb}` : ''}`
    : `${node.name} ${v} ${other.name}${e.typeMeta?.blurb ? ` — ${e.typeMeta.blurb}` : ''}`;
}

/** Column labels over a list, so a bare 0-100 column is never unexplained. */
function ColHeads({ left, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: `0 ${PAD}px 5px`,
      fontSize: 8, color: 'var(--cf-text8)', fontFamily: MONO, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>
      <span style={{ flex: 1 }}>{left}</span>
      <span>{right}</span>
    </div>
  );
}

// ── Small pieces ─────────────────────────────────────────────────────────
const rowBtn = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
  padding: '5px 16px', background: 'transparent', border: 'none',
  cursor: 'pointer', transition: 'background 120ms',
};

// `caption` is where a section says what its numbers MEAN. Every block on this
// panel shows a 0-100 score of some kind, and a bare number with a bar next to
// it is unreadable — you cannot tell criticality-in-a-layer from strength-of-a-
// link from the headline score. One line under the title, always.
function Section({ title, icon, count, caption, children }) {
  return (
    <div style={{ padding: '13px 0 3px', borderBottom: '1px solid var(--cf-border-hair)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: `0 ${PAD}px ${caption ? 5 : 9}px`,
        fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {icon}
        {title}
        {count != null && <span style={{ color: 'var(--cf-text8)' }}>· {count}</span>}
      </div>
      {caption && (
        <div style={{ padding: `0 ${PAD}px 9px`, fontSize: 10.5, color: 'var(--cf-text6)', lineHeight: 1.5 }}>
          {caption}
        </div>
      )}
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
    <span style={{ width, minWidth: 0, height: 4, borderRadius: 2, background: 'var(--cf-surface2)', flexShrink: 0, overflow: 'hidden', display: 'inline-block' }}>
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

/**
 * The one line above the rival list: where this company stands, in words.
 * Everything in it is a fact from the file — a rank, a gap, a count — never a
 * derived percentage that looks like a market share but isn't one.
 */
function rivalRead(node, rivals, rank) {
  const sector = node.sectorLabel || node.sector || 'своей функции';
  if (!rivals.length) {
    return `${node.name} — единственная компания в карте в функции «${sector}». Второго источника здесь просто нет.`;
  }
  const total = rivals.length + 1;
  const own = critIn(node, node.primaryLayer) || node.criticality || 0;
  const leader = rivals[0];
  if (rank === 1) {
    const gap = own - leader.c;
    return gap > 0
      ? `Первый из ${total} в функции «${sector}» — следующий (${leader.n.name}) отстаёт на ${gap} ${plural(gap, ['пункт', 'пункта', 'пунктов'])} критичности.`
      : `Делит первое место в функции «${sector}» с ${leader.n.name} — оба на ${own}.`;
  }
  const gap = leader.c - own;
  return `${rank}-й из ${total} в функции «${sector}»; лидер ${leader.n.name} впереди на ${gap} ${plural(gap, ['пункт', 'пункта', 'пунктов'])}.`;
}

function plural(n, [one, few, many]) {
  const a = Math.abs(Math.round(n));
  const d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}

