// ══════════════════════════════════════════════════════════════════════════
// AI ECOSYSTEM NETWORK — data adapter, contract `ai-ecosystem-network/4`
//
//   engine (monthly)  →  handoff/ai_ecosystem_network.json
//        →  src/data/aiEcosystemNetwork.json
//             →  here
//                  →  components/research/ecosystem/  (the SAME components)
//
// THE ANCHOR IS GONE. /1 through /3 were the NVIDIA map widened: one centre,
// then 26 co-equal "pivots", but membership was still «в двух шагах от
// NVIDIA», tier 1 still meant «это сказала NVIDIA», and the fourth criticality
// factor still measured NVIDIA's leverage over you. /4 unpicks those three
// jobs from each other and none of the replacements needs a centre:
//
//   membership   — three checks against the SUBJECT (in scope · own dossier ·
//                  two confirmed edges), not a distance. `hops` is deleted.
//   evidence     — tier is graded against the entity's OWN publishers
//                  (`domains[]`, `cik`); тир 1 = «сказала сама сущность».
//   importance   — `concentration` (what share of its own function it holds)
//                  replaces `strategicControl`, and `integration` arrives as a
//                  computed graph rank alongside the authored `criticality`.
//
// «Ядро» replaces «пивоты» and is an OUTPUT, not a list: the top 30 by
// `integration.score`, recomputed every run. `entities[].pivotal` still ships
// as a mirror of `core` for this one release and is marked deprecated in
// `meta.deprecated`; new code reads `core`.
//
// The molecule, the orbit, the nucleus, the outer arc, the tiles, the hairline
// edges, the chain mode and the table are all unchanged.
//
// TAXONOMY IS SINGLE-SOURCED. The 16 layers, 5 spines, 6 roles, the criticality
// rubric, the tiers, the confirmation statuses — all of it is frozen in
// `nvidiaEcosystem.js` and RE-EXPORTED here verbatim, never re-typed. Editing a
// layer label in one place changes both maps; there is no second copy to drift.
// The graph itself is built by the same `buildGraphFrom(raw)`; this file only
// hands it the network payload and decorates the result with the core set and
// the `network` block.
//
// The reserve map (`nvidiaEcosystem.js` + `nvidiaEcosystem.json`, the NVIDIA
// pilot at contract nvidia-ecosystem/2) is NOT deleted — it is exactly the
// taxonomy source this file leans on, and it still builds a valid
// single-anchor graph if ever remounted. Its payload has no `concentration`,
// no `integration` and no `sourcing`, which is why every reader below treats
// all three as optional.
//
// ── WHAT /4 REMOVED — nothing may reference these ────────────────────────
//   entities[].hops                      distance from the centre
//   criticalityFactors.strategicControl  NVIDIA's leverage → `concentration`
//   ecosystem: "nvidia"                  the root-level anchor id
//
// ── WHAT /4 ADDED ───────────────────────────────────────────────────────
//   entities[].integration{score,degree,betweenness,pagerank,
//                          layersSpanned,edgeTypes,cycles}   108/108
//   entities[].sourcing{total,selfSourced,byTier}            108/108
//   entities[].core            computed top-30 by integration
//   entities[].pivotal         mirror of core, deprecated, one release
//   entities[].pendingDossier  shown but NOT researched yet   31 true
//   entities[].membershipFailing[]  held by an edge, fails a check   34
//   entities[].criticalityBasis{factorsUsed,factors,renormalized}
//   entities[].domains[] · .cik      who counts as "self"    106 / 51
//   criticalityFactors.concentration   share of own function  76 filled
//   edges[].sidedness          bilateral | single | disputed  314/314
//   edges[].claimedBy[]        which ends claim it             286/314
//   edges[].counterEvidence[]  the other side's quotes when disputed  0 today
//   meta.scope{ru,en} · meta.membership{…} · meta.coreRule
//   status "bilateral"         a rung ABOVE confirmed          70 edges
// ══════════════════════════════════════════════════════════════════════════

