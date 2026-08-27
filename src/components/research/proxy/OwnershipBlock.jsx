// Block 1 — Распределение долей.
// Три donut-чарта (SpaceX / OpenAI / Anthropic) с легендой справа и
// пояснениями ниже. Точные пропорции официально не раскрываются —
// допущения по группировке зафиксированы в proxy-ownership.json (_note).

import { useState } from 'react';
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from 'recharts';
import ownership from '../../../data/proxy-ownership.json';
import proxyTable from '../../../data/proxy-table.json';
import { useT } from '../../../lib/i18n.jsx';

// id блока ownership.json → asset name в proxy-table.json
const ASSET_MAP = { spacex: 'SpaceX', openai: 'OpenAI', anthropic: 'Anthropic' };

// Возвращает топ-3 держателя по долларовой стоимости стейка для актива.
function getTop3(companyId) {
  const assetName = ASSET_MAP[companyId];
  return [...proxyTable.rows]
    .filter((r) => r.asset === assetName)
    .sort((a, b) => (b.stakeUsdNum || 0) - (a.stakeUsdNum || 0))
    .slice(0, 3);
}

// Палитра тонов слайсов — мапим короткие ключи на токены темы и
// акцентный жёлтый отчёта Proxy.
function tintMap(C) {
  return {
    amber:   C.teal,        // акцент отчёта
    violet:  C.violet,
    blue:    C.blue,
    gold:    C.gold,
    teal:    C.emerald,
    emerald: C.emerald,
    neutral: C.inkFaint,
    rose:    C.rose,
  };
}

// Активная (наведённая) форма сектора. Slot выезжает наружу на 5 user
// units, получает мягкий drop-shadow цвета слайса — визуальный pop без
// рамок и focus-outline'ов.
function renderActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, paperFill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={paperFill}
        strokeWidth={2}
        style={{ filter: `drop-shadow(0 0 4px ${fill})`, outline: 'none' }}
      />
    </g>
  );
}

function Donut({ C, company }) {
  const tints = tintMap(C);
  const data = company.slices.map((s) => ({ name: s.label, value: s.value, fill: tints[s.tint] || C.inkFaint }));
  const total = data.reduce((a, b) => a + b.value, 0);

  const [activeIndex, setActiveIndex] = useState(null);
  const active = activeIndex != null ? data[activeIndex] : null;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: C.ink, lineHeight: 1.15 }}>{company.name}</div>
        <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 4, lineHeight: 1.4 }}>{company.subtitle}</div>
      </div>

      {/* Donut chart */}
      <div style={{ position: 'relative', width: '100%', height: 200, marginBottom: 14 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="92%"
              startAngle={90}
              endAngle={-270}
              stroke={C.paper}
              strokeWidth={2}
              isAnimationActive={false}
              activeIndex={activeIndex == null ? -1 : activeIndex}
              activeShape={(p) => renderActiveShape({ ...p, paperFill: C.card })}
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.fill}
                  stroke={C.card}
                  strokeWidth={2}
                  style={{ outline: 'none', cursor: 'pointer' }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label — switches to the hovered slice's label + value. */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', padding: '0 24px', textAlign: 'center' }}>
          {active ? (
            <>
              <span style={{ fontSize: 11, color: C.inkFaint, lineHeight: 1.2, marginBottom: 4, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {active.name}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, color: active.fill, lineHeight: 1 }}>
                {active.value}%
              </span>
            </>
          ) : (
            <>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: C.inkFaint, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                {t('оценка', 'estimate')}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 15, color: C.ink }}>
                {total}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {company.slices.map((s, i) => {
          const isActive = activeIndex === i;
          return (
            <div
              key={s.key}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '2px 6px', marginLeft: -6, marginRight: -6,
                borderRadius: 4,
                background: isActive ? `color-mix(in srgb, ${tints[s.tint] || C.inkFaint} 8%, transparent)` : 'transparent',
                transition: 'background 120ms',
                cursor: 'pointer',
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: 2, background: tints[s.tint] || C.inkFaint, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: isActive ? C.ink : C.inkSoft, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: isActive ? C.ink : C.inkSoft }}>{s.value}%</span>
            </div>
          );
        })}
      </div>

      {/* Top 3 держателей — заменяет старый текстовый список деталей */}
      <Top3List C={C} items={getTop3(company.id)} />
    </div>
  );
}

