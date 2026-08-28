// ══════════════════════════════════════════════════════════════════════════
// RESEARCH: DC AI – SUPPLY-CHAIN GRAPH
// Layered DAG of the AI infrastructure chain. Sub-sector nodes flow top
// (raw substrates) → bottom (AI applications) with curved edges showing
// what feeds what. Click a node → right-side inspector panel with the
// chain neighbours, thesis copy, and companies in coverage.
// ══════════════════════════════════════════════════════════════════════════
import React, { useMemo, useState, useEffect, useRef } from 'react';
import dcCompaniesData from '../../../data/dc-companies.json';
import dcBucketsData from '../../../data/dc-buckets.json';
import dcDetailsData from '../../../data/dc-details.json';
import dcCompanyProfilesData from '../../../data/dc-company-profiles.json';
import { useT, getLang } from '../../../lib/i18n.jsx';
import { bi, biMap } from '../../../data/capitalMap.js';

const DC_COMPANIES = dcCompaniesData;
const DC_PROFILES = dcCompanyProfilesData; // rich company overviews keyed by ticker (for the t('Подробнее', 'More') modal)
const { DC_BUCKETS } = dcBucketsData;
// Deep-dive content keyed by node id (keys starting with "_" are ignored). Empty
// for most nodes today – the detail page falls back to a placeholder + base copy.
const DC_DETAILS = dcDetailsData;

// ─ Canvas geometry ────────────────────────────────────────────────────────
const CANVAS_W       = 1180;
const PAD_X_LEFT     = 130;   // room for vertical layer labels
const PAD_X_RIGHT    = 50;
const PAD_Y_TOP      = 70;
const PAD_Y_BOTTOM   = 70;
const LAYER_GAP      = 112;
const NODE_W         = 152;
const NODE_H         = 48;
const BIG_NODE_W     = 210;
const BIG_NODE_H     = 64;

// ─ Bucket short-codes – shown on every node for instant group recognition.
const BUCKET_TAGS = biMap({
  'Power & Grid': ['ЭНЕРГО', 'POWER'],
  'Compute & Silicon': ['ЧИПЫ', 'CHIPS'],
  'Materials & Chemicals': ['СЫРЬЁ', 'RAW MATERIALS'],
  'Connectivity & Photonics': ['СЕТЬ', 'NETWORK'],
  'Construction & Labor': ['СТРОЙ', 'BUILD'],
  'Cooling & Thermal': ['ХОЛОД', 'COOLING'],
  'Fab & Test Equipment': ['СТАНКИ', 'TOOLS'],
  'Software & Apps': ['СОФТ', 'SOFTWARE'],
  'Memory & Storage': ['ПАМЯТЬ', 'MEMORY'],
});

// ─ Russian display names for buckets (keys stay English for data joins).
const BUCKET_RU = biMap({
  'Power & Grid': ['Энергетика и сети', 'Power & grid'],
  'Compute & Silicon': ['Чипы и вычисления', 'Chips & compute'],
  'Materials & Chemicals': ['Материалы и химия', 'Materials & chemicals'],
  'Connectivity & Photonics': ['Связь и фотоника', 'Connectivity & photonics'],
  'Construction & Labor': ['Стройка и люди', 'Construction & labour'],
  'Cooling & Thermal': ['Охлаждение', 'Cooling'],
  'Fab & Test Equipment': ['Оборудование для чипов', 'Chip equipment'],
  'Software & Apps': ['Софт и приложения', 'Software & apps'],
  'Memory & Storage': ['Память и хранение', 'Memory & storage'],
});

// ─ Russian plural: pick the right form for a count (1 узел / 2 узла / 5 узлов)
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

// ─ Layer definitions ──────────────────────────────────────────────────────
const LAYERS = [
  bi({ label: ['СЫРЬЁ', 'RAW MATERIALS'], caption: ['материалы · химия', 'materials · chemicals'] }, { id: 'L1' }),
  bi({ label: ['ОБОРУДОВАНИЕ', 'EQUIPMENT'], caption: ['станки · софт · тесты', 'tools · software · test'] }, { id: 'L2' }),
  bi({ label: ['ЧИПЫ', 'CHIPS'], caption: ['логика · силовые · кастомные', 'logic · power · custom'] }, { id: 'L3' }),
  bi({ label: ['ПАМЯТЬ', 'MEMORY'] }, { id: 'L4', caption: 'HBM · DRAM · SSD' }),
  bi({ label: ['СБОРКА', 'ASSEMBLY'], caption: ['упаковка · платы', 'packaging · boards'] }, { id: 'L5' }),
  bi({ label: ['ГЕНЕРАЦИЯ', 'GENERATION'], caption: ['источники · топливо', 'sources · fuel'] }, { id: 'L6' }),
  bi({ label: ['ПЕРЕДАЧА ТОКА', 'POWER TRANSMISSION'], caption: ['сеть → стойка', 'grid → rack'] }, { id: 'L7' }),
  bi({ label: ['СВЯЗЬ', 'CONNECTIVITY'], caption: ['сеть · оптика', 'network · optics'] }, { id: 'L8' }),
  bi({ label: ['СИСТЕМЫ', 'SYSTEMS'], caption: ['серверы · охлаждение · стройка', 'servers · cooling · build'] }, { id: 'L9' }),
  bi({ label: ['ВЫЧИСЛЕНИЯ', 'COMPUTE'], caption: ['стойка', 'rack'] }, { id: 'L10' }),
  bi({ label: ['ИНФЕРЕНС', 'INFERENCE'], caption: ['работа моделей · цена ответа', 'running models · cost per answer'] }, { id: 'L11' }),
  bi({ label: ['РЕЗУЛЬТАТ', 'OUTCOME'], caption: ['модели · ИИ для бизнеса', 'models · AI for business'] }, { id: 'L12' }),
];

// ─ Nodes (sub-sectors) ────────────────────────────────────────────────────
// `sector` matches DC_COMPANIES[].sector so the inspector can filter.
// `bucket` matches a key in DC_BUCKETS for colour + parent grouping.
const NODES_RAW = [
  // L1 – Raw Inputs
  bi({ label: ['Электросталь', 'Electrical steel'] }, { id: 'goes', sector: 'GOES Steel', bucket: 'Materials & Chemicals', layer: 0 }),
  bi({ label: ['Фоторезист', 'Photoresist'] }, { id: 'resist', sector: 'Photoresist', bucket: 'Materials & Chemicals', layer: 0 }),
  bi({ label: ['Химия для чипов', 'Chip chemicals'] }, { id: 'chem', sector: 'Specialty Chem', bucket: 'Materials & Chemicals', layer: 0 }),
  { id: 'inpgaas',     label: 'InP / GaAs',       sector: 'InP/GaAs',       bucket: 'Materials & Chemicals',    layer: 0 },
  bi({ label: ['Титановые сплавы', 'Titanium alloys'] }, { id: 'titanium', sector: 'Titanium', bucket: 'Materials & Chemicals', layer: 0 }),
  bi({ label: ['Материалы для HBM', 'HBM materials'] }, { id: 'hbmmat', sector: 'HBM Materials', bucket: 'Materials & Chemicals', layer: 0 }),

  // L2 – Equipment & Design
  bi({ label: ['Станки для чипов', 'Chip tools'] }, { id: 'litho', sector: 'Litho Tools', bucket: 'Fab & Test Equipment', layer: 1 }),
  bi({ label: ['Тестирование', 'Test'] }, { id: 'test', sector: 'Test', bucket: 'Fab & Test Equipment', layer: 1 }),
  bi({ label: ['Софт для чипов', 'Chip software'] }, { id: 'eda', sector: 'EDA', bucket: 'Compute & Silicon', layer: 1 }),
  bi({ label: ['Лицензии / склейка', 'Licensing / integration'] }, { id: 'ip', sector: 'IP/Bonding', bucket: 'Compute & Silicon', layer: 1 }),

  // L3 – Chips
  bi({ label: ['AI-чипы', 'AI chips'] }, { id: 'silicon', sector: 'AI Silicon', bucket: 'Compute & Silicon', layer: 2 }),
  bi({ label: ['Силовые чипы', 'Power chips'] }, { id: 'wbg', sector: 'Wide-Bandgap', bucket: 'Compute & Silicon', layer: 2 }),
  bi({ label: ['Кастомные AI-чипы', 'Custom AI chips'] }, { id: 'asic', sector: 'Custom ASIC', bucket: 'Compute & Silicon', layer: 2 }),

  // L4 – Memory
  bi({ label: ['HBM-память', 'HBM memory'] }, { id: 'hbm', sector: 'HBM', bucket: 'Memory & Storage', layer: 3 }),
  { id: 'dram',        label: 'DRAM',             sector: 'DRAM',           bucket: 'Memory & Storage',         layer: 3 },
  { id: 'nand',        label: 'NAND / SSD',       sector: 'NAND/SSD',       bucket: 'Memory & Storage',         layer: 3 },

  // L5 – Assembly
  bi({ label: ['Упаковка чипов', 'Chip packaging'] }, { id: 'pkg', sector: 'Adv Packaging', bucket: 'Compute & Silicon', layer: 4 }),
  bi({ label: ['Платы / подложки', 'Boards / substrates'] }, { id: 'pcb', sector: 'PCB', bucket: 'Compute & Silicon', layer: 4 }),

  // L6 – Power Origin
  bi({ label: ['Атомная энергия', 'Nuclear power'] }, { id: 'nuc', sector: 'Nuclear', bucket: 'Power & Grid', layer: 5 }),
  bi({ label: ['Малые реакторы', 'Small reactors'] }, { id: 'smr', sector: 'SMR', bucket: 'Power & Grid', layer: 5 }),
  bi({ label: ['Топливные элементы', 'Fuel cells'] }, { id: 'fuel', sector: 'Fuel Cells', bucket: 'Power & Grid', layer: 5 }),
  bi({ label: ['Газопроводы', 'Gas pipelines'] }, { id: 'gaspipe', sector: 'Gas Pipelines', bucket: 'Power & Grid', layer: 5 }),
  bi({ label: ['Газовые турбины', 'Gas turbines'] }, { id: 'gasturbines', sector: 'Gas Turbines', bucket: 'Power & Grid', layer: 5 }),
  bi({ label: ['Возобновляемая энергия', 'Renewable power'] }, { id: 'renewables', sector: 'Renewables', bucket: 'Power & Grid', layer: 5 }),

  // L7 – Power Delivery
  bi({ label: ['Электроэнергия', 'Electricity'] }, { id: 'power', sector: 'Power', bucket: 'Power & Grid', layer: 6 }),
  bi({ label: ['Трансформаторы', 'Transformers'] }, { id: 'transformers', sector: 'Transformers', bucket: 'Power & Grid', layer: 6 }),
  bi({ label: ['Электрощиты', 'Switchgear'] }, { id: 'switchgear', sector: 'Switchgear', bucket: 'Power & Grid', layer: 6 }),
  bi({ label: ['Питание стоек', 'Rack power'] }, { id: 'pmgmt', sector: 'Power Mgmt', bucket: 'Power & Grid', layer: 6 }),

  // L8 – Interconnect / Networking
  bi({ label: ['Фотоника', 'Photonics'] }, { id: 'photonics', sector: 'Photonics', bucket: 'Connectivity & Photonics', layer: 7 }),
  bi({ label: ['Сетевые чипы', 'Network chips'] }, { id: 'netsilicon', sector: 'Network Silicon', bucket: 'Connectivity & Photonics', layer: 7 }),
  bi({ label: ['Сетевая фабрика', 'Network fabric'] }, { id: 'fabric', sector: 'Interconnect Fabric', bucket: 'Connectivity & Photonics', layer: 7 }),
  bi({ label: ['Оптические модули', 'Optical modules'] }, { id: 'transceivers', sector: 'Optical Modules', bucket: 'Connectivity & Photonics', layer: 7 }),
  bi({ label: ['Тёмное волокно', 'Dark fibre'] }, { id: 'darkfiber', sector: 'Dark Fiber', bucket: 'Connectivity & Photonics', layer: 7 }),
  bi({ label: ['Оптоволокно', 'Optical fibre'] }, { id: 'fiber', sector: 'Fiber/Cable', bucket: 'Connectivity & Photonics', layer: 7 }),

  // L9 – Systems / Site Buildout
  bi({ label: ['Сборка серверов', 'Server assembly'] }, { id: 'server', sector: 'Server Systems', bucket: 'Compute & Silicon', layer: 8 }),
  bi({ label: ['Охлаждение', 'Cooling'] }, { id: 'liquid', sector: 'Liquid Cooling', bucket: 'Cooling & Thermal', layer: 8 }),
  bi({ label: ['Инженерные системы', 'Building systems'] }, { id: 'mep', sector: 'MEP', bucket: 'Construction & Labor', layer: 8 }),
  bi({ label: ['Строительство', 'Construction'] }, { id: 'contracting', sector: 'Contracting', bucket: 'Construction & Labor', layer: 8 }),

  // L10 – Compute Convergence
  bi({ label: ['AI-ВЫЧИСЛЕНИЯ', 'AI COMPUTE'] }, { id: 'rack', sector: 'AI Compute Infra', bucket: 'Compute & Silicon', layer: 9, big: true, secondarySector: 'AI Compute Infra (pivot)' }),

  // L11 – Inference (serving trained models; where AI earns per answer)
  bi({ label: ['Инференс', 'Inference'] }, { id: 'inference', sector: 'Inference', bucket: 'Compute & Silicon', layer: 10 }),

  // L12 – Output
  bi({ label: ['AI-лаборатории', 'AI labs'] }, { id: 'lab', sector: 'Frontier Lab', bucket: 'Compute & Silicon', layer: 11 }),
  bi({ label: ['Внедрение ИИ', 'AI deployment'] }, { id: 'apps', sector: 'AI Apps', bucket: 'Software & Apps', layer: 11 }),
];

// ─ Node intel – plain-Russian "what is this" per sub-sector ────────────────
// Simple, low-jargon definition: what the thing physically is and where it's
// used next. Keeps the reader oriented before the deeper РОЛЬ block. Keyed by
// node id.
const NODE_INTEL = biMap({
  goes: ['Особая электротехническая сталь, из которой делают «сердце» силового трансформатора. Её зёрна выстроены в одну сторону, поэтому она проводит магнитное поле почти без потерь энергии. Проще говоря: нет такой стали – нет трансформатора, а без трансформатора не запитать дата-центр.',
    'A special grain-oriented electrical steel used for the core of a power transformer. Its grains are aligned in one direction, so it carries a magnetic field with almost no energy loss. Put simply: no such steel, no transformer — and without a transformer you cannot power a data center.'],
  resist: ['Светочувствительная жидкость, которой покрывают кремниевую пластину перед «печатью» микросхемы. Свет проявляет на ней рисунок будущего чипа – примерно как раньше проявляли фотоплёнку. Наносят её заново на каждый слой, поэтому расходуется постоянно и в больших объёмах.',
    'The light-sensitive liquid coated onto a silicon wafer before the circuit is printed. Light develops the pattern of the future chip on it, much like photographic film used to be developed. It is reapplied for every layer, so it is consumed constantly and in volume.'],
  chem: ['Сверхчистые газы, кислоты и полировальные жидкости, которыми на заводе травят, промывают и полируют кремниевую пластину. Чистота нужна фантастическая – лишняя пылинка убивает чип. Это «расходники» производства: чем больше выпускают чипов, тем больше их нужно.',
    'Ultra-pure gases, acids and polishing slurries used in the fab to etch, rinse and polish a silicon wafer. The purity required is extraordinary — a single stray particle kills a chip. These are production consumables: the more chips are made, the more are needed.'],
  inpgaas: ['Особые пластины-подложки (из фосфида индия и арсенида галлия) – «умный» аналог обычного кремния, который умеет излучать и ловить свет. Из них делают лазеры и приёмники для оптики, которой дата-центры гоняют данные между серверами. Пластины маленькие, дорогие и редкие.',
    'Special substrate wafers (indium phosphide and gallium arsenide) — the smart cousin of ordinary silicon, able to emit and detect light. They are used to make the lasers and receivers for the optics data centers move data over. The wafers are small, expensive and rare.'],
  titanium: ['Особо прочные и жаростойкие сплавы титана. Из них делают самую горячую часть газовых турбин – ту, что раскаляется и вращается. Такие турбины всё чаще ставят прямо у дата-центров, чтобы вырабатывать своё электричество.',
    'Exceptionally strong, heat-resistant titanium alloys. They form the hottest part of a gas turbine — the part that glows and spins. Such turbines are increasingly placed right beside data centers to generate their own electricity.'],
  litho: ['Станки, которые физически делают чип: одни «печатают» рисунок транзисторов светом, другие наращивают и вытравливают тончайшие слои, третьи ищут дефекты. Это «кирки и лопаты» всей индустрии – без них не работает ни один завод чипов. Самые сложные и дорогие машины в мире.',
    'The machines that physically make a chip: some print the transistor pattern with light, others grow and etch the finest layers, others hunt for defects. These are the picks and shovels of the whole industry — no chip plant runs without them. The most complex and expensive machines in the world.'],
  test: ['Оборудование, которое проверяет чип, прежде чем он уедет в сервер: гоняет его на скорости и «прожаривает» под нагрузкой, отсеивая брак. Для дорогих AI-чипов цена пропущенной ошибки огромна. Поэтому проверяют всё строже.',
    'The equipment that checks a chip before it goes into a server: it runs the part at speed and bakes it under load, screening out defects. For expensive AI chips the cost of a missed fault is enormous. So testing keeps getting stricter.'],
  eda: ['Программы, в которых инженеры проектируют микросхему – от общей схемы до раскладки миллиардов транзисторов. Без них современный чип просто не нарисовать. По сути – «чертёжный софт», без которого чип-компании не могут работать.',
    'The software engineers design a chip in — from the overall architecture down to the layout of billions of transistors. Without it a modern chip simply cannot be drawn. In effect, the drafting software chip companies cannot operate without.'],
  ip: ['Готовые «кубики» схем, которые лицензируют, чтобы не проектировать чип с нуля, плюс технология склеивать кристаллы напрямую, без припоя. На этой склейке держится современная AI-память (HBM) и «многоэтажные» 3D-чипы. Бизнес – брать роялти с каждого выпущенного чипа.',
    'Ready-made circuit blocks licensed so a chip need not be designed from scratch, plus the technology for bonding dies directly without solder. Modern AI memory (HBM) and multi-storey 3D chips rest on that bonding. The business is taking a royalty on every chip shipped.'],
  silicon: ['Сами вычислительные чипы для ИИ – те самые GPU и ускорители, которые «думают» за нейросети. Это сердце всей стройки: вокруг них собирают сервер, стойку и весь дата-центр. Проектируют их единицы компаний, а физически делает почти только TSMC.',
    'The AI compute chips themselves — the GPUs and accelerators that do the thinking for neural networks. This is the heart of the whole build: the server, the rack and the entire data center are assembled around them. Only a handful of companies design them, and almost only TSMC physically makes them.'],
  wbg: ['Особые силовые чипы (на карбиде кремния и нитриде галлия), которые управляют электричеством эффективнее обычных. Они меньше греются и держат большее напряжение, поэтому из них делают экономичные блоки питания в стойках. Чем прожорливее AI-чипы, тем они нужнее.',
    'Special power chips (silicon carbide and gallium nitride) that handle electricity more efficiently than ordinary ones. They run cooler and hold higher voltages, so they go into efficient rack power supplies. The hungrier AI chips get, the more they are needed.'],
  pkg: ['Финальная сборка чипа: вычислительный кристалл и блоки памяти упаковывают в один корпус так, чтобы они работали как единое целое. Именно здесь, а не в самом транзисторе, долго была главная пробка – без этой упаковки AI-чип и его память не соединить. Сейчас мощности активно расширяют, и ключевое ограничение постепенно смещается к памяти и энергии.',
    'The final assembly of a chip: the compute die and the memory stacks are packaged into one body so they work as a single unit. This — not the transistor itself — was the main bottleneck for a long time: without this packaging an AI chip and its memory cannot be joined. Capacity is now expanding fast, and the binding constraint is gradually shifting to memory and power.'],
  pcb: ['Платы и подложки, на которых физически стоит чип и через которые идут тысячи его контактов. Для AI-ускорителей это платы безумной сложности – десятки слоёв с микронной точностью. Их дефицит не раз тормозил выпуск видеокарт.',
    'The boards and substrates a chip physically sits on and through which its thousands of contacts run. For AI accelerators these are boards of insane complexity — dozens of layers at micron accuracy. Their shortage has repeatedly held up accelerator output.'],
  nuc: ['Большие атомные станции как источник стабильного электричества для дата-центров – круглосуточно и без зависимости от погоды. Крупные IT-компании уже выкупают выработку действующих АЭС целиком. Строить новые долго, поэтому в ход идут существующие.',
    'Large nuclear plants as a source of steady electricity for data centers — round the clock and independent of the weather. Big IT companies are already buying the entire output of operating plants. New ones take a long time to build, so the existing fleet is what gets used.'],
  smr: ['Маленькие атомные реакторы заводской сборки, которые можно поставить прямо рядом с дата-центром. Идея – получить атомную энергию быстрее и дешевле большой АЭС. Технология пока в основном на бумаге и в первых проектах, так что это ставка на будущее.',
    'Small, factory-built nuclear reactors that can be placed right next to a data center. The idea is to get nuclear power faster and cheaper than a full-scale plant. The technology is still mostly on paper and in first projects, so this is a bet on the future.'],
  fuel: ['Установки, которые получают электричество из газа или водорода без сжигания и без турбины – тихо и чисто. Их ставят прямо на площадке, чтобы получить мощность и не ждать годами подключения к сети. Минус – топливо дороже сетевого тока.',
    'Units that produce electricity from gas or hydrogen without combustion and without a turbine — quietly and cleanly. They are placed on site to get power without waiting years for a grid connection. The drawback is that the fuel costs more than grid electricity.'],
  gaspipe: ['Трубопроводы, по которым природный газ доходит до электростанций возле дата-центров. Когда сеть перегружена, газ – самый быстрый способ получить много энергии, но его надо физически подвести. В итоге всё упирается в пропускную способность труб.',
    'The pipelines that bring natural gas to the power plants beside data centers. When the grid is congested, gas is the fastest way to get a lot of energy — but it has to physically reach the site. In the end everything comes down to pipeline capacity.'],
  gasturbines: ['Турбины, которые сжигают газ и вырабатывают электричество – самый быстрый способ дать дата-центру много мощности прямо на месте, не дожидаясь сети. Спрос вырос так, что очередь на большие турбины растянулась на годы. Делают их в мире буквально несколько компаний.',
    'Turbines that burn gas and generate electricity — the fastest way to give a data center a lot of power on site without waiting for the grid. Demand has grown so much that the queue for large turbines now runs into years. Literally a few companies in the world make them.'],
  power: ['Само электричество как товар: компании, которые его вырабатывают и продают дата-центрам вместе с подключением к сети. Сегодня энергия – дефицитнее чипов: очередь на подключение местами превышает 8 лет. Кто контролирует доступ к мощности, тот задаёт темп всей стройке.',
    'Electricity itself as a product: the companies that generate it and sell it to data centers along with a grid connection. Today energy is scarcer than chips: the interconnection queue exceeds eight years in places. Whoever controls access to capacity sets the pace of the entire build.'],
  transformers: ['Устройство, которое меняет напряжение, чтобы ток из высоковольтной линии можно было безопасно подать на оборудование дата-центра. Без него электричество из сети просто не довести до серверов. Внутри у него – та самая электротехническая сталь GOES.',
    'The device that changes voltage so power from a high-voltage line can be safely delivered to data center equipment. Without it grid electricity simply cannot reach the servers. Inside sits that same GOES electrical steel.'],
  switchgear: ['Электрощиты дата-центра: набор мощных выключателей и защит, который распределяет ток по объекту и мгновенно отключает участок при аварии. От него зависит, переживёт ли площадка короткое замыкание без потери всего. Спрос и сроки поставки выросли вслед за трансформаторами.',
    'A data center\'s switchgear: the set of heavy breakers and protection that distributes power around the site and instantly isolates a section during a fault. Whether the site survives a short circuit without losing everything depends on it. Demand and lead times rose in step with transformers.'],
  pmgmt: ['Электроника, которая доводит и тонко раздаёт питание уже внутри стойки и сервера – до нужного напряжения на каждый чип. Чем прожорливее AI-ускорители, тем сложнее и дороже эта «последняя миля» электричества.',
    'The electronics that deliver and finely distribute power inside the rack and the server — down to the right voltage at each chip. The hungrier AI accelerators become, the more complex and expensive this last mile of electricity gets.'],
  photonics: ['Технология передавать данные светом вместо электрических сигналов по меди. Оптика связывает серверы между собой, а самая новая её версия (CPO) ставит источник света вплотную к чипу – потому что медь уже не тянет нужные скорости. В 2026 первые такие решения уже пошли в поставку на стороне коммутаторов. Следующий большой сдвиг в устройстве AI-кластеров.',
    'The technology of moving data with light instead of electrical signals over copper. Optics link servers to each other, and its newest form (CPO) puts the light source right up against the chip — because copper can no longer carry the speeds required. In 2026 the first such products started shipping on the switch side. The next big shift in how AI clusters are built.'],
  darkfiber: ['Уже проложенное, но пока не используемое оптоволокно, которое сдают в аренду на десятилетия. IT-гигантам оно нужно, чтобы соединять свои дата-центры между городами собственными «частными» линиями. Ценность – в физически проложенном кабеле, которого не хватает на нужных маршрутах.',
    'Fibre already laid but not yet lit, leased out for decades at a time. The IT giants need it to link their data centers between cities over their own private routes. The value lies in cable physically in the ground on the routes that matter, of which there is not enough.'],
  fiber: ['Само оптоволокно и кабели, включая подводные между континентами, – по ним идёт весь дальний интернет-трафик. Стройка ИИ резко подняла спрос на новые линии. Производить волокно и укладывать подводные кабели умеет узкий круг компаний.',
    'The optical fibre and cable itself, including the submarine links between continents — all long-haul internet traffic runs over them. The AI build sharply raised demand for new routes. Only a narrow set of companies can make fibre and lay submarine cable.'],
  liquid: ['Охлаждение чипов жидкостью вместо воздуха. Новые AI-стойки выделяют столько тепла (120+ кВт), что воздух физически не справляется – жидкость стала обязательной. Nvidia уже проектирует технику сразу под жидкостное охлаждение.',
    'Cooling chips with liquid instead of air. New AI racks throw off so much heat (120+ kW) that air physically cannot cope — liquid became mandatory. Nvidia now designs its hardware for liquid cooling from the outset.'],
  mep: ['Инженерная «начинка» здания дата-центра: охлаждение, разводка питания, вентиляция, трубы. Это до половины стоимости всей стройки и самая дефицитная по рабочим рукам часть. Подрядчики так загружены, что уже отказываются от заказов.',
    'The engineering guts of a data center building: cooling, power distribution, ventilation, pipework. It is up to half the cost of the whole build and the part scarcest in labour. Contractors are so loaded that they are already turning work down.'],
  contracting: ['Компании, которые физически строят кампус и подводят к нему электросети: земля, здания, ЛЭП, подстанции, монтаж. Главный дефицит тут не деньги, а бригады: на пике стройки кампуса на 1 ГВт нужно 3–4 тысячи электриков. Кто умеет их собрать, тот и держит сроки.',
    'The companies that physically build the campus and bring power to it: land, buildings, transmission lines, substations, installation. The scarce resource here is not money but crews: at the peak of a 1 GW campus build you need 3,000–4,000 electricians. Whoever can assemble them controls the schedule.'],
  rack: ['Точка, где всё собирается вместе: чипы, память, питание и охлаждение превращаются в готовую AI-стойку и кластер, которые сдают в аренду под обучение моделей. Здесь физическая цепочка становится вычислительной мощностью, которую продают по часам. Сюда же входят новые GPU-операторы, выросшие на дефиците чипов.',
    'The point where everything comes together: chips, memory, power and cooling become a finished AI rack and cluster, leased out for training models. Here the physical chain becomes compute sold by the hour. It also includes the new GPU operators that grew out of the chip shortage.'],
  lab: ['Компании, которые обучают сами передовые нейросети, – конечный потребитель всей этой инфраструктуры. Ради них строится весь стек: они сжигают гигаватты энергии и миллиарды долларов на обучение. Ставка дорогая и рискованная – кто победит, пока не ясно.',
    'The companies that train the frontier models themselves — the end consumer of all this infrastructure. The whole stack is built for them: they burn gigawatts of power and billions of dollars on training. The bet is expensive and risky — who wins is still unclear.'],
  apps: ['Софт, который встраивает нейросети в реальную работу компаний и превращает ответы модели в деньги. Именно здесь в итоге окупаются триллионы, вложенные в стройку. Пока «железо» дорожает, ценность смещается к тем, кто умеет продать ИИ бизнесу.',
    'The software that embeds neural networks into companies\' actual work and turns a model\'s answers into money. This is where the trillions poured into the build ultimately have to pay back. While the hardware grows more expensive, value shifts to whoever can sell AI to a business.'],
  hbmmat: ['Специальные материалы, без которых не собрать AI-чип и его память: плёнка ABF (изолирующий слой в подложке под чипом) и составы, которыми склеивают «этажи» HBM. Расходуются на каждом чипе. Делают их буквально несколько японских компаний.',
    'The special materials without which an AI chip and its memory cannot be assembled: ABF film (the insulating layer in the substrate under the chip) and the compounds used to bond the storeys of an HBM stack. They are consumed on every chip. Literally a few Japanese companies make them.'],
  hbm: ['Сверхбыстрая память, собранная в вертикальную стопку из 8–12, а скоро 16 кристаллов DRAM, пронизанных тысячами микро-отверстий (TSV), и поставленная вплотную к вычислительному чипу на одной подложке. Один такой «этаж» гонит больше 1 терабайта данных в секунду – именно этим она кормит GPU. Новое поколение HBM4 (запуск – начало 2026) удваивает ширину канала до 2048 бит и разгоняется до ~2 ТБ/с. Стопка из 12 слоёв стоит дороже $600, а в одном ускорителе Nvidia их 6–8 – то есть память дороже самого чипа.',
    'Ultra-fast memory assembled into a vertical stack of 8–12 — soon 16 — DRAM dies, pierced by thousands of micro-vias (TSVs), and placed right beside the compute die on a shared substrate. One such stack moves over a terabyte of data per second — that is how it feeds the GPU. The new HBM4 generation (launching in early 2026) doubles the channel width to 2,048 bits and pushes toward ~2 TB/s. A 12-layer stack costs over $600, and one Nvidia accelerator carries 6–8 of them — so the memory costs more than the chip.'],
  dram: ['Обычная оперативная память серверов (DDR5) и её мобильная версия (LPDDR5X). Физически те же кремниевые кристаллы с ячейками, что и HBM, но разложенные в один слой, а не в стопку. Именно на неё завод тратит пластину, если не переводит её под более дорогую HBM – поэтому судьба DRAM намертво связана с HBM.',
    'Ordinary server main memory (DDR5) and its mobile variant (LPDDR5X). Physically the same silicon dies with cells as HBM, but laid out in a single layer rather than a stack. It is what a fab spends a wafer on when it does not convert that wafer to more expensive HBM — which is why DRAM\'s fate is welded to HBM\'s.'],
  nand: ['Энергонезависимая флеш-память и собранные из неё серверные SSD – «склад» под данные, которые модель читает при обучении и работе. В отличие от DRAM, не теряет данные без питания и стоит дешевле за гигабайт, поэтому её ставят там, где нужен объём, а не скорость. Топовые накопители уже дошли до 245 ТБ в одном корпусе.',
    'Non-volatile flash memory and the server SSDs built from it — the warehouse for the data a model reads during training and in operation. Unlike DRAM it keeps data without power and costs less per gigabyte, so it goes where capacity matters more than speed. Top drives already reach 245 TB in a single unit.'],
  asic: ['Вычислительные чипы, спроектированные «под заказ» под конкретного гиганта и одну задачу – например, тензорный процессор Google (TPU) или ускоритель Meta (MTIA) – вместо покупки универсальных GPU у Nvidia. Под свою нагрузку такой чип дешевле и экономичнее, но негибкий. Сами Google и Meta его не проектируют – отдают дизайн-хаусам.',
    'Compute chips designed to order for one specific giant and one task — Google\'s tensor processor (TPU), say, or Meta\'s accelerator (MTIA) — instead of buying general-purpose GPUs from Nvidia. For its own workload such a chip is cheaper and more efficient, but inflexible. Google and Meta do not design them in-house; they hand the design to specialist houses.'],
  netsilicon: ['Чипы, которые гоняют данные между тысячами серверов: коммутаторные кристаллы (по сути гигантские «развязки» на десятки терабит в секунду), ретаймеры (усиливают сигнал, чтобы он дошёл по плате без потерь) и драйверы для активных кабелей. Без них кластер из тысяч GPU остаётся набором отдельных машин.',
    'The chips that move data between thousands of servers: switch dies (in effect giant interchanges running tens of terabits per second), retimers (which boost the signal so it survives the trip across a board) and drivers for active cables. Without them a cluster of thousands of GPUs is just a pile of separate machines.'],
  fabric: ['Технология, которая связывает GPU между собой. Внутри стойки – «масштаб-вверх»: NVLink от Nvidia сваривает 72 чипа в одну гигантскую видеокарту с общей памятью (стойка GB200 NVL72). Между стойками – «масштаб-наружу»: InfiniBand или Ethernet соединяют тысячи таких машин в кластер. Это не провода, а протоколы и коммутаторы, задающие, как быстро чипы «разговаривают».',
    'The technology that links GPUs to each other. Inside the rack it is scale-up: Nvidia\'s NVLink welds 72 chips into one giant graphics card with shared memory (the GB200 NVL72 rack). Between racks it is scale-out: InfiniBand or Ethernet joins thousands of such machines into a cluster. These are not cables but the protocols and switches that set how fast the chips talk.'],
  transceivers: ['Готовые оптические модули – «переходники», которые вставляют в порт коммутатора или сервера, чтобы электрический сигнал превратить в свет и отправить по волокну. Нынешнее поколение – 800 гигабит, следующее (1,6 терабита) разгоняется в 2026. Внутри модуля – лазер, оптика и чип-обработчик; это отдельный продукт над «сырой» фотоникой.',
    'Finished optical modules — the adapters plugged into a switch or server port to turn an electrical signal into light and send it down the fibre. The current generation is 800 gigabit; the next (1.6 terabit) ramps through 2026. Inside a module sit a laser, the optics and a processing chip; it is a distinct product sitting above raw photonics.'],
  server: ['Точка, где всё железо превращается в машину: вычислительные чипы, память, платы, блоки питания и жидкостное охлаждение собирают в готовый AI-сервер, а серверы – в целую стойку (например, GB200 NVL72 – 72 GPU в одном шкафу). Такая стойка весит под полторы тонны, содержит около 2 миль медных кабелей и почти 200 быстроразъёмных соединений для жидкости.',
    'The point where all the hardware becomes a machine: compute chips, memory, boards, power supplies and liquid cooling are assembled into a finished AI server, and the servers into a full rack (the GB200 NVL72, for instance — 72 GPUs in one cabinet). Such a rack weighs close to a tonne and a half, carries roughly two miles of copper cabling and almost 200 quick-disconnect fittings for liquid.'],
  inference: ['Работа уже обученной модели: каждый раз, когда она отвечает на вопрос, пишет код или разбирает картинку, это и есть инференс. Обучение – один дорогой «забег» на месяцы, а инференс идёт непрерывно, миллиарды раз в день, и считается по цене за ответ. Требования тут другие: важна не столько сырая мощность, сколько скорость ответа и то, сколько стоит и сколько энергии съедает каждый запрос.',
    'The work of an already-trained model: every time it answers a question, writes code or reads an image, that is inference. Training is one expensive run lasting months; inference runs continuously, billions of times a day, and is priced per answer. The requirements differ: what matters is less raw throughput than response speed, and how much each request costs and consumes.'],
});

