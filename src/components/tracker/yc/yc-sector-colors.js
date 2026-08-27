// Per-sector icon — single visual cue that distinguishes sectors after we
// stripped global colour. Shapes carry the meaning (server, factory, truck,
// leaf, …) and only the icon glyph itself gets a soft tint, like the bento
// reference's text-blue-500 / text-purple-500 icons.
import { Server, Bot, HeartPulse, TrendingUp, ShoppingBag, Factory, Truck, Leaf, Code2, Sparkles } from 'lucide-react';
import { biMap } from '../../../data/capitalMap.js';

export const YC_SECTOR_ICONS = {
  'AI Infrastructure':  Server,
  'AI Agents':          Bot,
  'Healthcare':         HeartPulse,
  'FinTech & Risk':     TrendingUp,
  'Commerce':           ShoppingBag,
  'Industrial':         Factory,
  'Logistics':          Truck,
  'Climate Tech':       Leaf,
  'Developer Tools':    Code2,
  'Generative Media':   Sparkles,
};

// Muted tints applied ONLY to the icon glyph stroke — single small accent
// per card, the way the reference's icon colours read on dark.
export const YC_SECTOR_ICON_COLORS = {
  'AI Infrastructure':  '#22d3ee',
  'AI Agents':          '#a78bfa',
  'Healthcare':         '#10b981',
  'FinTech & Risk':     '#f59e0b',
  'Commerce':           '#ec4899',
  'Industrial':         '#fb923c',
  'Logistics':          '#0ea5e9',
  'Climate Tech':       '#84cc16',
  'Developer Tools':    '#60a5fa',
  'Generative Media':   '#d946ef',
};

export function iconForSector(sector) {
  return YC_SECTOR_ICONS[sector] || null;
}

export function iconColorForSector(sector) {
  return YC_SECTOR_ICON_COLORS[sector] || '#a1a1aa';
}

// Status label, used on both the card status badge and the metadata card on
// the detail screen. A module-level table, so it uses the getter-based
// `biMap` — there is no React context around it to hold a hook.
export const YC_STATUS_LABELS = biMap({
  Active:   ['Работает', 'Operating'],
  Inactive: ['Закрылась', 'Shut down'],
  Acquired: ['Куплена', 'Acquired'],
});

// Tooltip copy that explains what each status actually means (the client
// found a bare "Активна" ambiguous).
export const YC_STATUS_HINTS = biMap({
  Active:   ['Компания работает — не закрылась и не куплена', 'The company is operating — neither shut down nor acquired'],
  Inactive: ['Компания прекратила работу', 'The company has ceased operations'],
  Acquired: ['Компанию купили', 'The company was acquired'],
});

// Hover-only dot texture — fine 4px grid, white at 2.5% alpha (matches the
// `bg-[length:4px_4px]` radial-gradient pattern from the reference). Apply
// as an absolute-positioned overlay with `opacity` transitioning 0 → 1.
export const HOVER_DOT_TEXTURE = {
  backgroundImage:
    'radial-gradient(circle at center, rgba(255,255,255,0.025) 1px, transparent 1px)',
  backgroundSize: '4px 4px',
};
