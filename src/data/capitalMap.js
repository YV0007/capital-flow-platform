// ══════════════════════════════════════════════════════════════════════════
// CAPITAL FLOW MAP — data adapter
//
// The Capital Flow *engine* (a separate repo) sweeps SEC filings / official
// PRs / VC press every cycle, verifies real capital-allocation events, runs
// signal rules, and exports ONE file: capital_map.json. That file — dropped
// into ./capitalMap.json — is the ONLY contract between the engine and this
// dashboard.
//
//   engine (agents → verify → SQLite → signal rules) → capitalMap.json → here
//
// This module imports that file and reshapes it into the graph the Capital
// Flow Map components render. NOTHING is hard-coded: swap in next week's file
// and the map changes with no code edit. We have ZERO data latitude — we never
// invent entities/flows/amounts or override a status; we only style what the
// file says.
//
// CONTRACT (capital_map.json)
//   generated                          ISO date the file was produced
//   totals { nodes, flows, sectors }
//   nodes[] { id, label, kind, cls, tier, sector, deals, capital,
//             first_seen, last_activity, stale }
//   flows[] { source, target, sector, event_type, amount, status, date, tier }
//   sectors{ <key>: { deals, capital, allocators, signals[] } }
// ══════════════════════════════════════════════════════════════════════════

import delivery from './capitalMap.json';
import archive from './capitalMap.archive.json';
import entityRef from './entityReference.json';
import logoManifest from './logoManifest.json';
import flowNotes from './flowNotes.json';

// ══════════════════════════════════════════════════════════════════════════
// STOPGAP: cumulative merge (dashboard-side, TEMPORARY)
//
// The engine used to ship the cumulative "memory" map every cycle. As of the
// 2026-W33 delivery it began shipping only that WEEK'S DELTA — 26 flows, none
// of which overlapped the prior 128 — so the map collapsed from 147 nodes to
// 36. Until cumulative delivery is restored engine-side, we union an archived
// snapshot of the last cumulative map with each new delivery so the graph does
// not lose its history.
//
// Rules (deliberately simple — the real expiry/appearance policy is TBD):
//   · flows  — unioned by (source→target · date · event_type); a flow present
//              in both keeps the CURRENT record.
//   · nodes  — unioned by id; for a shared id we keep whichever record carries
//              the larger tracked capital, so a cumulative node is never shrunk
//              to its one-week delta.
//   · cycle-level blocks (generated, totals, aggregates, audit, sectors,
//              themes, confidence_threshold) come from the CURRENT delivery as
//              is — "this cycle" must mean this cycle.
//
// To ROLL FORWARD before the next delivery, fold the current delivery into the
// archive (union) so nothing is lost; or, once the engine ships cumulative
// again, delete this block, the archive file and the two imports above.
// ══════════════════════════════════════════════════════════════════════════
function mergeDeliveries(prev, cur) {
  if (!prev || !Array.isArray(prev.nodes) || !Array.isArray(prev.flows)) return cur;
  const flowKey = (f) => `${f.source}=>${f.target}@${f.date}#${f.event_type}`;

  const nodes = new Map();
  (prev.nodes || []).forEach(n => nodes.set(n.id, n));
  (cur.nodes || []).forEach(n => {
    const old = nodes.get(n.id);
    if (!old) { nodes.set(n.id, n); return; }
    // Merge fields, but let the record with the larger capital win on conflict
    // so a cumulative node never shrinks to its weekly delta.
    nodes.set(n.id, (n.capital || 0) >= (old.capital || 0) ? { ...old, ...n } : { ...n, ...old });
  });

  const flows = new Map();
  (prev.flows || []).forEach(f => flows.set(flowKey(f), f));
  (cur.flows || []).forEach(f => flows.set(flowKey(f), f));   // current wins on dup

  // `allocators` is ENTITY-canonical (per-allocator profile + track record),
  // not a cycle aggregate — so it must be UNIONED, not replaced, or a merged
  // node whose profile only lived in the archive would lose its deep-dive.
  // Current wins per key. Cycle-level blocks (aggregates/audit/sectors/themes/
  // totals) stay `cur`'s on purpose — "this cycle" means this cycle.
  const allocators = { ...(prev.allocators || {}), ...(cur.allocators || {}) };

  return { ...cur, allocators, nodes: [...nodes.values()], flows: [...flows.values()] };
}

// Everything downstream reads `raw`. It is the merged map; META/AGGREGATES/
// AUDIT below still pull the CYCLE-level blocks straight from `delivery`.
const raw = mergeDeliveries(archive, delivery);

