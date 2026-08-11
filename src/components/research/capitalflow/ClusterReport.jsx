// ══════════════════════════════════════════════════════════════════════════
// ClusterReport — the summary that opens when you click a cluster TITLE on the
// map (a sector cell like "AI Applications", or an allocator island like
// "Venture").
//
// The map itself is deliberately quiet: a title and one total, nothing else.
// Everything that used to shout from the canvas — fired signals, class mixes,
// leaderboards — lives here instead, on demand, in one place.
//
// It answers, in this order and then stops:
//   1. How big is this and how does it rank
//   2. Who dominates it — by kind of money, then by name
//   3. Where does it actually land
//   4. Which way is it moving
//   5. The read (derived from those numbers, labelled as ours)
//   ⌄ Deeper breakdown, behind a disclosure: vehicle split + sub-sectors
//
// Every number carries its basis. Confirmed flows only in the headline;
// candidates are called out separately; undisclosed amounts never become $0
// silently. See clusterStats.js for the rules.
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import {
  X, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus,
  ArrowUpRight, Sparkles, Table2, Layers,
} from 'lucide-react';
import { fmtUSD, plural, formatSignalText } from './format.js';
import { STATUS_META, RULE_META, SECTOR_META, THEME_META, sectorLabel } from '../../../data/capitalMap.js';

const MONO = 'ui-monospace, monospace';
export const REPORT_W = 430;

// Capital Flow sector → the matching block in the Data Centers supply-chain
// research (dc/Roadmap NODES id). Only sectors with a genuine hardware/tech
// analog get the "technical breakdown" deep-link; the rest (defense, cyber,
// pe, credit, ev, robotics) have no supply-chain block and show no button.
const SECTOR_DC_BLOCK = {
  'ai-labs': 'lab',
  'ai-applications': 'apps',
  'ai-compute': 'rack',
  'neocloud': 'rack',
  'semiconductors': 'silicon',
  'fab-equipment': 'litho',
  'datacenters': 'contracting',
  'networking': 'photonics',
  'power-energy': 'power',
  'nuclear': 'nuc',
};

const pct = (x) => (x == null ? null : `${Math.round(x * 100)}%`);

