import { useState } from 'react';
import { MessageSquare, Plus, Clock, FileText, ChevronDown, ChevronRight, Activity } from 'lucide-react';
import Panel from './shared/Panel.jsx';
import { daysBetween, todayISO } from '../../lib/utils.js';
import optionsJson from '../../data/options.json';

const { MATERIALITY_OPTIONS } = optionsJson;

export default function SyndicateCommsView({ cfg, syndicateLog, onAdd, memoBaseline }) {
  const sorted = [...syndicateLog].sort((a, b) => new Date(b.date) - new Date(a.date));
  const last = sorted[0];
  const days = last ? daysBetween(last.date, todayISO()) : daysBetween(cfg.entry_date, todayISO());
  const silenceWarning = days > 90;
  const sourceDocs = sorted.filter(c => c.isSourceDocument);
  const [expandedDoc, setExpandedDoc] = useState(null);

  return (
    <div className="space-y-3">
      <Panel title="Syndicate Communications" icon={MessageSquare}
        subtitle={`Channel of record between you and ${cfg.syndicate_lead}. Materially-flagged comms drive observation creation.`}
        right={<button onClick={onAdd} className="text-[10px] inline-flex items-center gap-1 px-2 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded"><Plus className="w-3 h-3" />Log</button>}>
        <div className={`p-3 rounded border ${silenceWarning ? 'border-amber-700 bg-amber-950/30' : 'border-zinc-800 bg-zinc-950/40'}`}>
          <div className="flex items-center gap-2">
            <Clock className={silenceWarning ? 'text-amber-400 w-4 h-4' : 'text-zinc-500 w-4 h-4'} />
            <span className="text-sm text-zinc-200 font-mono">{days} days {last ? 'since last syndicate update' : 'since entry · no comms logged'}</span>
            {silenceWarning && <span className="text-[10px] uppercase tracking-wider text-amber-400 font-mono">silence threshold (90d) exceeded</span>}
          </div>
          {last && <div className="text-[11px] text-zinc-400 mt-1">Last: <span className="text-zinc-200">{last.source}</span> via {last.channel} · {last.materiality}</div>}
        </div>
      </Panel>

      {sourceDocs.length > 0 && (
        <Panel title={`Source Documents (${sourceDocs.length})`} icon={FileText}
          subtitle="Underwriting and disclosure documents received from syndicate lead. Click 'View extracted facts' to inspect the structured payload behind a doc.">
          <div className="space-y-2">
            {sourceDocs.map(d => (
              <div key={d.id} className="border border-zinc-800 rounded">
                <div className="flex items-start gap-3 p-3">
                  <FileText className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-zinc-200">{d.source}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">received {d.date}</span>
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-900/40 text-amber-300 border border-amber-700 rounded-sm font-mono">PDF</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1">{d.summary}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setExpandedDoc(expandedDoc === d.id ? null : d.id)}
                        className="text-[10px] inline-flex items-center gap-1 px-2 py-1 border border-zinc-700 rounded text-zinc-300 hover:bg-zinc-800"
                      >
                        {expandedDoc === d.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        View extracted facts
                      </button>
                      {d.documentRef && (
                        <span className="text-[9px] text-zinc-600 font-mono">storage: {d.documentRef}</span>
                      )}
                    </div>
                    {expandedDoc === d.id && memoBaseline && d.documentRef === 'zeely:memo-baseline:apr2026' && (
                      <pre className="mt-3 p-2 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-400 overflow-x-auto max-h-96 font-mono">{JSON.stringify(memoBaseline, null, 2)}</pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Communication Timeline" icon={Activity} dense>
        {sorted.length === 0 ? (
          <div className="text-[11px] text-zinc-600 italic py-6 text-center">No syndicate communications logged. Click "Log communication" above when you receive an update from {cfg.syndicate_lead}.</div>
        ) : (
          <div className="space-y-1.5">
            {sorted.map(c => {
              const matOpt = MATERIALITY_OPTIONS.find(m => m.value === c.materiality);
              return (
                <div key={c.id} className="border border-zinc-800 rounded">
                  <div className="flex items-start gap-3 p-3">
                    <div className="text-[10px] font-mono text-zinc-500 w-20 shrink-0">{c.date}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-zinc-200">{c.source}</span>
                        <span className="text-[10px] text-zinc-500">via {c.channel}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border rounded-sm ${matOpt?.color}`}>{matOpt?.label}</span>
                        {c.followUp && <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border rounded-sm bg-cyan-900 text-cyan-300 border-cyan-700">Follow-up</span>}
                      </div>
                      <div className="text-xs text-zinc-300 mt-1 whitespace-pre-wrap">{c.summary}</div>
                      {c.followUpNote && <div className="text-[11px] text-cyan-400 mt-1">→ {c.followUpNote}</div>}
                      {c.relatedObsIds?.length > 0 && <div className="text-[10px] text-zinc-500 mt-1">{c.relatedObsIds.length} linked observation(s)</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
