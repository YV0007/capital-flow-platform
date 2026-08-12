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
 * Signal descriptions ship as one composed sentence from the engine
 * (`"energy_for_ai: 7 key allocators converge (30d)"`) — for sector/theme-wide
 * rules it leads with the raw slug, not a human label. Swap a recognized
 * leading `slug:` (sector or `sector/subsector`) for its display label from
 * the same meta tables already used elsewhere (SECTOR_META/THEME_META),
 * leaving everything else untouched.
 *
 * Rules that lead with an entity name instead — `beneficiary_concentration`
 * ("TSM (Taiwan Semiconductor): 7 private flows converge") and
 * `stealth_accumulation` ("Cathedral: stealth accumulation — 3 stakes in
 * 90d") — never match a slug key, so they get their own parse: put the
 * readable name first, ticker/count folded into a plain Russian clause.
 * Anything that doesn't match either shape passes through unchanged.
 */
export function formatSignalText(text, sectorMeta = {}, themeMeta = {}) {
  if (typeof text !== 'string') return text;

  const benef = text.match(/^([A-Z][A-Z0-9.]{0,5})\s*\(([^)]+)\):\s*(\d+)\s+private flows? converge$/);
  if (benef) {
    const [, ticker, company, countStr] = benef;
    const count = Number(countStr);
    const verb = count === 1 ? 'указывает' : 'указывают';
    return `${company} (${ticker}) — ${count} ${plural(count, ['частный поток', 'частных потока', 'частных потоков'])} ${verb} на этот тикер`;
  }

  const stealth = text.match(/^(.+?):\s*stealth accumulation\s*—\s*(\d+)\s+stakes?\s+in\s+(\d+)d$/);
  if (stealth) {
    const [, name, stakesStr, daysStr] = stealth;
    const stakes = Number(stakesStr), days = Number(daysStr);
    return `${name} — ${stakes} ${plural(stakes, ['доля', 'доли', 'долей'])} за ${days} ${plural(days, ['день', 'дня', 'дней'])} (тихое накопление)`;
  }

  const m = text.match(/^([a-z0-9_-]+(?:\/[a-z0-9_-]+)?):/i);
  if (!m) return text;
  const slug = m[1];
  const label = sectorMeta[slug]?.label || themeMeta[slug]?.label || sectorMeta[slug.split('/')[0]]?.label;
  return label ? label + text.slice(slug.length) : text;
}

/**
 * Merges multiple signals that fired for the SAME entity off the SAME
 * evidence (the engine occasionally proposes more than one public-ticker
 * beneficiary for one private-flow cluster — e.g. both FANUC and Siemens for
 * one Hadrian round) into a single readable line instead of two visually
 * duplicate cards. `themes` is the array of raw `theme` strings sharing that
 * evidence; falls back to the plain single-theme format for everything else.
 */
export function formatSignalThemes(themes, rule, sectorMeta = {}, themeMeta = {}) {
  const list = (themes || []).filter(Boolean);
  if (list.length <= 1) return formatSignalText(list[0], sectorMeta, themeMeta);

  if (rule === 'beneficiary_concentration') {
    const parsed = list.map(t => t.match(/^([A-Z][A-Z0-9.]{0,5})\s*\(([^)]+)\):\s*(\d+)\s+private flows? converge$/))
      .filter(Boolean)
      .map(([, ticker, company, countStr]) => ({ ticker, company, count: Number(countStr) }));
    if (parsed.length === list.length) {
      const names = parsed.map(p => `${p.company} (${p.ticker})`).join(', ');
      const count = parsed[0].count;
      return `${names} — ${count} ${plural(count, ['частный поток', 'частных потока', 'частных потоков'])} указывают сразу на ${parsed.length} тикера-кандидата`;
    }
  }

  return list.map(t => formatSignalText(t, sectorMeta, themeMeta)).join(' · ');
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
