# Engine task — sub-sector trend detection with named, grounded narratives

**Paste this into the Capital Flow engine's Claude Code session** (`~/Desktop/Capital Flow`).

## The goal (from the dashboard user)

Today's signals answer "where is capital flowing" at the broad sector/theme level
("10 key allocators into ai-applications"). The ask is a level deeper: **"which
specific narrative within a sector, backed by which named investors, with real
numbers proving it."** Their own example: *"AI application solving B2B for the
health industry, driven by a breakthrough in a research area, key figures Peter
Thiel and [others]."* That is a grounded research synthesis, not a threshold
count — it needs a name, a why, and named evidence, all traceable back to real
flows.

This surfaces as a **`trends[]` block per time window** (7d / 30d / all-time) —
top 1–3 ranked entries per window, engine-authored, dashboard only renders it
(zero data latitude, same as everything else). The 7d/30d/all-time window
structure already exists dashboard-side in `digest.js`; this is a new, separate,
additive field alongside it — nothing there needs to change.

## Design: two stages, not one — "B feeds A"

**Stage B (mechanical, cheap, auditable) finds real repeated clusters. Stage A
(narrative agent) only writes about clusters B already proved are real.** Never
let the narrative agent invent a trend from a single deal or a vibe.

### Why this two-stage split, concretely

We checked the live payload: `subsector` already exists on 153/154 flows
(`ai-drug-discovery`, `legal-regulatory-ai`, `spatial-ai-world-models`, etc.) —
agents are already tagging at close to the right granularity. But it's
**119 distinct values across 154 flows** — almost every flow gets its own
unique tag, so there's essentially nothing for a `sector_swarm`-style rule to
detect convergence on. It's free-text micro-labeling, not a reused taxonomy.
Stage B fixes that; only then does clustering — and the trend Stage A writes
about — mean anything.

## Stage B — stabilize the taxonomy + a mechanical clustering rule

1. **Add a curated subsector taxonomy to `config/rules.yaml`**, one level under
   the existing `sectors:` list — not per-deal free text. Modest, stable buckets
   per sector (the way `sectors:`/`themes:` are curated lists today, not agent
   invention). Research agents must map each flow's `subsector` field into this
   controlled vocabulary going forward (same discipline as `sector`/`theme`
   already require). A one-time reconciliation pass collapses the current 119
   free-text values into canonical buckets (some will legitimately stay
   singleton — that's fine, they just won't cluster yet).

2. **New rule `subsector_swarm`** in `engine/themes.py`, same shape as
   `_sector_swarm` but scoped to `(sector, subsector)` and a lower
   `min_allocators` (sub-buckets are inherently smaller populations — suggest
   `min_allocators: 2`, `allocator_tier: key` — same hardcoded
   `tier IN ('key','core')` pattern the other rules already use). Store
   `evidence` (event ids) exactly like the existing rules already do internally.

3. **Windowing: cluster once, filter per window — don't re-run per window.**
   Don't hardcode `window_days` per rule instance and run it 3× (7/30/all).
   Instead, `subsector_swarm` scans a generous lookback (e.g. all-time or 400d),
   producing `(subsector, sector, event_ids[], dates[], allocator_ids[])` per
   cluster. At **export time**, for each of the three windows (7d / 30d /
   all-time), filter each cluster's evidence to events whose date falls inside
   that window, and **re-check the qualifying bar within that window**
   (`min_allocators` distinct key/core allocators, evidence count) before it's
   eligible to rank in that window. One clustering pass correctly serves all
   three windows; a cluster that only qualifies at the all-time scale won't
   falsely appear as a "7-day trend."

### Addendum — preserve target identity too (unlocks company-level signals)

`stealth_accumulation` and `beneficiary_concentration` already fire *per
company/ticker* in the SQL (`r["target"]`, `r["ticker"]`) — but that identity is
only baked into the free-text description string before being stored; the
`themes` table itself has no structured target/ticker column. Add one (e.g.
`themes.entity_id`) and populate it in every rule function that has a natural
entity anchor. **Export it in the same `target:<name>` id namespace as
`evidence[].target_id` above** — e.g. `"entity_id": "target:Cathedral"` — so the
dashboard attaches the signal to that exact node via its existing `nodeById`
lookup, no new resolution logic. This is what makes a signal attachable to a
specific company/project node on the map, not just a sector zone — a second
dashboard ask from the same conversation, same fix.

## Stage A — the narrative agent

A new agent, `agents/trend-writer.md`, same research/citation discipline as
`agents/allocator-profiler.md`. Runs **only on clusters that already cleared
Stage B's bar** for a given window. Given the cluster's evidence (real event
rows: allocator names, target names, amounts, dates, sources), it writes:

