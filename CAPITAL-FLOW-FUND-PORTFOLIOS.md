# Fund portfolios — why 36 of 43 allocators are empty, and how to fix it

**Status:** diagnosis complete (dashboard side is fine — nothing to fix there).
**Audience:** the Capital Flow engine session.
**Date:** 2026-08-25.

---

## Part 1 — The diagnosis

### It is not broken. It was never run.

The fund-portfolio feature is built end to end and works. Proof: Coatue,
Andreessen Horowitz, Altimeter, Brookfield, Blackstone, Apollo and DigitalBridge
all render full portfolios in the dashboard today, sectioned by sector, with
per-holding notes and source links.

The other 36 allocators — Thrive Capital, Sequoia, Founders Fund, Khosla
Ventures, KKR, BlackRock, SoftBank, MGX, Mubadala — show *«Список компаний фонда
движок пока не прислал»*. That string is correct: the engine has never sent them.

### The exact failure

`tools/make_holdings_batches.py` selects every fund/firm lacking holdings and
writes `runs/<week>/holdings/batch-N/batch_entities.json`. It works — the query
is right, ordering by capital descending.

But the step that **actually collects** is manual. From `RUNBOOK.md` step 3d:

> Launch one holdings-profiler agent (`agents/holdings-profiler.md`) per batch,
> writing `holdings.json` beside each input, then re-run the pipeline to ingest.

Nothing launches those agents. `run_week.py` calls `holdings.ingest_week(week)`,
which only ingests `holdings.json` files that already exist. No files, no
holdings, no error.

What the run history shows:

| week | batch dirs | `holdings.json` results |
|---|---|---|
| 2026-W32 | — | — |
| 2026-W33 | 4 | **0** — batches generated, agents never launched |
| 2026-W34 | 4 | **3** — three of four agents ran |
| 2026-W35 | — | — — generator not run at all |

**Those three W34 batches are the entire origin of every portfolio on the site.**
The seven funds that work are simply the ones that happened to land in batches
1–3. Thrive, Sequoia, Founders Fund and Khosla were in batch 4 or in W33's
never-run batches.

### Why it never self-heals

Three properties combine into a silent, permanent gap:

1. **Ingest is cumulative by design** (`engine/holdings.py`: "upsert on (entity,
   name), never delete — a quiet cycle never drops a fund's portfolio"). Correct
   for stability, but it means a fund that was never collected stays never
   collected. There is no pressure to retry.
2. **A skipped step is indistinguishable from a quiet week.** `ingest_week`
   returns zeros for both and the pipeline prints `[holding] 0 portfolios`.
3. **The audit already catches it and is ignored.** W7 fires every week on
   exactly the right funds:

   ```
   W7 Thrive Capital: $6.6B fund/firm with no holdings collected
   W7 Sequoia: $2.8B fund/firm with no holdings collected
   W7 Founders Fund: $1.5B fund/firm with no holdings collected
   … 12 total
   ```

   It is a **warning**, so `audit.passed` stays `true` and the week ships green.

**Root cause in one line:** fund holdings are the only part of the weekly
pipeline that require a human to launch agents by hand, and that hand-off has
been skipped in two of the last three weeks.

---

## Part 2 — About 13F specifically

The ask was "pull them from 13F filings or the fund websites". One correction
that changes the design:

**13F cannot deliver these funds.** Form 13F covers *US-listed equity
securities* held by managers with over $100M in 13(f) securities. Thrive
Capital's positions are OpenAI, Stripe, SpaceX, Anthropic — private companies.
They appear in **no** 13F, ever. Same for Sequoia, Founders Fund, Khosla, MGX and
SoftBank's private book. Filing 13Fs and finding nothing would look like a bug.

This is exactly why the seven that work came from **portfolio pages**, not
filings — and why `holdings-profiler.md` is built around `portfolio_url`.

So there are two different books, needing two different sources:

