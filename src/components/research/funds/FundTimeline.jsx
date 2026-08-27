// ══════════════════════════════════════════════════════════════════════════
// FundTimeline — every fund_event in the universe, newest first.
//
// This is what makes the section feel alive between quarterly 13F prints.
// The layers arrive at wildly different speeds — ARK daily, short registers
// daily, Form 4 in ~2 days, 13D in ~5, 13F once a quarter — so the feed is
// where the section's real cadence shows.
//
// The two loudest rows in the system get the loudest treatment: a 13F-HR/A
// (a confidential-treatment release — a position the fund was allowed to hide
// while it was building it) and a watch-only trigger.
// ══════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { Zap } from 'lucide-react';
import { EVENT_TYPE_META } from '../../../data/fundTracker.js';
import { fmtUSD, fmtDate, fmtLatency } from './fundFormat.js';
import { MONO, hexA, LatencyBadge, FormBadge, SourceLink, useTone } from './FundBits.jsx';
import { useT } from '../../../lib/i18n.jsx';

export default function FundTimeline({ events, onSelect, onOpenSecurity, topInset = 0 }) {
  const t = useT();
  const tint = useTone();
  const [types, setTypes] = useState(new Set());
  const [loudOnly, setLoudOnly] = useState(false);

  const present = useMemo(() => {
    const c = new Map();
    events.forEach(e => c.set(e.type, (c.get(e.type) || 0) + 1));
    return [...c.entries()]
      .map(([k, n]) => ({ key: k, n, meta: EVENT_TYPE_META[k] || { label: k, color: '#8B8B95', order: 9 } }))
      .sort((a, b) => (a.meta.order ?? 9) - (b.meta.order ?? 9));
  }, [events]);

  const rows = useMemo(() => events.filter(e =>
    (!types.size || types.has(e.type)) && (!loudOnly || e.meta.loud)
  ), [events, types, loudOnly]);

  // Grouped by day so the cadence is visible, not just the order.
  const days = useMemo(() => {
    const out = [];
    rows.forEach(e => {
      const last = out[out.length - 1];
      if (last && last.date === e.date) last.items.push(e);
      else out.push({ date: e.date, items: [e] });
    });
    return out;
  }, [rows]);

  const toggle = (k) => setTypes(s => {
    const n = new Set(s);
    n.has(k) ? n.delete(k) : n.add(k);
    return n;
  });

  return (
    <div style={{
      position: 'absolute', top: topInset, left: 0, right: 0, bottom: 0,
      overflowY: 'auto', background: 'var(--cf-canvas)',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 24px 80px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          <button onClick={() => setLoudOnly(v => !v)}
            title={t('Только самые редкие и информативные события: поправки 13F, 13D, TR-1, реестры шортов, триггеры наблюдения.', 'Only the rarest, highest-information events: 13F amendments, 13Ds, TR-1s, short registers, watch triggers.')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px',
              background: loudOnly ? hexA('#FF4A55', 0.12) : 'var(--cf-surface2)',
              border: `1px solid ${loudOnly ? hexA('#FF4A55', 0.5) : 'var(--cf-border)'}`,
              borderRadius: 6, cursor: 'pointer',
              color: loudOnly ? '#FF4A55' : 'var(--cf-text4)',
              fontSize: 9.5, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.06em',
            }}>
            <Zap size={10} /> {t('ТОЛЬКО СИГНАЛ', 'SIGNAL ONLY')}
          </button>
          {present.map(ty => {
            const on = types.has(ty.key);
            const tc = tint(ty.meta.color);
            return (
              <button key={ty.key} onClick={() => toggle(ty.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px',
                  background: on ? hexA(tc, 0.14) : 'transparent',
                  border: `1px solid ${on ? hexA(tc, 0.5) : 'var(--cf-border-soft)'}`,
                  borderRadius: 6, cursor: 'pointer',
                  color: on ? tc : 'var(--cf-text5)',
                  fontSize: 9.5, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.04em',
                }}>
                {ty.meta.label}
                <span style={{ color: 'var(--cf-text7)' }}>{ty.n}</span>
              </button>
            );
          })}
        </div>

        {days.length === 0 && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--cf-text6)', fontFamily: MONO, fontSize: 12 }}>
            {t('Нет событий под выбранными фильтрами.', 'No events match the selected filters.')}
          </div>
        )}

        {days.map(d => (
          <section key={d.date} style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
              <span style={{
                fontSize: 10, fontFamily: MONO, fontWeight: 800, color: 'var(--cf-text3)',
                letterSpacing: '0.09em',
              }}>{fmtDate(d.date)}</span>
              <div style={{ flex: 1, height: 1, background: 'var(--cf-border-hair)' }} />
              <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cf-text7)' }}>{d.items.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {d.items.map(e => <EventRow key={e.id} e={e} onSelect={onSelect} onOpenSecurity={onOpenSecurity} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function EventRow({ e, onSelect, onOpenSecurity }) {
  const t = useT();
  const loud = e.meta.loud;
  const c = useTone()(e.meta.color);
  return (
    <div style={{
      display: 'flex', gap: 11, padding: loud ? '12px 13px' : '9px 12px',
      background: loud ? hexA(c, 0.055) : 'var(--cf-surface1)',
      border: `1px solid ${loud ? hexA(c, 0.34) : 'var(--cf-border-hair)'}`,
      borderLeft: `3px solid ${hexA(c, loud ? 0.85 : 0.35)}`,
      borderRadius: 9,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{
            fontSize: 9, fontFamily: MONO, fontWeight: 800, color: c,
            textTransform: 'uppercase', letterSpacing: '0.09em',
          }}>{e.meta.label}</span>
          <button onClick={() => onSelect?.(e.fund_id)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: 11, fontWeight: 700, color: 'var(--cf-text1)',
            }}>{e.fund}</button>
          {e.ticker && (
            <button onClick={() => onOpenSecurity?.(e.ticker)}
              title={t('Открыть таблицу держателей', 'Open the holder table')}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontSize: 10, fontFamily: MONO, fontWeight: 800, color: 'var(--cf-link)',
              }}>{e.ticker}</button>
          )}
          {e.magnitude_usd != null && (
            <span style={{
              marginLeft: 'auto', fontSize: 11.5, fontFamily: MONO, fontWeight: 700,
              color: 'var(--cf-text1)', fontVariantNumeric: 'tabular-nums',
            }}>{fmtUSD(e.magnitude_usd)}</span>
          )}
        </div>
        <div style={{
          fontSize: loud ? 11.5 : 11, color: loud ? 'var(--cf-text1)' : 'var(--cf-text3)',
          lineHeight: 1.55, marginBottom: 7,
        }}>{e.headline}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <LatencyBadge days={e.latency_days} form={e.source_form} />
          <FormBadge form={e.source_form} small />
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cf-text7)' }}>
            {fmtLatency(e.latency_days)} {t('от события', 'from the event')}
          </span>
          <span style={{ marginLeft: 'auto' }}><SourceLink url={e.source_url} /></span>
        </div>
      </div>
    </div>
  );
}
