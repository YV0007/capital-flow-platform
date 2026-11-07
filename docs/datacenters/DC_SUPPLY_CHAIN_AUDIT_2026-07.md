# DC AI Supply-Chain Map — Currency Audit & Expansion Proposals

_July 2026. Audits the 10-layer / 31-node map (built ~May 2026) against the mid-2026 state of the AI build-out, and proposes ADD / RENAME / SPLIT / MERGE / DROP deltas. Written in English; adapt wording into the RU dashboard as needed._

## 0. Confidence note (read first)

The deep-research pass finished its **search + fetch** (6 angles, 31 sources, 144 extracted claims) but the **adversarial-verification + synthesis** stages were cut short by a usage limit. So:

- **[verified]** — cross-checked 3 independent votes (5 claims). High confidence.
- **[1-source]** — pulled from one credible source, not independently triangulated (~19 claims). Strong signal, but confirm a number before quoting it to the client.
- Everything else is my own domain synthesis, labelled as judgment.

Sources leaned on: SemiAnalysis ClusterMAX 2.0, CBRE Global DC Trends 2026, aiinframap.com, astutegroup (HBM), datacenterfrontier (neoclouds), datacenterknowledge (BESS), iot-analytics (cooling/CDU), Stanford Law (vertical-AI moats), comsoc/techblog (networking silicon).

---

## 1. Currency check — existing 31 nodes

Verdict for each. Short version: **the raw-inputs → power → site spine is still accurate and holds up well.** The staleness is concentrated in the top (chips/assembly missing HBM + networking) and the bottom (compute + output are far too thin).

| Node | Verdict | Reason |
|---|---|---|
| GOES steel, Photoresist, Specialty chem, InP/GaAs, Titanium | **keep** | Still the correct raw-input chokepoints. |
| Litho/Fab tools, Test, EDA, IP/Bonding | **keep** | Equipment oligopoly unchanged. |
| AI Silicon | **keep + split-adjacent** | Still core, but **networking silicon** should come out as its own node (see §2). |
| Wide-Bandgap | **keep** | Power-semi story intact. |
| Adv Packaging | **keep + split** | Break **HBM memory** out of packaging (see §2) — it's a distinct oligopoly, not an assembly step. |
| PCB / Substrates | **keep** | Still a recurring bottleneck. |
| Nuclear, SMR, Fuel Cells, Gas Pipelines, Gas Turbines | **keep** | Power-origin scarcity is _more_ true in mid-2026, not less. |
| Power, Transformers, Switchgear, Power Mgmt | **keep** | Grid-delivery is still the single hardest constraint. Consider adding **grid-interconnection / on-site substations** (see §2). |
| Photonics/CPO, Dark Fiber, Fiber/Cable | **keep** | Interconnect intensity rising (AI racks need ~10–36× more fiber than CPU racks; DAC/AOC lead-times >20 wks) [1-source]. |
| Liquid Cooling | **keep + sub-split** | Direct-to-chip is now the default; **CDUs** are a distinct product market (see §2). |
| MEP, Contracting | **keep** | Labor/skills bottleneck unchanged. |
| **AI Compute Infra** (L9, one node) | **SPLIT** | Too thin. Split into neoclouds vs colocation/wholesale (§3). |
| **Frontier Labs + AI Integration** (L10, two nodes) | **EXPAND → whole band** | This is the client-flagged gap. Needs a full 6–7 node application/services stack (§4). |

**Net:** nothing to DROP. The map isn't wrong — it's **incomplete at the two ends**: the compute/output bottom is one-tenth as detailed as the physical-infra top.

---

## 2. Gaps / new nodes — keep or skip

