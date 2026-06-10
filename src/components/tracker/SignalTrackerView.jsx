import React, { useMemo, useState } from 'react';
import { Activity, HelpCircle, Plus, AlertTriangle, ExternalLink } from 'lucide-react';

import Panel from './shared/Panel.jsx';
import { Tooltip, ConfidenceBadge, SourceTag, MemoBadge, StaleTag, Sparkline } from './shared/badges.jsx';
import { daysBetween, todayISO, isStale } from '../../lib/utils.js';
import { CORROB_SOURCES } from '../../data/corrob-sources.js';
import { PRESENTATION_MODE, NEWS_ONLY_MODE } from '../../lib/build-flags.js';

import WeeklyTakeaway from './news/WeeklyTakeaway.jsx';
import WeeklyBriefPanel from './news/WeeklyBriefPanel.jsx';

import HiringVelocityPanel from './signals/HiringVelocityPanel.jsx';
import SentimentPanel from './signals/SentimentPanel.jsx';
import AppDownloadsPanel, { AppDownloadsLogModal } from './signals/AppDownloadsPanel.jsx';
import AdLibraryPanel, { AdLibraryLogModal } from './signals/AdLibraryPanel.jsx';

// Buckets the user wants rendered as panels in the Signal Tracker.
// All paywalled / manual-only public-signal panels were removed in worker v2 era —
// replaced by auto-fetched panels (Hiring, CompetitorShare, Sentiment) that read from
// the news-monitor Cloudflare worker. The bucket definitions still exist for VC-tab
// triangulation logic; they're just not surfaced as their own panels here anymore.
const SIGNAL_TRACKER_VISIBLE_BUCKETS = [];

