// ══════════════════════════════════════════════════════════════════════════
// CAPITAL FLOW MAP — data adapter
//
// The Capital Flow *engine* (a separate repo) sweeps SEC filings / official
// PRs / VC press every cycle, verifies real capital-allocation events, runs
// signal rules, and exports ONE file: capital_map.json. That file — dropped
// into ./capitalMap.json — is the ONLY contract between the engine and this
// dashboard.
//
//   engine (agents → verify → SQLite → signal rules) → capitalMap.json → here
//
// This module imports that file and reshapes it into the graph the Capital
// Flow Map components render. NOTHING is hard-coded: swap in next week's file
// and the map changes with no code edit. We have ZERO data latitude — we never
// invent entities/flows/amounts or override a status; we only style what the
// file says.
//
// CONTRACT (capital_map.json)
//   generated                          ISO date the file was produced
//   totals { nodes, flows, sectors }
//   nodes[] { id, label, kind, cls, tier, sector, deals, capital,
//             first_seen, last_activity, stale }
//   flows[] { source, target, sector, event_type, amount, status, date, tier }
//   sectors{ <key>: { deals, capital, allocators, signals[] } }
// ══════════════════════════════════════════════════════════════════════════

import raw from './capitalMap.json';

// ── The 12 canonical sectors = the cluster zones of the map ────────────────
// Muted / desaturated palette — the map should read like an institutional
// diagram, not neon. `order` fixes the left→right, top→bottom zone sequence.
export const SECTOR_META = {
  'ai-labs':          { label: 'AI Labs',          color: '#A08FD0', order: 0 },
  'ai-compute':       { label: 'AI Compute',       color: '#8F9BD6', order: 1 },
  'semiconductors':   { label: 'Semiconductors',   color: '#8893D8', order: 2 },
  'fab-equipment':    { label: 'Fab Equipment',    color: '#98A2AE', order: 3 },
  'cloud-hyperscale': { label: 'Cloud / Hyperscale', color: '#6BABD6', order: 4 },
  'neocloud':         { label: 'Neoclouds',        color: '#63BCAD', order: 5 },
  'datacenters':      { label: 'Datacenters',      color: '#C99B72', order: 6 },
  'power-energy':     { label: 'Power & Energy',   color: '#82B98D', order: 7 },
  'nuclear':          { label: 'Nuclear',          color: '#8FBF8A', order: 8 },
  'networking':       { label: 'Networking',       color: '#6FB39A', order: 9 },
  'robotics':         { label: 'Robotics',         color: '#C089A8', order: 10 },
  'defense-tech':     { label: 'Defense Tech',     color: '#C08585', order: 11 },
};

// ── Entity class — allocator classes deploy capital, target classes receive
// it. Drives node colour (allocators), on-canvas block shape, and the class
// filter. `side` = which band the node lives in (source vs sink).
export const CLASS_META = {
  // allocators (deploy)
  corporate:    { label: 'Corporate',        color: '#6BABD6', shape: 'capsule', side: 'allocator' },
  vc:           { label: 'Venture',          color: '#A08FD0', shape: 'capsule', side: 'allocator' },
  alt_manager:  { label: 'Alt Manager',      color: '#C2A36B', shape: 'capsule', side: 'allocator' },
  sovereign:    { label: 'Sovereign',        color: '#6FB39A', shape: 'capsule', side: 'allocator' },
  individual:   { label: 'Individual',       color: '#C089A8', shape: 'capsule', side: 'allocator' },
  // targets (receive)
  private:      { label: 'Private co.',      color: '#9D8FD8', shape: 'company', side: 'target' },
  public:       { label: 'Public co.',       color: '#62B5CC', shape: 'company', side: 'target' },
  fund:         { label: 'Fund',             color: '#C9985F', shape: 'capsule', side: 'target' },
  project:      { label: 'Project',          color: '#C99B72', shape: 'asset',   side: 'target' },
  asset:        { label: 'Asset',            color: '#98A2AE', shape: 'asset',   side: 'target' },
};

// ── Event type → edge family + colour. One colour per family; drives edge
// colour, the legend, and the event-type filter.
export const EVENT_TYPE_META = {
  equity:               { label: 'Equity',            family: 'equity',      color: '#9D8FD8' },
  minority_stake:       { label: 'Minority stake',    family: 'equity',      color: '#9D8FD8' },
  funding_round:        { label: 'Funding round',     family: 'equity',      color: '#9D8FD8' },
  corporate_investment: { label: 'Corp. investment',  family: 'equity',      color: '#9D8FD8' },
  follow_on:            { label: 'Follow-on',          family: 'equity',      color: '#9D8FD8' },
  project_finance:      { label: 'Project finance',   family: 'debt',        color: '#CCAF62' },
  acquisition:          { label: 'Acquisition',       family: 'acquisition', color: '#C287A8' },
  fund_launch:          { label: 'Fund launch',       family: 'fund',        color: '#74B896' },
  spv:                  { label: 'SPV',               family: 'fund',        color: '#74B896' },
  grant:                { label: 'Grant',             family: 'grant',       color: '#93A3B3' },
  sovereign_investment: { label: 'Sovereign invest.', family: 'sovereign',   color: '#C9985F' },
};