// ─ Node role – deeper "why this matters in the whole chain" per sub-sector ─
// Zooms out from the definition: the layer's position in the full supply
// chain, where the bottleneck is, who holds the power and why. Plain Russian.
const NODE_ROLE = biMap({
  goes: ['Это самое начало энергетической ветки цепочки: отсюда сталь идёт в трансформаторы, а дальше – на подстанции и в дата-центр. Загвоздка в том, что варить такую сталь умеют единицы заводов в мире, а в Северной Америке – вообще один, Cleveland-Cliffs. Спрос на трансформаторы взлетел из-за ИИ, но быстро нарастить выпуск стали нельзя: новую линию строят годами. Поэтому скучный на вид материал превратился в один из самых дефицитных узлов всей стройки – тот, кто его контролирует, держит вход в энергоцепочку.',
    'This is the very start of the power branch: the steel goes into transformers, then on to substations and the data center. The catch is that only a handful of mills in the world can make it, and in North America only one — Cleveland-Cliffs. AI sent transformer demand vertical, but steel output cannot be scaled quickly: a new line takes years. So a boring-looking material became one of the scarcest nodes in the whole build-out — whoever controls it holds the entrance to the power chain.'],
  resist: ['Без резиста не сделать ни один чип, а значит и ни один AI-ускоритель, – это обязательный расходник в самом начале производства. Загвоздка здесь не в объёме, а в качестве: для тончайших техпроцессов (EUV) нужна почти идеально чистая химия, которую освоили лишь несколько японских компаний. Это даёт им устойчивое, почти монопольное положение – заменить поставщика крайне тяжело, а спрос растёт с каждым новым поколением чипов. Классический «тихий» лидер, от которого зависит вся дальнейшая цепочка кремния.',
    'Without resist there is no chip, and therefore no AI accelerator — it is a mandatory consumable at the very start of production. The catch is quality, not volume: the finest nodes (EUV) need near-perfect chemistry that only a few Japanese companies have mastered. That gives them a durable, near-monopoly position — switching supplier is extremely hard, and demand grows with every chip generation. A classic quiet leader the whole silicon chain downstream depends on.'],
  chem: ['Это невидимый, но обязательный вход в производство чипов: без чистой химии не сделать ни один кремниевый кристалл. Расход растёт вместе с каждым новым заводом и каждым поколением чипов, а требования к чистоте настолько жёсткие, что квалифицироваться в поставщики очень тяжело. Поэтому рынок поделён между несколькими специалистами – Entegris в материалах, Shin-Etsu в химии и пластинах. Тихий стабильный бизнес-«расходник» в самом начале цепочки кремния.',
    'This is the invisible but mandatory input to chip production: without clean chemistry there is no silicon crystal. Consumption rises with every new fab and every chip generation, and the purity requirements are so severe that qualifying as a supplier is very hard. So the market is split between a few specialists — Entegris in materials, Shin-Etsu in chemicals and wafers. A quiet, stable consumables business at the very start of the silicon chain.'],
  inpgaas: ['Это фундамент оптической связи: без этих подложек не сделать лазеры и приёмники, а без них дата-центры не соединить на нужных скоростях. Главная сложность – сам материал: кристаллы растут медленно, пластины маленькие и дорогие, а умеют это единицы компаний. По мере перехода на оптику (CPO) спрос на них только растёт. Вверх по цепочке это сырьё, вниз оно идёт в фотонику и AI-силикон.',
    'This is the foundation of optical connectivity: without these substrates there are no lasers and receivers, and without those the data centers cannot be linked at the required speeds. The difficulty is the material itself: crystals grow slowly, wafers are small and expensive, and only a few companies can do it. As the industry moves to optics (CPO) demand only rises. Upstream it is a raw material; downstream it feeds photonics and AI silicon.'],
  titanium: ['Этот узел связывает металлургию с энергетикой стройки: без жаропрочного титана не сделать газовую турбину, а турбины сейчас – самый быстрый способ дать дата-центру энергию. Металл авиакосмического класса: длинная сертификация и узкий круг поставщиков создают естественный барьер. Спрос тянут сразу и авиация, и энергетика, поэтому мощности в дефиците. Лидеры – Carpenter и ATI, специалисты по высокотехнологичным сплавам.',
    'This node ties metallurgy to the power side of the build: without heat-resistant titanium there is no gas turbine, and turbines are currently the fastest way to give a data center power. Aerospace-grade metal: long qualification and a narrow supplier base create a natural barrier. Aviation and power pull on the same capacity, so it is in shortage. The leaders are Carpenter and ATI, specialists in high-performance alloys.'],
  litho: ['Через этот узел проходит вся индустрия: любой чип в мире сделан на этих машинах. Рынок – жёсткая олигополия, где у каждого своя незаменимая ниша: ASML монопольно делает EUV-литографы (по ~$200 млн каждый), Applied Materials и Lam – осаждение и травление, KLA – контроль дефектов. Заменить их нечем, а спрос растёт с каждым новым заводом. Одна из самых защищённых позиций во всей цепочке.',
    'The whole industry passes through this node: every chip in the world is made on these machines. The market is a hard oligopoly where each player owns an irreplaceable niche: ASML has a monopoly on EUV scanners (~$200M each), Applied Materials and Lam own deposition and etch, KLA owns defect inspection. There is nothing to replace them with, and demand rises with every new fab. One of the most defended positions in the entire chain.'],
  test: ['Это последний фильтр перед тем, как дорогой AI-чип попадёт в сервер: тестирование ловит брак, который иначе всплыл бы уже у клиента. Чем дороже и сложнее чипы, тем важнее этот этап – и тем больше на нём зарабатывают. Рынок держат несколько специалистов: Teradyne и Advantest в тестерах, AEHR в «прожарке». Спрос тянет вверх переход на новые типы чипов и память.',
    'This is the last filter before an expensive AI chip reaches a server: test catches the defects that would otherwise surface at the customer. The more expensive and complex the chips, the more this step matters — and the more it earns. A few specialists hold the market: Teradyne and Advantest in testers, AEHR in burn-in. Demand is pulled up by the move to new chip types and to memory.'],
  eda: ['Это скрытый фундамент всей отрасли: ни один современный чип нельзя спроектировать без этого софта. Рынок – крепкая дуополия Synopsys и Cadence: их инструментами пользуется буквально каждая чип-компания, а переход на другого поставщика почти невозможен. Это даёт им редкое сочетание – устойчивый доход и рост вместе со всем рынком чипов. Одна из самых «липких» и защищённых позиций в цепочке.',
    'This is the hidden foundation of the whole industry: no modern chip can be designed without this software. The market is a solid duopoly of Synopsys and Cadence: literally every chip company uses their tools, and switching supplier is close to impossible. That gives them a rare combination — durable revenue plus growth with the entire chip market. One of the stickiest, best-defended positions in the chain.'],
  ip: ['Это узел, который берёт понемногу с каждого выпущенного чипа, ничего не производя физически. Особенно важна технология склейки кристаллов (hybrid bonding) – без неё не собрать современную AI-память HBM. Контроль над ключевыми патентами и блоками даёт устойчивые роялти и сильную переговорную позицию. Лидеры – Arm в лицензиях, Adeia в патентах, BESI и ASMPT в оборудовании для склейки.',
    'This node takes a little from every chip shipped while physically producing nothing. Hybrid bonding matters especially — without it there is no modern HBM. Control of the key patents and blocks yields durable royalties and a strong negotiating position. The leaders are Arm in licensing, Adeia in patents, BESI and ASMPT in bonding equipment.'],
  silicon: ['Это центр тяжести всей стройки – самый ценный и самый конкурентный узел цепочки. Проектируют такие чипы единицы (Nvidia, AMD, Broadcom), но почти все зависят от одного завода – TSMC, который их физически делает. Поэтому реальная власть здесь делится между теми, кто владеет архитектурой, и теми, кто владеет производством. Вверх узел тянет химию, пластины и оборудование, вниз – упаковку, платы и всю стойку.',
    'This is the centre of gravity of the whole build — the most valuable and the most contested node in the chain. Only a few design these chips (Nvidia, AMD, Broadcom), but almost all of them depend on one fab — TSMC — to physically make them. So real power here is split between whoever owns the architecture and whoever owns the manufacturing. Upstream the node pulls chemistry, wafers and equipment; downstream it feeds packaging, boards and the whole rack.'],
  wbg: ['Это узел, который делает энергосистему дата-центра эффективной: чем прожорливее AI-чипы, тем дороже обходятся потери на преобразовании тока и тем ценнее эти полупроводники. Пока это скорее растущая ниша, чем пробка, но её значение увеличивается с каждым поколением стоек. Рынок делят Wolfspeed (карбид кремния), Infineon и onsemi. Материал сложен в производстве, что ограничивает круг игроков.',
    'This node is what makes a data center\'s power system efficient: the hungrier the AI chips, the more conversion losses cost and the more valuable these semiconductors become. It is still more a growing niche than a bottleneck, but its importance rises with every rack generation. Wolfspeed (silicon carbide), Infineon and onsemi split the market. The material is hard to manufacture, which limits the field.'],
  pkg: ['Долго это была главная пробка производства, но к концу 2026 она расшивается: TSMC нарастила мощности CoWoS почти вчетверо (примерно с 35 до 130 тыс. пластин в месяц), и разрыв между спросом и предложением сужается с ~20% до ~10%. Ограничение сместилось выше – в память (HBM) и в электричество. Упаковка остаётся тесной, но с понятным планом расширения; часть объёмов TSMC отдаёт на Amkor и SPIL. Оборудование делают BESI, ASMPT, Camtek.',
    'For a long time this was the main production bottleneck, but by the end of 2026 it is easing: TSMC has nearly quadrupled CoWoS capacity (roughly 35k to 130k wafers a month) and the gap between demand and supply is narrowing from ~20% to ~10%. The constraint has moved upstream — into memory (HBM) and into electricity. Packaging stays tight but with a clear expansion plan; TSMC hands part of the volume to Amkor and SPIL. The equipment comes from BESI, ASMPT and Camtek.'],
  pcb: ['Этот узел не раз оказывался неожиданной пробкой: без сложных подложек нельзя выпустить готовый ускоритель, сколько бы ни было чипов. Самые продвинутые (ABF-подложки) умеют делать единицы заводов, почти все – в Азии. Спрос растёт быстрее, чем строятся новые линии, поэтому дефицит периодически возвращается. Лидеры – Ibiden и Unimicron в подложках, TTM в платах.',
    'This node has repeatedly turned out to be an unexpected bottleneck: without advanced substrates you cannot ship a finished accelerator, however many chips you have. The most advanced (ABF substrates) can be made by only a handful of plants, almost all in Asia. Demand grows faster than new lines are built, so shortages keep returning. The leaders are Ibiden and Unimicron in substrates, TTM in boards.'],
  nuc: ['Это про доступ к «чистым гигаваттам»: атомная станция даёт стабильную энергию, которую не могут дать ветер и солнце. Поскольку строить новые АЭС долго, ценность смещается к действующим блокам – и тот, кто законтрактовал их выработку, получает преимущество. Ограничение здесь – не технология, а само наличие мощности, которую можно подключить. Ключевой игрок в топливе и обслуживании реакторов – BWX Technologies.',
    'This is about access to clean gigawatts: a nuclear plant supplies steady power that wind and solar cannot. Because new plants take so long to build, the value shifts to the units already running — and whoever has contracted their output has the advantage. The constraint here is not technology but the sheer availability of connectable capacity. The key player in fuel and reactor services is BWX Technologies.'],
  smr: ['Это ставка на то, как дата-центры будут питаться через 5–10 лет: компактный реактор рядом с площадкой снял бы зависимость от перегруженной сети. Пока это в основном обещание – проекты проходят лицензирование, первые энергоблоки только строятся. Поэтому узел скорее про потенциал и риск, чем про сегодняшнюю мощность. Заметные имена – Oklo и NuScale, а BWXT делает для них компоненты.',
    'This is a bet on how data centers will be powered in 5–10 years: a compact reactor next to the site would remove the dependence on an overloaded grid. For now it is mostly a promise — projects are in licensing and the first units are only being built. So the node is about potential and risk rather than today\'s capacity. The notable names are Oklo and NuScale, with BWXT making components for them.'],
  fuel: ['Это способ получить электричество «здесь и сейчас», в обход очереди на подключение к сети – что в условиях дефицита мощности крайне ценно. Технически узел зрелый, но экономику ограничивает цена топлива. Поэтому его берут как быстрый мост, пока нет полноценного подключения. Рынок для дата-центров практически олицетворяет одна компания – Bloom Energy.',
    'This is a way to get electricity here and now, bypassing the grid-connection queue — which is extremely valuable when capacity is short. The technology is mature; the economics are limited by fuel cost. So it is taken as a fast bridge until a proper connection exists. For data centers the market is essentially one company — Bloom Energy.'],
  gaspipe: ['Это тихая, но реальная преграда в энергоснабжении: газовая турбина бесполезна, если к ней не подведён газ. Права на подключение и свободная пропускная способность труб становятся дефицитным ресурсом там, где строят кампусы. Бизнес устойчивый – плата за транспортировку газа мало зависит от его цены. Крупный игрок с обширной сетью – Energy Transfer.',
    'This is a quiet but real obstacle in power supply: a gas turbine is useless if no gas reaches it. Connection rights and spare pipeline capacity become a scarce resource wherever campuses are built. The business is durable — transport fees depend little on the gas price. A large player with an extensive network is Energy Transfer.'],
  gasturbines: ['Это тот узел, где стройка упирается в физику генерации: турбина – самый быстрый способ дать кампусу сотни мегаватт прямо на месте. Спрос так обогнал производство, что очередь на большие турбины расписана на несколько лет вперёд: у GE Vernova бэклог достиг ~100 ГВт ($176 млрд), а цены за три года выросли примерно втрое. Делают их в мире буквально трое – GE Vernova, Siemens Energy и Mitsubishi, – отсюда огромная ценовая власть. Вверх узел держится на жаропрочном титане, вниз питает всю электрическую цепочку.',
    'This is where the build runs into the physics of generation: a turbine is the fastest way to give a campus hundreds of megawatts on site. Demand has so outrun production that the queue for large turbines runs years ahead: GE Vernova\'s backlog reached ~100 GW ($176bn) and prices have roughly tripled in three years. Literally three companies make them — GE Vernova, Siemens Energy and Mitsubishi — hence enormous pricing power. Upstream the node rests on heat-resistant titanium; downstream it feeds the entire electrical chain.'],
  power: ['Все прочие ограничения в цепочке – чипы, память, оборудование – по сути двух-трёхлетние: есть спрос, и деньги их расшивают. Появляется заказ – за пару лет строят новый завод и наращивают выпуск. С электричеством так нельзя. Тут имеешь дело напрямую с государством – очереди на подключение, лицензии, разрешения, долгие контракты, – и всё это движется по своим срокам, которые не купить. Бэклог заявок на подключение достиг ~2600 ГВт, средний срок ожидания – около 5 лет (для крупных площадок дольше), а само ключевое ограничение сместилось ещё глубже, в высоковольтные трансформаторы. Именно поэтому электроэнергия становится главным ограничением всей стройки: она задаёт темп остальным звеньям и решает, где и когда вообще можно построить дата-центр, – а власть смещается от IT-компаний к энергетике. Крупнейший бенефициар по оборудованию и генерации – GE Vernova.',
    'Every other constraint in the chain — chips, memory, equipment — is essentially a two-to-three-year problem: there is demand, and money clears it. An order appears and within a couple of years a new plant is built and output rises. Electricity does not work that way. Here you deal directly with the state — interconnection queues, licences, permits, long contracts — and all of it moves on its own timetable, which cannot be bought. The interconnection backlog has reached ~2,600 GW with an average wait of about 5 years (longer for large sites), and the binding constraint has moved deeper still, into high-voltage transformers. That is why electricity is becoming the governing constraint on the whole build: it sets the pace for every other link and decides where and when a data center can be built at all — and power shifts from the IT companies to the utilities. The largest beneficiary in equipment and generation is GE Vernova.'],
  switchgear: ['Это звено идёт сразу за трансформаторами и упирается в те же ограничения: спрос обогнал производство, сроки поставки растянулись. Без распределительных щитов площадку не запустить и не защитить от аварий, поэтому это тоже критический путь стройки. Рынок держат несколько крупных электротехнических компаний – Eaton, Schneider, ABB, а также нишевый Powell. Ценовая власть у производителей выросла вслед за дефицитом.',
    'This link sits immediately after transformers and hits the same constraints: demand has outrun production and lead times have stretched. Without switchgear a site cannot be energised or protected against faults, so it is on the critical path too. A few large electrical companies hold the market — Eaton, Schneider, ABB — plus the niche player Powell. Manufacturers\' pricing power has risen with the shortage.'],
  pmgmt: ['Это «последняя миля» электричества – там, где рост энергопотребления AI-чипов бьёт больнее всего: потери и тепло надо убирать у самого кристалла. Чем плотнее стойки, тем сложнее и дороже эта электроника и тем ценнее те, кто умеет её делать. Здесь всё чаще применяют широкозонные полупроводники ради КПД. Лидеры – Eaton на уровне стойки, Monolithic Power и Infineon на уровне чипа.',
    'This is electricity\'s last mile — where the rise in AI chip power draw bites hardest: losses and heat have to be removed right at the die. The denser the racks, the more complex and expensive this electronics becomes, and the more valuable those who can build it. Wide-bandgap semiconductors are increasingly used here for efficiency. The leaders are Eaton at rack level, Monolithic Power and Infineon at chip level.'],
  photonics: ['Это следующий крупный сдвиг в устройстве AI-кластеров: медь упёрлась в предел, и связь между чипами переходит на свет. Кто первым доведёт оптику вплотную к чипу (CPO), тот получит преимущество в скорости и энергоэффективности всего кластера. Пока технология на раннем этапе, ставки высоки и для гигантов, и для стартапов. Игроки – Coherent и Lumentum в «железе», Marvell в чипах, Ayar Labs и Lightmatter на переднем крае.',
    'This is the next big shift in how AI clusters are built: copper has hit its limit and chip-to-chip communication is moving to light. Whoever first brings optics right up to the chip (CPO) gains an advantage in the speed and energy efficiency of the whole cluster. The technology is early, so the stakes are high for giants and startups alike. The players are Coherent and Lumentum in hardware, Marvell in chips, Ayar Labs and Lightmatter at the frontier.'],
  darkfiber: ['Это узел про «частные магистрали» IT-гигантов: чтобы связать дата-центры между городами, им нужны собственные оптические линии с гарантированной пропускной способностью. Ценность – в уже проложенном кабеле на нужных маршрутах, которого физически не хватает. Поэтому владельцы волокна получают долгие контракты на десятилетия вперёд. Крупные держатели сетей – Lumen, Uniti, Zayo.',
    'This node is about the private trunk routes of the IT giants: to link data centers between cities they need their own optical lines with guaranteed capacity. The value lies in cable already laid on the right routes, of which there is physically not enough. So fibre owners land contracts running decades ahead. The large network holders are Lumen, Uniti and Zayo.'],
  fiber: ['Это фундамент дальней связи: без волокна и подводных кабелей нет межрегионального трафика, на котором работают распределённые дата-центры. Стройка ИИ резко подняла спрос, а производить волокно и укладывать подводные линии умеет узкий круг компаний – отсюда многолетние очереди. Это делает узел устойчивым и защищённым. Лидеры – Prysmian и Corning, а также Fabrinet в сборке оптики.',
    'This is the foundation of long-haul connectivity: without fibre and submarine cable there is no inter-regional traffic for distributed data centers to run on. The AI build sharply raised demand, and only a narrow set of companies can make fibre and lay submarine lines — hence multi-year queues. That makes the node durable and defended. The leaders are Prysmian and Corning, plus Fabrinet in optical assembly.'],
  liquid: ['Это уже не опция, а необходимость: новые AI-стойки греются так, что воздух физически не справляется, и переход на жидкость стал вынужденным. Значит, спрос здесь не зависит от настроения рынка – он привязан к каждой новой стойке Nvidia. Кто задаёт стандарт охлаждения, тот встроен в каждый крупный дата-центр. Явный лидер – Vertiv, рядом nVent и специалисты по компонентам.',
    'This is no longer an option but a necessity: new AI racks run so hot that air physically cannot cope, and the move to liquid became forced. So demand here does not depend on market mood — it is tied to every new Nvidia rack. Whoever sets the cooling standard is built into every large data center. The clear leader is Vertiv, with nVent and component specialists alongside.'],
  mep: ['Это узел, где стройка упирается не в деньги, а в людей: инженерных бригад физически не хватает под темп ИИ. Поэтому подрядчики получили редкую для строительства вещь – устойчивую ценовую власть и возможность выбирать заказы. Это делает бизнес неожиданно прибыльным и предсказуемым. Лидеры – Comfort Systems и EMCOR, крупнейшие механические подрядчики США.',
    'This is where the build runs into people rather than money: there are physically not enough engineering crews for the pace AI demands. So contractors got something rare in construction — durable pricing power and the ability to choose their jobs. That makes the business unexpectedly profitable and predictable. The leaders are Comfort Systems and EMCOR, the largest mechanical contractors in the US.'],
  contracting: ['Это физический предел скорости всей стройки: кампус нельзя построить быстрее, чем найдутся бригады и подведутся сети. Дефицит квалифицированных электриков и монтажников превращает генподрядчиков в дефицитный ресурс с растущими ценами. Особенно ценны те, кто умеет тянуть ЛЭП и подстанции – там же, где пробка с подключением. Лидеры – Quanta и MasTec в сетевом строительстве, EMCOR в инженерке.',
    'This is the physical speed limit on the whole build: a campus cannot be built faster than crews can be found and utilities brought in. A shortage of qualified electricians and installers turns general contractors into a scarce resource with rising prices. The most valuable are those who can run transmission lines and substations — exactly where the interconnection bottleneck sits. The leaders are Quanta and MasTec in grid construction, EMCOR in building services.'],
  rack: ['Это точка схождения всей цепочки: сюда стекается всё – чипы, память, платы, питание, охлаждение – и превращается в готовую вычислительную мощность. Здесь физический стек становится деньгами: мощность сдают по часам под обучение моделей. Новый класс игроков (neocloud) вырос именно на дефиците доступа к чипам. Имена – CoreWeave, Nebius, Lambda, Crusoe, IREN.',
    'This is where the whole chain converges: chips, memory, boards, power and cooling all flow in here and come out as finished compute. This is where the physical stack becomes money: capacity is sold by the hour for training models. A new class of player (neocloud) grew precisely out of the shortage of chip access. The names are CoreWeave, Nebius, Lambda, Crusoe and IREN.'],
  lab: ['Это конечный спрос, ради которого построена вся пирамида: передовые лаборатории сжигают гигаватты и миллиарды, обучая модели. Их аппетит и задаёт масштаб всей стройки снизу доверху. Но сама позиция крайне рискованная: расходы огромны, а кто выйдет победителем – не ясно, и ставка может не окупиться. Имена – OpenAI, Anthropic, xAI, Mistral.',
    'This is the end demand the whole pyramid was built for: frontier labs burn gigawatts and billions training models. Their appetite sets the scale of the entire build from top to bottom. But the position itself is extremely risky: the spend is enormous and it is not clear who wins, so the bet may never pay back. The names are OpenAI, Anthropic, xAI and Mistral.'],
  apps: ['Это тот конец цепочки, где всё в итоге должно окупиться: пока стек снизу дорожает, деньги приходят от компаний, которые встраивают ИИ в свою работу. Ценность смещается к тем, кто умеет превратить возможности модели в реальную выручку клиента. Это самый «денежный» слой, но и самый конкурентный. Лидер интеграции в корпоративный софт – ServiceNow.',
    'This is the end of the chain where everything ultimately has to pay for itself: while the stack below grows more expensive, the money comes from companies embedding AI into their own work. Value shifts to whoever can turn a model\'s capabilities into real customer revenue. It is the most monetised layer, and the most competitive. The leader in enterprise-software integration is ServiceNow.'],
  hbmmat: ['Это вход в цепочку памяти и упаковки – уровень «тихих монополий», как GOES-сталь в энерговетке, только японских. Ajinomoto (тот самый пищевой концерн) контролирует ~98% плёнки ABF: без неё не сделать ни одну топовую подложку. Namics – единственный в мире источник компаунда MR-MUF, на котором держится способ укладки HBM у SK Hynix; именно поэтому конкуренты не смогли его скопировать. Resonac делает плёнку NCF и теплоотводы и расширяет мощности в 3,5–5 раз. Отдельно – Advantest, де-факто монополист в тестерах для HBM: чем больше слоёв (12→16→20), тем дороже и обязательнее тест. Мысль для инвестора: самые защищённые позиции здесь – не громкие имена, а поставщики, у которых буквально нет второго источника; их главный риск – концентрация и Япония как единая точка отказа.',
    'This is the entrance to the memory and packaging chain — the level of quiet monopolies, like GOES steel in the power branch, only Japanese. Ajinomoto (the food conglomerate) controls ~98% of ABF film: without it there is no top-end substrate. Namics is the world\'s only source of the MR-MUF compound that SK Hynix\'s HBM stacking method rests on — which is precisely why competitors could not copy it. Resonac makes NCF film and heat spreaders and is expanding capacity 3.5–5×. Separately, Advantest is the de facto monopolist in HBM testers: the more layers (12→16→20), the more expensive and unavoidable the test. The thought for an investor: the best-defended positions here are not the loud names but the suppliers with literally no second source; their main risk is concentration, with Japan as a single point of failure.'],
  hbm: ['Это новый центр тяжести всей цепочки: память – уже около 63% стоимости AI-чипа (сам вычислительный кристалл – лишь ~13%). Рынок держат трое: SK Hynix (~55%+, первым запустил HBM4, главный поставщик Nvidia), Samsung (~28%, навёрстывает после провала квалификации HBM3E) и Micron (остаток, но растёт быстрее всех – единственная американская ставка). Все распроданы на 2026 год, 2027-й почти законтрактован, а на 2027 обещают кратный рост цен. Ключевой сдвиг для альфы: у HBM4 логическую «базу» стопки впервые делают не сами производители памяти, а TSMC (12 нм) – это впервые вставляет фаундри внутрь цепочки памяти и намертво связывает SK Hynix с TSMC. Кто контролирует HBM, контролирует темп выпуска ускорителей.',
    'This is the chain\'s new centre of gravity: memory is already around 63% of an AI chip\'s cost (the compute die itself is only ~13%). Three players hold the market: SK Hynix (~55%+, first to ship HBM4, Nvidia\'s main supplier), Samsung (~28%, catching up after failing HBM3E qualification) and Micron (the remainder, but growing fastest — the only American bet). All are sold out for 2026, 2027 is close to contracted, and prices for 2027 are expected to rise several-fold. The key shift for alpha: with HBM4 the logic base die of the stack is made for the first time not by the memory makers but by TSMC (12nm) — which inserts a foundry inside the memory chain for the first time and binds SK Hynix to TSMC. Whoever controls HBM controls the pace of accelerator output.'],
  dram: ['Это второй, менее очевидный рычаг того же дефицита: HBM «съедает» всё больше пластин (уже ~23% всех мощностей DRAM в 2026, потому что на гигабайт HBM нужно втрое больше площади), и обычная DRAM физически становится дефицитной. Результат – контрактные цены на DDR5 выросли на 90%+ за один квартал, чего не было ~15 лет. Спрос при этом не свой: его тянут те же AI-серверы. Предложение заперто той же тройкой (SK Hynix, Samsung, Micron), снизу поджимает китайский CXMT. Для инвестора это та же ставка на суперцикл памяти, но с более широкой базой и меньшей завязкой на один продукт – растёт маржа по всему комплексу, а не только в HBM.',
    'This is the second, less obvious lever on the same shortage: HBM is eating more and more wafers (already ~23% of all DRAM capacity in 2026, because a gigabyte of HBM needs three times the area), and ordinary DRAM is becoming physically scarce. The result: DDR5 contract prices rose 90%+ in a single quarter, which has not happened in ~15 years. The demand is not its own — it is pulled by the same AI servers. Supply is locked behind the same three (SK Hynix, Samsung, Micron), with China\'s CXMT pressing from below. For an investor this is the same memory super-cycle bet but with a broader base and less dependence on one product — margin rises across the whole complex, not only in HBM.'],
  nand: ['Ещё в 2024 это был перепроизведённый скучный товар – в 2026 верхушка рынка распродана вперёд, а цены на серверные SSD выросли на 70%+ за квартал. Драйвер – инференс (модель в основном читает данные, поэтому берут дешёвую многоуровневую QLC-память большого объёма) плюс дефицит жёстких дисков. Игроки: Samsung (лидер по выручке), SK Hynix через Solidigm, Micron, японская Kioxia и выделенная из Western Digital SanDisk – причём Kioxia и SanDisk требуют 100%-ю предоплату за объёмы 2027+. Альфа тут тоньше, чем в DRAM: часть аналитиков считает рынок NAND более конкурентным (пять поставщиков, короткие сроки поставки), поэтому он менее «заперт» – скорее второй эшелон той же темы.',
    'As recently as 2024 this was an over-supplied, boring commodity — in 2026 the top of the market is sold out ahead and server SSD prices have risen 70%+ in a quarter. The driver is inference (a model mostly reads data, so buyers take cheap, high-capacity multi-level QLC) plus a shortage of hard drives. The players: Samsung (revenue leader), SK Hynix via Solidigm, Micron, Japan\'s Kioxia and SanDisk, spun out of Western Digital — with Kioxia and SanDisk demanding 100% prepayment for 2027+ volumes. The alpha here is thinner than in DRAM: some analysts see NAND as more competitive (five suppliers, short lead times) and therefore less locked — more a second tier of the same theme.'],
  asic: ['Это узел, где гиперскейлеры пытаются слезть с иглы Nvidia, и один из главных источников альфы в теме. Кастомные ускорители растут ~45% в год против ~16% у GPU. Но ключ в том, кто на этом зарабатывает: проектируют эти чипы Broadcom (~60% рынка – TPU для Google, MTIA для Meta, по слухам чипы Anthropic и OpenAI) и Marvell (~25–35%), а не сами гиганты. То есть даже уходя от Nvidia, гиперскейлер платит Broadcom – и за ускоритель, и за сеть. Ниже – тайваньские дизайн-хаусы Alchip и GUC (подразделение TSMC), которые физически доводят чип до фабрики. Вверх узел держится на софте EDA и лицензиях Arm, вниз идёт в упаковку и стойку.',
    'This is the node where the hyperscalers try to get off Nvidia\'s needle, and one of the main sources of alpha in the theme. Custom accelerators are growing ~45% a year against ~16% for GPUs. But the key is who earns from it: these chips are designed by Broadcom (~60% of the market — TPUs for Google, MTIA for Meta, reportedly chips for Anthropic and OpenAI) and Marvell (~25–35%), not by the giants themselves. So even in moving away from Nvidia, a hyperscaler pays Broadcom — for the accelerator and for the network. Below them sit the Taiwanese design houses Alchip and GUC (a TSMC unit), which physically take the chip to the fab. Upstream the node rests on EDA software and Arm licences; downstream it feeds packaging and the rack.'],
  netsilicon: ['Это кремний под всей сетью дата-центра – и структурно один из самых недооценённых бенефициаров. Рынок держит Broadcom: его коммутатор Tomahawk 6 (102 Тбит/с) стоит в основе почти любой крупной AI-сети, и даже уходя от Nvidia на самих ускорителях, гиперскейлер всё равно платит Broadcom за сеть – победитель при любом сценарии. Рядом Marvell (паритет по коммутаторам плюс электрооптика). В нишах – две интересные, но рискованные ставки: Astera Labs (ретаймеры PCIe и фабрика связности, выручка +100%+) и Credo (активные электрические кабели, выручка утроилась на Microsoft и Amazon). У обоих сильная позиция, но опасная концентрация – почти вся выручка на паре гиперскейлеров, и потеря одного клиента бьёт напрямую.',
    'This is the silicon under the whole data-center network — and structurally one of the most underrated beneficiaries. Broadcom holds the market: its Tomahawk 6 switch (102 Tbit/s) sits at the base of almost every large AI network, and even a hyperscaler moving off Nvidia on the accelerators still pays Broadcom for the network — a winner in every scenario. Marvell is alongside (parity on switches plus electro-optics). In the niches sit two interesting but risky bets: Astera Labs (PCIe retimers and connectivity fabric, revenue +100%+) and Credo (active electrical cables, revenue tripled on Microsoft and Amazon). Both hold strong positions but with dangerous concentration — nearly all revenue rests on a couple of hyperscalers, and losing one client hits directly.'],
  fabric: ['Это самый стратегически спорный слой 2026 года и главное конкурентное преимущество Nvidia. NVLink проприетарен, и именно он делает из 72 отдельных чипов единую машину – повторить это конкуренты пока не могут, поэтому стойку NVL72 не воспроизвести. Индустрия отвечает открытым стандартом UALink (за ним AMD, Google, Microsoft, Amazon – почти все, кроме Nvidia), но на середину 2026 под него ещё нет работающих коммутаторных чипов: реальная угроза существует на бумаге, но не в железе до второй половины 2026. Параллельно во внешней сети идёт война InfiniBand (Nvidia, доминирует в обучении) против Ethernet (лагерь Ultra Ethernet + Arista, отвоёвывает инференс). Кто задаёт фабрику, тот удерживает клиента внутри своей экосистемы.',
    'This is the most strategically contested layer of 2026 and Nvidia\'s main competitive advantage. NVLink is proprietary, and it is what turns 72 separate chips into a single machine — competitors cannot reproduce it yet, which is why the NVL72 rack cannot be copied. The industry\'s answer is the open UALink standard (backed by AMD, Google, Microsoft, Amazon — almost everyone except Nvidia), but as of mid-2026 there are still no working switch chips for it: the threat is real on paper but not in silicon before the second half of 2026. In parallel, the external network is fighting InfiniBand (Nvidia, dominant in training) against Ethernet (the Ultra Ethernet camp plus Arista, winning inference back). Whoever sets the fabric keeps the customer inside their ecosystem.'],
  transceivers: ['Это один из самых чистых способов сыграть на буме AI-сетей: на каждый ускоритель приходится всё больше оптических линий, и за 2026 объёмы 800G+ выросли в разы. Но настоящее «горлышко» – не сборка модулей, а лазеры EML вверху цепочки: их серийно на 200 Гбит/канал (нужны для 1,6T) делает почти только Lumentum, и они в дефиците до 2027 – Nvidia уже скупает мощности вперёд. Сборку крупнейшей доли модулей держит Fabrinet (Таиланд) – контрактный завод для Nvidia, Cisco, Coherent, строит новый корпус на ~2 млн кв. футов. По объёму же лидируют китайские Innolight и Eoptolink – сильнейшие имена, но их листинг в Китае труднодоступен западному портфелю. Альфа: держать компонентное «горлышко» (Lumentum EML) ценнее, чем массовую сборку.',
    'This is one of the cleanest ways to play the AI networking boom: every accelerator carries more and more optical lanes, and 800G+ volumes multiplied through 2026. But the real bottleneck is not module assembly — it is the EML lasers upstream: at 200 Gbit/lane (needed for 1.6T) essentially only Lumentum ships them in volume, and they are short until 2027 — Nvidia is already buying capacity forward. The largest share of module assembly sits with Fabrinet (Thailand), the contract manufacturer for Nvidia, Cisco and Coherent, now building a new ~2M sq ft facility. By volume the leaders are China\'s Innolight and Eoptolink — the strongest names, but their listings are hard for a Western portfolio to reach. The alpha: owning the component bottleneck (Lumentum EML) is worth more than owning mass assembly.'],
  inference: ['Это то звено, где вся стройка обязана окупиться: обучение моделей – это пока чистые расходы, а инференс – единственное место, где ИИ приносит деньги за каждый ответ. Поэтому главная борьба здесь идёт за стоимость запроса: чем дешевле и быстрее отвечает модель, тем выше маржа у всех, кто продаёт ИИ бизнесу. Nvidia доминирует и тут, но именно в инференсе у неё впервые появились реальные конкуренты: чипы, заточенные под скорость ответа, а не под обучение (Groq, Cerebras, d-Matrix), и заказные чипы гигантов от Broadcom. Рядом – отдельный слой облаков, которые продают доступ к готовым моделям по цене за объём текста. Инференс уже стал большей частью всех вычислений ИИ и растёт быстрее обучения, поэтому сюда смещается и спрос на чипы, и главный вопрос темы – окупятся ли вложенные триллионы.',
    'This is the link where the whole build has to pay for itself: training models is pure cost so far, while inference is the only place AI earns money per answer. So the real fight here is over cost per query: the cheaper and faster a model answers, the higher the margin for everyone selling AI to business. Nvidia dominates here too, but inference is where it faces real competition for the first time: chips tuned for answer speed rather than training (Groq, Cerebras, d-Matrix), and the giants\' custom chips from Broadcom. Alongside sits a separate layer of clouds selling access to ready-made models priced by volume of text. Inference is already the larger part of all AI compute and is growing faster than training, so chip demand is shifting here — and with it the theme\'s central question of whether the invested trillions pay back.'],
  server: ['Здесь происходит самое дорогое превращение всей цепочки: стойка GB200 стоит $3–4 млн, а следующая, Vera Rubin, – до $8,8 млн. Но власть и маржа устроены неочевидно. Физическую сборку держат тайваньские ODM – Foxconn (крупнейший, его выручка от AI-серверов уже обогнала iPhone), Quanta, Wiwynn; западные бренды Dell и HPE добавляют сервис и финансирование; Supermicro ближе всех к Nvidia, но с багажом бухгалтерских проблем 2024–25. Главный сдвиг для альфы: Nvidia забирает интеграцию себе – с поколения Vera Rubin поставляет уже собранный вычислительный модуль (~90% стоимости), оставляя сборщикам только «прикрутить» стойку и маржу в 2–3%. То есть выручка у ODM огромна и растёт, но прибыль тонкая и сжимается – растут в абсолюте, но не в процентах. Более интересная динамика – у западных сборщиков Celestica и Jabil, чей облачный сегмент растёт на десятки процентов в год.',
    'This is where the chain\'s most expensive transformation happens: a GB200 rack costs $3–4M, and the next one, Vera Rubin, up to $8.8M. But power and margin are arranged counter-intuitively. Physical assembly sits with the Taiwanese ODMs — Foxconn (the largest; its AI-server revenue has already passed the iPhone), Quanta and Wiwynn; the Western brands Dell and HPE add service and financing; Supermicro is closest to Nvidia but carries the baggage of its 2024–25 accounting problems. The key shift for alpha: Nvidia is taking integration in-house — from the Vera Rubin generation it ships an already-assembled compute module (~90% of the value), leaving the assemblers only to bolt the rack together at a 2–3% margin. So ODM revenue is enormous and growing while profit stays thin and compresses — they grow in absolute terms, not in percentages. The more interesting dynamic sits with the Western assemblers Celestica and Jabil, whose cloud segments grow tens of percent a year.'],
});

