import React, { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';

import { relTime } from '../../../lib/utils.js';
import { useWorkerUrl } from '../../../lib/workerUrl.js';
import BriefStack, { categoryForItem } from './BriefStack.jsx';
import { ManualMentionAddModal } from './NewsMentionsFeed.jsx';

// ────────────────────────────────────────────────────────────────
// WEEKLY BRIEF — Claude-with-web-search VC intelligence
// ────────────────────────────────────────────────────────────────
const BRIEF_MANUAL_KEY = (companyId) => `${companyId}:brief-manual`;

// ────────────────────────────────────────────────────────────────
// BriefHeader — title + filter chips + meta
// ────────────────────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { id: 'all',         label: 'All' },
  { id: 'funding',     label: 'Funding' },
  { id: 'product',     label: 'Product' },
  { id: 'risk',        label: 'Risk' },
  { id: 'ma',          label: 'M&A' },
  { id: 'team',        label: 'Team' },
  { id: 'competitive', label: 'Competitive' },
];

function BriefHeader({ generatedAt, isSeeded, filter, setFilter, counts, onAddManual }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-400" />
          <h2 className="text-[16px] font-semibold text-zinc-100">Weekly Brief</h2>
          {generatedAt && (
            <span className="text-[11px] text-zinc-500 font-mono ml-1">· generated {relTime(generatedAt)}</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map(opt => {
          const count = counts[opt.id] || 0;
          const active = filter === opt.id;
          if (opt.id !== 'all' && count === 0) return null;
          return (
            <button key={opt.id} onClick={() => setFilter(opt.id)}
              className={`text-[11px] px-2.5 py-1 rounded border font-medium inline-flex items-center gap-1.5 transition-colors ${
                active
                  ? 'bg-cyan-900/40 border-cyan-700 text-cyan-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}>
              {opt.label}
              <span className={`text-[10px] font-mono ${active ? 'text-cyan-400' : 'text-zinc-600'}`}>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// WeeklyBriefPanel — top-level, fetches data, hosts grid + manuals
// ────────────────────────────────────────────────────────────────
function WeeklyBriefPanel({ companyId, isResearch = false }) {
  const workerUrl = useWorkerUrl();
  const [brief, setBrief] = useState(null);
  const [manualItems, setManualItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${workerUrl.replace(/\/$/, '')}/brief?company=${encodeURIComponent(companyId)}`, { mode: 'cors' });
        if (!resp.ok) throw new Error(`Worker ${resp.status}`);
        const data = await resp.json();
        if (!cancelled) setBrief(data.brief || null);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'fetch failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
      try {
        const m = await window.storage.get(BRIEF_MANUAL_KEY(companyId));
        if (!cancelled) setManualItems(JSON.parse(m.value || '[]'));
      } catch { if (!cancelled) setManualItems([]); }
    })();
    return () => { cancelled = true; };
  }, [companyId, workerUrl]);

  async function addManual(item) {
    const enriched = {
      ...item,
      id: item.id || `manual-${Date.now()}`,
      isManual: true,
      importance: item.importance || 'medium',
      headline: item.title || item.headline || 'Manual entry',
      summary: item.notes || item.summary || '',
      whyItMatters: item.whyItMatters || '',
      date: item.date || new Date().toISOString().slice(0, 10),
      sources: item.url ? [{ name: item.source || 'Manual', url: item.url, date: item.date }] : [],
    };
    const next = [enriched, ...manualItems];
    setManualItems(next);
    try { await window.storage.set(BRIEF_MANUAL_KEY(companyId), JSON.stringify(next)); } catch {}
  }

  async function removeManual(id) {
    const next = manualItems.filter(i => i.id !== id);
    setManualItems(next);
    try { await window.storage.set(BRIEF_MANUAL_KEY(companyId), JSON.stringify(next)); } catch {}
  }

  // Merge worker brief + manual items; manuals first
  const allItems = useMemo(() => {
    const workerItems = brief?.items || [];
    return [...manualItems, ...workerItems];
  }, [brief, manualItems]);

  // Compute filter counts
  const counts = useMemo(() => {
    const c = { all: allItems.length };
    for (const item of allItems) {
      const cat = categoryForItem(item);
      if (cat) c[cat.id] = (c[cat.id] || 0) + 1;
    }
    return c;
  }, [allItems]);

  // Apply filter
  const filteredItems = useMemo(() => {
    if (filter === 'all') return allItems;
    return allItems.filter(item => {
      const cat = categoryForItem(item);
      return cat && cat.id === filter;
    });
  }, [allItems, filter]);

  const generatedAt = brief?.generatedAt ? new Date(brief.generatedAt).getTime() : null;
  const isSeeded = brief?.seeded === true;

  return (
    <div>
      <BriefHeader
        generatedAt={generatedAt}
        isSeeded={isSeeded}
        filter={filter}
        setFilter={setFilter}
        counts={counts}
        onAddManual={isResearch ? null : () => setManualOpen(true)}
      />

      {error && (
        <div className="text-[11px] text-amber-400 mb-3 px-3 py-2 bg-amber-950/20 border border-amber-900/50 rounded">
          Worker error: {error}
        </div>
      )}

      {loading && allItems.length === 0 ? (
        <div className="text-[12px] text-zinc-500 italic py-8 text-center">Loading brief…</div>
      ) : filteredItems.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-lg p-8 text-center">
          <div className="text-[13px] text-zinc-400 mb-1">
            {filter === 'all' ? 'No brief items yet.' : `No items in "${filter}".`}
          </div>
          <div className="text-[11px] text-zinc-600 leading-relaxed">
            {brief?.coverageNotes
              ? brief.coverageNotes
              : 'First brief will generate on next Sunday run. Use Add manual to log specific items in the meantime.'}
          </div>
        </div>
      ) : (
        <BriefStack items={filteredItems} onRemove={(item) => item.isManual && removeManual(item.id || item.url)} />
      )}

      <ManualMentionAddModal open={manualOpen} onClose={() => setManualOpen(false)} onSave={addManual} />
    </div>
  );
}

export default WeeklyBriefPanel;
