// AB Investment dashboard — App-level mode dispatch, per-company state,
// tab routing, modal mounts, focus overlay. Ports the monolith's App
// component (index_slim.html lines 17160–17742) into the migrated
// `src/` tree. Adds an explicit `home` landing on top of the original
// `tracker` / `research` modes — the home landing is unique to the
// migrated app and predates Stage 3.

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity, BookOpen, ChevronDown,
  Target, Layers, Gauge, DollarSign, MessageSquare, Settings as SettingsIcon,
} from 'lucide-react';

import Header from './components/Header.jsx';
import HomeLanding from './components/HomeLanding.jsx';
import ResearchLanding from './components/research/ResearchLanding.jsx';
import ResearchDetail from './components/research/ResearchDetail.jsx';

import { loadKey, saveKey } from './lib/storage.js';
import { useWorkerUrl } from './lib/workerUrl.js';
import { applyMemoReconciliation, deriveAlerts, relTime } from './lib/utils.js';
import { HIDDEN_TABS, PRESENTATION_MODE } from './lib/build-flags.js';
import { COMPANIES, getCompanyById, ACTIVE_COMPANY_KEY } from './data/companies.js';

import Modal from './components/tracker/shared/Modal.jsx';
import { FocusOverlay } from './components/tracker/shared/FocusOverlay.jsx';
import AlertBar from './components/tracker/shared/AlertBar.jsx';
import CompanyLogo from './components/tracker/position/CompanyLogo.jsx';

import ObservationForm from './components/tracker/forms/ObservationForm.jsx';
import SyndicateCommForm from './components/tracker/forms/SyndicateCommForm.jsx';

import PositionSummaryView from './components/tracker/PositionSummaryView.jsx';
import SignalTrackerView from './components/tracker/SignalTrackerView.jsx';
import MetricHeatmapView from './components/tracker/MetricHeatmapView.jsx';
import ScoringTrajectoryView from './components/tracker/ScoringTrajectoryView.jsx';
import PositionView from './components/tracker/PositionView.jsx';
import ObservationLogView from './components/tracker/ObservationLogView.jsx';
import SyndicateCommsView from './components/tracker/SyndicateCommsView.jsx';
import SettingsView from './components/tracker/SettingsView.jsx';

import {
  severityFromImportance,
  directionFromWhy,
  categoryForItem,
  deriveMetadataChips,
  BriefTileBody,
} from './components/tracker/news/BriefStack.jsx';

const MODE_KEY = 'app:mode';

