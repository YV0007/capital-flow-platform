import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { fmtUSD, fmtPct } from '../../../lib/utils.js';

export default function DealStructureAccordion({ cfg }) {
  const [open, setOpen] = useState(false);
  const labelCls = "text-[10px] uppercase tracking-wider text-zinc-500";
  const fields = [
    ['Entry date', cfg.entry_date],
    ['Position type', cfg.position_type],
    ['Gross investment', fmtUSD(cfg.gross_investment_usd, { cents: true })],
    ['Shares held', cfg.shares_held.toFixed(4)],
    ['Pre-money @ entry', fmtUSD(cfg.pre_money_valuation_usd, { compact: true })],
    ['Implied % (pre-dilution)', fmtPct(cfg.implied_economic_interest_pct, 4)],
    ['Syndicate fee', fmtUSD(cfg.syndicate_lead_fee_usd, { cents: true })],
    ['Net deployed', fmtUSD(cfg.net_deployed_usd, { cents: true })],
    ['Price per share', fmtUSD(cfg.price_per_share_usd)],
    ['Round type', cfg.round_type],
    ['Round size', fmtUSD(cfg.round_size_usd, { compact: true })],
    ['Security', cfg.security_type],
    ['Carry on exit', `${cfg.carry_on_exit_pct}% above ${cfg.hurdle_on_exit_pct}% hurdle`],
    ['Carry on distributions', `${cfg.carry_on_distribution_pct}% above ${cfg.hurdle_on_distribution_pct}% hurdle`],
    ['Syndicate lead', cfg.syndicate_lead],
    ['Nominee', cfg.nominee],
  ];
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-zinc-900/60">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
          <Layers className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-mono text-zinc-200">Deal Structure</span>
          <span className="text-[10px] text-zinc-600 font-mono">{fields.length} fields</span>
        </div>
        <span className="text-[10px] text-zinc-600">{open ? 'collapse' : 'expand'}</span>
      </button>
      {open && (
        <div className="border-t border-zinc-800 p-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
            {fields.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <span className={labelCls}>{k}</span>
                <span className="text-zinc-200 font-mono mt-0.5 break-words">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 italic">
            Read-only snapshot from subscription form. Edit in Settings.
          </div>
        </div>
      )}
    </div>
  );
}
