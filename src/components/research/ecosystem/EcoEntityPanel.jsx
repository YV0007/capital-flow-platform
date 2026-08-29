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
//   6b. ИНТЕГРАЦИЯ (contract /4) — the engine's own computed measure of how
//      wired-in the node is, folded shut by default and standing BESIDE ВЕС
//      rather than above it. The two answer the same question and disagree
//      because they are normalized differently; see the block's own comment.
//   6c. ИСТОЧНИКИ (contract /4) — how many documents stand behind this
//      profile and how many of them the entity published ITSELF. The single
//      most load-bearing addition of the release: it separates an entity that
//      was researched from one that was merely mentioned, which the map could
//      not express at all until now.
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
  Layers, Quote, Gauge, Users, AlertTriangle, ShieldAlert, Lock, Waypoints,
} from 'lucide-react';
import {
  CRITICALITY_FACTORS, criticalityBand, criticalityBasisOf, substitutabilityRead, critIn,
  WEIGHT_FACTORS, weightBand, pointsOf,
  INTEGRATION_META, INTEGRATION_PARTS, SOURCING_META, MEMBERSHIP_CHECK_META, TIER_META,
} from '../../../data/aiEcosystemNetwork.js';
import Glossed from './Glossed.jsx';
import { useT, usePlural, getLang } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';
export const ECO_PANEL_W = 400;
// One horizontal gutter for the whole panel. Every row sits on it.
const PAD = 16;