| | **Private book** | **Public book** |
|---|---|---|
| Who | VC / PE / sovereign — Thrive, Sequoia, Founders Fund, Khosla, MGX | 13F filers — BlackRock, KKR, Apollo, Blackstone, Coatue, Altimeter |
| Source | fund portfolio page, press releases | SEC EDGAR 13F-HR / 13D / 13G |
| Cadence | changes continuously — collect monthly | changes quarterly, filed ~45d after quarter end — poll monthly |
| Exists? | `holdings-profiler.md` — **works, under-run** | `engine/fund_13f.py` — **already built** |

Several firms need both. Coatue is the proof: its `portfolio_url` is literally
`coatue.com/privates-portfolio`, and it is simultaneously fund `coatue` in the
**Fund Tracker** with a full 13F book (CIK, CUSIP, shares, weights,
`as_of: 2026-06-30`, `filed: 2026-08-12`).

### The machinery you already have

`engine/fund_13f.py`, `fund_ingest.py`, `fund_holders.py`, `fund_crosscheck.py`
and `config/fund_managers.yaml` produce `fundTracker.json` (schema
`fund-tracker/1`) for 18 hedge funds, with per-position `ticker, cusip, weight,
shares, value_usd, action, share_delta_pct, prior_shares, quarters_held,
source_form, as_of, filed, latency_days, source_url`.

That is a complete, working quarterly 13F pipeline. It is pointed at hedge funds
and is **not** wired to capital-map allocator nodes. Nothing new needs building
for the public book — it needs *aiming*.

---

## Part 3 — What to build

### A. Make it a SCHEDULED MONTHLY RUN that needs no human

This is the core of the fix. Everything else below is secondary.

**Cadence: monthly.** Not weekly — a venture portfolio does not change enough in
seven days to justify re-researching 43 funds, and the weekly pipeline is already
the busiest thing in the system. Not quarterly — that is too slow for the private
book, and (see B) it is actually the *wrong* cadence for 13F too. Monthly is the
one cadence that serves both books, and it matches the ecosystem map's existing
monthly run, so the engine already has that rhythm.

**Give it its own entry point,** the way the network map has `run_network.py`:

```bash
python run_holdings.py            # current month
python run_holdings.py 2026-08    # a specific month
```

It must do the whole job end to end, with no step waiting on a person:

1. Generate batch inputs — `make_holdings_batches` for every fund/firm still
   lacking holdings (the existing query is already correct).
2. **Launch one `holdings-profiler` agent per batch and wait for all of them.**
   This is THE step that has never been automated, and the entire reason 36 funds
   are empty. It is the difference between a runbook instruction and a pipeline.
3. Ingest the resulting `holdings.json` files (`holdings.ingest_week`, unchanged).
4. Refresh the public book for any node with a `cik` — see B. A no-op in the two
   months out of three when no new 13F has landed.
5. Run the audit, deliver to the dashboard, build-gate, push. Reuse `run.sh`'s
   existing build-gate: if the dashboard does not compile, do not deploy.

**Then schedule it.** A cron/routine firing `run_holdings.py` on a fixed day each
month — the 20th or later is the useful choice, because 13F filings land ~45 days
after quarter end (Q2 2026 → filed 2026-08-12) and a late-month run catches the
new quarter's filings in the same pass rather than a month late.

**Make a skipped or partial run loud.** After ingest, compare batch inputs written
against `holdings.json` files found. Inputs with no result is not a quiet month —
it is a step that did not run, and it is exactly what happened in W33 (4 batches,
0 results) and W34 (4 batches, 3 results). It must be reported separately from
"0 new holdings", and it should fail the run.

**Promote W7 to an error above a threshold.** A ≥$5B fund with zero holdings after
two consecutive monthly runs should fail the audit, not warn. Right now twelve
funds warn every week and the week still ships green — which is precisely how this
stayed invisible for three weeks.

**Backfill the 36 on the first run.** Priority order by capital deployed:
**Thrive Capital, Sequoia, Founders Fund, Khosla Ventures, KKR, BlackRock,
SoftBank, MGX, Mubadala.** These are the ones a user actually clicks. Expect the
first run to be much larger than steady state — after it, each month only picks up
newly-added funds.

No contract change for the private book. The dashboard renders those the moment
they arrive.

### B. Add the public book — checked monthly, changes quarterly

