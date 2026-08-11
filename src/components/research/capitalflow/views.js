// Quick views — LENSES, not raw filter shortcuts. Each one is a mental model a
// sophisticated capital-flow watcher actually uses ("who's moving before the
// crowd", "what's quietly building"), not a blunt single-dimension threshold.
// Applying one REPLACES the current filters; clicking the active view clears
// back to everything.
//
// Nothing here invents data: every lens is a PREDICATE over fields the engine
// or classification.js already computed (playerRank/dealRank, fired signals +
// their entity_id/evidence, trend clusters) — never a hand-picked static
// number. That's what keeps them current for free: a predicate re-evaluates
// from the live payload on every load, so as flows rotate week to week the
// lens's membership rotates with it automatically. No separate schedule, no
// stale snapshot to refresh — the same reason classification.js needs none.
//
// A lens resolves to an explicit `nodeIds` seed (specific named entities) —
// existing filter dimensions (sector/class/tier) can't express "the targets
// behind this fired signal" or "this week's proven trend", only categories.

// Empty filter state — the shape every view fills in. `nodeIds: null` means
// "use the category dimensions below" (unset); a Set/array means "this exact
// set of entities IS the seed", overriding sector/class/tier/network entirely.
export const EMPTY_VIEW = {
  sectors: [], classes: [], tiers: [], families: [], statuses: [], networks: [],
  minAmount: 0, minConfidence: 0, sinceDays: 0, nodeIds: null,
};

// Collect entity_id values off every fired signal matching `rule`, across both
// sector and theme signal lists (a signal can appear in both dimensions).
function entityIdsForRule(graph, rule) {
  const ids = new Set();
  const scan = (obj) => Object.values(obj).forEach(g =>
    (g.signals || []).forEach(s => { if (s.rule === rule && s.entity_id) ids.add(s.entity_id); }));
  scan(graph.sectors); scan(graph.themes);
  return ids;
}

// Sectors where `rule` fired at least once — used when a rule has no single
// entity anchor (sector_swarm, smart_money_follow: the pattern is sector-wide,
// not one company).
function sectorsForRule(graph, rule) {
  const keys = new Set();
  Object.entries(graph.sectors).forEach(([key, g]) =>
    (g.signals || []).some(s => s.rule === rule) && keys.add(key));
  return keys;
}

