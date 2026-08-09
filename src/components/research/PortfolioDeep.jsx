// PortfolioDeep — deep portfolio breakdown for section 01 «Текущий портфель».
//
// Organized by SECTOR (not by vehicle/platform — that framing tested as
// unintuitive). Top = "where the money is" by sector / geography / theme,
// then collapsible sector blocks → named companies → click a company for an
// inline detail panel (metrics + plain description + why it matters).
//
// Consumes the new sector-first schema; an adapter normalizes the older
// platform-first schema so not-yet-migrated companies still render.
//
// Data: src/data/holdings-v2/portfolio/<id>.json. Dark mode only.

import { useState, useEffect, useRef } from 'react';
import holdingsData from '../../data/holdings.json';

import { C } from './holdingsC.js';
const PALETTE = [C.teal, C.blue, C.violet, C.gold, C.clay, '#5BA6E2', '#8FBF6A', '#C77DBB', '#6CC0C0', '#D6A24A'];

// ── normalize either schema into one render shape ───────────────────────────
function normalize(data) {
  const al = data.allocation || {};
  const themesRaw = al.byTheme || [];
  const themes = themesRaw.map((t) => ({
    title: t.theme || t.name,
    headline: t.headline || t.value || '',
    plain: t.plain || t.note || '',
    items: t.items || [],
  }));
  const composition = (al.bySector && al.bySector.length ? al.bySector : (al.byPlatform || [])).map((x) => ({
    name: x.name, plain: x.plain || x.note || '', pct: x.pct || 0, value: x.value || '',
  }));
  const geo = (al.byGeography || []).map((g) => ({ region: g.region, pct: g.pct || 0 }));

  let blocks;
  if (data.sectors && data.sectors.length) {
    // new sector-first schema — may carry a sub-sector level (subsectors[])
    blocks = data.sectors.map((s) => ({
      id: s.id, name: s.name, plain: s.plain || '', stat: s.stat || '',
      groups: (s.subsectors && s.subsectors.length)
        ? s.subsectors.map((ss) => ({ name: ss.name, blurb: ss.blurb || '', stats: ss.stats || [], rows: ss.companies || [] }))
        : [{ name: null, blurb: '', stats: [], rows: s.companies || [] }],
    }));
  } else {
    // adapter: platform-first → blocks
    blocks = (data.platforms || []).map((p) => ({
      id: p.id, name: p.name, plain: p.role || '',
      stat: p.stats && p.stats[0] ? `${p.stats[0].label}: ${p.stats[0].value}` : '',
      groups: (p.sectors || []).map((s) => ({
        name: s.name, shownOf: s.shownOf,
        rows: (s.assets || []).map((a) => ({ ...a, size: a.size || '' })),
      })),
    }));
  }
  const keyCompanies = blocks.flatMap((b) => b.groups.flatMap((g) => g.rows)).filter((r) => r.key);
  return { summary: data.summary, composition, geo, themes, blocks, keyCompanies, layout: data.layout || 'default' };
}

// ── flat full-portfolio table (Company / Asset Class / Industry / Region) ───
const ALL_GRID = '1fr 160px 180px 180px';

function AllCompaniesTable({ companies, search }) {
  const filtered = search
    ? companies.filter((c) => (c.name + ' ' + c.assetClass + ' ' + c.industry + ' ' + c.region).toLowerCase().includes(search.toLowerCase()))
    : companies;
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? filtered : filtered.slice(0, 30);
  const cols = [['Компания', 'left'], ['Класс актива', 'left'], ['Отрасль', 'left'], ['Регион', 'left']];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: C.inkFaint }}>
          {search ? `${filtered.length} найдено из ${companies.length}` : `${companies.length} компаний`}
        </span>
      </div>
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden', background: C.card }}>
        <div style={{ display: 'grid', gridTemplateColumns: ALL_GRID, gap: 10, padding: '9px 16px', background: C.cardAlt, borderBottom: `1px solid ${C.line}` }}>
          {cols.map(([t, a], i) => <div key={i} style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkFaint, textAlign: a }}>{t}</div>)}
        </div>
        {shown.map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: ALL_GRID, gap: 10, padding: '10px 16px', borderBottom: i < shown.length - 1 ? `1px solid ${C.lineSoft}` : 'none', alignItems: 'baseline' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{c.name}</div>
            <div style={{ fontSize: 11.5, color: C.inkSoft }}>{c.assetClass}</div>
            <div style={{ fontSize: 11.5, color: C.inkSoft }}>{c.industry}</div>
            <div style={{ fontSize: 11.5, color: C.inkFaint }}>{c.region}</div>
          </div>
        ))}
      </div>
      {!showAll && filtered.length > 30 && (
        <button onClick={() => setShowAll(true)} style={{ marginTop: 10, fontSize: 12, padding: '7px 16px', borderRadius: 16, border: `1px solid ${C.line}`, background: 'transparent', color: C.teal, cursor: 'pointer' }}>Показать все {filtered.length}</button>
      )}
      {showAll && filtered.length > 30 && (
        <button onClick={() => setShowAll(false)} style={{ marginTop: 10, fontSize: 12, padding: '7px 16px', borderRadius: 16, border: `1px solid ${C.line}`, background: 'transparent', color: C.teal, cursor: 'pointer' }}>Свернуть</button>
      )}
    </div>
  );
}

