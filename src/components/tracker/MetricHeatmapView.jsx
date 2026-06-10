// VC Framework heatmap + per-category framework view.
// Translated verbatim from monolith lines 9213–9534 (MetricHeatmapView)
// and 9535–9663 (MetricFrameworkView). Local helpers (parseObsNumber,
// fmtHeatmapValue, monthBucket, synthetic-data generator, and the
// HEATMAP_DEMO_MODE flag) are inlined from monolith lines 9123–9211
// because they are not exported from lib/utils.js.

import { useMemo, useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Plus,
} from 'lucide-react';

import Panel from './shared/Panel.jsx';
import { SourceTag, ConfidenceBadge, StatusDot, Tooltip } from './shared/badges.jsx';
import { METRIC_FRAMEWORK } from '../../lib/utils.js';
import optionsJson from '../../data/options.json';

const { STAGE_OPTIONS } = optionsJson;

// ────────────────────────────────────────────────────────────────
// LOCAL HELPERS (monolith 9123–9156)
// ────────────────────────────────────────────────────────────────
function parseObsNumber(obs) {
  if (!obs) return NaN;
  const strip = x => parseFloat(String(x).replace(/[^\d.\-]/g, ''));
  if (obs.rangeLow != null && obs.rangeHigh != null) {
    const lo = strip(obs.rangeLow);
    const hi = strip(obs.rangeHigh);
    if (!isNaN(lo) && !isNaN(hi)) return (lo + hi) / 2;
  }
  if (obs.value != null) return strip(obs.value);
  return NaN;
}

function fmtHeatmapValue(obs) {
  if (!obs) return null;
  const raw = parseObsNumber(obs);
  if (isNaN(raw)) return String(obs.value || '').slice(0, 6);
  const abs = Math.abs(raw);
  const unit = obs.unit || '';
  let str;
  if (abs >= 1e9)        str = `${(raw / 1e9).toFixed(1)}B`;
  else if (abs >= 1e6)   str = `${(raw / 1e6).toFixed(1)}M`;
  else if (abs >= 1e3)   str = `${(raw / 1e3).toFixed(0)}K`;
  else if (abs >= 10)    str = raw.toFixed(0);
  else                   str = raw.toFixed(1);
  if (unit.includes('%') || String(obs.value || '').includes('%')) str += '%';
  else if (unit.startsWith('$') || String(obs.value || '').startsWith('$')) str = `$${str}`;
  return str;
}

function monthBucket(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  return dateStr.slice(0, 7); // YYYY-MM
}

// ────────────────────────────────────────────────────────────────
// SYNTHETIC DATA — for visual exploration of the heatmap when real
// observations are sparse. Generates 14 months × every metric, with
// realistic random-walk variation (mostly small changes, some medium,
// occasional extremes). Set HEATMAP_DEMO_MODE to false to disable.
// ────────────────────────────────────────────────────────────────
const HEATMAP_DEMO_MODE = false;

function generateSyntheticObservations() {
  const obs = [];
  const now = new Date();
  const numMonths = 14;
  const months = [];
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
    months.push(d.toISOString().slice(0, 10));
  }

  // Deterministic pseudo-random so colours don't jitter on re-render.
  let seed = 1337;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  for (const cat of METRIC_FRAMEWORK) {
    for (const metric of cat.metrics) {
      let value = 100 + Math.floor(rand() * 900);
      for (const date of months) {
        // 65% small change, 25% medium, 10% extreme — centred slightly
        // positive so metrics trend up over time like a real growth company.
        const r = rand();
        let change;
        if (r < 0.65)      change = (rand() - 0.35) * 0.25;  // ~-9% to +16%
        else if (r < 0.90) change = (rand() - 0.40) * 0.80;  // ~-32% to +48%
        else               change = (rand() - 0.35) * 2.5;   // ~-87% to +163%

        const newValue = Math.max(1, value * (1 + change));
        const direction = change > 0.02 ? 'up' : (change < -0.02 ? 'down' : 'flat');
        obs.push({
          id: `synth_${metric.id}_${date}`,
          date,
          frameworkCategory: cat.id,
          metricId: metric.id,
          label: metric.label,
          value: String(Math.round(newValue * 10) / 10),
          unit: '',
          confidence: 'med',
          direction,
          superseded: false,
        });
        value = newValue;
      }
    }
  }
  return obs;
}

