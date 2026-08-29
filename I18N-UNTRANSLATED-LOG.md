# Untranslated sections — audit + progress log

Started 2026-08-29. Goal: EN mode must not show Russian prose.

## What the existing gate covers
`npm run i18n:check` walks only 4 modules — `nvidiaEcosystem.js`,
`aiEcosystemNetwork.js`, `capitalMap.js`, `fundTracker.js`. Everything else
(the raw JSONs consumed directly by components, and hardcoded JSX copy) is a
blind spot. That is where the reported gaps live.

## Census of Russian-only data (strings containing Cyrillic, no {ru,en} pair)

| file | ru strings | notes |
|---|---|---|
| `src/data/dc-details.json` | 8585 | **DC deep-dives — the screenshot.** 28 nodes, 40-60 KB each |
| `src/data/holdings.json` | 2788 | Holdings (legacy) |
| `src/data/nvidiaEcosystem.json` | 1485 | payload; the `.js` wrapper is translated, raw json is not |
| `src/data/holdings-v2/**` | ~9000 | 9 holdings + portfolio + deep dives |
| `src/data/yc-*.json` | ~700 | YC research |
| `src/data/dc-companies.json` | 319 | DC company cards |
| `src/data/proxy-*.json` | ~310 | Proxy section |
| `src/data/dc-company-profiles.json` | 109 | |

Plus hardcoded Russian string literals in `.jsx` components that were never
wrapped in `t()`.

## Approach
Sidecar-per-file, mirroring the `capitalMapRu.json` pattern but reversed:
the Russian file stays canonical, an `*.en.json` sidecar carries the English,
and a resolver overlays it when `lang === 'en'`. Missing keys fall back to
Russian, so a half-filled sidecar degrades gracefully instead of blanking.

## Progress
- [ ] 1. Hardcoded Russian in JSX components
- [ ] 2. DC deep-dive sidecar infrastructure
- [ ] 3. DC nodes translated (0/28)
