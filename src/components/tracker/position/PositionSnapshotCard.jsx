import React from 'react';
import { DollarSign } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
} from 'recharts';
import Panel from '../shared/Panel.jsx';
import { fmtUSD, daysBetween, todayISO } from '../../../lib/utils.js';

// Co-located: position-snapshot derivation (not yet in utils.js).
function computePositionSnapshot(cfg, capEvents) {
  // True ownership derived from the subscription form (avoids the
  // 0.04268 vs 0.0427 rounding drift in stored implied %).
  const ownership = cfg.gross_investment_usd / cfg.pre_money_valuation_usd;

  // Trajectory points: entry + any cap event with a pre-money mark.
  const points = [
    {
      date: cfg.entry_date,
      preMoney: cfg.pre_money_valuation_usd,
      label: 'Entry',
      source: 'Subscription form',
      isEntry: true,
    },
    ...(Array.isArray(capEvents) ? capEvents : [])
      .filter(c => c.pre_money_usd && c.date)
      .map(c => ({
        date: c.date,
        preMoney: parseFloat(c.pre_money_usd) || 0,
        label: c.round_type || 'Mark',
        source: c.lead || c.notes || 'Cap event',
        isEntry: false,
      })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  const latest = points[points.length - 1];
  const latestPreMoney = latest.preMoney;
  const latestDate = latest.date;
  const latestSource = latest.source;
  const latestLabel = latest.label;

  // Implied position value at the latest mark, ownership-locked.
  const currentImpliedValue = latestPreMoney * ownership;
  const grossInvested = cfg.gross_investment_usd;
  const deltaUSD = currentImpliedValue - grossInvested;
  const deltaPct = grossInvested > 0 ? (deltaUSD / grossInvested) * 100 : 0;
  const moic = grossInvested > 0 ? currentImpliedValue / grossInvested : 0;

  const daysHeld = daysBetween(cfg.entry_date, todayISO());
  const yearsHeld = daysHeld / 365.25;
  // CAGR only meaningful past ~3 months; below that it's noise.
  const cagrPct = yearsHeld >= 0.25 && grossInvested > 0
    ? (Math.pow(currentImpliedValue / grossInvested, 1 / yearsHeld) - 1) * 100
    : null;

  return {
    ownership,
    points,
    latestPreMoney,
    latestDate,
    latestSource,
    latestLabel,
    currentImpliedValue,
    deltaUSD,
    deltaPct,
    moic,
    daysHeld,
    yearsHeld,
    cagrPct,
    pointCount: points.length,
    grossInvested,
  };
}

function fmtDaysHeld(days) {
  if (days < 365) return `${days} days`;
  const y = Math.floor(days / 365);
  const d = days - y * 365;
  return `${y}y ${d}d`;
}

export default function PositionSnapshotCard({ cfg, capEvents }) {
  const snap = computePositionSnapshot(cfg, capEvents);
  const gain = snap.deltaUSD >= 0;
  const gainColor = gain ? 'text-emerald-400' : 'text-rose-400';
  const gainArrow = gain ? '▲' : '▼';

  // Chart data: prepend a numeric x-axis index so single-point case still
  // renders a dot. Recharts needs ≥2 points to draw a line — for single-point
  // case we render the dot + reference line and show an inline empty hint.
  const chartData = snap.points.map((p, i) => ({
    idx: i,
    date: p.date,
    valM: p.preMoney / 1e6,
    label: p.label,
    isEntry: p.isEntry,
  }));

  const labelCls = "text-[10px] uppercase tracking-wider text-zinc-500";

  return (
    <Panel title="Position Snapshot" icon={DollarSign}
      subtitle="Implied value + valuation trajectory. All values pulled from the position record and any logged cap events.">

      {/* Zone A — KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Current implied value */}
        <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
          <div className={labelCls}>Current implied value</div>
          <div className="font-mono text-2xl text-zinc-100 mt-1">{fmtUSD(snap.currentImpliedValue, { cents: true })}</div>
          <div className={`text-[11px] font-mono mt-1 ${gainColor}`}>
            {gain ? '+' : ''}{snap.deltaPct.toFixed(1)}% {gainArrow} vs. entry
          </div>
        </div>

        {/* MOIC */}
        <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
          <div className={labelCls}>MOIC</div>
          <div className={`font-mono text-2xl mt-1 ${gainColor}`}>{snap.moic.toFixed(2)}×</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {gain ? 'gain' : snap.deltaUSD === 0 ? 'flat (entry)' : 'loss'} vs. {fmtUSD(snap.grossInvested, { compact: true })}
          </div>
        </div>

        {/* Days held */}
        <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
          <div className={labelCls}>Days held</div>
          <div className="font-mono text-2xl text-zinc-100 mt-1">{fmtDaysHeld(snap.daysHeld)}</div>
          <div className="text-[11px] text-zinc-500 mt-1">since {cfg.entry_date}</div>
        </div>

        {/* Latest known valuation */}
        <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
          <div className={labelCls}>Latest known valuation</div>
          <div className="font-mono text-2xl text-zinc-100 mt-1">{fmtUSD(snap.latestPreMoney, { compact: true })}</div>
          <div className="text-[11px] text-zinc-500 mt-1 truncate" title={`${snap.latestLabel} · ${snap.latestSource}`}>
            as of {snap.latestDate} · {snap.latestSource}
          </div>
        </div>
      </div>

      {/* Zone B — Valuation trajectory */}
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className={labelCls}>Valuation trajectory</div>
          <div className="text-[10px] text-zinc-500 font-mono">
            {snap.pointCount === 1 ? '1 mark · entry only' : `${snap.pointCount} marks logged`}
          </div>
        </div>

        {snap.pointCount >= 2 ? (
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#27272a" strokeDasharray="2 2" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} unit="M"
                  domain={['auto', 'auto']} />
                <RTooltip
                  contentStyle={{ background: '#09090b', border: '1px solid #3f3f46', fontSize: 11 }}
                  formatter={(v, _name, p) => [`$${v.toFixed(0)}M`, p.payload.label]}
                  labelFormatter={(d) => d}
                />
                {/* Faint reference line at entry valuation */}
                <Line
                  type="monotone"
                  dataKey={() => cfg.pre_money_valuation_usd / 1e6}
                  stroke="#52525b"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="valM"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const isLatest = payload.date === snap.latestDate;
                    const r = isLatest ? 5 : 3;
                    const fill = isLatest ? '#22d3ee' : payload.isEntry ? '#a3a3a3' : '#22d3ee';
                    return <circle cx={cx} cy={cy} r={r} fill={fill} stroke="#09090b" strokeWidth={2} />;
                  }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="border border-dashed border-zinc-800 rounded p-4 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-300 font-mono">
                Entry · {cfg.entry_date} · {fmtUSD(cfg.pre_money_valuation_usd, { compact: true })}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Single mark logged. Add subsequent rounds, secondaries, or 409A updates in <span className="text-zinc-400">Settings → Cap-Table Events</span> to populate the trajectory.
              </div>
            </div>
          </div>
        )}

        {/* Tiny stat row below the chart */}
        <div className="mt-2 text-[10px] text-zinc-500 font-mono flex flex-wrap gap-x-3 gap-y-1">
          <span>Entry: <span className="text-zinc-300">{fmtUSD(cfg.pre_money_valuation_usd, { compact: true })}</span></span>
          <span>·</span>
          <span>Current: <span className="text-zinc-300">{fmtUSD(snap.latestPreMoney, { compact: true })}</span></span>
          <span>·</span>
          <span>Δ: <span className={gainColor}>{gain ? '+' : ''}{snap.deltaPct.toFixed(1)}%</span></span>
          <span>·</span>
          <span>CAGR: <span className={snap.cagrPct == null ? 'text-zinc-500' : gain ? 'text-emerald-400' : 'text-rose-400'}>
            {snap.cagrPct == null ? '—' : `${snap.cagrPct >= 0 ? '+' : ''}${snap.cagrPct.toFixed(1)}%`}
          </span></span>
          {snap.cagrPct == null && <span className="text-zinc-600">(<span title="CAGR requires ≥3 months held">held &lt;3mo</span>)</span>}
        </div>
      </div>
    </Panel>
  );
}
