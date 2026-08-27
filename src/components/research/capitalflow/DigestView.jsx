// ══════════════════════════════════════════════════════════════════════════
// DigestView — the Flow Digest section (third view, next to Карта / Таблица).
//
// A briefing on the whole map: a week, a month, and the entire tracked stack.
// You should be able to read one block and know what moved, who led, and where
// the money went — without touching the graph. All numbers come from digest.js
// (pure, payload-derived); this file only lays them out.
// ══════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { ArrowUpRight, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { buildDigest } from './digest.js';
import { fmtUSD, plural, formatSignalText, businessGist } from './format.js';
import { subsectorLabel } from './subsectors.js';
import { SECTOR_META, THEME_META, RULE_META, sectorLabel } from '../../../data/capitalMap.js';
import { useT, getLang } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';

export default function DigestView({ nodes, links, generated, sectors, trends, onOpenEntity, topInset = 0 }) {
  const t = useT();
  const digest = useMemo(
    () => buildDigest({ nodes, links, generated, sectors }),
    [nodes, links, generated, sectors]
  );
  const [tab, setTab] = useState('week');
  const block = digest.blocks.find(b => b.id === tab) || digest.blocks[0];
  const isAll = block.id === 'all';
  const windowSignals = digest.signalsByWindow?.[block.id] || [];
  // Engine ships each cluster into every window it qualifies for — so
  // defense-manufacturing appears in both `month` and `all` today, and would
  // read as a repeat across tabs if we rendered `trends[block.id]` as-is.
  // Bucket each cluster into the NARROWEST engine window it appears in, so
  // week/month/all become a strict differential: a trend hitting the 7-day
  // bar shows only in week; a longer-arc pattern shows only in all. Honors
  // the engine's own window analysis (a cluster in `week` really did clear
  // the tighter 7-day threshold, not just fit inside a smaller date range).
  const dedupedTrends = useMemo(() => {
    const bins = { week: [], month: [], all: [] };
    const seen = new Set();
    for (const bin of ['week', 'month', 'all']) {
      (trends?.[bin] || []).forEach(t => {
        if (seen.has(t.cluster_id)) return;
        seen.add(t.cluster_id);
        bins[bin].push(t);
      });
    }
    return bins;
  }, [trends]);
  const windowTrends = dedupedTrends[block.id] || [];
  // Fallback lookup for trend.allocators (plain display-name strings) when the
  // engine's evidence doesn't resolve to real ids — still lets a name open its
  // entity panel instead of rendering as inert text.
  const nodeByName = useMemo(() => new Map(nodes.map(n => [n.name, n])), [nodes]);

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, top: topInset, zIndex: 20,
      background: 'var(--cf-canvas)', overflowY: 'auto',
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '18px 24px 60px' }}>

        {/* Heading + window tabs */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em' }}>
            {t('Сводка по потокам', 'Flow digest')}
          </span>
          <span style={{ fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {t('на', 'as of')} {generated}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--cf-text5)', fontFamily: MONO, marginBottom: 16 }}>
          {t('Что произошло в потоках капитала — коротко, чтобы понять картину с одного экрана.', 'What happened in the capital flows — short enough to read the whole picture off one screen.')}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {digest.blocks.map(b => (
            <button key={b.id} onClick={() => setTab(b.id)}
              style={{
                padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                background: tab === b.id ? 'var(--cf-accent-bg)' : 'var(--cf-surface2)',
                border: `1px solid ${tab === b.id ? 'var(--cf-accent-bd)' : 'var(--cf-border)'}`,
                color: tab === b.id ? 'var(--cf-accent)' : 'var(--cf-text3)',
                fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
              {b.title}
            </button>
          ))}
        </div>

        {/* Sub + narrative */}
        <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          {block.sub}
        </div>

        {block.empty ? (
          <Empty>{t('За это окно подтверждённых потоков нет — попробуйте месяц или всю карту.', 'No confirmed flows in this window — try the month or the whole map.')}</Empty>
        ) : (
          <>
            {/* Headline stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 14 }}>
              <Stat label={t('Раскрытый приток', 'Disclosed inflow')} value={block.head.capital ? fmtUSD(block.head.capital) : '—'}
                hint={t('Подтверждённые потоки с раскрытой суммой', 'Confirmed flows with a disclosed amount')} big />
              <Stat label={t('Подтверждённые сделки', 'Confirmed deals')} value={String(block.head.deals)}
                hint={block.head.candidateDeals ? `+ ${block.head.candidateDeals} кандидатов` : t('все подтверждены', 'all confirmed')} />
              <Stat label={t('Инвесторов', 'Allocators')} value={String(block.uniqueInvestors)}
                hint={t('уникальных источников в окне', 'distinct sources in the window')} />
              <Stat label={t('Получателей', 'Recipients')} value={String(block.uniqueBeneficiaries)}
                hint={t('уникальных получателей в окне', 'distinct recipients in the window')} />
              {block.concentration && (
                <Stat label={t('Концентрация', 'Concentration')} value={`${t('топ-3', 'top 3')}: ${Math.round(block.concentration.top3Share * 100)}%`}
                  hint={t(`половина в ${block.concentration.dealsToHalf} ${plural(block.concentration.dealsToHalf, ['сделке', 'сделках', 'сделках'])} · ${block.concentration.mood}`,
                          `half of it in ${block.concentration.dealsToHalf} ${block.concentration.dealsToHalf === 1 ? 'deal' : 'deals'} · ${block.concentration.mood}`)} />
              )}
            </div>

            {/* Narrative */}
            <div style={{
              padding: '13px 15px', marginBottom: 20, borderRadius: 10,
              background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)',
            }}>
              {block.read.map((line, i) => (
                <p key={i} style={{ margin: i ? '7px 0 0' : 0, fontSize: 12.5, color: i === 0 ? 'var(--cf-text1)' : 'var(--cf-text3)', lineHeight: 1.6 }}>
                  {line}
                </p>
              ))}
            </div>

            {/* Trends — the engine's grounded narrative synthesis for this
                window. Each cluster shows in the NARROWEST window it qualified
                for (dedupe above), so week / month / all read as a strict
                differential rather than three near-copies of the same list.
                An empty window shows an honest explainer of why the engine
                didn't tag anything at that scope and when the next refresh
                will land, so a quiet week doesn't look like a broken tab. */}
            <div style={{ marginBottom: 20 }}>
              <SectionLabel>{t('Тренды окна', 'Trends in the window')}</SectionLabel>
              <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', marginTop: -5, marginBottom: 11 }}>
                {t('Разбор движка — что стоит за цифрами, не только куда сместился приток', 'The engine\'s breakdown — what sits behind the numbers, not just where the inflow moved')}
              </div>
              {windowTrends.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {windowTrends.map((t, i) => (
                    <TrendCard key={i} trend={t} onOpenEntity={onOpenEntity} nodeByName={nodeByName} />
                  ))}
                </div>
              ) : (
                <Empty>{trendEmptyCopy(block.id)}</Empty>
              )}
            </div>

            {/* Insight row — sector rotation + who's driving */}
            {(block.rotation || block.classMix.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
                {block.rotation && (
                  <div style={{ padding: '13px 15px', borderRadius: 10, background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)' }}>
                    <SectionLabel>{t('Куда смещается фокус', 'Where the focus is rotating')}</SectionLabel>
                    <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', marginTop: -5, marginBottom: 11 }}>{t('Сдвиг доли секторов против прошлого окна', 'The shift in sector share against the previous window')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <RotCol dir="up" rows={block.rotation.gained} />
                      <RotCol dir="down" rows={block.rotation.lost} />
                    </div>
                  </div>
                )}
                {block.classMix.length > 0 && (
                  <div style={{ padding: '13px 15px', borderRadius: 10, background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)' }}>
                    <SectionLabel>{t('Кто двигает капитал', 'Who is moving the capital')}</SectionLabel>
                    <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', marginTop: -5, marginBottom: 11 }}>{t('Класс инвестора — доля притока окна', 'Allocator class — share of the window\'s inflow')}</div>
                    <ClassMixBar rows={block.classMix} />
                  </div>
                )}
              </div>
            )}

            {/* Three lists */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 8 }}>
              <List title={t('Топ инвесторов по размеру', 'Top allocators by size')} note={t('По раскрытому подтверждённому капиталу', 'By disclosed, confirmed capital')}>
                {block.investors.length
                  ? block.investors.map((r, i) => (
                      <NameRow key={r.key} rank={i + 1} node={r.node}
                        main={r.capital ? fmtUSD(r.capital) : t('не раскрыто', 'undisclosed')}
                        sub={`${r.deals} ${plural(r.deals, ['сделка', 'сделки', 'сделок'], ['deal', 'deals'])}`}
                        onClick={() => r.node && onOpenEntity(r.node.id)} />
                    ))
                  : <Empty>{t('Нет данных.', 'No data.')}</Empty>}
              </List>

              <List title={t('Топ получателей', 'Top recipients')} note={t('Куда пришло больше всего', 'Where the most landed')}>
                {block.beneficiaries.length
                  ? block.beneficiaries.map((r, i) => (
                      <NameRow key={r.key} rank={i + 1} node={r.node}
                        main={r.capital ? fmtUSD(r.capital) : t('не раскрыто', 'undisclosed')}
                        sub={`${r.deals} ${plural(r.deals, ['сделка', 'сделки', 'сделок'], ['deal', 'deals'])}`}
                        onClick={() => r.node && onOpenEntity(r.node.id)} />
                    ))
                  : <Empty>{t('Нет данных.', 'No data.')}</Empty>}
              </List>

              <List title={t('Топ секторов по притоку', 'Top sectors by inflow')} note={t('Доля раскрытого притока окна', 'Share of the window\'s disclosed inflow')}>
                {block.sectors.length
                  ? block.sectors.map(s => (
                      <SectorBar key={s.key}
                        label={s.key === '_none' ? t('Без сектора', 'No sector') : sectorLabel(s.key)}
                        color={SECTOR_META[s.key]?.color || 'var(--cf-text9)'}
                        share={s.share} right={fmtUSD(s.capital)} />
                    ))
                  : <Empty>{t('Нет данных.', 'No data.')}</Empty>}
              </List>
            </div>

            {/* New entrants */}
            {block.newEntrants.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <SectionLabel>{t('Впервые на карте', 'New to the map')}</SectionLabel>
                <div style={{ fontSize: 11.5, color: 'var(--cf-text3)', lineHeight: 1.7 }}>
                  {block.newEntrants.map((n, i) => (
                    <span key={n.id}>
                      {i > 0 && ' · '}
                      <button onClick={() => onOpenEntity(n.id)} style={linkBtn}>{n.name}</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Signals — windowed like the rest of the block. A signal belongs
                here when at least one of its evidence flows falls inside this
                window (digest.js `signalsInWindow`), so 'За неделю' only ever
                shows signals actually backed by this week's flows, not every
                signal live on the whole map. */}
            {windowSignals.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <SectionLabel>
                  {isAll
                    ? t('Сработавшие сигналы · этот цикл', 'Signals fired · this cycle')
                    : `${t('Сработавшие сигналы', 'Signals fired')} · ${block.id === 'week' ? t('за неделю', 'this week') : t('за месяц', 'this month')}`}
                </SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
                  {windowSignals.slice(0, 8).map((s, i) => {
                    const rule = RULE_META[s.rule];
                    return (
                      <div key={i} style={{
                        padding: '9px 11px', borderRadius: 8,
                        background: 'var(--cf-warn-bg)', border: '1px solid var(--cf-warn-bd)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Sparkles size={11} color="var(--cf-warn)" />
                          <span style={{ fontSize: 9.5, color: 'var(--cf-warn)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {rule?.label || s.rule}
                          </span>
                          <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO }}>
                            {s.sector === '_none' ? '' : sectorLabel(s.sector)}
                          </span>
                        </div>
                        {s.theme && (
                          <div style={{ fontSize: 11, color: 'var(--cf-text2)', marginTop: 5, lineHeight: 1.5 }}>
                            {formatSignalText(s.theme, SECTOR_META, THEME_META)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

// Empty-state copy for the трenditor block. Names WHY the engine has nothing
// to show at this window scope (its own qualifying rule, not a bug) and WHEN
// the next research pass will attempt again. Reads honestly on a quiet week,
// where the previous copy just rendered a "no data" tile that looked broken.
function trendEmptyCopy(win) {
  const en = getLang() === 'en';
  if (win === 'week') {
    return en
      ? 'Over 7 days no cluster reached the minimum of two key/core allocators inside one sub-industry — the engine does not tag those as a weekly trend. Next attempt: Monday 10:00 Madrid.'
      : 'За 7 дней ни один кластер не набрал минимум двух key/core-инвесторов в одной суб-отрасли — движок не тегирует такие как тренд недели. Следующая попытка — понедельник 10:00 Мадрид.';
  }
  if (win === 'month') {
    return en
      ? 'Over 30 days there are no month-specific clusters — everything the engine found in this window already appears in the weekly section.'
      : 'За 30 дней уникальных для месяца кластеров нет — всё, что движок нашёл на этом окне, уже показано в недельном разделе.';
  }
  return en
    ? 'The engine surfaced no long-run trends distinct from the monthly ones this cycle.'
    : 'Долгосрочных трендов, отличных от месячных, движок в этом цикле не выделил.';
}


// A single engine-authored trend. Reading order is (why → what → who), because
// the point of this card is to give the user a LEAD — "look here, this is
// what's happening in this corner of the map" — not a data recap they have to
// re-derive on their own.
//   1. Title (engine's one-line thesis) + subsector chip.
//   2. "О чём это" — a business gist for the primary target(s), so an
//      unfamiliar name (Hadrian, Volta Infra) stops being opaque, plus a
//      direct link to that entity's node on the map.
//   3. Engine narrative — the grounded paragraph (why + who), rendered as
//      secondary supporting prose. If the engine keeps writing pure recap,
//      the header row and target gist above still carry a real "what to
//      watch" message on their own.
//   4. Stats + investor chips at the bottom, MONO, tertiary.
function TrendCard({ trend, onOpenEntity, nodeByName }) {
  const t = useT();
  // Prefer resolved evidence (real node refs, so a click always works); when
  // the engine's evidence doesn't resolve to ids yet, fall back to the plain
  // display-name convenience array — still resolved to a clickable node via
  // name lookup when possible, plain text otherwise.
  const fromEvidence = [...new Map(
    (trend.evidence || []).filter(e => e.allocator).map(e => [e.allocator.id, e.allocator])
  ).values()];
  const allocators = fromEvidence.length ? fromEvidence
    : (Array.isArray(trend.allocators) ? trend.allocators : [])
        .map(name => nodeByName?.get(name) || { id: null, name });

  // The companies actually on the receiving end of the trend — the "look at
  // these" the card points the user toward. De-duped, resolved to real nodes
  // when possible so each name is a click into the map.
  const targets = [...new Map(
    (trend.evidence || [])
      .map(e => e.target)
      .filter(Boolean)
      .map(n => [n.id, n])
  ).values()];
  // A one-line business gist per target — what the company DOES, not how much
  // it raised (the funding half of the description is already the surrounding
  // narrative). Falls back to whatever prose we have if trimming empties it.
  const targetGists = targets.map(n => ({
    node: n,
    gist: businessGist(n.description, 2),
  }));

  const lowConfidence = trend.confidence === 'low' || trend.provisional;
  const subLabel = trend.subsector ? subsectorLabel(trend.subsector) : null;
  const sectorColor = trend.sector ? (SECTOR_META[trend.sector]?.color || 'var(--cf-text6)') : null;

  return (
    <div style={{ padding: '13px 15px', borderRadius: 10, background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)' }}>
      {/* 1 — headline */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cf-text0)', lineHeight: 1.35 }}>{trend.title}</span>
        {subLabel && (
          <span style={{
            fontSize: 9.5, color: sectorColor || 'var(--cf-text5)', fontFamily: MONO,
            border: `1px solid ${sectorColor ? sectorColor + '40' : 'var(--cf-border)'}`,
            padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {subLabel}
          </span>
        )}
        {trend.sector && !subLabel && (
          <span style={{ fontSize: 9.5, color: sectorColor, fontFamily: MONO }}>
            {sectorLabel(trend.sector)}
          </span>
        )}
        {lowConfidence && (
          <span style={{
            marginLeft: 'auto', fontSize: 8.5, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text6)',
            border: '1px dashed var(--cf-border-dashed)', borderRadius: 5, padding: '2px 6px',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{t('Слабый сигнал', 'Weak signal')}</span>
        )}
      </div>

      {/* 2 — the "what business is this even about" block, with a direct link
          into the map for each target. This is what turns the trend from a
          list of participants into a real lead. */}
      {targetGists.length > 0 && (
        <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {targetGists.map(({ node, gist }) => (
            <div key={node.id} style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--cf-text2)' }}>
              <button
                onClick={() => onOpenEntity(node.id)}
                style={{ ...linkBtn, fontWeight: 700, color: 'var(--cf-text0)' }}
                title={t('Открыть на карте', 'Open on the map')}
              >
                {node.name}
                <ArrowUpRight size={11} style={{ marginLeft: 2, verticalAlign: '-1px', color: 'var(--cf-text6)' }} />
              </button>
              {gist && (
                <span style={{ color: 'var(--cf-text3)' }}> — {gist}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3 — engine narrative, kept but demoted to supporting prose */}
      {trend.narrative && (
        <p style={{
          margin: '10px 0 0', fontSize: 11.5, color: 'var(--cf-text4)',
          lineHeight: 1.6, borderLeft: '2px solid var(--cf-border-soft)', paddingLeft: 10,
        }}>
          {trend.narrative}
        </p>
      )}

      {/* 4 — tertiary: numbers and named investors */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, fontSize: 10.5, fontFamily: MONO, color: 'var(--cf-text5)' }}>
        {typeof trend.deals === 'number' && <span>{trend.deals} {plural(trend.deals, ['сделка', 'сделки', 'сделок'], ['deal', 'deals'])}</span>}
        {typeof trend.capital_usd === 'number' && trend.capital_usd > 0 && (
          <span style={{ color: 'var(--cf-text3)' }}>{fmtUSD(trend.capital_usd)}</span>
        )}
        {Array.isArray(trend.date_range) && trend.date_range.length === 2 && (
          <span>{trend.date_range[0]} → {trend.date_range[1]}</span>
        )}
      </div>
      {allocators.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'baseline' }}>
          <span style={{ fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('инвесторы:', 'allocators:')}
          </span>
          {allocators.map((a, i) => (
            a.id
              ? <button key={a.id} onClick={() => onOpenEntity(a.id)} style={linkBtn}>{a.name}</button>
              : <span key={i} style={{ color: 'var(--cf-text4)', fontSize: 'inherit' }}>{a.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── bits ─────────────────────────────────────────────────────────────────
const linkBtn = {
  background: 'none', border: 'none', padding: 0, margin: 0,
  color: 'var(--cf-text2)', fontSize: 'inherit', fontFamily: 'inherit',
  cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--cf-text9)',
};

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 9,
    }}>{children}</div>
  );
}

function List({ title, note, children }) {
  return (
    <div>
      <div style={{ marginBottom: 9 }}>
        <div style={{ fontSize: 9.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</div>
        {note && <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', marginTop: 3 }}>{note}</div>}
      </div>
      {children}
    </div>
  );
}

function RotCol({ dir, rows }) {
  const t = useT();
  const up = dir === 'up';
  const color = up ? 'var(--cf-good)' : 'var(--cf-bad)';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        {up ? <TrendingUp size={12} color={color} /> : <TrendingDown size={12} color={color} />}
        <span style={{ fontSize: 9.5, color, fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {up ? t('Набирают', 'Gaining') : t('Теряют', 'Losing')}
        </span>
      </div>
      {rows.length ? rows.map(r => (
        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: 2, background: r.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: 'var(--cf-text2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
          <span style={{ fontSize: 10.5, color, fontFamily: MONO, fontWeight: 700, flexShrink: 0 }}>
            {r.deltaPP > 0 ? '+' : '−'}{Math.abs(Math.round(r.deltaPP))} {t('п.п.', 'pp')}
          </span>
        </div>
      )) : <span style={{ fontSize: 10.5, color: 'var(--cf-text7)', fontFamily: MONO }}>—</span>}
    </div>
  );
}

function ClassMixBar({ rows }) {
  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--cf-border-hair)' }}>
        {rows.map(r => (
          <span key={r.cls} title={`${r.label} — ${Math.round(r.share * 100)}%`}
            style={{ width: `${r.share * 100}%`, background: r.color }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
        {rows.map(r => (
          <span key={r.cls} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--cf-text4)', fontFamily: MONO }}>
            <span style={{ width: 6, height: 6, borderRadius: 2, background: r.color }} />
            {r.label}
            <span style={{ color: 'var(--cf-text1)', fontWeight: 700 }}>{Math.round(r.share * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, hint, big }) {
  return (
    <div title={hint} style={{
      padding: '9px 11px', background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)',
      borderRadius: 8, cursor: hint ? 'help' : 'default',
    }}>
      <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{label}</div>
      <div style={{ fontSize: big ? 17 : 15, fontWeight: 700, color: 'var(--cf-text0)', marginTop: 3, letterSpacing: '-0.01em' }}>{value}</div>
      {hint && <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', marginTop: 2, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function SectorBar({ label, color, share, right }) {
  const w = Math.max(2, Math.min(100, (share || 0) * 100));
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
        <span style={{ fontSize: 11.5, color: 'var(--cf-text2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: 10, color: 'var(--cf-text5)', fontFamily: MONO, flexShrink: 0 }}>{right} · {Math.round((share || 0) * 100)}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--cf-surface3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${w}%`, height: '100%', background: color, opacity: 0.75, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function NameRow({ rank, node, main, sub, onClick }) {
  const t = useT();
  if (!node) return null;
  return (
    <button onClick={onClick} title={t(`Открыть ${node.name}`, `Open ${node.name}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '8px 10px', marginBottom: 5, textAlign: 'left',
        background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 8,
        cursor: 'pointer', transition: 'border-color 130ms',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border-dashed)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border-soft)')}>
      <span style={{ fontSize: 10, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, width: 12, flexShrink: 0 }}>{rank}</span>
      <span style={{ width: 7, height: 7, borderRadius: 2, background: node.color, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12.5, color: 'var(--cf-text1)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
        <span style={{ display: 'block', fontSize: 10, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 2 }}>{sub}</span>
      </span>
      <span style={{ fontSize: 12, color: 'var(--cf-text0)', fontFamily: MONO, fontWeight: 700, flexShrink: 0 }}>{main}</span>
      <ArrowUpRight size={11} color="var(--cf-text9)" style={{ flexShrink: 0 }} />
    </button>
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
