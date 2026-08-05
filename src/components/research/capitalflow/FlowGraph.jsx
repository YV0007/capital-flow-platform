// ══════════════════════════════════════════════════════════════════════════
// FlowGraph — the full-screen canvas. STATIC diagram, not a simulation.
//
// Positions come pre-pinned from layout.js (fx/fy on every node); all d3
// forces are disabled and the engine runs zero ticks, so nothing ever drifts.
// Dragging a block moves only that block. Zoom/pan stay live.
//
// VISUAL ENCODING
//   · node = labeled block (name inside — no floating labels)
//   · block border/dot colour → group
//   · role dot: filled = receives capital · hollow = deploys · dot-in-ring = both
//   · block size (3 tiers)  → total capital in + out
//   · edge colour → deal type · thickness → amount · arrow → direction
//   · dimmed = filtered out or outside the selected neighbourhood
// ══════════════════════════════════════════════════════════════════════════

import { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { fmtUSD, linkWidth } from './format.js';
import { GROUP_META, TIER_META } from '../../../data/capitalFlowData.js';

const BG = '#08090C';

export default function FlowGraph({
  graphData,
  regions,
  matchedNodes, matchedLinks,
  selectedNodeId, selectedLinkId,
  neighbourNodes, neighbourLinks,
  onNodeClick, onLinkClick, onBackgroundClick,
  showLabels,
  fgRef,
}) {
  const wrapRef = useRef(null);
  const fittedRef = useRef(false);
  const lastResizeRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hoverNodeId, setHoverNodeId] = useState(null);
  const [hoverLinkId, setHoverLinkId] = useState(null);

  // ── Responsive canvas ──────────────────────────────────────────────────
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const r = entries[0].contentRect;
      lastResizeRef.current = performance.now();
      setSize({ w: Math.max(320, r.width), h: Math.max(360, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Frame the whole map on first paint. zoomToFit silently no-ops until the
  // graph has ingested its data, so keep calling it until the zoom actually
  // moves off its default (then stop for good — never fight the user).
  // Frame the whole map on load. Two traps here: (1) fitting before the
  // graph has ingested its data zooms into a degenerate bbox; (2) the
  // library resets the camera whenever the canvas size changes, wiping any
  // fit done too early. So fit only once the bbox is real AND the size has
  // been stable for a moment — then leave the camera to the user for good.
  useEffect(() => {
    let ticks = 0;
    let goodFits = 0;
    const iv = setInterval(() => {
      ticks += 1;
      if (ticks >= 60) { clearInterval(iv); return; }
      if (performance.now() - lastResizeRef.current < 600) return;
      const fg = fgRef.current;
      if (!fg) return;
      const bbox = fg.getGraphBbox?.();
      const ready = bbox && Number.isFinite(bbox.x?.[0]) && (bbox.x[1] - bbox.x[0]) > 100;
      if (!ready) return;
      fg.zoomToFit(goodFits === 0 ? 0 : 200, 70);
      goodFits += 1;
      if (goodFits >= 2) {
        fittedRef.current = true;
        clearInterval(iv);
      }
    }, 250);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Kill every force — the layout is fixed ─────────────────────────────
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force('center', null);
    fg.d3Force('charge', null);
    fg.d3Force('link', null);
  }, [fgRef, graphData]);

  const hasSelection = !!selectedNodeId || !!selectedLinkId;

  const nodeLit = useCallback((n) => {
    if (!matchedNodes.has(n.id)) return false;
    if (!hasSelection) return true;
    return neighbourNodes.has(n.id);
  }, [matchedNodes, neighbourNodes, hasSelection]);

  const linkLit = useCallback((l) => {
    if (!matchedLinks.has(l.id)) return false;
    if (!hasSelection) return true;
    return neighbourLinks.has(l.id);
  }, [matchedLinks, neighbourLinks, hasSelection]);

  // ── Island zones, painted under everything: tinted frame + caption +
  // aggregate capital stats, so the overview reads sector totals directly.
  const paintRegions = useCallback((ctx) => {
    regions.forEach(r => {
      // zone plate
      roundRect(ctx, r.x, r.y, r.w, r.h, 34);
      ctx.fillStyle = hexA(r.color, 0.032);
      ctx.fill();
      ctx.setLineDash([10, 12]);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = hexA(r.color, 0.22);
      ctx.stroke();
      ctx.setLineDash([]);

      // caption + aggregate stats above the zone
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.font = '700 30px ui-monospace, monospace';
      ctx.fillStyle = hexA(r.color, 0.6);
      ctx.fillText(r.label, r.x + 10, r.y - 34);
      if (r.stats) {
        ctx.font = '600 21px ui-monospace, monospace';
        ctx.fillStyle = hexA(r.color, 0.38);
        ctx.fillText(r.stats, r.x + 10, r.y - 8);
      }
    });
  }, [regions]);

  // ── Block painter ──────────────────────────────────────────────────────
  // Shape = class: capsule → capital source · rounded block → company ·
  // sharp plate → physical asset. Fill tint = role (sinks tinted, sources
  // hollow). Top two size tiers print their dollar total inside.
  const paintNode = useCallback((node, ctx) => {
    const w = node.blockW, h = node.blockH;
    const x = node.x - w / 2, y = node.y - h / 2;
    const lit = nodeLit(node);
    const selected = node.id === selectedNodeId;
    const hovered = node.id === hoverNodeId;
    const alpha = lit ? 1 : 0.07;
    const col = node.color;
    const r = node.blockShape === 'capsule' ? h / 2 : node.blockShape === 'asset' ? 4 : 9;

    ctx.save();
    ctx.globalAlpha = alpha;

    // soft glow behind the selected / hovered block
    if (lit && (selected || hovered)) {
      roundRect(ctx, x - 4, y - 4, w + 8, h + 8, r + 4);
      ctx.fillStyle = hexA(col, selected ? 0.22 : 0.13);
      ctx.fill();
    }

    // body — fill tint by role: receives = tinted, deploys = hollow dark
    roundRect(ctx, x, y, w, h, r);
    const tint = node.type === 'target' ? 0.16 : node.type === 'both' ? 0.08 : 0;
    ctx.fillStyle = lit ? '#10131b' : '#0d1016';
    ctx.fill();
    if (tint > 0) {
      roundRect(ctx, x, y, w, h, r);
      ctx.fillStyle = hexA(col, tint);
      ctx.fill();
    }
    ctx.lineWidth = selected ? 2 : node.blockTier <= 1 ? 1.5 : 1.1;
    ctx.strokeStyle = selected ? '#e8e8ec' : hexA(col, hovered ? 0.95 : node.blockTier <= 1 ? 0.75 : 0.5);
    ctx.stroke();

    // role dot — filled = receives · hollow = deploys · dot-in-ring = both
    const dr = h * 0.13;
    const dx = x + h * 0.52, dy = node.y;
    if (node.type === 'target') {
      ctx.beginPath(); ctx.arc(dx, dy, dr, 0, 2 * Math.PI);
      ctx.fillStyle = col; ctx.fill();
    } else if (node.type === 'player') {
      ctx.beginPath(); ctx.arc(dx, dy, dr, 0, 2 * Math.PI);
      ctx.lineWidth = 1.5; ctx.strokeStyle = col; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(dx, dy, dr, 0, 2 * Math.PI);
      ctx.lineWidth = 1.2; ctx.strokeStyle = col; ctx.stroke();
      ctx.beginPath(); ctx.arc(dx, dy, dr * 0.45, 0, 2 * Math.PI);
      ctx.fillStyle = col; ctx.fill();
    }

    // name — inside the block, so labels can never crowd each other
    if (showLabels || selected || hovered) {
      ctx.font = `${node.blockTier <= 1 ? 700 : 600} ${node.blockFont}px -apple-system, "Segoe UI", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = selected || hovered ? '#ffffff' : node.blockTier <= 1 ? '#eceff4' : '#c2c2cb';
      ctx.fillText(node.blockLabel, x + h * 0.92, node.y + 0.5);

      // dollar total inside the big tiers — size + number carry the weight
      if (node.blockValue) {
        ctx.font = `600 ${node.blockFont - 4}px ui-monospace, monospace`;
        ctx.textAlign = 'right';
        ctx.fillStyle = hexA(col, 0.9);
        ctx.fillText(node.blockValue, x + w - h * 0.45, node.y + 0.5);
      }
    }

    // total flow under the block on focus (small tiers only — big ones
    // already show it inside)
    if (lit && (selected || hovered) && !node.blockValue) {
      ctx.font = `600 ${Math.max(10, node.blockFont - 1)}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = hexA(col, 0.95);
      ctx.fillText(fmtUSD(node.totalFlow), node.x, y + h + 5);
    }

    ctx.restore();
  }, [nodeLit, selectedNodeId, hoverNodeId, showLabels]);

  const paintPointerArea = useCallback((node, colour, ctx) => {
    ctx.fillStyle = colour;
    roundRect(ctx, node.x - node.blockW / 2, node.y - node.blockH / 2, node.blockW, node.blockH, 8);
    ctx.fill();
  }, []);

  // ── Link styling ───────────────────────────────────────────────────────
  const linkColor = useCallback((l) => {
    const lit = linkLit(l);
    if (!lit) return hexA('#3f3f46', 0.08);
    if (l.id === selectedLinkId) return '#fafafa';
    if (l.id === hoverLinkId) return hexA(l.color, 1);
    return hexA(l.color, hasSelection ? 0.9 : 0.5);
  }, [linkLit, selectedLinkId, hoverLinkId, hasSelection]);

  const linkW = useCallback((l) => {
    const w = linkWidth(l) * 1.4;
    if (l.id === selectedLinkId) return w + 1.6;
    if (l.id === hoverLinkId) return w + 1;
    return w;
  }, [selectedLinkId, hoverLinkId]);

  const particles = useCallback((l) => {
    if (l.id === selectedLinkId) return 5;
    if (hasSelection && neighbourLinks.has(l.id) && matchedLinks.has(l.id)) return 3;
    return 0;
  }, [selectedLinkId, hasSelection, neighbourLinks, matchedLinks]);

  // ── Hover tooltips ─────────────────────────────────────────────────────
  const nodeTooltip = useCallback((n) => {
    const g = GROUP_META[n.group];
    const t = n.tier ? TIER_META[n.tier] : null;
    const role = n.type === 'both' ? 'Deploys & receives'
      : n.type === 'player' ? 'Deploys capital' : 'Receives capital';
    return tip(`
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:5px">
        <span style="font-weight:700;font-size:12.5px;color:#fafafa">${esc(n.name)}</span>
        ${t ? `<span style="color:${t.color};font-size:9px;font-weight:700">${t.short} ${t.stars}</span>` : ''}
      </div>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
        <span style="width:7px;height:7px;border-radius:50%;background:${n.color}"></span>
        <span style="color:#a1a1aa">${esc(g?.label || n.group)}</span>
        <span style="color:#3f3f46">·</span>
        <span style="color:#71717a">${esc(role)}</span>
      </div>
      <div style="display:grid;grid-template-columns:auto auto;gap:2px 14px">
        <span style="color:#71717a">Capital in</span><span style="color:#82B98D;text-align:right">${fmtUSD(n.totalInflow)}</span>
        <span style="color:#71717a">Capital out</span><span style="color:#C2A36B;text-align:right">${fmtUSD(n.totalOutflow)}</span>
      </div>
      <div style="margin-top:7px;color:#52525b;font-size:9px">Click → full breakdown panel</div>
    `);
  }, []);

  const linkTooltip = useCallback((l) => {
    const s = typeof l.source === 'object' ? l.source.name : l.sourceId;
    const t = typeof l.target === 'object' ? l.target.name : l.targetId;
    return tip(`
      <div style="font-weight:700;font-size:12.5px;color:#fafafa;margin-bottom:4px">${fmtUSD(l.amountUSD)}</div>
      <div style="color:#d4d4d8;margin-bottom:5px">${esc(s)} <span style="color:${l.color}">→</span> ${esc(t)}</div>
      <div style="display:flex;gap:6px;align-items:center">
        <span style="width:7px;height:7px;border-radius:2px;background:${l.color}"></span>
        <span style="color:#a1a1aa">${esc(l.dealType)}</span>
        <span style="color:#3f3f46">·</span>
        <span style="color:#71717a">${esc(l.date)}</span>
      </div>
      <div style="margin-top:7px;color:#52525b;font-size:9px">Click → deal detail</div>
    `);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}>
      {size.w > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={size.w}
          height={size.h}
          graphData={graphData}
          backgroundColor={BG}
          onRenderFramePre={paintRegions}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={paintPointerArea}
          nodeLabel={nodeTooltip}
          linkLabel={linkTooltip}
          linkColor={linkColor}
          linkWidth={linkW}
          linkCurvature="curvature"
          linkDirectionalArrowLength={7}
          linkDirectionalArrowRelPos={0.93}
          linkDirectionalParticles={particles}
          linkDirectionalParticleWidth={3}
          linkDirectionalParticleSpeed={0.006}
          linkDirectionalParticleColor={(l) => l.color}
          onNodeClick={(n) => onNodeClick(n.id)}
          onLinkClick={(l) => onLinkClick(l.id)}
          onBackgroundClick={onBackgroundClick}
          onNodeHover={(n) => setHoverNodeId(n ? n.id : null)}
          onLinkHover={(l) => setHoverLinkId(l ? l.id : null)}
          onNodeDragEnd={(n) => { n.fx = n.x; n.fy = n.y; }}
          cooldownTicks={0}
          warmupTicks={0}
          minZoom={0.12}
          maxZoom={9}
        />
      )}
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function tip(inner) {
  return `<div style="
    font-family:ui-monospace,monospace;font-size:10.5px;line-height:1.45;
    background:#101116;border:1px solid #26262e;border-radius:8px;
    padding:10px 12px;max-width:270px;
    box-shadow:0 12px 32px -8px rgba(0,0,0,0.85);">${inner}</div>`;
}
