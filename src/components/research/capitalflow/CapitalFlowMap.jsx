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
//   · disclaimer — bottom-right chip, expandable
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
  ChevronLeft, Search, X, Maximize2, Tag, SlidersHorizontal, TriangleAlert, Eye,
} from 'lucide-react';

import FlowGraph from './FlowGraph.jsx';
import FilterDrawer from './FilterBar.jsx';
import Legend from './Legend.jsx';
import EntityPanel from './EntityPanel.jsx';
import FlowDetailCard from './FlowDetailCard.jsx';
import { fmtUSD } from './format.js';
import { applyStaticLayout } from './layout.js';
import { buildGraph, buildAdjacency, DISCLAIMER, META } from '../../../data/capitalMap.js';

const MONO = 'ui-monospace, monospace';
const BG = '#08090C';

export default function CapitalFlowMap({ onBack }) {
  // Built once; positions are pinned by the static layout — no simulation.
  const graph = useMemo(() => buildGraph(), []);
  const regions = useMemo(() => applyStaticLayout(graph.nodes, graph.sectors), [graph]);
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
  const [minAmount, setMinAmount] = useState(0);
  const [showWatch, setShowWatch] = useState(false);         // reveal candidate-only nodes
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Selection state ────────────────────────────────────────────────────
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedFlowId, setSelectedFlowId] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  // ── Matching ───────────────────────────────────────────────────────────
  const { matchedNodes, matchedLinks } = useMemo(() => {
    const entityFilterOn = sectors.size > 0 || classes.size > 0 || tiers.size > 0;
    // Seed = nodes matching ANY active entity selection (OR-union) — robust to
    // mixing target-only (sector) and allocator-only (tier) dimensions.
    const seed = new Set(
      graph.nodes.filter(n => {
        if (!entityFilterOn) return true;
        const mSec = sectors.size && n.sector && sectors.has(n.sector);
        const mCls = classes.size && classes.has(n.cls);
        const mTier = tiers.size && n.tier && tiers.has(n.tier);
        return mSec || mCls || mTier;
      }).map(n => n.id)
    );

    const links = new Set();
    graph.links.forEach(l => {
      if (families.size && !families.has(l.family)) return;
      if (statuses.size && !statuses.has(l.status)) return;
      if (minAmount > 0 && l.amountUSD < minAmount) return;
      if (entityFilterOn && !seed.has(l.sourceId) && !seed.has(l.targetId)) return;
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
  }, [graph, sectors, classes, tiers, families, statuses, minAmount, showWatch, nodeById]);

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
    setSelectedNodeId(id);
    setSelectedFlowId(null);
    const fg = fgRef.current;
    if (fg && node && node.x != null) {
      fg.centerAt(node.x + 120, node.y, 600);   // nudge left of the side panel
      fg.zoom(1.7, 600);
    }
  }, [nodeById]);

  const handleNodeClick = useCallback((id) => {
    setSelectedFlowId(null);
    setSelectedNodeId(prev => (prev === id ? null : id));
  }, []);

  const handleLinkClick = useCallback((id) => {
    setSelectedFlowId(prev => (prev === id ? null : id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedFlowId(null);
  }, []);

  const resetView = useCallback(() => { fgRef.current?.zoomToFit(700, 80); }, []);

  const resetFilters = useCallback(() => {
    setSectors(new Set());
    setClasses(new Set());
    setTiers(new Set());
    setFamilies(new Set());
    setStatuses(new Set());
    setMinAmount(0);
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

  const activeFilterCount = sectors.size + classes.size + tiers.size + families.size + statuses.size + (minAmount > 0 ? 1 : 0);
  const visibleTotal = useMemo(
    () => graph.links.reduce((s, l) => s + (matchedLinks.has(l.id) && l.disclosed ? l.amount : 0), 0),
    [graph, matchedLinks]
  );

  // Search suggestions
  const suggestions = query.trim()
    ? graph.nodes.filter(n => n.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 7)
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
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(8,9,12,0.9) 0%, rgba(8,9,12,0.55) 60%, transparent 100%)',
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
            placeholder="Find an entity…"
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
          {searchOpen && suggestions.length > 0 && (
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
        </div>
      </div>

      {/* ── Filter drawer ───────────────────────────────────────────────── */}
      {drawerOpen && (
        <FilterDrawer
          sectorsPresent={graph.sectors}
          sectors={sectors} onToggleSector={toggleIn(setSectors)}
          classes={classes} onToggleClass={toggleIn(setClasses)}
          tiers={tiers} onToggleTier={toggleIn(setTiers)}
          families={families} onToggleFamily={toggleIn(setFamilies)}
          statuses={statuses} onToggleStatus={toggleIn(setStatuses)}
          minAmount={minAmount} onMinAmount={setMinAmount} maxAmount={graph.maxAmount}
          activeCount={activeFilterCount}
          onReset={resetFilters}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* Empty state */}
      {matchedLinks.size === 0 && (
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

      <Legend counts={legendCounts} />

      {/* ── Disclaimer chip / card ──────────────────────────────────────── */}
      <div style={{ position: 'absolute', right: 14, bottom: 14, zIndex: 12, maxWidth: 440 }}>
        {disclaimerOpen ? (
          <div style={{
            padding: '11px 13px',
            background: 'rgba(14,15,20,0.96)', border: '1px solid rgba(56,189,248,0.28)',
            borderRadius: 10, backdropFilter: 'blur(8px)',
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <TriangleAlert size={12} color="#38BDF8" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 10, color: '#a1a1aa', lineHeight: 1.55, fontFamily: MONO }}>
                {DISCLAIMER}
                <span style={{ color: '#71717a' }}>
                  {' '}{Math.round(graph.stats.disclosedShare * 100)}% of flows carry a disclosed amount.
                </span>
              </div>
              <button onClick={() => setDisclaimerOpen(false)}
                style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 2, lineHeight: 0, flexShrink: 0 }}>
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setDisclaimerOpen(true)} title={DISCLAIMER}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 10px',
              background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.26)',
              borderRadius: 8, cursor: 'pointer',
              fontSize: 9.5, fontFamily: MONO, fontWeight: 700, color: '#38BDF8',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
            <TriangleAlert size={11} /> Engine data · {META.generated}
          </button>
        )}
      </div>

      {selectedFlow && (
        <FlowDetailCard
          flow={selectedFlow}
          sourceNode={nodeById.get(selectedFlow.sourceId)}
          targetNode={nodeById.get(selectedFlow.targetId)}
          onClose={() => setSelectedFlowId(null)}
          onOpenEntity={focusEntity}
        />
      )}

      {selectedNode && (
        <EntityPanel
          node={selectedNode}
          inbound={(adj?.inbound || [])}
          outbound={(adj?.outbound || [])}
          nodeById={nodeById}
          selectedFlowId={selectedFlowId}
          onSelectFlow={(id) => setSelectedFlowId(prev => (prev === id ? null : id))}
          onOpenEntity={focusEntity}
          onClose={() => setSelectedNodeId(null)}
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
