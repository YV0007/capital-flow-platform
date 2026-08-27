#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// Holdings — weekly price refresh.
//
//   node scripts/refresh_prices.mjs            # write
//   node scripts/refresh_prices.mjs --dry-run  # print, touch nothing
//   node scripts/refresh_prices.mjs kkr tpg    # only these holdings
//
// Rewrites `priceChart` in each src/data/holdings-v2/<id>.json from real
// Yahoo Finance quotes. This is a SCRIPT and not a research step on purpose:
// prices are the one part of Holdings that is pure arithmetic over a public
// series, so it should be exact and repeatable rather than re-read off a web
// page every Monday. Nothing else in the file is touched — not news, not asOf.
//
// THE INVARIANT the old hand-maintained data kept breaking: `current`,
// `change` and `points[]` are ONE object. `change` is period-relative — from
// the first weekly close to the price shown — and the chart's last point IS
// the price shown. Editing `current` alone silently desyncs all three, which
// is why the skill used to say "leave prices alone".
//
// Failure is loud and safe: a holding whose fetch fails keeps its old block
// and the script exits non-zero, so a broken symbol shows up in the weekly
// run instead of quietly freezing a stale number.
// ══════════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'src/data/holdings-v2');

// holding id → the symbol whose price the card actually shows. Where a company
// has several listings, this picks the one the dashboard has always displayed,
// so the number stays comparable week to week:
//   berkshire  — the B share, the one anyone quotes
//   brookfield — BN (the corporation), not BAM (the manager)
//   softbank   — the US ADR, so the card stays in dollars rather than yen
//   pershing   — the USD OTC line; PSH.L quotes in pence and PSH.AS 404s
const SYMBOLS = {
  berkshire:     'BRK-B',
  blackrock:     'BLK',
  brookfield:    'BN',
  constellation: 'CSU.TO',
  fairfax:       'FFH.TO',
  kkr:           'KKR',
  pershing:      'PSHZF',
  softbank:      'SFTBY',
  tpg:           'TPG',
};

const RU_MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн',
                   'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

// Symbol per currency where one is idiomatic; anything else falls back to the
// ISO code as a suffix, which is ugly but never misleading.
const CURRENCY = { USD: '$', CAD: 'C$', EUR: '€', GBP: '£', JPY: '¥', CHF: 'CHF ' };

const money = (value, currency) => {
  const digits = currency === 'JPY' ? 0 : 2;
  const n = value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const sym = CURRENCY[currency];
  return sym ? `${sym}${n}` : `${n} ${currency}`;
};

// U+2212 MINUS, not a hyphen — it is what the existing data uses and it lines
// up with digits in the monospaced card.
const percent = (p) => `${p < 0 ? '−' : '+'}${Math.abs(p).toFixed(1)}%`;

const monthLabel = (seconds) => {
  const d = new Date(seconds * 1000);
  return `${RU_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

async function fetchChart(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`
    + '?range=1y&interval=1wk';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  const result = body?.chart?.result?.[0];
  if (!result) throw new Error(body?.chart?.error?.description || 'no result in response');

  const { currency, regularMarketPrice } = result.meta || {};
  const stamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  if (!currency || typeof regularMarketPrice !== 'number') throw new Error('no live price');

  // Yahoo nulls out holiday weeks; drop them and keep stamp/close aligned.
  const series = stamps
    .map((t, i) => ({ t, c: closes[i] }))
    .filter(p => typeof p.c === 'number' && Number.isFinite(p.c));
  if (series.length < 10) throw new Error(`only ${series.length} usable weeks`);

  // The chart must END on the price the card prints, or the two disagree by a
  // few days and the eye catches it.
  series[series.length - 1] = { t: series[series.length - 1].t, c: regularMarketPrice };

  const first = series[0].c;
  return {
    current: money(regularMarketPrice, currency),
    change: percent(((regularMarketPrice - first) / first) * 100),
    period: '1Y',
    points: series.map(p => Number(p.c.toFixed(2))),
    start: monthLabel(series[0].t),
    end: monthLabel(series[series.length - 1].t),
  };
}

// Replace ONLY the priceChart block, leaving every other byte of the file
// alone. Parsing and re-serialising a 300 KB file would reformat it end to end
// and bury the one real change in a diff nobody can review.
function splicePriceChart(source, chart) {
  const key = '"priceChart": {';
  const at = source.indexOf(key);
  if (at === -1) throw new Error('no priceChart block');
  let depth = 0, end = -1;
  for (let i = at + key.length - 1; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error('unterminated priceChart block');
  // The files are indented with a single space; the block sits one level in,
  // so every line after the opening brace needs one more space.
  const body = JSON.stringify(chart, null, 1).split('\n').join('\n ');
  return source.slice(0, at) + `"priceChart": ${body}` + source.slice(end + 1);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const only = args.filter(a => !a.startsWith('--'));
const ids = (only.length ? only : Object.keys(SYMBOLS)).sort();

const failures = [];
for (const id of ids) {
  const symbol = SYMBOLS[id];
  if (!symbol) { failures.push(`${id}: unknown holding`); continue; }
  const file = join(DIR, `${id}.json`);
  try {
    const chart = await fetchChart(symbol);
    const source = readFileSync(file, 'utf8');
    const before = JSON.parse(source).priceChart || {};
    const next = splicePriceChart(source, chart);
    JSON.parse(next);                       // never write a file we just broke
    if (!dryRun) writeFileSync(file, next);
    console.log(
      `${id.padEnd(14)} ${symbol.padEnd(8)} ${String(before.current ?? '—').padStart(12)}`
      + ` → ${chart.current.padStart(12)}  ${chart.change.padStart(7)}`
      + `  ${chart.points.length} pts  ${chart.start} → ${chart.end}`
    );
  } catch (err) {
    failures.push(`${id} (${symbol}): ${err.message}`);
    console.error(`${id.padEnd(14)} ${symbol.padEnd(8)} FAILED — ${err.message}`);
  }
}

if (dryRun) console.log('\n--dry-run: nothing written.');
if (failures.length) {
  console.error(`\n${failures.length} holding(s) failed, their prices are unchanged:`);
  failures.forEach(f => console.error(`  · ${f}`));
  process.exit(1);
}
console.log(`\n${ids.length} holding(s) refreshed.`);
