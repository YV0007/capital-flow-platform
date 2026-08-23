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

import raw from './capitalMap.json';
import entityRef from './entityReference.json';
import ru from './capitalMapRu.json';
import logoManifest from './logoManifest.json';
import flowNotes from './flowNotes.json';
import allocatorNotes from './allocatorNotes.json';
import { classifyGraph } from '../components/research/capitalflow/classification.js';

// Pure consumer: `raw` is the engine's delivery, rendered as-is. The engine
// ships the FULL cumulative map every cycle (a 2026-W33 delta regression that
// briefly forced a dashboard-side archive union has been fixed engine-side —
// the merge + capitalMap.archive.json are gone). Zero data latitude.

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
// ── Bilingual taxonomy ───────────────────────────────────────────────────
// Every display string below exists in Russian and English. They are exposed
// as GETTERS rather than `{ ru, en }` pairs so the ~200 existing call sites —
// `SECTOR_META[k].label`, `meta.blurb`, sorts, spreads — keep reading a plain
// string and simply start speaking English when the toggle flips. App remounts
// its body on a language change, so everything repaints.
import { getLang } from '../lib/i18n.jsx';

export function bi(pairs, rest = {}) {
  const o = { ...rest };
  for (const [k, v] of Object.entries(pairs)) {
    const [ru, en] = v;
    Object.defineProperty(o, k, {
      enumerable: true,
      get: () => (getLang() === 'en' ? (en ?? ru) : ru),
    });
  }
  return o;
}
/** Same idea for a flat `{ key: 'строка' }` dictionary. */
export function biMap(entries) {
  const o = {};
  for (const [k, [ru, en]] of Object.entries(entries)) {
    Object.defineProperty(o, k, {
      enumerable: true,
      get: () => (getLang() === 'en' ? (en ?? ru) : ru),
    });
  }
  return o;
}

export const SECTOR_META = {
  'ai-labs': bi({
    label: ['AI-лаборатории', 'AI labs'],
    blurb: ['Разработчики передовых моделей — лаборатории, обучающие крупнейшие модели.',
            'Frontier model developers — the labs training the largest models.'],
  }, { color: '#8E9BE6', order: 0 }),
  'ai-applications': bi({
    label: ['AI-приложения', 'AI applications'],
    blurb: ['Прикладной слой — отраслевой и корпоративный софт, построенный поверх моделей.',
            'The application layer — vertical and enterprise software built on top of the models.'],
  }, { color: '#9DB6EA', order: 1 }),
  'ai-data': bi({
    label: ['Платформы данных', 'Data platforms'],
    blurb: ['Платформы данных и разметка, которые кормят модели, — цепочка поставки обучающих данных.',
            'The data platforms and labelling that feed the models — the training-data supply chain.'],
  }, { color: '#6F93DE', order: 2 }),
  'ai-compute': bi({
    label: ['AI-вычисления', 'AI compute'],
    blurb: ['GPU и специализированные ускорители — вычисления, на которых работают модели.',
            'GPUs and purpose-built accelerators — the compute the models actually run on.'],
  }, { color: '#5A93DE', order: 3 }),
  'semiconductors': bi({
    label: ['Полупроводники', 'Semiconductors'],
    blurb: ['Чипы в широком смысле и мощности контрактных фабрик за спиной ускорителей.',
            'Chips broadly, and the foundry capacity standing behind the accelerators.'],
  }, { color: '#7079DE', order: 4 }),
  'fab-equipment': bi({
    label: ['Оборудование для чипов', 'Fab equipment'],
    blurb: ['Литография, травление, напыление и корпусирование — то, чем строят фабрики.',
            'Lithography, etch, deposition and packaging — the tools fabs are built from.'],
  }, { color: '#93A0BC', order: 5 }),
  'cloud-hyperscale': bi({
    label: ['Облака', 'Hyperscale cloud'],
    blurb: ['Вычислительные мощности гиперскейлеров, продаваемые как облако.',
            'Hyperscaler compute capacity, sold as cloud.'],
  }, { color: '#4FA6E0', order: 6 }),
  'neocloud': bi({
    label: ['GPU-облака', 'Neocloud'],
    blurb: ['«Арендодатели GPU» — вычисления в аренду по часам, часто на деньги вендоров.',
            'GPU landlords — compute rented by the hour, often on vendor money.'],
  }, { color: '#45C0D0', order: 7 }),
  'datacenters': bi({
    label: ['Дата-центры', 'Data centers'],
    blurb: ['Физические здания и кампусы: земля, корпуса, операторы.',
            'The physical buildings and campuses: land, shells, operators.'],
  }, { color: '#6389C4', order: 8 }),
  'networking': bi({
    label: ['Сети', 'Networking'],
    blurb: ['Оптические соединения и фотоника — перенос данных между чипами.',
            'Optical interconnect and photonics — moving data between chips.'],
  }, { color: '#58ABCB', order: 9 }),
  'power-energy': bi({
    label: ['Энергетика', 'Power & energy'],
    blurb: ['Турбины, сетевое оборудование и охлаждение — электричество для всей стройки.',
            'Turbines, grid gear and cooling — the electricity for the entire build-out.'],
  }, { color: '#49C2AE', order: 10 }),
  'nuclear': bi({
    label: ['Атомная энергетика', 'Nuclear'],
    blurb: ['Малые реакторы, термояд и уран — длинная ставка на энергию.',
            'Small reactors, fusion and uranium — the long bet on power.'],
  }, { color: '#5ACAD4', order: 11 }),
  'robotics': bi({
    label: ['Робототехника', 'Robotics'],
    blurb: ['AI в физическом мире — гуманоиды, автономность, роботы.',
            'AI in the physical world — humanoids, autonomy, robots.'],
  }, { color: '#8088D6', order: 12 }),
  'defense-tech': bi({
    label: ['Оборонные технологии', 'Defense tech'],
    blurb: ['Оборонка в обход традиционных генподрядчиков.',
            'Defense built around the traditional prime contractors.'],
  }, { color: '#6E7E9A', order: 13 }),
  'cybersecurity': bi({
    label: ['Кибербезопасность', 'Cybersecurity'],
    blurb: ['Защита моделей, данных и инфраструктуры AI — киберпериметр стека.',
            'Securing the models, the data and the infrastructure — the stack\'s cyber perimeter.'],
  }, { color: '#A46FD6', order: 14 }),
  // ── Outside the AI buildout. Sovereigns and alt managers allocate here too
  // and it is real capital, so it is tracked — held in quieter slate tones so
  // the ring still reads as "AI stack first".
  'ev-automotive': bi({
    label: ['Электромобили', 'EV & automotive'],
    blurb: ['Производители электромобилей и автопром. Вне AI-тематики.',
            'EV makers and the wider auto industry. Outside the AI theme.'],
  }, { color: '#7F93A8', order: 15 }),
  'private-credit': bi({
    label: ['Частный кредит', 'Private credit'],
    blurb: ['Прямое кредитование и кредитные платформы. Вне AI-тематики.',
            'Direct lending and credit platforms. Outside the AI theme.'],
  }, { color: '#8F98A8', order: 16 }),
  'diversified-pe': bi({
    label: ['Private equity', 'Private equity'],
    blurb: ['Классический private equity и стратегические доли без единого сектора. Вне AI-тематики.',
            'Classic private equity and strategic stakes with no single sector. Outside the AI theme.'],
  }, { color: '#98A0AE', order: 17 }),
};

