# Complete AI Infrastructure Ecosystem Mapping Blueprint

**Version**: 2.0 (Integrated Master)
**Date**: 2026-08-18
**Scope**: Complete AI buildout mapping with 25 pivotal nodes → 200+ entities, monthly evolution cycles
**Deliverable**: Single specification for Claude Code agents covering research, network integration, and ongoing maintenance

> **Статус в этом репозитории.** Пользователь передал этот документ 2026-08-18, сразу
> после приёмки пилота v2 (карта, якорная на NVIDIA — 106 сущностей, 243 связи, 16 слоёв,
> `ECOSYSTEM-V2-BLUEPRINT.md`). Он сохранён дословно ниже. Источник ОБЯЗАТЕЛЬСТВ —
> `ECOSYSTEM-V3-PROMPT-ENGINE.md` и `ECOSYSTEM-V3-PROMPT-DASHBOARD.md`, которые
> **расширяют** замороженный контракт v2, а не заменяют его с нуля.
>
> **Главное открытие перед стройкой.** Документ описывает себя как 18-недельную кампанию
> «от 25 узлов к 200+», подразумевая, что все 25–26 пивотов исследуются заново. Проверка
> уже доставленных данных v2 показала: **26 из 26 пивотов уже имеют полные,
> подтверждённые источниками профили** — двухшаговый радиус вокруг NVIDIA и щедрый
> список слежения из блюпринта v2 уже вобрали в себя весь ландшафт железа, софта,
> лабораторий и политики, который называет этот документ. Единственная буквально
> отсутствующая сущность — `google-cloud` отдельно от `google`/`google-deepmind`.
>
> Реальный дефицит — не профили пивотов, а **рёбра между пивотами, не проходящие через
> NVIDIA** (документ сам объясняет это как главную причину для сетевого анализа — «AMD
> конкурирует с NVIDIA, но оба зависят от TSMC» и подобное). Из 325 возможных пар пивотов
> уже есть 53 ребра; из оставшихся 272 подавляющее большинство пар **не имеют реальной
> связи и не должны её получить** — форсировать ребро там, где его нет, нарушает
> собственное правило блюпринта «доказательство или нет ребра». Точечная проверка нашла
> 11 пар с вероятной реальной, но недокументированной связью — см. промпт движка.
>
> **Вывод: это не 18-недельная исследовательская кампания, а прицельная достройка сети**
> поверх уже готовых данных — пометить пивотов, дозаполнить ~11 рёбер одним
> исследовательским проходом, посчитать сетевые метрики (центральность, точки отказа,
> подграфы), перейти со схемы «один якорь» на схему «26 пивотов». Ниже документ сохранён
> целиком как источник СМЫСЛА — таксономия слоёв, рубрика критичности, семантика
> подграфов и версионирования остаются в силе. Как источник ПЛАНА недель/фаз он не
> применяется буквально.

---
## Executive Summary

### The Vision

Map the **complete AI infrastructure buildout** as a living, interconnected network—not as separate silos of "NVIDIA ecosystem" or "TPU ecosystem," but as a single coherent system showing how all pivotal players, their relationships, and their dependencies create the AI infrastructure that powers the future.

### The Approach

**Start narrow, grow organic**:

1. **Phase 1 (Weeks 2-8)**: Research 25 known pivotal nodes deeply
2. **Phase 2 (Weeks 9-14)**: Discover and research 50-80 secondary nodes (organic discovery during pivotal research)
3. **Phase 3 (Weeks 15-18)**: Expand to 150-200 entities, complete network visualization
4. **Phase 4 (Ongoing)**: Monthly refresh cycles; verify, update, discover new relationships; maintain network as living system

### Key Principles

- **Network-centric, not pivot-centric**: Shows relationships between ALL major players
- **Research-driven discovery**: Secondary nodes aren't predetermined; they emerge during research
- **Framework scalability**: Same 15-layer taxonomy, relationship semantics, and criticality scoring apply globally
- **Monthly living system**: Network updated continuously; changes tracked; timeline preserved
- **Credibility through rigor**: All relationships sourced (Tier 1-2 minimum); criticality scored via formula; risks explicitly assessed

### Deliverables at Each Phase

