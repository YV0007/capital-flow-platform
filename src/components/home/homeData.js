// ══════════════════════════════════════════════════════════════════════════
// Home landing — data selectors.
//
// Everything the landing page shows is DERIVED here from the same committed
// data files the full pages render (capitalMap.json via buildGraph, the
// holdings-v2 company files, dc-buckets/dc-companies). Nothing is fetched,
// nothing is invented: the home page is a teaser layer over real data, and
// refreshes automatically whenever a new weekly file lands.
// ══════════════════════════════════════════════════════════════════════════

import { buildGraph, SECTOR_META } from '../../data/capitalMap.js';
import { fmtUSD } from '../research/capitalflow/format.js';
import logoManifest from '../../data/logoManifest.json';
import holdingsIndex from '../../data/holdings.json';

import brookfield from '../../data/holdings-v2/brookfield.json';
import softbank from '../../data/holdings-v2/softbank.json';
import kkr from '../../data/holdings-v2/kkr.json';
import blackrock from '../../data/holdings-v2/blackrock.json';
import berkshire from '../../data/holdings-v2/berkshire.json';
import pershing from '../../data/holdings-v2/pershing.json';
import fairfax from '../../data/holdings-v2/fairfax.json';
import tpg from '../../data/holdings-v2/tpg.json';
import constellation from '../../data/holdings-v2/constellation.json';

import dcBuckets from '../../data/dc-buckets.json';
import dcCompanies from '../../data/dc-companies.json';

// ── Bilingual display layer ──────────────────────────────────────────────
// The home page is a teaser over English data files, so every label is
// composed here, at the edge, in BOTH languages — natural wording in each, no
// literal calques. Selectors emit `{ ru, en }` pairs rather than resolved
// strings, because this module is evaluated once at load, long before any
// component knows which language is active. The components resolve with
// `useL()` and repaint on a language flip.

/** Russian plural: ruPlural(3, ['сделка', 'сделки', 'сделок']) → «сделки». */
export function ruPlural(n, [one, few, many]) {
  const abs = Math.abs(Math.round(n));
  const d10 = abs % 10; const d100 = abs % 100;
  if (d10 === 1 && d100 !== 11) return one;
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return few;
  return many;
}

/** Builds a `{ ru, en }` pair, tolerating a missing English side. */
const pair = (ru, en) => ({ ru, en: en ?? ru });

const SECTOR_L = {
  'ai-labs':          pair('AI-лаборатории', 'AI labs'),
  'ai-data':          pair('Платформы данных', 'Data platforms'),
  'ai-applications':  pair('AI-приложения', 'AI applications'),
  'ai-compute':       pair('AI-вычисления', 'AI compute'),
  'semiconductors':   pair('Полупроводники', 'Semiconductors'),
  'fab-equipment':    pair('Оборудование для чипов', 'Fab equipment'),
  'cloud-hyperscale': pair('Облака', 'Hyperscale cloud'),
  'neocloud':         pair('GPU-облака', 'Neocloud'),
  'datacenters':      pair('Дата-центры', 'Data centers'),
  'power-energy':     pair('Энергетика', 'Power & energy'),
  'nuclear':          pair('Атомная энергетика', 'Nuclear'),
  'networking':       pair('Сети', 'Networking'),
  'robotics':         pair('Робототехника', 'Robotics'),
  'defense-tech':     pair('Оборонные технологии', 'Defense tech'),
  'cybersecurity':    pair('Кибербезопасность', 'Cybersecurity'),
  'ev-automotive':    pair('Электромобили', 'EV & automotive'),
  'private-credit':   pair('Частный кредит', 'Private credit'),
  'diversified-pe':   pair('Private equity', 'Private equity'),
};

const CLASS_L = {
  corporate:   pair('Корпорация', 'Corporate'),
  vc:          pair('Венчурный фонд', 'Venture fund'),
  alt_manager: pair('Управляющий активами', 'Asset manager'),
  sovereign:   pair('Суверенный фонд', 'Sovereign fund'),
  individual:  pair('Частный инвестор', 'Individual'),
  private:     pair('Частная компания', 'Private company'),
  public:      pair('Публичная компания', 'Public company'),
  fund:        pair('Фонд', 'Fund'),
  project:     pair('Проект', 'Project'),
  asset:       pair('Актив', 'Asset'),
};

