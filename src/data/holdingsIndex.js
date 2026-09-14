// ══════════════════════════════════════════════════════════════════════════
// Holdings — the comparison index (`holdings.json`), language-resolved.
//
// `holdings.json` is the Phase-3 extraction of the original Holdings consts:
// the nine company cards, META, GROUPS, THEMES, SECTIONS, SUBS, DIMENSIONS,
// HEATMAP_THEMES and AI_TIERS. Six components import it, and every one of them
// destructures at module scope — which is precisely why the English overlay
// has to arrive as getters rather than as a resolved copy. See `holdingsEn.js`.
//
// Import THIS, not the raw JSON: a component reading `holdings.json` directly
// is a component that shows Russian to an English reader.
// ══════════════════════════════════════════════════════════════════════════

import raw from './holdings.json';
import { withEn } from './holdingsEn.js';

const holdingsIndex = withEn(raw, 'holdings');
export default holdingsIndex;
