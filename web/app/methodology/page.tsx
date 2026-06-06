import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/system/JsonLd";
import { SITE } from "@/lib/site";
import { methodologyJsonLd } from "@/lib/structured-data";
import { FINDINGS, HONEST_BROKER, LAYERS, RECON_NOTES } from "./methodology.data";
import styles from "./Methodology.module.css";

export const metadata: Metadata = {
  title: "Methodology - what the scan measures",
  description:
    "How Prompt Goblin measures technical hygiene, schema, AI visibility, accessibility, recon, and human-reviewed fixes without overclaiming citations.",
  alternates: { canonical: "/methodology" },
  openGraph: {
    type: "article",
    url: `${SITE.url}/methodology`,
    title: "Prompt Goblin methodology",
    description: "What the scan measures and what it does not claim.",
    images: ["/og-image.png"],
  },
};

const MethodologyPage = () => (
  <div className={styles.page}>
    {methodologyJsonLd().map((data, i) => (
      <JsonLd key={i} data={data} />
    ))}
    <header className={styles.hero}>
      <span className={styles.eyebrow}>./methodology</span>
      <h1>Exactly what the scan measures, and exactly what we will not promise.</h1>
      <p className={styles.lede}>
        Prompt Goblin is an AEO/GEO, technical SEO, and accessibility workflow. It
        measures crawlability, answer-engine citation gaps, static accessibility
        risks, and human-reviewed fix work. It does not promise a citation number.
      </p>
    </header>

    <section className={styles.section}>
      <span className={styles.kicker}>four layers</span>
      <h2>The scan stack</h2>
      <div className={styles.grid}>
        {LAYERS.map((layer) => (
          <article className={styles.card} key={layer.id}>
            <h3>{layer.name}</h3>
            <p>{layer.measures}</p>
            <p>{layer.finding}</p>
            <p className={styles.note}>{layer.honestNote}</p>
          </article>
        ))}
      </div>
    </section>

    <section className={styles.section}>
      <span className={styles.kicker}>finding meaning</span>
      <h2>Severity is a work queue, not theater</h2>
      <table className={styles.table}>
        <tbody>
          {FINDINGS.map(([level, meaning]) => (
            <tr key={level}>
              <td>{level}</td>
              <td>{meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>

    <section className={styles.section}>
      <span className={styles.kicker}>recon</span>
      <h2>The target is inferred, then reviewed</h2>
      <ul>
        {RECON_NOTES.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>

    <section className={styles.section}>
      <span className={styles.kicker}>human gate</span>
      <h2>Nothing auto-ships</h2>
      <p>
        Every recommendation halts for engineer review before a client sees it or
        a change reaches production. Reports can include code snippets, community
        drafts, and AI prompts, but the pipeline never posts, sends, deploys, or
        claims a pass without the matching evidence.
      </p>
    </section>

    <section className={styles.section}>
      <span className={styles.kicker}>honest broker</span>
      <h2>The limits are part of the product</h2>
      <ul>
        {HONEST_BROKER.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>

    <section className={styles.section}>
      <Link className="btn" href="/#scan">
        run the scan <span className="arr">-&gt;</span>
      </Link>
    </section>
  </div>
);

export default MethodologyPage;
