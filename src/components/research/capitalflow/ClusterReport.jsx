// ══════════════════════════════════════════════════════════════════════════
// ClusterReport — the summary that opens when you click a cluster TITLE on the
// map (a sector cell like "AI Applications", or an allocator island like
// "Venture").
//
// The map itself is deliberately quiet: a title and one total, nothing else.
// Everything that used to shout from the canvas — fired signals, class mixes,
// leaderboards — lives here instead, on demand, in one place.
//
// It answers, in this order and then stops:
//   1. How big is this and how does it rank
//   2. Who dominates it — by kind of money, then by name
//   3. Where does it actually land
//   4. Which way is it moving
//   5. The read (derived from those numbers, labelled as ours)
//   ⌄ Deeper breakdown, behind a disclosure: vehicle split + sub-sectors
//
// Every number carries its basis. Confirmed flows only in the headline;
// candidates are called out separately; undisclosed amounts never become $0
// silently. See clusterStats.js for the rules.
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import {
  X, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus,
  ArrowUpRight, Sparkles, Info,
} from 'lucide-react';
import { fmtUSD } from './format.js';
import { STATUS_META, RULE_META, sectorLabel } from '../../../data/capitalMap.js';
import { engineSectorRank } from './clusterStats.js';

const MONO = 'ui-monospace, monospace';
export const REPORT_W = 430;

const pct = (x) => (x == null ? null : `${Math.round(x * 100)}%`);

