// Inline breakdown of a single flow (edge click). Floats over the canvas
// bottom-centre so the graph stays visible and interactive behind it.

import { X, ArrowRight } from 'lucide-react';
import { fmtUSD } from './format.js';
import {
  EVENT_TYPE_META, STATUS_META, SOURCE_TIER_LABEL, SECTOR_META,
} from '../../../data/capitalMap.js';

const MONO = 'ui-monospace, monospace';

export default function FlowDetailCard({ flow, sourceNode, targetNode, onClose, onOpenEntity }) {
  if (!flow) return null;
  const et = EVENT_TYPE_META[flow.event_type] || { label: flow.event_type };
  const stat = STATUS_META[flow.status] || { label: flow.status, color: '#71717a' };
  const sec = flow.sector ? SECTOR_META[flow.sector] : null;
  const src = sourceNode?.name || flow.sourceId?.replace(/^alloc:/, '');
  const tgt = targetNode?.name || flow.targetId?.replace(/^target:/, '');

  return (
    <div style={{
      position: 'absolute', left: '50%', bottom: 16, transform: 'translateX(-50%)',
      zIndex: 20, width: 'min(620px, calc(100% - 300px))', minWidth: 340,
      background: 'rgba(12,12,15,0.97)',
      border: `1px solid ${flow.color}44`,
      borderRadius: 12,
      backdropFilter: 'blur(10px)',
      boxShadow: `0 24px 60px -18px rgba(0,0,0,0.95), 0 0 0 1px ${flow.color}18`,
      animation: 'cfmRise 200ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* Header — the flow itself */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderBottom: '1px solid #1c1c21',
      }}>
        <div style={{
          fontSize: 21, fontWeight: 700, color: flow.disclosed ? '#fafafa' : '#71717a',
          letterSpacing: '-0.02em', fontFamily: MONO, flexShrink: 0,
        }}>
          {flow.disclosed ? fmtUSD(flow.amount) : 'Undisclosed'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
          <EntityChip node={sourceNode} fallback={src} onClick={onOpenEntity} />
          <ArrowRight size={13} color={flow.color} style={{ flexShrink: 0 }} />
          <EntityChip node={targetNode} fallback={tgt} onClick={onOpenEntity} />
        </div>

        <button onClick={onClose} title="Close"
          style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 3, lineHeight: 0, flexShrink: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}>
          <X size={15} />
        </button>
      </div>

      {/* Facts strip */}
      <div style={{
        display: 'flex', gap: 7, flexWrap: 'wrap',
        padding: '10px 14px', borderBottom: '1px solid #1c1c21',
      }}>
        <Tag color={flow.color}>{et.label}</Tag>
        {sec && <Tag color={sec.color}>{sec.label}</Tag>}
        <Tag color="#71717a">{flow.date}</Tag>
        <Tag color={stat.color} title={stat.blurb}>{stat.label}</Tag>
      </div>

      {/* Provenance */}
      <div style={{ padding: '12px 14px' }}>
        <Label>What this flow is</Label>
        <div style={{ fontSize: 12.5, color: '#d4d4d8', lineHeight: 1.6 }}>
          {src} {et.label.toLowerCase()} into {tgt}
          {sec ? ` — ${sec.label} sector` : ''}.
          {' '}This edge is the engine's record of one allocator's participation; a single deal
          can appear as several edges when multiple allocators join the same round.
        </div>

        <Label style={{ marginTop: 13 }}>Confidence &amp; source</Label>
        <div style={{ fontSize: 11.5, color: '#a1a1aa', fontFamily: MONO, lineHeight: 1.7 }}>
          <span style={{ color: stat.color }}>{stat.short || flow.status}</span>
          <span style={{ color: '#3f3f46' }}> — </span>{stat.blurb || ''}
          <br />
          <span style={{ color: '#71717a' }}>{SOURCE_TIER_LABEL[flow.sourceTier] || `Source tier ${flow.sourceTier}`}</span>
        </div>
      </div>
    </div>
  );
}

function EntityChip({ node, fallback, onClick }) {
  const name = node?.name || fallback;
  if (!name) return null;
  const color = node?.color || '#71717a';
  return (
    <button onClick={() => node && onClick(node.id)} title={node ? `Open ${node.name}` : ''}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 9px', background: '#141418',
        border: '1px solid #26262c', borderRadius: 7,
        cursor: node ? 'pointer' : 'default', minWidth: 0, maxWidth: 190,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color + '80')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#26262c')}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{
        fontSize: 11.5, color: '#e4e4e7', fontWeight: 600,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{name}</span>
    </button>
  );
}

function Tag({ children, color, title }) {
  return (
    <span title={title} style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 8px', borderRadius: 5,
      background: color + '14', border: `1px solid ${color}33`,
      color, fontSize: 9.5, fontFamily: MONO, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.07em',
      cursor: title ? 'help' : 'default',
    }}>{children}</span>
  );
}

function Label({ children, style }) {
  return (
    <div style={{
      fontSize: 8.5, color: '#52525b', fontFamily: MONO, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: 6, ...style,
    }}>{children}</div>
  );
}
