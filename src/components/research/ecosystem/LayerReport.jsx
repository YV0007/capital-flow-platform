// ══════════════════════════════════════════════════════════════════════════
// LayerReport — opens from a RING LABEL, never from a node.
//
// That distinction is the model: on this map the only clickable object is a
// COMPANY. A layer is a coordinate — so its report hangs off its label at the
// top of the wheel, the way the flow map's cluster report hangs off a cluster
// title.
//
// It answers, in this order and then stops:
//   1. How concentrated is this layer, and what that means in words
//   2. Who controls it — ranked by criticality INSIDE this layer
//   3. Where the bottleneck actually is
//   4. Is there a second source
//   5. What changed this month
//
// Every number is the engine's. The report only arranges them.
// ══════════════════════════════════════════════════════════════════════════

import { X, ChevronRight, Layers, AlertTriangle, GitBranch, History } from 'lucide-react';
import { CONCENTRATION_META, critIn } from '../../../data/ecosystemMap.js';

const MONO = 'ui-monospace, monospace';
export const LAYER_REPORT_W = 430;

export default function LayerReport({
  layer, nodeById, edges, changelog, onOpenEntity, onOpenDcNode, onClose, topInset = 0,
}) {
  if (!layer) return null;

  const conc = CONCENTRATION_META[layer.concentration?.level] || CONCENTRATION_META.competitive;
  // Members, ranked by criticality IN THIS LAYER (not by their headline score
  // — a company can be an anchor elsewhere and a bit player here).
  const members = (layer.members || [])
    .map(id => nodeById.get(id))
    .filter(Boolean)
    .map(n => ({ n, c: critIn(n, layer.id) }))
    .sort((a, b) => b.c - a.c);
  const total = members.reduce((s, m) => s + m.c, 0);

  // The bottleneck: the most critical member, and how far clear of the next.
  const lead = members[0] || null;
  const second = members[1] || null;
  const gap = lead && second ? lead.c - second.c : null;

  // A second source exists when someone else in this layer supplies at least
  // one of the same customers. Derived from the edges, not asserted.
  const secondSource = lead ? findSecondSource(lead.n, members, edges, nodeById) : null;

  const changes = collectChanges(changelog, layer, nodeById);

  return (
    <aside style={{
      position: 'absolute', top: topInset, right: 0, bottom: 0, width: LAYER_REPORT_W, zIndex: 26,
      background: 'var(--cf-panel)',
      borderLeft: '1px solid var(--cf-border)',
      backdropFilter: 'blur(10px)',
      boxShadow: '-24px 0 60px -20px var(--cf-shadow)',
      display: 'flex', flexDirection: 'column',
      animation: 'cfmSlide 220ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      <div style={{ padding: '15px 16px 13px', borderBottom: '1px solid var(--cf-border-soft)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.12em' }}>
              СЛОЙ {layer.id}
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em', lineHeight: 1.2, marginTop: 3 }}>
              {layer.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--cf-text5)', marginTop: 3 }}>{layer.caption}</div>
          </div>
          <button onClick={onClose} title="Закрыть отчёт"
            style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 3, lineHeight: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 40px' }}>
        {/* 1. Concentration */}
        <Section title="Концентрация" icon={<Layers size={11} />}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px' }}>
            <span style={{
              padding: '4px 10px', borderRadius: 6, background: conc.color + '18',
              border: `1px solid ${conc.color}55`, color: conc.color,
              fontSize: 11, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.05em',
            }}>{conc.label}</span>
            <span style={{ fontSize: 11, color: 'var(--cf-text5)', fontFamily: MONO }}>
              HHI {layer.concentration?.hhi ?? '—'} · {members.length} {plural(members.length, ['компания', 'компании', 'компаний'])}
            </span>
          </div>
          <Note>{conc.blurb}</Note>
        </Section>

        {/* 2. Who holds it */}
        <Section title="Кто контролирует слой" icon={<Layers size={11} />} count={members.length}>
          {!members.length && <Note>В этом слое пока нет узлов — движок его ещё не наполнил.</Note>}
          {members.map(({ n, c }) => (
            <button key={n.id} onClick={() => onOpenEntity(n.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 16px', background: 'transparent', border: 'none',
                borderTop: '1px solid var(--cf-border-hair)', cursor: 'pointer', textAlign: 'left',
                transition: 'background 120ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: n.color, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: 'var(--cf-text1)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {n.name}
                {n.multiLayer && (
                  <span title="Компания живёт и в других слоях — на карте это одна капсула"
                    style={{ marginLeft: 6, fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700 }}>
                    {n.segments.map(s => s.layer).join('·')}
                  </span>
                )}
              </span>
              <span style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, flexShrink: 0 }}>
                {n.roleMeta?.short}
              </span>
              <span style={{ width: 46, height: 4, borderRadius: 2, background: 'var(--cf-surface2)', overflow: 'hidden', flexShrink: 0 }}>
                <span style={{ display: 'block', height: '100%', width: `${c}%`, background: n.color }} />
              </span>
              <span style={{ width: 44, fontSize: 10, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text3)', textAlign: 'right', flexShrink: 0 }}>
                {c}
                <span style={{ color: 'var(--cf-text8)', fontWeight: 400 }}>
                  {total ? ` ${Math.round((c / total) * 100)}%` : ''}
                </span>
              </span>
            </button>
          ))}
        </Section>

        {/* 3 + 4. Bottleneck and second source */}
        {lead && (
          <Section title="Узкое место" icon={<AlertTriangle size={11} />}>
            <div style={{ padding: '0 16px', fontSize: 12, color: 'var(--cf-text2)', lineHeight: 1.55 }}>
              <b style={{ color: 'var(--cf-text0)' }}>{lead.n.name}</b> — критичность {lead.c} в этом слое
              {gap != null && second
                ? `, следующий (${second.n.name}) отстаёт на ${gap} ${plural(gap, ['пункт', 'пункта', 'пунктов'])}.`
                : ' — единственный узел слоя.'}
              {lead.n.whatBreaksIt && (
                <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--cf-text4)' }}>
                  {/* Only the FIRST letter is lowered — `toLowerCase()` on the
                      whole sentence turned "HBM Samsung у NVIDIA" into
                      "hbm samsung у nvidia". */}
                  Сломает позицию: {uncapitalise(lead.n.whatBreaksIt)}
                </div>
              )}
            </div>
          </Section>
        )}

        <Section title="Есть ли второй источник" icon={<GitBranch size={11} />}>
          {secondSource ? (
            <div style={{ padding: '0 16px', fontSize: 12, color: 'var(--cf-text2)', lineHeight: 1.55 }}>
              Да — <button onClick={() => onOpenEntity(secondSource.node.id)} style={inlineBtn}>{secondSource.node.name}</button>
              {' '}поставляет{' '}
              {secondSource.shared.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && ', '}
                  <button onClick={() => onOpenEntity(c.id)} style={inlineBtn}>{c.name}</button>
                </span>
              ))}
              {' '}— тем же покупателям, что и лидер слоя. Переключение возможно, но по цене времени, а не мгновенно.
            </div>
          ) : (
            <Note>
              {lead
                ? 'Нет: ни один другой узел слоя не поставляет тем же покупателям. Отказ лидера останавливает всё, что выше.'
                : 'Слой пуст — вопрос не имеет смысла.'}
            </Note>
          )}
        </Section>

        {/* 5. What changed */}
        <Section title="Что изменилось за месяц" icon={<History size={11} />}>
          {!changes.length && <Note>За этот прогон в слое ничего не менялось.</Note>}
          {changes.map((c, i) => (
            <div key={i} style={{ padding: '6px 16px', borderTop: '1px solid var(--cf-border-hair)' }}>
              <span style={{
                fontSize: 8.5, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.07em',
                color: c.kind === 'added' ? '#34D399' : c.kind === 'removed' ? '#E5484D' : '#E0A340',
              }}>{c.kindLabel}</span>
              <span style={{ fontSize: 11.5, color: 'var(--cf-text2)', marginLeft: 8 }}>{c.text}</span>
            </div>
          ))}
        </Section>

        {/* Deep link */}
        {onOpenDcNode && members.some(m => m.n.dcNode) && (
          <Section title="Дальше">
            <div style={{ padding: '0 12px' }}>
              <button onClick={() => onOpenDcNode(members.find(m => m.n.dcNode).n.dcNode)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '8px 10px', background: 'var(--cf-surface2)',
                  border: '1px solid var(--cf-border)', borderRadius: 7,
                  color: 'var(--cf-text2)', fontSize: 11, cursor: 'pointer', textAlign: 'left',
                }}>
                <Layers size={12} /> Технический разбор слоя в DC-AI
                <span style={{ flex: 1 }} />
                <ChevronRight size={12} color="var(--cf-text7)" />
              </button>
            </div>
          </Section>
        )}
      </div>
    </aside>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────
