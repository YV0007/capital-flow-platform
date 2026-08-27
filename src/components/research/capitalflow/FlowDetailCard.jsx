// Inline breakdown of a single flow (edge click). Floats over the canvas
// bottom-centre so the graph stays visible and interactive behind it.
//
// The map is already a dense object — this card must not add to the load. It
// answers four questions in one glance and stops:
//   how much · between whom · when · how much do we trust it
// Everything that is commentary rather than fact (our written read) sits
// behind one disclosure button, so the default state stays scannable.
//
// `rightInset` = px of canvas covered by the entity panel; the card centres
// itself in the REMAINING space so the two never overlap.

import { useState } from 'react';
import { X, ArrowRight, ChevronDown, ChevronRight, ExternalLink, Quote } from 'lucide-react';
import { fmtUSD, humanizeSourceUrl } from './format.js';
import {
  EVENT_TYPE_META, STATUS_META, SOURCE_TIER_LABEL, SECTOR_META,
  GRADE_LETTER, GRADE_DIGIT, confidenceBand, composeRead, META,
} from '../../../data/capitalMap.js';
import { useT, getLang } from '../../../lib/i18n.jsx';

const MONO = 'ui-monospace, monospace';

// Age of the deal measured against the PAYLOAD date, not wall clock — the file
// is a snapshot, so "13d" has to mean 13 days of data.
function ageDays(date, generated) {
  if (!date || !generated) return null;
  const a = new Date(`${date}T00:00:00Z`), b = new Date(`${generated}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  const d = Math.round((b - a) / 86400000);
  return d >= 0 ? d : null;
}

export default function FlowDetailCard({ flow, sourceNode, targetNode, onClose, onOpenEntity, rightInset = 0 }) {
  const t = useT();
  const [readOpen, setReadOpen] = useState(false);
  if (!flow) return null;

  const et = EVENT_TYPE_META[flow.event_type] || { label: flow.event_type };
  const stat = STATUS_META[flow.status] || { label: flow.status, color: 'var(--cf-text5)' };
  const sec = flow.sector ? SECTOR_META[flow.sector] : null;
  const src = sourceNode?.name || flow.sourceId?.replace(/^alloc:/, '');
  const tgt = targetNode?.name || flow.targetId?.replace(/^target:/, '');
  const band = confidenceBand(flow.confidence);
  const note = flow.note;
  const age = ageDays(flow.date, META.generated);

  // Source link from the engine. Every verified flow now ships `source_url`
  // (the payload's canonical field); a `sources[]` array is honoured too for
  // forward-compat. We never synthesise one — an unsourced flow says so.
  const links = Array.isArray(flow.sources) ? flow.sources.filter(s => s && s.url).map(s => ({ ...s, url: humanizeSourceUrl(s.url) }))
    : flow.source_url ? [{ url: humanizeSourceUrl(flow.source_url), label: hostLabel(humanizeSourceUrl(flow.source_url)) }]
    : flow.url ? [{ url: humanizeSourceUrl(flow.url), label: t('Источник', 'Source') }] : [];

  // The grade decoded into plain English, joined with the status — one line
  // that carries what used to be two boxes.
  const gradeBits = [];
  if (flow.grade && flow.grade.length >= 2) {
    if (GRADE_LETTER[flow.grade[0]]) gradeBits.push(GRADE_LETTER[flow.grade[0]]);
    if (GRADE_DIGIT[flow.grade[1]]) gradeBits.push(GRADE_DIGIT[flow.grade[1]]);
  }

  return (
    <div style={{
      position: 'absolute', left: `calc(50% - ${rightInset / 2}px)`, bottom: 16,
      transform: 'translateX(-50%)',
      zIndex: 20, width: `min(600px, calc(100% - ${rightInset + 60}px))`, minWidth: 320,
      background: 'var(--cf-panel)',
      border: `1px solid ${flow.color}44`,
      borderRadius: 12,
      backdropFilter: 'blur(10px)',
      boxShadow: `0 24px 60px -18px var(--cf-shadow), 0 0 0 1px ${flow.color}18`,
      animation: 'cfmRise 200ms cubic-bezier(0.2,0.8,0.2,1)',
      transition: 'left 220ms cubic-bezier(0.2,0.8,0.2,1), width 220ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* ── How much, between whom ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px 12px',
      }}>
        <div style={{
          fontSize: 22, fontWeight: 700, color: flow.disclosed ? 'var(--cf-text0)' : 'var(--cf-text5)',
          letterSpacing: '-0.02em', fontFamily: MONO, flexShrink: 0, lineHeight: 1,
        }}>
          {flow.disclosed ? fmtUSD(flow.amount) : t('Не раскрыто', 'Undisclosed')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
          <EntityChip node={sourceNode} fallback={src} onClick={onOpenEntity} />
          <ArrowRight size={13} color={flow.color} style={{ flexShrink: 0 }} />
          <EntityChip node={targetNode} fallback={tgt} onClick={onOpenEntity} />
        </div>

        <button onClick={onClose} title={t('Закрыть', 'Close')}
          style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 3, lineHeight: 0, flexShrink: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
          <X size={15} />
        </button>
      </div>

      {/* ── What kind of deal, where, when ─────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center',
        padding: '0 14px 12px',
      }}>
        <Tag color={flow.color}>{et.label}</Tag>
        {sec && <Tag color={sec.color}>{sec.label}</Tag>}
        <Tag color="#8b95a8"
          title={age != null ? t(`За ${age} дн до даты выгрузки (${META.generated})`, `${age} days before the delivery date (${META.generated})`) : undefined}>
          {flow.date}{age != null ? ` · ${age}${t(' дн', 'd')}` : ''}
        </Tag>
      </div>

      {/* ── How much we trust it ───────────────────────────────────────── */}
      <div style={{ padding: '11px 14px 12px', borderTop: '1px solid var(--cf-border-soft)' }}>
        {flow.confidence != null ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 8.5, color: 'var(--cf-text7)', fontFamily: MONO, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0,
              }}>
                {t('Надёжность', 'Confidence')}
              </span>
              <span style={{ flex: 1, height: 4, borderRadius: 3, background: 'var(--cf-border-soft)', overflow: 'hidden', minWidth: 40 }}>
                <span style={{ display: 'block', height: '100%', width: `${flow.confidence}%`, background: band.color, borderRadius: 3 }} />
              </span>
              <span title={band.label} style={{ fontSize: 13, fontWeight: 700, color: band.color, fontFamily: MONO, flexShrink: 0, cursor: 'help' }}>
                {flow.confidence}<span style={{ color: 'var(--cf-text7)', fontSize: 10 }}>/100</span>
              </span>
            </div>

            {/* Grade + status decoded, one line — no bare codes anywhere. */}
            <div style={{ marginTop: 7, fontSize: 11, color: 'var(--cf-text4)', fontFamily: MONO, lineHeight: 1.6 }}>
              {gradeBits.map((t, i) => (
                <span key={i}>
                  {i > 0 && <span style={{ color: 'var(--cf-text9)' }}> · </span>}
                  {t}
                </span>
              ))}
              {gradeBits.length > 0 && <span style={{ color: 'var(--cf-text9)' }}> · </span>}
              <span title={stat.blurb} style={{ color: stat.color, cursor: 'help' }}>{stat.label}</span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--cf-text6)', fontFamily: MONO, fontStyle: 'italic' }}>
            {t('Движок не оценил надёжность — считайте вес нулевым.', 'The engine did not score confidence — treat the weight as zero.')}
          </div>
        )}

        {/* Where it came from + the link, when the payload carries one. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
          <span style={{ fontSize: 10.5, color: 'var(--cf-text5)', fontFamily: MONO }}>
            {SOURCE_TIER_LABEL[flow.sourceTier] || t(`Уровень источника ${flow.sourceTier}`, `Source tier ${flow.sourceTier}`)}
          </span>
          <span style={{ flex: 1 }} />
          {links.length > 0
            ? links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" title={l.url}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 9px', background: 'var(--cf-surface2)',
                    border: '1px solid var(--cf-border)', borderRadius: 6,
                    color: 'var(--cf-link)', fontSize: 10, fontFamily: MONO, fontWeight: 600,
                    textDecoration: 'none', flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--cf-link-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border)')}>
                  {l.label || t('Источник', 'Source')} <ExternalLink size={9} style={{ opacity: 0.6 }} />
                </a>
              ))
            : (
              <span title={t('Движок оценивает источники каждого потока, но пока не присылает ссылки. Показано как пропуск, а не угадано.', 'The engine scores each flow\'s sources but does not ship links yet. Shown as a gap rather than guessed.')}
                style={{ fontSize: 10, color: 'var(--cf-text8)', fontFamily: MONO, cursor: 'help' }}>
                {t('в данных нет ссылки на источник', 'no source link in the data')}
              </span>
            )}
        </div>
      </div>

      {/* ── Our read — commentary, so it stays folded by default ───────── */}
      <div style={{ borderTop: '1px solid var(--cf-border-soft)' }}>
        <button onClick={() => setReadOpen(o => !o)}
          title={readOpen ? t('Скрыть комментарий', 'Hide the commentary') : t('Наш разбор — почему двинулся этот капитал', 'Our read — why this capital moved')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, width: '100%',
            padding: '9px 14px', background: 'transparent', border: 'none',
            cursor: 'pointer', textAlign: 'left',
            color: readOpen ? 'var(--cf-text2)' : 'var(--cf-text4)',
            fontSize: 10, fontFamily: MONO, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            borderRadius: '0 0 12px 12px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = readOpen ? 'var(--cf-text2)' : 'var(--cf-text4)')}>
          {readOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {t('Комментарий', 'Commentary')}
          {note?.angle && !readOpen && (
            <span style={{
              color: flow.color, fontWeight: 600, textTransform: 'none', letterSpacing: 0,
              minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              · {note.angle}
            </span>
          )}
        </button>

        {readOpen && (
          <div style={{ padding: '0 14px 13px' }}>
            {note?.angle && (
              <div style={{
                fontSize: 10.5, color: flow.color, fontFamily: MONO, fontWeight: 700, marginBottom: 7,
              }}>
                {note.angle}
              </div>
            )}
            <div style={{
              position: 'relative', padding: '11px 13px 11px 15px',
              background: 'var(--cf-surface1)', borderRadius: 9, border: '1px solid var(--cf-border-soft)', overflow: 'hidden',
            }}>
              <span style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
                background: `linear-gradient(180deg, ${flow.color}, ${flow.color}22)`,
              }} />
              <div style={{ fontSize: 12.5, color: note ? '#d7d7dd' : 'var(--cf-text4)', lineHeight: 1.68 }}>
                {note ? note.read : composeRead(flow, sourceNode, targetNode)}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5, marginTop: 9,
                fontSize: 8.5, color: 'var(--cf-text8)', fontFamily: MONO, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                <Quote size={9} /> {t('Наша трактовка · не данные движка и не цитата', 'Our reading · not engine data, not a quote')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Bare host as the link label ("aligneddc.com") — the publication/domain reads
// better than a generic "Источник" and hints at the source's tier at a glance.
// A plain helper, not a component — reads the module mirror instead of a hook.
function hostLabel(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return getLang() === 'en' ? 'Source' : 'Источник'; }
}

function EntityChip({ node, fallback, onClick }) {
  const t = useT();
  const name = node?.name || fallback;
  if (!name) return null;
  const color = node?.color || 'var(--cf-text5)';
  return (
    <button onClick={() => node && onClick(node.id)} title={node ? t(`Открыть ${node.name}`, `Open ${node.name}`) : ''}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 9px', background: 'var(--cf-surface2)',
        border: '1px solid var(--cf-border)', borderRadius: 7,
        cursor: node ? 'pointer' : 'default', minWidth: 0, maxWidth: 190,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color + '80')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--cf-border)')}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{
        fontSize: 11.5, color: 'var(--cf-text1)', fontWeight: 600,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{name}</span>
    </button>
  );
}

function Tag({ children, color, title }) {
  return (
    <span title={title} style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 8px', borderRadius: 5,
      background: color + '14', border: `1px solid ${color}33`,
      color, fontSize: 9.5, fontFamily: MONO, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.07em',
      cursor: title ? 'help' : 'default',
    }}>{children}</span>
  );
}
