import React from 'react';
import { Info } from 'lucide-react';
import { IS_BENTO } from '../shared/chrome.jsx';

export default function KPI({ label, value, sub, accent, labelHint }) {
  const accentStyle = {
    emerald: 'bg-emerald-950/30 border-emerald-900/50',
    rose:    'bg-rose-950/30 border-rose-900/50',
    amber:   'bg-amber-950/30 border-amber-900/50',
    cyan:    'bg-cyan-950/30 border-cyan-900/50',
  }[accent] || 'bg-zinc-900 border-zinc-800';

  // Allow a dotted qualifier in the label (e.g. "ARR · Feb 2026") to render as
  // a smaller faded suffix so the main label dominates.
  const parts = typeof label === 'string' && label.includes('·')
    ? label.split('·').map(s => s.trim())
    : [label, null];
  const mainLabel = parts[0];
  const labelQualifier = parts[1];

  if (IS_BENTO) {
    return (
      <div className={`${accentStyle} border rounded-xl p-5`}>
        <div className="flex items-baseline gap-1.5 mb-2.5" title={labelHint}>
          <span className="text-[10.5px] uppercase tracking-[0.08em] text-zinc-400 font-mono">{mainLabel}</span>
          {labelQualifier && (
            <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-mono">· {labelQualifier}</span>
          )}
          {labelHint && <Info className="inline-block w-2.5 h-2.5 ml-0.5 text-zinc-600 align-middle cursor-help" />}
        </div>
        <div className="text-[30px] leading-none text-zinc-50 font-semibold tracking-tight" style={{ fontVariantNumeric: 'tabular-nums', fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace" }}>{value}</div>
        {sub && <div className="text-[11.5px] text-zinc-500 mt-2.5 leading-snug">{sub}</div>}
      </div>
    );
  }
  return (
    <div className={`${accentStyle} border rounded-lg p-3.5`}>
      <div className="flex items-baseline gap-1.5 mb-1.5" title={labelHint}>
        <span className="text-[11px] uppercase tracking-wider text-zinc-300 font-semibold">{mainLabel}</span>
        {labelQualifier && (
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-normal">· {labelQualifier}</span>
        )}
        {labelHint && <Info className="inline-block w-2.5 h-2.5 ml-0.5 text-zinc-600 align-middle cursor-help" />}
      </div>
      <div className="text-[28px] leading-none text-zinc-50 font-semibold tracking-tight" style={{ fontVariantNumeric: 'tabular-nums', fontFamily: "'Inter', 'system-ui', sans-serif" }}>{value}</div>
      {sub && <div className="text-[11px] text-zinc-500 mt-2 leading-snug">{sub}</div>}
    </div>
  );
}
