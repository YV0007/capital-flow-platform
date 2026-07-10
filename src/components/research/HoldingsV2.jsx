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

import { useState, useEffect, useRef } from 'react';
import holdingsData from '../../data/holdings.json';
import PortfolioDeep from './PortfolioDeep.jsx';
import FinancialDeep from './FinancialDeep.jsx';

const { META, GROUPS, HOLDING_COMPANIES_ORDER, THEMES, companies: HOLD } = holdingsData;
const C = THEMES.dark;

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

const TIERS = [
  { id: 'substance', label: 'Существо — факты для решения', color: C.teal },
  { id: 'context', label: 'Контекст — рамка для фактов', color: C.blue },
  { id: 'voice', label: 'Голос менеджмента', color: C.gold },
  { id: 'signals', label: 'Сигналы и интерпретация', color: C.violet },
];
const tierColor = (t) => (TIERS.find((x) => x.id === t) || {}).color || C.teal;

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
    else if (m[3] != null) out.push(<a key={k++} href={m[4]} target="_blank" rel="noreferrer" style={{ color: C.teal, textDecoration: 'none', borderBottom: `1px solid ${C.teal}44` }}>{m[3]}</a>);
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
            Раскрыть полностью <span>→</span>
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
//  L2 deep view (in-place takeover)
// ═══════════════════════════════════════════════════════════════════════════

