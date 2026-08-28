// ══════════════════════════════════════════════════════════════════════════
// AI ECOSYSTEM NETWORK — data adapter (v3)
//
//   engine (monthly)  →  handoff/ai_ecosystem_network.json
//        →  src/data/aiEcosystemNetwork.json
//             →  here
//                  →  components/research/ecosystem/  (the SAME components)
//
// v3 is not a new map. It is the v2 NVIDIA map with its ONE anchor
// generalized into a SET of 26 co-equal pivots, plus the network-science the
// blueprint asks for: degree/betweenness centrality, three subgraphs, and the
// structural single-points-of-failure. The molecule, the orbit, the nucleus,
// the outer arc, the tiles, the hairline edges, the chain mode and the table
// are all unchanged.
//
// TAXONOMY IS SINGLE-SOURCED. The 16 layers, 5 spines, 6 roles, the criticality
// rubric, the tiers, the confirmation statuses — all of it is frozen in
// `nvidiaEcosystem.js` and RE-EXPORTED here verbatim, never re-typed. Editing a
// layer label in one place changes both maps; there is no second copy to drift.
// The graph itself is built by the same `buildGraphFrom(raw)`; this file only
// hands it the network payload and decorates the result with pivots and the
// `network` block.
//
// The reserve map (`nvidiaEcosystem.js` + `nvidiaEcosystem.json`, the NVIDIA
// pilot) is NOT deleted — it is exactly the taxonomy source this file leans on,
// and it still builds a valid single-anchor graph if ever remounted.
//
// CONTRACT (ai_ecosystem_network.json, schema "ai-ecosystem-network/1") —
// EXTENDS nvidia-ecosystem/2, does not replace it. New over v2:
//   pivots[]                 — 26/27 co-equal centre ids (was: single `anchor`)
//   entities[].pivotal       — true for a pivot
//   entities[].centrality    — { degree, betweenness }  (engine-computed)
//   two new edge types        — is_alternative_to (rivalry), enables_interop (physical)
//   network{}                — totalNodes, totalEdges, pivotalNodes, secondaryNodes,
//                              density, averageDegree, clusteringCoefficient,
//                              singlePointsOfFailure[], subgraphs[]
//   version, changelog{10 categories}
// Everything else is the v2 contract, unchanged.
// ══════════════════════════════════════════════════════════════════════════

import raw from './aiEcosystemNetwork.json';
import { L } from '../lib/i18n.jsx';
import {
  buildGraphFrom, buildAdjacency, buildLayers, critIn, monthsSince,
  criticalityBand, strengthBand, substitutabilityRead,
  ROLE_META, SPINE_META, EDGE_TYPE_META as BASE_EDGE_TYPE_META,
  TIER_META, STATUS_META, PHASE_META, RISK_META, RISK_TYPE_META, RISK_TIMELINE_META,
  DIRECTION_META, BAND_META, PLANE_META, CONCENTRATION_META, TYPE_META,
  PUBLIC_PRIVATE_META, CRITICALITY_FACTORS, DEFAULT_MIN_STRENGTH,
  WEIGHT_FACTORS, weightBand, pointsOf,
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
  TIER_META, STATUS_META, PHASE_META, RISK_META, RISK_TYPE_META, RISK_TIMELINE_META,
  DIRECTION_META, BAND_META, PLANE_META, CONCENTRATION_META, TYPE_META,
  PUBLIC_PRIVATE_META, CRITICALITY_FACTORS, DEFAULT_MIN_STRENGTH,
  WEIGHT_FACTORS, weightBand, pointsOf,
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

// The pivot set as it arrives in the file. Either `pivots[]` at the top level
// or, failing that, the entities flagged `pivotal` — the contract allows both.
export const PIVOTS = new Set(
  Array.isArray(raw.pivots) && raw.pivots.length
    ? raw.pivots
    : (raw.entities || []).filter(e => e.pivotal).map(e => e.id)
);

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
    label: ['Ключевых', 'Key nodes'],
    blurb: ['Сущностей-центров, вокруг которых собрана сеть.',
            'The centre entities the network is assembled around.'],
  }),
  secondaryNodes: bi({
    label: ['Остальных', 'The rest'],
    blurb: ['Попали в карту, потому что стоят в двух шагах от ключевого узла.',
            'On the map because they sit within two steps of a key node.'],
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
      'Сеть показывает позиции и зависимости 26 равноправных центров ИИ-инфраструктуры, а не сделки. '
        + 'Каждая связь подтверждена цитатой; центральность и точки отказа посчитаны движком по графу. Не является инвестиционной рекомендацией.',
      'The network shows the positions and dependencies of 26 co-equal AI-infrastructure centres, not transactions. '
        + 'Every link is backed by a quote; centrality and points of failure are computed by the engine over the graph. Not investment advice.',
    ],
}, {
  schema: raw.schema || null,
  generated: raw.generated || null,
  asOf: raw.asOf || null,
  version: raw.version || null,
  source: raw.source || 'fixture',
  ecosystem: raw.ecosystem || null,
  isFixture: raw.source !== 'engine',
  pivots: [...PIVOTS],
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
// The durable fix is upstream, in the agents' style rules. This keeps the map
// readable until then.
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

  // Generalize the anchor: v2 gave exactly one entity the centre privilege;
  // here every pivot gets it, and no single entity is "the" anchor.
  graph.entities.forEach(e => {
    e.isPivotal = PIVOTS.has(e.id) || !!e.pivotal;
    e.isAnchor = false;                 // the privilege is collective now
  });
  graph.pivots = PIVOTS;
  graph.network = resolveNetwork(src.network, graph);

  // One extra roll-up the summary line reads.
  graph.stats.pivotalCount = graph.entities.filter(e => e.isPivotal).length;

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
      pivotalNodes: 0, secondaryNodes: graph.stats.entityCount,
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
    pivotalNodes: rawNet.pivotalNodes ?? 0,
    secondaryNodes: rawNet.secondaryNodes ?? 0,
    density: rawNet.density ?? null,
    averageDegree: rawNet.averageDegree ?? null,
    clusteringCoefficient: rawNet.clusteringCoefficient ?? null,
    subgraphs, spof, spofById, spofSet,
  };
}
