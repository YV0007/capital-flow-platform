// ══════════════════════════════════════════════════════════════════════════
// EcoGraph — the full-screen ecosystem canvas. Static diagram, zero forces.
//
// Same engine and the same feel as capitalflow/FlowGraph (react-force-graph,
// pinned fx/fy, cheap flat shadows, logo tiles, canvasTheme surfaces), but it
// draws different objects, so both the node and the link painters are
// replaced outright:
//
//   · NODE — a radial CAPSULE, not a tile. One capsule per company however
//     many layers it occupies; thickness at each layer is its criticality
//     there. Role is carried by the outline, not by colour alone.
//   · LINK — drawn between the two ends' LAYER PORTS, not between node
//     centres, so a chain enters and leaves a multi-layer company at the
//     right ring. Cool = physical spine, warm = capital spine. Solid = two
//     confirmed sources, dashed = one.
//   · RINGS — twelve, painted behind everything, tinted by the layer's
//     concentration. Their labels at 12 o'clock are the only clickable text
//     on the canvas (they open the layer report — nodes stay companies).
// ══════════════════════════════════════════════════════════════════════════

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useThemeMode, canvasTokens, tone } from '../capitalflow/canvasTheme.js';
import { shortLabel } from '../capitalflow/format.js';
import { CONCENTRATION_META, criticalityBand } from '../../../data/ecosystemMap.js';
import { capsulePath, mapRadius } from './ecoLayout.js';

