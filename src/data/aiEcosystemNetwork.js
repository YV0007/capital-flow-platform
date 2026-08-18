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
import {
  buildGraphFrom, buildAdjacency, buildLayers, critIn, monthsSince,
  criticalityBand, strengthBand, substitutabilityRead,
  ROLE_META, SPINE_META, EDGE_TYPE_META as BASE_EDGE_TYPE_META,
  TIER_META, STATUS_META, PHASE_META, RISK_META, RISK_TYPE_META, RISK_TIMELINE_META,
  DIRECTION_META, BAND_META, PLANE_META, CONCENTRATION_META, TYPE_META,
  PUBLIC_PRIVATE_META, CRITICALITY_FACTORS, DEFAULT_MIN_STRENGTH,
} from './nvidiaEcosystem.js';

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
};

// ── Edge types — the v2 twenty-nine PLUS the two the network adds ─────────
// Spread the frozen table and add exactly two. Because it is spread, a change
// to a v2 type propagates here for free; only the two genuinely-new rows live
// in this file.
export const EDGE_TYPE_META = {
  ...BASE_EDGE_TYPE_META,
  // rivalry family — a viable REPLACEMENT PATH, not a market fight. JAX is an
  // alternative to PyTorch though it does not "compete" with it commercially.
  is_alternative_to: {
    label: 'альтернатива', verb: 'альтернатива для', spine: 'rivalry', color: '#8478A8', order: 43,
    blurb: 'Жизнеспособный путь-замена: другая дорога к тому же результату, а не рыночный конкурент.',
  },
  // physical family — a standard that lets two otherwise-separate stacks talk.
  enables_interop: {
    label: 'связывает стеки', verb: 'связывает', spine: 'physical', color: '#3FBFB0', order: 8,
    blurb: 'Стандарт, позволяющий двум иначе раздельным стекам разговаривать (ONNX между разными инференсами).',
  },
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
  degree: {
    label: 'Степень',
    blurb: 'Со сколькими сущностями есть прямая связь. Насколько узел «людный».',
  },
  betweenness: {
    label: 'Посредничество',
    blurb: 'На скольких кратчайших путях между другими лежит эта сущность. Насколько через неё «всё проходит».',
  },
};

// Subgraph → accent colour for the lens. The LABEL and DESCRIPTION come from
// the data (`network.subgraphs[]`); this only fixes a stable highlight hue per
// known id, distinct from the five spine colours. An unknown id falls back to
// a neutral accent.
export const SUBGRAPH_META = {
  'gpu-ecosystem':          { color: '#6C8EF5', fallbackLabel: 'GPU-стек' },
  'tpu-ecosystem':          { color: '#F5A25D', fallbackLabel: 'TPU-стек' },
  'infrastructure-backbone':{ color: '#9AA7B8', fallbackLabel: 'Хребет инфраструктуры' },
  _default:                 { color: '#8E9BE6', fallbackLabel: 'Подграф' },
};
export const subgraphMeta = (id) => SUBGRAPH_META[id] || SUBGRAPH_META._default;

// Labels + one-liners for the network-summary aggregates.
export const NETWORK_META = {
  totalNodes:    { label: 'Узлов',        blurb: 'Всего сущностей в сети.' },
  totalEdges:    { label: 'Связей',       blurb: 'Всего рёбер в сети.' },
  pivotalNodes:  { label: 'Пивотов',      blurb: 'Сущностей-центров, вокруг которых собрана сеть.' },
  secondaryNodes:{ label: 'Вторичных',    blurb: 'Остальные — попали в двух шагах от какого-то пивота.' },
  density:       { label: 'Плотность',    blurb: 'Доля реально существующих рёбер от всех возможных. Ближе к 0 — разреженная сеть.' },
  averageDegree: { label: 'Средняя степень', blurb: 'Сколько прямых связей в среднем у сущности.' },
  clusteringCoefficient: { label: 'Кластеризация', blurb: 'Насколько соседи узла связаны и между собой. Ближе к 1 — плотные «клики».' },
};

// ══════════════════════════════════════════════════════════════════════════
// META — the header the shell reads before anything is drawn.
// ══════════════════════════════════════════════════════════════════════════
export const META = {
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
  disclaimer: 'Сеть показывает позиции и зависимости 26 равноправных центров ИИ-инфраструктуры, а не сделки. '
    + 'Каждая связь подтверждена цитатой; центральность и точки отказа посчитаны движком по графу. Не является инвестиционной рекомендацией.',
};

// ══════════════════════════════════════════════════════════════════════════
// buildGraph — the v2 builder, then the network decoration on top.
// ══════════════════════════════════════════════════════════════════════════
export function buildGraph() {
  const graph = buildGraphFrom(raw);

  // Generalize the anchor: v2 gave exactly one entity the centre privilege;
  // here every pivot gets it, and no single entity is "the" anchor.
  graph.entities.forEach(e => {
    e.isPivotal = PIVOTS.has(e.id) || !!e.pivotal;
    e.isAnchor = false;                 // the privilege is collective now
  });
  graph.pivots = PIVOTS;
  graph.network = resolveNetwork(raw.network, graph);

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
    .map(s => ({ ...s, name: graph.entityById.get(s.id).name }))
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
