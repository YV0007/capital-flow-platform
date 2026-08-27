// ══════════════════════════════════════════════════════════════════════════
// FundFilters — the same floating drawer, the same chip grammar and the same
// reset behaviour as the two maps' filter bars. Nothing new to learn; only the
// dimensions differ, because the objects differ.
//
// Semantics live in FundTracker.jsx — this component is presentational.
// ══════════════════════════════════════════════════════════════════════════

import { X, RotateCcw, Users } from 'lucide-react';
import {
  STYLE_META, ACTION_META, INSTRUMENT_META, LATENCY_BANDS,
  SECTOR_LABELS, THEME_LABELS,
} from '../../../data/fundTracker.js';
import { fmtDate } from './fundFormat.js';
import { MONO, hexA, useTone } from './FundBits.jsx';
import { useT } from '../../../lib/i18n.jsx';

export default function FundFilters({
  styles, onStyle,
  actions, onAction,
  minScore, onMinScore,
  sectors, onSector, sectorsPresent,
  themes, onTheme, themesPresent,
  instruments, onInstrument,
  maxLatency, onMaxLatency,
  periods, period, onPeriod,
  crowdedOnly, onCrowdedOnly,
  activeCount, onReset, onClose,
}) {
  const t = useT();
  return (
    <div style={{
      position: 'absolute', top: 58, right: 16, zIndex: 44,
      width: 'min(440px, calc(100vw - 32px))',
      background: 'var(--cf-panel)', border: '1px solid var(--cf-border)',
      borderRadius: 12, backdropFilter: 'blur(12px)',
      boxShadow: '0 24px 60px -16px var(--cf-shadow)',
      animation: 'cfmDrop 160ms ease-out',
      maxHeight: 'calc(100vh - 180px)', overflowY: 'auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px', borderBottom: '1px solid var(--cf-border-soft)',
        position: 'sticky', top: 0, background: 'var(--cf-panel)', zIndex: 1,
      }}>
        <span style={{
          fontSize: 10, color: 'var(--cf-text2)', fontFamily: MONO, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>{t('Фильтры', 'Filters')}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={onReset} disabled={!activeCount}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px',
              background: 'transparent',
              border: `1px solid ${activeCount ? 'var(--cf-text9)' : 'var(--cf-border-soft)'}`,
              borderRadius: 6, color: activeCount ? 'var(--cf-text2)' : 'var(--cf-text9)',
              fontSize: 9, fontFamily: MONO, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              cursor: activeCount ? 'pointer' : 'default',
            }}>
            <RotateCcw size={10} /> {t('Сброс', 'Reset')}
          </button>
          <button onClick={onClose} aria-label={t('Закрыть', 'Close')}
            style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 2, lineHeight: 0 }}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 14px 18px', display: 'flex', flexDirection: 'column', gap: 15 }}>
        {/* Latency threshold first — it is the section's governing dimension. */}
        <Group label={t('Латентность · не старше', 'Latency · no older than')}>
          <Wrap>
            <Chip on={!maxLatency} color="var(--cf-accent)" onClick={() => onMaxLatency(0)}
              title={t('Все строки, включая четырёхмесячные.', 'Every row, including the four-month-old ones.')}>{t('Любая', 'Any')}</Chip>
            {LATENCY_BANDS.filter(b => Number.isFinite(b.max)).map(b => (
              <Chip key={b.key} on={maxLatency === b.max} color={b.color}
                onClick={() => onMaxLatency(maxLatency === b.max ? 0 : b.max)}
                title={b.blurb}>{b.label} · {b.short}</Chip>
            ))}
          </Wrap>
          <Hint>{t('Возраст считается от даты сборки файла, а не от сегодняшнего дня.', 'Age is measured from the file\'s build date, not from today.')}</Hint>
        </Group>

        <Group label={t('Стиль', 'Style')}>
          <Wrap>
            {Object.entries(STYLE_META)
              .sort((a, b) => (a[1].order ?? 99) - (b[1].order ?? 99))
              .map(([k, m]) => (
                <Chip key={k} on={styles.has(k)} color={m.color} onClick={() => onStyle(k)} title={m.blurb}>
                  {m.label}
                </Chip>
              ))}
          </Wrap>
        </Group>

        <Group label={t('Действие за период', 'Action this period')}>
          <Wrap>
            {Object.entries(ACTION_META).map(([k, m]) => (
              <Chip key={k} on={actions.has(k)} color={m.color} onClick={() => onAction(k)} title={m.blurb}>
                {m.label}
              </Chip>
            ))}
          </Wrap>
        </Group>

        <Group label={`${t('Убеждённость · от', 'Conviction · from')} ${minScore}`}>
          <input type="range" min={0} max={100} step={5} value={minScore}
            onChange={(e) => onMinScore(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--cf-accent)' }} />
          <Hint>{t('Оценка движка: концентрация, срок держания, оборот и доборы на просадке.', 'The engine\'s score: concentration, holding period, turnover and adds into weakness.')}</Hint>
        </Group>

        <Group label={t('Инструмент', 'Instrument')}>
          <Wrap>
            {Object.entries(INSTRUMENT_META).map(([k, m]) => (
              <Chip key={k} on={instruments.has(k)} color={m.color} onClick={() => onInstrument(k)} title={m.blurb}>
                {m.label}
              </Chip>
            ))}
          </Wrap>
        </Group>

        <Group label={t('Сектор', 'Sector')}>
          <Wrap>
            {Object.entries(SECTOR_LABELS)
              .filter(([k]) => !sectorsPresent || sectorsPresent.has(k))
              .map(([k, label]) => (
                <Chip key={k} on={sectors.has(k)} color="#8B8B95" onClick={() => onSector(k)}>{label}</Chip>
              ))}
          </Wrap>
        </Group>

        <Group label={t('Тема', 'Theme')}>
          <Wrap>
            {Object.entries(THEME_LABELS)
              .filter(([k]) => !themesPresent || themesPresent.has(k))
              .map(([k, label]) => (
                <Chip key={k} on={themes.has(k)} color="#A78BFA" onClick={() => onTheme(k)}>{label}</Chip>
              ))}
          </Wrap>
        </Group>

        {periods.length > 1 && (
          <Group label={t('Период', 'Period')}>
            <Wrap>
              <Chip on={!period} color="var(--cf-accent)" onClick={() => onPeriod(null)}>{t('Все', 'All')}</Chip>
              {periods.map(p => (
                <Chip key={p} on={period === p} color="var(--cf-accent)"
                  onClick={() => onPeriod(period === p ? null : p)}>{fmtDate(p)}</Chip>
              ))}
            </Wrap>
          </Group>
        )}

        <Group label={t('Пересечение', 'Crowding')}>
          <button onClick={() => onCrowdedOnly(!crowdedOnly)}
            title={t('Только имена, которые держит больше одного отслеживаемого фонда.', 'Only names held by more than one tracked fund.')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 11px',
              background: crowdedOnly ? 'var(--cf-accent-bg)' : 'var(--cf-surface2)',
              border: `1px solid ${crowdedOnly ? 'var(--cf-accent-bd)' : 'var(--cf-border)'}`,
              borderRadius: 7, cursor: 'pointer',
              color: crowdedOnly ? 'var(--cf-accent)' : 'var(--cf-text3)',
              fontSize: 10, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.05em',
            }}>
            <Users size={11} /> {t('Держат больше одного фонда', 'Held by more than one fund')}
          </button>
        </Group>
      </div>
    </div>
  );
}

function Group({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: 9, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text6)',
        textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7,
      }}>{label}</div>
      {children}
    </div>
  );
}
const Wrap = ({ children }) => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{children}</div>;
const Hint = ({ children }) => (
  <div style={{ marginTop: 6, fontSize: 9, fontFamily: MONO, color: 'var(--cf-text8)', lineHeight: 1.5 }}>{children}</div>
);

function Chip({ on, color: rawColor, onClick, title, children }) {
  const color = useTone()(rawColor);
  const isVar = String(rawColor).startsWith('var(');
  return (
    <button onClick={onClick} title={title}
      style={{
        padding: '4px 9px', borderRadius: 6, cursor: 'pointer',
        background: on ? (isVar ? 'var(--cf-accent-bg)' : hexA(color, 0.14)) : 'transparent',
        border: `1px solid ${on ? (isVar ? 'var(--cf-accent-bd)' : hexA(color, 0.5)) : 'var(--cf-border-soft)'}`,
        color: on ? color : 'var(--cf-text5)',
        fontSize: 9.5, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}>{children}</button>
  );
}
