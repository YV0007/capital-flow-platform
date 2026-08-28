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

## TASK A — `entities[].description`: what this thing actually IS

**Status: 0 of 107 delivered.** This is the single biggest gap in the map. The
panel renders `description` the moment it arrives and looks sparse without it —
a reader clicks Crusoe, gets one line, and still cannot tell what the business
is or how it makes money.

`oneLiner` stays exactly as it is — it is the lede, ≤110 chars, used in tooltips
where length breaks the layout. `description` is the paragraph behind it.

```jsonc
{
  "id": "crusoe",
  "oneLiner":    { "ru": "…", "en": "…" },   // unchanged
  "description": { "ru": "…", "en": "…" }    // NEW — 4–7 sentences
}
```

### What it must answer, in this order

The reader's question is not "who founded it" — it is **"what is this thing and
how does it make money"**. Answer, in order, and stop:

1. **What it sells.** The actual product or service, named. Not the category —
   the thing a customer receives and pays for.
2. **Business model.** How the money arrives: hardware margin, licence per
   unit, per-token, subscription per seat, take-rate, tolling, long-term
   contract, fees on assets under management. Say which.
3. **Role in the stack.** What it consumes from below and what it hands up.
   This is the sentence that ties the entity to this map rather than to a
   generic company profile.
4. **Scale, in numbers.** The two or three figures that actually size it —
   whichever are meaningful for THIS kind of entity: revenue and its growth,
   unit volumes, capacity, market share, install base, headcount, AUM. A stat
   like «85% of the Fortune 500 run it» is exactly the register wanted: it
   tells the reader the position in one number.
5. **What changed recently** that matters to this map.

### The register — this is the part that keeps being got wrong

**Facts, densely packed. No adjectives doing a number's job. No throat-clearing.**

- Every sentence carries at least one fact a reader did not already have.
- No sentence may survive the test "would this still be true if I pasted it
  under a different company". «Лидер рынка с сильными позициями» fails it.
- No jargon, per the README rule that already governs `oneLiner`: written for
  someone who does not know the stack. If a term is unavoidable, the sentence
  explains it in passing rather than linking away.
- Do **not** restate `whyIrreplaceable` or `whatBreaksIt` — both are rendered
  directly underneath and answer different questions.
- Do not restate the structured fields either. `revenueUsdB`, `founded`,
  `ticker`, `geo` are already shown as chips beside the paragraph; the
  description adds what a chip cannot hold.

### Worked example — the depth expected

> **ServiceNow.** Продаёт компаниям единую систему для рабочих процессов:
> заявки в ИТ, кадровые операции, обслуживание клиентов — всё в одном контуре.
> Деньги приходят подпиской за рабочее место в год, с многолетними договорами;
> выручка почти целиком повторяющаяся. В этой карте стоит на стороне спроса:
> закупает вычисления у облаков и встраивает модели в процессы, за которые
> компании уже платят. Систему используют около 85% компаний из Fortune 500,
> годовая выручка порядка $11 млрд при росте ~22%. С 2025 года продаёт ИИ-
> функции отдельным тарифом — именно этот тариф превращает ИИ в строку
> выручки, а не в статью расходов.

Five sentences: what it sells, how it earns, where it sits, how big, what
changed. Every clause is checkable.

### Zero fabrication

Sourced or it does not ship — the same rule as every other field. A figure with
no source is worse than no figure: this panel is read as data. Where a number
cannot be confirmed, drop the number and keep the sentence.

**Priority if it cannot all be done in one run:** the 27 pivots first, then by
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