export default function EcoEntityPanel({
  entity, up, down, entityById, layerById, isFixture, glossary,
  selectedEdgeId, onSelectEdge, onOpenEntity, onOpenLayer, onClose,
  topInset = 0,
}) {
  const t = useT();
  const pl = usePlural();
  const [openEvidence, setOpenEvidence] = useState(null);   // edge id
  const [openCrit, setOpenCrit] = useState(false);

  // React reuses this panel's DOM across entities, so the scroll position of
  // the previous one survives — you click a company and land halfway down its
  // page, with the name and the one-liner above the fold. Reset on identity,
  // and reset what was expanded with it.
  const bodyRef = useRef(null);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    setOpenEvidence(null);
    setOpenCrit(false);
  }, [entity?.id]);

  // Every piece of prose in this panel runs through <Glossed>: a term the map
  // already knows becomes a link to where that term lives — inside this map.
  const gloss = (text) => (
    <Glossed text={text} glossary={glossary} selfId={entity?.id} onOpenEntity={onOpenEntity} />
  );

  // Who else does the same job. The SECTOR is the comparison set, not the
  // layer: a layer holds several functions, while the sector is exactly what
  // the rubric's «незаменимость» factor is measured against.
  //
  // Same sector does not always mean "competes" — CUDA and NVIDIA both sit in
  // `gpu_platform`, but CUDA is NVIDIA's own product, not a second vendor.
  // The engine models it as its own entity (it needs its own criticality and
  // edges), so the exclusion has to happen here, on display, not upstream.
  // Detected from the payload itself — one entity's name sits as a whole word
  // inside the other's name/aliases ("NVIDIA CUDA" contains "NVIDIA") — so
  // this is not a hardcoded id pair and generalises to any future sub-brand.
  const rivals = useMemo(() => {
    if (!entity?.sector) return [];
    const out = [];
    entityById.forEach(n => {
      if (n.id === entity.id || n.sector !== entity.sector) return;
      if (sameFamily(entity, n)) return;
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

  // HOW MANY FACTORS THIS PARTICULAR CRITICALITY RESTS ON. 32 of the 108
  // entities have no `concentration` yet, so the engine renormalized the other
  // three weights for them. Two numbers in the same column computed on
  // different bases are not comparable, and the panel has to say so where the
  // number is, not in a footnote.
  const basis = criticalityBasisOf(entity);
  const partialBasis = basis.factorsUsed < CRITICALITY_FACTORS.length;

  // ── The one number. `gravity` and `centrality` still arrive in the payload
  // and are still read — by ecoWeight.js, as two of the four ingredients —
  // but nothing prints them raw any more. ─────────────────────────────────
  const w = entity.weight || null;
  const wb = weightBand(w?.score);

  // The line under each factor: the fact behind the multiple, in words. Every
  // number in it comes from the payload or from the metric's own working —
  // never a percentage that looks like a market share but isn't one.
  const factorRead = (key) => {
    if (!w) return null;
    if (key === 'influence') {
      if (!w.dependents) {
        return t('В карте на неё никто не опирается — вес держится на её собственной незаменимости.',
                 'Nothing on the map leans on it — its weight rests on its own irreplaceability.');
      }
      const names = w.topDependents.map(d => d.name).join(', ');
      const noun = pl(w.dependents, ['сущность', 'сущности', 'сущностей'], ['entity', 'entities']);
      return t(`На неё опираются ${w.dependents} ${noun} — тяжелее всего ${names}.`,
               `${w.dependents} ${noun} ${w.dependents === 1 ? 'leans' : 'lean'} on it — most heavily ${names}.`);
    }
    if (key === 'irreplaceability') {
      return partialBasis
        ? t(`Критичность ${entity.criticality} из 100 — посчитана по ${basis.factorsUsed} факторам из ${CRITICALITY_FACTORS.length}, веса перенормированы.`,
            `Criticality ${entity.criticality} out of 100 — computed on ${basis.factorsUsed} of the ${CRITICALITY_FACTORS.length} factors, with the weights renormalized.`)
        : t(`Критичность ${entity.criticality} из 100 по рубрике из ${CRITICALITY_FACTORS.length} факторов.`,
            `Criticality ${entity.criticality} out of 100 on the ${CRITICALITY_FACTORS.length}-factor rubric.`);
    }
    if (key === 'reach') {
      if (!w.layersTouched) return t('Зависимостей внутрь нет.', 'Nothing depends on it.');
      const noun = pl(w.layersTouched, ['слоя', 'слоёв', 'слоёв'], ['layer', 'layers']);
      return t(`Зависимость приходит из ${w.layersTouched} ${noun} стека, эффективно ${w.reachLayers.toFixed(1)}.`,
               `The dependence comes from ${w.layersTouched} ${noun} of the stack, effectively ${w.reachLayers.toFixed(1)}.`);
    }
    if (key === 'bridge') {
      if (!w.betweenness) {
        return t('Не единственная дорога: убрать — сеть не разорвётся.',
                 'Not the only road: removing it does not tear the network.');
      }
      return t(`Через неё проходит ${(w.betweenness * 100).toFixed(1)}% кратчайших путей карты.`,
               `${(w.betweenness * 100).toFixed(1)}% of the map's shortest paths run through it.`);
    }
    return null;
  };

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
              {/* «ЯДРО», not «якорь» and not «ключевой». The set is an OUTPUT
                  of the run — the top 30 by computed integration, recomputed
                  monthly — so the badge says «вычислено», not «назначено».
                  There is no anchor under contract /4 at all. */}
              {entity.isCore && (
                <span title={t('В ядре карты: верхние 30 по вычисленной интеграции. Состав пересчитывается каждый прогон, списка руками нет — узел может войти и выйти.',
                               'In the core of the map: the top 30 by computed integration. The set is recomputed every run and is not a hand-kept list — a node can enter it and leave it.')} style={{
                  fontSize: 8.5, color: '#FDE047', fontFamily: MONO, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.09em', cursor: 'help',
                }}>{t('ядро', 'core')}</span>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {entity.sectorLabel} · {entity.primaryLayerLabel || entity.primaryLayer}
            </div>
          </div>
          <button onClick={onClose} title={t('Закрыть панель', 'Close the panel')}
            style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 3, lineHeight: 0, flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {entity.publicMeta && <Chip title={entity.typeMeta?.label}>{entity.publicMeta.label}</Chip>}
          {entity.ticker && <Chip title={t('Биржевой тикер', 'Stock ticker')}>{entity.ticker}</Chip>}
          {entity.geo && <Chip title={t('Юрисдикция штаб-квартиры', 'Headquarters jurisdiction')}>{entity.geo}</Chip>}
          {entity.faded && (
            <Chip dashed color="#E0A340" title={t(`Данные не подтверждались с ${entity.lastConfirmed || '—'}`, `Not re-confirmed since ${entity.lastConfirmed || '—'}`)}>
              {t('Данные устарели', 'Data is stale')} · {entity.lastConfirmed || '—'}
            </Chip>
          )}
          {/* TWO STATES OF THE MAP'S OWN BORDER, spelled out rather than
              implied. Both are conditions of the RECORD, not of the company,
              so they sit with the chips and not in the profile. */}
          {entity.pendingDossier && (
            <Chip dashed color="var(--cf-warn)"
              title={t('Ротация исследования до этого узла ещё не дошла. Он показан и связи у него настоящие, но собственное досье не собрано: описание опирается на чужие документы, а доля функции не оценена.',
                       'The research rotation has not reached this node yet. It is shown and its links are real, but its own dossier has not been assembled: the description rests on other parties\' documents and the share of the function is unscored.')}>
              {t('Досье не собрано', 'No dossier yet')}
            </Chip>
          )}
          {!!(entity.membershipFailing || []).length && (
            <Chip dashed
              title={t(`Удержан связью. Проверку членства не проходит (${entity.membershipFailing.map(k => MEMBERSHIP_CHECK_META[k]?.label || k).join(', ')}), но назван в чужом подтверждённом досье, поэтому оставлен на карте помеченным, а не выброшен.`,
                       `Held by a link. It fails a membership check (${entity.membershipFailing.map(k => MEMBERSHIP_CHECK_META[k]?.label || k).join(', ')}) but is named in somebody else's confirmed dossier, so it stays on the map, marked rather than discarded.`)}>
              {t('Удержан связью', 'Held by a link')}
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
          title={t('Вверх — от кого зависит', 'Upstream — what it depends on')}
          icon={<ArrowDownLeft size={11} />}
          empty={t('Ни одной входящей зависимости в карте.', 'No inbound dependency in the map.')}
          edges={up} entity={entity} entityById={entityById} side="source"
          selectedEdgeId={selectedEdgeId} onSelectEdge={onSelectEdge}
          openEvidence={openEvidence} onToggleEvidence={(id) => setOpenEvidence(p => (p === id ? null : id))}
          onOpenEntity={onOpenEntity} glossary={glossary} isFixture={isFixture}
        />
        <RelationList
          title={t('Вниз — кто зависит', 'Downstream — what depends on it')}
          icon={<ArrowUpRight size={11} />}
          empty={t('Никто в карте не зависит от этой сущности напрямую.', 'Nothing in the map depends on this entity directly.')}
          edges={down} entity={entity} entityById={entityById} side="target"
          selectedEdgeId={selectedEdgeId} onSelectEdge={onSelectEdge}
          openEvidence={openEvidence} onToggleEvidence={(id) => setOpenEvidence(p => (p === id ? null : id))}
          onOpenEntity={onOpenEntity} glossary={glossary} isFixture={isFixture}
        />

        {/* 3. ВЕС В СИСТЕМЕ — the one number.
            It replaces the three this panel used to print. Criticality,
            gravity and centrality did not disappear: they are the ingredients
            of this score, and each is a row below it with its own exponent
            and its own line of plain language. The criticality rubric keeps
            its four factors and its `criticalityWhy` prose — the best writing
            on the panel — but folds UNDER the «незаменимость» row it belongs
            to, so exactly one number here is a headline. See ecoWeight.js. */}
        {w && (
          <Section title={t('Вес в системе', 'Systemic weight')} icon={<Gauge size={11} />}
            caption={t('Сколько отрасли стоит на этой сущности. Считается по графу зависимостей: важна та, на кого опираются важные.',
                       'How much of the industry rests on this entity. Computed over the dependency graph: you are important if important things lean on you.')}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 12, padding: `0 ${PAD}px` }}>
              <span title={t('50 — среднее по сети. Каждое удвоение веса — плюс 17 пунктов.',
                             '50 is the network average. Every doubling of weight is another 17 points.')} style={{
                fontSize: 30, fontWeight: 700, color: wb.color, lineHeight: 1, fontFamily: MONO, cursor: 'help',
              }}>{w.score}</span>
              <span style={{ flex: 1 }} />
              <span title={t(`${w.rank}-е место по весу среди ${w.of} сущностей карты`,
                             `Ranked ${w.rank} by weight among the ${w.of} entities on the map`)} style={{
                fontSize: 11, color: 'var(--cf-text3)', fontFamily: MONO, fontWeight: 700, cursor: 'help',
              }}>#{w.rank}</span>
              <span style={{ fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO }}>
                {t(`из ${w.of}`, `of ${w.of}`)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: `0 ${PAD}px` }}>
              {WEIGHT_FACTORS.map(f => {
                const m = w[f.key];
                if (m == null) return null;
                // Every factor is a MULTIPLE of the network average, which is
                // unreadable on its own — so the bar behind it is that multiple
                // put on the same 0-100 scale as the headline, and the number
                // stays «×среднего» where it can be argued with.
                return (
                  <div key={f.key}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span title={f.question} style={{ fontSize: 10.5, color: 'var(--cf-text3)', cursor: 'help', flexShrink: 0 }}>
                        {f.label}
                      </span>
                      <span title={t(`Вес этого фактора в итоговой оценке — ${Math.round(f.weight * 100)}%`,
                                     `This factor's weight in the final score — ${Math.round(f.weight * 100)}%`)} style={{
                        fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, cursor: 'help', flexShrink: 0,
                      }}>×{f.weight.toFixed(2)}</span>
                      <span style={{ flex: 1 }} />
                      <Meter value={pointsOf(m)} color={wb.color} width={52} />
                      <span title={f.blurb} style={{
                        width: 34, fontSize: 11, fontFamily: MONO, fontWeight: 700,
                        color: 'var(--cf-text2)', textAlign: 'right', cursor: 'help', flexShrink: 0,
                      }}>{m.toFixed(1)}×</span>
                    </div>
                    <div style={{ marginTop: 3, fontSize: 10.5, color: 'var(--cf-text5)', lineHeight: 1.5 }}>
                      {factorRead(f.key)}
                    </div>
                    {/* The rubric, folded under the factor it IS. Same four
                        rows and the same one-line arguments as before — they
                        just no longer compete with the headline for the eye. */}
                    {f.key === 'irreplaceability' && (
                      <>
                        <button onClick={() => setOpenCrit(v => !v)} style={{
                          marginTop: 4, display: 'flex', alignItems: 'center', gap: 4,
                          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                          fontSize: 9.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>
                          {openCrit ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                          {t('разбор критичности', 'criticality breakdown')}
                        </button>
                        {openCrit && (
                          <div style={{
                            marginTop: 7, paddingLeft: 9, display: 'flex', flexDirection: 'column', gap: 9,
                            borderLeft: '1px solid var(--cf-border-hair)',
                          }}>
                            {/* The caveat sits ABOVE the rows it applies to.
                                A three-factor score and a four-factor score
                                look identical in the column and are not
                                comparable; saying so once here is cheaper than
                                a reader silently comparing them. */}
                            {partialBasis && (
                              <div style={{
                                fontSize: 10, color: 'var(--cf-warn)', lineHeight: 1.5,
                              }}>
                                {t(`Считано по ${basis.factorsUsed} факторам из ${CRITICALITY_FACTORS.length}: веса перенормированы, недостающий фактор ожидает досье. С четырёхфакторной оценкой это число сравнивать нельзя.`,
                                   `Computed on ${basis.factorsUsed} of the ${CRITICALITY_FACTORS.length} factors: the weights were renormalized and the missing factor is waiting for a dossier. This number is not comparable with a four-factor score.`)}
                              </div>
                            )}
                            {CRITICALITY_FACTORS.map(cf => {
                              const v = entity.criticalityFactors?.[cf.key];
                              const why = entity.criticalityWhy?.[cf.key];
                              return (
                                <div key={cf.key}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span title={cf.question} style={{
                                      fontSize: 10, cursor: 'help', flexShrink: 0,
                                      color: v == null ? 'var(--cf-text7)' : 'var(--cf-text4)',
                                    }}>
                                      {cf.label}
                                    </span>
                                    <span style={{ fontSize: 8.5, color: 'var(--cf-text8)', fontFamily: MONO, fontWeight: 700, flexShrink: 0 }}>
                                      ×{cf.weight.toFixed(2)}
                                    </span>
                                    <span style={{ flex: 1 }} />
                                    {v != null && <Meter value={v} color={cb.color} width={40} />}
                                    <span title={v == null ? undefined : cf.blurb} style={{
                                      width: 22, fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
                                      color: v == null ? 'var(--cf-text8)' : 'var(--cf-text3)',
                                      textAlign: 'right', cursor: v == null ? 'default' : 'help', flexShrink: 0,
                                    }}>{v == null ? '—' : v}</span>
                                  </div>
                                  {/* An unscored factor explains ITSELF rather
                                      than leaving a dash the reader has to
                                      interpret as a zero. */}
                                  {v == null ? (
                                    <div style={{ marginTop: 2, fontSize: 10, color: 'var(--cf-text7)', lineHeight: 1.5, fontStyle: 'italic' }}>
                                      {cf.pending || t('Не оценена — фактор ожидает досье.', 'Not scored — the factor is waiting for a dossier.')}
                                    </div>
                                  ) : why && (
                                    <div style={{ marginTop: 2, fontSize: 10, color: 'var(--cf-text6)', lineHeight: 1.5 }}>
                                      {gloss(why)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* 3b. ИНТЕГРАЦИЯ — the engine's own reading of the same question.
            Deliberately BESIDE the weight and never above it. Both numbers
            answer «насколько узел вшит в сеть»; they are computed from the
            same graph and they disagree, because they are normalized
            differently. ВЕС is anchored to the network MEAN on a log₂ scale —
            50 is average, every doubling is +16.6 — so it spreads across the
            range where the entities actually sit. `integration` is normalized
            to the network MAXIMUM, and on this delivery that maximum is NVIDIA
            at 100 with the second place at 31, which flattens 106 of the 108
            nodes into the bottom third. That makes it a poor rank and a good
            SET OF INGREDIENTS: degree, betweenness, PageRank, layer span, link
            variety and cycle count were already printed here one by one, and
            now they arrive as one block with the engine's own weights on them.
            See ecoWeight.js for the recommendation to fold the two into one. */}
        {entity.integration && <IntegrationBlock integration={entity.integration} />}

        {/* 4. Why it cannot be replaced */}
        {entity.whyIrreplaceable && (
          <Section title={t('Почему незаменима', 'Why it cannot be replaced')} icon={<Lock size={11} />}>
            <div style={{ padding: `0 ${PAD}px`, fontSize: 12, color: 'var(--cf-text2)', lineHeight: 1.6 }}>
              {gloss(entity.whyIrreplaceable)}
            </div>
          </Section>
        )}

        {/* 5. Risk — restrained colour: a border and a dot, never a fill */}
        {hasRisk && (
          <Section title={t('Риск', 'Risk')} icon={<ShieldAlert size={11} />}>
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
                    {t('геополитический', 'geopolitical')}
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
                  <Chip color="#E5484D" title={t('Режим экспортного контроля, под который подпадает эта сущность', 'The export-control regime this entity falls under')}>
                    {risk.exportRegime}
                  </Chip>
                )}
                {risk.concentration != null && (
                  <Chip title={t('Насколько позиция сосредоточена в одной юрисдикции, 0–100', 'How concentrated the position is in one jurisdiction, 0–100')}>
                    {t('концентрация', 'concentration')} {risk.concentration}
                  </Chip>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* 6. What breaks it */}
        {entity.whatBreaksIt && (
          <Section title={t('Что сломает позицию', 'What breaks the position')} icon={<AlertTriangle size={11} />}>
            <div style={{ padding: `0 ${PAD}px`, fontSize: 12, color: 'var(--cf-text2)', lineHeight: 1.55 }}>
              {gloss(entity.whatBreaksIt)}
            </div>
          </Section>
        )}

        {/* 8. Where in the stack */}
        <Section title={t('Где стоит в стеке', 'Where it sits in the stack')} icon={<Layers size={11} />}>
          <ColHeads left={t('Слой', 'Layer')} right={t('Критичность в слое', 'Criticality in the layer')} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {entity.segments.map(s => {
              const l = layerById.get(s.layer);
              return (
                <button key={s.layer} onClick={() => onOpenLayer?.(s.layer)}
                  style={rowBtn}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{
                    flex: 1, fontSize: 11.5, textAlign: 'left',
                    color: s.primary ? 'var(--cf-accent)' : 'var(--cf-text2)',
                    fontWeight: s.primary ? 600 : 400,
                  }}>
                    {l?.label || s.layer}
                    {s.primary && <span style={{ color: 'var(--cf-text7)', fontSize: 9, fontFamily: MONO, fontWeight: 400 }}> · {t('основной', 'primary')}</span>}
                  </span>
                  <Meter value={s.criticality} color={entity.color} />
                  <span title={t(`Критичность в слое «${l?.label || s.layer}»: ${s.criticality} из 100`, `Criticality in the ${l?.label || s.layer} layer: ${s.criticality} out of 100`)} style={{
                    width: 26, fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
                    color: 'var(--cf-text3)', textAlign: 'right',
                  }}>{s.criticality}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 9. Who else does this */}
        <Section title={t('Кто ещё в этом секторе', 'Who else is in this sector')} icon={<Users size={11} />} count={rivals.length || null}>
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
{t('весь слой', 'the whole')} «{primaryLayer.label}»{t('', ' layer')}
              </span>
              <ChevronRight size={12} color="var(--cf-text7)" />
            </button>
          )}
        </Section>

        {/* 10. Tech nodes owned */}
        {entity.tech?.length > 0 && (
          <Section title={t('Тех-узлы во владении', 'Tech nodes owned')}>
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

        {/* 11. Sources for the entity itself, and — new in /4 — the honest
            accounting of them: how many there are, how many the entity
            published ITSELF, and how they break down by tier. */}
        {(entity.sources?.length > 0 || entity.sourcing) && (
          <SourceList sources={entity.sources || []} sourcing={entity.sourcing}
            pendingDossier={!!entity.pendingDossier} isFixture={isFixture} accent={entity.color} />
        )}

        {/* 12. Facts of record, only those that arrived */}
        <Section title={t('Дальше', 'Further')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: `0 ${PAD}px 8px` }}>
            {entity.founded && <Chip title={t('Год основания', 'Year founded')}>осн. {entity.founded}</Chip>}
            {entity.revenueUsdB != null && (
              <Chip title={t('Годовая выручка, млрд долларов', 'Annual revenue, USD billions')}>{entity.revenueUsdB} млрд $</Chip>
            )}
            {entity.typeMeta && <Chip title={t('Тип сущности в карте', 'The entity\'s type in the map')}>{entity.typeMeta.label}</Chip>}
          </div>
          <div style={{ padding: `0 ${PAD}px`, fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO, lineHeight: 1.5 }}>
            {t('Впервые в карте', 'First seen in the map')}: {entity.firstSeen || '—'} · {t('подтверждено', 'confirmed')}: {entity.lastConfirmed || '—'}
          </div>
        </Section>
      </div>
    </aside>
  );
}

// ── Relation list — the full set, with sources per edge ──────────────────
function RelationList({
  title, icon, empty, edges, entity, entityById, side,
  selectedEdgeId, onSelectEdge, openEvidence, onToggleEvidence,
  onOpenEntity, glossary, isFixture,
}) {
  const t = useT();
  // Who performs the verb flips with the direction of the list, and that was
  // the whole confusion: «ПРОИЗВОДИТ» next to TSMC on NVIDIA's panel could be
  // read either way round. Said once, in words, per row's tooltip.
  const up = side === 'source';

  // ── Grouped by RELATION KIND ────────────────────────────────────────────
  // A hub like NVIDIA has a dozen incoming relations and four of them are the
  // same verb. Flat and sorted by strength, those four land at ranks 1, 4, 7
  // and 11 with unrelated kinds in between, and the panel reads as a list of
  // unrelated facts. Grouping puts every «покупает здесь» together, so the
  // question the reader actually has — "who supplies it, and who owns it" —
  // is answered by the shape of the list.
  //
  // The per-group cap replaces the old global top-5: cutting a flat list at
  // five hid whole KINDS of relation, which is exactly the information the
  // grouping exists to show.
  const PER_GROUP = 4;
  const groups = useMemo(() => {
    const by = new Map();
    edges.forEach(e => {
      const key = e.type || 'other';
      const g = by.get(key);
      if (g) g.rows.push(e);
      else by.set(key, {
        key,
        label: (up ? e.typeMeta?.up : e.typeMeta?.down) || e.verb || e.typeLabel || key,
        color: e.color,
        spine: e.spineMeta,
        rows: [e],
      });
    });
    // Heaviest kind first — by summed strength, not by count, so one decisive
    // dependency outranks three marginal ones.
    return [...by.values()]
      .map(g => ({ ...g, weight: g.rows.reduce((s, e) => s + (e.strength || 0), 0) }))
      .sort((a, b) => b.weight - a.weight);
  }, [edges, up]);
  // One kind only? Then the group header would just restate the section title.
  const showHeaders = groups.length > 1;

  // Every KIND folds on its own, and the panel does not open fully unfolded:
  // only the heaviest kind is open, the rest are one click away. Eighty-one
  // relations printed at once is a wall — the same eighty-one behind six named
  // counters is a table of contents, and the reader picks the row they came
  // for. The section header still says how many there are in total, so folding
  // hides the rows, never the fact.
  //
  // State is derived per entity rather than reset in an effect: React reuses
  // this panel's DOM across entities, so a Set left alone would carry NVIDIA's
  // open groups into Foxconn's panel.
  const [gs, setGs] = useState({ id: null, open: new Set(), all: new Set() });
  const st = gs.id === entity.id ? gs
    : { id: entity.id, open: new Set(groups.length ? [groups[0].key] : []), all: new Set() };
  const isOpen = (key) => !showHeaders || st.open.has(key);
  const toggleGroup = (key) => setGs(() => {
    const open = new Set(st.open);
    if (open.has(key)) open.delete(key); else open.add(key);
    return { id: entity.id, open, all: st.all };
  });
  const showAllIn = (key) => setGs(() => ({
    id: entity.id, open: new Set(st.open).add(key), all: new Set(st.all).add(key),
  }));

  const renderRow = (e) => {
    const otherId = side === 'source' ? e.sourceId : e.targetId;
    const other = entityById.get(otherId);
    if (!other) return null;
    const open = openEvidence === e.id;
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
                  {/* A core node among the counterparties is the answer to
                      "which of these actually matters" — the same mark the
                      header puts on the entity itself, so «ядро» means one
                      thing everywhere on the map. */}
                  {other.isCore && (
                    <span title={t('В ядре карты — верхние 30 по вычисленной интеграции, состав пересчитывается каждый прогон',
                                   'In the core of the map — the top 30 by computed integration, recomputed every run')}
                      style={{
                        fontSize: 8, color: '#FDE047', fontFamily: MONO, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                        flexShrink: 0, cursor: 'help',
                      }}>{t('ядро', 'core')}</span>
                  )}
                  {/* And an UNSTUDIED counterparty must not read like a
                      studied one, exactly as in the table. */}
                  {other.pendingDossier && (
                    <span title={t('До этого узла ещё не дошла очередь исследования — связь настоящая, но собственного досье у него нет.',
                                   'The research rotation has not reached this node — the link is real, but it has no dossier of its own.')}
                      style={{
                        fontSize: 8, color: 'var(--cf-text8)', fontFamily: MONO, fontWeight: 700,
                        flexShrink: 0, cursor: 'help',
                      }}>{t('не изучен', 'unstudied')}</span>
                  )}
                  <span style={{
                    fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700,
                    flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {other.primaryLayerLabel || other.primaryLayer}
                  </span>
                </button>
                <span title={sentence(e, entity, other, up)} style={{
                  fontSize: 8.5, fontFamily: MONO, fontWeight: 700, color: e.color,
                  textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'help', flexShrink: 0,
                }}>{(up ? e.typeMeta?.up : e.typeMeta?.down) || e.verb || e.typeLabel}</span>
                <span title={t(`Существенность этой связи для получателя — ${e.strength} из 100`, `This link's materiality to the recipient — ${e.strength} out of 100`)} style={{
                  width: 24, fontSize: 10, fontFamily: MONO, fontWeight: 700,
                  color: 'var(--cf-text4)', textAlign: 'right', cursor: 'help', flexShrink: 0,
                }}>{e.strength}</span>
                <button
                  onClick={() => { onSelectEdge?.(e.id); onToggleEvidence(e.id); }}
                  title={t('Разбор связи и цитаты', 'The link breakdown and its quotes')}
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
                  {/* Same edit as the edge card, for the same reason: lock-in
                      depth and substitutability are two more 0-100 scores
                      stacked on the materiality already shown in the row above,
                      and the chip row is taxonomy about the RECORD (spine,
                      tier, status, dates) rather than a fact about the
                      relationship. What belongs here is how the cooperation
                      actually works — `detail`, once the engine ships it. */}
                  {e.detail && (
                    <div style={{ fontSize: 11, color: 'var(--cf-text2)', lineHeight: 1.55, marginBottom: 8 }}>
                      <Glossed text={e.detail} glossary={glossary} selfId={entity.id} onOpenEntity={onOpenEntity} />
                    </div>
                  )}
                  {e.isReversible === false && (
                    <div style={{ fontSize: 10.5, color: 'var(--cf-text5)', marginBottom: 8 }}>
                      {t('Связь не отыгрывается назад: один раз принятое решение переписывает всё, что построено поверх.', 'The link does not unwind: once the decision is taken it rewrites everything built on top of it.')}
                    </div>
                  )}
                  {(e.evidence || []).map((ev, i) => (
                    <Evidence key={i} ev={ev} accent={e.color} isFixture={isFixture} />
                  ))}
                </div>
              )}
            </div>
    );
  };

  return (
    <Section title={title} icon={icon} count={edges.length} collapsible>
      {!edges.length && <Note>{empty}</Note>}
      {!!edges.length && !showHeaders && <ColHeads left={t('Контрагент', 'Counterparty')} right={t('Связь · существенность', 'Link · materiality')} />}
      {groups.map(g => {
        const open = isOpen(g.key);
        const rows = !open ? [] : st.all.has(g.key) ? g.rows : g.rows.slice(0, PER_GROUP);
        const hidden = g.rows.length - rows.length;
        return (
          <div key={g.key}>
            {showHeaders && (
              <button
                onClick={() => toggleGroup(g.key)}
                title={open
                  ? t(`Свернуть «${g.label.toLowerCase()}»`, `Collapse "${g.label.toLowerCase()}"`)
                  : t(`Развернуть «${g.label.toLowerCase()}» — ${g.rows.length}`, `Expand "${g.label.toLowerCase()}" — ${g.rows.length}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, width: '100%',
                  padding: '9px 16px 4px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                <span style={{
                  width: 3, height: 11, borderRadius: 2, marginLeft: -6,
                  background: g.spine?.color, flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 9, fontFamily: MONO, fontWeight: 700, color: g.color,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>{g.label}</span>
                <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cf-text8)' }}>
                  {g.rows.length}
                </span>
                <div style={{ flex: 1 }} />
                {open && (
                  <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--cf-text8)' }}>
                    {t('СУЩЕСТВ.', 'MATERIAL.')}
                  </span>
                )}
                <span style={{ color: 'var(--cf-text8)', lineHeight: 0, flexShrink: 0 }}>
                  {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </span>
              </button>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {rows.map(renderRow)}
            </div>
            {open && hidden > 0 && (
              <button
                onClick={() => showAllIn(g.key)}
                style={{
                  display: 'block', width: 'calc(100% - 24px)', margin: '6px 12px 0',
                  padding: '5px 0', background: 'var(--cf-surface2)',
                  border: '1px solid var(--cf-border)', borderRadius: 6, cursor: 'pointer',
                  color: 'var(--cf-text4)', fontSize: 9.5, fontFamily: MONO, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>
                {t('Ещё', 'Another')} {hidden} · {g.label.toLowerCase()}
              </button>
            )}
          </div>
        );
      })}
    </Section>
  );
}

/**
 * The engine's `integration` block: one score and the six things it is made
 * of. Nothing here is recomputed — the dashboard has no latitude over graph
 * measures, the same rule that governs criticality, cycles and SPOF.
 */
function IntegrationBlock({ integration }) {
  const t = useT();
  const score = typeof integration.score === 'number' ? integration.score : null;
  return (
    <Section title={t('Интеграция по расчёту движка', "The engine's integration measure")} icon={<Waypoints size={11} />}
      collapsible defaultOpen={false}
      caption={t('Второе показание того же вопроса, что и ВЕС, и посчитано оно иначе: нормировка идёт по максимуму сети, а не по среднему. Из-за этого шкала сжата — первое место 100, второе 31, остальные внизу — и как ранг она не годится. Ценность здесь в слагаемых.',
                 'A second reading of the same question the systemic weight answers, computed differently: it is normalized against the network maximum rather than its mean. That compresses the scale — first place 100, second 31, everything else below — so it is a poor rank. The value here is in the ingredients.')}>
      {score != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11, padding: `0 ${PAD}px` }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--cf-text2)', lineHeight: 1, fontFamily: MONO }}>
            {score}
          </span>
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cf-text7)' }}>/100</span>
          <Meter value={score} color="var(--cf-text5)" width={80} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: `0 ${PAD}px` }}>
        {INTEGRATION_PARTS.map(key => {
          const meta = INTEGRATION_META[key];
          const v = integration[key];
          if (!meta || v == null) return null;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span title={meta.blurb} style={{ fontSize: 10.5, color: 'var(--cf-text4)', cursor: 'help', flexShrink: 0 }}>
                {meta.label}
              </span>
              <span title={t(`Вес этого слагаемого в интеграции — ${Math.round(meta.weight * 100)}%`,
                             `This ingredient's weight in the integration score — ${Math.round(meta.weight * 100)}%`)} style={{
                fontSize: 8.5, color: 'var(--cf-text8)', fontFamily: MONO, fontWeight: 700, cursor: 'help', flexShrink: 0,
              }}>×{meta.weight.toFixed(2)}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text2)', flexShrink: 0 }}>
                {meta.fmt === 'share' ? `${(v * 100).toFixed(1)}%` : v}
              </span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/** Sources behind the ENTITY itself (edges carry their own, per relation). */
function SourceList({ sources, sourcing, pendingDossier, isFixture, accent }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const total = sourcing?.total ?? sources.length;
  const self = sourcing?.selfSourced ?? null;
  const byTier = Object.entries(sourcing?.byTier || {}).sort((a, b) => Number(a[0]) - Number(b[0]));
  return (
    <Section title={t('Источники', 'Sources')} icon={<Quote size={11} />} count={total}>
      {/* ── ЧЕСТНОСТЬ ПРОФИЛЯ ────────────────────────────────────────────
          The campaign behind contract /4 began from a single measurement: 75
          of 107 entities had no citation of their own, so their «profile» was
          whatever somebody else's filing said about them. This is that
          measurement, per entity, and it is the reason the tier ladder was
          rebuilt — тир 1 no longer means «это сказала NVIDIA», it means «это
          сказала САМА эта сущность», which is why «своих» and «тир 1» are the
          same claim counted twice. */}
      {sourcing && (
        <div style={{ padding: `0 ${PAD}px 8px` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span title={SOURCING_META.selfBlurb} style={{ fontSize: 11, color: 'var(--cf-text3)', cursor: 'help' }}>
              {SOURCING_META.selfLabel}
            </span>
            <span style={{ flex: 1 }} />
            <span style={{
              fontSize: 13, fontFamily: MONO, fontWeight: 700,
              color: self === 0 ? 'var(--cf-warn)' : 'var(--cf-text1)',
            }}>{self ?? '—'}</span>
            <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text7)' }}>
              {t(`из ${total}`, `of ${total}`)}
            </span>
          </div>
          <div style={{ marginTop: 3, fontSize: 10, color: self === 0 ? 'var(--cf-warn)' : 'var(--cf-text6)', lineHeight: 1.5 }}>
            {self === 0
              ? t('Ни одного собственного документа. Всё, что карта говорит об этой сущности, сказано о ней другими — это профиль по чужим словам, а не исследование.',
                  "Not one document of its own. Everything the map says about this entity was said about it by others — this is a profile assembled from other parties' words, not research.")
              : self === total
                ? t('Профиль целиком собран из документов, изданных самой этой сущностью.',
                    "The profile is assembled entirely from documents published by the entity itself.")
                : t('Тир 1 здесь означает «опубликовано самой этой сущностью», а не «опубликовано центром карты»: под контрактом /4 твёрдость источника меряется от предмета.',
                    'Tier 1 here means «published by this entity itself», not «published by the centre of the map»: under contract /4 the solidity of a source is measured from the subject.')}
          </div>
          {pendingDossier && (
            <div style={{ marginTop: 5, fontSize: 10, color: 'var(--cf-warn)', lineHeight: 1.5 }}>
              {t('До узла не дошла очередь исследования — эти источники собраны попутно, отдельного досье по нему ещё не делали.',
                 'The research rotation has not reached this node — these sources were picked up in passing, and no dossier of its own has been made yet.')}
            </div>
          )}
          {byTier.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
              {byTier.map(([tier, count]) => {
                const tm = TIER_META[tier] || null;
                return (
                  <span key={tier} title={tm ? `${tm.label} — ${tm.blurb}` : undefined}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '2px 7px', borderRadius: 5,
                      background: 'var(--cf-surface2)',
                      border: `1px solid ${tm?.color ? tm.color + '55' : 'var(--cf-border)'}`,
                      fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text4)', cursor: tm ? 'help' : 'default',
                    }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: tm?.color || 'var(--cf-text7)' }} />
                    {tm ? tm.label : `${t('тир', 'tier')} ${tier}`}
                    <span style={{ color: 'var(--cf-text1)', fontWeight: 700 }}>{count}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
      {sources.length > 0 && (
      <button onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: `calc(100% - ${PAD * 2}px)`,
          margin: `0 ${PAD}px`, padding: '5px 0', background: 'transparent', border: 'none',
          cursor: 'pointer', color: 'var(--cf-text5)', fontSize: 10, fontFamily: MONO, textAlign: 'left',
        }}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {open ? t('Свернуть', 'Collapse') : t('Показать цитаты', 'Show the quotes')}
      </button>
      )}
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
  const t = useT();
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
            {t('источник', 'source')} <ExternalLink size={9} />
          </a>
        )}
        {ev.alive === false && (
          <span style={{ fontSize: 9, color: 'var(--cf-muted)', fontFamily: MONO }}>{t('ссылка не отвечает', 'link does not respond')}</span>
        )}
        {isFixture && (
          <span title={t('Данные пока черновые — настоящие цитаты придут с первым прогоном движка', 'The data is still a draft — real quotes arrive with the first engine run')} style={{
            fontSize: 8.5, color: 'var(--cf-warn)', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
          }}>{t('черновик', 'draft')}</span>
        )}
      </div>
    </div>
  );
}

// ── Profile: what this entity is ─────────────────────────────────────────
// TWO fields, both the engine's — the dashboard never invents either:
//   · oneLiner    — the lede. What this thing DOES inside this map, one line.
//   · description — the paragraph behind it. Who they are, when and by whom
//     they were founded, how big, where they sit in their market, what they
//     just did. The point is that the panel is SELF-SUFFICIENT: nobody should
//     have to go and google the company to follow the map.
// The paragraph is regular weight against the lede's semibold — same
// typographic split the flow map's EntityPanel uses, so the two maps read the
// same. The website comes from the logo side-car's domain and simply does not
// appear when there is no entry; a search chip is always there as the honest
// fallback, and it is the ONLY thing left when neither field arrived.
function ProfileBlock({ entity, gloss }) {
  const t = useT();
  const what = entity.oneLiner || null;
  const more = entity.description || null;
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
          {entity.role === 'state' ? t('Что это', 'What this is') : entity.role === 'capital' ? t('Кто это', 'Who this is') : t('Чем занимается', 'What it does')}
        </div>
        <div style={{
          fontSize: 12.5, lineHeight: 1.55, fontWeight: 600,
          color: what ? 'var(--cf-text1)' : 'var(--cf-text6)',
          fontStyle: what ? 'normal' : 'italic',
        }}>
          {what ? gloss(what) : t('Описания в данных пока нет — найдите через поиск ниже.', 'No description in the data yet — use the search below.')}
        </div>
        {more ? (
          <div style={{
            fontSize: 12, lineHeight: 1.62, fontWeight: 400, color: 'var(--cf-text2)',
            marginTop: 9, paddingTop: 9, borderTop: '1px solid var(--cf-border-hair)',
          }}>
            {gloss(more)}
          </div>
        ) : (
          // UNREACHABLE ON THE NETWORK MAP, AND KEPT ANYWAY. Coverage went
          // 0 → 27 → 107 of 107 over three deliveries, so nothing on this map
          // lands here today. It stays for two live cases: the reserve NVIDIA
          // map still runs contract /2, which has no `description` at all, and
          // a future delivery can always regress a field. Without this line a
          // gap renders as a one-line card that LOOKS like the map has nothing
          // to say — a different claim from "not written yet", and a reader
          // cannot tell them apart. Spec: ECOSYSTEM-PROSE-HANDOFF.md § TASK A.
          <div style={{
            fontSize: 10.5, lineHeight: 1.5, color: 'var(--cf-text6)',
            marginTop: 9, paddingTop: 9, borderTop: '1px solid var(--cf-border-hair)',
          }}>
            {t('Развёрнутое описание — что продаёт, на чём зарабатывает, какого размера — движок пока не прислал.',
               'The full description — what it sells, how it earns, how big it is — has not been delivered by the engine yet.')}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 }}>
          {entity.site && <LinkChip url={entity.site} icon={<Globe size={12} />} label={t('Сайт', 'Website')} external />}
          <LinkChip url={entity.searchUrl} icon={<Search size={12} />} label={t(`Искать «${entity.name}»`, `Search for “${entity.name}”`)} />
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
  const en = getLang() === 'en';
  const bits = [e.riskMeta?.label];
  if (e.riskTypeLabel) bits.push(e.riskTypeLabel);
  if (e.riskTimelineLabel) bits.push(`${en ? 'horizon' : 'горизонт'}: ${e.riskTimelineLabel}`);
  const head = bits.filter(Boolean).join(' · ');
  if (!e.risk?.mitigation) return head;
  return `${head}. ${en ? 'How to cover it' : 'Чем крыть'}: ${e.risk.mitigation}`;
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
//
// A section can also FOLD. A hub like NVIDIA prints eighty-one relations, and
// the reader arrives with ONE question, not eight — so the sections that can
// run metres long carry a chevron and keep their own state. Everything else
// keeps the plain header it always had: a toggle on a three-line block is
// noise, not control.
function Section({ title, icon, count, caption, children, collapsible = false, defaultOpen = true }) {
  const t = useT();
  const [open, setOpen] = useState(defaultOpen);
  const shown = !collapsible || open;
  const headStyle = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: `0 ${PAD}px ${shown && caption ? 5 : 9}px`,
    fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.12em',
  };
  const head = (
    <>
      {icon}
      {title}
      {count != null && <span style={{ color: 'var(--cf-text8)' }}>· {count}</span>}
    </>
  );
  return (
    <div style={{ padding: '13px 0 3px', borderBottom: '1px solid var(--cf-border-hair)' }}>
      {collapsible ? (
        <button
          onClick={() => setOpen(o => !o)}
          title={open ? t('Свернуть раздел', 'Collapse the section') : t('Развернуть раздел', 'Expand the section')}
          style={{
            ...headStyle, width: '100%', background: 'none', border: 'none',
            cursor: 'pointer', textAlign: 'left',
          }}>
          {head}
          <div style={{ flex: 1 }} />
          <span style={{ color: 'var(--cf-text8)', lineHeight: 0 }}>
            {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </span>
        </button>
      ) : (
        <div style={headStyle}>{head}</div>
      )}
      {shown && caption && (
        <div style={{ padding: `0 ${PAD}px 9px`, fontSize: 10.5, color: 'var(--cf-text6)', lineHeight: 1.5 }}>
          {caption}
        </div>
      )}
      {shown && children}
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
 * Is `b` a sub-brand of `a` (or vice versa) rather than a competitor? True
 * when one's name/alias contains the other's name/alias as a whole word —
 * e.g. "NVIDIA CUDA" contains "NVIDIA". Data-driven, not an id lookup: any
 * future entity named after its parent gets the same treatment for free.
 */
function sameFamily(a, b) {
  const namesOf = (e) => [e.name, ...(e.aliases || [])].filter(Boolean).map(s => s.toLowerCase());
  const containsWord = (haystack, needle) => {
    if (!needle || needle.length < 3) return false;
    const re = new RegExp(`(^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i');
    return re.test(haystack);
  };
  const aNames = namesOf(a), bNames = namesOf(b);
  return aNames.some(an => bNames.some(bn => an !== bn && (containsWord(bn, an) || containsWord(an, bn))));
}

/**
 * The one line above the rival list: where this entity stands, in words.
 * Everything in it is a fact from the file — a rank, a gap, a count — never a
 * derived percentage that looks like a market share but isn't one.
 */
function rivalRead(entity, rivals, rank) {
  const en = getLang() === 'en';
  const sector = entity.sectorLabel || entity.sector || (en ? 'its own function' : 'своей функции');
  if (!rivals.length) {
    return en
      ? `${entity.name} is the only entity in the ${sector} sector on this map. There simply is no second source here.`
      : `${entity.name} — единственная в карте в секторе «${sector}». Второго источника здесь просто нет.`;
  }
  const total = rivals.length + 1;
  const own = critIn(entity, entity.primaryLayer) || entity.criticality || 0;
  const leader = rivals[0];
  if (rank === 1) {
    const gap = own - leader.c;
    if (en) {
      return gap > 0
        ? `First of ${total} in the ${sector} sector — the next one (${leader.n.name}) trails by ${gap} ${gap === 1 ? 'point' : 'points'} of criticality.`
        : `Shares first place in the ${sector} sector with ${leader.n.name} — both at ${own}.`;
    }
    return gap > 0
      ? `Первая из ${total} в секторе «${sector}» — следующий (${leader.n.name}) отстаёт на ${gap} ${plural(gap, ['пункт', 'пункта', 'пунктов'])} критичности.`
      : `Делит первое место в секторе «${sector}» с ${leader.n.name} — оба на ${own}.`;
  }
  const gap = leader.c - own;
  return en
    ? `${rank}${rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'} of ${total} in the ${sector} sector; the leader ${leader.n.name} is ahead by ${gap} ${gap === 1 ? 'point' : 'points'}.`
    : `${rank}-я из ${total} в секторе «${sector}»; лидер ${leader.n.name} впереди на ${gap} ${plural(gap, ['пункт', 'пункта', 'пунктов'])}.`;
}

function plural(n, [one, few, many]) {
  const a = Math.abs(Math.round(n));
  const d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}
