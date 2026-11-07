# Tracker Inventory — Stage 3 Migration Scaffold

Source: `index_slim.html` (gitignored monolith), readable text/babel block roughly lines **1337–17759**.
Active companies: **Zeely.ai** (`zeely`) and **Cursor / Anysphere** (`cursor`).
The Tracker section is everything the `tracker` app-mode renders. The `research` mode (toggled via `app:mode`) is already migrated in Stage 2a/2b — included only as a dependency callout.

---

## Tab list

Defined as `const TABS` at **line 11558**. Eight ids total; three are hidden in presentation mode via `HIDDEN_TABS = new Set(['log','syndicate','settings'])` (line 11544). User says "7 tabs" — that's the eight minus `settings`.

Dispatched in `App` at **lines 17703–17729** with `tab === '<id>' && <View …>`. Default tab: `'summary'` (line 17200).

| # | id | label | View component | Description |
|---|----|-------|----------------|-------------|
| 1 | `summary` | ZEELY.AI / CURSOR | `PositionSummaryView` (5917–6068) | Memo overview, alerts, triangulation tasks, weekly brief, investor panel — the executive landing page |
| 2 | `signals` | Public | `SignalTrackerView` (8958–9163) | The 8 corroboration buckets (news, hiring, traffic, app, reviews, search/social, funding, ad library); composes the panels listed below |
| 3 | `framework` | VC | `MetricHeatmapView` (9213–9534) | KPI heatmap across `METRIC_FRAMEWORK` categories; observation density per cell |
| 4 | `scoring` | Scoring | `ScoringTrajectoryView` (10948–11042) | Per-dimension scoring with `ScoreEditor`, trend chart, weighted composite |
| 5 | `position` | Position | `PositionView` (10015–10947) | Deal disclosure, cap events, ask/received flags, accordion sections — only shown if `cfg.is_position` |
| 6 | `log` | Log _(hidden)_ | `ObservationLogView` (11087–11243) | Full observation table with supersede + bulk add |
| 7 | `syndicate` | Syndicate _(hidden)_ | `SyndicateCommsView` (11244–11341) | Syndicate communications timeline + add form |
| 8 | `settings` | Settings _(hidden)_ | `SettingsView` (11342–11508) | Config editor, import/export, reset, cap events |

---

## Components (Tracker section only)

Research components (`ResearchCoverNodes`, `HoldingsCoverArt`, `ResearchCover`, `ResearchLanding`, `ResearchDetail`, `DataCentersAITab`, plus the 11920–17080 range of holdings/DC sub-cards) are intentionally **excluded** — already migrated.

### Tab bodies
| Component | Lines | Tab | Notes |
|---|---|---|---|
| `PositionSummaryView` | 5917–6068 | summary | Top-level; pulls in `MemoOverviewPage`, `AlertBar`, `TriangulationTasksPanel`, `WeeklyBriefPanel` |
| `SignalTrackerView` | 8958–9163 | signals | Loops over `CORROB_SOURCES`; defers to per-bucket panels |
| `MetricHeatmapView` | 9213–9534 | framework | Heatmap renderer (has demo-mode flag at 9164) |
| `MetricFrameworkView` | 9535–9673 | framework | Sister view of heatmap — list mode |
| `ScoringTrajectoryView` | 10948–11042 | scoring | Composite scoring orchestrator |
| `PositionView` | 10015–10947 | position | Largest tab body (~930 lines); accordions, cap table, asks |
| `ObservationLogView` | 11087–11243 | log | |
| `SyndicateCommsView` | 11244–11341 | syndicate | |
| `SettingsView` | 11342–11508 | settings | Import/export JSON, reset all, edit cfg fields |

### Forms
| Component | Lines | Type |
|---|---|---|
| `ObservationForm` | 3644–3792 | Form (modal body) — adds/edits a metric observation |
| `SyndicateCommForm` | 3793–3867 | Form (modal body) — logs a syndicate communication |
| `ScoreEditor` | 11043–11086 | Inline form — edits one scoring dimension |
| `AdLibraryLogModal` | 6308–6448 | Form modal — logs an ad-library observation |
| `AppDownloadsLogModal` | 8825–8957 | Form modal — logs an app-downloads observation |
| `ManualMentionAddModal` | 6602–6690 | Form modal — adds a manual press/social mention |