// ── Sector cluster zones. `order` walks the AI value chain — software →
// compute → chips → cloud → datacenters → power → physical/defense — so the
// ring reads intuitively. Palette is brighter/more saturated, short of neon.
// Monochromatic COOL palette — one family (blue · indigo · cyan · teal ·
// slate). Sectors are told apart by brightness/saturation, not rainbow hue,
// so the map reads calm and institutional rather than candy-bright.
//
// Keys mirror `config/rules.yaml § sectors` in the engine repo — that list is
// the canonical taxonomy; this map only adds a display label, a colour and a
// one-line "what this bucket is". `blurb` is rendered in the cluster report so
// a sector name never has to be guessed at from a slug.
export const SECTOR_META = {
  'ai-labs':            { label: 'AI-лаборатории',     color: '#8E9BE6', order: 0,
                          blurb: 'Разработчики передовых моделей — лаборатории, обучающие крупнейшие модели.' },
  'ai-applications':    { label: 'AI-приложения',      color: '#9DB6EA', order: 1,
                          blurb: 'Прикладной слой — отраслевой и корпоративный софт, построенный поверх моделей.' },
  'ai-data':            { label: 'Платформы данных',   color: '#6F93DE', order: 2,
                          blurb: 'Платформы данных и разметка, которые кормят модели, — цепочка поставки обучающих данных.' },
  'ai-compute':         { label: 'AI-вычисления',      color: '#5A93DE', order: 3,
                          blurb: 'GPU и специализированные ускорители — вычисления, на которых работают модели.' },
  'semiconductors':     { label: 'Полупроводники',     color: '#7079DE', order: 4,
                          blurb: 'Чипы в широком смысле и мощности контрактных фабрик за спиной ускорителей.' },
  'fab-equipment':      { label: 'Оборудование для чипов', color: '#93A0BC', order: 5,
                          blurb: 'Литография, травление, напыление и корпусирование — то, чем строят фабрики.' },
  'cloud-hyperscale':   { label: 'Облака',             color: '#4FA6E0', order: 6,
                          blurb: 'Вычислительные мощности гиперскейлеров, продаваемые как облако.' },
  'neocloud':           { label: 'GPU-облака',         color: '#45C0D0', order: 7,
                          blurb: '«Арендодатели GPU» — вычисления в аренду по часам, часто на деньги вендоров.' },
  'datacenters':        { label: 'Дата-центры',        color: '#6389C4', order: 8,
                          blurb: 'Физические здания и кампусы: земля, корпуса, операторы.' },
  'networking':         { label: 'Сети',               color: '#58ABCB', order: 9,
                          blurb: 'Оптические соединения и фотоника — перенос данных между чипами.' },
  'power-energy':       { label: 'Энергетика',         color: '#49C2AE', order: 10,
                          blurb: 'Турбины, сетевое оборудование и охлаждение — электричество для всей стройки.' },
  'nuclear':            { label: 'Атомная энергетика', color: '#5ACAD4', order: 11,
                          blurb: 'Малые реакторы, термояд и уран — длинная ставка на энергию.' },
  'robotics':           { label: 'Робототехника',      color: '#8088D6', order: 12,
                          blurb: 'AI в физическом мире — гуманоиды, автономность, роботы.' },
  'defense-tech':       { label: 'Оборонные технологии', color: '#6E7E9A', order: 13,
                          blurb: 'Оборонка в обход традиционных генподрядчиков.' },
  // ── Outside the AI buildout. Sovereigns and alt managers allocate here too
  // and it is real capital, so it is tracked — held in quieter slate tones so
  // the ring still reads as "AI stack first".
  'gaming':             { label: 'Игры',               color: '#8A8FA6', order: 14,
                          blurb: 'Игры и интерактивные развлечения. Вне AI-тематики.' },
  'ev-automotive':      { label: 'Электромобили',      color: '#7F93A8', order: 15,
                          blurb: 'Производители электромобилей и автопром. Вне AI-тематики.' },
  'private-credit':     { label: 'Частный кредит',     color: '#8F98A8', order: 16,
                          blurb: 'Прямое кредитование и кредитные платформы. Вне AI-тематики.' },
  'diversified-pe':     { label: 'Private equity',     color: '#98A0AE', order: 17,
                          blurb: 'Классический private equity и стратегические доли без единого сектора. Вне AI-тематики.' },
};

/**
 * Display label for a sector key. Falls back to a de-slugged title case, so a
 * sector the engine adds before this file knows about it renders as
 * "Space Infrastructure", never "SPACE-INFRASTRUCTURE".
 */
