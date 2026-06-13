// ══════════════════════════════════════════════════════════════════════════
// RESEARCH: DC AI — SUPPLY-CHAIN GRAPH
// Layered DAG of the AI infrastructure chain. Sub-sector nodes flow top
// (raw substrates) → bottom (AI applications) with curved edges showing
// what feeds what. Click a node → right-side inspector panel with the
// chain neighbours, thesis copy, and companies in coverage.
// ══════════════════════════════════════════════════════════════════════════
import React, { useMemo, useState } from 'react';
import dcCompaniesData from '../../../data/dc-companies.json';
import dcBucketsData from '../../../data/dc-buckets.json';

const DC_COMPANIES = dcCompaniesData;
const { DC_BUCKETS, DC_CONVICTION_STYLE } = dcBucketsData;

// ─ Canvas geometry ────────────────────────────────────────────────────────
const CANVAS_W       = 1180;
const PAD_X_LEFT     = 130;   // room for vertical layer labels
const PAD_X_RIGHT    = 50;
const PAD_Y_TOP      = 70;
const PAD_Y_BOTTOM   = 70;
const LAYER_GAP      = 112;
const NODE_W         = 152;
const NODE_H         = 48;
const BIG_NODE_W     = 210;
const BIG_NODE_H     = 64;

// ─ Bucket short-codes — shown on every node for instant group recognition.
const BUCKET_TAGS = {
  'Power & Grid':             'PWR',
  'Compute & Silicon':        'CMP',
  'Materials & Chemicals':    'MAT',
  'Connectivity & Photonics': 'NET',
  'Construction & Labor':     'BLD',
  'Cooling & Thermal':        'CLD',
  'Fab & Test Equipment':     'FAB',
  'Software & Apps':          'APP',
};

// ─ Layer definitions ──────────────────────────────────────────────────────
const LAYERS = [
  { id: 'L1',  label: 'RAW INPUTS',         caption: 'substrates · chemistry' },
  { id: 'L2',  label: 'EQUIPMENT & DESIGN', caption: 'fab tools · EDA · test' },
  { id: 'L3',  label: 'CHIPS',              caption: 'logic · power semis' },
  { id: 'L4',  label: 'ASSEMBLY',           caption: 'packaging · PCB' },
  { id: 'L5',  label: 'POWER ORIGIN',       caption: 'generation · fuel' },
  { id: 'L6',  label: 'POWER DELIVERY',     caption: 'grid → rack' },
  { id: 'L7',  label: 'INTERCONNECT',       caption: 'move the bits' },
  { id: 'L8',  label: 'SITE BUILDOUT',      caption: 'MEP · cooling · labor' },
  { id: 'L9',  label: 'COMPUTE',            caption: 'the rack' },
  { id: 'L10', label: 'OUTPUT',             caption: 'models · enterprise AI' },
];

