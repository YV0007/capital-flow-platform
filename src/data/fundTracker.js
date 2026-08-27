// ══════════════════════════════════════════════════════════════════════════
// FUND TRACKER — data adapter
//
//   engine (weekly)  →  handoff/fund_tracker.json
//        →  src/data/fundTracker.json
//             →  here
//                  →  components/research/funds/
//
// Section 3 of the platform, and a DIFFERENT KIND OF OBJECT from the other
// two maps. Потоки is a graph of transactions between parties. Экосистема is a
// graph of standing positions. This is neither: a fixed set of independent
// funds and their books. There are no meaningful edges between funds, so the
// section draws none — nodes without links, a deterministic grid, and the real
// work happening in the panel, the tables and the timeline.
//
// PURE RENDERING. Every number below is read from the payload or derived from
// payload numbers by arithmetic that is stated in the code. Nothing is
// researched, inferred or written here. The prose the panel shows
// (`why_tracked` / `focus` / `strategy`) is the engine's, rendered verbatim.
//
// CONTRACT: FUND-TRACKER-CONTRACT.md, schema "fund-tracker/1".
// ══════════════════════════════════════════════════════════════════════════

import raw from './fundTracker.json';
import { getLang, L } from '../lib/i18n.jsx';
import { bi, biMap } from './capitalMap.js';

// The raw payload is deliberately NOT exported: nothing renders it, and the
// translation audit would walk every Russian half of every { ru, en } pair in
// it. Consumers use the decorated shapes below.
export const GENERATED = raw.generated;
export const CYCLE = raw.cycle;
export const TOTALS = raw.totals;
export const GUARDS = raw.guards;
export const IS_FIXTURE = raw.fixture === true;
/** Payload prose arrives as { ru, en } pairs — resolve at read time. */
export const fixtureNote = () => L(raw.fixture_note) || null;

// ── taxonomy ─────────────────────────────────────────────────────────────
// Labels come from the payload; the COLOUR is a dashboard concern and lives
// here. A style tag the engine adds later still renders — it just falls back
// to the neutral swatch rather than crashing.
const STYLE_COLOR = {
  activist:       '#FF6B6B',
  constructivist: '#F0913E',
  deep_value:     '#C2A36B',
  macro_equity:   '#A78BFA',
  growth_equity:  '#38BDF8',
  long_short:     '#45C0D0',
  contrarian:     '#F472B6',
  thematic:       '#34D399',
  family_office:  '#94A3B8',
  multi_strategy: '#64748B',
};
const STYLE_ORDER = [
  'activist', 'constructivist', 'deep_value', 'macro_equity',
  'growth_equity', 'long_short', 'contrarian', 'thematic',
  'family_office', 'multi_strategy',
];

// `label`/`blurb` ship as { ru, en } pairs; exposed here as getters so the
// ~100 call sites reading `STYLE_META[k].label` keep receiving a plain string.
export const STYLE_META = Object.fromEntries(
  Object.entries(raw.style_tags || {}).map(([k, v]) => {
    const o = {
      color: STYLE_COLOR[k] || '#8B8B95',
      order: STYLE_ORDER.indexOf(k) === -1 ? 99 : STYLE_ORDER.indexOf(k),
    };
    Object.defineProperty(o, 'label', { enumerable: true, get: () => L(v.label) });
    Object.defineProperty(o, 'blurb', { enumerable: true, get: () => L(v.blurb) });
    return [k, o];
  })
);
export const styleLabel = (k) => STYLE_META[k]?.label || k || '—';

export const SECTOR_LABELS = raw.sectors || {};
export const THEME_LABELS = raw.themes || {};
export const sectorLabel = (k) => L(SECTOR_LABELS[k]) || k || '—';
export const themeLabel = (k) => L(THEME_LABELS[k]) || k || '—';

