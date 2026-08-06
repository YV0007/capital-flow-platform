# Capital Flow Map — Dashboard-side Handoff (consumer → engine)

**From:** ab-investment (the React/Vite dashboard on Vercel)
**To:** the Capital Flow engine chat/repo
**Date:** 2026-08-06
**Status:** ✅ Built, verified in-browser, `npm run build` passes. Not yet committed/pushed.

This is the return handoff. You sent `DASHBOARD_BRIEF.md`; this reports **what the
dashboard now does, exactly how it reads your file, and what would light up more of
the UI on the next run.** Read §4 and §6 — that's where you can act.

---

## 1. What was done

The old hand-authored Capital Flow Map (`src/data/capitalFlowData.js` + its
components, schema = groups / tiers 1–3 / deal-types / prose) has been **deleted and
rebuilt** as a pure consumer of your contract. The map now renders
`src/data/capitalMap.json` end-to-end with **zero data latitude** — every entity,
amount and status on screen comes straight from your file; nothing is invented,
nothing is overridden, nothing is hard-coded. Swap in next week's file and the map
changes with **no code edit**.

First render used your actual first-run file (46 nodes, 33 flows, 10 sectors,
`generated: 2026-08-06`). It was copied verbatim from
`~/Desktop/Capital Flow/handoff/capital_map.json` → `src/data/capitalMap.json`.

### Files (dashboard side)
- `src/data/capitalMap.json` — **the contract drop.** Your file lands here.
- `src/data/capitalMap.js` — the adapter: imports the JSON, defines the meta/colour
  maps, and reshapes it into the render graph (`buildGraph`, `buildAdjacency`).
- `src/components/research/capitalflow/` — `CapitalFlowMap.jsx` (shell),
  `FlowGraph.jsx` (canvas), `layout.js`, `FilterBar.jsx`, `Legend.jsx`,
  `EntityPanel.jsx`, `FlowDetailCard.jsx`, `format.js`, `README.md`.

---

## 2. Delivery / update mechanism (unchanged from your §5.3 — confirmed working)

```
engine  →  handoff/capital_map.json  →  cp to  ab-investment/src/data/capitalMap.json  →  npm run build  →  push  →  Vercel redeploy
```

To refresh the live map:
```bash
cp ~/Desktop/"Capital Flow"/handoff/capital_map.json \
   ~/Desktop/BASE/Code/ab-investment/src/data/capitalMap.json
cd ~/Desktop/BASE/Code/ab-investment && npm run build   # must pass, then commit + push
```
A user-dropped `capital_map.json` overwrites the same path and renders identically.
The component imports at build time — **there is no runtime fetch**, so a data change
needs a rebuild/redeploy (this is the agreed v1 behaviour).

**Contract stability matters:** the dashboard keys off the exact field names and enum
values below. Renaming a field or introducing a new enum value the dashboard doesn't
know about will degrade gracefully (unknown event types fall back to a grey "equity"
edge, unknown classes to a neutral colour) but won't be styled intentionally. If you
add enum values, tell this side so we add the colour/label.

---

## 3. How each field is consumed (the field → UI contract)

### `generated`
- Rendered as the **"AS OF <date>"** stamp next to the title and the
  **"ENGINE DATA · <date>"** chip bottom-right. This is how the user knows the data date.

### `totals`
- Not directly displayed; the dashboard recomputes counts from `nodes`/`flows` so the
  header stats always match what's actually on screen. Keep `totals` accurate anyway
  (used as a sanity check).

### `nodes[]`
| field | how it's used |
|---|---|
| `id` | identity + edge wiring. Convention `alloc:<name>` / `target:<name>` respected. |
| `label` | display name (blocks, panels, search). |
| `kind` | `allocator` → source side (left), hollow role-dot, "deploys"; `target` → sink side (right), filled role-dot, "receives". |
| `cls` | **allocator** → node colour + block shape (capsule) + class filter; **target** → block shape (private/public=block, project/asset=sharp plate, fund=capsule). |
| `sector` | **targets only** → which sector **cluster zone** the node lives in (the whole right-side layout). Allocators carry `null` and are grouped by `cls` on the left instead. |
| `tier` | `key` → gold marker on the block + "Key allocator ★★★" badge; `watch` → "Watchlist ★★"; `null` → nothing. Allocators only. |
| `capital` | **node size** (4 tiers; top 2 print the $ inside the block) + zone IN/OUT aggregates + the "Capital" stat in the panel. This is the authoritative size driver (not summed amounts, since some flows are undisclosed). |
| `deals` | shown in the entity panel + hover. |
| `first_seen` / `last_activity` | the "ACTIVE <first> → <last>" strip in the panel + hover. |
| `stale` | `true` → node **de-emphasised** (dashed border, faded, "COOLED · 180d idle" badge). Never hidden/deleted on sight. |

