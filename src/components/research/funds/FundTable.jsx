// ══════════════════════════════════════════════════════════════════════════
// FundTable — the whole section as rows, in two modes.
//
//   ПО ФОНДАМ    one row per fund — the shape of the universe.
//   ПО ПОЗИЦИЯМ  one row per fund×security — the analytical workhorse of the
//                section, sortable on every column.
//
// Selection is shared with the node view: clicking a row here selects the same
// fund the grid highlights, and vice versa. Same filter semantics as the two
// maps, so there is nothing new to learn.
// ══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { ACTION_META, sectorLabel } from '../../../data/fundTracker.js';
import { fmtUSD, fmtPct, fmtShares, fmtDate, fmtQuarters } from './fundFormat.js';
import { MONO, hexA, LatencyBadge, FormBadge, Chip, Delta, SparseFlag, useTone } from './FundBits.jsx';
import { useT } from '../../../lib/i18n.jsx';

const FUND_COLS = [
  { key: 'name',    label: t('Фонд', 'Fund'),        w: '1.5fr', align: 'left' },
  { key: 'style',   label: t('Стиль', 'Style'),       w: '110px', align: 'left' },
  { key: 'book',    label: t('Книга', 'Book'),       w: '86px',  align: 'right', num: true },
  { key: 'count',   label: t('Позиций', 'Positions'),     w: '62px',  align: 'right', num: true },
  { key: 'top10',   label: t('Топ-10', 'Top 10'),      w: '62px',  align: 'right', num: true },
  { key: 'new',     label: t('Нов', 'New'),         w: '44px',  align: 'right', num: true },
  { key: 'added',   label: t('Доб', 'Add'),         w: '44px',  align: 'right', num: true },
  { key: 'trimmed', label: t('Сокр', 'Trim'),        w: '44px',  align: 'right', num: true },
  { key: 'exited',  label: t('Закр', 'Exit'),        w: '44px',  align: 'right', num: true },
  { key: 'score',   label: t('Убежд.', 'Conv.'),      w: '58px',  align: 'right', num: true },
  { key: 'filed',   label: t('Подано', 'Filed'),      w: '86px',  align: 'left' },
  { key: 'latency', label: t('Латентность', 'Latency'), w: '92px',  align: 'right', num: true },
];

const POS_COLS = [
  { key: 'fund',    label: t('Фонд', 'Fund'),        w: '128px', align: 'left' },
  { key: 'ticker',  label: t('Тикер', 'Ticker'),       w: '74px',  align: 'left' },
  { key: 'issuer',  label: t('Эмитент', 'Issuer'),     w: '1.4fr', align: 'left' },
  { key: 'weight',  label: t('Вес', 'Weight'),         w: '58px',  align: 'right', num: true },
  { key: 'value',   label: t('Стоимость', 'Value'),   w: '80px',  align: 'right', num: true },
  { key: 'shares',  label: t('Акций', 'Shares'),       w: '72px',  align: 'right', num: true },
  { key: 'action',  label: t('Действие', 'Action'),    w: '68px',  align: 'left' },
  { key: 'delta',   label: t('Δ акций', 'Δ shares'),     w: '74px',  align: 'right', num: true },
  { key: 'quarters',label: t('Кварт.', 'Qtrs'),      w: '58px',  align: 'right', num: true },
  { key: 'crowd',   label: t('Фондов', 'Funds'),      w: '58px',  align: 'right', num: true },
  { key: 'score',   label: t('Убежд.', 'Conv.'),      w: '58px',  align: 'right', num: true },
  { key: 'form',    label: t('Форма', 'Form'),       w: '72px',  align: 'left' },
  { key: 'latency', label: t('Латентность', 'Latency'), w: '92px',  align: 'right', num: true },
];

const fundValue = (f, k) => {
  switch (k) {
    case 'name': return f.short_name.toLowerCase();
    case 'style': return f.styleMeta?.order ?? 99;
    case 'book': return f.book_value_usd || 0;
    case 'count': return f.position_count || 0;
    case 'top10': return f.conviction?.top10_concentration ?? -1;
    case 'new': return f.activity?.new.length ?? -1;
    case 'added': return f.activity?.added.length ?? -1;
    case 'trimmed': return f.activity?.trimmed.length ?? -1;
    case 'exited': return f.activity?.exited.length ?? -1;
    case 'score': return f.conviction?.score ?? -1;
    case 'filed': return f.filed || '';
    case 'latency': return f.latency_days ?? 0;
    default: return 0;
  }
};

const posValue = (p, k) => {
  switch (k) {
    case 'fund': return p.fund.toLowerCase();
    case 'ticker': return p.ticker;
    case 'issuer': return p.issuer.toLowerCase();
    case 'weight': return p.weight || 0;
    case 'value': return p.value_usd || 0;
    case 'shares': return p.shares || 0;
    case 'action': return p.actionMeta.order;
    // Suppressed deltas sort to the bottom rather than pretending to be zero.
    case 'delta': return p.deltaShown && p.share_delta_pct != null ? p.share_delta_pct : -99;
    case 'quarters': return p.quarters_held || 0;
    case 'crowd': return p.crowdCount || 1;
    case 'score': return p.fundConviction ?? -1;
    case 'form': return p.source_form || '';
    case 'latency': return p.latency_days ?? 0;
    default: return 0;
  }
};

