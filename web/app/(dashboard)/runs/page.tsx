import type { Metadata } from "next";
import { listRuns, SAMPLE_RUN_SUMMARY } from "@/lib/dashboard-api";
import { RunHistoryTable } from "@/components/dashboard/RunHistoryTable";
import { SampleBadge } from "@/components/dashboard/SampleBadge";
import styles from "./Runs.module.css";

export const metadata: Metadata = {
  title: "Runs · Prompt Goblin",
  robots: { index: false, follow: false },
};

const RunsPage = async () => {
  let runs = await listRuns("__none__").catch(() => []);

  const isAllSample = runs.length === 0;
  if (isAllSample) {
    runs = [SAMPLE_RUN_SUMMARY];
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Run history{" "}
          {isAllSample && <SampleBadge label="illustrative data" />}
        </h1>
        <p className={styles.subtitle}>
          Every approved scan run for your domain, newest first. Each row shows
          your measured visibility share and the delta vs the prior run.
        </p>
      </header>

      <RunHistoryTable runs={runs} />

      {isAllSample && (
        <p className={styles.sampleNote}>
          Showing <strong>[sample]</strong> data — no real runs yet. Results
          will populate here once your first approved scan is complete.
        </p>
      )}
    </div>
  );
};

export default RunsPage;
