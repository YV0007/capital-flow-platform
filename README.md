# Capital Flow

Autonomous research pipeline for capital-allocation intelligence. A multi-tier agent system
performs source discovery, corroboration and enrichment; a deterministic Python/SQL engine
decides what becomes a fact, detects convergence signals, and ships a contract-validated
payload to a React dashboard.

**Live:** [ab-investment.vercel.app](https://ab-investment.vercel.app)

---

## Overview

The system tracks capital-allocation events - equity, funding rounds, acquisitions, project
finance, sovereign investments - across a watchlist of 69 allocators, and maps private flows
through to public-market beneficiaries. A second pipeline maps structural dependencies in the
AI infrastructure stack. A third tracks disclosed fund positions from mandated filings.

Scope is restricted to committed capital. Announcements, MOUs, partnerships and product
launches are explicitly out of scope and rejected at ingest.

**Current state** (2026-11-23, audit passing):

| | |
|---|---|
| Flow graph | 404 entities, 543 events, 18 sectors |
| Signals firing | 90 |
| Dependency graph | 108 entities, 314 edges, 9 single points of failure |
| Research volume | 2,999 sources checked across 14 weekly runs |
| Yield | 461 verified events, 127 documented candidates |
| Source-URL coverage | 1.00 |

---

## System

```
RESEARCH          26 agent roles in 4 tiers, each fed a database-derived context pack
(non-deterministic)   -> runs/<period>/<agent>/*.csv|json
        |
ENGINE            validate -> resolve entities -> dedupe/merge -> grade -> SQLite
(deterministic)       -> signal rules -> beneficiaries -> aggregates -> audit gate
        |
FEEDBACK          rejects, gaps and unconsumed verdicts flow back into the next context pack
        |
HANDOFF           contract-validated JSON; write refused if contract fails
        |
DASHBOARD         render only - React 18 + Vite 5, static JSON, no backend
```

The separation is the core design constraint: agents are used for retrieval, corroboration
and classification, never for assertion. No agent output reaches the payload without passing
deterministic validation, and every agent reads the engine's verdict on its previous output
before it starts.

Four invariants:

1. **SQLite is the single source of truth.** Agent CSVs are an interchange format. The
   payload and the dashboard are derived artifacts.
2. **Entity resolution is mandatory.** Point72 files under six CIKs; Greenlight's active 13F
   filer is *DME Capital Management*. Without alias resolution the same manager appears
   multiple times at a fraction of its real size and every derived score is wrong. One alias
   table serves all three pipelines; resolution chains CIK, LEI and registry identifiers before
   any name match is attempted.
3. **Deduplication merges rather than rejects.** `UNIQUE(allocator, target, event_type,
   disclosed_date)` catches the duplicate; the stronger status and better source tier win.
   This is what allows the filings agent to upgrade another agent's `candidate` to `verified`
   by re-emitting it with a Tier-1 filing attached.
4. **The dashboard computes nothing the engine can compute.** Criticality, centrality,
   aggregates, staleness and signal strength arrive precomputed. Single site of computation,
   no divergence between codebases.

---

## Agent topology

Agents are not a single prompt. They are 26 role briefs organised into tiers with explicit
data dependencies, ordering constraints and write-precedence rules. Each tier consumes the
engine's state after the previous tier has been ingested, so later agents work from
validated facts rather than from other agents' raw output.

```
                       context packs (tools/make_*_batches.py)
                                     |
  T1 RESEARCH     corporate  vc  individuals  alt-managers  sovereigns
                       \      |       |           |          /
                        +-----+-------+-----------+---------+
                                     |  ingest -> candidates
  T2 CONFIRMATION                 filings
                       (EDGAR sweep leads, re-emits candidates with Tier-1 docs)
                                     |  ingest -> verified
  T3 ENRICHMENT   allocator-profiler  target-profiler  holdings-profiler
                  deal-classifier     beneficiary-mapper
                                     |  profiles / references / holdings / backers
  T4 NARRATIVE    trend-writer  (restricted to clusters the SQL stage has cleared)
                                     |
                              signal rules -> audit -> handoff
```

### Tier 1 - research

Five agents partitioned by allocator class. Partitioning is by source landscape, not by
convenience: a sovereign wealth fund is researched through annual reports, parliamentary
disclosures and co-investor filings; an individual through Form 4, Form D related-persons
schedules and vehicle resolution. One brief per class keeps the escalation ladder specific.
Each agent receives a context pack scoped to its allocators and emits `events.csv`,
`sources.csv`, `leads.csv` and `discovered.csv` (universe candidates for the watchlist).

### Tier 2 - confirmation

`filings` runs after Tier 1 has been ingested. It reads the `stale_candidates` list from the
database, runs the deterministic EDGAR path for each, and re-emits rows that it can attach a
primary document to. The merge rule promotes them in place. It is the only agent whose job is
to change the status of another agent's row.

### Tier 3 - enrichment

Five agents, each with its own batch builder and a typed output the engine ingests into a
dedicated table:

| Agent | Batch builder | Output | Tables |
|---|---|---|---|
| `allocator-profiler` | `make_research_batches.py` | `profiles.json` | `allocator_profiles`, `track_records` |
| `target-profiler` | `make_reference_batches.py` | `references.json` | `target_references` |
| `holdings-profiler` | `make_holdings_batches.py` | `holdings.json` | `portfolios`, `holdings` |
| `deal-classifier` | `make_classification_batches.py` | `backers.json`, `classification.json` | `round_backers`, `target_classification` |
| `beneficiary-mapper` | engine-emitted targets | `beneficiaries.csv` | `beneficiaries` |

Batch builders are the control plane. Each one queries the database for the entities that
need work (new targets without references, large funds without holdings, rounds without a
backer list), writes a bounded batch with the exact fields required, and records what was
requested. The audit layer compares requests to deliveries across runs, which is how a
non-executing enrichment step is detected rather than assumed.

### Tier 4 - narrative

`trend-writer` is the only agent allowed to produce prose for the flow map, and it may only
write about clusters the SQL stage has already qualified. It cannot originate a trend, extend
a window or name an allocator the cluster does not contain. Its output is validated against
the cluster it was given.

### Ecosystem agents

The dependency map uses a separate agent set with a different unit of work:

```
  eco-dossier        one node per task; writes dossier.json
                     tools/dossier_split.py lays it out into entities/edges/factors/sources
                                |
  nveco-silicon  nveco-systems  nveco-power  nveco-software  nveco-models  nveco-capital
  nveco-geo       7 layer sweeps, each owning 1-4 of the 16 layers
                                |
  nveco_reconcile  (engine) - bilateral confirmation, disputed edges, divergence warnings
                                |
  nveco-strategic  reconciliation agent: works disputed edges and cross-layer links
                   neither end claimed; enters no new entities
                                |
  nvnet-descriptions / nvnet-prose / eco-prose   bounded text passes with i18n manifests
```

Write precedence is explicit: a dossier overrides a layer sweep, a sweep never overrides a
dossier, between equals the first wins. Divergences are not silently resolved; they land in
the run's warnings by name. Translations are loaded as a manifest, not an increment, so a
string removed from the source file cannot survive in the store.

### Feedback loop

The loop is what makes the agent layer improve between runs without retraining:

- **Rejection ledger.** Every row the engine rejects is stored with its reason and a repeat
  counter. The next context pack carries it back to the agent that produced it under
  `what_you_got_wrong`. Recurring rejects are promoted into the brief as worked examples.
- **Candidate queue.** Entities agents discover but the scope does not yet hold are queued,
  reviewed with `tools/queue_review.py` and promoted with `tools/promote.py`. The watchlist
  grows through evidence, not through an agent's decision.
- **Gap generators.** `engine/nveco_gaps.py` derives research targets from the graph itself:
  `disclosed_unnamed` (a node's own filing names a counterparty the map does not hold) and
  `expected_edge` (the taxonomy says a node of this kind cannot operate without an edge of
  this type, and none exists). These become `to_hunt` sections in the next pack.
- **Consumption gate.** `tools/feedback_check.py` exits non-zero while any engine verdict
  remains unconsumed by the agent it was addressed to. A run cannot proceed past its own
  unread feedback.
- **Idempotent re-ingest.** A run directory can be ingested any number of times with the same
  result. Correcting a brief and replaying history is a normal operation, not a migration.

State is plain text in version control. No fine-tuning, no embedding store, no opaque
adaptation. Each correction is auditable and reversible by `git diff`.

---

## Research layer

### Context packs

`tools/make_research_batches.py` writes `runs/<week>/<agent>/context.json` from the database
before each run:

| Section | Contents |
|---|---|
| `what_you_already_have` | Per allocator: `last_event_date` (search forward from it), active sectors, known vehicles, aliases, CIK, recent targets, `stale_candidates` awaiting Tier-1 confirmation |
| `what_worked` | Sources that produced events in recent runs - checked before broad search |
| `what_you_got_wrong` | Rejected rows from recent runs, each with its rejection reason and repeat count |
| `to_hunt` | Engine-derived targets: unconfirmed counterparties, expected-but-missing edges, queued discoveries |

### Deterministic resolution before search

Known filer plus known form is a lookup, not a search. Fuzzy name matching is the primary
cause of misattributed events.

```bash
python -m engine.edgar cik "Blue Owl"                      # resolve filer, or null
python -m engine.edgar filings NVIDIA --forms 8-K,D --since 2026-08-01
python -m engine.edgar exists --allocator NVIDIA --target "Nebius Group N.V."
```

The third call is required before writing any row. `engine/edgar.py` additionally sweeps every
tracked CIK's EDGAR submissions on a schedule. A filing is not an event - an 8-K may be an
officer appointment - so the sweep emits `leads`, which an agent promotes or dismisses with a
recorded reason. Sites that refuse automated fetch are routed through a separate retrieval
path and the fetch mode is recorded on the source row, so a citation's provenance includes
how it was obtained.

### Due-diligence escalation

A single-source claim is a lead. Before it can be discarded it runs a fixed sequence:

1. **Origin resolution.** N outlets citing one origin count as one source, not N. The origin
   URL is stored in `origin_id`, making circular reporting detectable rather than
   indistinguishable from corroboration.
2. **Primary documents.** Form D and related-persons schedule, 8-K items 1.01/2.01, 13D/G,
   Form 4, issuer IR and press. Wayback for post-publication edits.
3. **Registry and legal.** OpenCorporates and GLEIF entity records, subsidiary/SPV formation,
   state filings, UCC liens where the instrument is debt, court records, HSR/CFIUS for large
   or cross-border transactions.
4. **Indirect corroboration.** Headcount and role changes, job postings tied to the funded
   initiative, domain and trademark registration, construction permits and procurement
   records (datacenters, power), customs and shipping records (hardware). Counterparty
   disclosure frequently precedes principal disclosure.
5. **Triangulation.** Two independent confirmations for `verified_alpha`; a primary document
   for `verified`. Competing explanations - prior round resurfacing, mark-to-market,
   promotional disclosure - are evaluated against the evidence before a status is assigned.
6. **Classification.** Unconfirmable claims are stored as `candidate` with the blocking reason
   recorded, not discarded.

Secondary routes specified in the brief: reverse from the beneficiary, resolve the investment
vehicle rather than the principal, locate the debt instrument behind an equity announcement,
diff consecutive 13F filings, read Form D amendments.

---

## Validation and grading

### Source tiers

| Tier | Sources | Role |
|---|---|---|
| 1 | SEC EDGAR, issuer IR, official PR, government databases | Confirms |
| 2 | PitchBook, Preqin, Crunchbase, Dealroom, Capital IQ | Corroborates |
| 3 | Reuters, FT, WSJ, Bloomberg, The Information | Corroborates |
| 4 | SemiAnalysis, Stratechery, conference material | Corroborates |
| 5 | Podcasts, social, blogs | Lead discovery only; never stored as verified |

### Confidence

Two-axis Admiralty grading, computed at ingest and never author-supplied: reliability A-E from
source tier, credibility 1-5 from corroboration, combined into a 0-100 score. Rows scoring
below 60 are excluded from the primary graph and routed to a watch list. Agent-supplied
grades would not be comparable across rows or runs. Corroboration counts come from the source
table, with `origin_id` collapsing syndicated copies, so an agent cannot raise its own grade
by citing the same wire story three times.

### Citation validity

`source_url` must resolve to a document. EDGAR full-text search URLs
(`efts.sec.gov/...?q=`) resolve to nothing and, for common tokens, return unrelated filers.
Such URLs are stripped at ingest and block the release at audit (error class **E0**).

### Measurement integrity

Three corruption classes, each observed in production after being specified in the agent
brief - which is why enforcement moved into code:

| Observed | Effect | Enforcement |
|---|---|---|
| $1.4B post-money valuation written to `amount_usd` | Company price recorded as capital deployed; inflates every sector aggregate it touches | `amount_usd` is the allocator's slice or null. Round size to `round_total_usd`, valuation to `valuation_usd`. Null, never zero. Audit **W2** |
| Co-led $160M round filed at full size by both participants | Deal aggregates to $320M | Per-allocator slice when disclosed, else null amount plus `round_total_usd` per row and `co_investors` populated |
| Entity resolved from a same-name company in an unrelated sector | Incorrect edge propagates to every derived metric | Two plausible matches -> `candidate` with both named in `notes` |

Position deltas are computed on share count, never on value - a value-based delta synthesizes
position changes from price movement.

### Coverage instrumentation

Three tables make absence provable rather than assumed:

- `source_log` - every source consulted per run, including the 59% that yielded nothing
- `coverage` - per run, per agent, per allocator: sources checked against events found
- `leads` - raw signals held until promoted to an event or dismissed with a reason

Coverage is also the basis for lead-time measurement: the gap between an event's first
appearance as a `candidate` and its confirmation by a primary document is stored per
allocator, which is what distinguishes an agent that finds things early from one that
finds them after the filing.

---

## Pipelines

| | Capital flows | Ecosystem | Fund tracker |
|---|---|---|---|
| Unit | Dated event | Undated standing dependency | Position / stake / delta |
| Universe | Discovery-driven | Scope-driven: 16 layers, 3 membership checks | Closed, curated, never auto-extended |
| Agents | 6 research + 5 enrichment + 1 narrative | 1 dossier + 7 sweeps + 1 reconciliation + 3 prose | None - mandated filings only |
| Node weight | Capital | Computed criticality | Position weight |
| Cadence | Weekly | Monthly, core nodes; quarterly, mid-tier; tail on trigger | Per filing |
| Orchestrator | `run_week.py` | `run_nvidia.py` + `run_network.py` | `run_funds.py` |

The ecosystem pipeline asserts structure rather than events and applies a stricter evidentiary
rule: an edge requires a verbatim quote of at most 15 words from a resolved document. Every URL
is re-fetched each run; a dead link removes a confirmation and may downgrade edge status.
Membership is gated: a node needs three sources, one of them its own, and two confirmed edges,
or it is retired from the held set when the coverage check fails.

It maintains two independent importance measures. `criticality` is authored from a node's own
filings against a four-factor rubric (irreplaceability 0.30, lock-in depth 0.30,
time-to-replace 0.25, concentration 0.15). `integration` is computed from the graph
(0.30 degree + 0.25 betweenness + 0.15 pagerank + 0.15 layers spanned + 0.10 edge types +
0.05 cycles). Divergence between the two identifies hidden chokepoints: Carl Zeiss SMT ranks
1st by criticality and 108th of 108 by integration - sole supplier of EUV optics, one mapped
counterparty. A single blended score would not surface it.

Degree and betweenness are computed on the undirected graph; PageRank on a directed
dependence graph, since dependency is inherently directional. Undirected PageRank correlated
0.9988 with degree. Single points of failure are identified by deletion: remove the node,
count disconnected pairs. Removing NVIDIA disconnects 1,392 pairs (24.5% of connected pairs)
and fragments the graph into 14 components. Scoring runs twice per cycle: once on the raw
graph, then again after cycle and contour detection so that nodes inside a closed dependency
loop are weighted for the loop they belong to.

Each run is a dated snapshot. Payloads from consecutive months are diffable at edge level,
so the dependency graph has a time axis: an edge that appears, is disputed and is withdrawn
leaves a trace rather than vanishing.

---

## Signal detection

Eight rules evaluated as SQL over the event table each run. Parameters in
`config/rules.yaml`.

| Rule | Condition |
|---|---|
| `sector_swarm` | 3+ key allocators, confirmed capital, one sector, 30d window |
| `subsector_swarm` | 2+ key allocators converge on one (sector, subsector) |
| `theme_swarm` | 4+ key allocators converge on one theme across sectors, 30d |
| `capital_acceleration` | Sector rolling 90d capital at least 2x prior 90d |
| `first_entry` | Key allocator enters a sector with no events in 365d |
| `smart_money_follow` | Allocator enters, 2+ others follow within 21d |
| `stealth_accumulation` | 3+ stakes into one target within 90d |
| `beneficiary_concentration` | 3+ private flows map to one public ticker |

Candidate-status events are excluded from rule evaluation. Rules are declarative: adding one
is a YAML entry and a SQL template, not a code path. The two graphs are joined at the
beneficiary layer, so a flow signal can be read against the dependency position of the
public company it resolves to - capital converging on a target whose supplier is a single
point of failure is a different fact from capital converging on a target with substitutes.

Representative output from the current run:

- `smart_money_follow` - Andreessen Horowitz entered `ai-applications`; 7 allocators followed
  within 21 days.
- `subsector_swarm` - 8 key allocators on `enterprise-ai-agents`, 6 on `legal-regulatory-ai`,
  5 on `vertical-saas-ai`. Subsectors are a curated vocabulary rather than free text;
  free-text labels do not cluster.
- `stealth_accumulation` - Harvey: 4 discrete stakes within 90 days, no single round at
  disclosure threshold.
- `beneficiary_concentration` - 77 private flows resolve to NVDA, 17 to TSM, 11 to GOOGL, 10
  to PWR, 4 to BWXT. Each carries the originating private targets and the stated transmission
  mechanism.

Subsector trend clustering runs in two stages. Stage B is mechanical: SQL clusters confirmed
flows by (sector, subsector), then re-evaluates the threshold independently inside each of
three windows (7d, 30d, all-time), so a cluster cannot qualify once and persist. Stage A is a
narrative agent restricted to clusters Stage B has already cleared; it cannot originate a
trend. Empty windows ship as empty arrays; borderline clusters ship flagged `low` and
`provisional`.

---

## Quality gates

**Audit pass** - runs every cycle. 7 error classes block delivery; 9 warning classes ship
annotated. Errors cover unresolvable citations (E0), confirmed events without a source (E1),
allocator slice exceeding round total (E2), missing confidence grade (E3), unsourced
track-record rows (E4), current-period figures not flagged provisional (E5), and repeated
unfulfilled holdings requests (E6).

**Contract validator** - runs before every handoff write and refuses to overwrite a valid file
with an invalid one. Four test suites, 119 cases, exist to verify the validator still rejects
malformed payloads: dangling references, edges without evidence, over-length quotes,
out-of-scope entities, out-of-rubric criticality, `bilateral` status with one confirming side,
`disputed` without counter-evidence, type violations.

**Feedback gate** - `tools/feedback_check.py` blocks a run while engine verdicts addressed to
an agent remain unconsumed.

**Build gate** - `npm run build` must succeed or nothing is pushed.

E6 documents a failure of the warning design. W7 (funds with no holdings collected) warned for
multiple consecutive weeks while runs shipped green and 36 portfolios remained empty. The
remediation was not threshold tuning: a large fund requested twice without delivery indicates
a non-executing pipeline step, which now blocks delivery as an error. The same policy applies
generally: a warning that repeats across consecutive runs without being acted on is promoted
to an error class, because a warning nobody reads is not a control.

---

## Layout

```
├── src/                 dashboard - React 18 + Vite 5, no backend
│   ├── components/research/{capitalflow,ecosystem,funds}/
│   ├── components/tracker/
│   └── data/            59 JSON files - the only data layer
│
├── engine/              Python 3.11 + SQLite
│   ├── agents/          26 agent briefs - the non-deterministic layer
│   ├── config/          taxonomies, watchlists, thresholds, rule parameters
│   ├── engine/          52 deterministic modules
│   ├── db/              schemas; single SQLite file, regenerable
│   ├── runs/            raw agent output, committed - audit trail
│   ├── tools/           batch builders, validators, feedback gates
│   └── handoff/         contract files consumed by the dashboard
│
└── docs/                specifications and build logs
```

Thresholds are config, not code: changing a map boundary appears in a config diff rather than
a Python change.

`db/capital.db` is gitignored and regenerable - `runs/` is the committed source of truth and
`tools/rebuild_db.py` replays the full history. A clone that skips the rebuild produces a
single-week map; delivery blocks on node-count regression to catch this.

## Running

```bash
npm install && npm run dev          # dashboard on :5173

cd engine
python tools/rebuild_db.py          # required once on a fresh clone
python tools/smoke_test.py          # end-to-end test on synthetic fixtures
python run_week.py 2026-W45         # deterministic weekly pipeline
```

Python 3.11+, `pyyaml`, Node 18+. Research agents execute inside Claude Code - no API service
and no per-token billing. `run_week.py` is the unit the scheduler wraps: agent stage, ingest,
rules, audit, handoff, with `--deliver` and `--push` as explicit opt-ins.

Documentation: [`engine/docs/`](engine/docs/) · specifications and build logs:
[`docs/`](docs/)
