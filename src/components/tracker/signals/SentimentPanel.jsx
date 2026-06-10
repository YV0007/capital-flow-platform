import React, { useState, useEffect } from 'react';
import { Star, ExternalLink } from 'lucide-react';
import Panel from '../shared/Panel.jsx';
import { FocusButton, FocusOverlay } from '../shared/FocusOverlay.jsx';
import { relTime } from '../../../lib/utils.js';
import { useWorkerUrl } from '../../../lib/workerUrl.js';

export default function SentimentPanel({ companyId }) {
  const workerUrl = useWorkerUrl();
  const [snap, setSnap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastWrite, setLastWrite] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${workerUrl.replace(/\/$/, '')}/sentiment?company=${encodeURIComponent(companyId)}`, { mode: 'cors' });
        if (!resp.ok) throw new Error(`Worker ${resp.status}`);
        const data = await resp.json();
        if (cancelled) return;
        const snapshots = Array.isArray(data.snapshots) ? data.snapshots : [];
        setSnap(snapshots[snapshots.length - 1] || null);
        setLastWrite(data.lastWrite ? new Date(data.lastWrite).getTime() : null);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'fetch failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [companyId, workerUrl]);

  const gd = snap?.glassdoor;
  const tp = snap?.trustpilot;
  const hasGlassdoor = gd && !gd.skipped && !gd.error && gd.rating != null;
  const hasTrustpilot = tp && !tp.skipped && !tp.error && tp.rating != null;
  const hasAny = hasGlassdoor || hasTrustpilot;

  const [focused, setFocused] = useState(false);

  const renderBody = (isFocused = false) => (
    <>
      {error ? (
        <div className="text-[10px] text-amber-400 mb-2 px-2 py-1 bg-amber-950/20 border border-amber-900/50 rounded">
          Worker error: {error}
        </div>
      ) : !snap ? (
        <div className="border border-dashed border-zinc-800 rounded p-6 text-center">
          <div className="text-xs text-zinc-500 mb-1">No sentiment data yet.</div>
          <div className="text-[10px] text-zinc-600">Generated on each weekly run.</div>
        </div>
      ) : !hasAny ? (
        <div className="border border-dashed border-zinc-800 rounded p-6 text-center">
          <div className="text-xs text-zinc-500 mb-1">No review-site coverage for this company.</div>
          <div className="text-[10px] text-zinc-600">Glassdoor / Trustpilot pages not found. Common for early-stage or non-English-market companies.</div>
        </div>
      ) : (
        <>
          {/* Two side-by-side rating cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            {/* Glassdoor card */}
            {hasGlassdoor ? (
              <div className="bg-zinc-950 border border-emerald-900/30 rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono">Glassdoor (employees)</div>
                  {gd.sourceUrl && (
                    <a href={gd.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-cyan-400 inline-flex items-center gap-0.5">
                      verify <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`font-mono ${isFocused ? 'text-4xl' : 'text-3xl'} text-emerald-300`}>{gd.rating.toFixed(1)}</span>
                  <span className="text-[11px] text-zinc-500">/ 5</span>
                </div>
                <div className="text-[10px] text-zinc-500 mb-2">
                  {gd.reviewCount != null ? `${gd.reviewCount} reviews` : 'review count not disclosed'}
                </div>
                {gd.subscores && Object.keys(gd.subscores).length > 0 && (
                  <div className="space-y-0.5 pt-2 border-t border-zinc-800">
                    {Object.entries(gd.subscores).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">{k}</span>
                        <span className="font-mono text-zinc-300">{typeof v === 'number' ? v.toFixed(1) : v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">Glassdoor</div>
                <div className="text-xs text-zinc-600 italic mt-2">
                  {gd?.skipped ? (gd.reason || 'no page') : gd?.error ? `parse failed: ${gd.error}` : 'no data'}
                </div>
              </div>
            )}

            {/* Trustpilot card */}
            {hasTrustpilot ? (
              <div className={`bg-zinc-950 border rounded p-3 ${tp.rating < 3 ? 'border-rose-900/40' : tp.rating < 4 ? 'border-amber-900/30' : 'border-emerald-900/30'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-[10px] uppercase tracking-wider font-mono ${tp.rating < 3 ? 'text-rose-400' : tp.rating < 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    Trustpilot (customers)
                  </div>
                  {tp.sourceUrl && (
                    <a href={tp.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-cyan-400 inline-flex items-center gap-0.5">
                      verify <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`font-mono ${isFocused ? 'text-4xl' : 'text-3xl'} ${tp.rating < 3 ? 'text-rose-300' : tp.rating < 4 ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {tp.rating.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-zinc-500">/ 5</span>
                </div>
                <div className="text-[10px] text-zinc-500 mb-2">
                  {tp.reviewCount != null ? `${tp.reviewCount} reviews` : 'review count unknown'}
                </div>
                {tp.distribution && (
                  <div className="space-y-0.5 pt-2 border-t border-zinc-800">
                    {['5', '4', '3', '2', '1'].map(star => {
                      const pct = tp.distribution[star] ?? 0;
                      return (
                        <div key={star} className="flex items-center gap-1.5 text-[10px]">
                          <span className="w-3 text-zinc-500">{star}★</span>
                          <div className="flex-1 h-1.5 bg-zinc-900 rounded overflow-hidden">
                            <div className={`h-full ${star === '1' ? 'bg-rose-600' : star === '2' ? 'bg-rose-500/60' : star === '3' ? 'bg-zinc-500' : star === '4' ? 'bg-emerald-500/60' : 'bg-emerald-500'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-7 text-right font-mono text-zinc-400">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-mono">Trustpilot</div>
                <div className="text-xs text-zinc-600 italic mt-2">
                  {tp?.skipped ? (tp.reason || 'no page') : tp?.error ? `parse failed: ${tp.error}` : 'no data'}
                </div>
              </div>
            )}
          </div>

          {/* Complaint themes (if Trustpilot has them and rating is low) */}
          {hasTrustpilot && tp.complaintThemes && tp.complaintThemes.length > 0 && (
            <div className="mb-3 px-3 py-2 bg-rose-950/20 border border-rose-900/40 rounded">
              <div className="text-[9px] uppercase tracking-wider text-rose-400 mb-1.5">Dominant complaint themes</div>
              <ul className="space-y-0.5">
                {tp.complaintThemes.map((c, i) => (
                  <li key={i} className={`${isFocused ? 'text-[13px]' : 'text-[11px]'} text-rose-200/90 leading-relaxed`}>• {c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Interpretation */}
          {snap.interpretation && (
            <div className="px-3 py-2 bg-zinc-950 border border-cyan-900/30 rounded">
              <div className="text-[9px] uppercase tracking-wider text-cyan-400 mb-1">Signal interpretation</div>
              <div className={`${isFocused ? 'text-[14px]' : 'text-[12px]'} text-zinc-300 italic leading-relaxed`}>{snap.interpretation}</div>
            </div>
          )}

          <div className="text-[10px] text-zinc-600 mt-3">
            Last brief: {lastWrite ? relTime(lastWrite) : 'never'}
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      <Panel title="Employee &amp; Customer Sentiment" icon={Star}
        right={
          <div className="flex items-center gap-2">
            {loading && <span className="text-[10px] text-zinc-500">loading…</span>}
            <FocusButton onClick={() => setFocused(true)} />
          </div>
        }>
        {renderBody(false)}
      </Panel>
      <FocusOverlay open={focused} onClose={() => setFocused(false)} title="Employee & Customer Sentiment">
        {renderBody(true)}
      </FocusOverlay>
    </>
  );
}
