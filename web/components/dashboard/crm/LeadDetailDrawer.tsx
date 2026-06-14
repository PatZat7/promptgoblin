"use client";

import { useRef, useState, useTransition } from "react";
import {
  LEAD_STATUS_META,
  LEAD_STATUS_ORDER,
  PRIORITY_META,
  type Lead,
  type LeadStatus,
} from "@/lib/leads-types";
import {
  deleteLead,
  saveLeadDrafts,
  saveLeadNotes,
  setLeadFollowup,
  setLeadPriority,
  updateLeadStatus,
  type ActionResult,
} from "@/app/(dashboard)/crm/actions";
import { StatusBadge } from "./StatusBadge";
import { CopyButton } from "./CopyButton";
import { ScanReport } from "./ScanReport";
import { useDialogFocus } from "./useDialogFocus";
import styles from "./crm.module.css";

const SELF_SERVE_SCAN = "https://promptgoblin.io/#scan";
const CONNECT_NOTE_CAP = 300;

/** Quick stage transitions a human performs by hand, in order. */
const STAGE_ACTIONS: { status: LeadStatus; label: string }[] = [
  { status: "drafted", label: "Mark drafted" },
  { status: "connect_sent", label: "Connect sent" },
  { status: "connected", label: "Connected" },
  { status: "contacted", label: "DM sent" },
  { status: "replied", label: "Replied" },
  { status: "won", label: "Won" },
  { status: "lost", label: "Lost" },
];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** YYYY-MM-DD for <input type=date>, or "" when unset. */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t).toISOString().slice(0, 10);
}

