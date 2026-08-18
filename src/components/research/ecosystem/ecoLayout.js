// ══════════════════════════════════════════════════════════════════════════
// "Stack rings" — the ecosystem layout. Deterministic, pinned, no simulation
// (same contract as capitalflow/layout.js: run it twice, get the same pixels).
//
// Read from the centre out:
//   · RING     — one per layer. L1 (raw inputs) at the centre, L12 (models)
//     at the rim. Radius IS the layer, which is the whole point: a supply
//     chain then draws as a RAY from the middle outward instead of a knot.
//   · ARC      — inside a ring, nodes group by SECTOR. Arcs are only as wide
//     as their contents (rings are NOT force-filled), so a sparse layer stays
//     sparse and its members stay next to the neighbours they trade with.
//   · CAPSULE  — a company is ONE object even when it lives in several layers.
//     It is drawn as a radial ribbon spanning its lowest layer to its highest,
//     thick where it is critical, hair-thin where it is only passing through.
//     Alphabet is one capsule crossing L3 · L10 · L12, never three circles.
//   · PORTS    — the capsule carries a docking point PER LAYER. A chain going
//     through Google Cloud enters Alphabet at L10 and leaves at L12; it does
//     not collapse into the node's centre. This is the reason the capsule
//     exists at all.
//
// ANGLE ASSIGNMENT, in four passes:
//   1. sector barycentre — sectors that trade with each other pull together,
//      anchored to a canonical seed so the whole thing cannot collapse;
//   2. per-ring arc placement — arcs centred on their preferred angle, then a
//      1-D de-overlap inside the label corridor;
//   3. nodes inside their arc, most critical at the middle;
//   4. cross-ring de-overlap — a multi-layer capsule occupies angular space in
//      EVERY ring it crosses, so single-layer nodes there have to make room.
//      Displacements from all its rings are averaged, which is what keeps one
//      capsule from being torn in two directions at once.
//
// Everything below is geometry over whatever the file contains. No company,
// layer or sector is named anywhere in this file.
// ══════════════════════════════════════════════════════════════════════════

import { critIn } from '../../../data/ecosystemMap.js';

// ── Dial ────────────────────────────────────────────────────────────────
const R0 = 260;          // inner hole: L1's radius. Big enough that the first
                         // ring has real circumference to lay nodes on.
const BAND = 130;        // radial distance between consecutive layers
const HW_MIN = 15;       // capsule half-width at criticality 0
const HW_MAX = 41;       // ...and at 100
const BRIDGE = 9;        // half-width in a layer the company only passes through
const NODE_PAD = 30;     // graph units of clear space between neighbours in a ring
const ARC_PAD = 74;      // ...and between two sector arcs
// A corridor left free at 12 o'clock for the twelve ring labels, so a label
// never lands on a node. Angles are therefore laid out on a LINE, not a
// circle, which also makes the de-overlap passes trivial and stable.
const CORRIDOR = 0.30;   // radians
const A0 = -Math.PI / 2 + CORRIDOR / 2;
const A1 = A0 + 2 * Math.PI - CORRIDOR;

export const layerRadius = (idx) => R0 + (idx - 1) * BAND;
export const RING_STEP = BAND;
export const INNER_R = R0;
/**
 * Radius the camera has to cover to show the whole wheel.
 *
 * The canvas frames on THIS, not on `zoomToFit`: the node cloud is rarely
 * symmetric, and the ring labels live at 12 o'clock out at the rim, well
 * outside any node bbox — fitting the bbox therefore both off-centres the
 * wheel and clips its outermost labels.
 */
export const mapRadius = (layerCount = 12) => layerRadius(layerCount) + HW_MAX + 46;

/** Capsule half-width (perpendicular to the radius) for a criticality score. */
export function halfWidth(criticality) {
  return HW_MIN + (HW_MAX - HW_MIN) * Math.max(0, Math.min(100, criticality || 0)) / 100;
}

