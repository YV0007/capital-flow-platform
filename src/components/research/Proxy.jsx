// Proxy — research report on public-market proxy trades for SpaceX, OpenAI
// and Anthropic. Six analytical blocks. Mirrors HoldingsTab's visual
// vocabulary (THEMES palette, serif/sans/mono typography, section heads,
// card styling), but uses a single-column layout because the report is
// section-driven, not company-driven.
//
// Russian throughout the UI; tickers, company names, ARR / NAV / IPO and
// the report name "Proxy" stay in Latin script per project memory.

import { useEffect, useRef, useState } from 'react';
import proxyBlocks from '../../data/proxy-blocks.json';

import OwnershipBlock from './proxy/OwnershipBlock.jsx';
import WindowBlock from './proxy/WindowBlock.jsx';
import TopProxiesBlock from './proxy/TopProxiesBlock.jsx';
import ProjectionBlock from './proxy/ProjectionBlock.jsx';
import LateBlock from './proxy/LateBlock.jsx';
import CircularBlock from './proxy/CircularBlock.jsx';

// ─── Theme tokens ────────────────────────────────────────────────
// Mirror Holdings' dark palette token-for-token so the Proxy report reads
// in the same "research-report" voice as Holdings. The accent (`teal` slot)
// is rebound to the Proxy report's warm amber (#F59E0B) so all teal-coloured
// affordances in shared component patterns pick up the new tone.
export const C = {
  paper:    '#100F0D',
  card:     '#1A1916',
  cardAlt:  '#22201B',
  ink:      '#ECE9E1',
  inkSoft:  '#A39E92',
  inkFaint: '#706B61',
  line:     '#2C2A25',
  lineSoft: '#232220',
  track:    '#232220',
  // Accent rebound to amber for the Proxy report.
  teal:     '#F59E0B',
  violet:   '#A78BFA',
  clay:     '#E08A5E',
  gold:     '#CBAA52',
  blue:     '#5BA6E2',
  emerald:  '#46C29B',
  rose:     '#EF6F6F',
  unlisted: '#33312B',
  isDark:   true,
};

// ─── Shared atoms (mirror HoldingsTab counterparts) ───────────────
export function SectionHead({ n, title, sub, action }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: C.teal, marginBottom: 4 }}>Layer {n}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 27, fontWeight: 500, color: C.ink, margin: 0, letterSpacing: '-.01em' }}>{title}</h2>
        <span style={{ fontSize: 13, color: C.inkFaint, fontStyle: 'italic' }}>— {sub}</span>
        {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
      </div>
      <div style={{ height: 1, background: C.line, marginTop: 14 }} />
    </div>
  );
}

export const subLabel = { fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 10 };
export const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: '16px 18px' };

