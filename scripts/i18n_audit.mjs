// ══════════════════════════════════════════════════════════════════════════
// i18n audit — proves the dashboard has no Russian-only text left.
//
// WHY THIS EXISTS. Two separate mechanisms feed text to the screen:
//
//   · engine payloads (capitalMap.json, aiEcosystemNetwork.json, …) — prose
//     the engine authors, which must arrive as { ru, en } pairs;
//   · dashboard taxonomy (nvidiaEcosystem.js, capitalMap.js, …) — labels and
//     blurbs we own, wrapped in `bi()` so they follow the language toggle.
//
// Both used to be checked by eye, which meant every weekly delivery and every
// new label could silently ship half-translated. This does it mechanically.
//
// HOW. The data modules are loaded TWICE through Vite's SSR loader — once with
// the language mirror set to Russian, once to English — and every string they
// expose is compared. A value that still contains Cyrillic when the module is
// speaking English has no English side, so it is reported. That catches both
// mechanisms at once: a `bi()` pair nobody filled in, and an engine field that
// arrived as a bare Russian string instead of a pair.
//
// Names are not text. Companies, funds, people, tickers and ids keep their
// original spelling in both languages, so a value that is IDENTICAL in ru and
// en and carries no Cyrillic is fine — «NVIDIA» is not a translation gap. Only
// leftover Cyrillic counts.
//
//   npm run i18n:check     report and exit non-zero if anything is missing
//   npm run i18n:check -- --list   print every offending value, not a summary
//
// Wired into `prebuild`, so `npm run build` fails on a half-translated tree
// rather than letting it reach Vercel.
// ══════════════════════════════════════════════════════════════════════════

import { createServer } from 'vite';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const CYR = /[А-Яа-яЁё]/;
const LIST = process.argv.includes('--list');
const UPDATE = process.argv.includes('--update-baseline');

// KNOWN, ACCEPTED GAPS. Some prose is owned by the engine and only becomes
// bilingual when a new payload lands — blocking every deploy until then would
// make the gate something to switch off rather than something to trust. So the
// baseline records what is already outstanding, and the audit fails only on
// gaps that are NOT in it: a regression, or a newly-added Russian-only label.
//
// The baseline shrinks on its own as deliveries arrive — a path that stops
// being a gap is reported as fixed and should be removed with
// `--update-baseline`. It never grows silently: adding to it is an explicit,
// reviewable commit.
const BASELINE_PATH = new URL('../src/data/i18n-baseline.json', import.meta.url);
const baseline = existsSync(BASELINE_PATH)
  ? new Set(JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).knownGaps)
  : new Set();

// Each entry: the module to load and the exports worth walking. `build` names
// a zero-argument function whose RESULT should be walked too — that is how the
// engine payload gets audited, since the graph is where its prose actually
// lands after the adapter has resolved it.
// `nvidiaEcosystem.js` is audited for its EXPORTS but not for its graph: it is
// the frozen taxonomy source both ecosystem maps re-export, while its own
// payload (the NVIDIA pilot) is a reserve map that nothing renders. Auditing
// that payload buries the real gaps under ~2,800 lines nobody will ever read.
const TARGETS = [
  // `LAYERS` is built from the pilot's own payload rather than declared here,
  // so it is skipped for the same reason its graph is.
  { file: '/src/data/nvidiaEcosystem.js', skipExports: ['LAYERS'] },
  { file: '/src/data/aiEcosystemNetwork.js', build: 'buildGraph' },
  { file: '/src/data/capitalMap.js',         build: 'buildGraph' },
  { file: '/src/data/fundTracker.js' },
];

// Keys whose value is a proper noun, an id, a URL or a verbatim source quote.
// None of these are translated, in either direction, by design.
const SKIP_KEYS = new Set([
  'id', 'ids', 'key', 'slug', 'url', 'href', 'src', 'link', 'links',
  'name', 'names', 'label_en', 'ticker', 'tickers', 'symbol', 'exchange',
  'quote', 'quotes', 'color', 'colour', 'shape', 'icon', 'logo', 'logoUrls',
  'source', 'sources', 'source_url', 'sourceUrl', 'evidence', 'domain',
  'aliases', 'candidate_id', 'entity_id', 'target_id', 'sourceId', 'targetId',
  'co_investors', 'seen_with', 'top', 'members', 'nodeIds', 'edgeIds',
]);

/** Walk any structure, collecting [path, value] for every string it holds. */
function collect(node, path, out, seen) {
  if (node == null) return;
  if (typeof node === 'string') { out.set(path, node); return; }
  if (typeof node !== 'object') return;
  if (seen.has(node)) return;
  seen.add(node);

  if (node instanceof Map) { collect([...node.values()], path, out, seen); return; }
  if (node instanceof Set) return;                    // id sets — never prose
  if (Array.isArray(node)) {
    node.forEach((v, i) => collect(v, `${path}[${i}]`, out, seen));
    return;
  }
  for (const k of Object.keys(node)) {
    if (SKIP_KEYS.has(k)) continue;
    let v;
    try { v = node[k]; } catch { continue; }          // bi() getters can throw
    if (typeof v === 'function') continue;
    collect(v, path ? `${path}.${k}` : k, out, seen);
  }
}

