// ══════════════════════════════════════════════════════════════════════════
// LayerReport — opens from a CELL LABEL, never from an entity.
//
// That distinction is the model: on this map the only clickable object is an
// ENTITY. A layer is a coordinate — so its report hangs off its label at the
// top of the cell, the way the flow map's cluster report hangs off a cluster
// title.
//
// For a layer on the ORBIT or the NUCLEUS it answers, in this order:
//   1. How concentrated is this layer, and what that means in words
//   2. Who holds it — ranked by criticality INSIDE this layer
//   3. Where the bottleneck actually is
//   4. Is there a second source
//   5. What changed this month
//
// For a layer on the CONTROL plane the report is a DIFFERENT QUESTION, and
// that is deliberate. A gate is not a market: asking "who holds this layer" of
// a set of jurisdictions and agencies produces a ranked list nobody wants.
// What a reader wants to know about a gate is WHAT IT GATES — so the control
// report leads with the outgoing `control`-spine edges: who is shut out of
// what, with what risk and on what horizon.
//
// Every number is the engine's. The report only arranges them.
// ══════════════════════════════════════════════════════════════════════════

import { X, ChevronRight, Layers, AlertTriangle, GitBranch, History, ShieldAlert } from 'lucide-react';
import { critIn } from '../../../data/aiEcosystemNetwork.js';
import { useT, getLang } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';
export const LAYER_REPORT_W = 430;

