// Allocator deep-dive — the "more detailed breakdown" view, allocators only.
// Use case: researching a target, you meet an unfamiliar backer and need
// "who is this and what does it signal" without leaving the flow.
//
// DATA OWNERSHIP: the narrative and the track record are the ENGINE's, shipped
// in capitalMap.json → allocators[<name>] as `profile` + `track_record`. The
// dashboard has zero latitude over them: no editing, no recomputing, no
// filling gaps by hand. `allocatorProfiles.json` survives only as a fallback
// for allocators the engine has not profiled yet. Whatever is missing renders
// as an honest "no data" state and is reported back as an engine coverage gap.
//
// Track-record rows carry `provisional` and `source_url` per row — both are
// always surfaced: provisional rows are visibly flagged, and the source is one
// tap away on every single row.

import { X, ChevronLeft, AlertTriangle, ExternalLink, ArrowUpRight, BookOpen, TrendingUp, Compass, ChevronRight, Crosshair } from 'lucide-react';
import { fmtUSD, plural } from './format.js';
import {
  SECTOR_META, CLASS_META, TIER_META, THEME_META, confidenceBand, sectorLabel,
  metricLabel, formatTrackValue, SOURCE_TIER_LABEL,
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

  // Engine record wins. The sidecar is normalised into the same shape so the
  // render path below never has to care which one it got.
  const legacy = allocatorProfiles[node.id] || null;
  const profile = node.engineProfile || (legacy ? {
    background: legacy.background,
    latest_investments_summary: legacy.latest_summary,
    strategy: legacy.strategy?.text,
    strategy_source_url: legacy.strategy?.source?.url,
  } : null);

  // Engine rows are the truth; the sidecar's older shape is mapped onto them.
  const track = node.trackRecord?.length ? node.trackRecord
    : (legacy?.track_record || []).map(r => ({
        fiscal_year: r.fiscal_year, metric: 'reported_return_pct', value: r.return_pct,
        unit: 'pct', provisional: false, source_url: r.source?.url, notes: r.note,
      }));

  // Group by metric so "Stock total return" and "Fund IRR" never interleave.
  const byMetric = [];
  track.forEach(r => {
    let g = byMetric.find(x => x.metric === r.metric);
    if (!g) { g = { metric: r.metric, rows: [] }; byMetric.push(g); }
    g.rows.push(r);
  });
  byMetric.forEach(g => g.rows.sort((a, b) => String(a.fiscal_year).localeCompare(String(b.fiscal_year))));

  // ── Derived from tracked flows (payload facts, no interpretation) ──────
  const disclosed = outbound.filter(f => f.disclosed);
  const recent = [...outbound].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6);
  // The engine ships its own per-sector rollup; prefer it over our own sum.
  const engineSectors = node.engineSectors
    ? Object.entries(node.engineSectors)
        .map(([key, s]) => [key, { deals: s.deals, amount: s.capital_usd || 0 }])
        .sort((a, b) => b[1].amount - a[1].amount).slice(0, 3)
    : null;
  const bySector = new Map();
  outbound.forEach(f => {
    if (!f.sector) return;
    const s = bySector.get(f.sector) || { amount: 0, deals: 0 };
    s.amount += f.amountUSD; s.deals += 1;
    bySector.set(f.sector, s);
  });
  const topSectors = engineSectors || [...bySector.entries()]
    .sort((a, b) => b[1].amount - a[1].amount || b[1].deals - a[1].deals).slice(0, 3);

  const thesis = node.thesisShares
    ? Object.entries(node.thesisShares).sort((a, b) => b[1] - a[1]).slice(0, 4)
    : [];

  return (
    <aside style={{
      position: 'absolute', top: topInset, right: 0, bottom: 0, width: W, maxWidth: '92vw', zIndex: 26,
      background: 'var(--cf-panel)',
      borderLeft: '1px solid var(--cf-border)',
      backdropFilter: 'blur(10px)',
      boxShadow: '-24px 0 60px -20px var(--cf-shadow)',
      display: 'flex', flexDirection: 'column',
      animation: 'cfmSlide 220ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--cf-border-soft)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} title="Назад к панели объекта"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3, padding: '5px 9px 5px 5px',
              background: 'var(--cf-surface2)', border: '1px solid var(--cf-border)', borderRadius: 7,
              color: 'var(--cf-text3)', fontSize: 10, fontFamily: MONO, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text0)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text3)')}>
            <ChevronLeft size={12} /> Назад
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {node.name}
              </span>
              <span style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                РАЗБОР ИНВЕСТОРА
              </span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 2 }}>
              {cls?.label || node.cls}
              {tier ? <> · <span style={{ color: tier.color }}>{tier.label}</span></> : null}
              {node.countryLabel ? <> · {node.countryLabel}</> : null}
              {profile?.as_of ? <> · исследовано {profile.as_of}</> : null}
            </div>
          </div>
          <button onClick={onClose} title="Закрыть"
            style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 3, lineHeight: 0, flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 32px' }}>

        {/* ── Background / context ── */}
        <DiveSection icon={<BookOpen size={11} color="#8E9BE6" />} title="Бэкграунд · фокус, тезис, стиль">
          {(profile?.background || node.description) ? (
            <>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
                {profile?.background || node.description}
              </p>
              {profile?.focus && <Trait label="Фокус" text={profile.focus} />}
              {profile?.style && <Trait label="Стиль" text={profile.style} />}
              {profile?.thesis && <Trait label="Тезис" text={profile.thesis} />}
            </>
          ) : (
            <NoData what="Бэкграунда" />
          )}
        </DiveSection>

        {/* ── Latest investments · decision logic ── */}
        <DiveSection icon={<ArrowUpRight size={11} color="#F59E0B" />} title="Последние инвестиции · логика решений">
          {profile?.latest_investments_summary && (
            <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
              {profile.latest_investments_summary}
            </p>
          )}
          {outbound.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                <MiniStat label="Сделок отслежено" value={String(outbound.length)}
                  sub={node.confirmedDeals != null ? `${node.confirmedDeals} подтверждено` : null} />
                <MiniStat label="Раскрытый капитал" value={disclosed.length ? fmtUSD(node.totalOutflow) : '—'}
                  sub={disclosed.length < outbound.length ? `${outbound.length - disclosed.length} без суммы` : null} />
                <MiniStat label="Последняя активность" value={node.last_activity || '—'} />
              </div>

              {topSectors.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {topSectors.map(([key, s]) => (
                    <span key={key} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px',
                      background: 'var(--cf-surface2)', border: `1px solid ${(SECTOR_META[key]?.color || 'var(--cf-text9)')}44`, borderRadius: 6,
                      fontSize: 10, fontFamily: MONO, color: SECTOR_META[key]?.color || 'var(--cf-text3)', fontWeight: 700,
                    }}>
                      {sectorLabel(key)}
                      <span style={{ color: 'var(--cf-text5)', fontWeight: 600 }}>
                        {s.deals} {plural(s.deals, ['сделка', 'сделки', 'сделок'])}{s.amount > 0 ? ` · ${fmtUSD(s.amount)}` : ''}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {/* Engine's own thesis split for this allocator. */}
              {thesis.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                  {thesis.map(([key, share]) => (
                    <span key={key} title="Доля подтверждённых событий инвестора по каноническим темам — расчёт движка."
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
                        background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 5,
                        fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text3)', cursor: 'help',
                      }}>
                      <span style={{ width: 6, height: 6, borderRadius: 2, background: THEME_META[key]?.color || 'var(--cf-text7)' }} />
                      {THEME_META[key]?.label || key}
                      <span style={{ color: 'var(--cf-text1)', fontWeight: 700 }}>{Math.round(share * 100)}%</span>
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
                      title={tgt ? `Открыть ${tgt.name}` : ''}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                        background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 8,
                        cursor: tgt ? 'pointer' : 'default', textAlign: 'left', width: '100%',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border-strong)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border-soft)')}>
                      <span style={{ fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, flexShrink: 0, width: 72 }}>{f.date}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--cf-text1)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                        {tgt ? tgt.name : f.targetId}
                      </span>
                      <ChevronRight size={10} color="var(--cf-text7)" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: 9.5, color: 'var(--cf-text3)', fontFamily: MONO, flexShrink: 0 }}>{f.eventLabel}</span>
                      {f.confidence != null && (
                        <span title={`${band.label} — ${f.confidence}/100`}
                          style={{ fontSize: 9.5, color: band.color, fontFamily: MONO, fontWeight: 700, flexShrink: 0, cursor: 'help' }}>
                          {f.confidence}
                        </span>
                      )}
                      <span style={{ fontSize: 11, fontWeight: 700, color: f.disclosed ? 'var(--cf-text0)' : 'var(--cf-text5)', fontFamily: MONO, flexShrink: 0 }}>
                        {f.disclosed ? fmtUSD(f.amount) : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : !profile?.latest_investments_summary && <NoData what="Отслеженных инвестиций" />}
        </DiveSection>

        {/* ── Track record ── */}
        <DiveSection icon={<TrendingUp size={11} color="var(--cf-good)" />} title="Трек-рекорд · по финансовым годам">
          {byMetric.length > 0 ? (
            <>
              {byMetric.map(g => (
                <div key={g.metric} style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 9, color: 'var(--cf-text4)', fontFamily: MONO, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5,
                  }}>
                    {metricLabel(g.metric)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {g.rows.map((r, i) => <TrackRow key={i} row={r} />)}
                  </div>
                </div>
              ))}
              {profile?.track_record_note && (
                <div style={{ fontSize: 9.5, color: 'var(--cf-text6)', fontFamily: MONO, lineHeight: 1.6, marginTop: -4 }}>
                  {profile.track_record_note}
                </div>
              )}
            </>
          ) : (
            <NoData what="Цифр трек-рекорда"
              detail="Движок присылает трек-рекорд с источником на каждой строке; этот инвестор пока не покрыт. Отмечено как пробел покрытия, вручную не заполняется." />
          )}
        </DiveSection>

        {/* ── Strategy ── */}
        <DiveSection icon={<Compass size={11} color="#5FB6D2" />} title="Стратегия · с указанием источника">
          {profile?.strategy ? (
            <>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>{profile.strategy}</p>
              {profile.strategy_source_url && (
                <SourceLink url={profile.strategy_source_url} label="Источник стратегии" style={{ marginTop: 10 }} />
              )}
            </>
          ) : (
            <NoData what="Заявленной стратегии" />
          )}
        </DiveSection>

        {/* ── Everything the engine cited for this allocator ── */}
        {Array.isArray(profile?.sources) && profile.sources.length > 0 && (
          <DiveSection icon={<Crosshair size={11} color="var(--cf-muted)" />} title={`Источники · ${profile.sources.length}`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.sources.map((s, i) => {
                const url = typeof s === 'string' ? s : s.url;
                const label = typeof s === 'string' ? hostOf(s) : (s.label || hostOf(s.url));
                return url ? <SourceLink key={i} url={url} label={label} compact /> : null;
              })}
            </div>
          </DiveSection>
        )}

        {/* Provenance footer */}
        <div style={{ marginTop: 4, fontSize: 9, color: 'var(--cf-text8)', fontFamily: MONO, lineHeight: 1.6 }}>
          Бэкграунд, трек-рекорд и стратегию присылает движок Capital Flow, здесь они отображаются как есть —
          без правок, пересчётов и заполнения пробелов. Строки сделок выше — отслеженные движком потоки.
          Строки «предварительно» — неаудированные цифры: ориентир, пока не закрыт финансовый год.
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
        fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {icon}{title}
      </div>
      {children}
    </div>
  );
}