export const ACTION_META = {
  new: bi({ label: ['Новая', 'New'], short: ['НОВ', 'NEW'],
    blurb: ['Позиция открыта в этом периоде.', 'Position opened this period.'] },
    { color: '#34D399', order: 0 }),
  added: bi({ label: ['Добор', 'Added'], short: ['ДОБ', 'ADD'],
    blurb: ['Число акций выросло. Считается по акциям, не по деньгам.',
            'The share count grew. Measured in shares, never in dollars.'] },
    { color: '#38BDF8', order: 1 }),
  trimmed: bi({ label: ['Сокращена', 'Trimmed'], short: ['СОКР', 'TRIM'],
    blurb: ['Число акций снизилось.', 'The share count fell.'] },
    { color: '#FBBF24', order: 2 }),
  exited: bi({ label: ['Закрыта', 'Exited'], short: ['ЗАКР', 'EXIT'],
    blurb: ['Позиция закрыта полностью.', 'Position closed in full.'] },
    { color: '#F87171', order: 3 }),
  hold: bi({ label: ['Без изм.', 'Unchanged'], short: ['—', '—'],
    blurb: ['Число акций не изменилось.', 'The share count did not move.'] },
    { color: '#71717A', order: 4 }),
};

export const INSTRUMENT_META = {
  common: bi({ label: ['Акции', 'Common'], short: ['ОБЫК', 'COM'] }, { color: '#A1A1AA', derivative: false }),
  adr:    bi({ label: ['ADR', 'ADR'], short: ['ADR', 'ADR'] }, { color: '#8B8B95', derivative: false }),
  call:   bi({ label: ['Колл', 'Call'], short: ['CALL', 'CALL'],
    blurb: ['В 13F опцион показан по номиналу (страйк × 100 × контракты), а не по риску.',
            'In a 13F an option is reported at notional (strike × 100 × contracts), not at risk.'] },
    { color: '#34D399', derivative: true }),
  put:    bi({ label: ['Пут', 'Put'], short: ['PUT', 'PUT'],
    blurb: ['В 13F опцион показан по номиналу (страйк × 100 × контракты), а не по риску. Это НЕ размер ставки.',
            'In a 13F an option is reported at notional (strike × 100 × contracts), not at risk. This is NOT the size of the bet.'] },
    { color: '#F87171', derivative: true }),
  note:   bi({ label: ['Ноты', 'Notes'], short: ['NOTE', 'NOTE'] }, { color: '#94A3B8', derivative: false }),
};

// Freshness is the whole game here, so the form that produced a row gets its
// own badge with its own typical lag written into the tooltip.
export const FORM_META = {
  '13F-HR':   bi({ lag: ['до 45 дней после конца квартала — строке может быть 4,5 месяца',
                         'up to 45 days after quarter end — a row can be 4.5 months old'] },
                 { label: '13F', color: '#8B8B95' }),
  '13F-HR/A': bi({ lag: ['поправка: снятие режима конфиденциальности — самое редкое событие раздела',
                         'an amendment: a confidential-treatment release — the rarest event in the section'] },
                 { label: '13F/A', color: '#FF4A55' }),
  'N-PORT':   bi({ lag: ['ежедневное раскрытие ETF — латентность один день',
                         'daily ETF disclosure — one day of latency'] },
                 { label: 'N-PORT', color: '#34D399' }),
  '4':        bi({ lag: ['два рабочих дня от сделки', 'two business days from the trade'] },
                 { label: 'Form 4', color: '#38BDF8' }),
  'SC 13D':   bi({ lag: ['пять дней от пересечения 5% с заявленным намерением',
                         'five days from crossing 5% with a stated intent'] },
                 { label: '13D', color: '#FF6B6B' }),
  'SC 13D/A': bi({ lag: ['дополнение к 13D', 'an amendment to a 13D'] }, { label: '13D/A', color: '#FF6B6B' }),
  'SC 13G':   bi({ lag: ['пассивная форма', 'the passive form'] }, { label: '13G', color: '#C2A36B' }),
  'SC 13G/A': bi({ lag: ['дополнение к 13G', 'an amendment to a 13G'] }, { label: '13G/A', color: '#C2A36B' }),
  'TR-1':     bi({ lag: ['ЕС/Великобритания: 2–4 дня, вне периметра 13F',
                         'EU/UK: 2–4 days, outside the 13F perimeter'] },
                 { label: 'TR-1', color: '#A78BFA' }),
  'Short register': bi({ label: ['Реестр шортов', 'Short register'],
                         lag: ['ежедневно, EU/UK', 'daily, EU/UK'] }, { color: '#F472B6' }),
};
export const formMeta = (f) => FORM_META[f] || { label: f || '—', color: '#8B8B95', lag: null };