### Memo / Summary tab subcomponents
| Component | Lines | Role |
|---|---|---|
| `AlertBar` | 3868–3907 | Tab body |
| `MemoTile` | 3908–3919 | Shared utility |
| `MemoBaselineCard` | 3920–4168 | Tab body — collapsible memo card |
| `TriangulationTasksPanel` | 4169–4285 | Tab body |
| `MemoOverviewPage` | 4584–5916 | Tab body — the bulk of the summary view |
| `WeeklyTakeaway` | 7199–7284 | Tab body — pulled from worker; overrides in `WEEKLY_TAKEAWAY_OVERRIDES` |
| `BriefStack` | 7490–7799 | Tab body |
| `BriefTile` / `BriefTileBody` | 7426–7489 / 7362–7425 | Tab body |
| `BriefHeader` | 7810–7846 | Tab body |
| `WeeklyBriefPanel` | 7847–7979 | Tab body |
| `InvestorPanel` | 7995–8187 | Tab body |

### Signals/Public tab subcomponents
| Component | Lines | Role |
|---|---|---|
| `NewsMentionsFeed` | 6701–6927 | Tab body — fetches `/brief` from Cloudflare worker |
| `ScoredNewsItemRow` | 6927–7032 | Tab body row |
| `NewsItemRow` | 6574–6601 | Tab body row |
| `ThumbPlaceholder` | 6565–6573 | Shared utility |
| `AdLibraryPanel` | 6092–6307 | Tab body |
| `AppDownloadsPanel` | 8647–8824 | Tab body |
| `HiringVelocityPanel` | 8188–8326 | Tab body — fetches from worker |
| `CompetitorSharePanel` | 8327–8434 | Tab body — fetches from worker |
| `SentimentPanel` | 8435–8646 | Tab body — fetches from worker |

### Position tab subcomponents
| Component | Lines | Role |
|---|---|---|
| `PositionSnapshotCard` | 4286–4427 | Tab body |
| `DealStructureAccordion` | 4428–4479 | Tab body |
| `CompanyLogo` | 4480–4537 | Shared utility |
| `KPI` | 4538–4583 | Shared utility |
| `Tip` / `CopyButton` / `FieldGrid` / `RightBadge` / `AccordionRow` | 9881–10014 | Shared utilities used by `PositionView` |

### Scoring tab subcomponents
| Component | Lines | Role |
|---|---|---|
| `ScoringTrendChart` | 9780–9866 | Chart |
| `CompositeGauge` | 9674–9779 | Chart |

### Misc / Cross-tab utilities
| Component | Lines | Role |
|---|---|---|
| `ConfidenceBadge`, `SourceTag`, `MemoBadge`, `StaleTag`, `StatusDot`, `TrendDelta`, `Sparkline` | 3221–3302 | Shared utilities |
| `Tooltip` | 3303–3343 | Shared utility |
| `IconChip`, `StatusPill`, `TagChip`, `ConfidenceDots`, `CornerBrackets` | 3346–3439 | Shared utilities |
| `Panel` | 3440–3500 | Shared utility — the boxed card primitive used everywhere |
| `FocusButton`, `FocusOverlay` | 3501–3596 | Shared utility — modal-like focus mode |
| `Modal` | 3597–3611 | Shared utility |
| `StatusBadge`, `VerdictBadge` | 3612–3643 | Shared utilities |
| `QuickStartPanel` | 11509–11540 | Tab body fragment (used in Settings) |

### Top-level container
| Component | Lines | Role |
|---|---|---|
| `App` | 17160–17742 | Top-level — owns mode, companyId, all per-company state, tab dispatch, both modal mounts |

---

## Data structures (candidates for `src/data/`)

These are the constants the tracker reads. Most are pure JSON-shaped; the ones marked **NOT JSON-SAFE** embed function refs or imported component refs that must stay in JS or be replaced with string keys + a lookup map in the consuming component (matching the existing Stage 2a pattern flagged in `CLAUDE.md`).

