// Table view — the complete tracking universe, organised rather than dumped.
//
// Two role sections (who deploys capital · who receives it), each split into
// typed subsections (sovereign · corporate · venture … / public co · private
// co · funds · projects · assets). Every subsection header carries its own
// count and capital total, and collapses, so the question "who are we actually
// tracking, and as what?" is answerable by scanning headers alone.
//
// Because the group headers carry the type, the old Class and "Tracked as"
// columns are gone — they repeated the header on every row. Sorting applies
// within each subsection; a row click jumps to the map with the entity open.

import { useMemo, useState, useCallback } from 'react';
import { ArrowUp, ArrowDown, ChevronDown, ChevronRight } from 'lucide-react';
import { fmtUSD, plural } from './format.js';
import {
  SECTOR_META, TIER_META, THEME_META, AGGREGATES, sectorLabel, basisLabel,
} from '../../../data/capitalMap.js';
import { WatchlistMenu } from './WatchlistControl.jsx';

const MONO = 'ui-monospace, monospace';

// ── Section model ────────────────────────────────────────────────────────
// Role = the dimension monitored. Subsection = what kind of entity it is.
// Both derive 1:1 from the payload's `kind` + `cls` — nothing is inferred.
const ROLES = [
  {
    key: 'allocator',
    label: 'Инвесторы',
    tagline: 'кто вкладывает капитал',
    accent: 'var(--cf-gold)',
    capitalWord: 'вложено',
    groups: [
      { cls: 'sovereign',   label: 'Государственные',        blurb: 'Госфонды и госпрограммы — национальный капитал.' },
      { cls: 'corporate',   label: 'Корпорации',             blurb: 'Операционные компании, инвестирующие с собственного баланса.' },
      { cls: 'vc',          label: 'Венчур',                 blurb: 'Венчурные фонды и фонды роста, вкладывающие капитал LP.' },
      { cls: 'alt_manager', label: 'Управляющие активами',   blurb: 'Инфраструктурные, кредитные и private-equity управляющие.' },
      { cls: 'individual',  label: 'Частные лица',           blurb: 'Ангелы, основатели и семейные офисы, инвестирующие лично.' },
    ],
  },
  {
    key: 'target',
    label: 'Получатели',
    tagline: 'куда приходит капитал',
    accent: 'var(--cf-green2)',
    capitalWord: 'получено',
    groups: [
      { cls: 'public',  label: 'Публичные компании',  blurb: 'Компании на бирже — торгуемый вывод из частных потоков.' },
      { cls: 'private', label: 'Частные компании',    blurb: 'Венчурные и растущие компании, привлекающие капитал.' },
      { cls: 'fund',    label: 'Фонды и SPV',         blurb: 'Фонды, SPV и СП, собранные, чтобы инвестировать дальше.' },
      { cls: 'project', label: 'Проекты и стройка',   blurb: 'Именованные физические стройки — дата-центры, станции, фабрики.' },
      { cls: 'asset',   label: 'Активы',              blurb: 'Отдельные активы и купленные позиции.' },
    ],
  },
];

