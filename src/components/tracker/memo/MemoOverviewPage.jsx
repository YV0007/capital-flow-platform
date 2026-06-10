import React, { useState, useMemo } from 'react';
import {
  TrendingUp, Activity, Target, Users, Globe, MessageSquare, DollarSign,
  AlertTriangle, Linkedin,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip as RTooltip,
} from 'recharts';
import {
  computeCarryWaterfall, daysBetween, todayISO,
} from '../../../lib/utils.js';
import Panel from '../shared/Panel.jsx';
import KPI from '../position/KPI.jsx';
import InvestorPanel from './InvestorPanel.jsx';

function fmtUSDshort(n) {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function MemoOverviewPage({ cfg, mb, capEvents, onJumpTo, company }) {
  const [dilutionFactor, setDilutionFactor] = useState(1.0);

  const isPosition = cfg.is_position !== false && cfg.gross_investment_usd > 0;

  // Anton's current position math (only meaningful when isPosition)
  const ownership = isPosition ? (cfg.gross_investment_usd / cfg.pre_money_valuation_usd) : 0;
  const points = isPosition ? [
    { date: cfg.entry_date, preMoney: cfg.pre_money_valuation_usd, label: 'Entry', source: 'Subscription form' },
    ...(Array.isArray(capEvents) ? capEvents : [])
      .filter(c => c.pre_money_usd && c.date)
      .map(c => ({ date: c.date, preMoney: parseFloat(c.pre_money_usd) || 0, label: c.round_type || 'Mark', source: c.lead || c.notes || 'Cap event' })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
  const latestMark = points[points.length - 1] || { preMoney: cfg.pre_money_valuation_usd || 0 };
  const currentImpliedValue = isPosition ? latestMark.preMoney * ownership : 0;
  const moic = isPosition ? currentImpliedValue / cfg.gross_investment_usd : 0;
  const deltaPct = isPosition ? ((currentImpliedValue - cfg.gross_investment_usd) / cfg.gross_investment_usd) * 100 : 0;
  const daysHeld = isPosition && cfg.entry_date ? daysBetween(cfg.entry_date, todayISO()) : 0;
  const yrs = daysHeld / 365.25;
  const cagr = isPosition && yrs >= 0.25 ? (Math.pow(currentImpliedValue / cfg.gross_investment_usd, 1 / yrs) - 1) * 100 : null;
  const gain = deltaPct >= 0;
  const gainColor = gain ? 'text-emerald-400' : 'text-rose-400';

  // Helper: pick the ARR projection field (memo schema varies by company —
  // Zeely uses arr_2027_usd, Cursor uses arr_2029_usd).
  const pickProjectedArr = (s) => s?.arr_2027_usd ?? s?.arr_2029_usd ?? null;
  const pickProjectionYear = (mb) => {
    const s = mb?.exit_scenarios?.[0];
    if (!s) return '2027';
    if (s.arr_2027_usd != null) return '2027';
    if (s.arr_2029_usd != null) return '2029';
    return '2027';
  };
  const projectionYear = pickProjectionYear(mb);

  // Helper: find scenarios by tier (fuzzy — Zeely uses 'Base', Cursor uses 'Base (Realistic)')
  const findScenario = (mb, key) => {
    if (!mb?.exit_scenarios) return null;
    const norm = (s) => (s.tier || '').toLowerCase();
    if (key === 'conservative') return mb.exit_scenarios.find(s => norm(s).includes('conservative'));
    if (key === 'base')         return mb.exit_scenarios.find(s => norm(s).startsWith('base'));
    if (key === 'optimistic')   return mb.exit_scenarios.find(s => norm(s).includes('optimistic'));
    return null;
  };

  // === Chart data ===
  // ARR trajectory: actuals + 3 scenarios charted as separate series.
  const arrChartData = useMemo(() => {
    if (!mb) return [];
    const actualsRaw = (mb.growth.arr_trajectory || []);
    const actuals = actualsRaw.map(d => ({
      period: d.period,
      actual: d.arr / 1e6,
    }));
    const lastActual = actualsRaw[actualsRaw.length - 1];
    const lastActualVal = lastActual ? lastActual.arr / 1e6 : null;
    const conservative = findScenario(mb, 'conservative');
    const base         = findScenario(mb, 'base');
    const optimistic   = findScenario(mb, 'optimistic');
    // Seed the projection row with the last actual on every scenario series so
    // each dashed line draws from the most recent actual to its target, not
    // floating in space.
    return [
      ...actuals,
      {
        period: projectionYear,
        conservative: pickProjectedArr(conservative) ? pickProjectedArr(conservative) / 1e6 : null,
        base:         pickProjectedArr(base)         ? pickProjectedArr(base)         / 1e6 : null,
        optimistic:   pickProjectedArr(optimistic)   ? pickProjectedArr(optimistic)   / 1e6 : null,
      },
    ].map((point, idx, arr) => {
      // Seed scenario series at the last actual point so the dashed lines start there
      if (point.actual != null && idx === actuals.length - 1 && lastActualVal != null) {
        return {
          ...point,
          conservative_anchor: lastActualVal,
          base_anchor: lastActualVal,
          optimistic_anchor: lastActualVal,
        };
      }
      // Forward-fill anchor on the projection row so each anchor line reaches its scenario value
      if (idx === arr.length - 1) {
        return {
          ...point,
          conservative_anchor: point.conservative,
          base_anchor: point.base,
          optimistic_anchor: point.optimistic,
        };
      }
      return point;
    });
  }, [mb, projectionYear]);

  // MRR sparkline — empty for companies that don't disclose at MRR resolution
  const mrrChartData = useMemo(() => {
    if (!mb?.growth?.mrr_trajectory) return [];
    return mb.growth.mrr_trajectory.map(d => ({ period: d.period, mrr: d.mrr / 1e6 }));
  }, [mb]);
  const hasMrr = mrrChartData.length > 0;

  // Retention chart — empty for companies that don't disclose cohort data
  const retentionChartData = useMemo(() => {
    if (!mb?.users?.cohorts_all_paid?.length) return [];
    // For each month index, compute both:
    //  - simple-average retention % (preserves existing chart visuals)
    //  - sum of original cohort users (n) across cohorts reporting that month
    //  - sum of retained users (n × m/100) across the same cohorts
    // The summed counts let the tooltip show "X of Y users retained".
    const aggregate = (cohorts) => {
      if (!cohorts || !cohorts.length) return [];
      const months = Math.max(...cohorts.map(c => c.m.length));
      const out = [];
      for (let i = 0; i < months; i++) {
        let pctSum = 0, pctCount = 0;
        let nSum = 0, retainedSum = 0;
        cohorts.forEach(c => {
          if (i < c.m.length) {
            pctSum += c.m[i];
            pctCount += 1;
            nSum += c.n;
            retainedSum += c.n * c.m[i] / 100;
          }
        });
        out.push({
          pct: pctCount > 0 ? pctSum / pctCount : null,
          n: nSum,
          retained: Math.round(retainedSum),
        });
      }
      return out;
    };
    const allPaid = aggregate(mb.users.cohorts_all_paid);
    const power   = aggregate(mb.users.cohorts_power);
    return allPaid.map((d, i) => ({
      month: `M${i + 1}`,
      'All paid':    d.pct != null ? Number(d.pct.toFixed(1)) : null,
      'Power users': power[i]?.pct != null ? Number(power[i].pct.toFixed(1)) : null,
      _allPaidN:        d.n,
      _allPaidRetained: d.retained,
      _powerN:          power[i]?.n || 0,
      _powerRetained:   power[i]?.retained || 0,
    }));
  }, [mb]);
  const hasRetention = retentionChartData.length > 0;

  // Net return scenarios (carry waterfall) — only meaningful when isPosition
  const scenarios = useMemo(() => {
    if (!mb || !isPosition) return [];
    return [1, 2, 3, 5, 10].map(m => ({
      multiple: m,
      ...computeCarryWaterfall(cfg.pre_money_valuation_usd * m, cfg, dilutionFactor),
    }));
  }, [cfg, mb, dilutionFactor, isPosition]);

  // ───── KPI tiles — data-driven so each company shows its own most-relevant 5 ─────
  const kpiTiles = useMemo(() => {
    if (!mb) return [];
    const fmtMoney = (n) => {
      if (n == null) return null;
      if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(n >= 1e10 ? 0 : 2)}B`;
      if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(n >= 1e8 ? 0 : 1)}M`;
      if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
      return `$${n.toLocaleString()}`;
    };
    const fmtN = (n) => {
      if (n == null) return null;
      if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
      if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
      if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
      return n.toLocaleString();
    };
    const arrSeries = mb.growth?.arr_trajectory || [];
    const latestArr = arrSeries[arrSeries.length - 1];
    const firstArr  = arrSeries[0];
    const tiles = [];

    if (latestArr) {
      // Compute year span from first→last period dates, not from data-point count
      const parseYear = (p) => {
        const m = String(p).match(/(\d{4})/);
        return m ? parseInt(m[1], 10) : null;
      };
      const yFirst = firstArr ? parseYear(firstArr.period) : null;
      const yLast  = parseYear(latestArr.period);
      const yrs    = (yFirst && yLast && yLast > yFirst) ? (yLast - yFirst) : null;
      const sub = firstArr && latestArr !== firstArr
        ? `${fmtMoney(firstArr.arr)} → ${fmtMoney(latestArr.arr)}${yrs ? ` over ${yrs} years` : ''}`
        : 'current';
      tiles.push({ label: `ARR · ${latestArr.period}`, labelHint: 'Annual Recurring Revenue', value: fmtMoney(latestArr.arr), sub, accent: 'emerald' });
    }

    if (mb.users?.paying != null) {
      let sub = '';
      if (mb.users.all_paid_m6_retention_pct != null) sub = `${mb.users.all_paid_m6_retention_pct}%+ retained at 6 months`;
      else if (mb.users.monthly_active != null) sub = `${fmtN(mb.users.monthly_active)} monthly active`;
      else if (mb.users.enterprise_customers != null) sub = `${fmtN(mb.users.enterprise_customers)} enterprise customers`;
      tiles.push({ label: 'Paying users', value: `${fmtN(mb.users.paying)} users`, sub });
    }

    if (mb.growth?.gross_margin_pct != null) {
      tiles.push({ label: 'Gross margin', value: `${mb.growth.gross_margin_pct}%`, sub: 'healthy margin' });
    } else if (mb.users?.fortune500_pct != null) {
      tiles.push({
        label: 'Enterprise penetration',
        value: `${mb.users.fortune500_pct}% of F500`,
        sub: mb.users.fortune1000_pct ? `${mb.users.fortune1000_pct}% of Fortune 1000` : 'of Fortune 500 customers'
      });
    }

    if (mb.unit_econ?.ltv_cac != null) {
      tiles.push({ label: 'CAC : LTV', value: `${mb.unit_econ.ltv_cac}×`, sub: `${fmtMoney(mb.unit_econ.cac_usd)} → ${fmtMoney(mb.unit_econ.ltv_usd)}${mb.unit_econ.ltv_cac_target_2026 ? ` · target ${mb.unit_econ.ltv_cac_target_2026}×` : ''}` });
    } else if (mb.unit_econ?.free_to_paid_conversion_pct != null) {
      tiles.push({
        label: 'Free → Paid conversion',
        value: `${mb.unit_econ.free_to_paid_conversion_pct}%`,
        sub: 'vs 2-5% typical SaaS'
      });
    }

    // Customer Sentiment — accent by severity (rose <3.5, amber 3.5-3.9, emerald ≥4)
    if (mb.users?.trustpilot_rating != null) {
      const r = mb.users.trustpilot_rating;
      const sentAccent = r < 3 ? 'rose' : r < 4 ? 'amber' : 'emerald';
      const ratingDesc = r < 3 ? 'churn risk' : r < 4 ? 'mixed' : 'healthy';
      tiles.push({
        label: 'Customer sentiment',
        value: `${r.toFixed(1)}/5`,
        sub: `${mb.users.trustpilot_review_count?.toLocaleString() || '?'} Trustpilot · ${ratingDesc}`,
        accent: sentAccent,
      });
    } else if (mb.growth?.cash_usd != null) {
      const totalRaised = mb.growth.total_raised_usd;
      tiles.push({ label: 'Cash on hand', value: fmtMoney(mb.growth.cash_usd), sub: totalRaised ? `${fmtMoney(totalRaised)} raised total` : '' });
    }
    return tiles;
  }, [mb]);

  // ARR chart legend — derive scenario values from mb
  const arrLegend = useMemo(() => {
    if (!mb) return [];
    const fmtMoney = (n) => {
      if (n == null) return '—';
      if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(0)}B`;
      if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
      return `$${n}`;
    };
    return [
      { label: 'Actual', color: 'bg-emerald-400' },
      { label: `Conservative · ${fmtMoney(pickProjectedArr(findScenario(mb, 'conservative')))}`, color: 'bg-sky-300' },
      { label: `Base · ${fmtMoney(pickProjectedArr(findScenario(mb, 'base')))}`, color: 'bg-sky-500' },
      { label: `Target · ${fmtMoney(pickProjectedArr(findScenario(mb, 'optimistic')))}`, color: 'bg-cyan-400' },
    ];
  }, [mb]);

  const mrrSubtitle = mb?.growth?.mom_q4_2025_pct ? `+${mb.growth.mom_q4_2025_pct}% MoM in Q4 '25` : 'monthly recurring revenue';

  // Exit-table column auto-detect (Zeely uses 5x/6x/7x; Cursor uses 8x/12x/15x)
  const exitCols = useMemo(() => {
    if (!mb?.exit_scenarios?.length) return [];
    const sample = mb.exit_scenarios[0] || {};
    const cols = [];
    Object.keys(sample).forEach(key => {
      const m = key.match(/^exit_(\d+)x_usd$/);
      if (m) cols.push({ key, mult: parseInt(m[1], 10) });
    });
    cols.sort((a, b) => a.mult - b.mult);
    return cols;
  }, [mb]);
  const exitBaseTier = mb?.exit_scenarios?.find(s => (s.tier || '').toLowerCase().startsWith('base')) || null;
  const exitBaseProjected = exitBaseTier ? pickProjectedArr(exitBaseTier) : null;

  if (!mb) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded p-6 text-center text-zinc-500 text-sm">
        Memo data not yet ingested. Check Settings → Memo Baseline.
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* ───── 1. KPI strip — data-driven ───── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpiTiles.map((t, i) => <KPI key={i} label={t.label} value={t.value} sub={t.sub} accent={t.accent} labelHint={t.labelHint} />)}
      </div>

      {/* ───── 2. ARR trajectory ───── */}
      <Panel title="ARR Trajectory" icon={TrendingUp}
        subtitle={`Actuals vs. ${projectionYear} scenarios`}>
        <div className="flex flex-wrap gap-3 text-[10px] mb-2 font-mono">
          {arrLegend.map((l, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${l.color}`} />{l.label}
            </span>
          ))}
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={arrChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#27272a" strokeDasharray="2 2" />
              <XAxis dataKey="period" tick={{ fill: '#71717a', fontSize: 10 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} unit="M" scale="log" domain={[1, 'auto']} allowDataOverflow={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}B` : `${v}`} />
              <RTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  // Filter out anchor series + null values
                  const SERIES_LABELS = { actual: 'Actual', conservative: 'Conservative', base: 'Base', optimistic: 'Target' };
                  const visible = payload.filter(p => p && p.value != null && !String(p.dataKey).endsWith('_anchor'));
                  if (visible.length === 0) return null;
                  return (
                    <div style={{ background: '#09090b', border: '1px solid #3f3f46', fontSize: 11, padding: '6px 10px', borderRadius: 4, color: '#e4e4e7' }}>
                      <div style={{ color: '#a1a1aa', fontSize: 10, marginBottom: 4 }}>{label}</div>
                      {visible.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: p.color }}>
                          <span>{SERIES_LABELS[p.dataKey] || p.dataKey}</span>
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>${p.value.toLocaleString()}M</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              {/* Anchor series: dashed lines from last actual to each scenario point. Drawn first so they sit under the labeled lines. */}
              <Line type="linear" dataKey="conservative_anchor" stroke="#7dd3fc" strokeWidth={1} strokeDasharray="2 4" dot={false} connectNulls legendType="none" />
              <Line type="linear" dataKey="base_anchor"         stroke="#0ea5e9" strokeWidth={1} strokeDasharray="2 4" dot={false} connectNulls legendType="none" />
              <Line type="linear" dataKey="optimistic_anchor"   stroke="#22d3ee" strokeWidth={1} strokeDasharray="2 4" dot={false} connectNulls legendType="none" />
              <Line type="monotone" dataKey="actual"       stroke="#34d399" strokeWidth={2.5} dot={{ r: 4, fill: '#34d399', stroke: '#09090b', strokeWidth: 2 }} connectNulls={false} />
              <Line type="monotone" dataKey="conservative" stroke="#7dd3fc" strokeWidth={2} dot={{ r: 5, fill: '#7dd3fc', stroke: '#09090b', strokeWidth: 2 }} connectNulls={false} />
              <Line type="monotone" dataKey="base"         stroke="#0ea5e9" strokeWidth={2} dot={{ r: 5, fill: '#0ea5e9', stroke: '#09090b', strokeWidth: 2 }} connectNulls={false} />
              <Line type="monotone" dataKey="optimistic"   stroke="#22d3ee" strokeWidth={2} dot={{ r: 5, fill: '#22d3ee', stroke: '#09090b', strokeWidth: 2 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* ───── 3. MRR + Exit potential ───── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {hasMrr ? (
          <Panel title="Recent MRR" icon={Activity} subtitle={mrrSubtitle}>
            <div style={{ height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mrrChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#27272a" strokeDasharray="2 2" />
                  <XAxis dataKey="period" tick={{ fill: '#71717a', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} unit="M" />
                  <RTooltip contentStyle={{ background: '#09090b', border: '1px solid #3f3f46', fontSize: 11 }} formatter={(v) => `$${v.toFixed(1)}M`} />
                  <Area type="monotone" dataKey="mrr" stroke="#34d399" fill="url(#mrrGrad)" strokeWidth={2} dot={{ r: 3, fill: '#34d399', stroke: '#09090b', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        ) : (
          <Panel title="Growth Highlights" icon={Activity}>
            {(() => {
              // Real ARR trajectory drives all the visual trend indicators —
              // it's the growth story behind every headline metric on this card.
              const traj = mb.growth?.arr_trajectory || [];
              const hasTraj = traj.length >= 2;

              // Mini-sparkline (SVG path) generator. Smooth Catmull-Rom curve
              // converted to cubic Bezier so the line reads as a clean swoop
              // instead of the stepped Q/T path the previous version drew.
              const buildSpark = (width, height) => {
                if (!hasTraj) return { line: '', area: '' };
                const vs = traj.map(d => Math.log10(Math.max(d.arr, 1)));
                const min = Math.min(...vs);
                const max = Math.max(...vs);
                const range = max - min || 1;
                const stepX = width / (vs.length - 1);
                const padTop = 3, padBot = 2;
                const pts = vs.map((v, i) => ({
                  x: i * stepX,
                  y: height - padBot - ((v - min) / range) * (height - padTop - padBot),
                }));

                let line = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
                for (let i = 0; i < pts.length - 1; i++) {
                  const p0 = pts[i - 1] || pts[i];
                  const p1 = pts[i];
                  const p2 = pts[i + 1];
                  const p3 = pts[i + 2] || pts[i + 1];
                  // Catmull-Rom → cubic Bezier (tension = 0.5, i.e. /6 form)
                  const cp1x = p1.x + (p2.x - p0.x) / 6;
                  const cp1y = p1.y + (p2.y - p0.y) / 6;
                  const cp2x = p2.x - (p3.x - p1.x) / 6;
                  const cp2y = p2.y - (p3.y - p1.y) / 6;
                  line += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
                }
                const area = line + ` L ${pts[pts.length - 1].x.toFixed(2)} ${height} L 0 ${height} Z`;
                return { line, area };
              };

              const Sparkline = ({ color, height = 64, gradId }) => {
                const width = 240;
                const { line, area } = buildSpark(width, height);
                return (
                  <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.30" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={area} fill={`url(#${gradId})`} />
                    <path d={line} stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                );
              };

              // Stat tile that stretches to fill its grid cell. Sparkline pinned
              // to the bottom so the row of curves aligns visually across tiles.
              const StatTile = ({ label, value, color = '#a1a1aa', accentBg = 'bg-white/[0.02]', accentBorder = 'border-white/[0.06]', valueColor = 'text-zinc-100', labelColor = 'text-zinc-500', big = false, gradId }) => (
                <div className={`relative h-full min-h-[120px] ${accentBg} border ${accentBorder} rounded-lg ${big ? 'p-5' : 'p-4'} overflow-hidden flex flex-col`}>
                  <div className={`text-[${big ? 11 : 10}px] uppercase tracking-wider ${labelColor} font-mono mb-2 leading-tight relative z-10`}>{label}</div>
                  <div className={`text-[${big ? 32 : 22}px] font-semibold ${valueColor} tracking-tight leading-none relative z-10`} style={{ fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter', system-ui, sans-serif" }}>{value}</div>
                  {hasTraj && (
                    <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: '55%', minHeight: big ? 70 : 56 }}>
                      <Sparkline color={color} gradId={gradId} />
                    </div>
                  )}
                </div>
              );

              return (
                <div className="h-full flex flex-col gap-3" style={{ minHeight: 380 }}>
                  {/* Headline tiles — two big ones side by side */}
                  <div className="gap-3 flex-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                    {mb.growth?.rev_growth_yoy_pct != null && (
                      <StatTile
                        big
                        gradId="ghSparkA"
                        label="YoY revenue growth"
                        value={`+${mb.growth.rev_growth_yoy_pct.toLocaleString()}%`}
                        color="#34d399"
                        accentBg="bg-emerald-500/[0.06]"
                        accentBorder="border-emerald-500/15"
                        valueColor="text-emerald-300"
                        labelColor="text-emerald-400/70"
                      />
                    )}
                    {mb.growth?.arr_per_employee_usd != null && (
                      <StatTile
                        big
                        gradId="ghSparkB"
                        label="ARR per employee"
                        value={`$${(mb.growth.arr_per_employee_usd / 1e6).toFixed(1)}M`}
                        color="#a78bfa"
                      />
                    )}
                  </div>

                  {/* Secondary 3-tile grid */}
                  {(mb.users?.monthly_active != null || mb.users?.enterprise_revenue_share_pct != null || mb.users?.enterprise_code_lines_per_day != null) && (
                    <div className="gap-2 flex-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                      {mb.users?.monthly_active != null && (
                        <StatTile
                          gradId="ghSparkC"
                          label="Monthly active"
                          value={`${(mb.users.monthly_active / 1e6).toFixed(0)}M`}
                          color="#22d3ee"
                        />
                      )}
                      {mb.users?.enterprise_revenue_share_pct != null && (
                        <StatTile
                          gradId="ghSparkD"
                          label="Enterprise %"
                          value={`${mb.users.enterprise_revenue_share_pct}%`}
                          color="#fbbf24"
                        />
                      )}
                      {mb.users?.enterprise_code_lines_per_day != null && (
                        <StatTile
                          gradId="ghSparkE"
                          label="Code / day"
                          value={`${(mb.users.enterprise_code_lines_per_day / 1e6).toFixed(0)}M+`}
                          color="#f472b6"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </Panel>
        )}

        <Panel title={`Exit Potential by ${projectionYear}`} icon={Target} subtitle="Exit value by scenario, with implied return">
          {(!mb.exit_scenarios || mb.exit_scenarios.length === 0) ? (
            <div className="text-xs text-zinc-500 italic py-4">Exit scenarios not specified.</div>
          ) : (() => {
            // ── Generic extraction ─────────────────────────────────────────
            // Works for both shapes used in this codebase:
            //  • Cursor: ONE exit_Nx_usd populated per scenario (8x / 12x / 15x),
            //    with explicit `roi` and `irr_pct` in the memo data.
            //  • Zeely: MULTIPLE exit_Nx_usd populated per scenario (5x / 6x / 7x),
            //    no precomputed roi/irr — derive from position config.
            // Year field is also detected dynamically (arr_2027_usd, arr_2029_usd, …).
            // ───────────────────────────────────────────────────────────────
            const projYearNum = parseInt(String(projectionYear).match(/\d{4}/)?.[0] || '0', 10);
            const yearsToExit = projYearNum > 0 ? Math.max(0.5, projYearNum - new Date().getFullYear()) : null;
            const hasPosition = cfg && cfg.gross_investment_usd > 0 && cfg.implied_economic_interest_pct > 0;

            const enriched = mb.exit_scenarios.map(s => {
              const tierLower = (s.tier || '').toLowerCase();
              const isBase = tierLower.includes('base');
              const isOpt  = tierLower.includes('optimistic');
              const isCons = tierLower.includes('conservative');

              // Detect all exit_Nx_usd fields with non-null values, sorted ascending by multiple
              const populated = Object.entries(s)
                .map(([k, v]) => {
                  const m = k.match(/^exit_(\d+)x_usd$/);
                  return m && v != null ? { mult: parseInt(m[1], 10), val: v } : null;
                })
                .filter(Boolean)
                .sort((a, b) => a.mult - b.mult);

              // When several multiples are populated per scenario (Zeely),
              // pick by tier: Conservative→lowest, Optimistic→highest, Base→middle.
              let chosen = null;
              if (populated.length === 1) {
                chosen = populated[0];
              } else if (populated.length > 1) {
                if (isCons) chosen = populated[0];
                else if (isOpt) chosen = populated[populated.length - 1];
                else chosen = populated[Math.floor(populated.length / 2)];
              }

              // Detect ARR-at-exit field (arr_YYYY_usd)
              const arrEntry = Object.entries(s).find(([k]) => /^arr_\d{4}_usd$/.test(k));
              const arr = arrEntry ? arrEntry[1] : null;

              // ROI / IRR: prefer memo-provided values; otherwise derive from position.
              let roi = s.roi;
              let irr = s.irr_pct;
              if ((roi == null || irr == null) && chosen?.val != null && hasPosition) {
                const wf = computeCarryWaterfall(chosen.val, cfg, 1.0);
                if (roi == null) roi = wf.netMultiple;
                if (irr == null && yearsToExit && wf.netMultiple > 0) {
                  irr = (Math.pow(wf.netMultiple, 1 / yearsToExit) - 1) * 100;
                }
              }

              return {
                tier: (s.tier || '').replace(' (Realistic)', '').replace(' (target)', ''),
                fullTier: s.tier,
                arr,
                exit: chosen?.val ?? null,
                multiple: chosen?.mult ?? null,
                roi,
                irr,
                isBase, isOpt, isCons,
              };
            }).filter(e => e.exit != null);

            if (enriched.length === 0) {
              return <div className="text-xs text-zinc-500 italic py-4">Exit values not populated.</div>;
            }

            const maxExit = Math.max(...enriched.map(e => e.exit));

            const scenarioColor = (e) => {
              if (e.isBase) return { bar: 'bg-emerald-500',  text: 'text-emerald-300', label: 'text-emerald-300', tintBg: 'bg-emerald-500/10', tintBorder: 'border-emerald-500/30' };
              if (e.isOpt)  return { bar: 'bg-cyan-500',     text: 'text-cyan-300',    label: 'text-cyan-300',    tintBg: 'bg-cyan-500/8',     tintBorder: 'border-cyan-500/20' };
              return            { bar: 'bg-zinc-500',     text: 'text-zinc-300',    label: 'text-zinc-300',    tintBg: 'bg-zinc-800/40',    tintBorder: 'border-zinc-700/40' };
            };

            return (
              <div className="space-y-4">
                {/* Headline: exit value range */}
                <div className="flex items-baseline justify-between pb-3 border-b border-zinc-800">
                  <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-mono">Exit range</div>
                  <div className="text-[13px] text-zinc-300" style={{ fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter', system-ui, sans-serif" }}>
                    <span className="text-zinc-500">{fmtUSDshort(Math.min(...enriched.map(e => e.exit)))}</span>
                    <span className="text-zinc-700 mx-1.5">—</span>
                    <span className="text-zinc-200 font-semibold">{fmtUSDshort(maxExit)}</span>
                  </div>
                </div>

                {/* Scenario bars */}
                <div className="space-y-3">
                  {enriched.map((e, i) => {
                    const c = scenarioColor(e);
                    const widthPct = (e.exit / maxExit) * 100;
                    return (
                      <div key={i} className={`p-3 rounded-lg border ${c.tintBorder} ${c.tintBg}`}>
                        {/* Row 1: scenario name + exit value */}
                        <div className="flex items-baseline justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[13px] font-semibold ${c.label}`}>{e.tier}</span>
                            {e.isBase && <span className="text-[9px] uppercase tracking-wider text-emerald-400/80 font-mono">Base case</span>}
                          </div>
                          <span className={`text-[18px] font-semibold ${c.text}`} style={{ fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter', system-ui, sans-serif" }}>{fmtUSDshort(e.exit)}</span>
                        </div>

                        {/* Bar */}
                        <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-2">
                          <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${widthPct}%` }}></div>
                        </div>

                        {/* Row 2: ARR + multiple + IRR + return */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                          {e.arr != null && (
                            <span><span className="text-zinc-600">ARR {projectionYear}</span> <span className="text-zinc-300 font-mono ml-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtUSDshort(e.arr)}</span></span>
                          )}
                          {e.multiple != null && (
                            <span><span className="text-zinc-600">Multiple</span> <span className="text-zinc-300 font-mono ml-0.5">{e.multiple}×</span></span>
                          )}
                          {e.roi != null && (
                            <span><span className="text-zinc-600">Return</span> <span className={`font-mono font-semibold ml-0.5 ${e.roi >= 2 ? 'text-emerald-300' : e.roi >= 1.2 ? 'text-amber-300' : 'text-rose-300'}`}>{e.roi.toFixed(1)}×</span></span>
                          )}
                          {e.irr != null && (
                            <span><span className="text-zinc-600">IRR</span> <span className={`font-mono font-semibold ml-0.5 ${e.irr >= 25 ? 'text-emerald-300' : e.irr >= 0 ? 'text-amber-300' : 'text-rose-300'}`}>{e.irr > 0 ? '+' : ''}{Math.round(e.irr)}%</span></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </Panel>
      </div>

      {/* ───── 4. Retention + US share or alternative ───── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {hasRetention ? (
          <Panel title="6-Month Retention" icon={Users} subtitle="Subscription renewal — average across 2025 cohorts">
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retentionChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#27272a" strokeDasharray="2 2" />
                  <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <RTooltip
                    cursor={{ stroke: '#3f3f46', strokeDasharray: '2 2' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0]?.payload || {};
                      const rowFor = (key) => {
                        const series = payload.find(p => p.dataKey === key);
                        if (!series || series.value == null) return null;
                        const n        = key === 'All paid' ? data._allPaidN        : data._powerN;
                        const retained = key === 'All paid' ? data._allPaidRetained : data._powerRetained;
                        const color    = series.color || (key === 'All paid' ? '#f87171' : '#34d399');
                        return (
                          <div key={key} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 10, alignItems: 'baseline', marginTop: 4 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#d4d4d8' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }}></span>
                              {key}
                            </span>
                            <span style={{ fontFamily: 'ui-monospace,monospace', color: '#fafafa', textAlign: 'right' }}>
                              <strong>{series.value.toFixed(1)}%</strong>
                              {n > 0 && (
                                <span style={{ color: '#71717a', fontWeight: 400, marginLeft: 6 }}>
                                  {retained.toLocaleString()} of {n.toLocaleString()} users
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      };
                      return (
                        <div style={{ background: '#09090b', border: '1px solid #3f3f46', borderRadius: 6, padding: '10px 12px', fontSize: 11, minWidth: 220 }}>
                          <div style={{ color: '#a1a1aa', fontFamily: 'ui-monospace,monospace', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10, paddingBottom: 6, borderBottom: '1px solid #27272a' }}>
                            Month {label?.replace('M', '')} after subscription
                          </div>
                          {rowFor('All paid')}
                          {rowFor('Power users')}
                          <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #27272a', fontSize: 10, color: '#52525b', fontStyle: 'italic' }}>
                            Summed across cohorts reporting this month
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line type="monotone" dataKey="All paid"    stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Power users" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3 text-[10px] mt-2 font-mono">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" />All paid</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />Power users</span>
            </div>
          </Panel>
        ) : mb.enterprise_signals?.fortune500_logos?.length ? (
          <Panel title="Enterprise Customers" icon={Users} subtitle={`${mb.users?.fortune500_pct || 0}% of Fortune 500 · ${(mb.users?.enterprise_customers || 0).toLocaleString()} enterprise customers`}>
            <div className="flex flex-wrap gap-2">
              {mb.enterprise_signals.fortune500_logos.map(logo => (
                <span key={logo} className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 font-mono">{logo}</span>
              ))}
            </div>
            <div className="text-[10px] text-zinc-500 mt-3 italic">Representative customers. Full customer base is larger.</div>
          </Panel>
        ) : (
          <Panel title="User Base" icon={Users}>
            <div className="text-xs text-zinc-500 italic">Cohort retention data not yet disclosed.</div>
          </Panel>
        )}

        {(() => {
          const usPct = mb.market?.us_share_pct;
          const competitors = mb.market?.competitor_us_share || {};
          const hasUsShare = usPct != null && Object.keys(competitors).length > 0;
          if (hasUsShare) {
            const namedShare = usPct + Object.values(competitors).reduce((a, b) => a + b, 0);
            // Bars: own first, then competitors descending by pct, then long-tail filler
            const bars = [
              { name: company.name, pct: usPct, color: 'bg-emerald-500', isOwn: true },
              ...Object.entries(competitors)
                .sort((a, b) => b[1] - a[1])
                .map(([name, pct]) => ({
                  name: name.charAt(0).toUpperCase() + name.slice(1),
                  pct,
                  color: 'bg-zinc-500',
                })),
            ];
            // Honest "long tail" row representing share not held by named players
            // (won't always be meaningful — only show if there's leftover ≥1%)
            const longTail = Math.max(0, 100 - namedShare);
            if (longTail >= 1) {
              bars.push({ name: 'Long tail', pct: longTail, color: 'bg-zinc-700', isLongTail: true });
            }
            const maxPct = Math.max(...bars.map(b => b.pct));
            return (
              <Panel title="US Traffic Share" icon={Globe} subtitle="Among direct competitors">
                <div className="space-y-2.5">
                  {bars.map(b => {
                    // bar width scales to the leader so the comparison reads strongly
                    const widthPct = (b.pct / maxPct) * 100;
                    return (
                      <div key={b.name}>
                        <div className="flex justify-between items-baseline text-[12px] mb-1">
                          <span className={`font-mono ${b.isOwn ? 'text-emerald-300 font-semibold' : b.isLongTail ? 'text-zinc-500 italic' : 'text-zinc-300'}`}>{b.name}</span>
                          <span className={`font-mono font-semibold ${b.isOwn ? 'text-emerald-300' : 'text-zinc-200'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{b.pct}%</span>
                        </div>
                        <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden">
                          <div className={`h-full ${b.color} ${b.isLongTail ? 'opacity-50' : ''} rounded-full`} style={{ width: `${widthPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 leading-relaxed">
                  {company.name} holds the highest US share among named competitors{longTail >= 1 ? `, with ${longTail}% spread across smaller players.` : '.'}
                </div>
              </Panel>
            );
          }
          // Fall back to top quoted clients (Cursor)
          const quotes = mb.enterprise_signals?.quoted_clients || [];
          if (quotes.length > 0) {
            return (
              <Panel title="Customer Voice" icon={MessageSquare}>
                <div className="space-y-3">
                  {quotes.slice(0, 3).map(q => (
                    <div key={q.name} className="border-l-2 border-cyan-700 pl-3">
                      <div className="text-[11px] text-zinc-300 italic leading-snug">"{q.quote}"</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-1">— {q.name}, {q.role}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            );
          }
          return (
            <Panel title="Market Position" icon={Globe}>
              <div className="text-xs text-zinc-500 italic">Geographic / competitive share not disclosed.</div>
            </Panel>
          );
        })()}
      </div>

      {/* ───── 5. Capital efficiency vs comps ─────
         Hidden for Cursor: comparison is uninformative since most
         competitors lack ARR-per-dollar-raised data (subsidiaries
         like Copilot/Codex/Claude Code aren't independently funded,
         and disclosure is sparse for the rest). Kept for Zeely where
         the comp set is informative. */}
      {company.id !== 'cursor' && (() => {
        const comps = mb.competitive || [];
        if (comps.length === 0) return null;
        // Compute company's own ratio
        const latestArrFn = mb.growth?.arr_trajectory?.[mb.growth.arr_trajectory.length - 1]?.arr || 0;
        const totalRaised = mb.growth?.total_raised_usd || 1;
        const ownRatio = latestArrFn / totalRaised;
        const fmtCompMoney = (n) => {
          if (n == null || n === 0) return '—';
          if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
          if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
          return `$${n}`;
        };
        const ownEntry = { name: company.name, val: ownRatio, raised: totalRaised, arr: latestArrFn, isOwn: true, hasData: latestArrFn > 0 && totalRaised > 0, type: 'independent' };

        // Independents — compute ratio. Sort by ratio desc.
        const independents = [
          ownEntry,
          ...comps.filter(c => (c.type || 'independent') === 'independent').map(c => {
            const hasData = c.arr_usd != null && c.raised_usd != null && c.raised_usd > 0;
            return {
              name: c.name,
              val: hasData ? c.arr_usd / c.raised_usd : 0,
              raised: c.raised_usd || 0,
              arr: c.arr_usd || 0,
              isOwn: false,
              hasData,
              type: 'independent',
              note: c.note,
            };
          }),
        ].sort((a, b) => (b.hasData ? b.val : -1) - (a.hasData ? a.val : -1));
        const maxVal = independents.find(b => b.hasData)?.val || 1;

        // Subsidiaries — show separately, no ratio bar (different funding structure)
        const subsidiaries = comps.filter(c => c.type === 'subsidiary').map(c => ({
          name: c.name,
          parent: c.parent,
          arr: c.arr_usd || 0,
          parentRaised: c.parent_raised_usd,
          hasArr: c.arr_usd != null,
        }));

        const ownTopOfIndep = independents[0]?.isOwn;
        return (
          <Panel title="Capital Efficiency vs. Competitors" icon={DollarSign} subtitle="ARR achieved per dollar raised">
            {/* Independents — real comparison */}
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-mono">Independent companies <span className="text-zinc-600 normal-case tracking-normal">— direct comparison</span></div>
              <div className="space-y-3">
                {independents.map(b => (
                  <div key={b.name} className={!b.hasData ? 'opacity-60' : ''}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-mono ${b.isOwn ? 'text-emerald-300 font-semibold' : 'text-zinc-300'}`}>
                        {b.name}
                      </span>
                      <span className="text-zinc-200 font-mono font-semibold">
                        {b.hasData ? `${b.val.toFixed(2)}×` : '—'}
                        <span className="text-zinc-500 font-normal"> · {fmtCompMoney(b.arr)} ARR / {fmtCompMoney(b.raised)} raised</span>
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div className={`h-full ${b.isOwn ? 'bg-emerald-500' : 'bg-zinc-600'}`}
                        style={{ width: b.hasData ? `${(b.val / maxVal) * 100}%` : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subsidiaries — separate group, no efficiency ratio */}
            {subsidiaries.length > 0 && (
              <div className="pt-3 border-t border-zinc-800">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-mono">
                  Subsidiary products <span className="text-zinc-600 normal-case tracking-normal">— ratio N/A (parent-funded)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subsidiaries.map(s => (
                    <div key={s.name} className="flex items-center justify-between text-xs px-2 py-1.5 bg-zinc-950/40 border border-zinc-800 rounded">
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="font-mono text-zinc-300 truncate">{s.name}</span>
                        <span className="text-zinc-600 text-[10px] shrink-0">/ {s.parent}</span>
                      </div>
                      <span className="font-mono text-zinc-400 shrink-0">
                        {s.hasArr ? `${fmtCompMoney(s.arr)} ARR` : '— ARR'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ownTopOfIndep && (
              null
            )}
          </Panel>
        );
      })()}

      {/* ───── Section separator + header — Investor Backing ───── */}
      <div style={{ height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #27272a, transparent)' }}></div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <Users className="w-5 h-5" style={{ color: '#22D3EE' }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Investor Backing</div>
          <div style={{ fontSize: 11, color: '#71717a', marginTop: 3 }}>Who's behind the round and how capital has been deployed</div>
        </div>
      </div>

      {/* ───── 5b. Investor backing visualization ───── */}
      <InvestorPanel mb={mb} company={company} />

      {/* ───── 6. Market opportunity ───── */}
      {(() => {
        const m = mb.market;
        if (!m) return null;
        // Build tile data with plain-English labels + sized comparison bars.
        // Each tile: label, currentValue, futureValue (optional), helperText.
        const fmt = (n) => {
          if (n == null) return '—';
          if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
          if (n >= 1e9)  return `$${(n / 1e9).toFixed(n / 1e9 < 10 ? 1 : 0)}B`;
          if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
          return `$${n}`;
        };
        const tiles = [];
        if (m.tam_2024_usd && m.tam_2030_usd) {
          // Cursor: "AI coding tools market". Zeely fallback: "AI marketing tools market".
          const isCursor = (m.category || '').toLowerCase().includes('coding');
          const isMarketing = (m.category || '').toLowerCase().includes('marketing');
          const friendlyLabel = isCursor
            ? 'AI coding tools market'
            : isMarketing
              ? 'AI marketing tools market'
              : `${m.category || 'Primary'} market`;
          tiles.push({
            label: friendlyLabel,
            helperLabel: `What ${company.name} sells into`,
            current: m.tam_2024_usd, currentYear: 2024,
            future:  m.tam_2030_usd, futureYear: 2030,
            cagrPct: m.tam_cagr_pct,
            accent: 'violet',
          });
        }
        if (m.supporting_market_2025_usd && m.supporting_market_2034_usd) {
          tiles.push({
            label: 'Total software market',
            helperLabel: 'Long-term tailwind for the category',
            current: m.supporting_market_2025_usd, currentYear: 2025,
            future:  m.supporting_market_2034_usd, futureYear: 2034,
            cagrPct: null,
            accent: 'emerald',
          });
        }
        if (m.vibe_coding_2025_usd && m.vibe_coding_2027_usd) {
          tiles.push({
            label: 'Vibe-coding (adjacent)',
            helperLabel: 'AI-first dev tools subcategory',
            current: m.vibe_coding_2025_usd, currentYear: 2025,
            future:  m.vibe_coding_2027_usd, futureYear: 2027,
            cagrPct: m.vibe_coding_cagr_pct,
            accent: 'orange',
          });
        }
        // Zeely fallback
        if (tiles.length === 0) {
          tiles.push(
            { label: 'AI marketing tools market', helperLabel: 'What Zeely sells into',
              current: 2_100_000_000, currentYear: 2024, future: 20_000_000_000, futureYear: 2030, cagrPct: 35, accent: 'violet' },
            { label: 'Marketing software (total)', helperLabel: 'Whole category Zeely lives in',
              current: 550_000_000_000, currentYear: 2025, future: 2_300_000_000_000, futureYear: 2033, cagrPct: 20, accent: 'emerald' },
            { label: 'US small-business ad spend', helperLabel: 'Zeely’s target buyers',
              current: 640_000_000_000, currentYear: 2025, future: null, futureYear: null, cagrPct: null,
              sentimentPct: 68, sentimentLabel: 'plan to increase spend in 2026',
              accent: 'orange' },
          );
        }
        if (tiles.length === 0) return null;

        const palette = (a) => ({
          violet:  { bg: 'bg-violet-950/30 border-violet-900/40',   text: 'text-violet-300', bar: 'bg-violet-500',   barTrack: 'bg-violet-900/30' },
          emerald: { bg: 'bg-emerald-950/30 border-emerald-900/40', text: 'text-emerald-300', bar: 'bg-emerald-500', barTrack: 'bg-emerald-900/30' },
          orange:  { bg: 'bg-orange-950/30 border-orange-900/40',   text: 'text-orange-300', bar: 'bg-orange-500',   barTrack: 'bg-orange-900/30' },
        }[a] || { bg: 'bg-zinc-950/30 border-zinc-800', text: 'text-zinc-300', bar: 'bg-zinc-500', barTrack: 'bg-zinc-800' });

        return (
          <Panel title="Market Opportunity" icon={Target}
            subtitle={`How big is the market ${company.name} can sell into, today and projected.`}>
            <div className={'grid grid-cols-1 gap-3 ' + (tiles.length >= 3 ? 'md:grid-cols-3' : tiles.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1')}>
              {tiles.map((t, i) => {
                const p = palette(t.accent);
                const growthMultiple = t.future && t.current ? (t.future / t.current) : null;
                const currentPct = growthMultiple ? Math.max(8, 100 / growthMultiple) : 100;
                return (
                  <div key={i} className={`rounded-lg p-4 border ${p.bg}`}>
                    <div className={`text-[11px] uppercase tracking-wider ${p.text} font-semibold`}>{t.label}</div>
                    {t.helperLabel && <div className="text-[10px] text-zinc-500 mt-0.5">{t.helperLabel}</div>}

                    {/* Number display */}
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-[24px] text-zinc-50 font-semibold tracking-tight" style={{ fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(t.current)}</span>
                      {t.future && (
                        <>
                          <span className="text-zinc-600">→</span>
                          <span className="text-[20px] text-zinc-200 font-medium" style={{ fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(t.future)}</span>
                        </>
                      )}
                    </div>

                    {/* Growth bar visualization (multi-year projection) */}
                    {t.future && growthMultiple && (
                      <div className="mt-3">
                        <div className={`relative h-2 ${p.barTrack} rounded-full overflow-hidden`}>
                          <div className={`absolute top-0 left-0 h-full ${p.bar} opacity-50 rounded-full`} style={{ width: `${currentPct}%` }} />
                          <div className={`absolute top-0 left-0 h-full ${p.bar} rounded-full`} style={{ width: `${currentPct * 0.4}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5 font-mono">
                          <span>{t.currentYear}</span>
                          <span className="text-zinc-400">{growthMultiple.toFixed(1)}× growth</span>
                          <span>{t.futureYear}</span>
                        </div>
                      </div>
                    )}

                    {/* Sentiment bar visualization (single-value tile with directional intent %) */}
                    {!t.future && t.sentimentPct != null && (
                      <div className="mt-3">
                        <div className={`relative h-2 ${p.barTrack} rounded-full overflow-hidden`}>
                          <div className={`absolute top-0 left-0 h-full ${p.bar} rounded-full`} style={{ width: `${t.sentimentPct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] mt-1.5">
                          <span className={`${p.text} font-mono font-semibold`} style={{ fontVariantNumeric: 'tabular-nums' }}>{t.sentimentPct}%</span>
                          <span className="text-zinc-500 font-mono">{100 - t.sentimentPct}% hold/cut</span>
                        </div>
                        {t.sentimentLabel && (
                          <div className="text-[11px] text-zinc-400 mt-1.5 leading-snug">{t.sentimentLabel}</div>
                        )}
                      </div>
                    )}

                    {/* CAGR helper */}
                    {t.cagrPct && (
                      <div className="text-[11px] text-zinc-500 mt-2">
                        Growing at <span className={p.text}>~{t.cagrPct}% per year</span>
                      </div>
                    )}

                    {/* No future, no sentiment = simple "as of YYYY" stamp */}
                    {!t.future && t.sentimentPct == null && (
                      <div className="text-[11px] text-zinc-500 mt-2">as of {t.currentYear}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        );
      })()}

      {/* ───── 8. Founders ───── */}
      <Panel title="Founders & Team" icon={Users}>
        <div className={'grid grid-cols-1 gap-4 items-stretch ' + ((mb.team?.founders || []).length >= 3 ? 'md:grid-cols-3' : (mb.team?.founders || []).length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1')}>
          {(mb.team?.founders || []).map((f, i) => {
            const initials = f.name.split(' ').map(n => n[0]).join('').slice(0, 2);
            const palettes = [
              { bg: 'bg-violet-900/40 border-violet-800', text: 'text-violet-200' },
              { bg: 'bg-pink-900/40 border-pink-800',     text: 'text-pink-200' },
              { bg: 'bg-teal-900/40 border-teal-800',     text: 'text-teal-200' },
              { bg: 'bg-amber-900/40 border-amber-800',   text: 'text-amber-200' },
              { bg: 'bg-cyan-900/40 border-cyan-800',     text: 'text-cyan-200' },
            ];
            const p = palettes[i % palettes.length];
            const departed = f.role.toLowerCase().includes('departed');
            return (
              <div key={f.name} className={`flex gap-3 p-3 bg-zinc-950/40 border border-zinc-800 rounded-lg h-full ${departed ? 'opacity-60' : ''}`}>
                <div className={`w-12 h-12 rounded-full border ${p.bg} ${p.text} flex items-center justify-center font-semibold text-sm shrink-0`}>{initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-100 text-sm font-medium truncate">{f.name}</span>
                    <a
                      href={f.linkedin || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(f.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      title={f.linkedin ? `${f.name} on LinkedIn` : `Search LinkedIn for ${f.name}`}
                      className="inline-flex items-center justify-center w-4 h-4 rounded text-zinc-500 hover:text-sky-400 hover:bg-sky-950/40 transition-colors shrink-0"
                      onClick={(e) => e.stopPropagation()}>
                      <Linkedin className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="text-zinc-500 text-[11px] mt-0.5">{f.role}</div>
                  <div className="text-zinc-400 text-[11px] mt-1 leading-snug line-clamp-3" title={f.bio}>{f.bio}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ───── Section separator + header — Key Risks ───── */}
      <div style={{ height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #27272a, transparent)' }}></div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <AlertTriangle className="w-5 h-5" style={{ color: '#FF4747' }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Key Risks</div>
          <div style={{ fontSize: 11, color: '#71717a', marginTop: 3 }}>What could derail the thesis — by severity, category, and horizon</div>
        </div>
      </div>

      {/* ───── 9. Risks — structured, with severity/likelihood quadrant ───── */}
      {(() => {
        const risks = mb.risks || [];
        if (risks.length === 0) return null;

        // Heuristics — derive severity, likelihood, horizon, category, trend
        // from label+note text. Explicit memo fields win when present.
        const score = (r) => {
          if (r.severity != null && r.likelihood != null) {
            return {
              severity:   r.severity,
              likelihood: r.likelihood,
              horizon:    r.horizon   || 'near',
              category:   r.category  || 'operational',
              trend:      r.trend     || 'stable',
            };
          }
          const text = ((r.label || '') + ' ' + (r.note || '')).toLowerCase();

          // Severity heuristic — strong negative words push up
          let severity = 5; // default mid
          if (/burn|cash|deceleration|compression|departed|leak|exploit|breach|churn|fraud|illegal|criminal|fatal|collapse|insolvency|fired|terminated/.test(text)) severity += 2;
          if (/competition|dependency|moat|vertical|integration|regulatory|api|platform/.test(text))                                                              severity += 1;
          if (/active mitigation|hedged|secured|insured|diversified/.test(text))                                                                                  severity -= 2;
          severity = Math.min(10, Math.max(2, severity));

          // Likelihood heuristic — concreteness / present-tense language signals probable
          let likelihood = 5;
          if (/(already|currently|today|now|building|departed|burning|consumes|launched)/.test(text)) likelihood += 2;
          if (/(could|might|may|potential|risk|possible|if)/.test(text))                              likelihood += 0;
          if (/(unlikely|long-?term|tail|remote|black swan)/.test(text))                              likelihood -= 2;
          likelihood = Math.min(10, Math.max(2, likelihood));

          // Horizon
          let horizon = 'near';
          if (/(this quarter|next quarter|months|imminent|launching|already)/.test(text)) horizon = 'imminent';
          else if (/(long-?term|2030|decade|years out|tail)/.test(text))                  horizon = 'far';

          // Category
          let category = 'operational';
          if (/(competition|moat|incumbent|microsoft|copilot|canva|adobe|distribution)/.test(text))      category = 'competitive';
          else if (/(regulatory|law|act|compliance|gdpr|api dependency|policy)/.test(text))              category = 'regulatory';
          else if (/(founder|co-?founder|cto|departure|key person|team|cofounders|engineer)/.test(text)) category = 'team';
          else if (/(margin|burn|cash|revenue|arr|valuation|compression|multiple)/.test(text))           category = 'financial';
          else if (/(model|vertical|integration|infrastructure|gpu|technical|architecture)/.test(text)) category = 'technical';

          // Trend
          let trend = 'stable';
          if (/(worsening|accelerating|growing|increasing risk|escalating)/.test(text))    trend = 'worsening';
          else if (/(improving|mitigated|stabilized|de-?risked|resolved)/.test(text))      trend = 'improving';

          return { severity, likelihood, horizon, category, trend };
        };

        const scored = risks.map(r => ({ ...r, ...score(r) }));

        // Sort by severity × likelihood desc so top risks render first
        scored.sort((a, b) => (b.severity * b.likelihood) - (a.severity * a.likelihood));

        const categoryStyle = {
          competitive: { bg: 'bg-fuchsia-950/40 border-fuchsia-800/60', text: 'text-fuchsia-200', dot: 'bg-fuchsia-400' },
          regulatory:  { bg: 'bg-amber-950/40 border-amber-800/60',     text: 'text-amber-200',   dot: 'bg-amber-400' },
          team:        { bg: 'bg-violet-950/40 border-violet-800/60',   text: 'text-violet-200',  dot: 'bg-violet-400' },
          financial:   { bg: 'bg-rose-950/40 border-rose-800/60',       text: 'text-rose-200',    dot: 'bg-rose-400' },
          technical:   { bg: 'bg-cyan-950/40 border-cyan-800/60',       text: 'text-cyan-200',    dot: 'bg-cyan-400' },
          operational: { bg: 'bg-zinc-900 border-zinc-700',             text: 'text-zinc-200',    dot: 'bg-zinc-400' },
        };

        const horizonLabel = { imminent: 'Imminent', near: 'Near-term', far: 'Long-term' };
        const trendIcon = { worsening: '↗', stable: '→', improving: '↘' };
        const trendColor = { worsening: 'text-rose-400', stable: 'text-zinc-500', improving: 'text-emerald-400' };

        return (
          <div className="bg-rose-950/15 border border-rose-900/40 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-[18px] h-[18px] text-rose-400" strokeWidth={1.5} />
              <div className="text-[14px] font-medium tracking-wide text-rose-200">Key Risks</div>
              <span className="text-[11px] text-zinc-500 ml-1">{scored.length} identified</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
              {/* LEFT: simple, self-explanatory summary panel */}
              {(() => {
                // Category breakdown
                const byCategory = {};
                scored.forEach(r => { byCategory[r.category] = (byCategory[r.category] || 0) + 1; });
                const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

                // Severity buckets
                const bySeverity = { high: 0, medium: 0, low: 0 };
                scored.forEach(r => {
                  if (r.severity >= 7)      bySeverity.high++;
                  else if (r.severity >= 4) bySeverity.medium++;
                  else                      bySeverity.low++;
                });

                // Worst risk for callout
                const worst = scored[0]; // already sorted by severity × likelihood desc
                const worstCat = categoryStyle[worst.category] || categoryStyle.operational;

                return (
                  <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-4 space-y-4">
                    {/* Top: biggest risk callout */}
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Biggest risk right now</div>
                      <div className={`p-2.5 rounded-lg border ${worstCat.bg}`}>
                        <div className={`text-[12px] font-semibold ${worstCat.text} leading-snug`}>{worst.label}</div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded font-mono capitalize ${worstCat.bg} ${worstCat.text}`}>{worst.category}</span>
                          <span className="text-zinc-500">·</span>
                          <span className="text-rose-300 font-mono">{worst.severity}/10 impact</span>
                        </div>
                      </div>
                    </div>

                    {/* Severity distribution — horizontal stacked bar with counts */}
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">How serious are they?</div>
                      <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                        {bySeverity.high   > 0 && <div className="h-full bg-rose-500"    style={{ width: `${(bySeverity.high   / scored.length) * 100}%` }} title={`${bySeverity.high} high-impact`}></div>}
                        {bySeverity.medium > 0 && <div className="h-full bg-amber-500"   style={{ width: `${(bySeverity.medium / scored.length) * 100}%` }} title={`${bySeverity.medium} medium-impact`}></div>}
                        {bySeverity.low    > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(bySeverity.low    / scored.length) * 100}%` }} title={`${bySeverity.low} low-impact`}></div>}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px]">
                        {bySeverity.high > 0 && (
                          <span className="inline-flex items-center gap-1 text-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            <span className="font-mono">{bySeverity.high}</span> high (7-10)
                          </span>
                        )}
                        {bySeverity.medium > 0 && (
                          <span className="inline-flex items-center gap-1 text-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            <span className="font-mono">{bySeverity.medium}</span> medium (4-6)
                          </span>
                        )}
                        {bySeverity.low > 0 && (
                          <span className="inline-flex items-center gap-1 text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span className="font-mono">{bySeverity.low}</span> low (0-3)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category breakdown — labeled list with bars */}
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Where the risks come from</div>
                      <div className="space-y-1.5">
                        {categoryEntries.map(([cat, count]) => {
                          const cs = categoryStyle[cat] || categoryStyle.operational;
                          const widthPct = (count / scored.length) * 100;
                          return (
                            <div key={cat} className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${cs.dot} shrink-0`}></span>
                              <span className="text-[11px] text-zinc-300 capitalize w-20 shrink-0">{cat}</span>
                              <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden">
                                <div className={`h-full ${cs.dot}`} style={{ width: `${widthPct}%` }}></div>
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono w-6 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* RIGHT: structured risk cards */}
              <div className="space-y-2">
                {scored.map((r, i) => {
                  const cs = categoryStyle[r.category] || categoryStyle.operational;
                  return (
                    <div key={r.id} className={`p-3 rounded-lg border ${cs.bg}`}>
                      <div className="flex items-start gap-3">
                        {/* Index number */}
                        <div className="text-[11px] font-mono text-zinc-500 w-5 shrink-0 mt-0.5 text-right">{i + 1}.</div>

                        <div className="flex-1 min-w-0">
                          {/* Top row: label + tags */}
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className={`text-[13px] font-semibold ${cs.text}`}>{r.label}</div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${cs.bg} ${cs.text} border-0 capitalize`}>{r.category}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">{horizonLabel[r.horizon]}</span>
                              <span className={`text-[12px] font-mono ${trendColor[r.trend]}`} title={`Trend: ${r.trend}`}>{trendIcon[r.trend]}</span>
                            </div>
                          </div>

                          {/* Severity / Likelihood meters */}
                          <div className="grid grid-cols-2 gap-3 mb-2">
                            <div>
                              <div className="flex items-center justify-between text-[9px] text-zinc-500 mb-0.5">
                                <span>Impact</span>
                                <span className="font-mono">{r.severity}/10</span>
                              </div>
                              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                <div className={`h-full ${r.severity >= 7 ? 'bg-rose-500' : r.severity >= 4 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${r.severity * 10}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-[9px] text-zinc-500 mb-0.5">
                                <span>Likelihood</span>
                                <span className="font-mono">{r.likelihood}/10</span>
                              </div>
                              <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                                <div className={`h-full ${r.likelihood >= 7 ? 'bg-rose-500' : r.likelihood >= 4 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${r.likelihood * 10}%` }}></div>
                              </div>
                            </div>
                          </div>

                          {/* Note */}
                          <div className="text-[11.5px] text-zinc-400 leading-relaxed">{r.note}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Your Position + Full Deal Structure moved to dedicated POSITION tab */}

    </div>
  );
}
