// ══════════════════════════════════════════════════════════════════════════
// Holdings translation status.
//
// The Holdings prose is hand-written Russian; English lives in the flat,
// path-keyed sidecar `src/data/holdings.en.json`, overlaid by `holdingsEn.js`.
// This reports how far that sidecar has got, and hands out the work.
//
//   node scripts/holdings_en_status.mjs              coverage per scope
//   node scripts/holdings_en_status.mjs <scope>      the untranslated paths of
//                                                    one scope, as a skeleton
//   node scripts/holdings_en_status.mjs <scope> --chars 20000 [--skip N]
//                                                    a bite-sized slice of one
//                                                    scope, in source order
//   … --batch work/b7                                the same slice keyed by
//                                                    NUMBER, with the paths
//                                                    parked in work/b7.map.json
//
// WHY --batch EXISTS. A dotted path is 50–70 characters and the value it
// carries is often shorter than that. Handing a translator 400 of them means
// most of the page is bookkeeping, and the translation has to copy every path
// back out again, doubling the chance of a typo that the merge gate then
// rejects. `--batch` prints `{ "1": "…" }` and writes the number→path map next
// to it; `holdings_en_merge.mjs --map` puts the paths back.
// ══════════════════════════════════════════════════════════════════════════
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { sources, walk, loadEn, done } from './holdings_en_common.mjs';

const args  = process.argv.slice(2);
const only  = args.find(a => !a.startsWith('--'));
const num   = (flag, dflt) => { const i = args.indexOf(flag); return i < 0 ? dflt : Number(args[i + 1]); };
const LIMIT = num('--chars', 0);
const SKIP  = num('--skip', 0);
const str   = (flag) => { const i = args.indexOf(flag); return i < 0 ? null : args[i + 1]; };
const BATCH = str('--batch');

const en = loadEn();
const all = sources();

if (only) {
  const src = all.find(s => s.scope === only);
  if (!src) { console.error(`unknown scope: ${only}\n  try one of: ${all.map(s => s.scope).join(', ')}`); process.exit(1); }
  let gaps = walk(src.data, src.scope).filter(([p]) => !done(en, p));
  gaps = gaps.slice(SKIP);
  if (LIMIT > 0) {
    const cut = []; let n = 0;
    for (const g of gaps) { if (n && n + g[1].length > LIMIT) break; cut.push(g); n += g[1].length; }
    gaps = cut;
  }
  const skeleton = {};
  if (BATCH) {
    const map = {};
    gaps.forEach(([p, v], i) => { skeleton[i + 1] = v; map[i + 1] = p; });
    mkdirSync(dirname(BATCH), { recursive: true });
    writeFileSync(`${BATCH}.map.json`, JSON.stringify(map, null, 1) + '\n', 'utf8');
  } else {
    for (const [p, v] of gaps) skeleton[p] = v;
  }
  console.log(JSON.stringify(skeleton, null, 1));
  process.exit(0);
}

let doneAll = 0, totalAll = 0, charsLeft = 0;
const rows = [];
for (const { scope, data } of all) {
  const gaps = walk(data, scope);
  const d = gaps.filter(([p]) => done(en, p)).length;
  doneAll += d; totalAll += gaps.length;
  charsLeft += gaps.filter(([p]) => !done(en, p)).reduce((a, [, v]) => a + v.length, 0);
  rows.push([scope, d, gaps.length]);
}
rows.sort((a, b) => (a[1] / a[2]) - (b[1] / b[2]) || b[2] - a[2]);
for (const [scope, d, total] of rows) {
  const pct = total ? Math.round((d / total) * 100) : 100;
  console.log(`${d === total ? '✓' : '·'} ${scope.padEnd(22)} ${String(d).padStart(5)}/${String(total).padEnd(5)} ${String(pct).padStart(3)}%`);
}
console.log(`\n  ${doneAll}/${totalAll} (${totalAll ? Math.round((doneAll / totalAll) * 100) : 100}%) переведено · ${charsLeft.toLocaleString('ru-RU')} знаков осталось`);
