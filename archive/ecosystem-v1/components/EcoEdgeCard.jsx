// ══════════════════════════════════════════════════════════════════════════
// EcoEdgeCard — one dependency, opened up. Floats bottom-centre over the
// canvas, exactly like capitalflow/FlowDetailCard, so a click on a bond on
// either map lands you in the same place with the same shape of answer.
//
// The flow map's card leads with MONEY, because a flow is money. A bond here
// is a standing dependency, and this contract carries no dollar volume at all
// — inventing one would be worse than not having it. So the card leads with
// the two facts the payload does carry, in the same slots:
//
//   what physically moves   ← the tech node (EUV · CoWoS · HBM3E · CUDA)
//   how much it matters     ← strength 0-100, the map's own "how much"
//
// Then: the written comment, the provenance chips, and every source quote
// behind one disclosure, so the default state stays scannable.
//
// `rightInset` = px of canvas covered by the entity panel; the card centres
// itself in the REMAINING space so the two never overlap.
// ══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { X, ChevronDown, ChevronRight, ExternalLink, Quote } from 'lucide-react';

const MONO = 'ui-monospace, monospace';

// Plain Russian for a 0-100 strength. Same idea as criticalityBand, different
// question: that one grades a COMPANY, this one grades one dependency.
function strengthBand(s) {
  if (s == null) return { label: 'не оценена', color: 'var(--cf-text5)' };
  if (s >= 85) return { label: 'критическая', color: '#E5484D' };
  if (s >= 65) return { label: 'высокая', color: '#E0A340' };
  if (s >= 40) return { label: 'заметная', color: '#58ABCB' };
  return { label: 'слабая', color: '#49C2AE' };
}