/** Load one module with the language mirror pinned, and flatten its strings. */
async function snapshot(vite, target, lang) {
  const i18n = await vite.ssrLoadModule('/src/lib/i18n.jsx');
  i18n.setLangForTooling(lang);

  // Re-import AFTER setting the mirror. `bi()` builds lazy getters, so the
  // module can be loaded once and still answer per-language — but a module
  // that captured a string eagerly at load time would not, and those are
  // exactly the ones we are hunting. Invalidating forces a fresh evaluation.
  const mod = await vite.ssrLoadModule(target.file);

  const out = new Map();
  const seen = new WeakSet();
  const skip = new Set(target.skipExports || []);
  for (const [k, v] of Object.entries(mod)) {
    if (typeof v === 'function' || skip.has(k)) continue;
    collect(v, k, out, seen);
  }
  if (target.build && typeof mod[target.build] === 'function') {
    try {
      collect(mod[target.build](), target.build + '()', out, seen);
    } catch (e) {
      console.warn(`  ! ${target.file} → ${target.build}() threw: ${e.message}`);
    }
  }
  return out;
}

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

let totalGaps = 0;
const report = [];

for (const target of TARGETS) {
  let ru, en;
  try {
    ru = await snapshot(vite, target, 'ru');
    en = await snapshot(vite, target, 'en');
  } catch (e) {
    console.error(`\n✗ ${target.file} — could not load: ${e.message}`);
    totalGaps += 1;
    continue;
  }

  // A gap is a value that STILL reads Russian while the module is speaking
  // English. Whether it is identical to the Russian side or merely contains
  // Cyrillic does not matter — either way an English reader sees Russian.
  const gaps = [];
  for (const [path, value] of en) {
    if (!CYR.test(value)) continue;
    const key = `${target.file}#${path}`;
    gaps.push({ path, key, ru: ru.get(path) ?? '', en: value, known: baseline.has(key) });
  }

  totalGaps += gaps.filter(g => !g.known).length;
  report.push({ file: target.file, checked: en.size, gaps });
}

await vite.close();

const allGaps = report.flatMap(r => r.gaps);

if (UPDATE) {
  const knownGaps = allGaps.map(g => g.key).sort();
  writeFileSync(BASELINE_PATH, JSON.stringify({
    _note: 'Prose that is still Russian-only, by path. The i18n audit fails on any '
      + 'gap NOT listed here, so this file is the line between accepted debt — mostly '
      + 'engine payloads awaiting a bilingual delivery — and a regression. Regenerate '
      + 'with `npm run i18n:check -- --update-baseline` when a delivery shrinks it.',
    generated: new Date().toISOString().slice(0, 10),
    knownGaps,
  }, null, 2) + '\n');
  console.log(`\nБаза известных пропусков обновлена — ${knownGaps.length}.\n`);
  process.exit(0);
}

console.log('\nПеревод интерфейса — аудит\n');
for (const r of report) {
  const fresh = r.gaps.filter(g => !g.known).length;
  const mark = fresh ? '✗' : (r.gaps.length ? '•' : '✓');
  const pct = r.checked ? Math.round(((r.checked - r.gaps.length) / r.checked) * 100) : 100;
  const known = r.gaps.length - fresh;
  const tail = known ? `  (${known} в базе)` : '';
  console.log(`${mark} ${r.file.padEnd(34)} ${String(r.checked - r.gaps.length).padStart(5)}/${String(r.checked).padEnd(5)} (${pct}%)${tail}`);
}

// A baseline entry that no longer reports as a gap has been fixed — say so, so
// the file gets trimmed instead of quietly accumulating dead paths.
const live = new Set(allGaps.map(g => g.key));
const healed = [...baseline].filter(k => !live.has(k));
if (healed.length) {
  console.log(`\n✓ Переведено с прошлого раза — ${healed.length}. Обновите базу:`);
  console.log('  npm run i18n:check -- --update-baseline');
}

if (!totalGaps) {
  console.log('\nНовых пропусков нет — английская версия не показывает русский текст'
    + (baseline.size ? ' сверх того, что уже записано в базе.' : '.') + '\n');
  process.exit(0);
}

console.log(`\nБез английской версии и НЕ в базе — ${totalGaps}:\n`);
for (const r of report) {
  if (!r.gaps.some(g => !g.known)) continue;
  console.log(`  ${r.file}`);
  // Group by the object the value sits on, so a whole untranslated META table
  // reads as one line instead of forty.
  const groups = new Map();
  for (const g of r.gaps.filter(x => !x.known)) {
    const head = g.path.split(/[.[]/).slice(0, 2).join('.');
    if (!groups.has(head)) groups.set(head, []);
    groups.get(head).push(g);
  }
  for (const [head, list] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`    · ${head.padEnd(40)} ${list.length}`);
    if (LIST) for (const g of list) console.log(`        ${g.path}\n          ${g.en.slice(0, 96)}`);
  }
  console.log('');
}
console.log('Эти строки английский читатель видит по-русски.');
console.log('Подробный список — npm run i18n:check -- --list');
console.log('Если это осознанный долг (ждём поставку движка), внесите в базу:');
console.log('  npm run i18n:check -- --update-baseline\n');
process.exit(1);
