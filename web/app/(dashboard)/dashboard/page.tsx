"use client";

import { useState } from "react";
import { RunScanForm } from "@/components/dashboard/RunScanForm";

export default function DashboardClientPage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Dashboard</h1>
      <p style={{ color: "#888", marginTop: 6 }}>
        Run a scan, track visibility, and manage citation targets.
      </p>

      <section style={{ marginTop: 20 }}>
        <RunScanForm />
      </section>
    </div>
  );
}
