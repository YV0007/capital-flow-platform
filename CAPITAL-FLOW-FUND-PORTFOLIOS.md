# ENGINE HANDOFF — Fund portfolios: make them complete, deep, and self-running

**To:** the Capital Flow engine session.
**Date:** 2026-08-25.
**Goal:** every allocator on the map shows a real portfolio, refreshed monthly,
with no human launching anything.

---

## 0. Why you are being asked

On the dashboard, clicking a fund opens a panel with a **ПОРТФЕЛЬ ФОНДА** block.
For seven allocators it shows the real portfolio, grouped by sector, with notes
and source links — it looks great and it is exactly what we want everywhere.

For the other **36 it says «Список компаний фонда движок пока не прислал»** —
Thrive Capital, Sequoia, Founders Fund, Khosla Ventures, KKR, BlackRock, SoftBank,
MGX, Mubadala. That string is accurate. The engine has never sent them.

**Nothing is broken on the dashboard, and nothing needs building there for the
private book.** The renderer works; it is starved of data. This handoff is
entirely engine-side.

---

## 1. Diagnosis — it is not broken, it was never run

`tools/make_holdings_batches.py` is correct: it selects every fund/firm lacking
holdings, ordered by capital, and writes
`runs/<week>/holdings/batch-N/batch_entities.json`.

But the step that **actually collects** is manual. `RUNBOOK.md` step 3d:

> Launch one holdings-profiler agent (`agents/holdings-profiler.md`) per batch,
> writing `holdings.json` beside each input, then re-run the pipeline to ingest.

Nothing launches those agents. `run_week.py` calls `holdings.ingest_week(week)`,
which only ingests `holdings.json` files that already exist. No files → no
holdings → **no error**.

The run history:

| week | batch dirs written | `holdings.json` produced |
|---|---|---|
| 2026-W32 | — | — |
| 2026-W33 | 4 | **0** — batches generated, agents never launched |
| 2026-W34 | 4 | **3** — three of four agents ran |
| 2026-W35 | — | generator never run |

**Those three W34 batches are the entire origin of every portfolio on the site.**
The seven funds that work are simply the ones that landed in batches 1–3. Thrive,
Sequoia, Founders Fund and Khosla were in batch 4, or in W33's never-run batches.

### Why it never self-heals

1. **Ingest is cumulative by design** — `engine/holdings.py`: *"upsert on (entity,
   name), never delete — a quiet cycle never drops a fund's portfolio."* Right for
   stability, but a fund never collected stays never collected. Nothing retries.
2. **A skipped step is indistinguishable from a quiet week.** Both print
   `[holding] 0 portfolios`.
3. **The audit already catches it and is ignored.** W7 fires every week on exactly
   the right funds — `W7 Thrive Capital: $6.6B fund/firm with no holdings
   collected`, 12 of them. It is a *warning*, so `audit.passed` stays `true` and
   the week ships green.

**Root cause:** fund holdings are the only part of the pipeline that require a
human to launch agents by hand, and that hand-off was skipped in two of the last
three weeks.

---

## 2. The second problem — the ones that "work" are thin

Even the seven that ran are far below the contract they were given.
`agents/holdings-profiler.md` says: *"ship **at least the top 25** per entity;
more is better."* What actually arrived:

| fund | sent | true total | coverage |
|---|---|---|---|
| DigitalBridge | 32 | 32 | 100% |
| Altimeter | 14 | 18 | 78% |
| Brookfield | 20 | 60 | 33% |
| Blackstone | 14 | 53 | 26% |
| Apollo | 15 | 190 | 8% |
| **Coatue** | **16** | **250** | **6%** |
| **Andreessen Horowitz** | **49** | **1458** | **3%** |

Four of seven shipped **fewer than the mandated 25**. The dashboard honestly
prints "Топ 16 из 250 компаний портфеля · движок прислал 16" — which reads as the
engine giving up.

So the fix is not only "run it for the other 36". It is "run it properly for all
43".

---

## 3. On 13F — it cannot deliver most of these funds

The original ask was "pull them from 13F filings or the fund websites". One
correction that shapes the design:

**Form 13F covers US-listed equity securities only**, held by managers with over
$100M in 13(f) securities. Thrive Capital's positions are OpenAI, Stripe, SpaceX,
Anthropic — private companies. They appear in **no** 13F, ever. Same for Sequoia,
Founders Fund, Khosla, MGX, and SoftBank's private book. Pointing 13F at them
returns nothing and looks like a new bug.

That is exactly why the seven that work came from **portfolio pages**, and why
`holdings-profiler.md` is built around `portfolio_url`.

There are two different books:

| | **Private book** | **Public book** |
|---|---|---|
| Who | VC / PE / sovereign — Thrive, Sequoia, Founders Fund, Khosla, MGX | 13F filers — BlackRock, KKR, Apollo, Blackstone, Coatue, Altimeter |
| Source | fund portfolio page, press releases, Form ADV/D | SEC EDGAR 13F-HR / 13D / 13G |
| Nature | changes continuously, no exit date | complete snapshot per quarter |
| Cadence | collect monthly | changes quarterly, filed ~45d after quarter end — poll monthly |
| Machinery | `agents/holdings-profiler.md` — **works, under-run** | `engine/fund_13f.py` — **already built** |

