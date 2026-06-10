# Stage 3 — Tracker Migration Plan

## Context
The Tracker (VC position monitor) is the last big chunk still living in `index_slim.html`. Stage 2a/2b migrated the Research mode (`HoldingsTab`, `DataCentersAI`, `ResearchLanding`, `ResearchDetail`). Stage 3 ports the Tracker — App-level state, both companies (Zeely + Cursor), all eight tab views, forms, modals, shared primitives, and seeded data — into `src/` so the monolith can be retired.

Source of truth for what needs to move: [tracker-inventory.md](tracker-inventory.md).

## Non-negotiables (per project memory)
- Russian text in Holdings stays Russian; Tracker text is English.
- Dark mode only — no toggle.
- `COMPANIES` is the **Tracker** registry. Holdings keeps `HOLD_COMPANIES`.
- Function refs (`config: () => SEEDED_CONFIG`, icon component refs) stay in JS files with a resolver pattern — not JSON.
- No new npm deps. Tailwind comes from CDN (same as monolith). Lucide + recharts are already installed.
- No logic refactors — translate faithfully. The monolith's behaviour, key names, seed contents, and reconciliation logic must round-trip.

## File structure

```
src/
  App.jsx                              # mode toggle + tab dispatch + per-company state
  main.jsx                             # unchanged
  lib/
    storage.js                         # window.storage shim + loadKey/saveKey
    workerUrl.js                       # useWorkerUrl hook + NEWS_WORKER_URL constants
    icons.js                           # iconKey → Lucide component resolver
    utils.js                           # relTime, deriveAlerts, applyMemoReconciliation, _o helper
  data/
    # JSON sidecars (pure data, JSON-safe)
    seeded-config.json                 # Zeely cfg
    cfg-cursor.json                    # Cursor cfg
    memo-baseline.json                 # Zeely memo baseline
    memo-baseline-cursor.json
    seeded-observations.json           # Zeely seed obs (with frozen ids)
    memo-observations.json             # Zeely memo overlay obs
    seeded-syndicate-log.json
    triangulation-tasks.json
    derived-metrics.json
    memo-supersedes.json
    weekly-takeaway-overrides.json
    metric-framework.json
    scorecard-dimensions.json
    options.json                       # STAGE/CONFIDENCE/SOURCE_TYPE/MATERIALITY/SYNDICATE_*
    dim-to-categories.json
    ai-dim-to-categories.json
    negative-when-up.json              # array; consumer rebuilds Set
    confidence-weight.json
    confidence-tooltips.json
    source-type-tooltips.json
    # JS sidecars (function refs / component refs)
    companies.js                       # COMPANIES registry — imports JSON + memo seeds
    corrob-sources.js                  # 8 corroboration sources with icon refs
  components/
    research/                          # unchanged (Stage 2a/2b)
    tracker/
      shared/
        Panel.jsx                      # the boxed card primitive
        Modal.jsx
        FocusOverlay.jsx               # + FocusButton
        chrome.jsx                     # IconChip, StatusPill, TagChip, ConfidenceDots, CornerBrackets, StatusBadge, VerdictBadge
        badges.jsx                     # ConfidenceBadge, SourceTag, MemoBadge, StaleTag, StatusDot, TrendDelta, Sparkline, Tooltip
        AlertBar.jsx
        QuickStartPanel.jsx
      forms/
        ObservationForm.jsx
        SyndicateCommForm.jsx
      news/                            # signals-tab news + worker-fed panels
        WeeklyTakeaway.jsx
        BriefStack.jsx                 # + BriefTile, BriefTileBody, BriefHeader, severity helpers, category styling
        WeeklyBriefPanel.jsx
        NewsMentionsFeed.jsx           # + ScoredNewsItemRow, NewsItemRow, ThumbPlaceholder, ManualMentionAddModal, FILTER_CHIPS/FILTER_TABS
      signals/                         # signals-tab corroboration panels
        HiringVelocityPanel.jsx
        CompetitorSharePanel.jsx
        SentimentPanel.jsx
        AppDownloadsPanel.jsx          # + AppDownloadsLogModal
        AdLibraryPanel.jsx             # + AdLibraryLogModal, AD_LIBRARY_DEEPLINKS
      position/                        # position tab subcomponents (used only by PositionView)
        PositionSnapshotCard.jsx
        DealStructureAccordion.jsx
        CompanyLogo.jsx
        KPI.jsx
        helpers.jsx                    # Tip, CopyButton, FieldGrid, RightBadge, AccordionRow, POS_COLORS
      memo/                            # summary/memo subcomponents
        MemoBaselineCard.jsx           # + MemoTile
        TriangulationTasksPanel.jsx
        MemoOverviewPage.jsx
        InvestorPanel.jsx
      scoring/
        ScoringTrendChart.jsx
        ScoreEditor.jsx
        CompositeGauge.jsx
      # Tab body components (one file per tab — App imports these)
      PositionSummaryView.jsx          # summary tab
      SignalTrackerView.jsx            # signals tab — composes news/ + signals/ panels
      MetricHeatmapView.jsx            # framework tab — heatmap + MetricFrameworkView
      ScoringTrajectoryView.jsx        # scoring tab
      PositionView.jsx                 # position tab (~930 lines — single file)
      ObservationLogView.jsx           # log tab
      SyndicateCommsView.jsx           # syndicate tab
      SettingsView.jsx                 # settings tab
```

