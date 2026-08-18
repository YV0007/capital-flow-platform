// ══════════════════════════════════════════════════════════════════════════
// NVIDIA ECOSYSTEM — data adapter
//
// Sibling of capitalMap.js, and the same deal: ONE file is the contract.
//
//   engine (monthly: 8 agents → verify → SQLite → score → cycles)
//        → handoff/nvidia_ecosystem.json
//        → src/data/nvidiaEcosystem.json
//        → here
//
// The flow map answers "where did the money go last week". This one answers
// «кто делает NVIDIA незаменимой, кто заперт в её орбите, кто её шлюзует и чем
// она хеджируется». Entity = a company, a state, an agency or a standards
// body; a LAYER is a coordinate, not an object; an edge is a standing position
// of power, not a dated event.
//
// This is v2 and it is a CLEAN BREAK from v1 (`ecosystemMap.json`, twelve
// layers, ecosystem `ai-datacenters`). No migration, no back-compatibility, no
// reading of the old file — the old one is in `archive/ecosystem-v1/`. The two
// asked different questions, and the old taxonomy described building a data
// centre while this one describes NVIDIA's position in the world; gluing them
// would produce a map that is half concrete and half moat.
//
// ZERO DATA LATITUDE — stronger here than on the flow map. `criticality`,
// `criticalityFactors`, `gravity`, `concentration`, `cycles`, `spine` and
// `stale` are ALL computed UPSTREAM by the engine from the frozen rubric. This
// module never recomputes them, never second-guesses them, and never invents
// an edge. It attaches display meta (colour, label, shape, plain-Russian
// wording) and builds the indices the canvas needs. If you feel the urge to
// compute a criticality here, that is a data bug, not adapter work.
//
// NO LINK INTO DC-AI. There is no `dcNode` field on an entity or a sector, and
// nothing here points at the data-centre research. The map explains its own
// terms, from its own contents.
//
// CONTRACT (nvidia_ecosystem.json, schema "nvidia-ecosystem/2") — frozen, see
// ecosystem/README.md
//   schema, generated, asOf, source ("engine" | "fixture"), ecosystem, anchor
//   totals    { entities, edges, layers, cycles, techNodes }
//   layers[]  { id, label, caption, plane, order, band?,
//               concentration{level,hhi,top[]} }                 — VARIABLE length
//   sectors[] { key, label, layer }
//   entities[]{ id, name, aliases[], type, role, sector,
//               layers[{layer,primary,criticality}], primaryLayer,
//               criticality, criticalityFactors{}, criticalityWhy{}, gravity{},
//               oneLiner, whyIrreplaceable, whatBreaksIt, phase,
//               risk{geopolitical,note,exportRegime,concentration},
//               ticker, publicPrivate, geo, founded, revenueUsdB, techNodes[],
//               firstSeen, lastConfirmed, stale, sources[] }
//   techNodes[]{ id, label, owner, note, importance }
//   edges[]   { id, source, target, type, spine, direction, strength,
//               lockInDepth, substitutability, isReversible, status,
//               confidence, sourceTier, confirmedSources,
//               risk{level,type,timeline,mitigation}, techNode, formed,
//               strengthened, lastConfirmed, note, evidence[] }
//   cycles[]  { id, type, path[], edges[], note }
//   changelog { month, added[], removed[], changed[] }
// ══════════════════════════════════════════════════════════════════════════

import raw from './nvidiaEcosystem.json';
import logoDomains from './nvidiaEcosystemLogos.json';
import logoManifest from './logoManifest.json';

// ── Roles — the second dimension, orthogonal to the layer ────────────────
// Told apart by SHAPE as well as colour (colour alone carries the layer band),
// so the map still reads for a colour-blind eye and in print. `shape` is what
// the legend draws; on the canvas the tile itself is frozen, so the role rides
// the tile's RIM STYLE — see ROLE_DASH in EcoGraph.
export const ROLE_META = {
  producer: { label: 'Производитель', short: 'ПРОИЗВ.', color: '#6F93DE', shape: 'square', order: 0,
              blurb: 'Делает физическую вещь: станок, пластину, чип, память, стойку, коммутатор.' },
  platform: { label: 'Платформа',     short: 'ПЛАТФ.',  color: '#A46FD6', shape: 'hex', order: 1,
              blurb: 'Стандарт, софт или лицензия внутри чужого продукта — власть без выручки с железа.' },
  operator: { label: 'Оператор',      short: 'ОПЕРАТ.', color: '#49C2AE', shape: 'rounded', order: 2,
              blurb: 'Эксплуатирует актив: площадки, облака, станции. Владеет тем, что уже построено.' },
  demand:   { label: 'Спрос',         short: 'СПРОС',   color: '#8E9BE6', shape: 'circle', order: 3,
              blurb: 'Тот, ради кого построено остальное: лаборатории и бизнес, который за это платит.' },
  capital:  { label: 'Капитал',       short: 'КАПИТАЛ', color: '#C99B72', shape: 'diamond', order: 4,
              blurb: 'Владеет стеком и финансирует его, сам в нём не стоя. Ядро молекулы.' },
  state:    { label: 'Государство',   short: 'ГОСУД.',  color: '#B4707A', shape: 'star', order: 5,
              blurb: 'Юрисдикция, ведомство или консорциум стандартов: не участник стека, а его шлюз.' },
};