export default function FundTable({
  mode, onMode, funds, positions, selectedId, onSelect, onOpenSecurity, topInset = 0,
}) {
  const t = useT();
  const byFund = mode === 'funds';
  const cols = byFund ? FUND_COLS : POS_COLS;
  const [sort, setSort] = useState({ key: byFund ? 'book' : 'weight', dir: -1 });

  const key = sort.key;
  const rows = useMemo(() => {
    const list = byFund ? funds.slice() : positions.slice();
    const val = byFund ? fundValue : posValue;
    const safeKey = cols.some(c => c.key === key) ? key : (byFund ? 'book' : 'weight');
    return list.sort((a, b) => {
      const va = val(a, safeKey), vb = val(b, safeKey);
      if (va < vb) return -sort.dir;
      if (va > vb) return sort.dir;
      return String(a.id || a.ticker).localeCompare(String(b.id || b.ticker));
    });
  }, [byFund, funds, positions, key, sort.dir, cols]);

  const grid = cols.map(c => c.w).join(' ');
  const flip = (k) => setSort(s => (s.key === k ? { key: k, dir: -s.dir } : { key: k, dir: -1 }));

  return (
    // The container starts BELOW the chrome rather than padding itself down,
    // so `sticky: 0` on the header row means what it says. (Same pattern as
    // ecosystem/EcoTable — a sticky child inside a padded scroller ends up
    // overlapping its own first row.)
    <div style={{
      position: 'absolute', top: topInset, left: 0, right: 0, bottom: 0,
      overflow: 'auto', background: 'var(--cf-canvas)',
    }}>
      <div style={{ minWidth: byFund ? 1120 : 1280, padding: '14px 20px 70px' }}>
        <ModeSwitch mode={mode} onMode={onMode} funds={funds.length} positions={positions.length} />

        <div style={{
          display: 'grid', gridTemplateColumns: grid, gap: 10,
          padding: '9px 10px', position: 'sticky', top: 0, zIndex: 3,
          background: 'var(--cf-surface0)', borderRadius: '8px 8px 0 0',
          borderBottom: '1px solid var(--cf-border)',
        }}>
          {cols.map(c => (
            <button key={c.key} onClick={() => flip(c.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                justifyContent: c.align === 'right' ? 'flex-end' : 'flex-start',
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontSize: 8.5, fontFamily: MONO, fontWeight: 700,
                color: sort.key === c.key ? 'var(--cf-accent)' : 'var(--cf-text6)',
                textTransform: 'uppercase', letterSpacing: '0.09em', whiteSpace: 'nowrap',
              }}>
              {c.label}
              {sort.key === c.key && (sort.dir === -1 ? <ChevronDown size={9} /> : <ChevronUp size={9} />)}
            </button>
          ))}
        </div>

        {rows.length === 0 && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--cf-text6)', fontFamily: MONO, fontSize: 12 }}>
            {t('Ничего не проходит текущие фильтры.', 'Nothing matches the current filters.')}
          </div>
        )}

        {byFund
          ? rows.map(f => <FundRow key={f.id} f={f} grid={grid} selected={f.id === selectedId} onSelect={onSelect} />)
          : rows.map(p => (
              <PosRow key={`${p.fundId}-${p.ticker}-${p.instrument}`} p={p} grid={grid}
                selected={p.fundId === selectedId} onSelect={onSelect} onOpenSecurity={onOpenSecurity} />
            ))}
      </div>
    </div>
  );
}

function ModeSwitch({ mode, onMode, funds, positions }) {
  const t = useT();
  const opts = [
    { key: 'funds', label: t('По фондам', 'By fund'), n: funds, hint: t('Одна строка на фонд — форма вселенной целиком.', 'One row per fund — the shape of the whole universe.') },
    { key: 'positions', label: t('По позициям', 'By position'), n: positions, hint: t('Одна строка на фонд×бумагу. Сортируется по любому столбцу.', 'One row per fund × security. Sortable on every column.') },
  ];
  return (
    <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
      {opts.map(o => {
        const on = mode === o.key;
        return (
          <button key={o.key} onClick={() => onMode(o.key)} title={o.hint}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px',
              background: on ? 'var(--cf-accent-bg)' : 'var(--cf-surface2)',
              border: `1px solid ${on ? 'var(--cf-accent-bd)' : 'var(--cf-border)'}`,
              borderRadius: 7, cursor: 'pointer',
              color: on ? 'var(--cf-accent)' : 'var(--cf-text3)',
              fontSize: 10, fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
            {o.label}
            <span style={{ color: 'var(--cf-text7)', fontWeight: 600 }}>{o.n}</span>
          </button>
        );
      })}
    </div>
  );
}

