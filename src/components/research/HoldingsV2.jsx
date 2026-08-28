// HoldingsV2 — rebuilt Holdings dashboard (Phase 2).
//
// Two-level IA: L0 preview cards (decision-grade, scannable) grouped by tier,
// each opening into an L2 deep view (the verified research dossier section,
// rendered as styled markdown) via the in-place takeover pattern.
//
// Data: src/data/holdings-v2/<id>.json — produced from the research dossiers
// in research/<slug>.md. Loaded eagerly via import.meta.glob so new company
// files appear automatically as they are migrated.
//
// Dark mode only. Reuses theme tokens + META from holdings.json.

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import holdingsData from '../../data/holdings.json';
import PortfolioDeep from './PortfolioDeep.jsx';
import FinancialDeep from './FinancialDeep.jsx';
import ChangesDeep from './ChangesDeep.jsx';
import SectionDeep from './SectionDeep.jsx';

const { META, GROUPS, HOLDING_COMPANIES_ORDER, companies: HOLD } = holdingsData;
// Theme-reactive palette (CSS vars) — switches with the app-wide toggle.
import { C } from './holdingsC.js';
import { useT } from '../../lib/i18n.jsx';

// ── load migrated v2 dossiers ──────────────────────────────────────────────
const modules = import.meta.glob('../../data/holdings-v2/*.json', { eager: true });
const V2 = {};
for (const p in modules) { const d = modules[p].default || modules[p]; if (d && d.id) V2[d.id] = d; }

// ── load deep portfolio breakdowns (section 01 bespoke component) ───────────
const portModules = import.meta.glob('../../data/holdings-v2/portfolio/*.json', { eager: true });
const PORT = {};
for (const p in portModules) { const d = portModules[p].default || portModules[p]; if (d && d.id) PORT[d.id] = d; }

// ── load deep financial pages (section 08 bespoke component) ────────────────
const finModules = import.meta.glob('../../data/holdings-v2/financial/*.json', { eager: true });
const FIN = {};
for (const p in finModules) { const d = finModules[p].default || finModules[p]; if (d && d.id) FIN[d.id] = d; }

// A function of `t`, not a frozen const: t() at module scope runs at import
// time, before any component can supply it, and the ReferenceError takes the
// whole bundle down — a blank page, not a missing label.
// The COLOUR of a tier is not language-bound, so it does not travel through
// the translator. It used to: `tierColor(t)` looked like it took the same `t`
// as `tiers(t)` and was called as `tierColor(sec.tier)` — which handed the
// string 'substance' into the translator slot and called it as a function.
// Every section tab on every holding was a black screen. Keeping the colours
// in their own table makes the mistake unstateable.
const TIER_COLOR = {
  substance: C.teal,
  context: C.blue,
  voice: C.gold,
  signals: C.violet,
};
const tiers = (t) => ([
  { id: 'substance', label: t('Факты', 'Facts'), color: TIER_COLOR.substance },
  { id: 'context', label: t('Проверки и риски', 'Checks and risks'), color: TIER_COLOR.context },
  { id: 'voice', label: t('Что говорит менеджмент', 'What management says'), color: TIER_COLOR.voice },
  { id: 'signals', label: t('Выводы и наблюдение', 'Conclusions and watch'), color: TIER_COLOR.signals },
]);
const tierColor = (tierId) => TIER_COLOR[tierId] || C.teal;

// ═══════════════════════════════════════════════════════════════════════════
//  Lightweight markdown renderer (headers, bold, code, links, lists, tables,
//  blockquotes, hr, paragraphs). No external dependency.
// ═══════════════════════════════════════════════════════════════════════════

function inline(text) {
  const out = [];
  const re = /\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] != null) out.push(<strong key={k++} style={{ fontWeight: 600, color: C.ink }}>{m[1]}</strong>);
    else if (m[2] != null) out.push(<code key={k++} style={{ fontFamily: 'var(--mono)', fontSize: '.9em', background: C.track, padding: '1px 5px', borderRadius: 4, color: C.ink }}>{m[2]}</code>);
    else if (m[3] != null) out.push(<a key={k++} href={m[4]} target="_blank" rel="noreferrer" style={{ color: C.teal, textDecoration: 'none', borderBottom: `1px solid color-mix(in srgb, ${C.teal} 27%, transparent)` }}>{m[3]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function parseBlocks(md) {
  const lines = (md || '').replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;
  const isList = (l) => /^\s*([-*]|\d+\.)\s+/.test(l);
  const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = /^(#{1,6})\s+(.*)/.exec(line);
    if (h) { blocks.push({ t: 'h', level: h[1].length, text: h[2] }); i++; continue; }
    if (/^(\s*([-*_])\s*){3,}$/.test(line)) { blocks.push({ t: 'hr' }); i++; continue; }
    if (/^>\s?/.test(line)) { const q = []; while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, '')); i++; } blocks.push({ t: 'quote', text: q.join(' ') }); continue; }
    if (isTableRow(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const rows = []; while (i < lines.length && isTableRow(lines[i])) { rows.push(lines[i]); i++; }
      blocks.push({ t: 'table', rows }); continue;
    }
    if (isList(line)) { const items = []; while (i < lines.length && isList(lines[i])) { items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, '')); i++; } blocks.push({ t: 'list', items }); continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^#{1,6}\s/.test(lines[i]) && !/^>\s?/.test(lines[i]) && !isTableRow(lines[i]) && !isList(lines[i])) { para.push(lines[i]); i++; }
    blocks.push({ t: 'p', text: para.join(' ') });
  }
  return blocks;
}

