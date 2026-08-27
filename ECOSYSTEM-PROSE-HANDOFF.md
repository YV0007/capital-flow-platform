# ENGINE HANDOFF — Ecosystem map: prose that carries context

**To:** the Capital Flow engine session (monthly `run_network.py` pipeline).
**Contract:** `ai-ecosystem-network/2` → proposes `/3`.
**Date:** 2026-08-27.

---

## The problem, stated as a user does

Two complaints, one root cause.

**1. "You have to click every node to work out what matters."** Selecting the
GPU-стек subgraph lights 22 tiles. That tells you *which* companies are in the
stack and nothing about *how the stack works* — who makes the thing, what they
need to make it, who buys it, what it is used for. The only way to find out is to
click 22 tiles in turn and assemble it in your head.

**2. "Not enough description — I want more context."** Databricks' panel says, in
full: *«Платформа, на которой компании готовят данные и обучают модели под свои
задачи.»* One sentence. A reader who does not already know Databricks learns
almost nothing — not when it was founded, not by whom, not how big, not where it
sits in its market, not what it just did.

Both are the same gap: **the engine ships one-liners where the reader needs
paragraphs.** The map has excellent structure and thin prose.

The dashboard side is already built and waiting for both fields (§5).

---

## TASK A — `entities[].description`: the paragraph behind the one-liner

Add a second, longer prose field per entity. **`oneLiner` stays exactly as it
is** — it is the lede, it works, and it is used in tooltips where length would
break the layout.

```jsonc
{
  "id": "databricks",
  "oneLiner": { "ru": "…", "en": "…" },   // unchanged — one sentence, ≤110 chars
  "description": {                         // NEW — 3–6 sentences
    "ru": "…",
    "en": "…"
  }
}
```

**What belongs in it.** Enough that nobody has to leave the page to follow the
map:

- who they are — founded when, by whom, where;
- how big — revenue, valuation, headcount, share, whichever is the meaningful
  measure for this kind of entity;
- where they sit in their market — who they compete with, what they are known
  for;
- what they have recently done that matters to this map.

**Reference for register and depth** — the Capital Flow map's own allocator
descriptions are exactly right, e.g. Thrive Capital: *"New York venture firm,
founded by Josh Kushner in 2010. Built its reputation on repeat concentrated bets
in generation-defining private companies — OpenAI, Stripe, SpaceX — and in
February 2026 closed its largest fund, Thrive Capital Partners X, at $10B, heavily
oversubscribed. Also builds companies itself."* Four sentences, every one a fact,
no adjectives doing work a number should do.

**Rules:**
- Same zero-fabrication discipline as everything else. Sourced, or it does not
  ship.
- Do **not** duplicate `whyIrreplaceable` or `whatBreaksIt` — those answer
  different questions and are already rendered directly beneath.
- Language without jargon, as the README already mandates for `oneLiner`: written
  so that someone who does not know the stack can follow it.
- Applies to every entity kind. A jurisdiction, an agency and a standards body
  each need this as much as a company — arguably more, since they are the ones a
  reader is least likely to recognise.

**Priority if it cannot all be done in one run:** pivots first, then by
criticality descending. Those are the tiles people actually click.

---

## TASK B — `network.subgraphs[].brief`: how the sub-ecosystem works

Add a chain narrative per subgraph. The existing one-line `description` stays as
the lede.

```jsonc
{
  "id": "gpu-ecosystem",
  "label":       { "ru": "GPU-стек", "en": "GPU stack" },
  "description": { "ru": "…", "en": "…" },   // unchanged one-liner
  "brief": {                                  // NEW — 4–8 sentences
    "ru": "…",
    "en": "…"
  },
  "keyPlayers": [                             // NEW, optional but strongly wanted
    { "id": "nvidia", "role": "producer",
      "why": { "ru": "…", "en": "…" } }       // ≤120 chars: why THIS one matters here
  ]
}
```

### What `brief` must read like

**Walk the chain, naming only the players that matter.** The shape the reader
wants, in their own words:

> *The main producer of the GPU is NVIDIA, which gets its resources from such and
> such sources, later sells to such contractors, and it is used for this and that
> task.*

So, roughly: **who makes the thing → what they must have to make it → who buys it
→ what it is used for → and what would break the chain.** Prose, not a bulleted
list — the reader is holding the map beside it, and a paragraph is what turns a
lit cluster into an explanation.

### KEY PLAYERS ONLY — this is the hard constraint

**Name only first-order players. No second-tier names.** A brief that mentions all
22 members of the GPU stack is the same wall of names the map already shows, and
it defeats the entire purpose. Roughly 4–8 names per subgraph.

The test for inclusion: *if this entity vanished, would the chain read
differently?* If not, leave it out — it is still on the map, one click away.

### `keyPlayers[]`

An explicit list, in chain order (upstream first). Wanted for two reasons: it
stops the prose drifting into second-tier names, and it lets the panel show a
ranked list that agrees with the narrative instead of guessing. `role` is a free
short slug describing the part played *in this subgraph* — `producer`,
`supplier`, `platform`, `buyer`, `gate` — not the entity's global role, because
the same company plays different parts in different stacks.

Where `keyPlayers` is absent the dashboard falls back to ranking the subgraph's
members by the engine's own `criticality`, which works but cannot know that, say,
a fab matters *as the supplier* here rather than as a big number.

### All 12 subgraphs

`gpu-ecosystem`, `infrastructure-backbone`, `export-control`, `power-and-cooling`,
plus the eight others in the current payload. The degenerate ones still need a
`brief` — for those, the honest brief explains *why* the subgraph is structurally
almost one company's own pieces, which is genuinely useful information.

---

## Why the engine and not the dashboard

Both fields are research: they need sources, judgement about what matters, and
facts that are not in the graph. The dashboard's standing rule is that it computes
nothing the engine can compute and invents no prose. The one thing it does derive
— ranking subgraph members by criticality — is sorting engine numbers, and it is
explicitly a fallback for exactly these fields.

---

## What the dashboard already does with them

Both are **already wired and shipping**. Nothing further is needed on that side.

- `entities[].description` renders in the entity panel as a regular-weight
  paragraph directly beneath the semibold `oneLiner`, separated by a hairline.
  Absent → the panel looks exactly as it does today.
- `network.subgraphs[].brief` renders in `SubgraphBrief.jsx`, a panel that opens
  with the subgraph lens. Today it shows the one-line `description`, an explicit
  "движок пока не прислал" note where the narrative belongs, and the key-player
  fallback grouped into chain steps by layer. The moment `brief` arrives the note
  is replaced by the narrative.
- `keyPlayers[]` replaces the criticality fallback and uses `why` as each row's
  subtitle.
- **No adapter change is needed for either.** `resolveProse` already walks the
  whole payload and collapses any `{ru, en}` pair to the active language, so both
  fields are bilingual for free.

---

## Acceptance

1. Every pivot carries a `description` of 3–6 sourced sentences; coverage then
   descends by criticality.
2. All 12 subgraphs carry a `brief` that names its key players and walks the
   chain from producer to use.
3. No `brief` names more than ~8 entities.
4. Both fields ship as `{ ru, en }` pairs, per contract `/2`.
5. `oneLiner`, `whyIrreplaceable` and `whatBreaksIt` are unchanged — this is
   purely additive.
