// Legend overlay — the key to the visual encoding + interaction hints.
// Collapsible; the left column of the map lives behind it, so closed by
// default.

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SECTOR_META, FAMILY_META, STATUS_META } from '../../../data/capitalMap.js';

const MONO = 'ui-monospace, monospace';

export default function Legend({ counts }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      position: 'absolute', left: 14, bottom: 14, zIndex: 12,
      width: open ? 248 : 122,
      background: 'rgba(13,14,19,0.94)',
      border: '1px solid #24242c', borderRadius: 10,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 16px 40px -16px rgba(0,0,0,0.9)',
      overflow: 'hidden',
      transition: 'width 180ms',
    }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '8px 11px', background: 'transparent',
          border: 'none', borderBottom: open ? '1px solid #1c1d23' : 'none',
          cursor: 'pointer', color: '#d4d4d8',
          fontSize: 9.5, fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>
        Legend
        {open ? <ChevronDown size={12} color="#52525b" /> : <ChevronUp size={12} color="#52525b" />}
      </button>

      {open && (
        <div style={{ padding: '10px 11px 12px', maxHeight: 'min(460px, calc(100vh - 300px))', overflowY: 'auto' }}>
          <Section title="Zone = sector">
            {Object.entries(SECTOR_META)
              .sort((a, b) => a[1].order - b[1].order)
              .filter(([k]) => counts.sector?.[k])
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts.sector?.[k]}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: v.color }} />
                </Row>
              ))}
          </Section>

          <Section title="Dot = role">
            <Row label="Target · receives"><Disc filled color="#a1a1aa" /></Row>
            <Row label="Allocator · deploys"><Disc color="#a1a1aa" /></Row>
          </Section>

          <Section title="Line = event type">
            {Object.entries(FAMILY_META).map(([k, v]) => (
              <Row key={k} label={v.label} count={counts.family?.[k]}>
                <span style={{ width: 13, height: 2.5, borderRadius: 2, background: v.color }} />
              </Row>
            ))}
          </Section>

          <Section title="Line style = confidence">
            {Object.entries(STATUS_META).map(([k, v]) => (
              <Row key={k} label={v.label} title={v.blurb}>
                <span style={{
                  width: 15, height: 0, borderTop: `2px ${v.dash ? 'dashed' : 'solid'} #a1a1aa`,
                }} />
              </Row>
            ))}
          </Section>

          <div style={{
            marginTop: 10, paddingTop: 9, borderTop: '1px solid #1c1d23',
            fontSize: 9, color: '#6b6b74', fontFamily: MONO, lineHeight: 1.65,
          }}>
            Block size = capital.<br />
            Capsule = allocator / fund · block = company<br />
            · sharp plate = physical asset.<br />
            <span style={{ color: '#FBBF24' }}>◆</span> dot / bright frame = signal firing.<br />
            Dashed &amp; faded block = cooled (180d idle).<br />
            Line thickness = deal size · arrow = direction.<br />
            <span style={{ color: '#8b8b93' }}>
              Click a block → breakdown panel.<br />
              Click a line → deal detail.<br />
              Esc clears the selection.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{
        fontSize: 8.5, color: '#5b5b64', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6,
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>{children}</div>
    </div>
  );
}

function Row({ label, count, title, children }) {
  return (
    <div title={title} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: title ? 'help' : 'default' }}>
      <span style={{ width: 15, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
        {children}
      </span>
      <span style={{ fontSize: 10, color: '#a1a1aa', fontFamily: MONO, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      {count != null && (
        <span style={{ fontSize: 9, color: '#52525b', fontFamily: MONO }}>{count}</span>
      )}
    </div>
  );
}

function Disc({ filled, color }) {
  return (
    <span style={{ position: 'relative', width: 11, height: 11, display: 'inline-block' }}>
      <span style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        background: filled ? color : 'transparent',
        border: filled ? 'none' : `1.6px solid ${color}`,
      }} />
    </span>
  );
}
