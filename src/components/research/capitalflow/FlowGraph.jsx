// ══════════════════════════════════════════════════════════════════════════
// FlowGraph — the full-screen canvas.
//
// LAYOUT ENGINE — not a plain force hairball. Three custom forces shape a
// deliberate "capital geography":
//   · clusterForce  — pulls every node toward its group's anchor region
//                     (funds left → labs centre → hyperscalers/silicon right
//                      → equipment/power at the physical edge)
//   · collideForce  — keeps nodes from overlapping (naive O(n²), fine at ~70)
//   · a weak charge + very weak links, so cross-cluster flows bend between
//     regions instead of dragging them into each other
// Group regions get a faint tinted halo + an uppercase caption painted
// underneath the nodes, so the map reads like a labeled diagram.
//
// VISUAL ENCODING
//   · node colour   → group (funds gold, labs violet, hyperscalers sky…)
//   · filled disc   → receives capital · hollow → deploys · ring → both
//   · node radius   → total capital in + out (√-scaled, tight range)
//   · edge colour   → deal type · thickness → amount · arrow → direction
//   · labels        → screen-constant size (never blow up when zooming);
//                     Tier-1/2 names always on, the rest appear as you zoom
// ══════════════════════════════════════════════════════════════════════════

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { fmtUSD, nodeRadius, linkWidth, shortLabel } from './format.js';
import { GROUP_META, TIER_META } from '../../../data/capitalFlowData.js';

const BG = '#08090C';

// ── Custom forces ────────────────────────────────────────────────────────
function makeClusterForce(strength = 0.055) {
  let nodes = [];
  const force = (alpha) => {
    for (const n of nodes) {
      const a = GROUP_META[n.group]?.anchor;
      if (!a) continue;
      n.vx += (a.x - n.x) * strength * alpha;
      n.vy += (a.y - n.y) * strength * alpha;
    }
  };
  force.initialize = (ns) => { nodes = ns; };
  return force;
}

function makeCollideForce(pad = 19) {
  let nodes = [];
  const force = () => {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const min = nodeRadius(a) + nodeRadius(b) + pad;
        let dx = b.x - a.x, dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d < 1e-4) { d = 1e-4; dx = min; dy = 0; }
        if (d < min) {
          const push = ((min - d) / d) * 0.42;
          const px = dx * push, py = dy * push;
          a.x -= px; a.y -= py;
          b.x += px; b.y += py;
        }
      }
    }
  };
  force.initialize = (ns) => { nodes = ns; };
  return force;
}

