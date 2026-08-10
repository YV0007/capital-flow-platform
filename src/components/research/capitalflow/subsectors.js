// ══════════════════════════════════════════════════════════════════════════
// SUB-SECTORS — the second level under a sector ("inside AI Applications, is
// this a security company or a drug-discovery company?").
//
// ENGINE-OWNED. The engine now emits `subsector` on every flow (a descriptive
// per-deal slug, e.g. "hyperscale-ai", "gpu-cloud-financing"); the adapter
// attaches each target's subsector from its largest inbound flow. This module
// only groups + labels that field — no keyword guessing. The label is the
// slug de-slugged (the engine's own wording); colour is a stable hash so rows
// stay distinguishable without a maintained palette. A node with no subsector
// (very rare) is honestly "Без категории".
//
// Vehicle type below is separate and structural (from `cls`, 100% coverage).
// ══════════════════════════════════════════════════════════════════════════

// ── Vehicle type — structural, from the engine's own `cls`. 100% coverage,
// zero inference. Matters because a fund/SPV raising money is not a company
// raising money, and the two get summed into the same sector total.
export const VEHICLE_META = {
  company: { label: 'Операционные компании', blurb: 'Реальный бизнес, привлекающий капитал.', color: '#9D8FD8' },
  fund:    { label: 'Фонды и SPV', blurb: 'Фонды и SPV, привлекающие деньги, чтобы инвестировать дальше, — не операционный бизнес. В основном заявки Form D.', color: '#C9985F' },
  project: { label: 'Проекты и активы',   blurb: 'Именованные стройки, программы и физические активы, а не компании.', color: '#C99B72' },
};

export function vehicleOf(node) {
  if (node.cls === 'fund') return 'fund';
  if (node.cls === 'project' || node.cls === 'asset') return 'project';
  return 'company';
}

// De-slug an engine subsector key into a readable label, keeping the acronyms
// the engine uses in caps ("hyperscale-ai" → "Hyperscale AI").
const CAPS = new Set(['ai', 'gpu', 'spv', 'jv', 'doe', 'apac', 'us', 'ev', 'cpo', 'asic', 'dc', 'jpm', 'gw']);
function deslug(key) {
  return String(key).split(/[-_]/).map(w => {
    const lw = w.toLowerCase();
    if (CAPS.has(lw)) return w.toUpperCase();
    if (/^\d/.test(w)) return w.toUpperCase();          // "1gw", "5gw"
    return w ? w[0].toUpperCase() + w.slice(1) : w;
  }).join(' ');
}

// Stable muted colour from the key — distinguishable rows without a maintained
// palette. Hash → hue, fixed low saturation / mid lightness (cool, calm).
function hashColor(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  const hue = (h >>> 0) % 360;
  return `hsl(${hue} 42% 62%)`;
}

/**
 * Sub-sector for one target node, straight from the engine's `subsector`.
 * Returns { key, label, color, basis }; basis is 'engine' or null (no field).
 */
export function subsectorOf(node) {
  const key = node?.subsector || null;
  if (!key) return { key: null, label: 'Без категории', color: '#52525b', basis: null };
  return { key, label: deslug(key), color: hashColor(key), basis: 'engine' };
}

/**
 * Group a list of target nodes into sub-sectors, with the honest coverage
 * fraction attached. `capitalOf` lets the caller weight by sector-scoped
 * capital rather than the node's lifetime total.
 */
export function subsectorBreakdown(nodes, capitalOf = (n) => n.capital || 0) {
  const buckets = new Map();
  let classified = 0;
  let weak = 0;
  nodes.forEach(n => {
    const s = subsectorOf(n);
    if (s.key) classified += 1;
    if (s.basis === 'name') weak += 1;
    const k = s.key || '_none';
    if (!buckets.has(k)) {
      buckets.set(k, { key: s.key, label: s.label, color: s.color, count: 0, capital: 0, members: [] });
    }
    const b = buckets.get(k);
    b.count += 1;
    b.capital += capitalOf(n);
    b.members.push(n);
  });
  const rows = [...buckets.values()].sort((a, b) => {
    if (!a.key) return 1;                    // Unclassified always last
    if (!b.key) return -1;
    return b.capital - a.capital || b.count - a.count;
  });
  return {
    rows,
    coverage: { classified, weak, total: nodes.length },
  };
}

/**
 * Group target nodes by vehicle type (company / fund / project).
 */
export function vehicleBreakdown(nodes, capitalOf = (n) => n.capital || 0) {
  const buckets = new Map();
  nodes.forEach(n => {
    const k = vehicleOf(n);
    if (!buckets.has(k)) buckets.set(k, { key: k, ...VEHICLE_META[k], count: 0, capital: 0, members: [] });
    const b = buckets.get(k);
    b.count += 1;
    b.capital += capitalOf(n);
    b.members.push(n);
  });
  return [...buckets.values()].sort((a, b) => b.capital - a.capital || b.count - a.count);
}
