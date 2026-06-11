// Block 3 — Топ прокси по концентрации (compact view).
// Сжатая таблица: ticker / название / актив / долларовая оценка стейка.
// По клику на строку открывается drawer с остальными метриками
// (концентрация, премия/дисконт, биржа, комментарий, описание).
// Сортировка по умолчанию — по убыванию долларовой стоимости стейка.
// Зеркалит UX из ExtendedHoldings в Holdings.

import { useMemo, useState } from 'react';
import table from '../../../data/proxy-table.json';

// Без "Все" — таблица всегда отфильтрована по одному базовому активу.
// Универсальный вид плохо читается: одни прокси работают только для
// SpaceX, другие — для Anthropic, и смешивание превращает таблицу в кашу.
const ASSETS = ['SpaceX', 'OpenAI', 'Anthropic'];
const RATINGS = [
  { id: 'all',      label: 'Все' },
  { id: 'best',     label: 'Лучшие'   },
  { id: 'moderate', label: 'Средние'  },
  { id: 'avoid',    label: 'Избегать' },
];

const RATING_BORDER = {
  best:     '#46C29B',
  moderate: '#CBAA52',
  avoid:    '#EF6F6F',
};

const HEAD_COLS = [
  { id: 'ticker',       label: 'Ticker',     align: 'left',  width: 100 },
  { id: 'name',         label: 'Название',   align: 'left',  width: 260 },
  { id: 'asset',        label: 'Актив',      align: 'left',  width: 130 },
  { id: 'stakeUsdNum',  label: 'Стейк USD',  align: 'right', width: 140 },
];

export default function TopProxiesBlock({ C, subLabel }) {
  const [asset, setAsset] = useState('SpaceX');
  const [rating, setRating] = useState('all');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('stakeUsdNum');
  const [sortDir, setSortDir] = useState('desc');
  const [openRow, setOpenRow] = useState(null);

  // Подсчёт строк по каждому активу — нужен для chip-счётчиков.
  const assetCounts = useMemo(() => {
    const counts = {};
    for (const a of ASSETS) counts[a] = 0;
    for (const r of table.rows) counts[r.asset] = (counts[r.asset] || 0) + 1;
    return counts;
  }, []);

  const rows = useMemo(() => {
    let r = table.rows.filter((x) => x.asset === asset);
    if (rating !== 'all') r = r.filter((x) => x.rating === rating);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.ticker.toLowerCase().includes(q) || x.name.toLowerCase().includes(q));
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...r].sort((a, b) => {
      const av = a[sortCol]; const bv = b[sortCol];
      if (typeof av === 'string') return dir * av.localeCompare(bv);
      return dir * (av - bv);
    });
  }, [asset, rating, search, sortCol, sortDir]);

  const onSort = (id) => {
    if (sortCol === id) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(id); setSortDir('desc'); }
    setOpenRow(null);
  };

  const chip = (active, onClick, label, count) => (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 16, border: `1px solid ${active ? C.teal : C.line}`,
      background: active ? `${C.teal}18` : 'transparent', color: active ? C.teal : C.inkSoft,
      cursor: 'pointer', fontSize: 12, fontFamily: 'var(--sans)', fontWeight: active ? 600 : 400,
      transition: 'all .15s',
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      {label}
      {count != null && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, opacity: 0.7 }}>{count}</span>
      )}
    </button>
  );

  return (
    <div>
      <div style={subLabel}>{rows.length} строк · сортировка по любой колонке · клик по строке — детали</div>

      {/* Filter bar */}
      <div style={{ marginBottom: 14, padding: '12px 16px', background: C.card, border: `1px solid ${C.line}`, borderRadius: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', rowGap: 10 }}>
          <span style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFaint, marginRight: 4 }}>Актив:</span>
          {ASSETS.map((a) => chip(asset === a, () => { setAsset(a); setOpenRow(null); }, a, assetCounts[a]))}
          <span style={{ width: 1, height: 20, background: C.line, margin: '0 6px' }} />
          <span style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFaint, marginRight: 4 }}>Точка входа:</span>
          {RATINGS.map((r) => chip(rating === r.id, () => { setRating(r.id); setOpenRow(null); }, r.label))}
          <div style={{ marginLeft: 'auto' }}>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setOpenRow(null); }} placeholder="Поиск ticker / название…"
              style={{
                padding: '7px 12px', borderRadius: 16, border: `1px solid ${C.line}`,
                background: C.paper, color: C.ink, fontSize: 12, fontFamily: 'var(--sans)',
                width: 220, outline: 'none',
              }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 10 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720, fontFamily: 'var(--sans)' }}>
          <thead style={{ position: 'sticky', top: 0, background: C.card, zIndex: 2 }}>
            <tr>
              {/* gutter for rating stripe */}
              <th style={{ width: 4, padding: 0, background: C.card, borderBottom: `1px solid ${C.line}` }} />
              {HEAD_COLS.map((col) => {
                const active = sortCol === col.id;
                return (
                  <th key={col.id} onClick={() => onSort(col.id)}
                    style={{
                      textAlign: col.align, padding: '10px 14px',
                      fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase',
                      color: active ? C.teal : C.inkFaint, fontWeight: 600,
                      borderBottom: `1px solid ${C.line}`,
                      cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
                      width: col.width,
                    }}>
                    {col.label}
                    {active && <span style={{ marginLeft: 6, fontFamily: 'var(--mono)', fontSize: 10 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                );
              })}
              {/* chevron column */}
              <th style={{ width: 32, padding: 0, background: C.card, borderBottom: `1px solid ${C.line}` }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const key = `${r.ticker}-${r.asset}-${i}`;
              const isOpen = openRow === key;
              return (
                <Row
                  key={key}
                  C={C}
                  row={r}
                  i={i}
                  isOpen={isOpen}
                  onToggle={() => setOpenRow(isOpen ? null : key)}
                />
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={HEAD_COLS.length + 2} style={{ padding: 28, textAlign: 'center', color: C.inkFaint, fontSize: 12.5, fontStyle: 'italic' }}>
                  Нет строк под текущие фильтры.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, fontSize: 11.5, color: C.inkSoft, flexWrap: 'wrap', marginTop: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 4, height: 12, background: RATING_BORDER.best, borderRadius: 1 }} /> Лучшие точки входа
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 4, height: 12, background: RATING_BORDER.moderate, borderRadius: 1 }} /> Средние
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 4, height: 12, background: RATING_BORDER.avoid, borderRadius: 1 }} /> Избегать
        </span>
      </div>
    </div>
  );
}

