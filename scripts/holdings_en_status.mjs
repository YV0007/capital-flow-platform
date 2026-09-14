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
// ══════════════════════════════════════════════════════════════════════════
import { sources, walk, loadEn, done } from './holdings_en_common.mjs';

const args  = process.argv.slice(2);
const only  = args.find(a => !a.startsWith('--'));
const num   = (flag, dflt) => { const i = args.indexOf(flag); return i < 0 ? dflt : Number(args[i + 1]); };
const LIMIT = num('--chars', 0);
const SKIP  = num('--skip', 0);

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
  for (const [p, v] of gaps) skeleton[p] = v;
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
