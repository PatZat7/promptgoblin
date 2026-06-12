import { Fragment } from "react";
import { Panel } from "@/components/ui/Panel/Panel";
import styles from "./Marquee.module.css";

const WORDS = [
  "AI search visibility",
  "cited by ChatGPT",
  "show up in Perplexity",
  "answer-engine ready",
  "get found by robots",
  "stay usable by humans",
  "llms.txt",
  "JSON-LD",
  "RAG-ready",
  "structured data",
  "entity SEO",
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