// ── value/size cell — never shows "не раскрыто" ─────────────────────────────
function valueCell(r) {
  if (r.valueDisclosed && r.value) return { txt: r.value, mono: true, soft: false };
  if (r.size) return { txt: r.size, mono: false, soft: true };
  return { txt: '', mono: false, soft: true };
}

const ROW_GRID = '1fr 64px 158px 104px 80px 16px';

// Column header for the company tables, so each column is labelled.
function RowHeader() {
  const cols = [['Компания', 'left'], ['Доля', 'right'], ['Оценка / размер', 'right'], ['Регион', 'right'], ['Статус', 'right'], ['', 'right']];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: ROW_GRID, gap: 12, padding: '9px 14px', background: C.cardAlt, borderBottom: `1px solid ${C.line}` }}>
      {cols.map(([h, al], i) => <div key={i} style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkFaint, textAlign: al }}>{h}</div>)}
    </div>
  );
}

function CompanyRow({ r, open, onToggle, focused }) {
  const v = valueCell(r);
  const pending = r.status && /pending|объяв|незакры/i.test(r.status);
  const exiting = r.status && /exit|выход|продаж/i.test(r.status);
  const ref = useRef(null);
  useEffect(() => {
    if (!focused || !ref.current) return;
    // delay so this wins over the section's scroll-to-top on cross-section jump
    const t = setTimeout(() => { if (ref.current) ref.current.scrollIntoView({ block: 'center' }); }, 450);
    return () => clearTimeout(t);
  }, [focused]);
  return (
    <div ref={ref} style={{ borderTop: `1px solid ${C.lineSoft}`, background: open ? C.cardAlt : 'transparent', boxShadow: focused ? `inset 0 0 0 1px ${C.teal}` : 'none', borderRadius: focused ? 6 : 0 }}>
      <div onClick={onToggle} style={{ display: 'grid', gridTemplateColumns: ROW_GRID, gap: 12, alignItems: 'start', padding: '12px 16px', cursor: r.detail ? 'pointer' : 'default' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: C.ink, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            {r.name}
            {r.ai && <span style={{ fontSize: 8.5, padding: '1px 6px', borderRadius: 8, background: `color-mix(in srgb, ${C.violet} 13%, transparent)`, color: C.violet, border: `1px solid color-mix(in srgb, ${C.violet} 33%, transparent)`, fontWeight: 600, letterSpacing: '.06em' }}>AI</span>}
          </div>
          {r.what && <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 2, lineHeight: 1.45 }}>{r.what}</div>}
        </div>
        <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11.5, color: r.stake ? C.inkSoft : C.inkFaint }}>{r.stake || '—'}</div>
        <div style={{ textAlign: 'right' }}>
          {v.txt ? <span style={{ fontFamily: v.mono ? 'var(--mono)' : 'var(--sans)', fontSize: v.mono ? 12.5 : 11.5, fontWeight: v.mono ? 500 : 400, color: v.soft ? C.inkFaint : C.ink }}>{v.txt}</span> : <span style={{ color: C.inkFaint }}>—</span>}
        </div>
        <div style={{ fontSize: 11.5, color: C.inkSoft, textAlign: 'right' }}>{r.geography || '—'}</div>
        <div style={{ textAlign: 'right' }}>
          {pending ? <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8, background: `color-mix(in srgb, ${C.clay} 13%, transparent)`, color: C.clay, border: `1px solid color-mix(in srgb, ${C.clay} 33%, transparent)`, fontWeight: 600 }}>PENDING</span>
            : exiting ? <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8, background: `color-mix(in srgb, ${C.gold} 13%, transparent)`, color: C.gold, border: `1px solid color-mix(in srgb, ${C.gold} 33%, transparent)`, fontWeight: 600 }}>ВЫХОД</span>
            : <span style={{ fontSize: 11, color: C.inkFaint }}>{r.status || ''}</span>}
        </div>
        <div style={{ fontSize: 11, color: C.inkFaint, textAlign: 'right' }}>{r.detail ? (open ? '▾' : '▸') : ''}</div>
      </div>

      {open && r.detail && (
        <div style={{ padding: '6px 18px 18px 18px' }}>
          {r.detail.metrics && r.detail.metrics.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {r.detail.metrics.map((m, i) => (
                <div key={i} style={{ padding: '7px 12px', background: C.card, border: `1px solid ${C.line}`, borderRadius: 7 }}>
                  <div style={{ fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: C.ink }}>{m.value}</div>
                </div>
              ))}
            </div>
          )}
          {r.detail.summary && <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.65, margin: '0 0 8px' }}>{r.detail.summary}</p>}
          {r.detail.whyMatters && (
            <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.55, padding: '8px 12px', background: `color-mix(in srgb, ${C.teal} 6%, transparent)`, border: `1px solid color-mix(in srgb, ${C.teal} 20%, transparent)`, borderRadius: 7 }}>
              <span style={{ fontWeight: 600, color: C.teal }}>Почему важно. </span>{r.detail.whyMatters}
            </div>
          )}
          {r.source && <div style={{ fontSize: 10.5, color: C.inkFaint, marginTop: 8, fontStyle: 'italic' }}>Источник: {r.source}</div>}
        </div>
      )}
    </div>
  );
}

