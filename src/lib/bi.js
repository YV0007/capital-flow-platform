// ══════════════════════════════════════════════════════════════════════════
// bi / biMap — bilingual taxonomy objects.
//
// A data module declares its labels ONCE, with both languages side by side,
// and every call site keeps reading a plain `.label`:
//
//     export const SECTOR_META = {
//       'ai-labs': bi({
//         label: ['AI-лаборатории', 'AI labs'],
//         blurb: ['Разработчики передовых моделей…', 'Frontier model developers…'],
//       }, { color: '#8E9BE6', order: 0 }),
//     };
//
// The pairs become lazy getters that read the language mirror at ACCESS time,
// so no component has to know a translation happened — `SECTOR_META['ai-labs']
// .label` simply starts speaking English when the toggle flips. App remounts
// its body on a language change, so everything repaints.
//
// WHY ITS OWN MODULE. These used to live in `capitalMap.js`, which made every
// consumer import the whole capital-flow payload just to build a label — and
// `classification.js` importing `biMap` back out of `capitalMap.js` closed a
// genuine import cycle. The browser bundle tolerated it; Node's SSR loader,
// which the translation audit uses, did not. The helpers depend on nothing but
// the language mirror, so they belong here, below both.
//
// `capitalMap.js` still re-exports them, so existing imports keep working.
// ══════════════════════════════════════════════════════════════════════════

import { getLang } from './i18n.jsx';

/**
 * Build an object whose named keys are `[ru, en]` pairs resolved on access,
 * merged over `rest` (colours, order, weights — anything not language-bound).
 * A missing English side falls back to the Russian one, so a half-filled table
 * degrades to leftover Russian rather than to blank labels.
 */
export function bi(pairs, rest = {}) {
  const o = { ...rest };
  for (const [k, v] of Object.entries(pairs)) {
    const [ru, en] = v;
    Object.defineProperty(o, k, {
      enumerable: true,
      get: () => (getLang() === 'en' ? (en ?? ru) : ru),
    });
  }
  return o;
}

/** Same idea for a flat `{ key: [ru, en] }` dictionary. */
export function biMap(entries) {
  const o = {};
  for (const [k, [ru, en]] of Object.entries(entries)) {
    Object.defineProperty(o, k, {
      enumerable: true,
      get: () => (getLang() === 'en' ? (en ?? ru) : ru),
    });
  }
  return o;
}
