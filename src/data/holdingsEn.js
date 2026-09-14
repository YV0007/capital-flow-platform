// ══════════════════════════════════════════════════════════════════════════
// Holdings — the English sidecar, and the language-resolved data surface.
//
// WHY THIS EXISTS. Holdings is the one section with no upstream engine. Its
// prose — nine company dossiers, their deep portfolio and financial pages,
// and the comparison index behind `holdings.json` — is hand-written Russian,
// ~15,600 strings of it. The i18n audit said so out loud: "a real debt and a
// DC-scale translation project of its own". This is that project's plumbing.
//
// THE SHAPE. Russian stays canonical: it is what the research is written in
// and what keeps growing. English lives in ONE flat, path-keyed sidecar,
// `holdings.en.json`, exactly like `dc-details.en.json` — a mirrored object
// tree would mean re-typing every wrapper object and array index just to
// reach one sentence. Keys are scoped by file:
//
//     holdings.<dotpath>      src/data/holdings.json
//     co.<id>.<dotpath>       src/data/holdings-v2/<id>.json
//     port.<id>.<dotpath>     src/data/holdings-v2/portfolio/<id>.json
//     fin.<id>.<dotpath>      src/data/holdings-v2/financial/<id>.json
//
// GETTERS, NOT A RESOLVED COPY. `dc-details.en.json` is overlaid by a function
// the component calls at render time. That trick does not work here: six
// components destructure this data at MODULE scope (`const { META, GROUPS } =
// holdingsData`), which runs once at import and would freeze whichever
// language loaded first. App remounts its body on a language flip, but it does
// not re-import modules.
//
// So the overlay builds the tree ONCE and installs `bi()`-style lazy getters
// wherever a translation exists. `META[k].label` stays a plain property read
// and simply starts speaking English when the toggle flips — no call site
// learns that a translation happened. The usual caveat applies: a `{ ...node }`
// at module scope would read the getter once and freeze it (see CLAUDE.md).
//
// A key the sidecar has not reached yet falls through to Russian, so a
// half-filled sidecar degrades to "some Russian left" rather than blanking a
// page — the same bargain `useT()` strikes for UI copy.
// ══════════════════════════════════════════════════════════════════════════

import { getLang } from '../lib/i18n.jsx';
import EN from './holdings.en.json';

/**
 * Deep-copy `ru`, replacing every string that the sidecar has translated with
 * a lazy getter. Structure, numbers, booleans and untranslated strings are
 * carried across unchanged.
 *
 * Arrays are rebuilt as arrays (`length` and every array method keep working —
 * `map`, `filter` and `join` all read through [[Get]], so they see the getter).
 */
export function overlayBi(ru, dict, prefix = '') {
  if (typeof ru === 'string') return ru;          // handled by the parent
  if (Array.isArray(ru)) {
    const out = [];
    ru.forEach((v, i) => define(out, i, v, dict, prefix + '.' + i));
    return out;
  }
  if (ru && typeof ru === 'object') {
    const out = {};
    for (const k of Object.keys(ru)) define(out, k, ru[k], dict, prefix ? prefix + '.' + k : k);
    return out;
  }
  return ru;
}

function define(out, key, value, dict, path) {
  if (typeof value === 'string') {
    const en = dict[path];
    if (typeof en === 'string' && en !== '') {
      Object.defineProperty(out, key, {
        enumerable: true,
        configurable: true,
        get: () => (getLang() === 'en' ? en : value),
      });
      return;
    }
    out[key] = value;
    return;
  }
  out[key] = overlayBi(value, dict, path);
}

/** Overlay one payload under its scope prefix. */
export const withEn = (data, scope) => overlayBi(data, EN, scope);

/** The raw sidecar, for tooling that wants to count coverage. */
export const EN_DICT = EN;
