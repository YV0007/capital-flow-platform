// ══════════════════════════════════════════════════════════════════════════
// CAPITAL FLOW MAP — dataset
//
// Source of truth for the Capital Flow Map section. Plain JS so every row can
// carry a comment. Mirrors the research spec ("Capital Flow Map — Research
// Specification"): the ~47-entity watchlist, the 3 signal tiers, plus the
// context entities (projects, individuals, government, acquired assets) that
// the flows need to stay connected.
//
// ⚠️  ALL FIGURES ARE ILLUSTRATIVE AND APPROXIMATE.
//     Assembled from public announcements and press reporting; rows marked
//     `confidence: 'estimate'` are derived from analyst/press estimates, not
//     disclosed numbers. Nothing here is investment advice.
//
// ── HOW TO EXTEND ────────────────────────────────────────────────────────
//   1. Add an entity to ENTITIES (group + tier + watchlist flag).
//   2. Add one row per capital movement to FLOWS.
//   Totals, node sizes, cluster placement, filters, legend counts and the
//   side panel all derive automatically in buildGraph().
// ══════════════════════════════════════════════════════════════════════════

// ── Groups — the cluster regions on the map ──────────────────────────────
// `anchor` is the region's home position in graph coordinates: capital
// sources sit left, capital sinks right, physical world at the bottom.
export const GROUP_META = {
  fund:        { label: 'Funds & Sovereigns',  color: '#E3B34C', anchor: { x: -640, y:  -40 }, blurb: 'Pooled capital — VC, PE, infra, sovereign wealth.' },
  individual:  { label: 'Individuals',         color: '#F472B6', anchor: { x: -600, y: -360 }, blurb: 'People deploying personal capital.' },
  lab:         { label: 'Frontier Labs',       color: '#C084FC', anchor: { x: -130, y: -140 }, blurb: 'Model builders — the biggest capital sinks and committers.' },
  hyperscaler: { label: 'Hyperscalers',        color: '#38BDF8', anchor: { x:  280, y: -300 }, blurb: 'Own the clouds. Buy chips, sell compute.' },
  neocloud:    { label: 'Neoclouds',           color: '#2DD4BF', anchor: { x:  140, y:  150 }, blurb: 'GPU landlords — vendor-financed compute capacity.' },
  silicon:     { label: 'Silicon',             color: '#818CF8', anchor: { x:  620, y: -100 }, blurb: 'Chip designers and the foundry everything funnels into.' },
  equipment:   { label: 'Fab Equipment',       color: '#94A3B8', anchor: { x:  950, y:  140 }, blurb: 'The tools fabs are built from — litho, etch, deposition, packaging.' },
  power:       { label: 'Power & Energy',      color: '#4ADE80', anchor: { x:  480, y:  380 }, blurb: 'Turbines, grid gear, cooling, nuclear — the physical constraint.' },
  project:     { label: 'Projects & DC Assets',color: '#FB923C', anchor: { x: -140, y:  360 }, blurb: 'Physical builds and data-centre operators money lands in.' },
  government:  { label: 'Government',          color: '#34D399', anchor: { x: -480, y:  380 }, blurb: 'State money — grants, loans, direct equity.' },
  defense:     { label: 'Defense',             color: '#F87171', anchor: { x: -840, y: -280 }, blurb: 'Defence tech funded outside the prime-contractor route.' },
};

// ── Signal tiers — the spec's weighting model ────────────────────────────
export const TIER_META = {
  1: { short: 'T1', stars: '★★★★★', label: 'Capital Allocators',  color: '#FBBF24',
       blurb: 'Decide where billions go. Their moves are the strongest predictors of future investment opportunities.' },
  2: { short: 'T2', stars: '★★★★',  label: 'Ecosystem Builders',  color: '#C084FC',
       blurb: 'Create the demand that determines where the allocators spend next.' },
  3: { short: 'T3', stars: '★★★',   label: 'Bottleneck Owners',   color: '#94A3B8',
       blurb: 'Reveal where the physical constraints are moving, often before the market prices them.' },
};

// One colour per deal type. Drives edge colour and the deal-type filter.
export const DEAL_TYPE_META = {
  'Equity':             { color: '#A78BFA', blurb: 'Cash for ownership.' },
  'Compute commitment': { color: '#22D3EE', blurb: 'A contracted promise to buy compute over time.' },
  'Purchase':           { color: '#FB923C', blurb: 'Hardware or equipment bought outright.' },
  'Contract':           { color: '#A3E635', blurb: 'A supply, capacity or offtake agreement.' },
  'Acquisition':        { color: '#F472B6', blurb: 'Buying control of an asset or company.' },
  'Debt':               { color: '#FBBF24', blurb: 'Loans, notes, project finance.' },
  'Partnership':        { color: '#34D399', blurb: 'Joint venture / co-investment vehicle.' },
  'Grant':              { color: '#8B9DB0', blurb: 'Non-dilutive state money or philanthropy.' },
};