// ── Edge types — THIRTY-ONE, on FIVE spines ──────────────────────────────
// v1 had two spines and that was enough while the map answered "who supplies
// whom". This one asks «кто кого делает дороже, кто заперт, кто чем
// хеджируется». A MOAT and a GATE are not kinds of supply and not kinds of
// money — they are separate mechanics of power, and they must not read in the
// same colour as a delivery.
//
//   physical  — cool blue → teal   : what physically moves          (v1's palette, kept letter for letter)
//   capital   — warm amber → clay  : who pays and who owns          (v1's palette, kept letter for letter)
//   moat      — green              : what locks in, what proves demand
//   control   — red                : who gates access
//   rivalry   — grey-violet        : who takes a bite
//
// `verb` is what the chain crumbs say out loud. `blurb` is one sentence for
// the legend and the tooltip. `spine` here is a FALLBACK only — the engine
// ships `edges[].spine` and that is what gets painted.
export const EDGE_TYPE_META = {
  // ── physical ──────────────────────────────────────────────────────────
  manufactures:   { label: 'производит',        verb: 'производит',          spine: 'physical', color: '#5A93DE', order: 0,
                    blurb: 'Физически изготавливает продукт другой стороны на своих линиях.' },
  supplies:       { label: 'поставляет',        verb: 'поставляет',          spine: 'physical', color: '#6F93DE', order: 1,
                    blurb: 'Критический физический вход: без него продукт получателя не выпускается.' },
  packages:       { label: 'упаковывает',       verb: 'упаковывает',         spine: 'physical', color: '#58ABCB', order: 2,
                    blurb: 'Сажает кристалл и память на одну подложку — отдельный дефицитный этап.' },
  integrates:     { label: 'собирает',          verb: 'собирает',            spine: 'physical', color: '#4FB4C9', order: 3,
                    blurb: 'Собирает из чужих компонентов готовую систему под конкретного заказчика.' },
  delivers_to:    { label: 'отгружает',         verb: 'отгружает',           spine: 'physical', color: '#45C0D0', order: 4,
                    blurb: 'Прямая поставка продукта покупателю.' },
  enables:        { label: 'делает возможным',  verb: 'делает возможным',    spine: 'physical', color: '#49C2AE', order: 5,
                    blurb: 'Без этого другая сторона не может ни спроектировать, ни включить свой продукт.' },
  co_designs:     { label: 'проектирует вместе',verb: 'проектирует вместе с',spine: 'physical', color: '#3FA9C4', order: 6,
                    blurb: 'Обе стороны вкладывают инженерию: продукт спроектирован под другого.' },
  optimizes_for:  { label: 'затачивает под',    verb: 'затачивает под',      spine: 'physical', color: '#52C6BC', order: 7,
                    blurb: 'Продукт подогнан под чужую платформу и на другой работает хуже.' },

  // ── capital ───────────────────────────────────────────────────────────
  invests_in:        { label: 'вкладывается',     verb: 'вкладывается в',    spine: 'capital', color: '#E0A340', order: 10,
                       blurb: 'Доля в капитале — с контролем или без.' },
  funded_by:         { label: 'финансируется',    verb: 'получает деньги от',spine: 'capital', color: '#E8975E', order: 11,
                       blurb: 'Долг или проектное финансирование под стройку.' },
  board_seat:        { label: 'место в совете',   verb: 'сидит в совете',    spine: 'capital', color: '#D98C55', order: 12,
                       blurb: 'Прямое участие в решениях, а не только в доходе.' },
  strategic_partner: { label: 'стратегический союз', verb: 'в союзе с',      spine: 'capital', color: '#C99B72', order: 13,
                       blurb: 'Дорожные карты согласованы на годы вперёд, а не разовый заказ.' },
  hedges_against:    { label: 'страхуется',       verb: 'страхуется от',     spine: 'capital', color: '#D9B36A', order: 14,
                       blurb: 'Вложение не ради дохода, а чтобы дыра в обороне не открылась.' },
  diversifies_supply:{ label: 'второй источник',  verb: 'страхует поставку', spine: 'capital', color: '#C2A36B', order: 15,
                       blurb: 'Поставщик, заведённый ради переговорной позиции, а не ради объёма.' },
  customer_of:       { label: 'покупает',         verb: 'покупает у',        spine: 'capital', color: '#E8B268', order: 16,
                       blurb: 'Платит деньги — то есть кормит другую сторону выручкой.' },

  // ── moat ──────────────────────────────────────────────────────────────
  validates_demand:    { label: 'доказывает спрос',     verb: 'доказывает спрос на',     spine: 'moat', color: '#3FB984', order: 20,
                         blurb: 'Своим результатом доказал, что вычисления такого масштаба вообще нужны.' },
  proves_roi:          { label: 'доказывает окупаемость',verb: 'доказывает окупаемость', spine: 'moat', color: '#4FC49A', order: 21,
                         blurb: 'Показывает, что на этом зарабатывает не только продавец.' },
  proves_use_case:     { label: 'доказывает применимость',verb: 'показывает, зачем нужен',spine: 'moat', color: '#5CCFA6', order: 22,
                         blurb: 'Доводит спрос до обычных рабочих процессов, а не только лабораторий.' },
  locks_in_developers: { label: 'запирает разработчиков',verb: 'запирает разработчиков на',spine: 'moat', color: '#2FA873', order: 23,
                         blurb: 'Написанный код по умолчанию зовёт этот слой, и переписывать его никто не станет.' },
  locks_in_platforms:  { label: 'запирает платформы',   verb: 'запирает платформы на',   spine: 'moat', color: '#37B07C', order: 24,
                         blurb: 'Уйти значит потерять доступ ко всему, что уже собрано вокруг.' },
  path_dependent_on:   { label: 'завязан на',           verb: 'завязан на',              spine: 'moat', color: '#46BE8E', order: 25,
                         blurb: 'Накопленное решение прошлого не отыгрывается назад без переписывания всего.' },
  standardizes_on:     { label: 'стандартизован на',    verb: 'стандартизован на',       spine: 'moat', color: '#63D0B0', order: 26,
                         blurb: 'Выбрал одну платформу по умолчанию и строит вокруг неё.' },
  sets_benchmark:      { label: 'задаёт планку',        verb: 'задаёт планку для',       spine: 'moat', color: '#7AD9B6', order: 27,
                         blurb: 'Определяет, чем меряются все остальные, — а значит, во многом и ответ.' },
  defines_category:    { label: 'определяет категорию', verb: 'определяет категорию',    spine: 'moat', color: '#8FE0C0', order: 28,
                         blurb: 'Сам класс продукта появился потому, что появилось что в него ставить.' },

  // ── control ───────────────────────────────────────────────────────────
  controls_access_to:     { label: 'шлюзует',              verb: 'шлюзует доступ к',      spine: 'control', color: '#E5484D', order: 30,
                            blurb: 'Решает, кому и что можно продать. Не участник стека, а рубильник над ним.' },
  subject_to_restriction: { label: 'под ограничением',     verb: 'ограничен в',           spine: 'control', color: '#E06A6E', order: 31,
                            blurb: 'Рынок или продукт закрыт решением, а не отсутствием спроса.' },
  export_controlled_by:   { label: 'экспорт под контролем',verb: 'экспортно подконтролен',spine: 'control', color: '#CF3B45', order: 32,
                            blurb: 'Каждая поставка требует разрешения, которое выдают по одному случаю за раз.' },
  geopolitically_dependent:{ label: 'геополитически зависит',verb: 'геополитически зависит от',spine: 'control', color: '#EC8A80', order: 33,
                            blurb: 'Позиция держится на географии, которую нельзя переставить в разумный срок.' },

  // ── rivalry ───────────────────────────────────────────────────────────
  competes_with: { label: 'конкурирует',    verb: 'конкурирует с',  spine: 'rivalry', color: '#9A8FB8', order: 40,
                   blurb: 'Прямо борется за ту же долю тем же продуктом.' },
  threatens:     { label: 'угрожает',       verb: 'угрожает',       spine: 'rivalry', color: '#8A7EAE', order: 41,
                   blurb: 'Готовит замену, которой пока нет, но которая уже финансируется.' },
  could_disrupt: { label: 'может подорвать',verb: 'может подорвать',spine: 'rivalry', color: '#AFA4C8', order: 42,
                   blurb: 'Достаточно велик, чтобы его собственное решение переписало рынок.' },
};

