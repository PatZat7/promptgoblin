import { Panel, PanelBar } from "@/components/ui/Panel/Panel";
import { MeshCanvas } from "./MeshCanvas";
import { MESH_STEPS } from "./mesh.data";
import styles from "./GoblinMesh.module.css";

/**
 * Server-rendered section. Only the animated <MeshCanvas> hydrates on the
 * client — the panel bar and the numbered step list are static HTML.
 */
export const GoblinMesh = () => (
  <Panel id="mesh" cursor="goblin.graph">
    <PanelBar command="$ goblin graph --run" note="langgraph workflow · engineer-gated · sample run" />
    <div className={styles.grid}>
      <MeshCanvas />
      <ol className={styles.steps}>
        {MESH_STEPS.map((step) => (
          <li key={step.num} className={styles.step}>
            <div className={styles.stepNumber}>{step.num}</div>
            <div>
              <div className={styles.stepTitle}>{step.title}</div>
              <div className={styles.stepDescription}>{step.description}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  </Panel>
);
