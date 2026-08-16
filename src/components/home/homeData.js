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

// ── Russian display layer ────────────────────────────────────────────────
// The home page renders fully in Russian. The underlying data files stay
// English (they feed the full research pages too), so all translation
// happens here, at the edge — natural wording, no literal calques.

/** Russian plural: ruPlural(3, ['сделка', 'сделки', 'сделок']) → «сделки». */
export function ruPlural(n, [one, few, many]) {
  const abs = Math.abs(Math.round(n));
  const d10 = abs % 10; const d100 = abs % 100;
  if (d10 === 1 && d100 !== 11) return one;
  if (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) return few;
  return many;
}

const SECTOR_RU = {
  'ai-labs': 'AI-лаборатории',
  'ai-data': 'Платформы данных',
  'ai-applications': 'AI-приложения',
  'ai-compute': 'AI-вычисления',
  'semiconductors': 'Полупроводники',
  'fab-equipment': 'Оборудование для чипов',
  'cloud-hyperscale': 'Облака',
  'neocloud': 'GPU-облака',
  'datacenters': 'Дата-центры',
  'power-energy': 'Энергетика',
  'nuclear': 'Атомная энергетика',
  'networking': 'Сети',
  'robotics': 'Робототехника',
  'defense-tech': 'Оборонные технологии',
  'cybersecurity': 'Кибербезопасность',
  'ev-automotive': 'Электромобили',
  'private-credit': 'Частный кредит',
  'diversified-pe': 'Private equity',
};

const CLASS_RU = {
  corporate: 'Корпорация',
  vc: 'Венчурный фонд',
  alt_manager: 'Управляющий активами',
  sovereign: 'Суверенный фонд',
  individual: 'Частный инвестор',
  private: 'Частная компания',
  public: 'Публичная компания',
  fund: 'Фонд',
  project: 'Проект',
  asset: 'Актив',
};

const EVENT_RU = {
  equity: 'Покупка доли',
  minority_stake: 'Миноритарная доля',
  funding_round: 'Раунд финансирования',
  corporate_investment: 'Корпоративная инвестиция',
  follow_on: 'Доинвестирование',
  project_finance: 'Проектное финансирование',
  acquisition: 'Поглощение',
  fund_launch: 'Запуск фонда',
  spv: 'SPV',
  grant: 'Грант',
  sovereign_investment: 'Суверенная инвестиция',
};

const STATUS_RU = {
  verified: 'Подтверждено',
  verified_alpha: 'Альфа-сигнал',
  candidate: 'Кандидат',
};
const STATUS_COLOR = { verified: '#34D399', verified_alpha: '#FBBF24', candidate: '#94A3B8' };

const RULE_RU = {
  sector_swarm: 'Приток капитала в сектор',
  theme_swarm: 'Наплыв в тему',
  smart_money_follow: 'За умными деньгами',
  beneficiary_concentration: 'Публичный бенефициар',
  stealth_accumulation: 'Тихое накопление',
  repeat_conviction: 'Повторная ставка',
  network_convergence: 'Сеть сходится на цели',
  defense_network_convergence: 'Оборонная сеть сходится',
};