- **A short title** (the narrative label — e.g. "B2B health AI applications")
- **A grounded paragraph** — the "why + who," citing the *actual* named
  allocators and targets from the evidence, not invented ones. If the "why"
  (e.g. "driven by a research breakthrough") isn't directly evidenced by the
  cluster's own flows, either support it with a real cited source or omit the
  causal claim — never assert an unsourced reason.
- **Numbers, not adjectives**: deal count, $ total (confirmed-disclosed only,
  same basis as the rest of the engine), date range, named key allocators —
  exactly the "clear numbers and data proving it" the dashboard asked for.
- Standard confidence discipline: `provisional: true` + a `confidence`/`grade`
  when any part of the narrative isn't directly SQL-provable from the cluster
  evidence itself.

## Ranking — top 1–3 per window, even if borderline

Always attempt to surface the strongest 1–3 clusters per window (ranked by
capital, then allocator count) **even if a window is quiet and a cluster is
below the ideal bar** — but a borderline entry must be explicitly flagged
(`confidence: "low"` or similar), never presented with the same certainty as a
cluster that cleanly cleared the threshold. A window with zero clusters at all
ships an empty `trends[]` for that window — never fabricate one to fill the slot.

## Hard prerequisites (already found this session, blocking this feature too)

This feature is **impossible without both of these** — Stage A cannot name a
single real allocator without them:

1. **Evidence is computed but dropped at export.** `engine/handoff.py`'s
   `SELECT theme, sector, rule, strength FROM themes` never selects `evidence`
   — the event ids that would let anything resolve to real allocator/target
   names are discarded before they ever leave the engine. Full detail + the
   6 affected flows from a related bug: `CAPITAL-FLOW-SOURCE-CITATION-BUG.md`.

   **Exact shape to export (dashboard-usable, no new resolution work needed):**
   don't ship raw SQLite `event.id` integers — the dashboard has no mapping
   from those to anything (`flow.id` is an unrelated sha1 hash it can't be
   reversed from). Instead, resolve each evidence row to the **same canonical
   id namespace already used everywhere else in the payload**
   (`alloc:<name>` / `target:<name>`, e.g. `"alloc:NVIDIA"`,
   `"target:Cathedral"` — exactly what `nodes[].id` already is). Add an
   `evidence: []` array to every signal object in `sectors[key].signals[]`
   and `themes[key].signals[]`:
   ```jsonc
   "evidence": [
     { "allocator_id": "alloc:Andreessen Horowitz", "target_id": "target:Cathedral",
       "amount_usd": 160000000, "date": "2026-07-22", "confirmed": true }
   ]
   ```
   With this, the dashboard resolves a name via its existing `nodeById.get(id)`
   — the same lookup it already does for every flow — zero new plumbing.
2. **Same export path has no `run_week` filter.** `handoff.py` line ~260
   (`SELECT theme, sector, rule, strength FROM themes ORDER BY strength DESC`)
   has no `WHERE run_week = ?`, unlike the correctly-filtered query a few lines
   above it. Only one run week exists in the live DB so far
   (`2026-W33`, confirmed against `db/capital.db`), so this hasn't manifested
   yet — but the next weekly run will ship **every prior week's signals mixed
   with the current one**, with no way to tell which are current. Fix: bind
   the export query to `MAX(run_week)`, mirroring the pattern already used
   correctly for `active_event_ids` a few lines above it. This directly matters
   for trend freshness too — a `trends[]` block is meaningless if it's secretly
   accumulating stale clusters from months ago.

## Export shape (proposed)

```jsonc
// capital_map.json — new top-level block, additive, breaks nothing existing
"trends": {
  "week":  [ { "title": "...", "narrative": "...", "sector": "...", "subsector": "...",
               "deals": 4, "capital_usd": 320000000, "date_range": ["2026-08-04","2026-08-10"],
               "confidence": "high", "provisional": false,
               "evidence": [
                 { "allocator_id": "alloc:Peter Thiel", "target_id": "target:Example Co",
                   "amount_usd": 40000000, "date": "2026-08-06", "confirmed": true }
               ] } ],
  "month": [ ... ],
  "all":   [ ... ]
}
```
Same evidence shape as the "Hard prerequisites" fix above — `allocator_id`/
`target_id` in the existing `alloc:`/`target:` namespace, not names or raw
event ids. `allocators`/`deals`/`capital_usd` are redundant with `evidence`
(the dashboard can derive them) but fine to ship anyway as a convenience.

Keyed to match the dashboard's existing window ids (`week`/`month`/`all` in
`digest.js`) so wiring it in is a direct lookup, no remapping needed.
