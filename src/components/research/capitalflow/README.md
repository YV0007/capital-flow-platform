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
  colour = event family, dash = confidence, arrow = direction.
- `CapitalFlowMap.jsx` — the section shell: top bar (generated stamp + live
  stats), filters, watch toggle, legend, selection panels.
- `FilterBar.jsx` — sector · class · tier (entities) + event · confidence ·
  min-size (flows).
- `EntityPanel.jsx` — per-entity breakdown (who invests / where money goes).
- `AllocatorDeepDive.jsx` — the "Detailed breakdown" view, **allocators only**:
  background/thesis, latest-investments decision logic (derived strictly from
  tracked flows), track record by fiscal year + YTD (always flagged
  provisional), and source-attributed strategy. Canonical summaries come from
  a `profile` object on the node (engine-emitted, wins) or
  `../../../data/allocatorProfiles.json` (payload sidecar); anything missing
  renders an honest "no data" state — never estimated dashboard-side.
- `RosterTable.jsx` — the tracking roster: table view of the whole tracked
  universe (Roster toggle in the top bar). Each row labels the entity and the
  dimension monitored (investor deploying vs company/fund/project receiving);
  sortable columns, kind chips, search-filtered, watchlist-aware. Row click
  jumps to the map with the entity selected.
- `useWatchlists.js` + `WatchlistControl.jsx` — named, saved, cross-entity
  watchlists (localStorage `cfm:watchlists:v1`). Add/remove from the entity
  panel bookmark or a roster row; activating a list from the top-bar selector
  narrows map + roster to its members (their direct counterparties stay
  visible so the subset remains navigable).
- `FlowDetailCard.jsx` — per-flow detail (event, sector, date, confidence,
  source tier).
- `Legend.jsx`, `format.js` — key + shared formatters.

### National affiliation (sovereign flags)
Government / sovereign allocators render their country flag as the node icon
(`public/flags/<cc>.png`, pre-fetched like logos) so national capital sources
read instantly. `country` on a node (engine-emitted) wins; the curated
fallback lives in `entityReference.json` (`country` + `countryLabel`).

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
  with a fired signal get a bright frame + `◆ signal` badge.
- **Staleness:** `stale: true` → de-emphasised (dashed, faded), never deleted
  on sight. The map is cumulative memory.
