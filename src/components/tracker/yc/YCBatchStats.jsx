// Batch-wide metrics shown below the company grid. Three stacked full-width
// blocks on a soft gradient (matching the company cards):
//   1) the whole YC Spring 2026 batch — top-5 standouts, biggest rounds,
//      which funds showed up, batch composition;
//   2) Toloka.VC's own portfolio — headline numbers + its top-5;
//   3) a plain-language verdict on how well Toloka's picks did vs the batch.
// Everything is in Russian, adapted (not literally translated).
import React from 'react';
import { ExternalLink, Star, Trophy } from 'lucide-react';
import data from '../../../data/yc-batch-stats.json';

const fmtUsd = (n) => {
  if (n == null) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
};

export default function YCBatchStats() {
  return (
    <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <BatchBlock d={data.batch} />
      <TolokaBlock d={data.toloka} />
      <ComparisonBlock d={data.comparison} />
    </div>
  );
}

// ── Shared shell — soft gradient block, like the company cards ─────────────
function Block({ accent, tint, children }) {
  return (
    <section style={{
      background: `linear-gradient(160deg, ${tint}, #0a0a0c 55%)`,
      border: `1px solid ${accent}33`,
      borderRadius: 18,
      padding: '26px 28px 30px',
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>
      {children}
    </section>
  );
}

function BlockHeader({ eyebrow, title, subtitle, accent, Icon }) {
  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {eyebrow && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontSize: 10.5, color: accent, fontWeight: 700,
          fontFamily: 'ui-monospace,monospace', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
          {Icon && <Icon size={13} />}{eyebrow}
        </span>
      )}
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.02em' }}>{title}</h2>
      {subtitle && <div style={{ fontSize: 13, color: '#8a8a92' }}>{subtitle}</div>}
    </header>
  );
}

function SubHead({ children }) {
  return (
    <div style={{
      fontSize: 11, color: '#71717a', fontWeight: 700,
      fontFamily: 'ui-monospace,monospace', letterSpacing: '0.12em',
      textTransform: 'uppercase', marginBottom: -6,
    }}>{children}</div>
  );
}

// Small metric tile.
function Metric({ value, unit, label, accent = '#fafafa', hint }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c20',
      borderRadius: 12, padding: '14px 16px', minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: accent, letterSpacing: '-0.02em' }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: '#a1a1aa' }}>{unit}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
        <span style={{ fontSize: 11.5, color: '#71717a', lineHeight: 1.4 }}>{label}</span>
        {hint && <Hint text={hint} />}
      </div>
    </div>
  );
}

function Hint({ text }) {
  return (
    <span title={text} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
      border: '1px solid #3f3f46', color: '#71717a', fontSize: 9, fontWeight: 700, cursor: 'help',
    }}>?</span>
  );
}

// Horizontal bar (value → width). max sets the 100% reference.
function HBar({ label, valueText, ratio, color = '#34d399' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <span style={{ fontSize: 12.5, color: '#e4e4e7' }}>{label}</span>
        <span style={{ fontSize: 12.5, color: color, fontWeight: 700, fontFamily: 'ui-monospace,monospace' }}>{valueText}</span>
      </div>
      <div style={{ height: 8, background: '#161619', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{
          width: `${Math.max(3, Math.min(100, ratio * 100))}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}, ${color}bb)`, borderRadius: 5,
        }} />
      </div>
    </div>
  );
}

// ── Block 1: the batch ─────────────────────────────────────────────────────
function BatchBlock({ d }) {
  const maxRaise = Math.max(...d.top_raises.map(r => r.usd));
  return (
    <Block accent="#FF6600" tint="rgba(255,102,0,0.07)">
      <BlockHeader eyebrow="весь батч" title={d.title} subtitle={d.subtitle} accent="#FF6600" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
        {d.headline_stats.map((s, i) => (
          <Metric key={i} value={s.value} label={s.label} hint={s.hint} accent="#FF7a33" />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SubHead>Топ-5 кейсов батча</SubHead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 12 }}>
          {d.top5.map((c) => <StandoutCard key={c.rank} c={c} />)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SubHead>Крупнейшие внешние раунды</SubHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {d.top_raises.map((r, i) => (
              <HBar key={i} label={`${r.name} · ${r.lead}`} valueText={fmtUsd(r.usd)} ratio={r.usd / maxRaise} color="#34d399" />
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.5 }}>{d.external_round_note}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SubHead>Кто из фондов заходил</SubHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.top_investors.map((inv, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                padding: '9px 12px', background: 'rgba(255,255,255,0.02)',
                border: '1px solid #1c1c20', borderRadius: 10,
              }}>
                <a href={inv.website} target="_blank" rel="noopener noreferrer" style={{
                  fontSize: 13, color: '#fafafa', fontWeight: 700, textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#60a5fa'}
                  onMouseLeave={e => e.currentTarget.style.color = '#fafafa'}>
                  {inv.name}<ExternalLink size={11} style={{ color: '#52525b' }} />
                </a>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11.5, color: '#8a8a92' }}>{inv.deal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SubHead>Из чего состоит батч</SubHead>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {d.sectors.map((s, i) => (
            <HBar key={i} label={s.label} valueText={`${s.pct}%`} ratio={s.pct / 100} color="#60a5fa" />
          ))}
          <HBar label="Штаб-квартира в Сан-Франциско" valueText={`${d.geo_sf_pct}%`} ratio={d.geo_sf_pct / 100} color="#a78bfa" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 6, borderTop: '1px dashed #26262b' }}>
        {d.notes.map((n, i) => (
          <div key={i} style={{ fontSize: 11, color: '#71717a', lineHeight: 1.55 }}>· {n}</div>
        ))}
      </div>
    </Block>
  );
}

function StandoutCard({ c }) {
  return (
    <article style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c20',
      borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
        <span style={{
          fontSize: 11, fontWeight: 800, color: '#FF7a33',
          fontFamily: 'ui-monospace,monospace',
        }}>#{c.rank}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#fafafa' }}>{c.name}</span>
        <span style={{ fontSize: 11, color: '#71717a' }}>· {c.tag}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#34d399', fontFamily: 'ui-monospace,monospace' }}>{c.metric}</span>
        <span style={{ fontSize: 11, color: '#8a8a92' }}>{c.metricLabel}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: '#d4d4d8', lineHeight: 1.6 }}>{c.note}</p>
      {c.people && <div style={{ fontSize: 11.5, color: '#8a8a92', lineHeight: 1.5 }}>{c.people}</div>}
      {c.flag && (
        <div style={{
          fontSize: 11, color: '#f59e0b', lineHeight: 1.5,
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.22)',
          borderRadius: 8, padding: '7px 10px',
        }}>{c.flag}</div>
      )}
    </article>
  );
}

