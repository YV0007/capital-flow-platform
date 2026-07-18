# Brookfield — Research Framework Audit & Retrieval
**Date:** 2026-07-17 · **Against:** client's 12-category BROOKFIELD RESEARCH FRAMEWORK
**Target file:** `src/data/holdings-v2/brookfield.json` (asOf 28.06.2026, 27 sources, 10 sections, 15 gaps)
**Method:** 6 parallel retrieval agents, primary-source-only per `holdings-research-rules`.

> **Status: retrieval complete, NOTHING written to data yet.** This dossier is the staging record.

---

## 0. Executive verdict

The framework is sound but rests on two false premises, and the existing file has **four
confirmed defects** that are worse than its own gaps list suggests.

1. **~Half the framework is structurally unreachable** (§4, §5, §6, most of §7/§8/§12) — subscription
   walls. This is not fixable by effort; it needs client upload. See §3 below.
2. **The framework's SEC assumptions are wrong for Brookfield** (§3 of framework asks for
   10-K/10-Q/8-K/DEF 14A). Corrected filing map in §2.1 below.
3. **Several of the file's own 15 `gaps` are too pessimistic** — 4 items flagged "unconfirmed"
   are in fact disclosed verbatim in primary documents already cited. See §4.
4. **The file carries real errors that the gaps list does NOT catch.** See §5. These are the
   priority.

---

## 1. Coverage matrix

| Framework § | Dashboard status | Outcome of this pass |
|---|---|---|
| 1A Investor Day | flagged unconfirmed, "не использовать как факт" | **RETRIEVED** — both decks. Source citation is wrong; one target mislabelled. §5.1 |
| 1B Annual reports | **absent from all 27 sources** | **RETRIEVED** — FY22–FY25, incl. risk factors. §6 |
| 1C Quarterly supplemental | covered (backbone of file) | verified; contradictions dissolved §4 |
| 1D Investment Outlook | absent | **RETRIEVED** (2026 only; 2025 is 404 — Brookfield replaces, doesn't archive) |
| 2 Management comms | BAM Q1 call only | **RETRIEVED** — BN Q1 2026 transcript, primary, free |
| 3 SEC filings | covered | filing map corrected §2.1 |
| 4 Preqin/PitchBook/MSCI/Burgiss/CamAssoc | 0 hits in file | **UNREACHABLE** — upload only |
| 5 Koyfin/AlphaSense/CapIQ/Bloomberg/FactSet | 0 hits in file | **UNREACHABLE** — upload only |
| 6 Sell-side (GS/MS/JPM/BofA/Barclays/UBS/RBC/TD/Scotia) | 17 mentions, 0 reports | **UNREACHABLE** — upload only |
| 7 VIC / SumZero / Hedgeye | 0 hits | VIC login-gated; SumZero gated. Null result. |
| 8 FT / Barron's / WSJ | — | FT hard-paywalled + fetch-blocked. Barron's: nothing critical found. |
| 9 Peers | BX/APO/KKR, via aggregators | **RETRIEVED** — +ARES +CG, all 5 re-sourced to SEC. §7 |
| 10 Metric block | patchy | **RETRIEVED** §8 — but see the multiples finding §8.1 |
| 11 Peer industry reports | partial | covered by §9 work |
| 12 Community long-form | absent | thin; one short-seller. §9 |

---

## 2. Filing facts (corrects framework §3)

### 2.1 The real filing map
**BN (CIK 0001001085)** files **40-F**, consistently. NOT 10-K/10-Q/8-K.
- FY2022 `0001001085-23-000007` (2023-03-24) — primary doc confusingly named `bam-20221231.htm` (pre-spin legacy)
- FY2023 `0001001085-24-000007` (2024-03-19)
- FY2024 `0001001085-25-000007` (2025-03-24)
- FY2025 `0001001085-26-000006` (2026-03-18)

**Document map matters:** the 40-F itself is a thin cover. **MD&A + financial statements are EX-99.2**
(`bn-20251231_d2.htm`, 6.4MB). AIF is EX-99.1.

**BAM (CIK 0001937926) changed form three times:**

| FY | Form | Filed | Accession |
|---|---|---|---|
| 2022 | **20-F** | 2023-04-03 | 0001937926-23-000004 |
| 2023 | **40-F** | 2024-03-19 | 0001937926-24-000004 |
| 2024 | **10-K** | 2025-03-17 | 0001937926-25-000007 |
| 2025 | **10-K** | 2026-03-02 | 0001628280-26-013098 |

FY2024 10-K states BAM is an **FPI voluntarily filing domestic forms** — not a domestic filer.
FY2025 10-K silently drops the FPI language, checks Large accelerated filer + WKSI.
**No filing explains the change. Do not assert a cause.**

### 2.2 Consequences already correctly recorded in the file (keep)
- BN/BAM insiders exempt from Section 16 → **no personal Bruce Flatt Form 4 exists**; personal
  trades go to Canadian SEDI. Flatt's 18,018,523 Class A/Exchangeable comes from the 2025 circular.
- No DEF 14A → the proxy is the **Management Information Circular**.

### 2.3 Operational note for all future runs
**SEC EDGAR returns HTTP 403 to WebFetch.** It responds normally to `curl` with a declared
User-Agent per SEC access policy. Both agents hit this independently. EDGAR remains fully
available — the tool, not the source, is the constraint.

---

## 3. Structurally unreachable — requires client upload

Per `holdings-source-catalog`, these were already known as upload-only. Confirmed again:

| Framework § | Items | Note |
|---|---|---|
| §4 | Preqin, PitchBook, MSCI Real Assets, Burgiss, Cambridge Associates | Ironically, **BAM's own Investor Day slide 27 cites Preqin** *Future of Alternatives 2029* — so we get Preqin's number secondhand through Brookfield, labelled as Brookfield's voice. |
| §5 | Koyfin, AlphaSense, S&P Capital IQ, Bloomberg, FactSet | Bloomberg Flatt succession video (2026-02-04) also paywalled |
| §6 | All sell-side | none retrievable |
| §7 | VIC (login-gated), SumZero (gated), Hedgeye | VIC BN idea (2023-02-27) visible only as metadata: $33.67 / $55,000M mkt cap |
| §8 | **FT "How much does Brookfield really make?" (2025-03-06)** | **hard paywall + ft.com blocked at fetch layer. Highest-value single gap.** Only independently confirmable fact: Brookfield publicly responded there is "nothing deceptive in its financial reporting" and the FT "willfully mischaracterized" its business. **Contents NOT reconstructed from circulating summaries — deliberately.** |

**No MCP connector in this session is authorized** (bigdata.com etc. all require OAuth).

---

## 4. Gaps that can be CLOSED (file is too pessimistic)

All four were flagged unconfirmed but are disclosed **verbatim in documents already in the source list**:

| Gap text | Verdict | Primary |
|---|---|---|
| "Только 5% консолидированного долга recourse к BN: в открытом Supplemental не найдено" | **REFUTED — it's there twice** | BN Q1'26 Supplemental **p9**: "Only 5% of our consolidated debt is issued by, or has recourse to, the Corporation." **p28**: "only 5% of total leverage having recourse". Arithmetic: 14,271/263,732 = 5.4%. Same page (p9) as the already-confirmed 13% and 15-year figures. |
| "LTV core-plus office 54.6%: первичкой не подтверждён" | **CONFIRMED** | Supplemental **p24**, Core Plus Office row: 30 assets · $3,152M · LTV **54.6%** · occ 91.7% · lease life 8y · discount 6.6% |
| "SpaceX ~$1 млрд построчно не раскрыта" | **REFUTED — disclosed, and richer** | Supplemental **p16**: "**$2 billion of SpaceX shares at the current pre-IPO mark, of which approximately $1 billion is owned by Brookfield Corporation**". Same page: ~$500M to Figure/Hark Labs/The Deployment Company (AI JV w/ OpenAI), >$450M Pinegrove. |
| "активы под комиссией по сегментам… взяты из реферата слайдов (Investing.com), не из текста 8-K" | **CONFIRMED — but re-cite** | Correct: NOT in the 8-K. It IS in **BAM Q1'26 Supplemental p27** to the dollar: Credit $281,565M · Infra $109,187M · RE $102,846M · Energy $72,160M · PE $48,029M · **Total $613,787M**. **Drop Investing.com, cite BAM Supplemental.** Segment is labelled "Energy", not "energy/renewables". |

### 4.1 The "$91B monetizations" contradiction dissolves entirely
- **$17B Q1'26 — CONFIRMED** (BN-PR p2; BN-S p3)
- **$6+5+2+4B — IS the $17B**, not a competing figure. Infra $6 + energy $5 + RE $2 + other diversified $4 = exactly $17B. Same sentence, same page. **A breakdown was mis-flagged as a conflict.**
- **$91B — real, but FY2025**, from BN Q4/FY2025 6-K EX-99.1 (2026-02-12): "a record $91 billion of monetizations, deploying $126 billion". FY25 split: RE $24 + infra $22 + renewables $12 + other $33. **НЕ РАСКРЫТО in every Q1'26 doc → relabel as FY2025 or drop from the Q1 view.**

### 4.2 Market cap — the file's arithmetic was right, its source was wrong
- Primary discloses **shares (2,234.3M @ 31.03.2026, BN-S p29), never market cap.** Post the
  3-for-2 split completed **09.10.2025**, and explicitly **net of 167M repurchased-but-uncancelled**.
- **$107.8B is an aggregator artifact.** At the same $44.30 price on 16.07.2026: stockanalysis /
  companiesmarketcap = $98.94–99.02B (implies 2,233M shares ✓ ties to primary); **Nasdaq = $108.59B
  (implies ~2,451M — adds back treasury and/or exchangeable/BNT-paired shares)** ✗.
- **The file's ~$95.8B (2.23B × $42.87) stands. Correct basis = 2,234.3M × price.**
- ⚠️ **Do NOT back market cap out of the 13% ratio.** BN words the denominator inconsistently:
  p3 "corporate debt to market capitalization ratio of 13%" (→ MC ≈ $110B) vs p9 "corporate debt to
  capitalization level was 13% based on market price" (parallels the 21% book calc where the
  denominator *includes* debt → MC ≈ $95.5B). **Ambiguous in primary — flag, don't use.**

