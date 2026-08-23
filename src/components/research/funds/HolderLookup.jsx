// ══════════════════════════════════════════════════════════════════════════
// HolderLookup — the crossing view, reachable from any position row.
//
// Two directions, one overlay, in the order the question is actually asked:
//
//   ФОНД → БУМАГА   one security, which of the tracked funds hold it, at what
//                   weight, moving which way. This is where crowded consensus
//                   separates from the lone differentiated bet.
//   БУМАГА → ВСЕ    the full institutional holder table — every filer, not
//                   just the tracked ones. The tracked rows stay prominent;
//                   the rest form a muted background. This is what says
//                   whether a fund is early or late into a name relative to
//                   the whole institutional base.
// ══════════════════════════════════════════════════════════════════════════

import { X, Users, ArrowRight } from 'lucide-react';
import { CROSSING } from '../../../data/fundTracker.js';
import { fmtUSD, fmtPct, fmtShares, fmtDate, plural } from './fundFormat.js';
import { MONO, hexA, LatencyBadge, FormBadge, Chip, Delta, useTone } from './FundBits.jsx';

export default function HolderLookup({ ticker, onClose, onSelect }) {
  const t = useTone();
  const cross = CROSSING[ticker];
  if (!cross) return null;
  const sec = cross.security;
  const tracked = cross.rows.slice().sort((a, b) => b.weight - a.weight);
  const crowded = cross.holders > 1;

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
      display: 'grid', placeItems: 'center', padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 'min(860px, 100%)', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
        background: 'var(--cf-popover)', border: '1px solid var(--cf-border)',
        borderRadius: 13, boxShadow: '0 30px 80px -20px var(--cf-shadow)',
        animation: 'cfmDrop 160ms ease-out',
      }}>
        {/* header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 2, padding: '15px 18px 13px',
          background: 'var(--cf-popover)', borderBottom: '1px solid var(--cf-border-soft)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 17, fontFamily: MONO, fontWeight: 800, color: 'var(--cf-text0)' }}>
                  {cross.ticker}
                </span>
                <span style={{ fontSize: 13, color: 'var(--cf-text3)' }}>{cross.issuer}</span>
                <Chip color={crowded ? '#38BDF8' : '#8B8B95'}
                  title={crowded
                    ? 'Насыщенное имя: держат несколько отслеживаемых фондов.'
                    : 'Одиночная ставка: из отслеживаемых держит только один фонд.'}>
                  <Users size={9} />{crowded ? `${cross.holders} фонда` : 'одиночная ставка'}
                </Chip>
              </div>
              {sec && (
                <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--cf-text6)', marginTop: 6 }}>
                  {fmtShares(sec.shares_outstanding)} акций в обращении ·
                  {' '}{sec.holders.length} {plural(sec.holders.length, ['держатель', 'держателя', 'держателей'])} в таблице
                </div>
              )}
            </div>
            <button onClick={onClose} aria-label="Закрыть"
              style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 2, lineHeight: 0 }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 18px 26px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* ── direction 1: which tracked funds hold it ── */}
          <section>
            <Head>Кто из отслеживаемых держит</Head>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {tracked.map(p => (
                <button key={p.fundId + p.instrument} onClick={() => { onSelect?.(p.fundId); onClose(); }}
                  style={{
                    display: 'grid', gridTemplateColumns: '1.2fr 56px 74px 66px 72px 56px',
                    alignItems: 'center', gap: 9, padding: '9px 10px', width: '100%',
                    background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-hair)',
                    borderRadius: 7, cursor: 'pointer', textAlign: 'left',
                    opacity: p.action === 'exited' ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cf-text9)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border-hair)')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cf-text0)' }}>{p.fund}</span>
                    {p.instrumentMeta.derivative && (
                      <Chip color={p.instrumentMeta.color} small title={p.instrumentMeta.blurb}>{p.instrumentMeta.short}</Chip>
                    )}
                  </span>
                  <span style={{ ...num, color: 'var(--cf-text0)', fontWeight: 700 }} title="Вес в книге фонда">
                    {fmtPct(p.weight)}
                  </span>
                  <span style={num}>{fmtUSD(p.value_usd)}</span>
                  <span><Chip color={p.actionMeta.color} small title={p.actionMeta.blurb}>{p.actionMeta.short}</Chip></span>
                  <span style={{ textAlign: 'right' }}><Delta value={p.share_delta_pct} shown={p.deltaShown} /></span>
                  <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <LatencyBadge days={p.latency_days} asOf={p.as_of} form={p.source_form} />
                  </span>
                </button>
              ))}
            </div>
            <Note>
              {crowded
                ? `Имя держат ${cross.holders} отслеживаемых ${plural(cross.holders, ['фонд', 'фонда', 'фондов'])}; чистое направление за период — ${cross.netDirection > 0 ? 'к покупке' : cross.netDirection < 0 ? 'к сокращению' : 'разнонаправленно'}.`
                : 'Из отслеживаемых имя держит только один фонд — дифференцированная ставка, а не консенсус.'}
            </Note>
          </section>

          {/* ── direction 2: the whole institutional register ── */}
          {sec && (
            <section>
              <Head>
                Все институциональные держатели
                <span style={{ color: 'var(--cf-text7)', fontWeight: 600, marginLeft: 8 }}>
                  отслеживаемые выделены
                </span>
              </Head>
              <div style={{
                display: 'grid', gridTemplateColumns: '1.5fr 76px 66px 74px 78px',
                gap: 9, padding: '7px 10px', marginBottom: 2,
                background: 'var(--cf-surface0)', borderRadius: '6px 6px 0 0',
              }}>
                {['Держатель', 'Акций', '% выпуска', 'Δ акций', 'Подано'].map((h, i) => (
                  <span key={h} style={{
                    fontSize: 8.5, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text6)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    textAlign: i === 0 ? 'left' : i === 4 ? 'left' : 'right',
                  }}>{h}</span>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {sec.holders.map((h, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1.5fr 76px 66px 74px 78px',
                    gap: 9, alignItems: 'center', padding: '7px 10px',
                    background: h.tracked ? hexA(t('#38BDF8'), 0.07) : 'transparent',
                    borderBottom: '1px solid var(--cf-border-hair)',
                    borderLeft: h.tracked ? '2px solid var(--cf-accent)' : '2px solid transparent',
                  }}>
                    <span style={{
                      fontSize: h.tracked ? 11 : 10.5,
                      fontWeight: h.tracked ? 700 : 500,
                      color: h.tracked ? 'var(--cf-text0)' : 'var(--cf-text6)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{h.holder}</span>
                    <span style={{ ...num, color: h.tracked ? 'var(--cf-text2)' : 'var(--cf-text7)' }}>
                      {fmtShares(h.shares)}
                    </span>
                    <span style={{ ...num, color: h.tracked ? 'var(--cf-text1)' : 'var(--cf-text7)', fontWeight: h.tracked ? 700 : 500 }}>
                      {fmtPct(h.pct_outstanding, 2)}
                    </span>
                    <span style={{ textAlign: 'right' }}>
                      {/* Same guard, register units: a big percent move on a
                          holder that owns a tenth of a percent of the company
                          is noise, so it is withheld rather than styled down. */}
                      <Delta value={h.change_pct} shown={(h.pct_outstanding || 0) >= MIN_PCT_OUTSTANDING} />
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cf-text7)' }}>{fmtDate(h.filed)}</span>
                      <FormBadge form={h.source_form} small />
                    </span>
                  </div>
                ))}
              </div>
              <Note>
                Таблица целиком собрана из квартальных форм — она такая же несвежая, как и всё
                остальное на этом экране. Ранний вход отслеживаемого фонда виден по знаку
                <ArrowRight size={9} style={{ verticalAlign: -1, margin: '0 3px' }} />
                колонке «Δ акций» относительно крупных пассивных держателей: они меняются медленно.
              </Note>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// Below a tenth of a percent of shares outstanding, a % change says nothing.
const MIN_PCT_OUTSTANDING = 0.001;

const num = { fontSize: 10.5, fontFamily: MONO, color: 'var(--cf-text3)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

function Head({ children }) {
  return (
    <div style={{
      fontSize: 10, fontFamily: MONO, fontWeight: 800, color: 'var(--cf-text2)',
      textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: 10,
    }}>{children}</div>
  );
}
function Note({ children }) {
  return (
    <div style={{ marginTop: 10, fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text7)', lineHeight: 1.6 }}>
      {children}
    </div>
  );
}
