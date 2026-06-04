/** Single source of truth for site-wide constants (URLs, nav, pricing). */

export const SITE = {
  name: "Prompt Goblin",
  altName: "Prompt_Goblin",
  url: "https://promptgoblin.io",
  email: "goblins@promptgoblin.com",
  tagline: "Get found by robots. Stay usable by humans. Visible AF.",
  description:
    "A one-goblin shop in Chicago. AI search visibility and technical SEO that makes you Visible AF. Get found by robots. Stay usable by humans.",
  locality: "Chicago",
  region: "IL",
  country: "US",
  geo: { lat: "41.88", lon: "-87.63" },
} as const;

export type NavLink = { href: string; label: string };

export const NAV: NavLink[] = [
  { href: "#scan", label: "./scan" },
  { href: "#services", label: "./services" },
  { href: "#pricing", label: "./pricing" },
  { href: "#contact", label: "./summon" },
];

/** Flat-fee tiers — also feed the Offer / OfferCatalog structured data. */
export const TIERS = [
  { name: "Goblin Scout — one-time visibility audit", price: "2950" },
  { name: "Goblin Warband — monthly retainer", price: "4800" },
  { name: "Goblin Warlord — multi-brand retainer", price: "12500" },
] as const;
