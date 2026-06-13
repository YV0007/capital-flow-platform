// ══════════════════════════════════════════════════════════════════════════
// RESEARCH: DC AI — SUPPLY-CHAIN GRAPH
// Layered DAG of the AI infrastructure chain. Sub-sector nodes flow top
// (raw inputs) → bottom (compute convergence) with curved edges showing
// what feeds what. Click a node → right-side inspector panel with the
// companies and chain neighbours. Sector / company data comes from
// dc-buckets.json and dc-companies.json.
// ══════════════════════════════════════════════════════════════════════════
import React, { useMemo, useState } from 'react';
import dcCompaniesData from '../../../data/dc-companies.json';
import dcBucketsData from '../../../data/dc-buckets.json';

const DC_COMPANIES = dcCompaniesData;
const { DC_BUCKETS, DC_CONVICTION_STYLE } = dcBucketsData;

// ─ Canvas geometry ────────────────────────────────────────────────────────
const CANVAS_W       = 1100;
const PAD_X_LEFT     = 110;   // room for vertical layer labels
const PAD_X_RIGHT    = 50;
const PAD_Y_TOP      = 80;
const PAD_Y_BOTTOM   = 80;
const LAYER_GAP      = 120;
const NODE_W         = 132;
const NODE_H         = 44;
const BIG_NODE_W     = 180;
const BIG_NODE_H     = 60;

// ─ Layer definitions ──────────────────────────────────────────────────────
const LAYERS = [
  { id: 'L1', label: 'RAW INPUTS',          caption: 'substrates · chemistry' },
  { id: 'L2', label: 'IP & DESIGN',         caption: 'tools that draw silicon' },
  { id: 'L3', label: 'CHIPS & PACKAGING',   caption: 'wafer → die → stack' },
  { id: 'L4', label: 'POWER ORIGIN',        caption: 'where the electrons start' },
  { id: 'L5', label: 'POWER DELIVERY',      caption: 'grid → rack' },
  { id: 'L6', label: 'INTERCONNECT',        caption: 'move the bits' },
  { id: 'L7', label: 'SITE BUILDOUT',       caption: 'concrete · MEP · cooling' },
  { id: 'L8', label: 'COMPUTE',             caption: 'the rack · the model' },
];

