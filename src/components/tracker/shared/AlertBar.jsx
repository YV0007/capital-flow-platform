import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AlertBar({ alerts, onJumpTo }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-500">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        <span>No active alerts. Continue logging observations to maintain coverage.</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 overflow-x-auto">
      <span className="text-[10px] uppercase tracking-wider text-zinc-500 shrink-0">Alerts</span>
      {alerts.map((a, i) => {
        const map = { rose: 'text-rose-400 border-rose-800 bg-rose-950/40',
                      amber: 'text-amber-300 border-amber-800 bg-amber-950/40' };
        return (
          <button key={i} onClick={() => onJumpTo?.(a.kind)} className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] border rounded shrink-0 ${map[a.severity]}`}>
            <AlertTriangle className="w-3 h-3" />
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
