// Watchlist UI — two small pieces sharing one popover style:
//   · WatchlistSelector — top-bar control: activate a saved list (the map then
//     shows only that subset), create / delete lists.
//   · WatchlistMenu — per-entity bookmark: toggle this entity in/out of any
//     list, or start a new list with it. Used by the entity panel + roster.
// State lives in useWatchlists (localStorage) — survives reloads.

import { useEffect, useRef, useState } from 'react';
import { Bookmark, BookmarkCheck, Plus, Trash2, Check, X } from 'lucide-react';
import { useT } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';

const pop = {
  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 60,
  width: 240, background: 'var(--cf-popover)', border: '1px solid var(--cf-border)', borderRadius: 9,
  boxShadow: '0 16px 40px -12px var(--cf-shadow)', overflow: 'hidden',
  animation: 'cfmDrop 140ms ease-out',
};

// Close on any click outside — including on the graph canvas. That last part
// is why this listens in the CAPTURE phase: the force-graph canvas is wired to
// d3-drag, which calls stopImmediatePropagation() on mousedown, so a normal
// bubble-phase listener on document never hears a click on the map. Capture
// runs document → target, so we see it first. Escape closes it too.
function useOutsideClose(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}

function NewListRow({ onCreate }) {
  const t = useT();
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
          background: 'transparent', border: 'none', color: 'var(--cf-accent)',
          fontSize: 10.5, fontFamily: MONO, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
        <Plus size={11} /> {t('Новый список', 'New list')}
      </button>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px' }}>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setName(''); setEditing(false); } }}
        placeholder={t('Название…', 'Name…')}
        style={{
          flex: 1, minWidth: 0, padding: '5px 8px', background: 'var(--cf-surface0)',
          border: '1px solid var(--cf-border)', borderRadius: 6,
          color: 'var(--cf-text1)', fontSize: 10.5, fontFamily: MONO, outline: 'none',
        }} />
      <button onClick={commit} title={t('Создать', 'Create')}
        style={{ background: 'none', border: 'none', color: 'var(--cf-good)', cursor: 'pointer', padding: 3, lineHeight: 0 }}>
        <Check size={13} />
      </button>
      <button onClick={() => { setName(''); setEditing(false); }} title={t('Отмена', 'Cancel')}
        style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 3, lineHeight: 0 }}>
        <X size={13} />
      </button>
    </div>
  );
}

// ── Top-bar selector ─────────────────────────────────────────────────────
export function WatchlistSelector({ wl }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const active = wl.activeList;

  return (
    <div ref={ref} style={{ position: 'relative', pointerEvents: 'auto' }}>
      <button onClick={() => setOpen(o => !o)}
        title={t('Списки наблюдения — сохранённые подборки карты', 'Watchlists — saved selections from the map')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 11px',
          background: active ? 'var(--cf-accent-bg)' : 'var(--cf-topbar)',
          border: `1px solid ${active ? 'var(--cf-accent-bd)' : 'var(--cf-border)'}`,
          borderRadius: 8, color: active ? 'var(--cf-accent)' : 'var(--cf-text3)', cursor: 'pointer',
          fontSize: 10, fontFamily: MONO, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
          maxWidth: 190,
        }}>
        {active ? <BookmarkCheck size={12} style={{ flexShrink: 0 }} /> : <Bookmark size={12} style={{ flexShrink: 0 }} />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{active ? active.name : t('Списки', 'Lists')}</span>
      </button>

      {open && (
        <div style={pop}>
          {wl.lists.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 10, color: 'var(--cf-text6)', fontFamily: MONO, lineHeight: 1.6 }}>
              {t('Списков пока нет. Создайте один и добавляйте объекты из панели или таблицы.', 'No lists yet. Create one and add entities from the panel or the table.')}
            </div>
          )}
          {wl.lists.map(l => {
            const on = l.id === wl.activeId;
            return (
              <div key={l.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px',
                  borderBottom: '1px solid var(--cf-border-hair)', cursor: 'pointer',
                  background: on ? 'var(--cf-accent-bg)' : 'transparent',
                }}
                onClick={() => { wl.setActive(on ? null : l.id); setOpen(false); }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--cf-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = on ? 'var(--cf-accent-bg)' : 'transparent'; }}>
                <span style={{ width: 12, flexShrink: 0, color: 'var(--cf-accent)' }}>{on ? <Check size={12} /> : null}</span>
                <span style={{
                  flex: 1, minWidth: 0, fontSize: 11, fontWeight: 600, color: on ? 'var(--cf-accent)' : 'var(--cf-text1)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{l.name}</span>
                <span style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, flexShrink: 0 }}>{l.ids.length}</span>
                <button onClick={(e) => { e.stopPropagation(); wl.deleteList(l.id); }} title={t(`Удалить «${l.name}»`, `Delete “${l.name}”`)}
                  style={{ background: 'none', border: 'none', color: 'var(--cf-text9)', cursor: 'pointer', padding: 2, lineHeight: 0, flexShrink: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-bad)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text9)')}>
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
          <NewListRow onCreate={(name) => { wl.createList(name); setOpen(false); }} />
          {wl.activeId && (
            <button onClick={() => { wl.setActive(null); setOpen(false); }}
              style={{
                display: 'block', width: '100%', padding: '7px 11px',
                background: 'transparent', border: 'none', borderTop: '1px solid var(--cf-border-hair)',
                color: 'var(--cf-text3)', fontSize: 10, fontFamily: MONO, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text0)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text3)')}>
              {t('Показать всю карту', 'Show the whole map')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Per-entity bookmark menu ─────────────────────────────────────────────
export function WatchlistMenu({ wl, entityId, size = 15, align = 'right' }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const memberIds = wl.memberOf(entityId);
  const inAny = memberIds.length > 0;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        title={inAny ? `В списках: ${memberIds.length}` : t('Добавить в список', 'Add to a list')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 3, lineHeight: 0,
          color: inAny ? 'var(--cf-accent)' : 'var(--cf-text7)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = inAny ? '#7dd3fc' : 'var(--cf-text3)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = inAny ? 'var(--cf-accent)' : 'var(--cf-text7)')}>
        {inAny ? <BookmarkCheck size={size} /> : <Bookmark size={size} />}
      </button>

      {open && (
        <div style={{ ...pop, ...(align === 'left' ? { left: 0, right: 'auto' } : null) }}
          onClick={(e) => e.stopPropagation()}>
          {wl.lists.length === 0 && (
            <div style={{ padding: '9px 12px', fontSize: 10, color: 'var(--cf-text6)', fontFamily: MONO, lineHeight: 1.6 }}>
              {t('Списков пока нет — создайте первый ниже.', 'No lists yet — create the first one below.')}
            </div>
          )}
          {wl.lists.map(l => {
            const on = l.ids.includes(entityId);
            return (
              <button key={l.id} onClick={() => wl.toggleMember(l.id, entityId)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '7px 11px',
                  background: 'transparent', border: 'none', borderBottom: '1px solid var(--cf-border-hair)',
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ width: 12, flexShrink: 0, color: 'var(--cf-accent)' }}>{on ? <Check size={12} /> : null}</span>
                <span style={{
                  flex: 1, minWidth: 0, fontSize: 11, fontWeight: 600, color: on ? 'var(--cf-accent)' : 'var(--cf-text1)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{l.name}</span>
                <span style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, flexShrink: 0 }}>{l.ids.length}</span>
              </button>
            );
          })}
          <NewListRow onCreate={(name) => wl.createList(name, [entityId])} />
        </div>
      )}
    </div>
  );
}
