// ══════════════════════════════════════════════════════════════════════════
// EcoTable — the whole ecosystem as rows.
//
// Sibling of capitalflow/EntityTable, and there for the same reason: a map is
// good at "who touches whom" and bad at "show me everything, sorted". This is
// the sorted-everything view — every entity in the payload, with the numbers
// the map can only encode as size and colour, and every column sortable.
//
// v2 puts the RUBRIC in the table: the four criticality factors get their own
// columns, so you can rank the whole ecosystem by lock-in depth or by time to
// replace and not just by the blended score. That is the one question the
// blended score cannot answer — «кто держится на замке, а кто на сроке».
//
// Grouping is by LAYER by default — the stack order is the reading order —
// with a flat mode for pure ranking. Clicking a row opens it on the map.
// ══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { criticalityBand, CRITICALITY_FACTORS } from '../../../data/aiEcosystemNetwork.js';

const MONO = 'ui-monospace, monospace';

const COLUMNS = [
  { key: 'name',        label: 'Сущность',  w: '1.3fr', align: 'left'  },
  { key: 'role',        label: 'Роль',      w: '76px',  align: 'left'  },
  { key: 'sector',      label: 'Функция',   w: '1fr',   align: 'left'  },
  { key: 'layers',      label: 'Слои',      w: '86px',  align: 'left'  },
  { key: 'criticality', label: 'Критичн.',  w: '86px',  align: 'right', num: true },
  // The rubric, opened up. Short headers on purpose — the full question is in
  // the column's tooltip, taken from CRITICALITY_FACTORS.
  { key: 'irreplaceability', label: 'Незам.',  w: '52px', align: 'right', num: true, factor: 'irreplaceability' },
  { key: 'lockInDepth',      label: 'Замок',   w: '52px', align: 'right', num: true, factor: 'lockInDepth' },
  { key: 'timeToReplace',    label: 'Срок',    w: '52px', align: 'right', num: true, factor: 'timeToReplace' },
  { key: 'strategicControl', label: 'Рычаг',   w: '52px', align: 'right', num: true, factor: 'strategicControl' },
  { key: 'gravity',     label: 'Гравит.',   w: '62px',  align: 'right', num: true },
  { key: 'phase',       label: 'Фаза',      w: '78px',  align: 'left'  },
  { key: 'risk',        label: 'Риск',      w: '74px',  align: 'left'  },
  { key: 'links',       label: 'Связей',    w: '82px',  align: 'right', num: true },
];
const GRID = COLUMNS.map(c => c.w).join(' ');
const FACTOR_BY_KEY = Object.fromEntries(CRITICALITY_FACTORS.map(f => [f.key, f]));

const RISK_ORDER = { critical: 3, high: 2, medium: 1, low: 0 };

const valueOf = (n, key) => {
  switch (key) {
    case 'name': return n.name.toLowerCase();
    case 'role': return n.roleMeta?.label || n.role;
    case 'sector': return n.sectorLabel || '';
    case 'layers': return n.primaryOrder ?? 0;
    case 'criticality': return n.criticality || 0;
    case 'gravity': return n.gravity?.score || 0;
    case 'phase': return n.phaseMeta?.order ?? 99;
    case 'risk': return RISK_ORDER[n.risk?.geopolitical] ?? -1;
    case 'links': return (n.upCount || 0) + (n.downCount || 0);
    case 'irreplaceability':
    case 'lockInDepth':
    case 'timeToReplace':
    case 'strategicControl':
      return n.criticalityFactors?.[key] ?? -1;
    default: return 0;
  }
};

