"use client";

import { useCallback, useState } from "react";
import type { Lead, LeadSort, LeadStatus, LeadView } from "@/lib/leads-types";
import { LeadToolbar } from "./LeadToolbar";
import { LeadTable } from "./LeadTable";
import { LeadPipeline } from "./LeadPipeline";
import { LeadDetailDrawer } from "./LeadDetailDrawer";
import { AddLeadForm } from "./AddLeadForm";
import styles from "./crm.module.css";

type LeadWorkspaceProps = {
  leads: Lead[];
  hasAnyLeads: boolean;
  view: LeadView;
  status: LeadStatus | "all";
  q: string;
  sort: LeadSort;
};

export function LeadWorkspace({
  leads,
  hasAnyLeads,
  view,
  status,
  q,
  sort,
}: LeadWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const onSelect = useCallback((lead: Lead) => setSelectedId(lead.id), []);
  const closeDrawer = useCallback(() => setSelectedId(null), []);
  const openAdd = useCallback(() => setAddOpen(true), []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  const selected = leads.find((l) => l.id === selectedId) ?? null;

  return (
    <div className={styles.workspace}>
      <LeadToolbar status={status} q={q} sort={sort} view={view} onAdd={openAdd} />

      {leads.length === 0 ? (
        hasAnyLeads ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No leads match these filters</p>
            <p className={styles.emptyText}>Try clearing the search or status filter.</p>
          </div>
        ) : (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No leads yet</p>
            <p className={styles.emptyText}>
              Add one by hand, or bulk-import a file you built yourself with{" "}
              <span className={styles.code}>node scripts/import-local-leads.mjs</span>, then enrich
              with real hygiene scans via{" "}
              <span className={styles.code}>node scripts/process-leads.mjs</span>.
            </p>
            <button type="button" className={`${styles.btn} dot-shimmer`} onClick={openAdd}>
              + Add your first lead
            </button>
          </div>
        )
      ) : view === "pipeline" ? (
        <LeadPipeline leads={leads} selectedId={selectedId} onSelect={onSelect} />
      ) : (
        <LeadTable leads={leads} selectedId={selectedId} onSelect={onSelect} />
      )}

      {selected && (
        <LeadDetailDrawer key={selected.id} lead={selected} onClose={closeDrawer} />
      )}

      {addOpen && <AddLeadForm onClose={closeAdd} onAdded={closeAdd} />}
    </div>
  );
}
