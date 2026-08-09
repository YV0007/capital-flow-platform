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
import { useThemeMode, canvasTokens, tone } from './canvasTheme.js';

// Surfaces come from canvasTheme (a JS mirror of the --cf-* CSS variables,
// which a canvas cannot read). `tone()` adapts the SEMANTIC palette — sector
// and class colours are tuned for near-black and need darkening on white.

export default function FlowGraph({
  graphData,
  regions,
  matchedNodes, matchedLinks,
  selectedNodeId, selectedLinkId,
  neighbourNodes, neighbourLinks,
  onNodeClick, onLinkClick, onBackgroundClick, onRegionClick,
  showLabels,
  fgRef,
}) {
  const mode = useThemeMode();
  const T = canvasTokens(mode);
  const wrapRef = useRef(null);
  // Which cluster title the pointer is over. A ref, not state: the canvas
  // already repaints every frame for the particles, so the painter picks the
  // change up without a React render on every mousemove.
  const hoverRegionRef = useRef(null);
  // When a cluster-title click was last handled — see handleBackground.
  const handledAtRef = useRef(0);
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
        if (img.naturalWidth > 0) {
          entry.ok = true; entry.done = true;
          // SVGs scale for free; rasters get an upscale cap in paintNode.
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

  // Theme flip → repaint. The painters are memoised on `mode`, so new painter
  // identities already reach the graph; this nudges it to redraw immediately
  // instead of waiting for the next interaction on an idle (static) canvas.
  useEffect(() => { fgRef.current?.refresh?.(); }, [mode, fgRef]);

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
  const paintRegions = useCallback((ctx, globalScale) => {
    // Hit-box padding is specified in SCREEN pixels and converted to graph
    // units, so the title stays comfortably clickable when the map is zoomed
    // out and the text is only a few pixels tall.
    const padX = 10 / (globalScale || 1);
    const padY = 9 / (globalScale || 1);
    regions.forEach(r => {
      const lit = r.lit;
      const source = r.type === 'source';

      // Soft glow POOL — a zone, not a bordered circle. Radial fade to nothing.
      const glowR = r.r * 1.45;
      const rc = tone(r.color, mode);
      const baseA = source ? T.regionSource : (lit ? T.regionLit : T.regionTarget);
      const g = ctx.createRadialGradient(r.cx, r.cy, r.r * 0.12, r.cx, r.cy, glowR);
      g.addColorStop(0, hexA(rc, baseA));
      g.addColorStop(0.65, hexA(rc, baseA * 0.4));
      g.addColorStop(1, hexA(rc, 0));
      ctx.beginPath();
      ctx.arc(r.cx, r.cy, glowR, 0, 2 * Math.PI);
      ctx.fillStyle = g;
      ctx.fill();

      // Only a signalling sector gets a faint accent ring (the alpha moment).
      if (lit) {
        ctx.beginPath();
        ctx.arc(r.cx, r.cy, r.r + 4, 0, 2 * Math.PI);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = hexA(rc, 0.5);
        ctx.stroke();
      }

      // Cluster TITLE — the only text on the canvas, and the entry point to the
      // cluster report. Fired-signal detail used to be printed underneath it;
      // that (and every other stat) now lives in the report instead, so the map
      // stays a map. A lit cluster keeps the ◆ mark and nothing more.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const size = source ? 19 : 25;
      ctx.font = `700 ${size}px ui-monospace, monospace`;
      const hot = hoverRegionRef.current === r.key;
      ctx.fillStyle = hexA(rc, hot ? 1 : source ? 0.85 : lit ? 0.96 : 0.72);
      const title = lit ? `◆ ${r.label}` : r.label;
      const ty = r.cy - r.r - 12;
      ctx.fillText(title, r.cx, ty);

      // Hit box for the title, refreshed every frame so it tracks pan/zoom for
      // free (the canvas is already repainting for the flow particles).
      const w = ctx.measureText(title).width;
      r._hit = {
        x0: r.cx - w / 2 - padX, x1: r.cx + w / 2 + padX,
        y0: ty - size - padY, y1: ty + padY,
      };

      // Hover affordance — an underline, so a title reads as clickable.
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
        ctx.font = `600 ${source ? 13 : 17}px ui-monospace, monospace`;
        ctx.fillStyle = hexA(rc, mode === 'light' ? 0.85 : 0.4);
        ctx.fillText(r.stats, r.cx, r.cy + r.r + 8);
      }
    });
  }, [regions, mode, T]);

  // ── Cluster titles are clickable ──────────────────────────────────────
  // The title's hit box is written by paintRegions each frame in GRAPH
  // coordinates, so it follows pan and zoom without any bookkeeping here.
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
      fgRef.current?.refresh?.();
    }
  }, [regionAt, onRegionClick, fgRef]);

  // Titles sit outside the cluster circles but flow edges cross that space, and
  // an edge under the cursor would otherwise win the click. Catching it in the
  // CAPTURE phase gets the title in first; the canvas never sees the event.
  const handleClickCapture = useCallback((ev) => {
    if (!onRegionClick) return;
    const hit = regionAt(ev);
    if (!hit) return;
    ev.stopPropagation();
    ev.preventDefault();
    handledAtRef.current = performance.now();
    onRegionClick(hit.type, hit.key);
  }, [regionAt, onRegionClick]);

  // Belt and braces: if the capture handler ever misses (touch, synthetic
  // event), a background click on a title still opens its report.
  //
  // force-graph fires its own click a frame after pointerup, on a DIFFERENT
  // event object, so stopping the DOM event above does not stop this one. The
  // timestamp guard is what keeps a single physical click from firing
  // onRegionClick twice — which, since the parent treats a repeat click as
  // "close", would open and immediately close the report.
  const handleBackground = useCallback((ev) => {
    if (performance.now() - handledAtRef.current < 500) return;
    if (onRegionClick) {
      const hit = regionAt(ev);
      if (hit) { onRegionClick(hit.type, hit.key); return; }
    }
    onBackgroundClick?.();
  }, [regionAt, onRegionClick, onBackgroundClick]);

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
    const col = tone(node.color, mode);
    const tc = col;
    const R = node.r || 12;
    const cx = node.x, cy = node.y;
    const S = R * 1.85;              // tile side
    const half = S / 2;
    const x = cx - half, y = cy - half;
    const corner = S * 0.26;        // rounded-square radius (app-icon look)
    // Allocator rank. Encoded as a quiet neutral pip (below), NOT as a coloured
    // rim — the gold outline fought the logos and read as a warning state.
    const rank = node.tier === 'core' ? 2 : node.tier === 'key' ? 1 : 0;

    ctx.save();
    ctx.globalAlpha = alpha;

    // selection / hover glow
    if (lit && (selected || hovered)) {
      roundRect(ctx, x - 5, y - 5, S + 10, S + 10, corner + 4);
      ctx.fillStyle = hexA(col, selected ? 0.28 : 0.15); ctx.fill();
    }

    // cheap flat drop shadow (an offset dark tile) — no shadowBlur, so it stays
    // fast even while the flow particles keep the canvas repainting.
    roundRect(ctx, x + R * 0.06 + 1, y + R * 0.16 + 1, S, S, corner);
    ctx.fillStyle = T.tileShadow;
    ctx.fill();
    // tile base
    roundRect(ctx, x, y, S, S, corner);
    ctx.fillStyle = T.nodeTile;
    ctx.fill();

    const logo = getLogo(node);
    if (logo && logo.ok && logo.img && logo.img.naturalWidth) {
      // light plate so dark logos read, then the logo contained with padding
      roundRect(ctx, x, y, S, S, corner);
      ctx.fillStyle = T.logoPlate; ctx.fill();
      ctx.save();
      roundRect(ctx, x, y, S, S, corner); ctx.clip();
      const pad = S * 0.15;
      const iw = logo.img.naturalWidth, ih = logo.img.naturalHeight;
      const box = S - pad * 2;
      let sc = Math.min(box / iw, box / ih);
      // Some brands only publish a 16-32px favicon. Blowing one up to fill the
      // tile turns it to mush, so cap the upscale at 2x the source's real
      // pixels — a small sharp mark beats a large blurry one. Vectors (and
      // anything already large) are unaffected.
      if (!logo.vector) {
        const gsNow = globalScale || 1;
        sc = Math.min(sc, 2 / gsNow);
      }
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(logo.img, cx - (iw * sc) / 2, cy - (ih * sc) / 2, iw * sc, ih * sc);
      ctx.restore();
    } else {
      // monogram tile: domain-colour gradient + initials
      const g = ctx.createLinearGradient(x, y, x + S, y + S);
      g.addColorStop(0, mix(tc, '#ffffff', mode === 'light' ? 0.06 : 0.22));
      g.addColorStop(1, mix(tc, '#05060a', mode === 'light' ? 0.30 : 0.45));
      roundRect(ctx, x, y, S, S, corner); ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = `800 ${S * 0.4}px -apple-system, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(node.monogram || '?', cx, cy + S * 0.02);
    }

    // networked allocator → warm outer bracket ring (elite-network member)
    if (node.network) {
      const nc = tone(NETWORK_META[node.network]?.color || '#F5B942', mode);
      roundRect(ctx, x - 4, y - 4, S + 8, S + 8, corner + 4);
      ctx.lineWidth = 2;
      ctx.strokeStyle = hexA(nc, hovered || selected ? 1 : 0.85);
      ctx.stroke();
    }

    // accent rim = domain colour (keeps the colour encoding). One weight for
    // everyone; rank is carried by the pips below, not by the rim.
    roundRect(ctx, x, y, S, S, corner);
    ctx.lineWidth = selected ? 2.4 : 1.4;
    ctx.strokeStyle = selected ? T.selectRing : hexA(col, hovered ? 1 : 0.72);
    if (node.stale || node.watchOnly) ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rank pips — a small neutral rule under the tile. Two = core, one = key.
    // Quiet enough to ignore, consistent enough to scan.
    if (rank) {
      const pipW = S * 0.16, pipH = Math.max(1.6, S * 0.035), gap = pipW * 0.5;
      const totalW = rank * pipW + (rank - 1) * gap;
      let px = cx - totalW / 2;
      const py = y + S + Math.max(3, S * 0.075);
      ctx.fillStyle = hexA(T.rankPip, selected || hovered ? 0.95 : 0.55);
      for (let i = 0; i < rank; i++) {
        roundRect(ctx, px, py, pipW, pipH, pipH / 2);
        ctx.fill();
        px += pipW + gap;
      }
    }

    // label — reveal by zoom, ranked by importance (node.labelScale)
    const gs = globalScale || 1;
    const showLabel = selected || hovered || (showLabels && gs >= (node.labelScale || 1));
    if (showLabel) {
      const lx = cx + half + 6;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const big = node.atomTier <= 1;
      ctx.font = `${big ? 700 : 600} ${Math.max(11, R * 0.62)}px -apple-system, "Segoe UI", sans-serif`;
      ctx.fillStyle = selected || hovered ? T.labelStrong : hexA(T.label, big ? 0.96 : 0.78);
      // Name only — the capital figure used to sit under it, but it was
      // unreadable at map contrast and duplicated the panel. Amounts live in
      // the hover card and the entity panel.
      ctx.fillText(node.atomLabel, lx, cy);
    }

    ctx.restore();
  }, [nodeLit, selectedNodeId, hoverNodeId, showLabels, getLogo, logoTick, mode, T]);

  const paintPointerArea = useCallback((node, colour, ctx) => {
    const S = (node.r || 12) * 1.85, half = S / 2;
    ctx.fillStyle = colour;
    roundRect(ctx, node.x - half, node.y - half, S, S, S * 0.26);
    ctx.fill();
  }, []);

  // ── Link styling ───────────────────────────────────────────────────────
  const linkColor = useCallback((l) => {
    const lit = linkLit(l);
    if (!lit) return hexA(T.linkDim, T.linkDimAlpha);
    if (l.id === selectedLinkId) return T.labelStrong;
    // All bonds are SOLID; confidence (0–100 grade score) drives opacity so
    // high-confidence flows read stronger. Falls back to status when absent.
    const conf = typeof l.confidence === 'number'
      ? 0.3 + 0.7 * (l.confidence / 100)
      : (l.status === 'verified' ? 1 : l.status === 'verified_alpha' ? 0.7 : 0.46);
    const base = mode === 'light' ? 0.55 : 0.36;
    const a = (base + 0.55 * Math.sqrt(l.amountShare || 0)) * conf;
    const lc = tone(l.color, mode);
    if (l.id === hoverLinkId) return hexA(lc, Math.min(1, a + 0.45));
    return hexA(lc, hasSelection ? Math.min(1, a + 0.3) : a);
  }, [linkLit, selectedLinkId, hoverLinkId, hasSelection, mode, T]);

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
      ? `<span style="color:${T.tipText4}">Capital out</span><span style="color:${tone("#C2A36B", mode)};text-align:right">${fmtUSD(n.totalOutflow)}</span>`
      : `<span style="color:${T.tipText4}">Capital in</span><span style="color:${tone("#82B98D", mode)};text-align:right">${fmtUSD(n.totalInflow)}</span>`;
    return tip(T, `
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:5px">
        <span style="font-weight:700;font-size:12.5px;color:${T.tipText}">${esc(n.name)}</span>
        ${t ? `<span style="color:${tone(t.color, mode)};font-size:9px;font-weight:700">${t.short} ${t.stars}</span>` : ''}
        ${n.stale ? '<span style="color:${T.tipText4};font-size:9px;font-weight:700">COOLED</span>' : ''}
      </div>
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
        <span style="width:7px;height:7px;border-radius:50%;background:${tone(n.color, mode)}"></span>
        <span style="color:${T.tipText3}">${esc(cls?.label || n.cls)}</span>
        ${sec ? `<span style="color:${T.tipRule}">·</span><span style="color:${T.tipText4}">${esc(sec.label)}</span>` : ''}
        <span style="color:${T.tipRule}">·</span>
        <span style="color:${T.tipText4}">${esc(role)}</span>
      </div>
      <div style="display:grid;grid-template-columns:auto auto;gap:2px 14px">
        <span style="color:${T.tipText4}">Capital</span><span style="color:${T.tipText2};text-align:right">${fmtUSD(n.capital)}</span>
        ${side}
        <span style="color:${T.tipText4}">Deals</span><span style="color:${T.tipText3};text-align:right">${n.deals}</span>
        <span style="color:${T.tipText4}">Last activity</span><span style="color:${T.tipText3};text-align:right">${esc(n.last_activity || '—')}</span>
      </div>
      <div style="margin-top:7px;color:${T.tipText4};font-size:9px">Click → full breakdown panel</div>
    `);
  }, [mode, T]);

  const linkTooltip = useCallback((l) => {
    const s = typeof l.source === 'object' ? l.source.name : l.sourceId;
    const t = typeof l.target === 'object' ? l.target.name : l.targetId;
    const st = STATUS_META[l.status] || {};
    return tip(T, `
      <div style="font-weight:700;font-size:12.5px;color:${T.tipText};margin-bottom:4px">${l.disclosed ? fmtUSD(l.amount) : 'Undisclosed'}</div>
      <div style="color:${T.tipText2};margin-bottom:5px">${esc(s)} <span style="color:${tone(l.color, mode)}">→</span> ${esc(t)}</div>
      <div style="display:flex;gap:6px;align-items:center">
        <span style="width:7px;height:7px;border-radius:2px;background:${tone(l.color, mode)}"></span>
        <span style="color:${T.tipText3}">${esc(l.eventLabel)}</span>
        <span style="color:${T.tipRule}">·</span>
        <span style="color:${st.color || '#71717a'}">${esc(st.short || l.status)}</span>
        <span style="color:${T.tipRule}">·</span>
        <span style="color:${T.tipText4}">${esc(l.date)}</span>
      </div>
      <div style="margin-top:7px;color:${T.tipText4};font-size:9px">Click → deal detail</div>
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
          linkDirectionalParticleColor={(l) => tone(l.color, mode)}
          onNodeClick={(n) => onNodeClick(n.id)}
          onLinkClick={(l) => onLinkClick(l.id)}
          onBackgroundClick={handleBackground}
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

function tip(T, inner) {
  return `<div style="
    font-family:ui-monospace,monospace;font-size:10.5px;line-height:1.45;
    background:${T.tipBg};border:1px solid ${T.tipBorder};border-radius:8px;
    padding:10px 12px;max-width:270px;
    box-shadow:0 12px 32px -8px ${T.tipShadow};">${inner}</div>`;
}
