# ENGINE HANDOFF — Edge notes: the map's main navigation surface

**To:** the Capital Flow engine session (monthly `run_network.py`).
**Scope:** EVERY user-facing prose field in the ecosystem payload — `oneLiner`
(107), `edges[].note` (262), `whyIrreplaceable`, `whatBreaksIt`, `criticalityWhy`,
`risk.note`, `risk.mitigation`, `detail`. The rules in §1 and §2 are a sweep,
not a sample.
**Date:** 2026-08-28.

---

## Why this one matters more than it looks

Hovering an edge is turning into **the primary way the map is read**. You point at
a line, and a small card tells you what actually passes between two companies.
That is faster than opening panels, and it is how a reader builds a picture of
the stack.

The notes are already good — the register works, the length is right. This is not
a rewrite request. It is a pass to make them **unambiguous and denser**, because
at 262 hovers the small frictions compound.

**Do not make them longer.** Median is 85 characters and that is correct; the card
is sized for it. Raise information per character, not character count.

---

## 1. THE GOVERNING RULE — a note describes THIS relationship

**48 of 262 notes (18%) are about a third party instead of the two companies the
edge actually connects.** This is a more serious problem than any word choice,
and fixing it should be the organising principle of the pass.

### The case that makes it obvious

Click the **AMD → TSMC** edge. It is a manufacturing relationship: AMD designs
accelerators, TSMC fabricates them. The card says:

> «Конкурент якоря делает свои чипы на той же фабрике: узкое место общее для
> обоих.»

The subject of that sentence is **NVIDIA** — a company that is not on either end
of this edge. A reader who clicked AMD → TSMC asked "what happens between AMD and
TSMC" and was answered with a fact about someone else. Nothing in the sentence
tells them what AMD actually orders, on what process, in what volume, or on what
terms.

> **Target:** «AMD проектирует ускорители Instinct, а печатает их TSMC — на том
> же 3-нм процессе, что и заказы NVIDIA. Своих фабрик у AMD нет с 2009 года.»

Now the sentence is about AMD and TSMC. It says what is made, where, on which
process, and — the load-bearing fact — that AMD has no fab of its own, which is
*why* this edge exists at all.

### Where the competitor fact belongs

It is not lost. **AMD → NVIDIA already exists as an edge**, labelled «прямой
конкурент» in the entity panel. That is where "AMD is NVIDIA's main rival, and
both print at the same fab" belongs — because there the two endpoints *are* the
two companies being compared.

**Rule: every note's subject is one of the two endpoints. A third party appears
only as an object in the sentence, never as what the sentence is about. If the
fact is really about A and C, it belongs on the A → C edge.**

### Why this matters more than it looks

Each edge is a slot for one specific fact. When notes drift onto third parties,
the same NVIDIA comparison gets repeated across a dozen edges while the actual
relationships — what AMD buys from TSMC, on what terms — go unrecorded anywhere.
The map ends up with 262 slots and far fewer than 262 facts.

---

## 2. Banned vocabulary — replace every instance

### 2.1 «якорь» — 126 instances across the payload, 43 in edge notes

**This is the biggest single problem.** The map no longer has one anchor — v3
generalised to 27 co-equal pivots — so «якорь» is now both jargon *and* factually
stale. Worse, it forces the reader to translate: they must remember which company
"the anchor" is before the sentence means anything.

> **Rule: name the company. Always. «якорь» never appears in user-facing prose.**

| Before | After |
|---|---|
| «прямая альтернатива закупке у якоря» | «прямая альтернатива закупке у NVIDIA» |
| «удлиняет сроки партнёрств и покупок якоря» | «удлиняет сроки партнёрств и покупок NVIDIA» |

Distribution to fix: `edges[].note` 43 · `criticalityWhy.strategicControl` 56 ·
`whyIrreplaceable` 11 · `oneLiner` 7 · `whatBreaksIt` 2 · `risk.mitigation` 4 ·
`risk.note` 1 · `criticalityWhy.irreplaceability` 1 · `detail` 1.

### 2.2 Ordinals with no referent — «второй», «первый» — 20 of 107 `oneLiner`s

**This is the clearest example of the whole problem, and it is worth reading
carefully.** Open AMD as your first click on the map. The panel says, in full:

> «Второй разработчик ускорителей для ИИ; делает их на той же фабрике, что и
> якорь.»

Second **to whom**? What is «якорь»? Which fabricator? A reader who already knows
the answer is NVIDIA, NVIDIA and TSMC learns nothing from the sentence; a reader
who does not — which is everyone opening AMD first — learns nothing at all. Every
noun in it is a pointer to something the sentence declines to name.

