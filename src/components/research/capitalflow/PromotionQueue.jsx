// ══════════════════════════════════════════════════════════════════════════
// PromotionQueue — the Monday promotion pop-up.
//
// The engine DISCOVERS co-investors but never auto-adds them; each delivery
// ships `promotion_queue[]` of candidates awaiting a human decision. This modal
// renders the queue (ranked by how often the candidate was seen), captures a
// Yes/No per row, and exports a small `decisions.json` the engine consumes on
// its Monday run (`python tools/promote.py --from decisions.json`).
//
// The dashboard is static — it NEVER promotes or hides anyone itself. It only
// renders the queue and hands back the choice; the engine owns who is tracked.
//
// Gating: shows at most ONCE PER ISO WEEK — the weekly flow-review cadence — via
// a localStorage week key, regardless of how often the map is redeployed. Both
// deciding and "Позже" mark the week done; it returns next week with a rotated
// slice of candidates (a week-seeded shuffle of the salient pool).
// ══════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { X, Download, Copy, Check, Users } from 'lucide-react';

const MONO = 'ui-monospace, monospace';

const WEEK_KEY = 'cf:promo-week';           // ISO week already surfaced this cycle
const DECISIONS_KEY = 'cf:promo-decisions'; // last exported decisions block

// ISO-8601 week label, e.g. "2026-W33". The review is a WEEKLY ritual tied to
// the weekly flow refresh — gating on the week (not the delivery date) keeps the
// pop-up to once a week even if the map is redeployed midweek.
function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
export function currentWeekKey() { return isoWeekKey(); }