const EVENT_L = {
  equity:               pair('Покупка доли', 'Equity stake'),
  // «Миноритарная доля» — термин, который приходится знать заранее. Тот же
  // смысл словами, которые понятны с первого раза: купили часть, но не
  // управляют. Английское minority stake — обиходное, его не трогаем.
  minority_stake:       pair('Доля без контроля', 'Minority stake'),
  funding_round:        pair('Раунд финансирования', 'Funding round'),
  corporate_investment: pair('Корпоративная инвестиция', 'Corporate investment'),
  follow_on:            pair('Доинвестирование', 'Follow-on'),
  project_finance:      pair('Проектное финансирование', 'Project finance'),
  acquisition:          pair('Поглощение', 'Acquisition'),
  fund_launch:          pair('Запуск фонда', 'Fund launch'),
  spv:                  pair('SPV', 'SPV'),
  grant:                pair('Грант', 'Grant'),
  sovereign_investment: pair('Суверенная инвестиция', 'Sovereign investment'),
};

const STATUS_L = {
  verified:       pair('Подтверждено', 'Verified'),
  verified_alpha: pair('Альфа-сигнал', 'Alpha signal'),
  candidate:      pair('Кандидат', 'Candidate'),
};
const STATUS_COLOR = { verified: '#34D399', verified_alpha: '#FBBF24', candidate: '#94A3B8' };

const RULE_L = {
  sector_swarm:                pair('Приток капитала в сектор', 'Sector swarm'),
  theme_swarm:                 pair('Приток капитала в тему', 'Theme swarm'),
  smart_money_follow:          pair('Умные деньги ведут', 'Smart money leads'),
  beneficiary_concentration:   pair('Публичный бенефициар', 'Public beneficiary'),
  stealth_accumulation:        pair('Тихое накопление', 'Stealth accumulation'),
  repeat_conviction:           pair('Повторная ставка', 'Repeat conviction'),
  network_convergence:         pair('Сеть сходится на цели', 'Network converges on a target'),
  defense_network_convergence: pair('Оборонная сеть сходится', 'Defense network converges'),
};

// One natural sentence per deal, in each language, composed strictly from what
// the engine reports — who, what kind of event, into what, how much, sector.
function readPair(allocName, targetName, eventType, amountUSD, disclosed, sectorLabel) {
  const amt = disclosed ? ` — ${fmtUSD(amountUSD)}` : '';
  const amtEn = disclosed ? ` — ${fmtUSD(amountUSD, 'en')}` : '';

  const ru = {
    acquisition:          `${allocName} поглощает ${targetName}`,
    fund_launch:          `${allocName} запускает фонд «${targetName}»`,
    funding_round:        `${allocName} участвует в раунде ${targetName}`,
    project_finance:      `${allocName} финансирует проект: ${targetName}`,
    corporate_investment: `${allocName} инвестирует в ${targetName}`,
    sovereign_investment: `${allocName} вкладывает в ${targetName}`,
    follow_on:            `${allocName} доинвестирует в ${targetName}`,
    minority_stake:       `${allocName} покупает долю в ${targetName}`,
    equity:               `${allocName} покупает долю в ${targetName}`,
    grant:                `${allocName} выдаёт грант: ${targetName}`,
    spv:                  `${allocName} формирует SPV: ${targetName}`,
  };
  const en = {
    acquisition:          `${allocName} acquires ${targetName}`,
    fund_launch:          `${allocName} launches the ${targetName} fund`,
    funding_round:        `${allocName} joins ${targetName}'s round`,
    project_finance:      `${allocName} finances the ${targetName} project`,
    corporate_investment: `${allocName} invests in ${targetName}`,
    sovereign_investment: `${allocName} puts capital into ${targetName}`,
    follow_on:            `${allocName} follows on in ${targetName}`,
    minority_stake:       `${allocName} takes a stake in ${targetName}`,
    equity:               `${allocName} takes a stake in ${targetName}`,
    grant:                `${allocName} awards a grant: ${targetName}`,
    spv:                  `${allocName} forms an SPV: ${targetName}`,
  };

  // Mid-sentence the Russian sector reads lowercase («…игры»), but labels that
  // open with an acronym (AI-, GPU-…) keep their case. English keeps its own.
  const ruSec = sectorLabel?.ru || '';
  const lowered = /^[А-ЯЁ][а-яё]/.test(ruSec) ? ruSec[0].toLowerCase() + ruSec.slice(1) : ruSec;
  return {
    ru: `${ru[eventType] || `${allocName} → ${targetName}`}${amt}.${ruSec ? ` Сектор — ${lowered}.` : ''}`,
    en: `${en[eventType] || `${allocName} → ${targetName}`}${amtEn}.${sectorLabel?.en ? ` Sector: ${sectorLabel.en}.` : ''}`,
  };
}