export default function LayerReport({
  layer, entityById, edges, changelog, onOpenEntity, onClose, topInset = 0,
}) {
  const t = useT();
  if (!layer) return null;

  const isGate = layer.plane === 'control';
  const conc = layer.concentrationMeta;
  // Members, ranked by criticality IN THIS LAYER (not by their headline score
  // — an entity can be an anchor elsewhere and a bit player here).
  const members = (layer.members || [])
    .map(id => entityById.get(id))
    .filter(Boolean)
    .map(n => ({ n, c: critIn(n, layer.id) }))
    .sort((a, b) => b.c - a.c);
  const total = members.reduce((s, m) => s + m.c, 0);
  const memberIds = new Set(members.map(m => m.n.id));

  // What this gate actually gates: control-spine edges leaving the layer.
  const gated = isGate
    ? edges
      .filter(e => e.spine === 'control' && memberIds.has(e.sourceId))
      .sort((a, b) => (b.strength || 0) - (a.strength || 0))
    : [];
  // …and the mirror: control edges pointing INTO the layer. Read by the verb,
  // these are always somebody else naming this jurisdiction or agency as what
  // they hang off — «TSMC геополитически зависит от Тайваня», «NVIDIA
  // экспортно подконтролен ведомству». So the block is "who hangs off this
  // gate", NOT "what the gate obeys": the arrow runs the other way.
  const hangingOn = isGate
    ? edges
      .filter(e => e.spine === 'control' && memberIds.has(e.targetId) && !memberIds.has(e.sourceId))
      .sort((a, b) => (b.strength || 0) - (a.strength || 0))
    : [];

  const lead = members[0] || null;
  const second = members[1] || null;
  const gap = lead && second ? lead.c - second.c : null;
  const secondSource = !isGate && lead ? findSecondSource(lead.n, members, edges, entityById) : null;
  const changes = collectChanges(changelog, layer, entityById);

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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 9.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.12em' }}>
                {t('СЛОЙ', 'LAYER')} {layer.id}
              </span>
              {layer.planeMeta && (
                <span title={layer.planeMeta.blurb} style={{
                  fontSize: 8.5, color: layer.bandColor, fontFamily: MONO, fontWeight: 700,
                  letterSpacing: '0.09em', cursor: 'help',
                }}>{layer.planeMeta.short}</span>
              )}
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em', lineHeight: 1.2, marginTop: 3 }}>
              {layer.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--cf-text5)', marginTop: 3 }}>{layer.caption}</div>
          </div>
          <button onClick={onClose} title={t('Закрыть отчёт', 'Close the report')}
            style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 3, lineHeight: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 40px' }}>

        {/* ══ CONTROL PLANE: what does this gate actually gate ══ */}
        {isGate && (
          <>
            <Section title={t('Что этот шлюз гейтит', 'What this gate gates')} icon={<ShieldAlert size={11} />} count={gated.length}
              caption={t('Слои внешней дуги не стоят в стеке — они решают, что через него вообще может пройти. Поэтому отчёт начинается не с того, кто здесь сидит, а с того, на что они влияют.',
                         'The outer-arc layers do not sit in the stack — they decide what may pass through it at all. So the report opens not with who sits here but with what they affect.')}>
              {!gated.length && <Note>{t('Из этого слоя не выходит ни одной связи контроля.', 'No control link leaves this layer.')}</Note>}
              {gated.map(e => (
                <GateRow key={e.id} e={e} entityById={entityById} onOpenEntity={onOpenEntity} side="target" />
              ))}
            </Section>

            {hangingOn.length > 0 && (
              <Section title={t('Кто на этот шлюз завязан', 'Who is tied to this gate')} icon={<ShieldAlert size={11} />} count={hangingOn.length}
                caption={t('Связи контроля, направленные внутрь слоя: другая сторона сама называет эту юрисдикцию или ведомство тем, от чего зависит.', 'Control links pointing into the layer: the other side itself names this jurisdiction or agency as something it depends on.')}>
                {hangingOn.map(e => (
                  <GateRow key={e.id} e={e} entityById={entityById} onOpenEntity={onOpenEntity} side="source" />
                ))}
              </Section>
            )}
          </>
        )}

        {/* ══ ORBIT / NUCLEUS: concentration first ══ */}
        {!isGate && (
          <Section title={t('Концентрация', 'Concentration')} icon={<Layers size={11} />}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px' }}>
              <span style={{
                padding: '4px 10px', borderRadius: 6, background: conc.color + '18',
                border: `1px solid ${conc.color}55`, color: conc.color,
                fontSize: 11, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.05em',
              }}>{conc.label}</span>
              <span style={{ fontSize: 11, color: 'var(--cf-text5)', fontFamily: MONO }}>
                HHI {layer.concentration?.hhi ?? '—'} · {members.length} {plural(members.length, ['участник', 'участника', 'участников'], ['member', 'members'])}
              </span>
            </div>
            <Note>{conc.blurb}</Note>
          </Section>
        )}

        {/* Who is in this layer — on both planes, but worded differently */}
        <Section title={isGate ? t('Кто стоит на этом шлюзе', 'Who stands on this gate') : t('Кто контролирует слой', 'Who controls the layer')}
          icon={<Layers size={11} />} count={members.length}>
          {!members.length && <Note>{t('В этом слое пока нет сущностей — движок его ещё не наполнил.', 'No entities in this layer yet — the engine has not populated it.')}</Note>}
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
                  <span title={t('Сущность живёт и в других слоях — на карте это одна плитка', 'The entity lives in other layers too — on the map it is a single tile')}
                    style={{ marginLeft: 6, fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700 }}>
                    {n.segments.filter(s => s.layer !== layer.id).map(s => s.layerLabel || s.layer).join(' · ')}
                  </span>
                )}
              </span>
              {/* The tag is the SECTOR, not the role. Inside one layer the role
                  is almost always the same word for every member («ОПЕРАТ.» seven
                  times over), so it separates nothing; the sector is exactly what
                  distinguishes them — «ИИ для бизнеса» vs «Отраслевой ИИ». The role
                  stays on the hover title, where it costs no width. */}
              <span title={n.roleMeta?.label ? t(`Роль: ${n.roleMeta.label}`, `Role: ${n.roleMeta.label}`) : undefined}
                style={{
                  maxWidth: 108, fontSize: 9.5, color: 'var(--cf-text6)',
                  flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                {n.sectorLabel}
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

        {/* Bottleneck and second source — only meaningful for a market */}
        {!isGate && lead && (
          <Section title={t('На ком держится слой', 'What the layer rests on')} icon={<AlertTriangle size={11} />}>
            <div style={{ padding: '0 16px', fontSize: 12, color: 'var(--cf-text2)', lineHeight: 1.55 }}>
              <b style={{ color: 'var(--cf-text0)' }}>{lead.n.name}</b> — {t('критичность', 'criticality')} {lead.c} {t('в этом слое', 'in this layer')}
              {gap != null && second
                ? t(`, следующий (${second.n.name}) отстаёт на ${gap} ${plural(gap, ['пункт', 'пункта', 'пунктов'])}.`,
                     `, the next one (${second.n.name}) trails by ${gap} ${gap === 1 ? 'point' : 'points'}.`)
                : t(' — единственная сущность слоя.', ' — the only entity in the layer.')}
              {lead.n.whatBreaksIt && (
                <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--cf-text4)' }}>
                  {/* Only the FIRST letter is lowered — `toLowerCase()` on the
                      whole sentence turned "HBM у NVIDIA" into "hbm у nvidia". */}
                  {t('Сломает позицию', 'What breaks the position')}: {uncapitalise(lead.n.whatBreaksIt)}
                </div>
              )}
            </div>
          </Section>
        )}

        {!isGate && (
          <Section title={t('Есть ли второй источник', 'Is there a second source')} icon={<GitBranch size={11} />}>
            {secondSource ? (
              <div style={{ padding: '0 16px', fontSize: 12, color: 'var(--cf-text2)', lineHeight: 1.55 }}>
                {t('Да', 'Yes')} — <button onClick={() => onOpenEntity(secondSource.entity.id)} style={inlineBtn}>{secondSource.entity.name}</button>
                {' '}{t('работает с', 'works with')}{' '}
                {secondSource.shared.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && ', '}
                    <button onClick={() => onOpenEntity(c.id)} style={inlineBtn}>{c.name}</button>
                  </span>
                ))}
                {' '}{t('— теми же контрагентами, что и лидер слоя. Переключение возможно, но по цене времени, а не мгновенно.',
                         '— the same counterparties as the layer leader. Switching is possible, but it costs time rather than happening instantly.')}
              </div>
            ) : (
              <Note>
                {lead
                  ? t('Нет: ни одна другая сущность слоя не работает с теми же контрагентами. Отказ лидера останавливает всё, что выше.',
                       'No: no other entity in the layer works with the same counterparties. If the leader fails, everything above it stops.')
                  : t('Слой пуст — вопрос не имеет смысла.', 'The layer is empty — the question does not apply.')}
              </Note>
            )}
          </Section>
        )}

        {/* What changed */}
        <Section title={t('Что изменилось за месяц', 'What changed this month')} icon={<History size={11} />}>
          {!changes.length && <Note>{t('За этот прогон в слое ничего не менялось.', 'Nothing in the layer changed in this run.')}</Note>}
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
      </div>
    </aside>
  );
}

