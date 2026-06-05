import { useState } from 'react';
import Header from './components/Header.jsx';
import HomeLanding from './components/HomeLanding.jsx';
import TrackerPlaceholder from './components/tracker/TrackerPlaceholder.jsx';
import ResearchPlaceholder from './components/research/ResearchPlaceholder.jsx';

// App-wide mode: 'home' (default landing), 'tracker' (VC position monitor),
// or 'research' (sector library). Persisted across reloads via localStorage.
const MODE_KEY = 'app:mode';

function loadMode() {
  try {
    const v = typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem(MODE_KEY)
      : null;
    if (v === 'tracker' || v === 'research' || v === 'home') return v;
  } catch {}
  return 'home';
}

export default function App() {
  const [mode, setMode] = useState(loadMode);

  const updateMode = (next) => {
    setMode(next);
    try { window.localStorage.setItem(MODE_KEY, next); } catch {}
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#e4e4e7' }}>
      <Header mode={mode} onChangeMode={updateMode} />
      {mode === 'home' && <HomeLanding onChoose={updateMode} />}
      {mode === 'tracker' && <TrackerPlaceholder />}
      {mode === 'research' && <ResearchPlaceholder />}
    </div>
  );
}
