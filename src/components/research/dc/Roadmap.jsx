// ══════════════════════════════════════════════════════════════════════════
// RESEARCH: DC AI — VALUE-CHAIN ROADMAP
// Scroll-down roadmap of the AI-infrastructure stack. Six chain layers,
// upstream (top) → downstream (bottom). Each layer is a tappable card; tap
// expands an inline panel with the why, sub-sectors, and the companies we
// cover in that layer. Sector taxonomy + copy come from dc-buckets.json.
// ══════════════════════════════════════════════════════════════════════════
import React, { useMemo, useState } from 'react';
import dcCompaniesData from '../../../data/dc-companies.json';
import dcBucketsData from '../../../data/dc-buckets.json';

const DC_COMPANIES = dcCompaniesData;
const { DC_BUCKETS, DC_CONVICTION_STYLE } = dcBucketsData;

// Order along the production chain (top of page = upstream, bottom = downstream).
const CHAIN_ORDER = [
  'Materials & Chemicals',
  'Compute & Silicon',
  'Connectivity & Photonics',
  'Power & Grid',
  'Cooling & Thermal',
  'Construction & Labor',
];

// What role each layer plays in the chain — short pitch shown on the card.
const CHAIN_ROLES = {
  'Materials & Chemicals': {
    layer: 'UPSTREAM',
    role: 'Raw inputs',
    tagline: 'The chain begins here. GOES electrical steel, EUV photoresists, ultrapure silicon — substrates and chemistry the rest of the stack cannot exist without.',
  },
  'Compute & Silicon': {
    layer: 'UPSTREAM',
    role: 'Design & bond',
    tagline: 'Where ideas become silicon. EDA tools design the chips, hybrid bonders stack the memory, frontier labs train the models.',
  },
  'Connectivity & Photonics': {
    layer: 'MIDSTREAM',
    role: 'Move the bits',
    tagline: 'Subsea cables, intra-region dark fiber, in-rack co-packaged optics. Copper interconnect cannot scale past 800G — photonics has to take over.',
  },
  'Power & Grid': {
    layer: 'DOWNSTREAM',
    role: 'Energise',
    tagline: 'The single most binding constraint in the stack. 30–40 month transformer lead times. PJM queues 8+ years. Where the buildout meets the grid.',
  },
  'Cooling & Thermal': {
    layer: 'DOWNSTREAM',
    role: 'Dissipate',
    tagline: '120+ kW racks broke air cooling. Forced air→liquid retrofit across the install base, then a redesign of every new build.',
  },
  'Construction & Labor': {
    layer: 'DOWNSTREAM',
    role: 'Build it',
    tagline: '3,000–4,000 electricians per 1 GW campus. MEP contractors turn down work. Pricing power is structural until the labor pipeline catches up.',
  },
};

function dcBucketFor(sector) {
  for (const [name, def] of Object.entries(DC_BUCKETS)) {
    if (def.sectors.includes(sector)) return name;
  }
  return 'Other';
}

