// Legend overlay — the key to the visual encoding + interaction hints.
// Collapsible; the left column of the map lives behind it, so closed by
// default.

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SECTOR_META, FAMILY_META, STATUS_META } from '../../../data/capitalMap.js';

const MONO = 'ui-monospace, monospace';

export default function Legend({ counts }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      position: 'absolute', left: 14, bottom: 14, zIndex: 12,
      width: open ? 248 : 122,
      background: 'var(--cf-panel)',
      border: '1px solid var(--cf-border)', borderRadius: 10,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 16px 40px -16px var(--cf-shadow)',
      overflow: 'hidden',
      transition: 'width 180ms',
    }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '8px 11px', background: 'transparent',
          border: 'none', borderBottom: open ? '1px solid var(--cf-border-soft)' : 'none',
          cursor: 'pointer', color: 'var(--cf-text2)',
          fontSize: 9.5, fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>
        Легенда
        {open ? <ChevronDown size={12} color="var(--cf-text7)" /> : <ChevronUp size={12} color="var(--cf-text7)" />}
      </button>

      {open && (
        <div style={{ padding: '10px 11px 12px', maxHeight: 'min(460px, calc(100vh - 300px))', overflowY: 'auto' }}>
          <Section title="Зона = сектор">
            {Object.entries(SECTOR_META)
              .sort((a, b) => a[1].order - b[1].order)
              .filter(([k]) => counts.sector?.[k])
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts.sector?.[k]}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: v.color }} />
                </Row>
              ))}
          </Section>

          <Section title="Форма = тип объекта">
            <Row label="Получатель · деньги приходят"><GTarget /></Row>
            <Row label="Инвестор · вкладывает"><GSource /></Row>
            <Row label="Фонд · собранный капитал"><GFund /></Row>
            <Row label="Проект · физическая стройка"><GProject /></Row>
          </Section>

          <Section title="Полоски = уровень инвестора">
            <Row label="Основной инвестор" title="Определяющий узел своей сети — самые убеждённые повторные инвесторы."><GPips n={2} /></Row>
            <Row label="Ключевой инвестор" title="Решает, куда пойдут миллиарды."><GPips n={1} /></Row>
            <Row label="Остыл или не подтверждён" title="180 дней без активности либо только потоки-кандидаты."><GRim dashed /></Row>
          </Section>

          <Section title="Красное свечение = достоин внимания">
            <Row label="Ключевой инвестор" title="Стоит следить: отбор, повторные ставки, доказанный результат — не размер капитала."><GGlow /></Row>
            <Row label="Интересная сделка" title="Ранее и независимое схождение умных денег — не размер сделки."><GGlow /></Row>
          </Section>

          <Section title="Линия = тип события">
            {Object.entries(FAMILY_META).map(([k, v]) => (
              <Row key={k} label={v.label} count={counts.family?.[k]}>
                <span style={{ width: 13, height: 2.5, borderRadius: 2, background: v.color }} />
              </Row>
            ))}
          </Section>

          <Section title="Прозрачность линии = надёжность">
            {Object.entries(STATUS_META).map(([k, v]) => {
              const op = k === 'verified' ? 1 : k === 'verified_alpha' ? 0.6 : 0.32;
              return (
                <Row key={k} label={v.label} title={v.blurb}>
                  <span style={{ width: 15, height: 0, borderTop: '2.5px solid var(--cf-text3)', opacity: op }} />
                </Row>
              );
            })}
          </Section>

          <Section title="Грейд = источник × достоверность">
            <Row label="A1 — первоисточник, подтверждено" title="Буква — надёжность источника A(лучшая)–E; цифра — достоверность 1(лучшая)–5.">
              <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--cf-good)', fontFamily: MONO }}>A1</span>
            </Row>
            <Row label="C3 — пресса, один источник">
              <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--cf-warn)', fontFamily: MONO }}>C3</span>
            </Row>
            <Row label="C4 — без подтверждения">
              <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--cf-muted)', fontFamily: MONO }}>C4</span>
            </Row>
          </Section>

          <div style={{
            marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--cf-border-soft)',
            fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, lineHeight: 1.65,
          }}>
            Цвет узла = сфера · размер = капитал.<br />
            Инвесторы в центре, сгруппированы по классам;<br />
            секторы — по орбите вокруг.<br />
            <span style={{ color: 'var(--cf-warn)' }}>✦</span> / яркая зона = сработал сигнал.<br />
            Прозрачность связи = надёжность · толщина = сумма.<br />
            <span style={{ color: 'var(--cf-text4)' }}>
              Клик по узлу → панель разбора.<br />
              Клик по связи → карточка сделки.<br />
              Esc снимает выделение.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{
        fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6,
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>{children}</div>
    </div>
  );
}

function Row({ label, count, title, children }) {
  return (
    <div title={title} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: title ? 'help' : 'default' }}>
      <span style={{ width: 15, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
        {children}
      </span>
      <span style={{ fontSize: 10, color: 'var(--cf-text3)', fontFamily: MONO, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      {count != null && (
        <span style={{ fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO }}>{count}</span>
      )}
    </div>
  );
}

// Glyphs mirror the on-canvas token language.
const N = 'var(--cf-text3)';

function GTarget() {
  return <span style={{ width: 11, height: 11, borderRadius: '50%', background: N, display: 'inline-block' }} />;
}

function GSource() {
  return (
    <span style={{ position: 'relative', width: 12, height: 12, display: 'inline-block' }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1.4px solid ${N}` }} />
      <span style={{ position: 'absolute', inset: 3.5, borderRadius: '50%', background: N }} />
    </span>
  );
}

function GFund() {
  return (
    <span style={{ position: 'relative', width: 12, height: 12, display: 'inline-block' }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N }} />
      <span style={{ position: 'absolute', inset: 3, borderRadius: '50%', border: '1px solid var(--cf-canvas)' }} />
    </span>
  );
}

function GProject() {
  return (
    <span style={{ position: 'relative', width: 12, height: 12, display: 'inline-block' }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: N }} />
      <span style={{ position: 'absolute', inset: 3, transform: 'rotate(45deg)', border: '1px solid var(--cf-canvas)' }} />
    </span>
  );
}

// Rank pips — the neutral rule drawn under a ranked allocator's tile.
function GPips({ n }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, width: 13, justifyContent: 'center' }}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} style={{ width: 5, height: 2, borderRadius: 1, background: 'var(--cf-text5)' }} />
      ))}
    </span>
  );
}

function GRim({ color = N, dashed }) {
  return (
    <span style={{
      width: 11, height: 11, borderRadius: '50%', display: 'inline-block',
      border: `1.6px ${dashed ? 'dashed' : 'solid'} ${color}`,
      background: dashed ? 'transparent' : 'var(--cf-surface3)',
    }} />
  );
}

// Matches the pivotal-node bloom drawn on the canvas (FlowGraph paintNode) —
// same red, a soft radial glow rather than an outline.
function GGlow() {
  return (
    <span style={{
      width: 11, height: 11, borderRadius: '50%', display: 'inline-block',
      background: 'radial-gradient(circle, var(--cf-pivot) 0%, color-mix(in srgb, var(--cf-pivot) 35%, transparent) 55%, transparent 100%)',
    }} />
  );
}