/**
 * Display label for a sector key. Falls back to a de-slugged title case, so a
 * sector the engine adds before this file knows about it renders as
 * "Space Infrastructure", never "SPACE-INFRASTRUCTURE".
 */
export function sectorLabel(key) {
  if (!key) return getLang() === 'en' ? 'No sector' : 'Без сектора';
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
  corporate: bi({
    label: ['Корпорация', 'Corporate'],
    zone:  ['Корпорации', 'Corporates'],
    money: ['корпоративные деньги', 'corporate money'],
    blurb: ['Операционные компании, инвестирующие с собственного баланса, — стратегия важнее финансовой доходности.',
            'Operating companies investing off their own balance sheet — strategy matters more than financial return.'],
  }, { color: '#5AA9CF', shape: 'capsule', side: 'allocator' }),
  vc: bi({
    label: ['Венчурный фонд', 'Venture fund'],
    zone:  ['Венчурные фонды', 'Venture funds'],
    money: ['венчурные деньги', 'venture money'],
    blurb: ['Венчурные фонды и фонды роста, вкладывающие деньги LP в частные раунды.',
            'Venture and growth funds deploying LP money into private rounds.'],
  }, { color: '#8E9BE6', shape: 'capsule', side: 'allocator' }),
  alt_manager: bi({
    label: ['Управляющий активами', 'Asset manager'],
    zone:  ['Управляющие активами', 'Asset managers'],
    money: ['деньги управляющих активами', 'asset-manager money'],
    blurb: ['Private-equity, инфраструктурные и кредитные управляющие — самые крупные разовые чеки, в основном в реальные активы.',
            'Private equity, infrastructure and credit managers — the largest single cheques, mostly into real assets.'],
  }, { color: '#93A0BC', shape: 'capsule', side: 'allocator' }),
  sovereign: bi({
    label: ['Госфонд', 'Sovereign fund'],
    zone:  ['Госфонды', 'Sovereign funds'],
    money: ['государственные деньги', 'state money'],
    blurb: ['Государственные фонды и программы. Длинный горизонт, политические мотивы, нечувствительность к цене.',
            'State funds and programmes. Long horizon, political motives, price-insensitive.'],
  }, { color: '#49C2AE', shape: 'capsule', side: 'allocator' }),
  individual: bi({
    label: ['Частное лицо', 'Individual'],
    zone:  ['Частные лица', 'Individuals'],
    money: ['личные деньги', 'personal money'],
    blurb: ['Конкретные люди, инвестирующие лично, — чеки небольшие, но сигнал сильный.',
            'Named people investing personally — small cheques, strong signal.'],
  }, { color: '#9A8FD2', shape: 'capsule', side: 'allocator' }),
  // targets (receive)
  private: bi({
    label: ['Частная компания', 'Private company'],
    zone:  ['Частные компании', 'Private companies'],
    blurb: ['Операционные компании, пока не вышедшие на биржу.',
            'Operating companies that have not listed yet.'],
  }, { color: '#9D8FD8', shape: 'company', side: 'target' }),
  public: bi({
    label: ['Публичная компания', 'Public company'],
    zone:  ['Публичные компании', 'Public companies'],
    blurb: ['Компании на бирже — вывод, который можно отыграть покупкой акций.',
            'Listed companies — a conclusion you can act on by buying the stock.'],
  }, { color: '#62B5CC', shape: 'company', side: 'target' }),
  fund: bi({
    label: ['Фонд', 'Fund'],
    zone:  ['Фонды', 'Funds'],
    blurb: ['Фонды и SPV, привлекающие капитал, — не операционный бизнес.',
            'Funds and SPVs raising capital — not an operating business.'],
  }, { color: '#C9985F', shape: 'capsule', side: 'target' }),
  project: bi({
    label: ['Проект', 'Project'],
    zone:  ['Проекты', 'Projects'],
    blurb: ['Именованные стройки и программы, а не компании.',
            'Named build-outs and programmes rather than companies.'],
  }, { color: '#C99B72', shape: 'asset', side: 'target' }),
  asset: bi({
    label: ['Актив', 'Asset'],
    zone:  ['Активы', 'Assets'],
    blurb: ['Физические активы, меняющие владельца.',
            'Physical assets changing hands.'],
  }, { color: '#98A2AE', shape: 'asset', side: 'target' }),
};

