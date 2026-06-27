// Single company card — bento-grid style with at-a-glance tracking info.
// Icon box top-left · status badge top-right · title + meta inline ·
// tagline · cap + founders + website micro-row · # tag chips + "Открыть →"
// CTA. Dot texture fades in on hover.
import React, { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  iconForSector,
  iconColorForSector,
  YC_STATUS_LABELS,
  HOVER_DOT_TEXTURE,
} from './yc-sector-colors.js';
import ycResearchData from '../../../data/yc-research.json';

// Lookup founders by company name so the listing card can show a compact
// founder line without plumbing through props.
const RESEARCH_BY_NAME = ycResearchData.reduce((acc, r) => {
  acc[r.company_name.trim().toLowerCase()] = r;
  return acc;
}, {});

// "Abhinav Soni" → "A. Soni". Compact byline for the card footer.
function shortFounder(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

export default function YCCompanyCard({ company, onClick }) {
  const [hover, setHover] = useState(false);
  const visibleSectors = (company.sectors || []).slice(0, 3);
  const statusLabel = YC_STATUS_LABELS[company.status] || company.status || 'Активна';

  // Pull just-enough research for the card footer.
  const research = RESEARCH_BY_NAME[company.name.trim().toLowerCase()];
  const founders = (research?.team?.founders || []).map(f => shortFounder(f.name)).filter(Boolean);
  const foundersLine = founders.slice(0, 2).join(' · ');
  const cap = company.yc_cap && company.yc_cap !== 'MFN' ? `cap ${company.yc_cap}` : company.yc_cap || null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: '#0a0a0c',
        border: `1px solid ${hover ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 14,
        padding: 16,
        cursor: 'pointer',
        textAlign: 'left',
        color: 'inherit', font: 'inherit',
        overflow: 'hidden',
        transition: 'border-color 300ms, transform 300ms, box-shadow 300ms',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 6px 18px rgba(0,0,0,0.45), 0 2px 12px rgba(255,255,255,0.03)'
          : '0 1px 0 rgba(255,255,255,0.02) inset',
      }}
    >
      {/* Hover dot texture — fades in only on hover, matches the reference's
          opacity-0 group-hover:opacity-100 pattern. */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          ...HOVER_DOT_TEXTURE,
          opacity: hover ? 1 : 0,
          transition: 'opacity 300ms',
          pointerEvents: 'none',
        }}
      />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', gap: 12,
        minHeight: 152,
      }}>
        {/* Top row — logo box + status pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <Logo
            name={company.name}
            url={company.logo}
            domain={domainFromUrl(company.website)}
            size={36}
          />
          <span style={{
            fontSize: 10.5, fontWeight: 500,
            padding: '4px 10px', borderRadius: 6,
            background: 'rgba(255,255,255,0.06)',
            color: '#d4d4d8',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            transition: 'background 200ms',
          }}>
            {statusLabel}
          </span>
        </div>

        {/* Title + batch meta inline */}
        <div>
          <span style={{
            fontSize: 15, fontWeight: 600, color: '#fafafa',
            letterSpacing: '-0.01em',
          }}>
            {company.name}
          </span>
          {company.batch && (
            <span style={{
              marginLeft: 8, fontSize: 11.5, color: '#71717a', fontWeight: 400,
            }}>
              {company.batch}
            </span>
          )}
        </div>

        {/* Tagline */}
        <p style={{
          margin: 0, fontSize: 12.5, color: '#a1a1aa', lineHeight: 1.5,
          fontWeight: 425,
          display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {company.tagline}
        </p>

        {/* Micro-row — founders · cap · website link. Renders only when any
            of the three has a value, so cards without research stay clean. */}
        {(foundersLine || cap || company.website) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            fontSize: 11, color: '#71717a',
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.02em',
          }}>
            {foundersLine && (
              <span style={{ color: '#a1a1aa' }}>{foundersLine}</span>
            )}
            {cap && (
              <>
                {foundersLine && <span style={{ color: '#3f3f46' }}>·</span>}
                <span>{cap}</span>
              </>
            )}
            {company.website && (
              <>
                {(foundersLine || cap) && <span style={{ color: '#3f3f46' }}>·</span>}
                <a
                  href={company.website} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  title={company.website}
                  style={{
                    color: '#71717a', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    transition: 'color 160ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
                >
                  сайт <ExternalLink size={10} />
                </a>
              </>
            )}
          </div>
        )}

        {/* Bottom row — # tag chips with small coloured sector icon + CTA */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 'auto', paddingTop: 4, gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
            {visibleSectors.map(s => {
              const Icon = iconForSector(s);
              const iconColor = iconColorForSector(s);
              return (
                <span key={s} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 10.5, color: '#a1a1aa',
                  padding: '3px 8px 3px 7px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.05)',
                  fontFamily: 'ui-monospace,monospace',
                  whiteSpace: 'nowrap',
                  transition: 'background 200ms',
                }}>
                  {Icon && <Icon size={11} style={{ color: iconColor, flexShrink: 0 }} />}
                  #{s}
                </span>
              );
            })}
          </div>
          <span style={{
            fontSize: 11, color: '#71717a',
            whiteSpace: 'nowrap', flexShrink: 0,
            opacity: hover ? 1 : 0,
            transition: 'opacity 200ms',
          }}>
            Открыть →
          </span>
        </div>
      </div>
    </button>
  );
}

// Strip protocol + "www." from a URL → bare domain. Returns null on failure.
export function domainFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

// Logo — explicit `url` first, then Google s2 favicons for `domain`, then a
// letter-circle fallback. Image gets a soft white card under it so logos
// with transparent backgrounds read on dark.
export function Logo({ name, url, domain, size = 60, square = true }) {
  const [idx, setIdx] = useState(0);

  const sources = useMemo(() => {
    const arr = [];
    if (url) arr.push(url);
    if (domain) arr.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    return arr;
  }, [url, domain]);

  if (idx < sources.length) {
    return (
      <img
        src={sources[idx]}
        alt={name}
        onError={() => setIdx(idx + 1)}
        style={{
          width: size, height: size,
          borderRadius: square ? 8 : '50%',
          objectFit: 'contain',
          background: '#fafafa',
          flexShrink: 0,
          padding: Math.max(3, size * 0.08),
        }}
      />
    );
  }

  const letter = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size,
      borderRadius: square ? 8 : '50%',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      color: '#d4d4d8', fontWeight: 700,
      fontSize: Math.round(size * 0.4),
      fontFamily: 'ui-monospace,monospace',
    }}>
      {letter}
    </div>
  );
}