export const JURISDICTION_META = {
  US: bi({ label: ['США', 'United States'] },       { flag: '🇺🇸' }),
  UK: bi({ label: ['Великобритания', 'United Kingdom'] }, { flag: '🇬🇧' }),
  DE: bi({ label: ['Германия', 'Germany'] },        { flag: '🇩🇪' }),
  ES: bi({ label: ['Испания', 'Spain'] },           { flag: '🇪🇸' }),
  FR: bi({ label: ['Франция', 'France'] },          { flag: '🇫🇷' }),
  JP: bi({ label: ['Япония', 'Japan'] },            { flag: '🇯🇵' }),
  CA: bi({ label: ['Канада', 'Canada'] },           { flag: '🇨🇦' }),
  AU: bi({ label: ['Австралия', 'Australia'] },     { flag: '🇦🇺' }),
};

export const EVENT_TYPE_META = {
  '13f':            { label: '13F',            color: '#8B8B95', loud: false, order: 6 },
  '13f_amendment':  bi({ label: ['Поправка 13F', '13F amendment'] }, { color: '#FF4A55', loud: true,  order: 0 }),
  '13d':            { label: '13D',            color: '#FF6B6B', loud: true,  order: 1 },
  '13g':            { label: '13G',            color: '#C2A36B', loud: false, order: 5 },
  'form4':          { label: 'Form 4',         color: '#38BDF8', loud: false, order: 3 },
  'tr1':            { label: 'TR-1',           color: '#A78BFA', loud: true,  order: 2 },
  'short_register': bi({ label: ['Реестр шортов', 'Short register'] }, { color: '#F472B6', loud: true,  order: 4 }),
  'ark_trade':      bi({ label: ['Дневная сделка', 'Daily trade'] }, { color: '#34D399', loud: false, order: 7 }),
  'n_port':         { label: 'N-PORT',         color: '#34D399', loud: false, order: 8 },
  'watch_trigger':  bi({ label: ['Триггер', 'Trigger'] }, { color: '#FF4A55', loud: true,  order: 0 }),
};
export const eventMeta = (t) => EVENT_TYPE_META[t] || { label: t || '—', color: '#8B8B95', loud: false, order: 9 };

// ── latency — the one thing that must never be implicit ──────────────────
// A 13F line can be 135 days old. A Form 4 is two days old. Rendering them the
// same way is a correctness bug, not a design preference, so every surface
// that shows a number also shows the band it falls in.
export const LATENCY_BANDS = [
  bi({ label: ['Свежее', 'Live'], short: ['≤2д', '≤2d'],
    blurb: ['Раскрыто за один-два дня от сделки. Позиция почти наверняка ещё стоит.',
            'Disclosed within a day or two of the trade. The position is almost certainly still on.'] },
    { key: 'live', max: 2, color: '#34D399' }),
  bi({ label: ['Недавнее', 'Recent'], short: ['≤7д', '≤7d'],
    blurb: ['Меньше недели. Рынок мог отыграть, но фонд, скорее всего, на месте.',
            'Under a week. The market may have moved, but the fund is probably still there.'] },
    { key: 'fresh', max: 7, color: '#45C0D0' }),
  bi({ label: ['Квартальное', 'Quarterly'], short: ['≤45д', '≤45d'],
    blurb: ['Стандартный срок 13F. Данные квартальные: то, что вы видите, — срез на конец периода.',
            'The standard 13F window. The data is quarterly: what you see is the period-end snapshot.'] },
    { key: 'recent', max: 45, color: '#C2A36B' }),
  bi({ label: ['Устаревает', 'Going stale'], short: ['≤90д', '≤90d'],
    blurb: ['Больше полутора месяцев после конца периода. Фонд успел изменить книгу и не обязан об этом сообщать.',
            'More than six weeks past period end. The fund has had time to change the book and owes no notice of it.'] },
    { key: 'stale', max: 90, color: '#FBBF24' }),
  bi({ label: ['Устарело', 'Stale'], short: ['>90д', '>90d'],
    blurb: ['Больше трёх месяцев. «Новая позиция» такого возраста может быть уже закрыта — считайте это историей, а не позицией.',
            'Over three months. A "new position" this old may already be closed — read it as history, not as a position.'] },
    { key: 'very_stale', max: Infinity, color: '#F87171' }),
];
export function latencyBand(days) {
  if (days == null || Number.isNaN(days)) return LATENCY_BANDS[LATENCY_BANDS.length - 1];
  return LATENCY_BANDS.find(b => days <= b.max) || LATENCY_BANDS[LATENCY_BANDS.length - 1];
}

