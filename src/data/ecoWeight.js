// ══════════════════════════════════════════════════════════════════════════
// ВЕС В СИСТЕМЕ — one number instead of three.
//
// The panel used to print three separate verdicts about the same entity —
// criticality (a hand-scored rubric), gravity (counts of neighbours, layers,
// edge types) and centrality (degree / betweenness / pagerank). They overlap,
// they disagree, and none of them is a ranking: comparing two entities meant
// holding six numbers in your head. This module folds all three into ONE
// 0–100 score with a rank, and keeps the three as its visible ingredients.
//
// Everything here is computed IN THE DASHBOARD, from fields the engine already
// ships. The `ai-ecosystem-network/2` contract is untouched, both maps get the
// metric for free through `buildGraphFrom()`, and the formula stays editable in
// one file while it is being tuned. If it proves out, the engine can adopt it
// verbatim later and this becomes a passthrough.
//
// The plan and the reasoning behind every constant: ECOSYSTEM-NODE-WEIGHT-PLAN.md
//
//   ВЕС = 50 + 16.6·log₂( Влияние^0.50 · Незаменимость^0.20
//                         · Охват^0.18 · Ломкость^0.12 )
//
// Each of the four terms is a MULTIPLE OF THE NETWORK AVERAGE, so their
// geometric product is also a multiple, 50 means exactly average, and every
// doubling is +16.6 points. Anchored to the mean rather than to a rank, so the
// number is stable month to month and comparable between the two maps.
// ══════════════════════════════════════════════════════════════════════════

import { bi } from '../lib/bi.js';

// ── 1. The dependency graph ──────────────────────────────────────────────
// PageRank flows rank TOWARD what is linked to, so the graph it runs on is not
// the map's edge list — it is a derived graph whose arrow means "A leans on B".
// `asml —supplies→ tsmc` becomes `tsmc ⇒ asml`.
//
//   'ts'   the TARGET depends on the source   (supplies, enables, locks_in…)
//   'st'   the SOURCE depends on the target   (customer_of, standardizes_on…)
//   'both' mutual, half the weight each way   (co_designs, strategic_partner)
//   null   NOT a dependency — dropped entirely
//
// The class weight says how much power that KIND of relation actually carries:
// a physical input nobody can ship without is not a venture cheque.
const ORIENT = {
  // physical supply — the product does not exist without it
  manufactures: ['ts', 1.00], supplies: ['ts', 1.00], packages: ['ts', 1.00],
  enables: ['ts', 1.00], delivers_to: ['ts', 0.90], integrates: ['ts', 0.80],
  // built around someone else's platform — the dependence runs the other way
  path_dependent_on: ['st', 1.00], optimizes_for: ['st', 0.90], standardizes_on: ['st', 0.90],
  // lock-in — the strongest form of "cannot leave"
  locks_in_developers: ['ts', 1.00], locks_in_platforms: ['ts', 1.00],
  // purchase
  customer_of: ['st', 0.90],
  // mutual: engineering or roadmaps on both sides, so half each way
  co_designs: ['both', 0.60], enables_interop: ['both', 0.50], strategic_partner: ['both', 0.40],
  // demand — real, but a seller depends on its buyers far less than the reverse
  validates_demand: ['ts', 0.50], proves_roi: ['ts', 0.40], proves_use_case: ['ts', 0.40],
  // capital — money is the most substitutable input on the map
  board_seat: ['ts', 0.60], funded_by: ['st', 0.50], invests_in: ['ts', 0.45],
  // standing
  sets_benchmark: ['ts', 0.40], defines_category: ['ts', 0.40],
  // control — orientation is resolved by ROLE, not by the verb. See below.
  controls_access_to: ['ts', 1.00], export_controlled_by: ['ts', 1.00],
  geopolitically_dependent: ['ts', 1.00], subject_to_restriction: ['ts', 0.70],
  // rivalry — carries NO weight. Being competed with does not make you
  // load-bearing: AMD competing with NVIDIA must not lend NVIDIA rank.
  // Substitution is handled per-link instead, inside substanceOf().
  competes_with: null, is_alternative_to: null, threatens: null,
  could_disrupt: null, hedges_against: null, diversifies_supply: null,
};

// The payload is inconsistent on control edges — `bis —export_controlled_by→
// nvidia` and `nvidia —subject_to_restriction→ china` point OPPOSITE ways for
// the same real relation. Reading the verb would flip half of them. So for
// this family the side whose role is `state` is the gate, always, and the
// other side is the one that depends on it. Fixing this moved Taiwan from 38
// to 64 and BIS from 38 to 54.
const CONTROL_FAMILY = new Set([
  'controls_access_to', 'export_controlled_by', 'subject_to_restriction', 'geopolitically_dependent',
]);

