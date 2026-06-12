"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Onboarding.module.css";

type StepId = "run-scan" | "review-fixes" | "approve-ship";

type Step = {
  id: StepId;
  number: number;
  label: string;
  description: string;
  actionLabel: string;
  actionHref: string;
};

const STEPS: Step[] = [
  {
    id: "run-scan",
    number: 1,
    label: "Run your first scan",
    description: "Point Goblin at your domain to measure your answer-engine citation share.",
    actionLabel: "Run scan",
    actionHref: "/dashboard",
  },
  {
    id: "review-fixes",
    number: 2,
    label: "Review the fix queue",
    description: "See the prioritised list of content and structure fixes the pipeline surfaced.",
    actionLabel: "Open runs",
    actionHref: "/runs",
  },
  {
    id: "approve-ship",
    number: 3,
    label: "Approve & ship",
    description: "Human-review each fix before it ships — nothing auto-deploys without your sign-off.",
    actionLabel: "Go to approvals",
    actionHref: "/approvals",
  },
];

const STORAGE_KEY = "pg:onboarding:dismissed";
const COMPLETED_KEY = "pg:onboarding:completed";

/**
 * Persistent 3-step onboarding checklist.
 * Progress + dismissal stored in localStorage — no DB change required.
 * Honest: real routes only; no fake "done" states — the user marks each step
 * themselves after they have actually completed it.
 */
export function Onboarding() {
  const [dismissed, setDismissed] = useState(false);
  const [completed, setCompleted] = useState<Set<StepId>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on mount (avoids SSR mismatch).
  useEffect(() => {
    const wasDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    const stored = localStorage.getItem(COMPLETED_KEY);
    const completedSteps: StepId[] = stored ? JSON.parse(stored) : [];
    // Post-mount hydration from localStorage: setState in the effect is the
    // correct pattern here (matches Loader.tsx) — SSR renders the empty default,
    // the client reconciles once after mount. Not a cascading-render smell.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(wasDismissed);
    setCompleted(new Set(completedSteps));
    setMounted(true);
  }, []);

  function toggleStep(id: StepId) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem(COMPLETED_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  function dismiss() {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  }

  // Don't render until hydrated to prevent flicker.
  if (!mounted || dismissed) return null;

  const allDone = STEPS.every((s) => completed.has(s.id));

  return (
    <section className={styles.checklist} aria-label="Getting started checklist">
      <div className={styles.checklistHeader}>
        <h2 className={styles.checklistTitle}>Getting started</h2>
        <button
          className={styles.dismissBtn}
          onClick={dismiss}
          aria-label="Dismiss getting started checklist"
        >
          {allDone ? "All done — dismiss" : "Dismiss"}
        </button>
      </div>

      <ol className={styles.steps} role="list">
        {STEPS.map((step) => {
          const done = completed.has(step.id);
          return (
            <li key={step.id} className={`${styles.step} ${done ? styles.stepDone : ""}`}>
              <button
                className={styles.checkBtn}
                onClick={() => toggleStep(step.id)}
                aria-pressed={done}
                aria-label={done ? `Mark "${step.label}" as not done` : `Mark "${step.label}" as done`}
              >
                <span className={styles.checkIcon} aria-hidden="true">
                  {done ? "✓" : step.number}
                </span>
              </button>

              <div className={styles.stepBody}>
                <span className={styles.stepLabel}>{step.label}</span>
                <span className={styles.stepDesc}>{step.description}</span>
              </div>

              <Link
                href={step.actionHref}
                className={styles.stepAction}
                aria-label={`${step.actionLabel} — ${step.label}`}
              >
                {step.actionLabel} →
              </Link>
            </li>
          );
        })}
      </ol>

      {allDone && (
        <p className={styles.allDoneNote} role="status">
          All three steps ticked — you&apos;re set. Dismiss when ready.
        </p>
      )}
    </section>
  );
}
