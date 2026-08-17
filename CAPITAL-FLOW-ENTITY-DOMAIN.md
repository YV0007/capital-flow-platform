# Engine ask — emit a verified `domain` field per entity

**Paste this into the Capital Flow engine's Claude Code session** (`~/Desktop/Capital Flow`).

## 2026-08-17 FOLLOW-UP — the real gap is the enrichment step, not `domain`

**Correction to a previous framing.** `domain` is actually landing well on
2026-W34: **105/178 nodes carry a real `domain` string** (NVIDIA, Brookfield,
Meta, Blue Owl, MGX, hyperscaler campuses, etc.). Good progress since the
2026-08-10 ask. Retracting the "0/178" claim in the earlier draft — that was
a bad count on my end.

**What's still broken is different, and worse than a missing field.** Seven
brand-new targets this cycle (`first_seen >= 2026-08-10`) shipped as **bare
stubs** — the raw ingestion record made it into `nodes[]` but the entity
enrichment step (description / domain / country / profile) never ran on them:

```
target:Corma             first_seen=2026-08-10  $180M / 3 deals — no description, no domain
target:SpaceX            first_seen=2026-08-14  no description, no domain
target:Form Energy       first_seen=2026-08-12  no description, no domain
target:Boralex           first_seen=2026-08-14  no description, no domain
target:Vals AI           first_seen=2026-08-13  no description, no domain
target:Cambridge Aerospace first_seen=2026-08-10  no description, no domain
target:Erebor            first_seen=2026-08-10  no description, no domain
```

Full record for Corma as delivered — nothing under `description`, `domain`,
`country`, or `profile`:

```json
{ "id": "target:Corma", "label": "Corma", "kind": "target", "cls": "private",
  "sector": "cybersecurity", "capital": 180000000.0, "deals": 3,
  "first_seen": "2026-08-10", "last_activity": "2026-08-10", "stale": false,
  "tier": null, "network": null, "country": null }
```

These are all well-known-enough companies that a research pass would have
resolved them cleanly (Corma → getcorma.com, SpaceX → spacex.com, etc.).
The 105 nodes that DO carry `domain` show the enrichment step works — it
just isn't running on the newest arrivals before delivery.

### The ask — enrichment must run on every new node, every weekly cycle

**Requirement:** every `kind: target` node newly added to `nodes[]` on a
weekly delivery must ship with a `description` populated. Not eventually,
not "when the research queue catches up next week" — **on the same
delivery that first surfaces it in the map.** A user opening the map on
Monday morning should never see a bare stub for a company that just got
its first tracked flow.

This is the same failure shape as the "references.ingest ran after
export" incident on 2026-08-10 (re-delivery fixed it, 108/108) — but this
time it's the description/profile enrichment that's slipping past the
export. Please treat it as a pipeline ordering fix, not per-node
triage.

**Concrete pieces to check in `run_week.py` (or wherever the weekly job
lives):**

1. Ordering — every step that mutates `nodes[]` (flow ingest, new-entity
   detection, description/domain/country enrichment) must complete
   **before** `export_map`. If enrichment runs on a queue, drain the
   queue before the export.
2. Age filter — if new entities go through a "wait N days before
   researching" queue, that filter is what's producing the stubs. Remove
   it for entities that already have a flow attached: as soon as they
   hit the map, they need a description.
3. Silent failures — if an entity's enrichment call errors out (rate
   limit, source refuses, LLM hiccup), the node currently still ships as
   a stub. Either retry within the same run, or fail the export loudly
   so it's obvious the delivery is incomplete.

**A pre-delivery invariant would make this self-checking.** Before
writing `capital_map.json`, assert:

```
for n in nodes:
    if n["kind"] == "target":
        assert n.get("description"), f"unenriched target {n['id']}"
```

If that assertion fails, the delivery is incomplete — either re-run
enrichment for the flagged nodes or block the export and page whoever
owns the pipeline. Currently the invariant is enforced by the dashboard
noticing at render time and me writing this document; that's the wrong
place for it.

### Nodes affected by this bug on 2026-W34

Seven this cycle — all real companies with obvious enrichable content:

```
target:Corma             $180M / 3 deals  first_seen 2026-08-10
target:SpaceX                              first_seen 2026-08-14
target:Form Energy                         first_seen 2026-08-12
target:Boralex                             first_seen 2026-08-14
target:Vals AI                             first_seen 2026-08-13
target:Cambridge Aerospace                 first_seen 2026-08-10
target:Erebor                              first_seen 2026-08-10
```

Please back-fill descriptions for these in the next delivery, and add the
invariant so this can't recur silently.

### On `domain` specifically

Keep the `domain` rollout going. Two small housekeeping asks:

- For entities that genuinely have no site of their own (JVs, projects,
  SPVs, unlisted funds, individuals), ship **`domain: null` explicitly**
  rather than omitting the key. The dashboard already treats null as "engine
  says none" vs missing as "engine hasn't decided" — the fetcher can then
  stop trying to name-guess entries that will never resolve.
- The 73 nodes still without any `domain` key are mostly this "no domain of
  their own" category (projects, funds, JVs, individuals). Auditing that
  list and marking each `domain: null` where correct would close the loop.

---

## The problem, traced to root cause

Thrive Capital showed no website and a monogram tile instead of its real
logo — checked precisely, not guessed:

- `entityReference.json` (dashboard-curated fallback) had no entry.
- `logoManifest.json` (pre-fetched logos) had no entry.
- The raw node record has no `domain` field at all.
- `scripts/logo-misses.txt` confirms the dashboard's logo pipeline **already
  tried and gave up** — it name-guesses a domain (`thrivecapital.com`) and
  only trusts it if the page verifies itself as that entity. The real domain
  is the non-obvious `thrivecap.com`, so the guess correctly failed rather
  than showing a wrong logo ("a wrong logo is worse than no logo" — the
  pipeline's own stated rule).

**The real domain was never actually missing from your research** — it's the
first entry in Thrive Capital's own `profile.sources[]`:
`"https://thrivecap.com/"`. Spot-checked two more `logo-misses.txt` entries
the same way: every **org**-type allocator's first source is reliably its own
domain (VCs/corporates cite their own site first). Individual-type allocators
are the exception — their first source is often a third-party bio (LinkedIn,
TechCrunch, PitchBook), which is correct and expected; they often have no
domain of their own.

## The ask

You already discover and verify the real domain as a normal part of
`profile.sources[]` research — this is a **formalization ask, not new
research**. Emit a top-level `domain` field per allocator (and per target
company, same logic) whenever `profile.sources[]`/the research is confident
about the entity's own official site:

```jsonc
// capital_map.json — allocators[name] and nodes[] (targets), additive
"domain": "thrivecap.com"   // bare domain, no protocol/www — null when the
                             // entity genuinely has no site (many individuals,
                             // some SPVs/JVs) rather than guessing
```

This closes a gap already flagged once before (see prior handoff notes on
`node.domain`) — the dashboard's `fetch_logos.py` already has code paths ready
to consume a verified `domain` field the moment it's shipped, no dashboard
change needed. It also removes the guess-then-verify step for every org
entirely — faster, and zero risk of a wrong logo, since the domain came from
your own sourced research instead of a name-based guess.

## Scope

Every entity this would help is currently sitting in the dashboard's
`scripts/logo-misses.txt` (34 as of this writing) — that's the exact list this
field would resolve for org-type entities. Individual-type entities without a
personal domain should ship `domain: null`, not a guessed/unrelated URL.