// ─ Nodes (sub-sectors) ────────────────────────────────────────────────────
// `sector` matches DC_COMPANIES[].sector so the inspector can filter.
// `bucket` matches a key in DC_BUCKETS for color + parent grouping.
const NODES_RAW = [
  // L1 — Raw Inputs
  { id: 'goes',       label: 'GOES Steel',          sector: 'GOES Steel',      bucket: 'Materials & Chemicals',     layer: 0 },
  { id: 'resist',     label: 'Photoresist',         sector: 'Photoresist',     bucket: 'Materials & Chemicals',     layer: 0 },
  { id: 'chem',       label: 'Specialty Chem',      sector: 'Specialty Chem',  bucket: 'Materials & Chemicals',     layer: 0 },
  // L2 — IP & Design
  { id: 'eda',        label: 'EDA',                 sector: 'EDA',             bucket: 'Compute & Silicon',         layer: 1 },
  { id: 'ip',         label: 'IP / Bonding',        sector: 'IP/Bonding',      bucket: 'Compute & Silicon',         layer: 1 },
  // L3 — Chips
  { id: 'silicon',    label: 'AI Silicon',          sector: 'AI Silicon',      bucket: 'Compute & Silicon',         layer: 2 },
  { id: 'pkg',        label: 'Adv Packaging',       sector: 'Adv Packaging',   bucket: 'Compute & Silicon',         layer: 2 },
  // L4 — Power Origin
  { id: 'nuc',        label: 'Nuclear',             sector: 'Nuclear/SMR',     bucket: 'Power & Grid',              layer: 3 },
  { id: 'smr',        label: 'SMR',                 sector: 'SMR',             bucket: 'Power & Grid',              layer: 3 },
  { id: 'fuel',       label: 'Fuel Cells',          sector: 'Fuel Cells',      bucket: 'Power & Grid',              layer: 3 },
  // L5 — Power Delivery
  { id: 'power',      label: 'Power',               sector: 'Power',           bucket: 'Power & Grid',              layer: 4 },
  { id: 'transformers', label: 'Transformers',      sector: 'Transformers',    bucket: 'Power & Grid',              layer: 4 },
  { id: 'switchgear', label: 'Switchgear',          sector: 'Switchgear',      bucket: 'Power & Grid',              layer: 4 },
  { id: 'pmgmt',      label: 'Power Mgmt',          sector: 'Power Mgmt',      bucket: 'Power & Grid',              layer: 4 },
  // L6 — Interconnect
  { id: 'photonics',  label: 'Photonics / CPO',     sector: 'Photonics',       bucket: 'Connectivity & Photonics',  layer: 5 },
  { id: 'darkfiber',  label: 'Dark Fiber',          sector: 'Dark Fiber',      bucket: 'Connectivity & Photonics',  layer: 5 },
  { id: 'fiber',      label: 'Fiber / Cable',       sector: 'Fiber/Cable',     bucket: 'Connectivity & Photonics',  layer: 5 },
  // L7 — Site
  { id: 'liquid',     label: 'Liquid Cooling',      sector: 'Liquid Cooling',  bucket: 'Cooling & Thermal',         layer: 6 },
  { id: 'mep',        label: 'MEP',                 sector: 'MEP',             bucket: 'Construction & Labor',      layer: 6 },
  { id: 'contracting', label: 'Contracting',        sector: 'Contracting',     bucket: 'Construction & Labor',      layer: 6 },
  // L8 — Compute Convergence
  { id: 'rack',       label: 'AI COMPUTE',          sector: 'AI Compute Infra', bucket: 'Compute & Silicon',        layer: 7, big: true, secondarySector: 'AI Compute Infra (pivot)' },
  { id: 'lab',        label: 'Frontier Lab',        sector: 'Frontier Lab',    bucket: 'Compute & Silicon',         layer: 7 },
];

// ─ Edges (directional feed relationships) ─────────────────────────────────
const EDGES_RAW = [
  // Raw → Chips
  ['resist',       'silicon'],
  ['chem',         'silicon'],
  ['chem',         'pkg'],
  ['goes',         'transformers'],
  // Design → Chips
  ['eda',          'silicon'],
  ['eda',          'pkg'],
  ['ip',           'pkg'],
  ['silicon',      'pkg'],
  // Chips → Compute
  ['pkg',          'rack'],
  ['silicon',      'rack'],
  // Power origin → Power
  ['nuc',          'power'],
  ['smr',          'power'],
  ['fuel',         'power'],
  // Power chain
  ['power',        'transformers'],
  ['transformers', 'switchgear'],
  ['switchgear',   'pmgmt'],
  ['pmgmt',        'rack'],
  // Interconnect → Compute
  ['photonics',    'rack'],
  ['darkfiber',    'rack'],
  ['fiber',        'rack'],
  // Site → Compute
  ['contracting',  'mep'],
  ['mep',          'rack'],
  ['liquid',       'rack'],
  // Compute → Output
  ['rack',         'lab'],
];

// ─ Layout: compute (x,y) for each node from layer + per-layer slot ────────
function layoutNodes() {
  const byLayer = {};
  NODES_RAW.forEach(n => {
    if (!byLayer[n.layer]) byLayer[n.layer] = [];
    byLayer[n.layer].push(n);
  });
  const usableW = CANVAS_W - PAD_X_LEFT - PAD_X_RIGHT;
  const result = {};
  Object.entries(byLayer).forEach(([layerIdx, nodes]) => {
    const count = nodes.length;
    nodes.forEach((n, i) => {
      const slotW = usableW / count;
      const x = PAD_X_LEFT + slotW * (i + 0.5);
      const y = PAD_Y_TOP + parseInt(layerIdx, 10) * LAYER_GAP;
      const w = n.big ? BIG_NODE_W : NODE_W;
      const h = n.big ? BIG_NODE_H : NODE_H;
      result[n.id] = { ...n, x, y, w, h, cx: x, cy: y, topY: y - h/2, bottomY: y + h/2 };
    });
  });
  return result;
}

