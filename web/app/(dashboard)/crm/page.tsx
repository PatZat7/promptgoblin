import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDashboardSeat } from "@/lib/dashboard-seat";
import { getLeadStats, listLeads } from "@/lib/leads-api";
import {
  LEAD_STATUS_ORDER,
  type LeadSort,
  type LeadStatus,
  type LeadView,
} from "@/lib/leads-types";
import { LeadStatStrip } from "@/components/dashboard/crm/LeadStatStrip";
import { LeadWorkspace } from "@/components/dashboard/crm/LeadWorkspace";
import styles from "@/components/dashboard/crm/crm.module.css";

export const metadata: Metadata = {
  title: "Leads CRM · Prompt Goblin",
  robots: { index: false, follow: false },
};

const VALID_SORTS: LeadSort[] = ["recent", "priority", "score", "company"];

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // CRM is the operator's tool — gate it the same way /approvals is gated.
  const seat = await getDashboardSeat();
  if (!seat?.canReview) redirect("/dashboard");

  const sp = await searchParams;
  const pick = (k: string): string | undefined => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const statusRaw = pick("status");
  const status: LeadStatus | "all" =
    statusRaw && (LEAD_STATUS_ORDER as string[]).includes(statusRaw)
      ? (statusRaw as LeadStatus)
      : "all";
  const sortRaw = pick("sort");
  const sort: LeadSort = VALID_SORTS.includes(sortRaw as LeadSort)
    ? (sortRaw as LeadSort)
    : "recent";
  const q = (pick("q") ?? "").trim();
  const view: LeadView = pick("view") === "pipeline" ? "pipeline" : "table";

  const [stats, leads] = await Promise.all([
    getLeadStats(),
    listLeads({ status, q, sort }),
  ]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Leads CRM</h1>
          <p className={styles.subtitle}>
            First-sale outreach pipeline. Real Tier-1 hygiene scans, hand-sent
            outreach — nothing here messages or contacts a lead automatically.
          </p>
        </div>
      </header>

      <LeadStatStrip stats={stats} />

      <LeadWorkspace
        leads={leads}
        hasAnyLeads={stats.total > 0}
        view={view}
        status={status}
        q={q}
        sort={sort}
      />
    </div>
  );
}
