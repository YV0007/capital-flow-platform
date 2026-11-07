# DC-AI Section — Handoff / Continuation Guide

Self-contained brief to continue the **Data Centers for AI** research section in a fresh chat.
Read this + `DC-AI-THESIS-APPROACH.md` (has §7.5 THE CRAFT) before building anything.
Dashboard is Russian, audience = non-engineer investor. Live: ab-investment.vercel.app → Research → Data Centers for AI.

---

## 1. Where things stand (42 graph nodes)

- ✅ **Done — thesis mode (19):** litho, test, eda, ip, silicon, wbg, asic, hbm, dram, pkg, gasturbines, **renewables** (new node added 2026-08-04), power, transformers, photonics, netsilicon, server, rack, lab
- 🟡 **Have research, still block format (7):** nand *(built but user paused it — currently held as block)*, pcb, fabric, transceivers, darkfiber, fiber, inference
- ⬜ **Empty — no deep-dive at all (16):** goes, resist, chem, inpgaas, titanium, hbmmat, nuc, smr, fuel, gaspipe, switchgear, pmgmt, liquid, mep, contracting, **apps** (AI adoption / demand side)

**Remaining = 23** (7 conversions + 16 fresh builds). Highest-value empty: `apps`.

**Adding a NEW graph node** (like `renewables`): add one line to `NODES_RAW` in `Roadmap.jsx` (`{id, label, sector, bucket, layer}` — layout auto-distributes the row, no coords) + an edge in `EDGES_RAW` (`['from','to']`, e.g. `['renewables','power']`), then build its thesis in `dc-details.json` + add pick companies to `dc-companies.json`. Stage `Roadmap.jsx` too.

**Flags:** `dram` is deployed but the user called it "weak" and paused — likely needs a redo. `nand` is finished-in-a-script but held (restored to block); user wanted to review dram first.

Recompute anytime:
```python
import json,re
d=json.load(open('src/data/dc-details.json'))
blk=open('src/components/research/dc/Roadmap.jsx').read(); blk=blk[blk.index('const NODES_RAW'):]; blk=blk[:blk.index('\n];')]
ids=[m.group(1) for m in re.finditer(r"\bid:\s*'([a-z0-9]+)'",blk)]; ids=list(dict.fromkeys(ids))
print('thesis',[n for n in ids if isinstance(d.get(n),dict) and 'thesis' in d[n]])
print('block',[n for n in ids if isinstance(d.get(n),dict) and 'thesis' not in d[n]])
print('empty',[n for n in ids if not isinstance(d.get(n),dict)])
```

---

## 2. The content standard (hard rules, learned the hard way this session)

### Big idea = an ARGUMENT, ≤~100 words
Formula: **[what the market thinks/does] — BUT [the real situation] — BECAUSE [the mechanism] — SO [the call, with named tickers].** Not a summary. Zero unexplained jargon.
- Big idea must **NOT restate the opening hook** paragraph — they approach differently.

### Report register — NOT chatty (major correction)
The client rejected stream-of-thought prose. Write like a **report**: declarative topic-sentence-first paragraphs, descriptive headings. **Kill conversational setups** — no «Разложим…», «И вот сдвиг», «Вопрос один», «в этом вся интрига». Data-forward: lead with the data, don't "sell then reveal."

### No yapping — give ALPHA
Facts + an investable edge, not pretty GPT text. Every sentence must change the argument; cut the rest.

### NO abstract stat cards (latest + strict rule)
Every `stat` card's `v` = a **concrete figure** (%, $, ×, units); its `n` must **quantify the consequence** (how much it costs/saves/earns). A three-word label like «простой GPU» or «растущая доля» is banned. When a claim is qualitative, STOP and research the real number, then weave it into the prose too.
- Good example (photonics): "простой GPU" → **«32–36% — реальная загрузка GPU (GPT-4 на 25 тыс.)»** + **«~$300 млн/год — потери на кластере 100 тыс. GPU при 60% vs 90%»**.

### Full-economics data density (not just tech + one market number)
A node is NOT done when the tech is explained. It must also carry the money picture, each with real figures: **capital flows** (who invests how much — e.g. Nvidia ~$6.5B into photonics), **funding raised / valuations** for private names, **M&A prices** (Marvell–Celestial ~$3.25–5.5B), **backlogs / order books** (Lumentum >$400M, Coherent booked to 2028–30), **cost / ASP** (800G module ~$900–1,300) and **customer commitments** (multi-year purchase agreements), **quantified benefit** (CPO 3.5× power), and **the alternatives** (copper DAC/AEC, linear modules). If the node is tech-heavy and money-light, it's unbalanced — go research the numbers. The **`photonics` node is the reference example** for this balance.