// Deterministic per-week shuffle — each week surfaces a DIFFERENT slice of the
// salient pool (stable within a week, varies across weeks). Seeded PRNG, never
// Math.random, or the list would reshuffle on every render / Yes-No click.
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function seededShuffle(list, seed) { const r = mulberry32(seed); const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const CLASS_RU = {
  corporate: 'Корпорация', vc: 'Венчурный фонд', alt_manager: 'Управляющий активами',
  sovereign: 'Суверенный фонд', individual: 'Частное лицо', fund: 'Фонд',
  private: 'Частная компания', public: 'Публичная компания',
};
const classLabel = (c) => CLASS_RU[c] || c || '—';

// Should the pop-up auto-open? At most once per ISO week (the weekly flow-review
// cadence), and only when the engine shipped candidates. Marked seen once the
// user acts or dismisses — it returns next week with a rotated set.
export function promoShouldOpen(queue) {
  if (!Array.isArray(queue) || !queue.length) return false;
  try {
    if (localStorage.getItem(WEEK_KEY) === currentWeekKey()) return false;
  } catch { /* storage blocked — just show it */ }
  return true;
}

function Pill({ children, color = 'var(--cf-text6)' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 9.5, fontFamily: MONO, fontWeight: 600, color,
      background: 'var(--cf-surface3)', border: '1px solid var(--cf-border-soft)',
      borderRadius: 5, padding: '2px 6px', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function YesNo({ value, onChange }) {
  const btn = (val, label, on, offColor, onColor) => (
    <button
      onClick={() => onChange(value === val ? undefined : val)}
      style={{
        font: 'inherit', fontSize: 11, fontWeight: 700, fontFamily: MONO,
        padding: '5px 12px', cursor: 'pointer',
        background: on ? onColor + '22' : 'var(--cf-surface1)',
        color: on ? onColor : 'var(--cf-text6)',
        border: `1px solid ${on ? onColor + '77' : 'var(--cf-border-soft)'}`,
        borderRadius: val === 'yes' ? '6px 0 0 6px' : '0 6px 6px 0',
        transition: 'all 120ms',
      }}>
      {label}
    </button>
  );
  return (
    <div style={{ display: 'inline-flex', flexShrink: 0 }}>
      {btn('yes', 'Да', value === 'yes', null, '#34D399')}
      {btn('no', 'Нет', value === 'no', null, '#F87171')}
    </div>
  );
}

// Show only the most worth-reviewing candidates, not the whole long tail. The
// engine ships `times_seen: 1` for everyone, so the real salience signal is how
// many ALREADY-TRACKED players a candidate co-invested alongside (`seen_with`) —
// network convergence. Rank by that, then cap. Undecided / hidden candidates are
// never dismissed; they simply return with the next delivery.
const MAX_SHOWN = 12;

export default function PromotionQueue({ queue, onClose }) {
  const [picks, setPicks] = useState({});     // candidate_id → 'yes' | 'no'
  const [copied, setCopied] = useState(false);

  // Rank by salience (co-investments with already-tracked players), keep the most
  // notable POOL, then surface a DIFFERENT weekly slice of it — so the review
  // doesn't show the same faces every week. Shown set re-sorted by score for a
  // tidy list; undecided candidates simply return in a later week.
  const ranked = useMemo(() => {
    const score = (i) => (i.seen_with?.length || 0) * 100 + (i.times_seen || 0);
    const byScore = [...queue].sort((a, b) => score(b) - score(a) || String(a.name || '').localeCompare(b.name || ''));
    const pool = byScore.slice(0, Math.min(byScore.length, MAX_SHOWN * 2 + 6));
    return seededShuffle(pool, hashStr(currentWeekKey())).slice(0, MAX_SHOWN).sort((a, b) => score(b) - score(a));
  }, [queue]);
  const hiddenCount = Math.max(0, queue.length - ranked.length);

  const set = (id, v) => setPicks(p => ({ ...p, [id]: v }));
  const promoteN = Object.values(picks).filter(v => v === 'yes').length;
  const dismissN = Object.values(picks).filter(v => v === 'no').length;
  const decided = promoteN + dismissN;

  const buildDecisions = () => {
    const promote = [], dismiss = [];
    for (const item of ranked) {
      const p = picks[item.candidate_id];
      if (p === 'yes') promote.push({ name: item.name, class: item.suggested_class, tier: 'watch' });
      else if (p === 'no') dismiss.push(item.name);
    }
    return { promote, dismiss };
  };

  // Persist the decision + mark this week reviewed (won't auto-open again until
  // next ISO week).
  const commit = () => {
    const decisions = buildDecisions();
    try {
      localStorage.setItem(DECISIONS_KEY, JSON.stringify(decisions));
      localStorage.setItem(WEEK_KEY, currentWeekKey());
    } catch { /* ignore */ }
    return decisions;
  };

  const download = () => {
    const decisions = commit();
    const blob = new Blob([JSON.stringify(decisions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'decisions.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    onClose();
  };

  const copy = async () => {
    const decisions = commit();
    try {
      await navigator.clipboard.writeText(JSON.stringify(decisions, null, 2));
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked — the download button still works */ }
  };

  // "Позже" — close without deciding; won't renag until next week (rotated set).
  const later = () => {
    try { localStorage.setItem(WEEK_KEY, currentWeekKey()); } catch { /* ignore */ }
    onClose();
  };

  return (
    <div
      onClick={later}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'var(--cf-scrim, rgba(6,8,12,0.62))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, backdropFilter: 'blur(2px)',
        animation: 'cfPromoIn 180ms ease',
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(680px, 100%)', maxHeight: 'min(84vh, 820px)',
          display: 'flex', flexDirection: 'column',
          background: 'var(--cf-surface0)', border: '1px solid var(--cf-border)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7)',
        }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--cf-border-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 8.5, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--cf-accent, #8E9BE6)', textTransform: 'uppercase' }}>
                Понедельник · кандидаты на добавление
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--cf-text0)', marginTop: 4, letterSpacing: '-0.01em' }}>
                {ranked.length} {plural(ranked.length, ['со-инвестор', 'со-инвестора', 'со-инвесторов'])} на ревью
              </div>
            </div>
            <button onClick={later} title="Позже" style={iconBtn}><X size={16} /></button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--cf-text5)', lineHeight: 1.5, marginTop: 8 }}>
            Движок нашёл этих со-инвесторов, но никогда не добавляет их сам — решаете вы.
            Отметьте «Да / Нет», затем экспортируйте <code style={{ fontFamily: MONO, color: 'var(--cf-text3)' }}>decisions.json</code> для понедельничного прогона движка.
            {hiddenCount > 0 && (
              <> Показаны самые заметные — по числу совместных сделок с уже отслеживаемыми игроками;
              ещё {hiddenCount} вернутся на следующей неделе.</>
            )}
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', padding: '6px 12px', flex: 1 }} className="cf-promo-scroll">
          {ranked.map((item) => (
            <div key={item.candidate_id} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '13px 8px', borderBottom: '1px solid var(--cf-border-hair)',
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--cf-text0)' }}>{item.name}</span>
                  <Pill color="var(--cf-text4)">{classLabel(item.suggested_class)}</Pill>
                  {Array.isArray(item.seen_with) && item.seen_with.length > 1 && (
                    <Pill color="#8E9BE6"><Users size={9} /> {item.seen_with.length} совместных</Pill>
                  )}
                </div>
                {item.description && (
                  <div style={{ fontSize: 11, color: 'var(--cf-text5)', lineHeight: 1.5, marginTop: 5 }}>
                    {item.description}
                  </div>
                )}
                {Array.isArray(item.seen_with) && item.seen_with.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
                    <Users size={10} color="var(--cf-text7)" style={{ flexShrink: 0 }} />
                    {item.seen_with.slice(0, 6).map((s, i) => <Pill key={i}>{s}</Pill>)}
                    {item.seen_with.length > 6 && <Pill>+{item.seen_with.length - 6}</Pill>}
                  </div>
                )}
              </div>
              <YesNo value={picks[item.candidate_id]} onChange={(v) => set(item.candidate_id, v)} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 18px', borderTop: '1px solid var(--cf-border-soft)',
          background: 'var(--cf-surface1)',
        }}>
          <div style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--cf-text6)', flex: 1 }}>
            <span style={{ color: '#34D399', fontWeight: 700 }}>{promoteN}</span> добавить ·{' '}
            <span style={{ color: '#F87171', fontWeight: 700 }}>{dismissN}</span> отклонить
          </div>
          <button onClick={later} style={ghostBtn}>Позже</button>
          <button onClick={copy} disabled={!decided} style={{ ...ghostBtn, opacity: decided ? 1 : 0.45, cursor: decided ? 'pointer' : 'default' }}>
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Скопировано' : 'Копировать'}
          </button>
          <button onClick={download} disabled={!decided} style={{ ...primaryBtn, opacity: decided ? 1 : 0.45, cursor: decided ? 'pointer' : 'default' }}>
            <Download size={12} /> Скачать decisions.json
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cfPromoIn { from { opacity: 0 } to { opacity: 1 } }
        .cf-promo-scroll::-webkit-scrollbar { width: 8px; }
        .cf-promo-scroll::-webkit-scrollbar-thumb { background: var(--cf-border); border-radius: 8px; }
      `}</style>
    </div>
  );
}

// tiny import kept local to avoid a format.js coupling for one helper
function plural(n, [one, few, many]) {
  const a = Math.abs(n) % 100, d = a % 10;
  if (a > 10 && a < 20) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}

const iconBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 8, flexShrink: 0, font: 'inherit',
  background: 'var(--cf-surface1)', border: '1px solid var(--cf-border-soft)',
  color: 'var(--cf-text5)', cursor: 'pointer',
};
const ghostBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6, font: 'inherit',
  fontSize: 11.5, fontWeight: 600, padding: '8px 13px', borderRadius: 8,
  background: 'var(--cf-surface3)', border: '1px solid var(--cf-border-soft)',
  color: 'var(--cf-text2)', cursor: 'pointer',
};
const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6, font: 'inherit',
  fontSize: 11.5, fontWeight: 700, padding: '8px 14px', borderRadius: 8,
  background: 'var(--cf-accent, #8E9BE6)', border: '1px solid transparent',
  color: '#0b0d12', cursor: 'pointer',
};
