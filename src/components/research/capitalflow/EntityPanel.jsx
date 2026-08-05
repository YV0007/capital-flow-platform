// Slide-in right panel — the distribution breakdown for one entity.
// Answers: who puts money in here, how much, in what form, and where does
// this entity's own money go. The graph stays live underneath.

import { X, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { fmtUSD, CONFIDENCE_META, STATUS_META } from './format.js';
import { GROUP_META, TIER_META } from '../../../data/capitalFlowData.js';

const MONO = 'ui-monospace, monospace';
const W = 380;

export default function EntityPanel({
  node, inbound, outbound, nodeById,
  selectedFlowId, onSelectFlow, onOpenEntity, onClose,
}) {
  if (!node) return null;
  const grp = GROUP_META[node.group];
  const tier = node.tier ? TIER_META[node.tier] : null;
  const role = node.type === 'both' ? 'Deploys & receives capital'
    : node.type === 'player' ? 'Deploys capital' : 'Receives capital';

  return (
    <aside style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: W, zIndex: 25,
      background: 'rgba(10,10,12,0.985)',
      borderLeft: '1px solid #24242a',
      backdropFilter: 'blur(10px)',
      boxShadow: '-24px 0 60px -20px rgba(0,0,0,0.9)',
      display: 'flex', flexDirection: 'column',
      animation: 'cfmSlide 220ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid #1c1c21', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%', background: node.color,
            marginTop: 6, flexShrink: 0,
            boxShadow: `0 0 12px ${node.color}80`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
              {node.name}
            </div>
            <div style={{ fontSize: 10, color: '#71717a', fontFamily: MONO, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {grp?.label || node.group} · {node.sector}
            </div>
          </div>
          <button onClick={onClose} title="Close panel"
            style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 3, lineHeight: 0, flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-block', padding: '3px 8px',
            background: '#16161a', border: '1px solid #26262c', borderRadius: 5,
            fontSize: 9, color: '#a1a1aa', fontFamily: MONO, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{role}</span>
          {tier && (
            <span title={tier.blurb} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
              background: tier.color + '12', border: `1px solid ${tier.color}38`, borderRadius: 5,
              fontSize: 9, color: tier.color, fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}>{tier.short} · {tier.label} <span style={{ letterSpacing: 1 }}>{tier.stars}</span></span>
          )}
          {node.tier == null && node.watchlist && (
            <span title="On the watchlist but not yet tier-assigned in the research spec" style={{
              display: 'inline-block', padding: '3px 8px',
              background: '#16161a', border: '1px dashed #33343c', borderRadius: 5,
              fontSize: 9, color: '#71717a', fontFamily: MONO, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}>Tier — TBD</span>
          )}
        </div>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 28px' }}>
        {/* Totals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Stat label="Capital in" value={fmtUSD(node.totalInflow)} sub={`${node.inflowCount} flow${node.inflowCount === 1 ? '' : 's'}`} color="#34D399" />
          <Stat label="Capital out" value={fmtUSD(node.totalOutflow)} sub={`${node.outflowCount} flow${node.outflowCount === 1 ? '' : 's'}`} color="#F59E0B" />
        </div>

        <Section title="What this node is">
          <div style={{ fontSize: 12.5, color: '#c4c4cb', lineHeight: 1.62 }}>
            {node.description}
          </div>
        </Section>

        {inbound.length > 0 && (
          <Section title={`Who invests here · ${fmtUSD(node.totalInflow)}`} icon={<ArrowDownLeft size={11} color="#34D399" />}>
            <FlowList
              flows={inbound} total={node.totalInflow} counterpartyKey="sourceId"
              nodeById={nodeById} selectedFlowId={selectedFlowId}
              onSelectFlow={onSelectFlow} onOpenEntity={onOpenEntity} accent="#34D399"
            />
          </Section>
        )}

        {outbound.length > 0 && (
          <Section title={`Where its money goes · ${fmtUSD(node.totalOutflow)}`} icon={<ArrowUpRight size={11} color="#F59E0B" />}>
            <FlowList
              flows={outbound} total={node.totalOutflow} counterpartyKey="targetId"
              nodeById={nodeById} selectedFlowId={selectedFlowId}
              onSelectFlow={onSelectFlow} onOpenEntity={onOpenEntity} accent="#F59E0B"
            />
          </Section>
        )}

        {inbound.length === 0 && outbound.length === 0 && (
          <div style={{ fontSize: 11, color: '#52525b', fontFamily: MONO, fontStyle: 'italic' }}>
            No flows recorded yet for this entity.
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Ranked flow list with share bars ────────────────────────────────────
function FlowList({ flows, total, counterpartyKey, nodeById, selectedFlowId, onSelectFlow, onOpenEntity, accent }) {
  const max = Math.max(...flows.map(f => f.amountUSD), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {flows.map(f => {
        const cp = nodeById.get(f[counterpartyKey]);
        const share = total > 0 ? (f.amountUSD / total) * 100 : 0;
        const on = f.id === selectedFlowId;
        const conf = CONFIDENCE_META[f.confidence] || CONFIDENCE_META.estimate;
        const stat = STATUS_META[f.status] || STATUS_META.Active;
        return (
          <button key={f.id} onClick={() => onSelectFlow(f.id)}
            style={{
              position: 'relative', display: 'block', width: '100%', textAlign: 'left',
              padding: '8px 10px', borderRadius: 8,
              background: on ? '#17171c' : '#0F0F13',
              border: `1px solid ${on ? f.color + '66' : '#1e1e23'}`,
              cursor: 'pointer', overflow: 'hidden',
              transition: 'border-color 130ms, background 130ms',
            }}
            onMouseEnter={(e) => { if (!on) e.currentTarget.style.borderColor = '#33333a'; }}
            onMouseLeave={(e) => { if (!on) e.currentTarget.style.borderColor = '#1e1e23'; }}>
            {/* share bar */}
            <span style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${(f.amountUSD / max) * 100}%`,
              background: `linear-gradient(90deg, ${f.color}1f, ${f.color}05)`,
              pointerEvents: 'none',
            }} />
            <span style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                onClick={(e) => { e.stopPropagation(); if (cp) onOpenEntity(cp.id); }}
                title={cp ? `Open ${cp.name}` : ''}
                style={{
                  fontSize: 12, fontWeight: 600, color: '#e4e4e7',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1, minWidth: 0, textDecoration: 'underline', textDecorationColor: '#2f2f36',
                  textUnderlineOffset: 3,
                }}>
                {cp ? cp.name : f[counterpartyKey]}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fafafa', fontFamily: MONO, flexShrink: 0 }}>
                {fmtUSD(f.amountUSD)}
              </span>
              <span style={{ fontSize: 9.5, color: accent, fontFamily: MONO, flexShrink: 0, minWidth: 34, textAlign: 'right' }}>
                {share >= 1 ? Math.round(share) : share.toFixed(1)}%
              </span>
            </span>
            <span style={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 5, fontSize: 9.5, fontFamily: MONO,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: f.color, flexShrink: 0 }} />
              <span style={{ color: '#a1a1aa' }}>{f.dealType}</span>
              <span style={{ color: '#3f3f46' }}>·</span>
              <span style={{ color: '#71717a' }}>{f.date}</span>
              <span style={{ flex: 1 }} />
              <span style={{ color: stat.color }}>{f.status}</span>
              <span style={{ color: conf.color, opacity: 0.75 }} title={conf.blurb}>{conf.label[0]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
        fontSize: 9, color: '#6b6b74', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {icon}{title}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, color }) {
  return (
    <div style={{
      padding: '9px 11px', background: '#0F0F13',
      border: '1px solid #1e1e23', borderRadius: 9,
    }}>
      <div style={{ fontSize: 8.5, color: '#52525b', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color, fontFamily: MONO, marginTop: 4, letterSpacing: '-0.01em' }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: '#52525b', fontFamily: MONO, marginTop: 2 }}>{sub}</div>
    </div>
  );
}
