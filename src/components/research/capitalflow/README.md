# Capital Flow Map

A **full-screen, clustered capital-flow graph** of who sends money to whom
across AI, semiconductors, infrastructure and energy. Data tracker, not a
thesis — every claim on screen comes from a row in the dataset.

Live at **Research → Capital Flow Map**. Mirrors the shared research spec
("Capital Flow Map — Research Specification"): the ~47-entity watchlist plus
the three signal tiers.

---

## Files

| File | Role |
|---|---|
| `src/data/capitalFlowData.js` | **The only file you edit to add data.** Entities (group + tier + watchlist), flows, colour vocabulary, `buildGraph()`. |
| `CapitalFlowMap.jsx` | Full-screen shell. Owns all state, filter semantics, floating top bar, search, disclaimer. |
| `FlowGraph.jsx` | The canvas: custom cluster/collide forces, region captions, node/edge painting, tooltips. |
| `FilterBar.jsx` | Floating filter drawer (tiers · groups · deal types · min flow). |
| `Legend.jsx` | Encoding key + interaction hints, bottom-left. |
| `EntityPanel.jsx` | Right slide-in: tier badge + inbound/outbound breakdown with % shares. |
| `FlowDetailCard.jsx` | Bottom card: one flow's full deal detail. |
| `format.js` | `fmtUSD`, node/edge scales, status + confidence vocab. |

---

## Layout engine (not a plain force graph)

Three custom d3 forces build a deliberate "capital geography":

- **clusterForce** pulls each node toward its group's `anchor` (defined in
  `GROUP_META`): funds/sovereigns left → labs centre → hyperscalers top →
  silicon right → fab equipment far right → power/projects at the bottom.
  Money reads left-to-right: allocators → demand → physical bottlenecks.
- **collideForce** keeps nodes (and their labels) from overlapping.
- Links are deliberately weak (`strength 0.028`) so cross-cluster flows bend
  between regions instead of dragging them together.

Each region gets a faint tinted halo + uppercase caption painted under the
nodes. Node seed positions are deterministic (hash jitter around the anchor),
so the layout is stable across reloads. To move a whole region, edit its
`anchor` in `GROUP_META` — nothing else needs touching.

---

## Data model

### Entity

```js
{
  id: 'nvidia',                 // unique slug — referenced by flows
  name: 'NVIDIA',
  type: 'both',                 // 'player' (deploys) | 'target' (receives) | 'both'
  group: 'silicon',             // key of GROUP_META → cluster region + colour
  tier: 1,                      // 1|2|3|null — signal tier from the research spec
                                //   1 = Capital Allocators ★★★★★
                                //   2 = Ecosystem Builders ★★★★
                                //   3 = Bottleneck Owners ★★★
                                //   null = context entity, or watchlist entity
                                //   not yet tier-assigned (AMD, KKR, Altimeter)
  watchlist: true,              // in the spec's tracked universe vs context node
  sector: 'Semiconductors',
  description: '…',             // its ROLE IN THE FLOW OF MONEY, 1–2 sentences
}
```

`totalInflow/Outflow`, `degree`, `flowShare` are **computed** in `buildGraph()`.

### Flow

```js
{
  id: 'nvda-openai',
  source: 'nvidia',             // money LEAVES here
  target: 'openai',             // money ARRIVES here
  amountUSD: 100_000_000_000,
  dealType: 'Equity',           // key of DEAL_TYPE_META → edge colour
  date: '2025-09',              // ISO, 'YYYY-Qn', or a range '2019–2025'
  holdingPeriod: '…',           // optional
  reasoning: '…',               // WHY the money moved — the most valuable field
  keyMetrics: '…',              // optional
  status: 'Announced',          // 'Announced' | 'Active' | 'Closed'
  confidence: 'reported',       // 'reported' (disclosed) | 'estimate' (derived)
  sourceNote: '…',              // provenance in plain words
}
```

Circular relationships (NVIDIA invests in OpenAI, OpenAI buys NVIDIA systems)
are two separate flows in opposite directions — the map fans them apart.

---

## Adding data

1. Append the entity to `ENTITIES` (pick `group`, `tier`, `watchlist`).
2. Append one row per capital movement to `FLOWS`.
3. Reload. Everything derives: totals, sizes, cluster placement, legend
   counts, filters, search, both panels.

Unknown entity ids in a flow are skipped with a console warning (no ghost
nodes). New groups/deal types: add a key to `GROUP_META` / `DEAL_TYPE_META`
with a colour, blurb and (for groups) an anchor.

---

## Visual encoding

| Channel | Meaning |
|---|---|
| Node colour | group (funds gold, labs violet, hyperscalers sky, silicon indigo…) |
| Filled disc | receives capital · **hollow** = deploys · **+ring** = both |
| Node radius | total capital in + out, √-scaled, tight range |
| Edge colour | deal type · thickness = amount (√) · arrowhead = direction |
| Particles | animate only on the selected neighbourhood |
| Labels | **screen-constant size** (never scale up with zoom); Tier-1/2 always named, the rest appear as you zoom |
| Region captions | group anchors, painted under the nodes |

## Filter semantics

- **Tier** and **Group** select *entities*; **Deal type** and **Min flow**
  select *flows*. A flow shows when it passes the flow filters AND touches ≥1
  selected entity — so "Hyperscalers" surfaces them *and* their counterparties.
- **Selection** (click node/edge) is a separate layer: dims everything outside
  the neighbourhood, cleared with Esc / background click. Drag pins a node.

## Honesty rules

Every flow carries `confidence` — `'reported'` only when the number itself was
disclosed; `'estimate'` for anything assembled from analyst figures or capex
modelling. The disclaimer chip shows the reported share; each deal card is
tagged. Keep `sourceNote` filled in — it is the map's only provenance.
