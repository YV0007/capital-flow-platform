// Legend overlay — the key to the visual encoding + interaction hints.
// Collapsible; open by default because the map is unreadable without it.

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GROUP_META, DEAL_TYPE_META } from '../../../data/capitalFlowData.js';

const MONO = 'ui-monospace, monospace';

export default function Legend({ counts }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      position: 'absolute', left: 14, bottom: 14, zIndex: 12,
      width: open ? 238 : 122,
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
        <div style={{ padding: '10px 11px 12px', maxHeight: 'min(430px, calc(100vh - 320px))', overflowY: 'auto' }}>
          <Section title="Colour = group">
            {Object.entries(GROUP_META).map(([k, v]) => (
              <Row key={k} label={v.label} count={counts.group?.[k]} title={v.blurb}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: v.color }} />
              </Row>
            ))}
          </Section>

          <Section title="Fill = role">
            <Row label="Receives capital" title="A destination for money.">
              <Disc filled color="#a1a1aa" />
            </Row>
            <Row label="Deploys capital" title="A source of money.">
              <Disc color="#a1a1aa" />
            </Row>
            <Row label="Does both" title="Deploys and receives — most of the AI stack.">
              <Disc filled ring color="#a1a1aa" />
            </Row>
          </Section>

          <Section title="Line = deal type">
            {Object.entries(DEAL_TYPE_META).map(([k, v]) => (
              <Row key={k} label={k} count={counts.dealType?.[k]} title={v.blurb}>
                <span style={{ width: 13, height: 2.5, borderRadius: 2, background: v.color }} />
              </Row>
            ))}
          </Section>

          <div style={{
            marginTop: 10, paddingTop: 9, borderTop: '1px solid #1c1d23',
            fontSize: 9, color: '#6b6b74', fontFamily: MONO, lineHeight: 1.65,
          }}>
            Circle size = total capital in + out.<br />
            Line thickness = deal size.<br />
            Arrow points the way the money goes.<br />
            <span style={{ color: '#8b8b93' }}>
              Click an entity → breakdown panel.<br />
              Click a line → deal detail.<br />
              Esc clears. Drag to pin a node.
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
      <span style={{ width: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
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

function Disc({ filled, ring, color }) {
  return (
    <span style={{ position: 'relative', width: 11, height: 11, display: 'inline-block' }}>
      <span style={{
        position: 'absolute', inset: ring ? 2 : 0,
        borderRadius: '50%',
        background: filled ? color : 'transparent',
        border: filled ? 'none' : `1.6px solid ${color}`,
      }} />
      {ring && (
        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid ${color}`, opacity: 0.6 }} />
      )}
    </span>
  );
}
