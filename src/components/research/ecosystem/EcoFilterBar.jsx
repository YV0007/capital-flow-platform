// EcoFilterBar — the ecosystem map's filter drawer. Presentational; every
// semantic lives in EcosystemMap.
//
// Filter semantics:
//   · Роль · Слой · Фаза select ENTITIES.
//   · Хребет · Тип связи · Риск select LINKS.
//   · Порог существенности is a link floor, default 20 — the ONLY control here
//     that is a display choice rather than a question. Everything is in the
//     file; an entity's own panel always lists every relation, whatever this
//     slider says.
//
// THE HREBET IS THE PRIMARY SWITCH and the edge type is secondary INSIDE it.
// With five spines and thirty-one types, a flat list of types is a wall nobody
// reads, and the five spines are the actual question: is this delivery, money,
// a lock, a gate or a rival. So types are grouped under their spine, and
// selecting a spine narrows which type chips are even offered.
//
// There are a lot of filters now, so they wrap in one column with a running
// «показано N из M» at the top — otherwise you lose track of what is hidden.

import { X, RotateCcw } from 'lucide-react';
import {
  ROLE_META, SPINE_META, EDGE_TYPE_META, PHASE_META, RISK_META, DEFAULT_MIN_STRENGTH,
} from '../../../data/aiEcosystemNetwork.js';
import { useT } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';

