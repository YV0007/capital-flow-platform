// Per-sector icon — the one visual cue that distinguishes sectors after
// we stripped the colour. Shapes carry the meaning (server, factory,
// truck, leaf, …) so recognition happens at a glance without any chips
// having to scream colour.
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

export function iconForSector(sector) {
  return YC_SECTOR_ICONS[sector] || null;
}

// Card surface — vertical "lit from above" gradient (white highlight at the
// top, soft black wash at the bottom) layered under a subtle dotted texture
// so cards feel like elevated objects, matching the reference dashboard.
export const CARD_TEXTURE = {
  backgroundColor: '#18181b',
  backgroundImage: [
    'linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0) 38%, rgba(0,0,0,0.10) 100%)',
    'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1.2px)',
  ].join(', '),
  backgroundSize: 'auto, 14px 14px',
  backgroundPosition: '0 0, 0 0',
  backgroundRepeat: 'no-repeat, repeat',
};

// Optional inset top-rim highlight — pair with the gradient above by adding
// it to a card's `boxShadow` to mimic the reference's edge-lit corners.
export const CARD_RIM_SHADOW =
  '0 2px 10px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.04) inset';
export const CARD_RIM_SHADOW_HOVER =
  '0 10px 28px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.06) inset';