// ── Spines — five colour families. The FIRST filter on the map. ──────────
// The two first gammas are v1's, character for character: the map has to stay
// recognisable as the same map.
export const SPINE_META = {
  physical: { label: 'Физика',          short: 'ФИЗ.',  color: '#5A93DE', order: 0,
              blurb: 'Что физически движется: материалы, станки, чипы, память, ток, стойки.' },
  capital:  { label: 'Капитал',         short: 'КАП.',  color: '#E0A340', order: 1,
              blurb: 'Кто платит и кто владеет: доли, долг, контракты, места в советах.' },
  moat:     { label: 'Ров',             short: 'РОВ',   color: '#3FB984', order: 2,
              blurb: 'Что запирает и что доказывает спрос: код, привычка, окупаемость.' },
  control:  { label: 'Контроль',        short: 'КОНТР.',color: '#E5484D', order: 3,
              blurb: 'Кто шлюзует доступ: экспортные правила, юрисдикции, проверки сделок.' },
  rivalry:  { label: 'Соперничество',   short: 'СОПЕРН.',color: '#9A8FB8', order: 4,
              blurb: 'Кто откусывает: прямые конкуренты и те, кто готовит замену.' },
};

// ── Source tiers 1–6 — «насколько твёрдо» СЛОВАМИ, не цифрой ─────────────
// v1 had five named tiers (filing / company_pr / …). The contract now numbers
// them, but a "тир 4" on screen tells a reader nothing, so the number is only
// ever a sort key — what the panel shows is the sentence.
export const TIER_META = {
  1: { label: 'Отчётность самой NVIDIA', short: '10-K · звонок · релиз', rank: 1, color: '#34D399',
       blurb: 'Годовой и квартальный отчёт, стенограммы звонков, пресс-релизы, патенты, презентации для инвесторов.' },
  2: { label: 'Официально от контрагента', short: 'релиз · документация', rank: 2, color: '#7FD8A8',
       blurb: 'Пресс-релизы и звонки другой стороны, документация продукта, партнёрские каталоги.' },
  3: { label: 'Прямая речь руководителей', short: 'сцена · интервью', rank: 3, color: '#A7D9BE',
       blurb: 'Выступления на конференциях, интервью, показания в Конгрессе — сказано принципалом, не пересказано.' },
  4: { label: 'Исследования и данные', short: 'статьи · базы', rank: 4, color: '#C7D89A',
       blurb: 'Научные статьи, лидерборды, отчёты аналитиков, базы данных о сделках.' },
  5: { label: 'Деловая пресса', short: 'Reuters · Bloomberg', rank: 5, color: '#FBBF24',
       blurb: 'Качественная деловая пресса и отраслевые рассылки — со слов источников, не из документа.' },
  6: { label: 'Третичное и сигналы', short: 'соцсети · блоги', rank: 6, color: '#94A3B8',
       blurb: 'Соцсети, форумы, блоги, видео. Годится как признак, не как доказательство.' },
};