| Candidate | Rec | Rationale + example names |
|---|---|---|
| **HBM memory** as own node | **ADD (high)** | 3-player oligopoly — SK Hynix ~62%, Micron ~21%, Samsung ~17% [1-source]; HBM3E→HBM4 inflection is _the_ 2026 memory story. Distinct from packaging. Names: SK Hynix (KRX 000660), Micron (MU), Samsung (KRX 005930). |
| **Networking silicon & switches** | **ADD (high)** | Merchant AI-switching is a genuine 3-way contest: Broadcom Tomahawk 6 / Jericho, Nvidia Spectrum-X, Cisco Silicon One G300 (all 102.4 Tbps, TSMC 3nm) [1-source]. Plus Arista (ANET), Marvell (MRVL), Astera Labs (ALAB, connectivity). Huge $ node, currently invisible in the map. |
| **On-site energy storage / BESS** | **ADD (med)** | Emerging as a distinct requirement to buffer AI power swings + as a diesel alternative (Oracle deploying; AIP+Caterpillar "Monarch" 2 GW by 2027) [1-source]. Names: Tesla (TSLA, Megapack), Fluence (FLNC), Eos (EOSE). |
| **Backup power / gensets** | **ADD (med), MERGE** | Fold together with BESS into one "on-site power buffer & backup" node. Names: Caterpillar (CAT), Cummins (CMI), Generac (GNRC). |
| **Grid interconnection / on-site substations** | **ADD (med)** | Natural extension of the Power-Delivery band — where the >8-yr queue actually lives. Names: Quanta (PWR), Burns & McDonnell (pvt), Bechtel (pvt), utilities. |
| **CDUs / cooling split** | **ADD (med), as sub-split of Liquid Cooling** | Direct-to-chip is now industry-standard; CDU market matured (nVent 1.8 MW CDUs; Rittal 1 MW pods @250 kW/rack) [1-source]. Split cooling → direct-to-chip / immersion / CDU. Names: Vertiv (VRT), nVent (NVT), Boyd (pvt), Rittal (pvt), LiquidStack (pvt, immersion). |
| **Data labeling / RLHF data** | **ADD (small)** | Belongs in the app/services band. Names: Scale AI (pvt), Surge AI (pvt), Mercor (pvt), Turing (pvt). |
| **DCIM / DC-management software** | **SKIP / defer** | Fragmented, smaller; fold into the apps band later if needed. |
| **Water supply** | **SKIP** | Real constraint, but reads as a permitting/ESG risk, not an investable company-set. Mention as context, not a node. |

---

## 3. FOCUS A — Cloud / DC operators & neoclouds

Today: one thin "AI Compute Infra" node. **Recommend splitting into 2 nodes (+1 context node):**

**(a) Neoclouds / GPU clouds** — the real story.
- SemiAnalysis **ClusterMAX 2.0** tiering [verified]: **CoreWeave** sole _Platinum_; **Nebius, Oracle, Azure, Crusoe, Fluidstack** _Gold_; **Google, AWS, together.ai, Lambda** lead _Silver_. Market is huge + fragmented — 209 providers tracked, ~95% volume coverage [verified].
- Economic wedge: neoclouds price GPU compute at **~⅓ of hyperscaler rates** (e.g. ~$34/hr vs ~$98/hr) [1-source]; segment growing **>200%/yr, ~$180 B by 2030** [1-source].
- Financing shift: **GPU-backed debt** is the new model — CoreWeave went from small risk-capital to multi-B secured facilities (incl. $2.6 B), ~$50 B mcap [1-source].
- **Durability is genuinely uncertain** [1-source] — creditworthiness thresholds, saturation, dependence on Nvidia/hyperscaler substrates, margin pressure. Flag honestly rather than overstate.
- Public names: CoreWeave (CRWV), Nebius (NBIS), IREN (IREN), Applied Digital (APLD). Private: Crusoe, Lambda, Together, Fluidstack, Vultr.

**(b) Colocation / wholesale (REITs & operators)** — the landlord layer.
- Public REITs: Equinix (EQIX), Digital Realty (DLR). Private/PE: Vantage, QTS (Blackstone), Switch, Aligned, CyrusOne, EdgeConneX.
- REIT-vs-operator distinction matters for how the client models cashflows.
- Market context [verified]: **Q1 2026 record-low vacancy** (N. Virginia 0.3%, Atlanta 1%, Dallas-Ft.Worth 1.8%); **limited supply through 2030 → record pricing.** So the backdrop is _tight, not oversupplied_ — the oversupply worry did not materialize as of mid-2026.

