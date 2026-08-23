// ══════════════════════════════════════════════════════════════════════════
// classification.js — the two-rank highlight framework.
//
// We highlight TWO different objects with TWO different logics. They are two
// views of one phenomenon — smart capital converging early on a target:
//
//   RANK 1 · INTERESTING DEALS  (indexed on the TARGET)
//     "capital is starting to stack here, and we're early." Flags where an
//     opportunity may lie — NOT by deal size.
//
//   RANK 2 · PLAYERS WORTH FOLLOWING  (indexed on the ALLOCATOR)
//     "this player is consistently at the front of the curve others chase."
//     Ranks who to track — NOT by AUM / check size.
//
// Both are computed from the payload the dashboard already ships. The factors
// flagged ⚠️ are approximate today and get sharper once the engine's
// deep-classification agent lands the missing data (co-investor entry dates,
// realized outcomes, public-proxy mapping, moat/AI-resilience tags).
//
// ORDER MATTERS: players carry no dependency on deals, but a deal's
// backer-quality reads the players' scores — so classifyPlayers() runs first,
// then classifyDeals().
//
// Everything below the CONFIG block is mechanism. CONFIG is the tuning surface
// the user adjusts over time: gate lists, factor weights (as geometric-mean
// exponents), decay windows, and the tier quantiles.
// ══════════════════════════════════════════════════════════════════════════

// ── CONFIG — the tuning surface ────────────────────────────────────────────
import { biMap } from '../../../data/capitalMap.js';

export const CLASSIFY_CONFIG = {
  // Investable universe. A deal only counts if the TARGET is a company a
  // solo investor could ride, reached by an investable instrument. This is
  // what excludes data-center buildouts and grant/program capital.
  investableTargetClasses: ['private', 'public'],
  excludedEventTypes: ['project_finance', 'grant', 'fund_launch'],
  // Capex buildout sectors — physical infrastructure a solo investor can't
  // ride as a company. Excludes data-center/power/nuclear/GPU-cloud buildouts
  // while keeping AI companies, chips, defense-tech, robotics, etc.
  excludedSectors: ['datacenters', 'power-energy', 'nuclear', 'neocloud'],

  // A flow "counts" only if the engine confirmed it.
  confirmedStatuses: ['verified', 'verified_alpha'],

  // Time windows (days), measured against the delivery's `generated` date.
  recentBackerWindow: 120,   // a backer is a "recent arrival" if within this
  dealFreshWindow: 548,      // ~18mo — older than this and a deal's score halves
  leadTimeCap: 540,          // lead-time saturates here (~18mo ahead of crowd)

  // RANK 1 — interesting deals. Primary factors combine as a WEIGHTED
  // GEOMETRIC MEAN (exponents below) so a deal must be strong on SEVERAL axes,
  // not one — then the booster factors nudge (they never dominate).
  deal: {
    exp: { convergence: 0.45, early: 0.30, backerQuality: 0.25 }, // Σ ≈ 1
    crowdCap: 8,             // backer count at which "caught early" hits zero
    boosterWeight: 0.15,     // how much actionable/independence can swing (±)
    staleFactor: 0.5,        // multiplier when the target is stale
    tiers: { flagged: 0.12, emerging: 0.35 }, // top 12% / next to 35% quantile
    backerFloor: 0.2,        // score credited for an untracked/ungraded backer
  },

  // RANK 2 — players worth following. Same geometric-mean shape.
  player: {
    // bellwether + leadTime are the spine (heaviest) but DARK until the engine
    // ships co-investor entry dates — they null out and the rest renormalize,
    // so today's rank rests on focus/repeat/overlap/track-record. exp Σ ≈ 1.
    exp: { bellwether: 0.22, leadTime: 0.22, focus: 0.18, repeat: 0.16, overlap: 0.12, trackRecord: 0.10 },
    staleFactor: 0.6,        // multiplier when the allocator is dormant
    tiers: { core: 0.10, key: 0.35 },
    minDealsForFocus: 3,     // focus/selectivity needs evidence to score high
  },

  // ── ARCHETYPE — the single tag a name resolves to (table/list display).
  // Deliberately ONE label per entity, not a score + a factor name — the
  // dashboard is crowded enough; a name should resolve to one deterministic
  // word, the way "core investor" already reads today. Priority-ordered rule
  // cascade per type: first rule whose threshold clears wins; nothing clears
  // → falls back to the plain rank word (Ядро/Ключ/Набл. · Флаг/Зарождается).
  // Thresholds are magnitude-gated (not bare argmax) so a factor barely above
  // its neighbours doesn't get crowned — it has to actually clear the bar.
  archetype: {
    player: [
      // leads before the crowd — needs real timing data (bellwether/leadTime),
      // still mostly dark until the engine ships co-investor entry dates.
      { id: 'trend',        test: (p, rank) => (rank === 'core' || rank === 'key')
          && ((p.bellwether != null && p.bellwether >= 0.7) || (p.leadTime != null && p.leadTime >= 0.7)) },
      // concentrated AND repeatedly doubles down — conviction, not a spray.
      { id: 'fundamental',  test: (p) => p.repeat >= 0.6 && p.focus >= 0.6 },
      // broad, low selectivity — many bets, little concentration.
      { id: 'aggressive',   test: (p) => p.overlap >= 0.7 && p.focus < 0.4 },
      // real, disclosed returns are what's actually carrying the score.
      { id: 'proven',       test: (p) => p.trackRecord != null && p.trackRecord >= 0.7 },
    ],
    deal: [
      // already a public company — the strongest, most concrete "can I act on
      // this" fact there is, so it's checked directly rather than by score.
      { id: 'actionable',   test: (p, rank, t) => t.cls === 'public' },
      // very few backers yet, but already flagged/emerging — genuinely early.
      { id: 'early',        test: (p, rank) => (rank === 'flagged' || rank === 'emerging') && p.early >= 0.7 },
      // the backers behind it are themselves top-ranked players.
      { id: 'smart-money',  test: (p) => p.backerQuality >= 0.7 },
      // backers share no common camp/network — independent agreement.
      { id: 'independent',  test: (p) => p.independence >= 0.7 },
    ],
  },
};

