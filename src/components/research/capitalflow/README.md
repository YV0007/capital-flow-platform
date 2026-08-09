# Capital Flow Map

Full-screen Research section that renders **`src/data/capitalMap.json`** — the
file the external **Capital Flow engine** exports each cycle. This is a pure
consumer: the engine (a separate repo) sweeps filings/PRs/press, verifies real
capital-allocation events, runs signal rules, and writes the file. This
component only visualises it.

```
Capital Flow engine  →  src/data/capitalMap.json  →  this component
```

Nothing here is hard-coded. Swap in next week's file (overwrite
`src/data/capitalMap.json` and rebuild) and the map changes with **no code
edit** — new nodes appear in their sector zone, totals update, fired signals
light up.

## Data contract (`capitalMap.json`)
```
generated                              ISO date the file was produced
totals { nodes, flows, sectors }
nodes[] { id, label, kind, cls, tier, sector, deals, capital,
          first_seen, last_activity, stale }
flows[] { source, target, sector, event_type, amount, status, date, tier }
sectors{ <key>: { deals, capital, allocators, signals[] } }
```
- `kind` — `allocator` (deploys) or `target` (receives).
- `cls`  — allocator: corporate·vc·individual·alt_manager·sovereign;
           target: private·public·fund·project·asset.
- `tier` — allocator importance: `key`·`watch`·null.
- `status` — flow confidence: `verified`·`verified_alpha`·`candidate`.
- `amount` — USD, or `null` when undisclosed.
- `signals` — fired signal rules for a sector (may be empty; the alpha).

## Files
- `../../../data/capitalMap.js` — **adapter**: imports the JSON, defines the
  meta maps (`SECTOR_META`, `CLASS_META`, `EVENT_TYPE_META`, `STATUS_META`,
  `TIER_META`), and reshapes the contract into the graph via `buildGraph()` /
  `buildAdjacency()`. Zero data latitude — statuses/amounts rendered as-is.
- `layout.js` — deterministic static layout: allocator class islands on the
  left (source), target **sector** islands on the right (sink); signal-lit
  sectors get a highlighted frame. Positions pinned (`fx`/`fy`), no simulation.
- `FlowGraph.jsx` — the canvas (react-force-graph-2d). Node = labelled block
  sized by `capital`, coloured by sector (targets) / class (allocators); edge
  colour = event family, dash = confidence, arrow = direction. **Cluster titles
  are clickable** — they hit-test against a box the region painter writes each
  frame in graph coordinates (so it tracks pan/zoom), with padding specified in
  screen pixels so a zoomed-out title stays easy to hit. The click is caught in
  the DOM capture phase so a flow edge crossing the title never steals it.
  Nothing but the title and the one total is printed on the canvas: fired
  signals used to shout a second line under each title and now live in the
  cluster report instead. A signalling cluster keeps a `◆` on its title.
- `CapitalFlowMap.jsx` — the section shell: top bar (generated stamp + live
  stats), filters, watch toggle, legend, selection panels.
- `FilterBar.jsx` — sector · class · tier (entities) + event · confidence ·
  min-size (flows).
