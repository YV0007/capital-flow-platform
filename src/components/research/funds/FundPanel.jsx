// ══════════════════════════════════════════════════════════════════════════
// FundPanel — the whole picture of one fund, one click deep.
//
// HARD RULE: numbers, not prose. Nothing on this panel is generated. The only
// sentences here are `why_tracked` / `focus` / `strategy` and a stake's Item 4
// intent — all written once, upstream, and rendered verbatim. No commentary,
// no hedging, no filler.
//
// Order is fixed and deliberate: who this is and HOW OLD the data is, then
// what they hold, then what changed, then how much conviction that change
// carries, then the two highest-information disclosures (stakes, shorts),
// then the record, then the one line that makes the fund memorable.
// ══════════════════════════════════════════════════════════════════════════

import { X, Flame, Layers } from 'lucide-react';
import {
  ACTION_META, deltaSuppressedNote, MIN_WEIGHT_FOR_DELTA,
  sectorLabel, themeLabel,
} from '../../../data/fundTracker.js';
import {
  fmtUSD, fmtPct, fmtShares, fmtDate, fmtQuarters, fmtReturn, fmtLatency, plural,
} from './fundFormat.js';
import {
  MONO, hexA, LatencyBadge, FormBadge, Chip, Delta, SourceLink, SparseFlag, Label, Stat, FundMark, useTone,
} from './FundBits.jsx';

export default function FundPanel({ fund, onClose, onOpenSecurity, width = 560, top = 0 }) {
  const tint = useTone();
  if (!fund) return null;
  const c = tint(fund.styleMeta?.color || 'var(--cf-text3)');

  return (
    // Starts BELOW the top bar rather than over it: the view switch, search
    // and filters have to stay reachable with a fund open.
    <aside style={{
      position: 'absolute', top, right: 0, bottom: 0, zIndex: 40,
      width: `min(${width}px, 100vw)`,
      background: 'var(--cf-panel)', backdropFilter: 'blur(14px)',
      borderLeft: '1px solid var(--cf-border)',
      boxShadow: '-24px 0 60px -24px var(--cf-shadow)',
      overflowY: 'auto',
      animation: 'cfmSlide 170ms ease-out',
    }}>
      <Identity fund={fund} color={c} onClose={onClose} />

      <div style={{ padding: '0 20px 60px', display: 'flex', flexDirection: 'column', gap: 26 }}>
        {fund.isWatch
          ? <Triggers fund={fund} onOpenSecurity={onOpenSecurity} />
          : (
            <>
              <Positioning fund={fund} onOpenSecurity={onOpenSecurity} />
              <Activity fund={fund} onOpenSecurity={onOpenSecurity} />
              <Conviction fund={fund} onOpenSecurity={onOpenSecurity} />
              <Stakes fund={fund} />
              <Shorts fund={fund} />
              <TrackRecord fund={fund} />
            </>
          )}
        <WhyTracked fund={fund} color={c} />
        <Rollup fund={fund} />
      </div>
    </aside>
  );
}

