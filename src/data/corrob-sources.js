// Eight corroboration sources for the Three-Source Rule (monolith line 1759).
// Kept in JS — not JSON — because each entry embeds a Lucide React component
// reference for the bucket icon. Tab views import this and use `entry.icon`
// directly as a React element.

import {
  Users, MousePointer, BarChart3, CheckCircle2,
  Search, FileText, Zap, Megaphone,
} from 'lucide-react';

export const CORROB_SOURCES = [
  { id: 'headcount', label: 'Headcount & Hiring', icon: Users,
    tools: ['LinkedIn Headcount', 'LinkedIn Jobs', 'Careers Page'],
    staleDays: 90,
    why: 'Hiring volume and senior-hire mix is one of the strongest leading indicators of revenue trajectory and operational confidence at venture scale.' },
  { id: 'traffic', label: 'Web Traffic', icon: MousePointer,
    tools: ['Similarweb', 'Semrush', 'Ahrefs'],
    staleDays: 60, requireMin: 2,
    why: 'Marketing-driven traffic correlates with top-of-funnel demand. ≥2 sources required because individual tools often diverge >30%.' },
  { id: 'app', label: 'App Downloads', icon: BarChart3,
    tools: ['Sensor Tower', 'Data.ai', 'Appfigures', 'Similarweb App Intelligence'],
    staleDays: 30, requireMin: 2,
    why: 'Install velocity over rolling windows reveals demand trajectory more cleanly than rank — rank fluctuates with category density. iOS/Android trends should agree.' },
  { id: 'reviews', label: 'Reviews & Sentiment', icon: CheckCircle2,
    tools: ['G2', 'Capterra', 'Trustpilot', 'App Store Reviews', 'Play Store Reviews', 'Product Hunt'],
    staleDays: 60,
    why: 'Review velocity is a proxy for active-customer growth; sentiment shift often precedes churn in lagging metrics.' },
  { id: 'search_social', label: 'Branded Search & Social', icon: Search,
    tools: ['Google Trends', 'LinkedIn Followers', 'X Followers', 'TikTok', 'YouTube', 'Instagram'],
    staleDays: 60,
    why: 'Branded search index removes paid distortion. Social follower velocity reveals organic mindshare independent of paid acquisition.' },
  { id: 'funding', label: 'Funding & Filings', icon: FileText,
    tools: ['Crunchbase', 'PitchBook', 'Dealroom', 'SEC Form D', 'Delaware Filings', 'USPTO'],
    staleDays: 180,
    why: 'Form D filings, trademark/patent activity, and director changes are the most reliable insider signals available without information rights.' },
  { id: 'press_founder', label: 'Press & Founder Activity', icon: Zap,
    tools: ['Tier-1 Press', 'Founder LinkedIn', 'Founder X', 'Podcasts', 'Conferences'],
    staleDays: 90,
    why: 'Founder posting cadence and tier-1 press timing reveals fundraising posture and momentum narrative the company is trying to project.' },
  { id: 'ad_library', label: 'Paid Acquisition Footprint', icon: Megaphone,
    tools: ['Meta Ad Library', 'TikTok Creative Center', 'Google Ads Transparency Center'],
    staleDays: 7, requireMin: 2,
    why: "A real-time read on the company's own paid-acquisition spend. Sustained ramps signal scaling CAC; sudden drops signal pause, pivot, or cash pressure." },
];
