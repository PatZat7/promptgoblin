import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { listFixes, getRunDetail } from "@/lib/dashboard-api";
import { FixQueue } from "@/components/dashboard/FixQueue";
import { SampleBadge } from "@/components/dashboard/SampleBadge";
import styles from "./Fixes.module.css";

export const metadata: Metadata = {
  title: "Fix queue · Prompt Goblin",
  robots: { index: false, follow: false },
};

type FixesPageProps = {
  params: Promise<{ runId: string }>;
};

const FixesPage = async ({ params }: FixesPageProps) => {
  const { runId } = await params;

  // Verify the run exists and is accessible (RLS + client ownership)
  const detail = await getRunDetail(runId);
  if (!detail) notFound();

  // Fetch fixes — snippet is stripped server-side for locked rows
  const fixes = await listFixes(runId);
  const isAllSample = fixes.every((f) => f.isSample);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/runs" className={styles.breadcrumbLink}>Runs</Link>
          <span className={styles.sep}>/</span>
          <Link href={`/runs/${runId}`} className={styles.breadcrumbLink}>
            {detail.summary.domain}
          </Link>
          <span className={styles.sep}>/</span>
          <span className={styles.breadcrumbCurrent}>Fix queue</span>
        </div>
        <h1 className={styles.title}>
          Fix queue
          {isAllSample && <SampleBadge label="illustrative data" />}
        </h1>
        <p className={styles.subtitle}>
          Recommendations ranked HIGH&rarr;LOW. A human reviews every fix before
          the snippet is released — locked fixes show no snippet and no copy
          button.
        </p>
      </header>

      {fixes.length === 0 ? (
        <p className={styles.emptyState}>
          No fixes yet for this run. They&apos;ll appear here once the pipeline has
          run and fixes have been submitted for review.
        </p>
      ) : (
        <FixQueue fixes={fixes} />
      )}
    </div>
  );
};

export default FixesPage;