// ── identity strip — the latency badge is the loudest thing on it ────────
function Identity({ fund, color, onClose }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 2,
      padding: '14px 20px 13px', background: 'var(--cf-panel)',
      borderBottom: '1px solid var(--cf-border-soft)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <FundMark fund={fund} size={40} radius={9} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cf-text0)', lineHeight: 1.2 }}>
            {fund.short_name}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 4 }}>
            {fund.name}
          </div>
        </div>
        <button onClick={onClose} aria-label="Закрыть"
          style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 2, lineHeight: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 11, alignItems: 'center' }}>
        {fund.principal && (
          <span style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--cf-text3)' }}>{fund.principal}</span>
        )}
        <Chip color={color} title={fund.styleMeta?.blurb}>{fund.styleMeta?.label}</Chip>
        {fund.isWatch && <Chip color="#64748B" title="Не отслеживается целиком — только сработавшие правила.">Наблюдение</Chip>}
        {fund.sparse_coverage && <SparseFlag inline />}
      </div>

      {/* Mandatory and prominent: a 13F line may be four and a half months old. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        marginTop: 12, padding: '9px 11px',
        background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 8,
      }}>
        <LatencyBadge days={fund.latency_days} asOf={fund.as_of} form={fund.source_form} size="lg" />
        <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--cf-text5)' }}>
          срез на {fmtDate(fund.as_of)} · подано {fmtDate(fund.filed)}
        </span>
        <span style={{ marginLeft: 'auto' }}><FormBadge form={fund.source_form} /></span>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 13,
      }}>
        <Stat label="Книга" value={fmtUSD(fund.book_value_usd)}
          sub={`${fund.position_count} ${plural(fund.position_count, ['позиция', 'позиции', 'позиций'])}`}
          title="Стоимость раскрытой книги на дату среза." />
        <Stat label="AUM" value={fund.aum_usd ? fmtUSD(fund.aum_usd) : '—'}
          sub={fund.aum_usd ? 'под управлением' : 'не раскрывается'}
          title="Капитал фирмы. Раскрытая книга почти всегда меньше: долг, частные сделки и деривативы в 13F не попадают." />
        <Stat label="Убеждённость" value={fund.conviction ? fund.conviction.score : '—'}
          sub={fund.conviction ? 'из 100' : 'не считается'}
          color={fund.conviction ? 'var(--cf-accent)' : undefined}
          title="Оценка движка: концентрация, срок держания, оборот и доборы на просадке — в одном числе." />
      </div>
    </div>
  );
}

// ── positioning ──────────────────────────────────────────────────────────
function Positioning({ fund, onOpenSecurity }) {
  const rows = fund.livePositions.slice().sort((a, b) => b.weight - a.weight);
  if (!rows.length) return null;
  return (
    <Section title="Книга" caption={`${rows.length} ${plural(rows.length, ['позиция', 'позиции', 'позиций'])} · по весу`}>
      {/* Шапка. До неё колонки читались только по догадке: «62%» — это вес или
          доля класса? «5к» — что именно? Подписи снимают вопрос, не отнимая
          места у строк: 9px, разрядка, приглушённый цвет. */}
      <ColumnHeads />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {rows.map(p => (
          <button key={p.ticker + p.instrument} onClick={() => onOpenSecurity?.(p.ticker)}
            title={`${p.issuer}\n${sectorLabel(p.sector)} · ${themeLabel(p.theme)}\nОткрыть таблицу держателей`}
            style={{
              display: 'grid', gridTemplateColumns: '62px 1fr 96px 52px 62px 66px 34px',
              alignItems: 'center', gap: 8, padding: '7px 8px',
              background: 'transparent', border: 'none', borderRadius: 6,
              cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <span style={{
                fontSize: 11, fontFamily: MONO, fontWeight: 800, color: 'var(--cf-text1)',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{p.ticker}</span>
              {p.jurisdiction !== 'US' && (
                <span title={`${p.jurMeta.label} — вне периметра 13F`} style={{ fontSize: 9, cursor: 'help' }}>{p.jurMeta.flag}</span>
              )}
            </span>
            <span style={{
              fontSize: 10.5, color: 'var(--cf-text4)', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{p.issuer}</span>
            {/* Сектор эмитента. Пусто — значит слой идентичности его не разрешил;
                прочерк честнее подставленного «прочее». */}
            <span style={{
              fontSize: 9.5, color: 'var(--cf-text5)', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{p.sector ? sectorLabel(p.sector) : '—'}</span>
            <span style={{
              fontSize: 11, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text0)',
              textAlign: 'right', fontVariantNumeric: 'tabular-nums',
            }}>{fmtPct(p.weight)}</span>
            <span style={{
              fontSize: 10, fontFamily: MONO, color: 'var(--cf-text4)',
              textAlign: 'right', fontVariantNumeric: 'tabular-nums',
            }}>{fmtShares(p.shares)}</span>
            <span style={{
              fontSize: 10, fontFamily: MONO, color: 'var(--cf-text3)',
              textAlign: 'right', fontVariantNumeric: 'tabular-nums',
            }}>{fmtUSD(p.value_usd)}</span>
            <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 3 }}>
              {p.instrumentMeta.derivative && (
                <Chip color={p.instrumentMeta.color} small title={p.instrumentMeta.blurb}>
                  {p.instrumentMeta.short}
                </Chip>
              )}
              <span title={`${p.quarters_held} ${plural(p.quarters_held, ['квартал', 'квартала', 'кварталов'])} в книге`}
                style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text7)', cursor: 'help' }}>
                {p.quarters_held}к
              </span>
            </span>
          </button>
        ))}
      </div>
      <FootNote>
        Строка кликается — откроется полная таблица институциональных держателей имени.
        Все веса — на дату среза; о сделках после неё фонд сообщать не обязан.
      </FootNote>
    </Section>
  );
}

// ── column heads — the grid template is duplicated below on purpose: the
// header and the rows must move together, and a shared constant that one of
// them silently stops using is worse than two lines that diff side by side.
function ColumnHeads() {
  const cells = [
    ['Тикер', 'left'], ['Эмитент', 'left'], ['Сектор', 'left'],
    ['Вес', 'right'], ['Акций', 'right'], ['Стоимость', 'right'], ['Кв.', 'right'],
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '62px 1fr 96px 52px 62px 66px 34px',
      gap: 8, padding: '0 8px 5px', borderBottom: '1px solid var(--cf-line)',
      marginBottom: 3,
    }}>
      {cells.map(([label, align]) => (
        <span key={label} style={{
          fontSize: 8.5, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.09em',
          textTransform: 'uppercase', color: 'var(--cf-text7)', textAlign: align,
        }}>{label}</span>
      ))}
    </div>
  );
}


