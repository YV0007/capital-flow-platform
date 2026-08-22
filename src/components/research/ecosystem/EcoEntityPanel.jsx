// ══════════════════════════════════════════════════════════════════════════
// EcoEntityPanel — the breakdown for ONE entity on the ecosystem map.
//
// Same shell as v1 — same width, same sections, same chips, same rhythm — with
// a richer payload behind it. The order of blocks is the contract's:
//
//   1. Name, ticker, geo, phase, «данные устарели» when stale
//   2. oneLiner — big, because it is the answer to "what IS this"
//   3. КРИТИЧНОСТЬ — the score AND the four rubric inputs, each with its
//      weight and its ONE LINE of reasoning from `criticalityWhy`. Half the
//      value of the new rubric is that line: «незаменимость 95» without «ни
//      одна другая фабрика не делает 3 нм в объёме» says nothing at all.
//   4. whyIrreplaceable — 2-3 sentences. A new field, and it needs the room.
//   5. РИСК — level, note, export regime, jurisdictional concentration. New
//      block. The level carries colour from RISK_META but RESTRAINED: a border
//      and a dot, never a fill.
//   6. ГРАВИТАЦИЯ — reach, layers, edge types, cycles, score.
//   7. Relations up and down — the list is ALWAYS COMPLETE. The strength
//      slider is a canvas control, never a data control: a dependency you
//      cannot see because a slider sits at 20 is a dependency you forget.
//   8. Sources — tier in WORDS, publication, date, quote, «черновик» while the
//      payload is a fixture.
//
// ANYTHING THAT DID NOT ARRIVE IS NOT DRAWN — no label, no em dash, no empty
// row. An empty block reads as "we looked and found nothing", when what it
// actually means is "this field does not apply to this kind of entity". A
// jurisdiction has no ticker; a standards body has no revenue.
// ══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  X, ArrowDownLeft, ArrowUpRight, ExternalLink, Search, Globe, ChevronDown, ChevronRight,
  Layers, Quote, CircleDot, Users, AlertTriangle, ShieldAlert, Orbit, Lock,
} from 'lucide-react';
import {
  CRITICALITY_FACTORS, criticalityBand, substitutabilityRead, critIn,
} from '../../../data/aiEcosystemNetwork.js';
import Glossed from './Glossed.jsx';

const MONO = 'ui-monospace, monospace';
export const ECO_PANEL_W = 400;
// One horizontal gutter for the whole panel. Every row sits on it.
const PAD = 16;

