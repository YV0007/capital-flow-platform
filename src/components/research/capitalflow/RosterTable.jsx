// Tracking roster — the complete table view of who is currently being tracked.
// One row per entity in the engine payload, labelled by what it is and which
// dimension is monitored (investor deploying vs company/project receiving).
// Sortable, filterable, watchlist-aware; a row click jumps back to the map
// with that entity selected — table and map are two views of one universe.

import { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { fmtUSD } from './format.js';
import { SECTOR_META, CLASS_META, TIER_META, THEME_META } from '../../../data/capitalMap.js';
import { WatchlistMenu } from './WatchlistControl.jsx';

const MONO = 'ui-monospace, monospace';

// The dimension being monitored, spelled out — investor vs company vs
// project vs fund vs asset. Derived 1:1 from the payload's kind + cls.
function dimensionOf(n) {
  if (n.kind === 'allocator') return { label: 'Investor', sub: 'capital deployed →', color: '#C2A36B' };
  if (n.cls === 'fund') return { label: 'Fund', sub: '→ vehicle raised', color: '#C9985F' };
  if (n.cls === 'project') return { label: 'Project', sub: '→ buildout funded', color: '#C99B72' };
  if (n.cls === 'asset') return { label: 'Asset', sub: '→ position taken', color: '#98A2AE' };
  return { label: 'Company', sub: '→ capital received', color: '#82B98D' };
}

function statusOf(n) {
  if (n.stale) return { label: 'Cooled', color: '#94A3B8', title: 'No activity in 180 days' };
  if (n.watchOnly) return { label: 'Watch', color: '#71717a', title: 'Candidate flows only — unconfirmed' };
  return { label: 'Active', color: '#34D399', title: 'Confirmed activity in the current window' };
}

const COLS = [
  { key: 'name', label: 'Entity', sort: (n) => n.name.toLowerCase() },
  { key: 'dimension', label: 'Tracked as', sort: (n) => (n.kind === 'allocator' ? 0 : 1) },
  { key: 'cls', label: 'Class', sort: (n) => CLASS_META[n.cls]?.label || n.cls },
  { key: 'tier', label: 'Tier', sort: (n) => (n.tier === 'core' ? 0 : n.tier === 'key' ? 1 : n.tier === 'watch' ? 2 : 3) },
  { key: 'sector', label: 'Sector · theme', sort: (n) => SECTOR_META[n.sector]?.label || n.sector || '~' },
  { key: 'deals', label: 'Deals', sort: (n) => n.deals, num: true },
  { key: 'capital', label: 'Capital', sort: (n) => n.capital, num: true },
  { key: 'last', label: 'Last activity', sort: (n) => n.last_activity || '', num: true },
  { key: 'status', label: 'Status', sort: (n) => (n.stale ? 2 : n.watchOnly ? 1 : 0) },
];

export default function RosterTable({ nodes, query, activeList, wl, onOpenEntity, topInset = 0 }) {
  const [kind, setKind] = useState('all');            // all | allocator | target
  const [sortKey, setSortKey] = useState('capital');
  const [sortDir, setSortDir] = useState(-1);         // -1 desc · 1 asc

  const rows = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    const member = activeList ? new Set(activeList.ids) : null;
    const col = COLS.find(c => c.key === sortKey) || COLS[6];
    const filtered = nodes.filter(n =>
      (kind === 'all' || n.kind === kind)
      && (!member || member.has(n.id))
      && (!q || n.name.toLowerCase().includes(q) || n.label.toLowerCase().includes(q))
    );
    return filtered.sort((a, b) => {
      const va = col.sort(a), vb = col.sort(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sortDir;
    });
  }, [nodes, query, kind, activeList, sortKey, sortDir]);

  const header = (c) => {
    const on = sortKey === c.key;
    return (
      <th key={c.key}
        onClick={() => { on ? setSortDir(d => -d) : (setSortKey(c.key), setSortDir(c.num ? -1 : 1)); }}
        style={{
          position: 'sticky', top: 0, zIndex: 2, background: '#0b0c10',
          padding: '10px 14px', textAlign: c.num ? 'right' : 'left',
          fontSize: 9, color: on ? '#38BDF8' : '#6b6b74', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
          borderBottom: '1px solid #1e1e23', whiteSpace: 'nowrap', userSelect: 'none',
        }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {c.label}
          {on && (sortDir === 1 ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
        </span>
      </th>
    );
  };

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, top: topInset, zIndex: 20,
      background: '#08090C', overflowY: 'auto',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '18px 24px 60px' }}>
        {/* Scope line + kind chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, color: '#71717a', fontFamily: MONO }}>
            {rows.length} of {nodes.length} tracked entit{rows.length === 1 ? 'y' : 'ies'}
            {activeList ? <> · watchlist <span style={{ color: '#38BDF8', fontWeight: 700 }}>{activeList.name}</span></> : null}
            {query ? <> · matching “{query}”</> : null}
          </span>
          <span style={{ flex: 1 }} />
          {[['all', 'All'], ['allocator', 'Allocators'], ['target', 'Targets']].map(([k, label]) => (
            <button key={k} onClick={() => setKind(k)}
              style={{
                padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
                background: kind === k ? 'rgba(56,189,248,0.1)' : '#121318',
                border: `1px solid ${kind === k ? 'rgba(56,189,248,0.38)' : '#26262e'}`,
                color: kind === k ? '#38BDF8' : '#a1a1aa',
                fontSize: 10, fontFamily: MONO, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ border: '1px solid #1e1e23', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{COLS.map(header)}<th style={{
              position: 'sticky', top: 0, zIndex: 2, background: '#0b0c10',
              borderBottom: '1px solid #1e1e23', width: 40,
            }} /></tr></thead>
            <tbody>
              {rows.map(n => {
                const dim = dimensionOf(n);
                const st = statusOf(n);
                const tier = n.tier ? TIER_META[n.tier] : null;
                const sec = n.sector ? SECTOR_META[n.sector] : null;
                const theme = n.themeKey ? THEME_META[n.themeKey] : null;
                return (
                  <tr key={n.id}
                    onClick={() => onOpenEntity(n.id)}
                    title={`Open ${n.name} on the map`}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #15161b' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#0e0f14')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    {/* Entity */}
                    <td style={{ padding: '9px 14px', minWidth: 180 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {n.country
                          ? <img src={`/flags/${n.country}.png`} alt={n.countryLabel || n.country}
                              title={n.countryLabel || n.country}
                              style={{ width: 16, height: 'auto', borderRadius: 2, flexShrink: 0 }} />
                          : <span style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, flexShrink: 0 }} />}
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7' }}>{n.name}</span>
                      </span>
                    </td>
                    {/* Dimension monitored */}
                    <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 10, fontFamily: MONO, fontWeight: 700, color: dim.color }}>{dim.label}</span>
                      <span style={{ fontSize: 9, fontFamily: MONO, color: '#52525b', marginLeft: 6 }}>{dim.sub}</span>
                    </td>
                    {/* Class */}
                    <td style={{ padding: '9px 14px', fontSize: 10.5, fontFamily: MONO, color: '#a1a1aa', whiteSpace: 'nowrap' }}>
                      {CLASS_META[n.cls]?.label || n.cls}
                    </td>
                    {/* Tier */}
                    <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                      {tier
                        ? <span title={tier.blurb} style={{ fontSize: 9.5, fontFamily: MONO, fontWeight: 700, color: tier.color, cursor: 'help' }}>
                            {tier.short} {tier.stars}
                          </span>
                        : <span style={{ color: '#3f3f46', fontSize: 10 }}>—</span>}
                    </td>
                    {/* Sector · theme */}
                    <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                      {sec
                        ? <span style={{ fontSize: 10, fontFamily: MONO, color: sec.color }}>
                            {sec.label}
                            {theme && <span style={{ color: '#52525b' }}> · {theme.label}</span>}
                          </span>
                        : <span style={{ color: '#3f3f46', fontSize: 10 }}>—</span>}
                    </td>
                    {/* Deals */}
                    <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 11, fontFamily: MONO, color: '#a1a1aa' }}>
                      {n.deals}
                    </td>
                    {/* Capital — 0 with deals on file = undisclosed, not zero */}
                    <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 11.5, fontFamily: MONO, fontWeight: 700, color: n.capital > 0 ? '#fafafa' : '#52525b' }}>
                      {n.capital > 0 ? fmtUSD(n.capital) : n.degree > 0 ? 'undisclosed' : '$0'}
                    </td>
                    {/* Last activity */}
                    <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 10, fontFamily: MONO, color: '#71717a', whiteSpace: 'nowrap' }}>
                      {n.last_activity || '—'}
                    </td>
                    {/* Status */}
                    <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                      <span title={st.title} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 9.5, fontFamily: MONO, fontWeight: 700, color: st.color, cursor: 'help',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color }} />
                        {st.label}
                      </span>
                    </td>
                    {/* Watchlist bookmark */}
                    <td style={{ padding: '9px 10px' }} onClick={(e) => e.stopPropagation()}>
                      <WatchlistMenu wl={wl} entityId={n.id} size={13} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 11, color: '#52525b', fontFamily: MONO }}>
              Nothing matches — clear the search{activeList ? ' or deactivate the watchlist' : ''}.
            </div>
          )}
        </div>

        <div style={{ marginTop: 10, fontSize: 9, color: '#4a4a53', fontFamily: MONO, lineHeight: 1.6 }}>
          The tracking universe as delivered by the engine payload — every entity with at least one tracked flow.
          “Watch” rows carry only unconfirmed candidate flows; “Cooled” rows have been idle 180 days.
          Click a row to open the entity on the map.
        </div>
      </div>
    </div>
  );
}
