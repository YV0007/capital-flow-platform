// Watchlists — user-defined, named, cross-entity subsets of the map.
// Any mix of allocators / companies / projects lives in one list. Client-side
// persistence (localStorage) so membership and the active selection survive
// reloads. Pure UI state — never written back into the engine payload.

import { useCallback, useEffect, useState } from 'react';

const KEY = 'cfm:watchlists:v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { lists: [], activeId: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.lists)) return { lists: [], activeId: null };
    return {
      lists: parsed.lists.filter(l => l && l.id && typeof l.name === 'string')
        .map(l => ({ ...l, ids: Array.isArray(l.ids) ? l.ids : [] })),
      activeId: parsed.activeId || null,
    };
  } catch {
    return { lists: [], activeId: null };
  }
}

export default function useWatchlists() {
  const [state, setState] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  }, [state]);

  const createList = useCallback((name, ids = []) => {
    const clean = String(name || '').trim();
    if (!clean) return null;
    const id = `wl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    setState(s => ({ ...s, lists: [...s.lists, { id, name: clean, ids: [...new Set(ids)] }] }));
    return id;
  }, []);

  const renameList = useCallback((id, name) => {
    const clean = String(name || '').trim();
    if (!clean) return;
    setState(s => ({ ...s, lists: s.lists.map(l => (l.id === id ? { ...l, name: clean } : l)) }));
  }, []);

  const deleteList = useCallback((id) => {
    setState(s => ({
      lists: s.lists.filter(l => l.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
    }));
  }, []);

  const setActive = useCallback((id) => {
    setState(s => ({ ...s, activeId: id }));
  }, []);

  const toggleMember = useCallback((listId, entityId) => {
    setState(s => ({
      ...s,
      lists: s.lists.map(l => {
        if (l.id !== listId) return l;
        const has = l.ids.includes(entityId);
        return { ...l, ids: has ? l.ids.filter(x => x !== entityId) : [...l.ids, entityId] };
      }),
    }));
  }, []);

  const activeList = state.lists.find(l => l.id === state.activeId) || null;
  const memberOf = useCallback(
    (entityId) => state.lists.filter(l => l.ids.includes(entityId)).map(l => l.id),
    [state.lists]
  );

  return {
    lists: state.lists,
    activeId: state.activeId,
    activeList,
    createList, renameList, deleteList, setActive, toggleMember, memberOf,
  };
}