// ══════════════════════════════════════════════════════════════════════════
// ENTITIES
//
//   id          unique slug, referenced by FLOWS
//   name        display name
//   type        'player' — deploys capital · 'target' — receives it · 'both'
//   group       key of GROUP_META → cluster region + node colour
//   tier        1 | 2 | 3 | null — signal tier per the research spec.
//               null = context entity, or watchlist entity not yet
//               tier-assigned (AMD, KKR, Altimeter — flagged in the spec).
//   watchlist   true = in the spec's tracked universe; false = context node
//               kept so the flows stay connected.
//   sector      free text
//   description its role in the flow of money, 1–2 sentences
// ══════════════════════════════════════════════════════════════════════════
export const ENTITIES = [
  // ── Hyperscalers — Tier 1 ──────────────────────────────────────────────
  {
    id: 'microsoft', name: 'Microsoft', type: 'both', group: 'hyperscaler', tier: 1, watchlist: true, sector: 'AI',
    description: 'The original OpenAI backer, now also an Anthropic backer. Money goes out as equity, comes back as compute commitments — it funds the labs that then rent Azure.',
  },
  {
    id: 'amazon', name: 'Amazon / AWS', type: 'both', group: 'hyperscaler', tier: 1, watchlist: true, sector: 'AI',
    description: 'Anthropic\'s largest investor and its primary cloud. Invest cash, receive compute spend and Trainium adoption back.',
  },
  {
    id: 'google', name: 'Alphabet / Google', type: 'both', group: 'hyperscaler', tier: 1, watchlist: true, sector: 'AI',
    description: 'Backs Anthropic and SSI while competing with both. Sells its own TPUs into the deals, so its capital partly returns as silicon demand.',
  },
  {
    id: 'meta', name: 'Meta', type: 'player', group: 'hyperscaler', tier: 1, watchlist: true, sector: 'AI',
    description: 'No external lab stake — it buys compute and builds its own campuses, increasingly through off-balance-sheet JVs.',
  },
  {
    id: 'oracle', name: 'Oracle', type: 'both', group: 'hyperscaler', tier: 1, watchlist: true, sector: 'Infrastructure',
    description: 'Sells capacity rather than models. Holds the single largest disclosed compute contract in the market (OpenAI) and is a Stargate equity partner.',
  },

  // ── Frontier labs — Tier 2 ─────────────────────────────────────────────
  {
    id: 'openai', name: 'OpenAI', type: 'both', group: 'lab', tier: 2, watchlist: true, sector: 'AI',
    description: 'The biggest capital sink and one of the biggest committers at once — raises equity and immediately recycles it into multi-year compute contracts.',
  },
  {
    id: 'anthropic', name: 'Anthropic', type: 'both', group: 'lab', tier: 2, watchlist: true, sector: 'AI',
    description: 'Funded by three of its four largest suppliers. Every equity round now arrives attached to a compute commitment flowing back the other way.',
  },
  {
    id: 'xai', name: 'xAI', type: 'both', group: 'lab', tier: 2, watchlist: true, sector: 'AI',
    description: 'Vertically fast rather than capital-efficient: raises, then spends almost immediately on its own Memphis build-out and GPUs.',
  },
  {
    id: 'mistral', name: 'Mistral', type: 'target', group: 'lab', tier: 2, watchlist: true, sector: 'AI',
    description: 'Europe\'s frontier bet. Its 2025 round was led by ASML — the equipment monopoly buying a seat at the model layer.',
  },
  {
    id: 'ssi', name: 'SSI (Safe Superintelligence)', type: 'target', group: 'lab', tier: 2, watchlist: true, sector: 'AI',
    description: 'Pre-product, pre-revenue, $32B valuation. The purest example of capital flowing to a team rather than a business.',
  },
  {
    id: 'thinking-machines', name: 'Thinking Machines Lab', type: 'target', group: 'lab', tier: 2, watchlist: true, sector: 'AI',
    description: 'Murati\'s lab — the largest seed round ever raised. Tracks where ex-OpenAI leadership pulls capital.',
  },

  // ── Silicon ────────────────────────────────────────────────────────────
  {
    id: 'nvidia', name: 'NVIDIA', type: 'both', group: 'silicon', tier: 1, watchlist: true, sector: 'Semiconductors',
    description: 'The centre of the map in both directions: receives most hyperscaler capex, then redeploys part of it as equity into the customers who will buy the next generation.',
  },
  {
    id: 'tsmc', name: 'TSMC', type: 'both', group: 'silicon', tier: 1, watchlist: true, sector: 'Semiconductors',
    description: 'The terminal node for AI silicon money — GPU dollars arrive as wafer revenue and leave as fab capex and equipment orders.',
  },
  {
    id: 'amd', name: 'AMD', type: 'both', group: 'silicon', tier: null, watchlist: true, sector: 'Semiconductors',
    description: 'Bought its way into the second-source slot by handing OpenAI warrants. Not yet tier-assigned in the spec.',
  },
  {
    id: 'broadcom', name: 'Broadcom', type: 'target', group: 'silicon', tier: 1, watchlist: true, sector: 'Semiconductors',
    description: 'The custom-silicon route out of NVIDIA dependence. Receives co-development commitments rather than equity.',
  },
  {
    id: 'intel', name: 'Intel', type: 'target', group: 'silicon', tier: null, watchlist: false, sector: 'Semiconductors',
    description: 'The one node where the US government converted subsidy into common equity — a template worth watching if it repeats.',
  },

  // ── Neoclouds — Tier 2 ─────────────────────────────────────────────────
  {
    id: 'coreweave', name: 'CoreWeave', type: 'both', group: 'neocloud', tier: 2, watchlist: true, sector: 'Infrastructure',
    description: 'Vendor-financed demand: NVIDIA holds equity, backstops its revenue, and sells it the GPUs it rents to NVIDIA\'s other customers.',
  },
  {
    id: 'crusoe', name: 'Crusoe', type: 'player', group: 'neocloud', tier: 2, watchlist: true, sector: 'Infrastructure',
    description: 'Developer of Stargate Abilene. Its turbine orders are one of the earliest visible signals of where new capacity is going.',
  },
  {
    id: 'lambda', name: 'Lambda', type: 'both', group: 'neocloud', tier: 2, watchlist: true, sector: 'Infrastructure',
    description: 'NVIDIA-backed neocloud that landed a multibillion Microsoft capacity deal — hyperscalers now rent from the ecosystem they used to own outright.',
  },
  {
    id: 'fluidstack', name: 'Fluidstack', type: 'target', group: 'neocloud', tier: 2, watchlist: true, sector: 'Infrastructure',
    description: 'Google backstops its leases and took a warrant — a hyperscaler underwriting a neocloud to place TPUs it doesn\'t want on its own balance sheet.',
  },

  // ── Funds & sovereigns ─────────────────────────────────────────────────
  {
    id: 'softbank', name: 'SoftBank', type: 'player', group: 'fund', tier: 1, watchlist: true, sector: 'AI',
    description: 'The largest single equity cheque into OpenAI and a Stargate co-owner. Concentrated, levered, structurally dependent on OpenAI\'s outcome.',
  },
  {
    id: 'mgx', name: 'MGX (Abu Dhabi)', type: 'both', group: 'fund', tier: 1, watchlist: true, sector: 'AI',
    description: 'Sovereign AI vehicle. Buys access to the compute build-out rather than to models.',
  },
  {
    id: 'mubadala', name: 'Mubadala', type: 'player', group: 'fund', tier: 1, watchlist: true, sector: 'AI',
    description: 'Abu Dhabi\'s broader sovereign platform and MGX founding partner — the balance sheet behind the Gulf\'s AI push.',
  },
  {
    id: 'saudi-pif', name: 'Saudi PIF', type: 'player', group: 'fund', tier: 1, watchlist: true, sector: 'AI',
    description: 'Deploys through Humain — buying GPUs and silicon partnerships at state scale to make the Kingdom an AI compute hub.',
  },
  {
    id: 'sequoia', name: 'Sequoia', type: 'player', group: 'fund', tier: 1, watchlist: true, sector: 'AI',
    description: 'The reference venture franchise — its cheques mark which labs institutional venture considers investable.',
  },
  {
    id: 'a16z', name: 'Andreessen Horowitz', type: 'player', group: 'fund', tier: 1, watchlist: true, sector: 'AI',
    description: 'Runs the barbell: seeds new labs (led TML\'s record seed) while writing late-stage cheques into OpenAI and xAI.',
  },
  {
    id: 'thrive', name: 'Thrive Capital', type: 'player', group: 'fund', tier: 1, watchlist: true, sector: 'AI',
    description: 'The lead on OpenAI\'s recent rounds — a venture fund taking an index-sized position in one asset.',
  },
  {
    id: 'founders-fund', name: 'Founders Fund', type: 'player', group: 'fund', tier: 1, watchlist: true, sector: 'AI',
    description: 'Thiel\'s vehicle. Concentrated, early, and unusually willing to lead very large late rounds in defence and AI.',
  },
  {
    id: 'khosla', name: 'Khosla Ventures', type: 'player', group: 'fund', tier: 1, watchlist: true, sector: 'AI',
    description: 'Wrote the first venture cheque into OpenAI — the earliest institutional signal in the whole dataset.',
  },
  {
    id: 'coatue', name: 'Coatue', type: 'player', group: 'fund', tier: 1, watchlist: true, sector: 'AI',
    description: 'Crossover capital — moves between public AI names and late-stage privates, so its allocations read as a market-timing signal.',
  },
  {
    id: 'altimeter', name: 'Altimeter', type: 'player', group: 'fund', tier: null, watchlist: true, sector: 'AI',
    description: 'Crossover fund in OpenAI\'s mega-rounds. Not yet tier-assigned in the spec.',
  },
  {
    id: 'blackstone', name: 'Blackstone', type: 'player', group: 'fund', tier: 1, watchlist: true, sector: 'Infrastructure',
    description: 'The largest private-capital balance sheet in data centres (QTS) and the lender behind CoreWeave\'s GPU-collateralised debt.',
  },
  {
    id: 'blackrock', name: 'BlackRock / GIP', type: 'player', group: 'fund', tier: 1, watchlist: true, sector: 'Infrastructure',
    description: 'Runs the AI Infrastructure Partnership with Microsoft, NVIDIA and MGX — and made the largest DC acquisition on record (Aligned).',
  },
  {
    id: 'kkr', name: 'KKR', type: 'player', group: 'fund', tier: null, watchlist: true, sector: 'Infrastructure',
    description: 'Took CyrusOne private at the start of the cycle. Not yet tier-assigned in the spec.',
  },
  {
    id: 'digitalbridge', name: 'DigitalBridge', type: 'player', group: 'fund', tier: 1, watchlist: true, sector: 'Infrastructure',
    description: 'Pure-play digital-infrastructure GP — its portfolio moves show where institutional infra money believes capacity is scarce.',
  },
  {
    id: 'brookfield', name: 'Brookfield', type: 'player', group: 'fund', tier: 1, watchlist: true, sector: 'Infrastructure',
    description: 'Owns the layer nobody else wants to underwrite: power and land. Its AI exposure is contracted cash flow from hyperscalers, not equity in models.',
  },
  {
    id: 'blue-owl', name: 'Blue Owl', type: 'player', group: 'fund', tier: null, watchlist: false, sector: 'Infrastructure',
    description: 'The balance sheet hyperscalers rent when they don\'t want a campus on their own books. Turns DC construction into private-credit paper.',
  },

  // ── Fab equipment — Tier 3 bottleneck owners ───────────────────────────
  {
    id: 'asml', name: 'ASML', type: 'both', group: 'equipment', tier: 3, watchlist: true, sector: 'Semiconductors',
    description: 'The litho monopoly every advanced fab routes through — and now an investor in the model layer (led Mistral\'s Series C).',
  },
  {
    id: 'applied-materials', name: 'Applied Materials', type: 'target', group: 'equipment', tier: 3, watchlist: true, sector: 'Semiconductors',
    description: 'Broadest fab-equipment portfolio; its order book is a leading read on foundry capex.',
  },
  {
    id: 'lam-research', name: 'Lam Research', type: 'target', group: 'equipment', tier: 3, watchlist: true, sector: 'Semiconductors',
    description: 'Etch and deposition — HBM stacking made it a direct AI-memory play.',
  },
  {
    id: 'tokyo-electron', name: 'Tokyo Electron', type: 'target', group: 'equipment', tier: 3, watchlist: true, sector: 'Semiconductors',
    description: 'Japan\'s tool giant; its China-vs-leading-edge mix shows where equipment demand actually sits.',
  },
  {
    id: 'besi', name: 'BESI', type: 'target', group: 'equipment', tier: 3, watchlist: true, sector: 'Semiconductors',
    description: 'Hybrid bonding leader — the packaging step advanced AI chips are queuing for.',
  },
  {
    id: 'asmpt', name: 'ASMPT', type: 'target', group: 'equipment', tier: 3, watchlist: true, sector: 'Semiconductors',
    description: 'Advanced-packaging tools (TCB) — the other half of the packaging bottleneck.',
  },
  {
    id: 'kla', name: 'KLA', type: 'target', group: 'equipment', tier: 3, watchlist: true, sector: 'Semiconductors',
    description: 'Process control — yield economics at the leading edge run through its installed base.',
  },

  // ── Power & energy — Tier 3 bottleneck owners ──────────────────────────
  {
    id: 'ge-vernova', name: 'GE Vernova', type: 'target', group: 'power', tier: 3, watchlist: true, sector: 'Nuclear/Energy',
    description: 'Gas turbines are sold out for years — its order book is the single best read on how fast new DC power can physically arrive.',
  },
  {
    id: 'eaton', name: 'Eaton', type: 'target', group: 'power', tier: 3, watchlist: true, sector: 'Infrastructure',
    description: 'Switchgear and electrical distribution — every campus routes through gear like this, and lead times set build pace.',
  },
  {
    id: 'schneider-electric', name: 'Schneider Electric', type: 'target', group: 'power', tier: 3, watchlist: true, sector: 'Infrastructure',
    description: 'Power distribution and cooling for data centres; bought its way deeper into liquid cooling as densities exploded.',
  },
  {
    id: 'vertiv', name: 'Vertiv', type: 'target', group: 'power', tier: 3, watchlist: true, sector: 'Infrastructure',
    description: 'The purest listed play on DC power/cooling equipment — its backlog moves before hyperscaler capex prints.',
  },
  {
    id: 'siemens-energy', name: 'Siemens Energy', type: 'target', group: 'power', tier: 3, watchlist: true, sector: 'Nuclear/Energy',
    description: 'Grid equipment and transformers — the multi-year queue that paces every interconnection.',
  },
  {
    id: 'westinghouse', name: 'Westinghouse', type: 'target', group: 'power', tier: null, watchlist: false, sector: 'Nuclear/Energy',
    description: 'The reactor vendor for most Western new-build. Owned 51/49 by Brookfield and Cameco — the most concentrated ownership point in nuclear.',
  },
  {
    id: 'oklo', name: 'Oklo', type: 'target', group: 'power', tier: null, watchlist: false, sector: 'Nuclear/Energy',
    description: 'SMR developer taken public via an Altman-chaired SPAC. Sells power, not reactors.',
  },
  {
    id: 'helion', name: 'Helion Energy', type: 'target', group: 'power', tier: null, watchlist: false, sector: 'Nuclear/Energy',
    description: 'Fusion developer with a signed Microsoft power agreement. The longest-dated bet on the map.',
  },
  {
    id: 'cameco', name: 'Cameco', type: 'player', group: 'power', tier: null, watchlist: false, sector: 'Nuclear/Energy',
    description: 'Uranium producer that co-bought Westinghouse — the fuel side of the nuclear bet.',
  },

  // ── Government ─────────────────────────────────────────────────────────
  {
    id: 'us-government', name: 'US Government', type: 'player', group: 'government', tier: null, watchlist: false, sector: 'Semiconductors',
    description: 'CHIPS Act grants, loans and — since 2025 — direct equity. Slower than private capital, but it decides where fabs legally exist.',
  },

  // ── Individuals ────────────────────────────────────────────────────────
  {
    id: 'sam-altman', name: 'Sam Altman', type: 'player', group: 'individual', tier: null, watchlist: false, sector: 'AI',
    description: 'Deploys personal capital into the energy supply his own company will need — fusion and fission — rather than into AI itself.',
  },
  {
    id: 'jensen-huang', name: 'Jensen Huang', type: 'player', group: 'individual', tier: null, watchlist: false, sector: 'Semiconductors',
    description: 'His investment capital is deployed through NVIDIA\'s balance sheet; his personal flows are philanthropic.',
  },
  {
    id: 'peter-thiel', name: 'Peter Thiel', type: 'player', group: 'individual', tier: null, watchlist: false, sector: 'AI',
    description: 'Invests through structures rather than directly — his influence over allocation sits at Founders Fund.',
  },

  // ── Projects & DC assets ───────────────────────────────────────────────
  {
    id: 'stargate', name: 'Stargate (JV)', type: 'both', group: 'project', tier: null, watchlist: false, sector: 'Infrastructure',
    description: 'The JV pooling OpenAI, SoftBank, Oracle and MGX equity for US data-centre capacity. A holding structure, not a building.',
  },
  {
    id: 'stargate-abilene', name: 'Stargate Abilene', type: 'both', group: 'project', tier: null, watchlist: false, sector: 'Infrastructure',
    description: 'The first physical Stargate site, Texas. Financed by private credit against a lease — how most of this build-out is actually paid for.',
  },
  {
    id: 'hyperion', name: 'Hyperion (Meta, LA)', type: 'both', group: 'project', tier: null, watchlist: false, sector: 'Infrastructure',
    description: 'Meta\'s multi-gigawatt Louisiana campus, held in a JV so most of the cost sits off Meta\'s balance sheet.',
  },
  {
    id: 'tsmc-arizona', name: 'TSMC Arizona', type: 'target', group: 'project', tier: null, watchlist: false, sector: 'Semiconductors',
    description: 'Where the reshoring money physically lands. State grants are a rounding error next to TSMC\'s own capex.',
  },
  {
    id: 'compass-datacenters', name: 'Compass Datacenters', type: 'target', group: 'project', tier: null, watchlist: false, sector: 'Infrastructure',
    description: 'Wholesale DC developer taken private by Brookfield — the "own the landlord" version of AI exposure.',
  },
  {
    id: 'aligned', name: 'Aligned Data Centers', type: 'target', group: 'project', tier: null, watchlist: false, sector: 'Infrastructure',
    description: 'The largest data-centre acquisition on record — bought by the BlackRock/GIP-led AI Infrastructure Partnership.',
  },
  {
    id: 'switch', name: 'Switch', type: 'target', group: 'project', tier: null, watchlist: false, sector: 'Infrastructure',
    description: 'Hyperscale DC operator taken private by DigitalBridge at the start of the AI capacity squeeze.',
  },
  {
    id: 'cyrusone', name: 'CyrusOne', type: 'target', group: 'project', tier: null, watchlist: false, sector: 'Infrastructure',
    description: 'Data-centre REIT taken private by KKR and GIP in 2022 — infra PE\'s opening move of the cycle.',
  },
  {
    id: 'osu-innovation-complex', name: 'OSU Innovation Complex', type: 'target', group: 'project', tier: null, watchlist: false, sector: 'Semiconductors',
    description: 'University supercomputing centre funded personally by the Huangs — what the individual layer does vs its corporate layer.',
  },

  // ── Defense ────────────────────────────────────────────────────────────
  {
    id: 'anduril', name: 'Anduril', type: 'target', group: 'defense', tier: null, watchlist: false, sector: 'Defense',
    description: 'Defence tech funded almost entirely by concentrated venture capital rather than the primes\' government R&D route.',
  },
];