// ── Event type → edge family + colour. One colour per family; drives edge
// colour, the legend, and the event-type filter.
export const EVENT_TYPE_META = {
  equity:               bi({ label: ['Доля', 'Equity'] },                        { family: 'equity',      color: '#7C8FD0' }),
  minority_stake:       bi({ label: ['Миноритарная доля', 'Minority stake'] },   { family: 'equity',      color: '#7C8FD0' }),
  funding_round:        bi({ label: ['Раунд', 'Round'] },                        { family: 'equity',      color: '#7C8FD0' }),
  corporate_investment: bi({ label: ['Корп. инвестиция', 'Corp. investment'] },  { family: 'equity',      color: '#7C8FD0' }),
  follow_on:            bi({ label: ['Повторный чек', 'Follow-on'] },            { family: 'equity',      color: '#7C8FD0' }),
  project_finance:      bi({ label: ['Проектное финансирование', 'Project finance'] }, { family: 'debt',  color: '#8496B4' }),
  acquisition:          bi({ label: ['Поглощение', 'Acquisition'] },             { family: 'acquisition', color: '#9A88C0' }),
  fund_launch:          bi({ label: ['Запуск фонда', 'Fund launch'] },           { family: 'fund',        color: '#5FB0A8' }),
  spv:                  bi({ label: ['SPV', 'SPV'] },                            { family: 'fund',        color: '#5FB0A8' }),
  grant:                bi({ label: ['Грант', 'Grant'] },                        { family: 'grant',       color: '#8391A8' }),
  sovereign_investment: bi({ label: ['Госинвестиция', 'Sovereign investment'] }, { family: 'sovereign',   color: '#6C9ACB' }),
};

// The distinct families, for a compact legend (colour is shared within a family).
export const FAMILY_META = {
  equity:      bi({ label: ['Доли и раунды', 'Equity & rounds'] },        { color: '#7C8FD0' }),
  debt:        bi({ label: ['Проектное финансирование', 'Project finance'] }, { color: '#8496B4' }),
  acquisition: bi({ label: ['Поглощения', 'Acquisitions'] },              { color: '#9A88C0' }),
  fund:        bi({ label: ['Фонды и SPV', 'Funds & SPVs'] },             { color: '#5FB0A8' }),
  grant:       bi({ label: ['Гранты', 'Grants'] },                        { color: '#8391A8' }),
  sovereign:   bi({ label: ['Госкапитал', 'State capital'] },             { color: '#6C9ACB' }),
};

// ── Confidence — the engine's `status`. Drives edge dashing + the chip.
// verified = Tier-1 confirmed (solid, strongest) · verified_alpha = strong,
// no primary source yet (short dash) · candidate = a lead (long dash).
export const STATUS_META = {
  verified: bi({
    label: ['Подтверждено', 'Verified'], short: ['ПОДТВ.', 'VERIFIED'],
    blurb: ['Подтверждено первоисточником (уровень 1).', 'Confirmed by a primary source (tier 1).'],
  }, { color: '#34D399', dash: null }),
  verified_alpha: bi({
    label: ['Подтверждено α', 'Verified α'], short: ['АЛЬФА', 'ALPHA'],
    blurb: ['Сильный сигнал, но первоисточник его пока не подтвердил.',
            'A strong signal that no primary source has confirmed yet.'],
  }, { color: '#FBBF24', dash: [7, 4] }),
  candidate: bi({
    label: ['Кандидат', 'Candidate'], short: ['КАНДИДАТ', 'CANDIDATE'],
    blurb: ['Неподтверждённая наводка. По умолчанию скрыта с основной карты.',
            'An unconfirmed lead. Hidden from the main map by default.'],
  }, { color: '#94A3B8', dash: [2, 5] }),
};

// ── Allocator tier — importance weighting from the engine.
export const TIER_META = {
  core: bi({
    short: ['ЯДРО', 'CORE'], label: ['Основной инвестор', 'Core allocator'],
    blurb: ['Определяющий узел своей сети — инвесторы с самой глубокой убеждённостью, ставящие снова и снова.',
            'The defining node of its network — the deepest conviction, betting again and again.'],
  }, { stars: '★★★★', color: '#FDE047' }),
  key: bi({
    short: ['КЛЮЧ', 'KEY'], label: ['Ключевой инвестор', 'Key allocator'],
    blurb: ['Решает, куда пойдут миллиарды. Лучший предиктор того, куда капитал двинется дальше.',
            'Decides where billions go. The best single predictor of where capital moves next.'],
  }, { stars: '★★★', color: '#FBBF24' }),
  watch: bi({
    short: ['НАБЛ.', 'WATCH'], label: ['Под наблюдением', 'On watch'],
    blurb: ['В отслеживаемой вселенной; инвестор второго эшелона.',
            'Inside the tracked universe; a second-tier allocator.'],
  }, { stars: '★★', color: '#C084FC' }),
};

