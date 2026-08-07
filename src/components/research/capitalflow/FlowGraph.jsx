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
import { SECTOR_META, CLASS_META, TIER_META, STATUS_META, NETWORK_META } from '../../../data/capitalMap.js';

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

  // ── Brand-logo image cache — load once, repaint when they arrive ───────
  const logoCache = useRef(new Map());
  const [logoTick, setLogoTick] = useState(0);
  const refreshTimer = useRef(null);
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) return;
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
      setLogoTick(t => t + 1);           // new painter identity → force a redraw
      fgRef.current?.refresh?.();
    }, 120);
  }, [fgRef]);
  // Try each logo candidate in order; fall through to the monogram on misses.
  const getLogo = useCallback((node) => {
    const urls = node.logoUrls || [];
    const c = logoCache.current;
    if (c.has(node.id)) return c.get(node.id);
    const entry = { img: null, ok: false, done: false };
    c.set(node.id, entry);
    if (!urls.length) { entry.done = true; return entry; }
    let i = 0;
    const tryNext = () => {
      if (i >= urls.length) { entry.done = true; entry.ok = false; scheduleRefresh(); return; }
      const img = new Image();
      entry.img = img;
      img.onload = () => {
        if (img.naturalWidth > 0) { entry.ok = true; entry.done = true; scheduleRefresh(); }
        else { i++; tryNext(); }
      };
      img.onerror = () => { i++; tryNext(); };
      img.src = urls[i];
    };
    tryNext();
    return entry;
  }, [scheduleRefresh]);

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

  // ── Source-class clusters (inner) + sector cells (outer) ───────────────
  const paintRegions = useCallback((ctx) => {
    regions.forEach(r => {
      const lit = r.lit;
      const source = r.type === 'source';

      // Soft glow POOL — a zone, not a bordered circle. Radial fade to nothing.
      const glowR = r.r * 1.45;
      const baseA = source ? 0.085 : (lit ? 0.16 : 0.075);
      const g = ctx.createRadialGradient(r.cx, r.cy, r.r * 0.12, r.cx, r.cy, glowR);
      g.addColorStop(0, hexA(r.color, baseA));
      g.addColorStop(0.65, hexA(r.color, baseA * 0.4));
      g.addColorStop(1, hexA(r.color, 0));
      ctx.beginPath();
      ctx.arc(r.cx, r.cy, glowR, 0, 2 * Math.PI);
      ctx.fillStyle = g;
      ctx.fill();

      // Only a signalling sector gets a faint accent ring (the alpha moment).
      if (lit) {
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.r + 4, 0, 2 * Math.PI);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = hexA(r.color, 0.5);
        ctx.stroke();
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = `700 ${source ? 19 : 25}px ui-monospace, monospace`;
      ctx.fillStyle = hexA(r.color, source ? 0.85 : lit ? 0.96 : 0.72);
      ctx.fillText(r.label, r.cx, r.cy - r.r - 12);

      if (lit) {
        ctx.font = '700 14px ui-monospace, monospace';
        ctx.fillStyle = hexA(r.color, 0.9);
        ctx.fillText(`◆ ${r.signals?.[0]?.theme || 'signal'}`.toUpperCase(), r.cx, r.cy - r.r - 38);
      }

      if (r.stats) {
        ctx.textBaseline = 'top';
        ctx.font = `600 ${source ? 13 : 17}px ui-monospace, monospace`;
        ctx.fillStyle = hexA(r.color, 0.4);
        ctx.fillText(r.stats, r.cx, r.cy + r.r + 8);
      }
    });
  }, [regions]);

  // ── Node painter — brand-logo "app-icon" tile ─────────────────────────
  //   logo   = the real company mark (Clearbit) · monogram tile fallback
  //   colour = domain (accent rim: sector for targets · class for allocators)
  //   size   = capital · gold rim = key/core · dashed = stale / unconfirmed
  //   labels reveal by zoom, ranked by importance (see node.labelScale)
  const paintNode = useCallback((node, ctx, globalScale) => {
    const lit = nodeLit(node);
    const selected = node.id === selectedNodeId;
    const hovered = node.id === hoverNodeId;
    const dim = node.stale ? 0.4 : node.watchOnly ? 0.72 : 1;
    const alpha = lit ? dim : 0.06;
    const col = node.color;
    const R = node.r || 12;
    const cx = node.x, cy = node.y;
    const S = R * 1.85;              // tile side
    const half = S / 2;
    const x = cx - half, y = cy - half;
    const corner = S * 0.26;        // rounded-square radius (app-icon look)
    const goldRim = node.tier === 'key' || node.tier === 'core';

    ctx.save();
    ctx.globalAlpha = alpha;

    // selection / hover glow
    if (lit && (selected || hovered)) {
      roundRect(ctx, x - 5, y - 5, S + 10, S + 10, corner + 4);
      ctx.fillStyle = hexA(col, selected ? 0.28 : 0.15); ctx.fill();
    }
    // core-tier → faint gold halo
    if (node.tier === 'core') {
      roundRect(ctx, x - 3, y - 3, S + 6, S + 6, corner + 3);
      ctx.lineWidth = 1.4; ctx.strokeStyle = hexA('#FDE047', 0.6); ctx.stroke();
    }

    // cheap flat drop shadow (an offset dark tile) — no shadowBlur, so it stays
    // fast even while the flow particles keep the canvas repainting.
    roundRect(ctx, x + R * 0.06 + 1, y + R * 0.16 + 1, S, S, corner);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fill();
    // tile base
    roundRect(ctx, x, y, S, S, corner);
    ctx.fillStyle = '#0e0f14';
    ctx.fill();

    const logo = getLogo(node);
    if (logo && logo.ok && logo.img && logo.img.naturalWidth) {
      // light plate so dark logos read, then the logo contained with padding
      roundRect(ctx, x, y, S, S, corner);
      ctx.fillStyle = '#f4f5f7'; ctx.fill();
      ctx.save();
      roundRect(ctx, x, y, S, S, corner); ctx.clip();
      const pad = S * 0.15;
      const iw = logo.img.naturalWidth, ih = logo.img.naturalHeight;
      const box = S - pad * 2;
      const sc = Math.min(box / iw, box / ih);
      ctx.drawImage(logo.img, cx - (iw * sc) / 2, cy - (ih * sc) / 2, iw * sc, ih * sc);
      ctx.restore();
    } else {
      // monogram tile: domain-colour gradient + initials
      const g = ctx.createLinearGradient(x, y, x + S, y + S);
      g.addColorStop(0, mix(col, '#ffffff', 0.22));
      g.addColorStop(1, mix(col, '#05060a', 0.45));
      roundRect(ctx, x, y, S, S, corner); ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = `800 ${S * 0.4}px -apple-system, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(node.monogram || '?', cx, cy + S * 0.02);
    }

    // networked allocator → warm outer bracket ring (elite-network member)
    if (node.network) {
      const nc = NETWORK_META[node.network]?.color || '#F5B942';
      roundRect(ctx, x - 4, y - 4, S + 8, S + 8, corner + 4);
      ctx.lineWidth = 2;
      ctx.strokeStyle = hexA(nc, hovered || selected ? 1 : 0.85);
      ctx.stroke();
    }

    // accent rim = domain colour (keeps the colour encoding)
    roundRect(ctx, x, y, S, S, corner);
    ctx.lineWidth = selected ? 2.6 : goldRim ? 2.2 : 1.6;
    ctx.strokeStyle = selected ? '#ffffff' : goldRim ? '#FDE047' : hexA(col, hovered ? 1 : 0.9);
    if (node.stale || node.watchOnly) ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // label — reveal by zoom, ranked by importance (node.labelScale)
    const gs = globalScale || 1;
    const showLabel = selected || hovered || (showLabels && gs >= (node.labelScale || 1));
    if (showLabel) {
      const lx = cx + half + 6;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const big = node.atomTier <= 1;
      ctx.font = `${big ? 700 : 600} ${Math.max(11, R * 0.62)}px -apple-system, "Segoe UI", sans-serif`;
      ctx.fillStyle = selected || hovered ? '#ffffff' : hexA('#e6e8ee', big ? 0.96 : 0.78);
      ctx.fillText(node.atomLabel, lx, cy - (node.atomValue ? R * 0.42 : 0));
      if (node.atomValue) {
        ctx.font = `600 ${Math.max(10, R * 0.5)}px ui-monospace, monospace`;
        ctx.fillStyle = hexA(mix(col, '#ffffff', 0.3), 0.95);
        ctx.fillText(node.atomValue, lx, cy + R * 0.5);
      }
    }

    ctx.restore();
  }, [nodeLit, selectedNodeId, hoverNodeId, showLabels, getLogo, logoTick]);

  const paintPointerArea = useCallback((node, colour, ctx) => {
    const S = (node.r || 12) * 1.85, half = S / 2;
    ctx.fillStyle = colour;
    roundRect(ctx, node.x - half, node.y - half, S, S, S * 0.26);
    ctx.fill();
  }, []);

  // ── Link styling ───────────────────────────────────────────────────────
  const linkColor = useCallback((l) => {
    const lit = linkLit(l);
    if (!lit) return hexA('#3f3f46', 0.06);
    if (l.id === selectedLinkId) return '#fafafa';
    // All bonds are SOLID; confidence (0–100 grade score) drives opacity so
    // high-confidence flows read stronger. Falls back to status when absent.
    const conf = typeof l.confidence === 'number'
      ? 0.3 + 0.7 * (l.confidence / 100)
      : (l.status === 'verified' ? 1 : l.status === 'verified_alpha' ? 0.7 : 0.46);
    const a = (0.36 + 0.55 * Math.sqrt(l.amountShare || 0)) * conf;
    if (l.id === hoverLinkId) return hexA(l.color, Math.min(1, a + 0.45));
    return hexA(l.color, hasSelection ? Math.min(1, a + 0.3) : a);
  }, [linkLit, selectedLinkId, hoverLinkId, hasSelection]);

  const linkW = useCallback((l) => {
    // Restrained widths — importance reads through opacity + flow, not girth.
    const w = 0.6 + 2.8 * Math.sqrt(l.amountShare || 0);
    if (l.id === selectedLinkId) return w + 1.6;
    if (l.id === hoverLinkId) return w + 1;
    return w;
  }, [selectedLinkId, hoverLinkId]);

  const particles = useCallback((l) => {
    // Motion only on focus (selection / neighbourhood) — the map stays calm and
    // still when idle, so it never continuously repaints. Movement is a reward
    // for clicking in, not constant noise.
    if (l.id === selectedLinkId) return 6;
    if (l.id === hoverLinkId) return 4;
    if (hasSelection) return (neighbourLinks.has(l.id) && matchedLinks.has(l.id)) ? 4 : 0;
    return 0;
  }, [selectedLinkId, hoverLinkId, hasSelection, neighbourLinks, matchedLinks]);

  // ── Hover tooltips ─────────────────────────────────────────────────────
  const nodeTooltip = useCallback((n) => {
    const cls = CLASS_META[n.cls];
    const sec = n.sector ? SECTOR_META[n.sector] : null;
    const t = n.tier ? TIER_META[n.tier] : null;
    const role = n.type === 'player' ? 'Allocator · deploys' : 'Target · receives';
    const side = n.type === 'player'
      ? `<span style="color:#71717a">Capital out</span><span style="color:#C2A36B;text-align:right">${fmtUSD(n.totalOutflow)}</span>`
      : `<span style="color:#71717a">Capital in</span><span style="color:#82B98D;text-align:right">${fmtUSD(n.totalInflow)}</span>`;
    return tip(`
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:5px">
        <span style="font-weight:700;font-size:12.5px;color:#fafafa">${esc(n.name)}</span>
        ${t ? `<span style="color:${t.color};font-size:9px;font-weight:700">${t.short} ${t.stars}</span>` : ''}
        ${n.stale ? '<span style="color:#94A3B8;font-size:9px;font-weight:700">COOLED</span>' : ''}
      </div>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
        <span style="width:7px;height:7px;border-radius:50%;background:${n.color}"></span>
        <span style="color:#a1a1aa">${esc(cls?.label || n.cls)}</span>
        ${sec ? `<span style="color:#3f3f46">·</span><span style="color:#71717a">${esc(sec.label)}</span>` : ''}
        <span style="color:#3f3f46">·</span>
        <span style="color:#71717a">${esc(role)}</span>
      </div>
      <div style="display:grid;grid-template-columns:auto auto;gap:2px 14px">
        <span style="color:#71717a">Capital</span><span style="color:#e4e4e7;text-align:right">${fmtUSD(n.capital)}</span>
        ${side}
        <span style="color:#71717a">Deals</span><span style="color:#a1a1aa;text-align:right">${n.deals}</span>
        <span style="color:#71717a">Last activity</span><span style="color:#a1a1aa;text-align:right">${esc(n.last_activity || '—')}</span>
      </div>
      <div style="margin-top:7px;color:#52525b;font-size:9px">Click → full breakdown panel</div>
    `);
  }, []);

  const linkTooltip = useCallback((l) => {
    const s = typeof l.source === 'object' ? l.source.name : l.sourceId;
    const t = typeof l.target === 'object' ? l.target.name : l.targetId;
    const st = STATUS_META[l.status] || {};
    return tip(`
      <div style="font-weight:700;font-size:12.5px;color:#fafafa;margin-bottom:4px">${l.disclosed ? fmtUSD(l.amount) : 'Undisclosed'}</div>
      <div style="color:#d4d4d8;margin-bottom:5px">${esc(s)} <span style="color:${l.color}">→</span> ${esc(t)}</div>
      <div style="display:flex;gap:6px;align-items:center">
        <span style="width:7px;height:7px;border-radius:2px;background:${l.color}"></span>
        <span style="color:#a1a1aa">${esc(l.eventLabel)}</span>
        <span style="color:#3f3f46">·</span>
        <span style="color:${st.color || '#71717a'}">${esc(st.short || l.status)}</span>
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
          linkDirectionalArrowLength={(l) => 4 + 7 * Math.sqrt(l.amountShare || 0)}
          linkDirectionalArrowRelPos={0.92}
          linkDirectionalParticles={particles}
          linkDirectionalParticleWidth={(l) => 1.6 + 3 * Math.sqrt(l.amountShare || 0)}
          linkDirectionalParticleSpeed={(l) => 0.003 + 0.005 * (l.amountShare || 0)}
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

// Blend two hex colours by t (0 = a, 1 = b). Used for the atom gradient.
function mix(a, b, t) {
  const pa = parseInt(a.replace('#', ''), 16), pb = parseInt(b.replace('#', ''), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
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
