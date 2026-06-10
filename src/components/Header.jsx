// Sticky top bar visible across all modes.
// Left: "AB Investment" wordmark (also clickable to return home).
// Right: segmented mode switcher [Home | Tracker | Research].

export default function Header({ mode, onChangeMode }) {
  return (
    <div
      style={{
        background: '#0A0A0B',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Brand mark — clicking returns home */}
        <button
          onClick={() => onChangeMode('home')}
          title="Back to home"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 10px 4px 4px',
            fontSize: 14,
            fontWeight: 700,
            color: '#fafafa',
            letterSpacing: '-0.01em',
            borderRadius: 6,
            transition: 'opacity 120ms',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          AB Investment
        </button>

        {/* Segmented mode switcher */}
        <ModeSwitcher mode={mode} onChange={onChangeMode} />
      </div>
    </div>
  );
}

function ModeSwitcher({ mode, onChange }) {
  const options = [
    { id: 'home', label: 'Home' },
    { id: 'tracker', label: 'Tracker' },
    { id: 'research', label: 'Research' },
  ];

  return (
    <div
      role="tablist"
      aria-label="App mode"
      style={{
        display: 'inline-flex',
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: 8,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const active = mode === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (mode !== opt.id) onChange(opt.id);
            }}
            style={{
              padding: '6px 14px',
              fontSize: 11,
              fontFamily: 'ui-monospace, monospace',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: active ? '#27272a' : 'transparent',
              color: active ? '#fafafa' : '#71717a',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 160ms',
              boxShadow: active
                ? '0 1px 2px rgba(0,0,0,0.4), inset 0 0 0 1px #3f3f46'
                : 'none',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = '#d4d4d8';
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = '#71717a';
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
