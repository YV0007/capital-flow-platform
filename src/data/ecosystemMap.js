// ══════════════════════════════════════════════════════════════════════════
// ECOSYSTEM MAP — data adapter
//
// Sibling of capitalMap.js, and the same deal: ONE file is the contract.
//
//   engine (monthly: 6 agents → verify → SQLite → score → cycles)
//        → handoff/ecosystem_map.json
//        → src/data/ecosystemMap.json
//        → here
//
// The flow map answers "where did the money go last week". This one answers
// "how is the industry built and who holds it". Node = a COMPANY; layer
// (L1…L12) is a coordinate, not an object; edge = a standing dependency, not
// a dated event.
//
// ZERO DATA LATITUDE — stronger here than on the flow map. `criticality`,
// `gravity`, `concentration` and `cycles` are all computed UPSTREAM, by the
// engine, from the frozen rubric. This module never recomputes them, never
// second-guesses them, and never invents an edge. It attaches display meta
// (colour, label, shape) and builds the indices the canvas needs.
//
// CONTRACT (ecosystem_map.json) — frozen, see
// CAPITAL-FLOW-ECOSYSTEM-MAP-PROPOSAL.md and ecosystem/README.md
//   generated, asOf, source ("engine" | "fixture"), ecosystem
//   totals   { nodes, edges, layers, cycles }
//   layers[] { id, label, caption, band, concentration{level,hhi,top[]} } × 12
//   sectors[]{ key, label, layer, dcNode }
//   nodes[]  { id, name, role, sector, layers[{layer,primary,criticality}],
//              criticality, criticalityFactors{}, gravity{}, oneLiner,
//              whatBreaksIt, ticker, publicPrivate, geo, tier, techNodes[],
//              dcNode, firstSeen, lastConfirmed, stale }
//   techNodes[] { id, label, owner, note }
//   edges[]  { id, source, target, type, spine, strength, techNode, status,
//              tier, confirmedSources, engineConfirmed, started,
//              lastConfirmed, note, evidence[] }
//   cycles[] { id, type, path[], edges[], note }
//   changelog{ month, added[], removed[], changed[] }
// ══════════════════════════════════════════════════════════════════════════

import raw from './ecosystemMap.json';
import logoDomains from './ecosystemLogos.json';
import logoManifest from './logoManifest.json';

// ── Roles — the second dimension, orthogonal to the layer ────────────────
// Told apart by SHAPE and outline as well as colour (colour alone carries the
// layer band), so the map still reads for a colour-blind eye and in print.
export const ROLE_META = {
  producer: { label: 'Производитель', short: 'ПРОИЗВ.', color: '#6F93DE', shape: 'square',
              blurb: 'Делает физический вход стека — то, что покрыто исследованием DC-AI.' },
  owner:    { label: 'Собственник',   short: 'СОБСТВ.', color: '#49C2AE', shape: 'rounded',
              blurb: 'Владеет или эксплуатирует актив: площадки, станции, точки обмена.' },
  capital:  { label: 'Капитал',       short: 'КАПИТАЛ', color: '#C99B72', shape: 'diamond',
              blurb: 'Капитал, СОЗДАЮЩИЙ активы, — владение и проектное финансирование, а не портфельная ставка.' },
  demand:   { label: 'Спрос',         short: 'СПРОС',   color: '#8E9BE6', shape: 'circle',
              blurb: 'Конечный спрос — гиперскейлеры и лаборатории, ради которых построено всё остальное.' },
  platform: { label: 'Платформа',     short: 'ПЛАТФ.',  color: '#A46FD6', shape: 'hex',
              blurb: 'Стандарт, IP или софт внутри чужого продукта — власть без выручки с железа.' },
};

