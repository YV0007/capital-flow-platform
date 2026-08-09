// ══════════════════════════════════════════════════════════════════════════
// CapitalFlowMap — FULL-SCREEN section shell.
//
// Renders src/data/capitalMap.json — the file the Capital Flow engine exports
// each cycle. Nothing here is hard-coded: swap in next week's file and the map
// changes with no code edit.
//
// The canvas fills the viewport below the app header; every control floats
// over it:
//   · top bar    — back, title + generated-date + live stats, search, controls
//   · filter drawer — sector · class · tier · event · status · min-flow
//   · legend     — bottom-left, collapsible
//   · entity panel (right) and flow card (bottom-centre) on selection
//
// FILTER SEMANTICS
//   · Sector · Class · Tier select ENTITIES (OR-unioned into a seed set).
//   · Event · Status · Min flow select FLOWS.
//   · A flow shows when it passes the flow filters AND touches ≥1 seeded
//     entity; an entity shows when it sits on a shown flow — so a sector
//     surfaces its targets AND the allocators funding them.
//   · Watch toggle reveals candidate-only ("watch / unconfirmed") entities,
//     which are kept off the main map by default (inclusion rule).
// Selection (click) dims everything outside the chosen neighbourhood; Esc /
// background click clears it.
// ══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  ChevronLeft, Search, X, Maximize2, Tag, SlidersHorizontal, Eye, Layers, Target,
  Table2, Share2,
} from 'lucide-react';
import FlowGraph from './FlowGraph.jsx';
import FilterDrawer from './FilterBar.jsx';
import Legend from './Legend.jsx';
import EntityPanel from './EntityPanel.jsx';
import AllocatorDeepDive from './AllocatorDeepDive.jsx';
import RosterTable from './RosterTable.jsx';
import useWatchlists from './useWatchlists.js';
import { WatchlistSelector } from './WatchlistControl.jsx';
import FlowDetailCard from './FlowDetailCard.jsx';
import { fmtUSD } from './format.js';
import { applyMoleculeLayout } from './layout.js';
import { buildGraph, buildAdjacency, META } from '../../../data/capitalMap.js';

const MONO = 'ui-monospace, monospace';
const BG = '#08090C';
// Height reserved by the top overlay bar. Every floating surface (right panel,
// filter drawer) starts below it so nothing ever sits under the controls.
const TOPBAR_H = 62;
const PANEL_W = 380;   // must match EntityPanel's width

