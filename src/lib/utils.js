// Domain helpers ported from index_slim.html (readable copies; the
// minified duplicates pre-line-1337 are dropped). Component code
// imports from this module rather than duplicating logic inline.

import confidenceWeightJson from '../data/confidence-weight.json';
import { CORROB_SOURCES } from '../data/corrob-sources.js';
import metricFrameworkJson from '../data/metric-framework.json';
import scorecardDimensionsJson from '../data/scorecard-dimensions.json';
import dimToCategoriesJson from '../data/dim-to-categories.json';
import aiDimToCategoriesJson from '../data/ai-dim-to-categories.json';
import negativeWhenUpArr from '../data/negative-when-up.json';
import memoSupersedesJson from '../data/memo-supersedes.json';

export const CONFIDENCE_WEIGHT = confidenceWeightJson;
export const METRIC_FRAMEWORK = metricFrameworkJson;
export const SCORECARD_DIMENSIONS = scorecardDimensionsJson;
export const DIMENSION_TO_CATEGORIES = dimToCategoriesJson;
export const AI_DIMENSION_TO_CATEGORIES = aiDimToCategoriesJson;
export const NEGATIVE_WHEN_UP = new Set(negativeWhenUpArr);
export const MEMO_SUPERSEDES = memoSupersedesJson;

// Frozen seed timestamps — match monolith constants so observation
// ids and reconciliation behavior round-trip with prior saves.
export const SEED_TS = '2026-05-09T10:30:00.000Z';
export const MEMO_TS = '2026-05-09T11:00:00.000Z';
export const MEMO_TS_CURSOR = '2026-05-10T00:00:00Z';

// ─── Date / format helpers ──────────────────────────────────────
export function daysBetween(isoA, isoB) {
  const a = new Date(isoA).getTime();
  const b = new Date(isoB).getTime();
  return Math.floor((b - a) / 86400000);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function fmtUSD(n, opts = {}) {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (opts.compact) {
    if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  }
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD',
    minimumFractionDigits: opts.cents ? 2 : 0, maximumFractionDigits: opts.cents ? 2 : 0 });
}

export function fmtPct(n, digits = 1) {
  if (n == null || isNaN(n)) return '—';
  return `${n.toFixed(digits)}%`;
}

