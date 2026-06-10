import React, { useEffect, useMemo, useState } from 'react';
import {
  Globe,
  RotateCcw,
  Plus,
  ExternalLink,
  Info,
  Save,
  X,
} from 'lucide-react';

import { relTime, todayISO } from '../../../lib/utils.js';
import Panel from '../shared/Panel.jsx';
import Modal from '../shared/Modal.jsx';
import {
  NEWS_WORKER_URL_DEFAULT,
  NEWS_WORKER_URL_KEY,
} from '../../../lib/workerUrl.js';

// Pre-existing Zeely-broken cache keys — preserved verbatim from monolith
// (see CLAUDE.md migration notes; do not "fix" without an explicit pass).
const NEWS_CACHE_KEY = 'zeely:news-cache';
const NEWS_MANUAL_KEY = 'zeely:news-manual';
const newsManualKey = (companyId) => `${companyId}:news-manual`;

// Classifier seed lists (also used elsewhere — exported for downstream reuse)
export const TIER1_VC_KEYWORDS = [
  'sequoia', 'a16z', 'andreessen', 'benchmark', 'accel', 'kleiner', 'greylock',
  'founders fund', 'thrive', 'tiger', 'coatue', 'lightspeed', 'index',
  'general catalyst', 'gv', 'google ventures', 'iconiq', 'altimeter', 'insight',
  'bessemer', 'matrix', 'redpoint', 'spark', 'usv', 'union square',
];
export const STRATEGIC_KEYWORDS = ['nvidia', 'alphabet', 'google', 'microsoft', 'meta', 'amazon', 'salesforce', 'oracle'];

const SOURCE_THEME = {
  reddit:    { tint: 'bg-orange-900/40 text-orange-300 border-orange-800',  letter: 'R'  },
  news:      { tint: 'bg-sky-900/40 text-sky-300 border-sky-800',           letter: 'N'  },
  youtube:   { tint: 'bg-rose-900/40 text-rose-300 border-rose-800',        letter: 'YT' },
  manual:    { tint: 'bg-cyan-900/40 text-cyan-300 border-cyan-800',        letter: 'M'  },
  twitter:   { tint: 'bg-zinc-800 text-zinc-300 border-zinc-700',           letter: 'X'  },
  instagram: { tint: 'bg-pink-900/40 text-pink-300 border-pink-800',        letter: 'IG' },
};

function ThumbPlaceholder({ source }) {
  const t = SOURCE_THEME[source] || SOURCE_THEME.manual;
  return (
    <div className={`w-20 h-20 rounded shrink-0 flex items-center justify-center border ${t.tint} font-mono text-base`}>
      {t.letter}
    </div>
  );
}

function NewsItemRow({ item }) {
  const [imgErr, setImgErr] = useState(false);
  const showImage = item.image && !imgErr;
  return (
    <a href={item.url} target="_blank" rel="noreferrer"
       className="flex gap-3 p-3 border border-zinc-800 rounded hover:bg-zinc-900/60 hover:border-zinc-700 transition-colors group">
      {showImage ? (
        <img src={item.image} alt="" onError={() => setImgErr(true)}
             className="w-20 h-20 rounded shrink-0 object-cover bg-zinc-900" />
      ) : <ThumbPlaceholder source={item.source} />}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-zinc-100 font-medium leading-snug line-clamp-2 group-hover:text-cyan-300">{item.title}</div>
        <div className="text-[10px] text-zinc-500 font-mono mt-1 truncate">
          {item.sourceLabel} · {relTime(item.ts)}
          {item.author && item.source !== 'reddit' && ` · ${item.author}`}
        </div>
        {item.excerpt && (
          <div className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{item.excerpt}</div>
        )}
        <div className="text-[10px] text-cyan-500 mt-1.5 inline-flex items-center gap-1 group-hover:text-cyan-400">
          <ExternalLink className="w-2.5 h-2.5" />
          <span className="truncate max-w-[260px]">{(() => { try { return new URL(item.url).hostname.replace(/^www\./, ''); } catch { return item.url; } })()}</span>
        </div>
      </div>
    </a>
  );
}