### Subfolder rationale (no over-splitting)
- `tracker/shared/` — primitives used across multiple tabs (Panel, Modal, IconChip, badges).
- `tracker/forms/` — ObservationForm and SyndicateCommForm are reused via the top-level modal mounts in App.
- `tracker/news/`, `tracker/signals/` — Signals tab is composed of two distinct families (worker-fed news/brief panels vs. corroboration source panels). Two subfolders, ~5 files each, matches the existing `dc/` pattern from Stage 2b.
- `tracker/position/`, `tracker/memo/`, `tracker/scoring/` — each owns a small set of subcomponents used only by one tab body. Same pattern.
- Tab bodies live at `tracker/` root (one file per tab) so App.jsx imports are short and obvious.

## Function-ref / component-ref handling

Two distinct cases, both kept in `.js` files (not JSON):

1. **`COMPANIES` registry** (`src/data/companies.js`). Imports the JSON sidecars and re-exports the original lazy-getter shape:
   ```js
   import seededConfig from './seeded-config.json';
   import memoBaseline from './memo-baseline.json';
   // ...
   export const COMPANIES = [
     { id: 'zeely', name: 'Zeely.ai', legalName: 'Zeely Inc.', accent: 'cyan',
       storagePrefix: 'zeely',
       config: () => seededConfig,
       memoBaseline: () => memoBaseline,
       memoBaselineKey: 'zeely:memo-baseline:apr2026',
       seededObservations: () => seededObservations,
       // ...
     },
     // cursor block …
   ];
   export function getCompanyById(id) { return COMPANIES.find(c => c.id === id) || COMPANIES[0]; }
   export const ACTIVE_COMPANY_KEY = 'app:active-company';
   ```
   Preserves the exact closure-over-imports pattern from the monolith (line 1705). App.jsx imports `{ COMPANIES, getCompanyById, ACTIVE_COMPANY_KEY }` and uses identically.

2. **Icon-bearing data structures** (`CORROB_SOURCES`, `CATEGORY_ICON`, `FILTER_CHIPS`, `SEVERITY_TIER_STYLE`, etc.). Stored as `.js` files that import the Lucide components directly:
   ```js
   import { Users, MousePointer, BarChart3, CheckCircle2, Search, FileText, Zap, Megaphone } from 'lucide-react';
   export const CORROB_SOURCES = [
     { id: 'headcount', label: 'Headcount & Hiring', icon: Users, tools: [...], staleDays: 90, why: '...' },
     // …
   ];
   ```
   Same object shape as the monolith. No JSON intermediate.

Alternative (`iconKey: 'Users'` + resolver map) is faithful but adds indirection the monolith didn't have. The JS-only path is closer to the source and simpler.

## App.jsx changes

Replace the placeholder with the full tracker app:

- **State**: `mode`, `activeResearchId`, `publicDataAt`, `companyId`, `cfg`, `observations`, `syndicateLog`, `scores`, `capEvents`, `triangulationTasks`, `memoBaseline`, `memoCardOpen`, `tab`, `loading`, `obsModalOpen`, `obsModalInitial`, `synModalOpen`, `appFocusedItem`.
- **Persistence**: All `loadKey`/`saveKey` calls preserved; `k(suffix)` namespacing preserved (`{prefix}:suffix`).
- **First-load effect**: Preserved verbatim, including memo back-fill migration and reconciliation re-run.
- **Tab dispatch**: 8 tabs, gated by `HIDDEN_TABS` exactly as in monolith.
- **Mode dispatch**: `mode === 'research'` routes to `ResearchLanding` / `ResearchDetail` (already migrated). `mode === 'tracker'` routes to the tab view dispatcher.
- **Modals**: `<Modal>` wrappers around `ObservationForm` and `SyndicateCommForm` at the App root.
- **Brief focus overlay**: `appFocusedItem` event listener for `'brief-focus-open'` / `'brief-focus-close'`.
- **Build-flag constants** (`HIDDEN_TABS`, `PRESENTATION_MODE`, `NEWS_ONLY_MODE`): Copied verbatim with the `BUILD-FLAG:` comments. Kept as module-scope `const`s so the original string-replace tooling still works if reintroduced; otherwise they're plain constants with the current values (`PRESENTATION_MODE = true`, `NEWS_ONLY_MODE = false`).

