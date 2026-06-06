"use client";

import { useTransition } from "react";
import Link from "next/link";
import styles from "./DashboardNav.module.css";

type DashboardNavProps = {
  userEmail: string | null;
};

export function DashboardNav({ userEmail }: DashboardNavProps) {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await fetch("/auth/signout", { method: "POST" });
      window.location.href = "/login";
    });
  }

  return (
    <nav className={styles.nav} aria-label="Dashboard navigation">
      <div className={styles.left}>
        <Link href="/" className={styles.wordmark} aria-label="Prompt Goblin home">
          PROMPT_GOBLIN™
        </Link>
        <Link href="/dashboard" className={styles.navLink}>
          Dashboard
        </Link>
        <Link href="/runs" className={styles.navLink}>
          Runs
        </Link>
      </div>
      <div className={styles.right}>
        {userEmail && (
          <span className={styles.userEmail} aria-label={`Signed in as ${userEmail}`}>
            {userEmail}
          </span>
        )}
        <button
          className={styles.signOutBtn}
          onClick={handleSignOut}
          disabled={isPending}
          aria-label="Sign out"
        >
          {isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </nav>
  );
}
