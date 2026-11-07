# Engine bug — `source_url` sometimes ships an unresolved EDGAR search query

**Paste this into the Capital Flow engine's Claude Code session** (`~/Desktop/Capital Flow`).

## The bug

6 flows in the current delivery ship `source_url` pointed at EDGAR's full-text-
search **JSON API** (`efts.sec.gov/LATEST/search-index?q=...`) instead of a
citation of an actual filing. Clicking it (before a dashboard-side patch) dumped
raw JSON. Worse: it's a **bare keyword search**, not a resolved document — for a
common word like "Cathedral" it returns dozens of unrelated entities (an
unrelated public Canadian oilfield-services company "Cathedral Energy Services
Ltd.", assorted real-estate SPVs, etc.), with no way to tell which — if any — is
the actual counterparty.

All 6 affected flows:

| Flow | Source → Target | Grade | Status |
|---|---|---|---|
| `495c7b92528239a0` | Andreessen Horowitz → Cathedral | C3 | verified_alpha |
| `8c9a41cf1cdbf56a` | Mubadala → Akita 500MW AI data center (Japan) | C4 | candidate |
| `4c95f883e06776b0` | Altimeter → Thrive Holdings | C4 | candidate |
| `cb279d7f31100469` | Founders Fund → P-1 AI | C4 | candidate |
| `68ecc1fd16102310` | Reid Hoffman → Prentis | C4 | candidate |
| `ba18efd3d5bbd41e` | Korea Investment Corporation → KIC strategic investment account | C4 | candidate |

**The pattern:** every one of these is graded **C-something** (per your own
`GRADE_LETTER`/`GRADE_DIGIT` scale — "качественная пресса" / press-level, never a
primary SEC filing) and `status` is `verified_alpha` or `candidate`, never
`verified`. That tracks — the real evidence behind these deals is press coverage
(e.g. the Cathedral raise is sourced from TNW/NewsNation coverage of the a16z/
Sequoia round), and the EDGAR search link reads like a speculative "maybe also
check EDGAR" add-on rather than a citation that was actually opened and resolved
to a specific accession number.

## Ask

For any flow where the real evidence is press, not a filing: **cite the press
article's URL** (which you already have — see `source_url`/`sources[]` on
higher-grade flows) instead of an EDGAR search query. Only attach an EDGAR link
when you've resolved it to one specific filing — i.e. the URL should point at
`sec.gov/Archives/edgar/data/<CIK>/<accession>/<primary_doc>` (a specific
document), never `efts.sec.gov/LATEST/search-index?...` (a query). If a Form D
search was run to corroborate but didn't clearly resolve to the counterparty
(e.g. a stealth startup that may file under a different legal entity name),
that's worth a `note`/`provisional: true` rather than a link that looks
authoritative but isn't.

## Dashboard-side mitigation (already shipped, not a substitute for the above)

`src/components/research/capitalflow/format.js` → `humanizeSourceUrl()` rewrites
any `efts.sec.gov/LATEST/search-index?...` URL to the human EDGAR Full Text
Search UI (`sec.gov/edgar/search/#/...`) with the same query, so clicking it no
longer dumps raw JSON. That only fixes the *presentation* — it still lands on an
unresolved, noisy search rather than the actual source. The real fix is
resolving (or re-sourcing) these 6 citations engine-side.
