import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ · Prompt Goblin",
  description:
    "Plain answers about AEO/GEO, schema, pricing, and the work guarantee.",
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/faq`,
    title: "Prompt Goblin FAQ",
    description:
      "Plain answers about AI search visibility, technical SEO, pricing, and what we will not promise.",
    images: ["/og-image.png"],
  },
};

const FaqPage = () => (
  <div className="os">
    <section>
      <h1>FAQ</h1>
      <p>
        Schema and llms.txt are hygiene, not a citation lever. Real levers are
        brand mentions and Bing ranking.
      </p>
      <ul>
        <li>We measure the gap and ship human-reviewed fixes.</li>
        <li>The refund guarantees the work, not a citation number.</li>
        <li>Pricing is monthly: Scout $997, Warband $3,500, Warlord $9,500.</li>
      </ul>
    </section>
  </div>
);

export default FaqPage;
