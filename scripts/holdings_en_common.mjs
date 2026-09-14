// ══════════════════════════════════════════════════════════════════════════
// Shared vocabulary for the Holdings translation tooling.
//
// One place that knows which files make up the Holdings section, how their
// paths are keyed in `holdings.en.json`, and which strings actually need a
// translation. Both the status report and the merge gate read from here, so
// they can never disagree about what a legal key is.
// ══════════════════════════════════════════════════════════════════════════
import { readFileSync, existsSync, readdirSync } from 'node:fs';

export const CYR = /[А-Яа-яЁё]/;
export const EN_PATH = new URL('../src/data/holdings.en.json', import.meta.url);

const DIR = new URL('../src/data/holdings-v2/', import.meta.url);
const jsonIn = (sub) => {
  try {
    return readdirSync(new URL(sub, DIR)).filter(f => f.endsWith('.json') && !f.startsWith('_')).sort();
  } catch { return []; }
};

/**
 * Every payload the section renders, as `{ scope, file, data }`.
 *
 *   holdings        src/data/holdings.json          — the comparison index
 *   co.<id>         holdings-v2/<id>.json           — the company dossier
 *   port.<id>       holdings-v2/portfolio/<id>.json — deep portfolio page
 *   fin.<id>        holdings-v2/financial/<id>.json — deep financial page
 *
 * Files starting with `_` are drafts and scratch copies that nothing imports;
 * translating them would be wasted work, so they are not scopes.
 */
export function sources() {
  const out = [{ scope: 'holdings', file: 'holdings.json',
                 data: JSON.parse(readFileSync(new URL('../src/data/holdings.json', import.meta.url), 'utf8')) }];
  for (const [sub, scope] of [['', 'co'], ['portfolio/', 'port'], ['financial/', 'fin']]) {
    for (const f of jsonIn(sub)) {
      const data = JSON.parse(readFileSync(new URL(sub + f, DIR), 'utf8'));
      if (!data || !data.id) continue;               // matches the runtime glob's own filter
      out.push({ scope: `${scope}.${data.id}`, file: `holdings-v2/${sub}${f}`, data });
    }
  }
  return out;
}

/**
 * Collect the paths that need English, as `[path, russian]`.
 *
 * Two things are NOT gaps:
 *   · a string with no Cyrillic — a ticker, a number, a company name. Those
 *     read the same in both languages.
 *   · anything under a `{ ru, en }` pair. `news[]` is already bilingual and is
 *     resolved by `L()` at render; duplicating it into the sidecar would mean
 *     two sources of truth for the same sentence, and the spread in `ALL_NEWS`
 *     would freeze whichever one the getter answered first.
 */
export function walk(v, prefix, out = []) {
  if (typeof v === 'string') { if (CYR.test(v)) out.push([prefix, v]); return out; }
  if (Array.isArray(v)) { v.forEach((x, i) => walk(x, prefix + '.' + i, out)); return out; }
  if (v && typeof v === 'object') {
    if (typeof v.ru === 'string' && typeof v.en === 'string') return out;   // already bilingual
    for (const k of Object.keys(v)) walk(v[k], prefix ? prefix + '.' + k : k, out);
  }
  return out;
}

export const loadEn = () =>
  (existsSync(EN_PATH) ? JSON.parse(readFileSync(EN_PATH, 'utf8')) : {});

export const done = (en, p) => typeof en[p] === 'string' && en[p] !== '';
