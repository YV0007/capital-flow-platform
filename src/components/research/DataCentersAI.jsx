// ══════════════════════════════════════════════════════════════════════════
// RESEARCH: DATA CENTERS FOR AI — debug build
// For the dc-redesign branch we are showing only the supply-chain graph
// while we iterate on the new layout. The original 7-section report
// (thesis, matrix, metrics, risks, scenarios, summary) is preserved on
// `main` and in earlier commits on this branch; restore once the new
// chain visual is locked.
// ══════════════════════════════════════════════════════════════════════════
import React from 'react';
import Roadmap from './dc/Roadmap.jsx';

export default function DataCentersAI() {
  return <Roadmap />;
}
