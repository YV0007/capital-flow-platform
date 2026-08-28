// Research sections rendered below the detail hero/body.
// Reframed as a TRACKING + INVESTMENT view — we've already invested and want
// to see who else is on the cap table and how the company is doing. The page
// deliberately mirrors the shape of a Y Combinator company page: an
// investment block, the founders (with real YC bios), the YC launch post,
// a lightweight activity timeline, and sources. The old analytical cards
// (traction / moat / market / competition) were removed on purpose.
import React from 'react';
import {
  HandCoins, Clock, ExternalLink, ArrowUpRight, Linkedin, Twitter,
  Rocket, Award, AlertCircle, Link2,
} from 'lucide-react';
import investmentData from '../../../data/yc-investment.json';
import { useT } from '../../../lib/i18n.jsx';

// ─ Empty helpers ──────────────────────────────────────────────────────────
const isNil   = (v) => v === null || v === undefined;
const isBlank = (v) => isNil(v) || (typeof v === 'string' && v.trim() === '');
const hasItems = (v) => Array.isArray(v) && v.length > 0;

const fmtUsdCompact = (n) => {
  if (isNil(n)) return null;
  const num = Number(n);
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(num >= 10_000_000_000 ? 0 : 1)}B`;
  if (num >= 1_000_000)     return `$${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1)}M`;
  if (num >= 1_000)         return `$${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1)}K`;
  return `$${num.toLocaleString('en-US')}`;
};

const fmtDate = (s) => {
  if (isBlank(s)) return null;
  try {
    return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return s; }
};

// A function of `t`, not a frozen const: t() at module scope runs at import
// time, before any component can supply it, and the ReferenceError takes the
// whole bundle down — a blank page, not a missing label.
const investorType = (t) => ({
  fund:        { label: t('фонд', 'fund'),     color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.35)' },
  vc:          { label: t('фонд', 'fund'),     color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.35)' },
  angel:       { label: t('ангел', 'angel'),    color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.35)' },
  accelerator: { label: t('акселератор', 'accelerator'), color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.35)' },
});

// A function of `t`, not a frozen const: t() at module scope runs at import
// time, before any component can supply it, and the ReferenceError takes the
// whole bundle down — a blank page, not a missing label.
const momentumType = (t) => ({
  product:     { label: t('продукт', 'product'),    color: '#22D3EE' },
  funding:     { label: t('раунд', 'round'),      color: '#10b981' },
  hiring:      { label: t('найм', 'hiring'),       color: '#ec4899' },
  customer:    { label: t('клиент', 'customer'),     color: '#0ea5e9' },
  partnership: { label: t('партнёрство', 'partnership'), color: '#a78bfa' },
  press:       { label: t('пресса', 'press'),     color: '#f59e0b' },
  milestone:   { label: t('веха', 'milestone'),       color: '#60a5fa' },
});

// ─────────────────────────────────────────────────────────────────────────
export default function YCResearchSections({ research, company }) {
  const t = useT();
  const invest = company ? investmentData.companies?.[company.id] : null;

  if (!research && !invest) {
    return (
      <div style={{
        marginTop: 36, padding: 24,
        background: '#0d0d0e', border: '1px solid #18181b',
        borderRadius: 12, textAlign: 'center',
        color: '#71717a', fontSize: 13,
      }}>
        {t('Исследование по этой компании ещё не подгружено.', 'Research on this company has not been loaded yet.')}
      </div>
    );
  }

  const founders = research?.team?.founders || [];
  const launch = research?.launch;
  const momentum = research?.momentum || [];
  const sources = research?.sources || [];

  return (
    <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 60 }}>
      {invest && (
        <Group title={t('Инвестиция', 'Investment')}>
          <FullWidth><InvestmentSection invest={invest} meta={investmentData._meta} /></FullWidth>
        </Group>
      )}

      {founders.length > 0 && (
        <Group title={t('Основатели', 'Founders')}>
          <FullWidth><FoundersBlock founders={founders} /></FullWidth>
        </Group>
      )}

      {launch && (
        <Group title={t('Запуск на YC', 'YC launch')}>
          <FullWidth><LaunchSection launch={launch} /></FullWidth>
        </Group>
      )}

      {momentum.length > 0 && (
        <Group title={t('Активность', 'Activity')}>
          <FullWidth><MomentumSection events={momentum} /></FullWidth>
        </Group>
      )}

      {sources.length > 0 && (
        <Group title={t('Источники', 'Sources')}>
          <FullWidth><SourcesSection sources={sources} /></FullWidth>
        </Group>
      )}
    </div>
  );
}

// Section group with header rule. Drops out when empty.
function Group({ title, children }) {
  const items = React.Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <section>
      <header style={{
        display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 22,
      }}>
        <span style={{
          fontSize: 18, color: '#fafafa', fontWeight: 700,
          letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        }}>{title}</span>
        <span style={{ flex: 1, height: 1, background: '#18181b' }} />
      </header>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 16,
      }}>
        {items}
      </div>
    </section>
  );
}

function FullWidth({ children }) {
  return <div style={{ gridColumn: '1 / -1' }}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────
// INVESTMENT — the focus of the page. Who's on the cap table, how much,
// and how confident we are in it.
// ─────────────────────────────────────────────────────────────────────────
function InvestmentSection({ invest, meta }) {
  const t = useT();
  const external = invest.external_investors || [];
  const nonEquity = invest.non_equity || [];
  const flags = invest.flags || [];
  const sources = invest.sources || [];
  const hasExternal = invest.tier === 'external' && external.length > 0;

  const tierBadge = hasExternal
    ? { text: t('Есть внешние инвесторы', 'Has external investors'), color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.40)' }
    : { text: t('Только сделка YC', 'YC deal only'), color: '#a1a1aa', bg: 'rgba(161,161,170,0.10)', border: 'rgba(161,161,170,0.30)' };

  const capIsSet = !isBlank(invest.cap) && invest.cap !== t('не зафиксирована', 'not recorded');

  return (
    <section style={{
      background: '#0c0c0e',
      border: '1px solid #1c1c20',
      borderRadius: 14,
      padding: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header band */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '16px 22px',
        borderBottom: '1px solid #18181b',
        background: 'linear-gradient(90deg, rgba(52,211,153,0.06), transparent 60%)',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'radial-gradient(circle at 30% 30%, rgba(52,211,153,0.22), rgba(52,211,153,0.04))',
          border: '1px solid rgba(52,211,153,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <HandCoins size={17} style={{ color: '#34d399' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 15, color: '#fafafa', fontWeight: 700, letterSpacing: '-0.01em' }}>
            {t('Кто вложился', 'Who invested')}
          </span>
          <span style={{ fontSize: 11.5, color: '#71717a' }}>{t('деньги на счету компании', 'money in the company’s account')}</span>
        </div>
        <span style={{ flex: 1 }} />
        <span style={{
          fontSize: 11, fontWeight: 700, color: tierBadge.color,
          background: tierBadge.bg, border: `1px solid ${tierBadge.border}`,
          borderRadius: 20, padding: '5px 12px', whiteSpace: 'nowrap',
        }}>{tierBadge.text}</span>
      </header>

      <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Plain-language money summary — no confusing single "raised" number */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FactRow
            label={t('Базовая сделка', 'Base deal')}
            value={<span>$500K · <span style={{ color: '#a1a1aa' }}>{t('Y Combinator + синдикат Toloka.VC', 'Y Combinator + the Toloka.VC syndicate')}</span></span>}
          />
          <FactRow
            label={t('Сверх базы', 'Above the base')}
            value={<span style={{ color: hasExternal ? '#e4e4e7' : '#a1a1aa' }}>{invest.raised_note}</span>}
          />
          <FactRow
            label={t('Потолок оценки', 'Valuation cap')}
            hint={t('Максимальная оценка, зашитая в сделку (SAFE): по ней деньги инвесторов превратятся в долю в следующем раунде. Это не текущая стоимость компании — её на этой стадии не раскрывают.', 'The maximum valuation written into the SAFE: it is the price at which investors’ money converts to equity in the next round. It is not the company’s current value — that is not disclosed at this stage.')}
            value={capIsSet
              ? <span style={{ color: '#34d399', fontWeight: 700 }}>{invest.cap}</span>
              : <span style={{ color: '#a1a1aa' }}>{t('ещё не зафиксирована — определится в следующем раунде', 'not set yet — it will be fixed in the next round')}</span>}
          />
        </div>

        {/* External investors — with website + source links */}
        {hasExternal && (
          <SubBlock label={t('Внешние инвесторы (сверх YC)', 'External investors (beyond YC)')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {external.map((inv, i) => {
                const kind = investorType(t)[inv.type] || investorType(t).fund;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                    padding: '10px 12px', background: '#161619',
                    border: '1px solid #26262b', borderRadius: 10,
                  }}>
                    {!isBlank(inv.website) ? (
                      <a href={inv.website} target="_blank" rel="noopener noreferrer"
                        style={{
                          fontSize: 13.5, color: '#fafafa', fontWeight: 700, textDecoration: 'none',
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#34d399'}
                        onMouseLeave={e => e.currentTarget.style.color = '#fafafa'}>
                        {inv.name}<ArrowUpRight size={13} style={{ color: '#52525b' }} />
                      </a>
                    ) : (
                      <span style={{ fontSize: 13.5, color: '#fafafa', fontWeight: 700 }}>{inv.name}</span>
                    )}
                    <span style={{
                      fontSize: 9.5, fontWeight: 700, color: kind.color, background: kind.bg,
                      border: `1px solid ${t.border}`, borderRadius: 4, padding: '2px 7px',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{kind.label}</span>
                    {!isBlank(inv.note) && (
                      <span style={{ fontSize: 11.5, color: '#71717a' }}>{inv.note}</span>
                    )}
                    {!isBlank(inv.source_url) && (
                      <>
                        <span style={{ flex: 1 }} />
                        <SourceLink url={inv.source_url} label={inv.source_label} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </SubBlock>
        )}

        {/* Grants / accelerators — no equity given up */}
        {nonEquity.length > 0 && (
          <SubBlock label={t('Гранты и поддержка (без доли в компании)', 'Grants and support (no equity)')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {nonEquity.map((n, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 11.5, color: '#d4d4d8',
                  padding: '6px 11px', borderRadius: 8,
                  background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.22)',
                }}>
                  <Award size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>{n.name}</span>
                  {!isBlank(n.note) && <span style={{ color: '#71717a' }}>· {n.note}</span>}
                </span>
              ))}
            </div>
          </SubBlock>
        )}

        {/* Progress (was "traction") */}
        {!isBlank(invest.traction_note) && (
          <SubBlock label={t('Как идут дела', 'How things are going')}>
            <div style={{ fontSize: 12.5, color: '#e4e4e7', lineHeight: 1.65 }}>{invest.traction_note}</div>
          </SubBlock>
        )}

        {/* Confidence note */}
        {!isBlank(invest.confidence) && (
          <div style={{
            fontSize: 11.5, color: '#8a8a92', lineHeight: 1.6,
            paddingTop: 12, borderTop: '1px dashed #26262b',
          }}>
            {invest.confidence}
          </div>
        )}

        {/* Unconfirmed / rumor flags — with source links when available */}
        {flags.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {flags.map((f, i) => (
              <div key={i} style={{
                display: 'flex', gap: 9, alignItems: 'flex-start',
                padding: '10px 12px', borderRadius: 8,
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.22)',
              }}>
                <AlertCircle size={13} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 11.5, color: '#e4e4e7', lineHeight: 1.55 }}>{f.text || f}</span>
                  {!isBlank(f.source_url) && <SourceLink url={f.source_url} label={f.source_label} />}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sources footer */}
        {sources.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px 18px', alignItems: 'center',
            paddingTop: 12, borderTop: '1px solid #18181b',
          }}>
            <span style={{
              fontSize: 9.5, color: '#52525b', fontFamily: 'ui-monospace,monospace',
              letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
            }}>{t('Источники', 'Sources')}</span>
            {sources.map((s, i) => <SourceLink key={i} url={s.url} label={s.label} />)}
          </div>
        )}
      </div>
    </section>
  );
}

// One "label — value" fact row for the money summary. Optional `hint`
// renders a small "?" that explains a term on hover.
function FactRow({ label, value, hint }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'wrap' }}>
      <span style={{
        fontSize: 11, color: '#71717a', minWidth: 118,
        fontFamily: 'ui-monospace,monospace', letterSpacing: '0.04em',
        textTransform: 'uppercase', fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 5,
      }}>
        {label}
        {!isBlank(hint) && (
          <span
            title={hint}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 13, height: 13, borderRadius: '50%',
              border: '1px solid #3f3f46', color: '#71717a',
              fontSize: 9, fontWeight: 700, cursor: 'help', flexShrink: 0,
            }}
          >?</span>
        )}
      </span>
      <span style={{ fontSize: 13, color: '#e4e4e7', lineHeight: 1.55, flex: 1, minWidth: 200 }}>{value}</span>
    </div>
  );
}

// Small "source ↗" pill link.
function SourceLink({ url, label }) {
  const t = useT();
  if (isBlank(url)) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 11, color: '#60a5fa', textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
      <Link2 size={11} style={{ flexShrink: 0, color: '#3f6fb0' }} />
      {label || t('источник', 'source')}
    </a>
  );
}

function SubBlock({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        fontSize: 9.5, color: '#71717a', fontFamily: 'ui-monospace,monospace',
        letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase',
      }}>{label}</div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FOUNDERS — YC "Active Founders" style: name + role + prose bio + links.
// ─────────────────────────────────────────────────────────────────────────
function FoundersBlock({ founders }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: 14,
    }}>
      {founders.map((f, i) => (
        <article key={i} style={{
          background: '#0d0d0e', border: '1px solid #18181b',
          borderRadius: 12, padding: '18px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: '#fafafa', fontSize: 15, fontWeight: 700 }}>{f.name}</span>
              </div>
              {f.role && (
                <div style={{
                  fontSize: 10.5, color: '#71717a', fontFamily: 'ui-monospace,monospace',
                  letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3, fontWeight: 600,
                }}>{f.role}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {!isBlank(f.linkedin) && <IconLink href={f.linkedin} icon={Linkedin} />}
              {!isBlank(f.twitter) && <IconLink href={f.twitter} icon={Twitter} />}
            </div>
          </header>
          {!isBlank(f.bio) && (
            <p style={{ margin: 0, fontSize: 12.5, color: '#d4d4d8', lineHeight: 1.65 }}>{f.bio}</p>
          )}
        </article>
      ))}
    </div>
  );
}

function IconLink({ href, icon: Icon }) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{
        width: 28, height: 28, borderRadius: 6,
        background: '#18181b', border: '1px solid #27272a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#a1a1aa', textDecoration: 'none', transition: 'all 140ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = '#fafafa'; e.currentTarget.style.borderColor = '#52525b'; }}
      onMouseLeave={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = '#27272a'; }}
    >
      <Icon size={13} />
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LAUNCH — the YC "Company Launch" post.
// ─────────────────────────────────────────────────────────────────────────
function LaunchSection({ launch }) {
  const t = useT();
  const title = launch.title_ru || launch.title;
  const tldr = launch.tldr_ru || launch.tldr;
  return (
    <section style={{
      background: 'linear-gradient(180deg, rgba(255,102,0,0.05), #0d0d0e 100px)',
      border: '1px solid rgba(255,102,0,0.20)',
      borderRadius: 12, padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(255,102,0,0.12)', border: '1px solid rgba(255,102,0,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Rocket size={14} style={{ color: '#FF6600' }} />
        </div>
        <h3 style={{
          margin: 0, fontSize: 11.5, color: '#a1a1aa', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'ui-monospace,monospace',
        }}>Company Launch</h3>
      </header>
      {!isBlank(title) && (
        <div style={{ fontSize: 15, color: '#fafafa', fontWeight: 700, lineHeight: 1.35 }}>
          {title}
        </div>
      )}
      {!isBlank(tldr) && (
        <p style={{ margin: 0, fontSize: 13, color: '#d4d4d8', lineHeight: 1.7 }}>
          <span style={{ color: '#FF6600', fontWeight: 700, fontFamily: 'ui-monospace,monospace', fontSize: 11 }}>{t('Кратко', 'In brief')}&nbsp;</span>
          {tldr}
        </p>
      )}
      {!isBlank(launch.url) && (
        <a
          href={launch.url} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
            fontSize: 12, color: '#FF6600', textDecoration: 'none', fontWeight: 600,
            marginTop: 2,
          }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {t('Смотреть лонч', 'View the launch')} <ArrowUpRight size={13} />
        </a>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ACTIVITY — redesigned as a compact card feed (was a bare dotted list).
// ─────────────────────────────────────────────────────────────────────────
function MomentumSection({ events }) {
  const t = useT();
  const sorted = [...events].sort((a, b) => (b.date || '').localeCompare(a.date || '')); // newest first
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sorted.map((e, i) => {
        const kind = momentumType(t)[e.type] || { label: e.type, color: '#a1a1aa' };
        return (
          <div key={i} style={{
            display: 'flex', gap: 14, alignItems: 'stretch',
            background: '#0d0d0e', border: '1px solid #18181b',
            borderLeft: `3px solid ${kind.color}`,
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0, minWidth: 92 }}>
              <span style={{
                fontSize: 11, color: '#a1a1aa', fontFamily: 'ui-monospace,monospace',
                letterSpacing: '0.02em', whiteSpace: 'nowrap',
              }}>{fmtDate(e.date) || e.date}</span>
              {e.type && (
                <span style={{
                  alignSelf: 'flex-start',
                  fontSize: 9.5, fontWeight: 700, color: kind.color,
                  background: `${kind.color}18`, border: `1px solid ${kind.color}44`,
                  borderRadius: 4, padding: '2px 7px',
                  fontFamily: 'ui-monospace,monospace', textTransform: 'uppercase',
                  letterSpacing: '0.06em', whiteSpace: 'nowrap',
                }}>{kind.label}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#e4e4e7', lineHeight: 1.6 }}>
                {e.event}
                {!isBlank(e.source_url) && (
                  <a
                    href={e.source_url} target="_blank" rel="noopener noreferrer"
                    title={e.source_url}
                    style={{
                      color: '#71717a', marginLeft: 8, textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle',
                    }}
                    onMouseEnter={ev => ev.currentTarget.style.color = '#fafafa'}
                    onMouseLeave={ev => ev.currentTarget.style.color = '#71717a'}
                  >
                    <ExternalLink size={11} />
                  </a>
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SOURCES
// ─────────────────────────────────────────────────────────────────────────
function SourcesSection({ sources }) {
  return (
    <div style={{
      background: '#0d0d0e', border: '1px solid #18181b',
      borderRadius: 12, padding: '18px 20px',
    }}>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: '10px 24px' }}>
        {sources.map((s, i) => (
          <li key={i}>
            <a
              href={s.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                fontSize: 12.5, color: '#60a5fa', textDecoration: 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              <ExternalLink size={12} style={{ flexShrink: 0, color: '#3f3f46' }} />
              {s.label || s.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
