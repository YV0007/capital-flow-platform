// ══════════════════════════════════════════════════════════════════════════
// Ecosystem layout — the SAME "capital atom" molecule as the flow map.
//
// The first version of this file drew twelve concentric rings, one per layer.
// It was thrown away: radius-as-layer is defensible on paper and unreadable in
// practice — the wheel reads as a target rather than as an industry, and every
// edge becomes a long chord across it. The two maps are meant to FEEL
// identical and differ only in what they are ABOUT, so this is now the flow
// map's geometry with ecosystem content poured into it. The packing itself is
// imported from `capitalflow/layout.js` rather than reimplemented, so the two
// cannot drift apart.
//
// Read from the centre out:
//   · NUCLEUS — companies whose role is `capital`. They are the second
//     backbone: they own and finance the stack without standing in it, which
//     is exactly the position the flow map's allocators occupy. Its bonds
//     leave the middle already pointing at the layer they reach into.
//   · ORBIT   — one compact CELL per layer, placed around the ring in stack
//     order (L1 raw inputs at 12 o'clock, walking clockwise to L12 models).
//     The sequence is the navigation.
//   · Inside a cell, companies are circle-packed, sector-mates adjacent and
//     the most critical at the core.
//
// A company living in several layers is still ONE node — it sits in its
// primary layer's cell and carries the others as a badge. No duplicates.
//
// Deterministic + pinned (fx/fy) — no simulation, no per-reload drift.
// ══════════════════════════════════════════════════════════════════════════

import { packRelative, hash01 } from '../capitalflow/layout.js';
import { shortLabel } from '../capitalflow/format.js';
import { ROLE_META, BAND_META, CONCENTRATION_META, critIn } from '../../../data/ecosystemMap.js';

// ── Node sizing — criticality is this map's "capital" ────────────────────
function sizeAtom(n) {
  // Criticality is a 0-100 rubric, not a power law like the flow map's capital,
  // so the flow map's square root is the wrong curve here: it squeezed the
  // whole field into 26-41px and every company came out roughly the same size,
  // which is a lot of ink for very little information. A gentle 0.85 power
  // spreads the same numbers across 18-38px, so "who is load-bearing" is
  // legible without clicking, and it shrinks the long tail — which is where
  // the crowding was coming from.
  const s = Math.pow(Math.max(0, Math.min(100, n.criticality || 0)) / 100, 0.85);
  n.r = 9 + 29 * s;
  n.atomTier = s > 0.83 ? 0 : s > 0.65 ? 1 : s > 0.42 ? 2 : 3;
  n.atomLabel = shortLabel(n.name, 22);
  // Label priority: the more critical and the higher the tier, the earlier a
  // name appears as you zoom out. Same curve as the flow map.
  const tierBonus = n.tier === 'anchor' ? 0.5 : n.tier === 'core' ? 0.3 : n.tier === 'emerging' ? 0.15 : 0;
  const imp = s + tierBonus;
  n.labelScale = Math.max(0.14, Math.min(1.5, 0.9 - imp * 0.8));
}

// ── Packing footprint — what a company actually occupies ─────────────────
// A company is DRAWN as a square tile of side r*1.85 with its name set to the
// right of it, but the circle packer only knows n.r. Packing by r alone
// under-books every company by the ~31% its corners stick out past the
// inscribed circle, before a single label is counted — which is why cells read
// as crowded and names ran into each other. Everything is packed by the tile's
// true half-diagonal plus a little label room, and n.r is handed straight back
// so the painter still draws the real size.
const TILE_HALF_DIAG = 1.85 * Math.SQRT1_2;   // square side -> half-diagonal
const LABEL_ROOM = 12;
function packTiles(members, spread, pad) {
  members.forEach(n => { n._rDraw = n.r; n.r = n.r * TILE_HALF_DIAG + LABEL_ROOM; });
  const R = packRelative(members, spread, pad);
  members.forEach(n => { n.r = n._rDraw; });
  return R;
}

/**
 * Pins every company into the molecule and returns the regions to paint
 * (one 'capital' nucleus + one 'layer' cell each). Mutates the (memoised)
 * node objects, exactly like applyMoleculeLayout does.
 */
