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

import { useState } from 'react';
import { X, Sparkles, ShieldCheck } from 'lucide-react';
import { fmtUSD, plural } from './format.js';
import { CLASS_META, SECTOR_META, sectorLabel } from '../../../data/capitalMap.js';
import { useT } from '../../../lib/i18n.jsx';

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
  const t = useT();
  const [clsFilter, setClsFilter] = useState(null);   // null = все классы

  const all = nodes
    .filter(n => n.kind === 'allocator')
    .slice()
    .sort((a, b) => (b.capital || 0) - (a.capital || 0));

  // Class chips are built from what's actually present, heaviest class first —
  // so a class the engine stops sending simply disappears instead of showing
  // an empty filter.
  const classCounts = new Map();
  all.forEach(n => classCounts.set(n.cls, (classCounts.get(n.cls) || 0) + 1));
  const classChips = [...classCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([cls]) => cls);

  const allocators = clsFilter ? all.filter(n => n.cls === clsFilter) : all;

  // Aggregate top sectors — follows the filter, so the metric describes what
  // is actually on screen rather than the whole universe.
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
              {t('Тезисы инвесторов', 'Allocator theses')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--cf-text5)', fontFamily: MONO, marginTop: 4 }}>
              {t('Кто вкладывает, в каком статусе и почему — вся отслеживаемая вселенная инвесторов на одном экране',
             'Who deploys, at what standing and why — the whole tracked allocator universe on one screen')}
            </div>
          </div>
          <button onClick={onClose} title={t('Закрыть', 'Close')}
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
            <Sparkles size={11} color="var(--cf-warn)" /> {t('Как отбирали', 'How they were selected')}
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
            {t(`Закрываем весь круг инвесторов — от ангелов до государств: ангелы (Gil, Tan) → венчур (a16z, Sequoia)
            → поздние раунды (Coatue, Thrive) → инфраструктура и долг (Brookfield, Blackstone) → корпорации (NVIDIA)
            → государства (США, PIF).`,
               `We cover the full circle of allocators, from angels to states: angels (Gil, Tan) → venture (a16z, Sequoia)
            → late rounds (Coatue, Thrive) → infrastructure and debt (Brookfield, Blackstone) → corporates (NVIDIA)
            → states (the US, PIF).`)}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
            {t('В каждом звене берём', 'In every link we take the')} <strong style={{ color: 'var(--cf-text0)' }}>{t('ключевых', 'key')}</strong>{' '}
            {t(`аллокаторов — тех, кто задаёт цену и условия раунда, а не добирает по чужой оценке, и за чьим входом подтягиваются остальные.
            Плюс проверяемая история: они находили компании рано, до того как те стали очевидными — Тиль в PayPal и
            Palantir, Sequoia в Apple и NVIDIA, Founders Fund в SpaceX и Anduril.`,
               `allocators — the ones who set the price and the terms of a round rather than topping up at someone else's mark, and whose entry pulls the rest in.
            Plus a checkable history: they found companies early, before those companies were obvious — Thiel in PayPal and
            Palantir, Sequoia in Apple and NVIDIA, Founders Fund in SpaceX and Anduril.`)}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--cf-text4)', lineHeight: 1.65 }}>
            {t(`Смысл в том, что одна тема проходит этот круг снизу вверх: сначала заходит ангел, через год — венчур,
            ещё через год — инфраструктурный фонд.`,
               `The point is that one theme travels this circle from the bottom up: the angel goes in first, venture a year later,
            an infrastructure fund a year after that.`)}
          </p>
        </div>

        {/* Mini metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 20 }}>
          <div style={{ padding: '9px 11px', background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 8 }}>
            <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{t('Всего инвесторов', 'Allocators in total')}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--cf-text0)', marginTop: 3 }}>{allocators.length}</div>
          </div>
          <div style={{ padding: '9px 11px', background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)', borderRadius: 8, gridColumn: 'span 3' }}>
            <div style={{ fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>{t('Топ секторов — куда вкладывают', 'Top sectors — where they deploy')}</div>
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

        {/* Class filter — chips built from the classes actually present */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{
            fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.09em', marginRight: 2,
          }}>{t('Класс инвестора', 'Allocator class')}</span>
          <button onClick={() => setClsFilter(null)}
            style={{
              padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
              background: clsFilter === null ? 'var(--cf-accent-bg)' : 'var(--cf-surface2)',
              border: `1px solid ${clsFilter === null ? 'var(--cf-accent-bd)' : 'var(--cf-border)'}`,
              color: clsFilter === null ? 'var(--cf-accent)' : 'var(--cf-text3)',
              fontSize: 10, fontFamily: MONO, fontWeight: 600,
            }}>
            {t('Все', 'All')} · {all.length}
          </button>
          {classChips.map(([cls, count]) => {
            const on = clsFilter === cls;
            const meta = CLASS_META[cls];
            return (
              <button key={cls} onClick={() => setClsFilter(on ? null : cls)}
                title={meta?.blurb || undefined}
                style={{
                  padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                  background: on ? 'var(--cf-accent-bg)' : 'var(--cf-surface2)',
                  border: `1px solid ${on ? 'var(--cf-accent-bd)' : 'var(--cf-border)'}`,
                  color: on ? 'var(--cf-accent)' : 'var(--cf-text3)',
                  fontSize: 10, fontFamily: MONO, fontWeight: 600,
                }}>
                {meta?.label || cls} · {count}
              </button>
            );
          })}
        </div>

        {/* Roster table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cf-border)' }}>
                {[t('Инвестор', 'Allocator'), t('Тип', 'Type'), t('Во что вкладывает', 'What it backs'), t('Тезис', 'Thesis')].map(h => (
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
                    title={t(`Открыть ${n.name} на карте`, `Open ${n.name} on the map`)}
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
                        : <span style={{ fontSize: 11, color: 'var(--cf-text8)', fontStyle: 'italic' }}>{t('Тезис в данных пока не описан', 'No thesis described in the data yet')}</span>}
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
            <ShieldCheck size={11} color="var(--cf-warn)" /> {t('Что попадает на карту', 'What reaches the map')}
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
            {t(`На карту идёт только реальная инвестиция — деньги вложены или твёрдо обещаны: раунд, докупка доли,
            покупка компании, запуск фонда, госгрант, проектное финансирование. Запуск продукта, наём, партнёрство
            без денег или соглашение о намерениях на карту не попадают — это новость, а не вложение.`,
               `Only a real investment reaches the map — money deployed or firmly committed: a round, a top-up, an
            acquisition, a fund launch, a state grant, project finance. A product launch, a hire, a partnership
            with no money behind it or a memorandum of intent do not — those are news, not an investment.`)}
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
            {t('Каждая инвестиция получает статус по источнику:', 'Every investment is given a status by its source:')}
          </p>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
            <li><strong style={{ color: 'var(--cf-text0)' }}>{t('Подтверждённая', 'Verified')}</strong>{' '}
              {t('— есть первоисточник: отчётность в SEC, официальный релиз, страница инвестора, госбаза.',
                 '— a primary source exists: an SEC filing, an official release, the allocator\'s own page, a government database.')}</li>
            <li><strong style={{ color: 'var(--cf-text0)' }}>{t('Вероятная', 'Probable')}</strong>{' '}
              {t('— первоисточника нет, но два независимых издания говорят одно и то же.',
                 '— no primary source, but two independent outlets say the same thing.')}</li>
            <li><strong style={{ color: 'var(--cf-text0)' }}>{t('Кандидат', 'Candidate')}</strong>{' '}
              {t('— один источник или слух. Кандидаты видны на карте, но в сигналы не идут: неподтверждённая сделка не должна двигать статистику.',
                 '— a single source or a rumour. Candidates are visible on the map but never feed a signal: an unconfirmed deal must not move the statistics.')}</li>
          </ul>
          <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.65 }}>
            {t(`Ссылка ведёт на конкретный документ, который доказывает факт инвестиции. Сумма — та, что вложил
            конкретный инвестор; если раскрыт только весь раунд, это помечается отдельно. Оценка компании никогда
            не превращается в сумму сделки, и если раунд вели двое, сумма не удваивается.`,
               `The link points at the specific document that proves the investment. The amount is what that particular
            allocator put in; where only the whole round is disclosed, that is flagged separately. A valuation never
            becomes a deal size, and where two parties co-led a round the amount is not double-counted.`)}
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--cf-text4)', lineHeight: 1.65 }}>
            {t(`Сигнал — это не одна сделка, а сходимость: когда несколько ключевых аллокаторов независимо заходят в
            один сектор за короткий срок, движок фиксирует это и показывает, кто именно и когда. Перед публикацией
            всё проходит проверку — если у подтверждённой сделки нет источника или сумма противоречит раунду,
            выгрузка не уходит, пока не исправлено.`,
               `A signal is not one deal but a convergence: when several key allocators independently enter one sector
            inside a short window, the engine records it and shows exactly who and when. Everything is checked before
            publication — if a confirmed deal has no source, or an amount contradicts the round, the delivery does not
            ship until it is fixed.`)}
          </p>
        </div>
      </div>
    </div>
  );
}
