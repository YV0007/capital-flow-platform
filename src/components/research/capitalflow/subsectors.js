// ══════════════════════════════════════════════════════════════════════════
// SUB-SECTORS — the second level under a sector ("inside AI Applications, is
// this a security company or a drug-discovery company?").
//
// ⚠ DERIVED DASHBOARD-SIDE. The engine does NOT emit a sub-sector today; it
// emits one `sector` per event (config/rules.yaml § sectors). Everything here
// is inferred from text the payload already carries — the engine's own target
// description when it has one, the dashboard reference file's description
// otherwise, and the entity name as a last resort.
//
// Consequences, which the UI states out loud rather than hiding:
//   · An entity with no description anywhere is UNCLASSIFIED. It is never
//     guessed at from the sector alone — that would just restate the sector.
//   · Coverage is reported as a fraction on every breakdown, so a "biggest
//     sub-trend" is always read against how much of the sector was classifiable.
//
// The durable fix is a `subsector` field on target nodes from the engine; this
// module is the stopgap and should be deleted the day that lands.
// ══════════════════════════════════════════════════════════════════════════

// ── Vehicle type — structural, from the engine's own `cls`. 100% coverage,
// zero inference. Matters because a fund/SPV raising money is not a company
// raising money, and the two get summed into the same sector total.
export const VEHICLE_META = {
  company: { label: 'Операционные компании', blurb: 'Реальный бизнес, привлекающий капитал.', color: '#9D8FD8' },
  fund:    { label: 'Фонды и SPV', blurb: 'Фонды и SPV, привлекающие деньги, чтобы инвестировать дальше, — не операционный бизнес. В основном заявки Form D.', color: '#C9985F' },
  project: { label: 'Проекты и активы',   blurb: 'Именованные стройки, программы и физические активы, а не компании.', color: '#C99B72' },
};

export function vehicleOf(node) {
  if (node.cls === 'fund') return 'fund';
  if (node.cls === 'project' || node.cls === 'asset') return 'project';
  return 'company';
}

// ── Thematic sub-sectors. Deliberately few and broad: a dozen buckets a
// reader can hold in their head beat forty that each hold one company.
export const SUBSECTOR_META = {
  bio_health:      { label: 'Биотех и медицина',       color: '#5FB0A8' },
  defense:         { label: 'Оборона и нацбезопасность', color: '#6E7E9A' },
  security:        { label: 'Кибербезопасность',       color: '#E0857A' },
  robotics:        { label: 'Робототехника',           color: '#8088D6' },
  energy_power:    { label: 'Энергетика',              color: '#49C2AE' },
  compute_infra:   { label: 'Вычисления и инфраструктура', color: '#5A93DE' },
  frontier_models: { label: 'Разработка AI-моделей',   color: '#8E9BE6' },
  data_platform:   { label: 'Данные и аналитика',      color: '#6F93DE' },
  devtools:        { label: 'Инструменты разработчиков', color: '#7C8FD0' },
  fintech:         { label: 'Финансы и финтех',        color: '#45C0D0' },
  industrial:      { label: 'Промышленность и логистика', color: '#C9985F' },
  legal_gov:       { label: 'Право, политика, госсектор', color: '#93A0BC' },
  media_creative:  { label: 'Медиа и креатив',         color: '#B98FD0' },
  science:         { label: 'Наука и материалы',       color: '#58ABCB' },
  consumer_edu:    { label: 'Потребительский сектор и образование', color: '#9DB6EA' },
  agents:          { label: 'AI-агенты и автоматизация', color: '#AEB8EE' },
};

