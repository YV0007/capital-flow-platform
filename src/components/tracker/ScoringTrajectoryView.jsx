import { useState, useMemo } from 'react';
import { Gauge, HelpCircle } from 'lucide-react';
import Panel from './shared/Panel.jsx';
import { StatusBadge } from './shared/chrome.jsx';
import { Tooltip } from './shared/badges.jsx';
import CompositeGauge from './scoring/CompositeGauge.jsx';
import ScoringTrendChart from './scoring/ScoringTrendChart.jsx';
import {
  scoreColor,
  computeCompositeScore,
  autoScoreAiDimension,
  todayISO,
} from '../../lib/utils.js';
import AI_OVERLAY_DIMENSIONS from '../../data/ai-overlay-dimensions.json';

export default function ScoringTrajectoryView({ cfg, observations, scores, onSaveScores }) {
  const [editing, setEditing] = useState(null);
  const [aiOverlayEditing, setAiOverlayEditing] = useState(null);

  const composite = computeCompositeScore(scores || {}, observations);
  const compColor = scoreColor(composite.composite);

  function saveDim(dimId, value, confidence, rationale) {
    const next = { ...(scores || {}), dimensions: { ...(scores?.dimensions || {}) } };
    next.dimensions[dimId] = { value, confidence, rationale, updatedAt: new Date().toISOString() };
    next.history = [...(scores?.history || []), { date: todayISO(), composite: computeCompositeScore(next, observations).composite }];
    onSaveScores(next);
    setEditing(null);
  }

  function clearDim(dimId) {
    const next = { ...(scores || {}), dimensions: { ...(scores?.dimensions || {}) } };
    delete next.dimensions[dimId];
    next.history = [...(scores?.history || []), { date: todayISO(), composite: computeCompositeScore(next, observations).composite }];
    onSaveScores(next);
    setEditing(null);
  }

  function saveAiDim(dimId, value, confidence, rationale) {
    const next = { ...(scores || {}), aiOverlay: { ...(scores?.aiOverlay || {}) } };
    next.aiOverlay[dimId] = { value, confidence, rationale, updatedAt: new Date().toISOString() };
    onSaveScores(next);
    setAiOverlayEditing(null);
  }

  function clearAiDim(dimId) {
    const next = { ...(scores || {}), aiOverlay: { ...(scores?.aiOverlay || {}) } };
    delete next.aiOverlay[dimId];
    onSaveScores(next);
    setAiOverlayEditing(null);
  }

  // Effective score per AI dimension: manual override if set, else auto-score.
  const aiOverlayDetails = useMemo(() => {
    return AI_OVERLAY_DIMENSIONS.map(d => {
      const manual = scores?.aiOverlay?.[d.id];
      const auto = autoScoreAiDimension(d.id, observations);
      let eff = null;
      if (manual && manual.value != null) {
        eff = { value: manual.value, source: 'manual', confidence: manual.confidence, rationale: manual.rationale };
      } else if (auto && auto.score != null) {
        eff = { value: auto.score, source: 'auto', confidence: auto.confidence, rationale: auto.rationale, n: auto.n };
      }
      return { ...d, score: eff?.value, source: eff?.source, confidence: eff?.confidence, rationale: eff?.rationale, n: eff?.n };
    });
  }, [scores, observations]);

  // Confidence-weighted average across AI dimensions, parallel to the
  // composite scorecard. Manual override takes precedence; otherwise auto.
  const aiOverlayAvg = useMemo(() => {
    let valueSum = 0, weightSum = 0;
    for (const d of aiOverlayDetails) {
      if (d.score == null) continue;
      const cmul = d.confidence === 'high' ? 1.0 : d.confidence === 'med' ? 0.85 : 0.65;
      valueSum += d.score * cmul;
      weightSum += cmul;
    }
    return weightSum > 0 ? valueSum / weightSum : null;
  }, [aiOverlayDetails]);
  const aiOverlayColor = scoreColor(aiOverlayAvg);

  return (
    <div className="space-y-3">
      <Panel
        title={
          <span className="inline-flex items-center gap-1.5">
            Composite Scorecard
            <Tooltip text='Each dimension is auto-scored on a 1–10 scale from its relevant observations (direction × confidence, with polarity flipped for "bad-when-up" metrics like burn or churn). Composite is a confidence-weighted average across dimensions. Manual overrides take precedence when set. Composite is suppressed below 50% data coverage.'>
              <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help" />
            </Tooltip>
          </span>
        }
        icon={Gauge}
        right={
          <StatusBadge status={composite.status} />
        }>
        {/* TOP: gauge centered, then a big trajectory chart below */}
        <div className="flex justify-center mb-6 pb-6 border-b border-zinc-800">
          <CompositeGauge score={composite.composite} status={composite.status} />
        </div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-2 px-1">
          Trajectory by category · last 24 weeks
        </div>
        <ScoringTrendChart dimDetails={composite.dimDetails} />

      </Panel>
    </div>
  );
}
