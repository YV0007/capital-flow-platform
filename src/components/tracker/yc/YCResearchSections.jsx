// Research sections rendered below the detail hero/body.
// Framed as a TRACKING view — we've already invested, we want to see how
// the company is doing. Empty fields are hidden everywhere (no "—"
// placeholders), and a section is only rendered if it has at least one
// meaningful value. Section titles are deliberately conversational so the
// reader can scan and immediately know what they're looking at.
import React from 'react';
import {
  CircleDollarSign, Activity, ShieldCheck, Globe2, Swords, AlertTriangle,
  Clock, ExternalLink, Users, ArrowUpRight,
} from 'lucide-react';

// ─ Empty helpers — used everywhere to drop the row/section ─────────────
const isNil   = (v) => v === null || v === undefined;
const isBlank = (v) => isNil(v) || (typeof v === 'string' && v.trim() === '');
const hasItems = (v) => Array.isArray(v) && v.length > 0;

// ─ Formatters ────────────────────────────────────────────────────────────
const fmtUsdCompact = (n) => {
  if (isNil(n)) return null;
  const num = Number(n);
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(num >= 10_000_000_000 ? 0 : 1)}B`;
  if (num >= 1_000_000)     return `$${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1)}M`;
  if (num >= 1_000)         return `$${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1)}K`;
  return `$${num.toLocaleString('en-US')}`;
};
const fmtUsdExact = (n) => isNil(n) ? null : `$${Number(n).toLocaleString('en-US')}`;
const fmtPct = (n) => isNil(n) ? null : `${n}%`;
const fmtDate = (s) => {
  if (isBlank(s)) return null;
  try {
    return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return s; }
};

const POSITION_LABELS = {
  leader:     'лидер',
  contender:  'претендент',
  challenger: 'челленджер',
  follower:   'последователь',
  niche:      'ниша',
};

const SEVERITY_STYLES = {
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.40)',  label: 'высокий' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.40)', label: 'средний' },
  low:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.40)', label: 'низкий'  },
};

const RISK_CATEGORY_LABELS = {
  market:     'рынок',
  technical:  'технологии',
  team:       'команда',
  financial:  'финансы',
  regulatory: 'регуляторика',
  execution:  'execution',
};

const MOMENTUM_TYPE_LABELS = {
  product:     'продукт',
  funding:     'раунд',
  hiring:      'найм',
  customer:    'клиент',
  partnership: 'партнёрство',
  press:       'пресса',
  milestone:   'веха',
};

const HIRING_VELOCITY_LABELS = {
  fast:   'быстрый',
  steady: 'устойчивый',
  slow:   'медленный',
  paused: 'на паузе',
};

// ─────────────────────────────────────────────────────────────────────────
export default function YCResearchSections({ research }) {
  if (!research) {
    return (
      <div style={{
        marginTop: 36, padding: 24,
        background: '#0d0d0e', border: '1px solid #18181b',
        borderRadius: 12, textAlign: 'center',
        color: '#71717a', fontSize: 13,
      }}>
        Исследование по этой компании ещё не подгружено.
      </div>
    );
  }

  // Compose the section list with their non-empty checks. Each entry only
  // renders when it carries at least one meaningful value — this is what
  // keeps the page from being a wall of "—".
  return (
    <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row>
        <FundingSection data={research.funding} />
        <TractionSection data={research.traction} />
      </Row>

      <Row>
        <MoatSection data={research.moat} />
        <MarketSection data={research.market} />
      </Row>

      <Row>
        <CompetitionSection data={research.competition} />
        <TeamSection data={research.team} />
      </Row>

      {research.team?.founders?.length > 0 && (
        <FoundersBlock founders={research.team.founders} />
      )}

      {research.risks?.length > 0 && <RisksSection risks={research.risks} />}
      {research.momentum?.length > 0 && <MomentumSection events={research.momentum} />}
      {research.sources?.length > 0 && <SourcesSection sources={research.sources} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────────────────
function Row({ children }) {
  // Drop nulls so empty sections don't leave gaps in the grid.
  const items = React.Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      gap: 16,
    }}>
      {items}
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

// Big headline number — used for the one stat each section is "about".
function Headline({ label, value, accent = '#fafafa' }) {
  if (isBlank(value)) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{
        fontSize: 26, fontWeight: 700, color: accent,
        fontFamily: 'ui-monospace,monospace',
        letterSpacing: '-0.02em', lineHeight: 1,
      }}>
        {value}
      </span>
      <span style={{
        fontSize: 10.5, color: '#71717a',
        fontFamily: 'ui-monospace,monospace',
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}

// Secondary stat row — renders nothing when value is missing.
function Stat({ label, value, mono = false, accent = '#e4e4e7' }) {
  if (isBlank(value)) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
      <span style={{ fontSize: 11.5, color: '#71717a', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{
        fontSize: 12.5, color: accent, textAlign: 'right',
        fontFamily: mono ? 'ui-monospace,monospace' : 'inherit',
        fontWeight: mono ? 600 : 500,
      }}>{value}</span>
    </div>
  );
}

function Tag({ text, color = '#a1a1aa', bg = '#18181b', border = '#27272a', small = false }) {
  return (
    <span style={{
      fontSize: small ? 10 : 10.5,
      color, background: bg,
      border: `1px solid ${border}`,
      borderRadius: 4,
      padding: '3px 8px',
      fontFamily: 'ui-monospace,monospace',
      fontWeight: 600,
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>{text}</span>
  );
}

function Para({ children, dim = false }) {
  return (
    <p style={{
      margin: 0,
      fontSize: dim ? 11.5 : 12.5,
      color: dim ? '#a1a1aa' : '#d4d4d8',
      lineHeight: 1.65,
    }}>
      {children}
    </p>
  );
}

function TagRow({ label, items }) {
  if (!hasItems(items)) return null;
  return (
    <div>
      <div style={{ fontSize: 11.5, color: '#71717a', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((it, i) => <Tag key={i} text={typeof it === 'string' ? it : it.name || ''} small />)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────────
function FundingSection({ data }) {
  if (!data) return null;
  const cap = fmtUsdCompact(data.last_round_post_money_valuation_usd);
  const raised = fmtUsdExact(data.total_raised_usd);
  const stage = data.last_round_stage;
  const lead = data.last_round_lead_investor;
  const date = fmtDate(data.last_round_date);
  const investors = data.all_investors || [];
  const anything = cap || raised || stage || lead || date || investors.length > 0 || !isBlank(data.notes);
  if (!anything) return null;

  return (
    <Card icon={CircleDollarSign} title="Раунд и оценка" accent="#10b981">
      {cap && <Headline label="cap (post-money)" value={cap} accent="#10b981" />}
      <Stat label="Этап раунда" value={stage} />
      <Stat label="Размер раунда" value={fmtUsdExact(data.last_round_amount_usd)} mono />
      <Stat label="Всего поднято" value={raised} mono />
      <Stat label="Дата" value={date} mono />
      <Stat label="Lead" value={lead} />
      <TagRow label="Инвесторы" items={investors} />
      {!isBlank(data.notes) && <Para dim>{data.notes}</Para>}
    </Card>
  );
}

function TractionSection({ data }) {
  if (!data) return null;
  const anything = !isBlank(data.primary_metric_value)
    || !isBlank(data.primary_metric_type)
    || !isBlank(data.growth_rate)
    || hasItems(data.notable_customers)
    || !isBlank(data.milestones);
  if (!anything) return null;

  return (
    <Card icon={Activity} title="Что показывают" accent="#22D3EE">
      {!isBlank(data.primary_metric_value) && (
        <Headline label={data.primary_metric_type || 'основная метрика'} value={data.primary_metric_value} accent="#22D3EE" />
      )}
      <Stat label="Рост" value={data.growth_rate} mono />
      <TagRow label="Заметные клиенты" items={data.notable_customers} />
      {!isBlank(data.milestones) && <Para>{data.milestones}</Para>}
      {!isBlank(data.notes) && <Para dim>{data.notes}</Para>}
    </Card>
  );
}

function MoatSection({ data }) {
  if (!data) return null;
  const anything = !isBlank(data.summary) || hasItems(data.moat_type) || !isBlank(data.differentiation);
  if (!anything) return null;

  return (
    <Card icon={ShieldCheck} title="Что их отличает" accent="#a78bfa">
      {!isBlank(data.summary) && (
        <div style={{ fontSize: 13, color: '#e4e4e7', lineHeight: 1.7, fontWeight: 500 }}>
          {data.summary}
        </div>
      )}
      {hasItems(data.moat_type) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {data.moat_type.map((m, i) => (
            <Tag key={i} text={m}
              color="#a78bfa"
              bg="rgba(167,139,250,0.10)"
              border="rgba(167,139,250,0.35)" />
          ))}
        </div>
      )}
      {!isBlank(data.differentiation) && (
        <div style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.65, paddingTop: 6, borderTop: '1px dashed #18181b' }}>
          {data.differentiation}
        </div>
      )}
    </Card>
  );
}

function MarketSection({ data }) {
  if (!data) return null;
  const tam = fmtUsdCompact(data.tam_usd);
  const anything = tam || !isBlank(data.sector) || !isBlank(data.sub_sector)
    || !isBlank(data.market_growth_rate) || !isBlank(data.why_now);
  if (!anything) return null;

  return (
    <Card icon={Globe2} title="Почему сейчас" accent="#0ea5e9">
      {tam && <Headline label="TAM" value={tam} accent="#0ea5e9" />}
      <Stat label="Сектор" value={data.sector} />
      <Stat label="Под-сектор" value={data.sub_sector} />
      <Stat label="Рост рынка" value={data.market_growth_rate} mono />
      {!isBlank(data.tam_source) && <Stat label="Источник TAM" value={data.tam_source} />}
      {!isBlank(data.why_now) && (
        <div style={{ paddingTop: 4, borderTop: !isBlank(data.sector) ? '1px dashed #18181b' : 'none' }}>
          <Para>{data.why_now}</Para>
        </div>
      )}
    </Card>
  );
}

function CompetitionSection({ data }) {
  if (!data) return null;
  const anything = !isBlank(data.competitive_position)
    || hasItems(data.direct_competitors)
    || !isBlank(data.competitive_notes);
  if (!anything) return null;

  const positionLabel = POSITION_LABELS[data.competitive_position] || data.competitive_position;

  return (
    <Card icon={Swords} title="Конкуренты" accent="#f59e0b">
      {!isBlank(positionLabel) && (
        <div style={{ display: 'inline-flex', alignSelf: 'flex-start' }}>
          <Tag text={`позиция: ${positionLabel}`}
            color="#f59e0b"
            bg="rgba(245,158,11,0.10)"
            border="rgba(245,158,11,0.35)" />
        </div>
      )}
      <TagRow label="Прямые конкуренты" items={data.direct_competitors} />
      {!isBlank(data.competitive_notes) && <Para>{data.competitive_notes}</Para>}
    </Card>
  );
}

function TeamSection({ data }) {
  if (!data) return null;
  const anything = !isNil(data.headcount_current) || !isNil(data.headcount_6mo_ago)
    || !isBlank(data.hiring_velocity) || hasItems(data.key_hires);
  if (!anything) return null;

  const velocityLabel = HIRING_VELOCITY_LABELS[data.hiring_velocity] || data.hiring_velocity;
  const headcount = data.headcount_current;
  const headcount6 = data.headcount_6mo_ago;
  const delta = (!isNil(headcount) && !isNil(headcount6))
    ? `${headcount - headcount6 >= 0 ? '+' : ''}${headcount - headcount6} за 6 мес`
    : null;

  return (
    <Card icon={Users} title="Команда" accent="#ec4899">
      {!isNil(headcount) && (
        <Headline label={delta || 'человек в команде'} value={String(headcount)} accent="#ec4899" />
      )}
      <Stat label="Темп найма" value={velocityLabel} />
      <TagRow label="Ключевые наймы" items={data.key_hires} />
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
        Основатели
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
            {hasItems(f.pedigree_tags) && (
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
            {!isBlank(f.prior_exits) && (
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
    <Card icon={AlertTriangle} title="Что может пойти не так" accent="#ef4444">
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
    <Card icon={Clock} title="Хронология" accent="#22D3EE">
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {sorted.map((e, i) => {
          const last = i === sorted.length - 1;
          return (
            <li key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', paddingBottom: last ? 0 : 14 }}>
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11, color: '#71717a',
                  fontFamily: 'ui-monospace,monospace',
                  letterSpacing: '0.06em', marginBottom: 4,
                  display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
                }}>
                  <span>{fmtDate(e.date) || e.date}</span>
                  {e.type && (
                    <span style={{ color: '#a78bfa', textTransform: 'uppercase', fontWeight: 700 }}>
                      · {MOMENTUM_TYPE_LABELS[e.type] || e.type}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: '#e4e4e7', lineHeight: 1.6 }}>
                  {e.event}
                  {!isBlank(e.source_url) && (
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

function SourcesSection({ sources }) {
  return (
    <Card icon={ExternalLink} title="Источники" accent="#60a5fa">
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
