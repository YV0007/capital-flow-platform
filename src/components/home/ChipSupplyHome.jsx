// ══════════════════════════════════════════════════════════════════════════
// Chip supply — the Nomura CSI on the home landing.
//
// One cycle indicator, plotted the way Nomura plots it (100 = balance, above
// = shortage) but drawn in the dashboard's own hand. The annotation text that
// sits inside Nomura's own chart deliberately does NOT appear on the plot —
// it lives in the read-out panel on the right instead.
//
// Data: src/data/chipSupplyIndex.json. There is no machine-readable feed —
// see `sourceNote` in that file and .claude/skills/chip-supply-index-refresh.
// ══════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { SectionHeader, Reveal, MONO, EASE } from './ui.jsx';
import { useT, useLang } from '../../lib/i18n.jsx';
import CSI from '../../data/chipSupplyIndex.json';

const ACCENT = '#F05252';   // shortage side
const COOL = '#38BDF8';     // slack side

const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Windows are functions of `t` — never call the translator at module level.
const ranges = (t) => [
  { id: 'all', months: 0, label: t('Весь ряд', 'Full series') },
  { id: '10y', months: 120, label: t('10 лет', '10 years') },
  { id: '5y', months: 60, label: t('5 лет', '5 years') },
  { id: '3y', months: 36, label: t('3 года', '3 years') },
];

function labelOf(d, lang) {
  const [y, m] = d.split('-');
  const months = lang === 'en' ? MONTHS_EN : MONTHS_RU;
  return `${months[Number(m) - 1]} ${y.slice(2)}`;
}

// ── Geometry ─────────────────────────────────────────────────────────────
const W = 820;
const H = 320;
const PAD = { l: 38, r: 14, t: 16, b: 26 };
const PLOT_W = W - PAD.l - PAD.r;
const PLOT_H = H - PAD.t - PAD.b;

