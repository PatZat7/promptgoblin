import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { JsonLd } from "@/components/system/JsonLd";
import { faqPageJsonLd } from "@/lib/structured-data";
import { FAQ } from "@/lib/faq";

export const metadata: Metadata = {
  title: "FAQ · Prompt Goblin",
  description:
    "Plain answers about AEO/GEO, schema, pricing, and how the work ships.",
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
  <>
    {faqPageJsonLd().map((d, i) => <JsonLd key={i} data={d} />)}
    <div className="os">
      <section>
        <h1>FAQ</h1>
        <p>
          Schema and llms.txt are hygiene, not a citation lever. Real levers are
          brand mentions and Bing ranking.
        </p>

        <dl>
          {FAQ.map((item) => (
            <div key={item.q} style={{ marginBottom: "1.4em" }}>
              <dt style={{ fontWeight: 700 }}>{item.q}</dt>
              <dd style={{ marginTop: "0.4em", marginLeft: "1.2em" }}>{item.a}</dd>
            </div>
          ))}
        </dl>

        <h2>Learn more</h2>
        <ul>
          <li><a href="/learn/aeo-vs-geo">AEO vs GEO — what the terms mean and what actually predicts citation</a></li>
          <li><a href="/learn/how-to-show-up-in-chatgpt">How to show up in ChatGPT — the three levers</a></li>
          <li><a href="/learn/bing-rank-and-ai-citations">Bing rank and AI citations</a></li>
        </ul>
      </section>
    </div>
  </>
);

export default FaqPage;