// Level-2: a sub-sector (e.g. Гидро) — key stats + blurb, then its companies.
function Subgroup({ g, forceOpen, focus }) {
  const [open, setOpen] = useState(false);
  const [openRow, setOpenRow] = useState(null);
  const focusIdx = focus ? g.rows.findIndex((r) => r.name === focus) : -1;
  useEffect(() => {
    if (focusIdx >= 0) { setOpen(true); setOpenRow(g.rows[focusIdx].detail ? focusIdx : null); }
  }, [focus, focusIdx]);
  const isOpen = open || forceOpen || focusIdx >= 0;
  const rows = g.rows;
  const Rows = () => rows.map((r, ri) => (
    <CompanyRow key={ri} r={r} open={openRow === ri} focused={focus === r.name} onToggle={() => r.detail && setOpenRow(openRow === ri ? null : ri)} />
  ));
  if (!g.name) return <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden' }}><RowHeader /><Rows /></div>;
  const teaser = g.stats && g.stats[0] ? g.stats[0].value : '';
  return (
    <div style={{ borderTop: `1px solid ${C.line}` }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: 10, alignItems: 'center', background: 'none', border: 'none', padding: '14px 18px', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: 11, color: C.inkFaint }}>{isOpen ? '▾' : '▸'}</span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{g.name}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.inkFaint }}>{rows.length}</span>
        </span>
        {teaser && <span style={{ justifySelf: 'end', fontFamily: 'var(--mono)', fontSize: 12, color: C.teal }}>{teaser}</span>}
      </button>
      {isOpen && (
        <div style={{ padding: '0 18px 14px' }}>
          {g.stats && g.stats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '2px 0 14px' }}>
              {g.stats.map((s, i) => (
                <div key={i} style={{ padding: '9px 14px', background: C.cardAlt, border: `1px solid ${C.line}`, borderRadius: 8 }}>
                  <div style={{ fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 500, color: C.ink, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
          {g.blurb && <p style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.6, margin: '0 0 10px', maxWidth: 640 }}>{g.blurb}</p>}
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden' }}><RowHeader /><Rows /></div>
        </div>
      )}
    </div>
  );
}

// ── filter a sector's groups by search / keyOnly ────────────────────────────
function filterBlock(b, search, keyOnly) {
  const groups = b.groups.map((g) => {
    let rows = g.rows;
    if (search) rows = rows.filter((r) => (r.name + ' ' + (r.what || '')).toLowerCase().includes(search.toLowerCase()));
    if (keyOnly) rows = rows.filter((r) => r.key);
    return { ...g, rows };
  }).filter((g) => g.rows.length);
  const total = groups.reduce((s, g) => s + g.rows.length, 0);
  return { ...b, groups, total };
}

