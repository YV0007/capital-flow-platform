// Sticky top bar visible across all modes, styled to match the home landing:
// glassy blurred bar, gradient wordmark, accent pill switcher.
// Left: "AB Investment" wordmark (clickable — returns home).
// Right: pill mode switcher [Главная | Трекер | Исследования].

import { useState } from 'react';

const MONO = 'ui-monospace, monospace';
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

const MODES = [
  { id: 'home', label: 'Главная', accent: '#38BDF8' },
  { id: 'tracker', label: 'Трекер', accent: '#9A8FD2' },
  { id: 'research', label: 'Исследования', accent: '#8E9BE6' },
];

export default function Header({ mode, onChangeMode }) {
  return (
    <div
      style={{
        background: 'rgba(9, 9, 11, 0.72)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          padding: '11px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Brand mark — clicking returns home */}
        <button
          onClick={() => onChangeMode('home')}
          title="На главную"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 10px 4px 4px',
            fontFamily: 'inherit',
            transition: 'opacity 140ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'linear-gradient(135deg, #38BDF8 0%, #2FD9C4 100%)',
              boxShadow: '0 0 8px rgba(56,189,248,0.55)',
            }}
          />
          <span
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              letterSpacing: '-0.015em',
              background: 'linear-gradient(180deg, #fafafa 20%, #a1a1aa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AB Investment
          </span>
        </button>

        {/* Pill mode switcher */}
        <nav role="tablist" aria-label="Разделы" style={{ display: 'inline-flex', gap: 6 }}>
          {MODES.map((opt) => (
            <ModePill
              key={opt.id}
              opt={opt}
              active={mode === opt.id}
              onClick={() => { if (mode !== opt.id) onChangeMode(opt.id); }}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}

function ModePill({ opt, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 15px',
        borderRadius: 999,
        cursor: 'pointer',
        font: 'inherit',
        fontSize: 11,
        fontFamily: MONO,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.09em',
        background: active
          ? opt.accent + '16'
          : hovered
            ? 'rgba(255,255,255,0.05)'
            : 'transparent',
        color: active ? opt.accent : hovered ? '#d4d4d8' : '#71717a',
        border: `1px solid ${active ? opt.accent + '55' : hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`,
        transition: `all 200ms ${EASE}`,
        transform: hovered && !active ? 'translateY(-1px)' : 'none',
      }}
    >
      {active && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: opt.accent,
            boxShadow: `0 0 7px ${opt.accent}`,
            flexShrink: 0,
          }}
        />
      )}
      {opt.label}
    </button>
  );
}
