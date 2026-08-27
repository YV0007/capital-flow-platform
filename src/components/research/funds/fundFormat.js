// Formatting helpers specific to the Fund Tracker.
// The money/plural formatters are shared with the two maps — imported, not
// re-typed, so a change to how "$13,8 млрд" reads changes everywhere at once.

export { fmtUSD, plural, shortLabel } from '../capitalflow/format.js';
import { getLang } from '../../../lib/i18n.jsx';

/** 17,1% — weights and concentrations. `dp` decimals, always a percent sign. */
export function fmtPct(v, dp = 1) {
  if (v == null || Number.isNaN(v)) return '—';
  const s = (v * 100).toFixed(dp);
  return `${getLang() === 'en' ? s : s.replace('.', ',')}%`;
}

/** +18,4% / −62,0% — signed, for share deltas. */
export function fmtDelta(v, dp = 1) {
  if (v == null || Number.isNaN(v)) return '—';
  const raw = (v * 100).toFixed(dp);
  const s = getLang() === 'en' ? raw : raw.replace('.', ',');
  return v > 0 ? `+${s}%` : v < 0 ? `−${s.replace('-', '')}%` : `0%`;
}

/** 21,5 млн — share counts, which are large and never money. */
export function fmtShares(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const en = getLang() === 'en';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${trim(n / 1e9)}${en ? 'B' : ' млрд'}`;
  if (abs >= 1e6) return `${trim(n / 1e6)}${en ? 'M' : ' млн'}`;
  if (abs >= 1e3) return `${trim(n / 1e3)}${en ? 'K' : ' тыс'}`;
  return String(Math.round(n));
}
function trim(v) {
  if (Math.abs(v) >= 100) return String(Math.round(v));
  const r = Math.round(v * 10) / 10;
  const s = Number.isInteger(r) ? String(r) : r.toFixed(1);
  return getLang() === 'en' ? s : s.replace('.', ',');
}

/** 2026-06-30 → 30.06.2026 */
export function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).split('-');
  if (!d) return iso;
  return getLang() === 'en' ? `${y}-${m}-${d}` : `${d}.${m}.${y}`;
}

/** 52 дня назад — latency, spelled out so it cannot be mistaken for a date. */
export function fmtLatency(days) {
  const en = getLang() === 'en';
  if (days == null || Number.isNaN(days)) return en ? 'age unknown' : 'срок неизвестен';
  if (days <= 0) return en ? 'today' : 'сегодня';
  if (days === 1) return en ? 'yesterday' : 'вчера';
  const d = Math.round(days);
  if (en) return `${d} days ago`;
  return `${d} ${plural3(d, ['день', 'дня', 'дней'])} назад`;
}
function plural3(n, [one, few, many]) {
  const a = Math.abs(Math.round(n)), d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}

/** 9,4 кв. — average persistence. */
export const fmtQuarters = (v) => {
  if (v == null) return '—';
  const n = (Math.round(v * 10) / 10).toString();
  return getLang() === 'en' ? `${n}q` : `${n.replace('.', ',')} кв.`;
};

/** Returns line: +26,9% / −8,8%, with the provisional marker handled by callers. */
export function fmtReturn(pct) {
  if (pct == null) return '—';
  const raw = Math.abs(pct).toFixed(1);
  const s = getLang() === 'en' ? raw : raw.replace('.', ',');
  return pct >= 0 ? `+${s}%` : `−${s}%`;
}