// The distinct families, for a compact legend (colour is shared within a family).
export const FAMILY_META = {
  equity:      { label: 'Equity / rounds',    color: '#9D8FD8' },
  debt:        { label: 'Project finance',    color: '#CCAF62' },
  acquisition: { label: 'Acquisition',        color: '#C287A8' },
  fund:        { label: 'Fund / SPV',         color: '#74B896' },
  grant:       { label: 'Grant',              color: '#93A3B3' },
  sovereign:   { label: 'Sovereign',          color: '#C9985F' },
};

// ── Confidence — the engine's `status`. Drives edge dashing + the chip.
// verified = Tier-1 confirmed (solid, strongest) · verified_alpha = strong,
// no primary source yet (short dash) · candidate = a lead (long dash).
export const STATUS_META = {
  verified:       { label: 'Verified',       short: 'VERIFIED', color: '#34D399', dash: null,     blurb: 'Tier-1 confirmed against a primary source.' },
  verified_alpha: { label: 'Verified α',     short: 'ALPHA',    color: '#FBBF24', dash: [7, 4],   blurb: 'Strong, but no primary source confirmed yet.' },
  candidate:      { label: 'Candidate',      short: 'CANDIDATE',color: '#94A3B8', dash: [2, 5],   blurb: 'An unconfirmed lead. Kept off the main map by default.' },
};

// ── Allocator tier — importance weighting from the engine.
export const TIER_META = {
  key:   { short: 'KEY',   stars: '★★★', label: 'Key allocator', color: '#FBBF24',
           blurb: 'Decides where billions go. Strongest predictor of where capital moves next.' },
  watch: { short: 'WATCH', stars: '★★',  label: 'Watchlist',     color: '#C084FC',
           blurb: 'On the tracked universe; a secondary-weight allocator.' },
};

// Source-tier (1..5) of a flow — 1 = SEC/official filing.
export const SOURCE_TIER_LABEL = {
  1: 'Tier 1 · SEC / official',
  2: 'Tier 2 · company PR',
  3: 'Tier 3 · reputable press',
  4: 'Tier 4 · secondary press',
  5: 'Tier 5 · single source',
};

export const META = {
  generated: raw.generated,
  totals: raw.totals || { nodes: (raw.nodes || []).length, flows: (raw.flows || []).length, sectors: Object.keys(raw.sectors || {}).length },
};

export const DISCLAIMER =
  'Generated by the Capital Flow engine from public filings, official releases and press reporting. ' +
  'Statuses (verified / verified α / candidate) are the engine\'s own confidence marks and are rendered as-is — never overridden. ' +
  'Amounts are as disclosed; some flows are undisclosed. Not investment advice.';

