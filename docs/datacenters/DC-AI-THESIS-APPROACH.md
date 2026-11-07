# DC-AI Deep-Dive — "Thesis Mode" Approach & Handoff

This is the standard for the **new** DC-AI sector deep-dives. Each sector node is rewritten
from a stack of disconnected data blocks into **one flowing, data-proven argument** that
proves a single big idea and leaves the reader with a thesis they can restate without
re-reading. Dashboard is Russian; audience is a non-engineer investor.

Live: ab-investment.vercel.app → Research → Data Centers for AI → click a node.

---

## 0. The goal (why we changed the format)
The old block layout felt like disconnected facts. The client wants each sector to read as
**one connected narrative** in the voice of the 3553research.com substack: argumentative,
concrete numbers with context, a **variant perception** (where the market misunderstands /
mis-prices the sector), ending in a clear investment call. After reading, the investor should
be able to say — without looking — where the sector is heading, who captures the value, and
whether it's interesting to invest in.

Reference the client loved (voice/structure): the SaaS "Armageddon" / Construction-Autodesk
substack essays — a clean thesis carried through the whole text, proven over time with data
and named companies, ending with the opportunity.

---

## 1. How it renders (component)
File: `src/components/research/dc/Roadmap.jsx`

- `NodeDetail` **early-returns a thesis view when `detail.thesis` exists** (skips the whole
  block memo). It renders: back button + node header + `ThesisHero` (the big idea) +
  `NarrativeView` (the ordered `stream`) + `PicksBlock` (the actionable names) + chain pills.
- `NarrativeView` maps `stream` elements via `NarrativeEl`. `RichText` renders inline
  cross-links `[[nodeId|label]]` (click jumps to that node; only linkifies if the node exists).
- **No component change is needed to add a thesis node** — just write the data.

### Element kinds available in `stream` (each is `{k: "...", ...}`)
- `{k:"h", t:"Heading"}` — section header
- `{k:"p", t:"...", lead:true?}` — paragraph; `lead:true` = bold/emphasis. Supports `[[node|label]]` links.
- `{k:"quote", t:"..."}` — pull-quote / key insight callout
- `{k:"note", label:"...", t:"..."}` — small highlighted aside (e.g. "ТЕЗИС РЫНКА")
- `{k:"stat", items:[{v:"~$18 млрд", l:"label", n:"note"}]}` — row of stat cards (2–3 items ideal)
- `{k:"chart", t:"title", bars:[{year,value,label}]}` — bar chart (TAM-style)
- `{k:"bars", t:"title", items:[{label, value:0-100, display:"~70%", note?}]}` — horizontal comparison bars (shares, margins)
- `{k:"table", head:[...], rows:[[...]], note?:"source"}` — table
- `{k:"image", src:"URL", caption:"...", credit:"..."}` — real photo (see §6)

### Data schema per node (in `src/data/dc-details.json`)
```
"<nodeId>": {
  "thesis": { "bigIdea": "one-sentence thesis", "stream": [ ...elements... ] },
  "picks": [ {group,tone:"leader"|"emerging",badge,note,rows:[{company,ticker,mcap,exposure,why,priced|risk}]} ],
  "picksTakeaway": "one line"
  // (old block fields can stay — they're ignored in thesis mode)
}
```
`picks` group 1 `tone:"leader"`, rows use a `priced` field; group 2 `tone:"emerging"`, rows use `risk`.

---