export default function ClusterReport({ report, onOpenEntity, onOpenReceivers, onOpenDetail, onClose, topInset = 0 }) {
  const [deep, setDeep] = useState(false);
  const [openSignal, setOpenSignal] = useState(null);   // index of the expanded "who exactly" row
  if (!report) return null;

  const isSector = report.kind === 'sector';
  // Technical deep-dive link — only when this sector has a matching block in the
  // Data Centers supply-chain research.
  const dcBlock = isSector ? SECTOR_DC_BLOCK[report.key] : null;
  const mix = isSector ? report.byClass : report.bySector;
  const h = report.head;

  return (
    <aside style={{
      position: 'absolute', top: topInset, right: 0, bottom: 0, width: REPORT_W, zIndex: 26,
      background: 'var(--cf-panel)',
      borderLeft: '1px solid var(--cf-border)',
      backdropFilter: 'blur(10px)',
      boxShadow: '-24px 0 60px -20px var(--cf-shadow)',
      display: 'flex', flexDirection: 'column',
      animation: 'cfmSlide 220ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 13px', borderBottom: '1px solid var(--cf-border-soft)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 3, background: report.color, marginTop: 7,
            flexShrink: 0, boxShadow: `0 0 12px ${report.color}80`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {report.label}
            </div>
            <div style={{
              fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 5,
              textTransform: 'uppercase', letterSpacing: '0.09em',
            }}>
              {isSector ? 'Отчёт по сектору · куда идёт капитал' : 'Отчёт по классу · кто вкладывает капитал'}
            </div>
          </div>
          <button onClick={onClose} title="Закрыть отчёт"
            style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 3, lineHeight: 0, flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
            <X size={16} />
          </button>
        </div>
        {report.blurb && (
          <div style={{ fontSize: 11.5, color: 'var(--cf-text3)', lineHeight: 1.55, marginTop: 9 }}>
            {report.blurb}
          </div>
        )}
        {/* Technical deep-dive → the sector's block in the Data Centers supply
            chain: what it does, its role in the chain, and the key players. */}
        {dcBlock && onOpenDetail && (
          <button
            onClick={() => onOpenDetail(dcBlock)}
            title="Открыть технический разбор сектора в цепочке поставок ИИ"
            style={{
              display: 'flex', alignItems: 'center', gap: 11, width: '100%',
              marginTop: 11, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
              font: 'inherit', textAlign: 'left',
              background: `linear-gradient(120deg, ${report.color}22, var(--cf-surface1))`,
              border: `1px solid ${report.color}55`,
              transition: 'border-color 140ms, transform 140ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = report.color + '99'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = report.color + '55'; e.currentTarget.style.transform = 'none'; }}>
            <span style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: report.color + '1f', border: `1px solid ${report.color}44`, color: report.color,
            }}>
              <Layers size={15} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--cf-text0)' }}>
                Как это устроено — технический разбор
              </span>
              <span style={{ display: 'block', fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 2, letterSpacing: '0.02em' }}>
                Цепочка поставок ИИ · роль сектора и ключевые игроки
              </span>
            </span>
            <ArrowUpRight size={15} color={report.color} style={{ flexShrink: 0 }} />
          </button>
        )}
        {report.outsideAiStack && (
          <div style={{
            marginTop: 9, padding: '4px 8px', display: 'inline-block',
            background: 'var(--cf-surface2)', border: '1px solid var(--cf-border)', borderRadius: 5,
            fontSize: 9, color: 'var(--cf-muted)', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>Вне AI-тематики</div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 30px' }}>

        {/* 1 · How big */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Stat label={isSector ? 'Привлечено' : 'Вложено'}
            value={report.disclosedTotal ? fmtUSD(report.disclosedTotal) : (h.capital ? fmtUSD(h.capital) : '—')}
            hint="Весь раскрытый капитал, включая неподтверждённые потоки." big />
          <Stat label="Подтверждённые сделки" value={String(h.deals)}
            hint={h.undisclosedDeals ? `${h.undisclosedDeals} без раскрытой суммы` : 'Все суммы раскрыты'} big />
          <Stat label={isSector ? 'Инвесторы' : 'Активные имена'}
            value={String(isSector ? report.allocators : report.activeCount)}
            hint={isSector ? 'Уникальные источники капитала' : `${report.memberCount} в этом классе всего`} />
          <Stat label="Получатели" value={String(report.recipients)}
            hint="Уникальные получатели капитала" />
        </div>

        <div style={{
          marginTop: 9, padding: '9px 11px', background: 'var(--cf-surface1)',
          border: '1px solid var(--cf-border-soft)', borderRadius: 8,
          fontSize: 10.5, color: 'var(--cf-text3)', lineHeight: 1.6, fontFamily: MONO,
        }}>
          {report.rank && (
            <div>
              <b style={{ color: 'var(--cf-text1)' }}>#{report.rank.position}</b> из {report.rank.of}{' '}
              {isSector ? 'секторов' : 'классов инвесторов'} по капиталу
              {report.shareOfTracked != null && <> · <b style={{ color: 'var(--cf-text1)' }}>{pct(report.shareOfTracked)}</b> всего отслеживаемого капитала</>}
            </div>
          )}
          {h.medianTicket != null && (
            <div style={{ color: 'var(--cf-text5)' }}>
              Медианный чек {fmtUSD(h.medianTicket)}
              {h.largest && <> · крупнейший {fmtUSD(h.largest.amountUSD)}</>}
            </div>
          )}
          {(h.capital > 0 || h.candidateDeals > 0) && (
            <div style={{ color: 'var(--cf-text5)', marginTop: 3 }}>
              Подтверждено <b style={{ color: 'var(--cf-text3)' }}>{fmtUSD(h.capital)}</b> · {h.deals} {plural(h.deals, ['сделка', 'сделки', 'сделок'])}
              {h.candidateDeals ? (
                <span style={{ color: 'var(--cf-muted)' }}>
                  {' · '}кандидаты {h.candidateCapital ? fmtUSD(h.candidateCapital) : '—'} ({h.candidateDeals} {plural(h.candidateDeals, ['поток', 'потока', 'потоков'])})
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Expand → full list of every recipient in this sector, in the table.
            The panel only shows the top few; this opens the whole set, grouped
            by company / fund / project / asset, filtered to this sector. */}
        {isSector && onOpenReceivers && report.recipients > 0 && (
          <button onClick={() => onOpenReceivers(report.key)}
            title={`Открыть таблицу со всеми получателями сектора «${report.label}»`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '10px 12px', marginTop: 10,
              background: 'var(--cf-accent-bg)', border: '1px solid rgba(56,189,248,0.28)',
              borderRadius: 9, color: 'var(--cf-accent)',
              fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
            }}>
            <Table2 size={12} />
            Все получатели · {report.recipients}
            <ArrowUpRight size={12} />
          </button>
        )}

        {/* 2 · Who dominates */}
        <Section title={isSector ? 'Кто вкладывает' : 'Куда идут деньги'} />
        {report.dominant && (
          <div style={{
            padding: '10px 12px', borderRadius: 9, marginBottom: 9,
            background: `${report.dominant.color}0F`, border: `1px solid ${report.dominant.color}38`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: report.dominant.color }}>
              Впереди — {report.dominant.label.toLowerCase()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--cf-text3)', marginTop: 3, fontFamily: MONO }}>
              {fmtUSD(report.dominant.capital)} · {report.dominant.deals} {plural(report.dominant.deals, ['сделка', 'сделки', 'сделок'])}
              {h.deals ? ` · ${pct(report.dominant.deals / h.deals)} сделок` : ''}
              {h.capital ? ` · ${pct(report.dominant.capital / h.capital)} денег` : ''}
            </div>
            {report.dominant.blurb && (
              <div style={{ fontSize: 11, color: 'var(--cf-text4)', marginTop: 6, lineHeight: 1.5 }}>
                {report.dominant.blurb}
              </div>
            )}
          </div>
        )}
        {mix.slice(0, 6).map(m => (
          <Bar key={m.key} label={m.label} color={m.color}
            share={h.capital ? m.capital / h.capital : 0}
            right={`${fmtUSD(m.capital)} · ${m.deals} сд.`} />
        ))}

        {/* 3 · Names */}
        <Section title="Крупнейшие инвесторы"
          note="По подтверждённому раскрытому капиталу" />
        {report.topAllocators.map((a, i) => (
          <NameRow key={a.key} rank={i + 1} node={a.node}
            main={fmtUSD(a.capital)}
            sub={`${a.deals} ${plural(a.deals, ['сделка', 'сделки', 'сделок'])}${a.biggest ? ` · крупнейшая ${fmtUSD(a.biggest.amountUSD)}` : ''}`}
            onClick={() => a.node && onOpenEntity(a.node.id)} />
        ))}
        {!report.topAllocators.length && <Empty>Подтверждённых инвесторов в данных пока нет.</Empty>}

        <Section title={isSector ? 'Кто привлекает здесь' : 'Крупнейшие позиции'}
          note={isSector ? 'Компании и фонды, привлекающие в этом секторе' : 'По капиталу, полученному от этого класса'} />
        {report.topRecipients.map((r, i) => (
          <NameRow key={r.key} rank={i + 1} node={r.node}
            main={r.capital ? fmtUSD(r.capital) : 'не раскрыто'}
            sub={`${r.investors} ${plural(r.investors, ['инвестор', 'инвестора', 'инвесторов'])} · ${r.deals} ${plural(r.deals, ['сделка', 'сделки', 'сделок'])}`}
            onClick={() => r.node && onOpenEntity(r.node.id)} />
        ))}
        {!report.topRecipients.length && <Empty>Подтверждённых получателей в данных пока нет.</Empty>}

        {/* 4 · Momentum */}
        {report.momentum && (report.momentum.recentDeals || report.momentum.priorDeals) && (
          <>
            <Section title="Динамика"
              note={`Последние ${report.momentum.windowDays} дней против предыдущих ${report.momentum.windowDays}, отсчёт от даты выгрузки`} />
            <Momentum m={report.momentum} />
            {isSector && !!report.newEntrants.length && (
              <div style={{ fontSize: 11, color: 'var(--cf-text3)', marginTop: 8, lineHeight: 1.55 }}>
                <span title="До этого окна отслеженных сделок в секторе не было"
                  style={{ color: 'var(--cf-text5)', fontFamily: MONO, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'help' }}>
                  Впервые в секторе · </span>
                {report.newEntrants.slice(0, 6).map((n, i) => (
                  <span key={n.id}>
                    {i > 0 && ', '}
                    <button onClick={() => onOpenEntity(n.id)} style={linkBtn}>{n.name}</button>
                  </span>
                ))}
              </div>
            )}
            {!isSector && !!report.newSectors.length && (
              <div style={{ fontSize: 11, color: 'var(--cf-text3)', marginTop: 8, lineHeight: 1.55 }}>
                <span title="До этого окна отслеженных сделок в этих секторах не было"
                  style={{ color: 'var(--cf-text5)', fontFamily: MONO, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'help' }}>
                  Впервые вошли в · </span>
                {report.newSectors.map(sectorLabel).join(', ')}
              </div>
            )}
          </>
        )}

        {/* Signals — the engine's fired rules. This is what used to shout on
            the canvas; it belongs to the sector, so it lives in its report. */}
        {isSector && !!report.signals.length && (
          <>
            <Section title="Сработавшие сигналы" note="Правила движка, этот цикл" />
            {report.signals.map((s, i) => {
              const rule = RULE_META[s.rule];
              const open = openSignal === i;
              const hasEvidence = Array.isArray(s.evidence) && s.evidence.length > 0;
              return (
                <div key={i} style={{
                  padding: '9px 11px', marginBottom: 6, borderRadius: 8,
                  background: 'var(--cf-warn-bg)', border: '1px solid var(--cf-warn-bd)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={11} color="var(--cf-warn)" />
                    <span style={{
                      fontSize: 9.5, color: 'var(--cf-warn)', fontFamily: MONO, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                    }}>{rule?.label || s.rule}</span>
                    {typeof s.strength === 'number' && (
                      <span style={{ fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, marginLeft: 'auto' }}>
                        сила {s.strength}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--cf-text2)', marginTop: 5, lineHeight: 1.5 }}>
                    {formatSignalText(s.theme, SECTOR_META, THEME_META)}
                  </div>
                  {rule?.blurb && (
                    <div style={{ fontSize: 10.5, color: 'var(--cf-text5)', marginTop: 4, lineHeight: 1.5 }}>{rule.blurb}</div>
                  )}

                  {/* Кто именно — the evidence breakdown. Always visible as an
                      affordance so the interaction is discoverable before the
                      engine ships evidence; the empty state says so plainly
                      rather than pretending nothing is coming. */}
                  <button onClick={() => setOpenSignal(open ? null : i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, marginTop: 7,
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      font: 'inherit', fontSize: 10, fontFamily: MONO, fontWeight: 700,
                      color: 'var(--cf-warn)', letterSpacing: '0.03em',
                    }}>
                    {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                    Кто именно
                  </button>
                  {open && (
                    <div style={{ marginTop: 6, paddingTop: 7, borderTop: '1px solid var(--cf-warn-bd)' }}>
                      {hasEvidence ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {s.evidence.map((e, j) => (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 10.5 }}>
                              {e.allocator
                                ? <button onClick={() => onOpenEntity(e.allocator.id)} style={linkBtn}>{e.allocator.name}</button>
                                : <span style={{ color: 'var(--cf-text5)' }}>—</span>}
                              {e.target && (
                                <>
                                  <ArrowUpRight size={10} color="var(--cf-text7)" />
                                  <button onClick={() => onOpenEntity(e.target.id)} style={linkBtn}>{e.target.name}</button>
                                </>
                              )}
                              {typeof e.amount_usd === 'number' && (
                                <span style={{ color: 'var(--cf-text5)', fontFamily: MONO }}>{fmtUSD(e.amount_usd)}</span>
                              )}
                              {e.date && <span style={{ color: 'var(--cf-text7)', fontFamily: MONO, fontSize: 9.5 }}>{e.date}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 10, color: 'var(--cf-text6)', lineHeight: 1.5 }}>
                          Разбор по именам появится, когда движок начнёт присылать доказательства сигнала.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* 5 · The read */}
        {!!report.read.length && (
          <>
            <Section title="Наш комментарий" note="Выводы из цифр выше — наша трактовка, не данные движка" />
            <ul style={{ margin: 0, padding: '0 0 0 16px', listStyle: 'none' }}>
              {report.read.map((line, i) => (
                <li key={i} style={{
                  position: 'relative', fontSize: 12, color: 'var(--cf-text2)',
                  lineHeight: 1.62, marginBottom: 8,
                }}>
                  <span style={{
                    position: 'absolute', left: -14, top: 7, width: 4, height: 4,
                    borderRadius: '50%', background: report.color,
                  }} />
                  {line}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* ⌄ Deeper breakdown */}
        <button onClick={() => setDeep(d => !d)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            width: '100%', padding: '9px 12px', marginTop: 18,
            background: deep ? 'var(--cf-surface2)' : 'var(--cf-accent-bg)',
            border: `1px solid ${deep ? 'var(--cf-border)' : 'rgba(56,189,248,0.28)'}`,
            borderRadius: 9, color: deep ? 'var(--cf-text3)' : 'var(--cf-accent)',
            fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
          }}>
          {deep ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          Подробный разбор
        </button>

        {deep && (
          <div style={{ marginTop: 12 }}>
            {/* Vehicle split — structural, from the engine's own class field */}
            <Section title="Что на самом деле получает деньги"
              note="По классу объекта из данных движка — без домыслов" />
            {report.breakdown.vehicles.map(v => (
              <Bar key={v.key} label={`${v.label} (${v.count})`} color={v.color}
                share={h.capital ? v.capital / h.capital : 0}
                right={v.capital ? fmtUSD(v.capital) : 'не раскрыто'} />
            ))}
            {report.breakdown.vehicles.map(v => (
              <div key={`b-${v.key}`} style={{ fontSize: 10.5, color: 'var(--cf-text5)', lineHeight: 1.5, marginBottom: 5 }}>
                <b style={{ color: 'var(--cf-text4)' }}>{v.label}:</b> {v.blurb}
              </div>
            ))}

            {/* Sub-sector split — from the engine's per-deal subsector field */}
            <Section title="Подсекторы внутри кластера"
              note="Подсектор присылает движок по каждой сделке — показан как есть, без догадок" />
            {report.breakdown.operatingCount === 0 ? (
              <Empty>Операционных компаний здесь нет — все получатели это фонды, проекты или активы.</Empty>
            ) : (
              <>
                <div style={{
                  padding: '7px 10px', marginBottom: 9, borderRadius: 7,
                  background: 'var(--cf-surface1)', border: '1px dashed var(--cf-border)',
                  fontSize: 10, color: 'var(--cf-muted)', fontFamily: MONO, lineHeight: 1.55,
                }}>
                  Подсектор из данных движка у {report.breakdown.coverage.classified} из {report.breakdown.coverage.total} операционных компаний.
                  {report.breakdown.coverage.classified < report.breakdown.coverage.total &&
                    ' У остальных подсектор в данных не указан — оставлены без категории.'}
                </div>
                {report.breakdown.subsectors.map(s => (
                  <div key={s.key || '_none'} style={{ marginBottom: 9 }}>
                    <Bar label={`${s.label} (${s.count})`} color={s.color}
                      share={h.capital ? s.capital / h.capital : 0}
                      right={s.capital ? fmtUSD(s.capital) : '—'} />
                    <div style={{ fontSize: 10.5, color: 'var(--cf-text5)', lineHeight: 1.5, paddingLeft: 2 }}>
                      {s.members.slice(0, 8).map((n, i) => (
                        <span key={n.id}>
                          {i > 0 && ' · '}
                          <button onClick={() => onOpenEntity(n.id)} style={linkBtn}>{n.name}</button>
                        </span>
                      ))}
                      {s.members.length > 8 && ` и ещё ${s.members.length - 8}`}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Confidence mix */}
            <Section title="Насколько этому верить" />
            <div style={{ fontSize: 11, color: 'var(--cf-text3)', lineHeight: 1.6 }}>
              В заголовочных цифрах учтены только потоки со статусом <b style={{ color: STATUS_META.verified.color }}>подтверждено</b> и{' '}
              <b style={{ color: STATUS_META.verified_alpha.color }}>подтверждено α</b>.
              Нераскрытые суммы дают $0 — доллары занижены, а счётчик сделок нет.
              {!!h.candidateDeals && ` ${h.candidateDeals} ${plural(h.candidateDeals, ['поток-кандидат', 'потока-кандидата', 'потоков-кандидатов'])} не входят ни в одну цифру.`}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ── bits ─────────────────────────────────────────────────────────────────
const linkBtn = {
  background: 'none', border: 'none', padding: 0, margin: 0,
  color: 'var(--cf-text3)', fontSize: 'inherit', fontFamily: 'inherit',
  cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--cf-text9)',
};

function Section({ title, note }) {
  return (
    <div style={{ marginTop: 20, marginBottom: 9 }}>
      <div style={{
        fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>{title}</div>
      {note && <div style={{ fontSize: 10, color: 'var(--cf-text7)', marginTop: 3, lineHeight: 1.45 }}>{note}</div>}
    </div>
  );
}

function Stat({ label, value, hint, big }) {
  return (
    <div title={hint} style={{
      padding: '9px 11px', background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)',
      borderRadius: 8, cursor: hint ? 'help' : 'default',
    }}>
      <div style={{
        fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.09em',
      }}>{label}</div>
      <div style={{ fontSize: big ? 17 : 15, fontWeight: 700, color: 'var(--cf-text0)', marginTop: 3, letterSpacing: '-0.01em' }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', marginTop: 2, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function Bar({ label, color, share, right }) {
  const w = Math.max(2, Math.min(100, (share || 0) * 100));
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
        <span style={{ fontSize: 11.5, color: 'var(--cf-text2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <span style={{ fontSize: 10, color: 'var(--cf-text5)', fontFamily: MONO, flexShrink: 0 }}>{right}</span>
      </div>
      <div style={{ height: 4, background: 'var(--cf-surface3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${w}%`, height: '100%', background: color, opacity: 0.75, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function NameRow({ rank, node, main, sub, onClick }) {
  if (!node) return null;
  return (
    <button onClick={onClick} title={`Открыть ${node.name}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '8px 10px', marginBottom: 5, textAlign: 'left',
        background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 8,
        cursor: 'pointer', transition: 'border-color 130ms',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border-dashed)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border-soft)')}>
      <span style={{
        fontSize: 10, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700,
        width: 12, flexShrink: 0,
      }}>{rank}</span>
      <span style={{ width: 7, height: 7, borderRadius: 2, background: node.color, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block', fontSize: 12.5, color: 'var(--cf-text1)', fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{node.name}</span>
        <span style={{ display: 'block', fontSize: 10, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 2 }}>{sub}</span>
      </span>
      <span style={{ fontSize: 12, color: 'var(--cf-text0)', fontFamily: MONO, fontWeight: 700, flexShrink: 0 }}>{main}</span>
      <ArrowUpRight size={11} color="var(--cf-text9)" style={{ flexShrink: 0 }} />
    </button>
  );
}

function Momentum({ m }) {
  const up = m.recentDeals > m.priorDeals;
  const flat = m.recentDeals === m.priorDeals;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const color = flat ? 'var(--cf-muted)' : up ? 'var(--cf-good)' : 'var(--cf-bad)';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div style={{ padding: '9px 11px', background: 'var(--cf-surface1)', border: `1px solid ${color}33`, borderRadius: 8 }}>
        <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          Последние {m.windowDays} дн
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <Icon size={13} color={color} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cf-text0)' }}>{fmtUSD(m.recentCapital)}</span>
        </div>
        <div style={{ fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 2 }}>
          {m.recentDeals} {plural(m.recentDeals, ['сделка', 'сделки', 'сделок'])}
        </div>
      </div>
      <div style={{ padding: '9px 11px', background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 8 }}>
        <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          Предыдущие {m.windowDays} дн
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cf-text3)', marginTop: 3 }}>{fmtUSD(m.priorCapital)}</div>
        <div style={{ fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 2 }}>
          {m.priorDeals} {plural(m.priorDeals, ['сделка', 'сделки', 'сделок'])}
        </div>
      </div>
    </div>
  );
}

function Empty({ children }) {
  return (
    <div style={{
      padding: '10px 12px', background: 'var(--cf-surface1)', border: '1px dashed var(--cf-border)',
      borderRadius: 8, fontSize: 11, color: 'var(--cf-text5)', lineHeight: 1.5,
    }}>{children}</div>
  );
}
