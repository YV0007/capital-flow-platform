// ══════════════════════════════════════════════════════════════════════════
// Home · Capital Flows — top weekly highlights.
//
// Two layers:
//   1. WaveField — an animated band of sector "waves"; each ribbon's height
//      is that sector's share of the week's tracked capital, so a swelling
//      wave literally means capital surging into that sector.
//   2. Top-5 flow rows — allocator ─▶ target streams with capital visibly
//      flowing along them (dash drift + particles). Hover reveals the deal
//      read; any click routes into the full Capital Flow Map.
// ══════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { HOME_FLOWS, SECTOR_SURGES, ruPlural } from './homeData.js';
import { fmtUSD } from '../research/capitalflow/format.js';
import { SectionHeader, LogoTile, Reveal, MONO, EASE } from './ui.jsx';

const W = 1200; // wave-field design width; one loop = one W translate

function waveBandPath(baseY, amp, lambda, phase, thickness) {
  const pts = [];
  for (let x = 0; x <= W * 2; x += 24) {
    pts.push([x, baseY + amp * Math.sin((2 * Math.PI * x) / lambda + phase)]);
  }
  const top = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y.toFixed(1)}`).join(' ');
  const bottom = [...pts].reverse()
    .map(([x, y]) => `L${x},${(y + thickness).toFixed(1)}`).join(' ');
  return `${top} ${bottom} Z`;
}

// λ must divide W so the -W translate loops seamlessly.
const LAMBDAS = [600, 400, 300, 480, 240, 400];

function WaveField({ surges, hovered, onHover }) {
  const bands = useMemo(() => surges.slice(0, 6).map((s, i) => ({
    ...s,
    d: waveBandPath(46 + i * 18, 7 + 24 * s.share, LAMBDAS[i % LAMBDAS.length], i * 1.7, 12 + 52 * s.share),
    dur: 34 + i * 11,
  })), [surges]);

  return (
    <svg
      viewBox={`0 0 ${W} 170`}
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    >
      {bands.map((b, i) => (
        <g
          key={b.key}
          style={{ animation: `hmWaveDrift ${b.dur}s linear infinite` }}
          onMouseEnter={() => onHover(b.key)}
          onMouseLeave={() => onHover(null)}
        >
          <path
            d={b.d}
            fill={b.color}
            style={{
              opacity: hovered === b.key ? 0.42 : 0.13 + 0.1 * b.share,
              transition: 'opacity 250ms',
              cursor: 'pointer',
            }}
          />
        </g>
      ))}
      {/* soft fade top + bottom so the band melts into the page */}
      <rect x="0" y="0" width={W * 2} height="170" fill="url(#hmWaveFade)" pointerEvents="none" />
      <defs>
        <linearGradient id="hmWaveFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A0A0B" stopOpacity="1" />
          <stop offset="0.28" stopColor="#0A0A0B" stopOpacity="0" />
          <stop offset="0.75" stopColor="#0A0A0B" stopOpacity="0" />
          <stop offset="1" stopColor="#0A0A0B" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SurgeChip({ surge, hovered, onHover, onOpen }) {
  const active = hovered === surge.key;
  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => onHover(surge.key)}
      onMouseLeave={() => onHover(null)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 9,
        background: active ? surge.color + '1c' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? surge.color + '80' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: 999, padding: '7px 14px', cursor: 'pointer',
        transition: `all 220ms ${EASE}`, font: 'inherit',
      }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: surge.color,
        boxShadow: surge.lit ? `0 0 8px ${surge.color}` : 'none',
        animation: surge.lit ? 'hmPulse 2.2s ease-in-out infinite' : 'none',
        flexShrink: 0,
      }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7', letterSpacing: '-0.01em' }}>
        {surge.label}
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: surge.color, fontWeight: 700 }}>
        {surge.total > 0
          ? fmtUSD(surge.total)
          : `${surge.count} ${ruPlural(surge.count, ['сделка', 'сделки', 'сделок'])}`}
      </span>
      {surge.signalLabel && (
        <span style={{
          fontSize: 9, fontFamily: MONO, fontWeight: 700, color: '#71717a',
          textTransform: 'uppercase', letterSpacing: '0.08em',
          borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 9,
        }}>
          {surge.signalLabel}
        </span>
      )}
    </button>
  );
}

// Slightly different lazy-river curve per row so the block feels organic.
const STREAM_PATHS = [
  'M0,16 C120,4 240,26 360,14 C480,4 540,22 600,15',
  'M0,14 C110,26 260,4 380,18 C490,28 550,8 600,16',
  'M0,15 C130,6 230,24 350,10 C470,0 545,24 600,14',
  'M0,17 C100,28 250,6 370,20 C480,30 550,10 600,15',
  'M0,14 C140,2 250,26 380,12 C500,2 555,20 600,16',
];

function FlowStream({ flow, index, hovered }) {
  const d = STREAM_PATHS[index % STREAM_PATHS.length];
  // Bigger deals flow thicker and faster.
  const wBase = flow.disclosed ? 2 + 7 * Math.sqrt(flow.amountShare || 0) : 2;
  const dur = flow.disclosed ? 7 - 3.5 * Math.sqrt(flow.amountShare || 0) : 7.5;
  return (
    <svg
      viewBox="0 0 600 30"
      preserveAspectRatio="none"
      style={{ width: '100%', height: 30, display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* base bed */}
      <path
        d={d}
        fill="none"
        stroke={flow.sectorColor}
        strokeWidth={wBase}
        strokeLinecap="round"
        strokeDasharray={flow.disclosed ? undefined : '1 7'}
        style={{ opacity: hovered ? 0.35 : 0.18, transition: 'opacity 220ms' }}
        vectorEffect="non-scaling-stroke"
        pathLength="100"
      />
      {/* the moving current */}
      <path
        d={d}
        fill="none"
        stroke={flow.sectorColor}
        strokeWidth={Math.max(1.4, wBase * 0.55)}
        strokeLinecap="round"
        strokeDasharray="5 11"
        pathLength="100"
        vectorEffect="non-scaling-stroke"
        style={{
          opacity: hovered ? 1 : 0.75,
          animation: `hmFlowDash ${dur}s linear infinite`,
          transition: 'opacity 220ms',
        }}
      />
      {/* capital particles riding the stream */}
      {[0, 1, 2].map((p) => (
        <circle key={p} r={hovered ? 2.6 : 2} fill={flow.sectorColor} opacity={0.9}>
          <animateMotion dur={`${dur * 1.15}s`} begin={`${-p * (dur / 2.6)}s`} repeatCount="indefinite" path={d} />
        </circle>
      ))}
    </svg>
  );
}

function FlowRow({ flow, index, onOpen }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={index * 90}>
      <button
        onClick={onOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'block', width: '100%', textAlign: 'left', font: 'inherit',
          background: hovered
            ? `linear-gradient(90deg, ${flow.sectorColor}0e 0%, rgba(255,255,255,0.02) 60%)`
            : 'rgba(255,255,255,0.015)',
          border: `1px solid ${hovered ? flow.sectorColor + '45' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
          transition: `all 240ms ${EASE}`,
          transform: hovered ? 'translateY(-2px)' : 'none',
          boxShadow: hovered ? `0 16px 36px -18px ${flow.sectorColor}55` : 'none',
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: '22px minmax(150px, 190px) 1fr minmax(150px, 190px) minmax(96px, auto)',
          alignItems: 'center', gap: 16,
        }}>
          {/* rank */}
          <span style={{
            fontSize: 12, fontFamily: MONO, fontWeight: 700,
            color: hovered ? flow.sectorColor : '#3f3f46', transition: 'color 200ms',
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>

          {/* allocator */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <LogoTile src={flow.allocator.logo} mono={flow.allocator.monogram} color={flow.sectorColor} />
            <span style={{ minWidth: 0 }}>
              <span style={{
                display: 'block', fontSize: 13.5, fontWeight: 600, color: '#fafafa',
                letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {flow.allocator.name}
              </span>
              <span style={{ display: 'block', fontSize: 9.5, fontFamily: MONO, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {flow.allocator.clsLabel}
              </span>
            </span>
          </span>

          {/* the stream */}
          <span style={{ minWidth: 0 }}>
            <FlowStream flow={flow} index={index} hovered={hovered} />
          </span>

          {/* target */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <LogoTile src={flow.target.logo} mono={flow.target.monogram} color={flow.sectorColor} />
            <span style={{ minWidth: 0 }}>
              <span style={{
                display: 'block', fontSize: 13.5, fontWeight: 600, color: '#fafafa',
                letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {flow.target.name}
              </span>
              <span style={{ display: 'block', fontSize: 9.5, fontFamily: MONO, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {flow.eventLabel}
              </span>
            </span>
          </span>

          {/* amount + sector */}
          <span style={{ textAlign: 'right' }}>
            <span style={{
              display: 'block', fontSize: 16, fontWeight: 700, fontFamily: MONO,
              color: flow.disclosed ? '#fafafa' : '#71717a', letterSpacing: '-0.02em',
            }}>
              {flow.disclosed ? fmtUSD(flow.amountUSD) : 'н/д'}
            </span>
            <span style={{
              display: 'inline-block', marginTop: 3, fontSize: 9, fontFamily: MONO, fontWeight: 700,
              color: flow.sectorColor, textTransform: 'uppercase', letterSpacing: '0.09em',
            }}>
              {flow.sectorLabel}
            </span>
          </span>
        </div>

        {/* hover read — the "why it matters" line */}
        <div style={{
          maxHeight: hovered ? 90 : 0, overflow: 'hidden', opacity: hovered ? 1 : 0,
          transition: `max-height 320ms ${EASE}, opacity 260ms ${EASE}`,
        }}>
          <div style={{
            marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20,
          }}>
            <span style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.55, maxWidth: 760 }}>
              <span style={{
                fontSize: 9, fontFamily: MONO, fontWeight: 700, color: flow.statusColor,
                textTransform: 'uppercase', letterSpacing: '0.09em', marginRight: 10,
              }}>
                {flow.statusLabel} · {flow.date}
              </span>
              {flow.read}
            </span>
            <span style={{
              fontSize: 10, fontFamily: MONO, fontWeight: 700, color: flow.sectorColor,
              textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
            }}>
              Смотреть на карте →
            </span>
          </div>
        </div>
      </button>
    </Reveal>
  );
}

export default function CapitalFlowsHome({ onOpen }) {
  const [hoveredSector, setHoveredSector] = useState(null);
  const surges = SECTOR_SURGES.slice(0, 5);

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
      <Reveal>
        <SectionHeader
          eyebrow="Потоки капитала · эта неделя"
          title="Куда пошли деньги"
          sub="Пять ключевых сделок недели — корпорации, фонды и частные инвесторы. Каждая волна ниже — это сектор: чем выше волна, тем сильнее туда идёт капитал."
          accent="#38BDF8"
          actionLabel="Открыть карту потоков"
          onAction={onOpen}
        />
      </Reveal>

      {/* Sector wave field + surge chips */}
      <Reveal delay={80}>
        <div style={{ position: 'relative', height: 150, marginBottom: 6, overflow: 'hidden', borderRadius: 16 }}>
          <WaveField surges={surges} hovered={hoveredSector} onHover={setHoveredSector} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 30 }}>
          {surges.map((s) => (
            <SurgeChip
              key={s.key}
              surge={s}
              hovered={hoveredSector}
              onHover={setHoveredSector}
              onOpen={onOpen}
            />
          ))}
        </div>
      </Reveal>

      {/* Top-5 flows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {HOME_FLOWS.map((f, i) => (
          <FlowRow key={f.id} flow={f} index={i} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