| Phase | Weeks | Nodes | Edges | Agents | Output |
|-------|-------|-------|-------|--------|--------|
| **Phase 1: Pivotals** | 2-8 | 25 | 80-120 | 5 (hardware, software, labs, infra, policy) | Fully sourced pivotal profiles + relationships |
| **Phase 2: Secondary** | 9-14 | 75-105 | 150-250 | +1 (secondary research) | Secondary node profiles; organic growth recorded |
| **Phase 3: Expansion** | 15-18 | 150-200 | 300-400 | +1 (synthesis) | Complete network object; vulnerability analysis |
| **Phase 4: Ongoing** | Monthly | 150-200+5/mo | 300-400+10/mo | All agents | Monthly changelog; updated network; trend analysis |

---

## Core Concept: From Single-Pivot to Complete Network

### The Problem with Single-Pivot Analysis

When you map only "NVIDIA's ecosystem," you get:

- **Center**: NVIDIA at hub
- **Radiating edges**: Suppliers upstream, customers downstream
- **Blind spots**: Relationships between other nodes (AMD <-> PyTorch, Google <-> Anthropic, Microsoft <-> OpenAI) invisible
- **Incomplete picture**: "What breaks the system?" question unanswerable

**Example of what you miss**:

- NVIDIA competes with Google (TPU), but both depend on TSMC
- AMD competes with NVIDIA, but both use PyTorch + CUDA ecosystem
- OpenAI validates NVIDIA's necessity, but could theoretically use TPU
- Energy becomes bottleneck for NVIDIA growth, but also applies to all players

### The Solution: Network Analysis

When you map the **complete AI infrastructure as a network**, you see:

- **Multiple centers**: NVIDIA, Google, OpenAI, TSMC, PyTorch-each a node with incoming/outgoing relationships
- **Interconnections**: All relationships visible (not just radiating from one center)
- **Feedback loops**: Researchers -> PyTorch -> CUDA -> NVIDIA GPUs -> researchers (circular)
- **Chokepoints**: TSMC manufactures for NVIDIA + AMD + Intel (if removed, entire system breaks)
- **Vulnerability paths**: Taiwan risk -> TSMC risk -> NVIDIA + AMD + Intel all at risk
- **Alternative paths**: GPU path vs TPU path; both viable but interdependent
- **System resilience**: Which nodes have redundancy? Which don't?

### Why This Matters

**Investors**: Understand the complete ecosystem, not just one company's moat. Identify systemic risks (Taiwan) that affect all players.

**Research**: Model AI infrastructure as a network, revealing which nodes are truly critical vs replaceable.

**Narrative**: Tell the story of "AI infrastructure as a system" instead of "NVIDIA dominates AI."

---

## The 25 Pivotal Nodes (Seed List)

These are the companies/entities that, **if removed from the AI buildout, the entire system would collapse or be fundamentally different**.

### Hardware Layer (5 pivotals)

1. **NVIDIA** - GPU manufacturing, CUDA ecosystem (Criticality: 92)
2. **Google** - TPU manufacturing, vertically integrated (Criticality: 78)
3. **TSMC** - Foundry for all advanced chips (Criticality: 88)
4. **Intel** - CPU alternative, policy play (Criticality: 68)
5. **AMD** - GPU alternative for inference (Criticality: 62)

### Software & Frameworks (5 pivotals)

6. **PyTorch** - ML framework, de facto standard (Criticality: 85)
7. **JAX** - Alternative to PyTorch (Criticality: 72)
8. **CUDA** - GPU programming framework (Criticality: 92)
9. **Hugging Face** - Model hub, ecosystem infrastructure (Criticality: 75)
10. **vLLM** - Inference optimization (Criticality: 68)

### Model Labs (6 pivotals)

11. **OpenAI** - Largest demand validator (Criticality: 85)
12. **Anthropic** - Second demand validator (Criticality: 76)
13. **Meta AI** - Open models, PyTorch maintainer (Criticality: 72)
14. **Google DeepMind** - Research, Gemini, TPU-native (Criticality: 74)
15. **xAI** - Independent lab, Grok (Criticality: 58)
16. **DeepSeek** - Geopolitical wild card (Criticality: 65)

### Infrastructure & Scale (4 pivotals)

17. **Microsoft Azure** - Hyperscaler + OpenAI partnership (Criticality: 80)
18. **Amazon AWS** - Neutral hyperscaler, all options (Criticality: 78)
19. **Google Cloud** - TPU-native (Criticality: 76)
20. **Brookfield** - Data center REIT + energy (Criticality: 70)

### Critical Enablers (3 pivotals)

21. **ASML** - Chip equipment, EUV lithography (Criticality: 90)
22. **Arista Networks** - GPU cluster networking (Criticality: 72)
23. **Synopsys/Cadence** - Design tools (Criticality: 74)

