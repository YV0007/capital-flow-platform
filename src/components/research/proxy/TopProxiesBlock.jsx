// Block 3 — Топ прокси по концентрации (compact view).
// Сжатая таблица: ticker / название / актив / долларовая оценка стейка.
// По клику на строку открывается drawer с остальными метриками
// (концентрация, премия/дисконт, биржа, комментарий, описание).
// Сортировка по умолчанию — по убыванию долларовой стоимости стейка.
// Зеркалит UX из ExtendedHoldings в Holdings.

import { useMemo, useState } from 'react';
import table from '../../../data/proxy-table.json';
import { useT } from '../../../lib/i18n.jsx';

// Без t('Все', 'All') — таблица всегда отфильтрована по одному базовому активу.
// Универсальный вид плохо читается: одни прокси работают только для
// SpaceX, другие — для Anthropic, и смешивание превращает таблицу в кашу.
const ASSETS = ['SpaceX', 'OpenAI', 'Anthropic'];
// Top Picks first, потом два структурных бакета (Средние / Избегать), t('Все', 'All') в конце.
// "Лучшие" удалены как отдельный фильтр — теперь это синоним Top Picks.
// На уровне данных Top Picks всё ещё имеют rating='best' (зелёная полоса),
// но фильтр-чип "Лучшие" не показывается, чтобы не дублировать "Top Picks".
const RATINGS = [
  { id: 'top',      label: 'Top Picks' },
  { id: 'moderate', label: t('Средние', 'Moderate')   },
  { id: 'avoid',    label: t('Избегать', 'Avoid')  },
  { id: 'all',      label: t('Все', 'All')       },
];

const RATING_BORDER = {
  best:     '#46C29B',
  moderate: '#CBAA52',
  avoid:    '#EF6F6F',
};

const HEAD_COLS = [
  { id: 'ticker',       label: 'Ticker',     align: 'left',  width: 90  },
  { id: 'name',         label: t('Название', 'Name'),   align: 'left',  width: 210 },
  { id: 'sector',       label: t('Сектор', 'Sector'),     align: 'left',  width: 150 },
  { id: 'asset',        label: t('Актив', 'Asset'),      align: 'left',  width: 110 },
  { id: 'stakeUsdNum',  label: t('Стейк USD', 'Stake USD'),  align: 'right', width: 130 },
];

export default function TopProxiesBlock({ C, subLabel }) {
  const t = useT();
  const [asset, setAsset] = useState('SpaceX');
  const [rating, setRating] = useState('top');         // Top Picks по умолчанию — самый ценный вид
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
    if (rating === 'top')       r = r.filter((x) => x.topPickRank);
    else if (rating !== 'all')  r = r.filter((x) => x.rating === rating);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.ticker.toLowerCase().includes(q) || x.name.toLowerCase().includes(q));
    }
    // В режиме Top Picks сортируем по ранку asc (1→5), независимо от выбранной
    // колонки — это авторская очерёдность, она не должна теряться.
    if (rating === 'top') {
      return [...r].sort((a, b) => (a.topPickRank || 99) - (b.topPickRank || 99));
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
      background: active ? `color-mix(in srgb, ${C.teal} 9%, transparent)` : 'transparent', color: active ? C.teal : C.inkSoft,
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
      <div style={subLabel}>{rows.length} {t('строк · сортировка по любой колонке · клик по строке — детали', 'rows · sortable on every column · click a row for details')}</div>

      {/* Filter bar */}
      <div style={{ marginBottom: 14, padding: '12px 16px', background: C.card, border: `1px solid ${C.line}`, borderRadius: 10 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', rowGap: 10 }}>
          <span style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFaint, marginRight: 4 }}>{t('Актив:', 'Asset:')}</span>
          {ASSETS.map((a) => chip(asset === a, () => { setAsset(a); setOpenRow(null); }, a, assetCounts[a]))}
          <span style={{ width: 1, height: 20, background: C.line, margin: '0 6px' }} />
          <span style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFaint, marginRight: 4 }}>{t('Точка входа:', 'Entry point:')}</span>
          {RATINGS.map((r) => chip(rating === r.id, () => { setRating(r.id); setOpenRow(null); }, r.label))}
          <div style={{ marginLeft: 'auto' }}>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setOpenRow(null); }} placeholder={t('Поиск ticker / название…', 'Search ticker / name…')}
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
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 820, fontFamily: 'var(--sans)' }}>
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
                  {t('Нет строк под текущие фильтры.', 'No rows match the current filters.')}
                </td>
              </tr>
            )}
            {/* min-width of the table widened because we added a sector column */}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, fontSize: 11.5, color: C.inkSoft, flexWrap: 'wrap', marginTop: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 4, height: 12, background: RATING_BORDER.best, borderRadius: 1 }} /> {t('Лучшие точки входа', 'Best entry points')}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 4, height: 12, background: RATING_BORDER.moderate, borderRadius: 1 }} /> {t('Средние', 'Moderate')}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 4, height: 12, background: RATING_BORDER.avoid, borderRadius: 1 }} /> {t('Избегать', 'Avoid')}
        </span>
      </div>
    </div>
  );
}

