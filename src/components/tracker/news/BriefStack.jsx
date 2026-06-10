import React, { useEffect, useState } from 'react';
import {
  Zap,
  Activity,
  Circle,
  X,
  DollarSign,
  Layers,
  Users,
  AlertTriangle,
  Star,
  Target,
  FileText,
  ChevronRight,
} from 'lucide-react';

import { relTime } from '../../../lib/utils.js';
import { FocusButton, FocusOverlay } from '../shared/FocusOverlay.jsx';

// Map raw importance → 3-tier severity model used by the tiles
export function severityFromImportance(importance) {
  const k = (importance || '').toLowerCase();
  if (k === 'critical' || k === 'high') return { tier: 'HIGH'   };
  if (k === 'medium')                   return { tier: 'MEDIUM' };
  return                                       { tier: 'LOW'    };
}

// Heuristic bull/bear direction from whyItMatters text
export function directionFromWhy(text) {
  if (!text) return { arrow: '—', sentiment: 'neutral' };
  const t = text.toLowerCase();
  const bear = /(risk|threat|concern|decline|loss|churn|squeeze|dependency|expos|vulnerab|undercut|miss|short ?fall|head ?wind|weak)/.test(t);
  const bull = /(growth|exceed|secur|dominate|expand|momentum|catalyst|resets|floor|tail ?wind|strong|beat|surpass|breakthrough|outperform)/.test(t);
  if (bear && !bull) return { arrow: '▼', sentiment: 'bear' };
  if (bull && !bear) return { arrow: '▲', sentiment: 'bull' };
  return { arrow: '—', sentiment: 'neutral' };
}

// Heuristic category from headline + whyItMatters keywords
export const CATEGORY_RULES = [
  { id: 'funding',   label: 'Funding',     re: /(funding|raise[ds]?|series\s+[a-g]|valuat|round|pre-money|post-money)/i },
  { id: 'ma',        label: 'M&A',         re: /(acquir|acquisition|merger|buyout|takeover|option to (buy|acquire))/i },
  { id: 'product',   label: 'Product',     re: /(launch|release|ship|product|model|feature|version|composer|update)/i },
  { id: 'risk',      label: 'Risk',        re: /(risk|threat|concern|decline|loss|churn|complaint|outage|breach|departure|leave)/i },
  { id: 'team',      label: 'Team',        re: /(hir(ing|e)|headcount|cofounder|cto|ceo|cpo|executive|leadership|joins?|appoint)/i },
  { id: 'customer',  label: 'Customer',    re: /(customer|enterprise|fortune\s*\d+|adoption|paying|subscriber|user growth)/i },
  { id: 'competitive', label: 'Competitive', re: /(competitor|rival|claude code|copilot|codex|windsurf|market share|squeeze)/i },
];

export function categoryForItem(item) {
  const hay = `${item.headline || ''} ${item.whyItMatters || ''} ${item.summary || ''}`;
  for (const r of CATEGORY_RULES) {
    if (r.re.test(hay)) return r;
  }
  return null;
}

export const CATEGORY_CHIP_STYLE = {
  funding:     'bg-emerald-950/40 border-emerald-900/50 text-emerald-300',
  ma:          'bg-violet-950/40  border-violet-900/50  text-violet-300',
  product:     'bg-sky-950/40     border-sky-900/50     text-sky-300',
  risk:        'bg-rose-950/40    border-rose-900/50    text-rose-300',
  team:        'bg-amber-950/40   border-amber-900/50   text-amber-300',
  customer:    'bg-cyan-950/40    border-cyan-900/50    text-cyan-300',
  competitive: 'bg-fuchsia-950/40 border-fuchsia-900/50 text-fuchsia-300',
};

