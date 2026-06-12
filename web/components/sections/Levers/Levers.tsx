import { Panel, PanelBar } from "@/components/ui/Panel/Panel";
import { LEVERS } from "./levers.data";
import styles from "./Levers.module.css";

/**
 * "The three levers" — the causal model in plain English.
 *
 * Server Component (no client island needed — pure static content, no
 * interactivity, no animation). Reduced-motion: nothing to opt out of.
 *
 * Honest-broker invariants baked into the copy:
 * - Schema = hygiene, not a citation lever.
 * - JS-only pages are invisible to crawlers.
 * - We promise the work + the measurement, never a citation count.
 */
export const Levers = () => (
  <Panel id="levers" cursor="goblin.levers">
    <PanelBar
      command="$ goblin explain --levers"
      note="what actually moves citation · honest model"
    />
    <div className={styles.inner}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>causal model</p>
        <h2 className={styles.heading}>Three things that actually change AEO</h2>
        <p className={styles.subhead}>
          Most &ldquo;AI visibility&rdquo; advice is vibes or schema cargo-culting. Here is the
          mechanical model: what answer engines retrieve from, why, and how the pipeline moves
          each lever. No citation-count promises.
        </p>
      </header>

      <ol className={styles.grid} aria-label="The three AEO levers">
        {LEVERS.map((lever) => (
          <li key={lever.num} className={styles.lever}>
            <div className={styles.leverHead}>
              <span className={styles.leverNum}>{lever.num}</span>
              <span className={styles.leverTag} aria-hidden="true">
                {lever.tag}
              </span>
            </div>
            <h3 className={styles.leverTitle}>{lever.headline}</h3>
            <p className={styles.leverBody}>{lever.body}</p>

            <div className={styles.pipeline}>
              <p className={styles.pipelineLabel}>how goblin moves it</p>
              <p className={styles.pipelineText}>{lever.pipeline}</p>
            </div>

            <p className={styles.caveat}>{lever.caveat}</p>
          </li>
        ))}
      </ol>

      <div className={styles.schemaNote} role="note" aria-label="Schema hygiene note">
        <span className={styles.schemaNoteMark}>schema note</span>
        <p className={styles.schemaNoteText}>
          Structured data (JSON-LD / schema.org) is <strong>parse hygiene</strong> — it helps
          crawlers label what a page is. It does not cause citations. The real levers are
          above. We add accurate schema as part of the technical baseline; we will never tell
          you schema alone will get you cited.
        </p>
      </div>
    </div>
  </Panel>
);