import raw from './aiEcosystemNetwork.json';
import { L } from '../lib/i18n.jsx';
import {
  buildGraphFrom, buildAdjacency, buildLayers, critIn, monthsSince,
  criticalityBand, strengthBand, substitutabilityRead,
  ROLE_META, SPINE_META, EDGE_TYPE_META as BASE_EDGE_TYPE_META,
  TIER_META, STATUS_META, SIDEDNESS_META, PHASE_META, RISK_META, RISK_TYPE_META, RISK_TIMELINE_META,
  DIRECTION_META, BAND_META, PLANE_META, CONCENTRATION_META, TYPE_META,
  PUBLIC_PRIVATE_META, CRITICALITY_FACTORS, criticalityBasisOf, DEFAULT_MIN_STRENGTH,
  WEIGHT_FACTORS, weightBand, pointsOf, domainOf,
} from './nvidiaEcosystem.js';
import { bi } from '../lib/bi.js';

// ── Re-export the frozen v2 taxonomy verbatim ────────────────────────────
// The components import these from whichever adapter they render, so the
// network map must expose the identical surface. No copies — these ARE the v2
// objects, imported and forwarded.
export {
  buildAdjacency, buildLayers, critIn, monthsSince,
  criticalityBand, strengthBand, substitutabilityRead,
  ROLE_META, SPINE_META,
  TIER_META, STATUS_META, SIDEDNESS_META, PHASE_META, RISK_META, RISK_TYPE_META, RISK_TIMELINE_META,
  DIRECTION_META, BAND_META, PLANE_META, CONCENTRATION_META, TYPE_META,
  PUBLIC_PRIVATE_META, CRITICALITY_FACTORS, criticalityBasisOf, DEFAULT_MIN_STRENGTH,
  WEIGHT_FACTORS, weightBand, pointsOf, domainOf,
};

// ── Edge types — the v2 twenty-nine PLUS the two the network adds ─────────
// Spread the frozen table and add exactly two. Because it is spread, a change
// to a v2 type propagates here for free; only the two genuinely-new rows live
// in this file.
export const EDGE_TYPE_META = {
  ...BASE_EDGE_TYPE_META,
  // rivalry family — a viable REPLACEMENT PATH, not a market fight. JAX is an
  // alternative to PyTorch though it does not "compete" with it commercially.
  is_alternative_to: bi({
    label: ['альтернатива', 'alternative to'],
    verb:  ['альтернатива для', 'is an alternative to'],
    up:    ['альтернативный путь', 'alternative path'],
    down:  ['альтернативный путь', 'alternative path'],
    blurb: ['Жизнеспособный путь-замена: другая дорога к тому же результату, а не рыночный конкурент.',
            'A viable replacement path: another road to the same result, not a commercial rival.'],
  }, { spine: 'rivalry', color: '#8478A8', order: 43 }),
  // physical family — a standard that lets two otherwise-separate stacks talk.
  enables_interop: bi({
    label: ['связывает стеки', 'bridges stacks'],
    verb:  ['связывает', 'bridges'],
    up:    ['связывает стеки', 'bridges the stacks'],
    down:  ['связывает стеки', 'bridges the stacks'],
    blurb: ['Стандарт, позволяющий двум иначе раздельным стекам разговаривать (ONNX между разными инференсами).',
            'A standard letting two otherwise separate stacks talk (ONNX between different inference runtimes).'],
  }, { spine: 'physical', color: '#3FBFB0', order: 8 }),
};

// ══════════════════════════════════════════════════════════════════════════
// NEW META — only the network additions. Everything above is v2, forwarded.
// ══════════════════════════════════════════════════════════════════════════