### Geopolitical & Policy (3 pivotals)

24. **Taiwan** - TSMC location, geopolitical vulnerability (Criticality: 88)
25. **US Commerce Dept** - Export controls (Criticality: 86)

(Optional 26th: **ARM** - CPU/GPU IP licensing if detailed architecture mapping needed)

---

## 15-Layer Framework Applied Globally

All 25 pivotals (and secondary nodes discovered) are mapped to these 15 layers:

```
LAYER 0: GEOPOLITICAL & POLICY
  Nodes: Taiwan, US Commerce, CFIUS, China, Netherlands

LAYER 1: RAW MATERIALS & EQUIPMENT
  Nodes: ASML (EUV), rare earth suppliers, materials companies

LAYER 2: CHIP DESIGN INFRASTRUCTURE
  Nodes: Synopsys, Cadence, ARM (IP licensing)

LAYER 3: FOUNDRY & ADVANCED MANUFACTURING
  Nodes: TSMC, Samsung Foundry, Intel Foundry Services

LAYER 4: MEMORY SUPPLY
  Nodes: Micron, SK Hynix, Samsung (memory division), [secondary nodes discovered]

LAYER 5: SYSTEM INTEGRATION & PACKAGING
  Nodes: ASE, AMKOR, Super Micro, Wiwynn, [secondary]

LAYER 6: POWER & THERMAL MANAGEMENT
  Nodes: Eaton, Delta, Wartsila, thermal specialists, [secondary]

LAYER 7: ENERGY INFRASTRUCTURE
  Nodes: TerraPower, Commonwealth Fusion, Brookfield (power), [secondary]

LAYER 8: NETWORKING & INTERCONNECT
  Nodes: Arista, Broadcom, NVIDIA InfiniBand, custom optical, [secondary]

LAYER 9: DATA CENTER INFRASTRUCTURE
  Nodes: Digital Realty, Equinix, Brookfield (DC REIT), hyperscalers, [secondary]

LAYER 10: HYPERSCALE CLOUD PLATFORMS
  Nodes: AWS, Azure, Google Cloud, Oracle Cloud

LAYER 11: SOFTWARE FRAMEWORKS & MIDDLEWARE
  Nodes: PyTorch, JAX, vLLM, Ray, Kubernetes ecosystem, [secondary]

LAYER 12: MODEL LABS & RESEARCH
  Nodes: OpenAI, Anthropic, Meta, Google DeepMind, xAI, DeepSeek, [secondary]

LAYER 13: ECOSYSTEM INFRASTRUCTURE
  Nodes: Hugging Face, Databricks, Modal, CoreWeave, Lambda, [secondary]

LAYER 14: VERTICAL APPLICATIONS & INTEGRATORS
  Nodes: Salesforce, enterprise AI platforms, vertical SaaS, [secondary]

LAYER 15: CAPITAL & GOVERNANCE
  Nodes: NVIDIA Ventures, Sequoia, a16z, strategic investors, [secondary]
```

---

## Research Workflow: Per Pivotal Node

Each of the 25 pivotals follows this standardized 6-step workflow:

### Step 1: Core Business Profile
What does this entity do? Role in AI infrastructure? Founded when? Public/private/government? HQ? Revenue/scale? Mission statement?
Sources: company website, earnings calls, founder interviews (Tier 1-2).
Output: entity object with core fields.

### Step 2: Direct Relationships to Other Pivotals
Map direct connections to all 24 other pivotals: supply/buy, co-design, compete, validate/enable, invest, lock-in.
Sources: partnership announcements, earnings calls, product integrations, podcasts (Tier 2-3).
Output: relationship objects with source, target, type, strength, evidence, confidence.

### Step 3: Secondary Nodes Discovery
Continuously collect entities critical to understanding this pivotal: suppliers, customers, enabling tech, alternatives, investments, key partners not in the pivotal 25.
Output: ranked secondary candidates by mention count, relationship density, criticality signal, source quality.

### Step 4: Criticality Assessment
Same formula and scoring bands as the NVIDIA blueprint:
```
CRITICALITY = (Irreplaceability x 0.30) + (Lock-in Depth x 0.30) + (Time-to-Replace x 0.25) + (Strategic Control x 0.15)
```
Output: score (0-100) + component breakdown + narrative justification.

