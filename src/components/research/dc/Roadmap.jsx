// ══════════════════════════════════════════════════════════════════════════
// RESEARCH: DC AI — SUPPLY-CHAIN GRAPH
// Layered DAG of the AI infrastructure chain. Sub-sector nodes flow top
// (raw substrates) → bottom (AI applications) with curved edges showing
// what feeds what. Click a node → right-side inspector panel with the
// chain neighbours, thesis copy, and companies in coverage.
// ══════════════════════════════════════════════════════════════════════════
import React, { useMemo, useState } from 'react';
import dcCompaniesData from '../../../data/dc-companies.json';
import dcBucketsData from '../../../data/dc-buckets.json';

const DC_COMPANIES = dcCompaniesData;
const { DC_BUCKETS } = dcBucketsData;

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

// ─ Bucket short-codes — shown on every node for instant group recognition.
const BUCKET_TAGS = {
  'Power & Grid':             'PWR',
  'Compute & Silicon':        'CMP',
  'Materials & Chemicals':    'MAT',
  'Connectivity & Photonics': 'NET',
  'Construction & Labor':     'BLD',
  'Cooling & Thermal':        'CLD',
  'Fab & Test Equipment':     'FAB',
  'Software & Apps':          'APP',
};

// ─ Russian display names for buckets (keys stay English for data joins).
const BUCKET_RU = {
  'Power & Grid':             'Энергетика и сети',
  'Compute & Silicon':        'Чипы и вычисления',
  'Materials & Chemicals':    'Материалы и химия',
  'Connectivity & Photonics': 'Связь и фотоника',
  'Construction & Labor':     'Стройка и люди',
  'Cooling & Thermal':        'Охлаждение',
  'Fab & Test Equipment':     'Оборудование для чипов',
  'Software & Apps':          'Софт и приложения',
};

// ─ Russian plural: pick the right form for a count (1 узел / 2 узла / 5 узлов)
function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

// ─ Layer definitions ──────────────────────────────────────────────────────
const LAYERS = [
  { id: 'L1',  label: 'СЫРЬЁ',          caption: 'материалы · химия' },
  { id: 'L2',  label: 'ОБОРУДОВАНИЕ',   caption: 'станки · софт · тесты' },
  { id: 'L3',  label: 'ЧИПЫ',           caption: 'логика · силовые' },
  { id: 'L4',  label: 'СБОРКА',         caption: 'упаковка · платы' },
  { id: 'L5',  label: 'ГЕНЕРАЦИЯ',      caption: 'источники · топливо' },
  { id: 'L6',  label: 'ПЕРЕДАЧА ТОКА',  caption: 'сеть → стойка' },
  { id: 'L7',  label: 'СВЯЗЬ',          caption: 'передача данных' },
  { id: 'L8',  label: 'СТРОЙКА',        caption: 'инженерия · охлаждение' },
  { id: 'L9',  label: 'ВЫЧИСЛЕНИЯ',     caption: 'стойка' },
  { id: 'L10', label: 'РЕЗУЛЬТАТ',      caption: 'модели · ИИ для бизнеса' },
];

