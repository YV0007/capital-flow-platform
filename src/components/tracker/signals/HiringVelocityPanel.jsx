import React, { useState, useEffect } from 'react';
import { Users, ExternalLink } from 'lucide-react';
import Panel from '../shared/Panel.jsx';
import { FocusButton, FocusOverlay } from '../shared/FocusOverlay.jsx';
import { relTime } from '../../../lib/utils.js';
import { useWorkerUrl } from '../../../lib/workerUrl.js';

export default function HiringVelocityPanel({ companyId }) {
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
        const resp = await fetch(`${workerUrl.replace(/\/$/, '')}/hiring?company=${encodeURIComponent(companyId)}`, { mode: 'cors' });
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

  const hasData = snap && (snap.count != null || snap.trajectory);
  const [focused, setFocused] = useState(false);

  const renderBody = (isFocused = false) => (
    <>
      {error ? (
        <div className="text-[10px] text-amber-400 mb-2 px-2 py-1 bg-amber-950/20 border border-amber-900/50 rounded">
          Worker error: {error}
        </div>
      ) : !hasData ? (
        <div className="border border-dashed border-zinc-800 rounded p-6 text-center">
          <div className="text-xs text-zinc-500 mb-1">No hiring data yet.</div>
          <div className="text-[10px] text-zinc-600">Generated on each weekly run. First brief expected Sunday.</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Open roles</div>
              <div className={`font-mono ${isFocused ? 'text-4xl' : 'text-3xl'} text-zinc-100 mt-0.5`}>
                {snap.count != null ? snap.count : '—'}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">currently posted</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Last brief</div>
              <div className="font-mono text-sm text-zinc-200 mt-1">{lastWrite ? relTime(lastWrite) : 'never'}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">weekly cadence</div>
            </div>
          </div>

          {snap.trajectory && (
            <div className="mb-3 px-3 py-2 bg-zinc-950 border border-cyan-900/30 rounded">
              <div className="text-[9px] uppercase tracking-wider text-cyan-400 mb-1">Trajectory</div>
              <div className={`${isFocused ? 'text-[14px]' : 'text-[12px]'} text-zinc-200 leading-relaxed`}>{snap.trajectory}</div>
            </div>
          )}

          {snap.functions && snap.functions.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1.5">Hiring across functions</div>
              <div className="flex flex-wrap gap-1">
                {snap.functions.map((f, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-cyan-950/40 border border-cyan-900/50 text-cyan-300 rounded font-mono">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {snap.titles && snap.titles.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1.5">Sample roles</div>
              <div className="flex flex-wrap gap-1">
                {snap.titles.slice(0, isFocused ? 20 : 10).map((t, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded font-mono">
                    {t}
                  </span>
                ))}
                {!isFocused && snap.titles.length > 10 && (
                  <span className="text-[10px] px-1.5 py-0.5 text-zinc-600">+{snap.titles.length - 10} more</span>
                )}
              </div>
            </div>
          )}

          {snap.interpretation && (
            <div className="mb-3 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1">Signal interpretation</div>
              <div className={`${isFocused ? 'text-[14px]' : 'text-[12px]'} text-zinc-300 italic leading-relaxed`}>{snap.interpretation}</div>
            </div>
          )}

          {snap.sources && snap.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {snap.sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] px-2 py-0.5 bg-zinc-900 border border-zinc-700 hover:border-cyan-700 text-zinc-400 hover:text-cyan-300 rounded font-mono inline-flex items-center gap-1">
                  {s.name}<ExternalLink className="w-2.5 h-2.5" />
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <>
      <Panel title="Hiring Velocity" icon={Users}
        right={
          <div className="flex items-center gap-2">
            {loading && <span className="text-[10px] text-zinc-500">loading…</span>}
            <FocusButton onClick={() => setFocused(true)} />
          </div>
        }>
        {renderBody(false)}
      </Panel>
      <FocusOverlay open={focused} onClose={() => setFocused(false)} title="Hiring Velocity">
        {renderBody(true)}
      </FocusOverlay>
    </>
  );
}