export function applyEcoLayout(graph) {
  const { nodes, edges, layers, nodeById, layerById } = graph;

  nodes.forEach(sizeAtom);

  // The nucleus is the capital spine; everything that physically stands in the
  // stack goes to the orbit. A payload with no `capital` role simply has no
  // nucleus, and the orbit still works.
  const spine = nodes.filter(n => n.role === 'capital');
  const stack = nodes.filter(n => n.role !== 'capital');

  // ── Orbit: one cell per layer that actually holds a company ────────────
  const cellKeyOf = (n) => n.primaryLayer;
  const layerOrder = new Map(layers.map((l, i) => [l.id, l.idx ?? i]));
  const present = [...new Set(stack.map(cellKeyOf))]
    .sort((a, b) => (layerOrder.get(a) ?? 99) - (layerOrder.get(b) ?? 99));
  const N = Math.max(1, present.length);

  // Angular spans weighted by how much a layer holds, so a crowded layer claims
  // more room and the spacing reads organic rather than mechanical.
  const cellWeightOf = {};
  present.forEach(k => {
    cellWeightOf[k] = stack.filter(n => cellKeyOf(n) === k)
      .reduce((s, n) => s + (critIn(n, k) || n.criticality || 0), 0);
  });
  const maxW = Math.max(1, ...present.map(k => cellWeightOf[k]));
  const weights = present.map(k => 0.7 + cellWeightOf[k] / maxW);
  const wsum = weights.reduce((a, b) => a + b, 0) || 1;
  const angleOf = {};
  let accA = -Math.PI / 2;                 // L1 at 12 o'clock, walking clockwise
  present.forEach((k, i) => {
    const span = (2 * Math.PI * weights[i]) / wsum;
    angleOf[k] = accA + span / 2 + (hash01(k, 11) - 0.5) * span * 0.28;
    accA += span;
  });

  const cellR = {}, cellMem = {};
  present.forEach(k => {
    const mem = stack.filter(n => cellKeyOf(n) === k).sort((a, b) =>
      String(a.sector || '').localeCompare(String(b.sector || ''))
      || (critIn(b, k) - critIn(a, k))
      || a.id.localeCompare(b.id));
    cellMem[k] = mem;
    cellR[k] = Math.max(packTiles(mem, 16, 14), 40);
  });

  // ── Reach: how far across the stack a layer actually touches ───────────
  // The angle of a cell is its position in the stack; its RADIUS is how
  // pivotal it is. A layer whose companies trade with many OTHER layers gets
  // pulled toward the middle, one that only talks to its neighbours drifts to
  // the rim. Chips land in the centre because NVIDIA and TSMC touch nearly
  // every layer — but nothing here names chips, or any layer: swap in a
  // payload where power is the hub and power moves to the middle instead.
  const layerOfNode = (id) => nodeById.get(id)?.primaryLayer;
  const touched = {}, degree = {};
  present.forEach(k => { touched[k] = new Set(); degree[k] = 0; });
  edges.forEach(e => {
    const a = layerOfNode(e.sourceId), b = layerOfNode(e.targetId);
    if (a && touched[a]) { degree[a] += 1; if (b && b !== a) touched[a].add(b); }
    if (b && touched[b]) { degree[b] += 1; if (a && a !== b) touched[b].add(a); }
  });
  const maxDeg = Math.max(1, ...present.map(k => degree[k]));
  const reach = {};
  present.forEach(k => {
    const spread = touched[k].size / Math.max(1, N - 1);   // how many layers
    const volume = degree[k] / maxDeg;                     // how many bonds
    reach[k] = 0.62 * spread + 0.38 * volume;
  });
  const maxReach = Math.max(0.0001, ...present.map(k => reach[k]));
  const reachNorm = {};
  present.forEach(k => { reachNorm[k] = reach[k] / maxReach; });

  // ── Nucleus: the capital spine, aimed at what it controls ──────────────
  const outBySpine = {};
  edges.forEach(e => { (outBySpine[e.sourceId] ||= []).push(e); });

  const spineMem = spine.slice().sort((a, b) => (b.criticality || 0) - (a.criticality || 0));
  const spineR = spineMem.length ? Math.max(packTiles(spineMem, 15, 14), 44) : 0;

  let vx = 0, vy = 0;
  spineMem.forEach(a => (outBySpine[a.id] || []).forEach(e => {
    const ang = angleOf[cellKeyOf(nodeById.get(e.targetId) || {})];
    if (ang == null) return;
    const w = Math.max(1, e.strength || 0);
    vx += Math.cos(ang) * w; vy += Math.sin(ang) * w;
  }));
  const spineAngle = (vx === 0 && vy === 0) ? -Math.PI / 2 : Math.atan2(vy, vx);
  const spineCx = spineMem.length ? Math.cos(spineAngle) * spineR * 0.3 : 0;
  const spineCy = spineMem.length ? Math.sin(spineAngle) * spineR * 0.3 : 0;
  spineMem.forEach(n => { n.fx = spineCx + n._ox; n.fy = spineCy + n._oy; n.x = n.fx; n.y = n.fy; });
  const coreR = spineMem.length ? spineR : 0;

  // ── Orbit ring: cells clear each other AND the nucleus ─────────────────
  const GAP_CELL = 250;
  let ring = 0;
  const chord = 2 * Math.sin(Math.PI / N) || 0.0001;
  for (let i = 0; i < N; i++) {
    const a = present[i], b = present[(i + 1) % N];
    ring = Math.max(ring, (cellR[a] + cellR[b] + GAP_CELL) / chord);
  }
  const maxCellR = Math.max(0, ...present.map(k => cellR[k]));
  ring = Math.max(ring, coreR + maxCellR + 340);
  // Pulling the hub layers inward compresses the whole wheel, so the base
  // radius is opened up by roughly what the pull takes back — otherwise the
  // middle turns into a jam and the rim cells sit on each other.
  ring *= 1.2;

  // Radius = reach. The most connected layers sit close in, the peripheral
  // ones ride the rim; a small stable jitter keeps it organic rather than
  // mechanical. Then a de-overlap of the cell centres that also respects the
  // capital nucleus, so an inward-pulled cell cannot land on top of it.
  const cellPos = {};
  present.forEach(k => {
    const pull = 0.42 * reachNorm[k];                       // 0 = rim, 1 = hub
    const rr = ring * (1.02 - pull) * (0.94 + 0.12 * hash01(k, 5));
    cellPos[k] = { x: Math.cos(angleOf[k]) * rr, y: Math.sin(angleOf[k]) * rr };
  });
  const NUCLEUS_GAP = 185;
  for (let it = 0; it < 160; it++) {
    let moved = false;
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        const a = cellPos[present[i]], b = cellPos[present[j]];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const min = cellR[present[i]] + cellR[present[j]] + 170;
        if (d < min) {
          moved = true;
          const p = (min - d) / 2, ux = dx / d, uy = dy / d;
          a.x -= ux * p; a.y -= uy * p; b.x += ux * p; b.y += uy * p;
        }
      }
    }
    // Clear the nucleus: a hub cell is pulled inward hard enough to reach it.
    if (coreR) {
      present.forEach(k => {
        const c = cellPos[k];
        const d = Math.hypot(c.x - spineCx, c.y - spineCy) || 0.01;
        const min = coreR + cellR[k] + NUCLEUS_GAP;
        if (d < min) {
          moved = true;
          const ux = (c.x - spineCx) / d, uy = (c.y - spineCy) / d;
          c.x = spineCx + ux * min; c.y = spineCy + uy * min;
        }
      });
    }
    if (!moved) break;
  }
  present.forEach(k => {
    const c = cellPos[k];
    cellMem[k].forEach(n => { n.fx = c.x + n._ox; n.fy = c.y + n._oy; n.x = n.fx; n.y = n.fy; });
  });

  // ── Edge curvature — the flow map's rule, so bonds look the same ───────
  // A gentle, stable bow; two edges between the same pair curve apart instead
  // of stacking, and a self-loop gets a real one.
  const pairSeen = new Map();
  edges.forEach(e => {
    if (e.sourceId === e.targetId) { e.curvature = 0.5; return; }
    const key = [e.sourceId, e.targetId].sort().join('|');
    const n = (pairSeen.get(key) || 0);
    pairSeen.set(key, n + 1);
    const dir = e.sourceId < e.targetId ? 1 : -1;
    e.curvature = (0.12 + n * 0.14) * dir;
  });

  // ── Tech-node satellites — a small mark beside their owner ─────────────
  graph.techNodes.forEach((t, i) => {
    const owner = nodeById.get(t.owner);
    if (!owner) { t._x = null; return; }
    const side = i % 2 ? 1 : -1;
    t._x = owner.x + side * (owner.r + 18);
    t._y = owner.y - owner.r - 4 + (i % 3) * 8;
    t._ownerName = owner.name;
  });

  // ── Regions to paint ──────────────────────────────────────────────────
  const regions = [];
  if (spineMem.length) {
    regions.push({
      type: 'capital', key: '_capital',
      cx: spineCx, cy: spineCy, r: spineR + 24,
      color: ROLE_META.capital.color,
      label: 'ХРЕБЕТ КАПИТАЛА',
      stats: `${spineMem.length} ${plural(spineMem.length, ['собственник', 'собственника', 'собственников'])}`,
      count: spineMem.length,
    });
  }
  present.forEach(k => {
    const l = layerById.get(k);
    const conc = CONCENTRATION_META[l?.concentration?.level] || CONCENTRATION_META.competitive;
    regions.push({
      type: 'layer', key: k,
      cx: cellPos[k].x, cy: cellPos[k].y, r: cellR[k] + 30,
      color: (BAND_META[l?.band] || BAND_META[1]).color,
      label: `${k} · ${l?.label || k}`,
      // The one stat worth putting on the canvas: how concentrated the layer
      // is. Everything else lives in the layer report, so the map stays a map.
      stats: `${conc.label.toUpperCase()} · ${cellMem[k].length} ${plural(cellMem[k].length, ['компания', 'компании', 'компаний'])}`,
      // A monopoly layer gets the accent ring — the flow map's "a signal fired
      // here" treatment, reused for the thing that matters on this map.
      lit: l?.concentration?.level === 'monopoly',
      concentration: l?.concentration,
      reach: Math.round(reachNorm[k] * 100),
      count: cellMem[k].length,
    });
  });

  return regions;
}

function plural(n, [one, few, many]) {
  const a = Math.abs(Math.round(n));
  const d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}
