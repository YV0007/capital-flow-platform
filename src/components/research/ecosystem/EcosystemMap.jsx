// ══════════════════════════════════════════════════════════════════════════
// EcosystemMap — FULL-SCREEN section shell for the second map.
//
// Renders src/data/aiEcosystemNetwork.json, the file the Capital Flow engine's
// MONTHLY pipeline exports. Nothing here is hard-coded — not a layer id, not a
// layer count, not the anchor: drop in the engine's file and the map changes
// with no code edit. That is the acceptance test.
//
// v3: the map generalized from ONE anchor (NVIDIA) to a NETWORK of 26 co-equal
// pivots — NVIDIA, Google, TSMC, OpenAI, … — with degree/betweenness
// centrality, three subgraphs (GPU / TPU / infrastructure backbone) and the
// structural single-points-of-failure. Same molecule, same lenses; the anchor
// privilege (always-visible label) now belongs to every pivot. The reserve
// NVIDIA-anchored map (nvidiaEcosystem.js/.json) is untouched behind this.
//
// Its state is ENTIRELY its own — CapitalFlowSection mounts either this or the
// flow map, never both, so no filter, panel or selection is ever shared.
//
// CONTROLS
//   · Цепочка — depth · direction · chain kind. The map's main verb.
//   · Круги   — the cycle lens: sales, financing and lock-in contours.
//   · Подграфы — the subgraph lens: GPU stack / TPU stack / infra backbone.
//   · Сводка   — the network-science read (density, degree, SPOF list).
//   · Фильтры — network scope (pivots/all), spine, type, risk, role, phase, layer.
// ══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  ChevronLeft, Search, X, Maximize2, Tag, SlidersHorizontal, RefreshCw,
  Sparkles, Cpu, Table2, Share2, AlertTriangle, Network, Settings2, Waypoints,
} from 'lucide-react';
import EcoGraph from './EcoGraph.jsx';
import EcoEntityPanel, { ECO_PANEL_W } from './EcoEntityPanel.jsx';
import LayerReport from './LayerReport.jsx';
import SubgraphBrief from './SubgraphBrief.jsx';
import ChainCrumbs from './ChainCrumbs.jsx';
import EcoEdgeCard from './EcoEdgeCard.jsx';
import EcoFilterBar from './EcoFilterBar.jsx';
import EcoTable from './EcoTable.jsx';
import NetworkSummary from './NetworkSummary.jsx';
import { buildGlossary } from './Glossed.jsx';
import { applyEcoLayout } from './ecoLayout.js';
import {
  buildChain, principalPath, CHAIN_KINDS, CHAIN_DIRECTIONS, CHAIN_DEPTHS, DEFAULT_BRANCH,
} from './chain.js';
import { buildGraph, buildAdjacency, META, DEFAULT_MIN_STRENGTH } from '../../../data/aiEcosystemNetwork.js';
import { useT } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';
const BG = 'var(--cf-canvas)';
const TOPBAR_H = 56;
const EMPTY_SET = new Set();