// An unconfirmed edge should move less weight than a filed-and-quoted one.
const STATUS_FACTOR = { confirmed: 1.0, high_confidence: 0.9, signal: 0.6 };

/**
 * How much dependence one edge actually carries, 0–1, from fields the engine
 * already annotates. `substitutability` is the substitution answer done right,
 * per link: if TSMC could swap Lam Research tomorrow, little of TSMC's weight
 * should ever reach Lam.
 */
function substanceOf(e) {
  const strength = (typeof e.strength === 'number' ? e.strength : 50) / 100;
  const lock = (typeof e.lockInDepth === 'number' ? e.lockInDepth : 50) / 100;
  const irreplaceable = 1 - (typeof e.substitutability === 'number' ? e.substitutability : 50) / 100;
  const evidence = (typeof e.confidence === 'number' ? e.confidence : 0.8)
    * (STATUS_FACTOR[e.status] ?? 0.8);
  return (0.50 * strength + 0.30 * lock + 0.20 * irreplaceable) * evidence;
}

// ── 2. Tuning constants ──────────────────────────────────────────────────
const DAMPING = 0.85;   // classic PageRank damping
const COVERAGE_K = 2.0; // see below
const PRIOR_POW = 1.0;  // teleport ∝ criticality^PRIOR_POW
const ITERATIONS = 200;

// The four exponents. They sum to 1, which is what keeps the product a clean
// multiple-of-average. Multiplicative and not additive on purpose: one huge
// term cannot fully rescue a node that is nothing on the other three, and
// there is no "points out of 25" arithmetic to argue with.
const EXP = { influence: 0.50, irreplaceability: 0.20, reach: 0.18, bridge: 0.12 };

const P50 = 50;         // 50 points = exactly network-average
const PER_DOUBLING = 16.6;

/** A ×average multiple → the same 0–100 point scale the headline uses. */
export function pointsOf(multiple) {
  if (!(multiple > 0)) return 0;
  return Math.max(0, Math.min(100, P50 + PER_DOUBLING * Math.log2(multiple)));
}

// ── 3. The metric ────────────────────────────────────────────────────────
/**
 * @param  entities  built entities (need id, criticality, primaryLayer, role, centrality)
 * @param  edges     built edges (need sourceId/targetId, type, strength, lockInDepth,
 *                   substitutability, confidence, status)
 * @return Map id → weight block, and nothing is mutated.
 */
