// Single source of truth for sector → accent colour. Chosen so each is
// distinct, none clash with the YC orange used in the detail hero batch
// pill, and the semantic ties feel right (emerald for health, amber for
// money, cyan for infra, etc.). Cards, chips and pills all import from
// here so swapping a colour propagates everywhere.
export const YC_SECTOR_COLORS = {
  'AI Infrastructure':  '#22D3EE',  // cyan
  'AI Agents':          '#a78bfa',  // violet
  'Healthcare':         '#10b981',  // emerald
  'FinTech & Risk':     '#f59e0b',  // amber
  'Commerce':           '#ec4899',  // pink
  'Industrial':         '#fb923c',  // orange
  'Logistics':          '#0ea5e9',  // sky
  'Climate Tech':       '#84cc16',  // lime
  'Developer Tools':    '#60a5fa',  // blue
  'Generative Media':   '#d946ef',  // fuchsia
};

export const YC_SECTOR_FALLBACK = '#71717a';  // muted zinc for any unknown sector

export function colorForSector(sector) {
  return YC_SECTOR_COLORS[sector] || YC_SECTOR_FALLBACK;
}
