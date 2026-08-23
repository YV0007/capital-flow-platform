// MapSwitch — the «Потоки | Экосистема | Фонды» control.
//
// Rendered INSIDE each view's own top bar (all three accept it as a `mapSwitch`
// node), but owned by CapitalFlowSection one level up. That split is the point:
// the switch is shared chrome, the state behind it is not. Flipping it unmounts
// one view and mounts the next, so filters, panels, selections and searches
// can never leak across.
//
// The third entry is NOT a third map. Трекер фондов renders a fixed set of
// independent funds and their books — no edges, no graph — and lives in this
// dropdown only because that is where the user goes to change section.
//
// A dropdown, not a segmented pair: the top bar carries enough controls of its
// own, and a two-line label ("Экосистема ИИ") made the segmented control wide
// enough to crowd the title next to it.

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useT } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';

export const MAPS = [
  { key: 'flows', ru: 'Потоки', en: 'Flows',
    hintRu: 'Куда пошли деньги — события с датой, обновление раз в неделю',
    hintEn: 'Where the money went — dated events, refreshed weekly' },
  { key: 'ecosystem', ru: 'Экосистема ИИ', en: 'AI ecosystem',
    hintRu: 'Сеть ключевых узлов ИИ-инфраструктуры: влияние, подграфы, точки отказа — стоящие позиции, обновление раз в месяц',
    hintEn: 'The network of key AI-infrastructure nodes: influence, subgraphs, points of failure — standing positions, refreshed monthly' },
  { key: 'funds', ru: 'Трекер фондов', en: 'Fund tracker',
    hintRu: 'Четырнадцать фондов и их книги: позиции, движение за период, доли 13D, шорты — без связей между фондами',
    hintEn: 'Fourteen funds and their books: positions, the period\'s moves, 13D stakes, shorts — with no edges between funds' },
];

export default function MapSwitch({ value, onChange }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const raw = MAPS.find(m => m.key === value) || MAPS[0];
  const current = { ...raw, label: t(raw.ru, raw.en) };

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h, true);
    return () => document.removeEventListener('mousedown', h, true);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} title={t('Переключить карту', 'Switch map')} aria-haspopup="listbox" aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 9px 5px 11px',
          background: 'var(--cf-surface2)',
          border: `1px solid ${open ? 'var(--cf-text9)' : 'var(--cf-border)'}`, borderRadius: 8,
          color: 'var(--cf-text1)', cursor: 'pointer',
          fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
        }}>
        {current.label}
        <ChevronDown size={11} style={{ color: 'var(--cf-text6)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 130ms' }} />
      </button>
      {open && (
        <div role="listbox" aria-label={t('Карта', 'Map')} style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50, width: 268,
          background: 'var(--cf-popover)', border: '1px solid var(--cf-border)', borderRadius: 9,
          overflow: 'hidden', boxShadow: '0 16px 40px -12px var(--cf-shadow)',
        }}>
          {MAPS.map(m => {
            const on = value === m.key;
            const label = t(m.ru, m.en);
            const hint = t(m.hintRu, m.hintEn);
            return (
              <button key={m.key} role="option" aria-selected={on}
                onClick={() => { onChange(m.key); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                  padding: '8px 11px', border: 'none', borderBottom: '1px solid var(--cf-border-hair)',
                  background: on ? 'var(--cf-accent-bg)' : 'transparent',
                }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--cf-hover)'; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: on ? 'var(--cf-accent)' : 'var(--cf-text1)',
                }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--cf-text5)', lineHeight: 1.4, marginTop: 3 }}>{hint}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
