"use client";

import { useEffect, useRef, useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal/LoginModal";
import { createBrowserSupabase } from "@/lib/supabase/client";
import styles from "./Hud.module.css";

/**
 * Auth-aware HUD trigger.
 * - Logged out (or loading): shows "Log in" → opens LoginModal.
 * - Logged in: shows hamburger (☰) → dropdown with Dashboard + Sign out.
 * Defaults to logged-out UI to avoid hydration flash.
 */
export function HudLoginTrigger() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Check auth state client-side only (avoids SSR/hydration mismatch).
  useEffect(() => {
    const supabase = createBrowserSupabase();

    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on Esc or click-outside.
  useEffect(() => {
    if (!menuOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  function handleSignOut() {
    fetch("/auth/signout", { method: "POST" }).finally(() => {
      window.location.href = "/";
    });
  }

  if (!loggedIn) {
    return (
      <>
        <a
          href="/login"
          className={styles.loginTrigger}
          aria-label="Open sign-in dialog"
          onClick={(e) => {
            e.preventDefault();
            setLoginOpen(true);
          }}
        >
          Log in
        </a>
        {loginOpen && (
          <LoginModal next="/dashboard" onClose={() => setLoginOpen(false)} />
        )}
      </>
    );
  }

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button
        ref={triggerRef}
        className={styles.hamburger}
        aria-label="User menu"
        aria-expanded={menuOpen}
        aria-haspopup="true"
        onClick={() => setMenuOpen((v) => !v)}
      >
        ☰
      </button>
      {menuOpen && (
        <div className={styles.dropdown} role="menu">
          <a
            href="/dashboard"
            className={styles.dropdownItem}
            role="menuitem"
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </a>
          <button
            className={styles.dropdownItem}
            role="menuitem"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
