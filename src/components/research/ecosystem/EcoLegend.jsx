// EcoLegend — the key to the ecosystem encoding. Same shell and behaviour as
// capitalflow/Legend (bottom-left, collapsed by default), different content:
// a cell is a LAYER of the stack rather than a sector, tile size means
// criticality rather than capital, and the bond colour splits the physical
// spine from the capital one.

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  ROLE_META, EDGE_TYPE_META, SPINE_META, TIER_META, CONCENTRATION_META,
} from '../../../data/ecosystemMap.js';

const MONO = 'ui-monospace, monospace';

export default function EcoLegend({ counts }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      position: 'absolute', left: 14, bottom: 14, zIndex: 12,
      width: open ? 262 : 122,
      background: 'var(--cf-panel)',
      border: '1px solid var(--cf-border)', borderRadius: 10,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 16px 40px -16px var(--cf-shadow)',
      overflow: 'hidden', transition: 'width 180ms',
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
        <div style={{ padding: '10px 11px 12px', maxHeight: 'min(480px, calc(100vh - 300px))', overflowY: 'auto' }}>
          <Section title="Размер плитки = критичность">
            <Row label="Незаменим — 85 и выше"><Tile s={15} /></Row>
            <Row label="Труднозаменим — 65–85"><Tile s={11} /></Row>
            <Row label="Взаимозаменяем — ниже 40"><Tile s={7} /></Row>
          </Section>

          <Section title="Остров = слой стека">
            <Row label="Центр — хребет капитала: владеет и финансирует, но в стеке не стоит" />
            <Row label="По кругу от L1 к L12 — сырьё → оборудование → чипы → … → модели" />
            <Row label="Значок из полосок на плитке — компания живёт в нескольких слоях" />
          </Section>

          <Section title="Обводка = роль">
            {Object.entries(ROLE_META).map(([k, v]) => (
              <Row key={k} label={v.label} count={counts?.role?.[k]} title={v.blurb}>
                <span style={{
                  width: 13, height: 9, borderRadius: 3,
                  border: `1.5px ${k === 'capital' ? 'dashed' : k === 'platform' ? 'dotted' : 'solid'} ${v.color}`,
                }} />
              </Row>
            ))}
          </Section>

          <Section title="Цвет связи = хребет">
            {Object.entries(SPINE_META).map(([k, v]) => (
              <Row key={k} label={v.label} count={counts?.spine?.[k]} title={v.blurb}>
                <span style={{ width: 14, height: 2, background: v.color, borderRadius: 1 }} />
              </Row>
            ))}
          </Section>

          <Section title="Тип связи">
            {Object.entries(EDGE_TYPE_META)
              .filter(([k]) => counts?.type?.[k])
              .sort((a, b) => a[1].order - b[1].order)
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts?.type?.[k]} title={v.blurb}>
                  <span style={{ width: 14, height: 2, background: v.color, borderRadius: 1 }} />
                </Row>
              ))}
          </Section>

          <Section title="Яркость связи = насколько доказана">
            <Row label="Ярче — два и больше источника" title="Правило двух источников. Раньше это был пунктир против сплошной; пунктирные волосяные линии читались как шум, поэтому различие несёт яркость, а точная формулировка — тултип и панель.">
              <span style={{ width: 16, height: 2, background: 'var(--cf-text2)' }} />
            </Row>
            <Row label="Бледнее — один источник">
              <span style={{ width: 16, height: 2, background: 'var(--cf-text7)' }} />
            </Row>
            <Row label="Совсем блёклая — не подтверждалось 6 месяцев" />
          </Section>

          <Section title="Концентрация слоя">
            {Object.entries(CONCENTRATION_META).map(([k, v]) => (
              <Row key={k} label={v.label} count={counts?.concentration?.[k]} title={v.blurb}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: v.color + '33', border: `1.5px solid ${v.color}` }} />
              </Row>
            ))}
            <Row label="Монопольный слой обведён и помечен ✦" />
          </Section>

          <Section title="Тир источника">
            {Object.entries(TIER_META).map(([k, v]) => (
              <Row key={k} label={v.label} count={counts?.tier?.[k]} title={v.short}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: v.color }} />
              </Row>
            ))}
          </Section>

          <div style={{
            marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--cf-border-soft)',
            fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, lineHeight: 1.6,
          }}>
            Клик по компании → цепочка по стеку<br />
            Клик по названию острова → отчёт по слою<br />
            Esc → сбросить
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
        fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}

function Row({ label, count, title, children }) {
  return (
    <div title={title} style={{
      display: 'flex', alignItems: 'center', gap: 7,
      fontSize: 10, color: 'var(--cf-text3)', cursor: title ? 'help' : 'default',
    }}>
      <span style={{ width: 16, display: 'inline-flex', justifyContent: 'center', flexShrink: 0 }}>{children}</span>
      <span style={{ flex: 1, lineHeight: 1.35 }}>{label}</span>
      {count != null && <span style={{ fontFamily: MONO, fontSize: 9, color: 'var(--cf-text7)' }}>{count}</span>}
    </div>
  );
}

function Tile({ s }) {
  return <span style={{ width: s, height: s, borderRadius: s * 0.26, background: 'var(--cf-text5)', display: 'inline-block' }} />;
}
