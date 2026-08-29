# Untranslated sections — audit + progress log

Started 2026-08-29. Goal: EN mode must not show Russian prose.

## The blind spot that started this
`npm run i18n:check` walks only 4 modules — `nvidiaEcosystem.js`,
`aiEcosystemNetwork.js`, `capitalMap.js`, `fundTracker.js`. Everything else —
the raw JSONs the components import directly, plus hardcoded JSX copy — was
never gated. That is where the reported gaps live.

## Census of Russian-only data (Cyrillic strings with no `{ru,en}` pair)

| file | ru strings | status |
|---|---|---|
| `src/data/dc-details.json` | 8585 | **DONE** — see below |
| `src/data/holdings-v2/**` | 12,780 live | not started |
| `src/data/holdings.json` | 2788 | not started |
| `src/data/yc-*.json` | ~695 | not started |
| `src/data/proxy-*.json` | ~320 | not started |
| `src/data/dc-companies.json` + `dc-company-profiles.json` | 428 | not started |

`capitalMapRu.json` (765) is the Russian sidecar for the English-canonical
capital map, working as designed. `nvidiaEcosystem.json` (1485) is the frozen
v2 payload, not rendered by any component today. Neither is a gap.
`holdings-v2` has a further 3,307 strings in `_`-prefixed archive files that
the `import.meta.glob` calls in `HoldingsV2.jsx` never load.

## Mechanism shipped

`src/data/dc-details.en.json` is a FLAT, PATH-KEYED sidecar:

```json
{ "hbm.thesis.stream.3.t": "What HBM is, and why nothing works without it" }
```

`Roadmap.jsx` overlays it at read time (`overlayEn` → `dcDetails()`), merged
once and lazily because the payload is ~2 MB. A path the sidecar has not
reached falls through to Russian, so a partial sidecar degrades to "some
Russian left" rather than blanking a page.

Path-keyed rather than a mirrored object tree on purpose: mirroring meant
re-typing every wrapper object and array index to reach one sentence.

Two scripts:

```bash
node scripts/dc_en_status.mjs            # per-node coverage
node scripts/dc_en_status.mjs pkg        # untranslated paths of one node
node scripts/dc_en_merge.mjs patch.json  # lock-protected merge (see below)
```

`dc_en_merge.mjs` exists because two sessions worked this file concurrently.
It re-reads at write time, merges under a mkdir lock, writes tmp+rename, and
aborts on three conditions: a path that is not a real gap, a key that already
holds a *different* value, and a value that is empty or still Cyrillic.

## Conventions

**Inline links.** Prose carries `[[node|label|hint]]`. The node id must stay
byte-identical; label and hint are display text. **One hint per node id,
frozen across every section that links to it** — otherwise the same link reads
differently in two places. The fifteen in use:

```
asic          | earns on every chip          nuc           | already built, licensed and connected
eda           | impossible to route around   pkg           | became the main event
gasturbines   | the fastest route            power         | not generation, but connection
hbm           | decoupled from the cycle     rack          | borrows to buy GPUs
inference     | bound by memory, not compute renewables    | no longer in the panel
litho         | impossible to replicate      silicon       | a platform, not a chip
test          | hardware and software        transceivers  | optical transceiver
transformers  | the steel inside it
```

Two kinds, and the difference decides how to handle a mismatch. A **faithful**
hint (`nuc`, `silicon`, `transformers`, `inference`) is a lift of a sentence
the destination actually states — keep it, and make sure that sentence
survives translation intact so the reader lands on it. A **stable-only** hint
(`power`, `renewables`) compresses a section the destination never states in
those words — keep it stable and resolve any mismatch in the destination's
prose, never in the hint. Two-segment links (`[[server|server]]`) stay
two-segment; adding a hint the Russian never had changes what renders.

**Numbers.** Decimal comma → point. `млрд`/`трлн`/`млн` → `B`/`T`/`M`.
`2 кв. 2026` → `Q2 2026`. `~130 тыс./мес` → `~130k/month`. `/yr` not `/year`.
`y/y` in compact metric fields, "year on year" in prose. `bps` with a space.
Ellipsis kept in numeric ranges (`+12…+16%/yr`) — a dash there would collide
with the en dash inside the range. Guillemets «» preserved.