| Name | Lines | Shape | Notes |
|---|---|---|---|
| `SEEDED_CONFIG` | 1358–1451 | Big flat object of Zeely deal terms + nested `documents[]` and `subscription` blocks | JSON-safe (string/number/array/object only). ~94 lines. |
| `CFG_CURSOR` | 1452–1545 | Same shape as `SEEDED_CONFIG`, for Cursor | JSON-safe. |
| `MEMO_BASELINE` | 2244–2355 | Nested baseline object: `metrics`, `valuation`, `comparables`, `verdict`, etc. | JSON-safe. |
| `MEMO_BASELINE_CURSOR` | 1546–1688 | Same shape for Cursor | JSON-safe. |
| `SEEDED_OBSERVATIONS` | 1809–2212 | Array of obs records (built via `_o(...)` helper at line 1801 which adds `id`/`createdAt`/`superseded`) | JSON-safe **after** the `_o` helper is unrolled at build time (or at first load) — the helper itself uses `Math.random` so output must be frozen. |
| `SEEDED_OBSERVATIONS_CURSOR` | 1689 | Empty array | JSON-safe. |
| `MEMO_OBSERVATIONS` | 2411–2573 | Array of obs records | JSON-safe (after `_o` unrolled). |
| `MEMO_OBSERVATIONS_CURSOR` | 1695 + 2574+ | Array | JSON-safe. |
| `SEEDED_SYNDICATE_LOG` | 2213–2243 | Array of comm records | JSON-safe. |
| `SEEDED_SYNDICATE_LOG_CURSOR` | 1696 | Empty array | JSON-safe. |
| `TRIANGULATION_TASKS_SEED` | 2370–2396 | Array of task records (`id`, `title`, `completed`) | JSON-safe. |
| `TRIANGULATION_TASKS_SEED_CURSOR` | 1697 | Empty array | JSON-safe. |
| `DERIVED_METRICS` | 2356–2369 | Map of `metric → number` (with formula comments) | JSON-safe. |
| `DERIVED_METRICS_CURSOR` | 1698 | `{}` | JSON-safe. |
| `MEMO_SUPERSEDES` | 2723–2755 | Map `memoObsId → [publicObsIds]` consumed by `applyMemoReconciliation` | JSON-safe. |
| `METRIC_FRAMEWORK` | 2756–2828 | Array of `{ category, metrics: [{label, metricId, source, ...}] }` | JSON-safe. |
| `SCORECARD_DIMENSIONS` | 2829–2841 | Array of dimension defs | JSON-safe. |
| `AI_OVERLAY_DIMENSIONS` | 2842–2848 | Array of dimension defs | JSON-safe. |
| `STAGE_OPTIONS` | 2849 | `['Pre-seed', 'Seed', …]` | JSON-safe. |
| `CONFIDENCE_OPTIONS` | 2851–2856 | Array of `{value,label,tone}` | JSON-safe. |
| `SOURCE_TYPE_OPTIONS` | 2857–2862 | Array | JSON-safe. |
| `MATERIALITY_OPTIONS` | 2863–2868 | Array | JSON-safe. |
| `SYNDICATE_SOURCES`, `SYNDICATE_CHANNELS` | 2869–2870 | String arrays | JSON-safe. |
| `DIMENSION_TO_CATEGORIES`, `AI_DIMENSION_TO_CATEGORIES` | 3016–3040 | Maps | JSON-safe. |
| `NEGATIVE_WHEN_UP` | 3041–3045 | `Set` of metric ids | JSON-safe **only** if exported as an array and rebuilt to a Set in JS. |
| `CONFIDENCE_WEIGHT` | 3046 | `{high,med,low}` | JSON-safe. |
| `CONFIDENCE_TOOLTIPS`, `SOURCE_TYPE_TOOLTIPS` | 3209–3220 | Maps | JSON-safe. |
| `WEEKLY_TAKEAWAY_OVERRIDES` | 1749–1754 | `{companyId: {upside, risk}}` | JSON-safe. |
| `CORROB_SOURCES` | 1759–1792 | Array of 8 sources with `icon`, `tools`, `staleDays`, `why` | **NOT JSON-SAFE** — `icon: Users` etc. are imported component refs. Migration pattern: store `iconKey: 'Users'` in JSON; resolve via a `{Users, MousePointer, …}` map in the consuming component. |
| `COMPANIES` | 1705–1736 | Registry with `config: () => SEEDED_CONFIG` lazy refs | **NOT JSON-SAFE** — function refs. Migration: keep this as a `.js` registry that imports the JSON files, since the function-ref pattern is exactly what `CLAUDE.md` calls out under migration notes. |
| `AD_LIBRARY_DEEPLINKS` | 6086 | Map | JSON-safe. |
| `SIGNAL_TRACKER_VISIBLE_BUCKETS` | 6069 | Array | JSON-safe (empty). |
| `CATEGORY_RULES`, `CATEGORY_CHIP_STYLE`, `CATEGORY_STRIPE`, `CATEGORY_HERO`, `CATEGORY_ICON` | 7072+, 7090+, 7456+, 7468+, 7479+ | Brief tile styling | `CATEGORY_ICON` embeds component refs — **NOT JSON-SAFE**. The rest can be JSON. Recommend keeping all of the brief module's style maps co-located in JS rather than splitting. |
| `SEVERITY_TIER_STYLE` | 7285 | Map | JSON-safe modulo any icon refs (check before extracting). |
| `SOURCE_THEME` | 6556 | Map | JSON-safe. |
| `FILTER_CHIPS` | 6691 | Array | JSON-safe modulo icons. |
| `FILTER_OPTIONS` | 7800 | Array | JSON-safe. |
| `TIER1_VC_KEYWORDS`, `STRATEGIC_KEYWORDS` | 7980, 7986 | String arrays | JSON-safe. |
| `POS_COLORS` | 9867 | Color map | JSON-safe — but only used by `PositionView`; keep co-located. |
| `CATEGORY_LINE_COLORS` | 9767 | Color map | JSON-safe — keep co-located with `ScoringTrendChart`. |

