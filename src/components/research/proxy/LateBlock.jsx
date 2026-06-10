// Block 5 — Почему прокси-трейд опоздал.
// BarChart 6-месячной доходности ключевых прокси. Бары окрашены по
// направлению (зелёный/красный). Бенчмарк S&P 500 проведён референс-линией
// — видно, насколько прокси переписали бенчмарк.

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, Cell, ReferenceLine,
} from 'recharts';
import lateData from '../../../data/proxy-late.json';

function CustomTooltip({ active, payload, C }) {
  if (!active || !payload || !payload.length) return null;
  const r = payload[0].payload;
  const sign = r.ret >= 0 ? '+' : '';
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 8,
      padding: '10px 12px', fontFamily: 'var(--sans)', minWidth: 220,
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.ink, marginBottom: 2 }}>{r.ticker}</div>
      <div style={{ fontSize: 13, color: C.ink, marginBottom: 6 }}>{r.name}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: C.inkSoft, marginBottom: 4 }}>
        <span>6 мес</span>
        <span style={{ fontFamily: 'var(--mono)', color: r.ret >= 0 ? C.emerald : C.rose, fontWeight: 600 }}>{sign}{r.ret}%</span>
      </div>
      <div style={{ fontSize: 11.5, color: C.inkFaint, marginBottom: 4 }}>Базовый актив · {r.underlying}</div>
      <div style={{ fontSize: 11.5, color: C.inkSoft, fontStyle: 'italic', lineHeight: 1.5 }}>{r.trigger}</div>
    </div>
  );
}

export default function LateBlock({ C, card, subLabel }) {
  const data = lateData.data;
  return (
    <div>
      <div style={subLabel}>Декабрь 2025 → июнь 2026 · 6-месячная доходность</div>

      <div style={{ ...card, padding: '18px 18px 8px' }}>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 26 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.lineSoft} />
              <XAxis dataKey="ticker" stroke={C.inkFaint}
                tick={{ fill: C.inkFaint, fontSize: 11, fontFamily: 'var(--mono)' }}
                interval={0} angle={-30} textAnchor="end" height={56} />
              <YAxis stroke={C.inkFaint} tick={{ fill: C.inkFaint, fontSize: 11, fontFamily: 'var(--mono)' }}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`} />
              <Tooltip content={<CustomTooltip C={C} />} cursor={{ fill: `${C.teal}0a` }} />
              <ReferenceLine y={0} stroke={C.inkFaint} strokeWidth={1} />
              <Bar dataKey="ret" radius={[4, 4, 0, 0]}>
                {data.map((r, i) => (
                  <Cell key={i}
                    fill={r.ticker === 'S&P 500' ? C.inkFaint : r.ret >= 0 ? C.emerald : C.rose}
                    fillOpacity={r.ticker === 'S&P 500' ? 0.5 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Annotation */}
      <div style={{
        marginTop: 14, padding: '12px 16px',
        background: C.cardAlt, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.teal}`,
        borderRadius: 8, fontSize: 12.5, color: C.ink, lineHeight: 1.55,
      }}>
        <span style={{ fontWeight: 600, color: C.teal }}>Рынок уже нашёл эти имена. </span>
        SKM, SATS, MNTN, SoftBank и SMT отыграли свои дисконты ещё до S-1 файлингов. К моменту, когда о прокси-трейде пишут в мейнстрим-аналитике, основной impulse уже отыгран. Salesforce — единственное обратное исключение: $5B доля в Anthropic не спасла слабость core-бизнеса.
      </div>

      {/* Lost-entry timeline */}
      <div style={{ marginTop: 26 }}>
        <div style={subLabel}>Хронология потерянных входов</div>
        <div style={{ ...card, padding: '16px 18px' }}>
          {[
            { when: 'Декабрь 2025',  what: 'SKM @ $22 · EchoStar @ $24 · MNTN @ $1.05',                              tag: 'идеальный вход' },
            { when: 'Январь 2026',   what: 'Anthropic Series G $380B · SpaceX IPO talks',                            tag: 'первый сигнал'   },
            { when: 'Февраль 2026',  what: 'Anthropic Series H starts · MNTN re-rating · уже +30%',                  tag: 'половина пути'   },
            { when: 'Апрель 2026',   what: 'SKM @ $30 · публичные bull-тезисы в мейнстриме',                          tag: 'осталось ~30%'   },
            { when: 'Май 2026',      what: 'SpaceX S-1 · EchoStar @ $40',                                            tag: 'осталось ~20%'   },
            { when: 'Июнь 2026',     what: 'Anthropic S-1 · SKM @ $44 · MNTN торгуется по NAV',                       tag: 'сейчас'           },
            { when: '12 июня 2026',  what: 'SpaceX IPO',                                                              tag: 'окно закрыто'     },
          ].map((row, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: i < arr.length - 1 ? 12 : 0 }}>
              <div style={{ width: 110, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11.5, color: C.inkFaint, paddingTop: 2 }}>{row.when}</div>
              <div style={{ position: 'relative', paddingTop: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === arr.length - 1 ? C.rose : i >= arr.length - 3 ? C.gold : C.teal }} />
                {i < arr.length - 1 && <div style={{ position: 'absolute', left: 4, top: 16, width: 2, height: 22, background: C.lineSoft }} />}
              </div>
              <div style={{ flex: 1, fontSize: 13, color: C.ink, paddingTop: 2 }}>
                {row.what}
                <span style={{ marginLeft: 10, fontSize: 10.5, padding: '2px 8px', borderRadius: 10,
                  background: i === arr.length - 1 ? `${C.rose}22` : i >= arr.length - 3 ? `${C.gold}22` : `${C.teal}22`,
                  color:      i === arr.length - 1 ? C.rose : i >= arr.length - 3 ? C.gold : C.teal,
                  fontFamily: 'var(--mono)', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600,
                }}>{row.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
