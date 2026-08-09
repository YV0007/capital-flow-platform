// Block 2 — Окно закрытия прокси-трейда.
// Горизонтальный timeline: для каждой компании — линия "дней до IPO" в
// масштабе общего горизонта 180 дней. Status pill справа: открыто / сужается
// / закрыто (emerald / gold / rose). Под каждой строкой — лучший прокси и
// краткий вердикт.

import windowData from '../../../data/proxy-window.json';

const STATUS_TONE = {
  open:      { label: 'Открыто',       bg: 'rgba(70,194,155,0.16)', fg: '#46C29B', border: 'rgba(70,194,155,0.4)' },
  narrowing: { label: 'Сужается',      bg: 'rgba(203,170,82,0.16)', fg: '#CBAA52', border: 'rgba(203,170,82,0.4)' },
  dead:      { label: 'Окно закрыто',  bg: 'rgba(239,111,111,0.14)', fg: '#EF6F6F', border: 'rgba(239,111,111,0.4)' },
};

const TRACK_TONE = {
  open:      '#46C29B',
  narrowing: '#CBAA52',
  dead:      '#EF6F6F',
};

function Row({ C, company, horizonDays }) {
  const tone = STATUS_TONE[company.status];
  const trackColor = TRACK_TONE[company.status];
  // ширина "съеденной" части = (horizon - days) / horizon. Чем ближе IPO,
  // тем сильнее заполнен трек.
  const consumedPct = Math.min(100, Math.max(0, ((horizonDays - company.daysToIpo) / horizonDays) * 100));

  return (
    <div style={{ marginBottom: 26, paddingBottom: 22, borderBottom: `1px solid ${C.lineSoft}` }}>
      {/* Top row: name + ticker + days + status pill */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: C.ink, letterSpacing: '-.01em' }}>{company.name}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.inkFaint, letterSpacing: '.06em' }}>{company.ticker}</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.inkSoft }}>
            <span style={{ color: C.ink, fontSize: 16, fontWeight: 500 }}>{company.daysToIpo}</span> {company.daysToIpo === 1 ? 'день' : company.daysToIpo < 5 ? 'дня' : 'дней'} до IPO
          </span>
          <span style={{
            padding: '3px 10px', borderRadius: 12,
            background: tone.bg, color: tone.fg,
            border: `1px solid ${tone.border}`,
            fontSize: 10.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase',
            fontFamily: 'var(--sans)',
          }}>{tone.label}</span>
        </span>
      </div>

      {/* Timeline track */}
      <div style={{ position: 'relative', height: 26, marginBottom: 12 }}>
        {/* Полный трек (горизонт) */}
        <div style={{ position: 'absolute', inset: 0, background: C.track, borderRadius: 6, border: `1px solid ${C.lineSoft}` }} />
        {/* "Съеденная" часть */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0,
          width: `${consumedPct}%`,
          background: `linear-gradient(90deg, color-mix(in srgb, ${trackColor} 13%, transparent) 0%, color-mix(in srgb, ${trackColor} 27%, transparent) 100%)`,
          borderRadius: '6px 0 0 6px',
        }} />
        {/* IPO маркер (точка на правом конце "съеденного") */}
        <div style={{
          position: 'absolute', top: '50%', left: `${consumedPct}%`,
          transform: 'translate(-50%,-50%)',
          width: 14, height: 14, borderRadius: '50%',
          background: trackColor, border: `2px solid ${C.paper}`,
          boxShadow: `0 0 0 1px ${trackColor}`,
        }} />
        {/* IPO дата под маркером */}
        <div style={{
          position: 'absolute', left: `${consumedPct}%`, top: '100%',
          transform: 'translate(-50%, 4px)', whiteSpace: 'nowrap',
          fontFamily: 'var(--mono)', fontSize: 10, color: trackColor, fontWeight: 600,
        }}>IPO · {company.ipoDate}</div>
        {/* Концевая метка справа: +180 дней */}
        <div style={{ position: 'absolute', right: 0, top: '100%', transform: 'translateY(4px)', fontFamily: 'var(--mono)', fontSize: 9.5, color: C.inkFaint }}>
          +{horizonDays}д
        </div>
        {/* Левая метка: Сегодня */}
        <div style={{ position: 'absolute', left: 0, top: '100%', transform: 'translateY(4px)', fontFamily: 'var(--mono)', fontSize: 9.5, color: C.inkFaint }}>
          Сегодня
        </div>
      </div>

      {/* Best proxy + verdict */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: C.inkFaint }}>Лучший прокси</div>
          <div style={{ fontSize: 13, color: C.ink, flex: 1, minWidth: 200 }}>{company.bestProxy}</div>
        </div>
        <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.55, fontStyle: 'italic' }}>{company.verdict}</div>
      </div>
    </div>
  );
}

export default function WindowBlock({ C, subLabel }) {
  return (
    <div>
      <div style={subLabel}>Горизонт {windowData.horizonDays} дней · окно дисконта по компаниям</div>
      <div>
        {windowData.companies.map((co) => (
          <Row key={co.id} C={C} company={co} horizonDays={windowData.horizonDays} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 18, fontSize: 11.5, color: C.inkSoft, flexWrap: 'wrap', marginTop: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: TRACK_TONE.open }} /> Открыто
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: TRACK_TONE.narrowing }} /> Сужается
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: TRACK_TONE.dead }} /> Закрыто
        </span>
      </div>
    </div>
  );
}
