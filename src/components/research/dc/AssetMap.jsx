// ══════════════════════════════════════════════════════════════════════════
// AssetMap – force-directed-style sector map embedded inside the matrix card.
// Static deterministic ring layout (no jitter), hover tooltip, click → detail
// modal with backdrop blur, drag-to-pin, scroll/buttons zoom, pan, risk filter.
// A self-contained canvas component; lives inside the matrix feature container.
// ══════════════════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState } from 'react';
import dcBucketsData from '../../../data/dc-buckets.json';

const { DC_BUCKETS, DC_DOMAINS } = dcBucketsData;

// Inline style helpers for the asset-map modal/zoom button
const zbtn = {
  width: 28, height: 28, borderRadius: '50%', background: 'transparent', border: '1px solid transparent',
  color: 'var(--hm-text3)', cursor: 'pointer', fontFamily: 'ui-monospace,monospace', fontSize: 14, fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
};
const mLabel = { fontFamily: 'ui-monospace,monospace', fontSize: 9.5, color: 'var(--hm-text5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, fontWeight: 700 };
const mVal = { fontSize: 13.5, color: 'var(--hm-text)', fontWeight: 500 };

// Mirrors the dcBucketFor helper in DataCentersAI.jsx – duplicated here so AssetMap
// is self-contained and we don't drag the whole report module into this leaf.
function dcBucketFor(sector) {
  for (const [name, def] of Object.entries(DC_BUCKETS)) {
    if (def.sectors.includes(sector)) return name;
  }
  return 'Other';
}

export default function AssetMap({ rows }) {
  const canvasRef    = useRef(null);
  const wrapRef      = useRef(null);
  const stateRef     = useRef(null);     // mutable sim state (nodes, hubs, view…)
  const [tooltip, setTooltip]   = useState(null);   // { x, y, company, ticker, sector }
  const [selected, setSelected] = useState(null);   // node.data for the modal
  const [riskFilter, setRiskFilter] = useState('');
  const [search, setSearch]     = useState('');
  const [zoomPct, setZoomPct]   = useState(100);

  const HEIGHT = 620;

  // Conviction → ring stroke width
  const CONV_STROKE = { 'High': 4.0, 'Med-High': 3.0, 'Medium': 2.1, 'Low-Med': 1.4, 'Low': 1.0 };

  // Short label for inside the bubble
  const shortTicker = (c) => {
    if (c.ppr === 'Pvt') return c.company.split(/[\s\-(]/)[0].toUpperCase().slice(0, 4);
    const m = c.ticker.match(/:\s*([A-Z0-9]+)/);
    return m ? m[1].slice(0, 5) : c.ticker.slice(0, 5);
  };

  const hexA = (hex, a) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  };
  // Lighten a hex color toward white by t (0..1) → returns #rrggbb
  const lighten = (hex, t) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    const L = (c) => Math.round(c + (255 - c) * t);
    const h = (c) => L(c).toString(16).padStart(2,'0');
    return `#${h(r)}${h(g)}${h(b)}`;
  };

  // ── Build + run the canvas simulation once on mount ──
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    let raf = 0, DPR = 1, W = 0, H = HEIGHT;

    const bucketNames = Object.keys(DC_BUCKETS);
    const hubs = {};

    function layoutHubs() {
      const cx = W / 2, cy = H / 2;
      // Generous hub-ring radii so the six clusters sit well apart. fitView()
      // auto-scales the whole thing down to fit the 620px container, so larger
      // values here simply mean more gap between clusters (less crowding).
      const RX = Math.min(W * 0.40, 560);
      const RY = Math.min(H * 0.62, 360);
      const ORDER = ['Compute & Silicon','Power & Grid','Connectivity & Photonics','Construction & Labor','Materials & Chemicals','Cooling & Thermal'];
      ORDER.forEach((name, i) => {
        const angle = -Math.PI/2 + (i * Math.PI*2/6);
        hubs[name] = { name, color: DC_BUCKETS[name].color, x: cx + RX*Math.cos(angle), y: cy + RY*Math.sin(angle), r: 48 };
      });
    }

    // Node list
    const nodes = rows.map((c, i) => ({
      id: i, data: c, bucket: c.bucket, color: DC_BUCKETS[c.bucket].color,
      short: shortTicker(c), x: 0, y: 0, r: 20,
      stroke: CONV_STROKE[c.conviction] || 1.5,
      orbitR: 0, orbitA: 0, fixed: false, pinned: false, visible: true,
    }));

    // Preload each company's logo. Primary: Clearbit (real logos); on failure,
    // fall back to a Google favicon; if that also fails, the renderer draws a
    // colored dot with the ticker instead. Images are display-only (no pixel
    // readback) so we don't set crossOrigin – that avoids CORS load failures.
    const logos = {};   // node.id → { img, loaded }
    nodes.forEach(n => {
      const domain = DC_DOMAINS[n.data.company];
      if (!domain) return;
      const rec = { img: new Image(), loaded: false };
      rec.img.onload  = () => { rec.loaded = true; };
      rec.img.onerror = () => {
        const fav = new Image();
        fav.onload = () => { rec.img = fav; rec.loaded = true; };
        fav.onerror = () => {};   // give up → dot fallback
        fav.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      };
      rec.img.src = `https://logo.clearbit.com/${domain}`;
      logos[n.id] = rec;
    });

    function assignOrbits() {
      const byBucket = {};
      nodes.forEach(n => { n.pinned = false; (byBucket[n.bucket] = byBucket[n.bucket] || []).push(n); });
      for (const name of bucketNames) {
        const list = byBucket[name] || [];
        const hub = hubs[name];
        const ring0 = hub.r + 34, ringGap = 38;
        let idx = 0, ring = 0;
        while (idx < list.length) {
          const capacity = ring === 0 ? 6 : Math.floor(6 + ring*4);
          const inThisRing = Math.min(capacity, list.length - idx);
          const radius = ring0 + ring*ringGap;
          for (let k = 0; k < inThisRing; k++) {
            const n = list[idx+k];
            n.orbitR = radius;
            n.orbitA = (k/inThisRing)*Math.PI*2 + (ring % 2 ? Math.PI/inThisRing : 0);
          }
          idx += inThisRing; ring++;
        }
      }
    }

    function placeNodes() {
      for (const n of nodes) {
        if (n.fixed || n.pinned) continue;
        const hub = hubs[n.bucket];
        n.x = hub.x + Math.cos(n.orbitA) * n.orbitR;
        n.y = hub.y + Math.sin(n.orbitA) * n.orbitR;
      }
    }

    // View transform
    const view = { x: 0, y: 0, zoom: 1 };
    const ZOOM_MIN = 0.4, ZOOM_MAX = 2.6;
    const screenToWorld = (sx, sy) => ({ x: (sx - view.x)/view.zoom, y: (sy - view.y)/view.zoom });

    function fitView() {
      let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      for (const name of bucketNames) {
        const h = hubs[name];
        const count = nodes.filter(n => n.bucket === name).length;
        // Outermost ring radius for this bucket: ring0 + ringGap*(rings-1).
        let reach = h.r + 34;            // ring0
        if (count > 6)  reach += 38;     // +1 ring (ringGap)
        if (count > 14) reach += 38;     // +1 more ring
        reach += 20 + 16;                // dot radius + outside label space
        minX=Math.min(minX,h.x-reach); maxX=Math.max(maxX,h.x+reach);
        minY=Math.min(minY,h.y-reach); maxY=Math.max(maxY,h.y+reach);
      }
      const bw=maxX-minX, bh=maxY-minY;
      const padX=50, padY=40;
      const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.min((W-padX*2)/bw, (H-padY*2)/bh)));
      view.zoom = z;
      const cxBox=(minX+maxX)/2, cyBox=(minY+maxY)/2;
      view.x = W/2 - cxBox*z;
      view.y = H/2 - cyBox*z;
      setZoomPct(Math.round(z*100));
    }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth; H = HEIGHT;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      canvas.width = Math.round(W*DPR); canvas.height = Math.round(H*DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0);
      layoutHubs(); assignOrbits(); placeNodes(); fitView();
    }

    // expose state for the React handlers
    const S = stateRef.current = {
      nodes, hubs, view, bucketNames,
      hovered: null, focused: null, dragNode: null, isPanning: false,
      dragOffset: {x:0,y:0}, panStart: {x:0,y:0,vx:0,vy:0},
      dragStartTime: 0, dragStartPos: {x:0,y:0},
      riskFilter: '', search: '',
      screenToWorld, fitView, ZOOM_MIN, ZOOM_MAX,
      setZoomPct, getW: () => W, getH: () => H,
      hitTest(sx, sy) {
        const { x, y } = screenToWorld(sx, sy);
        for (let i = nodes.length-1; i >= 0; i--) {
          const n = nodes[i];
          if (!n.visible) continue;
          const dx=x-n.x, dy=y-n.y;
          if (dx*dx + dy*dy < (n.r+4)**2) return n;
        }
        return null;
      },
      applyFilters() {
        const q = this.search.toLowerCase();
        for (const n of nodes) {
          let vis = true;
          if (q && !(n.data.company.toLowerCase().includes(q) || n.data.ticker.toLowerCase().includes(q))) vis = false;
          if (this.riskFilter && n.data.riskTier !== this.riskFilter) vis = false;
          n.visible = vis;
        }
      },
    };

    function clear() {
      ctx.fillStyle = 'var(--hm-bg2)';
      ctx.fillRect(0,0,W,H);
      const g = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.6);
      g.addColorStop(0,'var(--hm-surface)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    }

    function drawHubs() {
      for (const name of bucketNames) {
        const h = hubs[name];

        // Clean solid disc – flat dark fill, crisp sector ring, no glow.
        ctx.fillStyle = '#101013';
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = hexA(h.color, 0.95);
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI*2); ctx.stroke();

        // Sector NAME inside, wrapped to ≤2 lines, large and centered.
        const words = name.toUpperCase().split(' ').filter(w => w !== '&');
        let l1 = '', l2 = '';
        if (words.length === 1) l1 = words[0];
        else { const half = Math.ceil(words.length/2); l1 = words.slice(0,half).join(' '); l2 = words.slice(half).join(' '); }

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '700 12px ui-monospace, "SF Mono", Menlo, monospace';
        ctx.fillStyle = 'var(--hm-text)';
        if (l2) {
          ctx.fillText(l1, h.x, h.y - 7);
          ctx.fillText(l2, h.x, h.y + 7);
        } else {
          ctx.fillText(l1, h.x, h.y);
        }
      }
    }

    function drawConnections() {
      for (const n of nodes) {
        if (!n.visible) continue;
        const h = hubs[n.bucket];
        const dim = S.focused && S.focused !== n && S.focused.bucket !== n.bucket;
        ctx.strokeStyle = hexA(n.color, dim ? 0.04 : 0.10);
        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(h.x,h.y); ctx.lineTo(n.x,n.y); ctx.stroke();
      }
    }

    function drawNodes() {
      for (const n of nodes) {
        if (!n.visible) continue;
        const lift = S.hovered === n || S.focused === n;
        const dim  = S.focused && S.focused !== n && S.focused.bucket !== n.bucket;
        const alpha = dim ? 0.20 : 1.0;
        const r = n.r * (lift ? 1.16 : 1.0);

        // Soft glow halo on hover/focus
        if (lift) {
          const gg = ctx.createRadialGradient(n.x, n.y, r*0.5, n.x, n.y, r*2.6);
          gg.addColorStop(0, hexA(n.color, 0.40));
          gg.addColorStop(1, hexA(n.color, 0));
          ctx.fillStyle = gg;
          ctx.beginPath(); ctx.arc(n.x, n.y, r*2.6, 0, Math.PI*2); ctx.fill();
        }

        const rec = logos[n.id];
        if (rec && rec.loaded) {
          // ── Logo chip ── light circular background + clipped logo + sector ring.
          ctx.save();
          ctx.globalAlpha = alpha;
          // light chip so logos with dark/transparent marks stay visible
          ctx.fillStyle = '#f4f4f5';
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2); ctx.fill();
          // clip to circle and draw the logo with padding
          ctx.save();
          ctx.beginPath(); ctx.arc(n.x, n.y, r - 1, 0, Math.PI*2); ctx.clip();
          const pad = r * 0.30;
          const d = (r - pad) * 2;
          const iw = rec.img.naturalWidth || 1, ih = rec.img.naturalHeight || 1;
          // contain the logo within the padded square, preserving aspect ratio
          const s = Math.min(d / iw, d / ih);
          const dw = iw * s, dh = ih * s;
          ctx.drawImage(rec.img, n.x - dw/2, n.y - dh/2, dw, dh);
          ctx.restore();
          // sector-colored ring (uniform – encodes the bucket, not conviction)
          ctx.strokeStyle = hexA(n.color, 0.95);
          ctx.lineWidth = lift ? 3 : 2.2;
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2); ctx.stroke();
          ctx.restore();
        } else {
          // ── Fallback dot ── solid sector-colored disc with a subtle top-light.
          const fill = ctx.createRadialGradient(n.x - r*0.35, n.y - r*0.4, r*0.1, n.x, n.y, r);
          fill.addColorStop(0, hexA(lighten(n.color, 0.18), alpha));
          fill.addColorStop(1, hexA(n.color, alpha));
          ctx.fillStyle = fill;
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2); ctx.fill();
          if (lift) {
            ctx.strokeStyle = hexA(lighten(n.color, 0.35), 1);
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2); ctx.stroke();
          }
        }

        // Ticker label OUTSIDE, below the dot – always visible (not dimmed-out)
        if (alpha > 0.4) {
          ctx.font = `${lift ? '700' : '600'} 9.5px ui-monospace, "SF Mono", Menlo, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = lift ? 'var(--hm-text)' : hexA('var(--hm-text2)', alpha);
          ctx.fillText(n.short, n.x, n.y + r + 6);
        }

        // On hover/focus, swap to the full company name on a small dark plate
        if (lift) {
          ctx.font = '600 11px -apple-system, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const ly = n.y + r + 5;
          const tw = ctx.measureText(n.data.company).width;
          ctx.fillStyle = 'rgba(10,10,10,0.8)';
          ctx.fillRect(n.x - tw/2 - 7, ly - 2, tw + 14, 18);
          ctx.fillStyle = 'var(--hm-text)';
          ctx.fillText(n.data.company, n.x, ly);
        }
      }
    }

    function frame() {
      placeNodes();
      clear();
      ctx.save(); ctx.translate(view.x,view.y); ctx.scale(view.zoom,view.zoom);
      drawConnections(); drawHubs(); drawNodes();
      ctx.restore();
      raf = requestAnimationFrame(frame);
    }

    resize();
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); stateRef.current = null; };
  }, [rows]);

  // Keep the sim's filter state in sync with React state
  useEffect(() => {
    const S = stateRef.current; if (!S) return;
    S.riskFilter = riskFilter; S.search = search; S.applyFilters();
  }, [riskFilter, search]);

  // ── Pointer handlers (operate on the mutable sim state) ──
  const onMouseMove = (e) => {
    const S = stateRef.current; if (!S) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    if (S.dragNode) {
      const w = S.screenToWorld(sx, sy);
      S.dragNode.x = w.x - S.dragOffset.x; S.dragNode.y = w.y - S.dragOffset.y;
      return;
    }
    if (S.isPanning) {
      S.view.x = S.panStart.vx + (sx - S.panStart.x);
      S.view.y = S.panStart.vy + (sy - S.panStart.y);
      return;
    }
    const n = S.hitTest(sx, sy);
    S.hovered = n;
    if (n) setTooltip({ x: e.clientX, y: e.clientY, company: n.data.company, ticker: n.data.ticker, sector: n.data.sector });
    else setTooltip(null);
  };
  const onMouseDown = (e) => {
    const S = stateRef.current; if (!S) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const n = S.hitTest(sx, sy);
    S.dragStartTime = Date.now(); S.dragStartPos = { x: sx, y: sy };
    if (n) {
      S.dragNode = n; n.fixed = true;
      const w = S.screenToWorld(sx, sy);
      S.dragOffset = { x: w.x - n.x, y: w.y - n.y };
    } else {
      S.isPanning = true;
      S.panStart = { x: sx, y: sy, vx: S.view.x, vy: S.view.y };
    }
  };
  const onMouseUp = (e) => {
    const S = stateRef.current; if (!S) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    if (S.dragNode) {
      const dist = Math.hypot(sx - S.dragStartPos.x, sy - S.dragStartPos.y);
      const elapsed = Date.now() - S.dragStartTime;
      if (dist < 4 && elapsed < 300) { S.focused = S.dragNode; setSelected(S.dragNode.data); }
      else S.dragNode.pinned = true;
      S.dragNode.fixed = false; S.dragNode = null;
    } else if (S.isPanning) {
      S.isPanning = false;
    }
  };
  const onWheel = (e) => {
    const S = stateRef.current; if (!S) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.12 : 1/1.12;
    zoomAt(sx, sy, S.view.zoom * factor);
  };
  const zoomAt = (sx, sy, nz) => {
    const S = stateRef.current; if (!S) return;
    nz = Math.max(S.ZOOM_MIN, Math.min(S.ZOOM_MAX, nz));
    const w = S.screenToWorld(sx, sy);
    S.view.zoom = nz; S.view.x = sx - w.x*nz; S.view.y = sy - w.y*nz;
    setZoomPct(Math.round(nz*100));
  };
  const zoomButton = (dir) => {
    const S = stateRef.current; if (!S) return;
    zoomAt(S.getW()/2, S.getH()/2, S.view.zoom * (dir > 0 ? 1.2 : 1/1.2));
  };
  const closeModal = () => { const S = stateRef.current; if (S) S.focused = null; setSelected(null); };

  // Esc closes modal
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const RISKS = ['', 'Core', 'Growth', 'Aggressive'];
  const RISK_LABEL = { '': 'All', 'Core': 'Core', 'Growth': 'Growth', 'Aggressive': 'Aggressive' };
  const RISK_ACTIVE_BG = { '': 'var(--hm-text)', 'Core': '#10b981', 'Growth': '#22d3ee', 'Aggressive': '#f59e0b' };
  const RISK_ACTIVE_FG = { '': '#0a0a0a', 'Core': '#07120d', 'Growth': '#04141a', 'Aggressive': '#1a1204' };

  const CONV_STYLE = {
    'High':     { color: '#10b981', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.45)' },
    'Med-High': { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.40)' },
    'Medium':   { color: 'var(--hm-text3)', bg: 'rgba(161,161,170,0.12)', border: 'rgba(161,161,170,0.35)' },
    'Low-Med':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.40)' },
    'Low':      { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.40)' },
  };
  const RISK_COLOR = { 'Core': '#10b981', 'Growth': '#22d3ee', 'Aggressive': '#f59e0b' };

  const sel = selected;
  const selBucket = sel ? dcBucketFor(sel.sector) : null;
  const selColor = selBucket ? DC_BUCKETS[selBucket].color : '#22d3ee';
  const selConv = sel ? (CONV_STYLE[sel.conviction] || CONV_STYLE['Medium']) : null;

  return (
    <div ref={wrapRef} style={{
      position: 'relative', width: '100%', height: HEIGHT,
      background: 'var(--hm-bg2)', border: '1px solid var(--hm-border5)', borderRadius: 10, overflow: 'hidden',
    }}>
      <canvas
        ref={canvasRef}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { const S = stateRef.current; if (S){ S.hovered=null; } setTooltip(null); }}
        onWheel={onWheel}
        style={{ display: 'block', cursor: tooltip ? 'pointer' : 'default' }}
      />

      {/* Risk filter + search (top-left overlay) */}
      <div style={{
        position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--hm-solid)', backdropFilter: 'blur(8px)',
        border: '1px solid var(--hm-border5)', borderRadius: 999, padding: '6px 8px 6px 14px',
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Find…"
          style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--hm-text)', fontSize: 12, fontFamily: 'inherit', width: 110 }}
        />
        <span style={{ width: 1, height: 16, background: 'var(--hm-border5)' }} />
        <span style={{ fontSize: 8.5, color: 'var(--hm-text6)', fontFamily: 'ui-monospace,monospace', letterSpacing: '0.14em', fontWeight: 700 }}>RISK</span>
        {RISKS.map(rk => {
          const active = riskFilter === rk;
          return (
            <button key={rk || 'all'} onClick={() => setRiskFilter(rk)}
              style={{
                fontFamily: 'ui-monospace,monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em',
                padding: '5px 10px', borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${active ? RISK_ACTIVE_BG[rk] : 'var(--hm-border5)'}`,
                background: active ? RISK_ACTIVE_BG[rk] : 'transparent',
                color: active ? RISK_ACTIVE_FG[rk] : 'var(--hm-text3)', transition: 'all 140ms',
              }}>
              {RISK_LABEL[rk]}
            </button>
          );
        })}
      </div>

      {/* Zoom controls (right edge) */}
      <div style={{
        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        background: 'var(--hm-solid)', backdropFilter: 'blur(8px)',
        border: '1px solid var(--hm-border5)', borderRadius: 999, padding: '8px 6px',
      }}>
        <button onClick={() => zoomButton(1)} style={zbtn}>+</button>
        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 9, color: 'var(--hm-text5)', fontWeight: 700, padding: '2px 0' }}>{zoomPct}%</div>
        <button onClick={() => zoomButton(-1)} style={zbtn}>−</button>
        <button onClick={() => { const S = stateRef.current; if (S) S.fitView(); }} style={{ ...zbtn, fontSize: 12 }}>⊕</button>
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x + 14, top: tooltip.y + 14, zIndex: 60,
          background: 'rgba(15,15,16,0.94)', backdropFilter: 'blur(10px)',
          border: '1px solid var(--hm-border5)', borderRadius: 6, padding: '8px 11px',
          pointerEvents: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--hm-text)', fontWeight: 600, marginBottom: 2 }}>{tooltip.company}</div>
          <div style={{ fontSize: 9.5, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace' }}>{tooltip.ticker} · {tooltip.sector}</div>
          <div style={{ fontSize: 8.5, color: 'var(--hm-text6)', fontFamily: 'ui-monospace,monospace', letterSpacing: '0.1em', marginTop: 6, textTransform: 'uppercase' }}>Click for detail</div>
        </div>
      )}

      {/* Modal + backdrop */}
      {sel && (
        <>
          <div onClick={closeModal} style={{
            position: 'absolute', inset: 0, zIndex: 70,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 'min(420px, calc(100% - 40px))', zIndex: 80,
            background: 'linear-gradient(180deg, rgba(24,24,27,0.98), rgba(15,15,16,0.98))',
            border: '1px solid var(--hm-border5)', borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          }}>
            <div style={{ height: 3, background: selColor }} />
            <button onClick={closeModal} style={{
              position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: '50%',
              background: 'var(--hm-chip2)', border: '1px solid var(--hm-border5)', color: 'var(--hm-text3)',
              cursor: 'pointer', fontSize: 16, lineHeight: 1,
            }}>×</button>
            <div style={{ padding: '24px 26px 22px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 18,
                fontFamily: 'ui-monospace,monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999,
                border: `1px solid ${hexA(selColor,0.35)}`, background: hexA(selColor,0.06), color: selColor,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: selColor }} />
                {selBucket}
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: 'var(--hm-text)', letterSpacing: '-0.018em', lineHeight: 1.1, marginBottom: 4 }}>{sel.company}</div>
              <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, color: 'var(--hm-text5)', marginBottom: 22 }}>{sel.ticker}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px', marginBottom: 20 }}>
                <div>
                  <div style={mLabel}>Conviction</div>
                  <span style={{ display: 'inline-block', padding: '3px 10px', fontFamily: 'ui-monospace,monospace', fontSize: 11, fontWeight: 700, borderRadius: 4, color: selConv.color, background: selConv.bg, border: `1px solid ${selConv.border}` }}>{sel.conviction}</span>
                </div>
                <div><div style={mLabel}>Risk Tier</div><div style={{ ...mVal, color: RISK_COLOR[sel.riskTier] || 'var(--hm-text3)' }}>{sel.riskTier}</div></div>
                <div><div style={mLabel}>Time horizon</div><div style={mVal}>{sel.horizon}</div></div>
                <div><div style={mLabel}>Geography</div><div style={mVal}>{sel.geo}</div></div>
                <div>
                  <div style={mLabel}>Listing</div>
                  <span style={{ display: 'inline-block', padding: '3px 10px', fontFamily: 'ui-monospace,monospace', fontSize: 11, borderRadius: 4, border: '1px solid', color: sel.ppr==='Pub'?'#10b981':'#a78bfa', borderColor: sel.ppr==='Pub'?'rgba(16,185,129,0.4)':'rgba(167,139,250,0.4)', background: sel.ppr==='Pub'?'rgba(16,185,129,0.1)':'rgba(167,139,250,0.1)' }}>{sel.ppr==='Pub'?'Public':'Private'}</span>
                </div>
                <div><div style={mLabel}>Sub-sector</div><div style={mVal}>{sel.sector}</div></div>
              </div>
              <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--hm-border5)', borderLeft: `2px solid ${selColor}`, borderRadius: 8, fontSize: 12, color: 'var(--hm-text3)', lineHeight: 1.6 }}>
                <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6, color: selColor }}>Why this bucket matters</div>
                {selBucket ? DC_BUCKETS[selBucket].why : ''}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
