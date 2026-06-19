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

// Subtle dotted background texture — applied to each company card so the
// surface has some depth without resorting to colour. The dot is white
// at 3.5% alpha over the card's flat #18181b base.
export const CARD_TEXTURE = {
  backgroundColor: '#18181b',
  backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
  backgroundSize: '14px 14px',
  backgroundPosition: '0 0',
};
