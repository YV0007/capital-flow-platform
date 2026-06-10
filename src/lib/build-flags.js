// Build-time presentation flags lifted from index_slim.html lines 11541–11556.
// The legacy string-replace tooling rewrites these constants when emitting
// a presentation variant of the dashboard. Migration preserves the names
// verbatim so the tooling can be reintroduced later if needed.

// HIDDEN_TABS — set of tab ids to hide from nav and route. The build script
// substitutes this constant when emitting the presentation variant.
// BUILD-FLAG: HIDDEN_TABS (do not rename — string-replaced at build time)
export const HIDDEN_TABS = new Set(['log', 'syndicate', 'settings']);

// PRESENTATION_MODE — hides analyst-scaffolding badges (Confidence LOW/MED/HIGH,
// source type P/I/B, "Need ≥2" warnings) when sharing the dashboard externally.
// BUILD-FLAG: PRESENTATION_MODE (do not rename — string-replaced at build time)
export const PRESENTATION_MODE = true;

// NEWS_ONLY_MODE — when true, the Public tab renders only the News & Mentions
// feed; all other corroboration cards (Web Traffic, App Downloads, Reviews,
// Branded Search, Ad Library) are hidden. Public tab also gets a refocused
// description. Used for the news-focused build variant.
// BUILD-FLAG: NEWS_ONLY_MODE (do not rename — string-replaced at build time)
export const NEWS_ONLY_MODE = false;
