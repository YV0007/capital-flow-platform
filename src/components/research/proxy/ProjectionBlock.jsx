// Block 4 — Прокси vs прямой актив после IPO.
// LineChart моделирует доходность прямой покупки OpenAI и держания через
// SoftBank при базовом конгломератном дисконте 40%. Зелёная (прямая) и
// янтарная (прокси) линии расходятся — этот gap и есть «конгломератный
// налог». Под чартом — таблица capture ratio для шести прокси.

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceArea, Legend,
} from 'recharts';
import projection from '../../../data/proxy-projection.json';

function CustomTooltip({ active, payload, label, C }) {
  if (!active || !payload || !payload.length) return null;
  const item = projection.scenarios.find((s) => s.openaiGrowth === label);
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 8,
      padding: '10px 12px', fontFamily: 'var(--sans)', minWidth: 180,
    }}>
      <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 6 }}>
        Сценарий · {item?.scenarioLabel}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: C.ink, marginBottom: 4 }}>
        OpenAI · <span style={{ color: C.emerald }}>+{label}%</span>
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 12.5, color: C.ink }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontFamily: 'var(--mono)' }}>+{p.value}%</span>
        </div>
      ))}
      {item && item.gap > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.lineSoft}`, fontSize: 11, color: C.inkSoft }}>
          Налог за прокси: <span style={{ fontFamily: 'var(--mono)', color: C.rose }}>−{item.gap} п.п.</span>
        </div>
      )}
    </div>
  );
}

export default function ProjectionBlock({ C, card, subLabel }) {
  return (
    <div>
      <div style={subLabel}>OpenAI прямой vs SoftBank · базовый конгломератный дисконт 40%</div>

      <div style={{ ...card, padding: '18px 18px 8px' }}>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projection.scenarios} margin={{ top: 10, right: 24, left: 0, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.lineSoft} />
              {/* Reference shaded region для зоны "конгломератного налога" между двумя линиями.
                  Используем upper line (direct) минус lower (softBank) — Recharts не рисует gap-zone
                  напрямую, поэтому подсвечиваем правую часть графика как зону усиливающегося разрыва. */}
              <ReferenceArea x1={100} x2={300} fill={C.rose} fillOpacity={0.05} stroke="none" />
              <XAxis dataKey="openaiGrowth" stroke={C.inkFaint} tick={{ fill: C.inkFaint, fontSize: 11, fontFamily: 'var(--mono)' }}
                tickFormatter={(v) => `+${v}%`} label={{ value: 'рост OpenAI', position: 'insideBottom', offset: -6, fill: C.inkFaint, fontSize: 11, fontFamily: 'var(--sans)' }} />
              <YAxis stroke={C.inkFaint} tick={{ fill: C.inkFaint, fontSize: 11, fontFamily: 'var(--mono)' }}
                tickFormatter={(v) => `+${v}%`} label={{ value: 'доходность', angle: -90, position: 'insideLeft', offset: 18, fill: C.inkFaint, fontSize: 11, fontFamily: 'var(--sans)' }} />
              <Tooltip content={<CustomTooltip C={C} />} cursor={{ stroke: C.inkFaint, strokeDasharray: '3 3' }} />
              <Legend wrapperStyle={{ fontFamily: 'var(--sans)', fontSize: 12, color: C.inkSoft, paddingTop: 8 }} />
              <Line type="monotone" dataKey="direct"   stroke={C.emerald} strokeWidth={2.4} dot={{ r: 4, fill: C.emerald }} name="OpenAI напрямую" />
              <Line type="monotone" dataKey="softBank" stroke={C.teal}    strokeWidth={2.4} dot={{ r: 4, fill: C.teal    }} name="SoftBank (прокси)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Annotation */}
      <div style={{
        marginTop: 14, padding: '12px 16px',
        background: C.cardAlt, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.teal}`,
        borderRadius: 8, fontSize: 12.5, color: C.ink, lineHeight: 1.55,
      }}>
        <span style={{ fontWeight: 600, color: C.teal }}>Конгломератный налог: </span>
        при росте OpenAI на +200% прямой инвестор получает 2.0x, держатель SoftBank — только ~1.25x.
        Разрыв расширяется нелинейно вместе с ростом базового актива. Это плата за владение через холдинг.
      </div>

      {/* Capture ratio matrix */}
      <div style={{ marginTop: 26 }}>
        <div style={subLabel}>Capture ratio · что прокси реально передаёт держателю</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {projection.captureRatios.map((r) => (
            <div key={r.proxy} style={{ ...card, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600, color: C.ink }}>{r.proxy}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: C.teal }}>{r.captureRatio}</span>
              </div>
              <div style={{ fontSize: 11.5, color: C.inkSoft, marginBottom: 6 }}>
                <span style={{ color: C.inkFaint }}>актив: </span>{r.asset}
                <span style={{ color: C.inkFaint }}> · концентрация: </span>{r.concentration}
              </div>
              <div style={{ fontSize: 11.5, color: C.inkSoft, fontStyle: 'italic', lineHeight: 1.5 }}>{r.verdict}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
