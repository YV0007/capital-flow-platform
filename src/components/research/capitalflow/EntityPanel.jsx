// Slide-in right panel — the distribution breakdown for one entity.
// Answers: who puts money in here (targets) or where this allocator's money
// goes, how much, in what form, at what confidence. The graph stays live
// underneath.

import { useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Globe, ExternalLink, Search, Linkedin, Building2, Users, ChevronRight, ChevronDown, FileText, Newspaper, Briefcase, Sparkles } from 'lucide-react';
import { fmtUSD, plural, formatSignalThemes } from './format.js';
import {
  SECTOR_META, THEME_META, CLASS_META, NETWORK_META, RULE_META, confidenceBand, sectorLabel,
} from '../../../data/capitalMap.js';
import { subsectorLabel } from './subsectors.js';
import { WatchlistMenu } from './WatchlistControl.jsx';
import { ARCHETYPE_LABEL, RANK_LABEL, RANK_COLOR } from './classification.js';
import { useT, getLang } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';
const W = 380;

// Sum of a flow list when at least one amount is disclosed — else null, so the
// UI can say "undisclosed" instead of a misleading $0.
// Not a component, so it reads the language from the module mirror rather
// than holding a hook.
function totalOrNull(flows, total) {
  return flows.some(f => f.disclosed)
    ? fmtUSD(total)
    : (getLang() === 'en' ? 'undisclosed' : 'не раскрыто');
}