Some firms need both. **Coatue is the proof**: its `portfolio_url` is literally
`coatue.com/privates-portfolio`, and it is simultaneously fund `coatue` in the
Fund Tracker with a full 13F book (CIK, CUSIP, shares, weights, `as_of:
2026-06-30`, `filed: 2026-08-12`).

You already own a complete quarterly 13F pipeline — `engine/fund_13f.py`,
`fund_ingest.py`, `fund_holders.py`, `fund_crosscheck.py`,
`config/fund_managers.yaml` — producing `fund-tracker/1` for 18 hedge funds. It
needs **aiming at capital-map allocators**, not building.

---

## 4. TASK A — a scheduled monthly run that needs no human

**This is the core of the job. Everything else is secondary.**

### Cadence: monthly

Not weekly — a venture portfolio does not change enough in seven days to justify
re-researching 43 funds, and the weekly pipeline is already the busiest thing in
the system. Not quarterly — too slow for the private book, and (see Task C) the
wrong cadence for 13F too. Monthly serves both books and matches the ecosystem
map's existing monthly rhythm.

### Give it its own entry point

Like `run_network.py` for the ecosystem map:

```bash
python run_holdings.py            # current month
python run_holdings.py 2026-08    # a specific month
```

It must do the whole job with no step waiting on a person:

1. **Generate batch inputs** — `make_holdings_batches` for every fund/firm still
   lacking holdings *or whose holdings are below the depth floor* (see Task B).
   The existing query is already correct; extend the `WHERE` for depth.
2. **Launch one `holdings-profiler` agent per batch and wait for all of them.**
   *This is the step that has never been automated and the entire reason 36 funds
   are empty.* It is the difference between a runbook instruction and a pipeline.
3. **Ingest** the resulting `holdings.json` files — `holdings.ingest_week`,
   unchanged.
4. **Refresh the public book** for any node carrying a `cik` (Task C). A cheap
   no-op in the two months out of three when no new 13F has landed.
5. **Audit → deliver → build-gate → push.** Reuse `run.sh`'s existing gate: if the
   dashboard does not compile, do not deploy.

### Then actually schedule it

A cron / routine firing `run_holdings.py` on a fixed day each month. Use the
**20th or later** — 13F filings land ~45 days after quarter end (Q2 2026 → filed
2026-08-12), so a late-month run catches the new quarter's filings in the same
pass instead of a month late.

### Make a skipped or partial run loud

After ingest, compare batch inputs written against `holdings.json` files found.
**Inputs with no result is not a quiet month — it is a step that did not run.**
That is precisely W33 (4 batches, 0 results) and W34 (4 batches, 3 results). It
must be reported separately from "0 new holdings", and it must fail the run.

### Promote W7 to an error

A ≥$5B fund with zero holdings after two consecutive monthly runs should **fail
the audit**, not warn. Twelve funds have been warning every week while the week
shipped green — that is how this stayed invisible for three weeks.

---

## 5. TASK B — depth: enforce the contract that already exists

1. **Enforce the ≥25 floor at ingest.** `agents/holdings-profiler.md` already
   mandates "at least the top 25 per entity". Make the pipeline check it: a
   returned portfolio with fewer than 25 holdings **and** `holdings_count > 25` is
   an under-delivery — re-queue that entity next run and warn.
2. **Backfill the thin seven**, not just the empty 36. Coatue (16/250), a16z
   (49/1458), Apollo (15/190), Blackstone (14/53), Brookfield (20/60) all need a
   deeper pass.
3. **For very large portfolios, relevance beats completeness.** a16z has 1458
   holdings; nobody wants all of them, and 49 arbitrary ones are worse than 50
   chosen ones. Rank by relevance to *this map* — AI, semiconductors,
   infrastructure, energy, data: the sectors Capital Flow exists to track — then
   by stake size and notability. Keep `holdings_count` as the true total so the UI
   can keep saying "top 50 of 1458" honestly.
4. **Keep names byte-identical to map node labels** where a holding is also a
   tracked entity. The dashboard links those rows straight through to the node,
   and a near-miss name silently breaks the link.

**Priority order for the backfill** (by capital deployed — these are the ones a
user actually clicks): **Thrive Capital, Sequoia, Founders Fund, Khosla Ventures,
KKR, BlackRock, SoftBank, MGX, Mubadala**, then the thin seven above.

Expect the first run to be much larger than steady state. After it, each month
picks up only new funds and those that drifted below the floor.

---

## 6. TASK C — the public book, polled monthly

1. **Map allocator nodes to CIKs.** Extend `config/fund_managers.yaml` (or a
   sibling) so a capital-map allocator can carry a `cik`. Start with the ones that
   genuinely file: BlackRock, KKR, Apollo, Blackstone, Coatue, Altimeter,
   Brookfield, Goldman Sachs.