### `flows[]`
| field | how it's used |
|---|---|
| `source` / `target` | the edge (allocator → target), arrow points to target. |
| `sector` | tag on the flow-detail card. |
| `event_type` | **edge colour** (grouped into 6 families, see §5) + the event tag + legend. |
| `amount` | **edge thickness** + the $ figure. `null` → rendered as **"Undisclosed"** / "—", edge falls to floor width, and the flow drops out once a min-size filter is set. |
| `status` | **confidence styling**: `verified` = solid green, `verified_alpha` = amber **short-dash**, `candidate` = grey **long-dash** + the confidence chip. Also drives the **inclusion rule** (below). |
| `date` | shown on the edge tooltip / panel / card. |
| `tier` (1–5) | source tier → "Tier 1 · SEC / official" line on the flow-detail card. **This is the flow's _source_ tier — distinct from a node's allocator `tier` (key/watch).** Keep them separate. |

### `sectors{}`
| field | how it's used |
|---|---|
| `deals` / `capital` / `allocators` | sector filter tooltips + zone stats. |
| `signals[]` | **the alpha.** A non-empty array → that sector's zone gets a **bright frame + `◆ <theme>` badge**, and every entity in it is force-included on the main map (even candidate-only). Empty → normal. Header shows a "<n> signals" counter when any fire. |

---

## 4. Behaviours that depend on YOUR data (so you can predict the UI)

- **Inclusion rule (main map vs "Watch"):** a node reaches the main map if it has
  **≥1 `verified` or `verified_alpha` flow**, OR sits in a **signalling** sector.
  `candidate`-only nodes are **hidden by default** behind a **"Watch" toggle**
  (muted/unconfirmed). In your first file this hid **20 of 46 entities** and 14
  candidate flows → the default view shows **26 entities / 19 flows**; Watch reveals
  **46 / 33**. So: the more you promote leads from `candidate` → `verified_alpha` →
  `verified`, the more of the map surfaces by default.
- **Staleness:** `stale:true` cools a node (never deletes). Your rule "drop only after
  two consecutive stale handoffs + no verified flow" lives on **your** side — the
  dashboard just renders whatever `stale` you send and keeps everything you send.
- **A deal = multiple flows:** handled. Several allocators into one round render as
  several edges into one target; the target's inbound list shows each allocator.

---

## 5. `event_type` → edge-family mapping (current)

Six colour families. If you add an `event_type`, it falls back to the grey "equity"
family until we map it.

| family (colour) | event_types |
|---|---|
| Equity / rounds (violet) | `equity`, `minority_stake`, `funding_round`, `corporate_investment`, `follow_on` |
| Project finance (gold) | `project_finance` |
| Acquisition (mauve) | `acquisition` |
| Fund / SPV (green) | `fund_launch`, `spv` |
| Grant (slate) | `grant` |
| Sovereign (bronze) | `sovereign_investment` |

---

## 6. What would light up more of the UI next run (actionable for the engine)

Everything below is **already supported** on the dashboard and just waiting for data:

1. **Signals are empty (`sectors[x].signals == []` for all 10).** This is the single
   biggest dark spot — the whole sector-highlight system (bright frame + `◆` badge +
   force-inclusion + header counter) is built and idle. As soon as your rules fire
   (`sector_swarm`, `acceleration`, `first_entry`, …) they'll render with no code
   change. Confirm the shape is `{ theme, rule, strength }` — that's what we read
   (`theme` is shown as the badge text).
2. **Two canonical sectors never appear:** `semiconductors` and `fab-equipment` have
   no nodes in this file. The dashboard supports all 12; when you have events there,
   their zones appear automatically.
3. **Staleness untested in the wild:** every node is `stale:false` right now. The
   cooled-state styling is implemented but unverified against real `stale:true` data —
   send some when you have them and we'll confirm.
4. **Undisclosed amounts:** 2 flows have `amount:null`; handled ("Undisclosed"). Fine
   as-is — just flagging it's exercised.
5. **Allocator `tier` distribution:** 14 `key`, 9 `watch`, 23 `null` (targets). Good
   spread. Targets correctly carry `tier:null`.
6. **Source `tier`:** only values `1` and `3` seen. We label 1–5
   (1 SEC/official … 5 single-source). Any value renders.

---

## 7. Definition-of-done (your §7) — status

- ✅ Old hand-authored map removed; new component mounted in the same Research slot
  (`ResearchDetail.jsx` → `<CapitalFlowMap>` unchanged).
- ✅ Renders `capitalMap.json` end-to-end: sector-zone nodes, event-typed flows,
  status-based confidence styling, signal-highlight infra, click-through entity/flow
  panels, filters (sector · class · tier · event · confidence · min-size), Watch
  toggle, generated-date stamp.
- ✅ Nothing hard-coded — next week's file changes the map with no code edit.
- ✅ `npm run build` passes. Dark-mode only.
- ⏳ Not yet committed/pushed (waiting on the user).

---

## 8. One thing to keep aligned

The **research-library card** (`src/data/research-library.json`, the cover in the
Research index) carries its own `companyCount` / `sectionCount` / `dateCompleted`.
These were set to 46 / 33 / 2026-08-06 to match this file, but they are **manual** and
will drift each cycle. Low priority, but if you want them auto-synced we'd need a small
build step that reads `capitalMap.json` — say the word.

**Bottom line for the engine side:** the contract is honoured exactly as specified;
the highest-leverage thing you can do next is **fire signals** and **promote candidate
leads to verified**, both of which visibly change the default map with zero dashboard
work.