## 2. The content arc (ADAPT per sector — NOT a fixed template)
Every sector proves ONE big idea, usually a **variant perception**. Find the sharpest true
tension (don't do a bland "big growing market"):
- What does the market believe, and where is it wrong / too simplistic?
- Who actually captures the economics vs who gets the attention?
- What is the real constraint, and who controls it?
- What is mis-priced relative to fundamentals?

A typical flow (reorder/rename to fit the sector):
1. **Hook** — what this link is and why it's unavoidable (with the strongest number)
2. **Tech: how it actually works** — concept-first, minimal vendor names, gloss every term
3. **Who captures value / margin-by-layer** — where the money really sits
4. **Client pool + backlog** — who buys, concentration, how contracted
5. **The consensus** — what the market believes, stated fairly
6. **The variant view** — the payoff, proven with data (the reveal)
7. **What's already priced in** — valuation now vs history; how to own it right
8. **«Куда движется технология — и куда идут деньги»** — see §3, HIGH PRIORITY
9. **«Что сломает — или подтвердит тезис»** — a table of kill/confirm signals
10. **«Итог — если запомнить одно»** — a tight SUMMARY (see §4), then the picks table

Examples of the per-sector big idea (each different):
- EDA: "market thinks AI kills chip-design software; it deepens the moat"
- Custom chips (asic): "wrong debate; the real winner (Broadcom) is mis-priced" + a tech section on WHY custom can beat Nvidia
- HBM: "priced as a memory cycle, but it decoupled; yield is the moat"
- Litho: "a monopoly repeatedly sold as a cyclical"
- Packaging (pkg): "the bottleneck is real but the market over-priced it in the WRONG layer"
- Neoclouds (rack): "equity prices growth, credit prices ~50% default — own the clean balance sheet"
- Transformers: "the real chokepoint is the GOES steel, not the box"
- Power chips (wbg): "content explodes 17x but value disperses — own the broad incumbents"
- Gas turbines: "two businesses in one — cyclical equipment + a durable 20-yr service annuity"
- AI labs: "the apex of the stack is the worst place to invest; own the adjacencies"

---

## 3. The future/capital block is a PRIORITY (give it real space)
Client explicitly said the **«Куда движется технология — и куда идут деньги»** section is one
of the most important parts. It must be detailed, not a token paragraph, and cover:
- **Where the tech heads next** (the roadmap; what changes the game)
- **Where capital & attention flow next** (capex, strategic stakes, funding rounds, who put $ into whom)
- **What each key player is betting on** (named)
Do NOT let this duplicate the closing summary (§4).

---

## 4. The closing block is a SUMMARY, not a second "where it heads"
Title it **«Итог — если запомнить одно»**. It's the whole thesis compressed (the constraint →
the variant → the call) + the actionable conclusion. All "where it goes" content lives in the
future block above, not here.

---

## 5. Language & style rules (HARD)
- **Plain Russian for a non-engineer investor.** English finance acronyms OK (P/E, CAGR, TAM,
  EBITDA, ARR). English/transliterated prose is NOT.
- **Gloss every specialist term in plain words on first use** (thesis mode has no separate
  explainer). Before any table with unexplained step-names, add a plain "how it's made" primer.
- **The big idea especially must contain ZERO unexplained jargon** — no bare "200G SerDes",
  "scale-up", "CDS" etc. without a plain substitute or inline gloss. Client: "откуда мне знать что такое 200G SerDes".
- **No metaphors / analogies.** State it plainly with facts.
- **BANNED words/phrases** (replace with the given plain form):
  - «узкое место» → «ограничение»
  - «ров» (moat) → «барьер» / «защита» / «конкурентное преимущество»
  - «эмерджентные имена» → «молодые компании» / «новые игроки»
  - «profit pool» → «основная прибыль»
  - «merchant switch» → «свободный рынок коммутаторов»
  - «проприетарная шина» → «фирменная связь» (e.g. NVLink → «фирменная сверхбыстрая связь Nvidia»)
  - «фатальный хвост» → «риск обнуления»
  - «де-рейтинг» → «снижение мультипликатора»
  - «левериджированный опцион» → «закредитованная ставка»
  - «ковенант» → «условие по кредиту»
  - «ЦОД» → «дата-центр»; «якорный покупатель» → say plainly
  - Don't cite a single perma-bear as the source (e.g. Michael Burry) — attribute to "скептики"/analysts and back with a real data point.
- Every number needs a source or is labeled `оценка`. Prefer numbers already in the node's data.
- Separate industry quality from stock quality: the question is never "is the company great?" but "does the market over/under-estimate it?"
- **Cross-link liberally** with `[[nodeId|label]]` to tie sectors together (e.g. packaging → [[hbm]], [[litho]]).

---

## 6. Real photos (client wants them, real only)
- Use the `{k:"image", src, caption, credit}` element.
- **Only real photos from Wikimedia Commons** (stable, hotlinkable, free-licensed). NEVER
  AI-generated / DALL·E images. NEVER fabricate a URL.
- Client preference: **NO people, the actual tech, ideally in-situ in a data center**, and
  grander/nicer if possible (free grand ones are scarce — skip rather than use a wrong one).
