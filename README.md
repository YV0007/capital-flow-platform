# Capital Flow

**Most market tools tell you what was announced. This one tracks what was actually funded —
and automates the research that finds it.**

Live: **[ab-investment.vercel.app](https://ab-investment.vercel.app)**

---

## The problem

If you want to know where serious money is moving in AI infrastructure, your options are bad.
News tells you what was *announced* — and an announcement is not a cheque. Databases like
PitchBook tell you what closed, months later, behind a paywall. Neither tells you the thing
that actually matters: **who moved first, who followed, and which companies the whole stack
quietly depends on.**

That research is doable by hand. One analyst, reading filings and press releases all week,
can keep a picture of maybe twenty investors. The work is mechanical, it never ends, and it
does not compound — stop for a month and the picture is stale.

## What this does

It runs that analyst's week as a pipeline.

**AI agents do the reading.** Every week, six research agents go through SEC filings, investor
press pages, and the specialist press, looking for one specific thing: capital that actually
moved. Not opinions, not partnerships, not product launches — money committed, by whom, to
whom, on what date.

**Code decides what's true.** Nothing an agent finds is trusted on its own. Every claim has to
cite a real document, gets graded by how good that source is, and gets cross-checked against
what's already known. Anything that fails is rejected with a reason attached — never dropped
quietly.

**The result is a map you can interrogate.** Not a feed to scroll. A graph where you can ask
"who else backed this company", "which sector is suddenly crowded", "what breaks if this
supplier disappears" — and get an answer with a source behind every number.

## What you actually see

Three maps, each answering a different question:

| | The question | What a node is |
|---|---|---|
| **Capital flows** | Where did money go this week, who moved first, who followed | An investor or a company receiving money |
| **Ecosystem** | Who holds a function the AI stack can't run without | A company, technology, or regulator the stack depends on |
| **Fund tracker** | What do respected managers hold right now | A position in a fund's book |

Today that's **357 investors and companies connected by 472 funded deals** across 18 sectors,
and a dependency graph of **108 entities and 314 relationships** where 9 nodes are provable
single points of failure — remove NVIDIA from the graph and 1,392 pairs of companies lose
their connection entirely.

## Why it's interesting as engineering

The hard part isn't the scraping. It's that **language models are useful for finding things
and dangerous for asserting them.** An agent asked to research a deal will happily produce a
confident, well-formatted, completely invented funding round.

So the system is built around one split: **search is autonomous, output is deterministic.**
Agents are allowed to be creative about *finding*. They are allowed no say at all in what
becomes a fact. Between the two sits Python, SQL, and a set of gates that would rather ship
nothing than ship something wrong.

Everything below is how that split is enforced.

---

# How it works

```
          RESEARCH — autonomous, non-deterministic
   Claude Code agents read the web under a source-tier ladder
          write CSV / JSON into runs/<period>/<agent>/
                            │
                            ▼
          ENGINE — deterministic, Python + SQL
   validate → resolve entities → dedupe → SQLite → score → audit gate
                            │
                            ▼
          HANDOFF — one validated file per map
   refuses to overwrite a good file with a broken one
                            │
                            ▼
          DASHBOARD — render only
   React + Vite → Vercel
```

**The database is the single source of truth** — not the agent output, not the payload, not
the dashboard.

**The dashboard computes nothing the engine can compute.** Criticality, centrality,
aggregates, staleness, classification scores all arrive already calculated. The dashboard
styles what the file says; it never overrides a status or invents an entity. One number, one
place it is computed.

## Three pipelines

| | **Capital flows** | **Ecosystem** | **Fund tracker** |
|---|---|---|---|
| Unit | a dated **event** | an undated standing **dependency** | a **position / stake / delta** |
| Universe | discovery-shaped — agents hunt leads | scope-shaped — 16 layers, 3 membership checks | closed and curated, never auto-extended |
| Agents | 6, by allocator class | 1 dossier agent + 8 layer sweeps | **none** — fully deterministic |
| Cadence | weekly | monthly | per filing |
| Orchestrator | `run_week.py` | `run_nvidia.py` + `run_network.py` | `run_funds.py` |

They share one SQLite file because **entity identity is shared** — NVIDIA has to be one
NVIDIA on every map. Tables, agents, rules and schedules are separate.

---

## Four ideas worth stealing

**1. A claim becomes a fact by climbing a ladder, never by assertion.**
Sources are tiered 1–5 — SEC filings confirm, podcasts only discover. Every record carries an
honest grade (`verified`, `verified_alpha`, `candidate`) computed from source tier and
corroboration, never typed by hand. *Tier 5 discovers; tier 1 confirms.* An unconfirmable item
is filed as a candidate with its reason attached: **a documented candidate is data, a silent
drop is a miss.**

**2. The iron rule: no quote, no edge.**
On the ecosystem map a relationship exists only if a verbatim quote of **≤15 words** from a
resolved document states it. Every link is re-fetched each run; a dead link costs the edge a
confirmation. Every figure in prose traces to a quote attached to that same object — a number
the reader cannot check is worse than no number.

**3. Two measures of importance, deliberately not merged.**
`criticality` is authored from a node's own documents. `integration` is computed from the
graph. The interesting nodes are where they diverge: Carl Zeiss SMT ranks 8th by criticality
and last of 108 by integration — it holds the optics of every EUV tool on earth, and the map
has found it exactly one counterparty. One blended score would hide precisely that.

**4. Feedback is consumed, not accumulated.**
Rejections used to be written to a CSV that no step was obliged to open — so a correct finding
sat in the repository for months, unread. Now a rejection lives in a ledger until fixed or
explicitly decided, becomes a queue row with a consumer, and `feedback_check.py` exits 1 while
anything is unanswered. **Silence is not a decision.**

## Why it refuses to ship

Trust is the product — a few visible errors and the whole dataset is suspect. So the pipeline
is gated in three places:

- **An audit pass runs every cycle.** 7 error classes block delivery outright — a search query
  cited as a source, a confirmed event with no URL, an investor's slice exceeding the round
  total. 9 warning classes ship but are listed.
- **A contract validator runs before every write** and refuses to overwrite a good file with a
  broken one. *Yesterday's truth beats today's lie.* Four test suites, **119 cases**, exist
  only to prove the validator still bites — they corrupt a payload twenty ways and demand a
  rejection each time.
- **`npm run build` gates the deploy.** If the dashboard does not compile, nothing is pushed.

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

**Thresholds live in config, not in code** — moving the boundary of a map is a decision, and
it has to be visible in a config diff.

**The database is regenerable.** `db/capital.db` is gitignored; `runs/` is the committed
source of truth, and `tools/rebuild_db.py` replays the entire history.

## Running it

```bash
npm install && npm run dev          # dashboard at localhost:5173

cd engine
python tools/rebuild_db.py          # required once, from a fresh clone
python tools/smoke_test.py          # end-to-end self-test on synthetic data
python run_week.py 2026-W45         # the weekly deterministic pipeline
```

Requires Python 3.11+, `pyyaml`, Node 18+. The research agents run inside Claude Code — there
is no API service and no per-token billing to manage.

Full documentation: [`engine/docs/`](engine/docs/) · specs and build logs: [`docs/`](docs/)