export default function EntityPanel({
  node, inbound, outbound, nodeById,
  selectedFlowId, onSelectFlow, onOpenEntity, onClose, onDeepDive, onFundHoldings, wl, topInset = 0,
  filterSectors,
}) {
  const t = useT();
  if (!node) return null;
  const cls = CLASS_META[node.cls];
  const sec = node.sector ? SECTOR_META[node.sector] : null;
  // Deterministic rank + archetype (classification.js) — NOT the old
  // hand-typed engine tier (no math behind it, ~35 of 68 allocators all
  // landed on "key"). Same system as the map bloom and the table.
  const rankKey = node.type === 'player' ? node.playerRank : node.dealRank;
  const archetype = node.type === 'player' ? node.playerArchetype : node.dealArchetype;
  const rank = rankKey ? {
    label: archetype
      ? `${RANK_LABEL[rankKey] || rankKey} · ${ARCHETYPE_LABEL[archetype]}`
      : (RANK_LABEL[rankKey] || rankKey),
    color: RANK_COLOR[rankKey] || 'var(--cf-text5)',
  } : null;
  const role = node.kind === 'allocator' ? t('Инвестор · вкладывает капитал', 'Allocator · deploys capital') : t('Получатель · привлекает капитал', 'Recipient · raises capital');
  const isAllocator = node.kind === 'allocator';

  return (
    <aside style={{
      position: 'absolute', top: topInset, right: 0, bottom: 0, width: W, zIndex: 25,
      background: 'var(--cf-panel)',
      borderLeft: '1px solid var(--cf-border)',
      backdropFilter: 'blur(10px)',
      boxShadow: '-24px 0 60px -20px var(--cf-shadow)',
      display: 'flex', flexDirection: 'column',
      animation: 'cfmSlide 220ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--cf-border-soft)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%', background: node.color,
            marginTop: 6, flexShrink: 0,
            boxShadow: `0 0 12px ${node.color}80`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
              {node.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {cls?.label || node.cls}{sec ? ` · ${sec.label}` : ''}
            </div>
          </div>
          {wl && <WatchlistMenu wl={wl} entityId={node.id} />}
          <button onClick={onClose} title={t('Закрыть панель', 'Close the panel')}
            style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 3, lineHeight: 0, flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-block', padding: '3px 8px',
            background: 'var(--cf-surface2)', border: '1px solid var(--cf-border)', borderRadius: 5,
            fontSize: 9, color: 'var(--cf-text3)', fontFamily: MONO, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{role}</span>
          {rank && (
            <span title={t('Ранг · стиль — определяется по отбору, повторным ставкам и результату, не по размеру капитала.', 'Rank · style — set by selection, repeat bets and outcome, not by capital size.')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
              background: rank.color + '12', border: `1px solid ${rank.color}38`, borderRadius: 5,
              fontSize: 9, color: rank.color, fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}>{rank.label}</span>
          )}
          {node.country && (
            <span title={t(`Национальная принадлежность — ${node.countryLabel || node.country.toUpperCase()}`,
                           `National affiliation — ${node.countryLabel || node.country.toUpperCase()}`)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px',
              background: 'var(--cf-surface2)', border: '1px solid var(--cf-border)', borderRadius: 5,
              fontSize: 9, color: 'var(--cf-text3)', fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}>
              <img src={`/flags/${node.country}.png`} alt="" style={{ width: 14, height: 'auto', borderRadius: 2, display: 'block' }} />
              {node.countryLabel || node.country.toUpperCase()}
            </span>
          )}
          {node.network && (
            <span title={t(`Участник сети «${NETWORK_META[node.network]?.label || node.network}»`,
                           `Member of the ${NETWORK_META[node.network]?.label || node.network} network`)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
              background: (NETWORK_META[node.network]?.color || '#F5B942') + '18',
              border: `1px solid ${(NETWORK_META[node.network]?.color || '#F5B942')}55`, borderRadius: 5,
              fontSize: 9, color: NETWORK_META[node.network]?.color || '#F5B942', fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}><Users size={10} /> {NETWORK_META[node.network]?.label || node.network}</span>
          )}
          {node.stale && (
            <span title={t('Нет активности 180 дней — остыл, но остаётся в памяти.', 'No activity for 180 days — gone cold, but kept on the map.')} style={{
              display: 'inline-block', padding: '3px 8px',
              background: 'var(--cf-surface2)', border: '1px dashed var(--cf-border-dashed)', borderRadius: 5,
              fontSize: 9, color: 'var(--cf-muted)', fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}>{t('Остыл · 180 дн тишины', 'Cold · 180 days quiet')}</span>
          )}
          {node.watchOnly && (
            <span title={t('Пока только неподтверждённые потоки-кандидаты — по умолчанию скрыт с основной карты.', 'Candidate flows only so far — hidden from the main map by default.')} style={{
              display: 'inline-block', padding: '3px 8px',
              background: 'var(--cf-surface2)', border: '1px dashed var(--cf-border-dashed)', borderRadius: 5,
              fontSize: 9, color: 'var(--cf-text5)', fontFamily: MONO, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}>{t('Наблюдение · не подтверждено', 'Watch · unconfirmed')}</span>
          )}
        </div>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 28px' }}>
        {/* Profile — who/what this is + official link(s) */}
        <ProfileBlock node={node} />

        {/* Deep-dive — allocators only: background, decision logic, track
            record, strategy. Companies (targets) keep the standard panel. */}
        {isAllocator && onDeepDive && (
          <button onClick={() => onDeepDive(node.id)}
            title={t('Расширенный разбор инвестора — бэкграунд, последние инвестиции, трек-рекорд, стратегия', 'The extended allocator breakdown — background, recent investments, track record, strategy')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              width: '100%', padding: '9px 12px', marginBottom: 14,
              background: 'var(--cf-accent-bg)', border: '1px solid var(--cf-accent-bd)',
              borderRadius: 9, color: 'var(--cf-accent)', fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
              transition: 'all 130ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cf-accent-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--cf-accent-bg)'; }}>
            {t('Подробный разбор', 'Detailed breakdown')} <ChevronRight size={12} />
          </button>
        )}

        {/* Portfolio — any node that plausibly HOLDS a portfolio, not only
            funds: allocator vehicles that deploy capital (VC / alt-manager /
            corporate / sovereign) AND fund/firm targets AND any node the
            engine already ships holdings/portfolio-URL for. Individuals are
            excluded — their tracked deals live in the flow list below.
            Missing data → the block's own honest empty state so the receiver
            is at least mentioned, not silently hidden. */}
        {((isAllocator && node.cls !== 'individual')
            || node.cls === 'fund' || node.cls === 'firm'
            || (node.holdings && node.holdings.length > 0)
            || node.portfolio_url
            /* target|private named "* Holdings" is almost always a holding
               vehicle (Thrive Holdings, Volta Infra Holdings). Engine
               classifies them as `private` today — catch them here so the
               portfolio block at least appears with its empty state. */
            || (node.kind === 'target' && node.cls === 'private'
                && /\bHoldings?\b/i.test(node.name || node.label || ''))) && (
          <FundPortfolioBlock node={node} nodeById={nodeById}
            onOpenEntity={onOpenEntity} onFundHoldings={onFundHoldings} />
        )}

        {/* Totals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {/* capital 0 with deals on file = every amount undisclosed, not zero */}
          <Stat
            label={t('Капитал', 'Capital')}
            value={node.capital > 0 ? fmtUSD(node.capital) : node.degree > 0 ? '—' : '$0'}
            sub={node.capital > 0 ? (isAllocator ? t('вложено', 'deployed') : t('получено', 'received')) : node.degree > 0 ? t('суммы не раскрыты', 'amounts undisclosed') : t('ничего не отслежено', 'nothing tracked')}
            color={node.capital > 0 ? (isAllocator ? 'var(--cf-gold)' : 'var(--cf-green2)') : 'var(--cf-text5)'}
          />
          <Stat label={t('Сделки', 'Deals')} value={String(node.deals)} sub={`${node.degree} ${plural(node.degree, ['поток', 'потока', 'потоков'])} отслежено`} color="var(--cf-text1)" />
        </div>

        {/* Activity window */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          padding: '8px 11px', background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 9,
          fontSize: 10, fontFamily: MONO,
        }}>
          <span style={{ color: 'var(--cf-text7)' }}>{t('АКТИВЕН', 'ACTIVE')}</span>
          <span style={{ color: 'var(--cf-text3)' }}>{node.first_seen}</span>
          <span style={{ color: 'var(--cf-text9)' }}>→</span>
          <span style={{ color: 'var(--cf-text3)' }}>{node.last_activity}</span>
        </div>

        {(node.playerParts || node.dealParts) && <ClassificationBlock node={node} />}

        {/* Entity-level signals — an engine rule fired specifically on THIS
            node (stealth_accumulation, beneficiary_concentration, ...), not
            just its sector zone. Empty until the engine ships entity_id. */}
        {Array.isArray(node.signals) && node.signals.length > 0 && (
          <EntitySignalsBlock signals={node.signals} onOpenEntity={onOpenEntity} />
        )}

        {/* Landmark consortium — a dashboard heuristic (deterministic count of
            distinct institutional backers), NOT an engine signal. Explains the
            red cloud when the engine hasn't (yet) flagged this convergence. */}
        {node.landmark && node.dealParts?.consortium >= 4 && (
          <div style={{
            marginBottom: 14, padding: '11px 12px', borderRadius: 10,
            background: 'rgba(248,113,113,0.10)',
            border: '1px solid rgba(248,113,113,0.42)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 9,
              color: '#F87171', fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              <Sparkles size={11} /> {t('Схождение сети', 'Network convergence')}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--cf-text2)', lineHeight: 1.5, marginTop: 6 }}>
              {t('На эту сделку сошлись', 'This deal drew')} <b style={{ color: 'var(--cf-text0)' }}>{node.dealParts.consortium}</b>{' '}
              {plural(node.dealParts.consortium, ['крупный институциональный инвестор', 'крупных институциональных инвестора', 'крупных институциональных инвесторов'], ['major institutional allocator', 'major institutional allocators'])} —
              {t('редкая концентрация капитала.', 'a rare concentration of capital.')}
            </div>
            <div style={{ fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, marginTop: 6, letterSpacing: '0.02em' }}>
              {t('наша эвристика · не сигнал движка', 'our heuristic · not an engine signal')}
            </div>
          </div>
        )}

        {inbound.length > 0 && (
          <Section title={`${t('Кто инвестирует сюда', 'Who invests here')} · ${totalOrNull(inbound, node.totalInflow)}`}
            hint={t('Клик по имени открывает объект. Клик по иконке — разбор сделки.', 'Clicking a name opens the entity. Clicking the icon opens the deal breakdown.')}
            icon={<ArrowDownLeft size={11} color="var(--cf-good)" />}>
            <FlowList
              flows={inbound} counterpartyKey="sourceId"
              nodeById={nodeById} selectedFlowId={selectedFlowId}
              onSelectFlow={onSelectFlow} onOpenEntity={onOpenEntity}
            />
          </Section>
        )}

        {outbound.length > 0 && (
          <Section title={`${t('Куда идут его деньги', 'Where its money goes')} · ${totalOrNull(outbound, node.totalOutflow)}`}
            hint={t('Клик по имени открывает объект. Клик по иконке — разбор сделки.', 'Clicking a name opens the entity. Clicking the icon opens the deal breakdown.')}
            icon={<ArrowUpRight size={11} color="#F59E0B" />}>
            <FlowList
              flows={outbound} counterpartyKey="targetId"
              nodeById={nodeById} selectedFlowId={selectedFlowId}
              onSelectFlow={onSelectFlow} onOpenEntity={onOpenEntity}
              filterSectors={filterSectors}
            />
          </Section>
        )}

        {inbound.length === 0 && outbound.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--cf-text7)', fontFamily: MONO, fontStyle: 'italic' }}>
            {t('По этому объекту пока нет отслеженных потоков.', 'No tracked flows for this entity yet.')}
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Profile: who/what this is + a link ──────────────────────────────────
// Description + link come from the engine data if present, else the dashboard
// reference file. When neither has a verified link we show a Search fallback
// (never a guessed URL).
function ProfileBlock({ node }) {
  const t = useT();
  const links = node.links || [];
  // Allocators carry a SEPARATE, richer profile block (engineProfile —
  // background/focus/style/thesis, resolved from the engine's
  // allocators[name].profile) alongside the generic node.description. This
  // panel used to only ever look at node.description, so an allocator with a
  // full researched profile (e.g. Founders Fund) but no generic description
  // showed "no profile on file" even though real prose was one field away —
  // it's surfaced in full via "Подробный разбор" but never reached here.
  const description = node.description || node.engineProfile?.background || null;
  const hasProfile = !!description || links.length > 0;
  // No `website`-kind link on file. This is the common, EXPECTED case for a
  // stealth company (e.g. Cathedral) that still has news coverage — without a
  // tag here it reads as a missing/broken link rather than "no site exists".
  const hasWebsite = links.some(l => l.kind === 'website');
  return (
    <div style={{
      marginBottom: 16, padding: '11px 12px',
      background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 10,
    }}>
      <div style={{
        fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7,
      }}>
        {node.profileType === 'person' ? t('Кто это', 'Who this is')
          : node.profileType === 'project' ? t('Что это', 'What this is')
          : node.profileType === 'fund' ? t('О фонде', 'About the fund') : t('Описание', 'Description')}
      </div>

      <div style={{ fontSize: 12.5, color: description ? 'var(--cf-text2)' : 'var(--cf-text6)', lineHeight: 1.6, fontStyle: description ? 'normal' : 'italic' }}>
        {description || t('Профиля в данных пока нет — найдите через поиск ниже.', 'No profile in the data yet — use the search below.')}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 }}>
        {links.map((l, i) => <LinkChip key={i} link={l} />)}
        {links.length === 0 && (
          <LinkChip link={{ kind: 'search', label: t(`Искать «${node.name}»`, `Search for “${node.name}”`), url: node.searchUrl }} />
        )}
        {/* There's coverage (news/other links) but no official site — a stealth
            company, not a broken/missing link. Called out inline so it isn't
            mistaken for a data gap. */}
        {links.length > 0 && !hasWebsite && (
          <span title={t('Компания работает в стелс-режиме — публичного сайта пока нет.', 'The company is in stealth — no public site yet.')} style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 8px', fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 600,
            background: 'var(--cf-surface2)', border: '1px dashed var(--cf-border-dashed)', borderRadius: 6,
            cursor: 'help', whiteSpace: 'nowrap',
          }}>{t('Стелс · нет сайта', 'Stealth · no site')}</span>
        )}
      </div>

      {/* Why some entities show a search box instead of a link: we only ever
          link a URL we hold on file — private offices and stealth companies
          usually have none, and a guessed URL is worse than no URL. */}
      {links.length === 0 && (
        <div style={{ marginTop: 8, fontSize: 9, color: 'var(--cf-text8)', fontFamily: MONO, lineHeight: 1.55 }}>
          {hasProfile
            ? t('Официального сайта в данных нет — частная структура или без публичного сайта. Мы ищем, а не угадываем адрес.', 'No official site in the data — a private vehicle, or simply no public site. We search rather than guess an address.')
            : t('В данных движка пока нет справки по этому объекту — пробел покрытия на стороне движка, вручную мы его не заполняем.', 'The engine data carries no reference for this entity yet — a coverage gap on the engine side, and not one we fill by hand.')}
        </div>
      )}

      {/* When the engine researched this entity, stamp the date it did so. */}
      {node.referenceAsOf && (
        <div style={{ marginTop: 8, fontSize: 9, color: 'var(--cf-text8)', fontFamily: MONO }}>
          {t('Исследовано движком', 'Researched by the engine')} · {node.referenceAsOf}
        </div>
      )}
    </div>
  );
}

// ── Fund portfolio (funds only) ─────────────────────────────────────────
// The map shows LP money flowing INTO a fund; this shows where the fund
// deploys it — the exact companies, so smart money can be followed to names.
// Top 5 here; the full portfolio (top 25 + all) is behind the button.
// Holdings are ENGINE-owned facts (`node.holdings[]`); a fund without them
// shows an honest gap, never a hand-filled list.
function FundPortfolioBlock({ node, nodeById, onOpenEntity, onFundHoldings }) {
  const t = useT();
  const holdings = Array.isArray(node.holdings) ? node.holdings : [];
  const total = node.holdings_count || holdings.length;
  const top = holdings.slice(0, 5);
  const idByName = new Map();
  nodeById?.forEach((n) => idByName.set((n.name || n.label || '').toLowerCase(), n.id));

  return (
    <div style={{
      marginBottom: 16, padding: '11px 12px',
      background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 10,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9,
        fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        <Briefcase size={11} color="var(--cf-gold)" /> {t('Портфель фонда', 'Fund portfolio')}
        {total > 0 && <span style={{ color: 'var(--cf-text4)' }}>· {total}</span>}
        {node.portfolio_url && (
          <>
            <span style={{ flex: 1 }} />
            <a href={node.portfolio_url} target="_blank" rel="noopener noreferrer"
              title={t(`Страница портфеля фонда — ${node.portfolio_url}`, `The fund's portfolio page — ${node.portfolio_url}`)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                color: 'var(--cf-link)', textDecoration: 'none', letterSpacing: 0, textTransform: 'none',
                fontWeight: 600,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-link-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-link)')}>
              {t('Страница портфеля', 'Portfolio page')} <ExternalLink size={9} />
            </a>
          </>
        )}
      </div>

      {top.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {top.map((h, i) => {
            const sec = h.sector ? SECTOR_META[h.sector] : null;
            const openId = idByName.get(String(h.name || '').toLowerCase());
            return (
              <div key={i}
                onClick={() => openId && onOpenEntity(openId)}
                title={openId ? t(`Открыть ${h.name}`, `Open ${h.name}`) : (h.note || '')}
                style={{
                  display: 'flex', alignItems: 'baseline', gap: 6, padding: '5px 8px', borderRadius: 6,
                  background: 'var(--cf-surface2)', border: '1px solid var(--cf-border-soft)',
                  cursor: openId ? 'pointer' : 'default',
                }}
                onMouseEnter={(e) => { if (openId) e.currentTarget.style.borderColor = 'var(--cf-border-strong)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--cf-border-soft)'; }}>
                <span style={{ width: 5, height: 5, borderRadius: 2, background: sec?.color || 'var(--cf-text7)', flexShrink: 0, alignSelf: 'center' }} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--cf-text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                  {h.name}
                </span>
                <span style={{ flex: 1 }} />
                {h.subsector && (
                  <span style={{ fontSize: 8.5, color: sec?.color || 'var(--cf-text5)', fontFamily: MONO, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {subsectorLabel(h.subsector)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 10.5, color: 'var(--cf-text5)', fontFamily: MONO, lineHeight: 1.55, fontStyle: 'italic' }}>
          {t('Список компаний фонда движок пока не прислал — появится в данных, отобразим здесь.', 'The engine has not shipped this fund\'s company list yet — when it lands in the data it shows up here.')}
        </div>
      )}

      {onFundHoldings && (
        <button onClick={() => onFundHoldings(node.id)}
          title={t('Полный портфель фонда — все компании', 'The full fund portfolio — every company')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            width: '100%', padding: '8px 12px', marginTop: 10,
            background: 'var(--cf-accent-bg)', border: '1px solid var(--cf-accent-bd)',
            borderRadius: 8, color: 'var(--cf-accent)', fontSize: 10, fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
          }}>
          {total > 5 ? `${t('Все компании фонда', 'All portfolio companies')} · ${total}` : t('Детальный портфель', 'Detailed portfolio')} <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

function LinkChip({ link }) {
  const t = useT();
  const Icon = link.kind === 'website' ? Globe
    : link.kind === 'read_more' ? Newspaper
    : link.kind === 'linkedin' ? Linkedin
    : link.kind === 'firm' ? Building2
    : link.kind === 'search' ? Search
    : ExternalLink;
  // `read_more` carries the publication name as its label — show it as such so
  // the chip reads "Reuters", not a bare "Link".
  const label = link.label || (link.kind === 'x' ? t('X / соцсеть', 'X / social')
    : link.kind === 'website' ? t('Сайт', 'Website')
    : link.kind === 'read_more' ? t('Читать', 'Read') : t('Ссылка', 'Link'));
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" title={link.url}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', background: 'var(--cf-surface2)',
        border: '1px solid var(--cf-border)', borderRadius: 7,
        color: 'var(--cf-text2)', fontSize: 10.5, fontFamily: MONO, fontWeight: 600,
        textDecoration: 'none', cursor: 'pointer', maxWidth: '100%',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cf-link-hover)'; e.currentTarget.style.color = 'var(--cf-text1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--cf-border)'; e.currentTarget.style.color = 'var(--cf-text2)'; }}>
      <Icon size={12} style={{ flexShrink: 0, opacity: 0.85 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {link.kind !== 'search' && <ExternalLink size={10} style={{ flexShrink: 0, opacity: 0.5 }} />}
    </a>
  );
}

// ── Ranked flow list with share bars ────────────────────────────────────
// The ROW is the counterparty: clicking it walks the panel over to that entity
// (the primary intent — "who did they back? show me that company"). The deal
// write-up is a separate, explicit button so the two never fight each other.
//
// The flows are BUCKETED so you can read the shape of the money at a glance,
// and the axis depends on which way the flows point:
//   · OUTBOUND (an allocator's money going out) → by SECTOR — where it lands.
//   · INBOUND  (money coming into a target)     → by allocator CLASS — what
//     KIND of capital backs it (venture vs sovereign vs corporate…).
// Sub-headers are deliberately quiet — a small dot, a muted small-caps label
// and a thin rule — never loud titles. A single-bucket list renders flat.
function FlowList({ flows, counterpartyKey, nodeById, selectedFlowId, onSelectFlow, onOpenEntity, filterSectors }) {
  const t = useT();
  const max = Math.max(...flows.map(f => f.amountUSD), 1);
  const inbound = counterpartyKey === 'sourceId';

  // Group key: the backer's class for inbound, the deal's sector for outbound.
  // `_none` collects anything the payload leaves unlabelled — never dropped.
  const keyOf = (f) => {
    if (inbound) return nodeById.get(f.sourceId)?.cls || '_none';
    return f.sector || '_none';
  };
  const buckets = new Map();
  flows.forEach(f => {
    const key = keyOf(f);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(f);
  });
  const grouped = buckets.size > 1;

  const renderRow = (f) => {
    const cp = nodeById.get(f[counterpartyKey]);
    const on = f.id === selectedFlowId;
    const band = confidenceBand(f.confidence);
    return (
      <div key={f.id}
        onClick={() => cp && onOpenEntity(cp.id)}
        title={cp ? t(`Открыть ${cp.name}`, `Open ${cp.name}`) : ''}
        style={{
          position: 'relative', padding: '8px 10px', borderRadius: 8,
          background: on ? 'var(--cf-surface3)' : 'var(--cf-surface1)',
          border: `1px solid ${on ? f.color + '66' : 'var(--cf-border-soft)'}`,
          cursor: cp ? 'pointer' : 'default', overflow: 'hidden',
          transition: 'border-color 130ms, background 130ms',
        }}
        onMouseEnter={(e) => { if (!on) e.currentTarget.style.borderColor = 'var(--cf-border-strong)'; }}
        onMouseLeave={(e) => { if (!on) e.currentTarget.style.borderColor = 'var(--cf-border-soft)'; }}>
        {/* share bar */}
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${(f.amountUSD / max) * 100}%`,
          background: `linear-gradient(90deg, ${f.color}1f, ${f.color}05)`,
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontSize: 12, fontWeight: 600, color: 'var(--cf-text1)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            minWidth: 0,
          }}>
            {cp ? cp.name : f[counterpartyKey]}
          </span>
          <ChevronRight size={11} color="var(--cf-text7)" style={{ flexShrink: 0, alignSelf: 'center' }} />
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: f.disclosed ? 'var(--cf-text0)' : 'var(--cf-text5)', fontFamily: MONO, flexShrink: 0 }}>
            {f.disclosed ? fmtUSD(f.amount) : '—'}
          </span>
        </div>

        <div style={{
          position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
          marginTop: 5, fontSize: 9.5, fontFamily: MONO,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 2, background: f.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--cf-text3)' }}>{f.eventLabel}</span>
          <span style={{ color: 'var(--cf-text9)' }}>·</span>
          <span style={{ color: 'var(--cf-text5)' }}>{f.date}</span>
          <span style={{ flex: 1 }} />

          {/* confidence as a meter, not a code */}
          {f.confidence != null && (
            <span title={t(`${band.label} — ${f.confidence}/100. Откройте карточку сделки, чтобы увидеть источники.`,
                           `${band.label} — ${f.confidence}/100. Open the deal card to see the sources.`)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'help' }}>
              <span style={{ width: 26, height: 3, borderRadius: 2, background: 'var(--cf-border-soft)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${f.confidence}%`, background: band.color }} />
              </span>
              <span style={{ color: band.color, fontWeight: 700 }}>{f.confidence}</span>
            </span>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onSelectFlow(f.id); }}
            title={on ? t('Скрыть разбор сделки', 'Hide the deal breakdown') : t('Открыть разбор сделки', 'Open the deal breakdown')}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, borderRadius: 5, flexShrink: 0,
              background: on ? f.color + '22' : 'var(--cf-surface3)',
              border: `1px solid ${on ? f.color + '66' : 'var(--cf-border)'}`,
              color: on ? f.color : 'var(--cf-text6)', cursor: 'pointer', padding: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cf-text1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = on ? f.color : 'var(--cf-text6)'; }}>
            <FileText size={11} />
          </button>
        </div>
      </div>
    );
  };

  if (!grouped) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{flows.map(renderRow)}</div>;
  }

  // Heaviest sector first, unsectored last. Within a group, flows keep the
  // amount order they arrived in (already sorted by the adjacency builder).
  // Resolve each bucket's label + dot colour on the correct axis: allocator
  // class (with its plural `zone` name) for inbound, sector for outbound.
  const labelFor = (key) => {
    if (key === '_none') return { label: inbound ? t('Прочие', 'Other') : t('Без сектора', 'No sector'), color: 'var(--cf-text7)' };
    if (inbound) { const m = CLASS_META[key]; return { label: m?.zone || m?.label || key, color: m?.color || 'var(--cf-text7)' }; }
    const m = SECTOR_META[key]; return { label: sectorLabel(key), color: m?.color || 'var(--cf-text7)' };
  };
  const order = [...buckets.entries()]
    .map(([key, list]) => {
      const disclosed = list.some(f => f.disclosed);
      const total = list.reduce((s, f) => s + f.amountUSD, 0);
      return { key, list, disclosed, total, ...labelFor(key) };
    })
    .sort((a, b) => (a.key === '_none') - (b.key === '_none') || b.total - a.total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {order.map((g, gi) => (
        <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <GroupHeader
            label={g.label} color={g.color} count={g.list.length}
            total={g.disclosed ? fmtUSD(g.total) : null} first={gi === 0}
            highlight={!inbound && g.key !== '_none' && !!filterSectors && filterSectors.has(g.key)}
          />
          {g.list.map(renderRow)}
        </div>
      ))}
    </div>
  );
}

// Quiet divider inside a flow list — a small coloured dot, a muted small-caps
// label and a hairline rule. Intentionally understated (не броский): it
// categorises (by sector, or by allocator class) without competing with the
// rows or the section title.
function GroupHeader({ label, color, count, total, first, highlight }) {
  const t = useT();
  const dot = color || 'var(--cf-text7)';
  // When this sector is the one the map is currently filtered on, lift the
  // header out of its quiet default: tint it in the sector colour and flag it
  // «в фильтре», so — after picking an allocator — the deals that fall inside
  // the active filter are unmissable.
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      margin: first ? '0 2px 1px' : '9px 2px 1px',
      ...(highlight ? {
        padding: '3px 7px', borderRadius: 6,
        background: dot + '14', border: `1px solid ${dot}44`,
      } : null),
    }}>
      <span style={{ width: highlight ? 6 : 5, height: highlight ? 6 : 5, borderRadius: 1.5, background: dot, opacity: highlight ? 1 : 0.85, flexShrink: 0 }} />
      <span style={{
        fontSize: 8.5, color: highlight ? dot : 'var(--cf-text4)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.09em', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      {highlight && (
        <span style={{
          fontSize: 7.5, color: dot, fontFamily: MONO, fontWeight: 700,
          letterSpacing: '0.08em', opacity: 0.85, whiteSpace: 'nowrap',
        }}>
          • {t('В ФИЛЬТРЕ', 'IN FILTER')}
        </span>
      )}
      <span style={{ flex: 1, height: 1, background: highlight ? dot + '3a' : 'var(--cf-border-soft)', minWidth: 8 }} />
      <span style={{ fontSize: 8.5, color: highlight ? dot : 'var(--cf-text6)', fontFamily: MONO, fontWeight: 600, whiteSpace: 'nowrap' }}>
        {count}{total ? ` · ${total}` : ''}
      </span>
    </div>
  );
}

function Section({ title, icon, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: hint ? 4 : 8,
        fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {icon}{title}
      </div>
      {hint && (
        <div style={{ fontSize: 9, color: 'var(--cf-text8)', fontFamily: MONO, marginBottom: 8, lineHeight: 1.5 }}>
          {hint}
        </div>
      )}
      {children}
    </div>
  );
}

function Stat({ label, value, sub, color }) {
  const t = useT();
  return (
    <div style={{
      padding: '9px 11px', background: 'var(--cf-surface1)',
      border: '1px solid var(--cf-border-soft)', borderRadius: 9,
    }}>
      <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color, fontFamily: MONO, marginTop: 4, letterSpacing: '-0.01em' }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ── Classification block — WHY this node is (or isn't) highlighted. The
// inspection + tuning surface for the two-rank framework (classification.js).
// Players and targets render different factor sets. Pending factors (dark
// until the engine ships deeper data) are shown greyed, never faked as strong.
// Built from `t` on each render, never frozen at module scope: a t() call in a
// module-level const runs at IMPORT time, before any component can supply `t`,
// and the ReferenceError takes the whole bundle down — a blank page rather than
// a broken panel.
const playerRanks = (t) => ({
  core:  { label: t('Ядро — ключевой инвестор', 'Core — a defining allocator'), color: 'var(--cf-gold)' },
  key:   { label: t('Ключевой — стоит следить', 'Key — worth following'),  color: 'var(--cf-warn)' },
  watch: { label: t('Наблюдение', 'Watch'),                color: 'var(--cf-text5)' },
});
const dealRanks = (t) => ({
  flagged:  { label: t('Флаг — интересная сделка', 'Flagged — an interesting deal'), color: 'var(--cf-gold)' },
  emerging: { label: t('Зарождается', 'Emerging'),              color: 'var(--cf-warn)' },
});
const playerFactors = (t) => [
  ['bellwether', t('Ведёт за собой', 'Leads the way')],
  ['leadTime', t('Опережает толпу', 'Ahead of the crowd')],
  ['focus', t('Фокус / отбор', 'Focus / selection')],
  ['repeat', t('Повторная ставка', 'Repeat conviction')],
  ['overlap', t('Доступность сделок', 'Deal access')],
  ['trackRecord', t('Доказанный результат', 'Proven outcome')],
];
const dealFactors = (t) => [
  ['convergence', t('Схождение капитала', 'Capital convergence')],
  ['early', t('Поймано рано', 'Caught early')],
  ['backerQuality', t('Качество инвесторов', 'Backer quality')],
  ['independence', t('Независимость', 'Independence')],
  ['actionable', t('Доступность', 'Actionability')],
];

// Signals fired specifically on this node (entity_id match) — same evidence
// drill-down affordance as the sector-level version in ClusterReport.jsx, so
// the interaction is consistent wherever a signal shows up.
function EntitySignalsBlock({ signals, onOpenEntity }) {
  const t = useT();
  const [open, setOpen] = useState(null);
  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {signals.map((s, i) => {
        const rule = RULE_META[s.rule];
        const isOpen = open === i;
        const hasEvidence = Array.isArray(s.evidence) && s.evidence.length > 0;
        return (
          <div key={i} style={{
            padding: '9px 11px', borderRadius: 10,
            background: 'var(--cf-warn-bg)', border: '1px solid var(--cf-warn-bd)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={11} color="var(--cf-warn)" />
              <span style={{
                fontSize: 9, color: 'var(--cf-warn)', fontFamily: MONO, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>{rule?.label || s.rule}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--cf-text2)', marginTop: 5, lineHeight: 1.5 }}>
              {formatSignalThemes(s.themes || [s.theme], s.rule, SECTOR_META, THEME_META)}
            </div>
            {rule?.blurb && (
              <div style={{ fontSize: 10.5, color: 'var(--cf-text5)', marginTop: 4, lineHeight: 1.5 }}>{rule.blurb}</div>
            )}
            <button onClick={() => setOpen(isOpen ? null : i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, marginTop: 7,
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                font: 'inherit', fontSize: 10, fontFamily: MONO, fontWeight: 700,
                color: 'var(--cf-warn)', letterSpacing: '0.03em',
              }}>
              {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              {t('Кто именно', 'Exactly who')}
            </button>
            {isOpen && (
              <div style={{ marginTop: 6, paddingTop: 7, borderTop: '1px solid var(--cf-warn-bd)' }}>
                {hasEvidence ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {s.evidence.map((e, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 10.5 }}>
                        {e.allocator
                          ? <button onClick={() => onOpenEntity(e.allocator.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'var(--cf-link)', fontWeight: 600 }}>{e.allocator.name}</button>
                          : <span style={{ color: 'var(--cf-text5)' }}>—</span>}
                        {typeof e.amount_usd === 'number' && (
                          <span style={{ color: 'var(--cf-text5)', fontFamily: MONO }}>{fmtUSD(e.amount_usd)}</span>
                        )}
                        {e.date && <span style={{ color: 'var(--cf-text7)', fontFamily: MONO, fontSize: 9.5 }}>{e.date}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: 'var(--cf-text6)', lineHeight: 1.5 }}>
                    {t('Разбор по именам появится, когда движок начнёт присылать доказательства сигнала.', 'The name-by-name breakdown appears once the engine starts shipping signal evidence.')}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ClassificationBlock({ node }) {
  const t = useT();
  const isPlayer = !!node.playerParts;
  const parts = isPlayer ? node.playerParts : node.dealParts;
  const score = isPlayer ? node.playerScore : node.dealScore;
  const rank = isPlayer ? node.playerRank : node.dealRank;
  const meta = (isPlayer ? playerRanks(t) : dealRanks(t))[rank] || { label: t('В отслеживании', 'Tracked'), color: 'var(--cf-text6)' };
  const factors = isPlayer ? playerFactors(t) : dealFactors(t);
  const kicker = isPlayer ? t('Инвестор для отслеживания', 'An allocator worth tracking') : t('Сделка · где искать возможность', 'Deal · where the opportunity sits');

  return (
    <div style={{
      marginBottom: 16, padding: '11px 12px', background: 'var(--cf-surface1)',
      border: '1px solid var(--cf-border-soft)', borderRadius: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{kicker}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, fontFamily: MONO }}>{score != null ? Math.round(score) : '—'}</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: meta.color, marginBottom: 9 }}>{meta.label}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {factors.map(([key, label]) => (
          <FactorBar key={key} label={label} value={parts[key]} />
        ))}
      </div>

    </div>
  );
}

function FactorBar({ label, value }) {
  const pending = value == null;
  const pct = pending ? 0 : Math.round(clamp01v(value) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ flex: '0 0 108px', fontSize: 9.5, color: pending ? 'var(--cf-text8)' : 'var(--cf-text4)', fontFamily: MONO }}>{label}</span>
      <span style={{ position: 'relative', flex: 1, height: 4, borderRadius: 2, background: 'var(--cf-surface3)', overflow: 'hidden' }}>
        {!pending && <span style={{ position: 'absolute', inset: 0, width: `${pct}%`, borderRadius: 2, background: pct >= 66 ? 'var(--cf-good)' : pct >= 33 ? 'var(--cf-warn)' : 'var(--cf-text6)' }} />}
      </span>
      <span style={{ flex: '0 0 30px', textAlign: 'right', fontSize: 9, color: pending ? 'var(--cf-text8)' : 'var(--cf-text5)', fontFamily: MONO }}>
        {pending ? '—' : pct}
      </span>
    </div>
  );
}

function clamp01v(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
