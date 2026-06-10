// The boxed-card primitive used across all Tracker tabs.
// Monolith lines 3440–3487. Switches between bento and legacy variants
// based on the `window.__BENTO__` flag set by the build script.

import { IconChip, StatusPill, TagChip, CornerBrackets, IS_BENTO } from './chrome.jsx';

export default function Panel({
  title, subtitle, icon: Icon, right, children, dense = false,
  status, statusTone, tags, accent = 'neutral', gridTexture = false,
  brackets = false, meta,
}) {
  if (IS_BENTO) {
    return (
      <div className={`relative bg-zinc-900 border border-zinc-800 rounded-xl ${gridTexture ? 'bento-grid-tex' : ''} overflow-hidden`}>
        {brackets && <CornerBrackets />}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-start gap-3">
            {Icon && <IconChip icon={Icon} accent={accent} size="md" />}
            <div className="mt-0.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                <div className="text-[15px] font-semibold tracking-tight text-zinc-100 leading-tight">{title}</div>
                {meta && <span className="text-[11px] text-zinc-500 font-mono">{meta}</span>}
              </div>
              {subtitle && <div className="text-[12px] text-zinc-400 mt-1 leading-snug">{subtitle}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {status && <StatusPill tone={statusTone || 'neutral'}>{status}</StatusPill>}
            {right}
          </div>
        </div>
        <div className={dense ? 'px-5 pb-5' : 'px-5 pb-5'}>{children}</div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 pb-5">
            {tags.map((t, i) => <TagChip key={i}>{t}</TagChip>)}
          </div>
        )}
      </div>
    );
  }
  // Legacy (non-bento) layout — preserved exactly
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded">
      <div className="flex items-start justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-start gap-2.5">
          {Icon && <Icon className="w-[18px] h-[18px] text-zinc-400 mt-0.5" strokeWidth={1.5} />}
          <div>
            <div className="text-[14px] font-medium tracking-wide text-zinc-200 leading-tight">{title}</div>
            {subtitle && <div className="text-[11px] text-zinc-500 mt-1 leading-snug">{subtitle}</div>}
          </div>
        </div>
        {right}
      </div>
      <div className={dense ? 'p-2' : 'p-3'}>{children}</div>
    </div>
  );
}