// ── Edge types — ten, on two spines ──────────────────────────────────────
// PHYSICAL spine runs cool (blue · cyan · teal): what physically moves.
// CAPITAL spine runs warm (amber · clay · rose): who owns and who pays.
// One glance separates "the thing is built" from "the thing is owned".
export const EDGE_TYPE_META = {
  supply:   { label: 'поставляет',    verb: 'поставляет',    spine: 'physical', color: '#5A93DE', order: 0,
              blurb: 'Критический физический вход: без него продукт получателя не выпускается.' },
  offtake:  { label: 'контракт',      verb: 'законтрактовал', spine: 'physical', color: '#45C0D0', order: 1,
              blurb: 'Выкуп мощности или объёма по долгосрочному договору.' },
  platform: { label: 'встроен',       verb: 'встроен в',     spine: 'physical', color: '#49C2AE', order: 2,
              blurb: 'IP, софт или стандарт внутри чужого продукта.' },
  partner:  { label: 'строит вместе', verb: 'строит вместе с', spine: 'physical', color: '#58ABCB', order: 3,
              blurb: 'Совместная разработка или СП — обе стороны вкладывают инженерию.' },
  compete:  { label: 'замещает',      verb: 'замещает',      spine: 'physical', color: '#8496B4', order: 4,
              blurb: 'Второй источник или прямая угроза доле. В первой версии движок это не собирает.' },
  owns:     { label: 'владеет',       verb: 'владеет',       spine: 'capital',  color: '#E0A340', order: 5,
              blurb: 'Контроль через собственность.' },
  stake:    { label: 'доля',          verb: 'держит долю в', spine: 'capital',  color: '#D98CA8', order: 6,
              blurb: 'Пакет без контроля.' },
  finances: { label: 'финансирует',   verb: 'финансирует',   spine: 'capital',  color: '#E8975E', order: 7,
              blurb: 'Проектное финансирование, рамочный контракт под стройку, JV.' },
  develops: { label: 'создаёт актив', verb: 'создаёт',       spine: 'capital',  color: '#C99B72', order: 8,
              blurb: 'Девелопмент объекта — площадка, кампус, станция.' },
  operates: { label: 'эксплуатирует', verb: 'эксплуатирует', spine: 'capital',  color: '#C2A36B', order: 9,
              blurb: 'Управление чужим активом.' },
};

export const SPINE_META = {
  physical: { label: 'Физический хребет', short: 'ФИЗ.', color: '#5A93DE',
              blurb: 'Что физически движется по стеку: материалы, станки, чипы, ток, стойки.' },
  capital:  { label: 'Хребет капитала',   short: 'КАП.', color: '#E0A340',
              blurb: 'Кто владеет узким местом и кто платит за то, чтобы оно появилось.' },
};

// ── Source tiers — line weight on the map ────────────────────────────────
export const TIER_META = {
  filing:     { label: 'Документ регулятора', short: '10-K / 20-F / 8-K / 13D', rank: 1, solid: true,  color: '#34D399' },
  company_pr: { label: 'Пресс-релиз стороны', short: 'релиз компании',          rank: 2, solid: true,  color: '#7FD8A8' },
  transcript: { label: 'Звонок по отчётности', short: 'стенограмма звонка',     rank: 3, solid: true,  color: '#A7D9BE' },
  press:      { label: 'Деловая пресса',      short: 'Reuters / Bloomberg / FT', rank: 4, solid: false, color: '#FBBF24' },
  estimate:   { label: 'Оценка аналитика',    short: 'TrendForce / Omdia',      rank: 5, solid: false, color: '#94A3B8' },
};

export const STATUS_META = {
  active:     { label: 'Действует',        color: '#34D399' },
  expired:    { label: 'Истекло',          color: '#94A3B8' },
  unverified: { label: 'Не подтверждается', color: '#8b8b95' },
};

// ── Layer bands — five colour families over twelve rings ─────────────────
// The band is the engine's (`layers[].band`); the palette is ours. Cool at the
// scarce centre, warming outward toward demand — so radius alone reads as
// "how far from the bottleneck".
export const BAND_META = {
  1: { label: 'Вход',        color: '#6F93DE' },
  2: { label: 'Кремний',     color: '#5A93DE' },
  3: { label: 'Сборка и ток', color: '#49C2AE' },
  4: { label: 'Инфраструктура', color: '#58ABCB' },
  5: { label: 'Результат',   color: '#8E9BE6' },
};

// ── Layer concentration → ring tint ──────────────────────────────────────
export const CONCENTRATION_META = {
  monopoly:    { label: 'Монополия',    short: 'МОНОП.', color: '#E5484D',
                 blurb: 'Один игрок держит слой. Отказ здесь останавливает всё, что выше.' },
  oligopoly:   { label: 'Олигополия',   short: 'ОЛИГ.',  color: '#E0A340',
                 blurb: 'Два-три игрока делят слой. Второй источник формально есть, переключение стоит времени.' },
  competitive: { label: 'Конкурентный', short: 'КОНК.',  color: '#49C2AE',
                 blurb: 'Много поставщиков, замена дешёвая. Здесь узкого места нет.' },
};