// ─ Nodes (sub-sectors) ────────────────────────────────────────────────────
// `sector` matches DC_COMPANIES[].sector so the inspector can filter.
// `bucket` matches a key in DC_BUCKETS for colour + parent grouping.
const NODES_RAW = [
  // L1 — Raw Inputs
  { id: 'goes',        label: 'Электросталь',     sector: 'GOES Steel',     bucket: 'Materials & Chemicals',    layer: 0 },
  { id: 'resist',      label: 'Фоторезист',       sector: 'Photoresist',    bucket: 'Materials & Chemicals',    layer: 0 },
  { id: 'chem',        label: 'Химия для чипов',  sector: 'Specialty Chem', bucket: 'Materials & Chemicals',    layer: 0 },
  { id: 'inpgaas',     label: 'InP / GaAs',       sector: 'InP/GaAs',       bucket: 'Materials & Chemicals',    layer: 0 },
  { id: 'titanium',    label: 'Титановые сплавы', sector: 'Titanium',       bucket: 'Materials & Chemicals',    layer: 0 },

  // L2 — Equipment & Design
  { id: 'litho',       label: 'Станки для чипов', sector: 'Litho Tools',    bucket: 'Fab & Test Equipment',     layer: 1 },
  { id: 'test',        label: 'Тестирование',     sector: 'Test',           bucket: 'Fab & Test Equipment',     layer: 1 },
  { id: 'eda',         label: 'Софт для чипов',   sector: 'EDA',            bucket: 'Compute & Silicon',        layer: 1 },
  { id: 'ip',          label: 'Лицензии / склейка', sector: 'IP/Bonding',   bucket: 'Compute & Silicon',        layer: 1 },

  // L3 — Chips
  { id: 'silicon',     label: 'AI-чипы',          sector: 'AI Silicon',     bucket: 'Compute & Silicon',        layer: 2 },
  { id: 'wbg',         label: 'Силовые чипы',     sector: 'Wide-Bandgap',   bucket: 'Compute & Silicon',        layer: 2 },

  // L4 — Assembly
  { id: 'pkg',         label: 'Упаковка чипов',   sector: 'Adv Packaging',  bucket: 'Compute & Silicon',        layer: 3 },
  { id: 'pcb',         label: 'Платы / подложки', sector: 'PCB',            bucket: 'Compute & Silicon',        layer: 3 },

  // L5 — Power Origin
  { id: 'nuc',         label: 'Атомная энергия',  sector: 'Nuclear/SMR',    bucket: 'Power & Grid',             layer: 4 },
  { id: 'smr',         label: 'Малые реакторы',   sector: 'SMR',            bucket: 'Power & Grid',             layer: 4 },
  { id: 'fuel',        label: 'Топливные элементы', sector: 'Fuel Cells',   bucket: 'Power & Grid',             layer: 4 },
  { id: 'gaspipe',     label: 'Газопроводы',      sector: 'Gas Pipelines',  bucket: 'Power & Grid',             layer: 4 },
  { id: 'gasturbines', label: 'Газовые турбины',  sector: 'Gas Turbines',   bucket: 'Power & Grid',             layer: 4 },

  // L6 — Power Delivery
  { id: 'power',       label: 'Электроэнергия',   sector: 'Power',          bucket: 'Power & Grid',             layer: 5 },
  { id: 'transformers', label: 'Трансформаторы',  sector: 'Transformers',   bucket: 'Power & Grid',             layer: 5 },
  { id: 'switchgear',  label: 'Электрощиты',      sector: 'Switchgear',     bucket: 'Power & Grid',             layer: 5 },
  { id: 'pmgmt',       label: 'Питание стоек',    sector: 'Power Mgmt',     bucket: 'Power & Grid',             layer: 5 },

  // L7 — Interconnect
  { id: 'photonics',   label: 'Фотоника',         sector: 'Photonics',      bucket: 'Connectivity & Photonics', layer: 6 },
  { id: 'darkfiber',   label: 'Тёмное волокно',   sector: 'Dark Fiber',     bucket: 'Connectivity & Photonics', layer: 6 },
  { id: 'fiber',       label: 'Оптоволокно',      sector: 'Fiber/Cable',    bucket: 'Connectivity & Photonics', layer: 6 },

  // L8 — Site Buildout
  { id: 'liquid',      label: 'Охлаждение',       sector: 'Liquid Cooling', bucket: 'Cooling & Thermal',        layer: 7 },
  { id: 'mep',         label: 'Инженерные системы', sector: 'MEP',          bucket: 'Construction & Labor',     layer: 7 },
  { id: 'contracting', label: 'Строительство',    sector: 'Contracting',    bucket: 'Construction & Labor',     layer: 7 },

  // L9 — Compute Convergence
  { id: 'rack',        label: 'AI-ВЫЧИСЛЕНИЯ',    sector: 'AI Compute Infra', bucket: 'Compute & Silicon',      layer: 8, big: true, secondarySector: 'AI Compute Infra (pivot)' },

  // L10 — Output
  { id: 'lab',         label: 'AI-лаборатории',   sector: 'Frontier Lab',   bucket: 'Compute & Silicon',        layer: 9 },
  { id: 'apps',        label: 'Внедрение ИИ',     sector: 'AI Apps',        bucket: 'Software & Apps',          layer: 9 },
];

