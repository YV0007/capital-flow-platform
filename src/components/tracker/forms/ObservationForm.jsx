// Observation entry form — used inside the App-level Modal mount for both
// add and edit flows. Monolith lines 3644–3791.

import { useState } from 'react';
import { Save } from 'lucide-react';

import { todayISO, METRIC_FRAMEWORK } from '../../../lib/utils.js';
import { CORROB_SOURCES } from '../../../data/corrob-sources.js';
import optionsJson from '../../../data/options.json';

const { SOURCE_TYPE_OPTIONS } = optionsJson;

export default function ObservationForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial || {
    date: todayISO(),
    frameworkCategory: 'team',
    metricId: '',
    label: '',
    value: '',
    unit: '',
    rangeLow: '',
    rangeHigh: '',
    sourceType: 'P',
    sourceTool: '',
    url: '',
    confidence: 'med',
    direction: 'flat',
    corrobBucket: 'headcount',
    notes: '',
    kind: 'observation',
  });

  const cat = METRIC_FRAMEWORK.find(c => c.id === form.frameworkCategory);

  function update(patch) { setForm(f => ({ ...f, ...patch })); }
  function submit() {
    if (!form.label && !form.metricId) return alert('Provide a metric label or pick from the framework.');
    if (!form.date) return alert('Date required.');
    onSave({ ...form, id: initial?.id || `obs_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, createdAt: initial?.createdAt || new Date().toISOString() });
  }

  const fieldCls = "w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-cyan-600 outline-none";
  const labelCls = "text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Kind</label>
          <select className={fieldCls} value={form.kind} onChange={e => update({ kind: e.target.value })}>
            <option value="observation">Observation (data point)</option>
            <option value="claim">Claim (PR / syndicate-relayed assertion)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Date (ISO)</label>
          <input type="date" className={fieldCls} value={form.date} onChange={e => update({ date: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Framework Category</label>
          <select className={fieldCls} value={form.frameworkCategory} onChange={e => update({ frameworkCategory: e.target.value, metricId: '' })}>
            {METRIC_FRAMEWORK.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Metric (from framework)</label>
          <select className={fieldCls} value={form.metricId} onChange={e => {
            const m = cat?.metrics.find(x => x.id === e.target.value);
            update({ metricId: e.target.value, label: m?.label || form.label, sourceType: m?.source || form.sourceType });
          }}>
            <option value="">— Custom / free-form —</option>
            {cat?.metrics.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Metric Label (free text — overrides framework label)</label>
        <input className={fieldCls} value={form.label} onChange={e => update({ label: e.target.value })} placeholder="e.g. LinkedIn employee count" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Value (point)</label>
          <input className={fieldCls} value={form.value} onChange={e => update({ value: e.target.value })} placeholder="e.g. 87" />
        </div>
        <div>
          <label className={labelCls}>Range Low (optional)</label>
          <input className={fieldCls} value={form.rangeLow} onChange={e => update({ rangeLow: e.target.value })} placeholder="optional" />
        </div>
        <div>
          <label className={labelCls}>Range High (optional)</label>
          <input className={fieldCls} value={form.rangeHigh} onChange={e => update({ rangeHigh: e.target.value })} placeholder="optional" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Unit</label>
          <input className={fieldCls} value={form.unit} onChange={e => update({ unit: e.target.value })} placeholder="USD, %, count, idx…" />
        </div>
        <div>
          <label className={labelCls}>QoQ Direction</label>
          <select className={fieldCls} value={form.direction} onChange={e => update({ direction: e.target.value })}>
            <option value="up">↑ Up</option>
            <option value="flat">→ Flat</option>
            <option value="down">↓ Down</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Confidence</label>
          <select className={fieldCls} value={form.confidence} onChange={e => update({ confidence: e.target.value })}>
            <option value="high">High (primary, recent)</option>
            <option value="med">Medium (modeled / 1 corroboration)</option>
            <option value="low">Low (single source / stale / unverified)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Corroboration Bucket (the 7)</label>
          <select className={fieldCls} value={form.corrobBucket} onChange={e => update({ corrobBucket: e.target.value })}>
            {CORROB_SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Source Type</label>
          <select className={fieldCls} value={form.sourceType} onChange={e => update({ sourceType: e.target.value })}>
            {SOURCE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Source Tool / Site</label>
          <input className={fieldCls} value={form.sourceTool} onChange={e => update({ sourceTool: e.target.value })} placeholder="e.g. Similarweb, LinkedIn, Crunchbase" />
        </div>
        <div>
          <label className={labelCls}>URL</label>
          <input className={fieldCls} value={form.url} onChange={e => update({ url: e.target.value })} placeholder="https://…" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea className={fieldCls + ' min-h-[60px]'} value={form.notes} onChange={e => update({ notes: e.target.value })} placeholder="Method, caveats, context…" />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs border border-zinc-700 rounded text-zinc-300 hover:bg-zinc-800">Cancel</button>
        <button onClick={submit} className="px-3 py-1.5 text-xs bg-cyan-700 hover:bg-cyan-600 text-white rounded inline-flex items-center gap-1.5"><Save className="w-3 h-3" />Save Observation</button>
      </div>
    </div>
  );
}
