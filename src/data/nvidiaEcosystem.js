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
// Every label below is declared in BOTH languages and resolved on access, so
// call sites keep reading a plain `.label`. `npm run i18n:check` fails the
// build if a pair is ever left half-filled.
import { bi, biMap } from '../lib/bi.js';
import { computeWeights } from './ecoWeight.js';
// The systemic-weight display taxonomy travels with the rest of the frozen
// taxonomy: components import it from whichever adapter they render.
export { WEIGHT_FACTORS, weightBand, pointsOf } from './ecoWeight.js';

// ── Roles — the second dimension, orthogonal to the layer ────────────────
// Told apart by SHAPE as well as colour (colour alone carries the layer band),
// so the map still reads for a colour-blind eye and in print. `shape` is what
// the legend draws; on the canvas the tile itself is frozen, so the role rides
// the tile's RIM STYLE — see ROLE_DASH in EcoGraph.
export const ROLE_META = {
  producer: bi({
    label: ['Производитель', 'Maker'],
    short: ['ПРОИЗВ.', 'MAKER'],
    blurb: ['Делает физическую вещь: станок, пластину, чип, память, стойку, коммутатор.',
            'Makes a physical thing: a tool, a wafer, a chip, memory, a rack, a switch.'],
  }, { color: '#6F93DE', shape: 'square', order: 0 }),
  platform: bi({
    label: ['Платформа', 'Platform'],
    short: ['ПЛАТФ.', 'PLATF.'],
    blurb: ['Стандарт, софт или лицензия внутри чужого продукта — власть без выручки с железа.',
            "A standard, software or licence inside someone else's product — power without hardware revenue."],
  }, { color: '#A46FD6', shape: 'hex', order: 1 }),
  operator: bi({
    label: ['Оператор', 'Operator'],
    short: ['ОПЕРАТ.', 'OPER.'],
    blurb: ['Эксплуатирует актив: площадки, облака, станции. Владеет тем, что уже построено.',
            'Runs the asset: sites, clouds, plants. Owns what has already been built.'],
  }, { color: '#49C2AE', shape: 'rounded', order: 2 }),
  demand: bi({
    label: ['Спрос', 'Demand'],
    short: ['СПРОС', 'DEMAND'],
    blurb: ['Тот, ради кого построено остальное: лаборатории и бизнес, который за это платит.',
            'The reason the rest exists: the labs, and the businesses paying for it.'],
  }, { color: '#8E9BE6', shape: 'circle', order: 3 }),
  capital: bi({
    label: ['Капитал', 'Capital'],
    short: ['КАПИТАЛ', 'CAPITAL'],
    blurb: ['Владеет стеком и финансирует его, сам в нём не стоя. Ядро молекулы.',
            'Owns and funds the stack without standing in it. The nucleus of the molecule.'],
  }, { color: '#C99B72', shape: 'diamond', order: 4 }),
  state: bi({
    label: ['Государство', 'State'],
    short: ['ГОСУД.', 'STATE'],
    blurb: ['Юрисдикция, ведомство или консорциум стандартов: не участник стека, а его шлюз.',
            'A jurisdiction, agency or standards body: not a participant in the stack but its gate.'],
  }, { color: '#B4707A', shape: 'star', order: 5 }),
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
// `up` / `down` are what the RELATION LISTS print. Both always describe the
// COUNTERPARTY — the name the tag sits next to — never the entity whose panel
// is open. That one rule is the whole fix: a tag like «вкладывается в» left the
// object dangling, so «Microsoft вкладывается в» could be read either way
// round. «Вкладывает сюда» / «получает вложения» cannot.
//   up   — counterparty is the edge's SOURCE (it acts on the open entity)
//   down — counterparty is the edge's TARGET (the open entity acts on it)
// Symmetric relations (partnership, rivalry, co-design) carry the same text in
// both, because there is no direction to disambiguate.
export const EDGE_TYPE_META = {
  // ── physical ──────────────────────────────────────────────────────────
  manufactures: bi({
    label: ['производит', 'manufactures'],
    verb:  ['производит', 'manufactures'],
    up:    ['производит по заказу', 'builds to order'],
    down:  ['заказывает производство', 'orders production'],
    blurb: ['Физически изготавливает продукт другой стороны на своих линиях.',
            "Physically builds the other side's product on its own lines."],
  }, { spine: 'physical', color: '#5A93DE', order: 0 }),
  supplies: bi({
    label: ['поставляет', 'supplies'],
    verb:  ['поставляет', 'supplies'],
    up:    ['поставляет сюда', 'supplies this'],
    down:  ['получает поставки', 'is supplied by'],
    blurb: ['Критический физический вход: без него продукт получателя не выпускается.',
            "A critical physical input: without it the recipient's product does not ship."],
  }, { spine: 'physical', color: '#6F93DE', order: 1 }),
  packages: bi({
    label: ['упаковывает', 'packages'],
    verb:  ['упаковывает', 'packages'],
    up:    ['упаковывает чипы', 'packages the dies'],
    down:  ['отдаёт на упаковку', 'sends out for packaging'],
    blurb: ['Сажает кристалл и память на одну подложку — отдельный дефицитный этап.',
            'Seats die and memory on one substrate — a scarce step of its own.'],
  }, { spine: 'physical', color: '#58ABCB', order: 2 }),
  integrates: bi({
    label: ['собирает', 'integrates'],
    verb:  ['собирает', 'integrates'],
    up:    ['собирает системы', 'builds the systems'],
    down:  ['отдаёт на сборку', 'has systems built'],
    blurb: ['Собирает из чужих компонентов готовую систему под конкретного заказчика.',
            "Assembles others' components into a finished system for a named buyer."],
  }, { spine: 'physical', color: '#4FB4C9', order: 3 }),
  delivers_to: bi({
    label: ['отгружает', 'ships to'],
    verb:  ['отгружает', 'ships to'],
    up:    ['отгружает сюда', 'ships here'],
    down:  ['принимает отгрузки', 'receives shipments'],
    blurb: ['Прямая поставка продукта покупателю.',
            'Direct delivery of the product to the buyer.'],
  }, { spine: 'physical', color: '#45C0D0', order: 4 }),
  enables: bi({
    label: ['делает возможным', 'enables'],
    verb:  ['делает возможным', 'enables'],
    up:    ['делает это возможным', 'makes this possible'],
    down:  ['работает благодаря этому', 'works because of this'],
    blurb: ['Без этого другая сторона не может ни спроектировать, ни включить свой продукт.',
            'Without it the other side can neither design nor switch on its product.'],
  }, { spine: 'physical', color: '#49C2AE', order: 5 }),
  co_designs: bi({
    label: ['проектирует вместе', 'co-designs'],
    verb:  ['проектирует вместе с', 'co-designs with'],
    up:    ['проектирует вместе', 'co-designed'],
    down:  ['проектирует вместе', 'co-designed'],
    blurb: ['Обе стороны вкладывают инженерию: продукт спроектирован под другого.',
            'Both sides put engineering in: the product is designed around the other.'],
  }, { spine: 'physical', color: '#3FA9C4', order: 6 }),
  optimizes_for: bi({
    label: ['затачивает под', 'optimised for'],
    verb:  ['затачивает под', 'is optimised for'],
    up:    ['заточен под это', 'tuned for this'],
    down:  ['целевая платформа', 'is the target platform'],
    blurb: ['Продукт подогнан под чужую платформу и на другой работает хуже.',
            "The product is fitted to someone else's platform and runs worse anywhere else."],
  }, { spine: 'physical', color: '#52C6BC', order: 7 }),

  // ── capital ───────────────────────────────────────────────────────────
  invests_in: bi({
    label: ['вкладывается', 'invests'],
    verb:  ['вкладывается в', 'invests in'],
    up:    ['вкладывает сюда', 'invests here'],
    down:  ['получает вложения', 'takes investment from'],
    blurb: ['Доля в капитале — с контролем или без.',
            'An equity stake, controlling or not.'],
  }, { spine: 'capital', color: '#E0A340', order: 10 }),
  funded_by: bi({
    label: ['финансируется', 'funded by'],
    verb:  ['получает деньги от', 'is funded by'],
    up:    ['финансирует', 'funds this'],
    down:  ['получает финансирование', 'is funded by'],
    blurb: ['Долг или проектное финансирование под стройку.',
            'Debt or project finance behind the build-out.'],
  }, { spine: 'capital', color: '#E8975E', order: 11 }),
  board_seat: bi({
    label: ['место в совете', 'board seat'],
    verb:  ['сидит в совете', 'sits on the board of'],
    up:    ['занимает место в совете', 'holds a board seat'],
    down:  ['отдаёт место в совете', 'gives up a board seat'],
    blurb: ['Прямое участие в решениях, а не только в доходе.',
            'A direct say in decisions, not only a share of the return.'],
  }, { spine: 'capital', color: '#D98C55', order: 12 }),
  strategic_partner: bi({
    label: ['стратегический союз', 'strategic alliance'],
    verb:  ['в союзе с', 'is allied with'],
    up:    ['стратегический союз', 'strategic alliance'],
    down:  ['стратегический союз', 'strategic alliance'],
    blurb: ['Дорожные карты согласованы на годы вперёд, а не разовый заказ.',
            'Roadmaps aligned years ahead, not a one-off order.'],
  }, { spine: 'capital', color: '#C99B72', order: 13 }),
  hedges_against: bi({
    label: ['страхуется', 'hedges'],
    verb:  ['страхуется от', 'hedges against'],
    up:    ['страхуется через это', 'hedges through this'],
    down:  ['служит страховкой', 'serves as the hedge'],
    blurb: ['Вложение не ради дохода, а чтобы дыра в обороне не открылась.',
            'An investment made not for return but to keep a gap from opening.'],
  }, { spine: 'capital', color: '#D9B36A', order: 14 }),
  diversifies_supply: bi({
    label: ['второй источник', 'second source'],
    verb:  ['страхует поставку', 'second-sources'],
    up:    ['второй источник', 'second source'],
    down:  ['второй источник', 'second source'],
    blurb: ['Поставщик, заведённый ради переговорной позиции, а не ради объёма.',
            'A supplier kept for negotiating leverage rather than for volume.'],
  }, { spine: 'capital', color: '#C2A36B', order: 15 }),
  customer_of: bi({
    label: ['покупает', 'buys from'],
    verb:  ['покупает у', 'buys from'],
    up:    ['покупает здесь', 'buys here'],
    down:  ['продаёт сюда', 'sells here'],
    blurb: ['Платит деньги — то есть кормит другую сторону выручкой.',
            'Pays money — that is, feeds the other side revenue.'],
  }, { spine: 'capital', color: '#E8B268', order: 16 }),

  // ── moat ──────────────────────────────────────────────────────────────
  validates_demand: bi({
    label: ['доказывает спрос', 'validates demand'],
    verb:  ['доказывает спрос на', 'validates demand for'],
    up:    ['доказывает спрос', 'validates the demand'],
    down:  ['выигрывает от спроса', 'benefits from that demand'],
    blurb: ['Своим результатом доказал, что вычисления такого масштаба вообще нужны.',
            'Its results proved compute at this scale is needed at all.'],
  }, { spine: 'moat', color: '#3FB984', order: 20 }),
  proves_roi: bi({
    label: ['доказывает окупаемость', 'proves the returns'],
    verb:  ['доказывает окупаемость', 'proves the returns on'],
    up:    ['доказывает окупаемость', 'proves the returns'],
    down:  ['на нём зарабатывают', 'customers earn on it'],
    blurb: ['Показывает, что на этом зарабатывает не только продавец.',
            'Shows that someone other than the seller is making money on it.'],
  }, { spine: 'moat', color: '#4FC49A', order: 21 }),
  proves_use_case: bi({
    label: ['доказывает применимость', 'proves the use case'],
    verb:  ['показывает, зачем нужен', 'shows what it is for'],
    up:    ['показывает применение', 'proves the use case'],
    down:  ['получает применение', 'gains the use case'],
    blurb: ['Доводит спрос до обычных рабочих процессов, а не только лабораторий.',
            'Carries demand into ordinary workflows, not just labs.'],
  }, { spine: 'moat', color: '#5CCFA6', order: 22 }),
  locks_in_developers: bi({
    label: ['запирает разработчиков', 'locks in developers'],
    verb:  ['запирает разработчиков на', 'locks developers into'],
    up:    ['запирает разработчиков', 'locks developers in'],
    down:  ['разработчики заперты', 'its developers are locked in'],
    blurb: ['Написанный код по умолчанию зовёт этот слой, и переписывать его никто не станет.',
            'Code written defaults to this layer, and nobody will rewrite it.'],
  }, { spine: 'moat', color: '#2FA873', order: 23 }),
  locks_in_platforms: bi({
    label: ['запирает платформы', 'locks in platforms'],
    verb:  ['запирает платформы на', 'locks platforms into'],
    up:    ['запирает платформы', 'locks platforms in'],
    down:  ['платформа заперта', 'the platform is locked in'],
    blurb: ['Уйти значит потерять доступ ко всему, что уже собрано вокруг.',
            'Leaving means losing access to everything already built around it.'],
  }, { spine: 'moat', color: '#37B07C', order: 24 }),
  path_dependent_on: bi({
    label: ['завязан на', 'path-dependent on'],
    verb:  ['завязан на', 'is path-dependent on'],
    up:    ['завязан на это', 'depends on this path'],
    down:  ['на него завязаны', 'others depend on this path'],
    blurb: ['Накопленное решение прошлого не отыгрывается назад без переписывания всего.',
            'A past decision that cannot be undone without rewriting everything.'],
  }, { spine: 'moat', color: '#46BE8E', order: 25 }),
  standardizes_on: bi({
    label: ['стандартизован на', 'standardised on'],
    verb:  ['стандартизован на', 'is standardised on'],
    up:    ['общий стандарт', 'shared standard'],
    down:  ['общий стандарт', 'shared standard'],
    blurb: ['Выбрал одну платформу по умолчанию и строит вокруг неё.',
            'Picked one platform as the default and builds around it.'],
  }, { spine: 'moat', color: '#63D0B0', order: 26 }),
  sets_benchmark: bi({
    label: ['задаёт планку', 'sets the benchmark'],
    verb:  ['задаёт планку для', 'sets the benchmark for'],
    up:    ['задаёт планку', 'sets the benchmark'],
    down:  ['по нему меряют', 'is measured against it'],
    blurb: ['Определяет, чем меряются все остальные, — а значит, во многом и ответ.',
            'Defines what everyone else is measured against — and so, largely, the answer.'],
  }, { spine: 'moat', color: '#7AD9B6', order: 27 }),
  defines_category: bi({
    label: ['определяет категорию', 'defines the category'],
    verb:  ['определяет категорию', 'defines the category'],
    up:    ['определяет категорию', 'defines the category'],
    down:  ['живёт в этой категории', 'lives in that category'],
    blurb: ['Сам класс продукта появился потому, что появилось что в него ставить.',
            'The product class exists because there was finally something to put in it.'],
  }, { spine: 'moat', color: '#8FE0C0', order: 28 }),

  // ── control ───────────────────────────────────────────────────────────
  controls_access_to: bi({
    label: ['шлюзует', 'gates'],
    verb:  ['шлюзует доступ к', 'gates access to'],
    up:    ['контролирует доступ', 'controls access'],
    down:  ['доступ под контролем', 'its access is controlled'],
    blurb: ['Решает, кому и что можно продать. Не участник стека, а рубильник над ним.',
            'Decides who may be sold what. Not a participant in the stack but a switch above it.'],
  }, { spine: 'control', color: '#E5484D', order: 30 }),
  subject_to_restriction: bi({
    label: ['под ограничением', 'under restriction'],
    verb:  ['ограничен в', 'is restricted in'],
    up:    ['закрытый рынок', 'closed market'],
    down:  ['ограничен в продажах', 'restricted from selling'],
    blurb: ['Рынок или продукт закрыт решением, а не отсутствием спроса.',
            'A market or product closed by decision, not by absent demand.'],
  }, { spine: 'control', color: '#E06A6E', order: 31 }),
  export_controlled_by: bi({
    label: ['экспорт под контролем', 'export-controlled'],
    verb:  ['экспортно подконтролен', 'is export-controlled by'],
    up:    ['контролирует экспорт', 'controls the exports'],
    down:  ['экспорт ограничен', 'its exports are controlled'],
    blurb: ['Каждая поставка требует разрешения, которое выдают по одному случаю за раз.',
            'Every shipment needs a licence, granted one case at a time.'],
  }, { spine: 'control', color: '#CF3B45', order: 32 }),
  geopolitically_dependent: bi({
    label: ['геополитически зависит', 'geopolitically dependent'],
    verb:  ['геополитически зависит от', 'is geopolitically dependent on'],
    up:    ['ключевая география', 'critical geography'],
    down:  ['зависит от географии', 'depends on that geography'],
    blurb: ['Позиция держится на географии, которую нельзя переставить в разумный срок.',
            'The position rests on geography that cannot be moved in any reasonable time.'],
  }, { spine: 'control', color: '#EC8A80', order: 33 }),

  // ── rivalry ───────────────────────────────────────────────────────────
  competes_with: bi({
    label: ['конкурирует', 'competes'],
    verb:  ['конкурирует с', 'competes with'],
    up:    ['прямой конкурент', 'direct competitor'],
    down:  ['прямой конкурент', 'direct competitor'],
    blurb: ['Прямо борется за ту же долю тем же продуктом.',
            'Fights head-on for the same share with the same product.'],
  }, { spine: 'rivalry', color: '#9A8FB8', order: 40 }),
  threatens: bi({
    label: ['угрожает', 'threatens'],
    verb:  ['угрожает', 'threatens'],
    up:    ['угрожает', 'threatens this'],
    down:  ['находится под угрозой', 'is under threat from it'],
    blurb: ['Готовит замену, которой пока нет, но которая уже финансируется.',
            'Preparing a replacement that does not exist yet but is already funded.'],
  }, { spine: 'rivalry', color: '#8A7EAE', order: 41 }),
  could_disrupt: bi({
    label: ['может подорвать', 'could disrupt'],
    verb:  ['может подорвать', 'could disrupt'],
    up:    ['может подорвать', 'could disrupt this'],
    down:  ['может быть подорван', 'could be disrupted by it'],
    blurb: ['Достаточно велик, чтобы его собственное решение переписало рынок.',
            'Big enough that its own decision could rewrite the market.'],
  }, { spine: 'rivalry', color: '#AFA4C8', order: 42 }),
};

// ── Spines — five colour families. The FIRST filter on the map. ──────────
// The two first gammas are v1's, character for character: the map has to stay
// recognisable as the same map.
export const SPINE_META = {
  physical: bi({
    label: ['Физика', 'Physical'],
    short: ['ФИЗ.', 'PHYS.'],
    blurb: ['Что физически движется: материалы, станки, чипы, память, ток, стойки.',
            'What physically moves: materials, tools, chips, memory, power, racks.'],
  }, { color: '#5A93DE', order: 0 }),
  capital: bi({
    label: ['Капитал', 'Capital'],
    short: ['КАП.', 'CAP.'],
    blurb: ['Кто платит и кто владеет: доли, долг, контракты, места в советах.',
            'Who pays and who owns: stakes, debt, contracts, board seats.'],
  }, { color: '#E0A340', order: 1 }),
  // «Ров» was a literal translation of "moat" — nobody says it in Russian
  // business prose, and it stopped the sentence dead for anyone who had not
  // read the English. «Барьер» is the plain word for the same idea, and it
  // matches the lexicon that rewrites the engine's own prose
  // (aiEcosystemNetwork.js § RU_PLAIN), so the map speaks one vocabulary.
  moat: bi({
    label: ['Барьер', 'Moat'],
    short: ['БАРЬЕР', 'MOAT'],
    blurb: ['Что запирает и что доказывает спрос: код, привычка, окупаемость.',
            'What locks in and what proves demand: code, habit, returns.'],
  }, { color: '#3FB984', order: 2 }),
  control: bi({
    label: ['Контроль', 'Control'],
    short: ['КОНТР.', 'CTRL'],
    blurb: ['Кто шлюзует доступ: экспортные правила, юрисдикции, проверки сделок.',
            'Who gates access: export rules, jurisdictions, deal reviews.'],
  }, { color: '#E5484D', order: 3 }),
  rivalry: bi({
    label: ['Соперничество', 'Rivalry'],
    short: ['СОПЕРН.', 'RIVAL'],
    blurb: ['Кто откусывает: прямые конкуренты и те, кто готовит замену.',
            'Who takes a bite: direct competitors and those preparing a replacement.'],
  }, { color: '#9A8FB8', order: 4 }),
};

// ── Source tiers 1–6 — «насколько твёрдо» СЛОВАМИ, не цифрой ─────────────
// v1 had five named tiers (filing / company_pr / …). The contract now numbers
// them, but a "тир 4" on screen tells a reader nothing, so the number is only
// ever a sort key — what the panel shows is the sentence.
//
// CONTRACT /4 MOVED THE POINT OF REFERENCE. The ladder is still six rungs, but
// it no longer measures distance from NVIDIA. Тир 1 used to mean «это сказала
// NVIDIA»; it now means «это сказала САМА сущность, о которой идёт речь» — the
// engine resolves the publisher against `entities[].domains` and `.cik`, so
// each profile is graded against its own subject. Тир 2 is the OTHER END of
// the relation speaking, not the counterparty-of-NVIDIA. That is why a profile
// can now be «полностью на своих источниках» at all: see `sourcing` in the
// panel, where tier 1 and `selfSourced` are the same claim counted twice.
export const TIER_META = {
  1: bi({
    label: ['Отчётность самой сущности', "The subject's own filings"],
    short: ['10-K · звонок · релиз', '10-K · call · release'],
    blurb: ['Опубликовано самой сущностью, о которой идёт речь: годовой и квартальный отчёт, стенограммы звонков, пресс-релизы, патенты, презентации для инвесторов.',
            'Published by the subject itself: annual and quarterly reports, call transcripts, press releases, patents, investor decks.'],
  }, { rank: 1, color: '#34D399' }),
  2: bi({
    label: ['Официально от второго конца', 'Official, from the other end'],
    short: ['релиз · документация', 'release · product docs'],
    blurb: ['Опубликовано второй стороной связи или другой сущностью карты: релизы и звонки, документация продукта, партнёрские каталоги.',
            'Published by the other end of the link, or by another entity on the map: releases and calls, product documentation, partner directories.'],
  }, { rank: 2, color: '#7FD8A8' }),
  3: bi({
    label: ['Прямая речь руководителей', 'Executives on the record'],
    short: ['сцена · интервью', 'stage · interview'],
    blurb: ['Выступления на конференциях, интервью, показания в Конгрессе — сказано принципалом, не пересказано.',
            'Conference talks, interviews, congressional testimony — said by the principal, not relayed.'],
  }, { rank: 3, color: '#A7D9BE' }),
  4: bi({
    label: ['Исследования и данные', 'Research and data'],
    short: ['статьи · базы', 'papers · databases'],
    blurb: ['Научные статьи, лидерборды, отчёты аналитиков, базы данных о сделках.',
            'Academic papers, leaderboards, analyst reports, deal databases.'],
  }, { rank: 4, color: '#C7D89A' }),
  5: bi({
    label: ['Деловая пресса', 'Business press'],
    short: ['Reuters · Bloomberg', 'Reuters · Bloomberg'],
    blurb: ['Качественная деловая пресса и отраслевые рассылки — со слов источников, не из документа.',
            'Quality business press and trade newsletters — sourced from people, not from a document.'],
  }, { rank: 5, color: '#FBBF24' }),
  6: bi({
    label: ['Третичное и сигналы', 'Tertiary and signals'],
    short: ['соцсети · блоги', 'social · blogs'],
    blurb: ['Соцсети, форумы, блоги, видео. Годится как признак, не как доказательство.',
            'Social media, forums, blogs, video. Good as an indication, not as proof.'],
  }, { rank: 6, color: '#94A3B8' }),
};

// ── Confirmation status — the two-source rule, in words ──────────────────
//
// `bilateral` is the rung contract /4 added ON TOP of `confirmed`, and it is
// the strongest claim the map can make about a relationship: BOTH ends state
// it in their OWN documents. Two top-tier sources can both belong to one side;
// bilateral cannot. `rank` is the sort key everywhere (0 = strongest), so
// inserting a rung above `confirmed` renumbers the three below it.
export const STATUS_META = {
  bilateral: bi({
    label: ['Подтверждено обеими сторонами', 'Confirmed by both sides'],
    short: ['ОБЕ СТОРОНЫ', 'BOTH SIDES'],
    blurb: ['Оба конца связи утверждают её в собственных документах. Сильнее, чем два источника высших тиров: те могут оказаться с одной стороны, эти — нет.',
            'Both ends of the link state it in their own documents. Stronger than two top-tier sources: those can both belong to one side, these cannot.'],
  }, { color: '#22C55E', rank: 0 }),
  confirmed: bi({
    label: ['Подтверждено', 'Confirmed'],
    short: ['ПОДТВ.', 'CONF.'],
    blurb: ['Два и более источника высших тиров, либо отчётность плюс прямая речь.',
            'Two or more top-tier sources, or a filing plus an on-the-record statement.'],
  }, { color: '#34D399', rank: 1 }),
  high_confidence: bi({
    label: ['Высокая уверенность', 'High confidence'],
    short: ['ВЫС. УВ.', 'HIGH'],
    blurb: ['Один источник высшего тира, либо два источника второго и третьего.',
            'One top-tier source, or two second- and third-tier ones.'],
  }, { color: '#A7D9BE', rank: 2 }),
  signal: bi({
    label: ['Сигнал', 'Signal'],
    short: ['СИГНАЛ', 'SIGNAL'],
    blurb: ['Один источник четвёртого тира и ниже, либо только косвенные признаки.',
            'A single fourth-tier or lower source, or circumstantial evidence only.'],
  }, { color: '#94A3B8', rank: 3 }),
  // Ships with BOTH quotes and is never resolved by the engine — two companies
  // describing their own relationship differently is a finding, not a defect.
  // Zero cases in the v4.0 delivery; the rung exists so the first one renders.
  disputed: bi({
    label: ['Стороны расходятся', 'The sides disagree'],
    short: ['СПОР', 'DISPUTED'],
    blurb: ['Один конец утверждает связь, второй её опровергает. Обе цитаты показаны рядом, движок спор не решает.',
            'One end states the link, the other denies it. Both quotes are shown side by side; the engine does not settle the dispute.'],
  }, { color: '#E0A340', rank: 4 }),
};

// ── Sidedness — WHO said it, orthogonal to how well evidenced it is ──────
// `status` answers «насколько твёрдо», `sidedness` answers «с чьих слов». They
// correlate but are not the same field: a `single` link can still be
// `confirmed` on two of the claiming side's own filings.
export const SIDEDNESS_META = {
  bilateral: bi({
    label: ['Обе стороны', 'Both sides'],
    blurb: ['Оба конца заявили связь своими документами.',
            'Both ends claimed the link in their own documents.'],
  }, { color: '#22C55E', order: 0 }),
  single: bi({
    label: ['Одна сторона', 'One side'],
    blurb: ['Связь заявил один конец, второй о ней не высказывался. Везётся и помечается, а не выбрасывается.',
            'One end claimed the link, the other has not spoken to it. Carried and marked, not dropped.'],
  }, { color: '#94A3B8', order: 1 }),
  disputed: bi({
    label: ['Расхождение', 'Disagreement'],
    blurb: ['Второй конец опровергает связь. Обе цитаты показаны рядом.',
            'The other end denies the link. Both quotes are shown side by side.'],
  }, { color: '#E0A340', order: 2 }),
};

// ── Entity phase — where in its own life the position sits ───────────────
export const PHASE_META = {
  emerging: bi({
    label: ['Зарождается', 'Emerging'],
    short: ['ЗАРОЖД.', 'EMERG.'],
    blurb: ['Позиция только складывается: подтверждена, но ещё не проверена объёмом.',
            'The position is only forming: confirmed, but not yet tested at volume.'],
  }, { color: '#45C0D0', order: 0 }),
  scaling: bi({
    label: ['Растёт', 'Scaling'],
    short: ['РАСТЁТ', 'SCALING'],
    blurb: ['Позиция расширяется — доля и число связей растут прогон за прогоном.',
            'The position is widening — share and link count grow run after run.'],
  }, { color: '#49C2AE', order: 1 }),
  mature: bi({
    label: ['Зрелая', 'Mature'],
    short: ['ЗРЕЛАЯ', 'MATURE'],
    blurb: ['Позиция устоялась: меняется медленно и предсказуемо.',
            'The position has settled: it changes slowly and predictably.'],
  }, { color: '#8E9BE6', order: 2 }),
  at_risk: bi({
    label: ['Под угрозой', 'At risk'],
    short: ['УГРОЗА', 'AT RISK'],
    blurb: ['Позиция под давлением: есть названная замена или названный риск.',
            'The position is under pressure: a named replacement or a named risk exists.'],
  }, { color: '#E0A340', order: 3 }),
  declining: bi({
    label: ['Уходит', 'Declining'],
    short: ['УХОДИТ', 'DECLIN.'],
    blurb: ['Позиция сокращается — по объёму, по доступу или по значению.',
            'The position is shrinking — in volume, in access or in significance.'],
  }, { color: '#E5484D', order: 4 }),
};

// ── Risk level — the colour is restrained on purpose ─────────────────────
// A border or a dot, never a fill: half the entities carry a risk, and filling
// them would turn the panel into a traffic light.
export const RISK_META = {
  critical: bi({
    label: ['Критический', 'Critical'],
    short: ['КРИТ.', 'CRIT.'],
    blurb: ['Реализация обнуляет позицию, а не ухудшает её.',
            'If it lands, the position goes to zero rather than merely worsening.'],
  }, { color: '#E5484D', order: 0 }),
  high: bi({
    label: ['Высокий', 'High'],
    short: ['ВЫС.', 'HIGH'],
    blurb: ['Реализация заметно ослабляет позицию в пределах нескольких лет.',
            'If it lands, the position weakens markedly within a few years.'],
  }, { color: '#E0A340', order: 1 }),
  medium: bi({
    label: ['Средний', 'Medium'],
    short: ['СРЕД.', 'MED.'],
    blurb: ['Риск назван и управляем, срок отдалённый.',
            'The risk is named and manageable, and the horizon is distant.'],
  }, { color: '#58ABCB', order: 2 }),
  low: bi({
    label: ['Низкий', 'Low'],
    short: ['НИЗК.', 'LOW'],
    blurb: ['Специфического риска в данных нет.',
            'No specific risk appears in the data.'],
  }, { color: '#49C2AE', order: 3 }),
};

// Kind of risk on an edge, and its horizon.
// No `none` key: a missing lookup already yields undefined, and every call
// site reads `RISK_TYPE_META[x] || null`. Spreading a biMap would invoke its
// getters at module load and freeze the labels in one language.
export const RISK_TYPE_META = biMap({
  geopolitical: ['геополитика', 'geopolitics'],
  substitution: ['замещение', 'substitution'],
  market:       ['рынок', 'market'],
  regulatory:   ['регулирование', 'regulation'],
  technical:    ['технология', 'technology'],
});

export const RISK_TIMELINE_META = biMap({
  immediate: ['прямо сейчас', 'right now'],
  '1-2y':    ['один-два года', 'one to two years'],
  '2-5y':    ['два-пять лет', 'two to five years'],
  '5y+':     ['пять лет и дальше', 'five years and beyond'],
  ongoing:   ['постоянно', 'ongoing'],
});

// ── Direction — where the source sits relative to the target ─────────────
export const DIRECTION_META = {
  upstream: bi({
    label: ['вверх по стеку', 'upstream'],
    blurb: ['Источник стоит выше по цепочке: получатель от него зависит.',
            'The source sits higher up the chain: the recipient depends on it.'],
  }, { short: '↑' }),
  downstream: bi({
    label: ['вниз по стеку', 'downstream'],
    blurb: ['Источник кормит получателя: тот стоит ниже по цепочке.',
            'The source feeds the recipient, which sits lower down the chain.'],
  }, { short: '↓' }),
  lateral: bi({
    label: ['вбок', 'lateral'],
    blurb: ['Стороны стоят на одном уровне — партнёры или соперники.',
            'Both sides sit at the same level — partners or rivals.'],
  }, { short: '↔' }),
  bidirectional: bi({
    label: ['в обе стороны', 'both ways'],
    blurb: ['Зависимость взаимная: каждая сторона держит другую.',
            'The dependency runs both ways: each side holds the other.'],
  }, { short: '⇄' }),
};

// ── Layer bands — five colour families over the orbit ────────────────────
// The band is the engine's (`layers[].band`); the palette is v1's, unchanged.
// Layers on the nucleus and control planes have no band at all — they take
// their colour from PLANE_META instead.
export const BAND_META = {
  1: bi({ label: ['Вход', 'Inputs'] },                 { color: '#6F93DE' }),
  2: bi({ label: ['Кремний', 'Silicon'] },             { color: '#5A93DE' }),
  3: bi({ label: ['Железо и ток', 'Hardware & power'] },{ color: '#49C2AE' }),
  4: bi({ label: ['Инфраструктура', 'Infrastructure'] },{ color: '#58ABCB' }),
  5: bi({ label: ['Софт и спрос', 'Software & demand'] },{ color: '#8E9BE6' }),
};

// ── Planes — the one geometric novelty over v1 ───────────────────────────
// A state does not stand between "память" and "системы". It stands OUTSIDE and
// gates the whole thing, and putting it in the ring would lie about the nature
// of the relation. Hence three planes rather than one.
export const PLANE_META = {
  nucleus: bi({
    label: ['Ядро', 'Nucleus'],
    short: ['ЯДРО', 'NUCLEUS'],
    blurb: ['Капитал: владеет стеком и финансирует его, сам в нём не стоя.',
            'Capital: owns and funds the stack without standing in it.'],
  }, { color: '#C99B72', order: 0 }),
  orbit: bi({
    label: ['Орбита', 'Orbit'],
    short: ['ОРБИТА', 'ORBIT'],
    blurb: ['Сам стек: по кольцу от сырья к приложениям, цвет — полоса слоя.',
            'The stack itself: round the ring from raw inputs to applications, coloured by layer band.'],
  }, { color: null, order: 1 }),
  control: bi({
    label: ['Внешняя дуга', 'Outer arc'],
    short: ['ДУГА', 'ARC'],
    blurb: ['Государства, ведомства и стандарты: они не стоят в стеке, они его шлюзуют.',
            'States, agencies and standards bodies: they do not stand in the stack, they gate it.'],
  }, { color: '#B4707A', order: 2 }),
};

// ── Layer concentration ──────────────────────────────────────────────────
export const CONCENTRATION_META = {
  monopoly: bi({
    label: ['Монополия', 'Monopoly'],
    short: ['МОНОП.', 'MONOP.'],
    blurb: ['Один игрок держит слой. Отказ здесь останавливает всё, что выше.',
            'One player holds the layer. A failure here stops everything above it.'],
  }, { color: '#E5484D', order: 0 }),
  duopoly: bi({
    label: ['Дуополия', 'Duopoly'],
    short: ['ДУОП.', 'DUOP.'],
    blurb: ['Двое делят слой. Второй источник есть, но выбор из двух — это не рынок.',
            'Two split the layer. A second source exists, but a choice of two is not a market.'],
  }, { color: '#E8975E', order: 1 }),
  oligopoly: bi({
    label: ['Олигополия', 'Oligopoly'],
    short: ['ОЛИГ.', 'OLIG.'],
    blurb: ['Три-четыре игрока делят слой. Переключение возможно и стоит времени.',
            'Three or four players split the layer. Switching is possible and costs time.'],
  }, { color: '#E0A340', order: 2 }),
  competitive: bi({
    label: ['Конкурентный', 'Competitive'],
    short: ['КОНК.', 'COMPET.'],
    blurb: ['Много поставщиков, замена дешёвая. Узкого места здесь нет.',
            'Many suppliers, cheap to switch. There is no bottleneck here.'],
  }, { color: '#49C2AE', order: 3 }),
};

// ── Entity types — what kind of thing this is at all ─────────────────────
// `shape` decides the silhouette on the canvas, and it answers ONE question:
// is this entity an ACTOR or a THING? An actor — a company, a state, an agency
// — can decide, buy and retaliate; a thing — a runtime, a framework, a law —
// cannot, it only gets adopted or applied. Both were drawn as the same tile, so
// CUDA read as a company sitting next to NVIDIA at a glance. Things are drawn
// as circles and carry a short tag next to the name.
//
// `tag` is deliberately absent for a plain company: 86 of 107 entities are
// companies, and tagging the default is noise.
export const TYPE_META = {
  company:        bi({ label: ['Компания', 'Company'] }, { shape: 'tile' }),
  geopolitical:   bi({ label: ['Юрисдикция', 'Jurisdiction'],
                       tag: ['ЮРИСД.', 'JURIS.'] }, { shape: 'tile' }),
  agency:         bi({ label: ['Ведомство', 'Agency'],
                       tag: ['ВЕДОМСТВО', 'AGENCY'] }, { shape: 'tile' }),
  research_org:   bi({ label: ['Исследовательская организация', 'Research organisation'],
                       tag: ['ПРОЕКТ', 'PROJECT'] }, { shape: 'round' }),
  standards_body: bi({ label: ['Консорциум стандартов', 'Standards body'],
                       tag: ['СТАНДАРТ', 'STANDARD'] }, { shape: 'round' }),
  // Accepted ahead of the payload: the engine types CUDA as a `company` today,
  // so it still draws as a tile. The moment a delivery calls it `technology`
  // it becomes a circle here with no further change.
  technology:     bi({ label: ['Технология', 'Technology'],
                       tag: ['ТЕХ', 'TECH'] }, { shape: 'round' }),
  regulation:     bi({ label: ['Регулирование', 'Regulation'],
                       tag: ['ЗАКОН', 'LAW'] }, { shape: 'round' }),
};

export const PUBLIC_PRIVATE_META = {
  public:     bi({ label: ['ПУБЛИЧНАЯ', 'PUBLIC'] }),
  private:    bi({ label: ['ЧАСТНАЯ', 'PRIVATE'] }),
  government: bi({ label: ['ГОСУДАРСТВО', 'GOVERNMENT'] }),
  academic:   bi({ label: ['НЕКОММЕРЧЕСКАЯ', 'NON-PROFIT'] }),
};

// ── Criticality rubric — four inputs, FIXED weights ──────────────────────
//   criticality = round(0.30·irreplaceability + 0.30·lockInDepth
//                     + 0.25·timeToReplace   + 0.15·concentration)
//
// The weights are frozen and the arithmetic is the engine's. This table only
// names the axes so the number is never a black box: a "95" beside «ни одна
// другая фабрика не делает 3 нм в объёме» is an argument; a "95" alone is a
// number nobody can argue with, which is the opposite of useful. The engine
// ships one line of reasoning per factor in `criticalityWhy` and the panel
// prints it right next to the digit.
//
// CONTRACT /4 REPLACED THE FOURTH AXIS. It used to be `strategicControl` —
// «насколько NVIDIA может влиять на решения этой стороны» — which measured the
// entity against the centre of the map rather than against its own job. With
// the anchor gone the question has no subject, so the axis became
// `concentration`: what share of ITS OWN FUNCTION the entity holds. ASML ≈100%
// of EUV, TSMC ≈90% of leading-edge silicon. Same weight, same 0-100 scale,
// and the number is now an argument about the industry instead of an argument
// about one company's leverage.
//
// NOT EVERY ENTITY HAS THE FOURTH NUMBER. A node whose dossier has not been
// worked yet carries `concentration: null`, and the engine renormalizes the
// three remaining weights and says so in `criticalityBasis.factorsUsed`. A
// three-factor score and a four-factor score sit in the same column and are
// NOT comparable, so every surface that prints criticality has to print that
// caveat too — see `criticalityBasis` in the panel and the table.
export const CRITICALITY_FACTORS = [
  bi({
    label:    ['Незаменимость', 'Irreplaceability'],
    // Anchor-free wording. The question used to be «может ли NVIDIA её
    // заменить», which only had an answer while the map had a centre.
    question: ['Может ли экосистема обойтись без неё — сколько в мире тех, кто реально сделает то же самое',
               'Whether the ecosystem could do without it — how many in the world could genuinely do the same'],
    blurb:    ['95+ монополия с барьером на семь лет и больше · 85+ дуополия · 75+ замены есть, но упираются во время и капитал · 50+ альтернативы ясны, преимущество в инерции · ниже 30 полные близнецы.',
               '95+ a monopoly with a seven-year barrier or longer · 85+ a duopoly · 75+ replacements exist but run into time and capital · 50+ alternatives are clear and the edge is inertia · below 30 outright twins.'],
  }, { key: 'irreplaceability', weight: 0.30 }),
  bi({
    label:    ['Глубина замка', 'Lock-in depth'],
    question: ['Сколько слоёв стека задевает эта зависимость',
               'How many layers of the stack this dependency touches'],
    blurb:    ['95+ четыре слоя и больше · 85+ три · 75+ два · 65+ один-два с сильной зависимостью · ниже 30 один слой, меняется на лету.',
               '95+ four layers or more · 85+ three · 75+ two · 65+ one or two with a strong dependency · below 30 a single layer, swappable on the fly.'],
  }, { key: 'lockInDepth', weight: 0.30 }),
  bi({
    label:    ['Срок замены', 'Time to replace'],
    question: ['Если она исчезнет — за какой срок отрасль поднимет замену',
               'If it vanished, how long the industry would take to stand up a replacement'],
    blurb:    ['95+ семь лет и больше · 85+ пять-семь · 75+ три-пять · 65+ два-три · 50+ год-два · ниже 30 замена немедленная.',
               '95+ seven years or more · 85+ five to seven · 75+ three to five · 65+ two to three · 50+ one to two · below 30 replacement is immediate.'],
  }, { key: 'timeToReplace', weight: 0.25 }),
  bi({
    label:    ['Доля функции', 'Share of the function'],
    question: ['Какую долю своей собственной функции в стеке держит эта сущность',
               'How much of its own function in the stack this entity holds'],
    blurb:    ['95+ монополия, больше 90% функции · 85+ дуополия с явным лидером · 75+ три-четыре игрока, лидер больше половины · 65+ олигополия без доминирующего · 50+ конкурентный рынок с барьером входа · 30+ фрагментированный · ниже 30 коммодити.',
               '95+ a monopoly, over 90% of the function · 85+ a duopoly with a clear leader · 75+ three or four players and the leader above half · 65+ an oligopoly with nobody dominant · 50+ a competitive market with a barrier to entry · 30+ fragmented · below 30 a commodity.'],
    // Said out loud when the number is missing, because a blank in this column
    // means «до узла не дошла очередь исследования», never «доли нет».
    pending:  ['Доля функции ожидает досье — критичность посчитана по трём факторам с перенормировкой весов.',
               'The share of the function is waiting for a dossier — criticality is computed on three factors with the weights renormalized.'],
  }, { key: 'concentration', weight: 0.15 }),
];

/**
 * How many rubric factors a given entity's criticality actually rests on.
 * `criticalityBasis` arrives from the engine as an object; older payloads and
 * the reserve v2 map have no such field, and there every entity was scored on
 * all four. Returns `{ factorsUsed, renormalized }` and never null, so a call
 * site can print the caveat without a second guard.
 */
export function criticalityBasisOf(entity) {
  const b = entity?.criticalityBasis;
  if (b && typeof b === 'object') {
    return {
      factorsUsed: typeof b.factorsUsed === 'number' ? b.factorsUsed : CRITICALITY_FACTORS.length,
      renormalized: !!b.renormalized,
      factors: Array.isArray(b.factors) ? b.factors : null,
    };
  }
  // A bare number is accepted too — the field is young and could arrive flat.
  if (typeof b === 'number') return { factorsUsed: b, renormalized: b < CRITICALITY_FACTORS.length, factors: null };
  return { factorsUsed: CRITICALITY_FACTORS.length, renormalized: false, factors: null };
}

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

/**
 * The entity's own web host, as a BARE hostname.
 *
 * CONTRACT /4 CARRIES THIS AND THE SIDE-CAR NO LONGER HAS TO. `domains[]` is
 * the same registry the engine grades sources against — it is what decides
 * whether a citation counts as SELF — so it is authoritative in a way a
 * hand-kept `id → domain` map never was, and it is filled for 106 of the 108
 * entities. The side-car (`nvidiaEcosystemLogos.json`) stays as the FALLBACK:
 * it still answers for the two entities with no publisher of their own
 * (`cfius`, `chips-act`) and for the reserve v2 map, whose payload has no
 * `domains` field at all. So a new entity — `zeiss-smt` and everything the
 * monthly rotation brings in — gets a brand mark and a website chip with no
 * hand edit, and the accumulated exceptions are not thrown away.
 *
 * The engine's value is not guaranteed to be a bare host: `nventures` ships
 * `nvidia.com/en-us/startups/nventures`, a path. Everything after the first
 * slash is dropped, along with a scheme and a leading `www.`, because both the
 * favicon services and the «Сайт» chip want a host and nothing else.
 */
export function domainOf(e) {
  const raw = (e?.domains || []).find(Boolean) || logoDomains[e?.id] || null;
  if (!raw) return null;
  const host = String(raw)
    .trim()
    .replace(/^[a-z]+:\/\//i, '')
    .split(/[/?#]/)[0]
    .replace(/^www\./i, '')
    .toLowerCase();
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) ? host : (logoDomains[e?.id] || null);
}

function logoUrlsFor(e) {
  const out = [];
  const push = (u) => { if (u && !out.includes(u)) out.push(u); };
  // BY ID first. `npm run logos` now walks this map too and writes its marks
  // under the entity's own id, which is exact — the name match below is a
  // fallback for entities that share a brand with the flow map ("NVIDIA"), and
  // it cannot see an id like `astera-labs` whose name is "Astera Labs".
  push(logoManifest[e.id]);
  push(manifestByName.get(String(e.name || '').trim().toLowerCase()));
  (e.aliases || []).forEach(a => push(manifestByName.get(String(a).trim().toLowerCase())));
  const dom = domainOf(e);
  if (dom) {
    push(`https://unavatar.io/${dom}?fallback=false`);
    push(`https://www.google.com/s2/favicons?sz=128&domain=${dom}`);
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════════════
// META — the header the shell reads before anything is drawn.
// ══════════════════════════════════════════════════════════════════════════
export const META = bi({
  disclaimer: [
      'Карта показывает позиции и зависимости, а не сделки. Каждая связь подтверждена дословной цитатой из источника; '
        + 'критичность и гравитация посчитаны движком по фиксированной рубрике. Не является инвестиционной рекомендацией.',
      'The map shows positions and dependencies, not transactions. Every link is backed by a verbatim quote from its source; '
        + 'criticality and gravity are computed by the engine against a fixed rubric. Not investment advice.',
    ],
}, {
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
});

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

// `edgeTypes` lets a caller extend the frozen v2 table. The network map adds two
// types (is_alternative_to, enables_interop); without this they fell through the
// `? e.type : 'supplies'` fallback below and rendered as «поставляет» — the map
// stated that AMD SUPPLIES CUDA when AMD is an ALTERNATIVE to it, and painted it
// on the physical spine instead of rivalry. A silent fallback that changes the
// meaning of a relationship is worse than a missing one.
export function buildGraphFrom(raw, edgeTypes = EDGE_TYPE_META) {
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
      .map(l => ({ ...l, order: layerById.get(l.layer).order, layerLabel: layerById.get(l.layer).label }))
      .sort((a, b) => a.order - b.order);
    // Defensive: an entity the engine ships with no usable layer still has to
    // land somewhere rather than vanish — pin it to its sector's layer, else
    // to the first layer in the payload.
    const fallback = sectorByKey.get(e.sector)?.layer || layers[0]?.id;
    const list = segs.length ? segs : [{
      layer: fallback, primary: true, criticality: e.criticality || 0,
      order: layerById.get(fallback)?.order ?? 0,
      layerLabel: layerById.get(fallback)?.label || fallback,
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
      // The readable name of the layer. An "L12" tells a first-time reader
      // nothing, so every surface prints this instead; the code stays only as
      // the stable id the payload and the filters key on.
      primaryLayerLabel: layer?.label || primarySeg.layer,
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
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(e.name || '')}`,
      // The payload's own publisher registry, with the side-car behind it —
      // see domainOf(). Where neither answers there is no chip, never a guess.
      site: domainOf(e) ? `https://${domainOf(e)}` : null,
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
    const type = edgeTypes[e.type] ? e.type : 'supplies';
    const meta = edgeTypes[type];
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
    sales:     bi({ label: ['Контур сбыта', 'Sales circuit'] },       { color: '#E5484D' }),
    financing: bi({ label: ['Контур финансирования', 'Financing circuit'] }, { color: '#E0A340' }),
    lockin:    bi({ label: ['Контур замка', 'Lock-in circuit'] },     { color: '#3FB984' }),
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

  // ── Systemic weight. ONE number that replaces criticality + gravity +
  // centrality in the panel, computed here rather than upstream because every
  // input already exists in the payload. Both maps run through this function,
  // so both get `entity.weight`. See ecoWeight.js. ──────────────────────────
  const weights = computeWeights(entities, edges);
  entities.forEach(e => { e.weight = weights.get(e.id) || null; });

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