// ── ЯДРО. Computed, not curated ───────────────────────────────────────────
// `meta.coreRule` says how: top-30 by `integration.score`, recomputed every
// run, with entries and exits going into the changelog as their own category.
// So this is not «кого мы считаем главным» — it is a reading, and it can be
// wrong about a node the way any measurement can.
//
// Read order is deliberate: `entities[].core` is the /4 field and wins.
// `raw.pivots[]` (top level) and `entities[].pivotal` are the /3 spelling; the
// engine still emits both as a mirror for this one release and drops them in
// /5, so they are the fallback and nothing new is written against them.
const CORE_FROM_ENTITIES = (raw.entities || []).filter(e => e.core).map(e => e.id);
export const CORE = new Set(
  CORE_FROM_ENTITIES.length
    ? CORE_FROM_ENTITIES
    : (Array.isArray(raw.pivots) && raw.pivots.length
        ? raw.pivots
        : (raw.entities || []).filter(e => e.pivotal).map(e => e.id))
);
// The old name, kept as an alias so the canvas and the layout — which speak
// `isPivotal` — did not have to be rewritten for a rename. The UI says «ядро».
export const PIVOTS = CORE;

// ── `integration` — the engine's own measure of how wired-in a node is ────
//
// WHY IT IS NOT THE HEADLINE NUMBER, EVEN THOUGH THE CONTRACT CALLS IT «the
// map's primary rank». It is normalized against the MAXIMUM in the graph, and
// on live data that maximum is NVIDIA at 100 with TSMC second at 31 — the
// other 106 nodes are squeezed into 0–31, where a one-point difference is
// noise and the eye reads «everything except NVIDIA is unimportant». The
// dashboard's own «ВЕС В СИСТЕМЕ» (see ecoWeight.js) is anchored to the
// network MEAN on a log₂ scale instead: 50 is exactly average and every
// doubling is +16.6 points, which spreads the same information across the
// range where the entities actually are.
//
// So: ВЕС leads and sorts, `integration` sits beside it as a second reading
// with its ingredients shown. The recommendation to the engine is to move the
// log₂-of-mean normalization into `nvnet_centrality`, after which the two
// numbers collapse into one and this file becomes a passthrough.
export const INTEGRATION_META = {
  score: bi({
    label: ['Интеграция', 'Integration'],
    blurb: ['Насколько узел вшит в сеть по расчёту движка: степень, посредничество, PageRank, охват слоёв, разнообразие связей и участие в циклах, свёрнутые в одно число. Нормирован по максимуму сети, поэтому сжат — рядом с ним читайте ВЕС.',
            'How wired into the network the node is, as the engine computes it: degree, betweenness, PageRank, layer span, variety of link types and participation in cycles, folded into one number. Normalized against the network maximum, so it is compressed — read it next to the systemic-weight score.'],
  }, { weight: null }),
  degree: bi({
    label: ['Степень', 'Degree'],
    blurb: ['Со сколькими сущностями есть прямая связь.', 'How many entities it is directly linked to.'],
  }, { weight: 0.30, fmt: 'int' }),
  betweenness: bi({
    label: ['Посредничество', 'Betweenness'],
    blurb: ['Доля кратчайших путей между другими, проходящих через неё.',
            'The share of shortest paths between other entities that run through it.'],
  }, { weight: 0.25, fmt: 'share' }),
  pagerank: bi({
    label: ['PageRank', 'PageRank'],
    blurb: ['Вес по важности соседей: важна та, на кого ссылаются важные.',
            "Weight by the importance of its neighbours: you matter if things that matter point at you."],
  }, { weight: 0.15, fmt: 'share' }),
  layersSpanned: bi({
    label: ['Слоёв охвачено', 'Layers spanned'],
    blurb: ['Сколько слоёв стека задевают её связи. Из 16.',
            'How many layers of the stack its links touch. Out of 16.'],
  }, { weight: 0.15, fmt: 'int' }),
  edgeTypes: bi({
    label: ['Типов связей', 'Link types'],
    blurb: ['Сколько РАЗНЫХ видов отношений на ней сходится — поставка, капитал, стандарт, соперничество.',
            'How many DIFFERENT kinds of relation meet on it — supply, capital, standard, rivalry.'],
  }, { weight: 0.10, fmt: 'int' }),
  cycles: bi({
    label: ['Циклов', 'Cycles'],
    blurb: ['В скольких замкнутых контурах зависимости она участвует.',
            'How many closed dependency loops it takes part in.'],
  }, { weight: 0.05, fmt: 'int' }),
};