export default function MetricHeatmapView({ cfg, observations: realObservations, onAddObservation }) {
  // Use synthetic data when demo mode is on; otherwise real observations.
  const observations = useMemo(
    () => HEATMAP_DEMO_MODE ? generateSyntheticObservations() : realObservations,
    [realObservations]
  );

  const [stage, setStage]         = useState(cfg.default_stage_classification);
  const [sortDir, setSortDir]     = useState('desc');         // 'desc' = newest first
  const [rangeDays, setRangeDays] = useState('all');           // '30'|'90'|'180'|'365'|'all'
  const [hiddenCats, setHiddenCats] = useState(() => new Set());

  const activeObs = useMemo(
    () => observations.filter(o => !o.superseded && o.metricId),
    [observations]
  );

  // Date-range filter (relative to today)
  const filteredObs = useMemo(() => {
    if (rangeDays === 'all') return activeObs;
    const cutoff = Date.now() - parseInt(rangeDays, 10) * 86400 * 1000;
    return activeObs.filter(o => o.date && new Date(o.date).getTime() >= cutoff);
  }, [activeObs, rangeDays]);

  // Month buckets: { 'YYYY-MM': { metricId: latestObsInMonth } }
  const monthMap = useMemo(() => {
    const m = {};
    for (const o of filteredObs) {
      const mo = monthBucket(o.date);
      if (!mo) continue;
      if (!m[mo]) m[mo] = {};
      const cur = m[mo][o.metricId];
      if (!cur || new Date(o.date) > new Date(cur.date)) m[mo][o.metricId] = o;
    }
    return m;
  }, [filteredObs]);

  const monthsSorted = useMemo(() => {
    const months = Object.keys(monthMap).sort();
    return sortDir === 'desc' ? months.reverse() : months;
  }, [monthMap, sortDir]);

  // Latest per metric (across ALL active obs, ignoring range filter, for the
  // top "Latest" stat row). Range filter only affects the data rows.
  const latestByMetric = useMemo(() => {
    const m = {};
    for (const o of activeObs) {
      const cur = m[o.metricId];
      if (!cur || new Date(o.date) > new Date(cur.date)) m[o.metricId] = o;
    }
    return m;
  }, [activeObs]);

  const visibleCats = METRIC_FRAMEWORK.filter(cat => !hiddenCats.has(cat.id));
  const flatMetrics = visibleCats.flatMap(cat =>
    cat.metrics.map(m => ({ ...m, catId: cat.id, catLabel: cat.label }))
  );

  // ── PER-METRIC TIMELINE ────────────────────────────────────────
  // For each metric, build an ASC-sorted list of { date, value }
  // — only entries with a usable numeric value. This is what powers
  // the "% change vs previous observation" heatmap colouring.
  // We match cells to timeline entries by DATE (not object reference),
  // so colours survive localStorage rehydration cleanly.
  const metricTimeline = useMemo(() => {
    const m = {};
    for (const o of activeObs) {
      const v = parseObsNumber(o);
      if (isNaN(v)) continue;
      if (!m[o.metricId]) m[o.metricId] = [];
      m[o.metricId].push({ date: o.date, value: v });
    }
    for (const k of Object.keys(m)) {
      m[k].sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    return m;
  }, [activeObs]);

  // Compute the visual style for one cell.
  function cellStyle(obs, metricId) {
    // No observation at all → very dark cell.
    if (!obs) return { background: 'rgb(15, 15, 17)', color: '#3f3f46' };

    const value = parseObsNumber(obs);
    const tl    = metricTimeline[metricId];

    // Find the entry in the timeline that PRECEDES this observation's date.
    // (We don't rely on object identity because observations can rehydrate
    // from localStorage as fresh objects; we don't rely on index either
    // because the same metric might have multiple observations in a month.)
    let prev = null;
    if (tl && obs.date && !isNaN(value)) {
      const myTime = new Date(obs.date).getTime();
      for (const t of tl) {
        const tTime = new Date(t.date).getTime();
        if (tTime < myTime && (!prev || tTime > new Date(prev.date).getTime())) {
          prev = t;
        }
      }
    }

    // No prior observation OR value isn't numeric → muted neutral.
    if (!prev || prev.value === 0 || isNaN(value)) {
      return { background: 'rgb(30, 30, 34)', color: '#a1a1aa' };
    }

    const pct = (value - prev.value) / Math.abs(prev.value);

    // Damp low/medium confidence so unreliable observations don't dominate.
    const conf = obs.confidence;
    const dampedPct = (conf === 'low' || conf === 'lo')
      ? pct * 0.5
      : ((conf === 'medium' || conf === 'med') ? pct * 0.8 : pct);

    // Intensity curve: log-based, so we can distinguish across multiple
    // orders of magnitude.
    //   +10%  → 0.15
    //   +30%  → 0.30
    //   +100% → 0.52
    //   +300% → 0.74
    //   +1000%→ 1.0
    const logMag  = Math.log10(1 + Math.abs(dampedPct) * 10);
    let intensity = Math.min(1, logMag / 2.0);
    intensity = Math.max(intensity, 0.12);

    const hue       = pct >= 0 ? 158 : 0;             // emerald / rose
    const sat       = 40 + intensity * 32;             // 40% → 72%
    const lightness = 13 + intensity * 30;             // 13% → 43%
    const textLight = 75 + intensity * 18;             // 75% → 93%

    return {
      background: `hsl(${hue}, ${sat}%, ${lightness}%)`,
      color: `hsl(${hue}, 55%, ${textLight}%)`,
    };
  }

  // ── HEATMAP MODE ───────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <Panel
        title="VC Framework Heatmap"
        icon={Layers}>
        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Stage:</span>
            <select className="bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200"
              value={stage} onChange={e => setStage(e.target.value)}>
              {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="w-px h-4 bg-zinc-800" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 mr-1">Range:</span>
            {[['30','30d'],['90','3mo'],['180','6mo'],['365','12mo'],['all','All']].map(([v, l]) => (
              <button key={v} onClick={() => setRangeDays(v)}
                className={`text-[10px] px-2 py-0.5 rounded border ${rangeDays === v
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-zinc-800" />
          <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="text-[10px] text-zinc-300 hover:text-emerald-400 px-2 py-0.5 rounded border border-zinc-700 inline-flex items-center gap-1">
            {sortDir === 'desc' ? '↓ Newest first' : '↑ Oldest first'}
          </button>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap items-center gap-1 mb-3">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 mr-1">Categories:</span>
          {METRIC_FRAMEWORK.map(cat => {
            const hidden = hiddenCats.has(cat.id);
            const hasObs = cat.metrics.some(m => latestByMetric[m.id]);
            return (
              <button key={cat.id}
                onClick={() => setHiddenCats(prev => {
                  const n = new Set(prev);
                  if (n.has(cat.id)) n.delete(cat.id); else n.add(cat.id);
                  return n;
                })}
                style={hidden ? { opacity: 0.35, textDecoration: 'line-through' } : undefined}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  hidden
                    ? 'text-zinc-400 border-zinc-800 bg-zinc-900'
                    : (hasObs
                        ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/5'
                        : 'text-zinc-400 border-zinc-700')
                }`}>
                {cat.label} <span className="text-zinc-500 ml-0.5">{cat.metrics.length}</span>
              </button>
            );
          })}
        </div>

        {/* Legend — gradients show magnitude of % change vs previous observation in time */}
        <div className="text-[10px] text-zinc-500 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono text-zinc-400">Grew vs prev</span>
            <span className="inline-block h-3 w-20 rounded" style={{ background: 'linear-gradient(to right, hsl(158, 40%, 13%), hsl(158, 72%, 43%))' }} />
            <span className="text-zinc-600">stronger →</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono text-zinc-400">Fell vs prev</span>
            <span className="inline-block h-3 w-20 rounded" style={{ background: 'linear-gradient(to right, hsl(0, 40%, 13%), hsl(0, 72%, 43%))' }} />
            <span className="text-zinc-600">stronger →</span>
          </span>
        </div>
      </Panel>

      {/* HEATMAP TABLE — horizontal+vertical scroll, sticky left col + top header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
          <table className="text-[10px] border-collapse" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', width: 110 + flatMetrics.reduce((s, m) => s + (m.id === "mrr" ? 130 : 120), 0) }}>
            <colgroup>
              <col style={{ width: 110 }} />
              {flatMetrics.map(m => <col key={m.id} style={{ width: m.id === "mrr" ? 130 : 120 }} />)}
            </colgroup>
            <thead className="sticky top-0 z-20 bg-zinc-900">
              {/* Category group row */}
              <tr>
                <th className="sticky left-0 z-30 bg-zinc-900 border-b border-r border-zinc-800 px-2 py-1.5 text-left font-mono"
                    style={{ minWidth: 110, maxWidth: 110 }}>&nbsp;</th>
                {visibleCats.map(cat => (
                  <th key={cat.id} colSpan={cat.metrics.length}
                      className="border-b border-zinc-800 border-l-2 border-l-zinc-700 px-2 py-1.5 text-center text-[10px] uppercase tracking-wider text-zinc-300 font-mono bg-zinc-900/80 whitespace-nowrap">
                    {cat.label}
                  </th>
                ))}
              </tr>
              {/* Metric label row */}
              <tr>
                <th className="sticky left-0 z-30 bg-zinc-900 border-b border-r border-zinc-800 px-2 py-1.5 text-left text-[10px] uppercase tracking-wider text-zinc-500 font-mono"
                    style={{ minWidth: 110, maxWidth: 110 }}>Period</th>
                {flatMetrics.map((m, i) => {
                  const isCatStart = i === 0 || flatMetrics[i-1].catId !== m.catId;
                  const colW = m.id === "mrr" ? 130 : 120;
                  return (
                    <th key={m.id}
                        className={`border-b border-zinc-800 ${isCatStart ? 'border-l-2 border-l-zinc-700' : 'border-l border-l-zinc-900'} px-1.5 py-1.5 text-left text-[9px] text-zinc-400 font-mono`}
                        style={{ overflow: 'hidden', width: colW, minWidth: colW, maxWidth: colW }}
                        title={`${m.label}\n${m.why}\nBenchmark: ${m.benchmark}`}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</div>
                    </th>
                  );
                })}
              </tr>
              {/* LATEST stat row */}
              <tr className="bg-zinc-950/60" style={{ height: 28 }}>
                <th className="sticky left-0 z-30 bg-zinc-950 border-b border-r border-zinc-800 px-2 py-1 text-left text-[10px] uppercase tracking-wider text-emerald-400 font-mono"
                    style={{ minWidth: 110, maxWidth: 110, height: 28 }}>
                  Latest
                </th>
                {flatMetrics.map((m, i) => {
                  const obs = latestByMetric[m.id];
                  const val = fmtHeatmapValue(obs);
                  const styleObj = cellStyle(obs, m.id);
                  const isCatStart = i === 0 || flatMetrics[i-1].catId !== m.catId;
                  return (
                    <td key={m.id}
                        className={`border-b border-zinc-800 ${isCatStart ? 'border-l-2 border-l-zinc-700' : 'border-l border-l-zinc-900'} px-1.5 py-1 text-center font-mono`}
                        style={{ ...styleObj, height: 28 }}
                        title={obs ? `${m.label}\n${val} on ${obs.date}\nConf: ${obs.confidence || '—'}\nBench: ${m.benchmark}` : `${m.label}\n(no observation yet)\nBench: ${m.benchmark}`}>
                      {val || '—'}
                    </td>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {monthsSorted.map(month => {
                const obsInMonth = monthMap[month] || {};
                return (
                  <tr key={month} className="hover:bg-zinc-800/15" style={{ height: 28 }}>
                    <td className="sticky left-0 z-10 bg-zinc-900 border-r border-b border-zinc-800 px-2 py-1 text-left text-[11px] font-mono text-zinc-400 whitespace-nowrap"
                        style={{ minWidth: 110, maxWidth: 110, height: 28 }}>
                      {month}
                    </td>
                    {flatMetrics.map((m, i) => {
                      const obs = obsInMonth[m.id];
                      const val = fmtHeatmapValue(obs);
                      const styleObj = cellStyle(obs, m.id);
                      const isCatStart = i === 0 || flatMetrics[i-1].catId !== m.catId;
                      return (
                        <td key={m.id}
                            className={`border-b border-zinc-800 ${isCatStart ? 'border-l-2 border-l-zinc-700' : 'border-l border-l-zinc-900'} px-1.5 py-1 text-center font-mono cursor-pointer hover:ring-1 hover:ring-emerald-500/60 transition-shadow`}
                            style={{ ...styleObj, height: 28 }}
                            onClick={() => onAddObservation({
                              frameworkCategory: m.catId,
                              metricId: m.id,
                              label: m.label,
                              sourceType: m.source === 'B' ? 'P' : m.source,
                              date: `${month}-15`,
                            })}
                            title={obs
                              ? `${m.label}\n${val} on ${obs.date}\nConf: ${obs.confidence || '—'}\nBench: ${m.benchmark}\n\nClick to log a new observation`
                              : `${m.label} — no observation in ${month}\nBench: ${m.benchmark}\n\nClick to log one`}>
                          {val || ' '}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {monthsSorted.length === 0 && (
                <tr>
                  <td colSpan={flatMetrics.length + 1}
                      className="px-3 py-6 text-center text-[11px] text-zinc-500 italic">
                    No observations in selected range. Try widening the range filter, or switch to the List view to log observations.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function MetricFrameworkView({ cfg, observations, onAddObservation }) {
  const [stage, setStage] = useState(cfg.default_stage_classification);
  const [openCat, setOpenCat] = useState(METRIC_FRAMEWORK[0].id);
  const [showPendingByCat, setShowPendingByCat] = useState({});

  // Build metric → latest observation map
  const latestByMetric = useMemo(() => {
    const m = {};
    for (const o of observations.filter(o => !o.superseded)) {
      if (!o.metricId) continue;
      const existing = m[o.metricId];
      if (!existing || new Date(o.date) > new Date(existing.date)) m[o.metricId] = o;
    }
    return m;
  }, [observations]);

  return (
    <div className="space-y-3">
      <Panel title="Metric Framework — 10 VC Categories" icon={Layers}
        right={
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Stage benchmark:</span>
            <select className="bg-zinc-950 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200" value={stage} onChange={e => setStage(e.target.value)}>
              {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        }>
        <div className="text-[11px] text-zinc-500 italic">
          The standard VC framework used to evaluate portfolio companies — 10 metric categories benchmarked against stage peers. Use the dropdown to switch the benchmark stage.
        </div>
        <div className="text-[11px] text-zinc-500 mt-1.5">Status vs benchmark: <span className="text-emerald-400">✓ above</span> · <span className="text-sky-400">◯ in line</span> · <span className="text-rose-400">✗ below</span> · <span className="text-zinc-500">— unknown</span></div>
      </Panel>

      {METRIC_FRAMEWORK.map(cat => {
        const isOpen = openCat === cat.id;
        const populatedMetrics = cat.metrics.filter(m => latestByMetric[m.id]);
        const pendingMetrics   = cat.metrics.filter(m => !latestByMetric[m.id]);
        const showPending      = showPendingByCat[cat.id] === true;
        const visibleMetrics   = showPending ? cat.metrics : [...populatedMetrics, ...(populatedMetrics.length === 0 ? pendingMetrics.slice(0, 1) : [])];
        return (
          <div key={cat.id} className="bg-zinc-900 border border-zinc-800 rounded">
            <button onClick={() => setOpenCat(isOpen ? null : cat.id)} className="w-full flex items-center justify-between px-3 py-2 border-b border-zinc-800 hover:bg-zinc-800/40">
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="w-3 h-3 text-zinc-500" /> : <ChevronRight className="w-3 h-3 text-zinc-500" />}
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-300">{cat.label}</span>
                <span className="text-[10px] text-zinc-500">{cat.metrics.length} metrics</span>
              </div>
              <span className="text-[10px] text-zinc-500">
                {populatedMetrics.length}/{cat.metrics.length} populated
              </span>
            </button>
            {isOpen && (
              <div className="p-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
                      <th className="px-2 py-1.5">Metric</th>
                      <th className="px-2 py-1.5">
                        <Tooltip text="P = Publicly triangulable. I = Insider via syndicate. B = Both. Insider slots remain greyed until disclosed via the syndicate.">
                          <span className="inline-flex items-center gap-1 cursor-help underline decoration-dotted decoration-zinc-700">
                            Src
                            <HelpCircle className="w-2.5 h-2.5 text-zinc-600" />
                          </span>
                        </Tooltip>
                      </th>
                      <th className="px-2 py-1.5">Current</th>
                      <th className="px-2 py-1.5">Conf</th>
                      <th className="px-2 py-1.5">Updated</th>
                      <th className="px-2 py-1.5">Benchmark ({stage})</th>
                      <th className="px-2 py-1.5">Status</th>
                      <th className="px-2 py-1.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMetrics.map(m => {
                      const latest = latestByMetric[m.id];
                      const isInsiderOnly = m.source === 'I';
                      const undisclosed = isInsiderOnly && !latest;
                      const status = latest ? (latest.direction === 'up' ? 'above' : latest.direction === 'down' ? 'below' : 'inline') : 'unknown';
                      return (
                        <tr key={m.id} className={`border-b border-zinc-900 ${undisclosed ? 'opacity-50' : 'hover:bg-zinc-800/30'}`}>
                          <td className="px-2 py-2 font-mono text-zinc-200">
                            <Tooltip text={`${m.why} · Typical benchmark: ${m.benchmark}`}>
                              <span className="cursor-help underline decoration-dotted decoration-zinc-700">{m.label}</span>
                            </Tooltip>
                          </td>
                          <td className="px-2 py-2"><SourceTag value={m.source} alwaysShow /></td>
                          <td className="px-2 py-2 font-mono text-zinc-300">
                            {latest ? (
                              latest.rangeLow && latest.rangeHigh
                                ? `${latest.rangeLow}–${latest.rangeHigh} ${latest.unit || ''}`
                                : `${latest.value || '—'} ${latest.unit || ''}`
                            ) : (
                              undisclosed
                                ? <span className="text-zinc-600 italic">awaiting syndicate disclosure</span>
                                : <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2">{latest && <ConfidenceBadge value={latest.confidence} alwaysShow />}</td>
                          <td className="px-2 py-2 text-zinc-500 font-mono text-[11px]">{latest?.date || '—'}</td>
                          <td className="px-2 py-2 text-zinc-500 text-[11px]">{m.benchmark}</td>
                          <td className="px-2 py-2"><StatusDot status={status} /></td>
                          <td className="px-2 py-2 text-right">
                            <button onClick={() => onAddObservation({ frameworkCategory: cat.id, metricId: m.id, label: m.label, sourceType: m.source === 'B' ? 'P' : m.source })}
                              className="text-[10px] text-cyan-500 hover:text-cyan-400 inline-flex items-center gap-1">
                              <Plus className="w-3 h-3" />Log
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {pendingMetrics.length > 0 && populatedMetrics.length > 0 && (
                  <button
                    onClick={() => setShowPendingByCat(prev => ({ ...prev, [cat.id]: !showPending }))}
                    className="mt-2 w-full text-[10px] text-zinc-500 hover:text-cyan-400 inline-flex items-center justify-center gap-1 py-1.5 border border-dashed border-zinc-800 rounded hover:border-zinc-700">
                    {showPending
                      ? <><ChevronDown className="w-3 h-3 rotate-180" /> Hide {pendingMetrics.length} pending {pendingMetrics.length === 1 ? 'metric' : 'metrics'}</>
                      : <><ChevronDown className="w-3 h-3" /> Show {pendingMetrics.length} pending {pendingMetrics.length === 1 ? 'metric' : 'metrics'} (awaiting disclosure)</>}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
