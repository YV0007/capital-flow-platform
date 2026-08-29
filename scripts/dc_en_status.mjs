// ══════════════════════════════════════════════════════════════════════════
// DC deep-dive translation status.
//
// `dc-details.json` is the research prose behind the Data-Centres & AI
// section — 28 sector nodes, all written in Russian. English lives in the
// flat, path-keyed sidecar `dc-details.en.json`, overlaid at read time by
// Roadmap.jsx. This reports how far that sidecar has got, per node.
//
//   node scripts/dc_en_status.mjs            per-node coverage
//   node scripts/dc_en_status.mjs <node>     dump the untranslated paths of
//                                            one node as a JSON skeleton
// ══════════════════════════════════════════════════════════════════════════
import { readFileSync, existsSync } from 'node:fs';

const CYR = /[А-Яа-яЁё]/;
const ru = JSON.parse(readFileSync(new URL('../src/data/dc-details.json', import.meta.url), 'utf8'));
const enPath = new URL('../src/data/dc-details.en.json', import.meta.url);
const en = existsSync(enPath) ? JSON.parse(readFileSync(enPath, 'utf8')) : {};

// Only strings carrying Cyrillic need a translation. A ticker, a number or a
// company name reads the same in both languages and is not a gap.
function walk(v, prefix, out) {
  if (typeof v === 'string') { if (CYR.test(v)) out.push([prefix, v]); return out; }
  if (Array.isArray(v)) { v.forEach((x, i) => walk(x, prefix + '.' + i, out)); return out; }
  if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) walk(v[k], prefix ? prefix + '.' + k : k, out);
  }
  return out;
}

const only = process.argv[2];
const nodes = Object.keys(ru).filter(k => !k.startsWith('_'));

if (only) {
  if (!nodes.includes(only)) { console.error(`unknown node: ${only}`); process.exit(1); }
  const gaps = walk(ru[only], only, []).filter(([p]) => typeof en[p] !== 'string' || en[p] === '');
  const skeleton = {};
  for (const [p, v] of gaps) skeleton[p] = v;
  console.log(JSON.stringify(skeleton, null, 2));
  process.exit(0);
}

let doneAll = 0, totalAll = 0;
const rows = [];
for (const id of nodes) {
  const all = walk(ru[id], id, []);
  const done = all.filter(([p]) => typeof en[p] === 'string' && en[p] !== '').length;
  doneAll += done; totalAll += all.length;
  rows.push([id, done, all.length]);
}
rows.sort((a, b) => (a[1] / a[2]) - (b[1] / b[2]) || b[2] - a[2]);
for (const [id, done, total] of rows) {
  const pct = Math.round((done / total) * 100);
  console.log(`${done === total ? '✓' : '·'} ${id.padEnd(14)} ${String(done).padStart(4)}/${String(total).padEnd(4)} ${String(pct).padStart(3)}%`);
}
console.log(`\n  ${doneAll}/${totalAll} (${Math.round((doneAll / totalAll) * 100)}%) переведено`);
