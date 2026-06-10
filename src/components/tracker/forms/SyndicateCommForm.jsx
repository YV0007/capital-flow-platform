// Syndicate communication log form — monolith lines 3793–3862.

import { useState } from 'react';
import { Save } from 'lucide-react';

import { todayISO } from '../../../lib/utils.js';
import optionsJson from '../../../data/options.json';

const { SYNDICATE_SOURCES, SYNDICATE_CHANNELS, MATERIALITY_OPTIONS } = optionsJson;

export default function SyndicateCommForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial || {
    date: todayISO(),
    source: SYNDICATE_SOURCES[0],
    channel: 'Email',
    summary: '',
    materiality: 'routine',
    followUp: false,
    followUpNote: '',
    relatedObsIds: [],
  });
  function update(patch) { setForm(f => ({ ...f, ...patch })); }
  function submit() {
    if (!form.summary.trim()) return alert('Summary required.');
    onSave({ ...form, id: initial?.id || `syn_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, createdAt: initial?.createdAt || new Date().toISOString() });
  }
  const fieldCls = "w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-cyan-600 outline-none";
  const labelCls = "text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Date</label>
          <input type="date" className={fieldCls} value={form.date} onChange={e => update({ date: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Source</label>
          <select className={fieldCls} value={form.source} onChange={e => update({ source: e.target.value })}>
            {SYNDICATE_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Channel</label>
          <select className={fieldCls} value={form.channel} onChange={e => update({ channel: e.target.value })}>
            {SYNDICATE_CHANNELS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Summary</label>
        <textarea className={fieldCls + ' min-h-[100px]'} value={form.summary} onChange={e => update({ summary: e.target.value })} placeholder="What was communicated? Any specific metrics or claims? Whose words?" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Materiality</label>
          <select className={fieldCls} value={form.materiality} onChange={e => update({ materiality: e.target.value })}>
            {MATERIALITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Follow-up Needed</label>
          <select className={fieldCls} value={String(form.followUp)} onChange={e => update({ followUp: e.target.value === 'true' })}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
      </div>
      {form.followUp && (
        <div>
          <label className={labelCls}>Follow-up Note</label>
          <textarea className={fieldCls + ' min-h-[60px]'} value={form.followUpNote} onChange={e => update({ followUpNote: e.target.value })} />
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs border border-zinc-700 rounded text-zinc-300 hover:bg-zinc-800">Cancel</button>
        <button onClick={submit} className="px-3 py-1.5 text-xs bg-cyan-700 hover:bg-cyan-600 text-white rounded inline-flex items-center gap-1.5"><Save className="w-3 h-3" />Save Communication</button>
      </div>
    </div>
  );
}
