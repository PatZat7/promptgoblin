"use client";

import { useState } from "react";

type CitationTarget = {
  id: string;
  label: string;
  category: "entity" | "claim" | "feature" | "vertical";
};

export function CitationTargetsInput({
  value,
  onChange,
}: {
  value: CitationTarget[];
  onChange: (v: CitationTarget[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([
      ...value,
      { id: crypto.randomUUID(), label: trimmed, category: "claim" },
    ]);
    setDraft("");
  }

  function remove(id: string) {
    onChange(value.filter((item) => item.id !== id));
  }

  return (
    <div>
      <label className="label" htmlFor="citation-target-input">
        What do you want to be cited for?
      </label>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          id="citation-target-input"
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. best Chicago AEO agency"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="button" onClick={add}>
          Add
        </button>
      </div>

      <ul style={{ marginTop: 12, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
        {value.map((item) => (
          <li
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              border: "1px solid #222",
              padding: "8px 10px",
            }}
          >
            <span>{item.label}</span>
            <button type="button" onClick={() => remove(item.id)}>
              Remove
            </button>
          </li>
        ))}
        {value.length === 0 ? (
          <li style={{ color: "#888" }}>No citation targets yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
