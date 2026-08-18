// ══════════════════════════════════════════════════════════════════════════
// Ecosystem layout — the SAME "capital atom" molecule as the flow map.
//
// An earlier version drew concentric layer rings, one per layer. It was thrown
// away and STAYS thrown away: radius-as-layer is defensible on paper and
// unreadable in practice — the wheel reads as a target rather than as an
// industry, and every edge becomes a long chord across it. The two maps are
// meant to FEEL identical and differ only in what they are ABOUT, so this is
// the flow map's geometry with ecosystem content poured into it. The packing
// itself is imported from `capitalflow/layout.js` rather than reimplemented,
// so the two cannot drift apart.
//
// v2 changes exactly ONE thing about the geometry: there are now THREE PLANES,
// and which plane a company lands on comes from ITS LAYER, not from its role.
//
//   · NUCLEUS — layers with `plane: "nucleus"`. Capital owns and finances the
//     stack without standing in it, which is exactly the position the flow
//     map's allocators occupy. In v1 the nucleus was the `capital` ROLE; the
//     position is unchanged, the criterion moved into the data.
//   · ORBIT   — layers with `plane: "orbit"`, one compact CELL each, placed
//     around the ring by `layer.order` (not by array position — the payload
//     makes no ordering promise). The sequence is the navigation. RADIUS is
//     how pivotal a layer is: one whose companies trade with many OTHER layers
//     gets pulled toward the middle.
//   · CONTROL — layers with `plane: "control"`, on an OUTER ARC. States,
//     agencies and standards bodies do not stand in the stack, they gate it.
//     Slotting a country between "память" and "системы" would lie about the
//     nature of the relation, so they get their own plane, drawn quieter than
//     the ring: smaller tiles, dimmer glow. They are the frame, not the
//     picture. Bonds reaching them bow OUTWARD rather than cutting the map.
//
// A company living in several layers is still ONE node — it sits in its
// primary layer's cell and carries the others as a badge. No duplicates.
//
// NOT ONE LAYER IDENTIFIER IS NAMED IN THIS FILE. Everything comes from
// `layer.plane`, `layer.order` and `layer.band`. Twelve layers or twenty, the
// molecule assembles.
//
// Deterministic + pinned (fx/fy) — no simulation, no per-reload drift.
// ══════════════════════════════════════════════════════════════════════════

import { packRelative, hash01 } from '../capitalflow/layout.js';
import { shortLabel } from '../capitalflow/format.js';
import { PLANE_META, critIn } from '../../../data/aiEcosystemNetwork.js';

// Companies on the outer arc are drawn smaller than the ring's: they frame the
// stack rather than stand in it, and at equal size the frame competes with the
// picture.
const CONTROL_SCALE = 0.72;

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
  n.r = (9 + 29 * s) * (n.plane === 'control' ? CONTROL_SCALE : 1);
  n.atomTier = s > 0.83 ? 0 : s > 0.65 ? 1 : s > 0.42 ? 2 : 3;
  n.atomLabel = shortLabel(n.name, 22);
  // Label priority: the more critical, the earlier a name appears as you zoom
  // out. Same curve as the flow map. In v2 exactly ONE entity — the anchor —
  // was pinned always-visible. In v3 that privilege GENERALIZES: every PIVOT
  // gets it, because the whole point of the network view is that the 26 centres
  // are co-equal. `isAnchor` stays honored so the reserve NVIDIA map is
  // unchanged; `isPivotal` is the network's collective version of the same rule.
  const privileged = n.isAnchor || n.isPivotal;
  const imp = s + (privileged ? 0.6 : 0);
  n.labelScale = privileged ? 0 : Math.max(0.14, Math.min(1.5, 0.9 - imp * 0.8));
}

// ── Packing footprint — what a company actually occupies ─────────────────
// A company is DRAWN as a square tile of side r*1.85 with its name set to the
// right of it, but the circle packer only knows n.r. Packing by r alone
// under-books every company by the ~31% its corners stick out past the
// inscribed circle, before a single label is counted — which is why cells read
// as crowded and names ran into each other. Everything is packed by the tile's
// true half-diagonal plus a little label room, and n.r is handed straight back
// so the painter still draws the real size.
const TILE_HALF_DIAG = 1.85 * Math.SQRT1_2;
const LABEL_ROOM = 12;
function packTiles(members, spread, pad) {
  members.forEach(n => { n._rDraw = n.r; n.r = n.r * TILE_HALF_DIAG + LABEL_ROOM; });
  const R = packRelative(members, spread, pad);
  members.forEach(n => { n.r = n._rDraw; });
  return R;
}

