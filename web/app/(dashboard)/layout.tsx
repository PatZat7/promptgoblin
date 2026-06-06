import { redirect } from "next/navigation";
import styles from "./dashboard-layout.module.css";
import { DashboardNav } from "./DashboardNav";

/**
 * Authenticated dashboard shell — wraps /dashboard, /runs, /runs/[runId],
 * /runs/[runId]/fixes.
 *
 * Server Component: re-checks auth server-side as defense-in-depth
 * (middleware is the first gate; this is the second).
 */
const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  let userEmail: string | null = null;

  try {
    const { createServerSupabase } = await import("@/lib/supabase/server");
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }
    userEmail = user.email ?? null;
  } catch {
    // Supabase env not configured — redirect to login rather than show a
    // broken dashboard
    redirect("/login");
  }

  return (
    <div className={styles.shell}>
      <DashboardNav userEmail={userEmail} />
      <main className={styles.main}>{children}</main>
    </div>
  );
};

export default DashboardLayout;
