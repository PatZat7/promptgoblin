"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import styles from "./Login.module.css";

type LoginFormProps = {
  /** Destination after successful auth (from ?next= query param) */
  next?: string;
  /** Error code passed from the callback route */
  errorCode?: string;
};

export function LoginForm({ next = "/dashboard", errorCode }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Map callback error codes to user-facing messages
  const callbackError =
    errorCode === "auth_callback_failed"
      ? "The sign-in link expired or was already used. Request a new one below."
      : null;

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);

    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setStatus("error");
        setErrorMsg(error.message);
      } else {
        setStatus("sent");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Unable to send the link — check your connection and try again.");
    }
  }

  async function handleGoogleOAuth() {
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setErrorMsg(error.message);
      }
    } catch {
      setErrorMsg("Unable to start Google sign-in — check your connection.");
    }
  }

  return (
    <div className={styles.formWrap}>
      {(callbackError || errorMsg) && (
        <p className={styles.errorBanner} role="alert">
          {callbackError ?? errorMsg}
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
            <button
              className={styles.resendBtn}
              onClick={() => setStatus("idle")}
            >
              try again
            </button>
            .
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={handleMagicLink} className={styles.form} noValidate>
            <label htmlFor="email" className={styles.label}>
              Email address
            </label>
            <input
              id="email"
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
            onClick={handleGoogleOAuth}
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
  );
}