// Tab registry — monolith lines 11558–11567. Icon refs come straight from
// lucide-react. Used by the tab nav bar and the dispatch switch below.
const TABS = [
  { id: 'summary', label: 'ZEELY.AI', icon: Target },
  { id: 'signals', label: 'Public', icon: Activity },
  { id: 'framework', label: 'VC', icon: Layers },
  { id: 'scoring', label: 'Scoring', icon: Gauge },
  { id: 'position', label: 'Position', icon: DollarSign },
  { id: 'log', label: 'Log', icon: BookOpen },
  { id: 'syndicate', label: 'Syndicate', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

function loadInitialMode() {
  try {
    const v = typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem(MODE_KEY)
      : null;
    if (v === 'tracker' || v === 'research' || v === 'home') return v;
  } catch {}
  return 'home';
}

export default function App() {
  const [mode, setMode] = useState(loadInitialMode);
  const [activeResearchId, setActiveResearchId] = useState(null);

  const updateMode = (next) => {
    setMode(next);
    setActiveResearchId(null);
    try { window.localStorage.setItem(MODE_KEY, next); } catch {}
  };

  // ─── Tracker app state ────────────────────────────────────────────
  const [publicDataAt, setPublicDataAt] = useState(null);
  const workerUrl = useWorkerUrl();

  const [companyId, setCompanyId] = useState(() => {
    try {
      const v = typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem(ACTIVE_COMPANY_KEY)
        : null;
      return v && COMPANIES.find(c => c.id === v) ? v : 'zeely';
    } catch { return 'zeely'; }
  });
  const company = useMemo(() => getCompanyById(companyId), [companyId]);
  const prefix = company.storagePrefix;
  const k = useCallback((suffix) => `${prefix}:${suffix}`, [prefix]);

  const [tab, setTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [cfg, setCfg] = useState(() => company.config());
  const [observations, setObservations] = useState([]);
  const [syndicateLog, setSyndicateLog] = useState([]);
  const [scores, setScores] = useState({ dimensions: {}, aiOverlay: {}, history: [], weights: null });
  const [capEvents, setCapEvents] = useState([]);
  const [triangulationTasks, setTriangulationTasks] = useState([]);
  const [memoBaseline, setMemoBaseline] = useState(null);
  const [memoCardOpen, setMemoCardOpen] = useState(true);

  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [obsModalInitial, setObsModalInitial] = useState(null);
  const [synModalOpen, setSynModalOpen] = useState(false);

  // Public-data freshness — same fetch loop as monolith line 17218.
  useEffect(() => {
    let cancelled = false;
    setPublicDataAt(null);
    (async () => {
      const base = workerUrl.replace(/\/$/, '');
      for (const endpoint of ['brief', 'weekly']) {
        try {
          const resp = await fetch(`${base}/${endpoint}?company=${encodeURIComponent(companyId)}`, { mode: 'cors' });
          if (!resp.ok) continue;
          const data = await resp.json();
          const at = data?.brief?.generatedAt || data?.weekly?.generatedAt || data?.generatedAt;
          if (at && !cancelled) {
            setPublicDataAt(at);
            return;
          }
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [companyId, workerUrl]);

  const switchCompany = useCallback((nextId) => {
    if (nextId === companyId) return;
    if (!COMPANIES.find(c => c.id === nextId)) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(ACTIVE_COMPANY_KEY, nextId);
      }
    } catch {}
    setLoading(true);
    setCompanyId(nextId);
    setTab('summary');
  }, [companyId]);

  // Initial load + per-company seeding & memo back-fill. Monolith line 17258.
  useEffect(() => {
    (async () => {
      setLoading(true);
      const SEEDED_OBS_FOR_COMPANY  = company.seededObservations();
      const MEMO_OBS_FOR_COMPANY    = company.memoObservations();
      const SYNLOG_FOR_COMPANY      = company.seededSyndicateLog();
      const TRIANG_FOR_COMPANY      = company.triangulationTasksSeed();
      const MEMO_BASELINE_FOR_CO    = company.memoBaseline();
      const DERIVED_FOR_COMPANY     = company.derivedMetrics();
      const CFG_FOR_COMPANY         = company.config();

      const [c, o, s, sl, ce, tt, mb, mco] = await Promise.all([
        loadKey(k('config'), null),
        loadKey(k('observations'), null),
        loadKey(k('scores'), { dimensions: {}, aiOverlay: {}, history: [], weights: null }),
        loadKey(k('syndicate-log'), null),
        loadKey(k('cap-events'), []),
        loadKey(k('triangulation-tasks'), null),
        loadKey(company.memoBaselineKey, null),
        loadKey(k('ui:memo-card-open'), true),
      ]);
      if (c) setCfg(c);
      else { setCfg(CFG_FOR_COMPANY); await saveKey(k('config'), CFG_FOR_COMPANY); }

      if (o === null || o === undefined) {
        const initial = applyMemoReconciliation([...SEEDED_OBS_FOR_COMPANY, ...MEMO_OBS_FOR_COMPANY]);
        setObservations(initial);
        await saveKey(k('observations'), initial);
      } else {
        let next = Array.isArray(o) ? o : [];
        const hasMemo = next.some(x => x && x.memo === true);
        if (!hasMemo && MEMO_OBS_FOR_COMPANY.length > 0) {
          next = applyMemoReconciliation([...next, ...MEMO_OBS_FOR_COMPANY]);
          await saveKey(k('observations'), next);
        } else {
          const before = JSON.stringify(next.map(o => o.superseded));
          next = applyMemoReconciliation(next);
          const after = JSON.stringify(next.map(o => o.superseded));
          if (before !== after) await saveKey(k('observations'), next);
        }
        setObservations(next);
      }

      setScores(s || { dimensions: {}, aiOverlay: {}, history: [], weights: null });

      if (sl === null || sl === undefined) {
        setSyndicateLog(SYNLOG_FOR_COMPANY);
        await saveKey(k('syndicate-log'), SYNLOG_FOR_COMPANY);
      } else {
        let next = Array.isArray(sl) ? sl : [];
        const memoEntryId = SYNLOG_FOR_COMPANY[0]?.id;
        const hasMemoEntry = memoEntryId ? next.some(x => x && x.id === memoEntryId) : true;
        if (!hasMemoEntry) {
          const memoEntry = SYNLOG_FOR_COMPANY.find(x => x.id === memoEntryId);
          if (memoEntry) {
            next = [...next, memoEntry];
            await saveKey(k('syndicate-log'), next);
          }
        }
        setSyndicateLog(next);
      }

      setCapEvents(Array.isArray(ce) ? ce : []);

      if (tt === null || tt === undefined) {
        setTriangulationTasks(TRIANG_FOR_COMPANY);
        await saveKey(k('triangulation-tasks'), TRIANG_FOR_COMPANY);
      } else {
        setTriangulationTasks(Array.isArray(tt) ? tt : []);
      }

      if (mb === null || mb === undefined) {
        setMemoBaseline(MEMO_BASELINE_FOR_CO);
        await saveKey(company.memoBaselineKey, MEMO_BASELINE_FOR_CO);
        await saveKey(k('derived-metrics'), DERIVED_FOR_COMPANY);
      } else {
        setMemoBaseline(mb);
      }

      setMemoCardOpen(typeof mco === 'boolean' ? mco : true);

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const saveCfg = useCallback(async (newCfg) => {
    setCfg(newCfg);
    await saveKey(k('config'), newCfg);
  }, [k]);

  const toggleTriangulationTask = useCallback(async (id) => {
    const next = triangulationTasks.map(t =>
      t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t
    );
    setTriangulationTasks(next);
    await saveKey(k('triangulation-tasks'), next);
  }, [triangulationTasks, k]);

  const toggleMemoCard = useCallback(async () => {
    const next = !memoCardOpen;
    setMemoCardOpen(next);
    await saveKey(k('ui:memo-card-open'), next);
  }, [memoCardOpen, k]);

  const addObservation = useCallback(async (obs) => {
    const next = [...observations, obs];
    setObservations(next);
    await saveKey(k('observations'), next);
    setObsModalOpen(false);
  }, [observations, k]);

  const bulkAddObservations = useCallback(async (newObs) => {
    const next = [...observations, ...newObs];
    setObservations(next);
    await saveKey(k('observations'), next);
  }, [observations, k]);

  const supersedeObs = useCallback(async (id) => {
    const next = observations.map(o => o.id === id ? { ...o, superseded: true, supersededAt: new Date().toISOString() } : o);
    setObservations(next);
    await saveKey(k('observations'), next);
  }, [observations, k]);

  const addSyndicateComm = useCallback(async (comm) => {
    const next = [...syndicateLog, comm];
    setSyndicateLog(next);
    await saveKey(k('syndicate-log'), next);
    setSynModalOpen(false);
  }, [syndicateLog, k]);

  const saveScores = useCallback(async (newScores) => {
    setScores(newScores);
    await saveKey(k('scores'), newScores);
  }, [k]);

  const addCapEvent = useCallback(async (ev) => {
    const next = [...capEvents, ev];
    setCapEvents(next);
    await saveKey(k('cap-events'), next);
  }, [capEvents, k]);

  const resetAll = useCallback(async () => {
    const fresh = company.config();
    setCfg(fresh); await saveKey(k('config'), fresh);
    setObservations([]); await saveKey(k('observations'), []);
    setSyndicateLog([]); await saveKey(k('syndicate-log'), []);
    setScores({ dimensions: {}, aiOverlay: {}, history: [], weights: null });
    await saveKey(k('scores'), { dimensions: {}, aiOverlay: {}, history: [], weights: null });
    setCapEvents([]); await saveKey(k('cap-events'), []);
  }, [company, k]);

  const importData = useCallback(async (payload) => {
    if (payload.cfg) { setCfg(payload.cfg); await saveKey(k('config'), payload.cfg); }
    if (payload.observations) { setObservations(payload.observations); await saveKey(k('observations'), payload.observations); }
    if (payload.scores) { setScores(payload.scores); await saveKey(k('scores'), payload.scores); }
    if (payload.syndicateLog) { setSyndicateLog(payload.syndicateLog); await saveKey(k('syndicate-log'), payload.syndicateLog); }
    if (payload.capEvents) { setCapEvents(payload.capEvents); await saveKey(k('cap-events'), payload.capEvents); }
  }, [k]);

  const alerts = useMemo(() => deriveAlerts(observations, syndicateLog, cfg), [observations, syndicateLog, cfg]);

  // App-level focus overlay — must be declared before any early return to
  // satisfy Rules of Hooks. Monolith line 17440.
  const [appFocusedItem, setAppFocusedItem] = useState(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const openHandler = (e) => setAppFocusedItem(e.detail);
    const closeHandler = () => setAppFocusedItem(null);
    window.addEventListener('brief-focus-open', openHandler);
    window.addEventListener('brief-focus-close', closeHandler);
    return () => {
      window.removeEventListener('brief-focus-open', openHandler);
      window.removeEventListener('brief-focus-close', closeHandler);
    };
  }, []);

  function openObservationForm(initial) {
    setObsModalInitial(initial || null);
    setObsModalOpen(true);
  }

  function jumpToAlert(kind) {
    let target = null;
    if (kind === 'stale' || kind === 'inconsistency') target = 'log';
    else if (kind === 'coverage') target = 'signals';
    else if (kind === 'silence') target = 'syndicate';
    if (target && !HIDDEN_TABS.has(target)) setTab(target);
    else if (target) setTab('summary');
  }

  // ─── Home / Research modes ───────────────────────────────────────
  if (mode === 'home') {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', color: '#e4e4e7' }}>
        <Header mode={mode} onChangeMode={updateMode} />
        <HomeLanding onChoose={updateMode} />
      </div>
    );
  }

  if (mode === 'research') {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b', color: '#e4e4e7' }}>
        <Header mode={mode} onChangeMode={updateMode} />
        {activeResearchId
          ? <ResearchDetail researchId={activeResearchId} onBack={() => setActiveResearchId(null)} />
          : <ResearchLanding onOpen={(id) => setActiveResearchId(id)} />}
      </div>
    );
  }

  // ─── Tracker mode ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090b' }}>
        <Header mode={mode} onChangeMode={updateMode} />
        <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center font-mono text-sm">
          <Activity className="w-4 h-4 animate-pulse mr-2" />Loading {company.name} monitoring dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <Header mode={mode} onChangeMode={updateMode} />

      {/* App-level focus modal — listens for window event from any Open button */}
      {appFocusedItem && (() => {
        const sev = severityFromImportance(appFocusedItem.importance);
        const dir = directionFromWhy(appFocusedItem.whyItMatters || appFocusedItem.summary);
        const cat = categoryForItem(appFocusedItem);
        const ch  = deriveMetadataChips(appFocusedItem);
        const dRel = appFocusedItem.date ? relTime(new Date(appFocusedItem.date).getTime()) : null;
        return (
          <FocusOverlay
            open={true}
            onClose={() => setAppFocusedItem(null)}
            title={`Brief Item · ${sev.tier} Signal`}>
            <BriefTileBody
              item={appFocusedItem}
              severity={sev}
              direction={dir}
              category={cat}
              chips={ch}
              dateRel={dRel}
              dateTitle={appFocusedItem.date || ''}
              focused
              hideRemove
            />
          </FocusOverlay>
        );
      })()}

      {/* Tracker sub-header — company switcher (left) + obs/comms/version
          counters (right). Matches the monolith's non-bento layout (line
          17552 + 17660). The bento branch and its centered DATA chip are
          intentionally not rendered — the monolith ships with
          window.__BENTO__ = true and ends up in the centered-chip layout,
          but the migrated app preserves the analyst-facing non-bento
          arrangement that the user expects. */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CompanyLogo brand={company.name} size={20} />
            <div className="relative">
              <select
                value={companyId}
                onChange={(e) => switchCompany(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-sm font-mono uppercase tracking-wider text-zinc-200 hover:border-zinc-600 focus:outline-none focus:border-cyan-600 cursor-pointer pr-7 appearance-none"
                title="Switch company"
              >
                {COMPANIES.map(c => (
                  <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span className="text-[10px] text-zinc-500">·  {cfg.is_position === false ? 'Research Tracker' : 'Single-Position VC Monitor'}</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
            <span title="Observations — data points logged from research and signals">{observations.filter(o => !o.superseded).length} obs</span>
            <span>·</span>
            <span title="Communications — syndicate touchpoints logged">{syndicateLog.length} comms</span>
            <span>·</span>
            <span title="Dashboard version">v1.1</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-zinc-800 overflow-x-auto">
          {TABS.filter(t => !HIDDEN_TABS.has(t.id)).map(t => {
            const Icon = t.icon;
            const label = t.id === 'summary' ? company.name.toUpperCase() : t.label;
            const isActive = tab === t.id;
            const activeBorder = company.accent === 'amber' ? 'border-amber-400' : 'border-cyan-400';
            const activeBg     = company.accent === 'amber' ? 'bg-amber-950/30'   : 'bg-cyan-950/30';
            const activeText   = company.accent === 'amber' ? 'text-amber-200'    : 'text-cyan-200';
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1.5 border-b-[3px] whitespace-nowrap transition-colors ${
                  isActive
                    ? `${activeBorder} ${activeBg} ${activeText} font-bold`
                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950/40'
                }`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            );
          })}
        </div>

        {!PRESENTATION_MODE && <AlertBar alerts={alerts} onJumpTo={jumpToAlert} />}
      </div>

      {/* Tab body */}
      <div className="p-3 max-w-7xl mx-auto">
        {tab === 'summary' && (
          <PositionSummaryView
            cfg={cfg} observations={observations} syndicateLog={syndicateLog} scores={scores} capEvents={capEvents}
            memoBaseline={memoBaseline} memoCardOpen={memoCardOpen} onToggleMemoCard={toggleMemoCard}
            triangulationTasks={triangulationTasks} onToggleTriangulation={toggleTriangulationTask}
            onJumpTo={(t) => setTab(t)} company={company} />
        )}
        {tab === 'signals' && (
          <SignalTrackerView cfg={cfg} observations={observations} onAddObservation={openObservationForm} onSaveObservation={addObservation} companyId={companyId} />
        )}
        {tab === 'framework' && (
          <MetricHeatmapView cfg={cfg} observations={observations} onAddObservation={openObservationForm} />
        )}
        {tab === 'scoring' && (
          <ScoringTrajectoryView cfg={cfg} observations={observations} scores={scores} onSaveScores={saveScores} />
        )}
        {tab === 'position' && (
          <PositionView cfg={cfg} company={company} memoBaseline={memoBaseline} />
        )}
        {tab === 'log' && !HIDDEN_TABS.has('log') && (
          <ObservationLogView observations={observations} onAdd={() => openObservationForm()} onSupersede={supersedeObs} onBulkAdd={bulkAddObservations} />
        )}
        {tab === 'syndicate' && !HIDDEN_TABS.has('syndicate') && (
          <SyndicateCommsView cfg={cfg} syndicateLog={syndicateLog} onAdd={() => setSynModalOpen(true)} memoBaseline={memoBaseline} />
        )}
        {tab === 'settings' && !HIDDEN_TABS.has('settings') && (
          <SettingsView cfg={cfg} onSaveConfig={saveCfg} observations={observations} syndicateLog={syndicateLog} scores={scores} capEvents={capEvents} onResetAll={resetAll} onImport={importData} onAddCapEvent={addCapEvent} />
        )}
      </div>

      <Modal open={obsModalOpen} onClose={() => setObsModalOpen(false)} title="Add Observation" wide>
        <ObservationForm initial={obsModalInitial} onSave={addObservation} onCancel={() => setObsModalOpen(false)} />
      </Modal>

      <Modal open={synModalOpen} onClose={() => setSynModalOpen(false)} title="Log Syndicate Communication" wide>
        <SyndicateCommForm onSave={addSyndicateComm} onCancel={() => setSynModalOpen(false)} />
      </Modal>
    </div>
  );
}