### Close with a style→vehicle MENU, not a prescription
Don't write "в ближний срок играть через X". Map vehicles to investor styles and let them decide: a small table «Если ваш стиль → Чем закрыть тему» — Нейтрально (не угадывать победителя) → suppliers/lasers; Фундамент/повторяющийся доход → core names; Асимметрия/венчур → private/high-risk. Note it's «соответствие инструмента стилю — решение за инвестором». **Do NOT duplicate** this with `picksTakeaway` — if the Итог already carries the conclusion, drop `picksTakeaway` (Block hides it when absent).

### The «Куда движется» future/capital block is a PRIORITY (give it real space)
Must cover all three, named and with numbers: (a) where the **tech** heads, (b) where **capital** flows (capex, M&A, strategic stakes, funding), (c) **what each key player bets on** (a "who-bets-on-what" table works well). Do NOT let it be one paragraph, and don't duplicate the closing summary.

### «Итог — если запомнить одно» = compressed summary + the call
The whole thesis in a few lines + the actionable conclusion. All "where it goes" lives in the future block, not here. Don't over-elevate a secondary framing — if a side-thread doesn't lead to a decision, demote it to plain business-model context.

### Voice / banned terms
Plain Russian; gloss every specialist term on first use; **no metaphors/analogies**; English finance acronyms OK (P/E, CAGR, EBITDA), English prose NOT (gloss «insourcing»→«перенос сборки внутрь…», «consignment»→plainly).
Banned → replacement: «секулярный суперцикл»/«суперцикл» → plain; «узкое место» → «ограничение»; «ров» → «барьер»; turbine «лопатки» → «самые горячие детали турбины»; «выйти на плато» → «рост остановится»; «ЦОД» → «дата-центр»; «коммутатор» → **«свитч»**; «чиплет» → **«мини-чип»**; «вычислительный кристалл» → **«сам чип»** (кристалл=die → «чип»); «полоса» (bandwidth) → say it plainly («за раз проходит больше данных» / «пропускная способность»); bare English «I/O» → **«ввод-вывод»**, glossed once as «(I/O) — как чип принимает и отдаёт данные»; «scale-up»/«scale-out» → plain Russian («тесная связь ускорителей» / «соединение серверов и зданий»). **Gloss even seemingly-common terms on first use** — the client did NOT know «свитч», «сменный модуль», «CPO»; define each in plain words the first time. Don't cite a single perma-bear; attribute to «скептики» + a real number.

---

## 3. Cross-link web + navigation (already built — DON'T rebuild, just use)

**Syntax:** `[[nodeId|label|target]]`. The 3rd part is a keyword/phrase that scrolls to + flash-highlights the matching paragraph in the destination. 2-part `[[nodeId|label]]` defaults to highlighting the big idea. Links only render if the node exists in NODES_RAW (else plain text — safe). Works in table cells too. **Link liberally.**

**Canonical landing target per destination** (one pivotal heading phrase; use these when linking to a thesis node):
`hbm`→"отвязался от цикла" · `asic`→"зарабатывает на каждом чипе" · `power`→"не генерация, а подключение" · `rack`→"берёт GPU в долг" · `eda`→"невозможно обойти" · `pkg`→"стала главной" · `litho`→"невозможно повторить" · `transformers`→"сталь внутри него" · `dram`→"не обычный цикл" · `test`→"железо и софт".
When you build a new thesis node, pick its own canonical pivotal-heading phrase and use it in inbound links.

**External links (2026-08-03):** `RichText` also renders `[[https://…|label]]` as an external `<a target="_blank"> label ↗`. Use for per-item "подробнее" links (e.g. a product/press page in a "who bets on what" table). **Verify URLs with curl + a browser UA before adding**: `200` = good, `403` = bot-block (fine in a real browser, still usable), `404` = wrong path (skip / find another). If no clean official page exists (e.g. TSMC COUPE), skip rather than link something dead.

**Shipped UI (Roadmap.jsx), no component change needed to add nodes:**
- `HighlightWrap` — highlighter-pen sweep (wipes left→right), settles to a persistent 0.16 marker, hover reveals a "↩ Назад к «origin»" button; scroll-position restore on back. Big-idea (`__hero__`) landing uses a glow-fade instead (keyframes `hero-glow`/`hero-tint`), held ~5s.
- `searchDC()` + `SearchBar` — smart topic search at top of the DC section; indexes ONLY pivotal surfaces (bigIdea, headings, lead paragraphs, stat labels) so results are the sectors that *matter* for a term; jumps + highlights. No icon, compact.
- **Bucket tags are Russian** now (BUCKET_TAGS): СЫРЬЁ, СТАНКИ, ЧИПЫ, ПАМЯТЬ, ЭНЕРГО, СЕТЬ, ХОЛОД, СТРОЙ, СОФТ.

