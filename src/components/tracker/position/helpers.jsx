import React, { useState } from 'react';

export const POS_COLORS = {
  red:    '#FF4747',
  yellow: '#FFB800',
  green:  '#00D97E',
  cyan:   '#22D3EE',
  white:  '#FAFAFA',
  dim:    '#71717A',
  dimmer: '#52525B',
  panel:  '#0F0F12',
  panelB: '#141418',
  border: '#27272A',
};

// Inline tooltip helper — "?" badge with hover-explanation
export function Tip({ text }) {
  return (
    <span title={text}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 13, height: 13, borderRadius: '50%',
        background: '#27272a', border: '1px solid #3f3f46',
        color: '#a1a1aa', fontSize: 9, fontWeight: 700,
        marginLeft: 5, cursor: 'help', verticalAlign: 'middle', lineHeight: 1,
      }}>?</span>
  );
}

// Copy-to-clipboard button (small icon)
export function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    try {
      const text = typeof value === 'function' ? value() : value;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(String(text));
      } else {
        const ta = document.createElement('textarea');
        ta.value = String(text);
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  return (
    <button onClick={copy} title={`Copy ${label || 'value'}`}
      style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        padding: 4, marginLeft: 4, color: copied ? POS_COLORS.green : POS_COLORS.dimmer,
        fontSize: 10, fontFamily: 'ui-monospace,monospace', transition: 'color 120ms',
        verticalAlign: 'middle', lineHeight: 1,
      }}
      onMouseEnter={e => { if (!copied) e.currentTarget.style.color = POS_COLORS.cyan; }}
      onMouseLeave={e => { if (!copied) e.currentTarget.style.color = POS_COLORS.dimmer; }}>
      {copied ? '✓' : '⧉'}
    </button>
  );
}

// Reusable field grid (used in accordion expansions)
export function FieldGrid({ items, cols = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 14 }}>
      {items.map(([k, v, opts]) => {
        const missing = v == null || v === '' || v === '—';
        return (
          <div key={k}>
            <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'ui-monospace,monospace' }}>{k}{opts?.tip && <Tip text={opts.tip} />}</div>
            <div style={{
              fontSize: 12, color: missing ? POS_COLORS.dimmer : (opts?.color || '#e4e4e7'),
              fontFamily: 'ui-monospace,monospace', marginTop: 3, wordBreak: 'break-word',
              fontStyle: missing ? 'italic' : 'normal',
            }}>{missing ? '— not provided —' : v}</div>
            {opts?.requestable && missing && opts.onRequest && (
              <button onClick={opts.onRequest}
                style={{
                  marginTop: 4, padding: '3px 8px', fontSize: 10, fontFamily: 'ui-monospace,monospace',
                  background: 'rgba(255,72,0,0.08)', border: '1px solid rgba(255,72,0,0.3)',
                  color: '#fb923c', borderRadius: 4, cursor: 'pointer',
                }}>🔍 Request from lead</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Yes/No/Unknown badge
export function RightBadge({ status }) {
  const map = {
    yes:     { bg: 'rgba(0,217,126,0.12)',  border: 'rgba(0,217,126,0.35)', color: '#00D97E', text: 'YES' },
    no:      { bg: 'rgba(255,71,71,0.12)',  border: 'rgba(255,71,71,0.35)', color: '#FF4747', text: 'NO' },
    unknown: { bg: 'rgba(255,184,0,0.10)',  border: 'rgba(255,184,0,0.30)', color: '#FFB800', text: '?' },
    na:      { bg: '#27272a',               border: '#3f3f46',              color: '#a1a1aa', text: 'N/A' },
  };
  const s = map[status] || map.unknown;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 36, padding: '2px 8px', fontSize: 10, fontWeight: 700,
      background: s.bg, border: '1px solid ' + s.border, color: s.color,
      borderRadius: 4, fontFamily: 'ui-monospace,monospace',
    }}>{s.text}</span>
  );
}

// Accordion row — flat, no card. Clicking expands inline below.
export function AccordionRow({ id, title, icon: Icon, summary, openMap, setOpenMap, children, defaultOpen, severity }) {
  const open = openMap[id] !== undefined ? openMap[id] : !!defaultOpen;
  const toggle = () => setOpenMap(prev => ({ ...prev, [id]: !open }));
  const accent =
    severity === 'red'   ? POS_COLORS.red    :
    severity === 'amber' ? POS_COLORS.yellow :
    severity === 'green' ? POS_COLORS.green  : POS_COLORS.dim;

  return (
    <div style={{ borderBottom: '1px solid ' + POS_COLORS.border }}>
      <button onClick={toggle}
        style={{
          width: '100%', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto',
          gap: 14, alignItems: 'center', padding: '16px 4px',
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}>
        {Icon && <Icon className="w-4 h-4" style={{ color: accent }} />}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, color: POS_COLORS.white, fontWeight: 500 }}>{title}</div>
        </div>
        <div style={{ fontSize: 11, color: POS_COLORS.dim, fontFamily: 'ui-monospace,monospace', textAlign: 'right' }}>{summary}</div>
        <div style={{
          fontSize: 14, color: POS_COLORS.dim,
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 150ms', display: 'inline-block', width: 16, textAlign: 'center',
        }}>›</div>
      </button>
      {open && (
        <div style={{ padding: '4px 4px 20px 4px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
