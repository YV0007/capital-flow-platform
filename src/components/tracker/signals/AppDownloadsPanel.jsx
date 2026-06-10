import React, { useState, useMemo } from 'react';
import { AlertCircle, Plus, Info, Save } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import Panel from '../shared/Panel.jsx';
import Modal from '../shared/Modal.jsx';
import { ConfidenceBadge, SourceTag, StaleTag } from '../shared/badges.jsx';
import { daysBetween, todayISO } from '../../../lib/utils.js';
import { PRESENTATION_MODE } from '../../../lib/build-flags.js';

export default function AppDownloadsPanel({ src, observations, onLog }) {
  const obs = useMemo(
    () => observations
      .filter(o => !o.superseded && o.corrobBucket === 'app')
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [observations]
  );

  // Latest observation that actually carries download data (not the legacy
  // rank-style row). Falls back to the most recent one for date display.
  const latestWithDownloads = useMemo(() => {
    for (let i = obs.length - 1; i >= 0; i--) {
      if (obs[i]?.appDownloads) return obs[i];
    }
    return null;
  }, [obs]);
  const latestAny = obs[obs.length - 1] || null;

  function totalForWindow(o, key) {
    if (!o?.appDownloads) return null;
    const ios = o.appDownloads.ios?.[key];
    const and = o.appDownloads.android?.[key];
    if (ios == null && and == null) return null;
    return (ios || 0) + (and || 0);
  }

  const d30  = totalForWindow(latestWithDownloads, 'd30');
  const d90  = totalForWindow(latestWithDownloads, 'd90');
  const d180 = totalForWindow(latestWithDownloads, 'd180');

  // Platforms checked in the latest with-downloads observation.
  const platformsChecked = (() => {
    if (!latestWithDownloads?.appDownloads) return 0;
    const f = latestWithDownloads.appDownloads;
    let n = 0;
    const hasAny = (p) => p && (p.d30 != null || p.d90 != null || p.d180 != null);
    if (hasAny(f.ios)) n++;
    if (hasAny(f.android)) n++;
    return n;
  })();

  // Trend sparkline — uses the d30 (last-30-day) total from each obs that
  // has download data. Falls back to a flat empty state if none.
  const sparkData = useMemo(() => {
    return obs
      .filter(o => o.appDownloads && (o.appDownloads.ios?.d30 != null || o.appDownloads.android?.d30 != null))
      .map(o => ({ value: totalForWindow(o, 'd30') || 0, date: o.date }));
  }, [obs]);

  // Confidence: cross-reference per-platform count + window completeness.
  const confidence = (() => {
    if (!latestWithDownloads) return 'low';
    const windowsFilled = [d30, d90, d180].filter(v => v != null).length;
    if (platformsChecked >= 2 && windowsFilled >= 3) return 'high';
    if (platformsChecked >= 1 && windowsFilled >= 2) return 'med';
    return 'low';
  })();

  const stale = latestAny ? daysBetween(latestAny.date, todayISO()) > src.staleDays : false;
  const meetsMin = !src.requireMin || platformsChecked >= src.requireMin;

  // Compact number formatting: 1234 → "1.2K", 1500000 → "1.5M"
  function fmtN(n) {
    if (n == null) return '—';
    const abs = Math.abs(n);
    if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toLocaleString();
  }

  const Icon = src.icon;
  return (
    <Panel title={src.label} icon={Icon}
      subtitle={src.tools.join(' · ')}
      right={
        <div className="flex items-center gap-1.5">
          {!PRESENTATION_MODE && !meetsMin && obs.length > 0 && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-800 rounded font-mono inline-flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />Need iOS+Android
            </span>
          )}
          <button onClick={onLog} className="text-[10px] inline-flex items-center gap-1 px-2 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded">
            <Plus className="w-3 h-3" />Log downloads
          </button>
        </div>
      }>

      <div className="text-[11px] text-zinc-500 italic mb-3">{src.why}</div>

      {!latestWithDownloads ? (
        <div className="border border-dashed border-zinc-800 rounded p-4 text-center">
          <div className="text-xs text-zinc-500 mb-2">No download data logged yet.</div>
          <div className="text-[10px] text-zinc-600 leading-relaxed mb-3">
            Pull download estimates from Sensor Tower, Data.ai, Appfigures, or Similarweb App Intelligence (paid tools — manual entry). Enter rolling totals for last 30 / 90 / 180 days, per platform.
          </div>
          <button onClick={onLog} className="text-[11px] inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded">
            <Plus className="w-3 h-3" />Log first observation
          </button>
        </div>
      ) : (
        <>
          {/* Headline KPI row — 1mo / 3mo / 6mo totals */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Last 30 days</div>
              <div className="font-mono text-2xl text-zinc-100 mt-0.5">{fmtN(d30)}</div>
              <div className="text-[10px] text-zinc-500">downloads</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Last 90 days</div>
              <div className="font-mono text-2xl text-zinc-100 mt-0.5">{fmtN(d90)}</div>
              <div className="text-[10px] text-zinc-500">downloads</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Last 180 days</div>
              <div className="font-mono text-2xl text-zinc-100 mt-0.5">{fmtN(d180)}</div>
              <div className="text-[10px] text-zinc-500">downloads</div>
            </div>
          </div>

          {/* Per-platform breakdown row */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
            {[
              { k: 'ios',     label: 'iOS' },
              { k: 'android', label: 'Android' },
            ].map(({ k, label }) => {
              const p = latestWithDownloads.appDownloads?.[k];
              const checked = p && (p.d30 != null || p.d90 != null || p.d180 != null);
              return (
                <div key={k} className={`border rounded p-2 ${checked ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-900 bg-zinc-950/40'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-zinc-400">{label}</span>
                    {checked
                      ? <span className="font-mono text-zinc-200">{fmtN(p.d30)} <span className="text-zinc-600">/30d</span></span>
                      : <span className="text-zinc-600 italic text-[9px]">not checked</span>}
                  </div>
                  {checked && (
                    <div className="text-[9px] text-zinc-500 mt-0.5">
                      90d: {fmtN(p.d90)} · 180d: {fmtN(p.d180)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sparkline — 30d trend over time */}
          <div className="text-[10px] text-zinc-500 mb-1">30-day download total — trend</div>
          {sparkData.length >= 2 ? (
            <div style={{ height: 40 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-[10px] text-zinc-600 italic h-10 flex items-center">Insufficient history — log another check next month</div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800">
            <div className="text-[10px] text-zinc-500">
              Latest: {latestWithDownloads.date} · {obs.filter(o => o.appDownloads).length} obs total
              {latestWithDownloads.sourceTool && <> · <span className="text-zinc-400">{latestWithDownloads.sourceTool}</span></>}
            </div>
            <div className="flex items-center gap-1.5">
              <ConfidenceBadge value={confidence} />
              <SourceTag value="P" />
              {stale && <StaleTag days={daysBetween(latestAny.date, todayISO())} threshold={src.staleDays} />}
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}

export function AppDownloadsLogModal({ open, onClose, onSave }) {
  const [date, setDate] = useState(todayISO());
  const [sourceTool, setSourceTool] = useState('Sensor Tower');
  const [ios, setIos]         = useState({ d30: '', d90: '', d180: '' });
  const [android, setAndroid] = useState({ d30: '', d90: '', d180: '' });
  const [notes, setNotes] = useState('');

  function reset() {
    setDate(todayISO());
    setSourceTool('Sensor Tower');
    setIos({ d30: '', d90: '', d180: '' });
    setAndroid({ d30: '', d90: '', d180: '' });
    setNotes('');
  }

  function num(s) {
    const cleaned = String(s).replace(/[, ]/g, '');
    if (cleaned === '') return null;
    const n = parseInt(cleaned, 10);
    return Number.isFinite(n) ? n : null;
  }
  function platformBlock(s) {
    const d30 = num(s.d30), d90 = num(s.d90), d180 = num(s.d180);
    if (d30 == null && d90 == null && d180 == null) return null;
    return { d30, d90, d180 };
  }

  function submit() {
    const appDownloads = {};
    const i = platformBlock(ios);     if (i) appDownloads.ios = i;
    const a = platformBlock(android); if (a) appDownloads.android = a;
    const platformsChecked = Object.keys(appDownloads).length;
    if (platformsChecked === 0) { alert('Enter at least one download number for one platform.'); return; }

    const total30 =
      (appDownloads.ios?.d30 || 0) + (appDownloads.android?.d30 || 0);

    const obs = {
      id: `obs_appdl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      date,
      kind: 'observation',
      frameworkCategory: 'growth',
      metricId: 'app_downloads',
      label: `App downloads — ${total30 ? total30.toLocaleString() : '?'} in last 30d (${platformsChecked}/2 platforms)`,
      value: String(total30),
      unit: 'downloads',
      rangeLow: '', rangeHigh: '',
      direction: 'flat',
      confidence: platformsChecked >= 2 ? 'high' : 'med',
      corrobBucket: 'app',
      sourceType: 'P',
      sourceTool,
      url: '',
      notes,
      appDownloads,
      createdAt: new Date().toISOString(),
      superseded: false,
    };
    onSave(obs);
    reset();
    onClose();
  }

  const fieldCls = "w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-cyan-600 outline-none font-mono";
  const labelCls = "text-[10px] uppercase tracking-wider text-zinc-500";

  function PlatformBlock({ name, color, state, setState }) {
    return (
      <div className="border border-zinc-800 rounded p-3 space-y-2">
        <div className={`font-mono text-xs ${color}`}>{name}</div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={labelCls}>30 days</label>
            <input className={fieldCls} placeholder="e.g. 12500" value={state.d30} onChange={e => setState(s => ({ ...s, d30: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>90 days</label>
            <input className={fieldCls} placeholder="e.g. 38000" value={state.d90} onChange={e => setState(s => ({ ...s, d90: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>180 days</label>
            <input className={fieldCls} placeholder="e.g. 71000" value={state.d180} onChange={e => setState(s => ({ ...s, d180: e.target.value }))} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Log App Download Counts" wide>
      <div className="space-y-3">
        <div className="bg-amber-950/30 border border-amber-900/50 rounded p-2.5 text-[11px] text-amber-200 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>None of the major sources (Sensor Tower, Data.ai, Appfigures) expose downloads via free APIs — this is manual entry. Pull rolling totals from whichever tool you have access to. Leave fields blank for windows or platforms you didn't check.</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Check date</label>
            <input type="date" className={fieldCls} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Source</label>
            <select className={fieldCls} value={sourceTool} onChange={e => setSourceTool(e.target.value)}>
              <option>Sensor Tower</option>
              <option>Data.ai</option>
              <option>Appfigures</option>
              <option>Similarweb App Intelligence</option>
              <option>Syndicate disclosure</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <PlatformBlock name="iOS"     color="text-sky-400"     state={ios}     setState={setIos} />
          <PlatformBlock name="Android" color="text-emerald-400" state={android} setState={setAndroid} />
        </div>

        <div>
          <label className={labelCls}>Notes (optional)</label>
          <textarea className={fieldCls + ' min-h-[60px]'} placeholder="Country / region scope, anomalies, store-specific changes." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
          <button onClick={() => { reset(); onClose(); }} className="px-3 py-1.5 text-xs border border-zinc-700 rounded text-zinc-300 hover:bg-zinc-800">Cancel</button>
          <button onClick={submit} className="px-3 py-1.5 text-xs bg-cyan-700 hover:bg-cyan-600 text-white rounded inline-flex items-center gap-1"><Save className="w-3 h-3" />Save observation</button>
        </div>
      </div>
    </Modal>
  );
}