// ── activity — four groups, counts AND names ─────────────────────────────
function Activity({ fund, onOpenSecurity }) {
  const tint = useTone();
  const a = fund.activity;
  if (!a) return null;
  const groups = ['new', 'added', 'trimmed', 'exited'].map(k => ({
    key: k, meta: { ...ACTION_META[k], color: tint(ACTION_META[k].color) }, list: a[k] || [],
  }));
  const byTicker = Object.fromEntries(fund.positions.map(p => [p.ticker, p]));

  return (
    <Section title="Движение за период" caption={`${fmtDate(fund.as_of)} · ${fmtLatency(fund.latency_days)}`}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {groups.map(g => (
          <div key={g.key} style={{
            padding: '10px 11px', background: 'var(--cf-surface1)',
            border: `1px solid ${hexA(g.meta.color, 0.24)}`, borderRadius: 9,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 8 }}>
              <span style={{
                fontSize: 9, fontFamily: MONO, fontWeight: 800, color: g.meta.color,
                textTransform: 'uppercase', letterSpacing: '0.11em',
              }}>{g.meta.label}</span>
              <span style={{
                fontSize: 13, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text0)',
                marginLeft: 'auto', fontVariantNumeric: 'tabular-nums',
              }}>{g.list.length}</span>
            </div>
            {g.list.length === 0
              ? <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text8)' }}>—</div>
              : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {g.list.map(t => {
                    const p = byTicker[t];
                    return (
                      <button key={t} onClick={() => onOpenSecurity?.(t)}
                        title={p ? `${p.issuer}\nВес ${fmtPct(p.weight)}${p.deltaShown && p.share_delta_pct != null ? ` · по акциям ${fmtPct(p.share_delta_pct, 1)}` : ''}` : t}
                        style={{
                          padding: '2px 6px', background: hexA(g.meta.color, 0.10),
                          border: `1px solid ${hexA(g.meta.color, 0.28)}`, borderRadius: 4,
                          color: 'var(--cf-text2)', fontSize: 9.5, fontFamily: MONO, fontWeight: 700,
                          cursor: 'pointer',
                        }}>{t}</button>
                    );
                  })}
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Every changed line, with the share-based delta and its guard. */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {fund.positions
          .filter(p => p.action !== 'hold')
          .sort((a2, b2) => (ACTION_META[a2.action].order - ACTION_META[b2.action].order) || b2.weight - a2.weight)
          .map(p => (
            <div key={`chg-${p.ticker}-${p.instrument}`} style={{
              display: 'grid', gridTemplateColumns: '58px 46px 1fr 68px 58px',
              alignItems: 'center', gap: 8, padding: '6px 8px',
            }}>
              <span style={{ fontSize: 10.5, fontFamily: MONO, fontWeight: 800, color: 'var(--cf-text1)' }}>{p.ticker}</span>
              <Chip color={p.actionMeta.color} small title={p.actionMeta.blurb}>{p.actionMeta.short}</Chip>
              <span style={{
                fontSize: 10, color: 'var(--cf-text5)', fontFamily: MONO,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {p.action === 'exited'
                  ? `было ${fmtShares(p.prior_shares)}`
                  : p.action === 'new'
                    ? `${fmtShares(p.shares)} · ${fmtPct(p.weight)}`
                    : `${fmtShares(p.prior_shares)} → ${fmtShares(p.shares)}`}
              </span>
              <span style={{ textAlign: 'right' }}>
                <Delta value={p.share_delta_pct} shown={p.deltaShown} weight={p.weight} />
              </span>
              {/* Guard 2: a "new position" flag never renders without its age. */}
              <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <LatencyBadge days={p.latency_days} asOf={p.as_of} form={p.source_form} />
              </span>
            </div>
          ))}
      </div>
      <FootNote>
        Доборы и сокращения считаются <b>по числу акций</b>, а не по деньгам — иначе движение цены
        читалось бы как сделка. Изменение на позиции легче {fmtPct(MIN_WEIGHT_FOR_DELTA, 1)} книги
        не показывается: {deltaSuppressedNote().toLowerCase()}
      </FootNote>
    </Section>
  );
}

// ── conviction ───────────────────────────────────────────────────────────
function Conviction({ fund, onOpenSecurity }) {
  const hot = useTone()('#FF6B6B');
  const c = fund.conviction;
  if (!c) return null;
  const weak = c.added_into_weakness || [];
  const byTicker = Object.fromEntries(fund.positions.map(p => [p.ticker, p]));

  return (
    <Section title="Убеждённость">
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
        padding: '12px 13px', background: 'var(--cf-surface1)',
        border: '1px solid var(--cf-border-soft)', borderRadius: 9,
      }}>
        <Stat label="Оценка" value={c.score} color="var(--cf-accent)"
          title="Сводная оценка движка, 0–100." />
        <Stat label="Топ-10" value={fmtPct(c.top10_concentration, 0)}
          title="Доля книги в десяти крупнейших позициях." />
        <Stat label="Срок" value={fmtQuarters(c.avg_persistence_quarters)}
          title="Средний срок держания позиции, в кварталах." />
        <Stat label="Оборот" value={fmtPct(c.turnover, 0)}
          title="Доля книги, сменившаяся за период." />
      </div>

      {/* The strongest single tell in the dataset — so it gets real weight. */}
      <div style={{
        marginTop: 12, padding: '12px 13px',
        background: hexA(hot, 0.06), border: '1px solid ' + hexA(hot, 0.30),
        borderRadius: 9,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
          <Flame size={12} style={{ color: hot }} />
          <span style={{
            fontSize: 10, fontFamily: MONO, fontWeight: 800, color: hot,
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>Добор на просадке</span>
          <span style={{
            marginLeft: 'auto', fontSize: 13, fontFamily: MONO, fontWeight: 700,
            color: 'var(--cf-text0)',
          }}>{weak.length}</span>
        </div>
        {weak.length === 0
          ? <div style={{ fontSize: 10.5, color: 'var(--cf-text6)', fontFamily: MONO }}>
              Ни одной позиции не докупали, пока она падала.
            </div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {weak.map(t => {
                const p = byTicker[t];
                return (
                  <button key={`w-${t}`} onClick={() => onOpenSecurity?.(t)}
                    style={{
                      display: 'grid', gridTemplateColumns: '58px 1fr 62px 58px',
                      alignItems: 'center', gap: 8, padding: '5px 6px', width: '100%',
                      background: 'transparent', border: 'none', borderRadius: 5,
                      cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontSize: 10.5, fontFamily: MONO, fontWeight: 800, color: 'var(--cf-text1)' }}>{t}</span>
                    <span style={{
                      fontSize: 10, color: 'var(--cf-text5)', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{p?.issuer || ''}</span>
                    <span style={{ textAlign: 'right' }}>
                      <Delta value={p?.share_delta_pct} shown={p?.deltaShown} />
                    </span>
                    <span style={{
                      textAlign: 'right', fontSize: 10, fontFamily: MONO, fontWeight: 700,
                      color: 'var(--cf-bad)', fontVariantNumeric: 'tabular-nums',
                    }} title="Изменение цены за период">
                      {p ? fmtPct(p.price_change_pct_in_period, 0) : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        <FootNote style={{ marginTop: 9 }}>
          Позиции, которые фонд увеличивал, пока они падали. Единственное движение в этих данных,
          которое нельзя объяснить инерцией или ребалансировкой.
        </FootNote>
      </div>
    </Section>
  );
}

// ── stakes & intent — the highest-information rows in the section ────────
function Stakes({ fund }) {
  const tint = useTone();
  const list = fund.stakes || [];
  if (!list.length) return null;
  return (
    <Section title="Доли и намерение" caption={`${list.length} ${plural(list.length, ['форма', 'формы', 'форм'])} 13D/13G`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {list.map((s, i) => {
          const col = tint(s.activist ? '#FF6B6B' : '#C2A36B');
          return (
            <div key={i} style={{
              padding: '11px 12px',
              background: s.activist ? hexA(col, 0.06) : 'var(--cf-surface1)',
              border: `1px solid ${hexA(col, s.activist ? 0.34 : 0.20)}`,
              borderRadius: 9,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 7 }}>
                <FormBadge form={s.form} />
                {s.activist && <Chip color={col} small title="Заявлено намерение по Item 4 — активная форма.">АКТИВИСТ</Chip>}
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cf-text0)' }}>{s.issuer}</span>
                {s.ticker && <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--cf-text5)' }}>{s.ticker}</span>}
                <span style={{
                  marginLeft: 'auto', fontSize: 13, fontFamily: MONO, fontWeight: 700,
                  color: col, fontVariantNumeric: 'tabular-nums',
                }} title="Доля выпуска">{fmtPct(s.pct_outstanding)}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--cf-text2)', lineHeight: 1.55, marginBottom: 8 }}>
                {s.intent}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                <LatencyBadge days={s.latency_days} asOf={s.event_date} form={s.form} />
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text6)' }}>
                  событие {fmtDate(s.event_date)} · подано {fmtDate(s.filed)}
                </span>
                <span style={{ marginLeft: 'auto' }}><SourceLink url={s.source_url} /></span>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ── named shorts — rare, and therefore not buried ────────────────────────
function Shorts({ fund }) {
  const tint = useTone();
  const list = fund.shorts || [];
  if (!list.length) return null;
  const DIR = {
    new:       { label: 'открыта',   color: '#F87171' },
    increased: { label: 'увеличена', color: '#F87171' },
    decreased: { label: 'снижена',   color: '#34D399' },
    closed:    { label: 'закрыта',   color: '#34D399' },
  };
  return (
    <Section title="Названные шорты"
      caption="реестры EU/UK — то, чего 13F не показывает вовсе">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {list.map((s, i) => {
          const d = DIR[s.direction] || { label: s.direction, color: '#8B8B95' };
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 62px 74px 52px',
              alignItems: 'center', gap: 9, padding: '9px 10px',
              background: 'var(--cf-surface1)', borderRadius: 8,
              border: '1px solid var(--cf-border-hair)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span style={{ fontSize: 10 }}>{({ UK: '🇬🇧', DE: '🇩🇪', ES: '🇪🇸', FR: '🇫🇷' })[s.jurisdiction] || '🏳'}</span>
                <span style={{
                  fontSize: 11, color: 'var(--cf-text1)', fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{s.issuer}</span>
              </span>
              <span style={{
                fontSize: 12, fontFamily: MONO, fontWeight: 700, color: t('#F472B6'),
                textAlign: 'right', fontVariantNumeric: 'tabular-nums',
              }} title="Доля выпуска в короткой позиции">{fmtPct(s.pct_short, 2)}</span>
              <Chip color={d.color} small title={`${s.register} · ${fmtDate(s.as_of)}`}>{d.label}</Chip>
              <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <LatencyBadge days={s.latency_days} asOf={s.as_of} form="Short register" />
              </span>
            </div>
          );
        })}
      </div>
      <FootNote>
        Реестры обновляются ежедневно и раскрывают только позиции выше порога. Короткая нога
        в США не раскрывается вовсе — то, что здесь пусто, не означает, что шортов нет.
      </FootNote>
    </Section>
  );
}

// ── track record ─────────────────────────────────────────────────────────
function TrackRecord({ fund }) {
  const list = fund.returns || [];
  if (!list.length) return null;
  const max = Math.max(...list.map(r => Math.abs(r.pct || 0)), 1);
  return (
    <Section title="Доходность по годам">
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        {list.map(r => {
          const up = (r.pct || 0) >= 0;
          const h = Math.max(3, Math.round(Math.abs(r.pct || 0) / max * 52));
          return (
            <div key={r.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                fontSize: 9.5, fontFamily: MONO, fontWeight: 700,
                color: up ? 'var(--cf-good)' : 'var(--cf-bad)',
                fontVariantNumeric: 'tabular-nums',
              }}>{fmtReturn(r.pct)}</div>
              <div style={{ height: 56, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                <div title={r.provisional ? 'Год не закончен — цифра предварительная.' : `${r.year}: ${fmtReturn(r.pct)}`}
                  style={{
                    width: '100%', height: h, borderRadius: 3,
                    background: up ? hexA('#34D399', r.provisional ? 0.30 : 0.72) : hexA('#F87171', r.provisional ? 0.30 : 0.72),
                    border: r.provisional ? `1px dashed ${up ? 'var(--cf-good)' : 'var(--cf-bad)'}` : 'none',
                    cursor: 'help',
                  }} />
              </div>
              <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cf-text6)' }}>
                {String(r.year).slice(2)}
                {r.provisional && <span title="Предварительно — год не закончен" style={{ color: 'var(--cf-warn)' }}>*</span>}
              </div>
            </div>
          );
        })}
      </div>
      {fund.ytd && (
        <FootNote>
          <b style={{ color: 'var(--cf-warn)' }}>* {fund.ytd.year} — предварительно.</b> Год не закончен,
          цифра меняется до его конца и не сопоставима с закрытыми годами.
        </FootNote>
      )}
    </Section>
  );
}

// ── watch-only: triggers and nothing else ────────────────────────────────
function Triggers({ fund, onOpenSecurity }) {
  const hot = useTone()('#FF4A55');
  return (
    <Section title="Сработавшие правила"
      caption={`${fund.triggers.length} ${plural(fund.triggers.length, ['триггер', 'триггера', 'триггеров'])}`}>
      <div style={{
        padding: '10px 12px', marginBottom: 11,
        background: 'var(--cf-surface1)', border: '1px dashed var(--cf-border-dashed)', borderRadius: 8,
        fontSize: 10.5, color: 'var(--cf-text5)', lineHeight: 1.55,
      }}>
        Книга целиком не отслеживается: {fmtUSD(fund.book_value_usd)} в {fund.position_count.toLocaleString('ru-RU')} позициях —
        это инвентарь маркет-мейкера, а не мнение. Ниже только то, что прошло правило.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {fund.triggers.map((t, i) => (
          <div key={i} style={{
            padding: '11px 12px', background: hexA(hot, 0.05),
            border: '1px solid ' + hexA(hot, 0.30), borderRadius: 9,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 7 }}>
              <FormBadge form={t.form} />
              {t.ticker && (
                <button onClick={() => onOpenSecurity?.(t.ticker)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    fontSize: 11, fontFamily: MONO, fontWeight: 800, color: 'var(--cf-link)',
                  }}>{t.ticker}</button>
              )}
              {t.issuer && <span style={{ fontSize: 10.5, color: 'var(--cf-text4)' }}>{t.issuer}</span>}
              {t.magnitude_usd != null && (
                <span style={{
                  marginLeft: 'auto', fontSize: 12, fontFamily: MONO, fontWeight: 700,
                  color: 'var(--cf-text1)', fontVariantNumeric: 'tabular-nums',
                }}>{fmtUSD(t.magnitude_usd)}</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--cf-text2)', lineHeight: 1.55, marginBottom: 8 }}>
              {t.headline}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <LatencyBadge days={t.latency_days} asOf={t.event_date} form={t.form} />
              {t.pct_outstanding != null && (
                <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--cf-text3)' }}>
                  {fmtPct(t.pct_outstanding)} выпуска
                </span>
              )}
              <span style={{ marginLeft: 'auto' }}><SourceLink url={t.source_url} /></span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── the stored prose, verbatim ───────────────────────────────────────────
function WhyTracked({ fund, color }) {
  if (!fund.why_tracked && !fund.focus && !fund.strategy) return null;
  return (
    <Section title="Почему отслеживаем">
      <div style={{
        padding: '12px 13px', background: hexA(color, 0.05),
        border: `1px solid ${hexA(color, 0.26)}`, borderRadius: 9,
        fontSize: 11.5, color: 'var(--cf-text1)', lineHeight: 1.6,
      }}>{fund.why_tracked}</div>
      {(fund.focus || fund.strategy) && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {fund.focus && <Field label="Фокус" text={fund.focus} />}
          {fund.strategy && <Field label="Стратегия" text={fund.strategy} />}
        </div>
      )}
    </Section>
  );
}

function Field({ label, text }) {
  return (
    <div>
      <Label style={{ marginBottom: 4 }}>{label}</Label>
      <div style={{ fontSize: 11, color: 'var(--cf-text3)', lineHeight: 1.55 }}>{text}</div>
    </div>
  );
}

// ── entity rollup ────────────────────────────────────────────────────────
// Positions aggregate to the parent manager by default. A fund must never
// appear three times at a third of its real size, so the child entities are a
// drill-down, not separate nodes.
function Rollup({ fund }) {
  const list = fund.entities || [];
  if (list.length <= 1) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text7)',
      }}>
        <Layers size={10} />
        Одна отчитывающаяся сущность · CIK {fund.cik || '—'}
      </div>
    );
  }
  return (
    <Section title="Отчитывающиеся сущности" caption="позиции сведены к управляющему">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {list.map((e, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px',
            background: 'var(--cf-surface1)', borderRadius: 6,
          }}>
            <span style={{ fontSize: 10.5, color: 'var(--cf-text2)' }}>{e.name}</span>
            <span style={{ marginLeft: 'auto', fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text6)' }}>
              CIK {e.cik}
            </span>
            <Chip color={e.role === 'parent' ? '#38BDF8' : '#8B8B95'} small>
              {e.role === 'parent' ? 'родитель' : 'дочерняя'}
            </Chip>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── layout atoms ─────────────────────────────────────────────────────────
function Section({ title, caption, children }) {
  return (
    <section style={{ paddingTop: 18, borderTop: '1px solid var(--cf-border-hair)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 11 }}>
        <span style={{
          fontSize: 10, fontFamily: MONO, fontWeight: 800, color: 'var(--cf-text2)',
          textTransform: 'uppercase', letterSpacing: '0.13em',
        }}>{title}</span>
        {caption && (
          <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text7)' }}>{caption}</span>
        )}
      </div>
      {children}
    </section>
  );
}

function FootNote({ children, style }) {
  return (
    <div style={{
      marginTop: 10, fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO,
      lineHeight: 1.6, ...style,
    }}>{children}</div>
  );
}
