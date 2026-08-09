// Watchlist UI — two small pieces sharing one popover style:
//   · WatchlistSelector — top-bar control: activate a saved list (the map then
//     shows only that subset), create / delete lists.
//   · WatchlistMenu — per-entity bookmark: toggle this entity in/out of any
//     list, or start a new list with it. Used by the entity panel + roster.
// State lives in useWatchlists (localStorage) — survives reloads.

import { useEffect, useRef, useState } from 'react';
import { Bookmark, BookmarkCheck, Plus, Trash2, Check, X } from 'lucide-react';

const MONO = 'ui-monospace, monospace';

const pop = {
  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 60,
  width: 240, background: '#101116', border: '1px solid #26262e', borderRadius: 9,
  boxShadow: '0 16px 40px -12px rgba(0,0,0,0.9)', overflow: 'hidden',
  animation: 'cfmDrop 140ms ease-out',
};

function useOutsideClose(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, onClose]);
  return ref;
}

function NewListRow({ onCreate }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const commit = () => {
    if (name.trim()) onCreate(name.trim());
    setName(''); setEditing(false);
  };
  if (!editing) {
    return (
      <button onClick={() => setEditing(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '8px 11px',
          background: 'transparent', border: 'none', color: '#38BDF8',
          fontSize: 10.5, fontFamily: MONO, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#181920')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
        <Plus size={11} /> New watchlist
      </button>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px' }}>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setName(''); setEditing(false); } }}
        placeholder="List name…"
        style={{
          flex: 1, minWidth: 0, padding: '5px 8px', background: '#0a0b0f',
          border: '1px solid #26262e', borderRadius: 6,
          color: '#e4e4e7', fontSize: 10.5, fontFamily: MONO, outline: 'none',
        }} />
      <button onClick={commit} title="Create"
        style={{ background: 'none', border: 'none', color: '#34D399', cursor: 'pointer', padding: 3, lineHeight: 0 }}>
        <Check size={13} />
      </button>
      <button onClick={() => { setName(''); setEditing(false); }} title="Cancel"
        style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 3, lineHeight: 0 }}>
        <X size={13} />
      </button>
    </div>
  );
}

// ── Top-bar selector ─────────────────────────────────────────────────────
export function WatchlistSelector({ wl }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const active = wl.activeList;

  return (
    <div ref={ref} style={{ position: 'relative', pointerEvents: 'auto' }}>
      <button onClick={() => setOpen(o => !o)}
        title="Watchlists — saved subsets of the map"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 11px',
          background: active ? 'rgba(56,189,248,0.1)' : 'rgba(18,19,24,0.9)',
          border: `1px solid ${active ? 'rgba(56,189,248,0.38)' : '#26262e'}`,
          borderRadius: 8, color: active ? '#38BDF8' : '#a1a1aa', cursor: 'pointer',
          fontSize: 10, fontFamily: MONO, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
          maxWidth: 190,
        }}>
        {active ? <BookmarkCheck size={12} style={{ flexShrink: 0 }} /> : <Bookmark size={12} style={{ flexShrink: 0 }} />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{active ? active.name : 'Watchlists'}</span>
      </button>

      {open && (
        <div style={pop}>
          {wl.lists.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 10, color: '#6b6b74', fontFamily: MONO, lineHeight: 1.6 }}>
              No watchlists yet. Create one, then add entities from their panel or the roster.
            </div>
          )}
          {wl.lists.map(l => {
            const on = l.id === wl.activeId;
            return (
              <div key={l.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px',
                  borderBottom: '1px solid #191a20', cursor: 'pointer',
                  background: on ? 'rgba(56,189,248,0.07)' : 'transparent',
                }}
                onClick={() => { wl.setActive(on ? null : l.id); }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = '#181920'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = on ? 'rgba(56,189,248,0.07)' : 'transparent'; }}>
                <span style={{ width: 12, flexShrink: 0, color: '#38BDF8' }}>{on ? <Check size={12} /> : null}</span>
                <span style={{
                  flex: 1, minWidth: 0, fontSize: 11, fontWeight: 600, color: on ? '#38BDF8' : '#e4e4e7',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{l.name}</span>
                <span style={{ fontSize: 9, color: '#52525b', fontFamily: MONO, flexShrink: 0 }}>{l.ids.length}</span>
                <button onClick={(e) => { e.stopPropagation(); wl.deleteList(l.id); }} title={`Delete "${l.name}"`}
                  style={{ background: 'none', border: 'none', color: '#3f3f46', cursor: 'pointer', padding: 2, lineHeight: 0, flexShrink: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#F87171')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#3f3f46')}>
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
          <NewListRow onCreate={(name) => wl.createList(name)} />
          {wl.activeId && (
            <button onClick={() => { wl.setActive(null); setOpen(false); }}
              style={{
                display: 'block', width: '100%', padding: '7px 11px',
                background: 'transparent', border: 'none', borderTop: '1px solid #191a20',
                color: '#a1a1aa', fontSize: 10, fontFamily: MONO, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fafafa')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}>
              Show the full map
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Per-entity bookmark menu ─────────────────────────────────────────────
export function WatchlistMenu({ wl, entityId, size = 15, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const memberIds = wl.memberOf(entityId);
  const inAny = memberIds.length > 0;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        title={inAny ? `In ${memberIds.length} watchlist${memberIds.length === 1 ? '' : 's'}` : 'Add to a watchlist'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 3, lineHeight: 0,
          color: inAny ? '#38BDF8' : '#52525b',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = inAny ? '#7dd3fc' : '#a1a1aa')}
        onMouseLeave={(e) => (e.currentTarget.style.color = inAny ? '#38BDF8' : '#52525b')}>
        {inAny ? <BookmarkCheck size={size} /> : <Bookmark size={size} />}
      </button>

      {open && (
        <div style={{ ...pop, ...(align === 'left' ? { left: 0, right: 'auto' } : null) }}
          onClick={(e) => e.stopPropagation()}>
          {wl.lists.length === 0 && (
            <div style={{ padding: '9px 12px', fontSize: 10, color: '#6b6b74', fontFamily: MONO, lineHeight: 1.6 }}>
              No watchlists yet — create the first one below.
            </div>
          )}
          {wl.lists.map(l => {
            const on = l.ids.includes(entityId);
            return (
              <button key={l.id} onClick={() => wl.toggleMember(l.id, entityId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '7px 11px',
                  background: 'transparent', border: 'none', borderBottom: '1px solid #191a20',
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#181920')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ width: 12, flexShrink: 0, color: '#38BDF8' }}>{on ? <Check size={12} /> : null}</span>
                <span style={{
                  flex: 1, minWidth: 0, fontSize: 11, fontWeight: 600, color: on ? '#38BDF8' : '#e4e4e7',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{l.name}</span>
                <span style={{ fontSize: 9, color: '#52525b', fontFamily: MONO, flexShrink: 0 }}>{l.ids.length}</span>
              </button>
            );
          })}
          <NewListRow onCreate={(name) => wl.createList(name, [entityId])} />
        </div>
      )}
    </div>
  );
}
