# VC agent — 2026-W48 summary

## What moved this week
Seven rows filed across five of the seven watchlist firms (Sequoia, Thrive Capital,
Founders Fund, Khosla Ventures, Altimeter) plus a16z; no new disclosed Coatue event
this window. Six rows verified/verified_alpha, two filed as candidate after running
the escalation loop rather than dropped.

1. **Sequoia resets the firm, raises ~$10B.** On 2026-11-04 Sequoia posted an
   official memo ("The Sequoia of Tomorrow") to its own X account saying it has
   raised roughly $10 billion in new funds while closing its London office and
   ending the Arc accelerator and Scouts program — a genuine fund_launch, Tier 1
   (own statement), reproduced in full by TechCrunch. No breakdown by vehicle or
   AI-specific carve-out was disclosed.

2. **AI-buildout mega-rounds cluster in one week, Nov 11–18.** Three separate
   priced rounds landed almost on top of each other, each with 2+ watchlist firms
   or heavy co-investor overlap:
   - **Fractile** (UK AI inference-chip startup) closed a ~$720M Series C
     (~$7B valuation) co-led by **Thrive Capital** and **Founders Fund** together
     with Lightspeed and Redpoint — filed as one row per watchlist co-lead per the
     sector_swarm convention.
   - **Genesis AI** (robot foundation models) closed a $500M Series A co-led by
     **Khosla Ventures**, Premji Invest and Eclipse at a reported $3.5B valuation.
   - **Edelbyte** (AI-agent data/analytics infra) exited stealth with a combined
     $70M seed+Series A led by **Sequoia** and Quiet Capital.
   - **Boltz** (biomolecular foundation models) closed a $110M Series A led by
     Bessemer, with **a16z** following on from its own Jan-2026 seed co-lead —
     confirmed directly off a16z's own portfolio/announcement page (Tier 1).

3. **Altimeter's Anthropic exposure is the biggest dollar figure, but the softest.**
   Brad Gerstner told CNBC on 2026-11-16 that Altimeter is "aiming to invest" ~$5B
   in Anthropic's IPO — 5x his largest-ever IPO order. Anthropic priced that IPO on
   2026-11-18 at $83/share (above range), raising ~$81.3B at a ~$1.5T valuation and
   began trading on Nasdaq as ANT on 2026-11-19 — the largest IPO on record. Final
   share allocation to Altimeter was never confirmed (Gerstner himself said the
   order was multiples oversubscribed), so the row is filed verified_alpha with
   amount_estimated=1. A separate $26B private placement went to seven corporates
   (Nvidia, Microsoft, Google, AMD, Broadcom, Micron, TSMC) — out of scope for this
   agent's class.

## Filed as candidate, not dropped
- **Sequoia / Sequence Holdings** — The Information reported Sequoia is "set to
  invest" in Sequence, the AI-driven holding company (with Dell Family Office)
  taking The Baldwin Group private in an unrelated, already-public $7.7B deal.
  Single paywalled source, no amount/date/structure disclosed, and the
  secondary write-up covering it explicitly couldn't tell whether the investment
  is in Sequence itself or in the Baldwin transaction. Checked the Baldwin deal's
  own law-firm announcements and ~15 insurance-trade outlets — none name Sequoia.
- **Altimeter / new venture vehicles** — Bloomberg reported 2026-11-09 (citing
  filings) that Altimeter is seeking ~$2.5B for a late-stage pre-IPO fund plus
  $800–900M for an early-stage fund. Every other outlet is downstream of the same
  Bloomberg story (circular-reporting guard => one source), and the raise is still
  "targeting," not confirmed closed — unlike Sequoia's $10B, which Sequoia's own
  memo says has already landed.

## Discovered allocators
Three non-watchlist firms turned up co-leading watchlist rounds at meaningful
scale this week: **Lightspeed Venture Partners** and **Redpoint** (co-led
Fractile's $720M round with Thrive/Founders Fund), **Premji Invest** (co-led
Genesis AI's $500M round with Khosla), and **Quiet Capital** (co-led Edelbyte's
$70M round with Sequoia). Lightspeed in particular keeps recurring across
AI-infra mega-rounds this quarter and may be worth promoting to the watchlist.
Filed in `discovered_allocators.csv`.

## What to watch next week
- Fractile, Genesis AI and Edelbyte per-allocator check sizes were never
  disclosed — watch for S-1/Form D amendments or later secondary reporting that
  splits the round.
- Altimeter's actual Anthropic-IPO fill (vs. the $5B order) and whether its new
  $2.5B/$800–900M funds get a primary confirmation or close.
- Whether Sequoia's reported Sequence Holdings investment firms up with a second
  independent source or a filing.
- Coatue had no new disclosed event this window — its last confirmed moves were
  the May 2026 Anthropic Series H and the Sept 2026 Instinct round, both stale;
  worth a fresh portfolio-page check next run.
