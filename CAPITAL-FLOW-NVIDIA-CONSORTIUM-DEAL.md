# Engine ask — capture the NVIDIA × 6 alt-managers AI-infra financing consortium

**Paste this into the Capital Flow engine's Claude Code session** (`~/Desktop/Capital Flow`).

## The deal

**2026-08-11** — NVIDIA CEO Jensen Huang announced a partnership with **Apollo,
BlackRock, Blackstone, Brookfield, Goldman Sachs, and KKR** to build
"independent financial platforms" targeting **$500B+ of third-party capital**
for AI infrastructure — a shift from one-off chip purchases/datacenter
projects to financing "AI factories" as repeatable, institutionally-funded
infrastructure.

**Primary source** (already vetted, used verbatim in the Holdings news feed):
`https://x.com/jensenhuang/status/2086934705207959965?s=46`

This is **not yet in `capital_map.json`** — checked directly, no flow from any
of the six managers references this. Makes sense: it's dated the same day as
the last delivery's `generated: 2026-08-11`, right at the cutoff.

## Coverage gap: 2 of 6 managers aren't tracked allocators at all

| Manager | Tracked today? |
|---|---|
| KKR | ✅ `alloc:KKR` |
| BlackRock | ✅ `alloc:BlackRock` |
| Blackstone | ✅ `alloc:Blackstone` |
| Brookfield | ✅ `alloc:Brookfield` |
| **Apollo** | ❌ not in `config/allocators.yaml` |
| **Goldman Sachs** | ❌ not in `config/allocators.yaml` |

Add Apollo and Goldman Sachs to the allocator watchlist (`alt_manager` class,
suggest `tier: key` given they're both major AI-infra capital sources) — they
belong regardless of this one deal.

## How to model it — genuinely ambiguous, your call, but a few notes

This isn't a normal single source→target funding round: **NVIDIA isn't
disclosed as the capital source** here (it's the strategic anchor/partner, not
necessarily writing an equity check), and the $500B is an **aggregate target
across all six managers, not a disclosed per-manager amount**. Three honest
ways to shape it — pick whichever fits your schema best:

1. **One `fund_launch` flow per manager** (`alloc:Apollo/BlackRock/Blackstone/
   Brookfield/Goldman Sachs/KKR` → a shared new target node, e.g.
   `target:NVIDIA AI Infrastructure Financing Platform`), `amount: null`
   (undisclosed per-party), `round_total: null` (the $500B is a *goal*, not a
   raised amount), `status: verified_alpha` (a named-CEO announcement, not an
   SEC filing) or `candidate` if that's too strong for a target/goal statement.
2. A single `corporate_investment`-style flow from NVIDIA if you'd rather
   anchor it on NVIDIA as the strategic sponsor, with the six managers listed
   in `co_investors`.
3. Skip amount/round modeling entirely and just log it as a `first_entry`-
   style relationship/note if your schema resists an undisclosed aggregate
   target — whichever keeps `amount`/`status` honest is more important than
   which shape you pick.

Whichever shape: `source_url` = the tweet above, `source_tier` reflecting a
named-executive public statement (not primary-document-grade), and
`provisional: true` given no per-party amount is disclosed yet.