**Half-English source.** Many fields were already RU/EN code-switched
(`"Cleanest balance sheet в neocloud space"`). Those get rewritten as clean
English, not patched word by word. `rack`, `transceivers`, `pcb`, `darkfiber`
and `fabric` were the worst.

## Progress — DC deep-dives

```
· server            0/335    0%
✓ pkg             463/463  100%
✓ asic            448/448  100%
✓ litho           440/440  100%
✓ rack            411/411  100%
✓ photonics       405/405  100%
✓ dram            389/389  100%
✓ lab             386/386  100%
✓ eda             374/374  100%
✓ wbg             374/374  100%
✓ transformers    365/365  100%
✓ hbm             349/349  100%
✓ nand            348/348  100%
✓ inference       346/346  100%
✓ netsilicon      319/319  100%
✓ pcb             314/314  100%
✓ darkfiber       308/308  100%
✓ fiber           299/299  100%
✓ gasturbines     246/246  100%
✓ power           239/239  100%
✓ smr             220/220  100%
✓ fabric          215/215  100%
✓ nuc             210/210  100%
✓ transceivers    187/187  100%
✓ renewables      181/181  100%
✓ silicon         163/163  100%
✓ ip              162/162  100%
✓ test             89/89   100%

  8250/8585 (96%) переведено
```

## KNOWN TOOLING BLIND SPOT — affects the Russian side

`dc_en_status.mjs` flags only strings containing Cyrillic, on the reasoning
that a ticker or a company name is not a translation gap. That rule has a
hole: **115 fields in `dc-details.json` are already full English prose with no
Russian at all.** They are invisible to the audit, were never translated, and
render as English in BOTH languages.

```
fabric.competition.players.3.edge   "Silicon One + Acacia + broadest portfolio; 3+ yr lock-in; cheapest leader"
netsilicon.risks.5.risk             "NVIDIA Ethernet dominance (#1 by IDC)"
wbg.risks.3.note                    "MPS ~50x forward; Vicor +179% YTD; Navitas +780%. Priced for perfection"
```

Note the direction: since the Russian file is canonical and the sidecar only
applies in EN mode, these are a **Russian-mode defect**, not an English one.
EN readers see correct English; RU readers see untranslated English. So this
does not affect the original complaint, but it is a real gap in the other
direction and the audit cannot see it.

Find them with:

```bash
node -e 'const f=require("./src/data/dc-details.json"),C=/[А-Яа-яЁё]/,F=/\b(the|and|with|from|that|which|while|for|of|to|in|on|by|as|at)\b/,o=[];(function w(v,p){if(typeof v==="string")return o.push([p,v]);if(Array.isArray(v))return v.forEach((x,i)=>w(x,p+"."+i));if(v&&typeof v=="object")for(const k of Object.keys(v))w(v[k],p?p+"."+k:k)})(f,"");console.log(o.filter(([p,v])=>!C.test(v)&&v.length>30&&F.test(v)&&v.split(" ").length>=6).length)'
```

For `holdings-v2` the durable fix is a second audit pass that flags fields
whose RU and EN sides are byte-identical, rather than only fields carrying
Cyrillic.

## Still to do
1. `holdings-v2/**` and `holdings.json` (~15,570) — needs its own resolver in
   `HoldingsV2.jsx` first; the DC one is local to `Roadmap.jsx`. Note this
   section has a live weekly refresh (`holdings-news-refresh`), so a one-time
   translation reopens unless that step writes both languages.
2. `yc-*`, `proxy-*`, `dc-companies`, `dc-company-profiles` (~1,443).
3. Hardcoded Russian in JSX: `App.jsx:574,592`, `HomeLanding.jsx:288-308`,
   `SupplyChainHome.jsx:154`, `HoldingsHome.jsx:188`, `ResearchLanding.jsx:28`,
   `YCCompanyCard.jsx:184,250`, `YCBatchRanking.jsx:29-33`, `YCLanding.jsx:11`,
   `capitalflow/layout.js:262`, `FundGrid.jsx:116`, `HolderLookup.jsx:59`,
   `EcoLegend.jsx:138`.
4. The 115 English-only fields above — a Russian-side gap.
5. Once a file is fully covered, extend `scripts/i18n_audit.mjs` to gate it,
   or the next engine delivery silently reopens it.