// One natural Russian sentence per deal, composed strictly from what the
// engine reports — who, what kind of event, into what, how much, sector.
function ruRead(allocName, targetName, eventType, amountUSD, disclosed, sectorRuLabel) {
  const amt = disclosed ? ` — ${fmtUSD(amountUSD)}` : '';
  const verbs = {
    acquisition: `${allocName} поглощает ${targetName}`,
    fund_launch: `${allocName} запускает фонд «${targetName}»`,
    funding_round: `${allocName} участвует в раунде ${targetName}`,
    project_finance: `${allocName} финансирует проект: ${targetName}`,
    corporate_investment: `${allocName} инвестирует в ${targetName}`,
    sovereign_investment: `${allocName} вкладывает в ${targetName}`,
    follow_on: `${allocName} доинвестирует в ${targetName}`,
    minority_stake: `${allocName} покупает долю в ${targetName}`,
    equity: `${allocName} покупает долю в ${targetName}`,
    grant: `${allocName} выдаёт грант: ${targetName}`,
    spv: `${allocName} формирует SPV: ${targetName}`,
  };
  const base = verbs[eventType] || `${allocName} → ${targetName}`;
  // Mid-sentence the sector reads lowercase («…игры»), but labels that open
  // with an acronym (AI-, GPU-…) keep their case.
  const secLabel = /^[А-ЯЁ][а-яё]/.test(sectorRuLabel || '')
    ? sectorRuLabel[0].toLowerCase() + sectorRuLabel.slice(1)
    : sectorRuLabel;
  const sec = sectorRuLabel ? ` Сектор — ${secLabel}.` : '';
  return `${base}${amt}.${sec}`;
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
  const label = SECTOR_RU[key] || String(key || 'Прочее')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
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
    eventLabel: EVENT_RU[link.event_type] || link.eventLabel,
    sectorKey: link.sector,
    sectorLabel: sec.label,
    sectorColor: sec.color,
    statusLabel: STATUS_RU[link.status] || link.status,
    statusColor: STATUS_COLOR[link.status] || '#94A3B8',
    read: ruRead(src.name, tgt.name, link.event_type, link.amountUSD, link.disclosed, sec.label),
    allocator: {
      name: src.name,
      clsLabel: CLASS_RU[src.cls] || src.cls,
      individual: src.cls === 'individual',
      logo: src.logoUrls[0] || null,
      monogram: src.monogram,
    },
    target: {
      name: tgt.name,
      clsLabel: CLASS_RU[tgt.cls] || tgt.cls,
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
      signalLabel: signal ? (RULE_RU[signal] || signal) : null,
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

const HOLDING_TYPE_RU = {
  'asset manager': 'управляющий активами',
  'vision-fund holdco': 'холдинг Vision Fund',
  'true holdco': 'классический холдинг',
  'insurance holdco': 'страховой холдинг',
};

export const TOP_HOLDINGS = (holdingsIndex.HOLDING_COMPANIES_ORDER || [])
  .slice(0, 5)
  .map((id) => HOLDINGS_BY_ID[id])
  .filter(Boolean)
  .map((h) => ({
    id: h.id,
    name: h.name,
    ticker: h.ticker,
    type: HOLDING_TYPE_RU[h.type] || h.type,
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
const BUCKET_RU = {
  'Power & Grid': 'Энергия и сеть',
  'Compute & Silicon': 'Вычисления и кремний',
  'Memory & Storage': 'Память и хранение',
  'Materials & Chemicals': 'Материалы и химия',
  'Connectivity & Photonics': 'Сети и фотоника',
  'Construction & Labor': 'Стройка и кадры',
  'Cooling & Thermal': 'Охлаждение',
  'Fab & Test Equipment': 'Оборудование фабрик',
  'Software & Apps': 'Софт и приложения',
};

const BUCKET_TEASERS = {
  'Power & Grid': 'Электричество теперь дефицитнее чипов — главное узкое место всей стройки.',
  'Compute & Silicon': 'Куда стянулся капитал: дуополия EDA, заказные ASIC и вся GPU-машина.',
  'Memory & Storage': 'HBM — уже ~63% себестоимости AI-чипа. Триополия, распроданная на годы вперёд.',
  'Materials & Chemicals': 'Тихие почти-монополии: электротехническая сталь, фоторезисты, компоненты HBM.',
  'Connectivity & Photonics': 'Половина дата-центра, которая гоняет биты: коммутаторы, межсоединения, оптика 1.6T.',
  'Construction & Labor': 'Кампусу на 1 ГВт нужно 3000+ электриков одновременно — столько рынок дать не может.',
  'Cooling & Thermal': 'Стойки на 120 кВт исчерпали воздушное охлаждение — переход на жидкость неизбежен.',
  'Fab & Test Equipment': 'Кирки и лопаты чиповой индустрии: литография, осаждение, контроль и тесты.',
  'Software & Apps': 'Слой спроса — тот, кто в итоге оплачивает триллионные капзатраты.',
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
      name: BUCKET_RU[name] || name,
      color: b.color,
      companies,
      teaser: BUCKET_TEASERS[name] || (b.why || '').split('. ')[0] + '.',
      companyCount: members.length,
      sectorCount: b.sectors.length,
    };
  },
);
