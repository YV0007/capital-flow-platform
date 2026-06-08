// ══════════════════════════════════════════════════════════════════════════
// RESEARCH: DATA CENTERS FOR AI
// The main report body — 7 numbered sections from Investment Thesis through
// Executive Summary. The coverage universe (41 companies) lives in
// src/data/dc-companies.json; bucket definitions, color, copy, ordering and
// logo domains live in src/data/dc-buckets.json. Edit those JSONs to change
// the report contents — everything below derives from them.
// ══════════════════════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useState } from 'react';
import {
  Target, PieChart, Table2, Share2, Activity, AlertTriangle, TrendingUp, FileText, ChevronDown,
} from 'lucide-react';
import dcCompaniesData from '../../data/dc-companies.json';
import dcBucketsData from '../../data/dc-buckets.json';
import AssetMap from './dc/AssetMap.jsx';
import { BucketPie, BucketSidePanel } from './dc/BucketPie.jsx';

// Reconstitute the JSON layer at module scope — same pattern as HoldingsTab.
const DC_COMPANIES        = dcCompaniesData;
const {
  DC_CONVICTION_ORDER,
  DC_RISK_ORDER,
  DC_PPR_ORDER,
  DC_CONVICTION_STYLE,
  DC_RISK_STYLE,
  DC_BUCKETS,
} = dcBucketsData;

// Returns the bucket name for any DC_COMPANIES sector value.
function dcBucketFor(sector) {
  for (const [name, def] of Object.entries(DC_BUCKETS)) {
    if (def.sectors.includes(sector)) return name;
  }
  return 'Other';
}

// Small styled select wrapper used in the filter bar.
function DcFilterSelect({ value, onChange, options, placeholder, labels }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        padding: '8px 10px', fontSize: 11.5, fontFamily: 'inherit',
        background: '#18181b', border: '1px solid #27272a',
        borderRadius: 6, color: value ? '#fafafa' : '#71717a',
        cursor: 'pointer', outline: 'none', minWidth: 130,
      }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{labels?.[o] || o}</option>)}
    </select>
  );
}

