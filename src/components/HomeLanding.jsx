// ══════════════════════════════════════════════════════════════════════════
// Home landing — the front door of the workspace.
//
// Hero (live weekly stats + quick nav), then three teaser blocks that each
// route into a full page:
//   · Capital Flows  — top-5 weekly flows + sector wave field → capital-flow-map
//   · Holdings       — top-5 tracker + news feed              → holdings
//   · Supply chain   — bucket carousel                        → data-centers-ai
// plus a footer nav across Tracker / Research / Proxy.
//
// `onChoose(mode)` switches app mode; `onOpenResearch(id)` deep-links into a
// specific research page (wired in App.jsx).
// ══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import CapitalFlowsHome from './home/CapitalFlowsHome.jsx';
import HoldingsHome from './home/HoldingsHome.jsx';
import SupplyChainHome from './home/SupplyChainHome.jsx';
import { WEEK_STATS } from './home/homeData.js';
import { fmtUSD } from './research/capitalflow/format.js';
import { Reveal, MONO, EASE } from './home/ui.jsx';

// ── Count-up hook for the hero stats ─────────────────────────────────────
function useCountUp(target, duration = 1500, delay = 250) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf; let start;
    const timer = setTimeout(() => {
      const tick = (t) => {
        if (start === undefined) start = t;
        const p = Math.min(1, (t - start) / duration);
        setValue(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return value;
}

function HeroStat({ label, value, format, accent, delay }) {
  const v = useCountUp(value, 1500, delay);
  return (
    <div style={{ textAlign: 'center', minWidth: 130 }}>
      <div style={{
        fontSize: 30, fontWeight: 700, fontFamily: MONO, color: 'var(--hm-text)',
        letterSpacing: '-0.03em', lineHeight: 1,
      }}>
        {format(v)}
      </div>
      <div style={{
        fontSize: 9.5, fontFamily: MONO, fontWeight: 700, color: accent,
        textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 8,
      }}>
        {label}
      </div>
    </div>
  );
}

function NavChip({ label, color, onClick, filled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '9px 18px', borderRadius: 999, cursor: 'pointer', font: 'inherit',
        fontSize: 11.5, fontWeight: 600, letterSpacing: '0.01em',
        background: filled
          ? (hovered ? color : color + 'e6')
          : (hovered ? color + '16' : 'var(--hm-chip)'),
        color: filled ? '#09090b' : (hovered ? color : 'var(--hm-text2)'),
        border: `1px solid ${filled ? 'transparent' : (hovered ? color + '70' : 'var(--hm-border3)')}`,
        transition: `all 220ms ${EASE}`,
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {label}
      <span style={{ fontSize: 13, lineHeight: 1, opacity: 0.8 }}>→</span>
    </button>
  );
}

// ── Custom footer marks — thin geometric line work instead of stock icons ─
function MarkBase({ children }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {children}
    </svg>
  );
}

// Live position monitoring — a pulse line.
function TrackerMark() {
  return (
    <MarkBase>
      <path d="M3 12h3.5l2.5-5.5 4 11 2.5-5.5H21" />
    </MarkBase>
  );
}

// Research library — books on a shelf, one leaning.
function LibraryMark() {
  return (
    <MarkBase>
      <path d="M5 4.5v15M9.5 4.5v15" />
      <path d="M13.6 5.4l4.6 13.6" />
      <path d="M3.5 19.5h17" />
    </MarkBase>
  );
}

// Proxy — exposure routed through an intermediate node.
function ProxyMark() {
  return (
    <MarkBase>
      <circle cx="4.6" cy="12" r="1.9" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="19.4" cy="12" r="1.9" />
      <path d="M6.5 12H9M15 12h2.5" />
    </MarkBase>
  );
}

function FooterTile({ mark, title, desc, accent, onClick, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={delay}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 16, width: '100%',
          textAlign: 'left', font: 'inherit',
          background: hovered ? `linear-gradient(120deg, ${accent}10 0%, var(--hm-surface) 70%)` : 'var(--hm-surface)',
          border: `1px solid ${hovered ? accent + '50' : 'var(--hm-border)'}`,
          borderRadius: 16, padding: '20px 22px', cursor: 'pointer',
          transition: `all 240ms ${EASE}`,
          transform: hovered ? 'translateY(-4px)' : 'none',
          boxShadow: hovered ? `0 18px 36px -20px ${accent}55` : 'none',
        }}
      >
        <span style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${accent}0d`,
          border: `1px solid ${accent}30`,
          color: accent,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {mark}
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--hm-text)', letterSpacing: '-0.01em' }}>
            {title}
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--hm-text4)', lineHeight: 1.45, marginTop: 3 }}>
            {desc}
          </span>
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 16, color: accent,
          opacity: hovered ? 1 : 0.35, transition: 'opacity 200ms', flexShrink: 0,
        }}>
          →
        </span>
      </button>
    </Reveal>
  );
}

const SECTION_GAP = 110;

export default function HomeLanding({ onChoose, onOpenResearch, theme = 'dark' }) {
  const openResearch = (id, context) =>
    (onOpenResearch ? onOpenResearch(id, context || null) : onChoose('research'));

  return (
    <div className="hm-root" data-theme={theme} style={{
      minHeight: 'calc(100vh - 60px)',
      paddingBottom: 120,
      background: 'var(--hm-page-bg)',
      color: 'var(--hm-text)',
      overflowX: 'hidden',
      transition: 'background 300ms',
    }}>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '76px 32px 0',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 'clamp(48px, 7.5vw, 92px)', fontWeight: 700, margin: 0,
          letterSpacing: '-0.035em', lineHeight: 1.02,
          background: 'var(--hm-title-grad)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          animation: `hmFloatIn 700ms ${EASE} 80ms backwards`,
        }}>
          AB Investment
        </h1>
        {/* Live weekly stats */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          gap: 'clamp(28px, 6vw, 72px)', marginTop: 44, flexWrap: 'wrap',
          animation: `hmFloatIn 700ms ${EASE} 260ms backwards`,
        }}>
          <HeroStat
            label="Объём за неделю"
            value={WEEK_STATS.trackedUSD}
            format={(v) => fmtUSD(v)}
            accent="#38BDF8"
            delay={300}
          />
          <HeroStat
            label="Потоков капитала"
            value={WEEK_STATS.flowCount}
            format={(v) => Math.round(v)}
            accent="#2FD9C4"
            delay={420}
          />
          <HeroStat
            label="Секторов в движении"
            value={WEEK_STATS.sectorCount}
            format={(v) => Math.round(v)}
            accent="#8E9BE6"
            delay={540}
          />
          <HeroStat
            label="Активных сигналов"
            value={WEEK_STATS.signalCount}
            format={(v) => Math.round(v)}
            accent="#F5B942"
            delay={660}
          />
        </div>

        {/* Quick nav */}
        <div style={{
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10,
          marginTop: 46,
          animation: `hmFloatIn 700ms ${EASE} 380ms backwards`,
        }}>
          <NavChip label="Карта потоков" color="#38BDF8" filled onClick={() => openResearch('capital-flow-map')} />
          <NavChip label="Холдинги" color="#2FD9C4" onClick={() => openResearch('holdings')} />
          <NavChip label="Цепочка поставок" color="#22D3EE" onClick={() => openResearch('data-centers-ai')} />
          <NavChip label="Прокси" color="#F59E0B" onClick={() => openResearch('proxy')} />
          <NavChip label="VC-трекер" color="#9A8FD2" onClick={() => onChoose('tracker')} />
          <NavChip label="Исследования" color="#8E9BE6" onClick={() => onChoose('research')} />
        </div>
      </div>

      {/* ── Blocks ─────────────────────────────────────────────────────── */}
      <div style={{ marginTop: SECTION_GAP }}>
        {/* A row click carries its flow id → the map opens on that deal. */}
        <CapitalFlowsHome
          onOpen={(flowId) => openResearch(
            'capital-flow-map',
            typeof flowId === 'string' ? { flowId } : null,
          )}
        />
      </div>

      <div style={{ marginTop: SECTION_GAP }}>
        <HoldingsHome onOpen={() => openResearch('holdings')} />
      </div>

      <div style={{ marginTop: SECTION_GAP }}>
        <SupplyChainHome onOpen={() => openResearch('data-centers-ai')} />
      </div>

      {/* ── Footer nav ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: `${SECTION_GAP}px auto 0`, padding: '0 32px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16,
        }}>
          <FooterTile
            mark={<TrackerMark />}
            title="VC-трекер"
            desc="Живой мониторинг венчурной позиции — сигналы, скоринг, коммуникации синдиката."
            accent="#9A8FD2"
            onClick={() => onChoose('tracker')}
            delay={0}
          />
          <FooterTile
            mark={<LibraryMark />}
            title="Библиотека исследований"
            desc="Все глубокие отчёты — секторы, тезисы и полная карта портфеля."
            accent="#8E9BE6"
            onClick={() => onChoose('research')}
            delay={90}
          />
          <FooterTile
            mark={<ProxyMark />}
            title="Прокси"
            desc="Доступ к частному AI через публичные холдинги — окна входа, концентрация, проекции."
            accent="#F59E0B"
            onClick={() => openResearch('proxy')}
            delay={180}
          />
        </div>
      </div>

      {/* ── Theme tokens + shared keyframes for the whole landing ──────── */}
      <style>{`
        .hm-root {
          --hm-page-bg:
            radial-gradient(1000px 520px at 18% -10%, rgba(56,189,248,0.07) 0%, transparent 60%),
            radial-gradient(900px 480px at 85% 8%, rgba(47,217,196,0.05) 0%, transparent 60%),
            #0A0A0B;
          --hm-bg: #0A0A0B;
          --hm-fade0: rgba(10,10,11,0);
          --hm-text: #fafafa;
          --hm-text2: #d4d4d8;
          --hm-text3: #a1a1aa;
          --hm-text4: #8b8b95;
          --hm-text5: #71717a;
          --hm-text6: #52525b;
          --hm-rank: #3f3f46;
          --hm-surface: rgba(255,255,255,0.015);
          --hm-chip: rgba(255,255,255,0.03);
          --hm-chip2: rgba(255,255,255,0.05);
          --hm-card-strong: rgba(15,15,17,0.9);
          --hm-solid: rgba(24,24,27,0.9);
          --hm-hair: rgba(255,255,255,0.06);
          --hm-border: rgba(255,255,255,0.07);
          --hm-border2: rgba(255,255,255,0.09);
          --hm-border3: rgba(255,255,255,0.10);
          --hm-border4: rgba(255,255,255,0.12);
          --hm-border5: rgba(255,255,255,0.14);
          --hm-tile: #131316;
          --hm-tile-border: rgba(255,255,255,0.08);
          --hm-title-grad: linear-gradient(180deg, #fafafa 10%, #8b8b95 100%);
          --hm-scroll: #27272a;
          --hm-scroll2: #3f3f46;
          --hm-wave-boost: 1;
        }
        .hm-root[data-theme="light"] {
          --hm-page-bg:
            radial-gradient(1000px 520px at 18% -10%, rgba(2,132,199,0.10) 0%, transparent 60%),
            radial-gradient(900px 480px at 85% 8%, rgba(13,148,136,0.08) 0%, transparent 60%),
            #F4F7FB;
          --hm-bg: #F4F7FB;
          --hm-fade0: rgba(244,247,251,0);
          --hm-text: #0F172A;
          --hm-text2: #334155;
          --hm-text3: #475569;
          --hm-text4: #5D6B80;
          --hm-text5: #64748B;
          --hm-text6: #94A3B8;
          --hm-rank: #C3CEDB;
          --hm-surface: #FFFFFF;
          --hm-chip: #FFFFFF;
          --hm-chip2: #EEF2F7;
          --hm-card-strong: #FFFFFF;
          --hm-solid: rgba(255,255,255,0.94);
          --hm-hair: rgba(15,23,42,0.08);
          --hm-border: rgba(15,23,42,0.10);
          --hm-border2: rgba(15,23,42,0.12);
          --hm-border3: rgba(15,23,42,0.14);
          --hm-border4: rgba(15,23,42,0.18);
          --hm-border5: rgba(15,23,42,0.22);
          --hm-tile: #EDF1F7;
          --hm-tile-border: rgba(15,23,42,0.10);
          --hm-title-grad: linear-gradient(180deg, #0F172A 15%, #46628A 100%);
          --hm-scroll: #CBD5E1;
          --hm-scroll2: #94A3B8;
          --hm-wave-boost: 1.7;
        }
        @keyframes hmFloatIn {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hmWaveDrift {
          from { transform: translateX(0); }
          to   { transform: translateX(-1200px); }
        }
        @keyframes hmFlowDash {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -160; }
        }
        @keyframes hmPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
        @keyframes hmSparkDraw {
          from { stroke-dashoffset: 1; }
          to   { stroke-dashoffset: 0; }
        }
        .hm-spark-line {
          stroke-dasharray: 1;
          animation: hmSparkDraw 1400ms cubic-bezier(0.2, 0.8, 0.2, 1) 200ms backwards;
        }
        .hm-spark-area {
          animation: hmFloatIn 900ms cubic-bezier(0.2, 0.8, 0.2, 1) 500ms backwards;
        }
        .hm-spark-dot {
          animation: hmPulse 2.4s ease-in-out infinite;
        }
        .hm-news-scroll::-webkit-scrollbar { width: 4px; }
        .hm-news-scroll::-webkit-scrollbar-track { background: transparent; }
        .hm-news-scroll::-webkit-scrollbar-thumb { background: var(--hm-scroll); border-radius: 4px; }
        .hm-news-scroll::-webkit-scrollbar-thumb:hover { background: var(--hm-scroll2); }
        @media (max-width: 900px) {
          .hm-holdings-grid { grid-template-columns: 1fr !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  );
}
