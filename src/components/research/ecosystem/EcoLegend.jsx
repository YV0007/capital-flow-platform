// EcoLegend — the key to the ecosystem encoding. Same shell and behaviour as
// capitalflow/Legend (bottom-left, collapsed by default), different content.
//
// v2 adds three things and removes nothing: six roles instead of five, FIVE
// spines instead of two, and the source tiers as SENTENCES rather than as the
// numbers the contract ships. A reader who is told «тир 4» has learned
// nothing; a reader who is told «исследования и данные» has.
//
// v4 adds three more blocks, and two of them are about the RECORD rather than
// about the drawing: `sidedness` (with whose word the link rests on) and the
// marks beside an entity's name. They are here because the alternative is
// worse — an unstudied node is drawn exactly like a studied one, and the only
// thing telling them apart is a mark whose meaning has to live somewhere.
// The tier ladder's own meaning also moved: тир 1 is now «сказала сама
// сущность», not «сказала NVIDIA». See TIER_META in nvidiaEcosystem.js.
//
// The spine block is deliberately the longest and sits high: with five colour
// families the single most likely failure of this map is that it reads as a
// traffic light, and the only defence is that each family means something the
// reader can say out loud in one phrase.

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  ROLE_META, EDGE_TYPE_META, SPINE_META, TIER_META, STATUS_META, SIDEDNESS_META,
  PHASE_META, CONCENTRATION_META, BAND_META, PLANE_META,
} from '../../../data/aiEcosystemNetwork.js';
import { useT, getLang } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';