// Source-tier (1..5) of a flow — 1 = SEC/official filing.
export const SOURCE_TIER_LABEL = biMap({
  1: ['Уровень 1 · SEC / официальный документ', 'Tier 1 · SEC / official filing'],
  2: ['Уровень 2 · пресс-релиз компании',       'Tier 2 · company press release'],
  3: ['Уровень 3 · авторитетная пресса',        'Tier 3 · reputable press'],
  4: ['Уровень 4 · вторичная пресса',           'Tier 4 · secondary press'],
  5: ['Уровень 5 · единственный источник',      'Tier 5 · single source'],
});

// ── Confidence grade (Admiralty-style): letter = source reliability, digit =
// information credibility. Used for tooltips + the legend key.
export const GRADE_LETTER = biMap({
  A: ['Первоисточник (SEC, IR, госорганы)', 'Primary source (SEC, IR, government)'],
  B: ['Ведущая платформа данных',           'Leading data platform'],
  C: ['Качественная пресса',                'Quality press'],
  D: ['Отраслевой аналитик',                'Industry analyst'],
  E: ['Соцсети / слухи',                    'Social media / rumour'],
});
export const GRADE_DIGIT = biMap({
  1: ['Подтверждено первоисточником',                 'Confirmed by a primary source'],
  2: ['Сходятся два и более независимых источника',   'Two or more independent sources agree'],
  3: ['Один надёжный источник',                       'A single reliable source'],
  4: ['Без подтверждения',                            'Unconfirmed'],
  5: ['Сомнительно',                                  'Doubtful'],
});
export function gradeBlurb(grade) {
  if (!grade || grade.length < 2) return '';
  return `${GRADE_LETTER[grade[0]] || grade[0]} · ${GRADE_DIGIT[grade[1]] || grade[1]}`;
}

// Confidence band — plain-English label for the 0-100 score, so a number is
// never shown on its own.
export function confidenceBand(c) {
  const en = getLang() === 'en';
  if (c == null) return { label: en ? 'Not scored' : 'Не оценено', color: '#94A3B8' };
  if (c >= 85) return { label: en ? 'High confidence' : 'Высокая надёжность', color: '#34D399' };
  if (c >= 60) return { label: en ? 'Good confidence' : 'Хорошая надёжность', color: '#FBBF24' };
  if (c >= 40) return { label: en ? 'Weak confidence' : 'Слабая надёжность', color: '#94A3B8' };
  return { label: en ? 'Low confidence' : 'Низкая надёжность', color: '#8b8b95' };
}

// ── Deal context ────────────────────────────────────────────────────────
// The engine ships facts, never interpretation. The "read" is the DASHBOARD's
// to write — from the payload only, never the web (every fact is already in the
// flow + its joined nodes). `flowNotes.json` is the generated+cached store,
// keyed by the engine's STABLE `flow.id`: a read is generated once per id and
// only regenerated when the id changes (a genuinely new/changed deal), so
// unchanged deals are never re-worded.
//
// Resolution order: (1) a `read` the engine itself wrote wins if it ever ships
// one; (2) the cached read for this flow.id; (3) a legacy hand note keyed by
// "source=>target" (pre-id-cache entries); (4) null → composeRead(), a grounded
// line built strictly from known facts. The UI always labels a non-engine read
// as "наша трактовка · не данные движка" — true precisely because we wrote it.
export function flowNote(flow) {
  if (flow.read) return { angle: flow.angle || null, read: flow.read, from: 'engine' };
  const byId = flow.id ? flowNotes[flow.id] : null;
  if (byId) return { ...byId, from: 'dashboard' };
  const legacy = flowNotes[`${flow.source}=>${flow.target}`];
  return legacy ? { ...legacy, from: 'dashboard' } : null;
}

export function composeRead(flow, srcNode, tgtNode) {
  const en = getLang() === 'en';
  const src = srcNode?.name || String(flow.sourceId || '').replace(/^alloc:/, '');
  const tgt = tgtNode?.name || String(flow.targetId || '').replace(/^target:/, '');
  const et = EVENT_TYPE_META[flow.event_type];
  const sec = flow.sector ? SECTOR_META[flow.sector] : null;
  const what = tgtNode?.description ? ` ${tgtNode.description}` : '';
  if (en) {
    const kind = (et?.label || flow.event_type || 'flow').toLowerCase();
    return `${src} — ${kind} into ${tgt}.${what}${sec ? ` Sector: ${sec.label}.` : ''}`
      + ' No written read on this deal yet.';
  }
  const where = sec ? ` Сектор — «${sec.label}».` : '';
  return `${src} — ${(et?.label || flow.event_type || 'поток').toLowerCase()} в ${tgt}.${what}${where}`
    + ' Письменного разбора этой сделки пока нет.';
}

