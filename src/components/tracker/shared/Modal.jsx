// Modal — generic centered dialog. Monolith lines 3597–3610.
// Used by ObservationForm, SyndicateCommForm, and the per-source log modals.

import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className={`bg-zinc-900 border border-zinc-700 rounded shadow-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-900">
          <div className="text-sm font-mono uppercase tracking-wider text-zinc-200">{title}</div>
          <button className="text-zinc-500 hover:text-zinc-200" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