// Client-side parsing for the metadata chips (Funding / Series / $ amount / valuation / investors)
export function deriveMetadataChips(item) {
  const text = `${item.headline || ''} ${item.summary || ''} ${item.whyItMatters || ''}`;
  const chips = [];
  const seen = new Set();
  const push = (label, opts = {}) => {
    if (seen.has(label)) return;
    seen.add(label);
    chips.push({ label, ...opts });
  };

  // Series A-G
  const series = text.match(/Series\s+([A-G])\b/i);
  if (series) push(`Series ${series[1].toUpperCase()}`);

  // Dollar amounts ($2B, $100M, $50B, $6B+, $1.5B)
  const dollarRe = /\$\s*(\d+(?:\.\d+)?)\s*([BMK])\b\+?/gi;
  let m;
  const dollarsSeen = new Set();
  while ((m = dollarRe.exec(text)) !== null) {
    const norm = `$${m[1]}${m[2].toUpperCase()}`;
    if (dollarsSeen.has(norm)) continue;
    dollarsSeen.add(norm);
    push(norm, { mono: true });
    if (dollarsSeen.size >= 3) break;  // cap at 3 dollar chips per tile
  }

  // Valuation marker (@$50B)
  const valMatch = text.match(/(?:valuation|post-money|pre-money)[^$]{0,40}\$\s*(\d+(?:\.\d+)?)\s*([BMK])/i);
  if (valMatch) push(`@$${valMatch[1]}${valMatch[2].toUpperCase()}`, { mono: true });

  // Star ratings (1.7/5, 4.7/5)
  const ratingRe = /(\d\.\d)\s*\/\s*5/g;
  while ((m = ratingRe.exec(text)) !== null) {
    push(`${m[1]}/5`, { mono: true });
  }

  // Percentages (60%, 36%, 70%)
  const pctRe = /(\d{1,3})\s*%/g;
  let pctCount = 0;
  while ((m = pctRe.exec(text)) !== null && pctCount < 2) {
    push(`${m[1]}%`, { mono: true });
    pctCount++;
  }

  // Investor names — look for "led by X[, Y]" or "co-led by X and Y"
  const investorMatch = text.match(/(?:co-)?led by\s+([A-Z][a-zA-Z0-9 &.]+?(?:\s+(?:and|,)\s+[A-Z][a-zA-Z0-9 &.]+?)?)(?:\s*[,.]|\s+with)/);
  if (investorMatch) {
    const cleaned = investorMatch[1].replace(/\s+and\s+/g, ' · ').replace(/,\s*/g, ' · ').trim();
    if (cleaned.length < 50) push(cleaned);
  }

  return chips;
}

// ────────────────────────────────────────────────────────────────
// SeverityChip — icon + tier label + bull/bear arrow
// ────────────────────────────────────────────────────────────────
export const SEVERITY_TIER_STYLE = {
  HIGH:   { text: 'text-amber-300',  icon: 'zap',    iconColor: 'text-amber-400' },
  MEDIUM: { text: 'text-zinc-300',   icon: 'wave',   iconColor: 'text-zinc-400'  },
  LOW:    { text: 'text-zinc-500',   icon: 'circle', iconColor: 'text-zinc-600'  },
};

function SeverityIcon({ kind, className }) {
  if (kind === 'zap')    return <Zap className={className} fill="currentColor" />;
  if (kind === 'wave')   return <Activity className={className} />;
  if (kind === 'circle') return <Circle className={className} />;
  return null;
}

function SeverityChip({ severity, direction }) {
  const style = SEVERITY_TIER_STYLE[severity.tier] || SEVERITY_TIER_STYLE.LOW;
  const arrowStyle = {
    bull:    'text-emerald-400',
    bear:    'text-rose-400',
    neutral: 'text-zinc-600',
  }[direction.sentiment];
  return (
    <span className="inline-flex items-center gap-1.5">
      <SeverityIcon kind={style.icon} className={`w-3.5 h-3.5 ${style.iconColor}`} />
      <span className={`text-[10px] uppercase tracking-[0.12em] font-mono font-semibold ${style.text}`}>{severity.tier} SIGNAL</span>
      <span className={`text-[11px] leading-none font-mono ${arrowStyle}`}>{direction.arrow}</span>
    </span>
  );
}