/**
 * Pins every entity into the molecule and returns the regions to paint
 * (nucleus cells + orbit cells + control-arc cells). Mutates the (memoised)
 * entity objects, exactly like applyMoleculeLayout does.
 */
export function applyEcoLayout(graph) {
  const { entities, edges, layers, entityById, layerById } = graph;

  entities.forEach(sizeAtom);

  const planeOf = (n) => layerById.get(n.primaryLayer)?.plane || 'orbit';
  const cellKeyOf = (n) => n.primaryLayer;

  // Layers that actually hold somebody, split by plane and kept in `order`.
  const present = (plane) => layers
    .filter(l => l.plane === plane && entities.some(n => cellKeyOf(n) === l.id))
    .sort((a, b) => a.order - b.order)
    .map(l => l.id);

  const nucleusKeys = present('nucleus');
  const orbitKeys = present('orbit');
  const controlKeys = present('control');

  const membersOf = (key) => entities
    .filter(n => cellKeyOf(n) === key)
    .sort((a, b) =>
      String(a.sector || '').localeCompare(String(b.sector || ''))
      || (critIn(b, key) - critIn(a, key))
      || a.id.localeCompare(b.id));

  const cellMem = {}, cellR = {};
  [...nucleusKeys, ...orbitKeys, ...controlKeys].forEach(k => {
    const mem = membersOf(k);
    cellMem[k] = mem;
    cellR[k] = Math.max(packTiles(mem, k && controlKeys.includes(k) ? 14 : 16, 14), 40);
  });

  // ── Orbit angles — from layer.order, weighted by how much a layer holds ─
  // A crowded layer claims more of the circle, so spacing reads organic rather
  // than mechanical. The ORDER of the walk is the payload's `order`; only the
  // WIDTH of each slice is weighted.
  const N = Math.max(1, orbitKeys.length);
  const weightOf = {};
  orbitKeys.forEach(k => {
    weightOf[k] = cellMem[k].reduce((s, n) => s + (critIn(n, k) || n.criticality || 0), 0);
  });
  const maxW = Math.max(1, ...orbitKeys.map(k => weightOf[k]));
  const weights = orbitKeys.map(k => 0.7 + weightOf[k] / maxW);
  const wsum = weights.reduce((a, b) => a + b, 0) || 1;
  const angleOf = {};
  let accA = -Math.PI / 2;                 // first layer at 12 o'clock, clockwise
  orbitKeys.forEach((k, i) => {
    const span = (2 * Math.PI * weights[i]) / wsum;
    angleOf[k] = accA + span / 2 + (hash01(k, 11) - 0.5) * span * 0.28;
    accA += span;
  });

  // ── Reach: how far across the stack a layer actually touches ───────────
  // The angle of a cell is its position in the stack; its RADIUS is how
  // pivotal it is. A layer whose companies trade with many OTHER layers gets
  // pulled toward the middle, one that only talks to its neighbours drifts to
  // the rim. Nothing here names a layer: swap in a payload where power is the
  // hub and power moves to the middle instead.
  const layerOfEntity = (id) => entityById.get(id)?.primaryLayer;
  const touched = {}, degree = {};
  orbitKeys.forEach(k => { touched[k] = new Set(); degree[k] = 0; });
  edges.forEach(e => {
    const a = layerOfEntity(e.sourceId), b = layerOfEntity(e.targetId);
    if (a && touched[a]) { degree[a] += 1; if (b && b !== a) touched[a].add(b); }
    if (b && touched[b]) { degree[b] += 1; if (a && a !== b) touched[b].add(a); }
  });
  const maxDeg = Math.max(1, ...orbitKeys.map(k => degree[k]));
  const reach = {}, reachNorm = {};
  orbitKeys.forEach(k => {
    const spread = touched[k].size / Math.max(1, N - 1);
    const volume = degree[k] / maxDeg;
    reach[k] = 0.62 * spread + 0.38 * volume;
  });
  const maxReach = Math.max(0.0001, ...orbitKeys.map(k => reach[k]));
  orbitKeys.forEach(k => { reachNorm[k] = reach[k] / maxReach; });

  // ── Nucleus: the capital plane, aimed at what it controls ──────────────
  const outBySpine = {};
  edges.forEach(e => { (outBySpine[e.sourceId] ||= []).push(e); });

  const nucleusMem = nucleusKeys.flatMap(k => cellMem[k])
    .sort((a, b) => (b.criticality || 0) - (a.criticality || 0));
  const nucleusR = nucleusMem.length ? Math.max(packTiles(nucleusMem, 15, 14), 44) : 0;

  let vx = 0, vy = 0;
  nucleusMem.forEach(a => (outBySpine[a.id] || []).forEach(e => {
    const target = entityById.get(e.targetId);
    const ang = target ? angleOf[cellKeyOf(target)] : null;
    if (ang == null) return;
    const w = Math.max(1, e.strength || 0);
    vx += Math.cos(ang) * w; vy += Math.sin(ang) * w;
  }));
  const nucleusAngle = (vx === 0 && vy === 0) ? -Math.PI / 2 : Math.atan2(vy, vx);
  const nucleusCx = nucleusMem.length ? Math.cos(nucleusAngle) * nucleusR * 0.3 : 0;
  const nucleusCy = nucleusMem.length ? Math.sin(nucleusAngle) * nucleusR * 0.3 : 0;
  nucleusMem.forEach(n => { n.fx = nucleusCx + n._ox; n.fy = nucleusCy + n._oy; n.x = n.fx; n.y = n.fy; });
  const coreR = nucleusMem.length ? nucleusR : 0;

  // ── Orbit ring: cells clear each other AND the nucleus ─────────────────
  const GAP_CELL = 250;
  let ring = 0;
  const chord = 2 * Math.sin(Math.PI / N) || 0.0001;
  for (let i = 0; i < N; i++) {
    const a = orbitKeys[i], b = orbitKeys[(i + 1) % N];
    ring = Math.max(ring, (cellR[a] + cellR[b] + GAP_CELL) / chord);
  }
  const maxCellR = Math.max(0, ...orbitKeys.map(k => cellR[k]));
  ring = Math.max(ring, coreR + maxCellR + 340);
  // Pulling the hub layers inward compresses the whole wheel, so the base
  // radius is opened up by roughly what the pull takes back — otherwise the
  // middle turns into a jam and the rim cells sit on each other.
  ring *= 1.2;

  const cellPos = {};
  orbitKeys.forEach(k => {
    const pull = 0.42 * reachNorm[k];                       // 0 = rim, 1 = hub
    const rr = ring * (1.02 - pull) * (0.94 + 0.12 * hash01(k, 5));
    cellPos[k] = { x: Math.cos(angleOf[k]) * rr, y: Math.sin(angleOf[k]) * rr };
  });

  // ── Control plane: an OUTER ARC, clear of everything ───────────────────
  // Spread over the top of the wheel — the reading eye starts there, and the
  // gate is what you should notice first about this map. Radius is fixed well
  // outside the ring so a control cell never mixes into the stack.
  const ARC_GAP = 420;
  const arcR = ring * 1.02 + maxCellR + ARC_GAP;
  const M = Math.max(1, controlKeys.length);
  // The span GROWS with how many gates there are rather than being fixed. A
  // fixed half-circle looked right with six control layers and absurd with
  // two: the arc's two cells got flung to nine and three o'clock, flanking the
  // wheel like bookends instead of arching over it. ~34° between neighbours,
  // capped a little under half the circle.
  const ARC_SPAN = Math.min(Math.PI * 0.86, Math.PI * 0.19 * (M - 1));
  const arcStart = -Math.PI / 2 - ARC_SPAN / 2; // centred on 12 o'clock
  controlKeys.forEach((k, i) => {
    const t = M === 1 ? 0.5 : i / (M - 1);
    const a = arcStart + ARC_SPAN * t;
    cellPos[k] = { x: Math.cos(a) * arcR, y: Math.sin(a) * arcR };
  });

  // De-overlap the ORBIT cells against each other and against the nucleus.
  // Control cells sit far outside and are left where the arc put them: nudging
  // them would break the arc, which is the whole point of the plane.
  const NUCLEUS_GAP = 185;
  for (let it = 0; it < 160; it++) {
    let moved = false;
    for (let i = 0; i < orbitKeys.length; i++) {
      for (let j = i + 1; j < orbitKeys.length; j++) {
        const a = cellPos[orbitKeys[i]], b = cellPos[orbitKeys[j]];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const min = cellR[orbitKeys[i]] + cellR[orbitKeys[j]] + 170;
        if (d < min) {
          moved = true;
          const p = (min - d) / 2, ux = dx / d, uy = dy / d;
          a.x -= ux * p; a.y -= uy * p; b.x += ux * p; b.y += uy * p;
        }
      }
    }
    if (coreR) {
      orbitKeys.forEach(k => {
        const c = cellPos[k];
        const d = Math.hypot(c.x - nucleusCx, c.y - nucleusCy) || 0.01;
        const min = coreR + cellR[k] + NUCLEUS_GAP;
        if (d < min) {
          moved = true;
          const ux = (c.x - nucleusCx) / d, uy = (c.y - nucleusCy) / d;
          c.x = nucleusCx + ux * min; c.y = nucleusCy + uy * min;
        }
      });
    }
    if (!moved) break;
  }

  [...orbitKeys, ...controlKeys].forEach(k => {
    const c = cellPos[k];
    cellMem[k].forEach(n => { n.fx = c.x + n._ox; n.fy = c.y + n._oy; n.x = n.fx; n.y = n.fy; });
  });

  // ── Edge curvature — the flow map's rule, so bonds look the same ───────
  // A gentle, stable bow; two edges between the same pair curve apart instead
  // of stacking, and a self-loop gets a real one.
  //
  // ONE addition for v2: a bond with an end on the OUTER ARC bows AWAY from
  // the centre. Otherwise every gate — and a gate touches half the map —
  // draws a long chord straight through the stack, and the arc's whole point
  // (that these are outside, not inside) is thrown away by the drawing.
  const pairSeen = new Map();
  edges.forEach(e => {
    if (e.sourceId === e.targetId) { e.curvature = 0.5; return; }
    const key = [e.sourceId, e.targetId].sort().join('|');
    const n = (pairSeen.get(key) || 0);
    pairSeen.set(key, n + 1);
    const dir = e.sourceId < e.targetId ? 1 : -1;
    let c = (0.12 + n * 0.14) * dir;

    const s = entityById.get(e.sourceId), t = entityById.get(e.targetId);
    if (s && t && (planeOf(s) === 'control' || planeOf(t) === 'control')) {
      // Which side of the chord is "outward"? The cross product of the chord
      // with the midpoint's own direction from the origin says so; force-graph
      // bows toward positive curvature on one fixed side, so we set the sign
      // that lands the arc on the far side from the middle.
      const dx = t.x - s.x, dy = t.y - s.y;
      const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
      const cross = dx * my - dy * mx;
      const mag = 0.30 + n * 0.10;
      c = cross >= 0 ? -mag : mag;
    }
    e.curvature = c;
  });

  // ── Tech-node satellites — a small mark beside their owner ─────────────
  graph.techNodes.forEach((t, i) => {
    const owner = entityById.get(t.owner);
    if (!owner) { t._x = null; return; }
    const side = i % 2 ? 1 : -1;
    t._x = owner.x + side * (owner.r + 18);
    t._y = owner.y - owner.r - 4 + (i % 3) * 8;
    t._ownerName = owner.name;
  });

  // ── Regions to paint ──────────────────────────────────────────────────
  const regions = [];
  const push = (key, plane) => {
    const l = layerById.get(key);
    const conc = l?.concentrationMeta;
    const mem = cellMem[key];
    const control = plane === 'control';
    regions.push({
      type: 'layer', key, plane,
      cx: cellPos[key]?.x ?? nucleusCx, cy: cellPos[key]?.y ?? nucleusCy,
      r: (control ? cellR[key] + 22 : cellR[key] + 30),
      color: l?.bandColor || PLANE_META[plane].color,
      label: `${key} · ${l?.label || key}`,
      // The one stat worth putting on the canvas: how concentrated the layer
      // is. Everything else lives in the layer report, so the map stays a map.
      stats: `${(conc?.label || '').toUpperCase()} · ${mem.length} ${plural(mem.length, ['участник', 'участника', 'участников'])}`,
      // A monopoly layer gets the accent ring — the flow map's "a signal fired
      // here" treatment, reused for the thing that matters on this map. The
      // outer arc never lights: it is the frame, and a lit frame is a distraction.
      lit: !control && l?.concentration?.level === 'monopoly',
      concentration: l?.concentration,
      reach: Math.round((reachNorm[key] ?? 0) * 100),
      count: mem.length,
      // The control plane is drawn QUIETER — that is what "рамка, а не
      // содержание" means in pixels.
      quiet: control,
    });
  };

  // Nucleus cells are drawn as ONE pool around the whole plane, so the middle
  // reads as a core rather than as another cell on the ring.
  if (nucleusMem.length) {
    const l = layerById.get(nucleusKeys[0]);
    regions.push({
      type: 'nucleus', key: nucleusKeys[0], plane: 'nucleus',
      cx: nucleusCx, cy: nucleusCy, r: nucleusR + 24,
      color: PLANE_META.nucleus.color,
      label: `${nucleusKeys[0]} · ${l?.label || PLANE_META.nucleus.label}`,
      stats: `${nucleusMem.length} ${plural(nucleusMem.length, ['участник', 'участника', 'участников'])}`,
      lit: false,
      concentration: l?.concentration,
      count: nucleusMem.length,
      quiet: false,
    });
  }
  orbitKeys.forEach(k => push(k, 'orbit'));
  controlKeys.forEach(k => push(k, 'control'));

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
