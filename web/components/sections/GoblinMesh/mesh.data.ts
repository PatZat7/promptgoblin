/**
 * Data for the Goblin Graph — the agentic LangGraph workflow we run.
 * `x`/`y` are percentages within the stage; the SVG edges are drawn in a
 * padded 900×480 coordinate space (see nodePosition).
 *
 * Honest-broker copy: 5 real answer engines, engineer-gated review, and a
 * "sample run" framing — no fabricated metrics, no citation promise.
 */

export type MeshNode = {
  id: string;
  x: number;
  y: number;
  label: string;
  value: string;
};

export type MeshEdge = readonly [from: string, to: string];

export type MeshStep = {
  num: string;
  title: string;
  description: string;
};

export const MESH_NODES: MeshNode[] = [
  { id: "intent", x: 4, y: 18, label: "user.intent", value: '"best fleet software"' },
  { id: "llm", x: 30, y: 6, label: "llm.query.expand", value: "GPT · Claude · Gemini · Pplx · AIO" },
  { id: "rag", x: 30, y: 60, label: "rag.retrieve", value: "k=24 sources" },
  { id: "cite", x: 56, y: 36, label: "citation.weave", value: "you vs. 6 competitors" },
  { id: "schema", x: 56, y: 76, label: "audit.schema·seo·a11y", value: "12 gaps · 4 a11y" },
  { id: "fix", x: 82, y: 20, label: "goblin.recommend", value: "12 ranked fixes" },
  { id: "ship", x: 82, y: 64, label: "engineer.review → PR", value: "queued · 3 pending" },
];

export const MESH_EDGES: MeshEdge[] = [
  ["intent", "llm"],
  ["intent", "rag"],
  ["llm", "cite"],
  ["rag", "cite"],
  ["rag", "schema"],
  ["cite", "fix"],
  ["schema", "fix"],
  ["fix", "ship"],
];

export const MESH_STEPS: MeshStep[] = [
  {
    num: "01",
    title: "Listen to prompt surfaces",
    description:
      "Agents sample real buyer queries across ChatGPT, Claude, Gemini, Perplexity, and Google AI Overviews — not just keyword tools.",
  },
  {
    num: "02",
    title: "Retrieve & diff citation graph",
    description:
      "Map who LLMs actually cite for your category, then diff against your domain to expose exactly which sources you're losing to.",
  },
  {
    num: "03",
    title: "Audit: schema · SEO · accessibility",
    description:
      "One pass flags missing entities & structured data, technical-SEO leaks, thin content, AND WCAG 2.1 AA / Section 508 gaps — across real rendered component states, not a single snapshot.",
  },
  {
    num: "04",
    title: "Goblin recommendation engine",
    description:
      "Each gap becomes a ranked, scoped task with impact, effort, and a paste-ready fix prompt a coding agent can act on.",
  },
  {
    num: "05",
    title: "Engineer-reviewed PRs",
    description:
      "A software engineer approves every change before it hits your CMS, schema, or repo. Agentic, but accountable — nothing auto-ships.",
  },
  {
    num: "06",
    title: "Loop on cadence — automatically",
    description:
      "The graph re-runs on a schedule and reports the measured before/after delta. Visibility, citations, SEO, and a11y coverage become a tracked KPI, not a vibe.",
  },
];

/** Padded coordinate space the SVG edges are drawn in. */
export const MESH_VIEW = { width: 900, height: 480, padX: 92, padY: 22 } as const;

/** Percent node position → absolute point in the SVG coordinate space. */
export const nodePosition = (node: MeshNode) => ({
  x: (node.x / 100) * MESH_VIEW.width + MESH_VIEW.padX,
  y: (node.y / 100) * MESH_VIEW.height + MESH_VIEW.padY,
});