### Step 5: Risk Assessment
Competitive, geopolitical, market, technical, regulatory risk, each with likelihood, impact, timeline, mitigation, monitoring indicators.

### Step 6: Source Documentation
1-3 sources per relationship/claim (Tier 1-2 minimum for criticality claims), verified URLs, quotes under 15 words, tier, date, confidence.

---

## Secondary Node Discovery & Organic Growth

### Discovery Process
As the 25 pivotals are researched, secondary nodes emerge organically rather than being predetermined.

### Promotion Rules
A secondary node is promoted to secondary-level research when:
1. **Multi-pivot mention**: appears in research of 3+ pivotal nodes
2. **Relationship density**: confirmed relationships to 2+ pivotals
3. **Criticality signal**: appears as the answer to "what would break if X disappeared?"
4. **Cross-referenced** across multiple Tier 2-3 sources
5. **Confidence threshold**: promotion confidence > 0.75

### Promotion Workflow
```
Candidates (discovered)
  -> Tracked in secondary node list
  -> Monitored across multiple research passes
  -> Promoted to secondary research when criteria met
  -> Integrated into network
  -> Monitored for pivotal upgrade (if criticality rises >75)
```

### Secondary Research (Lighter Weight)
Core profile, relationships to pivotals, criticality vs pivotals (not within secondary layer), risk assessment, source documentation.

---

## Network Mapping & Relationship Taxonomy

### Relationship Types

```
SUPPLY CHAIN (transactional, directional):
  MANUFACTURES, SUPPLIES, INTEGRATES, PACKAGES, DELIVERS_TO

STRATEGIC ENABLEMENT (bidirectional, compound value):
  ENABLES, CO_DESIGNS, OPTIMIZES_FOR, STANDARDIZES_ON

DEMAND & VALIDATION (directional, proof):
  VALIDATES_DEMAND, PROVES_ROI, PROVES_USE_CASE

LOCK-IN & SWITCHING COSTS (asymmetric):
  LOCKS_IN_DEVELOPERS, LOCKS_IN_PLATFORMS, PATH_DEPENDENT_ON

HEDGING & STRATEGIC INVESTMENT (directional):
  HEDGES_AGAINST, INVESTS_IN, DIVERSIFIES_SUPPLY

COMPETITION & SUBSTITUTION (multidirectional):
  COMPETES_WITH, THREATENS, COULD_DISRUPT, IS_ALTERNATIVE_TO

GEOPOLITICAL & CONTROL (directional, structural):
  CONTROLS_ACCESS_TO, SUBJECT_TO_RESTRICTION, GEOPOLITICALLY_DEPENDENT

INVESTMENT & GOVERNANCE (directional):
  FUNDED_BY, BOARD_SEAT, STRATEGIC_PARTNERSHIP

KNOWLEDGE & STANDARDS (bidirectional):
  SETS_BENCHMARK, DEFINES_CATEGORY, ENABLES_INTEROP
```

Note two types not present in the v2 taxonomy: `IS_ALTERNATIVE_TO` (rivalry spine — a viable substitute path exists, distinct from active competition) and `ENABLES_INTEROP` (physical spine — a standard lets otherwise-separate stacks talk to each other).

### Edge Attributes

Same shape as v2, plus network-level fields carried at the entity/network level (see Data Model below): strength, lock_in_depth, substitutability, direction, formed_date, strengthened_date, risk_level/type/timeline, status, confidence, sources, note.

---

## Data Model & Schema (network-level additions over v2)

```yaml
Entity (adds to v2's Entity):
  pivotal: boolean            # is this one of the 25-26 seed pivots?
  degree_centrality: float    # how many nodes connect to this?
  betweenness_centrality: float  # how many shortest paths pass through this?

Network:
  id: "ai-infrastructure-complete"
  version: string              # vX.Y-YYYY-MM
  as_of_date: date
  total_nodes: integer
  total_edges: integer
  pivotal_nodes: integer        # count of entities with pivotal:true
  secondary_nodes: integer
  network_density: float
  average_degree: float
  clustering_coefficient: float
  single_points_of_failure: [entity_id]
  critical_paths: [path]
  subgraphs:
    - id: "gpu-ecosystem"
      nodes: [ids]
      edges: [ids]
      description: "GPU training + inference stack"
    - id: "tpu-ecosystem"
      nodes: [ids]
      edges: [ids]
      description: "TPU stack and Google-native ecosystem"
    - id: "infrastructure-backbone"
      nodes: [ids]
      edges: [ids]
      description: "Manufacturing and geopolitical layer"
```

