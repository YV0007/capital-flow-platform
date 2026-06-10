import { useState } from 'react';
import Header from './components/Header.jsx';
import HomeLanding from './components/HomeLanding.jsx';
import TrackerPlaceholder from './components/tracker/TrackerPlaceholder.jsx';
import ResearchLanding from './components/research/ResearchLanding.jsx';
import ResearchDetail from './components/research/ResearchDetail.jsx';
// Stage 3 parse-only sanity imports. Forces Vite/Rollup to crawl the new
// tracker modules so we catch syntax errors during the per-batch build,
// even before App.jsx wires them up. These imports collapse into real
// usage in batch 17.
// eslint-disable-next-line no-unused-vars
import * as _stage3Utils from './lib/utils.js';
// eslint-disable-next-line no-unused-vars
import * as _stage3Companies from './data/companies.js';
// eslint-disable-next-line no-unused-vars
import * as _stage3CorrobSources from './data/corrob-sources.js';

// App-wide mode: 'home' (default landing), 'tracker' (VC position monitor),
// or 'research' (sector library). Persisted across reloads via localStorage.
const MODE_KEY = 'app:mode';

function loadMode() {
  try {
    const v =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem(MODE_KEY)
        : null;
    if (v === 'tracker' || v === 'research' || v === 'home') return v;
  } catch {}
  return 'home';
}

export default function App() {
  const [mode, setMode] = useState(loadMode);
  // When in research mode, this is either null (showing landing) or the id
  // of an open research report (showing ResearchDetail).
  const [activeResearchId, setActiveResearchId] = useState(null);

  const updateMode = (next) => {
    setMode(next);
    setActiveResearchId(null);
    try {
      window.localStorage.setItem(MODE_KEY, next);
    } catch {}
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#e4e4e7' }}>
      <Header mode={mode} onChangeMode={updateMode} />
      {mode === 'home' && <HomeLanding onChoose={updateMode} />}
      {mode === 'tracker' && <TrackerPlaceholder />}
      {mode === 'research' &&
        (activeResearchId ? (
          <ResearchDetail
            researchId={activeResearchId}
            onBack={() => setActiveResearchId(null)}
          />
        ) : (
          <ResearchLanding onOpen={(id) => setActiveResearchId(id)} />
        ))}
    </div>
  );
}
