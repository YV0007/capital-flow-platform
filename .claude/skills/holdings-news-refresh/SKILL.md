---
name: holdings-news-refresh
description: >
  Refresh the hand-maintained Holdings section — news AND stock prices. Run
  WEEKLY. For each of the 9 holdings in src/data/holdings-v2/, research genuinely
  NEW public news (dated after the holding's newest existing item), grounded in
  real fetched sources only, append it to news[], bump asOf, and refresh every
  priceChart from live quotes via scripts/refresh_prices.mjs. Feeds the full
  Holdings pages and the home-page cards and news feed. Use when: "refresh the
  holdings news", "update the holdings", "update the holdings prices", "the
  holdings news is stale", or as the weekly holdings step.
---

# Holdings — news + price refresh (weekly)

## What this is and the one rule

The Holdings section is the ONLY part of the dashboard with no upstream engine —
each holding's `news[]`, `asOf`, and `priceChart` live in
`src/data/holdings-v2/<id>.json`. Left alone they go stale (the home-page cards
and news feed and the full Holdings pages all read straight from these files).

The two halves are refreshed differently on purpose. **News is researched** —
judgement, sources, prose. **Prices are computed** — `scripts/refresh_prices.mjs`
pulls the real series and rewrites the chart, so no number here is ever typed by
a model.

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
     "title": {
       "ru": "<concise Russian headline, <=90 chars, key figure ok>",
       "en": "<the same headline in English, <=90 chars>"
     },
     "text": {
       "ru": "<2-4 Russian sentences, factual, with figures; gloss key finance/English terms in parens on first use — 'активы под управлением (AUM)', 'чистый приток (net inflows)', 'комбинированный коэффициент (combined ratio)'>",
       "en": "<the same 2-4 sentences in natural English — written as English, not a calque of the Russian; drop the gloss where the English term needs none>"
     },
     "url": "<REAL source URL you fetched>",
     "image": null
   }
   ```

   **`title` and `text` are `{ ru, en }` pairs, and both sides are required.**
   The dashboard is bilingual and `/src/data/holdingsV2.js` is an i18n audit
   target, so an item with no English side fails `npm run build` — deliberately.
   Write both at research time: the researcher has the source open and the
   English is nearly free then, whereas a translation pass afterwards is a
   second job. Figures, dates and proper nouns must be identical in both.
   Older items are still bare strings; `L()` renders those unchanged, so do not
   go back and convert anything you did not touch.
   - Required: `date`, `type`, `title`, `text`. Strongly include `url`. `image`
     is optional — leave `null` unless you have a stable image URL (the home feed
     ignores images; the full page shows them when present).
   - `type` renders with distinct styling for exactly four values —
     `news | announcement | dividend | insider` — anything else falls back to
     "news" styling. Pick the closest: earnings/M&A → `news`, buyback/dividend →
     `dividend`, product/fund/partnership → `announcement`, stake add/exit →
     `insider`.
   - Register: professional in both languages, matching the existing items.

4. **Apply centrally.** Edit each `<id>.json`: insert the new items at the TOP of
   `news[]`, and set `"asOf"` to today (DD.MM.YYYY) for every holding you
   reviewed — even ones with no new item, since "as of today, nothing material"
   is itself a refresh. Dedupe against existing items by date+title. The files
   are 200–400 KB — edit only the `news[` region and the `asOf` line; never read
   or rewrite the whole file.

5. **Prices — always, and by script, never by hand:**
   ```bash
   node scripts/refresh_prices.mjs          # add --dry-run to preview
   ```
   Rewrites `priceChart` in all 9 files from real Yahoo Finance quotes (1-year
   weekly series) and touches nothing else. Run it every week alongside the news.

   Do NOT edit `current`, `change` or `points[]` by hand, and do NOT research
   prices with the web tools. The three are one object — `change` is measured
   from the first weekly close to the price shown, and the chart's last point IS
   that price — so a lone `current` edit silently desyncs all three. The script
   is also the only way the number stays exact: prices are arithmetic over a
   public series, not a research question.

   The script exits non-zero and names any holding whose fetch failed; that
   holding keeps its previous block. Report failures rather than patching the
   number by hand. Symbols are mapped in the script (`SYMBOLS`) — a company with
   several listings is pinned to the one the card has always shown, so the
   figure stays comparable week to week.

   Expect occasional large jumps that are correct: the series is split-adjusted,
   so a stock split shows up as a step change against the old hand-entered
   value. Check the split before assuming the script is wrong.

6. **Build + deploy:**
   ```bash
   npm run build
   git add src/data/holdings-v2 && git commit -m "Holdings: weekly news + price refresh (<date>)" && git push
   ```

   **A red build is not automatically yours.** This step runs minutes after the
   Capital Flow delivery, on whatever state that left behind, so `prebuild` can
   fail for reasons that have nothing to do with your work. Discarding a week of
   research over someone else's breakage is the worse error, so find out whose
   failure it is before deciding:

   ```bash
   git stash --include-untracked && npm run build; git stash pop
   ```

   - **Still fails without your changes** — the tree arrived broken. Your work is
     sound: commit and push it, then report the inherited failure by name so it
     gets fixed at its source. Do NOT throw the refresh away.
   - **Passes without your changes** — the breakage is yours. Fix it, or drop the
     item that caused it. Never commit.

   Vercel auto-deploys on push. The home-page feed and Holdings pages update with
   no code change — they derive from these files at build time.

## Boundaries
- Web-grounded only. Every item carries a real, fetched source URL. No invention.
- Never rewrite existing items or restyle old news — only append new, and bump
  `asOf`. Preserve everything already in the file.
- If a source can't be confirmed, drop the item. Honest gap > fabricated news.
- Prices come from `scripts/refresh_prices.mjs` and nowhere else. A price a model
  typed is a fabricated figure like any other, even when it happens to be right.
