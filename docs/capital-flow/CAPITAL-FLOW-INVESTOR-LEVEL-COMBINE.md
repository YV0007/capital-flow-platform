# Fix — investor "level" must show rank AND why, not one or the other

**For a fresh Claude Code session in this repo** (`ab-investment`) — context in the
session that designed this got too large to keep working in, so this is
self-contained. No engine involvement; everything here is `classification.js`
and two of its consumers.

## Where things stand

`classification.js` computes, per allocator/target, entirely deterministically:
- `playerRank` / `dealRank` — quantile-based tier: `core` (~top 10%) / `key`
  (~next 25%) / `watch` (rest), for players; `flagged` / `emerging` for deals.
- `playerArchetype` / `dealArchetype` — a single style tag (`trend`,
  `fundamental`, `aggressive`, `proven` for players; `actionable`, `early`,
  `smart-money`, `independent` for deals) from a priority-ordered rule
  cascade, or `null` if no rule cleared.
- Exported label/color maps already exist: `RANK_LABEL`, `RANK_COLOR`,
  `ARCHETYPE_LABEL` (all in `classification.js`).

Two consumers render this today, **`EntityPanel.jsx`** (the header badge) and
**`EntityTable.jsx`** (the "Уровень" column) — both currently do:

```js
label = (archetype && ARCHETYPE_LABEL[archetype]) || RANK_LABEL[rank] || rank
```

— i.e. **archetype OR rank, never both.** That's the bug. Rank color is still
applied to the badge, but the rank *word* disappears the moment an archetype
exists, which is most of the time.

## Why this is wrong for the actual user

The whole point of "investor level" is to answer, at a glance, "how high does
this rank, and does that mean anything." An archetype word alone (e.g.
"Проверенный") tells you *why* someone stands out but not *how much* —
whether they're the single-most-convinced core-tier name on the map, or a
middling key-tier name that also happens to clear the "proven" bar. Right now
that distinction only lives in badge *color*, which nobody reads correctly on
a first visit without memorizing the legend. A tool has to be legible without
that.

Already-rejected alternative, for context: an earlier version showed a raw
numeric score next to the driving factor (`59 · Повтор`). That was explicitly
killed as too crowded for this dashboard. **Don't reintroduce a number.** The
fix here is two words, not a number.

## The fix

In both `EntityPanel.jsx`'s badge derivation and `EntityTable.jsx`'s
`scoreDriver()`, combine instead of choosing:

```js
label = archetype
  ? `${RANK_LABEL[rank]} · ${ARCHETYPE_LABEL[archetype]}`   // "Ядро · Проверенный"
  : RANK_LABEL[rank]                                         // "Набл." — no archetype cleared
```

- Watch-tier (or non-flagged deal) with no archetype: **just the rank word**,
  nothing invented — matches today's behavior for the bottom tier, where
  showing an archetype would overstate confidence.
- Keep the existing rank-based color on the badge/cell — that part is
  already correct and doesn't need to change, just the text.
- `EntityPanel.jsx`'s badge `title` tooltip and `EntityTable.jsx`'s cell
  `title` should still explain in one line that this is "rank · style, not
  size of capital" — both already have similar copy, just update to reflect
  the combined text.

## Explicitly out of scope — do not touch

The map canvas (`FlowGraph.jsx`) was deliberately changed this session to
show **only** the red pivotal bloom for rank (color + intensity), with the
old rank pips removed entirely, precisely to avoid stacking more marks on an
already-dense canvas. **Do not add archetype text or any new mark to the
canvas.** This fix is scoped to the two text surfaces (panel badge, table
column) only.

## Before calling this done

Build (`npm run build`), then actually open the map in a browser and click
into a node with a real archetype (e.g. any current "Проверенный"/
"Фундаментальный" name) to confirm the badge reads `Rank · Archetype`, not
just one half. The session that designed this fix could not get a reliable
click-to-open on the map panel through browser automation here — verify this
one visually before shipping.
