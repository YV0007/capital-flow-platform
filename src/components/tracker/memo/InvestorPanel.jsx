import React from 'react';
import { Users } from 'lucide-react';
import Panel from '../shared/Panel.jsx';

// Classify which named investors are "tier 1" — widely known top-quartile firms.
// Used only for visual emphasis, not investment decisions.
const TIER1_VC_KEYWORDS = [
  'sequoia', 'a16z', 'andreessen', 'benchmark', 'accel', 'kleiner', 'greylock',
  'founders fund', 'thrive', 'tiger', 'coatue', 'lightspeed', 'index',
  'general catalyst', 'gv', 'google ventures', 'iconiq', 'altimeter', 'insight',
  'bessemer', 'matrix', 'redpoint', 'spark', 'usv', 'union square',
];
const STRATEGIC_KEYWORDS = ['nvidia', 'alphabet', 'google', 'microsoft', 'meta', 'amazon', 'salesforce', 'oracle'];

function classifyInvestor(name) {
  const lower = name.toLowerCase();
  if (STRATEGIC_KEYWORDS.some(k => lower.includes(k))) return 'strategic';
  if (TIER1_VC_KEYWORDS.some(k => lower.includes(k)))  return 'tier1';
  return 'other';
}

export default function InvestorPanel({ mb, company }) {
  if (!mb?.team) return null;
  const allVCs    = mb.team.investors || [];
  const allAngels = mb.team.angel_investors || [];
  if (allVCs.length === 0 && allAngels.length === 0) return null;

  const totalRaised = mb.growth?.total_raised_usd;
  const fmtRaised = (n) => {
    if (n == null) return null;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${n}`;
  };

  // Group VCs into tier1 / strategic / other
  const tier1     = allVCs.filter(n => classifyInvestor(n) === 'tier1');
  const strategic = allVCs.filter(n => classifyInvestor(n) === 'strategic');
  const otherVC   = allVCs.filter(n => classifyInvestor(n) === 'other');

  // When there's no tier-1 or strategic, "Other VCs" reads wrong — it's just THE VCs.
  // Detect this and adapt labels accordingly.
  const onlyOtherVCs = tier1.length === 0 && strategic.length === 0 && otherVC.length > 0;
  const otherVCLabel = onlyOtherVCs ? 'Investors' : 'Other VCs';

  // Compute mix bar — % of named investors by tier (purely visual breakdown)
  const totalCount = allVCs.length + allAngels.length;
  const pct = {
    tier1:     totalCount ? (tier1.length / totalCount) * 100     : 0,
    strategic: totalCount ? (strategic.length / totalCount) * 100 : 0,
    otherVC:   totalCount ? (otherVC.length / totalCount) * 100   : 0,
    angels:    totalCount ? (allAngels.length / totalCount) * 100 : 0,
  };

  const Pill = ({ children, tier, big }) => {
    const styles = {
      tier1:     'bg-emerald-950/40 border-emerald-800/60 text-emerald-200',
      strategic: 'bg-violet-950/40  border-violet-800/60  text-violet-200',
      otherVC:   'bg-sky-950/40     border-sky-800/60      text-sky-200',
      angel:     'bg-amber-950/30   border-amber-800/50   text-amber-200',
    }[tier] || 'bg-zinc-900 border-zinc-800 text-zinc-300';
    return (
      <span className={`inline-flex items-center gap-1 ${big ? 'px-3 py-1 text-[12px]' : 'px-2.5 py-1 text-[12px]'} border rounded ${styles} font-medium`}>
        {children}
      </span>
    );
  };

  // Tier legend dot
  const Dot = ({ tier, label, count }) => {
    const dotColor = { tier1: 'bg-emerald-400', strategic: 'bg-violet-400', otherVC: 'bg-sky-400', angel: 'bg-amber-400' }[tier];
    if (count === 0) return null;
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
        {label} <span className="text-zinc-500 font-mono">{count}</span>
      </span>
    );
  };

  // Per-investor segment colors for the single-tier case — sky-family shades
  // for VCs, amber-family for angels, so the bar reads as one cohesive group
  // with visible structure rather than a flat block.
  const SKY_SHADES   = ['bg-sky-400', 'bg-sky-500', 'bg-sky-600', 'bg-sky-700', 'bg-sky-800', 'bg-cyan-500', 'bg-cyan-600', 'bg-cyan-700'];
  const AMBER_SHADES = ['bg-amber-400', 'bg-amber-500', 'bg-amber-600', 'bg-amber-700'];

  // Render the composition bar. If only one tier of VCs (no tier-1 / strategic),
  // subdivide into one segment per investor so the bar shows structure.
  const renderBar = () => {
    if (totalCount === 0) return null;

    const barWrap = {
      height: 22,
      width: '100%',
      background: '#18181b',
      borderRadius: 9999,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'stretch',
      flexDirection: 'row',
    };

    const segLabel = {
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontFamily: 'ui-monospace,monospace', fontWeight: 600,
      color: 'rgba(255,255,255,0.92)', letterSpacing: '0.02em',
      overflow: 'hidden', whiteSpace: 'nowrap',
    };

    // Single-tier case: per-investor segments (sky/cyan shades)
    if (onlyOtherVCs && allAngels.length === 0) {
      const skyHex = {
        'bg-sky-400':  '#38bdf8',
        'bg-sky-500':  '#0ea5e9',
        'bg-sky-600':  '#0284c7',
        'bg-sky-700':  '#0369a1',
        'bg-sky-800':  '#075985',
        'bg-cyan-500': '#06b6d4',
        'bg-cyan-600': '#0891b2',
        'bg-cyan-700': '#0e7490',
      };
      const segPct = 100 / otherVC.length;
      const segments = otherVC.map((n, i) => {
        const cls = SKY_SHADES[i % SKY_SHADES.length];
        return { name: n, hex: skyHex[cls] || '#0ea5e9', pct: segPct };
      });
      return (
        <div style={barWrap}>
          {segments.map((s, i) => (
            <div
              key={i}
              style={{ display: 'block', height: '100%', width: `${s.pct}%`, background: s.hex, flex: `0 0 ${s.pct}%` }}
              title={`${s.name} — ${s.pct.toFixed(1)}% (equal weight; check sizes undisclosed)`}>
              <div style={segLabel}>{s.pct.toFixed(0)}%</div>
            </div>
          ))}
        </div>
      );
    }

    // Multi-tier case: stacked by tier — show tier % inside each segment
    return (
      <div style={barWrap}>
        {pct.tier1     > 0 && <div style={{ display: 'block', height: '100%', width: `${pct.tier1}%`,     background: '#10b981', flex: `0 0 ${pct.tier1}%` }}     title={`Tier-1 VCs: ${tier1.length} (${pct.tier1.toFixed(0)}%)`}><div style={segLabel}>{pct.tier1.toFixed(0)}%</div></div>}
        {pct.strategic > 0 && <div style={{ display: 'block', height: '100%', width: `${pct.strategic}%`, background: '#8b5cf6', flex: `0 0 ${pct.strategic}%` }} title={`Strategic: ${strategic.length} (${pct.strategic.toFixed(0)}%)`}><div style={segLabel}>{pct.strategic.toFixed(0)}%</div></div>}
        {pct.otherVC   > 0 && <div style={{ display: 'block', height: '100%', width: `${pct.otherVC}%`,   background: '#0ea5e9', flex: `0 0 ${pct.otherVC}%` }}   title={`Other VCs: ${otherVC.length} (${pct.otherVC.toFixed(0)}%)`}><div style={segLabel}>{pct.otherVC.toFixed(0)}%</div></div>}
        {pct.angels    > 0 && <div style={{ display: 'block', height: '100%', width: `${pct.angels}%`,    background: '#f59e0b', flex: `0 0 ${pct.angels}%` }}    title={`Angels: ${allAngels.length} (${pct.angels.toFixed(0)}%)`}><div style={segLabel}>{pct.angels.toFixed(0)}%</div></div>}
      </div>
    );
  };

  return (
    <Panel title="Investor Backing" icon={Users}
      subtitle={totalRaised ? `${fmtRaised(totalRaised)} raised across ${totalCount} disclosed investors` : `${totalCount} disclosed investors`}>

      {/* Mix bar — segmented per-investor or per-tier */}
      {totalCount > 0 && (
        <div className="mb-4">
          {renderBar()}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            <Dot tier="tier1"     label="Tier-1 VCs" count={tier1.length} />
            <Dot tier="strategic" label="Strategic"  count={strategic.length} />
            <Dot tier="otherVC"   label={otherVCLabel}  count={otherVC.length} />
            <Dot tier="angel"     label="Angels"     count={allAngels.length} />
          </div>
        </div>
      )}

      {/* Lead VCs — biggest pills */}
      {tier1.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1.5">Tier-1 Lead VCs</div>
          <div className="flex flex-wrap gap-1.5">
            {tier1.map(n => <Pill key={n} tier="tier1" big>{n}</Pill>)}
          </div>
        </div>
      )}

      {/* Strategic backers */}
      {strategic.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold mb-1.5">Strategic backers</div>
          <div className="flex flex-wrap gap-1.5">
            {strategic.map(n => <Pill key={n} tier="strategic" big>{n}</Pill>)}
          </div>
        </div>
      )}

      {/* Other VCs (or just "Investors" if no other tier exists) */}
      {otherVC.length > 0 && (
        <div className="mb-3">
          <div className={`text-[10px] uppercase tracking-wider font-semibold mb-1.5 ${onlyOtherVCs ? 'text-sky-400' : 'text-zinc-400'}`}>
            {otherVCLabel}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {otherVC.map(n => <Pill key={n} tier="otherVC" big={onlyOtherVCs}>{n}</Pill>)}
          </div>
        </div>
      )}

      {/* Notable angels */}
      {allAngels.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-1.5">Notable angels</div>
          <div className="flex flex-wrap gap-1.5">
            {allAngels.map(n => <Pill key={n} tier="angel">{n}</Pill>)}
          </div>
        </div>
      )}
    </Panel>
  );
}
