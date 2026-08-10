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
  ChevronLeft, Search, X, Maximize2, Tag, SlidersHorizontal, Eye,
  Table2, Share2, FileText,
} from 'lucide-react';
import FlowGraph from './FlowGraph.jsx';
import FilterDrawer from './FilterBar.jsx';
import Legend from './Legend.jsx';
import EntityPanel from './EntityPanel.jsx';
import AllocatorDeepDive from './AllocatorDeepDive.jsx';
import FundHoldings from './FundHoldings.jsx';
import EntityTable from './EntityTable.jsx';
import DigestView from './DigestView.jsx';
import ClusterReport from './ClusterReport.jsx';
import { buildSectorReport, buildClassReport } from './clusterStats.js';
import useWatchlists from './useWatchlists.js';
import { WatchlistSelector } from './WatchlistControl.jsx';
import { buildViews, viewKey, cutoffDate, EMPTY_VIEW } from './views.js';
import FlowDetailCard from './FlowDetailCard.jsx';
import { fmtUSD, plural } from './format.js';
import { applyMoleculeLayout } from './layout.js';
import { buildGraph, buildAdjacency, META } from '../../../data/capitalMap.js';

const MONO = 'ui-monospace, monospace';
const BG = 'var(--cf-canvas)';
// Height reserved by the top overlay bar. Every floating surface (right panel,
// filter drawer) starts below it so nothing ever sits under the controls.
const TOPBAR_H = 62;
const PANEL_W = 380;   // must match EntityPanel's width

