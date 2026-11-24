# Capital Flow

**Most market tools tell you what was announced. This one tracks what was actually funded —
and automates the due diligence that separates the two.**

Live: **[ab-investment.vercel.app](https://ab-investment.vercel.app)**

---

## The problem

If you want to know where serious money is moving in AI infrastructure, your options are bad.
News tells you what was *announced* — and an announcement is not a cheque. PitchBook and
Preqin tell you what closed, months later, behind a paywall. Neither answers the question
that actually matters: **who moved first, who followed, and which companies the whole stack
quietly depends on.**

That research is doable by hand. One analyst, reading filings and investor pages all week,
can hold a picture of maybe twenty allocators. The work is mechanical, it never ends, and it
doesn't compound — stop for a month and the picture is stale.

## What this does

It runs that analyst's week as a pipeline, every week, without one.

**Agents do the reading.** Six research agents work a watchlist of 69 allocators across SEC
EDGAR, investor press pages, government databases and the specialist press, looking for one
thing: capital that actually moved. Not opinions, not MOUs, not product launches — money
committed, by whom, to whom, on what date.

**Code decides what's true.** Nothing an agent finds is trusted on its own. Every claim must
cite a resolved document, gets graded by how good that source is, and is checked against what
the database already holds. What fails is rejected with a reason attached and fed back to the
agent that caused it — never dropped quietly.

**The result is a graph you can interrogate.** Not a feed. You can ask who else backed this
company, which sub-sector just got crowded, what breaks if this supplier disappears — and
every number has a document behind it.

Across 14 weekly runs: **2,999 sources checked, 461 verified events, 127 documented
candidates.** 59% of those sources yielded nothing and are logged anyway — that is what makes
"we didn't miss it" a checkable claim rather than a hope.

## What you actually see

| | The question | A node is |
|---|---|---|
| **Capital flows** | Where did money go, who moved first, who followed | An allocator, or a company receiving capital |
| **Ecosystem** | Who holds a function the AI stack can't run without | A company, technology or regulator the stack depends on |
| **Fund tracker** | What do respected managers hold right now | A position in a fund's book |

Today: **404 entities connected by 543 funded deals** across 18 sectors, **90 signals
currently firing**, and a dependency graph of 108 entities and 314 relationships where
removing NVIDIA costs 1,392 pairs of companies their connection entirely.

## Why it's interesting as engineering

The hard part isn't scraping. It's that **language models are excellent at finding things and
dangerous at asserting them.** An agent asked to research a funding round will happily return
a confident, well-formatted, entirely invented one.

So the system is built around a single split: **search is autonomous, output is
deterministic.** Agents may be creative about *finding*. They get no say in what becomes a
fact. Between the two sits Python, SQL, and a set of gates that would rather ship nothing than
ship something wrong.

Everything below is how that split is enforced.

---

# How a week of research actually runs

## 1. The agent is told what it already knows

Before any agent starts, `tools/make_research_batches.py` writes it a context pack —
`runs/<week>/<agent>/context.json`, built from the database. Three sections:

- **What you already have** — per allocator: last event date (*search forward from it, don't
  re-find old deals*), active sectors, known vehicles, aliases (the same entity under another
  name — never file it as new), CIK, recent targets. Plus `stale_candidates`: rows already on
  file that still need a Tier-1 confirm. Chase those first.
- **What worked** — the sources that actually produced events in recent runs. Check them
  before searching broadly.
- **What you got wrong** — real rejected rows from recent runs, each with its lesson and a
  repeat count.

This is memory in files. No fine-tuning, no embeddings, no hidden state — every "lesson" is
plain text a human can read and argue with. An agent that repeats a mistake does so against a
written record of having made it.

## 2. Deterministic lookup before fuzzy search

A known filer and a known form is not a search problem. It's a lookup, and fuzzy search on a
company name is how you file a deal against the wrong entity.

```bash
python -m engine.edgar cik "Blue Owl"                      # resolve the filer, or null
python -m engine.edgar filings NVIDIA --forms 8-K,D --since 2026-08-01
python -m engine.edgar exists --allocator NVIDIA --target "Nebius Group N.V."
```

The third call is mandatory before writing any row. If the pair is already on file, the agent
doesn't re-file it — it notes a stronger source if it has one, and the engine merges forward
instead of creating churn.

Running underneath, `engine/edgar.py` sweeps every tracked entity's EDGAR submissions on a
schedule. **Agents search; this never misses.** But a filing's existence is not a capital
event — an 8-K can be an officer appointment — so the sweep emits *leads*, not events. A lead
is promoted by an agent who reads it, or dismissed with a reason. Nothing is silently dropped.

## 3. A rumour is a lead, not a dead end

The failure mode here is specific: an agent checks SEC, finds nothing, and quits — losing a
real deal that simply wasn't filed yet. So a weak lead runs a fixed escalation loop before it
can be dropped:

1. **Find the origin.** Ten outlets citing one source count as **one** source, not ten. The
   origin URL is recorded, so circular reporting can't masquerade as corroboration.
2. **Primary hunt.** Form D and its related-persons list, 8-K items 1.01/2.01, 13D/G, Form 4,
   the company's own PR and IR — plus Wayback, for pages quietly edited after publication.
3. **Registry and legal.** OpenCorporates for new subsidiaries and SPVs, state filings, UCC
   liens when the deal is debt, court records, HSR/CFIUS for large or cross-border deals.
4. **Corroborating exhaust.** Headcount and role changes, job postings for the funded
   initiative, domain and trademark registrations, construction permits and procurement
   records for datacenters and power, customs and shipping for hardware. *The counterparty
   routinely discloses what the principal won't.*
5. **Triangulate and weigh alternatives.** Two independent confirmations for
   `verified_alpha`; a primary document for `verified`. Then ask what else would explain the
   evidence — an old round resurfacing, a mark-to-market, PR spin — and pick what the evidence
   actually fits.
6. **Grade honestly.** If it can't be confirmed, it's filed as a `candidate` with the reason
   written down. **A documented candidate is data; a silent drop is a miss.**

When the obvious routes fail, the brief names the non-obvious ones: work backwards from the
beneficiary, check the *vehicle* rather than the person, find the debt behind the equity, diff
consecutive 13Fs, read Form D *amendments*.

## 4. The grade is computed, not claimed

Sources are tiered 1–5 by how official they are. SEC filings, IR pages and government
databases confirm; podcasts, X and blogs discover leads and are never stored as verified.
*Tier 5 discovers; Tier 1 confirms.*

Each row then gets a two-axis confidence grade — reliability A–E from the source tier,
credibility 1–5 from corroboration, combined into a 0–100 score. **The agent never types
these.** They're derived on ingest, which is the only reason they're comparable across rows
and across weeks. Anything scoring under 60 stays off the main map and lives in a watch list.

One rule exists purely because it was violated: **a citation must be a resolved document.**
`efts.sec.gov/...?q=Cathedral` resolves to nothing and, for a common word, returns Cathedral
Energy Services and a pile of CLOs. The engine drops a search-query URL and the audit blocks
the release — error class E0.

---

# What the engine does with it

```
          RESEARCH — autonomous, non-deterministic
   agents read the web under the tier ladder, write CSV into runs/<period>/<agent>/
                            │
                            ▼
          ENGINE — deterministic, Python + SQL
   validate → resolve entities → dedupe & merge → grade → SQLite
          → signal rules → beneficiaries → aggregates → audit gate
                            │
                            ▼
          HANDOFF — one validated file per map
   contract-checked before write; refuses to overwrite good with broken
                            │
                            ▼
          DASHBOARD — render only
   React + Vite → Vercel
```

Four boundaries, each load-bearing:

**The database is the single source of truth** — not the agent output, not the payload, not
the dashboard. CSVs are an interchange format that has to pass validation to become data.

**Entity resolution is mandatory, not optional.** Point72 files under six CIKs; Greenlight's
live 13F filer is *DME Capital Management*. Without an alias table the same fund appears three
times at a third of its real size and every downstream score is wrong. One alias table serves
all three pipelines, because NVIDIA has to be one NVIDIA on every map.

**Deduplication merges rather than rejects.** A unique constraint on
`(allocator, target, event_type, disclosed_date)` catches the duplicate, and the stronger
status and better tier win. That's what lets the filings agent re-emit another agent's
`candidate` with a Tier-1 filing attached and have it *upgrade* the existing row.

**The dashboard computes nothing the engine can compute.** Criticality, centrality,
aggregates, staleness, signal strength all arrive calculated. The dashboard styles what the
file says. One number, one place it is computed, no drift between two codebases.

## Three money-hygiene rules, each from a real corruption

These are the clearest illustration of why validation lives in code rather than in a brief —
all three were requested of agents in writing, and all three still happened.

| What arrived | Why it corrupts | The rule now |
|---|---|---|
| A $1.4B post-money round written as `amount_usd = 1400000000` | That's the company's price, not money that moved. It inflates every sector total it touches. | Amount is the allocator's slice, or blank. The round goes in `round_total_usd`, the valuation in `valuation_usd`. Never a silent zero. Audit **W2**. |
| a16z and Sequoia co-led one $160M round; both rows carried the full $160M | The deal reads as $320M. Capital totals are the product; double-counting breaks the product. | Per-allocator slice when disclosed, else blank amount plus `round_total_usd` on each row and the co-leads named. |
| "Atoms" filed from a shoe brand's page | A confidently wrong entity poisons every edge drawn from it. | Two plausible matches means `candidate`, with both named in notes. An honest ambiguity is data. |

**A fourth rule is structural: deltas are computed on share count, never on value.** A
value-based delta invents position changes that never happened, out of price movement alone.

Coverage is measured, not assumed. Three tables exist only to make absence provable:
`source_log` records every source checked including the ones that yielded nothing; `coverage`
reconciles what each agent checked against what it found, per allocator; `leads` holds raw
signals until each is promoted or dismissed **with a reason**.

## Three pipelines

| | **Capital flows** | **Ecosystem** | **Fund tracker** |
|---|---|---|---|
| Unit | a dated **event** | an undated standing **dependency** | a **position / stake / delta** |
| Universe | discovery-shaped — agents hunt leads | scope-shaped — 16 layers, 3 membership checks | closed and curated, never auto-extended |
| Agents | 6, by allocator class | 1 dossier agent + 8 layer sweeps | **none** — mandated filings only |
| Node size | capital | computed criticality | position weight |
| Cadence | weekly | monthly | per filing |

The ecosystem map runs on a stricter evidentiary rule than the flow map, because it asserts
structure rather than events: **no edge exists without a verbatim quote of ≤15 words from a
resolved document.** Every link is re-fetched each run; a dead link costs the edge a
confirmation. And it keeps two measures of importance deliberately unmerged — `criticality`
authored from a node's own filings, `integration` computed from the graph. The interesting
nodes are where they diverge: Carl Zeiss SMT ranks 8th by criticality and last of 108 by
integration, because it holds the optics of every EUV tool on earth and the map has found it
exactly one counterparty. A single blended score hides precisely that.

---

# From research to signal

Verified events are the input, not the product. The product is what SQL finds in them —
eight rules, parameters in config rather than code, evaluated over the event table every run.

| Rule | Fires when |
|---|---|
| `sector_swarm` | ≥3 key allocators put **confirmed** capital into one sector within 30d. Candidates don't count. |
| `subsector_swarm` | ≥2 key allocators converge on one (sector, sub-sector) narrative |
| `theme_swarm` | ≥4 key allocators converge on one theme *across* sectors within 30d |
| `capital_acceleration` | A sector's rolling 90d capital ≥2× the prior 90d |
| `first_entry` | A key allocator enters a sector it had no events in for 365d |
| `smart_money_follow` | One allocator enters, then ≥2 others follow within 21d |
| `stealth_accumulation` | ≥3 separate stakes into one target within 90d |
| `beneficiary_concentration` | ≥3 private flows map to one public ticker |

What that produces on the live data:

- **`smart_money_follow`** — Andreessen Horowitz led in `ai-applications`; **7 allocators
  followed within 21 days**. The lead-time question, answered mechanically.
- **`subsector_swarm`** — 8 key allocators converged on `enterprise-ai-agents`, 6 on
  `legal-regulatory-ai`, 5 on `vertical-saas-ai`. Convergence on a *narrative*, not a sector,
  which is why sub-sectors are a curated vocabulary instead of free text: free text never
  clusters.
- **`stealth_accumulation`** — Harvey: 4 separate stakes inside 90 days, no single round
  large enough to make news.
- **`beneficiary_concentration`** — the private-to-public bridge, and the reason the platform
  exists. 77 tracked private flows read through to **NVDA**, 17 to **TSM**, 11 to **GOOGL**,
  10 to **PWR** (substation and electrical construction for gigawatt campuses), 4 to **BWXT**
  (nuclear fabrication a mass-production reactor programme must draw on). Each carries the
  named private companies and the stated mechanism.

Sub-sector trends run in two stages, and the order matters. **Stage B is mechanical**: SQL
clusters confirmed flows by (sector, sub-sector), then re-checks the bar inside each of three
windows — 7d, 30d, all-time — so a cluster can't qualify once and coast. **Stage A is the
narrative agent**, and it may only write about clusters Stage B already proved. It never finds
a trend. A quiet window ships an empty list; a borderline cluster ships flagged `low`, never
dressed up as certain.

The current top cluster: *Hyperscale Campus* — 6 deals, **$112.5B**, 5 distinct allocators.

## Why it refuses to ship

Trust is the product. A few visible errors and the whole dataset is suspect — so the pipeline
is gated three times:

- **An audit pass runs every cycle.** 7 error classes block delivery outright; 9 warning
  classes ship but are listed. Current run: **audit passing, 0 errors, source-URL coverage
  1.00.**
- **A contract validator runs before every write** and refuses to overwrite a good file with a
  broken one. *Yesterday's truth beats today's lie.* Four suites, **119 cases**, exist only to
  prove the validator still bites — they corrupt a payload twenty ways and demand a rejection
  each time.
- **`npm run build` gates the deploy.** If the dashboard doesn't compile, nothing is pushed.

One warning class is worth naming, because it documents a failure of this design rather than a
success: warnings don't block. W7 — funds with no holdings collected — warned for weeks while
runs shipped green and 36 portfolios stayed empty. The fix wasn't to tune the warning; it was
error class **E6**: a large fund asked for holdings twice in a row and given none is a step
that isn't running, and it now blocks. *One miss is a quiet month. Two in a row is a broken
pipeline.*

---

## Layout

```
├── src/                 the dashboard — React 18 + Vite 5, no backend
│   ├── components/
│   │   ├── research/capitalflow/   flow map: graph, entity panel, holdings, digest
│   │   ├── research/ecosystem/     dependency map: layers, subgraphs, edge cards
│   │   ├── research/funds/         fund tracker
│   │   └── tracker/                positions, signals, memos
│   └── data/            59 JSON files — the only data layer, no database, no API
│
├── engine/              the research + data engine — Python 3.11 + SQLite
│   ├── agents/          26 agent briefs: the non-deterministic layer
│   ├── config/          taxonomies, watchlists, thresholds, signal rules
│   ├── engine/          52 deterministic modules
│   ├── db/              schemas; one SQLite file, regenerable from runs/
│   ├── runs/            raw agent output, committed — the audit trail
│   ├── tools/           batch builders, validators, feedback gates
│   └── handoff/         the contract files the dashboard consumes
│
└── docs/                specs and build logs, by area
```

**Thresholds live in config, not code** — moving the boundary of a map is a decision, and it
has to be visible in a config diff rather than buried in a Python change.

**The database is regenerable.** `db/capital.db` is gitignored; `runs/` is the committed
source of truth, and `tools/rebuild_db.py` replays the entire history from it. A fresh clone
that skips the rebuild would hand the dashboard a map containing one week — so delivery blocks
on that too.

## Running it

```bash
npm install && npm run dev          # dashboard at localhost:5173

cd engine
python tools/rebuild_db.py          # required once, from a fresh clone
python tools/smoke_test.py          # end-to-end self-test on synthetic data
python run_week.py 2026-W45         # the weekly deterministic pipeline
```

Requires Python 3.11+, `pyyaml`, Node 18+. The research agents run inside Claude Code — no API
service, no per-token billing to manage.

Full documentation: [`engine/docs/`](engine/docs/) · specs and build logs: [`docs/`](docs/)
