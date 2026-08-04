// Landing list: page header + investor stats strip + search + sector filter
// + responsive card grid. The stats strip reframes the directory around WHO
// invested (the point of the tracker) rather than only the companies.
import React, { useMemo, useState } from 'react';
import YCCompanyCard from './YCCompanyCard.jsx';
import YCBatchStats from './YCBatchStats.jsx';
import investmentData from '../../../data/yc-investment.json';

// Roll up the investment layer into headline numbers for the strip.
function computeInvestorStats() {
  const companies = Object.values(investmentData.companies || {});
  const total = companies.length;
  let withExternal = 0, ycOnly = 0, mfn = 0;
  const investorCount = {};

  companies.forEach(c => {
    const ext = (c.external_investors || []);
    const hasExt = c.tier === 'external' && ext.length > 0;
    if (hasExt) withExternal++; else ycOnly++;
    if (c.cap === 'не зафиксирована') mfn++;
    ext.forEach(inv => {
      investorCount[inv.name] = (investorCount[inv.name] || 0) + 1;
    });
  });

  // Median valuation cap across the companies that have a fixed cap.
  const caps = companies
    .map(c => {
      const m = /\$(\d+(?:\.\d+)?)M/.exec(c.cap || '');
      return m ? Number(m[1]) : null;
    })
    .filter(v => v != null)
    .sort((a, b) => a - b);
  let medianCap = null;
  if (caps.length) {
    const mid = Math.floor(caps.length / 2);
    medianCap = caps.length % 2 ? caps[mid] : (caps[mid - 1] + caps[mid]) / 2;
  }

  return { total, withExternal, ycOnly, mfn, medianCap };
}

// Toloka facts from its own P26 disclosure (dev.ua / vctr.media), used in
// the headline strip alongside the computed counts.
const TOLOKA = { deployedUsd: 1_400_000, avgCheckUsd: 66_700 };

// Funding-based filters (replace the old sector filter). Each tests a
// company's investment record. A company matches the active set if it
// satisfies ANY selected filter.
const FUNDING_FILTERS = [
  { key: 'external', label: 'С внешними инвесторами',
    match: (inv) => inv?.tier === 'external' && (inv.external_investors || []).length > 0 },
  { key: 'yconly', label: 'Только сделка YC',
    match: (inv) => !(inv?.tier === 'external' && (inv.external_investors || []).length > 0) },
  { key: 'angel', label: 'Есть ангелы',
    match: (inv) => (inv?.external_investors || []).some(x => x.type === 'angel') },
  { key: 'grants', label: 'Есть гранты',
    match: (inv) => (inv?.non_equity || []).length > 0 },
  { key: 'nocap', label: 'Оценка не зафиксирована',
    match: (inv) => inv?.cap === 'не зафиксирована' },
];

export default function YCLanding({ companies, onOpen }) {
  const [query, setQuery] = useState('');
  const [activeFunding, setActiveFunding] = useState(new Set());

  const toggleFunding = (key) => {
    setActiveFunding(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter(c => {
      if (q) {
        const hay = (c.name + ' ' + c.tagline + ' ' + c.description).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (activeFunding.size > 0) {
        const inv = investmentData.companies?.[c.id];
        const ok = FUNDING_FILTERS.some(f => activeFunding.has(f.key) && f.match(inv));
        if (!ok) return false;
      }
      return true;
    });
  }, [companies, query, activeFunding]);

  // Take the first company's batch as the page heading (all are same batch in v1).
  const batch = companies[0]?.batch || '';
  const stats = useMemo(computeInvestorStats, []);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap',
          marginBottom: 6,
        }}>
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: '#fafafa',
            letterSpacing: '-0.02em', lineHeight: 1.1, margin: 0,
          }}>
            Y Combinator
          </h1>
          <span style={{
            fontSize: 14, color: '#a1a1aa', fontWeight: 500,
            fontFamily: 'ui-monospace,monospace',
          }}>
            · {batch || 'Весна 2026'}
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#71717a' }}>
          {companies.length} компаний в портфеле наблюдения
        </div>
      </div>

      {/* Investor stats strip — who's actually putting money in */}
      <InvestorStatsStrip stats={stats} />

      {/* Search */}
      <div style={{ marginBottom: 14 }}>
        <input
          type="text"
          placeholder="Поиск по компаниям"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', fontSize: 14,
            background: '#18181b', border: '1px solid #27272a',
            borderRadius: 8, color: '#fafafa',
            fontFamily: 'inherit', outline: 'none',
            transition: 'border-color 160ms',
          }}
          onFocus={e => e.target.style.borderColor = '#3f3f46'}
          onBlur={e => e.target.style.borderColor = '#27272a'}
        />
      </div>

      {/* Funding filter chips — filter by how the company is funded */}
      <FundingFilter
        active={activeFunding}
        onToggle={toggleFunding}
        onClear={() => setActiveFunding(new Set())}
      />

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '60px 20px', textAlign: 'center',
          color: '#71717a', fontSize: 14,
          background: '#0d0d0e', border: '1px solid #18181b',
          borderRadius: 10, marginTop: 20,
        }}>
          Ничего не найдено
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 14, marginTop: 20,
        }}>
          {filtered.map(c => (
            <YCCompanyCard key={c.id} company={c} onClick={() => onOpen(c.id)} />
          ))}
        </div>
      )}

      {/* Batch-wide metrics + Toloka comparison, below the company list */}
      <YCBatchStats />

      {/* Data-freshness note — lives at the bottom of the view, not in the
          top chrome (a memo "as-of" date makes no sense for a directory). */}
      <div style={{
        marginTop: 28, paddingTop: 16, borderTop: '1px solid #18181b',
        fontSize: 11.5, color: '#52525b', lineHeight: 1.6,
      }}>
        Данные по компаниям — с их страниц на Y Combinator. Данные по инвесторам собраны из открытых
        источников (Extruct, PitchBook, Tracxn, посты фондов). Обновлено: август 2026.
      </div>
    </div>
  );
}

