// Badges + the inline Tooltip + Sparkline + TrendDelta + StatusDot.
// Ported from monolith lines 3221–3338. ConfidenceBadge / SourceTag respect
// the PRESENTATION_MODE build flag.

import { useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

import { PRESENTATION_MODE } from '../../../lib/build-flags.js';
import optionsJson from '../../../data/options.json';
import confidenceTooltipsJson from '../../../data/confidence-tooltips.json';
import sourceTypeTooltipsJson from '../../../data/source-type-tooltips.json';

const { CONFIDENCE_OPTIONS, SOURCE_TYPE_OPTIONS } = optionsJson;
const CONFIDENCE_TOOLTIPS = confidenceTooltipsJson;
const SOURCE_TYPE_TOOLTIPS = sourceTypeTooltipsJson;

export function ConfidenceBadge({ value, alwaysShow = false }) {
  if (PRESENTATION_MODE && !alwaysShow) return null;
  const opt = CONFIDENCE_OPTIONS.find(o => o.value === value);
  if (!opt) return null;
  return (
    <span
      title={CONFIDENCE_TOOLTIPS[value] || opt.label}
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border rounded-sm cursor-help ${opt.color}`}
    >{opt.label}</span>
  );
}

export function SourceTag({ value, alwaysShow = false }) {
  if (PRESENTATION_MODE && !alwaysShow) return null;
  const opt = SOURCE_TYPE_OPTIONS.find(o => o.value === value);
  if (!opt) return null;
  return (
    <span
      title={SOURCE_TYPE_TOOLTIPS[value] || opt.label}
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border rounded-sm cursor-help ${opt.color}`}
    >{opt.value}</span>
  );
}

export function MemoBadge({ obs }) {
  if (!obs || !obs.memo) return null;
  const tip = `Source: ${obs.sourceTool || 'Toloka Memo'}\nAs of: ${obs.date}\nIngested: ${(obs.ingestedAt || obs.createdAt || '').slice(0, 10)}\nConfidence: ${obs.confidence || 'high'}\n${obs.notes ? '— ' + obs.notes.slice(0, 200) + (obs.notes.length > 200 ? '…' : '') : ''}`;
  return (
    <span
      title={tip}
      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border rounded-sm bg-amber-900/40 text-amber-300 border-amber-700"
    >M</span>
  );
}

export function StaleTag({ days, threshold }) {
  if (days == null || days <= threshold) return null;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-sm">
      <Clock className="w-2.5 h-2.5" />
      Stale {days}d
    </span>
  );
}

export function StatusDot({ status }) {
  const map = {
    above: { c: 'bg-emerald-500', sym: '✓' },
    inline: { c: 'bg-sky-500', sym: '◯' },
    below: { c: 'bg-rose-500', sym: '✗' },
    unknown: { c: 'bg-zinc-700', sym: '—' },
  };
  const s = map[status] || map.unknown;
  return <span className={`inline-block w-2 h-2 rounded-full ${s.c}`} title={status} />;
}

export function TrendDelta({ value, suffix = '%' }) {
  if (value == null || isNaN(value)) return <span className="text-zinc-600">—</span>;
  const Icon = value > 0.1 ? TrendingUp : value < -0.1 ? TrendingDown : Minus;
  const color = value > 0.1 ? 'text-emerald-400' : value < -0.1 ? 'text-rose-400' : 'text-zinc-500';
  const sign = value > 0 ? '+' : '';
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs ${color}`}>
      <Icon className="w-3 h-3" />
      {sign}{value.toFixed(1)}{suffix}
    </span>
  );
}

export function Sparkline({ data, dataKey = 'value', height = 28, color = '#22d3ee' }) {
  if (!data || data.length < 2) {
    return <div className="text-[10px] text-zinc-600 italic h-7 flex items-center">Insufficient history — trend unavailable</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Inline-styled tooltip — survives Tailwind CDN JIT cold-load (monolith
// comment: "Tailwind being ready can be 1-2s late on a cold Netlify load").
export function Tooltip({ text, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      {children}
      <span
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          left: 0,
          top: '100%',
          marginTop: 4,
          zIndex: 50,
          display: open ? 'block' : 'none',
          width: 256,
          padding: 8,
          fontSize: 11,
          lineHeight: 1.4,
          background: '#18181b',
          border: '1px solid #3f3f46',
          color: '#d4d4d8',
          borderRadius: 4,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.4)',
        }}>
        {text}
      </span>
    </span>
  );
}
