// ══════════════════════════════════════════════════════════════════════════
// DigestView — the Flow Digest section (third view, next to Карта / Таблица).
//
// A briefing on the whole map: a week, a month, and the entire tracked stack.
// You should be able to read one block and know what moved, who led, and where
// the money went — without touching the graph. All numbers come from digest.js
// (pure, payload-derived); this file only lays them out.
// ══════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { ArrowUpRight, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { buildDigest } from './digest.js';
import { fmtUSD, plural, formatSignalText, businessGist } from './format.js';
import { subsectorLabel } from './subsectors.js';
import { SECTOR_META, THEME_META, RULE_META, sectorLabel } from '../../../data/capitalMap.js';

const MONO = 'ui-monospace, monospace';

export default function DigestView({ nodes, links, generated, sectors, trends, onOpenEntity, topInset = 0 }) {
  const digest = useMemo(
    () => buildDigest({ nodes, links, generated, sectors }),
    [nodes, links, generated, sectors]
  );
  const [tab, setTab] = useState('week');
  const block = digest.blocks.find(b => b.id === tab) || digest.blocks[0];
  const isAll = block.id === 'all';
  const windowTrends = trends?.[block.id] || [];
  // Fallback lookup for trend.allocators (plain display-name strings) when the
  // engine's evidence doesn't resolve to real ids — still lets a name open its
  // entity panel instead of rendering as inert text.
  const nodeByName = useMemo(() => new Map(nodes.map(n => [n.name, n])), [nodes]);

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, top: topInset, zIndex: 20,
      background: 'var(--cf-canvas)', overflowY: 'auto',
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '18px 24px 60px' }}>

        {/* Heading + window tabs */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em' }}>
            Сводка по потокам
          </span>
          <span style={{ fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            на {generated}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--cf-text5)', fontFamily: MONO, marginBottom: 16 }}>
          Что произошло в потоках капитала — коротко, чтобы понять картину с одного экрана.
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {digest.blocks.map(b => (
            <button key={b.id} onClick={() => setTab(b.id)}
              style={{
                padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                background: tab === b.id ? 'var(--cf-accent-bg)' : 'var(--cf-surface2)',
                border: `1px solid ${tab === b.id ? 'var(--cf-accent-bd)' : 'var(--cf-border)'}`,
                color: tab === b.id ? 'var(--cf-accent)' : 'var(--cf-text3)',
                fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
              {b.title}
            </button>
          ))}
        </div>

        {/* Sub + narrative */}
        <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          {block.sub}
        </div>

        {block.empty ? (
          <Empty>За это окно подтверждённых потоков нет — попробуйте месяц или всю карту.</Empty>
        ) : (
          <>
            {/* Headline stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 14 }}>
              <Stat label="Раскрытый приток" value={block.head.capital ? fmtUSD(block.head.capital) : '—'}
                hint="Подтверждённые потоки с раскрытой суммой" big />
              <Stat label="Подтверждённые сделки" value={String(block.head.deals)}
                hint={block.head.candidateDeals ? `+ ${block.head.candidateDeals} кандидатов` : 'все подтверждены'} />
              <Stat label="Инвесторов" value={String(block.uniqueInvestors)}
                hint="уникальных источников в окне" />
              <Stat label="Получателей" value={String(block.uniqueBeneficiaries)}
                hint="уникальных получателей в окне" />
              {block.concentration && (
                <Stat label="Концентрация" value={`топ-3: ${Math.round(block.concentration.top3Share * 100)}%`}
                  hint={`половина в ${block.concentration.dealsToHalf} ${plural(block.concentration.dealsToHalf, ['сделке', 'сделках', 'сделках'])} · ${block.concentration.mood}`} />
              )}
            </div>

            {/* Narrative */}
            <div style={{
              padding: '13px 15px', marginBottom: 20, borderRadius: 10,
              background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)',
            }}>
              {block.read.map((line, i) => (
                <p key={i} style={{ margin: i ? '7px 0 0' : 0, fontSize: 12.5, color: i === 0 ? 'var(--cf-text1)' : 'var(--cf-text3)', lineHeight: 1.6 }}>
                  {line}
                </p>
              ))}
            </div>

            {/* Trends — the engine's grounded narrative synthesis for this
                window (not yet shipped; empty until it is). Deeper than the
                arithmetic read above: a named "why", cited allocators, real
                numbers — not just "capital moved toward X sector". */}
            {windowTrends.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <SectionLabel>Тренды окна</SectionLabel>
                <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', marginTop: -5, marginBottom: 11 }}>
                  Разбор движка — что стоит за цифрами, не только куда сместился приток
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {windowTrends.map((t, i) => (
                    <TrendCard key={i} trend={t} onOpenEntity={onOpenEntity} nodeByName={nodeByName} />
                  ))}
                </div>
              </div>
            )}

            {/* Insight row — sector rotation + who's driving */}
            {(block.rotation || block.classMix.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
                {block.rotation && (
                  <div style={{ padding: '13px 15px', borderRadius: 10, background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)' }}>
                    <SectionLabel>Куда смещается фокус</SectionLabel>
                    <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', marginTop: -5, marginBottom: 11 }}>Сдвиг доли секторов против прошлого окна</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <RotCol dir="up" rows={block.rotation.gained} />
                      <RotCol dir="down" rows={block.rotation.lost} />
                    </div>
                  </div>
                )}
                {block.classMix.length > 0 && (
                  <div style={{ padding: '13px 15px', borderRadius: 10, background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)' }}>
                    <SectionLabel>Кто двигает капитал</SectionLabel>
                    <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', marginTop: -5, marginBottom: 11 }}>Класс инвестора — доля притока окна</div>
                    <ClassMixBar rows={block.classMix} />
                  </div>
                )}
              </div>
            )}

            {/* Three lists */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 8 }}>
              <List title="Топ инвесторов по размеру" note="По раскрытому подтверждённому капиталу">
                {block.investors.length
                  ? block.investors.map((r, i) => (
                      <NameRow key={r.key} rank={i + 1} node={r.node}
                        main={r.capital ? fmtUSD(r.capital) : 'не раскрыто'}
                        sub={`${r.deals} ${plural(r.deals, ['сделка', 'сделки', 'сделок'])}`}
                        onClick={() => r.node && onOpenEntity(r.node.id)} />
                    ))
                  : <Empty>Нет данных.</Empty>}
              </List>

              <List title="Топ получателей" note="Куда пришло больше всего">
                {block.beneficiaries.length
                  ? block.beneficiaries.map((r, i) => (
                      <NameRow key={r.key} rank={i + 1} node={r.node}
                        main={r.capital ? fmtUSD(r.capital) : 'не раскрыто'}
                        sub={`${r.deals} ${plural(r.deals, ['сделка', 'сделки', 'сделок'])}`}
                        onClick={() => r.node && onOpenEntity(r.node.id)} />
                    ))
                  : <Empty>Нет данных.</Empty>}
              </List>

              <List title="Топ секторов по притоку" note="Доля раскрытого притока окна">
                {block.sectors.length
                  ? block.sectors.map(s => (
                      <SectorBar key={s.key}
                        label={s.key === '_none' ? 'Без сектора' : sectorLabel(s.key)}
                        color={SECTOR_META[s.key]?.color || 'var(--cf-text9)'}
                        share={s.share} right={fmtUSD(s.capital)} />
                    ))
                  : <Empty>Нет данных.</Empty>}
              </List>
            </div>

            {/* New entrants */}
            {block.newEntrants.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <SectionLabel>Впервые на карте</SectionLabel>
                <div style={{ fontSize: 11.5, color: 'var(--cf-text3)', lineHeight: 1.7 }}>
                  {block.newEntrants.map((n, i) => (
                    <span key={n.id}>
                      {i > 0 && ' · '}
                      <button onClick={() => onOpenEntity(n.id)} style={linkBtn}>{n.name}</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Signals — whole-map view only */}
            {isAll && digest.signals.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <SectionLabel>Сработавшие сигналы · этот цикл</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
                  {digest.signals.slice(0, 8).map((s, i) => {
                    const rule = RULE_META[s.rule];
                    return (
                      <div key={i} style={{
                        padding: '9px 11px', borderRadius: 8,
                        background: 'var(--cf-warn-bg)', border: '1px solid var(--cf-warn-bd)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Sparkles size={11} color="var(--cf-warn)" />
                          <span style={{ fontSize: 9.5, color: 'var(--cf-warn)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {rule?.label || s.rule}
                          </span>
                          <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO }}>
                            {s.sector === '_none' ? '' : sectorLabel(s.sector)}
                          </span>
                        </div>
                        {s.theme && (
                          <div style={{ fontSize: 11, color: 'var(--cf-text2)', marginTop: 5, lineHeight: 1.5 }}>
                            {formatSignalText(s.theme, SECTOR_META, THEME_META)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

// A single engine-authored trend. Reading order is (why → what → who), because
// the point of this card is to give the user a LEAD — "look here, this is
// what's happening in this corner of the map" — not a data recap they have to
// re-derive on their own.
//   1. Title (engine's one-line thesis) + subsector chip.
//   2. "О чём это" — a business gist for the primary target(s), so an
//      unfamiliar name (Hadrian, Volta Infra) stops being opaque, plus a
//      direct link to that entity's node on the map.
//   3. Engine narrative — the grounded paragraph (why + who), rendered as
//      secondary supporting prose. If the engine keeps writing pure recap,
//      the header row and target gist above still carry a real "what to
//      watch" message on their own.
//   4. Stats + investor chips at the bottom, MONO, tertiary.
function TrendCard({ trend: t, onOpenEntity, nodeByName }) {
  // Prefer resolved evidence (real node refs, so a click always works); when
  // the engine's evidence doesn't resolve to ids yet, fall back to the plain
  // display-name convenience array — still resolved to a clickable node via
  // name lookup when possible, plain text otherwise.
  const fromEvidence = [...new Map(
    (t.evidence || []).filter(e => e.allocator).map(e => [e.allocator.id, e.allocator])
  ).values()];
  const allocators = fromEvidence.length ? fromEvidence
    : (Array.isArray(t.allocators) ? t.allocators : [])
        .map(name => nodeByName?.get(name) || { id: null, name });

  // The companies actually on the receiving end of the trend — the "look at
  // these" the card points the user toward. De-duped, resolved to real nodes
  // when possible so each name is a click into the map.
  const targets = [...new Map(
    (t.evidence || [])
      .map(e => e.target)
      .filter(Boolean)
      .map(n => [n.id, n])
  ).values()];
  // A one-line business gist per target — what the company DOES, not how much
  // it raised (the funding half of the description is already the surrounding
  // narrative). Falls back to whatever prose we have if trimming empties it.
  const targetGists = targets.map(n => ({
    node: n,
    gist: businessGist(n.description, 2),
  }));

  const lowConfidence = t.confidence === 'low' || t.provisional;
  const subLabel = t.subsector ? subsectorLabel(t.subsector) : null;
  const sectorColor = t.sector ? (SECTOR_META[t.sector]?.color || 'var(--cf-text6)') : null;

  return (
    <div style={{ padding: '13px 15px', borderRadius: 10, background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)' }}>
      {/* 1 — headline */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cf-text0)', lineHeight: 1.35 }}>{t.title}</span>
        {subLabel && (
          <span style={{
            fontSize: 9.5, color: sectorColor || 'var(--cf-text5)', fontFamily: MONO,
            border: `1px solid ${sectorColor ? sectorColor + '40' : 'var(--cf-border)'}`,
            padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {subLabel}
          </span>
        )}
        {t.sector && !subLabel && (
          <span style={{ fontSize: 9.5, color: sectorColor, fontFamily: MONO }}>
            {sectorLabel(t.sector)}
          </span>
        )}
        {lowConfidence && (
          <span style={{
            marginLeft: 'auto', fontSize: 8.5, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text6)',
            border: '1px dashed var(--cf-border-dashed)', borderRadius: 5, padding: '2px 6px',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>Слабый сигнал</span>
        )}
      </div>

      {/* 2 — the "what business is this even about" block, with a direct link
          into the map for each target. This is what turns the trend from a
          list of participants into a real lead. */}
      {targetGists.length > 0 && (
        <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {targetGists.map(({ node, gist }) => (
            <div key={node.id} style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--cf-text2)' }}>
              <button
                onClick={() => onOpenEntity(node.id)}
                style={{ ...linkBtn, fontWeight: 700, color: 'var(--cf-text0)' }}
                title="Открыть на карте"
              >
                {node.name}
                <ArrowUpRight size={11} style={{ marginLeft: 2, verticalAlign: '-1px', color: 'var(--cf-text6)' }} />
              </button>
              {gist && (
                <span style={{ color: 'var(--cf-text3)' }}> — {gist}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3 — engine narrative, kept but demoted to supporting prose */}
      {t.narrative && (
        <p style={{
          margin: '10px 0 0', fontSize: 11.5, color: 'var(--cf-text4)',
          lineHeight: 1.6, borderLeft: '2px solid var(--cf-border-soft)', paddingLeft: 10,
        }}>
          {t.narrative}
        </p>
      )}

      {/* 4 — tertiary: numbers and named investors */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, fontSize: 10.5, fontFamily: MONO, color: 'var(--cf-text5)' }}>
        {typeof t.deals === 'number' && <span>{t.deals} {plural(t.deals, ['сделка', 'сделки', 'сделок'])}</span>}
        {typeof t.capital_usd === 'number' && t.capital_usd > 0 && (
          <span style={{ color: 'var(--cf-text3)' }}>{fmtUSD(t.capital_usd)}</span>
        )}
        {Array.isArray(t.date_range) && t.date_range.length === 2 && (
          <span>{t.date_range[0]} → {t.date_range[1]}</span>
        )}
      </div>
      {allocators.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8, alignItems: 'baseline' }}>
          <span style={{ fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            инвесторы:
          </span>
          {allocators.map((a, i) => (
            a.id
              ? <button key={a.id} onClick={() => onOpenEntity(a.id)} style={linkBtn}>{a.name}</button>
              : <span key={i} style={{ color: 'var(--cf-text4)', fontSize: 'inherit' }}>{a.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── bits ─────────────────────────────────────────────────────────────────
const linkBtn = {
  background: 'none', border: 'none', padding: 0, margin: 0,
  color: 'var(--cf-text2)', fontSize: 'inherit', fontFamily: 'inherit',
  cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--cf-text9)',
};

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 9,
    }}>{children}</div>
  );
}

function List({ title, note, children }) {
  return (
    <div>
      <div style={{ marginBottom: 9 }}>
        <div style={{ fontSize: 9.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</div>
        {note && <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', marginTop: 3 }}>{note}</div>}
      </div>
      {children}
    </div>
  );
}

function RotCol({ dir, rows }) {
  const up = dir === 'up';
  const color = up ? 'var(--cf-good)' : 'var(--cf-bad)';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        {up ? <TrendingUp size={12} color={color} /> : <TrendingDown size={12} color={color} />}
        <span style={{ fontSize: 9.5, color, fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {up ? 'Набирают' : 'Теряют'}
        </span>
      </div>
      {rows.length ? rows.map(r => (
        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: 2, background: r.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: 'var(--cf-text2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
          <span style={{ fontSize: 10.5, color, fontFamily: MONO, fontWeight: 700, flexShrink: 0 }}>
            {r.deltaPP > 0 ? '+' : '−'}{Math.abs(Math.round(r.deltaPP))} п.п.
          </span>
        </div>
      )) : <span style={{ fontSize: 10.5, color: 'var(--cf-text7)', fontFamily: MONO }}>—</span>}
    </div>
  );
}

function ClassMixBar({ rows }) {
  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--cf-border-hair)' }}>
        {rows.map(r => (
          <span key={r.cls} title={`${r.label} — ${Math.round(r.share * 100)}%`}
            style={{ width: `${r.share * 100}%`, background: r.color }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
        {rows.map(r => (
          <span key={r.cls} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--cf-text4)', fontFamily: MONO }}>
            <span style={{ width: 6, height: 6, borderRadius: 2, background: r.color }} />
            {r.label}
            <span style={{ color: 'var(--cf-text1)', fontWeight: 700 }}>{Math.round(r.share * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, hint, big }) {
  return (
    <div title={hint} style={{
      padding: '9px 11px', background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)',
      borderRadius: 8, cursor: hint ? 'help' : 'default',
    }}>
      <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{label}</div>
      <div style={{ fontSize: big ? 17 : 15, fontWeight: 700, color: 'var(--cf-text0)', marginTop: 3, letterSpacing: '-0.01em' }}>{value}</div>
      {hint && <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', marginTop: 2, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function SectorBar({ label, color, share, right }) {
  const w = Math.max(2, Math.min(100, (share || 0) * 100));
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
        <span style={{ fontSize: 11.5, color: 'var(--cf-text2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: 10, color: 'var(--cf-text5)', fontFamily: MONO, flexShrink: 0 }}>{right} · {Math.round((share || 0) * 100)}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--cf-surface3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${w}%`, height: '100%', background: color, opacity: 0.75, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function NameRow({ rank, node, main, sub, onClick }) {
  if (!node) return null;
  return (
    <button onClick={onClick} title={`Открыть ${node.name}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '8px 10px', marginBottom: 5, textAlign: 'left',
        background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 8,
        cursor: 'pointer', transition: 'border-color 130ms',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border-dashed)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border-soft)')}>
      <span style={{ fontSize: 10, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, width: 12, flexShrink: 0 }}>{rank}</span>
      <span style={{ width: 7, height: 7, borderRadius: 2, background: node.color, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12.5, color: 'var(--cf-text1)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
        <span style={{ display: 'block', fontSize: 10, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 2 }}>{sub}</span>
      </span>
      <span style={{ fontSize: 12, color: 'var(--cf-text0)', fontFamily: MONO, fontWeight: 700, flexShrink: 0 }}>{main}</span>
      <ArrowUpRight size={11} color="var(--cf-text9)" style={{ flexShrink: 0 }} />
    </button>
  );
}

function Empty({ children }) {
  return (
    <div style={{
      padding: '10px 12px', background: 'var(--cf-surface1)', border: '1px dashed var(--cf-border)',
      borderRadius: 8, fontSize: 11, color: 'var(--cf-text5)', lineHeight: 1.5,
    }}>{children}</div>
  );
}
