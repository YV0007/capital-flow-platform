# Fix — Russian translation quality, and a style guide for the next pass

**For whichever session next works on `src/data/capitalMapRu.json`** (this
dashboard repo — the translation layer is entirely dashboard-owned, no engine
involvement; `capitalMapRu.json` is a durable side-car the engine never
touches).

## Root cause of the "поколенческого масштаба" problem

Traced precisely: `capitalMapRu.json` was authored in a single commit
(`8a0247b`) with **no governing skill, doc, or style guide** — I searched for
one (`grep -rl capitalMapRu **/*.md`) and found nothing. It was a direct,
ad-hoc translation pass with no instructions constraining *how* to translate,
so English VC idioms got rendered as literal calques instead of natural
Russian — "companies of generational scale" → "компании поколенческого
масштаба", which is grammatically valid but reads as translated-not-written,
exactly the "what is this" reaction it got.

**Already fixed** (3 occurrences, same root phrase): Thrive Capital's
background, Brad Gerstner's thesis, Greenoaks' thesis — all reworded to
natural Russian (e.g. "компании, определяющие своё поколение" instead of the
adjective-calque). Not re-checked exhaustively across all 410 translated
profile fields — this is a spot fix, not a full audit.

## Style guide for the next translation pass

1. **Translate the meaning, not the words.** English business/VC idioms
   ("generational scale", "category-defining", "best-in-class") almost never
   have a natural single-word Russian equivalent — render the *point* being
   made in native Russian phrasing, even if that means restructuring the
   sentence, not substituting each word.
2. **Read it back as a sentence a Russian speaker would actually write**, not
   as a check that every English word has a Russian counterpart. If a phrase
   would make a native speaker ask "what is this," it's a calque — rewrite it.
3. **Prefer verbs over noun-stacking.** Russian handles chained genitive
   nouns ("компании поколенческого масштаба") worse than English handles
   compound adjectives — where the English uses a noun-stack, a Russian verb
   clause ("компании, которые определяют своё поколение") usually reads
   better.
4. **Names, tickers, and fund names stay untranslated** — this rule already
   holds (see `capitalMap.js`'s header comment) and should keep holding.
5. Before shipping a pass, **read a handful of the translated sentences cold**
   (not side-by-side with the English) — if any need a re-read to parse,
   revise them.
