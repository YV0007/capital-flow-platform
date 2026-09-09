// ══════════════════════════════════════════════════════════════════════════
// Home · Holdings — top-5 key holdings tracker + merged news feed.
//
// Left: the five core holdings with live 1Y sparklines (drawn-in on reveal),
// price and change; hover surfaces the one-line thesis. Right: the news
// feed merged across every holdings-v2 company file, newest first — new
// updates posted to those files show up here automatically.
// Everything routes into the full Holdings page.
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { TOP_HOLDINGS, HOLDINGS_NEWS } from './homeData.js';
import { useT, useL } from '../../lib/i18n.jsx';
import { SectionHeader, LogoTile, Reveal, MONO, EASE } from './ui.jsx';

// Deeper green/red than the zinc-dark originals — hold contrast on both themes.
const UP = '#10B981';
const DOWN = '#EF4444';

function Sparkline({ points, down, id }) {
  if (!points.length) return null;
  const w = 150; const h = 40; const pad = 3;
  const min = Math.min(...points); const max = Math.max(...points);
  const span = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1 || 1);
  const xy = points.map((p, i) => [
    pad + i * step,
    h - pad - ((p - min) / span) * (h - pad * 2),
  ]);
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${xy[xy.length - 1][0].toFixed(1)},${h} L${pad},${h} Z`;
  const color = down ? DOWN : UP;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: 170, height: h, display: 'block' }} aria-hidden="true">
      <defs>
        <linearGradient id={`hmSpark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#hmSpark-${id})`} className="hm-spark-area" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        pathLength="1"
        className="hm-spark-line"
      />
      <circle cx={xy[xy.length - 1][0]} cy={xy[xy.length - 1][1]} r="2.6" fill={color} className="hm-spark-dot" />
    </svg>
  );
}

function HoldingRow({ h, index, onOpen }) {
  const t = useT();
  const L = useL();
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={index * 80}>
      <button
        onClick={onOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'block', width: '100%', textAlign: 'left', font: 'inherit',
          background: hovered ? `linear-gradient(90deg, ${h.accent}0d 0%, var(--hm-surface) 65%)` : 'var(--hm-surface)',
          border: `1px solid ${hovered ? h.accent + '45' : 'var(--hm-border)'}`,
          borderRadius: 14, padding: '14px 18px', cursor: 'pointer',
          transition: `all 240ms ${EASE}`,
          transform: hovered ? 'translateX(4px)' : 'none',
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: '18px 34px minmax(120px, 1.1fr) minmax(110px, 1fr) auto',
          alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: hovered ? h.accent : 'var(--hm-rank)', transition: 'color 200ms' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <LogoTile src={h.logo} mono={h.monogram} color={h.accent} size={34} radius={9} />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--hm-text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {h.name}
            </span>
            <span style={{ display: 'block', fontSize: 10, fontFamily: MONO, color: 'var(--hm-text5)', letterSpacing: '0.04em', marginTop: 2 }}>
              {h.ticker} · {L(h.type)}
            </span>
          </span>
          <Sparkline points={h.points} down={h.down} id={h.id} />
          <span style={{ textAlign: 'right', minWidth: 84 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 700, fontFamily: MONO, color: 'var(--hm-text)', letterSpacing: '-0.01em' }}>
              {h.price}
            </span>
            <span style={{
              display: 'inline-block', marginTop: 3, padding: '2px 7px', borderRadius: 5,
              fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
              color: h.down ? DOWN : UP,
              background: (h.down ? DOWN : UP) + '14',
            }}>
              {h.change} · {t('год', '1Y')}
            </span>
          </span>
        </div>

        {/* hover thesis line */}
        <div style={{
          maxHeight: hovered ? 74 : 0, overflow: 'hidden', opacity: hovered ? 1 : 0,
          transition: `max-height 300ms ${EASE}, opacity 240ms ${EASE}`,
        }}>
          <div style={{
            marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--hm-border)',
            fontSize: 11.5, color: 'var(--hm-text3)', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {h.tagline}
          </div>
        </div>
      </button>
    </Reveal>
  );
}

function NewsItem({ n, onOpenHoldings }) {
  // Holdings news is hand-written and bilingual: `title`/`text` arrive as
  // { ru, en } pairs. `L()` passes a bare string straight through, so items
  // written before the pairs existed still render.
  const L = useL();
  const [hovered, setHovered] = useState(false);
  const clickable = !!n.url;
  return (
    <button
      onClick={() => {
        if (clickable) window.open(n.url, '_blank', 'noopener,noreferrer');
        else onOpenHoldings();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid', gridTemplateColumns: '10px 1fr', gap: 14,
        width: '100%', textAlign: 'left', font: 'inherit',
        background: 'transparent', border: 'none', cursor: 'pointer',
        padding: '13px 6px', position: 'relative',
      }}
    >
      {/* timeline dot + rail */}
      <span style={{ position: 'relative', display: 'block' }}>
        <span style={{
          position: 'absolute', top: 5, left: 1, width: 7, height: 7, borderRadius: '50%',
          background: n.accent, boxShadow: hovered ? `0 0 8px ${n.accent}` : 'none',
          transition: 'box-shadow 200ms',
        }} />
        <span style={{ position: 'absolute', top: 18, bottom: -14, left: 4, width: 1, background: 'var(--hm-border)' }} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 9.5, fontFamily: MONO, fontWeight: 700, color: n.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {n.holdingName}
          </span>
          <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--hm-text6)' }}>{n.date}</span>
        </span>
        <span style={{
          display: 'block', fontSize: 12.5, fontWeight: 600, lineHeight: 1.4,
          color: hovered ? 'var(--hm-text)' : 'var(--hm-text2)', transition: 'color 180ms',
        }}>
          {L(n.title)}
        </span>
        {n.text && (
          <span style={{
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            fontSize: 11, color: 'var(--hm-text5)', lineHeight: 1.5, marginTop: 3,
          }}>
            {L(n.text)}
          </span>
        )}
      </span>
    </button>
  );
}

