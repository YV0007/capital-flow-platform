---
name: capital-flow-reads
description: >
  Generate the dashboard-owned deal "read" for Capital Flow. Run WEEKLY, after a
  new src/data/capitalMap.json has been delivered. Writes a short interpretive
  angle + read for every flow that doesn't have one yet, cached by the engine's
  stable flow.id, from the payload ONLY (never the web). Use when: "generate the
  reads", "write the deal reads", "fill flow reads", or as the weekly Capital
  Flow read step.
---

# Capital Flow — deal-read generation (weekly)

## What this is and the one rule

The **read** is the dashboard's own NARRATIVE — the "why did this capital move"
that the engine deliberately never writes (keeping the engine's output 100%
verifiable is the whole product). You write it **from the payload only**. Do
**not** search the web or invent any fact that isn't in the brief. Every read is
labelled in the UI as *«наша трактовка · не данные движка»* — that's true
precisely because you wrote it.

It is cached against the engine's stable **`flow.id`**, so you only ever write a
read once per deal; unchanged deals are never re-worded.

## Steps

1. **See the gap:**
   ```bash
   npm run reads:stats
   ```

2. **Get the briefs** for flows with no read yet (largest deals first):
   ```bash
   node scripts/generate_reads.mjs briefs --all > /tmp/cf_briefs.json
   ```
   Each entry is `{ id, brief }`. The brief carries everything you may use:
   amount (+ `amount_estimated`), `round_total`, `event_type`, `instrument`,
   `capital_role`, `stage`, `sector`/`subsector`, `status`, `confidence`, `date`,
   `co_investors`, the allocator (name, class, country, thesis/style/focus) and
   the target (name, class, description).

3. **Write a read per id.** Produce a JSON object `{ "<flow.id>": { "angle": …,
   "read": … } }` covering every brief. In **Russian**, to match the UI.
   - **angle** — a sharp kicker, ≤ ~6 words (e.g. «Владеть заводом, а не арендатором»).
   - **read** — 2–3 sentences on WHY the capital moved: what the allocator's
     thesis/style implies, what the target is, what the structure means
     (lead vs participant, own-balance-sheet vs off-balance-sheet, fund_launch =
     dry powder not a deal, follow_on = re-up). Ground every clause in the brief.
   - Be honest about `status: candidate` (структура ещё оформляется) and
     `amount_estimated` (оценка приблизительная). Never state a fact the brief
     doesn't contain. No web.

4. **Save + deploy:**
   ```bash
   node scripts/generate_reads.mjs save /tmp/cf_reads.json   # merges by flow.id
   npm run build                                             # build-gate; do NOT commit if it fails
   git add src/data/flowNotes.json && git commit -m "Capital Flow: generate deal reads (<week>)" && git push
   ```
   Vercel auto-deploys on push. `save` is idempotent and preserves existing reads.

## Boundaries
- Payload only. No external fetch, ever.
- Never edit engine facts (amounts, status, sources, profiles). You only add
  `angle`/`read` to `src/data/flowNotes.json`.
- If a brief is too thin to say anything true, skip it — the UI falls back to a
  composed line. An honest gap beats an invented read.