// ── Small helpers ───────────────────────────────────────────────────────
const clampAngle = (a) => Math.max(A0, Math.min(A1, a));

/** Circular mean of angles with weights — used by the barycentre pass. */
function meanAngle(items) {
  let x = 0, y = 0;
  items.forEach(([a, w]) => { x += Math.cos(a) * w; y += Math.sin(a) * w; });
  return (x === 0 && y === 0) ? null : Math.atan2(y, x);
}

/**
 * 1-D de-overlap on a bounded line. `items` carry {pos, half}; they are pushed
 * apart until no pair overlaps, then clamped back inside [lo, hi]. Both passes
 * below (arcs in a ring, nodes across rings) are this same routine.
 */
function separate(items, lo, hi, iterations, damping = 0.5) {
  if (items.length < 2) {
    items.forEach(it => { it.pos = Math.max(lo + it.half, Math.min(hi - it.half, it.pos)); });
    return;
  }
  for (let it = 0; it < iterations; it++) {
    items.sort((a, b) => a.pos - b.pos);
    let moved = false;
    for (let i = 0; i < items.length - 1; i++) {
      const a = items[i], b = items[i + 1];
      const need = a.half + b.half;
      const gap = b.pos - a.pos;
      if (gap < need) {
        moved = true;
        const push = (need - gap) / 2 * damping;
        a.pos -= push; b.pos += push;
      }
    }
    items.forEach(x => { x.pos = Math.max(lo + x.half, Math.min(hi - x.half, x.pos)); });
    if (!moved) break;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// applyEcoLayout — pins every node and returns the rings to paint.
// Mutates the (memoised) node objects, exactly like applyMoleculeLayout does.
// ══════════════════════════════════════════════════════════════════════════
export function applyEcoLayout(graph) {
  const { nodes, edges, layers, nodeById, sectors } = graph;

  // ── 0. Geometry per node ───────────────────────────────────────────────
  nodes.forEach(n => {
    n._segGeo = n.segments.map(s => ({
      layer: s.layer,
      idx: s.idx,
      criticality: s.criticality || 0,
      r: layerRadius(s.idx),
      hw: halfWidth(s.criticality),
      primary: !!s.primary,
    }));
    n._primaryGeo = n._segGeo.find(s => s.layer === n.primaryLayer) || n._segGeo[0];
    // Angular room the node needs in a given ring: its own width plus padding,
    // converted from graph units to radians at that ring's radius.
    n._needAt = (idx) => {
      const seg = n._segGeo.find(s => s.idx === idx);
      const hw = seg ? seg.hw : BRIDGE;
      return (hw + NODE_PAD / 2) / layerRadius(idx);
    };
  });

  // ── 1. Sector seriation ────────────────────────────────────────────────
  // What has to be true for a chain to read as a RAY: the sectors it passes
  // through must sit at roughly the same bearing, ring after ring.
  //
  // A plain barycentre on ANGLES cannot deliver that — on a connected graph it
  // drifts every sector toward the centroid and the wheel piles up on one side
  // (it did, twice). So the barycentre runs on ORDER instead: each round the
  // sectors are re-sorted by their neighbours' mean rank and then handed fresh,
  // evenly-spaced ranks. Only the sequence can change, never the spread, so
  // collapse is structurally impossible while "sectors that trade end up
  // adjacent" still converges.
  const sectorList = sectors.length ? sectors.slice() : (() => {
    const seen = new Map();
    nodes.forEach(n => { if (n.sector && !seen.has(n.sector)) seen.set(n.sector, { key: n.sector, layer: n.primaryLayer }); });
    return [...seen.values()];
  })();
  // Sectors with no company of their own never get an arc — skip them so they
  // don't reserve empty wedges.
  const owned = new Set(nodes.map(n => n.sector));
  const active = sectorList.filter(s => owned.has(s.key));
  const layerOfSector = new Map(active.map(s => [s.key, s.layer]));

  // sector ↔ sector affinity, weighted by edge strength
  const affinity = new Map();       // sector key → [[otherKey, weight], …]
  const bump = (a, b, w) => {
    if (!a || !b || a === b) return;
    const list = affinity.get(a) || [];
    const hit = list.find(x => x[0] === b);
    if (hit) hit[1] += w; else list.push([b, w]);
    affinity.set(a, list);
  };
  edges.forEach(e => {
    const s = nodeById.get(e.sourceId)?.sector, t = nodeById.get(e.targetId)?.sector;
    const w = Math.max(1, e.strength || 0);
    bump(s, t, w); bump(t, s, w);
  });

  // Canonical seed order: down the stack, then the file's own sector order.
  let order = active
    .map((s, i) => ({ key: s.key, i, li: layers.findIndex(l => l.id === s.layer) }))
    .sort((a, b) => (a.li - b.li) || (a.i - b.i))
    .map(s => s.key);

  // The seriation is CIRCULAR, and it has to be: the ring is a circle, so
  // ranks 0 and N-1 are neighbours, not opposites. A linear barycentre marooned
  // the silicon thread at one end and its own customers at the other. Ranks are
  // therefore mapped onto a circle, averaged as vectors, and re-sorted.
  //
  // Barycentre iteration does not monotonically improve — it happily cycles —
  // so every round is COSTED (Σ weight × circular rank distance) and the best
  // order seen is what survives. Without that the layout depended on which
  // iteration the loop happened to stop at.
  const N = Math.max(1, order.length);
  const rankAngle = (r) => (2 * Math.PI * r) / N;
  const circDist = (a, b) => { const d = Math.abs(a - b) % N; return Math.min(d, N - d); };
  const costOf = (ord) => {
    const rank = new Map(ord.map((k, i) => [k, i]));
    let c = 0;
    ord.forEach(k => (affinity.get(k) || []).forEach(([o, w]) => {
      if (rank.has(o)) c += w * circDist(rank.get(k), rank.get(o));
    }));
    return c;
  };

  let best = order.slice();
  let bestCost = costOf(order);
  for (let it = 0; it < 300; it++) {
    const rank = new Map(order.map((k, i) => [k, i]));
    const score = new Map();
    order.forEach(k => {
      const nb = (affinity.get(k) || []).filter(([o]) => rank.has(o));
      const tot = nb.reduce((s, [, w]) => s + w, 0);
      if (!tot) { score.set(k, rankAngle(rank.get(k))); return; }
      let x = 0, y = 0;
      nb.forEach(([o, w]) => {
        const a = rankAngle(rank.get(o));
        x += Math.cos(a) * w; y += Math.sin(a) * w;
      });
      // A trace of its own rank breaks ties and keeps single-neighbour sectors
      // from thrashing; deliberately small so it cannot freeze a bad optimum.
      const own = rankAngle(rank.get(k));
      x += Math.cos(own) * tot * 0.12; y += Math.sin(own) * tot * 0.12;
      score.set(k, Math.atan2(y, x));
    });
    const norm = (a) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    order = [...order].sort((a, b) => (norm(score.get(a)) - norm(score.get(b))) || a.localeCompare(b));
    const c = costOf(order);
    if (c < bestCost) { bestCost = c; best = order.slice(); }
  }
  order = best;

  // The circle has to be cut somewhere — the label corridor is that cut. Put
  // it where the wheel already wants to break: between the two adjacent
  // sectors that trade with each other least.
  if (order.length > 2) {
    const wBetween = (a, b) => ((affinity.get(a) || []).find(x => x[0] === b) || [, 0])[1];
    let seam = 0, seamW = Infinity;
    for (let i = 0; i < order.length; i++) {
      const w = wBetween(order[i], order[(i + 1) % order.length]);
      if (w < seamW) { seamW = w; seam = i + 1; }
    }
    order = [...order.slice(seam), ...order.slice(0, seam)];
  }

  // ── 2. Sector angles — one walk, with a cursor PER RING ────────────────
  // Two sectors in the SAME ring must not overlap. Two sectors in DIFFERENT
  // rings may sit at exactly the same bearing — and should, because that is
  // what a vertical thread through the stack looks like. So the walk advances a
  // shared cursor slowly (SPREAD) while each ring keeps its own high-water
  // mark; sectors that follow each other up the stack land on top of one
  // another instead of being fanned apart.
  const arcWidth = new Map();       // sector key → radians needed IN ITS RING
  const arcShare = new Map();       // sector key → share of the wheel it earns
  active.forEach(s => {
    const layer = layerById(layers, s.layer);
    const members = nodes.filter(n => n.primaryLayer === s.layer && n.sector === s.key);
    const span = members.reduce((acc, n) => acc + 2 * n._needAt(layer.idx), 0);
    arcWidth.set(s.key, span + ARC_PAD / layerRadius(layer.idx));
    // The cursor's advance must NOT be the ring-local width. A node on the
    // inner ring subtends several times the angle of the same node on the rim,
    // so pacing the walk by radians hands the whole wheel to L1–L3 and packs
    // everything from L9 out into a wedge (it did — 20 of 45 companies inside
    // 60°). Pace it by CONTENT instead, which is radius-independent.
    arcShare.set(s.key, members.length + 0.4);
  });
  // Two pacings, blended, because each alone fails in a different direction:
  //   · by RING-LOCAL width — vertical threads stay tight (a chain reads as a
  //     ray) but the inner rings eat the wheel and everything from L9 out packs
  //     into a wedge;
  //   · by CONTENT — companies spread evenly around the wheel, but consecutive
  //     sectors of one thread drift ~40° apart and the chain becomes a sweep.
  // BLEND is the dial between "even wheel" and "straight chains".
  const BLEND = 0.55;               // 0 = all ring-local, 1 = all content
  const span = A1 - A0;
  const normalise = (map) => {
    const total = [...map.values()].reduce((a, b) => a + b, 0) || 1;
    return (k) => ((map.get(k) || 0) / total) * span;
  };
  const paceLocal = normalise(arcWidth);
  const paceShare = normalise(arcShare);

  const sectorAngle = new Map();
  const ringCursor = new Map();
  let cursor = A0;
  order.forEach(key => {
    const L = layerOfSector.get(key);
    const w = arcWidth.get(key) || 0.05;
    // `cursor` is the shared walk; `ringCursor` is this ring's high-water mark.
    // Taking the later of the two lets two sectors in DIFFERENT rings sit at
    // the same bearing (a vertical thread) while two in the SAME ring cannot.
    const start = Math.max(cursor, ringCursor.get(L) ?? A0);
    sectorAngle.set(key, clampAngle(start + w / 2));
    ringCursor.set(L, start + w);
    cursor += (1 - BLEND) * paceLocal(key) + BLEND * paceShare(key);
  });

  // ── 3. Arcs inside each ring, then nodes inside each arc ───────────────
  // Only nodes whose PRIMARY layer is this ring get an arc slot; a company
  // passing through borrows its angle from its own primary ring (pass 4).
  const angleOf = new Map();        // node id → angle

  layers.forEach(layer => {
    const own = nodes.filter(n => n.primaryLayer === layer.id);
    if (!own.length) return;
    const byS = new Map();
    own.forEach(n => {
      const k = n.sector || '—';
      const list = byS.get(k);
      if (list) list.push(n); else byS.set(k, [n]);
    });
    const arcs = [];
    byS.forEach((members, key) => {
      members.sort((a, b) => critIn(b, layer.id) - critIn(a, layer.id) || a.id.localeCompare(b.id));
      const span = members.reduce((s, n) => s + 2 * n._needAt(layer.idx), 0);
      arcs.push({
        sector: key, members,
        pos: sectorAngle.get(key) ?? (A0 + (A1 - A0) / 2),
        half: span / 2 + ARC_PAD / 2 / layerRadius(layer.idx),
      });
    });
    separate(arcs, A0, A1, 220, 0.6);
    arcs.forEach(arc => {
      // Most critical at the arc's centre, the rest alternating outward, so
      // the ring reads "important in the middle of its group".
      const ordered = [];
      arc.members.forEach((n, i) => (i % 2 ? ordered.unshift(n) : ordered.push(n)));
      let acc = arc.pos - ordered.reduce((s, n) => s + n._needAt(layer.idx), 0);
      ordered.forEach(n => {
        const need = n._needAt(layer.idx);
        acc += need;
        angleOf.set(n.id, acc);
        acc += need;
      });
    });
  });

  // Anything the loop above missed (no primary ring in `layers` — defensive).
  nodes.forEach(n => { if (!angleOf.has(n.id)) angleOf.set(n.id, A0 + (A1 - A0) / 2); });

  // ── 3b. Node-level alignment ───────────────────────────────────────────
  // Sector seriation gets the wheel roughly right, but a hub sector trades
  // with a dozen others and no linear order can seat all of them adjacently.
  // So each node now leans toward the bearing of its own strongest partners,
  // on a LEASH: it may drift at most ±LEASH from its sector arc's centre.
  // Chains straighten, the sector grouping survives, and the plan's harder
  // requirement — a chain must read as a ray, not a knot — wins where the two
  // pull against each other.
  const LEASH = 0.55;               // radians ≈ 31°
  const homeAngle = new Map(angleOf);
  const neighboursOf = new Map();
  edges.forEach(e => {
    const w = Math.max(1, e.strength || 0);
    const a = neighboursOf.get(e.sourceId) || [];
    a.push([e.targetId, w]); neighboursOf.set(e.sourceId, a);
    const b = neighboursOf.get(e.targetId) || [];
    b.push([e.sourceId, w]); neighboursOf.set(e.targetId, b);
  });
  for (let it = 0; it < 60; it++) {
    const next = new Map();
    nodes.forEach(n => {
      const nb = (neighboursOf.get(n.id) || []).filter(([id]) => angleOf.has(id));
      if (!nb.length) return;
      const tot = nb.reduce((s, [, w]) => s + w, 0);
      const target = meanAngle(nb.map(([id, w]) => [angleOf.get(id), w / tot]));
      if (target == null) return;
      const home = homeAngle.get(n.id);
      let want = angleOf.get(n.id) + angleDelta(angleOf.get(n.id), target) * 0.16;
      want = Math.max(home - LEASH, Math.min(home + LEASH, want));
      next.set(n.id, clampAngle(want));
    });
    next.forEach((v, k) => angleOf.set(k, v));
  }

  // ── 4. Cross-ring de-overlap ───────────────────────────────────────────
  // A capsule owns angular space in every ring it crosses. Each ring proposes
  // a correction; a node applies the AVERAGE of its rings' proposals, so a
  // three-layer capsule is not pulled apart by three rings at once.
  const ringMembers = layers.map(l => ({
    layer: l,
    members: nodes.filter(n => n.minIdx <= l.idx && n.maxIdx >= l.idx),
  })).filter(r => r.members.length > 1);

  for (let pass = 0; pass < 90; pass++) {
    const delta = new Map();       // node id → [sum, count]
    ringMembers.forEach(({ layer, members }) => {
      const items = members.map(n => ({
        id: n.id, pos: angleOf.get(n.id), half: n._needAt(layer.idx),
      }));
      separate(items, A0, A1, 6, 0.5);
      items.forEach(it => {
        const d = it.pos - angleOf.get(it.id);
        const cur = delta.get(it.id) || [0, 0];
        delta.set(it.id, [cur[0] + d, cur[1] + 1]);
      });
    });
    let maxMove = 0;
    delta.forEach(([sum, count], id) => {
      const d = sum / count;
      maxMove = Math.max(maxMove, Math.abs(d));
      angleOf.set(id, clampAngle(angleOf.get(id) + d));
    });
    if (maxMove < 0.0004) break;
  }

  // ── 5. Pin coordinates + build the per-layer docking ports ─────────────
  nodes.forEach(n => {
    const a = angleOf.get(n.id);
    n._angle = a;
    n._ports = new Map();
    n._segGeo.forEach(s => {
      s.angle = a;
      s.x = Math.cos(a) * s.r;
      s.y = Math.sin(a) * s.r;
      n._ports.set(s.idx, { x: s.x, y: s.y, r: s.r, hw: s.hw });
    });
    // The capsule's radial extent, caps included.
    n._rIn = layerRadius(n.minIdx) - n._segGeo[0].hw;
    n._rOut = layerRadius(n.maxIdx) + n._segGeo[n._segGeo.length - 1].hw;
    // force-graph anchors hover/zoom at x/y — put those on the primary layer,
    // which is also where the logo and the label go.
    const p = n._primaryGeo;
    n.fx = p.x; n.fy = p.y; n.x = p.x; n.y = p.y;
    n._labelScale = labelScale(n);
  });

  // ── 6. Edge ports — WHICH layer each end docks at ──────────────────────
  // Physical dependency runs bottom-up, so an edge leaves the source at the
  // layer closest to (but not above) the target, and arrives at the target's
  // layer closest to (but not below) that. When neither side offers such a
  // layer we fall back to the nearest one. This is what makes a chain enter
  // a multi-layer company at L10 and leave it at L12.
  edges.forEach(e => {
    const s = nodeById.get(e.sourceId), t = nodeById.get(e.targetId);
    if (!s || !t) return;
    const sIdx = pickLayer(s, t.primaryIdx, 'below');
    const tIdx = pickLayer(t, sIdx, 'above');
    const p0 = s._ports.get(sIdx) || s._ports.get(s.primaryIdx);
    const p1 = t._ports.get(tIdx) || t._ports.get(t.primaryIdx);
    e._sIdx = sIdx; e._tIdx = tIdx;
    e._x0 = p0.x; e._y0 = p0.y;
    e._x1 = p1.x; e._y1 = p1.y;
    // A gentle bow, always the same sign for a given pair, so two edges
    // between the same companies never sit on top of each other.
    const sameRing = Math.abs(p0.r - p1.r) < 1;
    e._bow = (sameRing ? 0.28 : 0.10) * (e.id.charCodeAt(0) % 2 ? 1 : -1);
  });

  // ── 7. Tech-node satellites — a small mark beside the owner ────────────
  graph.techNodes.forEach((t, i) => {
    const owner = nodeById.get(t.owner);
    if (!owner) { t._x = null; return; }
    const p = owner._primaryGeo;
    // Just outside the capsule, offset sideways; alternate the side so two
    // marks on the same owner do not collide.
    const side = i % 2 ? 1 : -1;
    const off = (p.hw + 26) / p.r;
    const a = owner._angle + off * side;
    const r = p.r + (i % 4) * 9 - 13;
    t._x = Math.cos(a) * r;
    t._y = Math.sin(a) * r;
    t._ownerName = owner.name;
  });

  // ── 8. Rings to paint ──────────────────────────────────────────────────
  return layers.map(l => ({
    key: l.id,
    idx: l.idx,
    r: layerRadius(l.idx),
    inner: layerRadius(l.idx) - BAND / 2,
    outer: layerRadius(l.idx) + BAND / 2,
    label: l.label,
    caption: l.caption,
    band: l.band,
    color: l.bandColor,
    concentration: l.concentration,
    concentrationMeta: l.concentrationMeta,
    count: l.nodeCount,
    // The label corridor: 12 o'clock, just inside the ring.
    labelAngle: -Math.PI / 2,
  }));
}

const layerById = (layers, id) => layers.find(l => l.id === id) || layers[0];

/** Signed shortest delta from a to b, in (-π, π]. */
function angleDelta(a, b) {
  let d = (b - a) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/**
 * The layer of `node` an edge should dock at, given the other end's layer.
 * `prefer: 'below'` → the highest own layer at or under `target`;
 * `prefer: 'above'` → the lowest own layer at or over `target`.
 * Falls back to the nearest layer when the preferred side is empty.
 */
function pickLayer(node, targetIdx, prefer) {
  const idxs = node._segGeo.map(s => s.idx);
  const side = prefer === 'below'
    ? idxs.filter(i => i <= targetIdx)
    : idxs.filter(i => i >= targetIdx);
  const pool = side.length ? side : idxs;
  return pool.reduce((best, i) => (Math.abs(i - targetIdx) < Math.abs(best - targetIdx) ? i : best), pool[0]);
}

/**
 * Zoom at which a node's name appears. Anchors and critical companies label
 * early; the long tail only reveals once you are actually reading that ring.
 */
function labelScale(node) {
  const imp = (node.criticality || 0) / 100
    + (node.tier === 'anchor' ? 0.55 : node.tier === 'core' ? 0.22 : 0)
    + (node.multiLayer ? 0.18 : 0);
  return Math.max(0.16, Math.min(1.6, 1.05 - imp * 0.75));
}

/**
 * The capsule outline, as a closed polygon in graph coordinates.
 *
 * Sampled along the radius: at each of the node's layers the half-width is
 * its criticality THERE; between two layers it tapers through the thin bridge,
 * which is what makes "present · passing through · present" legible as a shape
 * rather than as a uniform bar. Rounded caps at both ends.
 */
export function capsulePath(node, samplesPerGap = 7) {
  const segs = node._segGeo;
  const a = node._angle;
  const stops = [];                 // [radius, halfWidth]
  segs.forEach((s, i) => {
    if (i > 0) {
      const prev = segs[i - 1];
      const gap = s.idx - prev.idx;
      if (gap > 1) {
        // A real hole between two layers: dip to the bridge width and back.
        for (let k = 1; k < samplesPerGap; k++) {
          const t = k / samplesPerGap;
          const r = prev.r + (s.r - prev.r) * t;
          const dip = Math.sin(Math.PI * t);           // 0 → 1 → 0
          const hw = prev.hw + (s.hw - prev.hw) * t;
          stops.push([r, hw + (BRIDGE - hw) * dip]);
        }
      } else {
        for (let k = 1; k < 4; k++) {
          const t = k / 4;
          stops.push([prev.r + (s.r - prev.r) * t, smooth(prev.hw, s.hw, t)]);
        }
      }
    }
    stops.push([s.r, s.hw]);
  });

  const left = [], right = [];
  stops.forEach(([r, hw]) => {
    const d = hw / r;
    left.push([Math.cos(a - d) * r, Math.sin(a - d) * r]);
    right.push([Math.cos(a + d) * r, Math.sin(a + d) * r]);
  });

  // Rounded caps: quarter-circles of radius = the end half-width.
  const cap = (r, hw, outward) => {
    const pts = [];
    for (let k = 1; k <= 5; k++) {
      const t = (k / 6) * Math.PI;
      const rr = r + (outward ? 1 : -1) * hw * Math.sin(t);
      const d = (hw * Math.cos(t)) / Math.max(1, rr);
      pts.push([Math.cos(a + (outward ? -d : d)) * rr, Math.sin(a + (outward ? -d : d)) * rr]);
    }
    return pts;
  };
  const first = stops[0], last = stops[stops.length - 1];

  return [
    ...left,
    ...cap(last[0], last[1], true),
    ...right.slice().reverse(),
    ...cap(first[0], first[1], false),
  ];
}

const smooth = (a, b, t) => a + (b - a) * (t * t * (3 - 2 * t));
