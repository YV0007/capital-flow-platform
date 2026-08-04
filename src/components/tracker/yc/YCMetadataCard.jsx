// Sticky right-rail metadata card for the YC detail page.
// Mirrors the Y Combinator company info card (Founded / Batch / Team Size /
// Status / Location / Primary Partner) and adds a compact investment
// summary sourced from yc-investment.json. Every row hides itself when its
// value is empty so the card always reads as filled, never a column of "—".
import React from 'react';
import { Globe, Linkedin, Twitter, Briefcase } from 'lucide-react';
import investmentData from '../../../data/yc-investment.json';

const STATUS_LABELS = {
  Active:   'Работает',
  Inactive: 'Закрылась',
  Acquired: 'Куплена',
};

const isBlank = (v) =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

export default function YCMetadataCard({ company, research }) {
  const team    = research?.team;
  const market  = research?.market;
  const invest  = investmentData.companies?.[company.id] || null;

  const headcount = team?.headcount_current ?? company.team_size;
  const sector    = market?.sector_ru || market?.sub_sector || market?.sector;

  // YC-style info rows.
  const rows = [
    { label: 'Основана',   value: company.founded_year ? String(company.founded_year) : null },
    { label: 'Батч',       value: company.batch },
    { label: 'Команда',    value: headcount != null ? String(headcount) : null },
    { label: 'Статус',     value: STATUS_LABELS[company.status] || company.status,
      hint: company.status === 'Active' ? 'Компания работает — не закрылась и не куплена' : undefined },
    { label: 'Локация',    value: company.location },
    { label: 'Партнёр YC', value: company.primary_partner },
    { label: 'Сектор',     value: sector },
  ].filter(r => !isBlank(r.value));

  // Compact investment summary — the detail page has the full block, this is
  // the at-a-glance version.
  const external = invest?.external_investors || [];
  const hasExternal = invest?.tier === 'external' && external.length > 0;
  const capSet = !isBlank(invest?.cap) && invest?.cap !== 'не зафиксирована';
  const capDisplay = capSet ? invest.cap : 'не зафиксирована';

  const links = [
    { url: company.website,    icon: Globe,     label: 'Website' },
    { url: company.linkedin,   icon: Linkedin,  label: 'LinkedIn' },
    { url: company.twitter,    icon: Twitter,   label: 'X' },
    { url: company.crunchbase, icon: Briefcase, label: 'Crunchbase' },
  ].filter(l => !isBlank(l.url));

  if (rows.length === 0 && !invest && links.length === 0) return null;

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
          {rows.map(r => <Row key={r.label} label={r.label} value={r.value} hint={r.hint} />)}
        </div>
      )}

      {invest && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #18181b' }}>
          <SectionLabel small>Инвестиция</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Row label="Потолок оценки" hint="Максимум оценки в сделке (SAFE), не текущая стоимость компании." value={capDisplay} mono={capSet} accent={capSet ? '#34d399' : '#a1a1aa'} />
            <Row
              label="Инвесторы"
              value={hasExternal ? 'внешние + YC' : 'только YC'}
              accent={hasExternal ? '#34d399' : '#a1a1aa'}
            />
          </div>
          {hasExternal && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 11 }}>
              {external.map((inv, i) => (
                inv.website ? (
                  <a key={i} href={inv.website} target="_blank" rel="noopener noreferrer"
                    style={{
                      fontSize: 10.5, color: '#d4d4d8', textDecoration: 'none',
                      padding: '3px 8px', borderRadius: 4,
                      background: '#18181b', border: '1px solid #27272a',
                      fontFamily: 'ui-monospace,monospace', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#34d399'; e.currentTarget.style.color = '#fafafa'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = '#d4d4d8'; }}>
                    {inv.name}
                  </a>
                ) : (
                  <span key={i} style={{
                    fontSize: 10.5, color: '#d4d4d8',
                    padding: '3px 8px', borderRadius: 4,
                    background: '#18181b', border: '1px solid #27272a',
                    fontFamily: 'ui-monospace,monospace', whiteSpace: 'nowrap',
                  }}>{inv.name}</span>
                )
              ))}
            </div>
          )}
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

function Row({ label, value, mono, accent = '#e4e4e7', hint }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
      <span
        title={hint || undefined}
        style={{ fontSize: 11.5, color: '#71717a', whiteSpace: 'nowrap', cursor: hint ? 'help' : 'default',
          borderBottom: hint ? '1px dotted #3f3f46' : 'none' }}>{label}</span>
      <span style={{
        fontSize: 12.5, color: accent,
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
