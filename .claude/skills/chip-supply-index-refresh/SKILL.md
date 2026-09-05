---
name: chip-supply-index-refresh
description: >
  Refresh the Nomura Chip Supply Index (CSI) series on the home landing. Run
  MONTHLY. There is no machine-readable feed — the index is Nomura Global
  Economics' own construction and the full series sits behind the
  subscription-only Nomura Global Research Portal, so each refresh is a
  research pass over Nomura's PUBLIC channels for a newly published reading or
  chart, appended to src/data/chipSupplyIndex.json. Use when: "refresh the chip
  index", "update the Nomura CSI", "the chip shortage chart is stale", or as
  the monthly chip-supply step.
---

# Nomura CSI — monthly refresh

## What this is and the one rule

`src/data/chipSupplyIndex.json` feeds the **Дефицит чипов / Chip shortage**
block on the home landing (`src/components/home/ChipSupplyHome.jsx`). Nothing
upstream fills it: the dashboard is not a subscriber to Nomura Global Research,
and Nomura publishes no API, no CSV and no public series.

**The one rule: never type a number Nomura has not published.** Every point in
the file carries a `p` (provenance) flag, and there are exactly two legal
values:

| flag | means | when to use it |
|---|---|---|
| `published` | Nomura stated this figure in an openly readable source | a Nomura Connects post, a press release, a quoted figure in a news article that attributes it to Nomura |
| `chart_read` | read off a published Nomura chart image | a chart in a public Nomura post, or a chart image reproduced in coverage with Nomura credited |

A month with no public print gets **no point**. An honest gap beats an
interpolated one — the chart simply ends at the last real reading, and `asOf`
stays where it was. This is the same discipline as `holdings-news-refresh`: you
DO use the web, and you never invent a figure, date or URL.

Never estimate a value from adjacent months, from DRAM prices, from lead-time
proxies, or from what the trend "should" be. If you find yourself reasoning
toward a number rather than reading one, stop and add nothing.

## Where to look, in order

1. **Nomura Connects** — <https://www.nomuraconnects.com/> — the firm's public
   research shopfront. Global Economics posts (Asia Economic Monthly, the
   half-year outlooks, technology pieces) sometimes carry the CSI chart. This
   is the closest thing to an official public source; prefer it over anything
   else.
2. **Nomura press releases and Holdings site** — <https://www.nomuraholdings.com/news/>
3. **Coverage that credits Nomura by name** — CNBC, Bloomberg, Reuters, Nikkei,
   and research aggregators. Only usable when the piece attributes the figure
   or the chart to Nomura Global Economics. A secondary write-up that merely
   says "shortages are worsening" is not a reading.
4. **Bank/blog reproductions of the chart** (e.g. the Syz Group blog has run it)
   — acceptable as `chart_read` only when the image is credited to Nomura.

If none of these turn up something newer than the file's `asOf`, the refresh is
a no-op. Say so plainly and change nothing.

## The pass

1. Read the file's `asOf`. Anything you add must be dated **after** it.
2. Search the sources above. Fetch each candidate — do not judge from a search
   snippet.
3. For each genuinely new month:
   - append `{ "d": "YYYY-MM", "v": <number>, "p": "<flag>", "src": "<url>" }`
     to `series`, keeping it in ascending date order;
   - `chart_read` values are recorded to 2 decimals; do not imply more
     precision than a chart image supports.
4. Bump `asOf` to the newest point and `refreshed` to today.
5. If a newly published chart **revises** earlier months (Nomura restates), fix
   those points in place and note the revision in the commit message. Do not
   silently overwrite more than the source shows.
6. `npm run build` — `prebuild` runs `i18n:check` + `i18n:lint`. Never push a
   failing build.
7. Commit: `Chip index: <month> reading <value>` or, for a no-op, no commit.

## What NOT to touch

- `sourceNote` and `provenanceLegend` — they describe the provenance regime and
  only change if Nomura's publishing changes.
- The interpretation copy in `ChipSupplyHome.jsx`. The read-out claims ("highest
  in the series since 2012", "deeper than the 2021 peak") are statements about
  the data — if a new print makes one of them false, fix the copy in the same
  commit, in **both** languages, Russian first.

## If Nomura ever opens the data

If a machine-readable series appears (a CEIC public series, a Nomura data page,
an FRED-style host), this skill is retired and replaced by a fetch script in
`scripts/` — the same way holdings prices are computed rather than researched.
Record the find and stop hand-maintaining the file.
