import React from 'react';
import { Target } from 'lucide-react';
import Panel from '../shared/Panel.jsx';

export default function TriangulationTasksPanel({ tasks, onToggle, onJumpTo }) {
  if (!tasks || tasks.length === 0) return null;
  const open = tasks.filter(t => !t.completed).length;
  return (
    <Panel
      title={`Triangulation Tasks (${open} open)`}
      icon={Target}
      subtitle="Memo-derived tasks. Cross-check insider claims against public signals before acting on them."
      right={<button onClick={() => onJumpTo?.('signals')} className="text-[10px] inline-flex items-center gap-1 px-2 py-1 border border-zinc-700 rounded text-zinc-300 hover:bg-zinc-800">Open Signal Tracker →</button>}
    >
      <div className="space-y-2">
        {tasks.map(t => (
          <div key={t.id} className={`border rounded p-2.5 ${t.completed ? 'border-zinc-800 bg-zinc-900/40 opacity-60' : 'border-amber-900/50 bg-amber-950/20'}`}>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => onToggle?.(t.id)}
                className="mt-0.5 accent-cyan-500"
              />
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium ${t.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{t.label}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{t.detail}</div>
                {t.completed && t.completedAt && (
                  <div className="text-[10px] text-emerald-500 mt-1 font-mono">✓ Completed {t.completedAt.slice(0, 10)}</div>
                )}
              </div>
            </label>
          </div>
        ))}
      </div>
    </Panel>
  );
}
