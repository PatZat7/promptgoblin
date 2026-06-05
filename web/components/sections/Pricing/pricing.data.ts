/**
 * Flat-fee tiers → live Stripe Payment Links (no backend). Honest-broker:
 * the guarantee covers the work, never a citation number.
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

export const STRIPE_LINKS = {
  scout: "https://buy.stripe.com/5kQeVeabQ1tg0IH7rN2go03",
  warband: "https://buy.stripe.com/dRmcN6bfU5JwezxeUf2go04",
  warlord: "https://buy.stripe.com/14A5kE97MdbY3UT3bx2go05",
} as const;

export const TIERS: Tier[] = [
  {
    key: "scout",
    name: "Goblin Scout",
    who: "founders & solo operators",
    price: "2,950",
    interval: "one-time",
    link: STRIPE_LINKS.scout,
    cta: "Hire a Scout",
    desc: "A 5-surface visibility audit that ships reviewed fixes, not a PDF. Headlined by your citation-graph diff vs a named competitor.",
    bullets: [
      "Full LLM citation audit · 5 surfaces",
      "Schema + entity gap report",
      "Competitor citation diff (top 6)",
      "Ranked fix queue · scored by impact × effort",
      "60-min goblin office hour",
    ],
  },
  {
    key: "warband",
    name: "Goblin Warband",
    who: "scaleups w/ a marketing team",
    price: "4,800",
    interval: "/ mo",
    link: STRIPE_LINKS.warband,
    cta: "Summon Warband",
    featured: true,
    tag: "best value",
    desc: "The recurring agentic loop. We run the graph and ship the reviewed PRs. You approve.",
    bullets: [
      "Everything in Scout",
      "Weekly agentic re-runs",
      "Citation-acquisition campaigns",
      "Schema + content PRs to your repo / CMS",
      "Slack w/ a real goblin · <24h SLA",
      "Live visibility dashboard",
    ],
  },
  {
    key: "warlord",
    name: "Goblin Warlord",
    who: "agencies, ecomm, multi-brand",
    price: "12,500",
    interval: "/ mo",
    link: STRIPE_LINKS.warlord,
    cta: "Forge Warlord",
    desc: "White-label the goblin. Multi-domain, custom graph, dedicated strategist.",
    bullets: [
      "Everything in Warband",
      "Up to 8 domains / brands",
      "Custom LangGraph workflows",
      "Dedicated retrieval mesh",
      "Quarterly strategy summit",
      "White-label deliverables",
    ],
  },
];