function Table({ rows }) {
  const cells = (r) => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  return (
    <div style={{ overflowX: 'auto', margin: '14px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12.5 }}>
        <thead><tr>{head.map((h, i) => (
          <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '8px 12px', borderBottom: `1px solid ${C.line}`, color: C.inkSoft, fontWeight: 600, fontSize: 11, letterSpacing: '.03em', whiteSpace: 'nowrap' }}>{inline(h)}</th>
        ))}</tr></thead>
        <tbody>{body.map((r, ri) => (
          <tr key={ri}>{r.map((cv, ci) => (
            <td key={ci} style={{ textAlign: ci === 0 ? 'left' : 'right', padding: '8px 12px', borderBottom: `1px solid ${C.lineSoft}`, color: ci === 0 ? C.ink : C.inkSoft, fontFamily: ci === 0 ? 'var(--sans)' : 'var(--mono)', fontSize: ci === 0 ? 12.5 : 12, verticalAlign: 'top' }}>{inline(cv)}</td>
          ))}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function Md({ md }) {
  const blocks = parseBlocks(md);
  return (
    <div>
      {blocks.map((b, i) => {
        if (b.t === 'h') {
          const sz = b.level <= 2 ? 21 : b.level === 3 ? 17 : 14.5;
          return <div key={i} style={{ fontFamily: 'var(--serif)', fontSize: sz, fontWeight: 500, color: C.ink, margin: '22px 0 8px', letterSpacing: '-.01em' }}>{inline(b.text)}</div>;
        }
        if (b.t === 'hr') return <div key={i} style={{ height: 1, background: C.line, margin: '20px 0' }} />;
        if (b.t === 'quote') return <blockquote key={i} style={{ borderLeft: `3px solid ${C.teal}`, margin: '14px 0', padding: '4px 0 4px 16px', fontStyle: 'italic', color: C.inkSoft, fontSize: 14, lineHeight: 1.6 }}>{inline(b.text)}</blockquote>;
        if (b.t === 'table') return <Table key={i} rows={b.rows} />;
        if (b.t === 'list') return (
          <ul key={i} style={{ margin: '8px 0', paddingLeft: 20 }}>
            {b.items.map((it, j) => <li key={j} style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.65, marginBottom: 4 }}>{inline(it)}</li>)}
          </ul>
        );
        return <p key={i} style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.7, margin: '10px 0' }}>{inline(b.text)}</p>;
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  L0 preview card
// ═══════════════════════════════════════════════════════════════════════════

function PreviewCard({ sec, onOpen }) {
  const t = useT();
  const col = tierColor(sec.tier);
  const pv = sec.preview || {};
  return (
    <section style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `3px solid ${col}`, borderRadius: 10, padding: '18px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: col, fontWeight: 500 }}>{sec.n}</span>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 21, fontWeight: 500, color: C.ink, margin: 0, letterSpacing: '-.01em' }}>{sec.title}</h3>
        {sec.sub && <span style={{ fontSize: 12.5, color: C.inkFaint, fontStyle: 'italic' }}>— {sec.sub}</span>}
        {sec.hasDeep && (
          <button onClick={onOpen} style={{ marginLeft: 'auto', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: col, fontSize: 13, fontFamily: 'var(--sans)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            {t('Раскрыть полностью', 'Show in full')} <span>→</span>
          </button>
        )}
      </div>

      {pv.line && <p style={{ fontFamily: 'var(--serif)', fontSize: 15.5, lineHeight: 1.5, color: C.ink, margin: '0 0 14px', maxWidth: 680 }}>{pv.line}</p>}

      {pv.stats && pv.stats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 1, background: C.line, border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', marginBottom: pv.bullets && pv.bullets.length ? 16 : 0 }}>
          {pv.stats.map((st, i) => (
            <div key={i} style={{ background: C.card, padding: '15px 16px' }}>
              <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 7, lineHeight: 1.3 }}>{st.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 23, fontWeight: 500, color: C.ink, lineHeight: 1 }}>{st.value}</div>
              {st.sub && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 6, lineHeight: 1.4 }}>{st.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {pv.bullets && pv.bullets.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {pv.bullets.map((b, i) => <li key={i} style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6, marginBottom: 3 }}>{b}</li>)}
        </ul>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Overview block — hero stats + preview charts on the profile landing
// ═══════════════════════════════════════════════════════════════════════════

function StackedBar({ items }) {
  const total = items.reduce((s, x) => s + (x.pct || 0), 0) || 100;
  return (
    <div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: C.track, marginBottom: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ width: `${(it.pct / total) * 100}%`, background: C[it.color] || C.teal, borderRight: i < items.length - 1 ? `1px solid ${C.paper}` : 'none' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: C[it.color] || C.teal, flexShrink: 0 }} />
            <span style={{ flex: 1, color: C.inkSoft }}>{it.name}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.ink, fontWeight: 500 }}>{it.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ points, periods, color, h = 60, interactive }) {
  const W = 320, H = h;
  const PAD_L = interactive ? 32 : 0, PAD_R = interactive ? 4 : 0;
  const plotW = W - PAD_L - PAD_R;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const x = (i) => PAD_L + (i * plotW) / (points.length - 1);
  const y = (v) => 4 + ((max - v) / range) * (H - 8);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)} ${H} L${PAD_L} ${H} Z`;
  const [hover, setHover] = useState(null);

  const ticks = interactive ? (() => {
    const step = Math.ceil(range / 4);
    const lo = Math.floor(min / step) * step;
    const arr = [];
    for (let v = lo; v <= max + step; v += step) if (v >= min && v <= max + step * 0.3) arr.push(v);
    if (arr.length < 2) arr.push(lo + step);
    return arr;
  })() : [];

  const handleMove = interactive ? (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((px - PAD_L) / plotW) * (points.length - 1));
    if (idx >= 0 && idx < points.length) setHover(idx);
  } : undefined;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ width: '100%', height: h, display: 'block', cursor: interactive ? 'crosshair' : 'default' }}
        onMouseMove={handleMove} onMouseLeave={interactive ? () => setHover(null) : undefined}
      >
        {interactive && ticks.map(v => (
          <g key={v}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(v)} y2={y(v)} stroke={C.line} strokeWidth="0.5" strokeDasharray="3,3" />
            <text x={PAD_L - 4} y={y(v) + 3} textAnchor="end" fill={C.inkFaint} fontSize="8" fontFamily="var(--mono)">${v}</text>
          </g>
        ))}
        <path d={area} fill={`color-mix(in srgb, ${color} 13%, transparent)`} />
        <path d={line} fill="none" stroke={color} strokeWidth="1.8" />
        <circle cx={x(points.length - 1)} cy={y(points[points.length - 1])} r="3" fill={color} />
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} stroke={C.inkSoft} strokeWidth="0.8" strokeDasharray="2,2" />
            <circle cx={x(hover)} cy={y(points[hover])} r="4" fill={color} stroke={C.card} strokeWidth="2" />
            <rect x={x(hover) - 22} y={y(points[hover]) - 18} width="44" height="16" rx="4" fill={C.card} stroke={C.line} strokeWidth="0.5" />
            <text x={x(hover)} y={y(points[hover]) - 7} textAnchor="middle" fill={C.ink} fontSize="9" fontFamily="var(--mono)">${points[hover]}</text>
          </g>
        )}
      </svg>
      {periods && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 10, color: C.inkFaint, marginTop: 4, paddingLeft: interactive ? '10%' : 0 }}>
          <span>{periods[0]}</span><span>{periods[periods.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

function OverviewBlock({ overview }) {
  const { hero, previews } = overview;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '22px 24px', marginTop: 4 }}>
      {/* Hero — 2 крупные цифры */}
      {hero && hero.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${hero.length},1fr)`, gap: 24, paddingBottom: 22, marginBottom: 22, borderBottom: `1px solid ${C.line}` }}>
          {hero.map((h, i) => (
            <div key={i}>
              <div style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 8 }}>{h.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 38, fontWeight: 500, lineHeight: 1, color: C.ink, marginBottom: 8 }}>{h.value}</div>
              {h.sub && <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>{h.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Preview mini-charts */}
      {previews && previews.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))`, gap: 22 }}>
          {previews.map((p, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: C.ink }}>{p.label}</div>
                {p.headline && <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.teal }}>{p.headline}</div>}
              </div>
              {p.kind === 'bar' && <StackedBar items={p.items} />}
              {p.kind === 'spark' && <Sparkline points={p.points} periods={p.periods} color={C.teal} />}
              {p.hint && <div style={{ fontSize: 10.5, color: C.inkFaint, marginTop: 10, fontStyle: 'italic' }}>{p.hint}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Top bets — 5 flagship names, one per pillar. The memorability anchor:
//  after the dashboard, "Brookfield = these five names" should stick.
// ═══════════════════════════════════════════════════════════════════════════

function TopBets({ data }) {
  const t = useT();
  const items = data.items || [];
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.inkFaint }}>{t('Флагманские ставки · 5 имён', 'Flagship bets · 5 names')}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        {items.map((b, i) => {
          const c = C[b.color] || C.teal;
          return (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderTop: `3px solid ${c}`, borderRadius: 10, padding: '15px 16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 9, letterSpacing: '.09em', textTransform: 'uppercase', color: c, fontWeight: 700, marginBottom: 9 }}>{b.sector}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 21, fontWeight: 500, color: C.ink, lineHeight: 1.12, marginBottom: 6, letterSpacing: '-.01em' }}>{b.name}</div>
              {b.role && <div style={{ fontSize: 12, color: C.ink, fontWeight: 500, marginBottom: 8 }}>{b.role}</div>}
              {b.fact && <div style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.5, marginBottom: 12 }}>{b.fact}</div>}
              {b.embodies && (
                <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                  <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, letterSpacing: '.03em', color: c, background: `color-mix(in srgb, ${c} 9%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 27%, transparent)`, borderRadius: 6, padding: '3px 9px' }}>{b.embodies}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Recent moves — compact table, each row expands to a brief strategic read
// ═══════════════════════════════════════════════════════════════════════════

function RecentMoves({ items }) {
  const t = useT();
  const [open, setOpen] = useState(null);
  return (
    <div style={{ marginBottom: 22, background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 10 }}>{t('Ключевые ходы', 'Key moves')} (12 мес) · клик — зачем это</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((m, i) => {
          const has = !!(m.detail || m.signal);
          const isOpen = open === i;
          return (
            <div key={i} style={{ borderTop: i ? `1px solid ${C.lineSoft}` : 'none' }}>
              <div onClick={() => has && setOpen(isOpen ? null : i)} style={{ display: 'grid', gridTemplateColumns: '68px auto 1fr 132px 14px', gap: 12, alignItems: 'baseline', padding: '9px 0', fontSize: 12.5, cursor: has ? 'pointer' : 'default' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.inkSoft }}>{m.date}</div>
                <div style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 10, background: C.line, color: C.inkSoft, letterSpacing: '.06em', fontWeight: 600, textAlign: 'center', justifySelf: 'start' }}>{m.type.toUpperCase()}</div>
                <div style={{ color: C.ink, display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>{m.title}</span>
                  {m.ai && <span style={{ fontSize: 8.5, padding: '1px 6px', borderRadius: 8, background: `color-mix(in srgb, ${C.violet} 13%, transparent)`, color: C.violet, border: `1px solid color-mix(in srgb, ${C.violet} 33%, transparent)`, fontWeight: 600, letterSpacing: '.06em' }}>AI</span>}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.inkSoft, textAlign: 'right' }}>{m.value}</div>
                <div style={{ textAlign: 'right', color: C.inkFaint, fontSize: 11 }}>{has ? (isOpen ? '▾' : '▸') : ''}</div>
              </div>
              {isOpen && has && (
                <div style={{ padding: '2px 0 14px' }}>
                  <div style={{ background: C.cardAlt, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.teal}`, borderRadius: 8, padding: '12px 14px' }}>
                    {m.detail && <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.6, marginBottom: m.signal ? 10 : 0 }}>{m.detail}</div>}
                    {m.signal && (
                      <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55 }}>
                        <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: C.teal, fontWeight: 600, marginRight: 8 }}>{t('Стратегический смысл', 'Strategic meaning')}</span>
                        {m.signal}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  News block — recent news / insider moves / corporate events, 2-col grid
