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
  Sparkles, Cpu, Table2, Share2, AlertTriangle, Network,
} from 'lucide-react';
import EcoGraph from './EcoGraph.jsx';
import EcoEntityPanel, { ECO_PANEL_W } from './EcoEntityPanel.jsx';
import LayerReport from './LayerReport.jsx';
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

const MONO = 'ui-monospace, monospace';
const BG = 'var(--cf-canvas)';
const TOPBAR_H = 62;

export default function EcosystemMap({ onBack, onOpenResearch, mapSwitch }) {
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
  // v3: the subgraph lens. Holds the active subgraph id, or null. Mutually
  // exclusive with the chain and cycle lenses — one answer on screen at a time.
  const [subgraphId, setSubgraphId] = useState(null);
  const [subgraphMenuOpen, setSubgraphMenuOpen] = useState(false);
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

  // ── The chain ──────────────────────────────────────────────────────────
  const chain = useMemo(() => buildChain(chainRoot, {
    adjacency,
    depth: chainDepth,
    direction: chainDir,
    kind: chainKind,
    branch: DEFAULT_BRANCH,
    minStrength,
    expanded,
  }), [chainRoot, adjacency, chainDepth, chainDir, chainKind, minStrength, expanded]);

  const crumbs = useMemo(() => (chainRoot ? principalPath(chainRoot, {
    adjacency, chain, entityById: graph.entityById, kind: chainKind, minStrength,
  }) : []), [chainRoot, adjacency, chain, graph, chainKind, minStrength]);

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
    setSubgraphId(null);               // a chain and a subgraph are two answers
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
    const onKey = (e) => { if (e.key === 'Escape') { clearSelection(); setCycleMode(false); setSubgraphId(null); setSummaryOpen(false); setSubgraphMenuOpen(false); } };
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
          cycleEdges={graph.cycleEdges}
          cycleMode={cycleMode}
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
        background: 'var(--cf-scrim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto', minWidth: 0 }}>
          <button onClick={() => (view !== 'map' ? setView('map') : onBack())}
            title={view !== 'map' ? 'Назад к карте' : 'К библиотеке исследований'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '6px 10px 6px 6px',
              background: 'var(--cf-topbar)', border: '1px solid var(--cf-border)', borderRadius: 8,
              color: 'var(--cf-text3)', fontSize: 11, fontFamily: MONO, fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cf-text0)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cf-text3)'; }}>
            <ChevronLeft size={13} /> {view !== 'map' ? 'К карте' : 'Назад'}
          </button>
          {mapSwitch}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span title="Сеть из 26 равноправных пивотов ИИ-инфраструктуры (в v2 карта была якорной на NVIDIA)"
                style={{ fontSize: 15, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                Экосистема ИИ
              </span>
              <span title="Месяц прогона месячного конвейера движка"
                style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                НА {META.asOf || META.generated || '—'}
              </span>
              {/* The ONE behavioural difference between draft and real data.
                  It reads `source` straight out of the payload, so the day the
                  engine's file lands it disappears by itself — no flag, no code
                  edit. Deliberately a chip in the top bar rather than a banner
                  over the canvas: it has to be impossible to miss and equally
                  impossible to be in the way of the map underneath. */}
              {META.isFixture && (
                <span title="Данные пока черновые: цифры и цитаты правдоподобны, но не проверены. Плашка исчезнет сама, когда придёт первый прогон движка."
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '2px 7px', borderRadius: 5,
                    border: '1px dashed var(--cf-warn)', color: 'var(--cf-warn)',
                    fontSize: 8.5, fontFamily: MONO, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    whiteSpace: 'nowrap', cursor: 'help',
                  }}>
                  <AlertTriangle size={9} />
                  Черновые данные — ждём первый прогон движка
                </span>
              )}
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 2, whiteSpace: 'nowrap' }}>
              {visibleNodes.size}<span style={{ color: 'var(--cf-text7)' }}>/{graph.stats.entityCount}</span> сущностей
              <span style={{ color: 'var(--cf-text9)' }}> · </span>
              {visibleEdges.size}<span style={{ color: 'var(--cf-text7)' }}>/{graph.stats.edgeCount}</span> связей
              <span style={{ color: 'var(--cf-text9)' }}> · </span>
              {graph.stats.layerCount} слоёв
              {graph.stats.cycleCount > 0 && (
                <>
                  <span style={{ color: 'var(--cf-text9)' }}> · </span>
                  <span style={{ color: 'var(--cf-warn)', fontWeight: 700 }}>
                    {graph.stats.cycleCount} {plural(graph.stats.cycleCount, ['круг', 'круга', 'кругов'])}
                  </span>
                </>
              )}
              {/* v3 extends the SAME line rather than adding a block: the
                  network counts sit right after the layer/cycle counts, and the
                  richer aggregates (density, degree, clustering) hang off a
                  click in NetworkSummary. */}
              <span style={{ color: 'var(--cf-text9)' }}> · </span>
              <button onClick={() => setSummaryOpen(o => !o)} title="Сводка сети: плотность, средняя степень, кластеризация"
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit',
                  color: summaryOpen ? 'var(--cf-accent)' : 'var(--cf-text5)', textDecoration: 'underline', textDecorationStyle: 'dotted',
                }}>
                {graph.stats.pivotalCount} {plural(graph.stats.pivotalCount, ['пивот', 'пивота', 'пивотов'])}
                <span style={{ color: 'var(--cf-text9)' }}> · </span>
                {graph.network.subgraphs.length} {plural(graph.network.subgraphs.length, ['подграф', 'подграфа', 'подграфов'])}
                {graph.network.spof.length > 0 && (
                  <>
                    <span style={{ color: 'var(--cf-text9)' }}> · </span>
                    {graph.network.spof.length} {plural(graph.network.spof.length, ['точка отказа', 'точки отказа', 'точек отказа'])}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative', pointerEvents: 'auto', width: 'min(280px, 26vw)' }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--cf-text7)' }} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions[0]) { focusEntity(suggestions[0].id); setSearchOpen(false); }
              if (e.key === 'Escape') { setQuery(''); setSearchOpen(false); }
            }}
            placeholder={view === 'table' ? 'Поиск по таблице…' : 'Найти в экосистеме…'}
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
                    {n.segments.map(s => s.layer).join('·')} · {n.criticality}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>
          <TopBtn
            onClick={() => { setCycleMode(c => !c); if (!cycleMode) { setChainRoot(null); setSubgraphId(null); } }}
            label="Круги — замкнутые контуры сбыта и финансирования. Единственная линза без оценок: цикл есть свойство графа."
            active={cycleMode} wide>
            <Sparkles size={12} /> Круги{graph.stats.cycleCount ? ` · ${graph.stats.cycleCount}` : ''}
          </TopBtn>
          {/* Subgraph lens — a third lens beside Круги. Picks one of the three
              stacks; the chosen one lights and everything else leaves the
              render, the same "remove, don't dim" the chain uses. */}
          {view === 'map' && graph.network.subgraphs.length > 0 && (
            <div style={{ position: 'relative' }}>
              <TopBtn
                onClick={() => setSubgraphMenuOpen(o => !o)}
                label="Подграфы — три стека сети: GPU, TPU и общий хребет инфраструктуры. Выбор подсвечивает один, остальное гаснет."
                active={!!subgraphId || subgraphMenuOpen} wide>
                <Network size={12} /> {subgraphLens ? subgraphLens.label : 'Подграфы'}
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
                          {sg.nodeCount} узл. · {sg.edgeCount} св.
                        </span>
                        {sg.degenerate && (
                          <span title="Подграф вырожден: структурно это почти один узел со своими частями, а не самостоятельный ландшафт."
                            style={{ marginLeft: 'auto', fontSize: 8, fontFamily: MONO, color: 'var(--cf-warn)', fontWeight: 700, cursor: 'help' }}>
                            вырожден
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
            label={view === 'table' ? 'Назад к карте' : 'Таблица — вся экосистема списком, с сортировкой по любому столбцу'}
            active={view === 'table'} wide>
            {view === 'table' ? <Share2 size={12} /> : <Table2 size={12} />}
            {view === 'table' ? 'Карта' : 'Таблица'}
          </TopBtn>
          <TopBtn onClick={() => setDrawerOpen(o => !o)}
            label="Фильтры: роль, хребет, тип связи, слой, порог существенности"
            active={drawerOpen || activeFilterCount > 0} wide>
            <SlidersHorizontal size={12} />
            Фильтры{activeFilterCount ? ` · ${activeFilterCount}` : ''}
          </TopBtn>
          {view === 'map' && (
            <>
              <TopBtn onClick={() => setShowTech(s => !s)} label="Тех-узлы: EUV, CUDA, CoWoS — спутники при владельце" active={showTech}>
                <Cpu size={12} />
              </TopBtn>
              <TopBtn onClick={() => setShowLabels(s => !s)} label="Показать / скрыть подписи" active={showLabels}>
                <Tag size={12} />
              </TopBtn>
              <TopBtn onClick={resetView} label="Вернуть всё на место — плитки на исходные позиции и вид целиком">
                <Maximize2 size={12} />
              </TopBtn>
            </>
          )}
          {(selectedNodeId || chainRoot || openLayer) && (
            <TopBtn onClick={clearSelection} label="Снять выделение (Esc)" wide>
              Сброс · Esc
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
                <span style={{ color: 'var(--cf-accent)', fontWeight: 700, letterSpacing: '0.08em' }}>ПУСТО</span><br />
                <span style={{ display: 'inline-block', marginTop: 6 }}>Карта экосистемы ещё не наполнена.</span><br />
                <span style={{ color: 'var(--cf-text7)', fontSize: 11 }}>Ждём месячный прогон движка с <code>aiEcosystemNetwork.json</code>.</span>
              </>
            ) : (
              <>
                Под эти фильтры не попала ни одна связь.<br />
                <span style={{ color: 'var(--cf-text7)', fontSize: 11 }}>Опустите порог существенности или снимите фильтр.</span>
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

      {view === 'map' && cycleMode && <CycleLegend cycles={graph.cycles} entityById={graph.entityById} onOpenEntity={focusEntity} />}

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
      }}>Цепочка</div>

      <Segmented label="Глубина" value={depth} onChange={onDepth}
        options={CHAIN_DEPTHS.map(d => ({ value: d.value, label: d.label }))} />
      <Segmented label="Направление" value={dir} onChange={onDir}
        options={Object.entries(CHAIN_DIRECTIONS).map(([k, v]) => ({ value: k, label: v.short, title: v.label }))} />
      <Segmented label="Тип связи" value={kind} onChange={onKind}
        options={Object.entries(CHAIN_KINDS).map(([k, v]) => ({ value: k, label: v.short, title: `${v.label} — ${v.blurb}` }))} />

      {more.length > 0 && (
        <div style={{ marginTop: 9, paddingTop: 8, borderTop: '1px solid var(--cf-border-soft)' }}>
          <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, marginBottom: 5 }}>
            Ветвление обрезано до топ-{DEFAULT_BRANCH} по существенности
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
              {entityById.get(m.nodeId)?.name || m.nodeId}: ещё {m.hidden} {m.dir === 'up' ? '↑' : '↓'}
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

// ── Cycle lens legend — what each lit contour actually is ────────────────
function CycleLegend({ cycles, entityById, onOpenEntity }) {
  return (
    <div style={{
      position: 'absolute', right: 14, bottom: 14, zIndex: 22, width: 340,
      background: 'var(--cf-panel)', border: '1px solid var(--cf-border)', borderRadius: 11,
      backdropFilter: 'blur(10px)', boxShadow: '0 22px 60px -22px var(--cf-shadow)',
      padding: '11px 13px 12px', maxHeight: '46vh', overflowY: 'auto',
      animation: 'cfmDrop 180ms ease-out',
    }}>
      <div style={{
        fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 9,
      }}>Замкнутые контуры · {cycles.length}</div>
      {!cycles.length && (
        <div style={{ fontSize: 11, color: 'var(--cf-text6)' }}>Движок пока не нашёл ни одного круга.</div>
      )}
      {cycles.map(c => (
        <div key={c.id} style={{ marginBottom: 11, paddingBottom: 10, borderBottom: '1px solid var(--cf-border-hair)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: c.color, fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {c.typeLabel}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', marginBottom: 5 }}>
            {(c.path || []).map((id, i) => (
              <span key={`${id}:${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                {i > 0 && <span style={{ color: 'var(--cf-text8)', fontSize: 10 }}>→</span>}
                <button onClick={() => onOpenEntity(id)} style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: 'var(--cf-text2)', fontSize: 11, fontWeight: 600,
                }}>{entityById.get(id)?.name || id}</button>
              </span>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--cf-text5)', lineHeight: 1.5 }}>{c.note}</div>
        </div>
      ))}
    </div>
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

function plural(n, [one, few, many]) {
  const a = Math.abs(Math.round(n));
  const d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}
