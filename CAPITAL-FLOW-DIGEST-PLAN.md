# Capital Flow — Flow Digest (weekly / monthly / overall)

Status: proposed · v1 scope agreed with owner

## Scope (v1)
- Pure **frontend**. New section in the Capital Flow area. No backend, no
  email/Telegram (that's a later phase 2).
- **Inflows only.** No outflows, no cross-cycle "expanding vs contracting"
  mood — those come after the research engine ships the data; we'll build the
  visuals for them then.
- Everything computed **live from the current `capitalMap.json`** using each
  flow's `date`, anchored at `META.generated`.

## Placement
- A new **third view** in the Capital Flow shell, alongside **Карта / Таблица**:
  a **«Сводка»** (Digest) button in the top bar.
- Inside, three blocks the reader can switch between (or stacked): **Неделя ·
  Месяц · Вся карта**.
- The digest describes the **whole map** (ignores active map/table filters) —
  it's a state-of-the-map briefing, not a filtered slice.

## Time windows (anchored at `META.generated`)
- **Week**: `(gen − 7d, gen]`, prior week `(gen − 14d, gen − 7d]` for deltas.
- **Month**: `(gen − 30d, gen]`, prior month for deltas.
- **Overall**: all flows in the map.
- Reuses the date helpers/pattern already in `clusterStats.js` (`momentum`).

## What each window reports
- **Headline**: disclosed inflow (`$`), deal count, confirmed vs candidate
  split — same basis rules as the cluster reports (confirmed = verified /
  verified_alpha; undisclosed = 0).
- **Top investors by size** — group window flows by source, sum amount, top 5.
- **Top beneficiary companies** — group by target, top 5.
- **Top sectors by inflow** — group by sector, with share of the window.
- **Biggest single deal** in the window.
- **New entrants** — allocators whose first flow lands inside the window.
- **Fired signals** inside the window.
- **Sector-shift narrative vs the prior window** — which layers gained / lost
  share (e.g. "фокус сместился из AI-приложений в энергетику и железо").

## Narrative
- **Deterministic, templated Russian prose** built from the computed deltas
  (no LLM). A few sentences per window that read as "what happened this week,
  who led, where the money moved" — enough to understand the mood from the
  summary alone.

## Files
- `src/components/research/capitalflow/digest.js` — pure builders: window
  slicing, metric roll-ups, narrative text. No React, unit-testable.
- `src/components/research/capitalflow/DigestView.jsx` — the UI. Reuses the
  report's visual bits (Bar / NameRow patterns) for consistency.
- `src/components/research/capitalflow/CapitalFlowMap.jsx` — add a `'digest'`
  value to `view`, a top-bar button, and render `DigestView`.

## Defaults I'll use unless you say otherwise
- Top-N = 5 per list.
- `$` rankings use confirmed-disclosed amounts (report basis); counts include
  candidates, labelled.
- Placed as the 3rd view (not a new top-level nav item), since it's entirely
  derived from the capital map.

## Explicitly out of scope for v1 (later)
- Outflows / net flows.
- Cross-cycle cumulative trend line ("mood over time") — needs archived history
  from the engine.
- Email / Telegram delivery.
