import type { Metadata } from "next";
import { listRuns, SAMPLE_RUN_SUMMARY } from "@/lib/dashboard-api";
import { RunHistoryTable } from "@/components/dashboard/RunHistoryTable";
import { SampleBadge } from "@/components/dashboard/SampleBadge";
import styles from "./Dashboard.module.css";

export const metadata: Metadata = {
  title: "Dashboard · Prompt Goblin",
  robots: { index: false, follow: false },
};

const DashboardPage = async () => {
  // In the MVP a user owns one client; list all runs for it.
  // When no clientId is known (pre-DB), fall back to sample data.
  let runs = await listRuns("__none__").catch(() => []);

  const isAllSample = runs.length === 0;
  if (isAllSample) {
    runs = [SAMPLE_RUN_SUMMARY];
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Overview{" "}
          {isAllSample && (
            <SampleBadge label="no real runs yet — illustrative data" />
          )}
        </h1>
        <p className={styles.subtitle}>
          Latest scan runs for your domain. Each row shows your measured share
          of answer-engine citations and the delta vs the prior run.
        </p>
      </header>

      <RunHistoryTable runs={runs} />

      {isAllSample && (
        <p className={styles.sampleNote}>
          This table shows illustrative{" "}
          <strong>[sample]</strong> data. Real results will appear here once your
          first scan run is complete and approved.
        </p>
      )}
    </div>
  );
};

export default DashboardPage;
