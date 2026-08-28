# Engine task — edge orientation and coverage in `ecosystem_map` / `ai_ecosystem_network`

**Paste this into the Capital Flow engine's Claude Code session** (`~/Desktop/Capital Flow`).

Context: the dashboard now computes a single **systemic weight** per entity —
a dependency-graph PageRank over `ai_ecosystem_network.json`, replacing the
three separate numbers (criticality / gravity / centrality) the entity panel
used to print. Building it meant orienting every edge as *"A leans on B"*, and
that pass surfaced three problems in the payload. None of them break the
dashboard — it works around all three — but the workaround lives in
`src/data/ecoWeight.js` and should not have to.

Nothing here asks for a schema change. `ai-ecosystem-network/2` stays frozen.

---

## 1. Control-family edges are oriented inconsistently (highest priority)

Four types encode a gate: `controls_access_to`, `export_controlled_by`,
`subject_to_restriction`, `geopolitically_dependent`. The verb in
`EDGE_TYPE_META` reads `source → verb → target`, but the payload does not follow
it consistently:

```
bis      —export_controlled_by→      nvidia     verb says BIS is controlled BY NVIDIA (wrong way round)
taiwan   —geopolitically_dependent→  tsmc       verb says Taiwan depends on TSMC (wrong way round)
japan    —geopolitically_dependent→  shin-etsu  same
china    —subject_to_restriction→    nvidia     ┐ the SAME relation, stated
nvidia   —subject_to_restriction→    china      ┘ in both directions, twice
usa      —controls_access_to→        bis        this one reads correctly
```

Read literally, half of these say the state is the dependent party. A consumer
that trusts the verb gets Taiwan, BIS, the Netherlands and CHIPS Act pushed to
the bottom of any dependency ranking, which is the opposite of the truth.

**The dashboard's workaround:** for these four types it ignores the verb and
orients by role — the side with `role === "state"` is the gate, the other side
depends on it. That fixed the ranking (Taiwan 38 → 64, BIS 38 → 54), but it
guesses where both sides are states, and it will silently mis-handle a
non-state gatekeeper (a standards body, a consortium, an export regime modelled
as `type: "policy"`).

**Asks:**
1. Pick ONE canonical direction per type and re-emit the affected edges. The
   natural reading of each verb is the simplest rule: `A —export_controlled_by→ B`
   means *A's exports are controlled by B*, so the state belongs in **target**.
   Whichever convention you pick, state it in `eco-CONTEXT.md` and make
   `eco_ingest` reject rows that violate it.
2. `china ↔ nvidia` on `subject_to_restriction` is a genuine contradiction —
   the same relation asserted in both directions. Keep one.
3. Same duplicate on `mlcommons ↔ nvidia` / `sets_benchmark`. Keep one.

---

## 2. Near-monopolists are modelled with one inbound edge

The metric's honest failure mode: an entity's weight is only as big as the map
says its dependents are. These are all rated 74–83 on criticality and carry
**one or two** modelled dependents in the whole 262-edge file:

| entity | criticality | dependents in the map | edges that are real and missing |
|---|---|---|---|
| ASML | 82 | 1 (TSMC only) | Samsung, Intel, SK Hynix, Micron all buy EUV/DUV |
| Synopsys | 83 | 1 | NVIDIA, AMD, Broadcom, Apple silicon all run its EDA |
| Cadence | 80 | 2 | same set |
| SK Hynix | 74 | 1 | HBM into NVIDIA is modelled; AMD, the hyperscalers are not |
| BIS | 82 | 1 | export licences reach AMD, Intel, the Chinese labs |
| NCCL | 75 | 2 | every multi-GPU training stack |
| Нидерланды | 76 | 2 | the ASML licence regime reaches every fab customer |

This is the map under-modelling, not the metric mis-scoring, and the dashboard
now says so out loud — ASML reads *«на неё опирается 1 сущность»* on screen.
Worth an agent pass aimed specifically at **inbound** edges for the L1–L3
tool/EDA layer and the L0 control layer: the watchlist is clearly biased toward
"who does NVIDIA depend on" and thins out fast one hop away from the anchor.

---

## 3. Two orientations worth a second look

Lower confidence, flagging rather than asserting:

* `arm —standardizes_on→ kubernetes` — reads as "Arm is standardised on
  Kubernetes". Plausible only in a narrow sense; check the underlying quote.
* `arm —path_dependent_on→ nvidia` — Grace/Grace-Hopper makes this defensible,
  but paired with `arm —supplies→ nvidia` and `nvidia —diversifies_supply→ arm`
  the trio should be reviewed as a set.
* `fabrinet —integrates→ nvidia` gives Fabrinet a weight of 49 against a
  criticality of 37 — the metric says the map treats it as more load-bearing
  than the rubric does. Probably correct; noting it so it is a decision.

---

## 4. What the dashboard still needs from every payload

Unchanged, but now load-bearing in a new way — the weight metric reads these
fields directly, so a missing one silently degrades the score rather than
blanking a panel row:

`strength`, `lockInDepth`, `substitutability`, `confidence`, `status` on every
edge; `criticality` and `centrality.betweenness` on every entity.

`gravity{}` and `centrality.degree` / `centrality.pagerank` are **no longer
rendered anywhere** in the dashboard — they were the two blocks this metric
replaced. Keep shipping them if they cost nothing (the changelog and the layer
report still read `gravity`), but there is no reason to invest further in
gravity's composite `score`: the dashboard does not display it.

---

## 5. Optional, and it would delete code here

If the engine emitted, per edge, a normalised
`dependency: { from: "<id>", to: "<id>", class: 0.0–1.0 } | null`
— *who leans on whom*, with `null` for rivalry edges — the dashboard could drop
its 33-row orientation table entirely and just read it. The engine is where the
quote is, so it is where the direction is actually known. Not urgent; the table
works. But it is the one place where the dashboard is currently re-deriving
something the engine already had in hand.