---

## localStorage keys

All reads/writes go through a thin `window.storage` wrapper (definition at line 1329 — `loadKey` at 456 / readable form deeper in App). All per-company state is namespaced via `k(suffix) = `${prefix}:${suffix}`` where `prefix` is `'zeely'` or `'cursor'`. Preserving these key names is **critical** — change them and users lose their data.

### App-global keys
| Key | Stored | Read by | Notes |
|---|---|---|---|
| `app:mode` | `'tracker'` \| `'research'` | `App` (17163) | Constant inlined in `App`, not a top-level export. |
| `app:active-company` | `'zeely'` \| `'cursor'` | `App` (17187) via `ACTIVE_COMPANY_KEY` | Persists which company is in focus. |
| `app:news-worker-url` | URL string override | `useWorkerUrl` (726 minified / 7015 readable) via `NEWS_WORKER_URL_KEY` | Lets user point at a non-default worker. |

### Per-company keys (prefix = `zeely` or `cursor`)
| Key | Stored | Derived? |
|---|---|---|
| `{prefix}:config` | `cfg` — the full SEEDED_CONFIG / CFG_CURSOR object after edits | Source-of-truth, not derived |
| `{prefix}:observations` | Array of observation records | Seeded on first run, mutated by add/supersede; reconciliation re-applied on load |
| `{prefix}:scores` | `{ dimensions, aiOverlay, history, weights }` | Source-of-truth |
| `{prefix}:syndicate-log` | Array of comm records | Source-of-truth (with first-run seed) |
| `{prefix}:cap-events` | Array of cap-table events | Source-of-truth |
| `{prefix}:triangulation-tasks` | Array of task records with `completed` flag | Source-of-truth (with first-run seed) |
| `{prefix}:derived-metrics` | Snapshot of `DERIVED_METRICS` | **Derived** — written once on first run alongside memo baseline for audit; not re-read by tab views |
| `{prefix}:ui:memo-card-open` | boolean | UI preference, not data |
| `{prefix}:memo-baseline:apr2026` (zeely) / `{prefix}:memo-baseline:feb2026` (cursor) | Full memo baseline object | Snapshot; key suffix is the memo date and is hard-coded per company in `COMPANIES[].memoBaselineKey` |

