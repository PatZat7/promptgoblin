import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/system/JsonLd";
import { SITE } from "@/lib/site";
import { aeoGeoJsonLd } from "@/lib/structured-data";
import { DEFINITIONS, PREDICTORS, SOURCES } from "./aeo-geo.data";
import styles from "./AeoVsGeo.module.css";

export const metadata: Metadata = {
  title: "AEO vs GEO - the difference and what gets cited",
  description:
    "Answer Engine Optimization vs Generative Engine Optimization: the zero-click shift, what gets cited, and why Prompt Goblin measures rather than promises.",
  alternates: { canonical: "/learn/aeo-vs-geo" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/learn/aeo-vs-geo`,
    title: "AEO vs GEO",
    description: "The practical distinction between answer extraction and citation measurement.",
    images: ["/og-image.png"],
  },
};

const AeoVsGeoPage = () => (
  <div className={styles.page}>
    {aeoGeoJsonLd().map((data, i) => (
      <JsonLd key={i} data={data} />
    ))}
    <header className={styles.hero}>
      <span className={styles.eyebrow}>./learn/aeo-vs-geo</span>
      <h1>AEO gets you extractable. GEO checks whether you get cited.</h1>
      <p className={styles.lede}>
        Classic SEO asks where you rank. AEO asks whether an answer engine can
        extract the answer. GEO asks whether generated summaries cite you, your
        competitor, or a third-party platform instead.
      </p>
    </header>

    <section className={styles.section}>
      <div className={styles.defs}>
        {DEFINITIONS.map((item) => (
          <article className={styles.def} key={item.term}>
            <span className={styles.sourceTag}>{item.term}</span>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>

    <section className={styles.section}>
      <h2>Why it changed</h2>
      <p>
        AI answers compress the result page. Seer Interactive reported organic
        CTR of 0.84% when AI Overviews appeared versus 2.94% without them in its
        study window. That does not mean every query behaves the same way. It
        means click-through and citation visibility must be measured directly.
      </p>
    </section>

    <section className={styles.section}>
      <h2>What predicts citation</h2>
      <ul>
        {PREDICTORS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>
        These are structural correlations and work items, not guarantees. The
        safe loop is measure, fix, wait, and re-run.
      </p>
    </section>

    <section className={styles.section}>
      <h2>Sourced stats</h2>
      <table className={styles.sourceTable}>
        <thead>
          <tr>
            <th>Claim</th>
            <th>Value</th>
            <th>Source</th>
            <th>As of</th>
          </tr>
        </thead>
        <tbody>
          {SOURCES.map((source) => (
            <tr key={source.id}>
              <td>{source.claim}</td>
              <td>{source.value}</td>
              <td>
                <a href={source.url}>{source.source}</a>
              </td>
              <td>{source.asOf}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>

    <section className={styles.section}>
      <h2>How Prompt Goblin uses it</h2>
      <p>
        We scan the answer surface, verify what can be verified, label what is
        unverifiable, and send human-reviewed work through the queue. Schema and
        llms.txt help crawlers parse the site; brand mentions, Bing overlap, and
        source-worthy content are the citation work.
      </p>
      <Link className="btn" href="/methodology">
        read the methodology <span className="arr">-&gt;</span>
      </Link>
    </section>
  </div>
);

export default AeoVsGeoPage;
