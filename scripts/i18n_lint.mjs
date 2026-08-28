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
//   3. MIS-PASSED HELPERS. The fix for (1) is `const table = (t) => […]`, a
//      helper whose first parameter IS the translator. Nothing stops a caller
//      from passing something else into that slot — `tierColor(sec.tier)`
//      against `const tierColor = (t) => tiers(t)…` reads perfectly and calls
//      the string 'substance' as a function. Same "t is not a function", same
//      black screen, and the two rules above see nothing wrong: no shadowing,
//      no module-scope call. Found in HoldingsV2 on 2026-08-28, where it took
//      down every holding's section tabs.
//
//   4. HOOKS IN HELPERS. `useT()` is a hook. Calling it from a plain helper —
//      `withLinks(text, links)`, invoked inside a `.map()` — appends a pair of
//      hooks to the CALLING component's hook list, once per item. Change the
//      number of items between renders and React throws «Rendered more hooks
//      than during the previous render» and unmounts the tree. Berkshire's
//      section tabs were a black screen this way while Brookfield's, with a
//      different fact count, were fine. A helper takes a `bi()` getter or
//      `getLang()`, never a hook.
//
//   5. MISSING TRANSLATOR. The mirror image of (1): a component that USES `t`
//      and never binds it. `RiskSplit` called `levels(t)` with no
//      `const t = useT()` anywhere above it — a bare ReferenceError, «t is not
//      defined», the moment that one block appeared in a section. It survived
//      the migration because no holding rendered that block until one did.
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

/**
 * `t(…)` inside a top-level `const X = …` INITIALIZER.
 *
 * Everything at module scope is evaluated at import time, when `t` does not
 * exist — the file throws a ReferenceError and takes the bundle down before a
 * single component renders. A declaration whose initializer is itself a
 * function (`const cols = (t) => […]`) is fine: the call happens later, with
 * `t` supplied, which is exactly the fix for this bug.
 */
