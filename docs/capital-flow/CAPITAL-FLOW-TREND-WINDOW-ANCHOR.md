# Engine follow-up — anchor trend windows to newest verified flow

**Paste this into the Capital Flow engine's Claude Code session** (`~/Desktop/Capital Flow`).

## The symptom

`trends.week` is shipping empty this cycle even though the last engine week
DID produce clusters worth flagging. The dashboard's weekly tab is holding
the Aug 1-7 batch (correctly — see below), but every trend for that batch
sits in `trends.month`, not `trends.week`, so the "тренды окна" section on
the weekly tab is empty while the numeric summary above it is full.

## Root cause

Stage B's clustering window is anchored on `generated` — the run date, currently
2026-08-16. But the *verified* flows this run confirmed all landed on or before
2026-08-07. The last 7 days of that window (Aug 9-16) contain only unverified
candidates (the NVIDIA JV Jensen-Huang-tweet cluster), so `subsector_swarm`'s
`min_allocators: 2` gate can't fire on them and week trends come back empty.

The dashboard has already applied the same fix on its own digest side (commit
`f8315aa`, "Capital Flow: anchor digest windows to last confirmed flow, not
run date"): the weekly / monthly digest windows now anchor on the newest
verified/verified_alpha flow date instead of `generated`, so a cycle without
late-week confirmed activity doesn't wipe the briefing to zero. Trends need
the mirror-image fix on the engine side.

## The change

In whichever query drives Stage B's `subsector_swarm` (and any other
window-scoped trend rule):

- Instead of `WHERE flow.date >= (generated - 7 days)`, use
  `WHERE flow.date >= (max_verified_date - 7 days)`, where `max_verified_date`
  is `MAX(date) FROM flows WHERE status IN ('verified','verified_alpha')`
  within the current `run_week`.
- Same substitution for the 30-day window driving `trends.month`.
- All-time window (`trends.all`) needs no change.

The intent is *"the last 7 days the engine actually saw confirmed money
move"*, not *"7 calendar days before the run"* — matching how a human reader
naturally reads the weekly tab. When a cycle does confirm a late-week deal,
`max_verified_date == generated` and behaviour is unchanged.

## Downstream: dedupe is dashboard-side, not engine-side

The dashboard now (commit shipping alongside this note) buckets each
`cluster_id` into the NARROWEST engine window it appears in — so a cluster
tagged `week` never repeats in `month` or `all`. That side is settled; the
engine should keep emitting each cluster in every window it qualifies for,
same as today. Do NOT filter engine-side — the dashboard needs the "in which
windows did this qualify" signal intact to bucket correctly.

## Why this matters

Right now the weekly tab reads as "the interesting stuff happened but the
engine has nothing to say about it," which is worse than the previous rolling
7-day view (which just read as "nothing happened"). Anchoring the trend
windows the same way the digest windows are anchored keeps the two sides of
the tab consistent — if the numeric summary can populate off Aug 1-7 verified
flows, so should the trend cards.
