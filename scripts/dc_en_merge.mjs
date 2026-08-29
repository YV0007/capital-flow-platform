// ══════════════════════════════════════════════════════════════════════════
// Atomic, validating merge into the DC English sidecar.
//
// `dc-details.en.json` is one flat file that several sessions translate at
// once. A plain read-modify-write loses whichever writer finished first, so
// every write goes through here instead:
//
//   node scripts/dc_en_merge.mjs patch.json          merge a flat patch
//   node scripts/dc_en_merge.mjs patch.json --force  allow overwriting keys
//   node scripts/dc_en_merge.mjs --check patch.json  validate, write nothing
//
// A patch is the skeleton `dc_en_status.mjs <node>` prints, with the Russian
// values replaced by English. Keys are the same dotted paths.
//
// Three guarantees, in order of how much time each one saves:
//   1. LOCK      — one writer at a time; the read and the write are one step.
//   2. VALIDATE  — a key that is not a real path in dc-details.json is a typo
//                  that would sit in the file forever doing nothing, and the
//                  coverage report would never move. Rejected, not merged.
//   3. ATOMIC    — tmp + rename, so a crash mid-write cannot truncate 2 MB of
//                  finished translation.
// ══════════════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync, rmdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CYR = /[А-Яа-яЁё]/;
const RU_PATH   = new URL('../src/data/dc-details.json', import.meta.url);
const EN_PATH   = new URL('../src/data/dc-details.en.json', import.meta.url);
const LOCK_PATH = fileURLToPath(new URL('../src/data/.dc-en.lock', import.meta.url));
const STALE_MS  = 120_000;

const args  = process.argv.slice(2);
const force = args.includes('--force');
const check = args.includes('--check');
const file  = args.find(a => !a.startsWith('--'));
if (!file) { console.error('usage: dc_en_merge.mjs <patch.json> [--force] [--check]'); process.exit(2); }

// ── the set of legal keys, straight off the Russian source ────────────────
// Same walk as dc_en_status.mjs: only Cyrillic-bearing strings are gaps, so
// only those are legal keys. A path pointing at a ticker or a number is a
// sign the translator drifted off the skeleton.
function walk(v, prefix, out) {
  if (typeof v === 'string') { if (CYR.test(v)) out.add(prefix); return out; }
  if (Array.isArray(v)) { v.forEach((x, i) => walk(x, prefix + '.' + i, out)); return out; }
  if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], prefix ? prefix + '.' + k : k, out);
  return out;
}
const legal = walk(JSON.parse(readFileSync(RU_PATH, 'utf8')), '', new Set());

const patch = JSON.parse(readFileSync(file, 'utf8'));
const bad = [];
for (const [k, v] of Object.entries(patch)) {
  if (!legal.has(k))                     bad.push([k, 'no such path in dc-details.json']);
  else if (typeof v !== 'string' || !v.trim()) bad.push([k, 'empty or not a string']);
  else if (CYR.test(v))                  bad.push([k, 'value still contains Cyrillic']);
}
if (bad.length) {
  console.error(`✗ ${bad.length} bad key${bad.length > 1 ? 's' : ''} — nothing merged:`);
  for (const [k, why] of bad.slice(0, 25)) console.error(`    ${k}\n      ${why}`);
  if (bad.length > 25) console.error(`    … and ${bad.length - 25} more`);
  process.exit(1);
}
if (check) { console.log(`✓ ${Object.keys(patch).length} keys valid (nothing written)`); process.exit(0); }

// ── lock ──────────────────────────────────────────────────────────────────
// mkdir is the portable atomic test-and-set. A lock older than STALE_MS is a
// session that died holding it; taking it over beats blocking forever.
async function lock() {
  for (let i = 0; i < 120; i++) {
    try { mkdirSync(LOCK_PATH); return; }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      if (Date.now() - statSync(LOCK_PATH).mtimeMs > STALE_MS) {
        console.error('· taking over a stale lock'); try { rmdirSync(LOCK_PATH); } catch {} continue;
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('could not acquire src/data/.dc-en.lock after 60s — another merge is stuck');
}

await lock();
try {
  const en = existsSync(EN_PATH) ? JSON.parse(readFileSync(EN_PATH, 'utf8')) : {};

  // A key that already holds a DIFFERENT English string means two sessions
  // have translated the same path — i.e. we have crossed into each other's
  // nodes. Fail the whole merge rather than let one of us silently win.
  const clash = Object.entries(patch).filter(([k, v]) =>
    typeof en[k] === 'string' && en[k] !== '' && en[k] !== v);
  if (clash.length && !force) {
    console.error(`\u2717 ${clash.length} key${clash.length > 1 ? 's' : ''} already translated with a different value \u2014 nothing merged.`);
    console.error('  Someone else has this node. Re-check the split before using --force.');
    for (const [k, v] of clash.slice(0, 10)) {
      console.error(`    ${k}\n      on disk: ${JSON.stringify(en[k]).slice(0, 120)}\n      patch:   ${JSON.stringify(v).slice(0, 120)}`);
    }
    if (clash.length > 10) console.error(`    \u2026 and ${clash.length - 10} more`);
    process.exit(3);
  }

  let added = 0, skipped = 0, changed = 0;
  for (const [k, v] of Object.entries(patch)) {
    const had = typeof en[k] === 'string' && en[k] !== '';
    if (had && en[k] === v) { skipped++; continue; }   // idempotent re-run
    if (had) changed++; else added++;
    en[k] = v;
  }
  // Sorted keys keep the diff of two sessions' work readable and stop the
  // whole file from reshuffling every time someone merges.
  const sorted = {};
  for (const k of Object.keys(en).sort()) sorted[k] = en[k];
  const tmp = fileURLToPath(EN_PATH) + '.tmp';
  writeFileSync(tmp, JSON.stringify(sorted, null, 1) + '\n', 'utf8');
  renameSync(tmp, fileURLToPath(EN_PATH));
  console.log(`✓ +${added} new${changed ? `, ~${changed} overwritten` : ''}${skipped ? `, ${skipped} already identical` : ''} — ${Object.keys(sorted).length} keys total`);
} finally {
  try { rmdirSync(LOCK_PATH); } catch {}
}
