// ══════════════════════════════════════════════════════════════════════════
// ErrorBoundary — a crashed section stops being a black screen.
//
// WHY. React unmounts the WHOLE tree when a render throws. One bad line in one
// panel — a `t` that turned out to be a string, a `.map` over something the
// engine stopped shipping — and the entire dashboard goes black, with the only
// evidence in a console nobody has open. That is how `tierColor(sec.tier)`
// lived: every section tab of every holding was dead, and the page just went
// dark. (2026-08-28, and it was not the first.)
//
// The build gates catch the failures that can be seen in source — `npm run
// i18n:check` and `npm run i18n:lint`. This catches the rest, at runtime, and
// turns each one into a card that names the component and prints the error.
//
// PLACEMENT MATTERS. It wraps the section BODY, never the Header. A crashed
// section therefore leaves the navigation alive: you read what broke, and you
// click somewhere else. A boundary around everything would be a nicer-looking
// black screen and nothing more.
//
// `resetKey` — change it (the language, the active section) and the boundary
// re-arms itself. Without it a single crash would keep showing the error card
// after you navigated somewhere perfectly healthy.
// ══════════════════════════════════════════════════════════════════════════

import { Component } from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';
import { getLang } from '../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';
const btn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 12px', borderRadius: 6, cursor: 'pointer',
  background: 'transparent', border: '1px solid var(--cf-border, #2A2F3A)',
  color: 'var(--cf-text3, #9AA3B2)', fontSize: 11, fontFamily: MONO, fontWeight: 700,
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, stack: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // The component stack is the only thing that says WHERE, and React prints
    // it to the console once and never again. Keep it on screen.
    this.setState({ stack: info?.componentStack || null });
    if (typeof console !== 'undefined') {
      console.error('[ErrorBoundary]', this.props.label || 'section', error, info?.componentStack);
    }
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null, stack: null });
    }
  }

  render() {
    const { error, stack } = this.state;
    if (!error) return this.props.children;

    const en = getLang() === 'en';
    // The first frames of the component stack are the ones that matter — the
    // rest is App / providers, identical for every crash.
    const where = (stack || '')
      .split('\n').map(s => s.trim()).filter(Boolean).slice(0, 4).join('\n');

    return (
      <div style={{ padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          maxWidth: 620, width: '100%',
          border: '1px solid #E5484D44', borderRadius: 10,
          background: 'var(--cf-panel, rgba(20,20,24,0.6))',
          padding: '20px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={14} color="#E5484D" />
            <span style={{
              fontSize: 10, color: '#E5484D', fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>
              {en ? 'This section failed to render' : 'Раздел не отрисовался'}
            </span>
          </div>

          <div style={{ fontSize: 13, color: 'var(--cf-text2, #C9CEDA)', lineHeight: 1.6, marginBottom: 14 }}>
            {en
              ? 'The rest of the dashboard is fine — the navigation above still works. What broke here:'
              : 'Остальной дашборд цел — навигация сверху работает. Что сломалось здесь:'}
          </div>

          <div style={{
            fontFamily: MONO, fontSize: 11, lineHeight: 1.6, color: '#E5A0A2',
            background: 'rgba(229,72,77,0.06)', border: '1px solid #E5484D22',
            borderRadius: 6, padding: '10px 12px', marginBottom: where ? 10 : 16,
            wordBreak: 'break-word',
          }}>
            {String(error?.message || error)}
          </div>

          {where && (
            <pre style={{
              fontFamily: MONO, fontSize: 10, lineHeight: 1.6,
              color: 'var(--cf-text6, #7A8394)', margin: '0 0 16px',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>{where}</pre>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => this.setState({ error: null, stack: null })}
              style={btn}>
              <RotateCw size={11} />
              {en ? 'Try this section again' : 'Попробовать снова'}
            </button>
            {/* The escape hatch. Retrying a deterministic crash just crashes
                again — in a mode that draws its own navigation (the tracker)
                this button is the only way out that is not a page reload. */}
            {this.props.onHome && (
              <button onClick={this.props.onHome} style={btn}>
                <Home size={11} />
                {en ? 'Back to home' : 'На главную'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
