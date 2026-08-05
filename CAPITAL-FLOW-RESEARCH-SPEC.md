# Capital Flow Map — Research Specification (Living Document)

**Status:** ACTIVE. This framework fully replaces the earlier watchlist + 3-signal-tier
spec (2026-08-05). It defines the allocator universe the tracker covers, what to track
per allocator class, launch priorities, and the classification every allocator node
should carry. New decisions get appended here so everything lives in one place.

**Data lives in** `src/data/capitalFlowData.js` · **components in**
`src/components/research/capitalflow/` (see the README there for the data contract).

---

# CAPITAL ALLOCATOR UNIVERSE

The tracker should cover every major class of allocator capable of moving meaningful
capital into an emerging AI theme.

The key question is not whether the allocator is publicly listed or privately owned.

The key questions are:

- How much capital can it deploy?
- How early does it enter a theme?
- Does it invest repeatedly?
- Does its participation attract other investors?
- Can its investment cause a sector to scale?

---

## 1. Hyperscalers and Corporate Balance Sheets

**Priority entities:**

- Microsoft
- Amazon
- Alphabet / Google
- Meta
- Oracle
- NVIDIA
- AMD
- Broadcom
- Intel
- Qualcomm
- Apple
- Salesforce
- TSMC
- Samsung
- SK hynix
- Micron

**Track:**

- Direct investments in private companies
- Corporate venture investments
- Minority stakes
- Acquisitions
- Joint ventures
- Strategic project investments
- New AI-focused subsidiaries
- Capital committed to chips, infrastructure, energy, robotics and scientific AI
- Supplier financing and prepayments
- Dedicated investment vehicles
- Investments made through subsidiaries
- Investments made jointly with sovereign or infrastructure funds

**Why they matter:**

These companies invest to strengthen their ecosystems, secure supply, enter new
markets and influence which technologies become standards.

---

## 2. Large Alternative-Asset Managers

**Priority entities:**

- Brookfield Asset Management
- Blackstone
- BlackRock / Global Infrastructure Partners
- KKR
- Apollo
- Carlyle
- Ares Management
- TPG
- EQT
- CVC
- Warburg Pincus
- General Atlantic
- Silver Lake
- Vista Equity Partners
- Thoma Bravo
- Bain Capital

**Track:**

- Fund launches
- Fund size and dry powder
- Equity investments
- Acquisitions
- Private-credit investments
- Data-centre investments
- Digital-infrastructure investments
- Power and grid investments
- Semiconductor and advanced-manufacturing investments
- AI software acquisitions
- Joint ventures
- Project-level equity
- Follow-on capital
- Co-investment vehicles

**Why they matter:**

These firms control very large pools of private capital and can turn an emerging
technology theme into a large infrastructure or consolidation cycle.

---

## 3. Infrastructure and Real-Asset Investors

**Priority entities:**

- Brookfield Infrastructure
- Blackstone Infrastructure
- BlackRock / GIP
- DigitalBridge
- KKR Infrastructure
- Macquarie Asset Management
- Stonepeak
- I Squared Capital
- Global Infrastructure Partners
- Antin Infrastructure Partners
- Ardian Infrastructure
- Copenhagen Infrastructure Partners
- Partners Group
- IFM Investors

**Track:**

- Data centres
- Fibre networks
- Power generation
- Grid and transmission
- Energy storage
- Nuclear projects
- Gas generation
- Cooling infrastructure
- Semiconductor plants
- Project finance
- Build-to-suit projects
- Platform acquisitions
- New infrastructure funds
- Joint ventures with hyperscalers
- Tenant-backed investments

**Why they matter:**

They show where institutional investors expect durable physical demand and long-term
contracted returns from the AI build-out.

---

## 4. Private-Credit and Structured-Finance Investors

**Priority entities:**

- Apollo
- Ares Management
- Blackstone Credit
- KKR Credit
- Brookfield Credit
- Blue Owl Capital
- Oaktree Capital Management
- Golub Capital
- HPS Investment Partners
- Sixth Street
- Fortress Investment Group
- Cerberus Capital Management

**Track:**

- Project debt
- Asset-backed lending
- GPU-backed financing
- Data-centre loans
- Equipment financing
- Convertible debt
- Private placements
- Rescue financings
- Refinancing
- Preferred equity
- Vendor financing
- Credit funds dedicated to digital infrastructure

**Why they matter:**

Credit often enters after equity investors identify a theme but before the market
reaches full scale. Growth in debt financing can therefore confirm that a sector is
moving from experimentation into infrastructure deployment.

