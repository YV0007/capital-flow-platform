// ══════════════════════════════════════════════════════════════════════════
// digest.js — the Flow Digest builders.
//
// Turns the current map into time-windowed briefings — a week, a month, and
// the whole map — computed purely from each flow's `date`, anchored at
// META.generated. No history, no backend: everything here is derived from the
// single payload that is already loaded.
//
// Same money basis as the cluster reports (clusterStats.js): dollar rankings
// use confirmed (verified / verified_alpha) flows with a disclosed amount;
// candidate flows are counted separately and never folded into a $ headline.
// ══════════════════════════════════════════════════════════════════════════

import { sectorLabel, SECTOR_META, CLASS_META } from '../../../data/capitalMap.js';
import { fmtUSD, plural } from './format.js';
import { getLang } from '../../../lib/i18n.jsx';

const isConfirmed = (l) => l.status === 'verified' || l.status === 'verified_alpha';

export function daysBefore(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const pct = (x) => (x == null ? null : `${Math.round(x * 100)}%`);

// Flows whose date sits in (gen − fromDays, gen − toDays].
function windowFlows(links, gen, fromDays, toDays = 0) {
  const from = daysBefore(gen, fromDays);
  const to = toDays ? daysBefore(gen, toDays) : gen;
  if (!from) return [];
  return links.filter(l => l.date && l.date > from && l.date <= to);
}

// Group flows by a key, sum confirmed-disclosed capital, return sorted rows.
function topBy(flows, keyOf, nodeById, limit = 5) {
  const m = new Map();
  flows.filter(isConfirmed).forEach(f => {
    const k = keyOf(f);
    if (k == null) return;
    if (!m.has(k)) m.set(k, { key: k, capital: 0, deals: 0 });
    const g = m.get(k);
    if (f.disclosed) g.capital += f.amountUSD;
    g.deals += 1;
  });
  return [...m.values()]
    .map(g => ({ ...g, node: nodeById.get(g.key) }))
    .sort((a, b) => b.capital - a.capital || b.deals - a.deals)
    .slice(0, limit);
}

function topSectors(flows, limit = 5) {
  const m = new Map();
  let total = 0;
  flows.filter(f => isConfirmed(f) && f.disclosed).forEach(f => {
    const k = f.sector || '_none';
    m.set(k, (m.get(k) || 0) + f.amountUSD);
    total += f.amountUSD;
  });
  return {
    total,
    rows: [...m.entries()]
      .map(([key, capital]) => ({ key, capital, share: total ? capital / total : 0 }))
      .sort((a, b) => b.capital - a.capital)
      .slice(0, limit),
  };
}

// Confirmed-disclosed sum + counts for a set of flows.
function totals(flows) {
  const confirmed = flows.filter(isConfirmed);
  const disclosed = confirmed.filter(f => f.disclosed);
  const candidates = flows.filter(f => !isConfirmed(f));
  return {
    capital: disclosed.reduce((s, f) => s + f.amountUSD, 0),
    deals: confirmed.length,
    candidateDeals: candidates.length,
    candidateCapital: candidates.filter(f => f.disclosed).reduce((s, f) => s + f.amountUSD, 0),
  };
}

// The single biggest confirmed-disclosed flow in the set.
function biggestDeal(flows, nodeById) {
  const d = flows.filter(f => isConfirmed(f) && f.disclosed);
  if (!d.length) return null;
  const f = d.reduce((a, b) => (b.amountUSD > a.amountUSD ? b : a));
  return {
    amount: f.amountUSD,
    source: nodeById.get(f.sourceId),
    target: nodeById.get(f.targetId),
    sector: f.sector,
  };
}

// Sources whose FIRST confirmed flow anywhere lands inside this window — money
// that was not on the map before it.
function newEntrants(windowSet, allLinks, nodeById, limit = 6) {
  const first = new Map();
  allLinks.filter(isConfirmed).forEach(f => {
    const prev = first.get(f.sourceId);
    if (!prev || (f.date && f.date < prev)) first.set(f.sourceId, f.date);
  });
  const inWin = new Set(windowSet.map(f => f.date && f.date));
  const winDates = windowSet.map(f => f.date).filter(Boolean);
  const lo = winDates.length ? winDates.reduce((a, b) => (a < b ? a : b)) : null;
  const hi = winDates.length ? winDates.reduce((a, b) => (a > b ? a : b)) : null;
  if (!lo) return [];
  const ids = new Set(windowSet.map(f => f.sourceId));
  return [...ids]
    .filter(id => { const d = first.get(id); return d && d >= lo && d <= hi; })
    .map(id => nodeById.get(id))
    .filter(Boolean)
    .sort((a, b) => (b.capital || 0) - (a.capital || 0))
    .slice(0, limit);
}

// Which sector layer the money moved toward vs the window before it. Returns a
// short phrase or null when there's nothing worth calling out.
function sectorShift(cur, prev) {
  const en = getLang() === 'en';
  const top = cur.rows[0];
  if (!top) return null;
  const prevTop = prev.rows[0];
  const topLabel = top.key === '_none' ? (en ? 'no sector' : 'без сектора') : sectorLabel(top.key);
  if (!prevTop || prevTop.key === top.key) {
    return en
      ? `${topLabel} leads — ${pct(top.share)} of the week's inflow.`
      : `Лидирует «${topLabel}» — ${pct(top.share)} недельного притока.`;
  }
  const prevLabel = prevTop.key === '_none' ? (en ? 'no sector' : 'без сектора') : sectorLabel(prevTop.key);
  return en
    ? `Focus moved to ${topLabel} — ${prevLabel} led before it.`
    : `Фокус сместился в «${topLabel}» — до этого вёл «${prevLabel}».`;
}

function deltaPhrase(cur, prev, unit) {
  const en = getLang() === 'en';
  const ago = en ? (unit === 'неделей' ? 'a week earlier' : 'a month earlier') : `${unit} ранее`;
  if (!prev || !prev.capital) return null;
  if (!cur.capital) return en ? `against ${fmtUSD(prev.capital)} ${ago}` : `против ${fmtUSD(prev.capital)} ${ago}`;
  const d = (cur.capital - prev.capital) / prev.capital;
  if (Math.abs(d) < 0.05) return en ? `about the same as ${ago}` : `примерно столько же, сколько ${ago}`;
  if (en) return d > 0 ? `${pct(d)} more than ${ago}` : `${pct(-d)} less than ${ago}`;
  return d > 0 ? `на ${pct(d)} больше, чем ${ago}` : `на ${pct(-d)} меньше, чем ${ago}`;
}

const names = (rows, n = 3) => rows.slice(0, n).map(r => r.node?.name).filter(Boolean);

// Share of confirmed-disclosed capital per sector — full map, for rotation.
function sectorShareMap(flows) {
  const m = new Map();
  let total = 0;
  flows.filter(f => isConfirmed(f) && f.disclosed).forEach(f => {
    const k = f.sector || '_none';
    m.set(k, (m.get(k) || 0) + f.amountUSD);
    total += f.amountUSD;
  });
  const shares = new Map();
  m.forEach((capital, k) => shares.set(k, { capital, share: total ? capital / total : 0 }));
  return { shares, total };
}

// Where the money is rotating vs the window before: sectors that gained or lost
// share, in percentage points. Needs a prior window; noise under ±1pp is dropped.
function sectorRotation(cur, prior) {
  if (!prior || !cur.total || !prior.total) return null;
  const keys = new Set([...cur.shares.keys(), ...prior.shares.keys()]);
  const rows = [];
  keys.forEach(k => {
    const c = cur.shares.get(k)?.share || 0;
    const p = prior.shares.get(k)?.share || 0;
    const deltaPP = (c - p) * 100;
    if (Math.abs(deltaPP) < 1) return;
    rows.push({
      key: k, deltaPP, curShare: c,
      label: k === '_none' ? (getLang() === 'en' ? 'No sector' : 'Без сектора') : sectorLabel(k),
      color: SECTOR_META[k]?.color || '#71717a',
    });
  });
  const gained = rows.filter(r => r.deltaPP > 0).sort((a, b) => b.deltaPP - a.deltaPP).slice(0, 3);
  const lost = rows.filter(r => r.deltaPP < 0).sort((a, b) => a.deltaPP - b.deltaPP).slice(0, 3);
  return (gained.length || lost.length) ? { gained, lost } : null;
}

// Which kind of money is driving the window — allocator class mix.
function classMix(flows, nodeById) {
  const m = new Map();
  let total = 0;
  flows.filter(f => isConfirmed(f) && f.disclosed).forEach(f => {
    const cls = nodeById.get(f.sourceId)?.cls;
    if (!cls) return;
    m.set(cls, (m.get(cls) || 0) + f.amountUSD);
    total += f.amountUSD;
  });
  return {
    total,
    rows: [...m.entries()]
      .map(([cls, capital]) => ({
        cls, capital, share: total ? capital / total : 0,
        label: CLASS_META[cls]?.zone || CLASS_META[cls]?.label || cls,
        color: CLASS_META[cls]?.color || '#71717a',
      }))
      .sort((a, b) => b.capital - a.capital),
  };
}

// How top-heavy the window is: what share the biggest deals carry, and how few
// deals it takes to reach half the capital.
function concentration(flows) {
  const d = flows.filter(f => isConfirmed(f) && f.disclosed)
    .map(f => f.amountUSD).sort((a, b) => b - a);
  const total = d.reduce((s, x) => s + x, 0);
  if (!total || d.length < 2) return null;
  const top3 = d.slice(0, 3).reduce((s, x) => s + x, 0);
  let acc = 0, half = 0;
  for (const x of d) { acc += x; half += 1; if (acc >= total * 0.5) break; }
  const top3Share = top3 / total;
  const en = getLang() === 'en';
  const mood = top3Share >= 0.6
    ? (en ? 'concentrated' : 'сконцентрирован')
    : top3Share <= 0.35
      ? (en ? 'spread wide' : 'распределён широко')
      : (en ? 'moderately spread' : 'умеренно распределён');
  return { top3Share, dealsToHalf: half, dealCount: d.length, mood };
}

// Build one window block.
function buildBlock({ flows, prior, allLinks, nodeById, gen, id, title, sub, unit }) {
  const head = totals(flows);
  const priorHead = prior ? totals(prior) : null;
  const confirmedFlows = flows.filter(isConfirmed);
  const uniqueInvestors = new Set(confirmedFlows.map(f => f.sourceId)).size;
  const uniqueBeneficiaries = new Set(confirmedFlows.map(f => f.targetId)).size;
  const investors = topBy(flows, f => f.sourceId, nodeById);
  const beneficiaries = topBy(flows, f => f.targetId, nodeById);
  const sectors = topSectors(flows);
  const priorSectors = prior ? topSectors(prior) : { rows: [] };
  const biggest = biggestDeal(flows, nodeById);
  const entrants = prior ? newEntrants(flows, allLinks, nodeById) : [];
  const rotation = sectorRotation(sectorShareMap(flows), prior ? sectorShareMap(prior) : null);
  const mix = classMix(flows, nodeById);
  const priorMix = prior ? classMix(prior, nodeById) : null;
  const conc = concentration(flows);

  const read = [];
  const en = getLang() === 'en';
  if (head.deals || head.capital) {
    const delta = unit ? deltaPhrase(head, priorHead, unit) : null;
    read.push(en
      ? `${title}: ${fmtUSD(head.capital)} disclosed across ${head.deals} ` +
        `${head.deals === 1 ? 'deal' : 'deals'}${delta ? ` — ${delta}` : ''}.`
      : `${title}: раскрыто ${fmtUSD(head.capital)} в ${head.deals} ` +
        `${plural(head.deals, ['сделке', 'сделках', 'сделках'])}` +
        `${delta ? ` — ${delta}` : ''}.`);
    const inv = names(investors);
    if (inv.length) read.push(en
      ? `Largest sources — ${inv.join(', ')}.`
      : `Крупнейшие источники — ${inv.join(', ')}.`);
    const ben = names(beneficiaries);
    if (ben.length) read.push(en
      ? `Most of it went to ${ben.join(', ')}.`
      : `Больше всего получили ${ben.join(', ')}.`);
    if (mix.rows.length) {
      const lead = mix.rows[0];
      const priorLead = priorMix?.rows.find(r => r.cls === lead.cls);
      const dp = priorLead ? Math.round((lead.share - priorLead.share) * 100) : null;
      const tail = dp != null && Math.abs(dp) >= 3
        ? (en ? ` (${dp > 0 ? '+' : ''}${dp} pp vs the previous window)`
              : ` (${dp > 0 ? '+' : ''}${dp} п.п. к прошлому окну)`)
        : '';
      read.push(en
        ? `Mostly driven by ${lead.label.toLowerCase()} — ${pct(lead.share)} of the inflow${tail}.`
        : `Двигают в основном ${lead.label.toLowerCase()} — ${pct(lead.share)} притока${tail}.`);
    }
    if (rotation) {
      const g = rotation.gained.map(r => (en ? r.label : `«${r.label}»`)).join(', ');
      const l = rotation.lost.map(r => (en ? r.label : `«${r.label}»`)).join(', ');
      if (g && l) read.push(en ? `Focus is rotating into ${g} and out of ${l}.` : `Фокус смещается в ${g} и уходит из ${l}.`);
      else if (g) read.push(en ? `Focus is rotating into ${g}.` : `Фокус смещается в ${g}.`);
      else if (l) read.push(en ? `Capital is leaving ${l}.` : `Капитал уходит из ${l}.`);
    } else if (unit) {
      const s2 = sectorShift(sectors, priorSectors); if (s2) read.push(s2);
    }
    if (conc) {
      read.push(en
        ? `Capital is ${conc.mood}: the top 3 deals are ${pct(conc.top3Share)}, ` +
          `and half of it sits in ${conc.dealsToHalf} ${conc.dealsToHalf === 1 ? 'deal' : 'deals'}.`
        : `Капитал ${conc.mood}: топ-3 сделки — ${pct(conc.top3Share)}, ` +
          `половина в ${conc.dealsToHalf} ${plural(conc.dealsToHalf, ['сделке', 'сделках', 'сделках'])}.`);
    }
    if (biggest) {
      read.push(en
        ? `Largest deal — ${biggest.source?.name || '—'} → ${biggest.target?.name || '—'} at ${fmtUSD(biggest.amount)}.`
        : `Крупнейшая сделка — ${biggest.source?.name || '—'} → ` +
          `${biggest.target?.name || '—'} на ${fmtUSD(biggest.amount)}.`);
    }
    if (head.candidateDeals) {
      read.push(en
        ? `Plus ${head.candidateDeals} unconfirmed ${head.candidateDeals === 1 ? 'flow' : 'flows'}` +
          `${head.candidateCapital ? ` worth ${fmtUSD(head.candidateCapital)}` : ''} — still unverified.`
        : `Плюс ${head.candidateDeals} ` +
          `${plural(head.candidateDeals, ['неподтверждённый поток', 'неподтверждённых потока', 'неподтверждённых потоков'])}` +
          `${head.candidateCapital ? ` на ${fmtUSD(head.candidateCapital)}` : ''} — ещё без подтверждения.`);
    }
  } else {
    read.push(en
      ? `${title}: no confirmed flows with a disclosed amount.`
      : `${title}: подтверждённых потоков с раскрытой суммой нет.`);
  }

  return {
    id, title, sub, head, uniqueInvestors, uniqueBeneficiaries,
    investors, beneficiaries,
    sectors: sectors.rows, biggest, newEntrants: entrants, read,
    rotation, classMix: mix.rows, concentration: conc,
    empty: !head.deals && !head.candidateDeals,
  };
}

// The date the payload's freshest confirmed flow is anchored at. The digest's
// weekly/monthly windows use this — not `generated` — so a research cycle that
// ships without any confirmed deals in its own final week doesn't wipe the
// briefing to zero. The engine delivers on Monday morning; between deliveries
// the same batch of flows stays visible, framed as "the last engine week that
// actually reported confirmed activity". Falls back to `generated` only if the
// payload has zero confirmed flows anywhere (shouldn't happen in practice).
//
// Exported: the map's trailing-window filter uses the same anchor so its
// "7 дн" == the digest's "За неделю" == the last engine cycle's coverage,
// instead of a trailing 7 days from `generated` that clips off the first two
// days of the cycle when the delivery lands a few days after the cycle's end.
export function newestConfirmedDate(links, fallback) {
  let max = null;
  for (const l of links) {
    if (!isConfirmed(l) || !l.date) continue;
    if (!max || l.date > max) max = l.date;
  }
  return max || fallback;
}

// ── Public entry ───────────────────────────────────────────────────────────
export function buildDigest({ nodes, links, generated, sectors }) {
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  const anchor = newestConfirmedDate(links, generated);
  const anchorLagsRun = anchor < generated;

  const week = windowFlows(links, anchor, 7);
  const priorWeek = windowFlows(links, anchor, 14, 7);
  const month = windowFlows(links, anchor, 30);
  const priorMonth = windowFlows(links, anchor, 60, 30);

  // Human-readable window range for the header. When the anchor lags the run,
  // this is the tell: sub reads "22.06 → 08.08 · держим прошлый цикл, пока
  // Пн 10:00 не обновит" instead of the plain "last 7 days" line, so the tab
  // stops looking like it's broken and starts looking like it's holding.
  const enSub = getLang() === 'en';
  const weekSub = anchorLagsRun
    ? (enSub
        ? `Latest cycle's data (${daysBefore(anchor, 6)} → ${anchor}). New delivery Mon 10:00 Madrid.`
        : `Данные последнего цикла (${daysBefore(anchor, 6)} → ${anchor}). Пн 10:00 Мадрид — новая выгрузка.`)
    : (enSub ? `The last 7 days to ${anchor}` : `Последние 7 дней до ${anchor}`);
  const monthSub = anchorLagsRun
    ? (enSub
        ? `Latest cycle's data (${daysBefore(anchor, 29)} → ${anchor}). New delivery Mon 10:00 Madrid.`
        : `Данные последнего цикла (${daysBefore(anchor, 29)} → ${anchor}). Пн 10:00 Мадрид — новая выгрузка.`)
    : (enSub ? `The last 30 days to ${anchor}` : `Последние 30 дней до ${anchor}`);

  const blocks = [
    buildBlock({ flows: week, prior: priorWeek, allLinks: links, nodeById, gen: anchor,
      id: 'week', title: enSub ? 'This week' : 'За неделю', sub: weekSub, unit: 'неделей' }),
    buildBlock({ flows: month, prior: priorMonth, allLinks: links, nodeById, gen: anchor,
      id: 'month', title: enSub ? 'This month' : 'За месяц', sub: monthSub, unit: 'месяцем' }),
    buildBlock({ flows: links, prior: null, allLinks: links, nodeById, gen: anchor,
      id: 'all', title: enSub ? 'Whole map' : 'Вся карта',
      sub: enSub ? 'The entire tracked stack as of this cycle' : 'Весь отслеживаемый стек на текущий цикл', unit: null }),
  ];

  // Fired signals, windowed like everything else. Each signal now ships
  // dated `evidence[]` (engine v3.7) — a signal belongs to a window when at
  // least one of its evidence flows falls inside it, same test as
  // `windowFlows` uses for ordinary flows. `to: null` (the 'all' window)
  // skips the date test entirely, so a signal with genuinely undated/empty
  // evidence still surfaces there instead of vanishing everywhere.
  // The same signal can attach to more than one sector block; dedupe on
  // rule + theme within each window independently.
  function signalsInWindow(from, to) {
    const out = [];
    const seen = new Set();
    Object.entries(sectors || {}).forEach(([key, s]) => {
      (s.signals || []).forEach(sig => {
        const k = `${sig.rule}|${sig.theme}`;
        if (seen.has(k)) return;
        if (to != null) {
          const evid = Array.isArray(sig.evidence) ? sig.evidence : [];
          const hit = evid.some(e => e.date && e.date > from && e.date <= to);
          if (!hit) return;
        }
        seen.add(k);
        out.push({ sector: key, ...sig });
      });
    });
    out.sort((a, b) => (b.strength || 0) - (a.strength || 0));
    return out;
  }
  const signalsByWindow = {
    week: signalsInWindow(daysBefore(anchor, 7), anchor),
    month: signalsInWindow(daysBefore(anchor, 30), anchor),
    all: signalsInWindow(null, null),
  };
  // Back-compat: some callers still read digest.signals for the whole-map list.
  const signals = signalsByWindow.all;

  return { generated, blocks, signals, signalsByWindow };
}
