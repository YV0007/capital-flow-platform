// ══════════════════════════════════════════════════════════════════════════
// EcoGraph — the full-screen ecosystem canvas. STATIC diagram, not a
// simulation. Deliberately the SAME painter as capitalflow/FlowGraph: the two
// maps should be indistinguishable in feel and differ only in content.
//
// An earlier version drew concentric layer rings, radial capsules and hand-
// painted port-to-port edges. All of it is gone. Node = the same app-icon
// tile; edges = force-graph's own bonds, thin, curved, with the small
// directional arrowheads and the on-focus particles the flow map uses.
//
// VISUAL ENCODING
//   · node = labeled block (logo inside — no floating labels)
//   · block rim colour  → layer band; on the outer arc, the control plane's own
//   · rim style         → ROLE, one dash signature each. The tile silhouette is
//                         frozen (it is the map's most recognisable element), so
//                         the role's SHAPE lives in the legend and its signature
//                         lives in the rim — colour alone carries the band, and
//                         the map still reads for a colour-blind eye.
//   · block size        → CRITICALITY (this map's "capital"); the outer arc is
//                         scaled down — it frames the stack, it is not in it
//   · edge colour       → relation type, within its SPINE's colour family
//   · edge width        → strength (hairlines) · fainter = weaker confirmation
//   · absent            → filtered out, or outside the lit chain (removed,
//                         not dimmed — a grey haze behind the answer is noise)
//
// THE ANCHOR gets exactly ONE new privilege over v1: its label never hides at
// any zoom. Same tile, same size rule, no halo, no bloom. It is the centre of
// the question and it should always be findable; anything more and the map
// starts arguing with itself about what matters.
// ══════════════════════════════════════════════════════════════════════════

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useThemeMode, canvasTokens, tone } from '../capitalflow/canvasTheme.js';
import { criticalityBand, weightBand } from '../../../data/aiEcosystemNetwork.js';
import { getLang } from '../../../lib/i18n.jsx';