function moduleScopeCalls(src) {
  const out = [];
  const re = /^(?:export )?const [A-Za-z_$][\w$]* =\s*/gm;
  let m;
  while ((m = re.exec(src))) {
    const start = m.index + m[0].length;
    // A function initializer defers evaluation — not a problem.
    if (/^(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.test(src.slice(start, start + 120))) continue;
    if (/^(?:async\s+)?function\b/.test(src.slice(start, start + 20))) continue;

    // Walk the initializer to its terminating semicolon at depth 0.
    let i = start, depth = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === '\'' || c === '"' || c === '`') {
        const q = c; i++;
        while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      } else if ('{[('.includes(c)) depth++;
      else if ('}])'.includes(c)) depth--;
      else if (c === ';' && depth <= 0) break;
      i++;
    }
    const body = src.slice(start, i);
    if (/[^A-Za-z0-9_.$]t\(['"`]/.test(' ' + body)) {
      out.push(src.slice(0, m.index).split('\n').length);
    }
  }
  return out;
}


for (const file of walk(ROOT)) {
  const s = readFileSync(file, 'utf8');
  const rel = file.slice(ROOT.length - 3);

  if (s.includes('t(t(')) problems.push([rel, 'nested t(t(...))']);

  // Module-scope evaluation is checked BEFORE the useT() gate: a file can
  // import the translator, never call the hook, and still blow up at import
  // because a const table calls t(). That is exactly YCDetailHero, 2026-08-24.
  for (const line of moduleScopeCalls(s)) {
    problems.push([rel, `line ${line}: t(…) is called at module scope, where the translator does not exist yet — make the table a function of \`t\`, or use bi()/biMap() getters`]);
  }

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

// ── Rule 3: a translator-taking helper called with something else ────────
//
// Two passes. First, collect the helpers whose first parameter is `t` and whose
// body actually uses it as the translator — either calling `t('ru','en')`
// directly, or handing `t` to a helper already known to be one (`tierColor`
// never calls t itself; it passes it to `tiers`). Repeat until nothing new is
// found, because the chain can be any length. Then check every call site: the
// first argument has to be `t`, and anything else is the bug.
function helperBody(src, from) {
  let i = from, depth = 0, started = false;
  while (i < src.length) {
    const c = src[i];
    if (c === '\'' || c === '"' || c === '`') {
      const q = c; i++;
      while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
    } else if ('{[('.includes(c)) { depth++; started = true; }
    else if ('}])'.includes(c)) { depth--; if (started && depth <= 0) { i++; break; } }
    else if (c === ';' && depth <= 0 && started) break;
    i++;
  }
  return src.slice(from, i);
}

const DECL = /(?:^|\n)\s*(?:export\s+)?(?:const\s+([A-Za-z_$][\w$]*)\s*=\s*\(?\s*t\s*[,)]|function\s+([A-Za-z_$][\w$]*)\s*\(\s*t\s*[,)])/g;

for (const file of walk(ROOT)) {
  const s = readFileSync(file, 'utf8');
  const rel = file.slice(ROOT.length - 3);

  const helpers = new Map();            // name → { body, line }
  for (const m of s.matchAll(DECL)) {
    const name = m[1] || m[2];
    const at = m.index + m[0].length;
    helpers.set(name, { body: helperBody(s, at), line: s.slice(0, m.index).split('\n').length + 1 });
  }
  if (!helpers.size) continue;

  const takesT = new Set();
  for (let pass = 0; pass < 8; pass++) {
    const before = takesT.size;
    for (const [name, h] of helpers) {
      if (takesT.has(name)) continue;
      const direct = /[^A-Za-z0-9_.$]t\(['"`]/.test(' ' + h.body);
      const relayed = [...takesT].some(k => new RegExp(`\\b${k}\\s*\\(\\s*t\\s*[,)]`).test(h.body));
      if (direct || relayed) takesT.add(name);
    }
    if (takesT.size === before) break;
  }

  for (const name of takesT) {
    const decl = helpers.get(name);
    for (const call of s.matchAll(new RegExp(`(?<![A-Za-z0-9_$.])${name}\\s*\\(`, 'g'))) {
      const line = s.slice(0, call.index).split('\n').length + 1;
      if (line === decl.line) continue;                       // the declaration
      const arg = s.slice(call.index + call[0].length, call.index + call[0].length + 40);
      if (/^\s*t\s*[,)]/.test(arg)) continue;                 // correct
      if (/^\s*\)/.test(arg)) continue;                        // no-arg call, a different helper
      problems.push([rel, `line ${line}: ${name}(…) takes the translator as its first argument (declared line ${decl.line}), but is called with \`${arg.split(/[,)]/)[0].trim()}\` — that value gets called as a function at runtime`]);
    }
  }
}

// ── Rule 4: a hook called from something that is not a component ─────────
//
// React's own rule, checked here because this repo has no eslint pass and the
// failure is invisible until a specific data shape hits a specific screen.
// A component is Capitalised; a custom hook starts with `use`. Anything else
// that calls `useT()`/`useState()`/… is a helper, and the hooks it calls
// silently belong to whoever called it.
const HOOK = /\buse(?:T|L|Lang|Locale|Plural|State|Effect|Memo|Ref|Callback|Context|LayoutEffect|Reducer)\s*\(/;

/**
 * Blank out everything that is not code — comments, strings, template literals
 * and REGEX LITERALS — keeping every offset and line break in place, so line
 * numbers stay honest and the brace matcher below never has to reason about
 * them. Regex literals matter more than they look: `/(?:[a-z]{2,})/` carries an
 * unbalanced `{`, which sent the first cut of this rule scanning to the end of
 * the file and blaming an innocent helper for a hook three functions away.
 */
function stripNoise(src) {
  const out = src.split('');
  const blank = (a, b) => { for (let k = a; k < b && k < out.length; k++) if (out[k] !== '\n') out[k] = ' '; };
  // A `/` starts a regex — rather than a division — only where a value cannot
  // legally have just ended.
  const REGEX_OK = /[(,=:[!&|?{};+\-*%~^]$|\b(?:return|typeof|case|in|of|new|delete|void|do|else)$/;
  let i = 0, prev = '';
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { const e = src.indexOf('\n', i); const end = e === -1 ? src.length : e; blank(i, end); i = end; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); const end = e === -1 ? src.length : e + 2; blank(i, end); i = end; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < src.length && src[j] !== c) { if (src[j] === '\\') j++; j++; }
      blank(i + 1, j); i = j + 1; prev = c; continue;
    }
    if (c === '/' && REGEX_OK.test(prev ? src.slice(0, i).replace(/\s+$/, '') : '')) {
      let j = i + 1, cls = false;
      while (j < src.length && src[j] !== '\n') {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '[') cls = true;
        else if (src[j] === ']') cls = false;
        else if (src[j] === '/' && !cls) break;
        j++;
      }
      if (src[j] === '/') { blank(i + 1, j); i = j + 1; prev = '/'; continue; }
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out.join('');
}

/** Skip a quoted run starting at `i` (which points at the quote). */
function skipString(src, i) {
  const q = src[i]; i++;
  while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
  return i + 1;
}

/**
 * The body of ONE function, brace-matched — not "everything up to the next
 * declaration", which is what made the first cut of this rule blame `isNeg`
 * for a hook in the function below it.
 */
function functionBody(src, from, isArrow) {
  let i = from;
  if (!isArrow) {                                   // step over the parameters
    let d = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === '"' || c === "'" || c === '`') { i = skipString(src, i); continue; }
      if (c === '(') d++;
      else if (c === ')') { d--; if (d === 0) { i++; break; } }
      i++;
    }
  }
  while (i < src.length && /\s/.test(src[i])) i++;
  const start = i;
  let d = 0;
  const braced = src[i] === '{';
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') { i = skipString(src, i); continue; }
    if ('{[('.includes(c)) d++;
    else if ('}])'.includes(c)) { d--; if (d <= 0) { i++; break; } }
    else if (!braced && c === ';' && d === 0) break;
    i++;
  }
  return src.slice(start, i);
}

