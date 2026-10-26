#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// Holdings news cap — keeps only the KEEP newest items in each holding's
// news[], newest first, and drops the rest. Run after every news refresh
// (see .claude/skills/holdings-news-refresh) so each holding always shows a
// fixed, fresh window instead of an ever-growing archive.
//
// Sorts by date (DD.MM.YYYY, or partial MM.YYYY / YYYY; unparseable dates
// count as oldest), ties keep their file order. Touches nothing but news[].
//
//   node scripts/trim_news.mjs             # apply
//   node scripts/trim_news.mjs --dry-run    # preview only
// ─────────────────────────────────────────────────────────────────────────
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const KEEP = 4;
const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'holdings-v2');
const dry = process.argv.includes('--dry-run');

// Same parser as holdings_status.mjs.
function parseRu(s) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(s || '').trim());
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
  const m2 = /^(\d{2})\.(\d{4})$/.exec(String(s || '').trim());
  if (m2) return Date.UTC(+m2[2], +m2[1] - 1, 1);
  const m3 = /^(\d{4})$/.exec(String(s || '').trim());
  if (m3) return Date.UTC(+m3[1], 0, 1);
  return 0;
}

for (const f of readdirSync(DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'))) {
  const path = join(DIR, f);
  const h = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(h.news)) continue;

  const before = h.news.length;
  const kept = [...h.news].sort((a, b) => parseRu(b.date) - parseRu(a.date)).slice(0, KEEP);
  const changed = JSON.stringify(kept) !== JSON.stringify(h.news);

  process.stdout.write(
    `${f.padEnd(20)} ${before} → ${kept.length}  [${kept.map((n) => n.date).join(', ')}]${changed ? '' : '  (unchanged)'}\n`,
  );
  if (!changed || dry) continue;
  h.news = kept;
  writeFileSync(path, JSON.stringify(h, null, 2));
}
