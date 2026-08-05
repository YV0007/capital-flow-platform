// Shared formatting + scale helpers for the Capital Flow Map.

/** $300B / $13.8B / $375M / $50M — compact, always prefixed. */
export function fmtUSD(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${trim(n / 1e12)}T`;
  if (abs >= 1e9)  return `$${trim(n / 1e9)}B`;
  if (abs >= 1e6)  return `$${trim(n / 1e6)}M`;
  if (abs >= 1e3)  return `$${trim(n / 1e3)}K`;
  return `$${Math.round(n)}`;
}

function trim(v) {
  // 1 decimal below 100, none above — keeps labels short but readable.
  if (Math.abs(v) >= 100) return String(Math.round(v));
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** Node radius in graph units. sqrt + tight range so no node dominates. */
export function nodeRadius(node) {
  return 3.5 + 8.5 * Math.sqrt(node.flowShare || 0);
}

/** Link stroke width. Also sqrt-scaled, with a visible floor. */
export function linkWidth(link) {
  return 0.8 + 4 * Math.sqrt(link.amountShare || 0);
}

/** Colour for the confidence chip. */
export const CONFIDENCE_META = {
  reported: { label: 'REPORTED', color: '#34D399', blurb: 'Figure was disclosed or directly reported.' },
  estimate: { label: 'ESTIMATE', color: '#F59E0B', blurb: 'Figure is assembled from analyst or press estimates.' },
};

export const STATUS_META = {
  Announced: { color: '#FBBF24' },
  Active:    { color: '#34D399' },
  Closed:    { color: '#71717a' },
};

/** Truncates long entity names for on-canvas labels. */
export function shortLabel(name, max = 22) {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}