export default function EcosystemMap({ onBack, onOpenResearch, mapSwitch }) {
  const t = useT();
  // Built once; the layout pins fx/fy — no simulation, no per-reload drift.
  const graph = useMemo(() => buildGraph(), []);
  const regions = useMemo(() => applyEcoLayout(graph), [graph]);
  // Pristine layout snapshot, taken right after applyEcoLayout pins fx/fy.
  // Dragging overwrites a node's fx/fy, so this is the only copy of "where
  // things belong" — reset restores from it. Captured by value, so later drags
  // never mutate it. Depends on `regions` so it runs AFTER the layout pass.
  const homePositions = useMemo(() => {
    const m = new Map();
    graph.entities.forEach(n => m.set(n.id, { x: n.fx, y: n.fy }));
    return m;
  }, [graph, regions]);
  const adjacency = useMemo(() => buildAdjacency(graph.edges), [graph]);
  // Vocabulary for the in-prose links (companies, tech nodes, sector acronyms).
  const glossary = useMemo(() => buildGlossary(graph), [graph]);
  // force-graph insists on `nodes`/`links`; the contract calls them entities
  // and edges. The rename stops here, at the library boundary.
  const graphData = useMemo(
    () => ({ nodes: graph.entities, links: graph.edges }),
    [graph, regions],   // depends on regions so the layout has run first
  );

  const fgRef = useRef(null);

  // ── Filters ────────────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [roles, setRoles] = useState(() => new Set());
  const [spines, setSpines] = useState(() => new Set());
  const [types, setTypes] = useState(() => new Set());
  const [layerSel, setLayerSel] = useState(() => new Set());
  // Two filters new in v2, both straight out of the contract: an entity's own
  // PHASE and an edge's RISK level.
  const [phases, setPhases] = useState(() => new Set());
  const [risks, setRisks] = useState(() => new Set());
  // v3: show only the network's pivots, or the whole network. A plain entity
  // filter like the others, but common enough to earn its own top-bar toggle.
  const [pivotsOnly, setPivotsOnly] = useState(false);
  const [minStrength, setMinStrength] = useState(DEFAULT_MIN_STRENGTH);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showTech, setShowTech] = useState(true);
  const [view, setView] = useState('map');            // 'map' | 'table'

  // ── Lenses + selection ─────────────────────────────────────────────────
  const [cycleMode, setCycleMode] = useState(false);
  // Круги no longer paints all 140 circuits at once — that read as a wall of
  // colour. ONE circuit is lit at a time; `cycleId` says which. Turning the
  // lens on picks the first one straight away, so the map is never blank while
  // you decide, and `cycleListOpen` says whether the panel is showing the
  // whole list to choose from or the detail of the lit one. The lit circuit
  // stays on the map in BOTH panel modes — browsing the list never empties it.
  const [cycleId, setCycleId] = useState(null);
  const [cycleListOpen, setCycleListOpen] = useState(true);
  // v3: the subgraph lens. Holds the active subgraph id, or null. Mutually
  // exclusive with the chain and cycle lenses — one answer on screen at a time.
  const [subgraphId, setSubgraphId] = useState(null);
  const [subgraphMenuOpen, setSubgraphMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [openLayer, setOpenLayer] = useState(null);

  // ── Chain controls ─────────────────────────────────────────────────────
  const [chainRoot, setChainRoot] = useState(null);
  const [chainDepth, setChainDepth] = useState(2);
  const [chainDir, setChainDir] = useState('both');
  const [chainKind, setChainKind] = useState('all');
  const [expanded, setExpanded] = useState(() => new Set());

  // ── Visibility — a plain filter, applied before any lens ───────────────
  const { visibleNodes, visibleEdges } = useMemo(() => {
    const entityOk = (n) => (!roles.size || roles.has(n.role))
      && (!phases.size || phases.has(n.phase))
      && (!pivotsOnly || n.isPivotal)
      && (!layerSel.size || n.segments.some(s => layerSel.has(s.layer)));
    const nodes = new Set(graph.entities.filter(entityOk).map(n => n.id));
    const edges = new Set(
      graph.edges.filter(e =>
        (e.strength || 0) >= minStrength
        && (!spines.size || spines.has(e.spine))
        && (!types.size || types.has(e.type))
        && (!risks.size || risks.has(e.risk?.level))
        && nodes.has(e.sourceId) && nodes.has(e.targetId)
      ).map(e => e.id)
    );
    return { visibleNodes: nodes, visibleEdges: edges };
  }, [graph, roles, phases, pivotsOnly, layerSel, spines, types, risks, minStrength]);

  // The active subgraph object (with resolved nodeSet/edgeSet), or null.
  const subgraphLens = useMemo(
    () => (subgraphId ? graph.network.subgraphs.find(s => s.id === subgraphId) || null : null),
    [subgraphId, graph],
  );

  // The one circuit currently lit on the canvas.
  const activeCycle = useMemo(
    () => (cycleId ? graph.cycles.find(c => c.id === cycleId) || null : null),
    [cycleId, graph],
  );

  // Open the lens ON the first circuit rather than on a blank map. Done in an
  // effect, not in the button's click handler, and that is not incidental: the
  // canvas only takes up a new circuit when the lens is ALREADY on, so turning
  // the lens on and choosing the circuit in the same update left the map empty.
  // Two passes — lens on, then circuit chosen — is exactly what clicking a row
  // does, and that path always worked.
  useEffect(() => {
    if (cycleMode && !cycleId) setCycleId(graph.cycles[0]?.id ?? null);
  }, [cycleMode, cycleId, graph]);

  // Same shape the map already reads (edge id → cycle), just narrowed to the
  // one circuit — so EcoGraph's colouring/width/particle code needs no change.
  const cycleEdgesForGraph = useMemo(() => {
    const m = new Map();
    if (activeCycle) activeCycle.edgeSet.forEach(id => m.set(id, activeCycle));
    return m;
  }, [activeCycle]);
  const cycleNodeSet = activeCycle ? activeCycle.entitySet : EMPTY_SET;

  // Re-frame the whole map whenever the cycle lens opens, closes or swaps
  // circuits. Not a flourish — without it the camera is left zoomed in on the
  // world origin with the lit circuit off-screen, and the lens reads as broken.
  //
  // Deliberately the SAME call the «Восстановить вид» button makes, whole-map
  // and animated, rather than a fit filtered to the circuit: a filtered fit has
  // to pan a long way, and force-graph drives centerAt and zoom as two d3
  // transitions on one zoom behaviour, so the pan gets cancelled by the zoom
  // and the circuit lands outside the viewport. Whole-map framing needs no pan,
  // so it survives. The circuit shows small, exactly as when picked by hand.
  const cycleWasOn = useRef(false);
  useEffect(() => {
    if (cycleMode) cycleWasOn.current = true;
    if (!cycleWasOn.current) return;
    // Late enough to be after the panel's own layout shift, which otherwise
    // re-centres the camera on top of this.
    const timer = setTimeout(() => fgRef.current?.zoomToFit(700, 80), 450);
    return () => clearTimeout(timer);
  }, [cycleMode, cycleNodeSet, fgRef]);

  // ── The chain ──────────────────────────────────────────────────────────
  // A subgraph lens is a boundary, not a dimmer: while one is active, the
  // chain must never be OFFERED a hop outside it — not just have that hop
  // hidden after the fact. Offering it would mean "ещё N" quietly walks the
  // user out of the subgraph they picked. So the walk itself runs on an
  // adjacency built only from the subgraph's own edges; nothing outside it
  // exists as far as buildChain is concerned, for the walk, the branch cap,
  // and the "ещё N" counts alike.
  const chainAdjacency = useMemo(
    () => (subgraphLens
      ? buildAdjacency(graph.edges.filter(e => subgraphLens.edgeSet.has(e.id)))
      : adjacency),
    [subgraphLens, adjacency, graph]
  );

  const chain = useMemo(() => buildChain(chainRoot, {
    adjacency: chainAdjacency,
    depth: chainDepth,
    direction: chainDir,
    kind: chainKind,
    branch: DEFAULT_BRANCH,
    minStrength,
    expanded,
  }), [chainRoot, chainAdjacency, chainDepth, chainDir, chainKind, minStrength, expanded]);

  const crumbs = useMemo(() => (chainRoot ? principalPath(chainRoot, {
    adjacency: chainAdjacency, chain, entityById: graph.entityById, kind: chainKind, minStrength,
  }) : []), [chainRoot, chainAdjacency, chain, graph, chainKind, minStrength]);

  // ── Interaction ────────────────────────────────────────────────────────
  const focusEntity = useCallback((id) => {
    const n = graph.entityById.get(id);
    if (!n) return;
    setView('map');                    // a table row lands you on the map
    setSelectedNodeId(id);
    setChainRoot(id);
    setExpanded(new Set());
    setOpenLayer(null);
    setSelectedEdgeId(null);
    setCycleMode(false);
    setCycleId(null);
    // A subgraph lens is a standing boundary, not a one-shot filter: clicking
    // a company INSIDE it starts a chain that stays fenced to it (see
    // chainAdjacency above), and the lens itself stays on — same lens, next
    // question. It only comes off when the entity clicked lives outside it
    // (reached via search, say), which reads as leaving the subgraph on
    // purpose, or when the user removes/switches the lens explicitly.
    setSubgraphId(prev => (prev && !subgraphLens?.nodeSet.has(id) ? null : prev));
    const fg = fgRef.current;
    if (fg && Number.isFinite(n.x)) {
      fg.centerAt(n.x, n.y, 500);
      fg.zoom(Math.max(0.5, fg.zoom() || 0.5), 500);
    }
  }, [graph]);

  const handleNodeClick = useCallback((id) => {
    if (id === chainRoot) { setChainRoot(null); setSelectedNodeId(null); return; }
    focusEntity(id);
  }, [chainRoot, focusEntity]);

  const handleEdgeClick = useCallback((id) => {
    setSelectedEdgeId(prev => (prev === id ? null : id));
    const e = graph.edgeById.get(id);
    // An edge click with no company open lands you on its receiver — the side
    // the dependency actually matters to.
    if (e && !selectedNodeId) setSelectedNodeId(e.targetId);
  }, [graph, selectedNodeId]);

  // The bond whose card is open. One click on a line on either map now opens
  // the same kind of card in the same place.
  const selectedEdge = selectedEdgeId ? graph.edgeById.get(selectedEdgeId) : null;

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setChainRoot(null);
    setOpenLayer(null);
    setExpanded(new Set());
    setSubgraphId(null);
  }, []);

  // Reset = snap every company back to its pristine layout spot (undoing any
  // dragging), THEN re-frame. One click puts a messed-up board back — same
  // behaviour as the flow map's reset.
  const resetView = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    graph.entities.forEach(n => {
      const p = homePositions.get(n.id);
      if (p) { n.fx = p.x; n.fy = p.y; n.x = p.x; n.y = p.y; }
    });
    fg.refresh?.();
    fg.zoomToFit(700, 80);
  }, [graph, homePositions]);

  const resetFilters = useCallback(() => {
    setRoles(new Set()); setSpines(new Set()); setTypes(new Set()); setLayerSel(new Set());
    setPhases(new Set()); setRisks(new Set()); setPivotsOnly(false);
    setMinStrength(DEFAULT_MIN_STRENGTH);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { clearSelection(); setCycleMode(false); setCycleId(null); setSubgraphId(null); setSummaryOpen(false); setSubgraphMenuOpen(false); setSettingsOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearSelection]);

  // ── Search ─────────────────────────────────────────────────────────────
  const searchRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', h, true);
    return () => document.removeEventListener('mousedown', h, true);
  }, []);
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return graph.entities
      .filter(n => n.name.toLowerCase().includes(q)
        || (n.aliases || []).some(a => a.toLowerCase().includes(q))
        || (n.ticker || '').toLowerCase().includes(q)
        || (n.sectorLabel || '').toLowerCase().includes(q))
      .sort((a, b) => (b.criticality || 0) - (a.criticality || 0))
      .slice(0, 8);
  }, [query, graph]);

  // ── Legend counts + active filter count ────────────────────────────────
  // Counts for the legend and for the filter chips. `risk` counts EDGES (an
  // edge's risk is what the filter selects), `phase` counts entities.
  const legendCounts = useMemo(() => {
    const c = { role: {}, spine: {}, type: {}, tier: {}, status: {}, concentration: {},
                phase: {}, risk: {}, band: {}, plane: {} };
    graph.entities.forEach(n => {
      c.role[n.role] = (c.role[n.role] || 0) + 1;
      if (n.phase) c.phase[n.phase] = (c.phase[n.phase] || 0) + 1;
      if (n.band != null) c.band[n.band] = (c.band[n.band] || 0) + 1;
      if (n.plane) c.plane[n.plane] = (c.plane[n.plane] || 0) + 1;
    });
    graph.edges.forEach(e => {
      c.spine[e.spine] = (c.spine[e.spine] || 0) + 1;
      c.type[e.type] = (c.type[e.type] || 0) + 1;
      c.tier[e.sourceTier] = (c.tier[e.sourceTier] || 0) + 1;
      c.status[e.status] = (c.status[e.status] || 0) + 1;
      const r = e.risk?.level;
      if (r) c.risk[r] = (c.risk[r] || 0) + 1;
    });
    graph.layers.forEach(l => {
      const k = l.concentration?.level;
      if (k) c.concentration[k] = (c.concentration[k] || 0) + 1;
    });
    return c;
  }, [graph]);

  const activeFilterCount = roles.size + spines.size + types.size + layerSel.size
    + phases.size + risks.size + (pivotsOnly ? 1 : 0)
    + (minStrength !== DEFAULT_MIN_STRENGTH ? 1 : 0);

  const selectedEntity = selectedNodeId ? graph.entityById.get(selectedNodeId) : null;
  const adj = selectedNodeId ? adjacency.of(selectedNodeId) : null;
  const layerOpen = openLayer ? graph.layerById.get(openLayer) : null;
  const panelOpen = !!selectedEntity || !!layerOpen;

  const toggleIn = (setter) => (v) => setter(prev => {
    const next = new Set(prev);
    if (next.has(v)) next.delete(v); else next.add(v);
    return next;
  });

  // v1 had a «подробнее» link into the DC-AI research and a return address so
  // its «Назад» came back here. Both are GONE: this map no longer inherits the
  // data-centre taxonomy and no longer points at it. The terminology is
  // explained inside the map — see Glossed — and `onOpenResearch` is left in
  // the props only because CapitalFlowSection passes it to both maps.

  return (
    <div style={{
      position: 'relative',
      height: 'calc(100vh - 81px)',
      minHeight: 480,
      background: BG,
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes cfmSlide { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes cfmRise  { from { transform: translate(-50%, 14px); opacity: 0 } to { transform: translate(-50%, 0); opacity: 1 } }
        @keyframes cfmDrop  { from { transform: translateY(-10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        .ecm-root canvas { cursor: grab }
        .ecm-root canvas:active { cursor: grabbing }
      `}</style>

      <div className="ecm-root" style={{ position: 'absolute', inset: 0 }}>
        <EcoGraph
          fgRef={fgRef}
          graphData={graphData}
          regions={regions}
          techNodes={graph.techNodes}
          visibleNodes={visibleNodes}
          visibleEdges={visibleEdges}
          chain={chain}
          chainRoot={chainRoot}
          cycleEdges={cycleEdgesForGraph}
          cycleMode={cycleMode}
          cycleNodeSet={cycleNodeSet}
          subgraphLens={subgraphLens}
          spofById={graph.network.spofById}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onBackgroundClick={clearSelection}
          onRegionClick={(_type, key) => {
            // Every cell title opens a layer report now, the nucleus included:
            // in v1 the nucleus was a ROLE and had no report of its own, so
            // clicking it filtered the map instead. In v2 it is a layer like
            // any other, so it gets the same answer as any other.
            setOpenLayer(prev => (prev === key ? null : key));
          }}
          showLabels={showLabels}
          showTech={showTech}
        />
      </div>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        height: TOPBAR_H, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 16px', pointerEvents: 'none',
        // Over the map the bar is a scrim, so the canvas reads as continuous
        // underneath it. Over the table there is no canvas to show through —
        // only stray edges bleeding past the table's own top edge — so the bar
        // goes fully opaque, exactly as the flow map's does.
        background: view === 'map' ? 'var(--cf-scrim)' : 'var(--cf-canvas)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto', minWidth: 0 }}>
          <button onClick={() => (view !== 'map' ? setView('map') : onBack())}
            title={view !== 'map' ? t('Назад к карте', 'Back to the map') : t('К библиотеке исследований', 'Back to the research library')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '6px 10px 6px 6px',
              background: 'var(--cf-topbar)', border: '1px solid var(--cf-border)', borderRadius: 8,
              color: 'var(--cf-text3)', fontSize: 11, fontFamily: MONO, fontWeight: 600, cursor: 'pointer',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cf-text0)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cf-text3)'; }}>
            <ChevronLeft size={13} /> {view !== 'map' ? t('К карте', 'To the map') : t('Назад', 'Back')}
          </button>
          {mapSwitch}
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 0 }}>
              <span title={t('Сеть ключевых узлов ИИ-инфраструктуры (в v2 карта была якорной на NVIDIA)', 'The network of key AI-infrastructure nodes (in v2 the map was anchored on NVIDIA)')}
                style={{ fontSize: 14, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                {t('Экосистема ИИ', 'AI Ecosystem')}
              </span>
              <span title={t('Месяц прогона месячного конвейера движка', 'The month of the engine\'s monthly pipeline run')}
                style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {t('НА', 'AS OF')} {META.asOf || META.generated || '—'}
              </span>
              {/* The ONE behavioural difference between draft and real data.
                  It reads `source` straight out of the payload, so the day the
                  engine's file lands it disappears by itself — no flag, no code
                  edit. Deliberately a chip in the top bar rather than a banner
                  over the canvas: it has to be impossible to miss and equally
                  impossible to be in the way of the map underneath. Truncates
                  with an ellipsis rather than wrapping — a second line is what
                  used to escape the bar's fixed height and overlap the canvas. */}
              {META.isFixture && (
                <span title={t('Данные пока черновые: цифры и цитаты правдоподобны, но не проверены. Плашка исчезнет сама, когда придёт первый прогон движка.', 'The data is still a draft: the numbers and quotes are plausible but unverified. This banner disappears on its own once the first engine run lands.')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '2px 7px', borderRadius: 5,
                    border: '1px dashed var(--cf-warn)', color: 'var(--cf-warn)',
                    fontSize: 8.5, fontFamily: MONO, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    whiteSpace: 'nowrap', cursor: 'help', overflow: 'hidden', textOverflow: 'ellipsis',
                    minWidth: 0,
                  }}>
                  <AlertTriangle size={9} style={{ flexShrink: 0 }} />
                  {t('Черновые данные', 'Draft data')}
                </span>
              )}
            </div>
            {/* Everything the old inline line spelled out (pivots, subgraphs,
                SPOF, density, degree, clustering) now lives ONLY in NetworkSummary
                — this stays one short line that never wraps into the canvas. */}
            <button onClick={() => setSummaryOpen(o => !o)}
              title={t('Сводка сети: ключевые узлы, подграфы, точки отказа, плотность, средняя степень, кластеризация', 'Network summary: key nodes, subgraphs, points of failure, density, average degree, clustering')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', padding: 0, marginTop: 2, cursor: 'pointer', font: 'inherit',
              }}>
              <span style={{ fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, whiteSpace: 'nowrap' }}>
                {visibleNodes.size}<span style={{ color: 'var(--cf-text7)' }}>/{graph.stats.entityCount}</span> {t('сущ.', 'ent.')}
                <span style={{ color: 'var(--cf-text9)' }}> · </span>
                {visibleEdges.size}<span style={{ color: 'var(--cf-text7)' }}>/{graph.stats.edgeCount}</span> {t('связ.', 'links')}
                <span style={{ color: 'var(--cf-text9)' }}> · </span>
                {graph.stats.layerCount} {t('слоёв', 'layers')}
              </span>
              <Waypoints size={10} style={{ color: summaryOpen ? 'var(--cf-accent)' : 'var(--cf-text7)', flexShrink: 0 }} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative', pointerEvents: 'auto', width: 'min(240px, 22vw)', flexShrink: 1 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--cf-text7)' }} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions[0]) { focusEntity(suggestions[0].id); setSearchOpen(false); }
              if (e.key === 'Escape') { setQuery(''); setSearchOpen(false); }
            }}
            placeholder={view === 'table' ? t('Поиск по таблице…', 'Search the table…') : t('Найти в экосистеме…', 'Find in the ecosystem…')}
            style={{
              width: '100%', padding: '7px 26px 7px 27px',
              background: 'var(--cf-topbar)', border: '1px solid var(--cf-border)', borderRadius: 8,
              color: 'var(--cf-text1)', fontSize: 11.5, fontFamily: MONO, outline: 'none',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 2, lineHeight: 0 }}>
              <X size={12} />
            </button>
          )}
          {view === 'map' && searchOpen && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
              background: 'var(--cf-popover)', border: '1px solid var(--cf-border)', borderRadius: 8,
              overflow: 'hidden', boxShadow: '0 16px 40px -12px var(--cf-shadow)',
              animation: 'cfmDrop 140ms ease-out',
            }}>
              {suggestions.map(n => (
                <button key={n.id} onClick={() => { focusEntity(n.id); setSearchOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '7px 10px', background: 'transparent', border: 'none',
                    borderBottom: '1px solid var(--cf-border-hair)', cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: n.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, color: 'var(--cf-text1)', fontWeight: 600 }}>{n.name}</span>
                  <span style={{ fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO, marginLeft: 'auto' }}>
                    {n.primaryLayerLabel || n.primaryLayer} · {n.criticality}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>
          {/* Круги — a PICKER, not a paint-everything toggle: it opens the
              circuit list (bottom-right) ALREADY SHOWING the first circuit, so
              the map is never blank while you choose; picking another swaps it.
              Never all 140 contours stacked on each other. */}
          <TopBtn
            onClick={() => {
              const turningOn = !cycleMode;
              setCycleMode(turningOn);
              if (!turningOn) setCycleId(null);   // the default is picked below
              setCycleListOpen(true);
              if (turningOn) { setChainRoot(null); setSubgraphId(null); setSubgraphMenuOpen(false); }
            }}
            label={t('Круги — замкнутые контуры сбыта, финансирования и лок-ина. Карта показывает один контур за раз; выберите любой в списке.', 'Loops — closed circuits of sales, funding and lock-in. The map shows one loop at a time; pick any from the list.')}
            active={cycleMode} wide>
            <Sparkles size={12} /> {activeCycle ? activeCycle.typeLabel : t('Круги', 'Loops')}
            {!activeCycle && graph.stats.cycleCount ? ` · ${graph.stats.cycleCount}` : ''}
          </TopBtn>
          {/* Subgraph lens — a third lens beside Круги. Picks one of the three
              stacks; the chosen one lights and everything else leaves the
              render, the same "remove, don't dim" the chain uses. */}
          {view === 'map' && graph.network.subgraphs.length > 0 && (
            <div style={{ position: 'relative' }}>
              <TopBtn
                onClick={() => setSubgraphMenuOpen(o => !o)}
                label={t('Подграфы — три стека сети: GPU, TPU и общий хребет инфраструктуры. Выбор подсвечивает один, остальное гаснет.', 'Subgraphs — the network\'s three stacks: GPU, TPU and the shared infrastructure spine. Selecting one lights it and dims the rest.')}
                active={!!subgraphId || subgraphMenuOpen} wide>
                <Network size={12} /> {subgraphLens ? subgraphLens.label : t('Подграфы', 'Subgraphs')}
                {subgraphLens && <X size={11} onClick={(e) => { e.stopPropagation(); setSubgraphId(null); setSubgraphMenuOpen(false); }} />}
              </TopBtn>
              {subgraphMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50, width: 260,
                  background: 'var(--cf-popover)', border: '1px solid var(--cf-border)', borderRadius: 9,
                  overflow: 'hidden', boxShadow: '0 16px 40px -12px var(--cf-shadow)', animation: 'cfmDrop 140ms ease-out',
                }}>
                  {graph.network.subgraphs.map(sg => (
                    <button key={sg.id}
                      onClick={() => {
                        setSubgraphId(prev => (prev === sg.id ? null : sg.id));
                        setSubgraphMenuOpen(false);
                        setChainRoot(null); setSelectedNodeId(null); setCycleMode(false);
                      }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                        padding: '9px 11px', border: 'none',
                        borderBottom: '1px solid var(--cf-border-hair)',
                        background: subgraphId === sg.id ? 'var(--cf-hover)' : 'transparent',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = subgraphId === sg.id ? 'var(--cf-hover)' : 'transparent')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: sg.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cf-text1)' }}>{sg.label}</span>
                        <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--cf-text7)' }}>
                          {sg.nodeCount} {t('узл.', 'nodes')} · {sg.edgeCount} {t('св.', 'links')}
                        </span>
                        {sg.degenerate && (
                          <span title={t('Подграф вырожден: структурно это почти один узел со своими частями, а не самостоятельный ландшафт.', 'The subgraph is degenerate: structurally it is almost one node with its parts, not a landscape of its own.')}
                            style={{ marginLeft: 'auto', fontSize: 8, fontFamily: MONO, color: 'var(--cf-warn)', fontWeight: 700, cursor: 'help' }}>
                            {t('вырожден', 'degenerate')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--cf-text5)', lineHeight: 1.45, marginTop: 4 }}>{sg.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <TopBtn onClick={() => (view === 'table' ? setView('map') : (setView('table'), setDrawerOpen(false)))}
            label={view === 'table' ? t('Назад к карте', 'Back to the map') : t('Таблица — вся экосистема списком, с сортировкой по любому столбцу', 'Table — the whole ecosystem as a list, sortable on every column')}
            active={view === 'table'} wide>
            {view === 'table' ? <Share2 size={12} /> : <Table2 size={12} />}
            {view === 'table' ? t('Карта', 'Map') : t('Таблица', 'Table')}
          </TopBtn>
          <TopBtn onClick={() => setDrawerOpen(o => !o)}
            label={t('Фильтры: роль, хребет, тип связи, слой, порог существенности', 'Filters: role, spine, link type, layer, materiality threshold')}
            active={drawerOpen || activeFilterCount > 0} wide>
            <SlidersHorizontal size={12} />
            {t('Фильтры', 'Filters')}{activeFilterCount ? ` · ${activeFilterCount}` : ''}
          </TopBtn>
          {/* Vid settings — tech-node visibility, labels, reset-to-home, all
              merged into one gear menu so the bar doesn't carry three
              icon-only buttons whose meaning only a tooltip explains. */}
          {view === 'map' && (
            <div style={{ position: 'relative' }}>
              <TopBtn onClick={() => setSettingsOpen(o => !o)} label={t('Вид карты: тех-узлы, подписи, сброс позиций', 'Map view: tech nodes, labels, reset positions')} active={settingsOpen}>
                <Settings2 size={12} />
              </TopBtn>
              {settingsOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50, width: 210,
                  background: 'var(--cf-popover)', border: '1px solid var(--cf-border)', borderRadius: 9,
                  overflow: 'hidden', boxShadow: '0 16px 40px -12px var(--cf-shadow)', animation: 'cfmDrop 140ms ease-out',
                  padding: 4,
                }}>
                  <SettingsToggle icon={Cpu} label={t('Тех-узлы', 'Tech nodes')} hint={t('EUV, CUDA, CoWoS — спутники при владельце', 'EUV, CUDA, CoWoS — satellites around their owner')}
                    checked={showTech} onClick={() => setShowTech(s => !s)} />
                  <SettingsToggle icon={Tag} label={t('Подписи', 'Labels')} hint={t('Названия компаний на карте', 'Company names on the map')}
                    checked={showLabels} onClick={() => setShowLabels(s => !s)} />
                  <div style={{ height: 1, background: 'var(--cf-border-hair)', margin: '4px 6px' }} />
                  <button onClick={() => { resetView(); setSettingsOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', cursor: 'pointer',
                      padding: '7px 8px', border: 'none', borderRadius: 6, background: 'transparent',
                      color: 'var(--cf-text2)', fontSize: 11,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <Maximize2 size={12} style={{ color: 'var(--cf-text6)' }} />
                    {t('Восстановить вид', 'Restore the view')}
                  </button>
                </div>
              )}
            </div>
          )}
          {(selectedNodeId || chainRoot || openLayer) && (
            <TopBtn onClick={clearSelection} label={t('Снять выделение (Esc)', 'Clear the selection (Esc)')} wide>
              {t('Сброс', 'Reset')} · Esc
            </TopBtn>
          )}
        </div>
      </div>

      {/* ── Chain controls — only while a chain is lit ──────────────────── */}
      {view === 'map' && chainRoot && !cycleMode && (
        <ChainControls
          depth={chainDepth} onDepth={setChainDepth}
          dir={chainDir} onDir={setChainDir}
          kind={chainKind} onKind={setChainKind}
          more={chain.more}
          entityById={graph.entityById}
          onExpand={(key) => setExpanded(prev => new Set(prev).add(key))}
          top={TOPBAR_H + 10}
        />
      )}

      {/* ── Filter drawer ──────────────────────────────────────────────── */}
      {drawerOpen && (
        <EcoFilterBar
          topInset={TOPBAR_H}
          layers={graph.layers}
          roles={roles} onToggleRole={toggleIn(setRoles)}
          spines={spines} onToggleSpine={toggleIn(setSpines)}
          types={types} onToggleType={toggleIn(setTypes)}
          typesPresent={legendCounts.type}
          layerSel={layerSel} onToggleLayer={toggleIn(setLayerSel)}
          phases={phases} onTogglePhase={toggleIn(setPhases)} phasesPresent={legendCounts.phase}
          risks={risks} onToggleRisk={toggleIn(setRisks)} risksPresent={legendCounts.risk}
          pivotsOnly={pivotsOnly} onTogglePivotsOnly={() => setPivotsOnly(p => !p)}
          pivotCount={graph.stats.pivotalCount}
          minStrength={minStrength} onMinStrength={setMinStrength}
          shownEntities={visibleNodes.size} totalEntities={graph.stats.entityCount}
          shownEdges={visibleEdges.size} totalEdges={graph.stats.edgeCount}
          activeCount={activeFilterCount}
          onReset={resetFilters}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Table — the whole ecosystem as sortable rows ─────────────────── */}
      {view === 'table' && (
        <EcoTable
          topInset={TOPBAR_H}
          entities={graph.entities}
          layers={graph.layers}
          layerById={graph.layerById}
          query={query}
          visibleEntities={visibleNodes}
          onOpenEntity={focusEntity}
        />
      )}

      {/* Empty state */}
      {view === 'map' && visibleEdges.size === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 8,
        }}>
          <div style={{
            padding: '16px 20px', background: 'var(--cf-panel)',
            border: '1px solid var(--cf-border)', borderRadius: 10,
            fontSize: 12, color: 'var(--cf-text3)', fontFamily: MONO, textAlign: 'center',
          }}>
            {graph.stats.edgeCount === 0 ? (
              <>
                <span style={{ color: 'var(--cf-accent)', fontWeight: 700, letterSpacing: '0.08em' }}>{t('ПУСТО', 'EMPTY')}</span><br />
                <span style={{ display: 'inline-block', marginTop: 6 }}>{t('Карта экосистемы ещё не наполнена.', 'The ecosystem map has not been populated yet.')}</span><br />
                <span style={{ color: 'var(--cf-text7)', fontSize: 11 }}>{t('Ждём месячный прогон движка с', 'Waiting on the engine\'s monthly run with')} <code>aiEcosystemNetwork.json</code>.</span>
              </>
            ) : (
              <>
                {t('Под эти фильтры не попала ни одна связь.', 'No link matches these filters.')}<br />
                <span style={{ color: 'var(--cf-text7)', fontSize: 11 }}>{t('Опустите порог существенности или снимите фильтр.', 'Lower the materiality threshold or drop a filter.')}</span>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'map' && crumbs.length > 1 && !cycleMode && !selectedEdge && (
        <ChainCrumbs
          crumbs={crumbs}
          rootId={chainRoot}
          counts={chain.counts}
          onOpenEntity={focusEntity}
          onClear={clearSelection}
          rightInset={panelOpen ? ECO_PANEL_W : 0}
        />
      )}

      {view === 'map' && selectedEdge && (
        <EcoEdgeCard
          edge={selectedEdge}
          source={graph.entityById.get(selectedEdge.sourceId)}
          target={graph.entityById.get(selectedEdge.targetId)}
          onOpenEntity={focusEntity}
          isFixture={META.isFixture}
          onClose={() => setSelectedEdgeId(null)}
          rightInset={panelOpen ? ECO_PANEL_W : 0}
        />
      )}

      {view === 'map' && cycleMode && (
        <CycleLegend
          cycles={graph.cycles}
          activeCycleId={cycleId}
          listOpen={cycleListOpen}
          onSelect={(id) => { setCycleId(id); setCycleListOpen(false); }}
          onBack={() => setCycleListOpen(true)}
          onClose={() => { setCycleMode(false); setCycleId(null); setCycleListOpen(true); }}
          entityById={graph.entityById}
          onOpenEntity={focusEntity}
        />
      )}

      {view === 'map' && summaryOpen && (
        <NetworkSummary
          network={graph.network}
          version={META.version}
          spofByEntity={graph.network.spof}
          onOpenEntity={focusEntity}
          onOpenSubgraph={(id) => { setSubgraphId(id); setSummaryOpen(false); setChainRoot(null); setSelectedNodeId(null); setCycleMode(false); }}
          onClose={() => setSummaryOpen(false)}
        />
      )}

      {selectedEntity && !layerOpen && (
        <EcoEntityPanel
          topInset={TOPBAR_H}
          entity={selectedEntity}
          up={adj?.up || []}
          down={adj?.down || []}
          entityById={graph.entityById}
          layerById={graph.layerById}
          isFixture={META.isFixture}
          glossary={glossary}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={setSelectedEdgeId}
          onOpenEntity={focusEntity}
          onOpenLayer={(id) => setOpenLayer(id)}
          onClose={() => { setSelectedNodeId(null); setChainRoot(null); }}
        />
      )}

      {/* The subgraph brief — what this sub-ecosystem IS, so the lens answers
          "how does this work" and not only "which tiles light up". Yields to an
          open entity or layer panel: they occupy the same edge, and the one the
          reader asked for most recently wins. */}
      {view === 'map' && subgraphLens && !selectedEntity && !layerOpen && (
        <SubgraphBrief
          topInset={TOPBAR_H}
          subgraph={subgraphLens}
          entityById={graph.entityById}
          layerById={graph.layerById}
          onOpenEntity={focusEntity}
          onClose={() => setSubgraphId(null)}
        />
      )}

      {layerOpen && (
        <LayerReport
          topInset={TOPBAR_H}
          layer={layerOpen}
          entityById={graph.entityById}
          edges={graph.edges}
          changelog={META.changelog}
          onOpenEntity={focusEntity}
          onClose={() => setOpenLayer(null)}
        />
      )}
    </div>
  );
}

// ── Chain controls — depth · direction · relation kind, plus "ещё N" ─────
function ChainControls({ depth, onDepth, dir, onDir, kind, onKind, more, entityById, onExpand, top }) {
  const t = useT();
  return (
    <div style={{
      position: 'absolute', top, left: 14, zIndex: 24,
      background: 'var(--cf-panel)', border: '1px solid var(--cf-border)', borderRadius: 10,
      backdropFilter: 'blur(8px)', boxShadow: '0 16px 40px -16px var(--cf-shadow)',
      padding: '9px 11px 10px', width: 216,
      animation: 'cfmDrop 180ms ease-out',
    }}>
      <div style={{
        fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8,
      }}>{t('Цепочка', 'Chain')}</div>

      <Segmented label={t('Глубина', 'Depth')} value={depth} onChange={onDepth}
        options={CHAIN_DEPTHS.map(d => ({ value: d.value, label: d.label }))} />
      <Segmented label={t('Направление', 'Direction')} value={dir} onChange={onDir}
        options={Object.entries(CHAIN_DIRECTIONS).map(([k, v]) => ({ value: k, label: v.short, title: v.label }))} />
      <Segmented label={t('Тип связи', 'Link type')} value={kind} onChange={onKind}
        options={Object.entries(CHAIN_KINDS).map(([k, v]) => ({ value: k, label: v.short, title: `${v.label} — ${v.blurb}` }))} />

      {more.length > 0 && (
        <div style={{ marginTop: 9, paddingTop: 8, borderTop: '1px solid var(--cf-border-soft)' }}>
          <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, marginBottom: 5 }}>
            {t(`Ветвление обрезано до топ-${DEFAULT_BRANCH} по существенности`, `Branching trimmed to the top ${DEFAULT_BRANCH} by materiality`)}
          </div>
          {more.slice(0, 5).map(m => (
            <button key={m.key} onClick={() => onExpand(m.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, width: '100%', marginTop: 3,
                padding: '4px 6px', background: 'var(--cf-surface2)',
                border: '1px solid var(--cf-border)', borderRadius: 5, cursor: 'pointer',
                color: 'var(--cf-text3)', fontSize: 9.5, fontFamily: MONO, textAlign: 'left',
              }}>
              <RefreshCw size={9} />
              {entityById.get(m.nodeId)?.name || m.nodeId}: {t('ещё', 'plus')} {m.hidden} {m.dir === 'up' ? '↑' : '↓'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Segmented({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', gap: 3 }}>
        {options.map(o => (
          <button key={String(o.value)} onClick={() => onChange(o.value)} title={o.title}
            style={{
              flex: 1, padding: '4px 2px',
              background: value === o.value ? 'var(--cf-accent-bg)' : 'var(--cf-surface2)',
              border: `1px solid ${value === o.value ? 'var(--cf-accent-bd)' : 'var(--cf-border)'}`,
              borderRadius: 5, cursor: 'pointer',
              color: value === o.value ? 'var(--cf-accent)' : 'var(--cf-text4)',
              fontSize: 9, fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
            }}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

// ── Cycle lens — the "down popup" the top-bar Круги button opens. Two modes
// in one panel: the LIST of every circuit to choose from, and the DETAIL of
// the one currently lit. The lit circuit stays on the map in both modes — the
// list is for choosing the next one, not for clearing the map — and the lens
// opens with the first circuit already lit rather than on a blank canvas.
function CycleLegend({ cycles, activeCycleId, listOpen, onSelect, onBack, onClose, entityById, onOpenEntity }) {
  const t = useT();
  const lit = activeCycleId ? cycles.find(c => c.id === activeCycleId) : null;
  const active = listOpen ? null : lit;      // null → render the list

  return (
    <div style={{
      position: 'absolute', right: 14, bottom: 14, zIndex: 22, width: 340,
      background: 'var(--cf-panel)', border: '1px solid var(--cf-border)', borderRadius: 11,
      backdropFilter: 'blur(10px)', boxShadow: '0 22px 60px -22px var(--cf-shadow)',
      padding: '11px 13px 12px', maxHeight: '46vh', overflowY: 'auto',
      animation: 'cfmDrop 180ms ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
        {active && (
          <button onClick={onBack} title={t('Ко всем контурам', 'Back to all loops')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--cf-text6)', display: 'flex' }}>
            <ChevronLeft size={13} />
          </button>
        )}
        <div style={{
          fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>
          {active ? active.typeLabel : `${t('Контуры', 'Loops')} · ${cycles.length}`}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} title={t('Закрыть (Esc)', 'Close (Esc)')}
          style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 2, lineHeight: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
          <X size={14} />
        </button>
      </div>

      {!cycles.length && (
        <div style={{ fontSize: 11, color: 'var(--cf-text6)' }}>{t('Движок пока не нашёл ни одного круга.', 'The engine has not found a single loop yet.')}</div>
      )}

      {(active ? [active] : cycles).map(c => {
        const onMap = !active && c.id === activeCycleId;
        const row = (
          <>
            {!active && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: c.color, fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {c.typeLabel}
                </span>
                {/* Which row you are actually looking at on the canvas. The
                    list never empties the map, so without this marker there is
                    no way to tell which of the 140 is the one lit. */}
                {onMap && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 8, fontFamily: MONO, fontWeight: 700,
                    color: 'var(--cf-accent)', textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>{t('на карте', 'on the map')}</span>
                )}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', marginBottom: 5 }}>
              {(c.path || []).map((id, i) => (
                <span key={`${id}:${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  {i > 0 && <span style={{ color: 'var(--cf-text8)', fontSize: 10 }}>→</span>}
                  {active ? (
                    <button onClick={() => onOpenEntity(id)} style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      color: 'var(--cf-text2)', fontSize: 11, fontWeight: 600,
                    }}>{entityById.get(id)?.name || id}</button>
                  ) : (
                    <span style={{ color: 'var(--cf-text2)', fontSize: 11, fontWeight: 600 }}>{entityById.get(id)?.name || id}</span>
                  )}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--cf-text5)', lineHeight: 1.5 }}>{c.note}</div>
          </>
        );
        return active ? (
          <div key={c.id}>{row}</div>
        ) : (
          // NB: no scrollIntoView on the lit row, however tempting — it scrolls
          // every scrollable ancestor, and here that pushed the map canvas
          // itself out of view: the lens looked broken while the panel was
          // perfectly correct. The «на карте» marker is enough to find the row.
          <button key={c.id} onClick={() => onSelect(c.id)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
              background: onMap ? 'var(--cf-accent-bg)' : 'transparent',
              border: `1px solid ${onMap ? 'var(--cf-accent-bd)' : 'transparent'}`, borderRadius: 7,
              padding: '6px 6px', marginBottom: 4,
            }}
            onMouseEnter={(e) => { if (!onMap) e.currentTarget.style.background = 'var(--cf-hover)'; }}
            onMouseLeave={(e) => { if (!onMap) e.currentTarget.style.background = 'transparent'; }}>
            {row}
          </button>
        );
      })}
    </div>
  );
}