// ─ Edges (directional feed relationships) ─────────────────────────────────
const EDGES_RAW = [
  // L1 → downstream
  ['inpgaas',      'silicon'],
  ['inpgaas',      'photonics'],
  ['titanium',     'gasturbines'],
  ['resist',       'silicon'],
  ['resist',       'litho'],
  ['chem',         'silicon'],
  ['chem',         'pkg'],
  ['goes',         'transformers'],
  ['hbmmat',       'hbm'],
  ['hbmmat',       'pkg'],

  // L2 → chips / design
  ['litho',        'silicon'],
  ['litho',        'wbg'],
  ['litho',        'pkg'],
  ['test',         'silicon'],
  ['test',         'pkg'],
  ['test',         'wbg'],
  ['test',         'hbm'],
  ['eda',          'silicon'],
  ['eda',          'asic'],
  ['eda',          'netsilicon'],
  ['eda',          'pkg'],
  ['ip',           'pkg'],
  ['ip',           'asic'],

  // L3 chips → memory / assembly
  ['silicon',      'pkg'],
  ['silicon',      'pcb'],
  ['asic',         'pkg'],
  ['wbg',          'pmgmt'],
  ['wbg',          'switchgear'],

  // L4 memory → assembly / server
  ['hbm',          'pkg'],
  ['dram',         'server'],
  ['nand',         'server'],

  // L5 assembly → server
  ['pkg',          'server'],
  ['pcb',          'server'],

  // Power origin → delivery
  ['gaspipe',      'gasturbines'],
  ['gasturbines',  'power'],
  ['renewables',   'power'],
  ['nuc',          'power'],
  ['smr',          'power'],
  ['fuel',         'power'],

  // Power delivery
  ['power',        'transformers'],
  ['transformers', 'switchgear'],
  ['switchgear',   'pmgmt'],
  ['pmgmt',        'server'],

  // Connectivity / networking → server / rack
  ['photonics',    'transceivers'],
  ['netsilicon',   'fabric'],
  ['netsilicon',   'transceivers'],
  ['transceivers', 'server'],
  ['fabric',       'rack'],
  ['darkfiber',    'rack'],
  ['fiber',        'rack'],

  // Systems → Compute
  ['contracting',  'mep'],
  ['mep',          'rack'],
  ['liquid',       'server'],
  ['server',       'rack'],

  // Compute → Inference → Output (labs consume raw capacity to TRAIN;
  // inference serves the trained models, and apps sell that to business)
  ['rack',         'inference'],
  ['rack',         'lab'],
  ['inference',    'apps'],
];

// ─ Layout: compute (x,y) for each node from layer + per-layer slot ────────
function layoutNodes() {
  const byLayer = {};
  NODES_RAW.forEach(n => {
    if (!byLayer[n.layer]) byLayer[n.layer] = [];
    byLayer[n.layer].push(n);
  });
  const usableW = CANVAS_W - PAD_X_LEFT - PAD_X_RIGHT;
  const result = {};
  Object.entries(byLayer).forEach(([layerIdx, nodes]) => {
    const count = nodes.length;
    nodes.forEach((n, i) => {
      const slotW = usableW / count;
      const x = PAD_X_LEFT + slotW * (i + 0.5);
      const y = PAD_Y_TOP + parseInt(layerIdx, 10) * LAYER_GAP;
      const w = n.big ? BIG_NODE_W : NODE_W;
      const h = n.big ? BIG_NODE_H : NODE_H;
      // `n.label` is a bilingual GETTER (see bi()). A plain spread would
      // read it once, here at module load, and freeze the Russian string into
      // the layout — so the getter is re-attached to the laid-out copy.
      const laid = { ...n, x, y, w, h, cx: x, cy: y, topY: y - h/2, bottomY: y + h/2 };
      Object.defineProperty(laid, 'label', { enumerable: true, get: () => n.label });
      result[n.id] = laid;
    });
  });
  return result;
}

