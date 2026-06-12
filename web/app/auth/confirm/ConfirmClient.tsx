"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

type ConfirmClientProps = {
  tokenHash: string | null;
  type: string | null;
};

export function ConfirmClient({ tokenHash, type }: ConfirmClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!tokenHash || type !== "magiclink") {
      setError("Invalid or expired link. Please request a new sign-in link.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/auth/confirm/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_hash: tokenHash, type }),
      });

      const data = (await response.json()) as {
        error?: string;
        redirect?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Sign-in failed.");
      }

      router.push(data.redirect || "/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sign-in failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!tokenHash || type !== "magiclink") {
    return (
      <div className={styles.confirmContainer}>
        <h1>Invalid Link</h1>
        <p>This sign-in link is invalid or has expired.</p>
        <Link href="/login" className={styles.button}>
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.confirmContainer}>
      <h1>Sign in to Prompt Goblin</h1>
      <p>
        Click the button below to complete your sign-in. This protects against
        email scanners that pre-fetch links.
      </p>

      <div
        className={styles.error}
        role="alert"
        aria-live="assertive"
        hidden={!error}
      >
        {error}
      </div>

      <button
        onClick={handleConfirm}
        disabled={loading}
        className={`${styles.button} ${styles.primary}`}
        aria-busy={loading}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className={styles.muted}>
        If the button does not work, the link may have expired.{" "}
        <Link href="/login">Request a new sign-in link</Link>.
      </p>
    </div>
  );
}
