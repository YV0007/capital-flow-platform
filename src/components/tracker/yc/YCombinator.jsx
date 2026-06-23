// ══════════════════════════════════════════════════════════════════════════
// TRACKER: Y COMBINATOR DIRECTORY
// Self-contained mini-app inside the Tracker section. Unlike Zeely/Cursor
// (single-company deep dives via 7 tabs), this one shows a portfolio
// directory: landing list ↔ per-company detail page. The detail page
// pulls a rich research bundle from yc-research.json (funding, traction,
// team, moat, market, competition, risks, momentum, unit economics,
// customer voice, data gaps, sources) and merges it with the basic
// company record at click time.
// ══════════════════════════════════════════════════════════════════════════
import React, { useMemo, useState } from 'react';
import ycCompaniesData from '../../../data/yc-companies.json';
import ycResearchData from '../../../data/yc-research.json';
import YCLanding from './YCLanding.jsx';
import YCDetail from './YCDetail.jsx';

// Research file uses richer company_id strings (bentolabs-ai, hedge-specialty,
// keyframe-labs, ...) — match by lower-cased company_name instead so the
// mapping survives any id divergence.
const RESEARCH_BY_NAME = ycResearchData.reduce((acc, r) => {
  acc[r.company_name.trim().toLowerCase()] = r;
  return acc;
}, {});

function researchFor(company) {
  if (!company) return null;
  return RESEARCH_BY_NAME[company.name.trim().toLowerCase()] || null;
}

export default function YCombinator() {
  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(
    () => selectedId ? ycCompaniesData.find(c => c.id === selectedId) : null,
    [selectedId]);
  const selectedResearch = useMemo(() => researchFor(selected), [selected]);

  return (
    <div style={{ padding: '20px 16px 60px', maxWidth: 1200, margin: '0 auto' }}>
      {selected
        ? <YCDetail
            company={selected}
            research={selectedResearch}
            onBack={() => setSelectedId(null)} />
        : <YCLanding companies={ycCompaniesData} onOpen={(id) => setSelectedId(id)} />}
    </div>
  );
}