// The six ingredients in the contract's own order, for the panel.
export const INTEGRATION_PARTS = ['degree', 'betweenness', 'pagerank', 'layersSpanned', 'edgeTypes', 'cycles'];

// ── `sourcing` — the honesty of the profile, as three numbers ─────────────
// The campaign that produced /4 started from one finding: 75 of 107 entities
// had no citation of their own, so their «profile» was whatever NVIDIA's 10-K
// said about them. This block is how that stops being invisible.
export const SOURCING_META = bi({
  totalLabel: ['Источников', 'Sources'],
  totalBlurb: ['Сколько документов стоит за профилем этой сущности.',
               'How many documents stand behind this entity\'s profile.'],
  selfLabel: ['Из них своих', 'Of them, its own'],
  selfBlurb: ['Сколько из них опубликовала САМА эта сущность. Ноль означает, что сущность на карте описана чужими словами.',
              'How many of them were published by the entity ITSELF. Zero means the entity is described on the map in somebody else\'s words.'],
  tiersLabel: ['По твёрдости', 'By solidity'],
});

// ── `meta.membership` — the state of the map's own border ─────────────────
// Three checks, all obligatory, none of them a distance from anything.
export const MEMBERSHIP_CHECK_META = {
  in_scope: bi({
    label: ['вне охвата', 'out of scope'],
    blurb: ['Не работает ни в одном из 16 слоёв предмета карты.',
            'Does not operate in any of the 16 layers the map covers.'],
  }),
  min_sources: bi({
    label: ['мало источников', 'too few sources'],
    blurb: ['Собственное досье собрано меньше чем из трёх источников.',
            'Its own dossier rests on fewer than three sources.'],
  }),
  min_self_sources: bi({
    label: ['нет своего голоса', 'no voice of its own'],
    blurb: ['Ни один источник профиля не опубликован ею самой.',
            'Not one source in the profile was published by the entity itself.'],
  }),
  min_confirmed_edges: bi({
    label: ['одна подтверждённая связь', 'only one confirmed link'],
    blurb: ['Меньше двух подтверждённых связей с другими сущностями карты.',
            'Fewer than two confirmed links to other entities on the map.'],
  }),
};

export const MEMBERSHIP_META = bi({
  admittedLabel: ['Принято', 'Admitted'],
  admittedBlurb: ['Прошли все три проверки членства.', 'Passed all three membership checks.'],
  heldLabel: ['Удержано связью', 'Held by a link'],
  heldBlurb: ['Проверку членства не проходят, но названы в чужом подтверждённом досье и потому оставлены на карте — помеченными, а не выброшенными.',
              'They fail a membership check but are named in somebody else\'s confirmed dossier, so they stay on the map — marked, not discarded.'],
  retiredLabel: ['Ретировано', 'Retired'],
  retiredBlurb: ['Ушли с карты в этом прогоне.', 'Left the map on this run.'],
  pendingLabel: ['Ждут досье', 'Awaiting a dossier'],
  pendingBlurb: ['До узла ещё не дошла очередь исследования. Он показан, но его профиль и доля функции не проработаны.',
                 'The research rotation has not reached the node yet. It is shown, but its profile and its share of the function are not worked through.'],
  queuedLabel: ['В очереди кандидатов', 'In the candidate queue'],
  queuedBlurb: ['Названы чужими досье и берутся в работу следующим циклом.',
                'Named by other dossiers and taken up on the next cycle.'],
});