// Top 3 list — цветовая градация по рангу:
// #1 — emerald (зелёный), #2 — accent (янтарный), #3 — blue (синий).
// Фон-полоса слева пропорциональна размеру стейка относительно #1.
function Top3List({ C, items }) {
  if (!items || !items.length) return null;
  const max = items[0].stakeUsdNum || 1;
  const rankColors = [C.emerald, C.teal, C.blue];

  return (
    // marginTop: 'auto' прижимает блок к нижней границе flex-колонки карточки —
    // независимо от того, сколько строк в легенде сверху (5 у OpenAI vs 6 у
    // SpaceX/Anthropic), Top 3 у всех карточек оказываются на одном уровне.
    <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${C.lineSoft}`, display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: C.inkFaint, fontWeight: 600, marginBottom: 2 }}>
        Top 3 {t('держателей · по размеру стейка', 'holders · by stake size')}
      </div>
      {items.map((row, i) => {
        const accent = rankColors[i] || C.inkFaint;
        const pct = Math.min(100, ((row.stakeUsdNum || 0) / max) * 100);
        return (
          <div key={`${row.ticker}-${i}`} style={{
            position: 'relative',
            padding: '9px 12px',
            background: `${accent}0C`,
            border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)`,
            borderLeft: `3px solid ${accent}`,
            borderRadius: 6,
            overflow: 'hidden',
          }}>
            {/* relative-size bar (фон-плашка пропорциональна размеру стейка) */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: 0,
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${accent}1C 0%, ${accent}05 100%)`,
              pointerEvents: 'none',
            }} />

            {/* content */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                color: accent, letterSpacing: '.08em', minWidth: 20,
              }}>#{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: C.ink }}>{row.ticker}</span>
                  <span style={{ fontSize: 11, color: C.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{row.name}</span>
                </div>
                {row.sector && (
                  <div style={{ fontSize: 9.5, color: C.inkFaint, letterSpacing: '.04em', marginTop: 2, fontFamily: 'var(--mono)' }}>
                    {row.sector}
                  </div>
                )}
              </div>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
                color: accent, whiteSpace: 'nowrap',
              }}>{row.stakeUsdLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OwnershipBlock({ C, subLabel }) {
  const t = useT();
  return (
    <div>
      {/* Kill default SVG focus outline (the blue rectangle that appears on
          click) globally for this report's pie sectors. Scoped to a class
          name we add inline so it can't bleed into other reports. */}
      <style>{`
        .proxy-donut svg:focus,
        .proxy-donut .recharts-sector:focus,
        .proxy-donut .recharts-pie-sector:focus,
        .proxy-donut path:focus {
          outline: none !important;
        }
        .proxy-donut .recharts-pie-sector,
        .proxy-donut .recharts-sector { outline: none; }
      `}</style>
      <div style={subLabel}>{t('Три cap-table, нормализованные к 100% (оценочно) · наведите курсор на сектор', 'Three cap tables normalised to 100% (estimated) · hover a segment')}</div>
      <div className="proxy-donut" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, alignItems: 'stretch' }}>
        {ownership.companies.map((c) => <Donut key={c.id} C={C} company={c} />)}
      </div>
      <div style={{ marginTop: 16, fontSize: 11.5, color: C.inkFaint, fontStyle: 'italic', lineHeight: 1.55 }}>
        {t(`Доли сотрудников и фондов VC/PE официально не раскрываются и приведены как наиболее устойчивые оценки из публичных источников. Категория «Маск и инсайдеры» для SpaceX — equity, не голосующая доля (Маск контролирует {'>'}82% голосов после IPO).`,
           `Employee and VC/PE fund stakes are not officially disclosed and are given here as the most defensible estimates from public sources. The “Musk and insiders” category for SpaceX is equity, not voting control (Musk holds {'>'}82% of the votes after the IPO).`)}
      </div>
    </div>
  );
}