// Weak/zero factors drag a score toward this floor rather than annihilating it
// — a geometric mean with a true 0 would zero everything, too harsh when only a
// couple of factors are live. Tunable: lower = harsher "needs every axis".
const GEO_FLOOR = 0.1;

// ── small helpers ──────────────────────────────────────────────────────────
const CFG = CLASSIFY_CONFIG;

function parseDay(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const t = Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return Number.isNaN(t) ? null : t;
}
const DAY = 86400000;
function daysBetween(a, b) { return (a - b) / DAY; }

// Weighted geometric mean of [value, exponent] pairs. A null value means the
// factor is UNAVAILABLE (no data for it yet, anywhere) — it's skipped and the
// remaining exponents renormalize, so a not-yet-computable factor (e.g.
// lead-time before the engine ships co-investor dates) neither zeros the score
// nor silently counts as strong. A real 0 value DOES pull the mean down.
function geoMean(parts) {
  let logSum = 0, expSum = 0;
  for (const [v, e] of parts) {
    if (v == null) continue;
    logSum += e * Math.log(Math.max(GEO_FLOOR, Math.min(1, v)));
    expSum += e;
  }
  return expSum ? Math.exp(logSum / expSum) : 0;
}

// Booster in [1-w, 1+w] from a 0..1 factor — gentle multiplicative nudge.
function booster(x, w) { return (1 - w) + 2 * w * clamp01(x); }

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

// Percentile rank of each raw value within its population, in [0,1].
// Ties share the fraction of values strictly below them. N<=1 → 1.
function percentiler(values) {
  const sorted = [...values].filter(v => Number.isFinite(v)).sort((a, b) => a - b);
  const n = sorted.length;
  return (x) => {
    if (!Number.isFinite(x) || n <= 1) return n <= 1 ? 1 : 0;
    // count strictly less than x (binary search)
    let lo = 0, hi = n;
    while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < x) lo = m + 1; else hi = m; }
    return lo / (n - 1);
  };
}

// Display labels for archetype ids — the ONE word/phrase a table or list ever
// shows for a name. Kept next to CLASSIFY_CONFIG.archetype so the rule and its
// label are never edited out of sync with each other.
export const ARCHETYPE_LABEL = biMap({
  trend:         ['Трендовый', 'Trend-following'],
  fundamental:   ['Фундаментальный', 'Fundamental'],
  aggressive:    ['Агрессивный', 'Aggressive'],
  proven:        ['Проверенный', 'Proven'],
  actionable:    ['Доступна', 'Actionable'],
  early:         ['Рано', 'Early'],
  'smart-money': ['Умные деньги', 'Smart money'],
  independent:   ['Независимо', 'Independent'],
});

