// Formatting helpers specific to the Fund Tracker.
// The money/plural formatters are shared with the two maps — imported, not
// re-typed, so a change to how "$13,8 млрд" reads changes everywhere at once.

export { fmtUSD, plural, shortLabel } from '../capitalflow/format.js';

/** 17,1% — weights and concentrations. `dp` decimals, always a percent sign. */
export function fmtPct(v, dp = 1) {
  if (v == null || Number.isNaN(v)) return '—';
  return `${(v * 100).toFixed(dp).replace('.', ',')}%`;
}

/** +18,4% / −62,0% — signed, for share deltas. */
export function fmtDelta(v, dp = 1) {
  if (v == null || Number.isNaN(v)) return '—';
  const s = (v * 100).toFixed(dp).replace('.', ',');
  return v > 0 ? `+${s}%` : v < 0 ? `−${s.replace('-', '')}%` : `0%`;
}

/** 21,5 млн — share counts, which are large and never money. */
export function fmtShares(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${trim(n / 1e9)} млрд`;
  if (abs >= 1e6) return `${trim(n / 1e6)} млн`;
  if (abs >= 1e3) return `${trim(n / 1e3)} тыс`;
  return String(Math.round(n));
}
function trim(v) {
  if (Math.abs(v) >= 100) return String(Math.round(v));
  const r = Math.round(v * 10) / 10;
  return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace('.', ',');
}

/** 2026-06-30 → 30.06.2026 */
export function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).split('-');
  return d ? `${d}.${m}.${y}` : iso;
}

/** 52 дня назад — latency, spelled out so it cannot be mistaken for a date. */
export function fmtLatency(days) {
  if (days == null || Number.isNaN(days)) return 'срок неизвестен';
  if (days <= 0) return 'сегодня';
  if (days === 1) return 'вчера';
  const d = Math.round(days);
  const word = plural3(d, ['день', 'дня', 'дней']);
  return `${d} ${word} назад`;
}
function plural3(n, [one, few, many]) {
  const a = Math.abs(Math.round(n)), d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}

/** 9,4 кв. — average persistence. */
export const fmtQuarters = (v) =>
  v == null ? '—' : `${(Math.round(v * 10) / 10).toString().replace('.', ',')} кв.`;

/** Returns line: +26,9% / −8,8%, with the provisional marker handled by callers. */
export function fmtReturn(pct) {
  if (pct == null) return '—';
  const s = Math.abs(pct).toFixed(1).replace('.', ',');
  return pct >= 0 ? `+${s}%` : `−${s}%`;
}