// ────────────────────────────────────────────────────────────────
// SourcePill — favicon + name, with letter-circle fallback
// ────────────────────────────────────────────────────────────────
function SourcePill({ source }) {
  const [iconFailed, setIconFailed] = useState(false);
  let hostname = null;
  try { hostname = new URL(source.url).hostname.replace(/^www\./, ''); } catch {}
  const initial = (source.name || hostname || '?').trim().charAt(0).toUpperCase();
  const iconUrl = hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32` : null;

  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-700/60 text-zinc-300 hover:text-cyan-200 rounded transition-colors group">
      {iconUrl && !iconFailed ? (
        <img src={iconUrl} alt="" width="14" height="14" className="rounded-sm" onError={() => setIconFailed(true)} />
      ) : (
        <span className="w-3.5 h-3.5 rounded-sm bg-cyan-900 text-cyan-200 text-[9px] font-mono font-semibold inline-flex items-center justify-center">{initial}</span>
      )}
      <span className="text-[11px] font-medium">{source.name}</span>
    </a>
  );
}

// ────────────────────────────────────────────────────────────────
// MetadataChips — derived from headline+summary
// ────────────────────────────────────────────────────────────────
function MetadataChips({ chips, category }) {
  if (!category && (!chips || chips.length === 0)) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {category && (
        <span className={`text-[10px] px-1.5 py-0.5 border rounded font-medium uppercase tracking-wide ${CATEGORY_CHIP_STYLE[category.id] || 'bg-zinc-900 border-zinc-800 text-zinc-300'}`}>
          {category.label}
        </span>
      )}
      {chips.map((c, i) => (
        <span key={i}
          className={`text-[11px] px-1.5 py-0.5 border border-zinc-800 bg-zinc-900 text-zinc-300 rounded ${c.mono ? 'font-mono font-semibold tracking-tight' : ''}`}>
          {c.label}
        </span>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// BriefTile — one news item, fully expanded
// ────────────────────────────────────────────────────────────────
function BriefTileBody({ item, severity, direction, category, chips, dateRel, dateTitle, onRemove, onFocus, focused = false, hideRemove = false }) {
  // In inline (non-focused) mode, summary is truncated to first sentence
  // and "why it matters" gets a line-clamp. Full prose only in focus.
  const previewSummary = (text) => {
    if (!text || focused) return text;
    // First sentence: split on period/!/? followed by space or end
    const match = text.match(/^[^.!?]+[.!?](?=\s|$)/);
    return match ? match[0] : text;
  };

  return (
    <>
      {/* Row 1: severity tier + arrow + date + focus button + remove */}
      <div className="flex items-center gap-2 mb-3">
        <SeverityChip severity={severity} direction={direction} />
        <div className="ml-auto flex items-center gap-2">
          {dateRel && (
            <span title={dateTitle} className="text-[10px] text-zinc-500 font-mono">{dateRel}</span>
          )}
          {item.isManual && <span className="text-[9px] text-amber-400 font-mono">manual</span>}
          {!focused && onFocus && (
            <FocusButton onClick={onFocus} />
          )}
          {onRemove && !hideRemove && (
            <button onClick={onRemove} title="Remove" className={`${focused ? 'opacity-100' : 'opacity-0 group-hover/tile:opacity-100'} text-[10px] p-0.5 bg-rose-950/60 text-rose-300 border border-rose-800 rounded transition-opacity`}>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Headline */}
      <div className={`${focused ? 'text-[22px]' : 'text-[17px]'} text-zinc-50 font-semibold leading-snug mb-1`}>
        {item.headline}
      </div>

      {/* Row 3: chips — full set in focus, trimmed in preview */}
      <MetadataChips chips={focused ? chips : chips.slice(0, 3)} category={category} />

      {/* Row 4: summary body */}
      {item.summary && (
        <div className={`${focused ? 'text-[15px]' : 'text-[13px]'} text-zinc-400 leading-relaxed mt-3`}>
          {previewSummary(item.summary)}
        </div>
      )}

      {/* Row 5: why it matters — focus mode only (collapsed in preview) */}
      {focused && item.whyItMatters && (
        <div className="mt-3 pl-3 border-l-2 border-cyan-800/60">
          <div className="text-[9px] uppercase tracking-wider text-cyan-500 font-mono font-semibold mb-0.5">Why it matters</div>
          <div className="text-[14.5px] text-cyan-200/90 leading-relaxed">{item.whyItMatters}</div>
        </div>
      )}

      {/* Row 6: sources — focus mode only */}
      {focused && item.sources && item.sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto pt-4 items-center">
          {item.sources.map((s, i) => <SourcePill key={i} source={s} />)}
        </div>
      )}
    </>
  );
}

function BriefTile({ item, onRemove, spanFull = false }) {
  const severity = severityFromImportance(item.importance);
  const direction = directionFromWhy(item.whyItMatters || item.summary);
  const category = categoryForItem(item);
  const chips = deriveMetadataChips(item);
  const dateRel = item.date ? relTime(new Date(item.date).getTime()) : null;
  const dateTitle = item.date || '';
  const [focused, setFocused] = useState(false);

  const bodyProps = { item, severity, direction, category, chips, dateRel, dateTitle, onRemove };

  return (
    <>
      <div className={`relative bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors flex flex-col h-full group/tile shadow-sm ${spanFull ? 'lg:col-span-2' : ''}`}>
        <BriefTileBody {...bodyProps} onFocus={() => setFocused(true)} />
      </div>
      <FocusOverlay open={focused} onClose={() => setFocused(false)} title={`Brief Item · ${severity.tier} Signal`}>
        <BriefTileBody {...bodyProps} focused hideRemove />
      </FocusOverlay>
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// BriefStack — card stack carousel
// Shows 3 cards visible at a time. Top card is the active one.
// Next/Prev cycles through items. Each card has category stripe, headline,
// summary, metadata chips, and an "Open" button that triggers focus mode.
// Uses CSS transforms (no framer-motion).
// ────────────────────────────────────────────────────────────────
export const CATEGORY_STRIPE = {
  funding:     'from-emerald-500 to-emerald-700',
  ma:          'from-violet-500 to-violet-700',
  product:     'from-cyan-500 to-cyan-700',
  team:        'from-amber-500 to-amber-700',
  risk:        'from-rose-500 to-rose-700',
  customer:    'from-sky-500 to-sky-700',
  competitive: 'from-fuchsia-500 to-fuchsia-700',
  other:       'from-zinc-500 to-zinc-700',
};

// Hero gradient styled with deeper, darker variants so headline text stays readable
export const CATEGORY_HERO = {
  funding:     'from-emerald-900/70 via-emerald-950/40 to-zinc-950',
  ma:          'from-violet-900/70  via-violet-950/40  to-zinc-950',
  product:     'from-cyan-900/70    via-cyan-950/40    to-zinc-950',
  team:        'from-amber-900/70   via-amber-950/40   to-zinc-950',
  risk:        'from-rose-900/70    via-rose-950/40    to-zinc-950',
  customer:    'from-sky-900/70     via-sky-950/40     to-zinc-950',
  competitive: 'from-fuchsia-900/70 via-fuchsia-950/40 to-zinc-950',
  other:       'from-zinc-800       via-zinc-900       to-zinc-950',
};

export const CATEGORY_ICON = {
  funding:     DollarSign,
  ma:          Layers,
  product:     Activity,
  team:        Users,
  risk:        AlertTriangle,
  customer:    Star,
  competitive: Target,
  other:       FileText,
};

function BriefStack({ items, onRemove }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [focusedItem, setFocusedItem] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const total = items.length;

  // Listen for App-level modal open/close events so we can disable the
  // card's CSS transforms while the modal is shown — transforms create a
  // containing block that breaks `position: fixed`, even with createPortal,
  // particularly on cold Netlify loads.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOpen = () => setModalIsOpen(true);
    const onClose = () => setModalIsOpen(false);
    window.addEventListener('brief-focus-open', onOpen);
    window.addEventListener('brief-focus-close', onClose);
    return () => {
      window.removeEventListener('brief-focus-open', onOpen);
      window.removeEventListener('brief-focus-close', onClose);
    };
  }, []);

  if (total === 0) return null;

  const next = () => setActiveIdx((i) => (i + 1) % total);
  const prev = () => setActiveIdx((i) => (i - 1 + total) % total);

  // Build the visible 3-stack: [active, active+1, active+2] (with wrap)
  const visible = [0, 1, 2].map(offset => {
    const idx = (activeIdx + offset) % total;
    return { item: items[idx], offset };
  });

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden flex items-end justify-center mb-3" style={{ height: 440 }}>
        {visible.slice().reverse().map(({ item, offset }) => {
          const severity  = severityFromImportance(item.importance);
          const direction = directionFromWhy(item.whyItMatters || item.summary);
          const category  = categoryForItem(item);
          const catId     = category?.id || 'other';
          const chips     = deriveMetadataChips(item);
          const dateRel   = item.date ? relTime(new Date(item.date).getTime()) : null;
          const stripe    = CATEGORY_STRIPE[catId] || CATEGORY_STRIPE.other;
          const heroGrad  = CATEGORY_HERO[catId]   || CATEGORY_HERO.other;
          const CatIcon   = CATEGORY_ICON[catId]   || CATEGORY_ICON.other;

          // Stack positioning: offset 0 = front (largest), 1 = mid, 2 = back
          const transforms = [
            { y: 0,   scale: 1,    z: 30, opacity: 1   },  // top card
            { y: -20, scale: 0.95, z: 20, opacity: 0.65 },  // second
            { y: -40, scale: 0.90, z: 10, opacity: 0.35 },  // third
          ][offset] || { y: -40, scale: 0.90, z: 10, opacity: 0.35 };

          const isTop = offset === 0;

          return (
            <div
              key={`${item.id || item.headline}-${activeIdx}-${offset}`}
              className="absolute left-1/2 bottom-0 w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-500 ease-out"
              style={{
                transform: modalIsOpen ? 'translateX(-50%)' : `translateX(-50%) translateY(${transforms.y}px) scale(${transforms.scale})`,
                zIndex: transforms.z,
                opacity: modalIsOpen && offset !== 0 ? 0 : transforms.opacity,
                height: '400px',
                visibility: modalIsOpen && offset !== 0 ? 'hidden' : 'visible',
              }}
            >
              {/* HERO PANEL — gradient background + category icon watermark + label pill */}
              <div className={`relative w-full bg-gradient-to-br ${heroGrad} overflow-hidden`} style={{ height: 160 }}>
                {/* Category stripe at very top */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stripe}`}></div>

                {/* Giant category icon as watermark, lower-right */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.12]">
                  <CatIcon className="w-40 h-40 text-white" strokeWidth={1.5} />
                </div>

                {/* Top-left: category label pill + severity */}
                <div className="absolute top-4 left-5 right-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {category && (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] rounded ${CATEGORY_CHIP_STYLE[catId] || 'bg-zinc-900 border border-zinc-700 text-zinc-300'}`}>
                        <CatIcon className="w-3 h-3" />
                        {category.label}
                      </span>
                    )}
                    <SeverityChip severity={severity} direction={direction} />
                  </div>
                  <div className="flex items-center gap-2">
                    {dateRel && <span className="text-[10px] text-zinc-400 font-mono">{dateRel}</span>}
                    {item.isManual && <span className="text-[9px] text-amber-400 font-mono">manual</span>}
                  </div>
                </div>

                {/* Headline anchored to bottom of hero */}
                <div className="absolute bottom-4 left-5 right-5">
                  <div className="text-[26px] text-zinc-50 font-semibold leading-[1.15] tracking-tight line-clamp-2">
                    {item.headline}
                  </div>
                </div>
              </div>

              {/* BODY — chips + summary + action */}
              <div className="p-5 h-[240px] flex flex-col">
                {/* Chips */}
                <MetadataChips chips={chips.slice(0, 4)} category={category} />

                {/* Summary */}
                {item.summary && (
                  <div className="text-[13.5px] text-zinc-400 leading-relaxed mt-3 line-clamp-3">
                    {item.summary}
                  </div>
                )}

                {/* Bottom action row — only on top card */}
                {isTop && (
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600 font-mono">{activeIdx + 1} / {total}</span>
                    <button
                      onClick={() => {
                        // PURE-DOM MODAL — bypasses React entirely.
                        // Reason: React/Babel pipeline on Netlify deploy has
                        // an intermittent issue rendering the React-based
                        // modal over a CSS-transformed carousel parent. This
                        // vanilla approach injects HTML directly into <body>,
                        // so it always works regardless of React state.
                        try {
                          const existing = document.getElementById('__brief_modal');
                          if (existing) existing.remove();

                          const esc = (s) => String(s == null ? '' : s)
                            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

                          const sev = severityFromImportance(item.importance);
                          const sevColor = sev.tier === 'High' ? '#fbbf24'
                                         : sev.tier === 'Medium' ? '#a3a3a3'
                                         : '#71717a';
                          const cat = categoryForItem(item) || {};
                          const catLabel = cat.label || 'Signal';
                          const dRel = item.date ? relTime(new Date(item.date).getTime()) : '';

                          const chipsHtml = (deriveMetadataChips(item) || []).slice(0, 8).map(c =>
                            '<span style="display:inline-block;padding:3px 8px;background:#27272a;' +
                            'border:1px solid #3f3f46;border-radius:4px;font-size:11px;color:#d4d4d8;' +
                            'font-family:ui-monospace,monospace;margin-right:6px;margin-bottom:4px;">' +
                            esc(c.label || c) + '</span>'
                          ).join('');

                          const sourceLink = item.url
                            ? '<a href="' + esc(item.url) + '" target="_blank" rel="noopener" ' +
                              'style="color:#67e8f9;font-size:13px;text-decoration:underline;">' +
                              'Open source ↗</a>'
                            : '';

                          const whyHtml = item.whyItMatters
                            ? '<div style="margin-top:20px;padding:16px;background:rgba(245,158,11,0.05);' +
                              'border-left:3px solid #f59e0b;border-radius:4px;">' +
                                '<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;' +
                                'color:#fbbf24;font-family:ui-monospace,monospace;margin-bottom:8px;font-weight:600;">' +
                                'Why it matters</div>' +
                                '<div style="font-size:14px;color:#e4e4e7;line-height:1.65;">' +
                                esc(item.whyItMatters) + '</div>' +
                              '</div>'
                            : '';

                          const overlay = document.createElement('div');
                          overlay.id = '__brief_modal';
                          overlay.style.cssText =
                            'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;' +
                            'background:rgba(0,0,0,0.78);backdrop-filter:blur(10px);' +
                            '-webkit-backdrop-filter:blur(10px);display:flex;' +
                            'align-items:flex-start;justify-content:center;padding:6vh 16px 16px;' +
                            'overflow-y:auto;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;' +
                            'animation:briefFadeIn 200ms ease-out;';

                          overlay.innerHTML =
                            '<style>@keyframes briefFadeIn{from{opacity:0}to{opacity:1}}' +
                            '@keyframes briefPopIn{from{opacity:0;transform:translateY(8px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}' +
                            '#__brief_modal a:hover{color:#a5f3fc !important}</style>' +
                            '<div style="position:relative;width:100%;max-width:1024px;max-height:88vh;' +
                            'overflow-y:auto;background:#18181b;border:1px solid #3f3f46;border-radius:12px;' +
                            'box-shadow:0 25px 60px -10px rgba(0,0,0,0.7);animation:briefPopIn 220ms ease-out;">' +
                              '<div style="position:sticky;top:0;display:flex;align-items:center;' +
                              'justify-content:space-between;padding:14px 22px;background:#18181b;' +
                              'border-bottom:1px solid #27272a;z-index:1;">' +
                                '<div style="display:flex;align-items:center;gap:12px;">' +
                                  '<div style="font-size:11px;font-family:ui-monospace,monospace;' +
                                  'text-transform:uppercase;letter-spacing:0.14em;color:#d4d4d8;font-weight:600;">' +
                                  esc(catLabel) + '</div>' +
                                  '<div style="width:1px;height:14px;background:#3f3f46;"></div>' +
                                  '<div style="font-size:11px;font-family:ui-monospace,monospace;' +
                                  'text-transform:uppercase;letter-spacing:0.12em;color:' + sevColor + ';font-weight:600;">' +
                                  esc(sev.tier) + ' Signal</div>' +
                                  (dRel ? '<div style="font-size:11px;color:#71717a;font-family:ui-monospace,monospace;">' + esc(dRel) + '</div>' : '') +
                                '</div>' +
                                '<button id="__brief_close" aria-label="Close" style="background:transparent;border:1px solid #3f3f46;' +
                                'color:#a1a1aa;cursor:pointer;width:28px;height:28px;border-radius:6px;' +
                                'font-size:14px;line-height:1;display:inline-flex;align-items:center;justify-content:center;' +
                                'transition:all 120ms;">✕</button>' +
                              '</div>' +
                              '<div style="padding:28px;color:#e4e4e7;">' +
                                '<div style="font-size:26px;font-weight:700;color:#fafafa;line-height:1.25;' +
                                'margin-bottom:14px;letter-spacing:-0.01em;">' +
                                  esc(item.headline || item.title || 'Untitled') +
                                '</div>' +
                                (chipsHtml ? '<div style="margin:12px 0 18px;">' + chipsHtml + '</div>' : '') +
                                (item.summary ? '<div style="font-size:14px;color:#a1a1aa;line-height:1.7;' +
                                'white-space:pre-wrap;margin-top:8px;">' + esc(item.summary) + '</div>' : '') +
                                whyHtml +
                                (sourceLink ? '<div style="margin-top:24px;padding-top:18px;border-top:1px solid #27272a;">' + sourceLink + '</div>' : '') +
                              '</div>' +
                            '</div>';

                          let prevOverflow = '';
                          const close = () => {
                            try { overlay.remove(); } catch {}
                            document.body.style.overflow = prevOverflow;
                            document.removeEventListener('keydown', onKey, true);
                          };
                          const onKey = (ev) => {
                            if (ev.key === 'Escape') {
                              ev.preventDefault();
                              ev.stopPropagation();
                              close();
                            }
                          };

                          overlay.addEventListener('click', (ev) => {
                            if (ev.target === overlay) close();
                          });

                          prevOverflow = document.body.style.overflow;
                          document.body.style.overflow = 'hidden';
                          document.body.appendChild(overlay);

                          const closeBtn = document.getElementById('__brief_close');
                          if (closeBtn) {
                            closeBtn.addEventListener('click', close);
                            closeBtn.addEventListener('mouseenter', () => {
                              closeBtn.style.background = '#27272a';
                              closeBtn.style.color = '#fafafa';
                              closeBtn.style.borderColor = '#52525b';
                            });
                            closeBtn.addEventListener('mouseleave', () => {
                              closeBtn.style.background = 'transparent';
                              closeBtn.style.color = '#a1a1aa';
                              closeBtn.style.borderColor = '#3f3f46';
                            });
                          }
                          document.addEventListener('keydown', onKey, true);
                        } catch (err) {
                          // eslint-disable-next-line no-console
                          console.error('Brief modal failed:', err);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 h-8 text-[12px] font-medium bg-zinc-100 hover:bg-white text-zinc-900 rounded-full transition-colors">
                      Open
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={prev}
          className="w-9 h-9 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 inline-flex items-center justify-center transition-colors"
          aria-label="Previous"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>

        {/* Indicator dots */}
        <div className="flex items-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === activeIdx ? 'w-6 bg-emerald-400' : 'w-1.5 bg-zinc-700 hover:bg-zinc-600'}`}
              aria-label={`Go to card ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-9 h-9 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 inline-flex items-center justify-center transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Focus overlay moved to App-level — listens for 'brief-focus-open'
          window event dispatched by the Open button. Rendering at App root
          guarantees no transformed-ancestor positioning issues. */}
    </div>
  );
}

export default BriefStack;
