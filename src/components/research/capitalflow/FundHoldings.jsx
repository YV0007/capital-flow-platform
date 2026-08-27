// Fund portfolio — the "what does this fund actually own" view, funds only.
//
// Following smart money only works if you can see the EXACT companies a fund
// backs — the sector, the sub-sector, the specific bet. The map shows capital
// flowing INTO a fund (LP money); this view shows where that fund deploys it.
//
// ENGINE-OWNED. Holdings are FACTS (name, sector, what it does, source), so they
// come from `node.holdings[]` in the payload — never collected or guessed
// dashboard-side. A fund with no holdings yet renders an honest empty state and
// is an engine coverage gap, reported back, not hand-filled.
//
// Shows the top 25 by default (ranked as the engine delivers them, largest /
// most-notable first), grouped by sector, with a "show all" for the full set.

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, Briefcase } from 'lucide-react';
import {
  SECTOR_META, CLASS_META, sectorLabel,
} from '../../../data/capitalMap.js';
import { subsectorLabel } from './subsectors.js';
import { humanizeSourceUrl } from './format.js';
import { useT } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';
const W = 560;
const TOP_N = 20;

export default function FundHoldings({ node, nodeById, onOpenEntity, onBack, onClose, topInset = 0 }) {
  const t = useT();
  const [showAll, setShowAll] = useState(false);
  if (!node) return null;
  const cls = CLASS_META[node.cls];
  const holdings = Array.isArray(node.holdings) ? node.holdings : [];
  const total = node.holdings_count || holdings.length;
  const asOf = node.holdings_as_of || node.referenceAsOf || null;

  // Case-insensitive name → node id, so a holding that is also on the map is
  // clickable through to its own panel.
  const idByName = new Map();
  if (nodeById) nodeById.forEach((n) => idByName.set(n.name?.toLowerCase?.() || n.label?.toLowerCase?.(), n.id));
  const nodeIdFor = (name) => idByName.get(String(name || '').toLowerCase()) || null;

  const shown = showAll ? holdings : holdings.slice(0, TOP_N);

  // Group the shown holdings by sector, heaviest bucket first, so the portfolio
  // reads as "mostly AI-applications + biotech" at a glance.
  const bySector = new Map();
  shown.forEach((h) => {
    const key = h.sector || '_none';
    if (!bySector.has(key)) bySector.set(key, []);
    bySector.get(key).push(h);
  });
  const groups = [...bySector.entries()]
    .map(([key, list]) => ({ key, list }))
    .sort((a, b) => (a.key === '_none') - (b.key === '_none') || b.list.length - a.list.length);

  return (
    <aside style={{
      position: 'absolute', top: topInset, right: 0, bottom: 0, width: W, maxWidth: '92vw', zIndex: 26,
      background: 'var(--cf-panel)',
      borderLeft: '1px solid var(--cf-border)',
      backdropFilter: 'blur(10px)',
      boxShadow: '-24px 0 60px -20px var(--cf-shadow)',
      display: 'flex', flexDirection: 'column',
      animation: 'cfmSlide 220ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--cf-border-soft)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} title={t('Назад к панели объекта', 'Back to the entity panel')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3, padding: '5px 9px 5px 5px',
              background: 'var(--cf-surface2)', border: '1px solid var(--cf-border)', borderRadius: 7,
              color: 'var(--cf-text3)', fontSize: 10, fontFamily: MONO, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text0)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text3)')}>
            <ChevronLeft size={12} /> {t('Назад', 'Back')}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {node.name}
              </span>
              <span style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                {t('ПОРТФЕЛЬ ФОНДА', 'FUND PORTFOLIO')}
              </span>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 2 }}>
              {cls?.label || node.cls}
              {node.sector ? <> · {sectorLabel(node.sector)}</> : null}
              {asOf ? <> · {t('собрано', 'compiled')} {asOf}</> : null}
            </div>
          </div>
          <button onClick={onClose} title={t('Закрыть', 'Close')}
            style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 3, lineHeight: 0, flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 32px' }}>
        {/* Direct link to the fund's own portfolio page (engine-supplied). */}
        {node.portfolio_url && (
          <a href={node.portfolio_url} target="_blank" rel="noopener noreferrer" title={node.portfolio_url}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 14,
              padding: '7px 11px', background: 'var(--cf-surface2)', border: '1px solid var(--cf-border)',
              borderRadius: 8, color: 'var(--cf-link)', fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cf-link-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border)')}>
            <Briefcase size={12} /> {t('Страница портфеля фонда', 'The fund\'s portfolio page')} <ExternalLink size={11} style={{ opacity: 0.6 }} />
          </a>
        )}
        {holdings.length === 0 ? (
          <NoData />
        ) : (
          <>
            <div style={{ fontSize: 10.5, color: 'var(--cf-text4)', fontFamily: MONO, marginBottom: 14 }}>
              {showAll ? t(`Все ${holdings.length}`, `All ${holdings.length}`) : t(`Топ ${Math.min(TOP_N, holdings.length)}`, `Top ${Math.min(TOP_N, holdings.length)}`)} {t('из', 'of')} {total}
              {' '}{t('компаний портфеля', 'portfolio companies')}
              {total > holdings.length ? t(` · движок прислал ${holdings.length}`, ` · the engine shipped ${holdings.length}`) : ''}
            </div>

            {groups.map((g) => {
              const sec = g.key === '_none' ? null : SECTOR_META[g.key];
              return (
                <div key={g.key} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 2, background: sec?.color || 'var(--cf-text7)', flexShrink: 0 }} />
                    <span style={{
                      fontSize: 9, color: 'var(--cf-text5)', fontFamily: MONO, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>
                      {g.key === '_none' ? t('Без сектора', 'No sector') : sectorLabel(g.key)}
                    </span>
                    <span style={{ flex: 1, height: 1, background: 'var(--cf-border-soft)' }} />
                    <span style={{ fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO }}>{g.list.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {g.list.map((h, i) => <HoldingRow key={i} h={h} openId={nodeIdFor(h.name)} onOpenEntity={onOpenEntity} />)}
                  </div>
                </div>
              );
            })}

            {!showAll && holdings.length > TOP_N && (
              <button onClick={() => setShowAll(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  width: '100%', padding: '9px 12px', marginTop: 4,
                  background: 'var(--cf-accent-bg)', border: '1px solid var(--cf-accent-bd)',
                  borderRadius: 9, color: 'var(--cf-accent)', fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
                }}>
                {t('Показать все', 'Show all')} {holdings.length}
              </button>
            )}

            <div style={{ marginTop: 14, fontSize: 9, color: 'var(--cf-text8)', fontFamily: MONO, lineHeight: 1.6 }}>
              {t(`Портфель собран движком из публичных источников (заявки Form D/ADV, 13F, релизы, сайт фонда) и показан как есть.
              Ссылка на каждой строке ведёт к источнику. Ничего не додумано на стороне дашборда.`,
                 `The portfolio is compiled by the engine from public sources (Form D/ADV filings, 13F, releases, the fund's own site) and rendered as-is.
              Every row links to its source. Nothing is inferred on the dashboard side.`)}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

// One portfolio company: name (clickable if it's on the map), a sector/sub-sector
// tag, a one-line note, and the source link. All engine-supplied.
function HoldingRow({ h, openId, onOpenEntity }) {
  const t = useT();
  const sec = h.sector ? SECTOR_META[h.sector] : null;
  const sub = h.subsector ? subsectorLabel(h.subsector) : null;
  const clickable = !!openId;
  return (
    <div
      onClick={() => clickable && onOpenEntity(openId)}
      title={clickable ? t(`Открыть ${h.name}`, `Open ${h.name}`) : ''}
      style={{
        padding: '8px 10px', borderRadius: 8,
        background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)',
        cursor: clickable ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => { if (clickable) e.currentTarget.style.borderColor = 'var(--cf-border-strong)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--cf-border-soft)'; }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cf-text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          {h.name}
        </span>
        {clickable && <ChevronRight size={11} color="var(--cf-text7)" style={{ flexShrink: 0, alignSelf: 'center' }} />}
        <span style={{ flex: 1 }} />
        {sub && (
          <span style={{ fontSize: 9, color: sec?.color || 'var(--cf-text5)', fontFamily: MONO, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {sub}
          </span>
        )}
        {h.source_url && (
          <a href={humanizeSourceUrl(h.source_url)} target="_blank" rel="noopener noreferrer" title={humanizeSourceUrl(h.source_url)}
            onClick={(e) => e.stopPropagation()}
            style={{ color: 'var(--cf-link)', lineHeight: 0, flexShrink: 0 }}>
            <ExternalLink size={11} />
          </a>
        )}
      </div>
      {h.note && (
        <div style={{ fontSize: 10.5, color: 'var(--cf-text4)', lineHeight: 1.5, marginTop: 3 }}>{h.note}</div>
      )}
    </div>
  );
}

function plural(n, [one, few, many]) {
  const a = Math.abs(Math.round(n)); const d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one; if (d >= 2 && d <= 4) return few; return many;
}

function NoData() {
  const t = useT();
  return (
    <div style={{
      padding: '14px 16px', background: 'var(--cf-surface1)', border: '1px dashed var(--cf-border)', borderRadius: 10,
      fontSize: 12, color: 'var(--cf-text5)', fontFamily: MONO, lineHeight: 1.6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, color: 'var(--cf-text4)' }}>
        <Briefcase size={13} /> {t('Портфель ещё не собран', 'Portfolio not compiled yet')}
      </div>
      {t(`Движок пока не прислал список компаний этого фонда. Это пробел покрытия на стороне движка —
      мы не заполняем его вручную. Появится в данных — отобразится здесь автоматически.`,
         `The engine has not shipped this fund's company list yet. That is a coverage gap on the engine side —
      not one we fill by hand. When it lands in the data it appears here automatically.`)}
    </div>
  );
}