---

## 5. NEW DEFECTS — not in the gaps list. **Priority fixes.**

### 5.1 Source [17] is wrong — the Investor Day deck was never filed with the SEC
File says: *"[17] primary (SEC 6-K) 2025-09-09 — Brookfield Investor Day Sept 10 2025 (SEC 6-K EX-99.1)"*.

**That 6-K (`0001171843-25-005801`, `exh_991.htm`) is only the event announcement press release. No deck.**
Verified exhaustively: all BN+BAM filings 2025-09-08 → 2025-10-15 enumerated; BAM's Sept 8/9 8-Ks are
a notes offering; EDGAR FTS on `"fee-bearing capital"` returns only 10-Q/8-K/prospectus. **BAM is a
domestic-form filer — "6-K EX-99.1" could never apply to BAM.**

The decks exist **only on the IR sites** (still allowed primary):
- BAM 76pp — `https://bam.brookfield.com/sites/brookfield-bam-v2/files/BAM-IR-Master/Presentations/2025/bam-ir-day-sep-2025-presentation.pdf`
- BN 207pp — `https://bn.brookfield.com/sites/brookfield-bn-v2/files/BN-IR-Master/Presentations/2025/bn-ir-day-presentationvf-stock-split.pdf`

### 5.2 "Комиссии ~$5.8 млрд" is a mislabel — off by ~42%
Primary (BAM deck slides 62, 66): **$5,850M is FRE to BAM.** 2030 **fee revenues are $10,050M**.
- $1.2T FBC ✅ confirmed (slides 59/60/66) · $5.9B DE ✅ confirmed ($5,900M, slide 63)
- **"fees" must become "FRE $5.85B", with fee revenue stated separately as $10.05B.**

### 5.3 "$176/$210" conflates two different decks
The gaps note suspected a split-adjustment problem. **The defect is larger:**
- **$176 is from the 2024 deck** (Sep 21 2024), whose target was **$84 → $176 by 2029** — different
  year, different horizon.
- The **2025 deck states its basis on page 2** ("...after adjusting for the three-for-two stock split
  ... effective on October 9, 2025") and gives **plan value $68 today → $140 by 2030** (slide 119).
  Today's plan value $161B total = $68/sh (slides 68, 80). Price $44 vs $68 = ~35% discount (slide 72).
- **$210 = $140 × 1.5** is arithmetically consistent but **appears in no document**, and the pre-split
  original has been replaced on IR. If ever shown, label as **our conversion**, not a Brookfield figure.
- **Recommended: $68 → $140 by 2030, post-split (3-for-2, eff. 09.10.2025).**
- ⚠️ **BN split TWICE** — 3-for-2 April 2020 AND 3-for-2 Oct 2025. "Split-adjusted" is ambiguous
  unless the date is named. The Oct-2025 split applies to **BN and BWS only — NOT to BAM.**

### 5.4 The peers table (s06) — label is wrong, numbers are right
`brookfield.json:1204`. Row reads `комиссии, квартал`; prose says `комиссии за управление`.
**Every value in that row is FRE, not management fees:**

| | Dashboard value | Actually | Real mgmt fees |
|---|---|---|---|
| BAM | $772M (+11%) | **FRE** ✓ | fee revenues $990M consol. / $1,426M incl. equity-method @100% |
| BX | $1,550M (+23%) | **FRE** $1,547,981k ✓ | **$2,132,808k** |
| APO | $728M (+30%) | **FRE** $728M ✓ | ~$1.0B |
| KKR | $1,016M (+24%) | **FRE** $1,016,375k ✓ | **$1,192,504k** |

**The comparison itself is sound (FRE vs FRE) — do NOT change the numbers. Relabel to "FRE, квартал".**
But the prose "BX комиссии за управление $1.55 млрд" is **factually wrong — states BX's management
fees at 73% of actual.** Must be rewritten.

### 5.5 Peers sourced from aggregators — violates primary-only rule
File cites `stocktitan.net` for BX (`brookfield.json:2316`) and APO (`:2323`) and the prose openly
admits *"BX/APO — через агрегаторы/release."* **All figures re-verified correct against SEC 8-Ks**
(§7) — so this is a citation fix, not a data fix.

---

## 6. Annual reports — new material (framework §1B, was entirely absent)

**Source:** BN FY2025 40-F EX-99.2 `https://www.sec.gov/Archives/edgar/data/1001085/000100108526000006/bn-20251231_d2.htm` (2026-03-18)

### 6.1 RISK FACTORS — the single best new datapoint
**Location matters:** BN's AIF does NOT enumerate them. AIF p~570 incorporates by reference:
*"'Business Environment and Risks' on pages 108 to 132 of our MD&A"*. **Authoritative BN risk
factors = MD&A Part 6, pp.108–132.**

**FY2025: 27 factors (a–aa).** a) Share price volatility · b) Reputation · c) Asset Management ·
d) Laws/Rules/Regulations · e) Governmental Investigations, Sanctions, Anti-Bribery · f) Financial
Obligations & Liquidity · g) FX · h) Temporary Investments & Backstop Commitments · i) Interest Rates ·
j) Human Capital · k) Geopolitical · l) Economic Conditions · m) Catastrophic Event/Pandemics/Climate/
War · n) Tax · o) Financial Reporting & Disclosures · p) Sustainability · q) IT & Cyber ·
**r) ARTIFICIAL INTELLIGENCE** · s) Litigation · t) Insurance · u) Credit & Counterparty · v)
Information Barriers · w) Wealth Solutions · x) Renewable Power & Transition · y) Infrastructure ·
z) Private Equity · aa) Real Estate

**THE YoY DELTA — clean, defensible "what changed":** FY2024 (`bn-20241231_d2.htm`) enumerated **26
factors (a–z), identical sequence, with NO Artificial Intelligence** (FY24 ran q) IT → r) Litigation).
**FY2025 inserted r) AI, shifting all subsequent letters by one. That is the ONLY structural change
in BN's risk taxonomy FY24→FY25.**

**r) AI — verbatim (p~126):** *"Artificial intelligence may be used more effectively by our
competitors and our employees or third parties may inappropriately use the technology."*
Sub-claims: competitors "may be more successful than us in the development and implementation of
artificial intelligence… we may be at a competitive disadvantage"; AI "may produce inaccurate,
incomplete, biased or non-explainable outputs"; third-party AI "may also expose us to security
vulnerabilities"; failure to govern AI "could result in regulatory scrutiny, legal liability,
financial loss, or reputational harm."

> **⚡ THE FRAMING FOR THE AI LENS:** Flatt's letter frames AI as **the $7 trillion opportunity**.
> The risk section frames Brookfield as a potential AI **laggard vs competitors**. Same document set,
> opposite valence. This tension is the most decision-relevant thing in the annual report.

**w) Wealth Solutions — verbatim (p127):** *"BWS makes and relies on certain assumptions and estimates
in order to make decisions regarding pricing, target returns, reserve levels… If the assumptions and
estimates of BWS differ significantly from the actual outcomes and results, its business, financial
condition, results of operations, liquidity and cash flows may be materially and adversely affected."*
Also discloses the **support agreement + equity commitment agreement** by which BN backstops BWS —
newly relevant given the proposed BN/BNT merger.

**BAM FY2025 10-K Item 1A is a SEPARATE, differently-organized risk set** (3 groups). BAM-only factors
with no BN equivalent:
- *"The ownership of BN may change and the control of BAM may be transferred to a third party without shareholder approval."*
- PFIC classification risk for U.S. holders
- *"Investors may find it difficult or impossible to effect service of process and enforce judgments"*
- Retail-access litigation/enforcement risk
- **Standalone credit risk factor — which BN LACKS, despite credit being its largest fee-bearing pool at $279bn. A real asymmetry.**

