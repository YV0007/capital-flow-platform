# DC-AI Deep-Dive Implementation Guide

## Status: 14 / 41 nodes complete

### Completed (14)
| Layer | Node ID | Label | Verdict (G/M/C/V) |
|-------|---------|-------|-------------------|
| 1 | `litho` | Станки для чипов | 8/9/4/4 |
| 1 | `eda` | Софт для чипов | 8/9/5/4 |
| 2 | `asic` | Кастомные AI-чипы | 9/7/6/4 |
| 2 | `wbg` | Силовые чипы | 9/7/5/3 |
| 3 | `hbm` | HBM-память | 9/8/5/4 |
| 3 | `dram` | DRAM | 7/7/4/5 |
| 3 | `nand` | NAND / SSD | 6/6/4/5 |
| 4 | `pkg` | Упаковка чипов | 9/8/5/4 |
| 4 | `pcb` | Платы / подложки | 9/8/5/4 |
| 7 | `photonics` | Фотоника | 9/7/6/4 |
| 7 | `netsilicon` | Сетевые чипы | 9/7/8/4 |
| 7 | `fabric` | Сетевая фабрика | 9/6/7/4 |
| 7 | `transceivers` | Оптические модули | 9/7/7/4 |
| 10 | `inference` | Инференс | (check file) |

### Remaining (27 nodes)
| Layer | Node ID | Label | Sector |
|-------|---------|-------|--------|
| 0 | `goes` | Электросталь | GOES Steel |
| 0 | `resist` | Фоторезист | Photoresist |
| 0 | `chem` | Химия для чипов | Specialty Chem |
| 0 | `inpgaas` | InP / GaAs | InP/GaAs |
| 0 | `titanium` | Титановые сплавы | Titanium |
| 0 | `hbmmat` | Материалы для HBM | HBM Materials |
| 1 | `test` | Тестирование | Test |
| 1 | `ip` | Лицензии / склейка | IP/Bonding |
| 2 | `silicon` | AI-чипы | AI Silicon |
| 5 | `nuc` | Атомная энергия | Nuclear |
| 5 | `smr` | Малые реакторы | SMR |
| 5 | `fuel` | Топливные элементы | Fuel Cells |
| 5 | `gaspipe` | Газопроводы | Gas Pipelines |
| 5 | `gasturbines` | Газовые турбины | Gas Turbines |
| 6 | `power` | Электроэнергия | Power |
| 6 | `transformers` | Трансформаторы | Transformers |
| 6 | `switchgear` | Электрощиты | Switchgear |
| 6 | `pmgmt` | Питание стоек | Power Mgmt |
| 7 | `darkfiber` | Тёмное волокно | Dark Fiber |
| 7 | `fiber` | Оптоволокно | Fiber/Cable |
| 8 | `server` | Сборка серверов | Server Systems |
| 8 | `liquid` | Охлаждение | Liquid Cooling |
| 8 | `mep` | Инженерные системы | MEP |
| 8 | `contracting` | Строительство | Contracting |
| 9 | `rack` | AI-ВЫЧИСЛЕНИЯ | AI Compute Infra |
| 11 | `apps` | Внедрение ИИ | (apps layer) |
| 11 | `lab` | AI-лаборатории | (labs layer) |

---

## How to implement a new deep-dive

### Step 1: Write the 18-key JSON entry

Each deep-dive is a single JSON object keyed by node ID in `src/data/dc-details.json`. The entry MUST have exactly 18 keys, mirroring existing entries (e.g. `photonics`, `netsilicon`, `fabric`, `transceivers`).

Use a Python script to write (not manual editing — files are 200+ KB). Pattern:

```python
import json

with open('src/data/dc-details.json') as f:
    d = json.load(f)

entry = {
  # ... all 18 keys ...
}

d['NODE_ID'] = entry

with open('src/data/dc-details.json', 'w') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)
```

### Step 2: The 18 keys (exact structure)

