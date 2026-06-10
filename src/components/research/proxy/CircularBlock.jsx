// Block 6 — Круговые сделки.
// Visualization: для каждой пары (инвестор, AI-стартап) рисуем кастомный
// SVG loop. Верхняя дуга — equity outbound (amber); нижняя дуга — compute
// revenue inbound (emerald). Толщина обеих дуг пропорциональна сумме,
// благодаря чему "почти 100%" сразу читается визуально. Отдельная панель
// показывает "чистые" прокси (CRM, ZM, SKM), где revenue-loop отсутствует.

import circular from '../../../data/proxy-circular.json';

function Loop({ C, row }) {
  // Толщина дуг пропорциональна суммам, нормирована к 24px max.
  const equityMax  = Math.max(...circular.circular.map((r) => r.equity));
  const revenueMax = Math.max(...circular.circular.map((r) => r.revenue));
  const equityW  = Math.max(4, (row.equity  / equityMax)  * 20);
  const revenueW = Math.max(3, (row.revenue / revenueMax) * 18);

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
        <defs>
          <marker id={`arrow-eq-${row.investor}-${row.startup}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill={C.teal} />
          </marker>
          <marker id={`arrow-rv-${row.investor}-${row.startup}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill={C.emerald} />
          </marker>
        </defs>

        {/* Investor box (left) */}
        <rect x="6" y="38" width="78" height="34" rx="6" fill={C.cardAlt} stroke={C.line} strokeWidth="1" />
        <text x="45" y="58" textAnchor="middle" fontFamily="var(--sans)" fontSize="11" fontWeight="600" fill={C.ink}>{row.ticker}</text>

        {/* Startup box (right) */}
        <rect x="236" y="38" width="78" height="34" rx="6" fill={C.cardAlt} stroke={C.line} strokeWidth="1" />
        <text x="275" y="58" textAnchor="middle" fontFamily="var(--sans)" fontSize="11" fontWeight="600" fill={C.ink}>{row.startup}</text>

        {/* Top arc: equity outbound (amber) */}
        <path d="M 84 44 Q 160 4, 236 44" fill="none" stroke={C.teal} strokeWidth={equityW} strokeOpacity="0.85" strokeLinecap="round" markerEnd={`url(#arrow-eq-${row.investor}-${row.startup})`} />
        <text x="160" y="14" textAnchor="middle" fontFamily="var(--mono)" fontSize="10.5" fill={C.teal} fontWeight="600">equity ${row.equity}B</text>

        {/* Bottom arc: revenue inbound (emerald) */}
        <path d="M 236 66 Q 160 106, 84 66" fill="none" stroke={C.emerald} strokeWidth={revenueW} strokeOpacity="0.85" strokeLinecap="round" markerEnd={`url(#arrow-rv-${row.investor}-${row.startup})`} />
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
