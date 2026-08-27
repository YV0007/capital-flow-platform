// ══════════════════════════════════════════════════════════════════════════
// FIXTURE GENERATOR — src/data/fundTracker.json
//
// TEMPORARY. The Fund Tracker section is built against the contract frozen in
// FUND-TRACKER-CONTRACT.md while the engine builds the real payload in
// parallel. This script emits a payload that satisfies that contract exactly,
// so every UI state has something to render: fresh Form 4s next to 135-day-old
// 13F lines, 13D intent, named EU/UK shorts, sparse-coverage family offices,
// puts and calls, non-US jurisdictions, watch-only triggers, crowded names.
//
// The numbers are INVENTED. `fixture: true` in the output makes the dashboard
// print a permanent banner saying so. When the engine delivers, overwrite
// src/data/fundTracker.json (fixture: false) and delete this script — no
// component changes.
//
//   node scripts/make_fund_fixture.mjs
// ══════════════════════════════════════════════════════════════════════════

import { writeFileSync } from 'node:fs';

const GENERATED = '2026-08-21';
const PERIOD = { period: '2026Q2', period_end: '2026-06-30', filing_deadline: '2026-08-14' };


// ── Bilingual prose ──────────────────────────────────────────────────────
// The contract carries every prose field as a { ru, en } pair, so the section
// reads in either language without the dashboard translating anything at
// render time. `P()` looks the Russian original up in the table above; an
// unmapped string falls back to itself rather than emitting an empty English
// side, so a missed translation degrades to "still Russian", never to blank.
const EN = {
 "Активист": "Activist",
 "Берёт долю и требует изменений — 13D с Item 4, места в совете, разделение бизнеса.": "Takes a stake and demands change — a 13D with an Item 4, board seats, a break-up.",
 "Конструктивист": "Constructivist",
 "Тот же рычаг, но за закрытой дверью — 13D без публичной кампании, часто место в совете по согласию.": "The same leverage, applied behind a closed door — a 13D with no public campaign, often a board seat by agreement.",
 "Глубокая стоимость": "Deep value",
 "Мало имён, долгий срок, покупка на разломе. Книга меняется медленно.": "Few names, long horizons, buying at the break. The book changes slowly.",
 "Макро в акциях": "Macro in equities",
 "Направленная ставка на цикл через ликвидные имена. Оборот высокий, срок держания короткий.": "A directional bet on the cycle through liquid names. High turnover, short holding periods.",
 "Рост": "Growth",
 "Крупные компаундеры и вторичный рост. Книга широкая, концентрация в топ-10.": "Large compounders and second-order growth. A wide book, concentrated in the top 10.",
 "Long/short": "Long/short",
 "13F показывает только длинную ногу — короткая видна лишь через европейские реестры.": "A 13F shows only the long leg — the short one is visible solely through the European registers.",
 "Контрарианец": "Contrarian",
 "Маленькая книга, крупные ставки против консенсуса, регулярно через путы.": "A small book, big bets against consensus, routinely through puts.",
 "Тематический": "Thematic",
 "Раскрывает сделки ежедневно, а не раз в квартал. Самый быстрый источник в разделе.": "Discloses trades daily rather than quarterly. The fastest source in the section.",
 "Family office": "Family office",
 "Личный капитал. Раскрытие структурно неполное — порогов ниже 13F не видно.": "Personal capital. Disclosure is structurally incomplete — nothing below the 13F thresholds is visible.",
 "Мульти-стратегия": "Multi-strategy",
 "Сотни pod-ов, книга — инвентарь, а не мнение. Только под наблюдением.": "Hundreds of pods; the book is inventory, not opinion. Watch-only.",
 "Полупроводники": "Semiconductors",
 "Софт": "Software",
 "Интернет": "Internet",
 "Потребитель": "Consumer",
 "Финансы": "Financials",
 "Здравоохранение": "Healthcare",
 "Энергия": "Energy",
 "Промышленность": "Industrials",
 "Материалы": "Materials",
 "Недвижимость": "Real estate",
 "Телеком и медиа": "Telecom & media",
 "Коммунальные": "Utilities",
 "ИИ-инфраструктура": "AI infrastructure",
 "ИИ-приложения": "AI applications",
 "Дата-центры": "Data centers",
 "Питание ИИ": "Powering AI",
 "Потребительские бренды": "Consumer brands",
 "Платежи": "Payments",
 "Жильё": "Housing",
 "Энергопереход": "Energy transition",
 "Оборона": "Defense",
 "Биотех": "Biotech",
 "Крипто": "Crypto",
 "Китай": "China",
 "Разлом стоимости": "Value break",
 "Космос": "Space",
 "Одиннадцать имён на $13 млрд и публичная кампания за каждым. Единственный в разделе, кто раскрывает намерение до того, как рынок его отыграет.": "Eleven names carrying $13B, with a public campaign behind each one. The only fund here that states its intent before the market has priced it.",
 "Североамериканские компании с предсказуемым денежным потоком, где смена управления или структуры видна заранее.": "North American companies with predictable cash flow, where a change of management or structure is visible in advance.",
 "Концентрированный long, 8–12 позиций, срок держания измеряется годами. Хедж макро-риска через опционы на ставки — вне 13F.": "A concentrated long book, 8–12 positions, held for years. Macro risk is hedged with rates options — outside the 13F.",
 "Событийный активизм с быстрым оборотом: заходит на разломе, публикует письмо, выходит через 4–6 кварталов. По нему читается, где в рынке сейчас есть событие.": "Event-driven activism with fast turnover: enters at the break, publishes a letter, exits in 4–6 quarters. A good read on where the events currently are.",
 "Разделения, спин-оффы, смена CEO, дисконт холдинговой структуры.": "Break-ups, spin-offs, CEO changes, holding-structure discounts.",
 "Событийно-ориентированный long с кредитной ногой вне 13F. 25–40 имён, топ-10 держит около половины книги.": "An event-driven long book with a credit leg outside the 13F. 25–40 names; the top 10 hold about half of it.",
 "Самая быстрая макро-нога в разделе. Книга разворачивается за квартал, поэтому 13F читается не как позиция, а как след уже сделанной ставки.": "The fastest macro leg in the section. The book turns over within a quarter, so the 13F reads not as a position but as the trace of a bet already made.",
 "Ликвидные крупные капитализации, китайский интернет, ИИ-комплекс.": "Liquid large caps, the Chinese internet, the AI complex.",
 "Направленная макро-ставка, выраженная в акциях. Оборот выше 50% за квартал — латентность 13F здесь калечит сигнал сильнее всего.": "A directional macro bet expressed in equities. Turnover above 50% a quarter — 13F latency damages the signal here more than anywhere else.",
 "Публичная книга — меньше пятой части капитала: остальное в долге, недвижимости и частных сделках, которых 13F не видит. Ценность в том, ЧТО он держит, а не сколько.": "The public book is under a fifth of the capital: the rest sits in debt, real estate and private deals a 13F cannot see. The value is in WHAT he holds, not how much.",
 "Активы с судебным или структурным дисконтом, где цена не отражает исход.": "Assets carrying a legal or structural discount, where the price does not reflect the outcome.",
 "Абсолютная доходность, крупный кэш, срок держания без ограничения. Книга обновляется на 1–2 имени за квартал.": "Absolute return, a large cash balance, no fixed holding period. The book changes by one or two names a quarter.",
 "Единственный в разделе, чья короткая нога частично видна — через европейские реестры. Длинная книга дешёвая и скучная; интерес в том, против чего он стоит.": "The only fund here whose short leg is partly visible, through the European registers. The long book is cheap and dull; the interest is in what he is short.",
 "Дешёвые компании с обратным выкупом; короткая нога — «пузыри второго эшелона».": "Cheap companies buying back stock; the short leg is second-tier bubbles.",
 "Long/short с валовой экспозицией около 150%. Длинная нога в 13F, короткая — только там, где регулятор заставляет раскрыть.": "Long/short at roughly 150% gross. The long leg is in the 13F; the short one appears only where a regulator forces disclosure.",
 "Самая маленькая книга в разделе и самая громкая. Держит путы напрямую в 13F — редкость, потому что почти никто не обязан их показывать так явно.": "The smallest book in the section and the loudest. Holds puts openly in the 13F — a rarity, because almost nobody is required to show them that plainly.",
 "Ставки против консенсуса, часто через опционы; китайский интернет как длинная нога.": "Bets against consensus, often through options; the Chinese internet as the long leg.",
 "Крайняя концентрация, полный разворот книги за 2–3 квартала. Номинал путов в 13F — это страйк × 100 × контракты, а не риск.": "Extreme concentration, a full book turnover in 2–3 quarters. Put notional in a 13F is strike × 100 × contracts, not risk.",
 "Публичная книга — витрина частного портфеля. Что выходит на биржу из их венчурной части, появляется здесь первым.": "The public book is a shop window onto the private portfolio. Whatever lists out of their venture side shows up here first.",
 "Интернет и софт глобально, включая Латинскую Америку и Юго-Восточную Азию.": "Internet and software globally, including Latin America and South-East Asia.",
 "Широкий long на компаундеры, 30–40 имён. Топ-10 держит около 60% книги.": "A broad long book of compounders, 30–40 names. The top 10 hold about 60% of it.",
 "Крупнейшая раскрытая книга в разделе и самая чистая ставка на ИИ-комплекс целиком — от кремния до питания стойки.": "The largest disclosed book in the section and the cleanest bet on the entire AI complex — from the silicon to the power at the rack.",
 "Технологии, медиа, телеком; ИИ-инфраструктура сверху донизу.": "Technology, media, telecom; AI infrastructure top to bottom.",
 "Long/short с длинной ногой в 13F. Книга широкая, но топ-5 держит треть.": "Long/short with the long leg in the 13F. A wide book, but the top 5 hold a third of it.",
 "Классическая «тигриная» книга без венчурного хвоста: только публичные компаундеры, держатся долго, срез книги читается как список качества.": "A classic Tiger-cub book with no venture tail: public compounders only, held long, and the snapshot reads like a quality list.",
 "Софт, платежи, потребитель премиального сегмента.": "Software, payments, premium consumer.",
 "Концентрированный long/short, 20–28 имён в длинной ноге.": "Concentrated long/short, 20–28 names in the long leg.",
 "Самая широкая книга в разделе и самый ровный процесс. Когда Viking одновременно с двумя другими заходит в имя — это не совпадение, а насыщенность.": "The widest book in the section and the steadiest process. When Viking enters a name alongside two others, that is not coincidence — it is crowding.",
 "Здравоохранение и финансы как ядро, технологии как надстройка.": "Healthcare and financials as the core, technology layered on top.",
 "Long/short, длинная нога 60–80 имён. Оборот средний, но хвост книги меняется каждый квартал.": "Long/short, 60–80 names in the long leg. Middling turnover, but the tail of the book changes every quarter.",
 "Больше кампаний одновременно, чем у кого-либо в разделе. 13F показывает лишь ту часть, что уже стала публичной — реальный список целей всегда длиннее.": "More simultaneous campaigns than anyone else here. The 13F shows only the part that has already gone public — the real target list is always longer.",
 "Крупные капитализации с отставанием от аналогов; технологии, энергия, промышленность.": "Large caps trailing their peers; technology, energy, industrials.",
 "Мульти-стратегия с активистской ногой в акциях. Позиции часто строятся через опционы до перехода в акции.": "A multi-strategy firm with an activist leg in equities. Positions are often built through options before converting to stock.",
 "Активист, который не шумит: 13D без кампании, место в совете по согласию, срок держания 3–5 лет. Заход ValueAct — самый тихий сигнал в разделе и самый долгий.": "An activist that does not shout: a 13D with no campaign, a board seat by agreement, a 3–5 year hold. A ValueAct entry is the quietest signal in the section, and the longest-lived.",
 "Софт и промышленные компании в середине перестройки бизнес-модели.": "Software and industrial companies midway through rebuilding their business model.",
 "Концентрированный long, 10–14 имён, вход через переговоры, а не через письмо.": "A concentrated long book, 10–14 names, entered through negotiation rather than a letter.",
 "Единственный источник в разделе с ежедневным раскрытием. Латентность — один день, а не сто. Всё остальное здесь читается на его фоне.": "The only source here with daily disclosure. Latency is one day, not a hundred. Everything else in the section reads against it.",
 "Разрушительные инновации: ИИ, геномика, крипто, космос, робототехника.": "Disruptive innovation: AI, genomics, crypto, space, robotics.",
 "Тематические ETF с ежедневной публикацией сделок. Оборот высокий по построению — ребалансировка идёт непрерывно.": "Thematic ETFs publishing trades daily. Turnover is high by construction — rebalancing never stops.",
 "Личный капитал без внешних денег и без обязанности объяснять. Раскрытие структурно неполное — то, чего в файле нет, чаще всего важнее того, что есть.": "Personal capital, no outside money and no duty to explain. Disclosure is structurally incomplete — what is missing from the file usually matters more than what is in it.",
 "Макро-выражение через акции; смена лидерства цикла видна раньше, чем в индексах.": "Macro expressed through equities; a change of cycle leadership shows here before it shows in the indices.",
 "Family office. Позиции ниже порогов 13F не раскрываются вовсе, деривативы и облигации — тем более.": "A family office. Positions below the 13F thresholds are not disclosed at all, and derivatives and bonds still less.",
 "Книга — инвентарь маркет-мейкера, а не мнение. В разделе появляется только тогда, когда сработало правило: пересечение 5%, необычная концентрация в одном имени или редкая форма.": "The book is market-maker inventory, not opinion. Appears here only when a rule fires: a 5% crossing, unusual concentration in a single name, or a rare form.",
 "Тот же случай: тысячи pod-ов, книга не читается как позиция. Интересна только там, где регулятор заставил показать концентрацию.": "The same case: thousands of pods, and a book that does not read as a position. Interesting only where a regulator forced the concentration into the open.",
 "Появляется в разделе, когда переходит порог 10% и становится инсайдером по Section 16 — тогда сделки видны через Form 4 за два дня, а не за квартал.": "Enters the section on crossing 10% and becoming a Section 16 insider — at which point trades are visible via Form 4 in two days rather than a quarter.",
 "Мульти-стратегия под наблюдением. Сработало одно правило — необычно крупная концентрация в одном имени относительно средней позиции по книге.": "A multi-strategy firm on watch. One rule fired — unusually large concentration in a single name relative to the average position in the book.",
 "Увеличение доли до контрольной через подписку на новые акции; заявлено намерение превратить компанию в диверсифицированный холдинг и назначить исполнительного председателя.": "Increasing the stake to control through a subscription for new shares; stated intent to turn the company into a diversified holding and appoint an executive chairman.",
 "Пассивная форма. Позиция заявлена как инвестиционная, без намерения влиять на контроль.": "A passive form. The position is stated as an investment, with no intent to influence control.",
 "Заявлено намерение добиваться разделения портфеля брендов и обновления состава совета директоров; ведутся переговоры с менеджментом.": "Stated intent to push for a separation of the brand portfolio and a refresh of the board; discussions with management are under way.",
 "Заявлено намерение добиваться пересмотра плана капитальных затрат и возврата капитала акционерам; запрошена встреча с советом директоров.": "Stated intent to push for a revised capital-expenditure plan and returns of capital to shareholders; a meeting with the board has been requested.",
 "Требование о выделении аптечного сегмента и назначении двух независимых директоров; переписка с советом приложена к форме.": "A demand to spin off the pharmacy segment and appoint two independent directors; correspondence with the board is attached to the form.",
 "Дополнение: согласовано назначение двух директоров и создание комитета по стратегическому пересмотру.": "Amendment: two director appointments and a strategic review committee have been agreed.",
 "Позиция заявлена как конструктивная: обсуждение структуры капитала и управления с советом директоров, публичной кампании не заявлено.": "The position is stated as constructive: discussions on capital structure and governance with the board, with no public campaign declared.",
 "Пассивная форма. Порог 5% пройден за счёт покупок в тематических ETF, намерения влиять на управление не заявлено.": "A passive form. The 5% threshold was crossed through purchases inside the thematic ETFs; no intent to influence management is declared.",
 "Пересечение 5% в Vertiv — редкая для маркет-мейкера концентрация в одном имени питания стоек.": "A 5% crossing in Vertiv — concentration in a single rack-power name that is rare for a market maker.",
 "Поправка к 13F за I квартал: раскрыты позиции, ранее закрытые режимом конфиденциальности.": "An amendment to the Q1 13F: positions previously held under confidential treatment are now disclosed.",
 "TR-1: пересечение 5% голосующих прав в Rolls-Royce — позиция, которой 13F не видит вовсе.": "TR-1: a 5% voting-rights crossing in Rolls-Royce — a position a 13F cannot see at all.",
 "Form 4: покупка после перехода порога 10% — сделка видна через два дня, а не через квартал.": "Form 4: a purchase after crossing the 10% threshold — the trade is visible in two days rather than a quarter.",
 "Одна позиция весит в 34 раза больше средней по книге — для pod-структуры это не инвентарь.": "One position weighs 34× the book average — for a pod structure that is not inventory.",
 "Синтетические данные. Все числа выдуманы и не являются реальными формами. Файл заменяется поставкой движка (fixture: false) без правки кода.": "Synthetic data. Every number is invented and none of it is a real filing. The file is replaced by an engine delivery (fixture: false) with no code changes.",
 "Процентное изменение на позиции легче 0,5% книги не показывается: крупный процент на крошечной строке драматичен и ничего не значит.": "Percentage change is not shown on a position lighter than 0.5% of the book: a large percentage on a tiny line is dramatic and means nothing."
};
const P = (ru) => (ru == null ? null : { ru, en: EN[ru] || ru });

