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

const RENDER = { stats: Stats, table: DataTable, cards: Cards, bars: Bars, heat: Heat, timeline: Timeline, quote: Quote, facts: Facts, text: Text };

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
