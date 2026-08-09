// Sticky top bar visible across all modes, styled to match the home landing:
// glassy blurred bar, gradient wordmark, accent pill switcher, theme toggle.
// Left: "AB Investment" wordmark (clickable — returns home).
// Right: pill mode switcher [Главная | Трекер | Исследования] + theme toggle.
// `theme` ('dark' | 'light') restyles the chrome; `onToggleTheme` shows the
// sun/moon toggle (passed only where the light theme is supported — home).

import { useState } from 'react';

const MONO = 'ui-monospace, monospace';
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

const MODES = [
  { id: 'home', label: 'Главная', accent: '#38BDF8' },
  { id: 'tracker', label: 'Трекер', accent: '#9A8FD2' },
  { id: 'research', label: 'Исследования', accent: '#8E9BE6' },
];

const CHROME = {
  dark: {
    bg: 'rgba(9, 9, 11, 0.72)',
    border: 'rgba(255,255,255,0.06)',
    wordmark: 'linear-gradient(180deg, #fafafa 20%, #a1a1aa 100%)',
    pillIdle: '#71717a',
    pillHover: '#d4d4d8',
    pillHoverBg: 'rgba(255,255,255,0.05)',
    pillBorder: 'rgba(255,255,255,0.07)',
    pillHoverBorder: 'rgba(255,255,255,0.14)',
  },
  light: {
    bg: 'rgba(255, 255, 255, 0.72)',
    border: 'rgba(15,23,42,0.08)',
    wordmark: 'linear-gradient(180deg, #0F172A 20%, #46628A 100%)',
    pillIdle: '#64748B',
    pillHover: '#334155',
    pillHoverBg: 'rgba(15,23,42,0.05)',
    pillBorder: 'rgba(15,23,42,0.10)',
    pillHoverBorder: 'rgba(15,23,42,0.20)',
  },
};

export default function Header({ mode, onChangeMode, theme = 'dark', onToggleTheme }) {
  const c = CHROME[theme] || CHROME.dark;
  return (
    <div
      style={{
        background: c.bg,
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        borderBottom: `1px solid ${c.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 40,
        transition: 'background 300ms',
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
            key={theme} /* remount on theme switch — resetting the background
                           shorthand otherwise drops -webkit-background-clip */
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              letterSpacing: '-0.015em',
              background: c.wordmark,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AB Investment
          </span>
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {/* Pill mode switcher */}
          <nav role="tablist" aria-label="Разделы" style={{ display: 'inline-flex', gap: 6 }}>
            {MODES.map((opt) => (
              <ModePill
                key={opt.id}
                opt={opt}
                chrome={c}
                active={mode === opt.id}
                onClick={() => { if (mode !== opt.id) onChangeMode(opt.id); }}
              />
            ))}
          </nav>

          {/* Theme toggle — only where the light theme is wired up */}
          {onToggleTheme && (
            <ThemeToggle theme={theme} chrome={c} onToggle={onToggleTheme} />
          )}
        </div>
      </div>
    </div>
  );
}

function ModePill({ opt, chrome, active, onClick }) {
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
            ? chrome.pillHoverBg
            : 'transparent',
        color: active ? opt.accent : hovered ? chrome.pillHover : chrome.pillIdle,
        border: `1px solid ${active ? opt.accent + '55' : hovered ? chrome.pillHoverBorder : chrome.pillBorder}`,
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

function ThemeToggle({ theme, chrome, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const dark = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      title={dark ? 'Светлая тема' : 'Тёмная тема'}
      aria-label={dark ? 'Светлая тема' : 'Тёмная тема'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: hovered ? chrome.pillHoverBg : 'transparent',
        color: hovered ? chrome.pillHover : chrome.pillIdle,
        border: `1px solid ${hovered ? chrome.pillHoverBorder : chrome.pillBorder}`,
        transition: `all 200ms ${EASE}`,
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      {dark ? (
        /* sun — switch to light */
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19" />
        </svg>
      ) : (
        /* moon — switch to dark */
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 13.2A8.1 8.1 0 0 1 10.8 4a8.1 8.1 0 1 0 9.2 9.2Z" />
        </svg>
      )}
    </button>
  );
}
