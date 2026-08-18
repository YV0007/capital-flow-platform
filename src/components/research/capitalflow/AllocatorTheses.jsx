// AllocatorTheses — "Тезисы" panel opened from the Table view.
//
// Answers "who invests, what kind of money is it, and why" for the whole
// allocator universe in one scan: a short methodology note (how the roster
// is built — the angel → VC → late-stage → infra → corporate → sovereign
// arc, and what "key" means), two mini-metrics, one row per allocator
// (name · type · sectors · thesis) sorted by capital, then a second
// methodology note below the roster — what the ENGINE requires before
// anything reaches the map at all (real money, sourcing, confidence tiers,
// what a signal actually is). Two different questions: the first is "why
// these investors," the second is "why trust what's shown about them."
//
// All figures are payload-derived (engineSectors, engineProfile) except
// `knownAs`/`sectorsFallback`/`thesisFallback`, which come from the
// dashboard-curated allocatorNotes.json (see its _note) and only ever fill a
// genuine gap — never override engine data.

import { X, Sparkles, ShieldCheck } from 'lucide-react';
import { fmtUSD, plural } from './format.js';
import { CLASS_META, SECTOR_META, sectorLabel } from '../../../data/capitalMap.js';

const MONO = 'ui-monospace, monospace';

// Top sectors for one allocator, from the engine's own per-allocator rollup.
// Falls back to the dashboard note only when the engine has nothing.
function topSectors(node, limit = 3) {
  const es = node.engineSectors;
  if (es && Object.keys(es).length) {
    return Object.entries(es)
      .sort((a, b) => (b[1]?.capital_usd || 0) - (a[1]?.capital_usd || 0))
      .slice(0, limit)
      .map(([key]) => sectorLabel(key))
      .join(', ');
  }
  return node.sectorsFallback || null;
}

function thesisOf(node) {
  return node.engineProfile?.thesis || node.engineProfile?.style || node.thesisFallback || null;
}

