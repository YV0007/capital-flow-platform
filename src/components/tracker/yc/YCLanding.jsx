// Landing list: page header + search + sector filter + responsive card grid.
import React, { useMemo, useState } from 'react';
import YCCompanyCard from './YCCompanyCard.jsx';
import YCSectorFilter from './YCSectorFilter.jsx';

export default function YCLanding({ companies, onOpen }) {
  const [query, setQuery] = useState('');
  const [activeSectors, setActiveSectors] = useState(new Set());

  // Collect all unique sectors across the portfolio.
  const allSectors = useMemo(() => {
    const set = new Set();
    companies.forEach(c => (c.sectors || []).forEach(s => set.add(s)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [companies]);

  const toggleSector = (sector) => {
    setActiveSectors(prev => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
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
      if (activeSectors.size > 0) {
        const has = (c.sectors || []).some(s => activeSectors.has(s));
        if (!has) return false;
      }
      return true;
    });
  }, [companies, query, activeSectors]);

  // Take the first company's batch as the page heading (all are same batch in v1).
  const batch = companies[0]?.batch || '';

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
            · {batch || 'Лето 2026'}
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#71717a' }}>
          {companies.length} компаний в портфеле наблюдения
        </div>
      </div>

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

      {/* Sector filter chips */}
      <YCSectorFilter
        sectors={allSectors}
        active={activeSectors}
        onToggle={toggleSector}
        onClear={() => setActiveSectors(new Set())}
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
    </div>
  );
}