export function LeadDetailDrawer({
  lead,
  onClose,
}: {
  lead: Lead;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ msg: string; err: boolean } | null>(null);

  // Local editable state (initialized once; the parent remounts via key={id}
  // when a different lead is selected, so these stay in sync with selection).
  const [connectNote, setConnectNote] = useState(lead.connectNote ?? "");
  const [dmDraft, setDmDraft] = useState(lead.dmDraft ?? "");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [followup, setFollowup] = useState(toDateInput(lead.nextFollowupAt));

  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus into the panel on open, trap Tab, Escape to close, restore focus on close.
  useDialogFocus(dialogRef, onClose);

  function run(action: () => Promise<ActionResult>, okMsg: string) {
    setFeedback(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok) setFeedback({ msg: okMsg, err: false });
      else setFeedback({ msg: res.error, err: true });
    });
  }

  const connectOver = connectNote.length > CONNECT_NOTE_CAP;

  return (
    <>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label={`Lead: ${lead.companyName}`}
        tabIndex={-1}
      >
        <header className={styles.drawerHead}>
          <div className={styles.drawerTitleWrap}>
            <h2 className={styles.drawerTitle}>{lead.companyName}</h2>
            <p className={styles.drawerSub}>{lead.domain}</p>
            <div style={{ marginTop: 6 }}>
              <StatusBadge status={lead.status} />
            </div>
          </div>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={onClose}
            aria-label="Close lead detail"
          >
            ✕
          </button>
        </header>

        <div className={styles.drawerBody}>
          {/* identity */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Contact</h3>
            {lead.headline && <p className={styles.muted} style={{ fontSize: "0.8125rem", margin: 0 }}>{lead.headline}</p>}
            <dl className={styles.kv}>
              <dt className={styles.kvKey}>Name</dt>
              <dd className={styles.kvVal}>{lead.contactName ?? "—"}</dd>
              <dt className={styles.kvKey}>Title</dt>
              <dd className={styles.kvVal}>{lead.contactTitle ?? "—"}</dd>
              <dt className={styles.kvKey}>LinkedIn</dt>
              <dd className={styles.kvVal}>
                {lead.linkedinUrl ? (
                  <a
                    className={styles.link}
                    href={lead.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open profile ↗
                  </a>
                ) : (
                  "—"
                )}
              </dd>
              <dt className={styles.kvKey}>Email</dt>
              <dd className={styles.kvVal}>
                {lead.email ? (
                  <span className={styles.rowActions}>
                    <a className={styles.link} href={`mailto:${lead.email}`}>{lead.email}</a>
                    {lead.emailStatus && (
                      <span className={styles.charCount}>({lead.emailStatus})</span>
                    )}
                    <CopyButton text={lead.email} label="Copy" />
                  </span>
                ) : (
                  "—"
                )}
              </dd>
              <dt className={styles.kvKey}>Phone</dt>
              <dd className={styles.kvVal}>
                {lead.phone ? (
                  <span className={styles.rowActions}>
                    <a className={styles.link} href={`tel:${lead.phone}`}>{lead.phone}</a>
                    <CopyButton text={lead.phone} label="Copy" />
                  </span>
                ) : (
                  "—"
                )}
              </dd>
              <dt className={styles.kvKey}>Location</dt>
              <dd className={styles.kvVal}>{lead.location ?? "—"}</dd>
              <dt className={styles.kvKey}>Competitor</dt>
              <dd className={styles.kvVal}>{lead.competitor ?? "—"}</dd>
              <dt className={styles.kvKey}>Segment</dt>
              <dd className={styles.kvVal}>{lead.icpSegment ?? "—"}</dd>
              <dt className={styles.kvKey}>Source</dt>
              <dd className={styles.kvVal}>{lead.source ?? "—"}</dd>
            </dl>
          </section>

          {/* scan */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Hygiene scan</h3>
            <ScanReport lead={lead} />
          </section>

          {/* connect note */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Connection-request note (cold opener)</h3>
            <div className={styles.draftBlock}>
              <div className={styles.draftHeadRow}>
                <span className={styles.charCount + (connectOver ? " " + styles.charCountOver : "")}>
                  {connectNote.length}/{CONNECT_NOTE_CAP}
                </span>
              </div>
              <label htmlFor="connect-note" className={styles.srOnly}>
                Connection-request note
              </label>
              <textarea
                id="connect-note"
                className={styles.textarea}
                value={connectNote}
                onChange={(e) => setConnectNote(e.target.value)}
                placeholder="Short ≤300-char opener. Sent by hand with the connection request."
              />
              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={`${styles.btn} dot-shimmer`}
                  disabled={isPending}
                  onClick={() => run(() => saveLeadDrafts(lead.id, { connectNote }), "Connect note saved.")}
                >
                  Save note
                </button>
                <CopyButton text={connectNote} label="Copy note" />
              </div>
            </div>
          </section>

          {/* DM draft */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Follow-up DM (after they accept)</h3>
            <div className={styles.draftBlock}>
              <label htmlFor="dm-draft" className={styles.srOnly}>
                Follow-up DM draft
              </label>
              <textarea
                id="dm-draft"
                className={styles.textarea}
                style={{ minHeight: 160 }}
                value={dmDraft}
                onChange={(e) => setDmDraft(e.target.value)}
                placeholder="Full DM, built from the real scan findings. Sent by hand after they connect."
              />
              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={`${styles.btn} dot-shimmer`}
                  disabled={isPending}
                  onClick={() => run(() => saveLeadDrafts(lead.id, { dmDraft }), "DM draft saved.")}
                >
                  Save DM
                </button>
                <CopyButton text={dmDraft} label="Copy DM" />
                <a className={styles.link} href={SELF_SERVE_SCAN} target="_blank" rel="noopener noreferrer">
                  Self-serve scan link ↗
                </a>
              </div>
              <p className={styles.honest}>
                Drafts only — nothing here sends. You copy, paste, and send by hand.
                Cite only what the scan actually found; never promise a citation number.
              </p>
            </div>
          </section>

          {/* pipeline */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Pipeline</h3>
            <label htmlFor="status-select" className={styles.srOnly}>
              Set status
            </label>
            <select
              id="status-select"
              className={styles.select}
              value={lead.status}
              disabled={isPending}
              onChange={(e) =>
                run(() => updateLeadStatus(lead.id, e.target.value), "Status updated.")
              }
            >
              {LEAD_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_META[s].label}
                </option>
              ))}
            </select>
            <div className={styles.stageRow}>
              {STAGE_ACTIONS.filter((a) => a.status !== lead.status).map((a) => (
                <button
                  key={a.status}
                  type="button"
                  className={styles.btn}
                  disabled={isPending}
                  onClick={() =>
                    run(() => updateLeadStatus(lead.id, a.status), `Moved to “${a.label}”.`)
                  }
                >
                  {a.label}
                </button>
              ))}
            </div>
          </section>

          {/* priority + follow-up */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Priority &amp; follow-up</h3>
            <div className={styles.kv}>
              <label className={styles.kvKey} htmlFor="priority-select">
                Priority
              </label>
              <div className={styles.kvVal}>
                <select
                  id="priority-select"
                  className={styles.select}
                  value={lead.priority}
                  disabled={isPending}
                  onChange={(e) =>
                    run(() => setLeadPriority(lead.id, Number(e.target.value)), "Priority updated.")
                  }
                >
                  {[0, 1, 2, 3].map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </option>
                  ))}
                </select>
              </div>
              <label className={styles.kvKey} htmlFor="followup-date">
                Follow up
              </label>
              <div className={styles.kvVal}>
                <div className={styles.rowActions}>
                  <input
                    id="followup-date"
                    type="date"
                    className={styles.field}
                    style={{ width: "auto" }}
                    value={followup}
                    onChange={(e) => setFollowup(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.btn}
                    disabled={isPending}
                    onClick={() =>
                      run(() => setLeadFollowup(lead.id, followup || null), "Follow-up saved.")
                    }
                  >
                    Save
                  </button>
                  {lead.nextFollowupAt && (
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost}`}
                      disabled={isPending}
                      onClick={() => {
                        setFollowup("");
                        run(() => setLeadFollowup(lead.id, null), "Follow-up cleared.");
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* notes */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Notes</h3>
            <label htmlFor="lead-notes" className={styles.srOnly}>
              Private notes
            </label>
            <textarea
              id="lead-notes"
              className={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private notes — context, reply history, next steps."
            />
            <div className={styles.rowActions}>
              <button
                type="button"
                className={`${styles.btn} dot-shimmer`}
                disabled={isPending}
                onClick={() => run(() => saveLeadNotes(lead.id, notes), "Notes saved.")}
              >
                Save notes
              </button>
            </div>
          </section>

          {/* timeline + delete */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Timeline</h3>
            <dl className={styles.kv}>
              <dt className={styles.kvKey}>Scanned</dt>
              <dd className={styles.kvVal}>{fmtDate(lead.scannedAt)}</dd>
              <dt className={styles.kvKey}>Connect sent</dt>
              <dd className={styles.kvVal}>{fmtDate(lead.connectSentAt)}</dd>
              <dt className={styles.kvKey}>Connected</dt>
              <dd className={styles.kvVal}>{fmtDate(lead.connectedAt)}</dd>
              <dt className={styles.kvKey}>DM sent</dt>
              <dd className={styles.kvVal}>{fmtDate(lead.contactedAt)}</dd>
              <dt className={styles.kvKey}>Replied</dt>
              <dd className={styles.kvVal}>{fmtDate(lead.repliedAt)}</dd>
              <dt className={styles.kvKey}>Added</dt>
              <dd className={styles.kvVal}>{fmtDate(lead.createdAt)}</dd>
            </dl>
            <div className={styles.rowActions} style={{ marginTop: 8 }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnDanger}`}
                disabled={isPending}
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.confirm(`Delete ${lead.companyName} from the CRM? This can't be undone.`)
                  ) {
                    run(async () => {
                      const res = await deleteLead(lead.id);
                      if (res.ok) onClose();
                      return res;
                    }, "Lead deleted.");
                  }
                }}
              >
                Delete lead
              </button>
            </div>
          </section>

          {feedback && (
            <p
              role="status"
              aria-live="polite"
              className={`${styles.status} ${feedback.err ? styles.statusErr : ""}`}
            >
              {feedback.msg}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