### Hard-coded brand-name / company-id keys (not namespaced via `k`)
| Key | Stored | Notes |
|---|---|---|
| `pos_asks:${cfg.company_brand_name}` | `Set` of disclosure-ask ids the user has flagged | Used by `PositionView` (10024). Namespaced by **brand name**, not `storagePrefix` — inconsistency. |
| `pos_ask_received:${cfg.company_brand_name}` | `Set` of asks confirmed received | Same. |
| `zeely:news-cache` | Worker `/brief` payload + timestamp | `NEWS_CACHE_KEY` literal at 6449 — hard-coded to `zeely:` and will not work for Cursor without rework. |
| `zeely:news-manual` | Manually-added mentions | `NEWS_MANUAL_KEY` literal at 6450 — same problem. |
| `${companyId}:brief-manual` | Manually-added brief items | `BRIEF_MANUAL_KEY` factory at 7033 — correctly per-company. |

---

## Forms

| Form | Component | Fields | Saves where |
|---|---|---|---|
| Add/edit observation | `ObservationForm` (3644) | `metricId`, `label`, `value`, `rangeLow`, `rangeHigh`, `unit`, `sourceTool`, `url`, `notes`, plus confidence / source-type / materiality / dimension selects | `addObservation` (17374) → `setObservations` + `{prefix}:observations` |
| Log syndicate comm | `SyndicateCommForm` (3793) | `date`, `source`, `channel`, `summary` (free text), `materiality`, `verdict` | `addSyndicateComm` (17393) → `setSyndicateLog` + `{prefix}:syndicate-log` |
| Edit one scoring dimension | `ScoreEditor` (11043) | `score`, `confidence`, `notes` | `onSave` prop in `ScoringTrajectoryView` → `saveScores` (17400) → `{prefix}:scores` |
| Log ad-library observation | `AdLibraryLogModal` (6308) | Per-platform fields (Meta/TikTok/Google) | Funnels into `addObservation` |
| Log app-downloads observation | `AppDownloadsLogModal` (8825) | Per-platform fields (App Store / Play Store / Similarweb) | Funnels into `addObservation` |
| Add manual mention | `ManualMentionAddModal` (6602) | `url`, `headline`, `source`, `date`, `relevance`, `summary` | Local-only — pushes to `zeely:news-manual` |
| Config edit | `SettingsView` (11342) | All `cfg.*` fields (deal terms, valuation, etc.) | `saveCfg` (17355) → `{prefix}:config` |

---

## Dependencies on Stage 2a code (already migrated)

The tracker doesn't import from research code, but `App` is the **shared owner** of the mode toggle and routes between the two. Migration needs to fit alongside what's already in `src/`.

| Existing | Used by Tracker how |
|---|---|
| `src/data/research-library.json` | Loaded inside `ResearchDetail.jsx`. Not used by Tracker views, but `App` needs to keep routing to `ResearchLanding` / `ResearchDetail` when `mode === 'research'` — see line 17700. |
| `src/components/research/ResearchLanding.jsx` | Rendered from `App` when `mode === 'research' && activeResearchId === null` (line 17700). |
| `src/components/research/ResearchDetail.jsx` | Rendered from `App` when `mode === 'research' && activeResearchId` (line 17700). |
| `src/components/research/HoldingsTab.jsx` / `DataCentersAI.jsx` | Not imported by tracker tabs. |
| App-mode storage key `app:mode` | Shared toggle. The tracker mounts the position monitor whenever this is `'tracker'`. Migration must not rename. |
| Header mode-toggle UI (around lines 17460–17560) | Part of `App` — the same chrome flips between tracker tabs and the research card grid. Belongs to neither side cleanly; recommend keeping in the top-level `App`. |
| `Panel`, icons, color tokens | The research components currently use a separate styling vocabulary (inline `style={}`). Tracker uses Tailwind classes + the `Panel` primitive. Keep them separate — no need to converge. |

**Naming collision to watch:** `CLAUDE.md` already notes `COMPANIES` collides with holdings' `HOLD_COMPANIES`. The tracker registry at line 1705 keeps the name `COMPANIES`; the research `HOLDING_COMPANIES` at line 16183 of `index_slim.html` is already aliased in the migrated `HoldingsTab.jsx`. Keep both names.

---

## Risk items

