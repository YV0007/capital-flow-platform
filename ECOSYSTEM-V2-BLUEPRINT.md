# NVIDIA Ecosystem Representation Blueprint
**Version**: 1.0
**Date**: 2026-08-18
**Scope**: Complete ecosystem mapping framework for NVIDIA, expandable to other entities
**Deliverable**: Specification for Claude Code research agents + dashboard visualization contract

> **Статус в этом репозитории.** Этот документ — ИСТОЧНИК СМЫСЛА для второй версии карты
> «Экосистема». Он получен от пользователя 2026-08-18 и сохранён дословно.
> Источник ОБЯЗАТЕЛЬСТВ — два промпта сборки:
> `ECOSYSTEM-V2-PROMPT-ENGINE.md` и `ECOSYSTEM-V2-PROMPT-DASHBOARD.md`.
> Там же живёт замороженный контракт передачи. При расхождении текста побеждает контракт
> в промптах; смысл, зачем поле существует, ищут здесь.
> Первая версия карты (12 слоёв, экосистема `ai-datacenters`, фикстура на 62 компании)
> отправлена в `archive/ecosystem-v1/` и в работе больше не участвует.

---

## Table of Contents
1. [Core Concept](#core-concept)
2. [Entity Taxonomy (15 Layers)](#entity-taxonomy-15-layers)
3. [Relationship Taxonomy](#relationship-taxonomy)
4. [Criticality Scoring Model](#criticality-scoring-model)
5. [Data Model & Schema](#data-model--schema)
6. [Source Hierarchy & Evidence Weights](#source-hierarchy--evidence-weights)
7. [Agent Research Workflows](#agent-research-workflows)
8. [NVIDIA Blueprint: Layer-by-Layer](#nvidia-blueprint-layer-by-layer)
9. [Worked Examples](#worked-examples)
10. [Timeline & Phase Model](#timeline--phase-model)
11. [Implementation Notes](#implementation-notes)

---

## Core Concept

### From Supply Chain to Ecosystem

**Old approach (still used)**: Supply dependency mapping
- Question: "Who manufactures what for whom?"
- Direction: One-way (upstream -> downstream)
- Edge types: `SUPPLIES`, `MANUFACTURES`, `INTEGRATES`
- Result: Linear, hierarchical display

**New approach (this document)**: Strategic interdependence mapping
- Question: "Who makes each other more valuable? Who is locked in? Who hedges what risk?"
- Direction: Multi-directional, circular
- Edge types: 10+ strategic relationships including `ENABLES`, `VALIDATES_DEMAND`, `LOCKS_IN`, `HEDGES_AGAINST`, `COMPETES_WITH`
- Result: Interconnected network showing moats, risks, and co-evolution

### Why This Matters

NVIDIA's moat is not the chip alone. As Jensen Huang states repeatedly: *"It's not about the hardware, it's the ecosystem."*

The ecosystem has five layers (per Huang's framework, which we expand to 15):
1. **Energy** - electricity is the binding constraint
2. **Chips** - design + manufacturing (NVIDIA + TSMC + memory suppliers)
3. **Infrastructure** - data centers, cooling, networking
4. **Software & Models** - frameworks (CUDA, PyTorch), model labs (OpenAI, Anthropic)
5. **Applications** - where ROI is realized

But there are also **invisible layers**:
- **Capital & Governance** - who funds whom (venture arms, strategic investors)
- **Geopolitics & Policy** - who controls access (US Commerce, CFIUS, Taiwan)

This blueprint maps all 15 layers and their relationships.

---

## Entity Taxonomy (15 Layers)

### Layer 0: Geopolitical Control

**Purpose**: Supply chain is vulnerable to country/region-level decisions. Export controls, war, trade wars can break the entire chain overnight.

**Entities to track**:

| Entity | Role | Criticality | Key Relationship to NVIDIA |
|--------|------|-------------|---------------------------|
| **United States** | Home jurisdiction | CRITICAL | Gatetender of exports (Commerce Dept controls H100/A100 sales) |
| **Taiwan** | Supply jurisdiction | CRITICAL | TSMC location; geopolitical risk is tail risk |
| **South Korea** | Supply jurisdiction | HIGH | Memory manufacturing (SK Hynix); allied fab (Samsung Foundry) |
| **Japan** | Supply jurisdiction | MEDIUM | Equipment (ASML partner), memory (Micron subsidiary location) |
| **Netherlands** | Equipment control | HIGH | ASML (chip-making equipment export controls) |
| **China** | Restricted market | HIGH | 2nd largest revenue opportunity; export controls; competitive threat |
| **European Union** | Regulatory | MEDIUM | Data sovereignty, AI regulation (affects NVIDIA market) |
| **US Commerce Dept** | Policy gatekeeper | CRITICAL | Sets export control rules; can shut down revenue in a day |
| **CFIUS** | Investment gate | HIGH | Vets foreign acquisitions; can block NVIDIA partnerships |

**Data to capture per geopolitical entity**:
```
{
  id: "country-us",
  name: "United States",
  type: "GEOPOLITICAL_JURISDICTION",
  role: "HOME_JURISDICTION",
  relationships: [
    {
      type: "CONTROLS_EXPORT_OF",
      target: "H100",
      strength: 100,
      note: "Commerce Department export restrictions",
      sources: ["Commerce.gov", "NVIDIA 10-K risk factors"]
    },
    {
      type: "GATES_STRATEGIC_ACQUISITIONS",
      target: "NVIDIA_partnerships",
      strength: 90,
      note: "CFIUS reviews foreign investments in NVIDIA",
      sources: ["CFIUS filings"]
    }
  ],
  geopolitical_risk: "HIGH",
  timeline: "Ongoing since 2022"
}
```

---

### Layer 1-4: Silicon Supply Chain

**Purpose**: Raw materials -> chip design -> chip manufacturing -> packaging

**Entities to track**:

#### L1: Raw Materials & Equipment
- **Rare earths suppliers** (China-dominant; geopolitical risk)
- **Equipment makers** (ASML = EUV lithography; Japan = materials; US = design tools)

#### L2: Chip Design Infrastructure
- **Design tools**: Synopsys, Cadence (EDA software)
- **Design partners**: ARM (IP licensing), Intel (design collaboration on memory interfaces)

#### L3: Foundry & Process Technology
- **TSMC** (NVIDIA's primary partner; 92% of advanced chips)
- **Samsung Foundry** (alternative; less advanced but critical hedge)
- **Intel Foundry Services** (emerging alternative; geopolitical lever)

#### L4: Memory Supply
- **HBM (High Bandwidth Memory)**: Micron, SK Hynix, Samsung
- **GDDR**: Micron, Samsung
- **NVMe storage**: Western Digital, Kioxia, Samsung

#### L5-L7: Systems, Power, Cooling, Networking
- **System integrators**: Supermicro, Wiwynn, ASRock
- **Power distribution**: Eaton, Delta Electronics
- **Cooling**: Wartsila, Rittal, Liquid cooling specialists
- **Networking**: Arista (switches), Broadcom (Ethernet chips), NVIDIA (InfiniBand)
- **Cable & interconnect**: Custom optical manufacturers

#### L8-L9: Infrastructure & Cloud Operators
- **Hyperscalers**: AWS, Microsoft Azure, Google Cloud (also competitors)
- **Inference clouds**: CoreWeave, Lambda Labs, Crusoe Energy
- **Energy**: Brookfield, TerraPower, Commonwealth Fusion Systems
- **Data center REIT**: Digital Realty, Equinix

#### L10-L11: Software Frameworks & Middleware
- **ML frameworks**: PyTorch (Meta), JAX (Google), TensorFlow (Google)
- **Inference optimization**: vLLM, Ray, Anyscale
- **Orchestration**: Kubernetes ecosystem, Ray
- **Container runtime**: Docker, containerd
- **Observability**: Prometheus, Grafana, DataDog

#### L12: Foundation Models & Labs
- **Frontier labs**: OpenAI, Anthropic, Google DeepMind, Meta AI, xAI
- **Chinese labs**: DeepSeek (geopolitical wildcard)
- **Open-source leaders**: Hugging Face, Stability AI
- **Specialized labs**: Recursion (biotech), Cohere (NLP), others

#### L13: Enterprise Applications & Vertical SaaS
- **Enterprise platforms**: Databricks, Salesforce Einstein, Splunk
- **Vertical AI**: BioXcel (drug discovery), others by industry
- **AI infrastructure for enterprises**: Hugging Face, Modal

#### L14: Capital & Governance
- **NVIDIA venture arm**: GVF (NVIDIA Ventures)
- **Co-investor syndicates**: Sequoia Capital, a16z, Benchmark
- **Strategic investors**: Sovereign wealth funds (Abu Dhabi, Norway)

#### L15: Policy & Regulation
- **Government AI initiatives**: US CHIPS Act, EU AI Act
- **Research funding**: NSF, DOE (US), national initiatives elsewhere
- **Standards bodies**: IEEE, ISO (AI safety standards)

---

## Relationship Taxonomy

### Edge Types & Semantics

```
CATEGORY 1: SUPPLY CHAIN (Transactional, directional)
  MANUFACTURES       -> Foundry makes chip for fabless company
  SUPPLIES           -> Vendor provides material/component to buyer
  INTEGRATES         -> System integrator assembles components
  PACKAGES           -> Packaging vendor assembly for chip
  DELIVERS_TO        -> Logistics of final product

CATEGORY 2: STRATEGIC ENABLEMENT (Bidirectional, compound value)
  ENABLES            -> X makes Y's business model viable
                        Example: PyTorch enables deep learning; CUDA enables PyTorch
  CO_DESIGNS         -> X & Y improve each other through joint engineering
                        Example: NVIDIA + Arista co-design networks for GPU clusters
  OPTIMIZES_FOR      -> X is purpose-built for Y's requirements
                        Example: Wartsila cooling optimized for H200 thermal profile

CATEGORY 3: DEMAND & VALIDATION (Directional, proof-of-concept)
  VALIDATES_DEMAND   -> Y proves X's necessity/viability
                        Example: OpenAI training proves H100 necessity exists
  PROVES_ROI         -> Y demonstrates X generates profitable business
                        Example: CoreWeave profitability proves inference cloud model works
  PROVES_USE_CASE    -> Y is reference implementation for X
                        Example: Drug discovery companies prove NVIDIA for biotech

CATEGORY 4: LOCK-IN & SWITCHING COSTS (Asymmetric)
  LOCKS_IN_DEVELOPERS -> Developers write for X's ecosystem, can't easily switch
                         Example: CUDA locks in millions of ML researchers
  LOCKS_IN_PLATFORMS  -> Platform depends on X at multiple layers
                         Example: Hyperscalers locked into NVIDIA stack (CUDA + hardware + support)
  PATH_DEPENDENT_ON   -> Y's evolution follows X's trajectory
                         Example: PyTorch evolution follows CUDA capabilities

CATEGORY 5: HEDGING & RISK MANAGEMENT (Strategic investments)
  HEDGES_AGAINST      -> X invests in Y to reduce risk from Z
                         Example: NVIDIA invests in CoreWeave to hedge against hyperscaler monopoly
  INVESTS_IN          -> X provides capital to Y for strategic reasons (not just ROI)
                         Example: NVIDIA ventures in Hugging Face ensures model ecosystem alignment
  DIVERSIFIES_SUPPLY  -> X maintains Y as backup in case primary fails
                         Example: NVIDIA & Samsung Foundry as TSMC alternative

CATEGORY 6: COMPETITION & FRAGMENTATION
  COMPETES_WITH       -> X & Y fight for same market but remain interdependent
                         Example: AMD competes with NVIDIA but both depend on TSMC + same developer tools
  THREATENS           -> Y's success undermines X's position
                         Example: TPU threatens NVIDIA's training lock-in (but doesn't eliminate it yet)
  COULD_DISRUPT       -> Y could displace X if certain conditions occur
                         Example: Europe's AI chip initiatives could disrupt NVIDIA dominance regionally

CATEGORY 7: GEOPOLITICAL & CONTROL
  CONTROLS_ACCESS_TO  -> X gates supply/market access for Y
                         Example: US Commerce controls NVIDIA's ability to export H100s
  SUBJECT_TO_RESTRICTION -> Y faces export/import/investment restrictions
                            Example: NVIDIA products face China restrictions
  EXPORT_CONTROLLED_BY -> X's governance determines Y's market reach
                          Example: TSMC manufacture is subject to Taiwan export law
  GEOPOLITICALLY_DEPENDENT -> Y's supply chain is vulnerable to X's status
                              Example: NVIDIA depends on Taiwan's stability

CATEGORY 8: INVESTMENT & FINANCIAL
  FUNDED_BY          -> X provides capital to Y
  BOARD_SEAT         -> X has governance influence over Y
  STRATEGIC_PARTNER  -> X & Y have formal partnership agreement
  CUSTOMER_OF        -> X buys from Y (transactional relationship)

CATEGORY 9: KNOWLEDGE & MOAT TRANSFER
  STANDARDIZES_ON    -> Industry coalesces around X's standard
                        Example: ML industry standardizes on CUDA + PyTorch
  SETS_BENCHMARK     -> X's performance becomes the goal Y compares to
                        Example: NVIDIA's performance-per-watt becomes industry benchmark
  DEFINES_CATEGORY   -> X's strategy defines how Y thinks about market
                        Example: Jensen's "five-layer cake" frames how everyone thinks about AI infrastructure
```

### Edge Attributes

Every edge must have:

```yaml
{
  id: "nvidia-tsmc-manufactures",
  source: "nvidia",
  target: "tsmc",
  type: "MANUFACTURES",

  # Strength of relationship (0-100)
  strength: 95,

  # Lock-in depth (0-100): how many layers depend on this?
  lock_in_depth: 90,

  # Substitutability (0-100): can this be replaced?
  # (inverse: 0 = irreplaceable, 100 = easily replaced)
  substitutability: 5,

  # Direction
  direction: "BIDIRECTIONAL",  # or UPSTREAM, DOWNSTREAM, LATERAL

  # Time dimension
  formed_date: "1998",  # when did relationship form?
  strengthened_date: "2020",  # when did it intensify?

  # Risk dimension
  risk_level: "HIGH",  # CRITICAL, HIGH, MEDIUM, LOW
  risk_type: "GEOPOLITICAL",  # GEOPOLITICAL, SUBSTITUTION, MARKET, REGULATORY
  risk_timeline: "2-5 years",  # when could risk manifest?

  # Confirmation
  status: "CONFIRMED",  # CONFIRMED, HIGH_CONFIDENCE, SIGNAL
  confidence: 0.95,  # 0-1 scale

  # Evidence
  sources: [
    {
      type: "OFFICIAL_PARTNERSHIP",
      title: "NVIDIA 10-K filing - Risk Factors",
      url: "sec.gov/...",
      tier: 1,
      date: "2026-04-30",
      quote: "We depend on TSMC for advanced process nodes"
    },
    {
      type: "PRESS_RELEASE",
      title: "NVIDIA $100B investment commitment",
      url: "nvidia.com/...",
      tier: 1,
      date: "2025-06-15",
      quote: "NVIDIA commits $100B to TSMC for future generations"
    }
  ],

  # Notes
  note: "TSMC manufactures all H100/H200 GPUs on N5/N3 process. Strategic importance is CRITICAL due to 7-year lead time to build equivalent capacity. Geopolitical risk from Taiwan's political status.",

  # Last verification
  last_confirmed: "2026-08-18",
  verified_by: "agent-silicon",
}
```

---

## Criticality Scoring Model

### Formula

```
CRITICALITY = (Irreplaceability x 0.30) + (Lock-in Depth x 0.30) + (Time-to-Replace x 0.25) + (Strategic Control x 0.15)
```

Each component is scored 0-100.

### Component Definitions

#### 1. Irreplaceability (0-100)
**Question**: Can NVIDIA substitute this entity with something else?

**Scoring**:
- **95-100**: Monopoly or near-monopoly with 7+ year moat (TSMC, CUDA)
- **85-94**: Duopoly with 5+ year moat (PyTorch vs JAX; SK Hynix vs Micron)
- **75-84**: Multiple suppliers but limited by time/capital (Arista switching costs)
- **65-74**: Substitutes exist but are notably inferior (CoreWeave vs AWS, but CoreWeave is GPU-optimized)
- **50-64**: Clear alternatives; main advantage is momentum (vLLM vs other inference optimizers)
- **30-49**: Commodity or easily replicated (generic DRAM supplier)
- **0-29**: Multiple identical substitutes (generic connector manufacturer)

**Examples**:
```
TSMC:         95  (only fab at world scale; 7yr lead to replicate)
PyTorch:      90  (millions locked in; decades to migrate)
CUDA:         95  (entire software stack locked)
Arista:       75  (can use other switches, but purpose-built for GPUs)
CoreWeave:    50  (AWS could replicate inference cloud in 1-2 years)
Memory chip:  40  (Micron vs SK Hynix interchangeable)
Generic PSU:  15  (any quality PSU works)
```

#### 2. Lock-in Depth (0-100)
**Question**: How many layers of the stack depend on this entity?

**Scoring**:
- **95-100**: Affects 4+ stack layers (CUDA affects chips, software, models, apps)
- **85-94**: Affects 3+ layers (TSMC affects chip design, manufacturing, future roadmap)
- **75-84**: Affects 2 layers (PyTorch affects software + researcher training)
- **65-74**: Affects 1-2 layers with strong dependencies
- **50-64**: Affects 1 layer with medium dependencies
- **30-49**: Affects 1 layer with weak dependencies
- **0-29**: Single layer, easily swappable

**Examples**:
```
CUDA:          95  (software, models, researchers, enterprises locked in multiple layers)
TSMC:          90  (process tech + design rules lock entire GPU line + future nodes)
PyTorch:       85  (researchers + papers + models locked in)
Arista:        65  (only network layer, not software or models)
CoreWeave:     40  (only as inference infrastructure option, not locked at software level)
Generic DRAM:  35  (only component; easily swapped)
```

#### 3. Time-to-Replace (0-100)
**Question**: How many years to build a viable alternative?

**Scoring** (inverted - more years = higher criticality):
- **95-100**: 7+ years to build equivalent (TSMC fab, CUDA ecosystem)
- **85-94**: 5-7 years (major framework redesign)
- **75-84**: 3-5 years (new foundry service, platform migration)
- **65-74**: 2-3 years (new network architecture, system integration)
- **50-64**: 1-2 years (competitive product with feature parity)
- **30-49**: 6-12 months (incremental improvement, new vendor)
- **0-29**: Immediate substitution (commodity component)

**Examples**:
```
TSMC:           95  (7 years to build equivalent advanced fab)
CUDA:           95  (15+ years to migrate installed base of 500M+ GPUs)
PyTorch:        90  (3-5 years to mature competitive framework)
Arista (network): 70  (2-3 years to design competitive switch)
CoreWeave:      50  (AWS could launch equivalent in 1-2 years)
Generic memory: 15  (find replacement vendor in weeks)
```

#### 4. Strategic Control (0-100)
**Question**: Does NVIDIA have board seat, investment, co-design contract, or formal influence over this entity?

**Scoring**:
- **95-100**: NVIDIA owned subsidiary or has board seat + major investment
- **85-94**: Major investment ($1B+) + strategic partnership agreement
- **75-84**: Significant investment ($100M-$1B) + co-design contract
- **65-74**: Investment ($10M-$100M) + formal partnership
- **50-64**: Public partnership, no investment
- **30-49**: Informal relationship, no formal governance
- **0-29**: No relationship or adverse relationship

**Examples**:
```
NVIDIA (self):      100  (NVIDIA owns NVIDIA)
GVF-backed startups: 85  (NVIDIA has governance influence)
TSMC:               40  (no board seat, but $100B commitment gives leverage)
OpenAI:             50  (strategic partnership, no formal stake)
PyTorch:            40  (NVIDIA engineers contribute, but Meta owns it)
AWS:                20  (vendor relationship, no control)
```

### Composite Score Interpretation

```
90-100: CRITICAL
  - Must be in ecosystem for NVIDIA strategy to work
  - Irreplaceable at multiple layers
  - Example: TSMC (88), CUDA (92), PyTorch (85)

75-89: HIGH
  - Important but some alternatives exist
  - Would take 3-5 years to replace
  - Example: TSMC (88), OpenAI (72), Arista (74)

60-74: MEDIUM
  - Significant but substitutable
  - Competitive alternatives exist or emerging
  - Example: CoreWeave (65), Hugging Face (68), various memory suppliers (62)

45-59: MEDIUM-LOW
  - Useful but not essential to core moat
  - Easy to find alternatives
  - Example: Generic memory supplier (48), niche vertical SaaS (52)

0-44: LOW
  - Commodity or easily replaceable
  - No strategic value beyond transactional
  - Example: Generic connector maker (12), regional integrator (35)
```

---

## Data Model & Schema

### Entity Object Structure

```yaml
Entity:
  # Identification
  id: string                    # slug: nvidia, tsmc, arm-holdings, etc.
  name: string                  # official name
  aliases: [string]             # alternative names

  # Classification
  type: string                  # COMPANY, GEOPOLITICAL, GOVERNMENT_AGENCY, RESEARCH_ORG, STANDARD_BODY
  entity_role: string           # role in ecosystem (see Layer taxonomy above)
  layers: [integer]             # which layers does this entity participate in? (0-15)
  primary_layer: integer        # which layer is this entity most associated with?

  # Business Profile
  founded: date                 # when was entity created?
  public_private: string        # "PUBLIC" | "PRIVATE" | "GOVERNMENT" | "ACADEMIC"
  ticker: string                # stock ticker if public (e.g., "NVDA")
  hq_country: string            # headquarters location
  hq_region: string             # geographic region
  revenue_usd_b: float          # revenue in billions (optional)

  # Ecosystem Position
  criticality: float (0-100)    # composite criticality score
  criticality_factors:
    irreplaceability: float (0-100)
    lock_in_depth: float (0-100)
    time_to_replace: float (0-100)
    strategic_control: float (0-100)

  gravity: float (0-100)        # "pull" in ecosystem (market share, influence, adoption)
  gravity_signals:
    - developer_adoption: float
    - market_share: float
    - ecosystem_usage: float

  one_liner: string             # 1-sentence description of strategic role
  why_irreplaceable: string     # 2-3 sentence explanation of what breaks if this entity fails

  # Relationships
  relationships: [Relationship] # see relationship object below

  # Geopolitical & Risk Profile
  geopolitical_risk: string     # "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  geopolitical_risk_details: string
  export_control_regime: string # if applicable
  supply_chain_concentration: float (0-100) # is this entity concentrated in one region?

  # Technology & Moat
  tech_nodes: [TechNode]        # specific IP/capabilities owned by this entity
  enabling_tech: [string]       # what key tech does this company enable/provide?

  # Lifecycle
  phase: string                 # "EMERGING" | "SCALING" | "MATURE" | "AT_RISK" | "DECLINING"
  first_seen: date              # when did entity first appear in NVIDIA ecosystem?
  last_confirmed: date          # when was data last verified?
  stale: boolean                # is data older than 6 months?

  # Discovery & Evidence
  sources:
    - tier: 1-6                 # source reliability tier
      type: string              # type of source (OFFICIAL, PRESS_RELEASE, RESEARCH, etc.)
      url: string               # link to source
      accessed: date            # when was source accessed?

Relationship:
  id: string                    # unique edge ID
  source_id: string             # entity A
  target_id: string             # entity B
  type: string                  # edge type from taxonomy

  # Strength & Dependency
  strength: float (0-100)       # how strong is this relationship?
  lock_in_depth: float (0-100)  # how many layers are locked in?
  substitutability: float (0-100) # can this be replaced? (inverse scale)

  # Direction & Semantics
  direction: string             # "UPSTREAM" | "DOWNSTREAM" | "LATERAL" | "BIDIRECTIONAL"
  is_reversible: boolean        # can this relationship be reversed?

  # Timeline
  formed_date: date             # when did relationship form?
  strengthened_date: date       # when did it intensify?

  # Risk Profile
  risk_level: string            # "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  risk_type: string             # "GEOPOLITICAL" | "SUBSTITUTION" | "MARKET" | "REGULATORY" | "TECHNICAL"
  risk_timeline: string         # "IMMEDIATE" | "1-2 YEARS" | "2-5 YEARS" | "5+ YEARS"
  risk_mitigation: string       # how is NVIDIA managing this risk?

  # Confirmation & Evidence
  status: string                # "CONFIRMED" | "HIGH_CONFIDENCE" | "SIGNAL"
  confidence: float (0-1)       # confidence score based on source quality
  sources: [Source]             # all supporting sources

  note: string                  # narrative notes

TechNode:
  id: string                    # unique ID for this technology node
  label: string                 # name of the technology
  owner_id: string              # which entity owns this?
  description: string           # what does this tech do?
  strategic_importance: string  # how important to NVIDIA moat?

Source:
  tier: integer (1-6)           # source reliability (1=official, 6=social media)
  type: string                  # OFFICIAL, PARTNERSHIP, EARNINGS_CALL, RESEARCH, etc.
  title: string                 # title or description
  url: string                   # link
  date: date                    # publication date
  accessed: date                # when did we access it?
  quote: string                 # relevant quote (under 15 words)
  confidence: float (0-1)       # confidence in this source
```

---

## Source Hierarchy & Evidence Weights

### Tier System

**Tier 1: Official NVIDIA Sources** (Confidence: 0.95-1.0)
- NVIDIA 10-K / 10-Q SEC filings
- NVIDIA earnings call transcripts
- NVIDIA press releases
- Jensen Huang bylined essays (blogs.nvidia.com)
- NVIDIA official white papers (AI Factory Design Guide, etc.)
- NVIDIA patent filings (USPTO)
- NVIDIA investor presentations

**Tier 2: Official Partner Sources** (Confidence: 0.90-0.95)
- Partner press releases announcing NVIDIA collaboration
- Partner earnings calls mentioning NVIDIA
- Partner product documentation (specifies NVIDIA compatibility)
- NVIDIA-Certified Systems database
- NVIDIA partner directory (official listing)
- Co-branded announcements

**Tier 3: Direct Communication** (Confidence: 0.85-0.90)
- Podcasts where Jensen speaks (Dwarkesh Patel, Lex Fridman, All-In)
- Conference presentations (GTC, Davos, CSIS)
- Investor conferences
- Congressional testimony
- Interview transcripts (official, verified)

**Tier 4: Research & Academic** (Confidence: 0.75-0.85)
- Research papers citing/using NVIDIA hardware
- Academic leaderboards (Papers with Code, GitHub)
- Analyst reports (Gartner, IDC, Morgan Stanley)
- Industry databases (Crunchbase, PitchBook for funding)
- PhD dissertations from reputable institutions

**Tier 5: Secondary Reporting** (Confidence: 0.65-0.75)
- Tech press (TechCrunch, The Information, Ars Technica)
- Financial media (Bloomberg, Reuters, WSJ)
- Industry newsletters (SemiWiki, Stratechery)
- Reputable tech blogs (developer.nvidia.com, etc.)

**Tier 6: Tertiary & Signal Sources** (Confidence: 0.40-0.65)
- Podcasts about NVIDIA (not featuring principals)
- Social media (Twitter/X, LinkedIn, Reddit)
- Forums (HackerNews)
- Blog posts and Medium articles
- YouTube videos (unverified)

### Evidence Requirements

**For relationship confirmation**:
- **CONFIRMED**: Must have 2+ Tier 1-2 sources, OR 1 Tier 1 + 1 Tier 3
- **HIGH_CONFIDENCE**: 1 Tier 1 source, OR 2 Tier 2-3 sources
- **SIGNAL**: 1 Tier 4+ source, OR multiple indirect indicators

**For criticality scoring**:
- Each scoring component needs Tier 2-3 minimum evidence
- Geopolitical/risk assessments need Tier 1-2 sources
- Speculation / unconfirmed relationships excluded from critical path

---

## Agent Research Workflows

### Agent Types & Responsibilities

```
Agent: eco-silicon
  Layers: 1-4 (Raw materials -> Chip Design -> Foundry -> Memory)
  Entities: ~30 (TSMC, Samsung, Synopsys, Cadence, Micron, SK Hynix, etc.)
  Sources: SEC filings, earnings calls, NVIDIA partnerships, patent databases

Agent: eco-systems
  Layers: 5-9 (System Integration -> Power/Cooling -> Networking -> Infrastructure)
  Entities: ~40 (Supermicro, Arista, Eaton, Wartsila, Brookfield, etc.)
  Sources: Product releases, GTC speakers, NVIDIA Certified Systems, reference architectures

Agent: eco-power
  Layers: 5-7 (Power generation, cooling, thermal management)
  Entities: ~15 (TerraPower, CFS, Wartsila, cooling specialists)
  Sources: NVIDIA blog posts on energy, partnership announcements, GTC sessions

Agent: eco-software
  Layers: 10-12 (Frameworks, middleware, models, labs)
  Entities: ~60 (PyTorch, JAX, OpenAI, Anthropic, Hugging Face, vLLM, etc.)
  Sources: GitHub, papers, earnings calls, podcasts, research leaderboards

Agent: eco-capital
  Layers: 14-15 (Venture, governance, policy)
  Entities: ~30 (GVF portfolio, VC syndicates, government agencies)
  Sources: Crunchbase, PitchBook, SEC filings, venture announcements

Agent: eco-strategic
  Cross-layer coordination: Relationship mapping, risk assessment, timeline analysis
  Entities: All (focus on criticality, geopolitical risk, hedging)
  Sources: Synthesize from all agents, identify missing pieces
```

### Research Workflow Template

For each layer/agent, follow this workflow:

```
STEP 1: BASELINE DISCOVERY
  Input: Layer definition, known entities from previous runs
  Task: Find all active entities in this layer
  Sources:
    - NVIDIA official directories (partnerships, certified systems)
    - GTC agenda (filter by layer/topic)
    - NVIDIA white papers (ecosystem partner sections)
    - Industry databases (Crunchbase, GitHub)
  Output: List of 10-50 entities with basic info (name, founded, role)

STEP 2: ACTIVE STATUS CHECK
  Input: Entity list from Step 1
  Task: Confirm each entity is still active (not acquired, defunct, etc.)
  Check:
    - Company website: still operating?
    - Latest funding round: when?
    - Recent press releases: in last 6 months?
    - Crunchbase status: status field
  Output: Filtered list of active entities

STEP 3: NVIDIA RELATIONSHIP DETECTION
  Input: Active entity list
  Task: For each entity, find all ways it relates to NVIDIA
  Check:
    - NVIDIA partnership page: is this company listed?
    - NVIDIA certified systems: which products?
    - NVIDIA blog: mentions of this company?
    - Company press releases: mentions of NVIDIA?
    - Earnings calls: NVIDIA mentioned by company leadership?
  Questions to answer:
    - Does NVIDIA invest in this company?
    - Does NVIDIA partner with them? (co-design, bundling, etc.)
    - Do they supply to NVIDIA? Does NVIDIA supply to them?
    - Are they competitors? Co-competitors?
  Output: List of relationships per entity

STEP 4: CRITICALITY ASSESSMENT
  Input: Entities + relationships from Steps 1-3
  Task: Score each entity on criticality
  Assess:
    - Irreplaceability: Are there substitutes? How different?
    - Lock-in: How many stack layers depend on this?
    - Time-to-replace: How long to build alternative?
    - Strategic control: Does NVIDIA have influence?
  Sources: Earnings calls, investor presentations, research reports
  Output: Criticality scores (0-100) with justification

STEP 5: RISK & TIMELINE ASSESSMENT
  Input: Entities from Steps 1-4
  Task: Identify risks and phase evolution
  Assess per entity:
    - Geopolitical risk: Is supply/market threatened by policy?
    - Substitution risk: Could competitor displace this?
    - Market risk: Is market oversupplied/consolidating?
    - Technical risk: Could new tech make this obsolete?
    - Timeline: When could risks manifest?
    - Mitigation: How is NVIDIA managing each risk?
  Sources: 10-K risk factors, industry research, competitive analysis
  Output: Risk profile per entity with timeline

STEP 6: SOURCE DOCUMENTATION
  Input: All entities + relationships + scores from Steps 1-5
  Task: Document all evidence
  For each relationship:
    - Find 1-3 sources (Tier 1-3 minimum)
    - Extract quote (under 15 words)
    - Confirm tier & date
    - Verify URL still valid
  Output: Fully sourced entity/relationship objects

STEP 7: SYNTHESIS & QA
  Input: Complete entity/relationship dataset from Step 6
  Task: Cross-check and fill gaps
  Check:
    - Are there obvious missing entities? (agent notes them for follow-up)
    - Are relationships bidirectional where they should be?
    - Are criticality scores internally consistent?
    - Do scores match narrative in "why_irreplaceable" fields?
  Output: QA report, list of refinements needed
```

---

## NVIDIA Blueprint: Layer-by-Layer

### Layer 0: Geopolitical Control

**Primary Entities**: USA, Taiwan, South Korea, China, Netherlands, European Union

**Key Relationships**:

```
USA -> CONTROLS_EXPORT_OF -> H100/A100
  Strength: 100
  Risk: CRITICAL (Commerce Dept can shut down revenue in 24 hours)
  Sources: Commerce.gov regulations, NVIDIA 10-K

Taiwan -> MANUFACTURES -> All advanced NVIDIA GPUs
  Strength: 100
  Risk: CRITICAL (geopolitical risk; war would destroy supply)
  Sources: NVIDIA 10-K, Jensen interviews, TSMC announcements

Netherlands -> CONTROLS_EXPORT_OF -> ASML equipment
  Strength: 95
  Risk: HIGH (ASML restrictions affect chip manufacturing)
  Sources: Dutch government, ASML announcements

China -> RESTRICTED_MARKET_FOR -> NVIDIA (H100/A100)
  Strength: 90
  Risk: CRITICAL (geopolitical; 2nd largest revenue opportunity)
  Sources: US Commerce Dept, NVIDIA 10-K
```

### Layer 1-4: Silicon Supply Chain

**Primary Entities**: TSMC, Samsung Foundry, Synopsys, Cadence, Micron, SK Hynix, ARM, Intel

**Key Relationships**:

#### TSMC
```
NVIDIA -> MANUFACTURES_AT -> TSMC
  Strength: 95
  Lock-in: 90
  Irreplaceability: 95
  Criticality: 88
  Investment commitment: $100B (multiple tranches through 2026+)

  Evidence:
    - NVIDIA 10-K: "Substantially all of our products are manufactured by TSMC"
    - Jensen/Dwarkesh podcast: "$100 billion in commitments with foundries"
    - TSMC announcements: N5/N3 capacity dedicated to NVIDIA

  Risk: CRITICAL_GEOPOLITICAL (Taiwan location; war/tensions)
  Risk timeline: 2-10 years (depends on geopolitical escalation)

  Note: NVIDIA's entire H100/H200 line depends on TSMC's 5nm/3nm capacity.
        7-year lead time to build equivalent fab capacity.
        NVIDIA shares 30-40% of TSMC's leading-edge capacity.

TSMC -> SUPPLIES -> Advanced process technology
  Relationship type: Co-design
  NVIDIA + TSMC engineers collaborate on process roadmap

  Lock-in: 95 (NVIDIA's chip design tied to TSMC process rules)
```

#### Synopsys & Cadence (EDA Tools)
```
NVIDIA -> DEPENDS_ON -> Synopsys, Cadence
  Strength: 85
  Lock-in: 80 (design tools define what's possible)
  Criticality: 76

  Evidence:
    - NVIDIA job postings (Synopsys/Cadence expertise required)
    - Industry knowledge (all GPU design uses Synopsys/Cadence)
    - Research papers (chip design methodology citations)

  Note: NVIDIA cannot design H100 without Synopsys (simulation) & Cadence (place-and-route).
        Tools are commodity but industry-standard.
        Switching costs are very high (5+ years of design re-methodology).
```

#### Memory Suppliers (Micron, SK Hynix, Samsung)
```
NVIDIA -> BUYS_HBM_FROM -> Micron, SK Hynix, Samsung
  Strength: 90
  Lock-in: 85 (HBM is critical to H100 performance)
  Criticality: 78

  Evidence:
    - NVIDIA earnings calls (memory constraints discussed)
    - NVIDIA 10-K risk factors (HBM supply constraints)
    - Memory manufacturer announcements (NVIDIA as major customer)

  Redundancy: 3 suppliers = medium diversification
  Geopolitical risk: South Korea location (allied nation, but still regional risk)

  Note: HBM is 40% of H100 BOM cost. Shortage of HBM can constrain GPU production.
        NVIDIA has long-term agreements with all three suppliers.
        Time-to-replace: 2-3 years to develop alternative memory technology.
```

### Layer 5-9: Systems, Power, Cooling, Networking

**Primary Entities**: Supermicro, Wartsila, Eaton, Arista, Brookfield, NVIDIA InfiniBand ecosystem

**Key Relationships**:

#### Arista Networks
```
NVIDIA -> OPTIMIZES_NETWORK_WITH -> Arista
  Strength: 80
  Lock-in: 75 (network architecture is NVIDIA-specific)
  Criticality: 74
  Relationship type: CO_DESIGNS

  Evidence:
    - Arista datasheets (DCS fabric optimized for GPU clusters)
    - NVIDIA reference architectures (Arista as recommended switch vendor)
    - GTC sessions (Arista + NVIDIA joint presentations)
    - Earnings calls (Arista discussing NVIDIA design wins)

  Co-design: Yes
  Arista's Extensible Operating System (EOS) optimized for NVIDIA clusters
  NVIDIA Spectrum-X (NVIDIA's own Ethernet stack) co-designed with Broadcom

  Risk: SUBSTITUTION (AWS, Microsoft could deploy alternative networks)
  Risk timeline: 2-3 years for AWS/Azure to optimize networking

  Note: Arista dominates GPU cluster networking (>60% of new NVIDIA deployments).
        Switching costs: network redesign, retraining ops teams.
```

#### Wartsila & Cooling Ecosystem
```
NVIDIA -> OPTIMIZES_COOLING_WITH -> Wartsila
  Strength: 75
  Lock-in: 70 (thermal profile is NVIDIA-specific)
  Criticality: 68
  Relationship type: OPTIMIZES_FOR

  Evidence:
    - Product announcements (Wartsila + NVIDIA liquid cooling for H200)
    - GTC 2026 (Wartsila sponsoring cooling sessions)
    - NVIDIA blog posts on data center efficiency

  Note: Liquid cooling is becoming critical for dense GPU clusters.
        Wartsila develops cooling solutions optimized for NVIDIA's thermal characteristics.
        As GPUs get denser, cooling becomes 40%+ of TCO.
```

#### Brookfield & Power Infrastructure
```
NVIDIA -> DEPENDS_ON -> Brookfield (energy REIT)
  Strength: 70
  Lock-in: 65
  Criticality: 66
  Relationship type: ENABLES (Brookfield enables NVIDIA data centers)

  Evidence:
    - NVIDIA commentary (energy is "Layer 1" of five-layer cake)
    - Brookfield press releases (NVIDIA data center partnerships)
    - Energy sector reports

  Note: NVIDIA's inference clouds need consistent, abundant power.
        Brookfield owns/operates data center real estate where NVIDIA customers build.
        Energy supply is the bottleneck, not compute capacity.
```

### Layer 10-12: Software, Frameworks, Models

**Primary Entities**: PyTorch, OpenAI, Anthropic, Hugging Face, vLLM, Ray, Kubernetes

**Key Relationships**:

#### PyTorch & CUDA Lock-in
```
CUDA -> LOCKS_IN -> PyTorch ecosystem
  Strength: 95
  Lock-in: 95
  Irreplaceability: 95
  Criticality: 92

  Evidence:
    - PyTorch docs (CUDA is first-class, default GPU backend)
    - GitHub stats (PyTorch has 300K+ stars; JAX ~30K; mostly GPU-focused)
    - Academic papers (90%+ of ML research uses PyTorch + CUDA)
    - Developer surveys (CUDA has 90%+ mindshare among GPU developers)

  Note: Every ML researcher touching PyTorch writes CUDA-native code.
        Switching to different GPU requires weeks/months of recompilation.
        This is NVIDIA's deepest moat: path dependency at the developer level.

        Relationship is bidirectional:
        - PyTorch locked to CUDA (can't easily move)
        - CUDA locked to PyTorch adoption (existence of PyTorch proves usefulness)
```

#### OpenAI
```
OpenAI -> VALIDATES_DEMAND -> H100 necessity
  Strength: 95
  Lock-in: 85 (OpenAI's entire stack optimized for CUDA)
  Criticality: 85
  Relationship type: VALIDATES_DEMAND + CO_DESIGNS

  Evidence:
    - OpenAI papers (all mention NVIDIA hardware, training infrastructure)
    - OpenAI + NVIDIA partnership (Triton compiler, custom kernels)
    - Earnings data (OpenAI burning $B/yr on NVIDIA compute)
    - Jensen interviews (repeatedly mentions OpenAI as key validator)

  Co-design: Yes
    - OpenAI develops optimizations for H100 (flash attention, etc.)
    - NVIDIA develops CUDA features for OpenAI's needs

  Strategic investment: NVIDIA invested $100B+ through partnership

  Note: OpenAI's GPT-4 training proved H100s were necessary.
        This single proof point justified trillion-dollar infrastructure buildout.
        OpenAI is #1 demand validator for NVIDIA.
```

#### Anthropic
```
Anthropic -> VALIDATES_DEMAND -> H100 necessity
  Strength: 85
  Lock-in: 80
  Criticality: 76
  Relationship type: VALIDATES_DEMAND + CO_DESIGNS

  Evidence:
    - Anthropic papers (Claude trained on NVIDIA infrastructure)
    - Anthropic + NVIDIA partnership (co-optimizations announced)
    - Earnings reports (Anthropic burning $B/yr on compute)
    - Podcasts (Anthropic leadership discussing NVIDIA importance)

  Note: Anthropic is major demand validator (#2 after OpenAI).
        Proves that multiple labs depend on NVIDIA, not just OpenAI.
        Reduces risk that entire demand base is concentrated in one customer.
```

#### Hugging Face
```
Hugging Face -> ENABLES_MODEL_ECOSYSTEM -> NVIDIA adoption
  Strength: 80
  Lock-in: 75
  Criticality: 72
  Relationship type: ENABLES + HEDGES_AGAINST

  Evidence:
    - Hugging Face model hub (99%+ of models optimized for CUDA)
    - NVIDIA investment (venture capital participation)
    - Product announcements (HF + NVIDIA integration)

  Strategic investment: NVIDIA invests to keep model ecosystem NVIDIA-native
  Risk: HEDGING (if labs move away from NVIDIA, HF models become useless; NVIDIA invests to prevent this)

  Note: Hugging Face model ecosystem is CUDA-dominant.
        900K+ models on HF, 99% run best on NVIDIA.
        This creates massive switching cost: move away from NVIDIA = lose access to entire model ecosystem.
```

### Layer 13: Enterprise Applications

**Primary Entities**: Databricks, Salesforce, BioXcel, Recursion

**Key Relationships**:

#### Databricks
```
Databricks -> PROVES_ROI_FOR -> NVIDIA (in enterprises)
  Strength: 75
  Lock-in: 70
  Criticality: 68
  Relationship type: PROVES_ROI

  Evidence:
    - Databricks + NVIDIA partnership (jointly developed solutions)
    - Databricks AI Summit (NVIDIA featured)
    - Enterprise case studies (Databricks customers profitably using NVIDIA GPUs)

  Note: Databricks proves that enterprises can generate ROI on NVIDIA compute.
        This is "proof of product-market fit" for AI infrastructure.
        Databricks' success = NVIDIA's moat is economically real (not just technical).
```

### Layer 14: Capital & Governance

**Primary Entities**: NVIDIA Ventures (GVF), Sequoia Capital, a16z, Benchmark

**Key Relationships**:

#### NVIDIA Ventures Portfolio
```
NVIDIA -> INVESTS_IN -> [CoreWeave, Hugging Face, Crusoe, etc.]
  Relationship type: HEDGES_AGAINST (invests to control ecosystem, not just ROI)

  Portfolio examples:
    - CoreWeave: Hedges against hyperscaler monopoly on inference clouds
    - Hugging Face: Hedges against model ecosystem moving away from CUDA
    - Crusoe: Hedges against alternative inference chips

  Strategic logic:
    If CoreWeave fails -> hyperscalers monopolize inference -> customers can use AWS chips instead
    If HF ecosystem goes to TPU -> millions of models unavailable on CUDA -> NVIDIA loses moat
    If Crusoe gets traction -> alternative inference chips -> NVIDIA loses pricing power

  Therefore: NVIDIA invests $$$B to ensure these startups survive and remain NVIDIA-native.

  Criticality per investment: 60-75 (strategic hedging, not core business)
```

### Layer 15: Geopolitical & Policy

**Primary Entities**: US Commerce Dept, CFIUS, Taiwan Govt, EU AI Regulation

**Key Relationships**:

#### US Export Control
```
US Commerce Dept -> CONTROLS_EXPORT_OF -> H100/A100
  Strength: 100
  Risk: CRITICAL

  Evidence:
    - Official regulations (15 CFR 732.0 et seq.)
    - NVIDIA 10-K (risk factor: "export control restrictions could limit revenue")
    - Commerce Dept updates (changing restrictions in real-time)

  Impact on NVIDIA:
    - H100 cannot be exported to China (as of 2024)
    - Revenue loss: $5B+ (NVIDIA write-down in 2024)
    - New H20 chip designed to comply with restrictions (lower performance)

  Risk timeline: ONGOING (no resolution in sight)
  Risk mitigation: NVIDIA lobbying for restrictions removal (Huang testified to Congress)
```

---

## Worked Examples

### Example 1: TSMC Entity Profile (Complete)

```yaml
Entity:
  id: "tsmc"
  name: "Taiwan Semiconductor Manufacturing Company"
  aliases: ["TSMC", "Taiwan Semiconductor Mfg"]

  type: "COMPANY"
  entity_role: "FOUNDRY_PARTNER"
  layers: [3, 14]
  primary_layer: 3

  founded: 1987-02-01
  public_private: "PUBLIC"
  ticker: "TSM"
  hq_country: "Taiwan"
  hq_region: "Asia-Pacific"
  revenue_usd_b: 72.6

  criticality: 88
  criticality_factors:
    irreplaceability: 95
    lock_in_depth: 90
    time_to_replace: 95
    strategic_control: 40

  gravity: 95
  gravity_signals:
    market_share_semiconductor_foundry: 92
    nvidia_production_concentration: 92
    developer_ecosystem_dependency: 55

  one_liner: "Exclusive manufacturer of NVIDIA's most advanced GPUs; 92% market share in leading-edge foundry services; critical geopolitical chokepoint."

  why_irreplaceable: |
    TSMC manufactures 100% of NVIDIA's H100/H200 GPUs on 5nm/3nm process.
    No other foundry has equivalent capability (Samsung is 2-3 years behind).
    Building equivalent foundry capacity would take 7-10 years and $100B+.
    Path dependency: NVIDIA's entire chip design optimized for TSMC's process rules.

  relationships:
    - id: "nvidia-tsmc-manufactures"
      source: "nvidia"
      target: "tsmc"
      type: "MANUFACTURES"
      strength: 95
      lock_in_depth: 90
      direction: "UPSTREAM"
      formed_date: 1998
      strengthened_date: 2020
      risk_level: "CRITICAL"
      risk_type: "GEOPOLITICAL"
      risk_timeline: "2-10 years"
      status: "CONFIRMED"
      confidence: 0.98
      sources:
        - tier: 1
          type: "SEC_FILING"
          title: "NVIDIA 10-K Risk Factors"
          url: "sec.gov/..."
          date: 2026-04-30
          quote: "Substantially all of our products are manufactured by TSMC"
          confidence: 1.0
        - tier: 1
          type: "EARNINGS_CALL"
          title: "NVIDIA Q2 2026 earnings call"
          url: "nvidia.com/..."
          date: 2026-08-15
          quote: "TSMC capacity fully committed through 2027"
          confidence: 0.95

      note: |
        NVIDIA has $100B+ purchase commitments with TSMC.
        TSMC dedicates 30-40% of leading-edge capacity to NVIDIA.
        Geopolitical risk from Taiwan's political status (China tensions).
        Investment by NVIDIA in TSMC via massive capex commitments.
        Co-design: NVIDIA + TSMC engineers collaborating on N3/N2 roadmap.

    - id: "tsmc-taiwan-geopolitical"
      source: "tsmc"
      target: "taiwan"
      type: "GEOPOLITICALLY_DEPENDENT"
      strength: 100
      risk_level: "CRITICAL"
      risk_type: "GEOPOLITICAL"
      risk_timeline: "2-5 years"
      status: "CONFIRMED"
      note: |
        TSMC is 100% dependent on Taiwan's political stability.
        Potential scenarios:
          1. Military conflict: Would destroy TSMC fabs (probably intentionally)
          2. Reunification: Governance uncertainty, potential asset seizure
          3. Economic isolation: Supply chain could be cut off
        Impact: 92% of world's leading-edge chips made by one company in geopolitically fragile country

  geopolitical_risk: "CRITICAL"
  geopolitical_risk_details: |
    TSMC located in Taiwan, which faces potential military/political threats from China.
    US & allies view TSMC as strategic asset (hence recent TSMC US fab investments).
    Export controls: Taiwan can control semiconductor exports (already used as geopolitical tool).
    Supply chain concentration: 92% of advanced chips from single company in single location.

  export_control_regime: "TAIWAN_EXPORT_CONTROLS_APPLY"
  supply_chain_concentration: 92

  tech_nodes:
    - id: "tsmc-n5-process"
      label: "5nm (N5) process technology"
      description: "Leading-edge foundry process used for H100"
      strategic_importance: "CRITICAL"
    - id: "tsmc-n3-process"
      label: "3nm (N3) process technology"
      description: "Next-gen process for H200/future generations"
      strategic_importance: "CRITICAL"

  enabling_tech:
    - "Advanced process nodes (5nm, 3nm)"
    - "Extreme ultraviolet (EUV) lithography"
    - "High-density interconnect (HDI)"
    - "Co-design capability for custom workloads"

  phase: "MATURE"
  first_seen: 1998
  last_confirmed: 2026-08-18
  stale: false

  sources:
    - tier: 1
      type: "OFFICIAL_FILING"
      url: "sec.gov/cgi-bin/browse-edgar"
      accessed: 2026-08-18
    - tier: 1
      type: "PRESS_RELEASE"
      url: "tsmc.com"
      accessed: 2026-08-18
    - tier: 2
      type: "EARNINGS_CALL"
      url: "investor.tsmc.com"
      accessed: 2026-08-18
```

### Example 2: PyTorch Relationship (Complete)

```yaml
Relationship:
  id: "cuda-locks-in-pytorch"
  source_id: "cuda"
  target_id: "pytorch"

  type: "LOCKS_IN_DEVELOPERS"
  strength: 95
  lock_in_depth: 95
  substitutability: 5

  direction: "BIDIRECTIONAL"
  is_reversible: false  # (CUDA locked to PyTorch success; PyTorch locked to CUDA adoption)

  formed_date: 2016  # (when PyTorch became dominant)
  strengthened_date: 2019  # (when PyTorch overtook TensorFlow)

  risk_level: "LOW"  # (this lock-in is favorable to NVIDIA)
  risk_type: "NONE"

  status: "CONFIRMED"
  confidence: 0.99

  sources:
    - tier: 4
      type: "ACADEMIC_RESEARCH"
      title: "State of ML 2024 survey - PyTorch dominance metrics"
      url: "stateof.ai"
      date: 2024-09-01
      quote: "PyTorch used in 90% of published deep learning papers"
      confidence: 0.95

    - tier: 2
      type: "PRODUCT_DOCUMENTATION"
      title: "PyTorch CUDA First-Class Support"
      url: "pytorch.org/docs"
      date: 2026-08-18
      quote: "CUDA is the default and most-optimized backend for GPUs"
      confidence: 0.98

    - tier: 4
      type: "DEVELOPER_SURVEY"
      title: "Stack Overflow 2026 Developer Survey"
      url: "stackoverflow.com/insights"
      date: 2026-03-15
      quote: "CUDA + PyTorch is standard stack for 85% of ML engineers"
      confidence: 0.90

  note: |
    PyTorch + CUDA is the de facto standard in machine learning.

    Lock-in mechanism:
      1. CUDA is PyTorch's most optimized backend
      2. Developers write custom CUDA kernels for their models
      3. Moving to different GPU requires recompiling entire stack
      4. 500M+ installed GPUs running CUDA code
      5. Decades of academic papers/tutorials assume CUDA

    Switching costs:
      - Time: 3-6 months to port model to different GPU
      - Money: $100K-$1M per major model to reoptimize
      - Risk: Ported code may be less efficient, requiring retuning
      - Knowledge: CUDA-specific optimization knowledge not transferable

    Time-to-replicate:
      - 15-20 years to build equivalent developer ecosystem
      - (Assuming competitor invests heavily)
      - JAX has been around since 2018, still <5% market share

    Reversibility: NO
      - PyTorch cannot easily move away from CUDA (would break performance)
      - CUDA cannot be replaced without major PyTorch changes (would break userbase)
      - Both are locked together

    Strategic implication: This is NVIDIA's most durable moat.
    Even if competitors have better hardware, they can't overcome CUDA lock-in.
    Huang calls this "the CUDA moat" and it's his strongest argument.
```

---

## Timeline & Phase Model

Relationships and entities should be understood as evolving over time, not static.

### Relationship Lifecycle

```
Formation (T=0)
  - When relationship first established
  - Often opportunistic or contractual
  - Example: NVIDIA first uses TSMC (1998)

Scaling (T=1-3 years)
  - Relationship deepens, volume increases
  - Partners invest in co-optimization
  - Example: NVIDIA dedicates more % of revenue to TSMC (2000-2003)

Maturation (T=3-10 years)
  - Relationship becomes industry standard
  - Lock-in increases (switching costs rise)
  - Example: TSMC becomes exclusive NVIDIA partner for advanced nodes (2010-2020)

Reinforcement (T=10+ years)
  - Lock-in is now structural (rebuilding would take 5-10 years)
  - Partners heavily invested in joint roadmap
  - Example: NVIDIA + TSMC co-design roadmap through 2030 (2020-present)

At-Risk (T=N/A)
  - Competitor emerges, regulatory threat, geopolitical event
  - Partners explore alternatives
  - Example: Samsung Foundry as alternative (low but increasing threat, 2020-present)
```

### Entity Phase Progression

```
EMERGING (0-2 years)
  - New company or new product category
  - Small ecosystem impact
  - Example: CoreWeave (2023-2024)

SCALING (2-5 years)
  - Rapid growth, increasing lock-in
  - Becoming standard in ecosystem
  - Example: vLLM (2023-present, fast scaling)

MATURE (5+ years)
  - Established, industry-standard
  - Deep lock-in, switching costs high
  - Example: PyTorch (2016-present, mature)

AT_RISK (phase can appear at any time)
  - Competitive threat, substitution risk
  - Market consolidation (acquisition)
  - Example: CoreWeave (emerging but at-risk from AWS competition)

DECLINING (late-stage)
  - Market shifting away, adoption plateauing
  - Example: GDDR (being replaced by HBM in new generation)
```

### For NVIDIA Specifically: Timeline of Ecosystem Evolution

```
1998-2005: Formation Phase
  - NVIDIA founded (1993)
  - CUDA invented (2006)
  - Relationships: foundry only, few software partnerships

2006-2015: CUDA Ecosystem Scaling
  - CUDA released, PyTorch/TensorFlow built on top
  - More labs using NVIDIA
  - Relationships: software frameworks locked in

2016-2020: AI Era Maturation
  - Deep learning boom
  - PyTorch dominance + CUDA lock-in solidifies
  - Relationships: model labs (OpenAI, Anthropic) validate demand

2021-2023: Infrastructure Buildout
  - Trillion-dollar AI infrastructure plan
  - Data center ecosystem (CoreWeave, Lambda, Crusoe)
  - Relationships: capital + geopolitical hedging (GVF investments)

2024-2026: "Five-Layer Cake" Strategy
  - Jensen frames AI as infrastructure (not software)
  - Energy, networking, cooling become strategic
  - Relationships: power companies (TerraPower, CFS), infrastructure (Wartsila)

2026-2030: Projected
  - Consolidation in inference market (some competitors acquired)
  - Energy becomes #1 constraint
  - Policy/geopolitical relationship becomes more critical
```

---

## Implementation Notes

### Data Ingestion

1. **Monthly refresh cycle**: Agents re-research assigned layers
2. **Evidence-based updates**: Only update if new Tier 1-2 sources found
3. **Version control**: Track each change with source + date
4. **Conflict resolution**: If multiple sources conflict, use Tier 1 over Tier 2, etc.

### Visualization Contract

The ecosystem map dashboard consumes this data as follows:

```yaml
Input Schema (from this blueprint):
  entities: [Entity] (see schema above)
  relationships: [Relationship] (see schema above)

Dashboard Interpretation:
  node_size: criticality score (0-100)
  node_color: primary_layer + risk_level
  node_icon: entity_type (company=circle, geopolitical=star, etc.)

  edge_width: lock_in_depth (0-100)
  edge_color: relationship_type (enables=green, hedges=purple, controls=red)
  edge_style: status (CONFIRMED=solid, SIGNAL=dashed)

  edge_animation: formed_date -> last_confirmed (shows evolution over time)

  filters:
    - by_layer: show only entities in specific layer(s)
    - by_risk_level: filter by geopolitical/market/technical risk
    - by_phase: show only EMERGING, SCALING, MATURE, etc.
    - by_criticality: show only entities above/below threshold

  tooltips:
    - hover entity: shows one_liner + why_irreplaceable
    - hover edge: shows relationship type + lock-in explanation
    - hover risk badge: shows risk type + timeline + mitigation
```

### Integration with Claude Code

Agents should output structured YAML/JSON matching the schema above.

Example agent output format:

```yaml
# File: runs/2026-08-18/eco-silicon/discovered-entities.yaml
entities:
  - id: "synopsys"
    name: "Synopsys"
    type: "COMPANY"
    entity_role: "EDA_TOOLS_PROVIDER"
    layers: [2]
    criticality: 76
    criticality_factors:
      irreplaceability: 80
      lock_in_depth: 80
      time_to_replace: 75
      strategic_control: 35
    one_liner: "Provides design tools critical to GPU development; NVIDIA's chip design would be impossible without Synopsys"
    why_irreplaceable: "Synopsys (Primetime, ICC) is industry-standard for timing/power analysis. Switching tools would require 2-3 year methodology redesign."
    relationships:
      - target: "nvidia"
        type: "ENABLES_CHIP_DESIGN"
        strength: 85
        evidence:
          - tier: 4
            type: "INDUSTRY_KNOWLEDGE"
            note: "All GPU design uses Synopsys"
            confidence: 0.85

  # ... more entities
```

---

## Next Steps for Implementation

1. **Agent assignment**: Assign each layer (0-15) to agent(s)
2. **Initial research sprint**: Each agent completes baseline discovery + Step 1-2 of workflow
3. **Relationship mapping**: Agents complete Steps 3-4, identify all NVIDIA relationships
4. **Criticality scoring**: Agents complete Step 5, score all entities
5. **Source documentation**: Agents complete Step 6, document all evidence
6. **Synthesis**: eco-strategic agent validates consistency, identifies gaps
7. **Dashboard integration**: Feed into ecosystem visualization system
8. **Monthly refresh**: Agents re-verify on monthly cycle, update as needed

---

**Document status**: FINAL SPECIFICATION v1.0 for Claude Code
**Ready for**: Agent assignment and research sprint execution
**Not included** (next phase): Visualization design, dashboard code, sample research outputs

---

# ПРИМЕЧАНИЕ РЕДАКТУРЫ — где блюпринт сам себе противоречит

Документ выше сохранён дословно. При сборке обнаружены внутренние расхождения; ниже —
как они разрешены. **Во всех случаях побеждает замороженный контракт из промптов.**

1. **Арифметика критичности.** TSMC заявлен с `criticality: 88` при факторах
   95 / 90 / 95 / 40. По собственной формуле блюпринта это
   `0.30·95 + 0.30·90 + 0.25·95 + 0.15·40 = 85`. **Верна формула, а не число.**
   Ни одно значение `criticality` в файле передачи не пишется вручную: его считает
   движок. Все примерные итоги в блюпринте — иллюстрации, а не эталоны.
2. **Число слоёв.** Заголовок говорит «15 Layers», перечисление идёт L0…L15, то есть
   **16**. Контракт фиксирует 16.
3. **Полосы итогового балла.** TSMC (88) стоит в примерах и к полосе 90–100 CRITICAL,
   и к полосе 75–89 HIGH. Верна вторая: 88 — это HIGH.
4. **OpenAI.** В разборе слоя указан `criticality: 85`, в полосах — 72. Число
   определяется факторами на момент прогона; ни то, ни другое не переносится в данные.
5. **Роспись агентов.** `eco-systems` (5–9) и `eco-power` (5–7) перекрываются, при этом
   L0 и L13 не закреплены ни за кем. Контракт вводит восемь агентов без перекрытий и
   без дыр.
6. **Отвязка от DC-AI.** Решение пользователя от 2026-08-18, принятое после передачи
   блюпринта: новая карта не наследует таксономию исследования «дата-центры для ИИ» и
   не ссылается на него. Поле `dcNode` не существует.

**Главное предупреждение.** Все конкретные цифры и утверждения в блюпринте —
`strength: 95`, «$100B+ через партнёрство», «>60% новых развёртываний», «900K+ моделей» —
это **примеры формата, а не данные**. Ни одно из них не переносится в карту без
собственного источника, дословной цитаты ≤15 слов и живого URL. Блюпринт показывает,
КАК выглядит заполненная запись, и не является источником тира 1.
