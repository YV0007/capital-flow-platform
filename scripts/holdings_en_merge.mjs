// ══════════════════════════════════════════════════════════════════════════
// Atomic, validating merge into the Holdings English sidecar.
//
// `holdings.en.json` is one flat file that a long translation pass writes to
// dozens of times, and several sessions share this working tree. A plain
// read-modify-write loses whichever writer finished first, so every write goes
// through here instead:
//
//   node scripts/holdings_en_merge.mjs patch.json          merge a flat patch
//   node scripts/holdings_en_merge.mjs patch.json --force  allow overwriting
//   node scripts/holdings_en_merge.mjs --check patch.json  validate, write nothing
//
// A patch is the skeleton `holdings_en_status.mjs <scope>` prints, with the
// Russian values replaced by English. Keys are the same dotted paths.
//
// Three guarantees, in order of how much time each one saves:
//   1. LOCK      — one writer at a time; the read and the write are one step.
//   2. VALIDATE  — a key that is not a real path in the Russian source is a
//                  typo that would sit in the file forever doing nothing, and
//                  the coverage report would never move. Rejected, not merged.
//   3. ATOMIC    — tmp + rename, so a crash mid-write cannot truncate a
//                  megabyte of finished translation.
// ══════════════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, renameSync, mkdirSync, rmdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sources, walk, loadEn, CYR, EN_PATH } from './holdings_en_common.mjs';

const LOCK_PATH = fileURLToPath(new URL('../src/data/.holdings-en.lock', import.meta.url));
const STALE_MS  = 120_000;

const args  = process.argv.slice(2);
const force = args.includes('--force');
const check = args.includes('--check');
const file  = args.find(a => !a.startsWith('--'));
if (!file) { console.error('usage: holdings_en_merge.mjs <patch.json> [--force] [--check]'); process.exit(2); }

// ── the set of legal keys, straight off the Russian sources ───────────────
// Same walk the status report uses, so the two can never disagree: only a
// Cyrillic-bearing string outside an existing { ru, en } pair is a gap, and
// only a gap is a legal key.
const legal = new Set();
for (const { scope, data } of sources()) for (const [p] of walk(data, scope)) legal.add(p);

const patch = JSON.parse(readFileSync(file, 'utf8'));
const bad = [];
for (const [k, v] of Object.entries(patch)) {
  if (!legal.has(k))                           bad.push([k, 'no such path in the Russian source']);
  else if (typeof v !== 'string' || !v.trim()) bad.push([k, 'empty or not a string']);
  else if (CYR.test(v))                        bad.push([k, 'value still contains Cyrillic']);
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
  throw new Error('could not acquire src/data/.holdings-en.lock after 60s — another merge is stuck');
}

await lock();
try {
  const en = loadEn();

  // A key that already holds a DIFFERENT English string means two writers have
  // translated the same path — i.e. they have crossed into each other's scope.
  // Fail the whole merge rather than let one of them silently win.
  const clash = Object.entries(patch).filter(([k, v]) =>
    typeof en[k] === 'string' && en[k] !== '' && en[k] !== v);
  if (clash.length && !force) {
    console.error(`✗ ${clash.length} key${clash.length > 1 ? 's' : ''} already translated with a different value — nothing merged.`);
    console.error('  Someone else has this scope. Re-check the split before using --force.');
    for (const [k, v] of clash.slice(0, 10)) {
      console.error(`    ${k}\n      on disk: ${JSON.stringify(en[k]).slice(0, 120)}\n      patch:   ${JSON.stringify(v).slice(0, 120)}`);
    }
    if (clash.length > 10) console.error(`    … and ${clash.length - 10} more`);
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
