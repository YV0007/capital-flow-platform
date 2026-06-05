// Placeholder App. Phase 4 of the migration will replace this with the
// real Home / Tracker / Research routing. For now, just confirms the
// Vite + React toolchain is wired up correctly.

export default function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: '#71717a',
          fontFamily: 'ui-monospace, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.32em',
          marginBottom: 20,
        }}
      >
        Vite scaffold · phase 2
      </div>
      <h1
        style={{
          fontSize: 'clamp(48px, 8vw, 96px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
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
          fontSize: 14,
          color: '#a1a1aa',
          marginTop: 18,
          maxWidth: 480,
          lineHeight: 1.6,
        }}
      >
        If you can read this, the toolchain works. The real app gets ported in
        Phase 4.
      </div>
    </div>
  );
}
