// Sticky right-rail metadata card: founded, batch, team, status, location,
// primary partner, YC cheque + cap, social/link icons.
import React from 'react';
import { Globe, Linkedin, Twitter, Briefcase } from 'lucide-react';

const STATUS_LABELS = {
  Active:   'Активна',
  Inactive: 'Неактивна',
  Acquired: 'Куплена',
};

export default function YCMetadataCard({ company }) {
  const rows = [
    { label: 'Основана',      value: company.founded_year || '—' },
    { label: 'Батч',          value: company.batch || '—' },
    { label: 'Размер команды', value: company.team_size ?? '—' },
    { label: 'Статус',        value: STATUS_LABELS[company.status] || company.status || '—' },
    { label: 'Локация',       value: company.location || '—' },
    { label: 'Партнёр YC',    value: company.primary_partner || '—' },
  ];

  const ycInvest = company.yc_investment_usd
    ? `$${company.yc_investment_usd.toLocaleString('en-US')}`
    : null;
  const ycCap = company.yc_cap || null;

  const links = [
    { url: company.website,   icon: Globe,     label: 'Website' },
    { url: company.linkedin,  icon: Linkedin,  label: 'LinkedIn' },
    { url: company.twitter,   icon: Twitter,   label: 'X' },
    { url: company.crunchbase, icon: Briefcase, label: 'Crunchbase' },
  ].filter(l => l.url);

  return (
    <div style={{
      background: '#0d0d0e',
      border: '1px solid #18181b',
      borderRadius: 12,
      padding: '18px 20px',
    }}>
      <div style={{
        fontSize: 10.5, color: '#71717a',
        fontFamily: 'ui-monospace,monospace',
        letterSpacing: '0.14em', fontWeight: 700,
        marginBottom: 14,
        textTransform: 'uppercase',
      }}>
        Карточка
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {rows.map(r => (
          <Row key={r.label} label={r.label} value={r.value} />
        ))}
      </div>

      {(ycInvest || ycCap || company.yc_round_lead) && (
        <div style={{
          marginTop: 18, paddingTop: 16,
          borderTop: '1px solid #18181b',
        }}>
          <div style={{
            fontSize: 10.5, color: '#71717a',
            fontFamily: 'ui-monospace,monospace',
            letterSpacing: '0.14em', fontWeight: 700,
            marginBottom: 10,
            textTransform: 'uppercase',
          }}>
            YC чек
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {ycInvest && <Row label="Инвестиция" value={ycInvest} mono />}
            {ycCap && <Row label="Кэп" value={ycCap} mono />}
            {company.yc_round_lead && <Row label="Lead раунда" value={company.yc_round_lead} />}
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

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
      <span style={{
        fontSize: 11.5, color: '#71717a',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 12.5,
        color: '#e4e4e7',
        textAlign: 'right',
        fontFamily: mono ? 'ui-monospace,monospace' : 'inherit',
        fontWeight: mono ? 600 : 500,
      }}>
        {value}
      </span>
    </div>
  );
}
