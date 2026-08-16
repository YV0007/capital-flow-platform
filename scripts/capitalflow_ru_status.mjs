#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// Capital Flow — Russian translation gap report.
//
// The engine re-delivers capitalMap.json in English every cycle, so each new
// delivery can introduce entities, allocator profiles, trends, promotion
// candidates or subsector slugs that capitalMapRu.json does not cover yet.
// Those render in English (the adapter always falls back), which is safe but
// invisible — this script makes it visible.
//
//   npm run cf:ru            → summary + the missing keys, grouped
//   npm run cf:ru -- --json  → machine-readable, for the weekly routine
//
// Exit code is 0 even when gaps exist: a gap is a to-do, not a build failure.
// ══════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const map = read('src/data/capitalMap.json');
const ref = read('src/data/entityReference.json');
const ru = read('src/data/capitalMapRu.json');

const PROFILE_FIELDS = [
  'background', 'focus', 'style', 'thesis', 'strategy',
  'track_record_note', 'latest_investments_summary',
];
const trackKey = (r) => `${r.metric}|${r.fiscal_year}|${r.scope || ''}`;

const gaps = { subsectors: [], nodes: [], allocators: [], trends: [], promotions: [] };
const totals = { subsectors: 0, nodes: 0, allocators: 0, trends: 0, promotions: 0 };

// ── Subsector slugs (flows + nodes) ───────────────────────────────────────
const slugs = new Set();
(map.flows || []).forEach((f) => f.subsector && slugs.add(f.subsector));
(map.nodes || []).forEach((n) => n.subsector && slugs.add(n.subsector));
totals.subsectors = slugs.size;
[...slugs].sort().forEach((s) => { if (!ru.subsectors?.[s]) gaps.subsectors.push(s); });

// ── Node descriptions (engine first, then the curated reference file) ─────
(map.nodes || []).forEach((n) => {
  const english = n.description || ref[n.id]?.description;
  if (!english) return;              // nothing to translate — not a gap
  totals.nodes += 1;
  if (!ru.nodes?.[n.id]?.description) gaps.nodes.push(n.id);
});

// ── Allocator profiles + track-record notes ───────────────────────────────
Object.entries(map.allocators || {}).forEach(([name, a]) => {
  const t = ru.allocators?.[name] || {};
  const missing = [];
  PROFILE_FIELDS.forEach((f) => {
    if (!a.profile?.[f]) return;
    totals.allocators += 1;
    if (!t.profile?.[f]) missing.push(f);
  });
  (a.track_record || []).forEach((r) => {
    if (!r.notes) return;
    totals.allocators += 1;
    if (!t.track_record?.[trackKey(r)]?.notes) missing.push(`track_record:${trackKey(r)}`);
  });
  if (missing.length) gaps.allocators.push(`${name} → ${missing.join(', ')}`);
});

// ── Trend titles + narratives (deduped by cluster_id across windows) ──────
const seenTrend = new Set();
Object.values(map.trends || {}).forEach((list) => {
  (Array.isArray(list) ? list : []).forEach((t) => {
    if (!t.cluster_id || seenTrend.has(t.cluster_id)) return;
    seenTrend.add(t.cluster_id);
    const miss = [];
    if (t.title) { totals.trends += 1; if (!ru.trends?.[t.cluster_id]?.title) miss.push('title'); }
    if (t.narrative) { totals.trends += 1; if (!ru.trends?.[t.cluster_id]?.narrative) miss.push('narrative'); }
    if (miss.length) gaps.trends.push(`${t.cluster_id} → ${miss.join(', ')}`);
  });
});

// ── Promotion-queue descriptions ──────────────────────────────────────────
(map.promotion_queue || []).forEach((it) => {
  if (!it.description) return;
  totals.promotions += 1;
  if (!ru.promotions?.[it.candidate_id]?.description) gaps.promotions.push(it.candidate_id);
});

const totalGaps = Object.values(gaps).reduce((s, g) => s + g.length, 0);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ generated: map.generated, totals, gaps, totalGaps }, null, 2));
} else {
  const label = {
    subsectors: 'Подсекторы', nodes: 'Описания объектов', allocators: 'Профили инвесторов',
    trends: 'Тренды', promotions: 'Очередь на добавление',
  };
  console.log(`\nCapital Flow · перевод на русский — состояние (выгрузка ${map.generated})\n`);
  Object.keys(gaps).forEach((k) => {
    const missing = gaps[k].length;
    const total = totals[k];
    const done = total - missing;
    const pct = total ? Math.round((done / total) * 100) : 100;
    const mark = missing === 0 ? '✓' : '•';
    console.log(`${mark} ${label[k].padEnd(24)} ${String(done).padStart(4)}/${String(total).padEnd(4)} (${pct}%)`);
  });
  if (totalGaps === 0) {
    console.log('\nВсё переведено — новых английских строк в этой выгрузке нет.\n');
  } else {
    console.log(`\nНе переведено — ${totalGaps}:\n`);
    Object.keys(gaps).forEach((k) => {
      if (!gaps[k].length) return;
      console.log(`  ${label[k]}:`);
      gaps[k].forEach((g) => console.log(`    · ${g}`));
      console.log('');
    });
    console.log('Эти строки показываются на карте по-английски (адаптер откатывается к оригиналу).\n');
  }
}
