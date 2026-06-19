// Per-company detail screen: back button + hero + 2-col body + founders strip.
import React from 'react';
import YCDetailHero from './YCDetailHero.jsx';
import YCMetadataCard from './YCMetadataCard.jsx';
import YCFoundersStrip from './YCFoundersStrip.jsx';

export default function YCDetail({ company, onBack }) {
  const hasFounders = (company.founders || []).length > 0;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#a1a1aa',
          fontSize: 13,
          padding: '4px 0',
          cursor: 'pointer',
          marginBottom: 18,
          font: 'inherit',
          fontWeight: 500,
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fafafa'}
        onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}
      >
        ← К списку
      </button>

      {/* Hero */}
      <YCDetailHero company={company} />

      {/* Two-column body */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
        gap: 28, marginTop: 28,
        alignItems: 'start',
      }}>
        {/* Left: description */}
        <div>
          <div style={{
            fontSize: 11, color: '#71717a',
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.14em', fontWeight: 700,
            marginBottom: 14,
            textTransform: 'uppercase',
          }}>
            О компании
          </div>
          <div style={{
            fontSize: 15, color: '#e4e4e7', lineHeight: 1.75,
            maxWidth: 720,
          }}>
            {company.description}
          </div>
        </div>

        {/* Right: sticky metadata */}
        <div style={{ position: 'sticky', top: 140 }}>
          <YCMetadataCard company={company} />
        </div>
      </div>

      {/* Founders */}
      {hasFounders && (
        <div style={{ marginTop: 40 }}>
          <div style={{
            fontSize: 11, color: '#71717a',
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.14em', fontWeight: 700,
            marginBottom: 14,
            textTransform: 'uppercase',
          }}>
            Основатели
          </div>
          <YCFoundersStrip founders={company.founders} />
        </div>
      )}
    </div>
  );
}