---

## 5. Venture Capital and Early-Stage Funds

**Priority entities:**

- Sequoia Capital
- Andreessen Horowitz
- Founders Fund
- Thrive Capital
- Khosla Ventures
- 8VC
- General Catalyst
- Lightspeed Venture Partners
- Bessemer Venture Partners
- Accel
- Index Ventures
- NEA
- Greylock
- Lux Capital
- DCVC
- Radical Ventures
- Playground Global
- Eclipse Ventures
- Menlo Ventures
- Felicis
- Spark Capital

**Track:**

- New investments
- Lead investments
- Round size and stage
- Follow-on investments
- Board seats
- New dedicated funds
- Repeat bets in one theme
- Co-investor networks
- Investments in several layers of one ecosystem
- Investments in frontier-lab spin-outs
- Deep-tech and scientific-AI investments

**Why they matter:**

They are the earliest institutional signals and can reveal new technical categories
before public-market companies report meaningful revenue from them.

---

## 6. Growth and Crossover Investors

**Priority entities:**

- Coatue
- Altimeter Capital
- Tiger Global
- Greenoaks
- Dragoneer
- D1 Capital
- Whale Rock
- Lone Pine Capital
- T. Rowe Price
- Fidelity
- Wellington Management
- Baillie Gifford
- Durable Capital Partners
- CapitalG

**Track:**

- Late-stage private investments
- Secondary purchases
- Pre-IPO positions
- New public-equity positions
- 13F changes
- Follow-on investments
- Private-to-public transitions
- Valuation paid
- Sector concentration
- Exit activity

**Why they matter:**

These investors connect private-company growth with public-market positioning. Their
activity can indicate which private themes are approaching IPO, acquisition or broader
institutional adoption.

---

## 7. Sovereign Wealth and State-Backed Capital

**Priority entities:**

- MGX
- Mubadala
- Abu Dhabi Investment Authority
- Saudi Public Investment Fund
- Qatar Investment Authority
- GIC
- Temasek
- Kuwait Investment Authority
- Norway Government Pension Fund Global
- Future Fund
- Bpifrance
- Singapore EDB-linked vehicles

**Track:**

- Direct equity investments
- Frontier-lab investments
- Semiconductor projects
- Data-centre projects
- Sovereign-cloud projects
- Robotics and defence
- Power and grid investments
- Joint ventures with hyperscalers
- New national AI funds
- Government guarantees
- Co-investment with private funds
- Geographic capital allocation

**Why they matter:**

Sovereign investors can finance projects too large or strategically sensitive for
ordinary venture capital and can create entire national AI ecosystems.

---

## 8. Corporate Venture Capital

**Priority entities:**

- NVIDIA Ventures / NVentures
- Microsoft M12
- Google Ventures / GV
- CapitalG
- Amazon Alexa Fund and other Amazon vehicles
- Salesforce Ventures
- Intel Capital
- Qualcomm Ventures
- Samsung Ventures
- SK Telecom Ventures
- Bosch Ventures
- Siemens Energy Ventures
- Schneider Electric Ventures / SE Ventures
- Shell Ventures
- Chevron Technology Ventures
- Lockheed Martin Ventures
- RTX Ventures
- Boeing HorizonX

**Track:**

- New portfolio investments
- Strategic fit with parent company
- Follow-on investments
- Commercial agreements linked to investments
- Supplier or customer relationships
- Technology categories receiving repeated capital
- Acquisitions of former portfolio companies
- Co-investments with leading VCs

**Why they matter:**

Corporate venture investments can indicate which external technologies a major company
expects to integrate, acquire or build an ecosystem around.

---

## 9. Family Offices and Billionaire Capital

**Priority allocators:**

- Bezos Expeditions / Jeff Bezos
- Thiel Capital / Peter Thiel
- Schmidt Futures and related Eric Schmidt vehicles
- Sam Altman-linked investment vehicles
- Gates Ventures
- Laurene Powell Jobs / Emerson Collective
- Michael Dell / DFO Management
- Xavier Niel
- Michael Bloomberg-linked vehicles
- Premji Invest
- Soros Fund Management
- Point72 Ventures / Steven Cohen
- Walton family investment vehicles

**Track:**

- Direct investments
- SPVs
- Personal angel investments
- New investment vehicles
- Repeat founder backing
- Follow-on capital
- Co-investments with institutional funds
- Scientific, energy, robotics and defence bets
- Board roles
- Philanthropic capital that may precede commercial investment

**Why they matter:**