- Workflow: WebSearch/WebFetch the Commons **File:** page (not the category — category thumb
  paths are unreliable) to get the exact `upload.wikimedia.org/.../File.jpg` URL, then use the
  thumbnail form `.../thumb/x/xx/File.jpg/1280px-File.jpg`, and **verify with `curl -sI`
  (expect HTTP 200 + content-type image/*)** before adding. Credit the author + license.

---

## 7. Workflow to build one node (token-efficient)
1. **Never read the whole `dc-details.json`** (~12k lines). Pull only the target node's fields
   with a small python one-liner (marketSizing, competition, valueCapture, unitEconomics,
   demand, expectations, scenarios, picks, intro) and print truncated.
2. Draft the thesis (bigIdea + stream + picks) applying §2–§5.
3. **Write via python** `json.load` / `json.dump(..., ensure_ascii=False, indent=2)` — never
   hand-edit the giant JSON.
4. Run a quick regex scan for banned terms before finishing.
5. `npm run build` — must pass.
6. Deploy: **stage ONLY `src/data/dc-details.json` + `src/components/research/dc/Roadmap.jsx`**,
   commit (terse message), `git push origin main` (auto-deploys to Vercel). Do NOT commit the
   unrelated working-tree files (`PortfolioDeep.jsx`, holdings portfolio JSONs).

---

## 7.5 THE CRAFT — how we actually write a good thesis block (the secrets)
This is the part that makes it good vs generic. Read this before writing a single line.

### A. The big idea is an ARGUMENT in one sentence, not a summary
Formula: **[what the market thinks/does] — BUT [the real situation] — BECAUSE [the mechanism] — SO [the call].**
It must contain the tension, the mechanism (why), and the actionable conclusion. Zero unexplained jargon.
- Good (HBM): "Рынок оценивает HBM как обычную циклическую память, которая вот-вот обвалится. Но HBM тихо отвязался от цикла: он распродан на годы вперёд по предоплаченным контрактам, а ограничение — не пластины, а брак. Поэтому цена и маржа держатся дольше, чем закладывает рынок."
- Good (labs): "AI-лаборатории — вершина цепочки… и при этом, возможно, худшее место для инвестиций: сверху зажимает Nvidia, снизу — бесплатные открытые модели, никто не прибылен… Играть тему стоит через смежные акции."
Bad = "HBM is a large fast-growing market with strong players." (no tension, no call).

### B. The core move: the market takes a TRUE fact and draws a WRONG conclusion
Almost every thesis is: **accept the true fact the market sees, then expose the wrong
conclusion it drew, then name where the value actually goes.**
- "Content grows 17x" (true) → "so everyone in the layer wins" (wrong) → value disperses; own the broad incumbents. (wbg)
- "Packaging is the real bottleneck" (true) → "so buy the packaging names" (wrong) → the hyped OSATs are the low-margin layer; own TSMC/equipment. (pkg)
- "Labs are the next platform" (true) → "so 20–150× revenue is fine" (wrong) → they're loss-making on a melting moat; own the adjacency. (lab)

### C. Thesis-shape catalog (reuse, adapt — don't invent bland ones)
1. **Misread threat** — market fears AI/disruption; it actually deepens the moat (EDA).
2. **Wrong debate, mispriced winner** — everyone debates X-vs-Y; one name wins either way and is cheap (asic → Broadcom).
3. **Priced as X, actually Y** — priced as a cycle but it decoupled / it's a monopoly (HBM, litho).
4. **Real bottleneck, wrong layer** — the constraint is real but over-rewarded in the contestable layer; the true scarce input is underpriced (pkg → TSMC/Besi not OSATs; transformers → GOES not the OEM; wbg → incumbents not single-socket).
5. **Two markets, opposite prices** — equity vs credit disagree violently about the same company (rack → CDS ~50% default vs equity Buy).
6. **Two businesses in one** — a cyclical piece + a durable annuity, priced as one (gasturbines → equipment vs 20-yr LTSA).
7. **The apex is the worst investment; own the adjacency / picks-and-shovels** (lab → Alphabet/Oracle; and generally: value accrues to Nvidia + the compute suppliers, not the layer everyone watches).

### D. Section-by-section craft (what each move is FOR)
- **Hook** — open with the single most striking number that frames everything, then one sentence on why it matters. ("63% стоимости AI-чипа — это память, а сам вычислительный кристалл — ~13%." / "Дефицитнее чипов оказалось само железо сети.") It should make the reader go "huh."
- **Tech** — explain the MECHANISM concretely (a systolic array streams matrix math without hitting memory; a transformer chops current thousands of times/sec; CoWoS joins the die + HBM stacks on a silicon interposer). This earns trust and sets up WHY the moat exists. Minimal vendor names. Gloss every term inline.
- **Value capture (margin-by-layer bars)** — the reveal engine. Always ask "who KEEPS the margin?" and contrast it with who gets the attention. This is where "the money isn't where you're looking" lands.
- **Consensus** — state the market's belief fairly and with specifics (the multiple, the price move, the backlog). The more concretely you state it, the harder the variant hits.
- **Variant** — pivot with a signpost ("Но вот что рынок упускает" / "Почему рынок перестарался"). Give 2–3 concrete cracks, each a data point, then the reframe (how to own it instead).
- **Priced-in** — translate the thesis into valuation: what growth the price implies, and the specific right way to own it (which names / which layer).
- **Future/capital** — the priority block (§3).
- **Итог** — compress the whole argument + the one-line call (§4).

### E. Data usage — the real secret
- **Every number must PROVE a claim, not decorate.** If a number doesn't change the argument, cut it.
- **The stat-card `n` (note) carries the "so what."** `{v:"~24x", l:"forward P/E Synopsys", n:"впервые лидер EDA стоит не как лидер"}`. The `v` is the fact, the `n` is why it matters.
- **Stat rows come in threes.** Three tight cards read as one point.
- **Contrast numbers ARE the argument** — put the two opposing figures next to each other: "83–89% маржа обслуживания vs −122% сводная", "content 17x ↑ but share of chip cost 19%→15% ↓", "equity Buy ~$142 vs CDS ~50% default".
- **Use the same fact twice from different angles** to build the case.
- Prefer numbers already in the node data; label anything else `оценка`.

### F. Concreteness = credibility
Name the company, the exact $, and the mechanism. "Nvidia забирает ~41,5¢ с каждого доллара на железо." "Talen–Amazon: 17 лет на $18 млрд." "GOES = 50–55% стоимости трансформатора, один поставщик в США." Vague = worthless.

### G. Decisiveness (one call, not a survey)
End with a verdict: "X — дорого; Y — справедливо; Z — недооценённый опцион." Picks split into
**leaders (own this)** vs **emerging/risk (priced for perfection / venture)**. Tell the reader
who to own and why — never a balanced "on the one hand."

### H. Voice
Confident, plain, a little contrarian. Short punchy sentences at the reveal:
"Деньги ходят по кругу." · "Это не «выиграют все»." · "Рынок продал качество по цене риска." ·
"Это не одна ростовая компания, а две." Use rhetorical setups: "И вот что рынок упускает." /
"И вот в чём аномалия." Never academic, never hedged.

### I. Flow — each section sets up the next
The tech section ends pointing at the moat; the value-capture ends showing the mispriced layer;
the consensus ends stating the belief the variant will demolish; the variant ends with the
reframe the priced-in section acts on. The reader should be pulled forward, never encounter a
block that could be deleted without loss.

### J. Common failure modes to check against
- Big idea has jargon or is a bland summary → rewrite as an argument (§A).
- Sections are self-contained facts, not a chain → add setups/payoffs (§I).
- Numbers sit there without a "so what" → move the point into the `n` field (§E).
- "Everyone wins" conclusion with no variant → find the wrong conclusion (§B).
- Balanced/hedged ending → make one decisive call (§G).
- Future block is a thin paragraph → expand it (§3).
- Closing block repeats "where it heads" → make it a summary (§4).
- Any banned term / unexplained acronym → §5.

---

## 8. Progress
**Done (thesis mode, 12):** eda, asic, hbm, litho, pkg, netsilicon, wbg, rack, power,
transformers, gasturbines, lab.

**Remaining (still block format, 10):** dram, nand, inference, pcb, photonics, fabric,
transceivers, darkfiber, fiber, server.

**Also available:** a copyable **research prompt** (RU, thesis-first, with a DATA APPENDIX
requirement) the client runs per sector and pastes back; the assistant ingests the
BIG IDEA + MEMO + DATA APPENDIX + NAMES into the node's `thesis`. The `power` node was built
this way from an external research `.md`.