// ── Confirmation status — the two-source rule, in words ──────────────────
export const STATUS_META = {
  confirmed:       { label: 'Подтверждено',        short: 'ПОДТВ.',   color: '#34D399', rank: 0,
                     blurb: 'Два и более источника высших тиров, либо отчётность плюс прямая речь.' },
  high_confidence: { label: 'Высокая уверенность', short: 'ВЫС. УВ.', color: '#A7D9BE', rank: 1,
                     blurb: 'Один источник высшего тира, либо два источника второго и третьего.' },
  signal:          { label: 'Сигнал',              short: 'СИГНАЛ',   color: '#94A3B8', rank: 2,
                     blurb: 'Один источник четвёртого тира и ниже, либо только косвенные признаки.' },
};

// ── Entity phase — where in its own life the position sits ───────────────
export const PHASE_META = {
  emerging:  { label: 'Зарождается',  short: 'ЗАРОЖД.', color: '#45C0D0', order: 0,
               blurb: 'Позиция только складывается: подтверждена, но ещё не проверена объёмом.' },
  scaling:   { label: 'Растёт',       short: 'РАСТЁТ',  color: '#49C2AE', order: 1,
               blurb: 'Позиция расширяется — доля и число связей растут прогон за прогоном.' },
  mature:    { label: 'Зрелая',       short: 'ЗРЕЛАЯ',  color: '#8E9BE6', order: 2,
               blurb: 'Позиция устоялась: меняется медленно и предсказуемо.' },
  at_risk:   { label: 'Под угрозой',  short: 'УГРОЗА',  color: '#E0A340', order: 3,
               blurb: 'Позиция под давлением: есть названная замена или названный риск.' },
  declining: { label: 'Уходит',       short: 'УХОДИТ',  color: '#E5484D', order: 4,
               blurb: 'Позиция сокращается — по объёму, по доступу или по значению.' },
};

// ── Risk level — the colour is restrained on purpose ─────────────────────
// A border or a dot, never a fill: half the entities carry a risk, and filling
// them would turn the panel into a traffic light.
export const RISK_META = {
  critical: { label: 'Критический', short: 'КРИТ.', color: '#E5484D', order: 0,
              blurb: 'Реализация обнуляет позицию, а не ухудшает её.' },
  high:     { label: 'Высокий',     short: 'ВЫС.',  color: '#E0A340', order: 1,
              blurb: 'Реализация заметно ослабляет позицию в пределах нескольких лет.' },
  medium:   { label: 'Средний',     short: 'СРЕД.', color: '#58ABCB', order: 2,
              blurb: 'Риск назван и управляем, срок отдалённый.' },
  low:      { label: 'Низкий',      short: 'НИЗК.', color: '#49C2AE', order: 3,
              blurb: 'Специфического риска в данных нет.' },
};

// Kind of risk on an edge, and its horizon.
export const RISK_TYPE_META = {
  geopolitical: 'геополитика',
  substitution: 'замещение',
  market:       'рынок',
  regulatory:   'регулирование',
  technical:    'технология',
  none:         null,
};

export const RISK_TIMELINE_META = {
  immediate: 'прямо сейчас',
  '1-2y':    'один-два года',
  '2-5y':    'два-пять лет',
  '5y+':     'пять лет и дальше',
  ongoing:   'постоянно',
  none:      null,
};

// ── Direction — where the source sits relative to the target ─────────────
export const DIRECTION_META = {
  upstream:      { label: 'вверх по стеку',  short: '↑',  blurb: 'Источник стоит выше по цепочке: получатель от него зависит.' },
  downstream:    { label: 'вниз по стеку',   short: '↓',  blurb: 'Источник кормит получателя: тот стоит ниже по цепочке.' },
  lateral:       { label: 'вбок',            short: '↔',  blurb: 'Стороны стоят на одном уровне — партнёры или соперники.' },
  bidirectional: { label: 'в обе стороны',   short: '⇄',  blurb: 'Зависимость взаимная: каждая сторона держит другую.' },
};

// ── Layer bands — five colour families over the orbit ────────────────────
// The band is the engine's (`layers[].band`); the palette is v1's, unchanged.
// Layers on the nucleus and control planes have no band at all — they take
// their colour from PLANE_META instead.
export const BAND_META = {
  1: { label: 'Вход',              color: '#6F93DE' },
  2: { label: 'Кремний',           color: '#5A93DE' },
  3: { label: 'Железо и ток',      color: '#49C2AE' },
  4: { label: 'Инфраструктура',    color: '#58ABCB' },
  5: { label: 'Софт и спрос',      color: '#8E9BE6' },
};

// ── Planes — the one geometric novelty over v1 ───────────────────────────
// A state does not stand between "память" and "системы". It stands OUTSIDE and
// gates the whole thing, and putting it in the ring would lie about the nature
// of the relation. Hence three planes rather than one.
export const PLANE_META = {
  nucleus: { label: 'Ядро',           short: 'ЯДРО',   color: '#C99B72', order: 0,
             blurb: 'Капитал: владеет стеком и финансирует его, сам в нём не стоя.' },
  orbit:   { label: 'Орбита',         short: 'ОРБИТА', color: null,      order: 1,
             blurb: 'Сам стек: по кольцу от сырья к приложениям, цвет — полоса слоя.' },
  control: { label: 'Внешняя дуга',   short: 'ДУГА',   color: '#B4707A', order: 2,
             blurb: 'Государства, ведомства и стандарты: они не стоят в стеке, они его шлюзуют.' },
};