// ── Cycle summary ────────────────────────────────────────────────────────
// `aggregates` (what led this cycle) and `audit` (the engine's verdict on its
// own delivery) are payload-owned. Every number is shown exactly as shipped,
// with the engine's `basis` string as the explanation — we never recompute a
// share or re-rank a leader, because then the figure would no longer be the
// engine's and the provenance claim would be false.
function CycleSummary() {
  if (!AGGREGATES) return null;
  const top = AGGREGATES?.top_sector;
  const co = AGGREGATES?.top_company;
  const shares = AGGREGATES?.thesis_shares;
  const byCap = shares?.by_capital
    ? Object.entries(shares.by_capital).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];

  return (
    <div style={{
      border: '1px solid var(--cf-border-soft)', borderRadius: 12, padding: '13px 16px', marginBottom: 16,
      background: 'var(--cf-surface0)',
    }}>
      <div style={{ marginBottom: 11 }}>
        <span style={{
          fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>
          Этот цикл
        </span>
      </div>

      <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
        {top?.top && (
          <Lead label="Сектор-лидер"
            value={top.top.sector ? sectorLabel(top.top.sector) : '—'}
            color={SECTOR_META[top.top.sector]?.color || 'var(--cf-text3)'}
            detail={[
              top.top.capital_usd ? fmtUSD(top.top.capital_usd) : null,
              top.top.deals ? `${top.top.deals} ${plural(top.top.deals, ['сделка', 'сделки', 'сделок'])}` : null,
              top.top.allocators ? `${top.top.allocators} ${plural(top.top.allocators, ['инвестор', 'инвестора', 'инвесторов'])}` : null,
            ].filter(Boolean).join(' · ')}
            runnersUp={(top.ranked || []).slice(1, 4).map(r => ({
              name: sectorLabel(r.sector),
              color: SECTOR_META[r.sector]?.color,
              tail: r.capital_usd ? fmtUSD(r.capital_usd) : `${r.deals} сд.`,
            }))}
            basis={basisLabel(top.basis)} />
        )}
        {co?.top && (
          <Lead label="Больше всего инвесторов"
            value={co.top.target || '—'} color="var(--cf-text1)"
            detail={[
              co.top.investors ? `${co.top.investors} ${plural(co.top.investors, ['инвестор', 'инвестора', 'инвесторов'])}` : null,
              co.top.capital_usd ? fmtUSD(co.top.capital_usd) : null,
            ].filter(Boolean).join(' · ')}
            runnersUp={(co.ranked || []).slice(1, 4).map(r => ({
              name: r.target,
              color: SECTOR_META[(r.sectors || [])[0]]?.color,
              tail: r.investors ? `${r.investors} инв.` : null,
            }))}
            basis={basisLabel(co.basis)} />
        )}
      </div>

      {byCap.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div title={basisLabel(shares.basis) || undefined}
            style={{
              fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
              cursor: shares.basis ? 'help' : 'default',
            }}>
            Где сидит капитал · по темам
          </div>
          <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: 'var(--cf-border-hair)' }}>
            {byCap.map(([k, v]) => (
              <span key={k} title={`${THEME_META[k]?.label || k} — ${Math.round(v * 100)}% отслеживаемого капитала`}
                style={{ width: `${v * 100}%`, background: THEME_META[k]?.color || 'var(--cf-text9)' }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 7 }}>
            {byCap.map(([k, v]) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: 'var(--cf-text4)', fontFamily: MONO }}>
                <span style={{ width: 6, height: 6, borderRadius: 2, background: THEME_META[k]?.color || 'var(--cf-text9)' }} />
                {THEME_META[k]?.label || k}
                <span style={{ color: 'var(--cf-text1)', fontWeight: 700 }}>{Math.round(v * 100)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Lead({ label, value, detail, color, basis, runnersUp = [] }) {
  return (
    <div style={{ minWidth: 0, maxWidth: 430 }}>
      <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
      {/* Basis kept as a hover tooltip, not printed — it was visual clutter. */}
      <div title={basis || undefined}
        style={{ fontSize: 14, fontWeight: 700, color, marginTop: 3, lineHeight: 1.3, cursor: basis ? 'help' : 'default' }}>
        {value}
      </div>
      {detail && (
        <div style={{ fontSize: 10, color: 'var(--cf-text4)', fontFamily: MONO, marginTop: 2 }}>{detail}</div>
      )}
      {runnersUp.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {runnersUp.map((r, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO }}>
              <span style={{ width: 5, height: 5, borderRadius: 2, background: r.color || 'var(--cf-text9)' }} />
              <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              {r.tail && <span style={{ color: 'var(--cf-text8)' }}>{r.tail}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function statusOf(n) {
  if (n.stale) return { label: 'Остыл', color: 'var(--cf-muted)', title: 'Нет активности 180 дней — остаётся в памяти, приглушён.' };
  if (n.watchOnly) return { label: 'Наблюдение', color: 'var(--cf-text5)', title: 'Только потоки-кандидаты — не подтверждено.' };
  return { label: 'Активен', color: 'var(--cf-good)', title: 'Подтверждённая активность в текущем окне.' };
}

const COLS = [
  { key: 'name',    label: 'Объект',         sort: (n) => n.name.toLowerCase() },
  { key: 'tier',    label: 'Уровень',        sort: (n) => (n.tier === 'core' ? 0 : n.tier === 'key' ? 1 : n.tier === 'watch' ? 2 : 3) },
  { key: 'sector',  label: 'Сектор',         sort: (n) => (n.sector ? sectorLabel(n.sector) : '~') },
  { key: 'deals',   label: 'Сделки',         sort: (n) => n.deals, num: true },
  { key: 'capital', label: 'Капитал',        sort: (n) => n.capital, num: true },
  { key: 'last',    label: 'Активность',     sort: (n) => n.last_activity || '', num: true },
  { key: 'status',  label: 'Статус',         sort: (n) => (n.stale ? 2 : n.watchOnly ? 1 : 0) },
];

export default function EntityTable({ nodes, matchedNodes, query, activeList, wl, onOpenEntity, kind = 'all', onKind, topInset = 0 }) {
  const [sortKey, setSortKey] = useState('capital');
  const [sortDir, setSortDir] = useState(-1);         // -1 desc · 1 asc
  const [collapsed, setCollapsed] = useState(() => new Set());

  const toggleGroup = useCallback((id) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Filter once, then bucket into role → subsection. A class the payload uses
  // but this file doesn't name still gets a section (keyed "other"), so a new
  // engine class can never silently vanish from the table.
  const { sections, shown } = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    const member = activeList ? new Set(activeList.ids) : null;
    const col = COLS.find(c => c.key === sortKey) || COLS[4];

    // The table is the same universe as the map, not a second one: whatever
    // the filters and quick views select applies here too.
    const rows = nodes.filter(n =>
      (!matchedNodes || matchedNodes.has(n.id))
      && (kind === 'all' || n.kind === kind)
      && (!member || member.has(n.id))
      && (!q || n.name.toLowerCase().includes(q) || n.label.toLowerCase().includes(q))
    );
    const cmp = (a, b) => {
      const va = col.sort(a), vb = col.sort(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sortDir;
    };

    const out = ROLES
      .filter(role => kind === 'all' || kind === role.key)
      .map(role => {
        const mine = rows.filter(n => n.kind === role.key);
        const named = new Set(role.groups.map(g => g.cls));
        const groups = role.groups
          .map(g => ({ ...g, id: `${role.key}:${g.cls}`, rows: mine.filter(n => n.cls === g.cls).sort(cmp) }))
          .filter(g => g.rows.length > 0);
        const leftovers = mine.filter(n => !named.has(n.cls));
        if (leftovers.length) {
          groups.push({
            cls: 'other', id: `${role.key}:other`, label: 'Прочее',
            blurb: 'Классы объектов из данных движка, для которых здесь пока нет секции.',
            rows: leftovers.sort(cmp),
          });
        }
        // Data-driven order: the heaviest subsection leads.
        groups.sort((a, b) =>
          b.rows.reduce((s, n) => s + n.capital, 0) - a.rows.reduce((s, n) => s + n.capital, 0));
        return {
          ...role,
          groups,
          count: mine.length,
          capital: mine.reduce((s, n) => s + n.capital, 0),
        };
      })
      .filter(role => role.count > 0);

    return { sections: out, shown: rows.length };
  }, [nodes, matchedNodes, query, kind, activeList, sortKey, sortDir]);

  const header = (c) => {
    const on = sortKey === c.key;
    return (
      <th key={c.key}
        onClick={() => { on ? setSortDir(d => -d) : (setSortKey(c.key), setSortDir(c.num ? -1 : 1)); }}
        style={{
          position: 'sticky', top: 0, zIndex: 3, background: 'var(--cf-surface0)',
          padding: '10px 14px', textAlign: c.num ? 'right' : 'left',
          fontSize: 9, color: on ? 'var(--cf-accent)' : 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
          borderBottom: '1px solid var(--cf-border-soft)', whiteSpace: 'nowrap', userSelect: 'none',
        }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {c.label}
          {on && (sortDir === 1 ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
        </span>
      </th>
    );
  };

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, top: topInset, zIndex: 20,
      background: 'var(--cf-canvas)', overflowY: 'auto',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '18px 24px 60px' }}>
        {/* Cycle summary — the engine's own read on this delivery. Rendered
            verbatim, including each figure's `basis`; never recomputed. */}
        <CycleSummary />

        {/* Scope line + role chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, color: 'var(--cf-text5)', fontFamily: MONO }}>
            {shown} из {nodes.length} {plural(nodes.length, ['объекта', 'объектов', 'объектов'])} в выборке
            {activeList ? <> · список <span style={{ color: 'var(--cf-accent)', fontWeight: 700 }}>{activeList.name}</span></> : null}
            {query ? <> · по запросу «{query}»</> : null}
          </span>
          <span style={{ flex: 1 }} />
          {[['all', 'Все'], ['allocator', 'Инвесторы'], ['target', 'Получатели']].map(([k, label]) => (
            <button key={k} onClick={() => onKind?.(k)}
              style={{
                padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
                background: kind === k ? 'var(--cf-accent-bg)' : 'var(--cf-surface2)',
                border: `1px solid ${kind === k ? 'var(--cf-accent-bd)' : 'var(--cf-border)'}`,
                color: kind === k ? 'var(--cf-accent)' : 'var(--cf-text3)',
                fontSize: 10, fontFamily: MONO, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
              {label}
            </button>
          ))}
        </div>

        {sections.map(role => (
          <section key={role.key} style={{ marginBottom: 30 }}>
            {/* Role banner — the dimension monitored */}
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap',
              padding: '0 2px 9px', marginBottom: 10, borderBottom: `1px solid ${role.accent}33`,
            }}>
              <span style={{
                fontSize: 12.5, fontWeight: 700, color: role.accent, fontFamily: MONO,
                textTransform: 'uppercase', letterSpacing: '0.12em',
              }}>
                {role.label}
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--cf-text6)', fontFamily: MONO }}>{role.tagline}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 10, color: 'var(--cf-text5)', fontFamily: MONO }}>
                {role.count} {plural(role.count, ['объект', 'объекта', 'объектов'])}
                <span style={{ color: 'var(--cf-text9)' }}> · </span>
                <span style={{ color: 'var(--cf-text3)', fontWeight: 700 }}>{fmtUSD(role.capital)}</span> {role.capitalWord}
              </span>
            </div>

            <div style={{ border: '1px solid var(--cf-border-soft)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{COLS.map(header)}<th style={{
                  position: 'sticky', top: 0, zIndex: 3, background: 'var(--cf-surface0)',
                  borderBottom: '1px solid var(--cf-border-soft)', width: 40,
                }} /></tr></thead>

                {role.groups.map(g => {
                  const shut = collapsed.has(g.id);
                  const gCapital = g.rows.reduce((s, n) => s + n.capital, 0);
                  return (
                    <tbody key={g.id}>
                      {/* Subsection header — what this bucket is, and how big */}
                      <tr onClick={() => toggleGroup(g.id)}
                        title={shut ? 'Развернуть' : 'Свернуть'}
                        style={{ cursor: 'pointer', background: 'var(--cf-surface0)' }}>
                        <td colSpan={COLS.length + 1} style={{ padding: '9px 14px', borderBottom: '1px solid var(--cf-border-hair)', borderTop: '1px solid var(--cf-border-hair)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--cf-text7)', display: 'inline-flex', flexShrink: 0 }}>
                              {shut ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                            </span>
                            <span style={{
                              fontSize: 10.5, fontWeight: 700, color: 'var(--cf-text2)', fontFamily: MONO,
                              textTransform: 'uppercase', letterSpacing: '0.08em',
                            }}>{g.label}</span>
                            <span style={{
                              fontSize: 9.5, color: 'var(--cf-text7)', fontFamily: MONO,
                              padding: '1px 6px', border: '1px solid var(--cf-border)', borderRadius: 4,
                            }}>{g.rows.length}</span>
                            <span style={{ fontSize: 10, color: 'var(--cf-text8)', fontFamily: MONO }}>{g.blurb}</span>
                            <span style={{ flex: 1 }} />
                            <span style={{ fontSize: 10.5, color: 'var(--cf-text3)', fontFamily: MONO, fontWeight: 700, flexShrink: 0 }}>
                              {gCapital > 0 ? fmtUSD(gCapital) : '—'}
                            </span>
                          </span>
                        </td>
                      </tr>

                      {!shut && g.rows.map(n => {
                        const st = statusOf(n);
                        const tier = n.tier ? TIER_META[n.tier] : null;
                        const sec = n.sector ? SECTOR_META[n.sector] : null;
                        return (
                          <tr key={n.id}
                            onClick={() => onOpenEntity(n.id)}
                            title={`Открыть ${n.name} на карте`}
                            style={{ cursor: 'pointer', borderBottom: '1px solid var(--cf-border-hair)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-surface1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                            {/* Entity */}
                            <td style={{ padding: '9px 14px 9px 32px', minWidth: 200 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cf-text1)' }}>{n.name}</span>
                                {/* Country reads as a quiet suffix — the flag icon itself is
                                    reserved for sovereigns, on the map. */}
                                {n.country && (
                                  <span title={n.countryLabel || n.country.toUpperCase()}
                                    style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, letterSpacing: '0.06em', cursor: 'help' }}>
                                    {n.country.toUpperCase()}
                                  </span>
                                )}
                              </span>
                            </td>
                            {/* Tier */}
                            <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                              {tier
                                ? <span title={tier.blurb} style={{ fontSize: 9.5, fontFamily: MONO, fontWeight: 700, color: tier.color, cursor: 'help' }}>
                                    {tier.short} {tier.stars}
                                  </span>
                                : <span style={{ color: 'var(--cf-text9)', fontSize: 10 }}>—</span>}
                            </td>
                            {/* Sector */}
                            <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                              {sec
                                ? <span style={{ fontSize: 10, fontFamily: MONO, color: sec.color }}>{sec.label}</span>
                                : <span style={{ color: 'var(--cf-text9)', fontSize: 10 }}>—</span>}
                            </td>
                            {/* Deals */}
                            <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 11, fontFamily: MONO, color: 'var(--cf-text3)' }}>
                              {n.deals}
                            </td>
                            {/* Capital — 0 with deals on file = undisclosed, not zero */}
                            <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 11.5, fontFamily: MONO, fontWeight: 700, color: n.capital > 0 ? 'var(--cf-text0)' : 'var(--cf-text7)' }}>
                              {n.capital > 0 ? fmtUSD(n.capital) : n.degree > 0 ? 'не раскрыто' : '$0'}
                            </td>
                            {/* Last activity */}
                            <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 10, fontFamily: MONO, color: 'var(--cf-text5)', whiteSpace: 'nowrap' }}>
                              {n.last_activity || '—'}
                            </td>
                            {/* Status */}
                            <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                              <span title={st.title} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                fontSize: 9.5, fontFamily: MONO, fontWeight: 700, color: st.color, cursor: 'help',
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color }} />
                                {st.label}
                              </span>
                            </td>
                            {/* Watchlist bookmark */}
                            <td style={{ padding: '9px 10px' }} onClick={(e) => e.stopPropagation()}>
                              <WatchlistMenu wl={wl} entityId={n.id} size={13} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  );
                })}
              </table>
            </div>
          </section>
        ))}

        {sections.length === 0 && (
          <div style={{
            padding: '28px 16px', textAlign: 'center', fontSize: 11, color: 'var(--cf-text7)', fontFamily: MONO,
            border: '1px solid var(--cf-border-soft)', borderRadius: 12,
          }}>
            Ничего не найдено — очистите поиск{activeList ? ' или отключите список' : ''}.
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 9, color: 'var(--cf-text8)', fontFamily: MONO, lineHeight: 1.6 }}>
          Вселенная отслеживания, как её присылает движок: каждый объект хотя бы с одним потоком, в той роли и типе,
          что заданы в данных. Строки «Наблюдение» — только неподтверждённые кандидаты; «Остыл» — 180 дней без активности.
          Клик по заголовку секции сворачивает её, по строке — открывает объект на карте.
        </div>
      </div>
    </div>
  );
}
