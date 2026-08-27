// ══════════════════════════════════════════════════════════════════════════
// i18n source lint — catches the two mistakes the translation audit cannot.
//
// `i18n_audit.mjs` loads the DATA modules twice and compares strings, which
// proves the payload and the taxonomy are bilingual. It cannot see component
// source, and two failure modes live only there:
//
//   1. SHADOWING. `useT()` is bound to `t`, and `t` is also the obvious name
//      for a loop variable, a timer or a meta object. When one shadows the
//      other, `t('Фильтры', 'Filters')` calls a string or a timeout id —
//      "t is not a function", at runtime, on one screen, with a build that
//      passed. This happened three times in one afternoon (2026-08-24).
//
//   2. NESTING. A mechanical migration that wraps a literal twice produces
//      `t(t('ru','en'), 'en')`. It renders, in Russian, forever — a silent
//      failure rather than a loud one.
//
// Both are cheap to detect and impossible to argue with, so they gate the
// build alongside the audit.
// ══════════════════════════════════════════════════════════════════════════

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../src', import.meta.url).pathname;

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.jsx?$/.test(p)) out.push(p);
  }
  return out;
}

/** End of a `.map(` / `(` call, by paren depth. */
function closeParen(s, from) {
  let depth = 1, i = from;
  while (i < s.length && depth > 0) {
    const c = s[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    i++;
  }
  return i;
}

const CALLS_T = /[^A-Za-z0-9_.]t\(['"`]/;
const problems = [];

for (const file of walk(ROOT)) {
  const s = readFileSync(file, 'utf8');
  const rel = file.slice(ROOT.length - 3);

  if (s.includes('t(t(')) problems.push([rel, 'nested t(t(...))']);
  if (!s.includes('useT()')) continue;

  // A callback parameter named `t`, in a body that also translates.
  for (const m of s.matchAll(/\.(?:map|filter|forEach|find|some|every|flatMap)\(/g)) {
    const b = m.index + m[0].length;
    if (!/^\(?\s*t\s*[,)]/.test(s.slice(b, b + 30))) continue;
    if (CALLS_T.test(s.slice(b, closeParen(s, b)))) {
      problems.push([rel, `line ${s.slice(0, m.index).split('\n').length}: callback parameter named t shadows the translator`]);
    }
  }

  // A second `const t = …` after the hook, inside the same component.
  for (const m of s.matchAll(/const t = useT\(\);/g)) {
    const next = s.slice(m.index + m[0].length).search(/^(?:export (?:default )?)?function [A-Za-z]\w*\(/m);
    const seg = s.slice(m.index + m[0].length, m.index + m[0].length + (next === -1 ? 4000 : next));
    const re = /\bconst t = (?!useT)/.exec(seg);
    if (re) {
      problems.push([rel, `line ${s.slice(0, m.index).split('\n').length}: a second "const t =" shadows the translator`]);
    }
  }
}

if (problems.length) {
  console.error('\n✗ Перевод — проверка исходников\n');
  for (const [f, why] of problems) console.error(`  ${f}\n    · ${why}`);
  console.error(`\n${problems.length} ${problems.length === 1 ? 'проблема' : 'проблем'}. Эти ошибки видны только в рантайме — сборка без них не уходит.\n`);
  process.exit(1);
}
console.log('✓ Перевод — исходники чисты: переводчик нигде не затенён, вложенных t(t(…)) нет.');
