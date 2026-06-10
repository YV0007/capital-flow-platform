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
// eslint-disable-next-line no-unused-vars
import * as _stage3Panel from './components/tracker/shared/Panel.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3Modal from './components/tracker/shared/Modal.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3Focus from './components/tracker/shared/FocusOverlay.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3Chrome from './components/tracker/shared/chrome.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3Badges from './components/tracker/shared/badges.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3BuildFlags from './lib/build-flags.js';
// eslint-disable-next-line no-unused-vars
import * as _stage3ObsForm from './components/tracker/forms/ObservationForm.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3SynForm from './components/tracker/forms/SyndicateCommForm.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3Settings from './components/tracker/SettingsView.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3QuickStart from './components/tracker/shared/QuickStartPanel.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3Log from './components/tracker/ObservationLogView.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3Syn from './components/tracker/SyndicateCommsView.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3CompositeGauge from './components/tracker/scoring/CompositeGauge.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3ScoringTrend from './components/tracker/scoring/ScoringTrendChart.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3ScoreEditor from './components/tracker/scoring/ScoreEditor.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3ScoringView from './components/tracker/ScoringTrajectoryView.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3Heatmap from './components/tracker/MetricHeatmapView.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3Position from './components/tracker/PositionView.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3Hiring from './components/tracker/signals/HiringVelocityPanel.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3Competitor from './components/tracker/signals/CompetitorSharePanel.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3Sentiment from './components/tracker/signals/SentimentPanel.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3App from './components/tracker/signals/AppDownloadsPanel.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3Ad from './components/tracker/signals/AdLibraryPanel.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3WeeklyTakeaway from './components/tracker/news/WeeklyTakeaway.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3BriefStack from './components/tracker/news/BriefStack.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3WeeklyBrief from './components/tracker/news/WeeklyBriefPanel.jsx';
// eslint-disable-next-line no-unused-vars
import * as _stage3NewsFeed from './components/tracker/news/NewsMentionsFeed.jsx';

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
