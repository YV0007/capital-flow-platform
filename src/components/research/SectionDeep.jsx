// SectionDeep — block-based structured renderer for deep section views.
// Replaces markdown walls with Bloomberg-density primitives: stat rows,
// column tables, card grids, labeled bars, risk heat rows, timelines,
// quotes and dense fact lists. A section's data is an array of typed
// blocks (sections[].deep in the company JSON). Dark mode only.

import holdingsData from '../../data/holdings.json';

const C = holdingsData.THEMES.dark;
const col = (name) => C[name] || name || C.teal;
const isNeg = (s) => typeof s === 'string' && /^[−-]/.test(s.trim());

function Title({ children, note }) {
  if (!children) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500, color: C.ink, letterSpacing: '-.01em' }}>{children}</div>
      {note && <div style={{ fontSize: 11, color: C.inkFaint }}>{note}</div>}
    </div>
  );
}

// ── stats: row of big figures with deltas ───────────────────────────────────
function Stats({ b }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 1, background: C.line, border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
      {b.items.map((s, i) => (
        <div key={i} style={{ background: C.card, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 6, lineHeight: 1.3 }}>{s.label}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 21, fontWeight: 500, color: C.ink, lineHeight: 1.05 }}>{s.value}</div>
          {s.delta && <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: isNeg(s.delta) ? C.clay : C.teal, marginTop: 4 }}>{s.delta}</div>}
          {s.note && <div style={{ fontSize: 10.5, color: C.inkFaint, marginTop: 4, lineHeight: 1.4 }}>{s.note}</div>}
        </div>
      ))}
    </div>
  );
}

