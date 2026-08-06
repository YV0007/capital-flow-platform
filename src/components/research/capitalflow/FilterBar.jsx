// FilterDrawer — floating filter panel over the full-screen canvas.
// Sector · Class · Tier select entities; Event · Status · Min flow select
// flows (semantics live in CapitalFlowMap; this component is presentational).

import { X, RotateCcw } from 'lucide-react';
import {
  SECTOR_META, CLASS_META, TIER_META, FAMILY_META, STATUS_META,
} from '../../../data/capitalMap.js';
import { fmtUSD } from './format.js';

const MONO = 'ui-monospace, monospace';

export default function FilterDrawer({
  sectorsPresent,
  sectors, onToggleSector,
  classes, onToggleClass,
  tiers, onToggleTier,
  families, onToggleFamily,
  statuses, onToggleStatus,
  minAmount, onMinAmount, maxAmount,
  activeCount, onReset, onClose,
}) {
  // Only offer the sectors that are actually in the file this cycle.
  const sectorKeys = Object.keys(sectorsPresent || {})
    .sort((a, b) => (SECTOR_META[a]?.order ?? 99) - (SECTOR_META[b]?.order ?? 99));
  const allocClasses = Object.entries(CLASS_META).filter(([, v]) => v.side === 'allocator');
  const targetClasses = Object.entries(CLASS_META).filter(([, v]) => v.side === 'target');

  return (
    <div style={{
      position: 'absolute', top: 58, right: 16, zIndex: 32,
      width: 'min(440px, calc(100vw - 32px))',
      background: 'rgba(13,14,19,0.97)',
      border: '1px solid #26262e', borderRadius: 12,
      backdropFilter: 'blur(12px)',
      boxShadow: '0 24px 60px -16px rgba(0,0,0,0.9)',
      animation: 'cfmDrop 160ms ease-out',
      maxHeight: 'calc(100vh - 180px)', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px', borderBottom: '1px solid #1c1d23',
        position: 'sticky', top: 0, background: 'rgba(13,14,19,0.97)', zIndex: 1,
      }}>
        <span style={{ fontSize: 10, color: '#d4d4d8', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Filters
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={onReset} disabled={activeCount === 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', background: 'transparent',
              border: `1px solid ${activeCount ? '#3f3f46' : '#1c1d23'}`, borderRadius: 6,
              color: activeCount ? '#d4d4d8' : '#3f3f46',
              fontSize: 9, fontFamily: MONO, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              cursor: activeCount ? 'pointer' : 'default',
            }}>
            <RotateCcw size={10} /> Reset
          </button>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 2, lineHeight: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Sector */}
        <div>
          <GroupLabel>Sector · targets</GroupLabel>
          <ChipWrap>
            {sectorKeys.map(k => {
              const s = sectorsPresent[k];
              const meta = SECTOR_META[k] || {};
              return (
                <Chip key={k} on={sectors.has(k)} color={meta.color || '#71717a'}
                  title={`${s.deals} deals · ${fmtUSD(s.capital)}${s.lit ? ' · signal firing' : ''}`}
                  onClick={() => onToggleSector(k)}>
                  {s.lit && <span style={{ color: '#FBBF24', marginRight: -1 }}>◆</span>}
                  {meta.label || k}
                </Chip>
              );
            })}
          </ChipWrap>
        </div>

        {/* Class */}
        <div>
          <GroupLabel>Allocator class · entities</GroupLabel>
          <ChipWrap>
            {allocClasses.map(([k, v]) => (
              <Chip key={k} on={classes.has(k)} color={v.color} onClick={() => onToggleClass(k)}>
                {v.label}
              </Chip>
            ))}
          </ChipWrap>
          <div style={{ height: 8 }} />
          <GroupLabel>Target class · entities</GroupLabel>
          <ChipWrap>
            {targetClasses.map(([k, v]) => (
              <Chip key={k} on={classes.has(k)} color={v.color} square onClick={() => onToggleClass(k)}>
                {v.label}
              </Chip>
            ))}
          </ChipWrap>
        </div>

        {/* Tier */}
        <div>
          <GroupLabel>Allocator tier · entities</GroupLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {Object.entries(TIER_META).map(([k, t]) => {
              const on = tiers.has(k);
              return (
                <button key={k} onClick={() => onToggleTier(k)} title={t.blurb}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 10px',
                    background: on ? hexA(t.color, 0.1) : '#12131a',
                    border: `1px solid ${on ? hexA(t.color, 0.5) : '#22232b'}`,
                    borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 130ms',
                  }}>
                  <span style={{ fontSize: 9, color: t.color, fontFamily: MONO, fontWeight: 800, width: 40, flexShrink: 0 }}>{t.short}</span>
                  <span style={{ fontSize: 11.5, color: on ? '#fafafa' : '#c4c4cb', fontWeight: 600, flex: 1 }}>{t.label}</span>
                  <span style={{ fontSize: 9, color: t.color, letterSpacing: 1 }}>{t.stars}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Event family */}
        <div>
          <GroupLabel>Event type · flows</GroupLabel>
          <ChipWrap>
            {Object.entries(FAMILY_META).map(([k, v]) => (
              <Chip key={k} on={families.has(k)} color={v.color} square onClick={() => onToggleFamily(k)}>
                {v.label}
              </Chip>
            ))}
          </ChipWrap>
        </div>

        {/* Status */}
        <div>
          <GroupLabel>Confidence · flows</GroupLabel>
          <ChipWrap>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <Chip key={k} on={statuses.has(k)} color={v.color} title={v.blurb} onClick={() => onToggleStatus(k)}>
                {v.label}
              </Chip>
            ))}
          </ChipWrap>
        </div>

        {/* Min amount */}
        <div>
          <GroupLabel>Minimum flow size</GroupLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="range" min={0} max={100} value={amountToSlider(minAmount, maxAmount)}
              onChange={(e) => onMinAmount(sliderToAmount(+e.target.value, maxAmount))}
              style={{ flex: 1, accentColor: '#38BDF8', height: 3, cursor: 'pointer' }}
            />
            <span style={{
              fontSize: 11, fontFamily: MONO, fontWeight: 700,
              color: minAmount > 0 ? '#38BDF8' : '#52525b',
              minWidth: 52, textAlign: 'right',
            }}>
              {minAmount > 0 ? `≥ ${fmtUSD(minAmount)}` : 'all'}
            </span>
          </div>
        </div>

        <div style={{ fontSize: 9, color: '#5b5b64', fontFamily: MONO, lineHeight: 1.6, borderTop: '1px solid #1c1d23', paddingTop: 10 }}>
          Sector, class and tier pick <span style={{ color: '#a1a1aa' }}>entities</span> — their counterparties stay visible so you can follow the money.
          Event, confidence and min size pick <span style={{ color: '#a1a1aa' }}>flows</span>.
          Undisclosed-amount flows drop out once a minimum is set.
        </div>
      </div>
    </div>
  );
}

