"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * PostHog init — runs in an effect (after hydration) so PostHog's script
 * injection never collides with React 19's script hoisting. Exposes
 * window.posthog for the lib/analytics.ts funnel shim. The phc_ key is a
 * public write-only ingestion key; override via NEXT_PUBLIC_POSTHOG_KEY.
 */
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_wEFRJvqR2u6Y2a9TmtHkTZvpAeSjjnMuFSCAYyaru5Sy";

export const Analytics = () => {
  useEffect(() => {
    if (!KEY || KEY.includes("REPLACE")) return;
    const w = window as unknown as { posthog?: typeof posthog };
    if (w.posthog) return; // guard StrictMode double-invoke

    posthog.init(KEY, {
      api_host: "https://us.i.posthog.com",
      person_profiles: "identified_only",
      defaults: "2025-05-24",
    });
    w.posthog = posthog;

    // Owner opt-out: ?ph_optout=1 keeps dev/QA traffic out of the funnel; ?ph_optin=1 re-enables.
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("ph_optout") === "1") posthog.opt_out_capturing();
      else if (params.get("ph_optin") === "1") posthog.opt_in_capturing();
    } catch {
      /* storage unavailable — non-fatal */
    }
  }, []);

  return null;
};
