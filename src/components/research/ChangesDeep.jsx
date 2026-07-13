// ChangesDeep — bespoke section 02 view for Brookfield.
// Sankey (sources → destinations with hover), then a merged timeline of
// recent moves + forward pipeline items, styled with importance and type.
// Data: sections[].preview is ignored here; source is data.changesDeep on the
// company JSON. Dark mode only.

import { useMemo, useState } from 'react';
import holdingsData from '../../data/holdings.json';

const C = holdingsData.THEMES.dark;

// ─────────────────────────────────────────────────────────────────────────
// Sankey — SVG, no library. Bars on both sides sized by total,
// bezier flows between them with width proportional to value; hover
// highlights one flow and shows a floating tooltip.
// ─────────────────────────────────────────────────────────────────────────

function Sankey({ sankey }) {
  const [hover, setHover] = useState(null); // flow index

  const layout = useMemo(() => {
    const W = 1500, H = 720, gap = 22, barW = 10, labelPad = 330;
    const leftX = labelPad, rightX = W - labelPad - barW;

    const norm = (nodes) => {
      const total = nodes.reduce((s, n) => s + n.value, 0);
      const usable = H - gap * (nodes.length - 1);
      let y = 0;
      return nodes.map((n) => {
        const h = Math.max(48, (n.value / total) * usable);
        const rec = { ...n, y, h };
        y += h + gap;
        return rec;
      });
    };

    const sources = norm(sankey.sources);
    const dests = norm(sankey.destinations);

    const bySrc = {}, byDest = {};
    sources.forEach((s) => { bySrc[s.id] = { ...s, used: 0, sum: 0 }; });
    dests.forEach((d) => { byDest[d.id] = { ...d, used: 0, sum: 0 }; });
    sankey.flows.forEach((f) => { bySrc[f.from].sum += f.value; byDest[f.to].sum += f.value; });

    const flows = sankey.flows.map((f, i) => {
      const s = bySrc[f.from], d = byDest[f.to];
      const sH = (f.value / s.sum) * s.h;
      const dH = (f.value / d.sum) * d.h;
      const y0 = s.y + s.used + sH / 2;
      const y1 = d.y + d.used + dH / 2;
      s.used += sH; d.used += dH;
      const thickness = Math.max(sH, dH);
      const midX = (leftX + barW + rightX) / 2;
      const x0 = leftX + barW, x1 = rightX;
      const path = `M${x0} ${y0} C${midX} ${y0}, ${midX} ${y1}, ${x1} ${y1}`;
      return { ...f, i, path, thickness, color: s.color, y0, y1 };
    });

    return { W, H, leftX, rightX, barW, labelPad, sources, dests, flows };
  }, [sankey]);

  const activeFlow = hover != null ? layout.flows[hover] : null;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '16px 18px' }}>
      <style>{`@keyframes flowwave{to{stroke-dashoffset:-24;}} .flowwave{animation:flowwave 2.2s linear infinite;}`}</style>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: C.inkFaint }}>
        <span>Откуда</span>
        <span>Куда</span>
      </div>
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${layout.W} ${layout.H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }} onMouseLeave={() => setHover(null)}>
          {/* flows first (behind bars) — deBridge-style: keep everything visible,
              only slightly brighten the hovered one */}
          <g>{layout.flows.map((f, i) => (
            <path key={i} d={f.path} fill="none" stroke={f.color} strokeWidth={f.thickness}
              strokeOpacity={hover === i ? 0.6 : 0.32}
              style={{ transition: 'stroke-opacity .18s', cursor: 'pointer' }}
              onMouseEnter={() => setHover(i)} />
          ))}</g>
          {/* direction — soft wave dashes drifting along each stream centreline */}
          <g pointerEvents="none">{layout.flows.map((f, i) => (
            <path key={i} d={f.path} fill="none" stroke="#fff" className="flowwave"
              strokeWidth={Math.min(2.2, Math.max(1.2, f.thickness * 0.05))}
              strokeOpacity={hover === i ? 0.4 : 0.14}
              strokeDasharray="4 20" strokeLinecap="round"
              style={{ transition: 'stroke-opacity .18s' }} />
          ))}</g>
          {/* left bars */}
          <g>{layout.sources.map((s) => (
            <g key={s.id}>
              <rect x={layout.leftX} y={s.y} width={layout.barW} height={s.h} fill={s.color} rx="3" />
              <text x={layout.leftX - 14} y={s.y + s.h / 2 - 4} textAnchor="end" fill={C.ink} fontSize="15" fontFamily="var(--sans)" fontWeight="500">{s.name}</text>
              <text x={layout.leftX - 14} y={s.y + s.h / 2 + 14} textAnchor="end" fill={C.inkFaint} fontSize="11" fontFamily="var(--mono)">{s.note}</text>
            </g>
          ))}</g>
          {/* right bars */}
          <g>{layout.dests.map((d) => (
            <g key={d.id}>
              <rect x={layout.rightX} y={d.y} width={layout.barW} height={d.h} fill={d.color} rx="3" />
              <text x={layout.rightX + layout.barW + 14} y={d.y + d.h / 2 - 4} fill={C.ink} fontSize="15" fontFamily="var(--sans)" fontWeight="500">{d.name}</text>
              <text x={layout.rightX + layout.barW + 14} y={d.y + d.h / 2 + 14} fill={C.inkFaint} fontSize="11" fontFamily="var(--mono)">{d.note}</text>
            </g>
          ))}</g>
        </svg>
        {activeFlow && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: '#000', border: `1px solid ${activeFlow.color}`, borderRadius: 8, padding: '10px 14px', maxWidth: 380, boxShadow: '0 10px 30px rgba(0,0,0,.6)', pointerEvents: 'none' }}>
            <div style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: activeFlow.color, marginBottom: 4 }}>Поток</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: '#fff', marginBottom: 4 }}>${activeFlow.value} млрд</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', lineHeight: 1.4 }}>{activeFlow.label}</div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 34, fontSize: 11, color: C.inkFaint, fontStyle: 'italic', textAlign: 'right' }}>Наведи курсор на поток — покажет объём и назначение. Ширина = размер потока.</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TimelineItem — single deal / event card