// ═══════════════════════════════════════════════════════════════════════════

// A function of `t`, not a frozen const: t() at module scope runs at import
// time, before any component can supply it, and the ReferenceError takes the
// whole bundle down — a blank page, not a missing label.
const newsMeta = (t) => ({
  news:         { label: t('Новость', 'News'),   glyph: '✦', color: C.teal },
  insider:      { label: t('Инсайдеры', 'Insiders'), glyph: '↓', color: C.clay },
  announcement: { label: t('Анонс', 'Announcement'),     glyph: '◎', color: C.blue },
  dividend:     { label: t('Дивиденд', 'Dividend'),  glyph: '$', color: C.gold },
});

function NewsBlock({ items }) {
  const t = useT();
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 12 }}>{t('Новости и события', 'News and events')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
        {items.map((n, i) => {
          const m = newsMeta(t)[n.type] || newsMeta(t).news;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', background: C.card, border: `1px solid ${C.line}`, borderRadius: 6, overflow: 'hidden', height: '100%' }}>
              {n.image && (
                <div style={{ height: 148, background: C.cardAlt, borderBottom: `1px solid ${C.line}`, overflow: 'hidden' }}>
                  <img src={n.image} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              )}
              <div style={{ padding: '13px 15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: m.color, background: `color-mix(in srgb, ${m.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${m.color} 27%, transparent)`, borderRadius: 3, padding: '2px 7px' }}>{m.label}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.inkFaint }}>{n.date}</span>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: C.ink, lineHeight: 1.32, marginBottom: 7 }}>{n.title}</div>
                <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55, marginBottom: n.url ? 12 : 0 }}>{n.text}</div>
                {n.url && (
                  <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 'auto', alignSelf: 'flex-start', fontSize: 11.5, color: m.color, fontWeight: 600, textDecoration: 'none' }}>{t('Читать', 'Read')} подробнее →</a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  L2 deep view (in-place takeover)
// ═══════════════════════════════════════════════════════════════════════════

function DeepView({ data, idx, setIdx, onBack, portfolio, financial, wide, onOpenCompany, focus }) {
  const t = useT();
  const secs = data.sections;
  const sec = secs[idx];
  const col = tierColor(sec.tier);
  const prev = idx > 0 ? secs[idx - 1] : null;
  const next = idx < secs.length - 1 ? secs[idx + 1] : null;
  useEffect(() => { window.scrollTo({ top: 0 }); }, [idx]);

  const navBtn = (s, dir) => s ? (
    <button onClick={() => setIdx(dir === 'prev' ? idx - 1 : idx + 1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: '8px 13px', cursor: 'pointer', color: C.inkSoft, fontFamily: 'var(--sans)', fontSize: 12.5, maxWidth: 260 }}>
      {dir === 'prev' && <span style={{ color: C.inkFaint }}>←</span>}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
      {dir === 'next' && <span style={{ color: C.inkFaint }}>→</span>}
    </button>
  ) : <span />;

  return (
    <main className="rise" style={{ padding: '36px 40px 80px', maxWidth: wide ? (['changes', 'financial'].includes(sec.id) ? 'none' : 1080) : 880, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: C.teal, fontSize: 13, fontFamily: 'var(--sans)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>← {data.name} · {t('профиль', 'profile')}</button>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: C.inkFaint }}>{idx + 1} / {secs.length}</span>
      </div>

      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: col }}>{sec.n} · {(tiers(t).find((x) => x.id === sec.tier) || {}).label}</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 500, lineHeight: 1.1, letterSpacing: '-.02em', margin: '0 0 6px', color: C.ink }}>{sec.title}</h1>
      {sec.sub && <p style={{ fontSize: 14, color: C.inkSoft, fontStyle: 'italic', margin: '0 0 22px' }}>{sec.sub}</p>}
      <div style={{ height: 1, background: C.line, margin: '0 0 22px' }} />

      {sec.id === 'portfolio' && portfolio ? <PortfolioDeep data={portfolio} focus={focus} />
        : sec.id === 'financial' && financial ? <FinancialDeep data={financial} />
        : sec.id === 'changes' && data.changesDeep ? <ChangesDeep data={data.changesDeep} />
        : sec.deep && sec.deep.length ? <SectionDeep blocks={sec.deep} onOpenCompany={onOpenCompany} />
        : <Md md={sec.bodyMarkdown} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.line}` }}>
        {navBtn(prev, 'prev')}
        {navBtn(next, 'next')}
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Holding-wide search — scans all text in the selected company
// ═══════════════════════════════════════════════════════════════════════════

function blockTexts(block) {
  const out = [];
  const add = (...a) => { const t = a.filter(Boolean).join(' '); if (t.length > 3) out.push(t); };
  if (block.title) add(block.title);
  if (block.items && Array.isArray(block.items)) block.items.forEach((it) => {
    if (typeof it === 'string') { add(it); return; }
    add(it.label, it.value, it.note, it.sub, it.detail, it.text, it.title, it.axis, it.name, it.what, it.date);
  });
  if (block.radarItems) block.radarItems.forEach((it) => add(it.axis, it.detail));
  if (block.heatItems) block.heatItems.forEach((it) => add(it.label, it.detail));
  if (block.body) add(block.body);
  if (block.text) add(block.text);
  if (block.source) add(block.source);
  if (block.rows && Array.isArray(block.rows)) block.rows.forEach((row) => {
    if (Array.isArray(row)) add(...row);
    else if (typeof row === 'object') add(...Object.values(row).filter((v) => typeof v === 'string'));
  });
  return out;
}

function HoldingSearch({ data, portfolio, sections, onOpenSection, onGoHome }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); }
      if (e.key === 'Escape') { setFocused(false); setQuery(''); inputRef.current?.blur(); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const index = useMemo(() => {
    const entries = [];
    const push = (text, sectionIdx, label) => { if (text && text.length > 3) entries.push({ text, sectionIdx, label }); };

    sections.forEach((sec, i) => {
      push(sec.title, i, sec.title);
      push(sec.sub, i, sec.title);
      const pv = sec.preview || {};
      push(pv.line, i, sec.title);
      (pv.bullets || []).forEach((b) => push(b, i, sec.title));
      (pv.stats || []).forEach((st) => push([st.label, st.value, st.sub].filter(Boolean).join(' — '), i, sec.title));
      (sec.deep || []).forEach((block) => {
        const lbl = block.title ? sec.title + ' · ' + block.title : sec.title;
        blockTexts(block).forEach((t) => push(t, i, lbl));
      });
      if (sec.bodyMarkdown) push(sec.bodyMarkdown, i, sec.title);
    });

    (data.recentMoves || []).forEach((m) => { push(m.title, null, t('Ключевые ходы', 'Key moves')); push(m.detail, null, t('Ключевые ходы', 'Key moves')); push(m.signal, null, t('Ключевые ходы', 'Key moves')); });

    if (data.snapshot) ['businessModel', 'ownership'].forEach((key) => {
      const lbl = key === 'businessModel' ? t('Ключевые данные', 'Key data') : t('Собственность', 'Ownership');
      (data.snapshot[key] || []).forEach((r) => push([r.label, r.value, r.note].filter(Boolean).join(' — '), null, lbl));
    });

    if (portfolio) {
      const pi = sections.findIndex((s) => s.id === 'portfolio');
      const portIdx = pi >= 0 ? pi : null;
      if (portfolio.allocation) {
        (portfolio.allocation.bySector || []).forEach((s) => push(s.name + ' — ' + (s.plain || ''), portIdx, t('Портфель · секторы', 'Portfolio · sectors')));
        (portfolio.allocation.byTheme || []).forEach((th) => {
          push(th.theme + ' — ' + (th.plain || ''), portIdx, t('Портфель · ', 'Portfolio · ') + th.theme);
          (th.items || []).forEach((item) => push(item, portIdx, t('Портфель · ', 'Portfolio · ') + th.theme));
        });
      }
      (portfolio.sectors || []).forEach((sector) => {
        push(sector.name + ' — ' + (sector.plain || ''), portIdx, t('Портфель · ', 'Portfolio · ') + sector.name);
        (sector.companies || []).forEach((c) => {
          const d = c.detail || {};
          push([c.name, c.what, d.why, d.thesis, d.edge].filter(Boolean).join(' · '), portIdx, t('Портфель · ', 'Portfolio · ') + sector.name);
        });
      });
    }

    (data.news || []).forEach((n) => push(n.title + ' — ' + (n.text || ''), null, t('Новости', 'News')));
    push(data.summary, null, t('О компании', 'About the company'));
    push(data.about, null, t('О компании', 'About the company'));
    return entries;
  }, [data, portfolio, sections]);

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const matches = [];
    const seen = new Set();
    for (const entry of index) {
      if (!entry.text.toLowerCase().includes(q)) continue;
      const pos = entry.text.toLowerCase().indexOf(q);
      const start = Math.max(0, pos - 40);
      const end = Math.min(entry.text.length, pos + query.length + 80);
      let snippet = entry.text.slice(start, end).trim();
      if (start > 0) snippet = '…' + snippet;
      if (end < entry.text.length) snippet += '…';
      const key = entry.label + '|' + snippet.slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);
      matches.push({ ...entry, snippet, matchStart: pos - start + (start > 0 ? 1 : 0) });
      if (matches.length >= 10) break;
    }
    return matches;
  }, [query, index]);

  const handleSelect = (r) => {
    setQuery(''); setFocused(false); inputRef.current?.blur();
    if (r.sectionIdx != null) onOpenSection(r.sectionIdx);
    else onGoHome();
  };

  const showDrop = focused && query.length >= 2;

  return (
    <div ref={wrapRef} style={{ marginLeft: 'auto', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.card, border: `1px solid ${focused ? C.teal : C.line}`, borderRadius: 8, padding: '5px 10px', transition: 'border-color .2s, width .25s', width: focused ? 320 : 180 }}>
        <span style={{ color: C.inkFaint, fontSize: 13, flexShrink: 0 }}>⌕</span>
        <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setFocused(true)} placeholder={t('Поиск по холдингу…', 'Search this holding…')}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.ink, fontFamily: 'var(--sans)', fontSize: 12.5, padding: 0, minWidth: 0 }} />
        {!focused && <span style={{ fontSize: 10, color: C.inkFaint, fontFamily: 'var(--mono)', flexShrink: 0 }}>⌘K</span>}
        {query && <span onClick={() => { setQuery(''); inputRef.current?.focus(); }} style={{ cursor: 'pointer', color: C.inkFaint, fontSize: 11, flexShrink: 0 }}>✕</span>}
      </div>
      {showDrop && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 440, maxHeight: '70vh', overflowY: 'auto', background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,.5)', zIndex: 60 }}>
          {results.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: C.inkFaint, fontSize: 12.5 }}>{t('Ничего не найдено по', 'Nothing found for')} «{query}»</div>
          ) : results.map((r, i) => {
            const q = query.toLowerCase();
            const mPos = r.snippet.toLowerCase().indexOf(q);
            return (
              <button key={i} onClick={() => handleSelect(r)}
                style={{ width: '100%', display: 'block', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: i < results.length - 1 ? `1px solid ${C.lineSoft}` : 'none', padding: '10px 14px', cursor: 'pointer', transition: 'background .12s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.cardAlt; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10.5, color: C.teal, fontWeight: 600, letterSpacing: '.04em' }}>{r.sectionIdx != null ? '→ ' + (sections[r.sectionIdx]?.n || '') : '⌂'}</span>
                  <span style={{ fontSize: 11, color: C.inkFaint }}>{r.label}</span>
                </div>
                <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>
                  {mPos >= 0 ? (<>{r.snippet.slice(0, mPos)}<span style={{ color: C.ink, fontWeight: 600, background: `color-mix(in srgb, ${C.teal} 13%, transparent)`, padding: '0 1px', borderRadius: 2 }}>{r.snippet.slice(mPos, mPos + query.length)}</span>{r.snippet.slice(mPos + query.length)}</>) : r.snippet}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Root
// ═══════════════════════════════════════════════════════════════════════════

export default function HoldingsV2({ onBack }) {
  const t = useT();
  const order = HOLDING_COMPANIES_ORDER.filter((id) => V2[id]);
  const [cid, setCid] = useState(order[0] || 'brookfield');
  const [deepIdx, setDeepIdx] = useState(null); // null = profile (L0), number = L2 section index
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusCompany, setFocusCompany] = useState(null); // set when a company link jumps to Portfolio
  const refs = useRef({});
  const data = V2[cid];

  const switchCompany = (id) => { if (!V2[id]) return; setCid(id); setDeepIdx(null); setFocusCompany(null); setSwitcherOpen(false); setMenuOpen(false); window.scrollTo({ top: 0 }); };
  // jump from any section to the Portfolio section and open a specific company
  const openCompany = (name) => {
    const pi = (data.sections || []).findIndex((s) => s.id === 'portfolio');
    if (pi < 0) return;
    setFocusCompany(name);
    setDeepIdx(pi);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  };
  const nameOf = (id) => V2[id]?.name || HOLD[id.toUpperCase()]?.name || id;

  // Bloomberg IA: home = header + snapshot + moves + overview; sections live in a
  // top-bar dropdown, each opening its own page. Data-driven — any holding that has
  // authored the rich `overview` block gets the Bloomberg landing; the rest keep the
  // bento-grid body. (Brookfield was first; roll-out flips automatically per holding.)
  // showNav → enhanced header with category-tab dropdowns, on every holding.
  const isBloomberg = !!(data && data.overview);
  const showNav = !!(data && data.sections && data.sections.length);
  const openSection = (i) => { setDeepIdx(i); setFocusCompany(null); setMenuOpen(false); window.scrollTo({ top: 0 }); };

  if (!data) return <div style={{ padding: 64, color: C.inkSoft }}>{t('Нет мигрированных холдингов.', 'No migrated holdings.')}</div>;

  const FONTS = (
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Hanken+Grotesk:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      :root{ --serif:'Newsreader',Georgia,serif; --sans:'Hanken Grotesk',system-ui,sans-serif; --mono:'IBM Plex Mono',ui-monospace,monospace; }
      *{box-sizing:border-box;}
      @keyframes rise{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}} .rise{animation:rise .45s cubic-bezier(.2,.7,.2,1) both;}
      .navlink{transition:color .15s,border-color .15s;cursor:pointer;}`}</style>
  );

  // Bento layout — each tile decides its span, its accent color, and what tiny
  // preview it shows (mini-bar, sparkline, number). Priority sections take more
  // real estate; supporting ones are compact.
  const hasChangesDeep = !!data.changesDeep;
  const bentoLayout = {
    portfolio:    { span: 'col-span-2 row-span-2', accent: C.teal,   preview: 'sectors' },
    changes:      { span: hasChangesDeep ? 'col-span-2' : 'col-span-1', accent: C.teal, preview: 'delta' },
    financial:    { span: 'col-span-2',            accent: C.teal,   preview: 'spark' },
    strategy:     { span: 'col-span-1 row-span-2', accent: C.gold,   preview: 'quote' },
    track_record: { span: 'col-span-1',            accent: C.teal,   preview: 'number' },
    // pipeline is folded into changesDeep for companies that have it
    pipeline:     { span: hasChangesDeep ? 'hidden' : 'col-span-1', accent: C.teal, preview: 'number' },
    risk:         { span: 'col-span-1',            accent: C.blue,   preview: 'number' },
    valuation:    { span: 'col-span-1',            accent: C.blue,   preview: 'number' },
    insider:      { span: 'col-span-1',            accent: C.blue,   preview: 'number' },
    peers:        { span: 'col-span-1',            accent: C.blue,   preview: 'number' },
    worldview:    { span: 'col-span-1',            accent: C.gold,   preview: 'quote' },
    monitor:      { span: 'col-span-1',            accent: C.violet, preview: 'dot' },
    analysis:     { span: 'col-span-1',            accent: C.violet, preview: 'dot' },
  };

  return (
    <div style={{ background: C.paper, minHeight: '100vh', fontFamily: 'var(--sans)', color: C.ink }}>
      {FONTS}
      <style>{`
        .bento{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:minmax(140px,auto);gap:14px;}
        .bento .tile{transition:border-color .15s,transform .15s,background .15s;cursor:pointer;}
        .bento .tile:hover{border-color:${C.teal};transform:translateY(-2px);background:${C.cardAlt};}
        .col-span-2{grid-column:span 2;} .row-span-2{grid-row:span 2;}
        @media (max-width:900px){.bento{grid-template-columns:repeat(2,minmax(0,1fr));} .col-span-2{grid-column:span 2;} .row-span-2{grid-row:auto;}}
      `}</style>

      {/* ── Top bar (sticky): company switcher + section dots ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: `color-mix(in srgb, ${C.paper} 95%, transparent)`, backdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.line}` }}>
        <div onMouseLeave={() => setMenuOpen(null)} style={{ maxWidth: 'none', margin: '0 auto', padding: '0 40px', minHeight: 56, display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          {onBack && (
            <button onClick={onBack} title={t('Назад к исследованиям', 'Back to research')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, cursor: 'pointer', color: C.inkSoft, fontSize: 14, flexShrink: 0, transition: 'border-color .15s, color .15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.color = C.teal; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.inkSoft; }}>
              ←
            </button>
          )}
          {showNav && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.inkFaint, flexShrink: 0 }}>
              <span style={{ letterSpacing: '.04em' }}>Holdings</span>
              <span style={{ opacity: .45 }}>/</span>
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setSwitcherOpen(!switcherOpen)} style={{ display: 'flex', alignItems: 'center', gap: 9, background: C.card, border: `1px solid ${switcherOpen ? C.teal : C.line}`, borderRadius: 9, padding: '7px 12px', cursor: 'pointer' }}>
              <span style={{ width: 26, height: 26, borderRadius: 6, background: META[cid]?.color || C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: (META[cid]?.mono || '').length > 2 ? 9 : 11, fontWeight: 600, color: '#fff' }}>{META[cid]?.mono || '·'}</span>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 500, color: C.ink }}>{data.name}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: C.inkSoft }}>{data.ticker}</span>
              <span style={{ color: C.inkSoft, fontSize: 9, marginLeft: 2, transform: switcherOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
            </button>
            {switcherOpen && (
              <>
                <div onClick={() => setSwitcherOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50, minWidth: 260, background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,.45)', padding: 6, maxHeight: '70vh', overflowY: 'auto' }}>
                  {HOLDING_COMPANIES_ORDER.map((id) => {
                    const on = id === cid, migrated = !!V2[id];
                    return (
                      <button key={id} onClick={() => switchCompany(id)} disabled={!migrated} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: on ? C.cardAlt : 'transparent', border: 'none', borderRadius: 7, padding: '8px 10px', cursor: migrated ? 'pointer' : 'default', textAlign: 'left', opacity: migrated ? 1 : 0.4 }}>
                        <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 6, background: META[id]?.color || C.line, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: (META[id]?.mono || '').length > 2 ? 9 : 11, fontWeight: 600, color: '#fff' }}>{META[id]?.mono}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 13, fontWeight: on ? 600 : 500, color: C.ink, whiteSpace: 'nowrap' }}>{nameOf(id)}</span>
                          {!migrated && <span style={{ display: 'block', fontSize: 10, color: C.inkFaint }}>{t('готовится', 'in preparation')}</span>}
                        </span>
                        {on && <span style={{ color: C.teal, fontSize: 12 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          {showNav && (
            <nav onMouseLeave={() => setMenuOpen(null)} style={{ display: 'flex', alignItems: 'stretch', alignSelf: 'stretch', gap: 0, marginLeft: 8 }}>
              <button onClick={() => { setDeepIdx(null); setMenuOpen(null); window.scrollTo({ top: 0 }); }}
                onMouseEnter={() => setMenuOpen(null)}
                style={{ display: 'flex', alignItems: 'center', height: '100%', background: 'transparent', border: 'none', padding: '0 12px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: deepIdx == null ? 600 : 500, color: deepIdx == null ? C.ink : C.inkSoft, borderBottom: `2px solid ${deepIdx == null ? C.teal : 'transparent'}`, transition: 'color .15s', whiteSpace: 'nowrap' }}>
                {t('Обзор', 'Overview')}
              </button>
              {tiers(t).map((tier) => {
                const secs = data.sections.map((s, i) => ({ s, i })).filter(({ s }) => s.tier === tier.id);
                if (!secs.length) return null;
                const activeInTier = deepIdx != null && secs.some(({ i }) => i === deepIdx);
                const open = menuOpen === tier.id;
                return (
                  <div key={tier.id} style={{ position: 'relative', display: 'flex' }} onMouseEnter={() => setMenuOpen(tier.id)}>
                    <button onClick={() => openSection(secs[0].i)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, height: '100%', background: 'transparent', border: 'none', padding: '0 12px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: activeInTier ? 600 : 500, color: activeInTier || open ? C.ink : C.inkSoft, borderBottom: `2px solid ${activeInTier ? tier.color : 'transparent'}`, transition: 'color .15s', whiteSpace: 'nowrap' }}>
                      {tier.label}
                      <span style={{ fontSize: 8, color: C.inkFaint, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
                    </button>
                    {open && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 60, minWidth: 320, background: C.card, border: `1px solid ${C.line}`, borderTop: `2px solid ${tier.color}`, borderRadius: '0 0 10px 10px', boxShadow: '0 16px 48px rgba(0,0,0,.5)', padding: 8 }}>
                        {secs.map(({ s, i }) => {
                          const on = deepIdx === i;
                          return (
                            <button key={s.id} onClick={() => { openSection(i); setMenuOpen(null); }} className="navlink" style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, background: on ? C.cardAlt : 'transparent', border: 'none', borderRadius: 8, padding: '9px 10px', cursor: 'pointer', textAlign: 'left' }}
                              onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = C.cardAlt; }}
                              onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: on ? tier.color : C.inkFaint, width: 22, flexShrink: 0, paddingTop: 2 }}>{s.n}</span>
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                  <span style={{ fontSize: 14, fontWeight: on ? 600 : 500, color: C.ink, lineHeight: 1.3 }}>{s.title}</span>
                                  {on && <span style={{ color: tier.color, fontSize: 11 }}>✓</span>}
                                </span>
                                {s.sub && <span style={{ display: 'block', fontSize: 11, color: C.inkFaint, lineHeight: 1.4, marginTop: 2 }}>{s.sub}</span>}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          )}
          <HoldingSearch key={cid} data={data} portfolio={PORT[cid]} sections={data.sections} onOpenSection={openSection} onGoHome={() => { setDeepIdx(null); window.scrollTo({ top: 0 }); }} />
        </div>
      </div>

      {/* ── Body ── */}
      {deepIdx != null ? (
        <DeepView data={data} idx={deepIdx} setIdx={setDeepIdx} onBack={() => { setDeepIdx(null); window.scrollTo({ top: 0 }); }} portfolio={PORT[cid]} financial={FIN[cid]} wide={isBloomberg} onOpenCompany={openCompany} focus={focusCompany} />
      ) : (
        <main className="rise" key={cid} style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 40px 80px' }}>
          {/* Header — clean, no KPI strip (overview handles it) */}
          <header style={{ marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 12 }}><span>{data.type}</span><span style={{ color: C.inkFaint }}>·</span><span>{data.asOf}</span></div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 52, fontWeight: 500, lineHeight: 1.02, letterSpacing: '-.02em', margin: '0 0 16px' }}>{data.name}</h1>
            {(data.about || data.tagline) && <p style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.55, color: C.inkSoft, maxWidth: 820, margin: '0 0 18px' }}>{data.about || data.tagline}</p>}
            {data.aboutMeta && data.aboutMeta.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px' }}>
                {data.aboutMeta.map((m, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 3 }}>{m.label}</div>
                    <div style={{ fontSize: 13, color: C.ink }}>{m.value}</div>
                  </div>
                ))}
              </div>
            )}
          </header>

          {/* Price chart + summary */}
          {data.priceChart && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 22 }}>
              {data.summary && (
                <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.65, alignSelf: 'center' }}>{data.summary}</div>
              )}
              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 30, fontWeight: 500, color: C.ink, lineHeight: 1 }}>{data.priceChart.current}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: data.priceChart.change.includes('+') ? C.teal : C.clay }}>{data.priceChart.change}</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: C.inkFaint, fontFamily: 'var(--mono)', letterSpacing: 1.5, marginTop: 6 }}>{data.ticker}</div>
                  </div>
                  <span style={{ fontSize: 10.5, color: C.inkFaint }}>{data.priceChart.period}</span>
                </div>
                <Sparkline points={data.priceChart.points} periods={[data.priceChart.start, data.priceChart.end]} color={data.priceChart.change.includes('+') ? C.teal : C.clay} h={100} interactive />
              </div>
            </div>
          )}

          {/* Snapshot — Bloomberg-density dense fact grid (business model + ownership) */}
          {data.snapshot && (
            <div style={{ marginBottom: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
              {['businessModel', 'ownership'].filter((k) => data.snapshot[k] && data.snapshot[k].length > 0).map((key) => (
                <div key={key} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 10 }}>{key === 'businessModel' ? t('Ключевые данные', 'Key data') : 'Собственность и оценка'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.snapshot[key].map((r, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'baseline', paddingBottom: 8, borderBottom: i < data.snapshot[key].length - 1 ? `1px solid ${C.lineSoft}` : 'none' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 2 }}>{r.label}</div>
                          {r.note && <div style={{ fontSize: 10.5, color: C.inkFaint, lineHeight: 1.4 }}>{r.note}</div>}
                        </div>
                        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500, color: C.ink }}>{r.value}</div>
                          {r.delta && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: /−|−|-\d/.test(r.delta) ? C.clay : C.teal, marginTop: 2 }}>{r.delta}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent moves — compact table; each row expands to a brief strategic read */}
          {data.recentMoves && data.recentMoves.length > 0 && <RecentMoves items={data.recentMoves} />}

          {/* Overview — hero KPIs + preview charts */}
          {data.overview && <div style={{ marginBottom: 24 }}><OverviewBlock overview={data.overview} /></div>}

          {/* Top bets — 5 flagship names, the memorability anchor */}
          {data.topBets && data.topBets.items && data.topBets.items.length > 0 && <TopBets data={data.topBets} />}

          {/* News & events — recent headlines, insider moves, dividends */}
          {data.news && data.news.length > 0 && <NewsBlock items={data.news} />}

          {/* Bento grid — 13 section tiles of varying size.
              Bloomberg IA companies don't render it: sections live in the top-bar menu. */}
          {!isBloomberg && <div className="bento">
            {data.sections.map((sec) => {
              const cfg = bentoLayout[sec.id] || { span: 'col-span-1', accent: C.teal, preview: 'number' };
              if (cfg.span === 'hidden') return null;
              const tier = tiers(t).find((x) => x.id === sec.tier);
              const idx = data.sections.indexOf(sec);
              return (
                <div key={sec.id} className={`tile ${cfg.span}`} onClick={() => setDeepIdx(idx)} style={{ background: C.card, border: `1px solid ${C.line}`, borderTop: `2px solid ${cfg.accent}`, borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', minHeight: 140 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: cfg.accent, letterSpacing: '.06em' }}>{sec.n}</span>
                    <span style={{ fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: C.inkFaint }}>{tier?.label?.split('—')[0]?.trim() || ''}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500, color: C.ink, lineHeight: 1.15, marginBottom: 6 }}>{sec.title}</div>
                  {sec.sub && <div style={{ fontSize: 12, color: C.inkFaint, marginBottom: 12, fontStyle: 'italic' }}>{sec.sub}</div>}
                  {sec.preview?.line && <div style={{ fontSize: 13, lineHeight: 1.5, color: C.inkSoft, marginBottom: 12, flex: 1 }}>{sec.preview.line}</div>}
                  {/* Mini stat strip — 1 to 2 numbers depending on tile size */}
                  {sec.preview?.stats && sec.preview.stats.length > 0 && (
                    <div style={{ marginTop: 'auto', display: 'flex', gap: 18, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
                      {sec.preview.stats.slice(0, cfg.span.includes('col-span-2') ? 3 : 2).map((st, i) => (
                        <div key={i}>
                          <div style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 3 }}>{st.label}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, color: C.ink, lineHeight: 1 }}>{st.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>}

        </main>
      )}
    </div>
  );
}