export default function CapitalFlowMap({ onBack, initialFlowId }) {
  // Built once; positions are pinned by the static layout — no simulation.
  const graph = useMemo(() => buildGraph(), []);
  const [groupMode, setGroupMode] = useState('sector');      // 'sector' | 'theme' (v2 view switch)
  const regions = useMemo(() => applyMoleculeLayout(graph.nodes, graph.sectors, graph.links, { groupMode, themes: graph.themes }), [graph, groupMode]);
  const graphData = useMemo(() => ({ nodes: graph.nodes, links: graph.links }), [graph]);
  const adjacency = useMemo(() => buildAdjacency(graph.links), [graph]);
  const nodeById = useMemo(() => new Map(graph.nodes.map(n => [n.id, n])), [graph]);
  const linkById = useMemo(() => new Map(graph.links.map(l => [l.id, l])), [graph]);

  const fgRef = useRef(null);

  // ── Filter state ───────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [sectors, setSectors] = useState(() => new Set());   // entities (targets)
  const [classes, setClasses] = useState(() => new Set());   // entities
  const [tiers, setTiers] = useState(() => new Set());       // entities (allocators)
  const [families, setFamilies] = useState(() => new Set()); // flows (event family)
  const [statuses, setStatuses] = useState(() => new Set()); // flows
  const [themes, setThemes] = useState(() => new Set());     // entities (targets, by theme)
  const [networks, setNetworks] = useState(() => new Set()); // entities (allocators, by network)
  const [minAmount, setMinAmount] = useState(0);
  const [minConfidence, setMinConfidence] = useState(0);     // flows (v2 grade score)
  const [showWatch, setShowWatch] = useState(false);         // reveal candidate-only nodes
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState('map');                   // 'map' | 'roster' (tracking table)

  // ── Watchlists — saved subsets of the map (localStorage) ───────────────
  const wl = useWatchlists();
  const activeList = wl.activeList;

  // ── Selection state ────────────────────────────────────────────────────
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedFlowId, setSelectedFlowId] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);   // allocator breakdown over the panel

  // ── Matching ───────────────────────────────────────────────────────────
  const { matchedNodes, matchedLinks } = useMemo(() => {
    const entityFilterOn = sectors.size > 0 || classes.size > 0 || tiers.size > 0 || themes.size > 0 || networks.size > 0;
    // Active watchlist narrows the universe first: only members can seed the
    // view (their direct counterparties still surface via the flows, so the
    // subset stays navigable vertex↔edge).
    const wlSet = activeList ? new Set(activeList.ids) : null;
    // Seed = nodes matching ANY active entity selection (OR-union) — robust to
    // mixing target-only (sector/theme) and allocator-only (tier/network) dims.
    const seed = new Set(
      graph.nodes.filter(n => {
        if (wlSet && !wlSet.has(n.id)) return false;
        if (!entityFilterOn) return true;
        const mSec = sectors.size && n.sector && sectors.has(n.sector);
        const mCls = classes.size && classes.has(n.cls);
        const mTier = tiers.size && n.tier && tiers.has(n.tier);
        const mTheme = themes.size && n.themeKey && themes.has(n.themeKey);
        const mNet = networks.size && n.network && networks.has(n.network);
        return mSec || mCls || mTier || mTheme || mNet;
      }).map(n => n.id)
    );

    const links = new Set();
    graph.links.forEach(l => {
      if (families.size && !families.has(l.family)) return;
      if (statuses.size && !statuses.has(l.status)) return;
      if (minAmount > 0 && l.amountUSD < minAmount) return;
      if (minConfidence > 0 && (l.confidence == null || l.confidence < minConfidence)) return;
      if ((entityFilterOn || wlSet) && !seed.has(l.sourceId) && !seed.has(l.targetId)) return;
      links.add(l.id);
    });

    const nodes = new Set();
    graph.links.forEach(l => {
      if (!links.has(l.id)) return;
      nodes.add(l.sourceId);
      nodes.add(l.targetId);
    });
    graph.nodes.forEach(n => { if (n.degree === 0 && seed.has(n.id)) nodes.add(n.id); });

    // Inclusion rule: candidate-only ("watch") nodes stay off the main map
    // unless the user opts in — then drop them and any link that touches them.
    if (!showWatch) {
      graph.nodes.forEach(n => { if (n.watchOnly) nodes.delete(n.id); });
      graph.links.forEach(l => {
        const s = nodeById.get(l.sourceId), t = nodeById.get(l.targetId);
        if ((s && s.watchOnly) || (t && t.watchOnly)) links.delete(l.id);
      });
    }

    return { matchedNodes: nodes, matchedLinks: links };
  }, [graph, sectors, classes, tiers, families, statuses, themes, networks, minAmount, minConfidence, showWatch, nodeById, activeList]);

  // ── Selection neighbourhood ────────────────────────────────────────────
  const { neighbourNodes, neighbourLinks } = useMemo(() => {
    const n = new Set();
    const l = new Set();
    if (selectedNodeId) {
      n.add(selectedNodeId);
      const adj = adjacency.get(selectedNodeId);
      [...(adj?.inbound || []), ...(adj?.outbound || [])].forEach(link => {
        if (!matchedLinks.has(link.id)) return;
        l.add(link.id);
        n.add(link.sourceId);
        n.add(link.targetId);
      });
    }
    if (selectedFlowId) {
      const link = linkById.get(selectedFlowId);
      if (link) { l.add(link.id); n.add(link.sourceId); n.add(link.targetId); }
    }
    return { neighbourNodes: n, neighbourLinks: l };
  }, [selectedNodeId, selectedFlowId, adjacency, matchedLinks, linkById]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const focusEntity = useCallback((id) => {
    const node = nodeById.get(id);
    setView('map');                 // a roster row lands you on the map, entity open
    setSelectedNodeId(id);
    setSelectedFlowId(null);
    setDeepDiveOpen(false);
    const fg = fgRef.current;
    if (fg && node && node.x != null) {
      fg.centerAt(node.x + 120, node.y, 600);   // nudge left of the side panel
      fg.zoom(1.7, 600);
    }
  }, [nodeById]);

  const handleNodeClick = useCallback((id) => {
    setSelectedFlowId(null);
    setDeepDiveOpen(false);
    setSelectedNodeId(prev => (prev === id ? null : id));
  }, []);

  const handleLinkClick = useCallback((id) => {
    setSelectedFlowId(prev => (prev === id ? null : id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedFlowId(null);
    setDeepDiveOpen(false);
  }, []);

  const resetView = useCallback(() => { fgRef.current?.zoomToFit(700, 80); }, []);

  // Deep-link (e.g. a flow row on the home landing): open with that flow
  // pre-selected — the detail card shows immediately — then glide the camera
  // to the deal once the initial auto-fit in FlowGraph has settled (fighting
  // it earlier gets overridden by the fit loop).
  useEffect(() => {
    if (!initialFlowId) return;
    const link = linkById.get(initialFlowId);
    if (!link) return;
    setSelectedFlowId(initialFlowId);
    let ticks = 0;
    const iv = setInterval(() => {
      ticks += 1;
      if (ticks >= 20) { clearInterval(iv); return; }
      const fg = fgRef.current;
      const bbox = fg?.getGraphBbox?.();
      const ready = bbox && Number.isFinite(bbox.x?.[0]) && (bbox.x[1] - bbox.x[0]) > 100;
      if (!ready || ticks < 5) return;
      const src = nodeById.get(link.sourceId);
      const tgt = nodeById.get(link.targetId);
      if (src?.x != null && tgt?.x != null) {
        fg.centerAt((src.x + tgt.x) / 2, (src.y + tgt.y) / 2, 700);
        fg.zoom(1.5, 700);
      }
      clearInterval(iv);
    }, 300);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFlowId]);

  const resetFilters = useCallback(() => {
    setSectors(new Set());
    setClasses(new Set());
    setTiers(new Set());
    setFamilies(new Set());
    setStatuses(new Set());
    setThemes(new Set());
    setNetworks(new Set());
    setMinAmount(0);
    setMinConfidence(0);
    setQuery('');
  }, []);

  const toggleIn = (setter) => (value) => setter(prev => {
    const next = new Set(prev);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { clearSelection(); setDrawerOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearSelection]);


  // ── Derived display data ───────────────────────────────────────────────
  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) : null;
  const selectedFlow = selectedFlowId ? linkById.get(selectedFlowId) : null;
  const adj = selectedNodeId ? adjacency.get(selectedNodeId) : null;

  const legendCounts = useMemo(() => {
    const sector = {}, cls = {}, family = {};
    graph.nodes.forEach(n => {
      if (!matchedNodes.has(n.id)) return;
      if (n.sector) sector[n.sector] = (sector[n.sector] || 0) + 1;
      cls[n.cls] = (cls[n.cls] || 0) + 1;
    });
    graph.links.forEach(l => { if (matchedLinks.has(l.id)) family[l.family] = (family[l.family] || 0) + 1; });
    return { sector, cls, family };
  }, [graph, matchedNodes, matchedLinks]);

  const activeFilterCount = sectors.size + classes.size + tiers.size + families.size + statuses.size
    + themes.size + networks.size + (minAmount > 0 ? 1 : 0) + (minConfidence > 0 ? 1 : 0);
  const visibleTotal = useMemo(
    () => graph.links.reduce((s, l) => s + (matchedLinks.has(l.id) && l.disclosed ? l.amount : 0), 0),
    [graph, matchedLinks]
  );
  const networksPresent = useMemo(() => [...new Set(graph.nodes.map(n => n.network).filter(Boolean))], [graph]);

  // Search suggestions
  const suggestions = query.trim()
    ? graph.nodes.filter(n => {
        const q = query.trim().toLowerCase();
        return n.name.toLowerCase().includes(q) || n.label.toLowerCase().includes(q);
      }).slice(0, 7)
    : [];
  const searchRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div style={{
      position: 'relative',
      height: 'calc(100vh - 81px)',   // app header above
      minHeight: 480,
      background: BG,
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes cfmSlide { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes cfmRise  { from { transform: translate(-50%, 14px); opacity: 0 } to { transform: translate(-50%, 0); opacity: 1 } }
        @keyframes cfmDrop  { from { transform: translateY(-10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        .cfm-root canvas { cursor: grab }
        .cfm-root canvas:active { cursor: grabbing }
      `}</style>

      <div className="cfm-root" style={{ position: 'absolute', inset: 0 }}>
        <FlowGraph
          fgRef={fgRef}
          graphData={graphData}
          regions={regions}
          matchedNodes={matchedNodes}
          matchedLinks={matchedLinks}
          selectedNodeId={selectedNodeId}
          selectedLinkId={selectedFlowId}
          neighbourNodes={neighbourNodes}
          neighbourLinks={neighbourLinks}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          onBackgroundClick={clearSelection}
          showLabels={showLabels}
        />
      </div>

      {/* ── Top overlay bar ─────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        height: TOPBAR_H, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 16px',
        pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(8,9,12,0.96) 0%, rgba(8,9,12,0.92) 70%, rgba(8,9,12,0) 100%)',
      }}>
        {/* Back + title + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto', minWidth: 0 }}>
          <button onClick={onBack} title="Back to research library"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '6px 10px 6px 6px',
              background: 'rgba(18,19,24,0.9)', border: '1px solid #26262e', borderRadius: 8,
              color: '#a1a1aa', fontSize: 11, fontFamily: MONO, fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fafafa'; e.currentTarget.style.borderColor = '#3f3f46'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = '#26262e'; }}>
            <ChevronLeft size={13} /> Research
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.01em', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                Capital Flow Map
              </span>
              <span title="Date this data was generated by the Capital Flow engine"
                style={{ fontSize: 9, color: '#52525b', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                AS OF {META.generated}
              </span>
            </div>
            <div style={{ fontSize: 9.5, color: '#71717a', fontFamily: MONO, marginTop: 2, whiteSpace: 'nowrap' }}>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>{fmtUSD(activeFilterCount ? visibleTotal : graph.stats.totalTracked)}</span>
              {activeFilterCount ? ' in view' : ' disclosed'}
              <span style={{ color: '#3f3f46' }}> · </span>
              {matchedNodes.size}<span style={{ color: '#52525b' }}>/{graph.stats.nodeCount}</span> entities
              <span style={{ color: '#3f3f46' }}> · </span>
              {matchedLinks.size}<span style={{ color: '#52525b' }}>/{graph.stats.flowCount}</span> flows
              {graph.stats.signalCount > 0 && (
                <>
                  <span style={{ color: '#3f3f46' }}> · </span>
                  <span style={{ color: '#FBBF24', fontWeight: 700 }}>{graph.stats.signalCount} signal{graph.stats.signalCount === 1 ? '' : 's'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative', pointerEvents: 'auto', width: 'min(300px, 30vw)' }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions[0]) { focusEntity(suggestions[0].id); setSearchOpen(false); }
              if (e.key === 'Escape') { setQuery(''); setSearchOpen(false); }
            }}
            placeholder={view === 'roster' ? 'Filter the roster…' : 'Find an entity…'}
            style={{
              width: '100%', padding: '7px 26px 7px 27px',
              background: 'rgba(18,19,24,0.9)', border: '1px solid #26262e', borderRadius: 8,
              color: '#e4e4e7', fontSize: 11.5, fontFamily: MONO, outline: 'none',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 2, lineHeight: 0 }}>
              <X size={12} />
            </button>
          )}
          {view === 'map' && searchOpen && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
              background: '#101116', border: '1px solid #26262e', borderRadius: 8,
              overflow: 'hidden', boxShadow: '0 16px 40px -12px rgba(0,0,0,0.9)',
              animation: 'cfmDrop 140ms ease-out',
            }}>
              {suggestions.map(s => (
                <button key={s.id}
                  onClick={() => { focusEntity(s.id); setSearchOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '7px 10px', background: 'transparent', border: 'none',
                    borderBottom: '1px solid #191a20', cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#181920')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, color: '#e4e4e7', fontWeight: 600 }}>{s.name}</span>
                  <span style={{ fontSize: 9.5, color: '#52525b', fontFamily: MONO, marginLeft: 'auto' }}>
                    {fmtUSD(s.capital)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>
          <TopBtn onClick={() => setView(v => (v === 'map' ? 'roster' : 'map'))}
            label={view === 'map' ? 'Tracking roster — every tracked entity as a table' : 'Back to the map'}
            active={view === 'roster'} wide>
            {view === 'map' ? <Table2 size={12} /> : <Share2 size={12} />}
            {view === 'map' ? 'Roster' : 'Map'}
          </TopBtn>
          <WatchlistSelector wl={wl} />
          {view === 'map' && (
            <>
              <TopBtn onClick={() => setGroupMode(m => (m === 'sector' ? 'theme' : 'sector'))}
                label="Group by sector or theme" active={groupMode === 'theme'} wide>
                {groupMode === 'sector' ? <Target size={12} /> : <Layers size={12} />}
                {groupMode === 'sector' ? 'Sectors' : 'Themes'}
              </TopBtn>
              <TopBtn onClick={() => setDrawerOpen(o => !o)} label="Filters" active={drawerOpen || activeFilterCount > 0} wide>
                <SlidersHorizontal size={12} />
                Filters{activeFilterCount ? ` · ${activeFilterCount}` : ''}
              </TopBtn>
              {graph.stats.watchCount > 0 && (
                <TopBtn onClick={() => setShowWatch(s => !s)} label="Show watch / unconfirmed entities" active={showWatch} wide>
                  <Eye size={12} /> Watch{showWatch ? ` · ${graph.stats.watchCount}` : ''}
                </TopBtn>
              )}
              <TopBtn onClick={() => setShowLabels(s => !s)} label="Toggle labels" active={showLabels}>
                <Tag size={12} />
              </TopBtn>
              <TopBtn onClick={resetView} label="Reset view">
                <Maximize2 size={12} />
              </TopBtn>
              {(selectedNodeId || selectedFlowId) && (
                <TopBtn onClick={clearSelection} label="Clear selection (Esc)" wide>
                  Clear · Esc
                </TopBtn>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Filter drawer ───────────────────────────────────────────────── */}
      {drawerOpen && (
        <FilterDrawer
          sectorsPresent={graph.sectors}
          sectors={sectors} onToggleSector={toggleIn(setSectors)}
          themesPresent={graph.themes}
          themesSel={themes} onToggleTheme={toggleIn(setThemes)}
          classes={classes} onToggleClass={toggleIn(setClasses)}
          tiers={tiers} onToggleTier={toggleIn(setTiers)}
          networksPresent={networksPresent}
          networksSel={networks} onToggleNetwork={toggleIn(setNetworks)}
          families={families} onToggleFamily={toggleIn(setFamilies)}
          statuses={statuses} onToggleStatus={toggleIn(setStatuses)}
          minAmount={minAmount} onMinAmount={setMinAmount} maxAmount={graph.maxAmount}
          minConfidence={minConfidence} onMinConfidence={setMinConfidence}
          confidenceThreshold={graph.confidenceThreshold}
          activeCount={activeFilterCount}
          onReset={resetFilters}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Tracking roster — table view of the whole tracked universe ──── */}
      {view === 'roster' && (
        <RosterTable
          topInset={TOPBAR_H}
          nodes={graph.nodes}
          query={query}
          activeList={activeList}
          wl={wl}
          onOpenEntity={focusEntity}
        />
      )}

      {/* Empty state */}
      {view === 'map' && matchedLinks.size === 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 8,
        }}>
          <div style={{
            padding: '16px 20px', background: 'rgba(14,15,20,0.94)',
            border: '1px solid #26262e', borderRadius: 10,
            fontSize: 12, color: '#a1a1aa', fontFamily: MONO, textAlign: 'center',
          }}>
            {graph.stats.flowCount === 0 ? (
              <>
                <span style={{ color: '#38BDF8', fontWeight: 700, letterSpacing: '0.08em' }}>CLEAN SLATE</span><br />
                <span style={{ display: 'inline-block', marginTop: 6 }}>No capital-flow data loaded yet.</span><br />
                <span style={{ color: '#52525b', fontSize: 11 }}>Waiting for the next engine run to deliver <code>capitalMap.json</code>.</span>
              </>
            ) : (
              <>
                No flows match these filters.<br />
                <span style={{ color: '#52525b', fontSize: 11 }}>Loosen the min-flow slider or clear a chip.</span>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'map' && <Legend counts={legendCounts} />}

      {view === 'map' && selectedFlow && (
        <FlowDetailCard
          flow={selectedFlow}
          sourceNode={nodeById.get(selectedFlow.sourceId)}
          targetNode={nodeById.get(selectedFlow.targetId)}
          onClose={() => setSelectedFlowId(null)}
          onOpenEntity={focusEntity}
          rightInset={selectedNode ? PANEL_W : 0}
        />
      )}

      {view === 'map' && selectedNode && !deepDiveOpen && (
        <EntityPanel
          topInset={TOPBAR_H}
          node={selectedNode}
          inbound={(adj?.inbound || [])}
          outbound={(adj?.outbound || [])}
          nodeById={nodeById}
          selectedFlowId={selectedFlowId}
          onSelectFlow={(id) => setSelectedFlowId(prev => (prev === id ? null : id))}
          onOpenEntity={focusEntity}
          onDeepDive={selectedNode.kind === 'allocator' ? () => setDeepDiveOpen(true) : null}
          wl={wl}
          onClose={() => setSelectedNodeId(null)}
        />
      )}

      {view === 'map' && selectedNode && deepDiveOpen && (
        <AllocatorDeepDive
          topInset={TOPBAR_H}
          node={selectedNode}
          outbound={(adj?.outbound || [])}
          nodeById={nodeById}
          onOpenEntity={focusEntity}
          onBack={() => setDeepDiveOpen(false)}
          onClose={() => { setDeepDiveOpen(false); setSelectedNodeId(null); }}
        />
      )}
    </div>
  );
}

// ── Small pieces ─────────────────────────────────────────────────────────
function TopBtn({ children, onClick, label, active, wide }) {
  return (
    <button onClick={onClick} title={label} aria-label={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        height: 30, padding: wide ? '0 11px' : 0, width: wide ? 'auto' : 30,
        background: active ? 'rgba(56,189,248,0.1)' : 'rgba(18,19,24,0.9)',
        border: `1px solid ${active ? 'rgba(56,189,248,0.38)' : '#26262e'}`,
        borderRadius: 8,
        color: active ? '#38BDF8' : '#a1a1aa',
        cursor: 'pointer',
        fontSize: 10, fontFamily: MONO, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.07em',
        transition: 'all 130ms', whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3f3f46'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = active ? 'rgba(56,189,248,0.38)' : '#26262e'; }}>
      {children}
    </button>
  );
}
