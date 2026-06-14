"use client";

import { useState } from "react";
import styles from "./crm.module.css";

type CopyButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  disabled?: boolean;
};

/** Copy-to-clipboard button using the global dot-shimmer hover treatment. */
export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  disabled,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
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
      disabled={disabled || !text}
      className={`${styles.btn} dot-shimmer`}
      aria-label={copied ? copiedLabel : `${label} to clipboard`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
