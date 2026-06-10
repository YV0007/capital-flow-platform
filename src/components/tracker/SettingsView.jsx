// Position configuration, backup/restore, and cap-table event management.
// Translated from monolith lines 11342–11503.

import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Plus,
  Download,
  Upload,
  RotateCcw,
  Layers,
} from 'lucide-react';

import Panel from './shared/Panel.jsx';
import Modal from './shared/Modal.jsx';
import { todayISO, fmtUSD } from '../../lib/utils.js';
import optionsJson from '../../data/options.json';

const { STAGE_OPTIONS } = optionsJson;

export default function SettingsView({ cfg, onSaveConfig, observations, syndicateLog, scores, capEvents, onResetAll, onImport, onAddCapEvent }) {
  const [editCfg, setEditCfg] = useState({ ...cfg });
  const [confirmReset, setConfirmReset] = useState(false);
  const [importText, setImportText] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [capEventOpen, setCapEventOpen] = useState(false);
  const [newCap, setNewCap] = useState({ date: todayISO(), round_type: 'Series A', size_usd: '', lead: '', pre_money_usd: '', post_money_usd: '', dilution_pct: '', notes: '' });

  const fieldCls = "w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200";
  const labelCls = "text-[10px] uppercase tracking-wider text-zinc-500 mb-1 block";

  function exportJSON() {
    const payload = { cfg, observations, syndicateLog, scores, capEvents, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zeely-dashboard-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    try {
      const parsed = JSON.parse(importText);
      onImport(parsed);
      setImportOpen(false);
      setImportText('');
    } catch (e) {
      alert('Invalid JSON: ' + e.message);
    }
  }

  function saveCapEvent() {
    if (!newCap.date || !newCap.round_type) return alert('Date and round type required.');
    onAddCapEvent({ ...newCap, id: `cap_${Date.now()}`, createdAt: new Date().toISOString() });
    setNewCap({ date: todayISO(), round_type: 'Series A', size_usd: '', lead: '', pre_money_usd: '', post_money_usd: '', dilution_pct: '', notes: '' });
    setCapEventOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-[11px] text-zinc-500 italic">
        Configure data sources, API keys, syndicate disclosures, and alert thresholds for this position. Field-level help appears on hover.
      </div>
      <Panel title="Position Configuration" icon={SettingsIcon}
        right={<button onClick={() => onSaveConfig(editCfg)} className="text-[10px] inline-flex items-center gap-1 px-2 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded"><Save className="w-3 h-3" />Save changes</button>}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            ['company_brand_name', 'Brand name', 'text'],
            ['company_legal_name', 'Legal entity', 'text'],
            ['entry_date', 'Entry date', 'date'],
            ['gross_investment_usd', 'Gross investment ($)', 'number'],
            ['syndicate_lead_fee_usd', 'Syndicate fee ($)', 'number'],
            ['net_deployed_usd', 'Net deployed ($)', 'number'],
            ['price_per_share_usd', 'Price/share ($)', 'number'],
            ['shares_held', 'Shares held', 'number'],
            ['round_size_usd', 'Round size ($)', 'number'],
            ['pre_money_valuation_usd', 'Pre-money ($)', 'number'],
            ['implied_economic_interest_pct', 'Implied % (pre-dilution)', 'number'],
            ['carry_on_exit_pct', 'Exit carry %', 'number'],
            ['hurdle_on_exit_pct', 'Exit hurdle %', 'number'],
            ['carry_on_distribution_pct', 'Distribution carry %', 'number'],
            ['hurdle_on_distribution_pct', 'Distribution hurdle %', 'number'],
            ['syndicate_lead', 'Syndicate lead', 'text'],
            ['nominee', 'Nominee', 'text'],
          ].map(([k, label, type]) => (
            <div key={k}>
              <label className={labelCls}>{label}</label>
              <input type={type} className={fieldCls} value={editCfg[k] ?? ''} onChange={e => setEditCfg(c => ({ ...c, [k]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))} />
            </div>
          ))}
          <div>
            <label className={labelCls}>Stage classification</label>
            <select className={fieldCls} value={editCfg.default_stage_classification} onChange={e => setEditCfg(c => ({ ...c, default_stage_classification: e.target.value }))}>
              {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>AI / SaaS overlay</label>
            <select className={fieldCls} value={String(editCfg.ai_overlay_enabled)} onChange={e => setEditCfg(c => ({ ...c, ai_overlay_enabled: e.target.value === 'true' }))}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
        </div>
      </Panel>

      <Panel title="Cap-Table Events (Subsequent Rounds & Dilution)" icon={Layers}
        right={<button onClick={() => setCapEventOpen(true)} className="text-[10px] inline-flex items-center gap-1 px-2 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded"><Plus className="w-3 h-3" />Add cap event</button>}>
        {capEvents.length === 0 ? (
          <div className="text-[11px] text-zinc-600 italic py-3 text-center">No subsequent rounds logged. Add when Zeely raises a priced round.</div>
        ) : (
          <table className="w-full text-xs">
            <thead><tr className="text-left border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
              <th className="px-2 py-1.5">Date</th><th className="px-2 py-1.5">Round</th><th className="px-2 py-1.5">Lead</th>
              <th className="px-2 py-1.5">Size</th><th className="px-2 py-1.5">Pre-money</th><th className="px-2 py-1.5">Dilution %</th>
            </tr></thead>
            <tbody>{capEvents.map(c => (
              <tr key={c.id} className="border-b border-zinc-900">
                <td className="px-2 py-1.5 font-mono">{c.date}</td>
                <td className="px-2 py-1.5">{c.round_type}</td>
                <td className="px-2 py-1.5">{c.lead || '—'}</td>
                <td className="px-2 py-1.5 font-mono">{c.size_usd ? fmtUSD(c.size_usd, { compact: true }) : '—'}</td>
                <td className="px-2 py-1.5 font-mono">{c.pre_money_usd ? fmtUSD(c.pre_money_usd, { compact: true }) : '—'}</td>
                <td className="px-2 py-1.5 font-mono">{c.dilution_pct ? `${c.dilution_pct}%` : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Panel>

      <Panel title="Backup & Restore" icon={Download}>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportJSON} className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 rounded text-zinc-300 hover:bg-zinc-800"><Download className="w-3.5 h-3.5" />Export JSON</button>
          <button onClick={() => setImportOpen(true)} className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 rounded text-zinc-300 hover:bg-zinc-800"><Upload className="w-3.5 h-3.5" />Import JSON</button>
          <button onClick={() => setConfirmReset(true)} className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-800 rounded text-rose-400 hover:bg-rose-950/40"><RotateCcw className="w-3.5 h-3.5" />Reset all data</button>
        </div>
        <div className="text-[10px] text-zinc-500 mt-2">Data is persisted across sessions via window.storage (personal scope). Export at least monthly.</div>
      </Panel>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset All Data — Confirm">
        <p className="text-sm text-zinc-300">This will delete all observations, scores, syndicate communications, and cap events. The position configuration will be reset to seed defaults.</p>
        <p className="text-xs text-zinc-500 mt-2">This cannot be undone. Export a backup first if you want to preserve history.</p>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 text-xs border border-zinc-700 rounded text-zinc-300">Cancel</button>
          <button onClick={() => { onResetAll(); setConfirmReset(false); }} className="px-3 py-1.5 text-xs bg-rose-700 hover:bg-rose-600 text-white rounded">Yes, reset everything</button>
        </div>
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import JSON Backup" wide>
        <p className="text-xs text-zinc-400 mb-2">Paste a previously exported JSON backup. Existing data will be replaced.</p>
        <textarea value={importText} onChange={e => setImportText(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-zinc-200 font-mono min-h-[200px]" />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={() => setImportOpen(false)} className="px-3 py-1.5 text-xs border border-zinc-700 rounded text-zinc-300">Cancel</button>
          <button onClick={handleImport} className="px-3 py-1.5 text-xs bg-cyan-700 hover:bg-cyan-600 text-white rounded">Import</button>
        </div>
      </Modal>

      <Modal open={capEventOpen} onClose={() => setCapEventOpen(false)} title="Add Cap-Table Event">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Date</label><input type="date" className={fieldCls} value={newCap.date} onChange={e => setNewCap(c => ({ ...c, date: e.target.value }))} /></div>
            <div><label className={labelCls}>Round type</label><input className={fieldCls} value={newCap.round_type} onChange={e => setNewCap(c => ({ ...c, round_type: e.target.value }))} /></div>
            <div><label className={labelCls}>Lead</label><input className={fieldCls} value={newCap.lead} onChange={e => setNewCap(c => ({ ...c, lead: e.target.value }))} /></div>
            <div><label className={labelCls}>Round size ($)</label><input type="number" className={fieldCls} value={newCap.size_usd} onChange={e => setNewCap(c => ({ ...c, size_usd: parseFloat(e.target.value) || '' }))} /></div>
            <div><label className={labelCls}>Pre-money ($)</label><input type="number" className={fieldCls} value={newCap.pre_money_usd} onChange={e => setNewCap(c => ({ ...c, pre_money_usd: parseFloat(e.target.value) || '' }))} /></div>
            <div><label className={labelCls}>Post-money ($)</label><input type="number" className={fieldCls} value={newCap.post_money_usd} onChange={e => setNewCap(c => ({ ...c, post_money_usd: parseFloat(e.target.value) || '' }))} /></div>
            <div><label className={labelCls}>Your dilution %</label><input type="number" step="0.01" className={fieldCls} value={newCap.dilution_pct} onChange={e => setNewCap(c => ({ ...c, dilution_pct: parseFloat(e.target.value) || '' }))} /></div>
          </div>
          <div><label className={labelCls}>Notes</label><textarea className={fieldCls + ' min-h-[60px]'} value={newCap.notes} onChange={e => setNewCap(c => ({ ...c, notes: e.target.value }))} /></div>
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button onClick={() => setCapEventOpen(false)} className="px-3 py-1.5 text-xs border border-zinc-700 rounded text-zinc-300">Cancel</button>
            <button onClick={saveCapEvent} className="px-3 py-1.5 text-xs bg-cyan-700 hover:bg-cyan-600 text-white rounded">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
