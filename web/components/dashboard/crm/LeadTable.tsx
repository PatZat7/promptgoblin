"use client";

import { hygieneScoreLabel, type Lead } from "@/lib/leads-types";
import { StatusBadge } from "./StatusBadge";
import { PriorityDots } from "./PriorityDots";
import styles from "./crm.module.css";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ScoreCell({ lead }: { lead: Lead }) {
  if (typeof lead.hygieneScore === "number") {
    return <span className={styles.scoreNum}>{lead.hygieneScore}</span>;
  }
  if (lead.status === "new") {
    return <span className={styles.scoreNew}>—</span>;
  }
  // Honest blind spot — never a 0.
  return <span className={styles.scoreBlind}>{hygieneScoreLabel(lead)}</span>;
}

export function LeadTable({
  leads,
  selectedId,
  onSelect,
}: {
  leads: Lead[];
  selectedId: string | null;
  onSelect: (lead: Lead) => void;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>
          Leads — select a row to open its detail panel
        </caption>
        <thead>
          <tr>
            <th scope="col">Company</th>
            <th scope="col">Contact</th>
            <th scope="col">Status</th>
            <th scope="col" className={styles.numCol}>Hygiene</th>
            <th scope="col" className={styles.numCol}>Priority</th>
            <th scope="col" className={styles.numCol}>Activity</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className={`${styles.row} ${lead.id === selectedId ? styles.rowSelected : ""}`}
              onClick={() => onSelect(lead)}
            >
              <td className={styles.cell}>
                <button
                  type="button"
                  className={styles.company}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", color: "inherit", textAlign: "left" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(lead);
                  }}
                >
                  {lead.companyName}
                </button>
                <div className={styles.domain}>{lead.domain}</div>
              </td>
              <td className={styles.cell}>
                <div className={styles.contact}>{lead.contactName ?? "—"}</div>
                {lead.contactTitle && <div className={styles.domain}>{lead.contactTitle}</div>}
              </td>
              <td className={styles.cell}>
                <StatusBadge status={lead.status} />
              </td>
              <td className={`${styles.cell} ${styles.numCol}`}>
                <ScoreCell lead={lead} />
              </td>
              <td className={`${styles.cell} ${styles.numCol}`}>
                <PriorityDots value={lead.priority} />
              </td>
              <td className={`${styles.cell} ${styles.numCol}`}>
                {fmtDate(lead.lastActivityAt ?? lead.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
