import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardNav } from "./DashboardNav";
import { createServerSupabase } from "@/lib/supabase/server";
import { getDashboardSeat } from "@/lib/dashboard-seat";
import styles from "./dashboard-layout.module.css";

export const metadata: Metadata = {
  title: "Dashboard · Prompt Goblin",
  robots: { index: false, follow: false },
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const seat = await getDashboardSeat();

  return (
    <div className={styles.shell}>
      <DashboardNav
        userEmail={user.email ?? null}
        seatLabel={seat?.seatLabel ?? null}
        canReview={seat?.canReview ?? false}
      />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
