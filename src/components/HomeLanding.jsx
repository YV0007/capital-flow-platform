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
import { Target, BookOpen, TrendingUp } from 'lucide-react';
import CapitalFlowsHome from './home/CapitalFlowsHome.jsx';
import HoldingsHome from './home/HoldingsHome.jsx';
import SupplyChainHome from './home/SupplyChainHome.jsx';
import { WEEK_STATS, GENERATED } from './home/homeData.js';
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
        fontSize: 30, fontWeight: 700, fontFamily: MONO, color: '#fafafa',
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
          : (hovered ? color + '16' : 'rgba(255,255,255,0.03)'),
        color: filled ? '#09090b' : (hovered ? color : '#d4d4d8'),
        border: `1px solid ${filled ? 'transparent' : (hovered ? color + '70' : 'rgba(255,255,255,0.1)')}`,
        transition: `all 220ms ${EASE}`,
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {label}
      <span style={{ fontSize: 13, lineHeight: 1, opacity: 0.8 }}>→</span>
    </button>
  );
}

function FooterTile({ icon: Icon, title, desc, accent, onClick, delay }) {
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
          background: hovered ? `linear-gradient(120deg, ${accent}10 0%, rgba(255,255,255,0.02) 70%)` : 'rgba(255,255,255,0.015)',
          border: `1px solid ${hovered ? accent + '50' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 16, padding: '20px 22px', cursor: 'pointer',
          transition: `all 240ms ${EASE}`,
          transform: hovered ? 'translateY(-4px)' : 'none',
          boxShadow: hovered ? `0 18px 36px -20px ${accent}55` : 'none',
        }}
      >
        <span style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          background: `linear-gradient(135deg, ${accent}28 0%, ${accent}0a 100%)`,
          border: `1px solid ${accent}40`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} style={{ color: accent }} strokeWidth={2} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.01em' }}>
            {title}
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: '#8b8b95', lineHeight: 1.45, marginTop: 3 }}>
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

export default function HomeLanding({ onChoose, onOpenResearch }) {
  const openResearch = (id) => (onOpenResearch ? onOpenResearch(id) : onChoose('research'));

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      paddingBottom: 120,
      background:
        'radial-gradient(1000px 520px at 18% -10%, rgba(56,189,248,0.07) 0%, transparent 60%), ' +
        'radial-gradient(900px 480px at 85% 8%, rgba(47,217,196,0.05) 0%, transparent 60%), ' +
        '#0A0A0B',
      overflowX: 'hidden',
    }}>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '76px 32px 0',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 10.5, color: '#71717a', fontFamily: MONO, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.32em', marginBottom: 22,
          animation: `hmFloatIn 700ms ${EASE} backwards`,
        }}>
          Инвестиционная аналитика · неделя {GENERATED}
        </div>
        <h1 style={{
          fontSize: 'clamp(48px, 7.5vw, 92px)', fontWeight: 700, margin: 0,
          letterSpacing: '-0.035em', lineHeight: 1.02,
          background: 'linear-gradient(180deg, #fafafa 10%, #8b8b95 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          animation: `hmFloatIn 700ms ${EASE} 80ms backwards`,
        }}>
          AB Investment
        </h1>
        <div style={{
          fontSize: 14.5, color: '#a1a1aa', margin: '20px auto 0', maxWidth: 560, lineHeight: 1.6,
          animation: `hmFloatIn 700ms ${EASE} 160ms backwards`,
        }}>
          Единое рабочее пространство: кто и куда вкладывает капитал в AI,
          что лежит в портфеле и что стоит изучить следующим.
        </div>

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
        <CapitalFlowsHome onOpen={() => openResearch('capital-flow-map')} />
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
            icon={Target}
            title="VC-трекер"
            desc="Живой мониторинг венчурной позиции — сигналы, скоринг, коммуникации синдиката."
            accent="#9A8FD2"
            onClick={() => onChoose('tracker')}
            delay={0}
          />
          <FooterTile
            icon={BookOpen}
            title="Библиотека исследований"
            desc="Все глубокие отчёты — секторы, тезисы и полная карта портфеля."
            accent="#8E9BE6"
            onClick={() => onChoose('research')}
            delay={90}
          />
          <FooterTile
            icon={TrendingUp}
            title="Прокси"
            desc="Доступ к частному AI через публичные холдинги — окна входа, концентрация, проекции."
            accent="#F59E0B"
            onClick={() => openResearch('proxy')}
            delay={180}
          />
        </div>
      </div>

      {/* ── Shared keyframes for the whole landing ─────────────────────── */}
      <style>{`
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
        .hm-news-scroll::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        .hm-news-scroll::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
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
