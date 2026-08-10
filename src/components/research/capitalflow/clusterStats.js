// ══════════════════════════════════════════════════════════════════════════
// CLUSTER STATS — the numbers behind the cluster report.
//
// One cluster = either a SECTOR cell (where capital lands) or an ALLOCATOR
// CLASS island (who deploys it). Both reports answer the same four questions:
//   1. how much money, in how many deals, from how many hands
//   2. who dominates it — by class, then by name
//   3. where it actually lands — and in what kind of vehicle
//   4. which way it is moving — last 30 days against the 30 before
//
// BASIS — stated here once and surfaced in the panel, never left implicit:
//   · Headline capital/deals count CONFIRMED flows only (verified +
//     verified α), matching the engine's own `aggregates.basis`. Candidate
//     (unconfirmed) flows are reported separately, never mixed in.
//   · Undisclosed amounts count as $0 — they inflate deal counts, not dollars.
//   · Windows are measured against the payload's `generated` date, not wall
//     clock: the file is a snapshot, so "last 30 days" must mean the snapshot's.
//   · Nothing is estimated. A number the payload does not support is null and
//     the panel says so.
// ══════════════════════════════════════════════════════════════════════════

import { CLASS_META, SECTOR_META, sectorLabel, AGGREGATES } from '../../../data/capitalMap.js';
import { subsectorBreakdown, vehicleBreakdown } from './subsectors.js';

const WINDOW_DAYS = 30;

const isConfirmed = (l) => l.status === 'verified' || l.status === 'verified_alpha';

