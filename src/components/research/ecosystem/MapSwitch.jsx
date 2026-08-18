// MapSwitch — the segmented «Потоки | Экосистема» control.
//
// Rendered INSIDE each map's own top bar (both accept it as a `mapSwitch`
// node), but owned by CapitalFlowSection one level up. That split is the point:
// the switch is shared chrome, the state behind it is not. Flipping it unmounts
// one map and mounts the other, so filters, panels, selections and searches
// can never leak across.

const MONO = 'ui-monospace, monospace';

export const MAPS = [
  { key: 'flows',     label: 'Потоки',    hint: 'Куда пошли деньги — события с датой, обновление раз в неделю' },
  { key: 'ecosystem', label: 'Экосистема', hint: 'Как отрасль устроена и кто её держит — стоящие позиции, обновление раз в месяц' },
];

export default function MapSwitch({ value, onChange }) {
  return (
    <div role="tablist" aria-label="Карта" style={{
      display: 'inline-flex', padding: 2, gap: 2,
      background: 'var(--cf-surface2)',
      border: '1px solid var(--cf-border)', borderRadius: 9,
      flexShrink: 0,
    }}>
      {MAPS.map(m => {
        const on = value === m.key;
        return (
          <button key={m.key} role="tab" aria-selected={on}
            onClick={() => onChange(m.key)} title={m.hint}
            style={{
              padding: '5px 11px',
              background: on ? 'var(--cf-accent-bg)' : 'transparent',
              border: `1px solid ${on ? 'var(--cf-accent-bd)' : 'transparent'}`,
              borderRadius: 7, cursor: 'pointer',
              color: on ? 'var(--cf-accent)' : 'var(--cf-text5)',
              fontSize: 10, fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              whiteSpace: 'nowrap', transition: 'all 130ms',
            }}
            onMouseEnter={(e) => { if (!on) e.currentTarget.style.color = 'var(--cf-text2)'; }}
            onMouseLeave={(e) => { if (!on) e.currentTarget.style.color = 'var(--cf-text5)'; }}>
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
