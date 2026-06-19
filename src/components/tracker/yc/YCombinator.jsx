// ══════════════════════════════════════════════════════════════════════════
// TRACKER: Y COMBINATOR DIRECTORY
// Self-contained mini-app inside the Tracker section. Unlike Zeely/Cursor
// (single-company deep dives via 7 tabs), this one shows a portfolio
// directory: landing list ↔ per-company detail page.
// ══════════════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import ycCompaniesData from '../../../data/yc-companies.json';
import YCLanding from './YCLanding.jsx';
import YCDetail from './YCDetail.jsx';

export default function YCombinator() {
  const [selectedId, setSelectedId] = useState(null);

  const selected = selectedId
    ? ycCompaniesData.find(c => c.id === selectedId)
    : null;

  return (
    <div style={{ padding: '20px 16px 60px', maxWidth: 1200, margin: '0 auto' }}>
      {selected
        ? <YCDetail company={selected} onBack={() => setSelectedId(null)} />
        : <YCLanding companies={ycCompaniesData} onOpen={(id) => setSelectedId(id)} />}
    </div>
  );
}
