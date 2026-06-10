import { useState } from 'react';
import { Save } from 'lucide-react';
import { scoreColor } from '../../../lib/utils.js';
import optionsJson from '../../../data/options.json';

const { CONFIDENCE_OPTIONS } = optionsJson;

export default function ScoreEditor({ dim, onSave, onCancel }) {
  const [value, setValue] = useState(dim.score ?? 5.5);
  const [confidence, setConfidence] = useState(dim.confidence ?? 'med');
  const [rationale, setRationale] = useState(dim.rationale ?? '');
  const fieldCls = "w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-cyan-600 outline-none";
  const sc = scoreColor(value);
  return (
    <div className="border-t border-zinc-800 px-3 py-2 space-y-2 bg-zinc-950/40">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-zinc-500">Score (1–10)</label>
          <div className="flex items-center gap-2">
            <input type="range" min="1" max="10" step="0.1" value={value} onChange={e => setValue(parseFloat(e.target.value))} className="flex-1" />
            <span className={`font-mono text-sm w-10 text-right ${sc.text}`}>{value.toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-[9px] text-zinc-600 font-mono mt-0.5">
            <span className="text-rose-500">1 weak</span>
            <span className="text-amber-500">5 mixed</span>
            <span className="text-emerald-500">10 strong</span>
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-zinc-500">Confidence</label>
          <select className={fieldCls} value={confidence} onChange={e => setConfidence(e.target.value)}>
            {CONFIDENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-zinc-500">Rationale (cite observations / specifics)</label>
        <textarea className={fieldCls + ' min-h-[60px]'} value={rationale} onChange={e => setRationale(e.target.value)} placeholder="Why this score? Reference specific observations, dates, sources." />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1 text-xs border border-zinc-700 rounded text-zinc-300 hover:bg-zinc-800">Cancel</button>
        <button onClick={() => onSave(dim.id, value, confidence, rationale)} className="px-3 py-1 text-xs bg-cyan-700 hover:bg-cyan-600 text-white rounded inline-flex items-center gap-1"><Save className="w-3 h-3" />Save</button>
      </div>
    </div>
  );
}