// ── Node tier ────────────────────────────────────────────────────────────
export const NODE_TIER_META = {
  anchor:   { label: 'Якорь',      short: 'ЯКОРЬ', color: '#FDE047',
              blurb: 'Компания, вокруг которой строится слой. Их около десяти на всю карту.' },
  core:     { label: 'Ядро',       short: 'ЯДРО',  color: '#C084FC',
              blurb: 'Топ-3 в своей функции или названный контрагент якоря.' },
  emerging: { label: 'Восходящий', short: 'ВОСХ.', color: '#45C0D0',
              blurb: 'Новичок с ПОДПИСАННЫМ контрактом или design win — не «перспективная идея».' },
};

// ── Criticality rubric — the four inputs, fixed weights ──────────────────
// Shown in the panel so the number is never a black box. The engine does the
// arithmetic; this table only names the axes and the anchors.
export const CRITICALITY_FACTORS = [
  { key: 'share',        label: 'Доля в своей функции', weight: 0.30,
    scale: ['<15%', '15–30%', '30–50%', '50–70%', '70–90%', '>90%'] },
  { key: 'alternatives', label: 'Реальных альтернатив', weight: 0.30,
    scale: ['товар', 'много', 'три-четыре', 'две', 'одна', 'нет'] },
  { key: 'switchTime',   label: 'Время замены',         weight: 0.25,
    scale: ['мгновенно', '<6 мес', '6–12 мес', '1–3 года', '3–5 лет', '>5 лет'] },
  { key: 'barrier',      label: 'Порог входа',          weight: 0.15,
    scale: ['нет', 'низкий', 'средний', 'высокий', 'очень высокий', 'запретительный'] },
];

/** Plain-Russian band for a 0–100 criticality score. */
export function criticalityBand(c) {
  if (c == null) return { label: 'Не оценено', color: '#94A3B8' };
  if (c >= 85) return { label: 'Незаменим', color: '#E5484D' };
  if (c >= 65) return { label: 'Труднозаменим', color: '#E0A340' };
  if (c >= 40) return { label: 'Заменим за годы', color: '#58ABCB' };
  return { label: 'Взаимозаменяем', color: '#49C2AE' };
}

// Default on-canvas edge threshold. Everything is IN the file; the map just
// starts quiet and the slider opens it back to 0. Node panels ignore this.
export const DEFAULT_MIN_STRENGTH = 20;

// Months after which an unconfirmed edge/node visibly fades.
const STALE_MONTHS = 6;

// ── Ids and small helpers ────────────────────────────────────────────────
export const layerIndex = (id) => {
  const n = Number(String(id || '').replace(/^L/i, ''));
  return Number.isFinite(n) ? n : 0;
};

/** "2026-03" / "2026-03-14" → months elapsed since, against `asOf` ("2026-08"). */
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
  const words = String(label || '').replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Brand marks. Three sources, in order:
//   1. public/logos/ — the offline batch `npm run logos` already fetched for
//      the FLOW map. Many ecosystem companies (NVIDIA, Brookfield, Microsoft)
//      are the same legal entities, so they are matched by NAME against the
//      manifest's `alloc:<Name>` / `target:<Name>` keys and reused for free.
//   2. ecosystemLogos.json — the dashboard's own id → domain sidecar (the
//      contract ships no domain), resolved at runtime via unavatar/favicon.
//   3. monogram tile.
const manifestByName = (() => {
  const m = new Map();
  Object.entries(logoManifest).forEach(([k, v]) => {
    const bare = k.replace(/^(alloc|target):/, '').trim().toLowerCase();
    if (bare && !m.has(bare)) m.set(bare, v);
  });
  return m;
})();

function logoUrlsFor(node) {
  const out = [];
  const push = (u) => { if (u && !out.includes(u)) out.push(u); };
  push(manifestByName.get(String(node.name || '').trim().toLowerCase()));
  const dom = logoDomains[node.id];
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
  generated: raw.generated || null,
  asOf: raw.asOf || null,
  source: raw.source || 'fixture',
  ecosystem: raw.ecosystem || null,
  // The ONLY behavioural difference between draft and real data: a banner.
  // The engine's file says `"source": "engine"` and the banner disappears by
  // itself — no code edit, no flag, no rebuild of anything but the JSON.
  isFixture: raw.source !== 'engine',
  totals: raw.totals || {
    nodes: (raw.nodes || []).length,
    edges: (raw.edges || []).length,
    layers: (raw.layers || []).length,
    cycles: (raw.cycles || []).length,
  },
  changelog: raw.changelog || null,
  disclaimer: 'Карта показывает зависимости, а не сделки. Каждое ребро подтверждено цитатой из источника; '
    + 'критичность и гравитация посчитаны движком по фиксированной рубрике. Не является инвестиционной рекомендацией.',
};