export function ManualMentionAddModal({ open, onClose, onSave }) {
  const [source, setSource] = useState('twitter');
  const [title, setTitle]   = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [url, setUrl]       = useState('');
  const [image, setImage]   = useState('');
  const [author, setAuthor] = useState('');
  const [date, setDate]     = useState(todayISO());

  function reset() {
    setSource('twitter'); setTitle(''); setExcerpt(''); setUrl(''); setImage(''); setAuthor(''); setDate(todayISO());
  }
  function submit() {
    if (!title.trim() || !url.trim()) { alert('Title and URL are required.'); return; }
    const sourceLabel = {
      twitter: `X${author ? ' / ' + author : ''}`,
      instagram: `Instagram${author ? ' / ' + author : ''}`,
      manual: `Manual${author ? ' / ' + author : ''}`,
    }[source];
    onSave({
      id: `manual_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      source,
      sourceLabel,
      title: title.trim(),
      excerpt: excerpt.trim(),
      url: url.trim(),
      image: image.trim() || null,
      ts: new Date(date).getTime(),
      author: author.trim() || null,
      manualEntry: true,
    });
    reset();
    onClose();
  }

  const fieldCls = "w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-cyan-600 outline-none";
  const labelCls = "text-[10px] uppercase tracking-wider text-zinc-500";
  return (
    <Modal open={open} onClose={onClose} title="Log Mention Manually" wide>
      <div className="space-y-3">
        <div className="bg-amber-950/30 border border-amber-900/50 rounded p-2.5 text-[11px] text-amber-200 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>Use this for sources the dashboard can't fetch directly: X / Twitter, Instagram, or any specific link you want pinned to the feed.</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Source</label>
            <select className={fieldCls} value={source} onChange={e => setSource(e.target.value)}>
              <option value="twitter">X / Twitter</option>
              <option value="instagram">Instagram</option>
              <option value="manual">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Date posted</label>
            <input type="date" className={fieldCls} value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Title / post text</label>
          <input className={fieldCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="The post or article headline" />
        </div>
        <div>
          <label className={labelCls}>URL</label>
          <input className={fieldCls} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Author / handle (optional)</label>
            <input className={fieldCls} value={author} onChange={e => setAuthor(e.target.value)} placeholder="@username or name" />
          </div>
          <div>
            <label className={labelCls}>Image URL (optional)</label>
            <input className={fieldCls} value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <div>
          <label className={labelCls}>Excerpt (optional)</label>
          <textarea className={fieldCls + ' min-h-[60px]'} value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="1–2 line summary" />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
          <button onClick={() => { reset(); onClose(); }} className="px-3 py-1.5 text-xs border border-zinc-700 rounded text-zinc-300 hover:bg-zinc-800">Cancel</button>
          <button onClick={submit} className="px-3 py-1.5 text-xs bg-cyan-700 hover:bg-cyan-600 text-white rounded inline-flex items-center gap-1"><Save className="w-3 h-3" />Save mention</button>
        </div>
      </div>
    </Modal>
  );
}

const FILTER_CHIPS = [
  { id: 'all',     label: 'All' },
  { id: 'news',    label: 'News' },
  { id: 'reddit',  label: 'Reddit' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'X' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'manual',  label: 'Manual' },
];

function NewsMentionsFeed({ cfg, companyId }) {
  const [items, setItems]       = useState([]);
  const [manualItems, setManualItems] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [workerUrl, setWorkerUrl] = useState(NEWS_WORKER_URL_DEFAULT);
  const [filter, setFilter]     = useState('all');  // all | press | community | aggregator | manual
  const [sortBy, setSortBy]     = useState('date'); // date | relevance
  const [manualOpen, setManualOpen] = useState(false);

  // Load worker URL override + manual items on mount and whenever companyId changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await window.storage.get(NEWS_WORKER_URL_KEY);
        if (!cancelled && u && u.value) setWorkerUrl(u.value || NEWS_WORKER_URL_DEFAULT);
      } catch {}
      try {
        const m = await window.storage.get(newsManualKey(companyId));
        if (!cancelled) setManualItems(JSON.parse(m.value || '[]'));
        else setManualItems([]);
      } catch { if (!cancelled) setManualItems([]); }
      if (!cancelled) await refresh();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Fetch from worker
  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const url = `${workerUrl.replace(/\/$/, '')}/news?company=${encodeURIComponent(companyId)}`;
      const resp = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!resp.ok) throw new Error(`Worker returned ${resp.status}`);
      const data = await resp.json();
      const fetched = Array.isArray(data.items) ? data.items : [];
      setItems(fetched);
      setLastFetch(data.lastFetch ? new Date(data.lastFetch).getTime() : Date.now());
    } catch (e) {
      setError(e?.message || 'fetch failed');
    } finally {
      setLoading(false);
    }
  }

  async function addManual(item) {
    // Mark as manual + ensure expected shape
    const enriched = { ...item, isManual: true, hash: item.id || item.url || String(Math.random()) };
    const next = [enriched, ...manualItems];
    setManualItems(next);
    try { await window.storage.set(newsManualKey(companyId), JSON.stringify(next)); } catch {}
  }

  async function removeManual(hash) {
    const next = manualItems.filter(i => i.hash !== hash && i.id !== hash);
    setManualItems(next);
    try { await window.storage.set(newsManualKey(companyId), JSON.stringify(next)); } catch {}
  }

  // Combined feed — worker items + manual items
  const allItems = useMemo(() => {
    const manual = manualItems.map(m => ({
      ...m,
      sourceType: 'manual',
      provider: 'manual',
      relevance: m.relevance ?? 5,
      summary: m.summary ?? m.notes ?? null,
      date: m.date || (m.ts ? new Date(m.ts).toISOString() : new Date().toISOString()),
    }));
    return [...manual, ...items];
  }, [items, manualItems]);

  // Filtering
  const filtered = useMemo(() => {
    let out = allItems;
    if (filter !== 'all') out = out.filter(i => i.sourceType === filter);
    if (sortBy === 'relevance') {
      out = [...out].sort((a, b) => (b.relevance || 0) - (a.relevance || 0) || (new Date(b.date || 0) - new Date(a.date || 0)));
    } else {
      out = [...out].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }
    return out;
  }, [allItems, filter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const last7 = allItems.filter(i => i.date && (now - new Date(i.date).getTime()) < 7 * day);
    const counts = {
      press: 0, community: 0, aggregator: 0, manual: 0,
      starHigh: 0,  // relevance >= 4
    };
    for (const item of allItems) {
      const t = item.sourceType || 'aggregator';
      if (counts[t] != null) counts[t]++;
      if ((item.relevance || 0) >= 4) counts.starHigh++;
    }
    return { count7: last7.length, total: allItems.length, ...counts };
  }, [allItems]);

  const stale = lastFetch == null || (Date.now() - lastFetch > 48 * 60 * 60 * 1000);
  const isResearchOnly = !cfg.is_position;

  const FILTER_TABS = [
    { id: 'all',        label: 'All',         count: stats.total },
    { id: 'press',      label: 'Press',       count: stats.press },
    { id: 'community',  label: 'Community',   count: stats.community },
    { id: 'aggregator', label: 'Aggregator',  count: stats.aggregator },
    { id: 'manual',     label: 'Manual',      count: stats.manual },
  ];

  return (
    <Panel title="News & Mentions Feed" icon={Globe}
      subtitle="Worker-fetched news, scored by Claude for relevance · daily refresh via Cloudflare cron"
      right={
        <div className="flex items-center gap-1.5">
          {error && <span className="text-[10px] text-rose-400 font-mono" title={error}>fetch error</span>}
          {stale && lastFetch && <span className="text-[10px] text-amber-400 font-mono">stale</span>}
          <button onClick={refresh} disabled={loading} className="text-[10px] inline-flex items-center gap-1 px-2 py-1 border border-zinc-700 rounded text-zinc-300 hover:bg-zinc-800 disabled:opacity-50">
            <RotateCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          {cfg?.is_position !== false && (
            <button onClick={() => setManualOpen(true)} className="text-[10px] inline-flex items-center gap-1 px-2 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded">
              <Plus className="w-3 h-3" />Add manual
            </button>
          )}
        </div>
      }>

      <div className="text-[11px] text-zinc-500 italic mb-3">
        Background worker fetches NewsAPI.ai + GDELT + Hacker News + RSS daily, scores each item with Claude (relevance 1-5 + summary). Manual entries for X / Instagram / LinkedIn live alongside.
      </div>

      {/* Top summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div className="bg-zinc-950 border border-zinc-800 rounded p-2">
          <div className="text-[9px] uppercase tracking-wider text-zinc-500">Last 7 days</div>
          <div className="font-mono text-xl text-zinc-100 mt-0.5">{stats.count7}</div>
          <div className="text-[10px] text-zinc-500">items</div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded p-2">
          <div className="text-[9px] uppercase tracking-wider text-zinc-500">High relevance</div>
          <div className="font-mono text-xl text-emerald-400 mt-0.5">{stats.starHigh}</div>
          <div className="text-[10px] text-zinc-500">★★★★+ items</div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded p-2">
          <div className="text-[9px] uppercase tracking-wider text-zinc-500">Press</div>
          <div className="font-mono text-xl text-zinc-100 mt-0.5">{stats.press}</div>
          <div className="text-[10px] text-zinc-500">tier-1 articles</div>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded p-2">
          <div className="text-[9px] uppercase tracking-wider text-zinc-500">Last fetch</div>
          <div className="font-mono text-sm text-zinc-200 mt-1">{lastFetch ? relTime(lastFetch) : 'never'}</div>
          <div className="text-[10px] text-zinc-500">{stats.total} total in feed</div>
        </div>
      </div>

      {/* Filter tabs + sort */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        {FILTER_TABS.map(t => {
          const active = filter === t.id;
          return (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className={`text-[10px] px-2 py-1 rounded border font-mono inline-flex items-center gap-1 ${
                active ? 'bg-cyan-700 border-cyan-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}>
              {t.label}
              <span className={`text-[9px] ${active ? 'text-cyan-100' : 'text-zinc-600'}`}>{t.count}</span>
            </button>
          );
        })}
        <div className="ml-auto inline-flex items-center gap-1 text-[10px] text-zinc-500">
          <span>Sort:</span>
          <button onClick={() => setSortBy('date')}      className={`px-2 py-0.5 rounded ${sortBy === 'date' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>Newest</button>
          <button onClick={() => setSortBy('relevance')} className={`px-2 py-0.5 rounded ${sortBy === 'relevance' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>Relevance</button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="text-[10px] text-amber-400 mb-2 px-2 py-1 bg-amber-950/20 border border-amber-900/50 rounded">
          Worker error: {error}. Fix: confirm worker is deployed at {workerUrl}, or override the URL in Settings.
        </div>
      )}

      {/* Scrollable feed */}
      <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 600 }}>
        {filtered.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded p-6 text-center">
            {loading ? (
              <div className="text-xs text-zinc-500">Loading from worker…</div>
            ) : (
              <>
                <div className="text-xs text-zinc-500 mb-1">No items{filter !== 'all' ? ` in ${filter}` : ''}.</div>
                <div className="text-[10px] text-zinc-600">
                  {!lastFetch
                    ? 'Worker has not been fetched yet. Click Refresh.'
                    : `Worker last ran ${relTime(lastFetch)} but found nothing. Try Add manual for items you've spotted yourself.`}
                </div>
              </>
            )}
          </div>
        ) : (
          filtered.map(item => (
            <ScoredNewsItemRow key={item.hash || item.url} item={item} onRemove={item.isManual ? () => removeManual(item.hash || item.url) : null} />
          ))
        )}
      </div>

      {/* Footer note */}
      <div className="mt-3 pt-3 border-t border-zinc-800 text-[10px] text-zinc-600 leading-relaxed">
        <span className="block text-zinc-700 italic">X / Instagram / LinkedIn require manual entry — paste links via "Add manual".</span>
      </div>

      <ManualMentionAddModal open={manualOpen} onClose={() => setManualOpen(false)} onSave={addManual} />
    </Panel>
  );
}

