// All the research-bundle sections rendered below the detail hero/body.
// Each sub-section is internal here so we keep the file count sane while
// still letting YCDetail compose them in a clean reading order.
import React from 'react';
import {
  CircleDollarSign, Activity, ShieldCheck, Globe2, Swords, AlertTriangle,
  Clock, Calculator, Quote, HelpCircle, Link2, ExternalLink,
  Users, ArrowUpRight,
} from 'lucide-react';

const TITLE_LABELS = {
  funding:       'Финансирование',
  traction:      'Тракшен',
  team:          'Команда',
  moat:          'Защитный ров',
  market:        'Рынок · Why now',
  competition:   'Конкуренция',
  risks:         'Риски',
  momentum:      'Momentum · хронология',
  unitEconomics: 'Юнит-экономика',
  customerVoice: 'Голос клиента',
  dataGaps:      'Пробелы в данных',
  sources:       'Источники',
};

const POSITION_LABELS = {
  leader:    'Лидер',
  contender: 'Претендент',
  challenger:'Челленджер',
  follower:  'Последователь',
  niche:     'Ниша',
};

const SEVERITY_STYLES = {
  high:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.40)',  label: 'высокий' },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.40)', label: 'средний' },
  low:      { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.40)', label: 'низкий'  },
};

const RISK_CATEGORY_LABELS = {
  market:    'рынок',
  technical: 'технологии',
  team:      'команда',
  financial: 'финансы',
  regulatory:'регуляторика',
  execution: 'execution',
};

const MOMENTUM_TYPE_LABELS = {
  product:   'продукт',
  funding:   'раунд',
  hiring:    'найм',
  customer:  'клиент',
  partnership:'партнёрство',
  press:     'пресса',
  milestone: 'веха',
};

const HIRING_VELOCITY_LABELS = {
  fast:    'быстрый',
  steady:  'устойчивый',
  slow:    'медленный',
  paused:  'на паузе',
};

const fmtUsd = (n) => n == null ? '—' : `$${Number(n).toLocaleString('en-US')}`;
const fmtPct = (n) => n == null ? '—' : `${n}%`;
const fmtDate = (s) => {
  if (!s) return '—';
  try {
    const d = new Date(s);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return s; }
};

export default function YCResearchSections({ research }) {
  if (!research) {
    return (
      <div style={{
        marginTop: 36, padding: '24px',
        background: '#0d0d0e', border: '1px solid #18181b',
        borderRadius: 12, textAlign: 'center',
        color: '#71717a', fontSize: 13,
      }}>
        Исследование по этой компании ещё не загружено.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Row 1 — Funding + Traction */}
      <Row>
        <FundingSection data={research.funding} />
        <TractionSection data={research.traction} />
      </Row>

      {/* Row 2 — Moat + Market (why-now) */}
      <Row>
        <MoatSection data={research.moat} />
        <MarketSection data={research.market} />
      </Row>

      {/* Row 3 — Competition + Team summary */}
      <Row>
        <CompetitionSection data={research.competition} />
        <TeamSection data={research.team} />
      </Row>

      {/* Full-width: founders pedigree cards */}
      {research.team?.founders?.length > 0 && (
        <FoundersBlock founders={research.team.founders} />
      )}

      {/* Full-width: risks */}
      {research.risks?.length > 0 && <RisksSection risks={research.risks} />}

      {/* Full-width: momentum timeline */}
      {research.momentum?.length > 0 && <MomentumSection events={research.momentum} />}

      {/* Row: unit economics + customer voice */}
      <Row>
        <UnitEconomicsSection data={research.unit_economics} />
        <CustomerVoiceSection data={research.customer_voice} />
      </Row>

      {/* Row: data gaps + sources */}
      <Row>
        <DataGapsSection gaps={research.data_gaps} />
        <SourcesSection sources={research.sources} />
      </Row>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────────────────
function Row({ children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      gap: 16,
    }}>
      {children}
    </div>
  );
}