1. **Function refs in `COMPANIES` registry (line 1705).** `config: () => SEEDED_CONFIG`, `memoBaseline: () => MEMO_BASELINE`, etc. These exist to defer resolution until the constants are in scope — a JS-only pattern. Cannot be JSON-serialized. Solution: keep `COMPANIES` as `src/data/companies.js` that imports the JSON sidecars, matching the `CLAUDE.md` migration note.

2. **Component-ref payloads in data.** `CORROB_SOURCES` (1759), `CATEGORY_ICON` (7479), some `FILTER_CHIPS`, `SEVERITY_TIER_STYLE` etc. embed Lucide icon component refs. JSON migration requires string keys (`iconKey: 'Users'`) plus a resolution map in the consuming component. Worth doing once as a tiny shared util.

3. **`_o` seed helper uses `Math.random`** (line 1801). If we JSON-extract `SEEDED_OBSERVATIONS` / `MEMO_OBSERVATIONS`, the ids must be **pre-computed and frozen** in the JSON, not regenerated at load time, otherwise the same observation gets a new id every refresh and supersession breaks.

4. **`MEMO_SUPERSEDES` + `applyMemoReconciliation`** (2723, 2738). The reconciliation logic re-runs on every load to flip `superseded` on prior-version saves. Any change to obs ids in JSON migration must be mirrored in `MEMO_SUPERSEDES` keys/values, or memo reconciliation silently no-ops.

5. **Hard-coded `zeely:` keys for news.** `NEWS_CACHE_KEY = 'zeely:news-cache'` (6449), `NEWS_MANUAL_KEY = 'zeely:news-manual'` (6450) are literals — Cursor's news currently shares Zeely's storage. Pre-existing bug; flag for product decision before Stage 3 ships.

6. **`pos_asks:` / `pos_ask_received:` keyed by brand name, not storagePrefix.** Inconsistent with the rest of the per-company namespacing. If a brand_name ever changes ("Zeely.ai" → "Zeely"), the asks data is silently abandoned. Worth normalizing during migration.

7. **Build-flag string-replace constants** at 11544–11556 (`HIDDEN_TABS`, `PRESENTATION_MODE`, `NEWS_ONLY_MODE`). Comments say "do not rename — string-replaced at build time." Stage 3 needs to decide: keep the string-replace build, or convert to Vite env vars (`import.meta.env.VITE_PRESENTATION_MODE`). The current build script lives outside this repo.

8. **Duplicate definitions across minified and readable sections.** `relTime`, `deriveAlerts`, `useWorkerUrl`, `loadKey`/`saveKey`, `Panel`, `TABS`, `HIDDEN_TABS` all appear twice — once minified (pre-1337) and once readable. Readable copies are source-of-truth. Migration must port the readable ones and discard the minified copies; otherwise dead code ships.

9. **Cloudflare-worker dependence.** `NewsMentionsFeed`, `WeeklyBriefPanel`, `WeeklyTakeaway`, `HiringVelocityPanel`, `CompetitorSharePanel`, `SentimentPanel`, and the publicDataAt effect in `App` all `fetch` from `NEWS_WORKER_URL_DEFAULT = 'https://news-monitor.egorvasylchenko02.workers.dev'`. The migration doesn't need to change this, but the URL belongs in env / a config constant, not buried inside the news module.

10. **Huge `PositionView` (~930 lines).** Migrating this as one file is fine; just budget extra time. It owns its own accordion state, ask tracking, and field-level helpers — most of which are local utilities (`Tip`, `CopyButton`, `FieldGrid`, `RightBadge`, `AccordionRow` at 9881–10014) that should live in the same file.

11. **Memo seeding-and-migration logic** at lines 17282–17325. The `App` first-load effect not only seeds, it back-fills memo observations and the memo syndicate-comm entry into prior saves. The behavior is: any existing user who upgrades gets `MEMO_OBSERVATIONS` appended once. Migration must keep this intact or returning users lose their memo overlay.

12. **`SEEDED_CONFIG` and `CFG_CURSOR` are dense, ~94 lines each, with nested arrays (`documents`, `subscription`).** Pure JSON, but worth eyeballing for accidental `Date()` / `Function` / `Symbol` survivors before declaring JSON-safe — I didn't read every nested key.

---

`tracker-inventory.md` ready for your review at the project root. Not committed.
