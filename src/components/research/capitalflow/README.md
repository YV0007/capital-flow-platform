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
- `FlowDetailCard.jsx` — per-flow detail (event, sector, date, confidence,
  source tier).
- `Legend.jsx`, `format.js` — key + shared formatters.

## Reconstruction rules (from the engine handoff)
- **Inclusion:** a node reaches the main map when it carries ≥1
  `verified`/`verified_alpha` flow, or sits in a signalling sector.
  `candidate`-only nodes are "watch / unconfirmed" — off the map behind the
  **Watch** toggle.
- **Emphasis:** node size ∝ `capital`; key-tier allocators marked; sectors
  with a fired signal get a bright frame + `◆ signal` badge.
- **Staleness:** `stale: true` → de-emphasised (dashed, faded), never deleted
  on sight. The map is cumulative memory.
