"use client";

import { useState } from "react";
import styles from "./CopySnippetButton.module.css";

type CopySnippetButtonProps = {
  snippet: string;
};

/**
 * Copy-to-clipboard button — the only client island in FixCard.
 * Rendered ONLY when a fix is unlocked (snippet !== null).
 */
export function CopySnippetButton({ snippet }: CopySnippetButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silent fail
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={styles.btn}
      aria-label={copied ? "Copied to clipboard" : "Copy snippet to clipboard"}
    >
      {copied ? "Copied!" : "Copy snippet"}
    </button>
  );
}
