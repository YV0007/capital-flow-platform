// ══════════════════════════════════════════════════════════════════════════
// Shared atoms for the Fund Tracker.
//
// Two of these are not decoration but the section's display guards, and every
// surface is required to route through them:
//
//   <LatencyBadge>  — a filing's age. Mandatory next to any number that came
//                     from a filing. A 13F line can be 135 days old; a Form 4
//                     is two. Rendering them alike would be a correctness bug.
//   <Delta>         — a share-based % change, WITHHELD below the payload's
//                     weight threshold. A big percent on a tiny line is
//                     dramatic and meaningless, so it is not shown at all.
// ══════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { ExternalLink, AlertTriangle, EyeOff } from 'lucide-react';
import { useThemeMode, tone } from '../capitalflow/canvasTheme.js';
import { latencyBand, deltaSuppressedNote, formMeta as formMetaOf } from '../../../data/fundTracker.js';
import { fmtDelta, fmtLatency, fmtDate } from './fundFormat.js';

export const MONO = 'ui-monospace, monospace';

/**
 * The semantic palette (style tags, actions, forms, the activity heat ramp) is
 * tuned for a near-black canvas. On the light theme #34D399 and #C2A36B all
 * but vanish. `tone()` — shared with both maps — darkens only what is actually
 * too bright to read, preserving hue and relative order, so there is no second
 * palette to keep in sync. Every atom below tones its own colour prop, which
 * is why callers can keep passing raw payload colours.
 */
export function useTone() {
  const mode = useThemeMode();
  return useCallback((c) => tone(c, mode), [mode]);
}

