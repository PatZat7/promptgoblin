"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuthForm } from "@/lib/useAuthForm";
import styles from "./LoginModal.module.css";

type LoginModalProps = {
  /** Route to redirect after auth. Defaults to /dashboard. */
  next?: string;
  /** Called when the modal should close (ESC key, backdrop click, or X button). */
  onClose: () => void;
};

/**
 * Inline modal login dialog — reuses magic-link + Google OAuth via useAuthForm.
 * Falls back to /login (hard-navigated full-page) for no-JS environments.
 *
 * A11y: role="dialog" + aria-modal, focus trap, ESC to close, restores focus.
 */
export function LoginModal({ next = "/dashboard", onClose }: LoginModalProps) {
  const triggerRef = useRef<Element | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  const { email, setEmail, status, errorMsg, sendMagicLink, startGoogleOAuth, reset } =
    useAuthForm({ next });

  // Capture the element that opened the modal so focus can be restored on close.
  useEffect(() => {
    triggerRef.current = document.activeElement;
  }, []);

  // Restore focus when modal unmounts.
  useEffect(() => {
    return () => {
      if (triggerRef.current && "focus" in triggerRef.current) {
        (triggerRef.current as HTMLElement).focus();
      }
    };
  }, []);

  // Focus the first interactive element when modal mounts.
  useEffect(() => {
    firstFocusRef.current?.focus();
  }, []);

  // ESC key closes.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  // Focus trap — keep Tab/Shift+Tab inside the dialog.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    []
  );

  return (
    /* Backdrop */
    <div
      className={styles.backdrop}
      onClick={onClose}
      aria-hidden="true"
    >
      {/* Dialog panel — stop propagation so clicking inside doesn't dismiss */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header row */}
        <div className={styles.header}>
          <Link href="/" className={styles.wordmark} aria-label="Prompt Goblin home">
            PROMPT_GOBLIN™
          </Link>
          <button
            ref={firstFocusRef}
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close sign-in dialog"
          >
            ✕
          </button>
        </div>

        <h2 id="login-modal-title" className={styles.title}>
          Client dashboard
        </h2>
        <p className={styles.subtitle}>
          Enter your email to receive a sign-in link, or continue with Google.
        </p>

        {/* Auth form body */}
        <div className={styles.formWrap}>
          {errorMsg && (
            <p className={styles.errorBanner} role="alert">
              {errorMsg}
            </p>
          )}

          {status === "sent" ? (
            <div className={styles.sentState} role="status">
              <p>
                <strong>Check your email.</strong> We sent a sign-in link to{" "}
                <span className={styles.emailHighlight}>{email}</span>.
              </p>
              <p className={styles.hint}>
                Didn&apos;t arrive? Check spam, or{" "}
                <button className={styles.resendBtn} onClick={reset}>
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={sendMagicLink} className={styles.form} noValidate>
                <label htmlFor="modal-email" className={styles.label}>
                  Email address
                </label>
                <input
                  id="modal-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "sending"}
                  className={styles.input}
                />
                <button
                  type="submit"
                  disabled={status === "sending" || !email.trim()}
                  className={styles.primaryBtn}
                >
                  {status === "sending" ? "Sending…" : "Send sign-in link"}
                </button>
              </form>

              <div className={styles.divider} aria-hidden="true">
                <span>or</span>
              </div>

              <button
                type="button"
                onClick={startGoogleOAuth}
                className={styles.googleBtn}
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.151 17.64 11.892 17.64 9.2z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>

        {/* No-JS fallback hint */}
        <p className={styles.fallbackHint}>
          Prefer the full page?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className={styles.fallbackLink}>
            Open /login
          </Link>
        </p>
      </div>
    </div>
  );
}