Family offices can take longer-duration and less conventional risks than institutional
funds and often enter scientific or infrastructure themes before the economics are
obvious.

---

## 10. Individual Silicon Valley Allocators

**Continuous priority:**

- Peter Thiel
- Marc Andreessen
- Ben Horowitz
- Vinod Khosla
- Josh Kushner
- Elad Gil
- Nat Friedman
- Joe Lonsdale
- Philippe Laffont
- Brad Gerstner
- Masayoshi Son
- Jeff Bezos
- Eric Schmidt
- Reid Hoffman
- Keith Rabois
- Daniel Gross
- Sam Altman
- Patrick Collison
- Garry Tan
- Stanley Druckenmiller

**Track:**

- Exact investment vehicle
- Personal versus fund investment
- New investment
- Lead or passive participation
- Follow-on capital
- Board seat
- Repeat founder
- Theme concentration
- Co-investors
- New SPVs or funds
- Public-equity holdings
- Movement between themes
- Relationship between public thesis and actual capital allocation

**Rule:**

Always distinguish the individual from the associated institution.

Examples:

- Peter Thiel personally
- Thiel Capital
- Founders Fund

&nbsp;

- Marc Andreessen personally
- Andreessen Horowitz
- Individual SPV

&nbsp;

- Jeff Bezos personally
- Bezos Expeditions
- Amazon corporate investment

Do not merge these into one allocator without evidence.

---

## 11. Public-Market Institutional Investors

**Priority entities:**

- Berkshire Hathaway
- Pershing Square
- Duquesne Family Office
- Appaloosa Management
- Soros Fund Management
- Point72
- Citadel
- Millennium Management
- Lone Pine Capital
- Viking Global
- TCI Fund Management
- Elliott Investment Management
- Third Point
- Greenlight Capital
- ARK Investment Management

**Track:**

- 13F positions
- 13D and 13G filings
- New AI-related positions
- Position increases
- Position reductions
- Complete exits
- Concentration
- Activist positions
- Public statements linked to positions

**Why they matter:**

These investors are generally later than venture capital but help confirm when a
private-market theme begins migrating into liquid public equities.

---

## 12. Priority Allocators for the First Version

Do not track every entity equally at launch.

**Tier A — Continuous:**

- Microsoft
- Amazon
- Alphabet
- Meta
- Oracle
- NVIDIA
- Broadcom
- Brookfield
- Blackstone
- BlackRock / GIP
- KKR
- Apollo
- DigitalBridge
- Sequoia
- Andreessen Horowitz
- Founders Fund
- Thrive Capital
- Khosla Ventures
- Coatue
- Altimeter
- SoftBank
- MGX
- Mubadala
- Saudi PIF
- Peter Thiel
- Marc Andreessen
- Vinod Khosla
- Josh Kushner
- Elad Gil
- Nat Friedman
- Joe Lonsdale
- Masayoshi Son
- Jeff Bezos
- Eric Schmidt

**Tier B — Weekly/event-driven:**

- AMD
- TSMC
- Intel
- Qualcomm
- Salesforce
- General Catalyst
- Lightspeed
- Greenoaks
- 8VC
- Tiger Global
- Dragoneer
- GIC
- QIA
- ADIA
- Temasek
- Macquarie
- Stonepeak
- Ares
- Blue Owl
- Silver Lake
- General Atlantic
- TPG
- EQT

**Tier C — Quarterly or when a disclosed transaction occurs:**

- Public hedge funds
- Lower-frequency family offices
- Smaller corporate venture arms
- Individual angels with limited disclosure
- Asset managers whose AI allocations are not material

---

## 13. Final Allocator Classification

Every allocator node should carry:

- Allocator type
- Public or private
- Assets under management
- Estimated deployable capital
- Typical cheque size
- Preferred investment stage
- Geographic focus
- Sector focus
- Equity versus debt preference
- Direct versus fund investing
- Strategic versus financial motivation
- Disclosure quality
- Signal priority
- Associated individuals
- Associated investment vehicles

**Allocator types:**

- Corporate balance sheet
- Corporate venture capital
- Venture capital
- Growth / crossover
- Private equity
- Infrastructure
- Private credit
- Sovereign wealth
- Government strategic fund
- Family office
- Individual investor
- Public-market hedge fund
- Long-only institutional investor

**The key principle:**

The map should not distinguish between "private" and "public" investors as a proxy
for quality.

It should distinguish between:

- Early signal investors
- Large-scale capital providers
- Strategic ecosystem builders
- Infrastructure financiers
- Public-market confirmation investors

Each type provides a different part of the capital-rotation signal.