export default function FlowGraph({
  graphData,
  matchedNodes, matchedLinks,
  selectedNodeId, selectedLinkId,
  neighbourNodes, neighbourLinks,
  onNodeClick, onLinkClick, onBackgroundClick,
  showLabels,
  fgRef,
}) {
  const wrapRef = useRef(null);
  const fittedRef = useRef(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hoverNodeId, setHoverNodeId] = useState(null);
  const [hoverLinkId, setHoverLinkId] = useState(null);

  // ── Responsive canvas ──────────────────────────────────────────────────
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const r = entries[0].contentRect;
      setSize({ w: Math.max(320, r.width), h: Math.max(360, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Force tuning ───────────────────────────────────────────────────────
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force('center', null);                                 // clusters own the layout
    fg.d3Force('charge')?.strength(-140).distanceMax(340);
    fg.d3Force('link')?.distance(110).strength(0.028);          // flows bend, don't drag
    fg.d3Force('cluster', makeClusterForce());
    fg.d3Force('collide', makeCollideForce());
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

  // ── Region captions + halos, painted under everything ──────────────────
  const groupVisible = useMemo(() => {
    const s = new Set();
    graphData.nodes.forEach(n => { if (matchedNodes.has(n.id)) s.add(n.group); });
    return s;
  }, [graphData, matchedNodes]);

  const paintRegions = useCallback((ctx) => {
    Object.entries(GROUP_META).forEach(([key, g]) => {
      if (!groupVisible.has(key)) return;
      const { x, y } = g.anchor;
      // soft tinted halo
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 240);
      grad.addColorStop(0, hexA(g.color, 0.045));
      grad.addColorStop(1, hexA(g.color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 240, 0, 2 * Math.PI);
      ctx.fill();
      // caption — graph-space (zooms with the world, like a map label)
      ctx.font = '700 30px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = hexA(g.color, 0.16);
      ctx.fillText(g.label.toUpperCase(), x, y - 190);
    });
  }, [groupVisible]);

  // ── Node painter ───────────────────────────────────────────────────────
  const paintNode = useCallback((node, ctx, globalScale) => {
    const r = nodeRadius(node);
    const lit = nodeLit(node);
    const selected = node.id === selectedNodeId;
    const hovered = node.id === hoverNodeId;
    const alpha = lit ? 1 : 0.08;
    const col = node.color;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (lit && (selected || hovered)) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + (selected ? 6 : 4), 0, 2 * Math.PI);
      ctx.fillStyle = hexA(col, selected ? 0.25 : 0.15);
      ctx.fill();
    }

    // Body — filled = receives capital, hollow = deploys
    const isSink = node.type === 'target' || node.type === 'both';
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    if (isSink) {
      ctx.fillStyle = lit ? col : hexA(col, 0.5);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = BG;
      ctx.stroke();
    } else {
      ctx.fillStyle = BG;
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = col;
      ctx.stroke();
    }

    // Ring marks entities that both deploy and receive
    if (node.type === 'both') {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 2.6, 0, 2 * Math.PI);
      ctx.lineWidth = 1;
      ctx.strokeStyle = hexA(col, 0.7);
      ctx.stroke();
    }

    if (selected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI);
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = '#fafafa';
      ctx.stroke();
    }

    // ── Labels — SCREEN-CONSTANT size (px / scale), clamped, never huge ──
    const zoomedIn = globalScale > 1.5;
    const show = showLabels && lit && (
      selected || hovered ||
      node.tier === 1 || node.tier === 2 ||
      r > 8 || zoomedIn
    );
    if (show) {
      const px = selected || hovered ? 12 : node.tier === 1 ? 10.5 : 9.5;   // px on screen
      const fs = px / globalScale;                                          // → graph units
      ctx.font = `600 ${fs}px -apple-system, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const label = shortLabel(node.name);
      const y = node.y + r + 3 / globalScale + 1.5;
      const w = ctx.measureText(label).width;
      ctx.globalAlpha = alpha * 0.66;
      ctx.fillStyle = BG;
      ctx.fillRect(node.x - w / 2 - 2.5 / globalScale, y - 1 / globalScale, w + 5 / globalScale, fs * 1.25);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = selected || hovered ? '#ffffff' : node.tier === 1 ? '#e8e8ec' : '#b9b9c2';
      ctx.fillText(label, node.x, y);

      // amount, only on focus or deep zoom — small mono, screen-constant
      if (selected || hovered || globalScale > 2.6) {
        const fs2 = (px - 2.5) / globalScale;
        ctx.font = `500 ${fs2}px ui-monospace, monospace`;
        ctx.fillStyle = hexA(col, 0.95);
        ctx.fillText(fmtUSD(node.totalFlow), node.x, y + fs * 1.3);
      }
    }

    ctx.restore();
  }, [nodeLit, selectedNodeId, hoverNodeId, showLabels]);

  const paintPointerArea = useCallback((node, colour, ctx) => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius(node) + 5, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  // ── Link styling ───────────────────────────────────────────────────────
  const linkColor = useCallback((l) => {
    const lit = linkLit(l);
    if (!lit) return hexA('#3f3f46', 0.1);
    if (l.id === selectedLinkId) return '#fafafa';
    if (l.id === hoverLinkId) return hexA(l.color, 1);
    return hexA(l.color, hasSelection ? 0.9 : 0.62);
  }, [linkLit, selectedLinkId, hoverLinkId, hasSelection]);

  const linkW = useCallback((l) => {
    const w = linkWidth(l);
    if (l.id === selectedLinkId) return w + 1.4;
    if (l.id === hoverLinkId) return w + 0.9;
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
        <span style="color:#71717a">Capital in</span><span style="color:#34D399;text-align:right">${fmtUSD(n.totalInflow)}</span>
        <span style="color:#71717a">Capital out</span><span style="color:#F59E0B;text-align:right">${fmtUSD(n.totalOutflow)}</span>
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
          linkDirectionalArrowLength={3.6}
          linkDirectionalArrowRelPos={0.96}
          linkDirectionalParticles={particles}
          linkDirectionalParticleWidth={2.4}
          linkDirectionalParticleSpeed={0.006}
          linkDirectionalParticleColor={(l) => l.color}
          onNodeClick={(n) => onNodeClick(n.id)}
          onLinkClick={(l) => onLinkClick(l.id)}
          onBackgroundClick={onBackgroundClick}
          onNodeHover={(n) => setHoverNodeId(n ? n.id : null)}
          onLinkHover={(l) => setHoverLinkId(l ? l.id : null)}
          onNodeDragEnd={(n) => { n.fx = n.x; n.fy = n.y; }}
          onEngineStop={() => {
            if (!fittedRef.current) {
              fittedRef.current = true;
              fgRef.current?.zoomToFit(600, 80);
            }
          }}
          d3VelocityDecay={0.32}
          cooldownTime={6000}
          warmupTicks={80}
          minZoom={0.2}
          maxZoom={9}
        />
      )}
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────
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
