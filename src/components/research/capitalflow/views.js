// Quick views — pre-made filter combinations, so the common questions are one
// click instead of six chips. Each view is just a full filter state; applying
// one REPLACES the current filters (no half-applied hybrids), and clicking the
// active view clears back to everything.
//
// Nothing here invents data: every view is expressed purely in the filter
// dimensions the payload already carries (class, tier, status, confidence,
// amount, date, signalling sector).

// Empty filter state — the shape every view fills in.
export const EMPTY_VIEW = {
  sectors: [], classes: [], tiers: [], families: [], statuses: [], networks: [],
  minAmount: 0, minConfidence: 0, sinceDays: 0,
};

// `litSectors` is passed in because which sectors are signalling changes with
// every engine delivery — the view stays data-driven rather than hard-coded.
export function buildViews({ litSectors = [], confidenceThreshold = 60 } = {}) {
  return [
    {
      id: 'fresh',
      label: 'Свежее',
      blurb: 'Всё, что движок собрал за последние 14 дней, — новые деньги этого цикла.',
      color: '#38BDF8',
      state: { ...EMPTY_VIEW, sinceDays: 14 },
    },
    {
      id: 'mega',
      label: 'Мега-чеки',
      blurb: 'Раскрытые потоки от $5 млрд — куда пошёл капитал масштаба целых балансов.',
      color: '#C2A36B',
      state: { ...EMPTY_VIEW, minAmount: 5e9 },
    },
    {
      id: 'sovereign',
      label: 'Госденьги',
      blurb: 'Только государственные фонды и программы — национальный капитал и кого он поддерживает.',
      color: '#49C2AE',
      state: { ...EMPTY_VIEW, classes: ['sovereign'] },
    },
    {
      id: 'smart',
      label: 'Умные деньги',
      blurb: 'Инвесторы уровней «ядро» и «ключ» — повторные игроки, за которыми идут остальные.',
      color: '#FBBF24',
      state: { ...EMPTY_VIEW, tiers: ['core', 'key'] },
    },
    {
      id: 'hard',
      label: 'Твёрдые факты',
      blurb: 'Только подтверждённые потоки уровня 1 с оценкой 85+. То, на что можно опираться без перепроверки.',
      color: '#34D399',
      state: { ...EMPTY_VIEW, statuses: ['verified'], minConfidence: 85 },
    },
    {
      id: 'signals',
      label: 'Секторы с сигналом',
      blurb: litSectors.length
        ? 'Секторы, где в этом цикле сработало правило, — собственная альфа движка.'
        : 'В этой выгрузке ни один сектор не сигналит.',
      color: '#F59E0B',
      disabled: litSectors.length === 0,
      state: { ...EMPTY_VIEW, sectors: [...litSectors] },
    },
    {
      id: 'private',
      label: 'Частные раунды',
      blurb: 'Доли и раунды в частные компании — венчурный слой без инфраструктуры.',
      color: '#9D8FD8',
      state: { ...EMPTY_VIEW, classes: ['private'], families: ['equity'] },
    },
    {
      id: 'buildout',
      label: 'Физическая стройка',
      blurb: 'Проектное финансирование дата-центров, станций и фабрик — capex, который придётся залить в бетон.',
      color: '#C99B72',
      state: { ...EMPTY_VIEW, classes: ['project'], families: ['debt'] },
    },
  ];
}

// Canonical serialisation, so "is this view active?" is an exact comparison of
// the live filter state rather than a flag that can drift out of sync.
export function viewKey(state) {
  const s = (arr) => [...(arr || [])].sort().join(',');
  return [
    s(state.sectors), s(state.classes), s(state.tiers),
    s(state.families), s(state.statuses), s(state.networks),
    state.minAmount || 0, state.minConfidence || 0, state.sinceDays || 0,
  ].join('|');
}

// Flow-recency options for the drawer. Ages are measured against the payload's
// `generated` date, not today's — the file is a snapshot, and "last 14 days"
// has to mean 14 days of DATA, not 14 days of wall clock.
export const RECENCY_OPTIONS = [
  { days: 0, label: 'Все' },
  { days: 7, label: '7 дн' },
  { days: 14, label: '14 дн' },
  { days: 30, label: '30 дн' },
  { days: 90, label: '90 дн' },
];

/** ISO date `generated` minus `days`, as an ISO string. Null when days ≤ 0. */
export function cutoffDate(generated, days) {
  if (!days || days <= 0) return null;
  const base = new Date(`${generated}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return null;
  base.setUTCDate(base.getUTCDate() - days);
  return base.toISOString().slice(0, 10);
}
