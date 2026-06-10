import React from 'react';
import {
  ChevronDown, ChevronRight, FileText, Info, CheckCircle2, AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip as RTooltip,
} from 'recharts';
import { computeCarryWaterfall, fmtUSD } from '../../../lib/utils.js';

function fmtUSDshort(n) {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function MemoTile({ title, asOf, children, wide = false }) {
  return (
    <div className={`bg-zinc-950 border border-amber-900/40 rounded p-3 ${wide ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wider text-amber-400/80 font-mono">{title}</div>
        {asOf && <div className="text-[9px] text-zinc-600 font-mono">As of: {asOf}</div>}
      </div>
      {children}
    </div>
  );
}

export default function MemoBaselineCard({ cfg, mb, open, onToggle, onJumpTo }) {
  if (!mb) return null;

  // Compute Anton net return at 6x base scenario for each tier.
  const antonReturns = mb.exit_scenarios.map(s => {
    const wf = computeCarryWaterfall(s.exit_6x_usd, cfg, 1.0);
    return {
      tier: s.tier,
      arr2027: s.arr_2027_usd,
      exit6x: s.exit_6x_usd,
      gross: wf.grossProceeds,
      net: wf.netProceeds,
      multiple: wf.netMultiple,
    };
  });

  // Avg cohort retention by month (all paid + power)
  const avgByMonth = (cohorts) => {
    const sums = []; const counts = [];
    cohorts.forEach(c => c.m.forEach((v, i) => { sums[i] = (sums[i] || 0) + v; counts[i] = (counts[i] || 0) + 1; }));
    return sums.map((s, i) => ({ month: `M${i + 1}`, value: s / counts[i] }));
  };
  const allPaidAvg = avgByMonth(mb.users.cohorts_all_paid);
  const powerAvg = avgByMonth(mb.users.cohorts_power);
  const retentionData = allPaidAvg.map((d, i) => ({
    month: d.month,
    'All paid': Number(d.value.toFixed(1)),
    'Power users': powerAvg[i] ? Number(powerAvg[i].value.toFixed(1)) : null,
  }));

  // Capital efficiency comparison
  const capEff = [
    { name: 'Zeely', value: 7.09 },
    { name: 'Arcads', value: 0.75 },
    { name: 'Creatify', value: 0.43 },
    { name: 'Mirage', value: 0.30 },
  ];

  const labelCls = "text-[10px] uppercase tracking-wider text-zinc-500";
  const tinyAttr = (
    <div className="text-[9px] text-zinc-600 font-mono mt-1">Source: Toloka Memo (Apr 2026) · Insider</div>
  );

  return (
    <div className="bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-900 border border-amber-900/50 rounded">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-amber-900/40">
        <button onClick={onToggle} className="flex items-center gap-2 text-left">
          {open ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronRight className="w-4 h-4 text-amber-400" />}
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-200">Memo Baseline (Apr 2026)</span>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-900/40 text-amber-300 border border-amber-700 rounded-sm font-mono">Insider</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => onJumpTo?.('signals')} className="text-[10px] inline-flex items-center gap-1 px-2 py-1 border border-zinc-700 rounded text-zinc-300 hover:bg-zinc-800">
            Compare vs public signals →
          </button>
        </div>
      </div>

      {open && (
        <div className="p-3 space-y-3">
          {/* Banner */}
          <div className="bg-amber-950/40 border border-amber-800/60 rounded px-3 py-2 text-[11px] text-amber-200 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div>Insider baseline — figures from Toloka's underwriting memo. High confidence as syndicate disclosure but inherently bullish framing. Triangulate against public signals as they become available.</div>
          </div>

          {/* Headline metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { lbl: 'ARR (Jan 2026)',     val: '$39M',  sub: '78.4% GM' },
              { lbl: 'MRR (Jan 2026)',     val: '$3.3M', sub: '+37.5% MoM' },
              { lbl: 'Users / Paying',     val: '1M / 50K', sub: '5% conversion' },
              { lbl: 'Headcount (FTE)',    val: '150',   sub: '$260K ARR/FTE' },
              { lbl: 'Cash / Raised',      val: '$3.44M / $5.5M', sub: 'capeff 7.1x' },
              { lbl: 'LTV / CAC',          val: '3.3×',  sub: 'target 4× (2026)' },
            ].map(t => (
              <div key={t.lbl} className="bg-zinc-950 border border-zinc-800 rounded p-2">
                <div className={labelCls}>{t.lbl}</div>
                <div className="text-zinc-100 font-mono text-base mt-0.5">{t.val}</div>
                <div className="text-[10px] text-zinc-500">{t.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* Growth tile */}
            <MemoTile title="ARR & MRR Trajectory" asOf="Jan 2026">
              <div style={{ height: 110 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mb.growth.arr_trajectory.map(d => ({ ...d, arrM: d.arr / 1e6 }))}>
                    <defs>
                      <linearGradient id="arrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#27272a" strokeDasharray="2 2" />
                    <XAxis dataKey="period" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10 }} unit="M" />
                    <RTooltip contentStyle={{ background: '#09090b', border: '1px solid #3f3f46', fontSize: 11 }} formatter={(v) => `$${v}M`} />
                    <Area type="monotone" dataKey="arrM" stroke="#f59e0b" fill="url(#arrGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                <div><div className={labelCls}>Q4 2025 rev</div><div className="text-emerald-400 font-mono text-sm">+90%</div></div>
                <div><div className={labelCls}>MoM Q4 25</div><div className="text-emerald-400 font-mono text-sm">+29.8%</div></div>
                <div><div className={labelCls}>YoY (FY 25)</div><div className="text-amber-400 font-mono text-sm">+36%</div></div>
              </div>
              <div className="mt-2 pt-2 border-t border-zinc-800">
                <div className="text-[10px] text-zinc-500 mb-1">MRR last 4 months</div>
                <div className="flex items-end gap-1 h-8">
                  {mb.growth.mrr_trajectory.map((d, i) => {
                    const max = Math.max(...mb.growth.mrr_trajectory.map(x => x.mrr));
                    const h = (d.mrr / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-cyan-700 rounded-t" style={{ height: `${h}%` }} />
                        <div className="text-[8px] text-zinc-500 font-mono">${(d.mrr/1e6).toFixed(1)}M</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {tinyAttr}
            </MemoTile>

            {/* Capital efficiency tile */}
            <MemoTile title="Capital Efficiency vs Comps" asOf="Apr 2026">
              <div style={{ height: 110 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={capEff} layout="horizontal">
                    <CartesianGrid stroke="#27272a" strokeDasharray="2 2" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10 }} unit="x" />
                    <RTooltip contentStyle={{ background: '#09090b', border: '1px solid #3f3f46', fontSize: 11 }} formatter={(v) => `${v}x`} />
                    <Area type="step" dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.4} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-1 text-[10px] font-mono text-center">
                <div className="text-cyan-400">Zeely 7.1×</div>
                <div className="text-zinc-400">Arcads 0.75×</div>
                <div className="text-zinc-400">Creatify 0.43×</div>
                <div className="text-zinc-400">Mirage 0.30×</div>
              </div>
              <div className="text-[10px] text-zinc-500 mt-2">$ ARR per $ raised. Memo's strongest defensibility argument.</div>
              {tinyAttr}
            </MemoTile>

            {/* Cohort retention tile */}
            <MemoTile title="Cohort Retention (avg)" asOf="2025 cohorts">
              <div style={{ height: 110 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={retentionData}>
                    <CartesianGrid stroke="#27272a" strokeDasharray="2 2" />
                    <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10 }} unit="%" domain={[0, 100]} />
                    <RTooltip contentStyle={{ background: '#09090b', border: '1px solid #3f3f46', fontSize: 11 }} formatter={(v) => v ? `${v}%` : '—'} />
                    <Line type="monotone" dataKey="All paid" stroke="#f87171" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="Power users" stroke="#34d399" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-zinc-500 mt-2">Power users (~3.6% of paying base) sustain 80%+ at M6. The durable LTV pool.</div>
              {tinyAttr}
            </MemoTile>

            {/* Entry valuation tile */}
            <MemoTile title="Entry Valuation Reconciliation" asOf="Apr 2026">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div>
                    <div className={labelCls}>Anton's entry</div>
                    <div className="text-emerald-400 font-mono text-base">$120M pre-money</div>
                    <div className="text-[10px] text-zinc-500">3.1× ARR — favorable tier</div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={labelCls}>Memo ceiling</div>
                    <div className="text-zinc-400 font-mono text-base">$200M pre-money</div>
                    <div className="text-[10px] text-zinc-500">5.1× ARR — top tier</div>
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded p-2 text-[10px] text-zinc-400">
                  Tiered by total check size. Anton's $120M tier is logged as a deal-structure observation, not an inconsistency. Built-in margin of safety vs ceiling tier.
                </div>
              </div>
              {tinyAttr}
            </MemoTile>

          </div>

          {/* Exit scenarios — full width */}
          <MemoTile title="Exit Scenarios — Anton's Net Return" asOf="2027 horizon" wide>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                  <th className="text-left py-1.5 font-normal">Tier</th>
                  <th className="text-right py-1.5 font-normal">2027 ARR</th>
                  <th className="text-right py-1.5 font-normal">Exit @ 6×</th>
                  <th className="text-right py-1.5 font-normal">Anton gross</th>
                  <th className="text-right py-1.5 font-normal">Anton net</th>
                  <th className="text-right py-1.5 font-normal">Net multiple</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {antonReturns.map(r => (
                  <tr key={r.tier} className="border-b border-zinc-900">
                    <td className="py-1.5 text-zinc-300">{r.tier}</td>
                    <td className="py-1.5 text-right text-zinc-300">{fmtUSDshort(r.arr2027)}</td>
                    <td className="py-1.5 text-right text-zinc-300">{fmtUSDshort(r.exit6x)}</td>
                    <td className="py-1.5 text-right text-zinc-400">${r.gross.toFixed(0)}</td>
                    <td className={`py-1.5 text-right ${r.net > cfg.gross_investment_usd ? 'text-emerald-400' : 'text-rose-400'}`}>${r.net.toFixed(0)}</td>
                    <td className={`py-1.5 text-right ${r.multiple > 1 ? 'text-emerald-400' : 'text-rose-400'}`}>{r.multiple.toFixed(2)}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[10px] text-zinc-500 mt-2">Computed at 6× exit multiple per memo (base case). Applies 10% carry on excess above 10% hurdle on Anton's gross investment of {fmtUSD(cfg.gross_investment_usd, { cents: true })}. Excludes post-entry dilution.</div>
            {tinyAttr}
          </MemoTile>

          {/* Risk pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Risks (memo):</span>
            {mb.risks.map(r => (
              <span key={r.id} title={r.note} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] border border-rose-800 bg-rose-950/40 text-rose-300 rounded-sm font-mono">
                <AlertCircle className="w-3 h-3" />
                {r.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
