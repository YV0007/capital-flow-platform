# Brookfield — Risk Section Merge Plan
**Date:** 2026-07-17 · **Target:** `src/data/holdings-v2/brookfield.json` → `sections[3]` (`risk`)
**Inputs:** client's 13-section Asset-Risk architecture · locked arc (`holdings-risk-section-architecture`) · `brookfield-framework-audit-2026-07-17.md`
**Status:** AWAITING APPROVAL — nothing written yet.

---

## 0. The reconciliation in one line

The client's 13 sections are **kept as substance and causal logic**, but re-ordered onto the locked
decision arc and de-duplicated: **6 parallel "Risk One…Six" → 3 risks sorted by origin**, and the
per-asset-class retelling (§9) becomes **sector tags inside the map**, not six more stories.

**Nothing in the 13 sections is discarded except restatement and rows with no disclosure.**

---

## 1. Why the shape changes (the constraint being honored)

Locked memory, written after this morning's rejection:
> "7 blocks in a row each restated the same seven risks in a different visual shape. Density read as noise."
> Hard rule: **"Never restate the same risk in two visual forms."**

The client's plan restates each risk **three times**: once as Risk N (§3–§8), once per asset class
(§9), once in the transmission chain (§10). §4 (leverage) and §5 (refinancing) are also **one causal
chain split in two** — refinancing pressure is the mechanism by which leverage bites.

**The merge keeps every mechanism, states each exactly once.**

---

## 2. Mapping — where all 13 sections land

| Client's section | Lands in | Treatment |
|---|---|---|
| §1 Opening Risk Thesis | **B1 Thesis** | Kept whole, incl. the key question |
| §2 Where Risk Actually Sits | **B2 Map** | Kept whole — ownership walk + managed-vs-invested. **Promoted**, it's the strongest available material |
| §3 Risk One — cash flows weaken | **B3 Origin 3** | Merged into "what the capital is invested in" |
| §4 Risk Two — leverage amplifies | **B3 Origin 2** | **Merged with §5** — one chain, not two |
| §5 Risk Three — refinancing | **B3 Origin 2** | Merged with §4 |
| §6 Risk Four — valuations too high | **B3 Origin 1** | Kept whole — best-evidenced risk in the file |
| §7 Risk Five — capital requirements | **B3 Origin 3** | Merged with §3 (both are "assets consume cash") |
| §8 Risk Six — concentration | **B3 Origin 3** + **B7** | The one-rate-factor point carries into the macro adjudication |
| §9 Asset-Class Risk Stories | **B2/B3 sector tags** | **De-duplicated.** Per-class detail becomes tags + exposure $ on map rows |
| §10 How Risk Reaches Brookfield | **B4 Transmission** | **Kept whole — NEW block.** The plan's best contribution |
| §11 Downside Scenario | **B8 Scenarios** | Kept whole, base/moderate/severe |
| §12 Mitigants & Remaining Risk | **B9 Mitigants** | **Kept whole — NEW block.** Each mitigant + its limitation |
| §13 Final Investment Conclusion | **B10 Verdict** | Kept whole — the 5 answers + rating block |

---

## 3. The merged block list (10 blocks)

| # | Block | Type | Source | New? |
|---|---|---|---|---|
| B1 | Тезис: в чём собственно риск | `text` | §1 | rewrite |
| B2 | Где риск на самом деле сидит | `risksplit` | §2 + §9 tags + locked step 1 | **upgraded** |
| B3 | Три риска по происхождению | `facts` | §3–§8 consolidated | rewrite |
| B4 | Как риск актива доходит до BN | `flows`/`text` | §10 | **NEW** |
| B5 | Сколько стоит каждый риск | `table` | §6/§11 + locked step 2 | keep+extend |
| B6 | Что рынок уже заложил в цену | `bars` | locked step 3 | **keep as-is** |
| B7 | Взгляд компании — и где это ставка | `quote`+`facts` | locked step 4 + audit §11.1 | keep+extend |
| B8 | Как это разыграется | `scenarios` | §11 + locked step 5 | keep+extend |
| B9 | Что защищает — и где защита кончается | `cards` | §12 | **NEW** |
| B10 | Итог | `text` | §13 + locked step 6 | rewrite |