// ── Capital Flow graph (same shaping the full map uses) ──────────────────
const graph = buildGraph();
const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));

export const GENERATED = graph.generated;

// The "week" = the 7 days ending on the most recent flow date in the file.
const lastDate = graph.links.reduce((m, l) => (l.date > m ? l.date : m), '');
const weekStart = (() => {
  const d = new Date(`${lastDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 6);
  return d.toISOString().slice(0, 10);
})();

const weekFlows = graph.links.filter((l) => l.date && l.date >= weekStart);

// Sector meta with a safe fallback — the engine occasionally ships a sector
// this map doesn't know yet; style it neutrally.
export function sectorMetaOf(key) {
  const titled = String(key || 'other')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  const label = SECTOR_L[key] || pair(key ? titled : 'Прочее', key ? titled : 'Other');
  return { label, color: SECTOR_META[key]?.color || '#8E9BE6' };
}

const STATUS_WEIGHT = { verified: 1, verified_alpha: 0.8, candidate: 0.45 };

function toHomeFlow(link) {
  const src = nodeById.get(link.sourceId);
  const tgt = nodeById.get(link.targetId);
  const sec = sectorMetaOf(link.sector);
  return {
    id: link.id,
    date: link.date,
    amountUSD: link.amountUSD,
    disclosed: link.disclosed,
    amountShare: link.amountShare,
    eventLabel: EVENT_L[link.event_type] || pair(link.eventLabel),
    sectorKey: link.sector,
    sectorLabel: sec.label,
    sectorColor: sec.color,
    statusLabel: STATUS_L[link.status] || pair(link.status),
    statusColor: STATUS_COLOR[link.status] || '#94A3B8',
    read: readPair(src.name, tgt.name, link.event_type, link.amountUSD, link.disclosed, sec.label),
    allocator: {
      name: src.name,
      clsLabel: CLASS_L[src.cls] || pair(src.cls),
      individual: src.cls === 'individual',
      logo: src.logoUrls[0] || null,
      monogram: src.monogram,
    },
    target: {
      name: tgt.name,
      clsLabel: CLASS_L[tgt.cls] || pair(tgt.cls),
      logo: tgt.logoUrls[0] || null,
      monogram: tgt.monogram,
    },
  };
}

// Top 5 pivotal flows of the week: the 4 largest institutional moves by
// status-weighted amount, plus the strongest individual-allocator move so
// both business and private capital are always represented.
export const HOME_FLOWS = (() => {
  const score = (l) => (l.amountUSD || 0) * (STATUS_WEIGHT[l.status] ?? 0.4);
  const ranked = [...weekFlows].sort((a, b) => score(b) - score(a) || (a.date < b.date ? 1 : -1));
  const isIndividual = (l) => nodeById.get(l.sourceId)?.cls === 'individual';

  const picked = ranked.slice(0, 4);
  const bestIndividual = ranked.find(
    (l) => isIndividual(l) && !picked.includes(l),
  );
  if (bestIndividual) picked.push(bestIndividual);
  else if (ranked[4]) picked.push(ranked[4]);

  return picked.map(toHomeFlow);
})();

// Per-sector weekly totals → the wave field + surge chips. `lit` and the
// signal labels come from the engine's own rules — never invented here.
export const SECTOR_SURGES = (() => {
  const acc = new Map();
  weekFlows.forEach((l) => {
    if (!l.sector) return;
    const cur = acc.get(l.sector) || { total: 0, count: 0 };
    cur.total += l.amountUSD || 0;
    cur.count += 1;
    acc.set(l.sector, cur);
  });
  const rows = [...acc.entries()].map(([key, v]) => {
    const meta = sectorMetaOf(key);
    const engineSector = graph.sectors[key];
    const signal = engineSector?.signals?.[0]?.rule || null;
    return {
      key,
      label: meta.label,
      color: meta.color,
      total: v.total,
      count: v.count,
      lit: !!engineSector?.lit,
      signalLabel: signal ? (RULE_L[signal] || pair(signal)) : null,
    };
  });
  rows.sort((a, b) => b.total - a.total);
  const max = Math.max(1, ...rows.map((r) => r.total));
  rows.forEach((r) => { r.share = r.total / max; });
  return rows;
})();

export const WEEK_STATS = {
  weekStart,
  weekEnd: lastDate,
  trackedUSD: weekFlows.reduce((a, l) => a + (l.disclosed ? l.amountUSD : 0), 0),
  flowCount: weekFlows.length,
  verifiedCount: weekFlows.filter((l) => l.status === 'verified').length,
  sectorCount: new Set(weekFlows.map((l) => l.sector).filter(Boolean)).size,
  signalCount: graph.stats.signalCount,
};

// ── Holdings — top 5 + merged news feed ──────────────────────────────────
const HOLDINGS_BY_ID = {
  brookfield, softbank, kkr, blackrock, berkshire,
  pershing, fairfax, tpg, constellation,
};

export const HOLDING_ACCENTS = {
  brookfield: '#2FD9C4', softbank: '#8E9BE6', kkr: '#5A93DE',
  blackrock: '#4FA6E0', berkshire: '#C9985F', pershing: '#9A8FD2',
  fairfax: '#49C2AE', tpg: '#F5B942', constellation: '#58ABCB',
};

// Reuse the pre-fetched capital-map brand logos when the holding is also a
// tracked allocator (Brookfield, KKR, BlackRock, SoftBank, Berkshire…).
function holdingLogo(name) {
  const t = String(name).toLowerCase();
  const exact = Object.keys(logoManifest).find(
    (k) => k.startsWith('alloc:') && k.slice(6).toLowerCase() === t,
  );
  const loose = exact || Object.keys(logoManifest).find(
    (k) => k.startsWith('alloc:') && k.slice(6).toLowerCase().includes(t),
  );
  return loose ? logoManifest[loose] : null;
}

function monogram(name) {
  const words = String(name || '').replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/);
  if (!words.length || !words[0]) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const isDownChange = (s) => /[−-]/.test(String(s || ''));

const HOLDING_TYPE_L = {
  'asset manager':      pair('управляющий активами', 'asset manager'),
  'vision-fund holdco': pair('холдинг Vision Fund', 'Vision Fund holdco'),
  'true holdco':        pair('классический холдинг', 'true holdco'),
  'insurance holdco':   pair('страховой холдинг', 'insurance holdco'),
};

export const TOP_HOLDINGS = (holdingsIndex.HOLDING_COMPANIES_ORDER || [])
  .slice(0, 5)
  .map((id) => HOLDINGS_BY_ID[id])
  .filter(Boolean)
  .map((h) => ({
    id: h.id,
    name: h.name,
    ticker: h.ticker,
    type: HOLDING_TYPE_L[h.type] || pair(h.type),
    tagline: h.tagline,
    asOf: h.asOf,
    price: h.priceChart?.current || '—',
    change: h.priceChart?.change || '',
    down: isDownChange(h.priceChart?.change),
    period: h.priceChart?.period || '1Y',
    points: Array.isArray(h.priceChart?.points) ? h.priceChart.points : [],
    accent: HOLDING_ACCENTS[h.id] || '#2FD9C4',
    logo: holdingLogo(h.name),
    monogram: monogram(h.name),
  }));

// Merged news across ALL holdings, newest first. Dates are DD.MM.YYYY.
function parseDDMMYYYY(s) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(s || '').trim());
  if (!m) return 0;
  return Date.UTC(+m[3], +m[2] - 1, +m[1]);
}

export const HOLDINGS_NEWS = Object.values(HOLDINGS_BY_ID)
  .flatMap((h) => (Array.isArray(h.news) ? h.news : []).map((n) => ({
    ...n,
    holdingId: h.id,
    holdingName: h.name,
    accent: HOLDING_ACCENTS[h.id] || '#2FD9C4',
    ts: parseDDMMYYYY(n.date),
  })))
  .sort((a, b) => b.ts - a.ts)
  .slice(0, 12);

// ── Data-center supply chain — carousel cards ────────────────────────────
// Hand-written Russian names + teaser lines per bucket (editorial,
// dashboard-side — same role as flowNotes.json), each grounded in the
// bucket's full `why` text.
const BUCKET_L = {
  'Power & Grid':             pair('Энергия и сеть', 'Power & Grid'),
  'Compute & Silicon':        pair('Вычисления и кремний', 'Compute & Silicon'),
  'Memory & Storage':         pair('Память и хранение', 'Memory & Storage'),
  'Materials & Chemicals':    pair('Материалы и химия', 'Materials & Chemicals'),
  'Connectivity & Photonics': pair('Сети и фотоника', 'Connectivity & Photonics'),
  'Construction & Labor':     pair('Стройка и кадры', 'Construction & Labor'),
  'Cooling & Thermal':        pair('Охлаждение', 'Cooling & Thermal'),
  'Fab & Test Equipment':     pair('Оборудование фабрик', 'Fab & Test Equipment'),
  'Software & Apps':          pair('Софт и приложения', 'Software & Apps'),
};

const BUCKET_TEASERS = {
  'Power & Grid': pair(
    'Электричество теперь дефицитнее чипов — главное узкое место всей стройки.',
    'Electricity is now scarcer than silicon — the binding constraint on the whole build-out.'),
  'Compute & Silicon': pair(
    'Куда стянулся капитал: дуополия EDA, заказные ASIC и вся GPU-машина.',
    'Where the capital pooled: the EDA duopoly, custom ASICs and the entire GPU machine.'),
  'Memory & Storage': pair(
    'HBM — уже ~63% себестоимости AI-чипа. Триополия, распроданная на годы вперёд.',
    'HBM is already ~63% of an AI chip\'s bill of materials. A triopoly, sold out years ahead.'),
  'Materials & Chemicals': pair(
    'Тихие почти-монополии: электротехническая сталь, фоторезисты, компоненты HBM.',
    'Quiet near-monopolies: electrical steel, photoresists, HBM components.'),
  'Connectivity & Photonics': pair(
    'Половина дата-центра, которая гоняет биты: коммутаторы, межсоединения, оптика 1.6T.',
    'The half of the data center that moves the bits: switches, interconnect, 1.6T optics.'),
  'Construction & Labor': pair(
    'Кампусу на 1 ГВт нужно 3000+ электриков одновременно — столько рынок дать не может.',
    'A 1 GW campus needs 3,000+ electricians at once — more than the trade can supply.'),
  'Cooling & Thermal': pair(
    'Стойки на 120 кВт исчерпали воздушное охлаждение — переход на жидкость неизбежен.',
    '120 kW racks have exhausted air cooling — the move to liquid is not optional.'),
  'Fab & Test Equipment': pair(
    'Кирки и лопаты чиповой индустрии: литография, осаждение, контроль и тесты.',
    'The picks and shovels of the chip industry: lithography, deposition, metrology and test.'),
  'Software & Apps': pair(
    'Слой спроса — тот, кто в итоге оплачивает триллионные капзатраты.',
    'The demand layer — whoever ultimately pays for the trillion-dollar capex.'),
};

const CONV_RANK = Object.fromEntries(
  (dcBuckets.DC_CONVICTION_ORDER || []).map((c, i) => [c, i]),
);

export const SUPPLY_CHAIN_CARDS = Object.entries(dcBuckets.DC_BUCKETS || {}).map(
  ([name, b]) => {
    const members = dcCompanies
      .filter((c) => b.sectors.includes(c.sector))
      .sort((x, y) => (CONV_RANK[x.conviction] ?? 9) - (CONV_RANK[y.conviction] ?? 9));
    const topRecord = members.find((c) => c.company === b.topCompany);
    const second = members.find((c) => c.company !== b.topCompany);
    const companies = [
      { name: b.topCompany, ticker: topRecord?.ticker || b.topTicker },
      ...(second ? [{ name: second.company, ticker: second.ticker }] : []),
    ];
    return {
      // Stable identity for React keys and lookups — the label is a {ru,en}
      // pair now and cannot serve as one.
      key: name,
      name: BUCKET_L[name] || pair(name),
      color: b.color,
      companies,
      teaser: BUCKET_TEASERS[name] || pair((b.why || '').split('. ')[0] + '.'),
      companyCount: members.length,
      sectorCount: b.sectors.length,
    };
  },
);