// Ordered rules — FIRST MATCH WINS, so specific before generic.
//
// Tuned for PRECISION, not coverage: every pattern is a phrase that names the
// business ("endpoint-security", "drug discovery", "data center"), not a word
// that merely appears near it. A vague description is left Unclassified on
// purpose — a wrong tag on a company you might buy is far more expensive than
// an honest blank, and the panel reports the blanks.
const RULES = [
  // What the company IS beats what it sells into: a drug-discovery company
  // that trains foundation models is a bio company, and an AI lab that buys
  // data centers is still a lab — hence this order.
  ['bio_health',      /\b(therapeutics?\b|biotech|drug.(discovery|development)|clinical.stage|clinical trial|genomic|oncolog|antibod|pharmaceutical|patient care|diagnostics? (company|platform))/i],
  ['frontier_models', /\b(frontier (ai|model)|ai (research )?lab\b|ai research (company|lab)|research and safety company|model family|open.weight model|world models?|foundation model|superintelligence)/i],
  ['energy_power',    /\b(fuel.cell|battery.storage|home batteries|distributed.energy|renewable energy|solar (operator|developer|project)|community solar|independent power producer|power (plant|producer|generation)|nuclear|reactor|fusion|geothermal|wave.powered|grid (operator|scale))/i],
  ['defense',         /\b(defen[cs]e (startup|company|contractor|tech|primes?|and (space|aerospace))|military|munition|warfight|national security|missile|autonomous weapon|department of defense|\bdod\b)/i],
  ['security',        /\b(cyber ?security|endpoint.security|hardware.security|security company|infosec|sec ?ops|threat detection|malware|ransomware|zero.trust|vulnerabilit|counterfeit)/i],
  ['robotics',        /\b(robot(ics|s)?\b|humanoid|physical.ai|embodied|autonomous.(vehicle|driving)|end.effector|manipulation)/i],
  ['science',         /\b(materials[ -](science|discovery)|computational (biology|chemistry)|scientific discovery|chemistry|climate model|weather model)/i],
  ['compute_infra',   /\b(data ?cent(er|re)|colocation|neocloud|ai.cloud|gpu\b|accelerator|inference hardware|ai hardware|training cluster|semiconductor|foundry|fab\b|chip (design|maker)|memory (technolog|device)|photonic|dielectric|fiber.infrastructure|interconnect)/i],
  ['data_platform',   /\b(data (and ai )?platform|lakehouse|data (warehouse|infrastructure|labeling|labelling|annotation)|vector (database|search)|search engine|knowledge graph|analytics platform|training data|retrieval)/i],
  ['devtools',        /\b(backend platform|backend for|developer (tool|platform)|typescript|software engineer|code (generation|review|assistant)|coding (agent|assistant|model)|devops|codebase|open.source framework)/i],
  ['fintech',         /\b(financial.management|bookkeep|payments? (platform|company)|banking|lending|underwrit|private credit|reconciliation|accounting|invoic|capital markets|treasury|quickbooks)/i],
  ['industrial',      /\b(advanced.manufacturing|manufactur|supply chain|logistics|freight|trucking|construction|industrial.ai|factor(y|ies)|machining|aerospace|electric.vehicle|procurement|commerce)/i],
  ['legal_gov',       /\b(legal.ai|law firm|litigation|contract (review|analysis)|regulatory (intelligence|ai)|compliance (platform|ai)|legislat|public sector|government affairs|policy (and regulatory )?intelligence)/i],
  ['media_creative',  /\b(video.game (publisher|studio)|game (studio|publisher)|video (generation|model)|image (generation|model)|filmmak|animation|music|advertis|creative (tool|suite))/i],
  ['consumer_edu',    /\b(consumer app|social network|dating|e.commerce|education|workforce skill|skills? (assessment|benchmark)|tutor|student|course)/i],
  // Broadest rule last: nothing specific matched, but the text clearly names an
  // agent/automation product.
  ['agents',          /\b(ai agents?\b|agentic|copilot|workflow automation|automates? (the )?(back.office|workflow|process)|computer.use)/i],
];

// Name-only patterns. Deliberately tiny and unambiguous — used only when there
// is no description at all. "Neo Security" is a security company; "Convex"
// tells us nothing and stays unclassified.
const NAME_RULES = [
  ['security',     /\b(security|cyber\w*)\b/i],
  ['bio_health',   /\b(therapeutics?|biosciences?|biotech\w*|pharma\w*)\b/i],
  ['defense',      /\b(defense|defence|munitions|warfare)\b/i],
  ['robotics',     /\b(robotics?|humanoid)\b/i],
  ['energy_power', /\b(atomics?|fusion|nuclear|solar|power|energy)\b/i],
];

/**
 * Sub-sector for one target node.
 * Returns { key, label, color, basis } where basis is 'description' (strong),
 * 'name' (weak, flagged in the UI) or null when unclassified.
 */
export function subsectorOf(node) {
  const desc = (node?.description || '').trim();
  if (desc) {
    for (const [key, re] of RULES) {
      if (re.test(desc)) return { key, ...SUBSECTOR_META[key], basis: 'description' };
    }
  }
  const name = (node?.name || node?.label || '').trim();
  if (name) {
    for (const [key, re] of NAME_RULES) {
      if (re.test(name)) return { key, ...SUBSECTOR_META[key], basis: 'name' };
    }
  }
  return { key: null, label: 'Без категории', color: '#52525b', basis: null };
}

/**
 * Group a list of target nodes into sub-sectors, with the honest coverage
 * fraction attached. `capitalOf` lets the caller weight by sector-scoped
 * capital rather than the node's lifetime total.
 */
export function subsectorBreakdown(nodes, capitalOf = (n) => n.capital || 0) {
  const buckets = new Map();
  let classified = 0;
  let weak = 0;
  nodes.forEach(n => {
    const s = subsectorOf(n);
    if (s.key) classified += 1;
    if (s.basis === 'name') weak += 1;
    const k = s.key || '_none';
    if (!buckets.has(k)) {
      buckets.set(k, { key: s.key, label: s.label, color: s.color, count: 0, capital: 0, members: [] });
    }
    const b = buckets.get(k);
    b.count += 1;
    b.capital += capitalOf(n);
    b.members.push(n);
  });
  const rows = [...buckets.values()].sort((a, b) => {
    if (!a.key) return 1;                    // Unclassified always last
    if (!b.key) return -1;
    return b.capital - a.capital || b.count - a.count;
  });
  return {
    rows,
    coverage: { classified, weak, total: nodes.length },
  };
}

/**
 * Group target nodes by vehicle type (company / fund / project).
 */
export function vehicleBreakdown(nodes, capitalOf = (n) => n.capital || 0) {
  const buckets = new Map();
  nodes.forEach(n => {
    const k = vehicleOf(n);
    if (!buckets.has(k)) buckets.set(k, { key: k, ...VEHICLE_META[k], count: 0, capital: 0, members: [] });
    const b = buckets.get(k);
    b.count += 1;
    b.capital += capitalOf(n);
    b.members.push(n);
  });
  return [...buckets.values()].sort((a, b) => b.capital - a.capital || b.count - a.count);
}
