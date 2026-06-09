"use client";

import { useState } from "react";
import { CitationTargetsInput } from "@/components/dashboard/CitationTargetsInput";
import { SuggestedTargets } from "@/components/dashboard/SuggestedTargets";

type CitationTarget = {
  id: string;
  label: string;
  category: "entity" | "claim" | "feature" | "vertical";
};

type RunScanFormProps = {
  defaultDomain: string;
  canRunScans: boolean;
};

export function RunScanForm({ defaultDomain, canRunScans }: RunScanFormProps) {
  const [targets, setTargets] = useState<CitationTarget[]>([]);
  const [keyword, setKeyword] = useState("");
  const [mode, setMode] = useState<"live">("live");
  const [status, setStatus] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setStatus("Submitting run...");
    try {
      const res = await fetch("/api/runs", { method: "POST", body: formData });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setStatus("Run queued. It will appear in Runs once the pipeline finishes and the result is approved.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Submit failed.");
    }
  }

  return (
    <form action={submit} style={{ display: "grid", gap: 12 }}>
      {!canRunScans ? (
        <p style={{ color: "#ccc", margin: 0 }}>
          This seat can view reports but cannot launch scans. Ask a Prompt Goblin
          admin to upgrade the seat.
        </p>
      ) : null}

      <div style={{ display: "grid", gap: 6 }}>
        <label className="label" htmlFor="domain">Domain</label>
        <input
          id="domain"
          name="domain"
          className="input"
          defaultValue={defaultDomain}
          required
          disabled={!canRunScans}
        />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label className="label" htmlFor="mode">Mode</label>
        <select
          id="mode"
          name="mode"
          className="input"
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
          disabled={!canRunScans}
        >
          <option value="live">Live</option>
        </select>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label className="label" htmlFor="keyword">Top keyword</label>
        <input
          id="keyword"
          name="keyword"
          className="input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="e.g. AEO Chicago"
          disabled={!canRunScans}
        />
      </div>

      <CitationTargetsInput
        value={targets.map((t) => ({ id: t.id, label: t.label, category: t.category }))}
        onChange={(next) => setTargets(next)}
      />

      <input
        type="hidden"
        name="citation_targets"
        value={targets.map((t) => t.label).join("\n")}
      />

      <SuggestedTargets
        onPick={(label) =>
          setTargets((prev) => [
            ...prev,
            { id: crypto.randomUUID(), label, category: "claim" },
          ])
        }
      />

      <button className="button primary" type="submit" disabled={!canRunScans}>
        Run scan
      </button>

      {status ? <p style={{ color: "#ccc" }}>{status}</p> : null}
    </form>
  );
}
