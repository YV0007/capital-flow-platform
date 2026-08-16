// Cover artworks for research reports — pure inline SVG, no asset loading.
// ResearchCover dispatches by report id; falls back to the data-center campus art.

function ResearchCoverNodes({ color = '#22D3EE' }) {
  // Cinematic aerial of a hyperscale AI data-center campus at dusk: receding
  // rows of data halls, rooftop cooling, a substation and lattice transmission
  // pylons with power lines, a dusk horizon glow. Pure inline SVG — dense,
  // institutional, dark-luxury, with restrained cyan accents only.
  const VPx = 104, VPy = 45;                       // vanishing point on horizon
  const toward = (x, y, f) => [x + (VPx - x) * f, y + (VPy - y) * f];
  const lerp2  = (a, b, f) => [a[0] + (b[0]-a[0])*f, a[1] + (b[1]-a[1])*f];

  // A flat data-hall slab. Front edge xL→xR at y=yF, receding `depth` toward VP,
  // raised `h` for thickness. Returns ground + roof corners.
  function slab(xL, xR, yF, depth, h) {
    const FL = [xL, yF], FR = [xR, yF];
    const BL = toward(xL, yF, depth), BR = toward(xR, yF, depth);
    const up = (p) => [p[0], p[1] - h];
    return { FL, FR, BL, BR, rFL: up(FL), rFR: up(FR), rBL: up(BL), rBR: up(BR) };
  }

  // Building set: far row (near horizon) → mid → near (foreground). Drawn
  // far-first so nearer halls correctly occlude farther ones.
  const far = [
    slab(42, 60, 62, 0.34, 2), slab(70, 96, 63, 0.34, 2),
    slab(106, 132, 62, 0.34, 2), slab(142, 166, 63, 0.34, 2),
  ];
  const mid = [
    slab(24, 58, 80, 0.30, 3), slab(72, 116, 82, 0.30, 3), slab(130, 174, 80, 0.30, 3),
  ];
  const near = [
    slab(10, 62, 103, 0.26, 4.5), slab(78, 134, 108, 0.26, 5), slab(150, 196, 102, 0.26, 4.5),
  ];

  // Rooftop mechanical/cooling: ribs parallel to the front edge + 2 seams.
  function roofDetail(b, key, n) {
    const els = [];
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1);
      const a = lerp2(b.rFL, b.rBL, t), c = lerp2(b.rFR, b.rBR, t);
      els.push(<line key={`${key}r${i}`} x1={a[0]} y1={a[1]} x2={c[0]} y2={c[1]}
        stroke="#2b313d" strokeWidth="0.3" strokeOpacity="0.8" />);
    }
    [0.34, 0.66].forEach((s, k) => {
      const a = lerp2(b.rFL, b.rFR, s), c = lerp2(b.rBL, b.rBR, s);
      els.push(<line key={`${key}s${k}`} x1={a[0]} y1={a[1]} x2={c[0]} y2={c[1]}
        stroke="#23282f" strokeWidth="0.3" strokeOpacity="0.7" />);
    });
    return els;
  }

  function building(b, key, accent) {
    const poly = (pts) => pts.map(p => p.join(',')).join(' ');
    return (
      <g key={key}>
        {/* left + right + front faces (thin) */}
        <polygon points={poly([b.FL, b.BL, b.rBL, b.rFL])} fill="#090b10" />
        <polygon points={poly([b.FR, b.BR, b.rBR, b.rFR])} fill="#0b0e14" />
        <polygon points={poly([b.FL, b.FR, b.rFR, b.rFL])} fill="#0c0f16" stroke="#1b2028" strokeWidth="0.25" />
        {/* roof */}
        <polygon points={poly([b.rFL, b.rFR, b.rBR, b.rBL])} fill="url(#dc-roof)" stroke="#2b313d" strokeWidth="0.35" />
        {roofDetail(b, key, b.FL[1] > 95 ? 6 : 4)}
        {/* subtle cyan accent along the front roof edge of hero halls */}
        {accent && <line x1={b.rFL[0]} y1={b.rFL[1]} x2={b.rFR[0]} y2={b.rFR[1]}
          stroke={color} strokeWidth="0.5" strokeOpacity="0.55" />}
      </g>
    );
  }

  // Lattice transmission pylon. Returns the element group + the wire-tip points.
  function pylon(cx, baseY, s) {
    const H = 24 * s, w = 7 * s;
    const topY = baseY - H;
    const legSplay = 2.4 * s;
    const arm1Y = baseY - H * 0.62, arm2Y = baseY - H * 0.84;
    const arm1W = 9 * s, arm2W = 6.5 * s;
    const st = { stroke: '#3a4150', strokeWidth: 0.4 * s, strokeOpacity: 0.9, fill: 'none' };
    const els = (
      <g key={`py${cx}-${baseY}`}>
        {/* legs */}
        <line x1={cx - legSplay} y1={baseY} x2={cx - w*0.18} y2={topY} {...st} />
        <line x1={cx + legSplay} y1={baseY} x2={cx + w*0.18} y2={topY} {...st} />
        {/* X bracing */}
        <line x1={cx - legSplay} y1={baseY} x2={cx + w*0.18} y2={topY} {...st} strokeOpacity="0.45" />
        <line x1={cx + legSplay} y1={baseY} x2={cx - w*0.18} y2={topY} {...st} strokeOpacity="0.45" />
        {/* crossarms */}
        <line x1={cx - arm1W} y1={arm1Y} x2={cx + arm1W} y2={arm1Y} {...st} />
        <line x1={cx - arm2W} y1={arm2Y} x2={cx + arm2W} y2={arm2Y} {...st} />
        <line x1={cx} y1={topY} x2={cx} y2={baseY} {...st} strokeOpacity="0.5" />
      </g>
    );
    return { els, tips: [
      [cx - arm1W, arm1Y], [cx + arm1W, arm1Y],
      [cx - arm2W, arm2Y], [cx + arm2W, arm2Y],
    ] };
  }

  // Three pylons marching from foreground toward the campus.
  const py1 = pylon(36, 116, 1.0);
  const py2 = pylon(58, 92, 0.72);
  const py3 = pylon(76, 74, 0.52);

  // Catenary wire (drooping) between two tips.
  const wire = (p1, p2, sag, k) => {
    const mx = (p1[0]+p2[0])/2, my = (p1[1]+p2[1])/2 + sag;
    return <path key={k} d={`M ${p1[0]} ${p1[1]} Q ${mx} ${my} ${p2[0]} ${p2[1]}`}
      stroke="#39414e" strokeWidth="0.3" strokeOpacity="0.6" fill="none" />;
  };
  const wires = [
    wire(py1.tips[0], py2.tips[0], 3, 'w1'), wire(py1.tips[1], py2.tips[1], 3, 'w2'),
    wire(py1.tips[2], py2.tips[2], 2.4, 'w3'), wire(py1.tips[3], py2.tips[3], 2.4, 'w4'),
    wire(py2.tips[0], py3.tips[0], 1.8, 'w5'), wire(py2.tips[1], py3.tips[1], 1.8, 'w6'),
    wire(py2.tips[2], py3.tips[2], 1.4, 'w7'), wire(py2.tips[3], py3.tips[3], 1.4, 'w8'),
  ];

  // Substation: grid of transformers + a gantry, lower-left foreground.
  const transformers = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
    const x = 11 + c * 6.4, y = 104 + r * 7;
    transformers.push(<g key={`tf${r}${c}`}>
      <rect x={x} y={y} width="4.6" height="4.4" fill="#161a22" stroke="#2b313d" strokeWidth="0.25" />
      <line x1={x+0.6} y1={y-1.3} x2={x+4} y2={y-1.3} stroke="#3a4150" strokeWidth="0.3" />
    </g>);
  }
  // distant cooling-tower silhouettes + faint steam at the horizon
  const coolingTowers = [
    { x: 150, w: 9 }, { x: 168, w: 8 },
  ];

  // Facility lights — mostly warm, a few subtle cyan. Sampled near roof centers
  // and along the access road.
  const lightPts = [
    [38, 96, 'w'], [50, 90, 'w'], [104, 100, 'c'], [120, 97, 'w'], [170, 95, 'w'],
    [44, 76, 'w'], [96, 78, 'c'], [150, 75, 'w'], [60, 60, 'w'], [118, 60, 'w'],
    [156, 61, 'c'], [88, 62, 'w'], [30, 110, 'w'], [22, 112, 'c'], [134, 104, 'w'],
    [196, 99, 'w'], [78, 104, 'w'],
  ];

  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        {/* dusk sky: deep navy fading to a warm+cyan horizon glow */}
        <linearGradient id="dc-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#0a0d18" />
          <stop offset="55%"  stopColor="#0e131f" />
          <stop offset="100%" stopColor="#161c27" />
        </linearGradient>
        {/* horizon glow */}
        <radialGradient id="dc-glow" cx="50%" cy="100%" r="62%">
          <stop offset="0%"   stopColor="#e8a23c" stopOpacity="0.20" />
          <stop offset="42%"  stopColor={color}   stopOpacity="0.08" />
          <stop offset="100%" stopColor={color}   stopOpacity="0" />
        </radialGradient>
        {/* ground plane: lit near horizon, darkening to foreground */}
        <linearGradient id="dc-ground" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#10141d" />
          <stop offset="100%" stopColor="#070910" />
        </linearGradient>
        {/* roof sheen */}
        <linearGradient id="dc-roof" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#1c212c" />
          <stop offset="100%" stopColor="#10141b" />
        </linearGradient>
        {/* bottom cinematic overlay for text legibility */}
        <linearGradient id="dc-fade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#05060a" stopOpacity="0" />
          <stop offset="100%" stopColor="#05060a" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id="dc-vig" cx="50%" cy="46%" r="70%">
          <stop offset="60%"  stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
        <filter id="dc-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {/* sky + horizon glow */}
      <rect x="0" y="0" width="200" height="46" fill="url(#dc-sky)" />
      <rect x="0" y="0" width="200" height="60" fill="url(#dc-glow)" />

      {/* distant skyline silhouette at the horizon */}
      <g fill="#0a0d15">
        <rect x="0" y="40" width="40" height="6" />
        <rect x="44" y="38" width="22" height="8" />
        <rect x="92" y="39" width="30" height="7" />
        <rect x="128" y="41" width="18" height="5" />
        <rect x="184" y="40" width="16" height="6" />
      </g>
      {/* cooling towers + faint steam */}
      {coolingTowers.map((ct, i) => (
        <g key={`ct${i}`}>
          <path d={`M ${ct.x} 44 L ${ct.x + ct.w*0.22} 33 L ${ct.x + ct.w*0.78} 33 L ${ct.x + ct.w} 44 Z`} fill="#0b0e16" />
          <ellipse cx={ct.x + ct.w/2} cy="30" rx={ct.w*0.7} ry="4" fill="#aeb6c4" opacity="0.10" filter="url(#dc-soft)" />
        </g>
      ))}

      {/* ground plane */}
      <rect x="0" y="44" width="200" height="76" fill="url(#dc-ground)" />

      {/* access roads converging to the vanishing point */}
      <g stroke="#161b24" strokeWidth="0.5" strokeOpacity="0.7">
        <line x1="0" y1="120" x2={VPx - 6} y2={VPy + 2} />
        <line x1="200" y1="120" x2={VPx + 8} y2={VPy + 2} />
        <line x1="70" y1="120" x2={VPx - 2} y2={VPy + 3} />
        <line x1="150" y1="120" x2={VPx + 4} y2={VPy + 3} />
      </g>

      {/* campus — far, then mid, then near */}
      {far.map((b, i) => building(b, `far${i}`, false))}
      {mid.map((b, i) => building(b, `mid${i}`, i === 1))}
      {near.map((b, i) => building(b, `near${i}`, i === 1))}

      {/* power lines behind pylons, then pylons, then substation (foreground) */}
      {wires}
      {py3.els}{py2.els}{py1.els}

      {/* substation */}
      <g>
        {/* pad */}
        <rect x="8" y="101" width="30" height="18" fill="#0a0d13" stroke="#1b2028" strokeWidth="0.3" />
        {transformers}
        {/* gantry: posts + bus bars */}
        <g stroke="#3a4150" strokeWidth="0.35" strokeOpacity="0.85">
          <line x1="12" y1="101" x2="12" y2="96" />
          <line x1="23" y1="101" x2="23" y2="96" />
          <line x1="34" y1="101" x2="34" y2="96" />
          <line x1="11" y1="97" x2="35" y2="97" />
          <line x1="11" y1="99" x2="35" y2="99" />
        </g>
        <circle cx="15" cy="106" r="0.5" fill="#ffe3b0" opacity="0.8" />
        <circle cx="28" cy="113" r="0.5" fill={color} opacity="0.7" />
      </g>

      {/* facility lights */}
      {lightPts.map((p, i) => (
        <circle key={`lt${i}`} cx={p[0]} cy={p[1]} r={p[2] === 'c' ? 0.55 : 0.5}
          fill={p[2] === 'c' ? color : '#ffe3b0'} opacity={p[2] === 'c' ? 0.6 : 0.7} />
      ))}

      {/* cinematic overlays */}
      <rect x="0" y="0" width="200" height="120" fill="url(#dc-vig)" />
      <rect x="0" y="72" width="200" height="48" fill="url(#dc-fade)" />
    </svg>
  );
}