// ══════════════════════════════════════════════════════════════════════════
// buildGraph — reshape the contract into { nodes, links, sectors, stats }.
// ══════════════════════════════════════════════════════════════════════════
export function buildGraph(data = raw) {
  const rawNodes = data.nodes || [];
  const rawFlows = data.flows || [];
  const rawSectors = data.sectors || {};

  const byId = new Map(rawNodes.map(n => [n.id, n]));

  // Which sectors are lighting up this cycle (non-empty signals)?
  const litSectors = new Set(
    Object.entries(rawSectors)
      .filter(([, s]) => Array.isArray(s.signals) && s.signals.length > 0)
      .map(([k]) => k)
  );

  const nodes = rawNodes.map(n => {
    const clsMeta = CLASS_META[n.cls] || {};
    const isAllocator = n.kind === 'allocator';
    const color = isAllocator
      ? (clsMeta.color || '#C2A36B')
      : (SECTOR_META[n.sector]?.color || clsMeta.color || '#71717a');
    return {
      ...n,
      name: n.label,
      // FlowGraph role encoding: 'player' deploys · 'target' receives.
      type: isAllocator ? 'player' : 'target',
      color,
      capital: n.capital || 0,
      totalInflow: 0, totalOutflow: 0, inflowCount: 0, outflowCount: 0,
      confirmed: false,           // set below — has ≥1 verified/verified_alpha flow
      sectorLit: n.sector ? litSectors.has(n.sector) : false,
      x: 0, y: 0,
    };
  });
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  // Drop flows that reference an unknown node (defensive — the engine dedupes).
  const valid = rawFlows.filter(f => {
    const ok = byId.has(f.source) && byId.has(f.target);
    if (!ok && typeof console !== 'undefined') {
      console.warn(`[capitalMap] flow ${f.source}→${f.target} references an unknown node — skipped`);
    }
    return ok;
  });

  // Fan multiple flows between the same pair apart so edges never overlap.
  const pairKey = (a, b) => [a, b].sort().join('~');
  const pairCount = new Map();
  valid.forEach(f => { const k = pairKey(f.source, f.target); pairCount.set(k, (pairCount.get(k) || 0) + 1); });
  const pairSeen = new Map();

  const links = valid.map((f, i) => {
    const k = pairKey(f.source, f.target);
    const total = pairCount.get(k);
    const idx = pairSeen.get(k) || 0;
    pairSeen.set(k, idx + 1);
    const curvature = total === 1 ? 0.06 : 0.18 * (idx - (total - 1) / 2) * 2;

    const et = EVENT_TYPE_META[f.event_type] || { label: f.event_type, family: 'equity', color: '#52525b' };
    const disclosed = f.amount != null;
    const amt = disclosed ? f.amount : 0;

    const src = nodeById.get(f.source);
    const tgt = nodeById.get(f.target);
    src.outflowCount += 1; src.totalOutflow += amt;
    tgt.inflowCount += 1;  tgt.totalInflow += amt;
    if (f.status === 'verified' || f.status === 'verified_alpha') {
      src.confirmed = true; tgt.confirmed = true;
    }

    return {
      ...f,
      id: `${f.source}=>${f.target}#${i}`,
      sourceId: f.source, targetId: f.target,
      eventLabel: et.label,
      family: et.family,
      color: et.color,
      amountUSD: amt,          // 0 when undisclosed (used only for sizing)
      disclosed,
      sourceTier: f.tier,      // 1..5 — do NOT confuse with allocator tier
      curvature,
    };
  });

  // Node roll-ups. Size is driven by the engine's `capital` (authoritative),
  // not by our summed amounts (some flows are undisclosed).
  nodes.forEach(n => {
    n.totalFlow = n.capital;
    n.degree = n.inflowCount + n.outflowCount;
    // A node is on the MAIN map when it carries a verified/verified_alpha flow,
    // OR sits in a sector with a fired signal (inclusion rule). candidate-only
    // nodes are watch/unconfirmed — muted / behind a toggle.
    n.watchOnly = !n.confirmed && !n.sectorLit;
  });

  const maxCapital = Math.max(1, ...nodes.map(n => n.capital));
  const maxAmount = Math.max(1, ...links.map(l => l.amountUSD));
  nodes.forEach(n => { n.flowShare = n.capital / maxCapital; });
  links.forEach(l => { l.amountShare = l.amountUSD / maxAmount; });

  // Per-sector aggregates come straight from the engine (authoritative), with
  // the node/flow lists attached for convenience.
  const sectors = {};
  Object.entries(rawSectors).forEach(([key, s]) => {
    sectors[key] = {
      key,
      ...s,
      lit: Array.isArray(s.signals) && s.signals.length > 0,
      label: SECTOR_META[key]?.label || key,
      color: SECTOR_META[key]?.color || '#71717a',
    };
  });

  const disclosedTotal = links.reduce((acc, l) => acc + (l.disclosed ? l.amount : 0), 0);
  const stats = {
    nodeCount: nodes.length,
    allocatorCount: nodes.filter(n => n.kind === 'allocator').length,
    targetCount: nodes.filter(n => n.kind === 'target').length,
    flowCount: links.length,
    sectorCount: Object.keys(sectors).length,
    signalCount: Object.values(sectors).filter(s => s.lit).length,
    staleCount: nodes.filter(n => n.stale).length,
    watchCount: nodes.filter(n => n.watchOnly).length,
    totalTracked: disclosedTotal,
    disclosedShare: links.length ? links.filter(l => l.disclosed).length / links.length : 0,
  };

  return { nodes, links, sectors, stats, generated: data.generated, maxCapital, maxAmount };
}

/** Adjacency lookup: node id → { inbound: [links], outbound: [links] }. */
export function buildAdjacency(links) {
  const map = new Map();
  const touch = (id) => {
    if (!map.has(id)) map.set(id, { inbound: [], outbound: [] });
    return map.get(id);
  };
  links.forEach(l => {
    touch(l.sourceId).outbound.push(l);
    touch(l.targetId).inbound.push(l);
  });
  map.forEach(v => {
    v.inbound.sort((a, b) => b.amountUSD - a.amountUSD);
    v.outbound.sort((a, b) => b.amountUSD - a.amountUSD);
  });
  return map;
}