```
 1. asOf          string       "2026-07-27"
 2. intro         string       ~400–700 chars. Plain Russian. What this layer does, why it matters for AI, key numbers.
 3. tldr          array[3-4]   Array of strings, each ~200–400 chars. Three bullet-style takeaways.
 4. verdict       object       See VERDICT below
 5. marketSizing  object       See MARKET SIZING below
 6. valueCapture  object       See VALUE CAPTURE below
 7. competition   object       See COMPETITION below
 8. demand        object       See DEMAND below
 9. supply        object       See SUPPLY below
10. unitEconomics object       See UNIT ECONOMICS below
11. roadmap       object       See ROADMAP below
12. dependencies  object       See DEPENDENCIES below
13. risks         array        See RISKS below
14. picks         array[2]     See PICKS below (CRITICAL — two groups)
15. picksTakeaway string       ~200–400 chars. Summary of picks logic.
16. monitoring    object       See MONITORING below
17. update        object       See UPDATE below
18. news          array[4-5]   See NEWS below
```

### VERDICT structure
```json
{
  "subScores": {
    "growth": 9,        // 1-10, higher = better
    "moat": 7,          // 1-10
    "cyclicality": 7,   // label = "margin quality" in UI; 1-10
    "valuation": 4      // 1-10, higher = cheaper/more attractive
  },
  "summary": "string — one paragraph verdict in Russian",
  "horizon": "3–5 лет (description)",
  "sizing": "string — TAM summary with numbers",
  "keyQuestion": "string — the ONE question that decides the trade",
  "bull": ["point 1", "point 2", "point 3"],    // exactly 3, each ~100-200 chars
  "bear": ["point 1", "point 2", "point 3"]     // exactly 3
}
```

### MARKET SIZING structure
```json
{
  "cagr": "~30–40% (description, years)",
  "chartTitle": "string — chart header in Russian",
  "tam": [
    { "year": "2024", "value": 10, "label": "~$10B", "source": "source name" },
    // ... 4-5 entries covering 2024–2030
  ],
  "bomShare": {
    "value": "~10–20%",
    "note": "string — what share of AI cluster cost"
  },
  "volumeVsPrice": "string — is growth volume-driven, price-driven, or both"
}
```

### VALUE CAPTURE structure
```json
{
  "margins": [
    { "stage": "Company (role)", "gm": "~XX%", "note": "context" },
    // 4-6 entries, ordered from highest to lowest margin
  ],
  "bottleneckNow": "string — current supply bottleneck",
  "bottleneckNext": "string — next bottleneck forming",
  "capitalIntensity": "string — how capital-heavy is this layer",
  "takeaway": "string — where durable value accrues"
}
```

### COMPETITION structure
```json
{
  "concentration": "string — market concentration description",
  "shareTrajectory": [
    { "player": "Name", "now": "share description", "direction": "↑/↓/→", "detail": "context" },
    // 4-5 entries
  ],
  "players": [
    { "name": "Name", "share": "XX%", "edge": "competitive advantage" },
    // 4-5 entries
  ],
  "switchingCost": "string",
  "entryBarrier": "string",
  "takeaway": "string"
}
```

### DEMAND structure
```json
{
  "soldOut": [
    { "year": "2026", "pct": 90, "note": "explanation" },
    { "year": "2027", "pct": 80, "note": "..." },
    { "year": "2028", "pct": 65, "note": "..." }
  ],
  "contractStructure": "string — how contracts work",
  "customerConcentration": "string — who buys, how concentrated",
  "backlog": "string — current backlog/order data",
  "pricing": "string — pricing dynamics",
  "takeaway": "string"
}
```

### SUPPLY structure
```json
{
  "balance": [
    { "year": "2026", "state": "дефицит", "color": "#ef4444", "detail": "..." },
    { "year": "2027", "state": "easing",   "color": "#f59e0b", "detail": "..." },
    { "year": "2028", "state": "balanced", "color": "#22d3ee", "detail": "..." }
  ],
  "capacityAdds": [
    { "name": "Description of capacity addition", "when": "2025–2027", "impact": "what it changes" },
    // 3-5 entries
  ],
  "leadTime": "string",
  "utilization": "string",
  "crowdingOut": "string — who's being displaced",
  "takeaway": "string"
}
```
**Colors**: `#ef4444` = red (deficit), `#f59e0b` = amber (tight/easing), `#22d3ee` = cyan (balanced), `#22c55e` = green (surplus).

