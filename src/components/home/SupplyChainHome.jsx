// ══════════════════════════════════════════════════════════════════════════
// Home · Data-center supply chain — auto-advancing preview carousel.
//
// One card per supply-chain bucket (from dc-buckets.json): bucket title,
// its top 1–2 companies, one teaser line, and the coverage count. Cards
// rotate on their own, pause on hover, and any card click routes into the
// full "Data Centers for AI" report.
// ══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react';
import { SUPPLY_CHAIN_CARDS } from './homeData.js';
import { useT, useL, usePlural } from '../../lib/i18n.jsx';
import { SectionHeader, Reveal, MONO, EASE } from './ui.jsx';

const CARD_W = 300;
const GAP = 18;
const STEP = CARD_W + GAP;
const ADVANCE_MS = 4200;

function BucketCard({ card, active, onOpen }) {
  const t = useT();
  const L = useL();
  const p = usePlural();
  const [hovered, setHovered] = useState(false);
  const lift = hovered || active;
  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: CARD_W, flexShrink: 0, textAlign: 'left', font: 'inherit',
        background: lift
          ? `linear-gradient(160deg, ${card.color}12 0%, var(--hm-card-strong) 55%)`
          : 'var(--hm-surface)',
        border: `1px solid ${lift ? card.color + '55' : 'var(--hm-border)'}`,
        borderRadius: 16, padding: 0, overflow: 'hidden', cursor: 'pointer',
        transition: `all 280ms ${EASE}`,
        transform: hovered ? 'translateY(-5px)' : 'none',
        boxShadow: hovered ? `0 20px 40px -18px ${card.color}50` : 'none',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* accent scanline */}
      <span style={{
        display: 'block', height: 3, width: '100%',
        background: `linear-gradient(90deg, ${card.color} 0%, transparent 90%)`,
        opacity: lift ? 1 : 0.45, transition: 'opacity 240ms',
      }} />
      <span style={{ display: 'block', padding: '18px 20px 16px', flex: 1 }}>
        <span style={{
          display: 'block', fontSize: 9.5, fontFamily: MONO, fontWeight: 700,
          color: card.color, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8,
        }}>
          {t('Цепочка поставок', 'Supply chain')}
        </span>
        <span style={{ display: 'block', fontSize: 17, fontWeight: 700, color: 'var(--hm-text)', letterSpacing: '-0.015em', lineHeight: 1.2, marginBottom: 12 }}>
          {L(card.name)}
        </span>

        {card.companies.map((c) => (
          <span key={c.name} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--hm-text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.name}
            </span>
            <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--hm-text5)', whiteSpace: 'nowrap' }}>
              {c.ticker}
            </span>
          </span>
        ))}

        <span style={{ display: 'block', fontSize: 11, color: '#8b8b95', lineHeight: 1.55, marginTop: 10 }}>
          {L(card.teaser)}
        </span>
      </span>
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 20px', borderTop: '1px solid var(--hm-hair)',
        fontSize: 9.5, fontFamily: MONO, color: 'var(--hm-text5)', letterSpacing: '0.05em',
      }}>
        <span>
          {card.companyCount} {p(card.companyCount, ['компания', 'компании', 'компаний'], ['company', 'companies'])}
          {' · '}
          {card.sectorCount} {p(card.sectorCount, ['подсектор', 'подсектора', 'подсекторов'], ['subsector', 'subsectors'])}
        </span>
        <span style={{ color: card.color, fontWeight: 700, opacity: hovered ? 1 : 0.5, transition: 'opacity 200ms' }}>→</span>
      </span>
    </button>
  );
}

export default function SupplyChainHome({ onOpen }) {
  const t = useT();
  const cards = SUPPLY_CHAIN_CARDS;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const viewportRef = useRef(null);
  const [visible, setVisible] = useState(3);

  // How many cards fit — keeps the max index honest on resize.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setVisible(Math.max(1, Math.floor((el.clientWidth + GAP) / STEP)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxIndex = Math.max(0, cards.length - visible);
  const go = useCallback((next) => {
    setIndex((cur) => {
      const target = typeof next === 'function' ? next(cur) : next;
      if (target > maxIndex) return 0;         // wrap around
      if (target < 0) return maxIndex;
      return target;
    });
  }, [maxIndex]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => go((i) => i + 1), ADVANCE_MS);
    return () => clearInterval(timer);
  }, [paused, go]);

  useEffect(() => { if (index > maxIndex) setIndex(maxIndex); }, [index, maxIndex]);

  const Arrow = ({ dir }) => (
    <button
      onClick={() => go((i) => i + dir)}
      aria-label={dir > 0 ? 'Next' : 'Previous'}
      style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: 'var(--hm-chip)', border: '1px solid var(--hm-border3)',
        color: 'var(--hm-text3)', fontSize: 15, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 180ms',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--hm-text)'; e.currentTarget.style.borderColor = 'var(--hm-border5)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--hm-text3)'; e.currentTarget.style.borderColor = 'var(--hm-border3)'; }}
    >
      {dir > 0 ? '→' : '←'}
    </button>
  );

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
      <Reveal>
        <SectionHeader
          eyebrow={t('Дата-центры · цепочка поставок', 'Data centers · supply chain')}
          title={t('AI-инфраструктура, слой за слоем', 'AI infrastructure, layer by layer')}
          sub={t(
            'Девять слоёв — от электроэнергии до софта, который всё это окупает. Откройте карточку, чтобы увидеть полный разбор: компании, зависимости, узкие места.',
            'Nine layers, from the electricity to the software that pays for all of it. Open a card for the full breakdown: companies, dependencies, bottlenecks.')}
          accent="#22D3EE"
          actionLabel={t('Открыть цепочку поставок', 'Open the supply chain')}
          onAction={onOpen}
        />
      </Reveal>

      <Reveal delay={100}>
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            ref={viewportRef}
            style={{ overflow: 'hidden', margin: '0 -4px', padding: '4px 4px 8px' }}
          >
            <div style={{
              display: 'flex', gap: GAP,
              transform: `translateX(${-index * STEP}px)`,
              transition: `transform 620ms ${EASE}`,
            }}>
              {cards.map((c, i) => (
                <BucketCard
                  key={c.key}
                  card={c}
                  active={i === index}
                  onOpen={onOpen}
                />
              ))}
            </div>
          </div>

          {/* controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: maxIndex + 1 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  style={{
                    width: i === index ? 22 : 7, height: 7, borderRadius: 999,
                    background: i === index ? '#22D3EE' : 'var(--hm-rank)',
                    border: 'none', cursor: 'pointer', padding: 0,
                    transition: `all 300ms ${EASE}`,
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Arrow dir={-1} />
              <Arrow dir={1} />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
