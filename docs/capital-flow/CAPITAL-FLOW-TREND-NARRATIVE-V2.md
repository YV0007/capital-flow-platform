# Engine task — rewrite the trend-writer voice: leads, not recaps

**Paste this into the Capital Flow engine's Claude Code session** (`~/Desktop/Capital Flow`).

## What's wrong right now

Stage A (`agents/trend-writer.md`) is running and populating `narrative` on
every qualifying cluster — that part works. But the voice it ships in is a
**data recap**: a paragraph-long list of who co-led, who participated, valuation
and footprint, sometimes finishing with a sentence about the company's own
stated rationale. The dashboard user has already seen the numbers, the
allocator chips, the sector, the dates — those are all in the card around the
narrative. Rereading them as prose adds nothing.

Verbatim from the dashboard user:

> the trend section has to be more clear and intuitive and informative — right
> now it's more like a summary of data. I would like it to be more of a hint,
> a lead for the user where to look and what importance to point out to them
> about certain trends. they won't be able to do the math themselves and count
> how much flows into this and that and sum up — so we have to do it within
> the summary section.

And, separately, on the specific Hadrian card:

> I still don't understand what the fuck Hadrian does. So I see it's important
> — I don't understand the sector and what exactly they \[do] when I should
> have at least a broad overview and understanding of this in order to
> comprehend and track the trend.

So: the trend card is a **lead** ("look here, this matters because…"), not a
transcript. It has to answer *why should the user care* and *what should they
watch next*, and it has to do so for a reader who does not already know what
the target company is.

## The dashboard now carries part of this itself

To close the immediate readability gap, `DigestView.jsx` now renders — above
the engine's narrative, from data the engine already ships — a **primary
target block**: for each unique `target_id` in the cluster's evidence, the
target's name is a clickable link to its node on the map, followed by a
one-line business gist trimmed from the target's `description`. The subsector
also renders as a coloured chip next to the title. The engine narrative sits
underneath as supporting prose in a dimmer style.

That means your narrative does **not** need to explain what the target
company is, list the co-leads, or restate the round size — the surrounding
card carries all of that. What only you can write is the **thesis**: why this
cluster is worth flagging as a trend at all.

## The new voice — what the narrative must do

Rewrite `agents/trend-writer.md` so every narrative is built from these
questions, in this order:

1. **Why this is a trend, in one clause.** The pattern the cluster embodies —
   a shift in who's funding what, a category re-pricing, a bet on a specific
   scarce resource, a business model migrating from product to
   infrastructure, etc. Not a summary of the deals; the pattern *behind* them.
2. **What is genuinely new or surprising about it.** What does this cluster
   say that the previous window's data didn't? "Two tracked allocators on the
   same cap table" is only interesting if you explain *why that pairing is
   notable*: e.g. these two rarely co-invest, or they are re-upping a bet
   from an earlier stage, or a corporate strategic is showing up next to
   generalist VCs for the first time.
3. **What to watch next.** A concrete, dated or event-linked follow-up. The
   next filing to look for, the next round to expect, the adjacent company
   that would confirm or refute the pattern, the sector metric that will
   move if the thesis is right.

Anything you can only defend by quoting the same numbers the card already
shows — deal count, capital total, co-lead list, valuation, plant footprint,
founder bio — does **not** belong in the narrative. If removing it leaves no
narrative at all, this cluster is not yet a trend and you should ship it with
`narrative: null` + `provisional: true` rather than manufacture prose to fill
the field.

### Length

Two to four sentences. Not one (there has to be room for pattern → surprise →
follow-up); not the current 6–8-sentence recap. The card has a stats row and
an investor chip row already; those are the numbers, not this paragraph.

### Tone