/**
 * DISPLAY GUARD 1 — suppress % change on small positions.
 *
 * An 89% cut in a market maker's 0.02% inventory line is dramatic and means
 * nothing. Every surface that would print `share_delta_pct` asks this first;
 * below the threshold the number is withheld, not styled down, because a
 * de-emphasised wrong number is still a wrong number.
 */
export const MIN_WEIGHT_FOR_DELTA = GUARDS?.min_weight_for_delta ?? 0.005;
export const showDelta = (weight) => (weight || 0) >= MIN_WEIGHT_FOR_DELTA;
export const deltaSuppressedNote = () => L(GUARDS?.min_weight_note)
  || (getLang() === 'en'
    ? `Change withheld: the position is lighter than ${(MIN_WEIGHT_FOR_DELTA * 100).toFixed(1)}% of the book.`
    : `Изменение скрыто: позиция легче ${(MIN_WEIGHT_FOR_DELTA * 100).toFixed(1)}% книги.`);

// ── derived shapes ───────────────────────────────────────────────────────
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * How much of the book actually MOVED this period, as a share of the book.
 *
 * By weight, not by name count: a fund that renamed twelve 0.1% lines is
 * quiet; a fund that doubled its top holding is not. An exit carries no
 * current weight, so it counts at a flat token — otherwise a clean-out would
 * read as the quietest quarter on the map.
 */
function movedShare(fund) {
  if (!fund.positions?.length) return 0;
  return fund.positions.reduce((s, p) => {
    if (p.action === 'exited') return s + 0.015;
    if (p.action === 'new') return s + (p.weight || 0);
    if (p.action === 'added' || p.action === 'trimmed') {
      return s + (p.weight || 0) * Math.min(1, Math.abs(p.share_delta_pct || 0));
    }
    return s;
  }, 0);
}

/** Heat ramp for `activityIntensity`: quiet steel → warm → hot. */
export function activityColor(t) {
  const stops = [
    [0.0, [74, 85, 104]],     // #4A5568 — quiet
    [0.45, [194, 163, 107]],  // #C2A36B
    [0.75, [245, 158, 11]],   // #F59E0B
    [1.0, [255, 74, 85]],     // #FF4A55 — hot
  ];
  const x = clamp01(t);
  for (let i = 1; i < stops.length; i++) {
    if (x <= stops[i][0]) {
      const [a, ca] = stops[i - 1], [b, cb] = stops[i];
      const u = (x - a) / (b - a || 1);
      const c = ca.map((v, j) => Math.round(v + (cb[j] - v) * u));
      return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
    }
  }
  return '#FF4A55';
}
export const ACTIVITY_LEGEND = [
  bi({ label: ['Тихо', 'Quiet'] },           { t: 0.05 }),
  bi({ label: ['Обычно', 'Normal'] },        { t: 0.35 }),
  bi({ label: ['Активно', 'Active'] },       { t: 0.65 }),
  bi({ label: ['Разворот книги', 'Book turned over'] }, { t: 0.95 }),
];

// ── the universe, decorated ──────────────────────────────────────────────
const trackedRaw = raw.funds.filter(f => f.class === 'tracked');
const maxBook = Math.max(...trackedRaw.map(f => f.book_value_usd || 0), 1);
// The heat ramp is normalised against the busiest fund IN THIS PAYLOAD rather
// than a hard-coded ceiling. "Active" is a relative reading — active compared
// with the rest of the universe this cycle — and a fixed ceiling either
// saturates the top third or leaves the ramp unused when a quarter is calm.
const maxMoved = Math.max(...trackedRaw.map(movedShare), 0.01);