// One labelled trait line (focus / style / thesis) under the background text.
function Trait({ label, text }) {
  return (
    <div style={{ display: 'flex', gap: 9, marginTop: 9 }}>
      <span style={{
        fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.1em', width: 46, flexShrink: 0, paddingTop: 3,
      }}>{label}</span>
      <span style={{ fontSize: 11.5, color: 'var(--cf-text3)', lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

function MiniStat({ label, value, sub }) {
  return (
    <div style={{ padding: '8px 10px', background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 8 }}>
      <div style={{ fontSize: 8, color: 'var(--cf-text7)', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--cf-text1)', fontFamily: MONO, marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// One track-record row. Provisional rows are visibly marked and the source is
// always one tap away — both are engine-supplied per row, never inferred.
function TrackRow({ row }) {
  const value = formatTrackValue(row);
  const positive = typeof row.value === 'number' && row.value >= 0;
  const isPct = row.unit === 'pct';
  const color = value == null ? 'var(--cf-text5)' : !isPct ? 'var(--cf-text1)' : positive ? 'var(--cf-good)' : 'var(--cf-bad)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
      background: 'var(--cf-surface1)', borderRadius: 8,
      border: row.provisional ? '1px dashed #7a5c1e' : '1px solid var(--cf-border-soft)',
    }}>
      <span style={{ fontSize: 10, color: 'var(--cf-text3)', fontFamily: MONO, fontWeight: 700, flexShrink: 0 }}>
        {row.fiscal_year}
      </span>
      {row.scope && (
        <span title="Какой фонд или сегмент покрывает эта строка"
          style={{
            padding: '1px 6px', borderRadius: 4, background: 'var(--cf-surface3)', border: '1px solid var(--cf-border)',
            fontSize: 8.5, color: 'var(--cf-text3)', fontFamily: MONO, fontWeight: 700, flexShrink: 0, cursor: 'help',
          }}>
          {row.scope}
        </span>
      )}
      {row.provisional && (
        <span title="Предварительная неаудированная цифра. Ориентир, пока не закрыт финансовый год и нет аудированного источника."
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px',
            background: '#FBBF2414', border: '1px solid #FBBF2440', borderRadius: 4,
            fontSize: 8, color: 'var(--cf-warn)', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help', flexShrink: 0,
          }}>
          <AlertTriangle size={9} /> Предварительно
        </span>
      )}
      <span style={{ flex: 1 }} />
      {row.notes && (
        <span title={row.notes}
          style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, cursor: 'help', flexShrink: 0 }}>
          прим.
        </span>
      )}
      {row.source_url && (
        <SourceLink url={row.source_url}
          label={row.source_tier ? `T${row.source_tier}` : 'src'}
          title={SOURCE_TIER_LABEL[row.source_tier]}
          compact />
      )}
      <span style={{ fontSize: 12.5, fontWeight: 700, color, fontFamily: MONO, flexShrink: 0, minWidth: 58, textAlign: 'right' }}>
        {value ?? 'нет данных'}
      </span>
    </div>
  );
}