// ── Themes — a SECOND dimension, orthogonal to sectors (which narrative a
// deal belongs to). 10 canonical themes. Flows don't carry a theme, so a
// target's theme is derived from its sector (SECTOR_TO_THEME below).
export const THEME_META = {
  frontier_ai:         bi({ label: ['Передовой AI', 'Frontier AI'] },            { color: '#8E9BE6', order: 0 }),
  ai_infrastructure:   bi({ label: ['AI-инфраструктура', 'AI infrastructure'] }, { color: '#5A93DE', order: 1 }),
  ai_applications:     bi({ label: ['AI-приложения', 'AI applications'] },       { color: '#9DB6EA', order: 2 }),
  energy_for_ai:       bi({ label: ['Энергия для AI', 'Energy for AI'] },        { color: '#49C2AE', order: 3 }),
  defense_ai:          bi({ label: ['Оборонный AI', 'Defense AI'] },             { color: '#6E7E9A', order: 4 }),
  robotics_embodiment: bi({ label: ['Робототехника', 'Robotics'] },              { color: '#8088D6', order: 5 }),
  sovereign_ai:        bi({ label: ['Государственный AI', 'Sovereign AI'] },     { color: '#58ABCB', order: 6 }),
  biotech_ai:          bi({ label: ['Биотех и AI', 'Biotech & AI'] },            { color: '#5FB0A8', order: 7 }),
  space:               bi({ label: ['Космос', 'Space'] },                        { color: '#7079DE', order: 8 }),
  crypto_ai:           bi({ label: ['Крипто и AI', 'Crypto & AI'] },             { color: '#45C0D0', order: 9 }),
  cyber_security:      bi({ label: ['Кибербезопасность', 'Cybersecurity'] },     { color: '#A46FD6', order: 10 }),
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
  'cybersecurity': 'cyber_security',
  'ai-applications': 'ai_applications', 'ai-data': 'ai_applications',
  // ev-automotive · private-credit · diversified-pe sit outside the AI
  // buildout and deliberately carry no theme.
};

// ── Display names for the ISO-2 country codes the engine emits. Presentation
// only — the code itself is the payload's, and an unmapped code falls back to
// the uppercase code rather than being guessed at.
export const COUNTRY_NAMES = biMap({
  us: ['США', 'United States'],       ca: ['Канада', 'Canada'],
  gb: ['Великобритания', 'United Kingdom'], ae: ['ОАЭ', 'UAE'],
  sa: ['Саудовская Аравия', 'Saudi Arabia'], qa: ['Катар', 'Qatar'],
  kw: ['Кувейт', 'Kuwait'],           kr: ['Южная Корея', 'South Korea'],
  jp: ['Япония', 'Japan'],            cn: ['Китай', 'China'],
  tw: ['Тайвань', 'Taiwan'],          sg: ['Сингапур', 'Singapore'],
  in: ['Индия', 'India'],             il: ['Израиль', 'Israel'],
  de: ['Германия', 'Germany'],        fr: ['Франция', 'France'],
  nl: ['Нидерланды', 'Netherlands'],  ch: ['Швейцария', 'Switzerland'],
  se: ['Швеция', 'Sweden'],           no: ['Норвегия', 'Norway'],
  au: ['Австралия', 'Australia'],
});

// ── Elite networks an individual allocator can belong to. Warm accents so a
// networked node pops against the cool palette.
export const NETWORK_META = {
  paypal_mafia:     { label: 'PayPal Mafia',      color: '#F5B942' },
  thiel_extended:   bi({ label: ['Круг Тиля', 'Thiel circle'] }, { color: '#E8975E' }),
  thiel_fellowship: { label: 'Thiel Fellowship',  color: '#D98CA8' },
};

// ── Signal rule labels — rendered so users know WHY a group lit up.
// Any rule NOT listed here is hidden from the UI (see SUPPRESSED_RULES filter
// in buildGraph) — that way an unlabeled future rule doesn't leak its raw
// English slug into a Russian panel.
export const RULE_META = {
  sector_swarm: bi({
    label: ['Приток капитала в сектор', 'Sector swarm'],
    blurb: ['Несколько ключевых инвесторов вошли в один сектор за короткое окно.',
            'Several key allocators entered one sector inside a short window.'],
  }),
  theme_swarm: bi({
    label: ['Приток капитала в тему', 'Theme swarm'],
    blurb: ['Ключевые инвесторы сошлись на одной теме — сразу в нескольких секторах.',
            'Key allocators converged on one theme, across several sectors at once.'],
  }),
  smart_money_follow: bi({
    label: ['Умные деньги ведут', 'Smart money leads'],
    blurb: ['Ключевой инвестор вошёл первым; за ним быстро последовали другие.',
            'A key allocator went in first; others followed quickly.'],
  }),
  beneficiary_concentration: bi({
    label: ['Бенефициар', 'Beneficiary'],
    blurb: ['Несколько частных потоков указывают на публичный тикер (иногда — на несколько кандидатов сразу) — вывод, который можно отыграть.',
            'Several private flows point at one public ticker (sometimes at several candidates at once) — a conclusion you can act on.'],
  }),
  stealth_accumulation: bi({
    label: ['Тихое накопление', 'Stealth accumulation'],
    blurb: ['Повторные доли незаметно накапливаются в одной компании.',
            'Repeat stakes quietly building up in one company.'],
  }),
  repeat_conviction: bi({
    label: ['Повторная ставка', 'Repeat conviction'],
    blurb: ['Участник сети снова и снова вкладывает в одну и ту же тему.',
            'A network member backing the same theme again and again.'],
  }),
  network_convergence: bi({
    label: ['Схождение сети', 'Network convergence'],
    blurb: ['Отслеживаемая сеть сходится на одной компании.',
            'The tracked network is converging on a single company.'],
  }),
  defense_network_convergence: bi({
    label: ['Оборонное схождение', 'Defense convergence'],
    blurb: ['Сеть, связанная с обороной, сходится на одной цели.',
            'A defense-linked network converging on one target.'],
  }),
};