1. **Map allocator nodes to CIKs.** Extend `config/fund_managers.yaml` (or a
   sibling) so a capital-map allocator can carry a `cik`. Start with the ones
   that genuinely file: BlackRock, KKR, Apollo, Blackstone, Coatue, Altimeter,
   Brookfield, Goldman Sachs.
2. **Reuse `fund_13f.py` unchanged** to pull their latest 13F-HR and emit
   positions in the existing `fund-tracker/1` position shape.
3. **Attach to the node under a separate key** — see contract below. Do **not**
   merge public positions into `holdings[]`. They are different objects with
   different provenance, different cadence and different meaning: a 13F line is a
   marketable position with a share count; a portfolio-page line is a venture
   stake with no exit date.
4. **Poll monthly, even though the data is quarterly.** This sounds wrong and is
   not. 13F lands ~45 days after quarter end, but the exact filing date drifts
   (Q2 2026 → filed 2026-08-12, `latency_days: 52`). A quarterly tick can easily
   fall on the wrong side of a filing and carry stale positions for three more
   months; a monthly poll picks each filing up within weeks of it appearing. In
   the two months out of three with nothing new, the step is a cheap no-op —
   compare the latest EDGAR filing date against the stored `filed` and stop.
   Carry `filed` + `latency_days` through either way, so the dashboard can show
   how far backwards the snapshot looks. A 13F is always a look backwards.
5. **Snapshot semantics, not cumulative.** This is the one place the "never
   delete" rule must NOT apply. A 13F is a complete point-in-time list; a
   position that vanished was sold. Replace the public book wholesale per
   quarter, keeping prior quarters for the `action` / `share_delta_pct` /
   `quarters_held` derivation the Fund Tracker already computes.

### C. Contract addition

Additive to the existing node. Nothing already shipped changes.

```jsonc
{
  // ── existing, unchanged: the PRIVATE book ──────────────────────────
  "holdings": [ /* name, sector, subsector, note, stake, lead, as_of, source_url */ ],
  "holdings_count": 250,
  "holdings_as_of": "2026-08-17",
  "portfolio_url": "https://www.coatue.com/privates-portfolio",

  // ── new: the PUBLIC book, straight from 13F ────────────────────────
  "public_book": {
    "cik": "0001135730",
    "as_of": "2026-06-30",          // quarter end the filing covers
    "filed": "2026-08-12",          // when it hit EDGAR
    "latency_days": 52,             // as_of → today; the staleness the UI shows
    "source_form": "13F-HR",
    "source_url": "https://www.sec.gov/Archives/edgar/...",
    "position_count": 63,           // TRUE total, may exceed the array
    "total_value_usd": 24700000000,
    "positions": [                  // top N by weight; same shape as fund-tracker/1
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

**Rules to keep the two books honest:**

- A fund with only a private book keeps rendering exactly as it does today.
- A fund with only a public book shows the 13F table and no venture list.
- A fund with both (Coatue, Altimeter) shows both, clearly labelled, never summed
  into one number. They overlap conceptually and double-counting would be a lie.
- `public_book` absent ≠ empty. Absent means "not a filer / not mapped"; an empty
  `positions` array with a real `filed` date means "filed, held nothing
  reportable". The dashboard must be able to tell those apart, so do not emit an
  empty object as a placeholder.

---

## Acceptance

0. **`python run_holdings.py` completes with no human in the loop** — batches
   generated, agents launched, results ingested, audit run, dashboard deployed —
   and a scheduled job fires it monthly.
1. `python tools/make_holdings_batches.py <week>` prints `0 funds/firms missing
   holdings` — the condition its own docstring calls done.
2. Thrive Capital, Sequoia, Founders Fund and Khosla Ventures each carry a
   populated `holdings[]` with real `source_url`s and a `portfolio_url`.
3. Zero W7 warnings in `audit.warnings`.
4. At least one node carries a `public_book` whose `as_of` is the most recent
   completed quarter.
5. A run where the collection step is skipped fails loudly instead of shipping
   green.

## What the dashboard does on delivery

Nothing. `holdings[]` renders already. `public_book` needs a new block, which I
build once the shape lands — the same way the Fund Tracker was built against
`fund-tracker/1` before the real payload existed.