### 6.2 Structural facts the Portfolio/Financial sections should carry
**Consolidation (MD&A Part 5, p99) — load-bearing:**
> *"IFRS Accounting Standards use a control-based model… **Due to the ownership structure of many of
> our subsidiaries, we control entities in which we hold only a minority economic interest.**"*

This is why total equity is **$166.2bn** but common equity is only **$43.8bn**. NCI in FFO was
**$(12,963)M** in 2025 (2024: $(11,567)M) → **~70% of consolidated FFO is not Brookfield's.**

**Wealth Solutions shows n/a REVENUE** — BN equity-accounts BWS (Note 3 fn2). It contributes
$1,671M DE and $12,742M common equity but **zero consolidated revenue. Trap for any revenue-mix chart.**

### 6.3 DE — the headline tension
| $M | 2025 | 2024 |
|---|---|---|
| Net income | 3,235 | 1,853 |
| FFO | 5,692 | 6,236 |
| **DE before realizations** | **5,386** | **4,871** |
| Realized carried interest, net | 560 | 403 |
| Disposition gains from principal investments | **62** | **1,000** |
| **Distributable earnings** | **6,008** | **6,274** |

**Total DE FELL $266M YoY while DE-before-realizations ROSE $515M (+11%). The entire decline is the
realization line** — disposition gains collapsed $1,000M → $62M. Management leads with
DE-before-realizations for exactly this reason (p61).

### 6.4 FRE bridge — Asset Management (p67)
Fee revenues **5,487** (2024: 4,706) · direct costs (2,410) · FRE not attributable (82) → **FRE 2,995**
(2024: 2,456), **+22%, margin 58%** (57%). Base mgmt fee bridge +$663M/+16%: credit +303, renewable
+182, RE +122, infra +49, PE +7.

**3-yr series (BAM 10-K, US GAAP):** Fee revenues 5,487 / 4,706 / 4,381 · FRE **2,995 / 2,456 / 2,241**
· DE **2,695 / 2,363 / 2,244**.
⚠️ **BN MD&A shows BAM 2024 DE = 2,359; BAM 10-K shows 2,363. IFRS vs US GAAP. Do not blend the series.**

### 6.5 Segment table (p61) — with the caveat that makes it usable
| Segment | DE/FFO/NOI 2025 | 2024 | Δ | Common Equity 2025 | 2024 |
|---|---|---|---|---|---|
| Asset Management (DE) | 3,327 | 3,048 | +279 | 15,511 | 17,338 |
| Wealth Solutions (DE) | 1,671 | 1,350 | +321 | 12,742 | 10,872 |
| Renewable & Transition (FFO) | 584 | 470 | +114 | 4,860 | 4,485 |
| Infrastructure (FFO) | 757 | 567 | +190 | 2,311 | 2,202 |
| Private Equity (FFO) | 455 | 951 | (496) | 1,890 | 1,879 |
| Real Estate (NOI) | 3,144 | 3,397 | (253) | 25,141 | 23,085 |
| Corporate (FFO) | (535) | 271 | (806) | (18,659) | (17,987) |
| **Total** | **6,008** | **6,274** | **(266)** | **43,796** | **41,874** |

⚠️ **Metrics are NOT comparable across segments** (DE for AM/Wealth, FFO for Renewable/Infra/PE/Corp,
NOI for RE — p60). **A chart that sums or ranks these without the caveat is wrong.**