export default function EcoGraph({
  graphData, rings, techNodes,
  visibleNodes, visibleEdges,
  chain, chainRoot,
  cycleEdges, cycleMode,
  selectedNodeId, selectedEdgeId,
  onNodeClick, onEdgeClick, onBackgroundClick, onRingClick, onReady,
  showLabels, showTech, topInset = 0,
  fgRef,
}) {
  const mode = useThemeMode();
  const T = canvasTokens(mode);
  const wrapRef = useRef(null);
  const hoverRingRef = useRef(null);
  const handledAtRef = useRef(0);
  const lastResizeRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hoverNodeId, setHoverNodeId] = useState(null);
  const [hoverEdgeId, setHoverEdgeId] = useState(null);

  const hasChain = !!chainRoot && chain && chain.nodes.size > 1;
  const nodeIndex = useMemo(() => new Map(graphData.nodes.map(n => [n.id, n])), [graphData]);

  // ── Brand-logo cache — identical strategy to FlowGraph ─────────────────
  const logoCache = useRef(new Map());
  const [logoTick, setLogoTick] = useState(0);
  const refreshTimer = useRef(null);
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) return;
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
      setLogoTick(t => t + 1);
      fgRef.current?.refresh?.();
    }, 120);
  }, [fgRef]);
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
        if (img.naturalWidth > 0) {
          entry.ok = true; entry.done = true;
          entry.vector = /\.svg(\?|$)/i.test(urls[i]);
          scheduleRefresh();
        } else { i++; tryNext(); }
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

  // Frame the whole wheel. The geometry is known — centre (0,0), outer radius
  // from the layout — so the camera is set directly instead of fitted to a
  // node bbox: the cloud is never symmetric, and the rim labels sit outside it.
  const camera = useMemo(() => {
    const R = mapRadius(rings.length || 12);
    // The usable canvas is the viewport minus whatever floats over its top
    // (bar, and the draft banner when it is up): the wheel is scaled to fit
    // THAT and nudged down by half of it, or the outermost ring labels end up
    // under the header.
    const usableH = Math.max(120, size.h - topInset);
    const k = Math.min(size.w || 1, usableH) / (2 * R * 1.04);
    return { k, y: -topInset / (2 * k) };
  }, [rings, size, topInset]);

  const frameAll = useCallback((ms = 0) => {
    const fg = fgRef.current;
    if (!fg || !size.w || !size.h) return;
    fg.centerAt(0, camera.y, ms);
    fg.zoom(camera.k, ms);
  }, [fgRef, size, camera]);

  // Frame once on mount — but VERIFY, don't fire-and-forget. force-graph sets
  // up its own camera asynchronously and will happily overwrite a zoom issued
  // a moment too early (it did: the call reported success and the map still
  // opened at 1:1). So the poll keeps re-applying until the camera has held
  // the target across consecutive checks, then stops for good and leaves the
  // camera to the user.
  const framedRef = useRef(false);
  useEffect(() => {
    if (framedRef.current || !size.w) return;
    let tries = 0, held = 0;
    const iv = setInterval(() => {
      const fg = fgRef.current;
      if (framedRef.current || ++tries > 60 || !fg) { clearInterval(iv); return; }
      if (performance.now() - lastResizeRef.current < 350) return;
      const at = Math.abs((fg.zoom() || 0) - camera.k) < camera.k * 0.02;
      if (at) {
        if (++held >= 3) { framedRef.current = true; clearInterval(iv); }
        return;
      }
      held = 0;
      frameAll(0);
    }, 150);
    return () => clearInterval(iv);
  }, [size, camera, frameAll, fgRef]);

  useEffect(() => { if (onReady) onReady({ frameAll }); }, [onReady, frameAll]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force('center', null);
    fg.d3Force('charge', null);
    fg.d3Force('link', null);
  }, [fgRef, graphData]);

  useEffect(() => { fgRef.current?.refresh?.(); }, [mode, fgRef]);

  // ── Lit / visible predicates ───────────────────────────────────────────
  const nodeLit = useCallback((n) => {
    if (!visibleNodes.has(n.id)) return false;
    if (cycleMode) return n.onCycle;
    if (!hasChain) return true;
    return chain.nodes.has(n.id);
  }, [visibleNodes, hasChain, chain, cycleMode]);

  const edgeLit = useCallback((e) => {
    if (!visibleEdges.has(e.id)) return false;
    if (cycleMode) return cycleEdges.has(e.id);
    if (!hasChain) return true;
    return chain.edges.has(e.id);
  }, [visibleEdges, hasChain, chain, cycleMode, cycleEdges]);

  const nodeVisible = useCallback((n) => visibleNodes.has(n.id), [visibleNodes]);
  const edgeVisible = useCallback((e) => visibleEdges.has(e.id), [visibleEdges]);

  // ── Rings — painted behind everything ──────────────────────────────────
  const paintRings = useCallback((ctx, globalScale) => {
    const gs = globalScale || 1;
    // Outermost first, so the inner rings' tint sits on top and the centre
    // reads as the deepest part of the well.
    [...rings].reverse().forEach(ring => {
      const conc = CONCENTRATION_META[ring.concentration?.level] || CONCENTRATION_META.competitive;
      const band = tone(ring.color, mode);
      const cc = tone(conc.color, mode);

      // Band fill — the layer's own slab of the wheel.
      ctx.beginPath();
      ctx.arc(0, 0, ring.outer, 0, 2 * Math.PI);
      ctx.fillStyle = hexA(band, mode === 'light' ? 0.055 : 0.035);
      ctx.fill();

      // Concentration ring — the alarm colour lives on the RING, not on the
      // nodes, so a monopolistic layer looks wrong at a glance.
      ctx.beginPath();
      ctx.arc(0, 0, ring.r, 0, 2 * Math.PI);
      ctx.lineWidth = Math.max(0.6, 1.4 / gs);
      ctx.strokeStyle = hexA(cc, ring.concentration?.level === 'competitive'
        ? (mode === 'light' ? 0.22 : 0.14)
        : (mode === 'light' ? 0.5 : 0.34));
      ctx.setLineDash(ring.concentration?.level === 'monopoly' ? [] : [10 / gs, 8 / gs]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Ring LABELS, stacked in the 12 o'clock corridor the layout keeps clear.
    // These are the only clickable text on the canvas — they open the layer
    // report. Nodes stay companies; a layer is a coordinate, not an object.
    // Sizes here are SCREEN-constant (divided by the zoom), so a ring label
    // stays readable at "whole wheel" zoom instead of shrinking to four pixels.
    const padX = 9 / gs, padY = 6 / gs;
    rings.forEach(ring => {
      const cc = tone((CONCENTRATION_META[ring.concentration?.level] || CONCENTRATION_META.competitive).color, mode);
      const hot = hoverRingRef.current === ring.key;
      const y = -ring.r;
      const fs = 12.5 / gs;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${fs}px ui-monospace, monospace`;
      const title = `${ring.key} · ${ring.label}`;
      const w = ctx.measureText(title).width;

      // A plate behind it, or the wheel's own lines cut the text in half.
      roundRect(ctx, -w / 2 - padX, y - fs / 2 - padY, w + padX * 2, fs + padY * 2, 7);
      ctx.fillStyle = hexA(T.bg, mode === 'light' ? 0.9 : 0.86);
      ctx.fill();
      ctx.lineWidth = 1 / gs;
      ctx.strokeStyle = hexA(cc, hot ? 0.8 : 0.28);
      ctx.stroke();

      ctx.fillStyle = hot ? T.labelStrong : hexA(T.label, ring.count ? 0.92 : 0.42);
      ctx.fillText(title, 0, y);

      ring._hit = {
        x0: -w / 2 - padX, x1: w / 2 + padX,
        y0: y - fs / 2 - padY, y1: y + fs / 2 + padY,
      };

      // The caption only appears once you are close enough to read it.
      if (gs > 0.5) {
        ctx.font = `600 ${fs * 0.74}px ui-monospace, monospace`;
        ctx.fillStyle = hexA(T.label, 0.5);
        ctx.fillText(ring.caption, 0, y + fs * 1.15);
      }
    });

    // Tech nodes — satellites beside their owner, never free-standing nodes.
    if (showTech && gs > 0.3) {
      techNodes.forEach(t => {
        if (t._x == null) return;
        const owner = nodeIndex.get(t.owner);
        if (owner && !nodeLit(owner)) return;
        ctx.beginPath();
        ctx.arc(t._x, t._y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = hexA(tone('#A46FD6', mode), 0.9);
        ctx.fill();
        ctx.font = `700 ${13}px ui-monospace, monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = hexA(T.label, 0.8);
        ctx.fillText(t.label, t._x + 11, t._y);
      });
    }
  }, [rings, mode, T, techNodes, showTech, nodeIndex, nodeLit]);

  // ── Ring labels are clickable ─────────────────────────────────────────
  const ringAt = useCallback((ev) => {
    const fg = fgRef.current;
    if (!fg || !ev || typeof fg.screen2GraphCoords !== 'function') return null;
    const rect = wrapRef.current?.getBoundingClientRect();
    const sx = rect ? ev.clientX - rect.left : ev.offsetX;
    const sy = rect ? ev.clientY - rect.top : ev.offsetY;
    if (!Number.isFinite(sx) || !Number.isFinite(sy)) return null;
    const p = fg.screen2GraphCoords(sx, sy);
    if (!p) return null;
    return rings.find(r => r._hit
      && p.x >= r._hit.x0 && p.x <= r._hit.x1
      && p.y >= r._hit.y0 && p.y <= r._hit.y1) || null;
  }, [rings, fgRef]);

  const handleMove = useCallback((ev) => {
    if (!onRingClick) return;
    const hit = ringAt(ev);
    const key = hit ? hit.key : null;
    if (hoverRingRef.current !== key) {
      hoverRingRef.current = key;
      const canvas = wrapRef.current?.querySelector('canvas');
      if (canvas) canvas.style.cursor = key ? 'pointer' : '';
      fgRef.current?.refresh?.();
    }
  }, [ringAt, onRingClick, fgRef]);

  // Capture phase, so an edge crossing the label corridor cannot steal the
  // click (same trick as the flow map's cluster titles).
  const handleClickCapture = useCallback((ev) => {
    if (!onRingClick) return;
    const hit = ringAt(ev);
    if (!hit) return;
    ev.stopPropagation();
    ev.preventDefault();
    handledAtRef.current = performance.now();
    onRingClick(hit.key);
  }, [ringAt, onRingClick]);

  const handleBackground = useCallback((ev) => {
    if (performance.now() - handledAtRef.current < 500) return;
    if (onRingClick) {
      const hit = ringAt(ev);
      if (hit) { onRingClick(hit.key); return; }
    }
    onBackgroundClick?.();
  }, [ringAt, onRingClick, onBackgroundClick]);

  // ── Node painter — the radial capsule ─────────────────────────────────
  const paintNode = useCallback((node, ctx, globalScale) => {
    if (!visibleNodes.has(node.id)) return;
    const gs = globalScale || 1;
    const lit = nodeLit(node);
    const selected = node.id === selectedNodeId;
    const hovered = node.id === hoverNodeId;
    const isRoot = node.id === chainRoot;
    const dim = node.faded ? 0.45 : 1;
    const alpha = lit ? dim : (hasChain || cycleMode ? 0.06 : 0.5);

    const col = tone(node.color, mode);
    const role = node.roleMeta || {};
    const pts = node._capsule || (node._capsule = capsulePath(node));
    const p = node._primaryGeo;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Chain root gets a bloom so you never lose where you clicked.
    if (lit && (isRoot || selected)) {
      const g = ctx.createRadialGradient(p.x, p.y, p.hw * 0.3, p.x, p.y, p.hw * 4.2);
      g.addColorStop(0, hexA(T.pivotGlow, 0.55));
      g.addColorStop(0.45, hexA(T.pivotGlow, 0.2));
      g.addColorStop(1, hexA(T.pivotGlow, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.hw * 4.2, 0, 2 * Math.PI); ctx.fill();
    }

    // Body — flat shadow, then the capsule itself.
    tracePoly(ctx, pts, 2.2, 3.2);
    ctx.fillStyle = T.tileShadow;
    ctx.fill();
    tracePoly(ctx, pts);
    ctx.fillStyle = T.nodeTile;
    ctx.fill();

    // A colour wash inside the capsule so the band (= how deep in the stack)
    // is visible even where the logo covers the middle.
    tracePoly(ctx, pts);
    ctx.fillStyle = hexA(col, mode === 'light' ? 0.2 : 0.32);
    ctx.fill();

    // Multi-layer only: a spine down the capsule's axis, plus a pip at every
    // layer the company occupies. Without them the thin bridge between two
    // distant layers reads as an EDGE at map zoom, and the one thing the
    // capsule exists to say — "this is a single company spanning the stack" —
    // is exactly what gets lost.
    if (node.multiLayer) {
      const a = node._angle;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * node._rIn, Math.sin(a) * node._rIn);
      ctx.lineTo(Math.cos(a) * node._rOut, Math.sin(a) * node._rOut);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = hexA(col, 0.75);
      ctx.stroke();
      node._segGeo.forEach(s => {
        if (s.primary) return;
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(4, s.hw * 0.34), 0, 2 * Math.PI);
        ctx.fillStyle = hexA(col, 0.95);
        ctx.fill();
      });
    }

    // Outline carries the ROLE — solid producer, dashed capital, dotted
    // platform — so roles survive a colour-blind eye and a printed page.
    tracePoly(ctx, pts);
    ctx.lineWidth = (selected || isRoot) ? 3.2 : hovered ? 2.4 : 1.6;
    ctx.strokeStyle = selected || isRoot
      ? T.selectRing
      : hexA(tone(role.color || col, mode), hovered ? 1 : 0.85);
    const dash = ROLE_DASH[node.role];
    if (dash) ctx.setLineDash(dash);
    if (node.faded) ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Logo sits in the PRIMARY layer's segment — the one the label belongs to.
    const S = Math.min(p.hw * 1.62, 62);
    const logo = getLogo(node);
    if (logo && logo.ok && logo.img && logo.img.naturalWidth && S > 14) {
      ctx.save();
      roundRect(ctx, p.x - S / 2, p.y - S / 2, S, S, S * 0.26);
      ctx.fillStyle = T.logoPlate; ctx.fill();
      ctx.clip();
      const pad = S * 0.16;
      const iw = logo.img.naturalWidth, ih = logo.img.naturalHeight;
      const box = S - pad * 2;
      let sc = Math.min(box / iw, box / ih);
      if (!logo.vector) sc = Math.min(sc, 2 / gs);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(logo.img, p.x - (iw * sc) / 2, p.y - (ih * sc) / 2, iw * sc, ih * sc);
      ctx.restore();
    } else {
      ctx.fillStyle = hexA(mode === 'light' ? '#0F172A' : '#ffffff', 0.86);
      ctx.font = `800 ${Math.max(9, S * 0.42)}px -apple-system, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(node.monogram || '?', p.x, p.y);
    }

    // On a cycle, in cycle mode: a hot dot at the primary segment.
    if (cycleMode && node.onCycle) {
      ctx.beginPath();
      ctx.arc(p.x, p.y - p.hw - 9, 5, 0, 2 * Math.PI);
      ctx.fillStyle = tone('#E5484D', mode);
      ctx.fill();
    }

    // Label — placed tangentially so it never crosses its own capsule, and
    // flipped on the left half of the wheel so it is never upside down.
    const showLabel = selected || hovered || isRoot
      || (showLabels && gs >= (node._labelScale || 1));
    if (showLabel) {
      const a = node._angle;
      const lr = node._rOut + 9;
      const lx = Math.cos(a) * lr, ly = Math.sin(a) * lr;
      const flip = Math.cos(a) < 0;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(flip ? a + Math.PI : a);
      ctx.textAlign = flip ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `${node.tier === 'anchor' ? 700 : 600} ${Math.max(11, p.hw * 0.6)}px -apple-system, "Segoe UI", sans-serif`;
      ctx.fillStyle = selected || hovered || isRoot
        ? T.labelStrong
        : hexA(T.label, node.tier === 'anchor' ? 0.96 : 0.76);
      ctx.fillText(shortLabel(node.name, 22), 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }, [visibleNodes, nodeLit, selectedNodeId, hoverNodeId, chainRoot, hasChain, cycleMode,
      showLabels, getLogo, logoTick, mode, T]);

  const paintPointerArea = useCallback((node, colour, ctx) => {
    if (!visibleNodes.has(node.id)) return;
    tracePoly(ctx, node._capsule || (node._capsule = capsulePath(node)));
    ctx.fillStyle = colour;
    ctx.fill();
  }, [visibleNodes]);

  // ── Edge painter — port to port, not centre to centre ─────────────────
  const paintEdge = useCallback((edge, ctx, globalScale) => {
    if (!visibleEdges.has(edge.id)) return;
    const gs = globalScale || 1;
    const lit = edgeLit(edge);
    const selected = edge.id === selectedEdgeId;
    const hovered = edge.id === hoverEdgeId;
    const cyc = cycleEdges.get(edge.id);

    let color = tone(edge.color, mode);
    let alpha = lit
      ? (0.3 + 0.55 * ((edge.strength || 0) / 100)) * (edge.faded ? 0.45 : 1)
      : ((hasChain || cycleMode) ? 0.035 : 0.1);
    if (lit && cycleMode && cyc) { color = tone(cyc.color, mode); alpha = 0.95; }
    if (selected) { color = T.labelStrong; alpha = 1; }
    else if (hovered && lit) alpha = Math.min(1, alpha + 0.35);
    if (mode === 'light') alpha = Math.min(1, alpha * 1.25);

    const w = (0.9 + 3.4 * Math.sqrt((edge.strength || 0) / 100))
      * (selected ? 2 : hovered ? 1.5 : 1)
      * (lit && cycleMode && cyc ? 1.7 : 1);

    const { x0, y0, x1, y1, cx, cy } = edgeGeometry(edge);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = hexA(color, alpha);
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    // Two confirmed independent sources → solid. One → dashed, whatever the
    // tier. `estimate` and `press` are dashed by rule too (see the adapter).
    if (!edge.solid) ctx.setLineDash([9 / gs * 1.4, 7 / gs * 1.4]);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow — direction is always supplier → consumer, so it also reads as
    // "which way up the stack".
    if (lit && gs > 0.22) {
      const t = 0.86;
      const px = qp(x0, cx, x1, t), py = qp(y0, cy, y1, t);
      const dx = qd(x0, cx, x1, t), dy = qd(y0, cy, y1, t);
      const a = Math.atan2(dy, dx);
      const s = 6 + 7 * Math.sqrt((edge.strength || 0) / 100);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - Math.cos(a - 0.42) * s, py - Math.sin(a - 0.42) * s);
      ctx.lineTo(px - Math.cos(a + 0.42) * s, py - Math.sin(a + 0.42) * s);
      ctx.closePath();
      ctx.fillStyle = hexA(color, alpha);
      ctx.fill();
    }

    // Tech-node caption on the edge — "EUV", "CoWoS", "CUDA". This is what
    // makes a dependency legible without opening anything: the label names
    // the thing that actually moves.
    if (lit && edge.techMeta && (selected || hovered || (hasChain && gs > 0.3) || gs > 0.75)) {
      const mx = qp(x0, cx, x1, 0.5), my = qp(y0, cy, y1, 0.5);
      ctx.font = `700 ${12}px ui-monospace, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const label = edge.techMeta.label;
      const tw = ctx.measureText(label).width;
      roundRect(ctx, mx - tw / 2 - 5, my - 9, tw + 10, 18, 5);
      ctx.fillStyle = hexA(T.bg, 0.88); ctx.fill();
      ctx.strokeStyle = hexA(color, 0.5); ctx.lineWidth = 1 / gs; ctx.stroke();
      ctx.fillStyle = hexA(T.label, 0.94);
      ctx.fillText(label, mx, my);
    }

    ctx.restore();
  }, [visibleEdges, edgeLit, selectedEdgeId, hoverEdgeId, hasChain, cycleMode, cycleEdges, mode, T]);

  const paintEdgeArea = useCallback((edge, colour, ctx) => {
    if (!visibleEdges.has(edge.id)) return;
    const { x0, y0, x1, y1, cx, cy } = edgeGeometry(edge);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.stroke();
  }, [visibleEdges]);

  // ── Tooltips ───────────────────────────────────────────────────────────
  const nodeTooltip = useCallback((n) => {
    const cb = criticalityBand(n.criticality);
    const row = (k, v, vc) => `<span style="color:${T.tipText4}">${k}</span><span style="color:${vc};text-align:right">${v}</span>`;
    const layersLine = n.segments.map(s => s.layer).join(' · ');
    return tip(T, `
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:7px">
        <span style="font-weight:700;font-size:12px;color:${T.tipText};letter-spacing:-0.01em">${esc(n.name)}</span>
        ${n.ticker ? `<span style="color:${T.tipText4};font-size:9px;font-weight:700">${esc(n.ticker)}</span>` : ''}
      </div>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
        <span style="width:7px;height:7px;border-radius:2px;background:${tone(n.color, mode)};flex:none"></span>
        <span style="color:${T.tipText3}">${esc(n.roleMeta?.label || n.role)}</span>
        <span style="color:${T.tipRule}">·</span>
        <span style="color:${T.tipText4}">${esc(n.sectorLabel)}</span>
      </div>
      <div style="color:${T.tipText2};margin-bottom:9px;line-height:1.45">${esc(n.oneLiner || '')}</div>
      <div style="border-top:1px solid ${T.tipBorder};padding-top:9px;display:grid;grid-template-columns:auto 1fr;gap:5px 16px">
        ${row('Критичность', `${n.criticality} · ${esc(cb.label)}`, tone(cb.color, mode))}
        ${row('Гравитация', `${n.gravity?.score ?? '—'}`, T.tipText3)}
        ${row('Слои', esc(layersLine), T.tipText3)}
        ${row('Зависит от / кормит', `${n.upCount} / ${n.downCount}`, T.tipText3)}
      </div>
      <div style="margin-top:9px;color:${T.tipText4};font-size:8.5px">Клик → цепочка по стеку</div>
    `);
  }, [mode, T]);

  const edgeTooltip = useCallback((e) => {
    const s = typeof e.source === 'object' ? e.source.name : e.sourceId;
    const t = typeof e.target === 'object' ? e.target.name : e.targetId;
    return tip(T, `
      <div style="color:${T.tipText};font-size:11.5px;margin-bottom:6px">
        <b>${esc(s)}</b> <span style="color:${tone(e.color, mode)}">—${esc(e.typeLabel)}→</span> <b>${esc(t)}</b>
      </div>
      <div style="color:${T.tipText2};margin-bottom:7px">${esc(e.note || '')}</div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <span style="color:${T.tipText3}">Существенность ${e.strength}</span>
        <span style="color:${T.tipRule}">·</span>
        <span style="color:${tone(e.tierMeta?.color || '#94A3B8', mode)}">${esc(e.tierMeta?.short || e.tier)}</span>
        <span style="color:${T.tipRule}">·</span>
        <span style="color:${T.tipText4}">${e.confirmedSources >= 2 ? '2+ источника' : 'один источник'}</span>
        ${e.techMeta ? `<span style="color:${T.tipRule}">·</span><span style="color:${T.tipText3}">${esc(e.techMeta.label)}</span>` : ''}
      </div>
      <div style="margin-top:7px;color:${T.tipText4};font-size:9px">Клик → источник и цитата</div>
    `);
  }, [mode, T]);

  const linkModeReplace = useMemo(() => () => 'replace', []);

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}
      onMouseMove={handleMove} onClickCapture={handleClickCapture}>
      {size.w > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={size.w}
          height={size.h}
          graphData={graphData}
          backgroundColor={T.bg}
          onRenderFramePre={paintRings}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={paintPointerArea}
          nodeVisibility={nodeVisible}
          linkVisibility={edgeVisible}
          linkCanvasObject={paintEdge}
          linkCanvasObjectMode={linkModeReplace}
          linkPointerAreaPaint={paintEdgeArea}
          nodeLabel={nodeTooltip}
          linkLabel={edgeTooltip}
          onNodeClick={(n) => onNodeClick(n.id)}
          onLinkClick={(l) => onEdgeClick(l.id)}
          onBackgroundClick={handleBackground}
          onNodeHover={(n) => setHoverNodeId(n ? n.id : null)}
          onLinkHover={(l) => setHoverEdgeId(l ? l.id : null)}
          // The whole map is a coordinate system — a dragged company would be
          // in the wrong LAYER, and its edge ports would point at nothing.
          enableNodeDrag={false}
          cooldownTicks={0}
          warmupTicks={0}
          minZoom={0.06}
          maxZoom={9}
        />
      )}
    </div>
  );
}

