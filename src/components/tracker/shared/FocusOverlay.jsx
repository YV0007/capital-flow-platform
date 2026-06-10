// Focus-mode pair — corner trigger button + centered overlay with blur
// backdrop. Monolith lines 3501–3595. The overlay uses inline styles so
// it renders correctly even before Tailwind CDN JIT is ready.
//
// Usage:
//   const [focused, setFocused] = useState(false);
//   <div className="relative">
//     ...panel content...
//     <FocusButton onClick={() => setFocused(true)} />
//   </div>
//   <FocusOverlay open={focused} onClose={() => setFocused(false)} title="…">
//     ...same content, re-rendered larger...
//   </FocusOverlay>

import { useEffect } from 'react';
import { Maximize2, X } from 'lucide-react';

export function FocusButton({ onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      title="Focus mode"
      aria-label="Open in focus mode"
      className={`inline-flex items-center justify-center w-6 h-6 rounded text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors ${className}`}>
      <Maximize2 className="w-3 h-3" />
    </button>
  );
}

export function FocusOverlay({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '7vh',
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 16,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        overflowY: 'auto',
      }}
      onClick={onClose}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1024,
          maxHeight: '86vh',
          overflowY: 'auto',
          background: 'rgb(24, 24, 27)',
          border: '1px solid rgb(63, 63, 70)',
          borderRadius: 8,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: 'rgb(24, 24, 27)',
            borderBottom: '1px solid rgb(39, 39, 42)',
          }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgb(212, 212, 216)' }}>{title}</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgb(161, 161, 170)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
            aria-label="Close focus mode">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
