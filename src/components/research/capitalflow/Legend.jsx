// Legend overlay — the key to the visual encoding + interaction hints.
// Collapsible; the left column of the map lives behind it, so closed by
// default.

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SECTOR_META, FAMILY_META, STATUS_META } from '../../../data/capitalMap.js';
import { useT } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';

export default function Legend({ counts }) {
  const t = useT();
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
        {t('Легенда', 'Legend')}
        {open ? <ChevronDown size={12} color="var(--cf-text7)" /> : <ChevronUp size={12} color="var(--cf-text7)" />}
      </button>

      {open && (
        <div style={{ padding: '10px 11px 12px', maxHeight: 'min(460px, calc(100vh - 300px))', overflowY: 'auto' }}>
          <Section title={t('Зона = сектор', 'Zone = sector')}>
            {Object.entries(SECTOR_META)
              .sort((a, b) => a[1].order - b[1].order)
              .filter(([k]) => counts.sector?.[k])
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts.sector?.[k]}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: v.color }} />
                </Row>
              ))}
          </Section>

          <Section title={t('Форма = тип объекта', 'Shape = entity type')}>
            <Row label={t('Получатель · деньги приходят', 'Recipient · money arrives')}><GTarget /></Row>
            <Row label={t('Инвестор · вкладывает', 'Allocator · deploys')}><GSource /></Row>
            <Row label={t('Фонд · собранный капитал', 'Fund · raised capital')}><GFund /></Row>
            <Row label={t('Проект · физическая стройка', 'Project · a physical build')}><GProject /></Row>
          </Section>

          <Section title={t('Красное свечение = достоин внимания', 'Red bloom = worth attention')}>
            <Row label={t('Ядро — самые убеждённые', 'Core — deepest conviction')} title={t('Верхние ~10% по отбору, повторным ставкам и результату — не по размеру капитала.', 'The top ~10% on selection, repeat bets and outcome — not on capital size.')}><GGlow /></Row>
            <Row label={t('Ключ — стоит следить', 'Key — worth following')} title={t('Тот же расчёт, следующий уровень.', 'Same calculation, the next tier down.')}><GGlow soft /></Row>
            <Row label={t('Интересная сделка', 'Interesting deal')} title={t('Раннее и независимое схождение умных денег — не размер сделки.', 'Early, independent convergence of smart money — not deal size.')}><GGlow /></Row>
            <Row label={t('Остыл или не подтверждён', 'Gone cold or unconfirmed')} title={t('180 дней без активности либо только потоки-кандидаты.', '180 days without activity, or candidate-only flows.')}><GRim dashed /></Row>
          </Section>
          <div style={{
            marginTop: -5, marginBottom: 11, fontSize: 8.5, color: 'var(--cf-text7)',
            fontFamily: MONO, lineHeight: 1.55,
          }}>
            {t('Точная причина (Трендовый / Фундаментальный / Агрессивный / Проверенный и т.п.) — в панели объекта и в столбце «Уровень» таблицы.',
                'The exact reason (Trend-following / Fundamental / Aggressive / Proven and so on) lives in the entity panel and in the table\'s Tier column.')}
          </div>

          <Section title={t('Линия = тип события', 'Line = event type')}>
            {Object.entries(FAMILY_META).map(([k, v]) => (
              <Row key={k} label={v.label} count={counts.family?.[k]}>
                <span style={{ width: 13, height: 2.5, borderRadius: 2, background: v.color }} />
              </Row>
            ))}
          </Section>

          <Section title={t('Прозрачность линии = надёжность', 'Line opacity = confidence')}>
            {Object.entries(STATUS_META).map(([k, v]) => {
              const op = k === 'verified' ? 1 : k === 'verified_alpha' ? 0.6 : 0.32;
              return (
                <Row key={k} label={v.label} title={v.blurb}>
                  <span style={{ width: 15, height: 0, borderTop: '2.5px solid var(--cf-text3)', opacity: op }} />
                </Row>
              );
            })}
          </Section>

          <Section title={t('Грейд = источник × достоверность', 'Grade = source × credibility')}>
            <Row label={t('A1 — первоисточник, подтверждено', 'A1 — primary source, confirmed')} title={t('Буква — надёжность источника A(лучшая)–E; цифра — достоверность 1(лучшая)–5.', 'The letter is source reliability A(best)–E; the digit is credibility 1(best)–5.')}>
              <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--cf-good)', fontFamily: MONO }}>A1</span>
            </Row>
            <Row label={t('C3 — пресса, один источник', 'C3 — press, single source')}>
              <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--cf-warn)', fontFamily: MONO }}>C3</span>
            </Row>
            <Row label={t('C4 — без подтверждения', 'C4 — unconfirmed')}>
              <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--cf-muted)', fontFamily: MONO }}>C4</span>
            </Row>
          </Section>

          <div style={{
            marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--cf-border-soft)',
            fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, lineHeight: 1.65,
          }}>
            {t('Цвет узла = сфера · размер = капитал.', 'Node colour = domain · size = capital.')}<br />
            {t('Инвесторы в центре, сгруппированы по классам;', 'Allocators sit in the centre, grouped by class;')}<br />
            {t('секторы — по орбите вокруг.', 'sectors ring them in orbit.')}<br />
            <span style={{ color: 'var(--cf-warn)' }}>✦</span>{t(' / яркая зона = сработал сигнал.', ' / a lit zone = a signal fired.')}<br />
            {t('Прозрачность связи = надёжность · толщина = сумма.', 'Link opacity = confidence · thickness = amount.')}<br />
            <span style={{ color: 'var(--cf-text4)' }}>
              {t('Клик по узлу → панель разбора.', 'Click a node → the breakdown panel.')}<br />
              {t('Клик по связи → карточка сделки.', 'Click a link → the deal card.')}<br />
              {t('Esc снимает выделение.', 'Esc clears the selection.')}
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
function GGlow({ soft }) {
  return (
    <span style={{
      width: 11, height: 11, borderRadius: '50%', display: 'inline-block',
      background: 'radial-gradient(circle, var(--cf-pivot) 0%, color-mix(in srgb, var(--cf-pivot) 35%, transparent) 55%, transparent 100%)',
      opacity: soft ? 0.5 : 1,
    }} />
  );
}