export default function HoldingsHome({ onOpen }) {
  const t = useT();
  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
      <Reveal>
        <SectionHeader
          eyebrow={t('Холдинги · пульс портфеля', 'Holdings · portfolio pulse')}
          title={t('Пять ключевых холдингов', 'Five core holdings')}
          sub={t(
            'Что лежит в портфеле — одним взглядом, плюс общая лента новостей по всем девяти холдингам. Свежие обновления появляются здесь первыми.',
            'What sits in the portfolio at a glance, plus one merged news feed across all nine holdings. Fresh updates land here first.')}
          accent="#2FD9C4"
          actionLabel={t('Открыть холдинги', 'Open holdings')}
          onAction={onOpen}
        />
      </Reveal>

      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(280px, 5fr)',
        gap: 24, alignItems: 'start',
      }} className="hm-holdings-grid">
        {/* Top-5 tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TOP_HOLDINGS.map((h, i) => (
            <HoldingRow key={h.id} h={h} index={i} onOpen={onOpen} />
          ))}
        </div>

        {/* News feed */}
        <Reveal delay={140}>
          <div style={{
            background: 'var(--hm-surface)',
            border: '1px solid var(--hm-border)',
            borderRadius: 16, padding: '18px 18px 8px', position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, padding: '0 6px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#2FD9C4',
                  animation: 'hmPulse 2.2s ease-in-out infinite',
                }} />
                <span style={{ fontSize: 10, fontFamily: MONO, fontWeight: 700, color: 'var(--hm-text3)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                  {t('Лента новостей', 'News feed')}
                </span>
              </span>
              <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--hm-text6)' }}>
                {t('все холдинги', 'all holdings')}
              </span>
            </div>

            <div className="hm-news-scroll" style={{ maxHeight: 470, overflowY: 'auto', paddingRight: 4 }}>
              {HOLDINGS_NEWS.map((n, i) => (
                <NewsItem key={`${n.holdingId}-${i}`} n={n} onOpenHoldings={onOpen} />
              ))}
            </div>

            {/* bottom fade + CTA */}
            <div style={{
              position: 'absolute', left: 1, right: 1, bottom: 1, height: 64, borderRadius: '0 0 16px 16px',
              background: 'linear-gradient(180deg, var(--hm-fade0) 0%, var(--hm-bg) 85%)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none',
            }}>
              <button
                onClick={onOpen}
                style={{
                  pointerEvents: 'auto', marginBottom: 10,
                  background: 'var(--hm-solid)', border: '1px solid #2FD9C440',
                  borderRadius: 999, padding: '6px 16px', cursor: 'pointer',
                  fontSize: 10, fontFamily: MONO, fontWeight: 700, color: '#2FD9C4',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  transition: 'border-color 200ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2FD9C490'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2FD9C440'; }}
              >
                {t('Все обновления', 'All updates')} →
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
