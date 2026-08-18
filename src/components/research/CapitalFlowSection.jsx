// ══════════════════════════════════════════════════════════════════════════
// CapitalFlowSection — the shell that holds the section's TWO maps.
//
//   Потоки     — CapitalFlowMap, weekly, "where did the money go"
//   Экосистема — EcosystemMap,   monthly, "how is the industry built"
//
// The switch lives HERE, one level above both, on purpose. Only one map is
// mounted at a time, so their state is separate by construction rather than by
// discipline: no shared filters, no shared panel, no cross-highlighting. The
// shared parts are exactly the ones that should be — the canvas theme, the
// logo pipeline and the formatters, all imported by both.
//
// A deep link (`context.flowId`) is a flow-map address, so arriving with one
// opens the flow map regardless of what was last selected.
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import CapitalFlowMap from './capitalflow/CapitalFlowMap.jsx';
import EcosystemMap from './ecosystem/EcosystemMap.jsx';
import MapSwitch from './ecosystem/MapSwitch.jsx';

export default function CapitalFlowSection({ onBack, initialFlowId, onOpenResearch, initialMap }) {
  const [map, setMap] = useState(initialFlowId ? 'flows' : (initialMap || 'flows'));
  const mapSwitch = <MapSwitch value={map} onChange={setMap} />;

  return map === 'ecosystem'
    ? <EcosystemMap onBack={onBack} onOpenResearch={onOpenResearch} mapSwitch={mapSwitch} />
    : <CapitalFlowMap onBack={onBack} initialFlowId={initialFlowId} onOpenResearch={onOpenResearch} mapSwitch={mapSwitch} />;
}
