// Slide-in right panel — the distribution breakdown for one entity.
// Answers: who puts money in here (targets) or where this allocator's money
// goes, how much, in what form, at what confidence. The graph stays live
// underneath.

import { X, ArrowDownLeft, ArrowUpRight, Globe, ExternalLink, Search, Linkedin, Building2, Users, ChevronRight, FileText, Newspaper, Briefcase } from 'lucide-react';
import { fmtUSD, plural } from './format.js';
import {
  SECTOR_META, CLASS_META, TIER_META, NETWORK_META, confidenceBand, sectorLabel,
} from '../../../data/capitalMap.js';
import { subsectorLabel } from './subsectors.js';
import { WatchlistMenu } from './WatchlistControl.jsx';

const MONO = 'ui-monospace, monospace';
const W = 380;

// Sum of a flow list when at least one amount is disclosed — else null, so the
// UI can say "undisclosed" instead of a misleading $0.
function totalOrNull(flows, total) {
  return flows.some(f => f.disclosed) ? fmtUSD(total) : 'не раскрыто';
}

export default function EntityPanel({
  node, inbound, outbound, nodeById,
  selectedFlowId, onSelectFlow, onOpenEntity, onClose, onDeepDive, onFundHoldings, wl, topInset = 0,
}) {
  if (!node) return null;
  const cls = CLASS_META[node.cls];
  const sec = node.sector ? SECTOR_META[node.sector] : null;
  const tier = node.tier ? TIER_META[node.tier] : null;
  const role = node.kind === 'allocator' ? 'Инвестор · вкладывает капитал' : 'Получатель · привлекает капитал';
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
          <button onClick={onClose} title="Закрыть панель"
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
          {tier && (
            <span title={tier.blurb} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
              background: tier.color + '12', border: `1px solid ${tier.color}38`, borderRadius: 5,
              fontSize: 9, color: tier.color, fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}>{tier.short} · {tier.label} <span style={{ letterSpacing: 1 }}>{tier.stars}</span></span>
          )}
          {node.country && (
            <span title={`Национальная принадлежность — ${node.countryLabel || node.country.toUpperCase()}`} style={{
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
            <span title={`Участник сети «${NETWORK_META[node.network]?.label || node.network}»`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
              background: (NETWORK_META[node.network]?.color || '#F5B942') + '18',
              border: `1px solid ${(NETWORK_META[node.network]?.color || '#F5B942')}55`, borderRadius: 5,
              fontSize: 9, color: NETWORK_META[node.network]?.color || '#F5B942', fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}><Users size={10} /> {NETWORK_META[node.network]?.label || node.network}</span>
          )}
          {node.stale && (
            <span title="Нет активности 180 дней — остыл, но остаётся в памяти." style={{
              display: 'inline-block', padding: '3px 8px',
              background: 'var(--cf-surface2)', border: '1px dashed var(--cf-border-dashed)', borderRadius: 5,
              fontSize: 9, color: 'var(--cf-muted)', fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}>Остыл · 180 дн тишины</span>
          )}
          {node.watchOnly && (
            <span title="Пока только неподтверждённые потоки-кандидаты — по умолчанию скрыт с основной карты." style={{
              display: 'inline-block', padding: '3px 8px',
              background: 'var(--cf-surface2)', border: '1px dashed var(--cf-border-dashed)', borderRadius: 5,
              fontSize: 9, color: 'var(--cf-text5)', fontFamily: MONO, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
            }}>Наблюдение · не подтверждено</span>
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
            title="Расширенный разбор инвестора — бэкграунд, последние инвестиции, трек-рекорд, стратегия"
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
            Подробный разбор <ChevronRight size={12} />
          </button>
        )}

        {/* Fund portfolio — funds only: the top holdings + a button to the full
            portfolio. Following smart money means seeing the exact companies. */}
        {(node.cls === 'fund' || (node.holdings && node.holdings.length > 0)) && (
          <FundPortfolioBlock node={node} nodeById={nodeById}
            onOpenEntity={onOpenEntity} onFundHoldings={onFundHoldings} />
        )}

        {/* Totals */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          {/* capital 0 with deals on file = every amount undisclosed, not zero */}
          <Stat
            label="Капитал"
            value={node.capital > 0 ? fmtUSD(node.capital) : node.degree > 0 ? '—' : '$0'}
            sub={node.capital > 0 ? (isAllocator ? 'вложено' : 'получено') : node.degree > 0 ? 'суммы не раскрыты' : 'ничего не отслежено'}
            color={node.capital > 0 ? (isAllocator ? 'var(--cf-gold)' : 'var(--cf-green2)') : 'var(--cf-text5)'}
          />
          <Stat label="Сделки" value={String(node.deals)} sub={`${node.degree} ${plural(node.degree, ['поток', 'потока', 'потоков'])} отслежено`} color="var(--cf-text1)" />
        </div>

        {/* Activity window */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
          padding: '8px 11px', background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 9,
          fontSize: 10, fontFamily: MONO,
        }}>
          <span style={{ color: 'var(--cf-text7)' }}>АКТИВЕН</span>
          <span style={{ color: 'var(--cf-text3)' }}>{node.first_seen}</span>
          <span style={{ color: 'var(--cf-text9)' }}>→</span>
          <span style={{ color: 'var(--cf-text3)' }}>{node.last_activity}</span>
        </div>

        {inbound.length > 0 && (
          <Section title={`Кто инвестирует сюда · ${totalOrNull(inbound, node.totalInflow)}`}
            hint="Клик по имени открывает объект. Клик по иконке — разбор сделки."
            icon={<ArrowDownLeft size={11} color="var(--cf-good)" />}>
            <FlowList
              flows={inbound} counterpartyKey="sourceId"
              nodeById={nodeById} selectedFlowId={selectedFlowId}
              onSelectFlow={onSelectFlow} onOpenEntity={onOpenEntity}
            />
          </Section>
        )}

        {outbound.length > 0 && (
          <Section title={`Куда идут его деньги · ${totalOrNull(outbound, node.totalOutflow)}`}
            hint="Клик по имени открывает объект. Клик по иконке — разбор сделки."
            icon={<ArrowUpRight size={11} color="#F59E0B" />}>
            <FlowList
              flows={outbound} counterpartyKey="targetId"
              nodeById={nodeById} selectedFlowId={selectedFlowId}
              onSelectFlow={onSelectFlow} onOpenEntity={onOpenEntity}
            />
          </Section>
        )}

        {inbound.length === 0 && outbound.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--cf-text7)', fontFamily: MONO, fontStyle: 'italic' }}>
            По этому объекту пока нет отслеженных потоков.
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
  const links = node.links || [];
  const hasProfile = !!node.description || links.length > 0;
  return (
    <div style={{
      marginBottom: 16, padding: '11px 12px',
      background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 10,
    }}>
      <div style={{
        fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7,
      }}>
        {node.profileType === 'person' ? 'Кто это'
          : node.profileType === 'project' ? 'Что это'
          : node.profileType === 'fund' ? 'О фонде' : 'Описание'}
      </div>

      <div style={{ fontSize: 12.5, color: node.description ? 'var(--cf-text2)' : 'var(--cf-text6)', lineHeight: 1.6, fontStyle: node.description ? 'normal' : 'italic' }}>
        {node.description || 'Профиля в данных пока нет — найдите через поиск ниже.'}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {links.map((l, i) => <LinkChip key={i} link={l} />)}
        {links.length === 0 && (
          <LinkChip link={{ kind: 'search', label: `Искать «${node.name}»`, url: node.searchUrl }} />
        )}
      </div>

      {/* Why some entities show a search box instead of a link: we only ever
          link a URL we hold on file — private offices and stealth companies
          usually have none, and a guessed URL is worse than no URL. */}
      {links.length === 0 && (
        <div style={{ marginTop: 8, fontSize: 9, color: 'var(--cf-text8)', fontFamily: MONO, lineHeight: 1.55 }}>
          {hasProfile
            ? 'Официального сайта в данных нет — частная структура или без публичного сайта. Мы ищем, а не угадываем адрес.'
            : 'В данных движка пока нет справки по этому объекту — пробел покрытия на стороне движка, вручную мы его не заполняем.'}
        </div>
      )}

      {/* When the engine researched this entity, stamp the date it did so. */}
      {node.referenceAsOf && (
        <div style={{ marginTop: 8, fontSize: 9, color: 'var(--cf-text8)', fontFamily: MONO }}>
          Исследовано движком · {node.referenceAsOf}
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
        <Briefcase size={11} color="var(--cf-gold)" /> Портфель фонда
        {total > 0 && <span style={{ color: 'var(--cf-text4)' }}>· {total}</span>}
        {node.portfolio_url && (
          <>
            <span style={{ flex: 1 }} />
            <a href={node.portfolio_url} target="_blank" rel="noopener noreferrer"
              title={`Страница портфеля фонда — ${node.portfolio_url}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                color: 'var(--cf-link)', textDecoration: 'none', letterSpacing: 0, textTransform: 'none',
                fontWeight: 600,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-link-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-link)')}>
              Страница портфеля <ExternalLink size={9} />
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
                title={openId ? `Открыть ${h.name}` : (h.note || '')}
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
          Список компаний фонда движок пока не прислал — появится в данных, отобразим здесь.
        </div>
      )}

      {onFundHoldings && (
        <button onClick={() => onFundHoldings(node.id)}
          title="Полный портфель фонда — все компании"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            width: '100%', padding: '8px 12px', marginTop: 10,
            background: 'var(--cf-accent-bg)', border: '1px solid var(--cf-accent-bd)',
            borderRadius: 8, color: 'var(--cf-accent)', fontSize: 10, fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
          }}>
          {total > 5 ? `Все компании фонда · ${total}` : 'Детальный портфель'} <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

function LinkChip({ link }) {
  const Icon = link.kind === 'website' ? Globe
    : link.kind === 'read_more' ? Newspaper
    : link.kind === 'linkedin' ? Linkedin
    : link.kind === 'firm' ? Building2
    : link.kind === 'search' ? Search
    : ExternalLink;
  // `read_more` carries the publication name as its label — show it as such so
  // the chip reads "Reuters", not a bare "Link".
  const label = link.label || (link.kind === 'x' ? 'X / соцсеть'
    : link.kind === 'website' ? 'Сайт'
    : link.kind === 'read_more' ? 'Читать' : 'Ссылка');
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
function FlowList({ flows, counterpartyKey, nodeById, selectedFlowId, onSelectFlow, onOpenEntity }) {
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
        title={cp ? `Открыть ${cp.name}` : ''}
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
            <span title={`${band.label} — ${f.confidence}/100. Откройте карточку сделки, чтобы увидеть источники.`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'help' }}>
              <span style={{ width: 26, height: 3, borderRadius: 2, background: 'var(--cf-border-soft)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${f.confidence}%`, background: band.color }} />
              </span>
              <span style={{ color: band.color, fontWeight: 700 }}>{f.confidence}</span>
            </span>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onSelectFlow(f.id); }}
            title={on ? 'Скрыть разбор сделки' : 'Открыть разбор сделки'}
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
    if (key === '_none') return { label: inbound ? 'Прочие' : 'Без сектора', color: 'var(--cf-text7)' };
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
function GroupHeader({ label, color, count, total, first }) {
  const dot = color || 'var(--cf-text7)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      margin: first ? '0 2px 1px' : '9px 2px 1px',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 1.5, background: dot, opacity: 0.85, flexShrink: 0 }} />
      <span style={{
        fontSize: 8.5, color: 'var(--cf-text4)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.09em', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--cf-border-soft)', minWidth: 8 }} />
      <span style={{ fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 600, whiteSpace: 'nowrap' }}>
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