---

## Agent Organization & Assignment

```
Agent: Network-Orchestrator
  Role: overall coordination, pivotal assignment, secondary promotion
  Output: network topology, vulnerability report, promotion decisions

Agent: Research-Pivotal-Hardware      -> NVIDIA, Google, TSMC, Intel, AMD, ASML, ARM       (layers 0-5)
Agent: Research-Pivotal-Software      -> PyTorch, JAX, CUDA, Hugging Face, vLLM, TensorFlow (layers 10-12)
Agent: Research-Pivotal-Labs          -> OpenAI, Anthropic, Meta, Google DeepMind, xAI, DeepSeek (layers 12-13)
Agent: Research-Pivotal-Infrastructure -> Azure, AWS, GCP, Brookfield, Wartsila, Arista     (layers 8-10)
Agent: Research-Pivotal-Policy        -> Taiwan, US Commerce, CFIUS, China, Netherlands     (layers 0, 15)

Agent: Research-Secondary-Nodes (Phase 2) — lightweight research on promoted secondary nodes
Agent: Network-Synthesis (Phase 3) — integrate all nodes/relationships, network statistics, vulnerability analysis
```

---

## Implementation Phases (as originally scoped)

| Phase | Weeks | Nodes | Edges | Output |
|---|---|---|---|---|
| 1: Pivotals | 2-8 | 25 | 80-120 | Fully sourced pivotal profiles + relationships |
| 2: Secondary | 9-14 | 75-105 | 150-250 | Secondary node profiles; organic growth recorded |
| 3: Expansion | 15-18 | 150-200 | 300-400 | Complete network object; vulnerability analysis |
| 4: Ongoing | Monthly | +5/mo | +10/mo | Monthly changelog; updated network; trend analysis |

---

## Monthly Maintenance & Evolution System

### Change Detection Framework (10 categories)
1. New nodes  2. Removed nodes  3. Relationship additions  4. Relationship removals
5. Relationship updates  6. Criticality changes (>5 pts)  7. Phase changes
8. Risk changes  9. Source updates  10. Layer assignment changes

### Versioning
Format `vX.Y-YYYY-MM` (X = major/restructuring, Y = minor/monthly release).

### Changelog Format
Summary, statistics (added/removed/changed counts), added nodes (discovery context + confidence),
removed nodes (reason), updated relationships, phase changes, criticality changes (old->new + why),
risk escalations, key observations.

### Stale Node Detection
Not verified in >6 months -> flagged, re-verification prioritized by criticality.

### Historical Archive
All versions preserved; enables time-travel, diff analysis, timeline visualization, trend analysis.

---

## Worked Example: Monthly Changelog Shape

```yaml
Network-Changelog:
  version: "v1.3-2026-09"
  released: "2026-09-28"
  summary: |
    +8 new secondary nodes. +15 new relationships. 2 nodes removed (defunct).
    5 nodes phase-changed. Criticality reassessments. Risk escalation: TSMC HIGH -> CRITICAL.
  statistics:
    total_nodes: 87
    total_edges: 203
    nodes_added: 8
    nodes_removed: 2
    relationships_added: 15
  added:
    nodes:
      - id: "wartsila"
        reason: "Discovered during NVIDIA/Brookfield research; critical for dense GPU cooling"
        confidence: 0.85
        sources: 2
  updated:
    phase_changes:
      - id: "coreweave"
        old_phase: "EMERGING"
        new_phase: "SCALING"
        reason: "50K GPU deployments; Series B $2.1B valuation; 50%+ YoY growth"
    criticality_changes:
      - id: "amd"
        old_score: 62
        new_score: 74
        reason: "MI300 shipping in volume; hyperscaler adoption increasing"
    risk_changes:
      - id: "tsmc"
        risk_type: "GEOPOLITICAL"
        old_level: "HIGH"
        new_level: "CRITICAL"
        reason: "US-Taiwan tensions escalate; war risk timeline accelerates"
```

---

## Dashboard Integration

```
Timeline View: slider showing network state per month; replay growth; see when nodes/edges appeared
Change Highlights: "new this month", "phase changed", "risk escalated" badges
Diff View: "compare vX vs vY", highlight what changed with sources
Trend View: criticality trend, risk trend, growth trend
Subgraph Toggle: GPU ecosystem / TPU ecosystem / infrastructure backbone / combined
Vulnerability Analysis: single points of failure, critical paths, risk heatmap
```
