import clsx from "clsx";
import { Panel, PanelBar } from "@/components/ui/Panel/Panel";
import { Reveal } from "@/components/ui/Reveal";
import { EngineDiagram } from "./EngineDiagram";
import styles from "./HowItWorks.module.css";

export const HowItWorks = () => (
  <Panel id="how-it-works" cursor="./engine">
    <PanelBar
      command="$ goblin engine --explain"
      note="self-healing · eval-gated · engineer-approved"
    />
    <div className={clsx("grid-lines", styles.grid)}>
      <Reveal className={styles.intro}>
        <span className={styles.kicker}>
          how it works · the engine under the hood
        </span>
        <h2 className={styles.heading}>How we actually move the needle</h2>
        <p className={styles.monoNote}>
          {"// automated system · software-engineer judgment · measurable results"}
        </p>
        <p className={styles.p}>
          Most SEO shops send you a PDF.{" "}
          <span className={styles.accent}>We run a system.</span>
        </p>
        <p className={styles.p}>
          Under the hood: one automated pipeline that finds gaps across
          answer-engine visibility, technical SEO, and accessibility, with
          bounded self-healing loops and an eval gate that proves a fix actually
          works before any engineer sees it. Then a software engineer reviews
          every recommended change. Then it ships to your repo or CMS. Then the
          system re-runs on a schedule and measures the delta.
        </p>
        <p className={styles.punch}>
          You see the gap. Then you watch it close.
        </p>
        <p className={styles.tech}>
          &quot;RAG pipeline&quot; and &quot;CI/CD eval gate&quot; are the
          accurate technical names for what runs. We surface them once for
          credibility, then translate them for everyone else.
        </p>
      </Reveal>
      <div>
        <EngineDiagram />
      </div>
    </div>
  </Panel>
);
