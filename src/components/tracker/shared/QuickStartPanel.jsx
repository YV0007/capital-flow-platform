// Quick-start checklist for establishing the triangulation baseline.
// Translated from monolith lines 11509–11535.

import { Zap, Plus } from 'lucide-react';

import { CORROB_SOURCES } from '../../../data/corrob-sources.js';

export default function QuickStartPanel({ onAdd }) {
  return (
    <div className="bg-gradient-to-r from-cyan-950/40 to-zinc-900 border border-cyan-900 rounded p-4 mb-3">
      <div className="flex items-start gap-3">
        <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-300">Quick Start — Establish Baseline</div>
          <div className="text-[11px] text-zinc-400 mt-1">Log one observation per corroboration source to populate the triangulation engine. Each can take 2–5 minutes per source.</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mt-3">
            {CORROB_SOURCES.map((s, i) => {
              const Icon = s.icon;
              return (
                <button key={s.id} onClick={() => onAdd({ corrobBucket: s.id })} className="flex items-center gap-2 px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[11px] text-zinc-300 text-left">
                  <span className="font-mono text-cyan-500 w-4">{i + 1}.</span>
                  <Icon className="w-3 h-3 text-zinc-500" />
                  <span className="flex-1">{s.label}</span>
                  <span className="text-[10px] text-zinc-500 truncate">{s.tools[0]}</span>
                  <Plus className="w-3 h-3 text-zinc-500" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
