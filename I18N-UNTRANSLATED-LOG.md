# Untranslated sections — audit + progress log

Started 2026-08-29. Goal: EN mode must not show Russian prose.

## The blind spot
`npm run i18n:check` walks only 4 modules — `nvidiaEcosystem.js`,
`aiEcosystemNetwork.js`, `capitalMap.js`, `fundTracker.js`. Everything else —
the raw JSONs the components import directly, plus hardcoded JSX copy — was
never gated. That is where the reported gaps live.

## Census of Russian-only data (Cyrillic strings with no `{ru,en}` pair)

| file | ru strings | notes |
|---|---|---|
| `src/data/dc-details.json` | 8585 | **DC deep-dives — the screenshot.** 28 nodes, 40-60 KB each |
| `src/data/holdings.json` | 2788 | Holdings (legacy) |
| `src/data/nvidiaEcosystem.json` | 1485 | payload; the `.js` wrapper is bilingual, the raw json is not |
| `src/data/holdings-v2/**` | ~9000 | 9 holdings + portfolio + deep dives |
| `src/data/yc-*.json` | ~700 | YC research |
| `src/data/dc-companies.json` | 319 | DC company cards |
| `src/data/proxy-*.json` | ~310 | Proxy section |
| `src/data/dc-company-profiles.json` | 109 | |

Plus hardcoded Russian string literals in `.jsx` that were never wrapped in
`t()` — a separate, much smaller pass, listed at the bottom.

## Mechanism shipped

`src/data/dc-details.en.json` is a FLAT, PATH-KEYED sidecar:

```json
{ "hbm.thesis.stream.3.t": "What HBM is, and why nothing works without it" }
```

`Roadmap.jsx` overlays it at read time (`overlayEn` → `dcDetails()`), merged
once and lazily because the payload is ~2 MB. A path the sidecar has not
reached yet falls through to Russian, so a half-filled sidecar degrades to
"some Russian left" rather than blanking a page — the same bargain `useT()`
strikes for UI copy.

Path-keyed rather than a mirrored object tree on purpose: mirroring meant
re-typing every wrapper object and array index to reach one sentence, which
tripled the file and made a half-finished node unreadable.

Coverage report, and the skeleton generator that produces the next batch:

```bash
node scripts/dc_en_status.mjs          # per-node coverage
node scripts/dc_en_status.mjs pkg      # untranslated paths of one node, as JSON
```

## Progress — DC deep-dives

```
· pkg               0/463    0%
· asic              0/448    0%
· litho             0/440    0%
· rack              0/411    0%
· photonics         0/405    0%
· dram              0/389    0%
· lab               0/386    0%
· eda               0/374    0%
· wbg               0/374    0%
· transformers      0/365    0%
· nand              0/348    0%
· inference         0/346    0%
· server            0/335    0%
· netsilicon        0/319    0%
· pcb               0/314    0%
· darkfiber         0/308    0%
· fiber             0/299    0%
· gasturbines       0/246    0%
· power             0/239    0%
· smr               0/220    0%
· fabric            0/215    0%
· nuc               0/210    0%
· transceivers      0/187    0%
· renewables        0/181    0%
· silicon           0/163    0%
· ip                0/162    0%
· test              0/89     0%
✓ hbm             349/349  100%

  349/8585 (4%) переведено
```

## Still to do
1. Remaining 27 DC nodes (same loop: `dc_en_status.mjs <node>` → translate → build → push).
2. `holdings-v2/**` and `holdings.json` — same sidecar pattern, new resolver in the Holdings components.
3. `nvidiaEcosystem.json`, `yc-*.json`, `proxy-*.json`, `dc-companies.json`.
4. Hardcoded Russian in JSX. Confirmed spots: `App.jsx:574,592`
   («Все трекеры», «Трекеры»), `HomeLanding.jsx:288,298,308`,
   `home/SupplyChainHome.jsx:154`, `home/HoldingsHome.jsx:188`,
   `research/ResearchLanding.jsx:28`, `tracker/yc/YCCompanyCard.jsx:184,250`,
   `tracker/yc/YCBatchRanking.jsx:29-33`, `tracker/yc/YCLanding.jsx:11`,
   `capitalflow/layout.js:262-263`, `funds/FundGrid.jsx:116`,
   `funds/HolderLookup.jsx:59`, `ecosystem/EcoLegend.jsx:138`.
5. Once a file is fully covered, extend `scripts/i18n_audit.mjs` to gate it —
   otherwise the next delivery re-opens the gap silently.