// How to read the two centrality numbers, in plain Russian, for the panel.
export const CENTRALITY_META = {
  degree: bi({
    label: ['Степень', 'Degree'],
    blurb: ['Со сколькими сущностями есть прямая связь. Насколько узел «людный».',
            'How many entities it is directly linked to. How crowded the node is.'],
  }),
  betweenness: bi({
    label: ['Посредничество', 'Betweenness'],
    blurb: ['На скольких кратчайших путях между другими лежит эта сущность. Насколько через неё «всё проходит».',
            'How many shortest paths between other entities run through it. How much passes through it.'],
  }),
};

// Subgraph → accent colour for the lens. The LABEL and DESCRIPTION come from
// the data (`network.subgraphs[]`); this only fixes a stable highlight hue per
// known id, distinct from the five spine colours. An unknown id falls back to
// a neutral accent.
export const SUBGRAPH_META = {
  'gpu-ecosystem':          bi({ fallbackLabel: ['GPU-стек', 'GPU stack'] },   { color: '#6C8EF5' }),
  'tpu-ecosystem':          bi({ fallbackLabel: ['TPU-стек', 'TPU stack'] },   { color: '#F5A25D' }),
  'infrastructure-backbone':bi({ fallbackLabel: ['Хребет инфраструктуры', 'Infrastructure backbone'] }, { color: '#9AA7B8' }),
  _default:                 bi({ fallbackLabel: ['Подграф', 'Subgraph'] },     { color: '#8E9BE6' }),
};

// Spare hues for subgraphs the engine adds that this file has never heard of.
// Deliberately clear of the five spine colours, so a lens accent is never
// mistaken for a relation family. Picked by a hash of the id rather than by
// arrival order, so a group keeps its colour when the engine reorders the list
// or ships a new one alongside it.
const SUBGRAPH_SPARE_COLORS = [
  '#5EC2B7', '#C98BD9', '#E0B15A', '#7FB2E8', '#D98B8B',
  '#8FCB72', '#B49BE0', '#E09A6B',
];
const hashId = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
export const subgraphMeta = (id) => SUBGRAPH_META[id] || {
  ...SUBGRAPH_META._default,
  color: id
    ? SUBGRAPH_SPARE_COLORS[hashId(id) % SUBGRAPH_SPARE_COLORS.length]
    : SUBGRAPH_META._default.color,
};

// Labels + one-liners for the network-summary aggregates.
export const NETWORK_META = {
  totalNodes: bi({
    label: ['Узлов', 'Nodes'],
    blurb: ['Всего сущностей в сети.', 'Total entities in the network.'],
  }),
  totalEdges: bi({
    label: ['Связей', 'Links'],
    blurb: ['Всего рёбер в сети.', 'Total edges in the network.'],
  }),
  pivotalNodes: bi({
    label: ['В ядре', 'In the core'],
    blurb: ['Верхние по вычисленной интеграции. Состав СЧИТАЕТСЯ каждый прогон, а не ведётся списком, и вход-выход идёт в чейнджлог.',
            'The top entities by computed integration. The set is COMPUTED every run rather than kept as a list, and entries and exits go into the changelog.'],
  }),
  secondaryNodes: bi({
    label: ['Вне ядра', 'Outside the core'],
    blurb: ['Не менее законные участники карты: членство даёт охват и подтверждённые связи, а не близость к ядру.',
            'No less legitimate members of the map: membership comes from scope and confirmed links, not from proximity to the core.'],
  }),
  density: bi({
    label: ['Плотность', 'Density'],
    blurb: ['Доля реально существующих рёбер от всех возможных. Ближе к 0 — разреженная сеть.',
            'The share of possible edges that actually exist. Closer to 0 means a sparse network.'],
  }),
  averageDegree: bi({
    label: ['Средняя степень', 'Average degree'],
    blurb: ['Сколько прямых связей в среднем у сущности.',
            'How many direct links an entity has on average.'],
  }),
  clusteringCoefficient: bi({
    label: ['Кластеризация', 'Clustering'],
    blurb: ['Насколько соседи узла связаны и между собой. Ближе к 1 — плотные «клики».',
            "How far a node's neighbours are also linked to each other. Closer to 1 means tight cliques."],
  }),
};

