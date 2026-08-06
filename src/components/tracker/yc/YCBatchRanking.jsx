// Full-batch ranking block. Sits between the batch overview (BatchBlock) and
// the Toloka/top-performers blocks inside YCBatchStats. Deliberately plain:
// the point is clarity + data, not decoration.
//   1) how the score is built — 4 equal-weight factors + the two-shelf model;
//   2) the tiered leaderboard (Tier 1–5), scores 0–100;
//   3) where Toloka's 21 positions land.
import React from 'react';
import data from '../../../data/yc-batch-ranking.json';

export default function YCBatchRanking() {
  const accent = '#fbbf24';
  return (
    <section style={{
      background: `linear-gradient(160deg, rgba(251,191,36,0.06), #0a0a0c 55%)`,
      border: `1px solid ${accent}33`,
      borderRadius: 18,
      padding: '26px 28px 30px',
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{
          fontSize: 10.5, color: accent, fontWeight: 700,
          fontFamily: 'ui-monospace,monospace', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>полный рейтинг</span>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.02em' }}>
          Рейтинг всего батча
        </h2>
        <div style={{ fontSize: 13, color: '#8a8a92', lineHeight: 1.6 }}>
          Двухслойная модель, балл 0–100. Порядок точный сверху и намеренно грубый внизу — честный
          предел при таких данных. <span style={{ color: '#34d399', fontWeight: 600 }}>[TOLOKA]</span> — позиция в портфеле ({data.toloka_total} всего).
        </div>
      </header>

      <Methodology accent={accent} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SubHead>Таблица рейтинга</SubHead>
        {data.tiers.map(t => <TierRow key={t.id} t={t} />)}
      </div>

      <TolokaPlacement d={data.toloka_placement} accent={accent} />
    </section>
  );
}

// ── How the ranking is built ────────────────────────────────────────────────
function Methodology({ accent }) {
  const { factors, how_it_works: h } = data;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SubHead>Как считается</SubHead>

      {/* 4 equal-weight factors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px,1fr))', gap: 10 }}>
        {factors.map((f) => (
          <div key={f.key} style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c20',
            borderRadius: 12, padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 5,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>{f.label}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: accent,
                fontFamily: 'ui-monospace,monospace',
              }}>{f.weight}%</span>
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: '#8a8a92', lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Two-shelf model */}
      <div style={{ fontSize: 12, color: '#8a8a92', lineHeight: 1.6 }}>{h.intro}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 10 }}>
        {h.shelves.map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c20',
            borderRadius: 12, padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fafafa' }}>{s.label}</span>
              <span style={{ fontSize: 11, color: '#71717a', fontFamily: 'ui-monospace,monospace' }}>· {s.scope}</span>
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: '#8a8a92', lineHeight: 1.55 }}>{s.desc}</p>
          </div>
        ))}
      </div>
      <div style={{
        fontSize: 11.5, color: '#a1a1aa', lineHeight: 1.6,
        borderLeft: `2px solid ${accent}66`, paddingLeft: 12,
      }}>{h.meaning}</div>
    </div>
  );
}

// ── One tier: header band + its companies + optional "more" summary row ──────
function TierRow({ t }) {
  const named = t.companies || [];
  const rangeText = t.more?.scoreRange
    || (named.length ? `${named[named.length - 1].score}–${named[0].score}` : '');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {/* Tier band */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: 22, height: 22, borderRadius: 6, padding: '0 6px',
          fontSize: 11.5, fontWeight: 800, fontFamily: 'ui-monospace,monospace',
          color: '#0a0a0c', background: t.accent,
        }}>T{t.id}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#fafafa' }}>{t.name}</span>
        <span style={{ flex: 1, minWidth: 60, height: 1, background: '#1c1c20' }} />
        {rangeText && (
          <span style={{ fontSize: 11.5, color: '#71717a', fontFamily: 'ui-monospace,monospace' }}>{rangeText}</span>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: '#71717a', lineHeight: 1.5, marginTop: -2 }}>{t.criteria}</div>

      {/* Company rows */}
      {named.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px,1fr))', gap: 6 }}>
          {named.map((c, i) => <CompanyRow key={i} c={c} accent={t.accent} />)}
        </div>
      )}

      {/* "~N further companies" summary */}
      {t.more && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '9px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.015)', border: '1px dashed #26262b',
        }}>
          {t.more.rankLabel && (
            <span style={{ fontSize: 11, color: '#52525b', fontFamily: 'ui-monospace,monospace' }}>{t.more.rankLabel}</span>
          )}
          <span style={{ fontSize: 12, color: '#8a8a92', flex: 1 }}>{t.more.label}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#71717a', fontFamily: 'ui-monospace,monospace' }}>{t.more.scoreRange}</span>
        </div>
      )}
    </div>
  );
}

// One ranked company — subtle score-fill bar as the row background.
function CompanyRow({ c, accent }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', gap: 9,
      padding: '8px 12px', borderRadius: 9,
      background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c20',
    }}>
      {/* score-proportional fill */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: `${c.score}%`, background: `${accent}12`, pointerEvents: 'none',
      }} />
      {c.rank != null && (
        <span style={{
          position: 'relative', fontSize: 11, color: '#52525b', fontWeight: 700,
          fontFamily: 'ui-monospace,monospace', minWidth: 20,
        }}>{c.rank}</span>
      )}
      <span style={{ position: 'relative', fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>{c.name}</span>
      {c.toloka && (
        <span style={{
          position: 'relative', fontSize: 8.5, fontWeight: 800, letterSpacing: '0.06em',
          color: '#34d399', background: 'rgba(52,211,153,0.10)',
          border: '1px solid rgba(52,211,153,0.30)', borderRadius: 4, padding: '2px 5px',
        }}>TOLOKA</span>
      )}
      <span style={{ flex: 1 }} />
      <span style={{
        position: 'relative', fontSize: 14, fontWeight: 800, color: accent,
        fontFamily: 'ui-monospace,monospace',
      }}>{c.score}</span>
    </div>
  );
}

// ── Where Toloka's positions land ───────────────────────────────────────────
function TolokaPlacement({ d, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SubHead>{d.title}</SubHead>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {d.rows.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'baseline', gap: 12,
            padding: '10px 13px', borderRadius: 10,
            background: 'rgba(255,255,255,0.02)', border: '1px solid #1c1c20',
          }}>
            <span style={{
              fontSize: 15, fontWeight: 800, color: r.count ? '#34d399' : '#52525b',
              fontFamily: 'ui-monospace,monospace', minWidth: 20,
            }}>{r.count}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#e4e4e7' }}>{r.tier}</span>
              {r.names && <span style={{ fontSize: 11.5, color: '#71717a', lineHeight: 1.5 }}>{r.names}</span>}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        background: 'linear-gradient(135deg, rgba(52,211,153,0.10), rgba(251,191,36,0.05))',
        border: '1px solid rgba(52,211,153,0.30)', borderRadius: 12, padding: '13px 15px',
        fontSize: 12.5, color: '#d4d4d8', lineHeight: 1.65,
      }}>
        {d.consensus}
      </div>
      <div style={{ fontSize: 11.5, color: '#71717a', lineHeight: 1.55 }}>{d.precise_note}</div>
    </div>
  );
}

// Shared uppercase section label, matching YCBatchStats.
function SubHead({ children }) {
  return (
    <div style={{
      fontSize: 11, color: '#71717a', fontWeight: 700,
      fontFamily: 'ui-monospace,monospace', letterSpacing: '0.12em',
      textTransform: 'uppercase',
    }}>{children}</div>
  );
}