export default function CapitalFlowMap({ onBack, initialFlowId }) {
  // Built once; positions are pinned by the static layout — no simulation.
  const graph = useMemo(() => buildGraph(), []);
  const regions = useMemo(() => applyMoleculeLayout(graph.nodes, graph.sectors, graph.links), [graph]);
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
  const [networks, setNetworks] = useState(() => new Set()); // entities (allocators, by network)
  const [minAmount, setMinAmount] = useState(0);
  const [minConfidence, setMinConfidence] = useState(0);     // flows (v2 grade score)
  const [sinceDays, setSinceDays] = useState(0);             // flows, aged against META.generated
  const [showWatch, setShowWatch] = useState(false);         // reveal candidate-only nodes
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState('map');                   // 'map' | 'table' (tracking universe)
  const [tableKind, setTableKind] = useState('all');         // table role chip: all | allocator | target
  // Filter key auto-applied by the sector report's "all receivers" button. If
  // the filter is still exactly this on the way back to the map, it was never
  // the user's — so we drop it. A user-set filter (key differs) is kept.
  const autoFilterKeyRef = useRef(null);

  // ── Watchlists — saved subsets of the map (localStorage) ───────────────
  const wl = useWatchlists();
  const activeList = wl.activeList;

  // ── Selection state ────────────────────────────────────────────────────
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedFlowId, setSelectedFlowId] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);   // allocator breakdown over the panel
  const [fundHoldingsOpen, setFundHoldingsOpen] = useState(false);  // fund portfolio over the panel
  // Cluster report — opened by clicking a cluster TITLE on the canvas.
  // { type: 'sector' | 'source', key } — 'source' is an allocator-class island.
  const [cluster, setCluster] = useState(null);

  // ── Matching ───────────────────────────────────────────────────────────
  const { matchedNodes, matchedLinks } = useMemo(() => {
    const entityFilterOn = sectors.size > 0 || classes.size > 0 || tiers.size > 0 || networks.size > 0;
    const cutoff = cutoffDate(META.generated, sinceDays);
    // Active watchlist narrows the universe first: only members can seed the
    // view (their direct counterparties still surface via the flows, so the
    // subset stays navigable vertex↔edge).
    const wlSet = activeList ? new Set(activeList.ids) : null;
    // Seed = nodes matching ANY active entity selection (OR-union) — robust to
    // mixing target-only (sector) and allocator-only (tier/network) dims.
    const seed = new Set(
      graph.nodes.filter(n => {
        if (wlSet && !wlSet.has(n.id)) return false;
        if (!entityFilterOn) return true;
        const mSec = sectors.size && n.sector && sectors.has(n.sector);
        const mCls = classes.size && classes.has(n.cls);
        const mTier = tiers.size && n.tier && tiers.has(n.tier);
        const mNet = networks.size && n.network && networks.has(n.network);
        return mSec || mCls || mTier || mNet;
      }).map(n => n.id)
    );

    const links = new Set();
    graph.links.forEach(l => {
      if (families.size && !families.has(l.family)) return;
      if (statuses.size && !statuses.has(l.status)) return;
      if (minAmount > 0 && l.amountUSD < minAmount) return;
      if (minConfidence > 0 && (l.confidence == null || l.confidence < minConfidence)) return;
      if (cutoff && !(l.date && l.date >= cutoff)) return;
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
  }, [graph, sectors, classes, tiers, families, statuses, networks, minAmount, minConfidence, sinceDays, showWatch, nodeById, activeList]);

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
    setView('map');                 // a table row lands you on the map, entity open
    setSelectedNodeId(id);
    setSelectedFlowId(null);
    setDeepDiveOpen(false); setFundHoldingsOpen(false);
    setCluster(null);
    const fg = fgRef.current;
    if (fg && node && node.x != null) {
      fg.centerAt(node.x + 120, node.y, 600);   // nudge left of the side panel
      fg.zoom(1.7, 600);
    }
  }, [nodeById]);

  const handleNodeClick = useCallback((id) => {
    setSelectedFlowId(null);
    setDeepDiveOpen(false); setFundHoldingsOpen(false);
    setCluster(null);
    setSelectedNodeId(prev => (prev === id ? null : id));
  }, []);

  const handleLinkClick = useCallback((id) => {
    setCluster(null);
    setSelectedFlowId(prev => (prev === id ? null : id));
  }, []);

  // A cluster title on the canvas → that cluster's report. Entity/flow
  // selection steps aside so only one panel is ever open.
  //
  // Deliberately NOT a toggle. The canvas fires its click through two paths
  // (DOM capture + force-graph's own deferred handler) and a toggle turns any
  // stray second call into an instant close; "always open, close with × or
  // Esc" is both robust and the less surprising behaviour.
  const handleRegionClick = useCallback((type, key) => {
    setSelectedNodeId(null);
    setSelectedFlowId(null);
    setDeepDiveOpen(false); setFundHoldingsOpen(false);
    setCluster({ type, key });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedFlowId(null);
    setDeepDiveOpen(false); setFundHoldingsOpen(false);
    setCluster(null);
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

  // One place that writes the whole filter state — reset and the quick views
  // both go through it, so no dimension can be forgotten in one path.
  const applyFilterState = useCallback((s) => {
    setSectors(new Set(s.sectors || []));
    setClasses(new Set(s.classes || []));
    setTiers(new Set(s.tiers || []));
    setFamilies(new Set(s.families || []));
    setStatuses(new Set(s.statuses || []));
    setNetworks(new Set(s.networks || []));
    setMinAmount(s.minAmount || 0);
    setMinConfidence(s.minConfidence || 0);
    setSinceDays(s.sinceDays || 0);
  }, []);

  const resetFilters = useCallback(() => {
    applyFilterState(EMPTY_VIEW);
    setQuery('');
  }, [applyFilterState]);

  // From a sector report: land on the table filtered to that sector, showing
  // the receivers — the full set of companies/projects/funds pulling capital in,
  // grouped by type. Reuses the shared filter, so map and table stay in sync.
  const openSectorReceivers = useCallback((sectorKey) => {
    const state = { sectors: [sectorKey] };
    applyFilterState(state);
    // Remember exactly what we applied — if it's untouched on exit, we drop it.
    autoFilterKeyRef.current = viewKey({
      sectors: [sectorKey], classes: [], tiers: [], families: [], statuses: [],
      networks: [], minAmount: 0, minConfidence: 0, sinceDays: 0,
    });
    setQuery('');
    setTableKind('target');
    setCluster(null);
    setView('table');
    setDrawerOpen(false);
  }, [applyFilterState]);

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

  // Cluster report. Computed over the WHOLE tracked universe, not the current
  // filter state: the report describes the sector/class as tracked, so it does
  // not silently change meaning when a filter is on.
  const clusterReport = useMemo(() => {
    if (!cluster) return null;
    const ctx = {
      nodes: graph.nodes, links: graph.links, nodeById,
      generated: META.generated, sectors: graph.sectors,
    };
    return cluster.type === 'sector'
      ? buildSectorReport(cluster.key, ctx)
      : buildClassReport(cluster.key, ctx);
  }, [cluster, graph, nodeById]);

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
    + networks.size + (minAmount > 0 ? 1 : 0) + (minConfidence > 0 ? 1 : 0) + (sinceDays > 0 ? 1 : 0);

  // ── Quick views — pre-made filter combinations ─────────────────────────
  // Which sectors are signalling comes from the payload, so the "Signal
  // sectors" view follows each delivery instead of naming sectors by hand.
  const views = useMemo(() => buildViews({
    litSectors: Object.values(graph.sectors).filter(s => s.lit).map(s => s.key),
    confidenceThreshold: graph.confidenceThreshold,
  }), [graph]);
  const currentKey = viewKey({
    sectors: [...sectors], classes: [...classes], tiers: [...tiers],
    families: [...families], statuses: [...statuses], networks: [...networks],
    minAmount, minConfidence, sinceDays,
  });
  const activeViewId = views.find(v => viewKey(v.state) === currentKey)?.id || null;

  // Leave the table for the map. Drop the filter only if it's still the exact
  // one the "all receivers" button applied (i.e. the user never touched it);
  // any filter the user set or changed themselves survives the transition.
  const exitToMap = () => {
    if (autoFilterKeyRef.current != null && autoFilterKeyRef.current === currentKey) {
      applyFilterState(EMPTY_VIEW);
      setQuery('');
    }
    autoFilterKeyRef.current = null;
    setDrawerOpen(false);
    setView('map');
  };
  const applyView = useCallback((v) => {
    applyFilterState(activeViewId === v.id ? EMPTY_VIEW : v.state);
  }, [applyFilterState, activeViewId]);
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
  // Capture phase — the graph canvas swallows mousedown (d3-drag calls
  // stopImmediatePropagation), so a bubble-phase listener never sees a click
  // on the map and the dropdown would hang around.
  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', h, true);
    return () => document.removeEventListener('mousedown', h, true);
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
          onRegionClick={handleRegionClick}
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
        background: 'var(--cf-scrim)',
      }}>
        {/* Back + title + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto', minWidth: 0 }}>
          {/* In the table, Назад steps back to the map (the intuitive "up one
              level"); on the map it leaves for the research library. */}
          <button onClick={() => (view !== 'map' ? exitToMap() : onBack())}
            title={view !== 'map' ? 'Назад к карте' : 'К библиотеке исследований'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '6px 10px 6px 6px',
              background: 'var(--cf-topbar)', border: '1px solid var(--cf-border)', borderRadius: 8,
              color: 'var(--cf-text3)', fontSize: 11, fontFamily: MONO, fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cf-text0)'; e.currentTarget.style.borderColor = 'var(--cf-text9)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cf-text3)'; e.currentTarget.style.borderColor = 'var(--cf-border)'; }}>
            <ChevronLeft size={13} /> {view !== 'map' ? 'К карте' : 'Назад'}
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                Карта потоков капитала
              </span>
              <span title="Дата генерации данных движком Capital Flow"
                style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                НА {META.generated}
              </span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 2, whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--cf-accent)', fontWeight: 700 }}>{fmtUSD(activeFilterCount ? visibleTotal : graph.stats.totalTracked)}</span>
              {activeFilterCount ? ' в выборке' : ' раскрыто'}
              <span style={{ color: 'var(--cf-text9)' }}> · </span>
              {matchedNodes.size}<span style={{ color: 'var(--cf-text7)' }}>/{graph.stats.nodeCount}</span> объектов
              <span style={{ color: 'var(--cf-text9)' }}> · </span>
              {matchedLinks.size}<span style={{ color: 'var(--cf-text7)' }}>/{graph.stats.flowCount}</span> потоков
              {graph.stats.signalCount > 0 && (
                <>
                  <span style={{ color: 'var(--cf-text9)' }}> · </span>
                  <span style={{ color: 'var(--cf-warn)', fontWeight: 700 }}>{graph.stats.signalCount} {plural(graph.stats.signalCount, ['сигнал', 'сигнала', 'сигналов'])}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative', pointerEvents: 'auto', width: 'min(300px, 30vw)' }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--cf-text7)' }} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions[0]) { focusEntity(suggestions[0].id); setSearchOpen(false); }
              if (e.key === 'Escape') { setQuery(''); setSearchOpen(false); }
            }}
            placeholder={view === 'table' ? 'Поиск по таблице…' : 'Найти на карте…'}
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
              {suggestions.map(s => (
                <button key={s.id}
                  onClick={() => { focusEntity(s.id); setSearchOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '7px 10px', background: 'transparent', border: 'none',
                    borderBottom: '1px solid var(--cf-border-hair)', cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, color: 'var(--cf-text1)', fontWeight: 600 }}>{s.name}</span>
                  <span style={{ fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO, marginLeft: 'auto' }}>
                    {fmtUSD(s.capital)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>
          <TopBtn onClick={() => (view === 'table' ? exitToMap() : (setView('table'), setDrawerOpen(false)))}
            label={view === 'table' ? 'Назад к карте' : 'Таблица — вся отслеживаемая вселенная, по ролям и типам'}
            active={view === 'table'} wide>
            {view === 'table' ? <Share2 size={12} /> : <Table2 size={12} />}
            {view === 'table' ? 'Карта' : 'Таблица'}
          </TopBtn>
          <TopBtn onClick={() => (view === 'digest' ? exitToMap() : (setView('digest'), setDrawerOpen(false)))}
            label={view === 'digest' ? 'Назад к карте' : 'Сводка — недельный, месячный и общий обзор потоков'}
            active={view === 'digest'} wide>
            {view === 'digest' ? <Share2 size={12} /> : <FileText size={12} />}
            {view === 'digest' ? 'Карта' : 'Сводка'}
          </TopBtn>
          <WatchlistSelector wl={wl} />
          {/* Filters drive both views — the table is the same universe as the map. */}
          <TopBtn onClick={() => setDrawerOpen(o => !o)}
            label="Фильтры и быстрые виды" active={drawerOpen || activeFilterCount > 0} wide>
            <SlidersHorizontal size={12} />
            Фильтры{activeFilterCount ? ` · ${activeFilterCount}` : ''}
          </TopBtn>
          {view === 'map' && (
            <>
              {graph.stats.watchCount > 0 && (
                <TopBtn onClick={() => setShowWatch(s => !s)}
                  label={`Неподтверждённые наводки — ${graph.stats.watchCount} объектов, у которых есть только потоки-кандидаты без подтверждения источником. По умолчанию скрыты; включите, чтобы увидеть, что может быть на подходе.`}
                  active={showWatch} wide>
                  <Eye size={12} /> Наводки{showWatch ? ` · ${graph.stats.watchCount}` : ''}
                </TopBtn>
              )}
              <TopBtn onClick={() => setShowLabels(s => !s)} label="Показать / скрыть подписи" active={showLabels}>
                <Tag size={12} />
              </TopBtn>
              <TopBtn onClick={resetView} label="Сбросить вид">
                <Maximize2 size={12} />
              </TopBtn>
              {(selectedNodeId || selectedFlowId) && (
                <TopBtn onClick={clearSelection} label="Снять выделение (Esc)" wide>
                  Сброс · Esc
                </TopBtn>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Filter drawer ───────────────────────────────────────────────── */}
      {drawerOpen && (
        <FilterDrawer
          views={views} activeViewId={activeViewId} onApplyView={applyView}
          sectorsPresent={graph.sectors}
          sectors={sectors} onToggleSector={toggleIn(setSectors)}
          classes={classes} onToggleClass={toggleIn(setClasses)}
          tiers={tiers} onToggleTier={toggleIn(setTiers)}
          networksPresent={networksPresent}
          networksSel={networks} onToggleNetwork={toggleIn(setNetworks)}
          families={families} onToggleFamily={toggleIn(setFamilies)}
          statuses={statuses} onToggleStatus={toggleIn(setStatuses)}
          minAmount={minAmount} onMinAmount={setMinAmount} maxAmount={graph.maxAmount}
          minConfidence={minConfidence} onMinConfidence={setMinConfidence}
          confidenceThreshold={graph.confidenceThreshold}
          sinceDays={sinceDays} onSinceDays={setSinceDays} generated={META.generated}
          activeCount={activeFilterCount}
          onReset={resetFilters}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Table — the whole tracked universe, grouped by role and type ── */}
      {view === 'table' && (
        <EntityTable
          topInset={TOPBAR_H}
          nodes={graph.nodes}
          matchedNodes={matchedNodes}
          query={query}
          activeList={activeList}
          wl={wl}
          kind={tableKind}
          onKind={setTableKind}
          onOpenEntity={focusEntity}
        />
      )}

      {/* ── Digest — weekly / monthly / whole-map flow briefing ─────────────── */}
      {view === 'digest' && (
        <DigestView
          topInset={TOPBAR_H}
          nodes={graph.nodes}
          links={graph.links}
          generated={META.generated}
          sectors={graph.sectors}
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
            padding: '16px 20px', background: 'var(--cf-panel)',
            border: '1px solid var(--cf-border)', borderRadius: 10,
            fontSize: 12, color: 'var(--cf-text3)', fontFamily: MONO, textAlign: 'center',
          }}>
            {graph.stats.flowCount === 0 ? (
              <>
                <span style={{ color: 'var(--cf-accent)', fontWeight: 700, letterSpacing: '0.08em' }}>ПУСТО</span><br />
                <span style={{ display: 'inline-block', marginTop: 6 }}>Данные о потоках капитала ещё не загружены.</span><br />
                <span style={{ color: 'var(--cf-text7)', fontSize: 11 }}>Ждём следующего прогона движка с <code>capitalMap.json</code>.</span>
              </>
            ) : (
              <>
                Под эти фильтры не попал ни один поток.<br />
                <span style={{ color: 'var(--cf-text7)', fontSize: 11 }}>Ослабьте минимальную сумму или снимите один из фильтров.</span>
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

      {view === 'map' && selectedNode && !deepDiveOpen && !fundHoldingsOpen && (
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
          onFundHoldings={() => setFundHoldingsOpen(true)}
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
          onClose={() => { setDeepDiveOpen(false); setFundHoldingsOpen(false); setSelectedNodeId(null); }}
        />
      )}

      {view === 'map' && selectedNode && fundHoldingsOpen && (
        <FundHoldings
          topInset={TOPBAR_H}
          node={selectedNode}
          nodeById={nodeById}
          onOpenEntity={focusEntity}
          onBack={() => setFundHoldingsOpen(false)}
          onClose={() => { setFundHoldingsOpen(false); setSelectedNodeId(null); }}
        />
      )}

      {view === 'map' && clusterReport && (
        <ClusterReport
          topInset={TOPBAR_H}
          report={clusterReport}
          onOpenEntity={focusEntity}
          onOpenReceivers={openSectorReceivers}
          onClose={() => setCluster(null)}
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
