// ══════════════════════════════════════════════════════════════════════════
// FundGrid — the node view. Nodes WITHOUT links.
//
// The two maps in this section's siblings are graphs because their data is:
// Потоки draws transactions between parties, Экосистема draws standing
// positions between them. Fourteen independent funds have no meaningful edges
// between them, and drawing any would imply relationships that do not exist.
// So: the same node vocabulary — tile, mark, hairline border, monospace
// caption, generous air — and no edges, no force simulation, no canvas.
//
// A deterministic DOM grid rather than react-force-graph, because eighteen
// nodes do not need pan/zoom, and DOM gives crisp text, real hit targets and
// hover states for free. Clustering is by `style_tag`, which is the only
// grouping in the payload that says something about how a fund behaves.
//
//   size   ∝ book value (sqrt, so the biggest book does not swallow the grid)
//   colour = activity intensity — how much of the book actually MOVED this
//            period, by weight. A status signal, not decoration.
//
// Watch-only entities sit in their own band at the bottom, muted and outlined,
// and only appear at all when they have tripped a trigger.
// ══════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { Radio } from 'lucide-react';
import { STYLE_META, ACTIVITY_LEGEND, activityColor } from '../../../data/fundTracker.js';
import { fmtUSD, fmtPct } from './fundFormat.js';
import { MONO, hexA, LatencyBadge, FundMark, SparseFlag, Chip, useTone } from './FundBits.jsx';
import { useT, useL } from '../../../lib/i18n.jsx';

export default function FundGrid({
  funds, watch, selectedId, onSelect, topInset = 0,
}) {
  const t = useT();
  // Deterministic: group by style tag in the taxonomy's own order, funds by
  // book value inside each. Same payload → same picture, every reload.
  const clusters = useMemo(() => {
    const by = new Map();
    funds.forEach(f => {
      if (!by.has(f.style_tag)) by.set(f.style_tag, []);
      by.get(f.style_tag).push(f);
    });
    return [...by.entries()]
      .map(([key, list]) => ({
        key,
        meta: STYLE_META[key] || { label: key, color: '#8B8B95', order: 99 },
        funds: list.slice().sort((a, b) => (b.book_value_usd || 0) - (a.book_value_usd || 0)),
      }))
      .sort((a, b) => (a.meta.order ?? 99) - (b.meta.order ?? 99));
  }, [funds]);

  return (
    <div style={{
      position: 'absolute', top: topInset, left: 0, right: 0, bottom: 0,
      overflowY: 'auto', paddingTop: 20, paddingBottom: 80,
      background: 'var(--cf-canvas)',
    }}>
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '0 40px' }}>
        {clusters.map(c => (
          <section key={c.key} style={{ marginBottom: 46 }}>
            <ClusterHead meta={c.meta} count={c.funds.length} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, alignItems: 'flex-start' }}>
              {c.funds.map(f => (
                <FundNode key={f.id} fund={f} selected={f.id === selectedId} onSelect={onSelect} />
              ))}
            </div>
          </section>
        ))}

        {funds.length === 0 && (
          <div style={{
            padding: '80px 0', textAlign: 'center',
            color: 'var(--cf-text6)', fontFamily: MONO, fontSize: 12,
          }}>
            {t('Ни один фонд не проходит текущие фильтры.', 'No fund matches the current filters.')}
          </div>
        )}

        {watch.length > 0 && <WatchBand watch={watch} selectedId={selectedId} onSelect={onSelect} />}

        <ActivityLegend />
      </div>
    </div>
  );
}

function ClusterHead({ meta: raw, count }) {
  const meta = { ...raw, color: useTone()(raw.color) };
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 5 }}>
        <span style={{
          fontSize: 11.5, fontFamily: MONO, fontWeight: 800, color: meta.color,
          textTransform: 'uppercase', letterSpacing: '0.13em',
        }}>{meta.label}</span>
        <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--cf-text7)' }}>{count}</span>
        <div style={{ flex: 1, height: 1, background: hexA(meta.color, 0.16) }} />
      </div>
      {meta.blurb && (
        <div style={{ fontSize: 10.5, color: 'var(--cf-text6)', lineHeight: 1.5, maxWidth: 620 }}>
          {meta.blurb}
        </div>
      )}
    </div>
  );
}