function SourceLink({ url, label, title, compact, style }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={title ? `${title} — ${url}` : url}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: compact ? '2px 7px' : '5px 10px', background: 'var(--cf-surface2)',
        border: '1px solid var(--cf-border)', borderRadius: 6,
        color: 'var(--cf-link)', fontSize: compact ? 9 : 10.5, fontFamily: MONO, fontWeight: 600,
        textDecoration: 'none', flexShrink: 0, ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cf-link-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border)')}>
      {label || 'Источник'} <ExternalLink size={compact ? 8 : 10} style={{ opacity: 0.6 }} />
    </a>
  );
}

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'Источник'; }
}

// Honest empty state — §6: never fabricate or interpolate a missing value.
function NoData({ what, detail }) {
  return (
    <div style={{
      padding: '10px 12px', background: 'var(--cf-surface1)', border: '1px dashed var(--cf-border)', borderRadius: 8,
      fontSize: 11, color: 'var(--cf-text6)', fontFamily: MONO, lineHeight: 1.6, fontStyle: 'italic',
    }}>
      {what} в данных пока нет — показано как пропуск, а не догадка.
      {detail && <div style={{ marginTop: 5, fontStyle: 'normal', fontSize: 9.5, color: 'var(--cf-text8)' }}>{detail}</div>}
    </div>
  );
}