export default function EcoTable({
  entities, layers, layerById, query, visibleEntities, onOpenEntity, topInset = 0,
}) {
  const [sort, setSort] = useState({ key: 'criticality', dir: -1 });
  const [grouped, setGrouped] = useState(true);
  const [onlyVisible, setOnlyVisible] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = entities.filter(n => {
      if (onlyVisible && visibleEntities && !visibleEntities.has(n.id)) return false;
      if (!q) return true;
      return n.name.toLowerCase().includes(q)
        || (n.aliases || []).some(a => a.toLowerCase().includes(q))
        || (n.ticker || '').toLowerCase().includes(q)
        || (n.sectorLabel || '').toLowerCase().includes(q)
        || (n.oneLiner || '').toLowerCase().includes(q);
    });
    list = list.slice().sort((a, b) => {
      const va = valueOf(a, sort.key), vb = valueOf(b, sort.key);
      if (va < vb) return -sort.dir;
      if (va > vb) return sort.dir;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [entities, query, sort, onlyVisible, visibleEntities]);

  // Grouped mode walks the payload's own layer order. Nothing here names a
  // layer or a plane's contents — it just walks `layers`, which arrive sorted.
  const groups = useMemo(() => {
    if (!grouped) return [{ key: '_all', label: null, rows }];
    const out = [];
    layers.forEach(l => {
      const mem = rows.filter(n => n.primaryLayer === l.id);
      if (!mem.length) return;
      out.push({
        key: l.id,
        label: `${l.id} · ${l.label}`,
        caption: l.caption,
        conc: l.concentrationMeta,
        plane: l.planeMeta,
        rows: mem,
      });
    });
    return out;
  }, [grouped, rows, layers]);

  const toggleSort = (key) => setSort(s => (
    s.key === key ? { key, dir: -s.dir } : { key, dir: (key === 'name' || key === 'sector' || key === 'role' || key === 'phase') ? 1 : -1 }
  ));

  return (
    <div style={{
      position: 'absolute', top: topInset, left: 0, right: 0, bottom: 0, zIndex: 20,
      background: 'var(--cf-canvas)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 18px', borderBottom: '1px solid var(--cf-border-soft)', flexShrink: 0,
      }}>
        <span style={{
          fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>
          {rows.length} {plural(rows.length, ['сущность', 'сущности', 'сущностей'])}
        </span>
        <div style={{ flex: 1 }} />
        <Toggle on={grouped} onClick={() => setGrouped(g => !g)}
          title="Сгруппировать по слоям стека или показать одним ранжированным списком">
          {grouped ? 'По слоям' : 'Единый список'}
        </Toggle>
        <Toggle on={onlyVisible} onClick={() => setOnlyVisible(v => !v)}
          title="Показывать только то, что сейчас не скрыто фильтрами карты">
          Как на карте
        </Toggle>
      </div>

      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: GRID, gap: 8,
        padding: '8px 18px', borderBottom: '1px solid var(--cf-border)',
        flexShrink: 0, background: 'var(--cf-canvas)',
      }}>
        {COLUMNS.map(c => {
          const active = sort.key === c.key;
          const f = c.factor ? FACTOR_BY_KEY[c.factor] : null;
          return (
            <button key={c.key} onClick={() => toggleSort(c.key)}
              title={f ? `${f.label} · ${f.question} · вес ${Math.round(f.weight * 100)}%` : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                justifyContent: c.align === 'right' ? 'flex-end' : 'flex-start',
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer',
                color: active ? 'var(--cf-accent)' : (f ? 'var(--cf-text7)' : 'var(--cf-text6)'),
                fontSize: 9, fontFamily: MONO, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
              }}>
              {c.label}
              {active && (sort.dir === -1 ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
            </button>
          );
        })}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 60px' }}>
        {!rows.length && (
          <div style={{ padding: '40px 18px', textAlign: 'center', fontSize: 12, color: 'var(--cf-text5)', fontFamily: MONO }}>
            Ничего не найдено.
          </div>
        )}
        {groups.map(g => (
          <div key={g.key}>
            {g.label && (
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8,
                padding: '14px 18px 6px', position: 'sticky', top: 0,
                background: 'var(--cf-canvas)', zIndex: 1,
              }}>
                <span style={{
                  fontSize: 10, color: 'var(--cf-text3)', fontFamily: MONO, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>{g.label}</span>
                {g.caption && <span style={{ fontSize: 9.5, color: 'var(--cf-text7)' }}>{g.caption}</span>}
                {g.plane && (
                  <span title={g.plane.blurb} style={{
                    fontSize: 8.5, fontFamily: MONO, color: 'var(--cf-text7)',
                    letterSpacing: '0.06em', cursor: 'help',
                  }}>{g.plane.short}</span>
                )}
                {g.conc && (
                  <span style={{
                    padding: '1px 6px', borderRadius: 4, background: g.conc.color + '18',
                    border: `1px solid ${g.conc.color}44`, color: g.conc.color,
                    fontSize: 8.5, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.06em',
                  }}>{g.conc.label}</span>
                )}
                <span style={{ fontSize: 9, color: 'var(--cf-text8)', fontFamily: MONO }}>{g.rows.length}</span>
              </div>
            )}
            {g.rows.map(n => <Row key={n.id} n={n} layerById={layerById} onOpen={onOpenEntity} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ n, layerById, onOpen }) {
  const cb = criticalityBand(n.criticality);
  return (
    <button onClick={() => onOpen(n.id)}
      style={{
        display: 'grid', gridTemplateColumns: GRID, gap: 8, width: '100%',
        padding: '7px 18px', alignItems: 'center',
        background: 'transparent', border: 'none',
        borderTop: '1px solid var(--cf-border-hair)',
        cursor: 'pointer', textAlign: 'left', transition: 'background 110ms',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>

      <Cell>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: 2, background: n.color, flexShrink: 0 }} />
          <span style={{
            fontSize: 12, color: 'var(--cf-text1)', fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{n.name}</span>
          {n.isAnchor && (
            <span title="Якорь экосистемы" style={{
              fontSize: 8, color: 'var(--cf-accent)', fontFamily: MONO, fontWeight: 700, flexShrink: 0,
            }}>ЯКОРЬ</span>
          )}
          {n.faded && (
            <span title={`Данные не подтверждались с ${n.lastConfirmed || '—'}`}
              style={{ fontSize: 8, color: 'var(--cf-muted)', fontFamily: MONO, flexShrink: 0 }}>устар.</span>
          )}
        </span>
      </Cell>

      <Cell mono dim>{n.roleMeta?.short || n.role}</Cell>

      <Cell>
        <span style={{
          fontSize: 11, color: 'var(--cf-text4)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
        }}>{n.sectorLabel}</span>
      </Cell>

      <Cell mono dim>
        <span title={n.segments.map(s => `${layerById.get(s.layer)?.label || s.layer} — ${s.criticality}`).join('\n')}>
          {n.segments.map(s => s.layerLabel || s.layer).join(' · ')}
        </span>
      </Cell>

      {/* Criticality: the bar makes the column scannable, the number keeps it exact */}
      <Cell align="right">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', width: '100%' }}>
          <span style={{ width: 34, height: 4, borderRadius: 2, background: 'var(--cf-surface2)', overflow: 'hidden', flexShrink: 0 }}>
            <span style={{ display: 'block', height: '100%', width: `${n.criticality}%`, background: cb.color }} />
          </span>
          <span title={cb.label} style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: cb.color, width: 22, textAlign: 'right' }}>
            {n.criticality}
          </span>
        </span>
      </Cell>

      {/* The four rubric inputs, bare. They are only readable as a ROW —
          "95 90 95 40" tells you this one holds on scarcity and time, not on
          leverage — so no bars here, just the digits in a fixed order. */}
      <FactorCell n={n} k="irreplaceability" />
      <FactorCell n={n} k="lockInDepth" />
      <FactorCell n={n} k="timeToReplace" />
      <FactorCell n={n} k="strategicControl" />

      <Cell mono align="right">{n.gravity?.score ?? '—'}</Cell>

      <Cell>
        {n.phaseMeta ? (
          <span title={n.phaseMeta.blurb} style={{
            fontSize: 9.5, fontFamily: MONO, fontWeight: 700, color: n.phaseMeta.color,
            letterSpacing: '0.04em', cursor: 'help',
          }}>{n.phaseMeta.label}</span>
        ) : null}
      </Cell>

      <Cell>
        {n.riskMeta ? (
          <span title={n.risk?.note || n.riskMeta.blurb} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 9.5, fontFamily: MONO, color: n.riskMeta.color, cursor: 'help',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: n.riskMeta.color, flexShrink: 0 }} />
            {n.riskMeta.label}
          </span>
        ) : null}
      </Cell>

      <Cell mono dim align="right">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
          <span title={`Зависит от ${n.upCount}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <ArrowDownLeft size={9} />{n.upCount}
          </span>
          <span title={`Кормит ${n.downCount}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <ArrowUpRight size={9} />{n.downCount}
          </span>
        </span>
      </Cell>
    </button>
  );
}

function FactorCell({ n, k }) {
  const v = n.criticalityFactors?.[k];
  const f = FACTOR_BY_KEY[k];
  return (
    <Cell mono align="right">
      {v == null ? '' : (
        <span title={`${f.label}: ${v} из 100 · вес ${Math.round(f.weight * 100)}%${n.criticalityWhy?.[k] ? `\n${n.criticalityWhy[k]}` : ''}`}
          style={{ cursor: 'help', color: v >= 85 ? 'var(--cf-text2)' : 'var(--cf-text6)' }}>
          {v}
        </span>
      )}
    </Cell>
  );
}

function Cell({ children, mono, dim, align }) {
  return (
    <span style={{
      minWidth: 0, fontSize: mono ? 10 : 11.5,
      fontFamily: mono ? MONO : 'inherit',
      color: dim ? 'var(--cf-text6)' : 'var(--cf-text2)',
      textAlign: align || 'left',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function Toggle({ children, on, onClick, title }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        padding: '4px 9px',
        background: on ? 'var(--cf-accent-bg)' : 'var(--cf-surface2)',
        border: `1px solid ${on ? 'var(--cf-accent-bd)' : 'var(--cf-border)'}`,
        borderRadius: 6, cursor: 'pointer',
        color: on ? 'var(--cf-accent)' : 'var(--cf-text4)',
        fontSize: 9.5, fontFamily: MONO, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
      }}>{children}</button>
  );
}

function plural(n, [one, few, many]) {
  const a = Math.abs(Math.round(n));
  const d = a % 10, dd = a % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}