export function computeWeights(entities, edges) {
  const out = new Map();
  const ids = entities.map(e => e.id);
  const N = ids.length;
  if (!N) return out;
  const byId = new Map(entities.map(e => [e.id, e]));
  const critOf = (id) => Math.max(1, byId.get(id)?.criticality || 0);

  // ── the dependency graph: [dependent, dependedOn, weight] ──
  const dep = [];
  (edges || []).forEach(e => {
    const rule = ORIENT[e.type];
    if (rule === null) return;                       // rivalry — carries nothing
    let [orient, classW] = rule || ['ts', 0.50];     // unknown type → neutral supply
    const src = e.sourceId || e.source;
    const tgt = e.targetId || e.target;
    if (!byId.has(src) || !byId.has(tgt)) return;
    if (CONTROL_FAMILY.has(e.type)) {
      const srcState = byId.get(src).role === 'state';
      const tgtState = byId.get(tgt).role === 'state';
      if (srcState !== tgtState) orient = srcState ? 'ts' : 'st';
    }
    const w = substanceOf(e) * classW;
    if (w <= 0) return;
    if (orient === 'ts') dep.push([tgt, src, w, e]);
    else if (orient === 'st') dep.push([src, tgt, w, e]);
    else { dep.push([tgt, src, w * 0.5, e]); dep.push([src, tgt, w * 0.5, e]); }
  });

  const outDeg = new Map(ids.map(id => [id, 0]));
  const outW = new Map(ids.map(id => [id, 0]));
  const inbound = new Map(ids.map(id => [id, []]));
  dep.forEach(([u, v, w, e]) => {
    outDeg.set(u, outDeg.get(u) + 1);
    outW.set(u, outW.get(u) + w);
    inbound.get(v).push({ from: u, w, edge: e });
  });

  // ── 3a. Влияние — personalised, coverage-damped PageRank ──
  //
  // Two departures from textbook PageRank, both deliberate:
  //
  // TELEPORT ∝ CRITICALITY. Classic PageRank teleports uniformly — every node
  // equally important a priori. Here the hand-scored, source-backed rubric is
  // what seeds the fixed point, so depending on a criticality-96 node is worth
  // structurally more than depending on a criticality-30 node before a single
  // edge is counted. This is where the rubric enters the recursion.
  //
  // COVERAGE DAMPING. Textbook PageRank splits a node's mass across its
  // out-edges, which in a hand-built map is dangerous: a node with ONE modeled
  // dependency hands it 100% of NVIDIA's inherited weight, and a small supplier
  // rockets into the top ten purely because we were lazy about modelling. So a
  // node forwards only  d·out/(out+k)  of its mass and the rest leaks back to
  // teleport: 1 dependency forwards 28%, 5 forwards 61%, 15 forwards 75%. In
  // one sentence — we propagate only as much influence as we have evidence for.
  const priorSum = ids.reduce((s, id) => s + Math.pow(critOf(id), PRIOR_POW), 0);
  const prior = new Map(ids.map(id => [id, Math.pow(critOf(id), PRIOR_POW) / priorSum]));
  const share = new Map(ids.map(id => [
    id, outW.get(id) > 0 ? DAMPING * (outDeg.get(id) / (outDeg.get(id) + COVERAGE_K)) : 0,
  ]));

  let r = new Map(ids.map(id => [id, 1 / N]));
  for (let it = 0; it < ITERATIONS; it++) {
    const next = new Map(ids.map(id => [id, 0]));
    let leak = 0;
    ids.forEach(id => { leak += r.get(id) * (1 - share.get(id)); });
    dep.forEach(([u, v, w]) => {
      const s = share.get(u);
      if (s > 0) next.set(v, next.get(v) + r.get(u) * s * (w / outW.get(u)));
    });
    let total = 0;
    ids.forEach(id => {
      const v = next.get(id) + leak * prior.get(id);
      next.set(id, v); total += v;
    });
    if (total > 0) ids.forEach(id => next.set(id, next.get(id) / total));
    r = next;
  }

  // ── 3b. Охват — the EFFECTIVE number of layers that lean on it ──
  // Twelve dependents inside one clique is not the same as six spread across
  // six layers. Shannon entropy of the weighted layer distribution of the
  // dependents, exponentiated: 1.0 = they all sit in one layer, 5.0 = the
  // dependence comes from five layers evenly. This is what gravity's «задевает
  // N слоёв» was reaching for, done as a real diversity measure.
  const reachOf = new Map();
  const layersOf = new Map();
  ids.forEach(id => {
    const byLayer = new Map();
    inbound.get(id).forEach(({ from, w }) => {
      const l = byId.get(from)?.primaryLayer || '?';
      byLayer.set(l, (byLayer.get(l) || 0) + w);
    });
    const total = [...byLayer.values()].reduce((s, v) => s + v, 0);
    layersOf.set(id, byLayer.size);
    if (total <= 0) { reachOf.set(id, 1); return; }
    let H = 0;
    byLayer.forEach(v => { const p = v / total; if (p > 0) H -= p * Math.log(p); });
    reachOf.set(id, Math.exp(H));
  });

  // ── 3c. Ломкость — the bridge term PageRank is blind to ──
  // A node can be structurally irreplaceable not because much depends on it but
  // because it is the only ROUTE between two halves of the network. That is
  // betweenness, which the engine already computes; where a payload has none
  // the term is 1 for everyone and drops out of the product harmlessly.
  const bridgeOf = new Map(ids.map(id => [
    id, 1 + (byId.get(id)?.centrality?.betweenness || 0),
  ]));

  // ── 3d. Compose ──
  const normalise = (m) => {
    const mean = ids.reduce((s, id) => s + m.get(id), 0) / N;
    return new Map(ids.map(id => [id, mean > 0 ? m.get(id) / mean : 1]));
  };
  const P = normalise(r);
  const C = normalise(new Map(ids.map(id => [id, critOf(id)])));
  const R = normalise(reachOf);
  const B = normalise(bridgeOf);

  const raw = new Map(ids.map(id => [id,
    Math.pow(Math.max(P.get(id), 1e-9), EXP.influence)
    * Math.pow(Math.max(C.get(id), 1e-9), EXP.irreplaceability)
    * Math.pow(Math.max(R.get(id), 1e-9), EXP.reach)
    * Math.pow(Math.max(B.get(id), 1e-9), EXP.bridge)]));
  const I = normalise(raw);

  const ranked = [...ids].sort((a, b) => I.get(b) - I.get(a));
  const rankOf = new Map(ranked.map((id, i) => [id, i + 1]));

  ids.forEach(id => {
    const dependents = inbound.get(id);
    const top = [...dependents].sort((a, b) => b.w - a.w).slice(0, 3)
      .map(d => ({ id: d.from, name: byId.get(d.from)?.name || d.from }));
    out.set(id, {
      score: Math.round(pointsOf(I.get(id))),
      rank: rankOf.get(id),
      of: N,
      // the four ingredients, each a ×average multiple
      influence: P.get(id),
      irreplaceability: C.get(id),
      reach: R.get(id),
      bridge: B.get(id),
      // the plain facts behind them, for the one-line reads in the panel
      dependents: dependents.length,
      reachLayers: reachOf.get(id),
      layersTouched: layersOf.get(id),
      betweenness: byId.get(id)?.centrality?.betweenness ?? null,
      topDependents: top,
    });
  });
  return out;
}

