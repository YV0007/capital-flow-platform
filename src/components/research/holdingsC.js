// Holdings research palette — the old `holdingsData.THEMES.dark` object,
// re-expressed as CSS variables so the whole family (HoldingsV2 + the deep
// views) follows the app-wide light/dark toggle. Token values live in
// src/theme.css (`--h-*`); alpha-tinted derivations in components use
// color-mix() instead of hex concatenation.
export const C = {
  paper: 'var(--h-paper)',
  card: 'var(--h-card)',
  cardAlt: 'var(--h-cardAlt)',
  ink: 'var(--h-ink)',
  inkSoft: 'var(--h-inkSoft)',
  inkFaint: 'var(--h-inkFaint)',
  line: 'var(--h-line)',
  lineSoft: 'var(--h-lineSoft)',
  track: 'var(--h-track)',
  violet: 'var(--h-violet)',
  teal: 'var(--h-teal)',
  clay: 'var(--h-clay)',
  gold: 'var(--h-gold)',
  blue: 'var(--h-blue)',
  unlisted: 'var(--h-unlisted)',
  isDark: true,
};