// ── flat layout: all sectors in one continuous list ─────────────────────────
function FlatSectorBlock({ b, filtering, focus }) {
  const [openRow, setOpenRow] = useState(null);
  const total = b.groups.reduce((s, g) => s + g.rows.length, 0);
  if (filtering && total === 0) return null;
  const allRows = b.groups.flatMap((g) => g.rows);
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <h4 style={{ fontFamily: 'var(--serif)', fontSize: 17, fontWeight: 600, color: C.ink, margin: 0 }}>{b.name}</h4>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.inkFaint }}>{total}</span>
      </div>
      {b.plain && <p style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5, margin: '0 0 8px', maxWidth: 680 }}>{b.plain}</p>}
      {b.stat && <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.teal, lineHeight: 1.4, marginBottom: 8 }}>{b.stat}</div>}
      {b.groups.length > 1
        ? b.groups.map((g, gi) => <Subgroup key={gi} g={g} forceOpen={filtering || b.groups.length <= 2} focus={focus} />)
        : (
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden' }}>
            <RowHeader />
            {allRows.map((r, ri) => (
              <CompanyRow key={ri} r={r} open={openRow === ri} focused={focus === r.name} onToggle={() => r.detail && setOpenRow(openRow === ri ? null : ri)} />
            ))}
          </div>
        )}
    </div>
  );
}

// ── left rail: one selectable sector ────────────────────────────────────────
function RailItem({ b, active, onClick, filtering }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer', display: 'block',
      background: active ? C.cardAlt : 'transparent',
      border: 'none', borderLeft: `3px solid ${active ? C.teal : 'transparent'}`,
      padding: '14px 18px', transition: 'background .12s',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 15.5, fontWeight: 500, color: active ? C.ink : C.inkSoft, lineHeight: 1.25, flex: 1, minWidth: 0 }}>{b.name}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: active ? C.teal : C.inkFaint, flexShrink: 0 }}>
          {filtering ? `${b.total} найдено` : b.total}
        </span>
      </div>
      {b.plain && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 3, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.plain}</div>}
    </button>
  );
}

// ── right pane: the selected sector, its stat + companies ───────────────────
function SectorPane({ b, filtering, focus }) {
  if (!b) return null;
  if (filtering && b.total === 0) {
    return <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13, color: C.inkFaint }}>Ничего не найдено в этом секторе</div>;
  }
  return (
    <div>
      <div style={{ padding: '2px 2px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: b.plain ? 7 : 0 }}>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 23, fontWeight: 500, color: C.ink, margin: 0, letterSpacing: '-.01em' }}>{b.name}</h3>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: C.inkFaint }}>{b.total} {filtering ? 'найдено' : 'позиций'}</span>
        </div>
        {b.plain && <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.55, margin: '0 0 10px', maxWidth: 680 }}>{b.plain}</p>}
        {b.stat && <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: C.teal, lineHeight: 1.5 }}>{b.stat}</div>}
      </div>
      {b.total === 0
        ? <div style={{ padding: '18px 16px', border: `1px solid ${C.line}`, borderRadius: 8, background: C.card, fontSize: 12.5, color: C.inkFaint, lineHeight: 1.6 }}>Отдельные позиции по этому сегменту поимённо не раскрываются — показатели сегмента приведены выше.</div>
        : b.groups.map((g, gi) => <Subgroup key={gi} g={g} forceOpen={filtering || b.groups.length === 1} focus={focus} />)}
    </div>
  );
}

// ── 13F public-holdings view: full named list + top increases/decreases +
//    composition by industry. Data: portfolio/<id>.json → holdings13F.
//    Values are in $MM.
const fmtMM = (v) => v == null ? '' : (v >= 1000 ? '$' + (v / 1000).toFixed(2) + 'B' : (v >= 100 ? '$' + Math.round(v) + 'M' : '$' + v.toFixed(v < 10 ? 2 : 1) + 'M'));
const Delta = ({ d }) => d == null ? <span style={{ color: C.inkFaint }}>—</span> :
  <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: Math.abs(d) < 0.005 ? C.inkFaint : (d >= 0 ? C.teal : C.clay) }}>{d >= 0 ? '+' : ''}{d.toFixed(2)}</span>;
const H13_GRID = '52px 1fr 96px 66px 74px';