export function relTime(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function parseGdeltDate(s) {
  if (!s || s.length < 14) return Date.now();
  const y = +s.slice(0, 4), mo = +s.slice(4, 6) - 1, d = +s.slice(6, 8);
  const h = +s.slice(8, 10), mi = +s.slice(10, 12), se = +s.slice(12, 14);
  return Date.UTC(y, mo, d, h, mi, se);
}

// ─── Observation seed helpers ───────────────────────────────────
// Monolith line 1801: _o adds id/createdAt/superseded defaults. For
// JSON-extracted seeds we pre-bake the id; this helper is kept for
// runtime seed code (forms etc.) and back-compat with legacy callers.
export const _o = (n) => ({
  superseded: false,
  createdAt: SEED_TS,
  rangeLow: '', rangeHigh: '',
  ...n,
  id: n.id || `obs_seed_${Math.random().toString(36).slice(2, 9)}`,
});

// Memo observation wrapper (Zeely) — monolith line 2398.
export const _m = (n) => _o({
  rangeLow: '', rangeHigh: '',
  memo: true,
  ingestedAt: MEMO_TS,
  createdAt: MEMO_TS,
  sourceType: 'I',
  sourceTool: 'Toloka Investment Memo (Apr 2026)',
  url: 'PDF on file',
  confidence: 'high',
  corrobBucket: 'funding',
  ...n,
});

// Memo observation wrapper (Cursor) — monolith line 2575.
export const _mC = (n) => _o({
  rangeLow: '', rangeHigh: '',
  memo: true,
  ingestedAt: MEMO_TS_CURSOR,
  createdAt: MEMO_TS_CURSOR,
  sourceType: 'I',
  sourceTool: 'Toloka Investment Memo — Cursor (Apr 2026)',
  url: 'PDF on file: Cursor_memo_ua_v1__release_.pdf',
  confidence: 'high',
  corrobBucket: 'funding',
  ...n,
});

// ─── Reconciliation ─────────────────────────────────────────────
export function applyMemoReconciliation(observations) {
  const supersedeAt = MEMO_TS;
  const out = observations.map(o => ({ ...o }));
  for (const oldId of Object.keys(MEMO_SUPERSEDES)) {
    const map = MEMO_SUPERSEDES[oldId];
    const old = out.find(o => o.id === oldId);
    if (old && !old.superseded) {
      old.superseded = true;
      old.supersededBy = map.by;
      old.supersededAt = supersedeAt;
      old.supersededReason = map.reason;
    }
  }
  return out;
}

// ─── Deal math ──────────────────────────────────────────────────
export function computeCarryWaterfall(exitValuationUSD, cfg, dilutionFactor = 1.0) {
  const userPct = (cfg.implied_economic_interest_pct / 100) * dilutionFactor;
  const grossInvested = cfg.gross_investment_usd;
  const grossProceeds = exitValuationUSD * userPct;
  const hurdleValue = grossInvested * (1 + cfg.hurdle_on_exit_pct / 100);
  const excess = Math.max(0, grossProceeds - hurdleValue);
  const carry = excess * (cfg.carry_on_exit_pct / 100);
  const netProceeds = grossProceeds - carry;
  const netReturn = netProceeds - grossInvested;
  const grossMultiple = grossProceeds / grossInvested;
  const netMultiple = netProceeds / grossInvested;
  return { exitValuationUSD, userPct, grossInvested, grossProceeds, hurdleValue, excess, carry, netProceeds, netReturn, grossMultiple, netMultiple };
}

export function computeBreakevenExit(cfg, dilutionFactor = 1.0) {
  const userPct = (cfg.implied_economic_interest_pct / 100) * dilutionFactor;
  return cfg.gross_investment_usd / userPct;
}

// ─── Triangulation ──────────────────────────────────────────────
export function evaluateTriangulation(observations, claimDir = 'up', windowDays = 90, asOf = todayISO()) {
  const recent = observations.filter(o => !o.superseded && daysBetween(o.date, asOf) <= windowDays);
  const buckets = {};
  for (const src of CORROB_SOURCES) buckets[src.id] = [];
  for (const o of recent) {
    if (o.corrobBucket && buckets[o.corrobBucket]) buckets[o.corrobBucket].push(o);
  }
  let confirming = 0, contradicting = 0, neutral = 0, present = 0;
  const bucketSummaries = [];
  for (const src of CORROB_SOURCES) {
    const obs = buckets[src.id];
    if (obs.length === 0) {
      bucketSummaries.push({ id: src.id, label: src.label, status: 'absent', count: 0, dir: null });
      continue;
    }
    present++;
    const dirs = obs.map(o => o.direction).filter(Boolean);
    if (dirs.length === 0) {
      bucketSummaries.push({ id: src.id, label: src.label, status: 'no-direction', count: obs.length, dir: null });
      neutral++;
      continue;
    }
    const counts = { up: 0, flat: 0, down: 0 };
    for (const d of dirs) counts[d] = (counts[d] || 0) + 1;
    const modal = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    let status;
    if (modal === claimDir) { confirming++; status = 'confirm'; }
    else if (modal === 'flat') { neutral++; status = 'neutral'; }
    else { contradicting++; status = 'contradict'; }
    bucketSummaries.push({ id: src.id, label: src.label, status, count: obs.length, dir: modal });
  }
  let verdict;
  if (contradicting >= 2) verdict = 'inconsistency';
  else if (confirming >= 2 && contradicting === 0) verdict = 'confirmed';
  else if (confirming >= 2 && contradicting >= 1) verdict = 'mixed';
  else verdict = 'unconfirmed';
  return { verdict, confirming, contradicting, neutral, present, bucketSummaries, recentCount: recent.length };
}

export function isStale(obs, asOf = todayISO()) {
  const src = CORROB_SOURCES.find(s => s.id === obs.corrobBucket);
  const threshold = src?.staleDays || 90;
  return daysBetween(obs.date, asOf) > threshold;
}

export function computeCoverage(observations) {
  const recent = observations.filter(o => !o.superseded && daysBetween(o.date, todayISO()) <= 120);
  const buckets = new Set(recent.map(o => o.corrobBucket).filter(Boolean));
  const categories = new Set(recent.map(o => o.frameworkCategory).filter(Boolean));
  const corrobCoverage = (buckets.size / CORROB_SOURCES.length) * 100;
  const categoryCoverage = (categories.size / METRIC_FRAMEWORK.length) * 100;
  const blended = (corrobCoverage + categoryCoverage) / 2;
  return { corrobCoverage, categoryCoverage, blended, bucketsCovered: buckets.size, categoriesCovered: categories.size };
}

// ─── Scoring ────────────────────────────────────────────────────
function _autoScoreCore(categories, observations, asOf = todayISO()) {
  const recent = observations.filter(o =>
    !o.superseded &&
    categories.includes(o.frameworkCategory) &&
    daysBetween(o.date, asOf) <= 180
  );
  if (recent.length === 0) return null;
  let weightedSum = 0;
  let totalWeight = 0;
  let upN = 0, flatN = 0, downN = 0;
  for (const o of recent) {
    const cw = CONFIDENCE_WEIGHT[o.confidence] ?? 0.5;
    let dv = o.direction === 'up' ? 1 : o.direction === 'down' ? -1 : 0;
    if (NEGATIVE_WHEN_UP.has(o.metricId)) dv = -dv;
    weightedSum += cw * dv;
    totalWeight += cw;
    if (dv > 0) upN++; else if (dv < 0) downN++; else flatN++;
  }
  const normalized = totalWeight > 0 ? weightedSum / totalWeight : 0;
  let score = 5.5 + normalized * 4.5;
  score = Math.max(1, Math.min(10, score));
  let confidence = 'low';
  if (recent.length >= 4 && Math.abs(normalized) > 0.3) confidence = 'high';
  else if (recent.length >= 2) confidence = 'med';
  return {
    score,
    n: recent.length,
    upN, flatN, downN,
    confidence,
    rationale: `Auto-scored from ${recent.length} obs (${upN}↑ / ${flatN}→ / ${downN}↓), weighted by direction × confidence.`,
  };
}

export function autoScoreDimension(dimId, observations, asOf) {
  return _autoScoreCore(DIMENSION_TO_CATEGORIES[dimId] || [], observations, asOf);
}

export function autoScoreAiDimension(dimId, observations, asOf) {
  return _autoScoreCore(AI_DIMENSION_TO_CATEGORIES[dimId] || [], observations, asOf);
}

export function scoreColor(score) {
  if (score == null) return { bar: 'bg-zinc-700', text: 'text-zinc-500', pill: 'bg-zinc-900 text-zinc-500 border-zinc-800' };
  if (score >= 8.5) return { bar: 'bg-emerald-500', text: 'text-emerald-400', pill: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' };
  if (score >= 7.0) return { bar: 'bg-lime-500',    text: 'text-lime-400',    pill: 'bg-lime-950/60 text-lime-300 border-lime-800' };
  if (score >= 5.5) return { bar: 'bg-amber-500',   text: 'text-amber-400',   pill: 'bg-amber-950/60 text-amber-300 border-amber-800' };
  if (score >= 4.0) return { bar: 'bg-orange-500',  text: 'text-orange-400',  pill: 'bg-orange-950/60 text-orange-300 border-orange-800' };
  return                      { bar: 'bg-rose-500',     text: 'text-rose-400',     pill: 'bg-rose-950/60 text-rose-300 border-rose-800' };
}

export function computeCompositeScore(scores, observations) {
  const cov = computeCoverage(observations);
  let valueSum = 0, weightSum = 0, scoredCount = 0;
  const dimDetails = [];
  for (const dim of SCORECARD_DIMENSIONS) {
    const manual = scores?.dimensions?.[dim.id];
    const auto = autoScoreDimension(dim.id, observations);
    let effective = null;
    if (manual && manual.value != null) {
      effective = { value: manual.value, source: 'manual', confidence: manual.confidence, rationale: manual.rationale };
    } else if (auto && auto.score != null) {
      effective = { value: auto.score, source: 'auto', confidence: auto.confidence, rationale: auto.rationale, n: auto.n };
    }
    if (effective) {
      const cmul = effective.confidence === 'high' ? 1.0 : effective.confidence === 'med' ? 0.85 : 0.65;
      valueSum += effective.value * cmul;
      weightSum += cmul;
      scoredCount++;
    }
    dimDetails.push({ ...dim, score: effective?.value, source: effective?.source, confidence: effective?.confidence, rationale: effective?.rationale, n: effective?.n });
  }
  const composite = weightSum > 0 ? valueSum / weightSum : null;
  let status;
  if (cov.blended < 50) status = 'low_coverage';
  else if (composite == null) status = 'low_coverage';
  else if (composite >= 8.0) status = 'breakout';
  else if (composite >= 6.5) status = 'on_track';
  else if (composite >= 5.0) status = 'mixed';
  else status = 'underperforming';
  return { composite, status, dimDetails, coverage: cov, scoredCount };
}

export function computeValuationDirection(observations) {
  const recent = observations.filter(o => !o.superseded && daysBetween(o.date, todayISO()) <= 120);
  if (recent.length < 3) return { dir: '?', confidence: 'low', rationale: 'Insufficient data (<3 observations).' };
  const buckets = {};
  for (const src of CORROB_SOURCES) buckets[src.id] = { up: 0, flat: 0, down: 0 };
  for (const o of recent) {
    if (o.corrobBucket && o.direction && buckets[o.corrobBucket]) {
      buckets[o.corrobBucket][o.direction] = (buckets[o.corrobBucket][o.direction] || 0) + 1;
    }
  }
  let up = 0, down = 0, flat = 0, present = 0;
  for (const id in buckets) {
    const b = buckets[id];
    const total = b.up + b.flat + b.down;
    if (total === 0) continue;
    present++;
    if (b.up > b.down && b.up >= b.flat) up++;
    else if (b.down > b.up && b.down >= b.flat) down++;
    else flat++;
  }
  if (present < 2) return { dir: '?', confidence: 'low', rationale: `Only ${present} corroboration source(s) populated.` };
  let dir;
  if (up >= 2 && down === 0) dir = '↑';
  else if (down >= 2 && up === 0) dir = '↓';
  else if (up > down) dir = '↑';
  else if (down > up) dir = '↓';
  else dir = '→';
  const confidence = present >= 4 ? 'high' : present >= 3 ? 'med' : 'low';
  return { dir, confidence, rationale: `${up} up / ${flat} flat / ${down} down across ${present}/7 sources.` };
}

// ─── Alerts ─────────────────────────────────────────────────────
export function deriveAlerts(observations, syndicateLog, cfg) {
  const alerts = [];
  const stale = observations.filter(o => !o.superseded && isStale(o));
  if (stale.length > 0) {
    alerts.push({ severity: 'amber', icon: 'clock', label: `${stale.length} observation${stale.length > 1 ? 's' : ''} past stale threshold`, kind: 'stale' });
  }
  const cov = computeCoverage(observations);
  if (cov.blended < 50 && observations.length > 0) {
    alerts.push({ severity: 'amber', icon: 'gauge', label: `Data coverage low (${cov.blended.toFixed(0)}% blended) — composite suppressed`, kind: 'coverage' });
  }
  const unresolvedClaims = observations.filter(o => !o.superseded && o.kind === 'claim' && o.triangulationVerdict === 'inconsistency' && !o.dismissedNote);
  if (unresolvedClaims.length > 0) {
    alerts.push({ severity: 'rose', icon: 'alert', label: `${unresolvedClaims.length} unresolved triangulation conflict${unresolvedClaims.length > 1 ? 's' : ''}`, kind: 'inconsistency' });
  }
  if (syndicateLog.length > 0) {
    const last = syndicateLog.reduce((m, x) => (m && new Date(m.date) > new Date(x.date) ? m : x), null);
    const days = last ? daysBetween(last.date, todayISO()) : null;
    if (days != null && days > 90) {
      alerts.push({ severity: 'amber', icon: 'message', label: `${days} days since last syndicate update`, kind: 'silence' });
    }
  } else if (cfg) {
    const days = daysBetween(cfg.entry_date, todayISO());
    if (days > 90) alerts.push({ severity: 'amber', icon: 'message', label: `No syndicate update logged since entry (${days}d)`, kind: 'silence' });
  }
  return alerts;
}