function DeepView({ data, idx, setIdx, onBack, portfolio, financial }) {
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
    <main className="rise" style={{ padding: '36px 44px 80px', maxWidth: 880, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: C.teal, fontSize: 13, fontFamily: 'var(--sans)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>← {data.name} · профиль</button>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: C.inkFaint }}>{idx + 1} / {secs.length}</span>
      </div>

      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: col }}>{sec.n} · {(TIERS.find((t) => t.id === sec.tier) || {}).label}</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 500, lineHeight: 1.1, letterSpacing: '-.02em', margin: '0 0 6px', color: C.ink }}>{sec.title}</h1>
      {sec.sub && <p style={{ fontSize: 14, color: C.inkSoft, fontStyle: 'italic', margin: '0 0 22px' }}>{sec.sub}</p>}
      <div style={{ height: 1, background: C.line, margin: '0 0 22px' }} />

      {sec.id === 'portfolio' && portfolio ? <PortfolioDeep data={portfolio} />
        : sec.id === 'financial' && financial ? <FinancialDeep data={financial} />
        : <Md md={sec.bodyMarkdown} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.line}` }}>
        {navBtn(prev, 'prev')}
        {navBtn(next, 'next')}
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Root
// ═══════════════════════════════════════════════════════════════════════════

export default function HoldingsV2() {
  const order = HOLDING_COMPANIES_ORDER.filter((id) => V2[id]);
  const [cid, setCid] = useState(order[0] || 'brookfield');
  const [deepIdx, setDeepIdx] = useState(null); // null = profile (L0), number = L2 section index
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const refs = useRef({});
  const data = V2[cid];

  const switchCompany = (id) => { if (!V2[id]) return; setCid(id); setDeepIdx(null); setSwitcherOpen(false); window.scrollTo({ top: 0 }); };
  const nameOf = (id) => V2[id]?.name || HOLD[id.toUpperCase()]?.name || id;

  if (!data) return <div style={{ padding: 64, color: C.inkSoft }}>Нет мигрированных холдингов.</div>;

  const FONTS = (
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Hanken+Grotesk:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      :root{ --serif:'Newsreader',Georgia,serif; --sans:'Hanken Grotesk',system-ui,sans-serif; --mono:'IBM Plex Mono',ui-monospace,monospace; }
      *{box-sizing:border-box;}
      @keyframes rise{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}} .rise{animation:rise .45s cubic-bezier(.2,.7,.2,1) both;}
      .navlink{transition:color .15s,border-color .15s;cursor:pointer;}`}</style>
  );

  return (
    <div style={{ background: C.paper, minHeight: '100vh', fontFamily: 'var(--sans)', color: C.ink }}>
      {FONTS}
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '224px 1fr' }}>

        {/* ── Sidebar ── */}
        <aside style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', padding: '34px 22px 36px 30px', borderRight: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 8 }}>Холдинг</div>
          <div style={{ position: 'relative', marginBottom: 22, zIndex: 50 }}>
            <button onClick={() => setSwitcherOpen(!switcherOpen)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${switcherOpen ? C.teal : C.line}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 7, background: META[cid]?.color || C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: (META[cid]?.mono || '').length > 2 ? 10 : 12, fontWeight: 600, color: '#fff' }}>{META[cid]?.mono || '·'}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: C.ink, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.name}</span>
                <span style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: C.inkSoft }}>{data.ticker}</span>
              </span>
              <span style={{ flexShrink: 0, color: C.inkSoft, fontSize: 10, transform: switcherOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
            </button>
            {switcherOpen && (
              <>
                <div onClick={() => setSwitcherOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50, background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,.35)', padding: 6, maxHeight: '70vh', overflowY: 'auto' }}>
                  {HOLDING_COMPANIES_ORDER.map((id) => {
                    const on = id === cid, migrated = !!V2[id];
                    return (
                      <button key={id} onClick={() => switchCompany(id)} disabled={!migrated} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: on ? C.cardAlt : 'transparent', border: 'none', borderRadius: 7, padding: '8px 10px', cursor: migrated ? 'pointer' : 'default', textAlign: 'left', opacity: migrated ? 1 : 0.4 }}>
                        <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 6, background: META[id]?.color || C.line, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: (META[id]?.mono || '').length > 2 ? 9 : 11, fontWeight: 600, color: '#fff' }}>{META[id]?.mono}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 13.5, fontWeight: on ? 600 : 500, color: C.ink, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameOf(id)}</span>
                          {!migrated && <span style={{ display: 'block', fontSize: 10, color: C.inkFaint }}>готовится</span>}
                        </span>
                        {on && <span style={{ flexShrink: 0, color: C.teal, fontSize: 12 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 24, lineHeight: 1.4 }}>{data.type}</div>

          {/* tiered nav */}
          <nav>
            {TIERS.map((tier) => {
              const items = data.sections.filter((s) => s.tier === tier.id);
              if (!items.length) return null;
              return (
                <div key={tier.id} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: tier.color, marginBottom: 6 }}>{tier.label}</div>
                  {items.map((sec) => {
                    const gi = data.sections.indexOf(sec);
                    const on = deepIdx === gi;
                    return (
                      <div key={sec.id} className="navlink" onClick={() => setDeepIdx(gi)} style={{ padding: '7px 0 7px 12px', borderLeft: `2px solid ${on ? tier.color : C.line}`, marginBottom: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: on ? tier.color : C.inkFaint, minWidth: 18 }}>{sec.n}</span>
                          <span style={{ fontSize: 13, fontWeight: on ? 600 : 400, color: on ? C.ink : C.inkSoft, lineHeight: 1.25 }}>{sec.title}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── Main ── */}
        {deepIdx != null ? (
          <DeepView data={data} idx={deepIdx} setIdx={setDeepIdx} onBack={() => { setDeepIdx(null); window.scrollTo({ top: 0 }); }} portfolio={PORT[cid]} financial={FIN[cid]} />
        ) : (
          <main className="rise" key={cid} style={{ padding: '40px 44px 80px' }}>
            <header style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 14 }}><span>{data.type}</span><span style={{ color: C.inkFaint }}>·</span><span>{data.asOf}</span></div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 44, fontWeight: 500, lineHeight: 1.05, letterSpacing: '-.02em', margin: '0 0 14px' }}>{data.name}</h1>
              {(data.about || data.tagline) && <p style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.55, color: C.ink, maxWidth: 760, margin: '0 0 18px' }}>{data.about || data.tagline}</p>}
              {data.aboutMeta && data.aboutMeta.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px', marginBottom: 20, paddingBottom: 18, borderBottom: `1px solid ${C.line}` }}>
                  {data.aboutMeta.map((m, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontSize: 13, color: C.ink }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              )}
              {data.aboutBusiness && data.aboutBusiness.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 10 }}>Чем занимается</div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`, gap: 10 }}>
                    {data.aboutBusiness.map((b, i) => (
                      <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 9, padding: '13px 15px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 5 }}>{b.title}</div>
                        <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>{b.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.aboutRecent && data.aboutRecent.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 10 }}>Недавние шаги</div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: 10 }}>
                    {data.aboutRecent.map((b, i) => (
                      <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.teal}`, borderRadius: 9, padding: '13px 15px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 5 }}>{b.title}</div>
                        <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55 }}>{b.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.kpis && data.kpis.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.kpis.length},1fr)`, gap: 1, background: C.line, border: `1px solid ${C.line}`, borderRadius: 10 }}>
                  {data.kpis.map((k, i) => (
                    <div key={i} style={{ background: C.card, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 6 }}>{k.label}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 500, lineHeight: 1.05, color: C.ink }}>{k.value}</div>
                      {k.sub && <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.inkFaint, marginTop: 4, lineHeight: 1.4 }}>{k.sub}</div>}
                    </div>
                  ))}
                </div>
              )}
            </header>

            {TIERS.map((tier) => {
              const items = data.sections.filter((s) => s.tier === tier.id);
              if (!items.length) return null;
              return (
                <div key={tier.id} style={{ marginBottom: 30 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: tier.color, fontWeight: 600 }}>{tier.label}</span>
                    <span style={{ flex: 1, height: 1, background: C.line }} />
                  </div>
                  {items.map((sec) => <PreviewCard key={sec.id} sec={sec} onOpen={() => setDeepIdx(data.sections.indexOf(sec))} />)}
                </div>
              );
            })}

            {(data.gaps?.length || data.verification) && (
              <footer style={{ marginTop: 30, paddingTop: 22, borderTop: `1px solid ${C.line}` }}>
                {data.verification && (
                  <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.6, marginBottom: data.gaps?.length ? 14 : 0 }}>
                    <span style={{ fontWeight: 600, color: C.ink }}>Статус верификации. </span>{data.verification}
                  </div>
                )}
                {data.gaps?.length > 0 && (
                  <details style={{ fontSize: 12, color: C.inkSoft }}>
                    <summary style={{ cursor: 'pointer', color: C.gold, fontWeight: 600 }}>Пробелы и неподтверждённое ({data.gaps.length})</summary>
                    <ul style={{ marginTop: 10, paddingLeft: 18 }}>{data.gaps.map((g, i) => <li key={i} style={{ marginBottom: 5, lineHeight: 1.55 }}>{g}</li>)}</ul>
                  </details>
                )}
              </footer>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