// ─────────────────────────────────────────────────────────────────────────

const TYPE_META = {
  acquisition: { label: 'Покупка',        color: C.teal },
  divestment:  { label: 'Продажа',        color: C.gold },
  deal:        { label: 'Контракт',       color: C.teal },
  program:     { label: 'Программа',      color: C.violet },
  internal:    { label: 'Корп-действие',  color: C.blue },
  earnings:    { label: 'Отчёт',          color: C.inkSoft },
  ipo:         { label: 'IPO',            color: C.teal },
};

function TimelineItem({ ev, forward }) {
  const [open, setOpen] = useState(false);
  const t = TYPE_META[ev.type] || { label: ev.type, color: C.inkSoft };
  const isHigh = ev.importance === 'high';
  const det = ev.detail && typeof ev.detail === 'object' ? ev.detail : null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 20, position: 'relative', paddingLeft: 12 }}>
      {/* rail dot */}
      <div style={{ position: 'absolute', left: -6, top: 20, width: 12, height: 12, borderRadius: 6, background: isHigh ? t.color : C.card, border: `2px solid ${t.color}` }} />
      <div style={{ paddingTop: 14 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.inkSoft }}>{ev.date}</div>
        <div style={{ marginTop: 6, fontSize: 9.5, padding: '2px 8px', borderRadius: 10, background: t.color + '22', color: t.color, border: `1px solid ${t.color}55`, fontWeight: 600, letterSpacing: '.06em', display: 'inline-block' }}>{t.label.toUpperCase()}</div>
      </div>
      <div onClick={() => det && setOpen(!open)}
        style={{ background: C.card, border: `1px solid ${open ? t.color + '66' : C.line}`, borderLeft: `3px solid ${isHigh ? t.color : C.line}`, borderRadius: 10, padding: '14px 16px', marginBottom: 12, cursor: det ? 'pointer' : 'default', transition: 'border-color .18s' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: C.ink, flex: 1, lineHeight: 1.3 }}>{ev.title}</span>
          {ev.ai && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: C.violet + '22', color: C.violet, border: `1px solid ${C.violet}55`, fontWeight: 600, letterSpacing: '.06em' }}>AI</span>}
          {forward && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: C.clay + '22', color: C.clay, border: `1px solid ${C.clay}55`, fontWeight: 600, letterSpacing: '.06em' }}>ОБЪЯВЛЕНО</span>}
          {det && <span style={{ fontSize: 11, color: open ? t.color : C.inkFaint, whiteSpace: 'nowrap' }}>{open ? '▾ свернуть' : '▸ подробнее'}</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', marginBottom: 10, fontSize: 12 }}>
          {ev.value && <span><span style={{ color: C.inkFaint }}>Сумма: </span><span style={{ fontFamily: 'var(--mono)', color: C.ink, fontWeight: 500 }}>{ev.value}</span></span>}
          {ev.counterparty && ev.counterparty !== '—' && <span><span style={{ color: C.inkFaint }}>Контрагент: </span><span style={{ color: C.ink }}>{ev.counterparty}</span></span>}
        </div>
        {ev.why && <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6, marginBottom: 6 }}>{ev.why}</div>}
        {/* Expanded detail — what it actually is + numbers + strategic read */}
        {open && det && (
          <div style={{ margin: '12px 0 10px', paddingTop: 12, borderTop: `1px solid ${C.lineSoft}` }}>
            {det.what && <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.65, marginBottom: det.facts?.length || det.read ? 12 : 0 }}>{det.what}</div>}
            {det.facts && det.facts.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 1, background: C.line, border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', marginBottom: det.read ? 12 : 0 }}>
                {det.facts.map((f, i) => (
                  <div key={i} style={{ background: C.cardAlt, padding: '9px 12px' }}>
                    <div style={{ fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 4 }}>{f.k}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: C.ink, lineHeight: 1.35 }}>{f.v}</div>
                  </div>
                ))}
              </div>
            )}
            {det.read && (
              <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.6, borderLeft: `3px solid ${t.color}`, paddingLeft: 12 }}>
                <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: t.color, fontWeight: 600, marginRight: 8 }}>Стратегический смысл</span>
                {det.read}
              </div>
            )}
          </div>
        )}
        {ev.source && <div style={{ fontSize: 10.5, color: C.inkFaint, fontStyle: 'italic' }}>Источник: {ev.source}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
export default function ChangesDeep({ data }) {
  const cd = data;
  if (!cd) return null;

  return (
    <div>
      {/* Stats strip — reading column; only the Sankey goes full-width */}
      {cd.stats && cd.stats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`, gap: 1, background: C.line, border: `1px solid ${C.line}`, borderRadius: 10, margin: '0 auto 20px', maxWidth: 1080 }}>
          {cd.stats.map((s, i) => (
            <div key={i} style={{ background: C.card, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 500, color: C.ink, lineHeight: 1 }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 5, lineHeight: 1.4 }}>{s.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Sankey */}
      {cd.sankey && (
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: '-.01em' }}>Куда текут деньги</div>
              <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 2 }}>Источник → назначение, объём в $ млрд</div>
            </div>
          </div>
          <Sankey sankey={cd.sankey} />
        </div>
      )}

      {/* Timeline: past + pipeline merged — reading column for readability */}
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: '-.01em' }}>Ключевые ходы</div>
          <div style={{ fontSize: 12, color: C.inkFaint }}>красный кружок = крупная сделка</div>
        </div>
        <div style={{ position: 'relative', paddingLeft: 122 }}>
          {/* vertical rail */}
          <div style={{ position: 'absolute', left: 122, top: 0, bottom: 0, width: 2, background: C.line }} />
          {cd.timeline && cd.timeline.map((ev, i) => <TimelineItem key={i} ev={ev} forward={false} />)}
          {cd.pipeline && cd.pipeline.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 20, margin: '20px 0 10px' }}>
                <div />
                <div style={{ fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.clay, fontWeight: 600 }}>Впереди — объявлено, не закрыто</div>
              </div>
              {cd.pipeline.map((ev, i) => <TimelineItem key={'p' + i} ev={ev} forward />)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
