// SectionDeep — block-based structured renderer for deep section views.
// Replaces markdown walls with Bloomberg-density primitives: stat rows,
// column tables, card grids, labeled bars, risk heat rows, timelines,
// quotes and dense fact lists. A section's data is an array of typed
// blocks (sections[].deep in the company JSON). Dark mode only.

import { useState, useContext, createContext } from 'react';
import holdingsData from '../../data/holdings.json';

import { C } from './holdingsC.js';
import { useT } from '../../lib/i18n.jsx';
import { bi } from '../../lib/bi.js';
const col = (name) => C[name] || name || C.teal;
const isNeg = (s) => typeof s === 'string' && /^[−-]/.test(s.trim());

// Cross-section navigation: a block can turn company mentions into links that
// jump to the Portfolio section and open that company. HoldingsV2 supplies the
// handler; blocks declare links via an item's `links: [{text, company}]`.
const OpenCompanyCtx = createContext(null);
// NOT a component — a plain helper, called from inside `.map()` in Facts and
// Cards. It must therefore never call a hook: every `useT()` here was appended
// to the HOOK LIST OF THE CALLING COMPONENT, once per item, so a holding with
// a different number of facts rendered a different number of hooks and React
// threw «Rendered more hooks than during the previous render» — a black screen
// on Berkshire's section tabs while Brookfield's worked. (2026-08-28.)
//
// The hint is a fixed bilingual literal, so it belongs in a module-level `bi()`
// getter, which resolves the language at ACCESS time with no hook at all.
const LINK_HINT = bi({ title: ['Открыть в портфеле', 'Open in the portfolio'] });

