// ══════════════════════════════════════════════════════════════════════════
// "Цепочка" — the map's main interaction, as pure data.
//
// Clicking a company does NOT light a halo around it. It lights its ROUTE
// through the stack: inward to what it depends on, outward to what depends on
// it. Everything else leaves the render entirely — a chain is an answer, and an
// answer does not need the question greyed out behind it.
//
// Two things keep it readable instead of setting the whole map on fire:
//   · BRANCHING CAP — at every step only the top N edges by `strength` are
//     followed; the rest are counted and offered as "ещё N", expandable per
//     node and per direction. Without this, three hops from NVIDIA is the
//     entire map.
//   · KIND FILTER — three chains, cut along the SPINES rather than along a
//     hand-listed set of types. v1 named its edge types one by one; with 31
//     types on 5 spines that list would be a maintenance trap and would go
//     stale the first time the engine adds a type. The kinds now ask the edge
//     what spine it is on, so a new type is picked up for free.
//
// Nothing here scores or ranks anything: `strength` is the engine's number and
// the only ordering used.
// ══════════════════════════════════════════════════════════════════════════

export const CHAIN_KINDS = {
  all:     { label: 'Все связи',           short: 'ВСЁ',      spines: null,
             blurb: 'Ходить по всему сразу — физика, деньги, замки, шлюзы и соперники.' },
  supply:  { label: 'Что физически движется', short: 'ФИЗИКА', spines: ['physical'],
             blurb: 'Материалы, станки, чипы, память, ток, стойки — путь вещи по стеку.' },
  control: { label: 'Кто владеет и шлюзует', short: 'КОНТРОЛЬ', spines: ['capital', 'control'],
             blurb: 'Деньги, доли, контракты — и правила, которые решают, что вообще можно продать.' },
  moat:    { label: 'Что запирает и откусывает', short: 'РОВ', spines: ['moat', 'rivalry'],
             blurb: 'Замки, доказательства спроса и те, кто готовит замену.' },
};

export const CHAIN_DIRECTIONS = {
  both: { label: 'В обе стороны', short: 'ОБЕ' },
  up:   { label: 'От кого зависит', short: 'ВВЕРХ' },
  down: { label: 'Кто зависит',     short: 'ВНИЗ' },
};

export const CHAIN_DEPTHS = [
  { value: 1,        label: '1 шаг' },
  { value: 2,        label: '2 шага' },
  { value: Infinity, label: 'Вся цепочка' },
];

export const DEFAULT_BRANCH = 5;

/**
 * Walk the chain from `rootId`.
 *
 * @returns {{
 *   nodes: Set<string>, edges: Set<string>,
 *   depthOf: Map<string, number>,          // hops from the root, signed by side
 *   more: Array<{ nodeId, dir, hidden, key }>,   // the "ещё N" offers
 *   counts: { up: number, down: number },
 * }}
 */
export function buildChain(rootId, {
  adjacency,
  depth = Infinity,
  direction = 'both',
  kind = 'all',
  branch = DEFAULT_BRANCH,
  minStrength = 0,
  expanded = null,          // Set of "<nodeId>:<dir>" the user opened
} = {}) {
  const empty = { nodes: new Set(), edges: new Set(), depthOf: new Map(), more: [], counts: { up: 0, down: 0 } };
  if (!rootId || !adjacency) return empty;

  const allowed = CHAIN_KINDS[kind]?.spines;
  const passes = (e) => (e.strength || 0) >= minStrength
    && (!allowed || allowed.includes(e.spine));

  const nodes = new Set([rootId]);
  const edges = new Set();
  const depthOf = new Map([[rootId, 0]]);
  const more = [];
  const counts = { up: 0, down: 0 };

  const walk = (dir) => {
    // 'up' follows edges INTO a node (its suppliers / owners), 'down' follows
    // edges OUT of it (its customers / the assets it controls).
    let frontier = [rootId];
    const seen = new Set([rootId]);
    for (let step = 1; step <= depth && frontier.length; step++) {
      const next = [];
      frontier.forEach(id => {
        const list = (dir === 'up' ? adjacency.up.get(id) : adjacency.down.get(id)) || [];
        const eligible = list.filter(passes);
        const cap = expanded && expanded.has(`${id}:${dir}`) ? eligible.length : branch;
        const taken = eligible.slice(0, cap);
        const hidden = eligible.length - taken.length;
        if (hidden > 0) more.push({ nodeId: id, dir, hidden, key: `${id}:${dir}` });
        taken.forEach(e => {
          const other = dir === 'up' ? e.sourceId : e.targetId;
          edges.add(e.id);
          counts[dir] += 1;
          if (!nodes.has(other)) nodes.add(other);
          if (!depthOf.has(other)) depthOf.set(other, dir === 'up' ? -step : step);
          if (!seen.has(other)) { seen.add(other); next.push(other); }
        });
      });
      frontier = next;
    }
  };

  if (direction === 'up' || direction === 'both') walk('up');
  if (direction === 'down' || direction === 'both') walk('down');

  return { nodes, edges, depthOf, more, counts };
}

/**
 * The one line you can read out loud: the strongest single path through the
 * root, deepest supplier on the left, furthest consumer on the right.
 *
 *   ASML —поставляет→ TSMC —поставляет→ NVIDIA —строит вместе→ Foxconn …
 *
 * Greedy on `strength` and cycle-guarded (this graph HAS cycles by design —
 * that is the whole point of the круги lens — so an unguarded walk would loop
 * forever). Restricted to the same nodes/edges the chain lit up, so the text
 * can never claim a hop the map is not showing.
 */
export function principalPath(rootId, { adjacency, chain, entityById, kind = 'all', minStrength = 0 } = {}) {
  if (!rootId || !adjacency || !entityById?.has(rootId)) return [];
  const allowed = CHAIN_KINDS[kind]?.spines;
  const ok = (e) => chain.edges.has(e.id)
    && (e.strength || 0) >= minStrength
    && (!allowed || allowed.includes(e.spine));

  const walk = (dir) => {
    const out = [];
    const seen = new Set([rootId]);
    let cur = rootId;
    for (let guard = 0; guard < 24; guard++) {
      const list = ((dir === 'up' ? adjacency.up.get(cur) : adjacency.down.get(cur)) || []).filter(ok);
      const nextEdge = list.find(e => !seen.has(dir === 'up' ? e.sourceId : e.targetId));
      if (!nextEdge) break;
      const other = dir === 'up' ? nextEdge.sourceId : nextEdge.targetId;
      seen.add(other);
      out.push({ edge: nextEdge, node: entityById.get(other) });
      cur = other;
    }
    return out;
  };

  const up = walk('up');      // root ← supplier ← supplier…
  const down = walk('down');  // root → customer → customer…

  // Rebuild left→right: deepest supplier first, then the root, then outward.
  const crumbs = [];
  up.slice().reverse().forEach((hop, i, arr) => {
    crumbs.push({ node: hop.node, edge: i > 0 ? arr[i - 1].edge : null });
  });
  crumbs.push({ node: entityById.get(rootId), edge: up.length ? up[0].edge : null, isRoot: true });
  down.forEach(hop => crumbs.push({ node: hop.node, edge: hop.edge }));
  // `edge` on a crumb is the edge ARRIVING at it from the crumb on its left.
  return crumbs.filter(c => c.node);
}
