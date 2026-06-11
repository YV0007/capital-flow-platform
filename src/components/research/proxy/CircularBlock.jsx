// Block 6 — Круговые сделки.
// Visualization: для каждой пары (инвестор, AI-стартап) рисуем кастомный
// SVG loop. Верхняя дуга — equity outbound (amber); нижняя дуга — compute
// revenue inbound (emerald). Толщина обеих дуг пропорциональна сумме,
// благодаря чему "почти 100%" сразу читается визуально. Отдельная панель
// показывает "чистые" прокси (CRM, ZM, SKM), где revenue-loop отсутствует.

import circular from '../../../data/proxy-circular.json';

// Compute the three vertices of an arrow-head triangle drawn as a plain
// polygon. The tip sits at (tipX, tipY); the base sits `length` units
// behind, perpendicular spread = `width`. Tangent direction comes from
// (ctrlX, ctrlY) → (tipX, tipY) — for a quadratic Bézier the end-tangent
// is parallel to that segment. Replacing SVG `<marker>` with a static
// polygon dodges every browser-quirk around `markerUnits` / stroke-width
// scaling — the arrow head stays a fixed size no matter how thick the
// arc gets.
function arrowHeadPoints(ctrlX, ctrlY, tipX, tipY, length = 7, width = 6) {
  const dx = tipX - ctrlX;
  const dy = tipY - ctrlY;
  const mag = Math.hypot(dx, dy) || 1;
  const ux = dx / mag;          // tangent unit
  const uy = dy / mag;
  const px = -uy;               // perpendicular unit
  const py = ux;
  const baseX = tipX - length * ux;
  const baseY = tipY - length * uy;
  const leftX  = baseX + (width / 2) * px;
  const leftY  = baseY + (width / 2) * py;
  const rightX = baseX - (width / 2) * px;
  const rightY = baseY - (width / 2) * py;
  return `${tipX},${tipY} ${leftX.toFixed(2)},${leftY.toFixed(2)} ${rightX.toFixed(2)},${rightY.toFixed(2)}`;
}

function Loop({ C, row }) {
  // Толщина дуг пропорциональна суммам, но капается небольшими значениями,
  // чтобы дуга не пожирала соседние боксы. Сами наконечники — статические
  // полигоны (см. arrowHeadPoints), их размер не зависит от stroke-width.
  const equityMax  = Math.max(...circular.circular.map((r) => r.equity));
  const revenueMax = Math.max(...circular.circular.map((r) => r.revenue));
  const equityW  = Math.max(2.4, (row.equity  / equityMax)  * 6);
  const revenueW = Math.max(2,   (row.revenue / revenueMax) * 5);

  // Геометрия дуг — фиксированная. Equity: верхняя дуга от правого края
  // box-инвестора (84,44) через контрольную точку (160,4) к точке у левого
  // края box-стартапа (226,44). Наконечник = треугольник в (226,44).
  const eqCtrl = { x: 160, y: 4   };
  const eqTip  = { x: 226, y: 44  };
  const rvCtrl = { x: 160, y: 106 };
  const rvTip  = { x: 94,  y: 66  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
      {/* Header row: investor → startup + circularity ratio */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: C.ink }}>{row.investor}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: C.inkFaint }}>{row.ticker}</span>
        <span style={{ color: C.inkFaint, fontSize: 12 }}>→</span>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 500, color: C.ink }}>{row.startup}</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFaint }}>Circularity</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: C.rose }}>{row.ratio}</span>
        </span>
      </div>

      {/* Loop SVG */}
      <svg viewBox="0 0 320 110" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 110, display: 'block' }}>
        {/* Investor box (left) */}
        <rect x="6" y="38" width="78" height="34" rx="6" fill={C.cardAlt} stroke={C.line} strokeWidth="1" />
        <text x="45" y="58" textAnchor="middle" fontFamily="var(--sans)" fontSize="11" fontWeight="600" fill={C.ink}>{row.ticker}</text>

        {/* Startup box (right) */}
        <rect x="236" y="38" width="78" height="34" rx="6" fill={C.cardAlt} stroke={C.line} strokeWidth="1" />
        <text x="275" y="58" textAnchor="middle" fontFamily="var(--sans)" fontSize="11" fontWeight="600" fill={C.ink}>{row.startup}</text>

        {/* Top arc: equity outbound (amber). Stop ~4px before the tip so the
            stroke's roundCap doesn't peek out beyond the arrow-head fill. */}
        <path d={`M 84 44 Q ${eqCtrl.x} ${eqCtrl.y}, ${eqTip.x - 4} ${eqTip.y - 2}`}
          fill="none" stroke={C.teal} strokeWidth={equityW} strokeOpacity="0.9" strokeLinecap="round" />
        <polygon points={arrowHeadPoints(eqCtrl.x, eqCtrl.y, eqTip.x, eqTip.y)} fill={C.teal} />
        <text x="160" y="14" textAnchor="middle" fontFamily="var(--mono)" fontSize="10.5" fill={C.teal} fontWeight="600">equity ${row.equity}B</text>

        {/* Bottom arc: revenue inbound (emerald). Same tip-shortening trick. */}
        <path d={`M 236 66 Q ${rvCtrl.x} ${rvCtrl.y}, ${rvTip.x + 4} ${rvTip.y + 2}`}
          fill="none" stroke={C.emerald} strokeWidth={revenueW} strokeOpacity="0.9" strokeLinecap="round" />
        <polygon points={arrowHeadPoints(rvCtrl.x, rvCtrl.y, rvTip.x, rvTip.y)} fill={C.emerald} />
        <text x="160" y="102" textAnchor="middle" fontFamily="var(--mono)" fontSize="10.5" fill={C.emerald} fontWeight="600">
          revenue ~${row.revenue}B / год
        </text>
      </svg>

      {/* Channel note */}
      <div style={{ marginTop: 8, fontSize: 11.5, color: C.inkSoft, fontStyle: 'italic', lineHeight: 1.5 }}>
        Канал: {row.channel}
      </div>
    </div>
  );
}

