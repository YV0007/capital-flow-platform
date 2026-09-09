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
// `news[].title` and `news[].text` are `{ ru, en }` pairs. Older items may
// still be bare strings; `L()` passes those through unchanged, so both shapes
// render. New items are written bilingual by the `holdings-news-refresh` skill.
// ══════════════════════════════════════════════════════════════════════════

import brookfield from './holdings-v2/brookfield.json';
import softbank from './holdings-v2/softbank.json';
import kkr from './holdings-v2/kkr.json';
import blackrock from './holdings-v2/blackrock.json';
import berkshire from './holdings-v2/berkshire.json';
import pershing from './holdings-v2/pershing.json';
import fairfax from './holdings-v2/fairfax.json';
import tpg from './holdings-v2/tpg.json';
import constellation from './holdings-v2/constellation.json';

/** Keyed by holding id — the shape consumers want. */
export const HOLDINGS_BY_ID = {
  brookfield, softbank, kkr, blackrock, berkshire,
  pershing, fairfax, tpg, constellation,
};

/** Every news item across all nine, unsorted and unsliced — the audit's view. */
export const ALL_NEWS = Object.entries(HOLDINGS_BY_ID)
  .flatMap(([id, h]) => (Array.isArray(h.news) ? h.news : []).map((n) => ({ ...n, holdingId: id })));
