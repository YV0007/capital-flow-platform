// Tracker chrome atoms — IconChip / StatusPill / TagChip / ConfidenceDots /
// CornerBrackets / StatusBadge / VerdictBadge. Ported from monolith
// lines 3346–3638. Together with shared/badges.jsx and shared/Panel.jsx
// these compose the boxed-card primitive vocabulary used across all tabs.

import { CheckCircle2, AlertCircle, AlertTriangle, HelpCircle } from 'lucide-react';

// Global bento-variant flag set by build script on window. Kept as a constant
// here so server-render and first paint behave identically to the monolith.
export const IS_BENTO = typeof window !== 'undefined' && window.__BENTO__ === true;

export function IconChip({ icon: Icon, accent = 'neutral', size = 'md' }) {
  if (!Icon) return null;
  const sizes = {
    sm: { box: 'w-6 h-6',  icon: 'w-3 h-3' },
    md: { box: 'w-8 h-8',  icon: 'w-[15px] h-[15px]' },
    lg: { box: 'w-10 h-10', icon: 'w-[18px] h-[18px]' },
  }[size] || { box: 'w-8 h-8', icon: 'w-[15px] h-[15px]' };
  const tone = {
    neutral: 'bg-white/[0.04] border-white/[0.05] text-zinc-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/15 text-emerald-300',
    rose:    'bg-rose-500/10 border-rose-500/15 text-rose-300',
    amber:   'bg-amber-500/10 border-amber-500/15 text-amber-300',
    cyan:    'bg-cyan-500/10 border-cyan-500/15 text-cyan-300',
    violet:  'bg-violet-500/10 border-violet-500/15 text-violet-300',
  }[accent] || 'bg-white/[0.04] border-white/[0.05] text-zinc-300';
  return (
    <div className={`${sizes.box} rounded-md border ${tone} flex items-center justify-center shrink-0`}>
      <Icon className={sizes.icon} strokeWidth={1.75} />
    </div>
  );
}

export function StatusPill({ children, tone = 'neutral' }) {
  if (!children) return null;
  const tones = {
    neutral: 'text-zinc-400 bg-white/[0.04] border-white/[0.05]',
    live:    'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    active:  'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    updated: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
    beta:    'text-amber-300 bg-amber-500/10 border-amber-500/20',
    memo:    'text-violet-300 bg-violet-500/10 border-violet-500/20',
    seeded:  'text-zinc-300 bg-white/[0.05] border-white/[0.08]',
    verified:'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  }[tone.toLowerCase()] || 'text-zinc-400 bg-white/[0.04] border-white/[0.05]';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${tones} text-[9.5px] uppercase tracking-wider font-mono`}>
      {children}
    </span>
  );
}

export function TagChip({ children, prefix = '#' }) {
  if (!children) return null;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[10.5px] text-zinc-400 lowercase border border-white/[0.04]">
      {prefix}{children}
    </span>
  );
}

export function ConfidenceDots({ value }) {
  let filled = 0;
  let tone = 'bg-zinc-600';
  if (typeof value === 'number') {
    filled = value >= 0.66 ? 3 : value >= 0.33 ? 2 : 1;
    tone = filled === 3 ? 'bg-emerald-400' : filled === 2 ? 'bg-amber-400' : 'bg-zinc-500';
  } else if (typeof value === 'string') {
    const v = value.toLowerCase();
    if (v === 'high')      { filled = 3; tone = 'bg-emerald-400'; }
    else if (v === 'med' || v === 'medium') { filled = 2; tone = 'bg-amber-400'; }
    else if (v === 'low')  { filled = 1; tone = 'bg-zinc-500'; }
  }
  return (
    <span className="inline-flex items-center gap-0.5" title={`confidence: ${value}`}>
      {[0,1,2].map(i => (
        <span key={i} className={`w-1 h-1 rounded-full ${i < filled ? tone : 'bg-white/10'}`}></span>
      ))}
    </span>
  );
}

export function CornerBrackets({ size = 12, opacity = 0.2, color = '#ffffff' }) {
  const arm = size;
  const stroke = 1;
  const Bracket = ({ style }) => (
    <svg width={arm} height={arm} className="absolute" style={style} fill="none" viewBox={`0 0 ${arm} ${arm}`}>
      <path d={`M 0 ${arm * 0.4} L 0 0 L ${arm * 0.4} 0`} stroke={color} strokeOpacity={opacity} strokeWidth={stroke} />
    </svg>
  );
  return (
    <>
      <Bracket style={{ top: 6, left: 6 }} />
      <Bracket style={{ top: 6, right: 6, transform: 'scaleX(-1)' }} />
      <Bracket style={{ bottom: 6, left: 6, transform: 'scaleY(-1)' }} />
      <Bracket style={{ bottom: 6, right: 6, transform: 'scale(-1,-1)' }} />
    </>
  );
}

export function StatusBadge({ status }) {
  const map = {
    breakout:        { label: 'Breakout',        c: 'bg-emerald-900 text-emerald-300 border-emerald-700' },
    on_track:        { label: 'On Track',        c: 'bg-sky-900 text-sky-300 border-sky-700' },
    mixed:           { label: 'Mixed',           c: 'bg-amber-900 text-amber-300 border-amber-700' },
    underperforming: { label: 'Underperforming', c: 'bg-rose-900 text-rose-300 border-rose-700' },
    low_coverage:    { label: 'Low Coverage',    c: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  };
  const s = map[status] || map.low_coverage;
  return <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border rounded ${s.c}`}>{s.label}</span>;
}

export function VerdictBadge({ verdict }) {
  const map = {
    confirmed:     { label: 'Confirmed',     c: 'bg-emerald-900 text-emerald-300 border-emerald-700', icon: CheckCircle2 },
    mixed:         { label: 'Mixed',         c: 'bg-amber-900 text-amber-300 border-amber-700', icon: AlertCircle },
    inconsistency: { label: 'Inconsistency', c: 'bg-rose-900 text-rose-300 border-rose-700', icon: AlertTriangle },
    unconfirmed:   { label: 'Unconfirmed',   c: 'bg-amber-900 text-amber-300 border-amber-700', icon: HelpCircle },
  };
  const s = map[verdict] || map.unconfirmed;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border rounded ${s.c}`}>
      <Icon className="w-3 h-3" />{s.label}
    </span>
  );
}