export function hexA(hex, a) {
  const h = String(hex || '').replace('#', '');
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(f, 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Latency badge — mandatory wherever a filing-sourced number is rendered. */
export function LatencyBadge({ days, asOf, size = 'sm', form }) {
  const t = useTone();
  const band = latencyBand(days);
  const b = { ...band, color: t(band.color) };
  const big = size === 'lg';
  const tip = [
    `${b.label} · ${fmtLatency(days)}`,
    asOf ? `Срез на ${fmtDate(asOf)}` : null,
    form ? `${formMetaOf(form).label}: ${formMetaOf(form).lag || ''}`.trim() : null,
    b.blurb,
  ].filter(Boolean).join('\n');
  return (
    <span title={tip} style={{
      display: 'inline-flex', alignItems: 'center', gap: big ? 6 : 4,
      padding: big ? '4px 9px' : '2px 6px',
      background: hexA(b.color, 0.11), border: `1px solid ${hexA(b.color, 0.42)}`,
      borderRadius: 5, color: b.color, whiteSpace: 'nowrap',
      fontSize: big ? 10.5 : 9, fontFamily: MONO, fontWeight: 700,
      letterSpacing: '0.05em', cursor: 'help',
    }}>
      <span style={{ width: big ? 6 : 5, height: big ? 6 : 5, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
      {big ? `${b.label} · ${fmtLatency(days)}` : b.short}
    </span>
  );
}

/** Which filing layer this row came from. Freshness differs wildly by form. */
export function FormBadge({ form, small = false }) {
  const t = useTone();
  const raw = formMetaOf(form);
  const m = { ...raw, color: t(raw.color) };
  return (
    <span title={m.lag ? `${form} — ${m.lag}` : form} style={{
      display: 'inline-block', padding: small ? '1px 5px' : '2px 6px',
      background: hexA(m.color, 0.10), border: `1px solid ${hexA(m.color, 0.34)}`,
      borderRadius: 4, color: m.color, whiteSpace: 'nowrap',
      fontSize: small ? 8.5 : 9, fontFamily: MONO, fontWeight: 700,
      letterSpacing: '0.05em', cursor: 'help',
    }}>{m.label}</span>
  );
}

export function Chip({ color: rawColor, children, title, on = true, small = false }) {
  const color = useTone()(rawColor);
  return (
    <span title={title} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '1px 5px' : '2px 7px',
      background: on ? hexA(color, 0.12) : 'transparent',
      border: `1px solid ${hexA(color, on ? 0.40 : 0.20)}`,
      borderRadius: 4, color, whiteSpace: 'nowrap',
      fontSize: small ? 8.5 : 9.5, fontFamily: MONO, fontWeight: 700,
      letterSpacing: '0.05em', cursor: title ? 'help' : 'default',
    }}>{children}</span>
  );
}

/**
 * DISPLAY GUARD — share-based % change, withheld on positions too small for it
 * to mean anything. `shown` comes from the adapter's weight threshold.
 */
export function Delta({ value, shown = true, weight }) {
  if (value == null) return <span style={{ color: 'var(--cf-text8)' }}>—</span>;
  if (!shown) {
    return (
      <span title={deltaSuppressedNote()} style={{
        color: 'var(--cf-text8)', fontFamily: MONO, fontSize: 10,
        cursor: 'help', letterSpacing: '0.04em',
      }}>
        <EyeOff size={9} style={{ verticalAlign: -1, marginRight: 3 }} />скрыто
      </span>
    );
  }
  const up = value > 0;
  return (
    <span style={{
      color: up ? 'var(--cf-good)' : value < 0 ? 'var(--cf-bad)' : 'var(--cf-text5)',
      fontFamily: MONO, fontSize: 10.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
    }}>{fmtDelta(value)}</span>
  );
}

/** Every figure traceable to its filing. */
export function SourceLink({ url, children = 'форма', title }) {
  if (!url) return <span style={{ color: 'var(--cf-text8)', fontSize: 9, fontFamily: MONO }}>без ссылки</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={title || 'Открыть первоисточник'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        color: 'var(--cf-link)', fontSize: 9.5, fontFamily: MONO, fontWeight: 600,
        textDecoration: 'none', letterSpacing: '0.04em',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-link-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-link)')}>
      {children}<ExternalLink size={9} />
    </a>
  );
}

/** Family offices file below thresholds — thin is not the same as quiet. */
export function SparseFlag({ inline = false }) {
  return (
    <span title={'Раскрытие структурно неполное. Family office не обязан показывать позиции ниже порогов 13F, деривативы и долг. Пустая строка здесь означает «не видно», а не «нет позиции».'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: inline ? '1px 6px' : '5px 9px',
        background: 'var(--cf-warn-bg)', border: '1px solid var(--cf-warn-bd)',
        borderRadius: 5, color: 'var(--cf-warn)',
        fontSize: inline ? 9 : 10, fontFamily: MONO, fontWeight: 700,
        letterSpacing: '0.04em', cursor: 'help',
      }}>
      <AlertTriangle size={inline ? 9 : 11} />
      {inline ? 'НЕПОЛНО' : 'Раскрытие неполное по построению'}
    </span>
  );
}

export function Label({ children, style }) {
  return (
    <div style={{
      fontSize: 9, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text6)',
      textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: 7, ...style,
    }}>{children}</div>
  );
}

/** A number with its caption. The panel is made almost entirely of these. */
export function Stat({ label, value, sub, color, title, align = 'left' }) {
  return (
    <div title={title} style={{ minWidth: 0, textAlign: align, cursor: title ? 'help' : 'default' }}>
      <div style={{
        fontSize: 8.5, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text6)',
        textTransform: 'uppercase', letterSpacing: '0.11em', marginBottom: 4,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{label}</div>
      <div style={{
        fontSize: 15, fontFamily: MONO, fontWeight: 700, lineHeight: 1.1,
        color: color || 'var(--cf-text0)', fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/** Monogram tile — funds have no logo pipeline, so initials on a plate. */
export function FundMark({ fund, size = 34, radius = 8 }) {
  const t = useTone();
  const initials = (fund.short_name || fund.name || '?')
    .replace(/[^A-Za-zА-Яа-яЁё0-9 ]/g, ' ')
    .split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const c = t(fund.styleMeta?.color || 'var(--cf-text5)');
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      display: 'grid', placeItems: 'center',
      background: hexA(c, fund.isWatch ? 0.06 : 0.13),
      border: `1px solid ${hexA(c, fund.isWatch ? 0.28 : 0.45)}`,
      color: c, fontFamily: MONO, fontWeight: 800,
      fontSize: size * 0.36, letterSpacing: '0.02em',
    }}>{initials}</div>
  );
}
