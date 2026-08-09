// Inline breakdown of a single flow (edge click). Floats over the canvas
// bottom-centre so the graph stays visible and interactive behind it.
//
// The map is already a dense object — this card must not add to the load. It
// answers four questions in one glance and stops:
//   how much · between whom · when · how much do we trust it
// Everything that is commentary rather than fact (our written read) sits
// behind one disclosure button, so the default state stays scannable.
//
// `rightInset` = px of canvas covered by the entity panel; the card centres
// itself in the REMAINING space so the two never overlap.

import { useState } from 'react';
import { X, ArrowRight, ChevronDown, ChevronRight, ExternalLink, Quote } from 'lucide-react';
import { fmtUSD } from './format.js';
import {
  EVENT_TYPE_META, STATUS_META, SOURCE_TIER_LABEL, SECTOR_META,
  GRADE_LETTER, GRADE_DIGIT, confidenceBand, composeRead, META,
} from '../../../data/capitalMap.js';

const MONO = 'ui-monospace, monospace';

// Age of the deal measured against the PAYLOAD date, not wall clock — the file
// is a snapshot, so "13d" has to mean 13 days of data.
function ageDays(date, generated) {
  if (!date || !generated) return null;
  const a = new Date(`${date}T00:00:00Z`), b = new Date(`${generated}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  const d = Math.round((b - a) / 86400000);
  return d >= 0 ? d : null;
}

export default function FlowDetailCard({ flow, sourceNode, targetNode, onClose, onOpenEntity, rightInset = 0 }) {
  const [readOpen, setReadOpen] = useState(false);
  if (!flow) return null;

  const et = EVENT_TYPE_META[flow.event_type] || { label: flow.event_type };
  const stat = STATUS_META[flow.status] || { label: flow.status, color: '#71717a' };
  const sec = flow.sector ? SECTOR_META[flow.sector] : null;
  const src = sourceNode?.name || flow.sourceId?.replace(/^alloc:/, '');
  const tgt = targetNode?.name || flow.targetId?.replace(/^target:/, '');
  const band = confidenceBand(flow.confidence);
  const note = flow.note;
  const age = ageDays(flow.date, META.generated);

  // Source links arrive from the engine when it has them (a `sources` array or
  // a single `url`). We never synthesise one — an unsourced flow says so.
  const links = Array.isArray(flow.sources) ? flow.sources.filter(s => s && s.url)
    : flow.url ? [{ url: flow.url, label: 'Source' }] : [];

  // The grade decoded into plain English, joined with the status — one line
  // that carries what used to be two boxes.
  const gradeBits = [];
  if (flow.grade && flow.grade.length >= 2) {
    if (GRADE_LETTER[flow.grade[0]]) gradeBits.push(GRADE_LETTER[flow.grade[0]]);
    if (GRADE_DIGIT[flow.grade[1]]) gradeBits.push(GRADE_DIGIT[flow.grade[1]]);
  }

  return (
    <div style={{
      position: 'absolute', left: `calc(50% - ${rightInset / 2}px)`, bottom: 16,
      transform: 'translateX(-50%)',
      zIndex: 20, width: `min(600px, calc(100% - ${rightInset + 60}px))`, minWidth: 320,
      background: 'rgba(12,12,15,0.97)',
      border: `1px solid ${flow.color}44`,
      borderRadius: 12,
      backdropFilter: 'blur(10px)',
      boxShadow: `0 24px 60px -18px rgba(0,0,0,0.95), 0 0 0 1px ${flow.color}18`,
      animation: 'cfmRise 200ms cubic-bezier(0.2,0.8,0.2,1)',
      transition: 'left 220ms cubic-bezier(0.2,0.8,0.2,1), width 220ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* ── How much, between whom ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px 12px',
      }}>
        <div style={{
          fontSize: 22, fontWeight: 700, color: flow.disclosed ? '#fafafa' : '#71717a',
          letterSpacing: '-0.02em', fontFamily: MONO, flexShrink: 0, lineHeight: 1,
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

      {/* ── What kind of deal, where, when ─────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center',
        padding: '0 14px 12px',
      }}>
        <Tag color={flow.color}>{et.label}</Tag>
        {sec && <Tag color={sec.color}>{sec.label}</Tag>}
        <Tag color="#8b95a8"
          title={age != null ? `${age} day${age === 1 ? '' : 's'} before the payload date (${META.generated})` : undefined}>
          {flow.date}{age != null ? ` · ${age}d` : ''}
        </Tag>
      </div>

      {/* ── How much we trust it ───────────────────────────────────────── */}
      <div style={{ padding: '11px 14px 12px', borderTop: '1px solid #1c1c21' }}>
        {flow.confidence != null ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 8.5, color: '#52525b', fontFamily: MONO, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0,
              }}>
                Confidence
              </span>
              <span style={{ flex: 1, height: 4, borderRadius: 3, background: '#1c1c21', overflow: 'hidden', minWidth: 40 }}>
                <span style={{ display: 'block', height: '100%', width: `${flow.confidence}%`, background: band.color, borderRadius: 3 }} />
              </span>
              <span title={band.label} style={{ fontSize: 13, fontWeight: 700, color: band.color, fontFamily: MONO, flexShrink: 0, cursor: 'help' }}>
                {flow.confidence}<span style={{ color: '#52525b', fontSize: 10 }}>/100</span>
              </span>
            </div>

            {/* Grade + status decoded, one line — no bare codes anywhere. */}
            <div style={{ marginTop: 7, fontSize: 11, color: '#8b8b95', fontFamily: MONO, lineHeight: 1.6 }}>
              {gradeBits.map((t, i) => (
                <span key={i}>
                  {i > 0 && <span style={{ color: '#3f3f46' }}> · </span>}
                  {t}
                </span>
              ))}
              {gradeBits.length > 0 && <span style={{ color: '#3f3f46' }}> · </span>}
              <span title={stat.blurb} style={{ color: stat.color, cursor: 'help' }}>{stat.label}</span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: '#6b6b74', fontFamily: MONO, fontStyle: 'italic' }}>
            Not scored by the engine — treat as unweighted.
          </div>
        )}

        {/* Where it came from + the link, when the payload carries one. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
          <span style={{ fontSize: 10.5, color: '#71717a', fontFamily: MONO }}>
            {SOURCE_TIER_LABEL[flow.sourceTier] || `Source tier ${flow.sourceTier}`}
          </span>
          <span style={{ flex: 1 }} />
          {links.length > 0
            ? links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" title={l.url}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 9px', background: '#141418',
                    border: '1px solid #26262c', borderRadius: 6,
                    color: '#8fb3cf', fontSize: 10, fontFamily: MONO, fontWeight: 600,
                    textDecoration: 'none', flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3f9bd6')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#26262c')}>
                  {l.label || 'Source'} <ExternalLink size={9} style={{ opacity: 0.6 }} />
                </a>
              ))
            : (
              <span title="The engine grades each flow's sourcing but does not yet emit the source URLs. Shown as missing rather than guessed."
                style={{ fontSize: 10, color: '#4a4a53', fontFamily: MONO, cursor: 'help' }}>
                no source link in payload
              </span>
            )}
        </div>
      </div>

      {/* ── Our read — commentary, so it stays folded by default ───────── */}
      <div style={{ borderTop: '1px solid #1c1c21' }}>
        <button onClick={() => setReadOpen(o => !o)}
          title={readOpen ? 'Hide our read' : 'Our written read on why this capital moved'}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, width: '100%',
            padding: '9px 14px', background: 'transparent', border: 'none',
            cursor: 'pointer', textAlign: 'left',
            color: readOpen ? '#d4d4d8' : '#8b8b95',
            fontSize: 10, fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            borderRadius: '0 0 12px 12px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = readOpen ? '#d4d4d8' : '#8b8b95')}>
          {readOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          The read
          {note?.angle && !readOpen && (
            <span style={{
              color: flow.color, fontWeight: 600, textTransform: 'none', letterSpacing: 0,
              minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              · {note.angle}
            </span>
          )}
        </button>

        {readOpen && (
          <div style={{ padding: '0 14px 13px' }}>
            {note?.angle && (
              <div style={{
                fontSize: 10.5, color: flow.color, fontFamily: MONO, fontWeight: 700, marginBottom: 7,
              }}>
                {note.angle}
              </div>
            )}
            <div style={{
              position: 'relative', padding: '11px 13px 11px 15px',
              background: '#0E0F13', borderRadius: 9, border: '1px solid #1c1d23', overflow: 'hidden',
            }}>
              <span style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
                background: `linear-gradient(180deg, ${flow.color}, ${flow.color}22)`,
              }} />
              <div style={{ fontSize: 12.5, color: note ? '#d7d7dd' : '#8b8b95', lineHeight: 1.68 }}>
                {note ? note.read : composeRead(flow, sourceNode, targetNode)}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5, marginTop: 9,
                fontSize: 8.5, color: '#4a4a53', fontFamily: MONO, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                <Quote size={9} /> Our framing · not from the engine, not a quote
              </div>
            </div>
          </div>
        )}
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
