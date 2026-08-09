// Allocator deep-dive — the "more detailed breakdown" view, allocators only.
// Use case: researching a target, you meet an unfamiliar backer and need
// "who is this and what does it signal" without leaving the flow.
//
// Everything rendered here is payload-sourced or derived strictly from tracked
// flows. The canonical summary (background / decision logic / track record /
// strategy) comes from the engine: a `profile` object on the node wins, then
// the allocatorProfiles.json sidecar. Whatever the backend hasn't delivered
// yet renders as an honest "no data" state — never estimated, never invented.

import { X, ChevronLeft, AlertTriangle, ExternalLink, ArrowUpRight, BookOpen, TrendingUp, Compass, ChevronRight } from 'lucide-react';
import { fmtUSD } from './format.js';
import {
  SECTOR_META, CLASS_META, TIER_META, confidenceBand,
} from '../../../data/capitalMap.js';
import allocatorProfiles from '../../../data/allocatorProfiles.json';

const MONO = 'ui-monospace, monospace';
const W = 560;

export default function AllocatorDeepDive({
  node, outbound, nodeById, onOpenEntity, onBack, onClose, topInset = 0,
}) {
  if (!node) return null;
  const cls = CLASS_META[node.cls];
  const tier = node.tier ? TIER_META[node.tier] : null;
  // Engine-emitted profile on the node wins; sidecar file is the fallback.
  const profile = node.profile || allocatorProfiles[node.id] || null;
  const track = Array.isArray(profile?.track_record) ? profile.track_record : [];
  const ytd = profile?.ytd || null;
  const strategy = profile?.strategy || null;

  // ── Derived from tracked flows (real payload data, no interpretation) ──
  const disclosed = outbound.filter(f => f.disclosed);
  const recent = [...outbound].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6);
  const bySector = new Map();
  outbound.forEach(f => {
    if (!f.sector) return;
    const s = bySector.get(f.sector) || { amount: 0, deals: 0 };
    s.amount += f.amountUSD; s.deals += 1;
    bySector.set(f.sector, s);
  });
  const topSectors = [...bySector.entries()]
    .sort((a, b) => b[1].amount - a[1].amount || b[1].deals - a[1].deals)
    .slice(0, 3);

  return (
    <aside style={{
      position: 'absolute', top: topInset, right: 0, bottom: 0, width: W, maxWidth: '92vw', zIndex: 26,
      background: 'rgba(10,10,12,0.99)',
      borderLeft: '1px solid #24242a',
      backdropFilter: 'blur(10px)',
      boxShadow: '-24px 0 60px -20px rgba(0,0,0,0.9)',
      display: 'flex', flexDirection: 'column',
      animation: 'cfmSlide 220ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #1c1c21', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} title="Back to the entity panel"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3, padding: '5px 9px 5px 5px',
              background: '#141418', border: '1px solid #26262c', borderRadius: 7,
              color: '#a1a1aa', fontSize: 10, fontFamily: MONO, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fafafa')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}>
            <ChevronLeft size={12} /> Panel
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {node.name}
              </span>
              <span style={{ fontSize: 9, color: '#52525b', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                ALLOCATOR BREAKDOWN
              </span>
            </div>
            <div style={{ fontSize: 9.5, color: '#71717a', fontFamily: MONO, marginTop: 2 }}>
              {cls?.label || node.cls}
              {tier ? <> · <span style={{ color: tier.color }}>{tier.label}</span></> : null}
              {node.countryLabel ? <> · {node.countryLabel}</> : null}
            </div>
          </div>
          <button onClick={onClose} title="Close"
            style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 3, lineHeight: 0, flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 32px' }}>

        {/* ── Background / context ── */}
        <DiveSection icon={<BookOpen size={11} color="#8E9BE6" />} title="Background · focus, thesis, style">
          {(profile?.background || node.description) ? (
            <p style={{ margin: 0, fontSize: 12.5, color: '#c4c4cb', lineHeight: 1.65 }}>
              {profile?.background || node.description}
            </p>
          ) : (
            <NoData what="background summary" />
          )}
        </DiveSection>

        {/* ── Latest investments · decision logic ── */}
        <DiveSection icon={<ArrowUpRight size={11} color="#F59E0B" />} title="Latest investments · decision logic">
          {profile?.latest_summary && (
            <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#c4c4cb', lineHeight: 1.65 }}>
              {profile.latest_summary}
            </p>
          )}
          {outbound.length > 0 ? (
            <>
              {/* Composed strictly from tracked flows — counts, sums, sectors. */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                <MiniStat label="Tracked deals" value={String(outbound.length)} />
                <MiniStat label="Disclosed capital" value={disclosed.length ? fmtUSD(node.totalOutflow) : '—'}
                  sub={disclosed.length < outbound.length ? `${outbound.length - disclosed.length} undisclosed` : null} />
                <MiniStat label="Last activity" value={node.last_activity || '—'} />
              </div>
              {topSectors.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {topSectors.map(([key, s]) => (
                    <span key={key} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px',
                      background: '#141418', border: `1px solid ${(SECTOR_META[key]?.color || '#3f3f46')}44`, borderRadius: 6,
                      fontSize: 10, fontFamily: MONO, color: SECTOR_META[key]?.color || '#a1a1aa', fontWeight: 700,
                    }}>
                      {SECTOR_META[key]?.label || key}
                      <span style={{ color: '#71717a', fontWeight: 600 }}>
                        {s.deals} deal{s.deals === 1 ? '' : 's'}{s.amount > 0 ? ` · ${fmtUSD(s.amount)}` : ''}
                      </span>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {recent.map(f => {
                  const tgt = nodeById.get(f.targetId);
                  const band = confidenceBand(f.confidence);
                  return (
                    <button key={f.id} onClick={() => tgt && onOpenEntity(tgt.id)}
                      title={tgt ? `Open ${tgt.name}` : ''}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                        background: '#0F0F13', border: '1px solid #1e1e23', borderRadius: 8,
                        cursor: tgt ? 'pointer' : 'default', textAlign: 'left', width: '100%',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#33333a')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e1e23')}>
                      <span style={{ fontSize: 9.5, color: '#71717a', fontFamily: MONO, flexShrink: 0, width: 72 }}>{f.date}</span>
                      <span style={{ fontSize: 11.5, color: '#e4e4e7', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                        {tgt ? tgt.name : f.targetId}
                      </span>
                      <ChevronRight size={10} color="#52525b" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: 9.5, color: '#a1a1aa', fontFamily: MONO, flexShrink: 0 }}>{f.eventLabel}</span>
                      {f.confidence != null && (
                        <span title={`${band.label} — ${f.confidence}/100`}
                          style={{ fontSize: 9.5, color: band.color, fontFamily: MONO, fontWeight: 700, flexShrink: 0, cursor: 'help' }}>
                          {f.confidence}
                        </span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 700, color: f.disclosed ? '#fafafa' : '#71717a', fontFamily: MONO, flexShrink: 0 }}>
                        {f.disclosed ? fmtUSD(f.amount) : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : !profile?.latest_summary && <NoData what="tracked investments" />}
        </DiveSection>

        {/* ── Track record ── */}
        <DiveSection icon={<TrendingUp size={11} color="#34D399" />} title="Track record · returns by fiscal year">
          {(track.length > 0 || ytd) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {track.map((r, i) => (
                <TrackRow key={i} period={r.fiscal_year} value={r.return_pct} note={r.note} source={r.source} />
              ))}
              {ytd && (
                <TrackRow period={`YTD${ytd.as_of ? ` · as of ${ytd.as_of}` : ''}`}
                  value={ytd.return_pct} note={ytd.note} source={ytd.source} provisional />
              )}
            </div>
          ) : (
            <NoData what="track-record figures"
              detail="Returns must arrive from the backend payload with a source — they are never estimated dashboard-side. Backend request logged in allocatorProfiles.json." />
          )}
        </DiveSection>

        {/* ── Strategy ── */}
        <DiveSection icon={<Compass size={11} color="#5FB6D2" />} title="Strategy · source-attributed">
          {strategy?.text ? (
            <>
              <p style={{ margin: 0, fontSize: 12.5, color: '#c4c4cb', lineHeight: 1.65 }}>{strategy.text}</p>
              {strategy.source?.url && <SourceLink source={strategy.source} style={{ marginTop: 10 }} />}
            </>
          ) : (
            <NoData what="stated strategy" />
          )}
        </DiveSection>

        {/* Provenance footer */}
        <div style={{ marginTop: 4, fontSize: 9, color: '#4a4a53', fontFamily: MONO, lineHeight: 1.6 }}>
          Background, track record and strategy come from the engine payload (or its sidecar file) with sources attached.
          Deal rows above are the engine's tracked flows, rendered as-is. Nothing on this screen is interpolated.
        </div>
      </div>
    </aside>
  );
}

// ── pieces ───────────────────────────────────────────────────────────────
function DiveSection({ icon, title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9,
        fontSize: 9, color: '#6b6b74', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {icon}{title}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value, sub }) {
  return (
    <div style={{ padding: '8px 10px', background: '#0F0F13', border: '1px solid #1e1e23', borderRadius: 8 }}>
      <div style={{ fontSize: 8, color: '#52525b', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#e4e4e7', fontFamily: MONO, marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 8.5, color: '#52525b', fontFamily: MONO, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function TrackRow({ period, value, note, source, provisional }) {
  const has = typeof value === 'number';
  const color = !has ? '#71717a' : value >= 0 ? '#34D399' : '#F87171';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
      background: '#0F0F13', borderRadius: 8,
      border: provisional ? '1px dashed #7a5c1e' : '1px solid #1e1e23',
    }}>
      <span style={{ fontSize: 10, color: '#a1a1aa', fontFamily: MONO, fontWeight: 700, flexShrink: 0 }}>{period}</span>
      {provisional && (
        <span title="Provisional — unaudited year-to-date figure. Treat with caution until the fiscal year closes."
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px',
            background: '#FBBF2414', border: '1px solid #FBBF2440', borderRadius: 4,
            fontSize: 8, color: '#FBBF24', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help', flexShrink: 0,
          }}>
          <AlertTriangle size={9} /> Provisional · unaudited
        </span>
      )}
      <span style={{ flex: 1 }} />
      {note && <span style={{ fontSize: 9, color: '#52525b', fontFamily: MONO }}>{note}</span>}
      {source?.url && <SourceLink source={source} compact />}
      <span style={{ fontSize: 12.5, fontWeight: 700, color, fontFamily: MONO, flexShrink: 0 }}>
        {has ? `${value > 0 ? '+' : ''}${value}%` : 'no data'}
      </span>
    </div>
  );
}

function SourceLink({ source, compact, style }) {
  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer" title={source.url}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: compact ? '2px 7px' : '5px 10px', background: '#141418',
        border: '1px solid #26262c', borderRadius: 6,
        color: '#8fb3cf', fontSize: compact ? 9 : 10.5, fontFamily: MONO, fontWeight: 600,
        textDecoration: 'none', flexShrink: 0, ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3f9bd6')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#26262c')}>
      {source.label || 'Source'} <ExternalLink size={compact ? 8 : 10} style={{ opacity: 0.6 }} />
    </a>
  );
}

// Honest empty state — §6: never fabricate or interpolate a missing value.
function NoData({ what, detail }) {
  return (
    <div style={{
      padding: '10px 12px', background: '#0F0F13', border: '1px dashed #26262c', borderRadius: 8,
      fontSize: 11, color: '#6b6b74', fontFamily: MONO, lineHeight: 1.6, fontStyle: 'italic',
    }}>
      No {what} in the payload yet — shown as missing rather than guessed.
      {detail && <div style={{ marginTop: 5, fontStyle: 'normal', fontSize: 9.5, color: '#4a4a53' }}>{detail}</div>}
    </div>
  );
}
