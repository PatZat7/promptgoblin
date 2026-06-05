"use client";

import { useState } from "react";
import {
  captureEvent,
  identifyLead,
  leadDomain,
  submitWeb3Form,
} from "@/lib/analytics";
import { STRIPE_LINKS } from "@/components/sections/Pricing/pricing.data";
import { isValidDomain, isValidEmail } from "@/lib/validate";
import styles from "./Contact.module.css";

export const SummonForm = () => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    const data = Object.fromEntries(
      new FormData(e.currentTarget).entries(),
    ) as Record<string, string>;
    if (data.botcheck) return; // honeypot
    if (!isValidDomain(data.domain || "")) {
      setErr("Enter a valid domain, e.g. yourbrand.com (no http://, no path).");
      return;
    }
    if (!isValidEmail(data.email || "")) {
      setErr("Enter a valid email so a goblin can send your scan back.");
      return;
    }
    identifyLead(data);
    captureEvent("summon_submitted", {
      domain: leadDomain(data),
      has_email: Boolean(data.email),
      target: data.target || "",
    });
    captureEvent("lead_recommendation_context", {
      domain: leadDomain(data),
      source_event: "summon_submitted",
      requested_surface: data.target || "",
    });
    setSending(true);
    const ok = await submitWeb3Form(
      `New goblin summon ✦ ${data.domain || ""}`,
      data,
    );
    if (ok) setSent(true);
    else
      setErr(
        "A goblin fumbled that send. Try again, or email goblins@promptgoblin.io and we'll run it by hand.",
      );
    setSending(false);
  };

  if (sent) {
    return (
      <div className={styles.success}>
        <div className={styles.successMark}>✓</div>
        <div>
          <div className={styles.successTitle}>
            summon received. invisibility cloak: BREAKING
          </div>
          <div className={styles.successDesc}>
            A real software engineer replies within a working day with your free
            scan. Check your inbox (and spam, goblins lurk there too).
          </div>
          <button
            type="button"
            className={styles.again}
            data-cursor="./again"
            onClick={() => {
              setErr("");
              setSent(false);
            }}
          >
            ↺ summon another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>$ domain</span>
          <input
            name="domain"
            required
            placeholder="yourbrand.com"
            autoComplete="url"
            data-cursor="./type"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>$ email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="you@brand.com"
            autoComplete="email"
            data-cursor="./type"
          />
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>$ get_cited_for</span>
        <input
          name="target"
          placeholder={'e.g. "best fleet software"'}
          data-cursor="./type"
        />
      </label>
      <input
        type="text"
        name="botcheck"
        className={styles.honeypot}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <div className={styles.actions}>
        <button
          className="btn"
          type="submit"
          disabled={sending}
          data-cursor="./summon"
        >
          {sending ? "casting…" : "run my free scan"}{" "}
          <span className="arr">→</span>
        </button>
        <a
          className="btn ghost"
          href={STRIPE_LINKS.scout}
          data-cursor="./summon"
        >
          summon a goblin
        </a>
      </div>
      {err && <div className={styles.error}>⚠ {err}</div>}
    </form>
  );
};
