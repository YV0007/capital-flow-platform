# Follow-up — finish Stage A (the trend narrative writer)

**Paste this directly into the Capital Flow engine's Claude Code session** (`~/Desktop/Capital Flow`).

---

Good work on the first delivery (commit `7869f55`, "sub-sector trends + signal
evidence") — Stage B is working: real clusters, correct evidence, sensible
sector/subsector tagging. Confirmed live on the dashboard.

But every trend shipped with **`"narrative": null`**. That means only Stage B
(mechanical clustering) ran — **Stage A, the narrative-writing agent, was never
built or never run.** That's the actual point of this feature: a "sector →
thesis" paragraph, not just a bare title and numbers. Please finish it now.

## What to build

1. **Create `agents/trend-writer.md`** — same research/citation discipline as
   `agents/allocator-profiler.md`. It runs **only** on clusters Stage B already
   qualified (the ones now shipping with real `evidence`/`deals`/`capital_usd`)
   — never invents a trend from scratch, never runs on a cluster that didn't
   clear the bar.

2. **For each qualifying cluster, write:**
   - A short **title** (you're already generating these — e.g. "Defense
     Manufacturing" — keep that part)
   - A grounded **narrative paragraph** — the "why + who." Cite the *actual*
     named allocators/targets already in that cluster's evidence, not invented
     ones. If you can't source *why* the cluster is happening (e.g. "driven by
     a research breakthrough") from a real citation, either support the claim
     with one or drop the causal framing entirely — never assert an unsourced
     reason.
   - Populate the existing `narrative` field with that paragraph. Everything
     else in the schema (`title`, `sector`, `subsector`, `deals`,
     `capital_usd`, `date_range`, `allocators`, `evidence`, `confidence`,
     `provisional`) is already correct — don't change the shape, just stop
     leaving `narrative` null.

3. **Confidence discipline stays**: if any part of the narrative isn't
   directly provable from the cluster's own evidence, mark `provisional: true`
   and set `confidence: "low"` — the dashboard already renders a "Слабый
   сигнал" flag for exactly this case, so a weaker cluster can still ship
   without overstating certainty.

## One optional cleanup (not blocking)

`evidence` currently ships as raw integers (e.g. `[123, 124]`) instead of the
`{allocator_id, target_id, amount_usd, date, confirmed}` shape using the
`alloc:`/`target:` id namespace I originally asked for in
`CAPITAL-FLOW-TREND-DETECTION.md`. The dashboard has a working fallback (uses
the plain-name `allocators[]` array instead), so this isn't urgent — but
switching to the id-based shape would let evidence resolve directly to node
links instead of going through the name-lookup fallback. Fix if convenient
while you're in this code; skip if not.

## Full context

Original spec, still accurate except for the narrative gap above:
`CAPITAL-FLOW-TREND-DETECTION.md` (same repo root as this file).