export const FUNDS = raw.funds.map(f => {
  const positions = (f.positions || []).map(p => ({
    ...p,
    fundId: f.id,
    fund: f.short_name,
    band: latencyBand(p.latency_days),
    actionMeta: ACTION_META[p.action] || ACTION_META.hold,
    instrumentMeta: INSTRUMENT_META[p.instrument] || INSTRUMENT_META.common,
    formMeta: formMeta(p.source_form),
    jurMeta: JURISDICTION_META[p.jurisdiction] || { label: p.jurisdiction, flag: '' },
    // An exit is exempt from the small-position guard: −100% is not a
    // percentage of a sliver, it is the whole position, and the row already
    // says ЗАКР. Suppressing it there read as "we are hiding something".
    deltaShown: p.action === 'exited' ? true : showDelta(p.weight),
  }));
  const moved = movedShare(f);
  const intensity = clamp01(moved / maxMoved);
  return {
    ...f,
    positions,
    livePositions: positions.filter(p => p.action !== 'exited'),
    styleMeta: STYLE_META[f.style_tag] || { label: f.style_tag, color: '#8B8B95', order: 99 },
    band: latencyBand(f.latency_days),
    formMeta: formMeta(f.source_form),
    intensity,
    movedShare: moved,
    activityColor: activityColor(intensity),
    // sqrt so the biggest book does not swallow the grid
    sizeShare: Math.sqrt((f.book_value_usd || 0) / maxBook),
    isWatch: f.class === 'watch',
    triggers: f.triggers || [],
    ytd: (f.returns || []).find(r => r.provisional) || null,
  };
});

export const TRACKED = FUNDS.filter(f => !f.isWatch);
// A watch-only entity enters the section ONLY when it has tripped a trigger.
export const WATCH = FUNDS.filter(f => f.isWatch && f.triggers.length > 0);
export const FUND_BY_ID = Object.fromEntries(FUNDS.map(f => [f.id, f]));

export const EVENTS = (raw.events || []).map(e => ({
  ...e,
  meta: eventMeta(e.type),
  band: latencyBand(e.latency_days),
  fundRef: FUND_BY_ID[e.fund_id] || null,
}));

export const SECURITIES = raw.securities || {};
export const securityOf = (ticker) => SECURITIES[ticker] || null;

// ── crossing: one security, which tracked funds hold it ──────────────────
// The "crowding" question — consensus vs the lone differentiated bet — is a
// pure regroup of the same rows, so it is computed once here rather than in
// three components.
export const CROSSING = (() => {
  const map = new Map();
  TRACKED.forEach(f => f.positions.forEach(p => {
    if (!map.has(p.ticker)) map.set(p.ticker, { ticker: p.ticker, issuer: p.issuer, rows: [] });
    map.get(p.ticker).rows.push(p);
  }));
  const out = {};
  map.forEach((v, k) => {
    const live = v.rows.filter(r => r.action !== 'exited');
    out[k] = {
      ...v,
      holders: live.length,
      totalValue: live.reduce((s, r) => s + (r.value_usd || 0), 0),
      netDirection: live.reduce((s, r) =>
        s + (r.action === 'new' || r.action === 'added' ? 1 : r.action === 'trimmed' ? -1 : 0), 0),
      security: SECURITIES[k] || null,
    };
  });
  return out;
})();
/** Tickers held by more than one tracked fund — the crowding filter. */
export const CROWDED = new Set(Object.values(CROSSING).filter(c => c.holders > 1).map(c => c.ticker));

/** Total position ROWS in the payload — exits included, since they are rows. */
export const POSITION_ROWS = TRACKED.reduce((s, f) => s + f.positions.length, 0);

/** Every position across the universe, for the by-position table. */
export const ALL_POSITIONS = TRACKED.flatMap(f => f.positions.map(p => ({
  ...p,
  crowded: CROWDED.has(p.ticker),
  crowdCount: CROSSING[p.ticker]?.holders || 1,
  fundStyle: f.style_tag,
  fundConviction: f.conviction?.score ?? null,
})));
