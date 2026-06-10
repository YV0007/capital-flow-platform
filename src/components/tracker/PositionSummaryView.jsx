import React from 'react';
import { computeCompositeScore } from '../../lib/utils.js';
import { IS_BENTO, CornerBrackets } from './shared/chrome.jsx';
import CompanyLogo from './position/CompanyLogo.jsx';
import MemoOverviewPage from './memo/MemoOverviewPage.jsx';

export default function PositionSummaryView({ cfg, observations, syndicateLog, scores, capEvents,
                                memoBaseline, memoCardOpen, onToggleMemoCard,
                                triangulationTasks, onToggleTriangulation, onJumpTo, company }) {
  const compositeData = computeCompositeScore(scores || {}, observations);

  // ─── HEALTH CHECK ──────────────────────────────────────────────
  // Derive a verdict per dimension from real memoBaseline data.
  // Each verdict is one of: 'good' (emerald), 'mixed' (amber), 'bad' (rose), 'unknown' (zinc).
  const healthSignals = (() => {
    const mb = memoBaseline;
    if (!mb) return [];
    const signals = [];

    // GROWTH — based on ARR trajectory shape
    const arrSeries = mb.growth?.arr_trajectory || [];
    if (arrSeries.length >= 2) {
      const first = arrSeries[0].arr;
      const last  = arrSeries[arrSeries.length - 1].arr;
      const ratio = last / first;
      // 100x+ in <3 yrs = exceptional; 10x = strong; 2x = healthy; <1 = declining
      const verdict = ratio >= 10 ? 'good' : ratio >= 2 ? 'good' : ratio >= 1 ? 'mixed' : 'bad';
      const detail = ratio >= 100 ? `${Math.round(ratio)}× growth` : `${ratio.toFixed(1)}× growth`;
      signals.push({ id: 'growth', label: 'Growth', verdict, detail });
    }

    // SENTIMENT — Trustpilot rating
    const tp = mb.users?.trustpilot_rating;
    if (tp != null) {
      const verdict = tp >= 4 ? 'good' : tp >= 3 ? 'mixed' : 'bad';
      signals.push({ id: 'sentiment', label: 'Sentiment', verdict, detail: `${tp.toFixed(1)}/5 customer rating` });
    }

    // HIRING — based on hiring growth (use team headcount trajectory if available)
    const team = mb.team || {};
    if (team.headcount_growth_pct != null) {
      const v = team.headcount_growth_pct;
      const verdict = v >= 50 ? 'good' : v >= 10 ? 'mixed' : v >= 0 ? 'mixed' : 'bad';
      signals.push({ id: 'hiring', label: 'Hiring', verdict, detail: `+${v}% headcount` });
    } else if (team.headcount != null) {
      // If we have absolute headcount, assume positive
      signals.push({ id: 'hiring', label: 'Hiring', verdict: 'good', detail: `${team.headcount} people` });
    }

    // CAPITAL EFFICIENCY — ARR / total raised
    const latestArrCap = arrSeries[arrSeries.length - 1]?.arr;
    const raised = mb.growth?.total_raised_usd;
    if (latestArrCap && raised) {
      const eff = latestArrCap / raised;
      const verdict = eff >= 0.5 ? 'good' : eff >= 0.2 ? 'mixed' : 'bad';
      signals.push({ id: 'capital', label: 'Capital', verdict, detail: `${eff.toFixed(2)}× ARR/$ raised` });
    }

    // MARKET — TAM CAGR
    const cagr = mb.market?.tam_cagr_pct;
    if (cagr != null) {
      const verdict = cagr >= 20 ? 'good' : cagr >= 10 ? 'mixed' : 'bad';
      signals.push({ id: 'market', label: 'Market', verdict, detail: `${cagr}% CAGR` });
    }

    return signals;
  })();

  // Overall verdict — count majority. Any 'bad' counts double in weight.
  const overallVerdict = (() => {
    if (healthSignals.length === 0) return null;
    let score = 0;
    for (const s of healthSignals) {
      if (s.verdict === 'good')  score += 1;
      if (s.verdict === 'mixed') score += 0;
      if (s.verdict === 'bad')   score -= 2; // bad counts double
    }
    const avg = score / healthSignals.length;
    if (avg >= 0.6)  return { label: 'Healthy',    color: 'emerald' };
    if (avg >= 0.1)  return { label: 'Solid',      color: 'lime' };
    if (avg >= -0.3) return { label: 'Mixed',      color: 'amber' };
    return                   { label: 'Concerning', color: 'rose' };
  })();

  const verdictPalette = (v) => ({
    good:    { dot: 'bg-emerald-400',  text: 'text-emerald-300', bg: 'bg-emerald-950/40 border-emerald-900/50' },
    mixed:   { dot: 'bg-amber-400',    text: 'text-amber-300',   bg: 'bg-amber-950/40 border-amber-900/50' },
    bad:     { dot: 'bg-rose-400',     text: 'text-rose-300',    bg: 'bg-rose-950/40 border-rose-900/50' },
    unknown: { dot: 'bg-zinc-600',     text: 'text-zinc-500',    bg: 'bg-zinc-900 border-zinc-800' },
  }[v] || { dot: 'bg-zinc-600', text: 'text-zinc-500', bg: 'bg-zinc-900 border-zinc-800' });

  const overallPalette = (c) => ({
    emerald: 'text-emerald-300',
    lime:    'text-lime-300',
    amber:   'text-amber-300',
    rose:    'text-rose-300',
  }[c] || 'text-zinc-300');

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className={`relative ${IS_BENTO ? 'bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-hidden' : 'bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded p-4'}`}>
        {IS_BENTO && <CornerBrackets />}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-3">
            <CompanyLogo brand={cfg.company_brand_name} />
            <div>
              {IS_BENTO ? (
                <h1 className="text-[28px] font-bold text-zinc-50 mt-1.5 tracking-tight leading-[1.05]">
                  {cfg.company_brand_name}{' '}
                  <span className="text-zinc-500 text-[15px] font-normal tracking-normal">{cfg.company_legal_name}</span>
                </h1>
              ) : (
                <h1 className="text-2xl font-bold text-zinc-100 mt-1">{cfg.company_brand_name} <span className="text-zinc-500 text-base font-normal">({cfg.company_legal_name})</span></h1>
              )}
            </div>
          </div>
          {overallVerdict && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Health check</div>
              <div className={`text-[20px] font-semibold ${overallPalette(overallVerdict.color)} mt-0.5`}>{overallVerdict.label}</div>
            </div>
          )}
        </div>

        {/* Vital-signs strip — pills, one per signal */}
        {healthSignals.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-800">
            {healthSignals.map(s => {
              const p = verdictPalette(s.verdict);
              return (
                <div key={s.id} title={s.detail}
                  className={`inline-flex items-center gap-2 px-2.5 py-1 border rounded-full ${p.bg} cursor-help`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`}></span>
                  <span className={`text-[11px] font-medium ${p.text}`}>{s.label}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{s.detail}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Single memo-style overview replaces Position Snapshot + Memo Card + Carry Waterfall */}
      <MemoOverviewPage cfg={cfg} mb={memoBaseline} capEvents={capEvents} onJumpTo={onJumpTo} company={company} />
    </div>
  );
}