export default function AllocatorTheses({ nodes, onOpenEntity, onClose, topInset = 0 }) {
  const allocators = nodes
    .filter(n => n.kind === 'allocator')
    .slice()
    .sort((a, b) => (b.capital || 0) - (a.capital || 0));

  // Aggregate top sectors across the whole allocator universe, capital-weighted.
  const sectorTotals = new Map();
  allocators.forEach(n => {
    Object.entries(n.engineSectors || {}).forEach(([key, s]) => {
      sectorTotals.set(key, (sectorTotals.get(key) || 0) + (s?.capital_usd || 0));
    });
  });
  const topAggSectors = [...sectorTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, top: topInset, zIndex: 40,
      background: 'var(--cf-canvas)', overflowY: 'auto',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '18px 24px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cf-text0)', letterSpacing: '-0.01em' }}>
              Тезисы инвесторов
            </div>
            <div style={{ fontSize: 11, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 4 }}>
              Кто вкладывает, в каком статусе и почему — вся отслеживаемая вселенная инвесторов на одном экране
            </div>
          </div>
          <button onClick={onClose} title="Закрыть"
            style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 4, lineHeight: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
            <X size={18} />
          </button>
        </div>

        {/* Methodology — how the roster is built */}
        <div style={{
          marginTop: 16, marginBottom: 18, padding: '14px 16px', borderRadius: 10,
          background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)',
        }}>
          <div style={{
            fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Sparkles size={11} color="var(--cf-warn)" /> Как отбирали
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
            Закрываем весь круг инвесторов — от ангелов до государств: ангелы (Gil, Tan) → венчур (a16z, Sequoia)
            → поздние раунды (Coatue, Thrive) → инфраструктура и долг (Brookfield, Blackstone) → корпорации (NVIDIA)
            → государства (США, PIF).
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
            В каждом звене берём <strong style={{ color: 'var(--cf-text0)' }}>ключевых</strong> аллокаторов — тех,
            кто задаёт цену и условия раунда, а не добирает по чужой оценке, и за чьим входом подтягиваются остальные.
            Плюс проверяемая история: они находили компании рано, до того как те стали очевидными — Тиль в PayPal и
            Palantir, Sequoia в Apple и NVIDIA, Founders Fund в SpaceX и Anduril.
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--cf-text4)', lineHeight: 1.65 }}>
            Смысл в том, что одна тема проходит этот круг снизу вверх: сначала заходит ангел, через год — венчур,
            ещё через год — инфраструктурный фонд.
          </p>
        </div>

        {/* Mini metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 20 }}>
          <div style={{ padding: '9px 11px', background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 8 }}>
            <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Всего инвесторов</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--cf-text0)', marginTop: 3 }}>{allocators.length}</div>
          </div>
          <div style={{ padding: '9px 11px', background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 8, gridColumn: 'span 3' }}>
            <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>Топ секторов — куда вкладывают</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {topAggSectors.map(([key, cap]) => (
                <span key={key} style={{ fontSize: 11.5, color: 'var(--cf-text2)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: SECTOR_META[key]?.color || 'var(--cf-text6)' }} />
                  {sectorLabel(key)} <span style={{ color: 'var(--cf-text5)', fontFamily: MONO }}>{fmtUSD(cap)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Roster table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cf-border)' }}>
                {['Инвестор', 'Тип', 'Во что вкладывает', 'Тезис'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '7px 10px', fontSize: 9.5, color: 'var(--cf-text6)',
                    fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allocators.map(n => {
                const cls = CLASS_META[n.cls];
                const sectors = topSectors(n);
                const thesis = thesisOf(n);
                return (
                  <tr key={n.id} onClick={() => onOpenEntity(n.id)}
                    title={`Открыть ${n.name} на карте`}
                    style={{ cursor: 'pointer', borderBottom: '1px solid var(--cf-border-hair)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cf-surface1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '9px 10px', minWidth: 200, verticalAlign: 'top' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--cf-text1)' }}>{n.name}</div>
                      {n.knownAs && (
                        <div style={{ fontSize: 10.5, color: 'var(--cf-text6)', marginTop: 2 }}>{n.knownAs}</div>
                      )}
                    </td>
                    <td style={{ padding: '9px 10px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      <span style={{ fontSize: 10.5, fontFamily: MONO, color: cls?.color || 'var(--cf-text5)' }}>
                        {cls?.label || n.cls || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '9px 10px', minWidth: 180, verticalAlign: 'top' }}>
                      <span style={{ fontSize: 11.5, color: 'var(--cf-text3)' }}>{sectors || '—'}</span>
                    </td>
                    <td style={{ padding: '9px 10px', minWidth: 320, verticalAlign: 'top' }}>
                      {thesis
                        ? <span style={{ fontSize: 11.5, color: 'var(--cf-text2)', lineHeight: 1.5 }}>{thesis}</span>
                        : <span style={{ fontSize: 11, color: 'var(--cf-text8)', fontStyle: 'italic' }}>Тезис в данных пока не описан</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Second methodology note — what the ENGINE requires before anything
            reaches the map: real money, sourcing, confidence tiers, what a
            signal is. Different question from "Как отбирали" above (that one
            is about the roster; this one is about trusting what's shown). */}
        <div style={{
          marginTop: 26, padding: '14px 16px', borderRadius: 10,
          background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)',
        }}>
          <div style={{
            fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <ShieldCheck size={11} color="var(--cf-warn)" /> Что попадает на карту
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
            На карту идёт только реальная инвестиция — деньги вложены или твёрдо обещаны: раунд, докупка доли,
            покупка компании, запуск фонда, госгрант, проектное финансирование. Запуск продукта, наём, партнёрство
            без денег или соглашение о намерениях на карту не попадают — это новость, а не вложение.
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
            Каждая инвестиция получает статус по источнику:
          </p>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
            <li><strong style={{ color: 'var(--cf-text0)' }}>Подтверждённая</strong> — есть первоисточник: отчётность в SEC, официальный релиз, страница инвестора, госбаза.</li>
            <li><strong style={{ color: 'var(--cf-text0)' }}>Вероятная</strong> — первоисточника нет, но два независимых издания говорят одно и то же.</li>
            <li><strong style={{ color: 'var(--cf-text0)' }}>Кандидат</strong> — один источник или слух. Кандидаты видны на карте, но в сигналы не идут: неподтверждённая сделка не должна двигать статистику.</li>
          </ul>
          <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
            Ссылка ведёт на конкретный документ, который доказывает факт инвестиции. Сумма — та, что вложил
            конкретный инвестор; если раскрыт только весь раунд, это помечается отдельно. Оценка компании никогда
            не превращается в сумму сделки, и если раунд вели двое, сумма не удваивается.
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--cf-text4)', lineHeight: 1.65 }}>
            Сигнал — это не одна сделка, а сходимость: когда несколько ключевых аллокаторов независимо заходят в
            один сектор за короткий срок, движок фиксирует это и показывает, кто именно и когда. Перед публикацией
            всё проходит проверку — если у подтверждённой сделки нет источника или сумма противоречит раунду,
            выгрузка не уходит, пока не исправлено.
          </p>
        </div>
      </div>
    </div>
  );
}
