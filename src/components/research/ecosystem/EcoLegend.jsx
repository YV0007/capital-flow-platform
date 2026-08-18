// EcoLegend — the key to the ecosystem encoding. Same shell and behaviour as
// capitalflow/Legend (bottom-left, collapsed by default), different content.
//
// v2 adds three things and removes nothing: six roles instead of five, FIVE
// spines instead of two, and the source tiers as SENTENCES rather than as the
// numbers the contract ships. A reader who is told «тир 4» has learned
// nothing; a reader who is told «исследования и данные» has.
//
// The spine block is deliberately the longest and sits high: with five colour
// families the single most likely failure of this map is that it reads as a
// traffic light, and the only defence is that each family means something the
// reader can say out loud in one phrase.

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  ROLE_META, EDGE_TYPE_META, SPINE_META, TIER_META, STATUS_META,
  PHASE_META, CONCENTRATION_META, BAND_META, PLANE_META,
} from '../../../data/nvidiaEcosystem.js';

const MONO = 'ui-monospace, monospace';

export default function EcoLegend({ counts }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      position: 'absolute', left: 14, bottom: 14, zIndex: 12,
      width: open ? 268 : 122,
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
        <div style={{ padding: '10px 11px 12px', maxHeight: 'min(520px, calc(100vh - 260px))', overflowY: 'auto' }}>
          {/* The five spines lead: this is the map's first question. */}
          <Section title="Цвет связи = хребет">
            {Object.entries(SPINE_META)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([k, v]) => (
                <Row key={k} label={spineLine(k)} count={counts?.spine?.[k]} title={v.blurb}>
                  <span style={{ width: 14, height: 2, background: v.color, borderRadius: 1 }} />
                </Row>
              ))}
          </Section>

          <Section title="Три плана карты">
            {Object.entries(PLANE_META)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([k, v]) => (
                <Row key={k} label={`${v.label} — ${v.blurb}`} count={counts?.plane?.[k]} title={v.blurb}>
                  <span style={{
                    width: 11, height: 11, borderRadius: '50%',
                    background: (v.color || 'var(--cf-text5)') + (v.color ? '33' : ''),
                    border: `1.5px ${k === 'control' ? 'dashed' : 'solid'} ${v.color || 'var(--cf-text5)'}`,
                  }} />
                </Row>
              ))}
          </Section>

          <Section title="Размер плитки = критичность">
            <Row label="Критично — 90 и выше"><Tile s={15} /></Row>
            <Row label="Высоко — 75–89"><Tile s={12} /></Row>
            <Row label="Средне — 60–74"><Tile s={9} /></Row>
            <Row label="Низко — ниже 45"><Tile s={6} /></Row>
          </Section>

          {/* Roles are told apart by SHAPE as well as colour, so the map still
              reads for a colour-blind eye: colour alone carries the band. */}
          <Section title="Форма и обводка = роль">
            {Object.entries(ROLE_META)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts?.role?.[k]} title={v.blurb}>
                  <RoleMark shape={v.shape} color={v.color} />
                </Row>
              ))}
          </Section>

          <Section title="Цвет плитки = полоса слоя">
            {Object.entries(BAND_META).map(([k, v]) => (
              <Row key={k} label={v.label} count={counts?.band?.[k]}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: v.color }} />
              </Row>
            ))}
          </Section>

          <Section title="Фаза сущности">
            {Object.entries(PHASE_META)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts?.phase?.[k]} title={v.blurb}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: v.color }} />
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
            {Object.entries(STATUS_META)
              .sort((a, b) => a[1].rank - b[1].rank)
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts?.status?.[k]} title={v.blurb}>
                  <span style={{
                    width: 16, height: 2, borderRadius: 1,
                    background: k === 'confirmed' ? 'var(--cf-text2)' : k === 'high_confidence' ? 'var(--cf-text5)' : 'var(--cf-text8)',
                  }} />
                </Row>
              ))}
            <Row label="Пунктира нет: различие несёт яркость, точная формулировка — тултип и панель"
              title="Контракт говорит «один источник → пунктир». Пунктирные волосяные линии на карте с сотней связей читаются как шум и ломают семейное сходство с картой потоков, поэтому различие перенесено в яркость. Данные не тронуты — только их подача." />
          </Section>

          {/* Tiers as sentences. The contract numbers them 1-6; a number on
              screen would tell nobody anything. */}
          <Section title="Насколько твёрд источник">
            {Object.entries(TIER_META)
              .sort((a, b) => a[1].rank - b[1].rank)
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts?.tier?.[k]} title={v.blurb}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: v.color }} />
                </Row>
              ))}
          </Section>

          <Section title="Концентрация слоя">
            {Object.entries(CONCENTRATION_META)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts?.concentration?.[k]} title={v.blurb}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: v.color + '33', border: `1.5px solid ${v.color}` }} />
                </Row>
              ))}
            <Row label="Монопольный слой обведён и помечен ✦" />
          </Section>

          <div style={{
            marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--cf-border-soft)',
            fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, lineHeight: 1.6,
          }}>
            Клик по сущности → цепочка по стеку<br />
            Клик по названию острова → отчёт по слою<br />
            Esc → сбросить
          </div>
        </div>
      )}
    </div>
  );
}

/** One phrase per spine — the whole defence against a five-colour traffic light. */
function spineLine(k) {
  return {
    physical: 'Физика — что движется',
    capital:  'Капитал — кто платит',
    moat:     'Ров — что запирает',
    control:  'Контроль — кто шлюзует',
    rivalry:  'Соперничество — кто откусывает',
  }[k] || k;
}

/** The role's SHAPE, drawn for real. On the canvas the tile is frozen, so the
 *  shape lives here and the rim style carries the role over there. */
function RoleMark({ shape, color }) {
  const base = { width: 11, height: 11, border: `1.5px solid ${color}`, display: 'inline-block', flexShrink: 0 };
  if (shape === 'circle') return <span style={{ ...base, borderRadius: '50%' }} />;
  if (shape === 'rounded') return <span style={{ ...base, borderRadius: 4 }} />;
  if (shape === 'diamond') return <span style={{ ...base, transform: 'rotate(45deg)' }} />;
  if (shape === 'hex') return <span style={{ ...base, border: 'none', background: color, clipPath: 'polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)' }} />;
  if (shape === 'star') return <span style={{ ...base, border: 'none', background: color, clipPath: 'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }} />;
  return <span style={base} />;
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
