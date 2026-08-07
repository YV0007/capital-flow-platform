// Inline breakdown of a single flow (edge click). Floats over the canvas
// bottom-centre so the graph stays visible and interactive behind it.
//
// `rightInset` = px of canvas covered by the entity panel; the card centres
// itself in the REMAINING space so the two never overlap.

import { X, ArrowRight, ShieldCheck, Quote } from 'lucide-react';
import { fmtUSD } from './format.js';
import {
  EVENT_TYPE_META, STATUS_META, SOURCE_TIER_LABEL, SECTOR_META,
  GRADE_LETTER, GRADE_DIGIT, confidenceBand, composeRead,
} from '../../../data/capitalMap.js';

const MONO = 'ui-monospace, monospace';

export default function FlowDetailCard({ flow, sourceNode, targetNode, onClose, onOpenEntity, rightInset = 0 }) {
  if (!flow) return null;
  const et = EVENT_TYPE_META[flow.event_type] || { label: flow.event_type };
  const stat = STATUS_META[flow.status] || { label: flow.status, color: '#71717a' };
  const sec = flow.sector ? SECTOR_META[flow.sector] : null;
  const src = sourceNode?.name || flow.sourceId?.replace(/^alloc:/, '');
  const tgt = targetNode?.name || flow.targetId?.replace(/^target:/, '');
  const band = confidenceBand(flow.confidence);
  const note = flow.note;

  return (
    <div style={{
      position: 'absolute', left: `calc(50% - ${rightInset / 2}px)`, bottom: 16,
      transform: 'translateX(-50%)',
      zIndex: 20, width: `min(620px, calc(100% - ${rightInset + 60}px))`, minWidth: 320,
      background: 'rgba(12,12,15,0.97)',
      border: `1px solid ${flow.color}44`,
      borderRadius: 12,
      backdropFilter: 'blur(10px)',
      boxShadow: `0 24px 60px -18px rgba(0,0,0,0.95), 0 0 0 1px ${flow.color}18`,
      animation: 'cfmRise 200ms cubic-bezier(0.2,0.8,0.2,1)',
      transition: 'left 220ms cubic-bezier(0.2,0.8,0.2,1), width 220ms cubic-bezier(0.2,0.8,0.2,1)',
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

      {/* Facts strip — every chip reads in plain English. */}
      <div style={{
        display: 'flex', gap: 7, flexWrap: 'wrap',
        padding: '10px 14px', borderBottom: '1px solid #1c1c21',
      }}>
        <Tag color={flow.color}>{et.label}</Tag>
        {sec && <Tag color={sec.color}>{sec.label}</Tag>}
        <Tag color="#71717a">{flow.date}</Tag>
        <Tag color={stat.color} title={stat.blurb}>{stat.label}</Tag>
        {flow.confidence != null && (
          <Tag color={band.color} title="How well-sourced this flow is — see Confidence & source below.">
            {band.label} · {flow.confidence}/100
          </Tag>
        )}
      </div>

      {/* ── The read — WHY the capital moved. ─────────────────────────── */}
      <div style={{ padding: '13px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 7 }}>
          <Label style={{ marginBottom: 0 }}>The read</Label>
          {note?.angle && (
            <span style={{
              fontSize: 10.5, color: flow.color, fontFamily: MONO, fontWeight: 700,
              letterSpacing: '0.02em', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {note.angle}
            </span>
          )}
        </div>

        <div style={{
          position: 'relative', padding: '11px 13px 11px 15px',
          background: '#0E0F13', borderRadius: 9,
          border: '1px solid #1c1d23',
          overflow: 'hidden',
        }}>
          <span style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
            background: `linear-gradient(180deg, ${flow.color}, ${flow.color}22)`,
          }} />
          {note ? (
            <div style={{ fontSize: 12.5, color: '#d7d7dd', lineHeight: 1.68 }}>{note.read}</div>
          ) : (
            <div style={{ fontSize: 12.5, color: '#8b8b95', lineHeight: 1.68 }}>
              {composeRead(flow, sourceNode, targetNode)}
            </div>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, marginTop: 9,
            fontSize: 8.5, color: '#4a4a53', fontFamily: MONO, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            <Quote size={9} /> Our framing · not from the engine, not a quote
          </div>
        </div>

        {/* ── Confidence & source ─────────────────────────────────────── */}
        <Label style={{ marginTop: 15 }}>Confidence &amp; source</Label>

        {flow.confidence != null && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <ShieldCheck size={13} color={band.color} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: band.color }}>{band.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: band.color, fontFamily: MONO }}>
                {flow.confidence}<span style={{ color: '#52525b', fontSize: 10 }}>/100</span>
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 3, background: '#1c1c21', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${flow.confidence}%`, background: band.color, borderRadius: 3 }} />
            </div>
          </div>
        )}

        {/* Grade decoded — the letter and the digit each get their own line, so
            "C4" is never left as a bare code. */}
        {flow.grade && flow.grade.length >= 2 && (
          <div style={{
            padding: '9px 11px', background: '#0E0F13',
            border: '1px solid #1c1d23', borderRadius: 9, marginBottom: 10,
          }}>
            <div style={{
              fontSize: 8.5, color: '#4a4a53', fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.11em', marginBottom: 7,
            }}>
              Grade {flow.grade} — what the two characters mean
            </div>
            <GradePart char={flow.grade[0]} kind="Source" text={GRADE_LETTER[flow.grade[0]]} color={band.color} />
            <GradePart char={flow.grade[1]} kind="Corroboration" text={GRADE_DIGIT[flow.grade[1]]} color={band.color} last />
          </div>
        )}

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

// One decoded half of the Admiralty grade: "C — Source: quality press".
function GradePart({ char, kind, text, color, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9,
      paddingBottom: last ? 0 : 6, marginBottom: last ? 0 : 6,
      borderBottom: last ? 'none' : '1px solid #17181d',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
        background: color + '18', border: `1px solid ${color}44`,
        color, fontSize: 11, fontWeight: 800, fontFamily: MONO,
      }}>{char}</span>
      <span style={{
        fontSize: 9, color: '#52525b', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em', width: 92, flexShrink: 0,
      }}>{kind}</span>
      <span style={{ fontSize: 11.5, color: '#c4c4cb', lineHeight: 1.45 }}>{text || '—'}</span>
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