// Correct Russian plural for "компания".
function companiesWord(n) {
  const d = n % 10, dd = n % 100;
  if (d === 1 && dd !== 11) return 'компания';
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return 'компании';
  return 'компаний';
}

// ─────────────────────────────────────────────────────────────────────────
// Headline strip — clean Toloka top metrics (no icons, per the ask). The
// deeper batch/Toloka comparison lives in the big block below the grid.
// ─────────────────────────────────────────────────────────────────────────
function InvestorStatsStrip({ stats }) {
  const pct = Math.round((stats.withExternal / stats.total) * 100);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 12, marginBottom: 22,
    }}>
      <BigMetric value={stats.total} unit={companiesWord(stats.total)} label="у Toloka в портфеле" accent="#fafafa" />
      <BigMetric value={stats.withExternal} unit={companiesWord(stats.withExternal)}
        label={`с внешними инвесторами · ${pct}%`} accent="#34d399" />
      <BigMetric value={`~$${Math.round(TOLOKA.avgCheckUsd / 1000)}K`} label="средний чек Toloka" accent="#60a5fa" />
      <BigMetric value={stats.medianCap != null ? `$${stats.medianCap}M` : '—'} label="медианный потолок оценки" accent="#a78bfa" />
    </div>
  );
}

function BigMetric({ value, unit, label, accent = '#fafafa' }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: '#0c0c0e', border: '1px solid #1c1c20',
      borderRadius: 14, padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.55 }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
        <span style={{ fontSize: 27, fontWeight: 700, color: accent, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 12.5, color: '#a1a1aa', fontWeight: 500 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 11.5, color: '#71717a', lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Funding filter — replaces the old sector filter. Chips over how each
// company is funded.
// ─────────────────────────────────────────────────────────────────────────
function FundingFilter({ active, onToggle, onClear }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      marginBottom: 4,
    }}>
      <span style={{
        fontSize: 10, color: '#52525b', fontFamily: 'ui-monospace,monospace',
        letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
        marginRight: 2,
      }}>Финансирование</span>
      {FUNDING_FILTERS.map(f => {
        const on = active.has(f.key);
        return (
          <button
            key={f.key}
            onClick={() => onToggle(f.key)}
            style={{
              fontSize: 12, fontWeight: 500,
              padding: '7px 13px', borderRadius: 20, cursor: 'pointer',
              font: 'inherit',
              color: on ? '#052e21' : '#d4d4d8',
              background: on ? '#34d399' : '#161619',
              border: `1px solid ${on ? '#34d399' : '#27272a'}`,
              transition: 'all 140ms', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!on) e.currentTarget.style.borderColor = '#3f3f46'; }}
            onMouseLeave={e => { if (!on) e.currentTarget.style.borderColor = '#27272a'; }}
          >
            {f.label}
          </button>
        );
      })}
      {active.size > 0 && (
        <button
          onClick={onClear}
          style={{
            fontSize: 12, color: '#71717a', background: 'transparent',
            border: 'none', cursor: 'pointer', font: 'inherit', padding: '7px 6px',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fafafa'}
          onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
        >
          сбросить
        </button>
      )}
    </div>
  );
}
