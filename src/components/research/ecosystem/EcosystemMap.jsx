// ══════════════════════════════════════════════════════════════════════════
// EcosystemMap — FULL-SCREEN section shell for the second map.
//
// Renders src/data/ecosystemMap.json, the file the Capital Flow engine's
// MONTHLY pipeline exports. Nothing here is hard-coded: drop in the engine's
// file and the map changes with no code edit. That is the acceptance test.
//
// Its state is ENTIRELY its own — CapitalFlowSection mounts either this or the
// flow map, never both, so no filter, panel or selection is ever shared.
//
// CONTROLS
//   · Цепочка — depth · direction · relation kind. The map's main verb.
//   · Круги   — the cycle lens: sales contours in red, financing in amber.
//   · Порог   — the on-canvas strength floor (default 20; panels ignore it).
//   · Роль / хребет / слой — plain visibility filters.
// ══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  ChevronLeft, Search, X, Maximize2, Tag, SlidersHorizontal, RefreshCw,
  Sparkles, Cpu,
} from 'lucide-react';
import EcoGraph from './EcoGraph.jsx';
import EcoLegend from './EcoLegend.jsx';
import EcoEntityPanel, { ECO_PANEL_W } from './EcoEntityPanel.jsx';
import LayerReport from './LayerReport.jsx';
import ChainCrumbs from './ChainCrumbs.jsx';
import EcoFilterBar from './EcoFilterBar.jsx';
import { applyEcoLayout } from './ecoLayout.js';
import {
  buildChain, principalPath, CHAIN_KINDS, CHAIN_DIRECTIONS, CHAIN_DEPTHS, DEFAULT_BRANCH,
} from './chain.js';
import { buildGraph, buildAdjacency, META, DEFAULT_MIN_STRENGTH } from '../../../data/ecosystemMap.js';

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
    graph.nodes.forEach(n => m.set(n.id, { x: n.fx, y: n.fy }));
    return m;
  }, [graph, regions]);
  const adjacency = useMemo(() => buildAdjacency(graph.edges), [graph]);
  const graphData = useMemo(
    () => ({ nodes: graph.nodes, links: graph.edges }),
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
  const [minStrength, setMinStrength] = useState(DEFAULT_MIN_STRENGTH);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showTech, setShowTech] = useState(true);

  // ── Lenses + selection ─────────────────────────────────────────────────
  const [cycleMode, setCycleMode] = useState(false);
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
    const nodeOk = (n) => (!roles.size || roles.has(n.role))
      && (!layerSel.size || n.segments.some(s => layerSel.has(s.layer)));
    const nodes = new Set(graph.nodes.filter(nodeOk).map(n => n.id));
    const edges = new Set(
      graph.edges.filter(e =>
        (e.strength || 0) >= minStrength
        && (!spines.size || spines.has(e.spine))
        && (!types.size || types.has(e.type))
        && nodes.has(e.sourceId) && nodes.has(e.targetId)
      ).map(e => e.id)
    );
    return { visibleNodes: nodes, visibleEdges: edges };
  }, [graph, roles, layerSel, spines, types, minStrength]);

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
    adjacency, chain, nodeById: graph.nodeById, kind: chainKind, minStrength,
  }) : []), [chainRoot, adjacency, chain, graph, chainKind, minStrength]);

  // ── Interaction ────────────────────────────────────────────────────────
  const focusEntity = useCallback((id) => {
    const n = graph.nodeById.get(id);
    if (!n) return;
    setSelectedNodeId(id);
    setChainRoot(id);
    setExpanded(new Set());
    setOpenLayer(null);
    setSelectedEdgeId(null);
    setCycleMode(false);
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

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setChainRoot(null);
    setOpenLayer(null);
    setExpanded(new Set());
  }, []);

  // Reset = snap every company back to its pristine layout spot (undoing any
  // dragging), THEN re-frame. One click puts a messed-up board back — same
  // behaviour as the flow map's reset.
  const resetView = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    graph.nodes.forEach(n => {
      const p = homePositions.get(n.id);
      if (p) { n.fx = p.x; n.fy = p.y; n.x = p.x; n.y = p.y; }
    });
    fg.refresh?.();
    fg.zoomToFit(700, 80);
  }, [graph, homePositions]);

  const resetFilters = useCallback(() => {
    setRoles(new Set()); setSpines(new Set()); setTypes(new Set()); setLayerSel(new Set());
    setMinStrength(DEFAULT_MIN_STRENGTH);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { clearSelection(); setCycleMode(false); } };
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
    return graph.nodes
      .filter(n => n.name.toLowerCase().includes(q)
        || (n.ticker || '').toLowerCase().includes(q)
        || (n.sectorLabel || '').toLowerCase().includes(q))
      .sort((a, b) => (b.criticality || 0) - (a.criticality || 0))
      .slice(0, 8);
  }, [query, graph]);

  // ── Legend counts + active filter count ────────────────────────────────
  const legendCounts = useMemo(() => {
    const c = { role: {}, spine: {}, type: {}, tier: {}, concentration: {} };
    graph.nodes.forEach(n => { c.role[n.role] = (c.role[n.role] || 0) + 1; });
    graph.edges.forEach(e => {
      c.spine[e.spine] = (c.spine[e.spine] || 0) + 1;
      c.type[e.type] = (c.type[e.type] || 0) + 1;
      c.tier[e.tier] = (c.tier[e.tier] || 0) + 1;
    });
    graph.layers.forEach(l => {
      const k = l.concentration?.level;
      if (k) c.concentration[k] = (c.concentration[k] || 0) + 1;
    });
    return c;
  }, [graph]);

  const activeFilterCount = roles.size + spines.size + types.size + layerSel.size
    + (minStrength !== DEFAULT_MIN_STRENGTH ? 1 : 0);

  const selectedNode = selectedNodeId ? graph.nodeById.get(selectedNodeId) : null;
  const adj = selectedNodeId ? adjacency.of(selectedNodeId) : null;
  const layerOpen = openLayer ? graph.layerById.get(openLayer) : null;
  const panelOpen = !!selectedNode || !!layerOpen;

  const toggleIn = (setter) => (v) => setter(prev => {
    const next = new Set(prev);
    if (next.has(v)) next.delete(v); else next.add(v);
    return next;
  });

  const openDcNode = onOpenResearch ? (blockId) => onOpenResearch('data-centers-ai', { blockId }) : null;

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
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onBackgroundClick={clearSelection}
          onRegionClick={(type, key) => {
            // Only a LAYER title opens a report; the capital nucleus has no
            // report of its own — clicking it filters the map to that role.
            if (type === 'layer') setOpenLayer(prev => (prev === key ? null : key));
            else setRoles(prev => (prev.has('capital') ? new Set() : new Set(['capital'])));
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
          <button onClick={onBack} title="К библиотеке исследований"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '6px 10px 6px 6px',
              background: 'var(--cf-topbar)', border: '1px solid var(--cf-border)', borderRadius: 8,
              color: 'var(--cf-text3)', fontSize: 11, fontFamily: MONO, fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cf-text0)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cf-text3)'; }}>
            <ChevronLeft size={13} /> Назад
          </button>
          {mapSwitch}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                Экосистема
              </span>
              <span title="Месяц прогона месячного конвейера движка"
                style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                НА {META.asOf || META.generated || '—'}
              </span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 2, whiteSpace: 'nowrap' }}>
              {visibleNodes.size}<span style={{ color: 'var(--cf-text7)' }}>/{graph.stats.nodeCount}</span> компаний
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
            placeholder="Найти компанию…"
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
          {searchOpen && suggestions.length > 0 && (
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
            onClick={() => { setCycleMode(c => !c); if (!cycleMode) { setChainRoot(null); } }}
            label="Круги — замкнутые контуры сбыта и финансирования. Единственная линза без оценок: цикл есть свойство графа."
            active={cycleMode} wide>
            <Sparkles size={12} /> Круги{graph.stats.cycleCount ? ` · ${graph.stats.cycleCount}` : ''}
          </TopBtn>
          <TopBtn onClick={() => setDrawerOpen(o => !o)}
            label="Фильтры: роль, хребет, тип связи, слой, порог существенности"
            active={drawerOpen || activeFilterCount > 0} wide>
            <SlidersHorizontal size={12} />
            Фильтры{activeFilterCount ? ` · ${activeFilterCount}` : ''}
          </TopBtn>
          <TopBtn onClick={() => setShowTech(s => !s)} label="Тех-узлы: EUV, CUDA, CoWoS — спутники при владельце" active={showTech}>
            <Cpu size={12} />
          </TopBtn>
          <TopBtn onClick={() => setShowLabels(s => !s)} label="Показать / скрыть подписи" active={showLabels}>
            <Tag size={12} />
          </TopBtn>
          <TopBtn onClick={resetView} label="Вернуть всё на место — плитки на исходные позиции и вид целиком">
            <Maximize2 size={12} />
          </TopBtn>
          {(selectedNodeId || chainRoot || openLayer) && (
            <TopBtn onClick={clearSelection} label="Снять выделение (Esc)" wide>
              Сброс · Esc
            </TopBtn>
          )}
        </div>
      </div>

      {/* ── Chain controls — only while a chain is lit ──────────────────── */}
      {chainRoot && !cycleMode && (
        <ChainControls
          depth={chainDepth} onDepth={setChainDepth}
          dir={chainDir} onDir={setChainDir}
          kind={chainKind} onKind={setChainKind}
          more={chain.more}
          nodeById={graph.nodeById}
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
          minStrength={minStrength} onMinStrength={setMinStrength}
          activeCount={activeFilterCount}
          onReset={resetFilters}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* Empty state */}
      {visibleEdges.size === 0 && (
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
                <span style={{ color: 'var(--cf-text7)', fontSize: 11 }}>Ждём месячный прогон движка с <code>ecosystemMap.json</code>.</span>
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

      <EcoLegend counts={legendCounts} />

      {crumbs.length > 1 && !cycleMode && (
        <ChainCrumbs
          crumbs={crumbs}
          rootId={chainRoot}
          counts={chain.counts}
          onOpenEntity={focusEntity}
          onClear={clearSelection}
          rightInset={panelOpen ? ECO_PANEL_W : 0}
        />
      )}

      {cycleMode && <CycleLegend cycles={graph.cycles} nodeById={graph.nodeById} onOpenEntity={focusEntity} />}

      {selectedNode && !layerOpen && (
        <EcoEntityPanel
          topInset={TOPBAR_H}
          node={selectedNode}
          up={adj?.up || []}
          down={adj?.down || []}
          nodeById={graph.nodeById}
          layerById={graph.layerById}
          isFixture={META.isFixture}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={setSelectedEdgeId}
          onOpenEntity={focusEntity}
          onOpenLayer={(id) => setOpenLayer(id)}
          onOpenDcNode={openDcNode}
          onClose={() => { setSelectedNodeId(null); setChainRoot(null); }}
        />
      )}

      {layerOpen && (
        <LayerReport
          topInset={TOPBAR_H}
          layer={layerOpen}
          nodeById={graph.nodeById}
          edges={graph.edges}
          changelog={META.changelog}
          onOpenEntity={focusEntity}
          onOpenDcNode={openDcNode}
          onClose={() => setOpenLayer(null)}
        />
      )}
    </div>
  );
}

// ── Chain controls — depth · direction · relation kind, plus "ещё N" ─────
function ChainControls({ depth, onDepth, dir, onDir, kind, onKind, more, nodeById, onExpand, top }) {
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
        options={Object.entries(CHAIN_KINDS).map(([k, v]) => ({ value: k, label: v.short, title: v.label }))} />

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
              {nodeById.get(m.nodeId)?.name || m.nodeId}: ещё {m.hidden} {m.dir === 'up' ? '↑' : '↓'}
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
function CycleLegend({ cycles, nodeById, onOpenEntity }) {
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
                }}>{nodeById.get(id)?.name || id}</button>
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