**Revenue fell $10.9bn YoY**, driven by PE (41,401 → 28,807). MD&A p381: *"Recent asset sales reduced
revenues and net income by $15.5 billion and $276 million in the year"* — road fuels disposal (Q3'24),
healthcare services deconsolidation (Q2'25).

### 6.6 Level 3 / valuation — the bear themes, from primary
| $M | L1'25 | L2'25 | **L3'25** | L1'24 | L2'24 | **L3'24** |
|---|---|---|---|---|---|---|
| Total financial assets | 733 | 7,365 | **14,088** | 1,157 | 9,531 | **10,893** |

**Level 3 financial assets +29% ($10.9bn → $14.1bn) while Level 1+2 FELL.**

**Investment property (Note 11) — WA discount rate 8.1% → 7.4% (−70bp); WA terminal cap 5.9% → 5.4%.**
> ⚠️ **BN attributes the move to DISPOSAL MIX, not remarks** (fn 1–3: US office/retail sales, India
> REIT deconsolidation, Australian senior living sale). **A 70bp WA drop looks like aggressive
> remarking until you read the footnotes. State it both ways.**

Sensitivity (p~102), 25bp, consolidated, pre-tax, incl. NCI: FV **$85,613M** → **$3,973M**.
By bucket: Super Core 19,428/1,104 · Core Plus 10,103/460 · Value Add 5,494/197 · Opportunistic
3,578/174 · LP Investments 44,056/1,943 · Other 2,954/95. BN's caveat: *"amounts attributable to
shareholders may be significantly less than shown depending on ownership levels."*

### 6.7 Related-party (Note 27, p232) — the strongest primary material on the bear case
- Management fees from related parties **$350M** (2024: $304M)
- Key management + Directors remuneration **$26M** (2024: $26M) — salaries/incentives $7M, share-based $19M
- **$2.0bn equity commitment to BWS; $nil drawn** at 2025-12-31
- Cash on deposit with BN subsidiaries: BWS $318M · Partners Value Investments $316M · Oaktree $486M
- Corporation contributed **~$3.5bn of BAM shares to BWS** for Class C + promissory note (Q2'25);
  BWS acquired **$1.6bn of real assets** from the Corporation + ~$3.0bn other assets & non-recourse debt
- **BN's characterization: "These transactions were at arm's length on market terms."**
- **BN owns 73% of BAM combined — 69% direct, 4% via BWS** (p63 fn1)
- Commitments (Note 28a, p233): **$9.5bn** bridge/LC/guarantee/capex (2024: $6.3bn) — **+51%**

### 6.8 Equity / shares — split basis, stated
Note 21 p~163: *"On October 9, 2025, the company completed a three-for-two stock split… All share
count and per share disclosures are presented on a post-split basis."* Mechanism (AIF p189): stock
dividend, one-half share per share held.
**Scope: BN + BWS (BWS did its own 3:2 same date, AIF p148). NOT BAM** — in BAM's 10-K the split
footnotes attach only to BN-tracking options/DSUs/RSUs.

| $M | 2025 | 2024 |
|---|---|---|
| Common equity | **43,796** | 41,874 |
| Total equity (incl. NCI) | **166,194** | 165,383 |

Shares (post-split, M): 2,259.8 → **2,244.7**; exact **2,244,703,636**, net of **183,590,069** held for
LT comp. Diluted 2,383.2. **As at 2026-03-13: 2,237,128,859 Class A + 85,120 Class B.**
Net income/sh **$0.49** (2024: $0.20) · DE before realizations **$2.27/sh** · Dividends **$0.24/sh** (0.21).
**BVPS is NOT disclosed** — 43,796 ÷ 2,244.7 = **~$19.51/sh is DERIVED. Label as such.**
BAM: **1,638,147,590 Class A + 21,280 Class B** (2026-02-23); non-affiliate mkt value $23.2bn @2025-06-30.
2025 Arrangement (2025-02-04): **1,194,021,145 Class A issued to BN.**

### 6.9 Shareholder letter — Q4 2025, Flatt, 2026-02-12
`https://bn.brookfield.com/sites/brookfield-bn-v2/files/BN-IR-Master/Letter-to-Shareholders/2026/Q4-25 BN Letter to Shareholders_vF.pdf`

> ⚠️ **PROVENANCE NOTE: the 2025 ANNUAL REPORT letter is NOT retrievable** — it downloads (9pp, 3.5MB)
> but the body is rendered as images/vector outlines; text extraction yields 215 chars, and poppler
> is not installed so OCR failed. **The Q4 2025 letter substituted above is a DIFFERENT DOCUMENT** —
> same author, same period, text-extractable. **Do not cite it as the annual-report letter.**
> To get the real one: `brew install poppler`, re-run.

Quotable:
- *"We had a record year with $112 billion of fundraising, $91 billion of assets sold, and approximately $175 billion of assets financed. This enabled us to acquire $126 billion of new investments. In the stock market, our shares generated a 21% return."* (p1)
- *"Distributable earnings ('Cashflows') before realizations were a record $5.4 billion, or $2.27 per share… up 11% per share… has grown at an annual rate of ~18% since 2021."* (p2)
- **AI thesis (p5):** *"Our focus is not on predicting which models will win, which chips will dominate, or which applications will ultimately prove enduring. Instead, we are focused on the structural need for large-scale, long-duration infrastructure capacity to support the growth of ai."* · *"Over the next decade, $7 trillion of capital will be required across the ai value chain"* · **"the largest constraint today is not technology or capital, but access to reliable power and the infrastructure required to deliver it."**
- **AI underwriting discipline (p5):** *"our focus is on projects with land, power, long-term contracts and high-quality, investment-grade counterparties or other hard assets with tangible value."*
- **Real estate (p6):** *"our portfolio, which, based on cash invested and cash taken out, has a negative book value (i.e., we have no net cash equity at cost invested), but has an estimated equity value of around $25 billion."* Repositioned offices achieving *"record rents at circa 50% above those achieved pre-COVID."* Sold $24bn RE, invested $33bn.
- **BN/BNT MERGER — forward-looking, material (p7):** *"we intend to work this year on merging BN with its paired security BNT. This will further streamline our structure and also support the next evolution of Brookfield, with one entity conducting all of our insurance and balance sheet investment activities… this will add substantial additional capital to our insurance operations."* Rationale: *"with the continued and increasing expansion of index investing, splitting market capitalizations has now become sub-optimal."*
- **Fortress capital (p3):** *"Holding excess fortress capital does mean that one never maximizes short-term returns, but it should be considered insurance."*
- **Succession (p7):** *"Last week, Connor Teskey was appointed CEO of BAM. I will continue as Chair of that Board in addition to my role as CEO of overall Brookfield. This appointment culminates a four-year transition process."*
- **2025 counterparties (p3–4):** Google (2 PA hydro, 20-yr, >$3bn power) · **NVIDIA** (*"ai factories on a global basis… they partnered with us to launch our new fund… planned for $100 billion"*) · JPMorgan (Powai Mumbai BTS + Canary Wharf European HQ, ~5M sqft, ~25,000 people) · Microsoft (**>10.5 GW — "the largest power framework agreement ever signed"**) · US Government (Westinghouse, *"$80 billion of nuclear reactors"*)

**30-year table (p3, $M):** Revenues 278→75,100 (21% CAGR) · Operating Income 195→28,506 (18%) ·
Cashflows 179→6,008 (13%) · AUM 6,000→1,181,483 (20%) · Corporate Borrowings 727→14,301 (11%) ·
Market Cap 1,488→103,009 (15%).
> ⚠️ **Letter's own endnote 2: Cashflows prior to 2020 "were determined by applying historic payout
> ratios to reported FFO" — the pre-2020 series is RECONSTRUCTED, not reported. Flag on any chart.**

---

## 7. Peers — Q1 2026, all five re-sourced to SEC primary (framework §9)

CIKs verified: ARES 1176948 · CG 1527166 · BX 1393818 · APO 1858681 · KKR 1404912.

### 7.1 ARES (was missing) — 8-K `0001628280-26-029083`, 2026-05-01
AUM **$644.3bn** (+18%) · FPAUM **$399.6bn** (+19%) · **FRE $464,404k (+26%)**, LTM $1,872,428k (+31%) ·
FRE margin **42.4%** · Realized Income (DE-equiv) $502,736k (+24%), after-tax RI $452,416k / $1.24/sh ·
**Perpetual $215.3bn (+39%)** · Available capital **$158.1bn** · AUM not yet paying fees $79.4bn ·
mgmt fees $1,001,571k (+22%) · effective rate 0.98%. BlueCove closed 2026-02-01 (+$5.5bn liquid credit).
Segment AUM/FPAUM ($bn, cross-foots exactly): Credit 422.6/260.2 · Real Assets 143.4/87.1 ·
Secondaries 42.6/30.2 · PE 24.7/14.2 · Other 11.0/7.9.

### 7.2 CARLYLE (was missing) — 8-K `0001527166-26-000023`, 2026-05-07
AUM **$475bn** (+5%) · FEAUM **$333bn** (+6%) · **FRE $300M (−3% YoY)**, LTM $1,226M · margin **47%** ·
**DE $327M PRE-TAX** ($0.89/sh post-tax) · **Perpetual $111bn = 33% of FEAUM** · Available capital $96bn ·
**GAAP loss before taxes $(179)M** · Net accrued perf revenues $2,859M · Pending FEAUM $21bn (−17%).
Segment AUM/FEAUM ($bn): Global PE 159/99 · Global Credit 209/166 · AlpInvest 107/68.
Perpetual $111bn = Insurance Solutions (**Fortitude Re**) 79 + RE 8 + Direct Lending 7 + Other 17.
> **Carlyle is the only peer with FRE going BACKWARDS, and trades at 13.7x Price/FRE vs a 22–26x
> group. The cheapness is earned, not anomalous.**

### 7.3 BX / APO / KKR — verification of existing rows (**all confirmed correct**)
- **BX** 8-K `0001193125-26-171788` (2026-04-23): AUM **$1,304,017,634k** ✓ · Fee-earning **$937,596,454k** ✓ · **FRE $1,547,981k (+23%)** · **DE $1,764,838k POST-TAX** · Perpetual $539.7bn · Dry powder $213.3bn · Net accrued perf $7.0bn. **All Q1'26 figures labelled "preliminary and unaudited."** Segment named **"Multi-Asset Investing"**, not BXMA.
- **APO** 8-K `0001858681-26-000021` (2026-05-06): AUM **$1,026,367M** ✓ · FGAUM **$835,867M** ✓ · **FRE $728M (+30.2%)** · margin 57.7% · **SRE $719M (−10.6% YoY)** · ANI $1,208M POST-TAX · Perpetual $618bn (60% of AUM) · Dry powder $74bn. **GAAP net LOSS $(1,930)M.**
- **KKR** 8-K `0001404912-26-000011` (2026-05-05): AUM **$757,877M** ✓ (+14%) · FPAUM **$614,845M** ✓ (+17%) · **FRE $1,016,375k (+24%)** · margin 69% LTM · TOE $1,325,001k PRE-TAX · ANI $1,249,539k POST-TAX · Perpetual $326bn · Uncalled $124,857M. **Global Atlantic AUM $220bn = 29% of total.** Arctos closed 2026-05-05 (+$16bn) — **not** in the $758bn.

### 7.4 ⚠️ DEFINITIONAL DIFFERENCES — **the most important part of §7**

**1. AUM is six different metrics with one name.** Every manager warns of this in its own filing.
APO: *"Apollo's calculation of AUM may differ from the calculations employed by other investment
managers and, as a result, this measure may not be directly comparable."* KKR: its AUM *"is not based
on any definition of AUM that may be set forth in the governing documents… includes assets for which
KKR does not act as an investment adviser… is not calculated pursuant to any regulatory definitions."*
- **APO $1,026bn INCLUDES Athene's insurance balance sheet** (AUM clause iii). Athene-derived perpetual = **$401bn = 39% of AUM**
- **KKR $758bn INCLUDES Global Atlantic at asset value** — **$220bn = 29% of AUM**
- **CG $475bn INCLUDES Fortitude Re** — **$86bn = 18% of AUM**
- **ARES $644.3bn uses GAV (incl. leverage) for Real Assets** + drawn+undrawn fund-level debt → mechanically inflated vs NAV basis
- **BX $1,304bn** = invested capital at FV + available capital — **most conservative of the five**
- **BAM discloses only ">$1 trillion"** — no exact figure in the 8-K
> **→ The "Total AUM" row ranks insurance-consolidators (APO, KKR) and leverage-inclusive definitions
> (ARES) above what their fee economics justify. If the table shows one AUM row, it needs the
> insurance $ carved out beside it, or it actively misleads. Comparing ">$1.0T" to BX's "$1,304.0bn"
> to two decimals is false precision.**

**2. FRE is pre-tax everywhere → THIS ROW IS COMPARABLE.** Verified individually for all five.
**FRE is the single most comparable line in the table and should carry the comparison.**

**3. FRE MARGIN is NOT comparable — denominators differ:** ARES 42.4% (÷ segment mgmt fees + fee-related
perf + other) · CG 47% (÷ Total Segment Fee Revenues) · APO 57.7% (÷ mgmt fees + capital solutions +
fee-related perf) · BX **not disclosed as a value** · KKR 69% — **and KKR's FRE INCLUDES management
fees charged by Asset Management to its own Insurance segment (i.e. GA pays KKR). FRE is not
independent of the insurance balance sheet.**
> **→ The 42%→69% spread is substantially DEFINITIONAL, not operational. Ranking on FRE margin as
> disclosed is not defensible.**

**4. DE is the worst row — 3 of 6 don't report it:**
| | Reports | Basis |
|---|---|---|
| BX | **DE** | **POST-TAX** |
| CG | **DE** | **PRE-TAX** ($327M); only $0.89/sh is post-tax |
| ARES | **Realized Income** (not DE) | **PRE-TAX** $502.7M |
| APO | **ANI** (no DE) | POST-TAX |
| KKR | **ANI / TOE** (no DE) | ANI post-tax; TOE pre-tax |
| BAM | **DE** $702M | basis not stated in EX-99.1 |
> **→ BX's DE $1,764.8M is post-tax; CG's DE $327M is pre-tax. One "DE" column = straight category
> error. Either normalize to pre-tax showing the tax lines, or split into "DE (post-tax)" /
> "DE-equivalent (pre-tax)" and accept blanks.**

**5. Perpetual capital — four incompatible bases.** BX/APO/KKR/ARES report on an **AUM** basis;
**CG's $111bn is on a FEAUM basis** — comparing it to BX's $539.7bn compares fee-earning to AUM.
Do NOT compute KKR 326/615 — KKR discloses 51% of FPAUM, implying perpetual FPAUM ≈ $314bn, a distinct
number that is НЕ РАСКРЫТО. **Redeemability caveats:** ARES is most candid — perpetual capital *"may
be withdrawn by investors under certain conditions… which in certain cases may be terminated on 30
days' prior written notice."* KKR: *"Investors should not view this component of our AUM as being
permanent without exception."*

**6. ARES books BDC Part I fees as MANAGEMENT fees** — *"Such fees are classified as management fees."*
**$149.0M of Q1-26 / $562.5M LTM** ≈ 15% of quarterly mgmt fees are performance-linked BDC income
peers may classify as incentive fees. **ARES' mgmt-fee growth and 0.98% effective rate are not like-for-like.**

**7. Dry powder — different names, different scope.** BX "Total Dry Powder" $213.3bn · ARES "Available
Capital" $158.1bn · KKR "Uncalled Commitments" $124,857M (**excludes perpetual-vehicle capacity**) ·
CG "Available Capital" $96bn · **APO "Dry Powder" $74bn — definition EXPLICITLY EXCLUDES "commitments
from perpetual capital vehicles."**
> **→ APO's $74bn looks small next to BX's $213bn largely because APO excludes perpetual vehicles and
> BX does not. Not the same quantity.**

**8. Accounting basis.** **BAM reports under US GAAP** (verified: zero IFRS refs in its 10-K) → BAM vs
the 5 US peers is basis-consistent. **BN is the IFRS entity**; its 85.00 P/E reflects fair-value
accounting and **does not belong in a multiples row with the others.**

**9. Market caps are Up-C-sensitive** — several trade with AOG/partnership units outside the listed
share count; BAM's listed entity sits under ~73% BN ownership.

### 7.5 Market data — ⚠️ VALIDATION-ONLY (stockanalysis.com, 16–17.07.2026)
| | Price | Mkt cap | GAAP P/E | **Price/LTM FRE** *(our arithmetic)* |
|---|---|---|---|---|
| BAM | $49.57 | $79.16bn | 32.19 | **25.8x** |
| BX | $128.97 | $158.65bn | 33.09 | **26.3x** |
| APO | $123.34 | $71.11bn | 78.07 | **26.4x** |
| KKR | $102.44 | $92.26bn | 35.75 | **23.6x** |
| ARES | $125.43 | $41.37bn | 58.30 | **22.1x** |
| CG | $46.63 | $16.79bn | 31.44 | **13.7x** |
| BN | $44.03 | $99.02bn | 85.00 | n/a |

> **⚠️ RECOMMEND NOT SHIPPING THE GAAP P/E ROW.** APO's 78.07 sits on an LTM containing a $(1,930)M
> GAAP LOSS quarter; BN's 85.00 is IFRS fair-value on a different basis. **The P/E row invites exactly
> the false-precision comparison the rules warn against.** Price/FRE is ours, not disclosed by anyone.

### 7.6 ⚠️ "Infrastructure exposure" is UNDISCLOSABLE across the peer set
**This matters more than anything else in §7, because infrastructure is precisely Brookfield's differentiator.**
- **ARES** НЕ РАСКРЫТО — folded into "Real Assets" ($143.4bn) with real estate
- **KKR** НЕ РАСКРЫТО standalone — only combined **"Infrastructure & Energy" $114bn**. (The p29 chart splitting Infra 7% / Energy 4% is **investment fair value, not AUM** — do not conflate.)
- **CG** НЕ РАСКРЫТО — "Infrastructure & Natural Resources" appears only in net accrued perf revenues ($343M), not AUM
- **APO** НЕ РАСКРЫТО — **zero** occurrences of "Infrastructure"/"Real Assets"/"Yield" as AUM categories; collapsed to Credit/Equity only
- **BX** no standalone infrastructure AUM line
> **→ An "infrastructure $ of AUM" row would be НЕ РАСКРЫТО for ALL FIVE peers. Drop the row, or
> replace with "Real assets (incl. infra)" — comparable only loosely.**

### 7.7 Two analytical flags
- **APO's headline buries the story:** SRE **−10.6% YoY**, with Apollo itself quantifying **$188M of foregone alternative net investment income** (6% alternatives return vs an 11% long-term assumption, p10). **Record FRE (+30%) masked it.**
- **APO's $(1,930)M GAAP loss vs $1,208M ANI is a ~$3.1bn divergence in ONE quarter** — the filing does not reconcile it on the pages carrying the headline metrics.

---

## 8. Metric block — Q1 2026 (framework §10)

**Sources:** BN Q1'26 Press Release (10pp) · BN Q1'26 Supplemental (44pp) · BAM Q1'26 Supplemental
(46pp) · BAM Q1'26 8-K EX-99.1 · BN Q4/FY25 6-K EX-99.1 (for the $91B only).
All as of 31.03.2026; all per-share post the 3-for-2 split completed 09.10.2025.

**ASSETS:** Total AUM **$1.2T (BAM-level, BAM-S p2)** — **BN says only "over $1 trillion" (BN-S p4, p13).
DO NOT present $1.2T as BN's.** · **Fee-bearing capital $613,787M (+12%, +$65B)** — Credit $281,565M ·
Infra $109,187M · RE $102,846M · Energy $72,160M · PE $48,029M (BAM-S p27) · **Perpetual capital as a
single line: НЕ РАСКРЫТО** — components only: Permanent Capital Vehicles $92,915M · Perpetual
Strategies $155,185M · Long-Term-or-Permanent $534,841M (**87% of FBC**) · Liquid $78,946M ·
**Insurance assets $143,525M**, invested $119,742M; **post-Just Group +$40B → $180B** (BN-PR p2) ·
**Dry powder: BN deployable capital $188,269M** ($74B liquidity + **$114,175M third-party uncalled**);
**BAM uncalled $137B** ($67B → ~$670M annual fees once deployed) · **Private wealth assets total:
НЕ РАСКРЫТО** — fragments only (infra private wealth strategy >$8.0B; $5B Q1 retail/wealth inflows).
> ⚠️ **BN's $114B uncalled ≠ BAM's $137B — different definitions (BN counts third-party only). Do not reconcile on the dashboard.**

**EARNINGS:** **FRE $772M Q1 ($0.48/sh, +11%)**; LTM $3,069M ($1.89/sh, +18%) · **DE $1,550M Q1
($0.66/sh)**; LTM $6,009M ($2.54/sh) · DE before realizations $1,393M ($0.59/sh, +7%/sh); LTM $5,478M
($2.32/sh, +6%/sh) · DE by segment Q1: Asset Mgmt $765M · Wealth Solutions $430M · Operating
Businesses $360M · Corporate $(162)M · Net income $1,042M consolidated; **attributable to BN
shareholders only $102M ($0.03/sh diluted)** · **Realized carry net $157M Q1 / $528M LTM** ·
**Accumulated unrealized carry $11.8B** · **Carry-eligible capital $181,973M** (invested $102,815M +
uncalled $79,158M); annualized target carry $4,179M gross → $2,744M net to BAM → $1,281M net to BAM
shareholders (BAM-S p30) · **Operating margin: BAM FRE margin 57% Q1 / 58% LTM. BN consolidated
operating margin НЕ РАСКРЫТО** · **ROE: 15% — Wealth Solutions ONLY**, on $13.2B invested capital
($2.0B annualized cash flows; BN's own valuation $30B). **BN consolidated ROE НЕ РАСКРЫТО.**

**CAPITAL ALLOCATION:** Capital deployed (BAM) **$19.8B Q1** / LTM $69.3B — Credit $12.1 · Infra $4.0 ·
RE $3.0 · PE $0.4 · Energy $0.3 · **BN group asset sales $17B Q1** (infra $6 + energy $5 + RE $2 +
other diversified $4) · **BAM equity monetizations $8B Q1** (Infra 2.3 · RE 1.1 · Credit 3.0 · Energy
0.8 · PE 0.7) · Acquisitions/dispositions as discrete group lines: **НЕ РАСКРЫТО** · Disposition gains
from principal investments $0 Q1 / $3M LTM · Financings advanced $45B (incl. $15B RE) · **Buybacks
$470M BN + $575M BAM YTD (>$1B); BN avg price $41 ≈ 40% discount to stated intrinsic value $66/sh.**
> ⚠️ **$17B (BN, group asset sales) and $8B (BAM, equity monetizations) are DIFFERENT MEASURES, not a
> discrepancy. Label explicitly or the dashboard looks self-contradictory.**

**FUNDRAISING:** **Q1 2026 total $21.1B** — Credit **$13.4B** (Partner Managers 8.7 · Insurance/SMAs 3.8
· LT private funds/co-invest 0.9) · Infra $3.4B (incl. $800M infra private wealth → strategy >$8.0B;
$800M supercore → >$20B) · Energy $1.6B · PE $1.4B (incl. $1.0B special situations; first close Feb at
$2.4B) · RE $1.3B · **LTM $107.9B** (Credit 67.9 · Infra 15.6 · Energy 10.5 · RE 7.5 · PE 6.4) ·
**YTD incl. subsequent events $67B** = $21B Q1 + **$40B Just Group mandate (April)** + $6B PE flagship
first close (April) · Private wealth/retail inflows **$5B** Q1 · Insurance inflows $3.8B Q1 / $22.3B LTM.

**VALUATION:** Shares outstanding **2,234.3M** (net of 167M repurchased-but-uncancelled) · diluted
2,366.8M · WA 2,241.5M.
> ### 8.1 **THE FINDING: Brookfield publishes NO standard valuation multiples.**
> **EV · P/E · Price/FRE · EV/FRE · EV/AUM · P/B · FCF yield — ALL НЕ РАСКРЫТО. Market cap itself is
> never stated.** Brookfield substitutes its own constructs: **intrinsic value $66/sh**, Wealth
> Solutions at **15x → $30B**, and multiple-of-target-carried-interest.
> **→ Every multiple on the dashboard is DERIVED BY US, never sourced. This is a design decision for
> the client, not a retrieval gap. Tag accordingly.**

Disclosed proxies instead: corporate debt/market cap **13%** · intrinsic value **$66/sh** · WS **$30B**.
Common equity (book) $42,697M → **$19.11/sh derived**.
*Validation-only: stockanalysis $44.30 close 16.07.2026, mcap $99.02B, 2.23B shares; companiesmarketcap $98.94B.*

**BALANCE SHEET:** **Corporate borrowings (recourse) $14,271M** (Dec-25: $14,301M) · **Non-recourse
$249,461M** consolidated; split subsidiary $19,221M + property-specific $230,240M = **$263,732M total
debt** · **Recourse share 5% stated verbatim; arithmetic 5.4%** · **Debt-to-cap: 21% corporate (IFRS
book), corporate capitalization $67,308M · 50% consolidated (book) · 13% corporate debt to market cap**
· **Average debt maturity 15 years** WA term (corporate term debt), WA rate **4.8%** · Perpetual
preferreds $3,544M @ WA 5.0% · Corporate liquidity $5,481M · **Non-recourse average maturity: НЕ РАСКРЫТО.**

---

## 9. Management comms + bear case (framework §2, §7, §8, §12)

### 9.1 BN Q1 2026 transcript — PRIMARY, FREE, on Brookfield's own IR (gap closed)
`https://bn.brookfield.com/sites/brookfield-bn-v2/files/Brookfield-BN-IR-V2/2026/Q1/bn-q1-2026-transcript.pdf` (19pp)
BAM Q1: `https://bam.brookfield.com/sites/brookfield-bam-v2/files/BAM-IR-Master/Events/2026/bam-q1-2026-transcript.pdf`

**Call 2026-05-14, 10:00 ET.** Flatt (CEO) · **Nick Goodman (President & CFO)** · **Sachin Shah (CEO,
Brookfield WEALTH SOLUTIONS)** · Katie Battaglia (VP IR). Analysts: TD Cowen, Scotiabank, RBC, GS, BMO,
National Bank, CIBC.

> ⚠️ **PROVENANCE FLAG: the Motley Fool version MISATTRIBUTES Sachin Shah as "CEO of Brookfield Asset
> Management."** He is CEO of Wealth Solutions; **BAM's CEO is Teskey**. The Fool version also
> paraphrases passages that are not verbatim in the primary. **Do not use Fool for BN Q1 2026.**

Quotes (all primary):
- **Fundraising:** Goodman — *"we are well positioned to deliver a record year of fundraising in 2026."* FBC $614B (+12%); FRE $772M (+11%); $67B raised YTD incl. $21B in-quarter, $40B Just Group, $6B PE vintage VII.
- **Carry:** *"we continue to expect 2026 to be an inflection point with realizations ramping up in the second half of the year."* $11.8B accumulated unrealized; $157M realized in-quarter.
- **Capital allocation:** *"$470 million of BN shares and $575 million of BAM shares."* On independence: *"I would think of BN and BAM as two distinct companies with their own capital and we are doing our own buybacks based on our own independently almost of each other."*
- **Simplification (bear-case relevant):** combining BN and BWS gives insurance *"greater access to approximately $145 billion of incremental capital from our permanent capital base."* Board review *"in the coming weeks"*; **shareholder votes at AGMs 2026-07-16.** Tax question deflected: *"we are still working through the final details."*
- **Macro:** Flatt — *"we largely try to ignore them when building our business."* Coins **"the HALO effect — Hard Assets, Low Obsolescence."**
- **Office marks — load-bearing:** Flatt on Manhattan West: *"it would cost around $2,500 a square foot to build that same building today compared to our cost of just over $1,000 a square foot."* Two Manhattan West financing: **$1.9B, 10-yr non-recourse, 5.5% coupon, 107bp over treasuries, cashing out ~$400M.** *"premier assets are becoming increasingly scarce, and values are set to continue to rise."*
- **Credit/software contagion:** Goodman — *"We have no software exposure, and our credit portfolio is performing incredibly well."* On BAM's buyback: *"negative perception around credit and software which really was applied to every manager without distinguishing who had exposure and who didn't cause some irrational behavior in the BAM share price."*
- **Insurance:** Shah on UK PRA/Bermuda funded-reinsurance scrutiny — *"Just doesn't use it today and we were not planning to use it for Just."* Capital: *">$20 billion of regulatory capital… about 4x the regulatory minimum."* Outflows *"$10 billion to $12 billion… consistent with our duration profile."* Demand: *"demand for fixed annuities is down 9% or 10% in the U.S. this year over last year"* — but *"We picked up four points of market share."* Spread **225bp**, mid-teens ROE. Target *"circa $25 billion of new policies."*
- **⚡ Wealth Solutions conflict framing — the single best primary datapoint on the related-party bear case:** Shah — *"We can do that without any conflicts or clients or other invested capital partners sitting in any part of the business."* And: deployed *"nearly $15 billion into Brookfield strategies… at an average total return exceeding 10%"* — **i.e. insurance float into Brookfield-originated product, stated openly, on the record.**

**BAM call 2026-05-08:** Teskey (CEO) · Armen Panossian (Co-CEO Credit) · Hadley Peer Marshall (CFO) ·
Jason Fooks (IR). Teskey: *"2026 will not only be a record year for Brookfield, but one where we
expect to exceed our long-term growth targets."* **Oaktree acquisition closing Q2 2026.** Defensive:
*"our private BDC representing less than 1% of fee-bearing capital"*; *"Sponsor-oriented direct lending
is an immaterial part of our business."* *"$1.2 trillion of assets in our ecosystem."*

**⚠️ LEADERSHIP CHANGE the dashboard must reflect: Teskey named BAM CEO February 2026, succeeding
Flatt (Flatt remains BN CEO + BAM Chair).**
Available leads not transcribed: Flatt on Bloomberg "Bloomberg Deals" debut (2026-02-04, **Bloomberg
paywall**); Teskey on Farnam Street's *The Knowledge Project* (March 2026, **free at fs.blog**).

### 9.2 Bear case — the honest finding
> **The critical literature on Brookfield is real but THIN, concentrated in ONE author, and largely
> UN-ADJUDICATED. Framework §7/§8/§12 assume a body of independent research that does not exist.**

**1. Keith Dalrymple / DF Research / "Edper" substack** — `brookfield.substack.com`,
`dfresearch.substack.com`. **The only sustained dedicated Brookfield short-research operation.**
Free posts; full reports paywalled.
- *"BIP: The Quiet Collapse"* (2024-12-11) — YTD cash payout 150%, $415M cash deficit; gross ROE ~5% *"swamped by fees paid to BAM of 5.6%"* of NAV; *"3.5x rapidly eroding NAV."* **PARTIALLY primary-backed** — derived from BIP's own reported figures, but the arithmetic and NAV construction are Dalrymple's, not disclosed. **Bear argument, not verified finding.**
- *"SEC Investigation and Group Risks"* (2023-11-13) — claims an SEC investigation open since May 2022, undisclosed, plus a 2014–17 investigation. Sourced to Disclosure Insights (commercial vendor) + a FOIA'd SEC summary referencing *"devices, schemes, or artifices to defraud."* **MIXED — the FOIA doc is a primary artifact, but boilerplate statutory language in an investigation summary is NOT a finding of wrongdoing, and "not disclosed" is asserted. HIGH CAUTION.**
- *"Brookfield the Defendant: a Bombshell Lawsuit"* (2025-05-12) — CA wrongful-termination/whistleblower complaint alleging bribery, securities violations, LP mistreatment, cash crunch. **ASSERTION-LEVEL — allegations in a complaint are NOT findings.** Author hedges throughout (*"In my view"*). Not verified against a court docket.
- Others (free, unread): *"The Great Deception: Making BIP's $10 NAV $38"* (2025-01-29) · *"Are Brookfield Private Infrastructure Fund Returns Inflated?"* (2025-01-28) · *"BAM Fund-raising: Strong Words, Weak Results"* (2025-02-25) · *"Brookfield Business Partners: a Plethora of Problems and Overvalued"* (2025-06-11)
- **⚠️ DISCLOSURE: Dalrymple is SHORT. Every item is interpretation by an author with a position.**

**2. FT, "How much does Brookfield really make?" (2025-03-06)** — **PAYWALLED; ft.com blocked at the
fetch layer entirely.** Headline/date/URL confirmed via a Wikipedia citation only. **Contents NOT
reproduced from circulating summaries — not one word of the body was read.** Independently confirmable:
Brookfield publicly responded there is *"nothing deceptive in its financial reporting"* and the FT
*"willfully mischaracterized"* its business. **Highest-value unretrieved item; needs an FT subscription.**

**3. Rock & Turner, "Brookfield Part 3 of 3"** (James Emanuel, 2025-04-18, **free**) — **bull-leaning**;
catalogues bear objections then dismisses them. Concedes: *"Formal financial statements are, as even
its supporters acknowledge, almost incomprehensible"* and *"Some critics have raised concerns about
using policyholder money to power asset manager profits."* **Assertion-level in BOTH directions** —
rebuttals cite no filings or independent valuations. **Value = a map of the bear themes, not evidence.**

**4. Value Investors Club, BN idea (2023-02-27)** — **LOGIN-GATED.** Only metadata visible ($33.67,
$55,000M mkt cap). Free-with-delay tier did not expose it. Same for a BIP idea.

**5. Older material (context, NOT current evidence):** Seeking Alpha *"BPY: 'Fair Value' Or Inflated
Value?"* (2014) — fair-value gains >90% of BPY net earnings 2010–12, 5x operating cash flow in 2012.
**Primary-derived but ELEVEN YEARS STALE and about a delisted entity.** · Foundation for Financial
Journalism, *"The Paper World of Brookfield Asset Management"* (2013) · The Real Deal, *"All the
world's a maze"* (2020-10) · Dalrymple's BPY *"End of the Dividend and Negative Equity"* (~2020).

**6. Dual-class governance** — structural facts are **primary-backed and uncontroversial**: ~40 partners
via BAM Partners Ltd hold Class B multiple-voting shares electing half the board; public Class A
holders elect the other half. CII opposes dual-class generally. **But NO Brookfield-specific
institutional governance campaign or proxy fight found in 2025–26. The critique is generic, not
company-specific.**

**7. NULL RESULTS — themes with NO substantive independent research found**, despite direct searching:
**Level 3 marks specifically at BN** (only Brookfield's own filing boilerplate; no external critique) ·
**office LTVs** · **circular ownership BN↔BAM↔BEP↔BIP↔BPG as an analytical treatment.** Reddit yielded
nothing usable. **Reported as a null result rather than padded.**

> ### ⚡ THE IRONY WORTH BUILDING THE RISK SECTION ON
> **The best CITABLE material on the bear themes comes from management's own transcripts and filings** —
> Shah's *"nearly $15 billion into Brookfield strategies"* + *"without any conflicts"*, Goodman's $145B
> BWS capital-access rationale, Note 27's $350M related-party fees and $3.5bn BAM-shares-to-BWS
> transfer, the $9.5bn commitments (+51%), Level 3 +29%, and the −70bp WA discount rate. **That is far
> better provenance than anything the critics offer.** The risk section should say plainly that the
> bear case is (a) one short-seller with a position, and (b) one paywalled FT investigation — and then
> build the actual risk analysis from primary disclosure.

---

## 10. Investment Outlook (framework §1D) — ⚠️ BROOKFIELD'S OWN VOICE, NOT FACT

**2026 Investment Outlook, published 2025-12-16, Bruce Flatt + business-group leaders.**
`https://www.brookfield.com/2026-investment-outlook` · PDF is **image-based, no text layer** → sector
views taken from Brookfield's own HTML articles.
**⚠️ 2025 Investment Outlook is NOT retrievable — `brookfield.com/2025-investment-outlook` returns 404.
Brookfield REPLACES rather than archives. Only 2026 is live.**

> **LABEL EVERYTHING BELOW AS WORLDVIEW. Every figure is Brookfield ASSERTING it — including the
> third-party-sounding numbers, which the documents DO NOT SOURCE.**

- **Macro (Flatt):** *"Stabilizing interest rates and the resilience of the global economy reinforce the case for investing in high-quality, long-duration assets…"* · *"Market conditions are favorable for large-scale alternative investment activity. Global M&A volumes reached multiyear highs in 2025."* · *"We are in an era that rewards operational excellence, efficient capital recycling and a focus on the fundamentals."*
- **Three Ds (Flatt):** *"The long-term opportunities for private capital lie in the megatrends we call the Three Ds: digitalization, deglobalization and decarbonization. These are not temporary cycles—they are structural transformations…"*
- **Infrastructure** (unbylined Commentary, Dec 2025): *"Artificial general intelligence could unlock as much as $10 trillion in productivity"* requiring *"$7 trillion of infrastructure investment across the AI value chain"* · *"Global infrastructure investment needs are expected to exceed $100 trillion by 2040"* · *"AI workloads now consume up to 10 times more power per rack"* · *"annual grid investment will need to exceed $600 billion by 2030"*. Data centers framed as **"AI factories."** Sam Pollock (CEO Infra, via press release): *"infrastructure sits at the center of a once-in-a-generation investment supercycle."*
- **Energy (Teskey):** *"Power has become a strategic priority around the world. It is now the bottleneck to growth for both governments and corporates."* **"Any-and-all" approach**: renewables for economics/speed; storage for flexibility; nuclear for scale; gas for stability. Asserted: four hyperscalers ≈ **90% of global clean energy contracting for data centers**; US DC demand **106 GW by 2035** (+36% vs a forecast 7 months prior); global power investment **$3.3T in 2025**.
- **Credit (Craig Noble):** *"spreads across public and private markets remain near historical tights"* · *"~150 basis-point premium on direct lending private debt remains accessible"* · *"Disciplined underwriting… is more important than ever."* Defaults *"in line with historical averages"*; no *"systemic wave of defaults."*
- **Real Estate (Lowell Baron):** *"If 2025 was the year the real estate market reopened, 2026 will be the year savvy investors can shift fully into tactical mode"* · *"The backbone of any real estate cycle is credit."* · *"Digital infrastructure demand is redefining land valuations"* (data-center conversion at *"1.5 times the logistics land valuation"*); *"Home prices have risen 87% since 2016."*
- **Private Equity (Anuj Ranjan):** *"Operational excellence is the new driver of returns."* · *"Value creation now requires operational excellence, not financial engineering."* Rate math: *"A transaction with a 7.5% rate and 55% LTV ratio would require nearly twice the earnings growth—8.4%—to achieve the same 20% return."*

---

## 11. Independent macro (framework §10 macro block) — as of 2026-07-17

All from primary endpoints (FRED CSV API, SEC EDGAR, EIA PDFs, IEA report PDF).

| Series | Value | As-of | ID |
|---|---|---|---|
| Fed funds target range | **3.50–3.75%** | 2026-07-16 | DFEDTARL/DFEDTARU |
| Effective fed funds | 3.63% | 2026-07-15 | EFFR |
| **10Y Treasury** | **4.55%** | 2026-07-15 | DGS10 |
| CPI YoY (NSA) | **+3.53%** | Jun 2026 | CPIAUCNS |
| CPI YoY (SA) | +3.46% | Jun 2026 | CPIAUCSL |
| **Core PCE YoY** | **+3.41%** | May 2026 | PCEPILFE |
| **ICE BofA US HY OAS** | **271bp** | 2026-07-15 | BAMLH0A0HYM2 |
| **ICE BofA US IG OAS** | **79bp** | 2026-07-15 | BAMLC0A0CM |

**DGS10 12mo:** Jul-25 4.37 · Sep 4.16 · Nov 4.02 · Dec 4.18 · **Feb-26 3.97 (low)** · Apr 4.40 · Jun 4.44 · **Jul 4.55**
**Target upper bound:** 4.50 → 4.25 (Sep-25) → 4.00 (Oct) → **3.75 from Dec-25, flat since**
**HY OAS:** Jul-25 2.86 · **Mar-26 3.28 (wide)** · Jul-26 **2.71** (near 12mo tights)

> ### ⚡ 11.1 THE ADJUDICATION — this is the analytical payload
> **CONTRADICTED: Flatt's "stabilizing interest rates."** This is a **BEAR STEEPENER** — the policy rate
> was **CUT 75bp** (4.50→3.75 upper bound) since Sept 2025 **while the 10Y ROSE ~58bp** off its Feb-26
> low of 3.97 to **4.55**. **The long-duration discount rate that actually prices Brookfield's assets
> moved AGAINST them even as the Fed eased.** And **core PCE is grinding UP** (Dec-25 ~2.97% → May-26
> **3.41%**), well above target, with the Fed on hold since December. **"Stabilizing" is doing a lot of work.**
>
> **CORROBORATED: Noble's "spreads near historical tights."** HY 271bp / IG 79bp, both near 12mo tights
> after a Mar-26 wobble. **The one Brookfield macro assertion the independent data fully supports.**

**Power — EIA July 2026 STEO (2026-07-07):** total US electricity consumption **4,195 bkWh (2025) →
4,269 (2026) → 4,399 (2027)** = **+1.8% 2026, +3.0% 2027** (cross-checked vs STEO's own net-change
series: +74, +130 bkWh ✓). **STEO contains ZERO data-center mentions — no DC load breakout exists.**
**AEO 2026 (2026-04-08):** *"After 15 years of nearly flat U.S. electricity consumption, demand has
increased by 2.1% per year, on average, over the last five years… we project… 0.9% to 1.6%, with data
center server energy use a major factor."* High Demand case: **DC server energy 818 bkWh in 2050**,
**>16× 2020**. EIA press 2026-01-13: strongest four-year US demand growth since 2000.

**IEA World Energy Investment 2026 (revised June 2026):** total energy investment **$3.4T in 2026**
(+5%); ~**$2.2T** to clean vs ~**$1.2T** to fossil · **electricity supply + infrastructure $1.6T**
(~**60% of all global energy investment**) · **grids/networks ~$550B, +~20% YoY** · batteries >$100B ·
renewable projects ~$665B/yr (solar 365 · wind 200 · hydro 75) — **renewables investment has FALLEN
YoY since 2024** · nuclear >$80B/yr, 78 GW under construction · **gas-fired plant orders 130 GW in
2025, a 25-year high** · **data centres: >$100B of energy-sector investment in 2025** · tech sector
= **~40% of all corporate PPAs signed globally in 2025**.
> ⚡ **IEA puts 2026 grid spend at ~$550B — so Brookfield's "must exceed $600 billion by 2030" is
> NEARLY MET TODAY. A weak framing device, not a bold call.**

**Hyperscaler capex — company-reported ONLY:**
| Co | Period | Capex | PY | Basis |
|---|---|---|---|---|
| **MSFT** | FY26 Q3 (qtr end 2026-03-31) | **$30,876M** (9mo $80,146M) | $16,745M (9mo $47,472M) | "Additions to property and equipment" |
| **AMZN** | Q1 2026 | **$44,203M**; TTM **$151,003M** | $25,019M (**+77%**); TTM $93,093M | "Purchases of property and equipment" |
| **GOOGL** | Q1 2026 | **$35,674M** | $17,197M (**+107%**) | "Purchases of property and equipment" |
| **META** | Q1 2026 | **$18,997M** ($19.84B incl. finance-lease principal) | $12,941M | — |

Company-stated forward capex (their own filings): **GOOGL 2026 capex $180–190B**, 2027 to *"significantly
increase"* (Alphabet's own FWP, 2026-06-01; raising equity for *"capital expenditures to scale AI
infrastructure and global compute"*). **META 2026 capex $125–145B, RAISED from $115–135B** — *"reflects
our expectations for higher component pricing… and, to a lesser extent, additional data center costs."*
**AMZN free cash flow fell to $1.2B TTM** (from $25.9B), which Amazon attributes to a **$59.3B YoY capex
increase** *"primarily reflect[ing] investments in artificial intelligence."*
> **⚠️ DELIBERATELY NOT SUMMED. No aggregate "AI capex" figure appears in any primary source; the
> periods are not comparable (MSFT is a fiscal quarter; META's headline includes finance leases,
> GOOGL/AMZN do not). Constructing a total would be exactly the analyst-estimate reconstruction the
> rules ban. → This row of the framework's macro block stays EMPTY BY DESIGN.**

### 11.2 ⚠️ Method warning — search summaries lag primary
One agent cross-checked another and found **two figures from search-engine summaries that direct
fetches disproved**:
- **IEA grids:** summary said *"~$400B/yr, must rise ~50% by 2030."* **Actual report: ~$550B in 2026, +~20% YoY.**
- **META FY26 capex:** summary said **$115–135B** — **the SUPERSEDED prior range.** Meta raised it to **$125–145B** in the Q1 release.
**Both errors ran in the same direction (understating capital flows). This is a live demonstration of
why primary-or-nothing is not pedantry here.**

---

## 12. ⏰ TIME-SENSITIVE — the file is stale

- **BN/BWS simplification shareholder votes were held at the AGMs on 2026-07-16 — YESTERDAY.** The file
  (asOf 28.06.2026) still describes this as pending board review. **The outcome is likely public now
  and NOT captured. Needs a retrieval pass.**
- **BN/BNT merger** — Flatt stated intent (Feb 2026 letter) to merge BN with its paired security BNT
  "this year." Not in the file.
- **Oaktree acquisition closing Q2 2026** (Teskey, BAM Q1 call).
- **Teskey named BAM CEO, Feb 2026.** Verify the file reflects it.
- **Just Group $40B mandate** (April 2026) → insurance assets $143.5B → **$180B**.

---

## 13. Proposed change set to `brookfield.json` (NOT YET APPLIED)

**Priority 1 — factual errors:**
1. `sources[17]` — remove the false "SEC 6-K EX-99.1" attribution; re-cite both IR deck URLs
2. §5.2 — "комиссии ~$5.8 млрд" → **"FRE $5.85 млрд"**; add fee revenue **$10.05 млрд** separately
3. §5.3 — "$176/$210" → **"$68 → $140 к 2030, post-split (3:2, эфф. 09.10.2025)"**
4. `sections[5]` (s06 peers), line ~1204 — relabel row `комиссии, квартал` → **`FRE, квартал`**; rewrite the prose that calls these "комиссии за управление" (BX's real mgmt fees are $2,132,808k, not $1.55B)
5. `sources` — replace the two `stocktitan.net` citations with SEC 8-K accessions

**Priority 2 — close 5 gaps** (§4): 5% recourse · LTV 54.6% · SpaceX · FBC-by-segment (re-cite to BAM Supplemental, drop Investing.com) · $91B (relabel FY2025)

**Priority 3 — new material:** annual-report risk factors + the AI-factor YoY delta · the
opportunity-vs-laggard AI tension · Level 3 +29% / −70bp discount rate WITH the disposal-mix
footnote · related-party Note 27 · NCI ~70% of FFO · Investment Outlook (as worldview) · macro
adjudication (§11.1) · ARES + CG peers + the definitional caveats (§7.4) · BN Q1 transcript quotes

**Priority 4 — decisions for the client** (§14)

**Also update:** `asOf` 28.06.2026 → 17.07.2026 · `verification` · `gaps` (remove 5 closed, add the
new unreachables)

---

## 14. Decisions the client must make

1. **Valuation multiples (§8.1)** — Brookfield publishes none. Ship derived multiples clearly tagged as ours, or omit the row?
2. **GAAP P/E in the peer table (§7.5)** — recommend **dropping**; APO's 78.07 sits on a loss quarter, BN's 85.00 is IFRS.
3. **"Infrastructure exposure" peer row (§7.6)** — НЕ РАСКРЫТО for all five. Drop, or replace with a loose "Real assets (incl. infra)"?
4. **"DE" peer row (§7.4.4)** — split into post-tax / pre-tax with blanks, or normalize?
5. **AUM peer row (§7.4.1)** — needs an insurance carve-out beside it or it misleads. Add the column?
6. **AI capex (§11)** — stays empty by design. Confirm.
7. **Uploads that would unblock the most:** **(a) FT 2025-03-06 article** — the single highest-value gap · (b) any sell-side PDF · (c) Preqin/PitchBook/Koyfin/AlphaSense exports · (d) VIC/SumZero writeups. Per `holdings-source-catalog` R4: drop files → classify → extract → approve → write.
8. **`brew install poppler`** — unblocks the 2025 Annual Report letter (§6.9) and any image-based PDF.

---

## 15. Scratchpad artifacts
`/private/tmp/claude-501/-Users-macbook-Code-ab-investment/bb926221-b628-4429-a91f-3085d0bcae52/scratchpad/`
`bam-ir-day-2025.pdf` · `bn-ir-day-2025.pdf` · `bam.txt` · `bn.txt` · `bn_q1_2026.txt` · `bam_q1_2026.txt`
**Session-scoped — copy anything worth keeping.**