function HoldingsCoverArt() {
  return (
    <img src={new URL('../../assets/buffett.jpg', import.meta.url).href}
      alt="Holdings" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
  );
}

function DataCentersCoverArt() {
  return (
    <img src={new URL('../../assets/datacenter.jpg', import.meta.url).href}
      alt="Data Centers for AI" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
  );
}

// Cover art for the Proxy research report — a Falcon 9 launch photo, matching
// the photographic covers of the Holdings and Data-Centers reports. The report
// analyses proxy access to frontier private AI (SpaceX / OpenAI / Anthropic)
// through public holdings, so the launch imagery reads as "reaching the frontier."
function ProxyCoverArt() {
  return (
    <img src={new URL('../../assets/proxy.jpg', import.meta.url).href}
      alt="Proxy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
  );
}

// Capital Flow Map — cover as one dense fractal branching mass filling the
// frame, matching the density of the client's second reference (thousands of
// fine recursive branches overlapping into a solid organic cloud, wispy
// escaping strands at the edges) rather than a sparse constellation — rebuilt
// from scratch, not that artist's own image, and recoloured into the
// dashboard's dark steel-blue palette. Deterministic (seeded PRNG) so the
// cover never re-flows.
const CF_CLOUD = (() => {
  // mulberry32 — tiny deterministic PRNG
  let seed = 20260818;
  const rnd = () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const segments = [];

  // One recursive branch: a short run of jittered segments, tapering width
  // by remaining depth, forking up to twice per level. High fork chance +
  // many seed points is what turns this into a dense overlapping mass
  // instead of a few legible sprigs.
  function grow(x, y, angle, len, depth, maxDepth) {
    let cx = x, cy = y, a = angle;
    const steps = 2 + Math.floor(rnd() * 2);
    for (let s = 0; s < steps; s++) {
      a += (rnd() - 0.5) * 0.7;
      const stepLen = len / steps;
      const nx = cx + Math.cos(a) * stepLen;
      const ny = cy + Math.sin(a) * stepLen;
      segments.push({
        x1: cx, y1: cy, x2: nx, y2: ny,
        w: 0.12 + 0.3 * (depth / maxDepth),
        o: 0.14 + 0.22 * (depth / maxDepth),
      });
      cx = nx; cy = ny;
    }
    if (depth > 0) {
      const forks = rnd() < 0.58 ? 2 : 1;
      for (let k = 0; k < forks; k++) {
        const da = (k === 0 ? -1 : 1) * (0.3 + rnd() * 0.6);
        grow(cx, cy, a + da, len * 0.76, depth - 1, maxDepth);
      }
    }
  }

  // Seed points scattered across an oval envelope spanning most of the
  // 200x120 canvas, each throwing off many branches so the whole thing reads
  // as one dense mass, not isolated sprigs.
  const seeds = [];
  const SEED_N = 9;
  for (let i = 0; i < SEED_N; i++) {
    seeds.push({ x: 55 + rnd() * 95, y: 22 + rnd() * 76 });
  }
  seeds.forEach(sd => {
    const branches = 7 + Math.floor(rnd() * 4);
    for (let i = 0; i < branches; i++) {
      grow(sd.x, sd.y, rnd() * Math.PI * 2, 9 + rnd() * 10, 4, 4);
    }
    // one longer wispy strand escaping the mass, per seed
    grow(sd.x, sd.y, rnd() * Math.PI * 2, 32 + rnd() * 30, 2, 2);
  });

  return { segments };
})();

function CapitalFlowCoverArt() {
  const { segments } = CF_CLOUD;
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="cfd-bg" cx="55%" cy="48%" r="80%">
          <stop offset="0%"   stopColor="#101825" />
          <stop offset="60%"  stopColor="#0a0e16" />
          <stop offset="100%" stopColor="#05070a" />
        </radialGradient>
      </defs>

      <rect width="200" height="120" fill="url(#cfd-bg)" />

      <g fill="none" strokeLinecap="round">
        {segments.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#6fa3d4" strokeWidth={s.w} strokeOpacity={s.o} />
        ))}
      </g>
    </svg>
  );
}

// Picks the right cover art for a given research id.
function ResearchCover({ id, color }) {
  if (id === 'holdings')       return <HoldingsCoverArt />;
  if (id === 'data-centers-ai') return <DataCentersCoverArt />;
  if (id === 'proxy')          return <ProxyCoverArt color={color} />;
  if (id === 'capital-flow-map') return <CapitalFlowCoverArt color={color} />;
  return <ResearchCoverNodes color={color} />;
}


export default ResearchCover;
export { ResearchCoverNodes, HoldingsCoverArt, DataCentersCoverArt, ProxyCoverArt, CapitalFlowCoverArt };