export default function EcoEntityPanel({
  entity, up, down, entityById, layerById, isFixture, glossary,
  selectedEdgeId, onSelectEdge, onOpenEntity, onOpenLayer, onClose,
  topInset = 0,
}) {
  const [openEvidence, setOpenEvidence] = useState(null);   // edge id
  const [showAllUp, setShowAllUp] = useState(false);
  const [showAllDown, setShowAllDown] = useState(false);

  // React reuses this panel's DOM across entities, so the scroll position of
  // the previous one survives — you click a company and land halfway down its
  // page, with the name and the one-liner above the fold. Reset on identity,
  // and reset what was expanded with it.
  const bodyRef = useRef(null);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    setOpenEvidence(null);
    setShowAllUp(false);
    setShowAllDown(false);
  }, [entity?.id]);

  // Every piece of prose in this panel runs through <Glossed>: a term the map
  // already knows becomes a link to where that term lives — inside this map.
  const gloss = (text) => (
    <Glossed text={text} glossary={glossary} selfId={entity?.id} onOpenEntity={onOpenEntity} />
  );

  // Who else does the same job. The SECTOR is the comparison set, not the
  // layer: a layer holds several functions, while the sector is exactly what
  // the rubric's «незаменимость» factor is measured against.
  const rivals = useMemo(() => {
    if (!entity?.sector) return [];
    const out = [];
    entityById.forEach(n => {
      if (n.id === entity.id || n.sector !== entity.sector) return;
      out.push({ n, c: critIn(n, n.primaryLayer) || n.criticality || 0 });
    });
    return out.sort((a, b) => b.c - a.c);
  }, [entity, entityById]);

  if (!entity) return null;

  const cb = criticalityBand(entity.criticality);
  const primaryLayer = layerById.get(entity.primaryLayer);
  const conc = primaryLayer?.concentrationMeta || null;
  const ownScore = critIn(entity, entity.primaryLayer) || entity.criticality || 0;
  const rank = rivals.filter(r => r.c > ownScore).length + 1;
  const risk = entity.risk || null;
  const hasRisk = !!(risk && (risk.geopolitical || risk.note || risk.exportRegime || risk.concentration != null));
  const g = entity.gravity || null;

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
      {/* ── 1. Header ──────────────────────────────────────────────────── */}
      <div style={{ padding: '15px 16px 13px', borderBottom: '1px solid var(--cf-border-soft)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 3, background: entity.color,
            marginTop: 6, flexShrink: 0, boxShadow: `0 0 12px ${entity.color}80`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                {entity.name}
              </span>
              {entity.isAnchor && (
                <span title="Якорь экосистемы — вопрос, вокруг которого построена вся карта" style={{
                  fontSize: 8.5, color: 'var(--cf-accent)', fontFamily: MONO, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.09em', cursor: 'help',
                }}>якорь</span>
              )}
              {entity.isPivotal && !entity.isAnchor && (
                <span title="Пивотный узел сети — один из 26 равноправных центров, вокруг которых собрана вся карта" style={{
                  fontSize: 8.5, color: '#FDE047', fontFamily: MONO, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.09em', cursor: 'help',
                }}>пивот</span>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {entity.roleMeta?.label} · {entity.sectorLabel}
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
          <Chip title={entity.roleMeta?.blurb}>{entity.roleMeta?.short}</Chip>
          {entity.phaseMeta && (
            <Chip color={entity.phaseMeta.color} title={entity.phaseMeta.blurb}>{entity.phaseMeta.label}</Chip>
          )}
          {entity.publicMeta && <Chip title={entity.typeMeta?.label}>{entity.publicMeta.label}</Chip>}
          {entity.ticker && <Chip title="Биржевой тикер">{entity.ticker}</Chip>}
          {entity.geo && <Chip title="Юрисдикция штаб-квартиры">{entity.geo}</Chip>}
          {entity.onCycle && <Chip color="#E5484D" title="Стоит на замкнутом контуре — см. линзу «Круги»">В КРУГЕ</Chip>}
          {entity.faded && (
            <Chip dashed color="#E0A340" title={`Данные не подтверждались с ${entity.lastConfirmed || '—'}`}>
              Данные устарели · {entity.lastConfirmed || '—'}
            </Chip>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: '4px 0 40px' }}>

        {/* 2. What this is, in one line */}
        <ProfileBlock entity={entity} gloss={gloss} />

        {/* Relations first — this is the working surface. You come to an
            entity to see what it hangs off and what hangs off it, and only go
            down to the scoring if the answer is not obvious. */}
        <RelationList
          title="Вверх — от кого зависит"
          icon={<ArrowDownLeft size={11} />}
          empty="Ни одной входящей зависимости в карте."
          edges={up} entity={entity} entityById={entityById} side="source"
          showAll={showAllUp} onShowAll={() => setShowAllUp(true)}
          selectedEdgeId={selectedEdgeId} onSelectEdge={onSelectEdge}
          openEvidence={openEvidence} onToggleEvidence={(id) => setOpenEvidence(p => (p === id ? null : id))}
          onOpenEntity={onOpenEntity} glossary={glossary} isFixture={isFixture}
        />
        <RelationList
          title="Вниз — кто зависит"
          icon={<ArrowUpRight size={11} />}
          empty="Никто в карте не зависит от этой сущности напрямую."
          edges={down} entity={entity} entityById={entityById} side="target"
          showAll={showAllDown} onShowAll={() => setShowAllDown(true)}
          selectedEdgeId={selectedEdgeId} onSelectEdge={onSelectEdge}
          openEvidence={openEvidence} onToggleEvidence={(id) => setOpenEvidence(p => (p === id ? null : id))}
          onOpenEntity={onOpenEntity} glossary={glossary} isFixture={isFixture}
        />

        {/* 3. Criticality — the score AND the reasoning behind each input */}
        <Section title="Критичность" icon={<CircleDot size={11} />}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 12, padding: `0 ${PAD}px` }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: cb.color, lineHeight: 1, fontFamily: MONO }}>
              {entity.criticality}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--cf-text3)', fontWeight: 600 }}>{cb.label}</span>
            <span style={{ fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO }}>
              из 100 · насколько трудно заменить
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: `0 ${PAD}px` }}>
            {CRITICALITY_FACTORS.map(f => {
              const v = entity.criticalityFactors?.[f.key];
              if (v == null) return null;
              const why = entity.criticalityWhy?.[f.key];
              return (
                <div key={f.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span title={f.question} style={{ fontSize: 10.5, color: 'var(--cf-text3)', cursor: 'help', flexShrink: 0 }}>
                      {f.label}
                    </span>
                    <span title={`Вес этого фактора в итоговой оценке — ${Math.round(f.weight * 100)}%`} style={{
                      fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, cursor: 'help', flexShrink: 0,
                    }}>×{f.weight.toFixed(2)}</span>
                    <span style={{ flex: 1 }} />
                    <Meter value={v} color={cb.color} width={52} />
                    <span title={f.blurb} style={{
                      width: 24, fontSize: 11, fontFamily: MONO, fontWeight: 700,
                      color: 'var(--cf-text2)', textAlign: 'right', cursor: 'help', flexShrink: 0,
                    }}>{v}</span>
                  </div>
                  {/* The line that makes the digit an argument instead of a
                      verdict. Without it every factor is a bar nobody can
                      dispute, which is the opposite of useful. */}
                  {why && (
                    <div style={{ marginTop: 3, fontSize: 10.5, color: 'var(--cf-text5)', lineHeight: 1.5 }}>
                      {gloss(why)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* 4. Why it cannot be replaced */}
        {entity.whyIrreplaceable && (
          <Section title="Почему незаменима" icon={<Lock size={11} />}>
            <div style={{ padding: `0 ${PAD}px`, fontSize: 12, color: 'var(--cf-text2)', lineHeight: 1.6 }}>
              {gloss(entity.whyIrreplaceable)}
            </div>
          </Section>
        )}

        {/* 5. Risk — restrained colour: a border and a dot, never a fill */}
        {hasRisk && (
          <Section title="Риск" icon={<ShieldAlert size={11} />}>
            <div style={{ padding: `0 ${PAD}px` }}>
              {entity.riskMeta && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 9px', borderRadius: 6,
                    border: `1px solid ${entity.riskMeta.color}66`,
                    color: entity.riskMeta.color,
                    fontSize: 10, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.05em',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: entity.riskMeta.color }} />
                    {entity.riskMeta.label}
                  </span>
                  <span title={entity.riskMeta.blurb} style={{ fontSize: 10, color: 'var(--cf-text6)', cursor: 'help' }}>
                    геополитический
                  </span>
                </div>
              )}
              {risk.note && (
                <div style={{ fontSize: 11.5, color: 'var(--cf-text3)', lineHeight: 1.55, marginBottom: 8 }}>
                  {gloss(risk.note)}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {risk.exportRegime && (
                  <Chip color="#E5484D" title="Режим экспортного контроля, под который подпадает эта сущность">
                    {risk.exportRegime}
                  </Chip>
                )}
                {risk.concentration != null && (
                  <Chip title="Насколько позиция сосредоточена в одной юрисдикции, 0–100">
                    концентрация {risk.concentration}
                  </Chip>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* 6. What breaks it */}
        {entity.whatBreaksIt && (
          <Section title="Что сломает позицию" icon={<AlertTriangle size={11} />}>
            <div style={{ padding: `0 ${PAD}px`, fontSize: 12, color: 'var(--cf-text2)', lineHeight: 1.55 }}>
              {gloss(entity.whatBreaksIt)}
            </div>
          </Section>
        )}

        {/* 7. Gravity — structural weight, straight from the engine */}
        {g && (
          <Section title="Гравитация" icon={<Orbit size={11} />}
            caption="Насколько сущность вплетена в граф: со сколькими связана, сколько слоёв задевает, сколько разных механик власти на ней сходится.">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 10, padding: `0 ${PAD}px` }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--cf-text1)', lineHeight: 1, fontFamily: MONO }}>
                {g.score}
              </span>
              <span style={{ fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO }}>из 100</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: `0 ${PAD}px` }}>
              <StatRow label="Связана с" value={g.reach} unit="сущностями" />
              <StatRow label="Задевает" value={g.layers} unit="слоёв" />
              <StatRow label="Разных типов связи" value={g.edgeTypes} />
              {g.cycles > 0 && <StatRow label="Стоит на контурах" value={g.cycles} accent="#E5484D" />}
            </div>
            {/* Network centrality — the v3 addition. Engine-computed measures
                over the whole graph: how "crowded" the node is (degree), how
                much "passes through" it (betweenness), and — once the engine
                ships it — how much important things depend on it (pagerank).
                Sits in the gravity block because all answer the same family of
                question: how load-bearing is this node structurally. Each row
                renders only if its number arrived. */}
            {entity.centrality && (
              <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px solid var(--cf-border-hair)', display: 'flex', flexDirection: 'column', gap: 5, padding: `9px ${PAD}px 0` }}>
                <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                  Центральность в сети
                </div>
                {entity.centrality.degree != null && (
                  <StatRow label="Степень" value={entity.centrality.degree} unit="прямых связей"
                    hint="Со сколькими сущностями есть прямое ребро. Насколько узел «людный»." />
                )}
                {entity.centrality.betweenness != null && (
                  <StatRow label="Посредничество" value={entity.centrality.betweenness}
                    hint="Доля кратчайших путей между другими, проходящих через эту сущность. Насколько через неё «всё идёт»." />
                )}
                {/* PageRank — engine-computed, present only once the engine ships
                    it. Raw pagerank (≈1/N average) is meaningless to read, so it
                    is shown as a MULTIPLE of the network average — pagerank × N,
                    where N is the node count. 1.0× = average pull; higher means
                    important things depend on it. Multiplying by N is display
                    arithmetic, not metric computation — the number itself is the
                    engine's. */}
                {entity.centrality.pagerank != null && entityById.size > 0 && (
                  <StatRow label="Влияние"
                    value={`${(entity.centrality.pagerank * entityById.size).toFixed(1)}×`}
                    unit="среднего"
                    hint="PageRank: важность тем выше, чем больше на неё опираются ВАЖНЫЕ узлы — как ранг страницы у Google. Показано в разах от среднего влияния по сети (1× — среднее)." />
                )}
              </div>
            )}
          </Section>
        )}

        {/* 8. Where in the stack */}
        <Section title="Где стоит в стеке" icon={<Layers size={11} />}>
          <ColHeads left="Слой" right="Критичность в слое" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {entity.segments.map(s => {
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
                  <Meter value={s.criticality} color={entity.color} />
                  <span title={`Критичность в слое ${s.layer}: ${s.criticality} из 100`} style={{
                    width: 26, fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
                    color: 'var(--cf-text3)', textAlign: 'right',
                  }}>{s.criticality}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 9. Who else does this */}
        <Section title="Кто ещё в этом секторе" icon={<Users size={11} />} count={rivals.length || null}>
          <div style={{ padding: `0 ${PAD}px 2px`, fontSize: 12, color: 'var(--cf-text2)', lineHeight: 1.55 }}>
            {rivalRead(entity, rivals, rank)}
          </div>
          {rivals.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 9 }}>
              {[...rivals, { n: entity, c: ownScore }]
                .sort((a, b) => b.c - a.c)
                .map(({ n, c }) => {
                  const self = n.id === entity.id;
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
                      {n.geo && (
                        <span style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, flexShrink: 0 }}>{n.geo}</span>
                      )}
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

        {/* 10. Tech nodes owned */}
        {entity.tech?.length > 0 && (
          <Section title="Тех-узлы во владении">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: `0 ${PAD}px` }}>
              {entity.tech.map(t => (
                <span key={t.id} title={t.note} style={{
                  padding: '3px 8px', borderRadius: 5,
                  background: 'var(--cf-surface2)', border: '1px solid var(--cf-border)',
                  fontSize: 10, color: 'var(--cf-text2)', fontFamily: MONO, fontWeight: 700, cursor: 'help',
                }}>{t.label}</span>
              ))}
            </div>
          </Section>
        )}

        {/* 11. Sources for the entity itself */}
        {entity.sources?.length > 0 && (
          <SourceList sources={entity.sources} isFixture={isFixture} accent={entity.color} />
        )}

        {/* 12. Facts of record, only those that arrived */}
        <Section title="Дальше">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: `0 ${PAD}px 8px` }}>
            {entity.founded && <Chip title="Год основания">осн. {entity.founded}</Chip>}
            {entity.revenueUsdB != null && (
              <Chip title="Годовая выручка, млрд долларов">{entity.revenueUsdB} млрд $</Chip>
            )}
            {entity.typeMeta && <Chip title="Тип сущности в карте">{entity.typeMeta.label}</Chip>}
          </div>
          <div style={{ padding: `0 ${PAD}px`, fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO, lineHeight: 1.5 }}>
            Впервые в карте: {entity.firstSeen || '—'} · подтверждено: {entity.lastConfirmed || '—'}
          </div>
        </Section>
      </div>
    </aside>
  );
}

// ── Relation list — the full set, with sources per edge ──────────────────
function RelationList({
  title, icon, empty, edges, entity, entityById, side, showAll, onShowAll,
  selectedEdgeId, onSelectEdge, openEvidence, onToggleEvidence,
  onOpenEntity, glossary, isFixture,
}) {
  const TOP = 5;
  const list = showAll ? edges : edges.slice(0, TOP);
  const hidden = edges.length - list.length;
  // Who performs the verb flips with the direction of the list, and that was
  // the whole confusion: «ПРОИЗВОДИТ» next to TSMC on NVIDIA's panel could be
  // read either way round. Said once, in words, per row's tooltip.
  const up = side === 'source';

  return (
    <Section title={title} icon={icon} count={edges.length}>
      {!edges.length && <Note>{empty}</Note>}
      {!!edges.length && <ColHeads left="Контрагент" right="Связь · существенность" />}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {list.map(e => {
          const otherId = side === 'source' ? e.sourceId : e.targetId;
          const other = entityById.get(otherId);
          if (!other) return null;
          const open = openEvidence === e.id;
          const sub = substitutabilityRead(e.substitutability);
          return (
            <div key={e.id} style={{
              borderTop: '1px solid var(--cf-border-hair)',
              background: e.id === selectedEdgeId ? 'var(--cf-hover)' : 'transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px' }}>
                {/* The spine's colour is the first thing the eye gets: is this
                    a delivery, a cheque, a lock, a gate or a rival. */}
                <span title={e.spineMeta?.blurb} style={{
                  width: 3, alignSelf: 'stretch', borderRadius: 2, marginLeft: -6,
                  background: e.spineMeta?.color, flexShrink: 0, cursor: 'help',
                }} />
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
                <span title={sentence(e, entity, other, up)} style={{
                  fontSize: 8.5, fontFamily: MONO, fontWeight: 700, color: e.color,
                  textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'help', flexShrink: 0,
                }}>{e.verb || e.typeLabel}</span>
                <span title={`Существенность этой связи для получателя — ${e.strength} из 100`} style={{
                  width: 24, fontSize: 10, fontFamily: MONO, fontWeight: 700,
                  color: 'var(--cf-text4)', textAlign: 'right', cursor: 'help', flexShrink: 0,
                }}>{e.strength}</span>
                <button
                  onClick={() => { onSelectEdge?.(e.id); onToggleEvidence(e.id); }}
                  title="Разбор связи и цитаты"
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
                    <div style={{ fontSize: 11, color: 'var(--cf-text3)', lineHeight: 1.55, marginBottom: 8 }}>
                      <Glossed text={e.note} glossary={glossary} selfId={entity.id} onOpenEntity={onOpenEntity} />
                    </div>
                  )}
                  {/* The three numbers that describe HOW the dependency holds */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                    {e.lockInDepth != null && (
                      <StatRow label="Глубина замка" value={e.lockInDepth} unit="из 100" />
                    )}
                    {sub && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, fontSize: 10.5 }}>
                        <span style={{ color: 'var(--cf-text5)' }}>Замена</span>
                        <span style={{ flex: 1 }} />
                        <span style={{ color: sub.color, fontWeight: 600 }}>{sub.label}</span>
                        <span title="Обратная шкала: 0 — заменить нечем, 100 — меняется свободно" style={{
                          fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text7)', cursor: 'help',
                        }}>{e.substitutability} из 100</span>
                      </div>
                    )}
                    {e.isReversible === false && (
                      <div style={{ fontSize: 10.5, color: 'var(--cf-text5)' }}>
                        Связь не отыгрывается назад: один раз принятое решение переписывает всё, что построено поверх.
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                    <Chip color={e.spineMeta?.color} title={e.spineMeta?.blurb}>{e.spineMeta?.label}</Chip>
                    <Chip color={e.statusMeta?.color} title={e.statusMeta?.blurb}>
                      {e.confirmedSources} {plural(e.confirmedSources, ['источник', 'источника', 'источников'])} · {e.tierMeta?.short}
                    </Chip>
                    {e.riskMeta && e.risk?.level !== 'low' && (
                      <Chip color={e.riskMeta.color} title={riskSentence(e)}>
                        риск {e.riskMeta.label.toLowerCase()}
                      </Chip>
                    )}
                    {e.formed && <Chip title="Год возникновения связи">с {e.formed}</Chip>}
                    {e.strengthened && <Chip title="Год, когда связь резко углубилась">углубилась {e.strengthened}</Chip>}
                  </div>
                  {(e.evidence || []).map((ev, i) => (
                    <Evidence key={i} ev={ev} accent={e.color} isFixture={isFixture} />
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

/** Sources behind the ENTITY itself (edges carry their own, per relation). */
function SourceList({ sources, isFixture, accent }) {
  const [open, setOpen] = useState(false);
  return (
    <Section title="Источники" icon={<Quote size={11} />} count={sources.length}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: `calc(100% - ${PAD * 2}px)`,
          margin: `0 ${PAD}px`, padding: '5px 0', background: 'transparent', border: 'none',
          cursor: 'pointer', color: 'var(--cf-text5)', fontSize: 10, fontFamily: MONO, textAlign: 'left',
        }}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {open ? 'Свернуть' : 'Показать цитаты'}
      </button>
      {open && (
        <div style={{ padding: `4px ${PAD}px 0` }}>
          {sources.map((ev, i) => <Evidence key={i} ev={ev} accent={accent} isFixture={isFixture} />)}
        </div>
      )}
    </Section>
  );
}

/** One source: quote, tier IN WORDS, publication, date, link. */
function Evidence({ ev, accent, isFixture }) {
  return (
    <div style={{ borderLeft: `2px solid ${accent}66`, paddingLeft: 9, marginBottom: 9 }}>
      {ev.quote && (
        <div style={{ fontSize: 11, color: 'var(--cf-text2)', lineHeight: 1.5, fontStyle: 'italic' }}>
          «{ev.quote}»
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
        {ev.title && (
          <span style={{ fontSize: 9.5, color: 'var(--cf-text4)' }}>{ev.title}</span>
        )}
        {ev.published && (
          <span style={{ fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO }}>{ev.published}</span>
        )}
        {ev.url && (
          <a href={ev.url} target="_blank" rel="noopener noreferrer" title={ev.url}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 9.5, color: 'var(--cf-accent)', fontFamily: MONO, textDecoration: 'none',
            }}>
            источник <ExternalLink size={9} />
          </a>
        )}
        {ev.alive === false && (
          <span style={{ fontSize: 9, color: 'var(--cf-muted)', fontFamily: MONO }}>ссылка не отвечает</span>
        )}
        {isFixture && (
          <span title="Данные пока черновые — настоящие цитаты придут с первым прогоном движка" style={{
            fontSize: 8.5, color: 'var(--cf-warn)', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
          }}>черновик</span>
        )}
      </div>
    </div>
  );
}

// ── Profile: what this entity is ─────────────────────────────────────────
// The prose is the contract's `oneLiner` — the engine writes it, the dashboard
// never invents one. The website comes from the logo side-car's domain and
// simply does not appear when there is no entry; a search chip is always there
// as the honest fallback.
function ProfileBlock({ entity, gloss }) {
  const what = entity.oneLiner || null;
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
          {entity.role === 'state' ? 'Что это' : entity.role === 'capital' ? 'Кто это' : 'Чем занимается'}
        </div>
        <div style={{
          fontSize: 12.5, lineHeight: 1.55, fontWeight: 600,
          color: what ? 'var(--cf-text1)' : 'var(--cf-text6)',
          fontStyle: what ? 'normal' : 'italic',
        }}>
          {what ? gloss(what) : 'Описания в данных пока нет — найдите через поиск ниже.'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 }}>
          {entity.site && <LinkChip url={entity.site} icon={<Globe size={12} />} label="Сайт" external />}
          <LinkChip url={entity.searchUrl} icon={<Search size={12} />} label={`Искать «${entity.name}»`} />
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
function sentence(e, entity, other, up) {
  const v = e.verb || e.typeLabel || '';
  const blurb = e.typeMeta?.blurb ? ` — ${e.typeMeta.blurb}` : '';
  return up ? `${other.name} ${v} ${entity.name}${blurb}` : `${entity.name} ${v} ${other.name}${blurb}`;
}

/** The edge's risk, as one readable line for a tooltip. */
function riskSentence(e) {
  const bits = [e.riskMeta?.label];
  if (e.riskTypeLabel) bits.push(e.riskTypeLabel);
  if (e.riskTimelineLabel) bits.push(`горизонт: ${e.riskTimelineLabel}`);
  const head = bits.filter(Boolean).join(' · ');
  return e.risk?.mitigation ? `${head}. Чем крыть: ${e.risk.mitigation}` : head;
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

function StatRow({ label, value, unit, accent, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, fontSize: 10.5 }}>
      <span title={hint} style={{ color: 'var(--cf-text5)', cursor: hint ? 'help' : 'default' }}>{label}</span>
      <span style={{ flex: 1 }} />
      <span style={{ fontFamily: MONO, fontWeight: 700, color: accent || 'var(--cf-text2)' }}>{value}</span>
      {unit && <span style={{ fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO }}>{unit}</span>}
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
// link from the headline score.
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

/**
 * The one line above the rival list: where this entity stands, in words.
 * Everything in it is a fact from the file — a rank, a gap, a count — never a
 * derived percentage that looks like a market share but isn't one.
 */
function rivalRead(entity, rivals, rank) {
  const sector = entity.sectorLabel || entity.sector || 'своей функции';
  if (!rivals.length) {
    return `${entity.name} — единственная в карте в секторе «${sector}». Второго источника здесь просто нет.`;
  }
  const total = rivals.length + 1;
  const own = critIn(entity, entity.primaryLayer) || entity.criticality || 0;
  const leader = rivals[0];
  if (rank === 1) {
    const gap = own - leader.c;
    return gap > 0
      ? `Первая из ${total} в секторе «${sector}» — следующий (${leader.n.name}) отстаёт на ${gap} ${plural(gap, ['пункт', 'пункта', 'пунктов'])} критичности.`
      : `Делит первое место в секторе «${sector}» с ${leader.n.name} — оба на ${own}.`;
  }
  const gap = leader.c - own;
  return `${rank}-я из ${total} в секторе «${sector}»; лидер ${leader.n.name} впереди на ${gap} ${plural(gap, ['пункт', 'пункта', 'пунктов'])}.`;
}

function plural(n, [one, few, many]) {
  const a = Math.abs(Math.round(n));
  const d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}