// ── deterministic PRNG ───────────────────────────────────────────────────
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let a = hash(seed);
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const between = (r, lo, hi) => lo + r() * (hi - lo);
const round = (v, d = 0) => { const m = 10 ** d; return Math.round(v * m) / m; };

const days = (from, to) => Math.round((new Date(to) - new Date(from)) / 86400000);
const shift = (iso, n) => {
  const d = new Date(iso); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const EDGAR = (cik, form) =>
  `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=${encodeURIComponent(form)}&dateb=&owner=include&count=40`;

// ── taxonomy ─────────────────────────────────────────────────────────────
const STYLE_TAGS = {
  activist:          { label: P('Активист'),            blurb:  P('Берёт долю и требует изменений — 13D с Item 4, места в совете, разделение бизнеса.') },
  constructivist:    { label: P('Конструктивист'),      blurb:  P('Тот же рычаг, но за закрытой дверью — 13D без публичной кампании, часто место в совете по согласию.') },
  deep_value:        { label: P('Глубокая стоимость'),  blurb:  P('Мало имён, долгий срок, покупка на разломе. Книга меняется медленно.') },
  macro_equity:      { label: P('Макро в акциях'),      blurb:  P('Направленная ставка на цикл через ликвидные имена. Оборот высокий, срок держания короткий.') },
  growth_equity:     { label: P('Рост'),                blurb:  P('Крупные компаундеры и вторичный рост. Книга широкая, концентрация в топ-10.') },
  long_short:        { label: P('Long/short'),          blurb:  P('13F показывает только длинную ногу — короткая видна лишь через европейские реестры.') },
  contrarian:        { label: P('Контрарианец'),        blurb:  P('Маленькая книга, крупные ставки против консенсуса, регулярно через путы.') },
  thematic:          { label: P('Тематический'),        blurb:  P('Раскрывает сделки ежедневно, а не раз в квартал. Самый быстрый источник в разделе.') },
  family_office:     { label: P('Family office'),       blurb:  P('Личный капитал. Раскрытие структурно неполное — порогов ниже 13F не видно.') },
  multi_strategy:    { label: P('Мульти-стратегия'),    blurb:  P('Сотни pod-ов, книга — инвентарь, а не мнение. Только под наблюдением.') },
};

const SECTORS = {
  semis:       P('Полупроводники'),
  software:    P('Софт'),
  internet:    P('Интернет'),
  consumer:    P('Потребитель'),
  financials:  P('Финансы'),
  healthcare:  P('Здравоохранение'),
  energy:      P('Энергия'),
  industrials: P('Промышленность'),
  materials:   P('Материалы'),
  real_estate: P('Недвижимость'),
  comms:       P('Телеком и медиа'),
  utilities:   P('Коммунальные'),
};

const THEMES = {
  ai_infra:         P('ИИ-инфраструктура'),
  ai_apps:          P('ИИ-приложения'),
  data_centers:     P('Дата-центры'),
  power:            P('Питание ИИ'),
  consumer_brands:  P('Потребительские бренды'),
  payments:         P('Платежи'),
  housing:          P('Жильё'),
  energy_transition: P('Энергопереход'),
  defense:          P('Оборона'),
  biotech:          P('Биотех'),
  crypto:           P('Крипто'),
  china:            P('Китай'),
  deep_value:       P('Разлом стоимости'),
  space:            P('Космос'),
};

// ── the tracked universe ─────────────────────────────────────────────────
// "TICKER|Issuer|sector|theme|action|flags"
//   action  new · added · trimmed · exited · (blank = hold)
//   flags   put · call · adr · weak (price fell in the period) · uk/de/jp/ca/au
const FUNDS = [
  {
    id: 'pershing-square', name: 'Pershing Square Capital Management, L.P.', short: 'Pershing Square',
    principal: 'Билл Акман', style: 'activist', cik: '0001336528',
    aum: 18_400e6, book: 12_900e6, conc: 1.55, turnover: 0.11, persistence: 11.2, score: 84,
    filed: '2026-08-12',
    why: 'Одиннадцать имён на $13 млрд и публичная кампания за каждым. Единственный в разделе, кто раскрывает намерение до того, как рынок его отыграет.',
    focus: 'Североамериканские компании с предсказуемым денежным потоком, где смена управления или структуры видна заранее.',
    strategy: 'Концентрированный long, 8–12 позиций, срок держания измеряется годами. Хедж макро-риска через опционы на ставки — вне 13F.',
    pos: [
      'UBER|Uber Technologies|internet|ai_apps||',
      'BN|Brookfield Corporation|financials|deep_value|added|',
      'HLT|Hilton Worldwide|consumer|consumer_brands||',
      'CMG|Chipotle Mexican Grill|consumer|consumer_brands|added|weak',
      'HHH|Howard Hughes Holdings|real_estate|housing||',
      'QSR|Restaurant Brands International|consumer|consumer_brands|trimmed|',
      'GOOGL|Alphabet|internet|ai_apps||',
      'NKE|Nike|consumer|consumer_brands|added|weak',
      'FNMA|Fannie Mae|financials|housing|new|',
      'CP|Canadian Pacific Kansas City|industrials|deep_value|exited|ca',
      'SEG|Seaport Entertainment|real_estate|deep_value||',
    ],
    stakes: [
      { issuer: 'Howard Hughes Holdings', ticker: 'HHH', form: 'SC 13D/A', pct: 0.469, filed: '2026-05-19', event: '2026-05-07', activist: true,
        intent: 'Увеличение доли до контрольной через подписку на новые акции; заявлено намерение превратить компанию в диверсифицированный холдинг и назначить исполнительного председателя.' },
      { issuer: 'Fannie Mae', ticker: 'FNMA', form: 'SC 13G', pct: 0.021, filed: '2026-07-02', event: '2026-06-30', activist: false,
        intent: 'Пассивная форма. Позиция заявлена как инвестиционная, без намерения влиять на контроль.' },
    ],
    shorts: [],
    returns: [[2021, 26.9], [2022, -8.8], [2023, 26.7], [2024, 10.2], [2025, 13.6], [2026, 9.4]],
  },
  {
    id: 'third-point', name: 'Third Point LLC', short: 'Third Point',
    principal: 'Дэн Лёб', style: 'activist', cik: '0001040273',
    aum: 11_800e6, book: 7_200e6, conc: 1.35, turnover: 0.34, persistence: 5.1, score: 71,
    filed: '2026-08-14',
    why: 'Событийный активизм с быстрым оборотом: заходит на разломе, публикует письмо, выходит через 4–6 кварталов. По нему читается, где в рынке сейчас есть событие.',
    focus: 'Разделения, спин-оффы, смена CEO, дисконт холдинговой структуры.',
    strategy: 'Событийно-ориентированный long с кредитной ногой вне 13F. 25–40 имён, топ-10 держит около половины книги.',
    pos: [
      'AMZN|Amazon|internet|ai_apps||',
      'PCG|PG&E|utilities|power|added|',
      'TSM|Taiwan Semiconductor|semis|ai_infra||adr',
      'VST|Vistra|utilities|power|added|',
      'CRM|Salesforce|software|ai_apps|new|',
      'DHR|Danaher|healthcare|biotech|trimmed|weak',
      'JCI|Johnson Controls|industrials|data_centers||',
      'KVUE|Kenvue|consumer|consumer_brands|new|',
      'APO|Apollo Global Management|financials|deep_value||',
      'GOOGL|Alphabet|internet|ai_apps||',
      'META|Meta Platforms|internet|ai_apps|trimmed|',
      'LEN|Lennar|consumer|housing||weak',
      'TPR|Tapestry|consumer|consumer_brands|added|',
      'INTC|Intel|semis|ai_infra|exited|',
      'FWONK|Liberty Media Formula One|comms|deep_value||',
      'LSXMK|Liberty SiriusXM|comms|deep_value|exited|',
    ],
    stakes: [
      { issuer: 'Kenvue', ticker: 'KVUE', form: 'SC 13D', pct: 0.052, filed: '2026-06-24', event: '2026-06-12', activist: true,
        intent: 'Заявлено намерение добиваться разделения портфеля брендов и обновления состава совета директоров; ведутся переговоры с менеджментом.' },
    ],
    shorts: [],
    returns: [[2021, 22.9], [2022, -21.8], [2023, 22.0], [2024, 24.2], [2025, 7.1], [2026, 4.8]],
  },
  {
    id: 'appaloosa', name: 'Appaloosa LP', short: 'Appaloosa',
    principal: 'Дэвид Теппер', style: 'macro_equity', cik: '0001656456',
    aum: 8_600e6, book: 8_100e6, conc: 1.25, turnover: 0.52, persistence: 3.4, score: 63,
    filed: '2026-08-14',
    why: 'Самая быстрая макро-нога в разделе. Книга разворачивается за квартал, поэтому 13F читается не как позиция, а как след уже сделанной ставки.',
    focus: 'Ликвидные крупные капитализации, китайский интернет, ИИ-комплекс.',
    strategy: 'Направленная макро-ставка, выраженная в акциях. Оборот выше 50% за квартал — латентность 13F здесь калечит сигнал сильнее всего.',
    pos: [
      'BABA|Alibaba Group|internet|china|added|adr',
      'PDD|PDD Holdings|internet|china||adr',
      'AMZN|Amazon|internet|ai_apps|trimmed|',
      'NVDA|NVIDIA|semis|ai_infra|trimmed|',
      'META|Meta Platforms|internet|ai_apps|trimmed|',
      'MSFT|Microsoft|software|ai_infra||',
      'ORCL|Oracle|software|data_centers|added|',
      'UBER|Uber Technologies|internet|ai_apps||',
      'JD|JD.com|internet|china|added|adr',
      'AMD|Advanced Micro Devices|semis|ai_infra||',
      'CAH|Cardinal Health|healthcare|deep_value|new|',
      'LVS|Las Vegas Sands|consumer|china||weak',
      'ALLY|Ally Financial|financials|deep_value||',
      'HPE|Hewlett Packard Enterprise|industrials|data_centers|added|',
      'MU|Micron Technology|semis|ai_infra||',
      'GOOG|Alphabet|internet|ai_apps|trimmed|',
      'KWEB|KraneShares CSI China Internet ETF|internet|china|added|',
      'FXI|iShares China Large-Cap ETF|internet|china|exited|',
    ],
    stakes: [],
    shorts: [],
    returns: [[2021, 15.4], [2022, -12.3], [2023, 31.2], [2024, 18.9], [2025, 22.4], [2026, 11.7]],
  },
  {
    id: 'baupost', name: 'The Baupost Group, L.L.C.', short: 'Baupost',
    principal: 'Сет Кларман', style: 'deep_value', cik: '0001061768',
    aum: 27_000e6, book: 4_000e6, conc: 1.40, turnover: 0.09, persistence: 13.8, score: 79,
    filed: '2026-08-14', sparse: true,
    why: 'Публичная книга — меньше пятой части капитала: остальное в долге, недвижимости и частных сделках, которых 13F не видит. Ценность в том, ЧТО он держит, а не сколько.',
    focus: 'Активы с судебным или структурным дисконтом, где цена не отражает исход.',
    strategy: 'Абсолютная доходность, крупный кэш, срок держания без ограничения. Книга обновляется на 1–2 имени за квартал.',
    pos: [
      'LBRDK|Liberty Broadband|comms|deep_value||',
      'WBD|Warner Bros. Discovery|comms|deep_value|added|weak',
      'CLBT|Cellebrite DI|software|defense||',
      'VEON|VEON Ltd.|comms|deep_value||adr',
      'FWONK|Liberty Media Formula One|comms|deep_value||',
      'GRAL|GRAIL|healthcare|biotech|added|weak',
      'JBLU|JetBlue Airways|industrials|deep_value||weak',
      'SLDP|Solid Power|industrials|energy_transition|trimmed|',
      'HCA|HCA Healthcare|healthcare|deep_value||',
      'ALGN|Align Technology|healthcare|deep_value|new|weak',
      'CRM|Salesforce|software|ai_apps||',
      'LNG|Cheniere Energy|energy|energy_transition||',
      'PARA|Paramount Skydance|comms|deep_value|exited|',
      'DVA|DaVita|healthcare|deep_value||',
    ],
    stakes: [],
    shorts: [],
    returns: [[2021, 12.1], [2022, -5.4], [2023, 8.8], [2024, 6.2], [2025, 9.9], [2026, 3.1]],
  },
  {
    id: 'greenlight', name: 'Greenlight Capital, Inc.', short: 'Greenlight',
    principal: 'Дэвид Эйнхорн', style: 'long_short', cik: '0001079114',
    aum: 2_300e6, book: 1_600e6, conc: 1.30, turnover: 0.22, persistence: 7.6, score: 68,
    filed: '2026-08-13',
    why: 'Единственный в разделе, чья короткая нога частично видна — через европейские реестры. Длинная книга дешёвая и скучная; интерес в том, против чего он стоит.',
    focus: 'Дешёвые компании с обратным выкупом; короткая нога — «пузыри второго эшелона».',
    strategy: 'Long/short с валовой экспозицией около 150%. Длинная нога в 13F, короткая — только там, где регулятор заставляет раскрыть.',
    pos: [
      'GRBK|Green Brick Partners|consumer|housing||weak',
      'CNXN|PC Connection|industrials|deep_value||',
      'LAUR|Laureate Education|consumer|deep_value|added|',
      'PENN|PENN Entertainment|consumer|deep_value||weak',
      'CC|Chemours|materials|deep_value|added|weak',
      'HPQ|HP Inc.|industrials|deep_value||',
      'ODP|ODP Corporation|consumer|deep_value|trimmed|',
      'SLVM|Sylvamo|materials|deep_value||',
      'TEX|Terex|industrials|deep_value|new|',
      'ALSN|Allison Transmission|industrials|deep_value||',
      'KD|Kyndryl Holdings|software|deep_value||',
      'DINO|HF Sinclair|energy|deep_value|added|weak',
      'CNX|CNX Resources|energy|energy_transition||',
      'WFRD|Weatherford International|energy|deep_value|exited|',
      'BHF|Brighthouse Financial|financials|deep_value||',
    ],
    stakes: [],
    shorts: [
      { issuer: 'Ocado Group plc', isin: 'GB00B3MBS747', jur: 'UK', register: 'FCA', pct: 0.0081, as_of: '2026-08-20', dir: 'increased' },
      { issuer: 'Delivery Hero SE', isin: 'DE000A2E4K43', jur: 'DE', register: 'BaFin', pct: 0.0064, as_of: '2026-08-19', dir: 'new' },
      { issuer: 'Grifols SA', isin: 'ES0171996087', jur: 'ES', register: 'CNMV', pct: 0.0052, as_of: '2026-08-18', dir: 'decreased' },
    ],
    returns: [[2021, 11.9], [2022, 36.6], [2023, 22.1], [2024, 7.2], [2025, 14.3], [2026, 6.6]],
  },
  {
    id: 'scion', name: 'Scion Asset Management, LLC', short: 'Scion',
    principal: 'Майкл Бьюрри', style: 'contrarian', cik: '0001649339',
    aum: 155e6, book: 92e6, conc: 1.80, turnover: 0.71, persistence: 2.1, score: 52,
    filed: '2026-08-14', sparse: true,
    why: 'Самая маленькая книга в разделе и самая громкая. Держит путы напрямую в 13F — редкость, потому что почти никто не обязан их показывать так явно.',
    focus: 'Ставки против консенсуса, часто через опционы; китайский интернет как длинная нога.',
    strategy: 'Крайняя концентрация, полный разворот книги за 2–3 квартала. Номинал путов в 13F — это страйк × 100 × контракты, а не риск.',
    pos: [
      'BABA|Alibaba Group|internet|china|added|adr',
      'JD|JD.com|internet|china||adr',
      'ESTC|Elastic N.V.|software|ai_apps|new|weak',
      'MOH|Molina Healthcare|healthcare|deep_value||weak',
      'HCA|HCA Healthcare|healthcare|deep_value|trimmed|',
      'BRKR|Bruker|healthcare|biotech||weak',
      'NVDA|NVIDIA|semis|ai_infra|new|put',
      'PLTR|Palantir Technologies|software|ai_apps|new|put',
      'VTLE|Vital Energy|energy|deep_value|exited|',
    ],
    stakes: [],
    shorts: [],
    returns: [[2021, 8.4], [2022, 41.2], [2023, -12.6], [2024, 19.4], [2025, -4.1], [2026, 17.8]],
  },
  {
    id: 'tiger-global', name: 'Tiger Global Management, LLC', short: 'Tiger Global',
    principal: 'Чейз Коулман', style: 'growth_equity', cik: '0001167483',
    aum: 36_000e6, book: 22_500e6, conc: 1.20, turnover: 0.28, persistence: 6.9, score: 66,
    filed: '2026-08-14',
    why: 'Публичная книга — витрина частного портфеля. Что выходит на биржу из их венчурной части, появляется здесь первым.',
    focus: 'Интернет и софт глобально, включая Латинскую Америку и Юго-Восточную Азию.',
    strategy: 'Широкий long на компаундеры, 30–40 имён. Топ-10 держит около 60% книги.',
    pos: [
      'MSFT|Microsoft|software|ai_infra||',
      'META|Meta Platforms|internet|ai_apps||',
      'NVDA|NVIDIA|semis|ai_infra|added|',
      'SE|Sea Limited|internet|ai_apps||adr',
      'GRAB|Grab Holdings|internet|payments|added|',
      'APO|Apollo Global Management|financials|deep_value||',
      'FLUT|Flutter Entertainment|consumer|consumer_brands||',
      'NU|Nu Holdings|financials|payments|added|',
      'TSM|Taiwan Semiconductor|semis|ai_infra||adr',
      'ASML|ASML Holding|semis|ai_infra|new|adr',
      'SPOT|Spotify Technology|comms|consumer_brands||',
      'DASH|DoorDash|internet|consumer_brands|trimmed|',
      'CRWD|CrowdStrike Holdings|software|defense||',
      'DDOG|Datadog|software|ai_apps|trimmed|weak',
      'SNOW|Snowflake|software|ai_apps||weak',
      'AMZN|Amazon|internet|ai_apps||',
      'GOOGL|Alphabet|internet|ai_apps||',
      'MELI|MercadoLibre|internet|payments|exited|',
    ],
    stakes: [],
    shorts: [],
    returns: [[2021, -7.0], [2022, -56.0], [2023, 28.5], [2024, 23.1], [2025, 18.7], [2026, 12.2]],
  },
  {
    id: 'coatue', name: 'Coatue Management, L.L.C.', short: 'Coatue',
    principal: 'Филипп Лаффон', style: 'growth_equity', cik: '0001135730',
    aum: 48_000e6, book: 26_800e6, conc: 1.28, turnover: 0.31, persistence: 5.8, score: 70,
    filed: '2026-08-14',
    why: 'Крупнейшая раскрытая книга в разделе и самая чистая ставка на ИИ-комплекс целиком — от кремния до питания стойки.',
    focus: 'Технологии, медиа, телеком; ИИ-инфраструктура сверху донизу.',
    strategy: 'Long/short с длинной ногой в 13F. Книга широкая, но топ-5 держит треть.',
    pos: [
      'NVDA|NVIDIA|semis|ai_infra|added|',
      'META|Meta Platforms|internet|ai_apps||',
      'AMZN|Amazon|internet|ai_apps||',
      'MSFT|Microsoft|software|ai_infra|trimmed|',
      'TSM|Taiwan Semiconductor|semis|ai_infra|added|adr',
      'SPOT|Spotify Technology|comms|consumer_brands||',
      'NFLX|Netflix|comms|consumer_brands||',
      'AVGO|Broadcom|semis|ai_infra|added|',
      'CRWD|CrowdStrike Holdings|software|defense||',
      'VRT|Vertiv Holdings|industrials|power|added|weak',
      'LRCX|Lam Research|semis|ai_infra|new|',
      'ANET|Arista Networks|industrials|data_centers||',
      'GOOGL|Alphabet|internet|ai_apps||',
      'SHOP|Shopify|internet|payments|trimmed|',
      'HOOD|Robinhood Markets|financials|crypto|added|',
      'APP|AppLovin|software|ai_apps||',
      'MU|Micron Technology|semis|ai_infra|new|',
      'DASH|DoorDash|internet|consumer_brands|exited|',
    ],
    stakes: [],
    shorts: [],
    returns: [[2021, 8.2], [2022, -19.4], [2023, 41.6], [2024, 27.8], [2025, 24.9], [2026, 15.1]],
  },
  {
    id: 'lone-pine', name: 'Lone Pine Capital LLC', short: 'Lone Pine',
    principal: 'Келли Гранат', style: 'growth_equity', cik: '0001061165',
    aum: 19_000e6, book: 14_200e6, conc: 1.32, turnover: 0.26, persistence: 7.1, score: 69,
    filed: '2026-08-14',
    why: 'Классическая «тигриная» книга без венчурного хвоста: только публичные компаундеры, держатся долго, срез книги читается как список качества.',
    focus: 'Софт, платежи, потребитель премиального сегмента.',
    strategy: 'Концентрированный long/short, 20–28 имён в длинной ноге.',
    pos: [
      'META|Meta Platforms|internet|ai_apps||',
      'MSFT|Microsoft|software|ai_infra||',
      'AMZN|Amazon|internet|ai_apps||',
      'TSM|Taiwan Semiconductor|semis|ai_infra|added|adr',
      'FI|Fiserv|financials|payments|trimmed|weak',
      'INTU|Intuit|software|ai_apps||',
      'VRT|Vertiv Holdings|industrials|power|added|weak',
      'LULU|Lululemon Athletica|consumer|consumer_brands|new|weak',
      'PGR|Progressive|financials|deep_value||',
      'SPOT|Spotify Technology|comms|consumer_brands||',
      'WDAY|Workday|software|ai_apps||weak',
      'BKNG|Booking Holdings|internet|consumer_brands||',
      'GOOGL|Alphabet|internet|ai_apps|added|',
      'NVDA|NVIDIA|semis|ai_infra||',
      'ANET|Arista Networks|industrials|data_centers||',
      'SNOW|Snowflake|software|ai_apps|exited|',
    ],
    stakes: [],
    shorts: [
      { issuer: 'Wise plc', isin: 'GB00BL9YR831', jur: 'UK', register: 'FCA', pct: 0.0059, as_of: '2026-08-20', dir: 'increased' },
    ],
    returns: [[2021, 4.6], [2022, -36.2], [2023, 25.8], [2024, 19.1], [2025, 16.4], [2026, 8.9]],
  },
  {
    id: 'viking-global', name: 'Viking Global Investors LP', short: 'Viking Global',
    principal: 'Нин Цзинь', style: 'long_short', cik: '0001103804',
    aum: 46_000e6, book: 24_900e6, conc: 1.18, turnover: 0.35, persistence: 5.2, score: 67,
    filed: '2026-08-14',
    why: 'Самая широкая книга в разделе и самый ровный процесс. Когда Viking одновременно с двумя другими заходит в имя — это не совпадение, а насыщенность.',
    focus: 'Здравоохранение и финансы как ядро, технологии как надстройка.',
    strategy: 'Long/short, длинная нога 60–80 имён. Оборот средний, но хвост книги меняется каждый квартал.',
    pos: [
      'UNH|UnitedHealth Group|healthcare|deep_value|added|weak',
      'JPM|JPMorgan Chase|financials|deep_value||',
      'TMO|Thermo Fisher Scientific|healthcare|biotech||weak',
      'NVDA|NVIDIA|semis|ai_infra|trimmed|',
      'ROP|Roper Technologies|software|ai_apps||',
      'VRTX|Vertex Pharmaceuticals|healthcare|biotech||',
      'ORCL|Oracle|software|data_centers|added|',
      'MSFT|Microsoft|software|ai_infra||',
      'BSX|Boston Scientific|healthcare|biotech||',
      'CPNG|Coupang|internet|consumer_brands|added|',
      'GEV|GE Vernova|industrials|power|new|',
      'SPOT|Spotify Technology|comms|consumer_brands||',
      'WDAY|Workday|software|ai_apps|trimmed|weak',
      'TJX|TJX Companies|consumer|consumer_brands||',
      'LLY|Eli Lilly|healthcare|biotech|trimmed|',
      'AMZN|Amazon|internet|ai_apps||',
      'XYZ|Block, Inc.|financials|payments|new|weak',
      'PGR|Progressive|financials|deep_value|exited|',
    ],
    stakes: [],
    shorts: [
      { issuer: 'ASOS plc', isin: 'GB0030927254', jur: 'UK', register: 'FCA', pct: 0.0072, as_of: '2026-08-20', dir: 'decreased' },
      { issuer: 'Zalando SE', isin: 'DE000ZAL1111', jur: 'DE', register: 'BaFin', pct: 0.0051, as_of: '2026-08-17', dir: 'increased' },
    ],
    returns: [[2021, 8.7], [2022, -25.4], [2023, 19.2], [2024, 21.6], [2025, 13.8], [2026, 7.4]],
  },
  {
    id: 'elliott', name: 'Elliott Investment Management L.P.', short: 'Elliott',
    principal: 'Пол Сингер', style: 'activist', cik: '0001791786',
    aum: 73_000e6, book: 15_100e6, conc: 1.22, turnover: 0.41, persistence: 4.3, score: 76,
    filed: '2026-08-14',
    why: 'Больше кампаний одновременно, чем у кого-либо в разделе. 13F показывает лишь ту часть, что уже стала публичной — реальный список целей всегда длиннее.',
    focus: 'Крупные капитализации с отставанием от аналогов; технологии, энергия, промышленность.',
    strategy: 'Мульти-стратегия с активистской ногой в акциях. Позиции часто строятся через опционы до перехода в акции.',
    pos: [
      'HON|Honeywell International|industrials|defense||',
      'SWKS|Skyworks Solutions|semis|ai_infra|added|weak',
      'PSX|Phillips 66|energy|deep_value||',
      'TXN|Texas Instruments|semis|ai_infra|new|',
      'SOLV|Solventum|healthcare|deep_value||weak',
      'MRVL|Marvell Technology|semis|ai_infra|added|weak',
      'ANSS|Ansys|software|ai_apps|exited|',
      'PINS|Pinterest|internet|ai_apps||weak',
      'WDC|Western Digital|semis|data_centers||',
      'HUM|Humana|healthcare|deep_value|added|weak',
      'CTSH|Cognizant Technology|software|ai_apps||',
      'ETSY|Etsy|internet|consumer_brands||weak',
      'SUN|Sunoco LP|energy|deep_value||',
      'LNG|Cheniere Energy|energy|energy_transition|added|',
      'PCG|PG&E|utilities|power||',
      'MTCH|Match Group|internet|consumer_brands|new|weak',
      'CVX|Chevron|energy|deep_value|trimmed|',
      'DELL|Dell Technologies|industrials|data_centers||',
    ],
    stakes: [
      { issuer: 'Texas Instruments', ticker: 'TXN', form: 'SC 13D', pct: 0.031, filed: '2026-07-09', event: '2026-06-29', activist: true,
        intent: 'Заявлено намерение добиваться пересмотра плана капитальных затрат и возврата капитала акционерам; запрошена встреча с советом директоров.' },
      { issuer: 'Humana', ticker: 'HUM', form: 'SC 13D', pct: 0.041, filed: '2026-04-28', event: '2026-04-16', activist: true,
        intent: 'Требование о выделении аптечного сегмента и назначении двух независимых директоров; переписка с советом приложена к форме.' },
      { issuer: 'Match Group', ticker: 'MTCH', form: 'SC 13D/A', pct: 0.068, filed: '2026-08-05', event: '2026-07-24', activist: true,
        intent: 'Дополнение: согласовано назначение двух директоров и создание комитета по стратегическому пересмотру.' },
    ],
    shorts: [],
    returns: [[2021, 13.4], [2022, 2.1], [2023, 8.6], [2024, 12.9], [2025, 11.2], [2026, 5.8]],
  },
  {
    id: 'valueact', name: 'ValueAct Holdings, L.P.', short: 'ValueAct',
    principal: 'Мейсон Морфит', style: 'constructivist', cik: '0001418814',
    aum: 8_900e6, book: 6_400e6, conc: 1.60, turnover: 0.14, persistence: 10.6, score: 81,
    filed: '2026-08-13',
    why: 'Активист, который не шумит: 13D без кампании, место в совете по согласию, срок держания 3–5 лет. Заход ValueAct — самый тихий сигнал в разделе и самый долгий.',
    focus: 'Софт и промышленные компании в середине перестройки бизнес-модели.',
    strategy: 'Концентрированный long, 10–14 имён, вход через переговоры, а не через письмо.',
    pos: [
      'SLB|SLB (Schlumberger)|energy|energy_transition|added|weak',
      'DIS|Walt Disney|comms|consumer_brands||',
      'INSP|Inspire Medical Systems|healthcare|biotech||weak',
      'EXPE|Expedia Group|internet|consumer_brands||',
      'FLUT|Flutter Entertainment|consumer|consumer_brands||',
      'SGA|Saga Communications|comms|deep_value||',
      'RCM|R1 RCM|healthcare|ai_apps|exited|',
      'GRFS|Grifols SA|healthcare|biotech|new|adr',
      'KBR|KBR, Inc.|industrials|defense|added|',
      'ROP|Roper Technologies|software|ai_apps||',
      'CRM|Salesforce|software|ai_apps|trimmed|',
      'NTR|Nutrien|materials|deep_value||weak',
    ],
    stakes: [
      { issuer: 'Grifols SA', ticker: 'GRFS', form: 'SC 13D', pct: 0.055, filed: '2026-06-02', event: '2026-05-21', activist: false,
        intent: 'Позиция заявлена как конструктивная: обсуждение структуры капитала и управления с советом директоров, публичной кампании не заявлено.' },
    ],
    shorts: [],
    returns: [[2021, 24.1], [2022, -14.2], [2023, 17.9], [2024, 14.6], [2025, 12.1], [2026, 6.2]],
  },
  {
    id: 'ark', name: 'ARK Investment Management LLC', short: 'ARK Invest',
    principal: 'Кэти Вуд', style: 'thematic', cik: '0001697748',
    aum: 14_600e6, book: 12_100e6, conc: 1.15, turnover: 0.88, persistence: 4.7, score: 44,
    filed: '2026-08-20',
    why: 'Единственный источник в разделе с ежедневным раскрытием. Латентность — один день, а не сто. Всё остальное здесь читается на его фоне.',
    focus: 'Разрушительные инновации: ИИ, геномика, крипто, космос, робототехника.',
    strategy: 'Тематические ETF с ежедневной публикацией сделок. Оборот высокий по построению — ребалансировка идёт непрерывно.',
    pos: [
      'TSLA|Tesla|consumer|ai_apps|trimmed|weak',
      'COIN|Coinbase Global|financials|crypto|added|',
      'ROKU|Roku|comms|consumer_brands||weak',
      'RKLB|Rocket Lab|industrials|space|added|',
      'PLTR|Palantir Technologies|software|ai_apps|trimmed|',
      'CRSP|CRISPR Therapeutics|healthcare|biotech||weak',
      'HOOD|Robinhood Markets|financials|crypto|trimmed|',
      'TEM|Tempus AI|healthcare|ai_apps|added|weak',
      'RBLX|Roblox|internet|consumer_brands||',
      'PATH|UiPath|software|ai_apps|added|weak',
      'TWST|Twist Bioscience|healthcare|biotech||weak',
      'DKNG|DraftKings|consumer|consumer_brands|new|',
      'SHOP|Shopify|internet|payments||',
      'BEAM|Beam Therapeutics|healthcare|biotech|added|weak',
      'IONQ|IonQ|semis|ai_infra|new|',
      'ARCT|Arcturus Therapeutics|healthcare|biotech|exited|',
      'ZM|Zoom Communications|software|ai_apps|exited|',
      'NTLA|Intellia Therapeutics|healthcare|biotech||weak',
    ],
    stakes: [
      { issuer: 'Tempus AI', ticker: 'TEM', form: 'SC 13G/A', pct: 0.058, filed: '2026-07-10', event: '2026-06-30', activist: false,
        intent: 'Пассивная форма. Порог 5% пройден за счёт покупок в тематических ETF, намерения влиять на управление не заявлено.' },
    ],
    shorts: [],
    returns: [[2021, -23.4], [2022, -67.0], [2023, 67.6], [2024, 8.4], [2025, 31.2], [2026, 19.6]],
  },
  {
    id: 'duquesne', name: 'Duquesne Family Office LLC', short: 'Duquesne',
    principal: 'Стэнли Дракенмиллер', style: 'family_office', cik: '0001536411',
    aum: null, book: 3_200e6, conc: 1.45, turnover: 0.46, persistence: 3.9, score: 72,
    filed: '2026-08-14', sparse: true,
    why: 'Личный капитал без внешних денег и без обязанности объяснять. Раскрытие структурно неполное — то, чего в файле нет, чаще всего важнее того, что есть.',
    focus: 'Макро-выражение через акции; смена лидерства цикла видна раньше, чем в индексах.',
    strategy: 'Family office. Позиции ниже порогов 13F не раскрываются вовсе, деривативы и облигации — тем более.',
    pos: [
      'NTRA|Natera|healthcare|biotech|added|',
      'WMB|Williams Companies|energy|power||',
      'TEVA|Teva Pharmaceutical|healthcare|deep_value||adr',
      'COHR|Coherent Corp.|semis|ai_infra|added|',
      'SEZL|Sezzle|financials|payments|new|weak',
      'WDAY|Workday|software|ai_apps||weak',
      'FLUT|Flutter Entertainment|consumer|consumer_brands||',
      'PLNT|Planet Fitness|consumer|consumer_brands||',
      'KVUE|Kenvue|consumer|consumer_brands|new|',
      'ARM|Arm Holdings|semis|ai_infra|trimmed|adr',
      'MSFT|Microsoft|software|ai_infra||',
      'LNG|Cheniere Energy|energy|energy_transition|added|',
      'CPNG|Coupang|internet|consumer_brands||',
      'INSM|Insmed|healthcare|biotech|trimmed|',
      'MRVL|Marvell Technology|semis|ai_infra|exited|',
      'TMUS|T-Mobile US|comms|deep_value||',
    ],
    stakes: [],
    shorts: [],
    returns: [[2021, 19.2], [2022, -11.6], [2023, 24.8], [2024, 16.1], [2025, 18.4], [2026, 10.3]],
  },
];

// ── watch-only: no book, only triggers ───────────────────────────────────
// These four run hundreds of pods each; their 13F is inventory, not opinion.
// They enter the section ONLY when a rule fires, and carry only that row.
const WATCH = [
  {
    id: 'citadel', name: 'Citadel Advisors LLC', short: 'Citadel', principal: 'Кен Гриффин',
    cik: '0001423053', aum: 66_000e6, book: 612_000e6, position_count: 8_412,
    why: 'Книга — инвентарь маркет-мейкера, а не мнение. В разделе появляется только тогда, когда сработало правило: пересечение 5%, необычная концентрация в одном имени или редкая форма.',
    triggers: [
      { rule: 'stake_crossing', ticker: 'VRT', issuer: 'Vertiv Holdings', form: 'SC 13G/A', filed: '2026-07-14', event: '2026-06-30',
        headline: 'Пересечение 5% в Vertiv — редкая для маркет-мейкера концентрация в одном имени питания стоек.',
        magnitude: 1_940e6, pct: 0.052, latency: 14 },
      { rule: 'amendment_release', ticker: null, issuer: null, form: '13F-HR/A', filed: '2026-08-18', event: '2026-03-31',
        headline: 'Поправка к 13F за I квартал: раскрыты позиции, ранее закрытые режимом конфиденциальности.',
        magnitude: 3_100e6, pct: null, latency: 140 },
    ],
  },
  {
    id: 'millennium', name: 'Millennium Management LLC', short: 'Millennium', principal: 'Израэль Ингландер',
    cik: '0001273087', aum: 78_000e6, book: 341_000e6, position_count: 6_180,
    why: 'Тот же случай: тысячи pod-ов, книга не читается как позиция. Интересна только там, где регулятор заставил показать концентрацию.',
    triggers: [
      { rule: 'tr1_crossing', ticker: 'RR.L', issuer: 'Rolls-Royce Holdings plc', form: 'TR-1', filed: '2026-08-11', event: '2026-08-07',
        headline: 'TR-1: пересечение 5% голосующих прав в Rolls-Royce — позиция, которой 13F не видит вовсе.',
        magnitude: 2_450e6, pct: 0.051, latency: 4 },
    ],
  },
  {
    id: 'point72', name: 'Point72 Asset Management, L.P.', short: 'Point72', principal: 'Стив Коэн',
    cik: '0001603466', aum: 38_000e6, book: 41_800e6, position_count: 2_940,
    why: 'Появляется в разделе, когда переходит порог 10% и становится инсайдером по Section 16 — тогда сделки видны через Form 4 за два дня, а не за квартал.',
    triggers: [
      { rule: 'form4_insider', ticker: 'RKLB', issuer: 'Rocket Lab', form: '4', filed: '2026-08-19', event: '2026-08-17',
        headline: 'Form 4: покупка после перехода порога 10% — сделка видна через два дня, а не через квартал.',
        magnitude: 186e6, pct: 0.104, latency: 2 },
    ],
  },
  {
    id: 'balyasny', name: 'Balyasny Asset Management L.P.', short: 'Balyasny', principal: 'Дмитрий Балясный',
    cik: '0001560385', aum: 28_000e6, book: 96_400e6, position_count: 3_760,
    why: 'Мульти-стратегия под наблюдением. Сработало одно правило — необычно крупная концентрация в одном имени относительно средней позиции по книге.',
    triggers: [
      { rule: 'unusual_concentration', ticker: 'GEV', issuer: 'GE Vernova', form: '13F-HR', filed: '2026-08-14', event: '2026-06-30',
        headline: 'Одна позиция весит в 34 раза больше средней по книге — для pod-структуры это не инвентарь.',
        magnitude: 1_120e6, pct: null, latency: 52 },
    ],
  },
];

// ── generation ───────────────────────────────────────────────────────────
const nowLatency = (asOf) => days(asOf, GENERATED);

const PRICES = new Map();
function priceOf(ticker) {
  if (!PRICES.has(ticker)) PRICES.set(ticker, Math.round(between(rng(`px-${ticker}`), 11, 430) * 100) / 100);
  return PRICES.get(ticker);
}

function buildPositions(f) {
  const r = rng(f.id);
  const rows = f.pos.map(s => {
    const [ticker, issuer, sector, theme, action, flags] = s.split('|');
    const fl = (flags || '').split(/[,\s]+/).filter(Boolean);
    return { ticker, issuer, sector, theme, action: action || '', fl };
  });

  const live = rows.filter(p => p.action !== 'exited');
  // Decaying weight curve; `conc` controls how steep the top of the book is.
  // Halved into the exponent so an 11-name activist book tops out near 25%
  // rather than 50% — a top line at half the book would be a different animal.
  const raw = live.map((_, i) => 1 / Math.pow(i + 1, f.conc * 0.5));
  const sum = raw.reduce((a, b) => a + b, 0);

  const out = [];
  live.forEach((p, i) => {
    const weight = raw[i] / sum;
    const value = f.book * weight;
    const instrument = p.fl.includes('put') ? 'put' : p.fl.includes('call') ? 'call' : p.fl.includes('adr') ? 'adr' : 'common';
    // Price is seeded BY TICKER, not by fund, so the same name prices the same
    // everywhere. Otherwise the crossing view would show four funds holding one
    // security at four different prices per share.
    const price = priceOf(p.ticker);
    const shares = Math.round(value / price / 100) * 100;

    const isNew = p.action === 'new';
    let action = p.action;
    if (!action) action = r() < 0.22 ? (r() < 0.5 ? 'added' : 'trimmed') : 'hold';

    let delta = null, prior = shares;
    if (action === 'added')   { delta = round(between(r, 0.06, 0.94), 4); prior = Math.round(shares / (1 + delta)); }
    if (action === 'trimmed') { delta = -round(between(r, 0.05, 0.62), 4); prior = Math.round(shares / (1 + delta)); }
    if (isNew)                { delta = null; prior = 0; }

    const priceMove = p.fl.includes('weak')
      ? -round(between(r, 0.06, 0.38), 4)
      : round(between(r, -0.04, 0.31), 4);

    const quarters = isNew ? 1 : Math.max(1, Math.round(between(r, 2, f.persistence * 2.2)));
    const jur = p.fl.includes('ca') ? 'CA' : p.fl.includes('uk') ? 'UK' : p.fl.includes('jp') ? 'JP' : p.fl.includes('au') ? 'AU' : 'US';
    const asOf = f.style === 'thematic' ? shift(GENERATED, -1) : PERIOD.period_end;
    const filed = f.style === 'thematic' ? GENERATED : f.filed;
    const form = f.style === 'thematic' ? 'N-PORT' : '13F-HR';

    out.push({
      ticker: p.ticker, issuer: p.issuer, cusip: null,
      weight: round(weight, 5),
      shares, value_usd: Math.round(value),
      instrument, action,
      share_delta_pct: delta, prior_shares: prior,
      quarters_held: quarters,
      sector: p.sector, theme: p.theme, jurisdiction: jur,
      source_form: form, as_of: asOf, filed, latency_days: nowLatency(asOf),
      source_url: EDGAR(f.cik, form),
      price_change_pct_in_period: priceMove,
      added_into_weakness: action === 'added' && priceMove < -0.05,
    });
  });

  // Exits keep their names but carry no weight — the fund is out.
  rows.filter(p => p.action === 'exited').forEach(p => {
    const prior = Math.round(between(r, 120e3, 4.2e6) / 100) * 100;
    const asOf = PERIOD.period_end;
    out.push({
      ticker: p.ticker, issuer: p.issuer, cusip: null,
      weight: 0, shares: 0, value_usd: 0,
      instrument: p.fl.includes('adr') ? 'adr' : 'common', action: 'exited',
      share_delta_pct: -1, prior_shares: prior,
      quarters_held: Math.max(1, Math.round(between(r, 2, 14))),
      sector: p.sector, theme: p.theme, jurisdiction: 'US',
      source_form: '13F-HR', as_of: asOf, filed: f.filed, latency_days: nowLatency(asOf),
      source_url: EDGAR(f.cik, '13F-HR'),
      price_change_pct_in_period: round(between(r, -0.3, 0.2), 4),
      added_into_weakness: false,
    });
  });

  return out;
}

// ── assemble the tracked funds ───────────────────────────────────────────
const funds = FUNDS.map(f => {
  const positions = buildPositions(f);
  const live = positions.filter(p => p.action !== 'exited');
  const byWeight = live.slice().sort((a, b) => b.weight - a.weight);
  const top10 = byWeight.slice(0, 10).reduce((s, p) => s + p.weight, 0);
  const asOf = positions[0]?.as_of || PERIOD.period_end;

  const group = a => positions.filter(p => p.action === a).map(p => p.ticker);

  return {
    id: f.id, name: f.name, short_name: f.short, principal: f.principal,
    style_tag: f.style, class: 'tracked',
    cik: f.cik, aum_usd: f.aum ?? null,
    book_value_usd: Math.round(live.reduce((s, p) => s + p.value_usd, 0)),
    position_count: live.length,
    as_of: asOf, filed: f.filed,
    source_form: f.style === 'thematic' ? 'N-PORT' : '13F-HR',
    latency_days: nowLatency(asOf),
    sparse_coverage: !!f.sparse,
    why_tracked: P(f.why), focus: P(f.focus), strategy: P(f.strategy),
    conviction: {
      score: f.score,
      top10_concentration: round(top10, 4),
      avg_persistence_quarters: f.persistence,
      turnover: f.turnover,
      added_into_weakness: positions.filter(p => p.added_into_weakness).map(p => p.ticker),
    },
    activity: { new: group('new'), added: group('added'), trimmed: group('trimmed'), exited: group('exited') },
    positions,
    stakes: (f.stakes || []).map(s => ({
      issuer: s.issuer, ticker: s.ticker, form: s.form,
      pct_outstanding: s.pct, filed: s.filed, event_date: s.event,
      latency_days: days(s.event, GENERATED),
      activist: s.activist, intent: P(s.intent), source_url: EDGAR(f.cik, s.form),
    })),
    shorts: (f.shorts || []).map(s => ({
      issuer: s.issuer, isin: s.isin, jurisdiction: s.jur, register: s.register,
      pct_short: s.pct, as_of: s.as_of, latency_days: nowLatency(s.as_of),
      direction: s.dir,
      source_url: s.jur === 'UK'
        ? 'https://www.fca.org.uk/publication/data/short-positions-daily-update.xlsx'
        : 'https://www.bundesanzeiger.de/pub/en/nlp',
    })),
    returns: f.returns.map(([year, pct]) => ({
      year, pct, provisional: year === 2026,
      source_url: year === 2026 ? null : EDGAR(f.cik, '13F-HR'),
    })),
    entities: [{ name: f.name, cik: f.cik, role: 'parent' }],
    logo_key: `fund:${f.short}`,
  };
});

const watch = WATCH.map(w => ({
  id: w.id, name: w.name, short_name: w.short, principal: w.principal,
  style_tag: 'multi_strategy', class: 'watch',
  cik: w.cik, aum_usd: w.aum, book_value_usd: w.book, position_count: w.position_count,
  as_of: PERIOD.period_end, filed: '2026-08-14', source_form: '13F-HR',
  latency_days: nowLatency(PERIOD.period_end),
  sparse_coverage: false,
  why_tracked: P(w.why), focus: null, strategy: null,
  conviction: null, activity: null, positions: [], stakes: [], shorts: [], returns: [],
  entities: [{ name: w.name, cik: w.cik, role: 'parent' }],
  logo_key: `fund:${w.short}`,
  triggers: w.triggers.map(t => ({
    rule: t.rule, ticker: t.ticker, issuer: t.issuer, form: t.form,
    filed: t.filed, event_date: t.event, latency_days: t.latency,
    headline: P(t.headline), magnitude_usd: t.magnitude, pct_outstanding: t.pct,
    source_url: EDGAR(w.cik, t.form),
  })),
}));

// ── the timeline ─────────────────────────────────────────────────────────
const events = [];
const ev = (o) => events.push(o);

funds.forEach(f => {
  ev({
    id: `${f.id}-13f-${PERIOD.period}`, date: f.filed, fund_id: f.id, fund: f.short_name,
    type: f.source_form === 'N-PORT' ? 'n_port' : '13f',
    ticker: null,
    headline: f.source_form === 'N-PORT'
      ? `Ежедневное раскрытие: книга на ${f.as_of}, ${f.position_count} позиций`
      : `13F за ${PERIOD.period}: ${f.position_count} позиций, ${f.activity.new.length} новых, ${f.activity.exited.length} закрытых`,
    magnitude_usd: f.book_value_usd,
    latency_days: f.latency_days, source_form: f.source_form,
    source_url: EDGAR(f.cik, f.source_form), loud: false,
  });
  f.stakes.forEach((s, i) => ev({
    id: `${f.id}-stake-${i}`, date: s.filed, fund_id: f.id, fund: f.short_name,
    type: s.form.startsWith('SC 13D') ? '13d' : '13g',
    ticker: s.ticker,
    headline: `${s.form} по ${s.issuer} — ${(s.pct_outstanding * 100).toFixed(1)}% выпуска${s.activist ? ', заявлено намерение по Item 4' : ', пассивная форма'}`,
    magnitude_usd: null, latency_days: s.latency_days, source_form: s.form,
    source_url: s.source_url, loud: s.activist,
  }));
  f.shorts.forEach((s, i) => ev({
    id: `${f.id}-short-${i}`, date: s.as_of, fund_id: f.id, fund: f.short_name,
    type: 'short_register', ticker: null,
    headline: `${s.register}: короткая позиция ${(s.pct_short * 100).toFixed(2)}% в ${s.issuer}`,
    magnitude_usd: null, latency_days: s.latency_days, source_form: 'Short register',
    source_url: s.source_url, loud: true,
  }));
});

// ARK publishes trades daily — the only fast lane among the tracked fourteen.
const arkFund = funds.find(f => f.id === 'ark');
const arkR = rng('ark-trades');
['TEM', 'COIN', 'RKLB', 'TSLA', 'PATH', 'BEAM', 'DKNG', 'IONQ'].forEach((t, i) => {
  const p = arkFund.positions.find(x => x.ticker === t);
  const dir = p && p.action === 'trimmed' ? 'продажа' : 'покупка';
  ev({
    id: `ark-trade-${t}`, date: shift(GENERATED, -i), fund_id: 'ark', fund: 'ARK Invest',
    type: 'ark_trade', ticker: t,
    headline: `Дневная сделка: ${dir} ${t} — ${p?.issuer || t}`,
    magnitude_usd: Math.round(between(arkR, 4e6, 92e6)),
    latency_days: 1, source_form: 'N-PORT', source_url: EDGAR(arkFund.cik, 'N-PORT'), loud: false,
  });
});

watch.forEach(w => w.triggers.forEach((t, i) => ev({
  id: `${w.id}-trigger-${i}`, date: t.filed, fund_id: w.id, fund: w.short_name,
  type: t.form === '13F-HR/A' ? '13f_amendment' : t.form === '4' ? 'form4' : t.form === 'TR-1' ? 'tr1' : 'watch_trigger',
  ticker: t.ticker, headline: t.headline, magnitude_usd: t.magnitude_usd,
  latency_days: t.latency_days, source_form: t.form, source_url: t.source_url, loud: true,
})));

// A confidential-treatment release from a tracked fund — the rarest 13F event.
ev({
  id: 'baupost-13fa', date: '2026-08-17', fund_id: 'baupost', fund: 'Baupost',
  type: '13f_amendment', ticker: 'GRAL',
  headline: P('Поправка 13F-HR/A: снят режим конфиденциальности с позиции, накопленной в I квартале'),
  magnitude_usd: 340e6, latency_days: 139, source_form: '13F-HR/A',
  source_url: EDGAR('0001061768', '13F-HR/A'), loud: true,
});
ev({
  id: 'pershing-form4-hhh', date: '2026-08-06', fund_id: 'pershing-square', fund: 'Pershing Square',
  type: 'form4', ticker: 'HHH',
  headline: P('Form 4: докупка HHH как 10%-владельцем — два дня от сделки до раскрытия'),
  magnitude_usd: 118e6, latency_days: 2, source_form: '4',
  source_url: EDGAR('0001336528', '4'), loud: false,
});
ev({
  id: 'valueact-tr1-grfs', date: '2026-08-04', fund_id: 'valueact', fund: 'ValueAct',
  type: 'tr1', ticker: 'GRFS',
  headline: P('TR-1 (CNMV): пересечение 5% голосующих прав в Grifols — вне периметра 13F'),
  magnitude_usd: 214e6, latency_days: 3, source_form: 'TR-1',
  source_url: 'https://www.cnmv.es/portal/Consultas/BusquedaPorEntidad.aspx', loud: true,
});

events.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

// ── securities: the full institutional holder table ──────────────────────
// The tracked fourteen are a sliver of any register. This is what says whether
// a fund is early or late relative to the whole institutional base.
const BIG = [
  'The Vanguard Group', 'BlackRock, Inc.', 'State Street Corporation',
  'FMR LLC (Fidelity)', 'Geode Capital Management', 'T. Rowe Price',
  'Capital Research Global Investors', 'Norges Bank Investment Management',
  'Wellington Management', 'Invesco Ltd.', 'J.P. Morgan Asset Management',
  'Morgan Stanley Investment Management', 'UBS Asset Management',
  'Northern Trust Corporation', 'Bank of America Corporation', 'Goldman Sachs Group',
];

const byTicker = new Map();
funds.forEach(f => f.positions.forEach(p => {
  if (p.action === 'exited') return;
  if (!byTicker.has(p.ticker)) byTicker.set(p.ticker, { issuer: p.issuer, holders: [] });
  byTicker.get(p.ticker).holders.push({ fund: f, pos: p });
}));

const securities = {};
byTicker.forEach((v, ticker) => {
  const r = rng(`sec-${ticker}`);
  const crowded = v.holders.length;
  const trackedShares = v.holders.reduce((s, h) => s + h.pos.shares, 0);
  // Outstanding sized so the tracked block lands somewhere plausible (0.4–6%).
  const outstanding = Math.round(trackedShares / between(r, 0.004, 0.06));
  const deep = crowded >= 2;

  const holders = v.holders.map(({ fund, pos }) => ({
    holder: fund.short_name, fund_id: fund.id, tracked: true,
    shares: pos.shares, value_usd: pos.value_usd,
    pct_outstanding: round(pos.shares / outstanding, 6),
    change_shares: pos.action === 'new' ? pos.shares : pos.shares - pos.prior_shares,
    change_pct: pos.share_delta_pct,
    action: pos.action,
    filed: pos.filed, source_form: pos.source_form, latency_days: pos.latency_days,
  }));

  BIG.slice(0, deep ? BIG.length : 8).forEach((name, i) => {
    const share = between(r, 0.004, 0.092) / (1 + i * 0.22);
    const shares = Math.round(outstanding * share);
    const chg = round(between(r, -0.14, 0.19), 4);
    holders.push({
      holder: name, fund_id: null, tracked: false,
      shares, value_usd: null,
      pct_outstanding: round(share, 6),
      change_shares: Math.round(shares * chg / (1 + chg)),
      change_pct: chg,
      action: chg > 0.02 ? 'added' : chg < -0.02 ? 'trimmed' : 'hold',
      filed: '2026-08-14', source_form: '13F-HR', latency_days: nowLatency(PERIOD.period_end),
    });
  });

  holders.sort((a, b) => b.pct_outstanding - a.pct_outstanding);
  securities[ticker] = {
    ticker, issuer: v.issuer,
    shares_outstanding: outstanding,
    tracked_holders: crowded,
    holders,
  };
});

// ── file ─────────────────────────────────────────────────────────────────
const all = [...funds, ...watch];
const payload = {
  schema: P('fund-tracker/1'),
  version: P('1.0'),
  generated: GENERATED,
  fixture: true,
  fixture_note: P('Синтетические данные. Все числа выдуманы и не являются реальными формами. Файл заменяется поставкой движка (fixture: false) без правки кода.'),
  cycle: PERIOD,
  guards: {
    min_weight_for_delta: 0.005,
    min_weight_note: P('Процентное изменение на позиции легче 0,5% книги не показывается: крупный процент на крошечной строке драматичен и ничего не значит.'),
    stale_after_days: 45,
    very_stale_after_days: 90,
  },
  style_tags: STYLE_TAGS,
  sectors: SECTORS,
  themes: THEMES,
  totals: {
    funds: funds.length,
    watch: watch.length,
    positions: funds.reduce((s, f) => s + f.position_count, 0),
    book_value_usd: funds.reduce((s, f) => s + f.book_value_usd, 0),
    events: events.length,
    stakes: funds.reduce((s, f) => s + f.stakes.length, 0),
    shorts: funds.reduce((s, f) => s + f.shorts.length, 0),
    securities: Object.keys(securities).length,
  },
  funds: all,
  events,
  securities,
};

writeFileSync(new URL('../src/data/fundTracker.json', import.meta.url), JSON.stringify(payload, null, 1));
console.log(
  `fundTracker.json — ${funds.length} tracked + ${watch.length} watch · ` +
  `${payload.totals.positions} positions · ${events.length} events · ` +
  `${payload.totals.securities} securities`
);