// ══════════════════════════════════════════════════════════════════════════
// FLOWS — direction is always: money moves FROM source TO target.
//
//   confidence  'reported' — figure was disclosed/reported
//               'estimate' — assembled from analyst/press estimates
// ══════════════════════════════════════════════════════════════════════════
export const FLOWS = [
  // ── Equity into the labs ───────────────────────────────────────────────
  {
    id: 'msft-openai', source: 'microsoft', target: 'openai',
    amountUSD: 13_750_000_000, dealType: 'Equity', date: '2019–2025',
    holdingPeriod: 'Long-term (~27% of restructured OpenAI Group)',
    reasoning: 'Bought the model layer instead of building it, and paid largely in Azure credits — a majority of the cheque never left Microsoft as cash. The 2025 restructuring converted the position into conventional equity.',
    keyMetrics: '~$13.75B committed · ~27% stake post-restructure · Azure-credit heavy',
    status: 'Active', confidence: 'reported',
    sourceNote: 'Microsoft and OpenAI disclosures, 2019–2025',
  },
  {
    id: 'softbank-openai', source: 'softbank', target: 'openai',
    amountUSD: 30_000_000_000, dealType: 'Equity', date: '2025-03',
    holdingPeriod: 'Long-term',
    reasoning: 'The largest private equity cheque ever written into a single company. SoftBank chose concentration over diversification: this position dominates its NAV.',
    keyMetrics: '$30B of a $40B round · $300B post-money',
    status: 'Active', confidence: 'reported',
    sourceNote: 'SoftBank announcement, March 2025',
  },
  {
    id: 'thrive-openai', source: 'thrive', target: 'openai',
    amountUSD: 1_250_000_000, dealType: 'Equity', date: '2024-10',
    holdingPeriod: 'Long-term',
    reasoning: 'Led the round that reset OpenAI\'s valuation, taking a position larger than most funds\' entire portfolios in one name.',
    keyMetrics: '~$1.25B of a $6.6B round · $157B post-money',
    status: 'Active', confidence: 'reported',
    sourceNote: 'Press reporting, October 2024',
  },
  {
    id: 'ff-openai', source: 'founders-fund', target: 'openai',
    amountUSD: 500_000_000, dealType: 'Equity', date: '2016–2025',
    holdingPeriod: 'Long-term',
    reasoning: 'One of the earliest institutional backers, from the original non-profit commitment through to the recent mega-rounds.',
    keyMetrics: 'Cumulative across rounds · figure approximate',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Press reporting; cumulative participation, not a disclosed total',
  },
  {
    id: 'khosla-openai', source: 'khosla', target: 'openai',
    amountUSD: 50_000_000, dealType: 'Equity', date: '2019-03',
    holdingPeriod: 'Long-term, earliest VC position',
    reasoning: 'The first venture cheque into OpenAI LP — small in dollars, enormous in signal. Everything else on this map came after it.',
    keyMetrics: '~$50M into OpenAI LP\'s first raise',
    status: 'Active', confidence: 'reported',
    sourceNote: 'Khosla Ventures / press reporting, 2019',
  },
  {
    id: 'sequoia-openai', source: 'sequoia', target: 'openai',
    amountUSD: 600_000_000, dealType: 'Equity', date: '2021–2025',
    holdingPeriod: 'Long-term',
    reasoning: 'Built across tenders and rounds rather than one cheque — the reference venture franchise validating the category.',
    keyMetrics: 'Cumulative across rounds · figure approximate',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Press reporting on round participation; cumulative estimate',
  },
  {
    id: 'coatue-openai', source: 'coatue', target: 'openai',
    amountUSD: 1_000_000_000, dealType: 'Equity', date: '2025-03',
    holdingPeriod: 'Long-term',
    reasoning: 'Crossover capital entering at mega-round scale — public-market money accepting private-market terms to get AI exposure.',
    keyMetrics: 'Participant in the $40B round · amount estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported round participants, March 2025',
  },
  {
    id: 'altimeter-openai', source: 'altimeter', target: 'openai',
    amountUSD: 500_000_000, dealType: 'Equity', date: '2025-03',
    holdingPeriod: 'Long-term',
    reasoning: 'Same crossover pattern: a public-markets fund taking concentrated private AI exposure through the mega-round.',
    keyMetrics: 'Participant in the $40B round · amount estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported round participants, March 2025',
  },
  {
    id: 'nvda-openai', source: 'nvidia', target: 'openai',
    amountUSD: 100_000_000_000, dealType: 'Equity', date: '2025-09',
    holdingPeriod: 'Staged, tied to 10 GW of deployment',
    reasoning: 'Vendor financing at unprecedented scale: NVIDIA funds the customer that will spend the money back on NVIDIA systems. Each tranche unlocks as a gigawatt goes live.',
    keyMetrics: 'Up to $100B · 10 GW of NVIDIA systems · progressive tranches',
    status: 'Announced', confidence: 'reported',
    sourceNote: 'NVIDIA/OpenAI letter of intent, September 2025',
  },
  {
    id: 'amzn-anthropic', source: 'amazon', target: 'anthropic',
    amountUSD: 8_000_000_000, dealType: 'Equity', date: '2023-09 → 2024-11',
    holdingPeriod: 'Long-term, minority',
    reasoning: 'Bought a frontier lab without buying control, and tied it to AWS as primary cloud and Trainium as a training target — the return is silicon adoption as much as equity.',
    keyMetrics: '$8B in three tranches · AWS primary cloud · Trainium commitment',
    status: 'Active', confidence: 'reported',
    sourceNote: 'Amazon announcements, 2023–2024',
  },
  {
    id: 'goog-anthropic', source: 'google', target: 'anthropic',
    amountUSD: 3_000_000_000, dealType: 'Equity', date: '2023–2025',
    holdingPeriod: 'Long-term, minority',
    reasoning: 'Funds a direct competitor to Gemini to keep the TPU roadmap validated by an outside frontier lab. Strategic optionality at portfolio prices.',
    keyMetrics: '~$3B cumulative · minority, non-controlling',
    status: 'Active', confidence: 'reported',
    sourceNote: 'Alphabet filings and press reporting, 2023–2025',
  },
  {
    id: 'nvda-anthropic', source: 'nvidia', target: 'anthropic',
    amountUSD: 10_000_000_000, dealType: 'Equity', date: '2025-11',
    holdingPeriod: 'Long-term',
    reasoning: 'Extends the OpenAI playbook to the second lab: fund the buyer, lock in the architecture. Anthropic had been the most TPU-and-Trainium-weighted lab — exactly what this is meant to change.',
    keyMetrics: 'Up to $10B · announced alongside a 1 GW NVIDIA commitment',
    status: 'Announced', confidence: 'reported',
    sourceNote: 'NVIDIA/Microsoft/Anthropic announcement, November 2025',
  },
  {
    id: 'msft-anthropic', source: 'microsoft', target: 'anthropic',
    amountUSD: 5_000_000_000, dealType: 'Equity', date: '2025-11',
    holdingPeriod: 'Long-term',
    reasoning: 'Microsoft stops being a single-lab bet. Small next to OpenAI, but it buys the right to sell Claude on Azure — distribution, not control.',
    keyMetrics: 'Up to $5B · paired with a $30B Azure commitment from Anthropic',
    status: 'Announced', confidence: 'reported',
    sourceNote: 'Microsoft/NVIDIA/Anthropic announcement, November 2025',
  },
  {
    id: 'nvda-xai', source: 'nvidia', target: 'xai',
    amountUSD: 2_000_000_000, dealType: 'Equity', date: '2025-10',
    holdingPeriod: 'Long-term, via SPV',
    reasoning: 'Same vendor-financing structure, third customer. The vehicle is an SPV that owns the GPUs and leases them to xAI — NVIDIA\'s exposure is collateralised by its own hardware.',
    keyMetrics: '~$2B into a ~$20B GPU SPV for Colossus 2',
    status: 'Active', confidence: 'reported',
    sourceNote: 'Press reporting, October 2025',
  },
  {
    id: 'a16z-xai', source: 'a16z', target: 'xai',
    amountUSD: 500_000_000, dealType: 'Equity', date: '2024-12',
    holdingPeriod: 'Long-term',
    reasoning: 'Late-stage conviction in the vertical-speed lab — part of the $6B Series C that funded Colossus.',
    keyMetrics: 'Series C participant · amount estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported Series C participants, December 2024',
  },
  {
    id: 'sequoia-xai', source: 'sequoia', target: 'xai',
    amountUSD: 500_000_000, dealType: 'Equity', date: '2024-12',
    holdingPeriod: 'Long-term',
    reasoning: 'Hedging the lab race — Sequoia now holds positions in multiple competing frontier labs.',
    keyMetrics: 'Series C participant · amount estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported Series C participants, December 2024',
  },
  {
    id: 'coatue-xai', source: 'coatue', target: 'xai',
    amountUSD: 400_000_000, dealType: 'Equity', date: '2024-05',
    holdingPeriod: 'Long-term',
    reasoning: 'Entered at the Series B — crossover money backing Musk\'s execution speed rather than model benchmarks.',
    keyMetrics: 'Series B participant · amount estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported Series B participants, May 2024',
  },
  {
    id: 'asml-mistral', source: 'asml', target: 'mistral',
    amountUSD: 1_500_000_000, dealType: 'Equity', date: '2025-09',
    holdingPeriod: 'Long-term, ~11% stake',
    reasoning: 'The strangest flow on the map: the equipment monopoly investing down the stack into a model lab. Europe\'s champions consolidating capital inside Europe.',
    keyMetrics: 'Led €1.3B of a €1.7B Series C · ~11% · €11.7B post-money',
    status: 'Closed', confidence: 'reported',
    sourceNote: 'ASML/Mistral announcement, September 2025',
  },
  {
    id: 'msft-mistral', source: 'microsoft', target: 'mistral',
    amountUSD: 16_000_000, dealType: 'Equity', date: '2024-02',
    holdingPeriod: 'Small minority',
    reasoning: 'A tiny cheque that bought Azure distribution for Mistral\'s models — optionality priced in millions, not billions.',
    keyMetrics: '€15M convertible · Azure distribution deal',
    status: 'Closed', confidence: 'reported',
    sourceNote: 'Microsoft/Mistral announcement, February 2024',
  },
  {
    id: 'goog-ssi', source: 'google', target: 'ssi',
    amountUSD: 500_000_000, dealType: 'Equity', date: '2025-04',
    holdingPeriod: 'Long-term',
    reasoning: 'Alphabet backing Sutskever\'s no-product lab — buying proximity to whatever comes out, and TPU adoption for its training runs.',
    keyMetrics: 'Participant at $32B valuation · amount estimated · SSI trains on TPUs',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported investors at the $32B round, April 2025',
  },
  {
    id: 'nvda-ssi', source: 'nvidia', target: 'ssi',
    amountUSD: 500_000_000, dealType: 'Equity', date: '2025-04',
    holdingPeriod: 'Long-term',
    reasoning: 'NVIDIA hedging the TPU-leaning lab the same way it hedges everything: with equity.',
    keyMetrics: 'Participant at $32B valuation · amount estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported investors at the $32B round, April 2025',
  },
  {
    id: 'sequoia-ssi', source: 'sequoia', target: 'ssi',
    amountUSD: 500_000_000, dealType: 'Equity', date: '2024-09',
    holdingPeriod: 'Long-term',
    reasoning: 'Backing a team with no product, no revenue and no disclosed roadmap — capital allocated purely to people.',
    keyMetrics: 'Co-led the $1B raise at $5B · amount estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported round structure, September 2024',
  },
  {
    id: 'a16z-ssi', source: 'a16z', target: 'ssi',
    amountUSD: 500_000_000, dealType: 'Equity', date: '2024-09',
    holdingPeriod: 'Long-term',
    reasoning: 'Same round, same logic — the two reference franchises splitting the safest team-bet in the category.',
    keyMetrics: 'Co-led the $1B raise at $5B · amount estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported round structure, September 2024',
  },
  {
    id: 'a16z-tml', source: 'a16z', target: 'thinking-machines',
    amountUSD: 450_000_000, dealType: 'Equity', date: '2025-07',
    holdingPeriod: 'Long-term',
    reasoning: 'Led the largest seed round ever raised — $2B at $10B for a months-old company. The price of ex-OpenAI leadership.',
    keyMetrics: 'Led the $2B seed at $10B · lead cheque estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Round reported July 2025; lead-cheque split estimated',
  },
  {
    id: 'nvda-tml', source: 'nvidia', target: 'thinking-machines',
    amountUSD: 100_000_000, dealType: 'Equity', date: '2025-07',
    holdingPeriod: 'Long-term',
    reasoning: 'The pattern completes: NVIDIA now holds equity in every frontier lab on this map.',
    keyMetrics: 'Seed participant · amount estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported participants, July 2025',
  },
  {
    id: 'nvda-coreweave-eq', source: 'nvidia', target: 'coreweave',
    amountUSD: 100_000_000, dealType: 'Equity', date: '2023-04',
    holdingPeriod: 'Long-term',
    reasoning: 'A small cheque that created a large customer. NVIDIA seeded a neocloud that would buy its GPUs when hyperscalers were rationing allocation.',
    keyMetrics: '~$100M at ~$2B valuation · CoreWeave later IPO\'d far above it',
    status: 'Active', confidence: 'reported',
    sourceNote: 'CoreWeave Series B disclosure, April 2023',
  },
  {
    id: 'nvda-lambda', source: 'nvidia', target: 'lambda',
    amountUSD: 250_000_000, dealType: 'Equity', date: '2023–2025',
    holdingPeriod: 'Long-term',
    reasoning: 'The CoreWeave playbook, second instance: seed the GPU landlord, then supply it.',
    keyMetrics: 'Participation across rounds · amount estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported round participation',
  },

  // ── Compute commitments flowing back ───────────────────────────────────
  {
    id: 'anthropic-msft-compute', source: 'anthropic', target: 'microsoft',
    amountUSD: 30_000_000_000, dealType: 'Compute commitment', date: '2025-11',
    holdingPeriod: 'Multi-year',
    reasoning: 'The return leg of the Microsoft/NVIDIA investment: roughly twice the equity going in comes back as contracted Azure spend. That is the whole point of the structure.',
    keyMetrics: '$30B Azure commitment · up to 1 GW of NVIDIA capacity',
    status: 'Announced', confidence: 'reported',
    sourceNote: 'Announced alongside the November 2025 investment',
  },
  {
    id: 'anthropic-goog-tpu', source: 'anthropic', target: 'google',
    amountUSD: 30_000_000_000, dealType: 'Compute commitment', date: '2025-10',
    holdingPeriod: 'Multi-year',
    reasoning: 'Anthropic\'s hedge against GPU pricing: a very large TPU commitment that keeps a second silicon architecture viable for frontier training.',
    keyMetrics: 'Up to 1M TPUs · >1 GW by 2026 · value not formally disclosed',
    status: 'Announced', confidence: 'estimate',
    sourceNote: 'Reported as "tens of billions"; $30B used as a midpoint',
  },
  {
    id: 'openai-oracle', source: 'openai', target: 'oracle',
    amountUSD: 300_000_000_000, dealType: 'Compute commitment', date: '2025-09',
    holdingPeriod: '5-year contract from 2027',
    reasoning: 'The largest compute contract ever signed and the map\'s core asymmetry in one row: OpenAI\'s contracted obligations exceed its revenue by an order of magnitude.',
    keyMetrics: '$300B over ~5 years · ~4.5 GW · starts 2027',
    status: 'Announced', confidence: 'reported',
    sourceNote: 'Press reporting on the Oracle backlog disclosure, September 2025',
  },
  {
    id: 'openai-coreweave', source: 'openai', target: 'coreweave',
    amountUSD: 22_400_000_000, dealType: 'Compute commitment', date: '2025-03 → 2025-09',
    holdingPeriod: 'Through 2030',
    reasoning: 'Signed to diversify away from Azure — and it converted CoreWeave from a leveraged GPU landlord into an investment-grade-adjacent credit, which is what let it raise debt cheaply.',
    keyMetrics: '$11.9B initial · expanded to $22.4B',
    status: 'Active', confidence: 'reported',
    sourceNote: 'CoreWeave disclosures, 2025',
  },
  {
    id: 'openai-amd', source: 'openai', target: 'amd',
    amountUSD: 90_000_000_000, dealType: 'Compute commitment', date: '2025-10',
    holdingPeriod: '6 GW deployed from 2H2026',
    reasoning: 'OpenAI paid for a second supplier with equity rather than cash: AMD issued warrants for ~10% of itself, vesting against deployment. A purchase order that doubles as a call option.',
    keyMetrics: '6 GW · warrants for up to 160M AMD shares · first 1 GW 2H2026',
    status: 'Announced', confidence: 'estimate',
    sourceNote: 'Deal terms reported October 2025; dollar value is an analyst estimate',
  },
  {
    id: 'openai-broadcom', source: 'openai', target: 'broadcom',
    amountUSD: 50_000_000_000, dealType: 'Compute commitment', date: '2025-10',
    holdingPeriod: 'Deployment 2H2026 – 2029',
    reasoning: 'The custom-silicon exit from NVIDIA dependence. Slower and riskier than buying GPUs, but the only path where OpenAI owns the design rather than renting it.',
    keyMetrics: '10 GW of co-developed accelerators · no dollar figure disclosed',
    status: 'Announced', confidence: 'estimate',
    sourceNote: 'Announced October 2025 without a value; figure is an estimate',
  },
  {
    id: 'msft-lambda', source: 'microsoft', target: 'lambda',
    amountUSD: 10_000_000_000, dealType: 'Contract', date: '2025-11',
    holdingPeriod: 'Multi-year',
    reasoning: 'A hyperscaler renting from a neocloud: Microsoft buys AI capacity from Lambda rather than building it — capex flexibility bought at a margin premium.',
    keyMetrics: 'Reported "multibillion" · NVIDIA GB300-based capacity',
    status: 'Announced', confidence: 'estimate',
    sourceNote: 'Deal reported November 2025 without a value; figure is an estimate',
  },
  {
    id: 'goog-fluidstack', source: 'google', target: 'fluidstack',
    amountUSD: 3_200_000_000, dealType: 'Contract', date: '2025-08',
    holdingPeriod: 'Lease backstop + warrant',
    reasoning: 'Google underwrites Fluidstack\'s data-centre leases and takes a warrant — a hyperscaler creating an arm\'s-length channel to place TPUs without owning the buildings.',
    keyMetrics: '~$3.2B lease backstop · ~14% warrant · TPU capacity for Anthropic et al.',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Press reporting, August 2025',
  },

  // ── Hardware purchases — where hyperscaler capex actually goes ─────────
  {
    id: 'msft-nvda-buy', source: 'microsoft', target: 'nvidia',
    amountUSD: 40_000_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Annual capex run-rate',
    reasoning: 'The single largest recurring transfer on the map. Hyperscaler capex is NVIDIA\'s revenue — which is why any capex pause reprices the whole chain.',
    keyMetrics: 'Estimated annual GPU/system spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Derived from capex disclosures and supply-chain estimates',
  },
  {
    id: 'meta-nvda-buy', source: 'meta', target: 'nvidia',
    amountUSD: 25_000_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Annual capex run-rate',
    reasoning: 'Meta buys more compute per dollar of AI revenue than anyone else — no external lab stake, no cloud business to resell it.',
    keyMetrics: 'Estimated annual GPU/system spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Derived from capex disclosures and supply-chain estimates',
  },
  {
    id: 'amzn-nvda-buy', source: 'amazon', target: 'nvidia',
    amountUSD: 20_000_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Annual capex run-rate',
    reasoning: 'Lower than peers relative to total capex because a growing share of AWS training runs on its own Trainium silicon.',
    keyMetrics: 'Estimated annual GPU/system spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Derived from capex disclosures and supply-chain estimates',
  },
  {
    id: 'goog-nvda-buy', source: 'google', target: 'nvidia',
    amountUSD: 15_000_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Annual capex run-rate',
    reasoning: 'The least NVIDIA-dependent hyperscaler: internal training runs on TPUs, so GPU purchases mostly serve external cloud customers.',
    keyMetrics: 'Estimated annual GPU/system spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Derived from capex disclosures and supply-chain estimates',
  },
  {
    id: 'cw-nvda-buy', source: 'coreweave', target: 'nvidia',
    amountUSD: 12_000_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Debt-financed capex',
    reasoning: 'Buys GPUs with borrowed money secured against the GPUs, then rents them under contracts from the same vendor\'s other customers. The circularity is the business model.',
    keyMetrics: 'Estimated annual spend · largely GPU-collateralised debt',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Derived from CoreWeave capex and debt disclosures',
  },
  {
    id: 'xai-nvda-buy', source: 'xai', target: 'nvidia',
    amountUSD: 7_000_000_000, dealType: 'Purchase', date: '2024–2025',
    holdingPeriod: 'Capex',
    reasoning: 'Colossus was built faster than any comparable cluster — paying cash for GPUs ahead of revenue rather than financing against contracts.',
    keyMetrics: '~200k+ GPUs at Memphis · estimated hardware cost',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Estimated from disclosed cluster sizes',
  },
  {
    id: 'lambda-nvda-buy', source: 'lambda', target: 'nvidia',
    amountUSD: 2_000_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Capex',
    reasoning: 'The Microsoft contract flows straight through: Lambda\'s revenue commitment becomes NVIDIA\'s order book within the same quarter.',
    keyMetrics: 'Estimated GPU spend against the Microsoft deal',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Estimated from announced capacity plans',
  },
  {
    id: 'nvda-tsmc', source: 'nvidia', target: 'tsmc',
    amountUSD: 30_000_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Annual foundry spend',
    reasoning: 'The end of the line. Every GPU dollar upstream compresses into wafer and advanced-packaging orders here — TSMC capacity, not chip design, is the real constraint.',
    keyMetrics: 'Estimated annual wafer + CoWoS spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Derived from foundry revenue mix estimates',
  },
  {
    id: 'nvda-coreweave-contract', source: 'nvidia', target: 'coreweave',
    amountUSD: 6_300_000_000, dealType: 'Contract', date: '2025-09',
    holdingPeriod: 'Through 2032',
    reasoning: 'NVIDIA agreed to buy any CoreWeave capacity that goes unsold — a demand risk turned into a vendor guarantee, making CoreWeave\'s revenue partly a restatement of NVIDIA\'s own.',
    keyMetrics: '$6.3B backstop · runs to April 2032',
    status: 'Active', confidence: 'reported',
    sourceNote: 'CoreWeave filing, September 2025',
  },

  // ── TSMC capex → the equipment bottleneck ──────────────────────────────
  {
    id: 'tsmc-asml', source: 'tsmc', target: 'asml',
    amountUSD: 8_000_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Annual tool orders',
    reasoning: 'Every advanced wafer starts as an ASML order years earlier. High-NA EUV at ~$400M a tool is the single most concentrated bottleneck in the chain.',
    keyMetrics: 'Estimated annual litho spend incl. High-NA EUV',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Derived from TSMC capex guidance and ASML backlog mix',
  },
  {
    id: 'tsmc-amat', source: 'tsmc', target: 'applied-materials',
    amountUSD: 5_000_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Annual tool orders',
    reasoning: 'Deposition and materials engineering across every new fab — the broadest exposure to foundry capex.',
    keyMetrics: 'Estimated annual equipment spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Derived from TSMC capex guidance and WFE market-share estimates',
  },
  {
    id: 'tsmc-lam', source: 'tsmc', target: 'lam-research',
    amountUSD: 4_000_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Annual tool orders',
    reasoning: 'Etch intensity rises with every node shrink and every HBM stack — Lam\'s share of each wafer keeps growing.',
    keyMetrics: 'Estimated annual equipment spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Derived from TSMC capex guidance and WFE market-share estimates',
  },
  {
    id: 'tsmc-tel', source: 'tsmc', target: 'tokyo-electron',
    amountUSD: 4_000_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Annual tool orders',
    reasoning: 'Coat/develop and thermal processing — Japan\'s indispensable slice of every leading-edge line.',
    keyMetrics: 'Estimated annual equipment spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Derived from TSMC capex guidance and WFE market-share estimates',
  },
  {
    id: 'tsmc-kla', source: 'tsmc', target: 'kla',
    amountUSD: 3_000_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Annual tool orders',
    reasoning: 'Yield is the economics of the leading edge, and yield runs through KLA\'s inspection installed base.',
    keyMetrics: 'Estimated annual equipment spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Derived from TSMC capex guidance and WFE market-share estimates',
  },
  {
    id: 'tsmc-besi', source: 'tsmc', target: 'besi',
    amountUSD: 400_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Annual tool orders',
    reasoning: 'Hybrid bonding is the step AI chips queue for — small in dollars, decisive in schedule.',
    keyMetrics: 'Estimated annual packaging-tool spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Derived from advanced-packaging capacity plans',
  },
  {
    id: 'tsmc-asmpt', source: 'tsmc', target: 'asmpt',
    amountUSD: 400_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Annual tool orders',
    reasoning: 'Thermo-compression bonding for CoWoS — the other half of the packaging bottleneck.',
    keyMetrics: 'Estimated annual packaging-tool spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Derived from advanced-packaging capacity plans',
  },

  // ── Stargate and the project layer ─────────────────────────────────────
  {
    id: 'openai-stargate', source: 'openai', target: 'stargate',
    amountUSD: 19_000_000_000, dealType: 'Partnership', date: '2025-01',
    holdingPeriod: 'JV equity',
    reasoning: 'Puts OpenAI on the ownership side of its own infrastructure for the first time, rather than leasing all of it from Microsoft.',
    keyMetrics: '$19B equity · ~40% of the JV · $500B headline programme',
    status: 'Active', confidence: 'reported',
    sourceNote: 'Stargate announcement, January 2025',
  },
  {
    id: 'softbank-stargate', source: 'softbank', target: 'stargate',
    amountUSD: 19_000_000_000, dealType: 'Partnership', date: '2025-01',
    holdingPeriod: 'JV equity',
    reasoning: 'Doubles SoftBank\'s OpenAI exposure — once through equity in the company, once through infrastructure that only has value if that company succeeds.',
    keyMetrics: '$19B equity · ~40% of the JV',
    status: 'Active', confidence: 'reported',
    sourceNote: 'Stargate announcement, January 2025',
  },
  {
    id: 'oracle-stargate', source: 'oracle', target: 'stargate',
    amountUSD: 7_000_000_000, dealType: 'Partnership', date: '2025-01',
    holdingPeriod: 'JV equity',
    reasoning: 'A small equity cheque protecting a very large contract — Oracle\'s real position is the $300B backlog, not the JV stake.',
    keyMetrics: '~$7B equity',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported partner split, January 2025',
  },
  {
    id: 'mgx-stargate', source: 'mgx', target: 'stargate',
    amountUSD: 7_000_000_000, dealType: 'Partnership', date: '2025-01',
    holdingPeriod: 'JV equity',
    reasoning: 'Sovereign capital buying a seat in US AI infrastructure — the return is strategic access as much as financial.',
    keyMetrics: '~$7B equity',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported partner split, January 2025',
  },
  {
    id: 'mubadala-mgx', source: 'mubadala', target: 'mgx',
    amountUSD: 10_000_000_000, dealType: 'Partnership', date: '2024-03',
    holdingPeriod: 'Founding capital',
    reasoning: 'MGX is the spearhead; Mubadala is the balance sheet behind it. One sovereign strategy, two vehicles.',
    keyMetrics: 'Founding partner with G42 · commitment estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'MGX launch, March 2024; capitalisation not disclosed',
  },
  {
    id: 'blueowl-abilene', source: 'blue-owl', target: 'stargate-abilene',
    amountUSD: 15_000_000_000, dealType: 'Debt', date: '2025',
    holdingPeriod: 'Project finance against long lease',
    reasoning: 'How the build-out is really funded: private credit lends against a signed lease, not against AI revenue. If the lease holds, the loan performs regardless of model economics.',
    keyMetrics: '~$15B financing package · ~1.2 GW site',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Press reporting on the Abilene financing, 2025',
  },
  {
    id: 'crusoe-abilene', source: 'crusoe', target: 'stargate-abilene',
    amountUSD: 1_000_000_000, dealType: 'Partnership', date: '2024–2025',
    holdingPeriod: 'Developer JV',
    reasoning: 'Crusoe is the developer that turns Blue Owl\'s credit and Oracle\'s lease into an actual building — the execution layer of the financing stack.',
    keyMetrics: 'JV with Blue Owl / Primary Digital · equity portion estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported JV structure, 2024–2025',
  },
  {
    id: 'blueowl-hyperion', source: 'blue-owl', target: 'hyperion',
    amountUSD: 21_600_000_000, dealType: 'Partnership', date: '2025-10',
    holdingPeriod: 'JV, ~80% ownership',
    reasoning: 'Meta moved a $27B campus off its balance sheet by selling 80% of it. Expect the structure to spread — it is how hyperscalers keep capex from crushing free cash flow.',
    keyMetrics: '80% of a $27B JV · Louisiana · multi-GW',
    status: 'Active', confidence: 'reported',
    sourceNote: 'Meta/Blue Owl announcement, October 2025',
  },
  {
    id: 'meta-hyperion', source: 'meta', target: 'hyperion',
    amountUSD: 5_400_000_000, dealType: 'Partnership', date: '2025-10',
    holdingPeriod: 'JV, ~20% ownership',
    reasoning: 'Meta keeps operational control and a minority of the cost. The rent it pays the JV is what services Blue Owl\'s capital.',
    keyMetrics: '20% of a $27B JV',
    status: 'Active', confidence: 'reported',
    sourceNote: 'Meta/Blue Owl announcement, October 2025',
  },

  // ── Infra PE buying the operators ──────────────────────────────────────
  {
    id: 'blackrock-aligned', source: 'blackrock', target: 'aligned',
    amountUSD: 40_000_000_000, dealType: 'Acquisition', date: '2025-10',
    holdingPeriod: 'Long-term, AIP consortium',
    reasoning: 'The largest data-centre acquisition on record, made by the AIP consortium (BlackRock/GIP with Microsoft, NVIDIA and MGX money behind it). Infra capital buying the landlord class wholesale.',
    keyMetrics: '$40B enterprise value · ~5 GW pipeline',
    status: 'Announced', confidence: 'reported',
    sourceNote: 'AIP/Aligned announcement, October 2025',
  },
  {
    id: 'blackstone-coreweave', source: 'blackstone', target: 'coreweave',
    amountUSD: 7_500_000_000, dealType: 'Debt', date: '2024-05',
    holdingPeriod: 'GPU-collateralised facility',
    reasoning: 'The loan that proved GPUs are financeable collateral. Blackstone lends against chips plus contracts — private credit\'s entry into the AI stack.',
    keyMetrics: '$7.5B facility, led with Magnetar',
    status: 'Active', confidence: 'reported',
    sourceNote: 'CoreWeave debt facility, May 2024',
  },
  {
    id: 'digitalbridge-switch', source: 'digitalbridge', target: 'switch',
    amountUSD: 11_000_000_000, dealType: 'Acquisition', date: '2022-12',
    holdingPeriod: 'Long-term, with IFM',
    reasoning: 'Took a hyperscale operator private just before the AI squeeze made its capacity scarce — timing that looks better every quarter since.',
    keyMetrics: '$11B take-private with IFM Investors',
    status: 'Closed', confidence: 'reported',
    sourceNote: 'Transaction close, December 2022',
  },
  {
    id: 'kkr-cyrusone', source: 'kkr', target: 'cyrusone',
    amountUSD: 15_000_000_000, dealType: 'Acquisition', date: '2022-03',
    holdingPeriod: 'Long-term, with GIP',
    reasoning: 'Infra PE\'s opening move of the cycle: buy the REIT, feed it capital privately, lease to hyperscalers.',
    keyMetrics: '$15B take-private with Global Infrastructure Partners',
    status: 'Closed', confidence: 'reported',
    sourceNote: 'Transaction close, March 2022',
  },
  {
    id: 'brookfield-compass', source: 'brookfield', target: 'compass-datacenters',
    amountUSD: 5_500_000_000, dealType: 'Acquisition', date: '2023-01',
    holdingPeriod: 'Long-term, control',
    reasoning: 'Owning the developer rather than the tenant. Returns come from long leases signed with exactly the hyperscalers elsewhere on this map.',
    keyMetrics: '~$5.5B take-private, with Ontario Teachers\'',
    status: 'Closed', confidence: 'estimate',
    sourceNote: 'Reported transaction value, January 2023',
  },

  // ── Sovereign silicon programmes ───────────────────────────────────────
  {
    id: 'pif-nvidia', source: 'saudi-pif', target: 'nvidia',
    amountUSD: 7_000_000_000, dealType: 'Purchase', date: '2025-05',
    holdingPeriod: 'Multi-year GPU programme',
    reasoning: 'Humain\'s GPU programme — a state buying compute sovereignty the way states used to buy airlines. Hundreds of thousands of GPUs over five years.',
    keyMetrics: '"Several hundred thousand" GPUs over 5 years · value estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'NVIDIA/Humain announcement, May 2025; value not disclosed',
  },
  {
    id: 'pif-amd', source: 'saudi-pif', target: 'amd',
    amountUSD: 10_000_000_000, dealType: 'Partnership', date: '2025-05',
    holdingPeriod: 'Multi-year',
    reasoning: 'The second-source strategy at sovereign scale: fund AMD capacity so the GPU programme is never single-vendor.',
    keyMetrics: '$10B Humain–AMD collaboration',
    status: 'Announced', confidence: 'reported',
    sourceNote: 'AMD/Humain announcement, May 2025',
  },

  // ── Energy and the power layer ─────────────────────────────────────────
  {
    id: 'msft-brookfield-ppa', source: 'microsoft', target: 'brookfield',
    amountUSD: 11_500_000_000, dealType: 'Contract', date: '2024-05',
    holdingPeriod: '2026–2030 delivery framework',
    reasoning: 'The largest corporate clean-power deal signed to date. Microsoft is buying the one input it cannot manufacture faster with money — grid-connected electricity — years ahead of delivery.',
    keyMetrics: '10.5 GW framework · 2026–2030 · value estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Framework announced May 2024; dollar value not disclosed',
  },
  {
    id: 'brookfield-westinghouse', source: 'brookfield', target: 'westinghouse',
    amountUSD: 4_500_000_000, dealType: 'Acquisition', date: '2023-11',
    holdingPeriod: 'Long-term, 51% control',
    reasoning: 'Bought the reactor vendor before the AI power story existed. Every Western new-build now routes through an asset Brookfield controls.',
    keyMetrics: '51% of a $7.9B enterprise value',
    status: 'Closed', confidence: 'reported',
    sourceNote: 'Brookfield/Cameco transaction close, November 2023',
  },
  {
    id: 'cameco-westinghouse', source: 'cameco', target: 'westinghouse',
    amountUSD: 2_200_000_000, dealType: 'Acquisition', date: '2023-11',
    holdingPeriod: 'Long-term, 49%',
    reasoning: 'Vertical integration on the fuel side: owning part of the reactor vendor secures decades of downstream uranium demand.',
    keyMetrics: '49% of a $7.9B enterprise value',
    status: 'Closed', confidence: 'reported',
    sourceNote: 'Brookfield/Cameco transaction close, November 2023',
  },
  {
    id: 'crusoe-gevernova', source: 'crusoe', target: 'ge-vernova',
    amountUSD: 1_000_000_000, dealType: 'Purchase', date: '2024–2025',
    holdingPeriod: 'Turbine orders for Abilene',
    reasoning: 'The clearest early signal in the power chain: Crusoe ordered gas turbines before most of the market believed the site was real. Turbine orders lead data-centre capacity by ~2 years.',
    keyMetrics: '~30 turbines for Abilene · ~1 GW behind-the-meter · value estimated',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Reported turbine orders, 2024–2025',
  },
  {
    id: 'abilene-vertiv', source: 'stargate-abilene', target: 'vertiv',
    amountUSD: 400_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Equipment packages',
    reasoning: 'Every gigawatt of announced capacity becomes power and cooling orders here — the flow that turns headlines into Tier-3 backlog.',
    keyMetrics: 'Illustrative allocation of site equipment spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Illustrative — allocated from typical cost per GW of build',
  },
  {
    id: 'hyperion-schneider', source: 'hyperion', target: 'schneider-electric',
    amountUSD: 350_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Equipment packages',
    reasoning: 'Multi-gigawatt campuses buy electrical distribution and cooling at nine-figure scale per site.',
    keyMetrics: 'Illustrative allocation of site equipment spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Illustrative — allocated from typical cost per GW of build',
  },
  {
    id: 'hyperion-eaton', source: 'hyperion', target: 'eaton',
    amountUSD: 300_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Equipment packages',
    reasoning: 'Switchgear lead times, not land or money, are what pace campus energisation dates.',
    keyMetrics: 'Illustrative allocation of site equipment spend',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Illustrative — allocated from typical cost per GW of build',
  },
  {
    id: 'msft-siemens-energy', source: 'microsoft', target: 'siemens-energy',
    amountUSD: 500_000_000, dealType: 'Purchase', date: '2025',
    holdingPeriod: 'Grid equipment orders',
    reasoning: 'Transformers and grid gear across the DC fleet — the multi-year queue every interconnection waits in.',
    keyMetrics: 'Illustrative fleet-wide order allocation',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Illustrative — allocated from disclosed grid-equipment demand',
  },
  {
    id: 'altman-helion', source: 'sam-altman', target: 'helion',
    amountUSD: 375_000_000, dealType: 'Equity', date: '2021-11',
    holdingPeriod: 'Long-term, chairman',
    reasoning: 'The largest personal cheque any AI principal has written — and it went to power, not AI. Altman is hedging the input his own company will run short of.',
    keyMetrics: '$375M personal commitment · Microsoft has a 50 MW PPA with Helion',
    status: 'Active', confidence: 'reported',
    sourceNote: 'Helion Series E disclosure, November 2021',
  },
  {
    id: 'altman-oklo', source: 'sam-altman', target: 'oklo',
    amountUSD: 306_000_000, dealType: 'Equity', date: '2024-05',
    holdingPeriod: 'Public since de-SPAC',
    reasoning: 'Same thesis, fission version: Altman chaired the SPAC that took Oklo public, then stepped down as chairman to clear conflicts as OpenAI began signing power deals.',
    keyMetrics: '~$306M net proceeds via AltC de-SPAC',
    status: 'Closed', confidence: 'reported',
    sourceNote: 'AltC/Oklo merger documents, May 2024',
  },

  // ── State capital ──────────────────────────────────────────────────────
  {
    id: 'usg-tsmc-az', source: 'us-government', target: 'tsmc-arizona',
    amountUSD: 6_600_000_000, dealType: 'Grant', date: '2024-11',
    holdingPeriod: 'Non-dilutive, milestone-based',
    reasoning: 'The grant is small next to TSMC\'s own commitment — its real function is political cover for building leading-edge capacity outside Taiwan.',
    keyMetrics: '$6.6B grant + up to $5B in loans',
    status: 'Active', confidence: 'reported',
    sourceNote: 'CHIPS Act award finalised November 2024',
  },
  {
    id: 'tsmc-arizona-capex', source: 'tsmc', target: 'tsmc-arizona',
    amountUSD: 165_000_000_000, dealType: 'Purchase', date: '2025-03',
    holdingPeriod: 'Multi-year capex programme',
    reasoning: 'The largest single-company reshoring commitment on the map, 25x the state grant that nominally triggered it. Capacity, not subsidy, is what actually moves.',
    keyMetrics: '$165B total US commitment · 6 fabs + packaging + R&D',
    status: 'Announced', confidence: 'reported',
    sourceNote: 'TSMC announcement, March 2025',
  },
  {
    id: 'usg-intel', source: 'us-government', target: 'intel',
    amountUSD: 8_900_000_000, dealType: 'Equity', date: '2025-08',
    holdingPeriod: 'Common equity, ~10%',
    reasoning: 'The precedent worth watching: Washington converted grants into a common-equity stake. If it repeats, state capital stops being subsidy and starts being a shareholder.',
    keyMetrics: '$8.9B for ~10% of Intel',
    status: 'Closed', confidence: 'reported',
    sourceNote: 'US government / Intel announcement, August 2025',
  },

  // ── The individual layer ───────────────────────────────────────────────
  {
    id: 'thiel-ff', source: 'peter-thiel', target: 'founders-fund',
    amountUSD: 1_000_000_000, dealType: 'Equity', date: '2005–2025',
    holdingPeriod: 'GP commitments across funds',
    reasoning: 'Thiel\'s allocation influence runs through the fund, not through direct cheques — the individual node is small, the fund it feeds is large.',
    keyMetrics: 'Cumulative GP commitments · figure approximate',
    status: 'Active', confidence: 'estimate',
    sourceNote: 'Not disclosed; illustrative of the structure rather than the amount',
  },
  {
    id: 'ff-anduril', source: 'founders-fund', target: 'anduril',
    amountUSD: 1_000_000_000, dealType: 'Equity', date: '2025-06',
    holdingPeriod: 'Long-term',
    reasoning: 'A single fund writing $1B into one round is a venture structure behaving like private equity — how defence tech got funded outside the prime-contractor route.',
    keyMetrics: '$1B of a $2.5B Series G · $30.5B valuation',
    status: 'Active', confidence: 'reported',
    sourceNote: 'Anduril Series G announcement, June 2025',
  },
  {
    id: 'huang-osu', source: 'jensen-huang', target: 'osu-innovation-complex',
    amountUSD: 50_000_000, dealType: 'Grant', date: '2020-10',
    holdingPeriod: 'Philanthropic, permanent',
    reasoning: 'Huang\'s personal capital goes to philanthropy; his investment capital is deployed through NVIDIA\'s balance sheet. Useful contrast with Altman, who invests personally in the sectors his company depends on.',
    keyMetrics: '$50M gift from Jen-Hsun and Lori Huang · supercomputing centre',
    status: 'Closed', confidence: 'reported',
    sourceNote: 'Oregon State University announcement, October 2020',
  },
];