function CleanRow({ C, row }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderBottom: `1px solid ${C.lineSoft}` }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: C.ink, width: 60 }}>{row.ticker}</span>
      <span style={{ fontSize: 13, color: C.ink, width: 140 }}>{row.investor}</span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: C.inkSoft, width: 90 }}>${row.equity}B equity</span>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: C.emerald, width: 90 }}>{row.ratio}</span>
      <span style={{ flex: 1, fontSize: 11.5, color: C.inkSoft, fontStyle: 'italic' }}>{row.channel}</span>
    </div>
  );
}

export default function CircularBlock({ C, card, subLabel }) {
  return (
    <div>
      <div style={subLabel}>5 крупнейших циркулярных сделок · equity → compute revenue → обратно</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14 }}>
        {circular.circular.map((row, i) => <Loop key={i} C={C} row={row} />)}
      </div>

      {/* Annotation */}
      <div style={{
        marginTop: 22, padding: '12px 16px',
        background: C.cardAlt, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.rose}`,
        borderRadius: 8, fontSize: 12.5, color: C.ink, lineHeight: 1.55,
      }}>
        <span style={{ fontWeight: 600, color: C.rose }}>Размер equity-доли ≠ финансовый риск. </span>
        Microsoft, Amazon, Google, Nvidia возвращают инвестиции через cloud / chip revenue в течение 1–3 лет.
        Эти компании защищены даже при провале стартапа — реальный downside у них ниже headline-цифры. Поэтому для прокси-трейда они малопригодны.
      </div>

      {/* Clean proxies */}
      <div style={{ marginTop: 26 }}>
        <div style={subLabel}>Чистые прокси · circularity {'<'}10% — весь рост valuation остаётся в equity</div>
        <div style={{ ...card, padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: C.cardAlt, borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFaint, width: 60 }}>Ticker</span>
            <span style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFaint, width: 140 }}>Инвестор</span>
            <span style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFaint, width: 90 }}>Equity</span>
            <span style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFaint, width: 90 }}>Circularity</span>
            <span style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFaint, flex: 1 }}>Канал revenue back</span>
          </div>
          {circular.clean.map((row, i) => <CleanRow key={i} C={C} row={row} />)}
        </div>
      </div>

      {/* Implication */}
      <div style={{
        marginTop: 22, padding: '12px 16px',
        background: C.cardAlt, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.emerald}`,
        borderRadius: 8, fontSize: 12.5, color: C.ink, lineHeight: 1.55,
      }}>
        <span style={{ fontWeight: 600, color: C.emerald }}>Чистые прокси читаются чётче. </span>
        У Salesforce, Zoom и SK Telecom нет обратного денежного потока к Anthropic — поэтому весь рост valuation Anthropic транслируется в их equity. Это и плюс (clean signal), и минус (полная экспозиция на downside).
      </div>
    </div>
  );
}
