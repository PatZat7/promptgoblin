import type { FixRow } from "@/lib/dashboard-types";
import { FixCard } from "./FixCard";
import styles from "./FixQueue.module.css";

type FixQueueProps = {
  fixes: FixRow[];
};

/**
 * Fix queue — HIGH→LOW by score (accessor already sorted).
 * Groups by engine_lane only when that field is present (forward-compat
 * with the per-platform-rec-tagging spec).
 *
 * Lock logic: FixCard derives lock state from snippet === null.
 * The snippet was stripped server-side; no locked snippet exists in the payload.
 */
export function FixQueue({ fixes }: FixQueueProps) {
  // Check whether any fix has an engine_lane set — only then group
  const hasLanes = fixes.some((f) => f.engineLane && f.engineLane !== "both");

  if (!hasLanes) {
    return (
      <div className={styles.list}>
        {fixes.map((fix) => (
          <FixCard key={fix.fixId} fix={fix} />
        ))}
      </div>
    );
  }

  // Group by lane
  const lanes: Record<string, FixRow[]> = {};
  for (const fix of fixes) {
    const lane = fix.engineLane ?? "both";
    if (!lanes[lane]) lanes[lane] = [];
    lanes[lane].push(fix);
  }

  const laneOrder = ["chatgpt", "google_aio", "both"];
  const laneLabels: Record<string, string> = {
    chatgpt: "ChatGPT",
    google_aio: "Google AIO",
    both: "All platforms",
  };

  return (
    <div className={styles.lanes}>
      {laneOrder
        .filter((lane) => lanes[lane]?.length)
        .map((lane) => (
          <section key={lane} className={styles.laneSection}>
            <h2 className={styles.laneTitle}>{laneLabels[lane] ?? lane}</h2>
            <div className={styles.list}>
              {lanes[lane].map((fix) => (
                <FixCard key={fix.fixId} fix={fix} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