// ══════════════════════════════════════════════════════════════════════════
// DERIVATION — everything below is computed. Do not hand-maintain totals.
// ══════════════════════════════════════════════════════════════════════════

// Deterministic per-index jitter so cluster seeding is stable across loads.
function jitter(i, spread) {
  const a = Math.sin(i * 127.1) * 43758.5453;
  const b = Math.sin(i * 311.7) * 12543.8571;
  return [((a - Math.floor(a)) - 0.5) * spread, ((b - Math.floor(b)) - 0.5) * spread];
}

/**
 * Builds the graph payload consumed by the map.
 * Node/link objects are created ONCE and mutated in place by the force
 * engine — callers must memoise this and never rebuild on filter changes.
 */
export function buildGraph(entities = ENTITIES, flows = FLOWS) {
  const byId = new Map(entities.map(e => [e.id, e]));

  const nodes = entities.map((e, i) => {
    const anchor = GROUP_META[e.group]?.anchor || { x: 0, y: 0 };
    const [jx, jy] = jitter(i, 220);
    return {
      ...e,
      color: e.logoOrColor || GROUP_META[e.group]?.color || '#71717a',
      totalInflow: 0, totalOutflow: 0, inflowCount: 0, outflowCount: 0,
      // Seed positions near the group anchor → clusters form instantly and
      // the layout is stable between reloads.
      x: anchor.x + jx, y: anchor.y + jy,
    };
  });
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  const valid = flows.filter(f => {
    const ok = byId.has(f.source) && byId.has(f.target);
    if (!ok && typeof console !== 'undefined') {
      console.warn(`[capitalFlowData] flow "${f.id}" references an unknown entity — skipped`);
    }
    return ok;
  });

  // Fan multiple flows between the same pair apart so nothing overlaps.
  const pairCount = new Map();
  const pairKey = (a, b) => [a, b].sort().join('~');
  valid.forEach(f => {
    const k = pairKey(f.source, f.target);
    pairCount.set(k, (pairCount.get(k) || 0) + 1);
  });
  const pairSeen = new Map();

  const links = valid.map(f => {
    const k = pairKey(f.source, f.target);
    const total = pairCount.get(k);
    const idx = pairSeen.get(k) || 0;
    pairSeen.set(k, idx + 1);
    const curvature = total === 1 ? 0.06 : 0.16 * (idx - (total - 1) / 2) * 2;

    const src = nodeById.get(f.source);
    const tgt = nodeById.get(f.target);
    src.totalOutflow += f.amountUSD; src.outflowCount += 1;
    tgt.totalInflow += f.amountUSD;  tgt.inflowCount += 1;

    return {
      ...f,
      sourceId: f.source, targetId: f.target,
      curvature,
      color: DEAL_TYPE_META[f.dealType]?.color || '#52525b',
    };
  });

  nodes.forEach(n => {
    n.totalFlow = n.totalInflow + n.totalOutflow;
    n.degree = n.inflowCount + n.outflowCount;
  });

  const maxFlow = Math.max(1, ...nodes.map(n => n.totalFlow));
  const maxAmount = Math.max(1, ...links.map(l => l.amountUSD));
  nodes.forEach(n => { n.flowShare = n.totalFlow / maxFlow; });
  links.forEach(l => { l.amountShare = l.amountUSD / maxAmount; });

  const stats = {
    entityCount: nodes.length,
    watchlistCount: nodes.filter(n => n.watchlist).length,
    flowCount: links.length,
    totalTracked: links.reduce((s, l) => s + l.amountUSD, 0),
    largestFlow: links.reduce((a, b) => (a && a.amountUSD > b.amountUSD ? a : b), null),
    reportedShare: links.filter(l => l.confidence === 'reported').length / (links.length || 1),
  };

  return { nodes, links, stats, maxFlow, maxAmount };
}

/** Adjacency lookup: entity id → { inbound: [links], outbound: [links] }. */
export function buildAdjacency(links) {
  const map = new Map();
  const touch = (id) => {
    if (!map.has(id)) map.set(id, { inbound: [], outbound: [] });
    return map.get(id);
  };
  links.forEach(l => {
    touch(l.sourceId).outbound.push(l);
    touch(l.targetId).inbound.push(l);
  });
  map.forEach(v => {
    v.inbound.sort((a, b) => b.amountUSD - a.amountUSD);
    v.outbound.sort((a, b) => b.amountUSD - a.amountUSD);
  });
  return map;
}

export const DISCLAIMER =
  'All figures are illustrative and approximate. Amounts are assembled from public announcements and press reporting; rows marked ESTIMATE are derived from analyst or press estimates rather than disclosed numbers. Not investment advice.';
