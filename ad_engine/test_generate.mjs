#!/usr/bin/env node
/**
 * Offline test for the Prompt Goblin ad-copy generator.
 * Zero network: asserts prompt assembly from brand.json and the injected-fetch
 * model path. Run: node test_generate.mjs
 */

import assert from "node:assert/strict";
import {
  loadBrand,
  parseArgs,
  resolveChannel,
  assemblePrompt,
  generateCopy,
} from "./generate.mjs";

let passed = 0;
const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

/* ------------------------------ brand.json ------------------------------- */

test("brand.json loads and carries REAL extracted values", async () => {
  const b = await loadBrand();
  assert.equal(b.brand.name, "Prompt Goblin");
  assert.equal(b.brand.wordmark, "Prompt_Goblin™");
  // Real palette hexes from styles.css :root.
  assert.equal(b.palette.core.bg, "#0A0B0A");
  assert.equal(b.palette.accents.lime, "#A3E635");
  assert.equal(b.palette.core.fg, "#E9E7DC");
  // Real fonts from styles.css / colophon.
  const fams = Object.values(b.typography)
    .map((t) => t && t.family)
    .filter(Boolean);
  for (const f of ["Press Start 2P", "VT323", "Silkscreen", "JetBrains Mono"]) {
    assert.ok(fams.includes(f), `typography must include ${f}`);
  }
  // Real tiers + prices from app.jsx.
  const tiers = Object.fromEntries(b.offer.tiers.map((t) => [t.key, t.price]));
  assert.equal(tiers.scout, "2,950");
  assert.equal(tiers.warband, "4,800");
  assert.equal(tiers.warlord, "12,500");
  // Real taglines.
  assert.ok(b.voice.taglines.some((t) => t.includes("Visible AF")));
  assert.ok(
    b.voice.taglines.some((t) =>
      t.startsWith("Get found by robots. Stay usable by humans.")
    )
  );
});

/* ------------------------------ arg parsing ------------------------------ */

test("parseArgs reads channel/angle/flags with gov default", () => {
  const a = parseArgs([
    "--channel", "linkedin",
    "--angle", "508 deadline",
    "--variants", "5",
    "--dry-run",
  ]);
  assert.equal(a.channel, "linkedin");
  assert.equal(a.angle, "508 deadline");
  assert.equal(a.variants, 5);
  assert.equal(a.dryRun, true);
  assert.equal(a.audience, "gov"); // gov-forward default
});

test("parseArgs rejects unknown flags", () => {
  assert.throws(() => parseArgs(["--bogus"]), /Unknown flag/);
});

test("resolveChannel maps aliases and rejects junk", () => {
  assert.equal(resolveChannel("li"), "linkedin");
  assert.equal(resolveChannel("fb"), "meta");
  assert.equal(resolveChannel("search"), "google");
  assert.throws(() => resolveChannel("tiktok"), /Unknown channel/);
});

/* --------------------------- prompt assembly ----------------------------- */

test("assemblePrompt(linkedin) injects brand + channel + guardrails", async () => {
  const b = await loadBrand();
  const p = assemblePrompt(b, {
    channel: "linkedin",
    angle: "Section 508 deadline",
    audience: "gov",
    variants: 3,
  });
  assert.equal(p.channel, "linkedin");
  // System carries the brand identity + honesty stance.
  assert.match(p.system, /Prompt Goblin/);
  assert.match(p.system, /NEVER fabricate/);
  // User prompt carries the angle, channel label, and LinkedIn limits.
  assert.match(p.user, /Section 508 deadline/);
  assert.match(p.user, /LinkedIn Single Image/);
  assert.match(p.user, /headline:.*70/); // sweet-spot constraint surfaced
  assert.match(p.user, /introText:.*150/);
  // Honesty guardrails must be present verbatim-ish.
  assert.match(p.user, /hygiene, not a citation lever/);
  assert.match(p.user, /Nothing auto-deploys/);
  assert.match(p.user, /~57%/);
  // Lexicon nudge.
  assert.match(p.user, /"summon" not "contact"/);
  // Output contract requests JSON.
  assert.match(p.user, /Return ONLY valid JSON/);
  // Paired image spec resolved for the channel.
  assert.ok(p.image && /1200x627/.test(p.image.px));
});

