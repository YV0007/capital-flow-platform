import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import Panel from '../shared/Panel.jsx';
import { useWorkerUrl } from '../../../lib/workerUrl.js';

export default function CompetitorSharePanel({ companyId }) {
  const workerUrl = useWorkerUrl();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${workerUrl.replace(/\/$/, '')}/competitors?company=${encodeURIComponent(companyId)}`, { mode: 'cors' });
        if (!resp.ok) throw new Error(`Worker ${resp.status}`);
        const d = await resp.json();
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'fetch failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [companyId, workerUrl]);

  const share = data?.share || [];
  const total = data?.total30d || 0;
  const ownEntry = share.find(s => s.isOwn);

  return (
    <Panel title="Competitor Mention Share — last 30 days" icon={Activity}
      subtitle="News mention share-of-voice vs tracked direct competitors"
      right={loading ? <span className="text-[10px] text-zinc-500">loading…</span> : null}>

      <div className="text-[11px] text-zinc-500 italic mb-3">
        Absolute mention count is noise. Share-of-voice among direct competitors is signal — if our share drops while a rival's rises, that's a market-position shift visible before any revenue data leaks out.
      </div>

      {error ? (
        <div className="text-[10px] text-amber-400 mb-2 px-2 py-1 bg-amber-950/20 border border-amber-900/50 rounded">
          Worker error: {error}
        </div>
      ) : total === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded p-6 text-center">
          <div className="text-xs text-zinc-500 mb-1">No mentions in last 30 days yet.</div>
          <div className="text-[10px] text-zinc-600">Data accumulates as the worker runs daily. Re-check in a week.</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="bg-zinc-950 border border-cyan-900/40 rounded p-2">
              <div className="text-[9px] uppercase tracking-wider text-cyan-400">Own share</div>
              <div className="font-mono text-2xl text-cyan-300 mt-0.5">
                {ownEntry ? `${(ownEntry.share * 100).toFixed(0)}%` : '—'}
              </div>
              <div className="text-[10px] text-zinc-500">{ownEntry?.count || 0} of {total} mentions</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-2">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Total mentions</div>
              <div className="font-mono text-2xl text-zinc-100 mt-0.5">{total}</div>
              <div className="text-[10px] text-zinc-500">last 30 days</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-2">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Tracked competitors</div>
              <div className="font-mono text-2xl text-zinc-100 mt-0.5">{share.filter(s => !s.isOwn).length}</div>
              <div className="text-[10px] text-zinc-500">in panel</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-2">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Top competitor</div>
              <div className="font-mono text-sm text-zinc-200 mt-1 truncate">
                {share.find(s => !s.isOwn) ? share.find(s => !s.isOwn).name : '—'}
              </div>
              <div className="text-[10px] text-zinc-500">
                {share.find(s => !s.isOwn) ? `${(share.find(s => !s.isOwn).share * 100).toFixed(0)}%` : ''}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1">Share breakdown</div>
            {share.map(s => {
              const pct = (s.share * 100);
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`w-32 text-[11px] truncate ${s.isOwn ? 'text-cyan-300 font-semibold' : 'text-zinc-400'}`}>
                    {s.name}{s.isOwn ? ' (us)' : ''}
                  </div>
                  <div className="flex-1 h-3 bg-zinc-900 rounded relative overflow-hidden">
                    <div
                      className={`h-full ${s.isOwn ? 'bg-cyan-600' : 'bg-zinc-600'}`}
                      style={{ width: `${pct}%`, transition: 'width 0.4s ease-out' }}
                    />
                  </div>
                  <div className="w-12 text-right text-[11px] font-mono text-zinc-300">{pct.toFixed(0)}%</div>
                  <div className="w-10 text-right text-[10px] font-mono text-zinc-500">{s.count}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Panel>
  );
}