export default function DataCentersAI() {
  const [search, setSearch]       = useState('');
  const [fBucket, setFBucket]     = useState('');
  const [fConv, setFConv]         = useState('');
  const [fRisk, setFRisk]         = useState('');
  const [fPpr, setFPpr]           = useState('');
  const [sortKey, setSortKey]     = useState('conviction');
  const [sortDir, setSortDir]     = useState('asc');     // 'asc' | 'desc'
  const [hoveredBucket, setHoveredBucket] = useState(null);
  const [matrixView, setMatrixView] = useState('table');  // 'table' | 'map'

  // ─ derived data ─────────────────────────────────────────────────────────
  const enriched = useMemo(() => DC_COMPANIES.map(c => ({
    ...c,
    bucket: dcBucketFor(c.sector),
  })), []);

  // Bucket counts for the pie + side panel
  const bucketStats = useMemo(() => {
    const tally = {};
    enriched.forEach(c => { tally[c.bucket] = (tally[c.bucket] || 0) + 1; });
    const total = enriched.length;
    return Object.keys(DC_BUCKETS).map(name => ({
      name,
      count: tally[name] || 0,
      pct: ((tally[name] || 0) / total) * 100,
      ...DC_BUCKETS[name],
    })).sort((a, b) => b.count - a.count);
  }, [enriched]);

  // Filter + sort the table
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = enriched.filter(r => {
      if (q && !(r.company.toLowerCase().includes(q) || r.ticker.toLowerCase().includes(q))) return false;
      if (fBucket && r.bucket !== fBucket) return false;
      if (fConv && r.conviction !== fConv) return false;
      if (fRisk && r.riskTier !== fRisk) return false;
      if (fPpr && r.ppr !== fPpr) return false;
      return true;
    });
    const order = {
      conviction: r => DC_CONVICTION_ORDER.indexOf(r.conviction),
      riskTier:   r => DC_RISK_ORDER.indexOf(r.riskTier),
      ppr:        r => DC_PPR_ORDER.indexOf(r.ppr),
      bucket:     r => r.bucket,
      company:    r => r.company.toLowerCase(),
      ticker:     r => r.ticker.toLowerCase(),
      sector:     r => r.sector.toLowerCase(),
      horizon:    r => r.horizon,
      geo:        r => r.geo,
    };
    const fn = order[sortKey] || order.conviction;
    rows.sort((a, b) => {
      const va = fn(a), vb = fn(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return rows;
  }, [enriched, search, fBucket, fConv, fRisk, fPpr, sortKey, sortDir]);

  const handleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  };

  const SortArrow = ({ active, dir }) => (
    <span style={{
      display: 'inline-block', marginLeft: 4,
      color: active ? '#22D3EE' : '#3f3f46',
      fontSize: 9,
    }}>
      {active ? (dir === 'asc' ? '▲' : '▼') : '▾'}
    </span>
  );

  // ─ Section header helper (used for all numbered sections) ───────────────
  // 96px gradient divider band → colored icon → numbered tag → title + subtitle.
  // The numbered tag preserves the report's ordered structure; the icon adds
  // quick visual identity; the gradient divider gives each section a clear
  // chapter break.
  const SectionHeader = ({ num, title, sub, accent, icon: Icon, noDivider }) => (
    <>
      {!noDivider && (
        <div style={{
          height: 96,
          background: 'linear-gradient(to right, transparent, #27272a, transparent)',
          backgroundSize: '100% 1px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          marginTop: 12, marginBottom: 4,
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        {Icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${accent}14`,
            border: `1px solid ${accent}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </div>
        )}
        <span style={{
          fontFamily: 'ui-monospace,monospace', fontSize: 11,
          color: accent || '#52525b', letterSpacing: '0.14em',
          fontWeight: 700, minWidth: 22,
        }}>
          0{num}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, color: '#71717a', textTransform: 'uppercase',
            letterSpacing: '0.12em', fontFamily: 'ui-monospace,monospace',
            fontWeight: 700, marginBottom: 4,
          }}>
            {title}
          </div>
          {sub && (
            <div style={{ fontSize: 11.5, color: '#a1a1aa', lineHeight: 1.4 }}>
              {sub}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div style={{ marginTop: 8 }}>

      {/* ══════════════ 01. Investment Thesis ══════════════ */}
      <SectionHeader icon={Target} num="1" title="Investment Thesis" sub="Bottleneck capture · structural edge, not informational" accent="#22D3EE" noDivider />

      <div style={{
        background: 'linear-gradient(135deg, rgba(34,211,238,0.06) 0%, #18181b 50%, rgba(167,139,250,0.04) 100%)',
        border: '1px solid #27272a',
        borderLeft: '3px solid #22D3EE',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* THE POSITION */}
        <div style={{ padding: '26px 30px 24px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
            <span style={{
              fontSize: 11, color: '#22D3EE', fontFamily: 'ui-monospace,monospace',
              letterSpacing: '0.16em', fontWeight: 700,
              padding: '3px 9px',
              background: 'rgba(34,211,238,0.08)',
              border: '1px solid rgba(34,211,238,0.25)',
              borderRadius: 4,
            }}>THE POSITION</span>
            <span style={{
              fontSize: 10.5, color: '#71717a', fontFamily: 'ui-monospace,monospace', fontStyle: 'italic',
            }}>what we own · what we avoid</span>
          </div>

          <div style={{ fontSize: 14.5, color: '#e4e4e7', lineHeight: 1.75 }}>
            Own the <strong style={{ color: '#fafafa' }}>physical and software bottlenecks the AI buildout must flow through</strong> — power, transformers, advanced packaging, EDA software, MEP labor, fiber, specialty materials — rather than the hyperscalers, Nvidia, or the application layer. Pair the industrial core with small <strong style={{ color: '#fafafa' }}>private-market and binary optionality</strong> on silicon designers, neoclouds, and frontier labs.
          </div>
        </div>

        {/* Divider with chevron */}
        <div style={{ position: 'relative', height: 1, background: '#27272a', margin: '0 30px' }}>
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '50%',
            width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronDown className="w-3 h-3" style={{ color: '#52525b' }} />
          </div>
        </div>

        {/* THE EDGE */}
        <div style={{ padding: '24px 30px 26px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
            <span style={{
              fontSize: 11, color: '#a78bfa', fontFamily: 'ui-monospace,monospace',
              letterSpacing: '0.16em', fontWeight: 700,
              padding: '3px 9px',
              background: 'rgba(167,139,250,0.08)',
              border: '1px solid rgba(167,139,250,0.25)',
              borderRadius: 4,
            }}>THE EDGE</span>
            <span style={{
              fontSize: 10.5, color: '#71717a', fontFamily: 'ui-monospace,monospace', fontStyle: 'italic',
            }}>why this works · the thesis is consensus, the execution is not</span>
          </div>

          <div style={{ fontSize: 14.5, color: '#e4e4e7', lineHeight: 1.75, marginBottom: 22 }}>
            The strategy is not <em style={{ color: '#a1a1aa', fontStyle: 'italic' }}>"pick the AI winner."</em> It is <strong style={{ color: '#fafafa' }}>owning the choke points where physical supply is constrained for 2–5 years and demand is locked in by signed contracts</strong>. The edge is not informational — the thesis is consensus — but structural:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
            {[
              { tag: '01', title: 'Time horizon', body: 'Longer than institutional capital can hold.' },
              { tag: '02', title: 'Discipline',   body: 'Through drawdowns, when others are forced to sell.' },
              { tag: '03', title: 'Access',       body: 'Private and small-cap names where the market is inefficient by construction.' },
            ].map((e, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid #27272a',
                borderTop: '2px solid #a78bfa',
                borderRadius: 6, padding: '14px 16px',
              }}>
                <div style={{
                  fontSize: 11, color: '#a78bfa', fontFamily: 'ui-monospace,monospace',
                  fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em',
                }}>{e.tag}</div>
                <div style={{ fontSize: 13, color: '#fafafa', fontWeight: 600, marginBottom: 6 }}>
                  {e.title}
                </div>
                <div style={{ fontSize: 11.5, color: '#a1a1aa', lineHeight: 1.55 }}>
                  {e.body}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            paddingTop: 16, borderTop: '1px solid #27272a',
            fontSize: 13.5, color: '#e4e4e7', lineHeight: 1.7,
          }}>
            We earn the <strong style={{ color: '#a78bfa' }}>compounding of real backlogs</strong>, not a re-rating.
          </div>
        </div>
      </div>

      {/* ══════════════ 02. Coverage by Sector ══════════════ */}
      <SectionHeader icon={PieChart} num="2" title="Coverage by Sector" sub="6 broad buckets · hover for top company per bucket" accent="#a78bfa" />

      <div style={{
        background: '#18181b', border: '1px solid #27272a',
        borderRadius: 10, padding: '28px 30px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 36, alignItems: 'center' }}>
          <BucketPie buckets={bucketStats} hovered={hoveredBucket} setHovered={setHoveredBucket} />
          <BucketSidePanel buckets={bucketStats} hovered={hoveredBucket} setHovered={setHoveredBucket} />
        </div>
      </div>

      {/* ══════════════ 03. Company Matrix ══════════════ */}
      <SectionHeader icon={Table2} num="3" title="Company Matrix" sub={`${visibleRows.length} of ${enriched.length} companies · sortable & filterable`} accent="#22D3EE" />

      <div style={{
        background: '#0d0d0e',
        border: '2px solid #27272a',
        borderRadius: 14,
        padding: '20px 20px 24px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.02)',
      }}>
        {/* Header callout above the table */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
          padding: '4px 6px 18px 6px',
          borderBottom: '1px solid #1f1f23',
          marginBottom: 18,
        }}>
          <div>
            <div style={{
              fontSize: 10, color: '#22D3EE', fontFamily: 'ui-monospace,monospace',
              textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700,
              marginBottom: 6,
            }}>
              The Universe
            </div>
            <div style={{ fontSize: 18, color: '#fafafa', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 16 }}>
              41 companies across the AI infrastructure stack
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
              {[
                { val: enriched.filter(r => r.ppr === 'Pub').length, label: 'Public',  color: '#10b981' },
                { val: enriched.filter(r => r.ppr === 'Pvt').length, label: 'Private', color: '#a78bfa' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'ui-monospace,monospace', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {s.val}
                  </span>
                  <span style={{ fontSize: 9.5, color: '#71717a', fontFamily: 'ui-monospace,monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Table / Asset Map switcher */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              position: 'relative', display: 'inline-flex',
              padding: 3, borderRadius: 999,
              background: '#0a0a0a', border: '1px solid #2a2a2f',
            }}>
              <div style={{
                position: 'absolute', top: 3, bottom: 3,
                left: matrixView === 'table' ? 3 : 'calc(50% + 0px)',
                width: 'calc(50% - 3px)',
                background: 'linear-gradient(180deg, #2bd9f2, #18b8d1)',
                borderRadius: 999,
                boxShadow: '0 2px 10px rgba(34,211,238,0.30)',
                transition: 'left 200ms cubic-bezier(0.4,0,0.2,1)',
              }} />
              {[
                { key: 'table', label: 'Table',     icon: Table2 },
                { key: 'map',   label: 'Asset Map', icon: Share2 },
              ].map(opt => {
                const active = matrixView === opt.key;
                const Icon = opt.icon;
                return (
                  <button key={opt.key}
                    onClick={() => setMatrixView(opt.key)}
                    style={{
                      position: 'relative', zIndex: 1,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      padding: '8px 18px', borderRadius: 999, cursor: 'pointer',
                      border: 'none', background: 'transparent',
                      fontFamily: 'ui-monospace,monospace',
                      fontSize: 11.5, fontWeight: 700, letterSpacing: '0.03em',
                      color: active ? '#04141a' : '#a1a1aa',
                      transition: 'color 160ms', minWidth: 104,
                    }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: active ? '#04141a' : '#71717a' }} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inner content — Table or Asset Map depending on the toggle */}
        {matrixView === 'map' ? (
          <AssetMap rows={enriched} />
        ) : (
        <div style={{
          background: '#18181b', border: '1px solid #27272a',
          borderRadius: 10, overflow: 'hidden',
        }}>
          {/* Filter bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '16px 20px', borderBottom: '1px solid #27272a',
            background: '#0f0f10', flexWrap: 'wrap',
          }}>
            <input
              type="text"
              placeholder="Search company or ticker…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: '1 1 220px', minWidth: 180,
                padding: '10px 14px', fontSize: 13,
                background: '#18181b', border: '1px solid #27272a',
                borderRadius: 6, color: '#fafafa',
                fontFamily: 'inherit', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#22D3EE'}
              onBlur={e => e.target.style.borderColor = '#27272a'}
            />
            <DcFilterSelect value={fBucket} onChange={setFBucket} options={Object.keys(DC_BUCKETS)} placeholder="All sectors" />
            <DcFilterSelect value={fConv}   onChange={setFConv}   options={DC_CONVICTION_ORDER}    placeholder="All convictions" />
            <DcFilterSelect value={fRisk}   onChange={setFRisk}   options={DC_RISK_ORDER}          placeholder="All risk tiers" />
            <DcFilterSelect value={fPpr}    onChange={setFPpr}    options={DC_PPR_ORDER}           placeholder="Public / Private" labels={{ Pub: 'Public', Pvt: 'Private' }} />
            {(search || fBucket || fConv || fRisk || fPpr) && (
              <button
                onClick={() => { setSearch(''); setFBucket(''); setFConv(''); setFRisk(''); setFPpr(''); }}
                style={{
                  padding: '13px 16px', fontSize: 11, fontFamily: 'ui-monospace,monospace',
                  background: 'transparent', border: '1px solid #3f3f46',
                  color: '#a1a1aa', borderRadius: 6, cursor: 'pointer',
                }}>
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          <div style={{ maxHeight: 720, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: '#0a0a0a', position: 'sticky', top: 0, zIndex: 2 }}>
                  {[
                    { key: 'company',    label: 'Company',    align: 'left' },
                    { key: 'ticker',     label: 'Ticker',     align: 'left' },
                    { key: 'bucket',     label: 'Bucket',     align: 'left' },
                    { key: 'sector',     label: 'Sector',     align: 'left' },
                    { key: 'conviction', label: 'Conviction', align: 'left' },
                    { key: 'riskTier',   label: 'Risk',       align: 'left' },
                    { key: 'horizon',    label: 'Horizon',    align: 'left' },
                    { key: 'ppr',        label: 'P/Pr',       align: 'left' },
                    { key: 'geo',        label: 'Geo',        align: 'left' },
                  ].map((col, i) => (
                    <th key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        textAlign: col.align, padding: '14px 16px',
                        fontSize: 10, color: '#71717a', fontWeight: 700,
                        fontFamily: 'ui-monospace,monospace',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        borderBottom: '1px solid #27272a', userSelect: 'none', cursor: 'pointer',
                        paddingLeft: i === 0 ? 22 : 16,
                      }}>
                      {col.label}<SortArrow active={sortKey === col.key} dir={sortDir} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r, i) => {
                  const bucketDef = DC_BUCKETS[r.bucket];
                  const cs = DC_CONVICTION_STYLE[r.conviction] || DC_CONVICTION_STYLE.Medium;
                  const rs = DC_RISK_STYLE[r.riskTier] || { color: '#a1a1aa' };
                  return (
                    <tr key={r.company}
                      style={{
                        borderBottom: '1px solid #1f1f23',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        transition: 'background 120ms',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                    >
                      <td style={{ padding: '13px 16px 13px 22px', position: 'relative' }}>
                        <span style={{
                          position: 'absolute', left: 0, top: 6, bottom: 6, width: 4,
                          background: bucketDef?.color || '#52525b', borderRadius: '0 2px 2px 0',
                        }}></span>
                        <span style={{ color: '#fafafa', fontWeight: 500 }}>{r.company}</span>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#a1a1aa', fontFamily: 'ui-monospace,monospace', fontSize: 12 }}>
                        {r.ticker}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12.5 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          color: '#d4d4d8',
                        }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', background: bucketDef?.color || '#52525b' }}></span>
                          {r.bucket}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#a1a1aa' }}>{r.sector}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '4px 10px',
                          fontSize: 11, fontWeight: 700, fontFamily: 'ui-monospace,monospace',
                          color: cs.color, background: cs.bg, border: `1px solid ${cs.border}`,
                          borderRadius: 4,
                        }}>
                          {r.conviction}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', color: rs.color, fontWeight: 600, fontSize: 12, fontFamily: 'ui-monospace,monospace' }}>
                        {r.riskTier}
                      </td>
                      <td style={{ padding: '13px 16px', color: '#a1a1aa', fontSize: 12, fontFamily: 'ui-monospace,monospace' }}>
                        {r.horizon}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 11.5, fontFamily: 'ui-monospace,monospace' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 8px', borderRadius: 4,
                          color: r.ppr === 'Pub' ? '#10b981' : '#a78bfa',
                          background: r.ppr === 'Pub' ? 'rgba(16,185,129,0.10)' : 'rgba(167,139,250,0.10)',
                          border: `1px solid ${r.ppr === 'Pub' ? 'rgba(16,185,129,0.30)' : 'rgba(167,139,250,0.30)'}`,
                        }}>
                          {r.ppr === 'Pub' ? 'Public' : 'Private'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#a1a1aa', fontSize: 12, fontFamily: 'ui-monospace,monospace' }}>
                        {r.geo}
                      </td>
                    </tr>
                  );
                })}
                {visibleRows.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: '40px 20px', textAlign: 'center', color: '#71717a', fontSize: 12 }}>
                    No companies match the current filters.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* ══════════════ 04. Key Metrics ══════════════ */}
      <SectionHeader icon={Activity} num="4" title="Key Metrics — AI Data Center Infrastructure Cycle" sub="The numbers that anchor the thesis" accent="#10b981" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Big-4 hyperscaler capex 2026', value: '$725B', delta: '+77% YoY', sub: 'Alphabet 180–190 · Amazon 200 · Meta 125–145 · Microsoft ~190 · 2026 has doubled from a year-ago $365B consensus', color: '#22d3ee' },
          { label: 'Hitachi Energy backlog',       value: '$43B',  delta: '+207% in 3 years', sub: '$14B → $43B since 2022. Transformer lead times now 30–40 months. CEO calls it a "10–15 year good market."', color: '#10b981' },
          { label: 'PJM interconnection queue',    value: '8+ yrs', delta: '4× vs 2008', sub: 'Time to interconnect new generation grew from <2 years in 2008 to >8 years in 2025 (RMI). The reason hyperscalers are going behind-the-meter.', color: '#f59e0b' },
          { label: 'US data-center vacancy',       value: '~0%',   delta: 'preleased through 2027', sub: 'JLL: "virtually all absorption is the result of preleasing with delivery times extending beyond 12 months."', color: '#a78bfa' },
          { label: 'US power supply shortfall',    value: '11 GW → 40 GW', delta: 'today → 2028', sub: 'Goldman Sachs estimate. Insulates power-equipment names from a 30% hyperscaler capex cut.', color: '#ef4444' },
          { label: 'HBM hybrid-bonder market',     value: '~$2B',  delta: 'by 2028', sub: 'TrendForce. BESI orders +63.6% H2/H1 2025. Captures ~50% of HBM by HBM4E generation.', color: '#60a5fa' },
        ].map((m, i) => (
          <div key={i} style={{
            background: '#18181b', border: '1px solid #27272a',
            borderRadius: 10, padding: '18px 20px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: m.color, opacity: 0.55,
            }}></div>
            <div style={{ fontSize: 10, color: '#71717a', fontFamily: 'ui-monospace,monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {m.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#fafafa', fontFamily: 'ui-monospace,monospace', letterSpacing: '-0.02em' }}>
                {m.value}
              </span>
              <span style={{ fontSize: 10.5, color: m.color, fontFamily: 'ui-monospace,monospace', fontWeight: 700 }}>
                {m.delta}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#a1a1aa', lineHeight: 1.55 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ══════════════ 05. Key Risks ══════════════ */}
      <SectionHeader icon={AlertTriangle} num="5" title="Key Risks" sub="What would break the thesis or the named positions" accent="#ef4444" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[
          {
            tag: 'CAPEX',
            title: '30%+ cut to 2027 hyperscaler capex',
            text: 'The 2026 $725B base is largely committed. The risk is forward orders, not in-place backlog. Watch the July 2026 Q2 guides and any one of the four Big Tech players cutting their 2026 capex guide by >5% in print.',
          },
          {
            tag: 'SILICON',
            title: 'A second "Groq event"',
            text: 'Nvidia\'s Dec-2025 $20B Groq acquihire collapsed the merchant AI-accelerator multiple. A repeat (Cerebras or D-Matrix into AMD/Intel) compresses private AI-hardware NAVs by 20–40% and re-rates the entire neocloud chain down.',
          },
          {
            tag: 'SUPPLY',
            title: 'Power equipment supply catches up early',
            text: 'If Hitachi Energy, Siemens Energy and the Korean trio ramp 2027 capacity above plan, Wood Mac\'s "deficit closes by 2030" timeline accelerates to 2028. Transformer pricing power compresses, GEV/CLF/PWR multiples crack.',
          },
          {
            tag: 'GEO',
            title: 'Taiwan / China escalation',
            text: 'TSMC, ASMPT, Japanese chemicals stack, and EDA China revenue (Synopsys ~16% of FY25) all carry geopolitical tail. Under a Taiwan blockade scenario the chain re-rates 50%+ short-term before equilibrium repricing.',
          },
          {
            tag: 'DEMAND',
            title: 'OpenAI / Anthropic revenue ramp disappoints',
            text: 'Combined ~$54B ARR funds ~$1T+ in compute commitments. If OpenAI 2026 ARR prints <$28B vs $40B implied, the "circular financing" critique becomes consensus and the neocloud / merchant-silicon multiple compresses.',
          },
          {
            tag: 'CREDIT',
            title: 'Oracle / hyperscaler debt accident',
            text: 'Oracle 5-yr CDS has widened 3× since Sep 2025 (CreditSights). $1.5T+ of expected new tech-sector debt issuance over 3 years. A refi problem at any AI lab repricesalpha cost of capital for the entire chain.',
          },
        ].map((r, i) => (
          <div key={i} style={{
            background: '#18181b', border: '1px solid #27272a',
            borderLeft: '3px solid #ef4444',
            borderRadius: 8, padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{
                fontSize: 9, color: '#ef4444', fontFamily: 'ui-monospace,monospace',
                fontWeight: 700, letterSpacing: '0.14em',
                padding: '2px 6px', borderRadius: 3,
                background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)',
              }}>{r.tag}</span>
              <span style={{ fontSize: 12.5, color: '#fafafa', fontWeight: 600 }}>{r.title}</span>
            </div>
            <div style={{ fontSize: 11.5, color: '#a1a1aa', lineHeight: 1.6, marginTop: 6 }}>{r.text}</div>
          </div>
        ))}
      </div>

      {/* ══════════════ 06. Forward-Looking Scenarios ══════════════ */}
      <SectionHeader icon={TrendingUp} num="6" title="Forward-Looking Scenarios" sub="Three paths · probability-weighted" accent="#a78bfa" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          {
            label: 'Continued acceleration',
            prob: 20,
            color: '#10b981',
            triggers: ['Big-4 reaffirm or raise 2026 capex on Q2 prints', 'Alphabet/MSFT 2027 capex guide >$900B by Q3', 'OpenAI ARR >$35B by year-end 2026', 'No major Taiwan/China escalation'],
            outcome: 'Chain grinds higher into 2027. Multiples sustained. CLF, HD Hyundai, Hitachi re-rate further. SMR pipeline gets first NRC milestone.',
          },
          {
            label: 'Mid-cycle pause',
            prob: 55,
            color: '#f59e0b',
            triggers: ['One Big-4 holds or cuts 2026 capex guide on July prints', 'OpenAI ARR runs $28–32B vs $40B implied', 'A second Groq-style acquihire announced', 'Capex-elastic names sell off 15–25%'],
            outcome: 'Physical-bottleneck names hold; capex-elastic names (VRT, GEV, FIX, COHR) take a 15–25% drawdown. Best entry window of the cycle for stretched publics.',
          },
          {
            label: 'Sharp correction',
            prob: 25,
            color: '#ef4444',
            triggers: ['Two+ Big-4 cut 2026 capex on July prints', 'Taiwan/China incident', 'Oracle / AI-lab refi accident', 'OpenAI ARR <$28B by Q3', 'Multiple catalysts firing simultaneously'],
            outcome: 'Sector-wide 30–40% drawdown. Merchant silicon halved. Neoclouds at single-digit revenue multiples. Physical-bottleneck names down 20–25% but thesis intact.',
          },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#18181b', border: '1px solid #27272a',
            borderTop: `3px solid ${s.color}`,
            borderRadius: 10, padding: '20px 22px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: '#fafafa', fontWeight: 600 }}>{s.label}</span>
              <span style={{
                fontSize: 22, fontWeight: 700, color: s.color,
                fontFamily: 'ui-monospace,monospace', letterSpacing: '-0.02em',
              }}>{s.prob}%</span>
            </div>

            <div style={{ height: 4, background: '#27272a', borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ width: `${s.prob}%`, height: '100%', background: s.color, opacity: 0.85 }}></div>
            </div>

            <div style={{
              fontSize: 10, color: '#71717a', fontFamily: 'ui-monospace,monospace',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
            }}>Triggers</div>
            <div style={{ marginBottom: 16 }}>
              {s.triggers.map((t, j) => (
                <div key={j} style={{
                  fontSize: 11, color: '#d4d4d8', lineHeight: 1.55, paddingLeft: 12, position: 'relative',
                  marginBottom: 4,
                }}>
                  <span style={{ position: 'absolute', left: 0, color: s.color }}>›</span>{t}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #27272a' }}>
              <div style={{
                fontSize: 10, color: '#71717a', fontFamily: 'ui-monospace,monospace',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
              }}>Outcome</div>
              <div style={{ fontSize: 11.5, color: '#a1a1aa', lineHeight: 1.6 }}>{s.outcome}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════ 07. Executive Summary ══════════════ */}
      <SectionHeader icon={FileText} num="7" title="Executive Summary" sub="The whole report in 90 seconds" accent="#22D3EE" />

      <div style={{
        background: '#18181b', border: '1px solid #27272a',
        borderRadius: 10, padding: '24px 28px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: 'auto auto auto auto',
        columnGap: 28, rowGap: 0,
        alignItems: 'start',
      }}>
        <div style={{
          gridColumn: 1, gridRow: 1,
          fontSize: 10, color: '#22D3EE', fontFamily: 'ui-monospace,monospace',
          textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12,
        }}>The thesis</div>
        <div style={{
          gridColumn: 2, gridRow: 1,
          fontSize: 10, color: '#22D3EE', fontFamily: 'ui-monospace,monospace',
          textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12,
        }}>The posture</div>

        <div style={{ gridColumn: 1, gridRow: 2, fontSize: 13, color: '#e4e4e7', lineHeight: 1.7, paddingBottom: 22 }}>
          AI-capex alpha through 2030 lives in the physical-world chokepoints — transformers, electrical steel, hybrid bonding, on-site power, MEP labor, fiber — not at the model or hyperscaler layer. Supply curves are near-vertical for 24–48 months and pricing power is structural.
        </div>
        <div style={{ gridColumn: 2, gridRow: 2, fontSize: 12.5, color: '#d4d4d8', lineHeight: 1.7, paddingBottom: 22 }}>
          <strong style={{ color: '#10b981' }}>Overweight</strong> transformers, GOES steel, EDA, advanced packaging.<br />
          <strong style={{ color: '#f59e0b' }}>Barbell</strong> SMRs (BWXT defensive, Oklo aggressive).<br />
          <strong style={{ color: '#ef4444' }}>Underweight</strong> merchant AI silicon and frontier labs at current marks.
        </div>

        <div style={{
          gridColumn: 1, gridRow: 3,
          fontSize: 10, color: '#22D3EE', fontFamily: 'ui-monospace,monospace',
          textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12,
        }}>The numbers</div>
        <div style={{
          gridColumn: 2, gridRow: 3,
          fontSize: 10, color: '#22D3EE', fontFamily: 'ui-monospace,monospace',
          textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12,
        }}>The conclusion</div>

        <div style={{ gridColumn: 1, gridRow: 4, fontSize: 12.5, color: '#a1a1aa', lineHeight: 1.7 }}>
          $725B Big-4 hyperscaler capex in 2026 (+77% YoY). Hitachi Energy $43B backlog (vs $14B 3y ago). Transformer lead times 30–40 months. PJM queues now &gt;8 years. US data-center vacancy ~0%. BESI hybrid-bonding orders +63.6% H2/H1 2025.
        </div>
        <div style={{ gridColumn: 2, gridRow: 4, fontSize: 12.5, color: '#a1a1aa', lineHeight: 1.7 }}>
          <strong style={{ color: '#e4e4e7' }}>Base case (55%):</strong> mid-cycle pause with a 15–25% drawdown in capex-elastic names — the best entry window of the cycle. Use it to add to the physical-bottleneck core that the market will under-value for another 12–18 months.
        </div>
      </div>

      <div style={{
        marginTop: 18, padding: '12px 16px',
        background: '#0a0a0a', border: '1px solid #27272a', borderRadius: 6,
        fontSize: 10, color: '#52525b', fontFamily: 'ui-monospace,monospace', lineHeight: 1.6,
      }}>
        Personal research synthesis. Not investment advice. All views as of May 18, 2026 — subject to revision. Markets in AI-related sectors are at historically elevated multiples and vulnerable to compression.
      </div>
    </div>
  );
}