function MoveTable({ title, rows, up }) {
  return (
    <div style={{ flex: '1 1 320px', minWidth: 280, border: `1px solid ${C.line}`, borderRadius: 10, background: C.card, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: up ? C.teal : C.clay }}>{title}</div>
        <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 3, lineHeight: 1.4 }}>Изменение доли в портфеле за квартал — от сделок или движения цены.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 84px 60px 62px', gap: 8, padding: '7px 16px', background: C.cardAlt, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
        {['Компания', 'Оценка', 'Доля %', 'Δ %'].map((h, i) => <div key={i} style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkFaint, textAlign: i ? 'right' : 'left' }}>{h}</div>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 84px 60px 62px', gap: 8, padding: '9px 16px', borderBottom: i < rows.length - 1 ? `1px solid ${C.lineSoft}` : 'none', alignItems: 'baseline' }}>
          <div style={{ minWidth: 0, fontSize: 12.5, color: C.ink }}><span style={{ fontFamily: 'var(--mono)', color: C.inkSoft }}>{r.t}</span> {r.name}</div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11.5, color: C.inkSoft }}>{fmtMM(r.val)}</div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11.5, color: C.inkSoft }}>{r.pct != null ? r.pct.toFixed(2) : '—'}</div>
          <div style={{ textAlign: 'right' }}><Delta d={r.delta} /></div>
        </div>
      ))}
    </div>
  );
}

// shared company-rows table (flat list + inside sector groups). showDelta=false drops the Δ column.
function H13Table({ rows, showDelta = true }) {
  const grid = showDelta ? H13_GRID : '52px 1fr 108px 68px';
  const cols = showDelta ? [['Тикер', 'left'], ['Компания', 'left'], ['Оценка', 'right'], ['Доля %', 'right'], ['Δ квартал', 'right']]
    : [['Тикер', 'left'], ['Компания', 'left'], ['Оценка', 'right'], ['Доля %', 'right']];
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden', background: C.card }}>
      <div style={{ display: 'grid', gridTemplateColumns: grid, gap: 10, padding: '8px 16px', background: C.cardAlt, borderBottom: `1px solid ${C.line}` }}>
        {cols.map(([t, a], i) => <div key={i} style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkFaint, textAlign: a }}>{t}</div>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: grid, gap: 10, padding: '9px 16px', borderBottom: i < rows.length - 1 ? `1px solid ${C.lineSoft}` : 'none', alignItems: 'baseline' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: C.inkSoft }}>{r.t}</div>
          <div style={{ minWidth: 0, fontSize: 13, color: C.ink }}>{r.name}</div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: C.ink }}>{fmtMM(r.val != null ? r.val : r.valMM)}</div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: C.inkSoft }}>{r.pct != null ? r.pct.toFixed(2) : '—'}</div>
          {showDelta && <div style={{ textAlign: 'right' }}><Delta d={r.delta} /></div>}
        </div>
      ))}
    </div>
  );
}

// collapsible sector groups (for BlackRock's ~1000 holdings). Auto-expands on search.
function SectorAccordion({ sectors, q }) {
  const [open, setOpen] = useState({});
  return (
    <div>
      {sectors.map((s, i) => {
        let rows = s.rows || [];
        if (q) rows = rows.filter((r) => ((r.t || '') + ' ' + r.name).toLowerCase().includes(q.toLowerCase()));
        if (q && rows.length === 0) return null;
        const isOpen = q ? true : !!open[s.name];
        return (
          <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 10, marginBottom: 8, background: C.card, overflow: 'hidden' }}>
            <button onClick={() => setOpen((o) => ({ ...o, [s.name]: !o[s.name] }))} style={{ width: '100%', display: 'grid', gridTemplateColumns: '18px 1fr 96px 50px', gap: 12, alignItems: 'center', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 11, color: C.inkFaint }}>{isOpen ? '▾' : '▸'}</span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 9, minWidth: 0 }}><span style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>{s.name}</span><span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.inkFaint }}>{q ? rows.length : (s.count || rows.length)}</span></span>
              <div style={{ width: 90, height: 6, borderRadius: 3, background: C.line, overflow: 'hidden', justifySelf: 'end' }}><div style={{ width: `${Math.min(s.pct, 100)}%`, height: '100%', background: PALETTE[i % PALETTE.length] }} /></div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: C.teal, justifySelf: 'end' }}>{s.pct.toFixed(1)}%</span>
            </button>
            {isOpen && <div style={{ padding: '0 12px 12px' }}><H13Table rows={rows} showDelta={false} /></div>}
          </div>
        );
      })}
    </div>
  );
}