// ── Layer concentration ──────────────────────────────────────────────────
export const CONCENTRATION_META = {
  monopoly:    { label: 'Монополия',    short: 'МОНОП.', color: '#E5484D', order: 0,
                 blurb: 'Один игрок держит слой. Отказ здесь останавливает всё, что выше.' },
  duopoly:     { label: 'Дуополия',     short: 'ДУОП.',  color: '#E8975E', order: 1,
                 blurb: 'Двое делят слой. Второй источник есть, но выбор из двух — это не рынок.' },
  oligopoly:   { label: 'Олигополия',   short: 'ОЛИГ.',  color: '#E0A340', order: 2,
                 blurb: 'Три-четыре игрока делят слой. Переключение возможно и стоит времени.' },
  competitive: { label: 'Конкурентный', short: 'КОНК.',  color: '#49C2AE', order: 3,
                 blurb: 'Много поставщиков, замена дешёвая. Узкого места здесь нет.' },
};

// ── Entity types — what kind of thing this is at all ─────────────────────
export const TYPE_META = {
  company:        { label: 'Компания' },
  geopolitical:   { label: 'Юрисдикция' },
  agency:         { label: 'Ведомство' },
  research_org:   { label: 'Исследовательская организация' },
  standards_body: { label: 'Консорциум стандартов' },
};

export const PUBLIC_PRIVATE_META = {
  public:     { label: 'ПУБЛИЧНАЯ' },
  private:    { label: 'ЧАСТНАЯ' },
  government: { label: 'ГОСУДАРСТВО' },
  academic:   { label: 'НЕКОММЕРЧЕСКАЯ' },
};

// ── Criticality rubric — four inputs, FIXED weights ──────────────────────
//   criticality = round(0.30·irreplaceability + 0.30·lockInDepth
//                     + 0.25·timeToReplace   + 0.15·strategicControl)
//
// The weights are frozen and the arithmetic is the engine's. This table only
// names the axes so the number is never a black box: a "95" beside «ни одна
// другая фабрика не делает 3 нм в объёме» is an argument; a "95" alone is a
// number nobody can argue with, which is the opposite of useful. The engine
// ships one line of reasoning per factor in `criticalityWhy` and the panel
// prints it right next to the digit.
export const CRITICALITY_FACTORS = [
  { key: 'irreplaceability', label: 'Незаменимость', weight: 0.30,
    question: 'Сколько компаний в мире реально могут сделать то же самое',
    blurb: '95+ монополия со рвом на семь лет и больше · 85+ дуополия · 75+ замены есть, но упираются во время и капитал · 50+ альтернативы ясны, преимущество в инерции · ниже 30 полные близнецы.' },
  { key: 'lockInDepth', label: 'Глубина замка', weight: 0.30,
    question: 'Сколько слоёв стека задевает эта зависимость',
    blurb: '95+ четыре слоя и больше · 85+ три · 75+ два · 65+ один-два с сильной зависимостью · ниже 30 один слой, меняется на лету.' },
  { key: 'timeToReplace', label: 'Срок замены', weight: 0.25,
    question: 'Если она исчезнет — за какой срок отрасль поднимет замену',
    blurb: '95+ семь лет и больше · 85+ пять-семь · 75+ три-пять · 65+ два-три · 50+ год-два · ниже 30 замена немедленная.' },
  { key: 'strategicControl', label: 'Рычаг контроля', weight: 0.15,
    question: 'Насколько NVIDIA может влиять на решения этой стороны',
    blurb: '95+ дочерняя структура или место в совете плюс крупные вложения · 85+ вложения от миллиарда плюс соглашение · 75+ сотни миллионов плюс совместная разработка · 50+ публичное партнёрство без денег · ниже 30 отношений нет или они враждебны.' },
];

/** Plain-Russian band for a 0–100 criticality score. Contract's own cuts. */
export function criticalityBand(c) {
  if (c == null) return { label: 'Не оценено', color: '#94A3B8' };
  if (c >= 90) return { label: 'Критично', color: '#E5484D' };
  if (c >= 75) return { label: 'Высоко', color: '#E0A340' };
  if (c >= 60) return { label: 'Средне', color: '#58ABCB' };
  if (c >= 45) return { label: 'Ниже среднего', color: '#7FA8C4' };
  return { label: 'Низко', color: '#49C2AE' };
}

/** Plain-Russian band for a 0–100 edge strength. */
export function strengthBand(s) {
  if (s == null) return { label: 'не оценена', color: '#94A3B8' };
  if (s >= 85) return { label: 'критическая', color: '#E5484D' };
  if (s >= 65) return { label: 'высокая', color: '#E0A340' };
  if (s >= 40) return { label: 'заметная', color: '#58ABCB' };
  return { label: 'слабая', color: '#49C2AE' };
}

/**
 * `substitutability` is an INVERSE scale — 0 means nothing can replace it —
 * and a bare «заменимость 5» reads as the exact opposite of what it means.
 * Every surface prints this sentence instead of the number alone.
 */
export function substitutabilityRead(v) {
  if (v == null) return null;
  if (v <= 15) return { label: 'заменить почти нечем', color: '#E5484D' };
  if (v <= 35) return { label: 'замена есть, но плохая', color: '#E0A340' };
  if (v <= 60) return { label: 'замена реальна, стоит времени', color: '#58ABCB' };
  return { label: 'заменяется свободно', color: '#49C2AE' };
}

