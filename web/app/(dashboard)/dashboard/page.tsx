import { RunScanForm } from "@/components/dashboard/RunScanForm";
import { Onboarding } from "@/components/dashboard/Onboarding/Onboarding";
import { getDashboardSeat } from "@/lib/dashboard-seat";

export default async function DashboardClientPage() {
  const seat = await getDashboardSeat();
  const canRunScans = seat?.canRunScans ?? false;
  const domain = seat?.clientDomain ?? "promptgoblin.io";

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Dashboard</h1>
      <p style={{ color: "#888", marginTop: 6 }}>
        Run a scan, track visibility, and manage citation targets.
      </p>

      {/* Onboarding checklist — dismissed via localStorage, no DB write */}
      <section style={{ marginTop: 20 }}>
        <Onboarding />
      </section>

      <section style={{ marginTop: 20 }}>
        <RunScanForm
          defaultDomain={domain}
          canRunScans={canRunScans}
        />
      </section>
    </div>
  );
}