// ── Block 2: Toloka portfolio ──────────────────────────────────────────────
function TolokaBlock({ d }) {
  return (
    <Block accent="#34d399" tint="rgba(52,211,153,0.07)">
      <BlockHeader eyebrow="портфель" title={d.title} subtitle={d.subtitle} accent="#34d399" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
        {d.headline_stats.map((s, i) => (
          <Metric key={i} value={s.value} unit={s.unit} label={s.label} hint={s.hint} accent="#34d399" />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SubHead>Топ-5 компаний Toloka</SubHead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 12 }}>
          {d.top5.map((c, i) => (
            <article key={i} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c20',
              borderRadius: 12, padding: '15px 17px', display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fafafa' }}>{c.name}</span>
                <span style={{ fontSize: 11, color: '#71717a' }}>· {c.tag}</span>
                {c.star && (
                  <span title="В списке заметных стартапов TechCrunch" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 9.5, fontWeight: 700, color: '#f59e0b',
                    background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.35)',
                    borderRadius: 4, padding: '2px 6px', cursor: 'help',
                  }}><Star size={9} /> TechCrunch</span>
                )}
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#34d399', fontFamily: 'ui-monospace,monospace' }}>{c.metric}</span>
              <p style={{ margin: 0, fontSize: 12, color: '#d4d4d8', lineHeight: 1.6 }}>{c.note}</p>
            </article>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SubHead>Известные фонды рядом в сделках</SubHead>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {d.notable_funds.map((f, i) => (
            <span key={i} style={{
              fontSize: 11.5, color: '#d4d4d8', padding: '6px 11px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)', border: '1px solid #26262b',
            }}>
              <span style={{ fontWeight: 700, color: '#fafafa' }}>{f.name}</span>
              <span style={{ color: '#71717a' }}> → {f.into}</span>
            </span>
          ))}
        </div>
      </div>
    </Block>
  );
}

// ── Block 3: comparison / verdict ──────────────────────────────────────────
function ComparisonBlock({ d }) {
  return (
    <Block accent="#a78bfa" tint="rgba(167,139,250,0.08)">
      <BlockHeader eyebrow="сравнение" title={d.title} accent="#a78bfa" Icon={Trophy} />

      {/* The headline chart: hit-rate on consensus favorites vs random */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SubHead>Попадание в заметные стартапы батча</SubHead>
        <HBar label={`Toloka — ${d.standouts_held} из ${d.standouts_total} заметных`} valueText={`${d.standouts_pct}%`} ratio={d.standouts_pct / 100} color="#34d399" />
        <HBar label="Случайное попадание (в среднем по батчу)" valueText={`~${d.base_rate_pct}%`} ratio={d.base_rate_pct / 100} color="#52525b" />
        <div style={{ fontSize: 12.5, color: '#e4e4e7' }}>
          → Toloka попадает в консенсус-фаворитов примерно <span style={{ color: '#34d399', fontWeight: 700 }}>{d.over_index} чаще</span> случайного.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12 }}>
        {d.points.map((p, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c20',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#a78bfa', letterSpacing: '-0.02em' }}>{p.value}</div>
            <div style={{ fontSize: 11.5, color: '#d4d4d8', marginTop: 4 }}>{p.label}</div>
            <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>{p.note}</div>
          </div>
        ))}
      </div>

      {/* Where Toloka buys on the valuation ladder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SubHead>В каком сегменте по оценке заходит Toloka</SubHead>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <HBar label="Рынок: медианная AI-оценка на seed" valueText={`$${d.market_median_m}M`} ratio={d.market_median_m / d.top_mark_m} color="#60a5fa" />
          <HBar label="Toloka: медианный потолок оценки" valueText={`$${d.median_cap_m}M`} ratio={d.median_cap_m / d.top_mark_m} color="#34d399" />
          <HBar label="Топ-марки батча (9 Mothers, Tasklet)" valueText={`$${d.top_mark_m}M`} ratio={1} color="#FF7a33" />
        </div>
        <div style={{ fontSize: 11.5, color: '#71717a', lineHeight: 1.55 }}>
          Toloka заходит в средний сегмент — выше рынка, но ниже самых дорогих имён батча.
        </div>
      </div>

      {/* Verdict */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(52,211,153,0.10), rgba(167,139,250,0.05))',
        border: '1px solid rgba(52,211,153,0.30)', borderRadius: 14, padding: '18px 20px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fafafa' }}>{d.verdict_title}</div>
        <p style={{ margin: 0, fontSize: 13, color: '#d4d4d8', lineHeight: 1.7 }}>{d.verdict}</p>
      </div>
    </Block>
  );
}
