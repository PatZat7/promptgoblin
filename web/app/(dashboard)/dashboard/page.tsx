import { RunScanForm } from "@/components/dashboard/RunScanForm";
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

      <section style={{ marginTop: 20 }}>
        <RunScanForm
          defaultDomain={domain}
          canRunScans={canRunScans}
        />
      </section>
    </div>
  );
}