const inlineBtn = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  color: 'var(--cf-accent)', fontSize: 'inherit', fontWeight: 700, fontFamily: 'inherit',
};

/**
 * Is anyone else in this layer selling to the same customers as the leader?
 * Purely graph-derived — no judgement, no list of "known alternatives".
 */
function findSecondSource(lead, members, edges, nodeById) {
  const leadCustomers = new Map();
  edges.forEach(e => { if (e.sourceId === lead.id) leadCustomers.set(e.targetId, true); });
  if (!leadCustomers.size) return null;
  for (const { n } of members) {
    if (n.id === lead.id) continue;
    const shared = [];
    edges.forEach(e => {
      if (e.sourceId === n.id && leadCustomers.has(e.targetId)) shared.push(e.targetId);
    });
    if (shared.length) {
      return {
        node: n,
        shared: [...new Set(shared)].slice(0, 3).map(id => ({ id, name: nodeById.get(id)?.name || id })),
      };
    }
  }
  return null;
}

/** The engine's changelog, filtered down to this layer. */
function collectChanges(changelog, layer, nodeById) {
  if (!changelog) return [];
  const out = [];
  const touches = (id) => {
    const n = nodeById.get(id);
    return n ? n.segments.some(s => s.layer === layer.id) : false;
  };
  const LABEL = { added: 'ПОЯВИЛОСЬ', removed: 'УБРАНО', changed: 'ИЗМЕНИЛОСЬ' };
  ['added', 'removed', 'changed'].forEach(kind => {
    (changelog[kind] || []).forEach(item => {
      const name = nodeById.get(item.id)?.name;
      // Node entries filter by layer; edge entries have no layer of their own,
      // so they surface when either endpoint id is a member of this layer.
      const relevant = item.kind === 'node'
        ? touches(item.id)
        : String(item.id).split('__').slice(0, 2).some(touches);
      if (!relevant) return;
      out.push({
        kind, kindLabel: LABEL[kind],
        text: kind === 'changed'
          ? `${name || item.id}: ${item.field} ${item.from} → ${item.to}`
          : `${name || item.id} — ${item.why || ''}`,
      });
    });
  });
  return out;
}

function Section({ title, icon, count, children }) {
  return (
    <div style={{ padding: '13px 0 10px', borderBottom: '1px solid var(--cf-border-hair)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px 9px',
        fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {icon}{title}
        {count != null && <span style={{ color: 'var(--cf-text8)' }}>· {count}</span>}
      </div>
      {children}
    </div>
  );
}

function Note({ children }) {
  return (
    <div style={{ padding: '4px 16px 0', fontSize: 11, color: 'var(--cf-text6)', lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

/** Lowers the first character only, leaving every proper noun alone. */
function uncapitalise(text) {
  const t = String(text || '');
  return t ? t[0].toLowerCase() + t.slice(1) : t;
}

function plural(n, [one, few, many]) {
  const a = Math.abs(Math.round(n));
  const d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}
