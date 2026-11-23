# Alt-Managers — Week 2026-W48 Summary

## What moved this week
A quieter week for brand-new deals but one major upsize and two fresh fund/platform
disclosures. All nine watchlist names (SoftBank, Blackstone, BlackRock/GIP, DigitalBridge,
Brookfield, KKR, Blue Owl, Apollo, Goldman Sachs) were swept via EDGAR 8-K filings
(none yielded a capital-allocation event beyond routine debt issuance, earnings, dividends,
and a board appointment) and via targeted web/IR searches. Three real events cleared the
bar; everything else checked was either outside the ~30-day window, an AUM/fundraising
headline with no discrete deal, or a non-binding product partnership.

## Biggest signals

1. **Apollo/Goldman Sachs SpaceX GPU financing upsized and priced at $44B (2026-11-20)** —
   The ~$40B binding master-lease commitment first disclosed 2026-10-24/26 (on file from
   run W45 for Apollo, BlackRock, Goldman Sachs Asset Management, and KKR-advised accounts)
   was oversubscribed and upsized: Apollo and Goldman Sachs priced ~$44B of senior and
   subordinated notes funding NVIDIA Vera Rubin chips for SpaceX's terrestrial compute
   buildout. Same four-way syndicate (Apollo/Goldman Sachs co-leads, BlackRock + KKR-advised
   accounts as anchors). Filed as four updated rows (one per allocator) at the new $44B
   total, explicitly noted as superseding the W45 $40B rows so downstream ingest merges
   forward rather than double-counting. Source: Apollo's own IR press release, corroborated
   independently by marketsmedia.com, cryptobriefing.com and Apollo's own X post.

2. **Brookfield Infrastructure Fund VI — $26B committed toward a $30B target, first close
   "in the coming weeks" (disclosed 2026-11-06)** — Buried in Brookfield's Q3 2026 earnings
   release (SEC 8-K Exhibit 99.1): "$26 billion committed to our flagship infrastructure
   strategy to date... we received $13 billion of additional commitments." This is
   Brookfield's sixth flagship core-plus infra fund (trade press calls it "Fund VI";
   Brookfield's own release doesn't use that name), targeting $30B by early 2027 versus the
   predecessor's $28B final close (Dec 2023). $26B is actual committed capital
   (amount_estimated=0); the $30B is the program target, carried in round_total_usd, not
   amount_usd. Graded verified on Brookfield's own Tier-1 disclosure, corroborated by
   infrastructureinvestor.com and irei.com third-party coverage of the same release.

3. **SoftBank-Grab-PETROS $1.85B Malaysia AI-infrastructure JV (signed 2026-11-09)** —
   SoftBank Group, Grab Holdings and Petroleum Sarawak Berhad (PETROS) signed joint
   development agreements for AI compute buildout in Sarawak and Peninsular Malaysia,
   targeting 5GW+ long-term capacity. Per Grab's own press release (counterparty
   disclosure, Tier 1): SoftBank commits $800M to the Sarawak leg + $200M to Peninsular
   Malaysia = $1.0B of the $1.85B three-party total. Capital is staged/conditional on
   development and customer milestones, so amount_estimated=1. A $50B figure cited by
   Malaysia's PM is unconfirmed by SoftBank and not used. Grab and PETROS are new,
   untracked co-investors — logged to discovered_allocators.csv.

## Coverage gap flagged (not filed — outside this run's window)
Brookfield's own Q3 earnings release also referenced, as already-closed background: the
$16B Kuwait Oil Company pipeline lease JV with Blackstone and KKR (signed 2026-07-25,
each holding ~1/3 of a combined 49% stake) and the $7B Aypa Power battery-storage
acquisition from Blackstone Energy Transition Partners (agreed 2026-07-22). Both predate
this run's ~30-day window and — per `engine.edgar exists` — are **not currently on file**
for any of Brookfield/Blackstone/KKR. Worth a deliberate backfill pass given their size;
not filed here to stay within this run's scope.

## Checked, no new row
- SEC EDGAR 8-K sweep (since 2026-10-24) for all nine watchlist names: Blackstone ($1.1B
  senior notes, routine corporate debt — not capital allocation into a target), KKR (Q3
  earnings furnished, an IR-site Reg FD posting, and a board appointment), Blue Owl (Q3
  earnings + routine dividend), Goldman Sachs (preferred-stock Certificate of Elimination),
  Brookfield (the Q3 earnings release covered above). None yielded a discrete new deal.
- Apollo's own IR press-release list (Oct 24–Nov 23): "Launch of European Credit Company"
  (Nov 2, >€10B lending capacity) — real fund launch but pure European corporate/ABL
  credit with no AI/infra/datacenter nexus, out of this engine's thematic scope, not filed.
  "Victory Capital and Apollo... Strategic Private Markets Collaboration" (Nov 16) — a
  distribution/interval-fund partnership contingent on SEC registration, no capital
  committed yet — not an event per CONTEXT.md scope.
- SoftBank Q2 FY2026 earnings (Nov 10): a reported further OpenAI tranche figure in
  secondary press conflicts with and likely double-counts the $10B third-tranche row
  already on file from W45 (Oct 1 close) — not re-filed pending a cleaner primary figure.
  The SB Energy/OpenAI Ohio 8GW, 20-year lease (NVIDIA $1.5B into SB Energy) dates to
  August 2026 — outside window, not re-filed.
- Goldman Sachs Asset Management's West Street Infrastructure Partners V — still sitting
  at its June 2026 ~$3B first close (75% of a $4B target); no new close found this run.
- BlackRock/GIP, DigitalBridge, Blue Owl: no new dated (within-window) platform deal,
  financing, or fund close found via targeted search beyond items already on file or
  outside the window (GIP/Aligned Data Centers Oct 2025; DigitalBridge Partners III close
  Nov 2025; Blue Owl/IREN Aug 2026, Nscale Feb 2026, Stack Infrastructure loan undated).

## What to watch next week
- **Brookfield Infrastructure Fund VI first close** — watch for the formal close
  announcement (expected "in the coming weeks" per the Nov 6 release) to upgrade this row
  from a progress disclosure to a closed-fund event with a firm final size.
- **SpaceX $44B financing close** — lease schedules begin on GPU delivery in H1 2027;
  watch for a closing confirmation distinct from this pricing announcement.
- **Malaysia JV definitive agreements** — SoftBank/Grab/PETROS capital is staged behind
  development and hyperscaler-customer milestones; watch for the first milestone-triggered
  drawdown or a named hyperscaler customer.
- Consider a deliberate backfill pass on the Kuwait Oil Co. pipeline JV and Aypa Power
  deal (flagged above) given their size and relevance to three key alt-managers.