**(c) Hyperscalers** — keep as a _context_ node (MSFT/AMZN/GOOGL/META/ORCL), not a pick, consistent with the "picks-and-shovels behind the obvious names" thesis.

---

## 4. FOCUS B — Application & services layer (the client-flagged gap) — DEEPEST

Today: 2 nodes (Frontier Labs, AI Integration). This is where the map is thinnest and where the client asked to go deepest. **Propose a full band of 6–7 nodes:**

1. **Foundation / frontier models** — OpenAI, Anthropic, Google DeepMind, xAI, Mistral, Meta (Llama). Mostly private; capital-intensive; winner unclear.
2. **Inference & serving** — Fireworks, Together, Baseten, Groq, Replicate. Where model output is actually delivered; **margin-compressed** (commoditizing).
3. **Middleware / agent infrastructure** — per aiinframap this resolves into ~7 sub-nodes [1-source]: agent frameworks & MCP (LangChain, LlamaIndex), vector DBs (Pinecone, Weaviate, Chroma), **eval & observability** (LangSmith, Braintrust, Arize), AI gateways / LLM routing (OpenRouter, Portkey), agent memory, agent runtime/sandbox (E2B, Modal), agent security & governance. **This is the picks-and-shovels of the app layer** — most thesis-consistent place to fish.
4. **Vertical AI applications** — Coding (Cursor/Anysphere, GitHub Copilot, Cognition/Devin), Legal (Harvey, Legora), Healthcare (Abridge, OpenEvidence), Customer support (Sierra, Decagon, Intercom Fin), Voice agents, Enterprise search (Glean).
5. **AI-enabled services / SI / consulting** — Accenture (ACN), Palantir (PLTR), ServiceNow (NOW), Salesforce (CRM), + boutique AI SIs.
6. **Data labeling / RLHF** — Scale AI, Surge AI, Mercor, Turing.
7. **AI security & guardrails** — Lakera, Protect AI, HiddenLayer.

**Where the durable value sits** [Stanford Law, 1-source — but it matches the consensus and is worth leading with]:
- The moat is **NOT the foundation model** (GPT/Claude/Gemini are interchangeable).
- It's the **"harness" + proprietary data + system integration + embedded judgment.**
- 5-level durability ladder: (A) workflows/UX [low] → (B) vertical harness & custom tools → (C) built-in compliance → (D) data-driven "operating system" → (E) embedded judgment [highest].
- **Implication for the client:** durable value concentrates in (i) vertical apps with proprietary data + workflow lock-in, and (ii) the middleware picks-and-shovels (eval, observability, gateways, serving) — **not** in thin GPT-wrappers and **not** in the model layer itself. This is a clean, defensible narrative for the dashboard.

---

## 5. Concrete proposal summary (prioritized)

**Phase 1 — infra completeness (smaller, high-confidence):**
1. ADD **HBM Memory** node (split from Adv Packaging).
2. ADD **Networking Silicon & Switches** node.
3. SPLIT **AI Compute Infra** → **Neoclouds** + **Colocation/DC REITs**.
4. (optional) ADD **On-site Storage/Backup (BESS+gensets)** and **CDU cooling** sub-split.

**Phase 2 — the application & services band (the client's priority, biggest business relevance):**
5. EXPAND L10 into the 6–7 nodes in §4, grouped as a dedicated "Applications & Services" band, with the value-capture narrative from Stanford as the framing.

**Skip / defer:** Water (context, not node); DCIM (fold in later).
**Rename:** "AI Integration" → "Enterprise AI / внедрение"; post-split "AI Compute Infra" → "Neoclouds".

**Structural note:** all Phase-1+2 adds would take the map from **10 layers / 31 nodes → ~12 layers / ~44 nodes.** That's a real structural change (layout, edges), so I'd phase it: ship Phase 1 first (mechanical, low-risk), then design the Applications band deliberately since it's the differentiator.

---

_Caveat repeated: the [1-source] figures (HBM shares, neocloud growth %, pricing ratios, moat ladder) come from single credible sources because the verification pass was interrupted. Re-run the deep-research (the workflow is resumable) to harden the numbers before any go into client-facing copy._