// Single scored-news row — shows relevance stars, source-type badge, AI summary
function ScoredNewsItemRow({ item, onRemove }) {
  const stars = Math.max(0, Math.min(5, item.relevance || 0));
  const sourceTypeColor = {
    press:      'bg-sky-950/40 border-sky-900 text-sky-300',
    community:  'bg-violet-950/40 border-violet-900 text-violet-300',
    aggregator: 'bg-zinc-900 border-zinc-800 text-zinc-400',
    manual:     'bg-amber-950/40 border-amber-900 text-amber-300',
  }[item.sourceType] || 'bg-zinc-900 border-zinc-800 text-zinc-400';

  const dateStr = item.date ? relTime(new Date(item.date).getTime()) : '—';
  const hasUrl = item.url && item.url.startsWith('http');

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5 group/row hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-3">
        {/* Stars column */}
        <div className="flex flex-col items-center pt-0.5 shrink-0 min-w-[32px]">
          <div className="text-[10px] font-mono text-amber-400 leading-none">
            {stars > 0 ? '★'.repeat(stars) : '·'}
          </div>
          <div className="text-[8px] text-zinc-600 mt-0.5">{stars > 0 ? `${stars}/5` : 'unscored'}</div>
        </div>
        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {hasUrl ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-100 hover:text-cyan-300 leading-snug break-words">
                  {item.title || '(no title)'}
                </a>
              ) : (
                <span className="text-xs text-zinc-100">{item.title || '(no title)'}</span>
              )}
            </div>
            <span className={`shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-0.5 border rounded font-mono ${sourceTypeColor}`}>
              {item.sourceType || 'aggregator'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500 font-mono flex-wrap">
            <span>{item.source || 'unknown'}</span>
            <span>·</span>
            <span>{dateStr}</span>
            {item.provider && item.provider !== item.sourceType && (
              <>
                <span>·</span>
                <span className="text-zinc-600">via {item.provider}</span>
              </>
            )}
          </div>
          {item.summary && (
            <div className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed italic">
              {item.summary}
            </div>
          )}
          {!item.summary && item.snippet && (
            <div className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed line-clamp-2">
              {item.snippet}
            </div>
          )}
        </div>
        {/* Remove btn for manual entries */}
        {onRemove && (
          <button onClick={onRemove}
            title="Remove manual entry"
            className="opacity-0 group-hover/row:opacity-100 text-[10px] px-1.5 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-800 rounded transition-opacity shrink-0">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default NewsMentionsFeed;
