// FinancialDeep — section 08 «Финансовая составляющая», rebuilt Roic.ai-style.
// Returns + price/series chart, multi-year metric table, company description,
// capital structure, working capital, growth rates, quarterly revenue.
// Data: src/data/holdings-v2/financial/<id>.json. Dark mode only.

import { useState } from 'react';
import holdingsData from '../../data/holdings.json';

const C = holdingsData.THEMES.dark;

const fmtNum = (val, fmt) => {
  if (val === null || val === undefined) return '–';
  if (fmt === 'pct') return `${val}%`;
  if (fmt === 'int') return Math.round(val).toLocaleString('en-US');
  return val.toFixed(2);
};
const isNeg = (v) => typeof v === 'number' && v < 0;

function MiniChart({ pts, color, unit }) {
  const [hover, setHover] = useState(null);
  const clean = pts.filter((p) => p.val != null);
  if (clean.length < 2) return null;
  const vals = clean.map((p) => p.val);
  const min = Math.min(...vals), max = Math.max(...vals);
  const W = 560, H = 200, padL = 46, padR = 12, padT = 10, padB = 26;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const x = (i) => padL + (i * innerW) / (clean.length - 1);
  const y = (v) => padT + innerH - ((v - min) / (max - min || 1)) * innerH;
  const line = clean.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.val).toFixed(1)}`).join(' ');
  const area = `${line} L${x(clean.length - 1).toFixed(1)} ${padT + innerH} L${x(0).toFixed(1)} ${padT + innerH} Z`;

  // Y-axis ticks — 4 evenly spaced gridlines
  const niceStep = (r) => { const p = Math.pow(10, Math.floor(Math.log10(r || 1))); const n = r / p; return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p; };
  const step = niceStep((max - min) / 3) || 1;
  const yTicks = []; for (let v = Math.floor(min / step) * step; v <= max + 0.001; v += step) yTicks.push(v);
  const fmtY = (v) => Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v >= 100 ? Math.round(v).toString() : v.toFixed(unit === 'pct' ? 0 : (v >= 10 ? 1 : 2));

  // X-axis: first + last + midpoints to reduce clutter
  const xTicks = clean.length <= 6 ? clean.map((_, i) => i) : [0, Math.floor(clean.length / 3), Math.floor((2 * clean.length) / 3), clean.length - 1];

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const i = Math.round(((px - padL) / innerW) * (clean.length - 1));
          setHover(Math.max(0, Math.min(clean.length - 1, i)));
        }}>
        {/* horizontal gridlines + Y labels */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke={C.line} strokeWidth="0.7" strokeDasharray="2 4" />
            <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize="9.5" fill={C.inkFaint} fontFamily="var(--mono)">{fmtY(v)}{unit === 'pct' ? '%' : ''}</text>
          </g>
        ))}
        <path d={area} fill={color + '14'} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" />
        {clean.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.val)} r="2" fill={color} />)}
        {/* X-axis labels */}
        {xTicks.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === clean.length - 1 ? 'end' : 'middle'} fontSize="10" fill={C.inkFaint} fontFamily="var(--mono)">{clean[i].year}</text>
        ))}
        {/* hover crosshair + point */}
        {hover != null && (
          <g pointerEvents="none">
            <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + innerH} stroke={C.inkSoft} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            <circle cx={x(hover)} cy={y(clean[hover].val)} r="5" fill={color} stroke={C.paper} strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover != null && (
        <div style={{ position: 'absolute', top: 6, left: (x(hover) / W) * 100 > 50 ? 'auto' : `${Math.max(6, (x(hover) / W) * 100 - 8)}%`, right: (x(hover) / W) * 100 > 50 ? `${100 - Math.min(94, (x(hover) / W) * 100 + 8)}%` : 'auto', background: '#000', border: `1px solid ${color}`, borderRadius: 6, padding: '6px 10px', fontSize: 11.5, color: '#fff', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.inkSoft, marginBottom: 2 }}>{clean[hover].year}</div>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>{fmtY(clean[hover].val)}{unit === 'pct' ? '%' : ''}</div>
        </div>
      )}
    </div>
  );
}

function MiniCard({ title, children, note }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: C.ink }}>{title}</div>
        {note && <div style={{ fontSize: 10.5, color: C.inkFaint }}>{note}</div>}
      </div>
      {children}
    </div>
  );
}

// period-columns table (capital structure / working capital)
function PeriodTable({ periods, rows }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
      <thead><tr>
        <th />
        {periods.map((p, i) => <th key={i} style={{ textAlign: 'right', padding: '0 0 8px 12px', fontSize: 11, color: C.inkSoft, fontWeight: 600 }}>{p}</th>)}
      </tr></thead>
      <tbody>{rows.map((r, ri) => (
        <tr key={ri}>
          <td style={{ padding: '7px 12px 7px 0', color: r.bold ? C.ink : C.inkSoft, fontWeight: r.bold ? 600 : 400, borderTop: ri ? `1px solid ${C.lineSoft}` : 'none', paddingLeft: r.indent ? 14 : 0 }}>{r.label}</td>
          {r.v.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '7px 0 7px 12px', fontFamily: 'var(--mono)', fontSize: 12, color: v == null ? C.inkFaint : (isNeg(v) ? C.clay : (r.bold ? C.ink : C.inkSoft)), borderTop: ri ? `1px solid ${C.lineSoft}` : 'none', fontWeight: r.bold ? 500 : 400 }}>{v == null ? '–' : Math.round(v).toLocaleString('en-US')}</td>)}
        </tr>
      ))}</tbody>
    </table>
  );
}

export default function FinancialDeep({ data }) {
  const seriesOpts = [
    { key: 'Total Equity', label: 'Собственный капитал' },
    { key: 'Sales / Revenue', label: 'Выручка' },
    { key: 'Net Income, GAAP', label: 'Чистая прибыль' },
    { key: 'Book Value per Share', label: 'Book value / акция' },
  ].filter((o) => data.rows.some((r) => r.label === o.key));
  const [chartKey, setChartKey] = useState((seriesOpts[0] || {}).key);
  const chartRowObj = data.rows.find((r) => r.label === chartKey);
  const chartPts = chartRowObj ? data.years.map((yr, i) => ({ year: yr, val: chartRowObj.v[i] })).filter((p) => p.year !== 'TTM') : [];

  const q = data.quote || {};

  return (
    <div>
      {/* ── Quote + returns + chart ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 20, marginBottom: 26 }}>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 30, fontWeight: 500, color: C.ink }}>{q.price}</span>
            <span style={{ fontSize: 12, color: C.inkSoft }}>{q.currency}</span>
            {q.change != null && <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: isNeg(q.change) ? C.clay : C.teal }}>{q.change > 0 ? '+' : ''}{q.change}</span>}
            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: C.inkFaint }}>{q.ticker} · {q.exchange} · MCap {q.marketCap}</span>
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 8 }}>
            {seriesOpts.map((o) => {
              const on = o.key === chartKey;
              return <button key={o.key} onClick={() => setChartKey(o.key)} style={{ fontSize: 11, fontWeight: on ? 600 : 400, padding: '4px 10px', borderRadius: 13, border: `1px solid ${on ? C.teal : C.line}`, background: on ? C.teal + '18' : 'transparent', color: on ? C.teal : C.inkSoft, cursor: 'pointer' }}>{o.label}</button>;
            })}
          </div>
          <MiniChart pts={chartPts} color={C.teal} unit={chartRowObj?.fmt} />
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 12 }}>Доходность vs S&P 500</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>
              <th style={{ textAlign: 'left', padding: '0 0 8px', fontSize: 10.5, color: C.inkFaint, fontWeight: 500 }}>Период</th>
              <th style={{ textAlign: 'right', padding: '0 0 8px', fontSize: 10.5, color: C.inkFaint, fontWeight: 500 }}>Акция</th>
              <th style={{ textAlign: 'right', padding: '0 0 8px', fontSize: 10.5, color: C.inkFaint, fontWeight: 500 }}>S&P 500</th>
            </tr></thead>
            <tbody>{data.returns.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: '9px 0', color: C.inkSoft, borderTop: `1px solid ${C.lineSoft}` }}>{r.period}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', color: r.stock >= r.sp500 ? C.teal : C.ink, borderTop: `1px solid ${C.lineSoft}`, fontWeight: 500 }}>{r.stock}%</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', color: C.inkSoft, borderTop: `1px solid ${C.lineSoft}` }}>{r.sp500}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* ── Multi-year financials table ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 10 }}>Финансовые показатели по годам <span style={{ color: C.inkFaint, textTransform: 'none', letterSpacing: 0 }}>· $млн, если не на акцию / %</span></div>
        <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 10 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1000 }}>
            <thead><tr>
              <th style={{ position: 'sticky', left: 0, zIndex: 1, background: C.cardAlt, textAlign: 'left', padding: '10px 14px', fontSize: 10.5, color: C.inkSoft, fontWeight: 600, borderBottom: `1px solid ${C.line}` }}>Показатель</th>
              {data.years.map((yr, i) => <th key={i} style={{ textAlign: 'right', padding: '10px 12px', fontSize: 10.5, color: yr === 'TTM' ? C.teal : C.inkSoft, fontWeight: 600, borderBottom: `1px solid ${C.line}`, whiteSpace: 'nowrap', background: C.cardAlt }}>{yr}</th>)}
            </tr></thead>
            <tbody>{data.rows.map((r, ri) => (
              <tr key={ri} style={{ background: ri % 2 ? C.card : 'transparent' }}>
                <td style={{ position: 'sticky', left: 0, zIndex: 1, background: ri % 2 ? C.card : C.paper, padding: '8px 14px', fontSize: 12, color: C.ink, whiteSpace: 'nowrap', borderRight: `1px solid ${C.lineSoft}` }}>{r.label}</td>
                {r.v.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: 11.5, whiteSpace: 'nowrap', color: v == null ? C.inkFaint : (isNeg(v) ? C.clay : (data.years[i] === 'TTM' ? C.ink : C.inkSoft)) }}>{fmtNum(v, r.fmt)}</td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* ── Description + Capital structure ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginBottom: 18 }}>
        {data.description && (
          <MiniCard title="О компании">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
              {[['CEO', data.description.ceo], ['Сотрудников', data.description.employees], ['Сектор', data.description.sector], ['Индустрия', data.description.industry], ['IPO', data.description.ipo], ['Сайт', data.description.website], ['Адрес', data.description.address], ['CIK', data.description.cik]].map(([k, v], i) => (
                <div key={i}>
                  <div style={{ fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.4 }}>{v}</div>
                </div>
              ))}
            </div>
            {data.description.peers && data.description.peers.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
                <div style={{ fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 7 }}>Похожие компании</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {data.description.peers.map((p, i) => <span key={i} style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 14, border: `1px solid ${C.line}`, color: C.inkSoft }}>{p}</span>)}
                </div>
              </div>
            )}
          </MiniCard>
        )}
        {data.capitalStructure && (
          <MiniCard title="Структура капитала" note="$млн">
            <PeriodTable periods={data.capitalStructure.periods} rows={data.capitalStructure.rows} />
          </MiniCard>
        )}
      </div>

      {/* ── Working capital + Growth rates ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginBottom: 18 }}>
        {data.workingCapital && (
          <MiniCard title="Оборотный капитал" note="$млн">
            <PeriodTable periods={data.workingCapital.periods} rows={data.workingCapital.groups.flatMap((g) => [
              { label: g.label, v: g.total, bold: true },
              ...g.items.map((it) => ({ label: it.label, v: it.v, indent: true })),
            ])} />
          </MiniCard>
        )}
        {data.growthRates && (
          <MiniCard title="Темпы роста" note="ср. рост в год">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead><tr>
                <th />
                {data.growthRates.cols.map((c, i) => <th key={i} style={{ textAlign: 'right', padding: '0 0 8px 12px', fontSize: 11, color: C.inkSoft, fontWeight: 600 }}>{c}</th>)}
              </tr></thead>
              <tbody>{data.growthRates.rows.map((r, ri) => (
                <tr key={ri}>
                  <td style={{ padding: '8px 12px 8px 0', color: C.inkSoft, borderTop: ri ? `1px solid ${C.lineSoft}` : 'none' }}>{r.label}</td>
                  {r.v.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '8px 0 8px 12px', fontFamily: 'var(--mono)', fontSize: 12, color: isNeg(v) ? C.clay : C.ink, borderTop: ri ? `1px solid ${C.lineSoft}` : 'none' }}>{v}%</td>)}
                </tr>
              ))}</tbody>
            </table>
          </MiniCard>
        )}
      </div>

      {/* ── Quarterly revenue ── */}
      {data.quarterlyRevenue && (
        <MiniCard title="Выручка по кварталам" note="$млн">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead><tr>
              {['Год', 'Q1', 'Q2', 'Q3', 'Q4', 'FY'].map((h, i) => <th key={i} style={{ textAlign: i ? 'right' : 'left', padding: '0 0 8px', fontSize: 10.5, color: C.inkFaint, fontWeight: 500 }}>{h}</th>)}
            </tr></thead>
            <tbody>{data.quarterlyRevenue.years.map((yr, ri) => (
              <tr key={ri}>
                <td style={{ padding: '8px 0', color: C.ink, fontWeight: 500, borderTop: `1px solid ${C.lineSoft}` }}>{yr.year}</td>
                {yr.q.map((v, i) => <td key={i} style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: v == null ? C.inkFaint : C.inkSoft, borderTop: `1px solid ${C.lineSoft}` }}>{v == null ? '–' : v.toLocaleString('en-US')}</td>)}
                <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: C.ink, fontWeight: 500, borderTop: `1px solid ${C.lineSoft}` }}>{yr.fy == null ? '–' : yr.fy.toLocaleString('en-US')}</td>
              </tr>
            ))}</tbody>
          </table>
        </MiniCard>
      )}

      {data.note && <div style={{ marginTop: 16, fontSize: 11, color: C.inkFaint, fontStyle: 'italic', lineHeight: 1.5 }}>{data.note}</div>}
    </div>
  );
}