// Rules explicitly hidden from the UI. subsector_swarm duplicates
// sector_swarm semantically ("N key allocators converge") and adds noise
// without adding a distinct read — parked until the signals deep-dive
// decides how (or whether) to surface it.
const SUPPRESSED_RULES = new Set(['subsector_swarm']);
const isVisibleSignal = (s) => !!s && !SUPPRESSED_RULES.has(s.rule) && !!RULE_META[s.rule];

export const META = {
  generated: raw.generated,
  confidenceThreshold: typeof raw.confidence_threshold === 'number' ? raw.confidence_threshold : 60,
  totals: raw.totals || { nodes: (raw.nodes || []).length, flows: (raw.flows || []).length, sectors: Object.keys(raw.sectors || {}).length },
  // Engine-owned view policy: the default trailing window, the offered windows,
  // and whether flows tied to a live signal stay visible past the window.
  viewDefaults: raw.view_defaults || { default_window_days: 30, windows: [7, 30, 90, null], keep_active_signal: true },
};

// Co-investors the engine has discovered but NEVER auto-adds — the user decides.
// The dashboard renders this queue and captures the choice; the engine owns who
// is actually tracked (see PromotionQueue + the exported decisions.json).
export const PROMOTION_QUEUE = (Array.isArray(raw.promotion_queue) ? raw.promotion_queue : [])
  .map(it => {
    const t = (ru.promotions || {})[it.candidate_id]?.description;
    return t ? { ...it, description: t } : it;
  });

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
  // English callers get the engine's own wording, which is already English.
  if (getLang() === 'en') return basis;
  return BASIS_RU[basis] || basis;
}
export const AUDIT = raw.audit || null;             // the engine's verdict on this delivery

