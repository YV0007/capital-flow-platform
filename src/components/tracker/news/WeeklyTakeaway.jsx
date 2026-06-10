import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

import { relTime } from '../../../lib/utils.js';
import { useWorkerUrl } from '../../../lib/workerUrl.js';
import WEEKLY_TAKEAWAY_OVERRIDES from '../../../data/weekly-takeaway-overrides.json';

// Catalysts / Risk / Thesis derivation from the single weeklyTakeaway sentence
function deriveTakeawayRows(weekly) {
  if (!weekly) return null;
  let raw = (weekly.weeklyTakeaway || '').trim();
  if (!raw) return null;

  // Inline copy override — if the cached brief still contains the older catalyst
  // phrasing, swap it to the simpler reading. Backend (worker.js) has been updated;
  // this only catches the still-cached KV value.
  raw = raw.replace(
    /^Material catalysts \(SpaceX \$60B option, \$2B funding round at >\$50B\) anchor near-term upside/i,
    'Cursor is raising $2B at a $50B+ valuation, with SpaceX offering to buy it for $60B'
  );

  // Try to split on common transition phrases
  const splitRe = /,?\s*\b(but|however|though|while|watch for|the risk|concern is|though concerns?)\b/i;
  const parts = raw.split(splitRe).map(s => s.trim()).filter(s => s && !/^(but|however|though|while|watch for|the risk|concern is|though concerns?)$/i.test(s));

  const rows = {};

  // Heuristic: if we got 2+ chunks, first is catalysts, last is risk
  if (parts.length >= 2) {
    rows.catalysts = parts[0].replace(/^and\s+/, '').replace(/^,\s*/, '');
    rows.risk      = parts[parts.length - 1].replace(/^and\s+/, '').replace(/^,\s*/, '');
  } else {
    // Fallback: derive catalysts from highest-importance news, risk from sentiment.interpretation
    const topNews = (weekly.news?.items || []).find(i => ['critical', 'high'].includes((i.importance || '').toLowerCase()));
    if (topNews) rows.catalysts = topNews.whyItMatters || topNews.headline;
    if (weekly.sentiment?.interpretation) rows.risk = weekly.sentiment.interpretation;
  }

  // Thesis = the raw takeaway when we couldn't split; otherwise omit (catalysts/risk already say it)
  if (parts.length < 2) {
    rows.thesis = raw;
  }

  // Only return if we have at least one row
  if (!rows.catalysts && !rows.risk && !rows.thesis) return null;
  return rows;
}

// ────────────────────────────────────────────────────────────────
// WeeklyTakeaway — adaptive 3-row TL;DR
// ────────────────────────────────────────────────────────────────
function WeeklyTakeaway({ companyId }) {
  const workerUrl = useWorkerUrl();
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const resp = await fetch(`${workerUrl.replace(/\/$/, '')}/weekly?company=${encodeURIComponent(companyId)}`, { mode: 'cors' });
        if (!resp.ok) throw new Error(`Worker ${resp.status}`);
        const data = await resp.json();
        if (!cancelled) setWeekly(data.weekly || null);
      } catch {
        // silent — sibling panels surface errors
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [companyId, workerUrl]);

  if (loading) return null;

  // Worker data takes precedence once it's real (non-seeded). When the worker
  // is still serving seeded data — or is unreachable entirely — we fall back
  // to a curated per-company takeaway so the page never shows placeholder.
  const liveRows = deriveTakeawayRows(weekly);
  const isSeeded = weekly?.seeded === true;
  const override = WEEKLY_TAKEAWAY_OVERRIDES[companyId];
  const rows = (override && (!weekly || isSeeded))
    ? { catalysts: override.upside, risk: override.risk }
    : liveRows;
  if (!rows) return null;

  const generatedAt = weekly?.generatedAt ? new Date(weekly.generatedAt).getTime() : null;

  return (
    <div className="bg-gradient-to-br from-zinc-950 via-zinc-950 to-cyan-950/20 border border-cyan-900/40 rounded-lg p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] uppercase tracking-[0.15em] text-cyan-400 font-mono font-semibold">Weekly Takeaway</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
          {generatedAt && <span>{relTime(generatedAt)}</span>}
        </div>
      </div>

      <div className="space-y-2.5">
        {rows.catalysts && (
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-16 pt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono font-semibold">Upside</span>
            </div>
            <div className="flex-1 text-[14px] leading-relaxed text-zinc-100">{rows.catalysts}</div>
          </div>
        )}
        {rows.risk && (
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-16 pt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
              <span className="text-[10px] uppercase tracking-wider text-rose-400 font-mono font-semibold">Risk</span>
            </div>
            <div className="flex-1 text-[14px] leading-relaxed text-zinc-100">{rows.risk}</div>
          </div>
        )}
        {rows.thesis && (
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-16 pt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0"></span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono font-semibold">Net view</span>
            </div>
            <div className="flex-1 text-[14px] leading-relaxed text-zinc-200">{rows.thesis}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WeeklyTakeaway;
