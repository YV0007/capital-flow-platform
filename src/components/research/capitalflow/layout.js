// ══════════════════════════════════════════════════════════════════════════
// "Capital atom" — radial molecule layout.
//
// Read from the centre out:
//   · NUCLEUS  — the allocators (capital sources) packed in the middle. Each
//     sits at the *direction of the sectors it funds* (capital-weighted mean
//     angle), so bonds leave the nucleus pointing at their destination.
//   · ORBIT    — the sectors, one compact circular CELL each, placed on a ring
//     in AI-stack order (software → compute → chips → cloud → datacenters →
//     power → physical/defense). The sequence itself is the navigation.
//   · Inside a cell, targets are circle-packed, heaviest at the core.
//   · Capital radiates OUTWARD, nucleus → orbit, so a glance reads source →
//     destination without tracing the whole graph.
//
// Deterministic + pinned (fx/fy) — no simulation, no per-reload drift. Derived
// entirely from whatever is in the file.
// ══════════════════════════════════════════════════════════════════════════

import { SECTOR_META, CLASS_META, sectorLabel } from '../../../data/capitalMap.js';
import { shortLabel, fmtUSD } from './format.js';

const GOLDEN = 2.399963229728653;
// Source classes, inner→outer in rough "concentration" order.
const CLASS_ORDER = ['individual', 'vc', 'corporate', 'alt_manager', 'sovereign'];

function hash01(str, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

function sizeAtom(n, maxCap) {
  const share = Math.sqrt((n.capital || 0) / maxCap);
  n.r = 10 + 34 * share;
  n.atomTier = share > 0.6 ? 0 : share > 0.3 ? 1 : share > 0.12 ? 2 : 3;
  // Landmark consortiums (e.g. the $500B NVIDIA AI-infra financing platform) carry
  // no disclosed amount, so `capital` is 0 and they'd render tiny — but they are
  // among the largest deals on the map by design. Size them near the top and give
  // the label high priority. (Durable fix: engine `announced_size` → true scaling,
  // see CAPITAL-FLOW-CONSORTIUM-SIGNAL-RULE.md.)
  if (n.landmark) {
    n.r = Math.max(n.r, 40);
    n.atomTier = Math.min(n.atomTier, 1);
  }
  n.atomLabel = shortLabel(n.name, 22);
  // Label priority: bigger capital + higher allocator tier show their tag at
  // lower zoom; everything else only reveals as you zoom into its section.
  const tierBonus = n.tier === 'core' ? 0.5 : n.tier === 'key' ? 0.35 : n.tier === 'watch' ? 0.15 : 0;
  const imp = share + tierBonus;
  n.labelScale = Math.max(0.14, Math.min(1.5, 0.9 - imp * 0.8));
}

function packRelative(members, spread, pad) {
  members.forEach((n, k) => {
    if (k === 0) { n._ox = 0; n._oy = 0; return; }
    const a = k * GOLDEN + hash01(n.id, 7) * 0.6;
    const rr = spread * Math.sqrt(k) + n.r;
    n._ox = Math.cos(a) * rr; n._oy = Math.sin(a) * rr;
  });
  relax(members, '_ox', '_oy', pad, 90);
  let R = 0;
  members.forEach(n => { R = Math.max(R, Math.hypot(n._ox, n._oy) + n.r); });
  return R;
}

function relax(list, kx, ky, pad, iters) {
  for (let it = 0; it < iters; it++) {
    let moved = false;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        const dx = b[kx] - a[kx], dy = b[ky] - a[ky];
        let d = Math.hypot(dx, dy) || 0.01;
        const min = a.r + b.r + pad;
        if (d < min) {
          moved = true;
          const p = (min - d) / 2, ux = dx / d, uy = dy / d;
          a[kx] -= ux * p; a[ky] -= uy * p; b[kx] += ux * p; b[ky] += uy * p;
        }
      }
    }
    if (!moved) break;
  }
}

/**
 * Pins every node into the capital-atom and returns the regions to paint
 * (one 'core' + one 'sector' cell each). Mutates the (memoised) node objects.
 */
