// ══════════════════════════════════════════════════════════════════════════
// Static layout — "capital islands".
//
// The architecture is the data:
//   · Each group is a compact ISLAND — tight inside, generous whitespace
//     between islands, so edges between them read as capital corridors.
//   · Islands are positioned along the capital pipeline: money sources
//     (funds/sovereigns, individuals, government) on the left → the labs
//     they fund in the centre → hyperscalers/neoclouds around them →
//     silicon → fab equipment on the far right, with the physical layer
//     (projects, power) along the bottom.
//   · Inside an island the heaviest entity sits at the centre, the rest
//     spiral outward by weight — a glance shows who dominates each sector.
//   · Every island carries painted aggregate stats (capital in / out), so
//     the overview alone tells you where inflows concentrate.
//
// Everything is deterministic and pinned (fx/fy): no simulation, dragging
// one block never disturbs the rest. To rearrange, edit ISLANDS.
// ══════════════════════════════════════════════════════════════════════════

import { GROUP_META } from '../../../data/capitalFlowData.js';
import { shortLabel, fmtUSD } from './format.js';

// Island centres in world units. sx/sy stretch the packing spiral.
const ISLANDS = {
  fund:        { x: -1420, y:  -60, spacing: 108, sx: 1.0,  sy: 1.25 },
  individual:  { x: -1020, y: -800, spacing: 95 },
  defense:     { x: -1560, y: -660, spacing: 95 },
  government:  { x: -1100, y:  680, spacing: 95 },
  lab:         { x: -280,  y: -160, spacing: 105 },
  hyperscaler: { x:  500,  y: -760, spacing: 105 },
  neocloud:    { x:  400,  y:  400, spacing: 100 },
  silicon:     { x: 1200,  y: -280, spacing: 105 },
  equipment:   { x: 1840,  y:  180, spacing: 95 },
  power:       { x: 1300,  y:  860, spacing: 98 },
  project:     { x:  160,  y: 1010, spacing: 100 },
};

const GOLDEN = 2.399963229728653;

// Deterministic per-id jitter so islands look organic, never random.
function hash01(str, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/**
 * Pins every node, precomputes block metrics, and returns the island
 * regions (bbox + aggregate stats) for the canvas to paint.
 * Mutates the (memoised) node objects — call once per graph build.
 */
export function applyStaticLayout(nodes) {
  const byGroup = {};
  nodes.forEach(n => { (byGroup[n.group] ||= []).push(n); });

  const regions = [];
  Object.entries(ISLANDS).forEach(([g, isle]) => {
    const list = (byGroup[g] || []).sort((a, b) => b.totalFlow - a.totalFlow);
    if (!list.length) return;

    // Golden-angle spiral: #1 at the centre, the rest packing outward.
    list.forEach((n, k) => {
      sizeBlock(n);
      if (k === 0) {
        n.fx = isle.x; n.fy = isle.y;
      } else {
        const a = k * GOLDEN + hash01(n.id, 7) * 0.7;
        const r = isle.spacing * Math.sqrt(k + 0.4);
        n.fx = isle.x + Math.cos(a) * r * 1.35 * (isle.sx || 1);
        n.fy = isle.y + Math.sin(a) * r * 0.78 * (isle.sy || 1);
      }
      n.x = n.fx; n.y = n.fy;
    });
  });

  relaxOverlaps(nodes);

  // Region boxes + aggregate stats, computed AFTER relaxation so the frame
  // hugs the final positions.
  Object.entries(ISLANDS).forEach(([g, isle]) => {
    const list = byGroup[g] || [];
    if (!list.length) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let inflow = 0, outflow = 0;
    list.forEach(n => {
      minX = Math.min(minX, n.fx - n.blockW / 2);
      maxX = Math.max(maxX, n.fx + n.blockW / 2);
      minY = Math.min(minY, n.fy - n.blockH / 2);
      maxY = Math.max(maxY, n.fy + n.blockH / 2);
      inflow += n.totalInflow;
      outflow += n.totalOutflow;
    });
    const PADX = 64, PADY = 56;
    const statBits = [];
    if (inflow > 0) statBits.push(`IN ${fmtUSD(inflow)}`);
    if (outflow > 0) statBits.push(`OUT ${fmtUSD(outflow)}`);
    regions.push({
      x: minX - PADX, y: minY - PADY,
      w: (maxX - minX) + PADX * 2, h: (maxY - minY) + PADY * 2,
      color: GROUP_META[g]?.color || '#71717a',
      label: (GROUP_META[g]?.label || g).toUpperCase(),
      stats: statBits.join(' · '),
      count: list.length,
    });
  });

  return regions;
}

// ── Block metrics — 4 size tiers driven by total capital flow. The two top
// tiers print their dollar total inside the block, so scale carries meaning
// at a glance.
function sizeBlock(n) {
  const s = n.flowShare || 0;
  const t = s > 0.35 ? 0 : s > 0.12 ? 1 : s > 0.02 ? 2 : 3;
  n.blockTier = t;
  n.blockH = [50, 40, 30, 24][t];
  n.blockFont = [20, 16, 12.5, 10.5][t];
  n.blockLabel = shortLabel(n.name, 22);
  n.blockValue = t <= 1 ? fmtUSD(n.totalFlow) : null;
  // Shape class: capital sources read as capsules, companies as blocks,
  // physical assets as sharp plates.
  n.blockShape = (n.group === 'fund' || n.group === 'individual' || n.group === 'government')
    ? 'capsule'
    : n.group === 'project' ? 'asset' : 'company';
  const nameW = n.blockLabel.length * n.blockFont * 0.56;
  const valueW = n.blockValue ? n.blockValue.length * (n.blockFont - 4) * 0.62 + 18 : 0;
  n.blockW = Math.max(76, nameW + valueW + n.blockH * 0.95 + 18);
}

// Deterministic pairwise separation; lighter blocks yield more than heavy
// ones, so island centres stay put.
function relaxOverlaps(nodes) {
  const PAD = 30;
  const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  for (let iter = 0; iter < 140; iter++) {
    let moved = false;
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i], b = sorted[j];
        const minX = (a.blockW + b.blockW) / 2 + PAD;
        const minY = (a.blockH + b.blockH) / 2 + PAD;
        const dx = b.fx - a.fx, dy = b.fy - a.fy;
        const ox = minX - Math.abs(dx), oy = minY - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        const wa = Math.sqrt(a.flowShare || 0) + 0.08;
        const wb = Math.sqrt(b.flowShare || 0) + 0.08;
        const shareA = wb / (wa + wb), shareB = wa / (wa + wb);
        if (ox < oy) {
          const push = (ox / 2 + 1) * Math.sign(dx || hash01(a.id, 3) - 0.5);
          a.fx -= push * shareA; b.fx += push * shareB;
        } else {
          const push = (oy / 2 + 1) * Math.sign(dy || hash01(a.id, 5) - 0.5);
          a.fy -= push * shareA; b.fy += push * shareB;
        }
      }
    }
    if (!moved) break;
  }
  nodes.forEach(n => { n.x = n.fx; n.y = n.fy; });
}
