import React, { useState } from 'react';
import {
  Target,
  Layers,
  CheckCircle2,
  Users,
  Shield,
  DollarSign,
  Activity,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ReferenceDot,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
} from 'recharts';
import { fmtUSD } from '../../lib/utils.js';
import CompanyLogo from './position/CompanyLogo.jsx';
import {
  POS_COLORS,
  Tip,
  FieldGrid,
  RightBadge,
  AccordionRow,
} from './position/helpers.jsx';

export default function PositionView({ cfg, company, memoBaseline }) {
  const isPosition = cfg.is_position !== false && cfg.gross_investment_usd > 0;
  const sub = cfg.subscription_form || {};

  const [openMap, setOpenMap] = useState({ pos: true });

  // Track which asks have been marked as "requested"
  const [requestedAsks, setRequestedAsks] = useState(() => {
    try {
      const v = localStorage.getItem(`pos_asks:${cfg.company_brand_name}`);
      return v ? new Set(JSON.parse(v)) : new Set();
    } catch { return new Set(); }
  });
  const toggleAsk = (id) => {
    setRequestedAsks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(`pos_asks:${cfg.company_brand_name}`, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  // Track which disclosure asks the user has confirmed as received (used by
  // the headline verdict to soften the tone once the preference stack is in).
  const [receivedAsks, setReceivedAsks] = useState(() => {
    try {
      const v = localStorage.getItem(`pos_ask_received:${cfg.company_brand_name}`);
      return v ? new Set(JSON.parse(v)) : new Set();
    } catch { return new Set(); }
  });

  if (!isPosition) {
    return (
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 4px' }}>
        <div style={{ background: POS_COLORS.panelB, border: '1px solid ' + POS_COLORS.border, borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <Target className="w-10 h-10 mx-auto mb-3" style={{ color: '#3f3f46' }} />
          <div style={{ fontSize: 16, color: '#d4d4d8', fontWeight: 500, marginBottom: 8 }}>No active position in {company.name}</div>
          <div style={{ fontSize: 12, color: POS_COLORS.dim }}>This company is in research mode — once an investment is made, the full deal disclosure will appear here.</div>
        </div>
      </div>
    );
  }

  // ─── Derived numbers ──────────────────────────────────────────────
  const grossInvested = cfg.gross_investment_usd || 0;
  const netDeployed   = cfg.net_deployed_usd || 0;
  const feeUsd        = cfg.syndicate_lead_fee_usd || 0;
  const feePct        = cfg.syndicate_lead_fee_pct || 0;
  const shares        = cfg.shares_held || 0;
  const pps           = cfg.price_per_share_usd || 0;
  const preMoney      = cfg.pre_money_valuation_usd || 0;
  const postMoney     = preMoney + (cfg.round_size_usd || 0);
  const ownership     = preMoney ? grossInvested / preMoney : 0;
  const carryExitPct  = cfg.carry_on_exit_pct || 0;
  const hurdleExitPct = cfg.hurdle_on_exit_pct || 0;
  const carryDistPct  = cfg.carry_on_distribution_pct || 0;
  const hurdleDistPct = cfg.hurdle_on_distribution_pct || 0;

  const entryMs = cfg.entry_date ? new Date(cfg.entry_date).getTime() : 0;
  const daysHeld = entryMs ? Math.floor((Date.now() - entryMs) / 86400000) : 0;
  const yearsHeld = daysHeld / 365.25;

  const calcExit = (companyExitValue) => {
    const grossProceeds = companyExitValue * ownership;
    const hurdleAmount  = grossInvested * (1 + hurdleExitPct / 100);
    const profitOverHurdle = Math.max(0, grossProceeds - hurdleAmount);
    const leadCarry = profitOverHurdle * (carryExitPct / 100);
    const netToYou = grossProceeds - leadCarry;
    const moic = grossInvested ? netToYou / grossInvested : 0;
    const irr = (yearsHeld > 0.25 && netToYou > 0)
      ? (Math.pow(netToYou / grossInvested, 1 / Math.max(yearsHeld, 0.25)) - 1) * 100 : null;
    return { grossProceeds, hurdleAmount, profitOverHurdle, leadCarry, netToYou, moic, irr };
  };

  const breakevenExit = (() => {
    if (!ownership) return null;
    let lo = 0, hi = 1e12;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const r = calcExit(mid);
      if (r.netToYou < grossInvested) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  })();

  // Estimated preference stack zone (industry norm ~30-60% for late-stage common)
  // Used by the sensitivity chart as a shaded danger region.
  const prefZoneLowUsd  = preMoney * 0.30;
  const prefZoneHighUsd = preMoney * 0.60;

  // ─── Risk flags ──────────────────────────────────────────────────
  const flags = [];
  if (cfg.security_type?.toLowerCase().includes('common') && preMoney > 50_000_000) {
    flags.push({ tier: 'red', label: `Common stock at $${(preMoney/1e6).toFixed(0)}M+`, detail: 'Common stock sits at the BOTTOM of the liquidation waterfall. At high valuations, the preference stack above can be hundreds of millions — exit below that, common gets $0.', action: 'Request preference details' });
  }
  if (cfg.position_type?.toLowerCase().includes('secondary')) {
    flags.push({ tier: 'red', label: 'Secondary purchase from insider', detail: 'You bought from an existing holder, not the company. The seller had information you do not. Ask why they sold.', action: 'Ask: who sold and why?' });
  }
  if (cfg.information_rights?.toLowerCase().includes('indirect')) {
    flags.push({ tier: 'red', label: 'No direct information rights', detail: 'You only receive updates the syndicate lead forwards. The issuer is not obligated to send YOU financial reports.', action: 'Ask: what is reporting cadence?' });
  }
  flags.push({ tier: 'red', label: 'Preference stack UNDISCLOSED', detail: 'Senior series above your common have not been disclosed. This is the single biggest determinant of your downside risk.', action: 'Request cap table' });

  if (feePct > 2) {
    flags.push({ tier: 'amber', label: `Lead fee ${feePct}% (above 2% norm)`, detail: `Typical fees are 1–2%. You paid ${feePct}% = ${fmtUSD(feeUsd, { cents: true })} upfront.`, action: 'Note for next deal' });
  }
  if (carryExitPct >= 20) {
    flags.push({ tier: 'amber', label: `${carryExitPct}% carry on exit`, detail: `At the upper market bound. Above-hurdle returns split 80/20.`, action: 'Note for next deal' });
  }
  if (hurdleDistPct === 0) {
    flags.push({ tier: 'amber', label: `0% hurdle on dividends`, detail: `Lead collects ${carryDistPct}% of every dividend dollar — no preferred return for you first.`, action: 'Clarify dividend treatment' });
  }
  flags.push({ tier: 'amber', label: 'Pro-rata rights unknown', detail: 'Subscription form does not grant pro-rata. Confirm whether you can defend ownership in future rounds.', action: 'Confirm pro-rata rights' });

  if (hurdleExitPct >= 8) {
    flags.push({ tier: 'green', label: `${hurdleExitPct}% hurdle on exit`, detail: `You earn 100% of returns up to ${hurdleExitPct}% IRR. Lead only collects carry above.`, action: null });
  }
  if (carryExitPct <= 10) {
    flags.push({ tier: 'green', label: `${carryExitPct}% carry (below market)`, detail: `Below the 20% industry standard. Lead's share is modest.`, action: null });
  }
  if (sub.investment_receipt) {
    flags.push({ tier: 'green', label: 'Wire confirmation on file', detail: `Receipt dated ${sub.investment_receipt.date} confirms ${fmtUSD(sub.investment_receipt.total_received_usd, { cents: true })} arrived.`, action: null });
  }

  // Audit checks
  const auditChecks = [];
  if (sub.applicant && Math.abs((sub.applicant.individual_investment_amount_usd || 0) - grossInvested) > 1) auditChecks.push({ label: 'Subscription amount mismatch', detail: `Form: ${fmtUSD(sub.applicant.individual_investment_amount_usd, { cents: true })} | Position: ${fmtUSD(grossInvested, { cents: true })}` });
  if (pps > 0 && Math.abs(grossInvested / pps - shares) > 0.01) auditChecks.push({ label: 'Share count mismatch', detail: `Gross ÷ price = ${(grossInvested/pps).toFixed(4)} | Stored: ${shares.toFixed(4)}` });
  if (Math.abs(grossInvested - feeUsd - netDeployed) > 1) auditChecks.push({ label: 'Net deployed mismatch', detail: `Gross − fee = ${fmtUSD(grossInvested - feeUsd, { cents: true })} | Stored: ${fmtUSD(netDeployed, { cents: true })}` });

  // Rights data
  const rightsList = [
    { label: 'Liquidation preference',        status: 'no',      detail: 'Common stock has NO liquidation preference. Paid LAST after all preferred.', tip: 'Right to receive your investment back (or multiple) before junior holders.' },
    { label: 'Anti-dilution protection',      status: 'no',      detail: 'Common is fully exposed to dilution in down rounds.', tip: 'Adjustment to conversion price if a future round prices lower.' },
    { label: 'Pro-rata rights',               status: 'unknown', detail: 'Not granted in subscription form. Confirm with lead.', tip: 'Right to participate in future rounds at same % to maintain ownership.' },
    { label: 'Right of First Refusal',        status: 'unknown', detail: 'Standard for early holders; confirm in Stockholders\' Agreement.', tip: 'Right to buy shares offered for sale by others first.' },
    { label: 'Co-sale / tag-along',           status: 'unknown', detail: 'Standard for early holders; confirm in Stockholders\' Agreement.', tip: 'If founders sell, you can sell pro rata on same terms.' },
    { label: 'Drag-along (subject to it?)',   status: 'yes',     detail: 'You will likely be DRAGGED in a majority-preferred-approved sale.', tip: 'Majority holders can force you to sell on the same terms.' },
    { label: 'Information rights',            status: 'no',      detail: cfg.information_rights, tip: 'Right to receive financials directly from the company.' },
    { label: 'Board seat / observer',         status: 'no',      detail: 'Common at this size never gets board representation.', tip: 'Right to a board seat or observer position.' },
    { label: 'Protective provisions',         status: 'no',      detail: 'Reserved for preferred holders with material ownership.', tip: 'Veto rights over major corporate actions (M&A, charter amendments).' },
    { label: 'Redemption rights',             status: 'no',      detail: 'Common stock cannot be redeemed.', tip: 'Right to force the company to buy back your shares.' },
    { label: 'Registration rights',           status: 'unknown', detail: 'Confirm in Investors\' Rights Agreement.', tip: 'Right to register your shares for sale in an IPO.' },
    { label: 'MFN clause',                    status: 'na',      detail: 'N/A for equity (relevant for SAFEs/notes only).', tip: 'Most-Favored-Nation: only applies to convertible instruments.' },
  ];
  const rightsCount = {
    yes:     rightsList.filter(r => r.status === 'yes').length,
    no:      rightsList.filter(r => r.status === 'no').length,
    unknown: rightsList.filter(r => r.status === 'unknown').length,
    na:      rightsList.filter(r => r.status === 'na').length,
  };

  // Outstanding asks list (lifecycle: pending → requested → resolved)
  const asksList = [
    { id: 'preference-stack', title: 'Full preference stack with per-series liquidation terms', priority: 'critical' },
    { id: 'cap-table',        title: 'Current cap table (founders, ESOP, preferred series, SAFEs)', priority: 'critical' },
    { id: 'certificate',      title: 'Certificate of Incorporation (defines preference & rights)', priority: 'critical' },
    { id: 'stockholders-agreement', title: 'Stockholders\' Agreement (ROFR, co-sale, drag-along)', priority: 'high' },
    { id: 'ira',              title: 'Investors\' Rights Agreement (info & registration rights)', priority: 'high' },
    { id: 'voting-agreement', title: 'Voting Agreement (board composition)', priority: 'medium' },
    { id: 'pro-rata',         title: 'Pro-rata participation rights confirmation', priority: 'high' },
    { id: 'secondary-seller', title: 'Identity & motivation of secondary share seller', priority: 'medium' },
    { id: 'last-financials',  title: 'Most recent financial report from the issuer', priority: 'high' },
    { id: 'update-cadence',   title: 'Expected cadence & content of investor updates', priority: 'medium' },
  ];
  const unrequestedCount = asksList.filter(a => !requestedAsks.has(a.id)).length;

  // Compose email link for outstanding asks
  const composeEmailHref = (() => {
    const subject = `Position questions — ${company.name} / ${cfg.subscription_form?.syndicate_legal?.syndicate_title || 'syndicate'}`;
    const pending = asksList.filter(a => !requestedAsks.has(a.id));
    const body = [
      `Hi,`, ``,
      `I'd like to request the following information regarding my position in ${cfg.company_legal_name} (entered ${cfg.entry_date}, ${fmtUSD(grossInvested, { cents: true })} via ${cfg.nominee}):`,
      ``,
      ...pending.map((a, i) => `${i + 1}. ${a.title}`),
      ``,
      `Thank you,`,
      sub.signed_by || '',
    ].join('\n');
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  })();

  // ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 4px' }}>

      {/* Inline responsive CSS — scoped to this view */}
      <style>{`
        @media (max-width: 768px) {
          .pos-hero-tabs { display: none !important; }
          .pos-asym-hero { grid-template-columns: 1fr !important; }
          .pos-bignum-row { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
          .pos-split-view { grid-template-columns: 1fr !important; }
        }
        .pos-anchor { scroll-margin-top: 84px; }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════
           SECTION 1 — POSITION LANDING
           Brand + section title combined into a single header row.
         ════════════════════════════════════════════════════════════════ */}
      <div id="pos-anchor-position" className="pos-anchor" style={{ marginTop: 8 }}>
        {/* Unified header: company logo + name on the left, section title on the right */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28,
          paddingBottom: 18, borderBottom: '1px solid ' + POS_COLORS.border,
        }}>
          <CompanyLogo brand={company.name} size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: POS_COLORS.white, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              {company.name}
            </div>
          </div>
          <span style={{ flex: 1, minWidth: 0 }}></span>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: POS_COLORS.white, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Position</div>
            <div style={{ fontSize: 10, color: POS_COLORS.dim, marginTop: 2 }}>What you hold, what it's worth across outcomes</div>
          </div>
        </div>

        {/* Position description prose */}
        <div style={{
          background: POS_COLORS.panel, border: `1px solid ${POS_COLORS.border}`,
          borderRadius: 10, padding: '18px 22px', marginBottom: 20,
          fontSize: 13.5, color: '#d4d4d8', lineHeight: 1.65,
        }}>
          You entered {company.name} on <strong style={{ color: POS_COLORS.white }}>{cfg.entry_date}</strong>{' '}
          ({daysHeld} days held) via secondary purchase of{' '}
          <strong style={{ color: POS_COLORS.white }}>{shares.toFixed(4)} {(sub.deal_terms?.type_of_security || cfg.security_type || '').toLowerCase()}</strong>{' '}
          at <strong style={{ color: POS_COLORS.white }}>{fmtUSD(pps, { cents: false })}/share</strong>, deploying{' '}
          <strong style={{ color: POS_COLORS.white }}>{fmtUSD(grossInvested, { cents: true })}</strong> gross ({fmtUSD(netDeployed, { cents: true })} net after a {feePct}% lead fee).{' '}
          The position represents <strong style={{ color: POS_COLORS.cyan }}>{(ownership * 100).toFixed(4)}%</strong>{' '}
          look-through ownership against a <strong style={{ color: POS_COLORS.white }}>{fmtUSD(preMoney, { compact: true })}</strong> pre-money mark.
          The current carry waterfall is {carryExitPct}% above a {hurdleExitPct}% hurdle, so the position breaks even at a{' '}
          <strong style={{ color: POS_COLORS.yellow }}>{breakevenExit ? fmtUSD(breakevenExit, { compact: true }) : '—'}</strong> company exit.
        </div>

        {/* Chart + bullet metrics side-by-side */}
        <div className="pos-asym-hero" style={{
          display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 18,
        }}>
          {/* LEFT — Sensitivity chart (flex column, chart expands to fill cell) */}
          <div style={{
            background: POS_COLORS.panel, border: `1px solid ${POS_COLORS.border}`,
            borderRadius: 10, padding: '20px 22px 16px 22px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: POS_COLORS.white, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'ui-monospace,monospace' }}>Position Value</div>
                <div style={{ fontSize: 11, color: POS_COLORS.dim, marginTop: 4 }}>Net realized value across exit valuations</div>
              </div>
              <span style={{ fontSize: 10, color: POS_COLORS.dimmer, fontFamily: 'ui-monospace,monospace', fontStyle: 'italic' }}>
                hover the chart for exact numbers
              </span>
            </div>

            {(() => {
              // Build sensitivity series: net return at each exit valuation, on log-spaced points
              const minExitLog = 6;          // $1M
              const maxExitLog = 10;         // $10B (chart cap)
              const steps = 50;
              const points = [];
              for (let i = 0; i <= steps; i++) {
                const exitUsd = Math.pow(10, minExitLog + (i / steps) * (maxExitLog - minExitLog));
                const r = calcExit(exitUsd);
                points.push({
                  exit: exitUsd,
                  net: r.netToYou,
                  moic: r.moic,
                });
              }

              // Memo-baseline scenarios for benchmark markers.
              // To visually separate Conservative / Base / Optimistic on a log axis, we pick the LOW
              // end of conservative's exit range, the MID of base, and the HIGH end of optimistic.
              // This still respects the memo's stated ranges while spreading the dots along the curve.
              const memoCap = Math.pow(10, maxExitLog);
              const memoScenarios = (memoBaseline?.exit_scenarios || []).map(s => {
                const tier = (s.tier || '').toLowerCase();
                const range = [s.exit_5x_usd, s.exit_6x_usd, s.exit_7x_usd, s.exit_8x_usd, s.exit_12x_usd, s.exit_15x_usd].filter(v => v != null);
                if (range.length === 0) return null;
                let valuation;
                let label, color;
                if (tier.includes('conservative')) {
                  // Lowest plausible exit in the conservative range
                  valuation = Math.min(...range);
                  label = 'Conservative'; color = POS_COLORS.red;
                } else if (tier.includes('optimistic')) {
                  // Top of the optimistic range — but cap at chart max
                  valuation = Math.min(Math.max(...range), memoCap);
                  label = 'Optimistic'; color = POS_COLORS.green;
                } else {
                  // Mid of the base range
                  const sorted = [...range].sort((a, b) => a - b);
                  valuation = sorted[Math.floor(sorted.length / 2)];
                  label = 'Base'; color = POS_COLORS.yellow;
                }
                return { valuation, label, color };
              }).filter(Boolean);

              // Multiple-of-entry benchmarks
              const multiples = [
                { mult: 1,  label: '1× entry',  color: POS_COLORS.dim },
                { mult: 3,  label: '3× entry',  color: POS_COLORS.dim },
                { mult: 10, label: '10× entry', color: POS_COLORS.dim },
              ];

              const fmtCompactNet = (v) => {
                if (v == null) return '—';
                const abs = Math.abs(v);
                if (abs >= 1e6) return (v >= 0 ? '+' : '') + '$' + (v/1e6).toFixed(1) + 'M';
                if (abs >= 1e3) return (v >= 0 ? '+' : '') + '$' + (v/1e3).toFixed(0) + 'K';
                return (v >= 0 ? '+' : '') + '$' + v.toFixed(0);
              };

              return (
                <div style={{ flex: 1, minHeight: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={points} margin={{ top: 8, right: 8, left: 8, bottom: 22 }}>
                      <defs>
                        <linearGradient id="netLossGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={POS_COLORS.green}  stopOpacity={0.35} />
                          <stop offset="50%"  stopColor={POS_COLORS.green}  stopOpacity={0.05} />
                          <stop offset="100%" stopColor={POS_COLORS.red}    stopOpacity={0.20} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#27272a" strokeDasharray="2 2" />

                      {/* Preference stack danger zone */}
                      <ReferenceArea
                        x1={prefZoneLowUsd} x2={prefZoneHighUsd}
                        fill="rgba(255,71,71,0.12)" stroke="rgba(255,71,71,0.35)" strokeDasharray="3 3"
                        label={{ value: 'preference zone', position: 'insideTop', fontSize: 9, fill: POS_COLORS.red, fontFamily: 'ui-monospace,monospace' }} />

                      {/* Multiple-of-entry vertical markers (computed from breakeven) */}
                      {multiples.map(m => {
                        const targetNet = grossInvested * m.mult;
                        // Solve for exit valuation that yields targetNet via linear interpolation on points
                        let target = null;
                        for (let i = 0; i < points.length - 1; i++) {
                          if ((points[i].net <= targetNet && points[i+1].net >= targetNet) ||
                              (points[i].net >= targetNet && points[i+1].net <= targetNet)) {
                            const t = (targetNet - points[i].net) / (points[i+1].net - points[i].net || 1);
                            target = points[i].exit + t * (points[i+1].exit - points[i].exit);
                            break;
                          }
                        }
                        if (!target || target > Math.pow(10, maxExitLog)) return null;
                        return (
                          <ReferenceLine key={m.label} x={target} stroke={m.color} strokeDasharray="3 3" strokeOpacity={0.5} />
                        );
                      })}

                      {/* Breakeven marker */}
                      {breakevenExit && (
                        <ReferenceLine x={breakevenExit} stroke={POS_COLORS.yellow} strokeWidth={2}
                          label={{ value: `breakeven ${fmtUSD(breakevenExit, { compact: true })}`, position: 'insideTopLeft', fontSize: 10, fill: POS_COLORS.yellow, fontFamily: 'ui-monospace,monospace', offset: 8 }} />
                      )}

                      {/* Zero net horizontal line */}
                      <ReferenceLine y={0} stroke={POS_COLORS.dimmer} strokeDasharray="2 2" />

                      {/* Memo-baseline scenarios as dots */}
                      {memoScenarios.map(s => {
                        const r = calcExit(s.valuation);
                        return (
                          <ReferenceDot key={s.label} x={s.valuation} y={r.netToYou} r={6}
                            fill={s.color} stroke="#09090b" strokeWidth={2}
                            label={{ value: s.label, position: 'top', fontSize: 10, fill: s.color, fontFamily: 'ui-monospace,monospace', offset: 12, fontWeight: 600 }} />
                        );
                      })}

                      <XAxis dataKey="exit" type="number" scale="log" domain={['auto', 'auto']}
                        tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'ui-monospace,monospace' }}
                        tickFormatter={(v) => fmtUSD(v, { compact: true })}
                        ticks={[1e6, 1e7, 1e8, 1e9, 1e10]}
                        label={{ value: 'Company exit valuation (log)', position: 'insideBottom', offset: -10, fontSize: 10, fill: POS_COLORS.dim, fontFamily: 'ui-monospace,monospace' }} />

                      <YAxis
                        tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'ui-monospace,monospace' }}
                        tickFormatter={fmtCompactNet} />

                      <RTooltip
                        cursor={{ stroke: POS_COLORS.cyan, strokeDasharray: '2 2', strokeOpacity: 0.6 }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0].payload;
                          const inDanger = p.exit >= prefZoneLowUsd && p.exit <= prefZoneHighUsd;
                          return (
                            <div style={{ background: '#09090b', border: '1px solid #3f3f46', borderRadius: 6, padding: '10px 12px', fontSize: 11, minWidth: 200, fontFamily: 'ui-monospace,monospace' }}>
                              <div style={{ color: '#a1a1aa', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 6, borderBottom: '1px solid #27272a' }}>Exit valuation</div>
                              <div style={{ fontSize: 14, color: POS_COLORS.cyan, fontWeight: 700, marginTop: 4 }}>{fmtUSD(p.exit, { compact: true })}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, gap: 16 }}>
                                <span style={{ color: POS_COLORS.dim }}>Your net:</span>
                                <strong style={{ color: p.net >= grossInvested ? POS_COLORS.green : (p.net > 0 ? POS_COLORS.yellow : POS_COLORS.red) }}>{fmtUSD(p.net, { cents: false })}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, gap: 16 }}>
                                <span style={{ color: POS_COLORS.dim }}>MOIC:</span>
                                <strong style={{ color: p.moic >= 1 ? POS_COLORS.green : POS_COLORS.red }}>{p.moic.toFixed(2)}×</strong>
                              </div>
                              {inDanger && (
                                <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #27272a', color: POS_COLORS.red, fontSize: 10, fontStyle: 'italic' }}>
                                  ⚠ In preference-stack zone — common may receive $0
                                </div>
                              )}
                            </div>
                          );
                        }} />

                      <Area type="monotone" dataKey="net"
                        stroke={POS_COLORS.cyan} strokeWidth={2.5}
                        fill="url(#netLossGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}

            {/* Chart legend */}
            <div style={{ display: 'flex', gap: 18, fontSize: 10, fontFamily: 'ui-monospace,monospace', color: POS_COLORS.dim, marginTop: 10, paddingTop: 12, borderTop: '1px solid ' + POS_COLORS.border, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 2, background: POS_COLORS.cyan, display: 'inline-block' }}></span>
                net return curve
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 2, height: 10, background: POS_COLORS.yellow, display: 'inline-block' }}></span>
                breakeven
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 6, background: 'rgba(255,71,71,0.2)', border: '1px dashed rgba(255,71,71,0.5)' }}></span>
                preference zone
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: POS_COLORS.red, display: 'inline-block' }}></span>
                conservative
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: POS_COLORS.yellow, display: 'inline-block' }}></span>
                base
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: POS_COLORS.green, display: 'inline-block' }}></span>
                optimistic
              </span>
            </div>
          </div>

          {/* RIGHT — Bullet-point key metrics */}
          <div style={{
            background: POS_COLORS.panel, border: `1px solid ${POS_COLORS.border}`,
            borderRadius: 10, padding: '20px 22px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: POS_COLORS.white, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'ui-monospace,monospace', marginBottom: 16 }}>
              Key Metrics
            </div>

            {(() => {
              const metrics = [
                { label: 'Current valuation',  value: fmtUSD(preMoney, { compact: true }),       sub: 'pre-money · entry mark', color: POS_COLORS.white,  large: true },
                { label: 'Your commitment',    value: fmtUSD(grossInvested, { cents: true }),    sub: `Net ${fmtUSD(netDeployed, { cents: true })} after ${feePct}% fee`, color: POS_COLORS.white },
                { label: 'Shares held',        value: shares.toFixed(4),                          sub: `@ ${fmtUSD(pps, { cents: false })}/share`,                          color: POS_COLORS.white },
                { label: 'Look-through ownership', value: `${(ownership * 100).toFixed(4)}%`,      sub: 'pre-dilution · indirect via SPV',                                   color: POS_COLORS.cyan },
                { label: 'Security class',     value: (sub.deal_terms?.type_of_security || cfg.security_type || '—').split('/')[0],
                                              sub: 'bottom of liquidation waterfall', color: POS_COLORS.red, subColor: POS_COLORS.red },
                { label: 'Breakeven exit',     value: breakevenExit ? fmtUSD(breakevenExit, { compact: true }) : '—',
                                              sub: `after ${carryExitPct}% carry above ${hurdleExitPct}%`, color: POS_COLORS.yellow },
                { label: 'Holding period',     value: `${daysHeld}d`,                             sub: `since ${cfg.entry_date}`, color: POS_COLORS.white },
              ];

              return (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {metrics.map((m, i) => (
                    <div key={m.label} style={{
                      display: 'grid', gridTemplateColumns: '8px 1fr auto', gap: 12, alignItems: 'baseline',
                      padding: '12px 0',
                      borderBottom: i < metrics.length - 1 ? `1px solid ${POS_COLORS.border}` : 'none',
                    }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: m.color, marginTop: 8 }}></span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10, color: POS_COLORS.dim, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'ui-monospace,monospace' }}>{m.label}</div>
                        <div style={{ fontSize: 10, color: m.subColor || POS_COLORS.dimmer, fontFamily: 'ui-monospace,monospace', marginTop: 3, fontWeight: m.subColor ? 600 : 400 }}>{m.sub}</div>
                      </div>
                      <div style={{ fontSize: m.large ? 20 : 16, color: m.color, fontFamily: 'ui-monospace,monospace', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════
           SECTION SEPARATOR — generous breathing room between Landing
           and Deal Structure. Subtle horizontal rule for visual rhythm.
         ════════════════════════════════════════════════════════════════ */}
      <div style={{ height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${POS_COLORS.border}, transparent)` }}></div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
           SECTION 2 — DEAL STRUCTURE & DOCUMENTATION
           Fees, nominee, syndicate, rights, timeline, source documents.
         ════════════════════════════════════════════════════════════════ */}
      <div id="pos-anchor-details" className="pos-anchor">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <Layers className="w-5 h-5" style={{ color: POS_COLORS.cyan }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: POS_COLORS.white, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Deal Structure</div>
            <div style={{ fontSize: 11, color: POS_COLORS.dim, marginTop: 3 }}>Fees, nominee, syndicate terms, rights, timeline, documents — click any row to expand</div>
          </div>
        </div>

        {/* ── DEAL STRUCTURE ── */}
        <div style={{ marginBottom: 10, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 10, color: POS_COLORS.dim, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'ui-monospace,monospace', fontWeight: 700 }}>
            Deal Structure
          </span>
          <span style={{ flex: 1, height: 1, background: POS_COLORS.border }}></span>
        </div>

        <AccordionRow id="rights" title="Rights & Protections" icon={CheckCircle2}
          summary={`${rightsCount.yes} yes · ${rightsCount.no} no · ${rightsCount.unknown} unknown`}
          openMap={openMap} setOpenMap={setOpenMap}>
          {/* 12-cell visual grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, marginBottom: 16 }}>
            {rightsList.map(r => {
              const cellColor =
                r.status === 'yes' ? POS_COLORS.green :
                r.status === 'no' ? POS_COLORS.red :
                r.status === 'unknown' ? POS_COLORS.yellow : POS_COLORS.dimmer;
              return (
                <div key={r.label} title={`${r.status.toUpperCase()} — ${r.detail}\n\n${r.tip || ''}`}
                  style={{
                    padding: '10px 12px',
                    background: cellColor + '0d',
                    border: '1px solid ' + cellColor + '40',
                    borderLeft: '3px solid ' + cellColor,
                    borderRadius: 4, cursor: 'help',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = cellColor + '18'}
                  onMouseLeave={(e) => e.currentTarget.style.background = cellColor + '0d'}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#e4e4e7', fontWeight: 500, lineHeight: 1.3 }}>{r.label}</span>
                    <RightBadge status={r.status} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Critical absences callout */}
          <div style={{ background: 'rgba(255,71,71,0.06)', border: '1px solid rgba(255,71,71,0.3)', borderLeft: '3px solid ' + POS_COLORS.red, borderRadius: 6, padding: '12px 16px' }}>
            <div style={{ fontSize: 10, color: POS_COLORS.red, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'ui-monospace,monospace', marginBottom: 6, fontWeight: 700 }}>Critical absences</div>
            <div style={{ fontSize: 12, color: '#e4e4e7', lineHeight: 1.6 }}>
              No liquidation preference. No anti-dilution. No direct information rights. No board seat. No protective provisions. No redemption rights. As a common stockholder you hold almost none of the standard preferred-stock protections.
            </div>
          </div>
        </AccordionRow>

        <AccordionRow id="syndicate" title="Syndicate / Fund Structure" icon={Users}
          summary={`${cfg.syndicate_lead.split('/')[0].trim()} · held via ${cfg.nominee} · ${carryExitPct}% / ${hurdleExitPct}%`}
          openMap={openMap} setOpenMap={setOpenMap}>

          {/* Nominee callout — moved here from the old "Held via" strip */}
          <div style={{
            background: POS_COLORS.panelB,
            border: '1px solid ' + POS_COLORS.border,
            borderLeft: '3px solid ' + POS_COLORS.cyan,
            borderRadius: 6, padding: '12px 16px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <Shield className="w-4 h-4 flex-shrink-0" style={{ color: POS_COLORS.cyan }} />
            <span style={{ fontSize: 10, color: POS_COLORS.dim, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'ui-monospace,monospace' }}>Held via</span>
            <span style={{ fontSize: 13, color: POS_COLORS.white, fontWeight: 600, fontFamily: 'ui-monospace,monospace' }}>{cfg.nominee}</span>
            <span style={{ fontSize: 11, color: POS_COLORS.dim, fontFamily: 'ui-monospace,monospace' }}>(nominee)</span>
            <Tip text={`Nominee structure: ${cfg.nominee} holds the shares on the issuer's cap table on your behalf. You hold an economic interest via the SPV, but your name does NOT appear on the issuer's official cap table. This means: (1) you have no direct voting rights at the company level; (2) information rights flow through the nominee; (3) any transfer or sale must go through the nominee; (4) in disputes with the issuer, you have indirect standing only.`} />
            <span style={{ flex: 1, minWidth: 0 }}></span>
            <span style={{ fontSize: 11, color: POS_COLORS.dim, fontStyle: 'italic' }}>You don't appear on the issuer's cap table directly</span>
          </div>

          {/* Visual carry split */}
          <div style={{ background: POS_COLORS.panel, border: '1px solid ' + POS_COLORS.border, borderRadius: 6, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: POS_COLORS.dim, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'ui-monospace,monospace', marginBottom: 12 }}>How profits split on exit</div>

            {/* Hurdle visual */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#e4e4e7', marginBottom: 6, fontFamily: 'ui-monospace,monospace' }}>
                Returns up to <strong style={{ color: POS_COLORS.green }}>{hurdleExitPct}% hurdle</strong>:
              </div>
              <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', border: '1px solid ' + POS_COLORS.border }}>
                <div style={{ width: '100%', background: POS_COLORS.green + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: POS_COLORS.green, fontFamily: 'ui-monospace,monospace', fontWeight: 600 }}>
                  100% to you
                </div>
              </div>
            </div>

            {/* Above-hurdle split */}
            <div>
              <div style={{ fontSize: 11, color: '#e4e4e7', marginBottom: 6, fontFamily: 'ui-monospace,monospace' }}>
                Profits <strong style={{ color: POS_COLORS.yellow }}>above {hurdleExitPct}% hurdle</strong> are split:
              </div>
              <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', border: '1px solid ' + POS_COLORS.border }}>
                <div style={{ width: `${100 - carryExitPct}%`, background: POS_COLORS.green + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: POS_COLORS.green, fontFamily: 'ui-monospace,monospace', fontWeight: 600 }}>
                  {100 - carryExitPct}% to you
                </div>
                <div style={{ width: `${carryExitPct}%`, background: POS_COLORS.yellow + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: POS_COLORS.yellow, fontFamily: 'ui-monospace,monospace', fontWeight: 600 }}>
                  {carryExitPct}% lead
                </div>
              </div>
            </div>

            {/* Dividends */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid ' + POS_COLORS.border }}>
              <div style={{ fontSize: 11, color: '#e4e4e7', marginBottom: 6, fontFamily: 'ui-monospace,monospace' }}>
                On <strong style={{ color: hurdleDistPct === 0 ? POS_COLORS.red : POS_COLORS.white }}>dividends/coupons</strong> {hurdleDistPct === 0 ? '(no hurdle):' : `(above ${hurdleDistPct}% hurdle):`}
              </div>
              <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', border: '1px solid ' + POS_COLORS.border }}>
                <div style={{ width: `${100 - carryDistPct}%`, background: POS_COLORS.green + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: POS_COLORS.green, fontFamily: 'ui-monospace,monospace', fontWeight: 600 }}>
                  {100 - carryDistPct}% to you
                </div>
                <div style={{ width: `${carryDistPct}%`, background: POS_COLORS.red + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: POS_COLORS.red, fontFamily: 'ui-monospace,monospace', fontWeight: 600 }}>
                  {carryDistPct}% lead
                </div>
              </div>
              {hurdleDistPct === 0 && <div style={{ fontSize: 10, color: POS_COLORS.red, fontFamily: 'ui-monospace,monospace', marginTop: 6, fontStyle: 'italic' }}>⚠ No hurdle means lead takes carry on first dollar.</div>}
            </div>
          </div>

          <FieldGrid cols={2} items={[
            ['Syndicate title',    sub.syndicate_legal?.syndicate_title],
            ['Syndicate lead(s)',  sub.syndicate_legal?.syndicate_lead || cfg.syndicate_lead],
            ['Nominee',            cfg.nominee],
            ['Platform',           '— custom SPV —'],
            ['Carry recipient',    sub.syndicate_legal?.carried_interest_recipient],
            ['Total syndicate size', null, { requestable: true, onRequest: () => toggleAsk('cap-table') }],
            ['Number of LPs',      null, { requestable: true }],
            ['Waterfall structure', 'American (deal-by-deal) — assumed', { tip: 'American: deal-by-deal carry. European: fund-level.' }],
            ['Management fee',     'None (one-time lead fee only)'],
            ['Voting rights',      'Indirect via nominee'],
          ]} />
        </AccordionRow>

        {/* ── TIMELINE & LIQUIDITY ── */}
        <div style={{ marginTop: 22, marginBottom: 10, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 10, color: POS_COLORS.dim, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'ui-monospace,monospace', fontWeight: 700 }}>
            Timeline & Liquidity
          </span>
          <span style={{ flex: 1, height: 1, background: POS_COLORS.border }}></span>
        </div>

        <AccordionRow id="liquidity" title="Transfer & Liquidity" icon={DollarSign}
          summary="3–7y estimated · 180d IPO lockup"
          openMap={openMap} setOpenMap={setOpenMap}>
          {/* Horizontal liquidity timeline */}
          <div style={{ background: POS_COLORS.panel, border: '1px solid ' + POS_COLORS.border, borderRadius: 6, padding: 20, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', alignItems: 'center', position: 'relative' }}>
              {/* line */}
              <div style={{ position: 'absolute', left: '6%', right: '6%', top: 11, height: 2, background: 'linear-gradient(to right, ' + POS_COLORS.cyan + ', ' + POS_COLORS.green + ' 30%, ' + POS_COLORS.dimmer + ' 70%, ' + POS_COLORS.dimmer + ')' }}></div>

              {[
                { label: 'Today',           desc: `${daysHeld}d held`,             color: POS_COLORS.cyan,    current: true },
                { label: 'IPO lockup',      desc: '180d post-IPO',                  color: POS_COLORS.yellow },
                { label: 'Earliest exit',   desc: 'IPO or M&A',                     color: POS_COLORS.green },
                { label: '2027–2031',       desc: 'Expected exit window',           color: POS_COLORS.dimmer },
              ].map((stage, i) => (
                <div key={i} style={{ position: 'relative', textAlign: 'center' }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: stage.color, margin: '0 auto',
                    boxShadow: stage.current ? `0 0 0 5px ${stage.color}33` : 'none',
                    position: 'relative', zIndex: 1,
                  }}></div>
                  <div style={{ fontSize: 11, color: stage.color, fontFamily: 'ui-monospace,monospace', fontWeight: 600, marginTop: 8 }}>{stage.label}</div>
                  <div style={{ fontSize: 10, color: POS_COLORS.dim, marginTop: 3 }}>{stage.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <FieldGrid cols={2} items={[
            ['Transfer restrictions', 'ROFR + board approval (confirm in Stockholders\' Agreement)'],
            ['IPO lockup',            '180 days post-IPO (standard) — confirm'],
            ['Vesting',               'N/A — fully vested (purchased shares)'],
            ['Earliest liquidity',    'IPO or M&A — realistic 3–7 years'],
            ['Secondary market',      'Forge / EquityZen / Hiive at high friction'],
            ['Drag-along trigger',    'Likely 50–60%+ of preferred holders'],
          ]} />
        </AccordionRow>

        <AccordionRow id="timeline" title="Timeline & Milestones" icon={Activity}
          summary={`Entered ${cfg.entry_date} · ${daysHeld}d held`}
          openMap={openMap} setOpenMap={setOpenMap}>
          <div style={{ position: 'relative', paddingLeft: 26 }}>
            <div style={{ position: 'absolute', left: 8, top: 6, bottom: 6, width: 2, background: POS_COLORS.border }}></div>
            {[
              { date: cfg.entry_date,            label: 'Investment date',           desc: `Subscription form signed: ${fmtUSD(grossInvested, { cents: true })} commitment`, color: POS_COLORS.cyan },
              sub.investment_receipt && { date: sub.investment_receipt.date, label: 'Funds received', desc: `${fmtUSD(sub.investment_receipt.total_received_usd, { cents: true })} confirmed at designated account`, color: POS_COLORS.green },
              { date: cfg.entry_date,            label: 'Completion / shares allocated', desc: `${shares.toFixed(4)} shares @ ${fmtUSD(pps, { cents: true })}`, color: POS_COLORS.green },
              { date: 'today',                   label: 'Holding period',            desc: `${daysHeld} days held · ${yearsHeld.toFixed(2)} years`, color: POS_COLORS.dim, current: true },
              { date: '2027–2031 (est.)',        label: 'Potential exit window',     desc: 'Typical 3–7 year horizon for secondary positions', color: POS_COLORS.dimmer },
            ].filter(Boolean).map((e, i) => (
              <div key={i} style={{ position: 'relative', paddingBottom: 16 }}>
                <div style={{
                  position: 'absolute', left: -22, top: 2, width: 12, height: 12, borderRadius: '50%',
                  background: e.color, border: '2px solid #09090b',
                  boxShadow: e.current ? `0 0 0 4px ${e.color}33` : 'none',
                }}></div>
                <div style={{ fontSize: 11, color: e.color, fontFamily: 'ui-monospace,monospace', fontWeight: 600 }}>{e.date}</div>
                <div style={{ fontSize: 13, color: '#e4e4e7', fontWeight: 500, marginTop: 3 }}>{e.label}</div>
                <div style={{ fontSize: 11, color: POS_COLORS.dim, marginTop: 3 }}>{e.desc}</div>
              </div>
            ))}
          </div>
        </AccordionRow>

        {/* ── FEES & DOCUMENTS ── */}
        <div style={{ marginTop: 22, marginBottom: 10, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 10, color: POS_COLORS.dim, textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'ui-monospace,monospace', fontWeight: 700 }}>
            Fees & Documents
          </span>
          <span style={{ flex: 1, height: 1, background: POS_COLORS.border }}></span>
        </div>

        <AccordionRow id="fees" title="Fee & Carry Tracker" icon={DollarSign}
          summary={`${fmtUSD(feeUsd, { cents: true })} paid + projected carry`}
          openMap={openMap} setOpenMap={setOpenMap}>
          <FieldGrid cols={2} items={[
            ['Upfront fees paid', fmtUSD(feeUsd, { cents: true }) + ` (${feePct}% lead fee)`, { color: POS_COLORS.red }],
            ['Recurring mgmt fees', '$0 (no annual fee)'],
            ['Carry on current paper value', '$0 (at MOIC 1.0× = no profit)'],
            ['Estimated carry @ base (1×)', fmtUSD(calcExit(preMoney).leadCarry, { cents: false }), { color: POS_COLORS.yellow }],
            ['Estimated carry @ 3× upside', fmtUSD(calcExit(preMoney * 3).leadCarry, { cents: false }), { color: POS_COLORS.yellow }],
            ['Estimated carry @ 10× home run', fmtUSD(calcExit(preMoney * 10).leadCarry, { cents: false }), { color: POS_COLORS.red }],
            ['Total drag at 3× exit',  `${((calcExit(preMoney*3).leadCarry + feeUsd) / calcExit(preMoney*3).grossProceeds * 100).toFixed(1)}% of gross`],
            ['Total drag at 10× exit', `${((calcExit(preMoney*10).leadCarry + feeUsd) / calcExit(preMoney*10).grossProceeds * 100).toFixed(1)}% of gross`],
          ]} />
        </AccordionRow>

        <div id="pos-anchor-docs" className="pos-anchor"></div>
        <AccordionRow id="docs" title="Attached Documents" icon={FileText}
          summary={(() => {
            const total = (cfg.documents || []).length;
            const attached = (cfg.documents || []).filter(d => d.url).length;
            return total === 0 ? 'No documents attached' : `${attached} of ${total} attached`;
          })()}
          openMap={openMap} setOpenMap={setOpenMap}>
          {(!cfg.documents || cfg.documents.length === 0) ? (
            <div style={{ fontSize: 12, color: POS_COLORS.dim, fontStyle: 'italic', padding: '12px 4px' }}>
              No documents attached for this company yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cfg.documents.map((d, i) => {
                const hasUrl = !!d.url;
                const sizeMb = d.size_bytes ? (d.size_bytes / 1024 / 1024).toFixed(2) + ' MB' : null;
                return (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center',
                    padding: '14px 16px',
                    background: hasUrl ? 'rgba(34,211,238,0.04)' : POS_COLORS.panel,
                    border: '1px solid ' + (hasUrl ? 'rgba(34,211,238,0.25)' : POS_COLORS.border),
                    borderLeft: '3px solid ' + (hasUrl ? POS_COLORS.cyan : POS_COLORS.dimmer),
                    borderRadius: 6,
                  }}>
                    <FileText className="w-5 h-5" style={{ color: hasUrl ? POS_COLORS.cyan : POS_COLORS.dimmer }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: POS_COLORS.white, fontWeight: 500 }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: POS_COLORS.dim, fontFamily: 'ui-monospace,monospace', marginTop: 4 }}>
                        {d.date}{d.signed_by ? ` · signed by ${d.signed_by}` : ''}{sizeMb ? ` · ${sizeMb}` : ''}
                      </div>
                      {d.notes && <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 6, lineHeight: 1.5 }}>{d.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {hasUrl ? (
                        <>
                          <a href={d.url} target="_blank" rel="noopener noreferrer"
                            style={{
                              padding: '7px 14px', fontSize: 11, fontFamily: 'ui-monospace,monospace', fontWeight: 600,
                              background: POS_COLORS.cyan, color: '#0a0a0a',
                              borderRadius: 5, textDecoration: 'none', whiteSpace: 'nowrap',
                            }}>
                            Open PDF →
                          </a>
                          <a href={d.url} download
                            title="Download PDF"
                            style={{
                              padding: '7px 12px', fontSize: 11, fontFamily: 'ui-monospace,monospace',
                              background: 'transparent', color: POS_COLORS.dim,
                              border: '1px solid ' + POS_COLORS.border, borderRadius: 5,
                              textDecoration: 'none', whiteSpace: 'nowrap',
                            }}>
                            ↓
                          </a>
                        </>
                      ) : (
                        <span style={{
                          padding: '6px 12px', fontSize: 10, fontFamily: 'ui-monospace,monospace',
                          color: POS_COLORS.yellow, background: 'rgba(255,184,0,0.08)',
                          border: '1px solid rgba(255,184,0,0.3)', borderRadius: 4,
                          whiteSpace: 'nowrap',
                        }}>NOT ATTACHED</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Inline hint on how to attach */}
          <div style={{ marginTop: 14, padding: '10px 14px', background: POS_COLORS.panel, border: '1px dashed ' + POS_COLORS.border, borderRadius: 4, fontSize: 11, color: POS_COLORS.dim, lineHeight: 1.55 }}>
            To attach a PDF: upload it to <code style={{ color: POS_COLORS.cyan, fontFamily: 'ui-monospace,monospace' }}>/docs/</code> in your GitHub repo, then set the <code style={{ color: POS_COLORS.cyan, fontFamily: 'ui-monospace,monospace' }}>url</code> field of the corresponding entry in <code style={{ color: POS_COLORS.cyan, fontFamily: 'ui-monospace,monospace' }}>cfg.documents</code> to <code style={{ color: POS_COLORS.cyan, fontFamily: 'ui-monospace,monospace' }}>"docs/filename.pdf"</code>.
          </div>
        </AccordionRow>

        <AccordionRow id="audit" title="Audit Sanity Check" icon={CheckCircle2}
          summary={auditChecks.length === 0 ? '✓ Reconciled' : `${auditChecks.length} issue${auditChecks.length > 1 ? 's' : ''}`}
          severity={auditChecks.length === 0 ? 'green' : 'amber'}
          openMap={openMap} setOpenMap={setOpenMap}>
          {auditChecks.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: POS_COLORS.green, padding: '8px 0' }}>
              <CheckCircle2 className="w-5 h-5" />
              <span>All core figures reconcile — subscription, gross, fee, net, shares, price per share all match.</span>
            </div>
          ) : auditChecks.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '10px 14px', background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: 6, color: POS_COLORS.yellow, marginBottom: 6 }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <div style={{ fontWeight: 500 }}>{c.label}</div>
                <div style={{ color: POS_COLORS.dim, marginTop: 3 }}>{c.detail}</div>
              </div>
            </div>
          ))}
        </AccordionRow>

        <AccordionRow id="source" title="Source Document · Subscription Form" icon={FileText}
          summary={`Signed ${sub.signed_date || cfg.entry_date || '—'} by ${sub.signed_by || 'investor'}`}
          openMap={openMap} setOpenMap={setOpenMap}>
          {(() => {
            // Find the subscription-form document in cfg.documents (if attached)
            const pdfDoc = (cfg.documents || []).find(d => d.type === 'subscription-form' && d.url);
            if (!pdfDoc) return null;
            return (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '12px 16px', marginBottom: 16,
                background: 'rgba(34,211,238,0.06)',
                border: '1px solid rgba(34,211,238,0.3)',
                borderLeft: '3px solid ' + POS_COLORS.cyan,
                borderRadius: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <FileText className="w-5 h-5 flex-shrink-0" style={{ color: POS_COLORS.cyan }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: POS_COLORS.white, fontWeight: 600 }}>Original signed PDF available</div>
                    <div style={{ fontSize: 10, color: POS_COLORS.dim, fontFamily: 'ui-monospace,monospace', marginTop: 2 }}>
                      Click to open the signed subscription form in a new tab
                    </div>
                  </div>
                </div>
                <a href={pdfDoc.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px', fontSize: 11, fontFamily: 'ui-monospace,monospace', fontWeight: 600,
                    background: POS_COLORS.cyan, color: '#0a0a0a',
                    borderRadius: 5, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                  Open PDF →
                </a>
              </div>
            );
          })()}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: POS_COLORS.dim, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'ui-monospace,monospace', marginBottom: 8 }}>Applicant</div>
            <FieldGrid items={[
              ['Investor name',         sub.applicant?.investor_name],
              ['Registration #',        sub.applicant?.registration_number],
              ['Registered address',    sub.applicant?.investor_address],
              ['Individual investment', sub.applicant ? fmtUSD(sub.applicant.individual_investment_amount_usd, { cents: true }) : null, { color: POS_COLORS.green }],
            ]} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: POS_COLORS.dim, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'ui-monospace,monospace', marginBottom: 8 }}>Part 1 · Issuer & instrument</div>
            <FieldGrid items={[
              ['Issuer',              sub.deal_terms?.issuer],
              ['Round size',          sub.deal_terms?.round_size_usd != null ? fmtUSD(sub.deal_terms.round_size_usd, { compact: true }) : null],
              ['Funding round type',  sub.deal_terms?.funding_round_type],
              ['Type of security',    sub.deal_terms?.type_of_security],
              ['Price per security',  sub.deal_terms?.price_per_security_usd != null ? fmtUSD(sub.deal_terms.price_per_security_usd, { cents: true }) : null],
              ['Pre-money valuation', sub.deal_terms?.pre_money_valuation_usd != null ? fmtUSD(sub.deal_terms.pre_money_valuation_usd, { compact: true }) : null],
              ['Proxy appointment',   sub.deal_terms?.proxy_appointment],
            ]} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: POS_COLORS.dim, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'ui-monospace,monospace', marginBottom: 8 }}>Part 3 · Syndicate fees</div>
            <FieldGrid items={[
              ['Syndicate lead fee',            sub.syndicate_fees ? `${sub.syndicate_fees.syndicate_lead_fee_pct}% (${fmtUSD(sub.syndicate_fees.syndicate_lead_fee_usd, { cents: true })})` : null],
              ['Carried interest on exit',      sub.syndicate_fees ? `${sub.syndicate_fees.carried_interest_on_exit_pct}%` : null],
              ['Hurdle on exit',                sub.syndicate_fees ? `${sub.syndicate_fees.hurdle_on_exit_pct}%` : null],
              ['Carried interest on dividends', sub.syndicate_fees ? `${sub.syndicate_fees.carried_interest_on_distribution_pct}%` : null],
              ['Hurdle on dividends',           sub.syndicate_fees ? `${sub.syndicate_fees.hurdle_on_distribution_pct}%` : null, { color: POS_COLORS.yellow }],
            ]} />
          </div>
          {sub.investment_receipt && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: POS_COLORS.dim, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'ui-monospace,monospace', marginBottom: 8 }}>Investment receipt</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'ui-monospace,monospace' }}>
                <thead><tr style={{ borderBottom: '1px solid ' + POS_COLORS.border }}>
                  {['Date', 'Original received', 'Conversion rate', 'Conversion fee', 'Total received'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Date' ? 'left' : 'right', padding: '6px 8px', color: POS_COLORS.dim, fontWeight: 400, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody><tr>
                  <td style={{ padding: 8, color: '#d4d4d8' }}>{sub.investment_receipt.date}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: '#d4d4d8' }}>{fmtUSD(sub.investment_receipt.original_received_usd, { cents: true })}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: POS_COLORS.dim }}>{sub.investment_receipt.conversion_rate}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: POS_COLORS.dim }}>{fmtUSD(sub.investment_receipt.conversion_fee_usd, { cents: true })}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: POS_COLORS.green }}>{fmtUSD(sub.investment_receipt.total_received_usd, { cents: true })}</td>
                </tr></tbody>
              </table>
            </div>
          )}
        </AccordionRow>
      </div>

    </div>
  );
}