## Shared utilities

- **`src/lib/storage.js`** — `window.storage` shim (line 1329) + `loadKey`/`saveKey` (line 456). Mounted on `window` on first import so any code reaching for `window.storage` still works.
- **`src/lib/utils.js`** — `relTime`, `parseGdeltDate`, `deriveAlerts`, `applyMemoReconciliation`, `_o` seed helper (with id frozen at call time — but for JSON data we pre-bake ids during extraction so `_o`'s `Math.random` never fires for seeded constants).
- **`src/lib/workerUrl.js`** — `NEWS_WORKER_URL_DEFAULT`, `NEWS_WORKER_URL_KEY`, `useWorkerUrl()`. The default URL is a constant; if Stage 3 wants to make it env-driven later that's a separate change.
- **`src/lib/icons.js`** — central re-export of every Lucide icon the tracker references (~30 symbols). Lets data files import from one place and lets future Stage 4 swap providers if needed. Pure barrel.

## localStorage approach

No change from monolith:
- All Tracker per-company state goes through `window.storage` (which wraps `localStorage` with a prefix from the original storage helper — preserved verbatim).
- Key names preserved exactly: `app:mode`, `app:active-company`, `app:news-worker-url`, `{prefix}:config`, `{prefix}:observations`, `{prefix}:scores`, `{prefix}:syndicate-log`, `{prefix}:cap-events`, `{prefix}:triangulation-tasks`, `{prefix}:derived-metrics`, `{prefix}:ui:memo-card-open`, `{prefix}:memo-baseline:apr2026` / `feb2026`, `pos_asks:{brand_name}`, `pos_ask_received:{brand_name}`, `zeely:news-cache`, `zeely:news-manual`, `{companyId}:brief-manual`.
- Existing-user data round-trips: a returning Zeely user with saved observations + scores opens the migrated build and sees the same dashboard state.
- Known pre-existing bugs in key naming (Risks #5 and #6 of the inventory: hard-coded `zeely:` for news + brand-name keying for `pos_asks`) are **preserved as-is**. They're not Stage 3's job to fix.

## Tailwind

The monolith renders via Tailwind CDN. The current migrated research code uses inline styles, but Tracker components use Tailwind classes extensively (`className="bg-zinc-900 border border-zinc-800 rounded-xl"`). Faithful translation requires Tailwind classes resolve to styles.

Decision: add `<script src="https://cdn.tailwindcss.com"></script>` to `index.html`, plus the small Tailwind-ready paint trick from the monolith (hide `#root` until the CDN injects its `<style>` tag). Same approach as `index_slim.html` lines 7–55. No npm dependency.

## Migration order (batched)

Each batch ends with `npm run build` → if green, commit + push. If red, fix before pushing. Max two fix attempts per batch.

| Batch | Files | Commit message |
|---|---|---|
| 0a | `tracker-inventory.md` | `Stage 3: tracker inventory` |
| 0b | `stage3-plan.md` | `Stage 3: migration plan` |
| 1 | `index.html` (Tailwind CDN), `src/lib/storage.js`, `src/lib/workerUrl.js`, `src/lib/icons.js` | `Stage 3: foundation (Tailwind + storage)` |
| 2 | `src/lib/utils.js`, `src/data/options.json`, `src/data/confidence-weight.json`, `src/data/confidence-tooltips.json`, `src/data/source-type-tooltips.json` | `Stage 3: shared utils + lookup tables` |
| 3 | All seeded-config / memo / observations / syndicate / cap-table JSON for both companies; `src/data/derived-metrics.json`, `src/data/memo-supersedes.json`, `src/data/triangulation-tasks.json`, `src/data/weekly-takeaway-overrides.json`, `src/data/metric-framework.json`, `src/data/scorecard-dimensions.json`, `src/data/dim-to-categories.json`, `src/data/ai-dim-to-categories.json`, `src/data/negative-when-up.json` | `Stage 3: seeded data JSON sidecars` |
| 4 | `src/data/companies.js`, `src/data/corrob-sources.js` | `Stage 3: companies registry + corrob sources` |
| 5 | `src/components/tracker/shared/Panel.jsx`, `shared/Modal.jsx`, `shared/FocusOverlay.jsx`, `shared/chrome.jsx`, `shared/badges.jsx` | `Stage 3: shared UI primitives` |
| 6 | `src/components/tracker/forms/ObservationForm.jsx`, `forms/SyndicateCommForm.jsx` | `Stage 3: observation + syndicate forms` |
| 7 | `src/components/tracker/SettingsView.jsx`, `shared/QuickStartPanel.jsx` | `Stage 3: settings tab` |
| 8 | `src/components/tracker/ObservationLogView.jsx` | `Stage 3: log tab` |
| 9 | `src/components/tracker/SyndicateCommsView.jsx` | `Stage 3: syndicate tab` |
| 10 | `src/components/tracker/scoring/*.jsx`, `ScoringTrajectoryView.jsx` | `Stage 3: scoring tab` |
| 11 | `src/components/tracker/MetricHeatmapView.jsx` (+ MetricFrameworkView inline) | `Stage 3: framework tab` |
| 12 | `src/components/tracker/position/*.jsx`, `PositionView.jsx` | `Stage 3: position tab` |
| 13 | `src/components/tracker/signals/*.jsx` (5 corroboration panels) | `Stage 3: signals corroboration panels` |
| 14 | `src/components/tracker/news/*.jsx` (5 worker-fed panels) | `Stage 3: news + brief panels` |
| 15 | `src/components/tracker/SignalTrackerView.jsx` | `Stage 3: signals tab` |
| 16 | `src/components/tracker/memo/*.jsx`, `shared/AlertBar.jsx`, `PositionSummaryView.jsx` | `Stage 3: summary tab` |
| 17 | `src/App.jsx` (wires it all together) | `Stage 3: wire App to tracker tabs` |

Foundation first → smallest tabs (settings, log, syndicate) → medium (scoring, framework) → large (position, signals subtrees) → summary → App. Pure data and shared primitives come before any tab body so each tab batch builds standalone (component-only changes, no JSX dispatch wired up). The final App batch wires everything; the build will be red until then for `App.jsx` because the current placeholder doesn't reference tracker code — that's expected and that's why App is last.

> One caveat to the "build green between every batch" rule: the App placeholder will keep building cleanly through batches 1–16 since tab files aren't imported anywhere yet. Tree-shaking drops them. Build greenness in this phase means "no syntax errors, no broken imports inside the new files themselves" — verified by adding a temporary throwaway `import` of the new files into a scratch entry, OR (simpler) by counting on Rollup's per-module parse during the build. Vite/Rollup parses every reachable module, so unreferenced files only get parsed at the App-wire step. To catch parse errors earlier, each batch ends with a sanity import in App.jsx — a single `import './path/to/new/file.jsx';` line — kept as a placeholder, then collapsed into the real wiring in batch 17.

## Verification

After batch 17:
1. `npm run build` exits 0.
2. `npm run dev` opens; the Tracker view loads with the Zeely position monitor visible (memo baseline card open, alerts, weekly takeaway).
3. Switching to Cursor via the company switcher shows the Cursor cfg (different brand/legal name, different valuation).
4. Switching to Research mode shows the Research Landing (unchanged from Stage 2a/2b).
5. Each visible tab renders without console errors. Hidden tabs (`log`, `syndicate`, `settings`) confirmed not rendered when `PRESENTATION_MODE = true`.
6. Browser DevTools → Application → Local Storage shows the same keys as the monolith ever wrote (returning user round-trip).
7. Push to main; Vercel deploy goes green.

## Risks acknowledged from the inventory
- Risk #1 (function refs in COMPANIES): handled by `companies.js`.
- Risk #2 (component refs in data): handled by JS sidecars (`corrob-sources.js`).
- Risk #3 (`_o` Math.random): handled by pre-baking ids in the JSON during extraction.
- Risk #4 (`MEMO_SUPERSEDES`): JSON dump as-is; obs ids must match the pre-baked seed ids exactly.
- Risk #5/#6 (Zeely-hardcoded news keys, brand-name `pos_asks`): preserved unchanged. Out of scope for Stage 3.
- Risk #7 (build flags): kept as plain consts with the current values. String-replace tooling can be reintroduced later.
- Risk #8 (duplicated minified definitions): only the readable versions get ported.
- Risk #9 (worker URL): kept in `src/lib/workerUrl.js` as a plain constant.
- Risk #10 (PositionView size): single file, ~930 lines. Faithful.
- Risk #11 (memo seeding migration): App.jsx replicates the first-load effect exactly.
- Risk #12 (config dense fields): JSON extraction validated by spot-checking `JSON.parse(JSON.stringify(SEEDED_CONFIG))` round-trip mentally before committing.
