// ══════════════════════════════════════════════════════════════════════════
// Glossed — prose with its jargon wired up.
//
// The panels are full of lines like «Кастомные ASIC гиперскейлеров, забирающие
// обучение внутрь». True, compact, and useless to anyone who does not already
// know what a custom ASIC is — the sentence names the threat and then leaves
// you with it.
//
// So every term the MAP ALREADY KNOWS becomes a link, right inside the
// sentence, and each kind of term goes where that kind of term is answered:
//
//   · a COMPANY name   → opens that company here, on this map
//   · a TECH NODE      → opens the company that owns it (CUDA → NVIDIA)
//   · a SECTOR / its acronym → the tooltip names who builds it in this
//     ecosystem, and the click opens the matching block in the DC-AI research,
//     which is where that part of the stack is actually explained
//
// Nothing is hard-coded: the vocabulary is built from the payload — company
// names, `techNodes[].label`, `sectors[].label`, and the distinctive acronyms
// inside `sectors[].key` (ASIC, HBM, EDA, PCB, SMR, DRAM …), which is exactly
// where the jargon lives. A payload with different sectors glosses different
// words with no code change.
// ══════════════════════════════════════════════════════════════════════════

const MONO = 'ui-monospace, monospace';

// Words in a sector key that carry no meaning on their own.
const STOP = new Set(['tools', 'systems', 'materials', 'chem', 'cable', 'fiber',
  'infra', 'lab', 'apps', 'mgmt', 'modules', 'fabric', 'silicon', 'packaging',
  'steel', 'cells', 'pipelines', 'turbines', 'renewables', 'power', 'test',
  'custom', 'adv', 'inference', 'contracting', 'frontier', 'specialty',
  'bonding', 'switchgear', 'transformers', 'dark', 'optical', 'interconnect',
  'network', 'photonics', 'nuclear', 'titanium', 'server', 'liquid', 'cooling',
  'compute', 'gas', 'fuel', 'ip']);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isWordChar = (c) => !!c && /[\p{L}\p{N}]/u.test(c);

/**
 * Builds the term → target index once per payload.
 * Longest terms first, so "Arm Holdings" wins over "Arm".
 */
export function buildGlossary(graph) {
  const terms = new Map();          // lower-cased term → entry
  const add = (term, entry) => {
    const t = String(term || '').trim();
    if (t.length < 3) return;
    const k = t.toLowerCase();
    if (!terms.has(k)) terms.set(k, { ...entry, term: t });
  };

  graph.nodes.forEach(n => add(n.name, { kind: 'node', id: n.id, hint: n.oneLiner }));
  graph.techNodes.forEach(t => add(t.label, {
    kind: 'tech', id: t.owner, hint: t.note,
    owner: graph.nodeById.get(t.owner)?.name,
  }));

  (graph.sectors || []).forEach(sec => {
    const members = graph.nodes
      .filter(n => n.sector === sec.key)
      .sort((a, b) => (b.criticality || 0) - (a.criticality || 0));
    const entry = {
      kind: 'sector', key: sec.key, dcNode: sec.dcNode,
      label: sec.label, members: members.map(m => ({ id: m.id, name: m.name })),
    };
    add(sec.label, entry);
    // The acronyms inside the English key are the actual jargon — "Custom
    // ASIC" is written «кастомные ASIC» in Russian prose, so the label alone
    // would never match.
    String(sec.key).split(/[^A-Za-z0-9]+/).forEach(word => {
      if (word.length < 3 || STOP.has(word.toLowerCase())) return;
      if (word === word.toUpperCase() || word.length >= 4) add(word, entry);
    });
  });

  const sorted = [...terms.keys()].sort((a, b) => b.length - a.length);
  if (!sorted.length) return { terms, re: null };
  return { terms, re: new RegExp(`(${sorted.map(escapeRe).join('|')})`, 'giu') };
}

/**
 * Renders `text` with every known term turned into a link.
 *
 * Boundaries are checked by index rather than by a lookbehind — Safari below
 * 16.4 has no lookbehind, and this repo already avoids it elsewhere.
 */
export default function Glossed({
  text, glossary, selfId, onOpenEntity, onOpenDcNode, style,
}) {
  if (!text) return null;
  const re = glossary?.re;
  if (!re) return <span style={style}>{text}</span>;

  const parts = [];
  let last = 0;
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    const start = m.index, end = start + m[0].length;
    // Reject a hit sitting inside a longer word ("HBM" inside "HBM3E" is fine
    // as a term, but "arm" inside "армия" is not).
    if (isWordChar(text[start - 1]) || isWordChar(text[end])) continue;
    const entry = glossary.terms.get(m[0].toLowerCase());
    // Never link a company to itself inside its own panel — that is a dead
    // click and it makes the sentence look busier than it is.
    if (!entry || (entry.kind !== 'sector' && entry.id === selfId)) continue;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(<Term key={start} raw={m[0]} entry={entry} onOpenEntity={onOpenEntity} onOpenDcNode={onOpenDcNode} />);
    last = end;
  }
  if (!parts.length) return <span style={style}>{text}</span>;
  if (last < text.length) parts.push(text.slice(last));
  return <span style={style}>{parts}</span>;
}

function Term({ raw, entry, onOpenEntity, onOpenDcNode }) {
  let title, onClick, enabled;

  if (entry.kind === 'node') {
    title = entry.hint ? `${entry.term} — ${entry.hint}` : entry.term;
    onClick = () => onOpenEntity?.(entry.id);
    enabled = !!onOpenEntity;
  } else if (entry.kind === 'tech') {
    title = `${entry.term}${entry.hint ? ` — ${entry.hint}` : ''}${entry.owner ? `. Владелец: ${entry.owner}` : ''}`;
    onClick = () => onOpenEntity?.(entry.id);
    enabled = !!onOpenEntity && !!entry.id;
  } else {
    const who = entry.members.length
      ? `В карте это ${entry.members.slice(0, 4).map(x => x.name).join(', ')}${entry.members.length > 4 ? ` и ещё ${entry.members.length - 4}` : ''}.`
      : 'В карте пока нет компаний в этой функции.';
    // Click goes to DC-AI — that is where this part of the stack is explained.
    // If there is no block for it, fall back to the strongest company here.
    const canDc = !!onOpenDcNode && !!entry.dcNode;
    title = `${entry.label} — ${who} ${canDc ? 'Клик → технический разбор в DC-AI.' : ''}`.trim();
    onClick = canDc
      ? () => onOpenDcNode(entry.dcNode)
      : (entry.members[0] ? () => onOpenEntity?.(entry.members[0].id) : null);
    enabled = !!onClick;
  }

  if (!enabled) return <span title={title}>{raw}</span>;

  return (
    <button onClick={onClick} title={title}
      style={{
        display: 'inline', padding: 0, margin: 0, background: 'none', border: 'none',
        font: 'inherit', color: 'inherit', cursor: 'pointer',
        borderBottom: '1px dashed var(--cf-text7)', lineHeight: 'inherit',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cf-accent)'; e.currentTarget.style.borderBottomColor = 'var(--cf-accent)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'inherit'; e.currentTarget.style.borderBottomColor = 'var(--cf-text7)'; }}>
      {raw}
    </button>
  );
}

/** Small legend line, so the dashed underline is not a mystery. */
export function GlossHint() {
  return (
    <span style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO }}>
      подчёркнутое — кликабельно
    </span>
  );
}
