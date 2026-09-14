// ══════════════════════════════════════════════════════════════════════════
// Holdings — the nine hand-maintained company files, as one module.
//
// WHY THIS EXISTS. Holdings is the only section with no upstream engine: each
// company's `news[]`, `asOf` and `priceChart` live in
// `src/data/holdings-v2/<id>.json`, and every consumer used to re-declare the
// same nine imports. More importantly, the i18n audit walks MODULES, so while
// the nine files were only ever reached through a component the audit could
// not see them at all — an English reader was served Russian news and no gate
// noticed. This is that module surface.
//
// It now also owns the deep PORTFOLIO and FINANCIAL payloads, which
// `HoldingsV2.jsx` used to glob for itself. They are here for the same reason:
// a payload reached only through a component is a payload no gate can audit,
// and all three need the same English overlay applied in the same place.
//
// `news[].title` and `news[].text` are `{ ru, en }` pairs. Older items may
// still be bare strings; `L()` passes those through unchanged, so both shapes
// render. New items are written bilingual by the `holdings-news-refresh` skill.
//
// Everything ELSE — taglines, sections, portfolio tables, the research prose —
// is Russian in the source file and English through the path-keyed sidecar
// `holdings.en.json`. See `holdingsEn.js` for why that is a getter overlay
// rather than a resolved copy.
// ══════════════════════════════════════════════════════════════════════════

import { withEn } from './holdingsEn.js';

// Loaded by glob rather than nine named imports each: a new company file
// appears the moment it is dropped in, which is how the section was migrated.
const coModules   = import.meta.glob('./holdings-v2/*.json',           { eager: true });
const portModules = import.meta.glob('./holdings-v2/portfolio/*.json', { eager: true });
const finModules  = import.meta.glob('./holdings-v2/financial/*.json', { eager: true });

// `scope` is the sidecar's key prefix — `co.brookfield.tagline` and friends.
function collect(modules, scope) {
  const out = {};
  for (const p in modules) {
    const d = modules[p].default || modules[p];
    if (d && d.id) out[d.id] = withEn(d, `${scope}.${d.id}`);
  }
  return out;
}

/** Keyed by holding id — the shape consumers want. */
export const HOLDINGS_BY_ID = collect(coModules, 'co');

/** Deep portfolio breakdowns (section 01's bespoke component). */
export const PORTFOLIO_BY_ID = collect(portModules, 'port');

/** Deep financial pages (section 08's bespoke component). */
export const FINANCIAL_BY_ID = collect(finModules, 'fin');

/** Every news item across all nine, unsorted and unsliced — the audit's view. */
export const ALL_NEWS = Object.entries(HOLDINGS_BY_ID)
  .flatMap(([id, h]) => (Array.isArray(h.news) ? h.news : []).map((n) => ({ ...n, holdingId: id })));
