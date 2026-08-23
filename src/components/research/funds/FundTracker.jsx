// ══════════════════════════════════════════════════════════════════════════
// FUND TRACKER — section 3 of the platform, and its own section on purpose.
//
// It does NOT share the Capital Flow map. Потоки draws transactions between
// parties, which is genuinely a graph. This draws a fixed set of independent
// funds and their books — there are no meaningful edges between funds, and
// folding this into the flow map would imply relationships that do not exist.
// Separate route, separate view, separate state; the only thing shared is the
// chrome (the map switch, the palette, the formatters, the chip grammar).
//
// Four surfaces over one payload:
//   УЗЛЫ     FundGrid     — nodes without links, size = book, colour = activity
//   ТАБЛИЦА  FundTable    — by fund / by position, sortable on every column
//   ЛЕНТА    FundTimeline — every filing event, newest first
//   panel    FundPanel    — one fund, one click, numbers only
// plus HolderLookup, the crossing view, reachable from any position row.
//
// Selection is one piece of state shared by all four, so picking a fund in the
// table highlights the same node in the grid.
// ══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, SlidersHorizontal, Search, X, LayoutGrid, Table2, Radio, AlertTriangle } from 'lucide-react';
import {
  TRACKED, WATCH, FUND_BY_ID, EVENTS, GENERATED, CYCLE, TOTALS,
  IS_FIXTURE, FIXTURE_NOTE, CROWDED, CROSSING, POSITION_ROWS,
} from '../../../data/fundTracker.js';
import { fmtUSD, fmtDate, plural } from './fundFormat.js';
import { MONO } from './FundBits.jsx';
import FundGrid from './FundGrid.jsx';
import FundPanel from './FundPanel.jsx';
import FundTable from './FundTable.jsx';
import FundTimeline from './FundTimeline.jsx';
import FundFilters from './FundFilters.jsx';
import HolderLookup from './HolderLookup.jsx';

const TOPBAR_H = 58;
const FIXTURE_BAR_H = 30;
const EMPTY = new Set();