// ── Track-record metric names → display labels. Presentation only; an unknown
// metric falls back to its own key de-snaked rather than being dropped.
export const METRIC_LABEL = biMap({
  stock_total_return_pct: ['Полная доходность акции', 'Stock total return'],
  fund_irr_pct:           ['IRR фонда', 'Fund IRR'],
  fund_net_return_pct:    ['Чистая доходность фонда', 'Fund net return'],
  fund_gross_return_pct:  ['Валовая доходность фонда', 'Fund gross return'],
  reported_return_pct:    ['Заявленная доходность', 'Reported return'],
  aum_usd_bn:             ['Активы под управлением', 'Assets under management'],
});
export function metricLabel(key) {
  return METRIC_LABEL[key] || String(key || '').replace(/_/g, ' ').replace(/\bpct\b/, '').trim()
    || (getLang() === 'en' ? 'Metric' : 'Метрика');
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
  const en = getLang() === 'en';
  const a = Math.abs(v);
  if (a >= 1e12) return `$${(v / 1e12).toFixed(2)}${en ? 'T' : ' трлн'}`;
  if (a >= 1e9) return `$${(v / 1e9).toFixed(1)}${en ? 'B' : ' млрд'}`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(0)}${en ? 'M' : ' млн'}`;
  return `$${v}`;
}

const DISCLAIMER_RU =
  'Сформировано движком Capital Flow на основе публичных отчётностей, официальных релизов и прессы. ' +
  'Статусы (подтверждено / подтверждено α / кандидат) — собственные оценки движка, отображаются как есть и никогда не переопределяются. ' +
  'Суммы — как раскрыто; у части потоков сумма не раскрыта. Не является инвестиционной рекомендацией.';
const DISCLAIMER_EN =
  'Produced by the Capital Flow engine from public filings, official releases and the press. ' +
  'Statuses (verified / verified α / candidate) are the engine\'s own assessments, rendered as-is and never overridden. ' +
  'Amounts are as disclosed; some flows have no disclosed amount. Not investment advice.';
/** Call it — a bare object here would render as [object Object] in JSX. */
export const disclaimer = () => (getLang() === 'en' ? DISCLAIMER_EN : DISCLAIMER_RU);

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
// RUSSIAN LAYER — the dashboard's own rendering of the engine's English prose.
//
// The engine writes every narrative field in English and re-delivers the whole
// payload each cycle, so a translation living inside capitalMap.json would be
// overwritten every Monday. `capitalMapRu.json` is the durable side-car
// instead: keyed by the engine's STABLE ids, merged here, and ALWAYS falling
// back to the English original. That fallback is the important part — a new
// entity the translator hasn't reached yet renders in English rather than
// blank, and `npm run cf:ru` reports exactly what is still missing.
//
// Names (companies, funds, people, tickers) are never translated — only prose.
// ══════════════════════════════════════════════════════════════════════════
// The engine's payload is ENGLISH; `capitalMapRu.json` is the dashboard-owned
// Russian side-car layered over it. So the English UI needs no translation
// work at all — it just declines the side-car and renders the engine's own
// words. `side()` is that switch, and every lookup below goes through it.
const side = (dict) => (getLang() === 'en' ? EMPTY_SIDECAR : dict);
const EMPTY_SIDECAR = {};
const RU_SUBSECTORS  = ru.subsectors  || {};
const RU_NODES       = ru.nodes       || {};
const RU_ALLOCATORS  = ru.allocators  || {};
const RU_TRENDS      = ru.trends      || {};
const RU_PROMOTIONS  = ru.promotions  || {};

/** Russian label for an engine subsector slug, or null to let the caller de-slug. */
export function ruSubsector(key) {
  return (key && side(RU_SUBSECTORS)[key]) || null;
}

/** The stable key a track-record row is translated under. */
function trackKey(row) {
  return `${row?.metric}|${row?.fiscal_year}|${row?.scope || ''}`;
}

/** Engine profile with any translated field swapped in; untranslated keys stay English. */
function ruProfile(name, profile) {
  const t = side(RU_ALLOCATORS)[name]?.profile;
  if (!profile || !t) return profile || null;
  return { ...profile, ...Object.fromEntries(Object.entries(t).filter(([, v]) => v)) };
}

/** Track-record rows with translated `notes`/`scope`; the numbers are untouched. */
function ruTrackRecord(name, rows) {
  const t = side(RU_ALLOCATORS)[name]?.track_record;
  if (!t) return rows;
  return rows.map(r => {
    const tr = t[trackKey(r)];
    return tr ? { ...r, ...(tr.notes ? { notes: tr.notes } : null), ...(tr.scope ? { scope: tr.scope } : null) } : r;
  });
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
    // Russian first (dashboard-owned), then the engine's English, then the
    // curated reference file — so an untranslated entity still reads.
    const description = side(RU_NODES)[n.id]?.description || n.description || ref?.description || null;
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
    // Runtime favicon/unavatar fallback from the entity's own domain + links,
    // for anything the offline batch (fetch_logos.py) hasn't produced a file for
    // yet. The engine now emits a clean `domain` on most nodes — fold it in as a
    // website link so a monogram only ever shows when NOTHING resolves.
    const logoLinks = n.domain
      ? [{ kind: 'website', url: /^https?:\/\//.test(n.domain) ? n.domain : `https://${n.domain}` }, ...links]
      : links;
    const logoUrls = [
      ...(flagUrl ? [flagUrl] : []),
      ...(localLogo ? [localLogo] : []),
      ...buildLogoUrls(logoLinks),
    ];
    // The engine's canonical allocator record, keyed by the bare name behind
    // the `alloc:` prefix. This is the source of truth for allocator narrative
    // and track record — the dashboard sidecar is only a legacy fallback.
    const engineAlloc = isAllocator ? (data.allocators || {})[n.id.replace(/^alloc:/, '')] || null : null;
    // Dashboard-curated context (allocatorNotes.json) — a short public-figure
    // "known as" tag for the Тезисы panel, plus additive fallbacks for the
    // handful of allocators the engine profiled thinly. Never overrides
    // engine data — only fills a genuine gap (`|| fallback`, not `??`).
    const allocNote = isAllocator ? allocatorNotes[n.id.replace(/^alloc:/, '')] || null : null;
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
      engineProfile: ruProfile(n.id.replace(/^alloc:/, ''), engineAlloc?.profile),
      trackRecord: ruTrackRecord(
        n.id.replace(/^alloc:/, ''),
        Array.isArray(engineAlloc?.track_record) ? engineAlloc.track_record : [],
      ),
      engineSectors: engineAlloc?.sectors || null,
      thesisShares: engineAlloc?.thesis_shares || null,
      confirmedDeals: typeof engineAlloc?.confirmed_deals === 'number' ? engineAlloc.confirmed_deals : null,
      knownAs: allocNote?.knownAs || null,
      sectorsFallback: allocNote?.sectorsFallback || null,
      thesisFallback: allocNote?.thesisFallback || null,
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
    // Engine sub-sector (per-flow slug). A target's sub-sector is the one on
    // its largest inbound flow — the deal that most defines what it is. Engine-
    // owned; no dashboard guessing (retires the keyword classifier).
    if (f.subsector && amt >= (tgt._ssAmt ?? -1)) { tgt.subsector = f.subsector; tgt._ssAmt = amt; }
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
  // Themes are shipped in a stable "TICKER (Name): N private flows converge"
  // shape, so we parse the ticker + name once here — that's what powers the
  // ticker search (nodes gain a `ticker` when their display name matches, and
  // beneficiaries without a matching node become signal-only search results).
  const beneficiaries = [];
  const seenBenef = new Set();
  const parseBenef = (theme) => {
    const m = /^\s*([A-Z0-9.\-]{1,8})\s*\(([^)]+)\)\s*:/.exec(String(theme || ''));
    return m ? { ticker: m[1], name: m[2].trim() } : { ticker: null, name: null };
  };
  const collect = (obj, dim) => Object.values(obj).forEach(g =>
    (g.signals || []).forEach(s => {
      if (s.rule === 'beneficiary_concentration' && !seenBenef.has(s.theme)) {
        seenBenef.add(s.theme);
        beneficiaries.push({ ...s, dim, group: g.key, ...parseBenef(s.theme) });
      }
    }));
  collect(sectors, 'sector');
  collect(themes, 'theme');

  // Ticker attachment — a node whose display name matches a beneficiary name
  // (case-insensitive) gets that beneficiary's ticker, so a "NVDA" query lands
  // on the NVIDIA node directly instead of only on the datacenter signal card.
  const benefByName = new Map();
  beneficiaries.forEach(b => { if (b.name && b.ticker) benefByName.set(b.name.toLowerCase(), b.ticker); });
  nodes.forEach(n => {
    const t = benefByName.get(String(n.name || '').toLowerCase())
           || benefByName.get(String(n.label || '').toLowerCase());
    if (t) n.ticker = t;
  });

  // Signal evidence + entity attachment (engine v3.7, 2026-08-17 — landed).
  //   · signal.entity_id — attaches a signal directly to one node
  //     (company-level signals like stealth_accumulation/
  //     beneficiary_concentration), collected onto node.signals rather than
  //     only living in a sector zone.
  //   · signal.evidence[] — now real {allocator_id, target_id, amount_usd,
  //     date, confirmed, flow_id} objects in the alloc:/target: namespace.
  //     `resolveEvidence` below intentionally snapshots each side to a plain
  //     {id, name, description} — NOT the live node object. A live reference
  //     here creates a genuine cycle (node.signals[i].evidence[j].target ===
  //     some other node, which itself carries .signals with evidence back
  //     into the graph) that force-graph's internal deep-clone
  //     (JSON.parse(JSON.stringify(...))) cannot serialize — it crashed the
  //     whole map on mount the day this evidence shape first landed. Every
  //     consumer (EntityPanel, ClusterReport, TrendCard) only ever reads
  //     .id/.name/.description off these, so the snapshot is a strict
  //     subset with no functionality lost.
  nodes.forEach(n => { n.signals = []; });
  const snapshotEntity = (id) => {
    const n = id ? nodeById.get(id) : null;
    return n ? { id: n.id, name: n.name, description: n.description || null } : null;
  };
  const resolveEvidence = (evidence) => (Array.isArray(evidence) ? evidence : [])
    .map(e => ({
      ...e,
      allocator: snapshotEntity(e.allocator_id),
      target: snapshotEntity(e.target_id),
    }))
    .filter(e => e.allocator || e.target);
  const attachSignals = (obj) => Object.values(obj).forEach(g => {
    // Drop hidden/unknown rules from the group's own signal list up-front so
    // sector cards (ClusterReport) and entity panels stay consistent.
    g.signals = (g.signals || []).filter(isVisibleSignal);
    g.signals.forEach(s => {
      // Raw evidence, keyed before resolveEvidence overwrites it below — the
      // merge pass needs to compare what the engine actually sent, not the
      // (currently always-empty) resolved result.
      const evidenceKey = JSON.stringify(
        [...(Array.isArray(s.evidence) ? s.evidence : [])].sort((a, b) => a - b)
      );
      s.evidence = resolveEvidence(s.evidence);
      if (s.entity_id) {
        const entity = nodeById.get(s.entity_id);
        if (entity) entity.signals.push({ ...s, evidenceKey });
      }
    });
  });
  attachSignals(sectors);
  attachSignals(themes);

  // The engine sometimes proposes more than one public-ticker beneficiary off
  // the exact same private-flow evidence (e.g. both FANUC and Siemens for one
  // Hadrian round) — two same-rule signals on one entity that are really one
  // finding with two candidates. Merge same-entity signals that share a rule
  // + evidence fingerprint into a single card carrying every theme string, so
  // the panel shows one honest "multiple candidates" line instead of two
  // near-identical ones.
  nodes.forEach(n => {
    if (!n.signals || n.signals.length < 2) return;
    const byKey = new Map();
    const merged = [];
    n.signals.forEach(s => {
      const key = `${s.rule}::${s.evidenceKey}`;
      const existing = byKey.get(key);
      if (existing) existing.themes.push(s.theme);
      else {
        const { evidenceKey: _drop, ...rest } = s;
        const entry = { ...rest, themes: [s.theme] };
        byKey.set(key, entry);
        merged.push(entry);
      }
    });
    n.signals = merged;
  });

  // Mark targets sitting under a beneficiary-concentration read (a public
  // ticker private capital points at) — the deal 'actionable path' factor uses
  // it. Approximate: match on the target's theme/sector.
  const benefThemes = new Set(beneficiaries.map(b => b.theme).filter(Boolean));
  nodes.forEach(n => {
    if (n.type === 'target') n.beneficiaryLinked = benefThemes.has(n.themeKey) || benefThemes.has(n.sector);
  });

  // Two-rank highlight classification (see classification.js). Mutates nodes:
  // playerScore/playerRank/playerParts (allocators) + dealScore/dealRank/
  // dealParts (targets). Players are scored before deals (deals read player
  // scores for backer-quality; players never read deals — no cycle).
  const classification = classifyGraph({ nodes, links, generated: data.generated });

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
    ...classification,   // corePlayers, keyPlayers, flaggedDeals, emergingDeals
  };

  // Trend narratives (engine ask, not yet shipped) — top 1-3 ranked entries per
  // window (week/month/all), each with grounded evidence resolved the same way
  // as signal evidence above. Empty object/arrays until the engine ships it.
  const trends = {};
  Object.entries(data.trends || {}).forEach(([win, list]) => {
    trends[win] = (Array.isArray(list) ? list : []).map(t => ({
      ...t,
      title: side(RU_TRENDS)[t.cluster_id]?.title || t.title,
      narrative: side(RU_TRENDS)[t.cluster_id]?.narrative || t.narrative,
      evidence: resolveEvidence(t.evidence),
    }));
  });

  return {
    nodes, links, sectors, themes, beneficiaries, stats, trends,
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