2. **Reuse `fund_13f.py` unchanged** to pull the latest 13F-HR and emit positions
   in the existing `fund-tracker/1` position shape.
3. **Attach under a separate key** — `public_book`, see Task D. Do **not** merge
   into `holdings[]`. They are different objects with different provenance,
   cadence and meaning: a 13F line is a marketable position with a share count and
   a quarter stamp; a portfolio-page line is a venture stake with no exit date.
4. **Poll monthly even though the data is quarterly.** This sounds wrong and is
   not: filing dates drift (Q2 2026 → filed 2026-08-12, `latency_days: 52`), so a
   quarterly tick can land on the wrong side of a filing and carry stale positions
   for three more months. A monthly poll picks each filing up within weeks. Two
   months out of three it is a cheap no-op — compare EDGAR's latest filing date
   against the stored `filed` and stop.
5. **Snapshot semantics, not cumulative.** This is the one place the "never
   delete" rule must NOT apply. A 13F is a complete point-in-time list; a position
   that vanished was **sold**. Replace the public book wholesale each quarter,
   keeping prior quarters so the `action` / `share_delta_pct` / `quarters_held`
   derivations the Fund Tracker already computes keep working.
6. **Carry `filed` and `latency_days` through** so the dashboard can show how far
   backwards the snapshot looks. A 13F is always a look backwards, and hiding that
   would misrepresent it as current.

---

## 7. TASK D — contract addition

Purely additive to the existing node. Nothing already shipped changes.

```jsonc
{
  // ── existing, unchanged — the PRIVATE book ─────────────────────────
  "holdings": [ /* name, sector, subsector, note, stake, lead, as_of, source_url */ ],
  "holdings_count": 250,          // TRUE total; array may be a ranked subset
  "holdings_as_of": "2026-08-17",
  "portfolio_url": "https://www.coatue.com/privates-portfolio",

  // ── new — the PUBLIC book, straight from 13F ───────────────────────
  "public_book": {
    "cik": "0001135730",
    "as_of": "2026-06-30",          // quarter end the filing covers
    "filed": "2026-08-12",          // when it hit EDGAR
    "latency_days": 52,             // as_of → today; the staleness the UI shows
    "source_form": "13F-HR",
    "source_url": "https://www.sec.gov/Archives/edgar/...",
    "position_count": 63,           // TRUE total, may exceed the array
    "total_value_usd": 24700000000,
    "positions": [                  // top N by weight; fund-tracker/1 shape
      {
        "ticker": "NVDA", "issuer": "NVIDIA", "cusip": "67066G104",
        "weight": 0.184, "shares": 12400000, "value_usd": 4550000000,
        "instrument": "common", "action": "add",
        "share_delta_pct": 0.12, "prior_shares": 11071428, "quarters_held": 7,
        "sector": "semiconductors"
      }
    ]
  }
}
```

**Rules that keep the two books honest:**

- A fund with only a private book renders exactly as it does today.
- A fund with only a public book shows the 13F table and no venture list.
- A fund with both (Coatue, Altimeter) shows both, clearly labelled, **never
  summed into one number**. They overlap conceptually; adding them would
  double-count and state something false.
- **`public_book` absent ≠ empty.** Absent = "not a filer / not mapped". An empty
  `positions` array with a real `filed` date = "filed, held nothing reportable".
  The dashboard must distinguish these, so never emit an empty object as a
  placeholder.

---

## 8. Acceptance

0. **`python run_holdings.py` completes with no human in the loop** — batches
   generated, agents launched, results ingested, audit run, dashboard deployed —
   and a scheduled job fires it monthly on the 20th or later.
1. `python tools/make_holdings_batches.py <week>` prints `0 funds/firms missing
   holdings` — the condition its own docstring calls done.
2. Thrive Capital, Sequoia, Founders Fund and Khosla Ventures each carry a
   populated `holdings[]` with real `source_url`s and a `portfolio_url`.
3. **No fund with `holdings_count > 25` ships fewer than 25 holdings.** Coatue is
   no longer 16 of 250.
4. Zero W7 warnings in `audit.warnings`.
5. At least one node carries a `public_book` whose `as_of` is the most recent
   completed quarter.
6. A run where the collection step is skipped **fails loudly** instead of shipping
   green.

---

## 9. Boundary — what the dashboard does

- **Private book: nothing.** `holdings[]`, `holdings_count`, `holdings_as_of` and
  `portfolio_url` all render today, in both the side panel (top 5 + «все компании
  фонда») and the full sectioned portfolio view. Deeper data appears the moment it
  lands, with no code change.
- **Public book:** needs a new block, which I build once the shape above is
  agreed — the same way the Fund Tracker was built against `fund-tracker/1` before
  the real payload existed. Ship the contract and the renderer will be ready.
- **Do not change** `holdings[]`'s existing field names, or the meaning of
  `holdings_count` (true total, not array length). Both are load-bearing in the
  current UI.