// ══════════════════════════════════════════════════════════════════════════
// buildGraph — one pass over the payload, everything the canvas needs.
// ══════════════════════════════════════════════════════════════════════════
export function buildGraph() {
  const asOf = raw.asOf || null;

  // ── Layers. Always twelve; a layer with no members still gets its ring. ──
  const layers = (raw.layers || [])
    .map(l => {
      const conc = l.concentration || {};
      const level = CONCENTRATION_META[conc.level] ? conc.level : 'competitive';
      return {
        ...l,
        idx: layerIndex(l.id),
        band: l.band || 1,
        bandColor: (BAND_META[l.band] || BAND_META[1]).color,
        concentration: { ...conc, level },
        concentrationMeta: CONCENTRATION_META[level],
        nodeCount: 0,          // filled below
        members: [],           // node ids, most critical first
      };
    })
    .sort((a, b) => a.idx - b.idx);
  const layerById = new Map(layers.map(l => [l.id, l]));

  const sectors = (raw.sectors || []).map(s => ({ ...s }));
  const sectorByKey = new Map(sectors.map(s => [s.key, s]));

  const techNodes = (raw.techNodes || []).map(t => ({ ...t }));
  const techById = new Map(techNodes.map(t => [t.id, t]));

  // ── Nodes ──────────────────────────────────────────────────────────────
  const nodes = (raw.nodes || []).map(n => {
    const role = ROLE_META[n.role] ? n.role : 'producer';
    const segs = (n.layers || [])
      .map(l => ({ ...l, idx: layerIndex(l.layer) }))
      .filter(l => layerById.has(l.layer))
      .sort((a, b) => a.idx - b.idx);
    // Defensive: a node the engine ships with no usable layer still has to
    // land somewhere rather than vanish — pin it to its sector's layer, else L1.
    const fallbackLayer = sectorByKey.get(n.sector)?.layer || layers[0]?.id || 'L1';
    const list = segs.length ? segs : [{ layer: fallbackLayer, primary: true, criticality: n.criticality || 0, idx: layerIndex(fallbackLayer) }];
    const primarySeg = list.find(l => l.primary) || list.reduce((a, b) => (b.criticality > a.criticality ? b : a), list[0]);
    const ageMonths = monthsSince(n.lastConfirmed, asOf);
    return {
      ...n,
      role,
      roleMeta: ROLE_META[role],
      segments: list,
      primaryLayer: primarySeg.layer,
      primaryIdx: primarySeg.idx,
      minIdx: list[0].idx,
      maxIdx: list[list.length - 1].idx,
      multiLayer: list.length > 1,
      criticality: typeof n.criticality === 'number' ? n.criticality : primarySeg.criticality || 0,
      band: layerById.get(primarySeg.layer)?.band || 1,
      color: (BAND_META[layerById.get(primarySeg.layer)?.band] || BAND_META[1]).color,
      sectorLabel: sectorByKey.get(n.sector)?.label || n.sector || '—',
      tierMeta: NODE_TIER_META[n.tier] || null,
      tech: (n.techNodes || []).map(id => techById.get(id)).filter(Boolean),
      // Ageing is a DISPLAY rule over the engine's own lastConfirmed — no data
      // is changed, the node just stops claiming to be current.
      ageMonths,
      faded: !!n.stale || (ageMonths != null && ageMonths > STALE_MONTHS),
      logoUrls: logoUrlsFor(n),
      monogram: monogramOf(n.name),
      searchUrl: `https://duckduckgo.com/?q=${encodeURIComponent(n.name || '')}`,
      // filled by the layout pass
      x: 0, y: 0,
    };
  });
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  layers.forEach(l => {
    const members = nodes
      .filter(n => n.segments.some(s => s.layer === l.id))
      .sort((a, b) => critIn(b, l.id) - critIn(a, l.id));
    l.members = members.map(n => n.id);
    l.nodeCount = members.length;
  });

  // ── Edges. A dangling reference is DROPPED, loudly in dev — the contract
  // forbids it, and half-drawing it would be worse than not drawing it. ──
  const dropped = [];
  const edges = [];
  (raw.edges || []).forEach(e => {
    if (!nodeById.has(e.source) || !nodeById.has(e.target)) { dropped.push(e.id); return; }
    const type = EDGE_TYPE_META[e.type] ? e.type : 'supply';
    const meta = EDGE_TYPE_META[type];
    const tier = TIER_META[e.tier] ? e.tier : 'estimate';
    const evidence = Array.isArray(e.evidence) ? e.evidence : [];
    const confirmed = typeof e.confirmedSources === 'number' ? e.confirmedSources : evidence.length;
    const ageMonths = monthsSince(e.lastConfirmed, asOf);
    edges.push({
      ...e,
      type,
      typeMeta: meta,
      typeLabel: meta.label,
      spine: e.spine || meta.spine,
      spineMeta: SPINE_META[e.spine || meta.spine] || SPINE_META.physical,
      color: meta.color,
      tier,
      tierMeta: TIER_META[tier],
      status: STATUS_META[e.status] ? e.status : 'active',
      statusMeta: STATUS_META[e.status] || STATUS_META.active,
      strength: typeof e.strength === 'number' ? e.strength : 0,
      confirmedSources: confirmed,
      // Two independent sources → a solid line. One → dashed, whatever the
      // tier says. A press/estimate tier is dashed regardless. Both rules
      // are the frozen contract's, applied here once so no painter re-derives.
      solid: confirmed >= 2 && TIER_META[tier].solid,
      evidence,
      techNode: e.techNode || null,
      techMeta: e.techNode ? techById.get(e.techNode) || null : null,
      ageMonths,
      faded: e.status === 'unverified' || (ageMonths != null && ageMonths > STALE_MONTHS),
      // force-graph mutates these into node objects; keep the raw ids too.
      sourceId: e.source,
      targetId: e.target,
    });
  });
  if (dropped.length && typeof console !== 'undefined') {
    console.warn(`[ecosystemMap] ${dropped.length} рёбер с висячей ссылкой пропущено:`, dropped);
  }
  const edgeById = new Map(edges.map(e => [e.id, e]));

  // ── Cycles. Engine-detected; we only resolve the ids it named. ─────────
  const cycles = (raw.cycles || []).map(c => ({
    ...c,
    edgeSet: new Set((c.edges || []).filter(id => edgeById.has(id))),
    nodeSet: new Set((c.path || []).filter(id => nodeById.has(id))),
    typeLabel: c.type === 'financing' ? 'Контур финансирования' : 'Контур сбыта',
    color: c.type === 'financing' ? '#E0A340' : '#E5484D',
  })).filter(c => c.edgeSet.size > 0);

  // Nodes / edges that sit on ANY cycle — the "круги" lens switches on these.
  const cycleNodes = new Set();
  const cycleEdges = new Map();          // edge id → cycle
  cycles.forEach(c => {
    c.nodeSet.forEach(id => cycleNodes.add(id));
    c.edgeSet.forEach(id => { if (!cycleEdges.has(id)) cycleEdges.set(id, c); });
  });

  // ── Per-node roll-ups the panel reads (counts only — no scoring) ───────
  nodes.forEach(n => { n.upCount = 0; n.downCount = 0; n.onCycle = cycleNodes.has(n.id); });
  edges.forEach(e => {
    nodeById.get(e.target).upCount += 1;      // who this node depends ON
    nodeById.get(e.source).downCount += 1;    // who depends on this node
  });

  const stats = {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    layerCount: layers.length,
    cycleCount: cycles.length,
    anchorCount: nodes.filter(n => n.tier === 'anchor').length,
    multiLayerCount: nodes.filter(n => n.multiLayer).length,
    capitalEdgeCount: edges.filter(e => e.spine === 'capital').length,
    unverifiedCount: edges.filter(e => e.status === 'unverified').length,
    fadedCount: edges.filter(e => e.faded).length,
    maxStrength: Math.max(1, ...edges.map(e => e.strength || 0)),
  };

  return {
    generated: raw.generated || null,
    asOf,
    source: META.source,
    isFixture: META.isFixture,
    layers, layerById,
    sectors, sectorByKey,
    nodes, nodeById,
    edges, edgeById,
    techNodes, techById,
    cycles, cycleNodes, cycleEdges,
    stats,
  };
}

/** Criticality of `node` INSIDE a given layer (capsule thickness reads this). */
export function critIn(node, layerId) {
  const s = (node.segments || []).find(x => x.layer === layerId);
  return s ? (s.criticality || 0) : 0;
}

/**
 * Adjacency, both directions, sorted by strength.
 *   up   — edges INTO the node: who it depends on (toward the centre).
 *   down — edges OUT of the node: who depends on it (toward the rim).
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