export default function ClusterReport({ report, onOpenEntity, onClose, topInset = 0 }) {
  const [deep, setDeep] = useState(false);
  if (!report) return null;

  const isSector = report.kind === 'sector';
  const mix = isSector ? report.byClass : report.bySector;
  const engineRank = isSector ? engineSectorRank(report.key) : null;
  const h = report.head;

  return (
    <aside style={{
      position: 'absolute', top: topInset, right: 0, bottom: 0, width: REPORT_W, zIndex: 26,
      background: 'rgba(10,10,12,0.985)',
      borderLeft: '1px solid #24242a',
      backdropFilter: 'blur(10px)',
      boxShadow: '-24px 0 60px -20px rgba(0,0,0,0.9)',
      display: 'flex', flexDirection: 'column',
      animation: 'cfmSlide 220ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 13px', borderBottom: '1px solid #1c1c21', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 3, background: report.color, marginTop: 7,
            flexShrink: 0, boxShadow: `0 0 12px ${report.color}80`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {report.label}
            </div>
            <div style={{
              fontSize: 9.5, color: '#71717a', fontFamily: MONO, marginTop: 5,
              textTransform: 'uppercase', letterSpacing: '0.09em',
            }}>
              {isSector ? 'Sector report · where capital lands' : 'Allocator report · who deploys capital'}
            </div>
          </div>
          <button onClick={onClose} title="Close report"
            style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 3, lineHeight: 0, flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}>
            <X size={16} />
          </button>
        </div>
        {report.blurb && (
          <div style={{ fontSize: 11.5, color: '#a1a1aa', lineHeight: 1.55, marginTop: 9 }}>
            {report.blurb}
          </div>
        )}
        {report.outsideAiStack && (
          <div style={{
            marginTop: 9, padding: '4px 8px', display: 'inline-block',
            background: '#16161a', border: '1px solid #2a2a31', borderRadius: 5,
            fontSize: 9, color: '#94A3B8', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>Outside the AI buildout</div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 30px' }}>

        {/* 1 · How big */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Stat label={isSector ? 'Capital in' : 'Capital deployed'}
            value={h.capital ? fmtUSD(h.capital) : '—'}
            hint="Confirmed flows with a disclosed amount." big />
          <Stat label="Confirmed deals" value={String(h.deals)}
            hint={h.undisclosedDeals ? `${h.undisclosedDeals} of them undisclosed` : 'All amounts disclosed'} big />
          <Stat label={isSector ? 'Allocators' : 'Active names'}
            value={String(isSector ? report.allocators : report.activeCount)}
            hint={isSector ? 'Distinct sources of capital' : `${report.memberCount} tracked in this class`} />
          <Stat label="Recipients" value={String(report.recipients)}
            hint="Distinct entities receiving" />
        </div>

        <div style={{
          marginTop: 9, padding: '9px 11px', background: '#0e0f14',
          border: '1px solid #1c1c21', borderRadius: 8,
          fontSize: 10.5, color: '#a1a1aa', lineHeight: 1.6, fontFamily: MONO,
        }}>
          {report.rank && (
            <div>
              Ranks <b style={{ color: '#e4e4e7' }}>#{report.rank.position}</b> of {report.rank.of}{' '}
              {isSector ? 'sectors' : 'allocator classes'} by capital
              {report.shareOfTracked != null && <> · <b style={{ color: '#e4e4e7' }}>{pct(report.shareOfTracked)}</b> of all tracked capital</>}
            </div>
          )}
          {h.medianTicket != null && (
            <div style={{ color: '#71717a' }}>
              Median ticket {fmtUSD(h.medianTicket)}
              {h.largest && <> · largest {fmtUSD(h.largest.amountUSD)}</>}
            </div>
          )}
          {!!h.candidateDeals && (
            <div style={{ color: '#94A3B8', marginTop: 3 }}>
              + {h.candidateDeals} unconfirmed {h.candidateDeals === 1 ? 'flow' : 'flows'}
              {h.candidateCapital ? ` claiming ${fmtUSD(h.candidateCapital)}` : ''} — excluded above.
            </div>
          )}
        </div>

        {/* Engine's own ranking, when it covers this sector. Shown rather than
            reconciled: if it disagrees with ours, that is worth seeing. */}
        {engineRank && (
          <div title={engineRank.basis || undefined} style={{
            marginTop: 7, fontSize: 9.5, color: '#52525b', fontFamily: MONO,
            display: 'flex', alignItems: 'center', gap: 5, cursor: engineRank.basis ? 'help' : 'default',
          }}>
            <Info size={10} />
            Engine cycle ranking: #{engineRank.position} of {engineRank.of} · {fmtUSD(engineRank.row.capital_usd)} · {engineRank.row.deals} deals
          </div>
        )}

        {/* 2 · Who dominates */}
        <Section title={isSector ? 'Who is funding it' : 'Where the money goes'} />
        {report.dominant && (
          <div style={{
            padding: '10px 12px', borderRadius: 9, marginBottom: 9,
            background: `${report.dominant.color}0F`, border: `1px solid ${report.dominant.color}38`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: report.dominant.color }}>
              {report.dominant.label} leads
            </div>
            <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 3, fontFamily: MONO }}>
              {fmtUSD(report.dominant.capital)} · {report.dominant.deals} {report.dominant.deals === 1 ? 'deal' : 'deals'}
              {h.deals ? ` · ${pct(report.dominant.deals / h.deals)} of deals` : ''}
              {h.capital ? ` · ${pct(report.dominant.capital / h.capital)} of dollars` : ''}
            </div>
            {report.dominant.blurb && (
              <div style={{ fontSize: 11, color: '#8b8b95', marginTop: 6, lineHeight: 1.5 }}>
                {report.dominant.blurb}
              </div>
            )}
          </div>
        )}
        {mix.slice(0, 6).map(m => (
          <Bar key={m.key} label={m.label} color={m.color}
            share={h.capital ? m.capital / h.capital : 0}
            right={`${fmtUSD(m.capital)} · ${m.deals}d`} />
        ))}

        {/* 3 · Names */}
        <Section title={isSector ? 'Top allocators here' : 'Biggest deployers'}
          note="By confirmed, disclosed capital" />
        {report.topAllocators.map((a, i) => (
          <NameRow key={a.key} rank={i + 1} node={a.node}
            main={fmtUSD(a.capital)}
            sub={`${a.deals} ${a.deals === 1 ? 'deal' : 'deals'}${a.biggest ? ` · biggest ${fmtUSD(a.biggest.amountUSD)}` : ''}`}
            onClick={() => a.node && onOpenEntity(a.node.id)} />
        ))}
        {!report.topAllocators.length && <Empty>No confirmed allocator on file.</Empty>}

        <Section title={isSector ? 'Where it lands' : 'Largest positions'}
          note={isSector ? 'Companies and vehicles raising here' : 'By capital received from this class'} />
        {report.topRecipients.map((r, i) => (
          <NameRow key={r.key} rank={i + 1} node={r.node}
            main={r.capital ? fmtUSD(r.capital) : 'undisclosed'}
            sub={`${r.investors} ${r.investors === 1 ? 'investor' : 'investors'} · ${r.deals} ${r.deals === 1 ? 'deal' : 'deals'}`}
            onClick={() => r.node && onOpenEntity(r.node.id)} />
        ))}
        {!report.topRecipients.length && <Empty>No confirmed recipient on file.</Empty>}

        {/* 4 · Momentum */}
        {report.momentum && (report.momentum.recentDeals || report.momentum.priorDeals) && (
          <>
            <Section title="Momentum"
              note={`Last ${report.momentum.windowDays}d vs the ${report.momentum.windowDays}d before, measured from the payload date`} />
            <Momentum m={report.momentum} />
            {isSector && !!report.newEntrants.length && (
              <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 8, lineHeight: 1.55 }}>
                <span title="No tracked deal in this sector before this window"
                  style={{ color: '#71717a', fontFamily: MONO, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'help' }}>
                  First seen here · </span>
                {report.newEntrants.slice(0, 6).map((n, i) => (
                  <span key={n.id}>
                    {i > 0 && ', '}
                    <button onClick={() => onOpenEntity(n.id)} style={linkBtn}>{n.name}</button>
                  </span>
                ))}
              </div>
            )}
            {!isSector && !!report.newSectors.length && (
              <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 8, lineHeight: 1.55 }}>
                <span title="No tracked deal in these sectors before this window"
                  style={{ color: '#71717a', fontFamily: MONO, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'help' }}>
                  First seen in · </span>
                {report.newSectors.map(sectorLabel).join(', ')}
              </div>
            )}
          </>
        )}

        {/* Signals — the engine's fired rules. This is what used to shout on
            the canvas; it belongs to the sector, so it lives in its report. */}
        {isSector && !!report.signals.length && (
          <>
            <Section title="Signals firing" note="Engine rules, this cycle" />
            {report.signals.map((s, i) => {
              const rule = RULE_META[s.rule];
              return (
                <div key={i} style={{
                  padding: '9px 11px', marginBottom: 6, borderRadius: 8,
                  background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.22)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={11} color="#FBBF24" />
                    <span style={{
                      fontSize: 9.5, color: '#FBBF24', fontFamily: MONO, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                    }}>{rule?.label || s.rule}</span>
                    {typeof s.strength === 'number' && (
                      <span style={{ fontSize: 9.5, color: '#71717a', fontFamily: MONO, marginLeft: 'auto' }}>
                        strength {s.strength}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#d4d4d8', marginTop: 5, lineHeight: 1.5 }}>{s.theme}</div>
                  {rule?.blurb && (
                    <div style={{ fontSize: 10.5, color: '#71717a', marginTop: 4, lineHeight: 1.5 }}>{rule.blurb}</div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* 5 · The read */}
        {!!report.read.length && (
          <>
            <Section title="The read" note="Derived from the numbers above — our framing, not the engine's" />
            <ul style={{ margin: 0, padding: '0 0 0 16px', listStyle: 'none' }}>
              {report.read.map((line, i) => (
                <li key={i} style={{
                  position: 'relative', fontSize: 12, color: '#d4d4d8',
                  lineHeight: 1.62, marginBottom: 8,
                }}>
                  <span style={{
                    position: 'absolute', left: -14, top: 7, width: 4, height: 4,
                    borderRadius: '50%', background: report.color,
                  }} />
                  {line}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* ⌄ Deeper breakdown */}
        <button onClick={() => setDeep(d => !d)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            width: '100%', padding: '9px 12px', marginTop: 18,
            background: deep ? '#16161c' : 'rgba(56,189,248,0.06)',
            border: `1px solid ${deep ? '#26262c' : 'rgba(56,189,248,0.28)'}`,
            borderRadius: 9, color: deep ? '#a1a1aa' : '#38BDF8',
            fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
          }}>
          {deep ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          Deeper breakdown
        </button>

        {deep && (
          <div style={{ marginTop: 12 }}>
            {/* Vehicle split — structural, from the engine's own class field */}
            <Section title="What is actually receiving the money"
              note="From the payload's entity class — no inference" />
            {report.breakdown.vehicles.map(v => (
              <Bar key={v.key} label={`${v.label} (${v.count})`} color={v.color}
                share={h.capital ? v.capital / h.capital : 0}
                right={v.capital ? fmtUSD(v.capital) : 'undisclosed'} />
            ))}
            {report.breakdown.vehicles.map(v => (
              <div key={`b-${v.key}`} style={{ fontSize: 10.5, color: '#71717a', lineHeight: 1.5, marginBottom: 5 }}>
                <b style={{ color: '#8b8b95' }}>{v.label}:</b> {v.blurb}
              </div>
            ))}

            {/* Sub-sector split — derived, with its coverage stated */}
            <Section title="Sub-sectors inside this cluster"
              note="Derived dashboard-side from entity descriptions — the engine does not ship a sub-sector field yet" />
            {report.breakdown.operatingCount === 0 ? (
              <Empty>No operating companies here — every recipient is a fund, project or asset.</Empty>
            ) : (
              <>
                <div style={{
                  padding: '7px 10px', marginBottom: 9, borderRadius: 7,
                  background: '#0e0f14', border: '1px dashed #2a2a31',
                  fontSize: 10, color: '#94A3B8', fontFamily: MONO, lineHeight: 1.55,
                }}>
                  Classified {report.breakdown.coverage.classified} of {report.breakdown.coverage.total} operating companies
                  {report.breakdown.coverage.weak ? ` (${report.breakdown.coverage.weak} from the name alone)` : ''}.
                  {report.breakdown.coverage.classified < report.breakdown.coverage.total &&
                    ' The rest carry no description in the payload and are left unclassified rather than guessed.'}
                </div>
                {report.breakdown.subsectors.map(s => (
                  <div key={s.key || '_none'} style={{ marginBottom: 9 }}>
                    <Bar label={`${s.label} (${s.count})`} color={s.color}
                      share={h.capital ? s.capital / h.capital : 0}
                      right={s.capital ? fmtUSD(s.capital) : '—'} />
                    <div style={{ fontSize: 10.5, color: '#71717a', lineHeight: 1.5, paddingLeft: 2 }}>
                      {s.members.slice(0, 8).map((n, i) => (
                        <span key={n.id}>
                          {i > 0 && ' · '}
                          <button onClick={() => onOpenEntity(n.id)} style={linkBtn}>{n.name}</button>
                        </span>
                      ))}
                      {s.members.length > 8 && ` +${s.members.length - 8} more`}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Confidence mix */}
            <Section title="How far to trust this" />
            <div style={{ fontSize: 11, color: '#a1a1aa', lineHeight: 1.6 }}>
              Headline figures count <b style={{ color: STATUS_META.verified.color }}>verified</b> and{' '}
              <b style={{ color: STATUS_META.verified_alpha.color }}>verified α</b> flows only.
              Undisclosed amounts contribute $0, so dollars understate and deal counts do not.
              {!!h.candidateDeals && ` ${h.candidateDeals} candidate ${h.candidateDeals === 1 ? 'flow sits' : 'flows sit'} outside every figure here.`}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ── bits ─────────────────────────────────────────────────────────────────
const linkBtn = {
  background: 'none', border: 'none', padding: 0, margin: 0,
  color: '#a1a1aa', fontSize: 'inherit', fontFamily: 'inherit',
  cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#3f3f46',
};

function Section({ title, note }) {
  return (
    <div style={{ marginTop: 20, marginBottom: 9 }}>
      <div style={{
        fontSize: 9.5, color: '#71717a', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>{title}</div>
      {note && <div style={{ fontSize: 10, color: '#52525b', marginTop: 3, lineHeight: 1.45 }}>{note}</div>}
    </div>
  );
}

function Stat({ label, value, hint, big }) {
  return (
    <div title={hint} style={{
      padding: '9px 11px', background: '#0e0f14', border: '1px solid #1c1c21',
      borderRadius: 8, cursor: hint ? 'help' : 'default',
    }}>
      <div style={{
        fontSize: 8.5, color: '#52525b', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.09em',
      }}>{label}</div>
      <div style={{ fontSize: big ? 17 : 15, fontWeight: 700, color: '#fafafa', marginTop: 3, letterSpacing: '-0.01em' }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 9.5, color: '#52525b', marginTop: 2, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function Bar({ label, color, share, right }) {
  const w = Math.max(2, Math.min(100, (share || 0) * 100));
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
        <span style={{ fontSize: 11.5, color: '#d4d4d8', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <span style={{ fontSize: 10, color: '#71717a', fontFamily: MONO, flexShrink: 0 }}>{right}</span>
      </div>
      <div style={{ height: 4, background: '#17171c', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${w}%`, height: '100%', background: color, opacity: 0.75, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function NameRow({ rank, node, main, sub, onClick }) {
  if (!node) return null;
  return (
    <button onClick={onClick} title={`Open ${node.name}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '8px 10px', marginBottom: 5, textAlign: 'left',
        background: '#0e0f14', border: '1px solid #1c1c21', borderRadius: 8,
        cursor: 'pointer', transition: 'border-color 130ms',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#33343c')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1c1c21')}>
      <span style={{
        fontSize: 10, color: '#52525b', fontFamily: MONO, fontWeight: 700,
        width: 12, flexShrink: 0,
      }}>{rank}</span>
      <span style={{ width: 7, height: 7, borderRadius: 2, background: node.color, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block', fontSize: 12.5, color: '#e4e4e7', fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{node.name}</span>
        <span style={{ display: 'block', fontSize: 10, color: '#71717a', fontFamily: MONO, marginTop: 2 }}>{sub}</span>
      </span>
      <span style={{ fontSize: 12, color: '#fafafa', fontFamily: MONO, fontWeight: 700, flexShrink: 0 }}>{main}</span>
      <ArrowUpRight size={11} color="#3f3f46" style={{ flexShrink: 0 }} />
    </button>
  );
}

function Momentum({ m }) {
  const up = m.recentDeals > m.priorDeals;
  const flat = m.recentDeals === m.priorDeals;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const color = flat ? '#94A3B8' : up ? '#34D399' : '#F87171';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <div style={{ padding: '9px 11px', background: '#0e0f14', border: `1px solid ${color}33`, borderRadius: 8 }}>
        <div style={{ fontSize: 8.5, color: '#52525b', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          Last {m.windowDays}d
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <Icon size={13} color={color} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fafafa' }}>{fmtUSD(m.recentCapital)}</span>
        </div>
        <div style={{ fontSize: 9.5, color: '#71717a', fontFamily: MONO, marginTop: 2 }}>
          {m.recentDeals} {m.recentDeals === 1 ? 'deal' : 'deals'}
        </div>
      </div>
      <div style={{ padding: '9px 11px', background: '#0e0f14', border: '1px solid #1c1c21', borderRadius: 8 }}>
        <div style={{ fontSize: 8.5, color: '#52525b', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          Prior {m.windowDays}d
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#a1a1aa', marginTop: 3 }}>{fmtUSD(m.priorCapital)}</div>
        <div style={{ fontSize: 9.5, color: '#71717a', fontFamily: MONO, marginTop: 2 }}>
          {m.priorDeals} {m.priorDeals === 1 ? 'deal' : 'deals'}
        </div>
      </div>
    </div>
  );
}

function Empty({ children }) {
  return (
    <div style={{
      padding: '10px 12px', background: '#0e0f14', border: '1px dashed #26262c',
      borderRadius: 8, fontSize: 11, color: '#71717a', lineHeight: 1.5,
    }}>{children}</div>
  );
}