// ─── Row + Drawer ────────────────────────────────────────────────
function Row({ C, row, i, isOpen, onToggle }) {
  // Чередуем фон строк сильнее: C.card vs C.cardAlt — разница маленькая,
  // но накладываем дополнительный alpha-tint, чтобы строки читались как
  // ритм. При наведении подсвечиваем accent-color'ом отчёта.
  const baseBg = i % 2 ? C.cardAlt : C.card;
  const stripeColor = RATING_BORDER[row.rating];

  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          background: isOpen ? `color-mix(in srgb, ${stripeColor} 6%, transparent)` : baseBg,
          cursor: 'pointer',
          transition: 'background .12s',
        }}
        onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = `color-mix(in srgb, ${C.teal} 8%, transparent)`; }}
        onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = baseBg; }}>
        {/* rating stripe */}
        <td style={{ width: 4, padding: 0, background: stripeColor, borderBottom: `1px solid ${C.line}` }} />
        <td style={{ padding: '12px 14px', fontFamily: 'var(--mono)', fontSize: 13, color: isOpen ? stripeColor : C.ink, fontWeight: 600, borderBottom: `1px solid ${C.line}`, transition: 'color .12s' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {row.ticker}
            {row.topPickRank && (
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 700,
                letterSpacing: '.08em', textTransform: 'uppercase',
                padding: '2px 6px', borderRadius: 3,
                background: `color-mix(in srgb, ${C.teal} 13%, transparent)`, color: C.teal,
                border: `1px solid color-mix(in srgb, ${C.teal} 33%, transparent)`,
              }}>TOP {row.topPickRank}</span>
            )}
          </span>
        </td>
        <td style={{ padding: '12px 14px', fontSize: 13, color: C.ink, borderBottom: `1px solid ${C.line}` }}>{row.name}</td>
        <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.line}` }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 9px', borderRadius: 4,
            background: `color-mix(in srgb, ${C.teal} 6%, transparent)`, color: C.inkSoft,
            border: `1px solid color-mix(in srgb, ${C.teal} 19%, transparent)`,
            fontSize: 10.5, fontFamily: 'var(--mono)', fontWeight: 500,
            letterSpacing: '.02em', whiteSpace: 'nowrap',
          }}>{row.sector || '—'}</span>
        </td>
        <td style={{ padding: '12px 14px', fontSize: 12.5, color: C.inkSoft, borderBottom: `1px solid ${C.line}` }}>{row.asset}</td>
        <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 13.5, color: C.ink, fontWeight: 600, borderBottom: `1px solid ${C.line}` }}>{row.stakeUsdLabel}</td>
        <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: 12, color: isOpen ? stripeColor : C.inkFaint, borderBottom: `1px solid ${C.line}`, transition: 'color .12s' }}>
          {isOpen ? '▾' : '▸'}
        </td>
      </tr>
      {isOpen && (
        <tr>
          {/* mirror rating stripe down through the drawer for a continuous colour bar */}
          <td style={{ width: 4, padding: 0, background: stripeColor, borderBottom: `1px solid ${C.line}` }} />
          <td colSpan={6} style={{
            padding: 0,
            background: C.paper,                              // darker than the rows → drawer "sinks in"
            borderBottom: `1px solid ${C.line}`,
            borderTop: `2px solid ${stripeColor}`,            // strong rating-coloured cap on top of drawer
            boxShadow: `inset 0 8px 18px -8px ${C.paper}`,    // soft inner shadow on the upper edge
          }}>
            <Drawer C={C} row={row} stripeColor={stripeColor} />
          </td>
        </tr>
      )}
    </>
  );
}

function Drawer({ C, row, stripeColor }) {
  const t = useT();
  const premiumColor = row.premiumNum > 30 ? C.rose
                     : row.premiumNum < -3 ? C.emerald
                     : C.ink;

  const ratingLabel = row.rating === 'best'     ? t('Лучшая точка входа', 'Best entry point')
                    : row.rating === 'moderate' ? t('Средняя', 'Moderate')
                    : t('Избегать', 'Avoid');

  return (
    <div style={{ padding: '18px 20px 20px' }}>
      {/* Top meta row: rating pill + optional Top Pick pill + ticker repeat */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {row.topPickRank && (
          <span style={{
            fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700,
            padding: '3px 9px', borderRadius: 10,
            background: `color-mix(in srgb, ${C.teal} 13%, transparent)`, color: C.teal,
            border: `1px solid color-mix(in srgb, ${C.teal} 33%, transparent)`,
          }}>Top Pick · #{row.topPickRank} {t('на', 'on')} {row.asset}</span>
        )}
        <span style={{
          fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700,
          padding: '3px 9px', borderRadius: 10,
          background: `color-mix(in srgb, ${stripeColor} 13%, transparent)`, color: stripeColor,
          border: `1px solid color-mix(in srgb, ${stripeColor} 33%, transparent)`,
        }}>{ratingLabel}</span>
        <span style={{ fontSize: 11, color: C.inkFaint, fontFamily: 'var(--mono)' }}>
          {row.ticker} · {row.asset}
        </span>
      </div>

      {/* Description */}
      {row.description && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 6 }}>{t('О компании', 'About the company')}</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 15, color: C.ink, lineHeight: 1.5 }}>
            {row.description}
          </div>
        </div>
      )}

      {/* KV grid — three cells with vertical separators */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden',
        marginBottom: row.note ? 14 : 0,
      }}>
        <DrawerKV C={C} label={t('Биржа', 'Exchange')}          value={row.exchange}            border />
        <DrawerKV C={C} label={t('Концентрация', 'Concentration')}   value={row.concentrationLabel}  border />
        <DrawerKV C={C} label={t('Премия / диск.', 'Premium / disc.')} value={row.premiumLabel}        valueColor={premiumColor} />
      </div>

      {/* Note */}
      {row.note && (
        <div style={{
          fontSize: 12.5, color: C.ink, lineHeight: 1.6,
          padding: '12px 14px',
          background: `color-mix(in srgb, ${stripeColor} 6%, transparent)`,
          border: `1px solid color-mix(in srgb, ${stripeColor} 20%, transparent)`,
          borderLeft: `3px solid ${stripeColor}`,
          borderRadius: 6,
        }}>
          <span style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: stripeColor, fontWeight: 700, marginRight: 8 }}>{t('Комментарий', 'Commentary')}</span>
          <span style={{ fontStyle: 'italic', color: C.inkSoft }}>{row.note}</span>
        </div>
      )}
    </div>
  );
}

function DrawerKV({ C, label, value, valueColor, border }) {
  return (
    <div style={{
      padding: '12px 16px',
      borderRight: border ? `1px solid ${C.line}` : 'none',
      display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0,
    }}>
      <span style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: C.inkFaint, fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: valueColor || C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || '—'}</span>
    </div>
  );
}
