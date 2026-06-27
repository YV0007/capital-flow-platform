// Sticky right-rail metadata card for the YC detail page.
// Pulls a richer picture from the research bundle when available (headcount,
// round stage, lead investor, sector) instead of only showing the basic
// company record. Every row hides itself when its value is empty so the
// card always reads as filled and informative instead of a column of "—".
import React from 'react';
import { Globe, Linkedin, Twitter, Briefcase } from 'lucide-react';

const STATUS_LABELS = {
  Active:   'Активна',
  Inactive: 'Неактивна',
  Acquired: 'Куплена',
};

const isBlank = (v) =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

const fmtUsd = (n) =>
  n === null || n === undefined ? null : `$${Number(n).toLocaleString('en-US')}`;

const fmtUsdCompact = (n) => {
  if (n === null || n === undefined) return null;
  const num = Number(n);
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(num >= 10_000_000_000 ? 0 : 1)}B`;
  if (num >= 1_000_000)     return `$${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1)}M`;
  if (num >= 1_000)         return `$${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1)}K`;
  return fmtUsd(n);
};

const headcountDelta = (now, before) => {
  if (now == null || before == null) return null;
  const d = now - before;
  return `${d >= 0 ? '+' : ''}${d} за 6 мес`;
};

export default function YCMetadataCard({ company, research }) {
  // Compose the rows from BOTH the basic company JSON and the richer
  // research bundle, dropping any whose value is blank.
  const team        = research?.team;
  const funding     = research?.funding;
  const market      = research?.market;

  const headcount   = team?.headcount_current;
  const hcDelta     = headcountDelta(headcount, team?.headcount_6mo_ago);
  const lead        = funding?.last_round_lead_investor || company.yc_round_lead;
  const stage       = funding?.last_round_stage;
  const sector      = market?.sub_sector || market?.sector;

  const rows = [
    { label: 'Сектор',       value: sector },
    { label: 'Раунд',        value: stage },
    { label: 'Lead',         value: lead },
    { label: 'Команда',      value: headcount != null
                                ? (hcDelta ? `${headcount} · ${hcDelta}` : String(headcount))
                                : null },
    { label: 'Основана',     value: company.founded_year ? String(company.founded_year) : null },
    { label: 'Батч',         value: company.batch },
    { label: 'Статус',       value: STATUS_LABELS[company.status] || company.status },
    { label: 'Локация',      value: company.location },
    { label: 'Партнёр YC',   value: company.primary_partner },
  ].filter(r => !isBlank(r.value));

  // Investment block — only what we have.
  const investmentRows = [
    { label: 'YC чек',       value: fmtUsd(company.yc_investment_usd), mono: true },
    { label: 'Cap',          value: company.yc_cap, mono: true },
    { label: 'Total raised', value: fmtUsd(funding?.total_raised_usd), mono: true },
    { label: 'Post-money',   value: fmtUsdCompact(funding?.last_round_post_money_valuation_usd), mono: true },
  ].filter(r => !isBlank(r.value));

  // Investor chips (excluding the lead since it's already on its own row).
  const investors = (funding?.all_investors || []).filter(
    inv => !lead || inv.trim().toLowerCase() !== String(lead).trim().toLowerCase()
  );

  const links = [
    { url: company.website,    icon: Globe,     label: 'Website' },
    { url: company.linkedin,   icon: Linkedin,  label: 'LinkedIn' },
    { url: company.twitter,    icon: Twitter,   label: 'X' },
    { url: company.crunchbase, icon: Briefcase, label: 'Crunchbase' },
  ].filter(l => !isBlank(l.url));

  // If the card would be completely empty, render nothing — better than
  // a blank box on the page.
  if (rows.length === 0 && investmentRows.length === 0 && links.length === 0 && investors.length === 0) {
    return null;
  }

  return (
    <div style={{
      background: '#0d0d0e',
      border: '1px solid #18181b',
      borderRadius: 12,
      padding: '18px 20px',
    }}>
      <SectionLabel>Карточка</SectionLabel>

      {rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {rows.map(r => <Row key={r.label} label={r.label} value={r.value} />)}
        </div>
      )}

      {investmentRows.length > 0 && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #18181b' }}>
          <SectionLabel small>Инвестиция</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {investmentRows.map(r => (
              <Row key={r.label} label={r.label} value={r.value} mono={r.mono} />
            ))}
          </div>
        </div>
      )}

      {investors.length > 0 && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #18181b' }}>
          <SectionLabel small>Со-инвесторы</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {investors.map((inv, i) => (
              <span key={i} style={{
                fontSize: 10.5, color: '#d4d4d8',
                padding: '3px 8px', borderRadius: 4,
                background: '#18181b', border: '1px solid #27272a',
                fontFamily: 'ui-monospace,monospace',
                whiteSpace: 'nowrap',
              }}>
                {inv}
              </span>
            ))}
          </div>
        </div>
      )}

      {links.length > 0 && (
        <div style={{
          marginTop: 18, paddingTop: 16,
          borderTop: '1px solid #18181b',
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          {links.map(l => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              title={l.label}
              style={{
                width: 32, height: 32, borderRadius: 6,
                background: '#18181b', border: '1px solid #27272a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#a1a1aa', cursor: 'pointer',
                transition: 'all 140ms',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#52525b';
                e.currentTarget.style.color = '#fafafa';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#27272a';
                e.currentTarget.style.color = '#a1a1aa';
              }}
            >
              <l.icon size={15} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children, small }) {
  return (
    <div style={{
      fontSize: small ? 9.5 : 10.5, color: '#71717a',
      fontFamily: 'ui-monospace,monospace',
      letterSpacing: '0.14em', fontWeight: 700,
      marginBottom: small ? 10 : 14,
      textTransform: 'uppercase',
    }}>
      {children}
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
      <span style={{ fontSize: 11.5, color: '#71717a', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{
        fontSize: 12.5, color: '#e4e4e7',
        textAlign: 'right',
        fontFamily: mono ? 'ui-monospace,monospace' : 'inherit',
        fontWeight: mono ? 600 : 500,
        wordBreak: 'break-word', minWidth: 0,
      }}>
        {value}
      </span>
    </div>
  );
}