export default function ChipSupplyHome({ onOpen }) {
  const t = useT();
  const { lang } = useLang();   // useLang() hands back the context object, not a string
  const [rangeId, setRangeId] = useState('all');
  const [hover, setHover] = useState(null);

  const windows = ranges(t);
  const win = windows.find((r) => r.id === rangeId) || windows[0];

  const geo = useMemo(() => {
    const all = CSI.series;
    const pts = win.months ? all.slice(Math.max(0, all.length - win.months)) : all;

    const vals = pts.map((p) => p.v);
    const lo = Math.floor((Math.min(...vals) - 0.3) * 2) / 2;
    const hi = Math.ceil((Math.max(...vals) + 0.3) * 2) / 2;

    const x = (i) => PAD.l + (pts.length === 1 ? PLOT_W / 2 : (i / (pts.length - 1)) * PLOT_W);
    const y = (v) => PAD.t + (1 - (v - lo) / (hi - lo)) * PLOT_H;

    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(p.v).toFixed(2)}`).join('');
    const base = y(CSI.balance);
    const area = `${line}L${x(pts.length - 1).toFixed(2)},${base.toFixed(2)}L${x(0).toFixed(2)},${base.toFixed(2)}Z`;

    // Integer gridlines inside the domain.
    const gridV = [];
    for (let v = Math.ceil(lo); v <= hi; v += 1) gridV.push(v);

    // Roughly six date ticks, always landing on a real point.
    const step = Math.max(1, Math.round(pts.length / 6));
    const ticks = [];
    for (let i = 0; i < pts.length; i += step) ticks.push(i);
    if (ticks[ticks.length - 1] !== pts.length - 1) ticks.push(pts.length - 1);

    return { pts, lo, hi, x, y, line, area, base, gridV, ticks };
  }, [win.months]);

  const { pts, x, y, line, area, base, gridV, ticks } = geo;
  const last = pts[pts.length - 1];
  const active = hover != null ? pts[hover] : last;
  const gap = active.v - CSI.balance;

  // Peak of the previous shortage episode, for the "vs 2021" read-out.
  const prevPeak = useMemo(() => {
    const upTo = CSI.series.filter((p) => p.d < '2024-01');
    return upTo.reduce((a, b) => (b.v > a.v ? b : a), upTo[0]);
  }, []);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (px - PAD.l) / PLOT_W;
    const i = Math.round(ratio * (pts.length - 1));
    setHover(Math.max(0, Math.min(pts.length - 1, i)));
  };

  const gy = (v) => ((y(v) - PAD.t) / PLOT_H);

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
      <Reveal>
        <SectionHeader
          eyebrow={t('Индикатор цикла', 'Cycle indicator')}
          title={t('Дефицит чипов', 'Chip shortage')}
          sub={t(
            'Индекс баланса спроса и предложения полупроводников от Nomura Global Economics. 100 — равновесие: выше — дефицит, ниже — избыток мощностей.',
            'Nomura Global Economics’ semiconductor supply-demand balance index. 100 is equilibrium: above it a shortage, below it supply slack.')}
          accent={ACCENT}
          actionLabel={onOpen ? t('Цепочка поставок', 'Supply chain') : null}
          onAction={onOpen}
        />
      </Reveal>

      <Reveal delay={80}>
        <div style={{
          background: 'var(--hm-surface)',
          border: '1px solid var(--hm-border)',
          borderRadius: 18,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.85fr) minmax(0, 1fr)',
        }} className="hm-csi-grid">

          {/* ── Plot ─────────────────────────────────────────────────── */}
          <div style={{ padding: '20px 8px 14px 20px', minWidth: 0 }}>
            {/* Read-out + window switch */}
            <div style={{
              display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap', paddingRight: 12, marginBottom: 6,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{
                    fontSize: 34, fontWeight: 700, fontFamily: MONO, lineHeight: 1,
                    letterSpacing: '-0.03em', color: 'var(--hm-text)',
                  }}>
                    {active.v.toFixed(2)}
                  </span>
                  <span style={{
                    fontSize: 12, fontFamily: MONO, fontWeight: 700,
                    color: gap >= 0 ? ACCENT : COOL,
                  }}>
                    {gap >= 0 ? '+' : '−'}{Math.abs(gap).toFixed(2)}
                  </span>
                </div>
                <div style={{
                  fontSize: 9.5, fontFamily: MONO, fontWeight: 700, marginTop: 8,
                  textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--hm-text5)',
                }}>
                  {labelOf(active.d, lang)} · {t('к балансу 100', 'vs balance of 100')}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {windows.map((r) => {
                  const on = r.id === rangeId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setRangeId(r.id); setHover(null); }}
                      style={{
                        font: 'inherit', cursor: 'pointer',
                        fontSize: 10, fontFamily: MONO, fontWeight: 700,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '5px 11px', borderRadius: 999,
                        background: on ? ACCENT + '18' : 'transparent',
                        border: `1px solid ${on ? ACCENT + '60' : 'var(--hm-border3)'}`,
                        color: on ? ACCENT : 'var(--hm-text5)',
                        transition: `all 180ms ${EASE}`,
                      }}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <svg
              viewBox={`0 0 ${W} ${H}`}
              style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
              role="img"
              aria-label={t('График индекса дефицита чипов Nomura', 'Nomura chip supply index chart')}
            >
              <defs>
                {/* One vertical ramp, hard-split at the balance line: warm above,
                    cool below. Saves painting two clipped areas. */}
                <linearGradient id="csiFill" x1="0" y1={PAD.t} x2="0" y2={PAD.t + PLOT_H} gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor={ACCENT} stopOpacity="0.30" />
                  <stop offset={gy(CSI.balance)} stopColor={ACCENT} stopOpacity="0.03" />
                  <stop offset={gy(CSI.balance)} stopColor={COOL} stopOpacity="0.03" />
                  <stop offset="1" stopColor={COOL} stopOpacity="0.24" />
                </linearGradient>
              </defs>

              {/* Gridlines + value axis */}
              {gridV.map((v) => (
                <g key={v}>
                  <line
                    x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)}
                    stroke={v === CSI.balance ? 'var(--hm-text5)' : 'var(--hm-hair)'}
                    strokeWidth={v === CSI.balance ? 1.1 : 1}
                    strokeDasharray={v === CSI.balance ? 'none' : '2 5'}
                  />
                  <text
                    x={PAD.l - 8} y={y(v) + 3.5} textAnchor="end"
                    fontSize="10" fontFamily={MONO}
                    fill={v === CSI.balance ? 'var(--hm-text3)' : 'var(--hm-text6)'}
                    fontWeight={v === CSI.balance ? 700 : 400}
                  >
                    {v}
                  </text>
                </g>
              ))}

              {/* Date axis */}
              {ticks.map((i) => (
                <text
                  key={i} x={x(i)} y={H - PAD.b + 16}
                  textAnchor={i === 0 ? 'start' : (i === pts.length - 1 ? 'end' : 'middle')}
                  fontSize="10" fontFamily={MONO} fill="var(--hm-text6)"
                >
                  {labelOf(pts[i].d, lang)}
                </text>
              ))}

              <path d={area} fill="url(#csiFill)" />
              <path
                d={line} fill="none" stroke={ACCENT} strokeWidth="2.1"
                strokeLinejoin="round" strokeLinecap="round"
              />

              {/* Latest point */}
              <circle cx={x(pts.length - 1)} cy={y(last.v)} r="4.4" fill={ACCENT} />
              <circle
                cx={x(pts.length - 1)} cy={y(last.v)} r="8" fill="none"
                stroke={ACCENT} strokeWidth="1.2" opacity="0.4" className="hm-spark-dot"
              />

              {/* Crosshair */}
              {hover != null && (
                <g pointerEvents="none">
                  <line
                    x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + PLOT_H}
                    stroke="var(--hm-text5)" strokeWidth="1" strokeDasharray="3 4"
                  />
                  <circle
                    cx={x(hover)} cy={y(pts[hover].v)} r="4.2"
                    fill="var(--hm-bg)" stroke={pts[hover].v >= CSI.balance ? ACCENT : COOL} strokeWidth="2"
                  />
                </g>
              )}

              {/* Baseline sits on top of the fill so it stays readable */}
              <line
                x1={PAD.l} x2={W - PAD.r} y1={base} y2={base}
                stroke="var(--hm-text5)" strokeWidth="1.1" pointerEvents="none"
              />
            </svg>
          </div>

          {/* ── Read-out ─────────────────────────────────────────────── */}
          <div style={{
            borderLeft: '1px solid var(--hm-hair)',
            padding: '22px 22px 20px',
            display: 'flex', flexDirection: 'column', gap: 16,
            background: 'var(--hm-chip)',
          }} className="hm-csi-note">

            <div>
              <div style={{
                fontSize: 9.5, fontFamily: MONO, fontWeight: 700, color: ACCENT,
                textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 9,
              }}>
                {t('Как читать', 'How to read it')}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--hm-text3)', lineHeight: 1.6 }}>
                {t(
                  'Индекс сводит заказы, запасы и сроки поставки в одно число. Выше 100 — спрос обгоняет предложение, у производителей есть ценовая власть. Ниже 100 — мощности свободны, цены под давлением. Чем дальше от 100, тем острее перекос.',
                  'The index folds orders, inventories and lead times into a single number. Above 100 demand outruns supply and makers hold pricing power. Below 100 capacity is free and prices are under pressure. The further from 100, the sharper the imbalance.')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <NoteStat
                label={t('Сейчас', 'Now')}
                value={`${last.v.toFixed(2)} · ${labelOf(last.d, lang)}`}
                tone={ACCENT}
              />
              <NoteStat
                label={t('Прежний максимум', 'Previous high')}
                value={`${prevPeak.v.toFixed(2)} · ${labelOf(prevPeak.d, lang)}`}
                tone="var(--hm-text4)"
              />
              <NoteStat
                label={t('Месяцев выше 100 подряд', 'Months above 100 in a row')}
                value={String(streakAbove(CSI.series, CSI.balance))}
                tone="var(--hm-text4)"
              />
            </div>

            <div style={{
              fontSize: 12, color: 'var(--hm-text4)', lineHeight: 1.6,
              paddingTop: 14, borderTop: '1px solid var(--hm-hair)',
            }}>
              {t(
                'Текущий уровень — самый высокий за весь ряд с 2012 года: перекос глубже, чем на пике ковидного дефицита 2021-го, и держится дольше. В 2021-м разворот индекса вниз совпал со сломом цикла чипов — поэтому смотреть стоит не на уровень, а на первый месяц устойчивого снижения.',
                'The current level is the highest in the series since 2012 — a deeper imbalance than the 2021 Covid-shortage peak, and a longer-lasting one. In 2021 the index turning down coincided with the chip cycle breaking, so the thing to watch is not the level but the first month of sustained decline.')}
            </div>

            <div style={{
              fontSize: 10, fontFamily: MONO, color: 'var(--hm-text6)', lineHeight: 1.6,
              paddingTop: 12, borderTop: '1px solid var(--hm-hair)', marginTop: 'auto',
            }}>
              <div>{CSI.underlying}</div>
              <div style={{ marginTop: 4 }}>
                {t('Данные на', 'Data as of')} {labelOf(CSI.asOf, lang)} · {t('обновляется ежемесячно', 'monthly refresh')}
              </div>
              <a
                href={CSI.publicSource} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--hm-text5)', textDecoration: 'none', borderBottom: '1px solid var(--hm-border3)', marginTop: 6, display: 'inline-block' }}
              >
                nomuraconnects.com ↗
              </a>
              <div style={{ marginTop: 8, opacity: 0.85 }}>
                {t(
                  'Ряд не публикуется машиночитаемо — история оцифрована с графика Nomura, ±0,1 пункта.',
                  'No machine-readable feed — the history is digitised from Nomura’s chart, ±0.1 pt.')}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <style>{`
        @media (max-width: 900px) {
          .hm-csi-grid { grid-template-columns: 1fr !important; }
          .hm-csi-note { border-left: none !important; border-top: 1px solid var(--hm-hair); }
        }
      `}</style>
    </section>
  );
}

function NoteStat({ label, value, tone }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 11.5, color: 'var(--hm-text5)' }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 700, color: tone, whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  );
}

/** Trailing run of readings at or above the balance line. */
function streakAbove(series, balance) {
  let n = 0;
  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i].v < balance) break;
    n += 1;
  }
  return n;
}
