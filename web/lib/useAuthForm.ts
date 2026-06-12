"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export type AuthFormStatus = "idle" | "sending" | "sent" | "error";

type UseAuthFormOptions = {
  next?: string;
};

/**
 * Shared logic for magic-link + Google OAuth.
 * Used by both LoginForm (full-page /login) and LoginModal (inline island).
 */
export function useAuthForm({ next = "/dashboard" }: UseAuthFormOptions = {}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<AuthFormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function sendMagicLink(e: React.FormEvent) {
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

  async function startGoogleOAuth() {
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

  function reset() {
    setStatus("idle");
    setErrorMsg(null);
  }

  return { email, setEmail, status, errorMsg, sendMagicLink, startGoogleOAuth, reset };
}