export default function FundTracker({ onBack, mapSwitch }) {
  const [view, setView] = useState('nodes');
  const [tableMode, setTableMode] = useState('funds');
  const [selectedId, setSelectedId] = useState(null);
  const [lookup, setLookup] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // ── filter state ──────────────────────────────────────────────────────
  const [styles, setStyles] = useState(EMPTY);
  const [actions, setActions] = useState(EMPTY);
  const [sectors, setSectors] = useState(EMPTY);
  const [themes, setThemes] = useState(EMPTY);
  const [instruments, setInstruments] = useState(EMPTY);
  const [minScore, setMinScore] = useState(0);
  const [maxLatency, setMaxLatency] = useState(0);
  const [period, setPeriod] = useState(null);
  const [crowdedOnly, setCrowdedOnly] = useState(false);

  const toggler = (set, fn) => (k) => fn(prev => {
    const n = new Set(prev);
    n.has(k) ? n.delete(k) : n.add(k);
    return n;
  });

  const activeCount =
    styles.size + actions.size + sectors.size + themes.size + instruments.size +
    (minScore > 0 ? 1 : 0) + (maxLatency ? 1 : 0) + (period ? 1 : 0) + (crowdedOnly ? 1 : 0);

  const reset = useCallback(() => {
    setStyles(EMPTY); setActions(EMPTY); setSectors(EMPTY); setThemes(EMPTY);
    setInstruments(EMPTY); setMinScore(0); setMaxLatency(0); setPeriod(null);
    setCrowdedOnly(false);
  }, []);

  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', h, true);
    return () => document.removeEventListener('mousedown', h, true);
  }, []);
  useEffect(() => {
    const h = (e) => {
      if (e.key !== 'Escape') return;
      if (lookup) setLookup(null);
      else if (filtersOpen) setFiltersOpen(false);
      else if (selectedId) setSelectedId(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [lookup, filtersOpen, selectedId]);

  // ── the filter pass ───────────────────────────────────────────────────
  // A position-level filter narrows the BOOK; a fund survives only if
  // something in its book survived. That way "показать доборы в
  // полупроводниках" answers with the funds that did it and with the lines
  // themselves, not with fourteen untouched funds.
  const posActive = actions.size + sectors.size + themes.size + instruments.size > 0
    || !!maxLatency || !!period || crowdedOnly;

  const passPosition = useCallback((p) => {
    if (actions.size && !actions.has(p.action)) return false;
    if (sectors.size && !sectors.has(p.sector)) return false;
    if (themes.size && !themes.has(p.theme)) return false;
    if (instruments.size && !instruments.has(p.instrument)) return false;
    if (maxLatency && (p.latency_days ?? 1e9) > maxLatency) return false;
    if (period && p.as_of !== period) return false;
    if (crowdedOnly && !CROWDED.has(p.ticker)) return false;
    return true;
  }, [actions, sectors, themes, instruments, maxLatency, period, crowdedOnly]);

  const q = query.trim().toLowerCase();
  const matchesQuery = useCallback((f) => {
    if (!q) return true;
    return f.short_name.toLowerCase().includes(q)
      || f.name.toLowerCase().includes(q)
      || (f.principal || '').toLowerCase().includes(q)
      || f.positions.some(p => p.ticker.toLowerCase().includes(q) || p.issuer.toLowerCase().includes(q));
  }, [q]);

  const funds = useMemo(() => TRACKED.filter(f => {
    if (styles.size && !styles.has(f.style_tag)) return false;
    if (minScore > 0 && (f.conviction?.score ?? 0) < minScore) return false;
    if (!matchesQuery(f)) return false;
    if (posActive && !f.positions.some(passPosition)) return false;
    return true;
  }), [styles, minScore, matchesQuery, posActive, passPosition]);

  const watch = useMemo(() => WATCH.filter(w => {
    if (styles.size && !styles.has(w.style_tag)) return false;
    if (minScore > 0) return false;               // watch entities carry no score
    if (!matchesQuery(w)) return false;
    return true;
  }), [styles, minScore, matchesQuery]);

  const positions = useMemo(() => funds.flatMap(f => f.positions
    .filter(p => !posActive || passPosition(p))
    .map(p => ({
      ...p,
      crowded: CROWDED.has(p.ticker),
      crowdCount: CROSSING[p.ticker]?.holders || 1,
      fundConviction: f.conviction?.score ?? null,
    }))), [funds, posActive, passPosition]);

  const events = useMemo(() => {
    const ids = new Set([...funds, ...watch].map(f => f.id));
    return EVENTS.filter(e => ids.has(e.fund_id)
      && (!maxLatency || (e.latency_days ?? 1e9) <= maxLatency));
  }, [funds, watch, maxLatency]);

  const sectorsPresent = useMemo(() => new Set(TRACKED.flatMap(f => f.positions.map(p => p.sector))), []);
  const themesPresent = useMemo(() => new Set(TRACKED.flatMap(f => f.positions.map(p => p.theme))), []);
  const periods = useMemo(
    () => [...new Set(TRACKED.flatMap(f => f.positions.map(p => p.as_of)))].sort().reverse(), []);

  const selected = selectedId ? FUND_BY_ID[selectedId] : null;
  const visibleBook = funds.reduce((s, f) => s + (f.book_value_usd || 0), 0);
  const topInset = TOPBAR_H + (IS_FIXTURE ? FIXTURE_BAR_H : 0);

  return (
    <div style={{
      position: 'relative', height: 'calc(100vh - 81px)', minHeight: 480,
      background: 'var(--cf-canvas)', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes cfmSlide { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes cfmDrop  { from { transform: translateY(-10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>

      {/* ── body ───────────────────────────────────────────────────────── */}
      {view === 'nodes' && (
        <FundGrid funds={funds} watch={watch} selectedId={selectedId}
          onSelect={setSelectedId} topInset={topInset} />
      )}
      {view === 'table' && (
        <FundTable mode={tableMode} onMode={setTableMode} funds={funds} positions={positions}
          selectedId={selectedId} onSelect={setSelectedId} onOpenSecurity={setLookup}
          topInset={topInset} />
      )}
      {view === 'feed' && (
        <FundTimeline events={events} onSelect={setSelectedId} onOpenSecurity={setLookup}
          topInset={topInset} />
      )}

      {/* ── top bar ────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        height: TOPBAR_H, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px',
        background: 'var(--cf-canvas)', borderBottom: '1px solid var(--cf-border-hair)',
      }}>
        <button onClick={onBack} title="К библиотеке исследований"
          style={btn}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cf-text0)'; e.currentTarget.style.borderColor = 'var(--cf-text9)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cf-text3)'; e.currentTarget.style.borderColor = 'var(--cf-border)'; }}>
          <ChevronLeft size={13} /> Назад
        </button>
        {mapSwitch}

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              Трекер фондов
            </span>
            <span title={`Дата сборки файла. Возраст каждой строки считается от неё.\nОтчётный период: ${CYCLE?.period} · конец ${fmtDate(CYCLE?.period_end)}`}
              style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap', cursor: 'help' }}>
              НА {GENERATED}
            </span>
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 2, whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--cf-accent)', fontWeight: 700 }}>{fmtUSD(visibleBook)}</span>
            {activeCount || q ? ' в выборке' : ' раскрыто'}
            <span style={{ color: 'var(--cf-text9)' }}> · </span>
            {funds.length}<span style={{ color: 'var(--cf-text7)' }}>/{TOTALS.funds}</span> {plural(funds.length, ['фонд', 'фонда', 'фондов'])}
            <span style={{ color: 'var(--cf-text9)' }}> · </span>
            {positions.length}<span style={{ color: 'var(--cf-text7)' }}>/{POSITION_ROWS}</span> {plural(positions.length, ['позиция', 'позиции', 'позиций'])}
            {watch.length > 0 && (
              <>
                <span style={{ color: 'var(--cf-text9)' }}> · </span>
                <span style={{ color: 'var(--cf-muted)' }}>{watch.length} под наблюдением</span>
              </>
            )}
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ViewSwitch view={view} onView={setView} />

          <div ref={searchRef} style={{ position: 'relative' }}>
            {searchOpen ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px',
                background: 'var(--cf-surface2)', border: '1px solid var(--cf-text9)', borderRadius: 8, height: 30,
              }}>
                <Search size={12} style={{ color: 'var(--cf-text6)' }} />
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="фонд, управляющий, тикер…"
                  style={{
                    width: 190, background: 'none', border: 'none', outline: 'none',
                    color: 'var(--cf-text1)', fontSize: 11, fontFamily: MONO,
                  }} />
                <button onClick={() => { setQuery(''); setSearchOpen(false); }}
                  style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 0, lineHeight: 0 }}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} title="Поиск" style={{ ...btn, padding: '6px 9px' }}>
                <Search size={13} />{q && <span style={{ color: 'var(--cf-accent)' }}>{q}</span>}
              </button>
            )}
          </div>

          <button onClick={() => setFiltersOpen(o => !o)} title="Фильтры"
            style={{
              ...btn, padding: '6px 10px',
              borderColor: activeCount ? 'var(--cf-accent-bd)' : 'var(--cf-border)',
              color: activeCount ? 'var(--cf-accent)' : 'var(--cf-text3)',
            }}>
            <SlidersHorizontal size={13} /> Фильтры
            {activeCount > 0 && <span style={{ fontWeight: 700 }}>{activeCount}</span>}
          </button>
        </div>
      </div>

      {/* Synthetic data must never be able to pass for real filings. */}
      {IS_FIXTURE && (
        <div style={{
          position: 'absolute', top: TOPBAR_H, left: 0, right: 0, zIndex: 29,
          height: FIXTURE_BAR_H, boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px',
          background: 'var(--cf-warn-bg)', borderBottom: '1px solid var(--cf-warn-bd)',
        }}>
          <AlertTriangle size={12} style={{ color: 'var(--cf-warn)', flexShrink: 0 }} />
          <span style={{
            fontSize: 9.5, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-warn)',
            textTransform: 'uppercase', letterSpacing: '0.09em',
          }}>Демо-данные</span>
          <span style={{
            fontSize: 10, fontFamily: MONO, color: 'var(--cf-text4)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{FIXTURE_NOTE}</span>
        </div>
      )}

      {filtersOpen && (
        <FundFilters
          styles={styles} onStyle={toggler(styles, setStyles)}
          actions={actions} onAction={toggler(actions, setActions)}
          sectors={sectors} onSector={toggler(sectors, setSectors)} sectorsPresent={sectorsPresent}
          themes={themes} onTheme={toggler(themes, setThemes)} themesPresent={themesPresent}
          instruments={instruments} onInstrument={toggler(instruments, setInstruments)}
          minScore={minScore} onMinScore={setMinScore}
          maxLatency={maxLatency} onMaxLatency={setMaxLatency}
          periods={periods} period={period} onPeriod={setPeriod}
          crowdedOnly={crowdedOnly} onCrowdedOnly={setCrowdedOnly}
          activeCount={activeCount} onReset={reset} onClose={() => setFiltersOpen(false)}
        />
      )}

      {selected && (
        <FundPanel fund={selected} top={topInset} onClose={() => setSelectedId(null)} onOpenSecurity={setLookup} />
      )}

      {lookup && (
        <HolderLookup ticker={lookup} onClose={() => setLookup(null)} onSelect={setSelectedId} />
      )}
    </div>
  );
}

const btn = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '6px 10px 6px 6px', height: 30, boxSizing: 'border-box',
  background: 'var(--cf-topbar)', border: '1px solid var(--cf-border)', borderRadius: 8,
  color: 'var(--cf-text3)', fontSize: 11, fontFamily: MONO, fontWeight: 600, cursor: 'pointer',
};

function ViewSwitch({ view, onView }) {
  const opts = [
    { key: 'nodes', label: 'Узлы',    icon: LayoutGrid, hint: 'Фонды как узлы: размер — книга, цвет — движение за период.' },
    { key: 'table', label: 'Таблица', icon: Table2,     hint: 'Всё строками: по фондам или по позициям, сортировка по любому столбцу.' },
    { key: 'feed',  label: 'Лента',   icon: Radio,      hint: 'Все события раскрытия, новые сверху.' },
  ];
  return (
    <div style={{
      display: 'flex', gap: 2, padding: 2, height: 30, boxSizing: 'border-box',
      background: 'var(--cf-surface2)', border: '1px solid var(--cf-border)', borderRadius: 8,
    }}>
      {opts.map(o => {
        const on = view === o.key;
        const Icon = o.icon;
        return (
          <button key={o.key} onClick={() => onView(o.key)} title={o.hint}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0 9px',
              background: on ? 'var(--cf-surface3)' : 'transparent',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              color: on ? 'var(--cf-text0)' : 'var(--cf-text5)',
              fontSize: 10, fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
            <Icon size={12} /> {o.label}
          </button>
        );
      })}
    </div>
  );
}
