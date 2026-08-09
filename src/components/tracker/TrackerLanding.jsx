// Tracker section home page — mirrors ResearchLanding but with a different
// visual: landscape cards with a tinted initials block, type pill, and a
// stats row at the bottom. Includes a page-header search field that
// filters the visible trackers by name / subtitle.
//
// Routed by App.jsx — `mode === 'tracker' && !trackerOpen` shows this
// page; clicking a card calls onOpen(id) which switches the tracker
// company AND flips `trackerOpen` true so the existing tab UI takes over.
import { useMemo, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import ycCompaniesData from '../../data/yc-companies.json';

// Descriptor per tracker — kept tiny and inline since there are only
// three; if we add more, lift into src/data/tracker-meta.json.
const TRACKERS = [
  {
    id: 'zeely',
    name: 'Zeely.ai',
    initials: 'Z',
    domain: 'zeely.ai',
    accent: '#22D3EE',
    typeLabel: 'Активная позиция',
    subtitle: 'Активный мониторинг сид-позиции в Zeely.ai — наблюдения, скоринг, синдикат.',
    stats: [
      { label: 'Стадия',     value: 'Seed' },
      { label: 'Меморандум', value: 'Apr 2026' },
    ],
    lifecycle: { status: 'active' },
  },
  {
    id: 'cursor',
    name: 'Cursor',
    initials: 'C',
    domain: 'cursor.com',
    accent: '#f59e0b',
    typeLabel: 'Активная позиция',
    subtitle: 'Мониторинг позиции в Anysphere — ARR, бенчмарки, конкурентная динамика.',
    stats: [
      { label: 'Стадия',     value: 'Series C' },
      { label: 'Меморандум', value: 'Feb 2026' },
    ],
    // SpaceX закрыл сделку на $60B — позиция реализована, продолжаем
    // держать карточку для истории и финального отчёта.
    lifecycle: {
      status: 'acquired',
      buyer: 'SpaceX',
      amount: '$60B',
      date: 'Dec 2026',
    },
  },
  {
    id: 'yc',
    name: 'Y Combinator',
    initials: 'YC',
    domain: 'ycombinator.com',
    accent: '#FF6600',
    typeLabel: 'Батч YC',
    subtitle: 'Y Combinator Spring 2026 — каталог стартапов с картой по инвесторам и research.',
    stats: [
      { label: 'Батч',     value: 'Spring 2026' },
      { label: 'Компаний', value: String(ycCompaniesData.length) },
    ],
    lifecycle: { status: 'active' },
  },
];

// ─ Lifecycle visual system — extend by adding a key to this map. Each entry
// can override: the pill label & accent, an optional diagonal corner ribbon
// stamp, an optional `desaturate` flag (greys the card to signal "no longer
// in motion"), and a stats override (e.g. show Exit / Сумма / Дата instead
// of Стадия / Меморандум when the position has been realised).
// ─────────────────────────────────────────────────────────────────────────
const LIFECYCLE_STYLES = {
  active: {
    // Default — no overrides. Card uses the tracker's own accent & stats.
  },
  acquired: {
    accentOverride: '#10b981',
    pillLabel: (lc) => `Выход · ${lc.buyer}`,
    ribbonLabel: 'EXITED',
    desaturate: true,
    statsOverride: (lc) => [
      { label: 'Выход',  value: lc.amount || 'realised' },
      { label: 'Сделка', value: lc.date   || '—'        },
    ],
  },
  ipo: {
    accentOverride: '#22D3EE',
    pillLabel: (lc) => `IPO${lc.ticker ? ' · ' + lc.ticker : ''}`,
    ribbonLabel: 'IPO',
    desaturate: false,
    statsOverride: (lc) => [
      { label: 'IPO цена', value: lc.amount || '—' },
      { label: 'Дата',     value: lc.date   || '—' },
    ],
  },
  shutdown: {
    accentOverride: 'var(--hm-text5)',
    pillLabel: () => 'Закрыта',
    ribbonLabel: 'CLOSED',
    desaturate: true,
    statsOverride: () => [],
  },
};

function lifecycleStyle(tracker) {
  const status = tracker.lifecycle?.status || 'active';
  return LIFECYCLE_STYLES[status] || LIFECYCLE_STYLES.active;
}

export default function TrackerLanding({ onOpen }) {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TRACKERS;
    return TRACKERS.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.subtitle.toLowerCase().includes(q) ||
      t.typeLabel.toLowerCase().includes(q));
  }, [query]);

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      padding: '64px 32px',
      background: 'radial-gradient(ellipse at top, rgba(34,211,238,0.04) 0%, transparent 60%), var(--hm-bg)',
    }}>

      {/* ── Page header with search ──────────────────────────────────── */}
      <header style={{ maxWidth: 1200, margin: '0 auto 48px auto', paddingLeft: 8 }}>
        <div style={{
          fontSize: 11, color: 'var(--hm-text5)', fontFamily: 'ui-monospace,monospace',
          textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 12,
        }}>
          Tracker
        </div>
        <div style={{
          fontSize: 28, fontWeight: 700, color: 'var(--hm-text)',
          letterSpacing: '-0.02em', lineHeight: 1.15,
        }}>
          Трекеры и портфолио
        </div>
        <div style={{
          fontSize: 14, color: 'var(--hm-text3)', marginTop: 10, maxWidth: 640, lineHeight: 1.55,
        }}>
          Активный мониторинг прямых VC-позиций и наблюдаемых портфолио. Выберите трекер, чтобы открыть наблюдения, скоринг и синдикатные коммуникации.
        </div>

        {/* Search */}
        <div style={{
          position: 'relative',
          maxWidth: 480, marginTop: 24,
        }}>
          <Search
            size={15}
            style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--hm-text5)', pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск трекеров..."
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              fontSize: 13.5,
              background: 'var(--hm-panel)',
              border: '1px solid var(--hm-border4)',
              borderRadius: 10,
              color: 'var(--hm-text)',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 160ms',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--hm-rank)'}
            onBlur={e => e.target.style.borderColor = 'var(--hm-border4)'}
          />
        </div>
      </header>

      {/* ── Cards ────────────────────────────────────────────────────── */}
      {visible.length === 0 ? (
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '60px 24px', textAlign: 'center',
          color: 'var(--hm-text5)', fontSize: 14,
          background: 'var(--hm-bg2)', border: '1px solid var(--hm-border)',
          borderRadius: 12,
        }}>
          Ничего не найдено
        </div>
      ) : (
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 22,
          alignItems: 'stretch',
        }}>
          {visible.map((t, i) => (
            <TrackerCard key={t.id} tracker={t} index={i} onOpen={onOpen} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes trackerCardIn {
          0%   { opacity: 0; transform: translateY(14px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

function TrackerCard({ tracker, index, onOpen }) {
  const [hover, setHover] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = !!tracker.domain && !logoFailed;

  // Lifecycle — drives pill, ribbon, desaturation, and stats override.
  const lcStyle = lifecycleStyle(tracker);
  const lc = tracker.lifecycle || { status: 'active' };
  const accent = lcStyle.accentOverride || tracker.accent;
  const pillLabel = lcStyle.pillLabel ? lcStyle.pillLabel(lc) : tracker.typeLabel;
  const stats = lcStyle.statsOverride ? lcStyle.statsOverride(lc) : tracker.stats;
  const ribbon = lcStyle.ribbonLabel || null;
  const desaturate = !!lcStyle.desaturate;

  return (
    <button
      onClick={() => onOpen(tracker.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, var(--hm-card-strong), var(--hm-surface))',
        border: `1px solid ${hover ? accent + '60' : 'var(--hm-border4)'}`,
        borderRadius: 16,
        padding: '22px 24px 20px',
        cursor: 'pointer',
        textAlign: 'left',
        color: 'inherit',
        font: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minHeight: 230,
        overflow: 'hidden',
        // Desaturate the realised / closed cards so they visually step
        // back from the live trackers without becoming invisible.
        filter: desaturate ? (hover ? 'saturate(0.85)' : 'saturate(0.55)') : 'none',
        transition: 'transform 280ms cubic-bezier(0.2,0.8,0.2,1), border-color 220ms, box-shadow 280ms, filter 220ms',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hover
          ? `0 20px 40px -12px ${accent}33, 0 0 0 1px ${accent}1a`
          : 'none',
        animation: `trackerCardIn 600ms cubic-bezier(0.2,0.8,0.2,1) ${index * 90}ms backwards`,
      }}
    >
      {/* Diagonal corner ribbon — only renders when lifecycle has one */}
      {ribbon && (
        <div style={{
          position: 'absolute',
          top: 0, right: 0,
          width: 110, height: 110,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 2,
        }}>
          <div style={{
            position: 'absolute',
            top: 18, right: -36,
            transform: 'rotate(45deg)',
            background: accent,
            color: '#0a0a0a',
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.20em',
            padding: '4px 40px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.55)',
            fontFamily: 'ui-monospace,monospace',
          }}>
            {ribbon}
          </div>
        </div>
      )}
      {/* Top — logo block + type pill */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          // White frame when we render the real brand favicon so logos with
          // transparent backgrounds read cleanly; tinted gradient when we
          // fall back to monogram initials.
          background: showLogo
            ? 'var(--hm-text)'
            : `linear-gradient(135deg, ${tracker.accent}26, ${tracker.accent}08)`,
          border: `1px solid ${showLogo ? 'var(--hm-text2)' : tracker.accent + '40'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          boxShadow: hover ? `0 0 24px ${accent}33` : 'none',
          transition: 'box-shadow 280ms',
        }}>
          {showLogo ? (
            <img
              src={`https://www.google.com/s2/favicons?domain=${tracker.domain}&sz=128`}
              alt={tracker.name}
              onError={() => setLogoFailed(true)}
              style={{
                width: 40, height: 40, objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            <span style={{
              fontSize: tracker.initials.length === 1 ? 24 : 18,
              fontWeight: 800, color: accent,
              letterSpacing: '-0.02em',
              fontFamily: 'ui-monospace,monospace',
            }}>
              {tracker.initials}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 9.5, color: accent,
            fontFamily: 'ui-monospace,monospace',
            padding: '4px 10px', borderRadius: 4,
            background: `${accent}14`,
            border: `1px solid ${accent}33`,
            letterSpacing: '0.12em', fontWeight: 700,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            {pillLabel}
          </span>
          <ArrowUpRight
            size={14}
            style={{
              color: hover ? accent : 'var(--hm-text6)',
              opacity: hover ? 1 : 0.6,
              transition: 'all 220ms',
              transform: hover ? 'translate(2px, -2px)' : 'none',
            }}
          />
        </div>
      </div>

      {/* Middle — name + subtitle */}
      <div>
        <div style={{
          fontSize: 20, fontWeight: 700, color: 'var(--hm-text)',
          letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 6,
        }}>
          {tracker.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--hm-text3)', lineHeight: 1.5 }}>
          {tracker.subtitle}
        </div>
      </div>

      {/* Bottom — stats row (lifecycle can override what's shown here) */}
      {stats && stats.length > 0 && (
        <div style={{
          marginTop: 'auto', paddingTop: 14,
          borderTop: '1px solid var(--hm-border4)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{
                fontSize: 9.5, color: 'var(--hm-text5)',
                fontFamily: 'ui-monospace,monospace',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 4,
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize: 14, color: 'var(--hm-text)', fontWeight: 600,
              }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hover-only accent glow at the bottom edge */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 2,
        background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
        opacity: hover ? 0.8 : 0,
        transition: 'opacity 220ms',
      }} />
    </button>
  );
}