const NODES = layoutNodes();
const CANVAS_H = PAD_Y_TOP + (LAYERS.length - 1) * LAYER_GAP + PAD_Y_BOTTOM;

// ─ Compute adjacency for highlighting on hover/select ─────────────────────
const NEIGHBOURS = (() => {
  const map = {};
  Object.keys(NODES).forEach(id => { map[id] = { in: [], out: [] }; });
  EDGES_RAW.forEach(([from, to]) => {
    map[from].out.push(to);
    map[to].in.push(from);
  });
  return map;
})();

// ──────────────────────────────────────────────────────────────────────────
export default function Roadmap() {
  const [selected, setSelected] = useState(null);
  const [hovered,  setHovered]  = useState(null);

  const active = hovered || selected;
  const activeSet = useMemo(() => {
    if (!active) return null;
    return new Set([active, ...NEIGHBOURS[active].in, ...NEIGHBOURS[active].out]);
  }, [active]);

  const selectedNode = selected ? NODES[selected] : null;
  const selectedBucket = selectedNode ? DC_BUCKETS[selectedNode.bucket] : null;
  const selectedCompanies = selectedNode
    ? DC_COMPANIES.filter(c =>
        c.sector === selectedNode.sector ||
        (selectedNode.secondarySector && c.sector === selectedNode.secondarySector))
    : [];

  return (
    <div style={{ marginTop: 8 }}>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '24px 24px 8px' }}>
        <div style={{
          display: 'inline-block',
          fontSize: 10.5, color: '#22D3EE',
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.22em', fontWeight: 700,
          padding: '4px 12px', borderRadius: 4,
          background: 'rgba(34,211,238,0.08)',
          border: '1px solid rgba(34,211,238,0.30)',
          marginBottom: 18,
        }}>
          AI INFRASTRUCTURE · SUPPLY CHAIN
        </div>
        <div style={{
          fontSize: 30, color: '#fafafa', fontWeight: 700,
          letterSpacing: '-0.02em', lineHeight: 1.15,
          margin: '0 auto 12px', maxWidth: 760,
        }}>
          From <span style={{ color: '#f59e0b' }}>raw substrates</span> down to the{' '}
          <span style={{ color: '#22D3EE' }}>rack</span>.
        </div>
        <div style={{
          fontSize: 13.5, color: '#a1a1aa', lineHeight: 1.65,
          maxWidth: 620, margin: '0 auto',
        }}>
          {Object.keys(NODES).length} sub-sectors · {EDGES_RAW.length} dependencies ·
          tap any node to open the inspector.
        </div>
      </div>

      {/* ── Canvas ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        margin: '24px auto 0',
        maxWidth: CANVAS_W,
        width: '100%',
        height: CANVAS_H,
        overflow: 'visible',
        background: `
          radial-gradient(ellipse 600px 200px at 50% ${CANVAS_H - 80}px, rgba(34,211,238,0.06), transparent 70%),
          radial-gradient(ellipse 500px 200px at 50% 60px, rgba(245,158,11,0.04), transparent 70%)
        `,
      }}>

        {/* Layer guide lines + labels */}
        {LAYERS.map((L, i) => {
          const y = PAD_Y_TOP + i * LAYER_GAP;
          return (
            <React.Fragment key={L.id}>
              <div style={{
                position: 'absolute',
                left: PAD_X_LEFT - 20, right: PAD_X_RIGHT - 20,
                top: y, height: 1,
                background: 'linear-gradient(to right, transparent, rgba(63,63,70,0.45), transparent)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', left: 0, top: y - 18, width: PAD_X_LEFT - 24,
                textAlign: 'right', pointerEvents: 'none',
              }}>
                <div style={{
                  fontSize: 9, color: '#52525b',
                  fontFamily: 'ui-monospace,monospace',
                  letterSpacing: '0.16em', fontWeight: 700,
                }}>
                  {String(i + 1).padStart(2, '0')} · {L.label}
                </div>
                <div style={{
                  fontSize: 9, color: '#3f3f46',
                  fontFamily: 'ui-monospace,monospace',
                  marginTop: 2, fontStyle: 'italic',
                }}>
                  {L.caption}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* SVG edge layer */}
        <svg
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          preserveAspectRatio="none"
        >
          <defs>
            {Object.entries(DC_BUCKETS).map(([name, def]) => (
              <linearGradient key={name} id={`grad-${name.replace(/[^a-zA-Z]/g,'')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={def.color} stopOpacity="0.85" />
                <stop offset="100%" stopColor={def.color} stopOpacity="0.25" />
              </linearGradient>
            ))}
          </defs>

          {EDGES_RAW.map(([from, to], i) => {
            const a = NODES[from], b = NODES[to];
            if (!a || !b) return null;
            const x1 = a.cx, y1 = a.bottomY;
            const x2 = b.cx, y2 = b.topY;
            const dy = (y2 - y1) * 0.55;
            const d = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;

            const isLive = activeSet && (activeSet.has(from) && activeSet.has(to));
            const isDim  = activeSet && !isLive;
            const bucketDef = DC_BUCKETS[a.bucket];
            const stroke = bucketDef?.color || '#52525b';

            return (
              <path
                key={i}
                d={d}
                stroke={stroke}
                strokeWidth={isLive ? 2 : 1.1}
                strokeOpacity={isLive ? 0.85 : isDim ? 0.08 : 0.32}
                fill="none"
                style={{ transition: 'stroke-opacity 200ms, stroke-width 200ms' }}
              />
            );
          })}
        </svg>

        {/* Node layer */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          {Object.values(NODES).map(n => {
            const isLive = activeSet ? activeSet.has(n.id) : true;
            const isSelected = selected === n.id;
            const isHovered  = hovered  === n.id;
            const bucket = DC_BUCKETS[n.bucket];
            const companyCount = DC_COMPANIES.filter(c =>
              c.sector === n.sector ||
              (n.secondarySector && c.sector === n.secondarySector)).length;

            return (
              <button
                key={n.id}
                onClick={() => setSelected(isSelected ? null : n.id)}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute',
                  left: n.x - n.w/2, top: n.y - n.h/2,
                  width: n.w, height: n.h,
                  background: isSelected
                    ? `linear-gradient(180deg, ${bucket?.color}26, #18181b)`
                    : '#18181b',
                  border: `1px solid ${
                    isSelected ? bucket?.color :
                    isHovered  ? bucket?.color + 'aa' :
                    isLive     ? '#3f3f46' : '#27272a'
                  }`,
                  borderRadius: n.big ? 10 : 8,
                  padding: '0 12px 0 14px',
                  cursor: 'pointer',
                  opacity: isLive ? 1 : 0.28,
                  transform: isSelected ? 'scale(1.05)' : isHovered ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: isSelected
                    ? `0 0 0 4px ${bucket?.color}22, 0 8px 24px rgba(0,0,0,0.55)`
                    : isHovered
                      ? `0 4px 16px ${bucket?.color}33`
                      : '0 2px 8px rgba(0,0,0,0.35)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  color: '#fafafa', font: 'inherit', textAlign: 'left',
                  zIndex: isSelected ? 4 : isHovered ? 3 : 2,
                }}
              >
                {/* Bucket dot */}
                <div style={{
                  width: n.big ? 10 : 8, height: n.big ? 10 : 8,
                  borderRadius: '50%',
                  background: bucket?.color,
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${bucket?.color}88`,
                }} />

                {/* Label + count */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{
                    fontSize: n.big ? 13 : 11.5,
                    fontWeight: n.big ? 700 : 600,
                    color: '#fafafa',
                    lineHeight: 1.15,
                    letterSpacing: n.big ? '0.04em' : '0',
                    textTransform: n.big ? 'uppercase' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {n.label}
                  </div>
                  {companyCount > 0 && (
                    <div style={{
                      fontSize: 9, color: '#71717a',
                      fontFamily: 'ui-monospace,monospace',
                      letterSpacing: '0.05em', marginTop: 2,
                    }}>
                      {companyCount} {companyCount === 1 ? 'name' : 'names'}
                    </div>
                  )}
                </div>

                {/* Selection pulse */}
                {isSelected && (
                  <span style={{
                    position: 'absolute', inset: -6,
                    borderRadius: n.big ? 14 : 12,
                    border: `1px solid ${bucket?.color}`,
                    opacity: 0.5,
                    pointerEvents: 'none',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Inspector panel (overlays right side) */}
        {selectedNode && (
          <>
            {/* backdrop / click-out */}
            <div
              onClick={() => setSelected(null)}
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.35)',
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                zIndex: 5,
                cursor: 'pointer',
              }}
            />
            <InspectorPanel
              node={selectedNode}
              bucket={selectedBucket}
              companies={selectedCompanies}
              upstream={NEIGHBOURS[selectedNode.id].in.map(id => NODES[id])}
              downstream={NEIGHBOURS[selectedNode.id].out.map(id => NODES[id])}
              onClose={() => setSelected(null)}
              onJump={(id) => setSelected(id)}
            />
          </>
        )}

      </div>

      {/* Legend */}
      <div style={{
        margin: '40px auto 0', maxWidth: CANVAS_W,
        padding: '16px 20px',
        background: '#0d0d0e',
        border: '1px solid #27272a',
        borderRadius: 10,
        display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 9.5, color: '#71717a',
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.16em', fontWeight: 700,
        }}>BUCKETS</div>
        {Object.entries(DC_BUCKETS).map(([name, def]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              width: 9, height: 9, borderRadius: '50%',
              background: def.color,
              boxShadow: `0 0 8px ${def.color}66`,
            }} />
            <span style={{ fontSize: 11, color: '#d4d4d8' }}>{name}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function InspectorPanel({ node, bucket, companies, upstream, downstream, onClose, onJump }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0, right: 0, bottom: 0,
      width: 380, maxWidth: '92%',
      background: '#0a0a0b',
      borderLeft: `2px solid ${bucket?.color || '#27272a'}`,
      boxShadow: '-24px 0 48px rgba(0,0,0,0.55)',
      zIndex: 6,
      overflowY: 'auto',
      animation: 'inspector-slide 220ms cubic-bezier(0.4,0,0.2,1)',
    }}>
      <style>{`
        @keyframes inspector-slide {
          from { transform: translateX(30px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 14, right: 14,
          width: 28, height: 28, borderRadius: '50%',
          background: 'transparent', border: '1px solid #27272a',
          color: '#a1a1aa', fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          font: 'inherit',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#27272a'; e.currentTarget.style.color = '#fafafa'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; }}
      >×</button>

      {/* Header */}
      <div style={{ padding: '24px 24px 18px', borderBottom: '1px solid #18181b' }}>
        <div style={{
          fontSize: 9.5, color: bucket?.color,
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.18em', fontWeight: 700,
          marginBottom: 8,
        }}>
          {node.bucket.toUpperCase()}
        </div>
        <div style={{
          fontSize: 22, color: '#fafafa', fontWeight: 700,
          letterSpacing: '-0.01em', lineHeight: 1.2,
        }}>
          {node.label}
        </div>
        <div style={{
          fontSize: 11, color: '#71717a',
          fontFamily: 'ui-monospace,monospace',
          marginTop: 6, letterSpacing: '0.04em',
        }}>
          sub-sector · {companies.length} {companies.length === 1 ? 'company' : 'companies'} in coverage
        </div>
      </div>

      {/* Thesis */}
      {bucket?.why && (
        <div style={{ padding: '18px 24px 16px' }}>
          <div style={{
            fontSize: 9, color: bucket.color,
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.14em', fontWeight: 700,
            marginBottom: 8,
          }}>WHY THIS BUCKET</div>
          <div style={{ fontSize: 12.5, color: '#d4d4d8', lineHeight: 1.7 }}>
            {bucket.why}
          </div>
        </div>
      )}

      {/* Upstream / Downstream */}
      <div style={{ padding: '8px 24px 16px' }}>
        {upstream.length > 0 && (
          <>
            <div style={{
              fontSize: 9, color: '#a1a1aa',
              fontFamily: 'ui-monospace,monospace',
              letterSpacing: '0.14em', fontWeight: 700,
              marginBottom: 8, marginTop: 6,
            }}>↑ FED BY</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {upstream.map(u => (
                <ChainPill key={u.id} node={u} onClick={() => onJump(u.id)} />
              ))}
            </div>
          </>
        )}
        {downstream.length > 0 && (
          <>
            <div style={{
              fontSize: 9, color: '#a1a1aa',
              fontFamily: 'ui-monospace,monospace',
              letterSpacing: '0.14em', fontWeight: 700,
              marginBottom: 8,
            }}>↓ FEEDS INTO</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {downstream.map(d => (
                <ChainPill key={d.id} node={d} onClick={() => onJump(d.id)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Companies */}
      <div style={{ padding: '18px 24px 28px', borderTop: '1px solid #18181b' }}>
        <div style={{
          fontSize: 9, color: bucket?.color,
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.14em', fontWeight: 700,
          marginBottom: 10,
        }}>COMPANIES IN COVERAGE</div>
        {companies.length === 0 ? (
          <div style={{ fontSize: 11.5, color: '#52525b', fontStyle: 'italic' }}>
            No named companies — this is a context node in the chain.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {companies.map(c => {
              const cs = DC_CONVICTION_STYLE[c.conviction] || DC_CONVICTION_STYLE.Medium;
              return (
                <div key={c.company} style={{
                  background: '#18181b', border: '1px solid #27272a',
                  borderLeft: `3px solid ${bucket?.color}`,
                  borderRadius: 6, padding: '10px 12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 12.5, color: '#fafafa', fontWeight: 600 }}>{c.company}</span>
                    <span style={{
                      fontSize: 9.5, padding: '2px 6px', borderRadius: 3, fontWeight: 700,
                      fontFamily: 'ui-monospace,monospace',
                      color: cs.color, background: cs.bg, border: `1px solid ${cs.border}`,
                    }}>{c.conviction}</span>
                  </div>
                  <div style={{
                    fontSize: 10.5, color: '#a1a1aa',
                    fontFamily: 'ui-monospace,monospace',
                    marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap',
                  }}>
                    <span>{c.ticker}</span>
                    <span style={{ color: '#3f3f46' }}>·</span>
                    <span style={{ color: c.ppr === 'Pub' ? '#10b981' : '#a78bfa' }}>
                      {c.ppr === 'Pub' ? 'PUBLIC' : 'PRIVATE'}
                    </span>
                    <span style={{ color: '#3f3f46' }}>·</span>
                    <span>{c.horizon}</span>
                    <span style={{ color: '#3f3f46' }}>·</span>
                    <span>{c.geo}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ChainPill({ node, onClick }) {
  const bucket = DC_BUCKETS[node.bucket];
  return (
    <button
      onClick={onClick}
      style={{
        background: '#18181b',
        border: `1px solid ${bucket?.color}55`,
        borderRadius: 999,
        padding: '5px 11px 5px 9px',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        cursor: 'pointer',
        font: 'inherit',
        transition: 'border-color 160ms, background 160ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = `${bucket?.color}14`; e.currentTarget.style.borderColor = bucket?.color; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#18181b'; e.currentTarget.style.borderColor = `${bucket?.color}55`; }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: bucket?.color }} />
      <span style={{ fontSize: 11, color: '#e4e4e7' }}>{node.label}</span>
    </button>
  );
}