// Default on-canvas edge threshold. Everything is IN the file; the map just
// starts quiet and the slider opens it back to 0. Entity panels ignore this.
export const DEFAULT_MIN_STRENGTH = 20;

// Months after which an unconfirmed edge/entity visibly fades.
const STALE_MONTHS = 6;

// ── Small helpers ────────────────────────────────────────────────────────
/** "2026-03" / "2026-03-14" → months elapsed since, against `asOf`. */
export function monthsSince(stamp, asOf) {
  if (!stamp || !asOf) return null;
  const p = (s) => {
    const m = String(s).match(/^(\d{4})-(\d{2})/);
    return m ? Number(m[1]) * 12 + Number(m[2]) : null;
  };
  const a = p(stamp), b = p(asOf);
  return a == null || b == null ? null : b - a;
}

/** 1–2 letter monogram for the logo fallback tile. */
function monogramOf(label) {
  const words = String(label || '').replace(/[^A-Za-zА-Яа-я0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Brand marks. Three sources, in order:
//   1. public/logos/ — the offline batch `npm run logos` already fetched for
//      the FLOW map. Many entities here (NVIDIA, Microsoft, Broadcom) are the
//      same legal entities, so they are matched by NAME against the manifest's
//      `alloc:<Name>` / `target:<Name>` keys and reused for free.
//   2. nvidiaEcosystemLogos.json — this dashboard's own id → domain side-car
//      (the contract ships no domain), resolved at runtime.
//   3. monogram tile.
const manifestByName = (() => {
  const m = new Map();
  Object.entries(logoManifest).forEach(([k, v]) => {
    const bare = k.replace(/^(alloc|target):/, '').trim().toLowerCase();
    if (bare && !m.has(bare)) m.set(bare, v);
  });
  return m;
})();

function logoUrlsFor(e) {
  const out = [];
  const push = (u) => { if (u && !out.includes(u)) out.push(u); };
  push(manifestByName.get(String(e.name || '').trim().toLowerCase()));
  (e.aliases || []).forEach(a => push(manifestByName.get(String(a).trim().toLowerCase())));
  const dom = logoDomains[e.id];
  if (dom) {
    push(`https://unavatar.io/${dom}?fallback=false`);
    push(`https://www.google.com/s2/favicons?sz=128&domain=${dom}`);
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════════════
// META — the header the shell reads before anything is drawn.
// ══════════════════════════════════════════════════════════════════════════
export const META = {
  schema: raw.schema || null,
  generated: raw.generated || null,
  asOf: raw.asOf || null,
  source: raw.source || 'fixture',
  ecosystem: raw.ecosystem || null,
  anchor: raw.anchor || null,
  // The ONLY behavioural difference between draft and real data: a banner and
  // a «черновик» mark on each quote. The engine's file says `"source":
  // "engine"` and both disappear by themselves — no code edit, no flag.
  isFixture: raw.source !== 'engine',
  totals: raw.totals || {
    entities: (raw.entities || []).length,
    edges: (raw.edges || []).length,
    layers: (raw.layers || []).length,
    cycles: (raw.cycles || []).length,
    techNodes: (raw.techNodes || []).length,
  },
  changelog: raw.changelog || null,
  disclaimer: 'Карта показывает позиции и зависимости, а не сделки. Каждая связь подтверждена дословной цитатой из источника; '
    + 'критичность и гравитация посчитаны движком по фиксированной рубрике. Не является инвестиционной рекомендацией.',
};

// ══════════════════════════════════════════════════════════════════════════
// buildLayers — read layers straight from a payload. NOTHING here is
// hard-coded: not the count, not the order, not a single identifier. Twelve
// layers or twenty, the map assembles.
//
// Parameterized on `raw` so the v3 network adapter can reuse the exact same
// taxonomy over its own file — the layers, roles, spines, tiers and rubric of
// v2 are frozen and MUST NOT be re-typed in a second place, or the two maps
// drift the first time one is edited.
// ══════════════════════════════════════════════════════════════════════════
export function buildLayers(raw) {
  const list = (raw.layers || []).map(l => {
    const conc = l.concentration || {};
    const level = CONCENTRATION_META[conc.level] ? conc.level : 'competitive';
    const plane = PLANE_META[l.plane] ? l.plane : 'orbit';
    const bandColor = plane === 'orbit'
      ? (BAND_META[l.band] || BAND_META[1]).color
      : PLANE_META[plane].color;
    return {
      ...l,
      plane,
      planeMeta: PLANE_META[plane],
      order: typeof l.order === 'number' ? l.order : 0,
      band: l.band ?? null,
      bandMeta: l.band != null ? BAND_META[l.band] || null : null,
      bandColor,
      concentration: { ...conc, level },
      concentrationMeta: CONCENTRATION_META[level],
    };
  }).sort((a, b) => a.order - b.order);

  const byId = new Map(list.map(l => [l.id, l]));
  const byPlane = { nucleus: [], orbit: [], control: [] };
  list.forEach(l => byPlane[l.plane].push(l));
  return { list, byId, byPlane };
}

export const LAYERS = buildLayers(raw);

// ══════════════════════════════════════════════════════════════════════════
// buildGraphFrom — one pass over a payload, everything the canvas needs. The
// v2 NVIDIA map calls buildGraph() (this file's own `raw`); the v3 network map
// calls buildGraphFrom(networkRaw) and then decorates the result with pivots
// and network metrics. One builder, two files, zero taxonomy drift.
// ══════════════════════════════════════════════════════════════════════════
export function buildGraph() {
  return buildGraphFrom(raw);
}

export function buildGraphFrom(raw) {
  const asOf = raw.asOf || null;
  const anchorId = raw.anchor || null;

  // ── Layers ─────────────────────────────────────────────────────────────
  const layers = buildLayers(raw).list.map(l => ({ ...l, entityCount: 0, members: [] }));
  const layerById = new Map(layers.map(l => [l.id, l]));

  const sectors = (raw.sectors || []).map(s => ({ ...s }));
  const sectorByKey = new Map(sectors.map(s => [s.key, s]));

  const techNodes = (raw.techNodes || []).map(t => ({ ...t }));
  const techById = new Map(techNodes.map(t => [t.id, t]));

  // ── Entities ───────────────────────────────────────────────────────────
  const entities = (raw.entities || []).map(e => {
    const role = ROLE_META[e.role] ? e.role : 'producer';
    const segs = (e.layers || [])
      .filter(l => layerById.has(l.layer))
      .map(l => ({ ...l, order: layerById.get(l.layer).order }))
      .sort((a, b) => a.order - b.order);
    // Defensive: an entity the engine ships with no usable layer still has to
    // land somewhere rather than vanish — pin it to its sector's layer, else
    // to the first layer in the payload.
    const fallback = sectorByKey.get(e.sector)?.layer || layers[0]?.id;
    const list = segs.length ? segs : [{
      layer: fallback, primary: true, criticality: e.criticality || 0,
      order: layerById.get(fallback)?.order ?? 0,
    }];
    const primarySeg = (layerById.has(e.primaryLayer) && list.find(l => l.layer === e.primaryLayer))
      || list.find(l => l.primary)
      || list.reduce((a, b) => (b.criticality > a.criticality ? b : a), list[0]);
    const layer = layerById.get(primarySeg.layer);
    const ageMonths = monthsSince(e.lastConfirmed, asOf);
    const risk = e.risk || null;

    return {
      ...e,
      role,
      roleMeta: ROLE_META[role],
      typeMeta: TYPE_META[e.type] || null,
      phaseMeta: PHASE_META[e.phase] || null,
      publicMeta: PUBLIC_PRIVATE_META[e.publicPrivate] || null,
      segments: list,
      primaryLayer: primarySeg.layer,
      primaryOrder: primarySeg.order,
      plane: layer?.plane || 'orbit',
      multiLayer: list.length > 1,
      criticality: typeof e.criticality === 'number' ? e.criticality : primarySeg.criticality || 0,
      band: layer?.band ?? null,
      color: layer?.bandColor || ROLE_META[role].color,
      sectorLabel: sectorByKey.get(e.sector)?.label || e.sector || '—',
      tech: (e.techNodes || []).map(id => techById.get(id)).filter(Boolean),
      risk,
      riskMeta: risk?.geopolitical ? RISK_META[risk.geopolitical] || null : null,
      // The anchor is the centre of the question. It gets exactly ONE new
      // visual privilege — its label never hides at any zoom — and nothing else.
      isAnchor: !!anchorId && e.id === anchorId,
      // Ageing is a DISPLAY rule over the engine's own lastConfirmed. No data
      // is changed; the entity just stops claiming to be current.
      ageMonths,
      faded: !!e.stale || (ageMonths != null && ageMonths > STALE_MONTHS),
      logoUrls: logoUrlsFor(e),
      monogram: monogramOf(e.name),
      searchUrl: `https://duckduckgo.com/?q=${encodeURIComponent(e.name || '')}`,
      // The logo side-car is `id -> domain`, and that domain is also the
      // entity's own site — so the panel gets a real website link for free,
      // with no contract field and no guessed URL. Where there is no entry
      // there is no chip, never a guess.
      site: logoDomains[e.id] ? `https://${logoDomains[e.id]}` : null,
      // filled by the layout pass
      x: 0, y: 0,
    };
  });
  const entityById = new Map(entities.map(e => [e.id, e]));
  const anchor = anchorId ? entityById.get(anchorId) || null : null;

  layers.forEach(l => {
    const members = entities
      .filter(e => e.segments.some(s => s.layer === l.id))
      .sort((a, b) => critIn(b, l.id) - critIn(a, l.id));
    l.members = members.map(e => e.id);
    l.entityCount = members.length;
  });

  // ── Edges. A dangling reference is DROPPED, loudly — the contract forbids
  // it, and half-drawing it would be worse than not drawing it at all. ────
  const dropped = [];
  const edges = [];
  (raw.edges || []).forEach(e => {
    if (!entityById.has(e.source) || !entityById.has(e.target)) { dropped.push(e.id); return; }
    const type = EDGE_TYPE_META[e.type] ? e.type : 'supplies';
    const meta = EDGE_TYPE_META[type];
    // Spine comes from the engine — it is DERIVED FROM TYPE upstream and we
    // only paint it. The type's own spine is a fallback for a malformed row.
    const spine = SPINE_META[e.spine] ? e.spine : meta.spine;
    const evidence = Array.isArray(e.evidence) ? e.evidence : [];
    const confirmed = typeof e.confirmedSources === 'number' ? e.confirmedSources : evidence.length;
    const tier = TIER_META[e.sourceTier] ? e.sourceTier
      : (evidence.length ? Math.min(...evidence.map(s => s.tier || 6)) : 6);
    const status = STATUS_META[e.status] ? e.status : 'signal';
    const ageMonths = monthsSince(e.lastConfirmed, asOf);
    const risk = e.risk || null;

    edges.push({
      ...e,
      type,
      typeMeta: meta,
      typeLabel: meta.label,
      verb: meta.verb,
      spine,
      spineMeta: SPINE_META[spine],
      color: meta.color,
      direction: DIRECTION_META[e.direction] ? e.direction : 'lateral',
      directionMeta: DIRECTION_META[e.direction] || DIRECTION_META.lateral,
      sourceTier: tier,
      tierMeta: TIER_META[tier],
      status,
      statusMeta: STATUS_META[status],
      strength: typeof e.strength === 'number' ? e.strength : 0,
      lockInDepth: typeof e.lockInDepth === 'number' ? e.lockInDepth : null,
      substitutability: typeof e.substitutability === 'number' ? e.substitutability : null,
      confirmedSources: confirmed,
      evidence,
      risk,
      riskMeta: risk?.level ? RISK_META[risk.level] || null : null,
      riskTypeLabel: risk?.type ? RISK_TYPE_META[risk.type] || null : null,
      riskTimelineLabel: risk?.timeline ? RISK_TIMELINE_META[risk.timeline] || null : null,
      techNode: e.techNode || null,
      techMeta: e.techNode ? techById.get(e.techNode) || null : null,
      ageMonths,
      faded: status === 'signal' || (ageMonths != null && ageMonths > STALE_MONTHS),
      // force-graph mutates source/target into entity objects; keep the ids.
      sourceId: e.source,
      targetId: e.target,
    });
  });
  if (dropped.length && typeof console !== 'undefined') {
    console.warn(`[nvidiaEcosystem] ${dropped.length} рёбер с висячей ссылкой пропущено:`, dropped);
  }
  const edgeById = new Map(edges.map(e => [e.id, e]));

  // ── Cycles. Engine-detected; we only resolve the ids it named. ─────────
  const CYCLE_META = {
    sales:     { label: 'Контур сбыта',          color: '#E5484D' },
    financing: { label: 'Контур финансирования', color: '#E0A340' },
    lockin:    { label: 'Контур замка',          color: '#3FB984' },
  };
  const cycles = (raw.cycles || []).map(c => {
    const meta = CYCLE_META[c.type] || CYCLE_META.sales;
    return {
      ...c,
      edgeSet: new Set((c.edges || []).filter(id => edgeById.has(id))),
      entitySet: new Set((c.path || []).filter(id => entityById.has(id))),
      typeLabel: meta.label,
      color: meta.color,
    };
  }).filter(c => c.edgeSet.size > 0);

  const cycleEntities = new Set();
  const cycleEdges = new Map();          // edge id → cycle
  cycles.forEach(c => {
    c.entitySet.forEach(id => cycleEntities.add(id));
    c.edgeSet.forEach(id => { if (!cycleEdges.has(id)) cycleEdges.set(id, c); });
  });

  // ── Per-entity roll-ups the panel reads (counts only — no scoring) ─────
  entities.forEach(e => { e.upCount = 0; e.downCount = 0; e.onCycle = cycleEntities.has(e.id); });
  edges.forEach(e => {
    entityById.get(e.target).upCount += 1;      // who this entity depends ON
    entityById.get(e.source).downCount += 1;    // who depends on this entity
  });

  const stats = {
    entityCount: entities.length,
    edgeCount: edges.length,
    layerCount: layers.length,
    cycleCount: cycles.length,
    multiLayerCount: entities.filter(e => e.multiLayer).length,
    staleCount: entities.filter(e => e.faded).length,
    signalCount: edges.filter(e => e.status === 'signal').length,
    criticalRiskCount: edges.filter(e => e.risk?.level === 'critical').length,
    maxStrength: Math.max(1, ...edges.map(e => e.strength || 0)),
  };

  return {
    schema: raw.schema || null,
    generated: raw.generated || null,
    asOf,
    // Source/isFixture come from the PASSED payload, not the module's META —
    // the network adapter passes its own file and needs its own draft flag.
    source: raw.source || 'fixture',
    isFixture: raw.source !== 'engine',
    anchorId, anchor,
    layers, layerById, layersByPlane: {
      nucleus: layers.filter(l => l.plane === 'nucleus'),
      orbit:   layers.filter(l => l.plane === 'orbit'),
      control: layers.filter(l => l.plane === 'control'),
    },
    sectors, sectorByKey,
    entities, entityById,
    edges, edgeById,
    techNodes, techById,
    cycles, cycleEntities, cycleEdges,
    stats,
  };
}

/** Criticality of `entity` INSIDE a given layer. */
export function critIn(entity, layerId) {
  const s = (entity.segments || []).find(x => x.layer === layerId);
  return s ? (s.criticality || 0) : 0;
}

/**
 * Adjacency, both directions, sorted by strength.
 *   up   — edges INTO the entity: who it depends on.
 *   down — edges OUT of the entity: who depends on it.
 * No threshold here: the panel always shows the full list; only the CANVAS
 * filters by strength.
 */
export function buildAdjacency(edges) {
  const up = new Map(), down = new Map();
  const push = (m, k, v) => { const list = m.get(k); if (list) list.push(v); else m.set(k, [v]); };
  edges.forEach(e => {
    push(up, e.target, e);
    push(down, e.source, e);
  });
  const bys = (a, b) => (b.strength || 0) - (a.strength || 0);
  up.forEach(list => list.sort(bys));
  down.forEach(list => list.sort(bys));
  return {
    up, down,
    of: (id) => ({ up: up.get(id) || [], down: down.get(id) || [] }),
  };
}