function SignalTrackerView({ observations, onAddObservation, onSaveObservation, cfg, companyId }) {
  const [adLogOpen, setAdLogOpen] = useState(false);
  const [appLogOpen, setAppLogOpen] = useState(false);

  // Group observations by corroboration bucket
  const grouped = useMemo(() => {
    const g = {};
    for (const src of CORROB_SOURCES) g[src.id] = [];
    for (const o of observations.filter(o => !o.superseded)) {
      if (g[o.corrobBucket]) g[o.corrobBucket].push(o);
    }
    return g;
  }, [observations]);

  const visibleSources = CORROB_SOURCES.filter(s => SIGNAL_TRACKER_VISIBLE_BUCKETS.includes(s.id));

  return (
    <div className="space-y-3">
      {NEWS_ONLY_MODE ? (
        <Panel
          title={
            <span className="inline-flex items-center gap-1.5">
              Public — News &amp; Mentions
            </span>
          }
          icon={Activity}>
          <div className="text-[11px] text-zinc-500 italic">
            Live mentions of the company across news, community, and creator channels. Use Refresh to pull the latest from Reddit + GDELT + YouTube; use Add manual to log specific items from gated sources (X / Instagram / LinkedIn).
          </div>
        </Panel>
      ) : (
        <Panel
          title={
            <span className="inline-flex items-center gap-1.5">
              Signal Tracker
              <Tooltip text={`Three-Source Rule: at least 2 of the ${CORROB_SOURCES.length} corroboration buckets must support a growth claim. Single-source signals are flagged "Unconfirmed". Web traffic and app metrics each require ≥2 sources before computing trend. Currently showing ${visibleSources.length} of ${CORROB_SOURCES.length} buckets.`}>
              <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help" />
            </Tooltip>
          </span>
        }
        icon={Activity}>
        <div className="text-[11px] text-zinc-500 italic">
          Publicly available signals about the company — web traffic, app metrics, sentiment, mentions, and ad footprint. Use these as an early read on demand and momentum, independent of insider data.
        </div>
      </Panel>
      )}

      <WeeklyTakeaway companyId={companyId} />

      <WeeklyBriefPanel companyId={companyId} isResearch={cfg.is_position === false} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <HiringVelocityPanel companyId={companyId} />
        <SentimentPanel companyId={companyId} />
      </div>

      {!NEWS_ONLY_MODE && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {visibleSources.map(src => {
          // Special case: paid acquisition footprint has bespoke metrics
          // (WoW delta, geo footprint, per-platform breakdown). Route to
          // dedicated panel + log modal.
          if (src.id === 'ad_library') {
            return (
              <AdLibraryPanel key={src.id} src={src} observations={observations} onLog={() => setAdLogOpen(true)} />
            );
          }
          // App downloads bucket: rolling-window totals (1mo / 3mo / 6mo)
          // per platform. Manual entry — no free API for download counts.
          if (src.id === 'app') {
            return (
              <AppDownloadsPanel key={src.id} src={src} observations={observations} onLog={() => setAppLogOpen(true)} />
            );
          }
          const obs = grouped[src.id].sort((a, b) => new Date(b.date) - new Date(a.date));
          const latest = obs[0];
          const distinctSources = new Set(obs.filter(o => daysBetween(o.date, todayISO()) <= src.staleDays).map(o => o.sourceTool)).size;
          const meetsMin = !src.requireMin || distinctSources >= src.requireMin;
          const sparkData = obs.slice(0, 12).reverse().map(o => ({ value: parseFloat(o.value) || 0, date: o.date }));
          const Icon = src.icon;
          return (
            <Panel key={src.id} title={src.label} icon={Icon}
              subtitle={src.tools.join(' · ')}
              right={
                <div className="flex items-center gap-1.5">
                  {!PRESENTATION_MODE && !meetsMin && obs.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase bg-amber-900 text-amber-300 border border-amber-700 rounded-sm" title={`Requires ≥${src.requireMin} distinct tools`}>
                      <AlertTriangle className="w-2.5 h-2.5" />Need ≥{src.requireMin}
                    </span>
                  )}
                  <button onClick={() => onAddObservation({ corrobBucket: src.id })} className="text-[10px] inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded">
                    <Plus className="w-3 h-3" />Add
                  </button>
                </div>
              }>
              <div className="flex flex-col gap-2">
                <div className="text-[10px] text-zinc-500 italic">{src.why}</div>
                {latest ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-lg text-zinc-100">
                        {latest.rangeLow && latest.rangeHigh ? `${latest.rangeLow}–${latest.rangeHigh}` : latest.value || '—'}
                        {latest.unit && <span className="text-xs text-zinc-500 ml-1">{latest.unit}</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ConfidenceBadge value={latest.confidence} />
                        <SourceTag value={latest.sourceType} />
                        <MemoBadge obs={latest} />
                        {isStale(latest) && <StaleTag days={daysBetween(latest.date, todayISO())} threshold={src.staleDays} />}
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {latest.label} · {latest.sourceTool} · {latest.date}
                      {latest.url && <a href={latest.url} target="_blank" rel="noreferrer" className="ml-1.5 text-cyan-500 hover:text-cyan-400 inline-flex items-center gap-0.5"><ExternalLink className="w-2.5 h-2.5" /></a>}
                    </div>
                    <Sparkline data={sparkData} />
                    <div className="text-[10px] text-zinc-500">
                      {obs.length} obs total · {distinctSources} distinct tool{distinctSources !== 1 ? 's' : ''} in window
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-zinc-600 italic py-3 text-center">No observations logged. <button onClick={() => onAddObservation({ corrobBucket: src.id })} className="underline text-cyan-500 hover:text-cyan-400">Add the first one →</button></div>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
      )}

      <AdLibraryLogModal
        open={adLogOpen}
        onClose={() => setAdLogOpen(false)}
        onSave={(obs) => onSaveObservation && onSaveObservation(obs)}
      />

      <AppDownloadsLogModal
        open={appLogOpen}
        onClose={() => setAppLogOpen(false)}
        onSave={(obs) => onSaveObservation && onSaveObservation(obs)}
      />
    </div>
  );
}

export default SignalTrackerView;
