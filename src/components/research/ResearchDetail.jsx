// ══════════════════════════════════════════════════════════════════════════
// ResearchDetail — header (with clickable cover icon → back to library)
// and routes to the report body for the selected research id.
// ══════════════════════════════════════════════════════════════════════════
import React from 'react';
import researchLibrary from '../../data/research-library.json';
import ResearchCover from './ResearchCovers.jsx';
import HoldingsTab from './HoldingsTab.jsx';
import HoldingsV2 from './HoldingsV2.jsx';
import DataCentersAI from './DataCentersAI.jsx';
import Proxy from './Proxy.jsx';
import CapitalFlowSection from './CapitalFlowSection.jsx';

const RESEARCH_LIBRARY = researchLibrary;

export default function ResearchDetail({ researchId, context, onBack, onOpenResearch }) {
  const r = RESEARCH_LIBRARY.find(x => x.id === researchId);
  if (!r) {
    return (
      <div style={{ padding: 64, textAlign: 'center', color: 'var(--hm-text3)' }}>
        Research not found.
        <button onClick={onBack} style={{ display: 'block', margin: '20px auto', padding: '8px 16px', background: '#22D3EE', color: '#0a0a0a', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          ← Back to library
        </button>
      </div>
    );
  }
  // Capital Flow is a full-screen canvas — no research header, no column; all
  // navigation lives in its own floating top bar. The section holds TWO maps
  // (Потоки · Экосистема) behind a switch; `context.map` can open either.
  if (researchId === 'capital-flow-map') {
    return (
      <CapitalFlowSection
        onBack={onBack}
        initialFlowId={context?.flowId}
        initialMap={context?.map}
        onOpenResearch={onOpenResearch}
      />
    );
  }
  // Holdings (Bloomberg IA) renders full-bleed with no research header —
  // navigation lives inside HoldingsV2's own sticky top bar.
  if (researchId === 'holdings') {
    return (
      <div style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--hm-bg)' }}>
        <HoldingsV2 onBack={onBack} />
      </div>
    );
  }

  const column = { maxWidth: 1344, margin: '0 auto', padding: '0 32px' };
  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', padding: '32px 0 96px', background: 'var(--hm-bg)' }}>
      <div style={column}>
        {/* Back link */}
        <button onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--hm-text5)', fontSize: 12, fontFamily: 'ui-monospace,monospace',
            padding: '6px 0', marginBottom: 32,
            transition: 'color 120ms',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = r.accent}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hm-text5)'}>
          {/* A page reached via a «подробнее» link says where it will go back
              to, so the trip is round rather than one-way. */}
          {context?.returnTo?.label ? `← ${context.returnTo.label}` : '← Back to research library'}
        </button>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 28, marginBottom: 48,
          paddingBottom: 32, borderBottom: '1px solid var(--hm-border4)',
        }}>
          <div
            onClick={onBack}
            style={{
              width: 96, height: 96, borderRadius: 14, overflow: 'hidden',
              position: 'relative', background: '#0a0a0a', flexShrink: 0,
              border: `1px solid ${r.accent}30`,
              cursor: 'pointer',
              transition: 'border-color 120ms, transform 120ms',
            }}
            title="Back to research library"
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${r.accent}80`; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${r.accent}30`; e.currentTarget.style.transform = 'scale(1)'; }}>
            <ResearchCover id={r.id} color={r.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: r.accent, fontFamily: 'ui-monospace,monospace', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8, fontWeight: 700 }}>
              {r.sector} · {r.dateCompleted}
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--hm-text)', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 12 }}>
              {r.title}
            </div>
            <div style={{ fontSize: 15, color: 'var(--hm-text3)', lineHeight: 1.55, maxWidth: 760 }}>
              {r.subtitle}
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 18, fontSize: 11, fontFamily: 'ui-monospace,monospace', color: 'var(--hm-text5)' }}>
              <span><span style={{ color: 'var(--hm-text)', fontWeight: 600 }}>{r.companyCount}</span> companies covered</span>
              <span style={{ color: 'var(--hm-rank)' }}>·</span>
              <span><span style={{ color: 'var(--hm-text)', fontWeight: 600 }}>{r.sectionCount}</span> sections</span>
            </div>
          </div>
        </div>

      </div>

      {/* Report body */}
      <div style={column}>
        {researchId === 'data-centers-ai' ? (
          <DataCentersAI context={context} />
        ) : researchId === 'proxy' ? (
          <Proxy />
        ) : (
          <div style={{
            padding: '64px 32px', textAlign: 'center',
            background: '#0a0a0a', border: '1px dashed var(--hm-border4)', borderRadius: 10,
            color: 'var(--hm-text6)', fontSize: 13, fontStyle: 'italic',
          }}>
            Full report sections, company profiles, and supporting data will be added here.
          </div>
        )}
      </div>
    </div>
  );
}