export default function EcoGraph({
  graphData, regions, techNodes,
  visibleNodes, visibleEdges,
  chain, chainRoot,
  cycleEdges, cycleMode, cycleNodeSet,
  subgraphLens, spofById,
  selectedNodeId, selectedEdgeId,
  onNodeClick, onEdgeClick, onBackgroundClick, onRegionClick,
  showLabels, showTech,
  fgRef,
}) {
  const mode = useThemeMode();
  const T = canvasTokens(mode);
  const wrapRef = useRef(null);
  const hoverRegionRef = useRef(null);
  const handledAtRef = useRef(0);
  const lastResizeRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hoverNodeId, setHoverNodeId] = useState(null);
  const [hoverEdgeId, setHoverEdgeId] = useState(null);

  const hasChain = !!chainRoot && chain && chain.nodes.size > 1;
  const nodeIndex = useMemo(() => new Map(graphData.nodes.map(n => [n.id, n])), [graphData]);

  // ── Brand-logo image cache — load once, repaint when they arrive ───────
  const logoCache = useRef(new Map());
  const [logoTick, setLogoTick] = useState(0);
  const refreshTimer = useRef(null);
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) return;
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
      setLogoTick(t => t + 1);
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

  // Frame the whole map on load. Two traps, both the flow map's: fitting
  // before the graph has ingested its data zooms into a degenerate bbox, and
  // the library resets the camera on resize, wiping a fit done too early.
  const fitIntervalRef = useRef(null);
  useEffect(() => {
    let ticks = 0, goodFits = 0;
    const iv = setInterval(() => {
      ticks += 1;
      if (ticks >= 60) { clearInterval(iv); return; }
      if (performance.now() - lastResizeRef.current < 600) return;
      const fg = fgRef.current;
      if (!fg) return;
      const bbox = fg.getGraphBbox?.();
      if (!(bbox && Number.isFinite(bbox.x?.[0]) && (bbox.x[1] - bbox.x[0]) > 100)) return;
      // BOTH passes instant. An animated zoomToFit drives centerAt and zoom as
      // two d3 transitions on the same zoom behaviour and the zoom cancels the
      // pan, so the camera ends up scaled but never centred — the map then sits
      // zoomed in on the world origin with most of the graph off-screen.
      fg.zoomToFit(0, 70);
      goodFits += 1;
      if (goodFits >= 2) clearInterval(iv);
    }, 250);
    fitIntervalRef.current = iv;
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any filter at all is up: fewer tiles on the board than the map holds.
  const hasFilter = visibleNodes.size < graphData.nodes.length;

  // …and stop trying the moment a lens takes over the camera. That interval can
  // stay alive for up to fifteen seconds, because every layout change (a panel
  // opening, a drawer sliding) bumps lastResizeRef and defers its next attempt.
  // A late whole-map fit then lands ON TOP of the framing a lens just did and
  // silently undoes it — the symptom being a circuit that is lit, correct, and
  // three pixels wide because the camera snapped back out.
  //
  // A FILTER counts here too. It is not a lens, but it owns the camera for the
  // same reason: once the board is down to the nine entities a link type
  // touches, EcosystemMap fits to those nine, and a whole-map fit arriving half
  // a second later throws that away — the filter then reads as an empty canvas.
  // Opening the filter drawer is itself a layout change, so this interval is
  // always still alive at exactly the wrong moment.
  useEffect(() => {
    if (!cycleMode && !subgraphLens && !chainRoot && !hasFilter) return;
    if (fitIntervalRef.current) {
      clearInterval(fitIntervalRef.current);
      fitIntervalRef.current = null;
    }
  }, [cycleMode, subgraphLens, chainRoot, hasFilter]);

  // ── Kill every force — the layout is fixed ─────────────────────────────
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force('center', null);
    fg.d3Force('charge', null);
    fg.d3Force('link', null);
  }, [fgRef, graphData]);


  const nodeLit = useCallback((n) => {
    if (!visibleNodes.has(n.id)) return false;
    // A chain answers a MORE specific question than "what's in this
    // subgraph" — and by construction (chainAdjacency in EcosystemMap) it
    // can never reach outside an active subgraph lens anyway. So a chain, if
    // one is up, wins outright: same "a chain is an answer, the question
    // doesn't stay greyed out behind it" rule this file already applies
    // everywhere else. With no chain picked yet, the lens alone decides.
    if (hasChain) return chain.nodes.has(n.id);
    if (subgraphLens) return subgraphLens.nodeSet.has(n.id);
    // A specific circuit chosen → only its own path lights, not every entity
    // that happens to sit on ANY of the 140 circuits (n.onCycle). Nothing
    // chosen yet → cycleNodeSet is empty, so the lens shows nothing until the
    // picker gives it one to show.
    if (cycleMode) return !!cycleNodeSet && cycleNodeSet.has(n.id);
    return true;
  }, [visibleNodes, hasChain, chain, cycleMode, cycleNodeSet, subgraphLens]);

  const edgeLit = useCallback((e) => {
    if (!visibleEdges.has(e.id)) return false;
    if (hasChain) return chain.edges.has(e.id);
    if (subgraphLens) return subgraphLens.edgeSet.has(e.id);
    if (cycleMode) return cycleEdges.has(e.id);
    return true;
  }, [visibleEdges, hasChain, chain, cycleMode, cycleEdges, subgraphLens]);

  // Anything not lit leaves the render ENTIRELY — line, arrowhead, particles,
  // hit area, tile. Fading it to 5% still left a grey haze of 60 companies
  // behind the answer; with a chain up you want the chain and nothing else.
  // Same treatment the flow map gives an active filter, extended to the chain
  // and cycle lenses.
  const nodeVisible = useCallback((n) => nodeLit(n), [nodeLit]);
  const edgeVisible = useCallback((e) => edgeLit(e), [edgeLit]);

  // Cells that still hold a lit node. A cell emptied by the filter or by the
  // chain loses its glow and its title too — an island labelled "L6 ГЕНЕРАЦИЯ"
  // with nothing inside is worse than no island.
  const narrowed = hasFilter || hasChain || cycleMode || !!subgraphLens;
  const activeRegionKeys = useMemo(() => {
    if (!narrowed) return null;
    const keys = new Set();
    graphData.nodes.forEach(n => { if (nodeLit(n)) keys.add(n.primaryLayer); });
    return keys;
  }, [narrowed, graphData, nodeLit]);

  // ── Cells: soft glow pools + a clickable title ─────────────────────────
  const paintRegions = useCallback((ctx, globalScale) => {
    const padX = 10 / (globalScale || 1);
    const padY = 9 / (globalScale || 1);
    regions.forEach(r => {
      const core = r.type === 'nucleus';
      const faded = !!activeRegionKeys && !activeRegionKeys.has(r.key);
      if (faded) { r._hit = null; return; }

      // Soft glow POOL — a zone, not a bordered circle. The CONTROL plane's
      // pools are deliberately dimmer and tighter: they are the frame around
      // the stack, and a frame that glows as hard as the picture is a mistake.
      const glowR = r.r * (r.quiet ? 1.25 : 1.45);
      const rc = tone(r.color, mode);
      const baseA = (core ? T.regionSource : (r.lit ? T.regionLit : T.regionTarget))
        * (r.quiet ? 0.55 : 1);
      const g = ctx.createRadialGradient(r.cx, r.cy, r.r * 0.12, r.cx, r.cy, glowR);
      g.addColorStop(0, hexA(rc, baseA));
      g.addColorStop(0.65, hexA(rc, baseA * 0.4));
      g.addColorStop(1, hexA(rc, 0));
      ctx.beginPath();
      ctx.arc(r.cx, r.cy, glowR, 0, 2 * Math.PI);
      ctx.fillStyle = g;
      ctx.fill();

      // Only a MONOPOLY layer gets the accent ring — the alpha moment.
      if (r.lit) {
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.r + 4, 0, 2 * Math.PI);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = hexA(tone('#E5484D', mode), 0.55);
        ctx.stroke();
      }

      // Cell TITLE — the only text on the canvas, and the way into the layer
      // report. Layers stay coordinates; only companies are nodes.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const size = core ? 19 : r.quiet ? 20 : 25;
      ctx.font = `700 ${size}px ui-monospace, monospace`;
      const hot = hoverRegionRef.current === r.key;
      ctx.fillStyle = hexA(rc, hot ? 1 : (r.quiet ? 0.62 : core ? 0.85 : r.lit ? 0.96 : 0.74));
      const title = r.lit ? `✦ ${r.label}` : r.label;
      const ty = r.cy - r.r - 12;
      ctx.fillText(title, r.cx, ty);

      // Hit box, refreshed every frame so it tracks pan/zoom for free.
      const w = ctx.measureText(title).width;
      r._hit = {
        x0: r.cx - w / 2 - padX, x1: r.cx + w / 2 + padX,
        y0: ty - size - padY, y1: ty + padY,
      };

      if (hot) {
        ctx.beginPath();
        ctx.moveTo(r.cx - w / 2, ty + 4);
        ctx.lineTo(r.cx + w / 2, ty + 4);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = hexA(rc, 0.8);
        ctx.stroke();
      }

      if (r.stats) {
        ctx.textBaseline = 'top';
        ctx.font = `600 ${core ? 13 : r.quiet ? 12 : 16}px ui-monospace, monospace`;
        ctx.fillStyle = hexA(rc, (mode === 'light' ? 0.85 : 0.42) * (r.quiet ? 0.8 : 1));
        ctx.fillText(r.stats, r.cx, r.cy + r.r + 8);
      }
    });
  }, [regions, mode, T, activeRegionKeys]);

  // ── Tech satellites + the tech label on a lit bond, over the top ───────
  const paintOverlay = useCallback((ctx, globalScale) => {
    const gs = globalScale || 1;
    if (showTech && gs > 0.34) {
      techNodes.forEach(t => {
        if (t._x == null) return;
        const owner = nodeIndex.get(t.owner);
        if (owner && !nodeLit(owner)) return;
        ctx.beginPath();
        ctx.arc(t._x, t._y, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = hexA(tone('#A46FD6', mode), 0.95);
        ctx.fill();
        ctx.font = `700 ${11}px ui-monospace, monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = hexA(T.label, 0.72);
        ctx.fillText(t.label, t._x + 7, t._y);
      });
    }

    // What actually moves along a bond — "EUV", "CoWoS", "CUDA". Only on the
    // lit chain or on hover, so the map stays quiet when idle.
    if (!hasChain && !selectedEdgeId && !hoverEdgeId) return;
    graphData.links.forEach(e => {
      if (!e.techMeta || !edgeLit(e)) return;
      const focused = e.id === selectedEdgeId || e.id === hoverEdgeId || hasChain;
      if (!focused) return;
      const s = e.source, t = e.target;
      if (typeof s !== 'object' || typeof t !== 'object') return;
      const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
      // Nudged off the chord by the same curvature the bond is drawn with.
      const dx = t.x - s.x, dy = t.y - s.y;
      const cx = mx - dy * (e.curvature || 0) * 0.5;
      const cy = my + dx * (e.curvature || 0) * 0.5;
      ctx.font = `700 ${11}px ui-monospace, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const label = e.techMeta.label;
      const tw = ctx.measureText(label).width;
      roundRect(ctx, cx - tw / 2 - 4, cy - 8, tw + 8, 16, 4);
      ctx.fillStyle = hexA(T.bg, 0.86); ctx.fill();
      ctx.fillStyle = hexA(tone(e.color, mode), 0.95);
      ctx.fillText(label, cx, cy);
    });
  }, [techNodes, showTech, nodeIndex, nodeLit, mode, T, graphData, edgeLit,
      hasChain, selectedEdgeId, hoverEdgeId]);

  // ── Cell titles are clickable ─────────────────────────────────────────
  const regionAt = useCallback((ev) => {
    const fg = fgRef.current;
    if (!fg || !ev || typeof fg.screen2GraphCoords !== 'function') return null;
    const rect = wrapRef.current?.getBoundingClientRect();
    const sx = rect ? ev.clientX - rect.left : ev.offsetX;
    const sy = rect ? ev.clientY - rect.top : ev.offsetY;
    if (!Number.isFinite(sx) || !Number.isFinite(sy)) return null;
    const p = fg.screen2GraphCoords(sx, sy);
    if (!p) return null;
    return regions.find(r => r._hit
      && p.x >= r._hit.x0 && p.x <= r._hit.x1
      && p.y >= r._hit.y0 && p.y <= r._hit.y1) || null;
  }, [regions, fgRef]);

  const handleMove = useCallback((ev) => {
    if (!onRegionClick) return;
    const hit = regionAt(ev);
    const key = hit ? hit.key : null;
    if (hoverRegionRef.current !== key) {
      hoverRegionRef.current = key;
      const canvas = wrapRef.current?.querySelector('canvas');
      if (canvas) canvas.style.cursor = key ? 'pointer' : '';
    }
  }, [regionAt, onRegionClick]);

  // Titles sit outside the cells but edges cross that space, and an edge under
  // the cursor would win the click. Catching it in CAPTURE gets the title in
  // first; the canvas never sees the event.
  const handleClickCapture = useCallback((ev) => {
    if (!onRegionClick) return;
    const hit = regionAt(ev);
    if (!hit) return;
    ev.stopPropagation();
    ev.preventDefault();
    handledAtRef.current = performance.now();
    onRegionClick(hit.type, hit.key);
  }, [regionAt, onRegionClick]);

  // Belt and braces — force-graph fires its own click a frame after pointerup
  // on a DIFFERENT event object, so the timestamp guard is what stops one
  // physical click from toggling the report open and straight back shut.
  const handleBackground = useCallback((ev) => {
    if (performance.now() - handledAtRef.current < 500) return;
    if (onRegionClick) {
      const hit = regionAt(ev);
      if (hit) { onRegionClick(hit.type, hit.key); return; }
    }
    onBackgroundClick?.();
  }, [regionAt, onRegionClick, onBackgroundClick]);

  // ── Node painter — brand-logo "app-icon" tile ─────────────────────────
  const paintNode = useCallback((node, ctx, globalScale) => {
    // Unlit nodes are not painted at all — `nodeVisibility` already dropped
    // them, so there is no dim branch left to take.
    if (!nodeLit(node)) return;
    const lit = true;
    const selected = node.id === selectedNodeId;
    const hovered = node.id === hoverNodeId;
    const isRoot = node.id === chainRoot;
    const alpha = node.faded ? 0.45 : 1;
    const col = tone(node.color, mode);
    const role = node.roleMeta || {};
    const R = node.r || 12;
    const cx = node.x, cy = node.y;
    const S = R * 1.85;
    const half = S / 2;
    const x = cx - half, y = cy - half;
    // Silhouette answers "actor or thing". A rounded rect with radius S/2 IS a
    // circle, so the whole tile pipeline below — shadow, logo clip, rim, glow,
    // brackets — follows from this one number with no branching.
    const round = node.typeMeta?.shape === 'round';
    const corner = round ? S / 2 : S * 0.26;

    ctx.save();
    ctx.globalAlpha = alpha;

    // NO attention bloom. The flow map blooms its "pivotal" nodes in red, and
    // the obvious port was anchors + anything on a closed loop — but that lit
    // roughly half the map, so the red stopped meaning anything and only
    // competed with the cell glows. Until there is a criterion sharp enough to
    // earn it, importance is carried by tile SIZE (criticality) alone. The
    // cycles lens is where loop membership belongs, on demand.

    if (lit && (selected || hovered || isRoot)) {
      roundRect(ctx, x - 5, y - 5, S + 10, S + 10, corner + 4);
      ctx.fillStyle = hexA(col, selected || isRoot ? 0.28 : 0.15); ctx.fill();
    }

    // Cheap flat drop shadow, then the tile.
    roundRect(ctx, x + R * 0.06 + 1, y + R * 0.16 + 1, S, S, corner);
    ctx.fillStyle = T.tileShadow;
    ctx.fill();
    roundRect(ctx, x, y, S, S, corner);
    ctx.fillStyle = T.nodeTile;
    ctx.fill();

    const logo = getLogo(node);
    if (logo && logo.ok && logo.img && logo.img.naturalWidth) {
      roundRect(ctx, x, y, S, S, corner);
      ctx.fillStyle = T.logoPlate; ctx.fill();
      ctx.save();
      roundRect(ctx, x, y, S, S, corner); ctx.clip();
      const pad = S * 0.15;
      const iw = logo.img.naturalWidth, ih = logo.img.naturalHeight;
      const box = S - pad * 2;
      let sc = Math.min(box / iw, box / ih);
      // A 16px favicon blown up to fill the tile turns to mush — cap the
      // upscale at 2× the source's real pixels. Vectors are unaffected.
      if (!logo.vector) sc = Math.min(sc, 2 / (globalScale || 1));
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(logo.img, cx - (iw * sc) / 2, cy - (ih * sc) / 2, iw * sc, ih * sc);
      ctx.restore();
    } else {
      const g = ctx.createLinearGradient(x, y, x + S, y + S);
      g.addColorStop(0, mix(col, '#ffffff', mode === 'light' ? 0.06 : 0.22));
      g.addColorStop(1, mix(col, '#05060a', mode === 'light' ? 0.30 : 0.45));
      roundRect(ctx, x, y, S, S, corner); ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = `800 ${S * 0.4}px -apple-system, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(node.monogram || '?', cx, cy + S * 0.02);
    }

    // Accent rim = layer band; the STROKE STYLE carries the role, so roles
    // survive a colour-blind eye and a printed page.
    roundRect(ctx, x, y, S, S, corner);
    ctx.lineWidth = selected || isRoot ? 2.4 : 1.4;
    ctx.strokeStyle = selected || isRoot ? T.selectRing : hexA(col, hovered ? 1 : 0.72);
    const dash = ROLE_DASH[node.role];
    if (node.faded) ctx.setLineDash([3, 3]);
    else if (dash) ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pivot mark (corner-bracket) and single-point-of-failure ring (dashed
    // contour) are retired for now — pending a redesign. Do not reintroduce
    // either without a fresh design pass.

    // Multi-layer badge — a small stack of bars in the corner. This is what
    // replaces the old radial capsule: one company, one tile, and a mark that
    // says "it also stands in other layers" without duplicating the node.
    if (node.multiLayer) {
      const bw = S * 0.2, bx = x + S - bw - S * 0.09, by = y + S * 0.09;
      for (let i = 0; i < Math.min(3, node.segments.length); i++) {
        roundRect(ctx, bx, by + i * (S * 0.075), bw, S * 0.045, S * 0.02);
        ctx.fillStyle = hexA(col, 0.95 - i * 0.22);
        ctx.fill();
      }
    }

    // Label — reveal by zoom, ranked by importance (node.labelScale)
    const gs = globalScale || 1;
    const showLabel = selected || hovered || isRoot || (showLabels && gs >= (node.labelScale || 1));
    if (showLabel) {
      const lx = cx + half + 6;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const big = node.atomTier <= 1;
      ctx.font = `${big ? 700 : 600} ${Math.max(11, R * 0.62)}px -apple-system, "Segoe UI", sans-serif`;
      ctx.fillStyle = selected || hovered || isRoot ? T.labelStrong : hexA(T.label, big ? 0.96 : 0.78);
      ctx.fillText(node.atomLabel, lx, cy);
      // Type tag — says «this is a runtime, not a vendor» without another
      // colour. Only types that declare a tag get one; a plain company is the
      // default and marking the default would be noise.
      const tag = node.typeMeta?.tag;
      if (tag) {
        const nameW = ctx.measureText(node.atomLabel).width;
        ctx.font = `700 ${Math.max(7.5, R * 0.34)}px ui-monospace, monospace`;
        const tw = ctx.measureText(tag).width;
        const th = Math.max(9, R * 0.46);
        const tx = lx + nameW + 5;
        roundRect(ctx, tx, cy - th / 2, tw + 7, th, th / 2);
        ctx.fillStyle = hexA(col, mode === 'light' ? 0.14 : 0.20);
        ctx.fill();
        ctx.fillStyle = hexA(col, 0.95);
        ctx.fillText(tag, tx + 3.5, cy + 0.5);
      }
      // A company in several layers says so under its name — the badge alone
      // is a hint, this is the answer.
      if (node.multiLayer && (selected || hovered || isRoot || gs > 1.1)) {
        ctx.font = `700 ${Math.max(8.5, R * 0.4)}px ui-monospace, monospace`;
        ctx.fillStyle = hexA(T.label, 0.5);
        ctx.fillText(node.segments.map(s => s.layerLabel || s.layer).join(' · '), lx, cy + Math.max(11, R * 0.62) * 0.92);
      }
    }

    ctx.restore();
  }, [nodeLit, selectedNodeId, hoverNodeId, chainRoot, showLabels, getLogo, logoTick, mode, T]);

  const paintPointerArea = useCallback((node, colour, ctx) => {
    if (!nodeLit(node)) return;
    const S = (node.r || 12) * 1.85, half = S / 2;
    ctx.fillStyle = colour;
    roundRect(ctx, node.x - half, node.y - half, S, S,
      node.typeMeta?.shape === 'round' ? S / 2 : S * 0.26);
    ctx.fill();
  }, [nodeLit]);

  // ── Bond styling — force-graph's own renderer, flow-map settings ───────
  const linkColor = useCallback((e) => {
    if (!edgeLit(e)) return 'rgba(0,0,0,0)';      // dropped by linkVisibility
    if (e.id === selectedEdgeId) return T.labelStrong;
    const cyc = cycleMode ? cycleEdges.get(e.id) : null;
    if (cyc) return hexA(tone(cyc.color, mode), 0.95);
    // Strength drives opacity, and a single-source claim is knocked down
    // further. The contract's "one source → dashed" rule is NOT drawn as a
    // dash: dashed hairlines read as noise at map zoom and broke the family
    // resemblance with the flow map. The distinction is carried by opacity
    // here, and stated in words in the tooltip and the entity panel.
    const conf = e.confirmedSources >= 2 ? 1 : 0.62;
    // The flow map's curve is fed a share-of-total that is tiny for almost
    // every flow, so its bonds land near the floor. Strength here is a 0-100
    // rubric and a standing dependency that made it onto the map usually
    // scores high — the same curve pinned nearly every bond near full opacity
    // and the idle map read as a wall of colour. Same shape, much narrower
    // band (0.32-0.64 light, 0.26-0.58 dark, rather than 0.55-1.05); hover,
    // selection and a lit chain still lift a bond clear of the field, which is
    // when you want to see it. The band was lifted once off its first setting:
    // the idle field read as too faint to trace a line across the map.
    const base = mode === 'light' ? 0.32 : 0.26;
    const a = (base + 0.32 * Math.sqrt((e.strength || 0) / 100)) * conf * (e.faded ? 0.5 : 1);
    const lc = tone(e.color, mode);
    if (e.id === hoverEdgeId) return hexA(lc, Math.min(1, a + 0.45));
    // With a node selected the field is already down to its own chain, so the
    // surviving bonds can be pushed well clear of the idle band — that is the
    // whole point of having clicked. Only the chain is on screen, so a strong
    // lift reads as focus, not as clutter.
    // Pulled back from +0.55. Opacity, width and particle density all lift at
    // once when a chain is up, and the three compounded into a wall of colour —
    // a lit chain is still a dozen-odd bonds, not two, so a strong lift on all
    // three reads as "too much happening" rather than as focus. The lift now
    // sits closer to the idle band and lets width and motion carry the rest.
    return hexA(lc, hasChain ? Math.min(1, a + 0.34) : a);
  }, [edgeLit, selectedEdgeId, hoverEdgeId, hasChain, cycleMode, cycleEdges, mode, T]);

  const linkW = useCallback((e) => {
    if (!edgeLit(e)) return 0;
    // TRUE hairlines — 0.26-0.74, thinner than the flow map's, because this
    // map carries roughly twice the bonds in the same frame and they are all
    // lit at once. Importance reads through opacity and the particle flow,
    // never through girth: the moment these lines get fat it is spaghetti.
    const w = 0.26 + 0.48 * Math.sqrt((e.strength || 0) / 100);
    // The bumps are held down with the base so a hovered bond still reads as
    // the same map, only louder — not as a different, fatter kind of line.
    if (e.id === selectedEdgeId) return w + 0.95;
    if (e.id === hoverEdgeId) return w + 0.6;
    if (cycleMode && cycleEdges.has(e.id)) return w + 0.65;
    // Same reasoning as the opacity lift: a lit chain is a handful of bonds in
    // an otherwise empty frame, so a modest bump is legible without going fat.
    if (hasChain) return w + 0.3;
    return w;
  }, [edgeLit, selectedEdgeId, hoverEdgeId, cycleMode, cycleEdges, hasChain]);

  const particles = useCallback((e) => {
    // Motion only on focus, so the map is still when idle — movement is a
    // reward for clicking in, not constant noise. Counts bumped up from the
    // first pass: at the old 4-6 the flow was too sparse to read as motion
    // at a glance, and reading the flow's direction is the whole point of a
    // lit chain — a thin trickle of dots undersold it.
    if (e.id === selectedEdgeId) return 6;
    if (e.id === hoverEdgeId) return 4;
    if (cycleMode) return cycleEdges.has(e.id) ? 5 : 0;
    // Softened with the opacity lift: seven dots per bond across a whole chain
    // is a lot of moving parts at once, and the motion competes with the lines
    // it is meant to describe.
    if (hasChain) return chain.edges.has(e.id) ? 5 : 0;
    return 0;
  }, [selectedEdgeId, hoverEdgeId, hasChain, chain, cycleMode, cycleEdges]);

  // ── Hover tooltips ─────────────────────────────────────────────────────
  const nodeTooltip = useCallback((n) => {
    const cb = criticalityBand(n.criticality);
    const wb = weightBand(n.weight?.score);
    const row = (k, v, vc) => `<span style="color:${T.tipText4}">${k}</span><span style="color:${vc};text-align:right">${v}</span>`;
    return tip(T, `
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:7px">
        <span style="font-weight:700;font-size:12px;color:${T.tipText};letter-spacing:-0.01em">${esc(n.name)}</span>
        ${n.ticker ? `<span style="color:${T.tipText4};font-size:8.5px;font-weight:700">${esc(n.ticker)}</span>` : ''}
        ${n.faded ? `<span style="color:${T.tipText4};font-size:8.5px;font-weight:700">${getLang() === 'en' ? 'STALE' : 'УСТАР.'}</span>` : ''}
      </div>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
        <span style="width:7px;height:7px;border-radius:2px;background:${tone(n.color, mode)};flex:none"></span>
        <span style="color:${T.tipText3}">${esc(n.sectorLabel)}</span>
        <span style="color:${T.tipRule}">·</span>
        <span style="color:${T.tipText4}">${esc(n.primaryLayerLabel || n.primaryLayer)}</span>
      </div>
      ${(n.isAnchor || n.isPivotal) ? `<div style="display:flex;align-items:center;gap:5px;margin-bottom:8px">
        <span style="width:6px;height:6px;border-radius:50%;background:${T.pivotGlow};flex:none"></span>
        <span style="color:${T.pivotGlow};font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em">${n.isAnchor ? (getLang() === 'en' ? 'Ecosystem anchor' : 'Якорь экосистемы') : (getLang() === 'en' ? 'Key network node' : 'Ключевой узел сети')}</span>
      </div>` : ''}
      <div style="color:${T.tipText2};margin-bottom:9px;line-height:1.45">${esc(n.oneLiner || '')}</div>
      <div style="border-top:1px solid ${T.tipBorder};padding-top:9px;display:grid;grid-template-columns:auto 1fr;gap:5px 16px">
        ${n.weight
          ? row(getLang() === 'en' ? 'Systemic weight' : 'Вес в системе',
                `${n.weight.score} · #${n.weight.rank}`, tone(wb.color, mode))
          : row(getLang() === 'en' ? 'Criticality' : 'Критичность', `${n.criticality} · ${esc(cb.label)}`, tone(cb.color, mode))}
        ${row(getLang() === 'en' ? 'Depends on / feeds' : 'Зависит от / кормит', `${n.upCount} / ${n.downCount}`, T.tipText3)}
        ${n.multiLayer ? row(getLang() === 'en' ? 'Also in layers' : 'Ещё в слоях', esc(n.segments.filter(s2 => s2.layer !== n.primaryLayer).map(s2 => s2.layerLabel || s2.layer).join(' · ')), T.tipText3) : ''}
      </div>
      <div style="margin-top:9px;color:${T.tipText4};font-size:8.5px">${getLang() === 'en' ? 'Click → the chain through the stack' : 'Клик → цепочка по стеку'}</div>
    `);
  }, [mode, T, graphData]);

  const edgeTooltip = useCallback((e) => {
    const s2 = typeof e.source === 'object' ? e.source.name : e.sourceId;
    const t2 = typeof e.target === 'object' ? e.target.name : e.targetId;
    return tip(T, `
      <div style="color:${T.tipText};font-size:11.5px;margin-bottom:6px">
        <b>${esc(s2)}</b> <span style="color:${tone(e.color, mode)}">—${esc(e.verb || e.typeLabel)}→</span> <b>${esc(t2)}</b>
      </div>
      <div style="color:${T.tipText2}">${esc(e.note || '')}</div>
      <div style="margin-top:8px;color:${T.tipText4};font-size:9px">${getLang() === 'en' ? 'Click → the link breakdown and its quotes' : 'Клик → разбор связи и цитаты'}</div>
    `);
  }, [mode, T]);

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
          onRenderFramePre={paintRegions}
          onRenderFramePost={paintOverlay}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={paintPointerArea}
          nodeVisibility={nodeVisible}
          linkVisibility={edgeVisible}
          nodeLabel={nodeTooltip}
          linkLabel={edgeTooltip}
          linkColor={linkColor}
          linkWidth={linkW}
          linkCurvature="curvature"
          linkDirectionalArrowLength={(e) => (hasChain ? 2.5 : 1.9) + 1.2 * Math.sqrt((e.strength || 0) / 100)}
          linkDirectionalArrowRelPos={0.92}
          linkDirectionalParticles={particles}
          // Bigger and faster than the first pass — a hairline edge with a
          // 1-2px dot crawling along it at 0.004/frame read as "maybe
          // something is moving" rather than as a flow. Understanding the
          // direction and pace of dependency IS what this animation is for,
          // so it gets to be the loudest moving thing on an otherwise static
          // canvas, not a barely-there accent.
          linkDirectionalParticleWidth={(e) => (hasChain ? 2.8 : 2.4) + 1.8 * Math.sqrt((e.strength || 0) / 100)}
          linkDirectionalParticleSpeed={() => 0.008}
          linkDirectionalParticleColor={(e) => {
            const cyc = cycleMode ? cycleEdges.get(e.id) : null;
            return tone(cyc ? cyc.color : e.color, mode);
          }}
          onNodeClick={(n) => onNodeClick(n.id)}
          onLinkClick={(l) => onEdgeClick(l.id)}
          onBackgroundClick={handleBackground}
          onNodeHover={(n) => setHoverNodeId(n ? n.id : null)}
          onLinkHover={(l) => setHoverEdgeId(l ? l.id : null)}
          onNodeDragEnd={(n) => { n.fx = n.x; n.fy = n.y; }}
          cooldownTicks={0}
          warmupTicks={0}
          // The layout is static and the engine never runs, so force-graph's
          // default autoPauseRedraw parks the render loop and only wakes it on
          // pointer interaction. Anything this map changes in CODE then never
          // reached the canvas: picking a circuit by click painted it, picking
          // the identical circuit from an effect left the map blank while the
          // panel correctly showed it as lit. force-graph exposes no refresh()
          // to ask for a single frame, so the loop has to stay awake.
          autoPauseRedraw={false}
          minZoom={0.1}
          maxZoom={9}
        />
      )}
    </div>
  );
}

// Role → tile outline. Colour still says "layer band"; the stroke says "role".
// Six signatures, deliberately far apart from each other at map zoom: solid,
// long dash, short dash, dot, dash-dot, tight dot. The tile SILHOUETTE stays a
// rounded square for every role — it is the single most recognisable thing on
// both maps, and re-cutting it per role would be a redesign, not an adaptation.
// The role's actual SHAPE is drawn in the legend, where there is room for it.
const ROLE_DASH = {
  producer: null,
  operator: [10, 4],
  demand:   [4, 4],
  capital:  [9, 5],
  platform: [2, 4],
  state:    [7, 3, 2, 3],
};

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
  const h = String(hex).replace('#', '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return hex;
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function mix(a, b, t) {
  const pa = parseInt(String(a).replace('#', ''), 16), pb = parseInt(String(b).replace('#', ''), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`;
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
