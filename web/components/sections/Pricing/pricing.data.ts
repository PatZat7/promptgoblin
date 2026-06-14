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
  // Set after running `node web/scripts/create-watch-product.mjs` (it prints the
  // Payment Link). Until then the Watch CTA falls back to the contact form.
  watch: "https://buy.stripe.com/9B65kE5VAgoacrp8vR2go09",
  scout: "https://buy.stripe.com/3cI5kE5VAc7U1MLfYj2go06",
  warband: "https://buy.stripe.com/14AdRaabQ4Fs3UT27t2go07",
  warlord: "https://buy.stripe.com/eVqaEYabQ1tg7756nJ2go08",
} as const;

// ---------------------------------------------------------------------------
// Feature comparison matrix — rendered as a semantic <table> below the cards.
// HONEST-BROKER: do NOT modify these cells without owner review. If a value
// seems wrong, add a comment here and leave the cell as-is.
// Columns map to TIERS keys: watch | scout | warband | warlord
// ---------------------------------------------------------------------------

export type ComparisonCell = boolean | string;
export type ComparisonRow = {
  label: string;
  watch: ComparisonCell;
  scout: ComparisonCell;
  warband: ComparisonCell;
  warlord: ComparisonCell;
};

export const COMPARISON: ComparisonRow[] = [
  {
    label: "Weekly citation-visibility tracking",
    watch: true,
    scout: true,
    warband: true,
    warlord: true,
  },
  {
    label: "Answer engines tracked",
    watch: "4 + Bing",
    scout: "4 + Bing",
    warband: "4 + Bing",
    warlord: "4 + Bing",
  },
  {
    label: "Full LLM citation audit + competitor leaderboard",
    watch: false,
    scout: true,
    warband: true,
    warlord: true,
  },
  {
    label: "Engineer-reviewed fix queue (scored impact × effort)",
    watch: false,
    scout: true,
    warband: true,
    warlord: true,
  },
  {
    label: "Done-for-you content refactor (your brand voice)",
    watch: false,
    scout: true,
    warband: true,
    warlord: true,
  },
  {
    label: "Schema + content PRs to your repo / CMS",
    watch: false,
    scout: false,
    warband: true,
    warlord: true,
  },
  {
    label: "Pipeline runs",
    // NOTE: watch has no pipeline runs listed in bullets; "—" means not applicable
    watch: "—",
    scout: "1 / day",
    warband: "on-demand",
    warlord: "on-demand",
  },
  {
    label: "Live visibility dashboard",
    watch: false,
    scout: false,
    warband: true,
    warlord: true,
  },
  {
    label: "Citation-earning outreach (we run it)",
    watch: false,
    // NOTE: scout has "spots where" — pipeline identifies locations but does
    // not run the outreach itself; leave exactly as specified.
    scout: "spots where",
    warband: true,
    warlord: true,
  },
  {
    label: "Direct Slack · <24h SLA",
    watch: false,
    scout: false,
    warband: true,
    warlord: true,
  },
  {
    label: "Domains / brands",
    watch: "1",
    scout: "1",
    warband: "1",
    warlord: "up to 8",
  },
  {
    label: "Custom agentic workflows · white-label",
    watch: false,
    scout: false,
    warband: false,
    warlord: true,
  },
];

export const TIERS: Tier[] = [
  {
    key: "watch",
    name: "Goblin Watch",
    who: "see where you stand, weekly",
    price: "99",
    interval: "/ mo",
    link: STRIPE_LINKS.watch,
    cta: "Start watching",
    tag: "new",
    desc: "Your AI citation visibility, tracked every week across the major answer engines — with what's missing and whether you're gaining ground. Monitoring, not done-for-you fixes (that's Scout+).",
    bullets: [
      "Weekly citation-visibility report",
      "ChatGPT · Claude · Gemini · Perplexity + your Bing rank",
      "Ranked what's-missing list",
      "Week-over-week deltas — are you gaining ground?",
    ],
  },
  {
    key: "scout",
    name: "Goblin Scout",
    who: "founders & solo operators",
    price: "997",
    interval: "/ mo",
    link: STRIPE_LINKS.scout,
    cta: "Hire a Scout",
    desc: "Month one is your AI Search Visibility Diagnostic: citation gaps, who's getting cited instead of you, and a ranked, engineer-reviewed fix queue — delivered as a living report your team can act on immediately. Then we work the fixes.",
    bullets: [
      "Full LLM citation audit · 4 engines + Bing rank",
      "Schema + entity gap report",
      "Competitor leaderboard (top 6)",
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