// Plain rank word — the fallback whenever no archetype rule cleared, and the
// color every rank-aware UI (map bloom, panel badge, table cell) keys off of.
// Single source so every surface stays in sync by construction.
export const RANK_LABEL = biMap({
  core:     ['Ядро', 'Core'],
  key:      ['Ключ', 'Key'],
  watch:    ['Набл.', 'Watch'],
  flagged:  ['Флаг', 'Flagged'],
  emerging: ['Зарождается', 'Emerging'],
});
export const RANK_COLOR = {
  core: 'var(--cf-gold)', flagged: 'var(--cf-gold)',
  key: 'var(--cf-warn)', emerging: 'var(--cf-warn)',
  watch: 'var(--cf-text5)',
};

// Runs a type's rule cascade (CLASSIFY_CONFIG.archetype.player / .deal) against
// one entity's already-computed parts + rank; first rule that clears wins.
// Returns null (→ caller falls back to the plain rank word) when nothing does.
function pickArchetype(type, parts, rank, node) {
  if (!parts || !rank) return null;
  for (const rule of CFG.archetype[type]) {
    if (rule.test(parts, rank, node)) return rule.id;
  }
  return null;
}

// Split the free-text co_investors string ("A; B (x); C") into clean names.
export function splitCoInvestors(s) {
  if (!s || typeof s !== 'string') return [];
  return s.split(';').map(x => x.trim()).filter(Boolean);
}

function isConfirmed(link) { return CFG.confirmedStatuses.includes(link.status); }
function isInvestableDeal(link, tgt) {
  return tgt
    && CFG.investableTargetClasses.includes(tgt.cls)
    && !CFG.excludedSectors.includes(tgt.sector)
    && !CFG.excludedEventTypes.includes(link.event_type);
}

// ── main entry ──────────────────────────────────────────────────────────────
/**
 * Attach classification onto nodes (mutates), returns a small summary.
 *   players → playerScore (0..100), playerRank ('core'|'key'|'watch'|null), playerParts
 *   deals   → dealScore   (0..100), dealRank   ('flagged'|'emerging'|null), dealParts
 */
export function classifyGraph({ nodes, links, generated }) {
  const now = parseDay(generated) || Math.max(0, ...links.map(l => parseDay(l.date) || 0));
  const byId = new Map(nodes.map(n => [n.id, n]));

  // Adjacency of CONFIRMED links only (the evidence base).
  const outBySrc = new Map();   // allocator id → confirmed outbound links
  const inByTgt = new Map();    // target id    → confirmed inbound links
  for (const l of links) {
    if (!isConfirmed(l)) continue;
    if (!outBySrc.has(l.sourceId)) outBySrc.set(l.sourceId, []);
    if (!inByTgt.has(l.targetId)) inByTgt.set(l.targetId, []);
    outBySrc.get(l.sourceId).push(l);
    inByTgt.get(l.targetId).push(l);
  }

  classifyPlayers({ nodes, byId, outBySrc, inByTgt, now });
  classifyDeals({ nodes, byId, inByTgt, now });
  // Landmark consortiums (e.g. the NVIDIA AI-infra financing platform): several
  // top institutions co-launch ONE vehicle, but the flows are still candidate /
  // unconfirmed, so the confirmed-only deal classifier above scores them null and
  // they render flat. Give them the same red cloud, off the FULL ledger.
  classifyConsortiums({ nodes, links, byId });

  return {
    corePlayers: nodes.filter(n => n.playerRank === 'core').length,
    keyPlayers: nodes.filter(n => n.playerRank === 'key').length,
    flaggedDeals: nodes.filter(n => n.dealRank === 'flagged').length,
    emergingDeals: nodes.filter(n => n.dealRank === 'emerging').length,
    landmarkDeals: nodes.filter(n => n.landmark).length,
  };
}

