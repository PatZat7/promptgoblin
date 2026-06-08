import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRunDetail } from "@/lib/dashboard-api";
import { getScanProofSignedUrl } from "@/lib/supabase/signed-urls";
import { CitationScorecard } from "@/components/dashboard/CitationScorecard";
import { YouVsCompetitor } from "@/components/dashboard/YouVsCompetitor";
import { PlatformBreakdown } from "@/components/dashboard/PlatformBreakdown";
import { IntegrityTally } from "@/components/dashboard/IntegrityTally";
import { ScanProofThumb } from "@/components/dashboard/ScanProofThumb";
import { EvalBadge } from "@/components/dashboard/EvalBadge";
import { SampleBadge } from "@/components/dashboard/SampleBadge";
import styles from "./RunDetail.module.css";

export const metadata: Metadata = {
  title: "Run detail · Prompt Goblin",
  robots: { index: false, follow: false },
};

type RunDetailPageProps = {
  params: Promise<{ runId: string }>;
};

const RunDetailPage = async ({ params }: RunDetailPageProps) => {
  const { runId } = await params;
  const detail = await getRunDetail(runId);

  if (!detail) notFound();

  // Mint signed URLs server-side — client never sees storage paths or service key
  const proofsWithUrls = await Promise.all(
    detail.proofs.map(async (proof) => ({
      ...proof,
      signedUrl: await getScanProofSignedUrl(proof.storagePath).catch(() => null),
    }))
  );

  const { summary, youVsCompetitor, byEngine, integrity, evalBadge, blindSpot } = detail;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            {summary.domain}
            {(summary.isSample || summary.mode !== "live") && (
              <SampleBadge
                label={summary.mode === "mock" ? "mock — not a real result" : "illustrative data"}
              />
            )}
          </h1>
          <EvalBadge status={evalBadge} />
        </div>
        <p className={styles.meta}>
          Run on{" "}
          {new Date(summary.generatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          · Mode: <span className={styles.modeBadge}>{summary.mode}</span>
        </p>
      </header>

      <div className={styles.grid}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Citation visibility</h2>
          <CitationScorecard run={summary} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>You vs competitors</h2>
          {blindSpot || summary.clientShare === null ? (
            <p className={styles.notMeasured} role="note">
              Your share couldn&apos;t be measured for this run
              {blindSpot ? " (blind spot)" : ""} — shown as not measured, never 0.
            </p>
          ) : (
            <YouVsCompetitor
              client={{ domain: summary.domain, share: summary.clientShare }}
              competitors={youVsCompetitor.filter((c) => c.domain !== summary.domain)}
            />
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Platform breakdown</h2>
          <PlatformBreakdown byEngine={byEngine} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Verification integrity</h2>
          <IntegrityTally {...integrity} />
        </section>
      </div>

      {proofsWithUrls.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Scan proof thumbnails</h2>
          <div className={styles.proofGrid}>
            {proofsWithUrls.map((proof, i) => (
              <ScanProofThumb
                key={i}
                signedUrl={proof.signedUrl}
                label={proof.label}
                width={proof.width}
                height={proof.height}
              />
            ))}
          </div>
        </section>
      )}

      {blindSpot && (
        <p className={styles.blindSpotNote}>
          Blind-spot notice: {blindSpot.detail}
        </p>
      )}

      <div className={styles.actions}>
        <Link href={`/runs/${runId}/fixes`} className={styles.fixQueueLink}>
          View fix queue &rarr;
        </Link>
        <Link href="/runs" className={styles.backLink}>
          &larr; All runs
        </Link>
      </div>
    </div>
  );
};

export default RunDetailPage;
