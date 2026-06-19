// Per-sector icon — single visual cue that distinguishes sectors after we
// stripped global colour. Shapes carry the meaning (server, factory, truck,
// leaf, …) and only the icon glyph itself gets a soft tint, like the bento
// reference's text-blue-500 / text-purple-500 icons.
import { Server, Bot, HeartPulse, TrendingUp, ShoppingBag, Factory, Truck, Leaf, Code2, Sparkles } from 'lucide-react';

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

// Status → Russian label, used on both the card status badge and the
// metadata card on the detail screen.
export const YC_STATUS_LABELS = {
  Active:   'Активна',
  Inactive: 'Неактивна',
  Acquired: 'Куплена',
};

// Card surface — always-on. The card sits visibly above the page bg via
// (a) a lighter base colour, (b) a soft top→bottom lighting gradient, and
// (c) a low-alpha dotted texture at the same 4px grid as the reference.
export const CARD_BASE = {
  backgroundColor: '#15151a',
  backgroundImage: [
    'linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0) 42%, rgba(0,0,0,0.08) 100%)',
    'radial-gradient(circle at center, rgba(255,255,255,0.020) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: 'auto, 4px 4px',
  backgroundPosition: '0 0, 0 0',
  backgroundRepeat: 'no-repeat, repeat',
};

// Extra dot layer that fades in ON TOP of the base texture when hovered —
// so dots get noticeably crisper on interaction without being absent at
// rest. Pair with `opacity: 0 → 1` on an absolutely-positioned overlay.
export const HOVER_DOT_TEXTURE = {
  backgroundImage:
    'radial-gradient(circle at center, rgba(255,255,255,0.028) 1px, transparent 1px)',
  backgroundSize: '4px 4px',
};