- `ClusterReport.jsx` + `clusterStats.js` — the **cluster report**, opened by
  clicking a cluster title. One component covers both kinds of cluster: a
  **sector** cell (where capital lands) and an **allocator class** island (who
  deploys it). It answers, in order and then stops: how big and how it ranks ·
  who dominates it, by kind of money then by name · where it actually lands ·
  which way it is moving (last 30d vs the 30d before) · the fired signals · a
  derived read. A disclosure adds the deeper breakdown. Basis rules live in
  `clusterStats.js` and are surfaced in the panel: **confirmed flows only**
  (verified + verified α, matching the engine's own `aggregates.basis`),
  candidates reported separately, undisclosed amounts contributing $0, windows
  measured against the payload's `generated` date. Nothing is estimated. The
  report is computed over the whole tracked universe, not the current filter
  state, so it cannot silently change meaning when a filter is on.
- `subsectors.js` — **derived dashboard-side.** Two axes under a sector:
  *vehicle type* (operating company / fund & SPV / project & asset — structural,
  straight off the payload's `cls`, 100% coverage) and *sub-sector* (bio,
  security, energy, compute…), inferred from the entity description by ordered,
  high-precision phrase rules. Tuned for precision over coverage: an entity
  whose text does not clearly name its business is left **Unclassified**, and
  every breakdown states the classified fraction. **The engine does not emit a
  sub-sector field** — when it does, delete this module. *(Backend request.)*
- `EntityPanel.jsx` — per-entity breakdown (who invests / where money goes).
- `AllocatorDeepDive.jsx` — the "Detailed breakdown" view, **allocators only**:
  background/thesis, latest-investments decision logic (derived strictly from
  tracked flows), track record by fiscal year + YTD (always flagged
  provisional), and source-attributed strategy. Canonical summaries come from
  a `profile` object on the node (engine-emitted, wins) or
  `../../../data/allocatorProfiles.json` (payload sidecar); anything missing
  renders an honest "no data" state — never estimated dashboard-side.
- `EntityTable.jsx` — the **Table** view (top-bar toggle): the whole tracked
  universe, organised rather than dumped. Two role sections — *Allocators ·
  who deploys capital* and *Recipients · where the capital lands* — each split
  into typed, collapsible subsections (sovereign · corporate · venture · alt
  manager · individual / public co · private co · funds · projects · assets),
  every subsection header carrying its own count and capital total, heaviest
  first. Because the headers carry the type, there are no Class or "Tracked
  as" columns. Obeys the same filters/quick views as the map — one universe,
  two views. Row click jumps to the map with the entity selected.
- `views.js` — **quick views**: pre-made filter combinations (Fresh batch ·
  Mega tickets · Sovereign money · Smart money · Hard evidence · Signal
  sectors · Private rounds · Physical buildout), each expressed purely in
  existing filter dimensions. Applying one replaces the filter state; the
  active view is derived by comparing state, never by a flag that can drift.
  Also holds the recency options — ages are measured against the payload's
  `generated` date, not wall clock, because the file is a snapshot.
- `useWatchlists.js` + `WatchlistControl.jsx` — named, saved, cross-entity
  watchlists (localStorage `cfm:watchlists:v1`). Add/remove from the entity
  panel bookmark or a roster row; activating a list from the top-bar selector
  narrows map + roster to its members (their direct counterparties stay
  visible so the subset remains navigable).
- `FlowDetailCard.jsx` — per-flow detail (edge click). Deliberately answers
  four questions and stops: **how much · between whom · when · how far to
  trust it**. Three tags only (event type · sector · date + age in days
  against the payload date); the confidence score is one row — bar, score,
  and a single line decoding the Admiralty grade *and* the status into plain
  English ("Quality press · Uncorroborated · Candidate"), so no status or
  confidence chip is duplicated up in the tags. Source tier and the source
  link sit on one row. Our written read is commentary, not fact, so it is
  folded behind a disclosure button and the card stays scannable by default.
  **Source links:** the payload grades each flow's sourcing (`tier`, `grade`)
  but does not yet emit URLs — the card renders `flow.sources[]` / `flow.url`
  the moment the engine ships them, and says "no source link in payload"
  until then rather than guessing one. *(Backend request.)*
- `Legend.jsx`, `format.js` — key + shared formatters.
- `canvasTheme.js` — light/dark for the section. See below.

## Light + dark
The section follows the app-wide `data-theme` attribute. Two layers, because
the map is half DOM and half canvas:

- **DOM** (panels, table, drawer, cards) uses the `--cf-*` variables defined in
  `src/theme.css`. Components carry no literal neutral hex — a surface is
  `var(--cf-surface1)`, a border `var(--cf-border)`, text `var(--cf-text3)`,
  and the whole section reskins from the stylesheet alone.
- **CANVAS** (`FlowGraph`) cannot read CSS variables, so `canvasTheme.js` keeps
  a JS mirror of the same palette (`canvasTokens(mode)`) plus `useThemeMode()`,
  which watches the `data-theme` attribute and re-memoises the painters so the
  canvas repaints on a theme flip with no reload. **`src/theme.css § --cf-*`
  and `canvasTokens` are the same palette written twice — change both.**

**The semantic palette is derived, not duplicated.** Sector / class / event
colours live in `capitalMap.js` as data, tuned for a near-black canvas; on
white the brighter ones vanish. Rather than maintain a second palette that
would drift the moment the engine adds a sector, `tone(color, mode)` darkens
only what is measurably too light (luminance over a ceiling), mixing toward
deep slate in proportion to the overshoot. Hue identity and the relative order
of the palette survive, and a brand-new sector colour is handled automatically.
Anything that feeds `hexA()` or the canvas must stay a hex literal —
`views.js`, `clusterStats.js` and `subsectors.js` therefore keep hex and are
toned at render time, not tokenised.

### National affiliation (sovereign flags)
The engine emits ISO-2 `country` codes (uppercase) on any entity it can place;
the adapter lowercases them to match `public/flags/<cc>.png`, and
`entityReference.json` (`country` + `countryLabel`) is the curated fallback.

**The flag is the node icon for `cls: sovereign` entities only** — state funds
and government programmes. That is the point of the flag: spotting national
capital at a glance. Every other entity keeps its brand mark (a US flag on
NVIDIA says nothing and costs us the logo) and carries its country as
metadata — a chip in the entity panel, a quiet code suffix in the table.
Adding a country the payload uses means dropping a new `<cc>.png` into
`public/flags/`; an unmapped display name falls back to the uppercase code.

### No theme dimension
Themes were a second grouping axis (group-by switch + filter row). Removed —
sector is the one grouping dimension. The adapter still ingests the payload's
`themes` block because theme-level **signals** feed the beneficiary read-through;
nothing theme-shaped is rendered.

## Entity reference & allocator intelligence — ENGINE-OWNED
The engine owns the "what this is" content outright. The dashboard renders it
and never edits, recomputes or gap-fills it.

| Payload | Feeds | Rendered by |
|---|---|---|
| `nodes[].description` / `links[]` / `reference_as_of` (targets) | the About card | `EntityPanel.jsx` |
| `allocators[<name>].profile` | background · focus · style · thesis · latest-investments summary · strategy + `strategy_source_url` · `sources[]` | `AllocatorDeepDive.jsx` |
| `allocators[<name>].track_record[]` | per-fiscal-year rows, grouped by `metric`, each with `scope`, `provisional`, `source_tier`, `source_url`, `notes` | `AllocatorDeepDive.jsx` |
| `aggregates` (`top_sector` / `top_company` / `thesis_shares`, each with a `basis`) | the "This cycle" summary — **`basis` strings render verbatim, figures are never recomputed** | `EntityTable.jsx` |
| `audit` | the engine-audit badge (passed/failed + warnings) | `EntityTable.jsx` |
| `nodes[].country` | sovereign flags + country metadata | see below |

**Precedence:** engine node fields beat `entityReference.json`, exactly as that
file's `_note` anticipates. `entityReference.json` and `allocatorProfiles.json`
are now **legacy fallbacks only** — do not hand-curate new entries for entities
the engine covers. `links[].kind` adds `read_more` (exactly one article per
entity; the label is the publication name).

**Coverage gaps are engine-side.** A target rendering the empty About card
means the engine has not referenced it yet — report it back rather than filling
it in here. The empty state says as much in the UI.

## Editorial layer (what the engine does NOT ship)
The engine ships facts only. Two dashboard-side files carry interpretation and
presentation, and both are keyed by the engine's own ids:

- **`../../../data/flowNotes.json`** — the *read* on a deal: a short `angle`
  kicker plus 2-4 sentences on why the capital moved, keyed
  `"<source id>=><target id>"`. Rendered as "The read" in the flow card and
  labelled as our framing, never as a quote. A flow with no entry falls back to
  `composeRead()` in the adapter, which states only what the entities are.
  **Coverage is partial** — new flows arrive faster than notes are written; the
  fallback is what un-noted flows show.
- **`../../../data/entityReference.json` + `public/logos/`** — who an entity is,
  its links, and its brand mark. Maintained by `scripts/fetch_logos.py`.

### Logo pipeline
```
npm run logos        # only entities missing a logo (incremental, fast)
npm run logos:all    # re-fetch everything, keep the sharpest result
```
It walks **capitalMap.json's node list** (not just the reference file, so new
entities are actually attempted), and for each one:
1. uses a curated website/firm/X link if `entityReference.json` has one;
2. otherwise resolves a domain from the name and **verifies the page identifies
   itself as that entity** before trusting it — generic one-word names need an
   industry keyword too. Resolved sites are written back into
   `entityReference.json` marked `auto_resolved` for review;
3. downloads every candidate and keeps the **sharpest** (SVG wins; otherwise
   largest min(w,h)) — node tiles render ~90px, so a 16px favicon is mush;
4. falls back to the **sponsor's** mark for fund vehicles and JVs
   ("Altimeter Kilauea Fund II, L.P." → Altimeter);
5. leaves anything unverifiable as a monogram tile. A wrong logo is worse than
   no logo.

This runs automatically on every engine delivery — `engine/deliver.py` in the
Capital Flow repo invokes it after copying the new map and includes the results
in the same commit. `run_week.py --no-logos` skips it.

## Reconstruction rules (from the engine handoff)
- **Inclusion:** a node reaches the main map when it carries ≥1
  `verified`/`verified_alpha` flow, or sits in a signalling sector.
  `candidate`-only nodes are "watch / unconfirmed" — off the map behind the
  **Watch** toggle.
- **Emphasis:** node size ∝ `capital`; key-tier allocators marked; sectors
  with a fired signal get a bright frame + a `◆` on the title. The signal's own
  text is in the cluster report, not on the canvas.
- **Staleness:** `stale: true` → de-emphasised (dashed, faded), never deleted
  on sight. The map is cumulative memory.
