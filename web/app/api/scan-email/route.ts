import "server-only";

import { NextResponse } from "next/server";
import { STRIPE_LINKS } from "@/components/sections/Pricing/pricing.data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Shape of an incoming scan-email request. */
type ScanEmailBody = {
  domain?: unknown;
  email?: unknown;
  report?: unknown;
};

/** The exact shape callers receive. */
type ScanEmailResult =
  | { ok: true }
  | { ok: false; delivered: false; reason: string };

function jsonResult(data: ScanEmailResult, status = 200) {
  return NextResponse.json(data, { status });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

function normalizeDomain(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim().toLowerCase();
  if (!raw) return null;
  let hostname = raw;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    hostname = url.hostname;
  } catch {
    hostname = raw.split("/")[0] ?? "";
  }
  hostname = hostname.replace(/^www\./, "").replace(/\.$/, "");
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(hostname)) return null;
  return hostname;
}

/**
 * Render the scan-result email HTML.
 * Based on the branded TABLE layout in email-templates/scan-report.html.
 * Inline styles for Gmail/Outlook/Apple Mail compatibility.
 */
function renderScanEmail(domain: string, reportJson: string): string {
  // Funnel target: the $99 Goblin Watch checkout once the owner sets the link
  // (web/scripts/create-watch-product.mjs), else the pricing section.
  const watchLink = STRIPE_LINKS.watch || "https://promptgoblin.io/#pricing";
  // Parse the report for score/findings — degrade gracefully if absent.
  let score: number | null = null;
  let highN = 0;
  let medN = 0;
  let lowN = 0;
  let findingLines = "";

  try {
    const r = JSON.parse(reportJson) as {
      hygieneScore?: number;
      findings?: { severity?: number; detail?: string }[];
    };
    score = typeof r.hygieneScore === "number" ? r.hygieneScore : null;
    const findings = Array.isArray(r.findings) ? r.findings : [];
    highN = findings.filter((f) => (f.severity ?? 0) >= 4).length;
    medN = findings.filter((f) => f.severity === 3).length;
    lowN = findings.filter((f) => f.severity != null && f.severity <= 2).length;
    findingLines = findings
      .slice(0, 5)
      .map((f) => `&bull; ${escapeHtml(f.detail || "finding")}`)
      .join("<br />");
  } catch {
    // unparseable report — send without score detail
  }

  const safeDomain = escapeHtml(domain);
  const scoreDisplay = score !== null ? String(score) : "—";
  const findingsSection =
    findingLines
      ? `<tr>
            <td style="padding:0 28px 6px 28px; font-family:'JetBrains Mono',Consolas,Menlo,monospace; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#a3e635;">
              What we found
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 22px 28px; font-family:'JetBrains Mono',Consolas,Menlo,monospace; font-size:13px; line-height:1.7; color:#cfcfc4;">
              ${findingLines}
            </td>
          </tr>`
      : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <title>Your Prompt Goblin scan — ${safeDomain}</title>
</head>
<body style="margin:0; padding:0; background-color:#0a0b09;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">Your free hygiene scan for ${safeDomain}. Hygiene score, findings, and what to fix — reviewed by a real engineer.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0b09" style="background-color:#0a0b09;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#111310; border:1px solid #2a2d26;">
          <tr>
            <td style="padding:26px 28px 18px 28px; border-bottom:1px solid #2a2d26;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:12px;" valign="middle">
                    <img src="https://promptgoblin.io/email-logo.png" width="48" height="48" alt="Prompt Goblin" style="display:block; width:48px; height:48px; border:0; background-color:transparent;" />
                  </td>
                  <td valign="middle">
                    <div style="font-family:'JetBrains Mono',Consolas,Menlo,monospace; font-size:15px; font-weight:700; letter-spacing:0.04em; color:#e9e7dc;">Prompt&nbsp;Goblin</div>
                    <div style="font-family:'JetBrains Mono',Consolas,Menlo,monospace; font-size:11px; color:#a3e635; margin-top:3px;">Get found by robots. Stay usable by humans.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 28px 6px 28px; font-family:'JetBrains Mono',Consolas,Menlo,monospace; color:#e9e7dc; font-size:15px; line-height:1.6;">
              Here&rsquo;s the free scan you requested on <span style="color:#a3e635;">${safeDomain}</span>.
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 22px 28px; font-family:'JetBrains Mono',Consolas,Menlo,monospace; color:#a8a89c; font-size:13px; line-height:1.65;">
              This is the live hygiene result from the scan you just ran &mdash; reviewed, not auto-generated. Here&rsquo;s where you stand.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 22px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #2a2d26; background-color:#0d0f0c;">
                <tr>
                  <td style="padding:20px 22px;" valign="middle">
                    <span style="font-family:'JetBrains Mono',Consolas,Menlo,monospace; font-size:44px; font-weight:700; color:#a3e635; line-height:1;">${scoreDisplay}</span>
                    <span style="font-family:'JetBrains Mono',Consolas,Menlo,monospace; font-size:16px; color:#a8a89c;">/100</span>
                    <div style="font-family:'JetBrains Mono',Consolas,Menlo,monospace; font-size:12px; color:#a8a89c; margin-top:8px;">
                      hygiene score &middot; ${highN} high &middot; ${medN} medium &middot; ${lowN} low
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${findingsSection}
          <tr>
            <td style="padding:0 28px 14px 28px; font-family:'JetBrains Mono',Consolas,Menlo,monospace; color:#cfcfc4; font-size:13px; line-height:1.65;">
              Want our developer-vetted agentic pipeline running every week — tech-stack-specific fix code, branded content assets, sitemap updates, backlink targets, and exactly <strong style="color:#e9e7dc;">where to post them</strong>? See your citation delta every week. That&rsquo;s <span style="color:#a3e635;">Goblin Watch</span>.
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 26px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:transparent; border:2px solid #a7ee39;">
                    <a href="${watchLink}" style="display:inline-block; padding:13px 22px; font-family:'JetBrains Mono',Consolas,Menlo,monospace; font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#a7ee39; text-decoration:none;">
                      Start Goblin Watch &middot; $99/mo &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <div style="margin-top:12px; font-family:'JetBrains Mono',Consolas,Menlo,monospace; font-size:12px; color:#8f8f84;">
                or <a href="https://promptgoblin.io/#pricing" style="color:#a3e635; text-decoration:none;">see all tiers &rarr;</a> &mdash; done-for-you fixes start at Scout.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px; border-top:1px solid #2a2d26; font-family:'JetBrains Mono',Consolas,Menlo,monospace; font-size:12px; line-height:1.65; color:#8f8f84;">
              This is a real hygiene result, not an automated PDF. Hygiene is table stakes, not a citation guarantee &mdash; nobody can honestly promise a citation number. The full multi-engine citation audit plus SEO and accessibility ships with a paid Scout. The refund covers the work, never a number.
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px 28px; border-top:1px solid #2a2d26; font-family:'JetBrains Mono',Consolas,Menlo,monospace; font-size:11px; line-height:1.7; color:#6f6f66;">
              Prompt Goblin &middot; Chicago, IL<br />
              <a href="https://promptgoblin.io" style="color:#a3e635; text-decoration:none;">promptgoblin.io</a>
              &nbsp;&middot;&nbsp;
              <a href="mailto:goblins@promptgoblin.io" style="color:#a3e635; text-decoration:none;">goblins@promptgoblin.io</a>
              <br /><br />
              You&rsquo;re getting this because you asked for a free scan at promptgoblin.io. Reply &ldquo;stop&rdquo; and a goblin won&rsquo;t email you again.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request) {
  let body: ScanEmailBody;
  try {
    body = (await request.json()) as ScanEmailBody;
  } catch {
    return jsonResult({ ok: false, delivered: false, reason: "invalid-json" }, 400);
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return jsonResult({ ok: false, delivered: false, reason: "invalid-email" }, 400);
  }

  const domain = normalizeDomain(body.domain);
  if (!domain) {
    return jsonResult({ ok: false, delivered: false, reason: "invalid-domain" }, 400);
  }

  // Accept any JSON-serialisable report; fall back to empty object string.
  const reportJson =
    body.report != null ? JSON.stringify(body.report) : "{}";

  const resendKey = process.env.RESEND_API_KEY;
  // Honest degraded path: key absent — acknowledge without claiming a send.
  if (!resendKey) {
    return jsonResult({ ok: false, delivered: false, reason: "mailer-not-configured" });
  }

  const from =
    process.env.RESEND_FROM_EMAIL ??
    "Prompt Goblin <goblins@promptgoblin.io>";

  const html = renderScanEmail(domain, reportJson);

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Your Prompt Goblin scan — ${domain}`,
        html,
      }),
    });
  } catch {
    return jsonResult({ ok: false, delivered: false, reason: "mailer-network-error" });
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    console.error(
      `[scan-email] Resend ${response.status}: ${bodyText.slice(0, 400)}`,
    );
    return jsonResult({
      ok: false,
      delivered: false,
      reason: `mailer-error-${response.status}`,
    });
  }

  return jsonResult({ ok: true });
}