### UNIT ECONOMICS structure
```json
{
  "pricePerUnit": "string — ASP / per-unit pricing",
  "grossMargin": "string — margins across the chain",
  "costCurve": "string — cost dynamics and learning curves",
  "yields": [
    { "gen": "Generation/tech name", "pct": "yield or status", "note": "context" }
  ],
  "takeaway": "string"
}
```

### ROADMAP structure
```json
{
  "generations": [
    { "name": "Gen name", "node": "status word", "year": "20XX–20XX", "note": "context" },
    // 4-6 entries; node = "mainstream"/"shipping"/"ramping"/"sampling"/"development"/"announced"
  ],
  "disruption": [
    {
      "tech": "Disruption technology name",
      "verdict": "assessment string",
      "tone": "positive"/"negative"/"mixed",
      "detail": "explanation paragraph",
      "angle": "investment implication"
    },
    // 2-4 disruption risks
  ],
  "takeaway": "string"
}
```

### DEPENDENCIES structure
```json
{
  "upstream": [
    { "item": "What's needed", "supplier": "Who supplies", "note": "context + cross-reference to other node" },
    // 3-5 entries; use "→ раздел Name" to cross-link to other DC-AI nodes
  ],
  "downstream": "string — who buys the output",
  "correlation": "string — what drives this market",
  "takeaway": "string"
}
```

### RISKS structure
```json
[
  { "risk": "Risk name", "prob": "Высокая/Средняя/Низкая", "impact": "Высокий/Средний/Низкий", "note": "context" },
  // 5-7 risks
]
```

### PICKS structure (CRITICAL)
```json
[
  {
    "group": "Лидеры — description in Russian",
    "tone": "leader",                           // MUST be "leader" for group 1
    "badge": "short label for the badge",
    "note": "summary of group logic",
    "rows": [
      {
        "company": "Company Name",              // must match dc-companies.json
        "ticker": "EXCHANGE: TICKER",
        "mcap": "~$XXX млрд",
        "exposure": "what part of this sector",
        "why": "investment thesis paragraph",
        "priced": "what the market already prices in"  // LEADER rows use "priced"
      },
      // 3-5 rows
    ]
  },
  {
    "group": "Emerging и overlooked — description",
    "tone": "emerging",                          // MUST be "emerging" for group 2
    "badge": "short label",
    "note": "summary",
    "rows": [
      {
        "company": "Company Name",
        "ticker": "EXCHANGE: TICKER",
        "mcap": "~$XXX млрд",
        "exposure": "...",
        "why": "...",
        "risk": "what could go wrong"           // EMERGING rows use "risk" (not "priced")
      },
      // 4-7 rows
    ]
  }
]
```

**CRITICAL**: Leader rows have `priced` field. Emerging rows have `risk` field. The PicksBlock component renders them differently.

### MONITORING structure
```json
{
  "metrics": ["string 1", "string 2", ...],   // 5-8 trackable metrics with sources
  "canary": ["string 1", "string 2", ...]     // 4-6 early warning signals
}
```

### UPDATE structure
```json
{
  "asOf": "Июль 2026",
  "headline": "string — one-line headline",
  "summary": "string — 2-3 sentence summary",
  "stories": [
    {
      "title": "Event title",
      "tone": "positive"/"negative"/"mixed",
      "verdict": "what it means for the investment",
      "detail": "supporting data"
    },
    // 3-5 stories
  ],
  "bottomLine": "string — final sentence"
}
```

### NEWS structure
```json
[
  {
    "date": "2026-05-15",                     // ISO date
    "source": "Company or publication name",
    "title": "Headline string",
    "blurb": "1-2 sentence summary"
  },
  // 4-5 items, most recent first
]
```