for (const file of walk(ROOT)) {
  const src = stripNoise(readFileSync(file, 'utf8'));
  const rel = file.slice(ROOT.length - 3);
  const seen = new Set();

  const decls = [];
  for (const m of src.matchAll(/(?:^|\n)(?:export\s+)?(?:default\s+)?function\s+([A-Za-z_$][\w$]*)\s*(\()/g)) {
    decls.push({ name: m[1], at: m.index + m[0].length - 1, arrow: false, i: m.index });
  }
  for (const m of src.matchAll(/(?:^|\n)(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g)) {
    decls.push({ name: m[1], at: m.index + m[0].length, arrow: true, i: m.index });
  }

  for (const d of decls) {
    // A Capitalised name is a component; `useThing` is a custom hook. Both may
    // call hooks. Everything else may not.
    if (/^[A-Z]/.test(d.name) || /^use[A-Z]/.test(d.name)) continue;
    const body = functionBody(src, d.at, d.arrow);
    const hit = HOOK.exec(body);
    if (!hit || seen.has(d.name)) continue;
    seen.add(d.name);
    const line = src.slice(0, d.i).split('\n').length + 1;
    problems.push([rel, `line ${line}: ${d.name}() is a helper, not a component, but calls ${hit[0].replace(/\s*\($/, '()')} — those hooks join the hook list of whichever component calls it, and the count changes with the data. Use a bi() getter or getLang().`]);
  }
}

// ── Rule 5: a function that uses `t` without ever binding it ─────────────
//
// Reuses rule 4's declaration scan and brace-matched bodies, so a nested
// helper that closes over its component's `t` is not reported — only a
// top-level function that references `t` with nothing to reference.
for (const file of walk(ROOT)) {
  const src = stripNoise(readFileSync(file, 'utf8'));
  if (!/useT\(\)/.test(src)) continue;                    // not a translated file
  const rel = file.slice(ROOT.length - 3);

  const decls = [];
  for (const m of src.matchAll(/(?:^|\n)(?:export\s+)?(?:default\s+)?function\s+([A-Za-z_$][\w$]*)\s*(\()/g)) {
    decls.push({ name: m[1], at: m.index + m[0].length - 1, arrow: false, i: m.index });
  }
  for (const m of src.matchAll(/(?:^|\n)(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g)) {
    decls.push({ name: m[1], at: m.index + m[0].length, arrow: true, i: m.index, params: m[2] });
  }

  for (const d of decls) {
    const body = functionBody(src, d.at, d.arrow);
    // `t(…)` called, or `t` handed to a helper — `levels(t)`, `tiers(t)`.
    const used = /[^A-Za-z0-9_.$]t\s*\(/.test(' ' + body)
      || /[^A-Za-z0-9_.$][A-Za-z_$][\w$]*\(\s*t\s*[,)]/.test(' ' + body);
    if (!used) continue;
    if (/const\s+t\s*=\s*useT\(\)/.test(body)) continue;         // binds it
    // A parameter named `t` is the deliberate helper form (rule 3 guards its
    // call sites), so it counts as bound here.
    const params = d.arrow ? (d.params || '') : src.slice(d.at, src.indexOf(')', d.at) + 1);
    if (/[(,]\s*t\s*[,)]/.test(params)) continue;
    const line = src.slice(0, d.i).split('\n').length + 1;
    problems.push([rel, `line ${line}: ${d.name}() uses \`t\` but never binds it — add \`const t = useT();\`, or the render throws «t is not defined» the first time this block appears`]);
  }
}

if (problems.length) {
  console.error('\n✗ Перевод — проверка исходников\n');
  for (const [f, why] of problems) console.error(`  ${f}\n    · ${why}`);
  console.error(`\n${problems.length} ${problems.length === 1 ? 'проблема' : 'проблем'}. Эти ошибки видны только в рантайме — сборка без них не уходит.\n`);
  process.exit(1);
}
console.log('✓ Перевод — исходники чисты: переводчик нигде не затенён, вложенных t(t(…)) нет.');
