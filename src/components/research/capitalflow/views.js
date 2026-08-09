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
      label: 'Fresh batch',
      blurb: 'Everything the engine has picked up in the last 14 days — this cycle\'s new money.',
      color: '#38BDF8',
      state: { ...EMPTY_VIEW, sinceDays: 14 },
    },
    {
      id: 'mega',
      label: 'Mega tickets',
      blurb: 'Disclosed flows of $5B and up — where the balance-sheet-scale capital went.',
      color: '#C2A36B',
      state: { ...EMPTY_VIEW, minAmount: 5e9 },
    },
    {
      id: 'sovereign',
      label: 'Sovereign money',
      blurb: 'State funds and government programmes only — national capital and who it backs.',
      color: '#49C2AE',
      state: { ...EMPTY_VIEW, classes: ['sovereign'] },
    },
    {
      id: 'smart',
      label: 'Smart money',
      blurb: 'Core and key-tier allocators — the repeat deciders whose moves lead the rest.',
      color: '#FBBF24',
      state: { ...EMPTY_VIEW, tiers: ['core', 'key'] },
    },
    {
      id: 'hard',
      label: 'Hard evidence',
      blurb: 'Tier-1 verified flows scoring 85+ only. The subset you could act on without re-checking.',
      color: '#34D399',
      state: { ...EMPTY_VIEW, statuses: ['verified'], minConfidence: 85 },
    },
    {
      id: 'signals',
      label: 'Signal sectors',
      blurb: litSectors.length
        ? 'The sectors with a signal rule firing this cycle — the engine\'s own alpha.'
        : 'No sector is signalling in this delivery.',
      color: '#F59E0B',
      disabled: litSectors.length === 0,
      state: { ...EMPTY_VIEW, sectors: [...litSectors] },
    },
    {
      id: 'private',
      label: 'Private rounds',
      blurb: 'Equity and funding rounds into private companies — the venture layer, minus infrastructure.',
      color: '#9D8FD8',
      state: { ...EMPTY_VIEW, classes: ['private'], families: ['equity'] },
    },
    {
      id: 'buildout',
      label: 'Physical buildout',
      blurb: 'Project finance behind data centers, plants and fabs — the capex that has to be poured.',
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
  { days: 0, label: 'All' },
  { days: 7, label: '7d' },
  { days: 14, label: '14d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
];

/** ISO date `generated` minus `days`, as an ISO string. Null when days ≤ 0. */
export function cutoffDate(generated, days) {
  if (!days || days <= 0) return null;
  const base = new Date(`${generated}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return null;
  base.setUTCDate(base.getUTCDate() - days);
  return base.toISOString().slice(0, 10);
}