export default function EcoLegend({ counts }) {
  const t = useT();
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
        {t('Легенда', 'Legend')}
        {open ? <ChevronDown size={12} color="var(--cf-text7)" /> : <ChevronUp size={12} color="var(--cf-text7)" />}
      </button>

      {open && (
        <div style={{ padding: '10px 11px 12px', maxHeight: 'min(520px, calc(100vh - 260px))', overflowY: 'auto' }}>
          {/* The five spines lead: this is the map's first question. */}
          <Section title={t('Цвет связи = хребет', 'Link colour = spine')}>
            {Object.entries(SPINE_META)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([k, v]) => (
                <Row key={k} label={spineLine(k)} count={counts?.spine?.[k]} title={v.blurb}>
                  <span style={{ width: 14, height: 2, background: v.color, borderRadius: 1 }} />
                </Row>
              ))}
          </Section>

          <Section title={t('Три плана карты', 'The map\'s three planes')}>
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

          <Section title={t('Размер плитки = критичность', 'Tile size = criticality')}>
            <Row label={t('Критично — 90 и выше', 'Critical — 90 and above')}><Tile s={15} /></Row>
            <Row label={t('Высоко — 75–89', 'High — 75–89')}><Tile s={12} /></Row>
            <Row label={t('Средне — 60–74', 'Medium — 60–74')}><Tile s={9} /></Row>
            <Row label={t('Низко — ниже 45', 'Low — below 45')}><Tile s={6} /></Row>
          </Section>

          {/* Roles are told apart by SHAPE as well as colour, so the map still
              reads for a colour-blind eye: colour alone carries the band. */}
          <Section title={t('Форма и обводка = роль', 'Shape and outline = role')}>
            {Object.entries(ROLE_META)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts?.role?.[k]} title={v.blurb}>
                  <RoleMark shape={v.shape} color={v.color} />
                </Row>
              ))}
          </Section>

          <Section title={t('Цвет плитки = полоса слоя', 'Tile colour = layer band')}>
            {Object.entries(BAND_META).map(([k, v]) => (
              <Row key={k} label={v.label} count={counts?.band?.[k]}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: v.color }} />
              </Row>
            ))}
          </Section>

          <Section title={t('Фаза сущности', 'Entity phase')}>
            {Object.entries(PHASE_META)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts?.phase?.[k]} title={v.blurb}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: v.color }} />
                </Row>
              ))}
          </Section>

          <Section title={t('Тип связи', 'Link type')}>
            {Object.entries(EDGE_TYPE_META)
              .filter(([k]) => counts?.type?.[k])
              .sort((a, b) => a[1].order - b[1].order)
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts?.type?.[k]} title={v.blurb}>
                  <span style={{ width: 14, height: 2, background: v.color, borderRadius: 1 }} />
                </Row>
              ))}
          </Section>

          {/* Contract /4 put a rung ABOVE «подтверждено»: `bilateral`, both
              ends stating the link in their own documents. Rows are sorted by
              the taxonomy's own `rank`, so it leads without a special case. */}
          <Section title={t('Яркость связи = насколько доказана', 'Link brightness = how well evidenced')}>
            {Object.entries(STATUS_META)
              .sort((a, b) => a[1].rank - b[1].rank)
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts?.status?.[k]} title={v.blurb}>
                  <span style={{
                    width: 16, height: 2, borderRadius: 1,
                    background: k === 'bilateral' ? 'var(--cf-text0)'
                      : k === 'confirmed' ? 'var(--cf-text2)'
                      : k === 'high_confidence' ? 'var(--cf-text5)' : 'var(--cf-text8)',
                  }} />
                </Row>
              ))}
            <Row label={t('Пунктира нет: различие несёт яркость, точная формулировка — тултип и панель', 'No dashes: brightness carries the distinction, and the exact wording lives in the tooltip and the panel')}
              title="Контракт говорит «один источник → пунктир». Пунктирные волосяные линии на карте с сотней связей читаются как шум и ломают семейное сходство с картой потоков, поэтому различие перенесено в яркость. Данные не тронуты — только их подача." />
          </Section>

          {/* `status` и `sidedness` соотносятся, но это РАЗНЫЕ поля: первое —
              насколько твёрдо, второе — с чьих слов. Связь может быть
              подтверждена двумя отчётами одной и той же стороны. */}
          <Section title={t('С чьих слов известна связь', 'Whose word the link rests on')}>
            {Object.entries(SIDEDNESS_META)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts?.sidedness?.[k]} title={v.blurb}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: v.color }} />
                </Row>
              ))}
            <Row label={t('Расхождение везётся с обеими цитатами и движком не решается', 'A disagreement is carried with both quotes and is never settled by the engine')} />
          </Section>

          {/* Не кодировка карты, а состояние записи — но читателю нужно там
              же, где всё остальное: неисследованный узел рисуется точно так
              же, как исследованный, и отличает их только эта пометка. */}
          <Section title={t('Пометки у имени сущности', 'Marks beside an entity name')}>
            <Row label={t('НЕ ИЗУЧЕН — до узла не дошла очередь исследования: собственного досье нет, доля функции пуста',
                          'UNSTUDIED — the research rotation has not reached the node: it has no dossier of its own and its share of the function is empty')}
              count={counts?.pendingDossier}>
              <span style={{
                width: 11, height: 8, borderRadius: 2,
                border: '1px dashed var(--cf-warn)',
              }} />
            </Row>
            <Row label={t('удержан — проверку членства не проходит, но назван в чужом подтверждённом досье',
                          "held — it does not pass the membership checks, but it is named in somebody else's confirmed dossier")}
              count={counts?.held}>
              <span style={{ width: 11, height: 8, borderRadius: 2, border: '1px solid var(--cf-text8)' }} />
            </Row>
            <Row label={t('ядро — верхние 30 по вычисленной интеграции, состав пересчитывается каждый прогон',
                          'core — the top 30 by computed integration, recomputed on every run')}
              count={counts?.core}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: '#FDE047' }} />
            </Row>
          </Section>

          {/* Tiers as sentences. The contract numbers them 1-6; a number on
              screen would tell nobody anything. */}
          <Section title={t('Насколько твёрд источник', 'How solid the source is')}>
            {Object.entries(TIER_META)
              .sort((a, b) => a[1].rank - b[1].rank)
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts?.tier?.[k]} title={v.blurb}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: v.color }} />
                </Row>
              ))}
          </Section>

          <Section title={t('Концентрация слоя', 'Layer concentration')}>
            {Object.entries(CONCENTRATION_META)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([k, v]) => (
                <Row key={k} label={v.label} count={counts?.concentration?.[k]} title={v.blurb}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: v.color + '33', border: `1.5px solid ${v.color}` }} />
                </Row>
              ))}
            <Row label={t('Монопольный слой обведён и помечен ✦', 'A monopoly layer is outlined and marked ✦')} />
          </Section>

          <div style={{
            marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--cf-border-soft)',
            fontSize: 9, color: 'var(--cf-text7)', fontFamily: MONO, lineHeight: 1.6,
          }}>
            {t('Клик по сущности → цепочка по стеку', 'Click an entity → the chain through the stack')}<br />
            {t('Клик по названию острова → отчёт по слою', 'Click an island title → the layer report')}<br />
            {t('Esc → сбросить', 'Esc → clear')}
          </div>
        </div>
      )}
    </div>
  );
}

/** One phrase per spine — the whole defence against a five-colour traffic light. */
// A plain helper, not a component — reads the module mirror rather than a hook.
function spineLine(k) {
  const en = getLang() === 'en';
  return {
    physical: en ? 'Physical — what moves'        : 'Физика — что движется',
    capital:  en ? 'Capital — who pays'           : 'Капитал — кто платит',
    moat:     en ? 'Moat — what locks in'         : 'Барьер — что запирает',
    control:  en ? 'Control — who gates'          : 'Контроль — кто шлюзует',
    rivalry:  en ? 'Rivalry — who takes a bite'   : 'Соперничество — кто откусывает',
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