export function sectorLabel(key) {
  if (!key) return 'Без сектора';
  const m = SECTOR_META[key];
  if (m) return m.label;
  return String(key)
    .split(/[-_]/)
    .map(w => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

// ── Entity class — allocator classes deploy capital, target classes receive
// it. Drives node colour (allocators), on-canvas block shape, and the class
// filter. `side` = which band the node lives in (source vs sink).
export const CLASS_META = {
  // allocators (deploy) — cool monochromatic family
  corporate:    { label: 'Корпорация',       zone: 'Корпорации', money: 'корпоративные деньги',
                  color: '#5AA9CF', shape: 'capsule', side: 'allocator',
                  blurb: 'Операционные компании, инвестирующие с собственного баланса, — стратегия важнее финансовой доходности.' },
  vc:           { label: 'Венчурный фонд',   zone: 'Венчурные фонды', money: 'венчурные деньги',
                  color: '#8E9BE6', shape: 'capsule', side: 'allocator',
                  blurb: 'Венчурные фонды и фонды роста, вкладывающие деньги LP в частные раунды.' },
  alt_manager:  { label: 'Управляющий активами', zone: 'Управляющие активами', money: 'деньги управляющих активами',
                  color: '#93A0BC', shape: 'capsule', side: 'allocator',
                  blurb: 'Private-equity, инфраструктурные и кредитные управляющие — самые крупные разовые чеки, в основном в реальные активы.' },
  sovereign:    { label: 'Госфонд',          zone: 'Госфонды', money: 'государственные деньги',
                  color: '#49C2AE', shape: 'capsule', side: 'allocator',
                  blurb: 'Государственные фонды и программы. Длинный горизонт, политические мотивы, нечувствительность к цене.' },
  individual:   { label: 'Частное лицо',     zone: 'Частные лица', money: 'личные деньги',
                  color: '#9A8FD2', shape: 'capsule', side: 'allocator',
                  blurb: 'Конкретные люди, инвестирующие лично, — чеки небольшие, но сигнал сильный.' },
  // targets (receive)
  private:      { label: 'Частная компания', zone: 'Частные компании',
                  color: '#9D8FD8', shape: 'company', side: 'target',
                  blurb: 'Операционные компании, пока не вышедшие на биржу.' },
  public:       { label: 'Публичная компания', zone: 'Публичные компании',
                  color: '#62B5CC', shape: 'company', side: 'target',
                  blurb: 'Компании на бирже — вывод, который можно отыграть покупкой акций.' },
  fund:         { label: 'Фонд',             zone: 'Фонды',
                  color: '#C9985F', shape: 'capsule', side: 'target',
                  blurb: 'Фонды и SPV, привлекающие капитал, — не операционный бизнес.' },
  project:      { label: 'Проект',           zone: 'Проекты',
                  color: '#C99B72', shape: 'asset',   side: 'target',
                  blurb: 'Именованные стройки и программы, а не компании.' },
  asset:        { label: 'Актив',            zone: 'Активы',
                  color: '#98A2AE', shape: 'asset',   side: 'target',
                  blurb: 'Физические активы, меняющие владельца.' },
};

// ── Event type → edge family + colour. One colour per family; drives edge
// colour, the legend, and the event-type filter.
export const EVENT_TYPE_META = {
  equity:               { label: 'Доля',              family: 'equity',      color: '#7C8FD0' },
  minority_stake:       { label: 'Миноритарная доля', family: 'equity',      color: '#7C8FD0' },
  funding_round:        { label: 'Раунд',             family: 'equity',      color: '#7C8FD0' },
  corporate_investment: { label: 'Корп. инвестиция',  family: 'equity',      color: '#7C8FD0' },
  follow_on:            { label: 'Повторный чек',     family: 'equity',      color: '#7C8FD0' },
  project_finance:      { label: 'Проектное финансирование', family: 'debt',        color: '#8496B4' },
  acquisition:          { label: 'Поглощение',        family: 'acquisition', color: '#9A88C0' },
  fund_launch:          { label: 'Запуск фонда',      family: 'fund',        color: '#5FB0A8' },
  spv:                  { label: 'SPV',               family: 'fund',        color: '#5FB0A8' },
  grant:                { label: 'Грант',             family: 'grant',       color: '#8391A8' },
  sovereign_investment: { label: 'Госинвестиция',     family: 'sovereign',   color: '#6C9ACB' },
};

// The distinct families, for a compact legend (colour is shared within a family).
export const FAMILY_META = {
  equity:      { label: 'Доли и раунды',      color: '#7C8FD0' },
  debt:        { label: 'Проектное финансирование', color: '#8496B4' },
  acquisition: { label: 'Поглощения',         color: '#9A88C0' },
  fund:        { label: 'Фонды и SPV',        color: '#5FB0A8' },
  grant:       { label: 'Гранты',             color: '#8391A8' },
  sovereign:   { label: 'Госкапитал',         color: '#6C9ACB' },
};

// ── Confidence — the engine's `status`. Drives edge dashing + the chip.
// verified = Tier-1 confirmed (solid, strongest) · verified_alpha = strong,
// no primary source yet (short dash) · candidate = a lead (long dash).
export const STATUS_META = {
  verified:       { label: 'Подтверждено',   short: 'ПОДТВ.',   color: '#34D399', dash: null,     blurb: 'Подтверждено первоисточником (уровень 1).' },
  verified_alpha: { label: 'Подтверждено α', short: 'АЛЬФА',    color: '#FBBF24', dash: [7, 4],   blurb: 'Сильный сигнал, но первоисточник его пока не подтвердил.' },
  candidate:      { label: 'Кандидат',       short: 'КАНДИДАТ', color: '#94A3B8', dash: [2, 5],   blurb: 'Неподтверждённая наводка. По умолчанию скрыта с основной карты.' },
};

// ── Allocator tier — importance weighting from the engine.
export const TIER_META = {
  core:  { short: 'ЯДРО',  stars: '★★★★', label: 'Основной инвестор', color: '#FDE047',
           blurb: 'Определяющий узел своей сети — инвесторы с самой глубокой убеждённостью, ставящие снова и снова.' },
  key:   { short: 'КЛЮЧ',  stars: '★★★',  label: 'Ключевой инвестор', color: '#FBBF24',
           blurb: 'Решает, куда пойдут миллиарды. Лучший предиктор того, куда капитал двинется дальше.' },
  watch: { short: 'НАБЛ.', stars: '★★',   label: 'Под наблюдением', color: '#C084FC',
           blurb: 'В отслеживаемой вселенной; инвестор второго эшелона.' },
};

// Source-tier (1..5) of a flow — 1 = SEC/official filing.
export const SOURCE_TIER_LABEL = {
  1: 'Уровень 1 · SEC / официальный документ',
  2: 'Уровень 2 · пресс-релиз компании',
  3: 'Уровень 3 · авторитетная пресса',
  4: 'Уровень 4 · вторичная пресса',
  5: 'Уровень 5 · единственный источник',
};

// ── Confidence grade (Admiralty-style): letter = source reliability, digit =
// information credibility. Used for tooltips + the legend key.
export const GRADE_LETTER = {
  A: 'Первоисточник (SEC, IR, госорганы)',
  B: 'Ведущая платформа данных',
  C: 'Качественная пресса',
  D: 'Отраслевой аналитик',
  E: 'Соцсети / слухи',
};
export const GRADE_DIGIT = {
  1: 'Подтверждено первоисточником',
  2: 'Сходятся два и более независимых источника',
  3: 'Один надёжный источник',
  4: 'Без подтверждения',
  5: 'Сомнительно',
};
export function gradeBlurb(grade) {
  if (!grade || grade.length < 2) return '';
  return `${GRADE_LETTER[grade[0]] || grade[0]} · ${GRADE_DIGIT[grade[1]] || grade[1]}`;
}

// Confidence band — plain-English label for the 0-100 score, so a number is
// never shown on its own.
export function confidenceBand(c) {
  if (c == null) return { label: 'Не оценено', color: '#94A3B8' };
  if (c >= 85) return { label: 'Высокая надёжность', color: '#34D399' };
  if (c >= 60) return { label: 'Хорошая надёжность', color: '#FBBF24' };
  if (c >= 40) return { label: 'Слабая надёжность', color: '#94A3B8' };
  return { label: 'Низкая надёжность', color: '#8b8b95' };
}

// ── Deal context ────────────────────────────────────────────────────────
// The engine ships facts, never interpretation. `flowNotes.json` is where the
// interpretation lives (hand-written, dashboard-side). Anything the file
// doesn't cover falls back to a composed line built strictly from what we
// already know about the two entities — no invented facts.
// Resolution order: a read the ENGINE wrote at research time wins (the research
// agents know the deal best and cover every new flow), then the hand-written
// dashboard file, then null -> composeRead().
export function flowNote(flow) {
  if (flow.read) return { angle: flow.angle || null, read: flow.read, from: 'engine' };
  const n = flowNotes[`${flow.source}=>${flow.target}`];
  return n ? { ...n, from: 'dashboard' } : null;
}

export function composeRead(flow, srcNode, tgtNode) {
  const src = srcNode?.name || String(flow.sourceId || '').replace(/^alloc:/, '');
  const tgt = tgtNode?.name || String(flow.targetId || '').replace(/^target:/, '');
  const et = EVENT_TYPE_META[flow.event_type];
  const sec = flow.sector ? SECTOR_META[flow.sector] : null;
  const what = tgtNode?.description ? ` ${tgtNode.description}` : '';
  const where = sec ? ` Сектор — «${sec.label}».` : '';
  return `${src} — ${(et?.label || flow.event_type || 'поток').toLowerCase()} в ${tgt}.${what}${where}`
    + ' Письменного разбора этой сделки пока нет.';
}

// ── Themes — a SECOND dimension, orthogonal to sectors (which narrative a
// deal belongs to). 10 canonical themes. Flows don't carry a theme, so a
// target's theme is derived from its sector (SECTOR_TO_THEME below).
export const THEME_META = {
  frontier_ai:         { label: 'Передовой AI',       color: '#8E9BE6', order: 0 },
  ai_infrastructure:   { label: 'AI-инфраструктура',  color: '#5A93DE', order: 1 },
  ai_applications:     { label: 'AI-приложения',      color: '#9DB6EA', order: 2 },
  energy_for_ai:       { label: 'Энергия для AI',     color: '#49C2AE', order: 3 },
  defense_ai:          { label: 'Оборонный AI',       color: '#6E7E9A', order: 4 },
  robotics_embodiment: { label: 'Робототехника',      color: '#8088D6', order: 5 },
  sovereign_ai:        { label: 'Государственный AI', color: '#58ABCB', order: 6 },
  biotech_ai:          { label: 'Биотех и AI',        color: '#5FB0A8', order: 7 },
  space:               { label: 'Космос',             color: '#7079DE', order: 8 },
  crypto_ai:           { label: 'Крипто и AI',        color: '#45C0D0', order: 9 },
};

export const SECTOR_TO_THEME = {
  'ai-labs': 'frontier_ai',
  'datacenters': 'ai_infrastructure', 'ai-compute': 'ai_infrastructure',
  'semiconductors': 'ai_infrastructure', 'neocloud': 'ai_infrastructure',
  'networking': 'ai_infrastructure', 'cloud-hyperscale': 'ai_infrastructure',
  'fab-equipment': 'ai_infrastructure',
  'power-energy': 'energy_for_ai', 'nuclear': 'energy_for_ai',
  'robotics': 'robotics_embodiment',
  'defense-tech': 'defense_ai',
  'ai-applications': 'ai_applications', 'ai-data': 'ai_applications',
  // gaming · ev-automotive · private-credit · diversified-pe sit outside the AI
  // buildout and deliberately carry no theme.
};

// ── Display names for the ISO-2 country codes the engine emits. Presentation
// only — the code itself is the payload's, and an unmapped code falls back to
// the uppercase code rather than being guessed at.
export const COUNTRY_NAMES = {
  us: 'США', ca: 'Канада', gb: 'Великобритания', ae: 'ОАЭ',
  sa: 'Саудовская Аравия', qa: 'Катар', kw: 'Кувейт', kr: 'Южная Корея', jp: 'Япония',
  cn: 'Китай', tw: 'Тайвань', sg: 'Сингапур', in: 'Индия', il: 'Израиль',
  de: 'Германия', fr: 'Франция', nl: 'Нидерланды', ch: 'Швейцария',
  se: 'Швеция', no: 'Норвегия', au: 'Австралия',
};

// ── Elite networks an individual allocator can belong to. Warm accents so a
// networked node pops against the cool palette.
export const NETWORK_META = {
  paypal_mafia:     { label: 'PayPal Mafia',      color: '#F5B942' },
  thiel_extended:   { label: 'Круг Тиля',         color: '#E8975E' },
  thiel_fellowship: { label: 'Thiel Fellowship',  color: '#D98CA8' },
};

// ── Signal rule labels — rendered so users know WHY a group lit up.
export const RULE_META = {
  sector_swarm:                { label: 'Наплыв в сектор',     blurb: 'Несколько ключевых инвесторов вошли в один сектор за короткое окно.' },
  theme_swarm:                 { label: 'Наплыв в тему',       blurb: 'Ключевые инвесторы сошлись на одном сквозном нарративе.' },
  smart_money_follow:          { label: 'Умные деньги ведут',  blurb: 'Ключевой инвестор вошёл первым; за ним быстро последовали другие.' },
  beneficiary_concentration:   { label: 'Бенефициар',          blurb: 'Несколько частных потоков указывают на один публичный тикер — вывод, который можно отыграть.' },
  stealth_accumulation:        { label: 'Тихое накопление',    blurb: 'Повторные доли незаметно накапливаются в одной компании.' },
  repeat_conviction:           { label: 'Повторная ставка',    blurb: 'Одна и та же сеть снова и снова поддерживает одну компанию.' },
  network_convergence:         { label: 'Схождение сети',      blurb: 'Отслеживаемая сеть сходится на одной компании.' },
  defense_network_convergence: { label: 'Оборонное схождение', blurb: 'Сеть, связанная с обороной, сходится на одной цели.' },
};

export const META = {
  // `generated`/`confidence_threshold` are the CURRENT cycle's (delivery-level);
  // `totals` counts the MERGED map so the header matches what is on screen.
  generated: delivery.generated,
  confidenceThreshold: typeof delivery.confidence_threshold === 'number' ? delivery.confidence_threshold : 60,
  totals: { nodes: (raw.nodes || []).length, flows: (raw.flows || []).length, sectors: Object.keys(raw.sectors || {}).length },
};

// ── Payload-level blocks the engine owns outright. Rendered as-is; the `basis`
// strings explain how each number was derived and must never be recomputed or
// paraphrased dashboard-side.
export const AGGREGATES = raw.aggregates || null;   // top_sector · top_company · thesis_shares

// The engine's `basis` strings are shipped verbatim and never paraphrased.
// Known ones get a faithful Russian rendering; anything unknown falls back to
// the engine's own wording, so a new basis is never silently mistranslated.
const BASIS_RU = {
  'confirmed events (verified/verified_alpha), capital-weighted; undisclosed amounts count as 0':
    'подтверждённые события (verified/verified_alpha), взвешено по капиталу; нераскрытые суммы считаются как 0',
  'confirmed events; ranked by distinct tracked allocators, then capital behind the target':
    'подтверждённые события; ранжировано по числу уникальных инвесторов, затем по капиталу за компанией',
  'share of confirmed events per canonical theme (the stated rationale dimension of config/rules.yaml); by_capital ignores undisclosed amounts':
    'доля подтверждённых событий по каноническим темам; расчёт по капиталу игнорирует нераскрытые суммы',
};
export function basisLabel(basis) {
  if (!basis) return null;
  return BASIS_RU[basis] || basis;
}
export const AUDIT = raw.audit || null;             // the engine's verdict on this delivery

// ── Track-record metric names → display labels. Presentation only; an unknown
// metric falls back to its own key de-snaked rather than being dropped.
export const METRIC_LABEL = {
  stock_total_return_pct: 'Полная доходность акции',
  fund_irr_pct: 'IRR фонда',
  fund_net_return_pct: 'Чистая доходность фонда',
  fund_gross_return_pct: 'Валовая доходность фонда',
  reported_return_pct: 'Заявленная доходность',
  aum_usd_bn: 'Активы под управлением',
};
export function metricLabel(key) {
  return METRIC_LABEL[key] || String(key || '').replace(/_/g, ' ').replace(/\bpct\b/, '').trim() || 'Метрика';
}

/** A track-record row's value rendered with its unit. Never guesses a unit. */
export function formatTrackValue(row) {
  if (row == null || typeof row.value !== 'number') return null;
  if (row.unit === 'pct') return `${row.value > 0 ? '+' : ''}${row.value}%`;
  if (row.unit === 'usd_bn') return fmtCompactUSD(row.value * 1e9);
  return `${row.value}${row.unit ? ` ${row.unit}` : ''}`;
}

// Local compact USD so the adapter stays free of component imports.
function fmtCompactUSD(v) {
  const a = Math.abs(v);
  if (a >= 1e12) return `$${(v / 1e12).toFixed(2)} трлн`;
  if (a >= 1e9) return `$${(v / 1e9).toFixed(1)} млрд`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(0)} млн`;
  return `$${v}`;
}

export const DISCLAIMER =
  'Сформировано движком Capital Flow на основе публичных отчётностей, официальных релизов и прессы. ' +
  'Статусы (подтверждено / подтверждено α / кандидат) — собственные оценки движка, отображаются как есть и никогда не переопределяются. ' +
  'Суммы — как раскрыто; у части потоков сумма не раскрыта. Не является инвестиционной рекомендацией.';

// Root domain from a URL (drops www.), or null if unparseable.
function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
}

// Handle from an x.com / twitter URL (…/JeffBezos → "JeffBezos").
function xHandle(url) {
  try { return new URL(url).pathname.replace(/^\/+/, '').split('/')[0] || null; } catch { return null; }
}

// Ordered logo candidates: real company logo / founder photo first, favicon
// as a fallback. `fallback=false` makes unavatar 404 on a miss so we can fall
// through to the next candidate (and ultimately the monogram tile).
function buildLogoUrls(links = []) {
  const out = [];
  const push = (u) => { if (u && !out.includes(u)) out.push(u); };
  const website = links.find(l => l.kind === 'website');
  const xl = links.find(l => l.kind === 'x');
  const firm = links.find(l => l.kind === 'firm');

  const webDom = website ? domainOf(website.url) : null;
  if (webDom) {
    push(`https://unavatar.io/${webDom}?fallback=false`);
    push(`https://www.google.com/s2/favicons?sz=128&domain=${webDom}`);
  }
  const h = xl ? xHandle(xl.url) : null;
  if (h) {
    push(`https://unavatar.io/x/${h}?fallback=false`);
    push(`https://unavatar.io/twitter/${h}?fallback=false`);
  }
  const firmDom = firm ? domainOf(firm.url) : null;
  if (firmDom) {
    push(`https://unavatar.io/${firmDom}?fallback=false`);
    push(`https://www.google.com/s2/favicons?sz=128&domain=${firmDom}`);
  }
  return out;
}

