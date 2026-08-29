// ══════════════════════════════════════════════════════════════════════════
// EcoEdgeCard — one dependency, opened up. Floats bottom-centre over the
// canvas, exactly like capitalflow/FlowDetailCard, so a click on a bond on
// either map lands you in the same place with the same shape of answer.
//
// The flow map's card leads with MONEY, because a flow is money. A bond here
// is a standing position of power and the contract carries no dollar volume at
// all — inventing one would be worse than not having it. So the card leads
// with what the payload does carry, in the same slots:
//
//   who does what to whom  ← the verb, coloured by its SPINE
//   what moves along it    ← the tech node (EUV · CoWoS · HBM3E · CUDA)
//   how much it matters    ← strength, the one score the card keeps
//   HOW THE COOPERATION WORKS ← `edge.detail`: contracts and their term,
//                            backlog, purchase volume, loans and their terms,
//                            stakes, capacity commitments. The point of the
//                            card — a drawn line says two firms are connected,
//                            this says what the connection actually IS.
//
//   WHO SAYS SO           ← `sidedness` + `claimedBy`, new in contract /4.
//                            The one exception to the "no taxonomy in the
//                            header" rule below, and it earns it: `bilateral`
//                            means BOTH ends state this relationship in their
//                            OWN documents, which is a stronger claim than any
//                            number of quotes from one side. It is a mark of
//                            quality about the RELATIONSHIP, not a label about
//                            the record. `disputed` is its opposite and ships
//                            with both quotes; the engine never settles it.
//
// Then: whether it can be undone, and every source quote behind one disclosure
// so the default state stays scannable.
//
// Deliberately NOT here: lock-in depth and substitutability (two more 0-100
// scores next to strength read as a dashboard, not as an answer), the risk
// block, and the provenance chip row. Tier, status, spine and dates are
// taxonomy about the RECORD, not facts about the relationship.
//
// `rightInset` = px of canvas covered by the entity panel; the card centres
// itself in the REMAINING space so the two never overlap.
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { X, ChevronDown, ChevronRight, ExternalLink, Quote } from 'lucide-react';
import { strengthBand, SIDEDNESS_META } from '../../../data/aiEcosystemNetwork.js';
import { useT, getLang } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';

