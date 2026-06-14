"use client";

import { useActionState, useEffect, useRef } from "react";
import { addLead, type ActionResult } from "@/app/(dashboard)/crm/actions";
import { useDialogFocus } from "./useDialogFocus";
import styles from "./crm.module.css";

export function AddLeadForm({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => addLead(formData),
    null
  );

  // Focus into the dialog on open, trap Tab, Escape to close, restore focus on close.
  useDialogFocus(dialogRef, onClose);

  useEffect(() => {
    if (state?.ok) onAdded();
  }, [state, onAdded]);

  return (
    <>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Add lead"
        tabIndex={-1}
      >
        <header className={styles.drawerHead}>
          <div className={styles.drawerTitleWrap}>
            <h2 className={styles.drawerTitle}>Add lead</h2>
            <p className={styles.drawerSub}>Stored in your owner-scoped CRM (Supabase).</p>
          </div>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={onClose}
            aria-label="Close add-lead form"
          >
            ✕
          </button>
        </header>

        <form action={formAction} className={styles.drawerBody}>
          <div className={styles.formGrid}>
            <div className={`${styles.formField} ${styles.full}`}>
              <label className={styles.label} htmlFor="al-company">
                Company <span className={styles.req}>*</span>
              </label>
              <input id="al-company" name="company_name" className={styles.field} required />
            </div>
            <div className={`${styles.formField} ${styles.full}`}>
              <label className={styles.label} htmlFor="al-domain">
                Domain <span className={styles.req}>*</span>
              </label>
              <input
                id="al-domain"
                name="domain"
                className={styles.field}
                placeholder="acme.com"
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label} htmlFor="al-name">Contact name</label>
              <input id="al-name" name="contact_name" className={styles.field} />
            </div>
            <div className={styles.formField}>
              <label className={styles.label} htmlFor="al-title">Contact title</label>
              <input id="al-title" name="contact_title" className={styles.field} />
            </div>
            <div className={`${styles.formField} ${styles.full}`}>
              <label className={styles.label} htmlFor="al-linkedin">LinkedIn URL</label>
              <input
                id="al-linkedin"
                name="linkedin_url"
                type="url"
                className={styles.field}
                placeholder="https://linkedin.com/in/…"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label} htmlFor="al-competitor">Competitor</label>
              <input id="al-competitor" name="competitor" className={styles.field} placeholder="rival.com" />
            </div>
            <div className={styles.formField}>
              <label className={styles.label} htmlFor="al-segment">Segment</label>
              <input id="al-segment" name="icp_segment" className={styles.field} />
            </div>
            <div className={styles.formField}>
              <label className={styles.label} htmlFor="al-source">Source</label>
              <input id="al-source" name="source" className={styles.field} placeholder="referral, list…" />
            </div>
            <div className={styles.formField}>
              <label className={styles.label} htmlFor="al-priority">Priority</label>
              <select id="al-priority" name="priority" className={styles.select} defaultValue="0">
                <option value="0">Normal</option>
                <option value="1">Watch</option>
                <option value="2">Warm</option>
                <option value="3">Hot</option>
              </select>
            </div>
          </div>

          <div className={styles.rowActions}>
            <button type="submit" className={`${styles.btn} dot-shimmer`} disabled={pending}>
              {pending ? "Adding…" : "Add lead"}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </button>
          </div>

          {state && !state.ok && (
            <p role="status" aria-live="polite" className={`${styles.status} ${styles.statusErr}`}>
              {state.error}
            </p>
          )}
        </form>
      </div>
    </>
  );
}
