// FilterDrawer — floating filter panel over the full-screen canvas.
// Quick views apply a whole filter combination at once; below them, Sector ·
// Class · Tier select entities and Event · Status · Recency · Min flow select
// flows (semantics live in CapitalFlowMap; this component is presentational).

import { X, RotateCcw, Zap } from 'lucide-react';
import {
  SECTOR_META, CLASS_META, TIER_META, FAMILY_META, STATUS_META, NETWORK_META,
  sectorLabel,
} from '../../../data/capitalMap.js';
import { fmtUSD } from './format.js';
import { RECENCY_OPTIONS, cutoffDate } from './views.js';
import { useT } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';

export default function FilterDrawer({
  views = [], activeViewId, onApplyView,
  sectorsPresent,
  sectors, onToggleSector,
  classes, onToggleClass,
  tiers, onToggleTier,
  networksPresent, networksSel, onToggleNetwork,
  families, onToggleFamily,
  statuses, onToggleStatus,
  minAmount, onMinAmount, maxAmount,
  minConfidence, onMinConfidence, confidenceThreshold,
  sinceDays, onSinceDays, generated,
  activeCount, onReset, onClose,
}) {
  const t = useT();
  // Only offer the sectors that are actually in the file this cycle.
  const sectorKeys = Object.keys(sectorsPresent || {})
    .sort((a, b) => (SECTOR_META[a]?.order ?? 99) - (SECTOR_META[b]?.order ?? 99));
  const allocClasses = Object.entries(CLASS_META).filter(([, v]) => v.side === 'allocator');
  const targetClasses = Object.entries(CLASS_META).filter(([, v]) => v.side === 'target');

  return (
    <div style={{
      position: 'absolute', top: 58, right: 16, zIndex: 32,
      width: 'min(440px, calc(100vw - 32px))',
      background: 'var(--cf-panel)',
      border: '1px solid var(--cf-border)', borderRadius: 12,
      backdropFilter: 'blur(12px)',
      boxShadow: '0 24px 60px -16px var(--cf-shadow)',
      animation: 'cfmDrop 160ms ease-out',
      maxHeight: 'calc(100vh - 180px)', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 14px', borderBottom: '1px solid var(--cf-border-soft)',
        position: 'sticky', top: 0, background: 'var(--cf-panel)', zIndex: 1,
      }}>
        <span style={{ fontSize: 10, color: 'var(--cf-text2)', fontFamily: MONO, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {t('Фильтры', 'Filters')}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={onReset} disabled={activeCount === 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', background: 'transparent',
              border: `1px solid ${activeCount ? 'var(--cf-text9)' : 'var(--cf-border-soft)'}`, borderRadius: 6,
              color: activeCount ? 'var(--cf-text2)' : 'var(--cf-text9)',
              fontSize: 9, fontFamily: MONO, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              cursor: activeCount ? 'pointer' : 'default',
            }}>
            <RotateCcw size={10} /> {t('Сброс', 'Reset')}
          </button>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 2, lineHeight: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Quick views — a whole filter combination in one click */}
        {views.length > 0 && (
          <div>
            <GroupLabel>{t('Быстрые виды · готовые комбинации', 'Quick views · ready-made combinations')}</GroupLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {views.map(v => {
                const on = v.id === activeViewId;
                return (
                  <button key={v.id} onClick={() => !v.disabled && onApplyView(v)}
                    title={v.disabled ? v.blurb : `${v.blurb}${on ? `\n\n${t('Повторный клик снимает.', 'Click again to clear.')}` : ''}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px',
                      background: on ? hexA(v.color, 0.12) : 'var(--cf-surface2)',
                      border: `1px solid ${on ? hexA(v.color, 0.55) : 'var(--cf-border)'}`,
                      borderRadius: 8, textAlign: 'left',
                      cursor: v.disabled ? 'not-allowed' : 'pointer',
                      opacity: v.disabled ? 0.4 : 1,
                      transition: 'all 130ms',
                    }}
                    onMouseEnter={(e) => { if (!on && !v.disabled) e.currentTarget.style.borderColor = 'var(--cf-text9)'; }}
                    onMouseLeave={(e) => { if (!on) e.currentTarget.style.borderColor = 'var(--cf-border)'; }}>
                    <Zap size={11} style={{ flexShrink: 0, color: on ? v.color : 'var(--cf-text7)' }} />
                    <span style={{
                      fontSize: 10.5, fontFamily: MONO, fontWeight: 700,
                      color: on ? v.color : 'var(--cf-text2)', whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{v.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 7, fontSize: 9, color: 'var(--cf-text8)', fontFamily: MONO, lineHeight: 1.55 }}>
              {activeViewId
                ? views.find(v => v.id === activeViewId)?.blurb
                : t('Каждый вид заменяет фильтры ниже. Наведите, чтобы узнать, что он выбирает; клик по активному виду снимает его.', 'Each view replaces the filters below. Hover to see what it selects; clicking the active view clears it.')}
            </div>
          </div>
        )}

        {/* Recency — ages measured against the payload date, not today */}
        <div>
          <GroupLabel>{t('Свежесть · потоки', 'Recency · flows')}{generated ? ` · ${t('на', 'as of')} ${generated}` : ''}</GroupLabel>
          <ChipWrap>
            {RECENCY_OPTIONS.map(o => (
              <Chip key={o.days} on={(sinceDays || 0) === o.days} color="var(--cf-accent)" square
                title={o.days === 0
                  ? t('Все потоки в файле.', 'Every flow in the file.')
                  : t(`Потоки с датой от ${cutoffDate(generated, o.days) || '—'} — последние ${o.days} дней данных.`,
                       `Flows dated ${cutoffDate(generated, o.days) || '—'} or later — the last ${o.days} days of data.`)}
                onClick={() => onSinceDays(o.days)}>
                {o.label}
              </Chip>
            ))}
          </ChipWrap>
        </div>

        {/* Sector */}
        <div>
          <GroupLabel>{t('Сектор · получатели', 'Sector · recipients')}</GroupLabel>
          <ChipWrap>
            {sectorKeys.map(k => {
              const s = sectorsPresent[k];
              const meta = SECTOR_META[k] || {};
              return (
                <Chip key={k} on={sectors.has(k)} color={meta.color || 'var(--cf-text5)'}
                  title={`${t('Сделок', 'Deals')}: ${s.deals} · ${fmtUSD(s.capital)}${s.lit ? ` · ${t('сигнал', 'signal')}` : ''}`}
                  onClick={() => onToggleSector(k)}>
                  {s.lit && <span style={{ color: 'var(--cf-warn)', marginRight: -1 }}>✦</span>}
                  {sectorLabel(k)}
                </Chip>
              );
            })}
          </ChipWrap>
        </div>

        {/* Class */}
        <div>
          <GroupLabel>{t('Класс инвестора', 'Allocator class')}</GroupLabel>
          <ChipWrap>
            {allocClasses.map(([k, v]) => (
              <Chip key={k} on={classes.has(k)} color={v.color} onClick={() => onToggleClass(k)}>
                {v.zone || v.label}
              </Chip>
            ))}
          </ChipWrap>
          <div style={{ height: 8 }} />
          <GroupLabel>{t('Класс получателя', 'Recipient class')}</GroupLabel>
          <ChipWrap>
            {targetClasses.map(([k, v]) => (
              <Chip key={k} on={classes.has(k)} color={v.color} square onClick={() => onToggleClass(k)}>
                {v.zone || v.label}
              </Chip>
            ))}
          </ChipWrap>
        </div>

        {/* Tier */}
        <div>
          <GroupLabel>{t('Уровень инвестора', 'Allocator tier')}</GroupLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {Object.entries(TIER_META).map(([k, t]) => {
              const on = tiers.has(k);
              return (
                <button key={k} onClick={() => onToggleTier(k)} title={t.blurb}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 10px',
                    background: on ? hexA(t.color, 0.1) : 'var(--cf-surface2)',
                    border: `1px solid ${on ? hexA(t.color, 0.5) : 'var(--cf-border)'}`,
                    borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 130ms',
                  }}>
                  <span style={{ fontSize: 9, color: t.color, fontFamily: MONO, fontWeight: 800, width: 40, flexShrink: 0 }}>{t.short}</span>
                  <span style={{ fontSize: 11.5, color: on ? 'var(--cf-text0)' : 'var(--cf-text2)', fontWeight: 600, flex: 1 }}>{t.label}</span>
                  <span style={{ fontSize: 9, color: t.color, letterSpacing: 1 }}>{t.stars}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Network */}
        {networksPresent && networksPresent.length > 0 && (
          <div>
            <GroupLabel>{t('Сеть · элитные круги', 'Network · elite circles')}</GroupLabel>
            <ChipWrap>
              {networksPresent.map(k => {
                const v = NETWORK_META[k] || { label: k, color: '#F5B942' };
                return (
                  <Chip key={k} on={networksSel.has(k)} color={v.color} onClick={() => onToggleNetwork(k)}>
                    {v.label}
                  </Chip>
                );
              })}
            </ChipWrap>
          </div>
        )}

        {/* Event family */}
        <div>
          <GroupLabel>{t('Тип события · потоки', 'Event type · flows')}</GroupLabel>
          <ChipWrap>
            {Object.entries(FAMILY_META).map(([k, v]) => (
              <Chip key={k} on={families.has(k)} color={v.color} square onClick={() => onToggleFamily(k)}>
                {v.label}
              </Chip>
            ))}
          </ChipWrap>
        </div>

        {/* Status */}
        <div>
          <GroupLabel>{t('Статус · потоки', 'Status · flows')}</GroupLabel>
          <ChipWrap>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <Chip key={k} on={statuses.has(k)} color={v.color} title={v.blurb} onClick={() => onToggleStatus(k)}>
                {v.label}
              </Chip>
            ))}
          </ChipWrap>
        </div>

        {/* Confidence score (v2 grade) */}
        <div>
          <GroupLabel>{t('Минимальная надёжность', 'Minimum confidence')}{confidenceThreshold != null ? ` · ${t('порог движка', 'engine threshold')} ${confidenceThreshold}` : ''}</GroupLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="range" min={0} max={100} step={5} value={minConfidence || 0}
              onChange={(e) => onMinConfidence(+e.target.value)}
              style={{ flex: 1, accentColor: 'var(--cf-good)', height: 3, cursor: 'pointer' }}
            />
            <span style={{
              fontSize: 11, fontFamily: MONO, fontWeight: 700,
              color: minConfidence > 0 ? 'var(--cf-good)' : 'var(--cf-text7)', minWidth: 52, textAlign: 'right',
            }}>
              {minConfidence > 0 ? `≥ ${minConfidence}` : t('все', 'all')}
            </span>
          </div>
        </div>

        {/* Min amount */}
        <div>
          <GroupLabel>{t('Минимальный размер потока', 'Minimum flow size')}</GroupLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="range" min={0} max={100} value={amountToSlider(minAmount, maxAmount)}
              onChange={(e) => onMinAmount(sliderToAmount(+e.target.value, maxAmount))}
              style={{ flex: 1, accentColor: 'var(--cf-accent)', height: 3, cursor: 'pointer' }}
            />
            <span style={{
              fontSize: 11, fontFamily: MONO, fontWeight: 700,
              color: minAmount > 0 ? 'var(--cf-accent)' : 'var(--cf-text7)',
              minWidth: 52, textAlign: 'right',
            }}>
              {minAmount > 0 ? `≥ ${fmtUSD(minAmount)}` : t('все', 'all')}
            </span>
          </div>
        </div>

        <div style={{ fontSize: 9, color: 'var(--cf-text6)', fontFamily: MONO, lineHeight: 1.6, borderTop: '1px solid var(--cf-border-soft)', paddingTop: 10 }}>
          {t('Сектор, класс и уровень выбирают', 'Sector, class and tier select')}{' '}
          <span style={{ color: 'var(--cf-text3)' }}>{t('объекты', 'entities')}</span>
          {t(' — их контрагенты остаются видны, чтобы можно было проследить деньги.',
             ' — their counterparties stay visible so the money can still be traced.')}
          {t('Событие, статус, свежесть, надёжность и минимальная сумма выбирают', 'Event, status, recency, confidence and minimum size select')}{' '}
          <span style={{ color: 'var(--cf-text3)' }}>{t('потоки', 'flows')}</span>.
          {t('Потоки без раскрытой суммы выпадают, как только задан минимум.', 'Flows with no disclosed amount drop out the moment a minimum is set.')}
        </div>
      </div>
    </div>
  );
}

function GroupLabel({ children }) {
  return (
    <div style={{
      fontSize: 8.5, color: 'var(--cf-text6)', fontFamily: MONO, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: 7,
    }}>{children}</div>
  );
}

function ChipWrap({ children }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>;
}

function Chip({ children, on, color, title, square, onClick }) {
  return (
    <button onClick={onClick} title={title || ''}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 9px',
        background: on ? hexA(color, 0.13) : 'var(--cf-surface2)',
        border: `1px solid ${on ? hexA(color, 0.55) : 'var(--cf-border)'}`,
        borderRadius: 20,
        color: on ? color : 'var(--cf-text4)',
        fontSize: 10, fontFamily: MONO, fontWeight: 600,
        cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'all 130ms',
      }}
      onMouseEnter={(e) => { if (!on) { e.currentTarget.style.borderColor = 'var(--cf-text9)'; e.currentTarget.style.color = 'var(--cf-text2)'; } }}
      onMouseLeave={(e) => { if (!on) { e.currentTarget.style.borderColor = 'var(--cf-border)'; e.currentTarget.style.color = 'var(--cf-text4)'; } }}>
      <span style={{
        width: 6, height: 6, flexShrink: 0,
        borderRadius: square ? 2 : '50%',
        background: color, opacity: on ? 1 : 0.5,
      }} />
      {children}
    </button>
  );
}

// Log-ish slider mapping so the low end (millions) stays reachable.
function sliderToAmount(v, max) {
  if (v <= 0) return 0;
  const min = 1e6;
  return Math.round(min * Math.pow(max / min, v / 100));
}
function amountToSlider(amount, max) {
  if (!amount || amount <= 0) return 0;
  const min = 1e6;
  return Math.round(100 * Math.log(amount / min) / Math.log(max / min));
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