const NODES    = layoutNodes();
const CANVAS_H = PAD_Y_TOP + (LAYERS.length - 1) * LAYER_GAP + PAD_Y_BOTTOM;

// ─ Compute adjacency for highlighting on hover/select ─────────────────────
const NEIGHBOURS = (() => {
  const map = {};
  Object.keys(NODES).forEach(id => { map[id] = { in: [], out: [] }; });
  EDGES_RAW.forEach(([from, to]) => {
    map[from].out.push(to);
    map[to].in.push(from);
  });
  return map;
})();

// ──────────────────────────────────────────────────────────────────────────
// ── Smart topic search ──────────────────────────────────────────────────────
// Indexes ONLY the pivotal surfaces of each thesis node (big idea, section headings,
// lead paragraphs, key stats) – never plain body text – so a query returns the sectors
// that *meaningfully* discuss the term, each with a jump to its sharpest paragraph.
function searchDC(query) {
  const s = String(query || '').trim().toLowerCase();
  if (s.length < 2) return [];
  const results = [];
  for (const [id, det] of Object.entries(DC_DETAILS)) {
    if (id.startsWith('_') || !det || !det.thesis) continue;
    const node = NODES[id];
    if (!node) continue;
    const bigIdea = det.thesis.bigIdea || '';
    const stream = det.thesis.stream || [];
    let score = 0, best = null;
    const consider = (pr, snippet, target) => { if (!best || pr > best.pr) best = { pr, snippet, target }; };
    if ((node.label || '').toLowerCase().includes(s) || id.toLowerCase().includes(s)) { score += 6; consider(2, bigIdea, '__hero__'); }
    if (bigIdea.toLowerCase().includes(s)) { score += 5; consider(2, bigIdea, '__hero__'); }
    for (const el of stream) {
      if (el.k === 'h' && (el.t || '').toLowerCase().includes(s)) { score += 4; consider(3, el.t, el.t); }
      else if (el.k === 'p' && el.lead && (el.t || '').toLowerCase().includes(s)) { score += 3; consider(1, el.t, el.t.slice(0, 42)); }
      else if (el.k === 'stat') for (const it of (el.items || [])) {
        if (`${it.l || ''} ${it.v || ''} ${it.n || ''}`.toLowerCase().includes(s)) { score += 2; consider(0, `${it.v ? it.v + ' – ' : ''}${it.l || ''}`, '__hero__'); }
      }
    }
    if (score > 0 && best) results.push({ id, label: node.label, color: DC_BUCKETS[node.bucket]?.color || 'var(--hm-text3)', score, snippet: best.snippet, target: best.target });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 8);
}