// ─ Nodes (sub-sectors) ────────────────────────────────────────────────────
// `sector` matches DC_COMPANIES[].sector so the inspector can filter.
// `bucket` matches a key in DC_BUCKETS for colour + parent grouping.
const NODES_RAW = [
  // L1 — Raw Inputs
  { id: 'goes',        label: 'GOES Steel',       sector: 'GOES Steel',     bucket: 'Materials & Chemicals',    layer: 0 },
  { id: 'resist',      label: 'Photoresist',      sector: 'Photoresist',    bucket: 'Materials & Chemicals',    layer: 0 },
  { id: 'chem',        label: 'Specialty Chem',   sector: 'Specialty Chem', bucket: 'Materials & Chemicals',    layer: 0 },
  { id: 'inpgaas',     label: 'InP / GaAs',       sector: 'InP/GaAs',       bucket: 'Materials & Chemicals',    layer: 0 },
  { id: 'titanium',    label: 'Titanium Alloys',  sector: 'Titanium',       bucket: 'Materials & Chemicals',    layer: 0 },

  // L2 — Equipment & Design
  { id: 'litho',       label: 'Litho / Fab Tools', sector: 'Litho Tools',   bucket: 'Fab & Test Equipment',     layer: 1 },
  { id: 'test',        label: 'Test & Burn-in',   sector: 'Test',           bucket: 'Fab & Test Equipment',     layer: 1 },
  { id: 'eda',         label: 'EDA',              sector: 'EDA',            bucket: 'Compute & Silicon',        layer: 1 },
  { id: 'ip',          label: 'IP / Bonding',     sector: 'IP/Bonding',     bucket: 'Compute & Silicon',        layer: 1 },

  // L3 — Chips
  { id: 'silicon',     label: 'AI Silicon',       sector: 'AI Silicon',     bucket: 'Compute & Silicon',        layer: 2 },
  { id: 'wbg',         label: 'Wide-Bandgap',     sector: 'Wide-Bandgap',   bucket: 'Compute & Silicon',        layer: 2 },

  // L4 — Assembly
  { id: 'pkg',         label: 'Adv Packaging',    sector: 'Adv Packaging',  bucket: 'Compute & Silicon',        layer: 3 },
  { id: 'pcb',         label: 'PCB / Substrates', sector: 'PCB',            bucket: 'Compute & Silicon',        layer: 3 },

  // L5 — Power Origin
  { id: 'nuc',         label: 'Nuclear',          sector: 'Nuclear/SMR',    bucket: 'Power & Grid',             layer: 4 },
  { id: 'smr',         label: 'SMR',              sector: 'SMR',            bucket: 'Power & Grid',             layer: 4 },
  { id: 'fuel',        label: 'Fuel Cells',       sector: 'Fuel Cells',     bucket: 'Power & Grid',             layer: 4 },
  { id: 'gaspipe',     label: 'Gas Pipelines',    sector: 'Gas Pipelines',  bucket: 'Power & Grid',             layer: 4 },
  { id: 'gasturbines', label: 'Gas Turbines',     sector: 'Gas Turbines',   bucket: 'Power & Grid',             layer: 4 },

  // L6 — Power Delivery
  { id: 'power',       label: 'Power',            sector: 'Power',          bucket: 'Power & Grid',             layer: 5 },
  { id: 'transformers', label: 'Transformers',    sector: 'Transformers',   bucket: 'Power & Grid',             layer: 5 },
  { id: 'switchgear',  label: 'Switchgear',       sector: 'Switchgear',     bucket: 'Power & Grid',             layer: 5 },
  { id: 'pmgmt',       label: 'Power Mgmt',       sector: 'Power Mgmt',     bucket: 'Power & Grid',             layer: 5 },

  // L7 — Interconnect
  { id: 'photonics',   label: 'Photonics / CPO',  sector: 'Photonics',      bucket: 'Connectivity & Photonics', layer: 6 },
  { id: 'darkfiber',   label: 'Dark Fiber',       sector: 'Dark Fiber',     bucket: 'Connectivity & Photonics', layer: 6 },
  { id: 'fiber',       label: 'Fiber / Cable',    sector: 'Fiber/Cable',    bucket: 'Connectivity & Photonics', layer: 6 },

  // L8 — Site Buildout
  { id: 'liquid',      label: 'Liquid Cooling',   sector: 'Liquid Cooling', bucket: 'Cooling & Thermal',        layer: 7 },
  { id: 'mep',         label: 'MEP',              sector: 'MEP',            bucket: 'Construction & Labor',     layer: 7 },
  { id: 'contracting', label: 'Contracting',      sector: 'Contracting',    bucket: 'Construction & Labor',     layer: 7 },

  // L9 — Compute Convergence
  { id: 'rack',        label: 'AI COMPUTE',       sector: 'AI Compute Infra', bucket: 'Compute & Silicon',      layer: 8, big: true, secondarySector: 'AI Compute Infra (pivot)' },

  // L10 — Output
  { id: 'lab',         label: 'Frontier Lab',     sector: 'Frontier Lab',   bucket: 'Compute & Silicon',        layer: 9 },
  { id: 'apps',        label: 'AI Integration',   sector: 'AI Apps',        bucket: 'Software & Apps',          layer: 9 },
];