export default function Proxy() {
  const [active, setActive] = useState(proxyBlocks.sections[0].id);
  const refs = useRef({});

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-30% 0px -60% 0px' },
    );
    proxyBlocks.sections.forEach((sec) => {
      const el = refs.current[sec.id];
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const go = (id) => refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div style={{ background: C.paper, minHeight: '100vh', fontFamily: 'var(--sans)', color: C.ink, transition: 'background .25s' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Hanken+Grotesk:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        :root{ --serif:'Newsreader',Georgia,serif; --sans:'Hanken Grotesk',system-ui,sans-serif; --mono:'IBM Plex Mono',ui-monospace,monospace; }
        *{box-sizing:border-box;} body{margin:0;}
        @keyframes rise{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}} .rise{animation:rise .5s cubic-bezier(.2,.7,.2,1) both;}
        .navlink{transition:color .15s,border-color .15s;cursor:pointer;}`}</style>

      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '224px 1fr' }}>
        {/* Sticky section nav */}
        <aside style={{ position: 'sticky', top: 0, height: '100vh', padding: '36px 22px 36px 30px', borderRight: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 8 }}>Отчёт</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: C.ink, lineHeight: 1.2, marginBottom: 6 }}>Proxy</div>
          <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 26, lineHeight: 1.4 }}>Данные на {proxyBlocks.asOf}</div>

          <nav>
            {proxyBlocks.sections.map((sec) => {
              const on = active === sec.id;
              return (
                <div key={sec.id} className="navlink" onClick={() => go(sec.id)}
                  style={{ padding: '9px 0 9px 14px', borderLeft: `2px solid ${on ? C.teal : C.line}`, marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: on ? C.teal : C.inkFaint }}>{sec.n}</span>
                    <span style={{ fontSize: 14, fontWeight: on ? 600 : 400, color: on ? C.ink : C.inkSoft }}>{sec.title}</span>
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main style={{ padding: '40px 44px 80px' }}>
          <header className="rise" style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkSoft, marginBottom: 14 }}>
              <span>Конгломераты / Прокси</span>
              <span style={{ color: C.inkFaint }}>·</span>
              <span>{proxyBlocks.asOf}</span>
            </div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 44, fontWeight: 500, lineHeight: 1.05, letterSpacing: '-.02em', margin: '0 0 14px' }}>Proxy</h1>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.55, color: C.inkSoft, maxWidth: 760, margin: '0 0 26px' }}>
              Карта публичных прокси на SpaceX, OpenAI и Anthropic накануне трёх IPO 2026 года.
              Окно дисконта, концентрация, конгломератный налог и круговые денежные потоки между стратегами и стартапами.
            </p>
          </header>

          {/* 01 OWNERSHIP */}
          <section id="ownership" ref={(e) => (refs.current.ownership = e)} style={{ marginBottom: 54, scrollMarginTop: 24 }}>
            <SectionHead n="01" title={proxyBlocks.sections[0].title} sub={proxyBlocks.sections[0].sub} />
            <OwnershipBlock C={C} card={card} subLabel={subLabel} />
          </section>

          {/* 02 WINDOW */}
          <section id="window" ref={(e) => (refs.current.window = e)} style={{ marginBottom: 54, scrollMarginTop: 24 }}>
            <SectionHead n="02" title={proxyBlocks.sections[1].title} sub={proxyBlocks.sections[1].sub} />
            <WindowBlock C={C} card={card} subLabel={subLabel} />
          </section>

          {/* 03 TOP PROXIES */}
          <section id="top" ref={(e) => (refs.current.top = e)} style={{ marginBottom: 54, scrollMarginTop: 24 }}>
            <SectionHead n="03" title={proxyBlocks.sections[2].title} sub={proxyBlocks.sections[2].sub} />
            <TopProxiesBlock C={C} card={card} subLabel={subLabel} />
          </section>

          {/* 04 PROJECTION */}
          <section id="projection" ref={(e) => (refs.current.projection = e)} style={{ marginBottom: 54, scrollMarginTop: 24 }}>
            <SectionHead n="04" title={proxyBlocks.sections[3].title} sub={proxyBlocks.sections[3].sub} />
            <ProjectionBlock C={C} card={card} subLabel={subLabel} />
          </section>

          {/* 05 LATE */}
          <section id="late" ref={(e) => (refs.current.late = e)} style={{ marginBottom: 54, scrollMarginTop: 24 }}>
            <SectionHead n="05" title={proxyBlocks.sections[4].title} sub={proxyBlocks.sections[4].sub} />
            <LateBlock C={C} card={card} subLabel={subLabel} />
          </section>

          {/* 06 CIRCULAR */}
          <section id="circular" ref={(e) => (refs.current.circular = e)} style={{ marginBottom: 40, scrollMarginTop: 24 }}>
            <SectionHead n="06" title={proxyBlocks.sections[5].title} sub={proxyBlocks.sections[5].sub} />
            <CircularBlock C={C} card={card} subLabel={subLabel} />
          </section>
        </main>
      </div>
    </div>
  );
}
