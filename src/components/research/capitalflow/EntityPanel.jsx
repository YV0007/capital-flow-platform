// Slide-in right panel — the distribution breakdown for one entity.
// Answers: who puts money in here (targets) or where this allocator's money
// goes, how much, in what form, at what confidence. The graph stays live
// underneath.

import { X, ArrowDownLeft, ArrowUpRight, Globe, ExternalLink, Search, Linkedin, Building2, Users, ChevronRight, FileText, Newspaper } from 'lucide-react';
import { fmtUSD } from './format.js';
import {
  SECTOR_META, CLASS_META, TIER_META, NETWORK_META, confidenceBand,
} from '../../../data/capitalMap.js';
import { WatchlistMenu } from './WatchlistControl.jsx';

const MONO = 'ui-monospace, monospace';
const W = 380;

// Sum of a flow list when at least one amount is disclosed — else null, so the
// UI can say "undisclosed" instead of a misleading $0.
function totalOrNull(flows, total) {
  return flows.some(f => f.disclosed) ? fmtUSD(total) : 'undisclosed';
}

export default function EntityPanel({
  node, inbound, outbound, nodeById,
  selectedFlowId, onSelectFlow, onOpenEntity, onClose, onDeepDive, wl, topInset = 0,
}) {
  if (!node) return null;
  const cls = CLASS_META[node.cls];
  const sec = node.sector ? SECTOR_META[node.sector] : null;
  const tier = node.tier ? TIER_META[node.tier] : null;
  const role = node.kind === 'allocator' ? 'Allocator · deploys capital' : 'Target · receives capital';
  const isAllocator = node.kind === 'allocator';

  return (
    <aside style={{
      position: 'absolute', top: topInset, right: 0, bottom: 0, width: W, zIndex: 25,
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
              {cls?.label || node.cls}{sec ? ` · ${sec.label}` : ''}
            </div>
          </div>
          {wl && <WatchlistMenu wl={wl} entityId={node.id} />}
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
          {node.country && (
            <span title={`National capital source — ${node.countryLabel || node.country.toUpperCase()}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px',
              background: '#16161a', border: '1px solid #26262c', borderRadius: 5,
              fontSize: 9, color: '#a1a1aa', fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}>
              <img src={`/flags/${node.country}.png`} alt="" style={{ width: 14, height: 'auto', borderRadius: 2, display: 'block' }} />
              {node.countryLabel || node.country.toUpperCase()}
            </span>
          )}
          {node.network && (
            <span title={`Member of the ${NETWORK_META[node.network]?.label || node.network} network`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
              background: (NETWORK_META[node.network]?.color || '#F5B942') + '18',
              border: `1px solid ${(NETWORK_META[node.network]?.color || '#F5B942')}55`, borderRadius: 5,
              fontSize: 9, color: NETWORK_META[node.network]?.color || '#F5B942', fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}><Users size={10} /> {NETWORK_META[node.network]?.label || node.network}</span>
          )}
          {node.stale && (
            <span title="No activity in 180 days — cooled off, kept in memory." style={{
              display: 'inline-block', padding: '3px 8px',
              background: '#16161a', border: '1px dashed #33343c', borderRadius: 5,
              fontSize: 9, color: '#94A3B8', fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}>Cooled · 180d idle</span>
          )}
          {node.watchOnly && (
            <span title="Only candidate (unconfirmed) flows so far — kept off the main map by default." style={{
              display: 'inline-block', padding: '3px 8px',
              background: '#16161a', border: '1px dashed #33343c', borderRadius: 5,
              fontSize: 9, color: '#71717a', fontFamily: MONO, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}>Watch · unconfirmed</span>
          )}
        </div>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 28px' }}>
        {/* Profile — who/what this is + official link(s) */}
        <ProfileBlock node={node} />

        {/* Deep-dive — allocators only: background, decision logic, track
            record, strategy. Companies (targets) keep the standard panel. */}
        {isAllocator && onDeepDive && (
          <button onClick={() => onDeepDive(node.id)}
            title="Expanded allocator breakdown — background, latest investments, track record, strategy"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              width: '100%', padding: '9px 12px', marginBottom: 14,
              background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.3)',
              borderRadius: 9, color: '#38BDF8', fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
              transition: 'all 130ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56,189,248,0.13)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(56,189,248,0.07)'; }}>
            Detailed breakdown <ChevronRight size={12} />
          </button>
        )}

        {/* Totals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {/* capital 0 with deals on file = every amount undisclosed, not zero */}
          <Stat
            label="Capital"
            value={node.capital > 0 ? fmtUSD(node.capital) : node.degree > 0 ? '—' : '$0'}
            sub={node.capital > 0 ? (isAllocator ? 'deployed' : 'received') : node.degree > 0 ? 'amounts undisclosed' : 'nothing tracked'}
            color={node.capital > 0 ? (isAllocator ? '#C2A36B' : '#82B98D') : '#71717a'}
          />
          <Stat label="Deals" value={String(node.deals)} sub={`${node.degree} flow${node.degree === 1 ? '' : 's'} tracked`} color="#e4e4e7" />
        </div>

        {/* Activity window */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          padding: '8px 11px', background: '#0F0F13', border: '1px solid #1e1e23', borderRadius: 9,
          fontSize: 10, fontFamily: MONO,
        }}>
          <span style={{ color: '#52525b' }}>ACTIVE</span>
          <span style={{ color: '#a1a1aa' }}>{node.first_seen}</span>
          <span style={{ color: '#3f3f46' }}>→</span>
          <span style={{ color: '#a1a1aa' }}>{node.last_activity}</span>
        </div>

        {inbound.length > 0 && (
          <Section title={`Who invests here · ${totalOrNull(inbound, node.totalInflow)}`}
            hint="Click a name to open it. Click the deal icon for the write-up."
            icon={<ArrowDownLeft size={11} color="#34D399" />}>
            <FlowList
              flows={inbound} counterpartyKey="sourceId"
              nodeById={nodeById} selectedFlowId={selectedFlowId}
              onSelectFlow={onSelectFlow} onOpenEntity={onOpenEntity}
            />
          </Section>
        )}

        {outbound.length > 0 && (
          <Section title={`Where its money goes · ${totalOrNull(outbound, node.totalOutflow)}`}
            hint="Click a name to open it. Click the deal icon for the write-up."
            icon={<ArrowUpRight size={11} color="#F59E0B" />}>
            <FlowList
              flows={outbound} counterpartyKey="targetId"
              nodeById={nodeById} selectedFlowId={selectedFlowId}
              onSelectFlow={onSelectFlow} onOpenEntity={onOpenEntity}
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

// ── Profile: who/what this is + a link ──────────────────────────────────
// Description + link come from the engine data if present, else the dashboard
// reference file. When neither has a verified link we show a Search fallback
// (never a guessed URL).
function ProfileBlock({ node }) {
  const links = node.links || [];
  const hasProfile = !!node.description || links.length > 0;
  return (
    <div style={{
      marginBottom: 16, padding: '11px 12px',
      background: '#0F0F13', border: '1px solid #1e1e23', borderRadius: 10,
    }}>
      <div style={{
        fontSize: 8.5, color: '#6b6b74', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7,
      }}>
        {node.profileType === 'person' ? 'Who this is'
          : node.profileType === 'project' ? 'What this is'
          : node.profileType === 'fund' ? 'About this fund' : 'About'}
      </div>

      <div style={{ fontSize: 12.5, color: node.description ? '#c4c4cb' : '#6b6b74', lineHeight: 1.6, fontStyle: node.description ? 'normal' : 'italic' }}>
        {node.description || 'No profile on file yet — use search below to look it up.'}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {links.map((l, i) => <LinkChip key={i} link={l} />)}
        {links.length === 0 && (
          <LinkChip link={{ kind: 'search', label: `Search "${node.name}"`, url: node.searchUrl }} />
        )}
      </div>

      {/* Why some entities show a search box instead of a link: we only ever
          link a URL we hold on file — private offices and stealth companies
          usually have none, and a guessed URL is worse than no URL. */}
      {links.length === 0 && (
        <div style={{ marginTop: 8, fontSize: 9, color: '#4a4a53', fontFamily: MONO, lineHeight: 1.55 }}>
          {hasProfile
            ? 'No official site on file — private office / no public web presence. We search rather than guess a URL.'
            : 'No reference in the payload for this entity yet — an engine-side coverage gap, not something we fill in by hand.'}
        </div>
      )}

      {/* When the engine researched this entity, stamp the date it did so. */}
      {node.referenceAsOf && (
        <div style={{ marginTop: 8, fontSize: 9, color: '#4a4a53', fontFamily: MONO }}>
          Researched by the engine · {node.referenceAsOf}
        </div>
      )}
    </div>
  );
}

function LinkChip({ link }) {
  const Icon = link.kind === 'website' ? Globe
    : link.kind === 'read_more' ? Newspaper
    : link.kind === 'linkedin' ? Linkedin
    : link.kind === 'firm' ? Building2
    : link.kind === 'search' ? Search
    : ExternalLink;
  // `read_more` carries the publication name as its label — show it as such so
  // the chip reads "Reuters", not a bare "Link".
  const label = link.label || (link.kind === 'x' ? 'X / social'
    : link.kind === 'website' ? 'Website'
    : link.kind === 'read_more' ? 'Read more' : 'Link');
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" title={link.url}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', background: '#141418',
        border: '1px solid #26262c', borderRadius: 7,
        color: '#c4c4cb', fontSize: 10.5, fontFamily: MONO, fontWeight: 600,
        textDecoration: 'none', cursor: 'pointer', maxWidth: '100%',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3f9bd6'; e.currentTarget.style.color = '#e4e4e7'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#26262c'; e.currentTarget.style.color = '#c4c4cb'; }}>
      <Icon size={12} style={{ flexShrink: 0, opacity: 0.85 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {link.kind !== 'search' && <ExternalLink size={10} style={{ flexShrink: 0, opacity: 0.5 }} />}
    </a>
  );
}

// ── Ranked flow list with share bars ────────────────────────────────────
// The ROW is the counterparty: clicking it walks the panel over to that entity
// (the primary intent — "who did they back? show me that company"). The deal
// write-up is a separate, explicit button so the two never fight each other.
function FlowList({ flows, counterpartyKey, nodeById, selectedFlowId, onSelectFlow, onOpenEntity }) {
  const max = Math.max(...flows.map(f => f.amountUSD), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {flows.map(f => {
        const cp = nodeById.get(f[counterpartyKey]);
        const on = f.id === selectedFlowId;
        const band = confidenceBand(f.confidence);
        return (
          <div key={f.id}
            onClick={() => cp && onOpenEntity(cp.id)}
            title={cp ? `Open ${cp.name}` : ''}
            style={{
              position: 'relative', padding: '8px 10px', borderRadius: 8,
              background: on ? '#17171c' : '#0F0F13',
              border: `1px solid ${on ? f.color + '66' : '#1e1e23'}`,
              cursor: cp ? 'pointer' : 'default', overflow: 'hidden',
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
            <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontSize: 12, fontWeight: 600, color: '#e4e4e7',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                minWidth: 0,
              }}>
                {cp ? cp.name : f[counterpartyKey]}
              </span>
              <ChevronRight size={11} color="#52525b" style={{ flexShrink: 0, alignSelf: 'center' }} />
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: f.disclosed ? '#fafafa' : '#71717a', fontFamily: MONO, flexShrink: 0 }}>
                {f.disclosed ? fmtUSD(f.amount) : '—'}
              </span>
            </div>

            <div style={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 5, fontSize: 9.5, fontFamily: MONO,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: f.color, flexShrink: 0 }} />
              <span style={{ color: '#a1a1aa' }}>{f.eventLabel}</span>
              <span style={{ color: '#3f3f46' }}>·</span>
              <span style={{ color: '#71717a' }}>{f.date}</span>
              <span style={{ flex: 1 }} />

              {/* confidence as a meter, not a code */}
              {f.confidence != null && (
                <span title={`${band.label} — ${f.confidence}/100. Open the deal card for the full source breakdown.`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'help' }}>
                  <span style={{ width: 26, height: 3, borderRadius: 2, background: '#232329', overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${f.confidence}%`, background: band.color }} />
                  </span>
                  <span style={{ color: band.color, fontWeight: 700 }}>{f.confidence}</span>
                </span>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); onSelectFlow(f.id); }}
                title={on ? 'Hide the deal write-up' : 'Read the deal write-up'}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  background: on ? f.color + '22' : '#17171c',
                  border: `1px solid ${on ? f.color + '66' : '#26262c'}`,
                  color: on ? f.color : '#6b6b74', cursor: 'pointer', padding: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#e4e4e7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = on ? f.color : '#6b6b74'; }}>
                <FileText size={11} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, icon, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: hint ? 4 : 8,
        fontSize: 9, color: '#6b6b74', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {icon}{title}
      </div>
      {hint && (
        <div style={{ fontSize: 9, color: '#4a4a53', fontFamily: MONO, marginBottom: 8, lineHeight: 1.5 }}>
          {hint}
        </div>
      )}
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
