import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import styles from "./Login.module.css";

export const metadata: Metadata = {
  title: "Sign in · Prompt Goblin",
  description: "Sign in to your Prompt Goblin dashboard.",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  // Defense-in-depth: check auth server-side and redirect if already signed in.
  // Middleware handles this first, but we check again here as a second gate.
  try {
    const { createServerSupabase } = await import("@/lib/supabase/server");
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/dashboard");
    }
  } catch {
    // Supabase env not configured yet — show the login form anyway
    // (it will display an auth error when the user tries to submit)
  }

  const params = await searchParams;
  const next = params.next ?? "/dashboard";
  const errorCode = params.error;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <Link href="/" className={styles.wordmark} aria-label="Prompt Goblin home">
            PROMPT_GOBLIN™
          </Link>
          <h1 className={styles.title}>Client dashboard</h1>
          <p className={styles.subtitle}>
            Enter your email to receive a sign-in link, or continue with Google.
          </p>
        </header>

        <LoginForm next={next} errorCode={errorCode} />
      </div>
    </div>
  );
};

export default LoginPage;
