---
name: holdings-news-refresh
description: >
  Refresh the hand-maintained Holdings news feed. Run WEEKLY. For each of the 9
  holdings in src/data/holdings-v2/, research genuinely NEW public news (dated
  after the holding's newest existing item), grounded in real fetched sources
  only, append it to news[], and bump asOf. Feeds both the full Holdings pages
  and the home-page news feed. Use when: "refresh the holdings news", "update
  the holdings", "the holdings news is stale", or as the weekly holdings step.
---

# Holdings — news refresh (weekly)

## What this is and the one rule

The Holdings section is the ONLY part of the dashboard with no upstream engine —
each holding's `news[]`, `asOf`, and price snapshot are hand-maintained in
`src/data/holdings-v2/<id>.json`. Left alone they go stale (the home-page news
feed and the full Holdings pages both read straight from these files).

**The one rule: every fact must come from a source you actually fetched.** This
skill is the OPPOSITE of `capital-flow-reads` (which is payload-only, no web).
Here you DO use the web — but you never invent a figure, date, deal, or URL. If
research turns up nothing new for a holding, you add nothing and say so. An
honest gap beats a fabricated headline. This matters extra because the dataset
runs on a forward timeline past the model's training cutoff — the only ground
truth is the live web.

## The 9 holdings

`berkshire, blackrock, brookfield, constellation, fairfax, kkr, pershing,
softbank, tpg` — files at `src/data/holdings-v2/<id>.json`. (Underscore-prefixed
files like `_softbank_upgrade.json` are working scraps — ignore them.)

## Steps

1. **See what's stale + get each cutoff:**
   ```bash
   node scripts/holdings_status.mjs
   ```
   Prints, stalest first, each holding's `asOf`, newest news date, and `cutoff`
   (the date you must propose news *after*). Use `--json` for a machine list.

2. **Research per holding — one focused researcher each** (fan out with the Agent
   tool, or loop). Give each: the holding name + ticker + its `cutoff`. Each
   researcher must:
   - WebSearch for developments after the cutoff (earnings, M&A, fund closes,
     dividends/buybacks, big AUM/flow milestones, stakes, leadership, regulatory).
   - WebFetch the credible source for each — company press release / SEC / SEDAR
     filing, or Reuters / Bloomberg / FT / CNBC / Nikkei — to CONFIRM the fact
     and capture the REAL url.
   - Return the 1–4 most material NEW items (strictly after cutoff, up to today),
     as JSON, in the schema below. Zero found → empty list. No invention.

3. **News item schema** (append to the holding's `news[]`, newest first):
   ```json
   {
     "date": "DD.MM.YYYY",
     "type": "news",
     "title": "<concise Russian headline, <=90 chars, key figure ok>",
     "text": "<2-4 Russian sentences, factual, with figures; gloss key finance/English terms in parens on first use — 'активы под управлением (AUM)', 'чистый приток (net inflows)', 'комбинированный коэффициент (combined ratio)'>",
     "url": "<REAL source URL you fetched>",
     "image": null
   }
   ```
   - Required: `date`, `type`, `title`, `text`. Strongly include `url`. `image`
     is optional — leave `null` unless you have a stable image URL (the home feed
     ignores images; the full page shows them when present).
   - `type` renders with distinct styling for exactly four values —
     `news | announcement | dividend | insider` — anything else falls back to
     "news" styling. Pick the closest: earnings/M&A → `news`, buyback/dividend →
     `dividend`, product/fund/partnership → `announcement`, stake add/exit →
     `insider`.
   - Language: Russian, professional register, matching the existing items.

4. **Apply centrally.** Edit each `<id>.json`: insert the new items at the TOP of
   `news[]`, and set `"asOf"` to today (DD.MM.YYYY) for every holding you
   reviewed — even ones with no new item, since "as of today, nothing material"
   is itself a refresh. Dedupe against existing items by date+title. The files
   are 200–400 KB — edit only the `news[` region and the `asOf` line; never read
   or rewrite the whole file.

5. **Prices (optional, separate concern).** `priceChart.current` / `change` are
   coupled to the `points[]` sparkline (change is period-relative to the first
   point). Only touch them if you refresh the whole `points[]` series from a real
   quote source — a lone `current` edit desyncs the chart. Default: leave prices,
   refresh news + asOf only.

6. **Build + deploy:**
   ```bash
   npm run build   # build-gate; do NOT commit if it fails
   git add src/data/holdings-v2 && git commit -m "Holdings: weekly news refresh (<date>)" && git push
   ```
   Vercel auto-deploys on push. The home-page feed and Holdings pages update with
   no code change — they derive from these files at build time.

## Boundaries
- Web-grounded only. Every item carries a real, fetched source URL. No invention.
- Never rewrite existing items or restyle old news — only append new, and bump
  `asOf`. Preserve everything already in the file.
- If a source can't be confirmed, drop the item. Honest gap > fabricated news.