function GroupLabel({ children }) {
  return (
    <div style={{
      fontSize: 8.5, color: '#5b5b64', fontFamily: MONO, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: 7,
    }}>{children}</div>
  );
}

function ChipWrap({ children }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>;
}

function Chip({ children, on, color, title, square, onClick }) {
  return (
    <button onClick={onClick} title={title || ''}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 9px',
        background: on ? hexA(color, 0.13) : '#12131a',
        border: `1px solid ${on ? hexA(color, 0.55) : '#22232b'}`,
        borderRadius: 20,
        color: on ? color : '#8b8b93',
        fontSize: 10, fontFamily: MONO, fontWeight: 600,
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'all 130ms',
      }}
      onMouseEnter={(e) => { if (!on) { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#d4d4d8'; } }}
      onMouseLeave={(e) => { if (!on) { e.currentTarget.style.borderColor = '#22232b'; e.currentTarget.style.color = '#8b8b93'; } }}>
      <span style={{
        width: 6, height: 6, flexShrink: 0,
        borderRadius: square ? 2 : '50%',
        background: color, opacity: on ? 1 : 0.5,
      }} />
      {children}
    </button>
  );
}

// Log-ish slider mapping so the low end (millions) stays reachable.
function sliderToAmount(v, max) {
  if (v <= 0) return 0;
  const min = 1e6;
  return Math.round(min * Math.pow(max / min, v / 100));
}
function amountToSlider(amount, max) {
  if (!amount || amount <= 0) return 0;
  const min = 1e6;
  return Math.round(100 * Math.log(amount / min) / Math.log(max / min));
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
