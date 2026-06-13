"use client";

import { useEffect, useState } from "react";
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
  const [isDemoRequest, setIsDemoRequest] = useState(false);
  const [err, setErr] = useState("");
  // Start false so server HTML and the client's first render match, then flip
  // to checked after mount if the URL carries ?demo=1 (the "Book a demo" entry
  // point). A mount effect is the hydration-safe way to read the URL here.
  const [demoChecked, setDemoChecked] = useState(false);
  useEffect(() => {
    // One-time client-only read of the ?demo=1 entry point. Server + first client
    // render are both false (no hydration mismatch); we flip after mount.
    if (new URLSearchParams(window.location.search).get("demo") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDemoChecked(true);
    }
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    const data = Object.fromEntries(
      new FormData(e.currentTarget).entries(),
    ) as Record<string, string>;
    if (data.botcheck) return;
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
      has_demo_request: Boolean(data.demo),
    });
    captureEvent("lead_recommendation_context", {
      domain: leadDomain(data),
      source_event: "summon_submitted",
      requested_surface: data.target || "",
    });
    setSending(true);
    const demoRequested = Boolean(data.demo);
    const ok = await submitWeb3Form(
      `New goblin summon ✦ ${data.domain || ""}${demoRequested ? " [DEMO REQUEST]" : ""}`,
      data,
    );
    if (ok) {
      setIsDemoRequest(demoRequested);
      setSent(true);
    } else {
      setErr(
        "A goblin fumbled that send. Try again, or email goblins@promptgoblin.io and we'll run it by hand.",
      );
    }
    setSending(false);
  };

  if (sent) {
    if (isDemoRequest) {
      return (
        <div className={styles.success}>
          <div className={styles.successMark}>✓</div>
          <div>
            <div className={styles.successTitle}>
              the goblin council has convened.
            </div>
            <div className={styles.successDesc}>
              We&apos;ll reach out within one working day to schedule your demo.
              Cloak status: COMPROMISED.
            </div>
            <button
              type="button"
              className={styles.again}
              data-cursor="./again"
              onClick={() => {
                setErr("");
                setSent(false);
                setIsDemoRequest(false);
              }}
            >
              ↺ summon another
            </button>
          </div>
        </div>
      );
    }
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
              setIsDemoRequest(false);
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
          <span className={styles.fieldLabel}>$ name</span>
          <input
            name="name"
            placeholder="company or your name"
            autoComplete="organization"
            data-cursor="./type"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>$ email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="your email"
            autoComplete="email"
            data-cursor="./type"
          />
        </label>
      </div>
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
        <span className={styles.fieldLabel}>$ get_cited_for</span>
        <input
          name="target"
          placeholder={'e.g. "best fleet software"'}
          data-cursor="./type"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>$ questions</span>
        <textarea
          name="questions"
          placeholder="anything you want to ask the goblin council"
          rows={3}
          data-cursor="./type"
          style={{ resize: "vertical" }}
        />
      </label>
      <label className={styles.fieldInline}>
        <input
          type="checkbox"
          name="demo"
          value="1"
          checked={demoChecked}
          onChange={(e) => setDemoChecked(e.target.checked)}
          data-cursor="./check"
        />
        <span className={styles.fieldLabel}>request a demo</span>
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