// ─── Row + Drawer ────────────────────────────────────────────────
function Row({ C, row, i, isOpen, onToggle }) {
  const rowBg = isOpen ? C.cardAlt : (i % 2 ? C.cardAlt : C.card);
  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          background: rowBg,
          cursor: 'pointer',
          transition: 'background .12s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = `${C.teal}10`}
        onMouseLeave={(e) => e.currentTarget.style.background = rowBg}>
        {/* rating stripe */}
        <td style={{ width: 4, padding: 0, background: RATING_BORDER[row.rating], borderBottom: `1px solid ${C.lineSoft}` }} />
        <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12.5, color: C.ink, fontWeight: 500, borderBottom: `1px solid ${C.lineSoft}` }}>{row.ticker}</td>
        <td style={{ padding: '11px 14px', fontSize: 13, color: C.ink, borderBottom: `1px solid ${C.lineSoft}` }}>{row.name}</td>
        <td style={{ padding: '11px 14px', fontSize: 12.5, color: C.inkSoft, borderBottom: `1px solid ${C.lineSoft}` }}>{row.asset}</td>
        <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 13, color: C.ink, fontWeight: 500, borderBottom: `1px solid ${C.lineSoft}` }}>{row.stakeUsdLabel}</td>
        <td style={{ padding: '11px 10px', textAlign: 'right', fontSize: 11, color: C.inkFaint, borderBottom: `1px solid ${C.lineSoft}` }}>
          {isOpen ? '▾' : '▸'}
        </td>
      </tr>
      {isOpen && (
        <tr>
          {/* mirror rating stripe down to keep the colour bar continuous */}
          <td style={{ width: 4, padding: 0, background: RATING_BORDER[row.rating], borderBottom: `1px solid ${C.lineSoft}` }} />
          <td colSpan={5} style={{ padding: '14px 18px 18px', background: C.cardAlt, borderBottom: `1px solid ${C.lineSoft}` }}>
            <Drawer C={C} row={row} />
          </td>
        </tr>
      )}
    </>
  );
}

function Drawer({ C, row }) {
  const KV = ({ label, value, valueColor }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFaint }}>{label}</span>
      <span style={{ fontSize: 12.5, color: valueColor || C.ink, fontFamily: 'var(--mono)' }}>{value || '—'}</span>
    </div>
  );

  const premiumColor = row.premiumNum > 30 ? C.rose
                     : row.premiumNum < -3 ? C.emerald
                     : C.ink;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Description */}
      {row.description && (
        <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.55, fontFamily: 'var(--sans)' }}>
          {row.description}
        </div>
      )}

      {/* KV grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, paddingTop: 10, borderTop: `1px solid ${C.lineSoft}` }}>
        <KV label="Биржа"          value={row.exchange} />
        <KV label="Концентрация"   value={row.concentrationLabel} />
        <KV label="Премия / диск." value={row.premiumLabel} valueColor={premiumColor} />
      </div>

      {/* Note */}
      {row.note && (
        <div style={{
          fontSize: 12, color: C.inkSoft, lineHeight: 1.55, fontStyle: 'italic',
          padding: '10px 12px', background: C.card, border: `1px solid ${C.lineSoft}`, borderRadius: 6,
          borderLeft: `3px solid ${RATING_BORDER[row.rating]}`,
        }}>
          {row.note}
        </div>
      )}
    </div>
  );
}