// ─ Node intel — plain-Russian "what is this" per sub-sector ────────────────
// Simple, low-jargon definition: what the thing physically is and where it's
// used next. Keeps the reader oriented before the deeper РОЛЬ block. Keyed by
// node id.
const NODE_INTEL = {
  goes: 'Особая электротехническая сталь, из которой делают «сердце» силового трансформатора. Её зёрна выстроены в одну сторону, поэтому она проводит магнитное поле почти без потерь энергии. Проще говоря: нет такой стали — нет трансформатора, а без трансформатора не запитать дата-центр.',

  resist: 'Светочувствительная жидкость, которой покрывают кремниевую пластину перед «печатью» микросхемы. Свет проявляет на ней рисунок будущего чипа — примерно как раньше проявляли фотоплёнку. Наносят её заново на каждый слой, поэтому расходуется постоянно и в больших объёмах.',

  chem: 'Сверхчистые газы, кислоты и полировальные жидкости, которыми на заводе травят, промывают и полируют кремниевую пластину. Чистота нужна фантастическая — лишняя пылинка убивает чип. Это «расходники» производства: чем больше выпускают чипов, тем больше их нужно.',

  inpgaas: 'Особые пластины-подложки (из фосфида индия и арсенида галлия) — «умный» аналог обычного кремния, который умеет излучать и ловить свет. Из них делают лазеры и приёмники для оптики, которой дата-центры гоняют данные между серверами. Пластины маленькие, дорогие и редкие.',

  titanium: 'Особо прочные и жаростойкие сплавы титана. Из них делают самую горячую часть газовых турбин — ту, что раскаляется и вращается. Такие турбины всё чаще ставят прямо у дата-центров, чтобы вырабатывать своё электричество.',

  litho: 'Станки, которые физически делают чип: одни «печатают» рисунок транзисторов светом, другие наращивают и вытравливают тончайшие слои, третьи ищут дефекты. Это «кирки и лопаты» всей индустрии — без них не работает ни один завод чипов. Самые сложные и дорогие машины в мире.',

  test: 'Оборудование, которое проверяет чип, прежде чем он уедет в сервер: гоняет его на скорости и «прожаривает» под нагрузкой, отсеивая брак. Для дорогих AI-чипов цена пропущенной ошибки огромна. Поэтому проверяют всё строже.',

  eda: 'Программы, в которых инженеры проектируют микросхему — от общей схемы до раскладки миллиардов транзисторов. Без них современный чип просто не нарисовать. По сути — «чертёжный софт», без которого чип-компании не могут работать.',

  ip: 'Готовые «кубики» схем, которые лицензируют, чтобы не проектировать чип с нуля, плюс технология склеивать кристаллы напрямую, без припоя. На этой склейке держится современная AI-память (HBM) и «многоэтажные» 3D-чипы. Бизнес — брать роялти с каждого выпущенного чипа.',

  silicon: 'Сами вычислительные чипы для ИИ — те самые GPU и ускорители, которые «думают» за нейросети. Это сердце всей стройки: вокруг них собирают сервер, стойку и весь дата-центр. Проектируют их единицы компаний, а физически делает почти только TSMC.',

  wbg: 'Особые силовые чипы (на карбиде кремния и нитриде галлия), которые управляют электричеством эффективнее обычных. Они меньше греются и держат большее напряжение, поэтому из них делают экономичные блоки питания в стойках. Чем прожорливее AI-чипы, тем они нужнее.',

  pkg: 'Финальная сборка чипа: вычислительный кристалл и блоки памяти упаковывают в один корпус так, чтобы они работали как единое целое. Именно здесь, а не в самом транзисторе, сегодня главная пробка — без этой упаковки AI-чип и его память не соединить. Очередь на мощности расписана на годы.',

  pcb: 'Платы и подложки, на которых физически стоит чип и через которые идут тысячи его контактов. Для AI-ускорителей это платы безумной сложности — десятки слоёв с микронной точностью. Их дефицит не раз тормозил выпуск видеокарт.',

  nuc: 'Большие атомные станции как источник стабильного электричества для дата-центров — круглосуточно и без зависимости от погоды. Крупные IT-компании уже выкупают выработку действующих АЭС целиком. Строить новые долго, поэтому в ход идут существующие.',

  smr: 'Маленькие атомные реакторы заводской сборки, которые можно поставить прямо рядом с дата-центром. Идея — получить атомную энергию быстрее и дешевле большой АЭС. Технология пока в основном на бумаге и в первых проектах, так что это ставка на будущее.',

  fuel: 'Установки, которые получают электричество из газа или водорода без сжигания и без турбины — тихо и чисто. Их ставят прямо на площадке, чтобы получить мощность и не ждать годами подключения к сети. Минус — топливо дороже сетевого тока.',

  gaspipe: 'Трубопроводы, по которым природный газ доходит до электростанций возле дата-центров. Когда сеть перегружена, газ — самый быстрый способ получить много энергии, но его надо физически подвести. В итоге всё упирается в пропускную способность труб.',

  gasturbines: 'Турбины, которые сжигают газ и вырабатывают электричество — самый быстрый способ дать дата-центру много мощности прямо на месте, не дожидаясь сети. Спрос вырос так, что очередь на большие турбины растянулась на годы. Делают их в мире буквально несколько компаний.',

  power: 'Само электричество как товар: компании, которые его вырабатывают и продают дата-центрам вместе с подключением к сети. Сегодня энергия — дефицитнее чипов: очередь на подключение местами превышает 8 лет. Кто контролирует доступ к мощности, тот задаёт темп всей стройке.',

  transformers: 'Устройство, которое меняет напряжение, чтобы ток из высоковольтной линии можно было безопасно подать на оборудование дата-центра. Без него электричество из сети просто не довести до серверов. Внутри у него — та самая электротехническая сталь GOES.',

  switchgear: 'Электрощиты дата-центра: набор мощных выключателей и защит, который распределяет ток по объекту и мгновенно отключает участок при аварии. От него зависит, переживёт ли площадка короткое замыкание без потери всего. Спрос и сроки поставки выросли вслед за трансформаторами.',

  pmgmt: 'Электроника, которая доводит и тонко раздаёт питание уже внутри стойки и сервера — до нужного напряжения на каждый чип. Чем прожорливее AI-ускорители, тем сложнее и дороже эта «последняя миля» электричества.',

  photonics: 'Технология передавать данные светом вместо электрических сигналов по меди. Оптика связывает серверы между собой, а самая новая её версия (CPO) ставит источник света вплотную к чипу — потому что медь уже не тянет нужные скорости. Следующий большой сдвиг в устройстве AI-кластеров.',

  darkfiber: 'Уже проложенное, но пока не используемое оптоволокно, которое сдают в аренду на десятилетия. IT-гигантам оно нужно, чтобы соединять свои дата-центры между городами собственными «частными» линиями. Ценность — в физически проложенном кабеле, которого не хватает на нужных маршрутах.',

  fiber: 'Само оптоволокно и кабели, включая подводные между континентами, — по ним идёт весь дальний интернет-трафик. Стройка ИИ резко подняла спрос на новые линии. Производить волокно и укладывать подводные кабели умеет узкий круг компаний.',

  liquid: 'Охлаждение чипов жидкостью вместо воздуха. Новые AI-стойки выделяют столько тепла (120+ кВт), что воздух физически не справляется — жидкость стала обязательной. Nvidia уже проектирует технику сразу под жидкостное охлаждение.',

  mep: 'Инженерная «начинка» здания дата-центра: охлаждение, разводка питания, вентиляция, трубы. Это до половины стоимости всей стройки и самая дефицитная по рабочим рукам часть. Подрядчики так загружены, что уже отказываются от заказов.',

  contracting: 'Компании, которые физически строят кампус и подводят к нему электросети: земля, здания, ЛЭП, подстанции, монтаж. Главный дефицит тут не деньги, а бригады: на пике стройки кампуса на 1 ГВт нужно 3–4 тысячи электриков. Кто умеет их собрать, тот и держит сроки.',

  rack: 'Точка, где всё собирается вместе: чипы, память, питание и охлаждение превращаются в готовую AI-стойку и кластер, которые сдают в аренду под обучение моделей. Здесь физическая цепочка становится вычислительной мощностью, которую продают по часам. Сюда же входят новые GPU-операторы, выросшие на дефиците чипов.',

  lab: 'Компании, которые обучают сами передовые нейросети, — конечный потребитель всей этой инфраструктуры. Ради них строится весь стек: они сжигают гигаватты энергии и миллиарды долларов на обучение. Ставка дорогая и рискованная — кто победит, пока не ясно.',

  apps: 'Софт, который встраивает нейросети в реальную работу компаний и превращает ответы модели в деньги. Именно здесь в итоге окупаются триллионы, вложенные в стройку. Пока «железо» дорожает, ценность смещается к тем, кто умеет продать ИИ бизнесу.',
};

