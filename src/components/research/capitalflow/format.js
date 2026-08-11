// Shared formatting + scale helpers for the Capital Flow Map.

/** $300 млрд / $13.8 млрд / $375 млн — compact, always prefixed. */
export function fmtUSD(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${trim(n / 1e12)} трлн`;
  if (abs >= 1e9)  return `$${trim(n / 1e9)} млрд`;
  if (abs >= 1e6)  return `$${trim(n / 1e6)} млн`;
  if (abs >= 1e3)  return `$${trim(n / 1e3)} тыс`;
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

/**
 * Russian plural form: plural(3, ['сделка','сделки','сделок']) → 'сделки'.
 * Standard rules: 1→one, 2-4→few, 5-20→many, then by last digit.
 */
export function plural(n, [one, few, many]) {
  const a = Math.abs(Math.round(n));
  const d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}

/** Truncates long entity names for on-canvas labels. */
export function shortLabel(name, max = 22) {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

/**
 * The engine occasionally ships `source_url` pointed at EDGAR's full-text-
 * search JSON API (efts.sec.gov/LATEST/search-index?...) instead of the
 * human-facing results page — clicking it dumps raw JSON, not a filing. Same
 * query params, different (human) front end, so this is a lossless rewrite:
 *   https://efts.sec.gov/LATEST/search-index?q=X&forms=Y
 *   → https://www.sec.gov/edgar/search/#/q=X&forms=Y
 * Anything else passes through untouched.
 */
export function humanizeSourceUrl(url) {
  if (typeof url !== 'string') return url;
  try {
    const u = new URL(url);
    if (u.hostname !== 'efts.sec.gov' || !u.pathname.startsWith('/LATEST/search-index')) return url;
    return `https://www.sec.gov/edgar/search/#/${u.search.replace(/^\?/, '')}`;
  } catch {
    return url;
  }
}
