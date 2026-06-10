import { useState, useMemo } from 'react';
import { BookOpen, Upload, Plus, ExternalLink } from 'lucide-react';
import Panel from './shared/Panel.jsx';
import Modal from './shared/Modal.jsx';
import { SourceTag, MemoBadge, ConfidenceBadge, TrendDelta, StaleTag } from './shared/badges.jsx';
import { METRIC_FRAMEWORK, isStale, daysBetween, todayISO } from '../../lib/utils.js';
import { CORROB_SOURCES } from '../../data/corrob-sources.js';
import optionsJson from '../../data/options.json';

const { SOURCE_TYPE_OPTIONS, CONFIDENCE_OPTIONS } = optionsJson;

export default function ObservationLogView({ observations, onAdd, onSupersede, onBulkAdd }) {
  const [filter, setFilter] = useState({ category: '', source: '', confidence: '', from: '', to: '', includeSuperseded: false });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const filtered = useMemo(() => {
    return observations.filter(o => {
      if (!filter.includeSuperseded && o.superseded) return false;
      if (filter.category && o.frameworkCategory !== filter.category) return false;
      if (filter.source && o.sourceType !== filter.source) return false;
      if (filter.confidence && o.confidence !== filter.confidence) return false;
      if (filter.from && o.date < filter.from) return false;
      if (filter.to && o.date > filter.to) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [observations, filter]);

  function handleBulkPaste() {
    // Format: date<TAB>category<TAB>label<TAB>value<TAB>unit<TAB>sourceTool<TAB>confidence<TAB>direction<TAB>corrobBucket
    const lines = bulkText.trim().split('\n').filter(Boolean);
    const newObs = [];
    for (const line of lines) {
      const parts = line.split('\t').map(p => p.trim());
      if (parts.length < 5) continue;
      const [date, frameworkCategory, label, value, unit, sourceTool = '', confidence = 'med', direction = 'flat', corrobBucket = 'headcount'] = parts;
      newObs.push({
        id: `obs_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        kind: 'observation',
        date, frameworkCategory, label, value, unit,
        sourceTool, sourceType: 'P', confidence, direction, corrobBucket,
        url: '', notes: '', metricId: '',
        createdAt: new Date().toISOString(),
      });
    }
    if (newObs.length === 0) return alert('No valid rows parsed. Use tab-separated columns.');
    onBulkAdd(newObs);
    setBulkText('');
    setBulkOpen(false);
  }

  return (
    <div className="space-y-3">
      <Panel title="Observation Log" icon={BookOpen}
        subtitle={`${observations.filter(o => !o.superseded).length} active · ${observations.filter(o => o.superseded).length} superseded`}
        right={
          <div className="flex gap-2">
            <button onClick={() => setBulkOpen(true)} className="text-[10px] inline-flex items-center gap-1 px-2 py-1 border border-zinc-700 rounded text-zinc-300 hover:bg-zinc-800"><Upload className="w-3 h-3" />Bulk paste</button>
            <button onClick={() => onAdd()} className="text-[10px] inline-flex items-center gap-1 px-2 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded"><Plus className="w-3 h-3" />Add observation</button>
          </div>
        }>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
          <select className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200" value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
            <option value="">All categories</option>
            {METRIC_FRAMEWORK.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200" value={filter.source} onChange={e => setFilter(f => ({ ...f, source: e.target.value }))}>
            <option value="">All sources</option>
            {SOURCE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200" value={filter.confidence} onChange={e => setFilter(f => ({ ...f, confidence: e.target.value }))}>
            <option value="">All confidence</option>
            {CONFIDENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input type="date" className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200" value={filter.from} onChange={e => setFilter(f => ({ ...f, from: e.target.value }))} placeholder="From" />
          <input type="date" className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200" value={filter.to} onChange={e => setFilter(f => ({ ...f, to: e.target.value }))} placeholder="To" />
          <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
            <input type="checkbox" checked={filter.includeSuperseded} onChange={e => setFilter(f => ({ ...f, includeSuperseded: e.target.checked }))} />
            Include superseded
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="px-2 py-1.5">Date</th>
                <th className="px-2 py-1.5">Category</th>
                <th className="px-2 py-1.5">Metric</th>
                <th className="px-2 py-1.5">Value</th>
                <th className="px-2 py-1.5">Bucket</th>
                <th className="px-2 py-1.5">Source</th>
                <th className="px-2 py-1.5">Conf</th>
                <th className="px-2 py-1.5">Dir</th>
                <th className="px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-[11px] text-zinc-600 italic py-6">No observations matching filter. Add the first one to begin baseline.</td></tr>
              ) : filtered.map(o => {
                const cat = METRIC_FRAMEWORK.find(c => c.id === o.frameworkCategory);
                const bucket = CORROB_SOURCES.find(s => s.id === o.corrobBucket);
                const stale = isStale(o);
                return (
                  <tr key={o.id} className={`border-b border-zinc-900 ${o.superseded ? 'opacity-40' : ''}`}>
                    <td className="px-2 py-2 font-mono text-zinc-300 whitespace-nowrap">{o.date}</td>
                    <td className="px-2 py-2 text-zinc-400">{cat?.label || '—'}</td>
                    <td className="px-2 py-2 text-zinc-200">
                      {o.label}
                      {o.notes && <div className="text-[10px] text-zinc-500 line-clamp-1">{o.notes}</div>}
                    </td>
                    <td className="px-2 py-2 font-mono text-zinc-200">
                      {o.rangeLow && o.rangeHigh ? `${o.rangeLow}–${o.rangeHigh}` : o.value || '—'}
                      {o.unit && <span className="text-zinc-500 ml-1">{o.unit}</span>}
                    </td>
                    <td className="px-2 py-2 text-zinc-400 text-[11px]">{bucket?.label.split(' ')[0] || '—'}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        <SourceTag value={o.sourceType} />
                        <MemoBadge obs={o} />
                        <span className="text-[10px] text-zinc-500">{o.sourceTool}</span>
                        {o.url && <a href={o.url} target="_blank" rel="noreferrer" className="text-cyan-500"><ExternalLink className="w-2.5 h-2.5" /></a>}
                      </div>
                    </td>
                    <td className="px-2 py-2"><ConfidenceBadge value={o.confidence} /></td>
                    <td className="px-2 py-2"><TrendDelta value={o.direction === 'up' ? 1 : o.direction === 'down' ? -1 : 0} suffix="" /></td>
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      {stale && <StaleTag days={daysBetween(o.date, todayISO())} threshold={bucket?.staleDays || 90} />}
                      {!o.superseded && <button onClick={() => onSupersede(o.id)} className="text-[10px] text-rose-400 hover:text-rose-300 ml-2">Supersede</button>}
                      {o.superseded && (
                        <span
                          title={o.supersededReason ? `Superseded${o.supersededBy ? ' by ' + o.supersededBy : ''}: ${o.supersededReason}` : 'Superseded'}
                          className={`text-[10px] italic ${o.supersededBy ? 'text-amber-500/70' : 'text-zinc-600'}`}
                        >
                          superseded{o.supersededBy ? ' (memo)' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Paste — Tab-Separated" wide>
        <div className="space-y-2">
          <div className="text-[11px] text-zinc-400">
            Format (TSV): <code className="text-cyan-400">date</code> · <code className="text-cyan-400">category</code> · <code className="text-cyan-400">label</code> · <code className="text-cyan-400">value</code> · <code className="text-cyan-400">unit</code> · <code className="text-cyan-400">sourceTool</code> · <code className="text-cyan-400">confidence</code> · <code className="text-cyan-400">direction</code> · <code className="text-cyan-400">corrobBucket</code>
          </div>
          <div className="text-[10px] text-zinc-500">Example: 2026-05-01{'\t'}team{'\t'}LinkedIn count{'\t'}87{'\t'}count{'\t'}LinkedIn{'\t'}high{'\t'}up{'\t'}headcount</div>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-200 font-mono min-h-[200px]" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setBulkOpen(false)} className="px-3 py-1.5 text-xs border border-zinc-700 rounded text-zinc-300">Cancel</button>
            <button onClick={handleBulkPaste} className="px-3 py-1.5 text-xs bg-cyan-700 hover:bg-cyan-600 text-white rounded">Import</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