Present-tense analyst voice. No "This round, disclosed on 2026-08-06, was co-led
by…" openings — that clause reads as a press-release rewrite and the date and
co-leads are already on the card. Lead with the pattern; cite specific names
only when they carry the point ("Founders Fund appearing next to Andreessen
Horowitz is unusual because…"). English original — the Russian layer
(`capitalMapRu.json` on the dashboard side) is regenerated per cycle from
whatever you ship.

## Grounded, still

Every claim inside the narrative must be defensible from the same evidence
you are already citing (`evidence[]`, plus the source rows behind those event
ids in `capital.db`). If a specific "why" (e.g. "demand for trusted US
manufacturing capacity outpaces supply") is a company-authored talking point
rather than an independent observation, either cite the observer or drop the
causal frame — never assert an unsourced reason. The confidence discipline
from the current spec stays exactly as it is: `provisional: true` and
`confidence: "low"` for any part of the narrative not directly SQL-provable
from the cluster's evidence.

## Rewrites — before/after, so the pattern is unambiguous

### Current output on the Hadrian cluster (rejected — pure recap)

> Hadrian's $1.37B Series D, disclosed 2026-08-06, is one round rather than
> a repeated pattern — but it put two tracked allocators on the same cap
> table: Andreessen Horowitz and Founders Fund, both participants with
> undisclosed slices, alongside Altimeter, Lux Capital, CapitalG and
> Construct Capital. WCM Investment Management, Washington Harbour Partners,
> Valor Equity Partners, 137 Ventures and Baillie Gifford co-led, with
> JPMorganChase's Strategic Investment Group as anchor co-lead; Apollo,
> T. Rowe Price, Morgan Stanley Wealth Management and 1789 Capital also took
> part. The company's own release puts the valuation at $7.87B and the
> footprint at just under 3M sq ft across four plants — two in Torrance CA,
> plus Mesa AZ and Muscle Shoals AL — with proceeds going to new factories,
> munitions production lines and autonomous systems. The driver Hadrian
> states is capacity, not technology: demand for trusted US manufacturing
> capacity continues to outpace supply.

### What the narrative should look like instead

> A pure-play US defense manufacturer clearing a growth-equity valuation
> normally reserved for AI companies — the pattern is late-stage capital
> treating physical production capacity, not software, as the scarce asset
> in the defense stack. Two allocators the map watches for early-stage bets
> (a16z, Founders Fund) sit alongside anchor growth investors (JPM SIG,
> Baillie Gifford, T. Rowe Price), signalling this is now considered a
> pre-IPO story, not a venture story. Watch whether the next disclosed
> Hadrian round — or a comparable Senra / Anduril extension — prints at
> AI-comp multiples on revenue rather than defense-comp multiples on
> backlog.

Notice what the second version does that the first doesn't: it names the
pattern ("physical production capacity as the scarce asset"), calls out what
is genuinely surprising about the participant mix (early-stage names next to
growth-stage names ⇒ stage transition), and gives the user a specific next
signal to watch (multiple regime on the next round). No dates, no valuation,
no plant list — the card renders those already.

### Current output on the Volta cluster (rejected — same issue)

> Volta Infra Holdings' combined seed and Series A, disclosed on 2026-08-04
> at a $2.4B post-money, brought two tracked allocators onto the same cap
> table: Andreessen Horowitz co-led while NVIDIA participated, alongside
> Azora, Altimeter, the Michael Dell family office and Matter Venture
> Partners… \[continues into a recital of announced program sizes and
> geography]

### What it should look like

> A first-round GPU-cloud getting priced against infrastructure comparables
> ($2.4B post-money on undisclosed revenue) rather than software
> comparables — the thesis, in the founders' own framing, is that compute
> needs to be financed like power or fibre, not sold like a product. The
> tell is the participant mix: an early-stage venture lead (a16z) writing
> alongside a strategic chip supplier (NVIDIA) at seed / Series A, which
> normally only happens after a company has proven demand, not before.
> Watch whether the announced 133 MW Norway site closes project financing
> at infrastructure spreads, and whether other stealth GPU-cloud entrants
> raise at similar multiples on committed MW rather than on ARR.

## No change to schema

`narrative` stays the same field, same location. `title`, `sector`,
`subsector`, `deals`, `capital_usd`, `date_range`, `allocators`, `evidence`,
`confidence`, `provisional` are all correct and should not move. This is
purely a rewrite of the agent prompt and its output style — no engine wiring
changes on the dashboard side.

## Why this feature is worth getting right

The whole point of the trends block is to compress the map for a user who
cannot re-derive the pattern themselves. If the narrative reads as a paragraph
of numbers they already saw, they'll ignore the block and go back to the
graph — which defeats the reason we built this pipeline. A single sentence
that says "this is a stage transition, watch the next round's multiple" is
more valuable than five sentences listing every LP in the round.