// ── 4. Display taxonomy ──────────────────────────────────────────────────
// Same shape as CRITICALITY_FACTORS so the panel renders both with one
// component. `bi()` and not `t()` — this is a module-level table, and calling
// the translator at import time is the mistake the build gate exists to catch.
export const WEIGHT_FACTORS = [
  bi({
    label:    ['Влияние', 'Influence'],
    question: ['Насколько важно то, что на неё опирается',
               'How important the things leaning on it are'],
    blurb:    ['PageRank по графу зависимостей: вес приходит не от числа связей, а от того, кто именно зависит. Ссылка от NVIDIA стоит больше, чем ссылка от венчурного фонда, и считается это не суммой, а неподвижной точкой — важен тот, на кого опираются важные.',
               'PageRank over the dependency graph: weight comes not from the number of links but from who exactly depends on you. A link from NVIDIA is worth more than a link from a venture fund, and it is solved as a fixed point rather than a sum — you are important if important things lean on you.'],
  }, { key: 'influence', weight: EXP.influence }),
  bi({
    label:    ['Незаменимость', 'Irreplaceability'],
    question: ['Насколько трудно заменить её саму по себе',
               'How hard it is to replace on its own merits'],
    blurb:    ['Оценка по рубрике из четырёх факторов — та самая критичность, размеченная движком по источникам. Позиция в графе без неё врёт: монополист с одним размеченным ребром не должен проваливаться в середину.',
               "The four-factor rubric score — criticality as the engine marks it up against sources. Graph position alone lies without it: a monopolist with a single modeled edge should not fall to the middle."],
  }, { key: 'irreplaceability', weight: EXP.irreplaceability }),
  bi({
    label:    ['Охват', 'Reach'],
    question: ['Из скольких РАЗНЫХ слоёв на неё опираются',
               'How many DIFFERENT layers lean on it'],
    blurb:    ['Эффективное число слоёв среди зависящих — энтропия их распределения. Двенадцать связей внутри одной клики весят меньше, чем шесть из шести разных слоёв: отраслевой узел тот, кого нельзя обойти ни с какой стороны.',
               'The effective number of layers among the dependents — the entropy of their distribution. Twelve links inside one clique weigh less than six across six layers: an industry-wide node is one you cannot route around from any direction.'],
  }, { key: 'reach', weight: EXP.reach }),
  bi({
    label:    ['Ломкость', 'Bridge'],
    question: ['Что порвётся в сети, если её убрать',
               'What tears in the network if it is removed'],
    blurb:    ['Посредничество: доля кратчайших путей, проходящих через узел. Ловит то, чего не видит PageRank, — сущность может быть незаменима не потому, что на неё многое опирается, а потому, что она единственная дорога между двумя половинами карты.',
               'Betweenness: the share of shortest paths that run through the node. Catches what PageRank is blind to — an entity can be irreplaceable not because much depends on it but because it is the only road between two halves of the map.'],
  }, { key: 'bridge', weight: EXP.bridge }),
];

/** Band for a 0–100 systemic weight. Same cut-and-colour language as criticality. */
export function weightBand(s) {
  if (s == null) return bi({ label: ['Не оценено', 'Not scored'] }, { color: '#94A3B8' });
  if (s >= 85) return bi({ label: ['Опора', 'Load-bearing'] }, { color: '#E5484D' });
  if (s >= 65) return bi({ label: ['Несущий узел', 'Structural'] }, { color: '#E0A340' });
  if (s >= 50) return bi({ label: ['Значимый', 'Significant'] }, { color: '#58ABCB' });
  if (s >= 35) return bi({ label: ['Второй ряд', 'Second row'] }, { color: '#7FA8C4' });
  return bi({ label: ['Периферия', 'Periphery'] }, { color: '#49C2AE' });
}