export default function Roadmap() {
  const [expanded, setExpanded] = useState(null);
  const [hovered, setHovered]   = useState(null);

  const stages = useMemo(() => {
    return CHAIN_ORDER.map((name, i) => {
      const def = DC_BUCKETS[name];
      const role = CHAIN_ROLES[name] || {};
      const companies = DC_COMPANIES.filter(c => dcBucketFor(c.sector) === name);
      return { name, idx: i, ...def, ...role, companies };
    });
  }, []);

  return (
    <div style={{ marginTop: 8 }}>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div style={{
        textAlign: 'center',
        padding: '36px 24px 28px 24px',
        marginBottom: 14,
      }}>
        <div style={{
          display: 'inline-block',
          fontSize: 10.5, color: '#22D3EE',
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.20em', fontWeight: 700,
          padding: '4px 12px', borderRadius: 4,
          background: 'rgba(34,211,238,0.08)',
          border: '1px solid rgba(34,211,238,0.30)',
          marginBottom: 18,
        }}>
          THE AI INFRASTRUCTURE STACK
        </div>
        <div style={{
          fontSize: 30, color: '#fafafa', fontWeight: 700,
          letterSpacing: '-0.02em', lineHeight: 1.15,
          marginBottom: 14, maxWidth: 720, margin: '0 auto 14px',
        }}>
          From raw materials to running rack —<br />
          <span style={{ color: '#22D3EE' }}>six layers, top to bottom.</span>
        </div>
        <div style={{
          fontSize: 13.5, color: '#a1a1aa', lineHeight: 1.65,
          maxWidth: 580, margin: '0 auto',
        }}>
          Every layer is a chokepoint. Scroll down the chain — tap any layer to see
          the companies that own it and why this part of the stack matters.
        </div>

        {/* Scroll cue */}
        <div style={{
          marginTop: 26, fontSize: 18, color: '#3f3f46',
          animation: 'none',
        }}>↓</div>
      </div>

      {/* ── Roadmap spine ───────────────────────────────────────────────── */}
      <div style={{ position: 'relative', padding: '20px 0 40px 0' }}>

        {/* Vertical spine line */}
        <div style={{
          position: 'absolute',
          left: '50%', top: 0, bottom: 0,
          width: 2, marginLeft: -1,
          background: 'linear-gradient(180deg, transparent 0%, #27272a 6%, #27272a 94%, transparent 100%)',
          zIndex: 0,
        }} />

        {/* Stages */}
        {stages.map((s, i) => {
          const side = i % 2 === 0 ? 'left' : 'right';
          const isExpanded = expanded === s.name;
          const isHovered  = hovered  === s.name;

          return (
            <React.Fragment key={s.name}>
              <StageRow
                stage={s}
                side={side}
                isExpanded={isExpanded}
                isHovered={isHovered}
                onClick={() => setExpanded(isExpanded ? null : s.name)}
                onMouseEnter={() => setHovered(s.name)}
                onMouseLeave={() => setHovered(null)}
              />
              {isExpanded && <StageDetail stage={s} />}
            </React.Fragment>
          );
        })}

        {/* End cap — terminus of the chain */}
        <div style={{
          position: 'relative', zIndex: 2,
          margin: '4px auto 0', width: 'fit-content',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%',
            background: '#0a0a0a', border: '2px solid #3f3f46',
          }} />
          <div style={{
            fontSize: 10, color: '#52525b',
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.18em', fontWeight: 700,
          }}>
            THE RACK · LIVE
          </div>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// One row of the roadmap: a card on one side of the spine + a connector
// line + a colored node circle on the spine.
// ─────────────────────────────────────────────────────────────────────────
function StageRow({ stage, side, isExpanded, isHovered, onClick, onMouseEnter, onMouseLeave }) {
  const isLeft = side === 'left';
  const layerColor = {
    UPSTREAM:   '#22D3EE',
    MIDSTREAM:  '#a78bfa',
    DOWNSTREAM: '#f59e0b',
  }[stage.layer] || '#a1a1aa';

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      display: 'grid',
      gridTemplateColumns: '1fr 60px 1fr',
      alignItems: 'center',
      minHeight: 200,
      marginBottom: 6,
    }}>
      {/* Left slot */}
      <div style={{
        gridColumn: 1, gridRow: 1,
        display: 'flex', justifyContent: 'flex-end',
        paddingRight: 4,
        visibility: isLeft ? 'visible' : 'hidden',
      }}>
        {isLeft && (
          <StageCard
            stage={stage}
            side="left"
            layerColor={layerColor}
            isExpanded={isExpanded}
            isHovered={isHovered}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        )}
      </div>

      {/* Node — sits on the spine */}
      <div style={{
        gridColumn: 2, gridRow: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: isHovered || isExpanded ? 22 : 18,
          height: isHovered || isExpanded ? 22 : 18,
          borderRadius: '50%',
          background: '#0a0a0a',
          border: `2px solid ${stage.color}`,
          boxShadow: isHovered || isExpanded
            ? `0 0 0 6px ${stage.color}22, 0 0 22px ${stage.color}66`
            : `0 0 0 4px #0a0a0a, 0 0 12px ${stage.color}40`,
          transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
          position: 'relative',
        }}>
          {/* Inner core dot */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 6, height: 6, borderRadius: '50%',
            background: stage.color,
          }} />
        </div>
      </div>

      {/* Right slot */}
      <div style={{
        gridColumn: 3, gridRow: 1,
        display: 'flex', justifyContent: 'flex-start',
        paddingLeft: 4,
        visibility: isLeft ? 'hidden' : 'visible',
      }}>
        {!isLeft && (
          <StageCard
            stage={stage}
            side="right"
            layerColor={layerColor}
            isExpanded={isExpanded}
            isHovered={isHovered}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// The clickable card itself — fixed width, slight lift on hover, glow when
// hovered or expanded. The big faded number sits behind the title.
// ─────────────────────────────────────────────────────────────────────────
function StageCard({ stage, side, layerColor, isExpanded, isHovered, onClick, onMouseEnter, onMouseLeave }) {
  const lift = isHovered || isExpanded;
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        width: 440, maxWidth: '100%',
        textAlign: side === 'left' ? 'right' : 'left',
        background: '#18181b',
        border: `1px solid ${lift ? stage.color + '88' : '#27272a'}`,
        borderRadius: 12,
        padding: '22px 24px',
        cursor: 'pointer',
        position: 'relative', overflow: 'hidden',
        transform: lift ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: lift
          ? `0 14px 36px rgba(0,0,0,0.45), 0 0 0 1px ${stage.color}22 inset`
          : '0 4px 14px rgba(0,0,0,0.25)',
        transition: 'transform 220ms cubic-bezier(0.4,0,0.2,1), border-color 220ms, box-shadow 220ms',
        color: 'inherit', font: 'inherit',
        display: 'block',
      }}
    >
      {/* Colored top stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: stage.color, opacity: 0.85,
      }} />

      {/* Faded large stage number */}
      <div style={{
        position: 'absolute',
        top: 8,
        [side === 'left' ? 'left' : 'right']: 16,
        fontSize: 84, fontWeight: 800,
        fontFamily: 'ui-monospace,monospace',
        letterSpacing: '-0.04em',
        color: stage.color,
        opacity: 0.06,
        lineHeight: 1,
        userSelect: 'none', pointerEvents: 'none',
      }}>
        0{stage.idx + 1}
      </div>

      {/* Header row — layer pill + stage number tag */}
      <div style={{
        display: 'flex',
        justifyContent: side === 'left' ? 'flex-end' : 'flex-start',
        alignItems: 'center', gap: 8,
        marginBottom: 12,
        flexDirection: side === 'left' ? 'row-reverse' : 'row',
      }}>
        <span style={{
          fontSize: 9.5, color: layerColor,
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.18em', fontWeight: 700,
          padding: '3px 8px', borderRadius: 3,
          background: `${layerColor}14`,
          border: `1px solid ${layerColor}55`,
        }}>
          {stage.layer}
        </span>
        <span style={{
          fontSize: 9.5, color: '#71717a',
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.14em', fontWeight: 700,
        }}>
          STAGE 0{stage.idx + 1}
        </span>
      </div>

      {/* Title */}
      <div style={{
        fontSize: 19, color: '#fafafa', fontWeight: 700,
        letterSpacing: '-0.01em', lineHeight: 1.2,
        marginBottom: 4,
      }}>
        {stage.name}
      </div>

      {/* Role */}
      <div style={{
        fontSize: 11.5, color: stage.color,
        fontFamily: 'ui-monospace,monospace',
        letterSpacing: '0.04em', fontWeight: 600,
        marginBottom: 14,
      }}>
        {stage.role}
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: 12.5, color: '#a1a1aa',
        lineHeight: 1.6, marginBottom: 16,
      }}>
        {stage.tagline}
      </div>

      {/* Bottom row — top pick + coverage count + expand cue */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between', alignItems: 'flex-end',
        gap: 12, paddingTop: 14, borderTop: '1px solid #27272a',
        flexDirection: side === 'left' ? 'row-reverse' : 'row',
      }}>
        <div style={{ textAlign: side === 'left' ? 'right' : 'left' }}>
          <div style={{
            fontSize: 9.5, color: '#52525b',
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.1em', fontWeight: 700,
            marginBottom: 4,
          }}>
            TOP PICK
          </div>
          <div style={{ fontSize: 13, color: '#fafafa', fontWeight: 600 }}>
            {stage.topCompany}
          </div>
          <div style={{
            fontSize: 10.5, color: '#71717a',
            fontFamily: 'ui-monospace,monospace',
          }}>
            {stage.topTicker}
          </div>
        </div>

        <div style={{ textAlign: side === 'left' ? 'left' : 'right' }}>
          <div style={{
            fontSize: 22, color: stage.color, fontWeight: 700,
            fontFamily: 'ui-monospace,monospace', letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            {stage.companies.length}
          </div>
          <div style={{
            fontSize: 9.5, color: '#71717a',
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.08em', marginTop: 4,
          }}>
            NAMES COVERED
          </div>
        </div>
      </div>

      {/* Expand cue */}
      <div style={{
        marginTop: 14, paddingTop: 10, borderTop: '1px dashed #27272a',
        fontSize: 10.5, color: lift ? stage.color : '#52525b',
        fontFamily: 'ui-monospace,monospace',
        letterSpacing: '0.1em', fontWeight: 600,
        textAlign: 'center', transition: 'color 200ms',
      }}>
        {isExpanded ? '× CLOSE' : 'TAP TO OPEN ↓'}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// The full-width panel that drops in when a card is expanded — sub-sectors,
// thesis copy, and every company we cover in this layer.
// ─────────────────────────────────────────────────────────────────────────
function StageDetail({ stage }) {
  return (
    <div style={{
      position: 'relative', zIndex: 2,
      margin: '-4px auto 20px',
      width: '100%',
      background: '#0d0d0e',
      border: '1px solid #27272a',
      borderTop: `3px solid ${stage.color}`,
      borderRadius: 12,
      padding: '24px 28px 26px',
      boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18,
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: 10, color: stage.color,
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.16em', fontWeight: 700,
        }}>
          STAGE 0{stage.idx + 1} · {stage.layer}
        </span>
        <span style={{
          fontSize: 16, color: '#fafafa', fontWeight: 700,
        }}>
          {stage.name}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 10.5, color: '#71717a',
          fontFamily: 'ui-monospace,monospace',
          letterSpacing: '0.08em',
        }}>
          {stage.companies.length} COMPANIES · {stage.sectors.length} SUB-SECTORS
        </span>
      </div>

      {/* Two-col body: why + sub-sectors */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28,
        marginBottom: 22,
      }}>
        <div>
          <div style={{
            fontSize: 9.5, color: stage.color,
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.14em', fontWeight: 700, marginBottom: 8,
          }}>
            WHY THIS LAYER
          </div>
          <div style={{ fontSize: 13, color: '#e4e4e7', lineHeight: 1.7 }}>
            {stage.why}
          </div>
        </div>
        <div>
          <div style={{
            fontSize: 9.5, color: stage.color,
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.14em', fontWeight: 700, marginBottom: 10,
          }}>
            SUB-SECTORS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {stage.sectors.map(sub => (
              <span key={sub} style={{
                fontSize: 11, color: '#d4d4d8',
                fontFamily: 'ui-monospace,monospace',
                padding: '4px 10px', borderRadius: 4,
                background: `${stage.color}10`,
                border: `1px solid ${stage.color}33`,
              }}>
                {sub}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Companies grid */}
      <div style={{
        fontSize: 9.5, color: stage.color,
        fontFamily: 'ui-monospace,monospace',
        letterSpacing: '0.14em', fontWeight: 700, marginBottom: 10,
      }}>
        COMPANIES WE COVER
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 8,
      }}>
        {stage.companies.map(c => {
          const cs = DC_CONVICTION_STYLE[c.conviction] || DC_CONVICTION_STYLE.Medium;
          return (
            <div key={c.company} style={{
              background: '#18181b', border: '1px solid #27272a',
              borderLeft: `3px solid ${stage.color}`,
              borderRadius: 6, padding: '10px 12px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6,
              }}>
                <span style={{ fontSize: 12.5, color: '#fafafa', fontWeight: 600 }}>
                  {c.company}
                </span>
                <span style={{
                  fontSize: 9.5, padding: '2px 6px', borderRadius: 3, fontWeight: 700,
                  fontFamily: 'ui-monospace,monospace',
                  color: cs.color, background: cs.bg, border: `1px solid ${cs.border}`,
                  whiteSpace: 'nowrap',
                }}>
                  {c.conviction}
                </span>
              </div>
              <div style={{
                fontSize: 10.5, color: '#a1a1aa',
                fontFamily: 'ui-monospace,monospace',
                display: 'flex', gap: 8, flexWrap: 'wrap',
              }}>
                <span>{c.ticker}</span>
                <span style={{ color: '#3f3f46' }}>·</span>
                <span>{c.sector}</span>
              </div>
              <div style={{
                fontSize: 9.5, color: '#71717a',
                fontFamily: 'ui-monospace,monospace',
                display: 'flex', gap: 8, marginTop: 2,
              }}>
                <span style={{
                  color: c.ppr === 'Pub' ? '#10b981' : '#a78bfa',
                }}>
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
    </div>
  );
}