function SettingsToggle({ icon: Icon, label, hint, checked, onClick }) {
  return (
    <button onClick={onClick} title={hint}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '7px 8px', border: 'none', borderRadius: 6, background: 'transparent',
        color: 'var(--cf-text2)', fontSize: 11,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
      <Icon size={12} style={{ color: 'var(--cf-text6)', flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{
        width: 26, height: 15, borderRadius: 8, flexShrink: 0, position: 'relative',
        background: checked ? 'var(--cf-accent-bg)' : 'var(--cf-surface2)',
        border: `1px solid ${checked ? 'var(--cf-accent-bd)' : 'var(--cf-border)'}`,
      }}>
        <span style={{
          position: 'absolute', top: 1, left: checked ? 12 : 1, width: 11, height: 11, borderRadius: '50%',
          background: checked ? 'var(--cf-accent)' : 'var(--cf-text6)', transition: 'left 120ms',
        }} />
      </span>
    </button>
  );
}

function TopBtn({ children, onClick, label, active, wide }) {
  return (
    <button onClick={onClick} title={label} aria-label={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        height: 30, padding: wide ? '0 11px' : 0, width: wide ? 'auto' : 30,
        background: active ? 'var(--cf-accent-bg)' : 'var(--cf-topbar)',
        border: `1px solid ${active ? 'var(--cf-accent-bd)' : 'var(--cf-border)'}`,
        borderRadius: 8,
        color: active ? 'var(--cf-accent)' : 'var(--cf-text3)',
        cursor: 'pointer',
        fontSize: 10, fontFamily: MONO, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.07em',
        transition: 'all 130ms', whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cf-text9)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = active ? 'var(--cf-accent-bd)' : 'var(--cf-border)'; }}>
      {children}
    </button>
  );
}