// ══════════════════════════════════════════════════════════════════════════
// META — the header the shell reads before anything is drawn.
// ══════════════════════════════════════════════════════════════════════════
export const META = bi({
  disclaimer: [
      'Сеть показывает позиции и зависимости в инфраструктуре ИИ, а не сделки. '
        + 'Каждая связь подтверждена цитатой; интеграция, ядро и точки отказа посчитаны движком по графу. Не является инвестиционной рекомендацией.',
      'The network shows positions and dependencies across AI infrastructure, not transactions. '
        + 'Every link is backed by a quote; integration, the core set and the points of failure are computed by the engine over the graph. Not investment advice.',
    ],
  // The map's SUBJECT, which is what replaced the anchor. It arrives as a
  // { ru, en } pair like the rest of the engine's prose; META is built from
  // `raw` rather than from the resolved copy, so the pair is bound here as a
  // lazy getter instead of going through resolveProse().
  scope: [
    raw.meta?.scope?.ru || 'Инфраструктура ИИ.',
    raw.meta?.scope?.en || 'AI infrastructure.',
  ],
}, {
  schema: raw.schema || null,
  generated: raw.generated || null,
  asOf: raw.asOf || null,
  version: raw.version || null,
  source: raw.source || 'fixture',
  isFixture: raw.source !== 'engine',
  // `core` is the /4 name; `pivots` stays as the alias the canvas reads.
  core: [...CORE],
  pivots: [...CORE],
  coreRule: raw.meta?.coreRule || null,
  coreCount: raw.meta?.coreCount ?? CORE.size,
  // { admitted, retired, retiredNodes[], held, heldNodes[{id,failed,heldBy}],
  //   queued, pendingDossier, covered, checks{} } — see NetworkSummary.
  membership: raw.meta?.membership || null,
  // `meta.deprecated` is deliberately NOT forwarded. It is a note from the
  // engine to the next contract reader («pivotal — зеркало core, удаляется в
  // /5»), it ships as a bare Russian string rather than a { ru, en } pair, and
  // nothing renders it. Exposing it would put untranslated engine bookkeeping
  // into the translation audit's surface for no reader's benefit; the fact
  // itself is recorded in this file's header instead.
  totals: raw.totals || null,
  changelog: raw.changelog || null,
});