// 1–2 letter monogram for the logo fallback tile ("OpenAI"→"OP", "Peter Thiel"→"PT").
function monogramOf(label) {
  const words = String(label || '').replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ══════════════════════════════════════════════════════════════════════════
// buildGraph — reshape the contract into { nodes, links, sectors, stats }.
// ══════════════════════════════════════════════════════════════════════════
export function buildGraph(data = raw) {
  const rawNodes = data.nodes || [];
  const rawFlows = data.flows || [];
  const rawSectors = data.sectors || {};

  const byId = new Map(rawNodes.map(n => [n.id, n]));

  // Which sectors are lighting up this cycle (non-empty signals)?
  const litSectors = new Set(
    Object.entries(rawSectors)
      .filter(([, s]) => Array.isArray(s.signals) && s.signals.length > 0)
      .map(([k]) => k)
  );

  const nodes = rawNodes.map(n => {
    const clsMeta = CLASS_META[n.cls] || {};
    const isAllocator = n.kind === 'allocator';
    const color = isAllocator
      ? (clsMeta.color || '#C2A36B')
      : (SECTOR_META[n.sector]?.color || clsMeta.color || '#71717a');
    // Profile (who/what it is + a link). Engine-emitted fields win, then the
    // dashboard reference file, then a safe web-search fallback so a click
    // never lands on a wrong/guessed URL.
    const ref = entityRef[n.id] || null;
    // Display-name override (e.g. "Andreessen Horowitz" → "a16z") — lives in
    // the dashboard reference file so it survives engine re-deliveries.
    const displayName = ref?.displayName || n.label;
    const description = n.description || ref?.description || null;
    const links = (Array.isArray(n.links) && n.links.length ? n.links : ref?.links) || [];
    const profileType = n.profile_type || ref?.type ||
      (isAllocator ? (n.cls === 'individual' ? 'person' : 'org')
                   : (n.cls === 'fund' ? 'fund' : n.cls === 'project' ? 'project' : 'org'));
    // National affiliation. The engine emits ISO-2 codes (uppercase) for any
    // entity it can place; the dashboard reference file is the curated
    // fallback. Lowercased because the flag files are (public/flags/<cc>.png).
    const rawCountry = n.country || ref?.country || null;
    const country = rawCountry ? String(rawCountry).toLowerCase() : null;
    const countryLabel = n.country_label || ref?.countryLabel
      || COUNTRY_NAMES[country] || (country ? country.toUpperCase() : null);
    // Flag-AS-ICON is reserved for SOVEREIGN entities — state funds and
    // government programmes — because that is the whole point of the flag:
    // spotting national capital at a glance. Everyone else keeps their brand
    // mark (a US flag on NVIDIA says nothing and costs us the logo) and
    // carries the country as metadata in the panel instead.
    const flagUrl = country && n.cls === 'sovereign' ? `/flags/${country}.png` : null;
    // Real brand logo / founder photo, pre-fetched into public/logos/ by
    // scripts/fetch_logos.py (reliable, offline, no runtime DNS). Monogram
    // tile is the fallback for the entities without one.
    const localLogo = logoManifest[n.id];
    const logoUrls = [
      ...(flagUrl ? [flagUrl] : []),
      ...(localLogo ? [localLogo] : []),
    ];
    // The engine's canonical allocator record, keyed by the bare name behind
    // the `alloc:` prefix. This is the source of truth for allocator narrative
    // and track record — the dashboard sidecar is only a legacy fallback.
    const engineAlloc = isAllocator ? (data.allocators || {})[n.id.replace(/^alloc:/, '')] || null : null;
    return {
      ...n,
      name: displayName,
      description,
      links,
      profileType,
      referenceAsOf: n.reference_as_of || null,
      country,
      countryLabel,
      flagUrl,
      logoUrls,
      // Engine-owned allocator record (null for targets, and for allocators the
      // engine has not profiled yet).
      engineProfile: engineAlloc?.profile || null,
      trackRecord: Array.isArray(engineAlloc?.track_record) ? engineAlloc.track_record : [],
      engineSectors: engineAlloc?.sectors || null,
      thesisShares: engineAlloc?.thesis_shares || null,
      confirmedDeals: typeof engineAlloc?.confirmed_deals === 'number' ? engineAlloc.confirmed_deals : null,
      monogram: monogramOf(displayName),
      searchUrl: `https://duckduckgo.com/?q=${encodeURIComponent(displayName)}`,
      // FlowGraph role encoding: 'player' deploys · 'target' receives.
      type: isAllocator ? 'player' : 'target',
      color,
      capital: n.capital || 0,
      totalInflow: 0, totalOutflow: 0, inflowCount: 0, outflowCount: 0,
      confirmed: false,           // set below — has ≥1 verified/verified_alpha flow
      aboveThreshold: false,      // set below — has ≥1 flow at/above confidence_threshold
      sectorLit: n.sector ? litSectors.has(n.sector) : false,
      themeKey: n.sector ? (SECTOR_TO_THEME[n.sector] || null) : null,
      x: 0, y: 0,
    };
  });
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const threshold = typeof data.confidence_threshold === 'number' ? data.confidence_threshold : 60;

  // Drop flows that reference an unknown node (defensive — the engine dedupes).
  const valid = rawFlows.filter(f => {
    const ok = byId.has(f.source) && byId.has(f.target);
    if (!ok && typeof console !== 'undefined') {
      console.warn(`[capitalMap] flow ${f.source}→${f.target} references an unknown node — skipped`);
    }
    return ok;
  });

  // Fan multiple flows between the same pair apart so edges never overlap.
  const pairKey = (a, b) => [a, b].sort().join('~');
  const pairCount = new Map();
  valid.forEach(f => { const k = pairKey(f.source, f.target); pairCount.set(k, (pairCount.get(k) || 0) + 1); });
  const pairSeen = new Map();

  const links = valid.map((f, i) => {
    const k = pairKey(f.source, f.target);
    const total = pairCount.get(k);
    const idx = pairSeen.get(k) || 0;
    pairSeen.set(k, idx + 1);
    const curvature = total === 1 ? 0.06 : 0.18 * (idx - (total - 1) / 2) * 2;

    const et = EVENT_TYPE_META[f.event_type] || { label: f.event_type, family: 'equity', color: '#52525b' };
    const disclosed = f.amount != null;
    const amt = disclosed ? f.amount : 0;

    const src = nodeById.get(f.source);
    const tgt = nodeById.get(f.target);
    src.outflowCount += 1; src.totalOutflow += amt;
    tgt.inflowCount += 1;  tgt.totalInflow += amt;
    if (f.status === 'verified' || f.status === 'verified_alpha') {
      src.confirmed = true; tgt.confirmed = true;
    }
    if (typeof f.confidence === 'number' && f.confidence >= threshold) {
      src.aboveThreshold = true; tgt.aboveThreshold = true;
    }

    return {
      ...f,                     // includes confidence + grade (v2)
      id: `${f.source}=>${f.target}#${i}`,
      sourceId: f.source, targetId: f.target,
      eventLabel: et.label,
      family: et.family,
      color: et.color,
      theme: SECTOR_TO_THEME[f.sector] || null,
      confidence: typeof f.confidence === 'number' ? f.confidence : null,
      grade: f.grade || null,
      note: flowNote(f),                    // editorial read, or null
      amountUSD: amt,          // 0 when undisclosed (used only for sizing)
      disclosed,
      sourceTier: f.tier,      // 1..5 — do NOT confuse with allocator tier
      curvature,
    };
  });

  // Node roll-ups. Size is driven by the engine's `capital` (authoritative),
  // not by our summed amounts (some flows are undisclosed).
  nodes.forEach(n => {
    n.totalFlow = n.capital;
    n.degree = n.inflowCount + n.outflowCount;
    // A node reaches the MAIN map when it has ≥1 flow at/above the engine's
    // confidence_threshold, OR a verified/verified_alpha flow, OR sits in a
    // signalling sector. Everything else is watch/unconfirmed (behind a toggle).
    n.watchOnly = !(n.confirmed || n.aboveThreshold) && !n.sectorLit;
  });

  const maxCapital = Math.max(1, ...nodes.map(n => n.capital));
  const maxAmount = Math.max(1, ...links.map(l => l.amountUSD));
  nodes.forEach(n => { n.flowShare = n.capital / maxCapital; });
  links.forEach(l => { l.amountShare = l.amountUSD / maxAmount; });

  // Per-sector aggregates come straight from the engine (authoritative), with
  // the node/flow lists attached for convenience.
  const sectors = {};
  Object.entries(rawSectors).forEach(([key, s]) => {
    sectors[key] = {
      key,
      ...s,
      lit: Array.isArray(s.signals) && s.signals.length > 0,
      label: sectorLabel(key),
      color: SECTOR_META[key]?.color || '#71717a',
    };
  });

  // Themes — the second dimension, same shape as sectors (v2).
  const themes = {};
  Object.entries(data.themes || {}).forEach(([key, t]) => {
    themes[key] = {
      key,
      ...t,
      lit: Array.isArray(t.signals) && t.signals.length > 0,
      label: THEME_META[key]?.label || key,
      color: THEME_META[key]?.color || '#7C8FD0',
    };
  });

  // Beneficiary-concentration signals — public tickers private capital points
  // at. The highest-value read-through, surfaced prominently in the UI.
  const beneficiaries = [];
  const seenBenef = new Set();
  const collect = (obj, dim) => Object.values(obj).forEach(g =>
    (g.signals || []).forEach(s => {
      if (s.rule === 'beneficiary_concentration' && !seenBenef.has(s.theme)) {
        seenBenef.add(s.theme);
        beneficiaries.push({ ...s, dim, group: g.key });
      }
    }));
  collect(sectors, 'sector');
  collect(themes, 'theme');

  const disclosedTotal = links.reduce((acc, l) => acc + (l.disclosed ? l.amount : 0), 0);
  const confVals = links.map(l => l.confidence).filter(c => typeof c === 'number');
  const stats = {
    nodeCount: nodes.length,
    allocatorCount: nodes.filter(n => n.kind === 'allocator').length,
    targetCount: nodes.filter(n => n.kind === 'target').length,
    flowCount: links.length,
    sectorCount: Object.keys(sectors).length,
    themeCount: Object.keys(themes).length,
    signalCount: Object.values(sectors).filter(s => s.lit).length,
    themeSignalCount: Object.values(themes).filter(t => t.lit).length,
    staleCount: nodes.filter(n => n.stale).length,
    watchCount: nodes.filter(n => n.watchOnly).length,
    networkCount: nodes.filter(n => n.network).length,
    beneficiaryCount: beneficiaries.length,
    aboveThresholdFlows: confVals.filter(c => c >= threshold).length,
    totalTracked: disclosedTotal,
    disclosedShare: links.length ? links.filter(l => l.disclosed).length / links.length : 0,
  };

  return {
    nodes, links, sectors, themes, beneficiaries, stats,
    generated: data.generated, confidenceThreshold: threshold, maxCapital, maxAmount,
  };
}

/** Adjacency lookup: node id → { inbound: [links], outbound: [links] }. */
export function buildAdjacency(links) {
  const map = new Map();
  const touch = (id) => {
    if (!map.has(id)) map.set(id, { inbound: [], outbound: [] });
    return map.get(id);
  };
  links.forEach(l => {
    touch(l.sourceId).outbound.push(l);
    touch(l.targetId).inbound.push(l);
  });
  map.forEach(v => {
    v.inbound.sort((a, b) => b.amountUSD - a.amountUSD);
    v.outbound.sort((a, b) => b.amountUSD - a.amountUSD);
  });
  return map;
}
