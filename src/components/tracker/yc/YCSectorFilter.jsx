// Horizontal multi-select sector chips. Scrollable on narrow viewports.
import React from 'react';
import { iconForSector } from './yc-sector-colors.js';

export default function YCSectorFilter({ sectors, active, onToggle, onClear }) {
  if (!sectors || sectors.length === 0) return null;

  return (
    <div
      className="yc-sector-scroll"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        overflowX: 'auto', paddingBottom: 4,
        borderBottom: '1px solid #18181b',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`
        .yc-sector-scroll::-webkit-scrollbar { display: none; height: 0; width: 0; }
      `}</style>
      <div style={{
        fontSize: 10, color: '#71717a',
        fontFamily: 'ui-monospace,monospace',
        letterSpacing: '0.12em', fontWeight: 700,
        flexShrink: 0, marginRight: 4,
      }}>
        СЕКТОР
      </div>
      {sectors.map(s => {
        const isActive = active.has(s);
        const Icon = iconForSector(s);
        return (
          <button
            key={s}
            onClick={() => onToggle(s)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 12px 6px 10px',
              fontSize: 11.5,
              fontFamily: 'ui-monospace,monospace',
              background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: `1px solid ${isActive ? '#52525b' : '#27272a'}`,
              borderRadius: 999,
              color: isActive ? '#fafafa' : '#a1a1aa',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              font: 'inherit',
              transition: 'all 140ms',
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.borderColor = '#3f3f46';
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.borderColor = '#27272a';
            }}
          >
            {Icon && <Icon size={12} style={{ flexShrink: 0 }} />}
            {s}
          </button>
        );
      })}
      {active.size > 0 && (
        <button
          onClick={onClear}
          style={{
            padding: '6px 10px',
            fontSize: 10.5,
            fontFamily: 'ui-monospace,monospace',
            background: 'transparent',
            border: 'none',
            color: '#71717a',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            letterSpacing: '0.08em', fontWeight: 700,
            marginLeft: 4,
            font: 'inherit',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fafafa'}
          onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
        >
          ОЧИСТИТЬ
        </button>
      )}
    </div>
  );
}
