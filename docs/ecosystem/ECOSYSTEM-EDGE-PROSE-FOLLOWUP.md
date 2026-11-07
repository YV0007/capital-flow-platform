# FOLLOW-UP — the final rule: write facts, not taxonomy

Send after `ECOSYSTEM-EDGE-PROSE-HANDOFF.md`. This is the correction that matters
most, and it should govern the whole pass.

---

## The example

Hover **AMD → CUDA**. The note reads:

> «Открытая среда AMD — жизнеспособный путь-замена, а не рыночная конкуренция:
> она поддержана той же библиотекой обучения.»

Read it as someone who does not already know this industry — which is the only
reader worth writing for. It contains **no fact**. Every clause is a statement
about *how to classify the relationship*:

- "жизнеспособный путь-замена" — a category
- "а не рыночная конкуренция" — a category being ruled out
- "поддержана той же библиотекой обучения" — which library? supported how?

Nothing is named, nothing is measured, nothing happened. The reader learns the
edge's taxonomy and not one thing about AMD or CUDA.

**And the taxonomy is already on screen.** The card shows the edge type as a
label, in the spine's own colour. Spending the note restating it wastes the only
85 characters the reader will actually read.

---

## The rule

> **A note states what is true between these two companies. It never explains
> what kind of edge it is.**

The reader arrives with **zero context**. Assume they do not know what CUDA is,
what ROCm is, or why any of it matters. The note has to work anyway.

### What the AMD → CUDA note should contain

Roughly this shape — *the facts below are illustrative and must be researched and
sourced before shipping; do not copy these numbers*:

1. **The concrete mechanism.** AMD sells accelerators, but the code the industry
   trains on is written against CUDA — so what actually happens when someone
   wants to run that code on AMD hardware?
2. **AMD's own answer, named.** ROCm — what it is, since when, and what state it
   is actually in.
3. **The real size of the gap.** The measurable one: share of frameworks
   supported out of the box, share of published models that run unmodified,
   volume of code, years of accumulation. One number is enough.
4. **What is changing.** Who is porting, what shipped recently, what would have
   to happen for this to stop being a lock.

Written to the same 85-character discipline, that becomes a note where **every
clause is checkable** — instead of four clauses of classification.

---

## Applies to every field, not just this edge

The same failure appears wherever prose describes the model instead of the world:

| Taxonomy (wrong) | Fact (right) |
|---|---|
| «жизнеспособный путь-замена, а не рыночная конкуренция» | what the alternative is, named, and how far behind |
| «единственный названный путь наружу из замка» | which product, and what it would take to switch |
| «слой конкурентный, а не запертый» | how many real suppliers there are, and their shares |
| «связь не отыгрывается назад» | what specifically cannot be undone, and why |

If a sentence would still be true after swapping the two companies for any other
pair of the same edge type, it is taxonomy and must be rewritten.

---

## The test to apply to all 262

Three questions, in order. A note ships only if it passes all three.

1. **Does it name things?** Products, companies, versions, standards. Not
   «среда», «библиотека», «конкурент» — CUDA, PyTorch, ROCm, AMD.
2. **Does it contain something checkable?** A number, a date, a share, a named
   contract. Ideally one. Currently only 9 of 262 notes do.
3. **Would it survive the swap test?** Replace both endpoints with a different
   pair of the same edge type. If the sentence still reads fine, it says nothing
   about *these two* and must be rewritten.

---

## Sourcing — this is not licence to write freely

Everything above raises the demand for **specificity**, which raises the risk of
invention. It does not relax the rule:

> **Every fact carries a source that was actually fetched. No source → the fact
> does not ship.**

Where a number cannot be confirmed, drop the number and keep the sentence. A note
that says less and is true beats a note that reads well and is invented. This
matters more here than anywhere else in the payload, because these notes read as
data and will be quoted as data.

---

## One data bug found while reviewing this, now fixed on the dashboard

Worth knowing because it points at a validator gap on your side.

`is_alternative_to` and `enables_interop` — the two edge types this contract
added — were **not** in the frozen v2 type table that `buildGraphFrom` uses. They
fell into its `? e.type : 'supplies'` fallback, so three edges rendered as
**«поставляет»**: the map stated that *AMD supplies CUDA* when AMD is an
alternative to it, and painted the edge on the physical spine instead of rivalry.

Fixed on the dashboard — the type table is now passed in, so the network adapter
supplies its extended version.

**The engine-side lesson:** a silent fallback that changes the meaning of a
relationship is worse than a missing one. Worth a handoff-validator check that
every `edges[].type` in the payload exists in the contract's own type table, and
a hard failure if not — the same way the contract already refuses to write a
payload with a dangling entity reference.
