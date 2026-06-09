import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDashboardSeat } from "@/lib/dashboard-seat";
import { listApprovalQueue } from "@/lib/dashboard-api";

export const metadata: Metadata = {
  title: "Approvals · Prompt Goblin",
  robots: { index: false, follow: false },
};

export default async function ApprovalsPage() {
  const seat = await getDashboardSeat();
  if (!seat?.canReview) {
    redirect("/dashboard");
  }

  const queue = await listApprovalQueue();

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Approval UI</h1>
        <p style={{ color: "#888", margin: 0 }}>
          Pending fixes that still need human review before any snippet is released.
        </p>
      </header>

      {queue.length === 0 ? (
        <p style={{ color: "#ccc", margin: 0 }}>
          No pending items are waiting for review.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {queue.map((item) => (
            <article
              key={item.recommendationId}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 4,
                padding: 16,
                display: "grid",
                gap: 6,
                background: "var(--panel)",
              }}
            >
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", color: "#9ca3af" }}>
                <span>{item.domain}</span>
                <span>{item.kind}</span>
                <span>score {item.score}</span>
                <span>{item.status}</span>
              </div>
              <strong>{item.title}</strong>
              <Link href={`/runs/${item.runId}/fixes`} style={{ color: "var(--lime)" }}>
                Open fix queue
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
