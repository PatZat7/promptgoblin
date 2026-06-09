"use client";

import { useState } from "react";

const SAMPLE_SUGGESTIONS = [
  "AEO agency Chicago",
  "AI overview SEO",
  "ChatGPT citation strategy",
  "technical SEO for generative AI",
  "AI search visibility",
  "Bing ranking for SaaS",
];

export function SuggestedTargets({ onPick }: { onPick: (t: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        className="button secondary"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? "Hide" : "Suggest"} citation targets
      </button>
      {expanded ? (
        <ul
          style={{
            marginTop: 10,
            padding: 0,
            listStyle: "none",
            display: "grid",
            gap: 6,
          }}
        >
          {SAMPLE_SUGGESTIONS.map((s) => (
            <li key={s}>
              <button type="button" className="button ghost" onClick={() => onPick(s)}>
                + {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