const cellR = { fontSize: 10.5, fontFamily: MONO, color: 'var(--cf-text2)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

function FundRow({ f, grid, selected, onSelect }) {
  const t = useT();
  const tint = useTone();
  const a = f.activity;
  return (
    <div onClick={() => onSelect(f.id)}
      style={{
        display: 'grid', gridTemplateColumns: grid, gap: 10, alignItems: 'center',
        padding: '9px 10px', cursor: 'pointer',
        background: selected ? 'var(--cf-surface3)' : 'transparent',
        borderBottom: '1px solid var(--cf-border-hair)',
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'var(--cf-hover)'; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: tint(f.activityColor), flexShrink: 0 }}
          title={t('Движение книги за период', 'How much of the book moved this period')} />
        <span style={{
          fontSize: 11.5, fontWeight: 700, color: 'var(--cf-text0)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{f.short_name}</span>
        {f.sparse_coverage && <SparseFlag inline />}
      </span>
      <span><Chip color={f.styleMeta.color} small title={f.styleMeta.blurb}>{f.styleMeta.label}</Chip></span>
      <span style={{ ...cellR, color: 'var(--cf-text0)', fontWeight: 700 }}>{fmtUSD(f.book_value_usd)}</span>
      <span style={cellR}>{f.position_count}</span>
      <span style={cellR}>{f.conviction ? fmtPct(f.conviction.top10_concentration, 0) : '—'}</span>
      {['new', 'added', 'trimmed', 'exited'].map(k => (
        <span key={k} style={{ ...cellR, color: a?.[k]?.length ? tint(ACTION_META[k].color) : 'var(--cf-text8)' }}>
          {a ? a[k].length : '—'}
        </span>
      ))}
      <span style={{ ...cellR, color: f.conviction ? 'var(--cf-accent)' : 'var(--cf-text8)', fontWeight: 700 }}>
        {f.conviction?.score ?? '—'}
      </span>
      <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--cf-text5)' }}>{fmtDate(f.filed)}</span>
      <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LatencyBadge days={f.latency_days} asOf={f.as_of} form={f.source_form} />
      </span>
    </div>
  );
}

function PosRow({ p, grid, selected, onSelect, onOpenSecurity }) {
  const t = useT();
  return (
    <div onClick={() => onSelect(p.fundId)}
      style={{
        display: 'grid', gridTemplateColumns: grid, gap: 10, alignItems: 'center',
        padding: '8px 10px', cursor: 'pointer',
        background: selected ? 'var(--cf-surface3)' : 'transparent',
        borderBottom: '1px solid var(--cf-border-hair)',
        opacity: p.action === 'exited' ? 0.62 : 1,
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'var(--cf-hover)'; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}>
      <span style={{
        fontSize: 10.5, color: 'var(--cf-text3)', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{p.fund}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={(e) => { e.stopPropagation(); onOpenSecurity?.(p.ticker); }}
          title={t('Открыть таблицу держателей', 'Open the holder table')}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontSize: 11, fontFamily: MONO, fontWeight: 800, color: 'var(--cf-link)',
          }}>{p.ticker}</button>
        {p.jurisdiction !== 'US' && <span title={p.jurMeta.label} style={{ fontSize: 8.5, cursor: 'help' }}>{p.jurMeta.flag}</span>}
        {p.instrumentMeta.derivative && (
          <Chip color={p.instrumentMeta.color} small title={p.instrumentMeta.blurb}>{p.instrumentMeta.short}</Chip>
        )}
      </span>
      <span style={{
        fontSize: 10.5, color: 'var(--cf-text4)', overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }} title={`${p.issuer} · ${sectorLabel(p.sector)}`}>{p.issuer}</span>
      <span style={{ ...cellR, color: 'var(--cf-text0)', fontWeight: 700 }}>{fmtPct(p.weight)}</span>
      <span style={cellR}>{fmtUSD(p.value_usd)}</span>
      <span style={cellR}>{fmtShares(p.shares)}</span>
      <span><Chip color={p.actionMeta.color} small title={p.actionMeta.blurb}>{p.actionMeta.short}</Chip></span>
      <span style={{ textAlign: 'right' }}><Delta value={p.share_delta_pct} shown={p.deltaShown} /></span>
      <span style={cellR}>{p.quarters_held}</span>
      <span style={{ ...cellR, color: p.crowded ? 'var(--cf-accent)' : 'var(--cf-text7)' }}
        title={p.crowded ? `Держат ${p.crowdCount} отслеживаемых фонда` : t('Единственный отслеживаемый держатель', 'The only tracked holder')}>
        {p.crowded ? <><Users size={9} style={{ verticalAlign: -1 }} /> {p.crowdCount}</> : '1'}
      </span>
      <span style={{ ...cellR, color: 'var(--cf-accent)' }}>{p.fundConviction ?? '—'}</span>
      <span><FormBadge form={p.source_form} small /></span>
      <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LatencyBadge days={p.latency_days} asOf={p.as_of} form={p.source_form} />
      </span>
    </div>
  );
}