export default function EcoFilterBar({
  topInset = 0, layers,
  roles, onToggleRole,
  spines, onToggleSpine,
  types, onToggleType, typesPresent,
  layerSel, onToggleLayer,
  phases, onTogglePhase, phasesPresent,
  risks, onToggleRisk, risksPresent,
  pivotsOnly, onTogglePivotsOnly, pivotCount,
  minStrength, onMinStrength,
  shownEntities, totalEntities, shownEdges, totalEdges,
  activeCount, onReset, onClose,
}) {
  const t = useT();
  // Type chips are offered only for the spines currently in play — otherwise
  // the section is thirty-one chips long and nobody reads it.
  const typeEntries = Object.entries(EDGE_TYPE_META)
    .filter(([k, v]) => typesPresent?.[k] && (!spines.size || spines.has(v.spine)))
    .sort((a, b) => a[1].order - b[1].order);

  return (
    <div style={{
      position: 'absolute', top: topInset, left: 0, zIndex: 27,
      width: 330, maxHeight: `calc(100% - ${topInset + 24}px)`, overflowY: 'auto',
      background: 'var(--cf-panel)',
      borderRight: '1px solid var(--cf-border)',
      borderBottom: '1px solid var(--cf-border)',
      borderBottomRightRadius: 12,
      backdropFilter: 'blur(10px)',
      boxShadow: '18px 0 50px -22px var(--cf-shadow)',
      animation: 'cfmDrop 180ms ease-out',
      padding: '12px 14px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>{t('Фильтры', 'Filters')}{activeCount ? ` · ${activeCount}` : ''}</span>
        <div style={{ flex: 1 }} />
        {activeCount > 0 && (
          <button onClick={onReset} title={t('Сбросить фильтры', 'Reset the filters')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 7px',
              background: 'var(--cf-surface2)', border: '1px solid var(--cf-border)', borderRadius: 5,
              color: 'var(--cf-text4)', fontSize: 9, fontFamily: MONO, fontWeight: 600, cursor: 'pointer',
            }}>
            <RotateCcw size={9} /> {t('Сброс', 'Reset')}
          </button>
        )}
        <button onClick={onClose} title={t('Закрыть', 'Close')}
          style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 2, lineHeight: 0 }}>
          <X size={14} />
        </button>
      </div>

      {/* What the current stack of filters actually leaves on screen. With six
          groups it is very easy to hide most of the map without noticing. */}
      <div style={{
        marginBottom: 13, padding: '6px 8px', borderRadius: 6,
        background: 'var(--cf-surface2)', border: '1px solid var(--cf-border)',
        fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-text4)', lineHeight: 1.6,
      }}>
        Показано <b style={{ color: 'var(--cf-text1)' }}>{shownEntities}</b> из {totalEntities} сущностей
        <br />
        Показано <b style={{ color: 'var(--cf-text1)' }}>{shownEdges}</b> из {totalEdges} связей
      </div>

      {/* ── Охват сети — ключевые узлы или всё ──────────────────────────── */}
      {onTogglePivotsOnly && (
        <Group title={t('Охват сети', 'Network scope')} hint={t('Ключевые узлы — центры, вокруг которых собрана сеть, — или вся сеть целиком, вместе с остальными участниками.', 'The key nodes the network is built around, or the whole network including everyone else.')}>
          <Chip on={!pivotsOnly} color="#8E9BE6" onClick={() => pivotsOnly && onTogglePivotsOnly()}
            title={t('Показать всю сеть — ключевые узлы и всех остальных', 'Show the whole network — key nodes and everyone else')} wide>
            {t('Вся сеть', 'Whole network')}
          </Chip>
          <Chip on={pivotsOnly} color="#FDE047" onClick={() => !pivotsOnly && onTogglePivotsOnly()}
            title={t('Оставить только ключевые узлы — центры сети', 'Keep only the key nodes — the centres of the network')} wide>
            {t('Только ключевые', 'Key only')}{pivotCount ? <Count>{pivotCount}</Count> : null}
          </Chip>
        </Group>
      )}

      {/* ── Хребет — ПЕРВИЧНЫЙ переключатель ────────────────────────────── */}
      <Group title={t('Хребет', 'Spine')} hint={t('Пять механик власти. Это первый вопрос к карте: физика, деньги, барьер, шлюз или соперничество.', 'Five mechanics of power. This is the first question to ask the map: physics, money, moat, gate or rivalry.')}>
        {Object.entries(SPINE_META)
          .sort((a, b) => a[1].order - b[1].order)
          .map(([k, v]) => (
            <Chip key={k} on={spines.has(k)} color={v.color} onClick={() => onToggleSpine(k)} title={v.blurb} wide>
              {v.label}
            </Chip>
          ))}
      </Group>

      {/* ── Тип связи — ВТОРИЧНЫЙ, внутри выбранных хребтов ─────────────── */}
      <Group title={t('Тип связи', 'Link type')}
        hint={spines.size ? t('Внутри выбранных хребтов.', 'Within the selected spines.') : t('Все типы карты. Выберите хребет выше, чтобы список стал коротким.', 'Every type on the map. Pick a spine above to shorten the list.')}>
        {typeEntries.map(([k, v]) => (
          <Chip key={k} on={types.has(k)} color={v.color} onClick={() => onToggleType(k)} title={v.blurb}>
            {v.label} <Count>{typesPresent[k]}</Count>
          </Chip>
        ))}
        {!typeEntries.length && <Empty>{t('Под выбранные хребты типов не нашлось.', 'No types match the selected spines.')}</Empty>}
      </Group>

      {/* ── Риск связи ──────────────────────────────────────────────────── */}
      <Group title={t('Риск связи', 'Link risk')} hint={t('Что случится, если зависимость порвётся, и насколько это фатально.', 'What happens if the dependency breaks, and how fatal that is.')}>
        {Object.entries(RISK_META)
          .sort((a, b) => a[1].order - b[1].order)
          .filter(([k]) => risksPresent?.[k])
          .map(([k, v]) => (
            <Chip key={k} on={risks.has(k)} color={v.color} onClick={() => onToggleRisk(k)} title={v.blurb}>
              {v.label} <Count>{risksPresent[k]}</Count>
            </Chip>
          ))}
      </Group>

      {/* ── Роль ────────────────────────────────────────────────────────── */}
      <Group title={t('Роль', 'Role')} hint={t('Кто это в отрасли: производитель, платформа, оператор, спрос, капитал или государство.', 'What this is in the industry: a maker, a platform, an operator, demand, capital or the state.')}>
        {Object.entries(ROLE_META)
          .sort((a, b) => a[1].order - b[1].order)
          .map(([k, v]) => (
            <Chip key={k} on={roles.has(k)} color={v.color} onClick={() => onToggleRole(k)} title={v.blurb}>
              {v.label}
            </Chip>
          ))}
      </Group>

      {/* ── Фаза ────────────────────────────────────────────────────────── */}
      <Group title={t('Фаза', 'Phase')} hint={t('Где позиция в своей собственной жизни — складывается, держится или уходит.', 'Where the position sits in its own life — forming, holding or fading.')}>
        {Object.entries(PHASE_META)
          .sort((a, b) => a[1].order - b[1].order)
          .filter(([k]) => phasesPresent?.[k])
          .map(([k, v]) => (
            <Chip key={k} on={phases.has(k)} color={v.color} onClick={() => onTogglePhase(k)} title={v.blurb}>
              {v.label} <Count>{phasesPresent[k]}</Count>
            </Chip>
          ))}
      </Group>

      {/* ── Слой ────────────────────────────────────────────────────────── */}
      <Group title={t('Слой', 'Layer')} hint={t('Место в стеке. Сущность в нескольких слоях проходит по любому из них.', 'Its place in the stack. An entity spanning several layers passes on any of them.')}>
        {layers.map(l => (
          <Chip key={l.id} on={layerSel.has(l.id)} color={l.bandColor} onClick={() => onToggleLayer(l.id)}
            title={`${l.label} · ${l.caption} · ${l.planeMeta?.blurb || ''}`} dim={!l.entityCount}>
            {l.id} {l.label} <Count>{l.entityCount}</Count>
          </Chip>
        ))}
      </Group>

      <div style={{ marginTop: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 6,
          fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {t('Порог существенности', 'Materiality threshold')}
          <span style={{ color: 'var(--cf-accent)', fontWeight: 700 }}>{minStrength}</span>
          {minStrength !== DEFAULT_MIN_STRENGTH && (
            <button onClick={() => onMinStrength(DEFAULT_MIN_STRENGTH)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--cf-text7)', fontSize: 9, fontFamily: MONO }}>
              → {DEFAULT_MIN_STRENGTH}
            </button>
          )}
        </div>
        <input type="range" min={0} max={100} step={5}
          value={minStrength} onChange={(e) => onMinStrength(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--cf-accent)' }} />
        <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', lineHeight: 1.5, marginTop: 5 }}>
          {t(`Существенность — насколько связь важна ДЛЯ ПОЛУЧАТЕЛЯ, 0–100. На карте по умолчанию видно
          от ${DEFAULT_MIN_STRENGTH}; в панели сущности список связей всегда полный.`,
             `Materiality is how much a link matters TO THE RECIPIENT, 0–100. The map shows ${DEFAULT_MIN_STRENGTH}
          and above by default; the entity panel always lists every link.`)}
        </div>
      </div>
    </div>
  );
}

function Group({ title, hint, children }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{
        fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
      }}>{title}</div>
      {hint && <div style={{ fontSize: 9.5, color: 'var(--cf-text7)', lineHeight: 1.45, marginBottom: 6 }}>{hint}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{children}</div>
    </div>
  );
}

function Chip({ children, on, color, onClick, title, dim, wide }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: wide ? '5px 10px' : '4px 8px',
        background: on ? color + '22' : 'var(--cf-surface2)',
        border: `1px solid ${on ? color + '77' : 'var(--cf-border)'}`,
        borderRadius: 6, cursor: 'pointer',
        color: on ? color : (dim ? 'var(--cf-text8)' : 'var(--cf-text3)'),
        fontSize: wide ? 10.5 : 10, fontWeight: on && wide ? 700 : 600, whiteSpace: 'nowrap',
        opacity: dim && !on ? 0.55 : 1,
        transition: 'all 120ms',
      }}>
      <span style={{ width: 6, height: 6, borderRadius: 2, background: color, flexShrink: 0, opacity: on ? 1 : 0.55 }} />
      {children}
    </button>
  );
}

function Count({ children }) {
  return <span style={{ fontFamily: MONO, fontSize: 9, color: 'var(--cf-text7)' }}>{children}</span>;
}

function Empty({ children }) {
  return <span style={{ fontSize: 9.5, color: 'var(--cf-text7)', lineHeight: 1.5 }}>{children}</span>;
}