export default function EcoEdgeCard({ edge, source, target, onClose, onOpenEntity, rightInset = 0 }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  if (!edge) return null;

  const sb = strengthBand(edge.strength);
  const ev = edge.evidence || [];
  const verb = edge.typeMeta?.verb || edge.typeLabel;

  return (
    <div style={{
      position: 'absolute', left: `calc(50% - ${rightInset / 2}px)`, bottom: 16,
      transform: 'translateX(-50%)',
      zIndex: 24, width: `min(620px, calc(100% - ${rightInset + 60}px))`, minWidth: 320,
      boxSizing: 'border-box',
      background: 'var(--cf-panel)',
      border: `1px solid ${edge.color}44`,
      borderRadius: 12,
      backdropFilter: 'blur(10px)',
      boxShadow: `0 24px 60px -18px var(--cf-shadow), 0 0 0 1px ${edge.color}18`,
      animation: 'cfmRise 200ms cubic-bezier(0.2,0.8,0.2,1)',
      transition: 'left 220ms cubic-bezier(0.2,0.8,0.2,1), width 220ms cubic-bezier(0.2,0.8,0.2,1)',
    }}>
      {/* ── Кто кому, и что именно движется ───────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 14px 11px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <Party node={source} onOpenEntity={onOpenEntity} />
            <span style={{
              fontSize: 9, fontFamily: MONO, fontWeight: 700, color: edge.color,
              textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
            }}>
              —{verb}→
            </span>
            <Party node={target} onOpenEntity={onOpenEntity} />
          </div>

          {/* Что физически идёт по связи. Это и есть ответ на «что это»:
              не сумма, а предмет — EUV, CoWoS, HBM3E, CUDA. */}
          {edge.techMeta ? (
            <div style={{ marginTop: 7, display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap' }}>
              <span style={{
                padding: '2px 7px', borderRadius: 5, background: edge.color + '1a',
                border: `1px solid ${edge.color}44`, color: edge.color,
                fontSize: 9.5, fontFamily: MONO, fontWeight: 700, whiteSpace: 'nowrap',
              }}>{edge.techMeta.label}</span>
              <span style={{ fontSize: 11.5, color: 'var(--cf-text3)' }}>{edge.techMeta.note}</span>
            </div>
          ) : (
            <div style={{ marginTop: 7, fontSize: 11.5, color: 'var(--cf-text5)' }}>
              {edge.typeMeta?.blurb}
            </div>
          )}
        </div>

        <button onClick={onClose} title="Закрыть (Esc)"
          style={{ background: 'none', border: 'none', color: 'var(--cf-text7)', cursor: 'pointer', padding: 3, lineHeight: 0, flexShrink: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cf-text2)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--cf-text7)')}>
          <X size={15} />
        </button>
      </div>

      {/* ── Насколько связь существенна — «объём» этой карты ──────────── */}
      <div style={{ padding: '0 14px 11px', display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO, color: sb.color, lineHeight: 1 }}>
          {edge.strength}
        </span>
        <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cf-text7)' }}>/100</span>
        <span style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--cf-surface2)', overflow: 'hidden' }}>
          <span style={{
            display: 'block', height: '100%', borderRadius: 2, background: sb.color,
            width: `${Math.max(0, Math.min(100, edge.strength || 0))}%`,
          }} />
        </span>
        <span style={{ fontSize: 10.5, color: 'var(--cf-text4)', whiteSpace: 'nowrap' }}>
          существенность {sb.label}
        </span>
      </div>

      {/* ── Комментарий: одна строка о том, что это за отношения ──────── */}
      {edge.note && (
        <div style={{
          padding: '0 14px 11px', fontSize: 12.5, color: 'var(--cf-text2)', lineHeight: 1.5,
        }}>
          {edge.note}
        </div>
      )}

      {/* ── Происхождение факта ───────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center',
        padding: '0 14px 12px',
      }}>
        <Chip color={edge.spineMeta?.color} title={edge.spineMeta?.blurb}>{edge.spineMeta?.label}</Chip>
        <Chip color={edge.tierMeta?.color} title={edge.tierMeta?.label}>{edge.tierMeta?.short || edge.tier}</Chip>
        <Chip title="Правило двух источников: сплошная линия на карте только при двух и более независимых подтверждениях">
          {edge.confirmedSources >= 2 ? '2+ источника' : 'один источник'}
        </Chip>
        {edge.started && <Chip title="Год начала отношений">с {edge.started}</Chip>}
        {edge.lastConfirmed && <Chip title="Когда связь подтверждалась в последний раз">подтв. {edge.lastConfirmed}</Chip>}
        {edge.engineConfirmed && (
          <Chip color="#34D399" title="Та же связь доказана недельным конвейером карты потоков">подтв. движком</Chip>
        )}
        {edge.status !== 'active' && <Chip dashed>{edge.statusMeta?.label}</Chip>}
      </div>

      {/* ── Цитаты — за одной кнопкой, чтобы карточка оставалась лёгкой ─ */}
      {ev.length > 0 && (
        <div style={{ borderTop: '1px solid var(--cf-border-hair)' }}>
          <button onClick={() => setSourcesOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, width: '100%',
              padding: '9px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--cf-text5)', fontSize: 9, fontFamily: MONO, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'left',
            }}>
            {sourcesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Источники и цитаты
            <span style={{ color: 'var(--cf-text8)' }}>· {ev.length}</span>
          </button>

          {sourcesOpen && (
            <div style={{ padding: '0 14px 13px' }}>
              {ev.map((q, i) => (
                <div key={i} style={{ borderLeft: `2px solid ${edge.color}66`, paddingLeft: 9, marginBottom: 9 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <Quote size={10} style={{ color: 'var(--cf-text7)', flexShrink: 0, marginTop: 3 }} />
                    <div style={{ fontSize: 11.5, color: 'var(--cf-text2)', lineHeight: 1.5 }}>{q.quote}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 5, flexWrap: 'wrap' }}>
                    {q.url && (
                      <a href={q.url} target="_blank" rel="noopener noreferrer" title={q.url}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 9.5, fontFamily: MONO, color: 'var(--cf-accent)', textDecoration: 'none',
                        }}>
                        {hostOf(q.url)} <ExternalLink size={9} />
                      </a>
                    )}
                    {q.published && (
                      <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--cf-text7)' }}>{q.published}</span>
                    )}
                    {q.alive === false && (
                      <span style={{ fontSize: 9, fontFamily: MONO, color: '#E5484D' }}>ссылка не отвечает</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** One end of the bond — clickable, so the card is also a way to walk. */
function Party({ node, onOpenEntity }) {
  if (!node) return null;
  return (
    <button onClick={() => onOpenEntity?.(node.id)} title={node.oneLiner || node.name}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        color: 'var(--cf-text0)', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
      }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: node.color, flexShrink: 0 }} />
      {node.name}
      <span style={{ fontSize: 8.5, fontFamily: MONO, fontWeight: 700, color: 'var(--cf-text7)' }}>
        {node.primaryLayer}
      </span>
    </button>
  );
}

function Chip({ children, color, title, dashed }) {
  return (
    <span title={title} style={{
      display: 'inline-block', padding: '3px 7px',
      background: color ? color + '14' : 'var(--cf-surface2)',
      border: `1px ${dashed ? 'dashed' : 'solid'} ${color ? color + '44' : 'var(--cf-border)'}`,
      borderRadius: 5,
      fontSize: 8.5, color: color || 'var(--cf-text3)', fontFamily: MONO, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      cursor: title ? 'help' : 'default', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'источник'; }
}