> **Target:** «Разработчик ускорителей для ИИ, главная альтернатива NVIDIA.
> Печатает их на той же фабрике, что и NVIDIA — на TSMC.»

Same length. Names what it makes, names who it is second to, names the fab. The
ranking is still there — it is simply attached to something a reader can resolve.

**Rule: an ordinal is allowed only when the thing it ranks against is named in
the same sentence.** «Второй после NVIDIA» is fine. Bare «второй» is not.

The same fix applies to «вторая лаборатория» (name it: after OpenAI), «крупное
облако» (name it), «конкурент» (name them), «собственный ускоритель облака»
(whose).

All 20 affected: Amazon, AMD, Amkor, Anthropic, Cadence, Китай, Cisco, Digital
Realty, Fabrinet, HPE, JAX, NVIDIA NIM, NVIDIA Ventures, NVIDIA, Schneider
Electric, SGLang, Siemens Energy, TensorRT, США, Wistron.

### 2.3 The same rule applies to ALL periphrasis — 51 notes

«якорь» is the worst case of a broader habit: describing an entity instead of
naming it. Every one of these makes the reader decode before they can read.

| Before | After |
|---|---|
| «Второе облако заперто на том же уровне» | «Amazon заперт на том же уровне» |
| «Конкурент якоря делает свои чипы на той же фабрике» | «AMD печатает свои чипы там же, где NVIDIA» |
| «Проектировщик заказных ускорителей покупает у той же фабрики» | «Broadcom покупает у той же фабрики» |

The one exception: the note must not merely restate the tooltip header. The card
already shows `TSMC —делает возможным→ CUDA`. Naming a **third** party is always
right; re-naming the two endpoints is only right when the sentence needs the
grammar.

### 2.4 «ров» — 6 instances

A literal translation of "moat" that reads as a ditch in Russian. The map already
owns a better word: `lockInDepth` is rendered as **«глубина замка»**, so
**«замок»** is the established in-map term. «защита» and «барьер» also work.

| Before | After |
|---|---|
| «её главный ров» | «её главный замок» |
| «ров якоря обесценится» | «замок NVIDIA обесценится» |

### 2.5 «узкое место» — 9 instances

Banned. It is vague where the map should be specific: it names a *category* of
problem instead of the actual constraint. Replace with **what is actually
scarce**, which is more informative anyway.

| Before | After |
|---|---|
| «узкое место общее для обоих» | «обе зависят от одной фабрики» |
| «Упаковка — отдельное узкое место» | «Упаковку такого класса делают два-три подрядчика, все на Тайване» |
| «энергия — узкое место» | «энергия ограничивает ввод площадок» |

### 2.6 «движок» / «открытый движок» — 12 instances

Opaque. In every case it means **vLLM**, an open inference server. Name it, or
say what it is in plain words: «открытая система запуска моделей».

> Before: «Открытый движок реализует совместимый с лабораторией программный
> интерфейс — он стал общим стандартом.»
>
> After: «vLLM повторяет API OpenAI, поэтому код под OpenAI работает на своих
> серверах без переписывания — так этот API стал отраслевым стандартом.»

Note how the rewrite is the same length and says considerably more.

---

## 3. Make them more informative

### 2.1 Put a number in — only 9 of 262 notes contain one

This is the largest missed opportunity in the whole payload. A number is the
cheapest possible density: it converts an assertion into a fact, in the same
space.

> Before: «Упаковка, соединяющая вычислительный кристалл с памятью, — отдельное
> узкое место помимо самого производства.»
>
> After: «Упаковку CoWoS, соединяющую кристалл с памятью, делают два-три
> подрядчика — и очередь на неё расписана на год вперёд.»

Share, count, capacity, share of revenue, years-to-replace, lead time. Whichever
is real and sourced. Where no number can be confirmed, keep the sentence and drop
the number — never invent one.

### 2.2 Answer the question the reader is actually asking

A reader hovering an edge wants three things, in this order:

1. **What concretely passes between these two** — which product, which money,
   which right. Not «поставляет» but what is supplied.
2. **How much / how deep** — the number above, or the scale in words.
3. **Why it matters here** — the consequence. This is the sentence that turns a
   line on a canvas into an insight, and it is the one most often missing.

The best existing notes already do two of the three, and show the target shape —
though note that even this one says «облако» where it should say «Amazon», which
is how pervasive §2.3 is:

> Now: «Конвертируемые займы, часть которых превращена в неголосующие акции:
> облако финансирует собственного клиента.»
>
> Target: «Конвертируемые займы на $8 млрд, часть уже в неголосующих акциях:
> Amazon финансирует Anthropic, которая тратит эти деньги обратно в AWS.»

What passes (convertible loans, partly converted to non-voting shares), how much,
and why it matters (the money returns to the lender as revenue). That is the
standard for all 262.

### 2.3 Say the mechanism, not the category

> Before: «Быстрые режимы движка построены на возможностях этой среды.»
>
> After: «Самые быстрые режимы vLLM написаны под CUDA — на другом железе они
> просто отключаются.»

The second version tells the reader what actually happens when the dependency is
removed. That is the whole point of a dependency map.

---

## 4. Worked rewrites — the standard expected

| Edge | Now | Target |
|---|---|---|
| TSMC → CUDA | «Ров из софта работает, только пока есть кому печатать железо: два узких места держат друг друга.» | «Замок CUDA держится, пока чипы есть кому печатать: 3 нм в объёме делает одна TSMC. Софт и фабрика держат друг друга.» |
| AMD → TSMC | «Конкурент якоря делает свои чипы на той же фабрике: узкое место общее для обоих.» | «AMD печатает ускорители там же, где NVIDIA: конкуренция есть в дизайне, в производстве её нет.» |
| Amazon → CUDA | «Второе облако заперто на том же уровне: клиенты требуют совместимости со средой якоря.» | «Клиенты AWS требуют совместимости с CUDA, поэтому Amazon закупает NVIDIA даже под собственные чипы.» |
| NVIDIA NIM → vLLM | «Собственный движок якоря против открытого: платный против бесплатного.» | «Платный сервер инференса NVIDIA против бесплатного vLLM — на одном и том же железе.» |
| CFIUS → NVIDIA | «Проверка иностранного участия удлиняет сроки партнёрств и покупок якоря.» | «CFIUS проверяет иностранное участие в сделках NVIDIA — сроки партнёрств и покупок растут на месяцы.» |

Same length. No jargon. Every one names its subject and ends on a consequence.

---

## 5. `edges[].detail` — how the relationship actually runs. 20 of 262.

**Wanted, explicitly.** The `note` is the one-line answer on hover; `detail` is
what a reader wants immediately after: *what are the actual orders, what is
contracted, how does this relationship run in practice.*

For AMD → TSMC that means: which process nodes AMD books, roughly what share of
TSMC's leading-edge capacity that is, whether capacity is pre-paid or reserved,
how long the commitments run, and how the arrangement has changed. The kind of
thing a reader would otherwise go and look up — which is the whole reason the
panel exists.

242 of 262 edges have none at all. Median length where present is 328 characters,
which is the right size — keep it.

**Fill in `strength` order.** The strongest edges are the ones people hover, and
then click. Start there and work down; this does not have to be complete in one
run to be useful.

---

## 6. Acceptance

1. **Every note's subject is one of its two endpoints.** The count of notes whose
   subject is a third party goes from 48 to 0. Facts about A and C move to the
   A → C edge rather than being deleted.
2. Zero occurrences of «якорь», «ров», «узкое место», «движок» in any
   user-facing Russian prose field. The English side gets the same treatment —
   no "anchor", no "moat", no "bottleneck", no "engine".
3. No prose refers to an entity by description where a name would do, and no
   bare ordinal («второй», «первая») survives without the thing it ranks against
   named in the same sentence.
4. Materially more than 9 of 262 notes carry a number.
5. Median note length stays near 85 characters. **This is a density pass, not an
   expansion pass.**
6. Every note still ends on why the relationship matters.
7. `detail` filled for the top edges by `strength`, saying what is actually
   ordered and on what terms.

**This is the standard for the whole ecosystem map, not a list of individual
fixes.** Apply it to all 262 notes, all 107 `oneLiner`s, and every other prose
field in the payload.

---

## 7. Dashboard side

Nothing to do — `note` and `detail` render already, and `resolveProse` handles the
`{ru, en}` pairs. Three dashboard-owned strings used the banned words and are
already fixed and shipped:

- `LayerReport` section title «Узкое место» → «На ком держится слой»
- `SupplyChainHome` «…зависимости, узкие места» → «…зависимости, ограничения»
- `Roadmap` «Один балл «рва»…» → «Один балл защиты…»

(The `'Ров'` key in `Roadmap.jsx` is a legacy **data** key from older payloads,
already mapped to «Защита от конкурентов» for display. It stays — renaming it
would stop it matching the data it exists to match.)
