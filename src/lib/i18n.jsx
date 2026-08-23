// ══════════════════════════════════════════════════════════════════════════
// LANGUAGE — Русский | English, for the whole dashboard.
//
// Two mechanisms, because the dashboard has two kinds of text:
//
//   1. UI COPY inside components — `const t = useT()` then `t('Фильтры',
//      'Filters')`. Two positional arguments, Russian first (it is the
//      original), English second. No key catalogue: the strings live inline
//      in 80-odd files and are heavily interpolated, so inventing 1800 keys
//      would cost readability and buy nothing. The pair IS the key.
//
//   2. TAXONOMY LABELS in data modules (`capitalMap.js`, `nvidiaEcosystem.js`,
//      `fundTracker.js`) — plain objects built at module load, far from any
//      hook. Those carry `{ ru, en }` pairs and are resolved at render by
//      `useL()` (hook, subscribes) or `L()` (bare, reads the module mirror).
//
// The module mirror `current` exists so non-React code — a sort comparator, a
// canvas label painter — can ask for the active language without a hook. It is
// kept in sync by the provider. Anything RENDERED should still go through the
// hook so React knows to re-run it.
//
// Belt and braces: App remounts its body on a language flip (`key={lang}`), so
// a component that reads a label without subscribing still repaints. App's own
// state sits above that key and survives, so switching language does not throw
// you back to the home page.
// ══════════════════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const KEY = 'app:lang';
export const LANGS = [
  { id: 'ru', label: 'RU', full: 'Русский' },
  { id: 'en', label: 'EN', full: 'English' },
];

// Module-level mirror of the active language, for code that cannot hold a hook.
let current = 'ru';
export const getLang = () => current;

function readInitial() {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === 'ru' || v === 'en') return v;
    // First visit: follow the browser, but only as a hint — Russian is the
    // dashboard's original language and stays the fallback.
    const nav = (navigator.language || '').slice(0, 2).toLowerCase();
    if (nav && nav !== 'ru') return 'en';
  } catch {}
  return 'ru';
}

const LangCtx = createContext({ lang: 'ru', setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLang] = useState(readInitial);

  useEffect(() => {
    current = lang;
    try {
      window.localStorage.setItem(KEY, lang);
      document.documentElement.lang = lang;
    } catch {}
  }, [lang]);
  // Set the mirror synchronously on first render too, so the very first paint
  // of a data label is not a frame behind.
  current = lang;

  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

/**
 * `t('Фильтры', 'Filters')` — the workhorse. Russian first, English second.
 * A missing English string falls back to the Russian one rather than to an
 * empty label, so a half-migrated screen degrades to "some Russian left"
 * instead of "some text missing".
 */
export function useT() {
  const { lang } = useContext(LangCtx);
  return useCallback((ru, en) => (lang === 'en' ? (en ?? ru) : ru), [lang]);
}

/** Bare resolver for `{ ru, en }` pairs — no hook, reads the module mirror. */
export function L(v, lang = current) {
  if (v && typeof v === 'object' && !Array.isArray(v) && ('ru' in v || 'en' in v)) {
    return (lang === 'en' ? v.en : v.ru) ?? v.ru ?? v.en ?? '';
  }
  return v;
}

/** Hook form of `L` — use this anywhere the result is rendered. */
export function useL() {
  const { lang } = useContext(LangCtx);
  return useCallback((v) => L(v, lang), [lang]);
}

/**
 * Russian needs three plural forms, English two. One helper so call sites do
 * not branch on language themselves:
 *   plural(n, ['сделка','сделки','сделок'], ['deal','deals'])
 */
export function plural(n, ru, en, lang = current) {
  const a = Math.abs(Math.round(n));
  if (lang === 'en' && en) return a === 1 ? en[0] : en[1];
  const d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return ru[2];
  if (d === 1) return ru[0];
  if (d >= 2 && d <= 4) return ru[1];
  return ru[2];
}
export function usePlural() {
  const { lang } = useContext(LangCtx);
  return useCallback((n, ru, en) => plural(n, ru, en, lang), [lang]);
}

/** Locale tag for Intl / toLocaleString. */
export const localeOf = (lang = current) => (lang === 'en' ? 'en-US' : 'ru-RU');
export function useLocale() {
  const { lang } = useContext(LangCtx);
  return localeOf(lang);
}
