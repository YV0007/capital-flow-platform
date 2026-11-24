# Capital Flow

Autonomous research pipeline for capital-allocation intelligence. LLM agents perform source
discovery and due diligence; a deterministic Python/SQL engine decides what becomes a fact,
detects convergence signals, and ships a validated payload to a React dashboard.

**Live:** [ab-investment.vercel.app](https://ab-investment.vercel.app)

---

## Overview

The system tracks capital-allocation events — equity, funding rounds, acquisitions, project
finance, sovereign investments — across a watchlist of 69 allocators, and maps private flows
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
RESEARCH          agents read the web under a tier ladder
(non-deterministic)   → runs/<period>/<agent>/*.csv
        │
ENGINE            validate → resolve entities → dedupe/merge → grade → SQLite
(deterministic)       → signal rules → beneficiaries → aggregates → audit gate
        │
HANDOFF           contract-validated JSON; write refused if contract fails
        │
DASHBOARD         render only — React 18 + Vite 5, static JSON, no backend
```

The separation is the core design constraint: LLM agents are used for retrieval and
corroboration, never for assertion. No agent output reaches the payload without passing
deterministic validation.

Four invariants:

1. **SQLite is the single source of truth.** Agent CSVs are an interchange format. The
   payload and the dashboard are derived artifacts.
2. **Entity resolution is mandatory.** Point72 files under six CIKs; Greenlight's active 13F
   filer is *DME Capital Management*. Without alias resolution the same manager appears
   multiple times at a fraction of its real size and every derived score is wrong. One alias
   table serves all three pipelines.
3. **Deduplication merges rather than rejects.** `UNIQUE(allocator, target, event_type,
   disclosed_date)` catches the duplicate; the stronger status and better source tier win.
   This is what allows the filings agent to upgrade another agent's `candidate` to `verified`
   by re-emitting it with a Tier-1 filing attached.
4. **The dashboard computes nothing the engine can compute.** Criticality, centrality,
   aggregates, staleness and signal strength arrive precomputed. Single site of computation,
   no divergence between codebases.

---

## Research layer

Six agents, partitioned by allocator class (corporate, VC, individuals, alt-managers,
sovereigns, filings). The filings agent runs last so it can confirm the others' candidates.

### Context packs

`tools/make_research_batches.py` writes `runs/<week>/<agent>/context.json` from the database
before each run:

| Section | Contents |
|---|---|
| `what_you_already_have` | Per allocator: `last_event_date` (search forward from it), active sectors, known vehicles, aliases, CIK, recent targets, `stale_candidates` awaiting Tier-1 confirmation |
| `what_worked` | Sources that produced events in recent runs — checked before broad search |
| `what_you_got_wrong` | Rejected rows from recent runs, each with its rejection reason and repeat count |

State is plain text in version control. No fine-tuning, no embedding store, no opaque
adaptation — each correction is auditable and reversible.

### Deterministic resolution before search

Known filer plus known form is a lookup, not a search. Fuzzy name matching is the primary
cause of misattributed events.

```bash
python -m engine.edgar cik "Blue Owl"                      # resolve filer, or null
python -m engine.edgar filings NVIDIA --forms 8-K,D --since 2026-08-01
python -m engine.edgar exists --allocator NVIDIA --target "Nebius Group N.V."
```

The third call is required before writing any row. `engine/edgar.py` additionally sweeps every
tracked CIK's EDGAR submissions on a schedule. A filing is not an event — an 8-K may be an
officer appointment — so the sweep emits `leads`, which an agent promotes or dismisses with a
recorded reason.

### Due-diligence escalation

A single-source claim is a lead. Before it can be discarded it runs a fixed sequence:

1. **Origin resolution.** N outlets citing one origin count as one source, not N. The origin
   URL is stored in `origin_id`, making circular reporting detectable rather than
   indistinguishable from corroboration.
2. **Primary documents.** Form D and related-persons schedule, 8-K items 1.01/2.01, 13D/G,
   Form 4, issuer IR and press. Wayback for post-publication edits.
3. **Registry and legal.** OpenCorporates entity and subsidiary/SPV formation, state filings,
   UCC liens where the instrument is debt, court records, HSR/CFIUS for large or cross-border
   transactions.
4. **Indirect corroboration.** Headcount and role changes, job postings tied to the funded
   initiative, domain and trademark registration, construction permits and procurement
   records (datacenters, power), customs and shipping records (hardware). Counterparty
   disclosure frequently precedes principal disclosure.
5. **Triangulation.** Two independent confirmations for `verified_alpha`; a primary document
   for `verified`. Competing explanations — prior round resurfacing, mark-to-market,
   promotional disclosure — are evaluated against the evidence before a status is assigned.
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

Two-axis Admiralty grading, computed at ingest and never author-supplied: reliability A–E from
source tier, credibility 1–5 from corroboration, combined into a 0–100 score. Rows scoring
below 60 are excluded from the primary graph and routed to a watch list. Agent-supplied
grades would not be comparable across rows or runs.

### Citation validity

`source_url` must resolve to a document. EDGAR full-text search URLs
(`efts.sec.gov/...?q=`) resolve to nothing and, for common tokens, return unrelated filers.
Such URLs are stripped at ingest and block the release at audit (error class **E0**).

### Measurement integrity

Three corruption classes, each observed in production after being specified in the agent
brief — which is why enforcement moved into code:

| Observed | Effect | Enforcement |
|---|---|---|
| $1.4B post-money valuation written to `amount_usd` | Company price recorded as capital deployed; inflates every sector aggregate it touches | `amount_usd` is the allocator's slice or null. Round size → `round_total_usd`, valuation → `valuation_usd`. Null, never zero. Audit **W2** |
| Co-led $160M round filed at full size by both participants | Deal aggregates to $320M | Per-allocator slice when disclosed, else null amount plus `round_total_usd` per row and `co_investors` populated |
| Entity resolved from a same-name company in an unrelated sector | Incorrect edge propagates to every derived metric | Two plausible matches → `candidate` with both named in `notes` |

Position deltas are computed on share count, never on value — a value-based delta synthesizes
position changes from price movement.

### Coverage instrumentation

Three tables make absence provable rather than assumed:

- `source_log` — every source consulted per run, including the 59% that yielded nothing
- `coverage` — per run, per agent, per allocator: sources checked against events found
- `leads` — raw signals held until promoted to an event or dismissed with a reason

---

## Pipelines

| | Capital flows | Ecosystem | Fund tracker |
|---|---|---|---|
| Unit | Dated event | Undated standing dependency | Position / stake / delta |
| Universe | Discovery-driven | Scope-driven: 16 layers, 3 membership checks | Closed, curated, never auto-extended |
| Agents | 6 by allocator class | 1 dossier agent + 8 layer sweeps | None — mandated filings only |
| Node weight | Capital | Computed criticality | Position weight |
| Cadence | Weekly | Monthly | Per filing |
| Orchestrator | `run_week.py` | `run_nvidia.py` + `run_network.py` | `run_funds.py` |

The ecosystem pipeline asserts structure rather than events and applies a stricter evidentiary
rule: an edge requires a verbatim quote of ≤15 words from a resolved document. Every URL is
re-fetched each run; a dead link removes a confirmation and may downgrade edge status.

It maintains two independent importance measures. `criticality` is authored from a node's own
filings against a four-factor rubric (irreplaceability 0.30, lock-in depth 0.30,
time-to-replace 0.25, concentration 0.15). `integration` is computed from the graph
(0.30·degree + 0.25·betweenness + 0.15·pagerank + 0.15·layers spanned + 0.10·edge types +
0.05·cycles). Divergence between the two identifies hidden chokepoints: Carl Zeiss SMT ranks
1st by criticality and 108th of 108 by integration — sole supplier of EUV optics, one mapped
counterparty. A single blended score would not surface it.

Degree and betweenness are computed on the undirected graph; PageRank on a directed
dependence graph, since dependency is inherently directional. Undirected PageRank correlated
0.9988 with degree. Single points of failure are identified by deletion: remove the node,
count disconnected pairs. Removing NVIDIA disconnects 1,392 pairs (24.5% of connected pairs) and fragments the
graph into 14 components.

---

## Signal detection

Eight rules evaluated as SQL over the event table each run. Parameters in
`config/rules.yaml`.

| Rule | Condition |
|---|---|
| `sector_swarm` | ≥3 key allocators, confirmed capital, one sector, 30d window |
| `subsector_swarm` | ≥2 key allocators converge on one (sector, subsector) |
| `theme_swarm` | ≥4 key allocators converge on one theme across sectors, 30d |
| `capital_acceleration` | Sector rolling 90d capital ≥2× prior 90d |
| `first_entry` | Key allocator enters a sector with no events in 365d |
| `smart_money_follow` | Allocator enters, ≥2 others follow within 21d |
| `stealth_accumulation` | ≥3 stakes into one target within 90d |
| `beneficiary_concentration` | ≥3 private flows map to one public ticker |

Candidate-status events are excluded from rule evaluation.

Representative output from the current run:

- `smart_money_follow` — Andreessen Horowitz entered `ai-applications`; 7 allocators followed
  within 21 days.
- `subsector_swarm` — 8 key allocators on `enterprise-ai-agents`, 6 on `legal-regulatory-ai`,
  5 on `vertical-saas-ai`. Subsectors are a curated vocabulary rather than free text;
  free-text labels do not cluster.
- `stealth_accumulation` — Harvey: 4 discrete stakes within 90 days, no single round at
  disclosure threshold.
- `beneficiary_concentration` — 77 private flows resolve to NVDA, 17 to TSM, 11 to GOOGL, 10
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

**Audit pass** — runs every cycle. 7 error classes block delivery; 9 warning classes ship
annotated. Errors cover unresolvable citations (E0), confirmed events without a source (E1),
allocator slice exceeding round total (E2), missing confidence grade (E3), unsourced
track-record rows (E4), current-period figures not flagged provisional (E5), and repeated
unfulfilled holdings requests (E6).

**Contract validator** — runs before every handoff write and refuses to overwrite a valid file
with an invalid one. Four test suites, 119 cases, exist to verify the validator still rejects
malformed payloads: dangling references, edges without evidence, over-length quotes,
out-of-scope entities, out-of-rubric criticality, `bilateral` status with one confirming side,
`disputed` without counter-evidence, type violations.

**Build gate** — `npm run build` must succeed or nothing is pushed.

E6 documents a failure of the warning design. W7 (funds with no holdings collected) warned for
multiple consecutive weeks while runs shipped green and 36 portfolios remained empty. The
remediation was not threshold tuning: a large fund requested twice without delivery indicates
a non-executing pipeline step, which now blocks delivery as an error.

---

## Layout

```
├── src/                 dashboard — React 18 + Vite 5, no backend
│   ├── components/research/{capitalflow,ecosystem,funds}/
│   ├── components/tracker/
│   └── data/            59 JSON files — the only data layer
│
├── engine/              Python 3.11 + SQLite
│   ├── agents/          26 agent briefs — the non-deterministic layer
│   ├── config/          taxonomies, watchlists, thresholds, rule parameters
│   ├── engine/          52 deterministic modules
│   ├── db/              schemas; single SQLite file, regenerable
│   ├── runs/            raw agent output, committed — audit trail
│   ├── tools/           batch builders, validators, feedback gates
│   └── handoff/         contract files consumed by the dashboard
│
└── docs/                specifications and build logs
```

Thresholds are config, not code: changing a map boundary appears in a config diff rather than
a Python change.

`db/capital.db` is gitignored and regenerable — `runs/` is the committed source of truth and
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

Python 3.11+, `pyyaml`, Node 18+. Research agents execute inside Claude Code — no API service
and no per-token billing.

Documentation: [`engine/docs/`](engine/docs/) · specifications and build logs:
[`docs/`](docs/)
