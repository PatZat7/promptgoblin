"use client";

import {
  LEAD_STATUS_META,
  PIPELINE_COLUMNS,
  hygieneScoreLabel,
  type Lead,
  type LeadStatus,
} from "@/lib/leads-types";
import { TONE_CLASS } from "./StatusBadge";
import { PriorityDots } from "./PriorityDots";
import styles from "./crm.module.css";

function LeadCard({
  lead,
  selected,
  onSelect,
}: {
  lead: Lead;
  selected: boolean;
  onSelect: (lead: Lead) => void;
}) {
  const scoreText =
    typeof lead.hygieneScore === "number" ? `${lead.hygieneScore}/100` : hygieneScoreLabel(lead);
  return (
    <button
      type="button"
      className={styles.card}
      aria-pressed={selected}
      onClick={() => onSelect(lead)}
    >
      <div className={styles.cardTop}>
        <span className={styles.cardCompany}>{lead.companyName}</span>
        <PriorityDots value={lead.priority} />
      </div>
      <span className={styles.cardDomain}>{lead.domain}</span>
      <div className={styles.cardMeta}>
        <span className={styles.cardDomain}>{lead.contactName ?? "—"}</span>
        <span className={styles.cardDomain}>{scoreText}</span>
      </div>
    </button>
  );
}

export function LeadPipeline({
  leads,
  selectedId,
  onSelect,
}: {
  leads: Lead[];
  selectedId: string | null;
  onSelect: (lead: Lead) => void;
}) {
  const byStatus = new Map<LeadStatus, Lead[]>();
  for (const col of PIPELINE_COLUMNS) byStatus.set(col, []);
  // Leads in non-board statuses (scanning/skip) won't have a column; they're
  // still reachable via the table view's status filter.
  for (const lead of leads) {
    const bucket = byStatus.get(lead.status);
    if (bucket) bucket.push(lead);
  }

  return (
    <div className={styles.board}>
      {PIPELINE_COLUMNS.map((col) => {
        const meta = LEAD_STATUS_META[col];
        const items = byStatus.get(col) ?? [];
        return (
          <div key={col} className={styles.column}>
            <div className={`${styles.columnHead} ${TONE_CLASS[meta.tone]}`}>
              <span className={styles.columnTitle}>{meta.label}</span>
              <span className={styles.columnCount}>{items.length}</span>
            </div>
            <div className={styles.columnBody}>
              {items.length === 0 ? (
                <div className={styles.columnEmpty}>—</div>
              ) : (
                items.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    selected={lead.id === selectedId}
                    onSelect={onSelect}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
