import type { CSSProperties } from "react";
import clsx from "clsx";
import { Panel, PanelBar } from "@/components/ui/Panel/Panel";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./IndexNow.module.css";

const NOW_ROWS = [
  { key: "Open", value: <>taking 3 clients · <em>Q3–Q4 26</em></> },
  { key: "Building", value: "an llms.txt linter" },
  { key: "Crawling", value: "my own graph + demo targets" },
  { key: "Reading", value: "Google QRG, again" },
  { key: "Based", value: "Logan Square, CHI" },
];

const STATEMENT_LINES: { text: React.ReactNode; delay: string }[] = [
  { text: <>I make sites <em>legible</em></>, delay: "0s" },
  { text: "to crawlers and LLMs —", delay: ".07s" },
  { text: <>so you show up <em>where</em></>, delay: ".14s" },
  { text: "the answer gets written.", delay: ".21s" },
];

export const IndexNow = () => (
  <Panel id="index" cursor="./now">
    <PanelBar command="index · now" note="$ goblin status" />
    <div className={clsx("grid-lines", styles.grid)}>
      <div className={styles.left}>
        <div className={styles.heading}>// now</div>
        {NOW_ROWS.map((row) => (
          <div className={styles.nowRow} key={row.key}>
            <span className={styles.nowKey}>{row.key}</span>
            <span className={styles.nowVal}>{row.value}</span>
          </div>
        ))}
      </div>

      <Reveal className={styles.right}>
        <div className={styles.statement}>
          {STATEMENT_LINES.map((line, i) => (
            <p className="line-mask" key={i}>
              <span style={{ "--d": line.delay } as CSSProperties}>{line.text}</span>
            </p>
          ))}
        </div>
        <div className={styles.body}>
          Two years deep in technical SEO and the new world of answer engines. I ship{" "}
          <em>schema</em>, fix <em>crawl paths</em>, write the <em>llms.txt</em>, and harden Core Web
          Vitals — small, urgent jobs that a big agency would scope into a quarter. I move in days
          and leave you a test suite.
        </div>
      </Reveal>
    </div>
  </Panel>
);
