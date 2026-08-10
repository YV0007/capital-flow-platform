// ══════════════════════════════════════════════════════════════════════════
// Theme support for the Capital Flow section.
//
// Two problems the `--cf-*` CSS variables cannot solve on their own:
//
//   1. THE CANVAS. FlowGraph paints with ctx.fillStyle — a raw string. It
//      cannot read a CSS variable, so the surface colours are mirrored here as
//      JS. `src/theme.css § --cf-*` and CANVAS below are the same palette
//      written twice; change them together.
//
//   2. THE SEMANTIC PALETTE. Sector / class / event / status colours live in
//      capitalMap.js as data and are tuned for a near-black canvas. On white,
//      #45C0D0 or #FDE047 all but disappear. Rather than hand-maintaining a
//      second palette (which would drift the moment the engine adds a sector),
//      `tone()` derives the light variant: it darkens only what is actually
//      too light to read, in a way that preserves hue and relative order.
// ══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';

/** Current UI theme, kept in sync with the `data-theme` App writes on <html>. */
export function useThemeMode() {
  const read = () => (typeof document !== 'undefined'
    && document.documentElement.dataset.theme === 'light') ? 'light' : 'dark';
  const [mode, setMode] = useState(read);
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setMode(read()));
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    setMode(read());                       // catch a flip that beat the observer
    return () => obs.disconnect();
  }, []);
  return mode;
}

// ── colour maths ─────────────────────────────────────────────────────────
function parseHex(hex) {
  if (typeof hex !== 'string') return null;
  const h = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return null;
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(f, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
const toHex = ({ r, g, b }) =>
  '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

/** Perceived luminance, 0 (black) – 1 (white). */
function luminance({ r, g, b }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Adapt a palette colour to the active theme.
 *
 * Dark mode returns the colour untouched — the palette was designed there.
 * Light mode darkens anything above the readable ceiling by mixing toward a
 * deep slate (not pure black, which reads as dirty), scaled by how far over
 * the line it is. Colours already dark enough are left alone, so hue identity
 * and the relative ordering of the palette survive.
 */
export function tone(color, mode) {
  if (mode !== 'light') return color;
  const rgb = parseHex(color);
  if (!rgb) return color;                       // rgba()/var()/named — leave it
  const L = luminance(rgb);
  const CEIL = 0.42;                            // max luminance on a white card
  if (L <= CEIL) return color;
  const t = Math.min(0.72, (L - CEIL) / (1 - CEIL) * 0.95);
  const ink = { r: 12, g: 20, b: 33 };
  return toHex({
    r: rgb.r + (ink.r - rgb.r) * t,
    g: rgb.g + (ink.g - rgb.g) * t,
    b: rgb.b + (ink.b - rgb.b) * t,
  });
}

/** `tone()` + alpha, for the canvas and for chip backgrounds. */
export function toneA(color, mode, alpha) {
  const rgb = parseHex(tone(color, mode));
  if (!rgb) return color;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

// ── canvas surfaces — mirrors src/theme.css § --cf-* ─────────────────────
const DARK = {
  bg: '#08090C',
  nodeTile: '#0e0f14',          // tile base behind a logo
  logoPlate: '#f4f5f7',         // light plate so dark logos read
  tileShadow: 'rgba(0,0,0,0.45)',
  label: '#e6e8ee',
  labelStrong: '#ffffff',
  selectRing: '#ffffff',
  rankPip: '#D6DAE4',
  // Pivotal RED bloom — a classified node (investor or receiver) glows red so
  // it pops on the multi-colour map. Bright, saturated.
  pivotGlow: '#FF4A55',
  linkDim: '#3f3f46',
  linkDimAlpha: 0.06,
  regionSource: 0.085,          // glow alpha, allocator island
  regionTarget: 0.075,
  regionLit: 0.16,
  tipBg: '#101116',
  tipBorder: '#26262e',
  tipText: '#fafafa',
  tipText2: '#d4d4d8',
  tipText3: '#a1a1aa',
  tipText4: '#71717a',
  tipRule: '#3f3f46',
  tipShadow: 'rgba(0,0,0,0.85)',
};

const LIGHT = {
  bg: '#F4F7FB',
  nodeTile: '#FFFFFF',
  logoPlate: '#FFFFFF',
  tileShadow: 'rgba(15,23,42,0.16)',
  label: '#243449',
  labelStrong: '#0F172A',
  selectRing: '#0F172A',
  rankPip: '#64748B',
  // Slightly deeper red so the bloom reads on a white page.
  pivotGlow: '#E5323D',
  linkDim: '#94A3B8',
  linkDimAlpha: 0.13,
  // Glows must work harder on a light page or the clusters vanish.
  regionSource: 0.16,
  regionTarget: 0.15,
  regionLit: 0.26,
  tipBg: '#FFFFFF',
  tipBorder: 'rgba(15,23,42,0.14)',
  tipText: '#0F172A',
  tipText2: '#334155',
  tipText3: '#475569',
  tipText4: '#64748B',
  tipRule: '#C3CEDB',
  tipShadow: 'rgba(15,23,42,0.18)',
};

export function canvasTokens(mode) {
  return mode === 'light' ? LIGHT : DARK;
}