/** One gated relation: who is shut out of what, how hard, and with what risk. */
function GateRow({ e, entityById, onOpenEntity, side }) {
  const t = useT();
  const other = entityById.get(side === 'target' ? e.targetId : e.sourceId);
  if (!other) return null;
  return (
    <div style={{ padding: '8px 16px', borderTop: '1px solid var(--cf-border-hair)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 8.5, fontFamily: MONO, fontWeight: 700, color: e.color, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
          {e.verb || e.typeLabel}
        </span>
        <button onClick={() => onOpenEntity(other.id)} style={{ ...inlineBtn, flex: 1, minWidth: 0, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {other.name}
        </button>
        {e.riskMeta && e.risk?.level !== 'low' && (
          <span title={e.risk?.mitigation ? t(`Чем крыть: ${e.risk.mitigation}`, `How to cover it: ${e.risk.mitigation}`) : e.riskMeta.blurb} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 8.5, fontFamily: MONO, color: e.riskMeta.color, cursor: 'help', flexShrink: 0,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: e.riskMeta.color }} />
            {e.riskTimelineLabel || e.riskMeta.label}
          </span>
        )}
        <span style={{ width: 22, fontSize: 10, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text4)', textAlign: 'right', flexShrink: 0 }}>
          {e.strength}
        </span>
      </div>
      {e.note && (
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--cf-text5)', lineHeight: 1.5 }}>{e.note}</div>
      )}
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────
const inlineBtn = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  color: 'var(--cf-accent)', fontSize: 'inherit', fontWeight: 700, fontFamily: 'inherit',
};

/**
 * Is anyone else in this layer working with the same counterparties as the
 * leader? Purely graph-derived — no judgement, no list of "known alternatives".
 */
function findSecondSource(lead, members, edges, entityById) {
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
        entity: n,
        shared: [...new Set(shared)].slice(0, 3).map(id => ({ id, name: entityById.get(id)?.name || id })),
      };
    }
  }
  return null;
}

/** The engine's changelog, filtered down to this layer. */
function collectChanges(changelog, layer, entityById) {
  if (!changelog) return [];
  const out = [];
  const touches = (id) => {
    const n = entityById.get(id);
    return n ? n.segments.some(s => s.layer === layer.id) : false;
  };
  const LABEL = () => (getLang() === 'en'
  ? { added: 'ADDED', removed: 'REMOVED', changed: 'CHANGED' }
  : { added: 'ПОЯВИЛОСЬ', removed: 'УБРАНО', changed: 'ИЗМЕНИЛОСЬ' });
  ['added', 'removed', 'changed'].forEach(kind => {
    (changelog[kind] || []).forEach(item => {
      const name = entityById.get(item.id)?.name;
      // Entity entries filter by layer; edge entries have no layer of their
      // own, so they surface when either endpoint id is a member of this layer.
      const relevant = item.kind === 'entity'
        ? touches(item.id)
        : String(item.id).split('__').slice(0, 2).some(touches);
      if (!relevant) return;
      out.push({
        kind, kindLabel: LABEL()[kind],
        text: kind === 'changed'
          ? `${name || item.id}: ${item.field} ${item.from} → ${item.to}`
          : `${name || item.id} — ${item.why || ''}`,
      });
    });
  });
  return out;
}

function Section({ title, icon, count, caption, children }) {
  return (
    <div style={{ padding: '13px 0 10px', borderBottom: '1px solid var(--cf-border-hair)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: `0 16px ${caption ? 5 : 9}px`,
        fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {icon}{title}
        {count != null && <span style={{ color: 'var(--cf-text8)' }}>· {count}</span>}
      </div>
      {caption && (
        <div style={{ padding: '0 16px 9px', fontSize: 10.5, color: 'var(--cf-text6)', lineHeight: 1.5 }}>
          {caption}
        </div>
      )}
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

// Russian has three plural forms, English two, and the English pair was being
// dropped: every call site already passed it, the signature just never took
// it. In English mode the island captions read «7 участников». A plain
// helper — it reads the language mirror, never a hook (i18n lint, rule 5).
function plural(n, [one, few, many], en) {
  const a = Math.abs(Math.round(n));
  if (en && getLang() === 'en') return a === 1 ? en[0] : en[1];
  const d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}