test("assemblePrompt(google) surfaces RSA limits (30/90/15)", async () => {
  const b = await loadBrand();
  const p = assemblePrompt(b, { channel: "google", angle: "AI SEO audit" });
  assert.match(p.user, /Google Responsive Search Ads/);
  assert.match(p.user, /headline:.*30/);
  assert.match(p.user, /description:.*90/);
  assert.match(p.user, /path:.*15/);
  assert.match(p.user, /AI SEO audit/);
});

test("assemblePrompt(meta) surfaces 125/40/25 + CTA list", async () => {
  const b = await loadBrand();
  const p = assemblePrompt(b, { channel: "meta", angle: "free scan" });
  assert.match(p.user, /Meta \(Facebook \/ Instagram\)/);
  assert.match(p.user, /primaryText:.*125/);
  assert.match(p.user, /headline:.*40/);
  assert.match(p.user, /Learn More/);
});

test("assemblePrompt(commercial) swaps the audience pain block", async () => {
  const b = await loadBrand();
  const gov = assemblePrompt(b, { channel: "linkedin", angle: "x", audience: "gov" });
  const com = assemblePrompt(b, { channel: "linkedin", angle: "x", audience: "commercial" });
  assert.match(gov.user, /Section 508 \/ ADA Title II/);
  assert.match(com.user, /Citation-graph diff vs a named rival/);
  assert.notEqual(gov.user, com.user);
});

test("assemblePrompt rejects an unknown channel", async () => {
  const b = await loadBrand();
  assert.throws(
    () => assemblePrompt(b, { channel: "billboard", angle: "x" }),
    /Unknown channel/
  );
});

/* --------------------- model path (stubbed fetch) ------------------------ */

test("generateCopy throws NO_KEY when no apiKey", async () => {
  const p = { system: "s", user: "u" };
  await assert.rejects(() => generateCopy(p, { apiKey: "" }), (e) => e.code === "NO_KEY");
});

test("generateCopy posts to OpenAI and parses JSON (injected fetch, no network)", async () => {
  const b = await loadBrand();
  const p = assemblePrompt(b, { channel: "linkedin", angle: "508 deadline" });

  let captured = null;
  const fakeFetch = async (url, opts) => {
    captured = { url, opts };
    const body = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              variants: [
                {
                  introText: "Invisible to ChatGPT? So is your RFP response.",
                  headline: "Section 508 + AI visibility, human-verified.",
                  description: "Reviewed fixes, not a PDF.",
                  cta: "Request demo",
                },
              ],
            }),
          },
        },
      ],
    };
    return {
      ok: true,
      status: 200,
      json: async () => body,
      text: async () => JSON.stringify(body),
    };
  };

  const out = await generateCopy(p, {
    apiKey: "sk-test-fake",
    model: "gpt-4o-mini",
    fetchImpl: fakeFetch,
  });

  // Hit the right endpoint with auth + JSON response_format.
  assert.equal(captured.url, "https://api.openai.com/v1/chat/completions");
  assert.equal(captured.opts.headers.Authorization, "Bearer sk-test-fake");
  const sent = JSON.parse(captured.opts.body);
  assert.equal(sent.model, "gpt-4o-mini");
  assert.equal(sent.response_format.type, "json_object");
  assert.equal(sent.messages[0].role, "system");
  assert.equal(sent.messages[1].role, "user");
  // Parsed the model's JSON.
  assert.ok(Array.isArray(out.variants));
  assert.match(out.variants[0].introText, /ChatGPT/);
});

test("generateCopy surfaces a non-200 as an error (injected fetch)", async () => {
  const p = { system: "s", user: "u" };
  const fail = async () => ({
    ok: false,
    status: 429,
    text: async () => "rate limited",
    json: async () => ({}),
  });
  await assert.rejects(
    () => generateCopy(p, { apiKey: "sk-x", fetchImpl: fail }),
    /OpenAI 429/
  );
});

/* -------------------------------- runner --------------------------------- */

const run = async () => {
  for (const { name, fn } of tests) {
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (e) {
      console.error(`  ✕ ${name}`);
      console.error("    " + (e?.message || e));
      process.exitCode = 1;
    }
  }
  const total = tests.length;
  console.log(`\n${passed}/${total} passed`);
  if (passed !== total) process.exitCode = 1;
};

run();
