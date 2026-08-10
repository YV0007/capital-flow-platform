#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// Holdings freshness status — the deterministic "what's stale" step for the
// weekly holdings-news refresh (see .claude/skills/holdings-news-refresh).
//
// Prints one JSON object per real holding: { id, name, ticker, asOf,
// newestNews, cutoff }, where `cutoff` is the date after which new news items
// should be proposed (= newestNews, or asOf if there is no news). Dates are the
// dashboard's DD.MM.YYYY. Underscore-prefixed working files are skipped.
//
//   node scripts/holdings_status.mjs           # human table
//   node scripts/holdings_status.mjs --json     # JSON array (for the routine)
// ─────────────────────────────────────────────────────────────────────────
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'holdings-v2');

// DD.MM.YYYY (or partial MM.YYYY / YYYY) → sortable epoch; junk → 0.
function parseRu(s) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(s || '').trim());
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
  const m2 = /^(\d{2})\.(\d{4})$/.exec(String(s || '').trim());
  if (m2) return Date.UTC(+m2[2], +m2[1] - 1, 1);
  const m3 = /^(\d{4})$/.exec(String(s || '').trim());
  if (m3) return Date.UTC(+m3[1], 0, 1);
  return 0;
}

const rows = readdirSync(DIR)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .map((f) => {
    const h = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
    const news = Array.isArray(h.news) ? h.news : [];
    const newest = news.reduce(
      (best, n) => (parseRu(n.date) > parseRu(best) ? n.date : best),
      '',
    );
    return {
      id: h.id || f.replace(/\.json$/, ''),
      name: h.name || '',
      ticker: h.ticker || '',
      asOf: h.asOf || '',
      newestNews: newest || null,
      cutoff: newest || h.asOf || null,
    };
  })
  .sort((a, b) => parseRu(a.cutoff) - parseRu(b.cutoff)); // stalest first

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
} else {
  for (const r of rows) {
    process.stdout.write(
      `${r.id.padEnd(14)} ${String(r.name).padEnd(24)} ${String(r.ticker).padEnd(18)} asOf=${r.asOf}  newest=${r.newestNews || '—'}  cutoff=${r.cutoff || '—'}\n`,
    );
  }
}
