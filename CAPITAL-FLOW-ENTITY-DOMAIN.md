# Engine ask — emit a verified `domain` field per entity

**Paste this into the Capital Flow engine's Claude Code session** (`~/Desktop/Capital Flow`).

## 2026-08-17 FOLLOW-UP — still 0/178 nodes have `domain`

The 2026-W34 delivery (generated `2026-08-17`) shipped **178 nodes; not a
single one carries a top-level `domain` field.** This is the second cycle
after the ask was filed — same shape, same gap. The dashboard's fetcher
already has code paths waiting to consume `node.domain` (a verified
website candidate that skips guess-then-verify entirely); they've been
dormant for two weeks because there's nothing to consume.

### What's actually broken right now (measured against this delivery)

- **28 org-type entities** (excluding sovereigns/individuals) ship without a
  local logo file — every one of them would be trivially resolvable if
  `domain` were present.
- **8 of them are BRAND NEW this cycle** (`first_seen >= 2026-08-10`) and
  most have single-word, unambiguous, well-known websites the research
  agents almost certainly opened while writing the profile:

  ```
  target:SpaceX            first_seen=2026-08-14   → spacex.com
  target:Boralex           first_seen=2026-08-14   → boralex.com
  target:Vals AI           first_seen=2026-08-13   → vals.ai
  target:Form Energy       first_seen=2026-08-12   → formenergy.com
  target:Corma             first_seen=2026-08-10   → getcorma.com  (non-obvious — this is exactly the case where a verified `domain` beats name-guessing)
  target:Cambridge Aerospace first_seen=2026-08-10
  target:Erebor            first_seen=2026-08-10
  ```

  These are companies with obvious sites. The engine's research agent
  fetched *something* about SpaceX to write its profile; whatever URL it
  landed on has spacex.com as its origin. That value just needs to reach
  `nodes[i].domain`.

- **Also missing (older nodes, same gap):** Performance Drone Works, Cathedral,
  Flourish, SB Neo, Nippon Gateway Infrastructure, KKR Global Infrastructure
  Investors V, and ~14 more. Full list is `scripts/logo-misses.txt` in the
  dashboard repo after any `python3 scripts/fetch_logos.py` run.

- **For entities that genuinely have no site of their own** — named JVs and
  projects (Kuwait Oil Company Pipeline JV, Akita 500MW AI data center,
  Project Sopaipilla Holdings), single-asset SPVs, unlisted funds
  (GPx TX LP, Quiet Select TX LP) — please ship **`domain: null` explicitly**
  rather than omitting the key. That way the dashboard can distinguish "no
  domain known" from "engine hasn't decided yet" and stop the fetcher from
  wasting cycles on entities that will never resolve.

### The ask is unchanged — restated for clarity

Emit `domain` on every node in `capital_map.json`:

- **String** (bare, no scheme/www — `"spacex.com"`) when the entity has a
  verified official site. Pull it from your own `profile.sources[]`
  research; you already opened these pages to write the description.
- **`null`** when the entity is a JV / project / fund / SPV / individual that
  genuinely has no site of its own.
- **Never omit the key.** Missing != null in the dashboard's mental model.

Two-line diff on the writer side, no new research, closes the entire
logo-tile gap in one delivery. Same shape asked for on 2026-08-10; still
open.

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