function FundNode({ fund, selected, onSelect }) {
  const t = useT();
  const side = Math.round(104 + 78 * (fund.sizeShare || 0));
  const heat = useTone()(fund.activityColor);
  return (
    <button
      onClick={() => onSelect(fund.id)}
      title={t(
        `${fund.name}\n${fund.principal || ''}\nКнига ${fmtUSD(fund.book_value_usd)} · ${fund.position_count} позиций\nЗа период сдвинуто ${fmtPct(fund.movedShare, 0)} книги — ${fmtPct(fund.intensity, 0)} от самого активного фонда в файле`,
        `${fund.name}\n${fund.principal || ''}\nBook ${fmtUSD(fund.book_value_usd)} · ${fund.position_count} positions\n${fmtPct(fund.movedShare, 0)} of the book moved this period — ${fmtPct(fund.intensity, 0)} of the most active fund in the file`)}
      style={{
        width: side, minHeight: side, padding: '13px 13px 11px',
        display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left',
        background: selected ? 'var(--cf-surface3)' : 'var(--cf-surface1)',
        border: `1px solid ${selected ? 'var(--cf-text2)' : hexA(heat, 0.34)}`,
        borderRadius: 12, cursor: 'pointer',
        boxShadow: selected
          ? '0 0 0 2px var(--cf-text9), 0 14px 34px -14px var(--cf-shadow)'
          : `0 0 22px -10px ${hexA(heat, 0.55)}`,
        transition: 'border-color 130ms, background 130ms, transform 130ms',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FundMark fund={fund} size={Math.round(side * 0.26)} />
        {/* Activity pip — colour IS the status signal, so it gets a swatch. */}
        <span title={t(`За период сдвинуто ${fmtPct(fund.movedShare, 0)} книги`, `${fmtPct(fund.movedShare, 0)} of the book moved this period`)}
          style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: heat, flexShrink: 0 }} />
      </div>

      <div style={{
        fontSize: side > 150 ? 12.5 : 11.5, fontWeight: 700, color: 'var(--cf-text0)',
        lineHeight: 1.25, letterSpacing: '-0.005em',
      }}>{fund.short_name}</div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{
          fontSize: side > 150 ? 13 : 11.5, fontFamily: MONO, fontWeight: 700,
          color: 'var(--cf-text1)', fontVariantNumeric: 'tabular-nums',
        }}>{fmtUSD(fund.book_value_usd)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <LatencyBadge days={fund.latency_days} asOf={fund.as_of} form={fund.source_form} />
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cf-text6)' }}>
            {fund.position_count}
          </span>
          {fund.sparse_coverage && <SparseFlag inline />}
        </div>
      </div>
    </button>
  );
}

// ── watch-only band ──────────────────────────────────────────────────────
// A different class of object, so a different visual class: muted, outlined,
// no fill, no heat colour, and a header that says why they are here at all.
function WatchBand({ watch, selectedId, onSelect }) {
  const t = useT();
  const L = useL();
  return (
    <section style={{
      marginTop: 14, paddingTop: 22,
      borderTop: '1px dashed var(--cf-border-dashed)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 5 }}>
        <span style={{
          fontSize: 11.5, fontFamily: MONO, fontWeight: 800, color: 'var(--cf-muted)',
          textTransform: 'uppercase', letterSpacing: '0.13em',
        }}>{t('Под наблюдением', 'On watch')}</span>
        <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--cf-text7)' }}>{watch.length}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--cf-border-soft)' }} />
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--cf-text6)', lineHeight: 1.5, maxWidth: 660, marginBottom: 16 }}>
        {t(`Мульти-стратегии и маркет-мейкеры. Их книга — инвентарь сотен pod-ов, а не мнение,
        поэтому целиком она здесь не отслеживается. Появляются в разделе только тогда, когда
        сработало правило: пересечение порога, редкая форма, необычная концентрация.`,
           `Multi-strategy firms and market makers. Their book is the inventory of hundreds of pods rather than
        an opinion, so it is not tracked in full here. They enter the section only when a rule fires:
        a threshold crossing, a rare form, unusual concentration.`)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {watch.map(w => (
          <button key={w.id} onClick={() => onSelect(w.id)}
            title={t(`${w.name} — только сработавшие триггеры`, `${w.name} — fired triggers only`)}
            style={{
              width: 250, padding: '12px 13px', textAlign: 'left', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 9,
              background: selectedId === w.id ? 'var(--cf-surface2)' : 'transparent',
              border: `1px dashed ${selectedId === w.id ? 'var(--cf-text7)' : 'var(--cf-border-dashed)'}`,
              borderRadius: 12,
              transition: 'border-color 130ms, background 130ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cf-text8)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = selectedId === w.id ? 'var(--cf-text7)' : 'var(--cf-border-dashed)')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FundMark fund={w} size={26} radius={7} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cf-text2)' }}>{w.short_name}</span>
              <Chip color="#FF4A55" small title={t('Сработавшие правила', 'Rules fired')}>
                <Radio size={8} />{w.triggers.length}
              </Chip>
            </div>
            <div style={{
              fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text6)',
              lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{L(w.triggers[0]?.headline)}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ActivityLegend() {
  const t = useT();
  const tint = useTone();
  return (
    <div style={{
      marginTop: 40, paddingTop: 18, borderTop: '1px solid var(--cf-border-hair)',
      display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap',
    }}>
      <span style={{
        fontSize: 9, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text6)',
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>{t('Цвет узла · движение книги', 'Node colour · book movement')}</span>
      {ACTIVITY_LEGEND.map(l => (
        <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: tint(activityColor(l.t)) }} />
          <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--cf-text5)' }}>{l.label}</span>
        </span>
      ))}
      <span style={{
        marginLeft: 'auto', fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text7)',
      }}>{t('Размер узла · размер книги', 'Node size · book size')}</span>
    </div>
  );
}
