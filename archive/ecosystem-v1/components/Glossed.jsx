// ══════════════════════════════════════════════════════════════════════════
// Glossed — prose with its jargon wired up.
//
// The panels are full of lines like «Кастомные ASIC гиперскейлеров, забирающие
// обучение внутрь». True, compact, and useless to anyone who does not already
// know what a custom ASIC is — the sentence names the threat and then leaves
// you with it.
//
// The FIRST fix is upstream, in the prose itself: the fixture now says
// «облака переведут обучение на собственные чипы, сделанные под одну свою
// задачу» instead of «кастомные ASIC гиперскейлеров». Underlining a hard word
// and shipping the reader off to another page is not an explanation — writing
// the sentence so no glossary is needed is.
//
// What is left here is the useful half: PROPER NOUNS. A company or a tech name
// in a sentence is not jargon, it is a thing on this very map, and clicking it
// should go there — without leaving the map at all:
//
//   · a COMPANY name → opens that company here
//   · a TECH NODE    → opens the company that owns it (CUDA → NVIDIA)
//
// Sector acronyms are deliberately NOT linked any more. They were the hard
// words, and the answer to a hard word is to not use it.
//
// Nothing is hard-coded: the vocabulary is company names and
// `techNodes[].label` from the payload.
// ══════════════════════════════════════════════════════════════════════════

import { ArrowUpRight } from 'lucide-react';

const MONO = 'ui-monospace, monospace';

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
export default function Glossed({ text, glossary, selfId, onOpenEntity, style }) {
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
    if (!entry || entry.id === selfId) continue;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(<Term key={start} raw={m[0]} entry={entry} onOpenEntity={onOpenEntity} />);
    last = end;
  }
  if (!parts.length) return <span style={style}>{text}</span>;
  if (last < text.length) parts.push(text.slice(last));
  return <span style={style}>{parts}</span>;
}

function Term({ raw, entry, onOpenEntity }) {
  const title = entry.kind === 'tech'
    ? `${entry.term}${entry.hint ? ` — ${entry.hint}` : ''}${entry.owner ? `. Владелец: ${entry.owner}` : ''}`
    : (entry.hint ? `${entry.term} — ${entry.hint}` : entry.term);

  if (!onOpenEntity || !entry.id) return <span title={title}>{raw}</span>;

  return (
    <button onClick={() => onOpenEntity(entry.id)} title={title}
      style={{
        display: 'inline', padding: 0, margin: 0, background: 'none', border: 'none',
        font: 'inherit', color: 'inherit', cursor: 'pointer',
        borderBottom: '1px solid var(--cf-border)', lineHeight: 'inherit',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cf-accent)'; e.currentTarget.style.borderBottomColor = 'var(--cf-accent)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'inherit'; e.currentTarget.style.borderBottomColor = 'var(--cf-border)'; }}>
      {raw}
    </button>
  );
}

/**
 * The «подробнее» affordance. Small, at the end of a line, and it tells the
 * page it opens how to come back — a one-way trip out of the map costs the
 * reader everything they had on screen.
 */
export function MoreLink({ dcNode, onOpenDcNode, label = 'подробнее' }) {
  if (!dcNode || !onOpenDcNode) return null;
  return (
    <button onClick={() => onOpenDcNode(dcNode)}
      title="Технический разбор этого звена в исследовании «Data Centers for AI». Оттуда можно вернуться сюда."
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        marginLeft: 6, padding: 0, background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--cf-accent)', fontSize: 10, fontFamily: MONO, whiteSpace: 'nowrap',
        verticalAlign: 'baseline',
      }}>
      {label} <ArrowUpRight size={9} />
    </button>
  );
}