function Holdings13F({ h, only }) {
  const [showAll, setShowAll] = useState(false);
  const [q, setQ] = useState('');
  const show = (s) => !only || only === s;
  const grouped = h.sectors && h.sectors.length > 0;
  let rows = h.rows || [];
  if (q) rows = rows.filter((r) => (r.t + ' ' + r.name).toLowerCase().includes(q.toLowerCase()));
  const shown = (showAll || q) ? rows : rows.slice(0, 20);
  const ind = grouped ? h.sectors.map((s) => ({ name: s.name, pct: s.pct, val: s.valMM }))
    : (h.byIndustry || []).filter((x) => x.pct > 0).sort((a, b) => b.pct - a.pct);
  return (
    <div style={{ marginBottom: 26 }}>
      {show('holdings') && (<>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 21, fontWeight: 500, color: C.ink, margin: 0 }}>Публичный портфель (13F)</h3>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: C.inkFaint }}>{h.positions || (h.rows || []).length} позиций · {h.totalValue || ''}</span>
      </div>
      {h.note && <p style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55, margin: '0 0 16px', maxWidth: 720 }}>{h.note}</p>}

      {/* composition by industry */}
      {ind.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 12 }}>Состав по отраслям</div>
          <div style={{ display: 'flex', height: 24, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.line}`, marginBottom: 12 }}>
            {ind.map((it, i) => <div key={i} title={`${it.name} · ${it.pct}%`} style={{ width: `${it.pct}%`, background: PALETTE[i % PALETTE.length], minWidth: 1, borderRight: i < ind.length - 1 ? `1px solid ${C.paper}` : 'none' }} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px 24px' }}>
            {ind.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: PALETTE[i % PALETTE.length], flexShrink: 0, transform: 'translateY(1px)' }} />
                <span style={{ flex: 1, fontSize: 12.5, color: C.ink }}>{it.name}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.ink }}>{it.pct}%</span>
                {it.val != null && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.inkFaint, width: 62, textAlign: 'right' }}>{fmtMM(it.val)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* holdings — grouped by sector (BlackRock ~1000) or a flat top list */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по компании…" style={{ padding: '7px 12px', borderRadius: 16, border: `1px solid ${C.line}`, background: C.paper, color: C.ink, fontSize: 12.5, width: 200, outline: 'none' }} />
        <span style={{ fontSize: 11, color: C.inkFaint }}>
          {grouped
            ? (q ? 'поиск по всем секторам' : `${h.sectors.length} секторов · ${h.sectors.reduce((s, x) => s + (x.count || (x.rows || []).length), 0)} компаний — раскройте сектор`)
            : (q ? `${rows.length} найдено` : `топ ${Math.min(shown.length, rows.length)} из ${(h.rows || []).length} по стоимости`)}
        </span>
      </div>
      {grouped ? <SectorAccordion sectors={h.sectors} q={q} /> : (
        <>
          <H13Table rows={shown} />
          {!q && (h.rows || []).length > 20 && (
            <button onClick={() => setShowAll(!showAll)} style={{ marginTop: 10, fontSize: 12, padding: '7px 16px', borderRadius: 16, border: `1px solid ${C.line}`, background: 'transparent', color: C.teal, cursor: 'pointer' }}>{showAll ? 'Свернуть' : `Показать все ${(h.rows || []).length}`}</button>
          )}
        </>
      )}
      </>)}

      {/* top increases / decreases */}
      {show('moves') && (h.increases || h.decreases) && (
        <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
          {h.increases && h.increases.length > 0 && <MoveTable title="Крупнейший рост за квартал" rows={h.increases} up />}
          {h.decreases && h.decreases.length > 0 && <MoveTable title="Крупнейшее сокращение за квартал" rows={h.decreases} />}
        </div>
      )}

      {/* 13D/G filings — >5% ownership stakes */}
      {show('filings') && h.filings13DG && h.filings13DG.rows && h.filings13DG.rows.length > 0 && (
        <div style={{ marginTop: 18, border: `1px solid ${C.line}`, borderRadius: 10, background: C.card, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px 8px' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>Крупные доли &gt;5% (13D/G)</div>
            {h.filings13DG.note && <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 3, lineHeight: 1.45, maxWidth: 720 }}>{h.filings13DG.note}</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '78px 56px 1fr 92px', gap: 10, padding: '7px 16px', background: C.cardAlt, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
            {[['Дата', 'left'], ['Форма', 'left'], ['Компания', 'left'], ['Владение', 'right']].map(([t, a], i) => <div key={i} style={{ fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkFaint, textAlign: a }}>{t}</div>)}
          </div>
          {h.filings13DG.rows.map((r, i) => {
            const closed = r.status && /закры|выкуп|продан|exit/i.test(r.status);
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '78px 56px 1fr 92px', gap: 10, padding: '9px 16px', borderBottom: i < h.filings13DG.rows.length - 1 ? `1px solid ${C.lineSoft}` : 'none', alignItems: 'baseline' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.inkFaint }}>{r.date}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.inkSoft }}>{r.form}</div>
                <div style={{ minWidth: 0, fontSize: 12.5, color: C.ink }}><span style={{ fontFamily: 'var(--mono)', color: C.inkSoft }}>{r.t}</span> {r.name}{closed && <span style={{ fontSize: 9, marginLeft: 6, padding: '1px 6px', borderRadius: 8, background: `color-mix(in srgb, ${C.gold} 13%, transparent)`, color: C.gold, border: `1px solid color-mix(in srgb, ${C.gold} 33%, transparent)` }}>{r.status}</span>}</div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: C.ink }}>{r.ownPct != null ? r.ownPct.toFixed(2) + '%' : (r.shares || '—')}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PortfolioDeep({ data, focus }) {
  const n = normalize(data);
  const [tab, setTab] = useState('sector');
  const [search, setSearch] = useState('');
  const [keyOnly, setKeyOnly] = useState(false);
  const [mainTab, setMainTab] = useState('holdings');
  // default to the first sector that actually holds companies (some, e.g. asset
  // management, carry no named positions and would open to an empty pane)
  const [active, setActive] = useState(() => {
    const i = n.blocks.findIndex((b) => b.groups.some((g) => g.rows.length));
    return i >= 0 ? i : 0;
  });
  // a company link from another section: jump to the sector holding that company
  useEffect(() => {
    if (!focus) return;
    const i = n.blocks.findIndex((b) => b.groups.some((g) => g.rows.some((r) => r.name === focus)));
    if (i >= 0) setActive(i);
  }, [focus]);

  const tabs = [
    n.composition.length && ['sector', 'По секторам'],
    n.geo.length && ['geo', 'География'],
    n.themes.length && ['theme', 'Темы'],
  ].filter(Boolean);

  // Compact composition viz: one 100%-stacked bar + a tight 2-column legend.
  const Composition = ({ items, labelKey, valKey }) => {
    const sorted = [...items].sort((a, b) => (b.pct || 0) - (a.pct || 0));
    const dark = '#0B130F';
    return (
      <div>
        <div style={{ display: 'flex', height: 26, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.line}`, marginBottom: 13 }}>
          {sorted.map((it, i) => (
            <div key={i} title={`${it[labelKey]} · ${it.pct}%${it[valKey] ? ' · ' + it[valKey] : ''}`}
              style={{ width: `${it.pct}%`, background: PALETTE[i % PALETTE.length], display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i < sorted.length - 1 ? `1px solid ${C.paper}` : 'none', minWidth: 2 }}>
              {it.pct >= 15 && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: dark }}>{it.pct}%</span>}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '11px 28px' }}>
          {sorted.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: PALETTE[i % PALETTE.length], flexShrink: 0, transform: 'translateY(1px)' }} />
              <span style={{ flex: 1, fontSize: 13, color: C.ink, lineHeight: 1.35 }}>{it[labelKey]}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500, color: C.ink, flexShrink: 0 }}>{it.pct}%</span>
              {valKey && <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: C.inkFaint, width: 70, textAlign: 'right', flexShrink: 0 }}>{it[valKey] || ''}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // BlackRock-scale filer: unify everything into ONE space with logical section-tabs
  const H = data.holdings13F;
  const bigFiler = !!(H && H.sectors && H.sectors.length);
  const sections = [
    ['holdings', 'Портфель по секторам'],
    (H && (H.increases || H.decreases)) ? ['moves', 'Движение за квартал'] : null,
    (H && H.filings13DG) ? ['filings', 'Крупные доли >5%'] : null,
    n.blocks.length ? ['segments', 'Бизнес-сегменты'] : null,
  ].filter(Boolean);
  const showSegments = !bigFiler || mainTab === 'segments';

  return (
    <div>
      {n.summary && <p style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.6, color: C.ink, margin: '0 0 22px', maxWidth: 720 }}>{n.summary}</p>}

      {bigFiler && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, borderBottom: `1px solid ${C.line}`, paddingBottom: 14 }}>
          {sections.map(([id, lab]) => {
            const on = mainTab === id;
            return <button key={id} onClick={() => setMainTab(id)} style={{ fontSize: 13, fontWeight: on ? 600 : 500, padding: '7px 15px', borderRadius: 16, border: `1px solid ${on ? C.teal : C.line}`, background: on ? `color-mix(in srgb, ${C.teal} 9%, transparent)` : 'transparent', color: on ? C.teal : C.inkSoft, cursor: 'pointer' }}>{lab}</button>;
          })}
        </div>
      )}

      {H && (bigFiler ? (mainTab !== 'segments' && <Holdings13F h={H} only={mainTab} />) : <Holdings13F h={H} />)}

      {/* ── Куда вложены деньги ── */}
      {showSegments && tabs.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '13px 16px', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: C.inkSoft, marginRight: 6 }}>Куда вложены деньги</span>
            {tabs.map(([id, lab]) => {
              const on = tab === id;
              return <button key={id} onClick={() => setTab(id)} style={{ fontSize: 12, fontWeight: on ? 600 : 400, padding: '5px 13px', borderRadius: 14, border: `1px solid ${on ? C.teal : C.line}`, background: on ? `color-mix(in srgb, ${C.teal} 9%, transparent)` : 'transparent', color: on ? C.teal : C.inkSoft, cursor: 'pointer' }}>{lab}</button>;
            })}
          </div>
          <div style={{ fontSize: 12, color: C.inkFaint, marginBottom: 14, lineHeight: 1.4 }}>
            {tab === 'sector' && 'Как распределены активы по типам бизнеса — управление, страхование, недвижимость и т.д.'}
            {tab === 'geo' && 'В каких регионах сосредоточены активы компании'}
            {tab === 'theme' && 'Три главные инвестиционные темы — на чём Brookfield зарабатывает и куда ставит'}
          </div>
          {tab === 'sector' && <Composition items={n.composition} labelKey="name" valKey="value" />}
          {tab === 'geo' && <Composition items={n.geo} labelKey="region" />}
          {tab === 'theme' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {n.themes.map((t, i) => (
                <div key={i} style={{ border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.violet}`, borderRadius: 9, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{t.title}</div>
                  {t.headline && <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: C.violet, marginBottom: 8, lineHeight: 1.3 }}>{t.headline}</div>}
                  {t.plain && <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55 }}>{t.plain}</div>}
                  {t.items.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
                      <div style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 9 }}>Ключевые активы</div>
                      {t.items.map((it, j) => {
                        const k = it.indexOf('—');
                        const nm = k > 0 ? it.slice(0, k).trim() : it;
                        const ds = k > 0 ? it.slice(k + 1).trim() : '';
                        return (
                          <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 12, lineHeight: 1.5 }}>
                            <span style={{ color: C.violet, flexShrink: 0 }}>•</span>
                            <span><span style={{ fontWeight: 600, color: C.ink }}>{nm}</span>{ds && <span style={{ color: C.inkFaint }}> — {ds}</span>}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showSegments && (<>
      {bigFiler && <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5, margin: '0 0 14px', maxWidth: 720 }}>Как устроен сам бизнес BlackRock — по типам мандатов (ETF, частные рынки, институциональные, розница, деньги, технологии). Это про источники комиссий, а не про то, какие акции держат клиентские фонды (см. вкладку «Портфель по секторам»).</div>}
      {/* ── Filters ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по компании…" style={{ padding: '7px 12px', borderRadius: 16, border: `1px solid ${C.line}`, background: C.paper, color: C.ink, fontSize: 12.5, fontFamily: 'var(--sans)', width: 220, outline: 'none' }} />
        <span style={{ fontSize: 11.5, color: C.inkFaint, marginLeft: 'auto' }}>Сектор слева → компания → клик для деталей</span>
      </div>

      {/* ── Portfolio: master-detail ── */}
      {(() => {
        const filtering = !!(search || keyOnly);
        const filtered = n.blocks.map((b) => filterBlock(b, search, keyOnly));
        let shown = active;
        if (filtering && filtered[shown] && filtered[shown].total === 0) {
          const first = filtered.findIndex((b) => b.total > 0);
          if (first >= 0) shown = first;
        }
        const current = filtered[shown];
        return (
          <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', flexWrap: 'wrap', minHeight: 580 }}>
            <nav style={{ flex: '1 1 260px', maxWidth: 320, minWidth: 240, border: `1px solid ${C.line}`, borderRadius: '10px 0 0 10px', overflow: 'hidden', background: C.card, alignSelf: 'stretch' }}>
              {filtered.map((b, i) => (
                <div key={b.id || i} style={{ borderTop: i ? `1px solid ${C.lineSoft}` : 'none', opacity: filtering && b.total === 0 ? 0.4 : 1 }}>
                  <RailItem b={b} active={i === shown} filtering={filtering} onClick={() => setActive(i)} />
                </div>
              ))}
            </nav>
            <div style={{ flex: '999 1 520px', minWidth: 300, border: `1px solid ${C.line}`, borderLeft: 'none', borderRadius: '0 10px 10px 0', background: C.card, padding: '22px 28px' }}>
              <SectorPane b={current} filtering={filtering} focus={focus} />
            </div>
          </div>
        );
      })()}
      </>)}

    </div>
  );
}