export function buildViews(graph, { confidenceThreshold = 60 } = {}) {
  const nameToId = new Map(graph.nodes.map(n => [n.name, n.id]));
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const asArray = (set) => [...set];

  // 1 — smart money enters first: sectors where smart_money_follow fired,
  // narrowed to the core/key players actually in it plus the targets already
  // flagged/emerging there — not the whole sector.
  const smartSectors = sectorsForRule(graph, 'smart_money_follow');
  const smartMoneyIds = new Set(graph.nodes.filter(n =>
    smartSectors.has(n.sector) && (
      (n.type === 'player' && (n.playerRank === 'core' || n.playerRank === 'key')) ||
      (n.type === 'target' && (n.dealRank === 'flagged' || n.dealRank === 'emerging'))
    )).map(n => n.id));

  // 2 — building conviction: players repeatedly doubling down (classification
  // factor, always available regardless of whether repeat_conviction fired).
  const convictionIds = new Set(graph.nodes.filter(n =>
    n.type === 'player' && (n.playerParts?.repeat ?? 0) >= 0.5).map(n => n.id));

  // 3 — emerging: dealRank is already exactly this.
  const emergingIds = new Set(graph.nodes.filter(n => n.dealRank === 'emerging').map(n => n.id));

  // 4 — core only (narrower than the old "core+key" blend).
  const coreIds = new Set(graph.nodes.filter(n => n.playerRank === 'core').map(n => n.id));

  // 5 — stealth accumulation: the exact companies a fired signal named.
  const stealthIds = entityIdsForRule(graph, 'stealth_accumulation');

  // 6 — public read-through: the exact public tickers a fired signal named.
  const beneficiaryIds = entityIdsForRule(graph, 'beneficiary_concentration');

  // 7 — elite network convergence: members of a network whose sector just lit
  // up via network_convergence / defense_network_convergence.
  const networkSectors = new Set([
    ...sectorsForRule(graph, 'network_convergence'),
    ...sectorsForRule(graph, 'defense_network_convergence'),
  ]);
  const networkConvergeIds = new Set(graph.nodes.filter(n =>
    n.network && networkSectors.has(n.sector)).map(n => n.id));

  // 8 — trend of the week: the named allocators behind this window's top,
  // already-qualified clusters (resolved by name since evidence isn't
  // id-shaped yet — see CAPITAL-FLOW-TREND-NARRATIVE-FOLLOWUP.md).
  const weekTrends = graph.trends?.week || [];
  const trendIds = new Set(
    weekTrends.flatMap(t => (t.allocators || []).map(name => nameToId.get(name)).filter(Boolean))
  );

  const lens = (id, label, blurb, color, ids, extra = {}) => ({
    id, label, blurb: ids.size ? blurb : `Пока пусто в этой выгрузке — ${blurb[0].toLowerCase()}${blurb.slice(1)}`,
    color, disabled: ids.size === 0,
    state: { ...EMPTY_VIEW, nodeIds: asArray(ids), ...extra },
  });

  return [
    lens('smart-first', 'Лидеры зашли первыми',
      'Ключевые инвесторы вошли первыми в сектор — за ними быстро последовали другие.',
      '#FBBF24', smartMoneyIds),
    lens('conviction', 'Наращивают свои ставки',
      'Инвесторы, которые снова и снова докладывают в свои же ставки — не разовый чек.',
      '#F59E0B', convictionIds),
    lens('emerging', 'Ранние сделки',
      'Раннее и независимое схождение умных денег — ещё не консенсус.',
      '#5ACAD4', emergingIds),
    lens('core', 'Ключевые игроки',
      'Только «ядро»: определяющие узлы своей сети, самые повторные инвесторы.',
      '#F0505A', coreIds),
    lens('stealth', 'Тихо набирают долю',
      'Компании, куда повторные доли незаметно накапливаются, — ещё до того как это стало очевидно.',
      '#C084FC', stealthIds),
    lens('beneficiary', 'Публичные бенефициары',
      'Публичные тикеры, на которые указывают несколько частных потоков, — то, что реально можно купить.',
      '#82B98D', beneficiaryIds),
    lens('network', 'Связанные инвесторы',
      'Отслеживаемая сеть (PayPal Mafia, круг Тиля) сходится на одном секторе.',
      '#E8975E', networkConvergeIds),
    lens('trend', 'Главное за период',
      'Именные инвесторы за проверенными кластерами этого окна — самая синтезированная линза.',
      '#8E9BE6', trendIds, { sinceDays: 30 }),
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
    state.nodeIds ? s(state.nodeIds) : '',
  ].join('|');
}

// Flow-recency options for the drawer. Ages are measured against the payload's
// `generated` date, not today's — the file is a snapshot, and "last 14 days"
// has to mean 14 days of DATA, not 14 days of wall clock.
// Trailing-window options, aligned to the engine's view_defaults.windows
// ([7,30,90,null]). This is the map's recency control — it lives in the filter
// drawer; the map defaults to 30 days. 0 = all history.
export const RECENCY_OPTIONS = [
  { days: 7, label: '7 дн' },
  { days: 30, label: '30 дн' },
  { days: 90, label: '90 дн' },
  { days: 0, label: 'Всё' },
];

/** ISO date `generated` minus `days`, as an ISO string. Null when days ≤ 0. */
export function cutoffDate(generated, days) {
  if (!days || days <= 0) return null;
  const base = new Date(`${generated}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return null;
  base.setUTCDate(base.getUTCDate() - days);
  return base.toISOString().slice(0, 10);
}