`timeline` (ближайшие риск-события) retained after B8.

**Order rationale:** map → transmit → price → market → scenarios → mitigants → verdict.
Each answers a question the previous one raises. No block restates a prior block's content.

---

## 4. B3 — the consolidation, in detail

Six parallel risks → **three sorted by origin** (locked rule: "risks unsorted by origin" was
diagnosed failure cause #2 — "a sector risk, an accounting risk and a people risk sat as siblings").

### Origin 1 — How value is computed (client's §6)
**Evidence, all primary:**
- 59% of assets ($102.8bn of $175.3bn) marked by management, not by market
- Level 3 financial assets **+29%** ($10.9bn → $14.1bn) **while Level 1+2 fell**
- WA discount rate **8.1% → 7.4%** (−70bp); WA terminal cap **5.9% → 5.4%**
- ⚠️ **Stated both ways per audit §6.6:** BN attributes the move to **disposal mix**, not remarking
  (US office/retail sales, India REIT deconsolidation, Australian senior living). A 70bp drop looks
  aggressive until the footnotes — the section must say so.
- 25bp sensitivity: FV **$85,613M → $3,973M** (consolidated, pre-tax, incl. NCI — BN's own caveat:
  amounts to shareholders "may be significantly less")

### Origin 2 — How assets are financed (client's §4 **+** §5, one chain)
```
Operating weakness / higher rates
→ lower coverage → refinancing on worse terms → additional equity required → lower BN equity value
```
**Evidence available:** total debt **$263,732M** (non-recourse $249,461M = subsidiary $19,221M +
property-specific $230,240M) · recourse **$14,271M, 5% verbatim** (arithmetic 5.4%) · corporate WA
maturity **15y @ 4.8%** · RE LTV table (Supplemental p24): Core Plus Office 30 assets, $3,152M,
**LTV 54.6%**, occ 91.7%
**Omitted per your decision:** DSCR, interest coverage, net debt/EBITDA by class, fixed-vs-floating,
non-recourse maturity schedule — **none disclosed**.

### Origin 3 — What the capital is invested in (client's §3 + §7 + §8)
**Evidence:** segment table (⚠️ audit: DE/FFO/NOI **not comparable across segments** — the section
must carry the caveat, never rank or sum them) · Revenue **−$10.9bn YoY** driven by PE (41,401 →
28,807), of which MD&A attributes **$15.5bn to asset sales** · commitments **$9.5bn, +51%** ·
fee-bearing capital by segment (Credit $281.6bn · Infra $109.2bn · RE $102.8bn · Energy $72.2bn ·
PE $48.0bn) · **concentration: the classes differ but share one factor — the long rate.**

---

## 5. The one honest line about disclosure (your "omit and say so once")

Placed once, at the foot of B3 Origin 2:

> Brookfield не раскрывает по классам активов ни покрытие процентов, ни график погашения
> non-recourse долга, ни долю плавающей ставки. 95% долга группы — на уровне активов, и именно там
> сидит риск для акционера. **Проверить этот риск по первичке нельзя — и это само по себе вывод,
> а не пробел в нашей работе.**

Turns the gap into a finding. Appears **once**, not as blank rows.

---

## 6. What B4 (transmission) contains — the client's §10, kept whole

Three channels, each a chain with a number attached:

| Channel | Chain | Anchor number |
|---|---|---|
| Прямой экономический | падение оценки актива → ниже капитал BN → ниже NAV | 25bp = **$3,973M** FV |
| Денежный поток | ниже распределения → ниже cash earnings → меньше на дивиденды/байбэк | NCI **$(12,963)M** — **~70% консолидированного FFO не принадлежит BN** |
| Франшиза | слабые активы → слабые фонды → меньше реализаций → ниже carry и fundraising | накопленный нереализованный carry **$11.8bn**; реализовано $157M/кв |

The NCI point is load-bearing and currently under-used: **total equity $166.2bn vs common equity
$43.8bn** because IFRS control-based consolidation means BN "control[s] entities in which we hold
only a minority economic interest" (MD&A p99, verbatim).

---

## 7. What B9 (mitigants) contains — the client's §12, kept whole

Each mitigant paired with its limitation, per the client's own instruction:

| Mitigant | Number | Limitation |
|---|---|---|
| Non-recourse financing | 95% of debt | Protects the parent from creditors — **but BN still loses equity, distributions and reputation** |
| Fixed-rate, long maturity | corporate WA 15y @ 4.8% | Corporate only; **asset-level profile undisclosed** |
| Fortress liquidity | $5,481M corporate; deployable $188,269M | Flatt: "one never maximizes short-term returns" |
| Contracted/regulated revenue | Microsoft >10.5GW; Google 20-yr | Concentrated in a few counterparties |
| Diversification | 5 classes | **Correlated on the long rate — see B3 Origin 3** |

---

## 8. The analytical payload (audit §11.1) — goes in B7

The single best adjudication available, and it is **independent of Brookfield**:

> **Flatt's "stabilizing interest rates" is contradicted by the data.** This is a **bear steepener**:
> the policy rate was **cut 75bp** (4.50 → 3.75 upper bound since Sept 2025) **while the 10Y rose
> ~58bp** off its Feb-26 low of 3.97 to **4.55**. The long-duration discount rate that actually
> prices Brookfield's assets **moved against them even as the Fed eased.** Core PCE is grinding up
> (2.97% → **3.41%**).
>
> **Corroborated:** Noble's "spreads near historical tights" — HY **271bp**, IG **79bp**. ✓

Ties Origin 1 (valuation) and Origin 2 (financing) to one observable factor → sets up B8 scenarios.

---

## 9. Explicitly NOT doing

- ❌ Six per-asset-class stories (§9) as standalone blocks — restatement; folded into map tags
- ❌ §4 and §5 as separate blocks — one chain
- ❌ Factor matrix (§8) as a rendered grid — would be our construction, not disclosure
- ❌ Any DSCR / duration-gap / maintenance-capex row — undisclosed (your call: omit + say once)
- ❌ Deriving proxies for undisclosed metrics — banned by `holdings-research-rules`

---

## 10. Data corrections riding along (audit §5, Priority 1)

Only those touching the risk section:
- Peers row `комиссии, квартал` → **`FRE, квартал`** (§5.4) — *lives in s06, flag only*
- Insurance assets $143.5bn → **$180bn post-Just Group** (§12 time-sensitive)
- **BN/BWS shareholder votes were held 2026-07-16 — yesterday.** File still calls it pending board
  review. **Outcome not captured → B8/timeline must not assert it as pending without a check.**

---

## 11. Renderers

`risksplit`, `scenarios`, `flows`, `cards`, `facts`, `table`, `bars`, `quote`, `text`, `timeline`
all exist in `SectionDeep.jsx`. **B4 needs a decision:** reuse `flows`, or a small `chains` renderer
for the three transmission chains. Recommend trying `flows` first — no new renderer if it fits.

---

## 12. Acceptance tests (from `holdings-client-feedback-2026-06`)

1. Can the reader name the top risk **from memory** after one read?
2. Does every risk row have **a number adjacent** and **an origin tag**?
3. Does any block **restate** a previous block?
4. Does every scenario end in an **action** (hold/add/trim)?
5. Is there a **$ price** on each risk?
6. Zero blank/НЕ РАСКРЫТО rows?