function daysBefore(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function median(list) {
  if (!list.length) return null;
  const s = [...list].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Sum of confirmed disclosed amounts + the counts that go with them.
function rollup(flows) {
  const confirmed = flows.filter(isConfirmed);
  const disclosed = confirmed.filter(f => f.disclosed);
  return {
    capital: disclosed.reduce((s, f) => s + f.amountUSD, 0),
    deals: confirmed.length,
    disclosedDeals: disclosed.length,
    undisclosedDeals: confirmed.length - disclosed.length,
    candidateDeals: flows.length - confirmed.length,
    candidateCapital: flows.filter(f => !isConfirmed(f) && f.disclosed)
      .reduce((s, f) => s + f.amountUSD, 0),
    medianTicket: median(disclosed.map(f => f.amountUSD)),
    largest: disclosed.length
      ? disclosed.reduce((a, b) => (b.amountUSD > a.amountUSD ? b : a))
      : null,
  };
}

// Momentum: the last WINDOW_DAYS against the WINDOW_DAYS before them, both
// measured from the payload date.
function momentum(flows, generated) {
  const t0 = daysBefore(generated, WINDOW_DAYS);
  const t1 = daysBefore(generated, WINDOW_DAYS * 2);
  if (!t0 || !t1) return null;
  const confirmed = flows.filter(isConfirmed);
  const recent = confirmed.filter(f => f.date && f.date > t0);
  const prior = confirmed.filter(f => f.date && f.date > t1 && f.date <= t0);
  const cap = (l) => l.filter(f => f.disclosed).reduce((s, f) => s + f.amountUSD, 0);
  const rc = cap(recent), pc = cap(prior);
  return {
    windowDays: WINDOW_DAYS,
    since: t0,
    recentDeals: recent.length, recentCapital: rc,
    priorDeals: prior.length, priorCapital: pc,
    dealDelta: prior.length ? (recent.length - prior.length) / prior.length : null,
    capitalDelta: pc ? (rc - pc) / pc : null,
    recent,
  };
}

// Group flows by a key, sum confirmed capital, return sorted rows.
function groupBy(flows, keyOf) {
  const m = new Map();
  flows.filter(isConfirmed).forEach(f => {
    const k = keyOf(f);
    if (k == null) return;
    if (!m.has(k)) m.set(k, { key: k, capital: 0, deals: 0, flows: [] });
    const g = m.get(k);
    if (f.disclosed) g.capital += f.amountUSD;
    g.deals += 1;
    g.flows.push(f);
  });
  return [...m.values()].sort((a, b) => b.capital - a.capital || b.deals - a.deals);
}

// Share of the whole tracked map, so a sector total has a denominator.
function totalConfirmedCapital(links) {
  return links.filter(l => isConfirmed(l) && l.disclosed).reduce((s, l) => s + l.amountUSD, 0);
}

// ── Sector report ────────────────────────────────────────────────────────
export function buildSectorReport(sectorKey, { nodes, links, nodeById, generated, sectors }) {
  const flows = links.filter(l => l.sector === sectorKey);
  const meta = SECTOR_META[sectorKey] || {};
  const head = rollup(flows);
  const mom = momentum(flows, generated);
  // All-disclosed total, summed exactly like the map bubble (node.capital over
  // the sector's recipients) so the report headline matches the canvas figure.
  const disclosedTotal = nodes
    .filter(n => n.sector === sectorKey)
    .reduce((s, n) => s + (n.capital || 0), 0);

  // Who funds it — by allocator class, then by name.
  const byClass = groupBy(flows, f => nodeById.get(f.sourceId)?.cls).map(g => ({
    ...g,
    label: CLASS_META[g.key]?.zone || CLASS_META[g.key]?.label || g.key,
    money: CLASS_META[g.key]?.money || null,
    color: CLASS_META[g.key]?.color || '#71717a',
    blurb: CLASS_META[g.key]?.blurb || null,
    allocators: new Set(g.flows.map(f => f.sourceId)).size,
  }));
  const byAllocator = groupBy(flows, f => f.sourceId).map(g => ({
    ...g,
    node: nodeById.get(g.key),
    biggest: g.flows.filter(f => f.disclosed).sort((a, b) => b.amountUSD - a.amountUSD)[0] || null,
  }));
  // Where it lands.
  const byRecipient = groupBy(flows, f => f.targetId).map(g => ({
    ...g,
    node: nodeById.get(g.key),
    investors: new Set(g.flows.map(f => f.sourceId)).size,
    biggest: g.flows.filter(f => f.disclosed).sort((a, b) => b.amountUSD - a.amountUSD)[0] || null,
  }));

  // Deeper breakdown — vehicle type (structural) then sub-sector (derived).
  const capBySectorFlows = new Map();
  flows.filter(f => isConfirmed(f) && f.disclosed).forEach(f => {
    capBySectorFlows.set(f.targetId, (capBySectorFlows.get(f.targetId) || 0) + f.amountUSD);
  });
  const recipientNodes = byRecipient.map(r => r.node).filter(Boolean);
  const capitalOf = (n) => capBySectorFlows.get(n.id) || 0;
  const vehicles = vehicleBreakdown(recipientNodes, capitalOf);
  const operating = recipientNodes.filter(n => n.cls === 'private' || n.cls === 'public');
  const sub = subsectorBreakdown(operating, capitalOf);

  // Rank against every other sector, on the same basis.
  const allSectors = groupBy(links, f => f.sector);
  const position = allSectors.findIndex(s => s.key === sectorKey);
  const total = totalConfirmedCapital(links);

  // New money: allocators whose FIRST confirmed flow into this sector falls in
  // the recent window — i.e. they were not here a month ago.
  const firstBySource = new Map();
  flows.filter(isConfirmed).forEach(f => {
    const prev = firstBySource.get(f.sourceId);
    if (!prev || (f.date && f.date < prev)) firstBySource.set(f.sourceId, f.date);
  });
  const newEntrants = mom
    ? [...firstBySource.entries()]
        .filter(([, d]) => d && d > mom.since)
        .map(([id]) => nodeById.get(id))
        .filter(Boolean)
        .sort((a, b) => (b.capital || 0) - (a.capital || 0))
    : [];

  const sectorBlock = sectors?.[sectorKey] || null;

  return {
    kind: 'sector',
    key: sectorKey,
    label: sectorLabel(sectorKey),
    color: meta.color || '#71717a',
    blurb: meta.blurb || null,
    outsideAiStack: ['gaming', 'ev-automotive', 'private-credit', 'diversified-pe'].includes(sectorKey),
    head,
    disclosedTotal,
    allocators: new Set(flows.filter(isConfirmed).map(f => f.sourceId)).size,
    recipients: byRecipient.length,
    rank: position >= 0 ? { position: position + 1, of: allSectors.length } : null,
    shareOfTracked: total ? head.capital / total : null,
    byClass,
    dominant: byClass[0] || null,
    topAllocators: byAllocator.slice(0, 3),
    allAllocators: byAllocator,
    topRecipients: byRecipient.slice(0, 5),
    allRecipients: byRecipient,
    momentum: mom,
    newEntrants,
    breakdown: { vehicles, subsectors: sub.rows, coverage: sub.coverage, operatingCount: operating.length },
    signals: sectorBlock?.signals || [],
    read: composeSectorRead({ label: sectorLabel(sectorKey), head, byClass, byAllocator, mom, vehicles, sub, newEntrants }),
  };
}

// ── Allocator-class report ───────────────────────────────────────────────
export function buildClassReport(classKey, { nodes, links, nodeById, generated }) {
  const members = nodes.filter(n => n.kind === 'allocator' && n.cls === classKey);
  const memberIds = new Set(members.map(n => n.id));
  const flows = links.filter(l => memberIds.has(l.sourceId));
  const meta = CLASS_META[classKey] || {};
  const head = rollup(flows);
  const mom = momentum(flows, generated);
  // All-disclosed total, summed like the map island (node.capital over the
  // class's members) so the report headline matches the canvas figure.
  const disclosedTotal = members.reduce((s, n) => s + (n.capital || 0), 0);

  const bySector = groupBy(flows, f => f.sector).map(g => ({
    ...g,
    label: sectorLabel(g.key),
    color: SECTOR_META[g.key]?.color || '#71717a',
    blurb: SECTOR_META[g.key]?.blurb || null,
    recipients: new Set(g.flows.map(f => f.targetId)).size,
  }));
  const byAllocator = groupBy(flows, f => f.sourceId).map(g => ({
    ...g,
    node: nodeById.get(g.key),
    sectors: [...new Set(g.flows.map(f => f.sector).filter(Boolean))],
    biggest: g.flows.filter(f => f.disclosed).sort((a, b) => b.amountUSD - a.amountUSD)[0] || null,
  }));
  const byRecipient = groupBy(flows, f => f.targetId).map(g => ({
    ...g,
    node: nodeById.get(g.key),
    investors: new Set(g.flows.map(f => f.sourceId)).size,
  }));

  // Vehicle + sub-sector split of where this class's money went.
  const capByTarget = new Map();
  flows.filter(f => isConfirmed(f) && f.disclosed).forEach(f => {
    capByTarget.set(f.targetId, (capByTarget.get(f.targetId) || 0) + f.amountUSD);
  });
  const recipientNodes = byRecipient.map(r => r.node).filter(Boolean);
  const capitalOf = (n) => capByTarget.get(n.id) || 0;
  const vehicles = vehicleBreakdown(recipientNodes, capitalOf);
  const operating = recipientNodes.filter(n => n.cls === 'private' || n.cls === 'public');
  const sub = subsectorBreakdown(operating, capitalOf);

  // Rank against the other allocator classes.
  const allClasses = groupBy(links, f => nodeById.get(f.sourceId)?.cls);
  const position = allClasses.findIndex(c => c.key === classKey);
  const total = totalConfirmedCapital(links);

  // Sectors this class entered only inside the recent window.
  const firstBySector = new Map();
  flows.filter(isConfirmed).forEach(f => {
    if (!f.sector) return;
    const prev = firstBySector.get(f.sector);
    if (!prev || (f.date && f.date < prev)) firstBySector.set(f.sector, f.date);
  });
  const newSectors = mom
    ? [...firstBySector.entries()].filter(([, d]) => d && d > mom.since).map(([k]) => k)
    : [];

  // Concentration — how much of the class is one or two names.
  const topShare = head.capital && byAllocator.length
    ? byAllocator[0].capital / head.capital : null;
  const top3Share = head.capital
    ? byAllocator.slice(0, 3).reduce((s, a) => s + a.capital, 0) / head.capital : null;

  return {
    kind: 'class',
    key: classKey,
    label: meta.zone || meta.label || classKey,
    color: meta.color || '#71717a',
    blurb: meta.blurb || null,
    head,
    disclosedTotal,
    memberCount: members.length,
    activeCount: byAllocator.length,
    recipients: byRecipient.length,
    rank: position >= 0 ? { position: position + 1, of: allClasses.length } : null,
    shareOfTracked: total ? head.capital / total : null,
    bySector,
    dominant: bySector[0] || null,
    topAllocators: byAllocator.slice(0, 3),
    allAllocators: byAllocator,
    topRecipients: byRecipient.slice(0, 5),
    momentum: mom,
    newSectors,
    concentration: { topShare, top3Share },
    breakdown: { vehicles, subsectors: sub.rows, coverage: sub.coverage, operatingCount: operating.length },
    read: composeClassRead({ label: meta.label || classKey, head, bySector, byAllocator, mom, topShare, top3Share, newSectors, vehicles }),
  };
}

// ── The read ─────────────────────────────────────────────────────────────
// Composed strictly from the numbers computed above — templates filled with
// facts, never a claim the payload does not carry. Labelled in the UI as
// derived, so it is never mistaken for the engine's own research.
const pct = (x) => `${Math.round(x * 100)}%`;
const usd = (v) => {
  const a = Math.abs(v);
  if (a >= 1e12) return `$${(v / 1e12).toFixed(2)} трлн`;
  if (a >= 1e9) return `$${(v / 1e9).toFixed(1)} млрд`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(0)} млн`;
  return `$${Math.round(v)}`;
};
// Russian plural: ru(3, 'сделка','сделки','сделок') → 'сделки'.
const ru = (n, one, few, many) => {
  const a = Math.abs(Math.round(n)), d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
};
const deals = (n) => `${n} ${ru(n, 'сделка', 'сделки', 'сделок')}`;

function composeSectorRead({ label, head, byClass, byAllocator, mom, vehicles, sub, newEntrants }) {
  const out = [];
  if (byClass.length && head.deals) {
    const d = byClass[0];
    const dealShare = d.deals / head.deals;
    const capShare = head.capital ? d.capital / head.capital : null;
    out.push(
      `В секторе «${label}» доминируют ${d.money || d.label.toLowerCase()}: ${d.deals} из ${head.deals} подтверждённых сделок (${pct(dealShare)})` +
      (capShare != null ? ` и ${pct(capShare)} раскрытых денег` : '') + '.'
    );
  }
  if (byAllocator.length >= 3 && head.capital) {
    const t3 = byAllocator.slice(0, 3).reduce((s, a) => s + a.capital, 0) / head.capital;
    out.push(`Сектор концентрированный — на тройку крупнейших инвесторов приходится ${pct(t3)} капитала.`);
  }
  if (mom && (mom.recentDeals || mom.priorDeals)) {
    const dir = mom.recentDeals > mom.priorDeals ? 'растёт'
      : mom.recentDeals < mom.priorDeals ? 'остывает' : 'держится ровно';
    out.push(
      `Активность ${dir}: ${deals(mom.recentDeals)} на ${usd(mom.recentCapital)} за последние ${mom.windowDays} дней ` +
      `против ${mom.priorDeals} на ${usd(mom.priorCapital)} в предыдущие ${mom.windowDays}.`
    );
  }
  const fundRow = vehicles.find(v => v.key === 'fund');
  const totalRecipients = vehicles.reduce((s, v) => s + v.count, 0);
  if (fundRow && totalRecipients && fundRow.count / totalRecipients >= 0.35) {
    out.push(
      `Читайте заголовок внимательно: ${fundRow.count} из ${totalRecipients} получателей здесь — фонды и SPV, ` +
      `а не операционные компании. Это деньги, собранные чтобы инвестировать, а не деньги, дошедшие до бизнеса.`
    );
  }
  const topSub = sub.rows.find(r => r.key);
  if (topSub && sub.coverage.classified) {
    out.push(
      `Среди операционных компаний самый заметный подсектор — «${topSub.label}» ` +
      `(${topSub.count} ${ru(topSub.count, 'компания', 'компании', 'компаний')}${topSub.capital ? `, ${usd(topSub.capital)}` : ''}). ` +
      `Определено по описаниям ${sub.coverage.classified} из ${sub.coverage.total} компаний в данных.`
    );
  }
  if (newEntrants.length) {
    out.push(
      `Инвесторы, у которых раньше не было отслеженных сделок в этом секторе: ` +
      `${newEntrants.slice(0, 4).map(n => n.name).join(', ')}` +
      `${newEntrants.length > 4 ? ` и ещё ${newEntrants.length - 4}` : ''}.`
    );
  }
  if (head.candidateDeals) {
    out.push(
      `Ещё ${head.candidateDeals} ${ru(head.candidateDeals, 'поток', 'потока', 'потоков')} не ${head.candidateDeals === 1 ? 'подтверждён' : 'подтверждены'}` +
      (head.candidateCapital ? ` (заявлено ${usd(head.candidateCapital)})` : '') +
      ' — они не входят ни в одну цифру выше.'
    );
  }
  return out;
}

function composeClassRead({ label, head, bySector, byAllocator, mom, topShare, top3Share, newSectors, vehicles }) {
  const out = [];
  if (bySector.length && head.capital) {
    const d = bySector[0];
    out.push(
      `Капитал класса «${label}» концентрируется в секторе «${d.label}»: ${usd(d.capital)} в ${d.deals} ` +
      `${ru(d.deals, 'сделке', 'сделках', 'сделках')} — ${pct(d.capital / head.capital)} всего, что вложил класс.`
    );
    if (bySector.length > 1) {
      out.push(`Следом: ${bySector.slice(1, 4).map(s => `«${s.label}» ${usd(s.capital)}`).join(' · ')}.`);
    }
  }
  if (topShare != null && byAllocator.length) {
    out.push(
      `${byAllocator[0].node?.name || 'Крупнейший инвестор'} в одиночку даёт ${pct(topShare)} класса` +
      (top3Share != null ? `, а тройка крупнейших — ${pct(top3Share)}` : '') +
      ` — по сути, «${label}» здесь — это несколько балансов.`
    );
  }
  if (mom && (mom.recentDeals || mom.priorDeals)) {
    const dir = mom.recentDeals > mom.priorDeals ? 'набирают темп'
      : mom.recentDeals < mom.priorDeals ? 'замедляются' : 'держат темп';
    out.push(
      `Они ${dir}: ${deals(mom.recentDeals)} на ${usd(mom.recentCapital)} за последние ${mom.windowDays} дней ` +
      `против ${mom.priorDeals} на ${usd(mom.priorCapital)} ранее.`
    );
  }
  if (newSectors.length) {
    out.push(
      `Секторы, где у класса раньше не было отслеженных сделок: ` +
      `${newSectors.map(sectorLabel).join(', ')} — следите за продолжением. ` +
      `(Оценка в пределах короткой истории самих данных.)`
    );
  }
  const fundRow = vehicles.find(v => v.key === 'fund');
  if (fundRow && fundRow.count >= 3) {
    out.push(`${fundRow.count} получателей — собственные фонды и SPV этого класса, а не операционные компании.`);
  }
  if (head.undisclosedDeals) {
    out.push(`У ${head.undisclosedDeals} подтверждённых ${ru(head.undisclosedDeals, 'сделки', 'сделок', 'сделок')} сумма не раскрыта, поэтому долларовые цифры занижают реальную активность.`);
  }
  return out;
}

// The engine's own cycle-level ranking, if it covers this sector. Shown beside
// our computation so a mismatch is visible rather than silently reconciled.
export function engineSectorRank(sectorKey) {
  const ranked = AGGREGATES?.top_sector?.ranked;
  if (!Array.isArray(ranked)) return null;
  const i = ranked.findIndex(r => r.sector === sectorKey);
  if (i < 0) return null;
  return { position: i + 1, of: ranked.length, row: ranked[i], basis: AGGREGATES.top_sector.basis || null };
}