// Role → outline dash. Colour still says "layer band"; the stroke says "role".
const ROLE_DASH = {
  producer: null,
  owner: null,
  capital: [9, 5],
  demand: null,
  platform: [2, 4],
};

// ── helpers ──────────────────────────────────────────────────────────────
/** The quadratic control point for an edge's bow, derived once per paint. */
function edgeGeometry(e) {
  const x0 = e._x0, y0 = e._y0, x1 = e._x1, y1 = e._y1;
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const dx = x1 - x0, dy = y1 - y0;
  return { x0, y0, x1, y1, cx: mx - dy * (e._bow || 0), cy: my + dx * (e._bow || 0) };
}
const qp = (a, b, c, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
const qd = (a, b, c, t) => 2 * (1 - t) * (b - a) + 2 * t * (c - b);

function tracePoly(ctx, pts, ox = 0, oy = 0) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + ox, y + oy) : ctx.moveTo(x + ox, y + oy)));
  ctx.closePath();
}

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
  const h = String(hex).replace('#', '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return hex;
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function tip(T, inner) {
  return `<div style="
    font-family:ui-monospace,monospace;font-size:10px;line-height:1.5;
    letter-spacing:0.01em;-webkit-font-smoothing:antialiased;
    background:${T.tipBg};border:1px solid ${T.tipBorder};border-radius:12px;
    padding:10px 12px;max-width:260px;
    box-shadow:0 1px 2px ${T.tipShadowSoft},0 16px 36px -12px ${T.tipShadow};">${inner}</div>`;
}
