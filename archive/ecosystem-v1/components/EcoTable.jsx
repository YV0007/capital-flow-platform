// ══════════════════════════════════════════════════════════════════════════
// EcoTable — the whole ecosystem as rows.
//
// Sibling of capitalflow/EntityTable, and there for the same reason: a map is
// good at "who touches whom" and bad at "show me everything, sorted". This is
// the sorted-everything view — every company in the payload, with the numbers
// the map can only encode as size and colour, and every column sortable.
//
// It answers the questions the canvas cannot:
//   · rank the whole ecosystem by criticality, or by gravity, or by reach
//   · read a layer or a role as a flat list instead of an island
//   · find the companies that nothing depends on, or that depend on nothing
//   · see who is public and how to get exposure, at a glance
//
// Grouping is by LAYER by default — the stack order is the reading order —
// with a flat mode for pure ranking. Clicking a row opens it on the map.
// ══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { criticalityBand, critIn, CONCENTRATION_META } from '../../../data/ecosystemMap.js';

const MONO = 'ui-monospace, monospace';

const COLUMNS = [
  { key: 'name',        label: 'Компания',   w: '1fr',  align: 'left'  },
  { key: 'role',        label: 'Роль',       w: '84px', align: 'left'  },
  { key: 'sector',      label: 'Функция',    w: '1fr',  align: 'left'  },
  { key: 'layers',      label: 'Слои',       w: '96px', align: 'left'  },
  { key: 'criticality', label: 'Критичн.',   w: '92px', align: 'right', num: true },
  { key: 'gravity',     label: 'Гравит.',    w: '76px', align: 'right', num: true },
  { key: 'up',          label: 'Зависит',    w: '68px', align: 'right', num: true },
  { key: 'down',        label: 'Кормит',     w: '68px', align: 'right', num: true },
  { key: 'exposure',    label: 'Экспозиция', w: '112px', align: 'left' },
];
const GRID = COLUMNS.map(c => c.w).join(' ');

const valueOf = (n, key) => {
  switch (key) {
    case 'name': return n.name.toLowerCase();
    case 'role': return n.roleMeta?.label || n.role;
    case 'sector': return n.sectorLabel || '';
    case 'layers': return n.primaryIdx;
    case 'criticality': return n.criticality || 0;
    case 'gravity': return n.gravity?.score || 0;
    case 'up': return n.upCount || 0;
    case 'down': return n.downCount || 0;
    case 'exposure': return n.publicPrivate === 'Pub' ? (n.ticker || 'Pub') : 'zzz';
    default: return 0;
  }
};

export default function EcoTable({
  nodes, layers, layerById, query, visibleNodes, onOpenEntity, topInset = 0,
}) {
  const [sort, setSort] = useState({ key: 'criticality', dir: -1 });
  const [grouped, setGrouped] = useState(true);
  const [onlyVisible, setOnlyVisible] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = nodes.filter(n => {
      if (onlyVisible && visibleNodes && !visibleNodes.has(n.id)) return false;
      if (!q) return true;
      return n.name.toLowerCase().includes(q)
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
  }, [nodes, query, sort, onlyVisible, visibleNodes]);

  // Grouped mode walks the stack in order; the capital spine gets its own
  // block at the top because it stands beside the stack, not inside it.
  const groups = useMemo(() => {
    if (!grouped) return [{ key: '_all', label: null, rows }];
    const out = [];
    const spine = rows.filter(n => n.role === 'capital');
    if (spine.length) out.push({ key: '_capital', label: 'ХРЕБЕТ КАПИТАЛА', caption: 'владеют и финансируют стек, не стоя в нём', rows: spine });
    layers.forEach(l => {
      const mem = rows.filter(n => n.role !== 'capital' && n.primaryLayer === l.id);
      if (!mem.length) return;
      const conc = CONCENTRATION_META[l.concentration?.level];
      out.push({ key: l.id, label: `${l.id} · ${l.label}`, caption: l.caption, conc, rows: mem });
    });
    return out;
  }, [grouped, rows, layers]);

  const toggleSort = (key) => setSort(s => (
    s.key === key ? { key, dir: -s.dir } : { key, dir: key === 'name' || key === 'sector' || key === 'role' ? 1 : -1 }
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
          {rows.length} {plural(rows.length, ['компания', 'компании', 'компаний'])}
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
        display: 'grid', gridTemplateColumns: GRID, gap: 10,
        padding: '8px 18px', borderBottom: '1px solid var(--cf-border)',
        flexShrink: 0, background: 'var(--cf-canvas)',
      }}>
        {COLUMNS.map(c => {
          const active = sort.key === c.key;
          return (
            <button key={c.key} onClick={() => toggleSort(c.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                justifyContent: c.align === 'right' ? 'flex-end' : 'flex-start',
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                color: active ? 'var(--cf-accent)' : 'var(--cf-text6)',
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
                {g.caption && (
                  <span style={{ fontSize: 9.5, color: 'var(--cf-text7)' }}>{g.caption}</span>
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
        display: 'grid', gridTemplateColumns: GRID, gap: 10, width: '100%',
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
          {n.tierMeta && (
            <span title={n.tierMeta.blurb} style={{
              fontSize: 8, color: n.tierMeta.color, fontFamily: MONO, fontWeight: 700,
              letterSpacing: '0.06em', flexShrink: 0,
            }}>{n.tierMeta.short}</span>
          )}
          {n.faded && (
            <span title={`Не подтверждалось с ${n.lastConfirmed || '—'}`}
              style={{ fontSize: 8, color: 'var(--cf-muted)', fontFamily: MONO, flexShrink: 0 }}>—</span>
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
        <span title={n.segments.map(s => `${s.layer} · ${layerById.get(s.layer)?.label || ''} — ${s.criticality}`).join('\n')}>
          {n.segments.map(s => s.layer).join('·')}
        </span>
      </Cell>

      {/* Criticality: the bar makes the column scannable, the number keeps it exact */}
      <Cell align="right">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', width: '100%' }}>
          <span style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--cf-surface2)', overflow: 'hidden', flexShrink: 0 }}>
            <span style={{ display: 'block', height: '100%', width: `${n.criticality}%`, background: cb.color }} />
          </span>
          <span title={cb.label} style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: cb.color, width: 22, textAlign: 'right' }}>
            {n.criticality}
          </span>
        </span>
      </Cell>

      <Cell mono align="right">{n.gravity?.score ?? '—'}</Cell>

      <Cell mono dim align="right">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
          <ArrowDownLeft size={9} />{n.upCount}
        </span>
      </Cell>
      <Cell mono dim align="right">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
          <ArrowUpRight size={9} />{n.downCount}
        </span>
      </Cell>

      <Cell mono dim>
        {n.publicPrivate === 'Pub'
          ? <span style={{ color: 'var(--cf-text3)' }}>{n.ticker || 'ПУБЛ.'}</span>
          : <span>частная</span>}
      </Cell>
    </button>
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