// ── LANDMARK CONSORTIUMS ────────────────────────────────────────────────────
// A deterministic gap-filler, NOT an engine signal: a target that several
// distinct institutions co-back gets the pivotal red cloud even when its flows
// are unconfirmed announcements — the case the confirmed-only classifier misses.
// Gap-only: never touches a deal the classifier already ranked or the engine
// already signalled. The interpretation ("landmark / smart money") stays the
// engine's; we only count distinct institutional backers (an aggregate we own).
const INSTITUTIONAL = new Set(['alt_manager', 'corporate', 'sovereign', 'vc', 'fund']);
function classifyConsortiums({ nodes, links, byId }) {
  const backersByTgt = new Map();   // target id → Set of distinct source ids (FULL ledger)
  const engineLit = new Set();      // targets with an engine active_signal on any inbound flow
  for (const l of links) {
    if (!backersByTgt.has(l.targetId)) backersByTgt.set(l.targetId, new Set());
    backersByTgt.get(l.targetId).add(l.sourceId);
    if (l.active_signal) engineLit.add(l.targetId);
  }
  for (const t of nodes) {
    if (t.type !== 'target') continue;
    if (t.dealRank) continue;                              // classifier already ranked it
    if (Array.isArray(t.signals) && t.signals.length) continue;  // engine signalled the entity
    if (engineLit.has(t.id)) continue;                    // engine lit one of its flows
    const backerIds = backersByTgt.get(t.id);
    if (!backerIds) continue;
    let inst = 0;
    for (const sid of backerIds) {
      const s = byId.get(sid);
      if (s && INSTITUTIONAL.has(s.cls)) inst += 1;
    }
    if (inst >= 4) {
      t.dealRank = inst >= 5 ? 'flagged' : 'emerging';
      t.dealParts = { ...(t.dealParts || {}), consortium: inst };
      t.landmark = true;
    }
  }
}

// ── RANK 2 · PLAYERS WORTH FOLLOWING ────────────────────────────────────────
function classifyPlayers({ nodes, byId, outBySrc, inByTgt, now }) {
  const players = nodes.filter(n => n.type === 'player');

  // First pass — raw factor values per eligible player.
  const raw = new Map();
  for (const a of players) {
    const out = (outBySrc.get(a.id) || []).filter(l => isInvestableDeal(l, byId.get(l.targetId)));
    if (out.length < 1) continue;   // gate: ≥1 confirmed investable deal

    const targets = new Set(out.map(l => l.targetId));
    const allConfirmed = (outBySrc.get(a.id) || []).length;

    // (1) Bellwether pull ⚠️ — for each of a's targets, how many OTHER backers
    // arrived AFTER a did. a leads, the crowd piles in behind.
    // (2) Lead-time ⚠️ — how many days, on average, a is ahead of the crowd on
    // shared targets. Both read the dated links graph, not the co_investor text.
    let followers = 0, leadAcc = 0, leadN = 0;
    for (const l of out) {
      const aDate = parseDay(l.date);
      const others = (inByTgt.get(l.targetId) || []).filter(x => x.sourceId !== a.id);
      if (aDate == null) { continue; }
      const otherDates = others.map(x => parseDay(x.date)).filter(Boolean);
      followers += otherDates.filter(d => d > aDate).length;
      if (otherDates.length) {
        const med = median(otherDates);
        leadAcc += clamp01(daysBetween(med, aDate) / CFG.leadTimeCap);
        leadN += 1;
      }
    }
    const leadTime = leadN ? leadAcc / leadN : 0;

    // (3) Focus / selectivity ✅ — capital concentrated in a coherent set of
    // sectors (a specialist), gated by enough deals to mean something.
    const sectorWeight = new Map();
    let wTotal = 0;
    for (const l of out) {
      const w = (l.amountUSD || 0) + 1;   // +1 so undisclosed deals still count
      sectorWeight.set(l.sector, (sectorWeight.get(l.sector) || 0) + w);
      wTotal += w;
    }
    let hhi = 0;
    for (const w of sectorWeight.values()) { const s = w / wTotal; hhi += s * s; }
    const focus = hhi * Math.min(1, out.length / CFG.player.minDealsForFocus);

    // (4) Repeat conviction ✅ — follow-ons and re-ups into names already backed.
    const seenTgt = new Set();
    let repeats = 0;
    for (const l of out.slice().sort((x, y) => (parseDay(x.date) || 0) - (parseDay(y.date) || 0))) {
      if (l.event_type === 'follow_on' || seenTgt.has(l.targetId)) repeats += 1;
      seenTgt.add(l.targetId);
    }
    const repeatRate = out.length ? repeats / out.length : 0;

    // Booster — actionable overlap ⚠️: share of ALL a's confirmed deals that are
    // investable. A pure-megaproject allocator is great but not followable here.
    const overlap = allConfirmed ? out.length / allConfirmed : 0;

    // Bonus — realized track record ⚠️ (present only for some profiles).
    const tr = bestReturnPct(a.trackRecord);

    raw.set(a.id, {
      followers, leadTime, focus, repeatRate, overlap, tr,
      targets: targets.size, deals: out.length,
      // for lead-time, only players with shared dated targets are comparable
      hasLead: leadN > 0,
    });
  }

  // Second pass — percentile-normalize the count-like raws across the eligible
  // set, then combine.
  const followerPct = percentiler([...raw.values()].map(r => r.followers));
  const trPct = percentiler([...raw.values()].map(r => r.tr).filter(v => v != null));

  // Availability of the two timing factors across the WHOLE population. Today
  // co-investors arrive as a text list on one flow, not as dated per-allocator
  // edges — so there's nothing to time and both are dark until the engine's
  // deep-classification agent lands entry dates. Marked null → skipped, not zero.
  const bellAvailable = [...raw.values()].some(r => r.followers > 0);
  const leadAvailable = [...raw.values()].some(r => r.hasLead && r.leadTime > 0);
  const pending = [...(bellAvailable ? [] : ['bellwether']), ...(leadAvailable ? [] : ['leadTime'])];

  const scored = [];
  for (const [id, r] of raw) {
    const a = byId.get(id);
    const parts = {
      bellwether: bellAvailable ? followerPct(r.followers) : null,
      leadTime: leadAvailable ? r.leadTime : null,
      focus: clamp01(r.focus),
      repeat: clamp01(r.repeatRate),
      overlap: clamp01(r.overlap),
      trackRecord: r.tr == null ? null : trPct(r.tr),
      followers: r.followers, targets: r.targets, deals: r.deals, hasLead: r.hasLead,
      pending,
    };
    const base = geoMean([
      [parts.bellwether, CFG.player.exp.bellwether],
      [parts.leadTime, CFG.player.exp.leadTime],
      [parts.focus, CFG.player.exp.focus],
      [parts.repeat, CFG.player.exp.repeat],
      [parts.overlap, CFG.player.exp.overlap],
      [parts.trackRecord, CFG.player.exp.trackRecord],
    ]);
    const active = a.stale ? CFG.player.staleFactor : 1;
    const score = 100 * base * active;
    a.playerParts = parts;
    a.playerScore = round1(score);
    scored.push(a);
  }

  assignTiers(scored, 'playerScore', 'playerRank',
    [['core', CFG.player.tiers.core], ['key', CFG.player.tiers.key], ['watch', 1]]);
  // Archetype needs the final rank (some rules key off it), so it runs after
  // assignTiers, not inside the scoring loop above.
  for (const a of scored) a.playerArchetype = pickArchetype('player', a.playerParts, a.playerRank, a);

  // Non-eligible players get null so consumers can tell "unscored" from "watch".
  for (const a of players) if (!raw.has(a.id)) { a.playerScore = null; a.playerRank = null; a.playerParts = null; a.playerArchetype = null; }
}

