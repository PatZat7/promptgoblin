import { Fragment } from "react";
import { Panel } from "@/components/ui/Panel/Panel";
import styles from "./Marquee.module.css";

const WORDS = [
  "schema.org",
  "llms.txt",
  "crawlability",
  "structured data",
  "answer engines",
  "core web vitals",
  "entity SEO",
  "JSON-LD",
  "RAG-ready",
  "sitemaps",
  "Visible AF",
];

const Run = () => (
  <span>
    {WORDS.map((word) => (
      <Fragment key={word}>
        <span>{word}</span>
        <span className={styles.sep}>▪</span>
      </Fragment>
    ))}
  </span>
);

export const Marquee = () => (
  <Panel className={styles.marquee} cursor="./keywords">
    <div className={styles.track} aria-hidden="true">
      <Run />
      <Run />
      <Run />
    </div>
  </Panel>
);
