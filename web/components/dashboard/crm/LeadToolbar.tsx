"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LEAD_STATUS_META,
  LEAD_STATUS_ORDER,
  type LeadSort,
  type LeadStatus,
  type LeadView,
} from "@/lib/leads-types";
import styles from "./crm.module.css";

type LeadToolbarProps = {
  status: LeadStatus | "all";
  q: string;
  sort: LeadSort;
  view: LeadView;
  onAdd: () => void;
};

const SORTS: { value: LeadSort; label: string }[] = [
  { value: "recent", label: "Recent activity" },
  { value: "priority", label: "Priority" },
  { value: "score", label: "Hygiene score" },
  { value: "company", label: "Company A–Z" },
];

export function LeadToolbar({ status, q, sort, view, onAdd }: LeadToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mirror an EXTERNAL `q` change (back button, cleared filter) into the input,
  // using React's render-time prop-sync pattern instead of an effect.
  const [lastSyncedQ, setLastSyncedQ] = useState(q);
  if (q !== lastSyncedQ) {
    setLastSyncedQ(q);
    setSearchValue(q);
  }

  function pushParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function onSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ q: value.trim() || null });
    }, 300);
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.search}>
        <label htmlFor="lead-search" className={styles.srOnly}>
          Search leads by company, domain, or contact
        </label>
        <input
          id="lead-search"
          type="search"
          className={styles.field}
          placeholder="Search company, domain, contact…"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <label htmlFor="lead-status" className={styles.srOnly}>
        Filter by status
      </label>
      <select
        id="lead-status"
        className={styles.select}
        value={status}
        onChange={(e) => pushParams({ status: e.target.value === "all" ? null : e.target.value })}
      >
        <option value="all">All statuses</option>
        {LEAD_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_META[s].label}
          </option>
        ))}
      </select>

      <label htmlFor="lead-sort" className={styles.srOnly}>
        Sort leads
      </label>
      <select
        id="lead-sort"
        className={styles.select}
        value={sort}
        onChange={(e) => pushParams({ sort: e.target.value === "recent" ? null : e.target.value })}
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            Sort: {s.label}
          </option>
        ))}
      </select>

      <div className={styles.viewToggle} role="group" aria-label="View mode">
        <button
          type="button"
          className={styles.viewBtn}
          aria-pressed={view === "table"}
          onClick={() => pushParams({ view: null })}
        >
          Table
        </button>
        <button
          type="button"
          className={styles.viewBtn}
          aria-pressed={view === "pipeline"}
          onClick={() => pushParams({ view: "pipeline" })}
        >
          Pipeline
        </button>
      </div>

      <button type="button" className={`${styles.btn} dot-shimmer`} onClick={onAdd}>
        + Add lead
      </button>
    </div>
  );
}