function Card({ icon: Icon, title, children, accent = '#a1a1aa' }) {
  return (
    <section style={{
      background: '#0d0d0e',
      border: '1px solid #18181b',
      borderRadius: 12,
      padding: '18px 20px 20px',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `${accent}14`,
            border: `1px solid ${accent}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={14} style={{ color: accent }} />
          </div>
        )}
        <h3 style={{
          margin: 0, fontSize: 11.5, color: '#a1a1aa', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.14em',
          fontFamily: 'ui-monospace,monospace',
        }}>
          {title}
        </h3>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

function KV({ label, value, mono = false, accent = '#e4e4e7' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
      <span style={{ fontSize: 11.5, color: '#71717a', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{
        fontSize: 12.5, color: accent, textAlign: 'right',
        fontFamily: mono ? 'ui-monospace,monospace' : 'inherit',
        fontWeight: mono ? 600 : 500,
      }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function Tag({ text, color = '#a1a1aa', bg = '#18181b', border = '#27272a', small = false }) {
  return (
    <span style={{
      fontSize: small ? 10 : 10.5,
      color,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 4,
      padding: '3px 8px',
      fontFamily: 'ui-monospace,monospace',
      fontWeight: 600,
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );
}

function Note({ children }) {
  return (
    <div style={{
      fontSize: 11, color: '#71717a', fontStyle: 'italic',
      lineHeight: 1.6, paddingTop: 4,
      borderTop: '1px dashed #18181b',
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Section implementations
// ─────────────────────────────────────────────────────────────────────────
function FundingSection({ data }) {
  if (!data) return null;
  return (
    <Card icon={CircleDollarSign} title={TITLE_LABELS.funding} accent="#10b981">
      <KV label="Всего поднято" value={fmtUsd(data.total_raised_usd)} mono />
      <KV label="Последний раунд" value={data.last_round_stage || '—'} />
      <KV label="Размер раунда" value={fmtUsd(data.last_round_amount_usd)} mono />
      <KV label="Post-money" value={fmtUsd(data.last_round_post_money_valuation_usd)} mono />
      <KV label="Дата раунда" value={fmtDate(data.last_round_date)} mono />
      <KV label="Lead" value={data.last_round_lead_investor || '—'} />
      {data.all_investors?.length > 0 && (
        <div>
          <div style={{ fontSize: 11.5, color: '#71717a', marginBottom: 6 }}>Все инвесторы</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.all_investors.map((inv, i) => <Tag key={i} text={inv} small />)}
          </div>
        </div>
      )}
      {data.notes && <Note>{data.notes}</Note>}
    </Card>
  );
}

function TractionSection({ data }) {
  if (!data) return null;
  return (
    <Card icon={Activity} title={TITLE_LABELS.traction} accent="#22D3EE">
      <KV label="Метрика" value={data.primary_metric_type || '—'} />
      <KV label="Значение" value={data.primary_metric_value || '—'} />
      <KV label="Рост" value={data.growth_rate || '—'} mono />
      {data.notable_customers?.length > 0 && (
        <div>
          <div style={{ fontSize: 11.5, color: '#71717a', marginBottom: 6 }}>Заметные клиенты</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.notable_customers.map((c, i) => <Tag key={i} text={c} small />)}
          </div>
        </div>
      )}
      {data.milestones && (
        <div style={{ fontSize: 12.5, color: '#d4d4d8', lineHeight: 1.65, paddingTop: 4 }}>
          {data.milestones}
        </div>
      )}
      {data.notes && <Note>{data.notes}</Note>}
    </Card>
  );
}

function MoatSection({ data }) {
  if (!data) return null;
  return (
    <Card icon={ShieldCheck} title={TITLE_LABELS.moat} accent="#a78bfa">
      {data.summary && (
        <div style={{ fontSize: 13, color: '#e4e4e7', lineHeight: 1.7, fontWeight: 500 }}>
          {data.summary}
        </div>
      )}
      {data.moat_type?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {data.moat_type.map((m, i) => (
            <Tag key={i} text={m}
              color="#a78bfa"
              bg="rgba(167,139,250,0.10)"
              border="rgba(167,139,250,0.35)" />
          ))}
        </div>
      )}
      {data.differentiation && (
        <div style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.65, paddingTop: 4, borderTop: '1px dashed #18181b' }}>
          {data.differentiation}
        </div>
      )}
    </Card>
  );
}

function MarketSection({ data }) {
  if (!data) return null;
  return (
    <Card icon={Globe2} title={TITLE_LABELS.market} accent="#0ea5e9">
      <KV label="Сектор" value={data.sector || '—'} />
      <KV label="Под-сектор" value={data.sub_sector || '—'} />
      <KV label="TAM" value={data.tam_usd ? fmtUsd(data.tam_usd) : '—'} mono />
      <KV label="Источник TAM" value={data.tam_source || '—'} />
      <KV label="Рост рынка" value={data.market_growth_rate || '—'} mono />
      {data.why_now && (
        <div>
          <div style={{
            fontSize: 9.5, color: '#0ea5e9', fontWeight: 700,
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.14em', marginBottom: 6, marginTop: 4,
            textTransform: 'uppercase',
          }}>Why now</div>
          <div style={{ fontSize: 12, color: '#d4d4d8', lineHeight: 1.65 }}>
            {data.why_now}
          </div>
        </div>
      )}
    </Card>
  );
}

function CompetitionSection({ data }) {
  if (!data) return null;
  const positionLabel = POSITION_LABELS[data.competitive_position] || data.competitive_position || '—';
  return (
    <Card icon={Swords} title={TITLE_LABELS.competition} accent="#f59e0b">
      <KV label="Позиция" value={positionLabel} />
      {data.direct_competitors?.length > 0 && (
        <div>
          <div style={{ fontSize: 11.5, color: '#71717a', marginBottom: 6 }}>Прямые конкуренты</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.direct_competitors.map((c, i) => <Tag key={i} text={c} small />)}
          </div>
        </div>
      )}
      {data.competitive_notes && (
        <div style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.65, paddingTop: 4 }}>
          {data.competitive_notes}
        </div>
      )}
    </Card>
  );
}

function TeamSection({ data }) {
  if (!data) return null;
  const velocityLabel = HIRING_VELOCITY_LABELS[data.hiring_velocity] || data.hiring_velocity || '—';
  return (
    <Card icon={Users} title={TITLE_LABELS.team} accent="#ec4899">
      <KV label="Команда сейчас" value={data.headcount_current ?? '—'} mono />
      <KV label="6 мес. назад" value={data.headcount_6mo_ago ?? '—'} mono />
      <KV label="Темп найма" value={velocityLabel} />
      {data.key_hires?.length > 0 && (
        <div>
          <div style={{ fontSize: 11.5, color: '#71717a', marginBottom: 6 }}>Ключевые наймы</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.key_hires.map((h, i) => <Tag key={i} text={typeof h === 'string' ? h : h.name} small />)}
          </div>
        </div>
      )}
    </Card>
  );
}

function FoundersBlock({ founders }) {
  return (
    <section style={{
      background: '#0d0d0e', border: '1px solid #18181b',
      borderRadius: 12, padding: '20px 22px',
    }}>
      <div style={{
        fontSize: 11.5, color: '#a1a1aa', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.14em',
        fontFamily: 'ui-monospace,monospace',
        marginBottom: 14,
      }}>
        Основатели · pedigree
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
      }}>
        {founders.map((f, i) => (
          <article key={i} style={{
            background: '#18181b', border: '1px solid #27272a',
            borderRadius: 8, padding: '14px 14px 12px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <header>
              {f.linkedin ? (
                <a
                  href={f.linkedin} target="_blank" rel="noopener noreferrer"
                  style={{
                    color: '#fafafa', fontSize: 14, fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
                  onMouseLeave={e => e.currentTarget.style.color = '#fafafa'}
                >
                  {f.name}
                  <ArrowUpRight size={12} style={{ flexShrink: 0 }} />
                </a>
              ) : (
                <span style={{ color: '#fafafa', fontSize: 14, fontWeight: 700 }}>{f.name}</span>
              )}
              {f.role && (
                <div style={{
                  fontSize: 10.5, color: '#71717a',
                  fontFamily: 'ui-monospace,monospace',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  marginTop: 2, fontWeight: 600,
                }}>{f.role}</div>
              )}
            </header>
            {f.pedigree_tags?.length > 0 && (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {f.pedigree_tags.map((t, j) => (
                  <li key={j} style={{
                    fontSize: 11.5, color: '#d4d4d8', lineHeight: 1.55,
                    paddingLeft: 12, position: 'relative',
                  }}>
                    <span style={{ position: 'absolute', left: 0, color: '#52525b' }}>·</span>
                    {t}
                  </li>
                ))}
              </ul>
            )}
            {f.prior_exits && (
              <div style={{ fontSize: 11, color: '#71717a', fontStyle: 'italic', marginTop: 2 }}>
                Прошлые экзиты: {f.prior_exits}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function RisksSection({ risks }) {
  return (
    <Card icon={AlertTriangle} title={TITLE_LABELS.risks} accent="#ef4444">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {risks.map((r, i) => {
          const s = SEVERITY_STYLES[r.severity] || SEVERITY_STYLES.medium;
          const catLabel = RISK_CATEGORY_LABELS[r.category] || r.category;
          return (
            <div key={i} style={{
              display: 'flex', gap: 12,
              padding: '12px 14px',
              background: '#18181b', border: '1px solid #27272a',
              borderLeft: `3px solid ${s.color}`,
              borderRadius: 6,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, minWidth: 88 }}>
                <span style={{
                  fontSize: 9.5, color: s.color, background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 3, padding: '2px 6px',
                  fontFamily: 'ui-monospace,monospace',
                  fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}>{s.label}</span>
                {catLabel && (
                  <span style={{ fontSize: 10, color: '#71717a',
                    fontFamily: 'ui-monospace,monospace',
                    letterSpacing: '0.06em', textAlign: 'center',
                  }}>{catLabel}</span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: '#d4d4d8', lineHeight: 1.6 }}>{r.risk}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function MomentumSection({ events }) {
  const sorted = [...events].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  return (
    <Card icon={Clock} title={TITLE_LABELS.momentum} accent="#22D3EE">
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {sorted.map((e, i) => {
          const last = i === sorted.length - 1;
          return (
            <li key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', paddingBottom: last ? 0 : 14 }}>
              {/* timeline rail */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                flexShrink: 0, minWidth: 14,
              }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#22D3EE',
                  boxShadow: '0 0 6px rgba(34,211,238,0.55)',
                  marginTop: 4,
                }} />
                {!last && <span style={{ flex: 1, width: 2, background: '#27272a', marginTop: 4 }} />}
              </div>
              {/* content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11, color: '#71717a',
                  fontFamily: 'ui-monospace,monospace',
                  letterSpacing: '0.06em', marginBottom: 4,
                  display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
                }}>
                  <span>{fmtDate(e.date)}</span>
                  {e.type && (
                    <span style={{ color: '#a78bfa', textTransform: 'uppercase', fontWeight: 700 }}>
                      · {MOMENTUM_TYPE_LABELS[e.type] || e.type}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: '#e4e4e7', lineHeight: 1.6 }}>
                  {e.event}
                  {e.source_url && (
                    <a
                      href={e.source_url} target="_blank" rel="noopener noreferrer"
                      style={{
                        color: '#71717a', marginLeft: 8,
                        textDecoration: 'none',
                        display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle',
                      }}
                      title={e.source_url}
                      onMouseEnter={ev => ev.currentTarget.style.color = '#fafafa'}
                      onMouseLeave={ev => ev.currentTarget.style.color = '#71717a'}
                    >
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function UnitEconomicsSection({ data }) {
  if (!data) return null;
  return (
    <Card icon={Calculator} title={TITLE_LABELS.unitEconomics} accent="#84cc16">
      <KV label="Gross margin" value={fmtPct(data.gross_margin_pct)} mono />
      <KV label="CAC payback" value={data.cac_payback_months != null ? `${data.cac_payback_months} мес` : '—'} mono />
      <KV label="LTV / CAC" value={data.ltv_cac_ratio != null ? `${data.ltv_cac_ratio}×` : '—'} mono />
      <KV label="NRR" value={fmtPct(data.nrr_pct)} mono />
      <KV label="Burn/мес" value={fmtUsd(data.burn_monthly_usd)} mono />
      <KV label="Runway" value={data.runway_months != null ? `${data.runway_months} мес` : '—'} mono />
      {data.notes && <Note>{data.notes}</Note>}
    </Card>
  );
}

function CustomerVoiceSection({ data }) {
  if (!data) return null;
  const hasAny = data.g2_rating != null || data.product_hunt_score != null
    || (data.notable_quotes?.length > 0);
  return (
    <Card icon={Quote} title={TITLE_LABELS.customerVoice} accent="#fb923c">
      {!hasAny && (
        <div style={{ fontSize: 11.5, color: '#71717a', fontStyle: 'italic' }}>
          Публичных отзывов и оценок пока нет.
        </div>
      )}
      {data.g2_rating != null && <KV label="G2 rating" value={`${data.g2_rating} / 5`} mono />}
      {data.product_hunt_score != null && <KV label="Product Hunt" value={`#${data.product_hunt_score}`} mono />}
      {data.notable_quotes?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
          {data.notable_quotes.map((q, i) => (
            <blockquote key={i} style={{
              margin: 0, padding: '10px 12px',
              background: '#18181b', border: '1px solid #27272a',
              borderLeft: '3px solid #fb923c',
              borderRadius: 6,
              fontSize: 12, color: '#d4d4d8', lineHeight: 1.6,
              fontStyle: 'italic',
            }}>
              «{typeof q === 'string' ? q : q.quote || q.text}»
              {typeof q !== 'string' && q.author && (
                <div style={{ marginTop: 6, fontStyle: 'normal', fontSize: 11, color: '#71717a' }}>
                  — {q.author}
                </div>
              )}
            </blockquote>
          ))}
        </div>
      )}
    </Card>
  );
}

function DataGapsSection({ gaps }) {
  if (!gaps || gaps.length === 0) return null;
  return (
    <Card icon={HelpCircle} title={TITLE_LABELS.dataGaps} accent="#71717a">
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {gaps.map((g, i) => (
          <li key={i} style={{
            fontSize: 12, color: '#a1a1aa', lineHeight: 1.55,
            paddingLeft: 14, position: 'relative',
          }}>
            <span style={{ position: 'absolute', left: 0, color: '#52525b' }}>·</span>
            {g}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SourcesSection({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <Card icon={Link2} title={TITLE_LABELS.sources} accent="#60a5fa">
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sources.map((s, i) => (
          <li key={i}>
            <a
              href={s.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: '#60a5fa', textDecoration: 'none',
                wordBreak: 'break-all',
              }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              <ExternalLink size={11} style={{ flexShrink: 0, color: '#3f3f46' }} />
              {s.label || s.url}
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