// Strip [[node|label|target]] markup to its label, then bold the matched query term.
function highlightTerm(text, query) {
  const plain = String(text).replace(/\[\[([^\]]+)\]\]/g, (m, g) => { const b = g.split('|'); return (b[1] || b[0]).trim(); });
  const s = String(query || '').trim();
  if (!s) return plain;
  const parts = plain.split(new RegExp('(' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'));
  return parts.map((p, i) => p.toLowerCase() === s.toLowerCase() ? <b key={i} style={{ color: 'var(--hm-text)' }}>{p}</b> : <span key={i}>{p}</span>);
}

function SearchBar({ query, setQuery, results, onPick }) {
  const t = useT();
  return (
    <div style={{ maxWidth: 430, margin: '18px auto 0', padding: '0 24px', position: 'relative', textAlign: 'left' }}>
      <input value={query} onChange={e => setQuery(e.target.value)}
        placeholder={t('Поиск по разделу – например, HBM или охлаждение', 'Search this section — HBM or cooling, say')}
        style={{ width: '100%', boxSizing: 'border-box', background: 'var(--hm-tile)', border: '1px solid var(--hm-border5)', borderRadius: 13, color: 'var(--hm-text)', font: 'inherit', fontSize: 12.5, padding: '8px 15px', outline: 'none' }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--hm-text6)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--hm-border5)'} />
      {query.trim().length >= 2 && (
        <div style={{ position: 'absolute', left: 24, right: 24, marginTop: 7, background: 'var(--hm-panel)', border: '1px solid var(--hm-border4)', borderRadius: 13, overflow: 'hidden', zIndex: 40, boxShadow: '0 12px 40px rgba(0,0,0,.6)' }}>
          {results.length === 0 ? (
            <div style={{ padding: '12px 15px', color: 'var(--hm-text5)', fontSize: 12.5 }}>{t('Ничего не найдено в разделе.', 'Nothing found in this section.')}</div>
          ) : results.map(r => (
            <div key={r.id} onClick={() => onPick(r.id, r.target)}
              style={{ padding: '10px 14px', cursor: 'pointer', borderTop: '1px solid #1a1a1e', display: 'flex', gap: 10, alignItems: 'flex-start' }}
              onMouseEnter={e => e.currentTarget.style.background = '#17171b'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ marginTop: 4, width: 7, height: 7, borderRadius: 2, background: r.color, flex: 'none' }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12.5, color: 'var(--hm-text)', fontWeight: 700 }}>{r.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--hm-text3)', lineHeight: 1.5, marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{highlightTerm(r.snippet, query)}</div>
              </div>
              <span style={{ color: r.color, fontSize: 14, flex: 'none' }}>→</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Roadmap({ initialNode = null }) {
  const t = useT();
  const [selected, setSelected] = useState(() => (initialNode && NODES[initialNode] ? initialNode : null));
  const [hovered,  setHovered]  = useState(null);
  const [bucketFilter, setBucketFilter] = useState(null);
  const [detailNode, setDetailNode] = useState(null);
  const [navStack, setNavStack] = useState([]);       // cross-link origins: [{id, target, scrollY}]
  const [jumpTarget, setJumpTarget] = useState(null); // keyword to scroll+flash within the current node
  const [scrollRestore, setScrollRestore] = useState(null); // y to restore when returning to an origin
  const [query, setQuery] = useState('');
  const searchResults = useMemo(() => searchDC(query), [query]);

  // Active set decides which nodes/edges are "lit" vs dimmed. Priority:
  // selected node > hovered node > bucket filter > none.
  const activeNode = hovered || selected;
  const activeSet = useMemo(() => {
    if (activeNode) {
      return new Set([activeNode, ...NEIGHBOURS[activeNode].in, ...NEIGHBOURS[activeNode].out]);
    }
    if (bucketFilter) {
      return new Set(Object.values(NODES).filter(n => n.bucket === bucketFilter).map(n => n.id));
    }
    return null;
  }, [activeNode, bucketFilter]);

  const selectedNode = selected ? NODES[selected] : null;
  const selectedBucket = selectedNode ? DC_BUCKETS[selectedNode.bucket] : null;
  const selectedCompanies = selectedNode
    ? DC_COMPANIES.filter(c =>
        c.sector === selectedNode.sector ||
        (selectedNode.secondarySector && c.sector === selectedNode.secondarySector))
    : [];

  const totalCompanies = new Set(DC_COMPANIES.map(c => c.company)).size;

  // Full-page deep-dive takeover (no routes – same in-place pattern as the rest of the app).
  if (detailNode && NODES[detailNode]) {
    const origin = navStack[navStack.length - 1];
    return (
      <NodeDetail
        node={NODES[detailNode]}
        jumpTarget={jumpTarget}
        scrollRestore={scrollRestore}
        originLabel={origin ? NODES[origin.id]?.label : null}
        onBack={() => { setDetailNode(null); setNavStack([]); setJumpTarget(null); setScrollRestore(null); }}
        onJump={(id, target) => {
          setNavStack(s => [...s, { id: detailNode, target: jumpTarget, scrollY: window.scrollY }]);
          setScrollRestore(null); setJumpTarget(target || '__hero__'); setDetailNode(id);
        }}
        onBackOrigin={() => {
          const o = navStack[navStack.length - 1];
          if (!o) return;
          setNavStack(s => s.slice(0, -1));
          setJumpTarget(null); setScrollRestore(o.scrollY ?? 0); setDetailNode(o.id);
        }}
      />
    );
  }

  return (
    <div style={{ marginTop: 8 }}>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '24px 24px 8px' }}>
        <div style={{
          display: 'inline-block',
          fontSize: 10.5, color: '#22D3EE',
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.22em', fontWeight: 700,
          padding: '4px 12px', borderRadius: 4,
          background: 'rgba(34,211,238,0.08)',
          border: '1px solid rgba(34,211,238,0.30)',
          marginBottom: 18,
        }}>
          {t('AI-ИНФРАСТРУКТУРА · ЦЕПОЧКА ПОСТАВОК', 'AI INFRASTRUCTURE · SUPPLY CHAIN')}
        </div>
        <div style={{
          fontSize: 30, color: 'var(--hm-text)', fontWeight: 700,
          letterSpacing: '-0.02em', lineHeight: 1.15,
          margin: '0 auto 12px', maxWidth: 780,
        }}>
          {t('От', 'From')} <span style={{ color: '#f59e0b' }}>{t('самого сырья', 'the raw materials themselves')}</span> {t('до', 'to')}{' '}
          <span style={{ color: '#ec4899' }}>{t('готового ИИ для бизнеса', 'deployed AI for business')}</span>.
        </div>
        <div style={{
          fontSize: 13.5, color: 'var(--hm-text3)', lineHeight: 1.65,
          maxWidth: 640, margin: '0 auto',
        }}>
          {Object.keys(NODES).length} {plural(Object.keys(NODES).length, t('подсектор', 'subsector'), t('подсектора', 'subsectors'), t('подсекторов', 'subsectors'))} ·{' '}
          {EDGES_RAW.length} {plural(EDGES_RAW.length, t('связь', 'link'), t('связи', 'links'), t('связей', 'links'))} ·{' '}
          {totalCompanies} {plural(totalCompanies, t('компания', 'company'), t('компании', 'companies'), t('компаний', 'companies'))} · {t('нажмите на узел, чтобы открыть карточку.', 'click a node to open its card.')}
        </div>
        <SearchBar query={query} setQuery={setQuery} results={searchResults}
          onPick={(id, target) => { setNavStack([]); setScrollRestore(null); setJumpTarget(target); setDetailNode(id); setQuery(''); }} />
      </div>

      {/* ── Canvas ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        margin: '24px auto 0',
        maxWidth: CANVAS_W,
        width: '100%',
        height: CANVAS_H,
        overflow: 'visible',
        background: `
          radial-gradient(ellipse 600px 200px at 50% ${CANVAS_H - 80}px, rgba(236,72,153,0.06), transparent 70%),
          radial-gradient(ellipse 700px 240px at 50% ${CANVAS_H * 0.62}px, rgba(34,211,238,0.05), transparent 70%),
          radial-gradient(ellipse 500px 200px at 50% 60px, rgba(245,158,11,0.05), transparent 70%)
        `,
      }}>

        {/* Layer guide lines + labels */}
        {LAYERS.map((L, i) => {
          const y = PAD_Y_TOP + i * LAYER_GAP;
          return (
            <React.Fragment key={L.id}>
              <div style={{
                position: 'absolute',
                left: PAD_X_LEFT - 24, right: PAD_X_RIGHT - 24,
                top: y, height: 1,
                background: 'linear-gradient(to right, transparent, var(--hm-border2), transparent)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', left: 0, top: y - 18, width: PAD_X_LEFT - 28,
                textAlign: 'right', pointerEvents: 'none',
              }}>
                <div style={{
                  fontSize: 9, color: 'var(--hm-text6)',
                  fontFamily: 'ui-monospace,monospace',
                  letterSpacing: '0.16em', fontWeight: 700,
                }}>
                  {String(i + 1).padStart(2, '0')} · {L.label}
                </div>
                <div style={{
                  fontSize: 9, color: 'var(--hm-rank)',
                  fontFamily: 'ui-monospace,monospace',
                  marginTop: 2, fontStyle: 'italic',
                }}>
                  {L.caption}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* SVG edge layer */}
        <svg
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          preserveAspectRatio="none"
        >
          {EDGES_RAW.map(([from, to], i) => {
            const a = NODES[from], b = NODES[to];
            if (!a || !b) return null;
            const x1 = a.cx, y1 = a.bottomY;
            const x2 = b.cx, y2 = b.topY;
            const dy = Math.max(40, (y2 - y1) * 0.55);
            const d = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;

            const isLive = activeSet && (activeSet.has(from) && activeSet.has(to));
            const isDim  = activeSet && !isLive;
            const bucketDef = DC_BUCKETS[a.bucket];
            const stroke = bucketDef?.color || 'var(--hm-text6)';

            return (
              <path
                key={i}
                d={d}
                stroke={stroke}
                strokeWidth={isLive ? 2 : 1.1}
                strokeOpacity={isLive ? 0.9 : isDim ? 0.06 : 0.28}
                fill="none"
                style={{ transition: 'stroke-opacity 200ms, stroke-width 200ms' }}
              />
            );
          })}
        </svg>

        {/* Node layer */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          {Object.values(NODES).map(n => {
            const isLive = activeSet ? activeSet.has(n.id) : true;
            const isSelected = selected === n.id;
            const isHovered  = hovered  === n.id;
            const bucket = DC_BUCKETS[n.bucket];
            const c = bucket?.color || 'var(--hm-text6)';
            const tag = BUCKET_TAGS[n.bucket] || '';
            const companyCount = DC_COMPANIES.filter(co =>
              co.sector === n.sector ||
              (n.secondarySector && co.sector === n.secondarySector)).length;

            // Tint strengths step up by state. Base nodes get a soft tinted
            // background so same-bucket nodes pop as a group at a glance.
            const baseTint   = isSelected ? '2e' : isHovered ? '1f' : '14';
            const baseBorder = isSelected ? c          : isHovered ? `color-mix(in srgb, ${c} 80%, transparent)` : `color-mix(in srgb, ${c} 40%, transparent)`;
            const stripeW    = isSelected ? 6 : isHovered ? 5 : 4;

            return (
              <button
                key={n.id}
                onClick={() => setSelected(isSelected ? null : n.id)}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute',
                  left: n.x - n.w/2, top: n.y - n.h/2,
                  width: n.w, height: n.h,
                  background: `linear-gradient(135deg, ${c}${baseTint} 0%, var(--hm-panel) 80%)`,
                  border: `1px solid ${baseBorder}`,
                  borderRadius: n.big ? 11 : 9,
                  padding: `0 10px 0 ${stripeW + 9}px`,
                  cursor: 'pointer',
                  opacity: isLive ? 1 : 0.20,
                  transform: isSelected ? 'scale(1.06)' : isHovered ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: isSelected
                    ? `0 0 0 4px color-mix(in srgb, ${c} 20%, transparent), 0 10px 28px rgba(0,0,0,0.55), inset 0 0 0 1px color-mix(in srgb, ${c} 33%, transparent)`
                    : isHovered
                      ? `0 6px 20px color-mix(in srgb, ${c} 33%, transparent)`
                      : `0 2px 8px rgba(0,0,0,0.35)`,
                  display: 'flex', alignItems: 'center', gap: 10,
                  color: 'var(--hm-text)', font: 'inherit', textAlign: 'left',
                  zIndex: isSelected ? 4 : isHovered ? 3 : 2,
                  overflow: 'hidden',
                }}
              >
                {/* Solid bucket-color left stripe (always at full saturation) */}
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: stripeW,
                  background: c,
                  boxShadow: `${stripeW}px 0 12px color-mix(in srgb, ${c} 40%, transparent)`,
                  transition: 'width 200ms',
                }} />

                {/* Label + count */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{
                    fontSize: n.big ? 13 : 11.5,
                    fontWeight: n.big ? 700 : 600,
                    color: 'var(--hm-text)',
                    lineHeight: 1.15,
                    letterSpacing: n.big ? '0.04em' : '0',
                    textTransform: n.big ? 'uppercase' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {n.label}
                  </div>
                  {companyCount > 0 && (
                    <div style={{
                      fontSize: 9, color: 'var(--hm-text3)',
                      fontFamily: 'ui-monospace,monospace',
                      letterSpacing: '0.05em', marginTop: 2,
                    }}>
                      {companyCount} {plural(companyCount, t('компания', 'company'), t('компании', 'companies'), t('компаний', 'companies'))}
                    </div>
                  )}
                </div>

                {/* Bucket monogram – small chip on the right */}
                <div style={{
                  fontSize: 7.5, fontWeight: 800,
                  letterSpacing: '0.02em',
                  color: c,
                  background: `color-mix(in srgb, ${c} 13%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${c} 33%, transparent)`,
                  padding: '2px 4px',
                  borderRadius: 3,
                  lineHeight: 1,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}>
                  {tag}
                </div>

                {/* Selection pulse */}
                {isSelected && (
                  <span style={{
                    position: 'absolute', inset: -6,
                    borderRadius: n.big ? 15 : 13,
                    border: `1px solid ${c}`,
                    opacity: 0.55,
                    pointerEvents: 'none',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Inspector – slides in over the right side, no backdrop dim */}
        {selectedNode && (
          <InspectorPanel
            node={selectedNode}
            layer={LAYERS[selectedNode.layer]}
            layerIdx={selectedNode.layer}
            totalLayers={LAYERS.length}
            bucket={selectedBucket}
            companies={selectedCompanies}
            upstream={NEIGHBOURS[selectedNode.id].in.map(id => NODES[id])}
            downstream={NEIGHBOURS[selectedNode.id].out.map(id => NODES[id])}
            onClose={() => setSelected(null)}
            onJump={(id) => setSelected(id)}
            onOpenDetail={(id) => { setNavStack([]); setJumpTarget(null); setScrollRestore(null); setDetailNode(id); }}
            scrollOnMount={!!initialNode && selected === initialNode}
          />
        )}

      </div>

      {/* Legend – clickable bucket filter */}
      <div style={{
        margin: '40px auto 8px', maxWidth: CANVAS_W,
        padding: '14px 18px',
        background: 'var(--hm-bg2)',
        border: '1px solid var(--hm-border5)',
        borderRadius: 10,
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 9.5, color: 'var(--hm-text5)',
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.16em', fontWeight: 700, marginRight: 4,
        }}>
          {t('ФИЛЬТР ПО ГРУППАМ', 'FILTER BY GROUP')}
        </div>
        {Object.entries(DC_BUCKETS).map(([name, def]) => {
          const active = bucketFilter === name;
          const dim    = bucketFilter && !active;
          return (
            <button
              key={name}
              onClick={() => setBucketFilter(active ? null : name)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 11px 6px 9px',
                background: active ? `color-mix(in srgb, ${def.color} 13%, transparent)` : 'var(--hm-surface)',
                border: `1px solid ${active ? def.color : `color-mix(in srgb, ${def.color} 25%, transparent)`}`,
                borderRadius: 999,
                cursor: 'pointer',
                opacity: dim ? 0.45 : 1,
                color: 'var(--hm-text)', font: 'inherit',
                transition: 'all 160ms',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = `color-mix(in srgb, ${def.color} 8%, transparent)`; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'var(--hm-surface)'; }}
            >
              <span style={{
                width: 9, height: 9, borderRadius: '50%',
                background: def.color,
                boxShadow: `0 0 8px color-mix(in srgb, ${def.color} 53%, transparent)`,
              }} />
              <span style={{ fontSize: 11, color: 'var(--hm-text2)', fontWeight: active ? 700 : 500 }}>
                {BUCKET_RU[name] || name}
              </span>
              <span style={{
                fontSize: 8.5, fontWeight: 800,
                fontFamily: 'ui-monospace,monospace',
                letterSpacing: '0.08em',
                color: def.color,
                background: `color-mix(in srgb, ${def.color} 13%, transparent)`,
                border: `1px solid color-mix(in srgb, ${def.color} 33%, transparent)`,
                padding: '1.5px 4px',
                borderRadius: 3,
              }}>
                {BUCKET_TAGS[name]}
              </span>
            </button>
          );
        })}
        {bucketFilter && (
          <button
            onClick={() => setBucketFilter(null)}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid var(--hm-rank)',
              borderRadius: 999,
              fontSize: 10.5, color: 'var(--hm-text3)',
              fontFamily: 'ui-monospace,monospace',
              letterSpacing: '0.08em', fontWeight: 700,
              cursor: 'pointer', font: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--hm-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--hm-text3)'}
          >
            {t('СБРОС', 'RESET')}
          </button>
        )}
      </div>

    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Inspector panel – slides in from the right of the canvas.
// Redesigned: bucket-tinted header, compact chain-position widget,
// chain neighbour chips, then companies grouped by conviction.
// ──────────────────────────────────────────────────────────────────────────
function InspectorPanel({ node, layer, layerIdx, totalLayers, bucket, companies, upstream, downstream, onClose, onJump, onOpenDetail, scrollOnMount }) {
  const t = useT();
  const c = bucket?.color || 'var(--hm-text3)';
  // On a deep-link (opened from a Capital Flow sector report), bring the panel
  // into view — the chain sits below the hero, so otherwise it lands off-screen.
  const rootRef = useRef(null);
  useEffect(() => {
    if (scrollOnMount && rootRef.current) {
      rootRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }
    // one-shot on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sort companies by conviction tier so the strongest names come first.
  const order = { 'High': 0, 'Med-High': 1, 'Medium': 2, 'Low-Med': 3, 'Low': 4 };
  const sortedCompanies = [...companies].sort(
    (a, b) => (order[a.conviction] ?? 9) - (order[b.conviction] ?? 9));

  return (
    <div ref={rootRef} style={{
      position: 'absolute',
      top: 0, right: 0, bottom: 0,
      width: 400, maxWidth: '92%',
      background: 'rgba(10,10,11,0.97)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      borderLeft: `1px solid color-mix(in srgb, ${c} 33%, transparent)`,
      boxShadow: `-32px 0 60px rgba(0,0,0,0.65), -1px 0 0 color-mix(in srgb, ${c} 20%, transparent)`,
      zIndex: 10,
      overflowY: 'auto',
      animation: 'inspector-slide 200ms cubic-bezier(0.4,0,0.2,1)',
    }}>
      <style>{`
        @keyframes inspector-slide {
          from { transform: translateX(28px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Header – bucket-tinted */}
      <div style={{
        padding: '22px 24px 20px',
        background: `linear-gradient(180deg, color-mix(in srgb, ${c} 10%, transparent) 0%, transparent 100%)`,
        borderBottom: `1px solid ${c}26`,
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--hm-chip2)', border: `1px solid color-mix(in srgb, ${c} 33%, transparent)`,
            color: 'var(--hm-text)', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: 'inherit', transition: 'all 140ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `color-mix(in srgb, ${c} 20%, transparent)`; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--hm-chip2)'; }}
        >×</button>

        <div style={{
          fontSize: 9.5, color: c,
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.18em', fontWeight: 700,
          marginBottom: 6,
        }}>
          {t('ЭТАП', 'STAGE')} {String(layerIdx + 1).padStart(2, '0')} / {String(totalLayers).padStart(2, '0')} · {layer.label}
        </div>

        <div style={{
          fontSize: 22, color: 'var(--hm-text)', fontWeight: 700,
          letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 4,
        }}>
          {node.label}
        </div>
        <div style={{
          fontSize: 11.5, color: 'var(--hm-text3)',
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.04em',
        }}>
          {BUCKET_RU[node.bucket] || node.bucket} · {companies.length} {plural(companies.length, t('компания', 'company'), t('компании', 'companies'), t('компаний', 'companies'))}
        </div>

        {/* chain position rail */}
        <div style={{
          marginTop: 16, display: 'flex', gap: 3,
          alignItems: 'center',
        }}>
          {Array.from({ length: totalLayers }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4,
              borderRadius: 2,
              background: i === layerIdx ? c : i < layerIdx ? `color-mix(in srgb, ${c} 33%, transparent)` : 'var(--hm-border4)',
              transition: 'background 160ms',
            }} />
          ))}
        </div>
      </div>

      {/* Read-more → full deep-dive page */}
      <div style={{ padding: '16px 24px 4px' }}>
        <button
          onClick={() => onOpenDetail(node.id)}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            background: `linear-gradient(135deg, ${c}26 0%, color-mix(in srgb, ${c} 7%, transparent) 100%)`,
            border: `1px solid color-mix(in srgb, ${c} 40%, transparent)`,
            borderRadius: 9,
            cursor: 'pointer', font: 'inherit',
            color: 'var(--hm-text)',
            transition: 'all 160ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${c}3a 0%, ${c}1e 100%)`; e.currentTarget.style.borderColor = c; }}
          onMouseLeave={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${c}26 0%, color-mix(in srgb, ${c} 7%, transparent) 100%)`; e.currentTarget.style.borderColor = `color-mix(in srgb, ${c} 40%, transparent)`; }}
        >
          <span style={{
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
          }}>{t('Подробный разбор блока', 'The block’s detailed breakdown')}</span>
          <span style={{ fontSize: 15, color: c, fontWeight: 700 }}>→</span>
        </button>
      </div>

      {/* What is this – plain-Russian context for the sub-sector */}
      {NODE_INTEL[node.id] && (
        <div style={{
          padding: '18px 24px 16px',
          borderBottom: '1px solid var(--hm-hair)',
        }}>
          <div style={{
            fontSize: 9, color: c,
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.16em', fontWeight: 700,
            marginBottom: 9,
          }}>{t('ЧТО ЭТО', 'WHAT IT IS')}</div>
          <div style={{ fontSize: 12.5, color: 'var(--hm-text2)', lineHeight: 1.75 }}>
            {NODE_INTEL[node.id]}
          </div>
        </div>
      )}

      {/* Role in the chain – per-node, plain Russian */}
      {NODE_ROLE[node.id] && (
        <div style={{
          padding: '18px 24px 16px',
          borderBottom: '1px solid var(--hm-hair)',
        }}>
          <div style={{
            fontSize: 9, color: c,
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.16em', fontWeight: 700,
            marginBottom: 9,
          }}>{t('РОЛЬ В ЦЕПОЧКЕ', 'ROLE IN THE CHAIN')}</div>
          <div style={{ fontSize: 12.5, color: 'var(--hm-text2)', lineHeight: 1.75 }}>
            {NODE_ROLE[node.id]}
          </div>
        </div>
      )}

      {/* Chain neighbours */}
      {(upstream.length > 0 || downstream.length > 0) && (
        <div style={{ padding: '4px 24px 18px' }}>
          <div style={{
            fontSize: 10.5, color: 'var(--hm-text5)', fontStyle: 'italic',
            lineHeight: 1.5, marginBottom: 12,
          }}>
            {t('Нажмите на блок ниже, чтобы перейти к его карточке.', 'Click a block below to open its card.')}
          </div>
          {upstream.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 9, color: 'var(--hm-text3)',
                fontFamily: 'ui-monospace,monospace',
                letterSpacing: '0.14em', fontWeight: 700,
                marginBottom: 8,
              }}>{t('↑ ОТКУДА ПРИХОДИТ', '↑ WHERE IT COMES FROM')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {upstream.map(u => (
                  <ChainPill key={u.id} node={u} onClick={() => onJump(u.id)} />
                ))}
              </div>
            </div>
          )}
          {downstream.length > 0 && (
            <div>
              <div style={{
                fontSize: 9, color: 'var(--hm-text3)',
                fontFamily: 'ui-monospace,monospace',
                letterSpacing: '0.14em', fontWeight: 700,
                marginBottom: 8,
              }}>{t('↓ КУДА ИДЁТ ДАЛЬШЕ', '↓ WHERE IT GOES NEXT')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {downstream.map(d => (
                  <ChainPill key={d.id} node={d} onClick={() => onJump(d.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Companies */}
      <div style={{ padding: '14px 24px 28px', borderTop: '1px solid var(--hm-hair)' }}>
        <div style={{
          fontSize: 9, color: c,
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.16em', fontWeight: 700,
          marginBottom: 6,
        }}>{t('КЛЮЧЕВЫЕ ИГРОКИ', 'KEY PLAYERS')}</div>
        <div style={{
          fontSize: 10.5, color: 'var(--hm-text5)', lineHeight: 1.55, marginBottom: 14,
        }}>
          {t('Заметные компании этого звена – как примеры, кто им занимается, а не список для покупки.',
             'Notable companies in this link — as examples of who does the work, not a buy list.')}
        </div>
        {sortedCompanies.length === 0 ? (
          <div style={{ fontSize: 11.5, color: 'var(--hm-text6)', fontStyle: 'italic' }}>
            {t('Здесь нет отдельных имён – это переходный узел цепочки.', 'There are no individual names here — this is a transit node in the chain.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sortedCompanies.map(co => {
              return (
                <div key={co.company} style={{
                  background: 'var(--hm-tile)',
                  border: '1px solid var(--hm-border5)',
                  borderLeft: `3px solid ${c}`,
                  borderRadius: 6, padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 12.5, color: 'var(--hm-text)', fontWeight: 600 }}>{co.company}</div>
                  <div style={{
                    fontSize: 10.5, color: 'var(--hm-text3)',
                    fontFamily: 'ui-monospace,monospace',
                    marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap',
                  }}>
                    <span>{co.ticker}</span>
                    <span style={{ color: 'var(--hm-rank)' }}>·</span>
                    <span style={{ color: co.ppr === 'Pub' ? '#10b981' : '#a78bfa' }}>
                      {co.ppr === 'Pub' ? t('ПУБЛИЧНАЯ', 'PUBLIC') : t('ЧАСТНАЯ', 'PRIVATE')}
                    </span>
                    <span style={{ color: 'var(--hm-rank)' }}>·</span>
                    <span>{co.geo}</span>
                  </div>
                  {co.note && (
                    <div style={{
                      fontSize: 11, color: 'var(--hm-text2)', lineHeight: 1.6,
                      marginTop: 8, paddingTop: 8,
                      borderTop: '1px solid var(--hm-border4)',
                    }}>
                      {co.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ChainPill({ node, onClick }) {
  const bucket = DC_BUCKETS[node.bucket];
  const c = bucket?.color || 'var(--hm-text3)';
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--hm-surface)',
        border: `1px solid color-mix(in srgb, ${c} 33%, transparent)`,
        borderRadius: 999,
        padding: '5px 11px 5px 9px',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        cursor: 'pointer',
        font: 'inherit',
        transition: 'all 140ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `color-mix(in srgb, ${c} 13%, transparent)`; e.currentTarget.style.borderColor = c; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--hm-surface)'; e.currentTarget.style.borderColor = `color-mix(in srgb, ${c} 33%, transparent)`; }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
      <span style={{ fontSize: 11, color: 'var(--hm-text2)' }}>{node.label}</span>
    </button>
  );
}


// ══════════════════════════════════════════════════════════════════════════
// NodeDetail – full-page INVESTMENT deep-dive for a sub-sector.
// Rendered as a decision-grade research memo, data-driven from DC_DETAILS[id].
// 12 optional blocks (verdict, TL;DR, market, value-capture, competition,
// demand, supply, unit-econ, roadmap, dependencies, risk, universe, monitor,
// scenarios). A node with no data shows a placeholder.
// ══════════════════════════════════════════════════════════════════════════

// ─ Shared styles ──────────────────────────────────────────────────────────
const thCell     = { padding: '4px 14px 8px 0', fontWeight: 700, whiteSpace: 'nowrap' };
const tdCell     = { padding: '11px 14px 11px 0', verticalAlign: 'top' };
const cardBg     = { background: 'var(--hm-bg2)', border: '1px solid var(--hm-border4)', borderRadius: 12 };
const miniCard   = { background: 'var(--hm-surface)', border: '1px solid var(--hm-border5)', borderRadius: 9, padding: '12px 14px' };
const miniKicker = { fontSize: 9, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 6 };
const miniBody   = { fontSize: 12, color: 'var(--hm-text2)', lineHeight: 1.6 };
const thRow      = { color: 'var(--hm-text5)', textAlign: 'left', fontFamily: 'ui-monospace,monospace', fontSize: 9.5, letterSpacing: '0.1em' };

function trendGlyph(t) { return t === 'up' ? { s: '▲', c: '#10b981' } : t === 'down' ? { s: '▼', c: '#ef4444' } : { s: '▬', c: 'var(--hm-text3)' }; }

function Paragraphs({ text, style }) {
  return String(text).split(/\n{2,}/).map((p, i) => <p key={i} style={{ margin: i === 0 ? 0 : '12px 0 0', ...style }}>{p}</p>);
}

function Src({ children }) {
  if (!children) return null;
  return <span style={{ fontSize: 9.5, color: 'var(--hm-text6)', fontFamily: 'ui-monospace,monospace', marginLeft: 6, whiteSpace: 'nowrap' }}>· {children}</span>;
}

// Titled section with an anchor id for the jump-nav. `takeaway` renders a
// highlighted "so-what for the investor" strip at the bottom of the block.
function Block({ id, accent, kicker, lead, takeaway, children }) {
  const t = useT();
  return (
    <section id={id} style={{ scrollMarginTop: 12, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14, borderBottom: '1px solid var(--hm-border4)', paddingBottom: 10 }}>
        <div style={{ fontSize: 10.5, color: accent, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.16em', fontWeight: 700 }}>{kicker}</div>
        {lead && <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--hm-text3)', textAlign: 'right' }}>{lead}</div>}
      </div>
      {children}
      {takeaway && (
        <div style={{ marginTop: 14, padding: '13px 16px', background: `color-mix(in srgb, ${accent} 6%, transparent)`, borderLeft: `3px solid ${accent}`, borderRadius: '0 9px 9px 0' }}>
          <div style={{ fontSize: 9, color: accent, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 6 }}>{t('ВЫВОД ДЛЯ ИНВЕСТОРА', 'THE TAKEAWAY FOR AN INVESTOR')}</div>
          <div style={{ fontSize: 12.5, color: 'var(--hm-text2)', lineHeight: 1.65 }}>{takeaway}</div>
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, note, accent, src }) {
  return (
    <div style={miniCard}>
      <div style={miniKicker}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent || 'var(--hm-text)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</div>
      {note && <div style={{ fontSize: 11, color: 'var(--hm-text3)', marginTop: 5, lineHeight: 1.5 }}>{note}<Src>{src}</Src></div>}
    </div>
  );
}

function MetaCell({ label, value }) {
  return <div style={miniCard}><div style={miniKicker}>{label}</div><div style={{ fontSize: 12.5, color: 'var(--hm-text2)', lineHeight: 1.55 }}>{value}</div></div>;
}

function Badge({ text, col }) {
  return <span style={{ fontSize: 10.5, fontWeight: 700, color: col, background: `color-mix(in srgb, ${col} 9%, transparent)`, border: `1px solid color-mix(in srgb, ${col} 27%, transparent)`, borderRadius: 5, padding: '2px 8px', whiteSpace: 'nowrap' }}>{text}</span>;
}

function ScoreBar({ label, value, accent }) {
  const n = Number(value) || 0, pct = Math.max(0, Math.min(10, n)) * 10;
  const col = n >= 7 ? '#10b981' : n >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--hm-text3)', marginBottom: 4 }}>
        <span>{label}</span><span style={{ color: 'var(--hm-text2)', fontWeight: 700, fontFamily: 'ui-monospace,monospace' }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--hm-border4)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: col, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function PurePlay({ v, c }) {
  const t = useT();
  const n = Number(v) || 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 44, height: 6, background: 'var(--hm-border4)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: (Math.max(0, Math.min(10, n)) * 10) + '%', height: '100%', background: c }} />
      </div>
      <span style={{ fontSize: 10.5, color: 'var(--hm-text3)', fontFamily: 'ui-monospace,monospace' }}>{v}</span>
    </div>
  );
}

/** `{ key: [[ruLabel, enLabel], [ruDesc, enDesc]] }` → objects with getters. */
function biMap2(spec) {
  const out = {};
  for (const [k, [lab, desc]] of Object.entries(spec)) {
    const o = {};
    Object.defineProperty(o, 'label', { enumerable: true, get: () => (getLang() === 'en' ? lab[1] : lab[0]) });
    Object.defineProperty(o, 'desc',  { enumerable: true, get: () => (getLang() === 'en' ? desc[1] : desc[0]) });
    out[k] = o;
  }
  return out;
}

// ─ Verdict hero (decision summary) ─────────────────────────────────────────
// The four canonical scoring dimensions. Each is scored 1–10, higher = better.
// Plain-Russian labels + a one-line "what it measures / what a high score means"
// so the reader never has to guess what a number implies.
const VERDICT_DIMS = biMap2({
  growth:      [['Потенциал роста', 'Growth potential'],
                ['Как быстро растёт спрос и сам рынок звена. Выше балл – сильнее рост.',
                 'How fast demand and the link\'s own market are growing. A higher score means stronger growth.']],
  moat:        [['Защита от конкурентов', 'Defence against competitors'],
                ['Трудно ли новым игрокам войти и отнять долю: барьеры, патенты, переключение.',
                 'How hard it is for newcomers to enter and take share: barriers, patents, switching costs.']],
  cyclicality: [['Устойчивость к циклу', 'Cycle resilience'],
                ['Насколько цены и прибыль устойчивы, когда предложение догоняет спрос.',
                 'How well prices and profits hold up once supply catches demand.']],
  valuation:   [['Привлекательность цены', 'Price attractiveness'],
                ['Насколько дёшевы акции к прибыли и к своей истории.',
                 'How cheap the shares are against earnings and against their own history.']],
  // Legacy Russian keys — DATA keys from older payloads, never translated:
  // translating a key would stop it matching the data it exists to match.
  'Рост':        [['Потенциал роста', 'Growth potential'], ['', '']],
  'Ров':         [['Защита от конкурентов', 'Defence against competitors'], ['', '']],
  'Цикличность': [['Устойчивость к циклу', 'Cycle resilience'], ['', '']],
  'Оценка':      [['Привлекательность цены', 'Price attractiveness'], ['', '']],
});


function VerdictHero({ v, c, asOf }) {
  const t = useT();
  const subs = v.subScores ? Object.entries(v.subScores) : [];
  const score = v.score != null ? Number(v.score) : (subs.length ? Math.round(subs.reduce((a, [, x]) => a + Number(x), 0) / subs.length) : null);
  const scoreCol = score == null ? 'var(--hm-text3)' : score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444';
  const scoreWord = score == null ? '' : score >= 7 ? t('Привлекательно', 'Attractive') : score >= 5 ? t('Средне', 'Medium') : t('Слабо', 'Weak');
  return (
    <div style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${c} 11%, transparent) 0%, var(--hm-bg2) 65%)`, border: `1px solid color-mix(in srgb, ${c} 27%, transparent)`, borderRadius: 16, padding: '26px 28px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 9.5, color: c, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.16em', fontWeight: 700 }}>{t('ВЕРДИКТ · ИНВЕСТ-ОЦЕНКА', 'VERDICT · INVESTMENT SCORE')}</div>
        {asOf && <div style={{ fontSize: 10.5, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace' }}>{t('данные на', 'data as of')}  {asOf}</div>}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--hm-text6)', marginBottom: 18 }}>{t('Каждая метрика – 1–10, где выше = лучше для инвестора. Общий балл – среднее по четырём.', 'Each metric runs 1–10, where higher is better for an investor. The overall score is the average of the four.')}</div>
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {score != null && (
          <div style={{ textAlign: 'center', minWidth: 120 }}>
            <div style={{ fontSize: 60, fontWeight: 800, color: scoreCol, lineHeight: 1, letterSpacing: '-0.04em' }}>{score}</div>
            <div style={{ fontSize: 10, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace', marginTop: 4 }}>{t('ИЗ 10', 'OF 10')}</div>
            {scoreWord && <div style={{ fontSize: 11, color: scoreCol, fontWeight: 700, marginTop: 8 }}>{scoreWord}</div>}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 260 }}>
          {subs.map(([k, val]) => {
            const dim = VERDICT_DIMS[k] || { label: k, desc: '' };
            const n = Number(val) || 0;
            const col = n >= 7 ? '#10b981' : n >= 5 ? '#f59e0b' : '#ef4444';
            const word = n >= 7 ? t('сильно', 'strong') : n >= 5 ? t('средне', 'medium') : t('слабо', 'weak');
            return (
              <div key={k} style={{ marginBottom: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--hm-text2)', fontWeight: 600 }}>{dim.label}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 7, whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 9.5, color: col, fontFamily: 'ui-monospace,monospace', fontWeight: 700, letterSpacing: '0.04em' }}>{word}</span>
                    <span style={{ fontSize: 14, color: 'var(--hm-text)', fontWeight: 700, fontFamily: 'ui-monospace,monospace' }}>{val}<span style={{ color: 'var(--hm-text6)', fontSize: 11 }}>/10</span></span>
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--hm-border4)', overflow: 'hidden', margin: '6px 0 5px' }}>
                  <div style={{ width: (Math.max(0, Math.min(10, n)) * 10) + '%', height: '100%', background: col, borderRadius: 3 }} />
                </div>
                {dim.desc && <div style={{ fontSize: 10.5, color: 'var(--hm-text5)', lineHeight: 1.5 }}>{dim.desc}</div>}
              </div>
            );
          })}
        </div>
      </div>
      {v.summary && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--hm-text2)', lineHeight: 1.65 }}>{v.summary}</div>}
      {(v.horizon || v.sizing) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12, marginTop: 16 }}>
          {v.horizon && <MetaCell label={t('ГОРИЗОНТ', 'HORIZON')} value={v.horizon} />}
          {v.sizing && <MetaCell label={t('РАЗМЕР РЫНКА', 'MARKET SIZE')} value={v.sizing} />}
        </div>
      )}
    </div>
  );
}

// ─ Plain-language orientation – "what is this, in two sentences" – shown first ─
function WhatIsItBlock({ text, c }) {
  const t = useT();
  return (
    <div style={{ background: `${c}0c`, border: `1px solid color-mix(in srgb, ${c} 20%, transparent)`, borderRadius: 14, padding: '18px 22px', marginBottom: 16 }}>
      <div style={{ fontSize: 9.5, color: c, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 9 }}>{t('ЧТО ЭТО ТАКОЕ · КОРОТКО', 'WHAT IT IS · IN BRIEF')}</div>
      <div style={{ fontSize: 14.5, color: 'var(--hm-text2)', lineHeight: 1.72 }}><Paragraphs text={text} /></div>
    </div>
  );
}

function Tldr({ items, c }) {
  const t = useT();
  return (
    <div style={{ ...cardBg, padding: '18px 22px', marginBottom: 16, borderLeft: `3px solid ${c}` }}>
      <div style={{ ...miniKicker, marginBottom: 10 }}>{t('КОРОТКО · ГЛАВНОЕ', 'IN BRIEF · THE ESSENTIALS')}</div>
      <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--hm-text2)', fontSize: 13.5, lineHeight: 1.7 }}>
        {items.map((t, i) => <li key={i} style={{ marginBottom: 6 }}>{t}</li>)}
      </ul>
    </div>
  );
}

function SectionNav({ items, c }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 24 }}>
      {items.map(it => (
        <button key={it.id}
          onClick={() => { const el = document.getElementById(it.id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
          style={{ fontSize: 11, color: 'var(--hm-text2)', background: 'var(--hm-surface)', border: '1px solid var(--hm-border5)', borderRadius: 999, padding: '5px 12px', cursor: 'pointer', font: 'inherit', transition: 'all 140ms' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = c; e.currentTarget.style.color = 'var(--hm-text)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--hm-border5)'; e.currentTarget.style.color = 'var(--hm-text2)'; }}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ─ Block 1 – Market sizing (with TAM bar chart) ────────────────────────────
function TamChart({ rows, c }) {
  const max = Math.max(...rows.map(r => Number(r.value) || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 160, padding: '8px 4px 0' }}>
      {rows.map((r, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
          <div style={{ fontSize: 11, color: 'var(--hm-text2)', fontWeight: 700, marginBottom: 6 }}>{r.label || ('$' + r.value + 'B')}</div>
          <div style={{ width: '100%', maxWidth: 54, height: Math.max(4, (Number(r.value) / max) * 112) + 'px', background: `linear-gradient(180deg, ${c} 0%, color-mix(in srgb, ${c} 40%, transparent) 100%)`, borderRadius: '5px 5px 0 0' }} />
          <div style={{ fontSize: 10.5, color: 'var(--hm-text3)', fontFamily: 'ui-monospace,monospace', marginTop: 8 }}>{r.year}</div>
          {r.source && <div style={{ fontSize: 8.5, color: 'var(--hm-text6)', marginTop: 2 }}>{r.source}</div>}
        </div>
      ))}
    </div>
  );
}

function MarketSizingBlock({ d, c }) {
  const t = useT();
  return (
    <Block id="market" takeaway={d.takeaway} accent={c} kicker={t('01 · РАЗМЕР РЫНКА И ТРАЕКТОРИЯ', '01 · MARKET SIZE AND TRAJECTORY')} lead={d.cagr}>
      {d.tam?.length > 0 && (
        <div style={{ ...cardBg, padding: '16px 18px', marginBottom: 14 }}>
          <div style={{ ...miniKicker, marginBottom: 2 }}>{d.chartTitle || t('РАЗМЕР РЫНКА ПО ГОДАМ ($ МЛРД)', 'MARKET SIZE BY YEAR ($BN)')}</div>
          <TamChart rows={d.tam} c={c} />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
        {d.bomShare && <StatCard label={t('ДОЛЯ В СТОИМОСТИ AI-ЧИПА', 'SHARE OF AN AI CHIP’S COST')} value={d.bomShare.value} note={d.bomShare.note} accent={c} src={d.bomShare.source} />}
        {typeof d.volumeVsPrice === 'string' && <div style={miniCard}><div style={miniKicker}>{t('ЧТО ДВИЖЕТ РОСТ · ОБЪЁМ ИЛИ ЦЕНА', 'WHAT DRIVES GROWTH · VOLUME OR PRICE')}</div><div style={miniBody}>{d.volumeVsPrice}</div></div>}
        {d.volumeVsPrice?.volume && <div style={miniCard}><div style={miniKicker}>{t('ОБЪЁМ', 'VOLUME')}</div><div style={miniBody}>{d.volumeVsPrice.volume}</div></div>}
        {d.volumeVsPrice?.price && <div style={miniCard}><div style={miniKicker}>{t('ЦЕНА', 'PRICE')}</div><div style={miniBody}>{d.volumeVsPrice.price}</div></div>}
        {d.volumeVsPrice?.mix && <div style={miniCard}><div style={miniKicker}>{t('СДВИГ МИКСА', 'MIX SHIFT')}</div><div style={miniBody}>{d.volumeVsPrice.mix}</div></div>}
      </div>
    </Block>
  );
}

// ─ Block 2 – Value capture ─────────────────────────────────────────────────
function ValueCaptureBlock({ d, c }) {
  const t = useT();
  return (
    <Block id="value" takeaway={d.takeaway} accent={c} kicker={t('02 · КТО ЗАБИРАЕТ МАРЖУ', '02 · WHO TAKES THE MARGIN')}>
      {d.margins?.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={thRow}><th style={thCell}>{t('СЛОЙ ЦЕПОЧКИ', 'CHAIN LAYER')}</th><th style={thCell}>{t('МАРЖА', 'MARGIN')}</th><th style={thCell}>{t('ИСТОЧНИК', 'SOURCE')}</th></tr></thead>
            <tbody>{d.margins.map((m, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--hm-border4)' }}>
                <td style={{ ...tdCell, color: 'var(--hm-text)', fontWeight: 600 }}>{m.layer}</td>
                <td style={{ ...tdCell, fontFamily: 'ui-monospace,monospace', color: 'var(--hm-text2)' }}>{m.margin}</td>
                <td style={{ ...tdCell, color: 'var(--hm-text5)', fontSize: 10.5 }}>{m.source}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        {d.bottleneckNow && <div style={miniCard}><div style={miniKicker}>{t('ГЛАВНОЕ ОГРАНИЧЕНИЕ СЕЙЧАС', 'THE BINDING CONSTRAINT RIGHT NOW')}</div><div style={miniBody}>{d.bottleneckNow}</div></div>}
        {d.bottleneckNext && <div style={miniCard}><div style={miniKicker}>{t('КУДА СМЕСТИТСЯ ОГРАНИЧЕНИЕ', 'WHERE THE CONSTRAINT MOVES NEXT')}</div><div style={miniBody}>{d.bottleneckNext}</div></div>}
        {d.capitalIntensity && <div style={miniCard}><div style={miniKicker}>{t('КАПИТАЛОЁМКОСТЬ', 'CAPITAL INTENSITY')}</div><div style={miniBody}>{d.capitalIntensity}</div></div>}
      </div>
    </Block>
  );
}

// ─ Block 3 – Competition ───────────────────────────────────────────────────
function CompetitionBlock({ d, c }) {
  const t = useT();
  const traj = d.shareTrajectory || [];
  const isPlayerFmt = traj.length > 0 && ('player' in traj[0]);
  const cols = (traj.length > 0 && !isPlayerFmt) ? Object.keys(traj[0]).filter(k => k !== 'period' && k !== 'source') : [];
  const dirCol = s => /↑|раст[её]т|рост|усил/i.test(s || '') ? '#10b981' : /↓|паден|сниж|слабе/i.test(s || '') ? '#ef4444' : 'var(--hm-text3)';
  return (
    <Block id="competition" takeaway={d.takeaway} accent={c} kicker={t('03 · КОНКУРЕНТНАЯ СТРУКТУРА', '03 · COMPETITIVE STRUCTURE')} lead={d.concentration}>
      {traj.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 14 }}>
          <div style={{ ...miniKicker, marginBottom: 8 }}>{t('ДОЛЯ РЫНКА · КТО НАБИРАЕТ, КТО ТЕРЯЕТ', 'MARKET SHARE · WHO GAINS, WHO LOSES')}</div>
          {isPlayerFmt ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 460 }}>
              <thead><tr style={thRow}><th style={thCell}>{t('ИГРОК', 'PLAYER')}</th><th style={thCell}>{t('ДОЛЯ', 'SHARE')}</th><th style={thCell}>{t('ТРЕНД', 'TREND')}</th><th style={thCell}>{t('КУДА ДВИЖЕТСЯ', 'WHERE IT IS HEADING')}</th></tr></thead>
              <tbody>{traj.map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--hm-border4)' }}>
                  <td style={{ ...tdCell, color: 'var(--hm-text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.player}</td>
                  <td style={{ ...tdCell, fontFamily: 'ui-monospace,monospace', color: 'var(--hm-text2)', whiteSpace: 'nowrap' }}>{row.now}</td>
                  <td style={{ ...tdCell, color: dirCol(row.direction), fontSize: 14, fontWeight: 700 }}>{row.direction}</td>
                  <td style={{ ...tdCell, color: 'var(--hm-text2)' }}>{row.detail}</td>
                </tr>))}</tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 420 }}>
              <thead><tr style={thRow}><th style={thCell}>{t('ПЕРИОД', 'PERIOD')}</th>{cols.map(k => <th key={k} style={thCell}>{k}</th>)}</tr></thead>
              <tbody>{traj.map((row, i) => {
                const last = i === traj.length - 1;
                return (
                  <tr key={i} style={{ borderTop: '1px solid var(--hm-border4)' }}>
                    <td style={{ ...tdCell, color: 'var(--hm-text3)', fontFamily: 'ui-monospace,monospace' }}>{row.period}</td>
                    {cols.map(k => <td key={k} style={{ ...tdCell, fontFamily: 'ui-monospace,monospace', color: last ? 'var(--hm-text)' : 'var(--hm-text2)', fontWeight: last ? 700 : 400 }}>{row[k]}</td>)}
                  </tr>);
              })}</tbody>
            </table>
          )}
        </div>
      )}
      {d.players?.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={thRow}><th style={thCell}>{t('ИГРОК', 'PLAYER')}</th><th style={thCell}>{t('ДОЛЯ', 'SHARE')}</th><th style={thCell}>{t('ТРЕНД', 'TREND')}</th><th style={thCell}>{t('ТЕХ / КВАЛИФИКАЦИЯ', 'TECH / QUALIFICATION')}</th></tr></thead>
            <tbody>{d.players.map((p, i) => { const g = trendGlyph(p.trend); return (
              <tr key={i} style={{ borderTop: '1px solid var(--hm-border4)' }}>
                <td style={tdCell}><span style={{ color: 'var(--hm-text)', fontWeight: 600 }}>{p.name}</span>{p.note && <div style={{ fontSize: 10.5, color: 'var(--hm-text3)', marginTop: 3, lineHeight: 1.5 }}>{p.note}</div>}</td>
                <td style={{ ...tdCell, fontFamily: 'ui-monospace,monospace', color: 'var(--hm-text2)', whiteSpace: 'nowrap' }}>{p.share}</td>
                <td style={tdCell}><span style={{ color: g.c, fontSize: 13 }}>{g.s}</span></td>
                <td style={{ ...tdCell, color: 'var(--hm-text2)' }}>{p.tech}</td>
              </tr>); })}</tbody>
          </table>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        {d.entryBarrier && (
          <div style={miniCard}>
            <div style={miniKicker}>{t('БАРЬЕР ВХОДА · МОЖЕТ ЛИ ВОЙТИ НОВЫЙ ИГРОК', 'BARRIER TO ENTRY · CAN A NEW PLAYER GET IN')}</div>
            {typeof d.entryBarrier === 'string'
              ? <div style={miniBody}>{d.entryBarrier}</div>
              : <>
                  {d.entryBarrier.verdict && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: /нет|маловероят/i.test(d.entryBarrier.verdict) ? '#10b981' : '#f59e0b' }}>Новый игрок за 3 года: {d.entryBarrier.verdict}</div>}
                  {d.entryBarrier.why && <div style={miniBody}>{d.entryBarrier.why}</div>}
                </>}
          </div>
        )}
        {d.switchingCost && <div style={miniCard}><div style={miniKicker}>{t('ПОЧЕМУ КЛИЕНТ НЕ МОЖЕТ БЫСТРО УЙТИ', 'WHY A CUSTOMER CANNOT LEAVE QUICKLY')}</div><div style={miniBody}>{d.switchingCost}</div></div>}
      </div>
    </Block>
  );
}

// ─ Block 4 – Demand ────────────────────────────────────────────────────────
function DemandBlock({ d, c }) {
  const t = useT();
  return (
    <Block id="demand" takeaway={d.takeaway} accent={c} kicker={t('05 · СПРОС · НАСКОЛЬКО ЗАКОНТРАКТОВАН', '05 · DEMAND · HOW FAR CONTRACTED')}>
      {d.soldOut?.length > 0 && (
        <div style={{ ...cardBg, padding: '16px 18px', marginBottom: 14 }}>
          <div style={{ ...miniKicker, marginBottom: 10 }}>{t('РАСПРОДАНО / ЗАКОНТРАКТОВАНО ПО ГОДАМ', 'SOLD OUT / CONTRACTED BY YEAR')}</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {d.soldOut.map((s, i) => (
              <div key={i} style={{ flex: '1 1 90px', minWidth: 90 }}>
                <div style={{ height: 8, background: 'var(--hm-border4)', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: Math.min(100, s.pct) + '%', height: '100%', background: c }} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}><span style={{ color: 'var(--hm-text3)', fontFamily: 'ui-monospace,monospace' }}>{s.year}</span><span style={{ color: 'var(--hm-text2)', fontWeight: 700 }}>{s.pct}%</span></div>
                {s.note && <div style={{ fontSize: 9.5, color: 'var(--hm-text5)', marginTop: 3, lineHeight: 1.4 }}>{s.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        {d.contractStructure && <div style={miniCard}><div style={miniKicker}>{t('СТРУКТУРА КОНТРАКТОВ', 'CONTRACT STRUCTURE')}</div><div style={miniBody}>{d.contractStructure}</div></div>}
        {d.customerConcentration && <div style={miniCard}><div style={miniKicker}>{t('КОНЦЕНТРАЦИЯ КЛИЕНТОВ', 'CUSTOMER CONCENTRATION')}</div><div style={miniBody}>{d.customerConcentration}</div></div>}
        {d.backlog && <div style={miniCard}><div style={miniKicker}>{t('ПОРТФЕЛЬ ЗАКАЗОВ (RPO)', 'ORDER BACKLOG (RPO)')}</div><div style={miniBody}>{d.backlog}</div></div>}
        {d.pricing && <div style={miniCard}><div style={miniKicker}>{t('ЦЕНОВАЯ ТРАЕКТОРИЯ', 'PRICE TRAJECTORY')}</div><div style={miniBody}>{d.pricing}</div></div>}
      </div>
    </Block>
  );
}

// ─ Block 5 – Supply / balance (the key cyclical output) ────────────────────
function SupplyBlock({ d, c }) {
  const t = useT();
  const sm = { deficit: { t: t('Дефицит', 'Shortage'), col: '#10b981' }, tight: { t: t('Напряжённо', 'Tight'), col: '#22d3ee' }, balanced: { t: t('Баланс', 'Balanced'), col: 'var(--hm-text3)' }, surplus: { t: t('Профицит', 'Surplus'), col: '#ef4444' }, unknown: { t: t('Неясно', 'Unclear'), col: 'var(--hm-text6)' } };
  const hasBalance = d.balance?.length > 0 && !d.balance.every(b => b.state === 'unknown');
  const hasAnything = hasBalance || d.leadTime || d.utilization || d.crowdingOut || d.capacityAdds?.length > 0;
  if (!hasAnything && !d.takeaway) return null;
  return (
    <Block id="supply" takeaway={d.takeaway} accent={c} kicker={t('06 · ПРЕДЛОЖЕНИЕ · ДЕФИЦИТ ИЛИ ПЕРЕИЗБЫТОК', '06 · SUPPLY · SHORTAGE OR GLUT')} lead={t('главный вопрос для цикла', 'the key question for the cycle')}>
      {hasBalance && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {d.balance.map((b, i) => { const st = sm[b.state] || sm.unknown; return (
              <div key={i} style={{ flex: '1 1 120px', minWidth: 120, background: `color-mix(in srgb, ${st.col} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${st.col} 27%, transparent)`, borderRadius: 10, padding: '14px' }}>
                <div style={{ fontSize: 11, color: 'var(--hm-text3)', fontFamily: 'ui-monospace,monospace' }}>{b.year}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: st.col, marginTop: 4 }}>{st.t}</div>
                {b.note && <div style={{ fontSize: 10.5, color: 'var(--hm-text3)', marginTop: 4, lineHeight: 1.4 }}>{b.note}</div>}
              </div>); })}
          </div>
          <div style={{ fontSize: 10, color: 'var(--hm-text6)', marginTop: 8, fontStyle: 'italic' }}>{t('Дефицит = ценовая власть у производителя; профицит = падение цен.', 'Shortage = pricing power for the maker; glut = falling prices.')}</div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        {d.leadTime && <div style={miniCard}><div style={miniKicker}>{t('СКОЛЬКО СТРОИТСЯ НОВЫЙ ЗАВОД', 'HOW LONG A NEW PLANT TAKES')}</div><div style={miniBody}>{d.leadTime}</div></div>}
        {d.utilization && <div style={miniCard}><div style={miniKicker}>{t('ЗАГРУЗКА ЗАВОДОВ', 'FAB UTILISATION')}</div><div style={miniBody}>{d.utilization}</div></div>}
        {d.crowdingOut && <div style={miniCard}><div style={miniKicker}>{t('ЭФФЕКТ ВЫТЕСНЕНИЯ', 'CROWDING-OUT EFFECT')}</div><div style={miniBody}>{d.crowdingOut}</div></div>}
      </div>
      {d.capacityAdds?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={miniKicker}>{t('АНОНСИРОВАННЫЕ РАСШИРЕНИЯ', 'ANNOUNCED EXPANSIONS')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {d.capacityAdds.map((a, i) => <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--hm-text2)', lineHeight: 1.5, flexWrap: 'wrap' }}><span style={{ color: 'var(--hm-text)', fontWeight: 600, minWidth: 110 }}>{a.player}</span><span style={{ color: 'var(--hm-text2)', flex: 1 }}>{a.detail}</span></div>)}
          </div>
        </div>
      )}
    </Block>
  );
}

// ─ Block 6 – Unit economics ────────────────────────────────────────────────
function UnitEconBlock({ d, c }) {
  const t = useT();
  return (
    <Block id="unit" takeaway={d.takeaway} accent={c} kicker={t('07 · ЦЕНА · МАРЖА · БРАК', '07 · PRICE · MARGIN · DEFECTS')}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        {d.pricePerUnit && <div style={miniCard}><div style={miniKicker}>{t('ЦЕНА ЗА ЕДИНИЦУ', 'PRICE PER UNIT')}</div><div style={miniBody}>{d.pricePerUnit}</div></div>}
        {d.grossMargin && <div style={miniCard}><div style={miniKicker}>{t('ВАЛОВАЯ МАРЖА', 'GROSS MARGIN')}</div><div style={miniBody}>{d.grossMargin}</div></div>}
        {d.costCurve && <div style={miniCard}><div style={miniKicker}>{t('КРИВАЯ ИЗДЕРЖЕК · ЛИДЕР', 'COST CURVE · LEADER')}</div><div style={miniBody}>{d.costCurve}</div></div>}
      </div>
      {d.yields?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={miniKicker}>{t('СКОЛЬКО ЧИПОВ ВЫХОДИТ БЕЗ БРАКА – ГЛАВНЫЙ РЫЧАГ ПРИБЫЛИ', 'HOW MANY CHIPS COME OUT GOOD — THE MAIN PROFIT LEVER')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 8 }}>
            {d.yields.map((y, i) => <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--hm-text2)', flexWrap: 'wrap' }}><span style={{ color: 'var(--hm-text)', fontWeight: 600, minWidth: 220 }}>{y.label}</span><span style={{ color: 'var(--hm-text2)', flex: 1 }}>{y.value}</span></div>)}
          </div>
        </div>
      )}
    </Block>
  );
}

// ─ Block 7 – Roadmap + disruption ──────────────────────────────────────────
function RoadmapBlock({ d, c }) {
  const t = useT();
  return (
    <Block id="roadmap" takeaway={d.takeaway} accent={c} kicker={t('08 · ПОКОЛЕНИЯ ТЕХНОЛОГИИ И УГРОЗЫ', '08 · TECHNOLOGY GENERATIONS AND THREATS')}>
      {d.generations?.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: d.disruption?.length ? 16 : 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 520 }}>
            <thead><tr style={thRow}><th style={thCell}>{t('ПОКОЛЕНИЕ', 'GENERATION')}</th><th style={thCell}>MASS PROD.</th><th style={thCell}>{t('ЧТО МЕНЯЕТСЯ / КТО ВЫИГРЫВАЕТ', 'WHAT CHANGES / WHO WINS')}</th></tr></thead>
            <tbody>{d.generations.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--hm-border4)' }}>
                <td style={{ ...tdCell, color: 'var(--hm-text)', fontWeight: 700, whiteSpace: 'nowrap' }}>{r.gen}{r.spec && <div style={{ fontSize: 9.5, color: 'var(--hm-text5)', fontWeight: 400, marginTop: 2 }}>{r.spec}</div>}</td>
                <td style={{ ...tdCell, fontFamily: 'ui-monospace,monospace', color: 'var(--hm-text2)', whiteSpace: 'nowrap' }}>{r.mp}</td>
                <td style={{ ...tdCell, color: 'var(--hm-text2)' }}>{r.note}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      {d.disruption?.length > 0 && (
        <div>
          <div style={miniKicker}>{t('ЧТО МОЖЕТ ИЗМЕНИТЬ РАСКЛАД', 'WHAT COULD CHANGE THE PICTURE')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {d.disruption.map((x, i) => (
              <div key={i} style={{ ...miniCard, padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ color: 'var(--hm-text)', fontWeight: 700, fontSize: 13 }}>{x.tech}</span>
                  <Badge text={x.verdict} col={x.tone === 'risk' ? '#ef4444' : x.tone === 'watch' ? '#f59e0b' : '#10b981'} />
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--hm-text2)', lineHeight: 1.65 }}>{x.detail}</div>
                {x.angle && (
                  <div style={{ fontSize: 11.5, color: 'var(--hm-text3)', lineHeight: 1.55, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--hm-border4)' }}>
                    <span style={{ color: c, fontWeight: 700 }}>{t('Для инвестора', 'For an investor')}: </span>{x.angle}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Block>
  );
}

// ─ Block 8 – Dependencies ──────────────────────────────────────────────────
function DependenciesBlock({ d, c }) {
  const t = useT();
  return (
    <Block id="deps" takeaway={d.takeaway} accent={c} kicker={t('09 · ОТ КОГО ЗАВИСИТ И КТО ПОКУПАЕТ', '09 · WHO IT DEPENDS ON AND WHO BUYS')}>
      {d.upstream?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={miniKicker}>{t('ЧТО НУЖНО ДЛЯ ПРОИЗВОДСТВА – И КТО ЭТО ПОСТАВЛЯЕТ', 'WHAT PRODUCTION NEEDS — AND WHO SUPPLIES IT')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {d.upstream.map((u, i) => (
              <div key={i} style={{ ...miniCard, padding: '12px 14px' }}>
                <div style={{ color: 'var(--hm-text)', fontWeight: 600, fontSize: 12.5, marginBottom: 5 }}>{u.item}</div>
                <div style={{ fontSize: 11.5, color: 'var(--hm-text3)', lineHeight: 1.55 }}>
                  {u.supplier && <><span style={{ color: 'var(--hm-text5)' }}>{t('Поставщик', 'Supplier')}: </span><span style={{ color: c, fontWeight: 600 }}>{u.supplier}</span>{u.note ? ' – ' : ''}</>}
                  {u.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        {d.downstream && <div style={miniCard}><div style={miniKicker}>{t('ВНИЗ · КТО ПОКУПАЕТ', 'DOWNSTREAM · WHO BUYS')}</div><div style={miniBody}>{d.downstream}</div></div>}
        {d.correlation && <div style={miniCard}><div style={miniKicker}>{t('КОРРЕЛЯЦИЯ / ЛАГ', 'CORRELATION / LAG')}</div><div style={miniBody}>{d.correlation}</div></div>}
      </div>
    </Block>
  );
}

// ─ Block 9 – Risk register (heat) ──────────────────────────────────────────
function RiskMatrixBlock({ rows, c }) {
  const t = useT();
  const lvl = x => { const s = (x || '').toLowerCase(); return s.includes(t('выс', 'high')) ? '#ef4444' : s.includes(t('сред', 'mid')) ? '#f59e0b' : s.includes(t('низ', 'low')) ? '#10b981' : 'var(--hm-text3)'; };
  return (
    <Block id="risks" accent={c} kicker={t('10 · РИСКИ · ВЕРОЯТНОСТЬ × ПОСЛЕДСТВИЯ', '10 · RISKS · LIKELIHOOD × IMPACT')}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 560 }}>
          <thead><tr style={thRow}><th style={thCell}>{t('РИСК', 'RISK')}</th><th style={thCell}>{t('ВЕРОЯТ.', 'LIKELY')}</th><th style={thCell}>{t('ПОСЛЕДСТВИЯ', 'IMPACT')}</th><th style={thCell}>{t('ОЦЕНКА', 'VALUATION')}</th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--hm-border4)' }}>
              <td style={{ ...tdCell, color: 'var(--hm-text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.risk}</td>
              <td style={tdCell}><Badge text={r.prob} col={lvl(r.prob)} /></td>
              <td style={tdCell}><Badge text={r.impact} col={lvl(r.impact)} /></td>
              <td style={{ ...tdCell, color: 'var(--hm-text2)' }}>{r.note}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </Block>
  );
}

// ─ Block 10 – Investable universe ──────────────────────────────────────────
function UniverseBlock({ rows, c }) {
  const t = useT();
  return (
    <Block id="universe" accent={c} kicker={t('11 · ЧЕРЕЗ КОГО ИНВЕСТИРОВАТЬ', '11 · WHO TO INVEST THROUGH')}>
      <div style={{ fontSize: 10.5, color: 'var(--hm-text5)', lineHeight: 1.55, marginBottom: 12 }}>
        {t('«Чистота ставки» (1–10) – насколько выручка компании зависит именно от этого звена: 10 = почти вся, 1 = крошечная доля большого бизнеса.',
           '"Purity of the bet" (1–10) is how much of a company\'s revenue depends on this link specifically: 10 means nearly all of it, 1 means a tiny slice of a large business.')}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 640 }}>
          <thead><tr style={thRow}><th style={thCell}>{t('КОМПАНИЯ', 'COMPANY')}</th><th style={thCell}>{t('ТИКЕР', 'TICKER')}</th><th style={thCell}>{t('КАП.', 'CAP.')}</th><th style={thCell}>{t('ЭКСПОЗИЦИЯ', 'EXPOSURE')}</th><th style={thCell}>{t('ЧИСТОТА СТАВКИ', 'PURITY OF THE BET')}</th><th style={thCell}>{t('ОЦЕНКА', 'VALUATION')}</th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--hm-border4)' }}>
              <td style={tdCell}><span style={{ color: 'var(--hm-text)', fontWeight: 600 }}>{r.company}</span>{r.note && <div style={{ fontSize: 10.5, color: 'var(--hm-text3)', marginTop: 3, lineHeight: 1.5 }}>{r.note}</div>}</td>
              <td style={{ ...tdCell, fontFamily: 'ui-monospace,monospace', color: 'var(--hm-text3)', whiteSpace: 'nowrap' }}>{r.ticker}</td>
              <td style={{ ...tdCell, fontFamily: 'ui-monospace,monospace', color: 'var(--hm-text2)', whiteSpace: 'nowrap' }}>{r.mcap || '–'}</td>
              <td style={{ ...tdCell, color: 'var(--hm-text2)' }}>{r.exposure}</td>
              <td style={tdCell}>{r.pureplay != null && <PurePlay v={r.pureplay} c={c} />}</td>
              <td style={{ ...tdCell, fontFamily: 'ui-monospace,monospace', color: 'var(--hm-text2)' }}>{r.valuation || '–'}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </Block>
  );
}

// ─ Block 10 (alt) – Curated picks in tiers: established leaders vs. quieter
// emerging bets. Each row carries its own "why" plus either what is already
// priced in (leaders) or the explicit risk (emerging).
function ProfileBlock({ title, color, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 9.5, color, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.16em', fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: 'var(--hm-text2)', lineHeight: 1.75, marginTop: 6 }}>{children}</div>
    </div>
  );
}

// Rich company overview shown over the picks (DC_PROFILES keyed by ticker).
function CompanyProfileModal({ profile, c, onClose, onJump }) {
  const t = useT();
  if (!profile) return null;
  const fin = profile.financials || [];
  const jump = id => { onClose(); if (onJump) onJump(id); };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.62)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 18px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 640, width: '100%', background: 'var(--hm-panel)', border: `1px solid color-mix(in srgb, ${c} 27%, transparent)`, borderRadius: 16, padding: '24px 26px 28px', boxShadow: '0 24px 80px rgba(0,0,0,.72)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, color: 'var(--hm-text)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{profile.company}</div>
            <div style={{ fontSize: 11.5, color: 'var(--hm-text3)', fontFamily: 'ui-monospace,monospace', marginTop: 4 }}>{profile.ticker}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--hm-text3)', fontSize: 24, lineHeight: 1, padding: 0 }} aria-label={t('Закрыть', 'Close')}>×</button>
        </div>
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 13, fontSize: 12, color: c, textDecoration: 'none', border: `1px solid color-mix(in srgb, ${c} 33%, transparent)`, borderRadius: 8, padding: '6px 12px', fontWeight: 600 }}>{t('↗ Открыть сайт компании', '↗ Open the company site')}</a>
        )}
        {profile.tagline && <div style={{ fontSize: 14, color: 'var(--hm-text)', fontWeight: 600, lineHeight: 1.55, marginTop: 16 }}>{profile.tagline}</div>}
        {profile.overview && <div style={{ fontSize: 12.5, color: 'var(--hm-text2)', lineHeight: 1.8, marginTop: 12 }}><RichText text={profile.overview} c={c} onJump={jump} /></div>}
        {fin.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(fin.length, 3)},1fr)`, gap: 8, marginTop: 16 }}>
            {fin.map((f, i) => (
              <div key={i} style={{ background: '#151517', border: '1px solid var(--hm-border4)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 15, color: 'var(--hm-text)', fontWeight: 700 }}>{f.v}</div>
                <div style={{ fontSize: 10, color: 'var(--hm-text3)', marginTop: 3, lineHeight: 1.3 }}>{f.l}</div>
              </div>
            ))}
          </div>
        )}
        {profile.target && <ProfileBlock title={t('ЦЕЛЬ', 'TARGET')} color={c}>{profile.target}</ProfileBlock>}
        {profile.whyMargins && <ProfileBlock title={t('ПОЧЕМУ ТАКАЯ МАРЖА', 'WHY THE MARGIN IS WHAT IT IS')} color={c}>{profile.whyMargins}</ProfileBlock>}
        {profile.moat?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 9.5, color: c, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.16em', fontWeight: 700 }}>{t('БАРЬЕР', 'BARRIER')}</div>
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--hm-text2)', fontSize: 12.5, lineHeight: 1.7 }}>{profile.moat.map((m, i) => <li key={i} style={{ marginBottom: 3 }}>{m}</li>)}</ul>
          </div>
        )}
        {profile.risk && <ProfileBlock title={t('ГЛАВНЫЙ РИСК', 'KEY RISK')} color="#ef4444">{profile.risk}</ProfileBlock>}
        {profile.verdict && (
          <div style={{ marginTop: 18, padding: '14px 16px', background: `color-mix(in srgb, ${c} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 20%, transparent)`, borderRadius: 12 }}>
            <div style={{ fontSize: 9.5, color: c, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.16em', fontWeight: 700 }}>{t('ВЕРДИКТ', 'VERDICT')}</div>
            <div style={{ fontSize: 13, color: 'var(--hm-text)', lineHeight: 1.65, marginTop: 6 }}>{profile.verdict}</div>
          </div>
        )}
        {(profile.related || []).some(id => NODES[id]) && (
          <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {profile.related.map(id => NODES[id] && (
              <span key={id} onClick={() => jump(id)}
                style={{ fontSize: 11.5, color: c, cursor: 'pointer', border: `1px solid color-mix(in srgb, ${c} 27%, transparent)`, borderRadius: 7, padding: '4px 9px' }}>→ {NODES[id].label}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PicksBlock({ groups, c, takeaway, onJump }) {
  const t = useT();
  const [openTicker, setOpenTicker] = useState(null);
  return (
    <Block id="universe" accent={c} kicker={t('11 · ЧЕРЕЗ КОГО ИНВЕСТИРОВАТЬ', '11 · WHO TO INVEST THROUGH')} takeaway={takeaway}>
      {groups.map((g, gi) => {
        const gc = g.tone === 'emerging' ? '#22d3ee' : c;
        return (
          <div key={gi} style={{ marginBottom: gi < groups.length - 1 ? 24 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--hm-text)' }}>{g.group}</span>
              {g.badge && <Badge text={g.badge} col={gc} />}
            </div>
            {g.note && <div style={{ fontSize: 11.5, color: 'var(--hm-text5)', lineHeight: 1.6, marginBottom: 12 }}>{g.note}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 10 }}>
              {g.rows.map((r, i) => {
                const prof = DC_PROFILES[r.ticker];
                return (
                <div key={i} style={{ ...miniCard, padding: '14px 16px', borderLeft: `3px solid ${gc}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: 'var(--hm-text)', fontWeight: 700 }}>{r.company}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--hm-text3)', fontFamily: 'ui-monospace,monospace', whiteSpace: 'nowrap' }}>{r.ticker}</span>
                  </div>
                  {(r.mcap || r.exposure) && (
                    <div style={{ fontSize: 10.5, color: 'var(--hm-text5)', marginTop: 4, fontFamily: 'ui-monospace,monospace' }}>
                      {[r.mcap, r.exposure].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  {r.why && <div style={{ fontSize: 12, color: 'var(--hm-text2)', lineHeight: 1.6, marginTop: 8 }}>{r.why}</div>}
                  {r.priced && (
                    <div style={{ fontSize: 11.5, color: 'var(--hm-text3)', lineHeight: 1.55, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--hm-border4)' }}>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>{t('Уже в цене', 'Already priced in')}: </span>{r.priced}
                    </div>
                  )}
                  {r.risk && (
                    <div style={{ fontSize: 11.5, color: 'var(--hm-text3)', lineHeight: 1.55, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--hm-border4)' }}>
                      <span style={{ color: '#ef4444', fontWeight: 700 }}>{t('Риск', 'Risk')}: </span>{r.risk}
                    </div>
                  )}
                  {prof && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--hm-border4)', flexWrap: 'wrap' }}>
                      <button onClick={() => setOpenTicker(r.ticker)}
                        style={{ background: `color-mix(in srgb, ${gc} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${gc} 33%, transparent)`, borderRadius: 7, cursor: 'pointer', color: 'var(--hm-text)', font: 'inherit', fontSize: 11, fontWeight: 600, padding: '4px 10px' }}
                        onMouseEnter={e => e.currentTarget.style.background = `color-mix(in srgb, ${gc} 20%, transparent)`} onMouseLeave={e => e.currentTarget.style.background = `color-mix(in srgb, ${gc} 10%, transparent)`}>Подробнее о компании →</button>
                      {prof.website && (
                        <a href={prof.website} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--hm-text3)', textDecoration: 'none', border: '1px solid var(--hm-border5)', borderRadius: 7, padding: '4px 9px' }}>{t('↗ Сайт', '↗ Site')}</a>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <CompanyProfileModal profile={openTicker ? DC_PROFILES[openTicker] : null} c={c} onClose={() => setOpenTicker(null)} onJump={onJump} />
    </Block>
  );
}

// ─ Block 11 – Monitoring + canary ──────────────────────────────────────────
function MonitoringBlock({ d, c }) {
  const t = useT();
  const ladder = d.ladder;
  const ladderCols = ladder ? [
    bi({ title: ['ТЕЗИС В СИЛЕ', 'THESIS INTACT'] }, { key: 'intact', col: '#10b981' }),
    bi({ title: ['СМОТРЕТЬ ВНИМАТЕЛЬНО', 'WATCH CLOSELY'] }, { key: 'watch', col: '#f59e0b' }),
    bi({ title: ['ТЕЗИС СЛОМАН – ВЫХОД', 'THESIS BROKEN — EXIT'] }, { key: 'broken', col: '#ef4444' }),
  ].filter(x => ladder[x.key]?.length) : [];
  return (
    <Block id="monitor" accent={c} kicker={t('14 · ЧТО ОТСЛЕЖИВАТЬ · КОГДА ВЫХОДИТЬ', '14 · WHAT TO WATCH · WHEN TO EXIT')}>
      {d.metrics?.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 14 }}>
          {typeof d.metrics[0] === 'string' ? (
            <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--hm-text2)', fontSize: 12.5, lineHeight: 1.7 }}>{d.metrics.map((m, i) => <li key={i} style={{ marginBottom: 4 }}>{m}</li>)}</ul>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={thRow}><th style={thCell}>{t('МЕТРИКА', 'METRIC')}</th><th style={thCell}>{t('ИСТОЧНИК / ЧАСТОТА', 'SOURCE / FREQUENCY')}</th></tr></thead>
              <tbody>{d.metrics.map((m, i) => <tr key={i} style={{ borderTop: '1px solid var(--hm-border4)' }}><td style={{ ...tdCell, color: 'var(--hm-text2)' }}>{m.metric}</td><td style={{ ...tdCell, color: 'var(--hm-text3)' }}>{m.source}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      )}
      {ladderCols.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
          {ladderCols.map(col => (
            <div key={col.key} style={{ background: `${col.col}0c`, border: `1px solid color-mix(in srgb, ${col.col} 19%, transparent)`, borderRadius: 10, padding: '13px 15px' }}>
              <div style={{ fontSize: 9, color: col.col, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 9 }}>{col.title}</div>
              <ul style={{ margin: 0, paddingLeft: 15, color: 'var(--hm-text2)', fontSize: 11.5, lineHeight: 1.6 }}>{ladder[col.key].map((x, i) => <li key={i} style={{ marginBottom: 5 }}>{x}</li>)}</ul>
            </div>
          ))}
        </div>
      ) : d.canary?.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 9, color: '#ef4444', fontFamily: 'ui-monospace,monospace', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 8 }}>{t('ПЕРВЫЕ СИГНАЛЫ, ЧТО ТЕЗИС ЛОМАЕТСЯ – ПОРА ВЫХОДИТЬ', 'FIRST SIGNS THE THESIS IS BREAKING — TIME TO EXIT')}</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--hm-text2)', fontSize: 12.5, lineHeight: 1.7 }}>{d.canary.map((x, i) => <li key={i} style={{ marginBottom: 4 }}>{x}</li>)}</ul>
        </div>
      )}
    </Block>
  );
}

// ─ Block 12 – Scenarios (bull / bear) ──────────────────────────────────────
function BullBear({ v, c }) {
  const t = useT();
  const Col = ({ title, items, color }) => (
    <div style={{ background: `${color}0c`, border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`, borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 9.5, color, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((it, i) => {
          const point = typeof it === 'string' ? it : it.point;
          const confirm = typeof it === 'string' ? null : it.confirm;
          return (
            <div key={i}>
              <div style={{ fontSize: 12.5, color: 'var(--hm-text2)', lineHeight: 1.55, fontWeight: 600 }}>{point}</div>
              {confirm && <div style={{ fontSize: 11, color: 'var(--hm-text3)', lineHeight: 1.5, marginTop: 4 }}><span style={{ color, fontWeight: 700 }}>{t('Подтвердить', 'Confirm')}: </span>{confirm}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <Block id="cases" accent={c} kicker={t('12 · СЦЕНАРИИ', '12 · SCENARIOS')}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
        {v.bull && <Col title={t('БЫЧИЙ СЦЕНАРИЙ', 'BULL CASE')} items={v.bull} color="#10b981" />}
        {v.bear && <Col title={t('МЕДВЕЖИЙ СЦЕНАРИЙ', 'BEAR CASE')} items={v.bear} color="#ef4444" />}
      </div>
    </Block>
  );
}

// ─ NodeDetail – assembles the memo ─────────────────────────────────────────
// Dated "recent developments" block – current debate / news, verdict per story.
function UpdateBlock({ d, c, news }) {
  const t = useT();
  const toneCol = t => ({ calm: '#10b981', positive: '#10b981', watch: '#f59e0b', mixed: '#f59e0b', negative: '#ef4444' }[t] || 'var(--hm-text3)');
  return (
    <Block id="update" accent={c} kicker={t('СВЕЖИЙ РАЗБОР · ЧТО ПРОИСХОДИТ И НОВОСТИ', 'FRESH READ · WHAT IS HAPPENING AND THE NEWS')} lead={d.asOf}>
      {d.headline && <div style={{ fontSize: 15.5, color: 'var(--hm-text)', fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{d.headline}</div>}
      {d.summary && <div style={{ fontSize: 13, color: 'var(--hm-text2)', lineHeight: 1.7, marginBottom: 14 }}>{d.summary}</div>}
      {d.stories?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {d.stories.map((s, i) => (
            <div key={i} style={{ ...miniCard, padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontSize: 9.5, color: s.date ? 'var(--hm-text5)' : 'var(--hm-text6)', fontFamily: 'ui-monospace,monospace', fontWeight: 700 }}>{s.date || String(i + 1).padStart(2, '0')}</span>
                {s.source && <span style={{ fontSize: 9.5, color: c, fontFamily: 'ui-monospace,monospace', fontWeight: 700 }}>{s.source}</span>}
                <span style={{ color: 'var(--hm-text)', fontWeight: 700, fontSize: 13 }}>{s.title}</span>
                {s.verdict && <Badge text={s.verdict} col={toneCol(s.tone)} />}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--hm-text2)', lineHeight: 1.65 }}>{s.detail}</div>
            </div>
          ))}
        </div>
      )}
      {news?.length > 0 && !(d.stories?.length > 0) && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--hm-border4)' }}>
          <div style={{ ...miniKicker, marginBottom: 4 }}>{t('ЛЕНТА · ДАТЫ И ИСТОЧНИКИ', 'FEED · DATES AND SOURCES')}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {news.map((n, i) => (
              <div key={i} style={{ padding: '12px 0', borderTop: i ? '1px solid var(--hm-border4)' : 'none', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 92 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace' }}>{n.date}</div>
                  {n.source && <div style={{ fontSize: 9.5, color: c, marginTop: 4, fontWeight: 700, fontFamily: 'ui-monospace,monospace' }}>{n.source}</div>}
                </div>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ fontSize: 13, color: 'var(--hm-text)', fontWeight: 600, lineHeight: 1.4, marginBottom: n.blurb ? 4 : 0 }}>{n.title}</div>
                  {n.blurb && <div style={{ fontSize: 11.5, color: 'var(--hm-text3)', lineHeight: 1.55 }}>{n.blurb}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {d.bottomLine && (
        <div style={{ marginTop: 14, padding: '14px 16px', background: `color-mix(in srgb, ${c} 6%, transparent)`, borderLeft: `3px solid ${c}`, borderRadius: '0 9px 9px 0' }}>
          <div style={{ fontSize: 9, color: c, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 6 }}>{t('ИТОГ', 'TOTAL')}</div>
          <div style={{ fontSize: 12.5, color: 'var(--hm-text2)', lineHeight: 1.7 }}>{d.bottomLine}</div>
        </div>
      )}
    </Block>
  );
}

// News feed – dated headlines with source + short blurb.
function NewsBlock({ items, c }) {
  const t = useT();
  return (
    <Block id="news" accent={c} kicker={t('НОВОСТИ ЗВЕНА', 'LINK NEWS')}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((n, i) => (
          <div key={i} style={{ padding: '14px 0', borderTop: i ? '1px solid var(--hm-border4)' : 'none', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 92 }}>
              <div style={{ fontSize: 10.5, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace' }}>{n.date}</div>
              {n.source && <div style={{ fontSize: 9.5, color: c, marginTop: 4, fontWeight: 700, fontFamily: 'ui-monospace,monospace' }}>{n.source}</div>}
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 13.5, color: 'var(--hm-text)', fontWeight: 600, lineHeight: 1.4, marginBottom: n.blurb ? 5 : 0 }}>{n.title}</div>
              {n.blurb && <div style={{ fontSize: 12, color: 'var(--hm-text3)', lineHeight: 1.6 }}>{n.blurb}</div>}
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}

// ─ Mental model – the one causal chain + earnings driver the reader remembers ─
function MentalModelBlock({ d, c }) {
  const t = useT();
  const chain = d.chain || [];
  return (
    <Block id="model" accent={c} kicker={t('МОДЕЛЬ ЗВЕНА · КАК ЗДЕСЬ ЗАРАБАТЫВАЮТ', 'LINK MODEL · HOW MONEY IS MADE HERE')}>
      {chain.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: d.framework || d.revenueFormula ? 16 : 0 }}>
          {chain.map((s, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--hm-text2)', background: `color-mix(in srgb, ${c} 7%, transparent)`, border: `1px solid ${c}3a`, borderRadius: 8, padding: '8px 12px', lineHeight: 1.35 }}>{s}</span>
              {i < chain.length - 1 && <span style={{ color: c, fontSize: 16, fontWeight: 700 }}>→</span>}
            </span>
          ))}
        </div>
      )}
      {d.framework && (
        <div style={{ padding: '13px 16px', background: `color-mix(in srgb, ${c} 6%, transparent)`, borderLeft: `3px solid ${c}`, borderRadius: '0 9px 9px 0', marginBottom: d.revenueFormula || d.drivers?.length ? 14 : 0 }}>
          <div style={{ fontSize: 9, color: c, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 6 }}>{t('ЧТО ЗАПОМНИТЬ', 'WHAT TO REMEMBER')}</div>
          <div style={{ fontSize: 13.5, color: 'var(--hm-text)', lineHeight: 1.65, fontWeight: 600 }}>{d.framework}</div>
        </div>
      )}
      {d.revenueFormula && (
        <div style={{ ...cardBg, padding: '14px 18px', marginBottom: d.drivers?.length ? 12 : 0 }}>
          <div style={{ ...miniKicker, marginBottom: 7 }}>{t('ИЗ ЧЕГО СКЛАДЫВАЕТСЯ ВЫРУЧКА', 'WHAT THE REVENUE IS MADE OF')}</div>
          <div style={{ fontSize: 13.5, color: 'var(--hm-text2)', fontFamily: 'ui-monospace,monospace', lineHeight: 1.6 }}>{d.revenueFormula}</div>
        </div>
      )}
      {d.drivers?.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
          {d.drivers.map((v, i) => (
            <div key={i} style={miniCard}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 5 }}>
                <span style={{ fontSize: 12.5, color: 'var(--hm-text)', fontWeight: 700 }}>{v.var}</span>
                {v.weight && <Badge text={v.weight} col={/главн|ключ/i.test(v.weight) ? '#10b981' : 'var(--hm-text3)'} />}
              </div>
              <div style={miniBody}>{v.note}</div>
            </div>
          ))}
        </div>
      )}
    </Block>
  );
}

// ─ Industry problems – the real bottlenecks, how they're solved, who wins ────
function ProblemsBlock({ d, c }) {
  const t = useT();
  const items = d.items || [];
  return (
    <Block id="problems" takeaway={d.takeaway} accent={c} kicker={t('ГЛАВНАЯ ПРОБЛЕМА ОТРАСЛИ · КТО ЛУЧШЕ ВСЕХ ЕЁ РЕШАЕТ', 'THE INDUSTRY’S MAIN PROBLEM · WHO SOLVES IT BEST')}>
      {d.intro && <div style={{ fontSize: 13, color: 'var(--hm-text2)', lineHeight: 1.7, marginBottom: 14 }}>{d.intro}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ ...cardBg, padding: '16px 18px', borderLeft: '3px solid #ef4444' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9.5, color: '#ef4444', fontFamily: 'ui-monospace,monospace', fontWeight: 700, letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>{items.length === 1 ? t('ГЛАВНОЕ ОГРАНИЧЕНИЕ ОТРАСЛИ', 'THE INDUSTRY’S BINDING CONSTRAINT') : `ПРОБЛЕМА ${String(i + 1).padStart(2, '0')}`}</span>
              <span style={{ fontSize: 13.5, color: 'var(--hm-text)', fontWeight: 700, lineHeight: 1.45 }}>{it.problem}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
              {it.solution && <div><div style={{ ...miniKicker, color: '#22d3ee', marginBottom: 5 }}>{t('КАК ПЛАНИРУЮТ РЕШАТЬ', 'HOW THEY PLAN TO SOLVE IT')}</div><div style={miniBody}>{it.solution}</div></div>}
              {it.winners && <div><div style={{ ...miniKicker, color: '#10b981', marginBottom: 5 }}>{t('КТО ВПЕРЕДИ · КТО ВЫИГРЫВАЕТ', 'WHO IS AHEAD · WHO WINS')}</div><div style={miniBody}>{it.winners}</div></div>}
              {it.gap && <div><div style={{ ...miniKicker, color: '#f59e0b', marginBottom: 5 }}>{t('ПОЧЕМУ КОНКУРЕНТЫ ОТСТАЮТ', 'WHY COMPETITORS TRAIL')}</div><div style={miniBody}>{it.gap}</div></div>}
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}

// ─ Moat breakdown – decompose the moat into scored, trending components ──────
function MoatBreakdownBlock({ d, c }) {
  const t = useT();
  const comps = d.components || [];
  const trendWord = t => t === 'up' ? t('крепнет', 'strengthening') : t === 'down' ? t('слабеет', 'weakening') : t('стабильно', 'steady');
  return (
    <Block id="moat" takeaway={d.takeaway} accent={c} kicker={t('04 · ИЗ ЧЕГО СОСТОИТ ЗАЩИТА', '04 · WHAT THE MOAT IS MADE OF')}>
      <div style={{ fontSize: 10.5, color: 'var(--hm-text5)', lineHeight: 1.55, marginBottom: 14 }}>
        {t('Один балл защиты ничего не говорит. Разбираем её по составляющим: где 9–10 – почти неприступно, где ниже – уязвимо. Стрелка – крепнет источник преимущества или слабеет.',
           'A single moat score says nothing. We break the defence into its parts: 9–10 is close to impregnable, lower is exposed. The arrow shows whether the source of advantage is strengthening or weakening.')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {comps.map((m, i) => {
          const n = Number(m.score) || 0;
          const col = n >= 8 ? '#10b981' : n >= 6 ? '#22d3ee' : n >= 4 ? '#f59e0b' : '#ef4444';
          const g = trendGlyph(m.trend);
          return (
            <div key={i} style={{ ...miniCard, padding: '13px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 7, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--hm-text)', fontWeight: 700 }}>{m.factor}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, whiteSpace: 'nowrap' }}>
                  <span style={{ color: g.c, fontSize: 11, fontFamily: 'ui-monospace,monospace' }}>{g.s} {trendWord(m.trend)}</span>
                  <span style={{ fontSize: 14, color: 'var(--hm-text)', fontWeight: 700, fontFamily: 'ui-monospace,monospace' }}>{m.score}<span style={{ color: 'var(--hm-text6)', fontSize: 11 }}>/10</span></span>
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--hm-border4)', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: (Math.max(0, Math.min(10, n)) * 10) + '%', height: '100%', background: col, borderRadius: 3 }} />
              </div>
              {m.note && <div style={miniBody}>{m.note}</div>}
            </div>
          );
        })}
      </div>
    </Block>
  );
}

// ─ What's priced in – variant perception: market's belief vs. ours ──────────
function ExpectationsBlock({ d, c }) {
  const t = useT();
  const vk = (d.verdict || '').toLowerCase();
  const vCol = /дёшев|дешев|недооц/.test(vk) ? '#10b981' : /дорог|переоц/.test(vk) ? '#ef4444' : '#f59e0b';
  return (
    <Block id="priced" takeaway={d.takeaway} accent={c} kicker={t('12 · ЧТО УЖЕ В ЦЕНЕ · ОЖИДАНИЯ ПРОТИВ РЕАЛЬНОСТИ', '12 · WHAT IS PRICED IN · EXPECTATIONS VS REALITY')}>
      {d.impliedGrowth && (
        <div style={{ ...cardBg, padding: '14px 18px', marginBottom: 14 }}>
          <div style={{ ...miniKicker, marginBottom: 6 }}>{t('КАКОЙ РОСТ УЖЕ ЗАЛОЖЕН В ЦЕНУ', 'HOW MUCH GROWTH IS ALREADY IN THE PRICE')}</div>
          <div style={{ fontSize: 13.5, color: 'var(--hm-text2)', lineHeight: 1.65 }}>{d.impliedGrowth}</div>
        </div>
      )}
      {(d.marketBelieves || d.weThink) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginBottom: 14 }}>
          {d.marketBelieves && (
            <div style={{ background: 'var(--hm-surface)', border: '1px solid var(--hm-border5)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ ...miniKicker, marginBottom: 7 }}>{t('РЫНОК СЧИТАЕТ', 'THE MARKET THINKS')}</div>
              <div style={{ fontSize: 12.5, color: 'var(--hm-text2)', lineHeight: 1.65 }}>{d.marketBelieves}</div>
            </div>
          )}
          {d.weThink && (
            <div style={{ background: `${c}0c`, border: `1px solid ${c}3a`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 9, color: c, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 7 }}>{t('НАШ ВЗГЛЯД · В ЧЁМ РАСХОЖДЕНИЕ', 'OUR VIEW · WHERE WE DIFFER')}</div>
              <div style={{ fontSize: 12.5, color: 'var(--hm-text2)', lineHeight: 1.65 }}>{d.weThink}</div>
            </div>
          )}
        </div>
      )}
      {d.metrics?.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: d.verdict ? 14 : 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 420 }}>
            <thead><tr style={thRow}><th style={thCell}>{t('МЕТРИКА', 'METRIC')}</th><th style={thCell}>{t('СЕЙЧАС', 'NOW')}</th><th style={thCell}>{t('ИСТОРИЯ / НОРМА', 'HISTORY / NORMAL')}</th><th style={thCell}>{t('ЧТО ЭТО ЗНАЧИТ', 'WHAT IT MEANS')}</th></tr></thead>
            <tbody>{d.metrics.map((m, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--hm-border4)' }}>
                <td style={{ ...tdCell, color: 'var(--hm-text)', fontWeight: 600 }}>{m.label}</td>
                <td style={{ ...tdCell, fontFamily: 'ui-monospace,monospace', color: 'var(--hm-text2)' }}>{m.now}</td>
                <td style={{ ...tdCell, fontFamily: 'ui-monospace,monospace', color: 'var(--hm-text3)' }}>{m.history}</td>
                <td style={{ ...tdCell, color: 'var(--hm-text2)' }}>{m.note}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      {d.verdict && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: `color-mix(in srgb, ${vCol} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${vCol} 27%, transparent)`, borderRadius: 10, padding: '10px 16px' }}>
          <span style={{ fontSize: 9, color: vCol, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.14em', fontWeight: 700 }}>{t('ВЕРДИКТ ПО ЦЕНЕ', 'PRICE VERDICT')}</span>
          <span style={{ fontSize: 14, color: 'var(--hm-text)', fontWeight: 700 }}>{d.verdict}</span>
        </div>
      )}
    </Block>
  );
}

// ─ Quantified scenarios – bear/base/bull with return math + qual drivers ────
function ScenariosBlock({ scenarios, bull, bear, c }) {
  const t = useT();
  const cases = scenarios?.cases || [];
  const rows = [
    { key: 'prob', label: t('Вероятность', 'Likelihood') },
    { key: 'revenue', label: t('Рост выручки', 'Revenue growth') },
    { key: 'margin', label: t('Маржа', 'Margin') },
    { key: 'multiple', label: t('Мультипликатор', 'Multiple') },
    { key: 'ret', label: t('Доходность/год', 'Return / year') },
  ];
  const Col = ({ title, items, color }) => (
    <div style={{ background: `${color}0c`, border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`, borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 9.5, color, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((it, i) => {
          const point = typeof it === 'string' ? it : it.point;
          const confirm = typeof it === 'string' ? null : it.confirm;
          return (
            <div key={i}>
              <div style={{ fontSize: 12.5, color: 'var(--hm-text2)', lineHeight: 1.55, fontWeight: 600 }}>{point}</div>
              {confirm && <div style={{ fontSize: 11, color: 'var(--hm-text3)', lineHeight: 1.5, marginTop: 4 }}><span style={{ color, fontWeight: 700 }}>{t('Подтвердить', 'Confirm')}: </span>{confirm}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <Block id="cases" accent={c} kicker={t('13 · СЦЕНАРИИ · ДОХОДНОСТЬ ПО КЕЙСАМ', '13 · SCENARIOS · RETURN BY CASE')} takeaway={scenarios?.takeaway}>
      {cases.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: (bull || bear) ? 18 : 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 520 }}>
            <thead>
              <tr style={thRow}>
                <th style={thCell}></th>
                {cases.map((cs, i) => (
                  <th key={i} style={{ ...thCell, color: cs.color || 'var(--hm-text3)', fontSize: 12, textTransform: 'none', letterSpacing: 0 }}>
                    {cs.name}{cs.prob ? <span style={{ color: 'var(--hm-text6)', fontWeight: 400 }}> · {cs.prob}</span> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.filter(r => r.key !== 'prob').map(r => (
                <tr key={r.key} style={{ borderTop: '1px solid var(--hm-border4)' }}>
                  <td style={{ ...tdCell, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace', fontSize: 10.5, whiteSpace: 'nowrap' }}>{r.label}</td>
                  {cases.map((cs, i) => (
                    <td key={i} style={{ ...tdCell, fontFamily: 'ui-monospace,monospace', color: r.key === 'ret' ? (cs.color || 'var(--hm-text2)') : 'var(--hm-text2)', fontWeight: r.key === 'ret' ? 700 : 400 }}>{cs[r.key] || '–'}</td>
                  ))}
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid var(--hm-border4)' }}>
                <td style={{ ...tdCell, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace', fontSize: 10.5 }}>{t('Драйвер', 'Driver')}</td>
                {cases.map((cs, i) => <td key={i} style={{ ...tdCell, color: 'var(--hm-text3)', fontSize: 11 }}>{cs.note || '–'}</td>)}
              </tr>
            </tbody>
          </table>
          {scenarios?.expectedReturn && (
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 10, background: `color-mix(in srgb, ${c} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 27%, transparent)`, borderRadius: 10, padding: '10px 16px' }}>
              <span style={{ fontSize: 9, color: c, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.14em', fontWeight: 700 }}>{t('ВЗВЕШЕННАЯ ДОХОДНОСТЬ', 'WEIGHTED RETURN')}</span>
              <span style={{ fontSize: 14, color: 'var(--hm-text)', fontWeight: 700 }}>{scenarios.expectedReturn}</span>
            </div>
          )}
        </div>
      )}
      {(bull || bear) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
          {bull && <Col title={t('ЗА ЧТО ИГРАЕТ БЫЧИЙ СЦЕНАРИЙ', 'WHAT THE BULL CASE PLAYS FOR')} items={bull} color="#10b981" />}
          {bear && <Col title={t('ЧТО ЛОМАЕТ МЕДВЕЖИЙ СЦЕНАРИЙ', 'WHAT BREAKS THE BEAR CASE')} items={bear} color="#ef4444" />}
        </div>
      )}
    </Block>
  );
}

// ─ Thesis / narrative mode – one flowing, data-proven argument per sector ────
function ThesisHero({ bigIdea, c, highlight, originLabel, onBackOrigin }) {
  const t = useT();
  const [hover, setHover] = useState(false);
  const cid = String(c).replace(/[^a-z0-9]/gi, '');
  // Large rounded box → a scaleX sweep looks janky and overflows the corners. Instead: a glow ring
  // that follows its shape + a soft full-box tint, both held a while then faded out.
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ position: 'relative', marginBottom: 8 }}>
      {highlight && <style>{`
        @keyframes hero-glow-${cid} { 0%{box-shadow:0 0 0 0 transparent} 7%{box-shadow:0 0 0 2px ${c},0 0 28px color-mix(in srgb, ${c} 33%, transparent)} 72%{box-shadow:0 0 0 2px ${c},0 0 28px color-mix(in srgb, ${c} 33%, transparent)} 100%{box-shadow:0 0 0 0 transparent} }
        @keyframes hero-tint { 0%{opacity:0} 7%{opacity:.13} 72%{opacity:.13} 100%{opacity:0} }
      `}</style>}
      {highlight && originLabel && hover && (
        <button onClick={onBackOrigin}
          style={{ position: 'absolute', top: -13, right: 6, zIndex: 3, background: 'var(--hm-panel)', border: `1px solid color-mix(in srgb, ${c} 53%, transparent)`, borderRadius: 7, cursor: 'pointer', color: 'var(--hm-text)', font: 'inherit', fontSize: 11, padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', boxShadow: '0 2px 12px rgba(0,0,0,.55)' }}>↩ {t('Назад к', 'Back to')} «{originLabel}»</button>
      )}
      <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(180deg, ${c}1e 0%, var(--hm-bg2) 72%)`, border: `1px solid color-mix(in srgb, ${c} 27%, transparent)`, borderRadius: 16, padding: '26px 30px', animation: highlight ? `hero-glow-${cid} 5200ms ease forwards` : undefined }}>
        {highlight && <div style={{ position: 'absolute', inset: 0, background: c, borderRadius: 16, pointerEvents: 'none', zIndex: 0, animation: 'hero-tint 5200ms ease forwards' }} />}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9.5, color: c, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 12 }}>{t('ГЛАВНАЯ ИДЕЯ · ЕДИНЫЙ ТЕЗИС', 'THE BIG IDEA · ONE THESIS')}</div>
          <div style={{ fontSize: 19, color: 'var(--hm-text)', fontWeight: 700, lineHeight: 1.5, letterSpacing: '-0.01em' }}>{bigIdea}</div>
        </div>
      </div>
    </div>
  );
}

// Inline rich text: parses [[nodeId|label]] into clickable cross-links to other nodes.
function RichText({ text, c, onJump }) {
  const parts = String(text).split(/(\[\[[^\]]+\]\])/g);
  return parts.map((seg, i) => {
    const m = /^\[\[([^\]]+)\]\]$/.exec(seg);
    if (m) {
      const bits = m[1].split('|');
      const id = bits[0].trim();
      const label = (bits[1] || bits[0]).trim();
      const target = bits[2] ? bits[2].trim() : null; // optional: paragraph to land on in the destination
      if (/^https?:\/\//i.test(id)) return (
        <a key={i} href={id} target="_blank" rel="noopener noreferrer" style={{ color: c, textDecoration: 'none', fontWeight: 600, borderBottom: `1px dotted color-mix(in srgb, ${c} 53%, transparent)` }}
          onMouseEnter={e => e.currentTarget.style.borderBottomStyle = 'solid'}
          onMouseLeave={e => e.currentTarget.style.borderBottomStyle = 'dotted'}>{label} ↗</a>);
      if (onJump && NODES[id]) return (
        <span key={i} onClick={() => onJump(id, target)} style={{ color: c, cursor: 'pointer', fontWeight: 600, borderBottom: `1px dotted color-mix(in srgb, ${c} 53%, transparent)` }}
          onMouseEnter={e => e.currentTarget.style.borderBottomStyle = 'solid'}
          onMouseLeave={e => e.currentTarget.style.borderBottomStyle = 'dotted'}>{label}</span>);
      return <span key={i}>{label}</span>;
    }
    return seg ? <span key={i}>{seg}</span> : null;
  });
}

function NarrativeEl({ el, c, onJump }) {
  const k = el.k;
  if (k === 'h') return <h3 style={{ fontSize: 20, color: 'var(--hm-text)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3, margin: '36px 0 14px' }}>{el.t}</h3>;
  if (k === 'p') return <div style={{ fontSize: el.lead ? 15.5 : 14.5, color: el.lead ? 'var(--hm-text)' : 'var(--hm-text2)', lineHeight: 1.85, margin: '0 0 17px', fontWeight: el.lead ? 600 : 400 }}><RichText text={el.t} c={c} onJump={onJump} /></div>;
  if (k === 'quote') return (
    <div style={{ borderLeft: `3px solid ${c}`, background: `${c}0e`, borderRadius: '0 10px 10px 0', padding: '16px 20px', margin: '8px 0 22px' }}>
      <div style={{ fontSize: 16, color: 'var(--hm-text)', lineHeight: 1.6, fontWeight: 600, fontStyle: 'italic' }}><RichText text={el.t} c={c} onJump={onJump} /></div>
      {el.by && <div style={{ fontSize: 11, color: c, fontFamily: 'ui-monospace,monospace', marginTop: 8 }}>{el.by}</div>}
    </div>);
  if (k === 'note') return (
    <div style={{ ...miniCard, padding: '13px 16px', margin: '0 0 20px' }}>
      {el.label && <div style={{ ...miniKicker, marginBottom: 5 }}>{el.label}</div>}
      <div style={{ fontSize: 12.5, color: 'var(--hm-text3)', lineHeight: 1.65 }}><RichText text={el.t} c={c} onJump={onJump} /></div>
    </div>);
  if (k === 'stat') return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 12, margin: '6px 0 24px' }}>
      {el.items.map((s, i) => (
        <div key={i} style={{ ...cardBg, padding: '14px 16px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: c, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{s.v}</div>
          <div style={{ fontSize: 11.5, color: 'var(--hm-text2)', fontWeight: 600, marginTop: 5 }}>{s.l}</div>
          {s.n && <div style={{ fontSize: 10.5, color: 'var(--hm-text5)', marginTop: 4, lineHeight: 1.5 }}>{s.n}</div>}
        </div>))}
    </div>);
  if (k === 'image') return (
    <figure style={{ margin: '10px 0 24px' }}>
      <div style={{ ...cardBg, overflow: 'hidden', borderRadius: 12 }}>
        <img src={el.src} alt={el.caption || ''} loading="lazy" style={{ width: '100%', maxHeight: 440, objectFit: 'cover', display: 'block' }} />
      </div>
      {(el.caption || el.credit) && (
        <figcaption style={{ fontSize: 11, color: 'var(--hm-text5)', marginTop: 7, lineHeight: 1.55 }}>
          {el.caption}{el.credit && <span style={{ color: 'var(--hm-text6)' }}> · {el.credit}</span>}
        </figcaption>
      )}
    </figure>);
  if (k === 'chart') return (
    <div style={{ ...cardBg, padding: '16px 18px', margin: '6px 0 24px' }}>
      {el.t && <div style={{ ...miniKicker, marginBottom: 2 }}>{el.t}</div>}
      <TamChart rows={el.bars} c={c} />
    </div>);
  if (k === 'bars') return (
    <div style={{ ...cardBg, padding: '16px 18px', margin: '6px 0 24px' }}>
      {el.t && <div style={{ ...miniKicker, marginBottom: 12 }}>{el.t}</div>}
      {el.items.map((b, i) => {
        const pct = Math.max(0, Math.min(100, Number(b.value) || 0));
        return (
          <div key={i} style={{ marginBottom: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, gap: 10 }}>
              <span style={{ color: 'var(--hm-text2)', fontWeight: 600 }}>{b.label}</span>
              <span style={{ color: 'var(--hm-text)', fontFamily: 'ui-monospace,monospace', fontWeight: 700, whiteSpace: 'nowrap' }}>{b.display || (pct + '%')}</span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: 'var(--hm-border4)', overflow: 'hidden' }}><div style={{ width: pct + '%', height: '100%', background: c, borderRadius: 4 }} /></div>
            {b.note && <div style={{ fontSize: 10.5, color: 'var(--hm-text5)', marginTop: 4, lineHeight: 1.45 }}>{b.note}</div>}
          </div>);
      })}
    </div>);
  if (k === 'table') return (
    <div style={{ overflowX: 'auto', margin: '6px 0 24px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 420 }}>
        <thead><tr style={thRow}>{el.head.map((h, i) => <th key={i} style={thCell}>{h}</th>)}</tr></thead>
        <tbody>{el.rows.map((r, i) => (
          <tr key={i} style={{ borderTop: '1px solid var(--hm-border4)' }}>{r.map((cell, j) => <td key={j} style={{ ...tdCell, color: j === 0 ? 'var(--hm-text)' : 'var(--hm-text2)', fontWeight: j === 0 ? 600 : 400 }}><RichText text={cell} c={c} onJump={onJump} /></td>)}</tr>))}</tbody>
      </table>
      {el.note && <div style={{ fontSize: 10.5, color: 'var(--hm-text6)', marginTop: 6 }}>{el.note}</div>}
    </div>);
  return null;
}

// Highlighter-pen mark: sweeps in from the left over the text line, settles to a persistent
// low-opacity marker (doesn't disappear), and reveals a "back to origin" button on hover.
function HighlightWrap({ on, c, originLabel, onBackOrigin, style, innerRef, children }) {
  const t = useT();
  const [hover, setHover] = useState(false);
  return (
    <div ref={innerRef}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', ...style }}>
      {on && <div style={{
        position: 'absolute', left: 0, right: 0, top: -2, bottom: -2, borderRadius: 5, background: c, opacity: 0.42,
        transformOrigin: 'left center', pointerEvents: 'none', zIndex: 0,
        animation: 'hl-sweep 600ms cubic-bezier(.45,0,.2,1) forwards, hl-settle 750ms ease 2500ms forwards',
      }} />}
      {on && originLabel && hover && (
        <button onClick={onBackOrigin}
          style={{ position: 'absolute', top: -13, right: 4, zIndex: 3, background: 'var(--hm-panel)', border: `1px solid color-mix(in srgb, ${c} 53%, transparent)`, borderRadius: 7, cursor: 'pointer', color: 'var(--hm-text)', font: 'inherit', fontSize: 11, padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', boxShadow: '0 2px 12px rgba(0,0,0,.55)' }}>
          ↩ {t('Назад к', 'Back to')} «{originLabel}»</button>
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

function NarrativeView({ stream, c, onJump, highlightIdx, setElRef, originLabel, onBackOrigin }) {
  return <div style={{ maxWidth: 720, margin: '0 auto' }}>
    {(stream || []).map((el, i) => (
      // No vertical padding → child margins collapse out, so the band hugs the text line-height.
      <HighlightWrap key={i} on={i === highlightIdx} c={c} originLabel={originLabel} onBackOrigin={onBackOrigin}
        innerRef={setElRef ? (n => setElRef(i, n)) : undefined}
        style={{ padding: '0 10px', margin: '0 -10px', scrollMarginTop: 90 }}>
        <NarrativeEl el={el} c={c} onJump={onJump} />
      </HighlightWrap>
    ))}
  </div>;
}

function NodeDetail({ node, onBack, onJump, jumpTarget, scrollRestore, originLabel, onBackOrigin }) {
  const t = useT();
  const bucket = DC_BUCKETS[node.bucket];
  const c = bucket?.color || 'var(--hm-text3)';
  const layer = LAYERS[node.layer];
  const layerIdx = node.layer;
  const totalLayers = LAYERS.length;
  const detail = (DC_DETAILS[node.id] && !node.id.startsWith('_')) ? DC_DETAILS[node.id] : null;

  // Deep-link landing: scroll to (and flash-highlight) the paragraph a cross-link/search points at;
  // or restore the origin's scroll position when the reader clicks "back".
  const elRefs = useRef({});
  const [highlightKey, setHighlightKey] = useState(null); // 'hero' | number | null – persists until you leave the node
  useEffect(() => {
    if (scrollRestore != null) {
      setHighlightKey(null);
      const y = scrollRestore;
      const timer = setTimeout(() => window.scrollTo({ top: y, behavior: 'smooth' }), 60);
      return () => clearTimeout(timer);
    }
    const stream = detail?.thesis?.stream;
    if (!jumpTarget || !stream) { setHighlightKey(null); window.scrollTo({ top: 0 }); return; }
    if (jumpTarget === '__hero__') { setHighlightKey('hero'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const needle = String(jumpTarget).toLowerCase();
    const idx = stream.findIndex(el => JSON.stringify(el).toLowerCase().includes(needle));
    if (idx < 0) { setHighlightKey(null); window.scrollTo({ top: 0 }); return; }
    setHighlightKey(idx);
    const run = setTimeout(() => {
      const n = elRefs.current[idx];
      if (n && n.scrollIntoView) n.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 90);
    return () => clearTimeout(run);
  }, [node.id, jumpTarget, scrollRestore]);

  const upstream = NEIGHBOURS[node.id].in.map(id => NODES[id]);
  const downstream = NEIGHBOURS[node.id].out.map(id => NODES[id]);
  const order = { 'High': 0, 'Med-High': 1, 'Medium': 2, 'Low-Med': 3, 'Low': 4 };
  const baseCompanies = DC_COMPANIES
    .filter(co => co.sector === node.sector || (node.secondarySector && co.sector === node.secondarySector))
    .sort((a, b) => (order[a.conviction] ?? 9) - (order[b.conviction] ?? 9));

  // Thesis mode – a single flowing, data-proven argument (replaces the block memo)
  if (detail?.thesis) {
    return (
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '8px 20px 90px', animation: 'detail-fade 220ms ease' }}>
        <style>{`
          @keyframes detail-fade { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: none; } }
          @keyframes hl-sweep { from { transform: scaleX(0); } to { transform: scaleX(1); } }
          @keyframes hl-settle { from { opacity: .42; } to { opacity: .16; } }
        `}</style>
        <button onClick={onBack}
          style={{ marginTop: 8, marginBottom: 20, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--hm-text3)', font: 'inherit', fontSize: 12.5, padding: 0, display: 'inline-flex', alignItems: 'center', gap: 7 }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--hm-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--hm-text3)'}>{t('← Вернуться к цепочке', '← Back to the chain')}</button>
        {originLabel && (
          <button onClick={onBackOrigin}
            style={{ marginLeft: 14, marginBottom: 20, background: `${c}1f`, border: `1px solid color-mix(in srgb, ${c} 40%, transparent)`, borderRadius: 8, cursor: 'pointer', color: 'var(--hm-text)', font: 'inherit', fontSize: 12.5, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => e.currentTarget.style.background = `color-mix(in srgb, ${c} 20%, transparent)`}
            onMouseLeave={e => e.currentTarget.style.background = `${c}1f`}>↩ {t('Назад к', 'Back to')} «{originLabel}»</button>
        )}
        <div style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${c} 9%, transparent) 0%, transparent 100%)`, border: `1px solid color-mix(in srgb, ${c} 19%, transparent)`, borderRadius: 14, padding: '26px 28px 24px', marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: c, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 10 }}>{t('ЭТАП', 'STAGE')} {String(layerIdx + 1).padStart(2, '0')} / {String(totalLayers).padStart(2, '0')} · {layer.label}</div>
          <div style={{ fontSize: 30, color: 'var(--hm-text)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 8 }}>{node.label}</div>
          <div style={{ fontSize: 12, color: 'var(--hm-text3)', fontFamily: 'ui-monospace,monospace', letterSpacing: '0.04em' }}>{BUCKET_RU[node.bucket] || node.bucket}</div>
          <div style={{ marginTop: 18, display: 'flex', gap: 3, alignItems: 'center' }}>{Array.from({ length: totalLayers }).map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i === layerIdx ? c : i < layerIdx ? `color-mix(in srgb, ${c} 33%, transparent)` : 'var(--hm-border4)' }} />)}</div>
        </div>
        <ThesisHero bigIdea={detail.thesis.bigIdea} c={c} highlight={highlightKey === 'hero'} originLabel={originLabel} onBackOrigin={onBackOrigin} />
        <NarrativeView stream={detail.thesis.stream} c={c} onJump={onJump} highlightIdx={typeof highlightKey === 'number' ? highlightKey : -1} setElRef={(i, n) => { elRefs.current[i] = n; }} originLabel={originLabel} onBackOrigin={onBackOrigin} />
        {detail?.picks?.length > 0 && <PicksBlock groups={detail.picks} c={c} takeaway={detail.picksTakeaway} onJump={onJump} />}
        {(upstream.length > 0 || downstream.length > 0) && (
          <Block id="chain" accent={c} kicker={t('ПОЛОЖЕНИЕ В ЦЕПОЧКЕ', 'POSITION IN THE CHAIN')}>
            {upstream.length > 0 && <div style={{ marginBottom: downstream.length > 0 ? 16 : 0 }}><div style={{ ...miniKicker, marginBottom: 9 }}>{t('↑ ОТКУДА ПРИХОДИТ', '↑ WHERE IT COMES FROM')}</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{upstream.map(u => <ChainPill key={u.id} node={u} onClick={() => onJump(u.id)} />)}</div></div>}
            {downstream.length > 0 && <div><div style={{ ...miniKicker, marginBottom: 9 }}>{t('↓ КУДА ИДЁТ ДАЛЬШЕ', '↓ WHERE IT GOES NEXT')}</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{downstream.map(dn => <ChainPill key={dn.id} node={dn} onClick={() => onJump(dn.id)} />)}</div></div>}
          </Block>
        )}
      </div>
    );
  }

  const nav = [];
  if (detail?.mentalModel) nav.push({ id: 'model', label: t('Модель', 'Model') });
  if (detail?.problems) nav.push({ id: 'problems', label: t('Проблемы', 'Problems') });
  if (detail?.update || detail?.news?.length) nav.push({ id: 'update', label: t('Сейчас', 'Now') });
  if (detail?.marketSizing) nav.push({ id: 'market', label: t('Рынок', 'Market') });
  if (detail?.valueCapture) nav.push({ id: 'value', label: t('Стоимость', 'Cost') });
  if (detail?.competition) nav.push({ id: 'competition', label: t('Конкуренция', 'Competition') });
  if (detail?.moatBreakdown) nav.push({ id: 'moat', label: t('Защита', 'Moat') });
  if (detail?.demand) nav.push({ id: 'demand', label: t('Спрос', 'Demand') });
  if (detail?.supply) nav.push({ id: 'supply', label: t('Предложение', 'Supply') });
  if (detail?.unitEconomics) nav.push({ id: 'unit', label: t('Экономика', 'Economics') });
  if (detail?.roadmap) nav.push({ id: 'roadmap', label: t('Технологии', 'Technology') });
  if (detail?.dependencies) nav.push({ id: 'deps', label: t('Зависимости', 'Dependencies') });
  if (detail?.risks?.length) nav.push({ id: 'risks', label: t('Риски', 'Risks') });
  if (detail?.universe?.length || detail?.picks?.length) nav.push({ id: 'universe', label: t('Игроки', 'Players') });
  if (detail?.expectations) nav.push({ id: 'priced', label: t('Что в цене', 'What is priced in') });
  if (detail?.scenarios || detail?.verdict?.bull || detail?.verdict?.bear) nav.push({ id: 'cases', label: t('Сценарии', 'Scenarios') });
  if (detail?.monitoring) nav.push({ id: 'monitor', label: t('Мониторинг', 'Monitoring') });

  const hasDeep = !!(detail && (detail.update || detail.news?.length || detail.picks?.length || detail.verdict || detail.tldr || detail.mentalModel || detail.marketSizing || detail.valueCapture || detail.competition || detail.moatBreakdown || detail.demand || detail.supply || detail.unitEconomics || detail.roadmap || detail.dependencies || detail.risks?.length || detail.universe?.length || detail.expectations || detail.scenarios || detail.monitoring));

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '8px 20px 90px', animation: 'detail-fade 220ms ease' }}>
      <style>{`@keyframes detail-fade { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: none; } }`}</style>

      <button onClick={onBack}
        style={{ marginTop: 8, marginBottom: 20, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--hm-text3)', font: 'inherit', fontSize: 12.5, padding: 0, display: 'inline-flex', alignItems: 'center', gap: 7 }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--hm-text)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--hm-text3)'}>{t('← Вернуться к цепочке', '← Back to the chain')}</button>

      {/* Header */}
      <div style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${c} 9%, transparent) 0%, transparent 100%)`, border: `1px solid color-mix(in srgb, ${c} 19%, transparent)`, borderRadius: 14, padding: '26px 28px 24px', marginBottom: 18 }}>
        <div style={{ fontSize: 10, color: c, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 10 }}>{t('ЭТАП', 'STAGE')} {String(layerIdx + 1).padStart(2, '0')} / {String(totalLayers).padStart(2, '0')} · {layer.label}</div>
        <div style={{ fontSize: 30, color: 'var(--hm-text)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 8 }}>{node.label}</div>
        <div style={{ fontSize: 12, color: 'var(--hm-text3)', fontFamily: 'ui-monospace,monospace', letterSpacing: '0.04em' }}>{BUCKET_RU[node.bucket] || node.bucket} · {baseCompanies.length} {plural(baseCompanies.length, t('компания', 'company'), t('компании', 'companies'), t('компаний', 'companies'))}</div>
        <div style={{ marginTop: 18, display: 'flex', gap: 3, alignItems: 'center' }}>{Array.from({ length: totalLayers }).map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i === layerIdx ? c : i < layerIdx ? `color-mix(in srgb, ${c} 33%, transparent)` : 'var(--hm-border4)' }} />)}</div>
      </div>

      {detail?.whatIsIt && <WhatIsItBlock text={detail.whatIsIt} c={c} />}
      {detail?.verdict && <VerdictHero v={detail.verdict} c={c} asOf={detail.asOf} />}
      {detail?.tldr?.length > 0 && <Tldr items={detail.tldr} c={c} />}
      {nav.length > 0 && <SectionNav items={nav} c={c} />}

      {/* About – a deeper primer, distinct from the graph-card preview.
          detail.intro replaces the base copy entirely when present (the base
          ЧТО ЭТО / РОЛЬ already appeared in the inspector – don't repeat it). */}
      {(detail?.intro || NODE_INTEL[node.id] || NODE_ROLE[node.id]) && (
        <Block id="about" accent={c} kicker={t('КАК УСТРОЕНО ЭТО ЗВЕНО', 'HOW THIS LINK WORKS')}>
          {detail?.intro ? (
            <div style={{ fontSize: 14, color: 'var(--hm-text2)', lineHeight: 1.8 }}>
              <Paragraphs text={detail.intro} />
            </div>
          ) : (
            <>
              {NODE_INTEL[node.id] && <div style={{ fontSize: 14, color: 'var(--hm-text2)', lineHeight: 1.8, marginBottom: NODE_ROLE[node.id] ? 14 : 0 }}>{NODE_INTEL[node.id]}</div>}
              {NODE_ROLE[node.id] && <div style={{ fontSize: 14, color: 'var(--hm-text2)', lineHeight: 1.8 }}>{NODE_ROLE[node.id]}</div>}
            </>
          )}
        </Block>
      )}

      {detail?.mentalModel && <MentalModelBlock d={detail.mentalModel} c={c} />}
      {detail?.problems && <ProblemsBlock d={detail.problems} c={c} />}
      {(detail?.update || detail?.news?.length > 0) && <UpdateBlock d={detail.update || {}} c={c} news={detail.news} />}
      {detail?.marketSizing && <MarketSizingBlock d={detail.marketSizing} c={c} />}
      {detail?.valueCapture && <ValueCaptureBlock d={detail.valueCapture} c={c} />}
      {detail?.competition && <CompetitionBlock d={detail.competition} c={c} />}
      {detail?.moatBreakdown && <MoatBreakdownBlock d={detail.moatBreakdown} c={c} />}
      {detail?.demand && <DemandBlock d={detail.demand} c={c} />}
      {detail?.supply && <SupplyBlock d={detail.supply} c={c} />}
      {detail?.unitEconomics && <UnitEconBlock d={detail.unitEconomics} c={c} />}
      {detail?.roadmap && <RoadmapBlock d={detail.roadmap} c={c} />}
      {detail?.dependencies && <DependenciesBlock d={detail.dependencies} c={c} />}
      {detail?.risks?.length > 0 && <RiskMatrixBlock rows={detail.risks} c={c} />}
      {detail?.picks?.length > 0
        ? <PicksBlock groups={detail.picks} c={c} takeaway={detail.picksTakeaway} onJump={onJump} />
        : detail?.universe?.length > 0 && <UniverseBlock rows={detail.universe} c={c} />}
      {detail?.expectations && <ExpectationsBlock d={detail.expectations} c={c} />}
      {(detail?.scenarios || detail?.verdict?.bull || detail?.verdict?.bear) && <ScenariosBlock scenarios={detail.scenarios} bull={detail.verdict?.bull} bear={detail.verdict?.bear} c={c} />}
      {detail?.monitoring && <MonitoringBlock d={detail.monitoring} c={c} />}

      {/* Chain position */}
      {(upstream.length > 0 || downstream.length > 0) && (
        <Block id="chain" accent={c} kicker={t('ПОЛОЖЕНИЕ В ЦЕПОЧКЕ', 'POSITION IN THE CHAIN')}>
          {upstream.length > 0 && <div style={{ marginBottom: downstream.length > 0 ? 16 : 0 }}><div style={{ ...miniKicker, marginBottom: 9 }}>{t('↑ ОТКУДА ПРИХОДИТ', '↑ WHERE IT COMES FROM')}</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{upstream.map(u => <ChainPill key={u.id} node={u} onClick={() => onJump(u.id)} />)}</div></div>}
          {downstream.length > 0 && <div><div style={{ ...miniKicker, marginBottom: 9 }}>{t('↓ КУДА ИДЁТ ДАЛЬШЕ', '↓ WHERE IT GOES NEXT')}</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{downstream.map(dn => <ChainPill key={dn.id} node={dn} onClick={() => onJump(dn.id)} />)}</div></div>}
        </Block>
      )}

      {/* Base companies only when no investable-universe table */}
      {!detail?.universe?.length && !detail?.picks?.length && baseCompanies.length > 0 && (
        <Block id="players" accent={c} kicker={t('КЛЮЧЕВЫЕ ИГРОКИ', 'KEY PLAYERS')}>
          <div style={{ fontSize: 10.5, color: 'var(--hm-text5)', lineHeight: 1.55, marginBottom: 14 }}>{t('Заметные компании этого звена – как примеры, кто им занимается, а не список для покупки.', 'Notable companies in this link — as examples of who does the work, not a buy list.')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
            {baseCompanies.map((co, i) => (
              <div key={co.company + i} style={{ background: 'var(--hm-tile)', border: '1px solid var(--hm-border5)', borderLeft: `3px solid ${c}`, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, color: 'var(--hm-text)', fontWeight: 600 }}>{co.company}</div>
                <div style={{ fontSize: 10.5, color: 'var(--hm-text3)', fontFamily: 'ui-monospace,monospace', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>{co.ticker}</span><span style={{ color: 'var(--hm-rank)' }}>·</span>
                  <span style={{ color: co.ppr === 'Pub' ? '#10b981' : '#a78bfa' }}>{co.ppr === 'Pub' ? t('ПУБЛИЧНАЯ', 'PUBLIC') : t('ЧАСТНАЯ', 'PRIVATE')}</span>
                  <span style={{ color: 'var(--hm-rank)' }}>·</span><span>{co.geo}</span>
                </div>
                {co.note && <div style={{ fontSize: 11.5, color: 'var(--hm-text2)', lineHeight: 1.6, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--hm-border4)' }}>{co.note}</div>}
              </div>
            ))}
          </div>
        </Block>
      )}

      {/* Placeholder – only when node has no analytical data yet */}
      {!hasDeep && (
        <div style={{ background: 'repeating-linear-gradient(135deg, var(--hm-bg2), var(--hm-bg2) 12px, var(--hm-panel) 12px, var(--hm-panel) 24px)', border: `1px dashed color-mix(in srgb, ${c} 27%, transparent)`, borderRadius: 12, padding: '26px 28px' }}>
          <div style={{ fontSize: 9.5, color: c, fontFamily: 'ui-monospace,monospace', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 12 }}>{t('ПОЛНЫЙ РАЗБОР · В РАБОТЕ', 'FULL BREAKDOWN · IN PROGRESS')}</div>
          <div style={{ fontSize: 13.5, color: 'var(--hm-text2)', lineHeight: 1.7 }}>{t('Здесь появится инвест-разбор этого звена: размер рынка, конкуренция, спрос/предложение, юнит-экономика, риски, инвест-вселенная и вердикт.', 'The investment breakdown for this link will appear here: market size, competition, supply and demand, unit economics, risks, the investable universe and the verdict.')}</div>
        </div>
      )}
    </div>
  );
}
