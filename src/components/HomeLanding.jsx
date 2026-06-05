import { Target, BookOpen } from 'lucide-react';

// Top-level entry page. Big "AB Investment" wordmark + two section cards
// that route into Tracker or Research. Rendered by App when mode === 'home'.

const SECTIONS = [
  {
    id: 'tracker',
    label: 'Tracker',
    tag: 'Single-position monitor',
    desc: 'Track a live VC position end-to-end. Public signals, scoring trajectory, position economics, syndicate communications.',
    accent: '#22D3EE',
    Icon: Target,
  },
  {
    id: 'research',
    label: 'Research',
    tag: 'Sector library',
    desc: 'Deep-dive reports on sectors, theses, and holdings. Read the picks-and-shovels view of the AI buildout and the portfolio map.',
    accent: '#2FD9C4',
    Icon: BookOpen,
  },
];

export default function HomeLanding({ onChoose }) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        padding: '48px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(ellipse at top, rgba(34,211,238,0.05) 0%, transparent 55%), radial-gradient(ellipse at bottom, rgba(47,217,196,0.04) 0%, transparent 55%), #09090b',
      }}
    >
      {/* Brand block */}
      <div style={{ textAlign: 'center', marginBottom: 64, maxWidth: 900 }}>
        <div
          style={{
            fontSize: 11,
            color: '#71717a',
            fontFamily: 'ui-monospace, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.32em',
            marginBottom: 24,
          }}
        >
          Investment Workspace
        </div>
        <h1
          style={{
            fontSize: 'clamp(56px, 9vw, 112px)',
            fontWeight: 700,
            color: '#fafafa',
            letterSpacing: '-0.035em',
            lineHeight: 1.0,
            margin: 0,
            background: 'linear-gradient(180deg, #fafafa 0%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          AB Investment
        </h1>
        <div
          style={{
            fontSize: 15,
            color: '#a1a1aa',
            marginTop: 22,
            lineHeight: 1.6,
            maxWidth: 580,
            margin: '22px auto 0',
          }}
        >
          A single workspace for live position monitoring and sector research.
          Choose where to start.
        </div>
      </div>

      {/* Two section cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 360px))',
          gap: 24,
          justifyContent: 'center',
          width: '100%',
          maxWidth: 800,
        }}
      >
        {SECTIONS.map((s, i) => (
          <SectionCard
            key={s.id}
            section={s}
            delay={i * 120}
            onClick={() => onChoose(s.id)}
          />
        ))}
      </div>

      <style>{`
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function SectionCard({ section, delay, onClick }) {
  const Icon = section.Icon;
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        background:
          'linear-gradient(135deg, rgba(24,24,27,0.95) 0%, rgba(9,9,11,0.95) 100%)',
        border: '1px solid #27272a',
        borderRadius: 18,
        padding: '32px 30px 28px',
        cursor: 'pointer',
        transition:
          'transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 220ms, box-shadow 280ms',
        animation: `floatIn 700ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms backwards`,
        willChange: 'transform',
        color: '#fafafa',
        font: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = section.accent + '70';
        e.currentTarget.style.boxShadow = `0 24px 48px -16px ${section.accent}40, 0 0 0 1px ${section.accent}25`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#27272a';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Icon chip */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${section.accent}25 0%, ${section.accent}08 100%)`,
          border: `1px solid ${section.accent}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 22,
        }}
      >
        <Icon size={20} style={{ color: section.accent }} strokeWidth={2} />
      </div>

      {/* Eyebrow */}
      <div
        style={{
          fontSize: 10,
          color: section.accent,
          fontFamily: 'ui-monospace, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          marginBottom: 10,
          fontWeight: 700,
        }}
      >
        {section.tag}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#fafafa',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: 12,
        }}
      >
        {section.label}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 13.5,
          color: '#a1a1aa',
          lineHeight: 1.55,
          marginBottom: 22,
        }}
      >
        {section.desc}
      </div>

      {/* Affordance */}
      <div
        style={{
          marginTop: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          color: section.accent,
          fontFamily: 'ui-monospace, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600,
        }}
      >
        Open {section.label}
        <span style={{ fontSize: 14, lineHeight: 1 }}>→</span>
      </div>
    </button>
  );
}
