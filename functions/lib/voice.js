"use strict";

/**
 * Goblin-voiced summaries. Deterministic string assembly — no LLM, no network.
 * Tone: a little feral, honest to a fault. Never claims a citation guarantee.
 */

function tier1Summary(report) {
  const { hygieneScore, schema, crawlability, llmsTxt, findings } = report;
  const high = findings.filter((f) => f.severity >= 4).length;
  const med = findings.filter((f) => f.severity === 3).length;

  const lines = [];
  lines.push(
    `goblin sniffed ${report.url} — hygiene score ${hygieneScore}/100.`
  );

  if (schema.found.length)
    lines.push(`schema found: ${schema.found.join(", ")}.`);
  else lines.push("no structured data at all — engines are reading you blind.");
  if (schema.missing.length)
    lines.push(`missing the table-stakes types: ${schema.missing.join(", ")}.`);

  if (!crawlability.present)
    lines.push("no robots.txt — you left the door unlabeled.");
  else if (crawlability.welcomesAiBots)
    lines.push("robots.txt rolls out the welcome mat for the AI crawlers. good.");
  else lines.push("robots.txt is shooing AI crawlers away. that's a self-inflicted curse.");

  lines.push(
    llmsTxt.present
      ? llmsTxt.valid
        ? "llms.txt present and on-spec."
        : "llms.txt present but off-spec — easy fix."
      : "no llms.txt (emerging hygiene, not a lever — but cheap to add)."
  );

  lines.push(
    `tally: ${high} high-severity gap(s), ${med} medium. ${
      high + med === 0
        ? "hygiene is tight."
        : "all fixable, none of it auto-shipped."
    }`
  );

  lines.push(
    "straight talk: this is HYGIENE, not a citation guarantee. what actually " +
      "moves AI-answer visibility is brand mentions + Bing ranking, measured " +
      "over a weekly re-run loop. want the live citation gap? that's the gated scan."
  );

  return lines.join(" ");
}

function tier2Summary({ domain, competitor, results, configured }) {
  if (!configured) {
    return (
      `goblin's LLM lantern is unlit (no PERPLEXITY_API_KEY configured). ` +
      `the hygiene scan above is real; the live citation teaser needs the key set. ` +
      `no fabricated results here — that's the whole point.`
    );
  }
  const lines = [];
  const youCited = results.filter((r) => r.clientCited).length;
  const compCited = results.filter((r) => r.competitorCited).length;
  lines.push(
    `live Perplexity check across ${results.length} high-intent quer${
      results.length === 1 ? "y" : "ies"
    } for ${domain} vs ${competitor}.`
  );
  lines.push(
    `${domain} cited on ${youCited}/${results.length}; ${competitor} on ${compCited}/${results.length}.`
  );
  if (compCited > youCited)
    lines.push(
      `${competitor} is eating your lunch on the surfaces that matter. that's the gap we close.`
    );
  else if (youCited > 0)
    lines.push(`you're showing up — now it's about holding and widening the lead.`);
  else
    lines.push(`neither of you owns these surfaces yet — that's an opening.`);
  lines.push(
    "one engine, one competitor, capped queries — a teaser, not the full audit. " +
      "the real product is the weekly re-run loop that measures the fix landing."
  );
  return lines.join(" ");
}

module.exports = { tier1Summary, tier2Summary };
