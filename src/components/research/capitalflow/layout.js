// ══════════════════════════════════════════════════════════════════════════
// Static layout — allocators (source) on the left, target sector zones on the
// right. The architecture is the data:
//   · Capital SOURCES (allocators) cluster on the left, grouped by class —
//     one island per class present in the file (venture, corporate, …).
//   · Capital SINKS (targets) cluster on the right, grouped by SECTOR — one
//     island per sector present. Sectors are the 12 canonical cluster zones.
//   · Money flows left → right. A sector carrying a fired signal this cycle
//     (sectors[x].signals) gets a highlighted frame — the whole point.
//   · Inside an island the heaviest node sits at the centre, the rest spiral
//     outward by capital — a glance shows who dominates each zone.
//
// Everything is deterministic and pinned (fx/fy): no simulation. Zones are
// derived from whatever classes/sectors are IN THE FILE — nothing hard-coded,
// so next week's file lays itself out with no code change.
// ══════════════════════════════════════════════════════════════════════════

import { SECTOR_META, CLASS_META } from '../../../data/capitalMap.js';
import { shortLabel, fmtUSD } from './format.js';

const GOLDEN = 2.399963229728653;

// Deterministic per-id jitter so islands look organic, never random.
function hash01(str, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

/**
 * Pins every node, precomputes block metrics, and returns the island regions
 * (bbox + aggregate stats + `lit` flag) for the canvas to paint. Mutates the
 * (memoised) node objects — call once per graph build.
 */
export function applyStaticLayout(nodes, sectors = {}) {
  nodes.forEach(sizeBlock);

  // ── Group nodes into islands ─────────────────────────────────────────────
  // Allocators → by class (left band). Targets → by sector (right grid).
  const allocGroups = {};   // cls  → nodes
  const targetGroups = {};  // sector → nodes
  nodes.forEach(n => {
    if (n.kind === 'allocator') (allocGroups[n.cls] ||= []).push(n);
    else (targetGroups[n.sector || '_none'] ||= []).push(n);
  });

  // Order allocator classes by total capital (heaviest band on top).
  const allocClasses = Object.keys(allocGroups).sort(
    (a, b) => sumCapital(allocGroups[b]) - sumCapital(allocGroups[a])
  );
  // Order target sectors by the canonical SECTOR_META order.
  const targetSectors = Object.keys(targetGroups).sort(
    (a, b) => (SECTOR_META[a]?.order ?? 99) - (SECTOR_META[b]?.order ?? 99)
  );

  const regions = [];

  // Left band: allocator class islands, stacked vertically.
  const ALLOC_X = -1500;
  const allocRows = Math.max(1, allocClasses.length);
  const ALLOC_VGAP = 520;
  const allocTop = -((allocRows - 1) * ALLOC_VGAP) / 2;
  allocClasses.forEach((cls, i) => {
    packIsland(allocGroups[cls], { x: ALLOC_X, y: allocTop + i * ALLOC_VGAP, spacing: 104 });
  });

  // Right grid: target sector islands. Columns of sectors, laid left→right by
  // canonical order, wrapping into rows so the field stays roughly square.
  const cols = Math.max(1, Math.ceil(Math.sqrt(targetSectors.length * 1.6)));
  const COL_W = 720, ROW_H = 620, GRID_X0 = 120, GRID_Y0 = -((Math.ceil(targetSectors.length / cols) - 1) * ROW_H) / 2;
  targetSectors.forEach((sec, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    packIsland(targetGroups[sec], { x: GRID_X0 + col * COL_W, y: GRID_Y0 + row * ROW_H, spacing: 108 });
  });

  relaxOverlaps(nodes);

  // ── Region frames + stats, computed AFTER relaxation ─────────────────────
  const pushRegion = (list, { color, label, kind, key }) => {
    if (!list || !list.length) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let capital = 0;
    list.forEach(n => {
      minX = Math.min(minX, n.fx - n.blockW / 2); maxX = Math.max(maxX, n.fx + n.blockW / 2);
      minY = Math.min(minY, n.fy - n.blockH / 2); maxY = Math.max(maxY, n.fy + n.blockH / 2);
      capital += n.capital || 0;
    });
    const PADX = 60, PADY = 54;
    const sec = key ? sectors[key] : null;
    regions.push({
      x: minX - PADX, y: minY - PADY,
      w: (maxX - minX) + PADX * 2, h: (maxY - minY) + PADY * 2,
      color, label: label.toUpperCase(), kind, count: list.length,
      stats: `${kind === 'allocator' ? 'OUT' : 'IN'} ${fmtUSD(capital)}`,
      lit: !!(sec && sec.lit),
      signals: sec?.signals || [],
    });
  };

  allocClasses.forEach(cls =>
    pushRegion(allocGroups[cls], {
      color: CLASS_META[cls]?.color || '#C2A36B',
      label: CLASS_META[cls]?.label || cls,
      kind: 'allocator',
    }));
  targetSectors.forEach(sec =>
    pushRegion(targetGroups[sec], {
      color: SECTOR_META[sec]?.color || '#71717a',
      label: SECTOR_META[sec]?.label || (sec === '_none' ? 'Unsectored' : sec),
      kind: 'target', key: sec,
    }));

  return regions;
}

function sumCapital(list) { return list.reduce((s, n) => s + (n.capital || 0), 0); }

// Golden-angle spiral: heaviest node at the centre, the rest packing outward.
function packIsland(list, isle) {
  const sorted = [...list].sort((a, b) => (b.capital || 0) - (a.capital || 0));
  sorted.forEach((n, k) => {
    if (k === 0) { n.fx = isle.x; n.fy = isle.y; }
    else {
      const a = k * GOLDEN + hash01(n.id, 7) * 0.7;
      const r = isle.spacing * Math.sqrt(k + 0.4);
      n.fx = isle.x + Math.cos(a) * r * 1.25;
      n.fy = isle.y + Math.sin(a) * r * 0.82;
    }
    n.x = n.fx; n.y = n.fy;
  });
}

// ── Block metrics — 4 size tiers driven by capital share. The two top tiers
// print their dollar total inside the block, so scale carries meaning at a
// glance. Shape = class family (capsule = source/fund, block = company,
// sharp plate = physical asset).
function sizeBlock(n) {
  const s = n.flowShare || 0;
  const t = s > 0.35 ? 0 : s > 0.12 ? 1 : s > 0.02 ? 2 : 3;
  n.blockTier = t;
  n.blockH = [50, 40, 30, 24][t];
  n.blockFont = [20, 16, 12.5, 10.5][t];
  n.blockLabel = shortLabel(n.name, 22);
  n.blockValue = t <= 1 ? fmtUSD(n.capital) : null;
  n.blockShape = CLASS_META[n.cls]?.shape || (n.kind === 'allocator' ? 'capsule' : 'company');
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
