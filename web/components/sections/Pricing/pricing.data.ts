/**
 * Monthly tiers — cancel anytime, no questions asked.
 * Honest-broker: the guarantee covers the work, never a citation number.
 */

export type Tier = {
  key: string;
  name: string;
  who: string;
  price: string;
  interval: string;
  link: string;
  cta: string;
  desc: string;
  bullets: string[];
  featured?: boolean;
  tag?: string;
};

// LIVE monthly Payment Links — $997 / $3,500 / $9,500, regenerated 2026-06-05 to
// match the land-grab pricing (all recurring/month; Scout flipped one-time→monthly).
// The old one-time/$2,950 + $4,800 + $12,500 links are deactivated in Stripe.
export const STRIPE_LINKS = {
  scout: "https://buy.stripe.com/3cI5kE5VAc7U1MLfYj2go06",
  warband: "https://buy.stripe.com/14AdRaabQ4Fs3UT27t2go07",
  warlord: "https://buy.stripe.com/eVqaEYabQ1tg7756nJ2go08",
} as const;

export const TIERS: Tier[] = [
  {
    key: "scout",
    name: "Goblin Scout",
    who: "founders & solo operators",
    price: "997",
    interval: "/ mo",
    link: STRIPE_LINKS.scout,
    cta: "Hire a Scout",
    desc: "One daily pipeline run. Citation gaps, schema holes, and stack-specific fix code — delivered as a living report your team's AI can act on immediately.",
    bullets: [
      "Full LLM citation audit · 5 surfaces",
      "Schema + entity gap report",
      "Competitor citation diff (top 6)",
      "Ranked tech stack–specific fix queue · scored by impact × effort",
      "Stack-specific code snippets + AI-ready prompt for your team",
      "Bing Webmaster Tools submission guide",
      "Agent that refactors content to be crawlable, Q&A-shaped, structured",
      "Pipeline identifies where to earn mentions",
      "1 pipeline run / day",
      "60-min goblin office hour",
    ],
  },
  {
    key: "warband",
    name: "Goblin Warband",
    who: "scaleups w/ a marketing team",
    price: "3,500",
    interval: "/ mo",
    link: STRIPE_LINKS.warband,
    cta: "Summon Warband",
    featured: true,
    tag: "best value",
    desc: "The always-on agentic loop. Learns your brand, generates content, and tells you exactly where to post it. You approve — we execute.",
    bullets: [
      "Everything in Scout",
      "On-demand agentic re-runs",
      "Live visibility dashboard",
      "Pipeline learns your brand — generates content for posting + tells you where",
      "Citation-earning outreach campaigns — we run the work, measure the delta",
      "Schema + content PRs to your repo / CMS",
      "Slack w/ a real goblin · <24h SLA",
    ],
  },
  {
    key: "warlord",
    name: "Goblin Warlord",
    who: "agencies, ecomm, multi-brand",
    price: "9,500",
    interval: "/ mo",
    link: STRIPE_LINKS.warlord,
    cta: "Forge Warlord",
    desc: "Eight domains. One automated pipeline. Branding, marketing, analytics, and agentic content posting — human approval gated at every step.",
    bullets: [
      "Everything in Warband",
      "Up to 8 domains / brands or agentic workflow automations",
      "Customized agentic workflows — system-specific",
      "Branding, marketing + analytics worked into one automated pipeline",
      "Automated agentic content posting (human final approval)",
      "Dedicated retrieval mesh",
      "Quarterly strategy summit",
      "White-label deliverables",
      "Customization to your specific needs",
    ],
  },
];
