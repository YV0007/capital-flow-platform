import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip } from 'recharts';

// Per-category trend chart. Each VC scorecard dimension is one line, with
// synthetic 16-week history easing into the current score. Once we start
// persisting per-dimension snapshots in scores.history we'll switch this
// over to real data; currently scores.history only tracks composite values.
const CATEGORY_LINE_COLORS = {
  team:             '#34d399',  // emerald
  market:           '#fbbf24',  // amber
  product_velocity: '#60a5fa',  // blue
  demand_growth:    '#a78bfa',  // violet
  cac_efficiency:   '#22d3ee',  // cyan
  retention:        '#f472b6',  // pink
  unit_econ:        '#bef264',  // lime
  hiring_signal:    '#fb923c',  // orange
  capital:          '#818cf8',  // indigo
  governance:       '#f87171',  // red
};

export default function ScoringTrendChart({ dimDetails }) {
  const history = useMemo(() => {
    const numWeeks = 24;          // more history for a longer story
    const out = [];
    const now = new Date();

    // Deterministic seed → same lines every render.
    let seed = 4242;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

    // Each dimension gets its own approach speed + inflection point so the
    // lines don't all rise at the same rate (more interesting visual).
    const profile = {};
    for (const d of dimDetails) {
      profile[d.id] = {
        speed: 6 + rand() * 4,        // sharpness of the S-curve (6..10)
        center: 0.30 + rand() * 0.35, // where the steep part happens (0.30..0.65)
        startBase: 0.1 + rand() * 0.6, // starting value, very low (0.1..0.7)
      };
    }

    for (let i = numWeeks - 1; i >= 0; i--) {
      const t = (numWeeks - 1 - i) / (numWeeks - 1); // 0..1 progress
      const date = new Date(now.getTime() - i * 7 * 86400 * 1000)
                     .toISOString().slice(5, 10); // MM-DD
      const row = { date };
      for (const d of dimDetails) {
        if (d.score == null) continue;
        const p = profile[d.id];
        // Sigmoid centred at p.center, sharpness p.speed → starts near 0,
        // climbs through the inflection, asymptotes toward 1 by t=1.
        const sig = 1 / (1 + Math.exp(-(t - p.center) * p.speed));
        // Map: at t=0 line sits at startBase, at t=1 hits the current score.
        const v = p.startBase + (d.score - p.startBase) * sig;
        // Very small noise — keep curves smooth, just a hint of organic wobble.
        const noise = (rand() - 0.5) * 0.15;
        row[d.id] = Math.max(0, Math.min(10, +(v + noise).toFixed(2)));
      }
      out.push(row);
    }
    return out;
  }, [dimDetails]);

  const visible = dimDetails.filter(d => d.score != null);

  return (
    <div>
      <div style={{ height: 460 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 12, right: 20, left: -4, bottom: 0 }}>
            <CartesianGrid stroke="#27272a" strokeDasharray="2 2" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 10]} ticks={[0, 2.5, 5, 7, 10]} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
            <RTooltip
              contentStyle={{ background: '#09090b', border: '1px solid #3f3f46', fontSize: 11 }}
              labelStyle={{ color: '#a1a1aa' }}
              formatter={(v) => (v != null ? v.toFixed(1) : '—')}
            />
            {visible.map(d => (
              <Line key={d.id} type="natural" dataKey={d.id}
                    stroke={CATEGORY_LINE_COLORS[d.id] || '#888'} strokeWidth={2}
                    dot={false} activeDot={{ r: 4 }} name={d.label} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Custom inline legend — Recharts' built-in legend wraps awkwardly with 10 series */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 px-2">
        {visible.map(d => (
          <div key={d.id} className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
            <span className="inline-block w-3.5 h-0.5 rounded" style={{ background: CATEGORY_LINE_COLORS[d.id] || '#888' }} />
            {d.label}
            <span className="text-zinc-600">{d.score != null ? d.score.toFixed(1) : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