export function applyMoleculeLayout(nodes, sectors = {}, links = []) {
  // Targets cluster by SECTOR — the one grouping dimension on the map.
  const META = SECTOR_META;
  const groupsData = sectors;
  const groupKeyOf = (t) => t.sector || '_none';

  const maxCap = Math.max(1, ...nodes.map(n => n.capital || 0));
  nodes.forEach(n => sizeAtom(n, maxCap));

  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const targets = nodes.filter(n => n.kind === 'target');
  const allocators = nodes.filter(n => n.kind === 'allocator');

  // ── Orbit: groups present (sectors OR themes), in canonical order ────────
  const secOrder = k => (META[k]?.order ?? 100);
  const present = [...new Set(targets.map(t => groupKeyOf(t)))]
    .sort((a, b) => secOrder(a) - secOrder(b));
  const N = Math.max(1, present.length);
  // Capital-weighted angular spans → big groups claim more room, spacing is
  // uneven (organic, not a mechanical ring). A small per-group wobble too.
  const sectorCapOf = {};
  present.forEach(k => {
    sectorCapOf[k] = targets.filter(t => groupKeyOf(t) === k).reduce((s, n) => s + (n.capital || 0), 0);
  });
  const maxSecCap = Math.max(1, ...present.map(k => sectorCapOf[k]));
  const weights = present.map(k => 0.65 + sectorCapOf[k] / maxSecCap);
  const wsum = weights.reduce((a, b) => a + b, 0) || 1;
  const angleOf = {};
  let accA = -Math.PI / 2;
  present.forEach((k, i) => {
    const span = (2 * Math.PI * weights[i]) / wsum;
    angleOf[k] = accA + span / 2 + (hash01(k, 11) - 0.5) * span * 0.3;
    accA += span;
  });

  const cellR = {}, cellMem = {};
  present.forEach(k => {
    const mem = targets.filter(t => groupKeyOf(t) === k)
      .sort((a, b) => (b.capital || 0) - (a.capital || 0));
    cellMem[k] = mem;
    cellR[k] = Math.max(packRelative(mem, 16, 13), 38);
  });

  // ── Nucleus: allocator CLASS-clusters on an inner ring ───────────────────
  // Each source TYPE (individuals · venture · corporate · alt-managers ·
  // sovereign) gets its own labelled, colour-coded cluster — ordered around
  // the ring by the direction it funds — so you can read where each type of
  // capital goes instead of one undifferentiated blob.
  const outByAlloc = {};
  links.forEach(l => { (outByAlloc[l.sourceId] ||= []).push(l); });

  const classesPresent = [...new Set(allocators.map(a => a.cls))]
    .sort((a, b) => CLASS_ORDER.indexOf(a) - CLASS_ORDER.indexOf(b));
  const Nc = Math.max(1, classesPresent.length);

  // Pack each class's allocators into a sub-cluster; measure its radius.
  const classMem = {}, classR = {};
  classesPresent.forEach(c => {
    const mem = allocators.filter(a => a.cls === c).sort((x, y) => (y.capital || 0) - (x.capital || 0));
    classMem[c] = mem;
    classR[c] = Math.max(packRelative(mem, 15, 12), 42);
  });

  // Order classes around the ring by the direction they fund (neighbours fund
  // neighbours → shorter bonds), then space them evenly for clean separation.
  const classFund = {};
  classesPresent.forEach(c => {
    let vx = 0, vy = 0;
    classMem[c].forEach(a => (outByAlloc[a.id] || []).forEach(l => {
      const ang = angleOf[groupKeyOf(nodeById.get(l.targetId) || {})];
      if (ang == null) return;
      const w = Math.max(1, l.amount || 0);
      vx += Math.cos(ang) * w; vy += Math.sin(ang) * w;
    }));
    classFund[c] = (vx === 0 && vy === 0) ? 0 : Math.atan2(vy, vx);
  });
  const ringOrder = [...classesPresent].sort((a, b) => classFund[a] - classFund[b]);
  const classAngleOf = {};
  ringOrder.forEach((c, i) => { classAngleOf[c] = -Math.PI / 2 + (2 * Math.PI * i) / Nc; });

  // Inner ring radius so class-clusters clear each other.
  let coreRing = 0;
  if (Nc > 1) {
    const chordC = 2 * Math.sin(Math.PI / Nc);
    for (let i = 0; i < Nc; i++) {
      const a = ringOrder[i], b = ringOrder[(i + 1) % Nc];
      coreRing = Math.max(coreRing, (classR[a] + classR[b] + 165) / chordC);
    }
  }

  classesPresent.forEach(c => {
    const ang = classAngleOf[c];
    const cx = Math.cos(ang) * coreRing, cy = Math.sin(ang) * coreRing;
    classMem[c].forEach(n => { n.fx = cx + n._ox; n.fy = cy + n._oy; n.x = n.fx; n.y = n.fy; });
  });
  const maxClassR = Math.max(0, ...classesPresent.map(c => classR[c]));
  const coreR = coreRing + maxClassR;

  // ── Outer sector ring: cells clear each other AND the source ring ────────
  const GAP_CELL = 200;
  let ring = 0;
  const chord = 2 * Math.sin(Math.PI / N) || 0.0001;
  for (let i = 0; i < N; i++) {
    const a = present[i], b = present[(i + 1) % N];
    ring = Math.max(ring, (cellR[a] + cellR[b] + GAP_CELL) / chord);
  }
  const maxCellR = Math.max(0, ...present.map(k => cellR[k]));
  ring = Math.max(ring, coreR + maxCellR + 330);

  // Per-sector radius jitter so cells sit organically off the perfect ring —
  // some pushed out, some pulled in — then a light de-overlap of centres.
  const sectorPos = {};
  present.forEach(k => {
    const rr = ring * (0.84 + 0.3 * hash01(k, 5));
    sectorPos[k] = { x: Math.cos(angleOf[k]) * rr, y: Math.sin(angleOf[k]) * rr };
  });
  for (let it = 0; it < 80; it++) {
    let moved = false;
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        const a = sectorPos[present[i]], b = sectorPos[present[j]];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const min = cellR[present[i]] + cellR[present[j]] + 130;
        if (d < min) {
          moved = true;
          const p = (min - d) / 2, ux = dx / d, uy = dy / d;
          a.x -= ux * p; a.y -= uy * p; b.x += ux * p; b.y += uy * p;
        }
      }
    }
    if (!moved) break;
  }
  present.forEach(k => {
    const c = sectorPos[k];
    cellMem[k].forEach(n => { n.fx = c.x + n._ox; n.fy = c.y + n._oy; n.x = n.fx; n.y = n.fy; });
  });

  // ── Regions to paint ─────────────────────────────────────────────────────
  // Bubble totals sum node.capital — the engine's authoritative per-entity
  // figure, all disclosed capital regardless of confirmation. This is the
  // app-wide "raскрыто" convention (top bar, filter chips, table all agree);
  // the report reconciles to it in its headline.
  const regions = [];
  classesPresent.forEach(c => {
    const ang = classAngleOf[c];
    const cx = Math.cos(ang) * coreRing, cy = Math.sin(ang) * coreRing;
    const cap = classMem[c].reduce((s, n) => s + (n.capital || 0), 0);
    regions.push({
      type: 'source', key: c, cx, cy, r: classR[c] + 24,
      color: CLASS_META[c]?.color || '#9aa3b2',
      label: (CLASS_META[c]?.zone || CLASS_META[c]?.label || c).toUpperCase(),
      stats: `ВЛОЖЕНО ${fmtUSD(cap)}`,
    });
  });
  present.forEach(k => {
    const cx = sectorPos[k].x, cy = sectorPos[k].y;
    const grp = groupsData[k];
    const cap = cellMem[k].reduce((s, n) => s + (n.capital || 0), 0);
    regions.push({
      type: 'sector', key: k, cx, cy, r: cellR[k] + 32,
      color: META[k]?.color || '#9aa3b2',
      label: (k === '_none' ? 'Без сектора' : sectorLabel(k)).toUpperCase(),
      stats: `ПОЛУЧЕНО ${fmtUSD(cap)}`,
      lit: !!(grp && grp.lit), signals: grp?.signals || [],
      count: cellMem[k].length,
    });
  });

  return regions;
}
