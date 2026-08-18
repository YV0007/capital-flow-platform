// EcoFilterBar — the ecosystem map's filter drawer. Presentational; every
// semantic lives in EcosystemMap.
//
// Filter semantics, deliberately simpler than the flow map's:
//   · Роль and Слой select COMPANIES.
//   · Хребет and Тип связи select LINKS.
//   · Порог существенности is a link floor, default 20 — and it is the ONLY
//     control here that is a display choice rather than a question. Everything
//     is in the file; a node's own panel always lists every relation, whatever
//     this slider says.

import { X, RotateCcw } from 'lucide-react';
import { ROLE_META, SPINE_META, EDGE_TYPE_META, DEFAULT_MIN_STRENGTH } from '../../../data/ecosystemMap.js';

const MONO = 'ui-monospace, monospace';

export default function EcoFilterBar({
  topInset = 0, layers,
  roles, onToggleRole,
  spines, onToggleSpine,
  types, onToggleType, typesPresent,
  layerSel, onToggleLayer,
  minStrength, onMinStrength,
  activeCount, onReset, onClose,
}) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{
          fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>Фильтры{activeCount ? ` · ${activeCount}` : ''}</span>
        <div style={{ flex: 1 }} />
        {activeCount > 0 && (
          <button onClick={onReset} title="Сбросить фильтры"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 7px',
              background: 'var(--cf-surface2)', border: '1px solid var(--cf-border)', borderRadius: 5,
              color: 'var(--cf-text4)', fontSize: 9, fontFamily: MONO, fontWeight: 600, cursor: 'pointer',
            }}>
            <RotateCcw size={9} /> Сброс
          </button>
        )}
        <button onClick={onClose} title="Закрыть"
          style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 2, lineHeight: 0 }}>
          <X size={14} />
        </button>
      </div>

      <Group title="Роль в стеке" hint="Кто это в отрасли — производитель, собственник, капитал, спрос или платформа.">
        {Object.entries(ROLE_META).map(([k, v]) => (
          <Chip key={k} on={roles.has(k)} color={v.color} onClick={() => onToggleRole(k)} title={v.blurb}>
            {v.label}
          </Chip>
        ))}
      </Group>

      <Group title="Хребет" hint="Физическая цепочка против цепочки владения и денег.">
        {Object.entries(SPINE_META).map(([k, v]) => (
          <Chip key={k} on={spines.has(k)} color={v.color} onClick={() => onToggleSpine(k)} title={v.blurb}>
            {v.label}
          </Chip>
        ))}
      </Group>

      <Group title="Тип связи">
        {Object.entries(EDGE_TYPE_META)
          .filter(([k]) => typesPresent?.[k])
          .sort((a, b) => a[1].order - b[1].order)
          .map(([k, v]) => (
            <Chip key={k} on={types.has(k)} color={v.color} onClick={() => onToggleType(k)} title={v.blurb}>
              {v.label} <Count>{typesPresent[k]}</Count>
            </Chip>
          ))}
      </Group>

      <Group title="Слой" hint="Кольцо стека. Компания в нескольких слоях проходит по любому из них.">
        {layers.map(l => (
          <Chip key={l.id} on={layerSel.has(l.id)} color={l.bandColor} onClick={() => onToggleLayer(l.id)}
            title={`${l.label} · ${l.caption}`} dim={!l.nodeCount}>
            {l.id} {l.label} <Count>{l.nodeCount}</Count>
          </Chip>
        ))}
      </Group>

      <div style={{ marginTop: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 6,
          fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          Порог существенности
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
          Существенность — насколько связь важна ДЛЯ ПОЛУЧАТЕЛЯ, 0–100. На карте по умолчанию видно
          от {DEFAULT_MIN_STRENGTH}; в панели компании список связей всегда полный.
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

function Chip({ children, on, color, onClick, title, dim }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px',
        background: on ? color + '22' : 'var(--cf-surface2)',
        border: `1px solid ${on ? color + '77' : 'var(--cf-border)'}`,
        borderRadius: 6, cursor: 'pointer',
        color: on ? color : (dim ? 'var(--cf-text8)' : 'var(--cf-text3)'),
        fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
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
