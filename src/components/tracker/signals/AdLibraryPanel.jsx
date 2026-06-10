import React, { useState, useMemo } from 'react';
import { AlertCircle, Plus, ExternalLink, Info, Save } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import Panel from '../shared/Panel.jsx';
import Modal from '../shared/Modal.jsx';
import { ConfidenceBadge, SourceTag, StaleTag } from '../shared/badges.jsx';
import { daysBetween, todayISO } from '../../../lib/utils.js';
import { PRESENTATION_MODE } from '../../../lib/build-flags.js';

export const AD_LIBRARY_DEEPLINKS = {
  meta:   { name: 'Meta Ad Library',                url: 'https://www.facebook.com/ads/library/?country=ALL&q=Zeely&search_type=keyword_unordered' },
  tiktok: { name: 'TikTok Creative Center',         url: 'https://ads.tiktok.com/business/creativecenter/topads/pc/en?period=7&region=US' },
  google: { name: 'Google Ads Transparency Center', url: 'https://adstransparency.google.com/?domain=zeely.ai&region=anywhere' },
};

export default function AdLibraryPanel({ src, observations, onLog }) {
  const obs = useMemo(
    () => observations.filter(o => !o.superseded && o.corrobBucket === 'ad_library')
                       .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [observations]
  );
  const latest = obs[obs.length - 1];

  // Total active = sum across the three platforms.
  function totalActive(o) {
    if (!o) return null;
    if (o.adFootprint) {
      const f = o.adFootprint;
      return (f.meta?.active || 0) + (f.tiktok?.active || 0) + (f.google?.active || 0);
    }
    return parseFloat(o.value) || 0;
  }
  function totalNewWeek(o) {
    if (!o || !o.adFootprint) return null;
    const f = o.adFootprint;
    return (f.meta?.newThisWeek || 0) + (f.tiktok?.newThisWeek || 0) + (f.google?.newThisWeek || 0);
  }
  function distinctSourcesIn(o) {
    if (!o || !o.adFootprint) return 0;
    const f = o.adFootprint;
    return ['meta', 'tiktok', 'google'].filter(k => f[k] && f[k].active != null).length;
  }
  function geoSet(o) {
    if (!o || !o.adFootprint) return new Set();
    const f = o.adFootprint;
    const all = [...(f.meta?.geos || []), ...(f.tiktok?.geos || []), ...(f.google?.geos || [])];
    return new Set(all.map(g => g && g.toUpperCase().trim()).filter(Boolean));
  }

  const latestActive = totalActive(latest);
  const latestNewWeek = totalNewWeek(latest);
  const latestSources = distinctSourcesIn(latest);
  const latestGeos = useMemo(() => geoSet(latest), [latest]);

  // WoW delta: compare latest to observation closest to 7d before it.
  const wowDelta = useMemo(() => {
    if (!latest || obs.length < 2) return null;
    const target = new Date(latest.date); target.setDate(target.getDate() - 7);
    let best = null, bestDelta = Infinity;
    for (const o of obs) {
      if (o.id === latest.id) continue;
      const d = Math.abs(new Date(o.date) - target);
      if (d < bestDelta) { bestDelta = d; best = o; }
    }
    if (!best) return null;
    const prev = totalActive(best);
    if (prev == null || prev === 0) return null;
    const cur = totalActive(latest);
    return { pct: ((cur - prev) / prev) * 100, prevDate: best.date, prevActive: prev };
  }, [obs, latest]);

  // Sparkline: last 90 days of observations.
  const sparkData = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
    return obs.filter(o => new Date(o.date) >= cutoff)
              .map(o => ({ value: totalActive(o) || 0, date: o.date }));
  }, [obs]);

  // Confidence: ≥2 distinct platforms checked = MED, 3 = HIGH, ≤1 = LOW.
  const confidence = latestSources >= 3 ? 'high' : latestSources >= 2 ? 'med' : 'low';
  const stale = latest ? daysBetween(latest.date, todayISO()) > src.staleDays : false;
  const meetsMin = !src.requireMin || latestSources >= src.requireMin;

  // Color for WoW delta: >+10 emerald, ±10 amber, <-10 rose.
  const wowColor = (() => {
    if (wowDelta == null) return 'text-zinc-500';
    if (wowDelta.pct > 10) return 'text-emerald-400';
    if (wowDelta.pct < -10) return 'text-rose-400';
    return 'text-amber-400';
  })();

  // Top geos — show top 3 by frequency across the three platforms in the latest obs.
  const topGeos = useMemo(() => {
    if (!latest?.adFootprint) return [];
    const counts = {};
    for (const k of ['meta', 'tiktok', 'google']) {
      const arr = latest.adFootprint[k]?.geos || [];
      for (const g of arr) {
        const c = (g || '').toUpperCase().trim();
        if (c) counts[c] = (counts[c] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
  }, [latest]);

  const Icon = src.icon;
  return (
    <Panel title={src.label} icon={Icon}
      subtitle={src.tools.join(' · ')}
      right={
        <div className="flex items-center gap-1.5">
          {!PRESENTATION_MODE && !meetsMin && obs.length > 0 && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-800 rounded font-mono inline-flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />Need ≥2
            </span>
          )}
          <button onClick={onLog} className="text-[10px] inline-flex items-center gap-1 px-2 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded">
            <Plus className="w-3 h-3" />Log check
          </button>
        </div>
      }>

      <div className="text-[11px] text-zinc-500 italic mb-3">{src.why}</div>

      {/* Quick deep-link row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(AD_LIBRARY_DEEPLINKS).map(([k, link]) => (
          <a key={k} href={link.url} target="_blank" rel="noreferrer"
             className="text-[10px] inline-flex items-center gap-1 px-2 py-1 border border-zinc-800 rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 font-mono">
            <ExternalLink className="w-2.5 h-2.5" />{link.name}
          </a>
        ))}
      </div>

      {!latest ? (
        <div className="border border-dashed border-zinc-800 rounded p-4 text-center">
          <div className="text-xs text-zinc-500 mb-2">No ad-library checks logged yet.</div>
          <div className="text-[10px] text-zinc-600 leading-relaxed mb-3">
            Open each library above (links open in new tabs), count active ads, then click <span className="text-zinc-300">Log</span>. The card needs ≥2 of 3 platforms checked before showing a confirmed trend.
          </div>
          <button onClick={onLog} className="text-[11px] inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded">
            <Plus className="w-3 h-3" />Log first observation
          </button>
        </div>
      ) : (
        <>
          {/* Headline KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="bg-zinc-950 border border-zinc-800 rounded p-2">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Active ads</div>
              <div className="font-mono text-xl text-zinc-100 mt-0.5">{latestActive ?? '—'}</div>
              <div className="text-[10px] text-zinc-500">{latestSources}/3 platforms</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-2">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">New this week</div>
              <div className="font-mono text-xl text-zinc-100 mt-0.5">{latestNewWeek != null ? `+${latestNewWeek}` : '—'}</div>
              <div className="text-[10px] text-zinc-500">launches in last 7d</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-2">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">WoW delta</div>
              <div className={`font-mono text-xl mt-0.5 ${wowColor}`}>
                {wowDelta == null ? '—' : `${wowDelta.pct >= 0 ? '+' : ''}${wowDelta.pct.toFixed(1)}%`}
              </div>
              <div className="text-[10px] text-zinc-500">
                {wowDelta == null ? 'need 2 obs ≥7d apart' : `vs ${wowDelta.prevActive} on ${wowDelta.prevDate}`}
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-2">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500">Geo footprint</div>
              <div className="font-mono text-xl text-zinc-100 mt-0.5">{latestGeos.size}</div>
              <div className="text-[10px] text-zinc-500 truncate" title={[...latestGeos].sort().join(', ')}>
                {topGeos.length ? topGeos.join(' · ') : '—'}
              </div>
            </div>
          </div>

          {/* Per-platform breakdown row */}
          <div className="grid grid-cols-3 gap-2 mb-3 text-[10px]">
            {['meta', 'tiktok', 'google'].map(k => {
              const f = latest.adFootprint?.[k];
              const checked = f && f.active != null;
              const linkName = AD_LIBRARY_DEEPLINKS[k].name.split(' ')[0]; // "Meta", "TikTok", "Google"
              return (
                <div key={k} className={`border rounded p-2 ${checked ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-900 bg-zinc-950/40'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-zinc-400">{linkName}</span>
                    {checked
                      ? <span className="font-mono text-zinc-200">{f.active}</span>
                      : <span className="text-zinc-600 italic text-[9px]">not checked</span>}
                  </div>
                  {checked && (
                    <div className="text-[9px] text-zinc-500 mt-0.5">
                      +{f.newThisWeek || 0} new · {(f.geos || []).length} geos
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sparkline */}
          <div className="text-[10px] text-zinc-500 mb-1">Active ads — last 90 days</div>
          {sparkData.length >= 2 ? (
            <div style={{ height: 40 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-[10px] text-zinc-600 italic h-10 flex items-center">Insufficient history — log another check next week</div>
          )}

          {/* Footer: confidence + stale */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800">
            <div className="text-[10px] text-zinc-500">
              Latest: {latest.date} · {obs.length} obs total
            </div>
            <div className="flex items-center gap-1.5">
              <ConfidenceBadge value={confidence} />
              <SourceTag value="P" />
              {stale && <StaleTag days={daysBetween(latest.date, todayISO())} threshold={src.staleDays} />}
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}

export function AdLibraryLogModal({ open, onClose, onSave }) {
  const [date, setDate] = useState(todayISO());
  const [meta, setMeta]     = useState({ active: '', newThisWeek: '', geos: '' });
  const [tiktok, setTiktok] = useState({ active: '', newThisWeek: '', geos: '' });
  const [google, setGoogle] = useState({ active: '', newThisWeek: '', geos: '' });
  const [notes, setNotes] = useState('');

  function reset() {
    setDate(todayISO());
    setMeta({ active: '', newThisWeek: '', geos: '' });
    setTiktok({ active: '', newThisWeek: '', geos: '' });
    setGoogle({ active: '', newThisWeek: '', geos: '' });
    setNotes('');
  }

  function parseGeos(s) {
    return s.split(',').map(x => x.trim().toUpperCase()).filter(Boolean);
  }
  function num(s) { const n = parseInt(s, 10); return Number.isFinite(n) ? n : null; }
  function platformBlock(s) {
    const active = num(s.active);
    if (active == null) return null; // unchecked platform
    return { active, newThisWeek: num(s.newThisWeek) || 0, geos: parseGeos(s.geos) };
  }

  function submit() {
    const adFootprint = {};
    const m = platformBlock(meta);    if (m) adFootprint.meta = m;
    const tk = platformBlock(tiktok); if (tk) adFootprint.tiktok = tk;
    const g = platformBlock(google);  if (g) adFootprint.google = g;
    const platformsChecked = Object.keys(adFootprint).length;
    if (platformsChecked === 0) { alert('Enter at least one platform active count.'); return; }

    const totalActive =
      (adFootprint.meta?.active   || 0) +
      (adFootprint.tiktok?.active || 0) +
      (adFootprint.google?.active || 0);

    // Compose source tool description from checked platforms.
    const sourceTool = ['meta', 'tiktok', 'google']
      .filter(k => adFootprint[k])
      .map(k => AD_LIBRARY_DEEPLINKS[k].name)
      .join(' + ');

    const obs = {
      id: `obs_adlib_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      date,
      kind: 'observation',
      frameworkCategory: 'acquisition',
      metricId: 'paid_ad_footprint',
      label: `Ad library check — ${totalActive} active across ${platformsChecked}/3 platforms`,
      value: String(totalActive),
      unit: 'ads',
      rangeLow: '', rangeHigh: '',
      direction: 'flat',
      confidence: platformsChecked >= 3 ? 'high' : platformsChecked >= 2 ? 'med' : 'low',
      corrobBucket: 'ad_library',
      sourceType: 'P',
      sourceTool,
      url: '',
      notes,
      adFootprint,
      createdAt: new Date().toISOString(),
      superseded: false,
    };
    onSave(obs);
    reset();
    onClose();
  }

  const fieldCls = "w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:border-cyan-600 outline-none font-mono";
  const labelCls = "text-[10px] uppercase tracking-wider text-zinc-500";

  function PlatformBlock({ name, color, link, state, setState }) {
    return (
      <div className="border border-zinc-800 rounded p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className={`font-mono text-xs ${color}`}>{name}</span>
          <a href={link} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-500 hover:text-cyan-400 inline-flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" />Open
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Active count</label>
            <input className={fieldCls} placeholder="leave blank if not checked" value={state.active} onChange={e => setState(s => ({ ...s, active: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>New this week</label>
            <input className={fieldCls} placeholder="optional" value={state.newThisWeek} onChange={e => setState(s => ({ ...s, newThisWeek: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Countries (comma-separated, e.g. US, CA, UK)</label>
          <input className={fieldCls} placeholder="optional" value={state.geos} onChange={e => setState(s => ({ ...s, geos: e.target.value }))} />
        </div>
      </div>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Log Ad-Library Check" wide>
      <div className="space-y-3">
        <div className="bg-amber-950/30 border border-amber-900/50 rounded p-2.5 text-[11px] text-amber-200 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>Open each platform via the links below, count currently-active ads for the company's Page, then enter the totals here. Leave a platform blank if you didn't check it. ≥2 of 3 platforms gives MED confidence; all 3 gives HIGH.</div>
        </div>

        <div>
          <label className={labelCls}>Check date</label>
          <input type="date" className={fieldCls} value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <PlatformBlock name="Meta"   color="text-sky-400"    link={AD_LIBRARY_DEEPLINKS.meta.url}   state={meta}   setState={setMeta} />
          <PlatformBlock name="TikTok" color="text-pink-400"   link={AD_LIBRARY_DEEPLINKS.tiktok.url} state={tiktok} setState={setTiktok} />
          <PlatformBlock name="Google" color="text-emerald-400" link={AD_LIBRARY_DEEPLINKS.google.url} state={google} setState={setGoogle} />
        </div>

        <div>
          <label className={labelCls}>Notes (optional)</label>
          <textarea className={fieldCls + ' min-h-[60px]'} placeholder="Anything notable — campaign types, creative shifts, geo expansion, etc." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
          <button onClick={() => { reset(); onClose(); }} className="px-3 py-1.5 text-xs border border-zinc-700 rounded text-zinc-300 hover:bg-zinc-800">Cancel</button>
          <button onClick={submit} className="px-3 py-1.5 text-xs bg-cyan-700 hover:bg-cyan-600 text-white rounded inline-flex items-center gap-1"><Save className="w-3 h-3" />Save observation</button>
        </div>
      </div>
    </Modal>
  );
}
