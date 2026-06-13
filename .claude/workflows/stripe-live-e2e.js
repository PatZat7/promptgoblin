// Claude Workflow: live Stripe end-to-end per tier.
//
// Per tier (in parallel): runs the deterministic orchestrator
// (web/scripts/e2e/live-e2e.mjs) — $0 Checkout Session via API (100%-off coupon,
// no card) → Playwright completes it → webhook provisions → asserts plan→tier →
// mints a magic link → Playwright logs in → asserts the dashboard tier badge →
// tears everything down. Then a second agent confirms the REAL welcome email
// landed in Gmail (the orchestrator can't see the inbox).
//
// Invoke:  Workflow({ name: "stripe-live-e2e" })
//   or a subset:  Workflow({ name: "stripe-live-e2e", args: { tiers: ["watch","scout"] } })
//
// Prereqs (all already set up): live links payment_method_collection=if_required;
// live 100%-off coupon 2gX7MsjX; Doppler prd (STRIPE_LIVE_SECRET_KEY) + dev
// (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY); Playwright chromium installed.
export const meta = {
  name: "stripe-live-e2e",
  description: "Live Stripe $0 e2e per tier: checkout → provision → real email → login → cleanup",
  phases: [
    { title: "E2E per tier", detail: "orchestrator + Gmail email-arrival check" },
    { title: "Report", detail: "green/red per tier" },
  ],
};

const TIERS = (args && Array.isArray(args.tiers) && args.tiers.length)
  ? args.tiers
  : ["watch", "scout", "warband", "warlord"];

const E2E_SCHEMA = {
  type: "object",
  additionalProperties: true,
  properties: {
    tier: { type: "string" },
    ok: { type: "boolean" },
    steps: { type: "object", additionalProperties: true },
    error: { type: ["string", "null"] },
  },
  required: ["tier", "ok"],
};
const EMAIL_SCHEMA = {
  type: "object",
  additionalProperties: true,
  properties: {
    tier: { type: "string" },
    emailFound: { type: "boolean" },
    subject: { type: ["string", "null"] },
  },
  required: ["tier", "emailFound"],
};

phase("E2E per tier");
const rows = await pipeline(
  TIERS,
  // Stage 1 — run the orchestrator for this one tier (it self-cleans).
  (tier) =>
    agent(
      `Run the live Stripe end-to-end for the "${tier}" tier ONLY, then report the parsed result.\n` +
        `From the repo root C:/Users/atpat/Documents/promptgoblin run EXACTLY (it self-cleans afterward):\n` +
        "```\n" +
        `SB_URL=$(doppler secrets get SUPABASE_URL -p prompt-goblin -c dev --plain); ` +
        `SB_KEY=$(doppler secrets get SUPABASE_SERVICE_ROLE_KEY -p prompt-goblin -c dev --plain); ` +
        `doppler run -c prd -- bash -c 'cd web && STRIPE_KEY="$STRIPE_LIVE_SECRET_KEY" SUPABASE_URL="'"$SB_URL"'" SUPABASE_SERVICE_ROLE_KEY="'"$SB_KEY"'" COUPON_ID=2gX7MsjX TIERS=${tier} node scripts/e2e/live-e2e.mjs'\n` +
        "```\n" +
        `The script prints a JSON object whose results[0] holds the outcome. Return ` +
        `{ tier:"${tier}", ok: results[0].ok, steps: results[0].steps, error: results[0].error }.`,
      { label: `e2e:${tier}`, phase: "E2E per tier", schema: E2E_SCHEMA },
    ),
  // Stage 2 — confirm the REAL welcome email arrived (Gmail), independent of cleanup.
  (res, tier) =>
    agent(
      `Use the Gmail search_threads tool to confirm a welcome email just arrived for the ${tier} tier.\n` +
        `Query: deliveredto:atpatzat+qa${tier}@gmail.com newer_than:1h subject:"dashboard is ready"\n` +
        `Return { tier:"${tier}", emailFound: (>=1 matching thread), subject: <the subject or null> }.`,
      { label: `email:${tier}`, phase: "E2E per tier", schema: EMAIL_SCHEMA },
    ).then((em) => ({ ...res, emailFound: em.emailFound, subject: em.subject })),
);

phase("Report");
const line = (r) =>
  `${r.ok && r.emailFound ? "✅" : "❌"} ${r.tier}: e2e=${r.ok} email=${r.emailFound} ${JSON.stringify(r.steps || {})}${r.error ? " err=" + r.error : ""}`;
const report = rows.map(line).join("\n");
log(report);
return { allPass: rows.every((r) => r.ok && r.emailFound), rows };