---

## 4. Company profiles (built — extend by adding data)
`src/data/dc-company-profiles.json`, keyed by **ticker** (matches picks `row.ticker`). Any pick row with a profile shows **«Подробнее о компании →»** (modal: tagline, overview w/ cross-links, financials cards, target, whyMargins, moat[], risk, verdict, related[] chips) + **«↗ Сайт»**.
Done so far: BESI, Cadence, Synopsys, Arm, Rambus, Adeia, ASMPT, + photonics set is *not* yet profiled. Rollout to more names = just add profile objects (research or user-supplied). Modal + wiring already in Roadmap.jsx.

---

## 5. Per-node build workflow (token-efficient)
1. **Never read full JSONs** (`dc-details.json` ~12k lines). Pull only the target node's fields with a small python snippet; for conversions, mine the existing block's numbers/picks.
2. **Research yourself** (proven on test/ip/photonics) — WebSearch for current figures; verify numbers. User will hand a report for nodes they care about (paste → ingest BIG IDEA + data + names).
3. Write the thesis (`{bigIdea, stream:[...]}`) + `picks` (2 groups: `tone:"leader"` rows use `priced`; `tone:"emerging"` rows use `risk`) + `picksTakeaway`, via **python `json.load`/`json.dump(...ensure_ascii=False, indent=2)`** — never hand-edit the giant JSON.
4. Stream element kinds: `h`, `p`(+`lead:true`), `quote`, `note`, `stat{items:[{v,l,n}]}`, `chart{bars}`, `bars{items:[{label,value,display,note}]}`, `table{head,rows,note}`, `image{src,caption,credit}`.
5. Auto-checks before deploy: banned-term scan; every `[[id|...]]` resolves to a NODES_RAW id; every pick `company` exists in `dc-companies.json` (add missing, incl. private as `Pvt`); `npm run build` passes.
6. Real photos: Wikimedia Commons only, verify with `curl -sI` (200 + image/*), no people, tech in-situ, credit author+license. Skip rather than use a wrong one.

### Deploy hygiene (CRITICAL)
`npm run build` → stage **ONLY** `src/data/dc-details.json` + `src/components/research/dc/Roadmap.jsx` (+ `dc-companies.json` / `dc-company-profiles.json` when touched) → terse commit → `git push origin main` (auto-deploys Vercel).
**NEVER commit** the unrelated working-tree files: `PortfolioDeep.jsx` and `holdings-v2/portfolio/*.json` (they've been dirty all session — leave them).
- Default: auto-deploy each finished node; user reviews in batches and fixes forward.
- If the user says "let me check first" → build to localhost only (`preview_start name:"dev"`, port 5173, hot-reloads), hold the push until approved.
- Corrections: **structural/general → apply across all nodes; node-specific → only that node.**

---

## 6. Key files
| File | Role |
|---|---|
| `src/data/dc-details.json` | all node content (thesis + legacy block fields, which are ignored in thesis mode) |
| `src/data/dc-companies.json` | company catalog (company, ticker, sector…) — picks reference it |
| `src/data/dc-company-profiles.json` | rich «Подробнее» profiles, keyed by ticker |
| `src/components/research/dc/Roadmap.jsx` | component: NODES_RAW graph, thesis rendering, nav/search/highlight/profiles |
| `DC-AI-THESIS-APPROACH.md` | the craft doc — §7.5 THE CRAFT is the quality bible |
| `DC-AI-HANDOFF.md` | this file |

Memory (`~/.claude/.../memory/MEMORY.md`) auto-loads and already carries: dc-ai-thesis-mode, dc-ai-crosslink-web, dc-ai-plain-voice-no-ai-wording (incl. the no-abstract-stats rule), holdings-* notes.

---

## 7. Suggested next steps
1. Revisit **`dram`** (flagged weak) — likely tighten to report register + harder data.
2. Resume conversions (data exists): `nand` (already drafted in a scratch script — reuse), then `inference`, `transceivers`, `fabric`, `pcb`, `fiber`, `darkfiber`.
3. Then the empties, priority **`silicon`** (Nvidia/AMD/GPU headline) and **`apps`** (demand side), then energy/materials.
4. Extend company profiles to the built nodes' picks (Advantest, Vertiv, Amphenol, Foxconn, GE Vernova, Nvidia, Broadcom, Marvell, Coherent…).