// ─ Node role — deeper "why this matters in the whole chain" per sub-sector ─
// Zooms out from the definition: the layer's position in the full supply
// chain, where the bottleneck is, who holds the power and why. Plain Russian.
const NODE_ROLE = {
  goes: 'Это самое начало энергетической ветки цепочки: отсюда сталь идёт в трансформаторы, а дальше — на подстанции и в дата-центр. Загвоздка в том, что варить такую сталь умеют единицы заводов в мире, а в Северной Америке — вообще один, Cleveland-Cliffs. Спрос на трансформаторы взлетел из-за ИИ, но быстро нарастить выпуск стали нельзя: новую линию строят годами. Поэтому скучный на вид материал превратился в один из самых дефицитных узлов всей стройки — тот, кто его контролирует, держит вход в энергоцепочку.',

  resist: 'Без резиста не сделать ни один чип, а значит и ни один AI-ускоритель, — это обязательный расходник в самом начале производства. Загвоздка здесь не в объёме, а в качестве: для тончайших техпроцессов (EUV) нужна почти идеально чистая химия, которую освоили лишь несколько японских компаний. Это даёт им устойчивое, почти монопольное положение — заменить поставщика крайне тяжело, а спрос растёт с каждым новым поколением чипов. Классический «тихий» лидер, от которого зависит вся дальнейшая цепочка кремния.',

  chem: 'Это невидимый, но обязательный вход в производство чипов: без чистой химии не сделать ни один кремниевый кристалл. Расход растёт вместе с каждым новым заводом и каждым поколением чипов, а требования к чистоте настолько жёсткие, что квалифицироваться в поставщики очень тяжело. Поэтому рынок поделён между несколькими специалистами — Entegris в материалах, Shin-Etsu в химии и пластинах. Тихий стабильный бизнес-«расходник» в самом начале цепочки кремния.',

  inpgaas: 'Это фундамент оптической связи: без этих подложек не сделать лазеры и приёмники, а без них дата-центры не соединить на нужных скоростях. Главная сложность — сам материал: кристаллы растут медленно, пластины маленькие и дорогие, а умеют это единицы компаний. По мере перехода на оптику (CPO) спрос на них только растёт. Вверх по цепочке это сырьё, вниз оно идёт в фотонику и AI-силикон.',

  titanium: 'Этот узел связывает металлургию с энергетикой стройки: без жаропрочного титана не сделать газовую турбину, а турбины сейчас — самый быстрый способ дать дата-центру энергию. Металл авиакосмического класса: длинная сертификация и узкий круг поставщиков создают естественный барьер. Спрос тянут сразу и авиация, и энергетика, поэтому мощности в дефиците. Лидеры — Carpenter и ATI, специалисты по высокотехнологичным сплавам.',

  litho: 'Через этот узел проходит вся индустрия: любой чип в мире сделан на этих машинах. Рынок — жёсткая олигополия, где у каждого своя незаменимая ниша: ASML монопольно делает EUV-литографы (по ~$200 млн каждый), Applied Materials и Lam — осаждение и травление, KLA — контроль дефектов. Заменить их нечем, а спрос растёт с каждым новым заводом. Одна из самых защищённых позиций во всей цепочке.',

  test: 'Это последний фильтр перед тем, как дорогой AI-чип попадёт в сервер: тестирование ловит брак, который иначе всплыл бы уже у клиента. Чем дороже и сложнее чипы, тем важнее этот этап — и тем больше на нём зарабатывают. Рынок держат несколько специалистов: Teradyne и Advantest в тестерах, AEHR в «прожарке». Спрос тянет вверх переход на новые типы чипов и память.',

  eda: 'Это скрытый фундамент всей отрасли: ни один современный чип нельзя спроектировать без этого софта. Рынок — крепкая дуополия Synopsys и Cadence: их инструментами пользуется буквально каждая чип-компания, а переход на другого поставщика почти невозможен. Это даёт им редкое сочетание — устойчивый доход и рост вместе со всем рынком чипов. Одна из самых «липких» и защищённых позиций в цепочке.',

  ip: 'Это узел, который берёт понемногу с каждого выпущенного чипа, ничего не производя физически. Особенно важна технология склейки кристаллов (hybrid bonding) — без неё не собрать современную AI-память HBM. Контроль над ключевыми патентами и блоками даёт устойчивые роялти и сильную переговорную позицию. Лидеры — Arm в лицензиях, Adeia в патентах, BESI и ASMPT в оборудовании для склейки.',

  silicon: 'Это центр тяжести всей стройки — самый ценный и самый конкурентный узел цепочки. Проектируют такие чипы единицы (Nvidia, AMD, Broadcom), но почти все зависят от одного завода — TSMC, который их физически делает. Поэтому реальная власть здесь делится между теми, кто владеет архитектурой, и теми, кто владеет производством. Вверх узел тянет химию, пластины и оборудование, вниз — упаковку, платы и всю стойку.',

  wbg: 'Это узел, который делает энергосистему дата-центра эффективной: чем прожорливее AI-чипы, тем дороже обходятся потери на преобразовании тока и тем ценнее эти полупроводники. Пока это скорее растущая ниша, чем пробка, но её значение увеличивается с каждым поколением стоек. Рынок делят Wolfspeed (карбид кремния), Infineon и onsemi. Материал сложен в производстве, что ограничивает круг игроков.',

  pkg: 'Это сегодняшняя главная пробка в производстве чипов: ограничение переехало из транзистора в упаковку. Без неё вычислительный кристалл не соединить с памятью на нужной скорости, поэтому именно упаковка ограничивает выпуск AI-чипов. Мощности TSMC по этой технологии (CoWoS) расписаны на годы вперёд. Оборудование делают несколько специалистов — BESI, ASMPT, Camtek, а саму сборку — TSMC, ASE, Amkor.',

  pcb: 'Этот узел не раз оказывался неожиданной пробкой: без сложных подложек нельзя выпустить готовый ускоритель, сколько бы ни было чипов. Самые продвинутые (ABF-подложки) умеют делать единицы заводов, почти все — в Азии. Спрос растёт быстрее, чем строятся новые линии, поэтому дефицит периодически возвращается. Лидеры — Ibiden и Unimicron в подложках, TTM в платах.',

  nuc: 'Это про доступ к «чистым гигаваттам»: атомная станция даёт стабильную энергию, которую не могут дать ветер и солнце. Поскольку строить новые АЭС долго, ценность смещается к действующим блокам — и тот, кто законтрактовал их выработку, получает преимущество. Ограничение здесь — не технология, а само наличие мощности, которую можно подключить. Ключевой игрок в топливе и обслуживании реакторов — BWX Technologies.',

  smr: 'Это ставка на то, как дата-центры будут питаться через 5–10 лет: компактный реактор рядом с площадкой снял бы зависимость от перегруженной сети. Пока это в основном обещание — проекты проходят лицензирование, первые энергоблоки только строятся. Поэтому узел скорее про потенциал и риск, чем про сегодняшнюю мощность. Заметные имена — Oklo и NuScale, а BWXT делает для них компоненты.',

  fuel: 'Это способ получить электричество «здесь и сейчас», в обход очереди на подключение к сети — что в условиях дефицита мощности крайне ценно. Технически узел зрелый, но экономику ограничивает цена топлива. Поэтому его берут как быстрый мост, пока нет полноценного подключения. Рынок для дата-центров практически олицетворяет одна компания — Bloom Energy.',

  gaspipe: 'Это тихая, но реальная преграда в энергоснабжении: газовая турбина бесполезна, если к ней не подведён газ. Права на подключение и свободная пропускная способность труб становятся дефицитным ресурсом там, где строят кампусы. Бизнес устойчивый — плата за транспортировку газа мало зависит от его цены. Крупный игрок с обширной сетью — Energy Transfer.',

  gasturbines: 'Это тот узел, где стройка упирается в физику генерации: турбина — самый быстрый способ дать кампусу сотни мегаватт прямо на месте. Спрос так обогнал производство, что очередь на большие турбины расписана на несколько лет вперёд. Делают их в мире буквально трое — GE Vernova, Siemens Energy и Mitsubishi, — отсюда огромная ценовая власть. Вверх узел держится на жаропрочном титане, вниз питает всю электрическую цепочку.',

  power: 'Это, возможно, самый жёсткий барьер всей темы: сегодня дефицитнее чипов оказалось само электричество. Очередь на подключение к сети местами превышает 8 лет, поэтому тот, кто владеет генерацией и доступом к мощности, диктует, где и когда вообще можно построить дата-центр. Это смещает власть от IT-компаний к энергетике. Крупнейший бенефициар по оборудованию и генерации — GE Vernova.',

  switchgear: 'Это звено идёт сразу за трансформаторами и упирается в те же ограничения: спрос обогнал производство, сроки поставки растянулись. Без распределительных щитов площадку не запустить и не защитить от аварий, поэтому это тоже критический путь стройки. Рынок держат несколько крупных электротехнических компаний — Eaton, Schneider, ABB, а также нишевый Powell. Ценовая власть у производителей выросла вслед за дефицитом.',

  pmgmt: 'Это «последняя миля» электричества — там, где рост энергопотребления AI-чипов бьёт больнее всего: потери и тепло надо убирать у самого кристалла. Чем плотнее стойки, тем сложнее и дороже эта электроника и тем ценнее те, кто умеет её делать. Здесь всё чаще применяют широкозонные полупроводники ради КПД. Лидеры — Eaton на уровне стойки, Monolithic Power и Infineon на уровне чипа.',

  photonics: 'Это следующий крупный сдвиг в устройстве AI-кластеров: медь упёрлась в предел, и связь между чипами переходит на свет. Кто первым доведёт оптику вплотную к чипу (CPO), тот получит преимущество в скорости и энергоэффективности всего кластера. Пока технология на раннем этапе, ставки высоки и для гигантов, и для стартапов. Игроки — Coherent и Lumentum в «железе», Marvell в чипах, Ayar Labs и Lightmatter на переднем крае.',

  darkfiber: 'Это узел про «частные магистрали» IT-гигантов: чтобы связать дата-центры между городами, им нужны собственные оптические линии с гарантированной пропускной способностью. Ценность — в уже проложенном кабеле на нужных маршрутах, которого физически не хватает. Поэтому владельцы волокна получают долгие контракты на десятилетия вперёд. Крупные держатели сетей — Lumen, Uniti, Zayo.',

  fiber: 'Это фундамент дальней связи: без волокна и подводных кабелей нет межрегионального трафика, на котором работают распределённые дата-центры. Стройка ИИ резко подняла спрос, а производить волокно и укладывать подводные линии умеет узкий круг компаний — отсюда многолетние очереди. Это делает узел устойчивым и защищённым. Лидеры — Prysmian и Corning, а также Fabrinet в сборке оптики.',

  liquid: 'Это уже не опция, а необходимость: новые AI-стойки греются так, что воздух физически не справляется, и переход на жидкость стал вынужденным. Значит, спрос здесь не зависит от настроения рынка — он привязан к каждой новой стойке Nvidia. Кто задаёт стандарт охлаждения, тот встроен в каждый крупный дата-центр. Явный лидер — Vertiv, рядом nVent и специалисты по компонентам.',

  mep: 'Это узел, где стройка упирается не в деньги, а в людей: инженерных бригад физически не хватает под темп ИИ. Поэтому подрядчики получили редкую для строительства вещь — устойчивую ценовую власть и возможность выбирать заказы. Это делает бизнес неожиданно прибыльным и предсказуемым. Лидеры — Comfort Systems и EMCOR, крупнейшие механические подрядчики США.',

  contracting: 'Это физический предел скорости всей стройки: кампус нельзя построить быстрее, чем найдутся бригады и подведутся сети. Дефицит квалифицированных электриков и монтажников превращает генподрядчиков в дефицитный ресурс с растущими ценами. Особенно ценны те, кто умеет тянуть ЛЭП и подстанции — там же, где пробка с подключением. Лидеры — Quanta и MasTec в сетевом строительстве, EMCOR в инженерке.',

  rack: 'Это точка схождения всей цепочки: сюда стекается всё — чипы, память, платы, питание, охлаждение — и превращается в готовую вычислительную мощность. Здесь физический стек становится деньгами: мощность сдают по часам под обучение моделей. Новый класс игроков (neocloud) вырос именно на дефиците доступа к чипам. Имена — CoreWeave, Nebius, Lambda, Crusoe, IREN.',

  lab: 'Это конечный спрос, ради которого построена вся пирамида: передовые лаборатории сжигают гигаватты и миллиарды, обучая модели. Их аппетит и задаёт масштаб всей стройки снизу доверху. Но сама позиция крайне рискованная: расходы огромны, а кто выйдет победителем — не ясно, и ставка может не окупиться. Имена — OpenAI, Anthropic, xAI, Mistral.',

  apps: 'Это тот конец цепочки, где всё в итоге должно окупиться: пока стек снизу дорожает, деньги приходят от компаний, которые встраивают ИИ в свою работу. Ценность смещается к тем, кто умеет превратить возможности модели в реальную выручку клиента. Это самый «денежный» слой, но и самый конкурентный. Лидер интеграции в корпоративный софт — ServiceNow.',
};

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

  // L2 → L3 / L4
  ['litho',        'silicon'],
  ['litho',        'wbg'],
  ['litho',        'pkg'],
  ['test',         'silicon'],
  ['test',         'pkg'],
  ['test',         'wbg'],
  ['eda',          'silicon'],
  ['eda',          'pkg'],
  ['ip',           'pkg'],

  // L3 → L4 / power / compute
  ['silicon',      'pkg'],
  ['silicon',      'pcb'],
  ['silicon',      'rack'],
  ['wbg',          'pmgmt'],
  ['wbg',          'switchgear'],

  // L4 → Compute
  ['pkg',          'rack'],
  ['pcb',          'rack'],

  // L5 → L6
  ['gaspipe',      'gasturbines'],
  ['gasturbines',  'power'],
  ['nuc',          'power'],
  ['smr',          'power'],
  ['fuel',         'power'],

  // L6
  ['power',        'transformers'],
  ['transformers', 'switchgear'],
  ['switchgear',   'pmgmt'],
  ['pmgmt',        'rack'],

  // L7 → Compute
  ['photonics',    'rack'],
  ['darkfiber',    'rack'],
  ['fiber',        'rack'],

  // L8 → Compute
  ['contracting',  'mep'],
  ['mep',          'rack'],
  ['liquid',       'rack'],

  // L9 → L10
  ['rack',         'lab'],
  ['rack',         'apps'],
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
      result[n.id] = { ...n, x, y, w, h, cx: x, cy: y, topY: y - h/2, bottomY: y + h/2 };
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
export default function Roadmap() {
  const [selected, setSelected] = useState(null);
  const [hovered,  setHovered]  = useState(null);
  const [bucketFilter, setBucketFilter] = useState(null);

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

  const totalCompanies = DC_COMPANIES.length;

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
          AI-ИНФРАСТРУКТУРА · ЦЕПОЧКА ПОСТАВОК
        </div>
        <div style={{
          fontSize: 30, color: '#fafafa', fontWeight: 700,
          letterSpacing: '-0.02em', lineHeight: 1.15,
          margin: '0 auto 12px', maxWidth: 780,
        }}>
          От <span style={{ color: '#f59e0b' }}>самого сырья</span> до{' '}
          <span style={{ color: '#ec4899' }}>готового ИИ для бизнеса</span>.
        </div>
        <div style={{
          fontSize: 13.5, color: '#a1a1aa', lineHeight: 1.65,
          maxWidth: 640, margin: '0 auto',
        }}>
          {Object.keys(NODES).length} {plural(Object.keys(NODES).length, 'звено', 'звена', 'звеньев')} ·{' '}
          {EDGES_RAW.length} {plural(EDGES_RAW.length, 'связь', 'связи', 'связей')} ·{' '}
          {totalCompanies} {plural(totalCompanies, 'компания', 'компании', 'компаний')} · нажмите на узел, чтобы открыть карточку.
        </div>
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
                background: 'linear-gradient(to right, transparent, rgba(63,63,70,0.35), transparent)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', left: 0, top: y - 18, width: PAD_X_LEFT - 28,
                textAlign: 'right', pointerEvents: 'none',
              }}>
                <div style={{
                  fontSize: 9, color: '#52525b',
                  fontFamily: 'ui-monospace,monospace',
                  letterSpacing: '0.16em', fontWeight: 700,
                }}>
                  {String(i + 1).padStart(2, '0')} · {L.label}
                </div>
                <div style={{
                  fontSize: 9, color: '#3f3f46',
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
            const stroke = bucketDef?.color || '#52525b';

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
            const c = bucket?.color || '#52525b';
            const tag = BUCKET_TAGS[n.bucket] || '';
            const companyCount = DC_COMPANIES.filter(co =>
              co.sector === n.sector ||
              (n.secondarySector && co.sector === n.secondarySector)).length;

            // Tint strengths step up by state. Base nodes get a soft tinted
            // background so same-bucket nodes pop as a group at a glance.
            const baseTint   = isSelected ? '2e' : isHovered ? '1f' : '14';
            const baseBorder = isSelected ? c          : isHovered ? c + 'cc' : c + '66';
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
                  background: `linear-gradient(135deg, ${c}${baseTint} 0%, #18181b 80%)`,
                  border: `1px solid ${baseBorder}`,
                  borderRadius: n.big ? 11 : 9,
                  padding: `0 10px 0 ${stripeW + 9}px`,
                  cursor: 'pointer',
                  opacity: isLive ? 1 : 0.20,
                  transform: isSelected ? 'scale(1.06)' : isHovered ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: isSelected
                    ? `0 0 0 4px ${c}33, 0 10px 28px rgba(0,0,0,0.55), inset 0 0 0 1px ${c}55`
                    : isHovered
                      ? `0 6px 20px ${c}55`
                      : `0 2px 8px rgba(0,0,0,0.35)`,
                  display: 'flex', alignItems: 'center', gap: 10,
                  color: '#fafafa', font: 'inherit', textAlign: 'left',
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
                  boxShadow: `${stripeW}px 0 12px ${c}66`,
                  transition: 'width 200ms',
                }} />

                {/* Label + count */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{
                    fontSize: n.big ? 13 : 11.5,
                    fontWeight: n.big ? 700 : 600,
                    color: '#fafafa',
                    lineHeight: 1.15,
                    letterSpacing: n.big ? '0.04em' : '0',
                    textTransform: n.big ? 'uppercase' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {n.label}
                  </div>
                  {companyCount > 0 && (
                    <div style={{
                      fontSize: 9, color: '#a1a1aa',
                      fontFamily: 'ui-monospace,monospace',
                      letterSpacing: '0.05em', marginTop: 2,
                    }}>
                      {companyCount} {plural(companyCount, 'компания', 'компании', 'компаний')}
                    </div>
                  )}
                </div>

                {/* Bucket monogram — small chip on the right */}
                <div style={{
                  fontSize: 8.5, fontWeight: 800,
                  fontFamily: 'ui-monospace,monospace',
                  letterSpacing: '0.08em',
                  color: c,
                  background: `${c}22`,
                  border: `1px solid ${c}55`,
                  padding: '2px 5px',
                  borderRadius: 3,
                  lineHeight: 1,
                  flexShrink: 0,
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

        {/* Inspector — slides in over the right side, no backdrop dim */}
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
          />
        )}

      </div>

      {/* Legend — clickable bucket filter */}
      <div style={{
        margin: '40px auto 8px', maxWidth: CANVAS_W,
        padding: '14px 18px',
        background: '#0d0d0e',
        border: '1px solid #27272a',
        borderRadius: 10,
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 9.5, color: '#71717a',
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.16em', fontWeight: 700, marginRight: 4,
        }}>
          ФИЛЬТР ПО ГРУППАМ
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
                background: active ? `${def.color}22` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? def.color : def.color + '40'}`,
                borderRadius: 999,
                cursor: 'pointer',
                opacity: dim ? 0.45 : 1,
                color: '#fafafa', font: 'inherit',
                transition: 'all 160ms',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${def.color}14`; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <span style={{
                width: 9, height: 9, borderRadius: '50%',
                background: def.color,
                boxShadow: `0 0 8px ${def.color}88`,
              }} />
              <span style={{ fontSize: 11, color: '#e4e4e7', fontWeight: active ? 700 : 500 }}>
                {BUCKET_RU[name] || name}
              </span>
              <span style={{
                fontSize: 8.5, fontWeight: 800,
                fontFamily: 'ui-monospace,monospace',
                letterSpacing: '0.08em',
                color: def.color,
                background: `${def.color}22`,
                border: `1px solid ${def.color}55`,
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
              border: '1px solid #3f3f46',
              borderRadius: 999,
              fontSize: 10.5, color: '#a1a1aa',
              fontFamily: 'ui-monospace,monospace',
              letterSpacing: '0.08em', fontWeight: 700,
              cursor: 'pointer', font: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fafafa'}
            onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}
          >
            СБРОС
          </button>
        )}
      </div>

    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Inspector panel — slides in from the right of the canvas.