// ── table: column-headed data table ─────────────────────────────────────────
function DataTable({ b }) {
  const alignFor = (ci) => (b.align && b.align[ci]) || (ci === 0 ? 'left' : 'right');
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 10 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead><tr>
            {b.headers.map((h, i) => (
              <th key={i} style={{ textAlign: alignFor(i), padding: '9px 14px', fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: C.inkSoft, fontWeight: 600, borderBottom: `1px solid ${C.line}`, background: C.cardAlt, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {b.rows.map((r, ri) => (
              <tr key={ri} style={{ background: ri % 2 ? C.card : 'transparent' }}>
                {r.map((cell, ci) => (
                  <td key={ci} style={{ textAlign: alignFor(ci), padding: '9px 14px', fontSize: ci === 0 ? 12.5 : 12, fontFamily: ci === 0 ? 'var(--sans)' : 'var(--mono)', color: isNeg(cell) ? C.clay : (ci === 0 ? C.ink : C.inkSoft), lineHeight: 1.45, verticalAlign: 'top' }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {b.foot && <div style={{ fontSize: 10.5, color: C.inkFaint, marginTop: 8, fontStyle: 'italic' }}>{b.foot}</div>}
    </div>
  );
}

// ── cards: grid of titled cards ─────────────────────────────────────────────
function Cards({ b }) {
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${b.min || 250}px, 1fr))`, gap: 12 }}>
        {b.items.map((c, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `3px solid ${col(c.color)}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: c.value || c.desc ? 6 : 0 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, flex: 1 }}>{c.title}</span>
              {c.badge && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: col(c.color) + '22', color: col(c.color), border: `1px solid ${col(c.color)}55`, fontWeight: 600, letterSpacing: '.06em' }}>{c.badge}</span>}
            </div>
            {c.value && <div style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 500, color: col(c.color), marginBottom: c.desc ? 6 : 0 }}>{c.value}</div>}
            {c.desc && <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55 }}>{c.desc}</div>}
            {c.foot && <div style={{ fontSize: 10.5, color: C.inkFaint, marginTop: 8, fontStyle: 'italic' }}>{c.foot}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── bars: labeled horizontal bars ───────────────────────────────────────────
function Bars({ b }) {
  const max = Math.max(...b.items.map((x) => x.pct || 0), 1);
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 16px' }}>
        {b.items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < b.items.length - 1 ? 11 : 0 }}>
            <div style={{ width: 190, flexShrink: 0 }}>
              <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.3 }}>{it.label}</div>
              {it.note && <div style={{ fontSize: 10.5, color: C.inkFaint }}>{it.note}</div>}
            </div>
            <div style={{ flex: 1, height: 15, background: C.track, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${((it.pct || 0) / max) * 100}%`, height: '100%', background: col(it.color), borderRadius: 3 }} />
            </div>
            <div style={{ width: 96, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12.5, color: C.ink }}>{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── heat: risk rows with level chip + trigger ───────────────────────────────
const LEVELS = {
  high: { label: 'ВЫСОКИЙ', color: C.clay },
  med: { label: 'СРЕДНИЙ', color: C.gold },
  low: { label: 'НИЗКИЙ', color: C.teal },
};
function Heat({ b }) {
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
        {b.items.map((r, i) => {
          const lv = LEVELS[r.level] || LEVELS.med;
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 14, padding: '13px 16px', borderTop: i ? `1px solid ${C.lineSoft}` : 'none', background: i % 2 ? C.card : 'transparent' }}>
              <div><span style={{ fontSize: 9.5, padding: '3px 8px', borderRadius: 10, background: lv.color + '22', color: lv.color, border: `1px solid ${lv.color}55`, fontWeight: 600, letterSpacing: '.06em' }}>{lv.label}</span></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 3 }}>{r.label}</div>
                {r.desc && <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55, marginBottom: r.trigger ? 5 : 0 }}>{r.desc}</div>}
                {r.trigger && <div style={{ fontSize: 12, lineHeight: 1.5 }}><span style={{ color: C.gold, fontWeight: 600 }}>Триггер: </span><span style={{ color: C.inkSoft }}>{r.trigger}</span></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── timeline: dated rows ────────────────────────────────────────────────────
function Timeline({ b }) {
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
        {b.items.map((ev, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '104px 1fr', gap: 14, padding: '12px 16px', borderTop: i ? `1px solid ${C.lineSoft}` : 'none', background: i % 2 ? C.card : 'transparent' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: C.ink }}>{ev.date}</div>
              {ev.badge && <div style={{ marginTop: 4, fontSize: 9, padding: '2px 7px', borderRadius: 10, background: col(ev.color) + '22', color: col(ev.color), border: `1px solid ${col(ev.color)}55`, fontWeight: 600, letterSpacing: '.05em', display: 'inline-block' }}>{ev.badge}</div>}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, lineHeight: 1.35, marginBottom: ev.desc ? 3 : 0 }}>{ev.title}</div>
              {ev.desc && <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55 }}>{ev.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── quote ───────────────────────────────────────────────────────────────────
function Quote({ b }) {
  return (
    <blockquote style={{ borderLeft: `3px solid ${C.teal}`, margin: 0, padding: '6px 0 6px 18px' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic', lineHeight: 1.5, color: C.ink }}>“{b.text}”</div>
      {b.who && <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 6 }}>— {b.who}</div>}
    </blockquote>
  );
}

// ── facts: dense k/v list ───────────────────────────────────────────────────
function Facts({ b }) {
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '6px 16px' }}>
        {b.items.map((f, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 38%) 1fr', gap: 14, padding: '9px 0', borderTop: i ? `1px solid ${C.lineSoft}` : 'none' }}>
            <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.5 }}>{f.k}</div>
            <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>{f.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── text: short paragraph (use sparingly) ───────────────────────────────────
function Text({ b }) {
  return (
    <div>
      <Title>{b.title}</Title>
      <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.65, margin: 0, maxWidth: 760 }}>{b.body}</p>
    </div>
  );
}

// ── radar geometry helper ───────────────────────────────────────────────────
function radarPoints(scores, max, cx, cy, R) {
  const n = scores.length;
  return scores.map((s, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const r = (Math.max(0, Math.min(s, max)) / max) * R;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

function RadarSvg({ scores, labels, max, size, fill, showLabels }) {
  const cx = size / 2, cy = size / 2;
  const R = size / 2 - (showLabels ? 34 : 10);
  const rings = [0.25, 0.5, 0.75, 1];
  const pts = radarPoints(scores, max, cx, cy, R);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
  const axisPt = (i, r) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / scores.length;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size, height: 'auto', display: 'block', overflow: 'visible', margin: '0 auto' }}>
      {rings.map((f, i) => (
        <polygon key={i} points={scores.map((_, j) => axisPt(j, R * f).join(',')).join(' ')} fill={i === rings.length - 1 ? C.cardAlt : 'none'} stroke={C.line} strokeWidth="1" style={{ fillOpacity: 0.4 }} />
      )).reverse()}
      {scores.map((_, i) => { const [x, y] = axisPt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.line} strokeWidth="1" />; })}
      <path d={path} fill={fill} fillOpacity="0.3" stroke={fill} strokeWidth="1.8" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={fill} />)}
      {showLabels && labels.map((l, i) => {
        const [x, y] = axisPt(i, R + 18);
        return <text key={i} x={x} y={y + 3} textAnchor="middle" fill={C.inkSoft} fontSize="9.5" fontFamily="var(--sans)" letterSpacing=".08em">{l.toUpperCase()}</text>;
      })}
    </svg>
  );
}

// ── radar: single risk/score profile with per-axis legend ───────────────────
function Radar({ b }) {
  const max = b.max || 5;
  const scoreCol = (s) => (s >= max * 0.7 ? C.clay : s >= max * 0.5 ? C.gold : C.teal);
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 340px) 1fr', gap: 24, alignItems: 'center', background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '18px 20px' }}>
        <RadarSvg scores={b.items.map((x) => x.score)} labels={b.items.map((x) => x.short || x.axis)} max={max} size={320} fill={col(b.color || 'clay')} showLabels />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {b.items.map((x, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12, alignItems: 'baseline', paddingBottom: 8, borderBottom: i < b.items.length - 1 ? `1px solid ${C.lineSoft}` : 'none' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, color: scoreCol(x.score) }}>{x.score}/{max}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink }}>{x.axis}</span>
                {x.hint && <span style={{ display: 'block', fontSize: 11.5, color: C.inkSoft, lineHeight: 1.5, marginTop: 2 }}>{x.hint}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── snowflakes: small-multiple 5-axis radars for peer comparison ────────────
function Snowflakes({ b }) {
  const axes = b.axes || [];
  const max = b.max || 6;
  const totCol = (t) => { const f = t / (axes.length * max); return f >= 0.6 ? C.teal : f >= 0.4 ? C.gold : C.clay; };
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        {b.items.map((it, i) => {
          const scores = axes.map((a) => it.scores[a.key] ?? 0);
          const tot = scores.reduce((s, x) => s + x, 0);
          const c = totCol(tot);
          return (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 14px', textAlign: 'center' }}>
              <RadarSvg scores={scores} labels={axes.map((a) => a.label)} max={max} size={190} fill={c} showLabels />
              <div style={{ fontFamily: 'var(--serif)', fontSize: 15.5, fontWeight: 500, color: C.ink, marginTop: 8, lineHeight: 1.25 }}>{it.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.inkSoft, marginTop: 3 }}>{it.ticker}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.ink, marginTop: 2 }}>{it.mcap}</div>
              {it.note && <div style={{ fontSize: 10.5, color: C.inkFaint, marginTop: 5, lineHeight: 1.4 }}>{it.note}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── matrix: likelihood × impact grid (ISO 31000-style) ──────────────────────
function Matrix({ b }) {
  const X = b.x || ['Низкая', 'Средняя', 'Высокая'];   // вероятность →
  const Y = b.y || ['Высокое', 'Среднее', 'Низкое'];   // влияние ↓ (top = high)
  const sevCol = (px, iy) => { const s = px + (Y.length - 1 - iy); return s >= 3 ? C.clay : s === 2 ? C.gold : C.teal; };
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 18px', overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `86px repeat(${X.length}, 1fr)`, gap: 6, minWidth: 560 }}>
          <div />
          {X.map((x, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkSoft, padding: '4px 0' }}>{x}</div>)}
          {Y.map((y, iy) => (
            [<div key={`y${iy}`} style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkSoft, display: 'flex', alignItems: 'center' }}>{y}</div>,
              ...X.map((_, ix) => {
                const cell = (b.items || []).filter((it) => it.px === ix && it.py === (Y.length - 1 - iy));
                const cc = sevCol(ix, iy);
                return (
                  <div key={`c${iy}-${ix}`} style={{ minHeight: 74, borderRadius: 8, background: cc + '14', border: `1px solid ${cc}33`, padding: 7, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {cell.map((it, k) => (
                      <div key={k} title={it.hint || ''} style={{ fontSize: 11, lineHeight: 1.35, color: C.ink, background: C.paper + 'AA', border: `1px solid ${cc}55`, borderLeft: `3px solid ${cc}`, borderRadius: 6, padding: '5px 8px' }}>{it.label}</div>
                    ))}
                  </div>
                );
              })]
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10.5, color: C.inkFaint }}>
          <span>← влияние по вертикали (выше = больнее для тезиса)</span>
          <span>вероятность по горизонтали →</span>
        </div>
      </div>
    </div>
  );
}

const RENDER = { stats: Stats, table: DataTable, cards: Cards, bars: Bars, heat: Heat, timeline: Timeline, quote: Quote, facts: Facts, text: Text, radar: Radar, snowflakes: Snowflakes, matrix: Matrix };

export default function SectionDeep({ blocks }) {
  if (!blocks || !blocks.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      {blocks.map((b, i) => {
        const Cmp = RENDER[b.type];
        return Cmp ? <Cmp key={i} b={b} /> : null;
      })}
    </div>
  );
}