function withLinks(text, links, openCompany) {
  if (!text || !links || !links.length || !openCompany) return text;
  const map = {};
  links.forEach((l) => { map[l.text] = l.company; });
  const escaped = links.map((l) => l.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length);
  const re = new RegExp('(' + escaped.join('|') + ')', 'g');
  return text.split(re).map((p, i) => map[p]
    ? <span key={i} onClick={() => openCompany(map[p])} title={LINK_HINT.title}
        style={{ color: C.teal, cursor: 'pointer', borderBottom: `1px dashed color-mix(in srgb, ${C.teal} 53%, transparent)`, fontWeight: 500 }}>{p}</span>
    : p);
}

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
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${b.min || 210}px, 1fr))`, gap: 1, background: C.line, border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
        {b.items.map((s, i) => {
          const ac = s.accent ? col(s.accent) : null;
          return (
            <div key={i} style={{ background: C.card, padding: '15px 17px', borderTop: ac ? `2px solid ${ac}` : 'none' }}>
              <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 7, lineHeight: 1.3 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: ac || C.ink, lineHeight: 1.1 }}>{s.value}</div>
              {s.delta && <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: isNeg(s.delta) ? C.clay : C.teal, marginTop: 4 }}>{s.delta}</div>}
              {s.note && <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 9, lineHeight: 1.5 }}>{s.note}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── table: column-headed data table ─────────────────────────────────────────
function linkifyCell(cell) {
  if (typeof cell !== 'string') return cell;
  const re = /((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s,;]*)?)/gi;
  const out = []; let last = 0, m, k = 0;
  while ((m = re.exec(cell)) !== null) {
    if (m.index > last) out.push(cell.slice(last, m.index));
    const url = m[0], href = url.startsWith('http') ? url : 'https://' + url;
    out.push(<a key={k++} href={href} target="_blank" rel="noopener noreferrer" style={{ color: C.teal, textDecoration: 'none' }}>{url}</a>);
    last = m.index + url.length;
  }
  if (!out.length) return cell;
  if (last < cell.length) out.push(cell.slice(last));
  return out;
}

function DataTable({ b }) {
  const headers = b.headers || b.columns || [];
  const alignFor = (ci) => (b.align && b.align[ci]) || (ci === 0 ? 'left' : 'right');
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 10 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          {headers.length > 0 && <thead><tr>
            {headers.map((h, i) => (
              <th key={i} style={{ textAlign: alignFor(i), padding: '9px 14px', fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: C.inkSoft, fontWeight: 600, borderBottom: `1px solid ${C.line}`, background: C.cardAlt, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr></thead>}
          <tbody>
            {(b.rows || []).map((r, ri) => (
              <tr key={ri} style={{ background: ri % 2 ? C.card : 'transparent' }}>
                {r.map((cell, ci) => (
                  <td key={ci} style={{ textAlign: alignFor(ci), padding: '9px 14px', fontSize: ci === 0 ? 12.5 : 12, fontFamily: ci === 0 ? 'var(--sans)' : 'var(--mono)', color: isNeg(cell) ? C.clay : (ci === 0 ? C.ink : C.inkSoft), lineHeight: 1.45, verticalAlign: 'top' }}>{linkifyCell(cell)}</td>
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
              {c.badge && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: `color-mix(in srgb, ${col(c.color)} 13%, transparent)`, color: col(c.color), border: `1px solid color-mix(in srgb, ${col(c.color)} 33%, transparent)`, fontWeight: 600, letterSpacing: '.06em' }}>{c.badge}</span>}
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

// ── bets: strategy bet cards — labelled headline number + vehicles (business
//    models + named companies + scale) + management outlook + quote ──────────
function Bets({ b }) {
  const t = useT();
  const openCompany = useContext(OpenCompanyCtx);
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${b.min || 360}px, 1fr))`, gap: 14 }}>
        {b.items.map((c, i) => {
          const cc = col(c.color);
          const cardTitle = c.title || c.name || '';
          const cardBadge = c.badge || c.sector || '';
          const cardValue = c.value || c.role || '';
          const cardValueLabel = c.valueLabel || c.fact || '';
          return (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderTop: `3px solid ${cc}`, borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
              {/* header: sector + tag */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: C.ink, flex: 1, lineHeight: 1.2 }}>{cardTitle}</span>
                {cardBadge && <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: `color-mix(in srgb, ${cc} 13%, transparent)`, color: cc, border: `1px solid color-mix(in srgb, ${cc} 33%, transparent)`, fontWeight: 600, letterSpacing: '.06em', flexShrink: 0 }}>{cardBadge}</span>}
              </div>
              {/* headline number + what it actually is */}
              <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${C.lineSoft}` }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 23, fontWeight: 500, color: cc, lineHeight: 1 }}>{cardValue}</div>
                {cardValueLabel && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 6, lineHeight: 1.45 }}>{cardValueLabel}</div>}
              </div>
              {/* vehicles: business model + named companies + scale */}
              {c.vehicles && c.vehicles.length > 0 && (
                <div style={{ marginBottom: c.outlook || c.quote ? 14 : 0 }}>
                  <div style={{ fontSize: 9, letterSpacing: '.09em', textTransform: 'uppercase', color: C.inkFaint, fontWeight: 600, marginBottom: 9 }}>{t('Через что вкладывают', 'What they invest through')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {c.vehicles.map((v, vi) => (
                      <div key={vi} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                        <span style={{ width: 5, height: 5, borderRadius: 3, background: cc, flexShrink: 0, marginTop: 6 }} />
                        <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>
                          <span style={{ color: C.ink, fontWeight: 600 }}>{v.label} — </span>{withLinks(v.text, c.links, openCompany)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* management outlook / projection */}
              {(c.outlook || c.embodies) && (
                <div style={{ background: `color-mix(in srgb, ${cc} 6%, transparent)`, border: `1px solid color-mix(in srgb, ${cc} 20%, transparent)`, borderRadius: 8, padding: '10px 12px', marginBottom: c.quote ? 12 : 0 }}>
                  <div style={{ fontSize: 9, letterSpacing: '.09em', textTransform: 'uppercase', color: cc, fontWeight: 600, marginBottom: 5 }}>{c.outlook ? t('Куда идёт — взгляд менеджмента', 'Where it is going — management’s view') : t('Что воплощает', 'What it embodies')}</div>
                  <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>{c.outlook || c.embodies}</div>
                </div>
              )}
              {/* quote */}
              {c.quote && (
                <div style={{ marginTop: 'auto', paddingTop: c.outlook ? 2 : 12, fontSize: 11, color: C.inkFaint, fontStyle: 'italic', lineHeight: 1.5 }}>
                  «{c.quote}»{c.quoteBy && <span style={{ fontStyle: 'normal' }}> — {c.quoteBy}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {b.foot && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 14, fontStyle: 'italic', lineHeight: 1.5 }}>{b.foot}</div>}
    </div>
  );
}

// ── pie: interactive SVG donut with hover + labels ─────────────────────────
function Pie({ b }) {
  const t = useT();
  const [hov, setHov] = useState(null);
  const total = b.items.reduce((s, it) => s + (it.pct || 0), 0) || 1;
  const sz = 280, cx = sz / 2, cy = sz / 2, r = 110, ir = 68;
  let ang = -Math.PI / 2;
  const slices = b.items.filter(it => it.pct > 0.05).map((it, idx) => {
    const a = (it.pct / total) * Math.PI * 2;
    const la = a > Math.PI ? 1 : 0;
    const mid = ang + a / 2;
    const cos1 = Math.cos(ang), sin1 = Math.sin(ang);
    const cos2 = Math.cos(ang + a), sin2 = Math.sin(ang + a);
    const lr = (hov === idx) ? r + 6 : r;
    const lir = (hov === idx) ? ir - 2 : ir;
    const d = `M${cx + lr * cos1} ${cy + lr * sin1} A${lr} ${lr} 0 ${la} 1 ${cx + lr * cos2} ${cy + lr * sin2} L${cx + lir * cos2} ${cy + lir * sin2} A${lir} ${lir} 0 ${la} 0 ${cx + lir * cos1} ${cy + lir * sin1}Z`;
    const labelR = r + 22;
    const lx = cx + labelR * Math.cos(mid);
    const ly = cy + labelR * Math.sin(mid);
    ang += a;
    return { ...it, d, idx, lx, ly, mid };
  });
  const active = hov !== null ? slices.find(s => s.idx === hov) : null;
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: sz, height: sz, flexShrink: 0 }}>
          <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ overflow: 'visible' }}>
            {slices.map((s) => (
              <path key={s.idx} d={s.d} fill={col(s.color)} opacity={hov === null || hov === s.idx ? .88 : .35}
                stroke={C.card} strokeWidth={1.5} style={{ cursor: 'pointer', transition: 'opacity .15s' }}
                onMouseEnter={() => setHov(s.idx)} onMouseLeave={() => setHov(null)} />
            ))}
          </svg>
          {active && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 26, fontWeight: 600, color: C.ink }}>{active.value}</div>
              <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 3, maxWidth: 118, lineHeight: 1.3 }}>{active.label}</div>
            </div>
          )}
          {!active && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 10, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t('Наведите', 'Hover')}</div>
            </div>
          )}
        </div>
        <div style={{ flex: '1 1 200px', minWidth: 180 }}>
          {b.items.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, marginBottom: 2,
              background: hov === i ? `color-mix(in srgb, ${C.line} 27%, transparent)` : 'transparent', cursor: 'pointer', transition: 'background .12s' }}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: col(it.color), flexShrink: 0, transform: 'translateY(3px)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: hov === i ? C.ink : C.inkSoft, lineHeight: 1.3, transition: 'color .12s' }}>{it.label}</div>
                {it.note && <div style={{ fontSize: 11, color: C.inkFaint, lineHeight: 1.4, marginTop: 2 }}>{it.note}</div>}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: C.ink, flexShrink: 0, transform: 'translateY(1px)' }}>{it.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── flows: insider-action summary — takeaway + scale bars + monthly history ─
// Answers "what's happening and which way is it trending" at a glance: a
// scale comparison (buyback vs sells vs buys) plus a diverging monthly bar
// chart of individual insider trades (sells down, buys up around a zero line).
function Flows({ b }) {
  const t = useT();
  const [hov, setHov] = useState(null);
  const sells = b.sells || [], buys = b.buys || [], axis = b.axis || [];
  const maxAbs = Math.max(...sells, ...buys, 1);
  const SELL_H = 128, BUY_H = 34; // px budget below / above the zero line
  const hSell = (v) => (v > 0 ? Math.max(3, (v / maxAbs) * SELL_H) : 0);
  const hBuy = (v) => (v > 0 ? Math.max(3, (v / maxAbs) * SELL_H) : 0);
  const tmax = b.totals ? Math.max(...b.totals.map((x) => x.mag)) : 1;
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      {b.takeaway && (
        <div style={{ background: C.cardAlt, borderLeft: `3px solid ${C.teal}`, borderRadius: 8, padding: '13px 16px', marginBottom: 16, fontSize: 13.5, color: C.ink, lineHeight: 1.6 }}>{b.takeaway}</div>
      )}
      {/* scale comparison: buyback vs sells vs buys */}
      {b.totals && (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 18px', marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 13, fontWeight: 600 }}>{t('Масштаб действий · 12 мес', 'Scale of activity · 12 months')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {b.totals.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 210, flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: C.ink }}>{t.label}</div>
                  {t.sub && <div style={{ fontSize: 10.5, color: C.inkFaint, lineHeight: 1.35 }}>{t.sub}</div>}
                </div>
                <div style={{ flex: 1, height: 20, background: C.track, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(t.mag / tmax) * 100}%`, height: '100%', background: col(t.color), borderRadius: 4, minWidth: 4 }} />
                </div>
                <div style={{ width: 108, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: col(t.color), flexShrink: 0 }}>{t.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* monthly diverging history */}
      {axis.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 18px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkSoft, fontWeight: 600 }}>Сделки инсайдеров помесячно · {b.unit || 'CA$ млн'}</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 10.5, color: C.inkSoft, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: col('teal'), display: 'inline-block' }} />{t('покупки', 'purchases')}</span>
              <span style={{ fontSize: 10.5, color: C.inkSoft, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: col('clay'), display: 'inline-block' }} />{t('продажи', 'sales')}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 4 }}>
            {axis.map((m, i) => {
              const on = hov === i;
              return (
                <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: (sells[i] || buys[i]) ? 'pointer' : 'default' }}
                  onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
                  {/* buys region (above zero) */}
                  <div style={{ height: BUY_H, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    {buys[i] > 0 && <div style={{ width: '62%', height: hBuy(buys[i]), background: col('teal'), borderRadius: '2px 2px 0 0', opacity: on ? 1 : 0.85 }} />}
                  </div>
                  <div style={{ height: 1, width: '100%', background: C.line }} />
                  {/* sells region (below zero) */}
                  <div style={{ height: SELL_H, width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', position: 'relative' }}>
                    {sells[i] > 0 && <div style={{ width: '62%', height: hSell(sells[i]), background: col('clay'), borderRadius: '0 0 2px 2px', opacity: on ? 1 : 0.85 }} />}
                    {on && (sells[i] || buys[i]) ? (
                      <div style={{ position: 'absolute', top: hSell(sells[i]) + 6, left: '50%', transform: 'translateX(-50%)', background: C.cardAlt, border: `1px solid ${C.line}`, borderRadius: 6, padding: '5px 9px', whiteSpace: 'nowrap', zIndex: 5, pointerEvents: 'none' }}>
                        {b.labels && b.labels[i] && <div style={{ fontSize: 11, color: C.ink, fontWeight: 600 }}>{b.labels[i]}</div>}
                        {sells[i] > 0 && <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', color: col('clay') }}>−{sells[i]} продажа</div>}
                        {buys[i] > 0 && <div style={{ fontSize: 10.5, fontFamily: 'var(--mono)', color: col('teal') }}>+{buys[i]} покупка</div>}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 9.5, color: on ? C.ink : C.inkFaint, marginTop: 6, whiteSpace: 'nowrap' }}>{m}</div>
                </div>
              );
            })}
          </div>
          {b.foot && <div style={{ fontSize: 10.5, color: C.inkFaint, marginTop: 12, fontStyle: 'italic', lineHeight: 1.5 }}>{b.foot}</div>}
        </div>
      )}
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

// ── compare: multi-metric small-multiples bar comparison ────────────────────
// One card, several metric panels; each panel compares the same set of
// companies on that metric (bars normalized to the metric's own max, or a
// log scale so wildly different magnitudes still fit). Company colors are
// consistent across panels so one entity is trackable at a glance.
function Compare({ b }) {
  const [hov, setHov] = useState(null);
  const companies = b.companies;
  const colors = b.colors || companies.map(() => 'teal');
  const scale = b.scale === 'log' ? 'log' : 'linear';
  const widthFor = (vals, v) => {
    if (scale === 'log') {
      const min = Math.min(...vals.filter((x) => x > 0));
      const max = Math.max(...vals);
      if (max <= min) return 100;
      const lo = Math.log(min) - (Math.log(max) - Math.log(min)) * 0.08; // small floor so smallest bar is visible
      return Math.max(4, ((Math.log(Math.max(v, min)) - lo) / (Math.log(max) - lo)) * 100);
    }
    const max = Math.max(...vals, 1);
    return (v / max) * 100;
  };
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '18px 20px' }}>
        {/* legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${C.lineSoft}` }}>
          {companies.map((co, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', opacity: hov === null || hov === i ? 1 : 0.4, transition: 'opacity .12s' }}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
              <div style={{ width: 11, height: 11, borderRadius: 3, background: col(colors[i]) }} />
              <span style={{ fontSize: 12.5, color: C.ink, fontWeight: b.primary === i ? 700 : 500 }}>{co}</span>
            </div>
          ))}
        </div>
        {/* metric panels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px 36px' }}>
          {b.metrics.map((m, mi) => (
            <div key={mi}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 11 }}>
                <div style={{ fontSize: 11, letterSpacing: '.05em', textTransform: 'uppercase', color: C.inkSoft, fontWeight: 600 }}>{m.label}</div>
                {m.note && <div style={{ fontSize: 10, color: C.inkFaint }}>{m.note}</div>}
              </div>
              {companies.map((co, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < companies.length - 1 ? 8 : 0, opacity: hov === null || hov === i ? 1 : 0.35, transition: 'opacity .12s' }}
                  onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
                  <div style={{ width: 118, flexShrink: 0, fontSize: 11.5, color: b.primary === i ? C.ink : C.inkSoft, fontWeight: b.primary === i ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{co}</div>
                  <div style={{ flex: 1, height: 13, background: C.track, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${widthFor(m.values, m.values[i])}%`, height: '100%', background: col(colors[i]), borderRadius: 3 }} />
                  </div>
                  <div style={{ width: 92, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11.5, color: C.ink, flexShrink: 0 }}>{m.display[i]}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        {/* per-company feature captions */}
        {b.features && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.lineSoft}`, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {companies.map((co, i) => b.features[i] && (
              <div key={i} style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.45, opacity: hov === null || hov === i ? 1 : 0.4, transition: 'opacity .12s' }}>
                <span style={{ color: col(colors[i]), fontWeight: 600 }}>{co} — </span>{b.features[i]}
              </div>
            ))}
          </div>
        )}
        {b.foot && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 14, fontStyle: 'italic', lineHeight: 1.5 }}>{b.foot}</div>}
      </div>
    </div>
  );
}

// ── dumbbell: two linked values per row (e.g. total vs monetized) ───────────
// Answers "how much of the big number actually converts" — a single line per
// company with two dots joined by a stem; the gap itself is the story.
function Dumbbell({ b }) {
  const [hov, setHov] = useState(null);
  const all = b.items.flatMap((it) => [it.a, it.b]);
  const max = Math.max(...all) * 1.08;
  const pct = (v) => (v / max) * 100;
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      {b.takeaway && (
        <div style={{ background: C.cardAlt, borderLeft: `3px solid ${C.teal}`, borderRadius: 8, padding: '13px 16px', marginBottom: 16, fontSize: 13.5, color: C.ink, lineHeight: 1.6 }}>{b.takeaway}</div>
      )}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '18px 20px' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 10.5, color: C.inkFaint }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: C.inkFaint, display: 'inline-block' }} />{b.aLabel}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: col(b.color || 'teal'), display: 'inline-block' }} />{b.bLabel}</span>
        </div>
        {b.items.map((it, i) => {
          const on = hov === i;
          const c = col(it.color || b.color || 'teal');
          return (
            <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{ marginBottom: i < b.items.length - 1 ? 20 : 0, opacity: hov === null || on ? 1 : 0.5, transition: 'opacity .12s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: it.primary ? 700 : 500, color: C.ink }}>{it.name}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: c, fontWeight: 600 }}>{it.pctLabel}</span>
              </div>
              <div style={{ position: 'relative', height: 22 }}>
                <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 2, background: C.track }} />
                <div style={{ position: 'absolute', top: 10, height: 2, background: `color-mix(in srgb, ${c} 60%, transparent)`, left: `${pct(Math.min(it.a, it.b))}%`, width: `${pct(Math.max(it.a, it.b)) - pct(Math.min(it.a, it.b))}%` }} />
                <div style={{ position: 'absolute', top: 4, left: `${pct(it.a)}%`, transform: 'translateX(-50%)', width: 14, height: 14, borderRadius: '50%', background: C.paper, border: `2px solid ${C.inkFaint}` }} />
                <div style={{ position: 'absolute', top: 4, left: `${pct(it.b)}%`, transform: 'translateX(-50%)', width: 14, height: 14, borderRadius: '50%', background: c, border: `2px solid ${c}` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.inkFaint, fontFamily: 'var(--mono)', marginTop: 4 }}>
                <span>{it.aDisplay}</span>
                <span>{it.bDisplay}</span>
              </div>
            </div>
          );
        })}
      </div>
      {b.foot && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 12, fontStyle: 'italic', lineHeight: 1.5 }}>{b.foot}</div>}
    </div>
  );
}

// ── columns: simple vertical column chart ───────────────────────────────────
// For metrics that read naturally as "how tall" rather than "how long" — a
// single quarter's absolute figures side by side.
function Columns({ b }) {
  const [hov, setHov] = useState(null);
  const max = Math.max(...b.items.map((it) => it.value)) * 1.15;
  const H = 180;
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '20px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: H, justifyContent: 'center' }}>
          {b.items.map((it, i) => {
            const on = hov === i;
            const c = col(it.color);
            const h = Math.max(6, (it.value / max) * H);
            return (
              <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 1 84px', cursor: 'default' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: on ? c : C.ink, marginBottom: 6 }}>{it.display}</div>
                <div style={{ width: '100%', maxWidth: 56, height: h, background: c, opacity: on ? 1 : 0.82, borderRadius: '5px 5px 2px 2px', transition: 'opacity .12s, height .2s' }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 10, borderTop: `1px solid ${C.lineSoft}`, paddingTop: 10 }}>
          {b.items.map((it, i) => (
            <div key={i} style={{ flex: '0 1 84px', textAlign: 'center', fontSize: 11.5, fontWeight: it.primary ? 700 : 500, color: it.primary ? col(it.color) : C.inkSoft }}>{it.name}</div>
          ))}
        </div>
      </div>
      {b.foot && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 12, fontStyle: 'italic', lineHeight: 1.5 }}>{b.foot}</div>}
    </div>
  );
}

// ── lollipop: stem + dot, for rates/percentages compared side by side ───────
function Lollipop({ b }) {
  const [hov, setHov] = useState(null);
  const max = Math.max(...b.items.map((it) => it.value)) * 1.12;
  const sorted = [...b.items].sort((p, q) => p.value - q.value);
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 18px' }}>
        {sorted.map((it) => {
          const i = b.items.indexOf(it);
          const on = hov === i;
          const c = col(it.color);
          return (
            <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: it === sorted[sorted.length - 1] ? 0 : 14, opacity: hov === null || on ? 1 : 0.55, transition: 'opacity .12s' }}>
              <div style={{ width: 108, flexShrink: 0, fontSize: 12.5, fontWeight: it.primary ? 700 : 500, color: C.ink }}>{it.name}</div>
              <div style={{ flex: 1, position: 'relative', height: 8 }}>
                <div style={{ position: 'absolute', top: 3, left: 0, right: 0, height: 2, background: C.track }} />
                <div style={{ position: 'absolute', top: 3, left: 0, height: 2, background: c, width: `${(it.value / max) * 100}%`, borderRadius: 2 }} />
                <div style={{ position: 'absolute', top: -2, left: `${(it.value / max) * 100}%`, transform: 'translateX(-50%)', width: 12, height: 12, borderRadius: '50%', background: c, boxShadow: on ? `0 0 0 4px color-mix(in srgb, ${c} 20%, transparent)` : 'none' }} />
              </div>
              <div style={{ width: 56, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: c }}>{it.display}</div>
            </div>
          );
        })}
      </div>
      {b.foot && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 12, fontStyle: 'italic', lineHeight: 1.5 }}>{b.foot}</div>}
    </div>
  );
}

// ── quadrant: 2×2 strategic positioning map ─────────────────────────────────
// Discrete placement in a labeled box rather than a precise numeric scatter —
// reads as "where does each player sit" rather than "what are the coordinates".
function Quadrant({ b }) {
  const [hov, setHov] = useState(null);
  const S = 420;
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '20px 24px 16px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: S, height: S, flexShrink: 0 }}>
          {/* axis labels */}
          <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 10, letterSpacing: '.06em', color: C.inkSoft, whiteSpace: 'nowrap' }}>{b.y.top}</div>
          <div style={{ position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 10, letterSpacing: '.06em', color: C.inkSoft, whiteSpace: 'nowrap' }}>{b.y.bottom}</div>
          <div style={{ position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%) rotate(-90deg) translateY(-50%)', transformOrigin: 'left center', fontSize: 10, letterSpacing: '.06em', color: C.inkSoft, whiteSpace: 'nowrap' }}>{b.x.left}</div>
          <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%) rotate(90deg) translateY(-50%)', transformOrigin: 'right center', fontSize: 10, letterSpacing: '.06em', color: C.inkSoft, whiteSpace: 'nowrap' }}>{b.x.right}</div>
          {/* box */}
          <div style={{ position: 'absolute', inset: 0, border: `1px solid ${C.line}`, borderRadius: 10 }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: C.lineSoft }} />
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: C.lineSoft }} />
          </div>
          {/* points — x,y in [0,1], 0=left/top per axis labels above */}
          {b.items.map((it, i) => {
            const on = hov === i;
            const c = col(it.color);
            const left = it.x * 100, top = it.y * 100;
            return (
              <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
                style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, transform: 'translate(-50%,-50%)', cursor: 'pointer', textAlign: 'center', zIndex: on ? 5 : 1 }}>
                <div style={{ width: it.primary ? 18 : 13, height: it.primary ? 18 : 13, borderRadius: '50%', background: c, opacity: on || it.primary ? 1 : 0.8, border: it.primary ? `2px solid color-mix(in srgb, ${C.ink} 33%, transparent)` : 'none', margin: '0 auto', boxShadow: on ? `0 0 0 6px color-mix(in srgb, ${c} 18%, transparent)` : 'none', transition: 'box-shadow .15s' }} />
                <div style={{ marginTop: 5, fontSize: 11.5, fontWeight: it.primary ? 700 : 500, color: on || it.primary ? C.ink : C.inkSoft, whiteSpace: 'nowrap' }}>{it.name}</div>
                {on && it.note && (
                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 4, width: 190, background: C.cardAlt, border: `1px solid ${C.line}`, borderRadius: 7, padding: '7px 10px', zIndex: 6, pointerEvents: 'none', boxShadow: '0 6px 20px rgba(0,0,0,.4)' }}>
                    <div style={{ fontSize: 11, color: C.inkSoft, lineHeight: 1.45 }}>{it.note}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {b.foot && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 12, fontStyle: 'italic', lineHeight: 1.5 }}>{b.foot}</div>}
    </div>
  );
}

// ── mix: per-company segment-composition mini-bars ──────────────────────────
function Mix({ b }) {
  const t = useT();
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${b.min || 240}px, 1fr))`, gap: 14 }}>
        {b.items.map((co, i) => {
          const max = Math.max(...co.segments.map((s) => s.pct));
          return (
            <div key={i} style={{ background: C.card, border: `1px solid ${co.primary ? `color-mix(in srgb, ${col(co.color)} 40%, transparent)` : C.line}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 13.5, fontWeight: co.primary ? 700 : 600, color: C.ink, marginBottom: 10 }}>{co.name}</div>
              {co.segments.map((s, si) => (
                <div key={si} style={{ marginBottom: si < co.segments.length - 1 ? 7 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.inkSoft, marginBottom: 2 }}>
                    <span>{s.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', color: C.inkFaint }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 7, background: C.track, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(s.pct / max) * 100}%`, height: '100%', background: col(co.color), opacity: 0.4 + 0.6 * (s.pct / max), borderRadius: 3 }} />
                  </div>
                </div>
              ))}
              {co.note && <div style={{ fontSize: 10.5, color: C.inkFaint, marginTop: 9, lineHeight: 1.4, fontStyle: 'italic' }}>{co.note}</div>}
            </div>
          );
        })}
      </div>
      {b.foot && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 12, fontStyle: 'italic', lineHeight: 1.5 }}>{b.foot}</div>}
    </div>
  );
}