// ── RANK 1 · INTERESTING DEALS ──────────────────────────────────────────────
function classifyDeals({ nodes, byId, inByTgt, now }) {
  const targets = nodes.filter(n => n.type === 'target');

  const raw = new Map();
  for (const t of targets) {
    const inbound = (inByTgt.get(t.id) || []).filter(l => isInvestableDeal(l, t));
    if (!CFG.investableTargetClasses.includes(t.cls) || inbound.length < 1) continue; // gate

    // distinct backers + recency of their entry
    const backerLast = new Map();   // sourceId → most recent inbound day
    for (const l of inbound) {
      const d = parseDay(l.date);
      if (d == null) continue;
      backerLast.set(l.sourceId, Math.max(backerLast.get(l.sourceId) || 0, d));
    }
    const backers = new Set(inbound.map(l => l.sourceId));
    const nB = backers.size;
    const recentBackers = [...backerLast.values()].filter(d => daysBetween(now, d) <= CFG.recentBackerWindow).length;

    // (1) Convergence momentum ✅ — recent arrivals weigh more than old ones.
    const convergenceRaw = recentBackers + 0.4 * (nB - recentBackers);

    // (2) Caught early ✅ — richest before consensus; decays with crowd size.
    const early = clamp01((CFG.deal.crowdCap - nB) / (CFG.deal.crowdCap - 1));

    // (3) Backer quality ✅ — the players behind it (reads Rank-2 scores).
    //     blend of the best backer and the average, so one elite lifts it but
    //     breadth of quality also helps.
    const q = [...backers].map(id => {
      const s = byId.get(id)?.playerScore;
      return s == null ? CFG.deal.backerFloor : s / 100;
    });
    const backerQuality = q.length ? 0.6 * Math.max(...q) + 0.4 * (q.reduce((a, b) => a + b, 0) / q.length) : 0;

    // (5) Independence ✅ — backers from different camps (network/class), not
    //     one firm's SPVs echoing. 1 = every backer a distinct camp.
    // A "camp" = a shared elite network; independent firms are each their own
    // camp. So three distinct VCs (no shared network) read as independent
    // agreement, while one network's members echoing each other collapse to one.
    const camps = new Set([...backers].map(id => {
      const b = byId.get(id);
      return b?.network ? `net:${b.network}` : `firm:${id}`;
    }));
    const independence = nB > 1 ? (camps.size - 1) / (nB - 1) : 0.5;

    // (4) Actionable path ⚠️ — can a solo investor ride it? public now = full;
    //     private with a public read-through nearby = partial; else base.
    const actionable = t.cls === 'public' ? 1 : (t.beneficiaryLinked ? 0.6 : 0.3);

    // freshness gate → multiplier
    const lastDay = Math.max(0, ...[...backerLast.values()]);
    const fresh = daysBetween(now, lastDay) <= CFG.deal.dealFreshWindow ? 1 : CFG.deal.staleFactor;

    raw.set(t.id, { convergenceRaw, early, backerQuality, independence, actionable, fresh, nB, recentBackers });
  }

  const convPct = percentiler([...raw.values()].map(r => r.convergenceRaw));

  const scored = [];
  for (const [id, r] of raw) {
    const t = byId.get(id);
    const parts = {
      convergence: convPct(r.convergenceRaw),
      early: r.early,
      backerQuality: clamp01(r.backerQuality),
      independence: clamp01(r.independence),
      actionable: r.actionable,
      fresh: r.fresh,
      backers: r.nB, recentBackers: r.recentBackers,
    };
    const base = geoMean([
      [parts.convergence, CFG.deal.exp.convergence],
      [parts.early, CFG.deal.exp.early],
      [parts.backerQuality, CFG.deal.exp.backerQuality],
    ]);
    const score = 100 * base
      * booster(parts.actionable, CFG.deal.boosterWeight)
      * booster(parts.independence, CFG.deal.boosterWeight)
      * parts.fresh;
    t.dealParts = parts;
    t.dealScore = round1(score);
    scored.push(t);
  }

  assignTiers(scored, 'dealScore', 'dealRank',
    [['flagged', CFG.deal.tiers.flagged], ['emerging', CFG.deal.tiers.emerging], [null, 1]]);
  for (const t of scored) t.dealArchetype = pickArchetype('deal', t.dealParts, t.dealRank, t);

  for (const t of targets) if (!raw.has(t.id)) { t.dealScore = null; t.dealRank = null; t.dealParts = null; t.dealArchetype = null; }
}