---

## Step 3: Add new companies to dc-companies.json

For each company in picks that doesn't already exist in `dc-companies.json`, add an entry:

```python
{
    "company": "Company Name",       # exact name used in picks rows
    "ticker": "EXCHANGE: TICKER",
    "sector": "Sector Name",         # must match node's sector in Roadmap.jsx
    "conviction": "high/medium/low",
    "riskTier": "low/mid/high",
    "horizon": "X–Y лет",
    "ppr": "one-line thesis",
    "geo": "US/CN/TW/JP/KR/DE/...",
    "note": "additional context"
}
```

**Deduplication**: Always check `existing = {c['company'] for c in companies}` before adding. A company can appear in multiple sectors (e.g. Broadcom in Custom ASIC + Network Silicon + Inference).

## Step 4: Update research-library.json

Update `companyCount` for the `data-centers-ai` entry to the new unique company count:
```python
unique = len({c['company'] for c in companies})
```

## Step 5: Build, commit, push

```bash
npm run build                    # must pass
git add src/data/dc-details.json src/data/dc-companies.json src/data/research-library.json
git commit -m "DC-AI: full investment deep-dive for <description> (<nodeId> node)"
git push origin main             # auto-deploys to Vercel
```

---

## Token budget rules (CRITICAL)

- **NEVER** read full data JSONs — they are 200–400 KB. Use `grep` or Python scripts.
- **NEVER** read full research MDs — they are 40–65 KB. Grep first, targeted read second.
- Write entries via Python `json.load()` / `json.dump()` — never manual text editing.
- When editing, read only the 50–100 lines around the target key.

## Content rules

- All text in **plain Russian** — self-explanatory for a non-engineer investor client.
- English finance acronyms stay English (P/E, GM, CAGR, TAM, etc.).
- Banned jargon: ЦОД, якорный покупатель, and similar abbreviations the client doesn't understand.
- Every number must have a source or "оценка" label.
- Cross-reference other DC-AI nodes with "→ раздел Name" in dependencies.

## Component rendering

The UI renders deep-dives via `NodeDetail` component in `src/components/research/dc/Roadmap.jsx`. It auto-detects which blocks exist and builds a nav bar from them. No component changes needed — just write the JSON data correctly.

Key rendering rules:
- `verdict.subScores` → 4 colored bars (growth/moat/cyclicality/valuation)
- `picks[0].tone = "leader"` → rows render with `priced` field
- `picks[1].tone = "emerging"` → rows render with `risk` field
- `supply.balance[].color` → colored dot/badge next to supply state
- `roadmap.disruption[].tone` → colored accent (positive=green, negative=red, mixed=amber)
- `news[].date` → sorted chronologically
- `update.stories[].tone` → colored badge

## Files involved

| File | Role |
|------|------|
| `src/data/dc-details.json` | All deep-dive content, keyed by node ID |
| `src/data/dc-companies.json` | Company catalog (company, ticker, sector, conviction, etc.) |
| `src/data/research-library.json` | Library card — update `companyCount` and `sectionCount` |
| `src/components/research/dc/Roadmap.jsx` | Node definitions (NODES_RAW), rendering logic |
| `src/data/dc-buckets.json` | Bucket definitions (don't usually need to change) |

## Quality checklist

- [ ] 18 keys present
- [ ] `verdict.subScores` has exactly 4 scores (growth, moat, cyclicality, valuation), each 1–10
- [ ] `picks` has exactly 2 groups: tone="leader" (with `priced`) and tone="emerging" (with `risk`)
- [ ] Total picks = ~8–12 companies across both groups
- [ ] All pick companies exist in `dc-companies.json`
- [ ] `bull` and `bear` each have exactly 3 items
- [ ] `supply.balance` has color codes
- [ ] `news` has 4–5 items with ISO dates
- [ ] `monitoring.canary` has 4–6 early warning signals
- [ ] No banned jargon; all Russian text plain and investor-readable
- [ ] `npm run build` passes
- [ ] `companyCount` updated in research-library.json