export default function EcoEdgeCard({ edge, source, target, onClose, onOpenEntity, isFixture, rightInset = 0 }) {
  const t = useT();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  if (!edge) return null;

  const sb = strengthBand(edge.strength);
  const ev = edge.evidence || [];
  // A refutation can arrive in either of two places: the dedicated
  // `counterEvidence[]` array, or inline in `evidence[]` flagged `counter`.
  // Both are read, because the day the first `disputed` link ships is not the
  // day to discover which one the engine chose.
  const counter = [
    ...(edge.counterEvidence || []),
    ...ev.filter(q => q.counter),
  ];
  const claims = ev.filter(q => !q.counter);
  const sided = SIDEDNESS_META[edge.sidedness] || null;
  // The names behind `claimedBy` ids, so the line reads «заявили NVIDIA и TSMC»
  // rather than «claimedBy: nvidia, tsmc». Only the two ends of THIS edge can
  // appear there, so no wider lookup is needed.
  const claimNames = (edge.claimedBy || [])
    .map(id => (id === source?.id ? source?.name : id === target?.id ? target?.name : id))
    .filter(Boolean);
  const verb = edge.verb || edge.typeLabel;
  // The arrow carries the relation now that the capsed verb between the two
  // names is gone, so the sentence it used to say out loud lives in the
  // arrow's tooltip instead — in the direction the edge actually runs.
  const sentence = [source?.name, verb, target?.name].filter(Boolean).join(' ');

  return (
    <div style={{
      position: 'absolute', left: `calc(50% - ${rightInset / 2}px)`, bottom: 16,
      transform: 'translateX(-50%)',
      zIndex: 24, width: `min(620px, calc(100% - ${rightInset + 60}px))`, minWidth: 320,
      boxSizing: 'border-box',
      background: 'var(--cf-panel)',
      border: `1px solid ${edge.color}44`,
      borderRadius: 12,
      backdropFilter: 'blur(10px)',
      boxShadow: `0 24px 60px -18px var(--cf-shadow), 0 0 0 1px ${edge.color}18`,
      animation: 'cfmRise 200ms cubic-bezier(0.2,0.8,0.2,1)',
      transition: 'left 220ms cubic-bezier(0.2,0.8,0.2,1), width 220ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* ── Кто кому: два имени и стрелка между ними ─────────────────────
             Шапка была свалкой из четырёх кеглей в одну строку — имена 14px,
             слои 8.5px, глагол 9px капсом, направление 10px. Теперь имена
             набраны одинаково, слой стоит подписью ПОД именем, а связь несёт
             нарисованная стрелка, а не капсовый ярлык между слов. Тип связи
             ушёл вниз, к остальным чипам происхождения: он таксономия, а не
             заголовок. ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 14px 10px' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Party entity={source} onOpenEntity={onOpenEntity} />
          <Arrow color={edge.color} title={sentence} />
          <Party entity={target} onOpenEntity={onOpenEntity} />
        </div>

        <button onClick={onClose} title={t('Закрыть (Esc)', 'Close (Esc)')}
          style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 3, lineHeight: 0, flexShrink: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
          <X size={15} />
        </button>
      </div>

      {/* ── Чем они связаны ПО СУЩЕСТВУ ──────────────────────────────────
             Здесь стояло описание ТИПА связи — «показывает, что на этом
             зарабатывает не только продавец». Это определение рубрики, одно и
             то же у всех рёбер этого типа, и о конкретной паре компаний оно не
             говорит ничего. Ведёт конкретика: что физически идёт по связи
             (тех-узел) и собственный комментарий ребра. Определение типа
             осталось — в подсказке на чипе типа внизу. ──────────────── */}
      {(edge.techMeta || edge.note) && (
        <div style={{ padding: '0 14px 11px' }}>
          {edge.techMeta && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap', marginBottom: edge.note ? 6 : 0 }}>
              <span style={{
                padding: '2px 7px', borderRadius: 5, background: edge.color + '1a',
                border: `1px solid ${edge.color}44`, color: edge.color,
                fontSize: 9.5, fontFamily: MONO, fontWeight: 700, whiteSpace: 'nowrap',
              }}>{edge.techMeta.label}</span>
              <span style={{ fontSize: 11.5, color: 'var(--cf-text3)' }}>{edge.techMeta.note}</span>
            </div>
          )}
          {edge.note && (
            <div style={{ fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.5 }}>{edge.note}</div>
          )}
        </div>
      )}

      {/* ── Насколько связь существенна — «объём» этой карты ──────────── */}
      <div style={{ padding: '0 14px 10px', display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO, color: sb.color, lineHeight: 1 }}>
          {edge.strength}
        </span>
        <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cf-text7)' }}>/100</span>
        <span style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--cf-surface2)', overflow: 'hidden' }}>
          <span style={{
            display: 'block', height: '100%', borderRadius: 2, background: sb.color,
            width: `${Math.max(0, Math.min(100, edge.strength || 0))}%`,
          }} />
        </span>
        <span style={{ fontSize: 10.5, color: 'var(--cf-text4)', whiteSpace: 'nowrap' }}>
          {t('существенность', 'materiality')} {sb.label}
        </span>
        {/* Метка «обе стороны» — единственное, что осталось от блока про
            sidedness. Она сообщает НАЛИЧИЕ: оба конца описали связь в
            собственных документах, а это сильнее статуса `confirmed`,
            который может стоять на двух отчётах одной стороны. На `single`
            не рисуется ничего: отсутствие второй стороны — не факт. */}
        {edge.sidedness === 'bilateral' && sided && (
          <span title={`${sided.blurb}${claimNames.length ? `\n${t('Заявили: ', 'Claimed by: ')}${claimNames.join(' · ')}` : ''}`}
            style={{
              padding: '2px 7px', borderRadius: 5, whiteSpace: 'nowrap', cursor: 'help',
              background: sided.color + '1a', border: `1px solid ${sided.color}44`,
              color: sided.color, fontSize: 9.5, fontFamily: MONO, fontWeight: 700,
            }}>{t('ОБЕ СТОРОНЫ', 'BOTH SIDES')}</span>
        )}
      </div>

      {/* ── С чьих слов ─────────────────────────────────────────────────
             Отдельный блок про `sidedness` стоял здесь и убран. На `single`
             он сообщал ОТСУТСТВИЕ факта — «второй конец не высказывался», —
             занимая пятую часть карточки, и таких связей 244 из 314: место
             уходило на пустоту в четырёх случаях из пяти. Наличие сообщать
             стоит, отсутствие — нет. Осталась короткая метка `bilateral`
             рядом со статусом (см. шапку), расхождение сторон по-прежнему
             рисуется ниже открытым блоком. ─────────────────────────────── */}
      {/* ── Расхождение сторон ────────────────────────────────────────────
             Контракт /4 везёт `disputed` С ОБЕИМИ цитатами и никогда его не
             решает: две компании, по-разному описывающие собственные
             отношения, — это находка, а не дефект данных. Значит и рисуется
             оно ОТКРЫТЫМ, а не за кнопкой «показать источники»: спрятать одну
             из двух сторон здесь означало бы решить спор молча. В поставке
             v4.0 таких связей ноль, и путь отрисовки всё равно готов — иначе
             первый же случай приедет в прод невидимым. ─────────────────── */}
      {counter.length > 0 && (
        <div style={{ padding: '0 14px 12px' }}>
          <div style={{
            fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.11em', marginBottom: 7,
          }}>{t('Стороны расходятся', 'The sides disagree')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <QuoteColumn
              title={t('Утверждает', 'States it')}
              color="#34D399"
              quotes={claims}
            />
            <QuoteColumn
              title={t('Опровергает', 'Denies it')}
              color="#E0A340"
              quotes={counter}
            />
          </div>
        </div>
      )}

      {/* ── Как эта связь устроена в цифрах ───────────────────────────────
             Ради этого блока карточка и существует. `note` наверху говорит
             ОДНО предложение о сути — кто кого кормит; здесь идёт разбор:
             контракты и на сколько лет, бэклог, объём закупки, заём и его
             условия, доли, обязательства по мощности. Поле движковое
             (`edge.detail`) и приходит парой { ru, en }, как и остальная
             проза контракта. Пока его нет в поставке — блока просто нет,
             пустой заголовок хуже отсутствия. ────────────────────────── */}
      {edge.detail && (
        <div style={{ padding: '0 14px 12px' }}>
          <div style={{
            fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.11em', marginBottom: 6,
          }}>{t('Как устроено сотрудничество', 'How the cooperation works')}</div>
          <div style={{ fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.6 }}>{edge.detail}</div>
        </div>
      )}

      {/* Шаблонная плашка «связь не отыгрывается назад» убрана: один и тот же
          текст стоял на КАЖДОЙ связи с `isReversible === false` и не сообщал
          ничего именно об этой. Необратимость читается из `substitutability`
          и из разбора выше. */}
      {/* ── Цитаты — за одной кнопкой, чтобы карточка оставалась лёгкой ─ */}
      {ev.length > 0 && (
        <div style={{ borderTop: '1px solid var(--cf-border-hair)' }}>
          <button onClick={() => setSourcesOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, width: '100%',
              padding: '9px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--cf-text5)', fontSize: 9, fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'left',
            }}>
            {sourcesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {t('Источники и цитаты', 'Sources and quotes')}
            <span style={{ color: 'var(--cf-text8)' }}>· {ev.length}</span>
          </button>

          {sourcesOpen && (
            <div style={{ padding: '0 14px 13px' }}>
              {ev.map((q, i) => (
                <div key={i} style={{ borderLeft: `2px solid ${edge.color}66`, paddingLeft: 9, marginBottom: 9 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <Quote size={10} style={{ color: 'var(--cf-text7)', flexShrink: 0, marginTop: 3 }} />
                    <div style={{ fontSize: 11.5, color: 'var(--cf-text2)', lineHeight: 1.5 }}>{q.quote}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 5, flexWrap: 'wrap' }}>
                    {q.title && <span style={{ fontSize: 9.5, color: 'var(--cf-text4)' }}>{q.title}</span>}
                    {q.url && (
                      <a href={q.url} target="_blank" rel="noopener noreferrer" title={q.url}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-accent)', textDecoration: 'none',
                        }}>
                        {hostOf(q.url)} <ExternalLink size={9} />
                      </a>
                    )}
                    {q.published && (
                      <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cf-text7)' }}>{q.published}</span>
                    )}
                    {q.alive === false && (
                      <span style={{ fontSize: 9, fontFamily: MONO, color: '#E5484D' }}>{t('ссылка не отвечает', 'link does not respond')}</span>
                    )}
                    {isFixture && (
                      <span title={t('Данные пока черновые — настоящие цитаты придут с первым прогоном движка', 'The data is still a draft — real quotes arrive with the first engine run')} style={{
                        fontSize: 8.5, color: 'var(--cf-warn)', fontFamily: MONO, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'help',
                      }}>{t('черновик', 'draft')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * One side of a `disputed` link. Both columns are rendered at the same size
 * and in the same place, so neither reads as the map's own preferred answer.
 */
function QuoteColumn({ title, color, quotes }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontSize: 9, fontFamily: MONO, fontWeight: 700, color,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5,
      }}>{title}</div>
      {quotes.map((q, i) => (
        <div key={i} style={{ borderLeft: `2px solid ${color}66`, paddingLeft: 8, marginBottom: 8 }}>
          {q.quote && (
            <div style={{ fontSize: 11, color: 'var(--cf-text2)', lineHeight: 1.5, fontStyle: 'italic' }}>
              «{q.quote}»
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
            {q.title && <span style={{ fontSize: 9, color: 'var(--cf-text5)' }}>{q.title}</span>}
            {q.url && (
              <a href={q.url} target="_blank" rel="noopener noreferrer" title={q.url}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 9, fontFamily: MONO, color: 'var(--cf-accent)', textDecoration: 'none',
                }}>
                {hostOf(q.url)} <ExternalLink size={8} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** One end of the bond — clickable, so the card is also a way to walk. */
function Party({ entity, onOpenEntity }) {
  if (!entity) return null;
  return (
    <button onClick={() => onOpenEntity?.(entity.id)} title={entity.oneLiner || entity.name}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3,
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        minWidth: 0, textAlign: 'left',
      }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: entity.color, flexShrink: 0 }} />
        <span style={{
          fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--cf-text0)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{entity.name}</span>
      </span>
      <span style={{
        fontSize: 8.5, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text7)',
        textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: 14,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
      }}>{entity.primaryLayerLabel || entity.primaryLayer}</span>
    </button>
  );
}

/** The relation, drawn rather than written: a plain shaft with a head on it. */
function Arrow({ color, title }) {
  return (
    <span title={title} aria-hidden="true" style={{
      display: 'inline-flex', alignItems: 'center', flex: '0 0 auto',
      height: 20, cursor: 'help',
    }}>
      <span style={{ display: 'block', width: 26, height: 1.5, background: color, opacity: 0.9 }} />
      <span style={{
        display: 'block', width: 0, height: 0,
        borderLeft: `6px solid ${color}`,
        borderTop: '4px solid transparent',
        borderBottom: '4px solid transparent',
        opacity: 0.9,
      }} />
    </span>
  );
}

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return getLang() === 'en' ? 'source' : 'источник'; }
}
