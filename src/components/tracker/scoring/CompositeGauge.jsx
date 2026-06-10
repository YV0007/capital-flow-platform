export default function CompositeGauge({ score, status }) {
  const cx = 200, cy = 180, r = 145, stroke = 24;
  const toXY = (deg) => {
    const rad = deg * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };
  const arcPath = (fromDeg, toDeg) => {
    const a = toXY(fromDeg), b = toXY(toDeg);
    return `M ${a.x} ${a.y} A ${r} ${r} 0 0 0 ${b.x} ${b.y}`;
  };

  // Colour stops along the arc, by position 0 (score 0) → 1 (score 10)
  const stops = [
    { pos: 0.00, rgb: [225,  29,  72] }, // rose
    { pos: 0.25, rgb: [249, 115,  22] }, // orange
    { pos: 0.50, rgb: [234, 179,   8] }, // yellow
    { pos: 0.75, rgb: [ 52, 211, 153] }, // emerald-light
    { pos: 1.00, rgb: [ 16, 185, 129] }, // emerald
  ];
  function interpColor(t) {
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i].pos) {
        const a = stops[i - 1], b = stops[i];
        const lt = (t - a.pos) / (b.pos - a.pos);
        const c = a.rgb.map((v, k) => Math.round(v + (b.rgb[k] - v) * lt));
        return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
      }
    }
    return `rgb(${stops[stops.length - 1].rgb.join(', ')})`;
  }

  // Build segments. Small overlap (0.5°) between adjacent segments smooths
  // antialiasing seams that otherwise show as a darker hairline.
  const numSegs = 80;
  const segs = [];
  for (let i = 0; i < numSegs; i++) {
    const t0 = i / numSegs;
    const t1 = (i + 1) / numSegs;
    const a0 = 180 - t0 * 180;
    const a1 = 180 - t1 * 180 - 0.4; // tiny overlap
    segs.push({ a0, a1, color: interpColor((t0 + t1) / 2) });
  }

  const STATUS_LABEL = {
    breakout: 'Breakout', on_track: 'On Track', mixed: 'Mixed',
    weak: 'Weak', low_coverage: 'Low Coverage',
  };

  const angle  = (score != null && !isNaN(score)) ? 180 - (score / 10) * 180 : 90;
  const needle = toXY(angle);

  return (
    <svg viewBox="0 0 400 240" style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block', margin: '0 auto' }}>
      {/* Background dim arc */}
      <path d={arcPath(180, 0)} stroke="#27272a" strokeWidth={stroke} fill="none" strokeLinecap="butt" />
      {/* Smooth colour segments */}
      {segs.map((s, i) => (
        <path key={i} d={arcPath(s.a0, s.a1)} stroke={s.color}
              strokeWidth={stroke} fill="none" strokeLinecap="butt" />
      ))}
      {/* Tick labels */}
      {[0, 2, 4, 5, 6, 8, 10].map((s) => {
        const a = 180 - (s / 10) * 180;
        const outerR = r + stroke / 2 + 10;
        const ox = cx + outerR * Math.cos(a * Math.PI / 180);
        const oy = cy - outerR * Math.sin(a * Math.PI / 180);
        return (
          <text key={s} x={ox} y={oy} textAnchor="middle" dominantBaseline="middle"
                fill="#52525b" fontSize="11" fontFamily="ui-monospace">{s}</text>
        );
      })}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y}
            stroke="#fafafa" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="6" fill="#fafafa" />
      <circle cx={cx} cy={cy} r="2.5" fill="#0a0a0a" />
      {/* Score readout */}
      <text x={cx} y={cy + 48} textAnchor="middle" fill="#fafafa" fontSize="46" fontWeight="700"
            fontFamily="Inter, system-ui, sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {score != null && !isNaN(score) ? score.toFixed(2) : '—'}
      </text>
      <text x={cx} y={cy + 72} textAnchor="middle" fill="#71717a" fontSize="12"
            fontFamily="ui-monospace" letterSpacing="0.06em">
        / 10.00 · {STATUS_LABEL[status] || '—'}
      </text>
    </svg>
  );
}
