"use client";

import { useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal/LoginModal";
import styles from "./Hud.module.css";

/**
 * Small "log in" button rendered inside HudTop.
 * Opens LoginModal inline; falls back to /login for no-JS.
 */
export function HudLoginTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <a
        href="/login"
        className={styles.loginTrigger}
        aria-label="Open sign-in dialog"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        Log in
      </a>

      {open && (
        <LoginModal next="/dashboard" onClose={() => setOpen(false)} />
      )}
    </>
  );
}