// ══════════════════════════════════════════════════════════════════════════
// BILINGUAL PROSE — contract ai-ecosystem-network/2 and /3.
//
// From /2 the engine ships every prose field as { ru, en } instead of a bare
// string. /3 only ADDS fields — entities[].description, edges[].detail — and
// they arrive as pairs like the rest, so they are resolved here for free and
// no render site had to learn a new shape. Nothing in the dashboard compares
// the schema string, so a version bump needs no code: `schema` is carried
// through to `graph.schema` and displayed, never branched on. Both shapes are accepted on purpose: a bare string is read as "the
// same text in both languages", so a payload can be converted field by field
// without the live map going dark in between.
//
// Resolved ONCE, in buildGraph, rather than at each of the ~40 render sites.
// That is safe here for a specific reason: buildGraph runs inside
// `useMemo(..., [])` in EcosystemMap, and App remounts its whole body on a
// language flip (`key={lang}`), so a fresh mount re-resolves everything. If
// that remount ever goes away, this has to move to `useL()` at the render
// sites — which is why the dependency is written down here and not left to be
// rediscovered.
// ── Plain-Russian lexicon — DISPLAY ONLY ─────────────────────────────────
// The engine's agents occasionally reach for a calque that reads as English
// wearing a Russian coat. «Ров» is the one that keeps coming back — a literal
// translation of "moat" that nobody says in Russian business prose and that
// stops the sentence dead for anyone who has not read the English original.
//
// Patching the payload would be pointless: the next monthly run rewrites it.
// So the swap lives HERE, at the single point where a Russian string is
// chosen — the same "dashboard owns the Russian rendering" pattern the flow
// map uses for capitalMapRu.json.
//
// Two rules keep this honest:
//   1. It is a CURATED WORD LIST, never a paraphrase. Meaning is the engine's.
//   2. The replacement is masculine, like «ров», so every case form swaps
//      one-for-one and the surrounding agreement survives («главный ров» →
//      «главный барьер», not «главный защита»).
// No lookbehind: Safari < 16.4 has none, and this repo avoids it elsewhere —
// the leading character is captured and put back instead.
//
// UPSTREAM CAUGHT UP (2026-08-28). The engine's own style rules now forbid
// «ров», «якорь», «узкое место» and «движок» in user-facing fields and fail
// the run on them, and the /3 delivery scans clean: 78 occurrences of «якорь»,
// 6 of «ров», 13 of «узкое место» went to zero. So this table no longer fixes
// anything — it stays as a GUARD, cheap and inert, for the day a style rule
// lapses or an older payload is re-read. Do not treat a hit here as normal.
const RU_PLAIN = [
  [/(^|[^А-Яа-яЁё])ров(?![А-Яа-яЁё-])/g, '$1барьер'],
  [/(^|[^А-Яа-яЁё])рва(?![А-Яа-яЁё-])/g, '$1барьера'],
  [/(^|[^А-Яа-яЁё])рву(?![А-Яа-яЁё-])/g, '$1барьеру'],
  [/(^|[^А-Яа-яЁё])рвом(?![А-Яа-яЁё-])/g, '$1барьером'],
  [/(^|[^А-Яа-яЁё])рве(?![А-Яа-яЁё-])/g, '$1барьере'],
  [/(^|[^А-Яа-яЁё])рвы(?![А-Яа-яЁё-])/g, '$1барьеры'],
  [/(^|[^А-Яа-яЁё])рвов(?![А-Яа-яЁё-])/g, '$1барьеров'],
];

/**
 * Applies the lexicon, but only to the RUSSIAN string. `pair` is the original
 * { ru, en } — if the resolved value is the English half (the language is en),
 * it is returned untouched, because these are Russian word forms.
 */
function plainRu(picked, pair) {
  if (typeof picked !== 'string' || picked !== pair.ru) return picked;
  let out = picked;
  for (const [re, to] of RU_PLAIN) out = out.replace(re, to);
  return out;
}