// Redesigned: bucket-tinted header, compact chain-position widget,
// chain neighbour chips, then companies grouped by conviction.
// ──────────────────────────────────────────────────────────────────────────
function InspectorPanel({ node, layer, layerIdx, totalLayers, bucket, companies, upstream, downstream, onClose, onJump }) {
  const c = bucket?.color || '#a1a1aa';

  // Sort companies by conviction tier so the strongest names come first.
  const order = { 'High': 0, 'Med-High': 1, 'Medium': 2, 'Low-Med': 3, 'Low': 4 };
  const sortedCompanies = [...companies].sort(
    (a, b) => (order[a.conviction] ?? 9) - (order[b.conviction] ?? 9));

  return (
    <div style={{
      position: 'absolute',
      top: 0, right: 0, bottom: 0,
      width: 400, maxWidth: '92%',
      background: 'rgba(10,10,11,0.97)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      borderLeft: `1px solid ${c}55`,
      boxShadow: `-32px 0 60px rgba(0,0,0,0.65), -1px 0 0 ${c}33`,
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

      {/* Header — bucket-tinted */}
      <div style={{
        padding: '22px 24px 20px',
        background: `linear-gradient(180deg, ${c}1a 0%, transparent 100%)`,
        borderBottom: `1px solid ${c}26`,
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${c}55`,
            color: '#fafafa', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: 'inherit', transition: 'all 140ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = c + '33'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >×</button>

        <div style={{
          fontSize: 9.5, color: c,
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.18em', fontWeight: 700,
          marginBottom: 6,
        }}>
          ЭТАП {String(layerIdx + 1).padStart(2, '0')} / {String(totalLayers).padStart(2, '0')} · {layer.label}
        </div>

        <div style={{
          fontSize: 22, color: '#fafafa', fontWeight: 700,
          letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 4,
        }}>
          {node.label}
        </div>
        <div style={{
          fontSize: 11.5, color: '#a1a1aa',
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.04em',
        }}>
          {BUCKET_RU[node.bucket] || node.bucket} · {companies.length} {plural(companies.length, 'компания', 'компании', 'компаний')}
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
              background: i === layerIdx ? c : i < layerIdx ? `${c}55` : '#1f1f23',
              transition: 'background 160ms',
            }} />
          ))}
        </div>
      </div>

      {/* What is this — plain-Russian context for the sub-sector */}
      {NODE_INTEL[node.id] && (
        <div style={{
          padding: '18px 24px 16px',
          borderBottom: '1px solid #18181b',
        }}>
          <div style={{
            fontSize: 9, color: c,
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.16em', fontWeight: 700,
            marginBottom: 9,
          }}>ЧТО ЭТО</div>
          <div style={{ fontSize: 12.5, color: '#d4d4d8', lineHeight: 1.75 }}>
            {NODE_INTEL[node.id]}
          </div>
        </div>
      )}

      {/* Role in the chain — per-node, plain Russian */}
      {NODE_ROLE[node.id] && (
        <div style={{
          padding: '18px 24px 16px',
          borderBottom: '1px solid #18181b',
        }}>
          <div style={{
            fontSize: 9, color: c,
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.16em', fontWeight: 700,
            marginBottom: 9,
          }}>РОЛЬ В ЦЕПОЧКЕ</div>
          <div style={{ fontSize: 12.5, color: '#d4d4d8', lineHeight: 1.75 }}>
            {NODE_ROLE[node.id]}
          </div>
        </div>
      )}

      {/* Chain neighbours */}
      {(upstream.length > 0 || downstream.length > 0) && (
        <div style={{ padding: '4px 24px 18px' }}>
          {upstream.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 9, color: '#a1a1aa',
                fontFamily: 'ui-monospace,monospace',
                letterSpacing: '0.14em', fontWeight: 700,
                marginBottom: 8,
              }}>↑ ОТКУДА ПРИХОДИТ</div>
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
                fontSize: 9, color: '#a1a1aa',
                fontFamily: 'ui-monospace,monospace',
                letterSpacing: '0.14em', fontWeight: 700,
                marginBottom: 8,
              }}>↓ КУДА ИДЁТ ДАЛЬШЕ</div>
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
      <div style={{ padding: '14px 24px 28px', borderTop: '1px solid #18181b' }}>
        <div style={{
          fontSize: 9, color: c,
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.16em', fontWeight: 700,
          marginBottom: 6,
        }}>КЛЮЧЕВЫЕ ИГРОКИ</div>
        <div style={{
          fontSize: 10.5, color: '#71717a', lineHeight: 1.55, marginBottom: 14,
        }}>
          Заметные компании этого звена — как примеры, кто им занимается, а не список для покупки.
        </div>
        {sortedCompanies.length === 0 ? (
          <div style={{ fontSize: 11.5, color: '#52525b', fontStyle: 'italic' }}>
            Здесь нет отдельных имён — это переходный узел цепочки.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sortedCompanies.map(co => {
              return (
                <div key={co.company} style={{
                  background: '#131316',
                  border: '1px solid #27272a',
                  borderLeft: `3px solid ${c}`,
                  borderRadius: 6, padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 12.5, color: '#fafafa', fontWeight: 600 }}>{co.company}</div>
                  <div style={{
                    fontSize: 10.5, color: '#a1a1aa',
                    fontFamily: 'ui-monospace,monospace',
                    marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap',
                  }}>
                    <span>{co.ticker}</span>
                    <span style={{ color: '#3f3f46' }}>·</span>
                    <span style={{ color: co.ppr === 'Pub' ? '#10b981' : '#a78bfa' }}>
                      {co.ppr === 'Pub' ? 'ПУБЛИЧНАЯ' : 'ЧАСТНАЯ'}
                    </span>
                    <span style={{ color: '#3f3f46' }}>·</span>
                    <span>{co.geo}</span>
                  </div>
                  {co.note && (
                    <div style={{
                      fontSize: 11, color: '#c4c4cc', lineHeight: 1.6,
                      marginTop: 8, paddingTop: 8,
                      borderTop: '1px solid #1f1f23',
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
  const c = bucket?.color || '#a1a1aa';
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${c}55`,
        borderRadius: 999,
        padding: '5px 11px 5px 9px',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        cursor: 'pointer',
        font: 'inherit',
        transition: 'all 140ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = c + '20'; e.currentTarget.style.borderColor = c; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = `${c}55`; }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
      <span style={{ fontSize: 11, color: '#e4e4e7' }}>{node.label}</span>
    </button>
  );
}
