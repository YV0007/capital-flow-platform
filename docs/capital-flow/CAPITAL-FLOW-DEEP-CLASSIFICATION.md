# Engine task — deep-classification data for the dashboard's two-rank highlight

**Paste this into the Capital Flow engine's Claude Code session** (`~/Desktop/Capital Flow`).
It asks you to build an agent + schema additions that light up factors the dashboard
already computes but currently has to leave dark.

---

## Context — what the dashboard now does

The dashboard (`ab-investment`) classifies the map into **two independent ranks**, from
the payload you ship (`capital_map.json`). Logic lives in
`src/components/research/capitalflow/classification.js`. Neither rank uses deal size.

- **Rank 1 · Interesting deals** (indexed on the target): flags investable companies
  where smart capital is *starting to stack, early*. Investable gate excludes
  `cls: project/asset`, sectors `datacenters/power-energy/nuclear/neocloud`, and event
  types `project_finance/grant/fund_launch`.
- **Rank 2 · Players worth following** (indexed on the allocator): ranks who to track by
  *judgment*, not AUM.

Several of the strongest factors are **structurally dark** today because the payload
lacks the data to compute them. They are already wired in the dashboard and marked
"pending engine data" — the moment you ship the fields below, they light up with **no
dashboard logic change** (only the CONFIG gate for the new moat factor).

## The four data gaps to close

| Dashboard factor | Rank | Why it's dark today | What you must emit |
|---|---|---|---|
| **Lead-time** + **Bellwether pull** | Players | `co_investors` is a semicolon **string** on one round — no per-backer dates, so there's nothing to order | Explode each round into **dated per-allocator edges** (or a dated `backers[]`) |
| **Strike-rate / realized track record** | Players | Only ~10 profiles carry any return metric; no per-bet outcomes | Per-target **outcome + valuation trail**; per-allocator realized return where knowable |
| **Actionable path** | Deals | No mapping from a private target to something a solo investor can ride | Per-target **listing status + public proxies** |
| **Moat / AI-resilience** | Deals (new) | No signal for "compounds with the frontier" vs "replacement risk" | Per-target **`ai_posture`** controlled tag + rationale |

---

## Build: `agents/deal-classifier.md` (new research agent)

A research agent, same shape and sourcing discipline as `agents/allocator-profiler.md`.
For each **investable** target already in the DB (skip `cls: project/asset` and the
excluded sectors above), research and emit the fields below. Reuse the existing
confidence/grade + source-tier system; **cite every field**, prefer Tier-1 (SEC/IR),
mark anything unconfirmed `provisional: true`, and **never overwrite a verified value
with a weaker one** (mirror `engine/ingest.py` merge rules).

Run it after ingest, before `handoff.py`. Cache by the stable target id so a re-run is a
cheap delta, not a rewrite.

### 1. Dated backers (unlocks lead-time + bellwether)

The single highest-value change. For every funding round, resolve each named participant
to a known allocator and emit **one dated edge per participant**, rather than burying them
in `co_investors`. Where a participant's exact entry date is unknown, use the round's
disclosed date and set `provisional: true`.

```jsonc
// flows[] — one object PER participating allocator per round (not one round with a string)
{
  "source": "alloc:Thrive Capital",
  "target": "Chai Discovery",
  "event_type": "funding_round",
  "round_id": "chai-series-a-2026-05",   // NEW: groups co-participants of one round
  "role": "lead",                         // NEW: lead | co-lead | participant | follow-on
  "date": "2026-05-14",                   // that allocator's entry (round date if unknown)
  "amount": 30000000,
  "status": "verified",
  "source_tier": 1,
  "source_url": "https://…",
  "provisional": false
}
```

Keep the human-readable `co_investors` string too (the panel still shows it), but the
**dated edges are what the ranker reads.** With them, the dashboard computes, per player:
who entered a name *before* the crowd (lead-time) and how many quality backers followed
*after* them (bellwether) — the true "worth following" spine.

### 2. Target outcome + valuation trail (unlocks strike-rate)

```jsonc
// nodes[] target — NEW block
"outcome": {
  "status": "active",                 // active | up_round | ipo | acquired | shut_down
  "entry_valuation_usd": 1500000000,  // earliest tracked round post-money
  "latest_valuation_usd": 6000000000, // most recent post-money / market cap / deal price
  "latest_as_of": "2026-07-01",
  "step_up_multiple": 4.0,            // latest ÷ entry, when both known
  "source_url": "https://…",
  "provisional": false
}
```

The dashboard already reads allocator `track_record` return metrics; add per-allocator
**realized return** rows where a fund reports them, and it will fold portfolio step-ups
into strike-rate. (A follow-on into a name a player already backed is a survival signal
the dashboard can infer from the dated edges above — no extra field needed.)

### 3. Listing status + public proxies (unlocks actionable-path)

```jsonc
// nodes[] target — NEW block
"investability": {
  "listing_status": "private",        // public | filed_s1 | rumored_ipo | private | subsidiary
  "public_ticker": null,              // set when the target itself is/*becomes* public
  "public_proxies": [                 // public names a solo investor can ride to get exposure
    { "ticker": "NVDA", "relation": "key_supplier", "source_url": "https://…" },
    { "ticker": "MSFT", "relation": "strategic_backer", "source_url": "https://…" }
  ]
}
```

The dashboard's "actionable path" factor becomes: `public` → full; a credible
`public_proxies`/`filed_s1`/`rumored_ipo` → partial; nothing → base.

### 4. `ai_posture` — moat / AI-resilience (unlocks a NEW deal factor)

A small **controlled vocabulary**, each with a one-line cited rationale. This is the
factor the user cares most about — "grows *with* the frontier vs gets replaced."

```jsonc
// nodes[] target — NEW block
"ai_posture": {
  "class": "compounds",   // compounds | neutral | at_risk
  "rationale": "Proprietary wet-lab data + workflow lock-in compound as models improve; not replaced by them.",
  "source_url": "https://…",
  "confidence": "B2",
  "provisional": false
}
```

Definitions to hold the line on:
- **compounds** — improves as frontier models improve (proprietary data/distribution/
  workflow moat, picks-and-shovels to the buildout, or a system-of-record that gets more
  valuable with better AI).
- **at_risk** — a thin wrapper whose core value a frontier model subsumes.
- **neutral** — orthogonal to frontier progress.

---

## Contract / handoff notes

- Add the new fields to `engine/handoff.py` node/flow assembly and document them in the
  `capital_map.json` CONTRACT header the dashboard mirrors (`src/data/capitalMap.js` top).
- Update `DASHBOARD_UPDATE` handoff notes so the dashboard session knows the new fields
  landed and can flip the pending factors on (and add `ai_posture` to the deal factor set
  + a CONFIG weight).
- Everything additive and back-compatible: the dashboard tolerates missing blocks (factors
  stay "pending"), so ship incrementally — **dated backers first** (biggest unlock),
  then `ai_posture`, then outcomes, then proxies.
- Determinism: cite sources, grade confidence, `provisional` on anything unconfirmed,
  and never downgrade a verified field. Keep it reproducible across runs.
```