const resolveProse = (v) => {
  if (v == null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
  if (Array.isArray(v)) return v.map(resolveProse);
  if (typeof v === 'object') {
    // A { ru, en } pair collapses to the active language; anything else is a
    // normal object and is walked. `quote` fields never arrive as pairs — the
    // engine leaves source quotes in the language of the document they came
    // from — so they fall through this branch untouched.
    if ('ru' in v && 'en' in v && Object.keys(v).length === 2) return plainRu(L(v), v);
    const out = {};
    for (const k of Object.keys(v)) out[k] = resolveProse(v[k]);
    return out;
  }
  return v;
};

// ══════════════════════════════════════════════════════════════════════════
// buildGraph — the v2 builder, then the network decoration on top.
// ══════════════════════════════════════════════════════════════════════════
export function buildGraph() {
  const src = resolveProse(raw);
  // Pass the EXTENDED table: the v2 builder must know the two types this
  // contract adds, or they silently become «поставляет» on the map.
  const graph = buildGraphFrom(src, EDGE_TYPE_META);

  // No anchor at all under /4. The one visual privilege the anchor used to
  // hold — a label that never hides at any zoom — belongs to the CORE, whose
  // membership the engine recomputes every run. `isPivotal` is the internal
  // name the canvas and ecoLayout speak; the UI says «ядро».
  graph.entities.forEach(e => {
    e.isCore = !!e.core || CORE.has(e.id);
    e.isPivotal = e.isCore;
    e.isAnchor = false;
  });
  graph.core = CORE;
  graph.pivots = CORE;

  // Roll-ups the summary line and the filter bar read. Counted BEFORE the
  // network block is resolved — resolveNetwork falls back to `coreCount` when
  // the payload does not carry its own totals.
  graph.stats.coreCount = graph.entities.filter(e => e.isCore).length;
  graph.stats.pivotalCount = graph.stats.coreCount;
  // How much of the map is shown-but-not-yet-researched. The table and the
  // panel mark each such node; this is the same fact as one number.
  graph.stats.pendingDossierCount = graph.entities.filter(e => e.pendingDossier).length;
  graph.stats.heldCount = graph.entities.filter(e => (e.membershipFailing || []).length).length;

  graph.network = resolveNetwork(src.network, graph);

  return graph;
}

// Resolve the raw `network` block: pass the aggregates through untouched (the
// engine computed them), and turn the id lists into the Sets/Maps the canvas
// needs. The dashboard NEVER recomputes centrality, SPOF or subgraph
// membership — same zero-latitude rule as v2's criticality and cycles.
function resolveNetwork(rawNet, graph) {
  if (!rawNet) {
    return {
      totalNodes: graph.stats.entityCount, totalEdges: graph.stats.edgeCount,
      pivotalNodes: graph.stats.coreCount ?? 0,
      secondaryNodes: graph.stats.entityCount - (graph.stats.coreCount ?? 0),
      density: null, averageDegree: null, clusteringCoefficient: null,
      subgraphs: [], spof: [], spofById: new Map(), spofSet: new Set(),
    };
  }

  const subgraphs = (rawNet.subgraphs || []).map(s => {
    const meta = subgraphMeta(s.id);
    const nodeSet = new Set((s.nodeIds || []).filter(id => graph.entityById.has(id)));
    const edgeSet = new Set((s.edgeIds || []).filter(id => graph.edgeById.has(id)));
    return {
      ...s,
      label: s.label || meta.fallbackLabel,
      color: meta.color,
      nodeSet, edgeSet,
      nodeCount: nodeSet.size, edgeCount: edgeSet.size,
      // A subgraph that resolved to almost nothing is DEGENERATE — the map
      // says so rather than pretending the lens is meaningful. (The TPU stack
      // is the honest example: structurally it is just Google's own pieces.)
      degenerate: nodeSet.size <= 4,
    };
  });

  // Enrich each SPOF with the entity's display name so the summary panel does
  // not have to re-resolve it. Sorted by how much removing the node fragments
  // the network (lostPairsPct), the strongest chokepoint first.
  const spof = (rawNet.singlePointsOfFailure || [])
    .filter(s => graph.entityById.has(s.id))
    .map(s => ({
      ...s,
      name: graph.entityById.get(s.id).name,
      layerLabel: graph.entityById.get(s.id).primaryLayerLabel || s.layer,
    }))
    .sort((a, b) => (b.lostPairsPct ?? 0) - (a.lostPairsPct ?? 0) || (b.betweenness ?? 0) - (a.betweenness ?? 0));
  const spofById = new Map(spof.map(s => [s.id, s]));
  const spofSet = new Set(spof.map(s => s.id));

  return {
    totalNodes: rawNet.totalNodes ?? graph.stats.entityCount,
    totalEdges: rawNet.totalEdges ?? graph.stats.edgeCount,
    pivotalNodes: rawNet.pivotalNodes ?? graph.stats.coreCount ?? 0,
    secondaryNodes: rawNet.secondaryNodes ?? Math.max(0, graph.stats.entityCount - (graph.stats.coreCount ?? 0)),
    density: rawNet.density ?? null,
    averageDegree: rawNet.averageDegree ?? null,
    clusteringCoefficient: rawNet.clusteringCoefficient ?? null,
    subgraphs, spof, spofById, spofSet,
  };
}
