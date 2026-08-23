// ══════════════════════════════════════════════════════════════════════════
// CapitalFlowSection — the shell that holds the section's THREE views.
//
//   Потоки        — CapitalFlowMap, weekly,  "where did the money go"
//   Экосистема    — EcosystemMap,   monthly, "how is the industry built"
//   Трекер фондов — FundTracker,    weekly,  "what do the funds actually hold"
//
// The switch lives HERE, one level above all three, on purpose. Only one is
// mounted at a time, so their state is separate by construction rather than by
// discipline: no shared filters, no shared panel, no cross-highlighting. The
// shared parts are exactly the ones that should be — the canvas theme, the
// logo pipeline and the formatters.
//
// The third is deliberately NOT a map. The first two are graphs because their
// data is: flows draw transactions between parties, the ecosystem draws
// standing positions between them. Fourteen independent funds have no
// meaningful edges between them, so the tracker draws none — same node
// vocabulary, no links.
//
// A deep link (`context.flowId`) is a flow-map address, so arriving with one
// opens the flow map regardless of what was last selected.
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import CapitalFlowMap from './capitalflow/CapitalFlowMap.jsx';
import EcosystemMap from './ecosystem/EcosystemMap.jsx';
import FundTracker from './funds/FundTracker.jsx';
import MapSwitch from './ecosystem/MapSwitch.jsx';

export default function CapitalFlowSection({ onBack, initialFlowId, onOpenResearch, initialMap }) {
  const [map, setMap] = useState(initialFlowId ? 'flows' : (initialMap || 'flows'));
  const mapSwitch = <MapSwitch value={map} onChange={setMap} />;

  if (map === 'ecosystem') return <EcosystemMap onBack={onBack} onOpenResearch={onOpenResearch} mapSwitch={mapSwitch} />;
  if (map === 'funds') return <FundTracker onBack={onBack} mapSwitch={mapSwitch} />;
  return <CapitalFlowMap onBack={onBack} initialFlowId={initialFlowId} onOpenResearch={onOpenResearch} mapSwitch={mapSwitch} />;
}
