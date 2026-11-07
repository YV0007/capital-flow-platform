# Capital Flow

**An autonomous research engine for capital-allocation intelligence, and the dashboard that renders it.**

Live: **[ab-investment.vercel.app](https://ab-investment.vercel.app)**

It answers one question that a news feed cannot: *where did money actually go, who moved
first, and who holds a function the AI stack cannot run without.* Research agents read the
web; Python and SQL decide what becomes a fact; a validator refuses to ship anything that
does not hold up.

---

## The idea

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

**Search is autonomous. Output is deterministic.** An agent may be creative about *finding*
things. Nothing it finds becomes a fact until Python and SQL have validated it, and the
database — not the agent output, not the payload, not the dashboard — is the single source
of truth.

**The dashboard computes nothing the engine can compute.** Criticality, centrality,
aggregates, staleness, classification scores all arrive already calculated. The dashboard
styles what the file says; it never overrides a status or invents an entity.

---

## Three pipelines

| | **Capital flows** | **Ecosystem** | **Fund tracker** |
|---|---|---|---|
| Question | where did money go this week | who is structurally irreplaceable | what do respected managers hold |
| Unit | a dated **event** | an undated standing **dependency** | a **position / stake / delta** |
| Universe | discovery-shaped — agents hunt leads | scope-shaped — 16 layers, 3 membership checks | closed and curated, never auto-extended |
| Agents | 6, by allocator class | 1 dossier agent + 8 layer sweeps | **none** — fully deterministic |
| Cadence | weekly | monthly | per filing |
| Orchestrator | `run_week.py` | `run_nvidia.py` + `run_network.py` | `run_funds.py` |

Current state — **357 nodes / 472 flows** across 18 sectors (2026-11-02, audit passing);
**110 entities / 321 edges / 305 cycles** with 9 single points of failure proved by deletion
(2026-08-29). 69 allocators tracked, 52 engine modules, 26 agent briefs.

---

## Four ideas worth stealing

**1. A claim becomes a fact by climbing a ladder, never by assertion.**
Sources are tiered 1–5 (SEC filings confirm; podcasts only discover). Every record carries
an honest grade — `verified`, `verified_alpha`, `candidate` — computed from the source tier
and corroboration, never typed by hand. *Tier 5 discovers; tier 1 confirms.* An unconfirmable
item is filed as a candidate with its reason attached: **a documented candidate is data, a
silent drop is a miss.**

**2. The iron rule: no quote, no edge.**
On the ecosystem map a relationship exists only if a verbatim quote of **≤15 words** from a
resolved document states it. Every link is re-fetched each run; a dead link costs the edge a
confirmation. Every figure in prose traces to a quote attached to that same object — a number
the reader cannot check is worse than no number.

**3. Two measures of importance, deliberately not merged.**
`criticality` is authored from a node's own documents. `integration` is computed from the
graph. The interesting nodes are where they diverge: Carl Zeiss SMT ranks 8th by criticality
and last of 110 by integration — it holds the optics of every EUV tool on earth, and the map
has found it one counterparty. Merging the two measures hides exactly that.

**4. Feedback is consumed, not accumulated.**
Rejections used to be written to a CSV that no step was obliged to open — so a correct
finding sat in the repository for months, unread. Now a rejection lives in a ledger until
fixed or explicitly decided, becomes a queue row with a consumer, and `feedback_check.py`
exits 1 while anything is unanswered. **Silence is not a decision.**

---

## Why it refuses to ship

Trust is the product — a few visible errors and the whole dataset is suspect. So the
pipeline is gated in three places:

- **An audit pass runs every cycle.** 7 error classes block delivery outright (a search
  query cited as a source, a confirmed event with no URL, an allocator's slice exceeding the
  round total); 9 warning classes ship but are listed.
- **A contract validator runs before every write** and refuses to overwrite a good file with
  a broken one. *Yesterday's truth beats today's lie.* Four suites, **119 cases**, exist to
  prove the validator still bites — they corrupt a payload twenty ways and demand a rejection
  each time.
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

---

## Running it

```bash
npm install && npm run dev          # dashboard at localhost:5173

cd engine
python tools/rebuild_db.py          # required once, from a fresh clone
python tools/smoke_test.py          # end-to-end self-test on synthetic data
python run_week.py 2026-W45         # the weekly deterministic pipeline
```

Requires Python 3.11+, `pyyaml`, Node 18+. The research agents run inside Claude Code —
there is no API service and no per-token billing to manage.

Full documentation: [`engine/docs/`](engine/docs/) · specs and build logs: [`docs/`](docs/)