// ─ Edges (directional feed relationships) ─────────────────────────────────
const EDGES_RAW = [
  // L1 → downstream
  ['inpgaas',      'silicon'],
  ['inpgaas',      'photonics'],
  ['titanium',     'gasturbines'],
  ['resist',       'silicon'],
  ['resist',       'litho'],
  ['chem',         'silicon'],
  ['chem',         'pkg'],
  ['goes',         'transformers'],

  // L2 → L3 / L4
  ['litho',        'silicon'],
  ['litho',        'wbg'],
  ['litho',        'pkg'],
  ['test',         'silicon'],
  ['test',         'pkg'],
  ['test',         'wbg'],
  ['eda',          'silicon'],
  ['eda',          'pkg'],
  ['ip',           'pkg'],

  // L3 → L4 / power / compute
  ['silicon',      'pkg'],
  ['silicon',      'pcb'],
  ['silicon',      'rack'],
  ['wbg',          'pmgmt'],
  ['wbg',          'switchgear'],

  // L4 → Compute
  ['pkg',          'rack'],
  ['pcb',          'rack'],

  // L5 → L6
  ['gaspipe',      'gasturbines'],
  ['gasturbines',  'power'],
  ['nuc',          'power'],
  ['smr',          'power'],
  ['fuel',         'power'],

  // L6
  ['power',        'transformers'],
  ['transformers', 'switchgear'],
  ['switchgear',   'pmgmt'],
  ['pmgmt',        'rack'],

  // L7 → Compute
  ['photonics',    'rack'],
  ['darkfiber',    'rack'],
  ['fiber',        'rack'],

  // L8 → Compute
  ['contracting',  'mep'],
  ['mep',          'rack'],
  ['liquid',       'rack'],

  // L9 → L10
  ['rack',         'lab'],
  ['rack',         'apps'],
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

const NODES    = layoutNodes();
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
  const [bucketFilter, setBucketFilter] = useState(null);

  // Active set decides which nodes/edges are "lit" vs dimmed. Priority:
  // selected node > hovered node > bucket filter > none.
  const activeNode = hovered || selected;
  const activeSet = useMemo(() => {
    if (activeNode) {
      return new Set([activeNode, ...NEIGHBOURS[activeNode].in, ...NEIGHBOURS[activeNode].out]);
    }
    if (bucketFilter) {
      return new Set(Object.values(NODES).filter(n => n.bucket === bucketFilter).map(n => n.id));
    }
    return null;
  }, [activeNode, bucketFilter]);

  const selectedNode = selected ? NODES[selected] : null;
  const selectedBucket = selectedNode ? DC_BUCKETS[selectedNode.bucket] : null;
  const selectedCompanies = selectedNode
    ? DC_COMPANIES.filter(c =>
        c.sector === selectedNode.sector ||
        (selectedNode.secondarySector && c.sector === selectedNode.secondarySector))
    : [];

  const totalCompanies = DC_COMPANIES.length;

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
          AI INFRASTRUCTURE · SUPPLY-CHAIN MAP
        </div>
        <div style={{
          fontSize: 30, color: '#fafafa', fontWeight: 700,
          letterSpacing: '-0.02em', lineHeight: 1.15,
          margin: '0 auto 12px', maxWidth: 780,
        }}>
          From <span style={{ color: '#f59e0b' }}>raw substrates</span> all the way down to{' '}
          <span style={{ color: '#ec4899' }}>enterprise AI</span>.
        </div>
        <div style={{
          fontSize: 13.5, color: '#a1a1aa', lineHeight: 1.65,
          maxWidth: 640, margin: '0 auto',
        }}>
          {Object.keys(NODES).length} sub-sectors · {EDGES_RAW.length} dependencies ·{' '}
          {totalCompanies} companies · tap any node to open the inspector.
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
          radial-gradient(ellipse 600px 200px at 50% ${CANVAS_H - 80}px, rgba(236,72,153,0.06), transparent 70%),
          radial-gradient(ellipse 700px 240px at 50% ${CANVAS_H * 0.62}px, rgba(34,211,238,0.05), transparent 70%),
          radial-gradient(ellipse 500px 200px at 50% 60px, rgba(245,158,11,0.05), transparent 70%)
        `,
      }}>

        {/* Layer guide lines + labels */}
        {LAYERS.map((L, i) => {
          const y = PAD_Y_TOP + i * LAYER_GAP;
          return (
            <React.Fragment key={L.id}>
              <div style={{
                position: 'absolute',
                left: PAD_X_LEFT - 24, right: PAD_X_RIGHT - 24,
                top: y, height: 1,
                background: 'linear-gradient(to right, transparent, rgba(63,63,70,0.35), transparent)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', left: 0, top: y - 18, width: PAD_X_LEFT - 28,
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
          {EDGES_RAW.map(([from, to], i) => {
            const a = NODES[from], b = NODES[to];
            if (!a || !b) return null;
            const x1 = a.cx, y1 = a.bottomY;
            const x2 = b.cx, y2 = b.topY;
            const dy = Math.max(40, (y2 - y1) * 0.55);
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
                strokeOpacity={isLive ? 0.9 : isDim ? 0.06 : 0.28}
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
            const c = bucket?.color || '#52525b';
            const tag = BUCKET_TAGS[n.bucket] || '';
            const companyCount = DC_COMPANIES.filter(co =>
              co.sector === n.sector ||
              (n.secondarySector && co.sector === n.secondarySector)).length;

            // Tint strengths step up by state. Base nodes get a soft tinted
            // background so same-bucket nodes pop as a group at a glance.
            const baseTint   = isSelected ? '2e' : isHovered ? '1f' : '14';
            const baseBorder = isSelected ? c          : isHovered ? c + 'cc' : c + '66';
            const stripeW    = isSelected ? 6 : isHovered ? 5 : 4;

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
                  background: `linear-gradient(135deg, ${c}${baseTint} 0%, #18181b 80%)`,
                  border: `1px solid ${baseBorder}`,
                  borderRadius: n.big ? 11 : 9,
                  padding: `0 10px 0 ${stripeW + 9}px`,
                  cursor: 'pointer',
                  opacity: isLive ? 1 : 0.20,
                  transform: isSelected ? 'scale(1.06)' : isHovered ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: isSelected
                    ? `0 0 0 4px ${c}33, 0 10px 28px rgba(0,0,0,0.55), inset 0 0 0 1px ${c}55`
                    : isHovered
                      ? `0 6px 20px ${c}55`
                      : `0 2px 8px rgba(0,0,0,0.35)`,
                  display: 'flex', alignItems: 'center', gap: 10,
                  color: '#fafafa', font: 'inherit', textAlign: 'left',
                  zIndex: isSelected ? 4 : isHovered ? 3 : 2,
                  overflow: 'hidden',
                }}
              >
                {/* Solid bucket-color left stripe (always at full saturation) */}
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: stripeW,
                  background: c,
                  boxShadow: `${stripeW}px 0 12px ${c}66`,
                  transition: 'width 200ms',
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
                      fontSize: 9, color: '#a1a1aa',
                      fontFamily: 'ui-monospace,monospace',
                      letterSpacing: '0.05em', marginTop: 2,
                    }}>
                      {companyCount} {companyCount === 1 ? 'name' : 'names'}
                    </div>
                  )}
                </div>

                {/* Bucket monogram — small chip on the right */}
                <div style={{
                  fontSize: 8.5, fontWeight: 800,
                  fontFamily: 'ui-monospace,monospace',
                  letterSpacing: '0.08em',
                  color: c,
                  background: `${c}22`,
                  border: `1px solid ${c}55`,
                  padding: '2px 5px',
                  borderRadius: 3,
                  lineHeight: 1,
                  flexShrink: 0,
                }}>
                  {tag}
                </div>

                {/* Selection pulse */}
                {isSelected && (
                  <span style={{
                    position: 'absolute', inset: -6,
                    borderRadius: n.big ? 15 : 13,
                    border: `1px solid ${c}`,
                    opacity: 0.55,
                    pointerEvents: 'none',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Inspector — slides in over the right side, no backdrop dim */}
        {selectedNode && (
          <InspectorPanel
            node={selectedNode}
            layer={LAYERS[selectedNode.layer]}
            layerIdx={selectedNode.layer}
            totalLayers={LAYERS.length}
            bucket={selectedBucket}
            companies={selectedCompanies}
            upstream={NEIGHBOURS[selectedNode.id].in.map(id => NODES[id])}
            downstream={NEIGHBOURS[selectedNode.id].out.map(id => NODES[id])}
            onClose={() => setSelected(null)}
            onJump={(id) => setSelected(id)}
          />
        )}

      </div>

      {/* Legend — clickable bucket filter */}
      <div style={{
        margin: '40px auto 8px', maxWidth: CANVAS_W,
        padding: '14px 18px',
        background: '#0d0d0e',
        border: '1px solid #27272a',
        borderRadius: 10,
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 9.5, color: '#71717a',
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.16em', fontWeight: 700, marginRight: 4,
        }}>
          FILTER BY BUCKET
        </div>
        {Object.entries(DC_BUCKETS).map(([name, def]) => {
          const active = bucketFilter === name;
          const dim    = bucketFilter && !active;
          return (
            <button
              key={name}
              onClick={() => setBucketFilter(active ? null : name)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 11px 6px 9px',
                background: active ? `${def.color}22` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${active ? def.color : def.color + '40'}`,
                borderRadius: 999,
                cursor: 'pointer',
                opacity: dim ? 0.45 : 1,
                color: '#fafafa', font: 'inherit',
                transition: 'all 160ms',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${def.color}14`; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <span style={{
                width: 9, height: 9, borderRadius: '50%',
                background: def.color,
                boxShadow: `0 0 8px ${def.color}88`,
              }} />
              <span style={{ fontSize: 11, color: '#e4e4e7', fontWeight: active ? 700 : 500 }}>
                {name}
              </span>
              <span style={{
                fontSize: 8.5, fontWeight: 800,
                fontFamily: 'ui-monospace,monospace',
                letterSpacing: '0.08em',
                color: def.color,
                background: `${def.color}22`,
                border: `1px solid ${def.color}55`,
                padding: '1.5px 4px',
                borderRadius: 3,
              }}>
                {BUCKET_TAGS[name]}
              </span>
            </button>
          );
        })}
        {bucketFilter && (
          <button
            onClick={() => setBucketFilter(null)}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid #3f3f46',
              borderRadius: 999,
              fontSize: 10.5, color: '#a1a1aa',
              fontFamily: 'ui-monospace,monospace',
              letterSpacing: '0.08em', fontWeight: 700,
              cursor: 'pointer', font: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fafafa'}
            onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}
          >
            CLEAR
          </button>
        )}
      </div>

    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Inspector panel — slides in from the right of the canvas.
// Redesigned: bucket-tinted header, compact chain-position widget,
// chain neighbour chips, then companies grouped by conviction.
// ──────────────────────────────────────────────────────────────────────────
function InspectorPanel({ node, layer, layerIdx, totalLayers, bucket, companies, upstream, downstream, onClose, onJump }) {
  const c = bucket?.color || '#a1a1aa';

  // Sort companies by conviction tier so the strongest names come first.
  const order = { 'High': 0, 'Med-High': 1, 'Medium': 2, 'Low-Med': 3, 'Low': 4 };
  const sortedCompanies = [...companies].sort(
    (a, b) => (order[a.conviction] ?? 9) - (order[b.conviction] ?? 9));

  return (
    <div style={{
      position: 'absolute',
      top: 0, right: 0, bottom: 0,
      width: 400, maxWidth: '92%',
      background: 'rgba(10,10,11,0.97)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      borderLeft: `1px solid ${c}55`,
      boxShadow: `-32px 0 60px rgba(0,0,0,0.65), -1px 0 0 ${c}33`,
      zIndex: 10,
      overflowY: 'auto',
      animation: 'inspector-slide 200ms cubic-bezier(0.4,0,0.2,1)',
    }}>
      <style>{`
        @keyframes inspector-slide {
          from { transform: translateX(28px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Header — bucket-tinted */}
      <div style={{
        padding: '22px 24px 20px',
        background: `linear-gradient(180deg, ${c}1a 0%, transparent 100%)`,
        borderBottom: `1px solid ${c}26`,
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${c}55`,
            color: '#fafafa', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: 'inherit', transition: 'all 140ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = c + '33'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >×</button>

        <div style={{
          fontSize: 9.5, color: c,
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.18em', fontWeight: 700,
          marginBottom: 6,
        }}>
          STAGE {String(layerIdx + 1).padStart(2, '0')} / {String(totalLayers).padStart(2, '0')} · {layer.label}
        </div>

        <div style={{
          fontSize: 22, color: '#fafafa', fontWeight: 700,
          letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 4,
        }}>
          {node.label}
        </div>
        <div style={{
          fontSize: 11.5, color: '#a1a1aa',
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.04em',
        }}>
          {node.bucket} · {companies.length} {companies.length === 1 ? 'company' : 'companies'}
        </div>

        {/* chain position rail */}
        <div style={{
          marginTop: 16, display: 'flex', gap: 3,
          alignItems: 'center',
        }}>
          {Array.from({ length: totalLayers }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4,
              borderRadius: 2,
              background: i === layerIdx ? c : i < layerIdx ? `${c}55` : '#1f1f23',
              transition: 'background 160ms',
            }} />
          ))}
        </div>
      </div>

      {/* Thesis */}
      {bucket?.why && (
        <div style={{ padding: '18px 24px 14px' }}>
          <div style={{
            fontSize: 9, color: c,
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.14em', fontWeight: 700,
            marginBottom: 8,
          }}>WHY THIS LAYER</div>
          <div style={{ fontSize: 12.5, color: '#d4d4d8', lineHeight: 1.7 }}>
            {bucket.why}
          </div>
        </div>
      )}

      {/* Chain neighbours */}
      {(upstream.length > 0 || downstream.length > 0) && (
        <div style={{ padding: '4px 24px 18px' }}>
          {upstream.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 9, color: '#a1a1aa',
                fontFamily: 'ui-monospace,monospace',
                letterSpacing: '0.14em', fontWeight: 700,
                marginBottom: 8,
              }}>↑ FED BY</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {upstream.map(u => (
                  <ChainPill key={u.id} node={u} onClick={() => onJump(u.id)} />
                ))}
              </div>
            </div>
          )}
          {downstream.length > 0 && (
            <div>
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
            </div>
          )}
        </div>
      )}

      {/* Companies */}
      <div style={{ padding: '14px 24px 28px', borderTop: '1px solid #18181b' }}>
        <div style={{
          fontSize: 9, color: c,
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.14em', fontWeight: 700,
          marginBottom: 12,
        }}>NAMES IN COVERAGE</div>
        {sortedCompanies.length === 0 ? (
          <div style={{ fontSize: 11.5, color: '#52525b', fontStyle: 'italic' }}>
            No named companies — this is a context node in the chain.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sortedCompanies.map(co => {
              const cs = DC_CONVICTION_STYLE[co.conviction] || DC_CONVICTION_STYLE.Medium;
              return (
                <div key={co.company} style={{
                  background: '#131316',
                  border: '1px solid #27272a',
                  borderLeft: `3px solid ${c}`,
                  borderRadius: 6, padding: '10px 12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 12.5, color: '#fafafa', fontWeight: 600 }}>{co.company}</span>
                    <span style={{
                      fontSize: 9.5, padding: '2px 6px', borderRadius: 3, fontWeight: 700,
                      fontFamily: 'ui-monospace,monospace',
                      color: cs.color, background: cs.bg, border: `1px solid ${cs.border}`,
                      whiteSpace: 'nowrap',
                    }}>{co.conviction}</span>
                  </div>
                  <div style={{
                    fontSize: 10.5, color: '#a1a1aa',
                    fontFamily: 'ui-monospace,monospace',
                    marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap',
                  }}>
                    <span>{co.ticker}</span>
                    <span style={{ color: '#3f3f46' }}>·</span>
                    <span style={{ color: co.ppr === 'Pub' ? '#10b981' : '#a78bfa' }}>
                      {co.ppr === 'Pub' ? 'PUBLIC' : 'PRIVATE'}
                    </span>
                    <span style={{ color: '#3f3f46' }}>·</span>
                    <span>{co.horizon}</span>
                    <span style={{ color: '#3f3f46' }}>·</span>
                    <span>{co.geo}</span>
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
  const c = bucket?.color || '#a1a1aa';
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${c}55`,
        borderRadius: 999,
        padding: '5px 11px 5px 9px',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        cursor: 'pointer',
        font: 'inherit',
        transition: 'all 140ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = c + '20'; e.currentTarget.style.borderColor = c; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = `${c}55`; }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
      <span style={{ fontSize: 11, color: '#e4e4e7' }}>{node.label}</span>
    </button>
  );
}