// ── shared: tier assignment by quantile ─────────────────────────────────────
// bands: [[label, cumulativeQuantile], ...] top-first. A node lands in the
// first band whose cumulative share it falls within (by descending score).
function assignTiers(scored, scoreKey, rankKey, bands) {
  const ranked = [...scored].sort((a, b) => b[scoreKey] - a[scoreKey]);
  const n = ranked.length;
  ranked.forEach((node, i) => {
    const q = n <= 1 ? 0 : i / (n - 1);   // 0 = top
    node[rankKey] = bands.find(([, cut]) => q <= cut)?.[0] ?? bands[bands.length - 1][0];
  });
}

// ── shared: value extraction ────────────────────────────────────────────────
const RETURN_METRICS = new Set([
  'fund_irr_pct', 'fund_net_return_pct', 'fund_gross_return_pct', 'reported_return_pct', 'stock_total_return_pct',
]);
// Best realized return % across a profile's track-record rows (prefer net/IRR).
function bestReturnPct(trackRecord) {
  if (!Array.isArray(trackRecord) || !trackRecord.length) return null;
  const rows = trackRecord.filter(r => RETURN_METRICS.has(r.metric) && typeof r.value === 'number');
  if (!rows.length) return null;
  const pref = ['fund_net_return_pct', 'fund_irr_pct', 'fund_gross_return_pct', 'reported_return_pct', 'stock_total_return_pct'];
  rows.sort((a, b) => pref.indexOf(a.metric) - pref.indexOf(b.metric));
  return rows[0].value;
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function round1(x) { return Math.round(x * 10) / 10; }
