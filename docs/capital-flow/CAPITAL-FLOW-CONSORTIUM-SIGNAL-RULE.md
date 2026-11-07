# Engine handoff — new signal rule: `consortium_convergence` (landmark co-launched vehicles)

**For:** the Capital Flow engine (`~/Desktop/Capital Flow`, `config/rules.yaml §
signals` + the signal-rule pass).
**Why now:** the 2026-W33 delivery included the **"NVIDIA AI Infrastructure Financing
Platform"** — a consortium of six top alt-managers (Apollo, BlackRock, Blackstone,
Brookfield, Goldman Sachs, KKR) anchored by NVIDIA, to channel **$500B+** of
third-party institutional capital into AI-infra "AI factories." One of the most
structurally important flows of the cycle — and it shipped with **no signal**, so the
dashboard rendered it flat.

**Root cause on the engine side:** all six flows are `status: candidate`,
`amount: null`, `event_type: fund_launch`, and no existing rule fired:
- `beneficiary_concentration`, `*_swarm`, `smart_money_follow` count **confirmed**
  flows → candidates are excluded.
- `network_convergence` (the closest fit) targets *companies* and also needs
  confirmed flows.

The dashboard now has a **deterministic stopgap** (`classification.js →
classifyConsortiums`: a target with ≥4 distinct institutional backers, no engine
signal, gets the pivotal red cloud). It is a gap-filler labelled "наша эвристика · не
сигнал движка" — **please make it a real engine signal and we will delete the
stopgap.**

---

## Rule: `consortium_convergence`

**Intent:** fire when several distinct top-tier allocators **co-launch or co-fund one
vehicle** — a syndicated financing platform / fund / SPV — which is a market-structure
event, not just another deal.

**Fires when (all):**
1. A single **target** is a co-investment vehicle: `event_type ∈ {fund_launch, spv,
   project_finance}` **or** target `cls ∈ {fund, project}`.
2. **≥ 4 distinct** allocators back it (tune N; 4 caught this one at 6). Weight by
   allocator quality: count `tier ∈ {core, key}` and `cls ∈ {alt_manager, corporate,
   sovereign, vc}` (institutional capital), not retail/individual.
3. Within a short window (e.g. 30d) — a *coordinated* launch, not accretion over years.

**Strength:** `= distinct qualifying backers` (6 here), boosted by the scale and
anchor flags below. Emit as a **sector signal** on the target's sector (here
`datacenters`) **and** set `active_signal: true` on each constituent flow + attach an
`entity_id`-matched node signal on the vehicle, so the dashboard lights it natively
(it already renders `sector.signals[]`, per-flow `active_signal`, and node `signals[]`).

### Sub-flag: `vendor_anchored` (circular / vendor financing)
When one of the co-investors is **also the demand the vehicle ultimately buys from** —
here NVIDIA both anchors the consortium *and* sells the GPUs the $500B will purchase —
set `vendor_anchored: true` and boost strength. This is the analytically important
part: vendor-financed demand (the vendor helps fund its own order book) means the
hardware's apparent over-supply / under-appreciation risk is smaller than it looked.
Detect via: a co-investor entity that is a primary supplier in the same sector /
appears as a target-beneficiary elsewhere in the ledger.

### Scale: `announced_size`
These announcements disclose a **headline size** ("$500B+") even when per-leg `amount`
is `null`. Please **parse it from the source into a structured `announced_size` field**
(on the vehicle node and/or the round). When `announced_size ≥ $50–100B`, tag the
signal `landmark: true` and boost strength. This also lets the dashboard weight by size
instead of only by backer count.

### Status: fire on `candidate`, tag `provisional`
The core miss: landmark structural news should **not be invisible until every leg is
confirmed.** Let this rule fire on `status: candidate` announcements, but tag the
signal `provisional: true` (and/or keep flow `status: candidate`) so the UI can render
it as "announced, unconfirmed." Downgrade/withdraw if it doesn't confirm within a
window.

---

## Also: extend `network_convergence`
Two small changes make the existing rule cover this class too:
1. Allow **fund / project / SPV** targets, not only companies.
2. Allow it to fire on **candidate** flows for landmark announcements (same
   `provisional` tag).

## Payload fields requested (so the dashboard can retire its stopgap)
- `nodes[].announced_size` / `round.announced_size` — structured headline size.
- `nodes[].anchor` or `flows[].circular_financing` — the vendor-anchor flag.
- Signal objects: `provisional: bool`, `landmark: bool`, `vendor_anchored: bool`.

Once the engine emits the signal + `active_signal` on these flows, delete
`classifyConsortiums` in `src/components/research/capitalflow/classification.js` and the
`!n.landmark` watch-hide exemptions in `CapitalFlowMap.jsx` — the engine becomes the
single source of truth again (zero data latitude).
