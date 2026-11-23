# Filings agent — 2026-W48

## What moved
One confirmation this week, no independent discoveries beyond what the five
class agents already have on file.

**Altimeter's reported ~$3B new-fund raise (vc candidate) — partially upgraded
to verified.** Bloomberg (via secondary outlets) reported Altimeter "seeking"
a combined ~$3B across a $2.5B late-stage pre-IPO fund and an $800-900M
early-stage fund, sourced to "securities filings + a person familiar." EDGAR
company search across all ~57 "Altimeter"-named filers turned up **Altimeter
Premier Growth IX, L.P.** (CIK 0002151688), which filed a Form D on
2026-11-09 — the same day as the Bloomberg report — with a total offering
amount of exactly **$2,500,000,000**. That is a primary-source match for the
late-stage leg: re-emitted as `verified`, `source_tier=1`. The early-stage
~$800-900M leg does **not** have a matching EDGAR vehicle yet — checked every
recently-registered Altimeter fund (Growth Olympic Fund IX: $29.75M;
Catskill Fund II: $20M; Venture Partners Fund VIII: filed March, too early) —
none fits. That half stays a candidate until a matching Form D turns up.

## What did not confirm (checked, stayed as-is)
- **Sequoia / Sequence Holdings** — no Form D, 13D/G, or any EDGAR filing
  names Sequoia alongside Sequence Holdings. EDGAR full-text search for
  "Sequence Holdings" returns only Baldwin Insurance Group's own 8-Ks/proxy
  material (the unrelated, separately-disclosed $7.7B take-private that
  Sequence + DFO Management are doing) and an unrelated broker-dealer
  ("Sequence Financial Specialists LLC"). Stays `candidate`.
- **Elad Gil / Hone** — no Form D for the company. EDGAR company search for
  "Hone" surfaces only an unrelated, pre-existing "Hone Group Inc." (Encinitas,
  CA; filings since 2019 with nothing since 2022) — not the 2026 AI-agents
  startup. No related-persons listing names Gil. Stays `candidate`.
- **Elad Gil / Lumaril** — no EDGAR entity named "Lumaril" exists at all yet.
  Stays `candidate`.
- **Helion / Vertical Semiconductor CHIPS LOIs** — still letters of intent;
  no Commerce/NIST finalization notice (the pattern Commerce used for I-Pulse
  and Atom Computing) has been issued for either company as of this run.
  Both stay `candidate`.
- **Amazon / Decart AI** — Amazon's only 8-K in the lookback window is its
  routine Q3 earnings release (2026-10-29); no mention of Decart, no Item 1.01/2.01
  acquisition filing. A same-named "Decart Ventures SPV" Form D exists on
  EDGAR but is an unrelated, $600K retail SPV with a first-sale date of
  2025-10-23 (over a year old, a different/smaller transaction) — not cited.
  Stays `candidate`.

## Discovery sweep
Ran `engine.edgar sweep` plus manual 8-K review for the 12 key-tier entities
with known CIKs (BlackRock, Blackstone, Brookfield, DigitalBridge, Goldman
Sachs, SoftBank, Alphabet, Amazon, Meta, Microsoft, NVIDIA, Oracle) over the
trailing 45 days — 31 new filing leads. Opened a representative sample across
every entity with a Nov filing (Oracle, Goldman, Meta, NVIDIA x2, KKR,
Alphabet, Microsoft x2, Blackstone, Brookfield, BlackRock, Blue Owl): all were
routine — quarterly earnings 8-Ks, debt note offerings, a proxy-vote 8-K, and
board-departure 8-Ks. None disclosed a new, un-filed capital-allocation event.
This is a clean read: the five class agents already have this week's real
signal (Anthropic IPO private placement, the $44B SpaceX GPU financing,
Brookfield's infra fund) on file; the filings sweep found nothing they missed.

## Watch next week
- Re-check EDGAR for a Hone / Lumaril Form D (both rounds are recent enough
  that a late Form D is plausible) and for an Altimeter vehicle matching the
  ~$800-900M early-stage leg.
- Re-check Commerce/NIST for Helion and Vertical Semiconductor finalization
  notices — Atom Computing's LOI-to-award conversion took about 3-4 weeks, so
  this batch (LOI signed 2026-10-22) could finalize in the next 1-2 weeks.
- Re-check Amazon for an Item 1.01/2.01 8-K on Decart as re:Invent (2026-11-30)
  approaches, per the unresolved "nearing close" chatter the vc/corporate
  agents flagged.