// ── moat: two-column strategic wins-vs-gaps analysis ────────────────────────
// Left column = durable structural advantages (where BN clearly wins), right
// column = where it competes but lags. Each item carries a strength meter and
// a "vs whom" chip so the comparison is decision-legible, not just descriptive.
// ── posgrid: strategic positioning heatmap (segments × players) ─────────────
// Shows at a glance where each manager leads vs lags across asset classes —
// the real "moat map". Optional catalysts strip highlights the unique edge.
// A function of `t`, not a frozen const: t() at module scope runs at import
// time, before any component can supply it, and the ReferenceError takes the
// whole bundle down — a blank page, not a missing label.
const posLevels = (t) => ({
  lead:    { label: t('Лидер', 'Leader'),   bg: C.teal,         fg: '#0b0b0c', bd: C.teal },
  strong:  { label: t('Сильный', 'Strong'), bg: `color-mix(in srgb, ${C.teal} 18%, transparent)`,  fg: C.teal,    bd: `color-mix(in srgb, ${C.teal} 33%, transparent)` },
  present: { label: t('Есть', 'Present'),    bg: C.track,        fg: C.inkSoft, bd: C.line },
  lag:     { label: t('Слабо', 'Weak'),   bg: 'transparent',  fg: C.clay,    bd: `color-mix(in srgb, ${C.clay} 33%, transparent)` },
});
function PosGrid({ b }) {
  const t = useT();
  const [hov, setHov] = useState(null);
  const players = b.players || [];
  const hl = b.highlight ?? 0;
  const gridCols = `minmax(148px, 1.5fr) repeat(${players.length}, minmax(84px, 1fr))`;
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      {b.takeaway && (
        <div style={{ background: C.cardAlt, borderLeft: `3px solid ${C.teal}`, borderRadius: 8, padding: '13px 16px', marginBottom: 16, fontSize: 13.5, color: C.ink, lineHeight: 1.6 }}>{b.takeaway}</div>
      )}
      <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 10 }}>
        <div style={{ minWidth: 560 }}>
          {/* header */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, background: C.cardAlt, borderBottom: `1px solid ${C.line}` }}>
            <div style={{ padding: '11px 14px', fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: C.inkSoft, fontWeight: 600 }}>{t('Сегмент', 'Segment')}</div>
            {players.map((p, i) => (
              <div key={i} style={{ padding: '11px 8px', textAlign: 'center', fontSize: 11.5, fontWeight: i === hl ? 700 : 500, color: i === hl ? C.teal : C.inkSoft, background: i === hl ? `color-mix(in srgb, ${C.teal} 7%, transparent)` : 'transparent', borderLeft: `1px solid ${C.lineSoft}` }}>{p}</div>
            ))}
          </div>
          {/* rows */}
          {b.segments.map((seg, ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: gridCols, borderTop: ri ? `1px solid ${C.lineSoft}` : 'none', background: ri % 2 ? C.card : 'transparent' }}>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 500, lineHeight: 1.3 }}>{seg.label}</div>
                {seg.sub && <div style={{ fontSize: 10.5, color: C.inkFaint, marginTop: 2 }}>{seg.sub}</div>}
              </div>
              {seg.cells.map((c, ci) => {
                const lv = posLevels(t)[c.level] || posLevels(t).present;
                const key = ri + '-' + ci;
                const on = hov === key;
                return (
                  <div key={ci} style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, borderLeft: `1px solid ${C.lineSoft}`, background: ci === hl ? `color-mix(in srgb, ${C.teal} 3%, transparent)` : 'transparent', cursor: c.note ? 'pointer' : 'default', position: 'relative' }}
                    onMouseEnter={() => setHov(key)} onMouseLeave={() => setHov(null)}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 11, background: lv.bg, color: lv.fg, border: `1px solid ${lv.bd}`, whiteSpace: 'nowrap' }}>{c.label || lv.label}</span>
                    {c.metric && <span style={{ fontSize: 9.5, color: C.inkFaint, textAlign: 'center', lineHeight: 1.2 }}>{c.metric}</span>}
                    {on && c.note && (
                      <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 4, background: C.cardAlt, border: `1px solid ${C.line}`, borderRadius: 6, padding: '6px 10px', width: 180, zIndex: 6, pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>
                        <div style={{ fontSize: 11, color: C.inkSoft, lineHeight: 1.45 }}>{c.note}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 12 }}>
        {['lead', 'strong', 'present', 'lag'].map((k) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: posLevels(t)[k].bg === 'transparent' ? 'transparent' : posLevels(t)[k].bg, border: `1px solid ${posLevels(t)[k].bd}` }} />
            <span style={{ fontSize: 10.5, color: C.inkSoft }}>{posLevels(t)[k].label}</span>
          </div>
        ))}
        <span style={{ fontSize: 10.5, color: C.inkFaint, fontStyle: 'italic' }}>{t('наведите на ячейку — детали', 'hover a cell for details')}</span>
      </div>
      {/* catalysts strip */}
      {b.catalysts && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: '.05em', textTransform: 'uppercase', color: C.teal, fontWeight: 700, marginBottom: 11 }}>{b.catalysts.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
            {b.catalysts.items.map((it, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.teal}`, borderRadius: 8, padding: '11px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 600 }}>{it.who}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: C.teal, fontWeight: 600, whiteSpace: 'nowrap' }}>{it.mag}</span>
                </div>
                <div style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.4 }}>{it.what}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Moat({ b }) {
  const t = useT();
  const [hov, setHov] = useState(null);
  const renderCol = (items, side, accent, heading) => (
    <div style={{ flex: 1, minWidth: 280 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
        <div style={{ width: 3, height: 15, background: accent, borderRadius: 2 }} />
        <div style={{ fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', color: accent, fontWeight: 700 }}>{heading}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => {
          const key = side + i;
          const on = hov === key;
          return (
            <div key={i}
              onMouseEnter={() => setHov(key)} onMouseLeave={() => setHov(null)}
              style={{ background: C.card, border: `1px solid ${on ? `color-mix(in srgb, ${accent} 47%, transparent)` : C.line}`, borderRadius: 9, padding: '13px 15px', transition: 'border-color .15s' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, lineHeight: 1.35 }}>{it.title}</div>
                {it.strength != null && (
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0, marginTop: 5 }} title={`Сила преимущества ${it.strength}/5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} style={{ width: 6, height: 6, borderRadius: '50%', background: n <= it.strength ? accent : C.track }} />
                    ))}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55, marginBottom: it.vs ? 9 : 0 }}>{it.body}</div>
              {it.vs && <span style={{ fontSize: 10.5, fontFamily: 'var(--mono)', color: accent, background: `color-mix(in srgb, ${accent} 9%, transparent)`, border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)`, borderRadius: 5, padding: '2px 8px' }}>{it.vs}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      {b.verdict && (
        <div style={{ background: C.cardAlt, borderLeft: `3px solid ${C.teal}`, borderRadius: 8, padding: '14px 18px', marginBottom: 18 }}>
          <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: C.teal, fontWeight: 700, marginBottom: 6 }}>{t('Тезис для решения', 'The thesis for a decision')}</div>
          <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.6 }}>{b.verdict}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {renderCol(b.wins, 'w', C.teal, b.winsLabel || t('Устойчивый moat — где выигрывает', 'A durable moat — where it wins'))}
        {renderCol(b.gaps, 'g', C.gold, b.gapsLabel || t('Где догоняет или отстаёт', 'Where it is catching up or falling behind'))}
      </div>
    </div>
  );
}

// ── heat: risk rows with level chip + trigger ───────────────────────────────
// A function of `t`, not a frozen const: t() at module scope runs at import
// time, before any component can supply it, and the ReferenceError takes the
// whole bundle down — a blank page, not a missing label.
const levels = (t) => ({
  high: { label: t('ВЫСОКИЙ', 'HIGH'), color: C.clay },
  med: { label: t('СРЕДНИЙ', 'MEDIUM'), color: C.gold },
  low: { label: t('НИЗКИЙ', 'LOW'), color: C.teal },
});

// ── risksplit: the risk map — two origins, side by side ─────────────────────
// Answers "what are the risks and where do they come from" in one screen.
// Left = risks from what the capital is invested in (by sector); right = risks
// from how the holdco earns and values itself. Each row is severity + sector +
// size of exposure + one plain sentence on what actually breaks.
function RiskSplit({ b }) {
  const [hov, setHov] = useState(null);
  const renderGroup = (g, gi) => {
    const accent = col(g.accent || 'clay');
    return (
      <div key={gi} style={{ flex: '1 1 380px', minWidth: 300 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <div style={{ width: 3, height: 15, background: accent, borderRadius: 2 }} />
          <div style={{ fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', color: accent, fontWeight: 700 }}>{g.label}</div>
        </div>
        {g.sub && <div style={{ fontSize: 11.5, color: C.inkFaint, lineHeight: 1.45, marginBottom: 12, paddingLeft: 12 }}>{g.sub}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {g.items.map((it, i) => {
            const lv = levels(t)[it.level] || levels(t).med;
            const key = gi + '-' + i;
            const on = hov === key;
            return (
              <div key={i}
                onMouseEnter={() => setHov(key)} onMouseLeave={() => setHov(null)}
                style={{ background: C.card, border: `1px solid ${on ? `color-mix(in srgb, ${lv.color} 47%, transparent)` : C.line}`, borderLeft: `3px solid ${lv.color}`, borderRadius: 9, padding: '12px 14px', transition: 'border-color .15s' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, lineHeight: 1.35 }}>{it.label}</div>
                  {it.exposure && <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: C.ink, whiteSpace: 'nowrap', flexShrink: 0 }}>{it.exposure}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: `color-mix(in srgb, ${lv.color} 13%, transparent)`, color: lv.color, border: `1px solid color-mix(in srgb, ${lv.color} 33%, transparent)`, fontWeight: 700, letterSpacing: '.06em' }}>{lv.label}</span>
                  {it.sector && <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, background: C.track, color: C.inkSoft, border: `1px solid ${C.line}` }}>{it.sector}</span>}
                  {it.share && <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.inkFaint }}>{it.share}</span>}
                </div>
                {it.line && <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55 }}>{it.line}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      {b.takeaway && (
        <div style={{ background: C.cardAlt, borderLeft: `3px solid ${C.teal}`, borderRadius: 8, padding: '14px 18px', marginBottom: 18 }}>
          {b.takeawayLabel && <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: C.teal, fontWeight: 700, marginBottom: 6 }}>{b.takeawayLabel}</div>}
          <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.6 }}>{b.takeaway}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {b.groups.map(renderGroup)}
      </div>
      {b.foot && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 14, fontStyle: 'italic', lineHeight: 1.5 }}>{b.foot}</div>}
    </div>
  );
}

// ── scenarios: trigger → chain → price outcome → what to track ──────────────
// Each card is one way the future actually resolves, with a probability, the
// event that starts it, the causal chain in ordered steps, the effect on value
// per share, and the single observable that tells you it's happening.
function Scenarios({ b }) {
  const t = useT();
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${b.min || 290}px, 1fr))`, gap: 12 }}>
        {b.items.map((s, i) => {
          const c = col(s.color);
          return (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderTop: `3px solid ${c}`, borderRadius: 10, padding: '15px 16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 500, color: C.ink }}>{s.name}</span>
                {s.prob && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `color-mix(in srgb, ${c} 13%, transparent)`, color: c, border: `1px solid color-mix(in srgb, ${c} 33%, transparent)`, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.prob}</span>}
              </div>
              {s.value && (
                <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.lineSoft}` }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 19, fontWeight: 500, color: c, lineHeight: 1.15 }}>{s.value}</div>
                  {s.valueLabel && <div style={{ fontSize: 10.5, color: C.inkFaint, marginTop: 3, lineHeight: 1.4 }}>{s.valueLabel}</div>}
                </div>
              )}
              {s.trigger && (
                <div style={{ marginBottom: 11 }}>
                  <div style={{ fontSize: 9.5, letterSpacing: '.07em', textTransform: 'uppercase', color: C.gold, fontWeight: 700, marginBottom: 4 }}>{t('Что запускает', 'What triggers it')}</div>
                  <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>{s.trigger}</div>
                </div>
              )}
              {s.chain && (
                <div style={{ marginBottom: 11 }}>
                  <div style={{ fontSize: 9.5, letterSpacing: '.07em', textTransform: 'uppercase', color: C.inkSoft, fontWeight: 700, marginBottom: 6 }}>{t('Как разворачивается', 'How it unfolds')}</div>
                  {s.chain.map((step, si) => (
                    <div key={si} style={{ display: 'flex', gap: 8, marginBottom: si < s.chain.length - 1 ? 6 : 0 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: c, flexShrink: 0, marginTop: 2, width: 12 }}>{si + 1}</span>
                      <span style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>{step}</span>
                    </div>
                  ))}
                </div>
              )}
              {s.track && (
                <div style={{ marginTop: 'auto', paddingTop: 11, borderTop: `1px solid ${C.lineSoft}` }}>
                  <div style={{ fontSize: 9.5, letterSpacing: '.07em', textTransform: 'uppercase', color: C.teal, fontWeight: 700, marginBottom: 4 }}>{t('Что отслеживать', 'What to watch')}</div>
                  <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.5 }}>{s.track}</div>
                </div>
              )}
              {s.action && (
                <div style={{ marginTop: 10, background: `color-mix(in srgb, ${c} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 27%, transparent)`, borderRadius: 7, padding: '9px 11px' }}>
                  <div style={{ fontSize: 9.5, letterSpacing: '.07em', textTransform: 'uppercase', color: c, fontWeight: 700, marginBottom: 3 }}>{t('Решение', 'Decision')}</div>
                  <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.5 }}>{s.action}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {b.foot && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 14, fontStyle: 'italic', lineHeight: 1.5 }}>{b.foot}</div>}
    </div>
  );
}
function Heat({ b }) {
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
        {b.items.map((r, i) => {
          const lv = levels(t)[r.level] || levels(t).med;
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 14, padding: '13px 16px', borderTop: i ? `1px solid ${C.lineSoft}` : 'none', background: i % 2 ? C.card : 'transparent' }}>
              <div><span style={{ fontSize: 9.5, padding: '3px 8px', borderRadius: 10, background: `color-mix(in srgb, ${lv.color} 13%, transparent)`, color: lv.color, border: `1px solid color-mix(in srgb, ${lv.color} 33%, transparent)`, fontWeight: 600, letterSpacing: '.06em' }}>{lv.label}</span></div>
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
              {ev.badge && <div style={{ marginTop: 4, fontSize: 9, padding: '2px 7px', borderRadius: 10, background: `color-mix(in srgb, ${col(ev.color)} 13%, transparent)`, color: col(ev.color), border: `1px solid color-mix(in srgb, ${col(ev.color)} 33%, transparent)`, fontWeight: 600, letterSpacing: '.05em', display: 'inline-block' }}>{ev.badge}</div>}
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
  const openCompany = useContext(OpenCompanyCtx);
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '6px 16px' }}>
        {b.items.map((f, i) => {
          const key = f.k || f.label || '';
          const val = f.v || [f.value, f.detail].filter(Boolean).join(' — ') || '';
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 38%) 1fr', gap: 14, padding: '11px 0', borderTop: i ? `1px solid ${C.lineSoft}` : 'none' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, lineHeight: 1.5 }}>{withLinks(key, f.links, openCompany)}</div>
              <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55 }}>{withLinks(val, f.links, openCompany)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── text: short paragraph (use sparingly) ───────────────────────────────────
function Text({ b }) {
  const render = (s) => {
    if (!s) return null;
    const parts = s.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} style={{ color: C.ink, fontWeight: 600 }}>{p.slice(2, -2)}</strong>
      : p);
  };
  const paragraphs = (b.body || '').split('\n\n');
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      {paragraphs.map((para, i) => (
        <p key={i} style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.65, margin: i < paragraphs.length - 1 ? '0 0 14px' : 0, maxWidth: 760 }}>{render(para)}</p>
      ))}
      {b.foot && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 14, fontStyle: 'italic', lineHeight: 1.5 }}>{b.foot}</div>}
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
function MatrixCell({ it, cc }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{ position: 'relative', fontSize: 11, lineHeight: 1.35, color: C.ink, background: hover ? `color-mix(in srgb, ${cc} 16%, transparent)` : `color-mix(in srgb, ${C.paper} 67%, transparent)`, border: `1px solid color-mix(in srgb, ${cc} 33%, transparent)`, borderLeft: `3px solid ${cc}`, borderRadius: 6, padding: '5px 8px', cursor: it.desc ? 'pointer' : 'default', transition: 'background .15s' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {it.label}
      {hover && it.desc && (
        <div style={{ position: 'absolute', left: 0, top: '100%', marginTop: 4, zIndex: 50, width: 300, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 12px', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
          <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.55 }}>{it.desc}</div>
        </div>
      )}
    </div>
  );
}

function Matrix({ b }) {
  const t = useT();
  const X = b.x || [t('Низкая', 'Low'), t('Средняя', 'Medium'), t('Высокая', 'High')];
  const Y = b.y || [t('Высокое', 'High'), t('Среднее', 'Medium'), t('Низкое', 'Low')];
  const sevCol = (px, iy) => { const s = px + (Y.length - 1 - iy); return s >= 3 ? C.clay : s === 2 ? C.gold : C.teal; };
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 18px', overflowX: 'auto' }}>
        <div style={{ textAlign: 'center', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 8, fontWeight: 600 }}>
          Вероятность →
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `30px 56px repeat(${X.length}, 1fr)`, gap: 6, minWidth: 560 }}>
          <div style={{ gridRow: `1 / ${Y.length + 2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkSoft, fontWeight: 600 }}>{t('Влияние ↑', 'Impact ↑')}</span>
          </div>
          <div />
          {X.map((x, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkSoft, padding: '4px 0' }}>{x}</div>)}
          {Y.map((y, iy) => (
            [<div key={`y${iy}`} style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', textAlign: 'right', lineHeight: 1.2 }}>{y}</div>,
              ...X.map((_, ix) => {
                const cell = (b.items || []).filter((it) => it.px === ix && it.py === (Y.length - 1 - iy));
                const cc = sevCol(ix, iy);
                return (
                  <div key={`c${iy}-${ix}`} style={{ minHeight: 74, borderRadius: 8, background: `color-mix(in srgb, ${cc} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${cc} 20%, transparent)`, padding: 7, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {cell.map((it, k) => <MatrixCell key={k} it={it} cc={cc} />)}
                  </div>
                );
              })]
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `86px repeat(${X.length}, 1fr)`, gap: 6, marginTop: 8 }}>
          <div />
          <div style={{ fontSize: 9.5, color: `color-mix(in srgb, ${C.teal} 73%, transparent)`, textAlign: 'center' }}>{t('↙ меньше риск', '↙ lower risk')}</div>
          <div />
          <div style={{ fontSize: 9.5, color: `color-mix(in srgb, ${C.clay} 73%, transparent)`, textAlign: 'center' }}>{t('↗ больше риск', '↗ higher risk')}</div>
        </div>
      </div>
    </div>
  );
}

function RadarHeat({ b }) {
  const max = b.max || 5;
  const radar = b.radarItems || [];
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <RadarSvg scores={radar.map(x => x.score)} labels={radar.map(x => x.short || x.axis)} max={max} size={300} fill={col(b.color || 'clay')} showLabels />
        </div>
        <div style={{ borderTop: `1px solid ${C.line}` }}>
          {(b.items || []).map((r, i) => {
            const lv = levels(t)[r.level] || levels(t).med;
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 14, padding: '13px 16px', borderTop: i ? `1px solid ${C.lineSoft}` : 'none', background: i % 2 ? 'transparent' : C.card }}>
                <div><span style={{ fontSize: 9.5, padding: '3px 8px', borderRadius: 10, background: `color-mix(in srgb, ${lv.color} 13%, transparent)`, color: lv.color, border: `1px solid color-mix(in srgb, ${lv.color} 33%, transparent)`, fontWeight: 600, letterSpacing: '.06em' }}>{lv.label}</span></div>
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
    </div>
  );
}

// ── chains: how a risk transmits from asset level up to the holdco ──────────
// Each card is one channel by which an asset-level loss actually reaches the
// shareholder — an anchor number, then the causal chain as ordered steps, then
// the caveat that keeps the number honest. Channels are additive, not
// alternatives: one bad outcome can arrive through all three at once.
function Chains({ b }) {
  return (
    <div>
      <Title note={b.note}>{b.title}</Title>
      {b.takeaway && (
        <div style={{ background: C.cardAlt, borderLeft: `3px solid ${C.teal}`, borderRadius: 8, padding: '13px 16px', marginBottom: 16, fontSize: 13.5, color: C.ink, lineHeight: 1.6 }}>{b.takeaway}</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${b.min || 300}px, 1fr))`, gap: 12 }}>
        {b.items.map((ch, i) => {
          const c = col(ch.color);
          return (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderTop: `3px solid ${c}`, borderRadius: 10, padding: '15px 16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 10, letterSpacing: '.07em', textTransform: 'uppercase', color: c, fontWeight: 700, marginBottom: 9 }}>{ch.name}</div>
              {ch.anchor && (
                <div style={{ marginBottom: 13, paddingBottom: 13, borderBottom: `1px solid ${C.lineSoft}` }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 21, fontWeight: 500, color: C.ink, lineHeight: 1.1 }}>{ch.anchor}</div>
                  {ch.anchorLabel && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 4, lineHeight: 1.45 }}>{ch.anchorLabel}</div>}
                </div>
              )}
              {ch.steps && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {ch.steps.map((s, si) => (
                    <div key={si}>
                      <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: c, flexShrink: 0, marginTop: 6 }} />
                        <span style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>{s}</span>
                      </div>
                      {si < ch.steps.length - 1 && (
                        <div style={{ marginLeft: 2.5, width: 1, height: 12, background: `color-mix(in srgb, ${c} 33%, transparent)` }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {ch.note && (
                <div style={{ marginTop: 'auto', paddingTop: 12, fontSize: 11, color: C.inkFaint, fontStyle: 'italic', lineHeight: 1.5 }}>{ch.note}</div>
              )}
            </div>
          );
        })}
      </div>
      {b.foot && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 14, fontStyle: 'italic', lineHeight: 1.5 }}>{b.foot}</div>}
    </div>
  );
}

const RENDER = { stats: Stats, table: DataTable, cards: Cards, bars: Bars, pie: Pie, compare: Compare, moat: Moat, posgrid: PosGrid, flows: Flows, heat: Heat, timeline: Timeline, quote: Quote, facts: Facts, text: Text, radar: Radar, snowflakes: Snowflakes, matrix: Matrix, 'radar-heat': RadarHeat, risksplit: RiskSplit, scenarios: Scenarios, chains: Chains, dumbbell: Dumbbell, columns: Columns, lollipop: Lollipop, quadrant: Quadrant, mix: Mix, bets: Bets };

export default function SectionDeep({ blocks, onOpenCompany }) {
  if (!blocks || !blocks.length) return null;
  const groups = [];
  blocks.forEach(b => {
    if (b.row && groups.length && groups[groups.length - 1][0]?.row === b.row) {
      groups[groups.length - 1].push(b);
    } else {
      groups.push([b]);
    }
  });
  return (
    <OpenCompanyCtx.Provider value={onOpenCompany}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {groups.map((g, gi) => {
          if (g.length === 1) {
            const Cmp = RENDER[g[0].type];
            return Cmp ? <Cmp key={gi} b={g[0]} /> : null;
          }
          return (
            <div key={gi} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {g.map((b, bi) => {
                const Cmp = RENDER[b.type];
                return Cmp ? <div key={bi} style={{ flex: b.flex || 1, minWidth: 0 }}><Cmp b={b} /></div> : null;
              })}
            </div>
          );
        })}
      </div>
    </OpenCompanyCtx.Provider>
  );
}
